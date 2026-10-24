const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const baseUrl = 'https://ztrace054-x.github.io/my-portfolio/';
const base = new URL(baseUrl);

function requiredMatch(regex, source, label) {
  const match = source.match(regex);
  assert(match, 'Missing ' + label);
  return match;
}
function tagContent(tag, label) {
  const match = tag.match(/\bcontent=["']([^"']*)["']/i);
  assert(match, 'Missing content on ' + label);
  return match[1];
}
function metaByName(name) {
  const pattern = new RegExp("<meta\\b(?=[^>]*\\bname=[\"']" + name + "[\"'])[^>]*>", 'i');
  const tag = requiredMatch(pattern, html, 'meta name="' + name + '"')[0];
  return tagContent(tag, 'meta name="' + name + '"');
}
function metaByProperty(property) {
  const pattern = new RegExp("<meta\\b(?=[^>]*\\bproperty=[\"']" + property + "[\"'])[^>]*>", 'i');
  const tag = requiredMatch(pattern, html, 'meta property="' + property + '"')[0];
  return tagContent(tag, 'meta property="' + property + '"');
}
function relativeFile(value, fromDir = root) {
  const clean = value.split(/[?#]/, 1)[0];
  if (!clean || /^(?:https?:|data:|blob:|mailto:|tel:|javascript:|#)/i.test(clean)) return null;
  const absolute = path.resolve(fromDir, clean.startsWith('/') ? clean.slice(1) : clean);
  assert(absolute === root || absolute.startsWith(root + path.sep), 'Path escapes repository: ' + value);
  return absolute;
}
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}
function contrastRatio(foreground, background) {
  const luminance = hex => {
    const channels = hex.slice(1).match(/.{2}/g).map(part => parseInt(part, 16) / 255)
      .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };
  const a = luminance(foreground), b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
function token(name) {
  const tokens = fs.readFileSync(path.join(root, 'css/tokens.css'), 'utf8');
  return requiredMatch(new RegExp('--' + name + ':\\s*(#[0-9a-f]{6})\\s*;', 'i'), tokens, '--' + name + ' color token')[1];
}

let checks = 0;

// SEO metadata must describe the same canonical page and social preview.
const title = requiredMatch(/<title>([^<]+)<\/title>/i, html, 'page title')[1].trim();
assert(title.length > 0 && title.length <= 60, 'Title should be concise (1–60 characters)');
const description = metaByName('description');
assert(description.length >= 50 && description.length <= 160, 'Meta description should be 50–160 characters');
assert.equal(metaByName('robots').split(',')[0].trim(), 'index', 'Robots meta should permit indexing');
const canonicalTag = requiredMatch(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/i, html, 'canonical link')[0];
const canonical = canonicalTag.match(/\bhref=["']([^"']+)["']/i)?.[1];
assert.equal(canonical, baseUrl, 'Canonical must equal the production URL');
assert.equal(metaByProperty('og:url'), canonical, 'Open Graph URL must match canonical');
assert.equal(metaByProperty('og:title'), title, 'Open Graph title must match page title');
assert(metaByProperty('og:description').length > 0, 'Open Graph description must not be empty');
assert.equal(metaByName('twitter:card'), 'summary_large_image', 'Use a large social preview card');
assert.equal(metaByName('twitter:image'), metaByProperty('og:image'), 'Twitter and Open Graph images must match');
const ogImage = new URL(metaByProperty('og:image'));
assert.equal(ogImage.origin, base.origin, 'Open Graph image must be on the production origin');
const ogImagePath = ogImage.pathname.slice(base.pathname.length);
const ogImageFile = path.join(root, ogImagePath);
assert(fs.existsSync(ogImageFile), 'Open Graph image does not exist: ' + ogImagePath);
assert(fs.statSync(ogImageFile).size <= 250 * 1024, 'Open Graph image should remain under 250 KB');
const favicon = path.join(root, 'assets/favicon.svg');
assert(fs.existsSync(favicon), 'SVG favicon file must exist');
assert.match(fs.readFileSync(favicon, 'utf8'), /<svg\b[^>]*viewBox=/i, 'Favicon must be a valid SVG document');
const jsonLdScript = requiredMatch(/<script\b(?=[^>]*type=["']application\/ld\+json["'])[^>]*>([\s\S]*?)<\/script>/i, html, 'JSON-LD Person block');
const person = JSON.parse(jsonLdScript[1]);
assert.equal(person['@context'], 'https://schema.org');
assert.equal(person['@type'], 'Person');
assert.equal(person.url, canonical);
assert(person.name && person.description && person.image, 'Person schema requires name, description, and image');
assert(Array.isArray(person.sameAs) && person.sameAs.length >= 2, 'Person schema should include profile URLs');
const personImage = new URL(person.image);
assert.equal(personImage.origin, base.origin, 'Person image must use the production origin');
assert(fs.existsSync(path.join(root, personImage.pathname.slice(base.pathname.length))), 'Person schema image must exist');
const robots = fs.readFileSync(path.join(root, 'robots.txt'), 'utf8');
assert(robots.includes('Sitemap: ' + baseUrl + 'sitemap.xml'), 'robots.txt must advertise the sitemap');
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
assert.match(sitemap, /<urlset\b[^>]*xmlns=["']http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9["']/i, 'Sitemap must use the standard namespace');
assert.deepEqual([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]), [canonical], 'Sitemap should contain only the canonical page');
assert.match(sitemap, /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/, 'Sitemap needs an ISO date');
checks++;

// Check static document structure, keyboard affordances, and accessible references.
const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(match => match[1]);
const idSet = new Set(ids);
assert.equal(idSet.size, ids.length, 'HTML IDs must be unique');
const internalAnchors = [...html.matchAll(/<a\b[^>]*\bhref=["']#([^"']+)["'][^>]*>/gi)].map(match => match[1]).filter(id => id && !id.startsWith('/'));
for (const id of internalAnchors) assert(idSet.has(decodeURIComponent(id)), 'Broken in-page link: #' + id);
for (const match of html.matchAll(/\b(?:aria-labelledby|aria-describedby|aria-controls|aria-owns|for)=["']([^"']+)["']/gi)) {
  for (const id of match[1].trim().split(/\s+/)) assert(idSet.has(id), 'ARIA/label reference points to missing ID: ' + id);
}
const headingLevels = [...html.matchAll(/<h([1-6])\b[^>]*>/gi)].map(match => Number(match[1]));
assert.equal(headingLevels.filter(level => level === 1).length, 2, 'Intro and fallback page each need one primary h1 in mutually exclusive states');
assert.match(html, /<h1 class="phase2-gate__manifesto">Security is a practice\.<\/h1>/, 'Intro headline must be the primary heading while the intro is visible');
assert.match(html, /<h1 id="hero-title"/, 'Fallback hero must retain its own primary heading');
assert.match(html, /html\.intro-pending #page \{ visibility: hidden !important; \}/, 'Intro and fallback page must not be simultaneously visible');
for (let i = 1; i < headingLevels.length; i++) {
  assert(headingLevels[i] <= headingLevels[i - 1] + 1, 'Heading level skipped from h' + headingLevels[i - 1] + ' to h' + headingLevels[i]);
}
assert.match(html, /<a\b[^>]*class=["'][^"']*skip-link[^"']*["'][^>]*href=["']#main["']/i, 'Keyboard skip link should target main');
assert.match(html, /<main\b[^>]*\bid=["']main["']/i, 'Main landmark should have the skip-link target');
const activeCssText = [...html.matchAll(/<link\b(?=[^>]*\brel=["']stylesheet["'])[^>]*>/gi)].map(match => match[0])
  .map(tag => tag.match(/\bhref=["']([^"']+)["']/i)?.[1]).filter(Boolean)
  .map(href => fs.readFileSync(relativeFile(href), 'utf8')).join('\n');
assert.match(activeCssText, /:focus-visible/, 'Visible keyboard focus styles must be present');
for (const match of html.matchAll(/<a\b([^>]*)\btarget=["']_blank["']([^>]*)>/gi)) {
  const attrs = match[1] + match[2];
  const rel = attrs.match(/\brel=["']([^"']+)["']/i)?.[1]?.toLowerCase().split(/\s+/) || [];
  assert(rel.includes('noopener') && rel.includes('noreferrer'), 'New-tab links must use rel="noopener noreferrer"');
}
const imageTags = [...html.matchAll(/<img\b[^>]*>/gi)].map(match => match[0]);
assert(imageTags.length > 0, 'Expected portfolio images');
for (const image of imageTags) {
  const alt = image.match(/\balt=["']([^"']*)["']/i);
  assert(alt && alt[1].trim().length > 0, 'Every content image needs meaningful alt text');
  assert.match(image, /\bwidth=["']\d+["']/i, 'Images need intrinsic width');
  assert.match(image, /\bheight=["']\d+["']/i, 'Images need intrinsic height');
  assert.match(image, /\bloading=["']lazy["']/i, 'Below-the-fold and dialog images should be lazy-loaded');
  assert.match(image, /\bdecoding=["']async["']/i, 'Images should decode asynchronously');
}
checks++;

// Verify every local HTML/CSS asset reference resolves inside this repository.
for (const match of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) {
  const value = match[1];
  if (/^(?:#|https?:|data:|blob:|mailto:|tel:|javascript:|\?)/i.test(value)) continue;
  const file = relativeFile(value);
  if (file) assert(fs.existsSync(file), 'Missing local HTML asset: ' + value);
}
const stylesheetTags = [...html.matchAll(/<link\b(?=[^>]*\brel=["']stylesheet["'])[^>]*>/gi)].map(match => match[0]);
const stylesheetPaths = stylesheetTags.map(tag => tag.match(/\bhref=["']([^"']+)["']/i)?.[1]).filter(Boolean);
for (const stylesheet of stylesheetPaths) {
  const file = relativeFile(stylesheet);
  assert(file && fs.existsSync(file), 'Missing stylesheet: ' + stylesheet);
  const css = fs.readFileSync(file, 'utf8');
  for (const match of css.matchAll(/url\(\s*["']?([^)"']+)["']?\s*\)/gi)) {
    const value = match[1].trim();
    if (/^(?:data:|https?:|#|blob:)/i.test(value)) continue;
    const local = relativeFile(value, path.dirname(file));
    if (local) assert(fs.existsSync(local), 'Missing CSS asset ' + value + ' referenced from ' + stylesheet);
  }
}
checks++;

// Walk the active ES-module graph and fail on missing imports or orphan modules.
const jsRoot = path.join(root, 'js');
const queue = ['js/main.js'];
const visited = new Set();
const importPattern = /\bimport\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]|\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
while (queue.length) {
  const relative = queue.shift();
  if (visited.has(relative)) continue;
  visited.add(relative);
  const file = path.join(root, relative);
  assert(fs.existsSync(file), 'Missing JavaScript module: ' + relative);
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(importPattern)) {
    const specifier = match[1] || match[2];
    if (!specifier.startsWith('.')) continue;
    const clean = specifier.split(/[?#]/, 1)[0];
    const target = path.normalize(path.join(path.dirname(relative), clean));
    assert(fs.existsSync(path.join(root, target)), 'Missing import ' + specifier + ' in ' + relative);
    queue.push(target);
  }
}
const shippedModules = fs.readdirSync(jsRoot).filter(name => name.endsWith('.js')).map(name => 'js/' + name);
// These foundation modules are intentionally staged for later view integration.
const stagedModules = new Set(['js/router.js', 'js/utils.js']);
for (const module of shippedModules) {
  if (stagedModules.has(module)) continue;
  assert(visited.has(module), 'Unused JavaScript module remains: ' + module);
}
checks++;

// Verify core design-token contrast (WCAG AA 4.5:1 for normal text) and reduced motion.
const bg = token('bg'), deep = token('bg-deep'), surface = token('surface');
for (const [foreground, background, label] of [
  [token('text'), bg, 'primary text on page'],
  [token('text-soft'), surface, 'secondary text on surfaces'],
  [token('muted'), bg, 'muted text on page'],
  [token('accent'), bg, 'accent text on page'],
  [token('red'), bg, 'red text on page'],
  [deep, token('accent'), 'button text on accent'],
]) {
  const ratio = contrastRatio(foreground, background);
  assert(ratio >= 4.5, 'Contrast below WCAG AA for ' + label + ': ' + ratio.toFixed(2) + ':1');
}
const activeCss = stylesheetPaths.map(value => fs.readFileSync(relativeFile(value), 'utf8')).join('\n');
assert.match(activeCss, /prefers-reduced-motion\s*:\s*reduce/i, 'System reduced-motion fallback must remain');
assert.match(activeCss, /html\.motion-off/, 'The Motion-off setting must stop animations');
const mainCss = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
assert.match(mainCss, /::selection\{background:var\(--red\);color:var\(--bg-deep\)\}/, 'Selected text must meet contrast on the red selection background');
checks++;

// Keep raster payloads modest and fonts self-hosted with swap behavior.
const assetFiles = walk(path.join(root, 'assets'));
const rasterFiles = assetFiles.filter(file => /\.(?:jpe?g|png|webp)$/i.test(file));
for (const file of rasterFiles) {
  const size = fs.statSync(file).size;
  assert(size <= 250 * 1024, 'Image exceeds the 250 KB budget: ' + path.relative(root, file) + ' (' + size + ' bytes)');
}
const fontFiles = assetFiles.filter(file => /\.woff2?$/i.test(file));
assert(fontFiles.length >= 2, 'Expected self-hosted WOFF2 fonts');
for (const file of fontFiles) assert(fs.statSync(file).size <= 100 * 1024, 'Font exceeds 100 KB: ' + path.relative(root, file));
const tokenCss = fs.readFileSync(path.join(root, 'css/tokens.css'), 'utf8');
assert.match(tokenCss, /font-display:\s*swap/i, 'Self-hosted fonts should use font-display: swap');
checks++;

console.log('PASS: ' + checks + ' final QA groups (SEO/schema, anchors/ARIA/headings, local links/assets, module graph, contrast/reduced motion, image/font budgets).');
