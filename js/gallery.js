import { PHOTOS } from './config.js';

export function initGallery({ overlays }) {
  const events = new AbortController();
  const dialog = document.getElementById('photo-viewer');
  const image = document.getElementById('viewer-image');
  const caption = document.getElementById('viewer-caption');
  const number = document.getElementById('viewer-index');
  const close = document.getElementById('viewer-close');
  let index = 0;
  let opener;
  function display(next) {
    index = (next + PHOTOS.length) % PHOTOS.length;
    const photo = PHOTOS[index];
    image.src = photo.src;
    image.alt = photo.alt;
    image.width = photo.width;
    image.height = photo.height;
    caption.textContent = photo.title;
    number.textContent = String(index + 1).padStart(2, '0') + ' / 03';
  }
  const dismiss = () => { if (dialog.open) dialog.close(); };
  document.querySelectorAll('[data-gallery-item]').forEach(button => button.addEventListener('click', () => {
    if (typeof dialog.showModal !== 'function') { window.open(PHOTOS[Number(button.dataset.galleryItem)].src, '_blank', 'noopener'); return; }
    opener = button;
    display(Number(button.dataset.galleryItem));
    overlays.lock(dialog);
    try { dialog.showModal(); close.focus(); } catch { overlays.unlock(dialog); }
  }, { signal: events.signal }));
  close.addEventListener('click', dismiss, { signal: events.signal });
  document.getElementById('viewer-prev').addEventListener('click', () => display(index - 1), { signal: events.signal });
  document.getElementById('viewer-next').addEventListener('click', () => display(index + 1), { signal: events.signal });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); display(index - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); display(index + 1); }
  }, { signal: events.signal });
  dialog.addEventListener('close', () => { overlays.unlock(dialog); opener?.focus({ preventScroll: true }); }, { signal: events.signal });
  dialog.addEventListener('click', event => { if (event.target === dialog) { const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dismiss(); } }, { signal: events.signal });
  return { dispose() { dismiss(); overlays.unlock(dialog); events.abort(); } };
}
