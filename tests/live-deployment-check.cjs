const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const ORIGIN = process.env.PORTFOLIO_ORIGIN || "https://ztrace054-x.github.io/my-portfolio/";
const RELEASE = "phantom-signal-20261106.2";
const OUT = path.resolve(__dirname, "..", "artifacts", "live-deployment");
const errors = [];
fs.mkdirSync(OUT, { recursive: true });

const requiredQuotes = [
  "You built the firewall.",
  "I became the shadow behind it.",
  "You encrypted the system.",
  "I learned the language of silence.",
  "You wait for the warning.",
  "I arrive before the alarm.",
  "And when you finally feel safe...",
  "I'm already everywhere.",
  "They build walls. I find cracks. They set rules. I rewrite them. They call it security. I call it a challenge. And when they think they are safe... that's when I'm already inside.",
  "You call it impossible. I call it unfinished.",
  "You call it a security system. I call it my playground.",
  "You fear the unknown. The unknown knows your name.",
  "./ phantom signal"
];

async function waitForRelease(page) {
  const deadline = Date.now() + 12 * 60 * 1000;
  let lastStatus = "not checked";
  while (Date.now() < deadline) {
    const response = await page.goto(ORIGIN + (ORIGIN.includes("?") ? "&" : "?") + "phantom-live-check=" + Date.now(), {
      waitUntil: "domcontentloaded",
      timeout: 45000
    }).catch(error => { lastStatus = error.message; return null; });
    if (response) lastStatus = "HTTP " + response.status();
    await page.waitForTimeout(1200);
    const state = await page.locator("#phase2-gate").evaluate(el => ({
      release: el.dataset.release || "",
      hidden: el.hidden
    })).catch(() => null);
    if (state?.release === RELEASE && !state.hidden) return;
    await page.waitForTimeout(12000);
  }
  throw new Error("GitHub Pages did not serve " + RELEASE + " within 12 minutes. Last response: " + lastStatus);
}

async function waitForIntroReveal(page) {
  await page.waitForFunction(() => {
    const elements = [...document.querySelectorAll(
      ".phantom-intro__quote-group, .phantom-intro__final-line, .phantom-intro__signature, .phantom-intro__echo"
    )];
    return elements.length >= 9 && elements.every(element => getComputedStyle(element).opacity === "1");
  }, null, { timeout: 9000 });
}

async function verifyIntro(page, label, screenshotName) {
  await waitForRelease(page);
  await page.waitForFunction(() => {
    const image = document.querySelector(".phantom-intro__portrait");
    return image && image.complete && image.naturalWidth > 300;
  }, null, { timeout: 30000 });
  await waitForIntroReveal(page);
  const intro = page.locator("#phase2-gate");
  const content = await intro.evaluate(el => el.textContent || "");
  const missing = requiredQuotes.filter(quote => !content.includes(quote));
  if (missing.length) throw new Error(label + " is missing exact quote text: " + missing.join(" | "));
  const portrait = await page.locator(".phantom-intro__portrait").evaluate(img => ({
    src: img.currentSrc, width: img.naturalWidth, height: img.naturalHeight, alt: img.alt
  }));
  if (!portrait.src.includes("assets/phantom-signal-hero.webp") || portrait.width < 300 || !portrait.alt) {
    throw new Error(label + " did not load the original Phantom Signal portrait: " + JSON.stringify(portrait));
  }
  const geometry = await intro.evaluate(el => ({
    width: el.clientWidth, scrollWidth: el.scrollWidth,
    documentWidth: document.documentElement.scrollWidth, viewportWidth: innerWidth
  }));
  const quoteLayout = await intro.evaluate(el => {
    const echoes = el.querySelector(".phantom-intro__echoes")?.getBoundingClientRect();
    const footer = el.querySelector(".phantom-intro__ticker")?.getBoundingClientRect();
    return { echoesBottom: echoes?.bottom ?? 0, footerTop: footer?.top ?? 0 };
  });
  if (page.viewportSize().width <= 560 && quoteLayout.echoesBottom > quoteLayout.footerTop + 2) {
    throw new Error(label + " has quote cards overlapping the intro controls: " + JSON.stringify(quoteLayout));
  }
  if (geometry.scrollWidth > geometry.width + 2 || geometry.documentWidth > geometry.viewportWidth + 2) {
    throw new Error(label + " has horizontal overflow: " + JSON.stringify(geometry));
  }
  await page.screenshot({ path: path.join(OUT, screenshotName), fullPage: false });
  return { label, portrait, geometry, quoteCount: requiredQuotes.length };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const report = {
    origin: ORIGIN,
    expectedRelease: RELEASE,
    checkedAt: new Date().toISOString(),
    screenshots: [],
    checks: [],
    errors
  };
  try {
    const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    const desktop = await desktopContext.newPage();
    desktop.on("pageerror", error => errors.push("desktop pageerror: " + error.message));
    desktop.on("console", message => { if (message.type() === "error") errors.push("desktop console: " + message.text()); });
    desktop.on("response", response => {
      if (response.url().startsWith(ORIGIN) && response.status() >= 400) errors.push("desktop HTTP " + response.status() + ": " + response.url());
    });
    report.checks.push(await verifyIntro(desktop, "desktop 1440x900", "live-phantom-intro-desktop-1440x900.png"));
    report.screenshots.push("live-phantom-intro-desktop-1440x900.png");
    await desktop.locator("[data-p2-skip]").click();
    await desktop.waitForSelector("#app-shell:not([hidden])", { state: "visible", timeout: 12000 });
    await desktop.waitForFunction(() => document.body.classList.contains("app-shell-active"));
    report.checks.push({ label: "desktop skip intro opens existing workspace", passed: true });

    await desktop.locator('[data-panel-open="settings"]').first().click();
    await desktop.waitForFunction(() => {
      const panel = document.querySelector('[data-app-panel="settings"]');
      return panel && !panel.hidden && panel.getAttribute("aria-hidden") === "false";
    });
    await desktop.locator("[data-replay-intro]").click();
    await desktop.waitForFunction(() => new URL(location.href).searchParams.get("intro") === "1", null, { timeout: 10000 });
    await desktop.waitForSelector("#phase2-gate:not([hidden])", { state: "visible", timeout: 10000 });
    await waitForIntroReveal(desktop);
    await desktop.screenshot({ path: path.join(OUT, "live-phantom-intro-replay.png"), fullPage: false });
    await desktop.locator("[data-p2-login]").click();
    await desktop.waitForSelector("#app-shell:not([hidden])", { state: "visible", timeout: 12000 });
    report.checks.push({ label: "desktop settings replay and Enter portfolio work", passed: true });
    report.screenshots.push("live-phantom-intro-replay.png");
    await desktopContext.close();

    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    const mobile = await mobileContext.newPage();
    mobile.on("pageerror", error => errors.push("mobile pageerror: " + error.message));
    mobile.on("console", message => { if (message.type() === "error") errors.push("mobile console: " + message.text()); });
    mobile.on("response", response => {
      if (response.url().startsWith(ORIGIN) && response.status() >= 400) errors.push("mobile HTTP " + response.status() + ": " + response.url());
    });
    report.checks.push(await verifyIntro(mobile, "mobile 390x844", "live-phantom-intro-mobile-390x844.png"));
    report.screenshots.push("live-phantom-intro-mobile-390x844.png");
    await mobile.locator("[data-p2-login]").click();
    await mobile.waitForSelector("#app-shell:not([hidden])", { state: "visible", timeout: 12000 });
    report.checks.push({ label: "mobile Enter portfolio opens existing workspace", passed: true });
    await mobileContext.close();

    const reducedContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce"
    });
    const reduced = await reducedContext.newPage();
    reduced.on("pageerror", error => errors.push("reduced-motion pageerror: " + error.message));
    await verifyIntro(reduced, "reduced motion 390x844", "live-phantom-intro-reduced-motion.png");
    const motion = await reduced.locator(".phantom-intro__quote-group").first().evaluate(el => getComputedStyle(el).animationName);
    if (motion !== "none") throw new Error("Reduced-motion mode still animates intro quote groups: " + motion);
    await reduced.locator("[data-p2-skip]").click();
    await reduced.waitForSelector("#app-shell:not([hidden])", { state: "visible", timeout: 12000 });
    report.checks.push({ label: "reduced-motion intro is static and skippable", passed: true });
    report.screenshots.push("live-phantom-intro-reduced-motion.png");
    await reducedContext.close();

    if (errors.length) throw new Error("Browser errors were observed: " + errors.join(" | "));
    report.summary = { passed: true, screenshots: report.screenshots.length, checks: report.checks.length, browserErrors: 0 };
    fs.writeFileSync(path.join(OUT, "live-deployment-report.json"), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    report.summary = { passed: false, screenshots: report.screenshots.length, checks: report.checks.length, browserErrors: errors.length };
    fs.writeFileSync(path.join(OUT, "live-deployment-report.json"), JSON.stringify({ ...report, failure: error.message }, null, 2));
    console.error(JSON.stringify({ ...report, failure: error.message }, null, 2));
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
