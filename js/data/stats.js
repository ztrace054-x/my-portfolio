/* Progress stays at zero until Saad adds verified, completed work. */
export const stats = Object.freeze({
  labsCompleted: 0,
  ctfChallenges: 0,
  writeUps: 0,
  certificates: 0,
  roomsCompleted: 0,
  /* Backwards-compatible keys used by staged placeholder views. */
  totalLabs: 0,
  skillsInProgress: 0,
  certificatesEarned: 0,
  charts: Object.freeze({
    skillProgress: Object.freeze([]),
    activity: Object.freeze([]),
    progressOverTime: Object.freeze([]),
    vulnerabilityFindings: Object.freeze([])
  }),
  simulatedVisualsLabel: "SIMULATED — display-only illustration, not live data"
});
