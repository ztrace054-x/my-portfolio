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
  'id="phase2-gate"', "LEARNING STATS", "SYS MONITOR", "NETWORK DATA",
  "STATUS: LEARNING MODE", "data-p2-decode", "data-p2-login-layer",
  "data-p2-skip", "data-p2-login", "visitor@ztrace", "••••••••",
  "Visitor access — no account needed", "LABS COMPLETED — JUST STARTING",
  "Linux", "Networking", "Recon", "p2-map-dots", "phase2-gate__emblem"
]) assert.ok(html.includes(selector), "Missing gate UI requirement: " + selector);

assert.ok(!html.includes('id="intro" class="intro"'), "Legacy intro overlay must not run alongside the Phase 2 gate.");
assert.ok(html.includes("./css/phase-2-gate.css?v=20261019.1"), "Phase 2 stylesheet must be linked.");
assert.ok(html.includes("./js/main.js?v=20261020.2"), "Main module cache key must be bumped for Phase 2.");
assert.ok(main.includes("initPhase2Gate"), "Main startup must initialize the Phase 2 gate.");
assert.ok(main.includes("initDashboardShell"), "Main startup must initialize the Phase 3 workspace after the gate.");
assert.ok(main.includes("dashboard.activate()"), "The workspace must activate after the visitor gate completes.");

for (const behavior of [
  'new URLSearchParams(window.location.search).get("intro") === "1"',
  'sessionStorage.getItem(key)',
  'sessionStorage.setItem(key, value)',
  'window.matchMedia?.(REDUCED_MOTION_QUERY)',
  'document.addEventListener("visibilitychange"',
  'event.key === "Escape"',
  'event.key === "Enter"',
  "window.setInterval(",
  "clearInterval(clockTimer)",
  "const focusables = loginReady ? [loginButton, skipButton].filter(Boolean) : [skipButton].filter(Boolean)",
  "if (!done && !loginReady && !document.hidden) frameId = requestAnimationFrame(tick)",
  'root.classList.add("is-transitioning")',
  'url.hash = "/profile"'
]) assert.ok(gate.includes(behavior), "Missing gate behavior: " + behavior);

for (const cssRule of [
  ".phase2-gate__scene", ".phase2-gate__login-layer", ".phase2-gate.is-login-ready",
  ".phase2-gate.is-transitioning", "@media (max-width: 700px)",
  "@media (min-width: 1600px)", "@media (prefers-reduced-motion: reduce)",
  "html.phase2-paused"
]) assert.ok(css.includes(cssRule), "Missing responsive/motion CSS: " + cssRule);

assert.ok(!/\b(fetch|XMLHttpRequest|WebSocket)\s*\(/.test(gate), "The decorative gate must not make network/authentication requests.");
assert.ok(/readonly tabindex="-1"/.test(html), "Decorative input fields must not accept user edits or steal keyboard focus.");
console.log("Phase 2 gate checks passed: markup, scene components, route/session controls, reduced motion, responsive rules, and no-auth behavior.");
