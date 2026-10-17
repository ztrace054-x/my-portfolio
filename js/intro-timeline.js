/* Pure display data; none of these messages represent real security operations. */
export const INTRO_DURATION = 5200;
export const INTRO_KEY = 'saad-intro-v4';
export const STAGES = Object.freeze([
  [0, 'SYSTEM BOOT // DARK NODE', 'INITIALIZING LOCAL VISUAL ENGINE...', 0, 'BOOTSTRAP / VISUAL ENGINE'],
  [420, 'LOADING MODULES', '[ OK ] LOCAL ASSETS READY', 8, '[ OK ] loading modules'],
  [800, 'ESTABLISHING ENCRYPTED TUNNEL', 'SIMULATED ROUTE // NO NETWORK ACCESS', 17, 'establishing encrypted tunnel'],
  [1180, 'WARNING: INTRUSION DETECTED', 'FICTIONAL EVENT // LOCAL VISUAL ONLY', 28, 'WARNING / INTRUSION DETECTED'],
  [1560, 'ERROR 0x7F: ACCESS DENIED', 'RETRYING VISUAL HANDSHAKE...', 36, 'ERROR 0x7F / ACCESS DENIED'],
  [1940, 'ROUTING THROUGH 7 NODES', 'SIMULATED NODES // LOCAL ONLY', 48, 'routing through 7 nodes'],
  [2320, 'RETRYING...', 'RECOVERABLE VISUAL HANDSHAKE', 58, 'retrying visual handshake...'],
  [2700, 'IDENTITY CHECK', 'LOCAL PROFILE // SAAD.ZTRACE', 73, 'verifying local identity'],
  [3100, 'VERIFYING IDENTITY', 'FINAL HANDSHAKE // SIMULATED', 82, 'final identity check'],
  [3450, 'ACCESS DENIED', 'FINAL HANDSHAKE // SIMULATED', 88, 'ACCESS DENIED / FINAL CHECK'],
  [3800, 'ACCESS GRANTED', 'LOCAL VISUAL SEQUENCE COMPLETE', 100, 'ACCESS GRANTED / PROFILE READY'],
  [4050, 'WELCOME, OPERATOR', 'SAAD // CYBERSECURITY JOURNEY', 100, 'HANDOFF / LEARNING IN PUBLIC'],
]);
export function stageAt(elapsed) {
  let index = 0;
  while (index + 1 < STAGES.length && elapsed >= STAGES[index + 1][0]) index++;
  return index;
}
export function shouldPlayIntro({ motionAllowed, seen, replay, hash }) {
  return Boolean(motionAllowed && !hash && (replay || !seen));
}
