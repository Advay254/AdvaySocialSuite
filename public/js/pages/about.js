const AboutPage = (() => {

  function render() {
    return `
      <div class="page-hero">
        <div class="hero-grid"></div>
        <div class="max-w-6xl mx-auto container-pad relative z-10">
          <div class="section-label justify-center">The Human Behind the Code</div>
          <h1 class="page-hero-title gradient-text-2">ABOUT</h1>
          <p id="about-subtitle" style="color:rgba(255,255,255,.4)" class="max-w-xl mx-auto text-sm">Loading...</p>
        </div>
      </div>

      <div class="neon-line"></div>

      <div class="max-w-6xl mx-auto container-pad py-12">
        <div id="about-content" class="animate-pulse space-y-6">
          <div class="glass-card p-8"><div class="h-6 bg-white/5 rounded w-1/3 mb-4"></div><div class="h-4 bg-white/5 rounded w-full mb-2"></div></div>
        </div>
      </div>
    `;
  }

  function safeJSON(val, fallback) {
    try { return typeof val === 'string' ? JSON.parse(val) : (val || fallback); }
    catch { return fallback; }
  }

  const SOCIAL_DEFS = [
    { key:'github_url',   label:'GitHub',   icon:'<path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.929.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>' },
    { key:'linkedin_url', label:'LinkedIn',  icon:'<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>' },
    { key:'twitter_url',  label:'X / Twitter', icon:'<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>' },
    { key:'youtube_url',  label:'YouTube',  icon:'<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>' },
    { key:'discord_url',  label:'Discord',  icon:'<path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.11 18.1.126 18.11a19.904 19.904 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>' },
    { key:'tiktok_url',   label:'TikTok',   icon:'<path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>' },
  ];

  async function init() {
    try {
      const [profile, settings] = await Promise.all([
        App.api('/api/profile'),
        App.api('/api/settings'),
      ]);

      const skills = safeJSON(profile.skills, []);
      const principles = safeJSON(profile.principles, []);
      const specializations = safeJSON(settings.specializations, []);
      const funfact = settings.funfact || '';

      // Page subtitle
      const subtitle = document.getElementById('about-subtitle');
      if (subtitle) subtitle.textContent = profile.bio ? profile.bio.split('.')[0] + '.' : '';

      // Social links — only those with values
      const socialLinks = SOCIAL_DEFS
        .filter(s => profile[s.key] && profile[s.key].trim())
        .map(s => `
          <a href="${profile[s.key]}" target="_blank" rel="noopener" class="social-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">${s.icon}</svg>
            ${s.label}
          </a>`).join('');

      // BMC link
      const bmcLink = profile.bmc_url ? `<a href="${profile.bmc_url}" target="_blank" rel="noopener" class="social-link" style="color:#ffd54f;border-color:rgba(255,213,79,.2);">☕ Buy me coffee</a>` : '';

      const container = document.getElementById('about-content');
      container.classList.remove('animate-pulse');
      container.innerHTML = `
        <!-- Profile card -->
        <div class="glass-card p-8 md:p-10 mb-8 relative overflow-hidden">
          <div class="absolute top-0 right-0 w-64 h-64 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" style="background:color-mix(in srgb,var(--violet) 5%,transparent)"></div>
          <div class="flex flex-col items-center text-center relative z-10">

            <!-- Avatar -->
            ${profile.avatar_url ? `
            <div class="about-avatar-ring mb-6">
              <img src="${profile.avatar_url}" class="w-full h-full rounded-full object-cover" alt="${profile.name || ''}">
            </div>` : `
            <div class="about-avatar-ring mb-6">
              <div class="about-avatar-inner">${(profile.name || 'A').charAt(0).toUpperCase()}</div>
            </div>`}

            <!-- Name, tagline, location -->
            <h2 class="font-display text-white leading-none tracking-wide mb-2" style="font-size:clamp(2.5rem,6vw,4rem);">${(profile.name || 'BUILDER').toUpperCase()}</h2>
            ${profile.tagline ? `<p class="font-mono text-sm mb-2" style="color:rgba(255,255,255,.5)">${profile.tagline}</p>` : ''}
            ${profile.location ? `
            <p class="flex items-center gap-1 text-xs mb-4" style="color:rgba(255,255,255,.3)">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              ${profile.location}
            </p>` : ''}

            <!-- Bio -->
            ${profile.bio ? `<p class="text-sm leading-relaxed max-w-2xl mb-6" style="color:rgba(255,255,255,.55)">${profile.bio}</p>` : ''}

            <!-- Social links — only shows set ones -->
            ${socialLinks || bmcLink ? `
            <div class="social-links justify-center">
              ${socialLinks}
              ${bmcLink}
            </div>` : ''}
          </div>
        </div>

        <!-- Two-column -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

          <!-- What I Build — from specializations settings -->
          ${specializations.length ? `
          <div class="glass-card p-8">
            <div class="section-label">Specialization</div>
            <h3 class="font-heading font-700 text-white text-xl mb-6">What I Build</h3>
            <div class="space-y-4">
              ${specializations.map(item => `
                <div class="flex gap-4 p-4 rounded-xl border transition-all" style="border-color:rgba(255,255,255,.05);background:rgba(255,255,255,.02);">
                  <span class="text-2xl flex-shrink-0 mt-0.5">${item.icon || '⚙️'}</span>
                  <div>
                    <h4 class="font-heading font-700 text-white text-sm mb-1">${item.title || ''}</h4>
                    <p class="text-xs leading-relaxed" style="color:rgba(255,255,255,.4)">${item.desc || ''}</p>
                  </div>
                </div>`).join('')}
            </div>
          </div>` : ''}

          <!-- Right column -->
          <div class="space-y-6">
            <!-- Principles -->
            ${principles.length ? `
            <div class="glass-card p-8">
              <div class="section-label">Core Principles</div>
              <h3 class="font-heading font-700 text-white text-xl mb-4">How I Work</h3>
              <div>
                ${principles.map(p => `<div class="principle-item">${p}</div>`).join('')}
              </div>
            </div>` : ''}

            <!-- Fun fact -->
            ${funfact ? `
            <div class="glass-card p-6" style="background:rgba(139,92,246,.04);border-color:rgba(139,92,246,.2);">
              <div class="text-xs font-mono mb-3" style="color:var(--violet)">&sol;&sol; FUN_FACT</div>
              <p class="text-sm leading-relaxed italic" style="color:rgba(255,255,255,.55)">"${funfact}"</p>
            </div>` : ''}
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

        <footer class="site-footer mt-8">
          <div class="text-sm" style="color:rgba(255,255,255,.3)">
            <a href="https://github.com/Advay254" target="_blank" style="color:var(--cyan)" class="hover:underline">GitHub</a>
            <span class="mx-2" style="color:rgba(255,255,255,.1)">|</span>
            <a href="https://www.buymeacoffee.com/advay254" target="_blank" class="hover:text-yellow-400 transition-colors">☕ Buy me a coffee</a>
          </div>
        </footer>
      `;
    } catch (e) {
      console.error('About page error:', e);
      document.getElementById('about-content').innerHTML = `<p style="color:rgba(255,255,255,.3);text-align:center;padding:48px;">Could not load profile.</p>`;
    }
  }

  return { render, init };
})();
