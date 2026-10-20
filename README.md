# Saad — A cybersecurity journey

A static portfolio for an SSC student and cybersecurity beginner. A simulated terminal intro leads into a console-style hero, connected network globe, learning workbench, personal gallery, and direct contact links.

**Live:** https://ztrace054-x.github.io/my-portfolio/

## Source of truth

`index.html` loads `css/{tokens,style,intro,responsive,portfolio-refresh,design-system,phase-3,phase-4,hud-integration,motion-polish,phase-7}.css` and `js/main.js`. The standalone `style-tile.html` page is the visual approval surface for the token system. The entry module uses the versioned modules in `js/`. The live page uses the canonical styles under `css/` and modules under `js/`. Phase 7 removes confirmed unreferenced legacy root-level CSS/JS duplicates and orphan files; the styleguide’s separate assets remain because `styleguide.html` actively uses them. Edit the canonical paths below.

| Path | Purpose |
| --- | --- |
| `index.html` | Six semantic sections, original photos and links, learning workbench, dialogs, SEO metadata, Person JSON-LD, static fallbacks |
| `404.html` / `css/404.css` | Project-path-safe, noindex 404 page with the same dark teal HUD visual language |
| `robots.txt` / `sitemap.xml` | Crawler guidance and the canonical single-page URL |
| `assets/favicon.svg` | Reusable mint-on-ink browser favicon |
| `assets/og-image.jpg` | Social sharing preview image |
| `css/tokens.css` | Self-hosted fonts and centralized color, type, spacing, radius, glow, layer, grain, and motion tokens |
| `css/design-system.css` | Shared buttons, focus states, grid utility, glass surface, and grain toggle hook |
| `css/hud-integration.css` | Additive teal/cyan HUD styling for the live portfolio |
| `css/phase-7.css` | Final focus-ring, 44px control targets, responsive side-drawer navigation, and reduced-motion polish |
| `css/phase-3.css` | Phase 3 glass navbar, magnetic nav labels, hero glitch reveal, animated grid, and scroll cue |
| `css/phase-4.css` | Phase 4 portrait duotone/scan hover, vertical learning timeline, tool cards, and future-goal credentials |
| `css/motion-polish.css` | Phase 6 shared timing, hover consistency, hidden-tab pause, and reduced-motion hard stop |
| `style-tile.html` / `css/style-tile.css` | Standalone visual approval page for palette, type, buttons, cards, grid, glass, and grain |
| `assets/mark-hood-minimal.svg` | Original minimal hooded-figure SVG concept mark (not yet inserted into the live navigation) |
| `css/style.css` | Desktop and shared component styles |
| `css/intro.css` | Cinematic simulated intro |
| `css/responsive.css` | Responsive layouts from 320px, reduced motion, print |
| `css/portfolio-refresh.css` | Layout refinements, console hero, workbench cards, responsive polish |
| `js/main.js` | Core startup, preference controls, optional visual initialization |
| `js/motion.js` | Shared frame clock; hidden-tab suspension |
| `js/intro-timeline.js` | Testable display-only timeline and intro eligibility |
| `js/intro.js` | Intro state, skip, focus, session state, matrix rain, fail-safe |
| `js/hero-scene.js` | Canvas2D globe, subtle mouse/device-tilt parallax, synthetic packets, static SVG fallback |
| `js/journey.js` | Scroll-driven roadmap progress and active learning phase |
| `js/animations.js` | Token-driven native Web Animations, concise hero choreography, typing reveal, and intersection reveals |
| `js/terminal.js` | Optional three-command identity sequence |
| `js/navigation.js` | Anchor navigation, active-section tracking, accessible mobile menu, overlay locks |
| `js/gallery.js` | Two-photo viewer, arrow navigation, focus restoration |
| `js/contact.js` | Email typing, clipboard success and failure handling |
| `js/cursor.js` | Fine-pointer cursor and restrained magnetic text; tilt loops removed for lower frame cost |
| `js/config.js` | Existing contact, photos, local-storage helper, small timing constants |
| `js/data/profile.js`, `js/data/roadmap.js`, `js/data/tools.js`, `js/data/links.js` | Staged, structured content data for future data-driven views; the live one-page sections remain in `index.html` |
| `js/data/stats.js` | Verified learning counts and optional chart data; zero/empty values are intentional until verified data is supplied |
| `js/data/certificates.js` | Credential labels and status values for future data-driven views; current visible fallback remains in `index.html` |
| `tests/qa-check.cjs` | Dependency-free SEO, structured-data, local-link, asset, contrast, and accessibility-structure checks |
| `tests/phase7-quality-check.cjs` | Phase 7-specific 404, responsive-preset, live-region, cache, and documentation regression checks |
| `tests/browser-quality-check.cjs` | Playwright browser checks at 1920, 1366, 1024, 768, and 390 px, including the mobile drawer, gallery, clipboard, overflow, and payload estimate |
| `PHASE-7-QA-REPORT.md` | Findings, fixes, performance estimates, and manual release checklist |
| `tests/interaction-check.cjs` | Deterministic behavior tests with a completion watchdog |
| `tests/responsive.html` | Development viewport viewer (not linked from the portfolio) |
| `RELEASE-NOTES.md` | Change summary, verification, assumptions, limitations |

The production site remains static: no framework, backend, analytics, CDN script, or production build is required. CI installs Playwright and Chromium only to run real-browser QA; that tooling is not shipped to visitors. Relative asset paths work under the GitHub Pages repository prefix.

## Content and identity

Keep the SSC student / beginner positioning truthful. Edit the biography, course, learning roadmap, and four **Future goal · Not yet earned** credential labels in `index.html`. The identity terminal appears in About. The Workbench section shows three honest learning tracks: recon foundations, Linux/networking, and a planned authorized lab journal. They are not presented as completed professional projects. Gallery retains the two distinct original portraits.

The original GitHub, TryHackMe, ZeroDayTest, Instagram, and email URLs remain intact. The ZeroDayTest URL is the originally supplied dashboard/profile URL; a visitor may need to sign in there. Do not invent a replacement public handle.

To change the email, update `CONTENT.email` in `js/config.js` and the accessible address and `mailto:` URLs in `index.html`. Update `PHOTOS` and image alternative text if replacing a gallery portrait. Keep image dimensions to reserve layout space.

### Structured data modules for future dashboard views

The files under `js/data/` are intentionally staged for future data-driven dashboard views. They are currently checked by the foundation suite but are **not imported by the live one-page portfolio**, so editing them alone will not change the visible HTML yet. Until a renderer is connected, update both the data module and the matching fallback copy in `index.html` where relevant.

- `js/data/stats.js`: update `totalLabs`, `writeUps`, `skillsInProgress`, and `certificatesEarned` only from verified counts. Add chart points to `charts.skillProgress`, `charts.activity`, or `charts.vulnerabilityFindings` only when you have real data. Leave unknown values at `0` and chart arrays empty; never invent achievement metrics. If a future chart is illustrative, keep `simulatedVisualsLabel` visible.
- `js/data/certificates.js`: edit each credential `id`, `name`, and `status`. The current four entries are aspirations, not earned certifications. Change a status to earned only after you receive that credential, and update the matching visible list in `index.html` until the data renderer is connected.
- `js/data/profile.js`: update the public bio, learning platform, focus areas, and responsible-practice principle; keep the matching visible copy in `index.html` in sync.
- `js/data/roadmap.js` and `js/data/tools.js`: update roadmap phases, topic arrays, tool names, learning focus, and status labels without implying that planned practice is completed.
- `js/data/links.js`: update the existing public profile URLs and photo metadata together with their visible `index.html` links. Never replace a private dashboard URL with a guessed public profile.

### Image budget and responsive sizing

All raster assets already meet the 250 KiB-per-image budget: `saad-golden.jpg` is 137,833 bytes, `saad-dark.jpg` 126,504 bytes, `saad-formal.jpg` 106,111 bytes, and `og-image.jpg` 172,738 bytes. No lossy re-encode was needed. For future responsive WebP variants, preserve aspect ratios: target about 480×600 for the 4:5 golden portrait and 480×640 for the 3:4 dark/formal portraits, with full-size versions preserving their originals (864×1080 and 810×1080). Keep the social preview at 1200×630 and under 200 KiB where visual quality allows. Preserve intrinsic `width`/`height`, meaningful `alt`, `loading="lazy"`, and `decoding="async"` for below-the-fold imagery.

## Motion and fallbacks

- The first visit in a tab plays an approximately **5.2-second fictional sequence** with cropped status typography, a restrained telemetry HUD, a simulated waveform, and a denial-to-grant handoff. All security messages, nodes, packets, and telemetry are visual simulations. The site performs no scanning, access bypass, device inspection, or audio playback.
- Skip is available immediately; Enter/Space activates the focused native button, and Escape also skips. A 7.2-second wall-clock fail-safe releases the page even if animation callbacks stall. Hidden tabs can therefore finish without replaying the remaining effect.
- Session key `saad-intro-v4` skips subsequent visits. `?intro=1` explicitly replays; the query is consumed so ordinary reloads return to the session behavior. Deep links and saved motion-off bypass the intro; system reduced motion uses a short, non-flashing static handoff.
- System reduced motion takes priority over local preference `saad-motion`. Turning motion off completes typing, cancels Web Animations, disables CSS animation/transitions, stops frame effects, removes the custom cursor, and preserves document layout and scroll position. There is no scroll pinning.
- A shared `requestAnimationFrame` clock stops in hidden documents. CSS animation play state pauses while hidden; globe rendering and terminal typing also pause offscreen. The globe uses 82 desktop / 44 mobile nodes, capped DPR 1.5 / 1, and targets up to 60 desktop / 30 mobile render FPS. Actual frame rates depend on the device and browser. Slow-frame detection reduces the desktop render rate. Phase 6 standardizes hover/reveal/page tokens and removes rotating status text and per-letter hero animation.
- The custom cursor and 3.5px magnetic text effect run only on fine-pointer screens above 900px. Continuous photo/card tilt was removed to reduce per-frame work. Motion-off and reduced-motion remove the cursor and magnetic motion.
- Source HTML remains readable without JavaScript; the SVG globe, biography, email, social links, and photos remain available. No-script navigation is provided. The enhanced gallery viewer and motion/copy controls require JavaScript.
- Animation failure never gates content on a third-party library. Self-hosted fonts fall back to system fonts.

## Verification

Run with Node 20 or newer:

```sh
node tests/qa-check.cjs
node tests/phase7-quality-check.cjs
node --experimental-vm-modules tests/interaction-check.cjs
# Browser QA requires test-only Playwright + Chromium:
npm install --no-save --no-package-lock playwright@1.56.1
npx playwright install chromium
node tests/browser-quality-check.cjs
```

The GitHub Actions quality workflow runs both suites and JavaScript module syntax checks on pull requests to `main` and pushes to `main`.

The suite checks the 5.2-second timeline, automatic completion, Skip/Escape/Enter/cancellation, repeat visits, replay, deep links, reduced-motion handoff, unavailable storage, fail-safe release, hidden-tab frame suspension, terminal completion/focus behavior, clipboard success/rejection, gallery wrapping/focus return, and overlay scroll locks. A real-time watchdog fails stalled tests rather than silently reporting success.

`tests/responsive.html` displays the actual site in 1920/1366/1024/768/390px iframe viewports, with 320px as an extra narrow-screen stress case. `tests/browser-quality-check.cjs` runs the required widths in Chromium against a local HTTP server; it also reports raw response-body sizes before and after lazy images load. These figures are source-response estimates before HTTP compression, not Lighthouse scores or guaranteed wire bytes. Use HTTP serving for browser QA; ES modules do not work correctly from a direct file URL.

## Fonts

Space Grotesk and JetBrains Mono are self-hosted Latin subsets (approximately 57 KB combined), with `font-display: swap`. Their SIL Open Font License notices remain in the repository root as `Space-Grotesk-OFL.txt` and `JetBrains-Mono-OFL.txt`.

Original sources: [Space Grotesk](https://github.com/google/fonts/tree/main/ofl/spacegrotesk), [JetBrains Mono](https://github.com/google/fonts/tree/main/ofl/jetbrainsmono).

## Quick edit guide

- **Page title, description, SEO, and section copy:** edit `index.html`. Keep the title, meta description, canonical URL, Open Graph URL, Twitter preview, and Person JSON-LD consistent with the live domain.
- **Social profiles:** update the social anchor URLs in `index.html` and the public profile URLs in the JSON-LD `sameAs` array together. The ZeroDayTest dashboard/profile URL currently redirects to its sign-in page; replace it only if you have the correct public profile URL.
- **Email:** update `CONTENT.email` in `js/config.js` and the visible address plus every `mailto:` URL in `index.html`.
- **Biography, learning roadmap, tools, credentials, and labels:** edit the matching markup in `index.html`. Keep future credentials clearly marked as not yet earned.
- **Gallery:** replace `assets/saad-golden.jpg`, `assets/saad-dark.jpg`, or `assets/saad-formal.jpg` while retaining the filenames, then update image alt text and intrinsic dimensions in `index.html` and the `PHOTOS` array in `js/gallery.js`. Keep raster images below 250 KB where practical; current portfolio images already meet that budget and do not need lossy re-encoding.
- **Colors, type, spacing, and motion:** edit tokens in `css/tokens.css`; adjust shared layout in `css/style.css` and `css/responsive.css`; keep section-specific changes in `css/portfolio-refresh.css`, `css/phase-3.css`, or `css/phase-4.css`. `css/motion-polish.css` owns the global motion/reduced-motion policy.
- **Favicon and search previews:** edit `assets/favicon.svg`, the social preview image `assets/og-image.jpg`, and matching metadata in `index.html`. If the public URL or repository path changes, update the canonical URL, Open Graph/Twitter image URLs, JSON-LD URLs, `robots.txt`, and `sitemap.xml` together.
- **Cache busting:** when editing a linked CSS or JavaScript file, increment the corresponding `?v=` value in `index.html` (or the importing module URL) so visitors do not keep an older cached copy.

## Final QA and manual browser checklist

The automated QA suite checks SEO metadata/schema, unique IDs, internal anchors, ARIA/label references, heading-level order, image alt/dimensions/loading, local HTML/CSS references, active JavaScript imports, core token contrast, reduced-motion support, and image/font size budgets. It does not replace a real browser audit.

Before a significant release, manually check Chrome and Firefox on desktop plus Safari on macOS/iOS and Chrome on Android when available:

1. Review the required 1920, 1366, 1024, 768, and 390 px widths in `tests/responsive.html`; use 320 px as an extra stress case. Confirm no horizontal scrolling, clipped text, or overlapping controls.
2. At 768 and 390 px, open the navigation drawer, verify it is anchored to the right, use Tab/Shift+Tab, close with Escape, and confirm focus returns to the menu button.
3. At every width, use keyboard-only navigation through the skip link and section links; open the gallery, move between portraits with arrow keys and buttons, close it, and confirm focus returns to the opener.
4. Test the email copy button with clipboard permission granted and denied; confirm the busy state, success feedback, and fallback selection/message.
5. Test system reduced motion and the site Motion toggle; confirm content remains visible and essential information does not depend on animation.
6. Inspect DevTools Console and Network for uncaught exceptions, failed local assets, unexpected 404s, font errors, and layout shifts. Check the custom `404.html` directly and through a missing route on the deployed project site.
7. Confirm the social preview image, favicon, canonical URL, and profile links resolve as expected. The ZeroDayTest dashboard URL may redirect to login, which is expected for that private route.

**GitHub Pages robots.txt note:** this repository is a project site served beneath `/my-portfolio/`. The committed `robots.txt` and sitemap are published beneath that path, but search crawlers conventionally look for `robots.txt` at the origin root (`https://ztrace054-x.github.io/`). To control crawler rules for the whole origin, configure the root `ztrace054-x.github.io` site or use a custom domain; the project-level sitemap can still be submitted directly in Search Console.
## Deployment and rollback

GitHub Pages serves **main / root**. The existing Pages workflow publishes merged changes; the live URL remains the same. Original assets and repository history are retained.

The pre-redesign version is commit `2dd55465135c63dbb568a15e01e6375654e5a06b`. To roll back, revert the redesign merge commit and push the revert to `main`; the Pages workflow will publish that revision. Do not force-push or delete repository history.
