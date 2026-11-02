const ToolsPage = (() => {

  const PAGE = 6;
  let all = [], settings = {}, query = '', category = 'all', shown = PAGE;
  const STATUS = { active: ['status_live_label', 'live'], waking: ['status_waking_label', 'waking'], down: ['status_down_label', 'down'] };

  // One glow card. Also used by the home page.
  function card(t, st, extra) {
    const url = UI.safeUrl(t.url);
    const s = STATUS[String(t.status || 'active').toLowerCase()] || STATUS.active;
    const label = st[s[0]];
    const open = st.tool_open_label;
    return `<article class="card glow-card reveal ${extra || ''}">
      <div class="media"><span class="media__icon">${UI.iconFor(t.icon, Icons.categoryDefault(t.category), 44)}</span>${url ? UI.goButton(url, `${open || ''} ${UI.stripEmoji(t.title)}`.trim(), true, !!open) : ''}</div>
      <div class="card-body">
        <p class="k">${UI.text(t.category || '')}${label ? ` <span class="tag tag--${s[1]}">${UI.text(label)}</span>` : ''}</p>
        <h3>${UI.text(t.title)}</h3>
        ${t.description ? `<p class="desc">${UI.text(t.description)}</p>` : ''}
      </div>
      ${url ? `<div class="card-actions">
        <span class="host">${UI.text(UI.hostOf(url))}</span>
        <button type="button" class="icon-btn" data-copy="${UI.esc(url)}" aria-label="${UI.esc(UI.S.copyLink + ': ' + UI.stripEmoji(t.title))}" title="${UI.esc(UI.S.copyLink)}">${UI.icon('copy', 18)}</button>
        ${open ? UI.btn({ label: open, href: url, external: true, size: 'sm', icon: 'arrow-up-right' }) : ''}
      </div>` : ''}
    </article>`;
  }

  function render() {
    return `<div class="container">
      <div id="tools-head">${UI.head('', ' ', '')}</div>
      <div class="toolbar">${UI.searchBox('tool-search', UI.S.search)}<div id="cat-filters"></div></div>
      <div id="tools-grid" class="grid-cards" aria-live="polite" aria-busy="true">${UI.skeletonCards(3)}</div>
      <div id="tools-more"></div>
      <div id="tools-support" class="support-note"></div>
    </div>`;
  }

  async function init() {
    try {
      const [{ settings: s, profile }, tools] = await Promise.all([App.shared(), App.getTools()]);
      if (!document.getElementById('tools-grid')) return;
      settings = s; all = tools; query = ''; category = 'all'; shown = PAGE;
      document.getElementById('tools-head').innerHTML = UI.head(settings.home_tools_kicker, settings.nav_tools, settings.tools_subtitle);
      const cats = [...new Set(all.map(t => t.category).filter(Boolean))];
      const bar = document.getElementById('cat-filters');
      if (cats.length > 1) bar.innerHTML = UI.chips([['all', UI.S.all], ...cats.map(c => [c, c.charAt(0).toUpperCase() + c.slice(1)])], 'all');
      bar.addEventListener('click', e => {
        const b = e.target.closest('.chip'); if (!b) return;
        bar.querySelectorAll('.chip').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        category = b.dataset.chip; shown = PAGE; draw();
      });
      document.getElementById('tool-search').addEventListener('input', e => { query = e.target.value.trim().toLowerCase(); shown = PAGE; draw(); });
      document.getElementById('tools-more').addEventListener('click', e => { if (e.target.closest('[data-more]')) { shown += PAGE; draw(); } });
      draw();
      const support = UI.safeUrl(profile.bmc_url), box = document.getElementById('tools-support');
      if (box && support && settings.support_label) box.innerHTML = `<p>${UI.text(settings.footer_support_text)}</p>${UI.btn({ label: settings.support_label, href: support, external: true, variant: 'secondary', icon: 'arrow-up-right' })}`;
    } catch {
      const g = document.getElementById('tools-grid');
      if (g) { g.removeAttribute('aria-busy'); g.innerHTML = UI.errorState(UI.S.loadFail, UI.S.checkConnection, UI.S.retry); }
    }
  }

  function draw() {
    const grid = document.getElementById('tools-grid'); if (!grid) return;
    grid.removeAttribute('aria-busy');
    const list = all.filter(t => (category === 'all' || t.category === category) && (!query || `${t.title} ${t.description || ''} ${t.category || ''}`.toLowerCase().includes(query)));
    if (!list.length) { grid.innerHTML = `<div class="grid-empty">${UI.emptyState(UI.S.noResults, '')}</div>`; document.getElementById('tools-more').innerHTML = ''; return; }
    grid.innerHTML = list.slice(0, shown).map(t => card(t, settings, 'is-visible')).join('');
    document.getElementById('tools-more').innerHTML = UI.moreButton(list.length - shown);
  }

  return { render, init, card };
})();
