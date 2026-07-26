/* ══════════════════════════════════════════════════
   MCU — HERO REDESIGN LAYER
   hero-circuit.js
   Load this AFTER js/animations.js, before </body>.
   Does not touch mcuLogoCanvas / mcuMascotCanvas or
   their chroma-key / alpha-video renderers.
   ══════════════════════════════════════════════════ */

'use strict';

/* ─── 1. CIRCUIT TRACE BACKGROUND ─── */
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
    var fx = w * 0.70, fy = h * 0.48; // focal point near the console
    var count = w < 700 ? 8 : 16;

    for (var i = 0; i < count; i++) {
      var edge = Math.floor(Math.random() * 3); // 0 top, 1 left, 2 bottom (skip right — that's where the focal point lives)
      var sx, sy;
      if (edge === 0) { sx = Math.random() * w; sy = 0; }
      else if (edge === 1) { sx = 0; sy = Math.random() * h; }
      else { sx = Math.random() * w * 0.9; sy = h; }

      var bendX = edge === 1 ? sx + (fx - sx) * (0.3 + Math.random() * 0.3) : fx * (0.5 + Math.random() * 0.3);
      var pts = [{ x: sx, y: sy }];

      if (edge === 1) {
        pts.push({ x: bendX, y: sy });
        pts.push({ x: bendX, y: fy });
      } else {
        pts.push({ x: sx, y: fy + (sy - fy) * 0.5 });
        pts.push({ x: bendX, y: fy + (sy - fy) * 0.5 });
        pts.push({ x: bendX, y: fy });
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
    var baseAlpha = boosted ? 0.16 : 0.07;
    for (var i = 0; i < paths.length; i++) drawPolyline(paths[i], baseAlpha);

    for (i = 0; i < paths.length; i++) {
      var p = paths[i];
      var t = ((now * p.speed) + p.phase) % 1;
      var pos = pointAt(p, t);
      var dotAlpha = boosted ? 1 : 0.85;
      var r = boosted ? 2.6 : 1.8;

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,120,120,' + dotAlpha + ')';
      ctx.shadowColor = 'rgba(227,27,35,0.9)';
      ctx.shadowBlur = boosted ? 12 : 7;
      ctx.fill();
      ctx.shadowBlur = 0;
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
    // draw a single static frame, no animation loop
    visible = false;
    ctx.clearRect(0, 0, w, h);
    paths.forEach(function (p) { drawPolyline(p, 0.09); });
  }

  // exposed so the "powered" trigger below can brighten the traces briefly
  window.__mcuCircuitPowerUp = function () {
    poweredUntil = performance.now() + 1400;
  };
})();


/* ─── 2. CLUSTER PARALLAX TILT ─── */
(function initClusterTilt() {
  var heroRight = document.querySelector('.hero-right-v2');
  var cluster = document.getElementById('heroCluster');
  if (!heroRight || !cluster) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(pointer: fine)').matches) return; // skip on touch

  var raf = null, tx = 0, ty = 0, cx = 0, cy = 0;
  function lerp(a, b, t) { return a + (b - a) * t; }

  function loop() {
    cx = lerp(cx, tx, 0.12);
    cy = lerp(cy, ty, 0.12);
    cluster.style.setProperty('--rx', cx.toFixed(2) + 'deg');
    cluster.style.setProperty('--ry', cy.toFixed(2) + 'deg');
    if (Math.abs(cx - tx) > 0.02 || Math.abs(cy - ty) > 0.02) {
      raf = requestAnimationFrame(loop);
    } else {
      raf = null;
    }
  }

  heroRight.addEventListener('mousemove', function (e) {
    var r = heroRight.getBoundingClientRect();
    ty = ((e.clientX - r.left) / r.width - 0.5) * 10;   // rotateY
    tx = -((e.clientY - r.top) / r.height - 0.5) * 8;   // rotateX
    cluster.classList.add('tilting');
    if (!raf) raf = requestAnimationFrame(loop);
  });

  heroRight.addEventListener('mouseleave', function () {
    tx = 0; ty = 0;
    cluster.classList.remove('tilting');
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

  // fire the moment your existing loader logic marks itself hidden;
  // fall back to a timeout in case that class never fires for some reason
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
