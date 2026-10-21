const HomePage = (() => {

  function render() {
    return `
      <section class="hero">
        <div class="container">
          <div class="hero__grid" id="hero" aria-busy="true">
            <div class="hero__text">
              <div class="skeleton" style="height:14px;width:220px"></div>
              <div class="skeleton" style="height:150px;width:100%"></div>
              <div class="skeleton" style="height:22px;width:80%"></div>
            </div>
            <div class="skeleton" style="aspect-ratio:4/5;border-radius:32px"></div>
          </div>
        </div>
      </section>
      <section id="home-metrics" hidden></section>
      <section id="home-marquee" hidden></section>
      <section class="section" id="home-tools" hidden></section>
      <section class="section section--cream" id="home-services" hidden></section>
      <section class="section" id="home-about" hidden></section>
      <section class="section section--cream" id="home-templates" hidden></section>
      <section class="section section--container" id="home-philosophy" hidden></section>
      <section class="band-ink cta-band section" id="home-cta" hidden></section>
    `;
  }

  const STATUS = { active: ['status_live_label', 'live'], waking: ['status_waking_label', 'waking'], down: ['status_down_label', 'down'] };
  function statusTag(tool, settings) {
    const s = STATUS[String(tool.status || 'active').toLowerCase()] || STATUS.active;
    const label = settings[s[0]];
    return label ? `<span class="tag tag--${s[1]}">${UI.text(label)}</span>` : '';
  }
  function head(label, heading, sub) {
    return `<div class="section-head reveal">
      ${label ? `<span class="label label--accent">${UI.text(label)}</span>` : ''}
      <h2 class="headline">${UI.text(heading)}</h2>
      ${sub ? `<p class="lead">${UI.text(sub)}</p>` : ''}
    </div>`;
  }
  function show(el, html) { if (!el) return; el.hidden = !html; el.innerHTML = html || ''; if (html) UI.reveal(el); }

  // Portrait: the profile avatar when it loads, otherwise a designed monogram.
  function portraitFrame(profile, cls) {
    const initial = UI.text((profile.name || '').charAt(0).toUpperCase());
    return `<div class="frame ${cls || ''}" data-avatar="${UI.esc(UI.safeUrl(profile.avatar_url))}" data-alt="${UI.esc(UI.stripEmoji(profile.name || ''))}">
      <div class="monogram" aria-hidden="true"><span class="monogram__line"></span><span class="monogram__letter">${initial}</span></div>
    </div>`;
  }
  function loadAvatars(root) {
    root.querySelectorAll('.frame[data-avatar]').forEach(frame => {
      const src = frame.dataset.avatar;
      if (!src) return;
      const img = new Image();
      img.alt = frame.dataset.alt || '';
      img.onload = () => { frame.innerHTML = ''; frame.appendChild(img); };
      img.src = src;
    });
  }

  function renderHero(profile, settings) {
    const el = document.getElementById('hero');
    if (!el) return;
    const skills = UI.parseJSON(profile.skills, []).map(s => UI.stripEmoji(s)).filter(Boolean).slice(0, 3);
    const lines = String(settings.home_headline || profile.name || '').split(/\\n|\n/).map(l => UI.stripEmoji(l)).filter(Boolean);
    const headline = lines.map((l, i) => `<span style="display:block"${lines.length > 1 && i === lines.length - 1 ? ' class="accent-text"' : ''}>${UI.esc(l)}</span>`).join('');
    const socials = UI.socialLinks(profile);
    const cardTitle = UI.text(profile.tagline || '');
    const loc = UI.text(profile.location || '');
    const avail = UI.text(settings.home_availability_label || '');
    const card = cardTitle || loc || avail ? `<div class="portrait__card">
        ${cardTitle ? `<strong>${cardTitle}</strong>` : ''}
        ${loc ? `<span>${UI.icon('pin')} ${loc}</span>` : ''}
        ${avail ? `<span class="tag" style="margin-top:.4rem;width:fit-content">${avail}</span>` : ''}
      </div>` : '';

    el.removeAttribute('aria-busy');
    el.innerHTML = `
      <div class="hero__text">
        ${skills.length ? `<span class="label reveal">${skills.map(s => UI.esc(s)).join(' / ')}</span>` : ''}
        <h1 class="display reveal">${headline}</h1>
        ${settings.home_subheadline ? `<p class="hero__sub reveal">${UI.text(settings.home_subheadline)}</p>` : ''}
        <div class="hero__actions reveal">
          ${UI.btn({ label: settings.home_cta_primary_label, href: '#/tools', icon: 'arrow-right' })}
          ${UI.btn({ label: settings.home_cta_secondary_label, href: '#/collab', variant: 'secondary' })}
        </div>
        ${socials ? `<div class="socials reveal">${socials}</div>` : ''}
      </div>
      <div class="portrait reveal">${portraitFrame(profile)}${card}</div>`;
    loadAvatars(el);
    UI.reveal(el);
  }

  function renderMetrics(settings, tools, repos, templates) {
    const years = parseInt(settings.years_exp, 10);
    const items = [
      [tools.length, settings.home_stat_tools_label],
      [repos.length, settings.home_stat_repos_label],
      [settings.templates_visible !== '0' ? templates.length : 0, settings.templates_label],
      [Number.isFinite(years) ? years : 0, settings.home_stat_years_label],
    ].filter(([n, l]) => n > 0 && l);
    if (!items.length) return show(document.getElementById('home-metrics'), '');
    show(document.getElementById('home-metrics'), `<div class="container"><div class="metrics reveal" style="--n:${items.length}">
      ${items.map(([n, l]) => `<div class="metric"><div class="metric__num mono">${n}</div><div class="metric__label">${UI.text(l)}</div></div>`).join('')}
    </div></div>`);
  }

  function renderMarquee(profile) {
    const skills = UI.parseJSON(profile.skills, []).map(s => UI.stripEmoji(s)).filter(Boolean);
    if (!skills.length) return show(document.getElementById('home-marquee'), '');
    const reps = Math.max(1, Math.ceil(14 / skills.length));
    const group = Array.from({ length: reps }, () => skills.map(s => `<span class="marquee__item">${UI.esc(s)}</span>`).join('')).join('');
    show(document.getElementById('home-marquee'), `<div class="marquee" style="margin-top:clamp(2rem,5vw,4rem)">
      <div class="marquee__track"><div class="marquee__group">${group}</div><div class="marquee__group" aria-hidden="true">${group}</div></div>
    </div>`);
  }

  const TONES = ['cream', 'ink', 'container'];
  const SPANS = { 1: [12], 2: [7, 5], 3: [7, 5, 12] };

  function renderTools(settings, tools) {
    const el = document.getElementById('home-tools');
    if (!tools.length) return show(el, '');
    const top = tools.slice(0, 3), rest = tools.slice(3, 8);
    const spans = SPANS[top.length];
    const open = settings.tool_open_label;

    const tile = (t, i) => {
      const url = UI.safeUrl(t.url);
      const tone = TONES[i];
      const inner = `
        <div class="tile__top">
          <span class="icon-badge">${UI.iconFor(t.icon, Icons.categoryDefault(t.category))}</span>
          <span class="tags">${t.category ? `<span class="tag">${UI.text(t.category)}</span>` : ''}${statusTag(t, settings)}</span>
        </div>
        <div class="tile__main">
          <h3 class="tile__name">${UI.text(t.title)}</h3>
          ${t.description ? `<p class="tile__desc">${UI.text(t.description)}</p>` : ''}
        </div>
        <div class="tile__foot">
          <span class="tile__host">${UI.text(url ? UI.hostOf(url) : '')}</span>
          ${url && open ? UI.btn({ label: open, static: true, icon: 'arrow-up-right' }) : ''}
        </div>`;
      const cls = `tile tile--${tone} span-${spans[i]} reveal`;
      return url
        ? `<a class="${cls} card--interactive" href="${UI.esc(url)}" target="_blank" rel="noopener noreferrer" style="transition-delay:${i * 60}ms">${inner}</a>`
        : `<div class="${cls}" style="transition-delay:${i * 60}ms">${inner}</div>`;
    };

    const rows = rest.map(t => {
      const url = UI.safeUrl(t.url);
      const inner = `<div><div class="row-item__name">${UI.text(t.title)}</div></div>
        <div class="row-item__side">${t.category ? `<span class="tag">${UI.text(t.category)}</span>` : ''}${statusTag(t, settings)}${url ? UI.icon('arrow-up-right') : ''}</div>
        ${t.description ? `<div class="row-item__desc">${UI.text(t.description)}</div>` : ''}`;
      return url ? `<a class="row-item reveal" href="${UI.esc(url)}" target="_blank" rel="noopener noreferrer">${inner}</a>` : `<div class="row-item reveal">${inner}</div>`;
    }).join('');

    show(el, `<div class="container">
      ${head(settings.home_tools_kicker, settings.home_tools_heading, settings.tools_subtitle)}
      <div class="bento">${top.map(tile).join('')}</div>
      ${rows ? `<div class="rows">${rows}</div>` : ''}
      ${settings.home_tools_more_label ? `<div class="more-row reveal">${UI.btn({ label: settings.home_tools_more_label, href: '#/tools', variant: 'secondary', icon: 'arrow-right' })}</div>` : ''}
    </div>`);
  }

  function renderServices(settings) {
    const items = UI.parseJSON(settings.specializations, []).filter(s => s && s.title).slice(0, 4);
    if (!items.length) return show(document.getElementById('home-services'), '');
    show(document.getElementById('home-services'), `<div class="container">
      ${head(settings.home_services_kicker, settings.home_services_heading, settings.home_services_subtitle)}
      <div class="services">
        ${items.map((s, i) => `<div class="card card--page service reveal" style="transition-delay:${i * 60}ms">
          <span class="icon-badge">${UI.iconFor(s.icon, Icons.serviceDefault(i))}</span>
          <h3 class="title">${UI.text(s.title)}</h3>
          <p>${UI.text(s.desc || '')}</p>
        </div>`).join('')}
      </div>
    </div>`);
  }

  function renderAbout(profile, settings) {
    const principles = UI.parseJSON(profile.principles, []).map(p => UI.stripEmoji(p)).filter(Boolean).slice(0, 6);
    const bio = UI.stripEmoji(profile.bio || '');
    if (!bio && !principles.length) return show(document.getElementById('home-about'), '');
    show(document.getElementById('home-about'), `<div class="container"><div class="split">
      <div class="reveal">${portraitFrame(profile, 'frame--wide')}</div>
      <div class="split__text">
        ${settings.home_about_kicker ? `<span class="label label--accent reveal">${UI.text(settings.home_about_kicker)}</span>` : ''}
        ${profile.tagline ? `<h2 class="headline reveal">${UI.text(profile.tagline)}</h2>` : ''}
        ${bio ? `<p class="lead body-text reveal">${UI.esc(bio)}</p>` : ''}
        ${principles.length ? `<ul class="checklist reveal">${principles.map(p => `<li>${UI.icon('check')}<span>${UI.esc(p)}</span></li>`).join('')}</ul>` : ''}
        <div class="reveal">${UI.btn({ label: settings.home_about_button, href: '#/about', variant: 'secondary', icon: 'arrow-right' })}</div>
      </div>
    </div></div>`);
    loadAvatars(document.getElementById('home-about'));
  }

  function renderTemplates(settings, templates) {
    if (settings.templates_visible === '0' || !templates.length) return show(document.getElementById('home-templates'), '');
    show(document.getElementById('home-templates'), `<div class="container">
      ${head(settings.home_templates_kicker, settings.templates_label, settings.templates_subtitle)}
      <div class="rows">
        ${templates.slice(0, 5).map(t => {
          const dl = UI.safeUrl(t.json_url);
          const tags = UI.parseJSON(t.tags, []).slice(0, 4);
          return `<div class="row-item reveal">
            <div><div class="row-item__name">${UI.text(t.title)}</div></div>
            <div class="row-item__side">${tags.map(x => `<span class="tag">${UI.text(x)}</span>`).join('')}${dl && settings.template_import_label ? UI.btn({ label: settings.template_import_label, href: dl, external: true, variant: 'secondary', size: 'sm', icon: 'download' }) : ''}</div>
            ${t.description ? `<div class="row-item__desc">${UI.text(t.description)}</div>` : ''}
          </div>`;
        }).join('')}
      </div>
      ${settings.home_templates_more_label ? `<div class="more-row reveal">${UI.btn({ label: settings.home_templates_more_label, href: '#/templates', variant: 'secondary', icon: 'arrow-right' })}</div>` : ''}
    </div>`);
  }

  function renderPhilosophy(settings) {
    const lines = String(settings.philosophy_quote || '').split(/\\n|\n/).map(l => l.trim()).filter(Boolean);
    if (!lines.length) return show(document.getElementById('home-philosophy'), '');
    show(document.getElementById('home-philosophy'), `<div class="container"><figure class="quote reveal">
      <svg class="quote__mark" viewBox="0 0 48 48" fill="currentColor" aria-hidden="true" focusable="false"><path d="M6 28c0-9.4 5.6-16.4 14-19l1.8 3.6C16.6 14.6 14 18 13.6 22H20v18H6V28zm22 0c0-9.4 5.6-16.4 14-19l1.8 3.6C38.6 14.6 36 18 35.6 22H42v18H28V28z"/></svg>
      ${settings.home_philosophy_kicker ? `<span class="label label--accent" style="display:block;margin-bottom:1rem">${UI.text(settings.home_philosophy_kicker)}</span>` : ''}
      <blockquote class="quote__text headline">${lines.map(l => `<span>${UI.text(l)}</span>`).join('')}</blockquote>
      ${settings.philosophy_sub ? `<figcaption class="quote__sub">${UI.text(settings.philosophy_sub)}</figcaption>` : ''}
    </figure></div>`);
  }

  function renderCta(settings) {
    if (!settings.home_cta_heading || !settings.home_cta_button) return show(document.getElementById('home-cta'), '');
    show(document.getElementById('home-cta'), `
      <span class="shape shape--1"></span><span class="shape shape--2"></span><span class="shape shape--3"></span>
      <div class="container"><div class="cta-band__inner reveal">
        <h2 class="display">${UI.text(settings.home_cta_heading)}</h2>
        ${settings.home_cta_text ? `<p>${UI.text(settings.home_cta_text)}</p>` : ''}
        ${UI.btn({ label: settings.home_cta_button, href: '#/collab', variant: 'inverted', icon: 'arrow-right' })}
      </div></div>`);
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
      renderMetrics(settings, tools, repos, templates);
      renderMarquee(profile);
      renderTools(settings, tools);
      renderServices(settings);
      renderAbout(profile, settings);
      renderTemplates(settings, templates);
      renderPhilosophy(settings);
      renderCta(settings);
    } catch (e) {
      console.error('Home init error:', e);
      const hero = document.getElementById('hero');
      if (hero) hero.innerHTML = UI.errorState('This page did not load.', 'Check your connection, then try again.', 'Try again');
    }
  }

  return { render, init };
})();
