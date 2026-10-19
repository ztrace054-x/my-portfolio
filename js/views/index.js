/* View registry metadata. Rendering is added phase by phase. */
export const viewRegistry = Object.freeze([
  { id: "profile", label: "Profile", phase: 4 },
  { id: "dashboard", label: "Dashboard", phase: 4 },
  { id: "attack-surface", label: "Attack Surface", phase: 5 },
  { id: "skill-progress", label: "Skill Progress", phase: 5 },
  { id: "learning-path", label: "Learning Path & Tools", phase: 5 },
  { id: "write-ups", label: "Write-ups", phase: 5 },
  { id: "automation", label: "Automation", phase: 5 },
  { id: "certificates", label: "Certificates", phase: 5 },
  { id: "gallery", label: "Gallery", phase: 6 },
  { id: "contact", label: "Contact", phase: 6 },
  { id: "notifications", label: "Notifications", phase: 3 },
  { id: "settings", label: "Settings", phase: 3 }
]);
export function getView(id) { return viewRegistry.find(view => view.id === id) ?? null; }
