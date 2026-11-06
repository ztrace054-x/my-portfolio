const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { chromium } = require("playwright");
const AxeBuilder = require("@axe-core/playwright").default;

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "artifacts", "visual-qa");
const PORT = 4173;
const ORIGIN = "http://127.0.0.1:" + PORT;
const VIEWPORTS = [
  { name: "desktop-1440x900", width: 1440, height: 900 },
  { name: "laptop-1280x800", width: 1280, height: 800 },
  { name: "tablet-1024x768", width: 1024, height: 768 },
  { name: "mobile-390x844", width: 390, height: 844 },
  { name: "narrow-320x700", width: 320, height: 700 }
];
const ROUTES = [
  ["profile", "Meet Md Saad"],
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
  accessibility: [],
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
      viewHeight: root ? root.scrollHeight : null,
      viewClientHeight: root ? root.clientHeight : null,
      viewWidth: root ? root.scrollWidth : null,
      viewClientWidth: root ? root.clientWidth : null,
      heading: heading ? heading.innerText.trim() : "",
      documentTitle: document.title,
      fontsStatus: document.fonts ? document.fonts.status : "unknown",
      spaceGroteskLoaded: document.fonts ? document.fonts.check('16px "Space Grotesk"') : false,
      jetBrainsMonoLoaded: document.fonts ? document.fonts.check('16px "JetBrains Mono"') : false
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
  if (!result.spaceGroteskLoaded || !result.jetBrainsMonoLoaded) {
    issue("font-not-loaded", "One or more self-hosted workspace font families did not resolve.", result);
  }
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
  currentRoute = "phantom-signal-intro";
  await page.goto(ORIGIN, { waitUntil: "load" });
  await page.evaluate(() => document.fonts ? document.fonts.ready : Promise.resolve());
  await page.waitForSelector("#phase2-gate:not([hidden])", { state: "visible", timeout: 7000 });
  await page.waitForFunction(() => document.querySelector("#phase2-gate")?.dataset.release === "phantom-signal-20261106.4");
  await screenshot(page, "00-phantom-signal-intro.png");

  const introText = await page.locator("#phase2-gate").evaluate(el => el.textContent || "");
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
  for (const quote of requiredQuotes) {
    if (!introText.includes(quote)) issue("intro-quote-missing", "An exact Phantom Signal quote is missing.", { quote });
  }
  const portrait = await page.locator(".phantom-intro__portrait").evaluate(img => ({
    src: img.getAttribute("src"), complete: img.complete,
    naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight,
    alt: img.alt
  }));
  if (!portrait.complete || portrait.naturalWidth < 300 || !portrait.alt.trim()) {
    issue("phantom-portrait-not-loaded", "The original Phantom Signal portrait did not load with useful alternative text.", portrait);
  }
  if (!portrait.src.includes("phantom-signal-hero.webp")) {
    issue("phantom-original-image-not-used", "The Phantom Signal original portrait asset is not used.", portrait);
  }

  const introDesign = await page.locator("#phase2-gate").evaluate(el => {
    const title = el.querySelector(".phantom-intro__title");
    const signal = title?.querySelector("span");
    const echoes = el.querySelector(".phantom-intro__echoes");
    const footer = el.querySelector(".phantom-intro__ticker");
    return {
      titleSize: title ? parseFloat(getComputedStyle(title).fontSize) : 0,
      signalDisplay: signal ? getComputedStyle(signal).display : "",
      echoColumns: echoes ? getComputedStyle(echoes).gridTemplateColumns.trim().split(/\\s+/).length : 0,
      footerPosition: footer ? getComputedStyle(footer).position : ""
    };
  });
  if (introDesign.titleSize < 44 || introDesign.signalDisplay !== "block") {
    issue("intro-title-hierarchy", "The cinematic intro title must render as a large, two-line wordmark.", introDesign);
  }
  if (page.viewportSize().width <= 560 && introDesign.echoColumns < 2) {
    issue("intro-mobile-quote-grid", "The supplemental quotes should use a compact two-column mobile layout.", introDesign);
  }
  if (introDesign.footerPosition !== "sticky") {
    issue("intro-controls-not-sticky", "Intro controls must remain reachable in the sticky footer.", introDesign);
  }

  const skipName = await page.locator("[data-p2-skip]").evaluate(el => ({
    text: el.innerText.replace(/\s+/g, " ").trim(),
    ariaLabel: el.getAttribute("aria-label")
  }));
  if (!skipName.text.toLowerCase().includes("skip intro")) {
    issue("intro-skip-name-mismatch", "Skip button accessible name must include its visible text.", skipName);
  }
  const tickerMetrics = await page.locator(".phantom-intro__ticker").evaluate(el => {
    const rect = el.getBoundingClientRect();
    const children = Array.from(el.children).filter(child => getComputedStyle(child).display !== "none").map(child => {
      const childRect = child.getBoundingClientRect();
      return { text: child.innerText.trim(), top: childRect.top, bottom: childRect.bottom, left: childRect.left, right: childRect.right };
    });
    return { top: rect.top, bottom: rect.bottom, clientHeight: el.clientHeight, scrollHeight: el.scrollHeight, viewportHeight: innerHeight, viewportWidth: innerWidth, children };
  });
  if (tickerMetrics.scrollHeight > tickerMetrics.clientHeight + 2
      || tickerMetrics.children.some(child => child.bottom > tickerMetrics.bottom + 1 || child.left < -1 || child.right > tickerMetrics.viewportWidth + 1)) {
    issue("intro-footer-clipped", "Intro controls or footer text overflow their visible area.", tickerMetrics);
  }
  if (page.viewportSize().width <= 560) {
    const smallText = await page.evaluate(() => [
      ".phantom-intro__topbar", ".phantom-intro__quote-group p",
      ".phantom-intro__echo p", ".phantom-intro__button"
    ].map(selector => {
      const el = document.querySelector(selector);
      return { selector, fontSize: el ? parseFloat(getComputedStyle(el).fontSize) : null };
    }));
    for (const item of smallText) if (item.fontSize !== null && item.fontSize < 12) {
      issue("mobile-intro-small-text", "Intro text is below 12px on a mobile viewport.", item);
    }
  }
  const geometry = await page.locator("#phase2-gate").evaluate(el => ({
    rootWidth: el.clientWidth, rootScrollWidth: el.scrollWidth,
    viewportWidth: innerWidth, bodyScrollWidth: document.documentElement.scrollWidth
  }));
  // Short viewports intentionally scroll so all four cards retain readable text.
  await page.locator("#phase2-gate").evaluate(el => { el.scrollTop = el.scrollHeight; });
  const quoteLayout = await page.locator("#phase2-gate").evaluate(el => {
    const echoes = el.querySelector(".phantom-intro__echoes")?.getBoundingClientRect();
    const footer = el.querySelector(".phantom-intro__ticker")?.getBoundingClientRect();
    return { echoesBottom: echoes?.bottom ?? 0, footerTop: footer?.top ?? 0 };
  });
  if (page.viewportSize().width <= 560 && quoteLayout.echoesBottom > quoteLayout.footerTop + 2) {
    issue("intro-quotes-overlap-controls", "The mobile quote cards overlap the intro controls.", quoteLayout);
  }
  if (geometry.rootScrollWidth > geometry.rootWidth + 2 || geometry.bodyScrollWidth > geometry.viewportWidth + 2) {
    issue("intro-horizontal-overflow", "Phantom Signal intro causes horizontal overflow.", geometry);
  }
  const portraitVisible = await page.locator(".phantom-intro__portrait").isVisible().catch(() => false);
  if (!portraitVisible) issue("intro-portrait-not-visible", "The original hooded portrait is not visible.");

  await page.locator("[data-p2-skip]").click();
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
  await screenshot(page, "gallery-lightbox-open.png");
  await page.keyboard.press("ArrowRight");
  let position = (await page.locator("#phase6-lightbox-position").innerText()).trim();
  if (position !== "2 of 3") issue("gallery-next-key-failed", 'Expected "2 of 3" after ArrowRight, got "' + position + '".');
  await page.keyboard.press("ArrowLeft");
  position = (await page.locator("#phase6-lightbox-position").innerText()).trim();
  if (position !== "1 of 3") issue("gallery-previous-key-failed", 'Expected "1 of 3" after ArrowLeft, got "' + position + '".');
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
  for (const [route] of ROUTES) {
    try {
      if ((await toggle.getAttribute("aria-expanded")) !== "true") await toggle.click({ timeout: 5000 });
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
      if (route === "profile") await screenshot(page, "03-mobile-drawer-open.png");
      const link = page.locator('[data-nav-item][data-route="' + route + '"]');
      await link.focus();
      await page.keyboard.press("Enter");
      await page.waitForFunction(id => window.location.hash === "#/" + id
        && document.querySelector('[data-nav-item][data-route="' + id + '"]')?.getAttribute("aria-current") === "page", route, { timeout: 5000 });
      const closed = await toggle.getAttribute("aria-expanded");
      if (closed !== "false") issue("mobile-menu-did-not-close", "Expected aria-expanded=false after navigating to " + route + ", got " + closed + ".");
    } catch (error) {
      issue("mobile-nav-link-unusable", "Mobile navigation failed for " + route + ": " + error.message);
      return;
    }
  }
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

async function checkDesktopNavigation(page) {
  currentRoute = "desktop-navigation";
  for (const [route] of ROUTES) {
    const link = page.locator('[data-nav-item][data-route="' + route + '"]');
    if (!(await link.isVisible().catch(() => false))) {
      issue("desktop-nav-link-missing", "Desktop navigation link is not visible for " + route + ".");
      continue;
    }
    await link.focus();
    const focusState = await link.evaluate(el => ({
      focused: document.activeElement === el,
      href: el.getAttribute("href"),
      text: el.innerText.trim()
    }));
    console.log("Desktop keyboard navigation:", route, JSON.stringify(focusState));
    await page.keyboard.press("Enter");
    try {
      await page.waitForFunction(id => window.location.hash === "#/" + id
        && document.querySelector('[data-nav-item][data-route="' + id + '"]')?.getAttribute("aria-current") === "page", route, { timeout: 6000 });
    } catch (error) {
      const state = await page.evaluate(() => ({
        hash: window.location.hash,
        activeElement: document.activeElement?.outerHTML?.slice(0, 500) || "",
        activeRoute: document.querySelector('[data-nav-item][aria-current="page"]')?.dataset.route || "",
        sidebarOpen: document.querySelector("#app-shell")?.classList.contains("is-sidebar-open"),
        targetRoute: document.querySelector('[data-nav-item][data-route="' + location.hash.slice(2) + '"]')?.dataset.route || ""
      }));
      throw new Error("Desktop keyboard navigation failed for " + route + ": " + JSON.stringify({ focusState, state, cause: error.message }));
    }
  }
}

async function checkProfileAndProjects(page) {
  currentRoute = "profile-content";
  await page.evaluate(() => { window.location.hash = "#/profile"; });
  await page.waitForFunction(() => document.querySelector('[data-nav-item][data-route="profile"]')?.getAttribute("aria-current") === "page");
  await page.waitForFunction(() => document.querySelector("[data-view-root] .view-page h1")?.textContent.trim() === "Meet Md Saad", { timeout: 6000 });
  const profile = (await page.locator("[data-view-root]").innerText()).replace(/\s+/g, " ");
  for (const phrase of ["Meet Md Saad", "CSE student", "beginning of a cybersecurity journey", "LEARNING IN PUBLIC"]) {
    if (!profile.includes(phrase)) issue("profile-content-missing", "Profile is missing expected content: " + phrase + ".");
  }
  currentRoute = "projects-content";
  await page.evaluate(() => { window.location.hash = "#/projects"; });
  await page.waitForFunction(() => document.querySelector('[data-nav-item][data-route="projects"]')?.getAttribute("aria-current") === "page");
  await page.waitForFunction(() => document.querySelector("[data-view-root] .project-card h2")?.textContent.trim() === "ZTRACE Cybersecurity Learning Portfolio", { timeout: 6000 });
  const projects = (await page.locator("[data-view-root]").innerText()).replace(/\s+/g, " ");
  if (!projects.includes("ZTRACE Cybersecurity Learning Portfolio")) issue("project-title-missing", "The repository-backed portfolio project title is missing.");
  if (!projects.includes("In progress")) issue("project-status-missing", "The portfolio project must remain marked In progress.");
  const sourceLink = page.locator('[data-view-root] a[href="https://github.com/ztrace054-x/my-portfolio"]');
  if (!(await sourceLink.count())) issue("project-source-link-missing", "The project source link is missing or changed.");
}

async function checkCertificatePreviewAndDownload(page) {
  currentRoute = "certificate-preview-download";
  await page.evaluate(() => { window.location.hash = "#/certificates"; });
  await page.waitForFunction(() => document.querySelector('[data-nav-item][data-route="certificates"]')?.getAttribute("aria-current") === "page"
    && document.querySelector("[data-certificate-open]"));
  const earned = await page.locator(".certificate-earned").innerText();
  for (const phrase of ["Ethical Hacking for Beginners", "Byte Capsule", "MD SAAD", "7482ZWKQ", "November 01, 2026"]) {
    if (!earned.includes(phrase)) issue("certificate-record-missing", "Earned certificate record is missing: " + phrase + ".");
  }
  const trigger = page.locator(".certificate-actions [data-certificate-open]").first();
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.locator("#certificate-preview");
  await page.waitForFunction(() => document.querySelector("#certificate-preview")?.open === true);
  const image = dialog.locator("img");
  await image.evaluate(el => el.decode());
  const dimensions = await image.evaluate(el => ({ width: el.naturalWidth, height: el.naturalHeight, alt: el.alt }));
  if (dimensions.width !== 1123 || dimensions.height !== 794 || !dimensions.alt) {
    issue("certificate-preview-image-invalid", "Certificate preview did not load the original accessible image.", dimensions);
  }
  await screenshot(page, "certificate-preview-open.png");
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => document.querySelector("#certificate-preview")?.open === false);
  if (!(await trigger.evaluate(el => document.activeElement === el))) {
    issue("certificate-focus-not-restored", "Closing the certificate preview did not restore focus to its trigger.");
  }
  try {
    const downloadPromise = page.waitForEvent("download", { timeout: 7000 });
    await page.locator(".certificate-actions a[download]").click();
    const download = await downloadPromise;
    if (download.suggestedFilename() !== "Md_Saad_Certificate.png") {
      issue("certificate-download-name", "Unexpected certificate download filename: " + download.suggestedFilename() + ".");
    }
    const downloadedPath = await download.path();
    if (!downloadedPath || !fs.existsSync(downloadedPath) || fs.statSync(downloadedPath).size < 10000) {
      issue("certificate-download-empty", "The certificate download did not produce the original image bytes.");
    }
  } catch (error) {
    issue("certificate-download-failed", "Certificate download did not complete: " + error.message);
  }
}

async function checkContactLinksAndCopy(page) {
  currentRoute = "contact-links-copy";
  await page.evaluate(() => { window.location.hash = "#/contact"; });
  await page.waitForFunction(() => document.querySelector('[data-nav-item][data-route="contact"]')?.getAttribute("aria-current") === "page"
    && document.querySelector("[data-copy-email]"));
  const email = await page.locator("[data-email-link]").getAttribute("href");
  const send = await page.locator("[data-send-email]").getAttribute("href");
  if (email !== "mailto:ztrace054@gmail.com" || send !== "mailto:ztrace054@gmail.com") {
    issue("contact-email-link-invalid", "Email links must retain the original mailto destination.", { email, send });
  }
  const expected = [
    ["GitHub", "https://github.com/ztrace054-x"],
    ["TryHackMe", "https://tryhackme.com/p/mdsaad01755"],
    ["ZeroDayTest", "https://zt.zerodaytest.com/dashboard/profile"],
    ["Instagram", "https://www.instagram.com/mdsaad01755/"]
  ];
  const actual = await page.locator(".phase6-social-link").evaluateAll(nodes => nodes.map(node => ({
    name: node.querySelector("strong")?.textContent.trim(),
    href: node.getAttribute("href")
  })));
  for (const [name, href] of expected) {
    if (!actual.some(item => item.name === name && item.href === href)) {
      issue("contact-social-link-invalid", "Missing or changed contact destination for " + name + ".", { actual });
    }
  }
  await page.locator("[data-copy-email]").click();
  await page.waitForFunction(() => document.querySelector("[data-copy-status]")?.textContent.trim() !== "", { timeout: 5000 });
  const status = (await page.locator("[data-copy-status]").innerText()).trim();
  if (status !== "Copied") issue("copy-email-failed", "Copy email feedback was not successful: " + status + ".");
  try {
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    if (clipboard !== "ztrace054@gmail.com") issue("copy-email-clipboard-mismatch", "Clipboard content did not match the displayed email.");
  } catch (error) {
    issue("copy-email-clipboard-unreadable", "The browser clipboard could not be verified: " + error.message);
  }
}

async function checkIntroReplay(page) {
  currentRoute = "intro-replay";
  await page.locator('[data-panel-open="settings"]').first().click();
  await page.waitForFunction(() => {
    const panel = document.querySelector('[data-app-panel="settings"]');
    return panel && !panel.hidden && panel.getAttribute("aria-hidden") === "false";
  });
  await screenshot(page, "settings-panel-open.png");
  await page.locator("[data-replay-intro]").click();
  await page.waitForFunction(() => new URL(window.location.href).searchParams.get("intro") === "1", null, { timeout: 7000 });
  await page.waitForSelector("#phase2-gate:not([hidden])", { state: "visible", timeout: 7000 });
  await screenshot(page, "phantom-signal-replay.png");
  const text = await page.locator("#phase2-gate").evaluate(el => el.textContent || "");
  if (!text.includes("I'm already everywhere.") || !text.includes("You fear the unknown. The unknown knows your name.")) {
    issue("replay-quotes-missing", "Replay intro did not render the full Phantom Signal copy.");
  }
  await page.locator("[data-p2-login]").click();
  await page.waitForSelector("#app-shell:not([hidden])", { state: "visible", timeout: 7000 });
  await page.waitForFunction(() => document.body.classList.contains("app-shell-active"));
  await page.waitForFunction(() => document.querySelector("#phase2-gate")?.hidden === true);
}
async function checkAccessibility(page) {
  currentRoute = "accessibility";
  try {
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
      .analyze();
    const violations = results.violations.map(item => ({
      id: item.id,
      impact: item.impact,
      help: item.help,
      nodes: item.nodes.length,
      selectors: item.nodes.slice(0, 4).map(node => node.target)
    }));
    report.accessibility.push({ viewport: currentViewport, route: currentRoute, passes: results.passes.length, violations });
    for (const item of violations.filter(item => ["critical", "serious"].includes(item.impact))) {
      issue("accessibility-" + item.impact, item.id + ": " + item.help, item);
    }
  } catch (error) {
    issue("accessibility-audit-error", "Axe accessibility audit failed: " + error.message);
  }
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
        colorScheme: "dark",
        acceptDownloads: true
      });
      try { await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: ORIGIN }); } catch {}
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
        if (viewport.width === 1440 || viewport.width === 390) await checkAccessibility(page);
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
        await page.locator("[data-view-root]").evaluate(el => { el.scrollTop = 0; });
        await screenshot(page, "route-" + route + "-top.png");
        const scroll = await page.locator("[data-view-root]").evaluate(el => {
          el.scrollTop = el.scrollHeight;
          return { scrollHeight: el.scrollHeight, clientHeight: el.clientHeight };
        });
        if (scroll.scrollHeight > scroll.clientHeight + 2) {
          await page.waitForTimeout(100);
          await screenshot(page, "route-" + route + "-bottom.png");
          await page.locator("[data-view-root]").evaluate(el => { el.scrollTop = 0; });
        }
      }
      await checkGalleryKeyboard(page);
      await checkMotionToggle(page);
      if (viewport.width >= 1280) await checkDesktopNavigation(page);
      if (viewport.width <= 900) await checkMobileNavigation(page);
      if (viewport.width === 1440 || viewport.width === 390) {
        await checkProfileAndProjects(page);
        await checkCertificatePreviewAndDownload(page);
        await checkContactLinksAndCopy(page);
      }
      if (viewport.width === 1440) await checkIntroReplay(page);
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
    await reducedPage.waitForSelector("#phase2-gate:not([hidden])", { state: "visible", timeout: 7000 });
    const prefersReducedMotion = await reducedPage.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
    const staticIntro = await reducedPage.locator("#phase2-gate").evaluate(el => el.classList.contains("is-static"));
    if (!prefersReducedMotion || !staticIntro) issue("reduced-motion-not-detected", "The reduced-motion preference was not applied to the Phantom Signal intro.");
    await screenshot(reducedPage, "00-intro-reduced-motion.png");
    await reducedPage.locator("[data-p2-skip]").click();
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
    accessibilityAudits: report.accessibility.length,
    severeAccessibilityViolations: report.accessibility.reduce((total, item) => total + item.violations.filter(v => ["critical", "serious"].includes(v.impact)).length, 0),
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
