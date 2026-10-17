import { INTRO_CONFIG, INTRO_DURATION, INTRO_KEY, STAGES, stageAt, shouldPlayIntro } from './intro-timeline.js?v=20261017.2';

export function initIntro({ clock, motionAllowed, reducedMotion }) {
  if (reducedMotion === undefined) reducedMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.getElementById('intro');
  const page = document.getElementById('page');
  const skip = document.getElementById('skip-intro');
  const title = document.getElementById('intro-title');
  const message = document.getElementById('intro-message');
  const status = document.getElementById('intro-status');
  const percent = document.getElementById('intro-percent');
  const progress = root.querySelector('.intro-progress');
  const bar = progress.querySelector('span');
  const nodes = [...root.querySelectorAll('.intro-nodes>span')];
  const logs = [...root.querySelectorAll('#intro-log p')];
  const stageIndex = document.getElementById('intro-stage-index');
  const packets = document.getElementById('intro-packets');
  const latency = document.getElementById('intro-latency');
  const integrity = document.getElementById('intro-integrity');
  let resolveCompleted, resolveEntry;
  const completed = new Promise(resolve => { resolveCompleted = resolve; });
  const entryStarted = new Promise(resolve => { resolveEntry = resolve; });
  const events = new AbortController();
  let stopped = false, started = false, exiting = false, elapsed = 0, previous = -1;
  let unsubscribe, deadline, exitDeadline;
  let seen = false;
  try { seen = sessionStorage.getItem(INTRO_KEY) === 'seen'; } catch { /* Storage is optional. */ }
  const query = new URLSearchParams(location.search);
  const replay = query.get('intro') === '1';
  let storedMotionOff = false;
  try { storedMotionOff = ['off', '0'].includes(localStorage.getItem('saad-motion')); } catch { /* Storage is optional. */ }
  const introMotionAllowed = motionAllowed || (reducedMotion && !storedMotionOff);

  function finish() {
    if (stopped) return;
    stopped = true;
    unsubscribe?.();
    clearTimeout(deadline);
    clearTimeout(exitDeadline);
    events.abort();
    root.hidden = true;
    root.classList.remove('is-exiting', 'is-reduced-entry', 'is-denied', 'is-granted', 'is-glitch', 'has-warning');
    page.inert = false;
    document.documentElement.classList.remove('is-intro');
    if (started) {
      try { sessionStorage.setItem(INTRO_KEY, 'seen'); } catch { /* Private mode remains usable. */ }
      if (root.contains(document.activeElement)) {
        const hero = document.getElementById('hero-title');
        hero.setAttribute('tabindex', '-1');
        hero.focus({ preventScroll: true });
        hero.addEventListener('blur', () => hero.removeAttribute('tabindex'), { once: true });
      }
    }
    resolveEntry();
    resolveCompleted();
  }

  const shouldPlay = shouldPlayIntro({
    motionAllowed: introMotionAllowed,
    seen,
    replay,
    hash: Boolean(location.hash) || window.scrollY > 10,
  });
  if (!shouldPlay) {
    finish();
    return { completed, entryStarted, cancel: finish };
  }

  skip.addEventListener('click', finish, { signal: events.signal });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      finish();
      return;
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      skip.focus();
    }
  }, { signal: events.signal });

  started = true;
  root.hidden = false;
  page.inert = true;
  document.documentElement.classList.add('is-intro');
  skip.focus({ preventScroll: true });
  if (replay) {
    query.delete('intro');
    const rest = query.toString();
    history.replaceState(history.state, '', location.pathname + (rest ? '?' + rest : '') + location.hash);
  }

  if (reducedMotion) {
    root.classList.add('is-reduced-entry', 'is-granted');
    title.textContent = 'WELCOME, OPERATOR';
    message.textContent = 'REDUCED MOTION // STATIC HANDOFF';
    status.textContent = 'PROFILE READY';
    percent.textContent = '100%';
    progress.setAttribute('aria-valuenow', '100');
    bar.style.transform = 'scaleX(1)';
    stageIndex.textContent = String(STAGES.length).padStart(2, '0') + ' / ' + STAGES.length;
    const reducedLogs = [
      '> MOTION-REDUCED HANDOFF',
      '> SECURITY VISUALS ARE SIMULATED',
      '> ENTERING PORTFOLIO',
    ];
    logs.forEach((line, index) => { line.textContent = reducedLogs[index] || ''; });
    resolveEntry();
    deadline = setTimeout(() => {
      root.classList.add('is-exiting');
      exitDeadline = setTimeout(finish, 280);
    }, 120);
    return { completed, entryStarted, cancel: finish };
  }

  deadline = setTimeout(finish, INTRO_CONFIG.failSafeAt);
  const canvas = document.getElementById('intro-rain');
  let ctx = null;
  try { ctx = canvas.getContext('2d', { alpha: true }); } catch { /* Typography is the fallback. */ }
  const mobile = matchMedia('(max-width: 600px)').matches;
  let width = 1, height = 1, columns = [], rainTime = 0, telemetryTime = 0;

  const resize = () => {
    width = root.clientWidth;
    height = root.clientHeight;
    canvas.width = width;
    canvas.height = height;
    columns = Array.from({ length: Math.ceil(width / (mobile ? 36 : 24)) }, (_, i) => (i * 137) % Math.max(1, height));
  };
  resize();
  window.addEventListener('resize', resize, { passive: true, signal: events.signal });

  function paintRain(dt) {
    if (!ctx || (rainTime += dt) < (mobile ? 100 : 72)) return;
    const movement = rainTime * 0.04;
    rainTime = 0;
    ctx.clearRect(0, 0, width, height);
    ctx.font = '10px monospace';
    columns.forEach((y, index) => {
      columns[index] = (y + movement) % (height + 180);
      const x = index * (mobile ? 36 : 24);
      for (let tail = 0; tail < 7; tail++) {
        ctx.fillStyle = 'rgba(125,255,154,' + ((1 - tail / 7) * 0.38) + ')';
        ctx.fillText('01A7F3'[(index + tail + Math.floor(elapsed / 280)) % 6], x, y - tail * 14);
      }
    });
  }

  function updateStage(index) {
    const [, heading, detail, amount] = STAGES[index];
    title.textContent = heading;
    message.textContent = detail;
    status.textContent = index >= 10 ? 'PROFILE UNLOCKED' : index >= 7 ? 'IDENTITY VERIFICATION' : 'SIMULATED NETWORK';
    percent.textContent = String(amount).padStart(2, '0') + '%';
    progress.setAttribute('aria-valuenow', String(amount));
    bar.style.transform = 'scaleX(' + (amount / 100) + ')';
    stageIndex.textContent = String(index + 1).padStart(2, '0') + ' / ' + STAGES.length;
    logs.forEach((line, i) => {
      line.textContent = '> ' + STAGES[Math.max(0, Math.min(STAGES.length - 1, index - 2 + i))][4];
    });
    nodes.forEach((node, i) => {
      node.classList.toggle('is-secure', index >= 7 || (index >= 5 && i < 3));
      node.classList.toggle('is-error', index === 4 || (index === 9 && i >= 3 && i <= 5));
    });
    root.classList.toggle('has-warning', index >= 3 && index <= 9);
    root.classList.toggle('is-denied', index === 9);
    root.classList.toggle('is-glitch', index === 4 || index === 9 || index === 10);
    root.classList.toggle('is-granted', index >= 10);
  }

  function updateTelemetry() {
    packets.textContent = String(1180 + Math.floor(elapsed / 3.4)).padStart(4, '0');
    latency.textContent = String(18 + Math.round(Math.sin(elapsed / 280) * 2)).padStart(2, '0') + 'ms';
    integrity.textContent = String(Math.min(100, Math.floor(elapsed / INTRO_DURATION * 100))).padStart(2, '0') + '%';
  }

  updateStage(0);
  updateTelemetry();
  unsubscribe = clock.subscribe((_time, dt) => {
    elapsed += dt;
    const index = stageAt(elapsed);
    if (index !== previous) {
      previous = index;
      updateStage(index);
    }
    if (index === 11) {
      const local = elapsed - STAGES[index][0];
      const target = STAGES[index][1];
      if (local < 260) {
        const revealed = Math.floor((local / 260) * target.length);
        const glyphs = '01X7_9';
        title.textContent = [...target].map((char, i) => i < revealed || char === ' ' || char === ',' ? char : glyphs[(i + Math.floor(elapsed / 70)) % glyphs.length]).join('');
      } else {
        title.textContent = target;
      }
    }
    telemetryTime += dt;
    if (telemetryTime >= 110) {
      telemetryTime = 0;
      updateTelemetry();
    }
    if (elapsed >= INTRO_CONFIG.exitAt && !exiting) {
      exiting = true;
      root.classList.add('is-exiting');
      resolveEntry();
    }
    if (elapsed >= INTRO_DURATION) finish();
    else paintRain(dt);
  });
  return { completed, entryStarted, cancel: finish };
}
