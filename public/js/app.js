/* ═══════════════════════════════════════════════════════════════════════════
   AdvaySocialSuite — SPA Router & Core Application
   ═══════════════════════════════════════════════════════════════════════════ */

const App = (() => {

  // ─── State ──────────────────────────────────────────────────────────────────
  let currentPage = null;

  // ─── Route map ──────────────────────────────────────────────────────────────
  const ROUTES = {
    '':       'home',
    '/':      'home',
    '/about': 'about',
    '/repos': 'repos',
    '/tools': 'tools',
    '/collab':'collab',
  };

  const PAGES = { home: HomePage, about: AboutPage, repos: ReposPage, tools: ToolsPage, collab: CollabPage };

  // ─── Router ─────────────────────────────────────────────────────────────────
  function getRoute() {
    const hash = window.location.hash.replace('#', '') || '/';
    return ROUTES[hash] || 'home';
  }

  async function navigate(force = false) {
    const pageName = getRoute();
    if (!force && pageName === currentPage) return;
    currentPage = pageName;

    const page = PAGES[pageName];
    if (!page) return;

    const app = document.getElementById('app');
    app.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'page-enter';
    wrapper.innerHTML = page.render();
    app.appendChild(wrapper);

    if (page.init) await page.init();

    updateNav(pageName);
    updateTitle(pageName);
    trackPageView(pageName);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateNav(pageName) {
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(el => {
      el.classList.toggle('active', el.dataset.page === pageName);
    });
  }

  function updateTitle(pageName) {
    const titles = {
      home: 'AdvaySocialSuite',
      about: 'About Advay · AdvaySocialSuite',
      repos: 'GitHub Repos · AdvaySocialSuite',
      tools: 'Live Tools · AdvaySocialSuite',
      collab: 'Collaborate · AdvaySocialSuite',
    };
    document.title = titles[pageName] || 'AdvaySocialSuite';
  }

  async function trackPageView(page) {
    try {
      await fetch('/api/pageview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page }),
      });
    } catch {}
  }

  // ─── Particle system ────────────────────────────────────────────────────────
  function initParticles() {
    const canvas = document.getElementById('particles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let W, H;

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }

    function createParticle() {
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        r: Math.random() * 1.2 + 0.3,
        alpha: Math.random() * 0.5 + 0.1,
        color: Math.random() > 0.7 ? '#8b5cf6' : '#00e5ff',
      };
    }

    function init() {
      resize();
      particles = Array.from({ length: 100 }, createParticle);
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = '#00e5ff';
            ctx.globalAlpha = (1 - dist / 100) * 0.06;
            ctx.lineWidth = 0.5;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }
      requestAnimationFrame(draw);
    }

    init();
    draw();
    window.addEventListener('resize', init);
  }

  // ─── Navbar scroll effect ────────────────────────────────────────────────────
  function initNavbar() {
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });

    // Mobile menu toggle
    const btn = document.getElementById('menu-btn');
    const menu = document.getElementById('mobile-menu');
    btn?.addEventListener('click', () => {
      menu.classList.toggle('hidden');
    });

    // Close mobile menu on nav click
    document.querySelectorAll('.mobile-nav-link').forEach(el => {
      el.addEventListener('click', () => menu.classList.add('hidden'));
    });
  }

  // ─── Toast ───────────────────────────────────────────────────────────────────
  function showToast(message, type = 'success', duration = 3000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    clearTimeout(App._toastTimer);
    App._toastTimer = setTimeout(() => toast.classList.add('hidden'), duration);
  }

  // ─── API helper ─────────────────────────────────────────────────────────────
  async function api(path, opts = {}) {
    const res = await fetch(path, {
      headers: { 'Content-Type': 'application/json', ...opts.headers },
      ...opts,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || 'Request failed');
    }
    return res.json();
  }

  // ─── Boot ────────────────────────────────────────────────────────────────────
  function init() {
    initParticles();
    initNavbar();
    ChatWidget.init();
    navigate(true);
    window.addEventListener('hashchange', () => navigate());
  }

  document.addEventListener('DOMContentLoaded', init);

  return { showToast, api, navigate };
})();
