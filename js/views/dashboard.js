import { stats } from "../data/stats.js?v=20261019.2";
import { learningLog } from "../data/learning-log.js?v=20261019.1";
import { escapeHTML } from "../utils.js?v=20261016.1";
import { countUp } from "../motion.js?v=20261016.1";

const PERIOD_OPTIONS = `
  <option value="Weekly">Weekly</option>
  <option value="Last Month">Last Month</option>`;

function renderActivityChart() {
  const bars = [
    { x: 42, height: 34 }, { x: 102, height: 54 }, { x: 162, height: 42 },
    { x: 222, height: 66 }, { x: 282, height: 49 }, { x: 342, height: 31 },
    { x: 402, height: 57 }
  ].map(bar => `
    <g class="chart-hover-target" tabindex="0" role="img" aria-label="No data yet">
      <title>No data yet</title>
      <rect class="chart-ghost-bar" x="${{bar.x}" y="${{124 - bar.height}" width="27" height="${{bar.height}" rx="2"></rect>
    </g>`
  ).join("");
  return `
    <svg class="dashboard-chart-svg" viewBox="0 0 470 158" role="group" aria-label="Empty learning activity bar chart">
      <desc>Decorative ghost bars only. No learning activity data has been recorded.</desc>
      <g class="chart-grid-lines" aria-hidden="true"><path d="M20 28H450 M20 60H450 M20 92H450 M20 124H450"></path></g>
      ${{bars}
      <path class="chart-axis" d="M20 124H450"></path>
      <circle class="chart-pulse" cx="28" cy="124" r="4" aria-label="No data yet"><title>No data yet</title></circle>
      <g class="chart-axis-labels" aria-hidden="true">
        <text x="55" y="146">M</text><text x="115" y="146">T</text><text x="175" y="146">W</text>
        <text x="235" y="146">T</text><text x="295" y="146">F</text><text x="355" y="146">S</text><text x="415" y="146">S</text>
      </g>
    </svg>`;
}
function renderProgressChart() {
  return `
    <svg class="dashboard-chart-svg" viewBox="0 0 470 158" role="group" aria-label="Empty progress over time line chart">
      <desc>A flat baseline and moving pulse are decorative. No progress history has been recorded.</desc>
      <g class="chart-grid-lines" aria-hidden="true"><path d="M20 28H450 M20 60H450 M20 92H450 M20 124H450"></path></g>
      <path class="chart-axis" d="M20 124H450"></path>
      <path class="chart-empty-line chart-hover-target" d="M28 98H442" tabindex="0" role="img" aria-label="No data yet"><title>No data yet</title></path>
      <circle class="chart-pulse chart-pulse--line" cx="28" cy="98" r="4" aria-label="No data yet"><title>No data yet</title></circle>
      <g class="chart-axis-labels" aria-hidden="true"><text x="28" y="146">START</text><text x="225" y="146">IN PROGRESS</text><text x="423" y="146">NOW</text></g>
    </svg>`;
}
const metricCards = [
  { label: "Labs Completed", value: stats.labsCompleted, mark: "01", note: "No verified labs yet" },
  { label: "CTF Challenges", value: stats.ctfChallenges, mark: "02", note: "No completed challenges recorded" },
  { label: "Write-ups", value: stats.writeUps, mark: "03", note: "No write-ups published yet" },
  { label: "Certificates", value: stats.certificates, mark: "04", note: "No credentials earned" },
  { label: "Rooms Completed", value: stats.roomsCompleted, mark: "05", note: "No rooms completed yet" }
].map(item => `
  <article class="stat-card dashboard-stat dashboard-stat--phase4">
    <div class="stat-card-top"><span class="stat-icon" aria-hidden="true">${{item.mark}</span><span class="badge badge--neutral trend-badge" aria-label="No trend data yet">NO TREND YET</span></div>
    <p class="stat-label">${{escapeHTML(item.label)}</p>
    <p class="stat-number" data-count-up="${{Number(item.value) || 0}">0</p>
    <p class="stat-foot"><span>${{escapeHTML(item.note)}</span><span class="stat-foot-mark" aria-hidden="true">—</span></p>
  </article>`
).join("");
const logRows = learningLog.map(item => {
  const statusClass = item.status.toLowerCase().replaceAll(" ", "-");
  return `
    <tr data-learning-log-row data-status="${{escapeHTML(item.status)}">
      <td><strong class="learning-log-topic">${{escapeHTML(item.topic)}</strong></td>
      <td><span class="learning-log-status learning-log-status--${{escapeHTML(statusClass)}">${{escapeHTML(item.status)}</span></td>
      <td>${{escapeHTML(item.level)}</td><td class="learning-log-notes">${{escapeHTML(item.notes)}</td>
    </tr>`;
}).join("");

export function render() {
  return `
    <section class="view-page dashboard-view" aria-labelledby="view-heading">
      <header class="view-heading-block dashboard-heading">
        <div><p class="view-eyebrow">WORKSPACE OVERVIEW / 002</p><h1 id="view-heading" tabindex="-1">Dashboard</h1><p class="view-intro">A factual snapshot of the learning journey. Every total stays at zero until completed work is verified.</p></div>
        <span class="dashboard-status"><span class="status-dot" aria-hidden="true"></span> LEARNING MODE</span>
      </header>
      <div class="stat-grid dashboard-stat-grid" aria-label="Verified learning totals">${{metricCards}</div>
      <div class="dashboard-chart-grid">
        <section class="hud-panel dashboard-chart-card" aria-labelledby="learning-activity-title">
          <div class="hud-panel-heading dashboard-chart-heading"><div><p class="view-eyebrow">ACTIVITY / 01</p><h2 id="learning-activity-title">Learning Activity</h2></div>
            <label class="chart-period-control"><span class="sr-only">Learning activity period</span><select data-chart-period="activity" aria-label="Learning activity period">${{PERIOD_OPTIONS}</select></label>
          </div>
          <div class="chart-legend"><span class="chart-legend-dot" aria-hidden="true"></span><span>LEARNING SESSIONS</span><span class="chart-empty-tag">EMPTY STATE / NOT DATA</span></div>
          ${{renderActivityChart()}
          <p class="chart-empty-label" data-period-label="activity" aria-live="polite">No data yet — I'm just starting · Weekly</p>
          <p class="chart-footnote">The ghost bars are visual placeholders, not recorded activity.</p>
        </section>
        <section class="hud-panel dashboard-chart-card" aria-labelledby="progress-over-time-title">
          <div class="hud-panel-heading dashboard-chart-heading"><div><p class="view-eyebrow">PROGRESS / 02</p><h2 id="progress-over-time-title">Progress Over Time</h2></div>
            <label class="chart-period-control"><span class="sr-only">Progress chart period</span><select data-chart-period="progress" aria-label="Progress chart period">${{PERIOD_OPTIONS.replace('value="Last Month"', 'value="Last Month" selected')}</select></label>
          </div>
          <div class="chart-legend"><span class="chart-legend-dot chart-legend-dot--line" aria-hidden="true"></span><span>VERIFIED MILESTONES</span><span class="chart-empty-tag">EMPTY STATE / NOT DATA</span></div>
          ${{renderProgressChart()}
          <p class="chart-empty-label" data-period-label="progress" aria-live="polite">No data yet — I'm just starting · Last Month</p>
          <p class="chart-footnote">A flat baseline is shown until real progress entries exist.</p>
        </section>
      </div>
      <section class="hud-panel dashboard-log-panel" aria-labelledby="learning-log-title">
        <div class="hud-panel-heading dashboard-log-heading">
          <div><p class="view-eyebrow">PERSONAL RECORD / 03</p><h2 id="learning-log-title">Learning Log</h2><p class="dashboard-log-intro">A short list of current study topics and future plans—not a record of earned credentials or completed labs.</p></div>
          <span class="view-code">${{learningLog.length.toString().padStart(2, "0")} TOPICS</span>
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
          <tbody data-learning-log-body>${{logRows}</tbody>
        </table></div>
        <div class="learning-log-footer"><p data-learning-log-count role="status" aria-live="polite">${{learningLog.length} of ${{learningLog.length} topics shown</p><p>All entries are local learning notes.</p></div>
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
    if (count) count.textContent = `${{visible} of ${{rows.length} topics shown`;
  }
  function onInput(event) { if (event.target.matches?.("[data-learning-log-search]")) filterRows(); }
  function onChange(event) {
    if (event.target.matches?.("[data-learning-log-filter]")) filterRows();
    if (event.target.matches?.("[data-chart-period]")) {
      const label = root.querySelector(`[data-period-label="${{event.target.dataset.chartPeriod}"]`);
      if (label) label.textContent = `No data yet — I'm just starting · ${{event.target.value}`;
    }
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
