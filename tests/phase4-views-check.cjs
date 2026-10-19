const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const rootDir = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(rootDir, file), "utf8");

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
function mockTarget(selector, values = {}) {
  return { ...values, matches(value) { return value === selector; }, dataset: values.dataset || {}, textContent: values.textContent || "", hidden: false };
}

async function run() {
  const context = vm.createContext({
    console, EventTarget, Event, URL, URLSearchParams, setTimeout, clearTimeout, performance,
    navigator: { clipboard: { writeText: async () => true } }
  });
  const cache = new Map();
  const profileModule = await loadSourceModule("js/views/profile.js", context, cache);
  const dashboardModule = await loadSourceModule("js/views/dashboard.js", context, cache);
  const dataModule = await loadSourceModule("js/data/learning-log.js", context, cache);
  const profileHtml = profileModule.namespace.render();
  const dashboardHtml = dashboardModule.namespace.render();

  for (const phrase of [
    "Portrait of Saad", "@ZTRACE", "SSC student", "Cybersecurity beginner",
    "Beginner", "Learning in public", "Byte Capsule", "Ethical Hacking for Beginners",
    "networking", "Linux", "reconnaissance", "ethics", "InshaAllah",
    "I'm choosing to make my beginning visible.", "Learn responsibly. Practice with permission.",
    "whoami", "cat status.txt", "data-copy-email", "GitHub", "TryHackMe", "ZeroDayTest", "Instagram"
  ]) assert.ok(profileHtml.includes(phrase), "Profile is missing required content: " + phrase);
  assert.ok(profileHtml.includes("./assets/saad-golden.jpg"), "Profile must use the existing golden portrait.");
  assert.ok(profileHtml.includes('href="mailto:ztrace054@gmail.com"'), "Email link must remain available.");
  assert.ok(profileHtml.includes("profile-copy-feedback"), "Copy action needs accessible feedback.");

  assert.equal((dashboardHtml.match(/class="stat-number"[^>]*>0<\/p>/g) || []).length, 5, "Dashboard must show five zero-valued metric cards.");
  for (const label of ["Labs Completed", "CTF Challenges", "Write-ups", "Certificates", "Rooms Completed"]) assert.ok(dashboardHtml.includes(label), "Dashboard metric missing: " + label);
  assert.equal((dashboardHtml.match(/class="chart-pulse/g) || []).length, 2, "Both empty charts need an animated pulse.");
  assert.ok(dashboardHtml.includes("No data yet — I'm just starting"), "Charts must state that there is no data.");
  assert.ok((dashboardHtml.match(/<title>No data yet<\/title>/g) || []).length >= 8, "Chart hover targets must expose No data yet tooltips.");
  assert.ok(dashboardHtml.includes('data-chart-period="activity"') && dashboardHtml.includes('data-chart-period="progress"'), "Both chart period controls must be present.");
  for (const column of ["Topic", "Status", "Level", "Notes"]) assert.ok(dashboardHtml.includes('scope="col">' + column), "Learning Log column missing: " + column);
  for (const topic of ["Linux fundamentals", "Networking basics", "Recon concepts", "Authorized labs", "Beginner CTFs", "Certifications"]) assert.ok(dashboardHtml.includes(topic), "Learning Log topic missing: " + topic);
  assert.equal(dataModule.namespace.learningLog.length, 6, "Learning Log should contain six honest starter rows.");

  const search = mockTarget("[data-learning-log-search]", { value: "" });
  const filter = mockTarget("[data-learning-log-filter]", { value: "all" });
  const rows = dataModule.namespace.learningLog.map(item => ({ textContent: [item.topic, item.status, item.level, item.notes].join(" "), dataset: { status: item.status }, hidden: false }));
  const empty = { hidden: true }, count = { textContent: "" }, activityLabel = { textContent: "" };
  const period = mockTarget("[data-chart-period]", { value: "Weekly", dataset: { chartPeriod: "activity" } });
  const counters = Array.from({ length: 5 }, (_, index) => ({ dataset: { countUp: "0" }, textContent: String(index) }));
  const listeners = {};
  const dashboardRoot = {
    addEventListener(type, callback) { listeners[type] = callback; },
    removeEventListener(type) { delete listeners[type]; },
    querySelectorAll(selector) {
      if (selector === "[data-count-up]") return counters;
      if (selector === "[data-learning-log-row]") return rows;
      return [];
    },
    querySelector(selector) {
      if (selector === "[data-learning-log-search]") return search;
      if (selector === "[data-learning-log-filter]") return filter;
      if (selector === "[data-learning-log-empty]") return empty;
      if (selector === "[data-learning-log-count]") return count;
      if (selector.includes('data-period-label="activity"')) return activityLabel;
      return null;
    }
  };
  const disposeDashboard = dashboardModule.namespace.mount(dashboardRoot);
  search.value = "linux";
  listeners.input({ target: search });
  assert.equal(rows.filter(row => !row.hidden).length, 1, "Search should filter Learning Log rows.");
  assert.ok(!rows[0].hidden && rows.slice(1).every(row => row.hidden), "Search should retain the matching Linux row only.");
  search.value = "";
  filter.value = "Planned";
  listeners.change({ target: filter });
  assert.equal(rows.filter(row => !row.hidden).length, 2, "Status filter should return both planned topics.");
  assert.equal(count.textContent, "2 of 6 topics shown");
  period.value = "Last Month";
  listeners.change({ target: period });
  assert.equal(activityLabel.textContent, "No data yet — I'm just starting · Last Month", "Period selection must change the label only.");
  disposeDashboard();

  const copyLabel = { textContent: "Copy email" }, feedback = { textContent: "" };
  const copyButton = { disabled: false, setAttribute() {}, querySelector() { return copyLabel; } };
  const profileListeners = {};
  const profileRoot = {
    addEventListener(type, callback) { profileListeners[type] = callback; },
    removeEventListener(type) { delete profileListeners[type]; },
    querySelector(selector) { return selector === "[data-copy-feedback]" ? feedback : null; }
  };
  const disposeProfile = profileModule.namespace.mount(profileRoot);
  await profileListeners.click({ target: { closest: selector => selector === "[data-copy-email]" ? copyButton : null } });
  assert.equal(copyLabel.textContent, "Copied!");
  assert.equal(feedback.textContent, "Email address copied.");
  disposeProfile();

  console.log("Phase 4 checks passed: profile facts/links/terminal/copy, five honest zero metrics, chart empty states/tooltips, six Learning Log rows, live search/filter, and period labels.");
}
run().catch(error => { console.error(error); process.exitCode = 1; });
