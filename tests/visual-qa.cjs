const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "artifacts", "visual-qa");
const PORT = 4173;
const ORIGIN = "http://127.0.0.1:" + PORT;
const VIEWPORTS = [
  { name: "desktop-1440x900", width: 1440, height: 900 },
  { name: "tablet-1024x768", width: 1024, height: 768 },
  { name: "mobile-390x844", width: 390, height: 844 },
  { name: "narrow-320x700", width: 320, height: 700 }
];
const ROUTES = [
  ["profile", "Profile"],
  ["dashboard", "Dashboard"],
  ["projects", "Projects"],
  ["attack-surface", "Attack Surface — Authorized Labs"],
  ["skill-progress", "Skill Progress"],
  ["learning-path", "Learning Path"],
  ["write-ups", "Write-ups"],
  ["automation", "Automation"],
  ["certificates", "Certificates"],
  ["gallery", "Gallery"],
  ["contact", "Contact"]
];
const LONG_ROUTES = new Set(["projects", "learning-path", "write-ups", "certificates", "gallery", "contact"]);
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};
const report = {
  head_sha: process.env.GITHUB_SHA || "local",
  generated_at: new Date().toISOString(),
  preview: "Local static server only; no production deployment",
  viewports: [],
  issues: [],
  summary: {}
};
let screenshotCount = 0;
let routeCheckCount = 0;
let currentViewport = "startup";
let currentRoute = "intro";

function issue(type, detail, extra = {}) {
  report.issues.push({ type, detail, viewport: currentViewport, route: currentRoute, ...extra });
}

function rgbLuminance(color) {
  const values = color.match(/[\d.]+/g);
  if (!values || values.length < 3) return null;
  const channels = values.slice(0, 3).map(value => Number(value) / 255).map(value =>
    value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}
function contrastRatio(foreground, background) {
  const fg = rgbLuminance(foreground), bg = rgbLuminance(background);
  if (fg === null || bg === null) return null;
  return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
}

const server = http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, ORIGIN).pathname); }
  catch { res.writeHead(400).end("Bad URL"); return; }
  const requested = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const file = path.resolve(ROOT, requested);
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) {
    res.writeHead(403).end("Forbidden");
    return;
  }
  fs.readFile(file, (error, bytes) => {
    if (error) {
      res.writeHead(error.code === "ENOENT" ? 404 : 500, { "content-type": "text/plain; charset=utf-8" });
      res.end(error.code === "ENOENT" ? "Not found" : "Read error");
      return;
    }
    res.writeHead(200, {
      "content-type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff"
    });
    res.end(bytes);
  });
});

async function screenshot(page, fileName, options = {}) {
  const target = path.join(OUT, currentViewport, fileName);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  await page.screenshot({ path: target, animations: "disabled", ...options });
  screenshotCount++;
}

async function collectLayout(page, expectedHeading) {
  const result = await page.evaluate(() => {
    const root = document.querySelector("[data-view-root]");
    const stage = document.querySelector(".app-view-stage");
    const shell = document.querySelector("#app-shell");
    const heading = root && root.querySelector("h1");
    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      shellWidth: shell ? shell.scrollWidth : null,
      shellClientWidth: shell ? shell.clientWidth : null,
      stageWidth: stage ? stage.scrollWidth : null,
      stageClientWidth: stage ? stage.clientWidth : null,
      stageHeight: stage ? stage.scrollHeight : null,
      stageClientHeight: stage ? stage.clientHeight : null,
      viewWidth: root ? root.scrollWidth : null,
      viewClientWidth: root ? root.clientWidth : null,
      heading: heading ? heading.innerText.trim() : "",
      documentTitle: document.title,
      fontsStatus: document.fonts ? document.fonts.status : "unknown"
    };
  });
  if (result.documentWidth > result.viewportWidth + 1 || result.bodyWidth > result.viewportWidth + 1) {
    issue("horizontal-overflow", "Document/body width exceeds the viewport.", result);
  }
  if (result.stageWidth !== null && result.stageClientWidth !== null && result.stageWidth > result.stageClientWidth + 2) {
    issue("workspace-stage-overflow", "Workspace stage has horizontal overflow.", result);
  }
  if (result.viewWidth !== null && result.viewClientWidth !== null && result.viewWidth > result.viewClientWidth + 2) {
    issue("view-content-overflow", "The active view has horizontal overflow.", result);
  }
  if (!result.heading) issue("missing-heading", "Rendered view has no H1.", result);
  if (expectedHeading && result.heading.replace(/\s+/g, " ").toLowerCase() !== expectedHeading.toLowerCase()) {
    issue("wrong-heading", 'Expected H1 "' + expectedHeading + '" but got "' + result.heading + '".', result);
  }
  routeCheckCount++;
  return result;
}

async function ensureImages(page) {
  await page.locator("#app-shell img").evaluateAll(images => {
    for (const image of images) image.loading = "eager";
  });
  await page.waitForTimeout(150);
  return await page.locator("#app-shell img").evaluateAll(images => images
    .filter(image => image.getAttribute("src"))
    .map(image => ({
      src: image.getAttribute("src"),
      complete: image.complete,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      alt: image.alt
    })));
}

async function enterWorkspace(page) {
  await page.goto(ORIGIN, { waitUntil: "load" });
  await page.evaluate(() => document.fonts ? document.fonts.ready : Promise.resolve());
  await page.waitForSelector("#phase2-gate", { state: "visible", timeout: 7000 });
  await screenshot(page, "00-intro.png");
  const introHeading = await page.locator("#phase2-gate h1").first().innerText().catch(() => "");
  if (!introHeading.trim()) issue("intro-heading-missing", "Intro has no visible H1.");
  const globeVisible = await page.locator("#phase2-gate .phase2-gate__globe, #phase2-gate .phase2-gate__visual, #phase2-gate svg").first().isVisible().catch(() => false);
  if (!globeVisible) issue("intro-globe-not-visible", "No visible SVG/globe element was found in the intro.");
  await page.locator("[data-p2-skip]").click();
  await page.locator("[data-p2-login]").waitFor({ state: "visible", timeout: 4000 });
  await screenshot(page, "01-intro-ready.png");
  await page.locator("[data-p2-login]").click();
  await page.waitForTimeout(120);
  await screenshot(page, "02-transition.png");
  await page.waitForSelector("#app-shell:not([hidden])", { state: "visible", timeout: 7000 });
  await page.waitForFunction(() => document.body.classList.contains("app-shell-active"));
  await page.waitForTimeout(160);
}

async function checkGalleryKeyboard(page) {
  currentRoute = "gallery-keyboard";
  await page.evaluate(() => { window.location.hash = "#/gallery"; });
  await page.waitForFunction(() => document.querySelector('[data-nav-item][data-route="gallery"]')?.getAttribute("aria-current") === "page"
    && document.querySelector('[data-gallery-open="0"]'));
  const trigger = page.locator('[data-gallery-open="0"]');
  await trigger.focus();
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => document.querySelector("[data-gallery-dialog]")?.open === true);
  await page.keyboard.press("ArrowRight");
  const position = (await page.locator("#phase6-lightbox-position").innerText()).trim();
  if (position !== "2 of 3") issue("gallery-next-key-failed", 'Expected "2 of 3" after ArrowRight, got "' + position + '".');
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => document.querySelector("[data-gallery-dialog]")?.open === false);
  const restored = await trigger.evaluate(el => document.activeElement === el);
  if (!restored) issue("gallery-focus-not-restored", "Closing the lightbox did not restore focus to its trigger.");
}

async function checkMobileNavigation(page) {
  currentRoute = "mobile-navigation";
  const toggle = page.locator("[data-sidebar-toggle]");
  const sidebar = page.locator("[data-app-sidebar]");
  if (!(await toggle.isVisible().catch(() => false))) {
    issue("mobile-menu-toggle-missing", "Mobile workspace navigation toggle is not visible.");
    return;
  }
  const initial = await sidebar.boundingBox();
  const initiallyOpen = await page.locator("#app-shell").evaluate(el => el.classList.contains("is-sidebar-open"));
  if (!initiallyOpen && initial && initial.x + initial.width > 1) {
    issue("mobile-sidebar-visible-by-default", "The sidebar occupies the mobile viewport before the menu is opened.", initial);
  }
  try {
    await toggle.click({ timeout: 5000 });
  } catch (error) {
    issue("mobile-menu-toggle-unusable", "The mobile menu toggle could not receive a real click: " + error.message);
    return;
  }
  const expanded = await toggle.getAttribute("aria-expanded");
  if (expanded !== "true") issue("mobile-menu-did-not-open", "Expected aria-expanded=true, got " + expanded + ".");
  const layers = await page.evaluate(() => ({
    sidebarZ: Number.parseInt(getComputedStyle(document.querySelector("[data-app-sidebar")).zIndex, 10) || 0,
    backdropZ: Number.parseInt(getComputedStyle(document.querySelector("[data-sidebar-backdrop")).zIndex, 10) || 0,
    sidebarOpen: document.querySelector("#app-shell").classList.contains("is-sidebar-open")
  }));
  if (!layers.sidebarOpen || layers.sidebarZ <= layers.backdropZ) {
    issue("mobile-sidebar-layer-order", "The open sidebar must sit above its click-blocking backdrop.", layers);
  }
  await screenshot(page, "03-mobile-drawer-open.png");
  const projectLink = page.locator('[data-nav-item][data-route="projects"]');
  try {
    await projectLink.click({ timeout: 5000 });
    await page.waitForFunction(() => window.location.hash === "#/projects"
      && document.querySelector('[data-nav-item][data-route="projects"]')?.getAttribute("aria-current") === "page", null, { timeout: 5000 });
  } catch (error) {
    issue("mobile-nav-link-unusable", "A real click on the Projects link failed while the drawer was open: " + error.message);
    return;
  }
  const closed = await toggle.getAttribute("aria-expanded");
  if (closed !== "false") issue("mobile-menu-did-not-close", "Expected aria-expanded=false after navigation, got " + closed + ".");
}

async function checkMotionToggle(page) {
  currentRoute = "motion-toggle";
  const toggle = page.locator(".app-topbar [data-shell-motion-toggle]").first();
  if (!(await toggle.isVisible().catch(() => false))) {
    issue("motion-toggle-missing", "Workspace motion toggle is not visible.");
    return;
  }
  const before = await toggle.getAttribute("aria-pressed");
  await toggle.click();
  const after = await toggle.getAttribute("aria-pressed");
  if (before === after || after === null) issue("motion-toggle-not-toggling", "aria-pressed did not change (" + before + " -> " + after + ").");
  await toggle.click();
  const restored = await toggle.getAttribute("aria-pressed");
  if (restored !== before) issue("motion-toggle-not-restored", "Expected " + before + " after toggling twice, got " + restored + ".");
}

async function main() {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  server.listen(PORT, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const browser = await chromium.launch({ headless: true });
  try {
    for (const viewport of VIEWPORTS) {
      currentViewport = viewport.name;
      currentRoute = "intro";
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        reducedMotion: "no-preference",
        colorScheme: "dark"
      });
      const page = await context.newPage();
      const failedResources = [];
      page.on("pageerror", error => issue("javascript-exception", error.message));
      page.on("console", message => {
        if (message.type() === "error") issue("console-error", message.text());
      });
      page.on("requestfailed", request => {
        if (request.url().startsWith(ORIGIN)) {
          const failure = { url: request.url(), error: request.failure()?.errorText || "unknown" };
          failedResources.push(failure);
          issue("request-failed", "Local resource request failed.", failure);
        }
      });
      page.on("response", response => {
        if (response.url().startsWith(ORIGIN) && response.status() >= 400) {
          const failure = { url: response.url(), status: response.status() };
          failedResources.push(failure);
          issue("asset-http-error", "Local resource returned an HTTP error.", failure);
        }
      });

      await enterWorkspace(page);
      const viewportRecord = { ...viewport, routes: [], failedResources };
      for (const [route, expectedHeading] of ROUTES) {
        currentRoute = route;
        await page.evaluate(id => { window.location.hash = "#/" + id; }, route);
        await page.waitForFunction(id => window.location.hash === "#/" + id
          && document.querySelector('[data-nav-item][data-route="' + id + '"]')?.getAttribute("aria-current") === "page"
          && document.querySelector("[data-view-root] .view-page h1"), route, { timeout: 6000 });
        await page.waitForTimeout(130);
        const images = await ensureImages(page);
        for (const image of images) {
          if (!image.complete || image.naturalWidth === 0) {
            issue("broken-image", "An active workspace image failed to load or decode.", image);
          }
          if (!image.alt.trim()) issue("image-alt-missing", "An active workspace image has empty alternative text.", image);
        }
        const layout = await collectLayout(page, expectedHeading);
        const title = (await page.locator("[data-view-root] h1").first().innerText()).trim();
        let contactCTA = null;
        if (route === "contact") {
          contactCTA = await page.locator("[data-send-email]").evaluate(el => {
            const style = getComputedStyle(el);
            return {
              text: el.innerText.trim(),
              color: style.color,
              background: style.backgroundColor,
              opacity: style.opacity,
              visibility: style.visibility,
              fontSize: style.fontSize
            };
          });
          const ratio = contrastRatio(contactCTA.color, contactCTA.background);
          contactCTA.contrastRatio = ratio;
          if (!contactCTA.text) issue("contact-cta-label-missing", "Send email link has no visible label.", contactCTA);
          if (contactCTA.visibility !== "visible" || Number(contactCTA.opacity) < 0.95) issue("contact-cta-not-visible", "Send email link is hidden or faded in the settled view.", contactCTA);
          if (ratio !== null && ratio < 4.5) issue("contact-cta-low-contrast", "Send email label does not meet 4.5:1 text contrast.", contactCTA);
        }
        viewportRecord.routes.push({ id: route, expectedHeading, actualHeading: title, layout, images, contactCTA });
        await page.locator(".app-view-stage").evaluate(el => { el.scrollTop = 0; });
        await screenshot(page, "route-" + route + "-top.png");
        if (LONG_ROUTES.has(route)) {
          const scroll = await page.locator(".app-view-stage").evaluate(el => {
            el.scrollTop = el.scrollHeight;
            return { scrollHeight: el.scrollHeight, clientHeight: el.clientHeight };
          });
          if (scroll.scrollHeight > scroll.clientHeight + 2) {
            await page.waitForTimeout(100);
            await screenshot(page, "route-" + route + "-bottom.png");
            await page.locator(".app-view-stage").evaluate(el => { el.scrollTop = 0; });
          }
        }
      }
      await checkGalleryKeyboard(page);
      await checkMotionToggle(page);
      if (viewport.width <= 900) await checkMobileNavigation(page);
      report.viewports.push(viewportRecord);
      await context.close();
    }

    currentViewport = "mobile-390x844-reduced-motion";
    currentRoute = "reduced-motion";
    const reducedContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce",
      colorScheme: "dark"
    });
    const reducedPage = await reducedContext.newPage();
    reducedPage.on("pageerror", error => issue("javascript-exception", error.message));
    reducedPage.on("console", message => { if (message.type() === "error") issue("console-error", message.text()); });
    reducedPage.on("response", response => {
      if (response.url().startsWith(ORIGIN) && response.status() >= 400) issue("asset-http-error", "Local resource returned an HTTP error.", { url: response.url(), status: response.status() });
    });
    await reducedPage.goto(ORIGIN, { waitUntil: "load" });
    const prefersReducedMotion = await reducedPage.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
    if (!prefersReducedMotion) issue("reduced-motion-not-detected", "Browser context did not expose prefers-reduced-motion: reduce.");
    await screenshot(reducedPage, "00-intro-reduced-motion.png");
    await reducedPage.locator("[data-p2-skip]").click();
    await reducedPage.locator("[data-p2-login]").waitFor({ state: "visible", timeout: 4000 });
    await reducedPage.locator("[data-p2-login]").click();
    await reducedPage.waitForSelector("#app-shell:not([hidden])", { state: "visible", timeout: 7000 });
    await reducedPage.evaluate(() => { window.location.hash = "#/profile"; });
    await reducedPage.waitForFunction(() => document.querySelector('[data-nav-item][data-route="profile"]')?.getAttribute("aria-current") === "page");
    await screenshot(reducedPage, "01-profile-reduced-motion.png");
    await reducedContext.close();
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }

  report.summary = {
    viewportCount: report.viewports.length,
    routeChecks: routeCheckCount,
    screenshots: screenshotCount,
    issueCount: report.issues.length,
    issueTypes: report.issues.reduce((counts, item) => {
      counts[item.type] = (counts[item.type] || 0) + 1;
      return counts;
    }, {}),
    localAssetFailures: report.issues.filter(item => ["request-failed", "asset-http-error", "broken-image"].includes(item.type)).length,
    horizontalOverflowFailures: report.issues.filter(item => ["horizontal-overflow", "workspace-stage-overflow", "view-content-overflow"].includes(item.type)).length
  };
  fs.writeFileSync(path.join(OUT, "visual-qa-report.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report.summary, null, 2));
  if (report.issues.length) {
    console.error("Visual QA found issues. See artifacts/visual-qa/visual-qa-report.json and screenshots.");
    process.exitCode = 1;
  } else {
    console.log("PASS: local rendered visual QA, all 11 routes, responsive overflow checks, local images/assets, gallery keyboard controls, motion toggle, and reduced-motion context.");
  }
}

main().catch(error => {
  console.error(error);
  const fatalText = String(error.stack || error);
  report.issues.push({ type: "fatal-test-error", detail: fatalText, viewport: currentViewport, route: currentRoute });
  report.summary = {
    viewportCount: report.viewports.length,
    routeChecks: routeCheckCount,
    screenshots: screenshotCount,
    issueCount: report.issues.length,
    issueTypes: report.issues.reduce((counts, item) => {
      counts[item.type] = (counts[item.type] || 0) + 1;
      return counts;
    }, {})
  };
  try {
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(path.join(OUT, "visual-qa-fatal-error.txt"), fatalText);
    fs.writeFileSync(path.join(OUT, "visual-qa-report.json"), JSON.stringify(report, null, 2) + "\n");
  } catch {}
  process.exitCode = 1;
});
