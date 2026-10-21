# ZTRACE — Cybersecurity Learning Dashboard

**Live website:** https://ztrace054-x.github.io/my-portfolio/

A static, client-side cybersecurity learning portfolio and dashboard for Saad. The site transitions from a simulated intro/visitor gate into a routed workspace. It uses vanilla JavaScript, HTML and CSS; there is no backend, real authentication, analytics, or live security telemetry.

## Dashboard sections

- **Profile** — learning identity and profile links
- **Dashboard** — learning overview and honest progress data
- **Attack Surface** — introductory learning view; not a real scanner
- **Skill Progress** — current learning topics
- **Learning Path** — roadmap and next steps
- **Write-ups** — learning notes and planned practice
- **Automation** — learning concepts and planned work
- **Certificates** — earned/goal states clearly distinguished
- **Gallery** — three existing personal portraits with an accessible lightbox
- **Contact** — existing GitHub, TryHackMe, ZeroDayTest, Instagram and email actions

## Architecture

| Path | Purpose |
| --- | --- |
| `index.html` | SEO metadata, original landing content, intro gate and dashboard shell markup |
| `js/phase2-gate.js` | Simulated intro and visitor handoff; **not** a real login or security boundary |
| `js/dashboard-shell.js` | Workspace activation, route rendering, sidebar, panels and view lifecycle |
| `js/router.js` | Hash-based dashboard navigation |
| `js/motion.js` | Shared motion controller, reduced-motion and visibility handling |
| `js/workspace-motion.js` | Dashboard-specific motion polish |
| `js/views/` | Profile, dashboard, Phase 5 learning views, Gallery and Contact |
| `js/data/` | Honest profile, learning, links, roadmap and metric data |
| `css/tokens.css` | Shared color, typography and spacing tokens |
| `css/dashboard-shell.css` | Dashboard layout, sidebar, responsive navigation and workspace surfaces |
| `css/phase-2-gate.css` | Simulated intro/access transition |
| `css/phase-5.css`, `css/phase-6.css` | Learning views, Gallery/Contact and interaction polish |
| `tests/` | Foundation, phase-specific, accessibility-state, interaction and SEO/link checks |
| `.github/workflows/quality.yml` | JavaScript syntax and regression checks for Phases 2–6 |

## Validation

The quality workflow runs JavaScript module syntax checks, foundation/data checks, Phase 2 gate tests, Phase 3 shell tests, Phase 4 view tests, Phase 5 regression checks, Phase 6 Gallery/Contact/motion checks, static SEO/link/accessibility/asset checks, and interaction-state tests.

Run the same checks locally with Node.js 20:

```bash
find js -type f -name '*.js' -print0 | while IFS= read -r -d '' file; do
  node --input-type=module --check < "$file"
done
node tests/foundation-check.cjs
node tests/phase2-gate-check.cjs
node --experimental-vm-modules tests/phase3-shell-check.cjs
node --experimental-vm-modules tests/phase4-views-check.cjs
node --experimental-vm-modules tests/phase5-views-check.cjs
node --experimental-vm-modules tests/phase6-views-check.cjs
node tests/qa-check.cjs
node --experimental-vm-modules tests/interaction-check.cjs
```

## Important limitations

- The intro/access animation is decorative and does not authenticate visitors.
- Security-themed charts, network visuals and counters are presentation-only; the site does not run scans or measure live infrastructure.
- Learning and credential states must remain truthful. Do not present planned certificates or projects as earned/completed.
- The Contact section does not collect submissions or send data to a server.
- GitHub Pages serves a static frontend only.
