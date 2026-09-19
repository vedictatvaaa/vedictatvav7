import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import puppeteer, { type Browser, type Page } from "puppeteer";

const devDomain = process.env.REPLIT_DEV_DOMAIN;
const browserOrigin = process.env.PANDIT_BROWSER_TEST_ORIGIN || (devDomain ? `https://${devDomain}` : "");

function findChromium(): string | null {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  if (!fs.existsSync("/nix/store")) return null;
  const candidates = fs.readdirSync("/nix/store")
    .map((entry) => {
      const match = entry.match(/(?:ungoogled-)?chromium-(\d+)\./);
      return match ? { version: Number(match[1]), executable: path.join("/nix/store", entry, "bin/chromium") } : null;
    })
    .filter((candidate): candidate is { version: number; executable: string } =>
      Boolean(candidate && fs.existsSync(candidate.executable))
    )
    .sort((a, b) => b.version - a.version);
  return candidates[0]?.executable || null;
}

async function openSignup(browser: Browser, origin: string, interceptSubmission = false) {
  const page = await browser.newPage();
  await browser.defaultBrowserContext().overridePermissions(origin, ["geolocation"]);
  await page.setGeolocation({ latitude: 28.6139, longitude: 77.209, accuracy: 10 });
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: (success: PositionCallback) => success({
          coords: {
            latitude: 28.6139,
            longitude: 77.209,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        } as GeolocationPosition),
      },
    });
  });

  if (interceptSubmission) {
    await page.setRequestInterception(true);
    page.on("request", async (request) => {
      if (request.url().endsWith("/api/pandit-applications/upload-photo")) {
        await request.respond({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ url: "/uploads/browser-test.png" }),
        });
      } else if (request.url().endsWith("/api/pandit-applications") && request.method() === "POST") {
        await request.respond({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ message: "Share your exact location before submitting." }),
        });
      } else {
        await request.continue();
      }
    });
  }

  await page.goto(`${origin}/become-pandit`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.waitForSelector("#fullName", { timeout: 30_000 });
  await page.waitForFunction(
    () => document.querySelectorAll("#stateId option").length > 1,
    { timeout: 30_000 },
  );
  return page;
}

async function fillRequiredDetails(page: Page, options: {
  pujaCount: number;
  captureLocation: boolean;
  confirmServices: boolean;
  acceptTerms?: boolean;
}) {
  await page.type("#fullName", "Browser Contract Applicant");
  await page.type("#phone", "9876543210");
  await page.type("#email", "browser-contract@example.invalid");

  const stateValue = await page.$eval("#stateId", (element) => (element as HTMLSelectElement).options[1]?.value || "");
  assert.ok(stateValue, "the signup form must expose an active state");
  await page.select("#stateId", stateValue);
  await page.waitForFunction(
    () => document.querySelectorAll("#cityId option").length > 1,
    { timeout: 30_000 },
  );
  const cityValue = await page.$eval("#cityId", (element) => (element as HTMLSelectElement).options[1]?.value || "");
  assert.ok(cityValue, "the signup form must expose an active city");
  await page.select("#cityId", cityValue);

  await page.type("#registeredAddress", "12 Browser Test Street, New Delhi, 110001");
  await page.type("#experience", "8");
  await page.type("#education", "Traditional Vedic training");
  await page.type("#languages", "Hindi, English");
  await page.type("#specializations", "Vedic ceremonies and household rituals");
  await page.type("#serviceArea", "New Delhi and nearby areas");
  await page.type("#bio", "A browser contract applicant with a complete profile biography.");

  const pujaInputs = await page.$$("#masterServiceIds input[type=checkbox]");
  assert.ok(pujaInputs.length >= 5, "the signup form must expose at least five specialist Pujas");
  await page.$$eval(
    "#masterServiceIds input[type=checkbox]",
    (inputs, count) => inputs.slice(0, count).forEach((input) => (input as HTMLInputElement).click()),
    options.pujaCount,
  );

  if (options.confirmServices) await page.$eval("#servicesConfirmed input", (input) => (input as HTMLInputElement).click());
  if (options.captureLocation) {
    const locationSelector = '[data-testid="button-share-location"]';
    await page.$eval(locationSelector, (button) => button.scrollIntoView({ behavior: "auto", block: "center" }));
    await new Promise((resolve) => setTimeout(resolve, 500));
    await page.click(locationSelector);
  }
  if (options.captureLocation) {
    await page.waitForFunction(
      () => document.querySelector('[data-testid="button-share-location"]')?.textContent?.includes("Location captured"),
      { timeout: 10_000 },
    );
  }
  if (options.acceptTerms) await page.click("#agreeTerms");
}

async function submitAndRead(page: Page, targetId: string) {
  const validity = await page.$eval("#apply form", (element) => {
    const form = element as HTMLFormElement;
    return {
      valid: form.checkValidity(),
      invalid: Array.from(form.elements)
        .filter((control): control is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement =>
          control instanceof HTMLInputElement || control instanceof HTMLSelectElement || control instanceof HTMLTextAreaElement
        )
        .filter((control) => !control.checkValidity())
        .map((control) => control.id || control.getAttribute("name") || control.tagName),
    };
  });
  assert.equal(validity.valid, true, `browser-native validation blocked ${targetId}: ${validity.invalid.join(", ")}`);
  const submitSelector = '[data-testid="btn-submit-application"]';
  await page.$eval("#apply form", (element) => {
    element.addEventListener("submit", (event) => event.preventDefault(), { capture: true, once: true });
  });
  await page.$eval(submitSelector, (element) => (element as HTMLButtonElement).click());
  try {
    await page.waitForSelector("#signup-application-error", { timeout: 5_000 });
  } catch (error) {
    const debug = await page.evaluate(() => ({
      url: location.href,
      activeId: document.activeElement?.id || "",
      buttonDisabled: (document.querySelector('[data-testid="btn-submit-application"]') as HTMLButtonElement | null)?.disabled,
      signupFormValid: (document.querySelector("#apply form") as HTMLFormElement | null)?.checkValidity(),
      locationText: document.querySelector("#signup-location")?.textContent?.trim(),
      visibleErrors: Array.from(document.querySelectorAll("#apply p.text-destructive")).map((element) => element.textContent?.trim()),
    }));
    throw new Error(`Signup alert did not render for ${targetId}: ${JSON.stringify(debug)}; ${error}`);
  }
  await page.waitForFunction(
    (expectedTarget) => document.activeElement?.id === expectedTarget,
    { timeout: 5_000 },
    targetId,
  );
  return page.evaluate(() => {
    const photoInlineError = document.querySelector("#signup-photo")?.parentElement?.querySelector("p.text-destructive");
    return {
      alert: document.querySelector("#signup-application-error")?.textContent || "",
      activeId: document.activeElement?.id || "",
      fullName: (document.querySelector("#fullName") as HTMLInputElement)?.value || "",
      inline: document.querySelector("#signup-location p.text-destructive")?.textContent
        || document.querySelector("#masterServiceIds p.text-destructive")?.textContent
        || photoInlineError?.textContent
        || "",
    };
  });
}

test("Pandit signup browser contract keeps requirement errors visible and values intact", {
  skip: !browserOrigin ? "requires the running application workflow or PANDIT_BROWSER_TEST_ORIGIN" : false,
  timeout: 360_000,
}, async () => {
  const executablePath = findChromium();
  assert.ok(executablePath, "A Chromium executable is required for the signup browser regression test");
  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const origin = browserOrigin;

  try {
    const scenarios = [
      {
        name: "missing location permission",
        options: { pujaCount: 5, captureLocation: false, confirmServices: true },
        targetId: "signup-location",
        message: "Share your exact location before submitting.",
      },
      {
        name: "incorrect Puja count",
        options: { pujaCount: 4, captureLocation: false, confirmServices: true },
        targetId: "masterServiceIds",
        message: "Select at least five specialist Pujas (you selected 4).",
      },
      {
        name: "missing service confirmation",
        options: { pujaCount: 5, captureLocation: true, confirmServices: false },
        targetId: "servicesConfirmed",
        message: "Confirm that the selected Pujas are services you personally offer.",
      },
      {
        name: "missing photo",
        options: { pujaCount: 5, captureLocation: true, confirmServices: true },
        targetId: "signup-photo",
        message: "Upload a profile photo before submitting.",
      },
    ] as const;

    for (const scenario of scenarios) {
      const page = await openSignup(browser, origin);
      try {
        await fillRequiredDetails(page, scenario.options);
        const result = await submitAndRead(page, scenario.targetId);
        assert.equal(result.alert, scenario.message, `${scenario.name} alert changed`);
        assert.equal(result.activeId, scenario.targetId, `${scenario.name} focus target changed`);
        assert.equal(result.fullName, "Browser Contract Applicant", `${scenario.name} lost entered values`);
        assert.equal(result.inline, scenario.message, `${scenario.name} inline guidance changed`);
      } finally {
        await page.close();
      }
    }

    const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "pandit-signup-browser-"));
    const photoPath = path.join(tempDirectory, "profile.png");
    fs.writeFileSync(
      photoPath,
      Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64"),
    );
    const serverErrorPage = await openSignup(browser, origin, true);
    try {
      await fillRequiredDetails(serverErrorPage, {
        pujaCount: 5,
        captureLocation: true,
        confirmServices: true,
        acceptTerms: true,
      });
      await serverErrorPage.$eval("#photo", (element) => (element as HTMLInputElement).scrollIntoView());
      await serverErrorPage.$("#photo").then(async (input) => {
        assert.ok(input);
        await input.uploadFile(photoPath);
      });
      await serverErrorPage.waitForSelector('[data-testid="img-photo-preview"]', { timeout: 5_000 });
      const result = await submitAndRead(serverErrorPage, "signup-location");
      assert.equal(result.alert, "Share your exact location before submitting.");
      assert.equal(result.inline, "Share your exact location before submitting.");
      assert.equal(result.fullName, "Browser Contract Applicant");
    } finally {
      await serverErrorPage.close();
      fs.rmSync(tempDirectory, { recursive: true, force: true });
    }
  } finally {
    await browser.close();
  }
});