const ReposPage = (() => {

  const PAGE = 6;
  let all = [], query = '', shown = PAGE;

  function render() {
    return `<div class="container">
      <div id="repos-head">${UI.head('', ' ', '')}</div>
      <div class="toolbar">${UI.searchBox('repo-search', UI.S.search)}</div>
      <div id="repos-list" class="grid-cards" aria-live="polite" aria-busy="true">${UI.skeletonCards(3)}</div>
      <div id="repos-more"></div>
    </div>`;
  }

  async function init() {
    try {
      const [{ settings, profile }, repos] = await Promise.all([App.shared(), App.getRepos()]);
      if (!document.getElementById('repos-list')) return;
      all = repos; query = ''; shown = PAGE;
      document.getElementById('repos-head').innerHTML = UI.head(settings.site_tagline || profile.tagline, settings.nav_repos, settings.repos_subtitle);
      draw();
      document.getElementById('repo-search').addEventListener('input', e => { query = e.target.value.trim().toLowerCase(); shown = PAGE; draw(); });
      document.getElementById('repos-more').addEventListener('click', e => { if (e.target.closest('[data-more]')) { shown += PAGE; draw(); } });
      document.getElementById('repos-list').addEventListener('click', e => { const b = e.target.closest('.readme-toggle'); if (b) toggleReadme(b); });
    } catch {
      const l = document.getElementById('repos-list');
      if (l) { l.removeAttribute('aria-busy'); l.innerHTML = UI.errorState(UI.S.loadFail, UI.S.checkConnection, UI.S.retry); }
    }
  }

  function draw() {
    const list = document.getElementById('repos-list'); if (!list) return;
    list.removeAttribute('aria-busy');
    const rows = all.filter(r => !query || `${r.title} ${r.description || ''} ${r.tags || ''}`.toLowerCase().includes(query));
    if (!rows.length) { list.innerHTML = `<div class="grid-empty">${UI.emptyState(UI.S.noResults, '')}</div>`; document.getElementById('repos-more').innerHTML = ''; return; }
    list.innerHTML = rows.slice(0, shown).map(repo => {
      const tags = UI.parseJSON(repo.tags, []).slice(0, 5), url = UI.safeUrl(repo.url);
      const hasReadme = repo.readme_md && repo.readme_md.trim().length > 0;
      return `<article class="card glow-card is-visible" data-id="${Number(repo.id)}">
        <div class="media"><span class="media__icon">${UI.icon('github', 44)}</span>${url ? UI.goButton(url, UI.stripEmoji(repo.title), true, false) : ''}</div>
        <div class="card-body">
          <p class="k">${UI.text(UI.hostOf(url))}</p>
          <h3>${UI.text(repo.title)}</h3>
          ${repo.description ? `<p class="desc">${UI.text(repo.description)}</p>` : ''}
          ${tags.length ? `<div class="tags">${tags.map(t => `<span class="tag">${UI.text(t)}</span>`).join('')}</div>` : ''}
        </div>
        ${hasReadme ? `<button type="button" class="readme-toggle" aria-expanded="false" aria-controls="readme-${Number(repo.id)}"><span>README.md</span><span class="plus" aria-hidden="true">${UI.icon('plus', 16)}</span></button><div id="readme-${Number(repo.id)}" class="readme-body" hidden></div>` : ''}
      </article>`;
    }).join('');
    document.getElementById('repos-more').innerHTML = UI.moreButton(rows.length - shown);
  }

  function toggleReadme(btn) {
    const body = document.getElementById(btn.getAttribute('aria-controls'));
    if (!body) return;
    const open = btn.getAttribute('aria-expanded') === 'true';
    if (!open && !body.dataset.rendered) {
      const repo = all.find(r => Number(r.id) === Number(body.id.replace('readme-', '')));
      if (repo && repo.readme_md) {
        const raw = typeof marked !== 'undefined' ? marked.parse(repo.readme_md) : UI.esc(repo.readme_md).replace(/\n/g, '<br>');
        body.innerHTML = UI.sanitizeHtml(raw); body.dataset.rendered = '1';
      }
    }
    body.hidden = open;
    btn.setAttribute('aria-expanded', String(!open));
  }

  return { render, init };
})();
