import { profile } from "../data/profile.js?v=20261016.1";
import { links } from "../data/links.js?v=20261016.1";
import { escapeHTML } from "../utils.js?v=20261016.1";

export function render() {
  const focus = profile.focus.map(item => `<li class="focus-chip">${escapeHTML(item)}</li>`).join("");
  const story = profile.story.map((paragraph, index) => `<p class="profile-story-line" data-story-index="${index + 1}">${escapeHTML(paragraph)}</p>`).join("");
  const publicLinks = [
    ["GitHub", links.github, "↗"],
    ["TryHackMe", links.tryHackMe, "↗"],
    ["ZeroDayTest", links.zeroDayTest, "↗"],
    ["Instagram", links.instagram, "↗"],
    ["Email", links.email, "↗"]
  ].map(([label, href, mark]) => `<a class="profile-link" href="${escapeHTML(href)}" ${href.startsWith("mailto:") ? "" : 'target="_blank" rel="noopener noreferrer"'}><span>${escapeHTML(label)}</span><span aria-hidden="true">${mark}</span></a>`).join("");
  return `
    <section class="view-page profile-view" aria-labelledby="view-heading">
      <header class="view-heading-block">
        <p class="view-eyebrow">OPERATOR PROFILE / 001</p>
        <div class="view-title-row"><h1 id="view-heading" tabindex="-1">Profile</h1><span class="badge badge--cyan">LEARNING IN PUBLIC</span></div>
        <p class="view-intro">A clear, honest record of the person behind ZTRACE and the foundations being learned.</p>
      </header>
      <div class="profile-layout">
        <section class="hud-panel profile-identity" aria-labelledby="profile-name">
          <div class="profile-portrait-wrap">
            <img class="profile-portrait" src="./assets/saad-golden.jpg" alt="Portrait of Saad" width="864" height="1080">
            <span class="profile-portrait-tag">LOCAL PROFILE / SAAD</span>
          </div>
          <p class="view-eyebrow">IDENTITY / LOCAL PROFILE</p>
          <h2 id="profile-name">${escapeHTML(profile.name)}</h2>
          <p class="profile-handle">${escapeHTML(profile.brand)}</p>
          <p class="profile-role">${escapeHTML(profile.education)} <span aria-hidden="true">·</span> ${escapeHTML(profile.level)}</p>
          <div class="profile-identity-foot"><span class="status-dot" aria-hidden="true"></span><span>STATUS: LEARNING MODE</span></div>
        </section>
        <div class="profile-detail-column">
          <section class="hud-panel profile-story" aria-labelledby="profile-story-title">
            <div class="hud-panel-heading"><h3 id="profile-story-title">THE PERSON BEHIND THE SIGNAL</h3><span class="badge badge--neutral">BEGINNER</span></div>
            ${story}
            <div class="profile-principle"><span class="profile-principle-icon" aria-hidden="true">✓</span><div><span class="view-eyebrow">CORE PRINCIPLE</span><strong>${escapeHTML(profile.principle)}</strong></div></div>
          </section>
          <section class="hud-panel profile-focus" aria-labelledby="profile-focus-title">
            <div class="hud-panel-heading"><h3 id="profile-focus-title">CURRENT LEARNING FOCUS</h3><span class="view-code">FOCUS / 03</span></div>
            <ul class="focus-chip-list">${focus}</ul>
            <p class="profile-course-note"><span>COURSE</span><strong>${escapeHTML(profile.course)}</strong><span>VIA ${escapeHTML(profile.learningPlatform)}</span></p>
          </section>
          <section class="hud-panel profile-links-panel" aria-labelledby="profile-links-title">
            <div class="hud-panel-heading"><h3 id="profile-links-title">PUBLIC LINKS</h3><span class="view-code">CONNECT / LOCAL</span></div>
            <div class="profile-links-grid">${publicLinks}</div>
          </section>
        </div>
      </div>
    </section>`;
}
