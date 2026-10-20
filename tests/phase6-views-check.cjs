const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm"), assert = require("node:assert/strict");
const root = path.resolve(__dirname, ".."), read = file => fs.readFileSync(path.join(root, file), "utf8");
for (const file of ["css/phase-6.css", "js/data/gallery.js", "js/views/phase6-view.js", "js/views/gallery.js", "js/views/contact.js"]) {
  assert.ok(fs.existsSync(path.join(root, file)), "Missing Phase 6 file: " + file);
}
const html = read("index.html"), main = read("js/main.js"), shell = read("js/dashboard-shell.js");
const registry = read("js/views/index.js"), workflow = read(".github/workflows/quality.yml"), css = read("css/phase-6.css");
assert.ok(html.includes("./js/main.js?v=20261020.3") && html.includes("./css/phase-6.css?v=20261020.3"));
assert.ok(main.includes("./dashboard-shell.js?v=20261020.3") && main.includes("dataset.release = '20261020.3'"));
assert.ok(shell.includes('./views/index.js?v=20261020.3') && shell.includes('./views/gallery.js?v=20261020.3') && shell.includes('./views/contact.js?v=20261020.3'));
assert.match(registry, /id: "gallery", label: "Gallery", phase: 6, built: true/);
assert.match(registry, /id: "contact", label: "Contact", phase: 6, built: true/);
assert.ok(workflow.includes("phase-6/gallery-contact-motion") && workflow.includes("tests/phase6-views-check.cjs"));
assert.match(css, /@media\s*\(max-width:\s*700px\)/);
assert.match(css, /prefers-reduced-motion\s*:\s*reduce/i);
assert.match(css, /html\[data-motion="off"\]\s+\.phase6-view/);
assert.match(css, /html\.page-paused\s+\.phase6-view/);

async function load(file, context, cache = new Map()) {
  const name = path.posix.normalize(file);
  if (cache.has(name)) return cache.get(name);
  const mod = new vm.SourceTextModule(read(name), { context, identifier: name });
  cache.set(name, mod);
  await mod.link(spec => load(path.posix.normalize(path.posix.join(path.posix.dirname(name), spec.split("?", 1)[0])), context, cache));
  await mod.evaluate();
  return mod;
}
function fake({ selectors = [], dataset = {}, children = {} } = {}) {
  const listeners = new Map(), attrs = new Map(), classes = new Set();
  return {
    selectors, dataset, children, listeners, attrs, open: false, disabled: false, isConnected: true, textContent: "",
    classList: { add(...names) { names.forEach(x => classes.add(x)); }, remove(...names) { names.forEach(x => classes.delete(x)); }, contains(x) { return classes.has(x); } },
    matches(s) { return selectors.includes(s); }, closest(s) { return this.matches(s) ? this : null; },
    querySelector(s) { return children[s] || null; },
    addEventListener(t, fn) { const set = listeners.get(t) || new Set(); set.add(fn); listeners.set(t, set); },
    removeEventListener(t, fn) { const set = listeners.get(t); set?.delete(fn); if (set?.size === 0) listeners.delete(t); },
    setAttribute(k, v) { attrs.set(k, String(v)); if (k === "open") this.open = true; },
    getAttribute(k) { return attrs.get(k) ?? null; },
    removeAttribute(k) { attrs.delete(k); if (k === "open") this.open = false; },
    focus() { this.focused = true; },
    dispatch(t, extra = {}) { for (const fn of [...(listeners.get(t) || [])]) fn({ target: this, preventDefault() {}, ...extra }); }
  };
}

async function run() {
  const frames = new Map(), timers = new Map(), copied = [];
  let frameId = 0, timerId = 0, clipboardFails = false;
  const context = vm.createContext({
    console, EventTarget, Event, URL, URLSearchParams, performance,
    requestAnimationFrame(fn) { frames.set(++frameId, fn); return frameId; },
    cancelAnimationFrame(id) { frames.delete(id); },
    setTimeout(fn, delay) { timers.set(++timerId, { fn, delay }); return timerId; },
    clearTimeout(id) { timers.delete(id); },
    navigator: { clipboard: { async writeText(value) { if (clipboardFails) throw new Error("denied"); copied.push(value); } } }
  });
  const cache = new Map();
  const data = await load("js/data/gallery.js", context, cache);
  const gallery = await load("js/views/gallery.js", context, cache);
  const contact = await load("js/views/contact.js", context, cache);
  const phase6 = await load("js/views/phase6-view.js", context, cache);
  const config = await load("js/config.js", context, cache);
  const links = await load("js/data/links.js", context, cache);
  const photos = Array.from(data.namespace.galleryPhotos);
  assert.equal(photos.length, 3);
  assert.deepEqual(photos.map(x => x.src), ["./assets/saad-golden.jpg", "./assets/saad-dark.jpg", "./assets/saad-formal.jpg"]);
  assert.ok(photos.every(x => x.alt && x.title && x.caption && x.width > 0 && x.height > 0));

  const galleryHtml = gallery.namespace.render();
  for (const photo of photos) assert.ok(galleryHtml.includes(photo.src) && galleryHtml.includes(photo.alt));
  for (const marker of ['role="list" aria-label="Portrait gallery"', 'aria-haspopup="dialog"', "data-gallery-dialog", "data-gallery-previous", "data-gallery-next", "data-gallery-close", 'aria-live="polite"']) {
    assert.ok(galleryHtml.includes(marker), "Gallery missing: " + marker);
  }
  const contactHtml = contact.namespace.render(), email = config.namespace.CONTENT.email;
  assert.ok(contactHtml.includes(email) && contactHtml.includes('href="mailto:' + email + '"'));
  for (const key of ["github", "tryHackMe", "zeroDayTest", "instagram"]) assert.ok(contactHtml.includes(links.namespace.links[key]));
  assert.ok(contactHtml.includes("data-copy-email") && contactHtml.includes("data-copy-feedback") && contactHtml.includes('rel="noopener noreferrer"'));
  assert.ok(!/<form\b/i.test(contactHtml));
  for (const file of ["js/views/gallery.js", "js/views/contact.js"]) assert.ok(!/\b(fetch|XMLHttpRequest|WebSocket)\s*\(/.test(read(file)));

  const motionClasses = new Set(), motionView = { classList: { add(...n) { n.forEach(x => motionClasses.add(x)); }, remove(...n) { n.forEach(x => motionClasses.delete(x)); } } };
  const motionRoot = { querySelector(s) { return s === ".phase6-view" ? motionView : null; } };
  const disposeMotion = phase6.namespace.mountPhase6View(motionRoot, { motion: { motionAllowed: true, reducedMotion: false, paused: false } });
  assert.ok(motionClasses.has("phase6-motion-pending") && frames.size === 1);
  const [fid, callback] = frames.entries().next().value; frames.delete(fid); callback(16);
  assert.ok(motionClasses.has("is-mounted") && !motionClasses.has("phase6-motion-pending"));
  disposeMotion(); assert.ok(!motionClasses.has("is-mounted"));
  const noMotion = phase6.namespace.mountPhase6View(motionRoot, { motion: { motionAllowed: false, reducedMotion: true } });
  assert.ok(motionClasses.has("is-mounted") && frames.size === 0); noMotion();

  const image = fake(), title = fake(), caption = fake(), count = fake();
  const close = fake({ selectors: ["[data-gallery-close]"] }), previous = fake({ selectors: ["[data-gallery-previous]"] }), next = fake({ selectors: ["[data-gallery-next]"] });
  const dialog = fake({ children: { "[data-gallery-image]": image, "#phase6-lightbox-title": title, "[data-gallery-caption]": caption, "[data-gallery-count]": count, "[data-gallery-close]": close } });
  dialog.showModal = () => { dialog.open = true; };
  dialog.close = () => { dialog.open = false; dialog.dispatch("close"); };
  const galleryRoot = fake({ children: { ".phase6-view": fake(), "[data-gallery-dialog]": dialog } });
  const disposeGallery = gallery.namespace.mount(galleryRoot, { motion: { motionAllowed: false, reducedMotion: true } });
  const opener = fake({ selectors: ["[data-gallery-open]"], dataset: { galleryOpen: "1" } });
  const clickGallery = [...galleryRoot.listeners.get("click")][0];
  clickGallery({ target: opener });
  assert.equal(dialog.open, true); assert.equal(image.getAttribute("src"), photos[1].src); assert.equal(count.textContent, "02 / 03");
  dialog.dispatch("keydown", { key: "ArrowRight" }); assert.equal(image.getAttribute("src"), photos[2].src);
  clickGallery({ target: previous }); assert.equal(image.getAttribute("src"), photos[1].src);
  clickGallery({ target: close }); assert.equal(dialog.open, false); assert.equal(opener.focused, true);
  disposeGallery(); assert.equal(galleryRoot.listeners.size, 0); assert.equal(dialog.listeners.has("keydown"), false);

  const label = fake(); label.textContent = "COPY ADDRESS";
  const copyButton = fake({ selectors: ["[data-copy-email]"], children: { "[data-copy-label]": label } });
  const feedback = fake(), contactRoot = fake({ children: { ".phase6-view": fake(), "[data-copy-email]": copyButton, "[data-copy-feedback]": feedback } });
  const disposeContact = contact.namespace.mount(contactRoot, { motion: { motionAllowed: false, reducedMotion: true } });
  const clickCopy = [...contactRoot.listeners.get("click")][0];
  await clickCopy({ target: copyButton });
  assert.deepEqual(copied, [email]); assert.equal(label.textContent, "COPIED"); assert.equal(copyButton.disabled, false);
  const successTimer = [...timers.entries()].find(([, t]) => t.delay === config.namespace.TIMING.copyReset);
  assert.ok(successTimer); successTimer[1].fn(); timers.delete(successTimer[0]); assert.equal(label.textContent, "COPY ADDRESS");
  clipboardFails = true; await clickCopy({ target: copyButton });
  assert.match(feedback.textContent, /Clipboard access is unavailable/); assert.equal(label.textContent, "COPY UNAVAILABLE");
  disposeContact(); assert.equal(contactRoot.listeners.size, 0); assert.equal(timers.size, 0);
  console.log("Phase 6 checks passed: local portraits, accessible lightbox, email/social links, copy feedback, motion controls, and cleanup.");
}
run().catch(error => { console.error(error); process.exitCode = 1; });