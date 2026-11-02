/* AdvaySocialSuite 1.2.0 core: data, History API router with page transitions, titles, boot. */
const App = (() => {

  // ─── API and shared data ─────────────────────────────────────────────────────
  async function api(path, opts = {}) {
    const res = await fetch(path, { headers: { 'Content-Type': 'application/json', ...opts.headers }, ...opts, body: opts.body ? JSON.stringify(opts.body) : undefined });
    let data = null;
    try { data = await res.json(); } catch { data = null; }
    if (!res.ok) {
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
  const getTools = () => once('tools', '/api/tools');
  const getRepos = () => once('repos', '/api/repos');
  const getTemplates = () => once('templates', '/api/templates');
  async function shared() {
    const [settings, profile] = await Promise.all([getSettings().catch(() => ({})), getProfile().catch(() => ({}))]);
    return { settings, profile };
  }

  // ─── Pages ───────────────────────────────────────────────────────────────────
  const DEFS = [
    { id: 'home', path: '/', label: 'nav_home', page: () => HomePage },
    { id: 'about', path: '/about', label: 'nav_about', page: () => AboutPage, long: true },
    { id: 'repos', path: '/repos', label: 'nav_repos', page: () => ReposPage },
    { id: 'tools', path: '/tools', label: 'nav_tools', page: () => ToolsPage },
    { id: 'templates', path: '/templates', label: 'templates_label', page: () => TemplatesPage },
    { id: 'collab', path: '/collab', label: 'nav_collab', page: () => CollabPage },
    { id: 'faq', path: '/faq', label: 'nav_faq', page: () => FaqPage, long: true },
  ];
  let S = {};
  const faqCount = () => UI.parseJSON(S.faq_items, []).filter(i => i && i.on !== false && i.q && i.a).length;
  function visible(d) { return d.id === 'templates' ? S.templates_visible !== '0' : d.id === 'faq' ? faqCount() > 0 : true; }
  function navPages() { return DEFS.filter(visible).map(d => ({ id: d.id, path: d.path, label: UI.stripEmoji(S[d.label] || '') })).filter(p => p.label); }
  function defFor(pathname) {
    let p = String(pathname || '/').replace(/\/{2,}/g, '/'); if (p.length > 1) p = p.replace(/\/+$/, '');
    return DEFS.find(d => d.path === p) || null;
  }

  const reduced = () => UI.reduced();
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  let current = null, idx = 0, first = true, token = 0;
  const root = document.documentElement;

  // ─── Titles and descriptions, from settings ──────────────────────────────────
  function applyMeta(def, profile) {
    const site = UI.stripEmoji(S.site_name || ''), label = def ? UI.stripEmoji(S[def.label] || '') : '';
    const descs = { home: S.meta_description, about: (profile && profile.bio) || S.meta_description, repos: S.repos_subtitle, tools: S.tools_subtitle, templates: S.templates_subtitle, collab: S.collab_subtitle || S.collab_intro, faq: S.faq_subtitle };
    document.title = !def ? (site ? `Page not found | ${site}` : 'Page not found') : def.id === 'home' || !label ? (site || document.title) : (site ? `${label} | ${site}` : label);
    let d = UI.stripEmoji((def && descs[def.id]) || S.meta_description || '').replace(/\s+/g, ' ');
    if (d.length > 160) d = d.slice(0, 157).replace(/\s+\S*$/, '') + '...';
    const meta = document.querySelector('meta[name="description"]'); if (meta) meta.setAttribute('content', d);
  }
  function track(page) { try { fetch('/api/pageview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ page }) }); } catch { /* analytics are optional */ } }

  // ─── Rendering with a short direction aware transition ───────────────────────
  async function render(dir, restoreY) {
    const t = ++token;
    const def = defFor(location.pathname);
    const gone = def && !visible(def);
    const page = def && !gone ? def.page() : null;
    const name = page ? def.id : 'notfound';
    const app = document.getElementById('app');
    const same = current === name;
    current = name;

    if (!first && !reduced()) {
      app.style.setProperty('--lx', dir >= 0 ? '-10px' : '10px');
      app.classList.add('is-leaving');
      await sleep(110);
      if (t !== token) return;
    }
    app.classList.remove('is-leaving', 'is-entering-fwd', 'is-entering-back');
    root.setAttribute('data-page', name);
    Chrome.setProgress(!!(def && def.long));
    if (page) {
      app.innerHTML = `<div class="page" data-view="${name}">${page.render()}</div>`;
    } else {
      app.innerHTML = `<div class="page" data-view="notfound"><div class="container"><div class="page-head"><p class="eyebrow">( 404 )</p><h1>${UI.stop(UI.S.notFound)}</h1><p class="lead">${UI.text(UI.S.notFoundText)}</p></div>${UI.btn({ label: UI.S.home, href: '/', icon: 'arrow-right' })}</div></div>`;
    }
    if (!first && !reduced()) { app.classList.add(dir >= 0 ? 'is-entering-fwd' : 'is-entering-back'); app.addEventListener('animationend', () => app.classList.remove('is-entering-fwd', 'is-entering-back'), { once: true }); }
    if (!(restoreY > 0)) window.scrollTo(0, 0);
    UI.reveal(app);
    document.dispatchEvent(new CustomEvent('app:route', { detail: { page: name } }));
    applyMeta(page ? def : null, null);
    if (!first || same) app.focus({ preventScroll: true });
    first = false;

    if (page && page.init) { try { await page.init(); } catch (e) { console.error('Page init error:', e); } }
    if (t !== token) return;
    if (page && def.id === 'about') { const { profile } = await shared(); applyMeta(def, profile); }
    UI.reveal(app); UI.countUp(app); Chrome.fillTyped();
    if (restoreY > 0) window.scrollTo(0, restoreY);
    if (page) track(name);
  }

  // ─── Navigation: clean paths with the History API ────────────────────────────
  function saveScroll() { try { history.replaceState({ ...(history.state || {}), i: idx, y: window.scrollY }, ''); } catch { /* not allowed */ } }
  function go(url, opts = {}) {
    const u = new URL(url, location.origin);
    if (u.origin !== location.origin) { location.href = u.href; return; }
    if (u.pathname === location.pathname && u.search === location.search && !opts.force) { if (u.hash) location.hash = u.hash; else window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' }); return; }
    saveScroll();
    if (opts.replace) history.replaceState({ i: idx }, '', u.pathname + u.search + u.hash);
    else { idx += 1; history.pushState({ i: idx }, '', u.pathname + u.search + u.hash); }
    render(1, 0);
  }
  window.addEventListener('popstate', () => {
    // An old style link such as /#/tools is sent to /tools.
    if (/^#\/[a-z]*$/i.test(location.hash)) { redirectHash(); return; }
    const st = history.state || {};
    const n = typeof st.i === 'number' ? st.i : 0;
    const dir = n >= idx ? 1 : -1;
    idx = n;
    render(dir, st.y || 0);
  });
  window.addEventListener('pagehide', saveScroll);
  function redirectHash() {
    const m = location.hash.match(/^#(\/[a-z]*)$/i);
    if (m) { history.replaceState({ i: idx }, '', m[1]); render(1, 0); }
  }

  // Internal links change the page without a reload. Modifier keys and targets keep their normal behaviour.
  document.addEventListener('click', e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const retry = e.target.closest('[data-action="retry"]');
    if (retry) { render(0, 0); return; }
    const a = e.target.closest('a[href]');
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') && !/^#\/[a-z]*$/i.test(href)) return;
    let u; try { u = new URL(a.href, location.href); } catch { return; }
    if (u.origin !== location.origin) return;
    const hashRoute = u.hash.match(/^#(\/[a-z]*)$/i);
    const target = hashRoute && u.pathname === '/' ? hashRoute[1] : u.pathname;
    if (!defFor(target) && /\.[A-Za-z0-9]{1,8}$/.test(target)) return;
    if (/^\/(api|vendor|css|js|fonts|icons|health)\//.test(target)) return;
    e.preventDefault();
    go(target + u.search);
  });

  // ─── Boot ────────────────────────────────────────────────────────────────────
  function checkAdminToken() {
    try {
      const token = sessionStorage.getItem('adv_admin_token'); if (!token) return;
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && Date.now() / 1000 > payload.exp) sessionStorage.removeItem('adv_admin_token');
    } catch { try { sessionStorage.removeItem('adv_admin_token'); } catch { /* storage blocked */ } }
  }
  async function init() {
    checkAdminToken();
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    const themeReady = Theme.init();
    const { settings } = await shared();
    S = settings;
    await Icons.load(S.icon_pack);
    idx = (history.state && typeof history.state.i === 'number') ? history.state.i : 0;
    history.replaceState({ ...(history.state || {}), i: idx }, '');
    if (/^#\/[a-z]*$/i.test(location.hash)) { const m = location.hash.match(/^#(\/[a-z]*)$/i); history.replaceState({ i: idx }, '', m[1]); }
    await themeReady;
    await Chrome.init();
    ChatWidget.init();
    await render(1, 0);
  }
  document.addEventListener('DOMContentLoaded', init);
  return { api, go, getSettings, getProfile, getTools, getRepos, getTemplates, shared, navPages, showToast: (m, t) => UI.toast(m, t === 'error' ? 'error' : undefined) };
})();
