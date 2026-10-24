# Phase 10 — Final Visual QA and Release Readiness

**Repository:** `ztrace054-x/my-portfolio`  
**Review branch:** `redesign/ztrace-premium-portfolio`  
**Base branch:** `main`  
**Source commit visually and technically tested:** `9b189b08a6ca8af8e833ee9405035b300f4a6e35`  
**Push workflow:** [Run 40093984415](https://github.com/ztrace054-x/my-portfolio/actions/runs/40093984415)  
**Pull-request workflow:** [Run 40093988294 — passed](https://github.com/ztrace054-x/my-portfolio/actions/runs/40093988294)  
**Rendered screenshots and JSON:** [Download visual QA artifact](https://github.com/ztrace054-x/my-portfolio/actions/runs/40093988294/artifacts/12559928357)  
**Lighthouse HTML/JSON reports:** [Download performance artifact](https://github.com/ztrace054-x/my-portfolio/actions/runs/40093988294/artifacts/12559872262)  
**Production deployment:** Not performed  
**PR #16:** Open, draft, not merged

## Final QA status

- Automated regression checks: **passed**.
- Actual rendered Chromium QA: **passed** after the verified Gallery image correction.
- Desktop and mobile Lighthouse lab reports: **generated**.
- Release recommendation: **keep PR #16 in draft; do not deploy yet**. Mobile lab LCP remains 4.4 seconds and the test does not represent GitHub Pages production delivery or field Core Web Vitals.

## Rendered visual QA method and coverage

The GitHub Actions visual job checked out the redesign branch and served it from a local static preview. Chromium—not a generated concept image and not the live production site—rendered the branch.

| Viewport | Routed views checked | Result |
| --- | ---: | --- |
| Desktop — 1440 × 900 | 11 | Pass |
| Tablet — 1024 × 768 | 11 | Pass |
| Mobile — 390 × 844 | 11 | Pass |
| Narrow mobile — 320 × 700 | 11 | Pass |
| **Total** | **44 route/viewport checks** | **Pass** |

The current-source artifact contains 97 actual screenshots, including intro, ready state, transition, all 11 routes, scroll states, mobile drawer, and reduced-motion state. The accompanying JSON reports 0 recorded automated issues, 0 failed local assets, and 0 horizontal-overflow failures.

### Manual screenshot review

I reviewed actual captured screenshots, including the desktop Gallery view. That review found an additional issue that the automated image-load check had not identified: the second Gallery portrait loaded successfully but appeared almost entirely dark. This was a genuine visual defect despite its successful network/image-load status.

A targeted brightness correction was committed on the existing redesign branch. The subsequent rendered screenshot shows the second portrait visibly rendered, and the visual-qa job passed on source commit `9b189b08a6ca8af8e833ee9405035b300f4a6e35`.

The following were also checked by the rendered-browser automation: intro and network globe, terminal visual, intro-to-workspace transition, navigation/sidebar, all 11 routes, top/bottom scroll states, active route, heading text, image load state and alt text, browser JavaScript exceptions/console errors, failed local requests, horizontal overflow, mobile drawer open/close and a real route-link click, gallery keyboard activation/ArrowRight/Escape/focus restoration, motion toggle, reduced-motion preference, narrow-mobile intro footer sizing, and the visible Contact CTA contrast.

## Verified defects and fixes

1. **Mobile sidebar drawer and navigation.** The drawer transform specificity and stacking order allowed the mobile sidebar/backdrop to intercept navigation. Explicit state selectors and corrected stacking order were applied and checked with actual drawer and route-link interactions.
2. **Contact CTA contrast.** The “Send email” foreground blended into the mint button background. The CTA foreground was corrected; the Chromium contrast measurement recorded 11.01:1.
3. **Narrow-mobile intro footer clipping.** The fixed-height footer could not accommodate wrapped text at 320px. The footer now has automatic height, readable mobile text, and bottom spacing.
4. **Intro skip button accessible name.** The explicit aria-label did not include the visible “Skip intro” label. It was removed so the accessible name follows the visible label.
5. **Gallery portrait underexposure.** Manual review of the actual rendered screenshot found that the second portrait was nearly invisible despite loading successfully. A targeted CSS brightness correction was added and verified in the subsequent screenshot.

The automated visual report recorded no remaining detectable issues after these fixes. This does not establish that every browser, device, or assistive technology has been tested.

## Automated checks and actual results

The latest successful pull-request workflow [40093988294](https://github.com/ztrace054-x/my-portfolio/actions/runs/40093988294) completed all three jobs successfully:

- `validate`: JavaScript syntax, foundation/data/design tokens, intro gate, workspace shell and 11 routes, Profile/Dashboard, remaining views, Gallery/Contact/motion, SEO, internal links, accessibility references, contrast, assets, and interaction-state regression checks.
- `visual-qa`: rendered Playwright checks at all four viewport sizes; screenshots and JSON report uploaded.
- `performance-qa`: desktop and simulated-mobile Lighthouse runs against a local static preview; HTML and JSON reports uploaded.

The latest push workflow [40093984415](https://github.com/ztrace054-x/my-portfolio/actions/runs/40093984415) has the same tested source commit; its validation and visual jobs passed. Its performance job was still running at the time of this report update, so the completed pull-request workflow is the source of the reported current performance measurements.

## Lighthouse measurements

Lighthouse **12.8.2** ran in GitHub Actions on Ubuntu with HeadlessChrome against the local static preview. Desktop used the desktop preset; mobile used Lighthouse's default simulated-mobile configuration. These are repeatable **lab measurements**, not field Core Web Vitals or a live GitHub Pages test.

| Metric | Desktop | Mobile |
| --- | ---: | ---: |
| Performance score | 97 | 78 |
| Accessibility score | 100 | 100 |
| Best Practices score | 100 | 100 |
| SEO score | 100 | 100 |
| First Contentful Paint (FCP) | 0.8 s | 3.4 s |
| Largest Contentful Paint (LCP) | 1.1 s | 4.4 s |
| Cumulative Layout Shift (CLS) | 0.01 | 0 |
| Total Blocking Time (TBT) | 0 ms | 0 ms |
| Speed Index | 0.8 s | 3.4 s |

### Performance limitations and remaining work

- Mobile Performance is 78 and mobile lab LCP is 4.4 seconds. This is improved compared with earlier runs (75–76 and 4.7–4.8 seconds) but remains a release caution.
- The local Python static server does not reproduce GitHub Pages CDN compression, cache headers, or production network conditions. Lighthouse delivery recommendations therefore need to be rechecked against a safe hosting-equivalent preview.
- Render-blocking CSS, unused CSS, and image sizing/format optimization remain potential improvements.
- No field INP, field Core Web Vitals, or production-hosting performance was measured.
- Chromium was used in automation; no other browser or physical device was tested.

## Truthfulness and release safety

- The intro is a simulated visitor experience, not authentication.
- The globe and terminal are illustrative; no live scanner or security telemetry is claimed.
- Dashboard metrics remain empty until real records exist.
- Projects are limited to repository-supported evidence and remain marked In progress.
- Planned credentials are not represented as earned.
- Contact actions are direct links; no backend form submission is claimed.

The redesign remains isolated on `redesign/ztrace-premium-portfolio`. At the time of this review, the branch was 86 commits ahead of `main` and 0 commits behind; PR #16 targeted `main`, remained a draft, and was not merged. No direct `main` edits, GitHub Pages deployment, or production-setting changes were made.

## Release recommendation

**Rendered visual QA and automated regression checks passed on the tested redesign commit.** The underexposed Gallery portrait was found by manual screenshot review and corrected; the new screenshot confirms that correction.

**Do not approve production release yet.** Mobile lab LCP is still 4.4 seconds, production-hosting behavior and field Core Web Vitals are unverified, and cross-browser/physical-device review was not performed. Keep PR #16 as a draft until those release limitations are accepted or addressed.
