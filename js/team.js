/* ══════════════════════════════════════════════════
   MCU: TEAM ROSTER
   Reads window.MCU_GROUPS, window.MCU_TEAM and window.MCU_SERIES (team.html).
   No libraries. SVG hand, CSS 3D cards. One rAF loop, running only while a
   stack is open, visible and moving. It stops when the tab is hidden.
   ══════════════════════════════════════════════════ */
(function () {
  'use strict';

  var doc = document;
  function $(s, r) { return (r || doc).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function safeUrl(u) { return /^https?:\/\//i.test(u || '') ? u : ''; }
  function initials(n) {
    var p = String(n).trim().split(/\s+/);
    return (p[0].charAt(0) + (p.length > 1 ? p[p.length - 1].charAt(0) : '')).toUpperCase();
  }
  function wrap180(d) { return ((d % 360) + 540) % 360 - 180; }
  /* seeded random: the same hand-tossed pile on every load */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var GROUPS = (window.MCU_GROUPS || []).slice();
  var TEAM = (window.MCU_TEAM || []).slice();
  var SERIES = window.MCU_SERIES || 'MCU';
  var IMG = 'assets/images/';
  var RAR = { foil: 'FOIL', holo: 'HOLO', chrome: 'CHROME', etched: 'ETCHED' };

  var stage = $('#roster'), art = $('#hand-art'), tipsEl = $('#hand-tips'), deck = $('#deck');
  var chipsEl = $('#chips'), intro = $('#intro'), hint = $('#st-hint');
  var hud = $('#hud'), hudT = $('#hud-t'), flt = $('#flt'), bkBtn = $('#hud-bk'), flBtn = $('#hud-fl');
  var legend = $('#legend'), live = $('#live');
  if (!stage || !GROUPS.length || !TEAM.length) return;

  var reduce = matchMedia('(prefers-reduced-motion: reduce)');
  var mqM = matchMedia('(max-width: 700px)');
  function lite() { return !!(window.MCU && window.MCU.lite); }
  function isFlow() { return mqM.matches || reduce.matches || lite(); }

  var CAP = 8;          /* most cards on the orbit ring, the rest sit in the pile */
  var PERIOD = 110;     /* seconds per orbit turn */
  var SPEED = 360 / PERIOD;

  var total = TEAM.length;
  var GM = {};
  GROUPS.forEach(function (g) { g.items = []; GM[g.id] = g; });
  TEAM.forEach(function (p, i) {
    p.no = i + 1;
    var g = GM[p.g];
    if (g) { p.grp = g; g.items.push(p); }
  });
  GROUPS = GROUPS.filter(function (g) { return g.items.length; });

  /* ───────── the robotic hand (SVG) ───────── */
  var VW = 720, VH = 380, OX = 65;
  var CORE = { x: 375, y: 305 };
  var FING = {
    thumb:  { x: 170, y: 300, a: -50, L: [60, 48, 38], w: [22, 19, 16], c: [0, -4, -7] },
    index:  { x: 268, y: 212, a: -9,  L: [70, 46, 36], w: [21, 18, 15], c: [0, 1, 3] },
    middle: { x: 352, y: 202, a: -1,  L: [78, 52, 40], w: [22, 19, 16], c: [0, 0, 2] },
    ring:   { x: 434, y: 210, a: 7,   L: [70, 46, 36], w: [21, 18, 15], c: [0, -1, -3] },
    pinky:  { x: 508, y: 230, a: 16,  L: [54, 36, 30], w: [18, 15, 13], c: [0, -1, -3] }
  };

  function buildHand() {
    var gOf = {};
    GROUPS.forEach(function (g) { gOf[g.finger] = g; });
    var s = '<svg viewBox="0 0 ' + VW + ' ' + VH + '" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">' +
      '<g class="hg"><g transform="translate(' + OX + ' 0)">';
    s += '<path class="d pm" pathLength="1" style="--dl:.05s" d="M250 214L330 204L372 202L452 212L528 234L540 300L500 380L212 380L176 338L170 300L205 262Z"/>';
    s += '<path class="d ln" pathLength="1" style="--dl:.3s" d="M268 212L352 202L434 210L508 230"/>';
    [[268, 212], [352, 202], [434, 210], [508, 230], [170, 300]].forEach(function (p, i) {
      s += '<path class="d ln" pathLength="1" style="--dl:' + (.35 + i * .06).toFixed(2) + 's" d="M' + p[0] + ' ' + p[1] + 'L' + CORE.x + ' ' + CORE.y + '"/>';
    });

    Object.keys(FING).forEach(function (key, i) {
      var f = FING[key], g = gOf[key];
      var x = f.x, y = f.y, ang = f.a, o = '', cl = '', j, L, hw;
      o += '<g transform="translate(' + f.x + ' ' + f.y + ') rotate(' + f.a + ')">'; cl = '</g>';
      for (j = 0; j < 3; j++) {
        L = f.L[j]; hw = f.w[j] / 2;
        var dl = (.25 + i * .13 + j * .12).toFixed(2);
        if (j > 0) {
          o += '<g transform="translate(0 ' + (-f.L[j - 1]) + ') rotate(' + f.c[j] + ')">'; cl += '</g>';
          ang += f.c[j];
        }
        o += '<path class="d seg" pathLength="1" style="--dl:' + dl + 's" d="M' + (-hw) + ' 0V' + (-L + hw) + 'A' + hw + ' ' + hw + ' 0 0 1 ' + hw + ' ' + (-L + hw) + 'V0A' + hw + ' ' + hw + ' 0 0 1 ' + (-hw) + ' 0Z"/>';
        o += '<path class="d ln" pathLength="1" style="--dl:' + dl + 's" d="M0 ' + (-hw) + 'V' + (-(L - hw)) + '"/>';
        o += '<circle class="jt" style="--ld:' + (.9 + i * .13 + j * .1).toFixed(2) + 's" r="' + (hw * .45).toFixed(1) + '"/>';
        var r = ang * Math.PI / 180, adv = (j === 2) ? (L - hw) : L;
        x += Math.sin(r) * adv; y -= Math.cos(r) * adv;
      }
      if (g) {
        var ld = (1.2 + i * .18).toFixed(2), cy = -(L - hw);
        o += '<circle class="halo" style="--ld:' + ld + 's" cx="0" cy="' + cy + '" r="14"/>';
        o += '<circle class="tn" data-g="' + esc(g.id) + '" style="--ld:' + ld + 's" cx="0" cy="' + cy + '" r="7"/>';
        g.fx = (x + OX) / VW; g.fy = y / VH; g.ld = ld;
      }
      s += o + cl;
    });

    s += '<g class="core" transform="translate(' + CORE.x + ' ' + CORE.y + ')">' +
      '<circle class="halo" style="--ld:1.5s" r="40"/>' +
      '<path class="d" pathLength="1" style="--dl:.7s" d="M-34 0A34 34 0 1 1 34 0A34 34 0 1 1 -34 0Z"/>' +
      '<path class="d" pathLength="1" style="--dl:.8s" d="M22 0L11 19.05L-11 19.05L-22 0L-11 -19.05L11 -19.05Z"/>' +
      '<text y="1">MCU</text></g>';
    s += '</g></g><rect class="scan" x="0" y="0" width="' + VW + '" height="2"/></svg>';
    art.innerHTML = s;
  }

  /* ───────── fingertip buttons, phone chips, legend ───────── */
  var layers = 8;
  function buildTips() {
    var rr = rng(99);
    tipsEl.innerHTML = GROUPS.map(function (g) {
      var n = g.items.length, st = '', k;
      for (k = 0; k < Math.min(n, layers); k++) {
        st += '<i class="ms r-' + g.rarity + '" style="--k:' + k + ';--rr:' + ((rr() - .5) * 8).toFixed(1) + 'deg"></i>';
      }
      return '<button type="button" class="tip" data-g="' + esc(g.id) + '" style="left:' + (g.fx * 100).toFixed(2) + '%;top:' + (g.fy * 100).toFixed(2) + '%;--ld:' + g.ld + 's"' +
        ' aria-label="' + esc(g.label) + ', ' + n + (n === 1 ? ' card' : ' cards') + '. Open stack" aria-expanded="false" aria-controls="deck">' +
        '<span class="tp-lab">' + esc(g.short) + '<b>' + pad(n) + '</b></span>' +
        '<span class="tp-stack" aria-hidden="true">' + st + '</span><span class="tp-hit" aria-hidden="true"></span></button>';
    }).join('');
    chipsEl.innerHTML = GROUPS.map(function (g) {
      return '<button type="button" class="chip" data-g="' + esc(g.id) + '" aria-pressed="false" aria-label="' + esc(g.label) + ', ' + g.items.length + ' cards">' +
        esc(g.short) + '<b>' + pad(g.items.length) + '</b></button>';
    }).join('');
    g_each_tip();
  }
  var tipBtns = {}, chipBtns = {};
  function g_each_tip() {
    $$('.tip', tipsEl).forEach(function (b) { tipBtns[b.getAttribute('data-g')] = b; });
    $$('.chip', chipsEl).forEach(function (b) { chipBtns[b.getAttribute('data-g')] = b; });
  }
  function buildLegend() {
    var order = ['foil', 'holo', 'chrome', 'etched'], out = '';
    order.forEach(function (r) {
      var gs = GROUPS.filter(function (g) { return g.rarity === r; });
      if (!gs.length) return;
      out += '<li class="r-' + r + '"><i class="ms r-' + r + '" style="position:static;transform:none"></i><b>' + RAR[r] + '</b>' +
        esc(gs.map(function (g) { return g.short; }).join(', ')) + '</li>';
    });
    legend.innerHTML = out;
  }

  /* ───────── cards ───────── */
  var cards = [];
  TEAM.forEach(function (p, i) {
    var g = p.grp; if (!g) return;
    var role = p.f || p.r, r = rng(i * 7919 + 13), url = safeUrl(p.li);
    var nf = Math.min(12, 84 / (p.n.length * .43)).toFixed(2);
    var rf = Math.min(5.2, 84 / (role.length * .54)).toFixed(2);
    var el = doc.createElement('div');
    el.className = 'pc r-' + g.rarity;
    el.hidden = true;
    el.setAttribute('role', 'group');
    el.setAttribute('aria-label', p.n + ', ' + role);
    el.innerHTML =
      '<div class="pc-tilt"><div class="pc-in">' +
        '<div class="pf pfr"><div class="ph"><span class="ini" aria-hidden="true">' + esc(initials(p.n)) + '</span>' +
          '<span class="rt mono">' + RAR[g.rarity] + '</span>' + (p.fresh ? '<span class="nw mono">NEW</span>' : '') + '</div>' +
          '<div class="pn"><span class="nm" style="font-size:calc(' + nf + ' * var(--u))">' + esc(p.n) + '</span>' +
          '<span class="rl" style="font-size:calc(' + rf + ' * var(--u))">' + esc(role) + '</span>' +
          '<span class="ft mono"><i>No. ' + pad(p.no) + ' / ' + pad(total) + '</i><i>' + esc(SERIES) + '</i></span></div>' +
          '<span class="sh" aria-hidden="true"></span></div>' +
        '<div class="pf pb" inert><div class="bk-h"><span class="bk-nm">' + esc(p.n) + '</span><span class="bk-rl">' + esc(role) + '</span></div>' +
          (p.port ? '<div class="bk-pt mono">PORTFOLIO<b>' + esc(p.port) + '</b></div>' : '') +
          (p.b ? '<p class="pc-bio" tabindex="0">' + esc(p.b) + '</p>' : '<div class="pc-bio"></div>') +
          (url ? '<a class="pc-li" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">LinkedIn</a>' : '') + '</div>' +
      '</div></div>' +
      '<button type="button" class="pc-hit" aria-label="' + esc(p.n + ', ' + role + '. Card ' + p.no + ' of ' + total + '. Open card') + '"></button>';

    var ph = $('.ph', el);
    if (p.p) {
      var im = doc.createElement('img');
      im.alt = p.n + ', ' + role;
      im.loading = 'lazy'; im.decoding = 'async';
      im.addEventListener('load', function () { ph.classList.add('has'); });
      im.addEventListener('error', function () { im.remove(); });
      im.src = IMG + p.p;
      ph.insertBefore(im, $('.rt', ph));
    }
    var c = {
      p: p, g: g, el: el, tilt: $('.pc-tilt', el), sh: $('.sh', el), hit: $('.pc-hit', el), back: $('.pb', el), bio: $('.pc-bio', el),
      x: 0, y: 0, s: .2, r: 0, ry: 0, o: 0, z: 1, t: null,
      rot0: (r() - .5) * 16, jx: r() * 2 - 1, jy: r() * 2 - 1, jr: (r() - .5) * 40,
      flipped: false, inL: false
    };
    p.card = c;
    cards.push(c);
    deck.appendChild(el);
    bindCard(c);
  });

  /* ───────── state and layout ───────── */
  var S = {
    g: null, port: 'All', list: [], ring: [], pile: [], focus: null,
    ang: 0, angT: null, vel: 0, spin: 1, pos: 0, posT: 0,
    hv: false, fcs: false, drag: false, t0: 0, packed: false,
    raf: 0, last: 0, vis: true, mode: 'orbit', mob: false
  };
  var L = { W: 0, H: 0, cw: 200, ch: 280, cx: 0, cy: 0, Rx: 0, Ry: 0, fx: 0, fy: 0, f: 1, gap: 0, tipS: .15 };

  function layout() {
    var sr = stage.getBoundingClientRect();
    L.W = sr.width; L.H = sr.height;
    var mob = mqM.matches, prevMode = S.mode;
    S.mob = mob;
    S.mode = isFlow() ? 'flow' : 'orbit';
    var hbw = art.offsetWidth, hbh = art.offsetHeight, hbl = art.offsetLeft, hbt = art.offsetTop;
    GROUPS.forEach(function (g) { g.tx = hbl + g.fx * hbw; g.ty = hbt + g.fy * hbh; });

    if (mob) {
      var cb = hbt + hbh + 8;
      chipsEl.style.top = cb + 'px';
      var top0 = cb + 52 + 10, av = L.H - top0 - 96;
      L.cw = Math.max(130, Math.min(L.W * .6, av * .8 / 1.4));
      L.cx = L.W / 2; L.cy = top0 + av * .46;
      L.fx = L.cx; L.fy = top0 + av / 2;
      L.f = Math.min(L.W * .94 / L.cw, av * .98 / (L.cw * 1.4));
      intro.style.top = top0 + 'px';
      stage.style.removeProperty('--hy');
    } else {
      chipsEl.style.top = '';
      intro.style.top = '';
      L.cw = Math.max(150, Math.min(300, L.H * .34, L.W * .3));
      L.cx = L.W / 2; L.cy = L.H * .27;
      L.fx = L.cx; L.fy = L.H * .4;
      L.f = Math.min(L.H * .72 / (L.cw * 1.4), L.W * .92 / L.cw);
      stage.style.setProperty('--hy', (L.H * .2).toFixed(0) + 'px');
    }
    L.ch = L.cw * 1.4;
    L.Rx = Math.max(120, Math.min(L.W * .36, L.W / 2 - L.cw * .42 - 12, 440));
    L.Ry = L.H * .05;
    L.gap = L.cw * (mob ? .58 : .62);
    L.tipS = 34 / L.cw;
    stage.style.setProperty('--cw', L.cw.toFixed(1) + 'px');
    if (S.g && prevMode !== S.mode) { buildLists(); }
    kick();
  }

  /* ───────── targets ───────── */
  function T(c, x, y, s, r, ry, o, z) { c.t = { x: x, y: y, s: s, r: r, ry: ry, o: o, z: z }; }
  function toTip(c) {
    var g = c.g;
    T(c, g.tx, g.ty - (S.mob ? 0 : 56), L.tipS, c.rot0, 0, 0, 1);
  }

  function aim(now) {
    var flow = S.mode === 'flow', el = now - S.t0, n = S.list.length, open = !!S.g;
    cards.forEach(function (c) { c.inL = false; });
    if (open) S.list.forEach(function (c) { c.inL = true; });
    cards.forEach(function (c) { if (!c.inL) toTip(c); });
    if (!open) return;

    if (n === 1) {
      var one = S.list[0];
      if (el < 0) toTip(one); else T(one, L.cx, L.cy + (flow ? 0 : L.Ry * 1.4), .9, 0, 0, 1, 80);
    } else if (flow) {
      S.ring.forEach(function (c, i) {
        if (el < i * 25) { toTip(c); return; }
        var d = i - S.pos, ad = Math.abs(d), sg = d < 0 ? -1 : 1;
        var x = L.cx + sg * (Math.min(ad, 1) * L.gap + Math.max(0, ad - 1) * L.gap * .45);
        T(c, x, L.cy, .86 - .14 * Math.min(ad, 2), 0, -clamp(d, -1.5, 1.5) * 26, ad > 3.2 ? 0 : 1 - .2 * Math.min(ad, 3), 200 - Math.round(ad * 20));
      });
    } else {
      var m = S.ring.length, step = 360 / m, mid = (m - 1) / 2;
      S.ring.forEach(function (c, k) {
        if (el < k * 40) { toTip(c); return; }
        if (el < 700) {
          var d = k - mid, gp = Math.min(L.cw * .5, (L.W * .82) / m);
          T(c, L.cx + d * gp, L.cy + L.Ry + d * d * L.cw * .012, .78, d * 6, 0, 1, 60 + k);
          return;
        }
        var th = (S.ang + k * step) * Math.PI / 180, sn = Math.sin(th), cs = Math.cos(th), dp = (cs + 1) / 2;
        T(c, L.cx + sn * L.Rx, L.cy + cs * L.Ry, .5 + .3 * dp, sn * 3, -sn * 24, .35 + .65 * Math.pow(dp, .8), 50 + Math.round(dp * 100));
      });
      S.pile.forEach(function (c, k) {
        if (el < (m + k) * 30) { toTip(c); return; }
        T(c, L.cx + c.jx * L.cw * .55, L.cy + L.Ry * .2 + c.jy * L.cw * .22, .5, c.jr, 0, .96, 100);
      });
    }

    if (S.focus && S.focus.t) {
      S.list.forEach(function (c) { if (c !== S.focus && c.t) c.t.o = Math.min(c.t.o, .2); });
      T(S.focus, L.fx, L.fy, L.f, 0, 0, 1, 500);
    }
  }

  function put(c) {
    c.el.style.transform = 'translate3d(' + (c.x - L.cw / 2).toFixed(1) + 'px,' + (c.y - L.ch / 2).toFixed(1) + 'px,0) rotateY(' + c.ry.toFixed(1) +
      'deg) rotate(' + c.r.toFixed(1) + 'deg) scale(' + c.s.toFixed(3) + ')';
    c.el.style.opacity = c.o.toFixed(2);
    c.el.style.zIndex = c.z | 0;
    var vis = c.o >= .05;
    c.el.style.pointerEvents = vis ? 'auto' : 'none';
    c.hit.tabIndex = vis ? 0 : -1;
  }

  function step(dt) {
    var k = reduce.matches ? 1 : 1 - Math.exp(-dt * 9), moving = false;
    cards.forEach(function (c) {
      if (c.el.hidden || !c.t) return;
      var t = c.t;
      c.x += (t.x - c.x) * k; c.y += (t.y - c.y) * k; c.s += (t.s - c.s) * k;
      c.r += (t.r - c.r) * k; c.ry += (t.ry - c.ry) * k; c.o += (t.o - c.o) * k;
      c.z = t.z;
      var dif = Math.abs(t.x - c.x) + Math.abs(t.y - c.y) + Math.abs(t.s - c.s) * 100 + Math.abs(t.o - c.o) * 100 + Math.abs(t.r - c.r) + Math.abs(t.ry - c.ry);
      if (dif > .4) moving = true;
      else { c.x = t.x; c.y = t.y; c.s = t.s; c.r = t.r; c.ry = t.ry; c.o = t.o; }
      put(c);
      if (!c.inL && t.o === 0 && c.o < .02) c.el.hidden = true;
    });
    return moving;
  }

  function tick(now) {
    S.raf = 0;
    if (doc.hidden || !S.vis) return;
    var dt = Math.min(.05, (now - S.last) / 1000);
    S.last = now;
    var run = false;

    if (S.g && S.mode === 'orbit' && S.list.length > 1) {
      var paused = S.hv || S.fcs || S.focus || S.drag || S.angT != null || (now - S.t0) < 750;
      var want = paused ? 0 : 1;
      S.spin += (want - S.spin) * (1 - Math.exp(-dt * 4));
      if (want === 0 && S.spin < .004) S.spin = 0;
      S.ang += S.spin * SPEED * dt + S.vel * dt;
      S.vel *= Math.exp(-dt * 3);
      if (Math.abs(S.vel) < .5) S.vel = 0;
      if (S.angT != null) {
        var dd = wrap180(S.angT - S.ang);
        S.ang += dd * (1 - Math.exp(-dt * 6));
        if (Math.abs(dd) < .15) { S.ang = S.angT; S.angT = null; }
      }
      if (want === 1 || S.spin > 0 || S.vel !== 0 || S.angT != null) run = true;
    }
    if (S.g && S.mode === 'flow' && !S.drag) {
      var df = S.posT - S.pos;
      if (Math.abs(df) < .003) S.pos = S.posT;
      else { S.pos += df * (reduce.matches ? 1 : 1 - Math.exp(-dt * 8)); run = true; }
    }
    if (S.g && now - S.t0 < 800) run = true;

    aim(now);
    if (step(dt)) run = true;
    if (run) S.raf = requestAnimationFrame(tick);
  }
  function kick() {
    if (S.raf || doc.hidden || !S.vis) return;
    S.last = performance.now();
    S.raf = requestAnimationFrame(tick);
  }

  /* ───────── open, close, lists ───────── */
  function showCard(c) {
    if (!c.el.hidden) return;
    c.el.hidden = false;
    var g = c.g;
    c.x = g.tx; c.y = g.ty - (S.mob ? 0 : 56); c.s = L.tipS; c.o = 0; c.r = c.rot0; c.ry = 0;
    put(c);
  }

  function buildLists() {
    var g = S.g;
    S.list = g.items.filter(function (p) { return S.port === 'All' || p.port === S.port; }).map(function (p) { return p.card; });
    var cap = S.mode === 'flow' ? 9999 : CAP;
    S.ring = S.list.slice(0, cap);
    S.pile = S.list.slice(cap);
    S.pos = 0; S.posT = 0; S.angT = null;
    S.list.forEach(showCard);
  }

  function announce(t) { live.textContent = t; }

  function setActive(g) {
    Object.keys(tipBtns).forEach(function (id) {
      var on = g && g.id === id;
      tipBtns[id].classList.toggle('act', !!on);
      tipBtns[id].setAttribute('aria-expanded', on ? 'true' : 'false');
      if (chipBtns[id]) { chipBtns[id].classList.toggle('act', !!on); chipBtns[id].setAttribute('aria-pressed', on ? 'true' : 'false'); }
    });
    $$('.tn', art).forEach(function (n) { n.classList.toggle('act', !!g && n.getAttribute('data-g') === g.id); });
  }

  function openG(g) {
    if (S.g === g) return;
    var prev = S.g;
    if (S.focus) { setFlip(S.focus, false); S.focus = null; stage.classList.remove('focus'); }
    S.g = g; S.port = 'All'; S.hv = false; S.fcs = false; S.vel = 0;
    stage.classList.add('open');
    setActive(g);
    if (prev && tipBtns[prev.id]) { var pb = tipBtns[prev.id]; setTimeout(function () { if (S.g !== prev) pb.classList.remove('emp'); }, 400); }
    tipBtns[g.id].classList.add('emp');

    var fancy = !S.packed && !S.mob && !reduce.matches && !lite() && !prev;
    S.packed = true;
    S.t0 = performance.now() + (fancy ? 480 : 0);
    if (reduce.matches) S.t0 = performance.now() - 2000;
    buildLists();
    buildFilter();
    hudRefresh();
    if (fancy) pack(g);

    var n = g.items.length;
    announce(g.label + ' stack open, ' + n + (n === 1 ? ' card' : ' cards') + '. ' +
      (n > 1 ? 'Use the left and right arrow keys to move through the cards. ' : '') + 'Press Escape to close.');
    kick();
    setTimeout(function () {
      var c = S.focus || S.ring[0] || S.list[0];
      if (c && S.g === g) c.hit.focus({ preventScroll: true });
    }, 80);
  }

  function closeStack() {
    var g = S.g; if (!g) return;
    if (S.focus) { setFlip(S.focus, false); S.focus = null; }
    var inside = doc.activeElement && (deck.contains(doc.activeElement) || hud.contains(doc.activeElement));
    S.g = null; S.hv = false; S.fcs = false; S.drag = false;
    stage.classList.remove('open', 'focus', 'drag');
    setActive(null);
    var b = tipBtns[g.id];
    setTimeout(function () { if (!S.g) b.classList.remove('emp'); }, 450);
    hud.hidden = true;
    announce(g.label + ' stack closed.');
    if (inside) {
      var t = (S.mob ? chipBtns[g.id] : b);
      if (t) t.focus({ preventScroll: true });
    }
    kick();
  }

  function pack(g) {
    var p = doc.createElement('div');
    p.className = 'pack';
    p.style.left = g.tx + 'px'; p.style.top = (g.ty - 56) + 'px';
    p.innerHTML = '<span class="pk-b"></span><span class="pk-t"></span><span class="pk-fl"></span>';
    deck.appendChild(p);
    setTimeout(function () { p.classList.add('go'); }, 260);
    setTimeout(function () { p.remove(); }, 900);
  }

  /* ───────── routing (hash: #vps, #president, ...) ───────── */
  function route() {
    var id = location.hash.slice(1), g = GM[id];
    if (g && g.items.length) openG(g); else if (S.g) closeStack();
  }
  function back() {
    try { history.pushState(null, '', location.pathname + location.search); } catch (e) { location.hash = ''; }
    route();
  }
  window.addEventListener('hashchange', route);

  function choose(g) {
    if (S.g === g) { back(); return; }
    if (location.hash.slice(1) !== g.id) location.hash = g.id; else route();
  }
  tipsEl.addEventListener('click', function (e) {
    var b = e.target.closest('.tip'); if (b) choose(GM[b.getAttribute('data-g')]);
  });
  chipsEl.addEventListener('click', function (e) {
    var b = e.target.closest('.chip'); if (b) choose(GM[b.getAttribute('data-g')]);
  });

  /* ───────── HUD and portfolio filter ───────── */
  function hudRefresh() {
    if (!S.g) { hud.hidden = true; return; }
    hud.hidden = false;
    var n = S.list.length, parts = [S.g.short.toUpperCase()];
    if (S.port !== 'All') parts.push(S.port.toUpperCase());
    parts.push(n + (n === 1 ? ' CARD' : ' CARDS'));
    if (n > 1) parts.push(S.mode === 'orbit' ? 'ORBIT ' + (PERIOD < 100 ? '0' : '') + PERIOD + ' S' : 'SWIPE');
    hudT.textContent = parts.join(' / ');
    bkBtn.textContent = S.focus ? 'Back to deck' : 'Close stack';
    flBtn.hidden = !S.focus;
  }
  function buildFilter() {
    var g = S.g, cnt = {}, order = [];
    g.items.forEach(function (p) {
      if (!p.port) return;
      if (!cnt[p.port]) { cnt[p.port] = 0; order.push(p.port); }
      cnt[p.port]++;
    });
    var useful = order.some(function (k) { return cnt[k] > 1; });
    flt.hidden = !useful;
    if (!useful) { flt.innerHTML = ''; return; }
    flt.innerHTML = ['All'].concat(order).map(function (k) {
      return '<button type="button" data-p="' + esc(k) + '" aria-pressed="' + (k === S.port) + '">' + esc(k) + (k === 'All' ? '' : ' ' + cnt[k]) + '</button>';
    }).join('');
  }
  flt.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b || !S.g) return;
    if (S.focus) unfocus(true);
    S.port = b.getAttribute('data-p');
    S.t0 = performance.now() - 1000;
    buildLists();
    $$('button', flt).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    hudRefresh();
    announce(S.list.length + ' cards shown' + (S.port === 'All' ? '.' : ' for ' + S.port + '.'));
    kick();
  });
  bkBtn.addEventListener('click', function () { if (S.focus) unfocus(); else back(); });
  flBtn.addEventListener('click', function () { if (S.focus) setFlip(S.focus, !S.focus.flipped); });

  /* ───────── card interactions ───────── */
  function setFlip(c, on) {
    c.flipped = on;
    c.el.classList.toggle('fl', on);
    c.back.inert = !on;
    c.hit.inert = on;
  }
  function focusCard(c) {
    if (S.focus && S.focus !== c) setFlip(S.focus, false);
    S.focus = c;
    setFlip(c, true);
    stage.classList.add('focus');
    if (S.mode === 'flow') { var i = S.list.indexOf(c); if (i > -1) S.posT = i; }
    hudRefresh();
    announce(c.p.n + ', ' + (c.p.f || c.p.r) + '. Card turned over. Press Escape to go back.');
    kick();
    if (c.bio && c.bio.tabIndex === 0) c.bio.focus({ preventScroll: true });
  }
  function unfocus(quiet) {
    var c = S.focus; if (!c) return;
    setFlip(c, false);
    S.focus = null;
    stage.classList.remove('focus');
    hudRefresh();
    kick();
    if (!quiet) c.hit.focus({ preventScroll: true });
  }
  function stepFocus(d) {
    var n = S.list.length; if (n < 2) return;
    var i = S.list.indexOf(S.focus);
    focusCard(S.list[(i + d + n) % n]);
  }
  function rotate(d) {
    if (S.mode === 'flow') { S.posT = clamp(Math.round(S.posT) + d, 0, S.list.length - 1); }
    else {
      var m = S.ring.length; if (m < 2) return;
      S.angT = (S.angT != null ? S.angT : S.ang) - d * 360 / m;
    }
    kick();
  }
  function drawPile(c) {
    var m = S.ring.length, step = 360 / m, ri = 0, low = 2, k;
    for (k = 0; k < m; k++) {
      var cs = Math.cos((S.ang + k * step) * Math.PI / 180);
      if (cs < low) { low = cs; ri = k; }
    }
    var out = S.ring[ri];
    S.ring[ri] = c;
    S.pile[S.pile.indexOf(c)] = out;
    S.angT = -ri * step;
    kick();
  }
  function onCard(c) {
    if (S.noClick) return;
    if (S.focus === c) { setFlip(c, !c.flipped); return; }
    if (S.focus) { focusCard(c); return; }
    if (S.list.length === 1) { focusCard(c); return; }
    if (S.mode === 'flow') {
      var i = S.list.indexOf(c);
      if (i === Math.round(S.posT)) focusCard(c); else { S.posT = i; kick(); }
      return;
    }
    if (S.pile.indexOf(c) > -1) { drawPile(c); return; }
    focusCard(c);
  }

  function bindCard(c) {
    var rect = null, raf = 0, ev = null, tm = 0;
    c.hit.addEventListener('click', function () { onCard(c); });
    c.hit.addEventListener('focus', function () {
      if (c.hit.matches(':focus-visible')) { S.fcs = true; }
    });
    c.hit.addEventListener('blur', function () { S.fcs = false; kick(); });
    c.el.addEventListener('pointerenter', function (e) {
      if (e.pointerType !== 'mouse' || reduce.matches || lite()) return;
      S.hv = true;
      rect = c.el.getBoundingClientRect();
      clearTimeout(tm);
      tm = setTimeout(function () { if (S.hv) rect = c.el.getBoundingClientRect(); }, 380);
    });
    c.el.addEventListener('pointermove', function (e) {
      if (!rect || e.pointerType !== 'mouse') return;
      ev = e;
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        if (!rect || !ev) return;
        var nx = clamp((ev.clientX - rect.left) / rect.width, 0, 1), ny = clamp((ev.clientY - rect.top) / rect.height, 0, 1);
        c.tilt.style.transform = 'perspective(800px) rotateX(' + ((.5 - ny) * 12).toFixed(2) + 'deg) rotateY(' + ((nx - .5) * 16).toFixed(2) + 'deg)';
        c.sh.style.transform = 'translate3d(' + ((.5 - nx) * 66).toFixed(1) + '%,0,0)';
      });
    });
    c.el.addEventListener('pointerleave', function () {
      S.hv = false; rect = null; clearTimeout(tm);
      c.tilt.style.transform = ''; c.sh.style.transform = '';
      kick();
    });
  }

  /* keyboard: arrows rotate or step, Escape backs out */
  doc.addEventListener('keydown', function (e) {
    if (!S.g) return;
    if (e.target && e.target.closest && e.target.closest('input,textarea')) return;
    var k = e.key;
    if (k === 'Escape') { e.preventDefault(); if (S.focus) unfocus(); else back(); }
    else if (k === 'ArrowRight' || k === 'ArrowLeft') {
      e.preventDefault();
      var d = k === 'ArrowRight' ? 1 : -1;
      if (S.focus) stepFocus(d); else rotate(d);
    }
  });

  /* drag or swipe to rotate (touch-action: pan-y keeps page scroll working) */
  var dr = null;
  stage.addEventListener('pointerdown', function (e) {
    if (!S.g || e.button > 0) return;
    if (e.target.closest('.tip,.chip,.st-hud,.pc-bio,.pc-li,a,input')) return;
    dr = { id: e.pointerId, x: e.clientX, lx: e.clientX, lt: performance.now(), moved: false };
  });
  stage.addEventListener('pointermove', function (e) {
    if (!dr || e.pointerId !== dr.id) return;
    if (!dr.moved) {
      if (Math.abs(e.clientX - dr.x) < 6) return;
      dr.moved = true; S.drag = true;
      try { stage.setPointerCapture(e.pointerId); } catch (err) {}
      stage.classList.add('drag');
    }
    var now = performance.now(), dx = e.clientX - dr.lx, dt = Math.max(.008, (now - dr.lt) / 1000);
    dr.lx = e.clientX; dr.lt = now;
    if (S.focus || !S.g) return;
    if (S.mode === 'flow') { S.pos = clamp(S.pos - dx / L.gap, 0, S.list.length - 1); S.posT = S.pos; }
    else { S.ang += dx * .32; S.vel = clamp(dx * .32 / dt, -300, 300); S.angT = null; }
    kick();
  });
  function endDrag(e) {
    if (!dr || e.pointerId !== dr.id) return;
    var moved = dr.moved; dr = null;
    if (!moved) return;
    S.drag = false;
    stage.classList.remove('drag');
    S.noClick = true; setTimeout(function () { S.noClick = false; }, 60);
    if (S.mode === 'flow') S.posT = clamp(Math.round(S.pos), 0, Math.max(0, S.list.length - 1));
    kick();
  }
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
  /* a click on empty stage while a card is open turns it back */
  stage.addEventListener('click', function (e) {
    if (S.noClick) { e.stopPropagation(); e.preventDefault(); return; }
    if (S.focus && !e.target.closest('.pc,.tip,.chip,.st-hud')) unfocus();
  }, true);

  /* ───────── page lifecycle ───────── */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      S.vis = es[0].isIntersecting;
      stage.classList.toggle('off', !S.vis);
      if (S.vis) kick();
    }).observe(stage);
  }
  doc.addEventListener('visibilitychange', function () { if (!doc.hidden) kick(); });
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(layout, 120); }, { passive: true });
  doc.addEventListener('mcu:perfchange', function () { layout(); hudRefresh(); });
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(layout);

  /* ───────── start ───────── */
  buildHand();
  buildTips();
  buildLegend();
  hint.textContent = total + ' cards · ' + GROUPS.length + ' stacks · pick a finger';
  layout();
  if (reduce.matches || lite()) stage.classList.add('instant');
  requestAnimationFrame(function () { requestAnimationFrame(function () { stage.classList.add('on'); }); });
  route();

  /* ───────── team photo (hidden until the file loads) ───────── */
  (function () {
    var sec = $('#tm-crew'), frame = $('#tpFrame'), im = $('#tpImg');
    if (!sec || !frame || !im) return;
    $('#tpCount').textContent = SERIES + ' · ' + total + ' members';
    var shown = false;
    function ready() {
      if (shown) return; shown = true;
      sec.hidden = false;
      if (!('IntersectionObserver' in window) || reduce.matches) { frame.classList.add('in'); return; }
      var o = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { frame.classList.add('in'); o.disconnect(); }
      }, { threshold: 0.2 });
      o.observe(frame);
    }
    im.addEventListener('load', ready);
    im.addEventListener('error', function () { sec.hidden = true; });
    im.src = IMG + 'team.mcu.jpg';
    if (im.complete && im.naturalWidth) ready();
  })();
})();
