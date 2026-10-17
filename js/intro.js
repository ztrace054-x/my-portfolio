import { INTRO_DURATION, INTRO_KEY, STAGES, stageAt, shouldPlayIntro } from './intro-timeline.js?v=20261016.1';

export function initIntro({ clock, motionAllowed }) {
  const root = document.getElementById('intro');
  const page = document.getElementById('page');
  const skip = document.getElementById('skip-intro');
  let resolveCompleted, resolveEntry;
  const completed = new Promise(resolve => { resolveCompleted = resolve; });
  const entryStarted = new Promise(resolve => { resolveEntry = resolve; });
  const events = new AbortController();
  let stopped = false, started = false, exiting = false, elapsed = 0, previous = -1;
  let unsubscribe, deadline;
  let seen = false;
  try { seen = sessionStorage.getItem(INTRO_KEY) === 'seen'; } catch { /* Storage is optional. */ }
  const query = new URLSearchParams(location.search);
  const replay = query.get('intro') === '1';
  function finish() {
    if (stopped) return;
    stopped = true;
    unsubscribe?.(); clearTimeout(deadline); events.abort();
    root.hidden = true; root.classList.remove('is-exiting');
    page.inert = false;
    document.documentElement.classList.remove('is-intro');
    if (started) {
      try { sessionStorage.setItem(INTRO_KEY, 'seen'); } catch { /* Private mode remains usable. */ }
      // Focus stays predictable after the only interactive intro control disappears.
      if (root.contains(document.activeElement)) {
        const hero = document.getElementById('hero-title');
        hero.setAttribute('tabindex', '-1'); hero.focus({ preventScroll: true });
        hero.addEventListener('blur', () => hero.removeAttribute('tabindex'), { once: true });
      }
    }
    resolveEntry(); resolveCompleted();
  }
  if (!shouldPlayIntro({ motionAllowed, seen, replay, hash: location.hash })) {
    finish(); return { completed, entryStarted, cancel: finish };
  }
  // Register escape routes and a fail-safe before making the page inert.
  skip.addEventListener('click', finish, { signal: events.signal });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); finish(); }
    if (event.key === 'Tab') { event.preventDefault(); skip.focus(); }
  }, { signal: events.signal });
  deadline = setTimeout(finish, 9500);
  started = true; root.hidden = false; page.inert = true;
  document.documentElement.classList.add('is-intro');
  skip.focus({ preventScroll: true });
  if (replay) {
    query.delete('intro');
    const rest = query.toString();
    history.replaceState(history.state, '', location.pathname + (rest ? '?' + rest : '') + location.hash);
  }
  const title = document.getElementById('intro-title');
  const message = document.getElementById('intro-message');
  const status = document.getElementById('intro-status');
  const percent = document.getElementById('intro-percent');
  const progress = root.querySelector('.intro-progress');
  const bar = progress.querySelector('span');
  const nodes = [...root.querySelectorAll('.intro-nodes>span')];
  const logs = [...root.querySelectorAll('#intro-log p')];
  const stageIndex = document.getElementById('intro-stage-index');
  const canvas = document.getElementById('intro-rain');
  let ctx = null;
  try { ctx = canvas.getContext('2d', { alpha: true }); } catch { /* Typography is the fallback. */ }
  const mobile = matchMedia('(max-width: 600px)').matches;
  let width = 1, height = 1, columns = [], rainTime = 0;
  const resize = () => {
    width = root.clientWidth; height = root.clientHeight;
    canvas.width = width; canvas.height = height;
    columns = Array.from({ length: Math.ceil(width / (mobile ? 36 : 24)) }, (_, i) => (i * 137) % Math.max(1, height));
  };
  resize();
  window.addEventListener('resize', resize, { passive: true, signal: events.signal });
  function paintRain(dt) {
    if (!ctx || (rainTime += dt) < (mobile ? 100 : 66)) return;
    const movement = rainTime * .045; rainTime = 0;
    ctx.clearRect(0, 0, width, height);
    ctx.font = '10px monospace';
    columns.forEach((y, index) => {
      columns[index] = (y + movement) % (height + 180);
      const x = index * (mobile ? 36 : 24);
      for (let tail = 0; tail < 8; tail++) {
        ctx.fillStyle = `rgba(125,255,154,${(1 - tail / 8) * .48})`;
        ctx.fillText('01A7F3'[Math.floor(index + tail + elapsed / 300) % 6], x, y - tail * 16);
      }
    });
  }
  function updateStage(index) {
    const [, heading, detail, amount] = STAGES[index];
    title.textContent = heading; message.textContent = detail;
    status.textContent = index >= 17 ? 'PROFILE UNLOCKED' : index >= 11 ? 'IDENTITY VERIFICATION' : 'SIMULATED NETWORK';
    percent.textContent = String(amount).padStart(2, '0') + '%';
    progress.setAttribute('aria-valuenow', String(amount)); bar.style.transform = `scaleX(${amount / 100})`;
    stageIndex.textContent = String(index + 1).padStart(2, '0') + ' / ' + STAGES.length;
    logs.forEach((line, i) => { line.textContent = '> ' + STAGES[Math.max(0, index - 2 + i)][4]; });
    nodes.forEach((node, i) => {
      node.classList.toggle('is-secure', index >= 9 || (index >= 7 && i < 3));
      node.classList.toggle('is-error', index === 8 && i >= 3 && i <= 5);
    });
    root.classList.toggle('has-warning', index >= 5 && index <= 8);
    root.classList.toggle('is-glitch', index === 5 || index === 8);
    root.classList.toggle('is-granted', index >= 17);
  }
  updateStage(0);
  unsubscribe = clock.subscribe((_time, dt) => {
    elapsed += dt;
    const index = stageAt(elapsed);
    if (index !== previous) { previous = index; updateStage(index); }
    if (index === 15) {
      const text = 'VERIFYING IDENTITY';
      const revealed = Math.floor((elapsed - 5300) / 450 * text.length);
      const tick = Math.floor(elapsed / 95);
      title.textContent = [...text].map((char, i) => i < revealed || char === ' ' ? char : '01X7_9'[(i + tick) % 6]).join('');
    }
    if (elapsed >= 6900 && !exiting) { exiting = true; root.classList.add('is-exiting'); resolveEntry(); }
    if (elapsed >= INTRO_DURATION) finish();
    else paintRain(dt);
  });
  return { completed, entryStarted, cancel: finish };
}
