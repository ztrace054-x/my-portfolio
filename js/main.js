import { CONTENT, storage } from './config.js?v=20261016.1';
import { createClock } from './motion.js?v=20261016.1';
import { initPhase2Gate } from './phase2-gate.js?v=20261021.2';
import { initContact } from './contact.js?v=20261016.1';
import { createOverlayManager, initNavigation } from './navigation.js?v=20261018.3';
import { initGallery } from './gallery.js?v=20261016.1';
import { initHeroScene } from './hero-scene.js?v=20261018.3';
import { initCursor } from './cursor.js?v=20261018.5';
import { initAnimations } from './animations.js?v=20261018.5';
import { initTerminal } from './terminal.js?v=20261016.1';
import { initJourney } from './journey.js?v=20261018.4';
import { initDashboardShell } from './dashboard-shell.js?v=20261020.3';

const root = document.documentElement;
root.dataset.release = '20261021.2';
root.dataset.scrollEngine = 'native';
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const fine = matchMedia('(min-width: 901px) and (pointer: fine) and (hover: hover)');
const clock = createClock();
const getAllowed = () => !['off', '0'].includes(storage.get(CONTENT.motionKey)) && !reduced.matches;
let motionAllowed = getAllowed(), entered = false, cursor, scene, animations;
// Core interactions are bound first, independently of visual enhancements.
const overlays = createOverlayManager({ getScroll: () => null, refresh: () => {} });
const navigation = initNavigation({ getScroll: () => null, getMotion: () => motionAllowed, overlays });
initGallery({ overlays });
const contact = initContact({ motionAllowed, clock });
const terminal = initTerminal({ clock, motionAllowed });
const journey = initJourney({ motionAllowed });
document.getElementById('year').textContent = String(new Date().getFullYear());
function controls() {
  root.classList.toggle('motion-off', !motionAllowed);
  root.dataset.reducedMotion = String(reduced.matches);
  document.querySelectorAll('[data-motion-toggle]').forEach(button => {
    button.setAttribute('aria-pressed', String(motionAllowed));
    button.setAttribute('aria-label', reduced.matches ? 'Animations are off to follow your system preference' : motionAllowed ? 'Turn animations off' : 'Turn animations on');
    button.setAttribute('aria-disabled', String(reduced.matches));
    button.querySelector('[data-motion-label]').textContent = motionAllowed ? 'Motion on' : 'Motion off';
  });
}
function setCursor() {
  cursor?.dispose(); cursor = null;
  if (entered && motionAllowed && fine.matches) {
    try { cursor = initCursor({ clock }); } catch { root.classList.remove('has-cursor'); }
  }
}
controls();
const intro = initPhase2Gate({ clock, motionAllowed });
try { scene = initHeroScene({ clock, motionAllowed: false }); } catch { /* Accessible inline SVG remains. */ }
function setMotion() {
  motionAllowed = getAllowed(); controls();
  intro.setMotion(motionAllowed);
  // Once the dashboard shell is active, keep legacy-page visual controllers dormant.
  const appShell = document.getElementById('app-shell');
  if (appShell && !appShell.hidden) return;
  scene?.setMotion(motionAllowed && entered); journey.setMotion(motionAllowed);
  animations?.setMotion(motionAllowed); terminal.setMotion(motionAllowed); contact.setMotion(motionAllowed); setCursor();
}
document.querySelectorAll('[data-motion-toggle]').forEach(button => button.addEventListener('click', () => {
  if (reduced.matches) return;
  storage.set(CONTENT.motionKey, motionAllowed ? 'off' : 'on'); setMotion();
}));
reduced.addEventListener('change', setMotion);
fine.addEventListener('change', setCursor);
intro.entryStarted.then(() => {
  entered = true;
  // Phase 3 replaces the legacy one-page view after the gate; keep its source intact,
  // but do not start background animation loops for content that is no longer visible.
  if (document.getElementById('app-shell')) return;
  root.classList.add('hero-motion-ready');
  try { animations = initAnimations({ clock, motionAllowed, heroEntry: !location.hash && window.scrollY < 20 }); } catch { /* Source content stays readable. */ }
  scene?.setMotion(motionAllowed); setCursor();
});
let dashboard;
intro.completed.then(() => {
  if (!dashboard) dashboard = initDashboardShell();
  dashboard.activate();
});
window.addEventListener('beforeprint', () => { intro.cancel(); scene?.setMotion(false); animations?.setMotion(false); terminal.setMotion(false); journey.setMotion(false); contact.setMotion(false); cursor?.dispose(); cursor = null; });
window.addEventListener('afterprint', setMotion);
