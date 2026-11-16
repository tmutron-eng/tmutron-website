/* ══════════════════════════════════════════════════
   MCU — MECHATRONICS COURSE UNION
   main.js — All interactions, animations, canvas
   ══════════════════════════════════════════════════ */

'use strict';

/* ─── PERFORMANCE MODE ───
   Auto-detects weak devices and switches heavy effects off ("lite" mode).
   - Starts lite for: reduced-motion, data-saver, <=2GB RAM or <=2 CPU cores
   - Also measures real frame rate shortly after load and drops to lite if it's choppy
   - Visitors can force it either way with the footer toggle (or ?lite=1 / ?lite=0)       */
window.MCU = (function () {
  const root = document.documentElement;
  const KEY = 'mcu_perf';        // 'lite' | 'full'  (explicit choice)
  const AUTO = 'mcu_perf_auto';  // 'lite' (set by the frame-rate probe)
  const mq = q => window.matchMedia && window.matchMedia(q).matches;
  const nav = navigator, conn = nav.connection || {};
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  const qp = new URLSearchParams(location.search).get('lite');
  if (qp === '1') store.set(KEY, 'lite');
  if (qp === '0') store.set(KEY, 'full');

  const pref = store.get(KEY);
  const weak = mq('(prefers-reduced-motion: reduce)') || conn.saveData ||
               (nav.deviceMemory && nav.deviceMemory <= 2) ||
               (nav.hardwareConcurrency && nav.hardwareConcurrency <= 2);
  const api = { lite: pref === 'lite' || (pref !== 'full' && (weak || store.get(AUTO) === 'lite')) };

  function apply() {
    root.classList.toggle('lite', api.lite);
    document.querySelectorAll('.perf-toggle').forEach(b => {
      b.textContent = 'Lite mode: ' + (api.lite ? 'On' : 'Off');
      b.setAttribute('aria-pressed', api.lite ? 'true' : 'false');
    });
    document.dispatchEvent(new CustomEvent('mcu:perfchange', { detail: { lite: api.lite } }));
  }
  api.set = function (on, persist) {
    api.lite = !!on;
    if (persist) store.set(KEY, on ? 'lite' : 'full');
    apply();
  };
  root.classList.toggle('lite', api.lite);

  document.addEventListener('DOMContentLoaded', function () {
    const bottom = document.querySelector('.footer-bottom');
    if (bottom) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'perf-toggle mono';
      b.title = 'Turn heavy animations off for smoother scrolling';
      b.addEventListener('click', () => api.set(!api.lite, true));
      bottom.appendChild(b);
    }
    apply();
  });

  /* Frame-rate probe: only when the visitor hasn't chosen and we're not already lite */
  if (!api.lite && pref !== 'full') {
    window.addEventListener('load', function () {
      setTimeout(function () {
        const dts = []; let last = performance.now();
        (function frame(now) {
          if (document.hidden) { last = now; return requestAnimationFrame(frame); }
          dts.push(now - last); last = now;
          if (dts.length < 60) return requestAnimationFrame(frame);
          dts.sort((a, b) => a - b);
          const median = dts[dts.length >> 1];
          if (median > 30) { store.set(AUTO, 'lite'); api.set(true, false); }  // under ~33 fps
        })(last);
      }, 1800);
    });
  }
  return api;
})();

/* ─── LOADER ─── */
(function initLoader() {
  const loader   = document.getElementById('loader');
  const fill     = document.querySelector('.loader-fill');
  const pct      = document.querySelector('.loader-pct');
  if (!loader) return;

  let progress = 0;
  const t0 = performance.now();
  const interval = setInterval(() => {
    progress += Math.random() * 20 + 10;
    /* Don't hit 100% until the page has really loaded (or 2.5s passed) */
    const ready = document.readyState === 'complete' || performance.now() - t0 > 2500;
    if (!ready) progress = Math.min(progress, 92);
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      setTimeout(() => {
        loader.classList.add('hidden');
        document.body.style.overflow = '';
        triggerHeroReveal();
      }, 200);
    }
    if (fill) fill.style.width = progress + '%';
    if (pct)  pct.textContent  = Math.floor(progress) + '%';
  }, 60);

  document.body.style.overflow = 'hidden';
})();

function triggerHeroReveal() {
  document.querySelectorAll('#hero .reveal-up, #hero .reveal-right').forEach(el => {
    el.classList.add('visible');
  });
}

/* ─── DYNAMIC YEAR ─── */
(function setYear() {
  const y = new Date().getFullYear();
  document.querySelectorAll('#current-year, #footer-year').forEach(el => {
    if (el) el.textContent = y;
  });
})();

/* ─── NAVIGATION ─── */
(function initNav() {
  const nav        = document.getElementById('nav');
  const hamburger  = document.getElementById('nav-hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  if (!nav) return;

  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', isOpen);
      const spans = hamburger.querySelectorAll('span');
      if (isOpen) {
        spans[0].style.transform = 'rotate(45deg) translate(4px, 4px)';
        spans[1].style.opacity   = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(4px, -4px)';
      } else {
        spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
      }
    });
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        hamburger.querySelectorAll('span').forEach(s => {
          s.style.transform = ''; s.style.opacity = '';
        });
      });
    });
  }
})();

/* ─── SCROLL PROGRESS BAR ─── */
(function initScrollProgress() {
  const bar = document.createElement('div');
  bar.id = 'scroll-progress-bar';
  bar.style.cssText = [
    'position:fixed', 'top:0', 'left:0', 'z-index:9999',
    'height:2px', 'width:100%',
    'background:var(--red)',
    'box-shadow:0 0 8px var(--red)',
    'transform-origin:left center', 'transform:scaleX(0)',
    'pointer-events:none', 'will-change:transform'
  ].join(';');
  document.body.appendChild(bar);

  let ticking = false;
  function update() {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (docHeight > 0 ? Math.min(1, window.scrollY / docHeight) : 0) + ')';
    ticking = false;
  }
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
})();

/* ─── CANVAS BACKGROUND — Engineering Grid + Particles ───
   The static circuit grid is drawn once into an offscreen canvas; only the
   particles animate. Capped at 30fps, paused when the tab is hidden or in lite mode. */
(function initCanvas() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ctx = canvas.getContext('2d');
  const PARTICLES = 36, NODES = 26, LINK2 = 100 * 100;
  let W = 0, H = 0, particles = [], grid = null, raf = null, last = 0;

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * W; this.y = Math.random() * H;
      this.vx = (Math.random() - 0.5) * 0.8; this.vy = (Math.random() - 0.5) * 0.8; /* per-frame at 30fps */
      this.r = Math.random() * 1.5 + 0.3; this.a = Math.random() * 0.4 + 0.1;
      this.life = 1; this.decay = Math.random() * 0.002 + 0.0006;
    }
    update() {
      this.x += this.vx; this.y += this.vy; this.life -= this.decay;
      if (this.life <= 0 || this.x < 0 || this.x > W || this.y < 0 || this.y > H) { this.reset(); this.life = 1; }
    }
    draw() {
      ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, 6.2832);
      ctx.fillStyle = 'rgba(227,27,35,' + (this.a * this.life) + ')'; ctx.fill();
    }
  }

  function buildGrid() {
    grid = document.createElement('canvas'); grid.width = W; grid.height = H;
    const g = grid.getContext('2d');
    const nodes = Array.from({ length: NODES }, () => ({ x: Math.random() * W, y: Math.random() * H }));
    g.lineWidth = 0.5;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 200) {
          const mx = (nodes[i].x + nodes[j].x) / 2;
          g.beginPath(); g.moveTo(nodes[i].x, nodes[i].y); g.lineTo(mx, nodes[i].y); g.lineTo(mx, nodes[j].y); g.lineTo(nodes[j].x, nodes[j].y);
          g.strokeStyle = 'rgba(227,27,35,' + (0.03 + (1 - d / 200) * 0.05) + ')'; g.stroke();
        }
      }
    }
    g.fillStyle = 'rgba(227,27,35,0.22)';
    nodes.forEach(n => { g.beginPath(); g.arc(n.x, n.y, 1.5, 0, 6.2832); g.fill(); });
  }

  function resize(force) {
    const w = window.innerWidth, h = window.innerHeight;
    /* Ignore tiny height changes (mobile address bar) so scrolling never rebuilds the canvas */
    if (!force && w === W && Math.abs(h - H) < 150) return;
    W = canvas.width = w; H = canvas.height = h;
    buildGrid();
    particles = Array.from({ length: PARTICLES }, () => new Particle());
  }

  function draw(now) {
    raf = requestAnimationFrame(draw);
    if (now - last < 33) return;           /* ~30fps */
    last = now;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(grid, 0, 0);
    for (const p of particles) { p.update(); p.draw(); }
    ctx.lineWidth = 0.5;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
        const d2 = dx * dx + dy * dy;
        if (d2 < LINK2) {
          ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = 'rgba(227,27,35,' + ((1 - Math.sqrt(d2) / 100) * 0.06) + ')'; ctx.stroke();
        }
      }
    }
  }

  function start() { if (raf === null && !document.hidden && !window.MCU.lite) { resize(true); raf = requestAnimationFrame(draw); } }
  function stop()  { if (raf !== null) { cancelAnimationFrame(raf); raf = null; } ctx.clearRect(0, 0, W, H); }

  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (raf !== null) resize(false); }, 200); }, { passive: true });
  document.addEventListener('visibilitychange', () => { document.hidden ? stop() : start(); });
  document.addEventListener('mcu:perfchange', e => { e.detail.lite ? stop() : start(); });
  start();
})();

/* ─── SCROLL REVEAL ─── */
(function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal-up, .reveal-right');
  const nonHero  = Array.from(elements).filter(el => !el.closest('#hero'));
  if (!nonHero.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el  = entry.target;
        const idx = el.dataset.index ? parseInt(el.dataset.index) : 0;
        setTimeout(() => el.classList.add('visible'), idx * 120);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

  nonHero.forEach(el => observer.observe(el));
})();

/* ─── STAT COUNTER ─── */
(function initCounters() {
  const statItems = document.querySelectorAll('.stat-item[data-target]');
  if (!statItems.length) return;

  const easeOut = t => 1 - Math.pow(1 - t, 3);

  function animateCount(el) {
    const target   = parseInt(el.dataset.target);
    const span     = el.querySelector('.count');
    if (!span) return;

    const duration = 1800;
    const start    = performance.now();

    function tick(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const value    = Math.round(easeOut(progress) * target);
      span.textContent = value;
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        span.textContent = target;
        /* Flash red on completion, then trigger sweep */
        span.style.color = 'var(--red)';
        setTimeout(() => {
          span.style.color = '';
          span.style.transition = 'color 0.4s';
        }, 180);
        el.classList.add('counted');
      }
    }
    requestAnimationFrame(tick);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  statItems.forEach(el => observer.observe(el));
})();

/* ─── PARALLAX on hero ─── */
(function initParallax() {
  const mfEls = document.querySelectorAll('.mech-float');
  if (!mfEls.length) return;
  const speeds = [0.04, -0.06, 0.03, -0.05];
  let ticking = false;
  function update() {
    ticking = false;
    if (window.MCU.lite) return;
    const y = window.scrollY;
    mfEls.forEach((el, i) => { el.style.transform = 'translateY(' + (y * (speeds[i] || 0.03)) + 'px)'; });
  }
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
})();

/* ─── NAV ACTIVE STATE ─── */
(function initNavActive() {
  const links = document.querySelectorAll('.nav-link');
  /* Use full pathname to handle GitHub Pages subdirectory */
  const path  = window.location.pathname;
  const page  = path.split('/').pop() || 'index.html';

  links.forEach(link => {
    const href = link.getAttribute('href') || '';
    const hPage = href.split('/').pop();
    const isHome = (page === '' || page === 'index.html') && (hPage === 'index.html' || href === '/');
    link.classList.toggle('active', hPage === page || isHome);
  });
})();

/* ─── HERO GLITCH — RGB split + clip-path flicker ─── */
(function initHeroGlitch() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const hero     = document.getElementById('hero');
  if (!hero) return;
  const headline = hero.querySelector('.hero-headline');
  if (!headline) return;

  headline.style.position = 'relative';

  /* Build two pseudo-layer clones for RGB channel split */
  function makeClone(color, offset) {
    const c = headline.cloneNode(true);
    c.setAttribute('aria-hidden', 'true');
    c.style.cssText = [
      'position:absolute', 'top:0', 'left:0',
      'width:100%', 'pointer-events:none',
      'color:' + color,
      'opacity:0',
      'mix-blend-mode:screen',
      'user-select:none'
    ].join(';');
    c._offset = offset;
    headline.parentElement.insertBefore(c, headline.nextSibling);
    return c;
  }

  const redClone  = makeClone('rgba(255,0,60,0.75)',  -3);
  const cyanClone = makeClone('rgba(0,255,220,0.55)', +3);

  /* Scramble chars using a subset of the glitch alphabet */
  const glitchChars = '!<>-_\\/[]{}—=+*^?#@%$01';

  function scrambleEl(el, duration) {
    const original = el.innerHTML;
    const textNodes = [];
    el.childNodes.forEach(n => { if (n.nodeType === 3) textNodes.push(n); });
    if (!textNodes.length) return;

    const targets = textNodes.map(n => ({
      node: n, original: n.textContent,
      chars: n.textContent.split('')
    }));

    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      targets.forEach(({ node, chars }) => {
        node.textContent = chars.map((ch, i) => {
          if (ch === ' ') return ' ';
          /* resolve each char progressively from left */
          if (i / chars.length < p * 1.4) return ch;
          return glitchChars[Math.floor(Math.random() * glitchChars.length)];
        }).join('');
      });
      if (p < 1) requestAnimationFrame(tick);
      else targets.forEach(({ node, original: o }) => { node.textContent = o; });
    }
    requestAnimationFrame(tick);
  }

  function runGlitch() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || window.MCU.lite || document.hidden) return;

    /* Phase 1 — channel split (160ms) */
    redClone.style.opacity   = '1';
    cyanClone.style.opacity  = '1';
    redClone.style.transform  = `translateX(${redClone._offset}px)  skewX(-1deg)`;
    cyanClone.style.transform = `translateX(${cyanClone._offset}px) skewX(1deg)`;

    /* Scramble the original headline */
    scrambleEl(headline, 220);

    /* Clip-path slice flicker */
    const clips = [
      'inset(10% 0 80% 0)',
      'inset(40% 0 40% 0)',
      'inset(70% 0 10% 0)',
      'inset(0% 0 0% 0)'
    ];
    let ci = 0;
    const clipInterval = setInterval(() => {
      headline.style.clipPath = clips[ci % clips.length];
      redClone.style.clipPath  = clips[(ci + 1) % clips.length];
      cyanClone.style.clipPath = clips[(ci + 2) % clips.length];
      ci++;
      if (ci > 5) {
        clearInterval(clipInterval);
        headline.style.clipPath  = '';
        redClone.style.clipPath  = '';
        cyanClone.style.clipPath = '';
      }
    }, 40);

    /* Phase 2 — settle (after 180ms) */
    setTimeout(() => {
      redClone.style.opacity  = '0';
      cyanClone.style.opacity = '0';
      redClone.style.transform  = '';
      cyanClone.style.transform = '';
    }, 180);
  }

  /* Fire once on page load after hero reveal */
  setTimeout(runGlitch, 1400);

  /* Then randomly every 4–10 seconds */
  function scheduleNext() {
    const delay = 4000 + Math.random() * 6000;
    setTimeout(() => { runGlitch(); scheduleNext(); }, delay);
  }
  setTimeout(scheduleNext, 3000);
})();

/* ─── MARQUEE: pause on hover ─── */
(function initMarquee() {
  const track = document.querySelector('.marquee-track');
  const strip = document.querySelector('.marquee-strip');
  if (!track || !strip) return;
  strip.addEventListener('mouseenter', () => { track.style.animationPlayState = 'paused'; });
  strip.addEventListener('mouseleave', () => { track.style.animationPlayState = 'running'; });
})();

/* ─── KEYBOARD: Konami easter egg ─── */
(function initEasterEgg() {
  const seq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let idx = 0;
  document.addEventListener('keydown', e => {
    if (e.key === seq[idx]) {
      idx++;
      if (idx === seq.length) {
        idx = 0;
        const flash = document.createElement('div');
        flash.style.cssText = 'position:fixed;inset:0;background:rgba(227,27,35,0.15);z-index:9997;pointer-events:none;animation:fadeOut 0.8s ease forwards';
        const style = document.createElement('style');
        style.textContent = '@keyframes fadeOut{to{opacity:0}}';
        document.head.appendChild(style);
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 800);
        console.log('%c⚙ MCU SYSTEM UNLOCKED', 'color:#e31b23;font-size:24px;font-family:monospace;font-weight:bold;');
        console.log('%cYou found the secret. You belong here.', 'color:#8a8a8a;font-family:monospace;');
      }
    } else { idx = 0; }
  });
})();
