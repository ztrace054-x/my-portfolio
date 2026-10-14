# SAAD // A cybersecurity journey

A cinematic, dark-terminal portfolio for a cybersecurity **beginner** who is learning ethical hacking in public.
It is honest by design: the goals section is clearly marked *Not Yet Earned*, and nothing claims a certificate that has not been earned.

**Live:** https://ztrace054-x.github.io/my-portfolio/

## What is inside

```
my-portfolio/
├── index.html      all content and structure
├── style.css       theme, layout, animations, responsive rules
├── script.js       intro, globe, matrix rain, scroll effects (vanilla JS)
├── .nojekyll       tells GitHub Pages to serve the files as they are
└── assets/
    ├── saad-dark.jpg      photo for "The Beginning"
    ├── saad-formal.jpg    photo for "The Journey"
    ├── og-image.jpg       link preview image (1200x630)
    ├── noise.svg          film-grain texture
    └── fonts/             Space Grotesk + JetBrains Mono (local, no external requests)
```

No frameworks, no libraries, no build step, no third-party requests.

## Sections

1. **Home**: SAAD., terminal `whoami`, animated cyber globe (drag it), matrix rain
2. **About** + **Why cybersecurity?**
3. **Story**: *The Beginning* and *The Journey* (one photo per section, different atmosphere and reveal)
4. **Roadmap**: five animated stages, the line fills as you scroll
5. **Currently exploring**: Linux & Kali, Networking, Nmap, Wireshark, Burp Suite, Python for Security
6. **Future goals**: six goals, all marked *Not Yet Earned*
7. **Contact**: email (with copy button), LinkedIn, GitHub

## The intro

A boot sequence with matrix rain, CRT power-on, flicker, glitch, red/green warning panels, digital noise and a short screen shake on **ACCESS GRANTED**.

- **SKIP INTRO →** button, or press `Esc`
- Plays on a first visit and again after 30 minutes
- Add `?intro=1` to the URL to force it, or use **Replay intro** in the footer
- Skipped automatically for `prefers-reduced-motion`, deep links (`#about`) and when the **Motion** switch is off

## Editing content

- **Text:** edit `index.html`. Every section has a comment above it.
- **Goal / tool statuses:** search for `class="goal-card"` and `class="tool-card"`.
  Keep goals as goals until they are really earned. When one is earned, change its status and remove the `NOT YET EARNED` line.
- **Roadmap stage state:** `data-state="base | now | future"` on each `.stage`.
- **Photos:** replace the files in `assets/` using the same names, or change the `src` in `index.html`.
- **Colors / spacing:** the `TOKENS` block at the top of `style.css`.

## Run locally

Just open `index.html`, or serve the folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy (GitHub Pages)

Push the folder contents to the repo root and keep Pages on the `main` branch (root).

If the repository still has the old structure, remove it first so nothing stale is left behind:

```bash
git checkout -b cinematic-redesign
git rm -r css js tests            # old folders, if they exist
# copy the new files in, then:
git add -A
git commit -m "Cinematic redesign: hacker intro, story sections, roadmap, honest goals"
git push origin cinematic-redesign
```

Open a pull request and merge. The live site updates in 1-2 minutes.

## Performance and accessibility notes

- Canvas animations pause when off screen or when the tab is hidden.
- Respects `prefers-reduced-motion`, plus a manual **Motion on/off** switch (remembered).
- Works without JavaScript (content stays visible, the intro simply does not run).
- Keyboard friendly: skip link, visible focus, `Esc` closes the intro, menu and photo viewer.
- Mobile tested at 390px wide, no horizontal scrolling.
