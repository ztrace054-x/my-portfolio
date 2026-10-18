/* Time-based following. The outer button hit area never moves. */
export function initCursor({ clock }) {
  const events = new AbortController();
  const layer = document.getElementById('custom-cursor');
  const ring = layer.querySelector('.cursor-ring');
  const dot = layer.querySelector('.cursor-dot');
  let x = -100, y = -100, followX = x, followY = y;
  let diameter = 24, currentDiameter = 24;
  let unsubscribe;
  const magnetic = new Map();
  const boxes = new Map();
  const followMs = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--motion-cursor-follow')) || 95;
  function step(_time, dt) {
    const blend = 1 - Math.exp(-Math.min(dt, 64) / followMs);
    followX += (x - followX) * blend; followY += (y - followY) * blend;
    currentDiameter += (diameter - currentDiameter) * blend;
    ring.style.transform = `translate3d(${followX}px,${followY}px,0) scale(${currentDiameter / 24})`;
    dot.style.transform = `translate3d(${x}px,${y}px,0)`;
    for (const [node, values] of magnetic) {
      values.x += (values.tx - values.x) * blend;
      values.y += (values.ty - values.y) * blend;
      node.style.transform = `translate3d(${values.x}px,${values.y}px,0)`;
    }
  }
  const show = () => { layer.hidden = false; document.documentElement.classList.add('has-cursor'); if (!unsubscribe) unsubscribe = clock.subscribe(step); };
  function hide() { layer.hidden = true; document.documentElement.classList.remove('has-cursor'); unsubscribe?.(); unsubscribe = null; for (const node of magnetic.keys()) node.style.removeProperty('transform'); magnetic.clear(); boxes.clear(); }
  document.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse') { hide(); return; }
    if (layer.hidden) { followX = event.clientX; followY = event.clientY; }
    x = event.clientX; y = event.clientY;
    show();
    const target = event.target.closest?.('[data-cursor],button,a');
    const view = target?.dataset.cursor === 'view';
    layer.classList.toggle('is-terminal', Boolean(event.target.closest?.('[data-cursor="terminal"]')));
    diameter = view ? 76 : target?.matches('.button,button') ? 60 : target?.matches('a') ? 36 : 24;
    layer.classList.toggle('is-view', Boolean(view));
  }, { passive: true, signal: events.signal });
  document.documentElement.addEventListener('pointerleave', hide, { signal: events.signal });
  window.addEventListener('blur', hide, { signal: events.signal });
  document.addEventListener('visibilitychange', () => { if (document.hidden) hide(); }, { signal: events.signal });
  const invalidate = () => boxes.clear();
  window.addEventListener('resize', invalidate, { passive: true, signal: events.signal });
  window.addEventListener('scroll', invalidate, { passive: true, signal: events.signal });
  function install(target, inner) {
    const reset = () => { const value = magnetic.get(inner); if (value) { value.tx = 0; value.ty = 0; } boxes.delete(target); };
    target.addEventListener('pointerenter', event => { if (event.pointerType !== 'mouse') return; boxes.set(target, target.getBoundingClientRect()); magnetic.set(inner, { x: 0, y: 0, tx: 0, ty: 0 }); }, { signal: events.signal });
    target.addEventListener('pointermove', event => {
      const value = magnetic.get(inner); if (!value || event.pointerType !== 'mouse') return;
      let box = boxes.get(target); if (!box) { box = target.getBoundingClientRect(); boxes.set(target, box); }
      const dx = (event.clientX - box.left) / box.width - .5;
      const dy = (event.clientY - box.top) / box.height - .5;
      value.tx = Math.max(-1, Math.min(1, dx * 2)) * 3.5;
      value.ty = Math.max(-1, Math.min(1, dy * 2)) * 3.5;
    }, { passive: true, signal: events.signal });
    target.addEventListener('pointerleave', reset, { signal: events.signal });
    target.addEventListener('blur', reset, { signal: events.signal });
  }
  document.querySelectorAll('[data-magnetic]').forEach(target => {
    const inner = target.firstElementChild;
    if (inner) install(target, inner);
  });
  return { dispose() { events.abort(); hide(); } };
}
