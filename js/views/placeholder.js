import { escapeHTML } from "../utils.js?v=20261016.1";

export function renderPlaceholder({ title, phase, description, code }) {
  const safeTitle = escapeHTML(title);
  const safeDescription = escapeHTML(description);
  const safeCode = escapeHTML(code || "MODULE / STAGED");
  return `
    <section class="view-page placeholder-view" aria-labelledby="view-heading">
      <header class="view-heading-block">
        <p class="view-eyebrow">ZTRACE WORKSPACE / ${safeCode}</p>
        <div class="view-title-row">
          <h1 id="view-heading" tabindex="-1">${safeTitle}</h1>
          <span class="badge badge--amber">PLANNED · PHASE ${Number(phase) || 5}</span>
        </div>
        <p class="view-intro">${safeDescription}</p>
      </header>
      <section class="hud-panel placeholder-module" aria-label="${safeTitle} module status">
        <div class="placeholder-orbit" aria-hidden="true"><span></span><span></span><span></span></div>
        <div class="empty-state-icon" aria-hidden="true">···</div>
        <p class="view-eyebrow">MODULE NOT BUILT YET</p>
        <h2>${safeTitle} is staged for a later phase</h2>
        <p>This area is a visual placeholder only. No live targets, scans, jobs, credentials, or activity are being reported here.</p>
        <div class="placeholder-note"><span class="status-dot" aria-hidden="true"></span><span>DISPLAY ONLY / NO LIVE NETWORK ACTIVITY</span></div>
      </section>
    </section>`;
}
