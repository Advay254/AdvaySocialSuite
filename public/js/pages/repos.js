const ReposPage = (() => {

  let allRepos = [];

  function render() {
    return `
      <div class="container">
        <div class="page-head">
          <h1 class="display" id="repos-title"></h1>
          <p class="lead">Public repositories and open source projects. Open any title to view it on GitHub.</p>
        </div>
        <div class="toolbar">
          <div class="search">
            ${UI.icon('search')}
            <label class="sr-only" for="repo-search">Search repositories</label>
            <input type="search" id="repo-search" class="input" placeholder="Search repositories" autocomplete="off">
          </div>
        </div>
        <div class="page-body"><div id="repos-list" class="repo-list" aria-live="polite" aria-busy="true">${UI.skeletonCards(3)}</div></div>
      </div>`;
  }

  async function init() {
    try {
      const [{ settings }, repos] = await Promise.all([App.shared(), App.api('/api/repos')]);
      const t = document.getElementById('repos-title');
      if (t) t.textContent = UI.stripEmoji(settings.nav_repos || '');
      allRepos = repos;
      renderRepos(allRepos);
      document.getElementById('repo-search')?.addEventListener('input', e => filter(e.target.value));
      document.getElementById('repos-list')?.addEventListener('click', e => {
        const btn = e.target.closest('.readme-toggle');
        if (btn) toggleReadme(btn);
      });
    } catch {
      const list = document.getElementById('repos-list');
      if (list) { list.removeAttribute('aria-busy'); list.innerHTML = UI.errorState('The repositories did not load.', 'Check your connection, then try again.', 'Try again'); }
    }
  }

  function renderRepos(repos) {
    const list = document.getElementById('repos-list');
    if (!list) return;
    list.removeAttribute('aria-busy');
    if (!repos.length) { list.innerHTML = UI.emptyState('No repositories match your search.', 'Clear the search to see them all.'); return; }

    list.innerHTML = repos.map(repo => {
      const tags = UI.parseJSON(repo.tags, []);
      const url = UI.safeUrl(repo.url);
      const hasReadme = repo.readme_md && repo.readme_md.trim().length > 0;
      const title = `${UI.icon('github')}<span>${UI.text(repo.title)}</span>${url ? UI.icon('arrow-up-right') : ''}`;
      return `
        <article class="card repo" data-id="${Number(repo.id)}">
          ${url ? `<a class="repo__title" href="${UI.esc(url)}" target="_blank" rel="noopener noreferrer">${title}</a>` : `<span class="repo__title">${title}</span>`}
          ${repo.description ? `<p class="repo__desc">${UI.text(repo.description)}</p>` : ''}
          ${tags.length ? `<div class="tags">${tags.map(t => `<span class="tag">${UI.text(t)}</span>`).join('')}</div>` : ''}
          ${hasReadme ? `
            <button type="button" class="readme-toggle" aria-expanded="false" aria-controls="readme-${Number(repo.id)}">
              <span>README.md</span><span style="margin-left:auto">${UI.icon('chevron-down')}</span>
            </button>
            <div id="readme-${Number(repo.id)}" class="readme-body" hidden></div>` : ''}
        </article>`;
    }).join('');
  }

  function toggleReadme(btn) {
    const id = btn.getAttribute('aria-controls');
    const body = document.getElementById(id);
    if (!body) return;
    const open = btn.getAttribute('aria-expanded') === 'true';
    if (!open && !body.dataset.rendered) {
      const repoId = Number(id.replace('readme-', ''));
      const repo = allRepos.find(r => Number(r.id) === repoId);
      if (repo && repo.readme_md) {
        const raw = typeof marked !== 'undefined' ? marked.parse(repo.readme_md) : UI.esc(repo.readme_md).replace(/\n/g, '<br>');
        body.innerHTML = UI.sanitizeHtml(raw);
        body.dataset.rendered = '1';
      }
    }
    body.hidden = open;
    btn.setAttribute('aria-expanded', String(!open));
  }

  function filter(query) {
    const q = String(query || '').toLowerCase();
    renderRepos(allRepos.filter(r =>
      (r.title || '').toLowerCase().includes(q) ||
      (r.description || '').toLowerCase().includes(q) ||
      String(r.tags || '').toLowerCase().includes(q)
    ));
  }

  return { render, init };
})();
