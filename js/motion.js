/* One animation clock. Hidden tabs never retain a scheduled animation frame. */
export function createClock() {
  const callbacks = new Set();
  let raf = 0, last = 0;
  function reconcile() {
    const active = callbacks.size > 0 && !document.hidden;
    if (active && !raf) raf = requestAnimationFrame(tick);
    if (!active) { if (raf) cancelAnimationFrame(raf); raf = 0; last = 0; }
  }
  function tick(time) {
    raf = 0;
    const dt = last ? Math.min(64, time - last) : 16;
    last = time;
    for (const callback of [...callbacks]) {
      try { callback(time, dt); } catch (error) { callbacks.delete(callback); console.error('Optional visual stopped:', error); }
    }
    reconcile();
  }
  const visibility = () => {
    document.documentElement.classList.toggle('page-paused', document.hidden);
    reconcile();
  };
  document.addEventListener('visibilitychange', visibility);
  visibility();
  return {
    subscribe(callback) { callbacks.add(callback); reconcile(); return () => { callbacks.delete(callback); reconcile(); }; },
    dispose() { callbacks.clear(); reconcile(); document.removeEventListener('visibilitychange', visibility); },
  };
}
