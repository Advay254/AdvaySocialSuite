const TemplatesPage = (() => {

  function render() {
    return `
      <div class="container">
        <div class="page-head">
          <h1 class="display" id="tmpl-title"></h1>
          <p class="lead" id="templates-page-subtitle"></p>
        </div>
        <div class="page-body"><div id="templates-grid" class="rows" aria-busy="true" style="margin-top:0">${UI.skeletonCards(2)}</div></div>
      </div>`;
  }

  async function init() {
    const grid = document.getElementById('templates-grid');
    try {
      const [{ settings }, templates] = await Promise.all([App.shared(), App.api('/api/templates')]);
      if (!document.getElementById('templates-grid')) return;
      document.getElementById('tmpl-title').textContent = UI.stripEmoji(settings.templates_label || '');
      document.getElementById('templates-page-subtitle').textContent = UI.stripEmoji(settings.templates_subtitle || '');
      grid.removeAttribute('aria-busy');
      if (!templates.length) { grid.innerHTML = UI.emptyState('No templates are published yet.', 'Check back soon.'); return; }
      grid.innerHTML = templates.map(t => {
        const tags = UI.parseJSON(t.tags, []);
        const dl = UI.safeUrl(t.json_url);
        return `<article class="row-item">
          <div><h2 class="row-item__name">${UI.text(t.title)}</h2></div>
          <div class="row-item__side">${tags.map(x => `<span class="tag">${UI.text(x)}</span>`).join('')}${dl && settings.template_import_label ? UI.btn({ label: settings.template_import_label, href: dl, external: true, variant: 'secondary', size: 'sm', icon: 'download' }) : ''}</div>
          ${t.description ? `<p class="row-item__desc" style="-webkit-line-clamp:2">${UI.text(t.description)}</p>` : ''}
        </article>`;
      }).join('');
    } catch {
      if (grid) { grid.removeAttribute('aria-busy'); grid.innerHTML = UI.errorState('The templates did not load.', 'Check your connection, then try again.', 'Try again'); }
    }
  }

  return { render, init };
})();
