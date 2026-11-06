# Phase 7 — Production QA Report

**Repository:** `ztrace054-x/my-portfolio`  
**QA branch:** `phase-7/production-qa`  
**Base:** `phase-6/cyber-noir-unification`  
**Latest QA workflow commit:** `b763ff897929cc5857d3bb587cb251e90af079b3`  
**Production deployment:** Not performed  
**Merge:** Not performed

## Executive status

**Release recommendation: HOLD — do not merge or deploy yet.**

The latest completed Phase 7 workflow is [run #42159329548](https://github.com/ztrace054-x/my-portfolio/actions/runs/42159329548). The validation job passed. The Playwright job passed: all 11 routes at all five requested viewports (55 route/viewport checks), 137 screenshots, zero recorded issues, zero severe Axe violations across 22 accessibility audits, and successful intro replay/skip, desktop/mobile navigation, certificate preview/download, Gallery keyboard controls, contact links/copy, and Motion/reduced-motion checks.

The performance job failed. Lighthouse 12.8.2 did not produce a valid Performance category: both desktop and mobile traces report `NO_LCP`. The strict report validator correctly rejects the missing category score and metrics instead of presenting fabricated values. This remains a release blocker.

## Viewport and route coverage

| Requested viewport | Rendered route checks |
| --- | ---: |
| Desktop — 1440 × 900 | 11 |
| Laptop — 1280 × 800 | 11 |
| Tablet — 1024 × 768 | 11 |
| Mobile — 390 × 844 | 11 |
| Small mobile — 320 × 700 | 11 |
| **Total in first expanded run** | **55** |

The latest passing browser run produced 137 screenshots, reported zero test issues, and recorded no broken local image/resource references or horizontal overflow at the tested viewport sizes.

## Functionality covered

- Normal workspace entry and cinematic intro replay.
- Skip intro and complete the intro-to-workspace transition.
- Desktop route navigation and keyboard activation.
- Mobile drawer open/close and route navigation.
- All eleven routes and their expected content.
- Profile and repository-backed Projects content.
- Byte Capsule earned certificate record, preview dialog, original PNG decode, download filename and file payload.
- Gallery lightbox, ArrowLeft/ArrowRight, Escape, and focus restoration.
- Original email and social destinations; clipboard copy feedback and clipboard value.
- Motion toggle and system reduced-motion context.
- Browser console errors, page exceptions, failed local requests, image decode and alt text.
- Axe accessibility scans on desktop and mobile.

## Issues discovered and fixes committed

The earlier expanded run identified 19 issues, including nine serious Axe findings and delayed-render assertions. The fixes were committed and verified by the latest Playwright run: `issueCount: 0`, `severeAccessibilityViolations: 0`, and `accessibilityAudits: 22`.

Fixes include keyboard focus for the workspace scroll region, a named/focusable Dashboard learning-log region, corrected Attack Surface heading hierarchy, and waits for actual Profile/Projects route content.

## Static validation

The current branch validation job passed:
- JavaScript module syntax checks.
- Existing foundation, Phase 2, Phase 3, Phase 4, Phase 5, Phase 6, and interaction suites.
- SEO metadata, canonical URL, Open Graph/Twitter metadata, JSON-LD, sitemap, internal anchors, local HTML/CSS/JS references, image alt text and intrinsic dimensions.
- Contrast tokens, reduced-motion CSS, image/font file budgets.
- PostCSS parsing of 19 active stylesheets (2,593 CSS rules).
- Eight raster assets within configured size budgets.
- Byte Capsule source certificate SHA-256 integrity check.
- Five requested viewport definitions and Axe browser-audit integration.
- 20 existing deterministic interaction checks.

## Lighthouse

Pinned Lighthouse 12.8.2 runs against the local static preview completed the desktop and mobile navigation/trace steps, but the report validator rejected the output because both reports contain `LanternError: NO_LCP`. The Performance category score is therefore unavailable and is not reported as zero or as a pass.

The Phase 7 Lighthouse report artifacts are attached to [run #42159329548](https://github.com/ztrace054-x/my-portfolio/actions/runs/42159329548). The strict checker rejects missing category scores and missing FCP/LCP/CLS/TBT/Speed Index measurements. The report did not yield valid Performance, Accessibility, Best Practices or SEO category scores, so no Lighthouse score is claimed here.

## Certificate record and assets

The earned record is preserved without editing the original certificate:
- Ethical Hacking for Beginners — Certificate of Completion.
- Recipient: MD SAAD.
- Issuer: Byte Capsule.
- Program: 100 Days Challenge Live Online Training Program.
- Award date: 2026-11-01.
- Certificate ID: 7482ZWKQ.
- Signatory: Sakib Haque Zisan, CEO, Byte Capsule.
- Original asset: `assets/certificates/Md_Saad_Certificate.png`.
- Original source SHA-256: `0ab9dcc9d047ed8bd78fa61e2b6d000ae0784201ce0dc73c7db3f3095287fbfa`.

The original PNG is unchanged. Junior Penetration Tester, Senior Penetration Tester, CEH and OSCP remain Planned / Not earned yet. No new production image assets were created in Phase 7; the new files are QA scripts and documentation.

## Screenshots and machine-readable evidence

The latest completed visual artifact is available from the current run when upload finishes:
[GitHub Actions — Phase 7 visual screenshots and JSON](https://github.com/ztrace054-x/my-portfolio/actions/runs/42159052326)

The corresponding Lighthouse HTML/JSON reports are available here:
[GitHub Actions — Phase 7 Lighthouse reports](https://github.com/ztrace054-x/my-portfolio/actions/runs/42159052326)

The first expanded run artifact (137 screenshots and `visual-qa-report.json`) is available here:
[Earlier failed Playwright run artifact](https://github.com/ztrace054-x/my-portfolio/actions/runs/42158635331/artifacts/13475682855)

## Modified source/documentation files

- `index.html` — keyboard-focusable workspace scroll region.
- `js/views/dashboard.js` — keyboard-accessible learning-log scroller.
- `js/views/attack-surface.js` — corrected heading hierarchy.
- `tests/visual-qa.cjs` — five viewports, 55 route checks, interactions, screenshots, Axe audits.
- `tests/phase7-production-check.cjs` — CSS parse, image budget and certificate hash checks.
- `tests/lighthouse-report-check.cjs` — strict Lighthouse score/metric validation.
- `.github/workflows/quality.yml` — Phase 7 branch, pinned test tooling and new checks.
- `README.md` — current QA branch and run instructions.
- `RELEASE-NOTES.md` — Phase 7 implementation notes.
- `DESIGN-SYSTEM.md` — cyber-noir design reference.
- `CERTIFICATE-RECORD.md` — factual earned-certificate record.

## Remaining release blockers

1. Latest Playwright/Axe rerun must complete with no serious accessibility violations and no unexpected content/interaction failures.
2. Lighthouse must produce valid desktop and mobile LCP/performance metrics. Current `NO_LCP` output is invalid for a performance score.
3. Review the generated desktop and mobile screenshots visually, not just the automated summary.
4. Production-hosted behavior and real-user Core Web Vitals remain untested; CI uses a local static preview.

**Release decision:** keep the QA branch isolated. The visual and static checks pass, but Lighthouse performance validation fails with `NO_LCP`. Do not merge, publish or deploy until valid Lighthouse metrics are obtained and the owner approves.
