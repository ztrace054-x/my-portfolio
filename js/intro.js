import { CONTENT, TIMING, storage } from './config.js?v=20261015.3';

const TYPE_SPEED = 15;
const LINE_PAUSE = 220;
const HOLD = 1100;

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

  /* Horizontal red matrix / warning streams (left-right, not top-down) */
  function startRain() {
    const canvas = overlay.querySelector('canvas');
    const ctx = canvas?.getContext?.('2d');
    if (!ctx || typeof requestAnimationFrame !== 'function') return () => {};
    const size = 14;
    const glyphs = '01<>/{}[]$#=+*WARNINGERRORTRACE@#%'.split('');
    let streams = [], raf = 0, last = 0;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const rows = Math.ceil(canvas.height / size);
      streams = Array.from({ length: rows }, (_, i) => ({
        x: Math.random() * canvas.width,
        y: i * size,
        speed: 1.2 + Math.random() * 2.8,
        dir: Math.random() > 0.5 ? 1 : -1,
        len: 8 + (Math.random() * 18 | 0),
      }));
    };
    const draw = now => {
      raf = requestAnimationFrame(draw);
      if (now - last < 40) return;
      last = now;
      ctx.fillStyle = 'rgba(5,2,4,.18)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = size + 'px monospace';
      streams.forEach(s => {
        for (let k = 0; k < s.len; k++) {
          const alpha = 1 - k / s.len;
          ctx.fillStyle = `rgba(255,42,61,${0.15 + alpha * 0.55})`;
          const ch = glyphs[(Math.random() * glyphs.length) | 0];
          ctx.fillText(ch, s.x - k * size * s.dir, s.y);
        }
        s.x += s.speed * s.dir;
        if (s.x > canvas.width + 40 || s.x < -40) {
          s.x = s.dir > 0 ? -20 : canvas.width + 20;
          s.speed = 1.2 + Math.random() * 2.8;
          s.len = 8 + (Math.random() * 18 | 0);
        }
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
    if (document.activeElement === skip) document.querySelector('.wordmark')?.focus({ preventScroll: true });
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

  const bypass = !motionAllowed || location.hash || window.scrollY > 10;

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
  let offset = 160;
  for (const [index, line] of lines.entries()) {
    const text = line.dataset.bootLine;
    later(() => line.classList.add('is-typing'), offset);
    for (let count = 1; count <= text.length; count++) {
      later(() => { line.textContent = text.slice(0, count); }, offset + count * TYPE_SPEED);
    }
    if (index > 0) later(() => line.classList.add('line-flicker'), offset + 60);
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
