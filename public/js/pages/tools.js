const ToolsPage = (() => {

  let allTools = [];

  function render() {
    return `
      <div class="container">
        <div class="page-head">
          <h1 id="tools-title"></h1>
          <p id="tools-page-subtitle"></p>
        </div>
        <div class="toolbar" id="cat-filters" role="group" aria-label="Filter by category"></div>
        <div id="tools-grid" class="grid grid--3" aria-live="polite" aria-busy="true">${UI.skeletonCards(3)}</div>
        <div id="tools-support" class="state hidden"></div>
      </div>`;
  }

  async function init() {
    try {
      const [{ settings, profile }, tools] = await Promise.all([App.shared(), App.api('/api/tools')]);
      if (!document.getElementById('tools-grid')) return;
      allTools = tools;
      document.getElementById('tools-title').textContent = UI.stripEmoji(settings.nav_tools || '');
      document.getElementById('tools-page-subtitle').textContent = UI.stripEmoji(settings.tools_subtitle || '');
      buildFilters();
      renderTools(allTools);

      const support = UI.safeUrl(profile.bmc_url);
      const box = document.getElementById('tools-support');
      if (box && support && settings.support_label) {
        box.classList.remove('hidden');
        box.innerHTML = `<p>${UI.text(settings.footer_support_text)}</p><a class="btn btn--secondary" href="${UI.esc(support)}" target="_blank" rel="noopener noreferrer">${UI.text(settings.support_label)} ${UI.icon('arrow-up-right')}</a>`;
      }
    } catch {
      const g = document.getElementById('tools-grid');
      if (g) { g.removeAttribute('aria-busy'); g.innerHTML = UI.errorState('Could not load tools.', '', 'Try again'); }
    }
  }

  function buildFilters() {
    const cats = [...new Set(allTools.map(t => t.category).filter(Boolean))];
    const bar = document.getElementById('cat-filters');
    if (!bar) return;
    if (cats.length < 2) { bar.classList.add('hidden'); return; }
    const mk = (cat, label, on) => `<button type="button" class="chip" data-cat="${UI.esc(cat)}" aria-pressed="${on}">${UI.text(label)}</button>`;
    bar.innerHTML = mk('all', 'All', true) + cats.map(c => mk(c, c.charAt(0).toUpperCase() + c.slice(1), false)).join('');
    bar.addEventListener('click', e => {
      const b = e.target.closest('.chip');
      if (!b) return;
      bar.querySelectorAll('.chip').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      renderTools(b.dataset.cat === 'all' ? allTools : allTools.filter(t => t.category === b.dataset.cat));
    });
  }

  function renderTools(tools) {
    const grid = document.getElementById('tools-grid');
    if (!grid) return;
    grid.removeAttribute('aria-busy');
    if (!tools.length) { grid.innerHTML = UI.emptyState('No tools found.'); return; }
    grid.innerHTML = tools.map(t => {
      const url = UI.safeUrl(t.url);
      const inner = `
        <div class="tile__top">
          <span class="tile__icon">${UI.categoryIcon(t.category)}</span>
          <span class="status" title="Live"><span class="dot" aria-hidden="true"></span><span class="sr-only">Live</span></span>
        </div>
        <h3 class="tile__title">${UI.text(t.title)}</h3>
        <p class="tile__desc">${UI.text(t.description || '')}</p>
        <div class="tile__foot"><span class="mono">${UI.text(url ? UI.hostOf(url) : (t.category || ''))}</span>${url ? `<span class="tile__arrow">${UI.icon('arrow-up-right')}</span>` : ''}</div>`;
      return url
        ? `<a href="${UI.esc(url)}" target="_blank" rel="noopener noreferrer" class="card tile">${inner}</a>`
        : `<div class="card tile">${inner}</div>`;
    }).join('');
  }

  return { render, init };
})();
