/* Small Canvas2D sphere: no 3D engine, textures, downloads, or network calls. */
export function initHeroScene({ clock, motionAllowed }) {
  const canvas = document.getElementById('hero-canvas');
  const fallback = document.getElementById('core-fallback');
  const stage = canvas.parentElement;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return null;
  const events = new AbortController();
  const small = matchMedia('(max-width: 600px)');
  const fine = matchMedia('(pointer: fine) and (hover: hover)');
  let enabled = motionAllowed, visible = false, unsubscribe, size = 1, angle = -.35, time = 0, frame = 0;
  let px = 0, py = 0, tx = 0, ty = 0, points = [], edges = [], slowFrames = 0, lowPower = false;
  const cpu = document.querySelector('[data-telemetry="cpu"]');
  const packets = document.querySelector('[data-telemetry="packets"]');
  let lastTelemetry = 0;
  function build() {
    const count = small.matches ? 44 : 82;
    points = Array.from({ length: count }, (_, i) => {
      const y = 1 - (i / (count - 1)) * 2, radius = Math.sqrt(1 - y * y), theta = Math.PI * (3 - Math.sqrt(5)) * i;
      return { x: Math.cos(theta) * radius, y, z: Math.sin(theta) * radius };
    });
    edges = [];
    points.forEach((a, i) => points.forEach((b, j) => {
      if (j <= i) return;
      const d = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
      if (d < (small.matches ? .67 : .48)) edges.push([i, j]);
    }));
  }
  function project(point, height = 1) {
    const a = angle + px, ca = Math.cos(a), sa = Math.sin(a), tilt = -.16 + py;
    const x = point.x * ca - point.z * sa, z = point.x * sa + point.z * ca;
    const y = point.y * Math.cos(tilt) - z * Math.sin(tilt), depth = point.y * Math.sin(tilt) + z * Math.cos(tilt);
    const scale = 1 + depth * .08;
    return { x: size / 2 + x * size * .36 * height * scale, y: size / 2 + y * size * .36 * height * scale, z: depth };
  }
  function draw() {
    ctx.clearRect(0, 0, size, size);
    const projected = points.map(p => project(p));
    edges.forEach(([i, j]) => {
      const a = projected[i], b = projected[j], alpha = .08 + ((a.z + b.z + 2) / 4) * .32;
      ctx.strokeStyle = `rgba(133,233,173,${alpha})`; ctx.lineWidth = .65;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    });
    // Great-circle routes rise gently above the sphere. Packet positions are synthetic.
    const routes = small.matches ? 3 : 5;
    for (let route = 0; route < routes; route++) {
      const a = points[(route * 13 + 3) % points.length], b = points[(route * 17 + 24) % points.length];
      const dot = Math.max(-.99, Math.min(.99, a.x * b.x + a.y * b.y + a.z * b.z));
      const omega = Math.acos(dot), denominator = Math.sin(omega);
      const position = t => {
        const p = Math.sin((1 - t) * omega) / denominator, q = Math.sin(t * omega) / denominator;
        return project({ x: a.x * p + b.x * q, y: a.y * p + b.y * q, z: a.z * p + b.z * q }, 1 + .09 * Math.sin(t * Math.PI));
      };
      ctx.beginPath();
      for (let segment = 0; segment <= 30; segment++) { const p = position(segment / 30); if (!segment) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); }
      ctx.strokeStyle = route % 2 ? 'rgba(255,42,42,.42)' : 'rgba(133,233,173,.4)'; ctx.lineWidth = .9; ctx.stroke();
      const packet = position((time / (4100 + route * 720) + route * .19) % 1);
      ctx.fillStyle = route % 2 ? '#ff6969' : '#caffd5'; ctx.beginPath(); ctx.arc(packet.x, packet.y, 2.1, 0, Math.PI * 2); ctx.fill();
    }
    projected.forEach((p, i) => {
      ctx.fillStyle = i % 13 === 0 ? `rgba(255,90,90,${.45 + (p.z + 1) * .25})` : `rgba(183,255,208,${.22 + (p.z + 1) * .39})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, i % 13 === 0 ? 2.6 : 1.25 + (p.z + 1) * .3, 0, Math.PI * 2); ctx.fill();
      if (!small.matches && i % 19 === 0 && p.z > .3) { ctx.font = '8px monospace'; ctx.fillStyle = '#94b59b'; ctx.fillText(`N.${String(i).padStart(2, '0')}`, p.x + 7, p.y - 7); }
    });
  }
  function resize() {
    size = Math.max(1, stage.clientWidth);
    const dpr = Math.min(window.devicePixelRatio || 1, small.matches ? 1 : 1.5);
    canvas.width = Math.round(size * dpr); canvas.height = Math.round(size * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build(); draw();
  }
  function step(_now, dt) {
    time += dt; angle += dt * .000055; frame += dt;
    px += (tx - px) * (1 - Math.exp(-dt / 400)); py += (ty - py) * (1 - Math.exp(-dt / 400));
    if (dt > 42) slowFrames++; else slowFrames = Math.max(0, slowFrames - .2);
    if (slowFrames > 35) lowPower = true;
    if (frame >= (small.matches || lowPower ? 1000 / 24 : 1000 / 40)) { frame = 0; draw(); }
    if (time - lastTelemetry > 2500) {
      lastTelemetry = time;
      cpu.textContent = Math.round(42 + Math.sin(time / 6000) * 8) + '%';
      packets.textContent = Math.round(128 + Math.sin(time / 4200) * 21) + '/s';
    }
  }
  function reconcile() {
    if (enabled && visible && !unsubscribe) unsubscribe = clock.subscribe(step);
    if ((!enabled || !visible) && unsubscribe) { unsubscribe(); unsubscribe = null; }
  }
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => { visible = entries.some(e => e.isIntersecting); reconcile(); }, { threshold: 0 }) : null;
  if (observer) observer.observe(stage); else visible = true;
  const resizeObserver = 'ResizeObserver' in window ? new ResizeObserver(resize) : null;
  if (resizeObserver) resizeObserver.observe(stage); else window.addEventListener('resize', resize, { passive: true, signal: events.signal });
  stage.addEventListener('pointermove', event => {
    if (!enabled || !fine.matches || small.matches || event.pointerType !== 'mouse') return;
    const rect = stage.getBoundingClientRect();
    tx = ((event.clientX - rect.left) / rect.width - .5) * .32;
    ty = ((event.clientY - rect.top) / rect.height - .5) * .2;
  }, { passive: true, signal: events.signal });
  stage.addEventListener('pointerleave', () => { tx = 0; ty = 0; }, { signal: events.signal });
  const changed = () => { resize(); };
  small.addEventListener('change', changed);
  resize(); canvas.hidden = false; fallback.hidden = true; fallback.style.display = 'none'; reconcile();
  return {
    setMotion(allowed) { enabled = allowed; if (!allowed) { tx = ty = px = py = 0; draw(); } reconcile(); },
    dispose() { unsubscribe?.(); events.abort(); observer?.disconnect(); resizeObserver?.disconnect(); small.removeEventListener('change', changed); canvas.hidden = true; fallback.hidden = false; fallback.style.removeProperty('display'); },
  };
}
