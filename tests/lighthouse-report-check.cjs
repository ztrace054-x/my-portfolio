const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const dir = process.argv[2] || "artifacts/performance";
const required = ["lighthouse-desktop.report.json", "lighthouse-mobile.report.json"];
const metricIds = ["first-contentful-paint", "largest-contentful-paint", "cumulative-layout-shift", "total-blocking-time", "speed-index"];
const summary = [];
for (const name of required) {
  const file = path.join(dir, name);
  assert(fs.existsSync(file), "Missing Lighthouse report: " + file);
  const report = JSON.parse(fs.readFileSync(file, "utf8"));
  const category = id => report.categories?.[id]?.score;
  const scores = {
    performance: category("performance"),
    accessibility: category("accessibility"),
    bestPractices: category("best-practices"),
    seo: category("seo")
  };
  for (const [id, score] of Object.entries(scores)) {
    assert(Number.isFinite(score), name + " has an invalid " + id + " category score.");
  }
  const metrics = {};
  for (const id of metricIds) {
    const audit = report.audits?.[id];
    assert(audit && Number.isFinite(audit.numericValue) && audit.scoreDisplayMode !== "error",
      name + " has no valid " + id + " measurement (" + (audit?.errorMessage || audit?.scoreDisplayMode || "missing") + ").");
    metrics[id] = { displayValue: audit.displayValue || null, numericValue: audit.numericValue };
  }
  summary.push({
    report: name,
    lighthouseVersion: report.lighthouseVersion,
    fetchTime: report.fetchTime,
    scores: Object.fromEntries(Object.entries(scores).map(([key, value]) => [key, Math.round(value * 100)])),
    metrics
  });
}
console.log(JSON.stringify(summary, null, 2));
