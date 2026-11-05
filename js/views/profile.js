import { profile } from "../data/profile.js?v=20261105.1";
import { links } from "../data/links.js?v=20261016.1";
import { escapeHTML } from "../utils.js?v=20261016.1";
const e = escapeHTML;

export function render() {
  const interests = profile.interests.map((item, index) =>
    '<article class="identity-interest-card"><span class="identity-card-index">0' + (index + 1) + '</span><h3>' + e(item.title) + '</h3><p>' + e(item.detail) + '</p></article>'
  ).join("");
  const list = items => items.map(item => '<li class="identity-list-item">' + e(item) + '</li>').join("");
  const story = profile.story.map(paragraph => '<p>' + e(paragraph) + '</p>').join("");
  const publicLinks = [
    ["GitHub", links.github], ["TryHackMe", links.tryHackMe],
    ["ZeroDayTest", links.zeroDayTest], ["Instagram", links.instagram]
  ].map(([label, href]) => '<a class="profile-link" href="' + e(href) + '" target="_blank" rel="noopener noreferrer"><span>' + e(label) + '</span><span aria-hidden="true">↗</span></a>').join("");

  return `
    <section class="view-page profile-view identity-view" aria-labelledby="view-heading">
      <header class="view-heading-block">
        <p class="view-eyebrow">ZTRACE / PERSONAL IDENTITY</p>
        <div class="view-title-row"><h1 id="view-heading" tabindex="-1">Meet Md Saad</h1><span class="badge badge--cyan">LEARNING IN PUBLIC</span></div>
        <p class="view-intro">A CSE student at the beginning of a cybersecurity journey—building foundations with curiosity, discipline, and responsibility.</p>
      </header>
      <section class="hud-panel profile-hero identity-hero" aria-labelledby="profile-name">
        <div class="profile-hero-media"><img class="profile-hero-portrait" src="./assets/saad-golden.jpg" alt="Md Saad, profile portrait in warm evening light" width="864" height="1080" fetchpriority="high" decoding="async"><span class="profile-portrait-tag">ZTRACE / PERSONAL PROFILE</span></div>
        <div class="profile-hero-copy">
          <p class="view-eyebrow">THE PERSON BEHIND THE WORK</p><h2 id="profile-name">${e(profile.name)}</h2><p class="profile-hero-handle">@${e(profile.handle)}</p>
          <p class="profile-role">${e(profile.education)} <span aria-hidden="true">/</span> ${e(profile.level)}</p>
          <div class="profile-status-chips" aria-label="Profile status">${profile.statusChips.map((chip,index) => '<span class="profile-status-chip profile-status-chip--' + (index+1) + '">' + e(chip) + '</span>').join("")}</div>
          <p class="profile-hero-line">I'm learning how systems work, how they can be protected, and how to approach security responsibly.</p>
          <p class="identity-honesty-note">${e(profile.statusNote)}</p>
        </div>
      </section>
      <section class="identity-section hud-panel" aria-labelledby="identity-about-title">
        <div class="hud-panel-heading"><h2 id="identity-about-title">01 / ABOUT ME</h2><span class="view-code">THE BEGINNING</span></div>
        <div class="identity-story">${story}</div><p class="identity-story-label">${e(profile.storyLabel)}</p>
      </section>
      <section class="identity-section" aria-labelledby="identity-journey-title">
        <div class="identity-section-heading"><p class="view-eyebrow">02 / PERSONAL JOURNEY</p><h2 id="identity-journey-title">Foundations before claims.</h2><p>My path is a work in progress. Each step is about understanding the fundamentals before moving into more advanced topics.</p></div>
        <div class="identity-journey-grid">
          <article class="identity-journey-card is-current"><span>NOW / 01</span><h3>Learn the foundations</h3><p>Study CSE fundamentals, Linux, networking, and the principles behind ethical hacking.</p><small>CURRENT LEARNING</small></article>
          <article class="identity-journey-card"><span>NEXT / 02</span><h3>Practice responsibly</h3><p>Build practical familiarity in intentionally vulnerable labs and other environments where permission is explicit.</p><small>FUTURE PRACTICE</small></article>
          <article class="identity-journey-card"><span>AHEAD / 03</span><h3>Grow through evidence</h3><p>Document genuine learning, develop repeatable skills, and gradually work toward a responsible cybersecurity career.</p><small>LONG-TERM DIRECTION</small></article>
        </div>
      </section>
      <section class="identity-section" aria-labelledby="identity-interests-title">
        <div class="identity-section-heading"><p class="view-eyebrow">03 / CYBERSECURITY INTERESTS</p><h2 id="identity-interests-title">What makes me curious.</h2></div><div class="identity-interest-grid">${interests}</div>
      </section>
      <section class="identity-section hud-panel" aria-labelledby="identity-focus-title">
        <div class="hud-panel-heading"><h2 id="identity-focus-title">04 / CURRENT LEARNING FOCUS</h2><span class="view-code">BEGINNER FOUNDATIONS</span></div>
        <ul class="identity-check-list">${list(profile.learningFocus)}</ul>
        <div class="identity-course-card">
          <div><p class="view-eyebrow">COURSE / LEARNING RECORD</p><h3>${e(profile.course)}</h3><p>Learning provider: <strong>${e(profile.learningPlatform)}</strong></p><p class="identity-course-programme">Course certificate listed as part of the learning journey.</p></div>
          <div class="identity-course-meta"><span>COURSE CERTIFICATE</span><strong>LEARNING RECORD</strong><small>Not a professional certification</small></div>
          <p class="identity-course-note">${e(profile.courseNote)} ${e(profile.courseVerification)}</p>
        </div>
      </section>
      <section class="identity-section identity-philosophy" aria-labelledby="identity-philosophy-title">
        <p class="view-eyebrow">05 / PERSONAL LEARNING PHILOSOPHY</p><h2 id="identity-philosophy-title">Curiosity with responsibility.</h2><p>${e(profile.philosophy)}</p>
      </section>
      <section class="identity-section hud-panel" aria-labelledby="identity-goals-title">
        <div class="hud-panel-heading"><h2 id="identity-goals-title">06 / FUTURE GOALS</h2><span class="view-code">DIRECTION / NOT ACHIEVEMENTS</span></div><ul class="identity-check-list">${list(profile.futureGoals)}</ul>
      </section>
      <section class="hud-panel profile-links-panel" aria-labelledby="profile-links-title">
        <div class="hud-panel-heading"><h2 id="profile-links-title">FIND ME ELSEWHERE</h2><span class="view-code">PUBLIC LINKS</span></div>
        <div class="profile-links-grid">${publicLinks}<div class="profile-email-row"><a class="profile-link" href="${e(links.email)}"><span>Email</span><span aria-hidden="true">↗</span></a><button class="profile-copy-button" type="button" data-copy-email aria-label="Copy email address"><span data-copy-label>Copy email</span><span aria-hidden="true">⧉</span></button></div></div>
        <p class="profile-copy-feedback" data-copy-feedback role="status" aria-live="polite" aria-atomic="true"></p>
      </section>
    </section>`;
}

export function mount(root) {
  let disposed = false;
  let pending = false;
  async function onClick(event) {
    const button = event.target.closest?.("[data-copy-email]");
    if (!button || pending) return;
    pending = true; button.disabled = true;
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
    } finally { pending = false; if (!disposed) button.disabled = false; }
  }
  root.addEventListener("click", onClick);
  return () => { disposed = true; root.removeEventListener("click", onClick); };
}
