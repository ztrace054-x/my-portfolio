import { CONTENT, TIMING, storage } from './config.js';

export function initIntro({ motionAllowed }) {
  const overlay = document.getElementById('intro');
  const page = document.getElementById('page');
  const skip = document.getElementById('skip-intro');
  const timers = new Set();
  const events = new AbortController();
  let state = 'idle';
  let exitTimer;
  let resolve;
  const completed = new Promise(done => { resolve = done; });
  let resolveEntry;
  const entryStarted = new Promise(done => { resolveEntry = done; });
  const later = (fn, delay) => {
    const id = setTimeout(() => { timers.delete(id); if (state === 'playing') fn(); }, delay);
    timers.add(id);
  };
  const clearTyping = () => {
    for (const id of timers) clearTimeout(id);
    timers.clear();
    overlay.querySelectorAll('.is-typing').forEach(line => line.classList.remove('is-typing'));
  };
  function finish() {
    if (state === 'finished') return;
    state = 'finished';
    clearTyping();
    clearTimeout(exitTimer);
    events.abort();
    overlay.hidden = true;
    page.inert = false;
    document.documentElement.classList.remove('is-intro');
    resolveEntry();
    storage.set(CONTENT.visitedKey, 'yes');
    if (document.activeElement === skip) document.querySelector('.wordmark').focus({ preventScroll: true });
    resolve();
  }
  function exit(fast = false, immediate = false) {
    if (state === 'finished') return;
    if (immediate) { finish(); return; }
    if (state === 'leaving') return;
    state = 'leaving';
    resolveEntry();
    clearTyping();
    overlay.classList.add('is-leaving');
    overlay.classList.toggle('is-skipping', fast);
    exitTimer = setTimeout(finish, fast ? TIMING.skipExit : TIMING.introExit);
  }
  const bypass = !motionAllowed || location.hash || storage.get(CONTENT.visitedKey) || window.scrollY > 10;
  // Essential cancellation and the deadline exist before any overlay is shown.
  skip.addEventListener('click', () => exit(true), { signal: events.signal });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') exit(true); }, { signal: events.signal });
  if (bypass) { finish(); return { completed, entryStarted, cancel: () => finish() }; }
  state = 'playing';
  later(finish, TIMING.introDeadline);
  page.inert = true;
  overlay.hidden = false;
  document.documentElement.classList.add('is-intro');
  const lines = [...overlay.querySelectorAll('[data-boot-line]')];
  let offset = 180;
  for (const [index, line] of lines.entries()) {
    const text = line.dataset.bootLine;
    later(() => line.classList.add('is-typing'), offset);
    for (let count = 1; count <= text.length; count++) {
      later(() => { line.textContent = text.slice(0, count); }, offset + count * 9);
    }
    if (index > 0) later(() => line.classList.add('line-flicker'), offset + 75);
    offset += text.length * 9;
    later(() => line.classList.remove('is-typing'), offset);
    offset += 60;
  }
  later(() => overlay.classList.add('is-ready'), 1050);
  later(() => exit(), 1300);
  return { completed, entryStarted, cancel: () => exit(true, true) };
}
