/* ══════════════════════════════════════════════════
   MCU — TEAM TUNNEL
   Reads window.MCU_TEAM and window.MCU_TUNNEL (team.html).

   Scroll walks a camera down a perspective tunnel. Each frame in the
   tunnel is a team sector (execs, operations, events…). Clicking one
   opens that sector's people. The tunnel dead-ends in a wall that IS
   the team photo, so it grows to fill the screen as you arrive and
   shrinks again as you scroll back.

   No libraries. One canvas, one rAF loop that only runs while the
   stage is on screen and the tab is visible.
   ══════════════════════════════════════════════════ */
(function () {
  'use strict';

  var TEAM = (window.MCU_TEAM || []).slice();
  var ALL_CATS = (window.MCU_TUNNEL || []).slice();
  if (!TEAM.length || !ALL_CATS.length) return;

  var IMG = 'assets/images/';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function pad(n) { n = String(n); return n.length < 2 ? '0' + n : n; }
  function pad4(n) { n = String(Math.max(0, n | 0)); while (n.length < 4) n = '0' + n; return n; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function initials(n) {
    var p = String(n).trim().split(/\s+/);
    return (p[0].charAt(0) + (p.length > 1 ? p[p.length - 1].charAt(0) : '')).toUpperCase();
  }

  /* ───────── who is in which frame ───────── */
  var CATS = ALL_CATS.map(function (c) {
    var copy = Object.assign({}, c);
    copy.members = TEAM.filter(function (p) {
      return (c.g && c.g.indexOf(p.g) > -1) ||
             (c.port && p.port && c.port.indexOf(p.port) > -1);
    });
    return copy;
  }).filter(function (c) { return c.members.length; });

  if (!CATS.length) return;

  /* ───────── cards (modal + fallback roster) ───────── */
  function cardHTML(p, i, royal) {
    var photo = p.p
      ? '<img src="' + IMG + esc(p.p) + '" alt="' + esc(p.n) + '" loading="lazy" onerror="this.remove()">'
      : '';
    return '<article class="tm-card' + (royal ? ' royal' : '') + '">' +
      '<div class="tm-card-photo">' +
        '<span class="tm-mono" aria-hidden="true">' + esc(initials(p.n)) + '</span>' +
        photo +
        '<span class="tm-card-no mono">' + pad(i + 1) + '</span>' +
      '</div>' +
      '<div class="tm-card-body">' +
        '<p class="tm-card-role">' + esc(p.r || 'Member') + '</p>' +
        '<h4 class="tm-card-name">' + esc(p.n) + '</h4>' +
        (p.b ? '<p class="tm-card-bio">' + esc(p.b) + '</p>' : '') +
      '</div>' +
    '</article>';
  }

  function buildRoster() {
    var host = $('#tm-roster-body');
    if (!host) return;
    host.innerHTML = CATS.map(function (c, i) {
      return '<div class="tm-block">' +
        '<div class="tm-block-head"><h3>' + esc(c.label) + '</h3>' +
          '<span>' + pad(i + 1) + ' / ' + pad(CATS.length) + ' · ' + c.members.length + ' members</span></div>' +
        '<div class="tm-cards">' + c.members.map(function (p, k) { return cardHTML(p, k, c.royal); }).join('') + '</div>' +
      '</div>';
    }).join('');
  }

  var canvas = $('#tm-canvas');
  var ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Anyone who can't get the tunnel still gets the whole team. */
  if (!ctx || reduce.matches) { buildRoster(); return; }

  document.body.classList.add('tunnel-on');

  var section = $('#tunnel');
  var stage = $('#tm-stage');
  var sectorEl = $('#tm-sector');
  var depthEl = $('#tm-depth');
  var introEl = $('#tm-intro');
  var wallcapEl = $('#tm-wallcap');
  var wallcapP = $('#tm-wallcap-p');
  var railEl = $('#tm-rail');

  /* ───────── world ───────── */
  var HALF_W = 620, HALF_H = 430;   /* tunnel cross-section, world units */
  var Z0 = 1250;                    /* first frame depth */
  var GAP = 760;                    /* frame spacing */
  var Z_END = Z0 + (CATS.length - 1) * GAP + 780;
  var TRAVEL = Z_END - 380;         /* camera stops just short of the wall */

  var W = 0, H = 0, DPR = 1, F = 900, CX = 0, CY = 0, s0 = 1;
  var camZ = 0, camTarget = 0, p = 0;
  var raf = 0, visible = true, hover = null, wallRect = null, modalOpen = false, narrowMode = false;

  var frames = CATS.map(function (c, i) {
    return {
      cat: c, i: i,
      z: Z0 + i * GAP,
      x: 0, y: 26, w: 340, h: 238,
      side: i % 2 ? 1 : -1,
      rect: null, art: null
    };
  });

  var teamImg = new Image();
  teamImg.src = IMG + 'team.mcu.jpg';

  /* ───────── frame artwork (drawn once per sector) ───────── */
  function makeArt(cat, idx) {
    var AW = 640, AH = 448;
    var c = document.createElement('canvas');
    c.width = AW; c.height = AH;
    var g = c.getContext('2d');

    g.fillStyle = '#0f0809';
    g.fillRect(0, 0, AW, AH);

    var wash = g.createLinearGradient(0, 0, AW, AH);
    wash.addColorStop(0, 'rgba(227,27,35,0.18)');
    wash.addColorStop(0.55, 'rgba(227,27,35,0.03)');
    wash.addColorStop(1, 'rgba(0,0,0,0.35)');
    g.fillStyle = wash;
    g.fillRect(0, 0, AW, AH);

    /* border */
    g.strokeStyle = cat.royal ? 'rgba(255,255,255,0.82)' : 'rgba(227,27,35,0.85)';
    g.lineWidth = 7;
    g.strokeRect(3.5, 3.5, AW - 7, AH - 7);
    g.strokeStyle = 'rgba(255,255,255,0.14)';
    g.lineWidth = 2;
    g.strokeRect(19, 19, AW - 38, AH - 38);

    /* corner ticks */
    g.strokeStyle = 'rgba(227,27,35,0.95)';
    g.lineWidth = 4;
    var t = 26;
    [[19, 19, 1, 1], [AW - 19, 19, -1, 1], [19, AH - 19, 1, -1], [AW - 19, AH - 19, -1, -1]].forEach(function (k) {
      g.beginPath();
      g.moveTo(k[0] + t * k[2], k[1]);
      g.lineTo(k[0], k[1]);
      g.lineTo(k[0], k[1] + t * k[3]);
      g.stroke();
    });

    g.fillStyle = 'rgba(255,255,255,0.45)';
    g.font = '400 15px "Share Tech Mono", monospace';
    g.textAlign = 'left';
    g.fillText('SECTOR ' + pad(idx + 1), 34, 52);

    /* label */
    g.fillStyle = '#ffffff';
    g.textAlign = 'center';
    g.font = '400 ' + (cat.label.length > 12 ? 58 : 80) + 'px "Bebas Neue", Impact, sans-serif';
    g.fillText(cat.label, AW / 2, AH / 2 + 6);

    /* subtitle */
    g.fillStyle = 'rgba(255,255,255,0.52)';
    g.font = '400 17px Barlow, Helvetica, sans-serif';
    g.fillText(cat.sub || '', AW / 2, AH / 2 + 42, AW - 90);

    /* plaque */
    g.fillStyle = 'rgba(0,0,0,0.55)';
    g.fillRect(19, AH - 92, AW - 38, 73);
    g.fillStyle = 'rgba(227,27,35,0.95)';
    g.fillRect(19, AH - 92, 4, 73);
    g.textAlign = 'left';
    g.fillStyle = 'rgba(255,255,255,0.92)';
    g.font = '700 18px "Barlow Condensed", Arial, sans-serif';
    g.fillText(cat.members.length + ' MEMBERS', 38, AH - 60);
    g.fillStyle = 'rgba(255,255,255,0.45)';
    g.font = '400 14px "Share Tech Mono", monospace';
    g.fillText('CLICK TO OPEN', 38, AH - 36);
    g.textAlign = 'right';
    g.fillText('MCU 2026-27', AW - 38, AH - 36);

    return c;
  }

  function buildArt() {
    frames.forEach(function (f) { f.art = makeArt(f.cat, f.i); });
  }

  /* ───────── sizing ───────── */
  function layout() {
    var r = stage.getBoundingClientRect();
    W = Math.max(320, Math.round(r.width || window.innerWidth));
    H = Math.max(320, Math.round(r.height || window.innerHeight));

    var narrow = W < 760;
    DPR = Math.min(window.devicePixelRatio || 1, narrow ? 1.5 : 1.75);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    CX = W / 2; CY = H / 2;
    F = (H / 2) * Z0 / HALF_H;
    s0 = F / Z0;
    /* stop where the end wall exactly spans the viewport width, so the
       team photo arrives full-bleed instead of a zoomed-in crop */
    TRAVEL = Z_END - Math.min(1400, Math.max(600, F * (HALF_W * 2) / W));
    narrowMode = narrow;

    var targetW = Math.min(W * (narrow ? 0.50 : 0.30), 440);
    var wWorld = targetW / s0;
    var maxX = Math.max(0, (W / 2 - targetW / 2 - 12) / s0);

    frames.forEach(function (f) {
      f.w = wWorld;
      f.h = wWorld * 0.70;
      f.x = narrow ? f.side * (W * 0.25 / s0) : f.side * Math.min(560, maxX);
      f.y = 26;
    });

    section.style.height = ((CATS.length * (narrow ? 56 : 70)) + 100) + 'vh';
    readScroll(true);
  }

  function readScroll(immediate) {
    if (modalOpen) return;
    var total = Math.max(1, section.offsetHeight - window.innerHeight);
    p = clamp((window.scrollY - section.offsetTop) / total, 0, 1);
    camTarget = p * TRAVEL;
    if (immediate) camZ = camTarget;
  }

  /* ───────── drawing ───────── */
  function drawCover(img, x, y, w, h, alpha) {
    var iw = img.naturalWidth, ih = img.naturalHeight;
    if (!iw || !ih) return;
    var s = Math.max(w / iw, h / ih);
    var sw = w / s, sh = h / s;
    var sx = (iw - sw) / 2, sy = (ih - sh) / 2;
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
    ctx.globalAlpha = 1;
  }

  function drawWall() {
    var dz = Z_END - camZ;
    wallRect = null;
    if (dz < 120) return;
    var s = F / dz;
    var w = HALF_W * 2 * s, h = HALF_H * 2 * s;
    var l = CX - HALF_W * s, t = CY - HALF_H * s;
    wallRect = { l: l, t: t, w: w, h: h };

    ctx.fillStyle = '#08050a';
    ctx.fillRect(l, t, w, h);

    if (teamImg.complete && teamImg.naturalWidth) {
      if (narrowMode) {
        /* phones: show the whole team photo uncropped instead of a cover crop */
        var bw = Math.min(w, W), bh = Math.min(h, H);
        var ar = teamImg.naturalWidth / teamImg.naturalHeight;
        var pw = Math.min(bw, bh * ar), ph = pw / ar;
        ctx.drawImage(teamImg, CX - pw / 2, CY - ph / 2, pw, ph);
      } else {
        drawCover(teamImg, l, t, w, h, 1);
      }
      ctx.fillStyle = 'rgba(6,3,4,0.18)';
      ctx.fillRect(l, t, w, h);
    }

    ctx.strokeStyle = 'rgba(227,27,35,0.9)';
    ctx.lineWidth = Math.max(1.5, 5 * s);
    ctx.strokeRect(l, t, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = Math.max(1, 1.6 * s);
    ctx.strokeRect(l + 9 * s, t + 9 * s, Math.max(1, w - 18 * s), Math.max(1, h - 18 * s));
  }

  function drawGrid() {
    var near = camZ + 130;
    var far = Math.min(camZ + 5400, Z_END - 10);
    if (far <= near + 40) return;

    var lite = document.documentElement.classList.contains('lite');
    var step = (W < 760 ? 210 : 170) * (lite ? 2 : 1);

    for (var z = Math.ceil(near / step) * step; z < far; z += step) {
      var dz = z - camZ;
      var a = clamp(1 - (dz - 220) / 5200, 0, 1) * 0.32;
      if (a <= 0.012) continue;
      var s = F / dz;
      var hw = HALF_W * s, hh = HALF_H * s;
      ctx.strokeStyle = 'rgba(227,27,35,' + a.toFixed(3) + ')';
      ctx.lineWidth = 1;
      ctx.strokeRect(CX - hw, CY - hh, hw * 2, hh * 2);
    }

    var sn = F / (near - camZ);
    var sf = F / (far - camZ);
    ctx.strokeStyle = 'rgba(227,27,35,0.10)';
    ctx.lineWidth = 1;

    [-HALF_W, -HALF_W / 2, 0, HALF_W / 2, HALF_W].forEach(function (x) {
      [-HALF_H, HALF_H].forEach(function (y) {
        ctx.beginPath();
        ctx.moveTo(CX + x * sn, CY - y * sn);
        ctx.lineTo(CX + x * sf, CY - y * sf);
        ctx.stroke();
      });
    });
    [-HALF_H, 0, HALF_H].forEach(function (y) {
      [-HALF_W, HALF_W].forEach(function (x) {
        ctx.beginPath();
        ctx.moveTo(CX + x * sn, CY - y * sn);
        ctx.lineTo(CX + x * sf, CY - y * sf);
        ctx.stroke();
      });
    });
  }

  function drawFrameBody(f, l, t, w, h) {
    if (f.art) {
      ctx.drawImage(f.art, l, t, w, h);
    } else {
      ctx.fillStyle = '#120c0c';
      ctx.fillRect(l, t, w, h);
    }
    ctx.strokeStyle = f.cat.royal ? 'rgba(255,255,255,0.85)' : 'rgba(227,27,35,0.85)';
    ctx.lineWidth = Math.max(1, h * 0.014);
    ctx.strokeRect(l, t, w, h);
  }

  function drawOne(f) {
    var dz = f.z - camZ;
    f.rect = null;
    if (dz < 110 || dz > 5200) return;

    var s = F / dz;
    var w = f.w * s, h = f.h * s;
    var cxx = CX + f.x * s;
    var cyy = CY - f.y * s;
    var l = cxx - w / 2, t = cyy - h / 2;

    var alpha = clamp((5200 - dz) / 1700, 0, 1) * clamp((dz - 700) / 420, 0, 1);
    if (alpha <= 0.02) return;

    f.rect = { l: l, t: t, w: w, h: h, alpha: alpha, dz: dz };

    ctx.save();
    ctx.globalAlpha = alpha;

    /* glow behind the frame */
    var gl = ctx.createRadialGradient(cxx, cyy, h * 0.15, cxx, cyy, h * 1.15);
    gl.addColorStop(0, f.cat.royal ? 'rgba(255,255,255,0.14)' : 'rgba(227,27,35,0.22)');
    gl.addColorStop(1, 'rgba(227,27,35,0)');
    ctx.fillStyle = gl;
    ctx.fillRect(l - w * 0.28, t - h * 0.28, w * 1.56, h * 1.56);

    /* floor reflection, clipped so it dies out away from the frame */
    ctx.save();
    ctx.translate(0, (t + h) * 2 + 8);
    ctx.scale(1, -1);
    ctx.beginPath();
    ctx.rect(l, t, w, h * 0.55);
    ctx.clip();
    ctx.globalAlpha = alpha * 0.035;
    drawFrameBody(f, l, t, w, h);
    ctx.restore();

    drawFrameBody(f, l, t, w, h);

    if (hover === f) {
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = Math.max(1, 2);
      ctx.strokeRect(l - Math.max(4, w * 0.014), t - Math.max(4, w * 0.014), w + Math.max(8, w * 0.028), h + Math.max(8, w * 0.028));
    }
    ctx.restore();
  }

  function drawFrames() {
    for (var i = frames.length - 1; i >= 0; i--) drawOne(frames[i]);
  }

  function draw(t) {
    camZ += (camTarget - camZ) * 0.16;
    if (Math.abs(camTarget - camZ) < 0.4) camZ = camTarget;

    CX = W / 2 + Math.sin(t * 0.00034) * 7;
    CY = H / 2 + Math.cos(t * 0.00027) * 5;

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = '#060304';
    ctx.fillRect(0, 0, W, H);

    /* red haze at the vanishing point */
    var g = ctx.createRadialGradient(CX, CY, 0, CX, CY, Math.max(W, H) * 0.5);
    g.addColorStop(0, 'rgba(227,27,35,0.14)');
    g.addColorStop(0.45, 'rgba(227,27,35,0.05)');
    g.addColorStop(1, 'rgba(227,27,35,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    drawWall();
    drawGrid();
    drawFrames();
    syncHUD();
  }

  /* ───────── HUD ───────── */
  var lastSector = -1;
  function syncHUD() {
    var idx = clamp(Math.round((camZ + 430 - Z0) / GAP), 0, CATS.length - 1);
    if (idx !== lastSector) {
      lastSector = idx;
      if (sectorEl) sectorEl.textContent = 'SECTOR ' + pad(idx + 1) + ' / ' + pad(CATS.length) + ' · ' + CATS[idx].label;
      if (railEl) {
        [].forEach.call(railEl.children, function (b, i) { b.classList.toggle('on', i === idx); });
      }
    }
    if (depthEl) depthEl.textContent = 'DEPTH ' + pad4(camZ);

    if (introEl) {
      var o = clamp(1 - p * 22, 0, 1);
      introEl.style.opacity = o.toFixed(3);
      introEl.style.transform = 'translate(-50%, calc(-50% - ' + (p * 120).toFixed(1) + 'px))';
    }
    if (wallcapEl) wallcapEl.style.opacity = clamp((p - 0.84) / 0.11, 0, 1).toFixed(3);
  }

  /* ───────── loop ───────── */
  function loop(t) {
    if (!visible || document.hidden) { raf = 0; return; }
    draw(t);
    raf = requestAnimationFrame(loop);
  }
  function start() { if (!raf) raf = requestAnimationFrame(loop); }

  /* ───────── interaction ───────── */
  function pick(x, y) {
    for (var i = 0; i < frames.length; i++) {
      var f = frames[i];
      if (!f.rect || f.rect.alpha < 0.45) continue;
      var r = f.rect;
      if (x >= r.l && x <= r.l + r.w && y >= r.t && y <= r.t + r.h) return f;
    }
    return null;
  }
  function overWall(x, y) {
    if (!wallRect || p < 0.55) return false;
    return x >= wallRect.l && x <= wallRect.l + wallRect.w && y >= wallRect.t && y <= wallRect.t + wallRect.h;
  }

  canvas.addEventListener('pointermove', function (e) {
    var r = canvas.getBoundingClientRect();
    var x = e.clientX - r.left, y = e.clientY - r.top;
    var f = pick(x, y);
    if (f !== hover) hover = f;
    canvas.style.cursor = (f || overWall(x, y)) ? 'pointer' : 'default';
  });
  canvas.addEventListener('pointerleave', function () { hover = null; canvas.style.cursor = 'default'; });

  canvas.addEventListener('click', function (e) {
    if (modalOpen) return;
    var r = canvas.getBoundingClientRect();
    var x = e.clientX - r.left, y = e.clientY - r.top;
    var f = pick(x, y);
    if (f) { openCat(f.i); return; }
    if (overWall(x, y)) openPhoto();
  });

  /* ───────── modal ───────── */
  var modal = $('#tm-modal');
  var modalGrid = $('#tm-modal-grid');
  var modalTitle = $('#tm-modal-title');
  var modalSub = $('#tm-modal-sub');
  var lightbox = $('#tm-lightbox');
  var lightboxImg = $('#tm-lightbox-img');
  var lastFocus = null;
  var lockedY = 0;

  function lockScroll(on) {
    modalOpen = !!on;
    if (on) {
      lockedY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = (-lockedY) + 'px';
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      window.scrollTo(0, lockedY);
      readScroll(true);
    }
  }

  function openCat(i) {
    var c = CATS[i];
    if (!c || !modal) return;
    lastFocus = document.activeElement;
    modalTitle.textContent = c.label;
    modalSub.textContent = 'SECTOR ' + pad(i + 1) + ' / ' + pad(CATS.length) + ' · ' + c.members.length + ' MEMBERS';
    modalGrid.innerHTML = '<div class="tm-cards">' + c.members.map(function (p, k) {
      return cardHTML(p, k, c.royal);
    }).join('') + '</div>';
    modal.hidden = false;
    lockScroll(true);
    var x = modal.querySelector('.tm-modal-x');
    if (x) x.focus();
  }

  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    modalGrid.innerHTML = '';
    lockScroll(false);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function openPhoto() {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = IMG + 'team.mcu.jpg';
    lastFocus = document.activeElement;
    lightbox.hidden = false;
    lockScroll(true);
    var b = lightbox.querySelector('.tm-lightbox-close');
    if (b) b.focus();
  }
  function closePhoto() {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    lockScroll(false);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-close]');
    if (!t) return;
    if (!modal.hidden) closeModal();
    if (!lightbox.hidden) closePhoto();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!lightbox.hidden) { closePhoto(); return; }
    if (!modal.hidden) closeModal();
  });

  /* ───────── sector rail ───────── */
  function goStation(i) {
    var z = Z0 + i * GAP - 430;
    var prog = clamp(z / TRAVEL, 0, 1);
    var total = Math.max(1, section.offsetHeight - window.innerHeight);
    window.scrollTo({
      top: section.offsetTop + prog * total,
      behavior: reduce.matches ? 'auto' : 'smooth'
    });
  }

  function buildRail() {
    if (!railEl) return;
    railEl.innerHTML = CATS.map(function (c, i) {
      return '<button type="button" class="tm-tick" data-i="' + i + '" aria-label="Jump to ' + esc(c.label) + '">' +
        '<i aria-hidden="true"></i><span>' + esc(c.label) + '</span></button>';
    }).join('');
    railEl.addEventListener('click', function (e) {
      var b = e.target.closest('.tm-tick');
      if (!b) return;
      goStation(+b.dataset.i);
    });
  }

  /* ───────── boot ───────── */
  if (wallcapP) wallcapP.textContent = TEAM.length + ' people · MCU 2026–27';

  buildRail();
  buildArt();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { buildArt(); });
  }
  layout();

  window.addEventListener('scroll', function () { readScroll(false); }, { passive: true });
  window.addEventListener('resize', function () { layout(); }, { passive: true });
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) start();
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) start();
    }, { threshold: 0.01 }).observe(stage);
  }
  start();
})();
