import { profile } from "../data/profile.js?v=20261024.3";
import { links } from "../data/links.js?v=20261016.1";
import { escapeHTML } from "../utils.js?v=20261016.1";

export function render() {
  const chips = profile.statusChips.map((chip, index) =>
    `<span class="profile-status-chip profile-status-chip--${index + 1}">${escapeHTML(chip)}</span>`
  ).join("");
  const story = profile.story.map(paragraph =>
    `<p class="profile-story-line">${escapeHTML(paragraph)}</p>`
  ).join("");
  const focus = profile.focus.map(item =>
    `<li class="focus-chip">${escapeHTML(item)}</li>`
  ).join("");
  const publicLinks = [
    ["GitHub", links.github],
    ["TryHackMe", links.tryHackMe],
    ["ZeroDayTest", links.zeroDayTest],
    ["Instagram", links.instagram]
  ].map(([label, href]) =>
    `<a class="profile-link" href="${escapeHTML(href)}" target="_blank" rel="noopener noreferrer"><span>${escapeHTML(label)}</span><span aria-hidden="true">↗</span></a>`
  ).join("");
  return `
    <section class="view-page profile-view" aria-labelledby="view-heading">
      <header class="view-heading-block">
        <p class="view-eyebrow">OPERATOR PROFILE / 001</p>
        <div class="view-title-row"><h1 id="view-heading" tabindex="-1">Profile</h1><span class="badge badge--cyan">LEARNING IN PUBLIC</span></div>
        <p class="view-intro">The person behind ZTRACE, the foundations being learned, and the principles guiding the journey.</p>
      </header>
      <section class="hud-panel profile-hero" aria-labelledby="profile-name">
        <div class="profile-hero-media">
          <img class="profile-hero-portrait" src="./assets/saad-golden.jpg" alt="Portrait of Saad" width="864" height="1080" fetchpriority="high" decoding="async">
          <span class="profile-portrait-tag">LOCAL PROFILE / SAAD</span>
        </div>
        <div class="profile-hero-copy">
          <p class="view-eyebrow">IDENTITY / LEARNING CONSOLE</p>
          <h2 id="profile-name">${escapeHTML(profile.name)}</h2>
          <p class="profile-hero-handle">@${escapeHTML(profile.handle)}</p>
          <p class="profile-role">${escapeHTML(profile.education)} <span aria-hidden="true">/</span> ${escapeHTML(profile.level)}</p>
          <div class="profile-status-chips" aria-label="Profile status">${chips}</div>
          <p class="profile-hero-line">I'm choosing to make my beginning visible.</p>
        </div>
      </section>
      <div class="profile-content-grid">
        <section class="hud-panel profile-about-card" aria-labelledby="profile-about-title">
          <div class="hud-panel-heading"><h3 id="profile-about-title">ABOUT / THE BEGINNING</h3><span class="view-code">STORY / 01</span></div>
          ${story}
        </section>
        <section class="hud-panel profile-current-card" aria-labelledby="profile-focus-title">
          <div class="hud-panel-heading"><h3 id="profile-focus-title">CURRENTLY LEARNING</h3><span class="badge badge--cyan">FOUNDATIONS</span></div>
          <p class="profile-card-lead">${escapeHTML(profile.course)}</p>
          <p class="profile-course-source">COURSE / ${escapeHTML(profile.learningPlatform)}</p>
          <ul class="focus-chip-list">${focus}</ul>
          <p class="profile-card-note">Learning step by step, without presenting study topics as completed milestones.</p>
        </section>
        <section class="hud-panel profile-approach-card" aria-labelledby="profile-approach-title">
          <div class="hud-panel-heading"><h3 id="profile-approach-title">MY APPROACH</h3><span class="view-code">PRINCIPLE / 01</span></div>
          <div class="profile-approach-mark" aria-hidden="true">✓</div>
          <p class="profile-approach-statement">${escapeHTML(profile.principle)}</p>
          <p class="profile-card-note">Curiosity is important; consent, responsibility, and permission come first.</p>
        </section>
        <section class="hud-panel profile-terminal-card" aria-labelledby="profile-terminal-title">
          <div class="hud-panel-heading"><h3 id="profile-terminal-title">MINI TERMINAL</h3><span class="view-code">LOCAL / READ-ONLY</span></div>
          <div class="profile-terminal" aria-label="Decorative terminal showing current learning status">
            <div class="profile-terminal-top"><span><i aria-hidden="true"></i> saad@ztrace:~</span><span>SESSION / LOCAL</span></div>
            <div class="profile-terminal-body">
              <p><span class="terminal-prompt">$</span> whoami</p>
              <pre>saad — CSE student / cybersecurity learner</pre>
              <p><span class="terminal-prompt">$</span> cat status.txt</p>
              <pre>Course: Ethical Hacking for Beginners
Learning: Linux, networking, recon
Ethics: Practice with permission
Status: Beginning, InshaAllah</pre>
            </div>
          </div>
        </section>
        <section class="hud-panel profile-links-panel" aria-labelledby="profile-links-title">
          <div class="hud-panel-heading"><h3 id="profile-links-title">FIND ME ELSEWHERE</h3><span class="view-code">PUBLIC LINKS</span></div>
          <div class="profile-links-grid">
            ${publicLinks}
            <div class="profile-email-row">
              <a class="profile-link" href="${escapeHTML(links.email)}"><span>Email</span><span aria-hidden="true">↗</span></a>
              <button class="profile-copy-button" type="button" data-copy-email aria-label="Copy email address"><span data-copy-label>Copy email</span><span aria-hidden="true">⧉</span></button>
            </div>
          </div>
          <p class="profile-copy-feedback" data-copy-feedback role="status" aria-live="polite" aria-atomic="true"></p>
        </section>
      </div>
    </section>`;
}

export function mount(root) {
  let disposed = false;
  let pending = false;
  async function onClick(event) {
    const button = event.target.closest?.("[data-copy-email]");
    if (!button || pending) return;
    pending = true;
    button.disabled = true;
    const label = button.querySelector("[data-copy-label]");
    const feedback = root.querySelector("[data-copy-feedback]");
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(links.emailAddress || links.email.replace(/^mailto:/, ""));
      if (disposed) return;
      if (label) label.textContent = "Copied!";
      if (feedback) feedback.textContent = "Email address copied.";
    } catch {
      if (disposed) return;
      if (feedback) feedback.textContent = "Copy is unavailable here. Use the Email link to get in touch.";
    } finally {
      pending = false;
      if (!disposed) button.disabled = false;
    }
  }
  root.addEventListener("click", onClick);
  return () => { disposed = true; root.removeEventListener("click", onClick); };
}
