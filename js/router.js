/* Static hash router for the ZTRACE workspace. Routes never trigger network requests. */
export function createRouter({ routes = {}, fallback = "profile", onRoute = () => {} } = {}) {
  let current = null;
  let disposed = false;
  const routeIds = new Set(Object.keys(routes));

  function requestedId() {
    return window.location.hash.replace(/^#\/?/, "").split(/[/?]/)[0];
  }

  function resolve() {
    const requested = requestedId();
    return routeIds.has(requested) ? requested : fallback;
  }

  function normalizeHash() {
    const requested = requestedId();
    const target = "#/" + (routeIds.has(requested) ? requested : fallback);
    if (window.location.hash === target) return;
    try {
      window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search + target);
    } catch {
      window.location.hash = target;
    }
  }

  function dispatch() {
    if (disposed) return;
    const next = resolve();
    if (next === current) return;
    const previous = current;
    current = next;
    onRoute({ id: next, view: routes[next], previous });
  }

  function navigate(id) {
    if (!routeIds.has(id)) return false;
    const target = "#/" + id;
    if (window.location.hash !== target) window.location.hash = target;
    else dispatch();
    return true;
  }

  normalizeHash();
  window.addEventListener("hashchange", dispatch);
  dispatch();

  return {
    navigate,
    get current() { return current; },
    dispose() {
      disposed = true;
      window.removeEventListener("hashchange", dispatch);
    }
  };
}
