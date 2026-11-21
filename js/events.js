/* ══════════════════════════════════════════════════
   MCU: EVENTS ARCHIVE
   Reads window.MCU_EVENTS and window.MCU_HIGHLIGHTS (defined in events.html).
   No libraries. Only transform, opacity and stroke-dashoffset change per frame.
   ══════════════════════════════════════════════════ */
(function () {
  'use strict';

  var EV = (window.MCU_EVENTS || []).slice();
  var HL = window.MCU_HIGHLIGHTS || [];
  var doc = document, de = doc.documentElement;

  function $(s, r) { return (r || doc).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function pl(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mqMobile = matchMedia('(max-width: 719px)');
  function lite() { return !!(window.MCU && window.MCU.lite); }

  var landing = $('#landing'), roadView = $('#road-view'), foldersEl = $('#folders');
  var colL = $('#hl-left'), colR = $('#hl-right'), road = $('#road');
  var headYear = $('#rv-year'), headSub = $('#rv-sub'), tabsEl = $('#rv-tabs');
  var progEl = $('#rv-prog'), endEl = $('#rv-end'), live = $('#live'), backBtn = $('#rv-back');
  if (!landing || !roadView || !EV.length) return;

  /* ── group the data ── */
  var years = [];
  EV.forEach(function (e) { if (years.indexOf(e.year) < 0) years.push(e.year); });
  years.sort(function (a, b) { return a - b; });

  var by = {};
  years.forEach(function (y) { by[y] = EV.filter(function (e) { return e.year === y; }); });

  /* file numbers run oldest to newest across the whole archive */
  var fileNo = new Map(), fc = 0;
  years.forEach(function (y) {
    by[y].slice().reverse().forEach(function (e) { fileNo.set(e, ++fc); });
  });

  function counts(list) {
    return {
      w: list.filter(function (e) { return e.type === 'workshop'; }).length,
      s: list.filter(function (e) { return e.type === 'social'; }).length
    };
  }
  function summary(list) {
    var k = counts(list), t = [pl(list.length, 'event')];
    if (k.w) t.push(pl(k.w, 'workshop'));
    if (k.s) t.push(pl(k.s, 'social'));
    return t.join(' \u00B7 ');
  }

  var ICONS = {
    film: '<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 9h20M7 4l-3 5M13 4l-3 5M19 4l-3 5"/></svg>',
    wrench: '<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/></svg>',
    chip: '<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="1"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/></svg>'
  };
  var PIN = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
  var CAR = '<svg viewBox="0 0 56 28" aria-hidden="true" focusable="false">' +
    '<ellipse cx="28" cy="16" rx="26" ry="10" fill="rgba(0,0,0,.4)"/>' +
    '<rect x="6" y="1" width="11" height="5" rx="2" fill="#0c0606"/><rect x="38" y="1" width="11" height="5" rx="2" fill="#0c0606"/>' +
    '<rect x="6" y="22" width="11" height="5" rx="2" fill="#0c0606"/><rect x="38" y="22" width="11" height="5" rx="2" fill="#0c0606"/>' +
    '<rect x="3" y="4" width="51" height="20" rx="8" fill="#e31b23"/>' +
    '<rect x="14" y="7" width="21" height="14" rx="3" fill="#b3141b"/>' +
    '<path d="M36 7.5 L41 9 Q43 14 41 19 L36 20.5 Z" fill="#150808"/>' +
    '<path d="M13 8.5 L9.5 10 V18 L13 19.5 Z" fill="#150808"/>' +
    '<rect x="51" y="7" width="3" height="3.2" rx="1" fill="#fff6c8"/><rect x="51" y="17.8" width="3" height="3.2" rx="1" fill="#fff6c8"/>' +
    '<text x="24.5" y="17.4" font-size="7.5" font-family="Bebas Neue, Impact, sans-serif" fill="#fff" text-anchor="middle">MCU</text></svg>';

  /* ══════════════ LANDING ══════════════ */
  var PX = { 1: [24], 2: [12, 36], 3: [4, 22, 40] };
  var PR = { 1: [-3], 2: [-7, 6], 3: [-8, 2, 9] };

  function folderHTML(y, n) {
    var list = by[y], photos = list.filter(function (e) { return e.img; }).slice(0, 3);
    var k = photos.length;
    var imgs = photos.map(function (e, i) {
      return '<img class="fd-photo" style="--i:' + i + ';--px:' + PX[k][i] + '%;--r:' + PR[k][i] + 'deg" src="' + esc(e.img) +
        '" alt="' + esc(e.title) + ' event photo" decoding="async" draggable="false">';
    }).join('');
    return '<div class="fd-wrap" style="--n:' + n + '"><div class="fd-float" style="--d:' + (-n * 2.4) + 's">' +
      '<button class="folder" type="button" data-year="' + y + '" aria-label="Open the ' + y + ' archive: ' + summary(list) + '">' +
      '<span class="fd-scene">' +
        '<span class="fd-back" data-label="ARCHIVE ' + y + '"></span>' + imgs +
        '<span class="fd-front"><span class="fd-year">' + y + '</span>' +
        '<span class="fd-meta mono">' + esc(summary(list)) + '</span>' +
        '<span class="fd-go mono">OPEN ARCHIVE \u2192</span></span>' +
      '</span></button></div></div>';
  }

  function chipHTML(h, i) {
    var m = [0, 34, 10, 44][i % 4];
    return '<div class="hl" style="--d:' + (-i * 1.7) + 's;--m:' + m + 'px"><b>' + esc(h.num) + '</b><span>' + esc(h.label) + '</span></div>';
  }

  function buildLanding() {
    foldersEl.innerHTML = years.map(function (y, i) { return folderHTML(y, i); }).join('');
    $$('.folder', foldersEl).forEach(bindFolder);

    /* computed numbers come from the data array, curated ones from MCU_HIGHLIGHTS */
    var fy = years[0], ly = years[years.length - 1];
    var tournaments = EV.filter(function (e) { return e.tournament; }).length;
    var left = [{ num: by[fy].length, label: 'events in ' + fy }];
    var right = [];
    if (ly !== fy) right.push({ num: by[ly].length, label: 'events in ' + ly });
    right.push({ num: EV.length, label: 'files in the archive' });
    if (tournaments) right.push({ num: tournaments, label: 'gaming tournaments' });
    HL.forEach(function (h) { (h.side === 'r' ? right : left).push(h); });
    colL.innerHTML = left.map(chipHTML).join('');
    colR.innerHTML = right.map(chipHTML).join('');
  }

  /* pointer tilt: cache the rect once on enter, write CSS variables inside rAF */
  function bindFolder(btn) {
    var scene = $('.fd-scene', btn), rect = null, raf = 0, px = .5, py = .5;
    function apply() {
      raf = 0;
      scene.style.setProperty('--rx', ((.5 - py) * 14).toFixed(2) + 'deg');
      scene.style.setProperty('--ry', ((px - .5) * 20).toFixed(2) + 'deg');
    }
    btn.addEventListener('pointerenter', function (e) {
      if (e.pointerType !== 'mouse' || reduce || lite()) return;
      rect = btn.getBoundingClientRect();
    });
    btn.addEventListener('pointermove', function (e) {
      if (!rect) return;
      px = (e.clientX - rect.left) / rect.width;
      py = (e.clientY - rect.top) / rect.height;
      if (!raf) raf = requestAnimationFrame(apply);
    });
    btn.addEventListener('pointerleave', function () {
      rect = null;
      scene.style.setProperty('--rx', '0deg');
      scene.style.setProperty('--ry', '0deg');
    });
    btn.addEventListener('click', function () { openFolder(btn); });
  }

  var state = { year: null }, busy = false, lastFolder = null, token = 0;
  var BURST = [[-150, -210, -24], [10, -250, 6], [160, -200, 22]];

  function openFolder(btn) {
    if (busy) return;
    busy = true; lastFolder = btn;
    var y = parseInt(btn.getAttribute('data-year'), 10);
    if (reduce) { goYear(y); return; }
    landing.classList.add('is-opening');
    btn.classList.add('open');
    $$('.fd-photo', btn).forEach(function (p, i) {
      var b = BURST[i % 3];
      p.style.setProperty('--bx', b[0] + 'px');
      p.style.setProperty('--by', b[1] + 'px');
      p.style.setProperty('--br', b[2] + 'deg');
    });
    $$('.fd-wrap', foldersEl).forEach(function (w) {
      if (!w.contains(btn)) w.classList.add('dim');
    });
    setTimeout(function () { goYear(y); }, 720);
  }

  function goYear(y) {
    if (parseInt(location.hash.slice(1), 10) !== y) location.hash = String(y);
    route();
  }

  /* ══════════════ ROUTING (hash: #2025, #2026, none = folders) ══════════════ */
  function parseHash() {
    var y = parseInt(location.hash.slice(1), 10);
    return years.indexOf(y) >= 0 ? y : null;
  }
  function route() {
    var y = parseHash();
    if (y === state.year) return;
    if (y !== null) enterRoad(y); else leaveRoad();
  }
  window.addEventListener('hashchange', route);

  function jumpTop() {
    de.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    de.style.scrollBehavior = '';
  }
  function restart(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

  function enterRoad(y) {
    var t = ++token;
    if (state.year !== null && !reduce) {
      roadView.classList.add('is-swap');
      setTimeout(function () {
        if (t === token) doEnter(y);
        roadView.classList.remove('is-swap');
      }, 220);
    } else {
      doEnter(y);
    }
  }

  function doEnter(y) {
    state.year = y;
    landing.hidden = true;
    roadView.hidden = false;
    jumpTop();
    buildRoad(y);
    updateTabs();
    restart(roadView, 'enter');
    live.textContent = 'Showing the ' + y + ' archive, ' + pl(by[y].length, 'event') + ', newest first.';
    headYear.focus({ preventScroll: true });
  }

  function leaveRoad() {
    token++;
    if (state.year === null) return;
    state.year = null;
    teardownRoad();
    roadView.hidden = true;
    landing.hidden = false;
    landing.classList.remove('is-opening');
    $$('.folder', foldersEl).forEach(function (f) { f.classList.remove('open'); });
    $$('.fd-wrap', foldersEl).forEach(function (w) { w.classList.remove('dim'); });
    busy = false;
    jumpTop();
    restart(landing, 'enter');
    live.textContent = 'Archive folders.';
    if (lastFolder) lastFolder.focus({ preventScroll: true });
  }

  function backToFolders() {
    try { history.pushState(null, '', location.pathname + location.search); route(); }
    catch (err) { location.hash = ''; }
  }

  function updateTabs() {
    $$('.rvb-btn', tabsEl).forEach(function (b) {
      b.setAttribute('aria-current', parseInt(b.getAttribute('data-year'), 10) === state.year ? 'true' : 'false');
    });
  }
  tabsEl.innerHTML = years.map(function (y) {
    return '<button type="button" class="rvb-btn" data-year="' + y + '" aria-label="Show the ' + y + ' archive">' + y + '</button>';
  }).join('');
  tabsEl.addEventListener('click', function (e) {
    var b = e.target.closest('.rvb-btn'); if (!b) return;
    var y = parseInt(b.getAttribute('data-year'), 10);
    if (y !== state.year) location.hash = String(y);
  });
  backBtn.addEventListener('click', backToFolders);
  endEl.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-back')) { backToFolders(); return; }
    var y = parseInt(b.getAttribute('data-year'), 10);
    if (y) location.hash = String(y);
  });
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && state.year !== null) backToFolders();
  });

  /* ══════════════ ROAD ══════════════ */
  var R = {};

  function stopHTML(e, i, o) {
    var hasImg = !!e.img;
    var skin = (hasImg && i % 2 === 0) ? 'pol' : 'file';
    var tilt = skin === 'pol' ? (o.side === 'r' ? 2.2 : -2.2) : (o.side === 'r' ? .8 : -.8);
    var month = e.month ? esc(e.month) : '';
    var mkText = month || ('N\u00BA' + pad(fileNo.get(e)));
    var chip = month ? '<b>' + month + '</b><i>' + e.year + '</i>' : '<b>' + e.year + '</b>';
    var media = hasImg
      ? '<img src="' + esc(e.img) + '" alt="' + esc(e.title) + ' event photo" loading="lazy" decoding="async"' + (e.pos ? ' style="object-position:' + esc(e.pos) + '"' : '') + '>'
      : (ICONS[e.icon] || ICONS.chip);
    var tag = e.type === 'workshop' ? '<span class="tg w mono">Workshop</span>' : '<span class="tg s mono">Social</span>';
    var more = (e.desc || '').length > 120 ? '<button type="button" class="more" aria-expanded="false">Read more</button>' : '';
    var stat = e.stat ? '<p class="cstat mono"><b>' + esc(e.stat.num) + '</b>' + esc(e.stat.label) + '</p>' : '';
    var bb = e.stat ? '<aside class="bb" aria-hidden="true"><div class="bb-in"><b>' + esc(e.stat.num) + '</b><span>' + esc(e.stat.label) + '</span></div></aside>' : '';

    return '<div class="stop ' + o.side + '" style="top:' + (o.padT + o.slot * i) + 'px;height:' + o.slot + 'px;--x:' + o.xpct.toFixed(2) + ';--tilt:' + tilt + 'deg">' +
      '<span class="tether"></span>' +
      '<span class="marker" aria-hidden="true"><span class="mk">' + mkText + '</span></span>' + bb +
      '<div class="cw"><article class="card ' + skin + '">' +
        '<div class="ph' + (hasImg ? '' : ' ic') + '">' + media + '<span class="dchip">' + chip + '</span></div>' +
        '<div class="cb"><div class="ct">' + tag + '<span class="fn mono">FILE N\u00BA ' + pad(fileNo.get(e)) + '</span></div>' +
          '<h3 class="ctitle">' + esc(e.title) + '</h3>' +
          '<p class="cloc mono">' + PIN + '<span>' + esc(e.place || '') + '</span></p>' +
          '<p class="cdesc">' + esc(e.desc || '') + '</p>' + more + stat +
        '</div></article></div></div>';
  }

  function buildRoad(y) {
    teardownRoad();
    var list = by[y], n = list.length, M = mqMobile.matches;
    var W = road.clientWidth || window.innerWidth;
    var slot = M ? 460 : 480, padT = M ? 90 : 130, padB = M ? 170 : 190;
    var H = padT + n * slot + padB, rw = M ? 26 : 44;
    var ye = H - 80;
    var xs = M ? (46 / W * 100) : 50, xe = xs;
    function xp(i) { return M ? ((i % 2 ? 50 : 30) / W * 100) : (i % 2 ? 73 : 27); }
    function px(p) { return (p * W / 100).toFixed(1); }

    /* waypoints: start, one per event (alternating sides), finish */
    var P = [{ x: xs, y: 0 }];
    list.forEach(function (e, i) { P.push({ x: xp(i), y: padT + slot * (i + .5) }); });
    P.push({ x: xe, y: ye });
    var d = 'M' + px(P[0].x) + ' 0';
    for (var k = 0; k < P.length - 1; k++) {
      var a = P[k], b = P[k + 1], dy = (b.y - a.y) * .55;
      d += ' C' + px(a.x) + ' ' + (a.y + dy).toFixed(1) + ' ' + px(b.x) + ' ' + (b.y - dy).toFixed(1) + ' ' + px(b.x) + ' ' + b.y.toFixed(1);
    }

    var html = '<svg class="road-svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true" focusable="false">' +
      '<path class="r-ghost" d="' + d + '" stroke-width="' + rw + '"/>' +
      '<path class="r-edge" d="' + d + '" stroke-width="' + (rw + 8) + '"/>' +
      '<path class="r-draw" d="' + d + '" stroke-width="' + rw + '"/>' +
      '<path class="r-dash" d="' + d + '" stroke-width="2.5"/></svg>';
    list.forEach(function (e, i) {
      html += stopHTML(e, i, { side: M ? 'r' : (i % 2 === 0 ? 'r' : 'l'), padT: padT, slot: slot, xpct: xp(i) });
    });
    html += '<div class="finish" style="left:' + xe.toFixed(2) + '%;top:' + ye + 'px;width:' + (rw + 24) + 'px" aria-hidden="true"></div>' +
      '<div class="finish-label mono" style="left:' + xe.toFixed(2) + '%;top:' + (ye + 22) + 'px" aria-hidden="true">OLDEST FILE</div>' +
      '<div class="car" id="car" aria-hidden="true">' + CAR + '</div>';

    road.style.height = H + 'px';
    road.innerHTML = html;

    /* sample the path once (getPointAtLength) into lookup tables; per frame we only binary-search */
    var draw = $('.r-draw', road), edge = $('.r-edge', road);
    var L = draw.getTotalLength(), step = 4, N = Math.ceil(L / step) + 1;
    var sx = new Float32Array(N), sy = new Float32Array(N), sa = new Float32Array(N), i;
    for (i = 0; i < N; i++) {
      var pt = draw.getPointAtLength(Math.min(i * step, L));
      sx[i] = pt.x; sy[i] = pt.y;
    }
    for (i = 0; i < N; i++) {
      var i0 = Math.max(0, i - 2), i1 = Math.min(N - 1, i + 2);
      sa[i] = Math.atan2(sy[i1] - sy[i0], sx[i1] - sx[i0]) * 180 / Math.PI;
    }
    draw.style.strokeDasharray = edge.style.strokeDasharray = L + 'px';
    draw.style.strokeDashoffset = edge.style.strokeDashoffset = L + 'px';

    R = {
      n: n, slot: slot, padT: padT, H: H, ye: ye, L: L, step: step, N: N, sx: sx, sy: sy, sa: sa,
      draw: draw, edge: edge, car: $('#car', road), stops: $$('.stop', road),
      lead: M ? 140 : 200, drawn: -99, cur: -1, carY: 0, top: 0, vh: window.innerHeight, raf: 0, io: null, W: window.innerWidth
    };

    headYear.textContent = y;
    headSub.textContent = summary(list);
    var others = years.filter(function (o) { return o !== y; });
    endEl.innerHTML = '<p class="rv-end-t mono">END OF THE ' + y + ' FILES</p><div class="rv-end-a">' +
      others.map(function (o) { return '<button type="button" class="btn-primary" data-year="' + o + '"><span>Open ' + o + '</span></button>'; }).join('') +
      '<button type="button" class="btn-ghost" data-back="1"><span>Back to folders</span></button></div>';

    /* events pop in and out as they cross the viewport */
    if (reduce || !('IntersectionObserver' in window)) {
      R.stops.forEach(function (s) { s.classList.add('in'); });
    } else {
      R.io = new IntersectionObserver(function (es) {
        es.forEach(function (en) { en.target.classList.toggle('in', en.isIntersecting); });
      }, { rootMargin: '-10% 0px -10% 0px' });
      R.stops.forEach(function (s) { R.io.observe(s); });
    }

    measure();
    R.carY = clamp(window.scrollY + R.vh * .55 - R.top, 0, R.ye);
    place(R.carY);
  }

  function teardownRoad() {
    if (R.io) R.io.disconnect();
    if (R.raf) cancelAnimationFrame(R.raf);
    R = {};
  }

  /* cached measurements: re-read only on build, resize and font load */
  function measure() {
    if (!R.N) return;
    R.top = road.getBoundingClientRect().top + window.scrollY;
    R.vh = window.innerHeight;
  }

  function place(y) {
    var sy = R.sy, sx = R.sx, sa = R.sa, lo = 0, hi = R.N - 1;
    while (hi - lo > 1) { var m = (lo + hi) >> 1; if (sy[m] <= y) lo = m; else hi = m; }
    var dy = sy[hi] - sy[lo], t = dy > 0 ? clamp((y - sy[lo]) / dy, 0, 1) : 0;
    var x = sx[lo] + (sx[hi] - sx[lo]) * t, a = sa[lo] + (sa[hi] - sa[lo]) * t;
    R.car.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) rotate(' + a.toFixed(1) + 'deg)';

    /* the white road is drawn up to the car plus a short lead */
    var drawn = clamp((lo + t) * R.step + R.lead, 0, R.L);
    if (Math.abs(drawn - R.drawn) > .8) {
      R.drawn = drawn;
      var off = (R.L - drawn).toFixed(1) + 'px';
      R.draw.style.strokeDashoffset = off;
      R.edge.style.strokeDashoffset = off;
    }

    var idx = clamp(Math.floor((y - R.padT) / R.slot), 0, R.n - 1);
    if (idx !== R.cur) {
      if (R.cur >= 0 && R.stops[R.cur]) R.stops[R.cur].classList.remove('cur');
      R.stops[idx].classList.add('cur');
      R.cur = idx;
      progEl.textContent = pad(idx + 1) + ' / ' + pad(R.n);
    }
  }

  function frame() {
    if (!R.N) return;
    R.raf = 0;
    var target = clamp(window.scrollY + R.vh * .55 - R.top, 0, R.ye);
    var dd = target - R.carY, settled = true;
    if (reduce || Math.abs(dd) < .35) { R.carY = target; }
    else { R.carY += dd * .16; settled = false; }
    place(R.carY);
    if (!settled) R.raf = requestAnimationFrame(frame);
  }
  function kick() { if (state.year !== null && R.N && !R.raf) R.raf = requestAnimationFrame(frame); }

  window.addEventListener('scroll', kick, { passive: true });

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      if (state.year === null || !R.N) return;
      if (window.innerWidth !== R.W) { buildRoad(state.year); }
      else { measure(); kick(); }
    }, 180);
  }, { passive: true });

  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { measure(); kick(); });
  window.addEventListener('load', function () { measure(); kick(); });

  /* expand or collapse a card description */
  road.addEventListener('click', function (e) {
    var b = e.target.closest('.more'); if (!b) return;
    var card = b.closest('.card'), open = card.classList.toggle('open');
    b.setAttribute('aria-expanded', open ? 'true' : 'false');
    b.textContent = open ? 'Show less' : 'Read more';
  });

  /* ══════════════ START ══════════════ */
  buildLanding();
  route();
})();
