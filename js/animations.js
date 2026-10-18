/* Progressive, native reveals. Nothing is hidden in the source document. */
export function initAnimations({ clock, motionAllowed, heroEntry }) {
  let enabled = motionAllowed, heroUnsubscribe, statusUnsubscribe, heroVisible = true;
  const running = new Set(), seen = new WeakSet();
  const events = new AbortController();
  const canAnimate = typeof document.documentElement.animate === 'function';
  function animate(node, frames, options) {
    if (!enabled || !canAnimate || !node) return;
    const effect = node.animate(frames, { duration: 750, easing: 'cubic-bezier(.16,1,.3,1)', ...options });
    running.add(effect);
    effect.onfinish = () => { running.delete(effect); effect.cancel(); };
    return effect;
  }
  function reveal(node) {
    if (seen.has(node)) return;
    seen.add(node);
    animate(node, [{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'translateY(0)' }]);
    if (enabled) node.querySelector('.identity-photo')?.classList.add('is-revealed');
  }
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) { reveal(entry.target); observer.unobserve(entry.target); } });
  }, { threshold: .12, rootMargin: '0px 0px -24px 0px' }) : null;
  document.querySelectorAll('[data-reveal],.phase-card').forEach(node => observer?.observe(node));
  document.querySelector('.phase-card')?.classList.add('is-active');
  const typed = document.querySelector('[data-hero-type]');
  const fullText = typed.textContent;
  if (enabled && heroEntry) {
    document.querySelector('.hero-name')?.classList.add('is-glitching');
    document.querySelector('.hero-hud .scroll-cue')?.classList.add('is-cue-active');
    document.querySelectorAll('.name-letter,.name-period').forEach((node, i) => animate(node, [{ transform: 'translateY(35%)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 900, delay: i * 60, fill: 'backwards' }));
    document.querySelectorAll('.hero-statement .line-mask>span').forEach((node, i) => animate(node, [{ transform: 'translateY(110%)' }, { transform: 'translateY(0)' }], { duration: 900, delay: 250 + i * 100, fill: 'backwards' }));
    animate(document.querySelector('.hero-visual'), [{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 1250, delay: 150, fill: 'backwards' });
    let elapsed = 0;
    typed.textContent = '';
    heroUnsubscribe = clock.subscribe((_time, dt) => {
      elapsed += dt;
      typed.textContent = fullText.slice(0, Math.floor(Math.max(0, elapsed - 450) / 26));
      if (elapsed > 450 + fullText.length * 26) { typed.textContent = fullText; heroUnsubscribe?.(); heroUnsubscribe = null; }
    });
  }
  const mode = document.querySelector('[data-rotating-status]');
  const labels = ['LEARNING IN PUBLIC', 'BUILDING FOUNDATIONS', 'EXPLORING SECURITY'];
  let statusTime = 0, lastStatus = 0;
  function reconcile() {
    if (enabled && heroVisible && !statusUnsubscribe) statusUnsubscribe = clock.subscribe((_time, dt) => {
      statusTime += dt;
      const next = Math.floor(statusTime / 5000) % labels.length;
      if (next !== lastStatus) { lastStatus = next; mode.textContent = labels[next]; }
    });
    if ((!enabled || !heroVisible) && statusUnsubscribe) { statusUnsubscribe(); statusUnsubscribe = null; }
  }
  const heroSection = document.getElementById('home');
  const heroObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    heroVisible = entries.some(entry => entry.isIntersecting);
    heroSection?.classList.toggle('is-in-view', heroVisible);
    reconcile();
    if (!heroVisible && heroUnsubscribe) { heroUnsubscribe(); heroUnsubscribe = null; typed.textContent = fullText; }
  }) : null;
  if (heroObserver) heroObserver.observe(heroSection);
  else heroSection?.classList.add('is-in-view');
  reconcile();
  document.addEventListener('visibilitychange', () => {
    running.forEach(effect => { if (document.hidden) effect.pause(); else effect.play(); });
  }, { signal: events.signal });
  function finish() {
    running.forEach(effect => effect.cancel()); running.clear();
    heroUnsubscribe?.(); heroUnsubscribe = null; typed.textContent = fullText;
    document.querySelector('.hero-name')?.classList.remove('is-glitching');
    document.querySelector('.hero-hud .scroll-cue')?.classList.remove('is-cue-active');
  }
  return {
    setMotion(allowed) { enabled = allowed; if (!allowed) { finish(); mode.textContent = labels[0]; document.querySelector('.identity-photo')?.classList.remove('is-revealed'); } reconcile(); },
    dispose() { finish(); statusUnsubscribe?.(); observer?.disconnect(); heroObserver?.disconnect(); events.abort(); },
  };
}
