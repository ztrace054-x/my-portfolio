/* Phase 2 — original HUD boot sequence and decorative visitor gate. No authentication or network activity. */
const BOOT_DURATION = 3600;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-/<>[]";

function removeReplayQuery() {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get("intro") !== "1") return;
    url.searchParams.delete("intro");
    history.replaceState(history.state, "", url.pathname + url.search + url.hash);
  } catch { /* URL cleanup is optional; the replay still works. */ }
}
function decodeText(target, progress, elapsed) {
  const settled = Math.floor(Math.max(0, Math.min(1, progress)) * target.length);
  return [...target].map((char, index) => {
    if (char === " " || char === "/" || index < settled) return char;
    return GLYPHS[(index * 11 + Math.floor(elapsed / 76)) % GLYPHS.length];
  }).join("");
}
function localClock(date) {
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(date);
}
function localDate(date) {
  return new Intl.DateTimeFormat(undefined, { weekday: "short", day: "2-digit", month: "short", year: "numeric" }).format(date).toUpperCase();
}

export function initPhase2Gate({ motionAllowed = true } = {}) {
  const root = document.getElementById("phase2-gate");
  const page = document.getElementById("page");
  if (!root || !page) {
    document.documentElement.classList.remove("intro-pending");
    if (page) page.inert = false;
    return { completed: Promise.resolve(), entryStarted: Promise.resolve(), cancel() {}, setMotion() {}, dispose() {} };
  }

  const skipButton = root.querySelector("[data-p2-skip]");
  const loginButton = root.querySelector("[data-p2-login]");
  const loginLayer = root.querySelector("[data-p2-login-layer]");
  const clockReadout = root.querySelector("[data-p2-clock]");
  const widgetClock = root.querySelector("[data-p2-widget-clock]");
  const widgetDate = root.querySelector("[data-p2-widget-date]");
  const bootStatus = root.querySelector("[data-p2-boot-status]");
  const decodeReadout = root.querySelector("[data-p2-decode]");
  const barRows = [...root.querySelectorAll("[data-p2-bar]")];
  const fills = [...root.querySelectorAll("[data-p2-fill]")];
  const counters = [...root.querySelectorAll("[data-p2-count]")];
  const rings = [...root.querySelectorAll("[data-p2-ring]")];
  const reducedMotion = window.matchMedia?.(REDUCED_MOTION_QUERY) ?? { matches: false, addEventListener() {}, removeEventListener() {} };

  let resolveCompleted;
  let resolveEntry;
  const completed = new Promise(resolve => { resolveCompleted = resolve; });
  const entryStarted = new Promise(resolve => { resolveEntry = resolve; });
  const events = new AbortController();
  let done = false;
  let loginReady = false;
  let transitioning = false;
  let elapsed = 0;
  let lastFrame = null;
  let lastClockSecond = -1;
  let frameId = 0;
  let transitionTimer = 0;
  let clockTimer = 0;

  function syncClock(force = false) {
    const now = new Date();
    if (!force && now.getSeconds() === lastClockSecond) return;
    lastClockSecond = now.getSeconds();
    const value = localClock(now);
    if (clockReadout) clockReadout.textContent = value;
    if (widgetClock) widgetClock.textContent = value;
    if (widgetDate) widgetDate.textContent = localDate(now);
  }

  function updateBoot() {
    const progress = Math.max(0, Math.min(1, elapsed / BOOT_DURATION));
    const eased = 1 - Math.pow(1 - progress, 3);
    const message = elapsed < 800
      ? "INITIALIZING HUD MODULES"
      : elapsed < 1650
        ? "CALIBRATING LEARNING SYSTEMS"
        : elapsed < 2600
          ? "PREPARING THE LEARNING WORKSPACE"
          : "PREPARING WORKSPACE";
    if (bootStatus) bootStatus.textContent = "SIMULATED // " + message;
    if (decodeReadout) {
      const target = elapsed >= BOOT_DURATION - 360 ? "LEARNING MODE / READY" : "LEARNING MODE / INITIALIZING";
      decodeReadout.textContent = decodeText(target, eased, elapsed);
    }
    barRows.forEach(row => {
      const target = Number(row.dataset.p2Bar) || 0;
      const fill = row.querySelector(".phase2-gate__fill");
      const value = row.querySelector("[data-p2-bar-value]");
      const current = Math.round(target * eased);
      if (fill) fill.style.width = current + "%";
      if (value) value.textContent = String(current).padStart(2, "0") + "%";
    });
    fills.forEach(fill => {
      const target = Number(fill.dataset.p2Fill) || 0;
      fill.style.width = Math.round(target * eased) + "%";
    });
    counters.forEach(counter => {
      const target = Number(counter.dataset.p2Count) || 0;
      const digits = Number(counter.dataset.p2Digits) || 3;
      const current = Math.round(target * eased);
      counter.textContent = String(current).padStart(digits, "0");
    });
    rings.forEach(ring => {
      const target = Number(ring.dataset.p2Ring) || 0;
      const current = Math.round(target * eased);
      ring.style.setProperty("--ring-value", String(current));
      const label = ring.querySelector("[data-p2-ring-value]");
      if (label) label.textContent = String(current).padStart(2, "0");
    });
  }

  function completeTelemetry() {
    barRows.forEach(row => {
      const target = Number(row.dataset.p2Bar) || 0;
      const fill = row.querySelector(".phase2-gate__fill");
      const value = row.querySelector("[data-p2-bar-value]");
      if (fill) fill.style.width = target + "%";
      if (value) value.textContent = String(target).padStart(2, "0") + "%";
    });
    fills.forEach(fill => { fill.style.width = (Number(fill.dataset.p2Fill) || 0) + "%"; });
    counters.forEach(counter => {
      const target = Number(counter.dataset.p2Count) || 0;
      const digits = Number(counter.dataset.p2Digits) || 3;
      counter.textContent = String(target).padStart(digits, "0");
    });
    rings.forEach(ring => {
      const target = Number(ring.dataset.p2Ring) || 0;
      ring.style.setProperty("--ring-value", String(target));
      const label = ring.querySelector("[data-p2-ring-value]");
      if (label) label.textContent = String(target).padStart(2, "0");
    });
  }

  function stopFrameLoop() {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
    lastFrame = null;
  }

  function finish() {
    if (done) return;
    done = true;
    transitioning = false;
    clearTimeout(transitionTimer);
    clearInterval(clockTimer);
    stopFrameLoop();
    events.abort();
    root.hidden = true;
    root.classList.remove("is-booting", "is-login-ready", "is-transitioning");
    document.documentElement.classList.remove("phase2-active", "phase2-paused");
    document.documentElement.classList.remove("intro-pending");
    loginLayer.inert = true;
    loginLayer.setAttribute("aria-hidden", "true");
    page.inert = false;
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("intro");
      const allowedRoutes = new Set(["profile", "dashboard", "projects", "attack-surface", "skill-progress", "learning-path", "write-ups", "automation", "certificates", "gallery", "contact"]);
      const requestedRoute = url.hash.match(/^#\/([a-z-]+)/)?.[1];
      url.hash = "/" + (allowedRoutes.has(requestedRoute) ? requestedRoute : "profile");
      history.replaceState(history.state, "", url.pathname + url.search + url.hash);
    } catch {
      window.location.hash = "/profile";
    }
    resolveEntry();
    resolveCompleted();
  }

  function showLogin({ focus = true } = {}) {
    if (done || transitioning || loginReady) return;
    loginReady = true;
    completeTelemetry();
    stopFrameLoop();
    root.classList.remove("is-booting");
    root.classList.add("is-login-ready");
    loginLayer.inert = false;
    loginLayer.setAttribute("aria-hidden", "false");
    if (bootStatus) bootStatus.textContent = "SIMULATED // WORKSPACE READY";
    if (decodeReadout) decodeReadout.textContent = "LEARNING MODE / READY";
    if (focus && (document.activeElement === skipButton || !root.contains(document.activeElement))) {
      loginButton?.focus({ preventScroll: true });
    }
  }

  function enter() {
    if (done || transitioning || !loginReady) return;
    transitioning = true;
    loginButton.disabled = true;
    loginButton.querySelector("[data-p2-login-label]").textContent = "OPENING WORKSPACE";
    loginButton.setAttribute("aria-label", "Opening the learning workspace.");
    root.classList.add("is-transitioning");
    transitionTimer = window.setTimeout(finish, 920);
  }

  function tick(now) {
    frameId = 0;
    if (done || document.hidden || loginReady) return;
    const delta = lastFrame === null ? 0 : Math.min(80, Math.max(0, now - lastFrame));
    lastFrame = now;
    if (!loginReady && !transitioning) {
      elapsed += delta;
      updateBoot();
      if (elapsed >= BOOT_DURATION) showLogin();
    }
    if (!done && !loginReady && !document.hidden) frameId = requestAnimationFrame(tick);
  }

  function startFrameLoop() {
    if (done || loginReady || document.hidden || frameId) return;
    frameId = requestAnimationFrame(tick);
  }

  function onVisibilityChange() {
    const hidden = document.hidden;
    document.documentElement.classList.toggle("phase2-paused", hidden);
    if (hidden) stopFrameLoop();
    else {
      lastFrame = null;
      syncClock(true);
      startFrameLoop();
    }
  }

  function onKeydown(event) {
    if (done || transitioning) return;
    if (event.key === "Escape") {
      event.preventDefault();
      showLogin();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (loginReady) enter();
      else showLogin();
      return;
    }
    if (event.key === "Tab") {
      const focusables = loginReady ? [loginButton, skipButton].filter(Boolean) : [skipButton].filter(Boolean);
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
  }

  skipButton?.addEventListener("click", () => showLogin(), { signal: events.signal });
  loginButton?.addEventListener("click", enter, { signal: events.signal });
  document.addEventListener("keydown", onKeydown, { signal: events.signal });
  document.addEventListener("visibilitychange", onVisibilityChange, { signal: events.signal });
  reducedMotion.addEventListener?.("change", event => {
    if (event.matches) showLogin();
  }, { signal: events.signal });

  removeReplayQuery();
  root.hidden = false;
  page.inert = true;
  document.documentElement.classList.add("phase2-active");
  loginLayer.inert = true;
  loginLayer.setAttribute("aria-hidden", "true");
  syncClock(true);
  clockTimer = window.setInterval(() => {
    if (!document.hidden && !done) syncClock();
  }, 1000);
  skipButton?.focus({ preventScroll: true });

  if (reducedMotion.matches || !motionAllowed) {
    showLogin({ focus: true });
  } else {
    root.classList.add("is-booting");
    updateBoot();
    startFrameLoop();
  }

  return {
    completed,
    entryStarted,
    cancel: finish,
    setMotion(enabled) {
      if (!enabled) showLogin();
    },
    dispose() {
      events.abort();
      stopFrameLoop();
      clearTimeout(transitionTimer);
      clearInterval(clockTimer);
      if (!done) {
        root.hidden = true;
        loginLayer.inert = true;
        page.inert = false;
        document.documentElement.classList.remove("phase2-active", "phase2-paused");
        document.documentElement.classList.remove("intro-pending");
      }
    }
  };
}
