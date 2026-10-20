# Saad — A cybersecurity journey

A static portfolio for an SSC student and cybersecurity beginner. A simulated terminal intro leads into a console-style hero, connected network globe, learning workbench, personal gallery, and direct contact links.

**Live:** https://ztrace054-x.github.io/my-portfolio/

## Source of truth

`index.html` currently loads the shared stylesheets plus `css/phase-2-gate.css`, `css/dashboard-shell.css`, and `css/phase-5.css`; its versioned entry module is `js/main.js`. The standalone `style-tile.html` page is the visual approval surface for the token system. The dashboard shell loads the versioned modules under `js/`, including the hash router, view registry, data modules, and view renderers. Older root-level CSS/JS duplicates remain as archival compatibility artifacts, but are **not loaded by the portfolio**. Edit the canonical paths below and verify the active imports before removing any legacy file.

| Path | Purpose |
| --- | --- |
| `index.html` | Six semantic sections, original photos and links, learning workbench, dialogs, SEO metadata, Person JSON-LD, static fallbacks |
| `robots.txt` / `sitemap.xml` | Crawler guidance and the canonical single-page URL |
| `assets/favicon.svg` | Reusable mint-on-ink browser favicon |
| `assets/og-image.jpg` | Social sharing preview image |
| `css/tokens.css` | Self-hosted fonts and centralized color, type, spacing, radius, glow, layer, grain, and motion tokens |
| `css/design-system.css` | Shared buttons, focus states, grid utility, glass surface, and grain toggle hook |
| `css/phase-3.css` | Phase 3 glass navbar, magnetic nav labels, hero glitch reveal, animated grid, and scroll cue |
| `css/phase-4.css` | Phase 4 profile/dashboard view styling and shared dashboard patterns |
| `css/motion-polish.css` | Shared timing, hover consistency, hidden-tab pause, and reduced-motion behavior |
| `style-tile.html` / `css/style-tile.css` | Standalone visual approval page for palette, type, buttons, cards, grid, glass, and grain |
| `assets/mark-hood-minimal.svg` | Original minimal hooded-figure SVG concept mark (not yet inserted into the live navigation) |
| `css/style.css` | Desktop and shared component styles |
| `css/intro.css` | Cinematic simulated intro |
| `css/responsive.css` | Responsive layouts from 320px, reduced motion, print |
| `css/portfolio-refresh.css` | Layout refinements, console hero, workbench cards, responsive polish |
| `js/main.js` | Core startup, preference controls, optional visual initialization |
| `js/motion.js` | Shared frame clock; hidden-tab suspension |
| `js/phase2-gate.js` | Simulated intro/access gate, skip handling, session state, focus handling, and fail-safe |
| `js/dashboard-shell.js` | Dashboard shell, route navigation, view rendering, and per-view cleanup |
| `css/phase-2-gate.css` | Intro/access-gate presentation and responsive behavior |
| `css/dashboard-shell.css` | Dashboard navigation, HUD panels, layout, and responsive shell |
| `css/phase-5.css` | Six Phase 5 views, empty states, status cards, and reduced-motion styling |
| `js/router.js` | Static hash router with route fallback and listener cleanup |
| `js/views/index.js` / `js/views/*.js` | View registry and data-driven view renderers |
| `js/data/*.js` | Separated portfolio, learning, scope, automation, and credential content |
| `tests/phase2-gate-check.cjs` through `tests/phase5-views-check.cjs` | Regression checks for the gated intro, dashboard shell, Phase 4 views, and Phase 5 views |
| `js/hero-scene.js` | Canvas2D globe, subtle mouse/device-tilt parallax, synthetic packets, static SVG fallback |
| `js/journey.js` | Scroll-driven roadmap progress and active learning phase |
| `js/animations.js` | Token-driven native Web Animations, concise hero choreography, typing reveal, and intersection reveals |
| `js/terminal.js` | Optional three-command identity sequence |
| `js/navigation.js` | Anchor navigation, active-section tracking, accessible mobile menu, overlay locks |
| `js/gallery.js` | Two-photo viewer, arrow navigation, focus restoration |
| `js/contact.js` | Email typing, clipboard success and failure handling |
| `js/cursor.js` | Fine-pointer cursor and restrained magnetic text; tilt loops removed for lower frame cost |
| `js/config.js` | Existing contact, photos, local-storage helper, small timing constants |
| `tests/qa-check.cjs` | Dependency-free SEO, structured-data, local-link, asset, contrast, and accessibility-structure checks |
| `tests/interaction-check.cjs` | Deterministic behavior tests with a completion watchdog |
| `tests/responsive.html` | Development viewport viewer (not linked from the portfolio) |
| `RELEASE-NOTES.md` | Change summary, verification, assumptions, limitations |

No framework, backend, analytics, CDN script, package installation, or production build is required. Relative asset paths work under the GitHub Pages repository prefix.

## Content and identity

Keep the SSC student / beginner positioning truthful. Edit the biography, course, learning roadmap, and four **Future goal · Not yet earned** credential labels in `index.html`. The identity terminal appears in About. The Workbench section shows three honest learning tracks: recon foundations, Linux/networking, and a planned authorized lab journal. They are not presented as completed professional projects. Gallery retains the two distinct original portraits.

The original GitHub, TryHackMe, ZeroDayTest, Instagram, and email URLs remain intact. The ZeroDayTest URL is the originally supplied dashboard/profile URL; a visitor may need to sign in there. Do not invent a replacement public handle.

To change the email, update `CONTENT.email` in `js/config.js` and the accessible address and `mailto:` URLs in `index.html`. Update `PHOTOS` and image alternative text if replacing a gallery portrait. Keep image dimensions to reserve layout space.

## Motion and fallbacks

- The first visit in a tab plays an approximately **5.2-second fictional sequence** with cropped status typography, a restrained telemetry HUD, a simulated waveform, and a denial-to-grant handoff. All security messages, nodes, packets, and telemetry are visual simulations. The site performs no scanning, access bypass, device inspection, or audio playback.
- Skip is available immediately; Enter/Space activates the focused native button, and Escape also skips. A 7.2-second wall-clock fail-safe releases the page even if animation callbacks stall. Hidden tabs can therefore finish without replaying the remaining effect.
- Session key `saad-intro-v4` skips subsequent visits. `?intro=1` explicitly replays; the query is consumed so ordinary reloads return to the session behavior. Deep links and saved motion-off bypass the intro; system reduced motion uses a short, non-flashing static handoff.
- System reduced motion takes priority over local preference `saad-motion`. Turning motion off completes typing, cancels Web Animations, disables CSS animation/transitions, stops frame effects, removes the custom cursor, and preserves document layout and scroll position. There is no scroll pinning.
- A shared `requestAnimationFrame` clock stops in hidden documents. CSS animation play state pauses while hidden; globe rendering and terminal typing also pause offscreen. The globe uses 82 desktop / 44 mobile nodes, capped DPR 1.5 / 1, and roughly 40 / 24 render FPS targets. Slow-frame detection reduces the desktop render rate. Phase 6 standardizes hover/reveal/page tokens and removes rotating status text and per-letter hero animation.
- The custom cursor and 3.5px magnetic text effect run only on fine-pointer screens above 900px. Continuous photo/card tilt was removed to reduce per-frame work. Motion-off and reduced-motion remove the cursor and magnetic motion.
- Source HTML remains readable without JavaScript; the SVG globe, biography, email, social links, and photos remain available. No-script navigation is provided. The enhanced gallery viewer and motion/copy controls require JavaScript.
- Animation failure never gates content on a third-party library. Self-hosted fonts fall back to system fonts.

## Verification

Run with Node 20 or newer:

```sh
node tests/qa-check.cjs
node --experimental-vm-modules tests/interaction-check.cjs
```

The GitHub Actions quality workflow runs both suites and JavaScript module syntax checks on pull requests to `main` and pushes to `main`.

The suite checks the 5.2-second timeline, automatic completion, Skip/Escape/Enter/cancellation, repeat visits, replay, deep links, reduced-motion handoff, unavailable storage, fail-safe release, hidden-tab frame suspension, terminal completion/focus behavior, clipboard success/rejection, gallery wrapping/focus return, and overlay scroll locks. A real-time watchdog fails stalled tests rather than silently reporting success.

`tests/responsive.html` displays the actual site in 320/390/768/1024/1440px iframe viewports. Use the live served site for browser QA; ES modules do not work correctly from a direct file URL.

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

1. At `tests/responsive.html`, review 320, 390, 768, 1024, and 1440 px viewports; confirm no horizontal overflow or clipped controls.
2. Use only the keyboard: focus the skip link, navigate the menu, open/close the gallery, move between photos, dismiss dialogs with Escape, and activate the email copy control.
3. Test system reduced motion and the site Motion toggle; confirm content remains visible and no essential information depends on animation.
4. Inspect browser DevTools Console and Network for uncaught exceptions, failed local assets, 404s, font errors, and layout shifts.
5. Confirm the social preview image and profile links resolve as expected. The ZeroDayTest dashboard URL may redirect to login, which is expected for that private route.

**GitHub Pages robots.txt note:** this repository is a project site served beneath `/my-portfolio/`. The committed `robots.txt` and sitemap are published beneath that path, but search crawlers conventionally look for `robots.txt` at the origin root (`https://ztrace054-x.github.io/`). To control crawler rules for the whole origin, configure the root `ztrace054-x.github.io` site or use a custom domain; the project-level sitemap can still be submitted directly in Search Console.
## Deployment and rollback

GitHub Pages serves **main / root**. The existing Pages workflow publishes merged changes; the live URL remains the same. Original assets and repository history are retained.

The pre-redesign version is commit `2dd55465135c63dbb568a15e01e6375654e5a06b`. To roll back, revert the redesign merge commit and push the revert to `main`; the Pages workflow will publish that revision. Do not force-push or delete repository history.
