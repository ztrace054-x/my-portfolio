/* One GSAP owner. Reverting the context removes every owned transform and pin. */
export function initAnimations({ gsap, ScrollTrigger, heroEntry, seen }) {
  gsap.registerPlugin(ScrollTrigger);
  let media;
  let resizeTimer;
  let refreshTimer;
  const events = new AbortController();
  const context = gsap.context(() => {
    if (heroEntry && !seen.has('hero')) {
      seen.add('hero');
      const timeline = gsap.timeline({ defaults: { ease: 'power4.out' } });
      timeline.from('.name-letter', { yPercent: 110, rotation: 2, duration: 1.05, stagger: .035 }, 0)
        .from('.hero-visual', { scale: .93, opacity: .4, duration: .95 }, .08)
        .from('.hero-statement .line-mask>span', { yPercent: 110, duration: .9, stagger: .11 }, .16)
        .from('.hero-description', { y: 22, opacity: .25, duration: .65 }, .38)
        .from('.hero-actions>a', { y: 16, opacity: .4, duration: .5, stagger: .08 }, .52)
        .from('.course-credit,.scroll-cue', { y: 10, opacity: .4, duration: .4 }, .65);
    }
    document.querySelectorAll('[data-reveal]').forEach((target, index) => {
      const key = 'reveal-' + index;
      if (seen.has(key)) return;
      if (target.getBoundingClientRect().top < window.innerHeight * .82) { seen.add(key); return; }
      const trigger = { trigger: target, start: 'top 82%', once: true, onEnter: () => seen.add(key) };
      const kind = target.dataset.reveal;
      if (kind === 'heading') {
        gsap.from(target.querySelectorAll('.line-mask>span'), { yPercent: 110, duration: .9, stagger: .09, ease: 'power4.out', scrollTrigger: trigger });
      } else if (kind === 'photo') {
        gsap.from(target, { y: 28, scale: 1.045, opacity: .55, duration: 1, ease: 'power3.out', scrollTrigger: trigger });
      } else {
        gsap.from(target, { y: 22, opacity: .3, duration: .7, ease: 'power3.out', scrollTrigger: trigger });
      }
    });
    media = gsap.matchMedia();
    media.add('(min-width: 1024px) and (pointer: fine) and (hover: hover)', () => {
      // Dedicated inner layers prevent parallax from competing with reveal or tilt.
      document.querySelectorAll('[data-parallax]').forEach(layer => {
        const type = layer.dataset.parallax;
        const travel = type === 'core' ? 40 : type === 'portrait' ? 36 : 28;
        gsap.fromTo(layer, { y: -travel / 2 }, { y: travel / 2, ease: 'none', scrollTrigger: { trigger: layer.closest('section,article') || layer, start: 'top bottom', end: 'bottom top', scrub: .6 } });
      });
      gsap.to('.core-labels', { y: -16, ease: 'none', scrollTrigger: { trigger: '#home', start: 'top top', end: 'bottom top', scrub: .6 } });
      const stage = document.querySelector('.journey-stage');
      const cards = [...stage.querySelectorAll('[data-phase]')];
      const track = stage.querySelector('.journey-track span');
      let pin;
      let active = -1;
      const emphasize = progress => {
        const next = progress < .32 ? 0 : progress < .66 ? 1 : 2;
        if (next === active) return;
        active = next;
        cards.forEach((card, i) => {
          card.classList.toggle('is-active', i === next);
          gsap.to(card, { y: i === next ? -18 : 0, duration: .45, ease: 'power3.out', overwrite: true });
        });
      };
      const buildPin = () => {
        const fits = stage.offsetHeight <= window.innerHeight - document.getElementById('site-header').offsetHeight - 64;
        if (!fits && pin) {
          pin.kill(); pin = null; active = -1;
          gsap.set(cards, { clearProps: 'transform' });
          gsap.set(track, { scaleX: 0 });
          cards.forEach(card => card.classList.remove('is-active'));
        }
        // Enabling motion should enhance the story ahead, without reinserting
        // pin spacing above a section the visitor has already passed.
        const ahead = stage.getBoundingClientRect().bottom > document.getElementById('site-header').offsetHeight + 24;
        if (fits && ahead && !pin) {
          const line = gsap.to(track, { scaleX: 1, ease: 'none', paused: true });
          pin = ScrollTrigger.create({
            trigger: stage, pin: stage, pinSpacing: true,
            start: () => 'top ' + (document.getElementById('site-header').offsetHeight + 24),
            end: () => '+=' + window.innerHeight * 1.6,
            animation: line, scrub: .6, invalidateOnRefresh: true,
            onUpdate: self => emphasize(self.progress),
            onEnter: self => emphasize(self.progress),
            onEnterBack: self => emphasize(self.progress),
          });
        }
      };
      buildPin();
      const onResize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { buildPin(); ScrollTrigger.refresh(); }, 200); };
      window.addEventListener('resize', onResize, { passive: true, signal: events.signal });
      return () => { pin?.kill(); cards.forEach(card => card.classList.remove('is-active')); window.removeEventListener('resize', onResize); clearTimeout(resizeTimer); };
    });
  }, document.getElementById('page'));
  const refresh = () => {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 100);
  };
  document.querySelectorAll('img[loading="lazy"]').forEach(image => image.addEventListener('load', refresh, { once: true, signal: events.signal }));
  refresh();
  return {
    refresh,
    dispose() { events.abort(); clearTimeout(refreshTimer); clearTimeout(resizeTimer); media?.revert(); context.revert(); },
  };
}
