# Phase 10 — Final Visual QA and Release Readiness

**Repository:** `ztrace054-x/my-portfolio`  
**Review branch:** `redesign/ztrace-premium-portfolio`  
**Base branch:** `main`  
**Exact application source commit rendered and performance-tested:** `aa74f412fbdde8d684d98eeb4946a53448c9da51`  
**Successful push workflow for that exact commit:** [Run 40095138101](https://github.com/ztrace054-x/my-portfolio/actions/runs/40095138101)  
**Successful pull-request workflow:** [Run 40095141609](https://github.com/ztrace054-x/my-portfolio/actions/runs/40095141609)  
**Rendered screenshots and JSON:** [Download visual QA artifact](https://github.com/ztrace054-x/my-portfolio/actions/runs/40095138101/artifacts/12560312485)  
**Lighthouse HTML/JSON reports:** [Download performance artifact](https://github.com/ztrace054-x/my-portfolio/actions/runs/40095138101/artifacts/12560372297)  
**Production deployment:** Not performed  
**PR #16:** Open, draft, not merged

## Final QA status

- Validation: **passed**.
- Actual rendered Chromium visual QA: **passed**.
- Lighthouse desktop and simulated-mobile reports: **generated**.
- Safe public preview deployment: **not created**; no authorized preview-hosting integration is configured/connected.
- Release recommendation: **keep PR #16 in draft; do not deploy to production yet**. Mobile lab LCP was 4.7 seconds in the latest run, and production-hosting behavior and field Core Web Vitals are unverified.

## Exact commit and evidence provenance

The branch push workflow `40095138101` checked out and tested the exact branch commit `aa74f412fbdde8d684d98eeb4946a53448c9da51`. The visual artifact's `visual-qa-report.json` independently records that exact `head_sha`. All three jobs—`validate`, `visual-qa`, and `performance-qa`—completed successfully.

The pull-request workflow `40095141609` also passed all three jobs. Because GitHub's `pull_request` event checks out a synthetic merge commit, the push workflow and its artifacts are the authoritative evidence for the exact branch-head commit.

## Rendered visual QA method and coverage

The GitHub Actions visual job checked out the redesign branch and served it from a local static preview. Chromium rendered the website; no concept mockup was substituted for rendered evidence, and the live production site was not used as the preview.

| Viewport | Routed views checked | Result |
| --- | ---: | --- |
| Desktop — 1440 × 900 | 11 | Pass |
| Tablet — 1024 × 768 | 11 | Pass |
| Mobile — 390 × 844 | 11 | Pass |
| Narrow mobile — 320 × 700 | 11 | Pass |
| **Total** | **44 route/viewport checks** | **Pass** |

The latest-source artifact contains 97 actual screenshots and a JSON report. Its summary records 0 automated issues, 0 local asset failures, and 0 horizontal-overflow failures.

The browser checks cover the intro and network globe, terminal visual, intro-to-workspace transition, sidebar/navigation, all 11 routes, top/bottom scroll states, active route, headings, image load and alt text, browser exceptions/console errors, failed local requests, horizontal overflow, mobile drawer open/close and route navigation, Gallery keyboard activation/ArrowRight/Escape/focus restoration, motion toggle, reduced-motion preference, narrow-mobile intro footer sizing, and Contact CTA contrast.

## Verified defects found and fixed

1. **Mobile sidebar drawer and navigation.** Corrected the drawer transform specificity and stacking order that allowed the sidebar/backdrop to intercept navigation.
2. **Contact CTA contrast.** Corrected the “Send email” foreground; measured contrast was 11.01:1 in Chromium.
3. **Narrow-mobile intro footer clipping.** Replaced the fixed-height behavior with a layout that accommodates wrapped text at 320px.
4. **Intro skip-button accessible name.** Removed an aria-label that did not include the visible “Skip intro” text.
5. **Gallery portrait underexposure.** Manual screenshot review found that the second portrait was almost entirely dark despite loading. A targeted brightness correction was committed; subsequent rendered evidence showed it visibly rendered.

No additional app-code change was made for performance after commit `aa74f412fbdde8d684d98eeb4946a53448c9da51`. The repeated Lighthouse results improved slightly, but that variation alone is not evidence of a code-level optimization.

## Automated checks and actual results

The latest successful branch push workflow [40095138101](https://github.com/ztrace054-x/my-portfolio/actions/runs/40095138101) completed all three jobs successfully:

- **`validate`:** JavaScript module syntax, foundation/data/design tokens, intro gate, workspace shell and routing, Profile/Dashboard, remaining views, Gallery/Contact/motion, SEO, internal links, accessibility references, contrast, assets, and interaction-state regression checks.
- **`visual-qa`:** rendered Playwright checks at all four viewports; 97 screenshots and a JSON report uploaded.
- **`performance-qa`:** desktop and simulated-mobile Lighthouse runs against the local static preview; HTML and JSON reports uploaded.

The latest pull-request workflow [40095141609](https://github.com/ztrace054-x/my-portfolio/actions/runs/40095141609) also completed all three jobs successfully.

## Latest Lighthouse measurements

Lighthouse **12.8.2** ran on the GitHub Actions Ubuntu runner with HeadlessChrome against `http://127.0.0.1:4173/`. Desktop used the desktop preset; mobile used Lighthouse's simulated-mobile configuration. These are lab measurements, not field Core Web Vitals or a live GitHub Pages performance test.

| Metric | Desktop | Mobile |
| --- | ---: | ---: |
| Performance score | 97 | 75 |
| Accessibility score | 100 | 100 |
| Best Practices score | 100 | 100 |
| SEO score | 100 | 100 |
| First Contentful Paint (FCP) | 0.8 s | 3.5 s |
| Largest Contentful Paint (LCP) | 1.1 s | 4.7 s |
| Cumulative Layout Shift (CLS) | 0.01 | 0 |
| Total Blocking Time (TBT) | 0 ms | 10 ms |
| Speed Index | 0.8 s | 3.5 s |

Repeated Lighthouse runs on unchanged application code vary: the latest run measured 97 desktop / 75 mobile and 4.7-second mobile LCP; the immediately prior run measured 98 / 79 and 4.2 seconds. This is run-to-run lab variability, not a code regression or improvement, because the intervening commit changed only this QA report.

### Performance limitations and optimization decision

- The latest mobile Performance score is 75 and mobile lab LCP is 4.7 seconds: a release caution. Across recent unchanged-code runs, mobile Performance varied from 75 to 79 and LCP from 4.2 to 4.7 seconds.
- The mobile LCP element is the intro's `ZTRACE` wordmark. Lighthouse attributes approximately 90% of the latest LCP time to render delay during the intro experience.
- Lighthouse flags render-blocking CSS, unused CSS, and image format/responsive sizing opportunities. Some CSS is deliberately available at first paint to avoid an unstyled or flashing intro/workspace. Splitting or deferring it could affect the visual transition; image conversion would require a separate visual regression pass.
- No isolated low-risk code optimization was justified in this final verification pass. The intro animation was not shortened solely to chase a lab score.
- The local Python static server does not reproduce GitHub Pages CDN compression, cache headers, or production network conditions. These lab results should not be treated as a production-hosted performance measurement.
- No field INP/Core Web Vitals, live-hosting performance, cross-browser matrix, or physical-device test was performed.

## Preview-hosting availability

The repository is a static HTML/CSS/JavaScript site. The existing workflow creates a **loopback-only** preview on the CI runner (`127.0.0.1:4173`) for automated tests. The repository contains no Vercel, Netlify, or Cloudflare Pages project configuration or preview-deployment workflow. No safe public preview URL was created during this QA pass. Creating one requires an authorized hosting integration/account connection; the production GitHub Pages site was not used as a workaround.

## Truthfulness and release safety

- The intro is a simulated visitor experience, not authentication.
- The globe and terminal are illustrative; no live scanner or security telemetry is claimed.
- Dashboard metrics remain empty until real records exist.
- Projects are limited to repository-supported evidence and remain marked In progress.
- Planned credentials are not represented as earned.
- Contact actions are direct links; no backend form submission is claimed.

At the time of the tested application-source commit, branch `redesign/ztrace-premium-portfolio` was 88 commits ahead of `main` and 0 commits behind. PR #16 targets `main`, remains a draft, and is not merged. No direct `main` edits, GitHub Pages deployment, DNS changes, or production-setting changes were made.

## Release recommendation

**The exact application-source commit `aa74f412fbdde8d684d98eeb4946a53448c9da51` passed validation, rendered Chromium QA, and Lighthouse performance QA.** The Gallery defect is fixed, and all 44 route/viewport checks passed.

**Do not approve production release yet.** Mobile lab LCP was 4.7 seconds in the latest run; production-hosting behavior and field Core Web Vitals remain unverified; no public preview host is currently connected. Keep PR #16 as a draft until those limitations are accepted or addressed.
