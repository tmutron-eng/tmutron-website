/* ══════════════════════════════════════════════════
   MCU — HERO REDESIGN LAYER (v4 — compact centered portal)
   hero-circuit.js
   Load this AFTER js/animations.js, before </body>.
   Does not touch mcuLogoCanvas / mcuMascotCanvas or
   their chroma-key / alpha-video renderers.
   ══════════════════════════════════════════════════ */

'use strict';

/* ─── 1. CIRCUIT TRACE BACKGROUND — converges to true center ───
   PERF NOTE: no ctx.shadowBlur anywhere in this loop. shadowBlur is
   one of the most expensive things you can do in Canvas2D per-frame,
   especially with 10-20 glowing dots redrawn every frame. The "glow"
   here is instead a cheap two-circle draw (a larger, very transparent
   circle behind a small bright one) — visually close, near-zero cost. */
(function initCircuitBoard() {
  var canvas = document.getElementById('circuitCanvas');
  var hero = document.getElementById('hero');
  if (!canvas || !hero) return;

  var ctx = canvas.getContext('2d');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  var paths = [];
  var visible = true;
  var raf = null;
  var poweredUntil = 0;

  function resize() {
    w = hero.offsetWidth;
    h = hero.offsetHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildPaths();
  }

  function buildPaths() {
    paths = [];
    var fx = w * 0.5, fy = h * 0.5; // true center — the portal
    var count = w < 700 ? 8 : 16;

    for (var i = 0; i < count; i++) {
      var edge = Math.floor(Math.random() * 4); // 0 top, 1 left, 2 bottom, 3 right
      var sx, sy;
      if (edge === 0) { sx = Math.random() * w; sy = 0; }
      else if (edge === 1) { sx = 0; sy = Math.random() * h; }
      else if (edge === 2) { sx = Math.random() * w; sy = h; }
      else { sx = w; sy = Math.random() * h; }

      var pts = [{ x: sx, y: sy }];
      if (edge === 0 || edge === 2) {
        var midY = sy + (fy - sy) * (0.35 + Math.random() * 0.3);
        pts.push({ x: sx, y: midY });
        pts.push({ x: fx, y: midY });
      } else {
        var midX = sx + (fx - sx) * (0.35 + Math.random() * 0.3);
        pts.push({ x: midX, y: sy });
        pts.push({ x: midX, y: fy });
      }
      pts.push({ x: fx, y: fy });

      var segLens = [], total = 0;
      for (var j = 1; j < pts.length; j++) {
        var dx = pts[j].x - pts[j - 1].x, dy = pts[j].y - pts[j - 1].y;
        var len = Math.sqrt(dx * dx + dy * dy);
        segLens.push(len);
        total += len;
      }

      paths.push({
        pts: pts,
        segLens: segLens,
        total: total,
        speed: 0.00018 + Math.random() * 0.00022,
        phase: Math.random()
      });
    }
  }

  function pointAt(path, t) {
    var target = t * path.total;
    var acc = 0;
    for (var i = 0; i < path.segLens.length; i++) {
      var len = path.segLens[i];
      if (acc + len >= target || i === path.segLens.length - 1) {
        var localT = len > 0 ? (target - acc) / len : 0;
        var a = path.pts[i], b = path.pts[i + 1];
        return { x: a.x + (b.x - a.x) * localT, y: a.y + (b.y - a.y) * localT };
      }
      acc += len;
    }
    return path.pts[path.pts.length - 1];
  }

  function drawPolyline(path, alpha) {
    ctx.beginPath();
    ctx.moveTo(path.pts[0].x, path.pts[0].y);
    for (var i = 1; i < path.pts.length; i++) ctx.lineTo(path.pts[i].x, path.pts[i].y);
    ctx.strokeStyle = 'rgba(227,27,35,' + alpha + ')';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function draw(now) {
    if (!visible) { raf = null; return; }
    ctx.clearRect(0, 0, w, h);

    var boosted = now < poweredUntil;
    var baseAlpha = boosted ? 0.15 : 0.06;
    for (var i = 0; i < paths.length; i++) drawPolyline(paths[i], baseAlpha);

    for (i = 0; i < paths.length; i++) {
      var p = paths[i];
      var t = ((now * p.speed) + p.phase) % 1;
      var pos = pointAt(p, t);
      var haloR = boosted ? 7 : 5;
      var dotR = boosted ? 2.4 : 1.7;

      // cheap glow: soft halo circle, then bright core — no shadowBlur
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, haloR, 0, Math.PI * 2);
      ctx.fillStyle = boosted ? 'rgba(227,27,35,0.22)' : 'rgba(227,27,35,0.14)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, dotR, 0, Math.PI * 2);
      ctx.fillStyle = boosted ? 'rgba(255,150,150,0.95)' : 'rgba(255,150,150,0.8)';
      ctx.fill();
    }

    raf = requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      visible = entry.isIntersecting && !document.hidden;
      if (visible && raf === null) raf = requestAnimationFrame(draw);
    });
  }, { threshold: 0.01 });
  io.observe(hero);

  document.addEventListener('visibilitychange', function () {
    visible = !document.hidden && visible;
    if (!document.hidden && raf === null) raf = requestAnimationFrame(draw);
  });

  if (reduced) {
    visible = false;
    ctx.clearRect(0, 0, w, h);
    paths.forEach(function (p) { drawPolyline(p, 0.08); });
  }

  // exposed so the "powered" trigger below can brighten the traces briefly
  window.__mcuCircuitPowerUp = function () {
    poweredUntil = performance.now() + 1400;
  };
})();


/* ─── 2. PORTAL PARALLAX TILT (logo only now) ─── */
(function initPortalTilt() {
  var frame = document.querySelector('.portal-frame');
  var core = document.getElementById('heroCluster');
  if (!frame || !core) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(pointer: fine)').matches) return; // skip on touch

  var raf = null, tx = 0, ty = 0, cx = 0, cy = 0;
  function lerp(a, b, t) { return a + (b - a) * t; }

  function loop() {
    cx = lerp(cx, tx, 0.12);
    cy = lerp(cy, ty, 0.12);
    core.style.setProperty('--rx', cx.toFixed(2) + 'deg');
    core.style.setProperty('--ry', cy.toFixed(2) + 'deg');
    if (Math.abs(cx - tx) > 0.02 || Math.abs(cy - ty) > 0.02) {
      raf = requestAnimationFrame(loop);
    } else {
      raf = null;
    }
  }

  frame.addEventListener('mousemove', function (e) {
    var r = frame.getBoundingClientRect();
    ty = ((e.clientX - r.left) / r.width - 0.5) * 8;    // rotateY
    tx = -((e.clientY - r.top) / r.height - 0.5) * 6;   // rotateX
    core.classList.add('tilting');
    if (!raf) raf = requestAnimationFrame(loop);
  });

  frame.addEventListener('mouseleave', function () {
    tx = 0; ty = 0;
    core.classList.remove('tilting');
    if (!raf) raf = requestAnimationFrame(loop);
  });
})();


/* ─── 3. BOOT / POWER-ON TRIGGER ─── */
(function initPowerOn() {
  var hero = document.getElementById('hero');
  var loader = document.getElementById('loader');
  if (!hero) return;

  function powerUp() {
    hero.classList.add('powered');
    if (window.__mcuCircuitPowerUp) window.__mcuCircuitPowerUp();
    setTimeout(function () { hero.classList.remove('powered'); }, 1600);
  }

  if (!loader) { powerUp(); return; }

  var fired = false;
  function fireOnce() {
    if (fired) return;
    fired = true;
    powerUp();
  }

  var mo = new MutationObserver(function () {
    if (loader.classList.contains('hidden')) { fireOnce(); mo.disconnect(); }
  });
  mo.observe(loader, { attributes: true, attributeFilter: ['class'] });

  setTimeout(fireOnce, 2600); // safety net if loader hide logic differs
})();


/* ─── 4. LOADER TEXT — quick typewriter over "INITIALIZING" ─── */
(function initLoaderTypewriter() {
  var label = document.querySelector('#loader .loader-text .mono');
  if (!label) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var lines = ['INITIALIZING MCU_SYSTEM', 'LOADING SUBSYSTEMS', 'MCU_SYSTEM READY'];
  var li = 0, ci = 0;

  function type() {
    if (li >= lines.length) return;
    var line = lines[li];
    label.textContent = line.slice(0, ci) + (ci < line.length ? '_' : '');
    if (ci <= line.length) {
      ci++;
      setTimeout(type, ci === line.length ? 500 : 22);
    } else {
      li++; ci = 0;
      setTimeout(type, 120);
    }
  }
  type();
})();
