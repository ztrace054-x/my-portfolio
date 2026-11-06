# Phase 7 — Production QA Report

**Repository:** `ztrace054-x/my-portfolio`  
**QA branch:** `phase-7/production-qa`  
**Base:** `phase-6/cyber-noir-unification`  
**Current QA source commit:** `c4363d0a100ac53aff17e188c00da23b17d987d3`  
**Production deployment:** Not performed  
**Merge:** Not performed

## Executive status

**Release recommendation: HOLD — do not merge or deploy yet.**

The Phase 7 validation job passed on the current branch. The first expanded browser run successfully visited all 11 routes at all five requested viewports (55 route/viewport checks), captured 137 screenshots, found zero local asset failures and zero horizontal overflow failures, and exercised intro replay/skip, desktop/mobile navigation, certificate preview/download, Gallery keyboard controls, contact links/copy, and the Motion toggle.

That first expanded run also identified accessibility and test-synchronization issues. Scoped fixes were committed on this branch and a fresh complete run is in progress. Do not interpret the earlier failing browser run as final, or the fixes as passed until the latest run finishes.

Lighthouse 12.8.2 currently fails to produce a valid Performance category: both desktop and mobile traces report `NO_LCP`. A strict report validator intentionally fails rather than presenting fabricated performance scores. This remains a release blocker until valid LCP/performance results are obtained or the audit environment is corrected.

## Viewport and route coverage

| Requested viewport | Rendered route checks |
| --- | ---: |
| Desktop — 1440 × 900 | 11 |
| Laptop — 1280 × 800 | 11 |
| Tablet — 1024 × 768 | 11 |
| Mobile — 390 × 844 | 11 |
| Small mobile — 320 × 700 | 11 |
| **Total in first expanded run** | **55** |

The first run produced 137 screenshots. It reported no broken local image/resource references and no horizontal overflow at the tested viewport sizes. A fresh run is being executed after the accessibility and test-wait fixes.

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

The first expanded browser run recorded 19 issues:
- 9 serious Axe findings for scrollable regions not being keyboard reachable.
- 4 Profile-content assertions and 6 Project-content assertions caused by reading a route before its delayed render completed.

Scoped fixes committed on this branch:
1. `#app-view-root` is now keyboard focusable with `tabindex="0"`.
2. The Dashboard learning-log table scroller now has a region name and keyboard focus.
3. The Attack Surface radar heading was corrected from h3 to h2 to avoid a skipped heading level.
4. Profile/Projects browser checks now wait for the expected rendered content before asserting.
5. Axe scans are limited to representative Dashboard, Attack Surface, Certificates and Contact views at desktop and mobile, while all routes remain covered by the rendered viewport checks.

These changes require confirmation by the latest Playwright run.

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

The previous Phase 6 run had the same NO_LCP problem under Lighthouse 12.8.2. A strict checker now rejects missing category scores and missing FCP/LCP/CLS/TBT/Speed Index measurements. Accessibility, Best Practices and SEO scores must also be read from the current report artifacts after a valid run; no Phase 7 score is claimed here.

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
[Download first expanded Playwright artifact](https://github.com/ztrace054-x/my-portfolio/actions/runs/42158635331/artifacts/13475682855)

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

**Release decision:** keep the QA branch isolated. Do not merge, publish or deploy until these blockers are cleared and the owner approves.
