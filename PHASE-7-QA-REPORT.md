# Phase 7 — Final quality assurance report

**Date:** 2026-10-21  
**Repository:** [ztrace054-x/my-portfolio](https://github.com/ztrace054-x/my-portfolio)  
**Release branch:** `main` (squash-merged from `mega-update`)  
**Pull request:** [#14 — Phase 7 final quality pass](https://github.com/ztrace054-x/my-portfolio/pull/14)  
**Release state:** Merged and deployed successfully to GitHub Pages.
**Live website:** https://ztrace054-x.github.io/my-portfolio/

## Result

The final GitHub Actions `Portfolio quality checks` workflow passed on production commit `5f440b6dd8c5fd91c6c41a9dc43fb573f61c386b` ([run 39582280601](https://github.com/ztrace054-x/my-portfolio/actions/runs/39582280601)). The GitHub Pages deployment also succeeded for the same commit ([deployment run 39582279451](https://github.com/ztrace054-x/my-portfolio/actions/runs/39582279451)). Static checks, interaction tests, and real-browser checks passed at all six tested widths, including 320px. Screenshot review exposed a keyboard-focus overlap between the skip link and Motion control at 320px; the skip link is now compacted at widths up to 360px while retaining a 44px minimum height, and the browser suite asserts that they do not overlap.

## Responsive browser coverage

Chromium ran the site over local HTTP at all required viewport widths:

| Viewport | Result | Key checks |
| ---: | --- | --- |
| 1920 px | PASS | No horizontal overflow; desktop navigation; gallery, clipboard, motion controls |
| 1366 px | PASS | No horizontal overflow; background grid contained within viewport |
| 1024 px | PASS | Desktop navigation and three-column workbench layout |
| 768 px | PASS | Mobile drawer, keyboard close/focus return, responsive workbench |
| 390 px | PASS | Mobile drawer, single-column workbench, touch targets |
| 320 px | PASS | Extra-narrow stress case; skip link and Motion control do not overlap; drawer, gallery, and touch targets |

The browser run reported no uncaught JavaScript errors and no failed local asset requests.

## Issues found and resolved

1. **Desktop navigation target was too short.** The Home link rendered at 40 px high. The final stylesheet now enforces a 44 px minimum touch target.
2. **Hero grid caused a narrow-desktop overflow.** At 1366 px, its background bleed extended 14 px beyond the viewport. The grid inset is now capped to the page gutter; the browser check passes with no horizontal scrolling.
3. **Reduced-motion test attempted to click a disabled control.** The test now verifies the control remains disabled and motion stays off rather than attempting an invalid interaction.
4. **Gallery focus test raced the native dialog close event.** The browser test now waits for the dialog’s close handler to restore focus before asserting it. The gallery implementation’s opener-focus restoration is preserved and verified.
5. **Clipboard feedback needed a clear in-progress/failure state.** The copy button now announces “Copying…”, exposes `aria-busy`, and resets cleanly after success or failure.
6. **SEO/share metadata and not-found handling needed a consistent final pass.** Title, description, Open Graph/Twitter fields, theme color, favicon, and a project-path-safe `noindex` 404 page are aligned with the portfolio’s dark teal/cyan design.
7. **Legacy duplicate files obscured the active source of truth.** Confirmed unreferenced root-level CSS/JS duplicates are removed; active portfolio and styleguide assets remain in their canonical folders.
8. **320px keyboard-focus overlap.** The focused skip link overlapped the Motion control on very narrow screens. The skip link now uses compact horizontal padding and text sizing at widths up to 360px while keeping a 44px minimum height; Playwright checks the bounding boxes to prevent regression.

## Accessibility and interaction checks

- Semantic main/section landmarks, one primary heading, skip link, accessible labels, and polite `aria-live` announcements for the simulated intro/login states.
- Visible keyboard focus styling and reduced-motion handling.
- 44 px minimum target checks for primary navigation/actions and gallery controls.
- Mobile drawer open/close, Escape handling, section navigation, and focus restoration.
- Gallery open/close, next/previous controls, arrow-key navigation, and focus return to the opener.
- Clipboard success feedback, busy-state cleanup, and the interaction suite’s rejection/fallback path.
- Motion toggle behavior with normal and reduced-motion preferences.
- Custom 404 metadata/assets and reduced-motion styling.
- Static SEO, internal-link, asset, contrast-token, data-zero-state, and JavaScript module syntax checks.

The automated test suite passed and the site is now deployed. A manual cross-browser pass in Firefox, Safari/iOS, and Android Chrome remains a recommended follow-up; automated Chromium coverage is not a substitute for those devices.

## Estimated page weight

Measured by the browser QA script from unique local response-body bytes before HTTP compression:

| Measurement | Bytes | Approx. size |
| --- | ---: | ---: |
| Initial page load | 379,319 B | 370.4 KiB / 0.379 MB |
| Full page after lazy-loaded images | 611,934 B | 597.6 KiB / 0.612 MB |

Initial-load breakdown: HTML 34,515 B; CSS 93,137 B; JavaScript 56,674 B; fonts 56,888 B; images 138,105 B. After scrolling through the page and allowing lazy images to load, image responses total 370,720 B.

These are uncompressed response-body estimates, not wire-byte measurements or Lighthouse scores. Brotli/gzip compression, browser cache, connection behavior, and platform delivery can change actual transfer size.

## Image optimization

All four raster assets are already below the repository’s 250 KiB per-image budget:

- `saad-golden.jpg`: 137,833 B (about 134.6 KiB)
- `saad-dark.jpg`: 126,504 B (about 123.5 KiB)
- `saad-formal.jpg`: 106,111 B (about 103.6 KiB)
- `og-image.jpg`: 172,738 B (about 168.7 KiB)

No lossy recompression was applied because the assets already meet the budget. The three below-the-fold portrait images use lazy loading, asynchronous decoding, meaningful alternative text, and intrinsic dimensions. Recommended future variants: 480×600 WebP for the 4:5 portrait, 480×640 WebP for the 3:4 portraits, and a 1200×630 social preview kept under 200 KiB when quality permits.

## Final manual release checklist

- [x] Automated Chromium layout/interaction review at 1920, 1366, 1024, 768, 390, and 320 px stress case (PASS).
- [ ] Verify drawer focus with Tab/Shift+Tab, Escape, and focus return on a physical keyboard.
- [ ] Test gallery navigation and focus return using mouse, keyboard, and touch.
- [ ] Test clipboard with permission granted and denied.
- [x] Automated system/in-site reduced-motion and Motion-control checks (PASS).
- [x] Automated browser console/network checks found no uncaught JavaScript errors or failed local asset requests; the suite passed at all six viewports.
- [x] GitHub Pages deployment succeeded for production commit `5f440b6dd8c5fd91c6c41a9dc43fb573f61c386b`.
- [x] Repository owner authorized release; [PR #14](https://github.com/ztrace054-x/my-portfolio/pull/14) was merged into `main`.
- [ ] Manually verify the deployed missing-route 404, canonical URL, favicon, social preview, and public profile links in a real browser.
- [ ] Perform the recommended Firefox/Safari/mobile-device pass.

**Merge/deployment status: merged and deployed.**
**Live website:** https://ztrace054-x.github.io/my-portfolio/
