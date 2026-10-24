const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const rootDir = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(rootDir, file), "utf8");
const htmlSource = read("index.html");
const mainSource = read("js/main.js");
const shellSource = read("js/dashboard-shell.js");
const workflowSource = read(".github/workflows/quality.yml");
assert.ok(fs.existsSync(path.join(rootDir, "assets/saad-golden.jpg")), "The existing profile portrait asset must exist.");
assert.match(htmlSource, /js\/main\.js\?v=20261024\.2/, "The main module cache key must be current.");
assert.match(htmlSource, /dashboard-shell\.css\?v=20261020\.2/, "The shell CSS cache key must be current.");
assert.match(mainSource, /dashboard-shell\.js\?v=20261020\.3/, "The shell module cache key must be current.");
assert.match(mainSource, /dataset\.release = '20261024\.2'/, "The release marker must match this update.");
assert.match(shellSource, /views\/profile\.js\?v=20261020\.1/, "Profile module cache key must be current.");
assert.match(shellSource, /views\/dashboard\.js\?v=20261020\.1/, "Dashboard module cache key must be current.");
assert.ok(workflowSource.includes("phase-4-profile-dashboard"), "Quality workflow must run on the Phase 4 branch.");
assert.ok(workflowSource.includes("node --experimental-vm-modules tests/phase4-views-check.cjs"), "Quality workflow must execute the Phase 4 regression checks.");
const routeBlock = shellSource.slice(shellSource.indexOf("function renderRoute"), shellSource.indexOf("function replayIntro"));
assert.ok(routeBlock.indexOf("disposeView?.();") >= 0 && routeBlock.indexOf("disposeView?.();") < routeBlock.indexOf("const paint = () =>"), "The outgoing view must be disposed before the next view is painted.");
assert.ok(routeBlock.includes("window.clearTimeout(routeTimer)"), "Pending route transitions must be cancelled on navigation.");

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
  const documentListeners = new Map();
  const documentRef = {
    hidden: false,
    addEventListener(type, callback) {
      const set = documentListeners.get(type) || new Set();
      set.add(callback);
      documentListeners.set(type, set);
    },
    removeEventListener(type, callback) {
      const set = documentListeners.get(type);
      set?.delete(callback);
      if (set && set.size === 0) documentListeners.delete(type);
    }
  };
  const animationFrames = new Map();
  let nextFrameId = 1;
  const requestAnimationFrame = callback => {
    const id = nextFrameId++;
    animationFrames.set(id, callback);
    return id;
  };
  const cancelAnimationFrame = id => animationFrames.delete(id);
  const context = vm.createContext({
    console, EventTarget, Event, URL, URLSearchParams, setTimeout, clearTimeout, performance,
    document: documentRef, requestAnimationFrame, cancelAnimationFrame,
    navigator: { clipboard: { writeText: async () => true } }
  });
  const cache = new Map();
  const profileModule = await loadSourceModule("js/views/profile.js", context, cache);
  const dashboardModule = await loadSourceModule("js/views/dashboard.js", context, cache);
  const dataModule = await loadSourceModule("js/data/learning-log.js", context, cache);
  const statsModule = await loadSourceModule("js/data/stats.js", context, cache);
  const profileHtml = profileModule.namespace.render();
  const dashboardHtml = dashboardModule.namespace.render();

  for (const phrase of [
    "Portrait of Saad", "@ZTRACE", "SSC student", "Cybersecurity beginner",
    "Beginner", "Learning in public", "Byte Capsule", "Ethical Hacking for Beginners",
    "networking", "Linux", "reconnaissance", "Ethics", "InshaAllah",
    "I'm choosing to make my beginning visible.", "Learn responsibly. Practice with permission.",
    "whoami", "cat status.txt", "data-copy-email", "GitHub", "TryHackMe", "ZeroDayTest", "Instagram"
  ]) assert.ok(profileHtml.includes(phrase), "Profile is missing required content: " + phrase);
  assert.ok(profileHtml.includes("./assets/saad-golden.jpg"), "Profile must use the existing golden portrait.");
  assert.ok(profileHtml.includes('href="mailto:ztrace054@gmail.com"'), "Email link must remain available.");
  assert.ok(profileHtml.includes("profile-copy-feedback"), "Copy action needs accessible feedback.");
  for (const key of ["labsCompleted", "ctfChallenges", "writeUps", "certificates", "roomsCompleted"]) {
    assert.equal(statsModule.namespace.stats[key], 0, "Every displayed statistic must come from zero-state data: " + key);
  }

  assert.equal((dashboardHtml.match(/class="stat-number"[^>]*>0<\/p>/g) || []).length, 5, "Dashboard must show five zero-valued metric cards.");
  for (const label of ["Labs Completed", "CTF Challenges", "Write-ups", "Certificates", "Rooms Completed"]) assert.ok(dashboardHtml.includes(label), "Dashboard metric missing: " + label);
  assert.equal((dashboardHtml.match(/class="chart-pulse/g) || []).length, 2, "Both empty charts need an animated pulse.");
  assert.ok(dashboardHtml.includes("No data yet — I'm just starting"), "Charts must state that there is no data.");
  assert.ok((dashboardHtml.match(/<title>No data yet<\/title>/g) || []).length >= 8, "Chart hover targets must expose No data yet tooltips.");
  for (const id of ["activity-chart-tooltip", "progress-chart-tooltip"]) {
    assert.ok(dashboardHtml.includes('id="' + id + '" role="tooltip">No data yet</span>'), "Missing visible empty-state tooltip: " + id);
    assert.ok(dashboardHtml.includes('aria-describedby="' + id + '"'), "Chart targets must reference their accessible tooltip: " + id);
  }
  const shellCss = read("css/dashboard-shell.css");
  assert.match(shellCss, /\.dashboard-chart-visual:hover \.chart-tooltip,\s*\.dashboard-chart-visual:focus-within \.chart-tooltip/, "Tooltips must appear on hover and keyboard focus.");
  assert.match(shellCss, /html\[data-motion="off"\] \.chart-pulse/, "Chart pulses must respect the dashboard motion setting.");
  assert.match(shellCss, /prefers-reduced-motion:reduce[^}]*chart-pulse/, "Chart pulses must respect reduced-motion preferences.");
  assert.ok(dashboardHtml.includes('data-chart-period="activity"') && dashboardHtml.includes('data-chart-period="progress"'), "Both chart period controls must be present.");
  for (const column of ["Topic", "Status", "Level", "Notes"]) assert.ok(dashboardHtml.includes('scope="col">' + column), "Learning Log column missing: " + column);
  for (const topic of ["Linux fundamentals", "Networking basics", "Recon concepts", "Authorized labs", "Beginner CTFs", "Certifications"]) assert.ok(dashboardHtml.includes(topic), "Learning Log topic missing: " + topic);
  assert.equal(dataModule.namespace.learningLog.length, 6, "Learning Log should contain six honest starter rows.");
  assert.equal(JSON.stringify(dataModule.namespace.learningLog.map(({ topic, status, level, notes }) => [topic, status, level, notes])), JSON.stringify([
    ["Linux fundamentals", "In progress", "Foundation", "Building familiarity with Linux basics."],
    ["Networking basics", "Building", "Foundation", "Learning how systems connect and communicate."],
    ["Recon concepts", "In progress", "Beginner", "Studying foundational reconnaissance concepts."],
    ["Authorized labs", "Planned", "Planned", "Permission-based practice only."],
    ["Beginner CTFs", "Planned", "Beginner", "Planned practice after the fundamentals."],
    ["Certifications", "Future goal", "Future goal", "Long-term goal; none earned yet."]
  ]), "Learning Log starter rows must match the approved truthful content.");

  const search = mockTarget("[data-learning-log-search]", { value: "" });
  const filter = mockTarget("[data-learning-log-filter]", { value: "all" });
  const rows = dataModule.namespace.learningLog.map(item => ({ textContent: [item.topic, item.status, item.level, item.notes].join(" "), dataset: { status: item.status }, hidden: false }));
  const empty = { hidden: true }, count = { textContent: "" };
  const activityLabel = { textContent: "No data yet — I'm just starting · Weekly" };
  const progressLabel = { textContent: "No data yet — I'm just starting · Weekly" };
  const activityPeriod = mockTarget("[data-chart-period]", { value: "Weekly", dataset: { chartPeriod: "activity" } });
  const progressPeriod = mockTarget("[data-chart-period]", { value: "Weekly", dataset: { chartPeriod: "progress" } });
  const counters = Array.from({ length: 5 }, (_, index) => ({ dataset: { countUp: "0" }, textContent: String(index) }));
  const listeners = {};
  const motionListeners = new Map();
  const motion = {
    motionAllowed: true, enabled: true, reducedMotion: false,
    addEventListener(type, callback) {
      const set = motionListeners.get(type) || new Set();
      set.add(callback);
      motionListeners.set(type, set);
    },
    removeEventListener(type, callback) {
      const set = motionListeners.get(type);
      set?.delete(callback);
      if (set && set.size === 0) motionListeners.delete(type);
    }
  };
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
      if (selector.includes('data-period-label="progress"')) return progressLabel;
      return null;
    }
  };
  const disposeDashboard = dashboardModule.namespace.mount(dashboardRoot, { motion });
  assert.equal(animationFrames.size, 5, "Five zero-value count-up controllers should be mounted when motion is enabled.");
  assert.equal(documentListeners.get("visibilitychange")?.size, 5, "Count-up visibility listeners should be registered.");
  assert.equal(motionListeners.get("change")?.size, 5, "Count-up motion listeners should be registered.");
  search.value = "linux";
  listeners.input({ target: search });
  assert.equal(rows.filter(row => !row.hidden).length, 1, "Search should filter Learning Log rows.");
  assert.ok(!rows[0].hidden && rows.slice(1).every(row => row.hidden), "Search should retain the matching Linux row only.");
  search.value = "communicate";
  listeners.input({ target: search });
  filter.value = "Building";
  listeners.change({ target: filter });
  assert.equal(rows.filter(row => !row.hidden).length, 1, "Search and status filters should work together.");
  assert.equal(rows[1].hidden, false, "The combined filter should retain the networking notes match.");
  search.value = "no-such-topic";
  listeners.input({ target: search });
  assert.equal(rows.filter(row => !row.hidden).length, 0, "Non-matching search should hide every row.");
  assert.equal(empty.hidden, false, "No matching rows should expose the empty result message.");
  assert.equal(count.textContent, "0 of 6 topics shown", "Visible-row count should update immediately for no results.");
  search.value = "";
  listeners.input({ target: search });
  assert.equal(rows.filter(row => !row.hidden).length, 1, "Clearing search should preserve the selected status filter.");
  filter.value = "Planned";
  listeners.change({ target: filter });
  assert.equal(rows.filter(row => !row.hidden).length, 2, "Status filter should return both planned topics.");
  assert.equal(count.textContent, "2 of 6 topics shown");
  filter.value = "Future goal";
  listeners.change({ target: filter });
  assert.equal(rows.filter(row => !row.hidden).length, 1, "Future goal status filter should work.");
  activityPeriod.value = "Last Month";
  listeners.change({ target: activityPeriod });
  assert.equal(activityLabel.textContent, "No data yet — I'm just starting · Last Month", "Activity period must update its own label.");
  assert.equal(progressLabel.textContent, "No data yet — I'm just starting · Weekly", "Activity period must not change the progress label.");
  activityPeriod.value = "Weekly";
  listeners.change({ target: activityPeriod });
  assert.equal(activityLabel.textContent, "No data yet — I'm just starting · Weekly");
  assert.equal(progressLabel.textContent, "No data yet — I'm just starting · Weekly");
  progressPeriod.value = "Last Month";
  listeners.change({ target: progressPeriod });
  assert.equal(progressLabel.textContent, "No data yet — I'm just starting · Last Month", "Progress period must update its own label.");
  assert.equal(activityLabel.textContent, "No data yet — I'm just starting · Weekly", "Progress period must not change the activity label.");
  disposeDashboard();
  assert.equal(Object.keys(listeners).length, 0, "Dashboard input/change listeners must be removed on unmount.");
  assert.equal(animationFrames.size, 0, "Count-up animation frames must be cancelled on unmount.");
  assert.equal(documentListeners.size, 0, "Count-up document listeners must be removed on unmount.");
  assert.equal(motionListeners.size, 0, "Count-up motion listeners must be removed on unmount.");
  assert.ok(counters.every(counter => counter.textContent === "0"), "All zero-value counters must remain at zero after cleanup.");

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
  assert.equal(profileListeners.click, undefined, "Profile copy listener must be removed when navigating away.");

  context.navigator.clipboard.writeText = async () => { throw new Error("Clipboard permission denied"); };
  const errorCopyLabel = { textContent: "Copy email" }, errorFeedback = { textContent: "" };
  const errorCopyButton = { disabled: false, setAttribute() {}, querySelector() { return errorCopyLabel; } };
  const errorListeners = {};
  const errorProfileRoot = {
    addEventListener(type, callback) { errorListeners[type] = callback; },
    removeEventListener(type) { delete errorListeners[type]; },
    querySelector(selector) { return selector === "[data-copy-feedback]" ? errorFeedback : null; }
  };
  const disposeErrorProfile = profileModule.namespace.mount(errorProfileRoot);
  await errorListeners.click({ target: { closest: selector => selector === "[data-copy-email]" ? errorCopyButton : null } });
  assert.equal(errorFeedback.textContent, "Copy is unavailable here. Use the Email link to get in touch.", "Clipboard rejection must fail gracefully with useful feedback.");
  assert.equal(errorCopyButton.disabled, false, "Copy button must be re-enabled after failure.");
  assert.equal(errorCopyLabel.textContent, "Copy email", "Failure must not show a false success label.");
  disposeErrorProfile();
  assert.equal(errorListeners.click, undefined, "Failed-copy view listener must also be removed on unmount.");

  console.log("Phase 4 checks passed: truthful profile/assets/links, copy success and failure, zero metrics, accessible chart tooltips, independent periods, combined Learning Log filters, visible counts, and motion/listener cleanup.");
}
run().catch(error => { console.error(error); process.exitCode = 1; });
