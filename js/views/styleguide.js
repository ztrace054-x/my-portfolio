import { MotionController, revealOnScroll, countUp, textDecode } from "../motion.js";
import { formatNumber } from "../utils.js";

const motion = new MotionController();
const toggle = document.querySelector("[data-motion-toggle]");
const toggleLabel = document.querySelector("[data-motion-label]");
const intensity = document.querySelector("[data-motion-intensity]");
const status = document.querySelector("[data-motion-status]");
function sync() {
  toggle.setAttribute("aria-pressed", String(motion.enabled));
  toggleLabel.textContent = motion.enabled ? "Motion on" : "Motion off";
  intensity.value = motion.intensity;
  intensity.disabled = !motion.enabled;
  status.textContent = motion.reducedMotion ? "SYSTEM REDUCED-MOTION PREFERENCE ACTIVE" : motion.enabled ? "MOTION SYSTEM ACTIVE" : "MOTION SYSTEM STANDBY";
}
toggle.addEventListener("click", () => { motion.setEnabled(!motion.enabled); sync(); });
intensity.addEventListener("change", () => { motion.setIntensity(intensity.value); sync(); });
revealOnScroll("[data-reveal]", { controller: motion });
const countButton = document.querySelector("[data-count-demo]");
countButton.addEventListener("click", () => {
  const target = document.querySelector("[data-count-target]");
  countUp(target, 0, { controller: motion, duration: 650, formatter: formatNumber });
});
const decodeButton = document.querySelector("[data-decode-demo]");
decodeButton.addEventListener("click", () => {
  textDecode(document.querySelector("[data-decode-target]"), "AUTHORIZED PRACTICE ONLY", { controller: motion, duration: 850 });
});
motion.addEventListener("change", sync);
sync();
