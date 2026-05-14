import { spawn, execSync } from "child_process";
import path from "path";
import fs from "fs";

export type DeployStatus = "idle" | "running" | "success" | "failed";
export type DeployKind = "deploy" | "rollback";

interface DeployRunPersisted {
  id: string;
  kind: DeployKind;
  status: DeployStatus;
  startedAt: number;
  finishedAt?: number;
  exitCode?: number | null;
  triggeredBy?: number;
  pid?: number | null;
  logFile: string;
  /** Git HEAD captured BEFORE the run started (for rollback safety). */
  commitBefore?: string | null;
  /** Git HEAD captured AFTER the run finished (the new live commit). */
  commitAfter?: string | null;
  /** Short oneline message of the post-run commit. */
  commitMessage?: string | null;
  /** For rollback runs, the SHA we are trying to restore to. */
  targetSha?: string | null;
  skipGitPull?: boolean;
}

export interface DeployHistoryEntry {
  id: string;
  kind: DeployKind;
  status: DeployStatus;
  startedAt: number;
  finishedAt?: number;
  exitCode?: number | null;
  commitBefore?: string | null;
  commitAfter?: string | null;
  commitMessage?: string | null;
  targetSha?: string | null;
}

const LOG_DIR = path.resolve(process.cwd(), "logs", "deploys");
const STATE_FILE = path.join(LOG_DIR, "current.json");
const HISTORY_FILE = path.join(LOG_DIR, "history.json");
const TAIL_BYTES = 64 * 1024;
const MAX_HISTORY = 20;

function ensureLogDir() {
  try { fs.mkdirSync(LOG_DIR, { recursive: true }); } catch {}
}

function readState(): DeployRunPersisted | null {
  try {
    const raw = fs.readFileSync(STATE_FILE, "utf8");
    return JSON.parse(raw);
  } catch { return null; }
}

function writeState(state: DeployRunPersisted) {
  ensureLogDir();
  try { fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2)); } catch {}
}

function readHistory(): DeployHistoryEntry[] {
  try {
    const raw = fs.readFileSync(HISTORY_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function writeHistory(entries: DeployHistoryEntry[]) {
  ensureLogDir();
  try { fs.writeFileSync(HISTORY_FILE, JSON.stringify(entries.slice(0, MAX_HISTORY), null, 2)); } catch {}
}

function recordHistory(state: DeployRunPersisted) {
  // Refresh the post-run commit info now that the run is done.
  const after = readGitHead();
  if (after) {
    state.commitAfter = after.sha;
    state.commitMessage = after.message;
    writeState(state);
  }
  const entry: DeployHistoryEntry = {
    id: state.id,
    kind: state.kind,
    status: state.status,
    startedAt: state.startedAt,
    finishedAt: state.finishedAt,
    exitCode: state.exitCode,
    commitBefore: state.commitBefore || null,
    commitAfter: state.commitAfter || null,
    commitMessage: state.commitMessage || null,
    targetSha: state.targetSha || null,
  };
  const all = readHistory().filter((h) => h.id !== entry.id);
  all.unshift(entry);
  writeHistory(all);
}

function pidAlive(pid: number | null | undefined): boolean {
  if (!pid) return false;
  try { process.kill(pid, 0); return true; } catch { return false; }
}

function tailFile(file: string, bytes = TAIL_BYTES): string[] {
  try {
    const stat = fs.statSync(file);
    const start = Math.max(0, stat.size - bytes);
    const fd = fs.openSync(file, "r");
    const buf = Buffer.alloc(stat.size - start);
    fs.readSync(fd, buf, 0, buf.length, start);
    fs.closeSync(fd);
    const text = buf.toString("utf8");
    const lines = text.split(/\r?\n/);
    if (start > 0 && lines.length > 1) lines.shift();
    return lines.filter((l) => l.length > 0);
  } catch { return []; }
}

/** Read the current git HEAD + short commit message. Best-effort. */
function readGitHead(): { sha: string; message: string } | null {
  try {
    const sha = execSync("git rev-parse HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
    let message = "";
    try {
      message = execSync(`git log -1 --pretty=format:%s ${sha}`, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
    } catch {}
    return sha ? { sha, message } : null;
  } catch { return null; }
}

/** Return true iff the given short or full SHA exists in the repo. */
function isValidSha(sha: string): boolean {
  if (!/^[0-9a-f]{7,40}$/i.test(sha)) return false;
  try {
    execSync(`git cat-file -e ${sha}^{commit}`, { stdio: ["ignore", "ignore", "ignore"] });
    return true;
  } catch { return false; }
}

function reconcile(state: DeployRunPersisted): DeployRunPersisted {
  if (state.status !== "running") return state;
  if (pidAlive(state.pid)) return state;

  const tail = tailFile(state.logFile);
  const last = tail.slice(-5).join("\n");
  const exitMatch = last.match(/\[deploy\] finished with exit code (-?\d+)/);
  if (exitMatch) {
    const code = Number(exitMatch[1]);
    state.status = code === 0 ? "success" : "failed";
    state.exitCode = code;
    state.finishedAt = state.finishedAt || Date.now();
  } else {
    state.status = "failed";
    state.exitCode = state.exitCode ?? -1;
    state.finishedAt = state.finishedAt || Date.now();
  }
  writeState(state);
  recordHistory(state);
  return state;
}

export function isDeployEnabled(): boolean {
  return process.env.DEPLOY_FROM_BROWSER === "1";
}

export function getDeployState() {
  const raw = readState();
  if (!raw) {
    const head = readGitHead();
    return {
      status: "idle" as DeployStatus,
      id: null,
      kind: "deploy" as DeployKind,
      lines: [] as string[],
      currentCommit: head?.sha || null,
      currentCommitMessage: head?.message || null,
    };
  }
  const state = reconcile(raw);
  const lines = tailFile(state.logFile);
  const head = readGitHead();
  return {
    id: state.id,
    kind: state.kind,
    status: state.status,
    startedAt: state.startedAt,
    finishedAt: state.finishedAt,
    exitCode: state.exitCode,
    triggeredBy: state.triggeredBy,
    pid: state.pid,
    commitBefore: state.commitBefore || null,
    commitAfter: state.commitAfter || null,
    commitMessage: state.commitMessage || null,
    targetSha: state.targetSha || null,
    currentCommit: head?.sha || null,
    currentCommitMessage: head?.message || null,
    lines,
  };
}

export function getDeployHistory(): DeployHistoryEntry[] {
  return readHistory();
}

export interface StartDeployOptions {
  skipGitPull?: boolean;
}

function spawnRunner(args: {
  id: string;
  kind: DeployKind;
  scriptPath: string;
  triggeredBy: number;
  extraEnv?: Record<string, string>;
  commitBefore: string | null;
  targetSha?: string | null;
  skipGitPull?: boolean;
}): { ok: true; id: string } | { ok: false; error: string } {
  if (!fs.existsSync(args.scriptPath)) {
    return { ok: false, error: `script not found: ${args.scriptPath}` };
  }
  ensureLogDir();
  const logFile = path.join(LOG_DIR, `${args.kind}-${args.id}.log`);
  const startBanner = `[deploy] starting ${args.kind} at ${new Date().toISOString()} (head ${args.commitBefore || "?"})\n`;
  fs.writeFileSync(logFile, startBanner);
  const logFd = fs.openSync(logFile, "a");

  const wrapper = `bash "${args.scriptPath}" ${args.targetSha ? `"${args.targetSha}"` : ""}; code=$?; echo "[deploy] finished with exit code $code"; exit $code`;
  const childEnv: NodeJS.ProcessEnv = { ...process.env, FORCE_COLOR: "0", ...(args.extraEnv || {}) };
  if (args.skipGitPull) childEnv.SKIP_GIT_PULL = "1";

  const child = spawn("setsid", ["bash", "-c", wrapper], {
    cwd: path.resolve(process.cwd()),
    env: childEnv,
    detached: true,
    stdio: ["ignore", logFd, logFd],
  });
  try { fs.closeSync(logFd); } catch {}
  child.unref();

  const state: DeployRunPersisted = {
    id: args.id,
    kind: args.kind,
    status: "running",
    startedAt: Date.now(),
    triggeredBy: args.triggeredBy,
    pid: child.pid,
    logFile,
    commitBefore: args.commitBefore,
    targetSha: args.targetSha || null,
    skipGitPull: args.skipGitPull,
  };
  writeState(state);

  child.on("exit", (code) => {
    const cur = readState();
    if (!cur || cur.id !== args.id) return;
    cur.status = code === 0 ? "success" : "failed";
    cur.exitCode = code;
    cur.finishedAt = Date.now();
    writeState(cur);
    recordHistory(cur);
  });
  child.on("error", (err) => {
    const cur = readState();
    if (!cur || cur.id !== args.id) return;
    cur.status = "failed";
    cur.exitCode = -1;
    cur.finishedAt = Date.now();
    writeState(cur);
    try { fs.appendFileSync(logFile, `\n[deploy] spawn error: ${err.message}\n`); } catch {}
    recordHistory(cur);
  });

  return { ok: true, id: args.id };
}

export function startDeploy(
  triggeredBy: number,
  opts: StartDeployOptions = {},
): { ok: true; id: string } | { ok: false; error: string } {
  if (!isDeployEnabled()) {
    return { ok: false, error: "Browser deploys are disabled. Set DEPLOY_FROM_BROWSER=1 in the environment to enable." };
  }
  const existing = readState();
  if (existing) {
    const reconciled = reconcile(existing);
    if (reconciled.status === "running" && pidAlive(reconciled.pid)) {
      return { ok: false, error: `A run (id ${reconciled.id}) is already in progress.` };
    }
  }
  const head = readGitHead();
  return spawnRunner({
    id: String(Date.now()),
    kind: "deploy",
    scriptPath: path.resolve(process.cwd(), "scripts", "deploy.sh"),
    triggeredBy,
    commitBefore: head?.sha || null,
    skipGitPull: opts.skipGitPull,
  });
}

export function startRollback(
  triggeredBy: number,
  targetSha: string,
): { ok: true; id: string } | { ok: false; error: string } {
  if (!isDeployEnabled()) {
    return { ok: false, error: "Browser deploys are disabled. Set DEPLOY_FROM_BROWSER=1 in the environment to enable." };
  }
  if (!targetSha || typeof targetSha !== "string") {
    return { ok: false, error: "Missing targetSha." };
  }
  if (!isValidSha(targetSha)) {
    return { ok: false, error: `Refusing to roll back: '${targetSha}' is not a valid commit SHA in this repo.` };
  }
  const head = readGitHead();
  if (head?.sha === targetSha || head?.sha?.startsWith(targetSha)) {
    return { ok: false, error: "Already on this commit — nothing to roll back." };
  }
  const existing = readState();
  if (existing) {
    const reconciled = reconcile(existing);
    if (reconciled.status === "running" && pidAlive(reconciled.pid)) {
      return { ok: false, error: `A run (id ${reconciled.id}) is already in progress.` };
    }
  }
  return spawnRunner({
    id: String(Date.now()),
    kind: "rollback",
    scriptPath: path.resolve(process.cwd(), "scripts", "rollback.sh"),
    triggeredBy,
    commitBefore: head?.sha || null,
    targetSha,
  });
}
