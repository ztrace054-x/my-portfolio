import { certificates } from "./certificates.js?v=20261106.1";
const earnedCertificates = certificates.filter(item => item.status === "Earned").length;
/* Only evidenced achievements contribute to totals. */
export const stats = Object.freeze({
  labsCompleted: 0,
  ctfChallenges: 0,
  writeUps: 0,
  certificates: earnedCertificates,
  roomsCompleted: 0,
  /* Backwards-compatible keys used by staged placeholder views. */
  totalLabs: 0,
  skillsInProgress: 0,
  certificatesEarned: earnedCertificates,
  charts: Object.freeze({
    skillProgress: Object.freeze([]),
    activity: Object.freeze([]),
    progressOverTime: Object.freeze([]),
    vulnerabilityFindings: Object.freeze([])
  }),
  simulatedVisualsLabel: "SIMULATED — display-only illustration, not live data"
});
