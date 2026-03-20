const HomePage = (() => {

  function render() {
    return `
      <section class="hero-section relative">
        <div class="hero-grid"></div>
        <div class="max-w-6xl mx-auto container-pad relative z-10">

          <div class="flex justify-center mb-10">
            <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/3 border border-white/8 text-xs font-mono" style="color:var(--cyan);opacity:.8">
              <span class="w-2 h-2 rounded-full animate-pulse" style="background:var(--emerald)"></span>
              Available for collaboration · Kenya 🇰🇪
            </div>
          </div>

          <div class="text-center max-w-4xl mx-auto">
            <h1 id="hero-name" class="font-display leading-none tracking-wide mb-6"
                style="font-size:clamp(4rem,12vw,10rem);color:var(--cyan);text-shadow:0 0 60px color-mix(in srgb, var(--cyan) 40%, transparent);">
              ADVAY
            </h1>

            <!-- 3D Cylinder - fixed overflow -->
            <div class="cylinder-outer mb-8">
              <div class="text-cylinder-wrap">
                <div class="text-cylinder">
                  <div class="face">BUILD.</div>
                  <div class="face">AUTOMATE.</div>
                  <div class="face">DEPLOY.</div>
                  <div class="face">INTEGRATE.</div>
                  <div class="face">SCALE.</div>
                  <div class="face">OPTIMIZE.</div>
                  <div class="face">CREATE.</div>
                  <div class="face">SHIP.</div>
                </div>
              </div>
            </div>

            <p id="hero-sub" class="text-base md:text-lg leading-relaxed mb-10 max-w-2xl mx-auto" style="color:rgba(255,255,255,.5)">
              Automation engineer from Kenya. I ship practical web tools, bots, and systems that solve real problems — and keep solving them, indefinitely.
            </p>

            <div class="flex flex-wrap items-center justify-center gap-4">
              <a href="#/tools" class="btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                Explore Tools
              </a>
              <a href="#/collab" class="btn-secondary">Let's Collaborate <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
            </div>
          </div>

          <div class="flex justify-center mt-20">
            <div class="flex flex-col items-center gap-2 animate-bounce" style="color:rgba(255,255,255,.15)">
              <span class="text-xs font-mono tracking-widest">SCROLL</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
            </div>
          </div>
        </div>
      </section>

      <div class="neon-line"></div>

      <!-- Stats -->
      <section class="py-16">
        <div class="max-w-6xl mx-auto container-pad">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div class="stat-item"><div class="stat-number">5+</div><div class="stat-label">Live Tools</div></div>
            <div class="stat-item"><div class="stat-number">26</div><div class="stat-label">GitHub Repos</div></div>
            <div class="stat-item"><div class="stat-number">∞</div><div class="stat-label">Automations Built</div></div>
            <div class="stat-item"><div class="stat-number">0</div><div class="stat-label">Unnecessary Code</div></div>
          </div>
        </div>
      </section>

      <div class="divider"></div>

      <!-- Featured Tools -->
      <section class="py-16">
        <div class="max-w-6xl mx-auto container-pad">
          <div class="flex items-end justify-between mb-8">
            <div>
              <div class="section-label">Featured Work</div>
              <h2 class="font-heading font-800 text-white" style="font-size:clamp(1.6rem,4vw,2.4rem)">Live Products</h2>
            </div>
            <a href="#/tools" class="btn-ghost hidden sm:flex">View all <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
          </div>
          <div id="featured-tools" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            ${[1,2,3].map(()=>`<div class="glass-card p-5 animate-pulse"><div class="h-4 bg-white/5 rounded mb-3 w-2/3"></div><div class="h-3 bg-white/5 rounded w-full"></div></div>`).join('')}
          </div>
        </div>
      </section>

      <div class="divider"></div>

      <!-- n8n Templates -->
      <section class="py-16">
        <div class="max-w-6xl mx-auto container-pad">
          <div class="flex items-end justify-between mb-8">
            <div>
              <div class="section-label">Automation</div>
              <h2 class="font-heading font-800 text-white" style="font-size:clamp(1.6rem,4vw,2.4rem)">n8n Templates</h2>
            </div>
            <a href="#/templates" class="btn-ghost hidden sm:flex">View all <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
          </div>
          <div id="featured-templates" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="glass-card p-5 col-span-full text-center py-10" style="color:rgba(255,255,255,.3)">
              <div style="font-size:2rem;margin-bottom:8px;">⚙️</div>
              <p class="text-sm">No templates yet — add them via the admin dashboard.</p>
            </div>
          </div>
        </div>
      </section>

      <div class="divider"></div>

      <!-- Philosophy -->
      <section class="py-16">
        <div class="max-w-6xl mx-auto container-pad">
          <div class="glass-card p-8 md:p-12 text-center relative overflow-hidden">
            <div class="absolute inset-0 pointer-events-none" style="background:radial-gradient(ellipse at 50% 50%, color-mix(in srgb, var(--cyan) 4%, transparent) 0%, transparent 70%)"></div>
            <div class="relative z-10 max-w-3xl mx-auto">
              <div class="section-label justify-center">Philosophy</div>
              <blockquote class="font-display text-white mt-4 leading-tight" style="font-size:clamp(1.8rem,4vw,3rem)">
                "BUILD THINGS THAT WORK.<br>
                <span class="gradient-text">KEEP THEM SIMPLE.</span><br>
                MAKE THEM LAST."
              </blockquote>
              <p class="mt-6 text-sm" style="color:rgba(255,255,255,.4)">If something runs once, it runs forever — and if it runs daily, it runs itself.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- BMC -->
      <section class="py-12">
        <div class="max-w-6xl mx-auto container-pad">
          <div class="glass-card p-8 text-center" style="border-color:rgba(255,213,79,.1);background:rgba(255,213,79,.02)">
            <div class="text-3xl mb-3">☕</div>
            <h3 class="font-heading font-700 text-white text-xl mb-2">If my tools helped you</h3>
            <p class="text-sm mb-6" style="color:rgba(255,255,255,.4)">Consider buying me a coffee. Every cup fuels the next build.</p>
            <a href="https://www.buymeacoffee.com/advay254" target="_blank" rel="noopener"
               class="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all"
               style="background:rgba(255,213,79,.12);border:1px solid rgba(255,213,79,.3);color:#ffd54f;">
              Buy me a coffee →
            </a>
          </div>
        </div>
      </section>

      <footer class="site-footer">
        <div class="max-w-6xl mx-auto container-pad text-sm" style="color:rgba(255,255,255,.3)">
          Built with ⚡ by <a href="https://github.com/Advay254" target="_blank" style="color:var(--cyan)" class="hover:underline">Advay</a> · Kenya
          <span class="mx-2" style="color:rgba(255,255,255,.1)">|</span>
          <a href="https://www.buymeacoffee.com/advay254" target="_blank" class="hover:text-yellow-400 transition-colors">☕ BMC</a>
        </div>
      </footer>
    `;
  }

  async function init() {
    // Load profile for dynamic hero content
    try {
      const profile = await App.api('/api/profile');
      if (profile.name) {
        const el = document.getElementById('hero-name');
        if (el) el.textContent = profile.name.toUpperCase();
      }
    } catch {}

    // Load settings for subheadline
    try {
      const s = await App.api('/api/settings');
      if (s.home_subheadline) {
        const el = document.getElementById('hero-sub');
        if (el) el.textContent = s.home_subheadline;
      }
    } catch {}

    // Load featured tools
    try {
      const tools = await App.api('/api/tools');
      const container = document.getElementById('featured-tools');
      if (!container) return;
      const featured = tools.slice(0, 3);
      if (!featured.length) { container.innerHTML = `<p class="text-slate-500 col-span-3 text-center py-8">No tools yet.</p>`; return; }
      container.innerHTML = featured.map(t => `
        <a href="${t.url||'#'}" target="_blank" rel="noopener" class="glass-card tool-card p-5 block group">
          <div class="flex items-start gap-3 mb-3">
            <div class="tool-icon">${t.icon||'🔧'}</div>
            <div class="flex-1 min-w-0">
              <h3 class="font-heading font-700 text-white text-sm group-hover:text-[var(--cyan)] transition-colors truncate mb-1">${t.title}</h3>
              <span class="status-active">Live</span>
            </div>
          </div>
          <p class="text-xs leading-relaxed" style="color:rgba(255,255,255,.4)">${t.description}</p>
          <div class="mt-3 flex items-center gap-1 text-xs font-mono transition-colors" style="color:color-mix(in srgb,var(--cyan) 50%,transparent)">
            Visit <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M7 7h10v10"/></svg>
          </div>
        </a>`).join('');
    } catch {}

    // Load featured templates
    try {
      const templates = await App.api('/api/templates');
      const container = document.getElementById('featured-templates');
      if (!container || !templates.length) return;
      container.innerHTML = templates.slice(0,4).map(t => `
        <div class="glass-card p-5">
          <div class="flex items-start justify-between gap-3 mb-2">
            <h3 class="font-heading font-700 text-white text-sm">${t.title}</h3>
            ${t.json_url ? `<a href="${t.json_url}" target="_blank" class="btn-ghost text-xs flex-shrink-0" style="padding:4px 10px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              JSON
            </a>` : ''}
          </div>
          <p class="text-xs leading-relaxed" style="color:rgba(255,255,255,.4)">${t.description||''}</p>
        </div>`).join('');
    } catch {}
  }

  return { render, init };
})();
