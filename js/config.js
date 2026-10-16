/* Content and effect settings. Keep credential statuses in index.html honest. */
export const CONTENT = Object.freeze({
  email: 'ztrace054@gmail.com',
  motionKey: 'saad-motion',
});
export const TIMING = Object.freeze({ emailTyping: 750, copyReset: 1800 });
export const storage = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* Private browsing still works. */ } },
};

export const PHOTOS = Object.freeze([
  { src: './assets/saad-dark.jpg', title: 'A different perspective', alt: 'Black and white portrait of Saad wearing sunglasses and a dark shirt', width: 810, height: 1080 },
  { src: './assets/saad-formal.jpg', title: 'Another side of Saad', alt: 'Black and white portrait of Saad in a suit and tie', width: 810, height: 1080 },
]);
