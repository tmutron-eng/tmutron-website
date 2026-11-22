/* ══════════════════════════════════════════════════════════════
   MCU — CONTACT
   Card deck (real links, drag on desktop, list on phones), details
   popup, message form, FAQ and scroll glide. No dependencies.
   ══════════════════════════════════════════════════════════════ */
'use strict';

(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lite = function () { return (window.MCU && window.MCU.lite) || reduce; };

  var ICONS = {
    discord: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.6 12.6 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.003.02.015.04.03.052a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5.5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1.15" fill="currentColor" stroke="none"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05a4.2 4.2 0 0 1 3.77-2.07c4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.4c0-1.29-.02-2.95-1.8-2.95-1.8 0-2.07 1.4-2.07 2.85V21H9z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4.5" width="20" height="15" rx="2.5"/><path d="m3 6.8 9 6.2 9-6.2"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.6"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.6v.2"/></svg>'
  };

  var DISCORD = 'https://discord.gg/zHs7e9KayC';
  var MAPS = 'https://www.google.com/maps/search/?api=1&query=Eric+Palin+Hall+Toronto+Metropolitan+University';

  var CHANNELS = [
    {
      id: 'discord', name: 'Discord', handle: 'discord.gg/zHs7e9KayC',
      label: 'Primary', icon: 'discord', accent: '#5865f2',
      short: 'Announcements, study groups and event sign-ups.',
      desc: 'Announcements, study groups and event sign-ups. Ask in #general and someone who has taken the course will usually answer.',
      tags: ['Announcements', 'Study groups', 'Event sign-ups'],
      url: DISCORD, cta: 'Join the server'
    },
    {
      id: 'instagram', name: 'Instagram', handle: '@tmutron',
      label: 'Photos', icon: 'instagram', accent: '#e1306c',
      short: 'Event photos and recaps.',
      desc: 'Event photos and recaps. DMs are open if you need an answer fast.',
      tags: ['Recaps', 'Photos', 'DMs'],
      url: 'https://instagram.com/tmutron', cta: 'Open Instagram'
    },
    {
      id: 'linkedin', name: 'LinkedIn', handle: 'MCU · TMU',
      label: 'Professional', icon: 'linkedin', accent: '#0a66c2',
      short: 'Industry events and sponsorships.',
      desc: 'Industry events, sponsorships and design team showcases.',
      tags: ['Industry', 'Sponsors', 'Recruiting'],
      url: 'https://www.linkedin.com/company/mechatronics-course-union-mcu-tmu/', cta: 'Open LinkedIn'
    },
    {
      id: 'email', name: 'Email', handle: 'tmutron@torontomu.ca',
      label: 'Official', icon: 'mail', accent: '#e31b23',
      short: 'Sponsorships and official requests.',
      desc: 'Sponsorships, collaborations and anything that needs to go through the union officially.',
      tags: ['Sponsorship', 'Partnerships', 'Official'],
      url: 'mailto:tmutron@torontomu.ca', cta: 'Send an email'
    },
    {
      id: 'office', name: 'EPH 117', handle: 'Eric Palin Hall',
      label: 'Office', icon: 'pin', accent: '#ff7a1a',
      short: 'Our office. Come find us between classes.',
      desc: 'Our office in Eric Palin Hall. Study halls and drop-in sessions run here during the year.',
      tags: ['EPH 117', 'Eric Palin Hall', 'Office'],
      url: MAPS, cta: 'Open in maps'
    }
  ];

  /* ─── CARD MARKUP ─── */
  function faceHTML(c) {
    return '<span class="ac" style="--ac:' + c.accent + '">' +
      '<span class="ac-scan"></span>' +
      '<span class="ac-top"><i></i>' + c.label + '</span>' +
      '<span class="ac-logo">' + ICONS[c.icon] + '</span>' +
      '<span class="ac-body">' +
        '<span class="ac-name">' + c.name + '</span>' +
        '<span class="ac-handle">' + c.handle + '</span>' +
        '<span class="ac-note">' + c.short + '</span>' +
      '</span>' +
      '<span class="ac-cta"><span>' + c.cta + '</span>' + ICONS.arrow + '</span>' +
    '</span>';
  }

  function ghostHTML(c) {
    return '<span class="ac" style="--ac:' + c.accent + '">' +
      '<span class="ac-top"><i></i>' + c.label + '</span>' +
      '<span class="ac-logo">' + ICONS[c.icon] + '</span>' +
      '<span class="ac-body"><span class="ac-name">' + c.name + '</span></span>' +
    '</span>';
  }

  var stage = document.getElementById('arr-stage');
  var ring = document.getElementById('arr-ring');
  var dotsWrap = document.getElementById('arr-dots');
  if (!stage || !ring) return;

  var cards = CHANNELS.map(function (c, i) {
    var wrap = document.createElement('div');
    wrap.className = 'arr-card';
    wrap.setAttribute('role', 'listitem');
    wrap.style.setProperty('--ac', c.accent);
    wrap.innerHTML =
      '<a class="ac-hit" href="' + c.url + '"' +
        (c.url.indexOf('mailto:') === 0 ? '' : ' target="_blank" rel="noopener noreferrer"') +
        ' draggable="false" aria-label="' + c.name + ' — ' + c.cta + '">' + faceHTML(c) + '</a>' +
      '<button class="ac-more" type="button" aria-label="About ' + c.name + '">' + ICONS.info + '</button>' +
      '<span class="ac-ghost" aria-hidden="true">' + ghostHTML(c) + '</span>';

    wrap.querySelector('.ac-more').addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openModal(i);
    });
    ring.appendChild(wrap);
    return wrap;
  });

  var dots = CHANNELS.map(function (c, i) {
    var d = document.createElement('button');
    d.type = 'button';
    d.setAttribute('aria-label', 'Show ' + c.name);
    d.tabIndex = -1;
    d.addEventListener('click', function (e) { e.preventDefault(); goTo(i); });
    dotsWrap && dotsWrap.appendChild(d);
    return d;
  });

  /* ─── DECK ─── */
  var n = cards.length;
  var pos = 0, target = 0, vel = 0, dragging = false, moved = 0;
  var startX = 0, startPos = 0, lastX = 0, lastT = 0, touched = false, hovering = false;
  var spacing = 270, depth = 180;
  var lastPos = -999, inView = true;
  var mq = window.matchMedia('(max-width: 760px)');
  var stacked = mq.matches;

  function measure() {
    var w = stage.clientWidth;
    var cw = cards[0] ? cards[0].offsetWidth : 284;
    /* keep all five cards fully on screen: two gaps either side of centre */
    spacing = Math.max(120, Math.min(300, (w / 2 - cw / 2 - 14) / 2));
    depth = Math.max(90, Math.min(220, w * 0.17));
    lastPos = -999;
  }

  function clearPositions() {
    cards.forEach(function (el) {
      el.style.transform = '';
      el.style.opacity = '';
      el.style.zIndex = '';
      el.classList.remove('is-active');
    });
    dots.forEach(function (d) { d.classList.remove('on'); });
  }

  function wrapOff(v) {
    var x = ((v % n) + n) % n;
    return x > n / 2 ? x - n : x;
  }

  function render() {
    for (var i = 0; i < n; i++) {
      var off = wrapOff(i - pos);
      var a = Math.abs(off);
      var el = cards[i];
      el.style.transform =
        'translate3d(' + (off * spacing).toFixed(1) + 'px,0,' + (-a * depth).toFixed(1) + 'px) ' +
        'rotateY(' + (-off * 18).toFixed(2) + 'deg) scale(' + Math.max(0.68, 1 - a * 0.075).toFixed(3) + ')';
      el.style.opacity = Math.max(0.4, 1 - a * 0.16).toFixed(3);
      el.style.zIndex = String(200 - Math.round(a * 10));
      el.classList.toggle('is-active', a < 0.5);
    }
    var nearest = ((Math.round(pos) % n) + n) % n;
    dots.forEach(function (d, i) { d.classList.toggle('on', i === nearest); });
  }

  function tick() {
    requestAnimationFrame(tick);
    if (stacked || !inView || document.hidden) return;
    if (!dragging) {
      if (Math.abs(vel) > 0.004) { pos += vel; vel *= 0.92; }
      else {
        vel = 0;
        target = Math.round(target);
        pos += (target - pos) * 0.16;
        if (Math.abs(target - pos) < 0.0008) pos = target;
      }
    }
    if (Math.abs(pos - lastPos) > 0.0008) { render(); lastPos = pos; }
  }

  function applyMode() {
    var wasStacked = stacked;
    stacked = mq.matches;
    measure();
    if (stacked) clearPositions();
    else {
      if (wasStacked) { pos = target = 0; vel = 0; }
      render();            /* always repaint: the rAF loop may be paused */
    }
  }

  measure();
  if (stacked) clearPositions(); else render();
  tick();

  if (mq.addEventListener) mq.addEventListener('change', applyMode);
  else if (mq.addListener) mq.addListener(applyMode);
  window.addEventListener('resize', applyMode, { passive: true });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
    }, { rootMargin: '180px' }).observe(stage);
  }

  function goTo(i) {
    if (stacked) return;
    var d = i - pos;
    while (d > n / 2) d -= n;
    while (d < -n / 2) d += n;
    target = pos + d; touched = true; vel = 0;
  }

  function autoStep() {
    if (stacked || touched || hovering || dragging || reduce || lite() || !inView || !modalHidden()) return;
    target = Math.round(pos) + 1;
  }
  if (!reduce) setInterval(autoStep, 7000);

  /* drag the deck; a drag must never fire the link */
  stage.addEventListener('pointerdown', function (e) {
    if (e.target.closest('.ac-more')) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (stacked) return;
    dragging = true; touched = true; vel = 0;
    moved = 0; startX = e.clientX; startPos = pos; lastX = e.clientX; lastT = performance.now();
    stage.classList.add('dragging');
    try { stage.setPointerCapture(e.pointerId); } catch (err) {}
  });

  stage.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var dx = e.clientX - startX;
    moved = Math.max(moved, Math.abs(dx));
    pos = startPos - dx / spacing;
    var now = performance.now(), dt = now - lastT;
    if (dt > 0) vel = -(e.clientX - lastX) / spacing / dt * 16;
    lastX = e.clientX; lastT = now;
  });

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove('dragging');
    if (Math.abs(vel) < 0.02) vel = 0;
    target = Math.abs(vel) > 0.02 ? pos + vel * 2.2 : Math.round(pos);
  }
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
  window.addEventListener('pointerup', endDrag);

  stage.addEventListener('click', function (e) {
    if (moved > 8 && e.target.closest('.ac-hit')) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  stage.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      moved = 0;
      touched = true; vel = 0;
      target = Math.round(pos) + (e.key === 'ArrowRight' ? 1 : -1);
    }
  });

  document.addEventListener('mcu:perfchange', function () { vel = 0; });
  document.addEventListener('visibilitychange', function () { if (document.hidden) vel = 0; });

  var prevBtn = document.getElementById('arr-prev');
  var nextBtn = document.getElementById('arr-next');
  prevBtn && prevBtn.addEventListener('click', function () { touched = true; vel = 0; target = Math.round(pos) - 1; });
  nextBtn && nextBtn.addEventListener('click', function () { touched = true; vel = 0; target = Math.round(pos) + 1; });

  /* ─── DETAILS POPUP ─── */
  var modal = document.getElementById('cx-modal');
  var panel = document.getElementById('cx-panel');
  var closeBtn = document.getElementById('cx-modal-close');
  var bg = document.getElementById('cx-modal-bg');
  var lastFocus = null;

  function modalHidden() { return !modal || modal.hidden; }

  function openModal(i) {
    if (!modal) return;
    var c = CHANNELS[i];
    lastFocus = document.activeElement;
    panel.style.setProperty('--ac', c.accent);

    document.getElementById('cx-mo-badge').textContent = c.label;
    document.getElementById('cx-mo-word').textContent = c.name.toUpperCase();
    document.getElementById('cx-mo-icon').innerHTML = ICONS[c.icon];
    document.getElementById('cx-mo-title').textContent = c.name;
    document.getElementById('cx-mo-handle').textContent = c.handle;
    document.getElementById('cx-mo-desc').textContent = c.desc;

    var tags = document.getElementById('cx-mo-tags');
    tags.innerHTML = '';
    c.tags.forEach(function (t) {
      var s = document.createElement('span');
      s.textContent = t;
      tags.appendChild(s);
    });

    var primary = document.getElementById('cx-mo-primary');
    primary.href = c.url;
    primary.innerHTML = ICONS[c.icon] + '<span>' + c.cta + '</span>';
    if (c.url.indexOf('mailto:') === 0) {
      primary.removeAttribute('target');
      primary.removeAttribute('rel');
    } else {
      primary.setAttribute('target', '_blank');
      primary.setAttribute('rel', 'noopener noreferrer');
    }
    document.getElementById('cx-mo-copy').dataset.copy = c.url;
    document.getElementById('cx-mo-copy-label').textContent = 'Copy link';

    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(function () { closeBtn.focus(); }, 40);
  }

  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  closeBtn && closeBtn.addEventListener('click', closeModal);
  bg && bg.addEventListener('click', closeModal);
  document.addEventListener('keydown', function (e) {
    if (modalHidden()) return;
    if (e.key === 'Escape') { e.preventDefault(); closeModal(); }
    if (e.key === 'Tab') {
      var f = panel.querySelectorAll('a[href], button:not([disabled])');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ─── COPY + TOAST ─── */
  var toast = document.getElementById('cx-toast');
  var toastT = 0;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toast.classList.remove('show'); }, 2000);
  }

  function copy(text) {
    var done = function () { showToast('Copied'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(fallback);
    } else fallback();

    function fallback() {
      try {
        var ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;left:-9999px;top:0';
        document.body.appendChild(ta); ta.select();
        var ok = document.execCommand('copy');
        document.body.removeChild(ta);
        ok ? done() : showToast('Copy failed');
      } catch (e) { showToast('Copy failed'); }
    }
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-copy]');
    if (!el) return;
    e.preventDefault();
    copy(el.getAttribute('data-copy'));
  });

  /* ─── MESSAGE FORM ─── */
  var form = document.getElementById('cx-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nameEl = document.getElementById('cx-name');
      var reasonEl = document.getElementById('cx-reason');
      var msgEl = document.getElementById('cx-msg');
      var note = document.getElementById('cx-form-note');
      var bad = false;

      [nameEl, msgEl].forEach(function (el) {
        var f = el.closest('.cx-field');
        f.classList.remove('invalid');
        if (!el.value.trim()) { f.classList.add('invalid'); bad = true; }
      });
      if (bad) {
        note.textContent = 'Add a name and a message first.';
        note.classList.add('err');
        (nameEl.value.trim() ? msgEl : nameEl).focus();
        return;
      }
      note.classList.remove('err');
      note.textContent = 'Opening your mail app…';

      var reply = document.getElementById('cx-reply').value.trim();
      var body = msgEl.value.trim() + '\n\n— ' + nameEl.value.trim() + (reply ? '\n' + reply : '');
      window.location.href = 'mailto:tmutron@torontomu.ca?subject=' +
        encodeURIComponent(reasonEl.value + ' — ' + nameEl.value.trim()) +
        '&body=' + encodeURIComponent(body);
      showToast('Opening your mail app');
    });

    form.querySelectorAll('input, textarea, select').forEach(function (el) {
      el.addEventListener('input', function () {
        var f = el.closest('.cx-field');
        if (f) f.classList.remove('invalid');
      });
    });
  }

  /* ─── FAQ ─── */
  document.querySelectorAll('.faq-q').forEach(function (q) {
    q.addEventListener('click', function () {
      var item = q.closest('.faq-item');
      var open = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(function (i) { i.classList.remove('open'); });
      if (!open) item.classList.add('open');
      q.setAttribute('aria-expanded', String(!open));
    });
  });

  /* ─── SCROLL GLIDE ───
     One rAF per scroll frame, transform only, skipped in lite mode. */
  (function glide() {
    var els = [].slice.call(document.querySelectorAll('[data-glide]'));
    if (!els.length) return;
    var ticking = false;

    function update() {
      ticking = false;
      if (lite() || document.hidden || reduce) return;
      var vh = window.innerHeight;
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        var r = el.getBoundingClientRect();
        if (r.bottom < -240 || r.top > vh + 240) continue;
        var p = (r.top + r.height / 2 - vh / 2) / vh;
        p = Math.max(-1.2, Math.min(1.2, p));
        var sp = parseFloat(el.getAttribute('data-glide')) || 40;
        el.style.transform = 'translate3d(0,' + (-p * sp).toFixed(1) + 'px,0)';
      }
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    document.addEventListener('mcu:perfchange', onScroll);
    update();
  })();
})();
