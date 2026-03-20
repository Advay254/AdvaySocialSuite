const AboutPage = (() => {

  function render() {
    return `
      <!-- Page Hero -->
      <div class="page-hero">
        <div class="hero-grid"></div>
        <div class="max-w-7xl mx-auto container-pad relative z-10">
          <div class="section-label justify-center">The Human Behind the Code</div>
          <h1 class="page-hero-title gradient-text-2">ABOUT ADVAY</h1>
          <p class="text-slate-400 max-w-xl mx-auto">Automation engineer, open source builder, and digital product creator from Kenya.</p>
        </div>
      </div>

      <div class="neon-line"></div>

      <!-- Main content -->
      <div class="max-w-7xl mx-auto container-pad py-12">
        <div id="about-content">
          <!-- Skeleton -->
          <div class="animate-pulse space-y-6">
            <div class="glass-card p-8"><div class="h-6 bg-white/5 rounded w-1/3 mb-4"></div><div class="h-4 bg-white/5 rounded w-full mb-2"></div><div class="h-4 bg-white/5 rounded w-3/4"></div></div>
          </div>
        </div>
      </div>
    `;
  }

  async function init() {
    try {
      const profile = await App.api('/api/profile');
      const skills = safeJSON(profile.skills, []);
      const principles = safeJSON(profile.principles, []);
      renderProfile(profile, skills, principles);
    } catch {
      document.getElementById('about-content').innerHTML =
        `<p class="text-slate-500 text-center py-12">Could not load profile data.</p>`;
    }
  }

  function safeJSON(val, fallback) {
    try { return typeof val === 'string' ? JSON.parse(val) : (val || fallback); }
    catch { return fallback; }
  }

  function renderProfile(p, skills, principles) {
    const container = document.getElementById('about-content');
    container.innerHTML = `
      <!-- Profile Card -->
      <div class="glass-card p-8 md:p-10 mb-8 relative overflow-hidden">
        <div class="absolute top-0 right-0 w-64 h-64 bg-violet/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none"></div>
        <div class="flex flex-col md:flex-row items-start gap-8 relative z-10">
          <!-- Avatar -->
          <div class="about-avatar-ring flex-shrink-0 mx-auto md:mx-0">
            ${p.avatar_url
              ? `<img src="${p.avatar_url}" class="w-full h-full rounded-full object-cover" alt="${p.name}">`
              : `<div class="about-avatar-inner">${(p.name || 'A').charAt(0).toUpperCase()}</div>`}
          </div>

          <!-- Info -->
          <div class="flex-1 text-center md:text-left">
            <h2 class="font-display text-white leading-none tracking-wide mb-1"
                style="font-size: clamp(2.5rem, 6vw, 4rem);">${p.name || 'Advay'}</h2>
            <p class="text-cyan font-mono text-sm mb-2">${p.tagline || 'Builder of Useful Things'}</p>
            <p class="text-slate-400 text-sm mb-4">
              <span class="inline-flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                ${p.location || 'Kenya'}
              </span>
            </p>
            <p class="text-slate-300 leading-relaxed max-w-2xl text-sm md:text-base mb-6">
              ${p.bio || 'Automation engineer and full-stack builder from Kenya.'}
            </p>

            <!-- Social links -->
            <div class="flex flex-wrap gap-3 justify-center md:justify-start">
              ${p.github_url ? `
              <a href="${p.github_url}" target="_blank" rel="noopener" class="btn-ghost text-xs">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.929.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
                GitHub
              </a>` : ''}
              ${p.linkedin_url ? `
              <a href="${p.linkedin_url}" target="_blank" rel="noopener" class="btn-ghost text-xs">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                LinkedIn
              </a>` : ''}
              ${p.bmc_url ? `
              <a href="${p.bmc_url}" target="_blank" rel="noopener" class="btn-ghost text-xs text-yellow-400 border-yellow-400/20 hover:border-yellow-400/40">
                ☕ Buy me coffee
              </a>` : ''}
            </div>
          </div>
        </div>
      </div>

      <!-- Two-column grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        <!-- What I do -->
        <div class="glass-card p-8">
          <div class="section-label">Specialization</div>
          <h3 class="font-heading font-700 text-white text-xl mb-6">What I Build</h3>
          <div class="space-y-4">
            ${[
              { icon: '⚙️', title: 'Workflow Engineering', desc: 'Advanced n8n implementations with custom logic, multi-agent architectures, and sophisticated automation flows.' },
              { icon: '🤖', title: 'Bot Development', desc: 'Functional, reliable bots with clean architecture — WhatsApp (Baileys), Telegram, and webhook-driven systems.' },
              { icon: '🌐', title: 'Web Tools', desc: 'Fast, mobile-first web apps with real usability — downloaders, shorteners, discovery platforms.' },
              { icon: '🔌', title: 'API Microservices', desc: 'High-performance, purpose-built services designed for automation pipelines and free-tier hosting.' },
            ].map(item => `
              <div class="flex gap-4 p-4 rounded-xl border border-white/5 bg-white/2 hover:border-cyan/15 transition-all">
                <span class="text-2xl flex-shrink-0 mt-0.5">${item.icon}</span>
                <div>
                  <h4 class="font-heading font-700 text-white text-sm mb-1">${item.title}</h4>
                  <p class="text-slate-400 text-xs leading-relaxed">${item.desc}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Right column: Principles + Skills -->
        <div class="space-y-6">

          <!-- Principles -->
          <div class="glass-card p-8">
            <div class="section-label">Core Principles</div>
            <h3 class="font-heading font-700 text-white text-xl mb-4">How I Work</h3>
            <div>
              ${principles.length
                ? principles.map(p => `<div class="principle-item">${p}</div>`).join('')
                : ['Build things that work','Keep them simple','Make them last','Zero unnecessary complexity','Free-tier first']
                    .map(p => `<div class="principle-item">${p}</div>`).join('')}
            </div>
          </div>

          <!-- Fun fact -->
          <div class="glass-card p-6 border-violet/20" style="background: rgba(139,92,246,0.04);">
            <div class="text-violet text-xs font-mono tracking-widest mb-3">// FUN_FACT</div>
            <p class="text-slate-300 text-sm leading-relaxed italic">
              "If I do it twice, I automate it. If it takes more than 20 seconds daily, I automate it aggressively."
            </p>
          </div>
        </div>
      </div>

      <!-- Skills -->
      ${skills.length ? `
      <div class="glass-card p-8">
        <div class="section-label">Skills & Stack</div>
        <h3 class="font-heading font-700 text-white text-xl mb-6">Technology Arsenal</h3>
        <div class="flex flex-wrap gap-2">
          ${skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
        </div>
      </div>` : ''}

      <!-- Footer -->
      <footer class="site-footer mt-8">
        <div class="text-sm text-slate-500">
          Built by <a href="#/about" class="text-cyan hover:underline">Advay</a> · Kenya
          <span class="mx-2 text-white/10">|</span>
          <a href="https://github.com/Advay254" target="_blank" class="hover:text-cyan transition-colors">GitHub</a>
        </div>
      </footer>
    `;
  }

  return { render, init };
})();
