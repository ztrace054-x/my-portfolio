const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..', 'js');

class Element {
  constructor() { this.listeners = {}; this.attrs = {}; this.dataset = {}; this.hidden = false; this.textContent = ''; this.open = false; this.inert = false; this.disabled = false; this.children = {}; this.all = {}; this.classes = new Set(); this.classList = { add: (...x) => x.forEach(v => this.classes.add(v)), remove: (...x) => x.forEach(v => this.classes.delete(v)), toggle: (v,on) => { if(on === undefined) on = !this.classes.has(v); on ? this.classes.add(v) : this.classes.delete(v); }, contains: v => this.classes.has(v) }; this.style = { removeProperty() {} }; }
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
  matches() { return false; }
  closest() { return this; }
  showModal() { this.open = true; }
  close() { this.open = false; this.emit('close'); }
}
function fixture() {
  const doc = new Element();
  const nodes = new Map();
  doc.getElementById = id => { if(!nodes.has(id)){ const el = new Element(); el.doc = doc; nodes.set(id,el); } return nodes.get(id); };
  doc.documentElement = new Element();
  doc.head = { append: el => scripts.push(el) };
  doc.createElement = () => new Element();
  doc.createRange = () => ({ selectNodeContents(el) { doc.selected = el.textContent; } });
  let time=0, next=1;
  const timers = new Map();
  const setTimeout = (fn,delay=0) => { const id=next++;timers.set(id,{at:time+delay,fn});return id; };
  const clearTimeout = id => timers.delete(id);
  const advance = duration => { const limit=time+duration; let guard=0; while(true){ const entry=[...timers].filter(([,t])=>t.at<=limit).sort((a,b)=>a[1].at-b[1].at)[0]; if(!entry)break; assert(++guard<5000); const [id,t]=entry;time=t.at;timers.delete(id);t.fn(); }time=limit; };
  const values = new Map();
  const observers=[];
  class IO { constructor(callback){ this.callback=callback; observers.push(this); } observe(){} disconnect(){this.disconnected=true;} send(ratio){this.callback([{intersectionRatio:ratio,isIntersecting:ratio>0}]);} }
  const win = new Element();
  win.scrollY=0;
  win.innerHeight=900; win.innerWidth=1300;
  win.scrollTo = ({top}) => { win.scrollY=top; };
  win.getSelection = () => ({ removeAllRanges(){},addRange(){} });
  win.IntersectionObserver=IO;
  const scripts=[];
  const context = vm.createContext({ window:win,document:doc,navigator:{clipboard:{writeText:async()=>{}}},location:{hash:''},history:{pushState(){}},performance:{now:()=>time},AbortController,console,setTimeout,clearTimeout,IntersectionObserver:IO,localStorage:{getItem:key=>values.get(key)||null,setItem:(key,v)=>values.set(key,v)},requestAnimationFrame:fn=>setTimeout(()=>fn(time),16),cancelAnimationFrame:clearTimeout,matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}}) });
  const cache = new Map();
  async function loadModule(file) { if(cache.has(file))return cache.get(file); let source=fs.readFileSync(path.join(root,file),'utf8'); if(file==='main.js')source=source.split('// Bind native functionality before contacting a CDN.')[0];const mod=new vm.SourceTextModule(source,{context,identifier:file});cache.set(file,mod); await mod.link(relative=>loadModule(path.basename(relative)));await mod.evaluate();return mod; }
  const load = async file => (await loadModule(file)).namespace;
  return {doc,nodes,win,values,timers,advance,observers,scripts,load,context};
}
const flush = async () => { for(let i=0;i<12;i++)await Promise.resolve(); };

(async()=>{
  let checks=0;
  // First visit types sequentially, completes automatically, and releases inert content.
  {
    const f=fixture(), intro=f.doc.getElementById('intro'),page=f.doc.getElementById('page');
    intro.hidden=true;
    const lines=['Loading identity...','Loading curiosity...','Loading cybersecurity journey...'].map(text=>{const e=new Element();e.dataset.bootLine=text;return e;});
    intro.all['[data-boot-line]']=lines;
    const mod=await f.load('intro.js'); const controller=mod.initIntro({motionAllowed:true});
    assert(page.inert && !intro.hidden); f.advance(200);assert(lines[0].textContent.length>0 && lines[1].textContent==='');
    f.advance(1700); await controller.completed;assert(intro.hidden && !page.inert);assert.equal(f.values.get('saad-visited-v1'),'yes');assert.equal(f.timers.size,0);checks++;
  }
  // Skip is idempotent; cancelled character callbacks cannot reopen the panel.
  {
    const f=fixture(),intro=f.doc.getElementById('intro');intro.all['[data-boot-line]']=[Object.assign(new Element(),{dataset:{bootLine:'Loading identity...'}})];
    const mod=await f.load('intro.js');mod.initIntro({motionAllowed:true});f.advance(250);f.doc.getElementById('skip-intro').emit('click');f.advance(320);assert(intro.hidden);f.advance(4000);assert(intro.hidden && !f.doc.getElementById('page').inert);checks++;
  }
  // Returning visitors, deep links and reduced motion bypass without overlay timers.
  for(const mode of ['return','deep','reduce']){
    const f=fixture();if(mode==='return')f.values.set('saad-visited-v1','yes');if(mode==='deep')f.context.location.hash='#contact';
    const mod=await f.load('intro.js');await mod.initIntro({motionAllowed:mode!=='reduce'}).completed;assert(f.doc.getElementById('intro').hidden);assert.equal(f.timers.size,0);checks++;
  }
  function contactFixture() { const f=fixture(); const button=f.doc.getElementById('copy-email');button.children.span=new Element();return f; }
  // Copy always uses the full address during typing, waits for success and resets.
  {
    const f=contactFixture();let copied;let release;f.context.navigator.clipboard.writeText=value=>{copied=value;return new Promise(resolve=>{release=resolve;});};
    const mod=await f.load('contact.js');mod.initContact({motionAllowed:true});const button=f.doc.getElementById('copy-email');f.observers[0].send(.3);f.advance(120);assert(f.doc.getElementById('email-text').textContent.length<17);
    button.emit('click');button.emit('click');assert.equal(copied,'ztrace054@gmail.com');assert.equal(button.children.span.textContent,'Copy');assert(button.disabled);release();await flush();assert.equal(button.children.span.textContent,'Copied! ✓');f.advance(1800);assert.equal(button.children.span.textContent,'Copy');checks++;
  }
  // Rejection never announces success; the full address is selected for manual copy.
  {
    const f=contactFixture();f.context.navigator.clipboard.writeText=async()=>{throw Error('Permission denied');};const mod=await f.load('contact.js');mod.initContact({motionAllowed:true});f.doc.getElementById('copy-email').emit('click');await flush();assert.equal(f.doc.selected,'ztrace054@gmail.com');assert(!f.doc.getElementById('copy-email').classList.contains('is-copied'));assert(f.doc.getElementById('copy-feedback').textContent.includes('Copy unavailable'));checks++;
  }
  // Motion reduction immediately completes a partial reveal.
  {
    const f=contactFixture();const mod=await f.load('contact.js');const controller=mod.initContact({motionAllowed:true});f.observers[0].send(.3);f.advance(120);controller.setMotion(false);assert.equal(f.doc.getElementById('email-text').textContent,'ztrace054@gmail.com');f.advance(1000);assert.equal(f.doc.getElementById('email-text').textContent,'ztrace054@gmail.com');checks++;
  }
  // Gallery wraps in both directions, updates descriptions, unlocks and returns focus.
  {
    const f=fixture(),trigger=new Element();trigger.doc=f.doc;trigger.dataset.galleryItem='0';f.doc.all['[data-gallery-item]']=[trigger];let locks=0,unlocks=0;const mod=await f.load('gallery.js');mod.initGallery({overlays:{lock(){locks++;},unlock(){unlocks++;}}});trigger.emit('click');assert(f.doc.getElementById('photo-viewer').open);f.doc.getElementById('viewer-prev').emit('click');assert.equal(f.doc.getElementById('viewer-index').textContent,'03 / 03');f.doc.getElementById('photo-viewer').emit('keydown',{key:'ArrowRight'});assert.equal(f.doc.getElementById('viewer-index').textContent,'01 / 03');f.doc.getElementById('viewer-close').emit('click');assert.equal(locks,1);assert.equal(unlocks,1);assert(trigger.focused);checks++;
  }
  // Lenis has one ticker subscription and is completely disposed.
  {
    const f=fixture();const mod=await f.load('smooth-scroll.js');const ticks=new Set();let raf, destroyed=false,updated=0;
    class Lenis {constructor(){this.events={};}on(key,fn){this.events[key]=fn;}off(key){delete this.events[key];}raf(ms){raf=ms;}destroy(){destroyed=true;}}
    const gsap={ticker:{add:fn=>ticks.add(fn),remove:fn=>ticks.delete(fn),lagSmoothing(){}}};const installed=mod.installSmoothScroll({gsap,ScrollTrigger:{update(){updated++;}},Lenis,enabled:true});assert.equal(ticks.size,1);[...ticks][0](2);assert.equal(raf,2000);installed.instance.events.scroll();assert.equal(updated,1);installed.dispose();assert(destroyed);assert.equal(ticks.size,0);checks++;
  }
  // Optional dependencies time out; a late GSAP callback cannot start more loading.
  {
    const f=fixture();const mod=await f.load('main.js');const result=mod.loadDependencies();f.advance(2500);await flush();assert.equal(await result,null);const gsapScript=f.scripts.find(x=>x.src?.includes('gsap.min'));gsapScript.onload();await flush();assert.equal(f.scripts.filter(x=>x.src?.includes('ScrollTrigger')).length,0);checks++;
  }
  // The shared clock never leaves native RAF running after switching to a ticker.
  {
    const f=fixture();const mod=await f.load('main.js');const clock=mod.createClock();let frames=0;const un=clock.subscribe(()=>frames++);assert.equal(f.timers.size,1);f.advance(16);assert.equal(frames,1);const ticks=new Set();clock.setTicker({add:fn=>ticks.add(fn),remove:fn=>ticks.delete(fn)});assert.equal(f.timers.size,0);assert.equal(ticks.size,1);un();assert.equal(ticks.size,0);clock.dispose();checks++;
  }
  // Layout-based preservation ignores an overlapping photo hit target.
  {
    const f=fixture();f.doc.documentElement.clientHeight=936;
    const gallery=Object.assign(new Element(),{top:-61,bottom:190});
    const contact=Object.assign(new Element(),{top:289,bottom:925});
    f.doc.all['main > section']=[gallery,contact];f.win.scrollY=1000;
    f.win.scrollTo=({top})=>{contact.top-=top-f.win.scrollY;contact.bottom-=top-f.win.scrollY;f.win.scrollY=top;};
    const mod=await f.load('viewport.js');const preserve=mod.createViewportPreserver({getScroll:()=>null});
    preserve(()=>{contact.top+=480;contact.bottom+=480;});f.advance(16);
    assert.equal(contact.top,289);assert.equal(f.win.scrollY,1480);checks++;
  }
  // Pin creation also preserves the section and resynchronizes Lenis immediately.
  {
    const f=fixture();f.doc.documentElement.clientHeight=936;f.win.scrollY=1000;
    const contact=Object.assign(new Element(),{top:289,bottom:925});f.doc.all['main > section']=[contact];
    let options;
    const smooth={scrollTo(top,opts){options=opts;contact.top-=top-f.win.scrollY;contact.bottom-=top-f.win.scrollY;f.win.scrollY=top;}};
    const mod=await f.load('viewport.js');const preserve=mod.createViewportPreserver({getScroll:()=>smooth});
    preserve(()=>{contact.top+=1497;contact.bottom+=1497;});f.advance(16);
    assert.equal(contact.top,289);assert.equal(options.immediate,true);assert.equal(options.force,true);checks++;
  }
  console.log(`PASS: ${checks} interaction checks (intro, cancellation, preferences, clipboard, gallery, dependency deadline, Lenis cleanup, shared clock).`);
})().catch(error=>{console.error(error);process.exit(1);});
