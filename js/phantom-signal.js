/* PHANTOM SIGNAL — accessible visitor introduction; no authentication or network activity. */
const SEEN_KEY = "ztrace-phantom-signal-seen-v1";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function clearReplayQuery() {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get("intro") !== "1") return;
    url.searchParams.delete("intro");
    history.replaceState(history.state, "", url.pathname + url.search + url.hash);
  } catch { /* Query cleanup is optional. */ }
}

function formatClock(date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
  }).format(date);
}

export function initPhantomSignal({ motionAllowed = true } = {}) {
  const root = document.getElementById("phase2-gate");
  const page = document.getElementById("page");
  if (!root || !page) {
    document.documentElement.classList.remove("intro-pending");
    if (page) page.inert = false;
    const ready = Promise.resolve();
    return { completed: ready, entryStarted: ready, cancel() {}, setMotion() {}, dispose() {} };
  }

  const skipButton = root.querySelector("[data-p2-skip]");
  const enterButton = root.querySelector("[data-p2-login]");
  const clockReadout = root.querySelector("[data-phantom-clock]");
  const reducedMotion = window.matchMedia?.(REDUCED_MOTION_QUERY) ?? {
    matches: false,
    addEventListener() {},
    removeEventListener() {}
  };
  const replayRequested = new URLSearchParams(window.location.search).get("intro") === "1";
  const deepLinkRequested = Boolean(window.location.hash);
  let alreadySeen = false;
  try { alreadySeen = sessionStorage.getItem(SEEN_KEY) === "1"; } catch { /* Storage is optional. */ }

  if (!replayRequested && (alreadySeen || deepLinkRequested)) {
    root.hidden = true;
    root.setAttribute("aria-hidden", "true");
    page.inert = false;
    document.documentElement.classList.remove("phase2-active", "intro-pending");
    const ready = Promise.resolve();
    return { completed: ready, entryStarted: ready, cancel() {}, setMotion() {}, dispose() {} };
  }

  let resolveCompleted;
  let resolveEntry;
  const completed = new Promise(resolve => { resolveCompleted = resolve; });
  const entryStarted = new Promise(resolve => { resolveEntry = resolve; });
  const events = new AbortController();
  let done = false;
  let currentMotion = Boolean(motionAllowed && !reducedMotion.matches);
  let autoTimer = 0;
  let exitTimer = 0;
  let clockTimer = 0;

  function updateClock() {
    if (clockReadout) clockReadout.textContent = formatClock(new Date());
  }

  function finish() {
    if (done) return;
    done = true;
    window.clearTimeout(autoTimer);
    window.clearInterval(clockTimer);
    events.abort();
    root.classList.add("is-exiting");
    root.setAttribute("aria-hidden", "true");
    const fadeDuration = currentMotion ? 720 : 180;
    exitTimer = window.setTimeout(() => {
      root.hidden = true;
      root.classList.remove("is-active", "is-static", "is-exiting");
      page.inert = false;
      document.documentElement.classList.remove("phase2-active", "intro-pending");
      try { sessionStorage.setItem(SEEN_KEY, "1"); } catch { /* Private browsing remains usable. */ }
      clearReplayQuery();
      resolveCompleted();
    }, fadeDuration);
  }

  function onKeydown(event) {
    if (done) return;
    if (event.key === "Escape") {
      event.preventDefault();
      finish();
      return;
    }
    if (event.key !== "Tab") return;
    const focusables = [skipButton, enterButton].filter(button => button && !button.disabled && !button.hidden);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  skipButton?.addEventListener("click", finish, { signal: events.signal });
  enterButton?.addEventListener("click", finish, { signal: events.signal });
  document.addEventListener("keydown", onKeydown, { signal: events.signal });
  reducedMotion.addEventListener?.("change", event => {
    if (event.matches) {
      currentMotion = false;
      root.classList.add("is-static");
      window.clearTimeout(autoTimer);
      autoTimer = window.setTimeout(finish, 1400);
    }
  }, { signal: events.signal });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) return;
    updateClock();
  }, { signal: events.signal });

  root.hidden = false;
  root.setAttribute("aria-hidden", "false");
  root.classList.add("is-active");
  root.classList.toggle("is-static", !currentMotion);
  page.inert = true;
  document.documentElement.classList.add("phase2-active");
  updateClock();
  clockTimer = window.setInterval(updateClock, 1000);
  skipButton?.focus({ preventScroll: true });
  resolveEntry();

  // A full cinematic pass plays on first visit. Returning visitors can replay it from Settings.
  autoTimer = window.setTimeout(finish, currentMotion ? 11800 : 4600);

  return {
    completed,
    entryStarted,
    cancel: finish,
    setMotion(enabled) {
      currentMotion = Boolean(enabled && !reducedMotion.matches);
      root.classList.toggle("is-static", !currentMotion);
      if (!currentMotion && !done) {
        window.clearTimeout(autoTimer);
        autoTimer = window.setTimeout(finish, 1800);
      }
    },
    dispose() {
      if (!done) finish();
      events.abort();
      window.clearTimeout(autoTimer);
      window.clearInterval(clockTimer);
      // Keep the exit timer alive so the hidden state, inert page, and completion
      // promise are always released even when a caller disposes during the fade.
    }
  };
}
