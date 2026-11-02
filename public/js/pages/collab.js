const CollabPage = (() => {

  let settings = {};

  function field(id, label, control, extra) {
    return `<div class="field field--float${extra ? ' ' + extra : ''}" id="f-${id}">${control}<label for="${id}">${label}</label><span class="field__error" id="${id}-err" role="alert"></span></div>`;
  }

  function render() {
    return `<div class="container">
      <div id="collab-head">${UI.head('', ' ', '')}</div>
      <div class="form-grid">
        <div class="card form-card">
          <p id="collab-intro-text" class="muted" hidden></p>
          <form id="collab-form" novalidate>
            ${field('c-name', 'Your name', '<input id="c-name" type="text" name="name" class="input" placeholder=" " required maxlength="100" autocomplete="name">')}
            ${field('c-subject', 'What do you need?', `<select id="c-subject" name="subject" class="select" required>
              <option value="" disabled selected>Select a category</option>
              <option value="Collaboration">Collaboration</option><option value="Automation">Automation</option><option value="Web App">Web App</option>
              <option value="Website">Website</option><option value="Consultation">Consultation</option><option value="Bot Development">Bot Development</option>
              <option value="API Integration">API Integration</option><option value="Something else">Something else</option></select>`, 'field--select')}
            ${field('collab-message', 'Message', '<textarea id="collab-message" name="message" class="textarea" rows="5" placeholder=" " required maxlength="1000"></textarea><div class="counter" id="msg-counter"><span id="msg-count">0</span>/1000</div>')}
            ${field('c-email', 'Your email', '<input id="c-email" type="email" name="email" class="input" placeholder=" " required maxlength="200" autocomplete="email">')}
            <div class="hp" aria-hidden="true"><label>Website<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
            ${UI.btn({ label: 'Send message', tag: 'button', type: 'submit', id: 'collab-submit-btn', icon: 'send', block: true })}
          </form>
          <div id="collab-success" class="success" role="status" hidden>
            <svg class="check-draw" viewBox="0 0 52 52" aria-hidden="true" focusable="false"><circle cx="26" cy="26" r="23"/><path d="M15 27l8 8 14-16"/></svg>
            <strong id="collab-success-title"></strong><span id="collab-success-text"></span>
          </div>
          <div id="collab-error" class="notice notice--error" role="alert" hidden></div>
        </div>
        <aside class="card info-card"><ul class="info-list" id="collab-info"></ul></aside>
      </div>
      <section id="collab-services" class="block" hidden></section>
    </div>`;
  }

  async function init() {
    try {
      const shared = await App.shared();
      settings = shared.settings;
      const profile = shared.profile;
      if (!document.getElementById('collab-form')) return;
      document.getElementById('collab-head').innerHTML = UI.head(settings.home_services_kicker, settings.nav_collab, settings.collab_subtitle);
      const intro = document.getElementById('collab-intro-text');
      if (settings.collab_intro && settings.collab_intro.trim()) { intro.textContent = UI.stripEmoji(settings.collab_intro); intro.hidden = false; }
      const rows = [];
      if (profile.location) rows.push(['map-pin', `Based in ${profile.location}. Remote only, open to global clients.`]);
      [settings.collab_qi_1, settings.collab_qi_2, settings.collab_qi_3].forEach((t, i) => { if (t) rows.push([['zap', 'wrench', 'check'][i], t]); });
      document.getElementById('collab-info').innerHTML = rows.map(([ic, t]) => `<li>${UI.icon(ic, 18)}<span>${UI.text(t)}</span></li>`).join('');
      const services = UI.parseJSON(settings.collab_services, []).filter(s => s && s.title).slice(0, 6);
      if (services.length) { const el = document.getElementById('collab-services'); el.hidden = false; el.innerHTML = UI.featureCards(services); UI.reveal(el); }
    } catch { /* the form still works without settings */ }

    const area = document.getElementById('collab-message'), count = document.getElementById('msg-count'), counter = document.getElementById('msg-counter');
    area?.addEventListener('input', () => { count.textContent = area.value.length; counter.classList.toggle('is-near', area.value.length > 900); });
    const form = document.getElementById('collab-form');
    form?.addEventListener('submit', submit);
    form?.addEventListener('input', e => clearError(e.target));
    form?.addEventListener('change', e => clearError(e.target));
    form?.addEventListener('focusout', e => { if (e.target.id && MESSAGES[e.target.id] && (e.target.value || e.target.dataset.touched)) validateOne(e.target.id); e.target.dataset.touched = '1'; });
  }

  const MESSAGES = {
    'c-name': 'Enter your name so I know who to reply to.',
    'c-subject': 'Choose what you need help with.',
    'collab-message': 'Write a message so I know what you need.',
    'c-email': 'Enter a valid email address so I can reply.',
  };
  function setError(id, on, message) {
    const wrap = document.getElementById('f-' + id), input = document.getElementById(id);
    if (!wrap || !input) return;
    wrap.classList.toggle('has-error', on);
    document.getElementById(id + '-err').textContent = on ? (message || MESSAGES[id]) : '';
    if (on) { input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', id + '-err'); }
    else { input.removeAttribute('aria-invalid'); input.removeAttribute('aria-describedby'); }
  }
  function clearError(el) { if (el && el.id && MESSAGES[el.id]) setError(el.id, false); }
  function validateOne(id) {
    const input = document.getElementById(id);
    const bad = !input.value.trim() || (id === 'c-email' && !input.checkValidity());
    setError(id, bad);
    return bad ? input : null;
  }

  async function submit(e) {
    e.preventDefault();
    const form = e.target, btn = document.getElementById('collab-submit-btn');
    const ok = document.getElementById('collab-success'), err = document.getElementById('collab-error');
    err.hidden = true;
    let firstBad = null;
    Object.keys(MESSAGES).forEach(id => { const bad = validateOne(id); if (bad && !firstBad) firstBad = bad; });
    if (firstBad) { firstBad.focus(); return; }
    UI.busy(btn, true, 'Sending');
    try {
      await App.api('/api/collab', { method: 'POST', body: Object.fromEntries(new FormData(form)) });
      form.reset();
      document.getElementById('msg-count').textContent = '0';
      document.getElementById('collab-success-title').textContent = UI.stripEmoji(settings.collab_success_title || '');
      document.getElementById('collab-success-text').textContent = UI.stripEmoji(settings.collab_success_text || '');
      form.hidden = true; ok.hidden = false;
      ok.scrollIntoView({ block: 'nearest', behavior: UI.reduced() ? 'auto' : 'smooth' });
    } catch (ex) {
      const map = { name: 'c-name', subject: 'c-subject', message: 'collab-message', email: 'c-email' };
      let shown = false;
      if (ex.fields) Object.entries(ex.fields).forEach(([k, msg]) => { if (map[k]) { setError(map[k], true, msg); shown = true; } });
      if (!shown) { err.textContent = ex.message || 'The message was not sent. Please try again.'; err.hidden = false; }
    } finally { UI.busy(btn, false, 'Send message'); }
  }

  return { render, init };
})();
