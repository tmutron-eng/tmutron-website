/* ══════════════════════════════════════════════════
   MCU — MECHATRONICS COURSE UNION
   animations.js — Cinematic micro-interactions
   Drop in js/ and add before </body> on every page.
   ══════════════════════════════════════════════════ */

'use strict';

/* ─── 1. SMOOTH SCROLL REVEALS ─── */
(function initReveal() {
  const style = document.createElement('style');
  style.textContent = `
    .reveal-up {
      opacity: 0;
      transform: translateY(36px);
      transition: opacity 0.75s cubic-bezier(0.16,1,0.3,1), transform 0.75s cubic-bezier(0.16,1,0.3,1);
    }
    .reveal-up.visible { opacity: 1; transform: translateY(0); }
    .reveal-right {
      opacity: 0; transform: translateX(48px);
      transition: opacity 0.85s cubic-bezier(0.16,1,0.3,1), transform 0.85s cubic-bezier(0.16,1,0.3,1);
    }
    .reveal-right.visible { opacity: 1; transform: translateX(0); }
    .section-title { overflow: hidden; }
    .section-title-inner {
      display: block; transform: translateY(105%);
      transition: transform 0.9s cubic-bezier(0.16,1,0.3,1);
    }
    .section-title-inner.visible { transform: translateY(0); }
  `;
  document.head.appendChild(style);

  document.querySelectorAll('.section-title').forEach(el => {
    if (el.dataset.wrapped) return;
    el.dataset.wrapped = '1';
    const text = el.innerHTML;
    el.innerHTML = `<span class="section-title-inner">${text}</span>`;
    const inner = el.querySelector('.section-title-inner');
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { inner.classList.add('visible'); obs.unobserve(el); }
      });
    }, { threshold: 0.2 });
    obs.observe(el);
  });
})();


/* ─── 2. NAV — glass morph on scroll ─── */
(function initNavMorph() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  const style = document.createElement('style');
  style.textContent = `
    #nav {
      transition: background 0.5s cubic-bezier(0.16,1,0.3,1), border-color 0.5s cubic-bezier(0.16,1,0.3,1), backdrop-filter 0.5s cubic-bezier(0.16,1,0.3,1), box-shadow 0.5s cubic-bezier(0.16,1,0.3,1);
    }
    #nav.scrolled { box-shadow: 0 1px 0 rgba(227,27,35,0.15), 0 8px 32px rgba(0,0,0,0.4); }
  `;
  document.head.appendChild(style);
})();


/* ─── 3. MAGNETIC BUTTONS ─── */
(function initMagneticButtons() {
  const style = document.createElement('style');
  style.textContent = `
    .btn-primary, .btn-ghost, .nav-cta {
      transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), background 0.2s, box-shadow 0.2s, border-color 0.2s !important;
    }
  `;
  document.head.appendChild(style);

  document.querySelectorAll('.btn-primary, .btn-ghost, .nav-cta').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r  = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width  / 2)) * 0.22;
      const dy = (e.clientY - (r.top  + r.height / 2)) * 0.22;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });
})();


/* ─── 4. CARD TILT — spring-based ─── */
(function initCardTilt() {
  const style = document.createElement('style');
  style.textContent = `
    .pillar-card, .event-card, .ev-card, .tm-card, .role-card {
      transform-style: preserve-3d; will-change: transform;
    }
  `;
  document.head.appendChild(style);

  document.querySelectorAll('.pillar-card, .event-card, .ev-card, .tm-card, .role-card').forEach(card => {
    let raf, cx = 0, cy = 0, tx = 0, ty = 0;
    const lerp = (a, b, t) => a + (b - a) * t;

    function loop() {
      cx = lerp(cx, tx, 0.12);
      cy = lerp(cy, ty, 0.12);
      card.style.transform = `perspective(700px) rotateX(${cx}deg) rotateY(${cy}deg) translateZ(2px)`;
      if (Math.abs(cx - tx) > 0.01 || Math.abs(cy - ty) > 0.01) raf = requestAnimationFrame(loop);
    }
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      ty =  ((e.clientX - r.left) / r.width  - 0.5) * 6;
      tx = -((e.clientY - r.top)  / r.height - 0.5) * 6;
      cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    });
    card.addEventListener('mouseleave', () => {
      tx = 0; ty = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    });
  });
})();


/* ─── 5. LINK UNDERLINES — sliding ─── */
(function initLinkUnderlines() {
  const style = document.createElement('style');
  style.textContent = `
    .footer-links a { position: relative; display: inline-block; overflow: hidden; }
    .footer-links a::after {
      content: ''; position: absolute; bottom: -1px; left: 0;
      width: 100%; height: 1px; background: var(--red);
      transform: scaleX(0); transform-origin: right;
      transition: transform 0.35s cubic-bezier(0.16,1,0.3,1);
    }
    .footer-links a:hover::after { transform: scaleX(1); transform-origin: left; }
    .nav-link::after { transition: transform 0.4s cubic-bezier(0.16,1,0.3,1) !important; }
  `;
  document.head.appendChild(style);
})();


/* ─── 6. SECTION PARALLAX on blobs ─── */
(function initSectionParallax() {
  const blobs = document.querySelectorAll('.section-blob');
  if (!blobs.length) return;
  let ticking = false;
  function update() {
    const scrollY = window.scrollY;
    blobs.forEach((blob, i) => {
      const parent = blob.parentElement;
      if (!parent) return;
      const rect   = parent.getBoundingClientRect();
      const center = rect.top + rect.height / 2 - window.innerHeight / 2;
      blob.style.transform = `translateY(${center * 0.06 * (i % 2 === 0 ? 1 : -1)}px)`;
    });
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
})();


/* ─── 7. STAT SHINE SWEEP — fixed version ─── */
(function initStatShine() {
  const style = document.createElement('style');
  style.textContent = `
    .stat-item { position: relative; overflow: hidden; }
    .stat-sweep {
      position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent);
      transform: skewX(-20deg); pointer-events: none;
    }
    .stat-item.counted .stat-sweep { animation: stat-sweep 0.9s cubic-bezier(0.16,1,0.3,1) forwards; }
    @keyframes stat-sweep { from { left: -100%; } to { left: 150%; } }
  `;
  document.head.appendChild(style);

  /* Inject the sweep div into each stat item */
  document.querySelectorAll('.stat-item').forEach(el => {
    if (el.querySelector('.stat-sweep')) return;
    const sweep = document.createElement('div');
    sweep.className = 'stat-sweep';
    el.appendChild(sweep);
  });
})();


/* ─── 8. BUTTON SHEEN ─── */
(function initButtonSheen() {
  const style = document.createElement('style');
  style.textContent = `
    .btn-primary, .nav-cta { position: relative; overflow: hidden; }
    .btn-primary::before, .nav-cta::before {
      content: ''; position: absolute; top: 0; left: -80%;
      width: 50%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
      transform: skewX(-20deg); pointer-events: none;
    }
    .btn-primary:hover::before, .nav-cta:hover::before {
      animation: btn-sheen 0.55s cubic-bezier(0.16,1,0.3,1) forwards;
    }
    @keyframes btn-sheen { from { left: -80%; } to { left: 130%; } }
  `;
  document.head.appendChild(style);
})();


/* ─── 9. SMOOTH ANCHOR SCROLLING ─── */
(function initSmoothAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
    });
  });
})();


/* ─── 10. MARQUEE — fade edges ─── */
(function initMarqueeFade() {
  const strip = document.querySelector('.marquee-strip');
  if (!strip) return;
  const style = document.createElement('style');
  style.textContent = `
    .marquee-strip {
      -webkit-mask-image: linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%);
      mask-image: linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%);
    }
  `;
  document.head.appendChild(style);
})();


/* ─── 11. PAGE EXIT TRANSITION ─── */
(function initPageTransition() {
  const style = document.createElement('style');
  style.textContent = `
    .page-exit-overlay {
      position: fixed; inset: 0; background: var(--black, #111);
      z-index: 9998; opacity: 0; pointer-events: none;
      transition: opacity 0.3s cubic-bezier(0.4,0,1,1);
    }
    .page-exit-overlay.active { opacity: 1; pointer-events: all; }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.className = 'page-exit-overlay';
  document.body.appendChild(overlay);

  document.querySelectorAll('a').forEach(a => {
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto') || href.startsWith('http') || a.target === '_blank') return;
    a.addEventListener('click', e => {
      e.preventDefault();
      overlay.classList.add('active');
      setTimeout(() => { window.location.href = href; }, 280);
    });
  });

  window.addEventListener('pageshow', () => { overlay.classList.remove('active'); });
})();


/* ─── 12. FILTER BUTTON TRANSITIONS — events.html ─── */
(function initFilterTransitions() {
  const style = document.createElement('style');
  style.textContent = `
    .filter-btn {
      transition: color 0.25s cubic-bezier(0.16,1,0.3,1), border-color 0.25s cubic-bezier(0.16,1,0.3,1) !important;
      position: relative;
    }
    .filter-btn::after {
      content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 2px;
      background: var(--red);
      transform: scaleX(0); transform-origin: center;
      transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
    }
    .filter-btn.active::after { transform: scaleX(1); }
    .filter-btn.active { border-bottom-color: transparent !important; }
  `;
  document.head.appendChild(style);
})();


/* ─── 13. OPEN ROLES BADGE PULSE — team.html ─── */
(function initRolePulse() {
  const style = document.createElement('style');
  style.textContent = `
    .role-badge {
      animation: role-pulse 2.4s ease-in-out infinite;
    }
    /* role-pulse defined in style-additions.css — using that one */ @keyframes role-pulse-noop {
      0%, 100% { box-shadow: 0 0 0 0 rgba(74,222,128,0); }
      50%       { box-shadow: 0 0 0 4px rgba(74,222,128,0.15); }
    }
  `;
  document.head.appendChild(style);
})();


/* ─── 14. CURSOR — body class for CSS overrides ─── */
(function initCursorBodyClass() {
  if (window.matchMedia('(pointer: fine)').matches) {
    document.body.classList.add('has-custom-cursor');
  }
  const style = document.createElement('style');
  style.textContent = `
    .has-custom-cursor,
    .has-custom-cursor * { cursor: none !important; }
    #cursor-ring, #cursor-dot {
      transition: width 0.2s cubic-bezier(0.16,1,0.3,1), height 0.2s cubic-bezier(0.16,1,0.3,1), opacity 0.2s, border-color 0.2s;
    }
  `;
  document.head.appendChild(style);
})();


/* ─── 15. TEXT SELECTION COLOR ─── */
(function initSelectionStyle() {
  const style = document.createElement('style');
  style.textContent = `
    ::selection { background: rgba(227,27,35,0.35); color: #fff; }
    ::-moz-selection { background: rgba(227,27,35,0.35); color: #fff; }
  `;
  document.head.appendChild(style);
})();
