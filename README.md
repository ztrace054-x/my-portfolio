# Saad — A cybersecurity journey

A static, responsive portfolio for an SSC student taking his first steps into cybersecurity. Editorial typography, a connected Canvas 2D core, masked GSAP reveals, and an optional desktop learning sequence support an honest beginner story.

**Live:** https://ztrace054-x.github.io/my-portfolio/

## Project structure

| Path | Purpose |
| --- | --- |
| `index.html` | All semantic content, metadata, stable navigation anchors, and accessible dialogs |
| `css/tokens.css` | Colors, font declarations, spacing, and motion tokens |
| `css/style.css` | Components and desktop layouts |
| `css/responsive.css` | Mobile/tablet layouts, reduced motion, and print |
| `js/config.js` | Contact details, photo data, pinned dependencies, and timings |
| `js/main.js` | Native startup, motion preference, dependency deadline, and shared clock |
| `js/animations.js` | GSAP reveals, parallax, and the single optional journey pin |
| `js/smooth-scroll.js` | Lenis integration and cleanup |
| `js/intro.js` | Skippable boot introduction and three-second deadline |
| `js/cursor.js` | Fine-pointer cursor, magnetic buttons, and subtle photo tilt |
| `js/hero-scene.js` | Lightweight illustrative core and static SVG fallback |
| `js/navigation.js` | Native anchor navigation, mobile menu, and shared overlay lock |
| `js/gallery.js` | Photo viewer, captions, arrow navigation, and focus return |
| `js/contact.js` | Accessible email typing and truthful clipboard feedback |
| `assets/` | Three original portraits, static grain, and licensed fonts |
| `tests/interaction-check.cjs` | Deterministic interaction tests without browser dependencies |
| `.nojekyll` | Static GitHub Pages serving |

No framework, backend, analytics, package installation, or production build step is required. Local ES modules use relative paths that work under the repository's GitHub Pages prefix.

## Editing content

Edit the bio, learning phases, tools, and roadmap in `index.html`. Heading animations have an intact screen-reader copy and a visual copy: update both when editing a heading.

The **CERTIFICATION ROADMAP** comment marks the four future credentials. Each currently says **Future goal · Not yet earned**. Only after earning a credential should its status change; include a verifiable credential link at that time. The tools and current learning topics describe beginner exploration, not mastery. The gallery contains personal photos, not completed security projects.

To update the email, change `CONTENT.email` in `js/config.js` and every address and `mailto:` reference in `index.html`. To replace a photograph, keep its filename, then update its description/dimensions in `index.html` and `PHOTOS` in `js/config.js`.

## Motion and resilience

- GSAP **3.15.0** and matching ScrollTrigger load from jsDelivr; Lenis **1.3.26** loads from unpkg. Exact URLs are in `js/config.js`. Do not use unversioned `latest` dependencies.
- Native menu, gallery, contact, and preference handlers start before CDN requests. The optional dependency group has a 2.5-second deadline. Blocked dependencies retain native scrolling and readable content.
- The intro is sound-free, cancellable, and bounded to three seconds. Returning visits preserve `saad-visited-v1` and bypass it. Deep links and reduced motion also bypass it.
- System reduced motion overrides the saved motion preference (`saad-motion`). Switching motion off completes typing, removes pinning, restores the normal cursor, and stops decorative rendering.
- Lenis runs only on eligible fine-pointer screens. Touch scrolling remains native. The journey is pinned only on desktop when the entire stage fits below the header.
- Canvas and cursor share one clock; the scene stops offscreen or in a hidden document. Canvas resolution is capped at 1.5 device pixel ratio. Mobile uses inline SVG.
- The complete content remains readable without JavaScript. A no-script navigation fallback provides direct section links. Ordinary email is not described as encrypted or as a messaging service.

## Fonts and attribution

Self-hosted Latin subsets of **Space Grotesk** and **JetBrains Mono** are approximately 57 KB combined. They were subset from the official Google Fonts repository using FontTools. Variable weights and original font names are preserved. Font loading uses `font-display: swap`; system fonts remain usable if font loading fails.

The SIL Open Font License and original attribution notices are retained in:

- `assets/fonts/Space-Grotesk-OFL.txt`
- `assets/fonts/JetBrains-Mono-OFL.txt`

Sources: [Space Grotesk](https://github.com/google/fonts/tree/main/ofl/spacegrotesk), [JetBrains Mono](https://github.com/google/fonts/tree/main/ofl/jetbrainsmono). Animation libraries retain their own licenses: [GSAP](https://gsap.com/standard-license/) and [Lenis](https://github.com/darkroomengineering/lenis/blob/main/LICENSE).

## Checks and development

Run the interaction checks with Node 20 or newer:

```sh
node --experimental-vm-modules tests/interaction-check.cjs
```

The tests exercise intro completion/cancellation, returning and deep-link visits, reduced motion, copying before typing finishes, clipboard rejection, gallery wrapping and focus return, dependency timeout, Lenis disposal, and the shared animation clock. VM Modules may print a Node experimental-feature notice.

Additional release checks verify JavaScript syntax, unique IDs, local file/import/anchor references, portrait dimensions, four unearned credential statuses, accessible email text, color contrast, and asset budgets. Browser review should check the served site, motion toggling, navigation, the gallery, clipboard feedback, responsive layouts, and console output. Actual frame rate depends on the device; no hardware-independent 60 FPS guarantee is made.

For local development, serve the folder over HTTP using your preferred static development server. Opening the file directly is insufficient for testing ES modules.

## GitHub Pages deployment and rollback

Pages serves **main / root**. Commit all code and assets to `main`; the existing Pages workflow publishes them. The URL remains unchanged.

The previous Matrix-style release remains in Git history at `308be82da850d5e2322f50844bdcc80bc844949d`. To roll back, revert the redesign commit and push the revert to `main`; the same Pages workflow redeploys it. Do not delete repository history or the existing photographs.
