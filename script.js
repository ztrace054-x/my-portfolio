/* ==========================================================================
   SAAD // cybersecurity journey: script.js
   Vanilla JavaScript. No libraries, no network requests, no build step.
   Every feature starts inside guard() so one failure can never break the page.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js');

  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var guard = function (name, fn) {
    try { return fn(); } catch (err) { if (window.console) console.warn('[saad] ' + name + ' skipped:', err); }
  };
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }
  };

  /* ------------------------------------------------------------------------
     MOTION PREFERENCE (OS setting + the "Motion on/off" button)
     ------------------------------------------------------------------------ */
  var osReduced = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var motion = { on: true, listeners: [] };

  function applyMotion() {
    var userOff = store.get('saad-motion') === 'off';
    motion.on = !osReduced.matches && !userOff;
    root.classList.toggle('motion-off', !motion.on);
    var btn = $('#motion-toggle');
    if (btn) {
      btn.setAttribute('aria-pressed', String(motion.on));
      btn.setAttribute('aria-label', motion.on ? 'Turn animations off' : 'Turn animations on');
      btn.disabled = osReduced.matches;
      var label = $('#motion-label');
      if (label) label.textContent = motion.on ? 'Motion on' : 'Motion off';
    }
    motion.listeners.forEach(function (fn) { guard('motion listener', function () { fn(motion.on); }); });
  }

  /* ------------------------------------------------------------------------
     MATRIX RAIN (shared by the intro and the hero background)
     ------------------------------------------------------------------------ */
  function createRain(canvas, o) {
    var ctx = canvas.getContext('2d');
    if (!ctx) return null;
    var opt = Object.assign({ size: 16, fps: 22, fade: .07, head: '#d6ffe8', body: '#85e9ad', speed: 1 }, o || {});
    var glyphs = '01ABCDEF<>/{}[]$#=+*'.split('');
    var pick = function () { return glyphs[(Math.random() * glyphs.length) | 0]; };
    var w = 0, h = 0, cols = 0, drops = [], rate = [], prevRow = [], prevGlyph = [], raf = 0, last = 0, running = false;

    function resize() {
      var r = canvas.getBoundingClientRect();
      w = canvas.width = Math.max(1, Math.round(r.width));
      h = canvas.height = Math.max(1, Math.round(r.height));
      cols = Math.ceil(w / opt.size);
      drops = []; rate = []; prevRow = []; prevGlyph = [];
      for (var i = 0; i < cols; i++) {
        drops.push(-Math.random() * (h / opt.size) * .9);
        rate.push((.45 + Math.random() * .55) * opt.speed);   /* rows per step, always <= 1 */
        prevRow.push(-1); prevGlyph.push('0');
      }
      ctx.font = opt.size + 'px "JetBrains Mono", monospace';
      ctx.textBaseline = 'top';
    }
    function step() {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,' + opt.fade + ')';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
      var rows = h / opt.size;
      for (var i = 0; i < cols; i++) {
        drops[i] += rate[i];
        var row = Math.floor(drops[i]);
        if (row !== prevRow[i] && row >= 0) {
          if (prevRow[i] >= 0) { ctx.fillStyle = opt.body; ctx.fillText(prevGlyph[i], i * opt.size, prevRow[i] * opt.size); }
          var g = pick();
          ctx.fillStyle = opt.head; ctx.fillText(g, i * opt.size, row * opt.size);
          prevRow[i] = row; prevGlyph[i] = g;
        }
        if (row > rows && Math.random() > .96) { drops[i] = -Math.random() * 12; prevRow[i] = -1; }
      }
    }
    function frame(t) {
      raf = requestAnimationFrame(frame);
      if (t - last < 1000 / opt.fps) return;
      last = t;
      step();
    }
    return {
      resize: resize,
      start: function () { if (running) return; running = true; resize(); raf = requestAnimationFrame(frame); },
      stop: function () { running = false; cancelAnimationFrame(raf); },
      clear: function () { ctx.clearRect(0, 0, canvas.width, canvas.height); },
      paintStatic: function () { resize(); ctx.clearRect(0, 0, w, h); for (var i = 0; i < 90; i++) step(); },
      isRunning: function () { return running; }
    };
  }

  /* ------------------------------------------------------------------------
     CYBER GLOBE: rotating wireframe sphere, network nodes, moving data packets
     ------------------------------------------------------------------------ */
  function createGlobe(canvas) {
    var ctx = canvas.getContext('2d');
    if (!ctx) return null;
    var TAU = Math.PI * 2;
    var small = window.matchMedia && window.matchMedia('(max-width: 640px)').matches;
    var seed = 11;
    var rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

    /* geometry (built once) */
    var N = small ? 22 : 34, M = small ? 10 : 16, S = 28;
    var nodes = [], arcs = [], i, j;
    for (i = 0; i < N; i++) {
      var lat = Math.asin(2 * rnd() - 1), lon = rnd() * TAU;
      nodes.push({ x: Math.cos(lat) * Math.sin(lon), y: Math.sin(lat), z: Math.cos(lat) * Math.cos(lon), hub: i % 6 === 0, ph: rnd() * TAU });
    }
    function slerp(a, b, t) {
      var d = clamp(a.x * b.x + a.y * b.y + a.z * b.z, -1, 1), om = Math.acos(d), s = Math.sin(om);
      if (s < 1e-4) return [a.x, a.y, a.z];
      var k1 = Math.sin((1 - t) * om) / s, k2 = Math.sin(t * om) / s;
      return [a.x * k1 + b.x * k2, a.y * k1 + b.y * k2, a.z * k1 + b.z * k2];
    }
    for (i = 0; i < M; i++) {
      var a = nodes[(rnd() * N) | 0], b = nodes[(rnd() * N) | 0];
      if (a === b) b = nodes[(nodes.indexOf(a) + 7) % N];
      var lift = .16 + rnd() * .22, pts = new Float32Array((S + 1) * 3);
      for (j = 0; j <= S; j++) {
        var t = j / S, p = slerp(a, b, t), r = 1 + lift * Math.sin(Math.PI * t);
        pts[j * 3] = p[0] * r; pts[j * 3 + 1] = p[1] * r; pts[j * 3 + 2] = p[2] * r;
      }
      arcs.push({ pts: pts, speed: .1 + rnd() * .13, off: rnd() });
    }
    function ring(fn, n) {
      var arr = new Float32Array(n * 3);
      for (var k = 0; k < n; k++) { var p = fn(k / (n - 1)); arr[k * 3] = p[0]; arr[k * 3 + 1] = p[1]; arr[k * 3 + 2] = p[2]; }
      return arr;
    }
    var graticule = [], G = 56, deg = Math.PI / 180, L;
    [-60, -30, 0, 30, 60].forEach(function (la) {
      graticule.push(ring(function (u) { var lo = u * TAU, c = Math.cos(la * deg); return [c * Math.sin(lo), Math.sin(la * deg), c * Math.cos(lo)]; }, G));
    });
    for (L = 0; L < 180; L += 30) {
      graticule.push(ring(function (u) {
        var la = (u * 2 - 1) * Math.PI, lo = L * deg;
        return [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)];
      }, G));
    }
    var orbit = ring(function (u) {
      var an = u * TAU, x = Math.cos(an) * 1.34, z = Math.sin(an) * 1.34, inc = 1.12;
      return [x, -z * Math.sin(inc), z * Math.cos(inc)];
    }, 90);
    var scan = new Float32Array(64 * 3);

    /* per-frame state */
    var W = 0, R = 0, C = 0, dpr = 1, glow = null;
    var cy = 1, sy = 0, cx = 1, sx = 0;               /* yaw / pitch trig */
    var rx = 0, ry = 0, rz = 0;                         /* rotation scratch (no allocations) */
    var yaw = .6, vel = .13, baseVel = .13, pitch = .4, targetPitch = .4, time = 0, last = 0, raf = 0, running = false;
    var dragging = false, lastX = 0, lastT = 0, hudT = 0;
    var bx = new Float32Array(120), by = new Float32Array(120), bz = new Float32Array(120);
    var hudLon = $('#hud-lon'), hudNodes = $('#hud-nodes'), hudLinks = $('#hud-links');
    if (hudNodes) hudNodes.textContent = String(N);
    if (hudLinks) hudLinks.textContent = String(M);

    function rot(px, py, pz) {
      var x = px * cy + pz * sy, z = -px * sy + pz * cy;
      rx = x; ry = py * cx - z * sx; rz = py * sx + z * cx;
    }
    function hidden() { return rz < 0 && rx * rx + ry * ry < 1; }

    function buildGlow() {
      glow = document.createElement('canvas');
      glow.width = glow.height = Math.round(W * dpr);
      var g = glow.getContext('2d');
      g.scale(dpr, dpr);
      var halo = g.createRadialGradient(C, C, R * .86, C, C, R * 1.55);
      halo.addColorStop(0, 'rgba(133,233,173,.20)'); halo.addColorStop(.45, 'rgba(133,233,173,.06)'); halo.addColorStop(1, 'rgba(133,233,173,0)');
      g.fillStyle = halo; g.fillRect(0, 0, W, W);
      var body = g.createRadialGradient(C - R * .35, C - R * .4, R * .1, C, C, R);
      body.addColorStop(0, 'rgba(133,233,173,.13)'); body.addColorStop(.6, 'rgba(14,24,26,.55)'); body.addColorStop(1, 'rgba(4,8,10,.85)');
      g.fillStyle = body; g.beginPath(); g.arc(C, C, R, 0, TAU); g.fill();
    }
    function resize() {
      var box = canvas.getBoundingClientRect();
      W = Math.max(160, Math.round(box.width));
      dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);
      canvas.width = canvas.height = Math.round(W * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      C = W / 2; R = W * .355;
      buildGlow();
      if (!running) draw();
    }

    function line(pts, n, aFront, aBack) {
      var k, any = false;
      for (k = 0; k < n; k++) { rot(pts[k * 3], pts[k * 3 + 1], pts[k * 3 + 2]); bx[k] = rx; by[k] = ry; bz[k] = rz; }
      var pass, pen, alpha;
      for (pass = 0; pass < 2; pass++) {
        alpha = pass === 0 ? aBack : aFront;
        if (alpha <= 0) continue;
        ctx.beginPath(); pen = false;
        for (k = 0; k < n; k++) {
          var front = bz[k] >= 0;
          if (front === (pass === 1)) {
            var X = C + bx[k] * R, Y = C - by[k] * R;
            if (pen) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
            pen = true; any = true;
          } else pen = false;
        }
        ctx.strokeStyle = 'rgba(133,233,173,' + alpha + ')';
        ctx.stroke();
      }
      return any;
    }

    function draw() {
      cy = Math.cos(yaw); sy = Math.sin(yaw); cx = Math.cos(pitch); sx = Math.sin(pitch);
      ctx.clearRect(0, 0, W, W);
      ctx.drawImage(glow, 0, 0, W, W);
      ctx.lineWidth = 1; ctx.lineJoin = 'round';

      /* wire graticule */
      var g;
      for (g = 0; g < graticule.length; g++) line(graticule[g], G, .3, .06);

      /* sweeping scan latitude */
      var sl = Math.sin(time * .55) * 1.05, cl = Math.cos(sl);
      for (g = 0; g < 64; g++) { var lo = g / 63 * TAU; scan[g * 3] = cl * Math.sin(lo); scan[g * 3 + 1] = Math.sin(sl); scan[g * 3 + 2] = cl * Math.cos(lo); }
      ctx.lineWidth = 1.6; line(scan, 64, .75, 0); ctx.lineWidth = 1;

      /* limb */
      ctx.beginPath(); ctx.arc(C, C, R, 0, TAU); ctx.strokeStyle = 'rgba(133,233,173,.4)'; ctx.stroke();

      /* arcs + packets */
      var a, k, ap, np = S + 1;
      for (a = 0; a < arcs.length; a++) {
        ap = arcs[a].pts;
        ctx.beginPath(); var pen = false;
        for (k = 0; k < np; k++) {
          rot(ap[k * 3], ap[k * 3 + 1], ap[k * 3 + 2]);
          if (!hidden()) { var X = C + rx * R, Y = C - ry * R; if (pen) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); pen = true; } else pen = false;
        }
        ctx.strokeStyle = 'rgba(133,233,173,.3)'; ctx.stroke();

        var u = ((time * arcs[a].speed + arcs[a].off) % 1) * S, idx = u | 0, f = u - idx, tr;
        for (tr = 0; tr < 5; tr++) {
          var q = clamp(idx - tr, 0, S - 1);
          var px = ap[q * 3] + (ap[(q + 1) * 3] - ap[q * 3]) * f, py = ap[q * 3 + 1] + (ap[(q + 1) * 3 + 1] - ap[q * 3 + 1]) * f, pz = ap[q * 3 + 2] + (ap[(q + 1) * 3 + 2] - ap[q * 3 + 2]) * f;
          rot(px, py, pz);
          if (hidden()) continue;
          ctx.fillStyle = tr === 0 ? 'rgba(220,255,236,.95)' : 'rgba(133,233,173,' + (.5 - tr * .1) + ')';
          ctx.beginPath(); ctx.arc(C + rx * R, C - ry * R, tr === 0 ? 2.4 : 1.8 - tr * .2, 0, TAU); ctx.fill();
        }
      }

      /* nodes */
      var n, nd, pulse;
      for (n = 0; n < N; n++) {
        nd = nodes[n]; rot(nd.x, nd.y, nd.z);
        var X2 = C + rx * R, Y2 = C - ry * R;
        if (rz >= 0) {
          ctx.fillStyle = nd.hub ? '#b7ffd0' : 'rgba(133,233,173,' + (.55 + rz * .45) + ')';
          ctx.beginPath(); ctx.arc(X2, Y2, nd.hub ? 3.4 : 2 + rz * .8, 0, TAU); ctx.fill();
          if (nd.hub) {
            pulse = (time * .7 + nd.ph) % 1;
            ctx.beginPath(); ctx.arc(X2, Y2, 4 + pulse * 15, 0, TAU);
            ctx.strokeStyle = 'rgba(133,233,173,' + (.55 * (1 - pulse)) + ')'; ctx.stroke();
          }
        } else {
          ctx.fillStyle = 'rgba(133,233,173,.14)';
          ctx.beginPath(); ctx.arc(X2, Y2, 1.4, 0, TAU); ctx.fill();
        }
      }

      /* orbit ring + satellite */
      cy = Math.cos(.35); sy = Math.sin(.35); /* orbit keeps a fixed yaw; only pitch follows the view */
      for (k = 0; k < 90; k++) { rot(orbit[k * 3], orbit[k * 3 + 1], orbit[k * 3 + 2]); bx[k] = rx; by[k] = ry; bz[k] = rz; }
      ctx.beginPath(); var pen2 = false;
      for (k = 0; k < 90; k++) {
        if (!(bz[k] < 0 && bx[k] * bx[k] + by[k] * by[k] < 1)) { var OX = C + bx[k] * R, OY = C - by[k] * R; if (pen2) ctx.lineTo(OX, OY); else ctx.moveTo(OX, OY); pen2 = true; } else pen2 = false;
      }
      ctx.strokeStyle = 'rgba(133,233,173,.2)'; ctx.stroke();
      var si = ((time * .12) % 1) * 89, s0 = si | 0;
      rot(orbit[s0 * 3], orbit[s0 * 3 + 1], orbit[s0 * 3 + 2]);
      if (!hidden()) { ctx.fillStyle = '#b7ffd0'; ctx.beginPath(); ctx.arc(C + rx * R, C - ry * R, 3, 0, TAU); ctx.fill(); }
    }

    function loop(now) {
      raf = requestAnimationFrame(loop);
      var dt = Math.min((now - last) / 1000, .05); last = now;
      time += dt;
      if (!dragging) { yaw += vel * dt; vel += (baseVel - vel) * Math.min(1, dt * 1.2); }
      pitch += (targetPitch - pitch) * Math.min(1, dt * 4);
      draw();
      if (hudLon && now - hudT > 250) {
        hudT = now;
        var d = Math.round(((yaw * 180 / Math.PI) % 360 + 360) % 360);
        hudLon.textContent = String(d).padStart(3, '0') + '°';
      }
    }

    /* drag to rotate (vertical scroll still works: touch-action: pan-y) */
    canvas.addEventListener('pointerdown', function (e) {
      dragging = true; lastX = e.clientX; lastT = performance.now();
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var now = performance.now(), dx = e.clientX - lastX, dt = Math.max(.008, (now - lastT) / 1000);
      yaw += dx * .008; vel = clamp(dx * .008 / dt, -3, 3);
      lastX = e.clientX; lastT = now;
      if (!running) draw();
    });
    var endDrag = function () { dragging = false; };
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);

    if (window.ResizeObserver) new ResizeObserver(function () { resize(); }).observe(canvas);
    resize();

    return {
      start: function () { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(loop); },
      stop: function () { running = false; cancelAnimationFrame(raf); },
      tilt: function (v) { targetPitch = .4 + v * .22; },
      renderStatic: function () { time = 1.2; draw(); }
    };
  }

  /* ------------------------------------------------------------------------
     CINEMATIC INTRO
     ------------------------------------------------------------------------ */
  var intro = guard('intro setup', function () {
    var el = $('#intro');
    if (!el) return null;
    var page = $('#page'), skip = $('#skip-intro'), head = $('#boot-head'), access = $('#access');
    var statusEl = $('#boot-status'), pctEl = $('#boot-pct'), fill = $('#boot-fill');
    var lines = $$('.boot-line', el), warns = { w1: $('.w1', el), w2: $('.w2', el), w3: $('.w3', el), w4: $('.w4', el) };
    var HEAD = 'INITIALIZING SAAD.SECURITY_PROFILE...';
    var rain = null, timers = [], phase = 'idle', deadline = 0, leaveTimer = 0, done = null, prevFocus = null;

    /* one noise tile, generated once, reused by CSS as a background image */
    guard('noise tile', function () {
      var c = document.createElement('canvas'); c.width = c.height = 128;
      var g = c.getContext('2d'), img = g.createImageData(128, 128), d = img.data, v;
      for (var k = 0; k < d.length; k += 4) { v = (Math.random() * 255) | 0; d[k] = d[k + 1] = d[k + 2] = v; d[k + 3] = 255; }
      g.putImageData(img, 0, 0);
      el.style.setProperty('--noise-url', 'url(' + c.toDataURL('image/png') + ')');
    });

    function at(fn, ms) { timers.push(setTimeout(function () { if (phase === 'playing') fn(); }, ms)); }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }
    function pulse(cls, ms, target) { var t = target || el; t.classList.add(cls); at(function () { t.classList.remove(cls); }, ms); }
    function setProgress(p, label) {
      fill.style.transform = 'scaleX(' + p + ')';
      pctEl.textContent = Math.round(p * 100) + '%';
      if (label) statusEl.textContent = label;
    }
    function typeInto(node, text, start, speed, onDone) {
      at(function () { node.classList.add('is-typing'); }, start);
      for (var k = 1; k <= text.length; k++) (function (n) { at(function () { node.textContent = text.slice(0, n); }, start + n * speed); })(k);
      at(function () { node.classList.remove('is-typing'); if (onDone) onDone(); }, start + text.length * speed + 10);
      return start + text.length * speed + 10;
    }
    function warn(key, on, off, alert) {
      at(function () {
        warns[key].classList.add('on');
        if (alert) { el.classList.add('is-alert'); pulse('is-flicker', 240); pulse('is-glitch', 220); pulse('is-jitter', 230); }
      }, on);
      if (alert) at(function () { el.classList.remove('is-alert'); }, on + 520);
      at(function () { warns[key].classList.remove('on'); }, off);
    }
    function reset() {
      clearTimers();
      ['is-on', 'is-granted', 'is-alert', 'is-shake', 'is-noisy', 'is-flicker', 'is-glitch', 'is-leaving', 'is-skipping', 'is-jitter'].forEach(function (c) { el.classList.remove(c); });
      head.textContent = ''; head.classList.remove('is-typing', 'is-glitching');
      access.classList.remove('is-glitching');
      lines.forEach(function (l) { l.classList.remove('is-lead', 'is-ok'); var b = $('.lbl', l); b.textContent = ''; b.classList.remove('is-typing'); });
      Object.keys(warns).forEach(function (k) { warns[k].classList.remove('on'); });
      setProgress(0, 'booting');
    }

    function finish() {
      if (phase === 'idle') return;
      phase = 'idle';
      clearTimers(); clearTimeout(deadline); clearTimeout(leaveTimer);
      if (rain) rain.stop();
      var hadFocus = document.activeElement === skip;
      el.hidden = true; page.inert = false;
      root.classList.remove('is-intro');
      root.classList.add('is-live');
      store.set('saad-visited-v2', String(Date.now()));
      if (hadFocus) guard('focus', function () {
        var back = prevFocus && prevFocus !== document.body && document.contains(prevFocus) ? prevFocus : $('.wordmark');
        back.focus({ preventScroll: true });
      });
      if (done) { var d = done; done = null; d(); }
    }
    function exit(fast) {
      if (phase !== 'playing') return;
      phase = 'leaving';
      clearTimers();
      el.classList.toggle('is-skipping', !!fast);
      el.classList.add('is-leaving');
      leaveTimer = setTimeout(finish, fast ? 260 : 620);
    }

    function run() {
      /* power-on, then the boot log */
      at(function () { el.classList.add('is-on'); }, 80);
      var t = typeInto(head, HEAD, 700, 14, function () { pulse('is-glitching', 420, head); });
      warn('w1', 760, 2150, true);

      var starts = [], oks = [], s = t + 160, k;
      var pcts = [.24, .48, .72, .94], names = ['identity', 'path', 'channel', 'scan'];
      lines.forEach(function (line, n) {
        var text = line.getAttribute('data-label'), lbl = $('.lbl', line);
        at(function () { statusEl.textContent = names[n]; }, s);
        line.classList.add('boot-line');
        var typed = typeInto(lbl, text, s, 11, null);
        at(function () { line.classList.add('is-lead'); }, typed + 30);
        at(function () { line.classList.add('is-ok'); setProgress(pcts[n], names[n]); }, typed + 270);
        s = typed + 270 + 130;
      });
      warn('w2', t + 380, t + 1700, false);
      warn('w3', t + 1350, t + 2500, true);
      at(function () { pulse('is-noisy', 320); pulse('is-glitch', 200); }, t + 1900);
      warn('w4', s - 380, s + 900, false);

      /* ACCESS GRANTED */
      var g = s + 120;
      at(function () {
        el.classList.add('is-granted'); setProgress(1, 'granted');
        pulse('is-shake', 560); pulse('is-noisy', 480); pulse('is-flicker', 250); pulse('is-glitch', 260);
        pulse('is-jitter', 230);
        pulse('is-glitching', 460, access);
      }, g);
      at(function () { exit(false); }, g + 1250);
    }

    function play(opts) {
      opts = opts || {};
      return new Promise(function (resolve) {
        var forced = /[?&]intro=1/.test(String(window.location.search || '')) || opts.force;
        var last = Number(store.get('saad-visited-v2')) || 0;
        var recent = last > 0 && Date.now() - last < 30 * 60 * 1000;
        var hash = window.location.hash && window.location.hash.length > 1;
        var skipIt = !motion.on || (!forced && (hash || recent || window.scrollY > 10));
        if (skipIt || phase !== 'idle') { root.classList.add('is-live'); resolve(); return; }
        done = resolve;
        prevFocus = document.activeElement;
        reset();
        phase = 'playing';
        page.inert = true; el.hidden = false;
        root.classList.add('is-intro');
        root.classList.remove('is-live');
        if (!rain) rain = createRain($('#intro-rain'), { size: window.innerWidth < 640 ? 18 : 16, fps: 22, fade: .08 });
        if (rain) { rain.start(); }
        deadline = setTimeout(finish, 10000);
        run();
      });
    }

    skip.addEventListener('click', function () { exit(true); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') exit(true); });
    window.addEventListener('resize', function () { if (rain && phase === 'playing') rain.resize(); });
    return { play: play, isPlaying: function () { return phase !== 'idle'; } };
  });

  /* ------------------------------------------------------------------------
     PAGE FEATURES
     ------------------------------------------------------------------------ */
  function initHeroVisuals() {
    var hero = $('#home');
    var globe = createGlobe($('#globe'));
    var rainCanvas = $('#hero-rain');
    var rain = rainCanvas ? createRain(rainCanvas, { size: window.innerWidth < 640 ? 18 : 17, fps: 14, fade: .045, speed: .8 }) : null;
    var heroVisible = true;

    function sync() {
      var run = motion.on && heroVisible && !document.hidden;
      if (globe) { if (run) globe.start(); else { globe.stop(); globe.renderStatic(); } }
      if (rain) { if (run) rain.start(); else { rain.stop(); if (!motion.on) rain.paintStatic(); } }
    }
    if (window.IntersectionObserver && hero) {
      new IntersectionObserver(function (en) { heroVisible = en[0].isIntersecting; sync(); }, { threshold: 0 }).observe(hero);
    }
    document.addEventListener('visibilitychange', sync);
    motion.listeners.push(sync);
    window.addEventListener('resize', (function () {
      var id = 0;
      return function () { clearTimeout(id); id = setTimeout(function () { if (rain && rain.isRunning()) rain.resize(); }, 200); };
    })());
    if (hero && globe) {
      hero.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        var r = hero.getBoundingClientRect();
        globe.tilt(((e.clientY - r.top) / r.height - .5) * 2);
      });
    }
    sync();

    /* occasional glitch on the big name */
    var name = $('.hero-name');
    if (name) setInterval(function () {
      if (!motion.on || !heroVisible || document.hidden) return;
      name.classList.add('is-glitching');
      setTimeout(function () { name.classList.remove('is-glitching'); }, 420);
    }, 7500);
  }

  function initReveal() {
    var els = $$('[data-reveal]');
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: .14, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }

  function initScroll() {
    var header = $('#site-header'), bar = $('#progress'), wrap = $('#roadmap-wrap');
    var stages = $$('.stage', wrap || document);
    var ticking = false;

    function paint() {
      ticking = false;
      var y = window.pageYOffset || root.scrollTop || 0;
      if (header) header.classList.toggle('is-stuck', y > 24);
      var max = root.scrollHeight - window.innerHeight;
      if (bar) bar.style.setProperty('--p', max > 0 ? clamp(y / max, 0, 1).toFixed(4) : '0');
      if (wrap) {
        var r = wrap.getBoundingClientRect(), mid = window.innerHeight * .55;
        wrap.style.setProperty('--fill', clamp((mid - r.top) / r.height, 0, 1).toFixed(4));
        stages.forEach(function (st) {
          var node = $('.stage-node', st).getBoundingClientRect();
          st.classList.toggle('is-lit', node.top + node.height / 2 < mid);
        });
      }
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    paint();

    /* scrollspy */
    var links = $$('[data-nav-link]');
    function setActive(name) {
      links.forEach(function (a) {
        var on = a.getAttribute('data-nav-link') === name;
        a.classList.toggle('is-active', on);
        if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
    }
    if (window.IntersectionObserver) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) setActive(en.target.getAttribute('data-nav')); });
      }, { rootMargin: '-45% 0px -50% 0px' });
      $$('[data-nav]').forEach(function (s) { spy.observe(s); });
    }
    setActive('home');
  }

  function initMenu() {
    var btn = $('#menu-button'), menu = $('#menu');
    if (!btn || !menu) return;
    $$('a', menu).forEach(function (a, i) { a.style.setProperty('--k', String(i)); });
    function set(open) {
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu.hidden = !open;
      menu.classList.toggle('is-open', open);
      root.classList.toggle('menu-open', open);
      if (open) guard('menu focus', function () { $('a', menu).focus({ preventScroll: true }); });
    }
    btn.addEventListener('click', function () { set(btn.getAttribute('aria-expanded') !== 'true'); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { set(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { set(false); btn.focus(); }
    });
    window.addEventListener('resize', function () { if (window.innerWidth > 1120) set(false); });
  }

  function initPhotos() {
    var dlg = $('#photo-dialog'), img = $('#photo-dialog-img'), cap = $('#photo-dialog-cap'), close = $('#photo-close');
    if (!dlg) return;
    $$('.photo-open').forEach(function (b) {
      b.addEventListener('click', function () {
        img.src = b.getAttribute('data-photo'); img.alt = b.getAttribute('data-alt') || '';
        cap.textContent = b.getAttribute('data-caption') || '';
        if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
      });
    });
    close.addEventListener('click', function () { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg && dlg.close) dlg.close(); });
  }

  function initCopy() {
    var btn = $('#copy-email'), label = $('#copy-label'), status = $('#copy-status'), mail = $('#email-text');
    if (!btn || !mail) return;
    function fallback(text) {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0';
      document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      return ok;
    }
    btn.addEventListener('click', function () {
      var text = mail.textContent.trim();
      var p = (navigator.clipboard && navigator.clipboard.writeText) ? navigator.clipboard.writeText(text).then(function () { return true; }, function () { return fallback(text); }) : Promise.resolve(fallback(text));
      p.then(function (ok) {
        label.textContent = ok ? 'Copied' : 'Copy failed';
        status.textContent = ok ? 'Email address copied to clipboard' : 'Could not copy automatically. Please copy the address manually.';
        btn.classList.toggle('is-done', ok);
        setTimeout(function () { label.textContent = 'Copy'; btn.classList.remove('is-done'); status.textContent = ''; }, 2000);
      });
    });
  }

  /* ------------------------------------------------------------------------
     BOOT
     ------------------------------------------------------------------------ */
  function boot() {
    applyMotion();
    var toggle = $('#motion-toggle');
    if (toggle) toggle.addEventListener('click', function () {
      store.set('saad-motion', motion.on ? 'off' : 'on');
      applyMotion();
    });
    if (osReduced.addEventListener) osReduced.addEventListener('change', applyMotion);

    var yr = $('#year'); if (yr) yr.textContent = String(new Date().getFullYear());

    guard('reveal', initReveal);
    guard('scroll', initScroll);
    guard('menu', initMenu);
    guard('photos', initPhotos);
    guard('copy', initCopy);
    guard('hero visuals', initHeroVisuals);

    var replay = $('#replay-intro');
    if (replay) replay.addEventListener('click', function () {
      if (!intro || intro.isPlaying()) return;
      if (!motion.on) {
        var old = replay.textContent;
        replay.textContent = 'Motion is off';
        setTimeout(function () { replay.textContent = old; }, 1600);
        return;
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      intro.play({ force: true });
    });

    /* start: intro first (if allowed), then reveal the page */
    if (intro) intro.play(); else root.classList.add('is-live');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
