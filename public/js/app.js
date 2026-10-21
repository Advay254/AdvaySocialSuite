/* AdvaySocialSuite 1.0.1 SPA core: routing, data cache, floating navbar, drawer, footer. */
const App = (() => {

  let currentPage = null;
  let firstRender = true;

  // ─── API and shared data ─────────────────────────────────────────────────────
  async function api(path, opts = {}) {
    const res = await fetch(path, {
      headers: { 'Content-Type': 'application/json', ...opts.headers },
      ...opts, body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    let data = null;
    try { data = await res.json(); } catch { data = null; }
    if (!res.ok) {
      // The server always answers with { error, code, fields? }. Its message is written for people.
      const err = new Error((data && data.error) || 'Something went wrong. Please try again.');
      err.status = res.status;
      if (data && data.fields) err.fields = data.fields;
      if (data && data.retryAfter) err.retryAfter = data.retryAfter;
      throw err;
    }
    return data;
  }

  const cache = {};
  function once(key, path) {
    if (!cache[key]) cache[key] = api(path).catch(err => { delete cache[key]; throw err; });
    return cache[key];
  }
  const getSettings = () => once('settings', '/api/settings');
  const getProfile = () => once('profile', '/api/profile');
  async function shared() {
    const [settings, profile] = await Promise.all([getSettings().catch(() => ({})), getProfile().catch(() => ({}))]);
    return { settings, profile };
  }

  // ─── Admin session: drop an expired token on every load ──────────────────────
  function checkAdminToken() {
    try {
      const token = sessionStorage.getItem('adv_admin_token');
      if (!token) return;
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && Date.now() / 1000 > payload.exp) sessionStorage.removeItem('adv_admin_token');
    } catch { try { sessionStorage.removeItem('adv_admin_token'); } catch { /* storage blocked */ } }
  }

  // ─── Routes ──────────────────────────────────────────────────────────────────
  const ROUTES = { '': 'home', '/': 'home', '/about': 'about', '/repos': 'repos', '/tools': 'tools', '/collab': 'collab', '/templates': 'templates' };
  const PAGES = { home: HomePage, about: AboutPage, repos: ReposPage, tools: ToolsPage, collab: CollabPage, templates: TemplatesPage };
  const LABEL_KEY = { home: 'nav_home', about: 'nav_about', repos: 'nav_repos', tools: 'nav_tools', templates: 'templates_label', collab: 'nav_collab' };

  function getRoute() { return ROUTES[window.location.hash.replace('#', '') || '/'] || 'home'; }
  const reducedMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  async function navigate(force = false) {
    const name = getRoute();
    if (!force && name === currentPage) return;
    currentPage = name;
    const page = PAGES[name];
    if (!page) return;

    const app = document.getElementById('app');
    app.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.innerHTML = page.render();
    app.appendChild(wrap);
    UI.reveal(wrap);

    updateNav(name);
    closeDrawer(false);
    window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
    if (!firstRender) app.focus({ preventScroll: true });
    firstRender = false;

    try { if (page.init) await page.init(); } catch (e) { console.error('Page init error:', e); }
    UI.reveal(wrap);
    setTitle(name);
    trackPage(name);
  }

  async function setTitle(name) {
    const { settings } = await shared();
    const site = UI.stripEmoji(settings.site_name || '');
    const label = UI.stripEmoji(settings[LABEL_KEY[name]] || '');
    document.title = name === 'home' || !label ? (site || document.title) : (site ? `${label} | ${site}` : label);
    const meta = document.querySelector('meta[name="description"]');
    if (meta && settings.meta_description) meta.setAttribute('content', UI.stripEmoji(settings.meta_description));
  }

  function updateNav(name) {
    document.querySelectorAll('.nav__link, .drawer__link').forEach(el => {
      if (el.dataset.page === name) el.setAttribute('aria-current', 'page'); else el.removeAttribute('aria-current');
    });
  }

  async function trackPage(page) {
    try { await fetch('/api/pageview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ page }) }); } catch { /* analytics are optional */ }
  }

  // ─── Navbar, drawer, footer ──────────────────────────────────────────────────
  let drawerReturnFocus = null;

  function drawerFocusables() {
    return Array.from(document.querySelectorAll('#drawer a[href], #drawer button, #drawer [tabindex]:not([tabindex="-1"])')).filter(el => !el.classList.contains('hidden') && el.offsetParent !== null);
  }
  function openDrawer() {
    const d = document.getElementById('drawer');
    if (!d || d.classList.contains('is-open')) return;
    drawerReturnFocus = document.activeElement;
    d.classList.add('is-open');
    document.getElementById('drawer-backdrop').classList.add('is-open');
    document.getElementById('menu-btn').setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('scroll-lock');
    setTimeout(() => document.getElementById('drawer-close')?.focus(), 30);
  }
  function closeDrawer(restoreFocus = true) {
    const d = document.getElementById('drawer');
    if (!d || !d.classList.contains('is-open')) return;
    d.classList.remove('is-open');
    document.getElementById('drawer-backdrop').classList.remove('is-open');
    document.getElementById('menu-btn').setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('scroll-lock');
    if (restoreFocus) (drawerReturnFocus || document.getElementById('menu-btn'))?.focus();
  }

  function initNavbar() {
    document.getElementById('menu-btn').innerHTML = UI.icon('menu', 22);
    document.getElementById('drawer-close').innerHTML = UI.icon('x', 22);

    document.getElementById('menu-btn').addEventListener('click', () => {
      document.getElementById('drawer').classList.contains('is-open') ? closeDrawer() : openDrawer();
    });
    document.getElementById('drawer-close').addEventListener('click', () => closeDrawer());
    document.getElementById('drawer-backdrop').addEventListener('click', () => closeDrawer());
    document.getElementById('drawer-links').addEventListener('click', e => { if (e.target.closest('a')) closeDrawer(false); });

    document.addEventListener('keydown', e => {
      const d = document.getElementById('drawer');
      if (!d.classList.contains('is-open')) return;
      if (e.key === 'Escape') { e.preventDefault(); closeDrawer(); return; }
      if (e.key === 'Tab') {
        const f = drawerFocusables();
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    window.matchMedia('(min-width: 900px)').addEventListener?.('change', ev => { if (ev.matches) closeDrawer(false); });

    document.getElementById('skip-link').addEventListener('click', e => {
      e.preventDefault();
      document.getElementById('app').focus();
    });

    document.addEventListener('click', e => {
      if (e.target.closest('[data-action="retry"]')) navigate(true);
    });
  }

  // A call to action link may be a route inside the site (#/collab) or a full https address.
  function resolveLink(value) {
    const v = String(value || '').trim();
    if (/^#\/[a-z]*$/i.test(v)) return { href: v, external: false };
    const u = UI.safeUrl(v);
    return u ? { href: u, external: true } : null;
  }

  async function renderChrome() {
    const { settings, profile } = await shared();

    if (settings.accent_color) UI.applyAccent(settings.accent_color);

    // Brand and labels
    const display = UI.stripEmoji(profile.name || settings.site_name || '');
    document.getElementById('brand').textContent = display;
    document.getElementById('drawer-brand').textContent = display;
    document.querySelectorAll('[data-label]').forEach(el => { el.textContent = UI.stripEmoji(settings[el.dataset.label] || ''); });

    // One pill button on the right of the bar. Label and link come from settings.
    const cta = resolveLink(settings.nav_cta_link);
    const ctaLabel = settings.nav_cta_label;
    const ctaHtml = cta && ctaLabel ? UI.btn({ label: ctaLabel, href: cta.href, external: cta.external, size: 'sm' }) : '';
    document.getElementById('nav-cta').innerHTML = ctaHtml;

    // Drawer footer: the same button plus the support link when the profile has one
    const support = UI.safeUrl(profile.bmc_url);
    const supportLabel = settings.support_label;
    document.getElementById('drawer-foot').innerHTML =
      (cta && ctaLabel ? UI.btn({ label: ctaLabel, href: cta.href, external: cta.external, block: true }) : '') +
      (support && supportLabel ? UI.btn({ label: supportLabel, href: support, external: true, variant: 'secondary', block: true, icon: 'arrow-up-right' }) : '');

    renderFooter(settings, profile, support);
    updateNav(currentPage);
  }

  function renderFooter(settings, profile, support) {
    const foot = document.getElementById('site-footer');
    const site = UI.text(profile.name || settings.site_name || '');
    const links = [['#/', 'nav_home'], ['#/about', 'nav_about'], ['#/repos', 'nav_repos'], ['#/tools', 'nav_tools'], ['#/templates', 'templates_label'], ['#/collab', 'nav_collab']]
      .map(([href, key]) => settings[key] ? `<li><a href="${href}">${UI.text(settings[key])}</a></li>` : '').join('');
    const socials = [['github_url', 'GitHub'], ['linkedin_url', 'LinkedIn'], ['twitter_url', 'X'], ['youtube_url', 'YouTube'], ['discord_url', 'Discord'], ['tiktok_url', 'TikTok']]
      .map(([k, name]) => { const u = UI.safeUrl(profile[k]); return u ? `<li><a href="${UI.esc(u)}" target="_blank" rel="noopener noreferrer">${name}</a></li>` : ''; }).join('');
    const supportCol = support && settings.support_label ? `
      <div>
        <h2 class="label footer__title">${UI.text(settings.footer_support_heading)}</h2>
        <ul class="footer__list"><li><a href="${UI.esc(support)}" target="_blank" rel="noopener noreferrer">${UI.text(settings.support_label)}</a></li></ul>
      </div>` : '<div></div>';

    foot.innerHTML = `
      <div class="container">
        <div class="footer__grid">
          <div>
            <div class="footer__brand">${site}</div>
            ${settings.site_tagline ? `<p class="footer__about">${UI.text(settings.site_tagline)}</p>` : ''}
          </div>
          <div>
            <h2 class="label footer__title">${UI.text(settings.footer_nav_heading)}</h2>
            <ul class="footer__list">${links}</ul>
          </div>
          <div>
            ${socials ? `<h2 class="label footer__title">${UI.text(settings.footer_connect_heading)}</h2><ul class="footer__list">${socials}</ul>` : ''}
          </div>
          ${supportCol}
        </div>
        <div class="footer__base">\u00A9 ${new Date().getFullYear()} ${site}</div>
      </div>`;
  }

  // ─── Boot ────────────────────────────────────────────────────────────────────
  async function init() {
    checkAdminToken();
    // The icon style is a site setting, so it is loaded before the first page is drawn.
    const { settings } = await shared();
    await Icons.load(settings.icon_pack);
    initNavbar();
    renderChrome();
    ChatWidget.init();
    navigate(true);
    window.addEventListener('hashchange', () => navigate());
  }

  document.addEventListener('DOMContentLoaded', init);
  return { api, navigate, getSettings, getProfile, shared, showToast: (m, t) => UI.toast(m, t === 'error' ? 'error' : undefined) };
})();
