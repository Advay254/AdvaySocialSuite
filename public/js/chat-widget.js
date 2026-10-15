/* AdvaySocialSuite 1.0.0 chat widget: assistant chat plus suggestion box. */
const ChatWidget = (() => {

  // Functional interface wording that is not content. Everything the owner can edit comes from settings.
  const S = {
    close: 'Close', newChat: 'New conversation', send: 'Send message', copy: 'Copy reply', copied: 'Copied',
    retry: 'Try again', placeholder: 'Type your question', tabChat: 'Chat', tabSuggest: 'Suggest',
    error: 'Something went wrong. Please try again.', offline: 'The assistant is not available right now.',
    suggestIntro: 'Have an idea or found a problem? Send it here.', suggestLabel: 'Your suggestion',
    suggestEmail: 'Email (optional)', suggestSubmit: 'Send suggestion', suggestThanks: 'Thank you. Your suggestion was received.',
    suggestFail: 'Could not send. Please try again.', about: 'Questions about',
  };
  const MAX = 600, NEAR = 500, STORE_KEY = 'adv_chat_v1';

  let cfg = { enabled: false, name: '', launcher_label: '', greeting: '', suggestions: [], disclaimer: '', off_message: '' };
  let owner = '';
  let messages = [];        // { role, content, ts }
  let open = false, busy = false, blocked = false, tab = 'chat';
  let lastFocus = null;
  let els = {};

  // ─── Safe formatter: everything is escaped first, only a fixed set of tags is produced ───
  function fmtInline(s) {
    const tokens = [];
    const keep = html => { tokens.push(html); return `\u0000${tokens.length - 1}\u0000`; };
    let t = UI.esc(s);
    t = t.replace(/`([^`\n]+)`/g, (_, c) => keep(`<code>${c}</code>`));
    t = t.replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, label, url) => keep(`<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`));
    t = t.replace(/(^|[\s(])(https?:\/\/[^\s<]+[^\s<.,;:!?)'"])/g, (_, pre, url) => `${pre}${keep(`<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`)}`);
    t = t.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, '$1<em>$2</em>');
    t = t.replace(/(^|[^\w])_([^_\n]+)_(?!\w)/g, '$1<em>$2</em>');
    return t.replace(/\u0000(\d+)\u0000/g, (_, i) => tokens[Number(i)]);
  }
  function format(raw) {
    const lines = String(raw || '').replace(/\r\n/g, '\n').split('\n');
    const out = [];
    let list = null, para = [];
    const flushPara = () => { if (para.length) { out.push(`<p>${para.map(fmtInline).join('<br>')}</p>`); para = []; } };
    const flushList = () => { if (list) { out.push(`<${list.type}>${list.items.map(i => `<li>${fmtInline(i)}</li>`).join('')}</${list.type}>`); list = null; } };
    for (const line of lines) {
      const ul = line.match(/^\s*[-*]\s+(.+)/), ol = line.match(/^\s*\d+[.)]\s+(.+)/);
      if (ul || ol) {
        flushPara();
        const type = ul ? 'ul' : 'ol';
        if (list && list.type !== type) flushList();
        if (!list) list = { type, items: [] };
        list.items.push((ul || ol)[1]);
      } else if (!line.trim()) { flushPara(); flushList(); }
      else { flushList(); para.push(line); }
    }
    flushPara(); flushList();
    return out.join('');
  }

  // ─── Session storage (may be blocked) ────────────────────────────────────────
  function load() {
    try {
      const d = JSON.parse(sessionStorage.getItem(STORE_KEY) || 'null');
      if (d && Array.isArray(d.messages)) messages = d.messages.filter(m => m && ['user', 'assistant'].includes(m.role) && typeof m.content === 'string').slice(-20);
    } catch { messages = []; }
  }
  function save() { try { sessionStorage.setItem(STORE_KEY, JSON.stringify({ messages: messages.slice(-20) })); } catch { /* storage blocked */ } }

  // ─── Build ───────────────────────────────────────────────────────────────────
  async function init() {
    const root = document.getElementById('chat-widget-root');
    if (!root) return;
    try { cfg = { ...cfg, ...(await App.api('/api/chat/widget')) }; } catch { cfg.enabled = false; }
    try { const { profile, settings } = await App.shared(); owner = UI.stripEmoji(profile.name || settings.site_name || ''); } catch { /* optional */ }
    load();

    const name = UI.text(cfg.name || '');
    const label = UI.text(cfg.launcher_label || '');
    root.innerHTML = `
      <button type="button" class="cw-launcher" id="cw-launcher" aria-expanded="false" aria-controls="cw-window" ${label ? `title="${label}"` : ''} aria-label="${label || name || S.tabChat}">
        ${UI.icon('chat')}${label ? `<span class="cw-launcher__label">${label}</span>` : ''}
      </button>
      <div class="cw-window hidden" id="cw-window" role="dialog" aria-modal="true" aria-label="${name || S.tabChat}">
        <div class="cw-head">
          <div class="cw-avatar" aria-hidden="true">${UI.text((cfg.name || '?').charAt(0).toUpperCase())}<span class="dot ${cfg.enabled ? '' : 'dot--off'}" id="cw-dot"></span></div>
          <div class="cw-title"><strong>${name}</strong><span>${owner ? `${S.about} ${UI.text(owner)}` : ''}</span></div>
          <button type="button" class="icon-btn" id="cw-new" aria-label="${S.newChat}" title="${S.newChat}">${UI.icon('compose')}</button>
          <button type="button" class="icon-btn" id="cw-close" aria-label="${S.close}" title="${S.close}">${UI.icon('x')}</button>
        </div>
        <div class="cw-tabs" role="tablist">
          <button type="button" class="cw-tab" role="tab" id="cw-tab-chat" aria-selected="true" aria-controls="cw-panel-chat">${S.tabChat}</button>
          <button type="button" class="cw-tab" role="tab" id="cw-tab-suggest" aria-selected="false" aria-controls="cw-panel-suggest">${S.tabSuggest}</button>
        </div>
        <div class="cw-panel" id="cw-panel-chat" role="tabpanel" aria-labelledby="cw-tab-chat">
          <div class="cw-list" id="cw-list" role="log" aria-live="polite" aria-label="${name || S.tabChat}"></div>
          <div class="cw-chips" id="cw-chips"></div>
          <div class="cw-composer">
            <div class="cw-composer__row">
              <label class="sr-only" for="cw-input">${S.placeholder}</label>
              <textarea id="cw-input" class="cw-input" rows="1" maxlength="${MAX}" placeholder="${S.placeholder}"></textarea>
              <button type="button" class="cw-send" id="cw-send" aria-label="${S.send}" title="${S.send}" disabled>${UI.icon('send')}</button>
            </div>
            <div class="cw-foot"><span>${UI.text(cfg.disclaimer || '')}</span><span class="cw-count hidden" id="cw-count" aria-live="off"></span></div>
          </div>
        </div>
        <div class="cw-panel cw-suggest hidden" id="cw-panel-suggest" role="tabpanel" aria-labelledby="cw-tab-suggest">
          <p class="muted" style="margin-bottom:var(--space-4);font-size:var(--text-sm)">${S.suggestIntro}</p>
          <div class="field"><label class="label" for="cw-s-text">${S.suggestLabel}</label><textarea id="cw-s-text" class="textarea" rows="4" maxlength="1000"></textarea></div>
          <div class="field"><label class="label" for="cw-s-email">${S.suggestEmail}</label><input id="cw-s-email" class="input" type="email" maxlength="200" autocomplete="email"></div>
          <button type="button" class="btn btn--primary btn--block" id="cw-s-send">${S.suggestSubmit}</button>
          <div id="cw-s-msg" class="notice hidden" role="status" style="margin-top:var(--space-3)"></div>
        </div>
      </div>`;

    ['launcher', 'window', 'list', 'chips', 'input', 'send', 'count', 'new', 'close', 'dot'].forEach(k => { els[k] = document.getElementById('cw-' + k); });
    bind();
    renderAll();
  }

  function bind() {
    els.launcher.addEventListener('click', () => (open ? close() : openWin()));
    els.close.addEventListener('click', close);
    els.new.addEventListener('click', newConversation);
    els.send.addEventListener('click', () => send());
    els.input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(); } });
    els.input.addEventListener('input', onInput);
    els.chips.addEventListener('click', e => { const c = e.target.closest('.cw-chip'); if (c) send(c.dataset.q); });
    els.list.addEventListener('click', e => {
      const copy = e.target.closest('.cw-copy'); if (copy) copyReply(copy);
      const retry = e.target.closest('.cw-retry'); if (retry) retryLast();
    });
    document.getElementById('cw-tab-chat').addEventListener('click', () => setTab('chat'));
    document.getElementById('cw-tab-suggest').addEventListener('click', () => setTab('suggest'));
    document.getElementById('cw-s-send').addEventListener('click', submitSuggestion);
    els.window.addEventListener('keydown', onKeydown);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', fitViewport);
      window.visualViewport.addEventListener('scroll', fitViewport);
    }
    window.addEventListener('resize', fitViewport);
  }

  // ─── Open, close, focus ──────────────────────────────────────────────────────
  const narrow = () => window.matchMedia('(max-width: 599px)').matches;

  function fitViewport() {
    if (!open) return;
    const vv = window.visualViewport;
    if (narrow() && vv) {
      els.window.style.setProperty('--cw-vh', vv.height + 'px');
      els.window.style.setProperty('--cw-top', vv.offsetTop + 'px');
    } else {
      els.window.style.removeProperty('--cw-vh');
      els.window.style.removeProperty('--cw-top');
    }
    scrollDown();
  }
  function openWin() {
    open = true; lastFocus = document.activeElement;
    els.window.classList.remove('hidden');
    els.launcher.setAttribute('aria-expanded', 'true');
    if (narrow()) document.documentElement.classList.add('scroll-lock');
    fitViewport();
    scrollDown();
    setTimeout(() => (tab === 'chat' && !els.input.disabled ? els.input : document.getElementById('cw-tab-' + tab)).focus(), 40);
  }
  function close() {
    open = false;
    els.window.classList.add('hidden');
    els.launcher.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('scroll-lock');
    els.launcher.focus();
  }
  function onKeydown(e) {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
    if (e.key !== 'Tab') return;
    const f = Array.from(els.window.querySelectorAll('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])')).filter(x => !x.disabled && x.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  function setTab(t) {
    tab = t;
    ['chat', 'suggest'].forEach(k => {
      document.getElementById('cw-panel-' + k).classList.toggle('hidden', k !== t);
      document.getElementById('cw-tab-' + k).setAttribute('aria-selected', String(k === t));
    });
    if (t === 'chat' && !els.input.disabled) els.input.focus(); else if (t === 'suggest') document.getElementById('cw-s-text').focus();
  }

  // ─── Rendering ───────────────────────────────────────────────────────────────
  function time(ts) { try { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch { return ''; } }
  function scrollDown() { if (els.list) els.list.scrollTop = els.list.scrollHeight; }

  function bubble(m, prev, next) {
    const bot = m.role === 'assistant';
    const cont = prev && prev.role === m.role;
    const last = !next || next.role !== m.role;
    const body = bot ? format(m.content) : `<p>${UI.esc(m.content).replace(/\n/g, '<br>')}</p>`;
    return `<div class="cw-msg ${bot ? 'cw-msg--bot' : 'cw-msg--user'}${cont ? ' cw-msg--cont' : ''}">
      <div class="cw-bubble">${body}${m.error ? `<div><button type="button" class="btn btn--secondary btn--sm cw-retry">${UI.icon('refresh')} ${S.retry}</button></div>` : ''}</div>
      ${last && m.ts ? `<div class="cw-meta"><span>${time(m.ts)}</span>${bot && !m.error && !m.local ? `<button type="button" class="cw-copy" aria-label="${S.copy}" title="${S.copy}" data-i="${messages.indexOf(m)}">${UI.icon('copy', 15)}</button>` : ''}</div>` : ''}
    </div>`;
  }

  function renderAll() {
    const list = [];
    if (cfg.greeting) list.push({ role: 'assistant', content: cfg.greeting, local: true });
    messages.forEach(m => list.push(m));
    if (!cfg.enabled || blocked) list.push({ role: 'assistant', content: cfg.off_message || S.offline, local: true });
    els.list.innerHTML = list.map((m, i) => bubble(m, list[i - 1], list[i + 1])).join('');
    if (busy) els.list.insertAdjacentHTML('beforeend', `<div class="cw-typing" id="cw-typing" aria-label="..."><span></span><span></span><span></span></div>`);

    const hasUser = messages.some(m => m.role === 'user');
    els.chips.innerHTML = !hasUser && cfg.enabled && !blocked ? (cfg.suggestions || []).map(q => `<button type="button" class="cw-chip" data-q="${UI.esc(q)}">${UI.text(q)}</button>`).join('') : '';
    els.chips.classList.toggle('hidden', !els.chips.innerHTML);

    const off = !cfg.enabled || blocked;
    els.input.disabled = off;
    els.dot.classList.toggle('dot--off', off);
    updateSend();
    scrollDown();
  }

  function onInput() {
    els.input.style.height = 'auto';
    els.input.style.height = Math.min(els.input.scrollHeight, 128) + 'px';
    const n = els.input.value.length;
    els.count.classList.toggle('hidden', n < NEAR);
    els.count.classList.toggle('is-near', n >= NEAR);
    els.count.textContent = `${n}/${MAX}`;
    updateSend();
  }
  function updateSend() { els.send.disabled = busy || els.input.disabled || !els.input.value.trim(); }

  // ─── Sending ─────────────────────────────────────────────────────────────────
  async function send(text) {
    const value = String(text != null ? text : els.input.value).trim();
    if (!value || busy || els.input.disabled) return;
    messages.push({ role: 'user', content: value.slice(0, MAX), ts: Date.now() });
    if (text == null) { els.input.value = ''; onInput(); }
    save();
    await request();
  }

  async function request() {
    busy = true; renderAll();
    const payload = messages.filter(m => !m.error).slice(-10).map(m => ({ role: m.role, content: m.content }));
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: payload }) });
      const data = await res.json().catch(() => ({}));
      busy = false;
      if (res.ok && data.reply) {
        messages.push({ role: 'assistant', content: data.reply, ts: Date.now() });
      } else if (data.code === 'off' || data.code === 'limit') {
        cfg.off_message = data.error || cfg.off_message;
        if (data.code === 'off') cfg.enabled = false; else blocked = true;
      } else {
        messages.push({ role: 'assistant', content: res.status === 429 ? (data.error || S.error) : S.error, ts: Date.now(), error: true });
      }
    } catch {
      busy = false;
      messages.push({ role: 'assistant', content: S.error, ts: Date.now(), error: true });
    }
    save(); renderAll();
    if (open && !els.input.disabled) els.input.focus();
  }

  function retryLast() {
    while (messages.length && messages[messages.length - 1].error) messages.pop();
    if (messages.length && messages[messages.length - 1].role === 'user') { save(); request(); }
  }

  function newConversation() {
    messages = []; blocked = false; busy = false; save(); renderAll();
    if (!els.input.disabled) els.input.focus();
  }

  async function copyReply(btn) {
    const m = messages[Number(btn.dataset.i)];
    if (!m) return;
    let ok = false;
    try { await navigator.clipboard.writeText(m.content); ok = true; }
    catch {
      try {
        const ta = document.createElement('textarea'); ta.value = m.content; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select(); ok = document.execCommand('copy'); ta.remove();
      } catch { ok = false; }
    }
    if (ok) {
      btn.innerHTML = UI.icon('check', 15); btn.setAttribute('aria-label', S.copied);
      setTimeout(() => { btn.innerHTML = UI.icon('copy', 15); btn.setAttribute('aria-label', S.copy); }, 1500);
    }
  }

  // ─── Suggestion box ──────────────────────────────────────────────────────────
  async function submitSuggestion() {
    const text = document.getElementById('cw-s-text');
    const email = document.getElementById('cw-s-email');
    const msg = document.getElementById('cw-s-msg');
    if (!text.value.trim()) { text.focus(); return; }
    const btn = document.getElementById('cw-s-send');
    btn.disabled = true;
    try {
      await App.api('/api/suggest', { method: 'POST', body: { content: text.value.trim(), email: email.value.trim() } });
      text.value = ''; email.value = '';
      msg.className = 'notice notice--ok'; msg.textContent = S.suggestThanks;
    } catch {
      msg.className = 'notice notice--error'; msg.textContent = S.suggestFail;
    } finally { btn.disabled = false; }
  }

  return { init };
})();
