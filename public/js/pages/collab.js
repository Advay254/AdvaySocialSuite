const CollabPage = (() => {

  let settings = {};

  function field(id, label, control, hint) {
    return `<div class="field" id="f-${id}"><label class="field__label" for="${id}">${label}</label>${control}${hint || ''}<span class="field__error" id="${id}-err" role="alert"></span></div>`;
  }

  function render() {
    return `
      <div class="container">
        <div class="page-head">
          <h1 class="display" id="collab-title"></h1>
          <p class="lead" id="collab-page-subtitle"></p>
        </div>
        <div class="page-body">
          <section id="collab-services" class="hidden" style="margin-bottom:clamp(2.5rem,5vw,4rem)"><div class="services" id="collab-services-grid"></div></section>
          <div class="form-grid">
            <div class="card card--page">
              <p id="collab-intro-text" class="muted hidden" style="margin-bottom:1.5rem"></p>
              <form id="collab-form" novalidate>
                ${field('c-name', 'Your name', '<input id="c-name" type="text" name="name" class="input" placeholder="What should I call you?" required maxlength="100" autocomplete="name">')}
                ${field('c-subject', 'What do you need?', `<select id="c-subject" name="subject" class="select" required>
                  <option value="" disabled selected>Select a category</option>
                  <option value="Collaboration">Collaboration</option><option value="Automation">Automation</option><option value="Web App">Web App</option>
                  <option value="Website">Website</option><option value="Consultation">Consultation</option><option value="Bot Development">Bot Development</option>
                  <option value="API Integration">API Integration</option><option value="Something else">Something else</option></select>`)}
                ${field('collab-message', 'Message', '<textarea id="collab-message" name="message" class="textarea" rows="5" placeholder="Describe your project or idea in as much detail as you can." required maxlength="1000"></textarea><div class="counter" id="msg-counter"><span id="msg-count">0</span>/1000</div>')}
                ${field('c-email', 'Your email', '<input id="c-email" type="email" name="email" class="input" placeholder="you@example.com" required maxlength="200" autocomplete="email">')}
                ${UI.btn({ label: 'Send message', tag: 'button', type: 'submit', id: 'collab-submit-btn', icon: 'send', block: true })}
              </form>
              <div id="collab-success" class="notice notice--ok hidden" role="status" style="margin-top:1.25rem"><strong id="collab-success-title"></strong><span id="collab-success-text"></span></div>
              <div id="collab-error" class="notice notice--error hidden" role="alert" style="margin-top:1.25rem"></div>
            </div>
            <aside class="card"><ul class="info-list" id="collab-info"></ul></aside>
          </div>
        </div>
      </div>`;
  }

  async function init() {
    try {
      const shared = await App.shared();
      settings = shared.settings;
      const profile = shared.profile;
      if (!document.getElementById('collab-form')) return;
      document.getElementById('collab-title').textContent = UI.stripEmoji(settings.nav_collab || '');
      document.getElementById('collab-page-subtitle').textContent = UI.stripEmoji(settings.collab_subtitle || '');

      const intro = document.getElementById('collab-intro-text');
      if (settings.collab_intro && settings.collab_intro.trim()) { intro.textContent = UI.stripEmoji(settings.collab_intro); intro.classList.remove('hidden'); }

      const services = UI.parseJSON(settings.collab_services, []).filter(s => s && s.title);
      if (services.length) {
        document.getElementById('collab-services').classList.remove('hidden');
        document.getElementById('collab-services-grid').innerHTML = services.slice(0, 4).map((s, i) => `
          <div class="card card--page service reveal"><span class="icon-badge">${UI.serviceIcon(i)}</span><h3 class="title">${UI.text(s.title)}</h3><p>${UI.text(s.desc || '')}</p></div>`).join('');
      }

      const rows = [];
      if (profile.location) rows.push(['pin', `Based in ${profile.location}. Remote only, open to global clients.`]);
      [settings.collab_qi_1, settings.collab_qi_2, settings.collab_qi_3].forEach((t, i) => { if (t) rows.push([['zap', 'wrench', 'check'][i], t]); });
      document.getElementById('collab-info').innerHTML = rows.map(([ic, t]) => `<li>${UI.icon(ic)}<span>${UI.text(t)}</span></li>`).join('');
      UI.reveal(document.getElementById('app'));
    } catch { /* the form still works without settings */ }

    const area = document.getElementById('collab-message');
    const count = document.getElementById('msg-count');
    const counter = document.getElementById('msg-counter');
    area?.addEventListener('input', () => { count.textContent = area.value.length; counter.classList.toggle('is-near', area.value.length > 900); });
    const form = document.getElementById('collab-form');
    form?.addEventListener('submit', submit);
    form?.addEventListener('input', e => clearError(e.target));
    form?.addEventListener('change', e => clearError(e.target));
  }

  const MESSAGES = {
    'c-name': 'Enter your name so I know who to reply to.',
    'c-subject': 'Choose what you need help with.',
    'collab-message': 'Write a message so I know what you need.',
    'c-email': 'Enter a valid email address so I can reply.',
  };
  function setError(id, on) {
    const wrap = document.getElementById('f-' + id);
    const input = document.getElementById(id);
    if (!wrap || !input) return;
    wrap.classList.toggle('has-error', on);
    document.getElementById(id + '-err').textContent = on ? MESSAGES[id] : '';
    if (on) { input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', id + '-err'); }
    else { input.removeAttribute('aria-invalid'); input.removeAttribute('aria-describedby'); }
  }
  function clearError(el) { if (el && el.id && MESSAGES[el.id]) setError(el.id, false); }

  async function submit(e) {
    e.preventDefault();
    const form = e.target;
    const btn = document.getElementById('collab-submit-btn');
    const ok = document.getElementById('collab-success');
    const err = document.getElementById('collab-error');
    ok.classList.add('hidden'); err.classList.add('hidden');

    let firstBad = null;
    Object.keys(MESSAGES).forEach(id => {
      const input = document.getElementById(id);
      const bad = !input.value.trim() || (id === 'c-email' && !input.checkValidity());
      setError(id, bad);
      if (bad && !firstBad) firstBad = input;
    });
    if (firstBad) { firstBad.focus(); return; }

    const label = btn.querySelector('.btn__text');
    btn.disabled = true; btn.setAttribute('aria-busy', 'true');
    btn.querySelectorAll('.btn__text').forEach(t => { t.textContent = 'Sending'; });
    try {
      await App.api('/api/collab', { method: 'POST', body: Object.fromEntries(new FormData(form)) });
      form.reset();
      document.getElementById('msg-count').textContent = '0';
      document.getElementById('collab-success-title').textContent = UI.stripEmoji(settings.collab_success_title || '');
      document.getElementById('collab-success-text').textContent = UI.stripEmoji(settings.collab_success_text || '');
      ok.classList.remove('hidden');
      ok.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } catch (ex) {
      err.textContent = (ex.message || 'The message was not sent.') + ' Check the form and send it again.';
      err.classList.remove('hidden');
    } finally {
      btn.disabled = false; btn.removeAttribute('aria-busy');
      btn.querySelectorAll('.btn__text').forEach(t => { t.textContent = 'Send message'; });
    }
  }

  return { render, init };
})();
