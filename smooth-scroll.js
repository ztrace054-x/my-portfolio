/* Lenis uses the document scroller and GSAP's clock, never a transformed body. */
export function installSmoothScroll({ gsap, ScrollTrigger, Lenis, enabled }) {
  if (!enabled || !gsap || !ScrollTrigger || !Lenis) return null;
  const instance = new Lenis({ lerp: .085, smoothWheel: true, syncTouch: false, wheelMultiplier: 1, autoRaf: false, anchors: false });
  const update = () => ScrollTrigger.update();
  const tick = seconds => instance.raf(seconds * 1000);
  instance.on('scroll', update);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  return {
    instance,
    dispose() {
      gsap.ticker.remove(tick);
      instance.off('scroll', update);
      instance.destroy();
      gsap.ticker.lagSmoothing(500, 33);
    },
  };
}
