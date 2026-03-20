const HomePage = (() => {

  function render() {
    return `
      <!-- Hero Section -->
      <section class="hero-section relative">
        <div class="hero-grid"></div>
        <div class="max-w-7xl mx-auto container-pad relative z-10">

          <!-- Top badge -->
          <div class="flex justify-center mb-10">
            <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/3 border border-white/8 text-xs font-mono text-cyan/80">
              <span class="w-2 h-2 rounded-full bg-emerald animate-pulse"></span>
              Available for collaboration · Kenya 🇰🇪
            </div>
          </div>

          <!-- Hero text -->
          <div class="text-center max-w-5xl mx-auto">
            <h1 class="font-display text-white mb-4 leading-none tracking-wide"
                style="font-size: clamp(3.5rem, 10vw, 9rem);">
              <span id="hero-name" class="gradient-text">ADVAY</span>
            </h1>

            <!-- 3D rotating cylinder (from rave3d inspiration) -->
            <div class="text-cylinder-wrap mx-auto mb-8" style="max-width: 600px;">
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

            <p class="text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
              Automation engineer from Kenya. I ship practical web tools, bots, and systems
              that solve real problems — and keep solving them, indefinitely.
            </p>

            <div class="flex flex-wrap items-center justify-center gap-4">
              <a href="#/tools" class="btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                Explore Tools
              </a>
              <a href="#/collab" class="btn-secondary">
                Let's Collaborate
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
            </div>
          </div>

          <!-- Scroll indicator -->
          <div class="flex justify-center mt-16">
            <div class="scroll-indicator flex flex-col items-center gap-2 text-white/20 animate-bounce">
              <span class="text-xs font-mono tracking-widest">SCROLL</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
            </div>
          </div>
        </div>
      </section>

      <!-- Divider -->
      <div class="neon-line"></div>

      <!-- Stats Row -->
      <section class="py-16 bg-gradient-to-b from-transparent to-space-2/30">
        <div class="max-w-7xl mx-auto container-pad">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-8" id="stats-row">
            <div class="stat-item">
              <div class="stat-number">5+</div>
              <div class="stat-label">Live Tools</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">26</div>
              <div class="stat-label">GitHub Repos</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">∞</div>
              <div class="stat-label">Automations Built</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">0</div>
              <div class="stat-label">Unnecessary Code</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Featured Tools -->
      <section class="py-16">
        <div class="max-w-7xl mx-auto container-pad">
          <div class="flex items-end justify-between mb-10">
            <div>
              <div class="section-label">Featured Work</div>
              <h2 class="font-heading font-800 text-white" style="font-size: clamp(1.8rem,4vw,2.8rem);">
                Live Products
              </h2>
            </div>
            <a href="#/tools" class="btn-ghost hidden sm:flex">
              View all
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>

          <div id="featured-tools" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <!-- loaded dynamically -->
            <div class="glass-card p-6 animate-pulse"><div class="h-4 bg-white/5 rounded mb-3 w-3/4"></div><div class="h-3 bg-white/5 rounded w-full"></div></div>
            <div class="glass-card p-6 animate-pulse"><div class="h-4 bg-white/5 rounded mb-3 w-2/3"></div><div class="h-3 bg-white/5 rounded w-full"></div></div>
            <div class="glass-card p-6 animate-pulse"><div class="h-4 bg-white/5 rounded mb-3 w-3/4"></div><div class="h-3 bg-white/5 rounded w-full"></div></div>
          </div>
        </div>
      </section>

      <!-- Philosophy Section -->
      <section class="py-16">
        <div class="max-w-7xl mx-auto container-pad">
          <div class="glass-card p-8 md:p-12 relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br from-cyan/3 via-transparent to-violet/3 pointer-events-none"></div>
            <div class="relative z-10 text-center max-w-3xl mx-auto">
              <div class="section-label justify-center">Philosophy</div>
              <blockquote class="font-display text-white mt-4 leading-tight"
                          style="font-size: clamp(1.8rem, 4vw, 3.5rem);">
                "BUILD THINGS THAT WORK.<br>
                <span class="gradient-text">KEEP THEM SIMPLE.</span><br>
                MAKE THEM LAST."
              </blockquote>
              <p class="text-slate-400 mt-6 text-base">
                If something runs once, it runs forever — and if it runs daily, it runs itself.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Stack Preview -->
      <section class="py-16">
        <div class="max-w-7xl mx-auto container-pad">
          <div class="section-label">The Arsenal</div>
          <h2 class="font-heading font-800 text-white mb-8" style="font-size: clamp(1.8rem,4vw,2.8rem);">
            Core Tech Stack
          </h2>
          <div class="flex flex-wrap gap-3">
            ${['n8n','Node.js','Express','Supabase','PostgreSQL','Tailwind CSS','Vanilla JS','Baileys','Telegram Bots','MacroDroid','Cloudflare Workers','Render','GitHub Actions','REST APIs','Webhooks'].map(s =>
              `<span class="skill-tag">${s}</span>`
            ).join('')}
          </div>
        </div>
      </section>

      <!-- BMC CTA -->
      <section class="py-16">
        <div class="max-w-7xl mx-auto container-pad">
          <div class="text-center glass-card p-10 border-yellow-400/10"
               style="background: rgba(255,213,79,0.02);">
            <div class="text-3xl mb-3">☕</div>
            <h3 class="font-heading font-700 text-white text-xl mb-2">If my tools helped you</h3>
            <p class="text-slate-400 text-sm mb-6">Consider buying me a coffee. Every cup fuels the next build.</p>
            <a href="https://www.buymeacoffee.com/advay254" target="_blank" rel="noopener"
               class="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300"
               style="background: rgba(255,213,79,0.12); border: 1px solid rgba(255,213,79,0.3); color: #ffd54f;">
              <span>Buy me a coffee</span>
              <span>→</span>
            </a>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="site-footer">
        <div class="max-w-7xl mx-auto container-pad">
          <div class="text-sm text-slate-500">
            Built with ⚡ by <a href="#/about" class="text-cyan hover:underline">Advay</a> · Kenya
            <span class="mx-2 text-white/10">|</span>
            <a href="https://github.com/Advay254" target="_blank" class="hover:text-cyan transition-colors">GitHub</a>
            <span class="mx-2 text-white/10">|</span>
            <a href="https://www.buymeacoffee.com/advay254" target="_blank" class="hover:text-yellow-400 transition-colors">☕ BMC</a>
          </div>
        </div>
      </footer>
    `;
  }

  async function init() {
    // Load featured tools
    try {
      const tools = await App.api('/api/tools');
      const featured = tools.slice(0, 3);
      const container = document.getElementById('featured-tools');
      if (!container) return;

      if (!featured.length) {
        container.innerHTML = `<p class="text-slate-500 col-span-3 text-center py-8">No tools yet.</p>`;
        return;
      }

      container.innerHTML = featured.map(t => `
        <a href="${t.url}" target="_blank" rel="noopener" class="glass-card tool-card p-6 block group">
          <div class="flex items-start gap-4 mb-4">
            <div class="tool-icon">${t.icon || '🔧'}</div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h3 class="font-heading font-700 text-white text-base group-hover:text-cyan transition-colors truncate">${t.title}</h3>
              </div>
              <span class="status-active">Live</span>
            </div>
          </div>
          <p class="text-slate-400 text-sm leading-relaxed">${t.description}</p>
          <div class="mt-4 flex items-center gap-1 text-xs text-cyan/60 font-mono group-hover:text-cyan transition-colors">
            <span>Visit</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M7 7h10v10"/></svg>
          </div>
        </a>
      `).join('');
    } catch (e) {
      console.error('Failed to load tools:', e);
    }
  }

  return { render, init };
})();
