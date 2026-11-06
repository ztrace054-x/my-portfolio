const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const required = [
  "index.html", "css/phantom-signal.css", "css/phantom-signal-cinematic-v2.css", "js/phantom-signal.js",
  "js/main.js", "assets/phantom-signal-hero.webp"
];
for (const file of required) assert.ok(fs.existsSync(path.join(root, file)), "Missing Phantom Signal file: " + file);

const html = read("index.html");
const visibleHtmlText = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
const main = read("js/main.js");
const intro = read("js/phantom-signal.js");
const css = read("css/phantom-signal.css");

for (const quote of [
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
]) assert.ok(visibleHtmlText.includes(quote), "Missing exact Phantom Signal copy: " + quote);

assert.match(html, /id="phase2-gate"[^>]*class="phase2-gate phantom-intro"[^>]*hidden[^>]*data-release="phantom-signal-20261106\.2"/, "Phantom Signal must be the hidden-by-default intro dialog and expose a deployment marker.");
assert.match(html, /<h1[^>]*id="phantom-intro-title"[^>]*>PHANTOM <span>SIGNAL<\/span><\/h1>/, "The Phantom Signal title must be the intro heading.");
assert.match(html, /src="\.\/assets\/phantom-signal-hero\.webp"/, "The intro must use the original Phantom Signal portrait crop.");
assert.ok(html.includes('data-p2-skip') && html.includes('data-p2-login'), "Skip and enter controls must be available.");
assert.ok(html.includes('aria-modal="true"') && html.includes('aria-labelledby="phantom-intro-title"'), "Intro dialog must have an accessible name.");
assert.ok(html.includes('href="./css/phantom-signal.css?v=20261106.1"'), "The Phantom Signal stylesheet must be linked.");
assert.ok(html.includes('href="./css/phantom-signal-cinematic-v2.css?v=20261106.6"'), "The cinematic v2 stylesheet must be linked.");
assert.ok(!html.includes('phase-2-gate.css'), "The superseded HUD stylesheet must not load with the new intro.");
assert.ok(/<div id="page">/.test(html), "The original portfolio content must remain intact.");
assert.ok(html.includes("Replay the Phantom Signal cinematic introduction."), "Settings must describe the new replay experience.");
assert.ok(html.includes('data-replay-intro'), "The existing settings replay control must remain available.");

assert.ok(main.includes("initPhantomSignal"), "Main startup must initialize the Phantom Signal intro.");
assert.ok(main.includes("intro.completed.then"), "The workspace must activate after the intro completes.");
assert.ok(!main.includes("initPhase2Gate"), "The superseded visitor gate must no longer run.");

for (const behavior of [
  "sessionStorage.getItem(SEEN_KEY)",
  'new URLSearchParams(window.location.search).get("intro") === "1"',
  'event.key === "Escape"',
  'event.key !== "Tab"',
  "page.inert = true",
  "page.inert = false",
  "prefers-reduced-motion: reduce",
  "autoTimer = window.setTimeout(finish",
  "clearReplayQuery()"
]) assert.ok(intro.includes(behavior), "Missing intro behavior: " + behavior);

for (const cssRule of [
  ".phantom-intro__visual", ".phantom-intro__smoke", ".phantom-intro__eyes",
  ".phantom-intro__code", ".phantom-intro__quote-group", ".phantom-intro__echoes",
  ".phantom-intro__button", ".phantom-intro__visual-label{display:none}", "@media(max-width:900px)",
  "@media(max-width:680px)", "@media(max-width:360px)",
  "@media(prefers-reduced-motion:reduce)", "@keyframes phantom-glitch-out"
]) assert.ok(css.includes(cssRule), "Missing responsive/cinematic CSS: " + cssRule);

assert.ok(intro.includes('root.addEventListener("pointermove"'), "The intro must include pointer-responsive parallax.");
const cinematic = read("css/phantom-signal-cinematic-v2.css");
for (const selector of [".phantom-intro__smoke-layer", ".phantom-intro__particles", ".phantom-intro__eyes-core", ".phantom-intro__scan-field", ".phantom-intro__cursor-light", ".workspace-scroll-reveal", "#app-shell .app-view-stage:after", "@media(prefers-reduced-motion:reduce)"]) {
  assert.ok(cinematic.includes(selector), "Missing cinematic v2 enhancement: " + selector);
}
assert.ok(!/\b(fetch|XMLHttpRequest|WebSocket)\s*\(/.test(intro), "The intro must not make network/authentication requests.");
console.log("Phantom Signal checks passed: original image, exact quotes, first-visit intro, skip/replay, accessible controls, responsive layout and reduced motion.");
