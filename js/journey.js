/* Scroll-linked progress for the learning roadmap. This is navigation feedback, not a skill score. */
export function initJourney({ motionAllowed = true } = {}) {
  const timeline = document.querySelector('[data-journey-timeline]');
  if (!timeline) return { setMotion() {}, refresh() {}, dispose() {} };

  const cards = [...timeline.querySelectorAll('.phase-card')];
  const events = new AbortController();
  let frame = 0;

  function update() {
    frame = 0;
    if (document.hidden) return;

    const rect = timeline.getBoundingClientRect();
    const viewport = Math.max(1, window.innerHeight || 1);
    const documentTop = rect.top + window.scrollY;
    const documentBottom = rect.bottom + window.scrollY;
    const start = documentTop - viewport * 0.72;
    const end = Math.max(start + 1, documentBottom - viewport * 0.32);
    const progress = Math.max(0, Math.min(1, (window.scrollY - start) / (end - start)));
    const percentage = Math.round(progress * 10000) / 100;

    timeline.style.setProperty('--journey-progress', percentage + '%');
    timeline.dataset.progress = String(Math.round(percentage));

    const activeLine = viewport * 0.46;
    let active = cards[0];
    for (const card of cards) {
      if (card.getBoundingClientRect().top <= activeLine) active = card;
      else break;
    }
    cards.forEach(card => card.classList.toggle('is-active', card === active));
  }

  function schedule() {
    if (frame || document.hidden) return;
    frame = requestAnimationFrame(update);
  }

  timeline.classList.toggle('motion-off', !motionAllowed);
  update();
  window.addEventListener('scroll', schedule, { passive: true, signal: events.signal });
  window.addEventListener('resize', schedule, { passive: true, signal: events.signal });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    } else schedule();
  }, { signal: events.signal });

  return {
    setMotion(allowed) {
      motionAllowed = Boolean(allowed);
      timeline.classList.toggle('motion-off', !motionAllowed);
      schedule();
    },
    refresh: schedule,
    dispose() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      events.abort();
    },
  };
}
