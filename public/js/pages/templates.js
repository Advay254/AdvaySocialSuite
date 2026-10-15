const TemplatesPage = (() => {

  function render() {
    return `
      <div class="container">
        <div class="page-head">
          <h1 id="tmpl-title"></h1>
          <p id="templates-page-subtitle"></p>
        </div>
        <div id="templates-grid" class="grid grid--3" aria-busy="true">${UI.skeletonCards(3)}</div>
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
      if (!templates.length) { grid.innerHTML = UI.emptyState('No templates yet.'); return; }
      const label = UI.text(settings.template_import_label || '');
      grid.innerHTML = templates.map(t => {
        const tags = UI.parseJSON(t.tags, []);
        const dl = UI.safeUrl(t.json_url);
        return `<article class="card tile">
          <div class="tile__top"><span class="tile__icon">${UI.icon('workflow')}</span></div>
          <h3 class="tile__title">${UI.text(t.title)}</h3>
          <p class="tile__desc">${UI.text(t.description || '')}</p>
          ${tags.length ? `<div class="tags">${tags.map(x => `<span class="tag">${UI.text(x)}</span>`).join('')}</div>` : ''}
          ${dl && label ? `<div class="tile__foot"><a class="btn btn--secondary btn--sm" href="${UI.esc(dl)}" target="_blank" rel="noopener noreferrer">${UI.icon('download')} ${label}</a></div>` : ''}
        </article>`;
      }).join('');
    } catch {
      if (grid) { grid.removeAttribute('aria-busy'); grid.innerHTML = UI.errorState('Could not load templates.', '', 'Try again'); }
    }
  }

  return { render, init };
})();
