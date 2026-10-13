/* Preserve a semantic section through pin creation/removal. Avoid hit testing:
   overlapping transformed photos can be hit even after they leave the viewport. */
export function createViewportPreserver({ getScroll, invalidateScroll = () => {} }) {
  let pendingFrame = 0;
  let originalOverflowAnchor = '';
  return function preserve(change) {
    const root = document.documentElement;
    const height = root.clientHeight || window.innerHeight;
    const center = height * .55;
    const candidates = [document.querySelector('.journey-stage'), ...document.querySelectorAll('main > section')].filter(Boolean);
    const anchor = candidates.find(node => {
      const box = node.getBoundingClientRect();
      return box.top <= center && box.bottom >= center;
    }) || candidates.find(node => {
      const box = node.getBoundingClientRect();
      return box.bottom > 80 && box.top < height;
    });
    const before = anchor?.getBoundingClientRect().top;
    if (pendingFrame) cancelAnimationFrame(pendingFrame);
    else originalOverflowAnchor = root.style.overflowAnchor;
    root.style.overflowAnchor = 'none';
    try { change(); } finally {
      const restore = () => {
        if (!anchor || before === undefined) return;
        const top = Math.max(0, window.scrollY + anchor.getBoundingClientRect().top - before);
        const smooth = getScroll();
        if (smooth) smooth.scrollTo(top, { immediate: true, force: true });
        else window.scrollTo({ top, behavior: 'instant' });
        // Prevent an automatic refresh from restoring a cached pre-change position.
        invalidateScroll();
        root.dataset.motionDrift = String(Math.round(anchor.getBoundingClientRect().top - before));
      };
      restore();
      pendingFrame = requestAnimationFrame(() => {
        restore();
        root.style.overflowAnchor = originalOverflowAnchor;
        pendingFrame = 0;
      });
    }
  };
}
