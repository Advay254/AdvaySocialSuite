/* AdvaySocialSuite Admin Dashboard */
const Admin = (() => {
  let token = '';
  let unsavedChanges = false;

  function markDirty() { unsavedChanges = true; updateSaveBar(); }
  function markClean() { unsavedChanges = false; updateSaveBar(); }
  // Settings screen action bar: keeps the indicator and the Discard button in step with unsaved changes.
  function updateSaveBar(note) {
    const state = document.getElementById('save-state');
    if (!state) return;
    state.textContent = note || (unsavedChanges ? 'You have unsaved changes' : 'All changes saved');
    state.classList.toggle('is-dirty', unsavedChanges && !note);
    const d = document.getElementById('settings-discard');
    if (d) d.disabled = !unsavedChanges;
  }
  window.addEventListener('beforeunload', e => { if (unsavedChanges) { e.preventDefault(); e.returnValue = ''; } });

  async function login() {
    const user = document.getElementById('login-user').value.trim();
    const pass = document.getElementById('login-pass').value.trim();
    const btn = document.getElementById('login-btn');
    const err = document.getElementById('login-err');
    if (!user || !pass) { showErr(err, 'Please enter credentials.'); return; }
    btn.textContent = 'Signing in...'; btn.disabled = true;
    try {
      const res = await fetch('/api/admin/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: user, password: pass }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      token = data.token;
      sessionStorage.setItem('adv_admin_token', token);
      document.getElementById('login-screen').classList.add('hidden');
      const panel = document.getElementById('admin-panel');
      panel.classList.remove('hidden'); panel.style.display = 'block';
      goTo('dashboard', document.querySelector('[data-section="dashboard"]'));
    } catch (e) { showErr(err, e.message); }
    finally { btn.textContent = 'Sign In'; btn.disabled = false; }
  }

  function logout() {
    if (unsavedChanges && !confirm('You have unsaved changes. Leave anyway?')) return;
    token = ''; markClean();
    sessionStorage.removeItem('adv_admin_token');
    const panel = document.getElementById('admin-panel');
    panel.classList.add('hidden'); panel.style.display = 'none';
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('login-user').value = '';
    document.getElementById('login-pass').value = '';
  }

  function showErr(el, msg) { el.textContent = msg; el.classList.remove('hidden'); setTimeout(() => el.classList.add('hidden'), 4000); }

  let currentSection = null;
  function goTo(section, el) {
    if (unsavedChanges && currentSection && currentSection !== section) {
      if (!confirm('You have unsaved changes. Leave this section?')) return;
      markClean();
    }
    currentSection = section;
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(`section-${section}`)?.classList.add('active');
    if (el) el.classList.add('active');
    const titles = { dashboard:'Dashboard', profile:'Profile', repos:'Repositories', tools:'Tools', settings:'Site Settings', collabs:'Collab Requests', suggestions:'Suggestions', templates:'Templates' };
    document.getElementById('topbar-title').textContent = titles[section] || section;
    if (section === 'dashboard') loadDashboard();
    else if (section === 'profile') loadProfile();
    else if (section === 'repos') loadRepos();
    else if (section === 'tools') loadTools();
    else if (section === 'settings') loadSettings();
    else if (section === 'collabs') loadCollabs();
    else if (section === 'suggestions') loadSuggestions();
    else if (section === 'templates') loadTemplates();
    closeSidebar();
  }

  async function api(path, opts = {}) {
    const res = await fetch(path, { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...opts.headers }, ...opts, body: opts.body ? JSON.stringify(opts.body) : undefined });
    if (res.status === 401) { logout(); return null; }
    if (!res.ok) { const e = await res.json().catch(() => ({ error: 'Request failed' })); const ex = new Error(e.error); if (e.fields) ex.fields = e.fields; throw ex; }
    return res.json();
  }

  function toast(msg, ok = true) {
    const t = document.getElementById('a-toast');
    t.textContent = msg;
    t.style.cssText = `display:block;background:${ok?'rgba(16,185,129,.15)':'rgba(239,68,68,.15)'};border:1px solid ${ok?'rgba(16,185,129,.3)':'rgba(239,68,68,.3)'};color:${ok?'#10b981':'#f87171'};`;
    clearTimeout(Admin._tt); Admin._tt = setTimeout(() => t.style.display = 'none', 3000);
  }

  function fmt(d) { return new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }); }
  // Escapes text for use in HTML text and in quoted attributes (including single quotes).
  function esc(s) { return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  // Links built from stored data only ever use http or https.
  function safeHref(u) { try { const x = new URL(String(u||'').trim()); return x.protocol==='https:'||x.protocol==='http:' ? x.href : '#'; } catch { return '#'; } }
  function parseTags(t) { try { return typeof t==='string'?JSON.parse(t):(t||[]); } catch { return []; } }
  function gv(id) { const el=document.getElementById(id); return el?el.value:''; }
  function sv(id,val) { const el=document.getElementById(id); if(el) el.value=val??''; }
  // For div/span stat elements - use textContent not .value
  function st(id,val) { const el=document.getElementById(id); if(el) el.textContent=val??'-'; }

  // ─── Dashboard ─────────────────────────────────────────────────────────────
  async function loadDashboard() {
    try {
      const s = await api('/api/admin/stats'); if (!s) return;
      st('s-repos', s.repos);
      st('s-tools', s.tools);
      st('s-collabs', s.unread_collabs);
      st('s-suggestions', s.unread_suggestions);
      if (s.unread_collabs > 0) { const b = document.getElementById('collabs-badge'); b.textContent = s.unread_collabs; b.style.display = 'inline'; }
      if (s.unread_suggestions > 0) { const b = document.getElementById('suggestions-badge'); b.textContent = s.unread_suggestions; b.style.display = 'inline'; }
      const views = document.getElementById('dash-views');
      views.innerHTML = s.top_pages?.length
        ? `<div style="display:flex;flex-direction:column;gap:8px;">${s.top_pages.map(p=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:rgba(255,255,255,.02);border-radius:8px;border:1px solid rgba(255,255,255,.05);"><span style="font-family:'JetBrains Mono',monospace;font-size:12px;color:#7a8499;">/${esc(p.page)}</span><span style="font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;color:#00e5ff;">${Number(p.count)}</span></div>`).join('')}</div>`
        : `<span style="color:#7a8499;font-size:13px;">No page views yet.</span>`;
    } catch (e) { console.error(e); }
  }

  // ─── Profile ───────────────────────────────────────────────────────────────
  async function loadProfile() {
    try {
      const p = await api('/api/admin/profile'); if (!p) return;
      ['name','tagline','bio','location','github_url','linkedin_url','twitter_url','youtube_url','discord_url','tiktok_url','bmc_url','avatar_url'].forEach(k => sv(`pf-${k}`, p[k]));
      try { sv('pf-skills', (typeof p.skills==='string'?JSON.parse(p.skills):p.skills||[]).join(', ')); } catch { sv('pf-skills',''); }
      try { sv('pf-principles', (typeof p.principles==='string'?JSON.parse(p.principles):p.principles||[]).join(', ')); } catch { sv('pf-principles',''); }
      document.getElementById('profile-form')?.querySelectorAll('input,textarea').forEach(el=>el.addEventListener('input',markDirty));
    } catch (e) { console.error('loadProfile:', e); }
  }

  async function saveProfile(e) {
    e.preventDefault();
    const btn = document.getElementById('profile-save-btn');
    btn.disabled = true; btn.textContent = 'Saving...';
    const skills = gv('pf-skills').split(',').map(s=>s.trim()).filter(Boolean);
    const principles = gv('pf-principles').split(',').map(s=>s.trim()).filter(Boolean);
    const body = { name:gv('pf-name'), tagline:gv('pf-tagline'), bio:gv('pf-bio'), location:gv('pf-location'), github_url:gv('pf-github_url'), linkedin_url:gv('pf-linkedin_url'), twitter_url:gv('pf-twitter_url'), youtube_url:gv('pf-youtube_url'), discord_url:gv('pf-discord_url'), tiktok_url:gv('pf-tiktok_url'), bmc_url:gv('pf-bmc_url'), avatar_url:gv('pf-avatar_url'), skills:JSON.stringify(skills), principles:JSON.stringify(principles) };
    try {
      await api('/api/admin/profile', { method:'PUT', body });
      toast('Profile saved!'); markClean();
      const msg = document.getElementById('profile-msg');
      msg.classList.remove('hidden'); setTimeout(()=>msg.classList.add('hidden'),3000);
    } catch (err) { toast(err.message, false); }
    finally { btn.disabled=false; btn.textContent='Save Profile'; }
  }

  // ─── Repos ─────────────────────────────────────────────────────────────────
  let reposData = [];
  async function loadRepos() {
    try {
      reposData = await api('/api/admin/repos') || [];
      const tbody = document.getElementById('repos-tbody');
      if (!reposData.length) { tbody.innerHTML=`<tr><td colspan="6" style="text-align:center;color:#7a8499;padding:24px;">No repos yet. Click "Add Repo" to start.</td></tr>`; return; }
      tbody.innerHTML = reposData.map(r=>`
        <tr>
          <td style="font-weight:600;color:#e8edf8;max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(r.title)}</td>
          <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${r.url?`<a href="${esc(safeHref(r.url))}" target="_blank" style="color:#00e5ff;font-size:11px;font-family:'JetBrains Mono';">${esc(r.url.replace('https://github.com/',''))}</a>`:'<span style="color:#7a8499;">-</span>'}</td>
          <td>${parseTags(r.tags).slice(0,2).map(t=>`<span style="padding:2px 6px;border-radius:4px;font-size:10px;background:rgba(139,92,246,.1);color:#8b5cf6;border:1px solid rgba(139,92,246,.2);margin-right:3px;">${esc(t)}</span>`).join('')}</td>
          <td style="font-family:'JetBrains Mono';font-size:12px;">${r.display_order}</td>
          <td>${r.visible?`<span class="badge-on">Visible</span>`:`<span class="badge-off">Hidden</span>`}</td>
          <td><div style="display:flex;gap:6px;">
            <button class="btn-a-ghost" onclick="Admin.openRepoModal(${Number(r.id)})" style="padding:5px 10px;font-size:11px;">Edit</button>
            <button class="btn-a-danger" onclick="Admin.deleteRepo(${Number(r.id)})" style="padding:5px 10px;font-size:11px;">Delete</button>
          </div></td>
        </tr>`).join('');
    } catch (e) { console.error('loadRepos:', e); }
  }

  function openRepoModal(id) {
    document.getElementById('repo-modal').style.display = 'flex';
    if (id) {
      const r = reposData.find(x=>x.id===id); if (!r) return;
      document.getElementById('repo-modal-title').textContent = 'Edit Repository';
      sv('repo-edit-id',id); sv('rf-title',r.title); sv('rf-url',r.url);
      sv('rf-description',r.description); sv('rf-tags',parseTags(r.tags).join(', '));
      sv('rf-readme',r.readme_md); sv('rf-order',r.display_order);
      document.getElementById('rf-visible').checked = r.visible !== false;
    } else {
      document.getElementById('repo-modal-title').textContent = 'Add Repository';
      sv('repo-edit-id',''); document.getElementById('repo-form').reset();
      document.getElementById('rf-visible').checked = true;
    }
  }

  async function saveRepo(e) {
    e.preventDefault();
    const id = gv('repo-edit-id');
    const body = { title:gv('rf-title'), url:gv('rf-url'), description:gv('rf-description'), readme_md:gv('rf-readme'), tags:JSON.stringify(gv('rf-tags').split(',').map(s=>s.trim()).filter(Boolean)), display_order:parseInt(gv('rf-order'))||0, visible:document.getElementById('rf-visible').checked };
    try {
      if (id) await api(`/api/admin/repos/${id}`,{method:'PUT',body});
      else await api('/api/admin/repos',{method:'POST',body});
      toast('Repository saved!'); closeModal('repo-modal'); loadRepos();
    } catch (err) { toast(err.message, false); }
  }

  async function deleteRepo(id) {
    const row = reposData.find(x => x.id === id);
    if (!confirm(`Delete "${row ? row.title : 'this repository'}"?`)) return;
    try { await api(`/api/admin/repos/${id}`,{method:'DELETE'}); toast('Deleted.'); loadRepos(); }
    catch (err) { toast(err.message, false); }
  }

  // ─── Tools ─────────────────────────────────────────────────────────────────
  let toolsData = [];
  async function loadTools() {
    try {
      toolsData = await api('/api/admin/tools') || [];
      const tbody = document.getElementById('tools-tbody');
      if (!toolsData.length) { tbody.innerHTML=`<tr><td colspan="7" style="text-align:center;color:#7a8499;padding:24px;">No tools yet.</td></tr>`; return; }
      tbody.innerHTML = toolsData.map(t=>`
        <tr>
          <td style="font-size:20px;text-align:center;">${Icons.svg(t.icon||'wrench',{size:20})}</td>
          <td style="font-weight:600;color:#e8edf8;">${esc(t.title)}</td>
          <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${t.url?`<a href="${esc(safeHref(t.url))}" target="_blank" style="color:#00e5ff;font-size:11px;font-family:'JetBrains Mono';">${esc(t.url)}</a>`:'-'}</td>
          <td style="font-size:12px;color:#7a8499;">${esc(t.category||'-')}</td>
          <td>${t.status==='active'?`<span class="badge-on">Active</span>`:`<span class="badge-off">Inactive</span>`}</td>
          <td style="font-family:'JetBrains Mono';font-size:12px;">${t.display_order}</td>
          <td><div style="display:flex;gap:6px;">
            <button class="btn-a-ghost" onclick="Admin.openToolModal(${Number(t.id)})" style="padding:5px 10px;font-size:11px;">Edit</button>
            <button class="btn-a-danger" onclick="Admin.deleteTool(${Number(t.id)})" style="padding:5px 10px;font-size:11px;">Delete</button>
          </div></td>
        </tr>`).join('');
    } catch (e) { console.error('loadTools:', e); }
  }

  function openToolModal(id) {
    document.getElementById('tool-modal').style.display = 'flex';
    if (id) {
      const t = toolsData.find(x=>x.id===id); if (!t) return;
      document.getElementById('tool-modal-title').textContent = 'Edit Tool';
      sv('tool-edit-id',id); setToolIcon(t.icon); sv('tf-title',t.title);
      sv('tf-url',t.url); sv('tf-description',t.description);
      sv('tf-category',t.category); sv('tf-status',t.status); sv('tf-order',t.display_order);
    } else {
      document.getElementById('tool-modal-title').textContent = 'Add Tool';
      sv('tool-edit-id',''); document.getElementById('tool-form').reset(); setToolIcon(Icons.categoryDefault(gv('tf-category')||'tool'));
    }
  }

  function setToolIcon(value) {
    const v = Icons.has(value) ? value : Icons.categoryDefault(gv('tf-category')||'tool');
    sv('tf-icon', v);
    document.getElementById('tf-icon-preview').innerHTML = Icons.svg(v, { size: 22 });
  }

  async function saveTool(e) {
    e.preventDefault();
    const id = gv('tool-edit-id');
    const body = { icon:gv('tf-icon'), title:gv('tf-title'), url:gv('tf-url'), description:gv('tf-description'), category:gv('tf-category'), status:gv('tf-status'), display_order:parseInt(gv('tf-order'))||0 };
    try {
      if (id) await api(`/api/admin/tools/${id}`,{method:'PUT',body});
      else await api('/api/admin/tools',{method:'POST',body});
      toast('Tool saved!'); closeModal('tool-modal'); loadTools();
    } catch (err) { toast(err.message, false); }
  }

  async function deleteTool(id) {
    const row = toolsData.find(x => x.id === id);
    if (!confirm(`Delete "${row ? row.title : 'this tool'}"?`)) return;
    try { await api(`/api/admin/tools/${id}`,{method:'DELETE'}); toast('Deleted.'); loadTools(); }
    catch (err) { toast(err.message, false); }
  }

  // ─── Templates ─────────────────────────────────────────────────────────────
  let templatesData = [];
  async function loadTemplates() {
    try {
      templatesData = await api('/api/admin/templates') || [];
      const tbody = document.getElementById('templates-tbody');
      if (!tbody) return;
      if (!templatesData.length) { tbody.innerHTML=`<tr><td colspan="7" style="text-align:center;color:#7a8499;padding:24px;">No templates yet.</td></tr>`; return; }
      tbody.innerHTML = templatesData.map(t=>`
        <tr>
          <td style="font-weight:600;color:#e8edf8;max-width:120px;">${esc(t.title)}</td>
          <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;font-size:12px;color:#7a8499;">${esc((t.description||'').substring(0,60))}${(t.description||'').length>60?'…':''}</td>
          <td>${t.json_url?`<a href="${esc(safeHref(t.json_url))}" target="_blank" style="color:#00e5ff;font-size:11px;">link</a>`:'-'}</td>
          <td>${parseTags(t.tags).slice(0,2).map(tg=>`<span style="padding:2px 6px;border-radius:4px;font-size:10px;background:rgba(0,229,255,.08);color:#00e5ff;border:1px solid rgba(0,229,255,.15);margin-right:3px;">${esc(tg)}</span>`).join('')}</td>
          <td style="font-family:'JetBrains Mono';font-size:12px;">${t.display_order}</td>
          <td>${t.visible?`<span class="badge-on">Visible</span>`:`<span class="badge-off">Hidden</span>`}</td>
          <td><div style="display:flex;gap:6px;">
            <button class="btn-a-ghost" onclick="Admin.openTemplateModal(${Number(t.id)})" style="padding:5px 10px;font-size:11px;">Edit</button>
            <button class="btn-a-danger" onclick="Admin.deleteTemplate(${Number(t.id)})" style="padding:5px 10px;font-size:11px;">Delete</button>
          </div></td>
        </tr>`).join('');
    } catch (e) { console.error('loadTemplates:', e); }
  }

  function openTemplateModal(id) {
    document.getElementById('template-modal').style.display = 'flex';
    if (id) {
      const t = templatesData.find(x=>x.id===id); if (!t) return;
      document.getElementById('template-modal-title').textContent = 'Edit Template';
      sv('template-edit-id',id); sv('tmf-title',t.title); sv('tmf-description',t.description);
      sv('tmf-url',t.json_url); sv('tmf-tags',parseTags(t.tags).join(', ')); sv('tmf-order',t.display_order);
      document.getElementById('tmf-visible').checked = t.visible !== false;
    } else {
      document.getElementById('template-modal-title').textContent = 'Add Template';
      sv('template-edit-id',''); document.getElementById('template-form').reset();
      document.getElementById('tmf-visible').checked = true;
    }
  }

  async function saveTemplate(e) {
    e.preventDefault();
    const id = gv('template-edit-id');
    const body = { title:gv('tmf-title'), description:gv('tmf-description'), json_url:gv('tmf-url'), tags:JSON.stringify(gv('tmf-tags').split(',').map(s=>s.trim()).filter(Boolean)), display_order:parseInt(gv('tmf-order'))||0, visible:document.getElementById('tmf-visible').checked };
    try {
      if (id) await api(`/api/admin/templates/${id}`,{method:'PUT',body});
      else await api('/api/admin/templates',{method:'POST',body});
      toast('Template saved!'); closeModal('template-modal'); loadTemplates();
    } catch (err) { toast(err.message, false); }
  }

  async function deleteTemplate(id) {
    const row = templatesData.find(x => x.id === id);
    if (!confirm(`Delete "${row ? row.title : 'this template'}"?`)) return;
    try { await api(`/api/admin/templates/${id}`,{method:'DELETE'}); toast('Deleted.'); loadTemplates(); }
    catch (err) { toast(err.message, false); }
  }

  // ─── Settings ──────────────────────────────────────────────────────────────
  const SETTING_KEYS = ['site_name','site_tagline','meta_description','repo_count','years_exp','accent_color','icon_pack','allowed_origins','home_subheadline','philosophy_quote','philosophy_sub','timeline_1','timeline_2','timeline_3','templates_label','templates_visible','templates_subtitle','tools_subtitle','cylinder_labels','collab_subtitle','collab_intro','collab_qi_1','collab_qi_2','collab_qi_3','collab_services','webhook_url','specializations','funfact'];

  async function loadSettings() {
    try {
      const s = await api('/api/admin/settings'); if (!s) return;
      SETTING_KEYS.forEach(k=>sv(`s-${k}`,s[k]??''));
      SETTING_KEYS.forEach(k=>{ const el=document.getElementById(`s-${k}`); if(el) el.addEventListener('input',markDirty); });
      initAccentField();
      mountListEditors();
      await renderPackList();
      await loadCustomIcons();
      await loadAi();
      // Live char counter for collab_intro
      const ciEl = document.getElementById('s-collab_intro');
      const ciCount = document.getElementById('collab-intro-count');
      if (ciEl && ciCount) {
        const updateCi = () => { ciCount.textContent = ciEl.value.length + '/220'; ciCount.style.color = ciEl.value.length > 200 ? '#f87171' : '#7a8499'; };
        updateCi();
        ciEl.addEventListener('input', updateCi);
      }
    } catch (e) { console.error('loadSettings:', e); }
  }

  async function saveSettings() {
    const saveBtn = document.getElementById('settings-save');
    if (saveBtn && saveBtn.disabled) return;
    const updates = {};
    SETTING_KEYS.forEach(k=>{ updates[k]=gv(`s-${k}`); });
    clearErrors();
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving'; }
    try {
      // The AI settings are validated on their own route. Save them first so a mistake there stops everything.
      if (aiLoaded) {
        const ok = await saveAi();
        if (!ok) return;
      }
      await api('/api/admin/settings',{method:'PUT',body:updates});
      toast('Settings saved!'); markClean();
      updateSaveBar('Saved just now');
      setTimeout(()=>updateSaveBar(), 3000);
    } catch (err) {
      // The server names each setting it did not accept. Show every message next to its field.
      if (err.fields) Object.entries(err.fields).forEach(([k, m]) => showFieldError(k, m));
      else showFieldError('accent_color', err.message);
      toast(err.message, false);
    } finally {
      if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save Settings'; }
    }
  }

  // Throws away unsaved edits by loading the saved values again.
  async function discardSettings() {
    if (!unsavedChanges) return;
    if (!confirm('Discard your unsaved changes and go back to the saved settings?')) return;
    clearErrors();
    await loadSettings();
    markClean();
    toast('Changes discarded');
  }

  // ─── Accent colour field ───────────────────────────────────────────────────
  function initAccentField() {
    const input = document.getElementById('s-accent_color');
    const picker = document.getElementById('accent-preview');
    if (!input || !picker || input.dataset.bound) return;
    input.dataset.bound = '1';
    const valid = v => /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(v.trim());
    const expand = v => { v = v.trim(); return v.length === 4 ? '#' + v.slice(1).split('').map(c=>c+c).join('') : v; };
    const sync = () => { if (valid(input.value)) picker.value = expand(input.value).toLowerCase(); };
    sync();
    input.addEventListener('input', () => { sync(); showFieldError('accent_color', valid(input.value) || !input.value ? '' : 'Use a hex colour such as #0b7285.'); });
    picker.addEventListener('input', () => { input.value = picker.value; markDirty(); showFieldError('accent_color',''); });
  }

  // ─── AI Chat settings ──────────────────────────────────────────────────────
  const AI_TEXT = ['system_prompt','temperature','max_chars','daily_cap','off_message','name','launcher_label','greeting','suggestions','disclaimer'];
  let aiLoaded = false, aiState = { keySet:false, savedUrl:'', defaultPrompt:'', clearKey:false, models:[] };

  function $(id) { return document.getElementById(id); }
  function showFieldError(key, msg) {
    document.querySelectorAll(`.ai-err[data-for="${key}"]`).forEach(e => { e.textContent = msg || ''; });
  }
  function clearErrors() {
    document.querySelectorAll('.ai-err').forEach(e => { e.textContent = ''; });
    const sum = $('ai-summary'); if (sum) { sum.style.display = 'none'; sum.textContent = ''; }
  }
  function setStatus(id, msg, kind) {
    const el = $(id); if (!el) return;
    el.textContent = msg || '';
    el.style.color = kind === 'ok' ? '#34d399' : kind === 'err' ? '#f87171' : '#7a8499';
  }

  function renderKeyState(view) {
    const saved = $('ai-key-saved'), input = $('ai-api_key'), help = $('ai-key-help');
    const state = view.ai_api_key_state;
    aiState.keySet = view.ai_api_key_set === '1';
    aiState.clearKey = false;
    input.value = '';
    if (aiState.keySet && state === 'ok') {
      saved.style.display = 'flex'; input.style.display = 'none';
      $('ai-key-hint').textContent = view.ai_api_key_hint;
      help.textContent = 'A key is saved. Use Replace key to enter a new one, or Remove key to delete it.';
    } else {
      saved.style.display = 'none'; input.style.display = '';
      help.textContent = state === 'unreadable'
        ? 'The saved key can no longer be read on this server. Please paste the key again.'
        : 'The key is stored encrypted on your server and is never shown again after you save it.';
    }
  }

  function fillAi(view) {
    $('ai-enabled').checked = view.ai_enabled !== '0';
    $('ai-base_url').value = view.ai_base_url || '';
    aiState.savedUrl = view.ai_base_url || '';
    AI_TEXT.forEach(k => { const el = $('ai-' + k); if (el) el.value = view['ai_' + k] ?? ''; });
    aiState.defaultPrompt = view.default_system_prompt || '';
    $('ai-legacy').style.display = (!view.ai_base_url && view.legacy_fallback) ? 'block' : 'none';
    setModelList(view.ai_model ? [view.ai_model] : [], view.ai_model || '');
    renderKeyState(view);
    syncPreset();
  }

  function syncPreset() {
    const sel = $('ai-preset'), url = $('ai-base_url').value.trim().replace(/\/+$/, '');
    const match = Array.from(sel.options).find(o => o.value && o.value !== 'custom' && o.value === url);
    sel.value = match ? match.value : (url ? 'custom' : '');
  }

  function setModelList(models, selected) {
    aiState.models = models.slice();
    if (selected && !aiState.models.includes(selected)) aiState.models.unshift(selected);
    renderModelOptions(selected);
  }
  function renderModelOptions(selected) {
    const sel = $('ai-model');
    const q = ($('ai-model-search').value || '').trim().toLowerCase();
    const current = selected !== undefined ? selected : sel.value;
    const list = aiState.models.filter(m => !q || m.toLowerCase().includes(q) || m === current);
    sel.innerHTML = '';
    if (!aiState.models.length) {
      sel.add(new Option('Load models to choose one', ''));
    } else {
      list.forEach(m => sel.add(new Option(m, m)));
      if (!list.length) sel.add(new Option('No models match your search', ''));
    }
    if (current && list.includes(current)) sel.value = current;
    showFullModel();
  }
  // The closed dropdown may shorten long names. The full chosen name is always written out below it.
  function showFullModel() {
    const el = $('ai-model-full'); if (!el) return;
    const v = $('ai-model').value;
    el.textContent = v ? 'Selected model: ' + v : '';
  }

  async function loadAi() {
    try {
      const view = await api('/api/admin/ai');
      if (!view) return;
      fillAi(view);
      if (!aiLoaded) bindAi();
      aiLoaded = true;
    } catch (e) { console.error('loadAi:', e); }
  }

  function typedKey() { const k = $('ai-api_key'); return k && k.style.display !== 'none' ? k.value.trim() : ''; }

  function bindAi() {
    const dirty = () => markDirty();
    ['ai-enabled','ai-base_url','ai-api_key','ai-model','ai-system_prompt', ...AI_TEXT.map(k=>'ai-'+k)].forEach(id => { const el = $(id); if (el) el.addEventListener('input', dirty); });
    $('ai-enabled').addEventListener('change', dirty);

    $('ai-preset').addEventListener('change', e => {
      const v = e.target.value;
      if (v && v !== 'custom') { $('ai-base_url').value = v; markDirty(); showFieldError('ai_base_url',''); }
      if (v === 'custom') $('ai-base_url').focus();
    });
    $('ai-base_url').addEventListener('input', () => { syncPreset(); showFieldError('ai_base_url',''); });
    $('ai-model-search').addEventListener('input', () => renderModelOptions());
    $('ai-model').addEventListener('change', showFullModel);

    $('ai-key-replace').addEventListener('click', () => {
      $('ai-key-saved').style.display = 'none'; const k = $('ai-api_key'); k.style.display = ''; k.focus(); aiState.clearKey = false; markDirty();
    });
    $('ai-key-clear').addEventListener('click', () => {
      if (!confirm('Remove the saved API key? The assistant stops working until you add a new one. This takes effect when you save.')) return;
      aiState.clearKey = true; $('ai-key-hint').textContent = 'Key will be removed when you save'; markDirty();
    });
    $('ai-prompt-reset').addEventListener('click', () => {
      if (!confirm('Replace the system prompt text with the default? This takes effect when you save.')) return;
      $('ai-system_prompt').value = aiState.defaultPrompt; markDirty();
    });

    $('ai-load-models').addEventListener('click', loadModels);
    $('ai-test').addEventListener('click', testConnection);
  }

  function tryBody() {
    const body = { base_url: $('ai-base_url').value.trim(), model: $('ai-model').value };
    const k = typedKey(); if (k) body.api_key = k;
    return body;
  }

  async function loadModels() {
    const btn = $('ai-load-models');
    showFieldError('ai_base_url',''); setStatus('ai-models-status', 'Loading models...');
    btn.disabled = true;
    try {
      const r = await api('/api/admin/ai/models', { method:'POST', body: tryBody() });
      if (!r) return;
      if (!r.ok) { setStatus('ai-models-status', r.error, 'err'); return; }
      setModelList(r.models, $('ai-model').value);
      setStatus('ai-models-status', `${r.models.length} model${r.models.length === 1 ? '' : 's'} found.`, 'ok');
    } catch (e) { setStatus('ai-models-status', e.message || 'Could not load models.', 'err'); }
    finally { btn.disabled = false; }
  }

  async function testConnection() {
    const btn = $('ai-test');
    if (!$('ai-model').value) { setStatus('ai-test-result', 'Choose a model first, then test the connection.', 'err'); return; }
    setStatus('ai-test-result', 'Testing...'); btn.disabled = true;
    try {
      const r = await api('/api/admin/ai/test', { method:'POST', body: tryBody() });
      if (!r) return;
      setStatus('ai-test-result', r.ok ? r.message : r.error, r.ok ? 'ok' : 'err');
    } catch (e) { setStatus('ai-test-result', e.message || 'The test could not run.', 'err'); }
    finally { btn.disabled = false; }
  }

  // Returns true when saved (or nothing to save). Shows plain language errors beside each field.
  async function saveAi() {
    const body = {
      ai_enabled: $('ai-enabled').checked ? '1' : '0',
      ai_base_url: $('ai-base_url').value.trim(),
      ai_model: $('ai-model').value,
    };
    AI_TEXT.forEach(k => { body['ai_' + k] = $('ai-' + k).value; });
    const k = typedKey(); if (k) body.ai_api_key = k;
    if (aiState.clearKey) body.ai_api_key_clear = true;
    try {
      const r = await api('/api/admin/ai', { method:'PUT', body });
      if (!r) return false;
      if (r.settings) fillAi(r.settings);
      return true;
    } catch (err) {
      const fields = err.fields || {};
      Object.entries(fields).forEach(([key, msg]) => showFieldError(key, msg));
      const sum = $('ai-summary');
      const count = Object.keys(fields).length;
      sum.textContent = count ? 'Some AI settings need fixing. Check the messages below.' : err.message;
      sum.style.display = 'block';
      const aiBtn = document.querySelector('.tab-btn[onclick*="s-chat"]'); if (aiBtn) switchTab('s-chat', aiBtn);
      toast(count ? 'Some AI settings need fixing.' : err.message, false);
      return false;
    }
  }

  // ─── Collabs ───────────────────────────────────────────────────────────────
  async function loadCollabs() {
    try {
      const rows = await api('/api/admin/collabs') || [];
      const tbody = document.getElementById('collabs-tbody');
      if (!rows.length) { tbody.innerHTML=`<tr><td colspan="6" style="text-align:center;color:#7a8499;padding:24px;">No collaboration requests yet.</td></tr>`; return; }
      tbody.innerHTML = rows.map(r=>`
        <tr style="${!r.read?'background:rgba(0,229,255,.02);':''}">
          <td style="font-weight:${r.read?400:600};color:#e8edf8;">${esc(r.name||'-')}${!r.read?` <span class="badge-new" style="font-size:9px;">NEW</span>`:''}</td>
          <td style="font-size:12px;color:#7a8499;">${esc(r.email||'-')}</td>
          <td style="font-size:13px;max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(r.subject||'-')}</td>
          <td style="font-size:12px;max-width:200px;color:#b0bcd4;">${esc((r.message||'').substring(0,80))}${(r.message||'').length>80?'…':''}</td>
          <td style="font-size:11px;color:#7a8499;white-space:nowrap;">${esc(fmt(r.created_at))}</td>
          <td><div style="display:flex;gap:6px;">
            ${!r.read?`<button class="btn-a-ghost" onclick="Admin.markCollabRead(${Number(r.id)},this)" style="padding:4px 10px;font-size:11px;">Mark read</button>`:''}
            <button class="btn-a-danger" onclick="Admin.deleteCollab(${Number(r.id)})" style="padding:4px 10px;font-size:11px;">Delete</button>
          </div></td>
        </tr>`).join('');
    } catch (e) { console.error(e); }
  }

  async function markCollabRead(id, btn) {
    try {
      await api(`/api/admin/collabs/${id}/read`,{method:'PUT'});
      btn.closest('tr').style.background=''; btn.remove();
      const b=document.getElementById('collabs-badge'); const c=parseInt(b.textContent)-1; b.textContent=c; if(c<=0) b.style.display='none';
    } catch (e) { toast(e.message, false); }
  }

  async function deleteCollab(id) {
    if (!confirm('Delete this request?')) return;
    try { await api(`/api/admin/collabs/${id}`,{method:'DELETE'}); loadCollabs(); } catch (e) { toast(e.message, false); }
  }

  // ─── Suggestions ───────────────────────────────────────────────────────────
  async function loadSuggestions() {
    try {
      const rows = await api('/api/admin/suggestions') || [];
      const tbody = document.getElementById('suggestions-tbody');
      if (!rows.length) { tbody.innerHTML=`<tr><td colspan="4" style="text-align:center;color:#7a8499;padding:24px;">No suggestions yet.</td></tr>`; return; }
      tbody.innerHTML = rows.map(r=>`
        <tr style="${!r.read?'background:rgba(139,92,246,.03);':''}">
          <td style="max-width:280px;font-size:13px;color:#b0bcd4;">${esc(r.content||'')}${!r.read?` <span class="badge-new" style="font-size:9px;">NEW</span>`:''}</td>
          <td style="font-size:12px;color:#7a8499;">${esc(r.email||'-')}</td>
          <td style="font-size:11px;color:#7a8499;white-space:nowrap;">${esc(fmt(r.created_at))}</td>
          <td><div style="display:flex;gap:6px;">
            ${!r.read?`<button class="btn-a-ghost" onclick="Admin.markSuggestRead(${Number(r.id)},this)" style="padding:4px 10px;font-size:11px;">Mark read</button>`:''}
            <button class="btn-a-danger" onclick="Admin.deleteSuggest(${Number(r.id)})" style="padding:4px 10px;font-size:11px;">Delete</button>
          </div></td>
        </tr>`).join('');
    } catch (e) { console.error(e); }
  }

  async function markSuggestRead(id, btn) {
    try {
      await api(`/api/admin/suggestions/${id}/read`,{method:'PUT'});
      btn.closest('tr').style.background=''; btn.remove();
      const b=document.getElementById('suggestions-badge'); const c=parseInt(b.textContent)-1; b.textContent=c; if(c<=0) b.style.display='none';
    } catch (e) { toast(e.message, false); }
  }

  async function deleteSuggest(id) {
    if (!confirm('Delete this suggestion?')) return;
    try { await api(`/api/admin/suggestions/${id}`,{method:'DELETE'}); loadSuggestions(); } catch (e) { toast(e.message, false); }
  }

  function closeModal(id) { const el=document.getElementById(id); if(el) el.style.display='none'; }
  function switchTab(tab, btn) {
    document.querySelectorAll('.tab-content').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    document.getElementById(`tab-${tab}`)?.classList.add('active');
    btn.classList.add('active');
  }
  function openSidebar() { document.getElementById('sidebar').classList.add('open'); document.getElementById('sidebar-overlay').classList.add('show'); }
  function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebar-overlay').classList.remove('show'); }

  const saved = sessionStorage.getItem('adv_admin_token');
  if (saved) {
    token = saved;
    document.getElementById('login-screen').classList.add('hidden');
    const panel = document.getElementById('admin-panel');
    panel.classList.remove('hidden'); panel.style.display = 'block';
    loadDashboard(); currentSection = 'dashboard';
  }

  ['repo-modal','tool-modal','template-modal'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', function(e) { if(e.target===this) closeModal(id); });
  });

  // ─── Icons in the admin ──────────────────────────────────────────────────────
  async function initIcons() {
    let pack = 'lucide';
    try { const r = await fetch('/api/settings'); if (r.ok) pack = (await r.json()).icon_pack || pack; } catch { /* default style */ }
    await Icons.load(pack);
    Icons.hydrate(document);
  }

  const PACK_LABELS = { lucide: 'Lucide', tabler: 'Tabler', phosphor: 'Phosphor', heroicons: 'Heroicons', feather: 'Feather' };
  const PACK_NOTES = { lucide: 'Clean and friendly with even strokes.', tabler: 'Slightly rounder, with plenty of detail.', phosphor: 'Soft and balanced.', heroicons: 'Simple and confident.', feather: 'Light and minimal.' };
  const PACK_SAMPLE = ['rocket', 'code', 'bot', 'workflow', 'globe', 'mail', 'heart', 'star'];
  const packCache = {};

  function previewSvg(bundle, name) {
    const e = bundle.icons[name]; if (!e) return '';
    const paint = bundle.kind === 's'
      ? `fill="none" stroke="currentColor" stroke-width="${bundle.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"`
      : 'fill="currentColor"';
    return `<svg class="icon" viewBox="${esc(e[0])}" ${paint} aria-hidden="true" focusable="false">${e[1]}</svg>`;
  }

  async function renderPackList() {
    const host = $('icon-pack-list'); if (!host) return;
    await Promise.all(Icons.packs.map(async id => {
      if (packCache[id]) return;
      try { const r = await fetch(`/icons/${id}.json?v=1.1.0`); if (r.ok) packCache[id] = await r.json(); } catch { /* preview row stays empty */ }
    }));
    const current = Icons.packs.includes(gv('s-icon_pack')) ? gv('s-icon_pack') : 'lucide';
    sv('s-icon_pack', current);
    host.innerHTML = Icons.packs.map(id => {
      const b = packCache[id];
      return `<button type="button" class="pack-option" role="radio" aria-checked="${id === current}" tabindex="${id === current ? 0 : -1}" data-pack="${id}">
        <strong>${esc(PACK_LABELS[id])}</strong><span style="font-size:11px;color:#7a8499;">${esc(PACK_NOTES[id])}</span>
        <span class="pack-row">${b ? PACK_SAMPLE.map(n => previewSvg(b, n)).join('') : ''}</span></button>`;
    }).join('');
    if (!host.dataset.bound) {
      host.dataset.bound = '1';
      const choose = (id) => {
        sv('s-icon_pack', id); markDirty(); showFieldError('icon_pack', '');
        host.querySelectorAll('.pack-option').forEach(b => { const on = b.dataset.pack === id; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; });
        Icons.switchPack(id); // the admin screens preview the style at once, the public site changes when you save
      };
      host.addEventListener('click', e => { const b = e.target.closest('.pack-option'); if (b) choose(b.dataset.pack); });
      host.addEventListener('keydown', e => {
        const keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
        if (!(e.key in keys)) return;
        e.preventDefault();
        const ids = Icons.packs; const i = ids.indexOf(gv('s-icon_pack'));
        const next = ids[(i + keys[e.key] + ids.length) % ids.length];
        choose(next); host.querySelector(`[data-pack="${next}"]`).focus();
      });
    }
  }

  // ─── Custom icons ────────────────────────────────────────────────────────────
  async function loadCustomIcons() {
    const host = $('custom-icons-list'); if (!host) return;
    try { const r = await fetch('/api/icons/custom'); const d = await r.json(); Icons.setCustom(d.icons || []); } catch { /* keep what we have */ }
    const list = Object.values(Icons.custom());
    host.innerHTML = list.length
      ? list.map(c => `<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid var(--border);border-radius:8px;"><span style="font-size:22px;display:inline-flex;">${Icons.svg('custom:' + Number(c.id), { size: 22 })}</span><span style="flex:1;overflow-wrap:anywhere;">${esc(c.name)}</span><button type="button" class="btn-a-danger" data-del="${Number(c.id)}" style="padding:5px 10px;font-size:11px;">Delete</button></div>`).join('')
      : '<p style="font-size:12px;color:#7a8499;">You have not added any icons of your own yet.</p>';
  }

  function bindCustomIcons() {
    const host = $('custom-icons-list'); if (!host || host.dataset.bound) return;
    host.dataset.bound = '1';
    host.addEventListener('click', async e => {
      const b = e.target.closest('[data-del]'); if (!b) return;
      if (!confirm('Delete this icon? Anything that uses it will show a default icon instead.')) return;
      try { await api(`/api/admin/icons/custom/${Number(b.dataset.del)}`, { method: 'DELETE' }); toast('Icon deleted.'); await loadCustomIcons(); }
      catch (err) { toast(err.message, false); }
    });
    $('ci-file').addEventListener('change', e => {
      const f = e.target.files && e.target.files[0]; if (!f) return;
      if (f.size > 12 * 1024) { showFieldError('ci', 'That file is larger than 10 KB.'); e.target.value = ''; return; }
      const reader = new FileReader();
      reader.onload = () => { sv('ci-svg', String(reader.result || '')); showFieldError('ci', ''); if (!gv('ci-name')) sv('ci-name', f.name.replace(/\.svg$/i, '').slice(0, 40)); };
      reader.readAsText(f);
    });
    $('ci-add').addEventListener('click', async () => {
      showFieldError('ci', '');
      const name = gv('ci-name').trim(), svg = gv('ci-svg').trim();
      if (!name) { showFieldError('ci', 'Give the icon a name.'); return; }
      if (!svg) { showFieldError('ci', 'Choose an SVG file or paste the SVG code.'); return; }
      const btn = $('ci-add'); btn.disabled = true;
      try {
        await api('/api/admin/icons/custom', { method: 'POST', body: { name, svg } });
        sv('ci-name', ''); sv('ci-svg', ''); sv('ci-file', '');
        toast('Icon added.'); await loadCustomIcons();
      } catch (err) { showFieldError('ci', err.message); }
      finally { btn.disabled = false; }
    });
  }

  // ─── Card list editors (services and specializations) ────────────────────────
  function mountListEditors() {
    document.querySelectorAll('.le[data-target]').forEach(host => {
      let arr = [];
      try { arr = JSON.parse(gv(host.dataset.target) || '[]'); } catch { arr = []; }
      if (!Array.isArray(arr)) arr = [];
      host._items = arr.slice(0, 12).map((it, i) => ({
        icon: Icons.has(it && it.icon) ? it.icon : Icons.serviceDefault(i),
        title: String((it && it.title) || ''), desc: String((it && it.desc) || ''),
      }));
      drawList(host);
      if (host.dataset.bound) return;
      host.dataset.bound = '1';
      host.addEventListener('input', e => {
        const row = e.target.closest('.le-row'); const f = e.target.dataset.f; if (!row || !f) return;
        host._items[Number(row.dataset.i)][f] = e.target.value; syncList(host);
      });
      host.addEventListener('click', e => {
        const btn = e.target.closest('[data-act]'); if (!btn) return;
        const row = btn.closest('.le-row'); const i = row ? Number(row.dataset.i) : -1; const items = host._items;
        const act = btn.dataset.act;
        if (act === 'add') { if (items.length < 12) items.push({ icon: Icons.serviceDefault(items.length), title: '', desc: '' }); }
        else if (act === 'remove') items.splice(i, 1);
        else if (act === 'up' && i > 0) [items[i - 1], items[i]] = [items[i], items[i - 1]];
        else if (act === 'down' && i < items.length - 1) [items[i + 1], items[i]] = [items[i], items[i + 1]];
        else if (act === 'icon') {
          IconPicker.open({ value: items[i].icon, onSelect: v => { items[i].icon = v; drawList(host); syncList(host); const b = host.querySelector(`.le-row[data-i="${i}"] [data-act="icon"]`); if (b) b.focus(); } });
          return;
        }
        drawList(host); syncList(host);
      });
    });
  }
  function syncList(host) { sv(host.dataset.target, JSON.stringify(host._items)); markDirty(); }
  function drawList(host) {
    const items = host._items;
    host.innerHTML = items.map((it, i) => `
      <div class="le-row" data-i="${i}">
        <button type="button" class="btn-a-ghost" data-act="icon" aria-label="Choose the icon for card ${i + 1}" style="width:48px;height:48px;display:flex;align-items:center;justify-content:center;">${Icons.svg(it.icon, { size: 22 })}</button>
        <div class="le-fields">
          <input class="a-input" data-f="title" maxlength="80" value="${esc(it.title)}" placeholder="Title" aria-label="Title of card ${i + 1}">
          <textarea class="a-textarea" data-f="desc" rows="2" maxlength="400" placeholder="Description" aria-label="Description of card ${i + 1}">${esc(it.desc)}</textarea>
        </div>
        <div class="le-actions">
          <button type="button" class="btn-a-ghost" data-act="up" ${i === 0 ? 'disabled' : ''} style="padding:5px 10px;font-size:11px;">Move up</button>
          <button type="button" class="btn-a-ghost" data-act="down" ${i === items.length - 1 ? 'disabled' : ''} style="padding:5px 10px;font-size:11px;">Move down</button>
          <button type="button" class="btn-a-danger" data-act="remove" style="padding:5px 10px;font-size:11px;">Remove</button>
        </div>
      </div>`).join('') + (items.length < 12 ? '<div><button type="button" class="btn-a-ghost" data-act="add">Add card</button></div>' : '');
  }

  // Tool icon button and one time wiring
  $('tf-icon-btn')?.addEventListener('click', () => IconPicker.open({ value: gv('tf-icon'), onSelect: v => { setToolIcon(v); const b = $('tf-icon-btn'); if (b) b.focus(); } }));
  bindCustomIcons();
  initIcons();


  return { login, logout, goTo, saveProfile, loadProfile, openRepoModal, saveRepo, deleteRepo, openToolModal, saveTool, deleteTool, openTemplateModal, saveTemplate, deleteTemplate, loadTemplates, saveSettings, discardSettings, loadSettings, loadCollabs, markCollabRead, deleteCollab, loadSuggestions, markSuggestRead, deleteSuggest, closeModal, switchTab, openSidebar, closeSidebar };
})();
