# ZTRACE Cyber-Noir Design System

## Visual direction
A premium cybersecurity learning workspace built around deep black surfaces, restrained crimson accents, metallic panels, and high-contrast editorial typography. The design should feel cinematic without hiding controls or reducing readability.

## Tokens
- Background: `#050505` / `#09090c`.
- Raised surfaces: `#111114`.
- Primary text: `#f5f5f5`.
- Secondary text: `#a6a6aa`.
- Crimson accent: `#e5091a`; hover accent: `#ff3947`.
- Typography: self-hosted Space Grotesk for display/body hierarchy and JetBrains Mono for technical labels.

## CSS ownership
- `css/cyber-noir.css`: shared crimson palette and base component styling.
- `css/phase-6-visual-unification.css`: workspace shell and all eleven routed sections.
- `css/phase-5.css` and `css/phase-6.css`: existing section structure and interaction-specific styles; the global layer overrides color/surface treatments without changing route markup.
- `css/tokens.css`: font faces, spacing, and shared design primitives.

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
