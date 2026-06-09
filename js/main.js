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
  const yearEls = document.querySelectorAll('#current-year, #footer-year');
  yearEls.forEach(el => { if (el) el.textContent = y; });
})();

/* ─── NAVIGATION ─── */
(function initNav() {
  const nav       = document.getElementById('nav');
  const hamburger = document.getElementById('nav-hamburger');
  const mobileMenu = document.getElementById('mobile-menu');

  if (!nav) return;

  // Scroll class
  const onScroll = () => {
    if (window.scrollY > 20) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Hamburger
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', isOpen);
      const spans = hamburger.querySelectorAll('span');
      if (isOpen) {
        spans[0].style.transform = 'rotate(45deg) translate(4px, 4px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(4px, -4px)';
      } else {
        spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
      }
    });

    // Close menu on link click
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        hamburger.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
      });
    });
  }
})();

/* ─── CANVAS BACKGROUND — Engineering Grid + Particles ─── */
(function initCanvas() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, particles = [], nodes = [], animFrame;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  // Particle system
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
      this.x += this.vx;
      this.y += this.vy;
      this.life -= this.decay;
      if (this.life <= 0 || this.x < 0 || this.x > W || this.y < 0 || this.y > H) {
        this.reset();
        this.life = 1;
      }
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(227, 27, 35, ${this.a * this.life})`;
      ctx.fill();
    }
  }

  // Node system — fixed circuit-board-like nodes
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

    // Connect nearby nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          nodes[i].connections.push({ node: nodes[j], dist });
        }
      }
    }
  }

  let t = 0;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    t += 0.008;

    // Draw circuit connections
    for (const node of nodes) {
      for (const conn of node.connections) {
        const opacity = Math.max(0, 0.06 - (conn.dist / 200) * 0.06);
        const pulse = Math.sin(t + node.pulsePhase) * 0.5 + 0.5;

        ctx.beginPath();
        ctx.moveTo(node.x, node.y);

        // Orthogonal / L-shaped routing for circuit feel
        const mx = (node.x + conn.node.x) / 2;
        ctx.lineTo(mx, node.y);
        ctx.lineTo(mx, conn.node.y);
        ctx.lineTo(conn.node.x, conn.node.y);

        ctx.strokeStyle = `rgba(227, 27, 35, ${opacity + pulse * 0.03})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }

    // Draw nodes
    for (const node of nodes) {
      const pulse = Math.sin(t * 1.5 + node.pulsePhase) * 0.5 + 0.5;
      ctx.beginPath();
      ctx.arc(node.x, node.y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(227, 27, 35, ${0.1 + pulse * 0.25})`;
      ctx.fill();
    }

    // Draw particles
    for (const p of particles) {
      p.update();
      p.draw();
    }

    // Draw connecting lines between close particles
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

  window.addEventListener('resize', () => {
    resize();
    buildNodes(30);
  }, { passive: true });

  init();
})();

/* ─── SCROLL REVEAL ─── */
(function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal-up, .reveal-right');

  // Skip hero elements (handled by loader)
  const nonHero = Array.from(elements).filter(el => !el.closest('#hero'));

  if (!nonHero.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const idx = el.dataset.index ? parseInt(el.dataset.index) : 0;
        setTimeout(() => el.classList.add('visible'), idx * 120);
        observer.unobserve(el);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -60px 0px'
  });

  nonHero.forEach(el => observer.observe(el));
})();

/* ─── STAT COUNTER ─── */
(function initCounters() {
  const statItems = document.querySelectorAll('.stat-item[data-target]');
  if (!statItems.length) return;

  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  function animateCount(el) {
    const target  = parseInt(el.dataset.target);
    const span    = el.querySelector('.count');
    if (!span) return;

    el.classList.add('counted');
    const duration = 1800;
    const start = performance.now();

    function tick(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const value    = Math.round(easeOut(progress) * target);
      span.textContent = value;
      if (progress < 1) requestAnimationFrame(tick);
      else span.textContent = target;
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
      const speed = speeds[i] || 0.03;
      el.style.transform = `translateY(${scrollY * speed}px)`;
    });
  }, { passive: true });
})();

/* ─── NAV ACTIVE STATE ─── */
(function initNavActive() {
  const links = document.querySelectorAll('.nav-link');
  const page  = window.location.pathname.split('/').pop() || 'index.html';

  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
})();

/* ─── SCAN LINE on hero ─── */
(function heroScanGlow() {
  const hero = document.getElementById('hero');
  if (!hero) return;

  // Random glitch flicker on hero headline
  const headline = hero.querySelector('.hero-headline');
  if (!headline) return;

  setInterval(() => {
    if (Math.random() > 0.97) {
      headline.style.opacity = '0.85';
      headline.style.transform = 'translateX(2px)';
      setTimeout(() => {
        headline.style.opacity = '';
        headline.style.transform = '';
      }, 60);
    }
  }, 500);
})();

/* ─── MARQUEE: pause on hover ─── */
(function initMarquee() {
  const track = document.querySelector('.marquee-track');
  if (!track) return;

  const strip = document.querySelector('.marquee-strip');
  if (!strip) return;

  strip.addEventListener('mouseenter', () => {
    track.style.animationPlayState = 'paused';
  });
  strip.addEventListener('mouseleave', () => {
    track.style.animationPlayState = 'running';
  });
})();

/* ─── PILLAR CARDS: magnetic effect ─── */
(function initMagneticCards() {
  const cards = document.querySelectorAll('.pillar-card, .event-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const cx   = rect.left + rect.width  / 2;
      const cy   = rect.top  + rect.height / 2;
      const dx   = (e.clientX - cx) / rect.width;
      const dy   = (e.clientY - cy) / rect.height;

      const rotX = dy * -4;
      const rotY = dx *  4;

      card.style.transform    = `perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(4px)`;
      card.style.transition   = 'transform 0.1s ease';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform  = '';
      card.style.transition = 'transform 0.4s ease, background 0.3s';
    });
  });
})();

/* ─── KEYBOARD: Konami-style easter egg ─── */
(function initEasterEgg() {
  const seq  = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let   idx  = 0;

  document.addEventListener('keydown', (e) => {
    if (e.key === seq[idx]) {
      idx++;
      if (idx === seq.length) {
        idx = 0;
        // Red flash
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
    } else {
      idx = 0;
    }
  });
})();
