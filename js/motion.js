/* Shared animation clock. Hidden tabs never retain a scheduled animation frame. */
export function createClock() {
  const callbacks = new Set();
  let raf = 0, last = 0;
  function reconcile() {
    const active = callbacks.size > 0 && !document.hidden;
    if (active && !raf) raf = requestAnimationFrame(tick);
    if (!active) { if (raf) cancelAnimationFrame(raf); raf = 0; last = 0; }
  }
  function tick(time) {
    raf = 0;
    const dt = last ? Math.min(64, time - last) : 16;
    last = time;
    for (const callback of [...callbacks]) {
      try { callback(time, dt); } catch (error) { callbacks.delete(callback); console.error("Optional visual stopped:", error); }
    }
    reconcile();
  }
  const visibility = () => {
    document.documentElement.classList.toggle("page-paused", document.hidden);
    reconcile();
  };
  document.addEventListener("visibilitychange", visibility);
  visibility();
  return {
    subscribe(callback) { callbacks.add(callback); reconcile(); return () => { callbacks.delete(callback); reconcile(); }; },
    dispose() { callbacks.clear(); reconcile(); document.removeEventListener("visibilitychange", visibility); }
  };
}

const MOTION_KEY = "saad-motion";
const INTENSITY_KEY = "saad-motion-intensity";
function readPreference(key, fallback) { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } }
function writePreference(key, value) { try { localStorage.setItem(key, value); } catch { /* Private browsing still works. */ } }

export class MotionController extends EventTarget {
  constructor({ documentRef = document, windowRef = window } = {}) {
    super();
    this.document = documentRef;
    this.window = windowRef;
    this.enabled = readPreference(MOTION_KEY, "on") !== "off";
    const savedIntensity = readPreference(INTENSITY_KEY, "medium");
    this.intensity = ["low", "medium", "high"].includes(savedIntensity) ? savedIntensity : "medium";
    this.media = this.window.matchMedia?.("(prefers-reduced-motion: reduce)") ?? { matches: false, addEventListener() {}, removeEventListener() {} };
    this.onVisibility = () => this.sync();
    this.onReducedMotion = () => this.sync();
    this.onStorage = event => {
      if (event.key === MOTION_KEY) this.enabled = event.newValue !== "off";
      if (event.key === INTENSITY_KEY && ["low", "medium", "high"].includes(event.newValue)) this.intensity = event.newValue;
      this.sync();
    };
    this.document.addEventListener("visibilitychange", this.onVisibility);
    this.media.addEventListener?.("change", this.onReducedMotion);
    this.window.addEventListener("storage", this.onStorage);
    this.sync();
  }
  get reducedMotion() { return Boolean(this.media.matches); }
  get paused() { return Boolean(this.document.hidden); }
  get motionAllowed() { return this.enabled && !this.reducedMotion && !this.paused; }
  setEnabled(value) {
    this.enabled = Boolean(value);
    writePreference(MOTION_KEY, this.enabled ? "on" : "off");
    this.sync();
  }
  toggle() { this.setEnabled(!this.enabled); return this.enabled; }
  setIntensity(value) {
    if (!["low", "medium", "high"].includes(value)) return;
    this.intensity = value;
    writePreference(INTENSITY_KEY, value);
    this.sync();
  }
  sync() {
    const root = this.document.documentElement;
    root.dataset.motion = this.motionAllowed ? "on" : "off";
    root.dataset.intensity = this.intensity;
    root.classList.toggle("motion-off", !this.motionAllowed);
    root.classList.toggle("page-paused", this.paused);
    this.dispatchEvent(new Event("change"));
  }
  dispose() {
    this.document.removeEventListener("visibilitychange", this.onVisibility);
    this.media.removeEventListener?.("change", this.onReducedMotion);
    this.window.removeEventListener("storage", this.onStorage);
  }
}

export function revealOnScroll(selector = "[data-reveal]", { controller = null, root = null, threshold = 0.12 } = {}) {
  const nodes = [...document.querySelectorAll(selector)];
  const reveal = node => node.classList.add("is-revealed");
  if (!controller?.motionAllowed || !("IntersectionObserver" in window)) {
    nodes.forEach(reveal);
    return { disconnect() {} };
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { reveal(entry.target); observer.unobserve(entry.target); }
    });
  }, { root, threshold });
  nodes.forEach(node => observer.observe(node));
  const onChange = () => { if (!controller.motionAllowed) { nodes.forEach(reveal); observer.disconnect(); } };
  controller.addEventListener("change", onChange);
  return { disconnect() { observer.disconnect(); controller.removeEventListener("change", onChange); } };
}

export function countUp(element, target, { start = 0, duration = 900, controller = null, formatter = value => Math.round(value).toLocaleString("en-US") } = {}) {
  if (!element) return () => {};
  const end = Number(target) || 0;
  if (!controller?.motionAllowed || duration <= 0) { element.textContent = formatter(end); return () => {}; }
  let frame = 0, began = null, pausedAt = null, stopped = false;
  const finish = () => { stopped = true; if (frame) cancelAnimationFrame(frame); element.textContent = formatter(end); document.removeEventListener("visibilitychange", visibility); controller?.removeEventListener("change", onMotionChange); };
  function tick(time) {
    frame = 0;
    if (stopped || document.hidden) return;
    if (began === null) began = time;
    const progress = Math.min(1, (time - began) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = formatter(start + (end - start) * eased);
    if (progress < 1) frame = requestAnimationFrame(tick); else finish();
  }
  function visibility() {
    if (document.hidden) { pausedAt = performance.now(); if (frame) cancelAnimationFrame(frame); frame = 0; }
    else if (!stopped) { if (began !== null && pausedAt !== null) began += performance.now() - pausedAt; pausedAt = null; frame = requestAnimationFrame(tick); }
  }
  const onMotionChange = () => { if (!controller.enabled || controller.reducedMotion) finish(); };
  controller?.addEventListener("change", onMotionChange);
  document.addEventListener("visibilitychange", visibility);
  frame = requestAnimationFrame(tick);
  return finish;
}

export function textDecode(element, finalText, { duration = 700, controller = null } = {}) {
  if (!element) return () => {};
  const target = String(finalText);
  if (!controller?.motionAllowed || duration <= 0) { element.textContent = target; return () => {}; }
  const glyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-/<>[]";
  let frame = 0, began = null, stopped = false, pausedAt = null;
  const finish = () => { stopped = true; if (frame) cancelAnimationFrame(frame); element.textContent = target; document.removeEventListener("visibilitychange", visibility); controller?.removeEventListener("change", onMotionChange); };
  function tick(time) {
    frame = 0;
    if (stopped || document.hidden) return;
    if (began === null) began = time;
    const progress = Math.min(1, (time - began) / duration);
    const settled = Math.floor(progress * target.length);
    let output = "";
    for (let i = 0; i < target.length; i++) {
      if (target[i] === " " || i < settled) output += target[i];
      else output += glyphs[Math.floor(Math.random() * glyphs.length)];
    }
    element.textContent = output;
    if (progress < 1) frame = requestAnimationFrame(tick); else finish();
  }
  function visibility() {
    if (document.hidden) { pausedAt = performance.now(); if (frame) cancelAnimationFrame(frame); frame = 0; }
    else if (!stopped) { if (began !== null && pausedAt !== null) began += performance.now() - pausedAt; pausedAt = null; frame = requestAnimationFrame(tick); }
  }
  const onMotionChange = () => { if (!controller.enabled || controller.reducedMotion) finish(); };
  controller?.addEventListener("change", onMotionChange);
  document.addEventListener("visibilitychange", visibility);
  frame = requestAnimationFrame(tick);
  return finish;
}

if (typeof window !== "undefined") window.MotionController ??= MotionController;
