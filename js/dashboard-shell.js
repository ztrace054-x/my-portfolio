import { createRouter } from "./router.js?v=20261019.1";
import { safeStorage } from "./utils.js?v=20261016.1";
import { MotionController } from "./motion.js?v=20261016.1";
import { viewRegistry } from "./views/index.js?v=20261020.2";
import * as profileView from "./views/profile.js?v=20261020.1";
import * as dashboardView from "./views/dashboard.js?v=20261020.1";
import * as attackSurfaceView from "./views/attack-surface.js?v=20261020.2";
import * as skillProgressView from "./views/skill-progress.js?v=20261020.2";
import * as learningPathView from "./views/learning-path.js?v=20261020.2";
import * as writeUpsView from "./views/write-ups.js?v=20261020.2";
import * as automationView from "./views/automation.js?v=20261020.2";
import * as certificatesView from "./views/certificates.js?v=20261020.2";
import * as galleryView from "./views/gallery.js?v=20261020.3";
import * as contactView from "./views/contact.js?v=20261020.3";
import { initWorkspaceMotion } from "./workspace-motion.js?v=20261020.3";

const ROUTES = Object.freeze({
  profile: profileView,
  dashboard: dashboardView,
  "attack-surface": attackSurfaceView,
  "skill-progress": skillProgressView,
  "learning-path": learningPathView,
  "write-ups": writeUpsView,
  automation: automationView,
  certificates: certificatesView,
  gallery: galleryView,
  contact: contactView
});

function isMobile(windowRef) {
  return Boolean(windowRef.matchMedia?.("(max-width: 900px)").matches);
}

export function initDashboardShell() {
  const shell = document.getElementById("app-shell");
  const legacyPage = document.getElementById("page");
  if (!shell || !legacyPage) return { activate() {}, dispose() {} };

  const storage = safeStorage();
  let active = false;
  let router = null;
  let motion = null;
  let events = null;
  let activePanel = null;
  let panelTrigger = null;
  let routeTimer = 0;
  let routeToken = 0;
  let disposeView = null;
  let workspaceMotion = null;

  const sidebar = shell.querySelector("[data-app-sidebar]");
  const viewRoot = shell.querySelector("[data-view-root]");
  const viewTitle = shell.querySelector("[data-view-title]");
  const search = shell.querySelector("[data-nav-search]");
  const navLinks = [...shell.querySelectorAll("[data-nav-item]")];
  const sidebarToggle = shell.querySelector("[data-sidebar-toggle]");
  const sidebarCollapse = shell.querySelector("[data-sidebar-collapse]");
  const sidebarBackdrop = shell.querySelector("[data-sidebar-backdrop]");
  const panelBackdrop = shell.querySelector("[data-panel-backdrop]");
  const panels = Object.fromEntries([...shell.querySelectorAll("[data-app-panel]")].map(panel => [panel.dataset.appPanel, panel]));
  const motionButtons = [...shell.querySelectorAll("[data-shell-motion-toggle]")];
  const intensitySelect = shell.querySelector("[data-motion-intensity]");
  const motionStatus = shell.querySelector("[data-motion-status]");
  const notificationCount = [...shell.querySelectorAll("[data-notification-count]")];
  const notificationTriggers = [...shell.querySelectorAll('[data-panel-open="notifications"]')];
  const markReadButton = shell.querySelector("[data-mark-read]");
  const skipLink = document.querySelector(".skip-link");

  function syncNotifications() {
    const read = storage.get("notifications-read", "off") === "on";
    notificationCount.forEach(badge => {
      badge.textContent = read ? "" : "3";
      badge.hidden = read;
    });
    notificationTriggers.forEach(button => {
      button.setAttribute("aria-label", read ? "Open notifications" : "Open notifications, 3 unread");
    });
    if (markReadButton) markReadButton.disabled = read;
  }

  function syncMotion() {
    if (!motion) return;
    motionButtons.forEach(button => {
      button.setAttribute("aria-pressed", String(motion.enabled));
      button.setAttribute("aria-label", motion.enabled ? "Turn motion off" : "Turn motion on");
      const label = button.querySelector("[data-shell-motion-label]");
      if (label) label.textContent = motion.enabled ? "MOTION ON" : "MOTION OFF";
    });
    if (intensitySelect) {
      intensitySelect.value = motion.intensity;
      intensitySelect.disabled = !motion.enabled;
    }
    if (motionStatus) {
      motionStatus.textContent = motion.reducedMotion
        ? "SYSTEM REDUCED-MOTION PREFERENCE IS ACTIVE"
        : motion.enabled
          ? "MOTION SYSTEM ACTIVE"
          : "MOTION SYSTEM STANDBY";
    }
  }

  function setSidebarOpen(open) {
    const isOpen = Boolean(open);
    shell.classList.toggle("is-sidebar-open", isOpen);
    if (sidebarBackdrop) sidebarBackdrop.hidden = !isOpen;
    if (sidebarToggle) {
      sidebarToggle.setAttribute("aria-expanded", String(isOpen));
      sidebarToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
    }
  }

  function closePanel({ restoreFocus = true } = {}) {
    if (!activePanel) return;
    const panel = panels[activePanel];
    if (panel) {
      panel.hidden = true;
      panel.setAttribute("aria-hidden", "true");
    }
    if (panelBackdrop) panelBackdrop.hidden = true;
    shell.classList.remove("is-panel-open");
    activePanel = null;
    const trigger = panelTrigger;
    panelTrigger = null;
    if (restoreFocus && trigger?.isConnected) trigger.focus({ preventScroll: true });
  }

  function openPanel(name, trigger) {
    const panel = panels[name];
    if (!panel) return;
    if (activePanel) closePanel({ restoreFocus: false });
    activePanel = name;
    panelTrigger = trigger || document.activeElement;
    panel.hidden = false;
    panel.setAttribute("aria-hidden", "false");
    if (panelBackdrop) panelBackdrop.hidden = false;
    shell.classList.add("is-panel-open");
    panel.querySelector("[data-panel-close]")?.focus({ preventScroll: true });
  }

  function onPanelKeydown(event) {
    if (!activePanel) {
      if (event.key === "Escape" && shell.classList.contains("is-sidebar-open")) {
        event.preventDefault();
        setSidebarOpen(false);
        sidebarToggle?.focus({ preventScroll: true });
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      closePanel();
      return;
    }
    if (event.key !== "Tab") return;
    const panel = panels[activePanel];
    if (!panel) return;
    const focusable = [...panel.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      .filter(element => !element.hidden && element.getAttribute("aria-hidden") !== "true");
    if (!focusable.length) {
      event.preventDefault();
      panel.querySelector("[data-panel-close]")?.focus();
      return;
    }
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function filterNavigation() {
    const query = (search?.value || "").trim().toLocaleLowerCase();
    let visible = 0;
    navLinks.forEach(link => {
      const matches = !query || link.textContent.toLocaleLowerCase().includes(query);
      link.hidden = !matches;
      if (matches) visible++;
    });
    const empty = shell.querySelector("[data-nav-empty]");
    if (empty) empty.hidden = visible !== 0;
  }

  function renderRoute({ id, view, previous }) {
    const token = ++routeToken;
    window.clearTimeout(routeTimer);
    routeTimer = 0;
    disposeView?.();
    disposeView = null;
    workspaceMotion?.mountView(null);
    const metadata = viewRegistry.find(item => item.id === id);
    if (viewTitle) viewTitle.textContent = metadata?.label || "Profile";
    navLinks.forEach(link => {
      const activeRoute = link.dataset.route === id;
      if (activeRoute) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    setSidebarOpen(false);

    const paint = () => {
      if (token !== routeToken || !viewRoot) return;
      const activeView = view || ROUTES.profile;
      try {
        viewRoot.innerHTML = activeView.render();
        disposeView = typeof activeView.mount === "function" ? activeView.mount(viewRoot, { motion }) : null;
        workspaceMotion?.mountView(viewRoot);
      } catch {
        disposeView?.();
        disposeView = null;
        viewRoot.innerHTML = '<section class="view-page"><h1 id="view-heading" tabindex="-1">View unavailable</h1><p class="view-intro">This local view could not be rendered. Please choose another section.</p></section>';
      }
      viewRoot.classList.remove("is-view-leaving");
      viewRoot.classList.add("is-view-entering");
      viewRoot.classList.remove("is-view-ready");
      if (!motion?.motionAllowed) {
        viewRoot.classList.add("is-view-ready");
      } else {
        window.requestAnimationFrame(() => {
          if (token === routeToken) viewRoot.classList.add("is-view-ready");
        });
      }
      if (previous) viewRoot.querySelector("#view-heading")?.focus({ preventScroll: true });
    };

    if (previous && motion?.motionAllowed) {
      viewRoot?.classList.remove("is-view-ready", "is-view-entering");
      viewRoot?.classList.add("is-view-leaving");
      window.clearTimeout(routeTimer);
      routeTimer = window.setTimeout(paint, 115);
    } else {
      paint();
    }
  }

  function replayIntro() {
    const url = new URL(window.location.href);
    url.searchParams.set("intro", "1");
    window.location.assign(url.pathname + url.search + url.hash);
  }

  function activate() {
    if (active) return;
    active = true;
    legacyPage.hidden = true;
    shell.hidden = false;
    document.body.classList.add("app-shell-active");
    if (skipLink) skipLink.setAttribute("href", "#app-view-root");
    shell.classList.add("is-entering");

    motion = new MotionController();
    workspaceMotion = initWorkspaceMotion(shell, motion);
    events = new AbortController();
    motion.addEventListener("change", syncMotion);

    sidebarCollapse?.addEventListener("click", () => {
      const collapsed = !shell.classList.contains("is-collapsed");
      shell.classList.toggle("is-collapsed", collapsed);
      sidebarCollapse.setAttribute("aria-expanded", String(!collapsed));
      sidebarCollapse.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
      storage.set("sidebar-collapsed", collapsed ? "on" : "off");
    }, { signal: events.signal });

    const wasCollapsed = storage.get("sidebar-collapsed", "off") === "on";
    shell.classList.toggle("is-collapsed", wasCollapsed);
    if (sidebarCollapse) {
      sidebarCollapse.setAttribute("aria-expanded", String(!wasCollapsed));
      sidebarCollapse.setAttribute("aria-label", wasCollapsed ? "Expand sidebar" : "Collapse sidebar");
    }

    sidebarToggle?.addEventListener("click", () => {
      setSidebarOpen(!shell.classList.contains("is-sidebar-open"));
    }, { signal: events.signal });
    sidebarBackdrop?.addEventListener("click", () => setSidebarOpen(false), { signal: events.signal });
    window.addEventListener("resize", () => {
      if (!isMobile(window)) setSidebarOpen(false);
    }, { signal: events.signal });

    navLinks.forEach(link => link.addEventListener("click", () => setSidebarOpen(false), { signal: events.signal }));
    search?.addEventListener("input", filterNavigation, { signal: events.signal });
    shell.querySelectorAll("[data-panel-open]").forEach(button => {
      button.addEventListener("click", () => openPanel(button.dataset.panelOpen, button), { signal: events.signal });
    });
    shell.querySelectorAll("[data-panel-close]").forEach(button => {
      button.addEventListener("click", () => closePanel(), { signal: events.signal });
    });
    panelBackdrop?.addEventListener("click", () => closePanel(), { signal: events.signal });
    document.addEventListener("keydown", onPanelKeydown, { signal: events.signal });
    markReadButton?.addEventListener("click", () => {
      storage.set("notifications-read", "on");
      syncNotifications();
    }, { signal: events.signal });

    motionButtons.forEach(button => button.addEventListener("click", () => motion.setEnabled(!motion.enabled), { signal: events.signal }));
    intensitySelect?.addEventListener("change", () => motion.setIntensity(intensitySelect.value), { signal: events.signal });
    shell.querySelector("[data-replay-intro]")?.addEventListener("click", replayIntro, { signal: events.signal });

    router = createRouter({ routes: ROUTES, fallback: "profile", onRoute: renderRoute });
    syncNotifications();
    syncMotion();
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => shell.classList.add("is-ready"));
    });
  }

  function dispose() {
    disposeView?.();
    disposeView = null;
    workspaceMotion?.dispose();
    workspaceMotion = null;
    if (router) router.dispose();
    if (events) events.abort();
    if (motion) {
      motion.removeEventListener("change", syncMotion);
      motion.dispose();
    }
    window.clearTimeout(routeTimer);
    closePanel({ restoreFocus: false });
    setSidebarOpen(false);
    document.body.classList.remove("app-shell-active");
    legacyPage.hidden = false;
    shell.hidden = true;
    active = false;
  }

  return { activate, dispose, get active() { return active; } };
}
