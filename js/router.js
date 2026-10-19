/* Small hash router for the upcoming static views; no server or network requests. */
export function createRouter({ routes = {}, fallback = "profile", onRoute = () => {} } = {}) {
  let current = null;
  const routeIds = new Set(Object.keys(routes));
  function resolve() {
    const requested = window.location.hash.replace(/^#\/?/, "").split(/[/?]/)[0];
    return routeIds.has(requested) ? requested : fallback;
  }
  function navigate(id) {
    if (!routeIds.has(id)) return false;
    if (window.location.hash !== "#" + id) window.location.hash = id;
    else dispatch();
    return true;
  }
  function dispatch() {
    const next = resolve();
    if (next === current) return;
    current = next;
    onRoute({ id: next, view: routes[next], previous: null });
  }
  window.addEventListener("hashchange", dispatch);
  dispatch();
  return {
    navigate,
    get current() { return current; },
    dispose() { window.removeEventListener("hashchange", dispatch); }
  };
}
