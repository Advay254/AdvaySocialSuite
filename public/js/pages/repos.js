const ReposPage = (() => {

  let allRepos = [];

  function render() {
    return `
      <div class="page-hero">
        <div class="hero-grid"></div>
        <div class="max-w-7xl mx-auto container-pad relative z-10">
          <div class="section-label justify-center">Open Source</div>
          <h1 class="page-hero-title gradient-text-2">GITHUB REPOS</h1>
          <p class="text-slate-400 max-w-xl mx-auto">Public repositories and open source projects. Click any title to view on GitHub.</p>
        </div>
      </div>

      <div class="neon-line"></div>

      <div class="max-w-7xl mx-auto container-pad py-12">
        <!-- Search & filter bar -->
        <div class="flex flex-col sm:flex-row gap-3 mb-8">
          <div class="relative flex-1">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input type="text" id="repo-search" placeholder="Search repositories..."
                   class="search-input pl-10" oninput="ReposPage._filter(this.value)">
          </div>
        </div>

        <!-- Repos grid -->
        <div id="repos-list" class="space-y-4">
          ${[1,2,3].map(() => `
            <div class="glass-card p-6 animate-pulse">
              <div class="h-5 bg-white/5 rounded w-1/3 mb-3"></div>
              <div class="h-3 bg-white/5 rounded w-full mb-2"></div>
              <div class="h-3 bg-white/5 rounded w-2/3"></div>
            </div>`).join('')}
        </div>

        <p id="no-repos" class="hidden text-center text-slate-500 py-16">No repositories found.</p>
      </div>

      <footer class="site-footer max-w-7xl mx-auto container-pad">
        <div class="text-sm text-slate-500">
          <a href="https://github.com/Advay254" target="_blank" class="hover:text-cyan transition-colors">
            View all repos on GitHub →
          </a>
        </div>
      </footer>
    `;
  }

  async function init() {
    try {
      allRepos = await App.api('/api/repos');
      renderRepos(allRepos);
    } catch {
      document.getElementById('repos-list').innerHTML =
        `<p class="text-slate-500 text-center py-12">Could not load repositories.</p>`;
    }
  }

  function renderRepos(repos) {
    const list = document.getElementById('repos-list');
    const noRepos = document.getElementById('no-repos');

    if (!repos.length) {
      list.innerHTML = '';
      noRepos.classList.remove('hidden');
      return;
    }
    noRepos.classList.add('hidden');

    list.innerHTML = repos.map((repo, idx) => {
      let tags = [];
      try { tags = typeof repo.tags === 'string' ? JSON.parse(repo.tags) : (repo.tags || []); } catch {}

      const hasReadme = repo.readme_md && repo.readme_md.trim().length > 0;

      return `
        <div class="repo-card" data-id="${repo.id}">
          <!-- Repo header -->
          <div class="repo-header">
            <div class="flex-1 min-w-0">
              <div class="flex flex-wrap items-center gap-3 mb-2">
                <a href="${repo.url || '#'}" target="_blank" rel="noopener"
                   class="font-heading font-700 text-white text-base hover:text-cyan transition-colors truncate group flex items-center gap-2">
                  <svg class="w-4 h-4 text-slate-500 group-hover:text-cyan flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.929.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
                  ${repo.title}
                  <svg class="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M7 7h10v10"/></svg>
                </a>
              </div>

              <p class="text-slate-400 text-sm leading-relaxed mb-3">
                ${repo.description || 'No description provided.'}
              </p>

              ${tags.length ? `
              <div class="flex flex-wrap gap-2">
                ${tags.map(t => `<span class="tag-badge">${t}</span>`).join('')}
              </div>` : ''}
            </div>
          </div>

          <!-- README toggle -->
          ${hasReadme ? `
          <button class="readme-toggle" onclick="ReposPage._toggleReadme(${repo.id}, this)" aria-expanded="false">
            <span class="toggle-icon">▾</span>
            README.md
            <span class="text-slate-500 font-normal ml-auto text-xs">click to expand</span>
          </button>
          <div class="readme-content" id="readme-${repo.id}">
            <div class="readme-body" id="readme-body-${repo.id}"></div>
          </div>` : ''}
        </div>
      `;
    }).join('');
  }

  function _toggleReadme(id, btn) {
    const content = document.getElementById(`readme-${id}`);
    const body = document.getElementById(`readme-body-${id}`);
    const isOpen = content.classList.contains('open');

    if (!isOpen) {
      // Render markdown on first open
      if (!body.dataset.rendered) {
        const repo = allRepos.find(r => r.id === id || r.id === String(id));
        if (repo?.readme_md) {
          body.innerHTML = marked.parse(repo.readme_md);
          body.dataset.rendered = '1';
        }
      }
      content.classList.add('open');
      btn.classList.add('open');
      btn.querySelector('.toggle-icon').textContent = '▴';
      btn.setAttribute('aria-expanded', 'true');
      btn.querySelector('span:last-child').textContent = 'click to collapse';
    } else {
      content.classList.remove('open');
      btn.classList.remove('open');
      btn.querySelector('.toggle-icon').textContent = '▾';
      btn.setAttribute('aria-expanded', 'false');
      btn.querySelector('span:last-child').textContent = 'click to expand';
    }
  }

  function _filter(query) {
    const q = query.toLowerCase();
    const filtered = allRepos.filter(r =>
      r.title.toLowerCase().includes(q) ||
      (r.description || '').toLowerCase().includes(q) ||
      (r.tags || '').toLowerCase().includes(q)
    );
    renderRepos(filtered);
  }

  return { render, init, _toggleReadme, _filter };
})();
