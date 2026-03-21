const HomePage = (() => {

  function render() {
    return `
      <!-- ═══ HERO ═══ -->
      <section class="hero-section" id="hero">
        <div class="hero-grid"></div>

        <!-- Animated word ticker (inspired by slide animation pattern) -->
        <div class="hero-ticker" aria-hidden="true">
          <div class="hero-ticker-inner" id="hero-ticker">
            <span>BUILD.</span><span>AUTOMATE.</span><span>DEPLOY.</span>
            <span>INTEGRATE.</span><span>SCALE.</span><span>SHIP.</span>
            <span>OPTIMIZE.</span><span>CREATE.</span>
          </div>
        </div>

        <div class="max-w-6xl mx-auto container-pad relative z-10">
          <div class="hero-content">

            <!-- Name — loaded from profile -->
            <div class="hero-name-wrap">
              <h1 id="hero-name" class="hero-name">LOADING</h1>
            </div>

            <!-- Location badge — ONLY shows if location is set -->
            <div id="hero-badge" class="hero-badge hidden">
              <span class="hero-badge-dot"></span>
              <span id="hero-badge-text"></span>
            </div>

            <!-- Tagline — from profile -->
            <p id="hero-tagline" class="hero-tagline"></p>

            <!-- Sub — from settings -->
            <p id="hero-sub" class="hero-sub"></p>

            <!-- CTAs -->
            <div class="hero-ctas">
              <a href="#/tools" class="btn-primary">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                Explore Tools
              </a>
              <a href="#/collab" class="btn-secondary">
                Let's Collaborate
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
            </div>
          </div>

          <!-- Scroll cue -->
          <div class="hero-scroll-cue">
            <span>SCROLL</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
          </div>
        </div>
      </section>

      <div class="neon-line"></div>

      <!-- ═══ STATS ═══ -->
      <section class="section-block">
        <div class="max-w-6xl mx-auto container-pad">
          <div class="stats-grid" id="stats-grid">
            <div class="stat-item"><div class="stat-number" id="stat-tools">—</div><div class="stat-label">Live Tools</div></div>
            <div class="stat-item"><div class="stat-number" id="stat-repos">26</div><div class="stat-label">GitHub Repos</div></div>
            <div class="stat-item"><div class="stat-number">∞</div><div class="stat-label">Automations Built</div></div>
            <div class="stat-item"><div class="stat-number">0</div><div class="stat-label">Unnecessary Code</div></div>
          </div>
        </div>
      </section>

      <div class="divider"></div>

      <!-- ═══ FEATURED TOOLS ═══ -->
      <section class="section-block">
        <div class="max-w-6xl mx-auto container-pad">
          <div class="section-header">
            <div>
              <div class="section-label">Featured Work</div>
              <h2 class="section-title">Live Products</h2>
            </div>
            <a href="#/tools" class="btn-ghost">View all <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
          </div>
          <div id="featured-tools" class="tools-grid">
            ${[1,2,3].map(()=>`<div class="glass-card p-5 animate-pulse"><div class="h-4 bg-white/5 rounded mb-3 w-2/3"></div><div class="h-3 bg-white/5 rounded w-full mb-2"></div><div class="h-3 bg-white/5 rounded w-1/2"></div></div>`).join('')}
          </div>
        </div>
      </section>

      <div class="divider"></div>

      <!-- ═══ N8N TEMPLATES ═══ -->
      <section class="section-block" id="templates-preview">
        <div class="max-w-6xl mx-auto container-pad">
          <div class="section-header">
            <div>
              <div class="section-label">Automation</div>
              <h2 class="section-title">n8n Templates</h2>
            </div>
            <a href="#/templates" class="btn-ghost">View all <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
          </div>
          <div id="featured-templates" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="glass-card p-6 col-span-full text-center py-10 text-dim">
              <div style="font-size:2rem;margin-bottom:8px;">⚙️</div>
              <p class="text-sm">No templates yet.</p>
            </div>
          </div>
        </div>
      </section>

      <div class="divider"></div>

      <!-- ═══ PHILOSOPHY ═══ -->
      <section class="section-block">
        <div class="max-w-6xl mx-auto container-pad">
          <div class="glass-card philosophy-card">
            <div class="absolute inset-0 pointer-events-none" style="background:radial-gradient(ellipse at 50% 50%, color-mix(in srgb, var(--cyan) 4%, transparent) 0%, transparent 70%);border-radius:inherit;"></div>
            <div class="relative z-10 text-center max-w-3xl mx-auto">
              <div class="section-label justify-center">Philosophy</div>
              <blockquote class="philosophy-quote">
                "BUILD THINGS THAT WORK.<br>
                <span class="gradient-text">KEEP THEM SIMPLE.</span><br>
                MAKE THEM LAST."
              </blockquote>
              <p class="text-dim mt-5 text-sm">If something runs once, it runs forever — and if it runs daily, it runs itself.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══ FOOTER ═══ -->
      <footer class="site-footer">
        <div class="max-w-6xl mx-auto container-pad footer-inner">
          <div class="footer-links">
            <a href="https://github.com/Advay254" target="_blank" rel="noopener" class="footer-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.929.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
              GitHub
            </a>
            <a href="https://www.buymeacoffee.com/advay254" target="_blank" rel="noopener" class="footer-link" style="color:#ffd54f;">
              ☕ Buy me a coffee
            </a>
          </div>
          <p class="footer-credit">Built with AdvaySocialSuite</p>
        </div>
      </footer>
    `;
  }

  async function init() {
    // Load profile
    try {
      const profile = await App.api('/api/profile');

      // Name
      const nameEl = document.getElementById('hero-name');
      if (nameEl) nameEl.textContent = (profile.name || 'BUILDER').toUpperCase();

      // Tagline
      const tagEl = document.getElementById('hero-tagline');
      if (tagEl && profile.tagline) tagEl.textContent = profile.tagline;

      // Location badge — ONLY show if non-empty
      const loc = (profile.location || '').trim();
      if (loc) {
        const badge = document.getElementById('hero-badge');
        const badgeText = document.getElementById('hero-badge-text');
        if (badge && badgeText) {
          badgeText.textContent = loc;
          badge.classList.remove('hidden');
        }
      }

      // Stats
      const statRepos = document.getElementById('stat-repos');
      // repos count stays 26 (hardcoded public repos)
    } catch {}

    // Load settings for sub
    try {
      const s = await App.api('/api/settings');
      const sub = document.getElementById('hero-sub');
      if (sub && s.home_subheadline) sub.textContent = s.home_subheadline;
    } catch {}

    // Load tools count + featured
    try {
      const tools = await App.api('/api/tools');
      const statEl = document.getElementById('stat-tools');
      if (statEl) statEl.textContent = tools.length ? `${tools.length}+` : '—';

      const container = document.getElementById('featured-tools');
      if (container) {
        const featured = tools.slice(0,3);
        if (!featured.length) { container.innerHTML='<p class="text-dim text-sm col-span-3 text-center py-8">No tools yet.</p>'; }
        else {
          container.innerHTML = featured.map(t => `
            <a href="${t.url||'#'}" target="_blank" rel="noopener" class="glass-card tool-card p-5 block group">
              <div class="flex items-start gap-3 mb-3">
                <div class="tool-icon">${t.icon||'🔧'}</div>
                <div class="flex-1 min-w-0">
                  <h3 class="font-heading font-700 text-white text-sm group-hover:text-[var(--cyan)] transition-colors truncate mb-1">${t.title}</h3>
                  <span class="status-active">Live</span>
                </div>
              </div>
              <p class="text-xs leading-relaxed text-dim mb-3">${t.description||''}</p>
              <div class="flex items-center gap-1 text-xs font-mono text-dim group-hover:text-[var(--cyan)] transition-colors">
                Visit <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M7 7h10v10"/></svg>
              </div>
            </a>`).join('');
        }
      }
    } catch {}

    // Load templates preview
    try {
      const templates = await App.api('/api/templates');
      const container = document.getElementById('featured-templates');
      if (container && templates.length) {
        container.innerHTML = templates.slice(0,4).map(t => `
          <div class="glass-card p-5">
            <div class="flex items-start justify-between gap-3 mb-2">
              <h3 class="font-heading font-700 text-white text-sm">${t.title}</h3>
              ${t.json_url?`<a href="${t.json_url}" target="_blank" class="btn-ghost text-xs flex-shrink-0" style="padding:4px 10px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>JSON
              </a>`:''}
            </div>
            <p class="text-xs text-dim leading-relaxed">${t.description||''}</p>
          </div>`).join('');
      }
    } catch {}

    // Start hero word ticker animation
    initTicker();
  }

  function initTicker() {
    const ticker = document.getElementById('hero-ticker');
    if (!ticker) return;
    const words = ticker.querySelectorAll('span');
    let idx = 0;
    words.forEach((w,i) => { w.style.display = i===0 ? 'block' : 'none'; });

    setInterval(() => {
      words[idx].classList.add('ticker-exit');
      setTimeout(() => {
        words[idx].style.display = 'none';
        words[idx].classList.remove('ticker-exit');
        idx = (idx + 1) % words.length;
        words[idx].style.display = 'block';
        words[idx].classList.add('ticker-enter');
        setTimeout(() => words[idx].classList.remove('ticker-enter'), 600);
      }, 400);
    }, 2200);
  }

  return { render, init };
})();
