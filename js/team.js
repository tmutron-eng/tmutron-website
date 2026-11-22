/* ══════════════════════════════════════════════════
   MCU — TEAM HALL
   Reads window.MCU_TEAM and window.MCU_TUNNEL (team.html).

   Scroll walks a camera down a gallery hall. Each sector is a
   framed cluster of real member portraits hung on the walls.
   Clicking a frame (or a dock tab) opens that sector as a
   full-screen floating cast, and a card expands into a
   readable bio with a way back to the hall.

   No libraries. One canvas for the hall structure, DOM for
   everything you read. The rAF loop only runs while the
   stage is on screen and the tab is visible.
   ══════════════════════════════════════════════════ */
(function () {
  'use strict';

  var TEAM = (window.MCU_TEAM || []).slice();
  var SRC = (window.MCU_TUNNEL || []).slice();
  if (!TEAM.length || !SRC.length) return;

  var IMG = 'assets/images/';
  var $ = function (s, r) { return (r || document).querySelector(s); };

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function pad(n) { n = String(n); return n.length < 2 ? '0' + n : n; }
  function pad4(n) { n = String(Math.max(0, Math.round(n))); while (n.length < 4) n = '0' + n; return n; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function initials(n) {
    var p = String(n).trim().split(/\s+/);
    return (p[0].charAt(0) + (p.length > 1 ? p[p.length - 1].charAt(0) : '')).toUpperCase();
  }
  function rnd(seed) {
    var x = Math.sin(seed * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  }

  /* ───────── who is in which sector ───────── */
  var CATS = SRC.map(function (c) {
    var copy = Object.assign({}, c);
    copy.members = TEAM.filter(function (p) {
      return (c.g && c.g.indexOf(p.g) > -1) ||
             (c.port && p.port && c.port.indexOf(p.port) > -1);
    });
    return copy;
  }).filter(function (c) { return c.members.length; });

  if (!CATS.length) return;

  /* ───────── copy that depends on the roster ───────── */
  var introP = $('#tm-intro-p');
  if (introP) introP.innerHTML = 'Walk the hall to meet the <b>' + TEAM.length + '</b> members behind MCU this year.';
  [].forEach.call(document.querySelectorAll('[data-team-count]'), function (el) {
    el.textContent = TEAM.length;
  });
  [].forEach.call(document.querySelectorAll('[data-sector-count]'), function (el) {
    el.textContent = pad(CATS.length);
  });

  /* ───────── cards ───────── */
  function photo(p, cls, eager) {
    if (!p.p) return '';
    return '<img class="' + cls + '" src="' + IMG + esc(p.p) + '" alt="' + esc(p.n) + '"' +
      (eager ? ' loading="eager"' : ' loading="lazy"') +
      ' decoding="async" onerror="this.remove()">';
  }

  function cardHTML(p, i, royal) {
    return '<article class="tm-card' + (royal ? ' royal' : '') + '">' +
      '<div class="tm-card-photo">' +
        '<span class="tm-mono" aria-hidden="true">' + esc(initials(p.n)) + '</span>' +
        photo(p, '') +
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
  buildRoster();

  var canvas = $('#tm-canvas');
  var ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Anyone who can't get the hall still gets the whole team. */
  if (!ctx || reduce.matches) return;

  document.body.classList.add('tunnel-on');

  var section = $('#tunnel');
  var stage = $('#tm-stage');
  var framesHost = $('#tm-frames');
  var wallEl = $('#tm-wall');
  var wallcapEl = $('#tm-wallcap');
  var wallcapP = $('#tm-wallcap-p');
  var wallcapBtn = $('#tm-wallcap-btn');
  var sectorEl = $('#tm-sector');
  var castEl = $('#tm-cast');
  var detailEl = $('#tm-detail');
  var sectorIndexEl = $('#tm-sector-index');
  var sectorTitleEl = $('#tm-sector-title');
  var sectorCountEl = $('#tm-sector-count');
  var sectorSubEl = $('#tm-sector-sub');
  var sectorBack = $('#tm-sector-back');
  var railEl = $('#tm-rail');
  var progressEl = $('#tm-progress');
  var sectorHud = $('#tm-sector-label');
  var depthEl = $('#tm-depth');
  var introEl = $('#tm-intro');
  var lightbox = $('#tm-lightbox');
  var lightboxImg = $('#tm-lightbox-img');

  /* ───────── frame chips ───────── */
  function faceHTML(p) {
    return '<span class="tm-face">' +
      '<i class="tm-face-init" aria-hidden="true">' + esc(initials(p.n)) + '</i>' +
      photo(p, '') +
    '</span>';
  }

  framesHost.innerHTML = CATS.map(function (c, i) {
    var show = c.members.slice(0, 4);
    var extra = c.members.length - show.length;
    return '<div class="tm-frame' + (c.royal ? ' is-royal' : '') + (c.members.length === 1 ? ' is-solo' : '') + '" data-i="' + i + '">' +
      '<div class="tm-frame-card">' +
        '<div class="tm-frame-top">' +
          '<span class="tm-frame-no mono">SECTOR ' + pad(i + 1) + '</span>' +
          '<span class="tm-frame-count mono">' + pad(c.members.length) + ' PPL</span>' +
        '</div>' +
        '<div class="tm-frame-strip">' +
          show.map(faceHTML).join('') +
          (extra > 0 ? '<span class="tm-face tm-face-more mono">+' + extra + '</span>' : '') +
        '</div>' +
        '<h3 class="tm-frame-title">' + esc(c.label) + '</h3>' +
        '<p class="tm-frame-sub">' + esc(c.sub || '') + '</p>' +
        '<div class="tm-frame-foot">' +
          '<span class="tm-frame-cta">Open sector</span>' +
          '<span class="tm-frame-arr" aria-hidden="true">↗</span>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');

  var frames = CATS.map(function (c, i) {
    return {
      cat: c, i: i,
      z: 0, x: 0, y: 33,
      el: framesHost.children[i]
    };
  });

  /* ───────── world ───────── */
  var HALF_W = 660, HALF_H = 440;
  var Z0 = 1500, GAP = 780;
  var Z_END = Z0 + (CATS.length - 1) * GAP + 1150;
  var TRAVEL = 1;

  var W = 0, H = 0, DPR = 1, F = 1, CX = 0, CY = 0, s0 = 1;
  var camZ = 0, camTarget = 0, p = 0;
  var raf = 0, visible = true;
  var sectorOpen = false, lockedY = 0, lastTrigger = null;

  frames.forEach(function (f) {
    f.z = Z0 + f.i * GAP;
    f.el.style.zIndex = String(100 - Math.round(f.z / 100));
  });

  /* ───────── sizing ───────── */
  function layout() {
    var r = stage.getBoundingClientRect();
    W = Math.max(320, Math.round(r.width || window.innerWidth));
    H = Math.max(320, Math.round(r.height || window.innerHeight));
    var narrow = W < 820;

    DPR = Math.min(window.devicePixelRatio || 1, narrow ? 1.35 : 1.6);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    CX = W / 2; CY = H / 2;
    s0 = (H / 2) / HALF_H;
    F = s0 * Z0;

    /* camera stops when the end wall just overfills the viewport */
    TRAVEL = Z_END - Z0 / 1.13;

    var fw = frames.length ? (frames[0].el.offsetWidth || 380) : 380;
    var xPx = Math.min(W * 0.305, W / 2 - fw * 0.3);

    frames.forEach(function (f) {
      f.x = (f.sideSign || (f.sideSign = f.i % 2 ? 1 : -1)) * (xPx / s0);
      f.y = narrow ? 20 : 33;
    });

    section.style.height = ((CATS.length * (narrow ? 60 : 76)) + 140) + 'vh';

    readScroll(true);
    if (sectorOpen) layoutCast();
  }

  function sectionTop() {
    return section.getBoundingClientRect().top + window.scrollY;
  }

  function readScroll(immediate) {
    if (sectorOpen) return;
    var total = Math.max(1, section.offsetHeight - window.innerHeight);
    p = clamp((window.scrollY - sectionTop()) / total, 0, 1);
    camTarget = p * TRAVEL;
    if (immediate) camZ = camTarget;
  }

  /* ───────── hall drawing ───────── */
  var motes = [];
  for (var m = 0; m < 46; m++) {
    motes.push({
      x: rnd(m + 2) * 1.9 - 0.95,
      y: rnd(m + 71) * 1.6 - 0.8,
      z: rnd(m + 131),
      sp: 0.35 + rnd(m + 211) * 0.9,
      s: 0.6 + rnd(m + 307) * 1.6
    });
  }

  function archPath(l, t, w, h) {
    var cx = l + w / 2;
    ctx.beginPath();
    ctx.moveTo(l, t + h);
    ctx.lineTo(l, t + h * 0.78);
    ctx.bezierCurveTo(l, t + h * 0.14, cx - w * 0.26, t, cx, t);
    ctx.bezierCurveTo(cx + w * 0.26, t, l + w, t + h * 0.14, l + w, t + h * 0.78);
    ctx.lineTo(l + w, t + h);
  }

  function drawMotes(t) {
    for (var i = 0; i < motes.length; i++) {
      var m0 = motes[i];
      var z = camZ + 260 + (((m0.z + t * 0.0000075 * m0.sp) % 1) * 4600);
      var dz = z - camZ;
      if (dz < 200) continue;
      var s = F / dz;
      var x = CX + m0.x * HALF_W * s;
      var y = CY + m0.y * HALF_H * s * 0.8;
      if (x < -20 || x > W + 20 || y < -20 || y > H + 20) continue;
      var a = clamp(1 - dz / 4600, 0, 1) * 0.5;
      ctx.fillStyle = 'rgba(255,190,190,' + a.toFixed(3) + ')';
      var size = clamp(m0.s * s * 1.6, 0.6, 2.2);
      ctx.fillRect(x, y, size, size);
    }
  }

  function drawHall(t) {
    var near = camZ + 120;
    var far = Math.min(camZ + 5400, Z_END - 60);
    if (far <= near + 60) return;

    var sn = F / (near - camZ);
    var sf = F / (far - camZ);

    /* long receding lines: floor, shoulders, ceiling spine */
    var lines = [
      [-HALF_W, HALF_H], [HALF_W, HALF_H],
      [-HALF_W, HALF_H * 0.78], [HALF_W, HALF_H * 0.78],
      [-HALF_W, -HALF_H * 0.36], [HALF_W, -HALF_H * 0.36],
      [0, -HALF_H]
    ];
    ctx.lineWidth = 1;
    for (var li = 0; li < lines.length; li++) {
      var lx = lines[li][0], ly = lines[li][1];
      ctx.strokeStyle = li === 6 ? 'rgba(227,27,35,0.16)' : 'rgba(227,27,35,0.10)';
      ctx.beginPath();
      ctx.moveTo(CX + lx * sn, CY + ly * sn);
      ctx.lineTo(CX + lx * sf, CY + ly * sf);
      ctx.stroke();
    }

    /* ribs */
    var RIB = 150;
    for (var z = Math.ceil(near / RIB) * RIB; z < far; z += RIB) {
      var dz = z - camZ;
      var s = F / dz;
      var hw = HALF_W * s, hh = HALF_H * s;
      var l = CX - hw, top = CY - hh, bot = CY + hh;

      var a = clamp(1 - (dz - 260) / 5000, 0, 1) * 0.62;
      if (a < 0.012) continue;

      archPath(l, top, hw * 2, hh * 2);
      ctx.strokeStyle = 'rgba(227,27,35,' + (a * 0.4).toFixed(3) + ')';
      ctx.lineWidth = 1;
      ctx.stroke();

      /* floor edge */
      ctx.strokeStyle = 'rgba(255,255,255,' + (a * 0.09).toFixed(3) + ')';
      ctx.beginPath();
      ctx.moveTo(l, bot);
      ctx.lineTo(l + hw * 2, bot);
      ctx.stroke();

      /* wall light strips */
      var sw = Math.max(1, hw * 0.014);
      var sh = Math.max(1.2, hh * 0.05);
      ctx.fillStyle = 'rgba(227,27,35,' + (a * 0.85).toFixed(3) + ')';
      ctx.fillRect(l + hw * 0.028, CY + hh * 0.34, sw, sh);
      ctx.fillRect(l + hw * 1.972 - sw, CY + hh * 0.34, sw, sh);
      ctx.fillStyle = 'rgba(227,27,35,' + (a * 0.12).toFixed(3) + ')';
      ctx.fillRect(l + hw * 0.028 - sw * 2, CY + hh * 0.34 - sh * 0.6, sw * 5, sh * 2.2);
      ctx.fillRect(l + hw * 1.972 - sw * 3, CY + hh * 0.34 - sh * 0.6, sw * 5, sh * 2.2);
    }

    /* a light ring that drifts down the hall */
    var ringZ = camZ + 1450 + Math.sin(t * 0.00042) * 380;
    if (ringZ < Z_END - 200) {
      var rdz = ringZ - camZ;
      var rs = F / rdz;
      var rhw = HALF_W * rs, rhh = HALF_H * rs;
      archPath(CX - rhw, CY - rhh, rhw * 2, rhh * 2);
      ctx.strokeStyle = 'rgba(255,90,90,0.14)';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
  }

  function draw(t) {
    camZ += (camTarget - camZ) * 0.145;
    if (Math.abs(camTarget - camZ) < 0.3) camZ = camTarget;

    CX = W / 2 + Math.sin(t * 0.00031) * 7;
    CY = H / 2 + Math.cos(t * 0.00026) * 5;

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#060304');
    bg.addColorStop(0.5, '#0a0506');
    bg.addColorStop(1, '#060304');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    var g = ctx.createRadialGradient(CX, CY, 0, CX, CY, Math.max(W, H) * 0.62);
    g.addColorStop(0, 'rgba(227,27,35,0.17)');
    g.addColorStop(0.32, 'rgba(180,20,30,0.07)');
    g.addColorStop(1, 'rgba(227,27,35,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    drawHall(t);
    drawMotes(t);
    syncScene(t);
  }

  /* ───────── DOM in the hall ───────── */
  var lastSector = -1;
  var railBtns = [];

  function syncScene() {
    /* intro */
    if (introEl) {
      var io = clamp(1 - p * 24, 0, 1);
      introEl.style.opacity = io.toFixed(3);
      introEl.style.transform = 'translate(-50%, calc(-50% - ' + (p * 120).toFixed(1) + 'px))';
      introEl.style.visibility = io < 0.01 ? 'hidden' : 'visible';
    }

    /* frames */
    var enter = clamp((p - 0.002) / 0.03, 0, 1);
    for (var i = 0; i < frames.length; i++) {
      var f = frames[i];
      var dz = f.z - camZ;
      var op = 0;
      if (dz > 420 && dz < 5400 && enter > 0.01) {
        op = enter *
          clamp((5400 - dz) / 1500, 0, 1) *
          clamp((dz - 420) / 300, 0, 1);
      }
      if (op < 0.004) {
        if (f.el.style.visibility !== 'hidden') f.el.style.visibility = 'hidden';
        continue;
      }
      var s = F / dz;
      var k = s / s0;
      f.el.style.visibility = 'visible';
      f.el.style.opacity = op.toFixed(3);
      f.el.style.pointerEvents = op > 0.55 ? 'auto' : 'none';
      f.el.style.transform =
        'translate(-50%,-50%) translate3d(' + (f.x * s).toFixed(1) + 'px,' +
        (-f.y * s).toFixed(1) + 'px,0) scale(' + k.toFixed(3) + ')';
    }

    /* end wall */
    var wdz = Z_END - camZ;
    if (wallEl) {
      var wop = clamp((5800 - wdz) / 2400, 0, 1);
      var ws = F / wdz;
      wallEl.style.opacity = wop.toFixed(3);
      wallEl.style.pointerEvents = wop > 0.55 ? 'auto' : 'none';
      wallEl.style.transform = 'translate(-50%,-50%) scale(' + (ws / s0).toFixed(3) + ')';
    }

    if (wallcapEl) wallcapEl.style.opacity = clamp((p - 0.855) / 0.09, 0, 1).toFixed(3);

    /* HUD */
    var idx = clamp(Math.round((camZ + 470 - Z0) / GAP), 0, CATS.length - 1);
    if (idx !== lastSector) {
      lastSector = idx;
      if (sectorHud) {
        sectorHud.textContent = 'SECTOR ' + pad(idx + 1) + ' / ' + pad(CATS.length) + ' · ' + CATS[idx].label;
      }
      for (var b = 0; b < railBtns.length; b++) {
        railBtns[b].classList.toggle('on', b === idx);
        railBtns[b].setAttribute('aria-current', b === idx ? 'true' : 'false');
      }
      if (railBtns[idx] && railEl && railEl.scrollWidth > railEl.clientWidth + 4) {
        var rr = railEl.getBoundingClientRect();
        var br = railBtns[idx].getBoundingClientRect();
        var target = railEl.scrollLeft + (br.left - rr.left) - (rr.width - br.width) / 2;
        railEl.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
      }
    }
    if (depthEl) depthEl.textContent = 'DEPTH ' + pad4(camZ);
    if (progressEl) progressEl.style.width = (p * 100).toFixed(2) + '%';
  }

  /* ───────── loop ───────── */
  function loop(t) {
    if (!visible || document.hidden) { raf = 0; return; }
    if (!sectorOpen) draw(t);
    raf = requestAnimationFrame(loop);
  }
  function start() { if (!raf) raf = requestAnimationFrame(loop); }

  /* ───────── sector dock ───────── */
  railEl.innerHTML = CATS.map(function (c, i) {
    return '<button type="button" class="tm-dock-btn" data-i="' + i + '" aria-label="Open ' + esc(c.label) + ', ' + c.members.length + ' members">' +
      '<span class="tm-dock-no mono">' + pad(i + 1) + '</span>' +
      '<span class="tm-dock-label">' + esc(c.label) + '</span>' +
      '<span class="tm-dock-count mono">' + c.members.length + '</span>' +
    '</button>';
  }).join('');

  railBtns = [].slice.call(railEl.querySelectorAll('.tm-dock-btn'));

  railEl.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.tm-dock-btn');
    if (!b) return;
    goStation(+b.dataset.i);
  });

  function goStation(i) {
    var z = Z0 + i * GAP - 470;
    var prog = clamp(z / TRAVEL, 0, 1);
    var total = Math.max(1, section.offsetHeight - window.innerHeight);
    /* jump instantly: the overlay covers the move, and closing the
       sector should land you exactly where that sector sits */
    window.scrollTo({ top: sectionTop() + prog * total, behavior: 'auto' });
    openSector(i, railBtns[i]);
  }

  /* ───────── opening frames ───────── */
  framesHost.addEventListener('click', function (e) {
    var f = e.target.closest && e.target.closest('.tm-frame');
    if (!f) return;
    openSector(+f.dataset.i, f);
  });

  if (wallEl) wallEl.addEventListener('click', openPhoto);
  if (wallcapBtn) wallcapBtn.addEventListener('click', openPhoto);

  /* ───────── the sector overlay ───────── */
  var current = null, currentIndex = -1;

  function personHTML(p, k, royal) {
    return '<div class="tm-person' + (royal ? ' is-royal' : '') + '" data-k="' + k + '" style="--i:' + k + '">' +
      '<div class="tm-person-float">' +
        '<button type="button" class="tm-person-card" data-k="' + k + '" aria-label="Read the bio of ' + esc(p.n) + ', ' + esc(p.f || p.r || 'member') + '">' +
          '<span class="tm-person-init" aria-hidden="true">' + esc(initials(p.n)) + '</span>' +
          photo(p, 'tm-person-img', true) +
          '<span class="tm-person-shade" aria-hidden="true"></span>' +
          '<span class="tm-person-no mono" aria-hidden="true">' + pad(k + 1) + '</span>' +
          '<span class="tm-person-info">' +
            '<span class="tm-person-role mono">' + esc(p.r || 'Member') + '</span>' +
            '<span class="tm-person-name">' + esc(p.n) + '</span>' +
            '<span class="tm-person-read mono">Read bio</span>' +
          '</span>' +
        '</button>' +
      '</div>' +
    '</div>';
  }

  function openSector(i, trigger) {
    var c = CATS[i];
    if (!c || !sectorEl) return;
    current = c;
    currentIndex = i;
    lastTrigger = trigger || railBtns[i] || null;

    closeDetail(true);
    closePhoto();

    sectorIndexEl.textContent = 'SECTOR ' + pad(i + 1) + ' / ' + pad(CATS.length);
    sectorTitleEl.textContent = c.label;
    sectorCountEl.textContent = c.members.length + ' MEMBERS';
    if (sectorSubEl) sectorSubEl.textContent = c.sub || '';
    castEl.innerHTML = c.members.map(function (p, k) { return personHTML(p, k, c.royal); }).join('');

    sectorEl.hidden = false;
    lockScroll(true);

    requestAnimationFrame(function () {
      layoutCast();
      sectorEl.classList.add('is-open');
      for (var b = 0; b < railBtns.length; b++) {
        railBtns[b].classList.toggle('on', b === i);
        railBtns[b].setAttribute('aria-current', b === i ? 'true' : 'false');
      }
    });

    setTimeout(function () {
      if (!detailEl || detailEl.hidden) {
        var first = castEl.querySelector('.tm-person-card');
        if (first) first.focus({ preventScroll: true });
      }
    }, 90);
  }

  function closeSector() {
    if (!sectorEl || sectorEl.hidden) return;
    closeDetail(true);
    sectorEl.classList.remove('is-open');
    lockScroll(false);
    setTimeout(function () {
      if (!sectorEl.classList.contains('is-open')) {
        sectorEl.hidden = true;
        castEl.innerHTML = '';
      }
    }, 300);
    if (lastTrigger && lastTrigger.focus) lastTrigger.focus({ preventScroll: true });
  }

  if (sectorBack) sectorBack.addEventListener('click', closeSector);

  /* the floating cast: everything fits one screen, with air */
  function layoutCast() {
    if (!current || !castEl) return;
    var r = castEl.getBoundingClientRect();
    var n = current.members.length;
    if (!n || r.width < 60 || r.height < 60) return;

    var availW = r.width, availH = r.height;
    var gap = clamp(Math.min(availW, availH) * 0.024, 8, 26);
    var AR = 0.75;                     /* card width / height */
    var maxCard = Math.min(availH * 0.84, 350);

    var best = null;
    for (var cols = 1; cols <= Math.min(n, 6); cols++) {
      var rows = Math.ceil(n / cols);
      var cellW = (availW - gap * (cols + 1)) / cols;
      var cellH = (availH - gap * (rows + 1)) / rows;
      var w = Math.min(cellW, cellH * AR, maxCard);
      if (w > 0 && (!best || w > best.w + 0.5)) best = { cols: cols, rows: rows, w: w };
    }
    if (!best) return;

    var cardW = best.w;
    var cardH = cardW / AR;
    var totalW = best.cols * cardW + (best.cols - 1) * gap;
    var totalH = best.rows * cardH + (best.rows - 1) * gap;
    var startX = (availW - totalW) / 2;
    var startY = (availH - totalH) / 2;

    var people = castEl.querySelectorAll('.tm-person');
    for (var i = 0; i < people.length; i++) {
      var row = Math.floor(i / best.cols);
      var col = i % best.cols;
      var inRow = Math.min(best.cols, n - row * best.cols);
      var rowW = inRow * cardW + (inRow - 1) * gap;
      var x = startX + (totalW - rowW) / 2 + col * (cardW + gap);
      var y = startY + row * (cardH + gap);

      var jx = (rnd(i * 3 + 1) - 0.5) * gap * 0.8;
      var jy = (rnd(i * 3 + 2) - 0.5) * gap * 1.1;
      var rot = (rnd(i * 3 + 3) - 0.5) * 4.4;

      var el = people[i];
      el.style.width = cardW.toFixed(1) + 'px';
      el.style.left = (x + jx).toFixed(1) + 'px';
      el.style.top = (y + jy).toFixed(1) + 'px';
      el.style.transform = 'rotate(' + rot.toFixed(2) + 'deg)';
    }
  }

  castEl.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.tm-person-card');
    if (!b) return;
    openPerson(+b.dataset.k, b);
  });

  /* ───────── the enlarged bio ───────── */
  function openPerson(k, cardEl) {
    var p0 = current && current.members[k];
    if (!p0 || !detailEl) return;

    var r = cardEl.getBoundingClientRect();
    var fx = (r.left + r.width / 2) - window.innerWidth / 2;
    var fy = (r.top + r.height / 2) - window.innerHeight / 2;
    detailEl.style.setProperty('--fx', fx.toFixed(0) + 'px');
    detailEl.style.setProperty('--fy', fy.toFixed(0) + 'px');

    detailEl.innerHTML =
      '<div class="tm-detail-card" role="document">' +
        '<button type="button" class="tm-detail-x" data-detail-close aria-label="Close bio">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
        '</button>' +
        '<div class="tm-detail-photo">' +
          '<span class="tm-detail-init" aria-hidden="true">' + esc(initials(p0.n)) + '</span>' +
          photo(p0, '', true) +
          '<span class="tm-detail-chip mono">SECTOR ' + pad(currentIndex + 1) + ' · ' + esc(current.label) + '</span>' +
        '</div>' +
        '<div class="tm-detail-body">' +
          '<p class="tm-detail-role mono">' + esc(p0.f || p0.r || 'Member') + '</p>' +
          '<h3 class="tm-detail-name">' + esc(p0.n) + '</h3>' +
          '<p class="tm-detail-bio">' + esc(p0.b || '') + '</p>' +
          '<div class="tm-detail-acts">' +
            '<button type="button" class="tm-detail-back" data-detail-close>' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>' +
              'Back to ' + esc(current.label) +
            '</button>' +
            '<span class="tm-detail-meta mono">MCU 2026–27</span>' +
          '</div>' +
        '</div>' +
      '</div>';

    detailEl.hidden = false;
    sectorEl.classList.add('has-detail');
    var x = detailEl.querySelector('[data-detail-close]');
    if (x) setTimeout(function () { x.focus({ preventScroll: true }); }, 80);
  }

  function closeDetail(silent) {
    if (!detailEl || detailEl.hidden) return;
    detailEl.hidden = true;
    detailEl.innerHTML = '';
    if (sectorEl) sectorEl.classList.remove('has-detail');
    if (!silent) {
      var first = castEl.querySelector('.tm-person-card');
      if (first) first.focus({ preventScroll: true });
    }
  }

  if (detailEl) {
    detailEl.addEventListener('click', function (e) {
      if (e.target.closest('[data-detail-close]')) { closeDetail(); return; }
      if (e.target === detailEl) closeDetail();
    });
  }

  /* ───────── scroll lock ───────── */
  function lockScroll(on) {
    sectorOpen = !!on;
    var html = document.documentElement;
    if (on) {
      lockedY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = (-lockedY) + 'px';
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      html.style.scrollBehavior = 'auto';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, lockedY);
      readScroll(true);
      requestAnimationFrame(function () { html.style.scrollBehavior = ''; });
    }
  }

  /* ───────── team photo ───────── */
  function openPhoto() {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = IMG + 'team.mcu.jpg';
    lightboxImg.alt = 'The MCU 2026-27 team together';
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    var b = lightbox.querySelector('.tm-lightbox-close');
    if (b) b.focus({ preventScroll: true });
  }
  function closePhoto() {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    if (!sectorOpen) document.body.style.overflow = '';
  }

  if (lightbox) {
    lightbox.addEventListener('click', function (e) {
      if ((e.target.closest && e.target.closest('[data-close]')) || e.target === lightbox) closePhoto();
    });
  }

  /* ───────── keyboard ───────── */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (lightbox && !lightbox.hidden) { closePhoto(); return; }
    if (detailEl && !detailEl.hidden) { closeDetail(); return; }
    if (sectorEl && !sectorEl.hidden) closeSector();
  });

  castEl.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var b = e.target.closest && e.target.closest('.tm-person-card');
    if (!b) return;
    e.preventDefault();
    openPerson(+b.dataset.k, b);
  });

  /* ───────── boot ───────── */
  if (wallcapP) wallcapP.textContent = TEAM.length + ' people · ' + CATS.length + ' sectors · MCU 2026–27';

  layout();

  window.addEventListener('scroll', function () { readScroll(false); }, { passive: true });
  window.addEventListener('resize', function () { layout(); }, { passive: true });
  window.addEventListener('orientationchange', function () { setTimeout(layout, 120); });

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) start();
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) start();
    }, { threshold: 0.01 }).observe(stage);
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { layout(); });
  }

  start();
})();
