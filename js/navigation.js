/* One overlay lock and one anchor controller are shared by menu and gallery. */
export function createOverlayManager({ getScroll, refresh }) {
  const page = document.getElementById('page');
  let active = null;
  let position = 0;
  return {
    get locked() { return Boolean(active); },
    lock(owner) {
      if (active) return;
      active = owner;
      position = window.scrollY;
      getScroll()?.stop();
      page.inert = true;
      document.documentElement.classList.add('is-locked');
    },
    unlock(owner) {
      if (active !== owner) return;
      active = null;
      page.inert = false;
      document.documentElement.classList.remove('is-locked');
      window.scrollTo({ top: position, behavior: 'instant' });
      getScroll()?.start();
      refresh();
    },
  };
}

export function initNavigation({ getScroll, getMotion, overlays }) {
  const events = new AbortController();
  const menu = document.getElementById('mobile-menu');
  const toggle = document.getElementById('menu-toggle');
  const close = document.getElementById('menu-close');
  const header = document.getElementById('site-header');
  const mobile = matchMedia('(max-width: 900px)');
  const sections = [...document.querySelectorAll('main>section[id]')];
  let focusTimer;
  let activeFrame = 0;
  let returnFocus = true;

  function setMenuState(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  }

  function closeMenu(restore = true) {
    returnFocus = restore;
    if (menu.open) menu.close();
    overlays.unlock(menu);
    setMenuState(false);
    if (restore) toggle.focus({ preventScroll: true });
  }

  toggle.addEventListener('click', () => {
    if (typeof menu.showModal !== 'function') { location.hash = '#about'; return; }
    returnFocus = true;
    overlays.lock(menu);
    try { menu.showModal(); } catch { overlays.unlock(menu); return; }
    setMenuState(true);
    menu.querySelector('nav a')?.focus();
  }, { signal: events.signal });

  close.addEventListener('click', () => closeMenu(), { signal: events.signal });
  menu.addEventListener('cancel', event => { event.preventDefault(); closeMenu(); }, { signal: events.signal });
  menu.addEventListener('close', () => {
    overlays.unlock(menu);
    setMenuState(false);
    if (returnFocus) toggle.focus({ preventScroll: true });
  }, { signal: events.signal });

  function goTo(hash, push = true) {
    let target;
    try { target = document.querySelector(hash); } catch { return; }
    if (!target) return;
    if (menu.open) closeMenu(false);
    clearTimeout(focusTimer);
    const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - header.offsetHeight - 24);
    if (push && location.hash !== hash) history.pushState(null, '', hash);
    const heading = target.matches('h1,h2,[tabindex]') ? target : target.querySelector('h1,h2') || target;
    const focusTarget = () => {
      const hadTabindex = heading.hasAttribute('tabindex');
      if (!hadTabindex) heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
      if (!hadTabindex) heading.addEventListener('blur', () => heading.removeAttribute('tabindex'), { once: true });
    };
    const smooth = getScroll();
    if (smooth) smooth.scrollTo(top, { duration: .95, onComplete: focusTarget });
    else {
      window.scrollTo({ top, behavior: getMotion() ? 'smooth' : 'instant' });
      focusTimer = setTimeout(focusTarget, getMotion() ? 650 : 0);
    }
    scheduleActiveSection();
  }

  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[href^="#"]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    const hash = link.getAttribute('href');
    if (hash.length < 2) return;
    event.preventDefault();
    goTo(hash);
  }, { signal: events.signal });

  window.addEventListener('popstate', () => {
    if (location.hash) goTo(location.hash, false);
    else window.scrollTo({ top: 0, behavior: 'instant' });
    scheduleActiveSection();
  }, { signal: events.signal });

  const onBreakpoint = () => { if (!mobile.matches && menu.open) closeMenu(); };
  mobile.addEventListener('change', onBreakpoint);

  function updateActiveSection() {
    activeFrame = 0;
    if (!sections.length) return;
    const activationLine = header.offsetHeight + Math.min(window.innerHeight * 0.32, 260);
    let active = sections[0];
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= activationLine) active = section;
      else break;
    }
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
      active = sections[sections.length - 1];
    }
    const currentHash = '#' + active.id;
    document.querySelectorAll('.desktop-nav a, .mobile-menu nav a').forEach(link => {
      if (link.getAttribute('href') === currentHash) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }

  function scheduleActiveSection() {
    if (activeFrame) return;
    if (typeof requestAnimationFrame === 'function') activeFrame = requestAnimationFrame(updateActiveSection);
    else activeFrame = setTimeout(updateActiveSection, 16);
  }

  const onScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 20);
    scheduleActiveSection();
  };
  window.addEventListener('scroll', onScroll, { passive: true, signal: events.signal });
  window.addEventListener('resize', scheduleActiveSection, { passive: true, signal: events.signal });
  onScroll();

  return {
    goTo,
    dispose() {
      closeMenu(false);
      events.abort();
      mobile.removeEventListener('change', onBreakpoint);
      clearTimeout(focusTimer);
      if (activeFrame) {
        if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(activeFrame);
        else clearTimeout(activeFrame);
      }
    },
  };
}
