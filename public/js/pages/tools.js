const ToolsPage = (() => {

  let allTools = [];

  const CATEGORY_LABELS = {
    downloader: 'Downloader',
    entertainment: 'Entertainment',
    utility: 'Utility',
    blog: 'Blog',
    tool: 'Tool',
  };

  function render() {
    return `
      <div class="page-hero">
        <div class="hero-grid"></div>
        <div class="max-w-7xl mx-auto container-pad relative z-10">
          <div class="section-label justify-center">Live Products</div>
          <h1 class="page-hero-title gradient-text-2">ACTIVE TOOLS</h1>
          <p class="text-slate-400 max-w-xl mx-auto">Fully deployed, free-to-use tools built and maintained by Advay. Click any card to visit.</p>
        </div>
      </div>

      <div class="neon-line"></div>

      <div class="max-w-7xl mx-auto container-pad py-12">

        <!-- Category filter -->
        <div class="flex flex-wrap gap-2 mb-8" id="cat-filters">
          <button class="filter-btn active" data-cat="all" onclick="ToolsPage._filterCat('all', this)">All</button>
        </div>

        <!-- Tools grid -->
        <div id="tools-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          ${[1,2,3].map(() => `
            <div class="glass-card p-6 animate-pulse">
              <div class="flex gap-4 mb-4">
                <div class="w-12 h-12 bg-white/5 rounded-xl flex-shrink-0"></div>
                <div class="flex-1"><div class="h-4 bg-white/5 rounded mb-2 w-2/3"></div><div class="h-3 bg-white/5 rounded w-1/3"></div></div>
              </div>
              <div class="h-3 bg-white/5 rounded w-full mb-2"></div>
              <div class="h-3 bg-white/5 rounded w-3/4"></div>
            </div>`).join('')}
        </div>

        <p id="no-tools" class="hidden text-center text-slate-500 py-16">No tools found.</p>

        <!-- BMC callout -->
        <div class="mt-16 text-center">
          <p class="text-slate-500 text-sm mb-3">All tools are free to use. No login, no fees.</p>
          <a href="https://www.buymeacoffee.com/advay254" target="_blank" rel="noopener"
             class="inline-flex items-center gap-2 text-sm font-medium text-yellow-400/70 hover:text-yellow-400 transition-colors">
            ☕ Support the hosting costs
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M7 7h10v10"/></svg>
          </a>
        </div>
      </div>

      <footer class="site-footer max-w-7xl mx-auto container-pad">
        <div class="text-sm text-slate-500">
          More tools coming soon · Built with ❤️ by <a href="#/about" class="text-cyan hover:underline">Advay</a>
        </div>
      </footer>
    `;
  }

  async function init() {
    try {
      allTools = await App.api('/api/tools');
      buildCategoryFilters();
      renderTools(allTools);
    } catch {
      document.getElementById('tools-grid').innerHTML =
        `<p class="text-slate-500 col-span-3 text-center py-12">Could not load tools.</p>`;
    }
  }

  function buildCategoryFilters() {
    const cats = [...new Set(allTools.map(t => t.category).filter(Boolean))];
    const container = document.getElementById('cat-filters');
    if (!container || cats.length < 2) return;

    const existing = container.querySelector('[data-cat="all"]');
    cats.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.dataset.cat = cat;
      btn.textContent = CATEGORY_LABELS[cat] || cat;
      btn.onclick = () => ToolsPage._filterCat(cat, btn);
      container.appendChild(btn);
    });

    // Inject filter btn styles
    if (!document.getElementById('filter-btn-style')) {
      const style = document.createElement('style');
      style.id = 'filter-btn-style';
      style.textContent = `
        .filter-btn {
          padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600;
          border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.4);
          background: transparent; cursor: pointer; transition: all .2s ease; font-family: inherit;
          letter-spacing: 0.3px;
        }
        .filter-btn:hover { border-color: rgba(0,229,255,0.3); color: rgba(0,229,255,0.8); }
        .filter-btn.active {
          background: rgba(0,229,255,0.1); border-color: rgba(0,229,255,0.4);
          color: #00e5ff; box-shadow: 0 0 12px rgba(0,229,255,0.1);
        }
      `;
      document.head.appendChild(style);
    }
  }

  function renderTools(tools) {
    const grid = document.getElementById('tools-grid');
    const noTools = document.getElementById('no-tools');
    if (!grid) return;

    if (!tools.length) {
      grid.innerHTML = '';
      noTools.classList.remove('hidden');
      return;
    }
    noTools.classList.add('hidden');

    grid.innerHTML = tools.map(t => `
      <a href="${t.url || '#'}" target="_blank" rel="noopener"
         class="glass-card tool-card p-6 block group" data-cat="${t.category || 'tool'}">

        <div class="flex items-start gap-4 mb-4">
          <div class="tool-icon group-hover:border-cyan group-hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all">
            ${t.icon || '🔧'}
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-heading font-700 text-white text-base group-hover:text-cyan transition-colors leading-tight mb-1">${t.title}</h3>
            <div class="flex items-center gap-2">
              <span class="status-active">Live</span>
              ${t.category ? `<span class="text-xs text-slate-500 font-mono">${CATEGORY_LABELS[t.category] || t.category}</span>` : ''}
            </div>
          </div>
        </div>

        <p class="text-slate-400 text-sm leading-relaxed mb-4">${t.description || ''}</p>

        <div class="flex items-center justify-between">
          <span class="text-xs text-slate-600 font-mono truncate">${t.url ? new URL(t.url).hostname : ''}</span>
          <div class="flex items-center gap-1 text-xs text-cyan/50 group-hover:text-cyan transition-colors flex-shrink-0 ml-2">
            <span>Visit</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M7 7h10v10"/></svg>
          </div>
        </div>
      </a>
    `).join('');
  }

  function _filterCat(cat, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filtered = cat === 'all' ? allTools : allTools.filter(t => t.category === cat);
    renderTools(filtered);
  }

  return { render, init, _filterCat };
})();
