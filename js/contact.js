import { CONTENT, TIMING } from './config.js?v=20261016.1';

export function initContact({ motionAllowed, clock }) {
  const panel = document.getElementById('contact-panel');
  const text = document.getElementById('email-text');
  const copy = document.getElementById('copy-email');
  const label = copy.querySelector('span');
  const feedback = document.getElementById('copy-feedback');
  const events = new AbortController();
  let typed = !motionAllowed, elapsed = 0, unsubscribe;
  let resetTimer;
  let pending = false;
  let disposed = false;
  const completeTyping = () => {
    unsubscribe?.(); unsubscribe = null;
    typed = true;
    text.textContent = CONTENT.email;
  };
  function typeEmail() {
    if (typed || unsubscribe) return;
    unsubscribe = clock.subscribe((_time, dt) => {
      elapsed += dt;
      text.textContent = CONTENT.email.slice(0, Math.ceil(elapsed / TIMING.emailTyping * CONTENT.email.length));
      if (elapsed >= TIMING.emailTyping) completeTyping();
    });
  }
  // Full accessible address and the mailto URL never change during the visual typing.
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) typeEmail();
    else { unsubscribe?.(); unsubscribe = null; }
  }, { threshold: .25 }) : null;
  if (observer) observer.observe(panel); else completeTyping();
  panel.addEventListener('focusin', completeTyping, { signal: events.signal });
  copy.addEventListener('click', async () => {
    if (pending) return;
    pending = true;
    copy.disabled = true;
    clearTimeout(resetTimer);
    label.textContent = 'Copy';
    copy.classList.remove('is-copied');
    feedback.textContent = '';
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(CONTENT.email);
      if (disposed) return;
      label.textContent = 'Copied! ✓';
      copy.classList.add('is-copied');
      feedback.textContent = 'Email address copied.';
      resetTimer = setTimeout(() => {
        label.textContent = 'Copy';
        copy.classList.remove('is-copied');
        feedback.textContent = '';
      }, TIMING.copyReset);
    } catch {
      if (disposed) return;
      completeTyping();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(text);
      selection?.removeAllRanges();
      selection?.addRange(range);
      feedback.textContent = 'Copy unavailable. The address is selected; use your device’s copy command.';
    } finally {
      pending = false;
      if (!disposed) copy.disabled = false;
    }
  }, { signal: events.signal });
  return {
    setMotion(allowed) { if (!allowed) { completeTyping(); observer?.disconnect(); } },
    dispose() { disposed = true; unsubscribe?.(); clearTimeout(resetTimer); observer?.disconnect(); events.abort(); },
  };
}
