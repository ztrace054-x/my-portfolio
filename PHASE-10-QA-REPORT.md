# Phase 10 — Final Visual QA and Release Readiness

**Repository:** ztrace054-x/my-portfolio  
**Review branch:** redesign/ztrace-premium-portfolio  
**Base branch:** main  
**Source commit tested:** 2fbae987978372e5e1e7220ccba1948ea7ca5284  
**Final source CI:** [Run 40089944033 — passed](https://github.com/ztrace054-x/my-portfolio/actions/runs/40089944033)  
**PR validation:** [Run 40089948006 — passed](https://github.com/ztrace054-x/my-portfolio/actions/runs/40089948006)  
**Visual evidence:** [Download 97 Chromium screenshots and the JSON report](https://github.com/ztrace054-x/my-portfolio/actions/runs/40089944033/artifacts/12558711800)  
**Lighthouse reports:** [Download desktop and mobile HTML/JSON reports](https://github.com/ztrace054-x/my-portfolio/actions/runs/40089944033/artifacts/12558731879)  
**Production deployment:** Not performed  
**Merge:** Not performed

## Final status

- Automated regression suite: passed.
- Rendered Playwright QA: passed with 0 recorded issues.
- Lighthouse reports: generated for desktop and mobile.
- Release decision: **not yet production-ready** because the mobile Lighthouse performance score is 75 and lab LCP is 4.8 seconds; hosting-level performance and field Core Web Vitals have not been verified.

## Actual rendered visual QA

A local static preview was served on the GitHub Actions runner. Chromium rendered the redesign without deploying it to GitHub Pages.

| Viewport | Routed views checked | Result |
| --- | ---: | --- |
| Desktop, 1440 × 900 | 11 | Pass |
| Tablet, 1024 × 768 | 11 | Pass |
| Mobile, 390 × 844 | 11 | Pass |
| Narrow mobile, 320 × 700 | 11 | Pass |
| **Total** | **44 route/viewport checks** | **Pass** |

The run captured 97 actual screenshots, including the intro, intro-ready state, transition, all 11 routes, scroll-bottom states where applicable, mobile drawer state, and reduced-motion screenshots. The screenshots are in the visual evidence artifact linked above.

Checks completed in the rendered browser:

- Intro, network globe, terminal, intro-to-workspace transition, and reduced-motion mode.
- Sidebar and navigation at all four viewport sizes.
- All 11 routes: Profile, Dashboard, Projects, Attack Surface, Skill Progress, Learning Path, Write-ups, Automation, Certificates, Gallery, and Contact.
- Top and bottom scroll states for views with overflowable content.
- Document and active-view horizontal overflow.
- Browser JavaScript exceptions and console errors.
- Failed local requests, HTTP asset errors, and broken images.
- Image alternative text, route headings, and current navigation state.
- Mobile drawer open/close and a real click on a route link.
- Gallery keyboard activation, ArrowRight navigation, Escape close, and focus restoration.
- Motion toggle and a browser context with prefers-reduced-motion enabled.
- Mobile intro font sizes, footer clipping, and the visible Send email CTA contrast.

Final visual report: 4 viewport configurations, 44 route checks, 97 screenshots, 0 recorded issues, 0 failed local assets, and 0 horizontal-overflow failures.

## Verified defects found and fixed

1. **Mobile sidebar initially visible / navigation click interception.** A more-specific workspace entrance transform overrode the mobile drawer's off-canvas transform, and the backdrop could cover the sidebar. The redesign branch now uses explicit state selectors and corrected stacking order. The drawer opens on request, receives pointer input, and closes after navigation.
2. **Contact CTA label invisible.** A generic link-color rule overrode the primary button's dark foreground, making “Send email” blend into its mint background. The primary CTA now uses a dark foreground; measured text contrast is 11.01:1 in Chromium.
3. **Narrow-mobile intro footer clipped.** The fixed 28px footer row could not contain wrapped text at 320px. The mobile footer now uses an automatic row height, readable 12px HUD text, and bottom spacing. The visual QA test checks for footer overflow.
4. **Intro skip accessible-name mismatch.** The explicit aria-label did not include the visible “Skip intro” text. It was removed so the button's accessible name is derived from its visible label.

These fixes were committed to the existing redesign branch only. The final visual run on the tested source commit passed.

## Automated regression checks

The passing validation job ran on Node.js 20 and covered:

- JavaScript module syntax.
- Foundation, required-path, design-token, component, data-integrity, and styleguide checks.
- Intro startup, reduced-motion, and no-auth assertions.
- Workspace shell and all 11 hash-routed views.
- Profile and Dashboard behavior, empty states, shortcuts, filters, and cleanup.
- Projects, learning views, planned write-up/certificate states, Gallery, Contact, and motion.
- Static SEO, internal links, accessibility references, contrast, assets, and interaction-state regressions.

Both the push CI and pull-request validation passed on the tested source commit. The PR remains a draft.

## Lighthouse measurements

Lighthouse 12.8.2 ran in GitHub Actions on Ubuntu against the local static preview using HeadlessChrome 155.0.0.0. The desktop report used the desktop preset; the mobile report used Lighthouse's default simulated-mobile configuration. These are **lab measurements**, not field Core Web Vitals.

| Metric | Desktop | Mobile |
| --- | ---: | ---: |
| Performance score | 97 | 75 |
| Accessibility score | 100 | 100 |
| Best Practices score | 100 | 100 |
| SEO score | 100 | 100 |
| First Contentful Paint (FCP) | 0.8 s | 3.6 s |
| Largest Contentful Paint (LCP) | 1.1 s | 4.8 s |
| Cumulative Layout Shift (CLS) | 0.01 | 0 |
| Total Blocking Time (TBT) | 30 ms | 0 ms |
| Speed Index | 0.9 s | 3.6 s |
| Mobile text-size audit | N/A | 100% legible text |
| Color-contrast audit | Pass | Pass |

### Performance limitations

- The mobile performance score of 75 and LCP of 4.8 seconds are a **release caution**, not a passing performance target.
- The local Python static server does not provide production-like text compression or long-lived cache headers. Lighthouse therefore reports compression and cache-lifetime opportunities that are not a direct measurement of GitHub Pages CDN behavior.
- Lighthouse also reports render-blocking CSS, unused CSS, and image sizing/format optimization opportunities. These remain performance work to consider before production release.
- No real-user field data, INP, or field Core Web Vitals were collected. No Lighthouse result from the live GitHub Pages site was claimed.
- No browser other than Chromium and no physical device were tested.

## Truthfulness and release safety

- The intro is a simulated visitor experience, not authentication.
- The globe and terminal are illustrative; no live scanner or security telemetry is claimed.
- Dashboard metrics remain empty until real evidence exists.
- The Projects page lists the actual portfolio repository as In progress.
- Planned credentials are not represented as earned.
- Contact actions are direct links; no backend form submission is claimed.

The redesign remains on redesign/ztrace-premium-portfolio. The default branch main was not modified directly, PR #16 was not merged, and GitHub Pages or production settings were not changed. No production deployment was performed.

## Release recommendation

**Visual and functional checks passed in headless Chromium at the four requested viewports. Automated regressions and Lighthouse accessibility, best-practices, and SEO categories passed.**

**Do not approve production release yet.** Review the mobile performance result (75 / 4.8s LCP), assess CSS delivery and image optimization, and measure performance in a safe hosting-equivalent preview before merging or deploying. A live-site comparison and field Core Web Vitals remain unverified.
