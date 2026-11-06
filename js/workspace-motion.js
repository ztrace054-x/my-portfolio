/* Dashboard-only motion: restrained cursor response, scroll reveals and count-up. */
export function initWorkspaceMotion(shell, motion) {
  if (!shell || !motion) return { mountView() {}, dispose() {} };

  const glow = document.createElement("div");
  glow.className = "workspace-cursor-glow";
  glow.setAttribute("aria-hidden", "true");

  const ambient = document.createElement("div");
  ambient.className = "workspace-ambient";
  ambient.setAttribute("aria-hidden", "true");
  ambient.innerHTML = "<span></span><span></span><span></span><span></span><span></span>";
  shell.prepend(ambient, glow);

  const fine = window.matchMedia?.("(min-width: 901px) and (pointer: fine) and (hover: hover)");
  const revealSelector = [
    ".hud-panel", ".phase5-stat-card", ".phase5-skill-card",
    ".phase5-timeline-card", ".phase5-tool-card", ".phase5-certificate-card",
    ".phase6-gallery-card", ".phase6-contact-primary", ".phase6-social-link"
  ].join(",");
  let disposed = false;
  let cleanups = [];
  let activeRoot = null;
  let revealObserver = null;

  function stopRevealObserver() {
    revealObserver?.disconnect();
    revealObserver = null;
  }

  function cleanView() {
    stopRevealObserver();
    cleanups.forEach(fn => { try { fn(); } catch {} });
    cleanups = [];
    if (activeRoot) {
      activeRoot.querySelectorAll(".workspace-scroll-reveal").forEach(el => {
        el.classList.remove("workspace-scroll-reveal", "is-revealed");
        el.style.removeProperty("--reveal-delay");
      });
      activeRoot.querySelectorAll(".workspace-heading-reveal").forEach(el => {
        el.classList.remove("workspace-heading-reveal");
        el.style.removeProperty("--heading-delay");
      });
    }
    activeRoot = null;
  }

  function sync() {
    shell.dataset.motion = motion.motionAllowed ? "on" : "off";
    shell.dataset.intensity = motion.intensity;
    glow.hidden = !motion.motionAllowed || !fine?.matches;
    if (!motion.motionAllowed) {
      glow.style.opacity = "0";
      shell.querySelectorAll("[data-parallax-card]").forEach(el => el.style.removeProperty("transform"));
      activeRoot?.querySelectorAll(".workspace-scroll-reveal").forEach(el => el.classList.add("is-revealed"));
      stopRevealObserver();
    }
  }

  function pointer(event) {
    if (!motion.motionAllowed || !fine?.matches || document.hidden) return;
    glow.style.setProperty("--cursor-x", event.clientX + "px");
    glow.style.setProperty("--cursor-y", event.clientY + "px");
    glow.style.opacity = "1";
    const card = event.target.closest?.("[data-parallax-card]");
    if (activeRoot && card && activeRoot.contains(card)) {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / Math.max(1, rect.width) - 0.5;
      const y = (event.clientY - rect.top) / Math.max(1, rect.height) - 0.5;
      card.style.transform = "translate3d(" + (x * 3).toFixed(2) + "px," + (y * 3).toFixed(2) + "px,0)";
    }
  }

  function reset() {
    glow.style.opacity = "0";
    shell.querySelectorAll("[data-parallax-card]").forEach(el => el.style.removeProperty("transform"));
  }

  shell.addEventListener("pointermove", pointer);
  shell.addEventListener("pointerleave", reset);
  fine?.addEventListener?.("change", sync);
  motion.addEventListener("change", sync);
  document.addEventListener("visibilitychange", sync);
  sync();

  function mountView(root) {
    reset();
    cleanView();
    if (!root || disposed) return;
    activeRoot = root;

    root.querySelectorAll(".profile-hero,.dashboard-hero,.phase6-contact-primary,.phase6-gallery-card")
      .forEach(el => el.setAttribute("data-parallax-card", ""));

    root.querySelectorAll(".view-heading-block h1,.phase5-section-heading h2,.hud-panel-heading h3")
      .forEach((el, i) => {
        el.classList.add("workspace-heading-reveal");
        el.style.setProperty("--heading-delay", Math.min(i, 8) * 35 + "ms");
      });

    const revealTargets = [...root.querySelectorAll(revealSelector)];
    revealTargets.forEach((el, i) => {
      el.classList.add("workspace-scroll-reveal");
      el.style.setProperty("--reveal-delay", Math.min(i % 5, 4) * 48 + "ms");
    });

    if (!motion.motionAllowed || motion.reducedMotion || !("IntersectionObserver" in window)) {
      revealTargets.forEach(el => el.classList.add("is-revealed"));
    } else if (revealTargets.length) {
      revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-revealed");
          revealObserver?.unobserve(entry.target);
        });
      }, { threshold: 0.08, rootMargin: "0px 0px -4% 0px" });
      revealTargets.forEach(el => revealObserver.observe(el));
    }

  }

  return {
    mountView,
    dispose() {
      if (disposed) return;
      disposed = true;
      cleanView();
      shell.removeEventListener("pointermove", pointer);
      shell.removeEventListener("pointerleave", reset);
      fine?.removeEventListener?.("change", sync);
      motion.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      ambient.remove();
      glow.remove();
    }
  };
}
