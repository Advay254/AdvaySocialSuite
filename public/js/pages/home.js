const HomePage = (() => {

  // Bento column spans by number of featured tools (12 column grid on wide screens).
  const SPANS = { 1: [12], 2: [6, 6], 3: [4, 4, 4], 4: [6, 6, 6, 6], 5: [6, 3, 3, 6, 6], 6: [6, 3, 3, 4, 4, 4] };

  function render() {
    return `
      <section class="hero">
        <div class="container">
          <div class="hero__inner" id="hero" aria-busy="true">
            <div class="skeleton" style="height:30px;width:220px;border-radius:999px"></div>
            <div class="skeleton" style="height:64px;width:70%"></div>
            <div class="skeleton" style="height:20px;width:45%"></div>
            <div class="skeleton" style="height:20px;width:85%"></div>
          </div>
        </div>
      </section>

      <section class="section--tight" id="home-stats" hidden></section>

      <section class="section" id="home-tools">
        <div class="container">
          <div class="grid grid--3" aria-hidden="true">${UI.skeletonCards(3)}</div>
        </div>
      </section>

      <section class="section section--band" id="home-templates" hidden></section>
      <section class="section" id="home-services" hidden></section>
      <section class="section section--band" id="home-philosophy" hidden></section>
      <section class="section" id="home-cta" hidden></section>
    `;
  }

  function sectionHead(kicker, heading, sub) {
    return `<div class="section-head reveal">
      ${kicker ? `<span class="kicker">${UI.text(kicker)}</span>` : ''}
      <h2 class="h2">${UI.text(heading)}</h2>
      ${sub ? `<p class="lead">${UI.text(sub)}</p>` : ''}
    </div>`;
  }

  function renderHero(profile, settings) {
    const el = document.getElementById('hero');
    if (!el) return;
    const name = UI.text(profile.name || settings.site_name || '');
    const role = UI.text(profile.tagline || '');
    const value = UI.text(settings.home_subheadline || '');
    const loc = UI.text(profile.location || '');
    const avail = UI.text(settings.home_availability_label || '');
    const primaryLabel = UI.text(settings.home_cta_primary_label || '');
    const secondaryLabel = UI.text(settings.home_cta_secondary_label || '');
    const socials = UI.socialLinks(profile);

    el.removeAttribute('aria-busy');
    el.innerHTML = `
      ${avail ? `<span class="pill reveal"><span class="dot" aria-hidden="true"></span><span>${avail}${loc ? ` &middot; ${loc}` : ''}</span></span>` : ''}
      <div class="reveal">
        <h1 class="hero__name">${name}</h1>
        ${role ? `<p class="hero__role">${role}</p>` : ''}
      </div>
      ${value ? `<p class="hero__value reveal">${value}</p>` : ''}
      <div class="hero__actions reveal">
        ${primaryLabel ? `<a href="#/tools" class="btn btn--primary">${primaryLabel} ${UI.icon('arrow-right')}</a>` : ''}
        ${secondaryLabel ? `<a href="#/collab" class="btn btn--secondary">${secondaryLabel}</a>` : ''}
      </div>
      ${socials ? `<div class="socials reveal">${socials}</div>` : ''}`;
    UI.reveal(el);
  }

  function renderStats(settings, tools, repos, templates) {
    const el = document.getElementById('home-stats');
    if (!el) return;
    const items = [];
    if (tools.length) items.push([tools.length, settings.home_stat_tools_label]);
    if (repos.length) items.push([repos.length, settings.home_stat_repos_label]);
    if (templates.length && settings.templates_visible !== '0') items.push([templates.length, settings.templates_label]);
    const shown = items.filter(i => i[1]);
    if (!shown.length) return;
    el.hidden = false;
    el.innerHTML = `<div class="container"><div class="stats reveal">${shown.map(([n, l]) => `<div class="stat"><div class="stat__num">${n}</div><div class="stat__label">${UI.text(l)}</div></div>`).join('')}</div></div>`;
    UI.reveal(el);
  }

  function toolCard(t, span, i) {
    const url = UI.safeUrl(t.url);
    const inner = `
      <div class="tile__top">
        <span class="tile__icon">${UI.categoryIcon(t.category)}</span>
        <span class="status" title="Live"><span class="dot" aria-hidden="true"></span><span class="sr-only">Live</span></span>
      </div>
      <h3 class="tile__title">${UI.text(t.title)}</h3>
      <p class="tile__desc">${UI.text(t.description || '')}</p>
      <div class="tile__foot">
        <span class="mono">${UI.text(url ? UI.hostOf(url) : (t.category || ''))}</span>
        ${url ? `<span class="tile__arrow">${UI.icon('arrow-up-right')}</span>` : ''}
      </div>`;
    const cls = `card tile reveal span-${span}`;
    const style = `transition-delay:${Math.min(i, 5) * 40}ms`;
    return url
      ? `<a href="${UI.esc(url)}" target="_blank" rel="noopener noreferrer" class="${cls}" style="${style}">${inner}</a>`
      : `<div class="${cls}" style="${style}">${inner}</div>`;
  }

  function renderTools(settings, tools) {
    const el = document.getElementById('home-tools');
    if (!el) return;
    if (!tools.length) { el.hidden = true; return; }
    const shown = tools.slice(0, 6);
    const spans = SPANS[shown.length];
    el.innerHTML = `<div class="container">
      ${sectionHead(settings.home_tools_kicker, settings.home_tools_heading, settings.tools_subtitle)}
      <div class="bento">${shown.map((t, i) => toolCard(t, spans[i], i)).join('')}</div>
      ${settings.home_tools_more_label ? `<div class="more-row reveal"><a href="#/tools" class="btn btn--secondary">${UI.text(settings.home_tools_more_label)} ${UI.icon('arrow-right')}</a></div>` : ''}
    </div>`;
    UI.reveal(el);
  }

  function renderTemplates(settings, templates) {
    const el = document.getElementById('home-templates');
    if (!el) return;
    if (settings.templates_visible === '0' || !templates.length) { el.hidden = true; return; }
    el.hidden = false;
    const importLabel = UI.text(settings.template_import_label || '');
    el.innerHTML = `<div class="container">
      ${sectionHead(settings.home_templates_kicker, settings.templates_label, settings.templates_subtitle)}
      <div class="grid grid--2">
        ${templates.slice(0, 4).map((t, i) => {
          const dl = UI.safeUrl(t.json_url);
          return `<div class="card tile reveal" style="transition-delay:${i * 40}ms">
            <div class="tile__top"><span class="tile__icon">${UI.icon('workflow')}</span></div>
            <h3 class="tile__title">${UI.text(t.title)}</h3>
            <p class="tile__desc">${UI.text(t.description || '')}</p>
            ${dl && importLabel ? `<div class="tile__foot"><a class="btn btn--secondary btn--sm" href="${UI.esc(dl)}" target="_blank" rel="noopener noreferrer">${UI.icon('download')} ${importLabel}</a></div>` : ''}
          </div>`;
        }).join('')}
      </div>
      ${settings.home_templates_more_label ? `<div class="more-row reveal"><a href="#/templates" class="btn btn--secondary">${UI.text(settings.home_templates_more_label)} ${UI.icon('arrow-right')}</a></div>` : ''}
    </div>`;
    UI.reveal(el);
  }

  function renderServices(settings) {
    const el = document.getElementById('home-services');
    if (!el) return;
    const items = UI.parseJSON(settings.specializations, []).filter(s => s && s.title);
    if (!items.length) { el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML = `<div class="container">
      ${sectionHead(settings.home_services_kicker, settings.home_services_heading, settings.home_services_subtitle)}
      <div class="grid grid--2">
        ${items.slice(0, 6).map((s, i) => `<div class="card service reveal" style="transition-delay:${i * 40}ms">
          <span class="tile__icon">${UI.serviceIcon(i)}</span>
          <h3 class="tile__title">${UI.text(s.title)}</h3>
          <p>${UI.text(s.desc || '')}</p>
        </div>`).join('')}
      </div>
    </div>`;
    UI.reveal(el);
  }

  function renderPhilosophy(settings) {
    const el = document.getElementById('home-philosophy');
    if (!el) return;
    const lines = String(settings.philosophy_quote || '').split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) { el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML = `<div class="container"><figure class="quote reveal" style="margin:0">
      ${settings.home_philosophy_kicker ? `<span class="kicker">${UI.text(settings.home_philosophy_kicker)}</span>` : ''}
      <blockquote class="quote__text" style="margin:0">${lines.map(l => `<span>${UI.text(l)}</span>`).join('')}</blockquote>
      ${settings.philosophy_sub ? `<figcaption class="quote__sub">${UI.text(settings.philosophy_sub)}</figcaption>` : ''}
    </figure></div>`;
    UI.reveal(el);
  }

  function renderCta(settings) {
    const el = document.getElementById('home-cta');
    if (!el) return;
    if (!settings.home_cta_heading || !settings.home_cta_button) { el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML = `<div class="container"><div class="cta-band reveal">
      <h2 class="h2">${UI.text(settings.home_cta_heading)}</h2>
      ${settings.home_cta_text ? `<p>${UI.text(settings.home_cta_text)}</p>` : ''}
      <a href="#/collab" class="btn btn--primary">${UI.text(settings.home_cta_button)} ${UI.icon('arrow-right')}</a>
    </div></div>`;
    UI.reveal(el);
  }

  async function init() {
    try {
      const [{ settings, profile }, tools, repos, templates] = await Promise.all([
        App.shared(),
        App.api('/api/tools').catch(() => []),
        App.api('/api/repos').catch(() => []),
        App.api('/api/templates').catch(() => []),
      ]);
      renderHero(profile, settings);
      renderStats(settings, tools, repos, templates);
      renderTools(settings, tools);
      renderTemplates(settings, templates);
      renderServices(settings);
      renderPhilosophy(settings);
      renderCta(settings);
    } catch (e) {
      console.error('Home init error:', e);
      const hero = document.getElementById('hero');
      if (hero) hero.innerHTML = UI.errorState('We could not load this page.', 'Check your connection and try again.', 'Try again');
    }
  }

  return { render, init };
})();
