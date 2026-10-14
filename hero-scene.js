/* An illustrative connected core, not a live security monitor. Canvas 2D only. */
export function initHeroScene({ clock, motionAllowed }) {
  const canvas = document.getElementById('hero-canvas');
  const fallback = document.getElementById('core-fallback');
  const hero = document.getElementById('home');
  const visual = document.querySelector('.hero-visual');
  const events = new AbortController();
  const eligible = matchMedia('(min-width: 768px) and (pointer: fine)');
  const ctx = canvas.getContext('2d', { alpha: true });
  let allowed = motionAllowed;
  let visible = true;
  let unsubscribe;
  let size = 0;
  let angle = .35;
  let dpr = 1;
  // Three offset rings of eight vertices; 24 ring edges and 16 cross edges.
  const vertices = Array.from({ length: 24 }, (_, index) => {
    const ring = Math.floor(index / 8);
    const latitude = (ring - 1) * .78;
    const azimuth = (index % 8) * Math.PI / 4 + ring * .19;
    return { x: Math.cos(latitude) * Math.cos(azimuth), y: Math.sin(latitude), z: Math.cos(latitude) * Math.sin(azimuth) };
  });
  const edges = vertices.map((_, i) => [i, Math.floor(i / 8) * 8 + (i + 1) % 8]);
  for (let i = 0; i < 16; i++) edges.push([i, i + 8]);
  const particles = Array.from({ length: 24 }, (_, i) => ({ a: i * 2.399, radius: .36 + (i % 5) * .035, speed: .018 + (i % 3) * .005 }));
  function measure() {
    size = Math.min(520, visual.clientWidth);
    dpr = Math.min(1.5, window.devicePixelRatio || 1);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
  }
  function draw(_time, dt) {
    if (!size || !ctx) return;
    angle += Math.min(dt, 50) * .000085;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    const center = size / 2;
    const radius = size * .32;
    const cosine = Math.cos(angle), sine = Math.sin(angle);
    const projected = vertices.map(point => {
      const x = point.x * cosine - point.z * sine;
      const z = point.x * sine + point.z * cosine;
      const y = point.y * .94 - z * .34;
      const depth = z * .94 + point.y * .34;
      const scale = 3.4 / (3.4 - depth * .5);
      return { x: center + x * radius * scale, y: center + y * radius * scale, z: depth };
    });
    const glow = ctx.createRadialGradient(center, center, 0, center, center, radius * 1.7);
    glow.addColorStop(0, 'rgba(133,233,173,.08)'); glow.addColorStop(1, 'rgba(133,233,173,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, size, size);
    ctx.lineWidth = .85;
    for (const [a, b] of edges) {
      const first = projected[a], second = projected[b];
      const alpha = .15 + ((first.z + second.z) / 2 + 1) * .14;
      ctx.strokeStyle = `rgba(133,233,173,${alpha})`;
      ctx.beginPath(); ctx.moveTo(first.x, first.y); ctx.lineTo(second.x, second.y); ctx.stroke();
    }
    for (const point of projected) {
      ctx.fillStyle = `rgba(183,255,208,${.35 + (point.z + 1) * .25})`;
      ctx.beginPath(); ctx.arc(point.x, point.y, 1.4 + (point.z + 1) * .45, 0, Math.PI * 2); ctx.fill();
    }
    const count = window.innerWidth < 1024 ? 12 : 24;
    for (const point of particles.slice(0, count)) {
      const a = point.a + angle * point.speed;
      const x = center + Math.cos(a) * size * point.radius;
      const y = center + Math.sin(a) * size * point.radius * .86;
      ctx.fillStyle = 'rgba(133,233,173,.42)'; ctx.fillRect(x, y, 1.3, 1.3);
    }
  }
  function reconcile() {
    const enabled = Boolean(ctx && allowed && eligible.matches && visible && !document.hidden);
    unsubscribe?.(); unsubscribe = null;
    canvas.hidden = !enabled;
    fallback.hidden = enabled;
    if (enabled) { measure(); draw(0, 0); unsubscribe = clock.subscribe(draw); }
  }
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    hero.classList.toggle('is-offscreen', !visible);
    reconcile();
  }) : null;
  observer?.observe(hero);
  const resize = 'ResizeObserver' in window ? new ResizeObserver(measure) : null;
  resize?.observe(visual);
  eligible.addEventListener('change', reconcile);
  document.addEventListener('visibilitychange', reconcile, { signal: events.signal });
  reconcile();
  return {
    setMotion(value) { allowed = value; reconcile(); },
    dispose() { unsubscribe?.(); observer?.disconnect(); resize?.disconnect(); eligible.removeEventListener('change', reconcile); events.abort(); canvas.hidden = true; fallback.hidden = false; },
  };
}
