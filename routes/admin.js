const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const { getPool } = require('../db/init');

router.use(adminAuth);

// ─── PROFILE ──────────────────────────────────────────────────────────────────
router.get('/profile', async (req, res) => {
  const { rows } = await getPool().query('SELECT * FROM profile WHERE id = 1');
  res.json(rows[0] || {});
});

router.put('/profile', async (req, res) => {
  const { name, tagline, bio, location, github_url, linkedin_url, bmc_url, avatar_url, skills, principles } = req.body;
  try {
    await getPool().query(`UPDATE profile SET name=$1,tagline=$2,bio=$3,location=$4,github_url=$5,linkedin_url=$6,bmc_url=$7,avatar_url=$8,skills=$9,principles=$10,updated_at=NOW() WHERE id=1`,
      [name ?? '', tagline ?? '', bio ?? '', location ?? '', github_url ?? '', linkedin_url ?? '', bmc_url ?? '', avatar_url ?? '',
       typeof skills==='string' ? skills : JSON.stringify(skills || []),
       typeof principles==='string' ? principles : JSON.stringify(principles || [])]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
router.get('/settings', async (req, res) => {
  const { rows } = await getPool().query('SELECT key, value FROM site_settings ORDER BY key');
  const s = {}; rows.forEach(r => s[r.key] = r.value);
  res.json(s);
});

router.put('/settings', async (req, res) => {
  try {
    for (const [k, v] of Object.entries(req.body)) {
      await getPool().query('INSERT INTO site_settings (key,value,updated_at) VALUES ($1,$2,NOW()) ON CONFLICT (key) DO UPDATE SET value=$2,updated_at=NOW()', [k, v ?? '']);
    }
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── REPOS ────────────────────────────────────────────────────────────────────
router.get('/repos', async (req, res) => {
  const { rows } = await getPool().query('SELECT * FROM repos ORDER BY display_order ASC, created_at ASC');
  res.json(rows);
});
router.post('/repos', async (req, res) => {
  const { title, url, description, readme_md, tags, display_order, visible } = req.body;
  const { rows } = await getPool().query(
    'INSERT INTO repos (title,url,description,readme_md,tags,display_order,visible) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
    [title, url||'', description||'', readme_md||'', typeof tags==='string'?tags:JSON.stringify(tags||[]), display_order||0, visible!==false]
  );
  res.json(rows[0]);
});
router.put('/repos/:id', async (req, res) => {
  const { title, url, description, readme_md, tags, display_order, visible } = req.body;
  await getPool().query('UPDATE repos SET title=$1,url=$2,description=$3,readme_md=$4,tags=$5,display_order=$6,visible=$7,updated_at=NOW() WHERE id=$8',
    [title, url||'', description||'', readme_md||'', typeof tags==='string'?tags:JSON.stringify(tags||[]), display_order||0, visible!==false, req.params.id]);
  res.json({ ok: true });
});
router.delete('/repos/:id', async (req, res) => {
  await getPool().query('DELETE FROM repos WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

// ─── TOOLS ────────────────────────────────────────────────────────────────────
router.get('/tools', async (req, res) => {
  const { rows } = await getPool().query('SELECT * FROM tools ORDER BY display_order ASC, created_at ASC');
  res.json(rows);
});
router.post('/tools', async (req, res) => {
  const { title, url, description, icon, category, status, display_order } = req.body;
  const { rows } = await getPool().query(
    'INSERT INTO tools (title,url,description,icon,category,status,display_order) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
    [title, url||'', description||'', icon||'🔧', category||'tool', status||'active', display_order||0]
  );
  res.json(rows[0]);
});
router.put('/tools/:id', async (req, res) => {
  const { title, url, description, icon, category, status, display_order } = req.body;
  await getPool().query('UPDATE tools SET title=$1,url=$2,description=$3,icon=$4,category=$5,status=$6,display_order=$7,updated_at=NOW() WHERE id=$8',
    [title, url||'', description||'', icon||'🔧', category||'tool', status||'active', display_order||0, req.params.id]);
  res.json({ ok: true });
});
router.delete('/tools/:id', async (req, res) => {
  await getPool().query('DELETE FROM tools WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

// ─── N8N TEMPLATES ────────────────────────────────────────────────────────────
router.get('/templates', async (req, res) => {
  const { rows } = await getPool().query('SELECT * FROM n8n_templates ORDER BY display_order ASC, created_at ASC');
  res.json(rows);
});
router.post('/templates', async (req, res) => {
  const { title, description, json_url, tags, display_order, visible } = req.body;
  const { rows } = await getPool().query(
    'INSERT INTO n8n_templates (title,description,json_url,tags,display_order,visible) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    [title, description||'', json_url||'', typeof tags==='string'?tags:JSON.stringify(tags||[]), display_order||0, visible!==false]
  );
  res.json(rows[0]);
});
router.put('/templates/:id', async (req, res) => {
  const { title, description, json_url, tags, display_order, visible } = req.body;
  await getPool().query('UPDATE n8n_templates SET title=$1,description=$2,json_url=$3,tags=$4,display_order=$5,visible=$6,updated_at=NOW() WHERE id=$7',
    [title, description||'', json_url||'', typeof tags==='string'?tags:JSON.stringify(tags||[]), display_order||0, visible!==false, req.params.id]);
  res.json({ ok: true });
});
router.delete('/templates/:id', async (req, res) => {
  await getPool().query('DELETE FROM n8n_templates WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

// ─── COLLAB ───────────────────────────────────────────────────────────────────
router.get('/collabs', async (req, res) => {
  const { rows } = await getPool().query('SELECT * FROM collab_requests ORDER BY created_at DESC');
  res.json(rows);
});
router.put('/collabs/:id/read', async (req, res) => {
  await getPool().query('UPDATE collab_requests SET read=true WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});
router.delete('/collabs/:id', async (req, res) => {
  await getPool().query('DELETE FROM collab_requests WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

// ─── SUGGESTIONS ──────────────────────────────────────────────────────────────
router.get('/suggestions', async (req, res) => {
  const { rows } = await getPool().query('SELECT * FROM suggestions ORDER BY created_at DESC');
  res.json(rows);
});
router.put('/suggestions/:id/read', async (req, res) => {
  await getPool().query('UPDATE suggestions SET read=true WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});
router.delete('/suggestions/:id', async (req, res) => {
  await getPool().query('DELETE FROM suggestions WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

// ─── STATS ────────────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [repos, tools, collabs, suggestions, views] = await Promise.all([
      getPool().query('SELECT COUNT(*) FROM repos'),
      getPool().query('SELECT COUNT(*) FROM tools'),
      getPool().query('SELECT COUNT(*) FROM collab_requests WHERE read=false'),
      getPool().query('SELECT COUNT(*) FROM suggestions WHERE read=false'),
      getPool().query(`SELECT page, COUNT(*) as count FROM page_views WHERE created_at > NOW() - INTERVAL '30 days' GROUP BY page ORDER BY count DESC LIMIT 10`),
    ]);
    res.json({
      repos: parseInt(repos.rows[0].count),
      tools: parseInt(tools.rows[0].count),
      unread_collabs: parseInt(collabs.rows[0].count),
      unread_suggestions: parseInt(suggestions.rows[0].count),
      top_pages: views.rows,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
