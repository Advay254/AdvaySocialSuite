const CollabPage = (() => {

  function render() {
    return `
      <div class="container">
        <div class="page-head">
          <h1 id="collab-title"></h1>
          <p id="collab-page-subtitle"></p>
        </div>

        <section id="collab-services" class="hidden" style="margin-bottom:var(--space-7)">
          <div class="grid grid--2" id="collab-services-grid"></div>
        </section>

        <div class="form-grid">
          <div class="card">
            <p id="collab-intro-text" class="muted hidden" style="margin-bottom:var(--space-4)"></p>
            <form id="collab-form" novalidate>
              <div class="field">
                <label class="label" for="c-name">Your name</label>
                <input id="c-name" type="text" name="name" class="input" placeholder="What should I call you?" required maxlength="100" autocomplete="name">
              </div>
              <div class="field">
                <label class="label" for="c-subject">What do you need?</label>
                <select id="c-subject" name="subject" class="select" required>
                  <option value="" disabled selected>Select a category</option>
                  <option value="Collaboration">Collaboration</option>
                  <option value="Automation">Automation</option>
                  <option value="Web App">Web App</option>
                  <option value="Website">Website</option>
                  <option value="Consultation">Consultation</option>
                  <option value="Bot Development">Bot Development</option>
                  <option value="API Integration">API Integration</option>
                  <option value="Something else">Something else</option>
                </select>
              </div>
              <div class="field">
                <label class="label" for="collab-message">Message</label>
                <textarea id="collab-message" name="message" class="textarea" rows="5" placeholder="Describe your project or idea in as much detail as you can." required maxlength="1000"></textarea>
                <div class="counter" id="msg-counter"><span id="msg-count">0</span>/1000</div>
              </div>
              <div class="field">
                <label class="label" for="c-email">Your email</label>
                <input id="c-email" type="email" name="email" class="input" placeholder="you@example.com" required maxlength="200" autocomplete="email">
              </div>
              <button type="submit" class="btn btn--primary btn--block" id="collab-submit-btn">
                <span id="collab-btn-text">Send message</span>${UI.icon('send')}
              </button>
            </form>
            <div id="collab-success" class="notice notice--ok hidden" role="status" style="margin-top:var(--space-4)"><strong>Message sent.</strong> I will review it and get back to you within 24 hours.</div>
            <div id="collab-error" class="notice notice--error hidden" role="alert" style="margin-top:var(--space-4)"></div>
          </div>

          <aside class="stack">
            <div class="card">
              <ul class="list-plain" id="collab-info"></ul>
            </div>
            <div class="card hidden" id="collab-support"></div>
          </aside>
        </div>
      </div>`;
  }

  async function init() {
    try {
      const { settings, profile } = await App.shared();
      if (!document.getElementById('collab-form')) return;
      document.getElementById('collab-title').textContent = UI.stripEmoji(settings.nav_collab || '');
      document.getElementById('collab-page-subtitle').textContent = UI.stripEmoji(settings.collab_subtitle || '');

      const intro = document.getElementById('collab-intro-text');
      if (settings.collab_intro && settings.collab_intro.trim()) { intro.textContent = UI.stripEmoji(settings.collab_intro); intro.classList.remove('hidden'); }

      const services = UI.parseJSON(settings.collab_services, []).filter(s => s && s.title);
      if (services.length) {
        document.getElementById('collab-services').classList.remove('hidden');
        document.getElementById('collab-services-grid').innerHTML = services.map((s, i) => `
          <div class="card service reveal"><span class="tile__icon">${UI.serviceIcon(i)}</span><h3 class="tile__title">${UI.text(s.title)}</h3><p>${UI.text(s.desc || '')}</p></div>`).join('');
      }

      const rows = [];
      if (profile.location) rows.push(['pin', `Based in ${profile.location}. Remote only, open to global clients.`]);
      [settings.collab_qi_1, settings.collab_qi_2, settings.collab_qi_3].forEach((t, i) => { if (t) rows.push([['zap', 'wrench', 'check'][i], t]); });
      document.getElementById('collab-info').innerHTML = rows.map(([ic, t]) => `<li>${UI.icon(ic)}<span>${UI.text(t)}</span></li>`).join('');

      const support = UI.safeUrl(profile.bmc_url);
      const box = document.getElementById('collab-support');
      if (support && settings.support_label) {
        box.classList.remove('hidden');
        box.innerHTML = `<p class="muted" style="margin-bottom:var(--space-3)">${UI.text(settings.footer_support_text)}</p><a class="btn btn--secondary btn--sm" href="${UI.esc(support)}" target="_blank" rel="noopener noreferrer">${UI.text(settings.support_label)} ${UI.icon('arrow-up-right')}</a>`;
      }
      UI.reveal(document.getElementById('app'));
    } catch { /* the form still works without settings */ }

    const area = document.getElementById('collab-message');
    const count = document.getElementById('msg-count');
    const counter = document.getElementById('msg-counter');
    area?.addEventListener('input', () => { count.textContent = area.value.length; counter.classList.toggle('is-near', area.value.length > 900); });
    document.getElementById('collab-form')?.addEventListener('submit', submit);
  }

  async function submit(e) {
    e.preventDefault();
    const form = e.target;
    const btn = document.getElementById('collab-submit-btn');
    const btnText = document.getElementById('collab-btn-text');
    const ok = document.getElementById('collab-success');
    const err = document.getElementById('collab-error');
    ok.classList.add('hidden'); err.classList.add('hidden');

    if (!form.checkValidity()) { form.reportValidity(); return; }

    btn.disabled = true; btnText.textContent = 'Sending';
    try {
      await App.api('/api/collab', { method: 'POST', body: Object.fromEntries(new FormData(form)) });
      form.reset();
      document.getElementById('msg-count').textContent = '0';
      ok.classList.remove('hidden');
    } catch (ex) {
      err.textContent = ex.message || 'Failed to send. Please try again.';
      err.classList.remove('hidden');
    } finally {
      btn.disabled = false; btnText.textContent = 'Send message';
    }
  }

  return { render, init };
})();
