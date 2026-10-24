import { projects } from "../data/projects.js?v=20261020.2";
import { escapeHTML } from "../utils.js?v=20261016.1";

function renderProject(project, index) {
  const technologies = project.technologies.map(item => `<li>${escapeHTML(item)}</li>`).join("");
  return `
    <article class="hud-panel project-card" aria-labelledby="project-${escapeHTML(project.id)}-title">
      <header class="project-card__header">
        <span class="project-card__index">PROJECT / ${String(index + 1).padStart(2, "0")}</span>
        <span class="badge badge--cyan">${escapeHTML(project.status)}</span>
      </header>
      <p class="project-card__type">${escapeHTML(project.type)}</p>
      <h2 id="project-${escapeHTML(project.id)}-title">${escapeHTML(project.title)}</h2>
      <p class="project-card__summary">${escapeHTML(project.summary)}</p>
      <div class="project-card__section">
        <p class="project-card__label">TECH STACK</p>
        <ul class="project-card__stack">${technologies}</ul>
      </div>
      <p class="project-card__scope"><strong>Scope note</strong> ${escapeHTML(project.scopeNote)}</p>
      <div class="project-card__links">
        <a href="${escapeHTML(project.sourceUrl)}" target="_blank" rel="noopener noreferrer">Source repository <span aria-hidden="true">↗</span></a>
        <a href="${escapeHTML(project.publicUrl)}" target="_blank" rel="noopener noreferrer">Public website <span aria-hidden="true">↗</span></a>
      </div>
    </article>`;
}

export function render() {
  const cards = projects.map(renderProject).join("");
  return `
    <section class="view-page phase5-view projects-view" aria-labelledby="view-heading">
      <header class="view-heading-block projects-heading">
        <div>
          <p class="view-eyebrow">PROJECTS / VERIFIED WORK</p>
          <h1 id="view-heading" tabindex="-1">Projects</h1>
          <p class="view-intro">A small, evidence-led collection. Work is marked in progress until its implementation and supporting evidence have been reviewed.</p>
        </div>
        <span class="badge badge--neutral">${projects.length} recorded project${projects.length === 1 ? "" : "s"}</span>
      </header>
      ${cards ? `<div class="project-card-grid">${cards}</div>` : `
        <section class="hud-panel project-empty-state" role="status">
          <p class="view-eyebrow">NO VERIFIED PROJECTS YET</p>
          <h2>Projects will appear when there is evidence to show.</h2>
          <p>Planned work stays separate from completed work. No projects or results are invented to fill this space.</p>
          <a href="#/learning-path">Review the learning path <span aria-hidden="true">↗</span></a>
        </section>`}
      <section class="hud-panel project-evidence-note" aria-labelledby="project-evidence-title">
        <p class="view-eyebrow">EVIDENCE STANDARD</p>
        <h2 id="project-evidence-title">Show the work, not just the claim.</h2>
        <p>Future case studies should include the objective, authorized environment, tools, method, real evidence, outcome, and lessons learned. Authorized lab notes remain planned until documented.</p>
        <a href="#/write-ups">Open write-ups <span aria-hidden="true">↗</span></a>
      </section>
    </section>`;
}

export function mount() {
  return () => {};
}
