const HomePage = (() => {

  function render() {
    return `
      <section class="lp-hero" id="hero">
        <div class="lp-orb lp-orb-1"></div>
        <div class="lp-orb lp-orb-2"></div>
        <div class="lp-orb lp-orb-3"></div>
        <div class="lp-shape lp-shape-torus" aria-hidden="true"></div>
        <div class="lp-shape lp-shape-ico" aria-hidden="true"></div>
        <div class="lp-shape lp-shape-oct" aria-hidden="true"></div>
        <div class="lp-shape lp-shape-dot" aria-hidden="true"></div>

        <div class="max-w-6xl mx-auto container-pad relative z-10 w-full">
          <div class="lp-hero-grid">

            <!-- LEFT -->
            <div class="lp-hero-left">
              <div id="lp-status-pill" class="lp-pill hidden">
                <span class="lp-pill-dot"></span>
                <span id="lp-status-text">Available for collaboration</span>
              </div>
              <h1 class="lp-h1"><span id="lp-name">—</span></h1>
              <p id="lp-tagline" class="lp-tagline"></p>
              <p id="lp-sub" class="lp-sub"></p>

              <div class="lp-ctas">
                <a href="#/tools" class="lp-btn lp-btn-primary magnetic">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  Explore Tools
                </a>
                <a href="#/collab" class="lp-btn lp-btn-ghost">Let's Collaborate <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
                <a id="lp-bmc-btn" href="https://www.buymeacoffee.com/advay254" target="_blank" rel="noopener" class="lp-btn lp-btn-warn">☕</a>
              </div>

              <!-- Social icons — only renders set links -->
              <div id="lp-socials" class="lp-social-row"></div>

              <!-- Meta stat cards -->
              <div class="lp-meta-grid">
                <div class="lp-meta-card">
                  <div class="lp-meta-icon">⚡</div>
                  <div><div class="lp-meta-num" id="stat-tools">—</div><div class="lp-meta-lbl">Live Tools</div></div>
                </div>
                <div class="lp-meta-card">
                  <div class="lp-meta-icon">🗂️</div>
                  <div><div class="lp-meta-num" data-stat="repos">—</div><div class="lp-meta-lbl">Repos</div></div>
                </div>
                <div class="lp-meta-card">
                  <div class="lp-meta-icon">⚙️</div>
                  <div><div class="lp-meta-num" id="stat-automations">—</div><div class="lp-meta-lbl" id="stat-automations-lbl">Templates</div></div>
                </div>
              </div>
            </div>

            <!-- RIGHT: Profile card -->
            <div class="lp-hero-right">
              <div class="lp-profile-card" id="lp-profile-card">
                <div class="lp-shimmer" aria-hidden="true"></div>
                <div class="lp-profile-top">
                  <div>
                    <div class="lp-profile-name" id="lp-pname">—</div>
                    <div class="lp-profile-role" id="lp-prole">Builder</div>
                    <div id="lp-ploc" class="lp-profile-loc hidden">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      <span id="lp-ploc-text"></span>
                    </div>
                  </div>
                </div>

                <div class="lp-chips" id="lp-chips"></div>

                <div class="lp-stats">
                  <div class="lp-stat"><div class="lp-stat-num" id="stat2-tools">—</div><div class="lp-stat-lbl">Tools</div></div>
                  <div class="lp-stat"><div class="lp-stat-num" data-stat="repos">—</div><div class="lp-stat-lbl">Repos</div></div>
                  <div class="lp-stat"><div class="lp-stat-num" data-stat="exp">—</div><div class="lp-stat-lbl">Years</div></div>
                </div>

                <div class="lp-timeline" id="lp-timeline">
                  <!-- populated from settings -->
                </div>

                <div class="lp-profile-actions">
                  <a href="#/collab" class="lp-btn lp-btn-primary" style="flex:1;justify-content:center;font-size:13px;padding:10px 14px;">Hire me</a>
                  <a href="#/repos" class="lp-btn lp-btn-ghost" style="flex:1;justify-content:center;font-size:13px;padding:10px 14px;">View repos</a>
                </div>

                <div class="lp-hint">
                  <span class="lp-hint-dot"></span>
                  <span class="lp-hint-text">Open to remote work & collaborations</span>
                </div>
              </div>

              <div class="lp-scroll-hint">
                <div class="lp-mouse"><div class="lp-wheel"></div></div>
                <span>Scroll</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="neon-line"></div>

      <!-- Featured Tools -->
      <section class="lp-section">
        <div class="max-w-6xl mx-auto container-pad">
          <div class="lp-section-head">
            <div class="lp-kicker"><i>⚡</i><span>Live Products</span></div>
            <h2 class="lp-h2">Featured Tools</h2>
            <p class="lp-lead">Fully deployed, free-to-use tools. Click any card to visit.</p>
          </div>
          <div id="lp-tools" class="lp-bento">
            ${[1,2,3].map(() => `<div class="lp-bento-card animate-pulse" style="grid-column:span 4;"><div style="height:16px;background:rgba(255,255,255,.05);border-radius:6px;width:60%;margin-bottom:10px;"></div><div style="height:12px;background:rgba(255,255,255,.04);border-radius:4px;width:100%;"></div></div>`).join('')}
          </div>
          <div class="lp-more-row"><a href="#/tools" class="lp-btn lp-btn-ghost">View all tools →</a></div>
        </div>
      </section>

      <div class="divider"></div>

      <!-- Templates section — label and visibility from settings -->
      <section class="lp-section" id="lp-templates-section" style="display:none;">
        <div class="max-w-6xl mx-auto container-pad">
          <div class="lp-section-head">
            <div class="lp-kicker"><i>⚙️</i><span id="lp-tmpl-label">Templates</span></div>
            <h2 class="lp-h2" id="lp-tmpl-h2">Templates</h2>
            <p class="lp-lead">Click to download and import into your instance.</p>
          </div>
          <div id="lp-templates" class="lp-bento"></div>
          <div class="lp-more-row"><a href="#/templates" class="lp-btn lp-btn-ghost">View all →</a></div>
        </div>
      </section>

      <div class="divider" id="lp-templates-divider" style="display:none;"></div>

      <!-- Philosophy — fully from settings -->
      <section class="lp-section">
        <div class="max-w-6xl mx-auto container-pad">
          <div class="lp-philosophy">
            <div class="lp-philosophy-glow" aria-hidden="true"></div>
            <div class="lp-kicker" style="justify-content:center;margin-bottom:16px;"><i>💡</i><span>Philosophy</span></div>
            <blockquote class="lp-quote" id="lp-quote">—</blockquote>
            <p class="lp-quote-sub" id="lp-quote-sub">—</p>
          </div>
        </div>
      </section>

      <!-- Footer — BMC + GitHub hardcoded to Advay -->
      <footer class="lp-footer">
        <div class="max-w-6xl mx-auto container-pad lp-footer-inner">
          <div class="lp-footer-left">
            <span class="lp-footer-brand" id="lp-footer-brand">AdvaySocialSuite</span>
            <span class="lp-footer-dot">·</span>
            <a href="https://github.com/Advay254" target="_blank" rel="noopener" class="lp-footer-link">GitHub</a>
          </div>
          <a href="https://www.buymeacoffee.com/advay254" target="_blank" rel="noopener" class="lp-footer-link" style="color:rgba(255,213,79,.6);">☕ Buy me a coffee</a>
        </div>
      </footer>
    `;
  }

  function initMagnetic() {
    document.querySelectorAll('.magnetic').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        btn.style.transform = `translate(${(e.clientX - r.left - r.width/2) * 0.18}px, ${(e.clientY - r.top - r.height/2) * 0.18}px)`;
      });
      btn.addEventListener('mouseleave', () => btn.style.transform = '');
    });
  }

  function initCardTilt() {
    const card = document.getElementById('lp-profile-card');
    if (!card) return;
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => card.style.transform = 'perspective(900px) rotateX(0) rotateY(0)');
  }

  function typewriteName(name) {
    const el = document.getElementById('lp-name');
    if (!el) return;
    el.textContent = '';
    const cursor = document.createElement('span');
    cursor.className = 'lp-cursor'; cursor.textContent = '|';
    el.appendChild(cursor);
    let i = 0;
    const iv = setInterval(() => {
      if (i < name.length) { el.insertBefore(document.createTextNode(name[i]), cursor); i++; }
      else { clearInterval(iv); setTimeout(() => cursor.style.display = 'none', 2000); }
    }, 80);
  }

  const SOCIAL_DEFS = [
    { key:'github_url',   label:'GitHub',   path:'<path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.929.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>' },
    { key:'linkedin_url', label:'LinkedIn',  path:'<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>' },
    { key:'twitter_url',  label:'X',        path:'<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>' },
    { key:'youtube_url',  label:'YouTube',  path:'<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>' },
    { key:'discord_url',  label:'Discord',  path:'<path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.11 18.1.126 18.11a19.904 19.904 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>' },
    { key:'tiktok_url',   label:'TikTok',   path:'<path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>' },
  ];

  async function init() {
    initCardTilt();
    initMagnetic();

    try {
      const [profile, settings, tools, templates] = await Promise.all([
        App.api('/api/profile'),
        App.api('/api/settings'),
        App.api('/api/tools'),
        App.api('/api/templates'),
      ]);

      // ── Profile data ──────────────────────────────────────────────
      const name = (profile.name || 'BUILDER').toUpperCase();
      typewriteName(name);
      const pname = document.getElementById('lp-pname');
      const prole = document.getElementById('lp-prole');
      if (pname) pname.textContent = profile.name || '—';
      if (prole && profile.tagline) prole.textContent = profile.tagline;

      const tagEl = document.getElementById('lp-tagline');
      if (tagEl && profile.tagline) tagEl.textContent = profile.tagline;

      // Location — only show if set
      const loc = (profile.location || '').trim();
      if (loc) {
        document.getElementById('lp-status-pill')?.classList.remove('hidden');
        const st = document.getElementById('lp-status-text');
        if (st) st.textContent = `Available · ${loc}`;
        const pl = document.getElementById('lp-ploc');
        const plt = document.getElementById('lp-ploc-text');
        if (pl && plt) { plt.textContent = loc; pl.classList.remove('hidden'); }
      }

      // BMC button from profile
      const bmcBtn = document.getElementById('lp-bmc-btn');
      if (bmcBtn && profile.bmc_url) bmcBtn.href = profile.bmc_url;

      // Avatar in nav
      const navWrap = document.getElementById('nav-avatar');
      const navInit = document.getElementById('nav-initial');
      if (navInit) navInit.textContent = (profile.name || 'A').charAt(0).toUpperCase();
      if (navWrap && profile.avatar_url && profile.avatar_url.trim()) {
        navWrap.innerHTML = `<img src="${profile.avatar_url}" class="nav-avatar-img" alt="${profile.name||''}" onerror="this.parentElement.innerHTML='<span class=nav-initial>${(profile.name||'A').charAt(0).toUpperCase()}</span>'">`;
      }

      // Skill chips (first 6)
      let skills = [];
      try { skills = typeof profile.skills === 'string' ? JSON.parse(profile.skills) : (profile.skills || []); } catch {}
      const chipsEl = document.getElementById('lp-chips');
      if (chipsEl && skills.length) chipsEl.innerHTML = skills.slice(0, 6).map(s => `<span class="lp-chip">${s}</span>`).join('');

      // Social icons — only show set ones
      const socRow = document.getElementById('lp-socials');
      if (socRow) {
        const icons = SOCIAL_DEFS.filter(s => profile[s.key] && profile[s.key].trim())
          .map(s => `<a href="${profile[s.key]}" target="_blank" rel="noopener" class="lp-soc" title="${s.label}"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">${s.path}</svg></a>`).join('');
        if (icons) socRow.innerHTML = icons;
      }

      // ── Settings data ─────────────────────────────────────────────
      const sub = document.getElementById('lp-sub');
      if (sub && settings.home_subheadline) sub.textContent = settings.home_subheadline;

      // Repo + years stats
      document.querySelectorAll('[data-stat="repos"]').forEach(el => { if (settings.repo_count) el.textContent = settings.repo_count; });
      document.querySelectorAll('[data-stat="exp"]').forEach(el => { if (settings.years_exp) el.textContent = settings.years_exp + '+'; });

      // Nav center name
      const navName = document.getElementById('nav-center-name');
      if (navName) navName.textContent = (profile.name || settings.site_name || 'ADVAY').toUpperCase();

      // Timeline/specialization bullets
      const timeline = document.getElementById('lp-timeline');
      if (timeline) {
        const colors = ['var(--cyan)', 'var(--violet)', 'var(--emerald)'];
        const items = [settings.timeline_1, settings.timeline_2, settings.timeline_3].filter(Boolean);
        timeline.innerHTML = items.map((txt, i) => `
          <div class="lp-tline-row">
            <span class="lp-tline-dot" style="background:${colors[i]};box-shadow:0 0 12px ${colors[i]}"></span>
            <span class="lp-tline-text">${txt}</span>
          </div>`).join('');
      }

      // Philosophy
      const quoteEl = document.getElementById('lp-quote');
      const quoteSub = document.getElementById('lp-quote-sub');
      if (quoteEl && settings.philosophy_quote) {
        quoteEl.innerHTML = settings.philosophy_quote.split('\n').map((line, i) => {
          if (i === 1) return `<span class="lp-quote-accent">${line}</span><br>`;
          return `${line}${i < settings.philosophy_quote.split('\n').length - 1 ? '<br>' : ''}`;
        }).join('');
      }
      if (quoteSub && settings.philosophy_sub) quoteSub.textContent = settings.philosophy_sub;

      // Footer brand
      const footBrand = document.getElementById('lp-footer-brand');
      if (footBrand && settings.site_name) footBrand.textContent = settings.site_name;

      // ── Tools ─────────────────────────────────────────────────────
      const statTools = document.getElementById('stat-tools');
      const stat2Tools = document.getElementById('stat2-tools');
      if (statTools) statTools.textContent = tools.length ? `${tools.length}+` : '—';
      if (stat2Tools) stat2Tools.textContent = tools.length || '—';

      const toolsCont = document.getElementById('lp-tools');
      if (toolsCont) {
        if (!tools.length) {
          toolsCont.innerHTML = `<div class="lp-bento-card" style="grid-column:span 12;text-align:center;padding:40px;color:rgba(255,255,255,.3);">No tools yet — add them via the admin dashboard.</div>`;
        } else {
          toolsCont.innerHTML = tools.slice(0, 6).map((t, i) => `
            <a href="${t.url || '#'}" target="_blank" rel="noopener"
               class="lp-bento-card${i === 0 ? ' lp-bento-wide' : ''}" style="animation-delay:${i * 0.1}s">
              <div class="lp-shimmer" aria-hidden="true"></div>
              <div class="lp-bento-icon">${t.icon || '🔧'}</div>
              <div class="lp-bento-title">${t.title}</div>
              <div class="lp-bento-desc">${t.description || ''}</div>
              <div class="lp-bento-foot">
                <span class="lp-status-active">Live</span>
                <span class="lp-bento-arrow">→</span>
              </div>
            </a>`).join('');
        }
      }

      // ── Templates ─────────────────────────────────────────────────
      const tmplLabel = settings.templates_label || 'Templates';
      const tmplVisible = settings.templates_visible !== '0';

      // Automations stat = template count
      const statAuto = document.getElementById('stat-automations');
      const statAutoLbl = document.getElementById('stat-automations-lbl');
      if (statAuto) statAuto.textContent = templates.length || '0';
      if (statAutoLbl) statAutoLbl.textContent = tmplLabel;

      if (tmplVisible && templates.length) {
        const sec = document.getElementById('lp-templates-section');
        const div = document.getElementById('lp-templates-divider');
        const lbl1 = document.getElementById('lp-tmpl-label');
        const lbl2 = document.getElementById('lp-tmpl-h2');
        if (sec) sec.style.display = 'block';
        if (div) div.style.display = 'block';
        if (lbl1) lbl1.textContent = tmplLabel;
        if (lbl2) lbl2.textContent = tmplLabel;

        const cont = document.getElementById('lp-templates');
        if (cont) {
          cont.innerHTML = templates.slice(0, 4).map((t, i) => `
            <div class="lp-bento-card" style="animation-delay:${i * 0.1}s">
              <div class="lp-shimmer" aria-hidden="true"></div>
              <div class="lp-bento-icon">⚙️</div>
              <div class="lp-bento-title">${t.title}</div>
              <div class="lp-bento-desc">${t.description || ''}</div>
              <div class="lp-bento-foot">
                ${t.json_url ? `<a href="${t.json_url}" target="_blank" class="lp-btn lp-btn-ghost" style="font-size:11px;padding:5px 10px;" onclick="event.stopPropagation()">↓ JSON</a>` : ''}
              </div>
            </div>`).join('');
        }
      }

    } catch (e) { console.error('Home init error:', e); }
  }

  return { render, init };
})();
