const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const assert = require("node:assert/strict");
const postcss = require("postcss");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const html = read("index.html");
let cssFiles = 0, cssRules = 0, imageFiles = 0;

for (const match of html.matchAll(/<link\b(?=[^>]*\brel=["']stylesheet["'])[^>]*>/gi)) {
  const href = match[0].match(/\bhref=["']([^"']+)["']/i)?.[1];
  if (!href || /^(?:https?:|data:)/i.test(href)) continue;
  const rel = href.split(/[?#]/, 1)[0].replace(/^\.\/+/, "");
  const file = path.resolve(root, rel);
  assert(file.startsWith(root + path.sep) && fs.existsSync(file), "Missing stylesheet: " + href);
  const source = fs.readFileSync(file, "utf8");
  const parsed = postcss.parse(source, { from: file });
  cssFiles++;
  parsed.walkRules(() => cssRules++);
  parsed.walkDecls(decl => {
    assert(!/NaN|undefined/.test(decl.value), "Invalid CSS declaration value in " + rel + ": " + decl.toString());
  });
}
assert(cssFiles >= 10, "Expected the full active stylesheet stack.");
assert(html.includes("phase-6-visual-unification.css?v=20261106.1"), "Phase 6 global cyber-noir layer is not linked.");
assert.match(read("css/cyber-noir.css"), /--accent:\s*#e5091a/i, "Crimson global accent token missing.");

const assets = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else assets.push(file);
  }
}
walk(path.join(root, "assets"));
for (const file of assets.filter(file => /\.(?:png|jpe?g|webp)$/i.test(file))) {
  const size = fs.statSync(file).size;
  const rel = path.relative(root, file);
  const budget = rel === "assets/certificates/Md_Saad_Certificate.png" ? 750 * 1024 : 250 * 1024;
  assert(size <= budget, "Image budget exceeded: " + rel + " (" + size + " bytes)");
  imageFiles++;
}
const certificate = path.join(root, "assets/certificates/Md_Saad_Certificate.png");
assert(fs.existsSync(certificate), "Original Byte Capsule certificate image is missing.");
const certificateHash = crypto.createHash("sha256").update(fs.readFileSync(certificate)).digest("hex");
assert.equal(certificateHash, "0ab9dcc9d047ed8bd78fa61e2b6d000ae0784201ce0dc73c7db3f3095287fbfa", "Original Byte Capsule certificate image was changed.");
const certificateData = read("js/data/certificates.js");
for (const value of ["Ethical Hacking for Beginners", "Byte Capsule", "7482ZWKQ", "2026-11-01", "status:\"Earned\""]) {
  assert(certificateData.includes(value), "Certificate record is missing " + value);
}
const visual = read("tests/visual-qa.cjs");
for (const size of ["1440x900", "1280x800", "1024x768", "768x1024", "390x844", "375x812", "320x700"]) {
  assert(visual.includes(size), "Visual QA viewport is missing: " + size);
}
assert(visual.includes("@axe-core/playwright"), "Axe browser accessibility audit is not configured.");
console.log("PASS: Phase 7 production checks — " + cssFiles + " CSS files parsed (" + cssRules + " rules), " + imageFiles + " raster assets within budgets, Byte Capsule original hash intact, seven requested viewports including 375px and 768px plus Axe audit configured.");
