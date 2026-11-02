/*
 * AdvaySocialSuite 1.2.0 page chrome: floating pill header, full screen menu, footer block,
 * the typing call to action pill, the command bar and the reading progress hairline.
 */
const Chrome = (() => {
  let settings = {}, profile = {};
  let menuReturn = null, cmdReturn = null;
  let cmdOpen = false, cmdItems = [], cmdShown = [], cmdIndex = 0;
  let phrases = [], pill = null;
  const $ = (id) => document.getElementById(id);
  const root = document.documentElement;

  const displayName = () => UI.stripEmoji(profile.name || settings.site_name || '');
  const wordmark = () => `${UI.text(displayName()).replace(/[.]+$/, '')}<b>.</b>`;
  function ctaLink() { const l = UI.resolveLink(settings.nav_cta_link); return settings.nav_cta_label && l ? l : null; }

  // ─── Typing call to action pill ─────────────────────────────────────────────
  // One markup, used in the hero and footer (desktop) and fixed near the bottom of phones.
  function ctaHtml(extra) {
    const l = ctaLink();
    if (!l) return '';
    return `<div class="cta-pill ${extra || ''}" role="group" aria-label="${UI.text(settings.nav_cta_label)}">
      <span class="typed" aria-hidden="true"><span data-typed></span><span class="caret"></span></span>
      <a class="btn-inner" href="${UI.esc(l.href)}"${l.external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${UI.text(settings.nav_cta_label)}</a>
    </div>`;
  }
  function startTyping() {
    phrases = UI.parseJSON(settings.cta_phrases, []).map(p => UI.stripEmoji(p)).filter(Boolean);
    const set = (txt) => document.querySelectorAll('[data-typed]').forEach(el => { el.textContent = txt; });
    if (!phrases.length) { document.querySelectorAll('.cta-pill .typed').forEach(el => { el.hidden = true; }); return; }
    document.querySelectorAll('.cta-pill .typed').forEach(el => { el.hidden = false; });
    if (UI.reduced()) { set(phrases[0]); document.querySelectorAll('.cta-pill .caret').forEach(c => { c.hidden = true; }); return; }
    let p = 0, c = 0, del = false;
    (function tick() {
      if (document.hidden) { setTimeout(tick, 800); return; }
      const full = phrases[p];
      c += del ? -1 : 1;
      set(full.slice(0, c));
      let wait = del ? 35 : 70;
      if (!del && c === full.length) { wait = 1400; del = true; }
      else if (del && c === 0) { del = false; p = (p + 1) % phrases.length; wait = 350; }
      setTimeout(tick, wait);
    })();
  }
  // Called after a page renders its own pills so they get text straight away.
  function fillTyped() { if (phrases.length) document.querySelectorAll('[data-typed]').forEach(el => { if (!el.textContent) el.textContent = phrases[0]; }); }

  // ─── Pill header ────────────────────────────────────────────────────────────
  function renderHeader() {
    $('brand').innerHTML = wordmark();
    $('brand').setAttribute('aria-label', displayName());
    $('menu-brand').innerHTML = wordmark();
    $('search-btn').innerHTML = UI.icon('search', 18);
    $('search-btn').setAttribute('aria-label', UI.S.search);
    $('menu-btn').innerHTML = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg>';
    $('menu-close').innerHTML = UI.icon('close', 20);
    const pages = App.navPages();
    $('pill-nav').innerHTML = pages.map(p => `<a href="${p.path}" data-page="${p.id}">${UI.text(p.label)}</a>`).join('') + '<span class="pill-hl" aria-hidden="true"></span>';
    $('menu-pages').innerHTML = pages.map(p => `<a href="${p.path}" data-page="${p.id}">${UI.text(p.label)}</a>`).join('');
    $('menu-btn').setAttribute('aria-label', UI.S.openMenu);
    $('menu-close').setAttribute('aria-label', UI.S.closeMenu);
  }
  function moveHighlight() {
    const nav = $('pill-nav'), hl = nav && nav.querySelector('.pill-hl');
    if (!hl) return;
    const a = nav.querySelector('a[aria-current="page"]');
    if (!a || nav.offsetParent === null) { hl.style.opacity = '0'; return; }
    hl.style.opacity = '1';
    hl.style.width = a.offsetWidth + 'px';
    hl.style.transform = `translate3d(${a.offsetLeft}px,0,0)`;
  }
  function setActive(page) {
    document.querySelectorAll('#pill-nav a, #menu-pages a').forEach(a => { if (a.dataset.page === page) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    moveHighlight();
  }

  // ─── Menu ───────────────────────────────────────────────────────────────────
  function renderMenuMore() {
    const links = UI.socialList(profile).map(s => `<a href="${UI.esc(s.href)}" target="_blank" rel="noopener noreferrer">${UI.text(s.label)}</a>`);
    const support = UI.safeUrl(profile.bmc_url);
    if (support && settings.support_label) links.push(`<a href="${UI.esc(support)}" target="_blank" rel="noopener noreferrer">${UI.text(settings.support_label)}</a>`);
    if (settings.contact_email) links.push(`<a href="mailto:${UI.esc(settings.contact_email)}">${UI.text(settings.contact_email)}</a>`);
    $('menu-more').innerHTML = `${links.length ? `<div class="menu__links">${links.join('')}</div>` : ''}
      <div class="menu__tools"><button type="button" class="btn btn--secondary btn--sm" id="menu-search"><span class="btn__label">${UI.text(UI.S.search)}</span><span class="btn__icon">${UI.icon('search')}</span></button><span id="menu-theme"></span></div>`;
    $('menu-search').addEventListener('click', () => { closeMenu(false); openCmd(); });
    Theme.mountMenu($('menu-theme'));
  }
  function openMenu() {
    const m = $('menu');
    if (!m.hidden) return;
    menuReturn = document.activeElement;
    m.hidden = false;
    requestAnimationFrame(() => m.classList.add('is-open'));
    $('menu-btn').setAttribute('aria-expanded', 'true');
    root.classList.add('scroll-lock', 'menu-open');
    setTimeout(() => $('menu-close').focus(), 30);
  }
  function closeMenu(restore) {
    const m = $('menu');
    if (m.hidden) return;
    m.classList.remove('is-open');
    m.hidden = true;
    $('menu-btn').setAttribute('aria-expanded', 'false');
    root.classList.remove('scroll-lock', 'menu-open');
    if (restore !== false) (menuReturn || $('menu-btn')).focus();
  }

  // ─── Footer ─────────────────────────────────────────────────────────────────
  function renderFooter() {
    const pages = App.navPages();
    const socials = UI.socialList(profile).map(s => `<a href="${UI.esc(s.href)}" target="_blank" rel="noopener noreferrer">${UI.text(s.label)}</a>`);
    const support = UI.safeUrl(profile.bmc_url);
    if (support && settings.support_label) socials.push(`<a href="${UI.esc(support)}" target="_blank" rel="noopener noreferrer">${UI.text(settings.support_label)}</a>`);
    if (settings.contact_email) socials.push(`<a href="mailto:${UI.esc(settings.contact_email)}">${UI.text(settings.contact_email)}</a>`);
    const name = UI.text(displayName());
    $('site-footer').innerHTML = `<div class="wrap"><div class="foot-block">
      ${ctaHtml('cta-pill--inverse cta-pill--inline')}
      <div class="big">${name.replace(/[.]+$/, '')}<span>.</span></div>
      ${settings.site_tagline ? `<p class="foot-tag">${UI.text(settings.site_tagline)}</p>` : ''}
      <nav class="foot-links" aria-label="${UI.esc(settings.footer_nav_heading || 'Pages')}">${pages.map(p => `<a href="${p.path}">${UI.text(p.label)}</a>`).join('')}</nav>
      ${socials.length ? `<div class="foot-links foot-links--soft">${socials.join('')}</div>` : ''}
      <small>\u00A9 ${new Date().getFullYear()} ${name}</small>
    </div></div>`;
  }

  // ─── Command bar ────────────────────────────────────────────────────────────
  async function buildItems() {
    const items = [];
    App.navPages().forEach(p => items.push({ group: UI.S.pages, label: p.label, hint: p.path, run: () => App.go(p.path) }));
    let tools = [];
    try { tools = await App.getTools(); } catch (e) { tools = []; }
    tools.forEach(t => { const u = UI.safeUrl(t.url); if (u) items.push({ group: UI.S.tools, label: UI.stripEmoji(t.title), hint: UI.hostOf(u), run: () => window.open(u, '_blank', 'noopener,noreferrer') }); });
    const l = ctaLink();
    if (l) items.push({ group: UI.S.actions, label: UI.S.hireMe, hint: UI.stripEmoji(settings.nav_cta_label), run: () => (l.external ? window.open(l.href, '_blank', 'noopener,noreferrer') : App.go(l.href)) });
    if (settings.contact_email) items.push({ group: UI.S.actions, label: UI.S.copyEmail, hint: settings.contact_email, run: () => UI.copy(settings.contact_email) });
    if (ChatWidget.available()) items.push({ group: UI.S.actions, label: UI.S.openChat, hint: '', run: () => ChatWidget.open() });
    return items;
  }
  function paintCmd() {
    const list = $('cmd-list'), q = $('cmd-input').value.trim().toLowerCase();
    cmdShown = cmdItems.filter(i => !q || `${i.label} ${i.hint}`.toLowerCase().includes(q)).slice(0, 40);
    if (cmdIndex >= cmdShown.length) cmdIndex = Math.max(0, cmdShown.length - 1);
    let last = null, html = '';
    cmdShown.forEach((it, i) => {
      if (it.group !== last) { html += `<li class="cmd__group" role="presentation">${UI.text(it.group)}</li>`; last = it.group; }
      html += `<li role="option" id="cmd-o${i}" class="cmd__item" data-i="${i}" aria-selected="${i === cmdIndex}"><span>${UI.text(it.label)}</span><small>${UI.text(it.hint)}</small></li>`;
    });
    list.innerHTML = html || `<li class="cmd__empty" role="presentation">${UI.text(UI.S.noResults)}</li>`;
    $('cmd-input').setAttribute('aria-activedescendant', cmdShown.length ? 'cmd-o' + cmdIndex : '');
    const a = $('cmd-o' + cmdIndex); if (a) a.scrollIntoView({ block: 'nearest' });
  }
  async function openCmd() {
    if (cmdOpen) return;
    cmdOpen = true; cmdReturn = document.activeElement; cmdIndex = 0;
    $('cmd-root').innerHTML = `<div class="cmd" id="cmd"><div class="cmd__backdrop" data-close></div><div class="cmd__box" role="dialog" aria-modal="true" aria-label="${UI.esc(UI.S.search)}">
      <div class="cmd__field">${UI.icon('search', 18)}<input id="cmd-input" type="text" role="combobox" aria-expanded="true" aria-controls="cmd-list" autocomplete="off" spellcheck="false" placeholder="${UI.esc(UI.S.searchPlaceholder)}" aria-label="${UI.esc(UI.S.search)}"></div>
      <ul class="cmd__list" id="cmd-list" role="listbox" aria-label="${UI.esc(UI.S.search)}"></ul></div></div>`;
    root.classList.add('scroll-lock', 'cmd-open');
    const input = $('cmd-input');
    input.focus();
    cmdItems = await buildItems();
    paintCmd();
    input.addEventListener('input', () => { cmdIndex = 0; paintCmd(); });
    const box = $('cmd').querySelector('.cmd__box');
    $('cmd').addEventListener('click', e => { if (e.target.closest('[data-close]')) closeCmd(); const it = e.target.closest('.cmd__item'); if (it) runCmd(Number(it.dataset.i)); });
    $('cmd').addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeCmd(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); if (cmdShown.length) { cmdIndex = (cmdIndex + 1) % cmdShown.length; paintCmd(); } }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (cmdShown.length) { cmdIndex = (cmdIndex - 1 + cmdShown.length) % cmdShown.length; paintCmd(); } }
      else if (e.key === 'Enter') { e.preventDefault(); runCmd(cmdIndex); }
      else UI.trapKeys(box, e);
    });
  }
  function runCmd(i) { const it = cmdShown[i]; if (!it) return; closeCmd(false); setTimeout(() => it.run(), 20); }
  function closeCmd(restore) {
    if (!cmdOpen) return;
    cmdOpen = false;
    $('cmd-root').innerHTML = '';
    root.classList.remove('scroll-lock', 'cmd-open');
    if (restore !== false && cmdReturn && cmdReturn.focus) cmdReturn.focus();
  }

  // ─── Reading progress hairline ──────────────────────────────────────────────
  let progressOn = false, raf = 0;
  function paintProgress() {
    raf = 0;
    const bar = $('read-progress'); if (!bar) return;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${h > 0 ? Math.min(1, window.scrollY / h) : 0})`;
  }
  function setProgress(on) {
    progressOn = !!on;
    const bar = $('read-progress'); if (bar) { bar.hidden = !on; if (on) paintProgress(); }
  }
  window.addEventListener('scroll', () => { if (progressOn && !raf) raf = requestAnimationFrame(paintProgress); }, { passive: true });

  // ─── Start ──────────────────────────────────────────────────────────────────
  async function init() {
    ({ settings, profile } = await App.shared());
    renderHeader(); renderMenuMore(); renderFooter();
    const l = ctaLink();
    if (l) { $('cta-float').innerHTML = ctaHtml('cta-pill--float'); $('cta-float').hidden = false; root.classList.add('has-cta'); }
    startTyping();

    $('menu-btn').addEventListener('click', () => ($('menu').hidden ? openMenu() : closeMenu()));
    $('menu-close').addEventListener('click', () => closeMenu());
    $('search-btn').addEventListener('click', openCmd);
    $('menu').addEventListener('click', e => { if (e.target.closest('#menu-pages a')) closeMenu(false); });
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'k') { e.preventDefault(); cmdOpen ? closeCmd() : openCmd(); return; }
      if (!$('menu').hidden) { if (e.key === 'Escape') { e.preventDefault(); closeMenu(); } else UI.trapKeys($('menu'), e); }
    });
    document.addEventListener('app:route', e => { closeMenu(false); closeCmd(false); setActive(e.detail.page); });
    window.addEventListener('resize', moveHighlight);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveHighlight);
    window.matchMedia('(min-width: 960px)').addEventListener && window.matchMedia('(min-width: 960px)').addEventListener('change', moveHighlight);
  }

  return { init, ctaHtml, fillTyped, openMenu, closeMenu, openCmd, setProgress, setActive };
})();
