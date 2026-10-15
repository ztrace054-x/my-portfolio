import { CONTENT, TIMING, storage } from './config.js?v=20261014.1';

const TYPE_SPEED = 16;   // ms per character
const LINE_PAUSE = 240;  // ms between boot lines
const HOLD = 950;        // ms ACCESS GRANTED stays before the intro leaves

export function initIntro({ motionAllowed }) {
  const overlay = document.getElementById('intro');
  const page = document.getElementById('page');
  const skip = document.getElementById('skip-intro');
  const timers = new Set();
  const events = new AbortController();
  let state = 'idle';
  let exitTimer;
  let stopRain = () => {};
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
  const setProgress = value => overlay.style.setProperty?.('--p', String(value));

  /* Faint matrix rain behind the terminal. Optional: skipped if canvas is unavailable. */
  function startRain() {
    const canvas = overlay.querySelector('canvas');
    const ctx = canvas?.getContext?.('2d');
    if (!ctx || typeof requestAnimationFrame !== 'function') return () => {};
    const size = 16;
    const glyphs = '01<>/{}[]$#=+*'.split('');
    let drops = [], raf = 0, last = 0;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drops = Array.from({ length: Math.ceil(canvas.width / size) }, () => Math.random() * -30);
    };
    const draw = now => {
      raf = requestAnimationFrame(draw);
      if (now - last < 48) return;
      last = now;
      ctx.fillStyle = 'rgba(7,9,12,.14)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#85e9ad';
      ctx.font = size + 'px monospace';
      drops.forEach((y, i) => {
        ctx.fillText(glyphs[(Math.random() * glyphs.length) | 0], i * size, y * size);
        drops[i] = y * size > canvas.height && Math.random() > 0.96 ? 0 : y + 1;
      });
    };
    resize();
    window.addEventListener('resize', resize, { signal: events.signal });
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }

  function finish() {
    if (state === 'finished') return;
    state = 'finished';
    clearTyping();
    clearTimeout(exitTimer);
    stopRain();
    events.abort();
    overlay.hidden = true;
    page.inert = false;
    document.documentElement.classList.remove('is-intro');
    resolveEntry();
    storage.set(CONTENT.visitedKey, String(Date.now()));
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

  // Always show the intro on the main link.
  // Only skip when motion is off, page has a hash, or user already scrolled.
  const bypass = !motionAllowed || location.hash || window.scrollY > 10;

  // Essential cancellation and the deadline exist before any overlay is shown.
  skip.addEventListener('click', () => exit(true), { signal: events.signal });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') exit(true); }, { signal: events.signal });
  if (bypass) { finish(); return { completed, entryStarted, cancel: () => finish() }; }
  state = 'playing';
  later(finish, TIMING.introDeadline);
  page.inert = true;
  overlay.hidden = false;
  document.documentElement.classList.add('is-intro');
  stopRain = startRain();

  const lines = [...overlay.querySelectorAll('[data-boot-line]')];
  let offset = 180;
  for (const [index, line] of lines.entries()) {
    const text = line.dataset.bootLine;
    later(() => line.classList.add('is-typing'), offset);
    for (let count = 1; count <= text.length; count++) {
      later(() => { line.textContent = text.slice(0, count); }, offset + count * TYPE_SPEED);
    }
    if (index > 0) later(() => line.classList.add('line-flicker'), offset + 75);
    offset += text.length * TYPE_SPEED;
    later(() => {
      line.classList.remove('is-typing');
      line.classList.add('is-done');
      setProgress(((index + 1) / lines.length) * 0.92);
    }, offset);
    offset += LINE_PAUSE;
  }
  later(() => { setProgress(1); overlay.classList.add('is-ready'); }, offset);
  later(() => exit(), offset + HOLD);
  return { completed, entryStarted, cancel: () => exit(true, true) };
}
