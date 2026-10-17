/* Decorative ambient topology only; never makes network requests. */
export function initAmbientField({ clock, motionAllowed }) {
  const canvas = document.getElementById('ambient-canvas');
  if (!canvas) return null;

  let context;
  try { context = canvas.getContext('2d', { alpha: true }); } catch { return null; }
  if (!context) return null;

  const events = new AbortController();
  const small = matchMedia('(max-width: 600px)');
  const fine = matchMedia('(pointer: fine) and (hover: hover)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let enabled = Boolean(motionAllowed), width = 1, height = 1, dpr = 1;
  let points = [], time = 0, frameTime = 0, unsubscribe;
  let mouse = { x: -1000, y: -1000 };

  function buildPoints() {
    const count = small.matches ? 18 : 42;
    points = Array.from({ length: count }, (_, index) => ({
      x: ((index * 0.61803398875 + 0.13) % 1) * width,
      y: ((index * 0.75487766625 + 0.37) % 1) * height,
      phase: index * 1.61803398875,
      accent: index % 11 === 0,
    }));
  }

  function resize() {
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    dpr = Math.min(window.devicePixelRatio || 1, small.matches ? 1 : 1.25);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildPoints();
    draw(false);
  }

  function draw(animated) {
    context.clearRect(0, 0, width, height);
    const positions = points.map(point => {
      let x = point.x + (animated ? Math.sin(time * 0.00021 + point.phase) * 7 : 0);
      let y = point.y + (animated ? Math.cos(time * 0.00017 + point.phase) * 7 : 0);
      if (fine.matches && mouse.x >= 0) {
        const dx = mouse.x - x, dy = mouse.y - y;
        const distance = Math.hypot(dx, dy);
        if (distance > 0 && distance < 180) {
          const pull = (1 - distance / 180) * 0.075;
          x += dx * pull;
          y += dy * pull;
        }
      }
      return { x, y, accent: point.accent, phase: point.phase };
    });

    const maxDistance = small.matches ? 112 : 176;
    for (let i = 0; i < positions.length; i++) {
      const a = positions[i];
      for (let j = i + 1; j < positions.length; j++) {
        const b = positions[j];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (distance >= maxDistance) continue;
        const alpha = (1 - distance / maxDistance) * 0.19;
        context.beginPath();
        context.moveTo(a.x, a.y);
        context.lineTo(b.x, b.y);
        context.strokeStyle = a.accent ? `rgba(255,42,42,${alpha * 0.72})` : `rgba(125,255,154,${alpha})`;
        context.lineWidth = 0.65;
        context.stroke();

        if (animated && i % 6 === 0 && j === i + 1) {
          const progress = (time * 0.000045 + i * 0.23) % 1;
          context.beginPath();
          context.arc(a.x + (b.x - a.x) * progress, a.y + (b.y - a.y) * progress, 1.1, 0, Math.PI * 2);
          context.fillStyle = a.accent ? 'rgba(255,95,95,.55)' : 'rgba(125,255,154,.55)';
          context.fill();
        }
      }
    }

    positions.forEach(point => {
      context.beginPath();
      context.arc(point.x, point.y, point.accent ? 1.8 : 1.15, 0, Math.PI * 2);
      context.fillStyle = point.accent ? 'rgba(255,90,90,.42)' : 'rgba(125,255,154,.3)';
      context.fill();
    });

    if (fine.matches && mouse.x >= 0) {
      const glow = context.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 150);
      glow.addColorStop(0, 'rgba(125,255,154,.035)');
      glow.addColorStop(1, 'rgba(125,255,154,0)');
      context.fillStyle = glow;
      context.fillRect(mouse.x - 150, mouse.y - 150, 300, 300);
    }
  }

  function tick(_now, dt) {
    time += Math.min(dt, 48);
    frameTime += dt;
    const interval = small.matches ? 1000 / 18 : 1000 / 28;
    if (frameTime < interval) return;
    frameTime = 0;
    draw(true);
  }

  function reconcile() {
    const shouldAnimate = enabled && !reduced.matches && !document.hidden;
    if (shouldAnimate && !unsubscribe) unsubscribe = clock.subscribe(tick);
    if (!shouldAnimate && unsubscribe) {
      unsubscribe();
      unsubscribe = null;
      draw(false);
    }
  }

  document.addEventListener('pointermove', event => {
    if (!fine.matches || event.pointerType === 'touch') return;
    mouse = { x: event.clientX, y: event.clientY };
  }, { passive: true, signal: events.signal });
  document.addEventListener('pointerleave', () => { mouse = { x: -1000, y: -1000 }; }, { signal: events.signal });
  document.addEventListener('visibilitychange', reconcile, { signal: events.signal });
  window.addEventListener('resize', resize, { passive: true, signal: events.signal });
  small.addEventListener('change', resize);

  resize();
  reconcile();

  return {
    setMotion(allowed) {
      enabled = Boolean(allowed);
      reconcile();
    },
    dispose() {
      unsubscribe?.();
      unsubscribe = null;
      events.abort();
      small.removeEventListener('change', resize);
      context.clearRect(0, 0, width, height);
    },
  };
}
