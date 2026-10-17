export function initTerminal({ clock, motionAllowed }) {
  const terminal = document.getElementById('identity-terminal');
  const commands = [...terminal.querySelectorAll('[data-type-command]')];
  const outputs = [...terminal.querySelectorAll('[data-terminal-output]')];
  const events = new AbortController();
  let enabled = motionAllowed, completed = false, prepared = false, visible = false, elapsed = 0, unsubscribe;
  function finish() {
    completed = true; unsubscribe?.(); unsubscribe = null;
    commands.forEach(node => { node.textContent = node.dataset.typeCommand; node.classList.remove('is-typing'); });
    outputs.forEach(node => { node.style.removeProperty('opacity'); node.style.removeProperty('pointer-events'); });
  }
  function reconcile() {
    if (!enabled || completed) return;
    if (!visible) { unsubscribe?.(); unsubscribe = null; return; }
    if (!prepared) {
      prepared = true;
      commands.forEach(node => { node.textContent = ''; });
      outputs.forEach(node => { node.style.opacity = '0'; node.style.pointerEvents = 'none'; });
    }
    if (!unsubscribe) unsubscribe = clock.subscribe((_time, dt) => {
      elapsed += dt;
      commands.forEach((node, index) => {
        const local = elapsed - index * 1050;
        const count = Math.floor(Math.max(0, local) / 35);
        node.textContent = node.dataset.typeCommand.slice(0, count);
        node.classList.toggle('is-typing', local > 0 && local < 760);
        outputs[index].style.opacity = String(Math.max(0, Math.min(1, (local - 580) / 180)));
        if (local >= 760) outputs[index].style.removeProperty('pointer-events');
      });
      if (elapsed >= 3000) finish();
    });
  }
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); reconcile(); }, { threshold: .2 }) : null;
  if (observer && enabled) observer.observe(terminal); else finish();
  // Keyboard users never encounter an invisible social link while it is being revealed.
  terminal.addEventListener('focusin', finish, { signal: events.signal });
  return {
    setMotion(allowed) { enabled = allowed; if (!allowed) finish(); else reconcile(); },
    dispose() { finish(); observer?.disconnect(); events.abort(); },
  };
}
