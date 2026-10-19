import { profile } from "../data/profile.js?v=20261016.1";
import { stats } from "../data/stats.js?v=20261016.1";
import { escapeHTML } from "../utils.js?v=20261016.1";

export function render() {
  const cards = [
    { label: "LABS COMPLETED", value: stats.totalLabs, mark: "01", note: "No completed labs recorded" },
    { label: "WRITE-UPS", value: stats.writeUps, mark: "02", note: "No write-ups published yet" },
    { label: "SKILLS IN PROGRESS", value: stats.skillsInProgress, mark: "03", note: "Milestones not entered yet" },
    { label: "CERTIFICATES EARNED", value: stats.certificatesEarned, mark: "04", note: "No credentials claimed" }
  ].map(item => `
    <article class="stat-card dashboard-stat">
      <div class="stat-card-top"><span class="stat-icon" aria-hidden="true">${item.mark}</span><span class="stat-live-dot" aria-hidden="true"></span></div>
      <p class="stat-label">${escapeHTML(item.label)}</p>
      <p class="stat-number">${Number(item.value) || 0}</p>
      <p class="stat-foot"><span>${escapeHTML(item.note)}</span><span class="stat-foot-mark">—</span></p>
    </article>`).join("");
  const focus = profile.focus.map((item, index) => `
    <li class="dashboard-focus-item"><span class="dashboard-focus-index">0${index + 1}</span><span>${escapeHTML(item)}</span><span class="focus-status">FOUNDATION</span></li>`).join("");
  return `
    <section class="view-page dashboard-view" aria-labelledby="view-heading">
      <header class="view-heading-block dashboard-heading">
        <div><p class="view-eyebrow">WORKSPACE OVERVIEW / 002</p><h1 id="view-heading" tabindex="-1">Dashboard</h1><p class="view-intro">A factual snapshot of the learning journey. Counts stay at zero until real, verified entries are added.</p></div>
        <span class="dashboard-status"><span class="status-dot" aria-hidden="true"></span> LEARNING MODE</span>
      </header>
      <div class="stat-grid dashboard-stat-grid" aria-label="Verified learning totals">${cards}</div>
      <div class="dashboard-lower-grid">
        <section class="hud-panel dashboard-focus-panel" aria-labelledby="dashboard-focus-title">
          <div class="hud-panel-heading"><h3 id="dashboard-focus-title">CURRENT LEARNING FOCUS</h3><span class="badge badge--cyan">FOUNDATIONS</span></div>
          <ul class="dashboard-focus-list">${focus}</ul>
          <p class="dashboard-honesty-note"><span aria-hidden="true">i</span> These topics describe the current learning focus, not measured skill scores or completed milestones.</p>
        </section>
        <section class="hud-panel dashboard-activity-panel" aria-labelledby="dashboard-activity-title">
          <div class="hud-panel-heading"><h3 id="dashboard-activity-title">RECENT ACTIVITY</h3><span class="view-code">LOCAL RECORD</span></div>
          <div class="empty-state dashboard-empty">
            <span class="empty-state-icon" aria-hidden="true">∅</span>
            <h3>No activity recorded yet</h3>
            <p>When verified labs, write-ups, or learning milestones are added, they can appear here.</p>
          </div>
        </section>
      </div>
      <footer class="dashboard-footer-note"><span>DATA INTEGRITY</span><span>NO LIVE SCANS · NO INVENTED METRICS · AUTHORIZED PRACTICE ONLY</span></footer>
    </section>`;
}
