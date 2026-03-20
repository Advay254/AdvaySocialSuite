/* AdvaySocialSuite — SPA Router, Theme System, Core */

const App = (() => {
  let currentPage = null;

  // ─── Themes ─────────────────────────────────────────────────────────────────
  const THEMES = [
    { name:'cosmos',  '--cyan':'#00e5ff', '--violet':'#8b5cf6', '--emerald':'#10b981', '--bg':'#050813', '--bg-2':'#0a0f23' },
    { name:'ember',   '--cyan':'#ff6b35', '--violet':'#ff4081', '--emerald':'#ffd740', '--bg':'#0d0806', '--bg-2':'#1a0f0a' },
    { name:'matrix',  '--cyan':'#00ff41', '--violet':'#00cc33', '--emerald':'#80ff00', '--bg':'#020804', '--bg-2':'#050f07' },
    { name:'dusk',    '--cyan':'#c084fc', '--violet':'#f472b6', '--emerald':'#34d399', '--bg':'#07050d', '--bg-2':'#100a1c' },
  ];

  function applyTheme(theme) {
    const root = document.documentElement;
    Object.entries(theme).forEach(([k, v]) => { if (k !== 'name') root.style.setProperty(k, v); });
    root.dataset.theme = theme.name;
  }

  function initThemes() {
    // Rotate every 4 hours based on time-of-day slot
    const slot = Math.floor(Date.now() / (4 * 60 * 60 * 1000)) % THEMES.length;
    applyTheme(THEMES[slot]);
  }

  // ─── Routes ─────────────────────────────────────────────────────────────────
  const ROUTES = { '':'home', '/':'home', '/about':'about', '/repos':'repos', '/tools':'tools', '/collab':'collab', '/templates':'templates' };
  const PAGES  = { home: HomePage, about: AboutPage, repos: ReposPage, tools: ToolsPage, collab: CollabPage, templates: TemplatesPage };

  function getRoute() {
    const hash = window.location.hash.replace('#','') || '/';
    return ROUTES[hash] || 'home';
  }

  async function navigate(force = false) {
    const name = getRoute();
    if (!force && name === currentPage) return;
    currentPage = name;
    const page = PAGES[name];
    if (!page) return;

    const app = document.getElementById('app');
    app.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'page-enter';
    wrap.innerHTML = page.render();
    app.appendChild(wrap);
    if (page.init) await page.init();

    updateNav(name);
    document.title = { home:'AdvaySocialSuite', about:'About · AdvaySocialSuite', repos:'Repos · AdvaySocialSuite', tools:'Tools · AdvaySocialSuite', collab:'Collaborate · AdvaySocialSuite', templates:'n8n Templates · AdvaySocialSuite' }[name] || 'AdvaySocialSuite';
    trackPageView(name);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateNav(name) {
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(el => {
      el.classList.toggle('active', el.dataset.page === name);
    });
  }

  async function trackPageView(page) {
    try { await fetch('/api/pageview', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ page }) }); } catch {}
  }

  // ─── Particles ──────────────────────────────────────────────────────────────
  function initParticles() {
    const canvas = document.getElementById('particles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [], W, H;

    function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
    function mkp() {
      return { x: Math.random()*W, y: Math.random()*H, vx:(Math.random()-.5)*.2, vy:(Math.random()-.5)*.2,
        r: Math.random()*1.2+.3, alpha: Math.random()*.4+.1,
        color: Math.random()>.7 ? getComputedStyle(document.documentElement).getPropertyValue('--violet').trim()
                                 : getComputedStyle(document.documentElement).getPropertyValue('--cyan').trim() };
    }

    function draw() {
      ctx.clearRect(0,0,W,H);
      const cyan = getComputedStyle(document.documentElement).getPropertyValue('--cyan').trim();
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x<0) p.x=W; if (p.x>W) p.x=0;
        if (p.y<0) p.y=H; if (p.y>H) p.y=0;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle = p.color; ctx.globalAlpha = p.alpha; ctx.fill(); ctx.globalAlpha=1;
      });
      for (let i=0;i<particles.length;i++) {
        for (let j=i+1;j<particles.length;j++) {
          const dx=particles[i].x-particles[j].x, dy=particles[i].y-particles[j].y, d=Math.sqrt(dx*dx+dy*dy);
          if (d<100) { ctx.beginPath(); ctx.moveTo(particles[i].x,particles[i].y); ctx.lineTo(particles[j].x,particles[j].y);
            ctx.strokeStyle=cyan; ctx.globalAlpha=(1-d/100)*.06; ctx.lineWidth=.5; ctx.stroke(); ctx.globalAlpha=1; }
        }
      }
      requestAnimationFrame(draw);
    }

    resize(); particles = Array.from({length:80}, mkp); draw();
    window.addEventListener('resize', () => { resize(); particles = Array.from({length:80}, mkp); });
  }

  // ─── Navbar ─────────────────────────────────────────────────────────────────
  function initNavbar() {
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 20), { passive:true });
    document.getElementById('menu-btn')?.addEventListener('click', () => {
      document.getElementById('mobile-menu').classList.toggle('hidden');
    });
    document.querySelectorAll('.mobile-nav-link').forEach(el => {
      el.addEventListener('click', () => document.getElementById('mobile-menu').classList.add('hidden'));
    });
  }

  // ─── Toast ──────────────────────────────────────────────────────────────────
  function showToast(msg, type='success', duration=3000) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.className = `toast ${type}`; t.classList.remove('hidden');
    clearTimeout(App._toastTimer);
    App._toastTimer = setTimeout(() => t.classList.add('hidden'), duration);
  }

  // ─── API ────────────────────────────────────────────────────────────────────
  async function api(path, opts = {}) {
    const res = await fetch(path, {
      headers: { 'Content-Type':'application/json', ...opts.headers },
      ...opts,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    if (!res.ok) { const e = await res.json().catch(() => ({error:'Request failed'})); throw new Error(e.error); }
    return res.json();
  }

  // ─── Boot ───────────────────────────────────────────────────────────────────
  function init() {
    initThemes();
    initParticles();
    initNavbar();
    ChatWidget.init();
    navigate(true);
    window.addEventListener('hashchange', () => navigate());
  }

  document.addEventListener('DOMContentLoaded', init);
  return { showToast, api, navigate };
})();
