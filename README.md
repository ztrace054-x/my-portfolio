# ZTRACE — Security is a practice.

**Current production website (unchanged during this redesign):** https://ztrace054-x.github.io/my-portfolio/  
**Current QA branch:** `phase-7/production-qa` (not merged or deployed)

A static, client-side cybersecurity learning portfolio for Md Saad (ZTRACE), a CSE student at the beginning of a cybersecurity learning journey. The introductory experience leads into a hash-routed workspace. The project uses semantic HTML, CSS, and vanilla JavaScript; there is no backend, real authentication, analytics, or live security telemetry.

The design direction uses deep black, crimson red, Space Grotesk, JetBrains Mono, an illustrative network globe, and a restrained terminal motif. The interface is English-only and aims to keep project claims, learning states, and credentials evidence-based.

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
| `css/tokens.css` | Shared color, typography, and spacing tokens |
| `css/premium-redesign.css` | Additive premium design layer and responsive refinements |
| `css/dashboard-shell.css` | Dashboard layout, sidebar, responsive navigation, and workspace surfaces |
| `css/phase-2-gate.css` | Intro visual and workspace transition |
| `css/phase-5.css`, `css/phase-6.css` | Learning views, Gallery/Contact, and interaction polish |
| `css/cyber-noir.css` | Central crimson tokens and cyber-noir palette |
| `css/phase-6-visual-unification.css` | Global crimson visual unification across all workspace routes |
| `css/phantom-signal.css`, `css/phantom-signal-cinematic-v2.css`, `css/phantom-signal-cinematic-v3.css` | Phantom Signal visitor intro; v3 provides the focused responsive composition and restrained cinematic motion |
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

## Redesign release boundary

All Phase 7 QA and any scoped fixes are kept on `phase-7/production-qa`. Do not push directly to `main`, merge the redesign PR, or deploy until the owner explicitly approves the completed review.
