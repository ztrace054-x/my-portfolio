/* PHANTOM SIGNAL — accessible visitor introduction; no authentication or network activity. */
const SEEN_KEY = "ztrace-phantom-signal-seen-v1";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function prefersReducedMotion() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function hasSeenIntro() {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* ignore */
  }
}

function finishIntro(root) {
  if (!root || root.dataset.finished === "1") return;
  root.dataset.finished = "1";
  root.classList.add("is-exiting");
  const done = () => {
    root.hidden = true;
    root.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("intro-pending");
    document.documentElement.classList.add("intro-complete");
    window.dispatchEvent(new CustomEvent("phantom-signal:complete"));
  };
  const onEnd = (e) => {
    if (e.target !== root) return;
    root.removeEventListener("transitionend", onEnd);
    done();
  };
  root.addEventListener("transitionend", onEnd);
  setTimeout(done, 700);
  markSeen();
}

function bindPointer(root) {
  const onMove = (e) => {
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;
    root.style.setProperty("--pointer-x", x + "%");
    root.style.setProperty("--pointer-y", y + "%");
    root.classList.add("has-pointer");
    const px = ((e.clientX / window.innerWidth) - 0.5) * 12;
    const py = ((e.clientY / window.innerHeight) - 0.5) * 8;
    root.style.setProperty("--parallax-x", px.toFixed(2) + "px");
    root.style.setProperty("--parallax-y", py.toFixed(2) + "px");
  };
  root.addEventListener("pointermove", onMove, { passive: true });
}

function startClock(el) {
  if (!el) return;
  const tick = () => {
    const now = new Date();
    el.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };
  tick();
  return setInterval(tick, 1000);
}

export function initPhantomSignal() {
  const root = document.getElementById("phase2-gate");
  if (!root) return;

  if (hasSeenIntro() || prefersReducedMotion()) {
    root.classList.add("is-static");
    root.hidden = true;
    root.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("intro-pending");
    document.documentElement.classList.add("intro-complete");
    return;
  }

  root.hidden = false;
  root.removeAttribute("aria-hidden");
  root.classList.add("is-active");
  bindPointer(root);
  const clock = root.querySelector(".phantom-intro__clock");
  const clockId = startClock(clock);

  // Auto-finish ~5s (no skip button by design)
  const motionMs = prefersReducedMotion() ? 0 : 5000;
  const autoTimer = setTimeout(() => {
    clearInterval(clockId);
    finishIntro(root);
  }, motionMs);

  // Escape still allowed for accessibility
  const onKey = (e) => {
    if (e.key === "Escape") {
      clearTimeout(autoTimer);
      clearInterval(clockId);
      finishIntro(root);
      window.removeEventListener("keydown", onKey);
    }
  };
  window.addEventListener("keydown", onKey);
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initPhantomSignal());
  } else {
    initPhantomSignal();
  }
}
