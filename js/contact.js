import { CONTENT, TIMING } from './config.js';

export function initContact({ motionAllowed }) {
  const panel = document.getElementById('contact-panel');
  const text = document.getElementById('email-text');
  const copy = document.getElementById('copy-email');
  const label = copy.querySelector('span');
  const feedback = document.getElementById('copy-feedback');
  const events = new AbortController();
  let typed = !motionAllowed;
  let timer;
  let resetTimer;
  let pending = false;
  let disposed = false;
  const completeTyping = () => {
    clearTimeout(timer);
    typed = true;
    text.textContent = CONTENT.email;
  };
  function typeEmail() {
    if (typed) return;
    typed = true;
    let count = 0;
    const next = () => {
      text.textContent = CONTENT.email.slice(0, ++count);
      if (count < CONTENT.email.length) timer = setTimeout(next, TIMING.emailTyping / CONTENT.email.length);
    };
    next();
  }
  // The full link and screen-reader text always remain intact.
  if (motionAllowed && 'IntersectionObserver' in window) text.textContent = '';
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    if (entries.some(entry => entry.intersectionRatio >= .25)) { typeEmail(); observer.disconnect(); }
  }, { threshold: .25 }) : null;
  if (observer) observer.observe(panel); else completeTyping();
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
    dispose() { disposed = true; clearTimeout(timer); clearTimeout(resetTimer); observer?.disconnect(); events.abort(); },
  };
}
