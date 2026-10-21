/* Phase 5 and Phase 6 routed workspace views. */
export const viewRegistry = Object.freeze([
  { id: "profile", label: "Profile", phase: 4, built: true },
  { id: "dashboard", label: "Dashboard", phase: 4, built: true },
  { id: "attack-surface", label: "Attack Surface", phase: 5, built: true },
  { id: "skill-progress", label: "Skill Progress", phase: 5, built: true },
  { id: "learning-path", label: "Learning Path", phase: 5, built: true },
  { id: "write-ups", label: "Write-ups", phase: 5, built: true },
  { id: "automation", label: "Automation", phase: 5, built: true },
  { id: "certificates", label: "Certificates", phase: 5, built: true },
  { id: "gallery", label: "Gallery", phase: 6, built: true },
  { id: "contact", label: "Contact", phase: 6, built: true }
]);
export function getView(id) { return viewRegistry.find(view => view.id === id) ?? null; }