/* ══════════════════════════════════════════════════
   MCU — MECHATRONICS COURSE UNION
   main.js — All interactions, animations, canvas
   ══════════════════════════════════════════════════ */

'use strict';

/* ─── LOADER ─── */
(function initLoader() {
  const loader   = document.getElementById('loader');
  const fill     = document.querySelector('.loader-fill');
  const pct      = document.querySelector('.loader-pct');
  if (!loader) return;

  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 18 + 4;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      setTimeout(() => {
        loader.classList.add('hidden');
        document.body.style.overflow = '';
        triggerHeroReveal();
      }, 300);
    }
    fill.style.width = progress + '%';
    pct.textContent  = Math.floor(progress) + '%';
  }, 80);

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
    'height:2px', 'width:0%',
    'background:var(--red)',
    'box-shadow:0 0 8px var(--red)',
    'transition:width 0.1s linear',
    'pointer-events:none'
  ].join(';');
  document.body.appendChild(bar);

  window.addEventListener('scroll', () => {
    const scrollTop  = window.scrollY;
    const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
    const pct        = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width  = pct + '%';
  }, { passive: true });
})();

/* ─── CUSTOM CURSOR ─── */
(function initCursor() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const ring = document.createElement('div');
  const dot  = document.createElement('div');
  ring.id = 'cursor-ring';
  dot.id  = 'cursor-dot';

  const baseStyle = 'position:fixed;pointer-events:none;z-index:99999;border-radius:50%;transform:translate(-50%,-50%);';
  ring.style.cssText = baseStyle + 'width:28px;height:28px;border:1px solid rgba(227,27,35,0.5);transition:width 0.2s,height 0.2s,opacity 0.2s,border-color 0.2s;';
  dot.style.cssText  = baseStyle + 'width:4px;height:4px;background:var(--red);transition:width 0.15s,height 0.15s;';

  document.body.appendChild(ring);
  document.body.appendChild(dot);

  let mx = -100, my = -100;
  let rx = -100, ry = -100;
  let raf;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
  });

  function lerpCursor() {
    rx += (mx - rx) * 0.14;
    ry += (my - ry) * 0.14;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    raf = requestAnimationFrame(lerpCursor);
  }
  lerpCursor();

  /* Scale ring on hoverable elements */
  document.querySelectorAll('a, button, .pillar-card, .event-card, .ev-card, .tm-card, .gc').forEach(el => {
    el.addEventListener('mouseenter', () => {
      ring.style.width        = '44px';
      ring.style.height       = '44px';
      ring.style.borderColor  = 'rgba(227,27,35,0.9)';
      dot.style.width         = '6px';
      dot.style.height        = '6px';
    });
    el.addEventListener('mouseleave', () => {
      ring.style.width        = '28px';
      ring.style.height       = '28px';
      ring.style.borderColor  = 'rgba(227,27,35,0.5)';
      dot.style.width         = '4px';
      dot.style.height        = '4px';
    });
  });

  document.addEventListener('mouseleave', () => { ring.style.opacity = '0'; dot.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { ring.style.opacity = '1'; dot.style.opacity = '1'; });
})();

/* ─── CANVAS BACKGROUND — Engineering Grid + Particles ─── */
(function initCanvas() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const ctx = canvas.getContext('2d');
  let W, H, particles = [], nodes = [], animFrame;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x  = Math.random() * W;
      this.y  = Math.random() * H;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.4;
      this.r  = Math.random() * 1.5 + 0.3;
      this.a  = Math.random() * 0.4 + 0.1;
      this.life = 1;
      this.decay = Math.random() * 0.001 + 0.0003;
    }
    update() {
      this.x += this.vx; this.y += this.vy;
      this.life -= this.decay;
      if (this.life <= 0 || this.x < 0 || this.x > W || this.y < 0 || this.y > H) {
        this.reset(); this.life = 1;
      }
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(227, 27, 35, ${this.a * this.life})`;
      ctx.fill();
    }
  }

  class Node {
    constructor() {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.connections = [];
      this.pulsePhase = Math.random() * Math.PI * 2;
    }
  }

  function buildNodes(count) {
    nodes = [];
    for (let i = 0; i < count; i++) nodes.push(new Node());
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) nodes[i].connections.push({ node: nodes[j], dist });
      }
    }
  }

  let t = 0;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    t += 0.008;

    for (const node of nodes) {
      for (const conn of node.connections) {
        const opacity = Math.max(0, 0.06 - (conn.dist / 200) * 0.06);
        const pulse   = Math.sin(t + node.pulsePhase) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.moveTo(node.x, node.y);
        const mx = (node.x + conn.node.x) / 2;
        ctx.lineTo(mx, node.y);
        ctx.lineTo(mx, conn.node.y);
        ctx.lineTo(conn.node.x, conn.node.y);
        ctx.strokeStyle = `rgba(227, 27, 35, ${opacity + pulse * 0.03})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }

    for (const node of nodes) {
      const pulse = Math.sin(t * 1.5 + node.pulsePhase) * 0.5 + 0.5;
      ctx.beginPath();
      ctx.arc(node.x, node.y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(227, 27, 35, ${0.1 + pulse * 0.25})`;
      ctx.fill();
    }

    for (const p of particles) { p.update(); p.draw(); }

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < 100) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(227, 27, 35, ${(1 - d / 100) * 0.06})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    animFrame = requestAnimationFrame(draw);
  }

  function init() {
    resize();
    particles = Array.from({ length: 60 }, () => new Particle());
    buildNodes(30);
    if (animFrame) cancelAnimationFrame(animFrame);
    draw();
  }

  window.addEventListener('resize', () => { resize(); buildNodes(30); }, { passive: true });
  init();
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
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    mfEls.forEach((el, i) => {
      el.style.transform = `translateY(${scrollY * (speeds[i] || 0.03)}px)`;
    });
  }, { passive: true });
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
    if (prefersReduced) return;

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

/* ─── PILLAR CARDS: magnetic effect ─── */
(function initMagneticCards() {
  document.querySelectorAll('.pillar-card, .event-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const dx   = (e.clientX - (rect.left + rect.width  / 2)) / rect.width;
      const dy   = (e.clientY - (rect.top  + rect.height / 2)) / rect.height;
      card.style.transform  = `perspective(600px) rotateX(${dy * -4}deg) rotateY(${dx * 4}deg) translateZ(4px)`;
      card.style.transition = 'transform 0.1s ease';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform  = '';
      card.style.transition = 'transform 0.4s ease, background 0.3s';
    });
  });
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
