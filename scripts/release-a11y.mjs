#!/usr/bin/env node
// Release-time accessibility gate.
//
// Boots the freshly built production server (dist/index.cjs), waits for it to
// answer on PORT, runs scripts/a11y-check.mjs against it, and tears the
// server down. Exits non-zero if axe reports any critical/serious violations
// so the deploy build fails before shipping.
//
// Usage (invoked automatically from .replit deployment build):
//   node scripts/release-a11y.mjs
//
// Env:
//   PORT (default 5000)         — port the production server should bind to
//   A11Y_SKIP=1                 — opt-out (logs a warning and exits 0)
//   A11Y_BOOT_TIMEOUT_MS=60000  — how long to wait for the server to come up

import { spawn } from "node:child_process";
import { setTimeout as wait } from "node:timers/promises";
import { existsSync } from "node:fs";
import path from "node:path";

if (process.env.A11Y_SKIP === "1") {
  console.warn("[release-a11y] A11Y_SKIP=1 set — skipping accessibility gate");
  process.exit(0);
}

const PORT = process.env.PORT || "5000";
const BASE_URL = `http://127.0.0.1:${PORT}`;
const BOOT_TIMEOUT_MS = Number(process.env.A11Y_BOOT_TIMEOUT_MS || 60_000);
const ENTRY = path.resolve("dist/index.cjs");

if (!existsSync(ENTRY)) {
  console.error(`[release-a11y] ${ENTRY} not found — run \`npm run build\` first`);
  process.exit(1);
}

console.log(`[release-a11y] booting production server on :${PORT}`);
const server = spawn(process.execPath, [ENTRY], {
  env: { ...process.env, NODE_ENV: "production", PORT },
  stdio: ["ignore", "inherit", "inherit"],
});

let serverDown = false;
server.on("exit", (code, signal) => {
  serverDown = true;
  if (code !== 0 && code !== null) {
    console.error(`[release-a11y] server exited early (code=${code} signal=${signal})`);
  }
});

async function waitForReady() {
  const deadline = Date.now() + BOOT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (serverDown) throw new Error("server crashed before becoming ready");
    try {
      const res = await fetch(`${BASE_URL}/`, { signal: AbortSignal.timeout(3000) });
      if (res.ok || res.status === 304) return;
    } catch {}
    await wait(500);
  }
  throw new Error(`server not ready within ${BOOT_TIMEOUT_MS}ms`);
}

function shutdown() {
  if (serverDown) return;
  try { server.kill("SIGTERM"); } catch {}
  setTimeout(() => { try { server.kill("SIGKILL"); } catch {} }, 5000).unref();
}

let exitCode = 0;
try {
  await waitForReady();
  console.log("[release-a11y] server ready, running axe checks");

  const checker = spawn(
    process.execPath,
    [path.resolve("scripts/a11y-check.mjs")],
    {
      env: { ...process.env, BASE_URL },
      stdio: "inherit",
    },
  );

  exitCode = await new Promise((resolve) => {
    checker.on("exit", (code) => resolve(code ?? 1));
  });
} catch (err) {
  console.error(`[release-a11y] ${err?.message || err}`);
  exitCode = 1;
} finally {
  shutdown();
}

process.exit(exitCode);
