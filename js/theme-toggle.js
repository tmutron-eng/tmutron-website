/* ══════════════════════════════════════════════════
   MCU Theme Toggle
   Injects the toggle button into every page's nav
   and persists preference via localStorage.
   ══════════════════════════════════════════════════ */

(function () {
  const STORAGE_KEY = 'mcu-theme';
  const html = document.documentElement;

  // ── 1. Apply saved theme immediately (before paint) ──
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'light') html.setAttribute('data-theme', 'light');

  // ── 2. Build the button ──
  const btn = document.createElement('button');
  btn.className = 'theme-toggle';
  btn.setAttribute('aria-label', 'Toggle light / dark mode');
  btn.innerHTML = `
    <!-- Moon (dark mode indicator) -->
    <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
    <!-- Sun (light mode indicator) -->
    <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1"  x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22"  x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1"  y1="12" x2="3"  y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>`;

  // ── 3. Toggle logic ──
  btn.addEventListener('click', () => {
    const isLight = html.getAttribute('data-theme') === 'light';
    if (isLight) {
      html.removeAttribute('data-theme');
      localStorage.setItem(STORAGE_KEY, 'dark');
    } else {
      html.setAttribute('data-theme', 'light');
      localStorage.setItem(STORAGE_KEY, 'light');
    }
  });

  // ── 4. Inject into nav — before the CTA button ──
  function injectBtn() {
    const navInner = document.querySelector('.nav-inner');
    if (!navInner) return;

    // Insert before the nav-cta (or hamburger if no CTA)
    const cta = navInner.querySelector('.nav-cta');
    const hamburger = navInner.querySelector('.nav-hamburger');
    const ref = cta || hamburger;

    if (ref) {
      navInner.insertBefore(btn, ref);
    } else {
      navInner.appendChild(btn);
    }
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectBtn);
  } else {
    injectBtn();
  }
})();
