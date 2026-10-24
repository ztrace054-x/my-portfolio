import { stats } from "../data/stats.js?v=20261019.2";
import { learningLog } from "../data/learning-log.js?v=20261019.1";
import { escapeHTML } from "../utils.js?v=20261016.1";
import { countUp } from "../motion.js?v=20261016.1";

function renderActivityChart() {
  return `
    <div class="dashboard-chart-empty" role="status" aria-labelledby="activity-empty-title">
      <p class="dashboard-chart-empty__eyebrow">NO ACTIVITY RECORDED</p>
      <h3 id="activity-empty-title">Start with a real learning session</h3>
      <p>Activity appears here only after a study session has been recorded. Nothing is estimated or filled in for appearance.</p>
      <a href="#/learning-path">View learning path <span aria-hidden="true">↗</span></a>
    </div>`;
}
function renderProgressChart() {
  return `
    <div class="dashboard-chart-empty" role="status" aria-labelledby="progress-empty-title">
      <p class="dashboard-chart-empty__eyebrow">NO VERIFIED MILESTONES</p>
      <h3 id="progress-empty-title">Progress is earned, not estimated</h3>
      <p>Verified milestones will appear when completed work has supporting evidence. Planned topics remain separate from completed work.</p>
      <a href="#/write-ups">Explore the write-up format <span aria-hidden="true">↗</span></a>
    </div>`;
}
const metricCards = [
  { label: "Labs Completed", value: stats.labsCompleted, mark: "01", note: "No verified labs yet" },
  { label: "CTF Challenges", value: stats.ctfChallenges, mark: "02", note: "No completed challenges recorded" },
  { label: "Write-ups", value: stats.writeUps, mark: "03", note: "No write-ups published yet" },
  { label: "Certificates", value: stats.certificates, mark: "04", note: "No credentials earned" },
  { label: "Rooms Completed", value: stats.roomsCompleted, mark: "05", note: "No rooms completed yet" }
].map(item => `
  <article class="stat-card dashboard-stat dashboard-stat--phase4">
    <div class="stat-card-top"><span class="stat-icon" aria-hidden="true">${item.mark}</span><span class="badge badge--neutral trend-badge" aria-label="No trend data yet">NO TREND YET</span></div>
    <p class="stat-label">${escapeHTML(item.label)}</p>
    <p class="stat-number" data-count-up="${Number(item.value) || 0}">0</p>
    <p class="stat-foot"><span>${escapeHTML(item.note)}</span><span class="stat-foot-mark" aria-hidden="true">—</span></p>
  </article>`
).join("");
const logRows = learningLog.map(item => {
  const statusClass = item.status.toLowerCase().replaceAll(" ", "-");
  return `
    <tr data-learning-log-row data-status="${escapeHTML(item.status)}">
      <td><strong class="learning-log-topic">${escapeHTML(item.topic)}</strong></td>
      <td><span class="learning-log-status learning-log-status--${escapeHTML(statusClass)}">${escapeHTML(item.status)}</span></td>
      <td>${escapeHTML(item.level)}</td><td class="learning-log-notes">${escapeHTML(item.notes)}</td>
    </tr>`;
}).join("");

export function render() {
  return `
    <section class="view-page dashboard-view" aria-labelledby="view-heading">
      <header class="view-heading-block dashboard-heading">
        <div><p class="view-eyebrow">WORKSPACE OVERVIEW / 002</p><h1 id="view-heading" tabindex="-1">Dashboard</h1><p class="view-intro">A factual snapshot of the learning journey. Every total stays at zero until completed work is verified.</p></div>
        <span class="dashboard-status"><span class="status-dot" aria-hidden="true"></span> LEARNING MODE</span>
      </header>
      <div class="stat-grid dashboard-stat-grid" aria-label="Verified learning totals">${metricCards}</div>
      <div class="dashboard-chart-grid">
        <section class="hud-panel dashboard-chart-card" aria-labelledby="learning-activity-title">
          <div class="hud-panel-heading dashboard-chart-heading"><div><p class="view-eyebrow">ACTIVITY / 01</p><h2 id="learning-activity-title">Learning Activity</h2></div><span class="chart-empty-tag">NO RECORDS YET</span></div>
          ${renderActivityChart()}
        </section>
        <section class="hud-panel dashboard-chart-card" aria-labelledby="progress-over-time-title">
          <div class="hud-panel-heading dashboard-chart-heading"><div><p class="view-eyebrow">PROGRESS / 02</p><h2 id="progress-over-time-title">Progress Over Time</h2></div><span class="chart-empty-tag">NO VERIFIED HISTORY</span></div>
          ${renderProgressChart()}
        </section>
      </div>
      <section class="dashboard-shortcuts" aria-labelledby="workspace-shortcuts-title">
        <div class="dashboard-shortcuts__heading"><p class="view-eyebrow">NEXT / NAVIGATION</p><h2 id="workspace-shortcuts-title">Explore the workspace</h2><p>Move from learning plans to verified work, notes, and credentials.</p></div>
        <nav class="dashboard-shortcuts__grid" aria-label="Workspace shortcuts">
          <a class="dashboard-shortcut" href="#/projects"><span class="dashboard-shortcut__index">01</span><strong>Projects</strong><span>Work and evidence</span><b aria-hidden="true">↗</b></a>
          <a class="dashboard-shortcut" href="#/skill-progress"><span class="dashboard-shortcut__index">02</span><strong>Skills</strong><span>Current learning status</span><b aria-hidden="true">↗</b></a>
          <a class="dashboard-shortcut" href="#/learning-path"><span class="dashboard-shortcut__index">03</span><strong>Learning path</strong><span>Planned next steps</span><b aria-hidden="true">↗</b></a>
          <a class="dashboard-shortcut" href="#/write-ups"><span class="dashboard-shortcut__index">04</span><strong>Write-ups</strong><span>Technical notes</span><b aria-hidden="true">↗</b></a>
          <a class="dashboard-shortcut" href="#/certificates"><span class="dashboard-shortcut__index">05</span><strong>Certificates</strong><span>Credential status</span><b aria-hidden="true">↗</b></a>
        </nav>
      </section>
      <section class="hud-panel dashboard-log-panel" aria-labelledby="learning-log-title">
        <div class="hud-panel-heading dashboard-log-heading">
          <div><p class="view-eyebrow">PERSONAL RECORD / 03</p><h2 id="learning-log-title">Learning Log</h2><p class="dashboard-log-intro">A short list of current study topics and future plans—not a record of earned credentials or completed labs.</p></div>
          <span class="view-code">${learningLog.length.toString().padStart(2, "0")} TOPICS</span>
        </div>
        <div class="learning-log-controls">
          <label class="learning-log-search"><span class="sr-only">Search learning log</span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.5"></circle><path d="m16 16 4.5 4.5"></path></svg><input type="search" data-learning-log-search placeholder="Search topics or notes..." autocomplete="off" spellcheck="false"></label>
          <label class="learning-log-filter"><span class="sr-only">Filter learning log by status</span><select data-learning-log-filter aria-label="Filter learning log by status">
            <option value="all">All statuses</option><option value="In progress">In progress</option><option value="Building">Building</option><option value="Planned">Planned</option><option value="Future goal">Future goal</option>
          </select></label>
        </div>
        <div class="data-table-wrap learning-log-table-wrap"><table class="data-table learning-log-table">
          <caption class="sr-only">Learning topics, their current status, level, and notes.</caption>
          <thead><tr><th scope="col">Topic</th><th scope="col">Status</th><th scope="col">Level</th><th scope="col">Notes</th></tr></thead>
          <tbody data-learning-log-body>${logRows}</tbody>
        </table></div>
        <div class="learning-log-footer"><p data-learning-log-count role="status" aria-live="polite">${learningLog.length} of ${learningLog.length} topics shown</p><p>All entries are local learning notes.</p></div>
        <p class="learning-log-empty" data-learning-log-empty hidden>No matching learning log entries.</p>
      </section>
      <footer class="dashboard-footer-note"><span>DATA INTEGRITY</span><span>NO LIVE SCANS · NO INVENTED METRICS · AUTHORIZED PRACTICE ONLY</span></footer>
    </section>`;
}

export function mount(root, { motion = null } = {}) {
  const counters = [...root.querySelectorAll("[data-count-up]")];
  const stopCounters = counters.map(element => countUp(element, Number(element.dataset.countUp), { duration: 760, controller: motion, formatter: value => String(Math.round(value)) }));
  const search = root.querySelector("[data-learning-log-search]");
  const filter = root.querySelector("[data-learning-log-filter]");
  const rows = [...root.querySelectorAll("[data-learning-log-row]")];
  const empty = root.querySelector("[data-learning-log-empty]");
  const count = root.querySelector("[data-learning-log-count]");
  function filterRows() {
    const query = (search?.value || "").trim().toLocaleLowerCase();
    const selectedStatus = filter?.value || "all";
    let visible = 0;
    rows.forEach(row => {
      const matchesQuery = !query || row.textContent.toLocaleLowerCase().includes(query);
      const matchesStatus = selectedStatus === "all" || row.dataset.status === selectedStatus;
      row.hidden = !(matchesQuery && matchesStatus);
      if (!row.hidden) visible++;
    });
    if (empty) empty.hidden = visible !== 0;
    if (count) count.textContent = `${visible} of ${rows.length} topics shown`;
  }
  function onInput(event) { if (event.target.matches?.("[data-learning-log-search]")) filterRows(); }
  function onChange(event) {
    if (event.target.matches?.("[data-learning-log-filter]")) filterRows();
  }
    root.addEventListener("input", onInput);
  root.addEventListener("change", onChange);
  filterRows();
  return () => {
    root.removeEventListener("input", onInput);
    root.removeEventListener("change", onChange);
    stopCounters.forEach(stop => stop());
  };
}
