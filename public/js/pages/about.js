const AboutPage = (() => {

  function render() {
    return `
      <div class="container">
        <div class="page-head">
          <h1 id="about-title"></h1>
          <p id="about-subtitle"></p>
        </div>
        <div id="about-content" class="stack" aria-busy="true">${UI.skeletonCards(2)}</div>
      </div>`;
  }

  async function init() {
    const box = document.getElementById('about-content');
    try {
      const { settings, profile } = await App.shared();
      if (!document.getElementById('about-content')) return;

      const title = document.getElementById('about-title');
      if (title) title.textContent = UI.stripEmoji(settings.nav_about || '');
      const bio = UI.stripEmoji(profile.bio || '');
      const subtitle = document.getElementById('about-subtitle');
      if (subtitle) subtitle.textContent = bio ? bio.split('.')[0] + '.' : '';

      const skills = UI.parseJSON(profile.skills, []);
      const principles = UI.parseJSON(profile.principles, []);
      const specs = UI.parseJSON(settings.specializations, []).filter(s => s && s.title);
      const funfact = UI.stripEmoji(settings.funfact || '');
      const name = UI.text(profile.name || '');
      const avatar = UI.safeUrl(profile.avatar_url);
      const support = UI.safeUrl(profile.bmc_url);
      const socials = UI.socialLinks(profile);

      box.removeAttribute('aria-busy');
      box.innerHTML = `
        <section class="card about-hero reveal">
          <div class="avatar" id="about-avatar" aria-hidden="true">${UI.text((profile.name || '').charAt(0).toUpperCase())}</div>
          <div>
            <h2 class="h2">${name}</h2>
            ${profile.tagline ? `<p class="hero__role" style="margin-top:var(--space-2)">${UI.text(profile.tagline)}</p>` : ''}
            ${profile.location ? `<p class="muted" style="margin-top:var(--space-2)">${UI.icon('pin')} ${UI.text(profile.location)}</p>` : ''}
          </div>
          ${bio ? `<p class="lead" style="margin-top:0">${UI.text(bio)}</p>` : ''}
          ${socials || (support && settings.support_label) ? `<div class="socials">${socials}${support && settings.support_label ? `<a class="btn btn--secondary btn--sm" href="${UI.esc(support)}" target="_blank" rel="noopener noreferrer">${UI.text(settings.support_label)}</a>` : ''}</div>` : ''}
        </section>

        <div class="grid grid--2">
          ${specs.length ? `<section class="card reveal">
            <span class="kicker">Specialization</span>
            <h3 class="tile__title" style="margin-bottom:var(--space-4)">What I Build</h3>
            <div class="stack">
              ${specs.map((s, i) => `<div style="display:flex;gap:var(--space-3);align-items:flex-start">
                <span class="tile__icon" style="flex-shrink:0">${UI.serviceIcon(i)}</span>
                <div><h4>${UI.text(s.title)}</h4><p class="muted" style="font-size:var(--text-sm);margin-top:var(--space-1)">${UI.text(s.desc || '')}</p></div>
              </div>`).join('')}
            </div>
          </section>` : ''}

          <div class="stack">
            ${principles.length ? `<section class="card reveal">
              <span class="kicker">Core Principles</span>
              <h3 class="tile__title" style="margin-bottom:var(--space-4)">How I Work</h3>
              <ul class="list-plain">${principles.map(p => `<li>${UI.icon('check')}<span>${UI.text(p)}</span></li>`).join('')}</ul>
            </section>` : ''}
            ${funfact ? `<section class="card reveal"><p class="fact">${UI.text(funfact)}</p></section>` : ''}
          </div>
        </div>

        ${skills.length ? `<section class="card reveal">
          <span class="kicker">Skills &amp; Stack</span>
          <h3 class="tile__title" style="margin-bottom:var(--space-4)">Technology Arsenal</h3>
          <div class="tags">${skills.map(s => `<span class="tag">${UI.text(s)}</span>`).join('')}</div>
        </section>` : ''}`;

      if (avatar) {
        const img = new Image();
        img.alt = profile.name ? UI.stripEmoji(profile.name) : '';
        img.onload = () => { const a = document.getElementById('about-avatar'); if (a) { a.textContent = ''; a.removeAttribute('aria-hidden'); a.appendChild(img); } };
        img.src = avatar;
      }
      UI.reveal(box);
    } catch (e) {
      console.error('About page error:', e);
      if (box) box.innerHTML = UI.errorState('Could not load the profile.', '', 'Try again');
    }
  }

  return { render, init };
})();
