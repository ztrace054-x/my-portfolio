import { CONTENT, storage } from './config.js?v=20261016.1';
import { initPhantomSignal } from './phantom-signal.js?v=20261108.1';

const root = document.documentElement;
const asyncFontStylesheet = document.querySelector('link[data-async-fonts]');
if (asyncFontStylesheet) asyncFontStylesheet.media = 'all';
root.dataset.release = '20261106.4';
root.dataset.scrollEngine = 'native';

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const fine = matchMedia('(min-width: 901px) and (pointer: fine) and (hover: hover)');
const getAllowed = () => !['off', '0'].includes(storage.get(CONTENT.motionKey)) && !reduced.matches;
let motionAllowed = getAllowed();
let entered = false;
let cursor, animations, navigation, contact, terminal, journey, clock;
let initCursor;
let portfolioModulesPromise;
let portfolioControllersReady = false;

// Keep the first-load module graph small: the visitor intro needs only the
// configuration and Phantom Signal modules. Portfolio interactions are loaded
// in the background after the intro has painted, before its handoff completes.
function loadPortfolioModules() {
  if (!portfolioModulesPromise) {
    portfolioModulesPromise = Promise.all([
      import('./motion.js?v=20261016.1'),
      import('./navigation.js?v=20261018.3'),
      import('./gallery.js?v=20261016.1'),
      import('./cursor.js?v=20261018.5'),
      import('./animations.js?v=20261109.3'),
      import('./terminal.js?v=20261016.1'),
      import('./journey.js?v=20261018.4'),
      import('./contact.js?v=20261016.1')
    ]);
  }
  return portfolioModulesPromise;
}

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
  cursor?.dispose();
  cursor = null;
  if (entered && motionAllowed && fine.matches && initCursor) {
    try { cursor = initCursor({ clock }); } catch { root.classList.remove('has-cursor'); }
  }
}

controls();
const intro = initPhantomSignal({ motionAllowed });

function setMotion() {
  motionAllowed = getAllowed();
  controls();
  intro.setMotion(motionAllowed);
  const appShell = document.getElementById('app-shell');
  if (appShell && !appShell.hidden) return;
  journey?.setMotion(motionAllowed);
  animations?.setMotion(motionAllowed);
  terminal?.setMotion(motionAllowed);
  contact?.setMotion(motionAllowed);
  setCursor();
}

document.querySelectorAll('[data-motion-toggle]').forEach(button => button.addEventListener('click', () => {
  if (reduced.matches) return;
  storage.set(CONTENT.motionKey, motionAllowed ? 'off' : 'on');
  setMotion();
}));
reduced.addEventListener('change', setMotion);
fine.addEventListener('change', setCursor);

function initializePortfolioControllers(modules) {
  if (portfolioControllersReady) return;
  const [motionModule, navigationModule, galleryModule, cursorModule, animationsModule, terminalModule, journeyModule, contactModule] = modules;
  clock = motionModule.createClock();
  initCursor = cursorModule.initCursor;
  const overlays = navigationModule.createOverlayManager({ getScroll: () => null, refresh: () => {} });
  navigation = navigationModule.initNavigation({ getScroll: () => null, getMotion: () => motionAllowed, overlays });
  galleryModule.initGallery({ overlays });
  contact = contactModule.initContact({ motionAllowed, clock });
  terminal = terminalModule.initTerminal({ clock, motionAllowed });
  journey = journeyModule.initJourney({ motionAllowed });
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
  entered = true;
  root.classList.add('hero-motion-ready');
  try { animations = animationsModule.initAnimations({ clock, motionAllowed, heroEntry: !location.hash && window.scrollY < 20 }); }
  catch { /* The source content remains readable without decorative reveals. */ }
  portfolioControllersReady = true;
  setCursor();
}

let dashboardPromise;
let workspaceStylesPromise;
let lastActivatedWorkspaceHash = '';
function loadWorkspaceStyles() {
  if (!workspaceStylesPromise) {
    const links = [...document.querySelectorAll('link[data-workspace-styles]')];
    workspaceStylesPromise = Promise.all(links.map(link => new Promise(resolve => {
      if (link.sheet) {
        link.media = 'all';
        resolve();
        return;
      }
      const ready = () => {
        link.dataset.workspaceStylesReady = 'true';
        resolve();
      };
      link.addEventListener('load', ready, { once: true });
      link.addEventListener('error', ready, { once: true });
      link.media = 'all';
      if (link.sheet) ready();
    })));
  }
  return workspaceStylesPromise;
}
async function activateWorkspaceFromRoute() {
  if (!location.hash.startsWith('#/')) return;
  await loadWorkspaceStyles();
  if (!location.hash.startsWith('#/')) return;
  if (!dashboardPromise) {
    dashboardPromise = import('./dashboard-shell.js?v=20261106.4').then(({ initDashboardShell }) => initDashboardShell());
  }
  const dashboard = await dashboardPromise;
  const routeHash = location.hash;
  if (routeHash.startsWith('#/') && routeHash !== lastActivatedWorkspaceHash) {
    lastActivatedWorkspaceHash = routeHash;
    dashboard.activate();
  }
}
window.addEventListener('hashchange', activateWorkspaceFromRoute);

intro.entryStarted.then(() => {
  // Give the intro title its first paint before starting secondary module fetches.
  window.setTimeout(() => { loadPortfolioModules(); }, 500);
});
intro.completed.then(async () => {
  const modules = await loadPortfolioModules();
  initializePortfolioControllers(modules);
  document.documentElement.classList.remove('intro-pending');
  if (location.hash.startsWith('#/')) await activateWorkspaceFromRoute();
});

window.addEventListener('beforeprint', () => {
  intro.cancel();
  animations?.setMotion(false);
  terminal?.setMotion(false);
  journey?.setMotion(false);
  contact?.setMotion(false);
  cursor?.dispose();
  cursor = null;
});
window.addEventListener('afterprint', setMotion);
