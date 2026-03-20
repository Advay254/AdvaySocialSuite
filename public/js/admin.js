/* ═══════════════════════════════════════════════════════════════════════════
   AdvaySocialSuite Admin Dashboard Logic
   ═══════════════════════════════════════════════════════════════════════════ */

const Admin = (() => {
  let token = '';

  // ─── Auth ───────────────────────────────────────────────────────────────────
  async function login() {
    const user = document.getElementById('login-user').value.trim();
    const pass = document.getElementById('login-pass').value.trim();
    const btn  = document.getElementById('login-btn');
    const err  = document.getElementById('login-err');

    if (!user || !pass) { showErr(err, 'Please enter credentials.'); return; }
    btn.textContent = 'Signing in...';
    btn.disabled = true;

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      token = data.token;
      sessionStorage.setItem('adv_admin_token', token);
      document.getElementById('login-screen').classList.add('hidden');
      document.getElementById('admin-panel').classList.remove('hidden');
      goTo('dashboard', document.querySelector('[data-section="dashboard"]'));
    } catch (e) {
      showErr(err, e.message);
    } finally {
      btn.textContent = 'Sign In';
      btn.disabled = false;
    }
  }

  function logout() {
    token = '';
    sessionStorage.removeItem('adv_admin_token');
    document.getElementById('admin-panel').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('login-user').value = '';
    document.getElementById('login-pass').value = '';
  }

  function showErr(el, msg) {
    el.textContent = msg;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 4000);
  }

  // ─── Navigation ─────────────────────────────────────────────────────────────
  function goTo(section, el) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(`section-${section}`)?.classList.add('active');
    if (el) el.classList.add('active');

    const titles = {
      dashboard:'Dashboard', profile:'Profile', repos:'Repositories',
      tools:'Tools', settings:'Site Settings', collabs:'Collab Requests', suggestions:'Suggestions'
    };
    document.getElementById('topbar-title').textContent = titles[section] || section;

    // Load data for that section
    if (section === 'dashboard') loadDashboard();
    else if (section === 'profile') loadProfile();
    else if (section === 'repos') loadRepos();
    else if (section === 'tools') loadTools();
    else if (section === 'settings') loadSettings();
    else if (section === 'collabs') loadCollabs();
    else if (section === 'suggestions') loadSuggestions();

    closeSidebar();
  }

  // ─── API helper ─────────────────────────────────────────────────────────────
  async function api(path, opts = {}) {
    const res = await fetch(path, {
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...opts.headers },
      ...opts,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    if (res.status === 401) { logout(); return null; }
    if (!res.ok) { const e = await res.json().catch(() => ({error:'Request failed'})); throw new Error(e.error); }
    return res.json();
  }

  function toast(msg, ok = true) {
    const t = document.getElementById('a-toast');
    t.textContent = msg;
    t.style.background = ok ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)';
    t.style.border = `1px solid ${ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`;
    t.style.color = ok ? '#10b981' : '#f87171';
    t.style.display = 'block';
    clearTimeout(Admin._toastTimer);
    Admin._toastTimer = setTimeout(() => t.style.display = 'none', 3000);
  }

  function fmt(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
  }

  // ─── Dashboard ──────────────────────────────────────────────────────────────
  async function loadDashboard() {
    try {
      const s = await api('/api/admin/stats');
      if (!s) return;
      document.getElementById('s-repos').textContent = s.repos;
      document.getElementById('s-tools').textContent = s.tools;
      document.getElementById('s-collabs').textContent = s.unread_collabs;
      document.getElementById('s-suggestions').textContent = s.unread_suggestions;

      // Update badges
      if (s.unread_collabs > 0) {
        const b = document.getElementById('collabs-badge');
        b.textContent = s.unread_collabs; b.style.display = 'inline';
      }
      if (s.unread_suggestions > 0) {
        const b = document.getElementById('suggestions-badge');
        b.textContent = s.unread_suggestions; b.style.display = 'inline';
      }

      // Page views
      const views = document.getElementById('dash-views');
      if (s.top_pages && s.top_pages.length) {
        views.innerHTML = `
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${s.top_pages.map(p => `
              <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:rgba(255,255,255,0.02);border-radius:8px;border:1px solid rgba(255,255,255,0.05);">
                <span style="font-family:'JetBrains Mono',monospace;font-size:12px;color:#7a8499;">/${p.page}</span>
                <span style="font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;color:#00e5ff;">${p.count}</span>
              </div>`).join('')}
          </div>`;
      } else {
        views.innerHTML = `<span style="color:#7a8499;font-size:13px;">No page views recorded yet.</span>`;
      }
    } catch (e) { console.error(e); }
  }

  // ─── Profile ────────────────────────────────────────────────────────────────
  async function loadProfile() {
    try {
      const p = await api('/api/admin/profile');
      if (!p) return;
      const form = document.getElementById('profile-form');
      ['name','tagline','bio','location','github_url','linkedin_url','bmc_url','avatar_url'].forEach(k => {
        if (form[k]) form[k].value = p[k] || '';
      });
      try {
        const skills = typeof p.skills === 'string' ? JSON.parse(p.skills) : (p.skills || []);
        form['skills'].value = Array.isArray(skills) ? skills.join(', ') : '';
      } catch { form['skills'].value = ''; }
      try {
        const prs = typeof p.principles === 'string' ? JSON.parse(p.principles) : (p.principles || []);
        form['principles'].value = Array.isArray(prs) ? prs.join(', ') : '';
      } catch { form['principles'].value = ''; }
    } catch (e) { console.error(e); }
  }

  async function saveProfile(e) {
    e.preventDefault();
    const form = e.target;
    const btn = document.getElementById('profile-save-btn');
    btn.disabled = true; btn.textContent = 'Saving...';

    const skills = form['skills'].value.split(',').map(s => s.trim()).filter(Boolean);
    const principles = form['principles'].value.split(',').map(s => s.trim()).filter(Boolean);

    const body = {
      name: form.name.value, tagline: form.tagline.value, bio: form.bio.value,
      location: form.location.value, github_url: form.github_url.value,
      linkedin_url: form.linkedin_url.value, bmc_url: form.bmc_url.value,
      avatar_url: form.avatar_url.value,
      skills: JSON.stringify(skills), principles: JSON.stringify(principles),
    };

    try {
      await api('/api/admin/profile', { method: 'PUT', body });
      toast('Profile saved!');
      document.getElementById('profile-msg').classList.remove('hidden');
      setTimeout(() => document.getElementById('profile-msg').classList.add('hidden'), 3000);
    } catch (err) { toast(err.message, false); }
    finally { btn.disabled = false; btn.textContent = 'Save Profile'; }
  }

  // ─── Repos ──────────────────────────────────────────────────────────────────
  let reposData = [];

  async function loadRepos() {
    try {
      reposData = await api('/api/admin/repos') || [];
      const tbody = document.getElementById('repos-tbody');
      if (!reposData.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#7a8499;padding:24px;">No repos yet. Click "Add Repo" to start.</td></tr>`;
        return;
      }
      tbody.innerHTML = reposData.map(r => `
        <tr>
          <td style="font-weight:600;color:#e8edf8;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${r.title}</td>
          <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
            ${r.url ? `<a href="${r.url}" target="_blank" style="color:#00e5ff;font-size:11px;font-family:'JetBrains Mono',monospace;">${r.url.replace('https://github.com/','')}</a>` : '<span style="color:#7a8499;font-size:11px;">—</span>'}
          </td>
          <td style="max-width:140px;">
            <div style="display:flex;flex-wrap:wrap;gap:4px;">
              ${parseTags(r.tags).slice(0,3).map(t=>`<span style="padding:2px 6px;border-radius:4px;font-size:10px;font-family:'JetBrains Mono';background:rgba(139,92,246,0.1);color:#8b5cf6;border:1px solid rgba(139,92,246,0.2);">${t}</span>`).join('')}
            </div>
          </td>
          <td style="font-family:'JetBrains Mono',monospace;font-size:12px;">${r.display_order}</td>
          <td>${r.visible ? `<span class="badge-on">✓ Visible</span>` : `<span class="badge-off">Hidden</span>`}</td>
          <td>
            <div style="display:flex;gap:6px;">
              <button class="btn-a-ghost" onclick="Admin.openRepoModal(${r.id})" style="padding:5px 10px;font-size:11px;">Edit</button>
              <button class="btn-a-danger" onclick="Admin.deleteRepo(${r.id},'${escHTML(r.title)}')" style="padding:5px 10px;font-size:11px;">Delete</button>
            </div>
          </td>
        </tr>`).join('');
    } catch (e) { console.error(e); }
  }

  function openRepoModal(id) {
    const modal = document.getElementById('repo-modal');
    modal.style.display = 'flex';

    if (id) {
      const r = reposData.find(x => x.id === id);
      if (!r) return;
      document.getElementById('repo-modal-title').textContent = 'Edit Repository';
      document.getElementById('repo-edit-id').value = id;
      document.getElementById('rf-title').value = r.title || '';
      document.getElementById('rf-url').value = r.url || '';
      document.getElementById('rf-description').value = r.description || '';
      document.getElementById('rf-tags').value = parseTags(r.tags).join(', ');
      document.getElementById('rf-readme').value = r.readme_md || '';
      document.getElementById('rf-order').value = r.display_order || 0;
      document.getElementById('rf-visible').checked = r.visible !== false;
    } else {
      document.getElementById('repo-modal-title').textContent = 'Add Repository';
      document.getElementById('repo-edit-id').value = '';
      document.getElementById('repo-form').reset();
      document.getElementById('rf-visible').checked = true;
    }
  }

  async function saveRepo(e) {
    e.preventDefault();
    const id = document.getElementById('repo-edit-id').value;
    const tags = document.getElementById('rf-tags').value.split(',').map(s => s.trim()).filter(Boolean);
    const body = {
      title: document.getElementById('rf-title').value,
      url: document.getElementById('rf-url').value,
      description: document.getElementById('rf-description').value,
      readme_md: document.getElementById('rf-readme').value,
      tags: JSON.stringify(tags),
      display_order: parseInt(document.getElementById('rf-order').value) || 0,
      visible: document.getElementById('rf-visible').checked,
    };
    try {
      if (id) await api(`/api/admin/repos/${id}`, { method: 'PUT', body });
      else await api('/api/admin/repos', { method: 'POST', body });
      toast('Repository saved!');
      closeModal('repo-modal');
      loadRepos();
    } catch (err) { toast(err.message, false); }
  }

  async function deleteRepo(id, title) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await api(`/api/admin/repos/${id}`, { method: 'DELETE' });
      toast('Repository deleted.');
      loadRepos();
    } catch (err) { toast(err.message, false); }
  }

  // ─── Tools ──────────────────────────────────────────────────────────────────
  let toolsData = [];

  async function loadTools() {
    try {
      toolsData = await api('/api/admin/tools') || [];
      const tbody = document.getElementById('tools-tbody');
      if (!toolsData.length) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#7a8499;padding:24px;">No tools yet.</td></tr>`;
        return;
      }
      tbody.innerHTML = toolsData.map(t => `
        <tr>
          <td style="font-size:20px;text-align:center;">${t.icon || '🔧'}</td>
          <td style="font-weight:600;color:#e8edf8;">${t.title}</td>
          <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
            ${t.url ? `<a href="${t.url}" target="_blank" style="color:#00e5ff;font-size:11px;font-family:'JetBrains Mono';">${t.url}</a>` : '—'}
          </td>
          <td style="font-size:12px;color:#7a8499;">${t.category || '—'}</td>
          <td>${t.status === 'active' ? `<span class="badge-on">Active</span>` : `<span class="badge-off">Inactive</span>`}</td>
          <td style="font-family:'JetBrains Mono';font-size:12px;">${t.display_order}</td>
          <td>
            <div style="display:flex;gap:6px;">
              <button class="btn-a-ghost" onclick="Admin.openToolModal(${t.id})" style="padding:5px 10px;font-size:11px;">Edit</button>
              <button class="btn-a-danger" onclick="Admin.deleteTool(${t.id},'${escHTML(t.title)}')" style="padding:5px 10px;font-size:11px;">Delete</button>
            </div>
          </td>
        </tr>`).join('');
    } catch (e) { console.error(e); }
  }

  function openToolModal(id) {
    const modal = document.getElementById('tool-modal');
    modal.style.display = 'flex';

    if (id) {
      const t = toolsData.find(x => x.id === id);
      if (!t) return;
      document.getElementById('tool-modal-title').textContent = 'Edit Tool';
      document.getElementById('tool-edit-id').value = id;
      document.getElementById('tf-icon').value = t.icon || '🔧';
      document.getElementById('tf-title').value = t.title || '';
      document.getElementById('tf-url').value = t.url || '';
      document.getElementById('tf-description').value = t.description || '';
      document.getElementById('tf-category').value = t.category || 'tool';
      document.getElementById('tf-status').value = t.status || 'active';
      document.getElementById('tf-order').value = t.display_order || 0;
    } else {
      document.getElementById('tool-modal-title').textContent = 'Add Tool';
      document.getElementById('tool-edit-id').value = '';
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
      display_order: parseInt(document.getElementById('tf-order').value) || 0,
    };
    try {
      if (id) await api(`/api/admin/tools/${id}`, { method: 'PUT', body });
      else await api('/api/admin/tools', { method: 'POST', body });
      toast('Tool saved!');
      closeModal('tool-modal');
      loadTools();
    } catch (err) { toast(err.message, false); }
  }

  async function deleteTool(id, title) {
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      await api(`/api/admin/tools/${id}`, { method: 'DELETE' });
      toast('Tool deleted.');
      loadTools();
    } catch (err) { toast(err.message, false); }
  }

  // ─── Settings ───────────────────────────────────────────────────────────────
  const SETTING_KEYS = ['site_name','site_tagline','meta_description','home_headline','home_subheadline','chat_system_prompt'];

  async function loadSettings() {
    try {
      const s = await api('/api/admin/settings');
      if (!s) return;
      SETTING_KEYS.forEach(k => {
        const el = document.getElementById(`s-${k}`);
        if (el) el.value = s[k] || '';
      });
    } catch (e) { console.error(e); }
  }

  async function saveSettings() {
    const updates = {};
    SETTING_KEYS.forEach(k => {
      const el = document.getElementById(`s-${k}`);
      if (el) updates[k] = el.value;
    });
    try {
      await api('/api/admin/settings', { method: 'PUT', body: updates });
      toast('Settings saved!');
      document.getElementById('settings-msg').classList.remove('hidden');
      setTimeout(() => document.getElementById('settings-msg').classList.add('hidden'), 3000);
    } catch (err) { toast(err.message, false); }
  }

  // ─── Collab Requests ────────────────────────────────────────────────────────
  async function loadCollabs() {
    try {
      const rows = await api('/api/admin/collabs') || [];
      const tbody = document.getElementById('collabs-tbody');
      if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#7a8499;padding:24px;">No collaboration requests yet.</td></tr>`;
        return;
      }
      tbody.innerHTML = rows.map(r => `
        <tr style="${!r.read ? 'background:rgba(0,229,255,0.02);' : ''}">
          <td style="font-weight:${r.read ? 400 : 600};color:#e8edf8;">${escHTML(r.name || '—')}${!r.read ? ' <span class="badge-new" style="font-size:9px;">NEW</span>' : ''}</td>
          <td style="font-size:12px;color:#7a8499;">${escHTML(r.email || '—')}</td>
          <td style="font-size:13px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHTML(r.subject || '—')}</td>
          <td style="font-size:12px;max-width:200px;color:#b0bcd4;">${escHTML((r.message || '').substring(0, 80))}${(r.message || '').length > 80 ? '…' : ''}</td>
          <td style="font-size:11px;color:#7a8499;white-space:nowrap;">${fmt(r.created_at)}</td>
          <td>
            <div style="display:flex;gap:6px;">
              ${!r.read ? `<button class="btn-a-ghost" onclick="Admin.markCollabRead(${r.id},this)" style="padding:4px 10px;font-size:11px;">Mark read</button>` : ''}
              <button class="btn-a-danger" onclick="Admin.deleteCollab(${r.id})" style="padding:4px 10px;font-size:11px;">Delete</button>
            </div>
          </td>
        </tr>`).join('');
    } catch (e) { console.error(e); }
  }

  async function markCollabRead(id, btn) {
    try {
      await api(`/api/admin/collabs/${id}/read`, { method: 'PUT' });
      btn.closest('tr').style.background = '';
      btn.remove();
      // Refresh badge
      const badge = document.getElementById('collabs-badge');
      const count = parseInt(badge.textContent) - 1;
      badge.textContent = count;
      if (count <= 0) badge.style.display = 'none';
    } catch (e) { toast(e.message, false); }
  }

  async function deleteCollab(id) {
    if (!confirm('Delete this request?')) return;
    try { await api(`/api/admin/collabs/${id}`, { method: 'DELETE' }); loadCollabs(); } catch (e) { toast(e.message, false); }
  }

  // ─── Suggestions ─────────────────────────────────────────────────────────── 
  async function loadSuggestions() {
    try {
      const rows = await api('/api/admin/suggestions') || [];
      const tbody = document.getElementById('suggestions-tbody');
      if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#7a8499;padding:24px;">No suggestions yet.</td></tr>`;
        return;
      }
      tbody.innerHTML = rows.map(r => `
        <tr style="${!r.read ? 'background:rgba(139,92,246,0.03);' : ''}">
          <td style="max-width:300px;font-size:13px;color:#b0bcd4;">${escHTML(r.content || '')}${!r.read ? ' <span class="badge-new" style="font-size:9px;">NEW</span>' : ''}</td>
          <td style="font-size:12px;color:#7a8499;">${escHTML(r.email || '—')}</td>
          <td style="font-size:11px;color:#7a8499;white-space:nowrap;">${fmt(r.created_at)}</td>
          <td>
            <div style="display:flex;gap:6px;">
              ${!r.read ? `<button class="btn-a-ghost" onclick="Admin.markSuggestRead(${r.id},this)" style="padding:4px 10px;font-size:11px;">Mark read</button>` : ''}
              <button class="btn-a-danger" onclick="Admin.deleteSuggest(${r.id})" style="padding:4px 10px;font-size:11px;">Delete</button>
            </div>
          </td>
        </tr>`).join('');
    } catch (e) { console.error(e); }
  }

  async function markSuggestRead(id, btn) {
    try {
      await api(`/api/admin/suggestions/${id}/read`, { method: 'PUT' });
      btn.closest('tr').style.background = '';
      btn.remove();
      const badge = document.getElementById('suggestions-badge');
      const count = parseInt(badge.textContent) - 1;
      badge.textContent = count;
      if (count <= 0) badge.style.display = 'none';
    } catch (e) { toast(e.message, false); }
  }

  async function deleteSuggest(id) {
    if (!confirm('Delete this suggestion?')) return;
    try { await api(`/api/admin/suggestions/${id}`, { method: 'DELETE' }); loadSuggestions(); } catch (e) { toast(e.message, false); }
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────
  function parseTags(tags) {
    try { return typeof tags === 'string' ? JSON.parse(tags) : (tags || []); }
    catch { return []; }
  }

  function escHTML(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function closeModal(id) {
    document.getElementById(id).style.display = 'none';
  }

  function switchTab(tab, btn) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${tab}`)?.classList.add('active');
    btn.classList.add('active');
  }

  function openSidebar() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebar-overlay').classList.add('show');
  }

  function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('show');
  }

  // ─── Init ───────────────────────────────────────────────────────────────────
  // Check for session token
  const savedToken = sessionStorage.getItem('adv_admin_token');
  if (savedToken) {
    token = savedToken;
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('admin-panel').classList.remove('hidden');
    loadDashboard();
  }

  // Close modals on overlay click
  ['repo-modal','tool-modal'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', function(e) {
      if (e.target === this) closeModal(id);
    });
  });

  return {
    login, logout, goTo,
    saveProfile, loadProfile,
    openRepoModal, saveRepo, deleteRepo, loadRepos,
    openToolModal, saveTool, deleteTool, loadTools,
    saveSettings, loadSettings,
    loadCollabs, markCollabRead, deleteCollab,
    loadSuggestions, markSuggestRead, deleteSuggest,
    closeModal, switchTab, openSidebar, closeSidebar,
  };
})();
