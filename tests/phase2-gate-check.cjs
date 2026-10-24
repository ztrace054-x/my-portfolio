const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const required = ["index.html", "css/phase-2-gate.css", "js/phase2-gate.js", "js/main.js"];
for (const file of required) assert.ok(fs.existsSync(path.join(root, file)), "Missing Phase 2 file: " + file);

const html = read("index.html");
const main = read("js/main.js");
const gate = read("js/phase2-gate.js");
const css = read("css/phase-2-gate.css");

for (const selector of [
  'id="phase2-gate"', "LEARNING FOCUS", "WORKING PRINCIPLES", "WORKSPACE / SECTIONS",
  "SYSTEM STATUS", "data-p2-decode", "data-p2-login-layer", "data-p2-skip", "data-p2-login",
  "Security is a practice.", "Enter workspace", "not authentication", "Linux fundamentals",
  "Networking basics", "Reconnaissance", "p2-map-dots", "phase2-gate__emblem", "phase2-gate__terminal"
]) assert.ok(html.includes(selector), "Missing gate UI requirement: " + selector);

assert.ok(!html.includes('id="intro" class="intro"'), "Legacy intro overlay must not run alongside the Phase 2 gate.");
assert.ok(html.includes("./css/phase-2-gate.css?v=20261024.1"), "Phase 2 stylesheet must be linked.");
assert.ok(html.includes("./js/main.js?v=20261024.1"), "Main module cache key must be current.");
assert.ok(/root\.classList\.add\("intro-pending"\)/.test(html), "The intro guard must activate in the head before the legacy page can paint.");
assert.ok(html.includes("html.intro-pending #page { visibility: hidden !important; }"), "Critical CSS must hide the legacy page while the intro initializes.");
assert.ok(html.includes('<div id="page">'), "Legacy content must remain usable when JavaScript is disabled.");
assert.ok(html.includes("<noscript><style>.phase2-gate{display:none!important}</style></noscript>"), "The gate must be bypassed when JavaScript is disabled.");
assert.ok(html.includes('document.getElementById("phase2-gate")?.setAttribute("hidden", "");'), "Module failure must reveal the legacy page instead of trapping visitors.");
assert.ok(!/<div id="phase2-gate"[^>]*\shidden(?:\s|>)/.test(html), "The intro overlay must be visible before the module finishes loading.");
assert.ok(gate.includes('document.documentElement.classList.remove("intro-pending")'), "The intro must release the initial visibility guard when it completes.");
assert.ok(main.includes("initPhase2Gate"), "Main startup must initialize the Phase 2 gate.");
assert.ok(main.includes("initDashboardShell"), "Main startup must initialize the Phase 3 workspace after the gate.");
assert.ok(main.includes("dashboard.activate()"), "The workspace must activate after the visitor gate completes.");

assert.ok(!gate.includes("sessionStorage"), "The intro must not be suppressed by a stored visit flag; it should appear on every page load.");
assert.ok(!gate.includes("shouldShowGate") && !gate.includes("enteredPreviously"), "Every page load must show the intro regardless of prior visits.");
assert.ok(gate.includes("removeReplayQuery();") && gate.includes("root.hidden = false;") && gate.includes("page.inert = true;"), "The gate must activate on each page load.");
for (const behavior of [
  'window.matchMedia?.(REDUCED_MOTION_QUERY)',
  'document.addEventListener("visibilitychange"',
  'event.key === "Escape"',
  'event.key === "Enter"',
  "window.setInterval(",
  "clearInterval(clockTimer)",
  "const focusables = loginReady ? [loginButton, skipButton].filter(Boolean) : [skipButton].filter(Boolean)",
  "if (!done && !loginReady && !document.hidden) frameId = requestAnimationFrame(tick)",
  'root.classList.add("is-transitioning")',
  'const requestedRoute = url.hash.match(/^#\\/([a-z-]+)/)?.[1];',
  'url.hash = "/" + (allowedRoutes.has(requestedRoute) ? requestedRoute : "profile");'
]) assert.ok(gate.includes(behavior), "Missing gate behavior: " + behavior);

for (const cssRule of [
  ".phase2-gate__scene", ".phase2-gate__login-layer", ".phase2-gate.is-login-ready",
  ".phase2-gate.is-transitioning", "@media (max-width: 700px)",
  "@media (min-width: 1600px)", "@media (prefers-reduced-motion: reduce)",
  "html.phase2-paused"
]) assert.ok(css.includes(cssRule), "Missing responsive/motion CSS: " + cssRule);

assert.ok(!/\b(fetch|XMLHttpRequest|WebSocket)\s*\(/.test(gate), "The decorative gate must not make network/authentication requests.");
assert.ok(!html.includes('id="p2-visitor-name"') && !html.includes('id="p2-visitor-key"'), "The intro must not imitate a credential form.");
console.log("Phase 2 gate checks passed: markup, scene components, per-load intro, reduced motion, responsive rules, and no-auth behavior.");
