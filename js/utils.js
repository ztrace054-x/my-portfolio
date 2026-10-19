const storagePrefix = "saad-ztrace";
export function safeStorage() {
  return {
    get(key, fallback = null) {
      try { return localStorage.getItem(storagePrefix + ":" + key) ?? fallback; }
      catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(storagePrefix + ":" + key, String(value)); return true; }
      catch { return false; }
    },
    remove(key) { try { localStorage.removeItem(storagePrefix + ":" + key); } catch { /* Storage may be unavailable. */ } }
  };
}
export function clamp(value, min, max) { return Math.min(max, Math.max(min, Number(value) || 0)); }
export function formatNumber(value) { return new Intl.NumberFormat("en-US").format(Number(value) || 0); }
export function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}
export function onReady(callback) {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", callback, { once: true });
  else callback();
}
