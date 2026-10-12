/* Content and effect settings. Keep credential statuses in index.html honest. */
export const CONTENT = Object.freeze({
  email: 'ztrace054@gmail.com',
  visitedKey: 'saad-visited-v1',
  motionKey: 'saad-motion',
});
export const DEPENDENCIES = Object.freeze({
  gsap: 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js',
  scrollTrigger: 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js',
  lenis: 'https://unpkg.com/lenis@1.3.26/dist/lenis.min.js',
  lenisCss: 'https://unpkg.com/lenis@1.3.26/dist/lenis.css',
});
export const TIMING = Object.freeze({ dependencyDeadline: 2500, introDeadline: 3000, introExit: 550, skipExit: 320, emailTyping: 750, copyReset: 1800 });
export const storage = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* Private browsing still works. */ } },
};

export const PHOTOS = Object.freeze([
  { src: './assets/saad-dark.jpg', title: 'A different perspective', alt: 'Black and white portrait of Saad wearing sunglasses and a dark shirt', width: 810, height: 1080 },
  { src: './assets/saad-formal.jpg', title: 'Another side of Saad', alt: 'Black and white portrait of Saad in a suit and tie', width: 810, height: 1080 },
  { src: './assets/saad-golden.jpg', title: 'Learning in public', alt: 'Saad outdoors in golden light, wearing a denim jacket', width: 864, height: 1080 },
]);
