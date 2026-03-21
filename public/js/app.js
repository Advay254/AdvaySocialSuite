/* AdvaySocialSuite — SPA Core */
const App = (() => {

  let currentPage = null;

  // ─── Themes — 4 palettes, cycle every N minutes (from settings) ──────────────
  const THEMES = [
    { name:'cosmos',  '--cyan':'#00e5ff', '--violet':'#8b5cf6', '--emerald':'#10b981', '--bg':'#050813', '--bg-2':'#0a0f23' },
    { name:'ember',   '--cyan':'#ff6b35', '--violet':'#ff4081', '--emerald':'#ffd740', '--bg':'#0d0806', '--bg-2':'#1a0f0a' },
    { name:'matrix',  '--cyan':'#00ff41', '--violet':'#00cc33', '--emerald':'#80ff00', '--bg':'#020804', '--bg-2':'#050f07' },
    { name:'dusk',    '--cyan':'#c084fc', '--violet':'#f472b6', '--emerald':'#34d399', '--bg':'#07050d', '--bg-2':'#100a1c' },
  ];

  let _themeTimer = null;

  function applyTheme(idx, animate) {
    const t = THEMES[idx % THEMES.length];
    const r = document.documentElement;
    if (animate) {
      const overlay = document.getElementById('theme-fade');
      if (overlay) {
        // Fade to black, swap vars, fade back in
        overlay.style.transition = 'opacity 0.5s ease';
        overlay.style.opacity = '1';
        setTimeout(() => {
          Object.entries(t).forEach(([k,v]) => { if (k !== 'name') r.style.setProperty(k, v); });
          overlay.style.opacity = '0';
        }, 500);
        return;
      }
    }
    Object.entries(t).forEach(([k,v]) => { if (k !== 'name') r.style.setProperty(k, v); });
  }

  async function initThemes() {
    const DEFAULT_MINS = 6;
    let intervalMs = DEFAULT_MINS * 60 * 1000;

    // Apply initial theme immediately — no API wait needed
    let currentIdx = Math.floor(Date.now() / intervalMs) % THEMES.length;
    applyTheme(currentIdx, false);

    function startCycle(ms) {
      if (_themeTimer) clearInterval(_themeTimer);
      _themeTimer = setInterval(() => {
        currentIdx = (currentIdx + 1) % THEMES.length;
        applyTheme(currentIdx, true);
      }, ms);
    }

    startCycle(intervalMs);

    // Then refine with actual setting from DB
    try {
      const s = await api('/api/settings');
      const mins = Math.max(1, parseInt(s.theme_interval) || DEFAULT_MINS);
      const newMs = mins * 60 * 1000;
      if (newMs !== intervalMs) {
        intervalMs = newMs;
        currentIdx = Math.floor(Date.now() / intervalMs) % THEMES.length;
        applyTheme(currentIdx, false);
        startCycle(intervalMs);
      }
    } catch {}
  }

  // ─── Admin session — check JWT expiry on every load ──────────────────────────
  function checkAdminToken() {
    const token = sessionStorage.getItem('adv_admin_token');
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && Date.now() / 1000 > payload.exp) {
        sessionStorage.removeItem('adv_admin_token');
      }
    } catch {
      sessionStorage.removeItem('adv_admin_token');
    }
  }

  // ─── Routes ──────────────────────────────────────────────────────────────────
  const ROUTES = { '':'home','/':'home','/about':'about','/repos':'repos','/tools':'tools','/collab':'collab','/templates':'templates' };
  const PAGES  = { home:HomePage, about:AboutPage, repos:ReposPage, tools:ToolsPage, collab:CollabPage, templates:TemplatesPage };

  function getRoute() {
    return ROUTES[window.location.hash.replace('#','')||'/'] || 'home';
  }

  async function navigate(force=false) {
    const name = getRoute();
    if (!force && name===currentPage) return;
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
    window.scrollTo({ top:0, behavior:'smooth' });
    trackPage(name);
  }

  function updateNav(name) {
    document.querySelectorAll('.nav-link,.mobile-nav-link').forEach(el => {
      el.classList.toggle('active', el.dataset.page===name);
    });
  }

  async function trackPage(page) {
    try { await fetch('/api/pageview',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({page})}); } catch {}
  }

  // ─── Load nav profile (avatar + site name) ───────────────────────────────────
  async function loadNavProfile() {
    try {
      const [profile, settings] = await Promise.all([
        api('/api/profile'),
        api('/api/settings'),
      ]);

      // Centered nav name (mobile) + brand name beside logo (desktop)
      const centerName = document.getElementById('nav-center-name');
      if (centerName) centerName.textContent = (profile.name || 'ADVAY').toUpperCase();
      const brandName = document.getElementById('nav-brand-name');
      if (brandName) brandName.textContent = (profile.name || 'ADVAY').toUpperCase();

      // Avatar
      const wrap = document.getElementById('nav-avatar');
      const initial = document.getElementById('nav-initial');
      if (profile.avatar_url && profile.avatar_url.trim()) {
        wrap.innerHTML = `<img src="${profile.avatar_url}" alt="${profile.name||''}" class="nav-avatar-img" onerror="this.parentElement.innerHTML='<span class=nav-initial>${(profile.name||'A').charAt(0).toUpperCase()}</span>'">`;
      } else if (initial) {
        initial.textContent = (profile.name||'A').charAt(0).toUpperCase();
      }
    } catch {}
  }

  // ─── Particles ───────────────────────────────────────────────────────────────
  function initParticles() {
    const canvas = document.getElementById('particles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let P=[], W, H;

    const cyan = () => getComputedStyle(document.documentElement).getPropertyValue('--cyan').trim();
    const violet = () => getComputedStyle(document.documentElement).getPropertyValue('--violet').trim();

    function resize() { W=canvas.width=window.innerWidth; H=canvas.height=window.innerHeight; }
    function mkp() { return { x:Math.random()*W, y:Math.random()*H, vx:(Math.random()-.5)*.15, vy:(Math.random()-.5)*.15, r:Math.random()*1.2+.2, a:Math.random()*.35+.05, c:Math.random()>.7?1:0 }; }

    function draw() {
      ctx.clearRect(0,0,W,H);
      const c = cyan(), v = violet();
      P.forEach(p => {
        p.x+=p.vx; p.y+=p.vy;
        if(p.x<0)p.x=W; if(p.x>W)p.x=0; if(p.y<0)p.y=H; if(p.y>H)p.y=0;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=p.c?v:c; ctx.globalAlpha=p.a; ctx.fill(); ctx.globalAlpha=1;
      });
      for(let i=0;i<P.length;i++) for(let j=i+1;j<P.length;j++) {
        const dx=P[i].x-P[j].x, dy=P[i].y-P[j].y, d=Math.sqrt(dx*dx+dy*dy);
        if(d<90) { ctx.beginPath(); ctx.moveTo(P[i].x,P[i].y); ctx.lineTo(P[j].x,P[j].y);
          ctx.strokeStyle=c; ctx.globalAlpha=(1-d/90)*.05; ctx.lineWidth=.5; ctx.stroke(); ctx.globalAlpha=1; }
      }
      requestAnimationFrame(draw);
    }
    resize(); P=Array.from({length:70},mkp); draw();
    window.addEventListener('resize',()=>{ resize(); P=Array.from({length:70},mkp); });
  }

  // ─── Navbar ──────────────────────────────────────────────────────────────────
  function initNavbar() {
    const nav = document.getElementById('navbar');
    window.addEventListener('scroll',()=>nav.classList.toggle('scrolled',window.scrollY>20),{passive:true});
    document.getElementById('menu-btn')?.addEventListener('click',()=>document.getElementById('mobile-menu').classList.toggle('hidden'));
    document.querySelectorAll('.mobile-nav-link').forEach(el=>el.addEventListener('click',()=>document.getElementById('mobile-menu').classList.add('hidden')));
  }

  // ─── Toast ───────────────────────────────────────────────────────────────────
  function showToast(msg,type='success',dur=3000) {
    const t=document.getElementById('toast');
    t.textContent=msg; t.className=`toast ${type}`; t.classList.remove('hidden');
    clearTimeout(App._tt); App._tt=setTimeout(()=>t.classList.add('hidden'),dur);
  }

  // ─── API ─────────────────────────────────────────────────────────────────────
  async function api(path, opts={}) {
    const res = await fetch(path,{
      headers:{'Content-Type':'application/json',...opts.headers},
      ...opts, body:opts.body?JSON.stringify(opts.body):undefined,
    });
    if(!res.ok){ const e=await res.json().catch(()=>({error:'Request failed'})); throw new Error(e.error); }
    return res.json();
  }

  // ─── Boot ────────────────────────────────────────────────────────────────────
  function init() {
    checkAdminToken();
    initThemes();   // async — applies immediately then refines from settings
    initParticles();
    initNavbar();
    loadNavProfile();
    ChatWidget.init();
    navigate(true);
    window.addEventListener('hashchange',()=>navigate());
  }

  document.addEventListener('DOMContentLoaded', init);
  return { showToast, api, navigate };
})();
