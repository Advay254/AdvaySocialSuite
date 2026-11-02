/*
 * AdvaySocialSuite 1.2.0 admin: the Themes tab.
 * Loaded after admin.js. It registers with the settings save bar, so one Save button saves everything,
 * and it keeps its own state. The colour rules come from theme-core.js, the same file the public site uses.
 */
(function () {
  'use strict';
  if (typeof Admin === 'undefined' || !Admin.ext || typeof AdvayTheme === 'undefined') return;
  const T = AdvayTheme, ext = Admin.ext, esc = ext.esc;
  const host = document.getElementById('themes-host');
  if (!host) return;

  let st = null, previewId = null;
  const MODES = [['shift', 'Shift between themes', 'The site changes theme on a timer. Every visitor sees the same theme at the same moment.'], ['fixed', 'One fixed theme', 'The site always uses the theme you pick.'], ['random', 'Random per visit', 'Each visit starts with a random theme from the rotation, never the same one twice in a row.']];
  const UNITS = [['s', 'seconds', 1], ['m', 'minutes', 60], ['h', 'hours', 3600]];

  const newId = () => 'c_' + Array.from(crypto.getRandomValues(new Uint8Array(4))).map(b => b.toString(16).padStart(2, '0')).join('');
  const allDefs = () => [...st.presets, ...st.custom];
  const byId = id => allDefs().find(d => d.id === id);
  const resolved = d => T.resolve(d);

  function splitInterval(sec) {
    if (sec % 3600 === 0 && sec >= 3600) return { n: sec / 3600, u: 'h' };
    if (sec % 60 === 0 && sec >= 60) return { n: sec / 60, u: 'm' };
    return { n: sec, u: 's' };
  }

  // A small picture of the public site in a theme.
  function mock(def) {
    const t = resolved(def);
    if (!t) return '<div class="tp-bad">Choose two valid colours to see a preview.</div>';
    return `<div class="tp" style="background:${t.bg};color:${t.text};border-color:${t.s2}">
      <div class="tp-head" style="background:${t.s1};border-color:${t.s2}"><b>Name<span style="color:${t.accentT}">.</span></b><span style="color:${t.muted}">Tools</span><span style="color:${t.muted}">About</span></div>
      <div class="tp-h">Big <span style="color:${t.accentT}">heading</span><span style="color:${t.accent2T}">.</span></div>
      <div class="tp-p" style="color:${t.muted}">A short line of softer text.</div>
      <div class="tp-row"><span class="tp-btn" style="background:${t.accent};color:${t.ink}">Button</span>
        <span class="tp-card" style="background:${t.s1};border-color:${t.s2};color:${t.text}">Card</span>
        <span class="tp-card" style="background:${t.accent2};color:${t.ink2};border-color:transparent">Second</span></div>
    </div>`;
  }
  const dots = d => { const t = resolved(d); return t ? `<span class="tsw" style="background:${t.bg};border-color:${t.s2}"><i style="background:${t.accent}"></i><i style="background:${t.accent2}"></i></span>` : ''; };

  function colourField(label, key, i, value) {
    const ok = T.normHex(value);
    return `<div class="tf"><label class="a-label">${label}</label><div class="tf-row"><input class="a-input" data-ci="${i}" data-f="${key}" value="${esc(value)}" maxlength="7" spellcheck="false" autocomplete="off" aria-label="${label} for custom theme ${i + 1}">
      <input type="color" data-ci="${i}" data-pick="${key}" value="${ok || '#888888'}" aria-label="Pick ${label.toLowerCase()} for custom theme ${i + 1}"></div></div>`;
  }

  function customRow(c, i) {
    const o = c.overrides || {};
    return `<div class="a-card tc" data-row="${i}">
      <div class="tc-top">${dots(c)}<input class="a-input" data-ci="${i}" data-f="name" value="${esc(c.name)}" maxlength="${st.limits.name}" aria-label="Name of custom theme ${i + 1}" placeholder="Theme name"><button type="button" class="btn-a-danger" data-act="remove" data-ci="${i}">Remove</button></div>
      <div class="tc-grid">
        ${colourField('Accent', 'accent', i, c.accent)}${colourField('Second accent', 'accent2', i, c.accent2)}
        <div class="tf"><label class="a-label">Mood</label><select class="a-input" data-ci="${i}" data-f="mood" aria-label="Mood of custom theme ${i + 1}">${T.MOODS.map(m => `<option value="${m}"${c.mood === m ? ' selected' : ''}>${T.MOOD_LABELS[m]}</option>`).join('')}</select></div>
      </div>
      <div class="tc-prev" data-prev="${i}"></div>
      <div class="tc-warn" data-warn="${i}" role="status" aria-live="polite"></div>
      <details class="tc-adv"><summary>Advanced: set each colour by hand</summary>
        <p class="hint-s">Leave a box empty to use the calculated colour. Low contrast is flagged above.</p>
        <div class="tc-grid">${T.KEYS.map(k => `<div class="tf"><label class="a-label">${k === 's1' ? 'Card' : k === 's2' ? 'Raised card' : k === 'bg' ? 'Background' : k === 'text' ? 'Text' : k === 'muted' ? 'Soft text' : k === 'ink' ? 'Text on accent' : k === 'accent' ? 'Accent' : 'Second accent'}</label><input class="a-input" data-ci="${i}" data-ov="${k}" value="${esc(o[k] || '')}" maxlength="7" placeholder="${esc((T.derive(c) || {})[k] || '')}" spellcheck="false" autocomplete="off"></div>`).join('')}</div>
      </details>
      <div class="ai-err" data-for="custom.${i}" style="font-size:11px;color:#f87171;margin-top:6px;"></div>
    </div>`;
  }

  function draw() {
    const defs = allDefs();
    const iv = splitInterval(st.interval);
    const fixed = st.mode === 'fixed', shift = st.mode === 'shift';
    host.innerHTML = `
      <p class="hint-s" style="margin-bottom:14px">Choose how the public site is coloured. Colours change smoothly. Nothing here changes your content.</p>
      <div class="a-group"><span class="a-label">How the site is coloured</span>
        <div class="tmodes" role="radiogroup" aria-label="Theme mode">${MODES.map(([v, l, d]) => `<label class="tmode${st.mode === v ? ' on' : ''}"><input type="radio" name="tmode" value="${v}"${st.mode === v ? ' checked' : ''}><span><b>${l}</b><small>${d}</small></span></label>`).join('')}</div></div>
      ${fixed ? `<div class="a-group"><label class="a-label" for="t-active">Fixed theme</label><select id="t-active" class="a-input">${defs.map(d => `<option value="${esc(d.id)}"${st.active === d.id ? ' selected' : ''}>${esc(d.name)}</option>`).join('')}</select></div>` : `
      <div class="a-group"><span class="a-label">Themes in the rotation</span>
        <div class="trot">${defs.map(d => `<label class="trow"><input type="checkbox" data-rot="${esc(d.id)}"${st.rotation.includes(d.id) ? ' checked' : ''}>${dots(d)}<span>${esc(d.name)}</span></label>`).join('')}</div>
        <p class="hint-s">If none are ticked the site uses the theme chosen below as its fallback.</p></div>
      <div class="a-group"><label class="a-label" for="t-active">Fallback theme</label><select id="t-active" class="a-input">${defs.map(d => `<option value="${esc(d.id)}"${st.active === d.id ? ' selected' : ''}>${esc(d.name)}</option>`).join('')}</select></div>`}
      ${shift ? `<div class="a-group"><span class="a-label">Time between changes</span><div class="tf-row" style="max-width:320px"><input id="t-iv-n" class="a-input" type="number" min="1" step="1" value="${iv.n}" aria-label="Time between theme changes"><select id="t-iv-u" class="a-input" aria-label="Unit">${UNITS.map(([k, l]) => `<option value="${k}"${iv.u === k ? ' selected' : ''}>${l}</option>`).join('')}</select></div>
        <div class="ai-err" data-for="interval" style="font-size:11px;color:#f87171;margin-top:4px;"></div><p class="hint-s">Anything from 5 seconds to one day.</p></div>` : ''}
      <div class="tc-grid">
        <div class="a-group"><label class="a-label" for="t-trans">How a change looks</label><select id="t-trans" class="a-input"><option value="instant"${st.transition === 'instant' ? ' selected' : ''}>Instant</option><option value="smooth"${st.transition === 'smooth' ? ' selected' : ''}>Smooth (under a second)</option><option value="slow"${st.transition === 'slow' ? ' selected' : ''}>Slow (two seconds)</option></select></div>
        ${shift ? `<div class="a-group"><label class="a-label" for="t-sync">Keep every visitor in step</label><select id="t-sync" class="a-input"><option value="on"${st.sync ? ' selected' : ''}>On: everyone sees the same theme</option><option value="off"${!st.sync ? ' selected' : ''}>Off: each visit starts its own timer</option></select></div>` : ''}
        <div class="a-group"><label class="a-label" for="t-panel">Theme panel for visitors</label><select id="t-panel" class="a-input"><option value="on"${st.panel ? ' selected' : ''}>Show it (pause, pick a theme)</option><option value="off"${!st.panel ? ' selected' : ''}>Hide it</option></select></div>
      </div>
      <div class="a-group"><span class="a-label">Preview</span><div class="tf-row" style="max-width:320px;margin-bottom:8px"><select id="t-prev" class="a-input" aria-label="Theme to preview">${defs.map(d => `<option value="${esc(d.id)}"${previewId === d.id ? ' selected' : ''}>${esc(d.name)}</option>`).join('')}</select></div><div id="t-mock" style="max-width:420px">${mock(byId(previewId) || defs[0])}</div></div>
      <div style="margin:22px 0 8px;font-size:11px;font-weight:700;color:#e8edf8;letter-spacing:.5px;">Your own themes (${st.custom.length} of ${st.limits.custom})</div>
      <p class="hint-s" style="margin-bottom:10px">Pick two colours and a mood. The background, cards, text and button text are worked out for you and checked for contrast.</p>
      <div id="t-custom">${st.custom.map(customRow).join('')}</div>
      ${st.custom.length < st.limits.custom ? '<button type="button" class="btn-a-ghost" data-act="add">Add a theme</button>' : ''}
      <div class="ai-err" data-for="custom" style="font-size:11px;color:#f87171;margin-top:6px;"></div>`;
    st.custom.forEach((c, i) => paintRow(i));
  }

  function paintRow(i) {
    const c = st.custom[i], row = host.querySelector(`[data-row="${i}"]`); if (!row) return;
    row.querySelector('[data-prev]').innerHTML = mock(c);
    const sw = row.querySelector('.tsw'); if (sw) sw.outerHTML = dots(c) || '<span class="tsw"></span>';
    const chk = T.check(c);
    row.querySelector('[data-warn]').innerHTML = chk.warnings.map(w => `<div class="tw">${esc(w)}</div>`).join('') + chk.notes.map(n => `<div class="tn">${esc(n)}</div>`).join('');
    const ph = T.derive(c) || {};
    row.querySelectorAll('[data-ov]').forEach(inp => { inp.placeholder = ph[inp.dataset.ov] || ''; });
  }
  function repaintMock() { const d = byId(previewId) || allDefs()[0]; const m = host.querySelector('#t-mock'); if (m) m.innerHTML = mock(d); }

  // ─── Events ────────────────────────────────────────────────────────────────
  host.addEventListener('change', e => {
    const t = e.target;
    if (t.name === 'tmode') { st.mode = t.value; ext.markDirty(); draw(); return; }
    if (t.dataset.rot) { const id = t.dataset.rot; st.rotation = t.checked ? [...st.rotation, id] : st.rotation.filter(x => x !== id); ext.markDirty(); return; }
    if (t.id === 't-active') { st.active = t.value; ext.markDirty(); return; }
    if (t.id === 't-trans') { st.transition = t.value; ext.markDirty(); return; }
    if (t.id === 't-sync') { st.sync = t.value === 'on'; ext.markDirty(); return; }
    if (t.id === 't-panel') { st.panel = t.value === 'on'; ext.markDirty(); return; }
    if (t.id === 't-iv-u') { readInterval(); return; }
    if (t.id === 't-prev') { previewId = t.value; repaintMock(); return; }
    if (t.dataset.f === 'mood') { st.custom[Number(t.dataset.ci)].mood = t.value; ext.markDirty(); paintRow(Number(t.dataset.ci)); repaintMock(); }
  });
  host.addEventListener('input', e => {
    const t = e.target;
    if (t.id === 't-iv-n') { readInterval(); return; }
    const i = Number(t.dataset.ci);
    if (Number.isNaN(i) || !st.custom[i]) return;
    const c = st.custom[i];
    if (t.dataset.f === 'name') { c.name = t.value; ext.markDirty(); return; }
    if (t.dataset.f === 'accent' || t.dataset.f === 'accent2') {
      const f = t.dataset.f; c[f] = t.value.trim();
      const ok = T.normHex(c[f]); const pick = host.querySelector(`[data-pick="${f}"][data-ci="${i}"]`);
      if (ok && pick) pick.value = ok;
      t.setAttribute('aria-invalid', ok ? 'false' : 'true');
      ext.markDirty(); paintRow(i); repaintMock(); return;
    }
    if (t.dataset.pick) { const f = t.dataset.pick; c[f] = t.value; const txt = host.querySelector(`[data-f="${f}"][data-ci="${i}"]`); if (txt) txt.value = t.value; ext.markDirty(); paintRow(i); repaintMock(); return; }
    if (t.dataset.ov) {
      const v = t.value.trim(); c.overrides = c.overrides || {};
      if (!v) delete c.overrides[t.dataset.ov]; else c.overrides[t.dataset.ov] = v;
      t.setAttribute('aria-invalid', !v || T.normHex(v) ? 'false' : 'true');
      ext.markDirty(); paintRow(i); repaintMock();
    }
  });
  host.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    if (b.dataset.act === 'add') {
      if (st.custom.length >= st.limits.custom) return;
      const accent = '#7c9cff';
      st.custom.push({ id: newId(), name: 'My theme ' + (st.custom.length + 1), accent, accent2: T.companion(accent), mood: 'dark' });
      ext.markDirty(); draw();
      const last = host.querySelector('[data-row]:last-child [data-f="name"]'); if (last) last.focus();
    } else if (b.dataset.act === 'remove') {
      const i = Number(b.dataset.ci), c = st.custom[i]; if (!c) return;
      if (!confirm(`Remove the theme "${c.name}"? If it is the active theme, the site goes back to ${st.presets[0].name}.`)) return;
      st.custom.splice(i, 1);
      st.rotation = st.rotation.filter(id => id !== c.id);
      if (st.active === c.id) st.active = T.DEFAULT_ID;
      if (previewId === c.id) previewId = st.active;
      ext.markDirty(); draw();
    }
  });
  function readInterval() {
    const n = Number(host.querySelector('#t-iv-n').value), u = UNITS.find(x => x[0] === host.querySelector('#t-iv-u').value) || UNITS[0];
    const sec = Math.round(n * u[2]);
    st.interval = Number.isFinite(sec) ? sec : 0;
    ext.showFieldError('interval', st.interval >= st.limits.minInterval && st.interval <= st.limits.maxInterval ? '' : `Use between ${st.limits.minInterval} seconds and one day.`);
    ext.markDirty();
  }

  // ─── Load and save (called by the settings save bar) ───────────────────────
  function fromServer(d) {
    st = { mode: d.mode, active: d.active, rotation: d.rotation.slice(), interval: d.interval, transition: d.transition, sync: d.sync, panel: d.visitorPanel, presets: d.presets, custom: d.custom.map(c => ({ ...c, overrides: { ...(c.overrides || {}) } })), limits: d.limits };
    if (!previewId || !byId(previewId)) previewId = st.active;
  }
  async function load() {
    try { fromServer(await ext.api('/api/admin/themes')); draw(); }
    catch (e) { host.innerHTML = '<p class="hint-s" style="color:#f87171">The theme settings did not load. Reload the page and try again.</p>'; }
  }
  // Returns true when saved (or nothing to save).
  async function save() {
    if (!st) return true;
    const body = { mode: st.mode, active: st.active, rotation: st.rotation, interval: st.interval, transition: st.transition, sync: st.sync, visitor_panel: st.panel, custom: st.custom.map(c => { const o = {}; T.KEYS.forEach(k => { if (c.overrides && c.overrides[k]) o[k] = c.overrides[k]; }); const out = { id: c.id, name: c.name.trim(), accent: c.accent, accent2: c.accent2, mood: c.mood }; if (Object.keys(o).length) out.overrides = o; return out; }) };
    try { fromServer(await ext.api('/api/admin/themes', { method: 'PUT', body })); draw(); return true; }
    catch (err) {
      if (err.fields) Object.entries(err.fields).forEach(([k, m]) => { const top = k.match(/^custom\.\d+/); ext.showFieldError(top ? top[0] : k, m); });
      ext.toast(err.message, false);
      return false;
    }
  }
  ext.register({ load, save });

  // Styles for this tab only.
  const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = '/css/admin-themes.css'; document.head.appendChild(css);
})();
