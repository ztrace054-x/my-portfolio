/* Phase 4 completes the Profile and Dashboard views; later phases fill the remaining sections. */
export const viewRegistry = Object.freeze([
  { id: "profile", label: "Profile", phase: 4, built: true },
  { id: "dashboard", label: "Dashboard", phase: 4, built: true },
  { id: "attack-surface", label: "Attack Surface", phase: 5, built: false },
  { id: "skill-progress", label: "Skill Progress", phase: 5, built: false },
  { id: "learning-path", label: "Learning Path", phase: 5, built: false },
  { id: "write-ups", label: "Write-ups", phase: 5, built: false },
  { id: "automation", label: "Automation", phase: 5, built: false },
  { id: "certificates", label: "Certificates", phase: 5, built: false },
  { id: "gallery", label: "Gallery", phase: 6, built: false },
  { id: "contact", label: "Contact", phase: 6, built: false }
]);
export function getView(id) { return viewRegistry.find(view => view.id === id) ?? null; }
