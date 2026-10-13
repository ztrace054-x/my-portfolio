import { CONTENT, DEPENDENCIES, TIMING, storage } from './config.js';
import { initIntro } from './intro.js';
import { initContact } from './contact.js';
import { createOverlayManager, initNavigation } from './navigation.js';
import { initGallery } from './gallery.js';
import { initHeroScene } from './hero-scene.js';
import { initCursor } from './cursor.js';
import { initAnimations } from './animations.js';
import { installSmoothScroll } from './smooth-scroll.js';

/* One clock feeds scene/cursor. It switches to GSAP without a second RAF loop. */
export function createClock() {
  const callbacks = new Set();
  let ticker = null, raf = 0, attached = false, last = 0;
  const frame = milliseconds => {
    const dt = last ? Math.min(64, milliseconds - last) : 16;
    last = milliseconds;
    callbacks.forEach(callback => callback(milliseconds, dt));
  };
  const nativeTick = time => { raf = 0; frame(time); reconcile(); };
  const gsapTick = seconds => frame(seconds * 1000);
  function reconcile() {
    const run = callbacks.size > 0 && !document.hidden;
    if (ticker) {
      if (raf) cancelAnimationFrame(raf); raf = 0;
      if (run && !attached) { ticker.add(gsapTick); attached = true; }
      if (!run && attached) { ticker.remove(gsapTick); attached = false; }
    } else {
      if (run && !raf) raf = requestAnimationFrame(nativeTick);
      if (!run && raf) { cancelAnimationFrame(raf); raf = 0; }
    }
    if (!run) last = 0;
  }
  const visibility = () => reconcile();
  document.addEventListener('visibilitychange', visibility);
  return {
    subscribe(callback) { callbacks.add(callback); reconcile(); return () => { callbacks.delete(callback); reconcile(); }; },
    setTicker(next) { if (ticker && attached) ticker.remove(gsapTick); attached = false; ticker = next; last = 0; reconcile(); },
    dispose() { callbacks.clear(); reconcile(); document.removeEventListener('visibilitychange', visibility); },
  };
}

function loadScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url; script.async = true; script.crossOrigin = 'anonymous';
    script.onload = resolve; script.onerror = () => reject(new Error('Optional dependency unavailable'));
    document.head.append(script);
  });
}
export async function loadDependencies() {
  let ended = false, timer;
  const style = document.createElement('link');
  style.rel = 'stylesheet'; style.href = DEPENDENCIES.lenisCss; document.head.append(style);
  const group = Promise.all([
    loadScript(DEPENDENCIES.gsap).then(() => {
      if (ended) throw new Error('Deadline reached');
      return loadScript(DEPENDENCIES.scrollTrigger);
    }),
    loadScript(DEPENDENCIES.lenis),
  ]).then(() => {
    if (window.gsap?.version !== '3.15.0' || window.ScrollTrigger?.version !== '3.15.0' || typeof window.Lenis !== 'function') return null;
    return { gsap: window.gsap, ScrollTrigger: window.ScrollTrigger, Lenis: window.Lenis };
  }).catch(() => null);
  const deadline = new Promise(resolve => { timer = setTimeout(() => resolve(null), TIMING.dependencyDeadline); });
  const result = await Promise.race([group, deadline]);
  ended = true; clearTimeout(timer);
  return result;
}

// Bind native functionality before contacting a CDN.
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const fine = matchMedia('(min-width: 768px) and (pointer: fine) and (hover: hover)');
const smoothEligible = matchMedia('(min-width: 768px) and (pointer: fine)');
let motionAllowed = storage.get(CONTENT.motionKey) !== 'off' && !reduced.matches;
let dependencies = null, animations = null, smooth = null, cursor = null;
let entryAt = 0, entered = false;
let viewportRestore = 0, previousOverflowAnchor = '';
const seen = new Set();
const clock = createClock();
const contact = initContact({ motionAllowed });
const overlays = createOverlayManager({ getScroll: () => smooth?.instance, refresh: () => animations?.refresh() });
const navigation = initNavigation({ getScroll: () => smooth?.instance, getMotion: () => motionAllowed, overlays });
initGallery({ overlays });
const intro = initIntro({ motionAllowed });
let scene;
// An unsupported canvas must not affect the rest of the application.
try { scene = initHeroScene({ clock, motionAllowed }); } catch { /* Inline SVG remains visible. */ }
document.getElementById('year').textContent = String(new Date().getFullYear());

function updateControls() {
  document.documentElement.classList.toggle('motion-off', !motionAllowed);
  document.documentElement.dataset.reducedMotion = String(reduced.matches);
  document.querySelectorAll('[data-motion-toggle]').forEach(button => {
    button.setAttribute('aria-pressed', String(motionAllowed));
    button.setAttribute('aria-label', reduced.matches ? 'Animations are off to follow your system preference' : motionAllowed ? 'Turn animations off' : 'Turn animations on');
    button.querySelector('[data-motion-label]').textContent = motionAllowed ? 'Motion on' : 'Motion off';
  });
}
function destroyMotion() {
  // Preserve the element under the viewport when a pin spacer disappears.
  const element = document.elementFromPoint(window.innerWidth / 2, window.innerHeight * .55)?.closest('article,section');
  const before = element?.getBoundingClientRect().top;
  const root = document.documentElement;
  if (viewportRestore) cancelAnimationFrame(viewportRestore);
  else previousOverflowAnchor = root.style.overflowAnchor;
  // Pin removal and browser scroll anchoring must not both adjust the viewport.
  root.style.overflowAnchor = 'none';
  cursor?.dispose(); cursor = null;
  smooth?.dispose(); smooth = null;
  animations?.dispose(); animations = null;
  clock.setTicker(null);
  const restore = () => {
    if (element && before !== undefined) window.scrollTo({ top: window.scrollY + element.getBoundingClientRect().top - before, behavior: 'instant' });
  };
  restore();
  // Complete after ScrollTrigger has reverted its pin and restored native styles.
  viewportRestore = requestAnimationFrame(() => {
    restore();
    root.style.overflowAnchor = previousOverflowAnchor;
    viewportRestore = 0;
  });
  document.documentElement.dataset.scrollEngine = 'native';
}
function enhance() {
  if (!entered || !motionAllowed || !dependencies || animations) return;
  const { gsap, ScrollTrigger, Lenis } = dependencies;
  clock.setTicker(gsap.ticker);
  try {
    animations = initAnimations({ gsap, ScrollTrigger, seen, heroEntry: !location.hash && window.scrollY < 20 && performance.now() - entryAt < 350 });
    smooth = installSmoothScroll({ gsap, ScrollTrigger, Lenis, enabled: smoothEligible.matches });
    if (overlays.locked) smooth?.instance.stop();
    if (fine.matches) cursor = initCursor({ clock });
    document.documentElement.dataset.scrollEngine = smooth ? 'lenis' : 'native';
  } catch { destroyMotion(); }
}
function setMotion() {
  motionAllowed = storage.get(CONTENT.motionKey) !== 'off' && !reduced.matches;
  updateControls();
  if (!motionAllowed) { intro.cancel(); contact.setMotion(false); destroyMotion(); }
  scene?.setMotion(motionAllowed);
  if (motionAllowed) enhance();
}
document.querySelectorAll('[data-motion-toggle]').forEach(button => button.addEventListener('click', () => {
  storage.set(CONTENT.motionKey, motionAllowed ? 'off' : 'on');
  setMotion();
}));
reduced.addEventListener('change', setMotion);
const onCapability = () => { destroyMotion(); enhance(); };
fine.addEventListener('change', onCapability);
smoothEligible.addEventListener('change', onCapability);
updateControls();
document.documentElement.dataset.scrollEngine = 'native';

const dependencyPromise = loadDependencies();
intro.entryStarted.then(() => { entered = true; entryAt = performance.now(); enhance(); });
intro.completed.then(() => { if (location.hash) navigation.goTo(location.hash, false); });
dependencyPromise.then(result => {
  dependencies = result;
  document.documentElement.dataset.dependencies = result ? 'ready' : 'unavailable';
  enhance();
  document.fonts?.ready.then(() => animations?.refresh());
});
// A bfcache return refreshes geometry without initializing another set of owners.
window.addEventListener('pageshow', event => { if (event.persisted) animations?.refresh(); });
window.addEventListener('beforeprint', () => { intro.cancel(); destroyMotion(); scene?.setMotion(false); });
window.addEventListener('afterprint', () => { scene?.setMotion(motionAllowed); enhance(); });
