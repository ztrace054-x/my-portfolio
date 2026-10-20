import { CONTENT, TIMING } from "../config.js?v=20261016.1";
import { links } from "../data/links.js?v=20261016.1";
import { escapeHTML } from "../utils.js?v=20261016.1";
import { mountPhase6View, renderPhase6Header } from "./phase6-view.js?v=20261020.3";

const emailAddress = String(CONTENT.email || links.emailAddress || "").trim();
const emailHref = `mailto:${emailAddress}`;
const contactLinks = Object.freeze([
  Object.freeze({ label: "GitHub", key: "github", index: "01", description: "Repositories and source code." }),
  Object.freeze({ label: "TryHackMe", key: "tryHackMe", index: "02", description: "Cybersecurity learning profile." }),
  Object.freeze({ label: "ZeroDayTest", key: "zeroDayTest", index: "03", description: "The original profile link; sign-in may be required." }),
  Object.freeze({ label: "Instagram", key: "instagram", index: "04", description: "Personal social profile." })
]);
const headerCopy = Object.freeze({
  eyebrow: "ZTRACE WORKSPACE / CONNECTIONS",
  title: "Contact",
  badge: "PUBLIC LINKS",
  intro: "Reach out through the existing email address or visit one of the public profiles. This page uses direct links and does not submit a contact form."
});

export function render() {
  const socialCards = contactLinks.map(item => `
    <a class="phase6-social-link phase6-reveal" style="--phase6-delay:${Number(item.index) * 45}ms" href="${escapeHTML(links[item.key])}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHTML(item.label)} (opens in a new tab)">
      <span class="phase6-social-top"><span class="phase6-micro">CHANNEL / ${escapeHTML(item.index)}</span><span class="phase6-social-arrow" aria-hidden="true">+</span></span>
      <strong>${escapeHTML(item.label)}</strong>
      <span class="phase6-social-description">${escapeHTML(item.description)}</span>
      <span class="phase6-social-open">OPEN PROFILE <span aria-hidden="true">&rarr;</span></span>
    </a>`).join("");

  return `
    <section class="view-page phase6-view phase6-contact-view" aria-labelledby="view-heading">
      ${renderPhase6Header(headerCopy)}
      <div class="phase6-contact-grid">
        <section class="hud-panel phase6-contact-card phase6-reveal" aria-labelledby="phase6-email-heading" style="--phase6-delay:40ms">
          <div class="hud-panel-heading">
            <h2 id="phase6-email-heading">DIRECT EMAIL</h2>
            <span class="view-code">CHANNEL / 001</span>
          </div>
          <p class="phase6-contact-lead">For a direct message, use the email address below.</p>
          <p class="phase6-email-address">${escapeHTML(emailAddress)}</p>
          <div class="phase6-contact-actions">
            <a class="hud-btn hud-btn--primary" href="${escapeHTML(emailHref)}">OPEN EMAIL <span aria-hidden="true">&rarr;</span></a>
            <button class="hud-btn" type="button" data-copy-email aria-label="Copy email address">
              <span data-copy-label>COPY ADDRESS</span><span aria-hidden="true">&square;</span>
            </button>
          </div>
          <p class="phase6-contact-feedback" data-copy-feedback role="status" aria-live="polite" aria-atomic="true">The email address is visible above if clipboard access is unavailable.</p>
        </section>
        <section class="phase6-contact-profile-panel" aria-labelledby="phase6-profiles-heading">
          <div class="phase6-section-heading">
            <div>
              <p class="view-eyebrow">ELSEWHERE / 004</p>
              <h2 id="phase6-profiles-heading">Public profiles</h2>
              <p>These links preserve the profile destinations already used by the portfolio.</p>
            </div>
          </div>
          <div class="phase6-contact-links">${socialCards}</div>
        </section>
      </div>
      <section class="phase6-contact-note phase6-reveal" aria-label="Contact privacy note" style="--phase6-delay:180ms">
        <span class="phase6-contact-note-mark" aria-hidden="true">i</span>
        <div>
          <p class="view-eyebrow">STATIC CONTACT / NO FORM</p>
          <p>This workspace opens your email app or a public profile. It does not collect message submissions or request personal information.</p>
        </div>
      </section>
    </section>`;
}

export function mount(root, options = {}) {
  const disposeMotion = mountPhase6View(root, options);
  const button = root?.querySelector?.("[data-copy-email]");
  if (!button) return disposeMotion;

  let pending = false;
  let disposed = false;
  let resetTimer = 0;
  const label = button.querySelector("[data-copy-label]");
  const feedback = root.querySelector("[data-copy-feedback]");

  async function onClick(event) {
    const target = event.target?.closest?.("[data-copy-email]");
    if (target !== button || pending) return;
    pending = true;
    button.disabled = true;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(emailAddress);
      if (disposed) return;
      if (label) label.textContent = "COPIED";
      if (feedback) feedback.textContent = "Email address copied to the clipboard.";
    } catch {
      if (disposed) return;
      if (label) label.textContent = "COPY UNAVAILABLE";
      if (feedback) feedback.textContent = "Clipboard access is unavailable here. Use Open Email or select the address above.";
    } finally {
      pending = false;
      if (!disposed) button.disabled = false;
      if (resetTimer) clearTimeout(resetTimer);
      if (!disposed) {
        resetTimer = setTimeout(() => {
          resetTimer = 0;
          if (disposed) return;
          if (label) label.textContent = "COPY ADDRESS";
        }, TIMING.copyReset);
      }
    }
  }

  root.addEventListener("click", onClick);
  return () => {
    disposed = true;
    root.removeEventListener("click", onClick);
    if (resetTimer) clearTimeout(resetTimer);
    disposeMotion();
  };
}
