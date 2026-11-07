const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const required = [
  "index.html", "css/phantom-signal.css", "css/workspace-shell.css", "js/phantom-signal.js",
  "js/main.js", "assets/phantom-signal-hero.webp"
];
for (const file of required) assert.ok(fs.existsSync(path.join(root, file)), "Missing Phantom Signal file: " + file);

const html = read("index.html");
const visibleHtmlText = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
const main = read("js/main.js");
const intro = read("js/phantom-signal.js");
const css = read("css/phantom-signal.css");
const shell = read("css/workspace-shell.css");

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

assert.match(html, /id="phase2-gate"[^>]*class="phase2-gate phantom-intro"[^>]*hidden[^>]*data-release="phantom-signal-20261106\.4"/, "Phantom Signal must be the hidden-by-default intro dialog and expose a deployment marker.");
assert.match(html, /<h1[^>]*id="phantom-intro-title"[^>]*>PHANTOM <span>SIGNAL<\/span><\/h1>/, "The Phantom Signal title must be the intro heading.");
assert.match(html, /src="\.\/assets\/phantom-signal-hero\.webp"/, "The intro must use the original Phantom Signal portrait crop.");
assert.ok(html.includes('class="phantom-intro__crimson-wake" aria-hidden="true"'), "The intro must include its crimson ambient wake layer.");
// By design there is no visible Skip/Enter control: the intro always plays its
// full course and the workspace unlocks automatically when it finishes.
assert.ok(!html.includes('data-p2-skip') && !html.includes('data-p2-login'), "The intro must not expose visible skip/enter buttons.");
assert.ok(!html.includes('class="phantom-intro__button"') && !html.includes('class="phantom-intro__controls"'), "The intro must not render visible skip/enter button markup.");

assert.ok(main.includes('from "./phantom-signal.js"') || main.includes("from './phantom-signal.js'"), "main.js must import the Phantom Signal module.");
assert.ok(intro.includes("export function initPhantomSignal"), "phantom-signal.js must export initPhantomSignal.");
assert.ok(intro.includes("SEEN_KEY"), "phantom-signal.js must track first-visit state.");
assert.ok(intro.includes("autoTimer = window.setTimeout(finish, currentMotion ? 5000 : 3200)"), "The first-visit intro must auto-finish at ~5s.");
const motionMatch = intro.match(/autoTimer = window\.setTimeout\(finish, currentMotion \? (\d+) : (\d+)\);/);
const motionMs = motionMatch ? motionMatch[1] : "0";
assert.ok(Number(motionMs) <= 5200, "The first-visit intro must auto-finish at ~5s or less, found " + motionMs + "ms");

for (const cssRule of [
  ".phantom-intro__visual", ".phantom-intro__smoke", ".phantom-intro__eyes",
  ".phantom-intro__code", ".phantom-intro__quote-group", ".phantom-intro__echoes",
  "@media(max-width:900px)",
  "@media(max-width:680px)", "@media(max-width:360px)",
  "@media(prefers-reduced-motion:reduce)",
  ".phantom-intro__wake", "@keyframes phantom-wake",
  ".phantom-intro__crimson-wake", "@keyframes phantom-crimson-bloom",
  "@keyframes phantom-portrait-awaken", "@keyframes phantom-eye-awaken", "@keyframes phantom-eye-ignite"
]) assert.ok(css.includes(cssRule), "Missing responsive/cinematic CSS: " + cssRule);
// No visible skip/enter buttons remain by design.
assert.ok(!css.includes(".phantom-intro__button{") && !css.includes(".phantom-intro__controls{"), "Dead skip/enter button CSS should not remain.");

// The ticker/footer's BASE rule (outside any media query) must now be defined exactly
// once; previously three separate files each defined it at the top level, which is
// what caused the conflicting/broken layout. Overrides inside @media blocks are fine.
const topLevelDefs = (selector) => (css.match(new RegExp("^" + selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\{", "gm")) || []).length;
const tickerDefs = topLevelDefs(".phantom-intro__ticker");
assert.equal(tickerDefs, 1, "The intro ticker/footer base rule must be defined exactly once (outside media queries), found " + tickerDefs);
const echoesDefs = topLevelDefs(".phantom-intro__echoes");
assert.equal(echoesDefs, 1, "The intro echoes grid base rule must be defined exactly once (outside media queries), found " + echoesDefs);

assert.ok(intro.includes('root.addEventListener("pointermove"'), "The intro must include pointer-responsive parallax.");
for (const selector of [".workspace-scroll-reveal", "#app-shell .app-view-stage:after", "@media(prefers-reduced-motion:reduce)"]) {
  assert.ok(shell.includes(selector), "Missing workspace shell rule: " + selector);
}
assert.ok(!/\b(fetch|XMLHttpRequest|WebSocket)\s*\(/.test(intro), "The intro must not make network/authentication requests.");
console.log("Phantom Signal checks passed: original image, exact quotes, 5s first-visit intro, single-source ticker/echoes, skip/replay, accessible controls, responsive layout and reduced motion.");
