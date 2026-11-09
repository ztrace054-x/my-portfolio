# ZTRACE Editorial Cyber-Noir Design System

## Visual direction
A premium cybersecurity learning portfolio inspired by the supplied video reference: deep black surfaces, oversized condensed editorial typography, a restrained red-to-orange gradient, a cinematic personal portrait, and crisp mono labels. The optional workspace keeps its evidence-first cybersecurity UI. The design should feel expressive without hiding controls or reducing readability.

## Tokens
The public-page palette is defined once in the editorial token group in `css/tokens.css` and mapped into the landing-page scope by `css/editorial-reference.css`.

| Role | Token / value |
| --- | --- |
| Background | `--editorial-bg: #070707`; deep background `#030303` |
| Surfaces | `#101010` and `#171717` |
| Primary / secondary / muted text | `#f5f2ee` / `#b8b1ab` / `#8f8983` |
| Main gradient | `#ff3b1f` → `#ff6b35` |
| Accent | `#ff4b2d` |
| Muted tag accents | Blue `#a9c9f2`, yellow `#e9cb86`, green `#9bd9ae`, orange `#ff9a75` |
| Display / body / mono | Barlow Condensed / Space Grotesk / JetBrains Mono |
| Spacing | Shared `--space-1` through `--space-8` scale |
| Radius | `--editorial-radius` and `--editorial-radius-pill` |

**Font pairing:** Barlow Condensed (600–900) gives the hero and section titles their condensed editorial weight; Space Grotesk (400–700) keeps paragraphs readable; JetBrains Mono is reserved for labels and terminal details. The live site loads Barlow Condensed asynchronously from Google Fonts and keeps Space Grotesk / JetBrains Mono self-hosted to avoid extra body-font requests.

Equivalent Google Fonts pairing, if remote fonts are preferred:
```html
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
```

## CSS ownership
- `css/cyber-noir.css`: shared cyber-noir base tokens.
- `css/editorial-reference.css`: additive video-reference landing-page layout, orange-red palette, portrait composition, cards, and responsive refinements.
- `css/phase-6-visual-unification.css`: workspace shell and all eleven routed sections.
- `css/phase-5.css` and `css/phase-6.css`: existing section structure and interaction-specific styles; the global layer overrides color/surface treatments without changing route markup.
- `css/tokens.css`: font faces, spacing, and the single central editorial token group (`--editorial-*`).
- `css/editorial-reference.css`: consumes the central editorial tokens; responsive layout and component rules stay additive.
- `css/dashboard-shell.css` and `css/workspace-shell.css`: deferred until the visitor opens the optional workspace.

## Section language
- Dashboard: metallic stat panels, crimson indicators, data only where verified.
- Profile: editorial identity and natural portrait treatment.
- Projects: dark metal cards, evidence-first descriptions.
- Attack Surface: simulated topology/radar only; no real scanning.
- Skill Progress: truthful learning status and progress.
- Learning Path: connected milestones.
- Write-ups: terminal/editorial learning journal; no fabricated published work.
- Automation: planned-work state, not fake running jobs.
- Certificates: original earned certificate retained; future qualifications marked planned.
- Gallery: local photographs, accessible dialog viewer.
- Contact: direct email and original public profile destinations.

## Accessibility and motion
- Visible keyboard focus for links and controls.
- Touch targets and responsive navigation retained.
- Gallery and certificate dialogs support keyboard close and focus return.
- System `prefers-reduced-motion` and the workspace Motion toggle must be respected.
- Red glow, grain, grid and scan details are decorative; never use them as the only indicator of state.
- Keep normal body text readable and verify contrast in browser; target WCAG 2.1 AA.

## QA
See `PHASE-7-PRODUCTION-QA.md` for tested viewport evidence, axe results, CSS parsing, asset checks and Lighthouse measurements. CI must fail on missing Lighthouse scores/metrics rather than printing a false zero or silently passing.
