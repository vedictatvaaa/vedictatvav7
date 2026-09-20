import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import puppeteer from "puppeteer";

const devDomain = process.env.REPLIT_DEV_DOMAIN;
const browserOrigin = devDomain ? `https://${devDomain}` : "";

function findChromium(): string | null {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;

  const knownPaths = [
    "/repl/tools/bin/chromium",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
  ];
  const knownExecutable = knownPaths.find((candidate) => fs.existsSync(candidate));
  if (knownExecutable) return knownExecutable;

  if (!fs.existsSync("/nix/store")) return null;
  const candidates = fs.readdirSync("/nix/store")
    .map((entry) => {
      const match = entry.match(/(?:ungoogled-)?chromium-(\d+)\./);
      return match
        ? { version: Number(match[1]), executable: path.join("/nix/store", entry, "bin/chromium") }
        : null;
    })
    .filter((candidate): candidate is { version: number; executable: string } =>
      Boolean(candidate && fs.existsSync(candidate.executable))
    )
    .sort((a, b) => b.version - a.version);

  return candidates[0]?.executable || null;
}

test("mobile japa warmup keeps readable guidance usable without audio", {
  skip: !browserOrigin ? "requires the running Replit application workflow" : false,
  timeout: 180_000,
}, async () => {
  const executablePath = findChromium();
  assert.ok(executablePath, "A Chromium executable is required for the breathing browser regression test");

  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });

  try {
    await page.evaluateOnNewDocument(() => {
      localStorage.clear();
      sessionStorage.clear();
      Object.defineProperty(window, "speechSynthesis", {
        configurable: true,
        value: undefined,
      });
      HTMLMediaElement.prototype.play = () =>
        Promise.reject(new Error("silent-device-browser-test"));
    });

    await page.goto(`${browserOrigin}/digital-japa-counter`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    await page.waitForSelector('button[aria-label*="Count one japa"]', {
      visible: true,
      timeout: 30_000,
    });

    await page.click('button[aria-label*="Count one japa"]');
    await page.waitForSelector('[data-testid="dialog-pranayama"]', {
      visible: true,
      timeout: 10_000,
    });
    await page.click('[data-testid="btn-toggle-breath-guidance"]');
    await page.waitForSelector("#breath-guidance-transcript", {
      visible: true,
      timeout: 5_000,
    });

    const intro = await page.evaluate(`(() => {
      const dialog = document.querySelector('[data-testid="dialog-pranayama"]');
      const transcript = document.querySelector("#breath-guidance-transcript");
      const visible = (selector) => {
        const element = document.querySelector(selector);
        if (!(element instanceof HTMLElement)) return false;
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      };

      if (!(dialog instanceof HTMLElement) || !(transcript instanceof HTMLElement)) {
        return {
          dialogWithinViewport: false,
          transcriptScrollable: false,
          transcriptText: "",
          controlsVisible: false,
        };
      }
      const dialogRect = dialog.getBoundingClientRect();

      return {
        dialogWithinViewport: dialogRect.top >= 0 && dialogRect.bottom <= window.innerHeight,
        transcriptScrollable: transcript.scrollHeight > transcript.clientHeight,
        transcriptText: transcript.textContent?.trim() || "",
        controlsVisible: [
          "btn-toggle-breath-guidance",
          "btn-toggle-breath-music",
          "btn-toggle-breath-voice",
          "btn-skip-breathing",
        ].every((id) => visible('[data-testid="' + id + '"]')),
      };
    })()`);

    assert.equal(intro.dialogWithinViewport, true, "the expanded dialog must fit the mobile viewport");
    assert.equal(intro.transcriptScrollable, true, "the full guidance must scroll inside the dialog");
    assert.match(intro.transcriptText, /Prepare for your mantra/);
    assert.equal(intro.controlsVisible, true, "intro controls must remain reachable with the transcript open");

    if (await page.$('[data-testid="btn-begin-breathing"]')) {
      await page.click('[data-testid="btn-begin-breathing"]');
    }
    await page.waitForSelector('[data-testid="text-breath-phase"]', {
      visible: true,
      timeout: 5_000,
    });

    const exercise = await page.evaluate(`(() => {
      const visible = (selector) => {
        const element = document.querySelector(selector);
        if (!(element instanceof HTMLElement)) return false;
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      };

      return {
        stage: document.querySelector('[data-testid="text-breath-stage"]')?.textContent?.trim() || "",
        phase: document.querySelector('[data-testid="text-breath-phase"]')?.textContent?.trim() || "",
        countdown: document.querySelector('[data-testid="text-breath-countdown"]')?.textContent?.trim() || "",
        transcriptOpen: Boolean(document.querySelector("#breath-guidance-transcript")),
        skipVisible: visible('[data-testid="btn-skip-breathing"]'),
      };
    })()`);

    assert.ok(exercise.stage, "the active breathing stage must remain visible");
    assert.ok(exercise.phase, "the active breathing phase must remain visible");
    assert.ok(exercise.countdown, "the active breathing countdown must remain visible");
    assert.equal(exercise.transcriptOpen, true, "the expanded transcript must remain available during exercise");
    assert.equal(exercise.skipVisible, true, "skip warmup must remain reachable during exercise");

    await page.click('[data-testid="btn-skip-breathing"]');
    await page.waitForFunction(
      () => {
        const dialog = document.querySelector('[data-testid="dialog-pranayama"]');
        return !dialog || dialog.getAttribute("data-state") === "closed";
      },
      { timeout: 5_000 },
    );
  } finally {
    await page.close();
    await browser.close();
  }
});