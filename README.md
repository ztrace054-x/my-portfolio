# Saad — A cybersecurity journey

A static portfolio for an SSC student and cybersecurity beginner. A simulated terminal intro leads into a console-style hero, connected network globe, learning workbench, personal gallery, and direct contact links.

**Live:** https://ztrace054-x.github.io/my-portfolio/

## Source of truth

`index.html` loads `css/{tokens,style,intro,responsive,portfolio-refresh,design-system}.css` and `js/main.js`. The standalone `style-tile.html` page is the visual approval surface for the token system. The entry module uses the versioned modules in `js/`. Older root-level CSS/JS and the old `css/dark-web.css`, `css/cyber-overrides.css`, `js/smooth-scroll.js`, and `js/viewport.js` are retained for history/compatibility, but are **not loaded by the portfolio**. Edit the canonical paths below.

| Path | Purpose |
| --- | --- |
| `index.html` | Six semantic sections, original photos and links, learning workbench, dialogs, metadata, static fallbacks |
| `css/tokens.css` | Self-hosted fonts and centralized color, type, spacing, radius, glow, layer, grain, and motion tokens |
| `css/design-system.css` | Shared buttons, focus states, grid utility, glass surface, and grain toggle hook |
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
| `js/hero-scene.js` | Canvas2D globe, nodes, routes, synthetic packets, static SVG fallback |
| `js/animations.js` | Native Web Animations and intersection reveals |
| `js/terminal.js` | Optional three-command identity sequence |
| `js/navigation.js` | Anchor navigation, mobile menu, overlay locks |
| `js/gallery.js` | Two-photo viewer, arrow navigation, focus restoration |
| `js/contact.js` | Email typing, clipboard success and failure handling |
| `js/cursor.js` | Fine-pointer cursor, magnetic text, subtle photo tilt |
| `js/config.js` | Existing contact, photos, local-storage helper, small timing constants |
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
- System reduced motion takes priority over local preference `saad-motion`. Turning motion off completes typing, stops frame effects, removes the custom cursor, and preserves document layout and scroll position. There is no scroll pinning.
- A shared `requestAnimationFrame` clock stops in hidden documents. Globe rendering and terminal typing also pause offscreen. The globe uses 82 desktop / 44 mobile nodes, capped DPR 1.5 / 1, and roughly 40 / 24 render FPS targets. Slow-frame detection reduces the desktop render rate.
- Cursor and 7px magnetic effects run only on fine-pointer screens above 900px. Photo tilt is bounded to 3.5 degrees. Mobile and reduced-motion views keep standard interactions.
- Source HTML remains readable without JavaScript; the SVG globe, biography, email, social links, and photos remain available. No-script navigation is provided. The enhanced gallery viewer and motion/copy controls require JavaScript.
- Animation failure never gates content on a third-party library. Self-hosted fonts fall back to system fonts.

## Verification

Run with Node 20 or newer:

```sh
node --experimental-vm-modules tests/interaction-check.cjs
```

The suite checks the 5.2-second timeline, automatic completion, Skip/Escape/Enter/cancellation, repeat visits, replay, deep links, reduced-motion handoff, unavailable storage, fail-safe release, hidden-tab frame suspension, terminal completion/focus behavior, clipboard success/rejection, gallery wrapping/focus return, and overlay scroll locks. A real-time watchdog fails stalled tests rather than silently reporting success.

`tests/responsive.html` displays the actual site in 320/390/768/1024/1440px iframe viewports. Use the live served site for browser QA; ES modules do not work correctly from a direct file URL.

## Fonts

Space Grotesk and JetBrains Mono are self-hosted Latin subsets (approximately 57 KB combined), with `font-display: swap`. Their SIL Open Font License notices remain in `assets/fonts/Space-Grotesk-OFL.txt` and `assets/fonts/JetBrains-Mono-OFL.txt`.

Original sources: [Space Grotesk](https://github.com/google/fonts/tree/main/ofl/spacegrotesk), [JetBrains Mono](https://github.com/google/fonts/tree/main/ofl/jetbrainsmono).

## Deployment and rollback

GitHub Pages serves **main / root**. The existing Pages workflow publishes merged changes; the live URL remains the same. Original assets and repository history are retained.

The pre-redesign version is commit `2dd55465135c63dbb568a15e01e6375654e5a06b`. To roll back, revert the redesign merge commit and push the revert to `main`; the Pages workflow will publish that revision. Do not force-push or delete repository history.
