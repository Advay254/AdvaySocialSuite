const HomePage = (() => {

  const DEFAULT_ORDER = ['hero', 'metrics', 'tools', 'services', 'templates', 'about', 'faq', 'cta'];
  let rotorTimer = null;

  function render() {
    return `<section class="hero container" id="hero" aria-busy="true"><div class="skeleton" style="height:14px;width:40%"></div><div class="skeleton" style="height:130px"></div><div class="skeleton" style="height:18px;width:80%"></div></section>`;
  }

  function sectionsOrder(settings) {
    const raw = UI.parseJSON(settings.home_sections, []);
    const out = [], seen = new Set();
    (Array.isArray(raw) ? raw : []).forEach(s => { if (s && DEFAULT_ORDER.includes(s.id) && !seen.has(s.id)) { seen.add(s.id); out.push({ id: s.id, on: s.id === 'hero' || s.on !== false }); } });
    DEFAULT_ORDER.forEach(id => { if (!seen.has(id)) out.push({ id, on: true }); });
    return out.filter(s => s.on).map(s => s.id);
  }

  // The headline ends in a coloured full stop.
  function headlineHtml(raw, fallback) {
    const lines = String(raw || fallback || '').split(/\\n|\n/).map(l => UI.stripEmoji(l)).filter(Boolean);
    if (!lines.length) return '';
    const last = lines.length - 1;
    return lines.map((l, i) => {
      if (i !== last) return `<span class="ln">${UI.esc(l)}</span>`;
      if (/[?!]$/.test(l)) return `<span class="ln">${UI.esc(l)}</span>`;
      return `<span class="ln">${UI.esc(l.replace(/[.]+$/, ''))}<span class="dot">.</span></span>`;
    }).join('');
  }

  function hero(profile, settings) {
    const words = UI.parseJSON(settings.hero_words, []).map(w => UI.stripEmoji(w)).filter(Boolean);
    const avail = UI.text(settings.home_availability_label || '');
    const socials = UI.socialLinks(profile);
    const l = UI.resolveLink(settings.nav_cta_link);
    return `<section class="hero container" id="hero">
      <div class="hero__text">
        ${profile.tagline ? `<p class="eyebrow">( ${UI.text(profile.tagline)} )</p>` : ''}
        <h1 class="h-hero">${headlineHtml(settings.home_headline, profile.name)}</h1>
        ${settings.home_subheadline ? `<p class="lead">${UI.text(settings.home_subheadline)}</p>` : ''}
        ${words.length ? `<p class="rotor"><span class="sr-only">${words.map(w => UI.esc(w)).join(', ')}</span><span class="rotor__word" aria-hidden="true" data-words="${UI.esc(JSON.stringify(words))}">${UI.esc(words[0])}</span></p>` : ''}
        ${avail ? `<p class="avail"><i class="pulse" aria-hidden="true"></i>${avail}</p>` : ''}
        <div class="hero__cta">${Chrome.ctaHtml('cta-pill--inline')}</div>
        ${socials ? `<div class="socials">${socials}</div>` : ''}
      </div>
    </section>`;
  }

  function metrics(settings, tools, repos, templates) {
    const years = parseInt(settings.years_exp, 10);
    const items = [[tools.length, settings.home_stat_tools_label], [repos.length, settings.home_stat_repos_label], [settings.templates_visible !== '0' ? templates.length : 0, settings.templates_label], [Number.isFinite(years) ? years : 0, settings.home_stat_years_label]].filter(([n, l]) => n > 0 && l);
    if (!items.length) return '';
    return `<section class="container"><div class="stats reveal">${items.map(([n, l]) => `<div class="stat"><div class="num"><span data-count="${n}">0</span><em>+</em></div><div class="cap">${UI.text(l)}</div></div>`).join('')}</div></section>`;
  }

  function toolsSection(settings, tools) {
    if (!tools.length) return '';
    return `<section class="container block">
      ${UI.sectionHead(settings.home_tools_kicker, settings.home_tools_heading, '', settings.home_tools_more_label ? UI.btn({ label: settings.home_tools_more_label, href: '/tools', variant: 'secondary', icon: 'arrow-right' }) : '')}
      <div class="grid-cards grid-cards--home">${tools.slice(0, 3).map(t => ToolsPage.card(t, settings)).join('')}</div>
    </section>`;
  }

  function services(settings) {
    const items = UI.parseJSON(settings.specializations, []).filter(s => s && s.title).slice(0, 4);
    if (!items.length) return '';
    return `<section class="container block">${UI.sectionHead(settings.home_services_kicker, settings.home_services_heading, settings.home_services_subtitle)}${UI.featureCards(items, 'features--grid')}</section>`;
  }

  function templatesSection(settings, templates) {
    if (settings.templates_visible === '0' || !templates.length) return '';
    return `<section class="container block">
      ${UI.sectionHead(settings.home_templates_kicker, settings.templates_label, '', settings.home_templates_more_label ? UI.btn({ label: settings.home_templates_more_label, href: '/templates', variant: 'secondary', icon: 'arrow-right' }) : '')}
      <div class="rows reveal">${templates.slice(0, 3).map(t => {
        const dl = UI.safeUrl(t.json_url);
        return `<div class="row-item"><div class="row-item__main"><h3>${UI.text(t.title)}</h3>${t.description ? `<p>${UI.text(t.description)}</p>` : ''}</div>${dl ? UI.goButton(dl, `${settings.template_import_label || ''} ${UI.stripEmoji(t.title)}`.trim(), true, false) : ''}</div>`;
      }).join('')}</div>
    </section>`;
  }

  function aboutSection(profile, settings) {
    const bio = UI.stripEmoji(profile.bio || '');
    if (!bio && !profile.tagline) return '';
    return `<section class="container block"><div class="about-teaser reveal">
      ${AboutPage.portrait(profile, 'portrait--sm')}
      <div class="about-text">
        ${settings.home_about_kicker ? `<p class="eyebrow">( ${UI.text(settings.home_about_kicker)} )</p>` : ''}
        ${profile.tagline ? `<h2>${UI.stop(profile.tagline, 'dot--2')}</h2>` : ''}
        ${bio ? `<p class="clamp-3">${UI.text(bio)}</p>` : ''}
        ${settings.home_about_button ? UI.btn({ label: settings.home_about_button, href: '/about', variant: 'secondary', icon: 'arrow-right' }) : ''}
      </div></div></section>`;
  }

  function faqSection(settings) {
    const list = FaqPage.items(settings);
    if (!list.length) return '';
    return `<section class="container block container--narrow">
      ${UI.sectionHead('', settings.nav_faq, '')}
      <div class="qa-list reveal">${UI.accordion(list.slice(0, 3), false)}</div>
      <div class="more-row reveal">${UI.btn({ label: settings.nav_faq, href: '/faq', variant: 'secondary', icon: 'arrow-right' })}</div>
    </section>`;
  }

  function ctaSection(settings) {
    const l = UI.resolveLink(settings.nav_cta_link) || { href: '/collab', external: false };
    if (!settings.home_cta_heading || !settings.home_cta_button) return '';
    return `<section class="container block"><div class="cta-panel glow-card reveal">
      <h2>${UI.stop(settings.home_cta_heading, 'dot--2')}</h2>
      ${settings.home_cta_text ? `<p>${UI.text(settings.home_cta_text)}</p>` : ''}
      ${UI.btn({ label: settings.home_cta_button, href: l.href, external: l.external, icon: 'arrow-right' })}
    </div></section>`;
  }

  // One word at a time with a calm swap. Static for reduced motion.
  function startRotor(root) {
    clearInterval(rotorTimer);
    const el = root.querySelector('.rotor__word');
    if (!el || UI.reduced()) return;
    let words = []; try { words = JSON.parse(el.dataset.words); } catch (e) { return; }
    if (words.length < 2) return;
    let i = 0;
    rotorTimer = setInterval(() => {
      if (document.hidden || !document.body.contains(el)) { if (!document.body.contains(el)) clearInterval(rotorTimer); return; }
      el.classList.add('is-out');
      setTimeout(() => { i = (i + 1) % words.length; el.textContent = words[i]; el.classList.remove('is-out'); }, 260);
    }, 2400);
  }

  async function init() {
    const host = document.getElementById('hero');
    try {
      const [{ settings, profile }, tools, repos, templates] = await Promise.all([App.shared(), App.getTools().catch(() => []), App.getRepos().catch(() => []), App.getTemplates().catch(() => [])]);
      if (!host) return;
      const parts = {
        hero: () => hero(profile, settings), metrics: () => metrics(settings, tools, repos, templates), tools: () => toolsSection(settings, tools),
        services: () => services(settings), templates: () => templatesSection(settings, templates), about: () => aboutSection(profile, settings),
        faq: () => faqSection(settings), cta: () => ctaSection(settings),
      };
      const page = host.parentElement;
      const order = sectionsOrder(settings);
      const html = order.map(id => parts[id]());
      // About and the closing call to action sit side by side on wide screens when they follow each other.
      const ai = order.indexOf('about'), ci = order.indexOf('cta');
      if (ai >= 0 && ci === ai + 1 && html[ai] && html[ci]) {
        const strip = h => h.replace(/^<section class="container block">/, '<div class="block">').replace(/<\/section>$/, '</div>');
        html.splice(ai, 2, `<section class="container home-duo">${strip(html[ai])}${strip(html[ci])}</section>`);
      }
      page.innerHTML = html.join('');
      AboutPage.loadAvatars(page);
      startRotor(page);
      Chrome.fillTyped();
    } catch (e) {
      console.error('Home init error:', e);
      if (host) host.innerHTML = UI.errorState(UI.S.loadFail, UI.S.checkConnection, UI.S.retry);
    }
  }

  return { render, init };
})();
