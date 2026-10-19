const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..', 'js');

class Element {
  constructor() { this.listeners = {}; this.attrs = {}; this.dataset = {}; this.hidden = false; this.textContent = ''; this.open = false; this.inert = false; this.disabled = false; this.children = {}; this.all = {}; this.classes = new Set(); this.classList = { add: (...x) => x.forEach(v => this.classes.add(v)), remove: (...x) => x.forEach(v => this.classes.delete(v)), toggle: (v,on) => { if(on === undefined) on = !this.classes.has(v); on ? this.classes.add(v) : this.classes.delete(v); }, contains: v => this.classes.has(v) }; this.style = { setProperty(key,value) { this[key] = value; }, removeProperty(key) { delete this[key]; } }; this.clientWidth=1000; this.clientHeight=800; }
  addEventListener(type, fn, options = {}) { (this.listeners[type] ||= []).push(fn); options.signal?.addEventListener('abort', () => this.removeEventListener(type, fn)); }
  removeEventListener(type, fn) { this.listeners[type] = (this.listeners[type] || []).filter(x => x !== fn); }
  emit(type, data = {}) { const event = { target: this, button: 0, preventDefault() { this.defaultPrevented = true; }, ...data }; for (const fn of this.listeners[type] || []) fn(event); return event; }
  querySelector(key) { return this.children[key]; }
  querySelectorAll(key) { return this.all[key] || []; }
  setAttribute(key, value) { this.attrs[key] = String(value); }
  getAttribute(key) { return this.attrs[key]; }
  hasAttribute(key) { return key in this.attrs; }
  removeAttribute(key) { delete this.attrs[key]; }
  focus() { if (this.doc) this.doc.activeElement = this; this.focused = true; }
  getBoundingClientRect() { return { top: this.top || 0, left: 0, right: 100, bottom: this.bottom ?? 100, width: 100, height: 100 }; }
  contains(node) { return node === this || this.descendants?.includes(node); }
  getContext() { return null; }
  matches() { return false; }
  closest() { return this; }
  showModal() { this.open = true; }
  close() { this.open = false; this.emit('close'); }
}
function fixture() {
  const scripts = [];
  const doc = new Element();
  const nodes = new Map();
  doc.hidden = false;
  doc.getElementById = id => {
    if (!nodes.has(id)) { const el = new Element(); el.doc = doc; nodes.set(id, el); }
    return nodes.get(id);
  };
  doc.documentElement = new Element();
  doc.head = { append: el => scripts.push(el) };
  doc.createElement = () => new Element();
  doc.createRange = () => ({ selectNodeContents(el) { doc.selected = el.textContent; } });
  let time = 0, next = 1, reducedMotion = false;
  const timers = new Map();
  const setTimeout = (fn, delay = 0) => { const id = next++; timers.set(id, { at: time + delay, fn }); return id; };
  const setInterval = (fn, delay = 1000) => {
    const id = next++, interval = Math.max(1, Number(delay) || 1);
    timers.set(id, { at: time + interval, fn, interval });
    return id;
  };
  const clearTimer = id => timers.delete(id);
  const advance = duration => {
    const limit = time + duration;
    let guard = 0;
    while (true) {
      const entry = [...timers].filter(([, timer]) => timer.at <= limit).sort((a, b) => a[1].at - b[1].at)[0];
      if (!entry) break;
      assert(++guard < 10000);
      const [id, timer] = entry;
      time = timer.at;
      if (timer.interval) { timer.at += timer.interval; timers.set(id, timer); }
      else timers.delete(id);
      timer.fn();
    }
    time = limit;
  };
  const values = new Map(), sessionValues = new Map();
  const location = { hash: '', search: '', pathname: '/my-portfolio/', href: 'https://example.test/my-portfolio/' };
  const setLocation = value => {
    const url = new URL(value, location.href);
    location.hash = url.hash; location.search = url.search; location.pathname = url.pathname; location.href = url.href;
  };
  const history = {
    state: null,
    pushState(_state, _title, url) { setLocation(url); },
    replaceState(_state, _title, url) { setLocation(url); }
  };
  const mediaListeners = new Set();
  const matchMedia = query => query.includes('prefers-reduced-motion')
    ? { get matches() { return reducedMotion; }, addEventListener(type, fn) { if (type === 'change') mediaListeners.add(fn); }, removeEventListener(type, fn) { mediaListeners.delete(fn); } }
    : { matches: false, addEventListener() {}, removeEventListener() {} };
  const setReducedMotion = value => {
    reducedMotion = value;
    for (const listener of mediaListeners) listener({ matches: value });
  };
  const observers = [];
  class IO {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe(target) { this.target = target; }
    unobserve() {}
    disconnect() { this.disconnected = true; }
    send(ratio) { this.callback([{ target: this.target, intersectionRatio: ratio, isIntersecting: ratio > 0 }]); }
  }
  const win = new Element();
  win.scrollY = 0; win.innerHeight = 900; win.innerWidth = 1300;
  win.scrollTo = ({ top }) => { win.scrollY = top; };
  win.getSelection = () => ({ removeAllRanges() {}, addRange() {} });
  win.location = location; win.history = history;
  win.setTimeout = setTimeout; win.clearTimeout = clearTimer;
  win.setInterval = setInterval; win.clearInterval = clearTimer;
  win.matchMedia = matchMedia;
  win.requestAnimationFrame = fn => setTimeout(() => fn(time), 16);
  win.cancelAnimationFrame = clearTimer;
  win.IntersectionObserver = IO;
  const context = vm.createContext({
    matchMedia, window: win, document: doc, navigator: { clipboard: { writeText: async () => {} } },
    location, history, URL, URLSearchParams, performance: { now: () => time },
    AbortController, EventTarget, Event, console, setTimeout, clearTimeout: clearTimer,
    setInterval, clearInterval: clearTimer, IntersectionObserver: IO,
    localStorage: { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value) },
    sessionStorage: { getItem: key => sessionValues.get(key) || null, setItem: (key, value) => sessionValues.set(key, value) },
    requestAnimationFrame: fn => setTimeout(() => fn(time), 16), cancelAnimationFrame: clearTimer
  });
  const cache = new Map();
  async function loadModule(file) {
    if (cache.has(file)) return cache.get(file);
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    const mod = new vm.SourceTextModule(source, { context, identifier: file });
    cache.set(file, mod);
    await mod.link(relative => loadModule(path.basename(relative).split('?')[0]));
    await mod.evaluate();
    return mod;
  }
  const load = async file => (await loadModule(file)).namespace;
  return { doc, nodes, win, values, sessionValues, timers, advance, observers, scripts, load, context, setReducedMotion };
}
const flush = async () => { for(let i=0;i<12;i++)await Promise.resolve(); };

function phase2Fixture({ search = '', entered = false, storageBlocked = false } = {}) {
  const f = fixture();
  if (search) {
    const url = new URL(search, f.context.location.href);
    f.context.location.search = url.search;
    f.context.location.href = url.href;
  }
  const root = f.doc.getElementById('phase2-gate');
  const page = f.doc.getElementById('page');
  root.hidden = true;
  const skip = new Element(); skip.doc = f.doc;
  const loginButton = new Element(); loginButton.doc = f.doc;
  const loginLabel = new Element();
  loginButton.children['[data-p2-login-label]'] = loginLabel;
  const loginLayer = new Element(); loginLayer.inert = true; loginLayer.setAttribute('aria-hidden', 'true');
  const clockReadout = new Element(), widgetClock = new Element(), widgetDate = new Element();
  const bootStatus = new Element(), decodeReadout = new Element();
  root.children['[data-p2-skip]'] = skip;
  root.children['[data-p2-login]'] = loginButton;
  root.children['[data-p2-login-layer]'] = loginLayer;
  root.children['[data-p2-clock]'] = clockReadout;
  root.children['[data-p2-widget-clock]'] = widgetClock;
  root.children['[data-p2-widget-date]'] = widgetDate;
  root.children['[data-p2-boot-status]'] = bootStatus;
  root.children['[data-p2-decode]'] = decodeReadout;
  root.descendants = [skip, loginButton, loginLayer];
  const bar = new Element(); bar.dataset.p2Bar = '64';
  const fill = new Element(), barValue = new Element();
  bar.children['.phase2-gate__fill'] = fill;
  bar.children['[data-p2-bar-value]'] = barValue;
  const counter = new Element(); counter.dataset.p2Count = '0'; counter.dataset.p2Digits = '3';
  const ring = new Element(); ring.dataset.p2Ring = '72'; ring.children['[data-p2-ring-value]'] = new Element();
  root.all['[data-p2-bar]'] = [bar];
  root.all['[data-p2-fill]'] = [fill];
  root.all['[data-p2-count]'] = [counter];
  root.all['[data-p2-ring]'] = [ring];
  if (entered) f.sessionValues.set('ztrace-phase2-entered', '1');
  if (storageBlocked) {
    f.context.sessionStorage.getItem = () => { throw new Error('storage blocked'); };
    f.context.sessionStorage.setItem = () => { throw new Error('storage blocked'); };
  }
  return { ...f, root, page, skip, loginButton, loginLabel, loginLayer, fill, barValue, counter, ring };
}
async function clockFor(f) { return (await f.load('motion.js')).createClock(); }
function contactFixture() { const f=fixture(); f.doc.getElementById('copy-email').children.span=new Element(); return f; }
async function run() {
  let checks=0;
  {
    const site=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
    assert.match(site,/id="workbench"/);
    assert.match(site,/href="#workbench"/);
    assert.match(site,/portfolio-refresh\.css\?v=20261018\.3/);
    assert.match(site,/motion-polish\.css\?v=20261018\.5/);
    const motionCss=fs.readFileSync(path.join(__dirname,'..','css','motion-polish.css'),'utf8');
    const tokens=fs.readFileSync(path.join(__dirname,'..','css','tokens.css'),'utf8');
    assert.match(tokens,/--motion-reveal-duration:\s*560ms/);
    assert.match(tokens,/--motion-cursor-follow:\s*95ms/);
    assert.match(tokens,/--motion-intro-duration:\s*5\.2s/);
    assert.match(motionCss,/animation-duration:\s*var\(--motion-intro-duration\)/);
    assert.match(motionCss,/html\.motion-off/);
    assert.match(motionCss,/prefers-reduced-motion:\s*reduce/);
    assert.match(motionCss,/page-paused/);
    assert.match(motionCss,/animation-iteration-count:\s*1/);
    assert.match(site,/Authorized lab journal/);
    checks++;
  }
  {
    const f = phase2Fixture(), mod = await f.load('phase2-gate.js');
    const controller = mod.initPhase2Gate({ motionAllowed: true });
    assert(f.page.inert && !f.root.hidden && f.skip.focused);
    f.advance(3700);
    assert(f.root.classList.contains('is-login-ready'));
    assert(!f.loginLayer.inert && f.loginButton.focused);
    assert.equal(f.fill.style.width, '64%');
    assert.equal(f.counter.textContent, '000');
    f.loginButton.emit('click');
    assert(f.loginButton.disabled);
    assert.equal(f.loginLabel.textContent, 'ACCESS GRANTED');
    f.advance(1000);
    await controller.completed;
    assert(f.root.hidden && !f.page.inert);
    assert.equal(f.sessionValues.get('ztrace-phase2-entered'), '1');
    assert.equal(f.context.location.hash, '#/profile');
    assert.equal(f.timers.size, 0);
    checks++;
  }
  {
    const f = phase2Fixture(), mod = await f.load('phase2-gate.js');
    const controller = mod.initPhase2Gate({ motionAllowed: true });
    f.doc.emit('keydown', { key: 'Escape' });
    assert(f.root.classList.contains('is-login-ready') && !f.loginLayer.inert);
    f.doc.activeElement = f.skip;
    f.doc.emit('keydown', { key: 'Tab' });
    assert.equal(f.doc.activeElement, f.loginButton);
    f.doc.emit('keydown', { key: 'Tab', shiftKey: true });
    assert.equal(f.doc.activeElement, f.skip);
    f.doc.emit('keydown', { key: 'Enter' });
    assert(f.root.classList.contains('is-transitioning'));
    assert.equal(f.loginLabel.textContent, 'ACCESS GRANTED');
    f.advance(1000);
    await controller.completed;
    assert(f.root.hidden && f.context.location.hash === '#/profile');
    checks++;
  }
  {
    const f = phase2Fixture({ entered: true }), mod = await f.load('phase2-gate.js');
    const controller = mod.initPhase2Gate({ motionAllowed: true });
    assert(f.root.hidden && !f.page.inert);
    await controller.completed;
    assert.equal(f.timers.size, 0);
    checks++;
  }
  {
    const f = phase2Fixture({ entered: true, search: '?intro=1' }), mod = await f.load('phase2-gate.js');
    const controller = mod.initPhase2Gate({ motionAllowed: true });
    assert(!f.root.hidden);
    assert.equal(f.context.location.search, '');
    controller.cancel();
    await controller.completed;
    assert(f.root.hidden && f.timers.size === 0);
    checks++;
  }
  {
    const f = phase2Fixture(), mod = await f.load('phase2-gate.js');
    f.setReducedMotion(true);
    const controller = mod.initPhase2Gate({ motionAllowed: true });
    assert(f.root.classList.contains('is-login-ready'));
    assert.equal(f.timers.size, 1);
    controller.cancel();
    await controller.completed;
    assert.equal(f.timers.size, 0);
    checks++;
  }
  {
    const f = phase2Fixture({ storageBlocked: true }), mod = await f.load('phase2-gate.js');
    const controller = mod.initPhase2Gate({ motionAllowed: true });
    f.doc.emit('keydown', { key: 'Escape' });
    f.loginButton.emit('click');
    f.advance(1000);
    await controller.completed;
    assert(f.root.hidden && !f.page.inert);
    assert.equal(f.timers.size, 0);
    checks++;
  }
  {
    const f = phase2Fixture(), mod = await f.load('phase2-gate.js');
    const controller = mod.initPhase2Gate({ motionAllowed: true });
    f.advance(500);
    const before = f.fill.style.width;
    f.doc.hidden = true;
    f.doc.emit('visibilitychange');
    assert(f.doc.documentElement.classList.contains('phase2-paused'));
    f.advance(1000);
    assert.equal(f.fill.style.width, before);
    f.doc.hidden = false;
    f.doc.emit('visibilitychange');
    assert(!f.doc.documentElement.classList.contains('phase2-paused'));
    f.advance(3300);
    assert(f.root.classList.contains('is-login-ready'));
    controller.cancel();
    await controller.completed;
    assert.equal(f.timers.size, 0);
    checks++;
  }
  {
    const f=fixture(),clock=await clockFor(f);let frames=0;const un=clock.subscribe(()=>frames++);f.advance(32);assert.equal(frames,2);
    f.doc.hidden=true;f.doc.emit('visibilitychange');assert.equal(f.timers.size,0);f.advance(1000);assert.equal(frames,2);
    f.doc.hidden=false;f.doc.emit('visibilitychange');f.advance(16);assert.equal(frames,3);un();assert.equal(f.timers.size,0);clock.dispose();checks++;
  }
  {
    const f=contactFixture(),clock=await clockFor(f);let copied,release;f.context.navigator.clipboard.writeText=value=>{copied=value;return new Promise(resolve=>release=resolve);};
    const mod=await f.load('contact.js');mod.initContact({motionAllowed:true,clock});f.observers[0].send(.3);f.advance(120);assert(f.doc.getElementById('email-text').textContent.length<19);
    const button=f.doc.getElementById('copy-email');button.emit('click');button.emit('click');assert.equal(copied,'ztrace054@gmail.com');assert(button.disabled);release();await flush();assert.equal(button.children.span.textContent,'Copied! ✓');f.advance(1800);assert.equal(button.children.span.textContent,'Copy');clock.dispose();checks++;
  }
  {
    const f=contactFixture(),clock=await clockFor(f);f.context.navigator.clipboard.writeText=async()=>{throw Error('Permission denied');};const mod=await f.load('contact.js');mod.initContact({motionAllowed:true,clock});f.doc.getElementById('copy-email').emit('click');await flush();assert.equal(f.doc.selected,'ztrace054@gmail.com');assert(!f.doc.getElementById('copy-email').classList.contains('is-copied'));assert(f.doc.getElementById('copy-feedback').textContent.includes('Copy unavailable'));clock.dispose();checks++;
  }
  {
    const f=contactFixture(),clock=await clockFor(f),mod=await f.load('contact.js'),controller=mod.initContact({motionAllowed:true,clock});f.observers[0].send(.3);f.advance(120);f.observers[0].send(0);const partial=f.doc.getElementById('email-text').textContent;f.advance(1000);assert.equal(f.doc.getElementById('email-text').textContent,partial);controller.setMotion(false);assert.equal(f.doc.getElementById('email-text').textContent,'ztrace054@gmail.com');controller.dispose();clock.dispose();checks++;
  }
  for (const ending of ['complete','reduce','focus']) {
    const f=fixture(),terminal=f.doc.getElementById('identity-terminal');const commands=['whoami','cat status.txt','ls ./connect'].map(text=>{const e=new Element();e.dataset.typeCommand=text;e.textContent=text;return e;});const outputs=Array.from({length:3},()=>new Element());terminal.all['[data-type-command]']=commands;terminal.all['[data-terminal-output]']=outputs;
    const clock=await clockFor(f),mod=await f.load('terminal.js'),controller=mod.initTerminal({clock,motionAllowed:true});f.observers[0].send(.5);f.advance(200);assert.equal(outputs[2].style.opacity,'0');
    if(ending==='reduce')controller.setMotion(false);else if(ending==='focus')terminal.emit('focusin');else { f.observers[0].send(0);const partial=commands[0].textContent;f.advance(500);assert.equal(commands[0].textContent,partial);f.observers[0].send(.5);f.advance(3100); }
    commands.forEach(c=>assert.equal(c.textContent,c.dataset.typeCommand));outputs.forEach(o=>assert.equal(o.style.opacity,undefined));assert.equal(f.timers.size,0);controller.dispose();clock.dispose();checks++;
  }
  {
    const f=fixture(),trigger=new Element();trigger.doc=f.doc;trigger.dataset.galleryItem='0';f.doc.all['[data-gallery-item]']=[trigger];let locks=0,unlocks=0;const mod=await f.load('gallery.js');mod.initGallery({overlays:{lock(){locks++;},unlock(){unlocks++;}}});trigger.emit('click');assert(f.doc.getElementById('photo-viewer').open);f.doc.getElementById('viewer-prev').emit('click');assert.equal(f.doc.getElementById('viewer-index').textContent,'02 / 02');f.doc.getElementById('photo-viewer').emit('keydown',{key:'ArrowRight'});assert.equal(f.doc.getElementById('viewer-index').textContent,'01 / 02');f.doc.getElementById('viewer-close').emit('click');assert.equal(locks,1);assert.equal(unlocks,1);assert(trigger.focused);checks++;
  }
  {
    const f=fixture(),mod=await f.load('navigation.js'),manager=mod.createOverlayManager({getScroll:()=>null,refresh(){}});f.win.scrollY=1200;const owner={};manager.lock(owner);assert(f.doc.getElementById('page').inert);assert(manager.locked);manager.unlock({});assert(manager.locked);manager.unlock(owner);assert(!manager.locked);assert(!f.doc.getElementById('page').inert);assert.equal(f.win.scrollY,1200);checks++;
  }
  {
    const f=fixture();
    const ids=['home','about','journey','workbench','gallery','contact'];
    const sections=ids.map((id,i)=>{const node=new Element();node.id=id;node.top=i===0?0:700+i*50;return node;});
    f.doc.all['main>section[id]']=sections;
    const desktop=ids.map(id=>{const node=new Element();node.attrs.href='#'+id;return node;});
    const mobile=ids.map(id=>{const node=new Element();node.attrs.href='#'+id;return node;});
    f.doc.all['.desktop-nav a, .mobile-menu nav a']=[...desktop,...mobile];
    f.doc.getElementById('site-header').offsetHeight=80;
    const menu=f.doc.getElementById('mobile-menu');menu.children['nav a']=new Element();
    const toggle=f.doc.getElementById('menu-toggle');
    const mod=await f.load('navigation.js'),overlays=mod.createOverlayManager({getScroll:()=>null,refresh(){}});
    const controller=mod.initNavigation({getScroll:()=>null,getMotion:()=>false,overlays});
    f.advance(16);
    assert.equal(desktop[0].getAttribute('aria-current'),'location');
    assert.equal(mobile[0].getAttribute('aria-current'),'location');
    sections[0].top=-900;sections[1].top=-120;sections[2].top=500;
    f.win.scrollY=900;f.win.emit('scroll');f.advance(16);
    assert.equal(desktop[1].getAttribute('aria-current'),'location');
    assert.equal(mobile[1].getAttribute('aria-current'),'location');
    toggle.emit('click');
    assert.equal(toggle.getAttribute('aria-expanded'),'true');
    assert.equal(toggle.getAttribute('aria-label'),'Close navigation');
    menu.emit('cancel');
    assert.equal(toggle.getAttribute('aria-expanded'),'false');
    assert.equal(toggle.getAttribute('aria-label'),'Open navigation');
    controller.dispose();f.advance(100);assert.equal(f.timers.size,0);checks++;
  }
  {
    const f=fixture(), timeline=new Element();
    timeline.doc=f.doc;
    timeline.style.setProperty('--journey-progress','0%');
    timeline.getBoundingClientRect=()=>({top:1000-f.win.scrollY,bottom:2000-f.win.scrollY,height:1000,left:0,right:500,width:500});
    const fill=new Element();timeline.children['[data-journey-progress]']=fill;
    const cards=[0,1,2].map(i=>{const card=new Element();card.getBoundingClientRect=()=>({top:1050+i*350-f.win.scrollY,bottom:1150+i*350-f.win.scrollY,height:100,left:0,right:400,width:400});return card;});
    timeline.all['.phase-card']=cards;f.doc.children['[data-journey-timeline]']=timeline;
    const mod=await f.load('journey.js'),controller=mod.initJourney({motionAllowed:true});
    assert.equal(timeline.style['--journey-progress'],'0%');
    f.win.scrollY=1000;f.win.emit('scroll');f.advance(16);
    const mid=Number.parseFloat(timeline.style['--journey-progress']);
    assert(mid>0&&mid<100);assert.equal(timeline.dataset.progress,String(Math.round(mid)));
    assert(cards[1].classes.has('is-active'));assert(!cards[0].classes.has('is-active'));
    controller.setMotion(false);assert(timeline.classes.has('motion-off'));
    f.win.scrollY=3000;f.win.emit('scroll');f.advance(16);
    assert.equal(timeline.style['--journey-progress'],'100%');
    controller.dispose();f.advance(32);assert.equal(f.timers.size,0);checks++;
  }
  console.log(`PASS: ${checks} interaction checks (Phase 2 boot/login/keyboard/replay/session/reduced-motion/storage/visibility plus timeline, terminal, clipboard, gallery, and navigation).`);
}
// A stalled promise must fail, rather than letting Node exit with a misleading zero code.
const watchdog=setTimeout(()=>{console.error('FAIL: interaction suite did not complete');process.exit(1);},5000);
run().then(()=>clearTimeout(watchdog)).catch(error=>{clearTimeout(watchdog);console.error(error);process.exitCode=1;});
