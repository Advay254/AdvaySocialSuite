/* AdvaySocialSuite Admin Dashboard */
const Admin = (() => {
  let token = '';
  let unsavedChanges = false;

  // ─── Unsaved changes warning ─────────────────────────────────────────────────
  function markDirty() { unsavedChanges = true; }
  function markClean() { unsavedChanges = false; }

  window.addEventListener('beforeunload', e => {
    if (unsavedChanges) { e.preventDefault(); e.returnValue = ''; }
  });

  // ─── Auth ────────────────────────────────────────────────────────────────────
  async function login() {
    const user = document.getElementById('login-user').value.trim();
    const pass = document.getElementById('login-pass').value.trim();
    const btn  = document.getElementById('login-btn');
    const err  = document.getElementById('login-err');
    if (!user || !pass) { showErr(err,'Please enter credentials.'); return; }
    btn.textContent = 'Signing in...'; btn.disabled = true;
    try {
      const res = await fetch('/api/admin/auth/login', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ username: user, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      token = data.token;
      sessionStorage.setItem('adv_admin_token', token);
      // FIX: proper display switching, no scroll stacking
      document.getElementById('login-screen').classList.add('hidden');
      const panel = document.getElementById('admin-panel');
      panel.classList.remove('hidden');
      panel.style.display = 'block';
      goTo('dashboard', document.querySelector('[data-section="dashboard"]'));
    } catch(e) {
      showErr(err, e.message);
    } finally { btn.textContent = 'Sign In'; btn.disabled = false; }
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

  function showErr(el, msg) { el.textContent = msg; el.classList.remove('hidden'); setTimeout(()=>el.classList.add('hidden'),4000); }

  // ─── Navigation ──────────────────────────────────────────────────────────────
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
    const titles = { dashboard:'Dashboard', profile:'Profile', repos:'Repositories', tools:'Tools', settings:'Site Settings', collabs:'Collab Requests', suggestions:'Suggestions', templates:'n8n Templates' };
    document.getElementById('topbar-title').textContent = titles[section] || section;
    if (section==='dashboard') loadDashboard();
    else if (section==='profile') loadProfile();
    else if (section==='repos') loadRepos();
    else if (section==='tools') loadTools();
    else if (section==='settings') loadSettings();
    else if (section==='collabs') loadCollabs();
    else if (section==='suggestions') loadSuggestions();
    else if (section==='templates') loadTemplates();
    closeSidebar();
  }
  let currentSection = null;

  // ─── API helper ──────────────────────────────────────────────────────────────
  async function api(path, opts={}) {
    const res = await fetch(path, {
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`,...opts.headers},
      ...opts, body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    if (res.status===401) { logout(); return null; }
    if (!res.ok) { const e=await res.json().catch(()=>({error:'Request failed'})); throw new Error(e.error); }
    return res.json();
  }

  function toast(msg, ok=true) {
    const t = document.getElementById('a-toast');
    t.textContent = msg;
    t.style.background = ok ? 'rgba(16,185,129,.15)' : 'rgba(239,68,68,.15)';
    t.style.border = `1px solid ${ok ? 'rgba(16,185,129,.3)' : 'rgba(239,68,68,.3)'}`;
    t.style.color = ok ? '#10b981' : '#f87171';
    t.style.display = 'block';
    clearTimeout(Admin._toastTimer);
    Admin._toastTimer = setTimeout(() => t.style.display='none', 3000);
  }

  function fmt(d) { return new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}); }
  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function parseTags(t) { try { return typeof t==='string'?JSON.parse(t):(t||[]); } catch { return []; } }

  // ─── Dashboard ───────────────────────────────────────────────────────────────
  async function loadDashboard() {
    try {
      const s = await api('/api/admin/stats'); if (!s) return;
      document.getElementById('s-repos').textContent = s.repos;
      document.getElementById('s-tools').textContent = s.tools;
      document.getElementById('s-collabs').textContent = s.unread_collabs;
      document.getElementById('s-suggestions').textContent = s.unread_suggestions;
      if (s.unread_collabs>0) { const b=document.getElementById('collabs-badge'); b.textContent=s.unread_collabs; b.style.display='inline'; }
      if (s.unread_suggestions>0) { const b=document.getElementById('suggestions-badge'); b.textContent=s.unread_suggestions; b.style.display='inline'; }
      const views = document.getElementById('dash-views');
      views.innerHTML = s.top_pages?.length
        ? `<div style="display:flex;flex-direction:column;gap:8px;">${s.top_pages.map(p=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:rgba(255,255,255,.02);border-radius:8px;border:1px solid rgba(255,255,255,.05);"><span style="font-family:'JetBrains Mono',monospace;font-size:12px;color:#7a8499;">/${p.page}</span><span style="font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;color:#00e5ff;">${p.count}</span></div>`).join('')}</div>`
        : `<span style="color:#7a8499;font-size:13px;">No page views yet.</span>`;
    } catch(e) { console.error(e); }
  }

  // ─── Profile ─────────────────────────────────────────────────────────────────
  async function loadProfile() {
    try {
      const p = await api('/api/admin/profile'); if (!p) return;
      const form = document.getElementById('profile-form');
      ['name','tagline','bio','location','github_url','linkedin_url','bmc_url','avatar_url'].forEach(k => {
        if (form[k]) form[k].value = p[k] ?? '';
      });
      try { form['skills'].value = (typeof p.skills==='string'?JSON.parse(p.skills):p.skills||[]).join(', '); } catch { form['skills'].value=''; }
      try { form['principles'].value = (typeof p.principles==='string'?JSON.parse(p.principles):p.principles||[]).join(', '); } catch { form['principles'].value=''; }

      // Add dirty tracking
      form.querySelectorAll('input,textarea').forEach(el => el.addEventListener('input', markDirty, {once:false}));
    } catch(e) { console.error(e); }
  }

  async function saveProfile(e) {
    e.preventDefault();
    const form = e.target;
    const btn = document.getElementById('profile-save-btn');
    btn.disabled=true; btn.textContent='Saving...';
    const skills = form['skills'].value.split(',').map(s=>s.trim()).filter(Boolean);
    const principles = form['principles'].value.split(',').map(s=>s.trim()).filter(Boolean);
    const body = {
      name: form.name.value ?? '',
      tagline: form.tagline.value ?? '',
      bio: form.bio.value ?? '',
      location: form.location.value ?? '',
      github_url: form.github_url.value ?? '',
      linkedin_url: form.linkedin_url.value ?? '',
      bmc_url: form.bmc_url.value ?? '',
      avatar_url: form.avatar_url.value ?? '',
      skills: JSON.stringify(skills),
      principles: JSON.stringify(principles),
    };
    try {
      await api('/api/admin/profile', { method:'PUT', body });
      toast('Profile saved!'); markClean();
      document.getElementById('profile-msg').classList.remove('hidden');
      setTimeout(()=>document.getElementById('profile-msg').classList.add('hidden'),3000);
    } catch(err) { toast(err.message,false); }
    finally { btn.disabled=false; btn.textContent='Save Profile'; }
  }

  // ─── Repos ───────────────────────────────────────────────────────────────────
  let reposData = [];
  async function loadRepos() {
    try {
      reposData = await api('/api/admin/repos') || [];
      const tbody = document.getElementById('repos-tbody');
      if (!reposData.length) { tbody.innerHTML=`<tr><td colspan="6" style="text-align:center;color:#7a8499;padding:24px;">No repos yet.</td></tr>`; return; }
      tbody.innerHTML = reposData.map(r=>`
        <tr>
          <td style="font-weight:600;color:#e8edf8;max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(r.title)}</td>
          <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
            ${r.url?`<a href="${esc(r.url)}" target="_blank" style="color:#00e5ff;font-size:11px;font-family:'JetBrains Mono';">${esc(r.url.replace('https://github.com/',''))}</a>`:'<span style="color:#7a8499;font-size:11px;">—</span>'}
          </td>
          <td style="max-width:120px;">${parseTags(r.tags).slice(0,2).map(t=>`<span style="padding:2px 6px;border-radius:4px;font-size:10px;font-family:'JetBrains Mono';background:rgba(139,92,246,.1);color:#8b5cf6;border:1px solid rgba(139,92,246,.2);margin-right:3px;">${esc(t)}</span>`).join('')}</td>
          <td style="font-family:'JetBrains Mono';font-size:12px;">${r.display_order}</td>
          <td>${r.visible?`<span class="badge-on">Visible</span>`:`<span class="badge-off">Hidden</span>`}</td>
          <td><div style="display:flex;gap:6px;">
            <button class="btn-a-ghost" onclick="Admin.openRepoModal(${r.id})" style="padding:5px 10px;font-size:11px;">Edit</button>
            <button class="btn-a-danger" onclick="Admin.deleteRepo(${r.id},'${esc(r.title)}')" style="padding:5px 10px;font-size:11px;">Delete</button>
          </div></td>
        </tr>`).join('');
    } catch(e) { console.error(e); }
  }

  function openRepoModal(id) {
    const modal = document.getElementById('repo-modal'); modal.style.display='flex';
    if (id) {
      const r = reposData.find(x=>x.id===id); if (!r) return;
      document.getElementById('repo-modal-title').textContent='Edit Repository';
      document.getElementById('repo-edit-id').value=id;
      document.getElementById('rf-title').value=r.title||'';
      document.getElementById('rf-url').value=r.url||'';
      document.getElementById('rf-description').value=r.description||'';
      document.getElementById('rf-tags').value=parseTags(r.tags).join(', ');
      document.getElementById('rf-readme').value=r.readme_md||'';
      document.getElementById('rf-order').value=r.display_order||0;
      document.getElementById('rf-visible').checked=r.visible!==false;
    } else {
      document.getElementById('repo-modal-title').textContent='Add Repository';
      document.getElementById('repo-edit-id').value='';
      document.getElementById('repo-form').reset();
      document.getElementById('rf-visible').checked=true;
    }
  }

  async function saveRepo(e) {
    e.preventDefault();
    const id = document.getElementById('repo-edit-id').value;
    const tags = document.getElementById('rf-tags').value.split(',').map(s=>s.trim()).filter(Boolean);
    const body = {
      title: document.getElementById('rf-title').value,
      url: document.getElementById('rf-url').value,
      description: document.getElementById('rf-description').value,
      readme_md: document.getElementById('rf-readme').value,
      tags: JSON.stringify(tags),
      display_order: parseInt(document.getElementById('rf-order').value)||0,
      visible: document.getElementById('rf-visible').checked,
    };
    try {
      if (id) await api(`/api/admin/repos/${id}`,{method:'PUT',body});
      else await api('/api/admin/repos',{method:'POST',body});
      toast('Repository saved!'); closeModal('repo-modal'); loadRepos();
    } catch(err) { toast(err.message,false); }
  }

  async function deleteRepo(id, title) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try { await api(`/api/admin/repos/${id}`,{method:'DELETE'}); toast('Deleted.'); loadRepos(); }
    catch(err) { toast(err.message,false); }
  }

  // ─── Tools ───────────────────────────────────────────────────────────────────
  let toolsData = [];
  async function loadTools() {
    try {
      toolsData = await api('/api/admin/tools') || [];
      const tbody = document.getElementById('tools-tbody');
      if (!toolsData.length) { tbody.innerHTML=`<tr><td colspan="7" style="text-align:center;color:#7a8499;padding:24px;">No tools yet.</td></tr>`; return; }
      tbody.innerHTML = toolsData.map(t=>`
        <tr>
          <td style="font-size:20px;text-align:center;">${t.icon||'🔧'}</td>
          <td style="font-weight:600;color:#e8edf8;">${esc(t.title)}</td>
          <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${t.url?`<a href="${esc(t.url)}" target="_blank" style="color:#00e5ff;font-size:11px;font-family:'JetBrains Mono';">${esc(t.url)}</a>`:'—'}</td>
          <td style="font-size:12px;color:#7a8499;">${t.category||'—'}</td>
          <td>${t.status==='active'?`<span class="badge-on">Active</span>`:`<span class="badge-off">Inactive</span>`}</td>
          <td style="font-family:'JetBrains Mono';font-size:12px;">${t.display_order}</td>
          <td><div style="display:flex;gap:6px;">
            <button class="btn-a-ghost" onclick="Admin.openToolModal(${t.id})" style="padding:5px 10px;font-size:11px;">Edit</button>
            <button class="btn-a-danger" onclick="Admin.deleteTool(${t.id},'${esc(t.title)}')" style="padding:5px 10px;font-size:11px;">Delete</button>
          </div></td>
        </tr>`).join('');
    } catch(e) { console.error(e); }
  }

  function openToolModal(id) {
    const modal = document.getElementById('tool-modal'); modal.style.display='flex';
    if (id) {
      const t = toolsData.find(x=>x.id===id); if (!t) return;
      document.getElementById('tool-modal-title').textContent='Edit Tool';
      document.getElementById('tool-edit-id').value=id;
      document.getElementById('tf-icon').value=t.icon||'🔧';
      document.getElementById('tf-title').value=t.title||'';
      document.getElementById('tf-url').value=t.url||'';
      document.getElementById('tf-description').value=t.description||'';
      document.getElementById('tf-category').value=t.category||'tool';
      document.getElementById('tf-status').value=t.status||'active';
      document.getElementById('tf-order').value=t.display_order||0;
    } else {
      document.getElementById('tool-modal-title').textContent='Add Tool';
      document.getElementById('tool-edit-id').value='';
      document.getElementById('tool-form').reset();
    }
  }

  async function saveTool(e) {
    e.preventDefault();
    const id = document.getElementById('tool-edit-id').value;
    const body = {
      icon: document.getElementById('tf-icon').value,
      title: document.getElementById('tf-title').value,
      url: document.getElementById('tf-url').value,
      description: document.getElementById('tf-description').value,
      category: document.getElementById('tf-category').value,
      status: document.getElementById('tf-status').value,
      display_order: parseInt(document.getElementById('tf-order').value)||0,
    };
    try {
      if (id) await api(`/api/admin/tools/${id}`,{method:'PUT',body});
      else await api('/api/admin/tools',{method:'POST',body});
      toast('Tool saved!'); closeModal('tool-modal'); loadTools();
    } catch(err) { toast(err.message,false); }
  }

  async function deleteTool(id, title) {
    if (!confirm(`Delete "${title}"?`)) return;
    try { await api(`/api/admin/tools/${id}`,{method:'DELETE'}); toast('Deleted.'); loadTools(); }
    catch(err) { toast(err.message,false); }
  }

  // ─── n8n Templates ───────────────────────────────────────────────────────────
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
          <td style="max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${t.json_url?`<a href="${esc(t.json_url)}" target="_blank" style="color:#00e5ff;font-size:11px;font-family:'JetBrains Mono';">link</a>`:'—'}</td>
          <td>${parseTags(t.tags).slice(0,2).map(tg=>`<span style="padding:2px 6px;border-radius:4px;font-size:10px;font-family:'JetBrains Mono';background:rgba(0,229,255,.08);color:#00e5ff;border:1px solid rgba(0,229,255,.15);margin-right:3px;">${esc(tg)}</span>`).join('')}</td>
          <td style="font-family:'JetBrains Mono';font-size:12px;">${t.display_order}</td>
          <td>${t.visible?`<span class="badge-on">Visible</span>`:`<span class="badge-off">Hidden</span>`}</td>
          <td><div style="display:flex;gap:6px;">
            <button class="btn-a-ghost" onclick="Admin.openTemplateModal(${t.id})" style="padding:5px 10px;font-size:11px;">Edit</button>
            <button class="btn-a-danger" onclick="Admin.deleteTemplate(${t.id},'${esc(t.title)}')" style="padding:5px 10px;font-size:11px;">Delete</button>
          </div></td>
        </tr>`).join('');
    } catch(e) { console.error(e); }
  }

  function openTemplateModal(id) {
    const modal = document.getElementById('template-modal'); modal.style.display='flex';
    if (id) {
      const t = templatesData.find(x=>x.id===id); if (!t) return;
      document.getElementById('template-modal-title').textContent='Edit Template';
      document.getElementById('template-edit-id').value=id;
      document.getElementById('tmf-title').value=t.title||'';
      document.getElementById('tmf-description').value=t.description||'';
      document.getElementById('tmf-url').value=t.json_url||'';
      document.getElementById('tmf-tags').value=parseTags(t.tags).join(', ');
      document.getElementById('tmf-order').value=t.display_order||0;
      document.getElementById('tmf-visible').checked=t.visible!==false;
    } else {
      document.getElementById('template-modal-title').textContent='Add Template';
      document.getElementById('template-edit-id').value='';
      document.getElementById('template-form').reset();
      document.getElementById('tmf-visible').checked=true;
    }
  }

  async function saveTemplate(e) {
    e.preventDefault();
    const id = document.getElementById('template-edit-id').value;
    const tags = document.getElementById('tmf-tags').value.split(',').map(s=>s.trim()).filter(Boolean);
    const body = {
      title: document.getElementById('tmf-title').value,
      description: document.getElementById('tmf-description').value,
      json_url: document.getElementById('tmf-url').value,
      tags: JSON.stringify(tags),
      display_order: parseInt(document.getElementById('tmf-order').value)||0,
      visible: document.getElementById('tmf-visible').checked,
    };
    try {
      if (id) await api(`/api/admin/templates/${id}`,{method:'PUT',body});
      else await api('/api/admin/templates',{method:'POST',body});
      toast('Template saved!'); closeModal('template-modal'); loadTemplates();
    } catch(err) { toast(err.message,false); }
  }

  async function deleteTemplate(id, title) {
    if (!confirm(`Delete "${title}"?`)) return;
    try { await api(`/api/admin/templates/${id}`,{method:'DELETE'}); toast('Deleted.'); loadTemplates(); }
    catch(err) { toast(err.message,false); }
  }

  // ─── Settings ────────────────────────────────────────────────────────────────
  const SETTING_KEYS = ['site_name','site_tagline','meta_description','home_headline','home_subheadline','chat_system_prompt'];
  async function loadSettings() {
    try {
      const s = await api('/api/admin/settings'); if (!s) return;
      SETTING_KEYS.forEach(k => { const el=document.getElementById(`s-${k}`); if(el) el.value=s[k]??''; });
      // dirty tracking
      SETTING_KEYS.forEach(k => { const el=document.getElementById(`s-${k}`); if(el) el.addEventListener('input', markDirty, {once:false}); });
    } catch(e) { console.error(e); }
  }

  async function saveSettings() {
    const updates = {};
    SETTING_KEYS.forEach(k => { const el=document.getElementById(`s-${k}`); if(el) updates[k]=el.value??''; });
    try {
      await api('/api/admin/settings',{method:'PUT',body:updates});
      toast('Settings saved!'); markClean();
      document.getElementById('settings-msg').classList.remove('hidden');
      setTimeout(()=>document.getElementById('settings-msg').classList.add('hidden'),3000);
    } catch(err) { toast(err.message,false); }
  }

  // ─── Collab ──────────────────────────────────────────────────────────────────
  async function loadCollabs() {
    try {
      const rows = await api('/api/admin/collabs') || [];
      const tbody = document.getElementById('collabs-tbody');
      if (!rows.length) { tbody.innerHTML=`<tr><td colspan="6" style="text-align:center;color:#7a8499;padding:24px;">No collaboration requests yet.</td></tr>`; return; }
      tbody.innerHTML = rows.map(r=>`
        <tr style="${!r.read?'background:rgba(0,229,255,.02);':''}">
          <td style="font-weight:${r.read?400:600};color:#e8edf8;">${esc(r.name||'—')}${!r.read?` <span class="badge-new" style="font-size:9px;">NEW</span>`:''}</td>
          <td style="font-size:12px;color:#7a8499;">${esc(r.email||'—')}</td>
          <td style="font-size:13px;max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(r.subject||'—')}</td>
          <td style="font-size:12px;max-width:200px;color:#b0bcd4;">${esc((r.message||'').substring(0,80))}${(r.message||'').length>80?'…':''}</td>
          <td style="font-size:11px;color:#7a8499;white-space:nowrap;">${fmt(r.created_at)}</td>
          <td><div style="display:flex;gap:6px;">
            ${!r.read?`<button class="btn-a-ghost" onclick="Admin.markCollabRead(${r.id},this)" style="padding:4px 10px;font-size:11px;">Mark read</button>`:''}
            <button class="btn-a-danger" onclick="Admin.deleteCollab(${r.id})" style="padding:4px 10px;font-size:11px;">Delete</button>
          </div></td>
        </tr>`).join('');
    } catch(e) { console.error(e); }
  }

  async function markCollabRead(id, btn) {
    try {
      await api(`/api/admin/collabs/${id}/read`,{method:'PUT'});
      btn.closest('tr').style.background=''; btn.remove();
      const b=document.getElementById('collabs-badge'); const c=parseInt(b.textContent)-1; b.textContent=c; if(c<=0) b.style.display='none';
    } catch(e) { toast(e.message,false); }
  }

  async function deleteCollab(id) {
    if (!confirm('Delete this request?')) return;
    try { await api(`/api/admin/collabs/${id}`,{method:'DELETE'}); loadCollabs(); } catch(e) { toast(e.message,false); }
  }

  // ─── Suggestions ─────────────────────────────────────────────────────────────
  async function loadSuggestions() {
    try {
      const rows = await api('/api/admin/suggestions') || [];
      const tbody = document.getElementById('suggestions-tbody');
      if (!rows.length) { tbody.innerHTML=`<tr><td colspan="4" style="text-align:center;color:#7a8499;padding:24px;">No suggestions yet.</td></tr>`; return; }
      tbody.innerHTML = rows.map(r=>`
        <tr style="${!r.read?'background:rgba(139,92,246,.03);':''}">
          <td style="max-width:280px;font-size:13px;color:#b0bcd4;">${esc(r.content||'')}${!r.read?` <span class="badge-new" style="font-size:9px;">NEW</span>`:''}</td>
          <td style="font-size:12px;color:#7a8499;">${esc(r.email||'—')}</td>
          <td style="font-size:11px;color:#7a8499;white-space:nowrap;">${fmt(r.created_at)}</td>
          <td><div style="display:flex;gap:6px;">
            ${!r.read?`<button class="btn-a-ghost" onclick="Admin.markSuggestRead(${r.id},this)" style="padding:4px 10px;font-size:11px;">Mark read</button>`:''}
            <button class="btn-a-danger" onclick="Admin.deleteSuggest(${r.id})" style="padding:4px 10px;font-size:11px;">Delete</button>
          </div></td>
        </tr>`).join('');
    } catch(e) { console.error(e); }
  }

  async function markSuggestRead(id, btn) {
    try {
      await api(`/api/admin/suggestions/${id}/read`,{method:'PUT'});
      btn.closest('tr').style.background=''; btn.remove();
      const b=document.getElementById('suggestions-badge'); const c=parseInt(b.textContent)-1; b.textContent=c; if(c<=0) b.style.display='none';
    } catch(e) { toast(e.message,false); }
  }

  async function deleteSuggest(id) {
    if (!confirm('Delete this suggestion?')) return;
    try { await api(`/api/admin/suggestions/${id}`,{method:'DELETE'}); loadSuggestions(); } catch(e) { toast(e.message,false); }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  function closeModal(id) { document.getElementById(id).style.display='none'; }

  function switchTab(tab, btn) {
    document.querySelectorAll('.tab-content').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    document.getElementById(`tab-${tab}`)?.classList.add('active');
    btn.classList.add('active');
  }

  function openSidebar() { document.getElementById('sidebar').classList.add('open'); document.getElementById('sidebar-overlay').classList.add('show'); }
  function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebar-overlay').classList.remove('show'); }

  // ─── Init ─────────────────────────────────────────────────────────────────────
  const saved = sessionStorage.getItem('adv_admin_token');
  if (saved) {
    token = saved;
    document.getElementById('login-screen').classList.add('hidden');
    const panel = document.getElementById('admin-panel');
    panel.classList.remove('hidden'); panel.style.display='block';
    loadDashboard(); currentSection='dashboard';
  }

  // Close modals on overlay click
  ['repo-modal','tool-modal','template-modal'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', function(e) {
      if (e.target===this) closeModal(id);
    });
  });

  return {
    login, logout, goTo,
    saveProfile, loadProfile,
    openRepoModal, saveRepo, deleteRepo,
    openToolModal, saveTool, deleteTool,
    openTemplateModal, saveTemplate, deleteTemplate, loadTemplates,
    saveSettings, loadSettings,
    loadCollabs, markCollabRead, deleteCollab,
    loadSuggestions, markSuggestRead, deleteSuggest,
    closeModal, switchTab, openSidebar, closeSidebar,
  };
})();
