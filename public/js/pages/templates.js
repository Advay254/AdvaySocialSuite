const TemplatesPage = (() => {

  function render() {
    return `
      <div class="page-hero">
        <div class="hero-grid"></div>
        <div class="max-w-6xl mx-auto container-pad relative z-10">
          <div class="section-label justify-center">Automation</div>
          <h1 class="page-hero-title gradient-text-2">N8N TEMPLATES</h1>
          <p style="color:rgba(255,255,255,.4)" class="max-w-xl mx-auto text-sm">Ready-to-import n8n workflow templates. Click the JSON button to download and import directly into your n8n instance.</p>
        </div>
      </div>
      <div class="neon-line"></div>
      <div class="max-w-6xl mx-auto container-pad py-12">
        <div id="templates-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          ${[1,2,3].map(()=>`<div class="glass-card p-5 animate-pulse"><div class="h-4 bg-white/5 rounded mb-3 w-2/3"></div><div class="h-3 bg-white/5 rounded w-full mb-2"></div><div class="h-3 bg-white/5 rounded w-1/2"></div></div>`).join('')}
        </div>
        <p id="no-templates" class="hidden text-center py-16 text-sm" style="color:rgba(255,255,255,.3)">No templates yet.</p>
      </div>
      <footer class="site-footer max-w-6xl mx-auto container-pad">
        <div class="text-sm" style="color:rgba(255,255,255,.3)">
          Built by <a href="https://github.com/Advay254" target="_blank" style="color:var(--cyan)" class="hover:underline">Advay</a>
        </div>
      </footer>
    `;
  }

  async function init() {
    try {
      const templates = await App.api('/api/templates');
      const grid = document.getElementById('templates-grid');
      const none = document.getElementById('no-templates');
      if (!templates.length) { grid.innerHTML=''; none.classList.remove('hidden'); return; }
      grid.innerHTML = templates.map(t => {
        let tags = [];
        try { tags = typeof t.tags==='string' ? JSON.parse(t.tags) : (t.tags||[]); } catch {}
        return `
          <div class="glass-card p-6">
            <div class="flex items-start justify-between gap-3 mb-3">
              <h3 class="font-heading font-700 text-white text-base leading-tight">${t.title}</h3>
              ${t.json_url ? `
              <a href="${t.json_url}" target="_blank" rel="noopener" class="btn-primary flex-shrink-0 text-xs" style="padding:6px 14px;font-size:11px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Import JSON
              </a>` : ''}
            </div>
            <p class="text-xs leading-relaxed mb-4" style="color:rgba(255,255,255,.4)">${t.description||''}</p>
            ${tags.length ? `<div class="flex flex-wrap gap-2">${tags.map(tg=>`<span class="tag-badge">${tg}</span>`).join('')}</div>` : ''}
          </div>`;
      }).join('');
    } catch {
      document.getElementById('templates-grid').innerHTML = `<p class="col-span-3 text-center py-12 text-sm" style="color:rgba(255,255,255,.3)">Could not load templates.</p>`;
    }
  }

  return { render, init };
})();
