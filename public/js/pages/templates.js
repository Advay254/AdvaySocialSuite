const TemplatesPage = (() => {

  const PAGE = 6;
  let all = [], settings = {}, query = '', tag = 'all', shown = PAGE;

  function card(t, st) {
    const tags = UI.parseJSON(t.tags, []).slice(0, 4), dl = UI.safeUrl(t.json_url);
    return `<article class="card glow-card reveal is-visible">
      <div class="media media--short"><span class="media__icon">${UI.icon('workflow', 40)}</span>${dl ? UI.goButton(dl, `${st.template_import_label || ''} ${UI.stripEmoji(t.title)}`.trim(), true, false) : ''}</div>
      <div class="card-body">
        ${tags.length ? `<p class="k">${UI.text(tags[0])}</p>` : ''}
        <h3>${UI.text(t.title)}</h3>
        ${t.description ? `<p class="desc">${UI.text(t.description)}</p>` : ''}
        ${tags.length > 1 ? `<div class="tags">${tags.slice(1).map(x => `<span class="tag">${UI.text(x)}</span>`).join('')}</div>` : ''}
      </div>
      ${dl && st.template_import_label ? `<div class="card-actions"><span class="host"></span>${UI.btn({ label: st.template_import_label, href: dl, external: true, size: 'sm', icon: 'download' })}</div>` : ''}
    </article>`;
  }

  function render() {
    return `<div class="container">
      <div id="tmpl-head">${UI.head('', ' ', '')}</div>
      <div class="toolbar">${UI.searchBox('tmpl-search', UI.S.search)}<div id="tmpl-filters"></div></div>
      <div id="templates-grid" class="grid-cards" aria-live="polite" aria-busy="true">${UI.skeletonCards(3)}</div>
      <div id="tmpl-more"></div>
    </div>`;
  }

  async function init() {
    const grid = document.getElementById('templates-grid');
    try {
      const [{ settings: s }, templates] = await Promise.all([App.shared(), App.getTemplates()]);
      if (!document.getElementById('templates-grid')) return;
      settings = s; all = templates; query = ''; tag = 'all'; shown = PAGE;
      document.getElementById('tmpl-head').innerHTML = UI.head(settings.home_templates_kicker, settings.templates_label, settings.templates_subtitle);
      const counts = {};
      all.forEach(t => UI.parseJSON(t.tags, []).forEach(x => { const k = UI.stripEmoji(x); if (k) counts[k] = (counts[k] || 0) + 1; }));
      const top = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 8);
      const bar = document.getElementById('tmpl-filters');
      if (top.length > 1) bar.innerHTML = UI.chips([['all', UI.S.all], ...top.map(x => [x, x])], 'all');
      bar.addEventListener('click', e => {
        const b = e.target.closest('.chip'); if (!b) return;
        bar.querySelectorAll('.chip').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        tag = b.dataset.chip; shown = PAGE; draw();
      });
      document.getElementById('tmpl-search').addEventListener('input', e => { query = e.target.value.trim().toLowerCase(); shown = PAGE; draw(); });
      document.getElementById('tmpl-more').addEventListener('click', e => { if (e.target.closest('[data-more]')) { shown += PAGE; draw(); } });
      draw();
    } catch {
      if (grid) { grid.removeAttribute('aria-busy'); grid.innerHTML = UI.errorState(UI.S.loadFail, UI.S.checkConnection, UI.S.retry); }
    }
  }

  function draw() {
    const grid = document.getElementById('templates-grid'); if (!grid) return;
    grid.removeAttribute('aria-busy');
    const rows = all.filter(t => (tag === 'all' || UI.parseJSON(t.tags, []).includes(tag)) && (!query || `${t.title} ${t.description || ''} ${t.tags || ''}`.toLowerCase().includes(query)));
    if (!rows.length) { grid.innerHTML = `<div class="grid-empty">${all.length ? UI.emptyState(UI.S.noResults, '') : UI.emptyState('No templates are published yet.', 'Check back soon.')}</div>`; document.getElementById('tmpl-more').innerHTML = ''; return; }
    grid.innerHTML = rows.slice(0, shown).map(t => card(t, settings)).join('');
    document.getElementById('tmpl-more').innerHTML = UI.moreButton(rows.length - shown);
  }

  return { render, init, card };
})();
