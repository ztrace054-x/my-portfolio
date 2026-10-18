/* Progressive, native reveals. Nothing is hidden in the source document. */
export function initAnimations({ clock, motionAllowed, heroEntry }) {
  let enabled = motionAllowed, heroUnsubscribe, heroVisible = true;
  const running = new Set(), seen = new WeakSet();
  const events = new AbortController();
  const canAnimate = typeof document.documentElement.animate === 'function';
  const motionStyle = getComputedStyle(document.documentElement);
  const tokenMs = (name, fallback) => Number.parseFloat(motionStyle.getPropertyValue(name)) || fallback;
  const revealDuration = tokenMs('--motion-reveal-duration', 560);
  const pageDuration = tokenMs('--motion-page-duration', 650);
  const revealDistance = tokenMs('--motion-reveal-distance', 16);
  const stagger = tokenMs('--motion-stagger', 80);
  const easing = motionStyle.getPropertyValue('--ease-out').trim() || 'cubic-bezier(.16,1,.3,1)';
  function animate(node, frames, options) {
    if (!enabled || !canAnimate || !node) return;
    const effect = node.animate(frames, { duration: revealDuration, easing, ...options });
    running.add(effect);
    effect.onfinish = () => { running.delete(effect); effect.cancel(); };
    return effect;
  }
  function reveal(node) {
    if (seen.has(node)) return;
    seen.add(node);
    animate(node, [{ opacity: 0, transform: `translateY(${revealDistance}px)` }, { opacity: 1, transform: 'translateY(0)' }]);
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
    animate(document.querySelector('.hero-name'), [{ opacity: 0, transform: `translateY(${revealDistance}px)` }, { opacity: 1, transform: 'translateY(0)' }], { duration: pageDuration, fill: 'backwards' });
    document.querySelectorAll('.hero-statement .line-mask>span').forEach((node, i) => animate(node, [{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], { duration: revealDuration, delay: stagger + i * stagger, fill: 'backwards' }));
    animate(document.querySelector('.hero-visual'), [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: pageDuration, delay: stagger * 2, fill: 'backwards' });
    let elapsed = 0;
    typed.textContent = '';
    heroUnsubscribe = clock.subscribe((_time, dt) => {
      elapsed += dt;
      typed.textContent = fullText.slice(0, Math.floor(Math.max(0, elapsed - 450) / 26));
      if (elapsed > 450 + fullText.length * 26) { typed.textContent = fullText; heroUnsubscribe?.(); heroUnsubscribe = null; }
    });
  }
  const heroSection = document.getElementById('home');
  const heroObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    heroVisible = entries.some(entry => entry.isIntersecting);
    heroSection?.classList.toggle('is-in-view', heroVisible);
    if (!heroVisible && heroUnsubscribe) { heroUnsubscribe(); heroUnsubscribe = null; typed.textContent = fullText; }
  }) : null;
  if (heroObserver) heroObserver.observe(heroSection);
  else heroSection?.classList.add('is-in-view');
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
    setMotion(allowed) { enabled = allowed; if (!allowed) { finish(); document.querySelector('.identity-photo')?.classList.remove('is-revealed'); } },
    dispose() { finish(); observer?.disconnect(); heroObserver?.disconnect(); events.abort(); },
  };
}
