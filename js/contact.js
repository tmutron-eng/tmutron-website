/* ══════════════════════════════════════════════════════════════
   MCU — CONTACT / UPLINK
   Signal array (3D channel ring), channel popup, transmit form.
   No dependencies. Respects prefers-reduced-motion + window.MCU.lite.
   ══════════════════════════════════════════════════════════════ */
'use strict';

(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lite = function () { return (window.MCU && window.MCU.lite) || reduce; };

  /* ─── ICONS ─── */
  var ICONS = {
    discord: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.6 12.6 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.003.02.015.04.03.052a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5.5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.6" cy="6.4" r="1.1" fill="currentColor" stroke="none"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05a4.2 4.2 0 0 1 3.77-2.07c4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.4c0-1.29-.02-2.95-1.8-2.95-1.8 0-2.07 1.4-2.07 2.85V21H9z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2.5 6.5 9.5 7 9.5-7"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.6"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'
  };

  var DISCORD = 'https://discord.gg/zHs7e9KayC';

  /* ─── CHANNEL DATA ─── */
  var CHANNELS = [
    {
      id: 'discord', name: 'Discord', handle: 'discord.gg/zHs7e9KayC',
      badge: 'Primary hub', icon: 'discord', accent: '#5865f2',
      short: 'Announcements, study groups and event sign-ups. The fastest way to reach a human.',
      desc: 'This is where MCU actually lives. Announcements drop first in Discord, study groups form before midterms, and event sign-ups open to members before anyone else. Ask a question in #general and an upper year who has already taken the course will usually answer within the hour.',
      tags: ['Announcements', 'Study groups', 'Event sign-ups', 'Upper-year help', 'Free to join'],
      url: DISCORD, cta: 'Join the server', readout: 'MEMBERS ONLINE',
      note: 'Fastest reply'
    },
    {
      id: 'instagram', name: 'Instagram', handle: '@tmutron',
      badge: 'Public feed', icon: 'instagram', accent: '#e1306c',
      short: 'Event photos, recaps and the occasional workshop teaser.',
      desc: 'Everything we build ends up on the grid: tournament nights, workshop shots, Mech Bull carnage and the recaps we forget to post anywhere else. If you want to see what MCU looks like before you show up, start here. DMs are open if you need a quick answer.',
      tags: ['Event recaps', 'Photos', 'Stories', 'Open DMs'],
      url: 'https://instagram.com/tmutron', cta: 'Follow @tmutron', readout: 'PUBLIC FEED',
      note: 'Photos + recaps'
    },
    {
      id: 'linkedin', name: 'LinkedIn', handle: 'MCU · TMU',
      badge: 'Professional', icon: 'linkedin', accent: '#0a66c2',
      short: 'Industry events, sponsorships and the professional side of MCU.',
      desc: 'Our LinkedIn is for the part of MCU that goes on a résumé: industry nights, sponsor announcements, design team showcases and the students who make them happen. Recruiters and companies reach out here, and we post the roles and collaborations we are opening up.',
      tags: ['Industry events', 'Sponsorships', 'Recruiting', 'Design teams'],
      url: 'https://www.linkedin.com/company/mechatronics-course-union-mcu-tmu/',
      cta: 'Follow the page', readout: 'PROFESSIONAL',
      note: 'For sponsors'
    },
    {
      id: 'email', name: 'Email', handle: 'tmutron@torontomu.ca',
      badge: 'Direct line', icon: 'mail', accent: '#e31b23',
      short: 'Sponsorship, partnerships, or anything that needs a paper trail.',
      desc: 'The official channel. Use it for sponsorships, workshop collaborations, recruitment events, or anything that needs to go through the union properly. It reaches the executive team directly and we answer within a business day during the school year.',
      tags: ['Sponsorship', 'Partnerships', 'Official requests', '< 24h reply'],
      url: 'mailto:tmutron@torontomu.ca', cta: 'Write to us', readout: 'DIRECT LINE',
      note: 'Official requests'
    },
    {
      id: 'campus', name: 'On Campus', handle: 'Kerr Hall · TMU',
      badge: 'In person', icon: 'pin', accent: '#ff7a1a',
      short: 'Kerr Hall, 350 Victoria St. Find us between classes.',
      desc: 'We run study halls and drop-in sessions out of Kerr Hall on the Toronto Metropolitan University campus. If you are already on campus, come find us: the lab doors are open during workshop hours and someone from the team is usually around.',
      tags: ['Kerr Hall', 'Study halls', 'Workshops', '350 Victoria St'],
      url: 'https://www.google.com/maps/search/?api=1&query=Kerr+Hall+Toronto+Metropolitan+University',
      cta: 'Open in maps', readout: 'CAMPUS NODE',
      note: 'Kerr Hall'
    }
  ];

  var HEADS = {
    discord: 'Join the server',
    instagram: 'Open Instagram',
    linkedin: 'Open LinkedIn',
    email: 'Open mail',
    campus: 'Open maps'
  };

  /* ─── ELEMENTS ─── */
  var stage = document.getElementById('arr-stage');
  var ring = document.getElementById('arr-ring');
  var dotsWrap = document.getElementById('arr-dots');
  if (!stage || !ring) return;

  /* ─── BUILD CARDS ─── */
  function faceHTML(c, i) {
    return '<span class="ac" style="--ac:' + c.accent + '">' +
      '<span class="ac-scan"></span>' +
      '<span class="ac-top">' +
        '<span class="ac-num">CH-0' + (i + 1) + '</span>' +
        '<span class="ac-badge"><i></i>' + c.badge + '</span>' +
      '</span>' +
      '<span class="ac-mid">' +
        '<span class="ac-icon">' + ICONS[c.icon] + '</span>' +
        '<span class="ac-name">' + c.name + '</span>' +
        '<span class="ac-handle">' + c.handle + '</span>' +
        '<span class="ac-desc">' + c.short + '</span>' +
      '</span>' +
      '<span class="ac-foot"><span>Open channel</span>' + ICONS.arrow + '</span>' +
    '</span>';
  }

  var cards = CHANNELS.map(function (c, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'arr-card';
    b.setAttribute('aria-label', c.name + ' — open details');
    b.innerHTML = faceHTML(c, i) +
      '<span class="ac-ghost" aria-hidden="true"><span class="ac" style="--ac:' + c.accent + '">' +
        '<span class="ac-top"><span class="ac-num">CH-0' + (i + 1) + '</span></span>' +
        '<span class="ac-mid"><span class="ac-icon">' + ICONS[c.icon] + '</span>' +
        '<span class="ac-name">' + c.name + '</span></span>' +
      '</span></span>';
    b.addEventListener('click', function () {
      if (moved > 8) return;          /* it was a drag, not a tap */
      openModal(i);
    });
    ring.appendChild(b);
    return b;
  });

  var dots = CHANNELS.map(function (c, i) {
    var d = document.createElement('button');
    d.type = 'button';
    d.setAttribute('aria-label', 'Show ' + c.name);
    d.addEventListener('click', function () { goTo(i); });
    dotsWrap && dotsWrap.appendChild(d);
    return d;
  });

  /* ─── CAROUSEL ─── */
  var n = cards.length;
  var pos = 0, target = 0, vel = 0, dragging = false, moved = 0;
  var startX = 0, startPos = 0, lastX = 0, lastT = 0, touched = false, hovering = false;
  var spacing = 260, depth = 190;

  function measure() {
    var w = stage.clientWidth;
    spacing = Math.max(150, Math.min(310, w * 0.29));
    depth = Math.max(90, Math.min(230, w * 0.2));
    lastPos = -999;
  }
  measure();
  window.addEventListener('resize', measure, { passive: true });

  function wrap(v) {
    var x = ((v % n) + n) % n;
    return x > n / 2 ? x - n : x;
  }

  function render() {
    for (var i = 0; i < n; i++) {
      var off = wrap(i - pos);
      var a = Math.abs(off);
      var el = cards[i];
      var rot = -off * 21;
      var sc = Math.max(0.6, 1 - a * 0.1);
      el.style.transform = 'translate3d(' + (off * spacing).toFixed(2) + 'px,0,' + (-a * depth).toFixed(1) + 'px) rotateY(' + rot.toFixed(2) + 'deg) scale(' + sc.toFixed(3) + ')';
      el.style.opacity = a > 2.35 ? '0' : Math.max(0, 1 - Math.max(0, a - 1.45) * 0.62).toFixed(3);
      el.style.zIndex = String(200 - Math.round(a * 10));
      el.style.pointerEvents = a > 2.35 ? 'none' : 'auto';
      el.classList.toggle('is-active', a < 0.5);
    }
    var nearest = ((Math.round(pos) % n) + n) % n;
    dots.forEach(function (d, i) { d.classList.toggle('on', i === nearest); });
  }

  function nearestDelta(i) {
    var d = i - pos;
    while (d > n / 2) d -= n;
    while (d < -n / 2) d += n;
    return d;
  }
  function goTo(i) { target = pos + nearestDelta(i); touched = true; vel = 0; }

  var autoT = 0;
  function autoStep() {
    if (touched || hovering || dragging || reduce || lite() || !inView || !modalHidden()) return;
    target = Math.round(pos) + 1;
  }
  if (!reduce) autoT = setInterval(autoStep, 7000);

  /* Only touch the DOM when the ring actually moves, and never while the
     stage is off screen or the tab is hidden — that keeps scrolling cheap. */
  var lastPos = -999, inView = true;

  function tick() {
    requestAnimationFrame(tick);
    if (!inView || document.hidden) return;
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
  render();          /* paint once immediately, even if frames are throttled */
  tick();

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
    }, { rootMargin: '180px' }).observe(stage);
  }

  /* drag: pointer events, snap with inertia */
  stage.addEventListener('pointerdown', function (e) {
    if (e.target.closest('.arr-btn') || e.target.closest('.arr-dots')) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
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
    var now = performance.now();
    var dt = now - lastT;
    if (dt > 0) vel = -(e.clientX - lastX) / spacing / dt * 16;
    lastX = e.clientX; lastT = now;
  });

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove('dragging');
    try { stage.releasePointerCapture(e.pointerId); } catch (err) {}
    if (Math.abs(vel) < 0.02) vel = 0;
    target = pos + vel * 2.2;
    if (Math.abs(vel) < 0.02) target = Math.round(pos);
    setTimeout(function () { moved = 0; }, 30);
  }
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
  stage.addEventListener('pointerleave', function (e) { if (dragging) endDrag(e); });

  stage.addEventListener('mouseenter', function () { hovering = true; });
  stage.addEventListener('mouseleave', function () { hovering = false; });

  stage.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); touched = true; vel = 0; target = pos - 1; }
    if (e.key === 'ArrowRight') { e.preventDefault(); touched = true; vel = 0; target = pos + 1; }
    if (e.key === 'Enter' || e.key === ' ') {
      if (document.activeElement === stage) { e.preventDefault(); openModal(((Math.round(pos) % n) + n) % n); }
    }
  });

  document.addEventListener('mcu:perfchange', function () { vel = 0; });
  document.addEventListener('visibilitychange', function () { if (document.hidden) vel = 0; });

  /* prev / next */
  var prevBtn = document.getElementById('arr-prev');
  var nextBtn = document.getElementById('arr-next');
  prevBtn && prevBtn.addEventListener('click', function () { touched = true; vel = 0; target = Math.round(pos) - 1; });
  nextBtn && nextBtn.addEventListener('click', function () { touched = true; vel = 0; target = Math.round(pos) + 1; });

  /* ─── MODAL ─── */
  var modal = document.getElementById('cx-modal');
  var panel = document.getElementById('cx-panel');
  var closeBtn = document.getElementById('cx-modal-close');
  var bg = document.getElementById('cx-modal-bg');
  var lastFocus = null;
  var activeIndex = 0;

  function modalHidden() { return !modal || modal.hidden; }

  function openModal(i) {
    if (!modal) return;
    var c = CHANNELS[i];
    activeIndex = i;
    lastFocus = document.activeElement;

    panel.style.setProperty('--ac', c.accent);
    document.getElementById('cx-mo-kicker').textContent = c.badge;
    document.getElementById('cx-mo-badge').textContent = c.note;
    document.getElementById('cx-mo-icon').innerHTML = ICONS[c.icon];
    document.getElementById('cx-mo-title').textContent = c.name;
    var word = document.getElementById('cx-mo-word');
    if (word) word.textContent = c.name.toUpperCase();
    document.getElementById('cx-mo-handle').textContent = c.handle;
    document.getElementById('cx-mo-desc').textContent = c.desc;
    document.getElementById('cx-mo-readout-1').textContent = c.readout;
    document.getElementById('cx-mo-readout-2').textContent = c.tags.length + ' signals';

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
    document.getElementById('cx-mo-copy-label').textContent =
      c.url.indexOf('mailto:') === 0 ? 'Copy email address' : 'Copy channel link';

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
    if (!modalHidden() && e.key === 'Escape') { e.preventDefault(); closeModal(); }
    if (!modalHidden() && e.key === 'Tab') {
      var f = panel.querySelectorAll('a[href], button:not([disabled])');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ─── COPY ─── */
  var toast = document.getElementById('cx-toast');
  var toastT = 0;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toast.classList.remove('show'); }, 2200);
  }

  function copy(text) {
    var done = function () { showToast('Copied to clipboard'); };
    var fail = function () { showToast('Copy failed — select it manually'); };
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
        ok ? done() : fail();
      } catch (e) { fail(); }
    }
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-copy]');
    if (!el) return;
    e.preventDefault();
    copy(el.getAttribute('data-copy'));
  });

  /* ─── TRANSMIT FORM → prefilled mail ─── */
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
        var wrap = el.closest('.cx-field');
        wrap.classList.remove('invalid');
        if (!el.value.trim()) { wrap.classList.add('invalid'); bad = true; }
      });
      if (bad) {
        note.textContent = 'Add a name and a message first.';
        note.classList.add('err');
        (nameEl.value.trim() ? msgEl : nameEl).focus();
        return;
      }
      note.classList.remove('err');
      note.textContent = 'Opening your mail client…';

      var subject = reasonEl.value + ' — ' + nameEl.value.trim();
      var body = msgEl.value.trim() + '\n\n— ' + nameEl.value.trim() +
        (document.getElementById('cx-reply').value.trim() ? '\n' + document.getElementById('cx-reply').value.trim() : '');
      window.location.href = 'mailto:tmutron@torontomu.ca?subject=' +
        encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      showToast('Mail client opening');
    });

    form.querySelectorAll('input, textarea, select').forEach(function (el) {
      el.addEventListener('input', function () {
        var wrap = el.closest('.cx-field');
        if (wrap) wrap.classList.remove('invalid');
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

  /* ─── CLOCK ─── */
  var clock = document.getElementById('cx-clock');
  if (clock) {
    var fmt;
    try {
      fmt = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'America/Toronto', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      });
    } catch (e) { fmt = null; }
    var tickClock = function () {
      if (fmt) clock.textContent = fmt.format(new Date());
      else clock.textContent = new Date().toLocaleTimeString();
    };
    tickClock();
    setInterval(tickClock, 1000);
  }
})();
