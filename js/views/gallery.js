import { galleryPhotos } from "../data/gallery.js?v=20261020.3";
import { escapeHTML } from "../utils.js?v=20261016.1";
import { mountPhase6View, renderPhase6Header } from "./phase6-view.js?v=20261020.3";

const headerCopy = Object.freeze({
  eyebrow: "ZTRACE WORKSPACE / VISUAL ARCHIVE",
  title: "Gallery",
  badge: "LOCAL PORTRAITS",
  intro: "A small collection of the existing portraits used across this portfolio. Open any image for a larger view; all images are served from this repository."
});

export function render() {
  const cards = galleryPhotos.map((photo, index) => `
    <figure class="phase6-gallery-card phase6-reveal" role="listitem" style="--phase6-delay:${index * 70}ms">
      <button class="phase6-gallery-open" type="button" data-gallery-open="${index}" aria-haspopup="dialog" aria-label="Open photo: ${escapeHTML(photo.title)}">
        <img src="${escapeHTML(photo.src)}" alt="${escapeHTML(photo.alt)}" width="${photo.width}" height="${photo.height}" loading="lazy" decoding="async">
        <span class="phase6-gallery-open-label"><span>OPEN PHOTO</span><span aria-hidden="true">+</span></span>
      </button>
      <figcaption class="phase6-gallery-caption">
        <div>
          <p class="phase6-micro">PORTRAIT / ${String(index + 1).padStart(2, "0")}</p>
          <h2>${escapeHTML(photo.title)}</h2>
          <p>${escapeHTML(photo.caption)}</p>
        </div>
        <span class="phase6-gallery-arrow" aria-hidden="true">+</span>
      </figcaption>
    </figure>`).join("");

  const firstPhoto = galleryPhotos[0];
  const photoCount = String(galleryPhotos.length).padStart(2, "0");

  return `
    <section class="view-page phase6-view phase6-gallery-view" aria-labelledby="view-heading">
      ${renderPhase6Header(headerCopy)}
      <section class="phase6-section-intro phase6-reveal" aria-labelledby="phase6-gallery-heading" style="--phase6-delay:40ms">
        <div>
          <p class="view-eyebrow">LOCAL ASSETS / 001</p>
          <h2 id="phase6-gallery-heading">Portrait archive</h2>
          <p>Three existing photos, with a keyboard-friendly viewer and no third-party image requests.</p>
        </div>
        <span class="phase6-micro">IMAGE SET / ${photoCount}</span>
      </section>
      <div class="phase6-gallery-grid" role="list" aria-label="Portrait gallery">
        ${cards}
      </div>
      <p class="phase6-gallery-note phase6-reveal" style="--phase6-delay:220ms">
        <span class="status-dot" aria-hidden="true"></span>
        LOCAL FILES / DISPLAY ONLY / NO LIVE NETWORK ACTIVITY
      </p>
      <dialog class="phase6-lightbox" data-gallery-dialog aria-labelledby="phase6-lightbox-title" aria-describedby="phase6-lightbox-help">
        <div class="phase6-lightbox-shell">
          <header class="phase6-lightbox-header">
            <div>
              <p class="view-eyebrow">LOCAL IMAGE / VIEWER</p>
              <h2 id="phase6-lightbox-title">Portrait preview</h2>
            </div>
            <button class="hud-btn phase6-lightbox-close" type="button" data-gallery-close aria-label="Close photo viewer">CLOSE <span aria-hidden="true">&times;</span></button>
          </header>
          <figure class="phase6-lightbox-figure">
            <img class="phase6-lightbox-image" data-gallery-image src="${escapeHTML(firstPhoto.src)}" alt="${escapeHTML(firstPhoto.alt)}" width="${firstPhoto.width}" height="${firstPhoto.height}" decoding="async">
            <figcaption class="phase6-lightbox-caption">
              <span data-gallery-caption>${escapeHTML(firstPhoto.caption)}</span>
              <span data-gallery-count aria-live="polite">01 / ${photoCount}</span>
            </figcaption>
          </figure>
          <p class="phase6-visually-hidden" id="phase6-lightbox-help">Use the Previous and Next controls or the left and right arrow keys to browse photos. Press Escape to close.</p>
          <div class="phase6-lightbox-controls">
            <button class="hud-btn" type="button" data-gallery-previous><span aria-hidden="true">&larr;</span> PREVIOUS</button>
            <button class="hud-btn hud-btn--primary" type="button" data-gallery-next>NEXT <span aria-hidden="true">&rarr;</span></button>
          </div>
        </div>
      </dialog>
    </section>`;
}

export function mount(root, options = {}) {
  const disposeMotion = mountPhase6View(root, options);
  const dialog = root?.querySelector?.("[data-gallery-dialog]");
  if (!dialog) return disposeMotion;

  const image = dialog.querySelector("[data-gallery-image]");
  const title = dialog.querySelector("#phase6-lightbox-title");
  const caption = dialog.querySelector("[data-gallery-caption]");
  const count = dialog.querySelector("[data-gallery-count]");
  const closeButton = dialog.querySelector("[data-gallery-close]");
  if (!image || !title || !caption || !count || !closeButton) return disposeMotion;

  let currentIndex = 0;
  let opener = null;

  function showPhoto(index) {
    const length = galleryPhotos.length;
    currentIndex = ((index % length) + length) % length;
    const photo = galleryPhotos[currentIndex];
    image.setAttribute("src", photo.src);
    image.setAttribute("alt", photo.alt);
    image.setAttribute("width", String(photo.width));
    image.setAttribute("height", String(photo.height));
    title.textContent = photo.title;
    caption.textContent = photo.caption;
    count.textContent = `${String(currentIndex + 1).padStart(2, "0")} / ${String(length).padStart(2, "0")}`;
  }

  function restoreFocus() {
    const target = opener;
    opener = null;
    if (target && target.isConnected !== false && typeof target.focus === "function") {
      target.focus({ preventScroll: true });
    }
  }

  function closeDialog() {
    if (typeof dialog.close === "function" && dialog.open) {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
      restoreFocus();
    }
  }

  function onClick(event) {
    const target = event.target;
    const openButton = target?.closest?.("[data-gallery-open]");
    if (openButton) {
      const index = Number(openButton.dataset.galleryOpen);
      if (!Number.isInteger(index) || index < 0 || index >= galleryPhotos.length) return;
      opener = openButton;
      showPhoto(index);
      if (typeof dialog.showModal === "function") {
        if (!dialog.open) dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
      closeButton.focus?.({ preventScroll: true });
      return;
    }
    if (target?.closest?.("[data-gallery-close]")) {
      closeDialog();
      return;
    }
    if (target?.closest?.("[data-gallery-previous]")) {
      showPhoto(currentIndex - 1);
      return;
    }
    if (target?.closest?.("[data-gallery-next]")) {
      showPhoto(currentIndex + 1);
      return;
    }
    if (target === dialog) closeDialog();
  }

  function onKeydown(event) {
    if (!dialog.open) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      showPhoto(currentIndex + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      showPhoto(currentIndex - 1);
    } else if (event.key === "Escape" && typeof dialog.showModal !== "function") {
      event.preventDefault();
      closeDialog();
    }
  }

  function onCancel(event) {
    event.preventDefault();
    closeDialog();
  }

  root.addEventListener("click", onClick);
  dialog.addEventListener("keydown", onKeydown);
  dialog.addEventListener("cancel", onCancel);
  dialog.addEventListener("close", restoreFocus);

  return () => {
    root.removeEventListener("click", onClick);
    dialog.removeEventListener("keydown", onKeydown);
    dialog.removeEventListener("cancel", onCancel);
    dialog.removeEventListener("close", restoreFocus);
    if (dialog.open && typeof dialog.close === "function") dialog.close();
    dialog.removeAttribute?.("open");
    opener = null;
    disposeMotion();
  };
}
