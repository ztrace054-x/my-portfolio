const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const ORIGIN = process.env.PORTFOLIO_ORIGIN || "https://ztrace054-x.github.io/my-portfolio/";
const RELEASE = "phantom-signal-20261108.1";
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

async function waitForLanding(page) {
  await page.waitForFunction(() => {
    const landing = document.getElementById("page");
    const intro = document.getElementById("phase2-gate");
    const hero = document.getElementById("hero-title");
    return Boolean(
      landing && !landing.inert
      && intro?.hidden
      && hero
      && getComputedStyle(landing).visibility === "visible"
    );
  }, null, { timeout: 12000 });
}

async function waitForWorkspace(page) {
  await page.waitForSelector("#app-shell:not([hidden])", { state: "visible", timeout: 12000 });
  await page.waitForFunction(() => document.body.classList.contains("app-shell-active"));
}

async function waitForIntroReveal(page) {
  await page.waitForFunction(() => {
    const elements = [...document.querySelectorAll(
      ".phantom-intro__quote-group, .phantom-intro__final-line, .phantom-intro__signature, .phantom-intro__echo"
    )];
    return elements.length >= 9 && elements.every(element => getComputedStyle(element).opacity === "1");
  }, null, { timeout: 9000 });
}

// Keep the intro visible while the live browser checks its full reveal and keyboard exit.
// Production timing (5s motion / 3.2s reduced motion) is verified by the unit tests.
async function keepIntroOpenForQa(page) {
  await page.addInitScript(() => {
    const nativeSetTimeout = window.setTimeout.bind(window);
    window.setTimeout = (callback, delay, ...args) => {
      const duration = Number(delay);
      const adjusted = duration === 5000 || duration === 3200 ? 15000 : delay;
      return nativeSetTimeout(callback, adjusted, ...args);
    };
  });
}

async function verifyIntro(page, label, screenshotName) {
  await waitForRelease(page);
  await page.waitForFunction(() => {
    const image = document.querySelector(".phantom-intro__portrait");
    return image && image.complete && image.naturalWidth > 300;
  }, null, { timeout: 30000 });
  await waitForIntroReveal(page);
  const intro = page.locator("#phase2-gate");
  const wakeState = await intro.evaluate(el => {
    const read = selector => {
      const node = el.querySelector(selector);
      return { exists: Boolean(node), animationName: node ? getComputedStyle(node).animationName : "" };
    };
    return {
      curtain: read(".phantom-intro__wake"),
      crimson: read(".phantom-intro__crimson-wake"),
      portrait: read(".phantom-intro__portrait"),
      eyes: read(".phantom-intro__eyes")
    };
  });
  if (!wakeState.curtain.exists || !wakeState.crimson.exists) {
    throw new Error(label + " is missing a cinematic wake layer: " + JSON.stringify(wakeState));
  }
  const reducedMotion = await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
  if (!reducedMotion && (
    !wakeState.crimson.animationName.includes("phantom-crimson-bloom")
    || !wakeState.portrait.animationName.includes("phantom-portrait-awaken")
    || !wakeState.eyes.animationName.includes("phantom-eye-awaken")
  )) {
    throw new Error(label + " is missing a staged crimson/portrait/eye reveal: " + JSON.stringify(wakeState));
  }
  const content = await intro.evaluate(el => el.textContent || "");
  const missing = requiredQuotes.filter(quote => !content.includes(quote));
  if (missing.length) throw new Error(label + " is missing exact quote text: " + missing.join(" | "));
  const portrait = await page.locator(".phantom-intro__portrait").evaluate(img => ({
    src: img.currentSrc, width: img.naturalWidth, height: img.naturalHeight, alt: img.alt
  }));
  if (!portrait.src.includes("assets/phantom-signal-hero.webp") || portrait.width < 300 || !portrait.alt) {
    throw new Error(label + " did not load the original Phantom Signal portrait: " + JSON.stringify(portrait));
  }
  const geometry = await intro.evaluate(el => {
    const overflowNodes = [...el.querySelectorAll("*")].map(node => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return {
        selector: node.tagName.toLowerCase() + (node.id ? "#" + node.id : "") + (typeof node.className === "string" && node.className ? "." + node.className.trim().replace(/\\s+/g, ".") : ""),
        left: Math.round(rect.left * 10) / 10,
        right: Math.round(rect.right * 10) / 10,
        width: Math.round(rect.width * 10) / 10,
        position: style.position,
        transform: style.transform,
        overflow: style.overflow
      };
    }).filter(node => node.left < -2 || node.right > innerWidth + 2).slice(0, 30);
    const style = getComputedStyle(el);
    return {
      width: el.clientWidth, scrollWidth: el.scrollWidth,
      documentWidth: document.documentElement.scrollWidth, viewportWidth: innerWidth,
      rootOverflowX: style.overflowX, rootOverflowY: style.overflowY,
      overflowNodes
    };
  });
  // All four readable cards may extend beyond a short viewport.
  await intro.evaluate(el => { el.scrollTop = el.scrollHeight; });
  const quoteLayout = await intro.evaluate(el => {
    const echoes = el.querySelector(".phantom-intro__echoes")?.getBoundingClientRect();
    const footer = el.querySelector(".phantom-intro__ticker")?.getBoundingClientRect();
    return { echoesBottom: echoes?.bottom ?? 0, footerTop: footer?.top ?? 0 };
  });
  if (page.viewportSize().width <= 560 && quoteLayout.echoesBottom > quoteLayout.footerTop + 2) {
    throw new Error(label + " has quote cards overlapping the sticky footer: " + JSON.stringify(quoteLayout));
  }
  await page.screenshot({ path: path.join(OUT, screenshotName), fullPage: false });
  const clippedDecorativeOverflow = geometry.scrollWidth > geometry.width + 2
    && ["hidden", "clip"].includes(geometry.rootOverflowX);
  if (geometry.documentWidth > geometry.viewportWidth + 2
      || !["hidden", "clip"].includes(geometry.rootOverflowX)) {
    throw new Error(label + " has visible horizontal overflow: " + JSON.stringify(geometry));
  }
  geometry.clippedDecorativeOverflow = clippedDecorativeOverflow;
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
    await keepIntroOpenForQa(desktop);
    desktop.on("pageerror", error => errors.push("desktop pageerror: " + error.message));
    desktop.on("console", message => { if (message.type() === "error") errors.push("desktop console: " + message.text()); });
    desktop.on("response", response => {
      if (response.url().startsWith(ORIGIN) && response.status() >= 400) errors.push("desktop HTTP " + response.status() + ": " + response.url());
    });
    report.checks.push(await verifyIntro(desktop, "desktop 1440x900", "live-phantom-intro-desktop-1440x900.png"));
    report.screenshots.push("live-phantom-intro-desktop-1440x900.png");
    await desktop.keyboard.press("Escape");
    await waitForLanding(desktop);
    const landingState = await desktop.evaluate(() => ({
      visible: getComputedStyle(document.getElementById("page")).visibility === "visible",
      introHidden: document.getElementById("phase2-gate").hidden,
      workspaceHidden: document.getElementById("app-shell").hidden,
      heading: document.getElementById("hero-title")?.textContent.trim() || ""
    }));
    if (!landingState.visible || !landingState.introHidden || !landingState.workspaceHidden || !landingState.heading.includes("SAAD")) {
      throw new Error("Desktop Escape did not reveal the editorial landing page: " + JSON.stringify(landingState));
    }
    report.checks.push({ label: "desktop Escape exits intro to the editorial portfolio landing page", passed: true });

    await desktop.locator("#workspace-launch").click();
    await waitForWorkspace(desktop);
    report.checks.push({ label: "desktop Open workspace link opens the preserved learning workspace", passed: true });

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
    await desktop.keyboard.press("Escape");
    await waitForLanding(desktop);
    report.checks.push({ label: "desktop settings replay and Escape return to the editorial landing page", passed: true });
    report.screenshots.push("live-phantom-intro-replay.png");
    await desktopContext.close();

    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    const mobile = await mobileContext.newPage();
    await keepIntroOpenForQa(mobile);
    mobile.on("pageerror", error => errors.push("mobile pageerror: " + error.message));
    mobile.on("console", message => { if (message.type() === "error") errors.push("mobile console: " + message.text()); });
    mobile.on("response", response => {
      if (response.url().startsWith(ORIGIN) && response.status() >= 400) errors.push("mobile HTTP " + response.status() + ": " + response.url());
    });
    report.checks.push(await verifyIntro(mobile, "mobile 390x844", "live-phantom-intro-mobile-390x844.png"));
    report.screenshots.push("live-phantom-intro-mobile-390x844.png");
    await mobile.keyboard.press("Escape");
    await waitForLanding(mobile);
    report.checks.push({ label: "mobile Escape exits intro to the editorial portfolio landing page", passed: true });
    await mobile.locator("#menu-toggle").click();
    await mobile.waitForFunction(() => document.getElementById("mobile-menu")?.open === true, null, { timeout: 5000 });
    await mobile.locator("#mobile-menu .mobile-workspace-link").click();
    await waitForWorkspace(mobile);
    report.checks.push({ label: "mobile navigation opens the preserved learning workspace", passed: true });
    await mobileContext.close();

    const reducedContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce"
    });
    const reduced = await reducedContext.newPage();
    await keepIntroOpenForQa(reduced);
    reduced.on("pageerror", error => errors.push("reduced-motion pageerror: " + error.message));
    await verifyIntro(reduced, "reduced motion 390x844", "live-phantom-intro-reduced-motion.png");
    const motion = await reduced.locator(".phantom-intro__quote-group").first().evaluate(el => getComputedStyle(el).animationName);
    if (motion !== "none") throw new Error("Reduced-motion mode still animates intro quote groups: " + motion);
    await reduced.keyboard.press("Escape");
    await waitForLanding(reduced);
    report.checks.push({ label: "reduced-motion intro is static and exits to the editorial landing page", passed: true });
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
