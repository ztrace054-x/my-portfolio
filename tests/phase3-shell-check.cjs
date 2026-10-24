const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const required = [
  "index.html", "css/dashboard-shell.css", "js/dashboard-shell.js", "js/router.js",
  "js/views/index.js", "js/views/profile.js", "js/views/dashboard.js", "js/views/projects.js",
  "js/data/projects.js",
  "js/views/attack-surface.js", "js/views/skill-progress.js", "js/views/learning-path.js",
  "js/views/write-ups.js", "js/views/automation.js", "js/views/certificates.js",
  "js/views/gallery.js", "js/views/contact.js", "tests/phase3-shell-check.cjs"
];
for (const file of required) assert.ok(fs.existsSync(path.join(root, file)), "Missing Phase 3 file: " + file);

const html = read("index.html");
const css = read("css/dashboard-shell.css");
const shell = read("js/dashboard-shell.js");
const main = read("js/main.js");
const routerSource = read("js/router.js");
const navigation = read("js/navigation.js");
const registrySource = read("js/views/index.js");

for (const route of [
  "profile", "dashboard", "projects", "attack-surface", "skill-progress", "learning-path",
  "write-ups", "automation", "certificates", "gallery", "contact"
]) {
  assert.ok(html.includes('href="#/' + route + '"'), "Missing sidebar route: " + route);
  assert.ok(registrySource.includes('id: "' + route + '"'), "Missing registered view: " + route);
  const viewPath = "js/views/" + route + ".js";
  assert.match(read(viewPath), /export function render\s*\(/, "Every route module must export render(): " + viewPath);
}
assert.ok(html.includes('id="app-shell"'), "App shell root is missing.");
assert.ok(html.includes('id="app-sidebar"'), "Mobile drawer target ID is missing.");
assert.ok(html.includes('data-view-title'), "Top bar must expose the active view title.");
assert.ok(html.includes('data-nav-search'), "Search input is missing.");
assert.ok(html.includes("LEARNING TO DATE"), "Decorative learning-to-date control is missing.");
assert.ok(html.includes("Next step: recon basics"), "Recon learning notification is missing.");
assert.ok(html.includes("Learning in public"), "Learning-in-public notification is missing.");
assert.ok(html.includes(">Welcome</h3>"), "Welcome workspace note is missing.");
assert.ok(html.includes("Workspace notes"), "The notes panel must use an honest static-notes label.");
assert.ok(!html.includes("data-notification-count") && !html.includes("3 unread"), "Static notes must not display fabricated unread counts.");
assert.ok(!shell.includes('storage.set("notifications-read", "on")'), "Static workspace notes must not simulate unread state.");
assert.ok((html.match(/<svg\b/g) || []).length >= 14, "Sidebar and top bar should use inline SVG icons.");
assert.ok(html.includes("./css/dashboard-shell.css?v=20261020.2"), "Dashboard stylesheet cache key must match the current shell CSS.");
assert.ok(main.includes("./dashboard-shell.js?v=20261024.2"), "Dashboard shell module cache key must match the current shell JS.");
assert.ok(html.includes("./js/main.js?v=20261024.2"), "Main module cache key must be bumped.");
assert.ok(main.includes("initDashboardShell") && main.includes("dashboard.activate()"), "Shell must activate after the gate.");
assert.ok(navigation.includes("hash.startsWith('#/')"), "Legacy anchor handling must not intercept dashboard hash routes.");

for (const selector of [
  ".app-sidebar", ".app-nav-link[aria-current=\"page\"]", ".app-shell.is-collapsed",
  ".app-period { position: relative;", ".app-period svg { position: absolute; top: 50%; right: 0;",
  ".app-shell.is-sidebar-open", ".app-view-root.is-view-entering", ".app-view-root.is-view-leaving { opacity: 0; transform: translate3d(0, 8px, 0); transition: opacity 100ms ease", "@keyframes app-view-scan",
  ".app-side-panel", ".app-setting-select", "@media (max-width: 900px)",
  "@media (max-width: 650px)", "@media (prefers-reduced-motion: reduce)"
]) assert.ok(css.includes(selector), "Missing shell layout/motion rule: " + selector);

for (const behavior of [
  'createRouter({ routes: ROUTES, fallback: "profile", onRoute: renderRoute })',
  'event.key === "Escape" && shell.classList.contains("is-sidebar-open")',
  'new MotionController()',
  'motion.setEnabled(!motion.enabled)',
  'motion.setIntensity(intensitySelect.value)',
  'url.searchParams.set("intro", "1")',
  'link.hidden = !matches',
  'panel.querySelector("[data-panel-close]")?.focus',
  'aria-current'
]) assert.ok(shell.includes(behavior), "Missing shell behavior: " + behavior);
assert.ok(!/\b(fetch|XMLHttpRequest|WebSocket)\s*\(/.test(shell), "Phase 3 shell must remain static and make no network requests.");

async function loadSourceModule(file, context, cache = new Map()) {
  const normalized = path.posix.normalize(file);
  if (cache.has(normalized)) return cache.get(normalized);
  const source = read(normalized);
  const module = new vm.SourceTextModule(source, { context, identifier: normalized });
  cache.set(normalized, module);
  await module.link(specifier => {
    const clean = specifier.split("?", 1)[0];
    const target = path.posix.normalize(path.posix.join(path.posix.dirname(normalized), clean));
    return loadSourceModule(target, context, cache);
  });
  await module.evaluate();
  return module;
}

async function checkRouter() {
  let hash = "";
  const listeners = new Map();
  const location = {
    pathname: "/my-portfolio/",
    search: "",
    href: "https://example.test/my-portfolio/",
    get hash() { return hash; },
    set hash(value) {
      hash = value;
      for (const callback of listeners.get("hashchange") || []) callback();
    }
  };
  const history = {
    state: null,
    replaceState(_state, _title, value) {
      const url = new URL(value, location.href);
      location.pathname = url.pathname;
      location.search = url.search;
      location.href = url.href;
      hash = url.hash;
    }
  };
  const windowRef = {
    location,
    history,
    addEventListener(type, callback) { const set = listeners.get(type) || new Set(); set.add(callback); listeners.set(type, set); },
    removeEventListener(type, callback) { listeners.get(type)?.delete(callback); }
  };
  const context = vm.createContext({ window: windowRef, URL, console });
  const module = await loadSourceModule("js/router.js", context);
  const transitions = [];
  const routes = { profile: { label: "Profile" }, dashboard: { label: "Dashboard" } };
  const router = module.namespace.createRouter({ routes, fallback: "profile", onRoute: event => transitions.push([event.id, event.previous]) });
  assert.equal(location.hash, "#/profile", "Empty route should normalize to #/profile.");
  assert.equal(router.current, "profile");
  assert.equal(transitions.length, 1);
  assert.equal(router.navigate("dashboard"), true);
  assert.equal(location.hash, "#/dashboard");
  assert.equal(router.current, "dashboard");
  assert.deepEqual(transitions[1], ["dashboard", "profile"]);
  assert.equal(router.navigate("not-a-view"), false, "Unknown routes should be rejected.");
  router.dispose();
  assert.equal(router.navigate("profile"), true);
  assert.equal(router.current, "dashboard", "Disposed router must not handle later hash changes.");

  hash = "#profile";
  const secondHistory = { ...history, replaceState: history.replaceState.bind(history) };
  const secondWindow = { ...windowRef, location, history: secondHistory };
  const secondContext = vm.createContext({ window: secondWindow, URL, console });
  const secondModule = await loadSourceModule("js/router.js", secondContext);
  const secondRouter = secondModule.namespace.createRouter({ routes, fallback: "profile" });
  assert.equal(location.hash, "#/profile", "Valid but non-canonical hashes should gain the slash prefix.");
  secondRouter.dispose();
}

async function checkViews() {
  const context = vm.createContext({ console, EventTarget, Event, URL, URLSearchParams, setTimeout, clearTimeout, performance });
  const cache = new Map();
  const viewFiles = [
    "profile", "dashboard", "attack-surface", "skill-progress", "learning-path",
    "write-ups", "automation", "certificates", "gallery", "contact"
  ];
  const rendered = {};
  for (const id of viewFiles) {
    const module = await loadSourceModule("js/views/" + id + ".js", context, cache);
    assert.equal(typeof module.namespace.render, "function", "render() export missing for " + id);
    rendered[id] = module.namespace.render();
    assert.ok(rendered[id].includes('id="view-heading"'), "View heading missing for " + id);
  }
  assert.ok(rendered.profile.includes("Learn responsibly. Practice with permission."), "Profile must preserve the existing ethical-practice principle.");
  assert.ok(rendered.profile.includes("Byte Capsule"), "Profile must use the existing course data.");
  assert.equal((rendered.dashboard.match(/class="stat-number"[^>]*>0<\/p>/g) || []).length, 5, "Dashboard should display five honest zero-state metrics.");
  assert.ok(rendered.dashboard.includes("No data yet — I'm just starting"), "Dashboard must not invent recent activity.");
  assert.ok(rendered["attack-surface"].includes("Authorized practice only"), "Attack Surface must show its authorization banner.");
  assert.ok(rendered["attack-surface"].includes("NO DATA"), "Attack Surface radar must remain empty.");
  assert.ok(rendered.certificates.includes("Not earned yet"), "Certificate cards must remain unearned.");
  assert.ok(rendered.certificates.includes("Planned"), "Certificate cards must be marked as planned.");
}
(async () => {
  await checkRouter();
  await checkViews();
  console.log("Phase 3 shell checks passed: 11 route modules, canonical hash routing, zero-state data, responsive shell rules, settings hooks, workspace notes, and no network calls.");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
