# Phase 7 — Final quality assurance report

**Date:** 2026-10-20  
**Repository:** [ztrace054-x/my-portfolio](https://github.com/ztrace054-x/my-portfolio)  
**Branch:** `mega-update`  
**Pull request:** [#14 — Phase 7 final quality pass](https://github.com/ztrace054-x/my-portfolio/pull/14)  
**Release state:** Changes pushed to the branch; PR remains open. Nothing has been merged or deployed.

## Result

The GitHub Actions `Portfolio quality checks` workflow passed at commit `019fcd9c69744da15e4d45b37915d0e1f9e6a0c8`. This run includes the final CSS overflow fix and passed the static, interaction, and real-browser checks. The final report/legacy-file cleanup is on the same PR branch and triggers a fresh PR check.

## Responsive browser coverage

Chromium ran the site over local HTTP at all required viewport widths:

| Viewport | Result | Key checks |
| ---: | --- | --- |
| 1920 px | PASS | No horizontal overflow; desktop navigation; gallery, clipboard, motion controls |
| 1366 px | PASS | No horizontal overflow; background grid contained within viewport |
| 1024 px | PASS | Desktop navigation and three-column workbench layout |
| 768 px | PASS | Mobile drawer, keyboard close/focus return, responsive workbench |
| 390 px | PASS | Mobile drawer, single-column workbench, touch targets |

The browser run reported no uncaught JavaScript errors and no failed local asset requests.

## Issues found and resolved

1. **Desktop navigation target was too short.** The Home link rendered at 40 px high. The final stylesheet now enforces a 44 px minimum touch target.
2. **Hero grid caused a narrow-desktop overflow.** At 1366 px, its background bleed extended 14 px beyond the viewport. The grid inset is now capped to the page gutter; the browser check passes with no horizontal scrolling.
3. **Reduced-motion test attempted to click a disabled control.** The test now verifies the control remains disabled and motion stays off rather than attempting an invalid interaction.
4. **Gallery focus test raced the native dialog close event.** The browser test now waits for the dialog’s close handler to restore focus before asserting it. The gallery implementation’s opener-focus restoration is preserved and verified.
5. **Clipboard feedback needed a clear in-progress/failure state.** The copy button now announces “Copying…”, exposes `aria-busy`, and resets cleanly after success or failure.
6. **SEO/share metadata and not-found handling needed a consistent final pass.** Title, description, Open Graph/Twitter fields, theme color, favicon, and a project-path-safe `noindex` 404 page are aligned with the portfolio’s dark teal/cyan design.
7. **Legacy duplicate files obscured the active source of truth.** Confirmed unreferenced root-level CSS/JS duplicates are removed; active portfolio and styleguide assets remain in their canonical folders.

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

The test suite passed. A manual cross-browser pass in Firefox, Safari/iOS, and Android Chrome remains recommended before a production release; automated Chromium coverage is not a substitute for those devices.

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

- [ ] Review 1920, 1366, 1024, 768, 390 px, plus the optional 320 px stress case.
- [ ] Verify drawer focus with Tab/Shift+Tab, Escape, and focus return on a physical keyboard.
- [ ] Test gallery navigation and focus return using mouse, keyboard, and touch.
- [ ] Test clipboard with permission granted and denied.
- [ ] Verify system reduced motion and the in-site Motion control.
- [ ] Inspect browser console/network and check for layout shift, font failures, and missing assets.
- [ ] Test the deployed missing-route 404, canonical URL, favicon, social preview, and public profile links.
- [ ] Perform the recommended Firefox/Safari/mobile-device pass.
- [ ] Obtain approval before merging PR #14.

**Merge/deployment status: not merged, not deployed.**
