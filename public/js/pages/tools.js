const ToolsPage = (() => {

  let allTools = [], settings = {}, query = '', category = 'all';
  const TONES = ['cream', 'ink', 'container', 'cream'];
  const STATUS = { active: ['status_live_label', 'live'], waking: ['status_waking_label', 'waking'], down: ['status_down_label', 'down'] };

  function render() {
    return `
      <div class="container">
        <div class="page-head">
          <h1 class="display" id="tools-title"></h1>
          <p class="lead" id="tools-page-subtitle"></p>
        </div>
        <div class="toolbar">
          <div class="search">
            ${UI.icon('search')}
            <label class="sr-only" for="tool-search">Search tools</label>
            <input type="search" id="tool-search" class="input" placeholder="Search tools" autocomplete="off">
          </div>
          <div class="tabs" id="cat-filters" role="group" aria-label="Filter by category"></div>
        </div>
        <div class="page-body">
          <div id="tools-grid" class="tool-grid" aria-live="polite" aria-busy="true">${UI.skeletonCards(2)}</div>
          <div id="tools-support" class="more-row hidden"></div>
        </div>
      </div>`;
  }

  async function init() {
    try {
      const [shared, tools] = await Promise.all([App.shared(), App.api('/api/tools')]);
      if (!document.getElementById('tools-grid')) return;
      settings = shared.settings; allTools = tools;
      document.getElementById('tools-title').textContent = UI.stripEmoji(settings.nav_tools || '');
      document.getElementById('tools-page-subtitle').textContent = UI.stripEmoji(settings.tools_subtitle || '');
      buildFilters();
      draw();
      document.getElementById('tool-search').addEventListener('input', e => { query = e.target.value.trim().toLowerCase(); draw(); });

      const support = UI.safeUrl(shared.profile.bmc_url);
      const box = document.getElementById('tools-support');
      if (box && support && settings.support_label) {
        box.classList.remove('hidden');
        box.innerHTML = `<p class="muted" style="margin-bottom:1rem">${UI.text(settings.footer_support_text)}</p>${UI.btn({ label: settings.support_label, href: support, external: true, variant: 'secondary', icon: 'arrow-up-right' })}`;
      }
    } catch {
      const g = document.getElementById('tools-grid');
      if (g) { g.removeAttribute('aria-busy'); g.innerHTML = UI.errorState('The tools did not load.', 'Check your connection, then try again.', 'Try again'); }
    }
  }

  function buildFilters() {
    const cats = [...new Set(allTools.map(t => t.category).filter(Boolean))];
    const bar = document.getElementById('cat-filters');
    if (!bar) return;
    if (cats.length < 2) { bar.classList.add('hidden'); return; }
    const mk = (cat, label, on) => `<button type="button" class="tab" data-cat="${UI.esc(cat)}" aria-pressed="${on}">${UI.text(label)}</button>`;
    bar.innerHTML = mk('all', settings.nav_tools || '', true) + cats.map(c => mk(c, c.charAt(0).toUpperCase() + c.slice(1), false)).join('');
    bar.addEventListener('click', e => {
      const b = e.target.closest('.tab');
      if (!b) return;
      bar.querySelectorAll('.tab').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      category = b.dataset.cat; draw();
    });
  }

  function draw() {
    const grid = document.getElementById('tools-grid');
    if (!grid) return;
    grid.removeAttribute('aria-busy');
    const list = allTools.filter(t => (category === 'all' || t.category === category) &&
      (!query || `${t.title} ${t.description || ''} ${t.category || ''}`.toLowerCase().includes(query)));
    if (!list.length) { grid.innerHTML = `<div style="grid-column:1/-1">${UI.emptyState('No tools match your search.', 'Clear the search or choose another category.')}</div>`; return; }
    const open = settings.tool_open_label;
    grid.innerHTML = list.map((t, i) => {
      const url = UI.safeUrl(t.url);
      const st = STATUS[String(t.status || 'active').toLowerCase()] || STATUS.active;
      const inner = `
        <div class="tile__top">${t.category ? `<span class="tag">${UI.text(t.category)}</span>` : ''}${settings[st[0]] ? `<span class="tag tag--${st[1]}">${UI.text(settings[st[0]])}</span>` : ''}</div>
        <div class="tile__main"><h2 class="tile__name">${UI.text(t.title)}</h2>${t.description ? `<p class="tile__desc">${UI.text(t.description)}</p>` : ''}</div>
        <div class="tile__foot"><span class="tile__host">${UI.text(url ? UI.hostOf(url) : '')}</span>${url && open ? UI.btn({ label: open, static: true, icon: 'arrow-up-right' }) : ''}</div>`;
      const cls = `tile tool-card tile--${TONES[i % 4]}`;
      return url
        ? `<a class="${cls} card--interactive" href="${UI.esc(url)}" target="_blank" rel="noopener noreferrer">${inner}</a>`
        : `<div class="${cls}">${inner}</div>`;
    }).join('');
  }

  return { render, init };
})();
