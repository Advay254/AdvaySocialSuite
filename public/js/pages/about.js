const AboutPage = (() => {

  function portrait(profile, cls) {
    const initial = UI.text((profile.name || '').charAt(0).toUpperCase());
    return `<div class="portrait glow-card ${cls || ''}"><div class="frame" data-avatar="${UI.esc(UI.safeUrl(profile.avatar_url))}" data-alt="${UI.esc(UI.stripEmoji(profile.name || ''))}"><div class="monogram" aria-hidden="true">${initial}</div></div></div>`;
  }
  function loadAvatars(root) {
    root.querySelectorAll('.frame[data-avatar]').forEach(frame => {
      const src = frame.dataset.avatar; if (!src) return;
      const img = new Image(); img.alt = frame.dataset.alt || '';
      img.onload = () => { frame.innerHTML = ''; frame.appendChild(img); };
      img.src = src;
    });
  }

  function render() {
    return `<div class="container"><div id="about-head">${UI.head('', ' ', '')}</div><div id="about-content" aria-busy="true">${UI.skeletonCards(2)}</div></div>`;
  }

  async function init() {
    const box = document.getElementById('about-content');
    try {
      const [{ settings, profile }, tools, repos, templates] = await Promise.all([App.shared(), App.getTools().catch(() => []), App.getRepos().catch(() => []), App.getTemplates().catch(() => [])]);
      if (!document.getElementById('about-content')) return;
      document.getElementById('about-head').innerHTML = UI.head(settings.home_about_kicker, profile.name || settings.nav_about, profile.tagline);
      const bio = UI.stripEmoji(profile.bio || '');
      const skills = UI.parseJSON(profile.skills, []).map(s => UI.stripEmoji(s)).filter(Boolean);
      const principles = UI.parseJSON(profile.principles, []).map(s => UI.stripEmoji(s)).filter(Boolean);
      const specs = UI.parseJSON(settings.specializations, []).filter(s => s && s.title);
      const funfact = UI.stripEmoji(settings.funfact || '');
      const support = UI.safeUrl(profile.bmc_url), socials = UI.socialLinks(profile);
      const years = parseInt(settings.years_exp, 10);
      const stats = [[tools.length, settings.home_stat_tools_label], [repos.length, settings.home_stat_repos_label], [settings.templates_visible !== '0' ? templates.length : 0, settings.templates_label], [Number.isFinite(years) ? years : 0, settings.home_stat_years_label]].filter(([n, l]) => n > 0 && l);

      box.removeAttribute('aria-busy');
      box.innerHTML = `
        <section class="about-lead reveal">
          ${portrait(profile)}
          <div class="about-text">
            ${profile.location ? `<p class="k">${UI.icon('map-pin', 16)} ${UI.text(profile.location)}</p>` : ''}
            ${bio ? `<p class="body-lg">${UI.para(bio)}</p>` : ''}
            ${socials || (support && settings.support_label) ? `<div class="row">${socials ? `<div class="socials">${socials}</div>` : ''}${support && settings.support_label ? UI.btn({ label: settings.support_label, href: support, external: true, variant: 'secondary', size: 'sm', icon: 'arrow-up-right' }) : ''}</div>` : ''}
            ${funfact ? `<p class="fact">${UI.text(funfact)}</p>` : ''}
          </div>
        </section>
        ${stats.length ? `<section class="stats reveal">${stats.map(([n, l]) => `<div class="stat"><div class="num"><span data-count="${n}">0</span></div><div class="cap">${UI.text(l)}</div></div>`).join('')}</section>` : ''}
        ${specs.length ? `<section class="block">${UI.sectionHead(settings.home_services_kicker, settings.home_services_heading, settings.home_services_subtitle)}${UI.featureCards(specs)}</section>` : ''}
        ${principles.length ? `<section class="block reveal"><ul class="checklist">${principles.map(p => `<li>${UI.icon('check', 18)}<span>${UI.text(p)}</span></li>`).join('')}</ul></section>` : ''}
        ${skills.length ? `<section class="block reveal"><div class="tags tags--lg">${skills.map(s => `<span class="tag">${UI.text(s)}</span>`).join('')}</div></section>` : ''}`;
      loadAvatars(box);
      UI.reveal(box); UI.countUp(box);
    } catch (e) {
      console.error('About page error:', e);
      if (box) { box.removeAttribute('aria-busy'); box.innerHTML = UI.errorState(UI.S.loadFail, UI.S.checkConnection, UI.S.retry); }
    }
  }

  return { render, init, portrait, loadAvatars };
})();
