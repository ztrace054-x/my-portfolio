import { escapeHTML } from "../utils.js?v=20261016.1";

export function renderPhase6Header(copy) {
  return `
    <header class="view-heading-block phase6-heading">
      <p class="view-eyebrow">${escapeHTML(copy.eyebrow)}</p>
      <div class="view-title-row">
        <h1 id="view-heading" tabindex="-1">${escapeHTML(copy.title)}</h1>
        <span class="badge badge--cyan">${escapeHTML(copy.badge)}</span>
      </div>
      <p class="view-intro">${escapeHTML(copy.intro)}</p>
    </header>`;
}

export function mountPhase6View(root, { motion = null } = {}) {
  const view = root?.querySelector?.(".phase6-view");
  if (!view) return () => {};

  let frame = 0;
  let disposed = false;
  const shouldAnimate = Boolean(motion?.motionAllowed && !motion?.reducedMotion && !motion?.paused);

  if (shouldAnimate && typeof requestAnimationFrame === "function") {
    view.classList.add("phase6-motion-pending");
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (disposed) return;
      view.classList.remove("phase6-motion-pending");
      view.classList.add("is-mounted");
    });
  } else {
    view.classList.add("is-mounted");
  }

  return () => {
    disposed = true;
    if (frame && typeof cancelAnimationFrame === "function") cancelAnimationFrame(frame);
    view.classList.remove("phase6-motion-pending", "is-mounted");
  };
}
