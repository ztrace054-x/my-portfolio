# ZTRACE — Security is a practice.

**Production website:** https://ztrace054-x.github.io/my-portfolio/  
**Deployment target:** GitHub Pages from `main`; approved changes go live after merge and the Pages refresh.

A static, client-side cybersecurity learning portfolio for Md Saad (ZTRACE), a CSE student at the beginning of a cybersecurity learning journey. The cinematic introduction hands visitors to the editorial portfolio landing page; the optional hash-routed learning workspace opens when a visitor chooses **Open workspace**. The project uses semantic HTML, CSS, and vanilla JavaScript; there is no backend, real authentication, analytics, or live security telemetry.

The landing-page design follows a dark editorial neo-brutalist direction inspired by the supplied portfolio video: near-black surfaces, a restrained red-to-orange gradient, oversized Barlow Condensed typography, Space Grotesk body copy, JetBrains Mono labels, and an original personal portrait. The optional workspace retains its evidence-first cybersecurity tools and routes, with the accent palette unified to the new orange-red direction. The interface is English-only and aims to keep project claims, learning states, and credentials evidence-based.

## Workspace sections

- **Profile** — Md Saad's CSE student identity, beginner cybersecurity journey, course record, learning philosophy, future goals, and existing public links
- **Dashboard** — honest zero-state metrics, useful shortcuts, and explicit empty states until records exist
- **Projects** — repository-backed project evidence with an explicit in-progress status
- **Attack Surface** — educational illustration, not a real scanner
- **Skill Progress** — current learning topics and recorded status
- **Learning Path** — roadmap and next steps
- **Write-ups** — an empty published-notes state and a planned authorized lab journal template
- **Automation** — learning concepts and planned work; no completed scripts are fabricated
- **Certificates** — planned credentials are distinguished from earned credentials
- **Gallery** — three existing personal portraits with keyboard-accessible lightbox controls
- **Contact** — existing GitHub, TryHackMe, ZeroDayTest, Instagram, and email actions

## Architecture

| Path | Purpose |
| --- | --- |
| `index.html` | SEO metadata, progressive fallback content, intro, sidebar, and workspace markup |
| `js/phase2-gate.js` | Simulated intro and workspace handoff; **not** a login or security boundary |
| `js/dashboard-shell.js` | Workspace activation, hash routing integration, panels, sidebar, and view lifecycle |
| `js/router.js` | Hash-based dashboard navigation |
| `js/motion.js` | Shared motion controller, reduced-motion and visibility handling |
| `js/workspace-motion.js` | Dashboard-specific motion polish |
| `js/views/` | Profile, dashboard, Projects, learning views, Gallery, Contact, and certificates |
| `js/data/` | Profile, project evidence, learning records, links, roadmap, and metric data |
| `css/tokens.css` | Shared color, typography, and spacing tokens, including the central editorial palette |
| `css/premium-redesign.css` | Additive premium design layer and responsive refinements |
| `css/dashboard-shell.css` | Dashboard layout, sidebar, responsive navigation, and workspace surfaces; deferred until the workspace is opened |
| `css/editorial-reference.css` | Additive video-reference landing-page design layer and responsive editorial components; consumes the central `--editorial-*` tokens |
| `css/phase-2-gate.css` | Intro visual and workspace transition |
| `css/phase-5.css`, `css/phase-6.css` | Learning views, Gallery/Contact, and interaction polish |
| `css/cyber-noir.css` | Central crimson tokens and cyber-noir palette |
| `css/phase-6-visual-unification.css` | Global crimson visual unification across all workspace routes |
| `css/phantom-signal.css`, `css/phantom-signal-cinematic-v2.css`, `css/phantom-signal-cinematic-v3.css` | Phantom Signal visitor intro; v3 provides the focused responsive composition and restrained cinematic motion |
| `js/main.js` | Loads the dashboard module and workspace-only styles on demand, after a visitor opens a `#/` route |
| `tests/` | Foundation, route, view, accessibility-state, interaction, and SEO/link checks |
| `.github/workflows/quality.yml` | JavaScript syntax and regression checks for the redesign and established phases |

## Validation

See [Phase 7 Production QA](PHASE-7-PRODUCTION-QA.md) for the current viewport matrix, browser interactions, accessibility, CSS/asset checks, Lighthouse results, and release recommendation.

The quality workflow runs JavaScript module syntax checks, foundation/data checks, intro checks, shell/routing checks, dashboard/profile checks, remaining-view checks, Gallery/Contact/motion checks, static SEO/link/accessibility/asset checks, and interaction-state tests.

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
node tests/phase7-production-check.cjs
node --experimental-vm-modules tests/interaction-check.cjs
```

## Truthfulness and limitations

- The intro is a simulated visual experience and does not authenticate visitors.
- The globe and terminal are illustrative; the site does not run scans or measure live infrastructure.
- Dashboard metrics remain at verified zero-state values until real records exist. Decorative ghost charts and fabricated unread counts are not used.
- Project and lab claims must be backed by actual source, screenshots, and reproducible evidence.
- Planned credentials are not represented as earned certificates.
- The Contact section opens direct email/profile links; it does not collect form submissions or send data to a server.
- GitHub Pages serves a static frontend only.

## Release and deployment

The owner has approved this redesign for release. Merge the review branch into `main` only after the complete CI suite passes; GitHub Pages serves the production site from `main`. The `live-deployment-qa` job then smoke-tests the actual deployed site. Do not push directly to `main` or bypass failing checks.
