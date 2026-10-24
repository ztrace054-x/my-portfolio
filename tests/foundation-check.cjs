const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const required = [
  "index.html", "styleguide.html",
  "css/tokens.css", "css/base.css", "css/components.css", "css/motion.css",
  "js/main.js", "js/motion.js", "js/router.js", "js/utils.js",
  "js/data/profile.js", "js/data/stats.js", "js/data/roadmap.js",
  "js/data/tools.js", "js/data/certificates.js", "js/data/attack-surface.js",
  "js/data/skill-progress.js", "js/data/learning-path.js", "js/data/write-ups.js", "js/data/automation.js", "js/data/links.js",
  "js/views/index.js", "js/views/styleguide.js",
  "assets/saad-golden.jpg", "assets/saad-dark.jpg", "assets/saad-formal.jpg", "assets/og-image.jpg"
];
for (const file of required) assert.ok(fs.existsSync(path.join(root, file)), `Missing required foundation file: ${file}`);

const tokens = fs.readFileSync(path.join(root, "css/tokens.css"), "utf8");
for (const token of ["#05090c", "#0b1418", "#477c5c", "#85e9ad", "#35f2e0", "#eaf5f2", "#8da9a0", "#f2cc85", "#ff737d"]) {
  assert.ok(tokens.toLowerCase().includes(token), `Missing HUD design token: ${token}`);
}
const components = fs.readFileSync(path.join(root, "css/components.css"), "utf8");
for (const selector of [".hud-panel", ".hud-btn", ".stat-card", ".badge", ".progress", ".tooltip", ".dropdown", ".data-table", ".empty-state", ".section-title"]) {
  assert.ok(components.includes(selector), `Missing reusable component: ${selector}`);
}
const guide = fs.readFileSync(path.join(root, "styleguide.html"), "utf8");
for (const href of [...guide.matchAll(/(?:href|src)="\.\/([^"]+)"/g)].map(match => match[1])) {
  assert.ok(fs.existsSync(path.join(root, href)), `Broken local styleguide reference: ${href}`);
}
const stats = fs.readFileSync(path.join(root, "js/data/stats.js"), "utf8");
assert.match(stats, /totalLabs:\s*0/);
assert.match(stats, /writeUps:\s*0/);
assert.match(stats, /skillsInProgress:\s*0/);
assert.match(stats, /certificatesEarned:\s*0/);
const certificates = fs.readFileSync(path.join(root, "js/data/certificates.js"), "utf8");
assert.match(certificates, /Not earned yet/);
assert.match(certificates, /status:"Planned"/);
const guideStyles = fs.readFileSync(path.join(root, "css/base.css"), "utf8");
assert.match(guideStyles, /\.hud-body::before/);
assert.match(guideStyles, /::-webkit-scrollbar/);
console.log(`Foundation checks passed (${required.length} required paths, tokens, components, zero-state data, and local styleguide links).`);
