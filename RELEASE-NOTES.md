# Cinematic portfolio release — 2026-10-16

## Changes

- Rebuilt the hero around SAAD., CYBERSECURITY / JOURNEY, the original beginner message, and a Canvas2D network globe with subtle pointer rotation, connected nodes, curved routes, and simulated packets.
- Added a bounded 7.6-second fictional intro: boot messages, seven nodes, recoverable interruption, a deliberate 47%→46% recalibration, identity verification, and access granted. Skip, keyboard escape, repeat-session bypass, reduced motion, and a fail-safe are included.
- Moved the original profile terminal directly after the hero beside the original golden-light portrait. Added a three-command reveal and retained every original social URL.
- Refined typography, spacing, HUD details, photo treatment, section transitions, mobile layouts, and keyboard focus states. Used two existing self-hosted fonts.
- Preserved Home, About, Journey, Gallery, Contact, all three portraits, course information, two-photo gallery controls, mail links, clipboard fallback, and four explicitly unearned future credentials.
- Removed third-party animation libraries from the active loading path. Native scrolling, native dialogs, Web Animations, IntersectionObserver and one frame clock handle optional effects.
- Replaced outdated interaction tests and documentation. Legacy root-level source copies remain unloaded and intact.

## Checks completed before publishing

- [x] JavaScript syntax for all files in the active `js/` directory.
- [x] Twenty deterministic interaction checks, including normal/skip/replay intro, reduced motion, blocked storage, fail-safe, hidden-tab clock, terminal keyboard access, clipboard failure, gallery navigation and overlay release.
- [x] Unique HTML IDs, all local file references, module imports, CSS asset paths, and in-page navigation targets.
- [x] All original link destinations preserved; five section IDs and four unearned credential labels retained.
- [x] Existing portrait and font files preserved; explicit image dimensions retained.
- [x] Static HTML fallback and the absence of external runtime dependency requests reviewed.

## Browser verification after deployment

- [x] Public GitHub Pages URL loaded successfully and displayed the expected portfolio title.
- [x] Cinematic intro appeared; the visible Skip Intro control dismissed it and restored access to the page.
- [x] Hero title and animated Canvas2D network globe rendered.
- [x] Portrait and identity terminal appeared immediately after the hero; gallery portraits loaded without broken images.
- [x] About, Journey, Gallery, and Contact navigation links reached their matching sections.
- [x] Mobile viewport (390 × 844) checked; the hamburger menu opened and exposed all five navigation links.
- [x] No visible horizontal scrollbar, blank sections, JavaScript runtime errors, unhandled rejections, or console errors were observed during the tested browser session.
- [x] GitHub, TryHackMe, ZeroDay, Instagram, and email links were present with the original destinations.

## Assumptions and limits

- The brief mentioned three screenshots, but none were attached. The existing live site, original assets, and written final brief were used as the visual/content baseline.
- All security language and telemetry are explicitly decorative; there is no backend or real network-security functionality.
- The original ZeroDayTest link points to a dashboard profile and may require the visitor to sign in.
- Responsive emulation cannot guarantee every physical phone or browser. Render targets are not a guaranteed device-independent FPS result.
- Browser checks covered a desktop session and a 390 × 844 mobile viewport; all physical devices, keyboard/screen-reader combinations, Lighthouse scores, and guaranteed frame rates were not independently measured.
- Motion-off is also enforced by system reduced-motion settings; the control cannot override an OS preference.
- GitHub Pages may briefly serve a cached prior revision after a successful deployment.
