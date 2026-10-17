import { CONTENT, storage } from './config.js?v=20261016.1';
import { createClock } from './motion.js?v=20261016.1';
import { initIntro } from './intro.js?v=20261017.2';
import { initAmbientField } from './ambient-field.js?v=20261017.3';
import { initContact } from './contact.js?v=20261016.1';
import { createOverlayManager, initNavigation } from './navigation.js?v=20261016.1';
import { initGallery } from './gallery.js?v=20261016.1';
import { initHeroScene } from './hero-scene.js?v=20261016.1';
import { initCursor } from './cursor.js?v=20261016.1';
import { initAnimations } from './animations.js?v=20261016.1';
import { initTerminal } from './terminal.js?v=20261016.1';

const root = document.documentElement;
root.dataset.release = '20261017.3';
root.dataset.scrollEngine = 'native';
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const fine = matchMedia('(min-width: 901px) and (pointer: fine) and (hover: hover)');
const clock = createClock();
const getAllowed = () => !['off', '0'].includes(storage.get(CONTENT.motionKey)) && !reduced.matches;
let motionAllowed = getAllowed(), entered = false, cursor, scene, ambient, animations;
// Core interactions are bound first, independently of visual enhancements.
const overlays = createOverlayManager({ getScroll: () => null, refresh: () => {} });
const navigation = initNavigation({ getScroll: () => null, getMotion: () => motionAllowed, overlays });
initGallery({ overlays });
const contact = initContact({ motionAllowed, clock });
const terminal = initTerminal({ clock, motionAllowed });
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
const intro = initIntro({ clock, motionAllowed });
try { scene = initHeroScene({ clock, motionAllowed: false }); } catch { /* Accessible inline SVG remains. */ }
try { ambient = initAmbientField({ clock, motionAllowed: false }); } catch { /* Static CSS atmosphere remains. */ }
function setMotion() {
  motionAllowed = getAllowed(); controls();
  if (!motionAllowed) intro.cancel();
  scene?.setMotion(motionAllowed && entered);
  ambient?.setMotion(motionAllowed && entered);
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
  try { animations = initAnimations({ clock, motionAllowed, heroEntry: !location.hash && window.scrollY < 20 }); } catch { /* Source content stays readable. */ }
  scene?.setMotion(motionAllowed); ambient?.setMotion(motionAllowed); setCursor();
});
intro.completed.then(() => { if (location.hash) navigation.goTo(location.hash, false); });
window.addEventListener('beforeprint', () => { intro.cancel(); scene?.setMotion(false); ambient?.setMotion(false); animations?.setMotion(false); terminal.setMotion(false); contact.setMotion(false); cursor?.dispose(); cursor = null; });
window.addEventListener('afterprint', setMotion);
