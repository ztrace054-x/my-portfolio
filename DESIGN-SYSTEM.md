# ZTRACE Editorial Cyber-Noir Design System

## Visual direction
A premium cybersecurity learning portfolio inspired by the supplied video reference: deep black surfaces, oversized condensed editorial typography, a restrained red-to-orange gradient, a cinematic personal portrait, and crisp mono labels. The optional workspace keeps its evidence-first cybersecurity UI. The design should feel expressive without hiding controls or reducing readability.

## Tokens
- Background: `#050505` / `#09090c`.
- Raised surfaces: `#101010` / `#171717`.
- Primary text: `#f5f5f5`.
- Secondary text: `#a6a6aa`.
- Primary accent: `#ff4b2d`; gradient range: `#ff8a54` to `#c92d1c`.
- Typography: Barlow Condensed for oversized display headlines, Space Grotesk for body copy, and JetBrains Mono for technical labels.

## CSS ownership
- `css/cyber-noir.css`: shared cyber-noir base tokens.
- `css/editorial-reference.css`: additive video-reference landing-page layout, orange-red palette, portrait composition, cards, and responsive refinements.
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
