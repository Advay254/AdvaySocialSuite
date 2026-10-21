const AboutPage = (() => {

  function render() {
    return `
      <div class="container">
        <div class="page-head">
          <h1 class="display" id="about-title"></h1>
          <p class="lead" id="about-subtitle"></p>
        </div>
        <div id="about-content" class="page-body" aria-busy="true">${UI.skeletonCards(2)}</div>
      </div>`;
  }

  async function init() {
    const box = document.getElementById('about-content');
    try {
      const { settings, profile } = await App.shared();
      if (!document.getElementById('about-content')) return;

      document.getElementById('about-title').textContent = UI.stripEmoji(profile.name || settings.nav_about || '');
      document.getElementById('about-subtitle').textContent = UI.stripEmoji(profile.tagline || '');

      const bio = UI.stripEmoji(profile.bio || '');
      const skills = UI.parseJSON(profile.skills, []).map(s => UI.stripEmoji(s)).filter(Boolean);
      const principles = UI.parseJSON(profile.principles, []).map(s => UI.stripEmoji(s)).filter(Boolean);
      const specs = UI.parseJSON(settings.specializations, []).filter(s => s && s.title);
      const funfact = UI.stripEmoji(settings.funfact || '');
      const initial = UI.text((profile.name || '').charAt(0).toUpperCase());
      const support = UI.safeUrl(profile.bmc_url);
      const socials = UI.socialLinks(profile);

      box.removeAttribute('aria-busy');
      box.innerHTML = `
        <section class="about-lead">
          <div class="portrait reveal" style="max-width:420px">
            <div class="frame frame--wide" data-avatar="${UI.esc(UI.safeUrl(profile.avatar_url))}" data-alt="${UI.esc(UI.stripEmoji(profile.name || ''))}">
              <div class="monogram" aria-hidden="true"><span class="monogram__line"></span><span class="monogram__letter">${initial}</span></div>
            </div>
          </div>
          <div class="stack-gap">
            ${profile.location ? `<p class="muted reveal">${UI.icon('pin')} ${UI.text(profile.location)}</p>` : ''}
            ${bio ? `<p class="lead body-text reveal" style="color:var(--ink)">${UI.esc(bio)}</p>` : ''}
            ${socials || (support && settings.support_label) ? `<div class="row reveal"><div class="socials">${socials}</div>${support && settings.support_label ? UI.btn({ label: settings.support_label, href: support, external: true, variant: 'secondary', size: 'sm', icon: 'arrow-up-right' }) : ''}</div>` : ''}
            ${funfact ? `<p class="fact reveal">${UI.esc(funfact)}</p>` : ''}
          </div>
        </section>

        ${specs.length ? `<section style="margin-top:clamp(3rem,6vw,5rem)">
          <div class="section-head reveal"><h2 class="headline">${UI.text(settings.home_services_heading || '')}</h2></div>
          <div>${specs.map((s, i) => `<div class="service-row reveal"><span class="icon-badge">${UI.iconFor(s.icon, Icons.serviceDefault(i))}</span><div><h3 class="title">${UI.text(s.title)}</h3><p>${UI.text(s.desc || '')}</p></div></div>`).join('')}</div>
        </section>` : ''}

        ${principles.length ? `<section style="margin-top:clamp(3rem,6vw,5rem)">
          <ul class="checklist reveal" style="max-width:44rem">${principles.map(p => `<li>${UI.icon('check')}<span>${UI.esc(p)}</span></li>`).join('')}</ul>
        </section>` : ''}

        ${skills.length ? `<section style="margin-top:clamp(3rem,6vw,5rem)" class="reveal"><div class="tags">${skills.map(s => `<span class="tag">${UI.esc(s)}</span>`).join('')}</div></section>` : ''}`;

      box.querySelectorAll('.frame[data-avatar]').forEach(frame => {
        const src = frame.dataset.avatar; if (!src) return;
        const img = new Image(); img.alt = frame.dataset.alt || '';
        img.onload = () => { frame.innerHTML = ''; frame.appendChild(img); };
        img.src = src;
      });
      UI.reveal(box);
    } catch (e) {
      console.error('About page error:', e);
      if (box) { box.removeAttribute('aria-busy'); box.innerHTML = UI.errorState('The profile did not load.', 'Check your connection, then try again.', 'Try again'); }
    }
  }

  return { render, init };
})();
