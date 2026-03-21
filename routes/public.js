const express = require('express');
const router = express.Router();
const { getPool } = require('../db/init');

router.post('/pageview', async (req, res) => {
  try {
    const { page } = req.body;
    if (page) await getPool().query('INSERT INTO page_views (page) VALUES ($1)', [page]);
    res.json({ ok: true });
  } catch { res.json({ ok: false }); }
});

router.get('/profile', async (req, res) => {
  try {
    const { rows } = await getPool().query('SELECT * FROM profile WHERE id = 1');
    res.json(rows[0] || {});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// All settings are public — frontend filters what it needs
router.get('/settings', async (req, res) => {
  try {
    const { rows } = await getPool().query('SELECT key, value FROM site_settings ORDER BY key');
    const s = {};
    rows.forEach(r => s[r.key] = r.value);
    res.json(s);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/repos', async (req, res) => {
  try {
    const { rows } = await getPool().query('SELECT * FROM repos WHERE visible = true ORDER BY display_order ASC, created_at ASC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/tools', async (req, res) => {
  try {
    const { rows } = await getPool().query("SELECT * FROM tools WHERE status = 'active' ORDER BY display_order ASC, created_at ASC");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/templates', async (req, res) => {
  try {
    const { rows } = await getPool().query('SELECT * FROM n8n_templates WHERE visible = true ORDER BY display_order ASC, created_at ASC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/collab', async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ error: 'Missing required fields' });
  try {
    await getPool().query('INSERT INTO collab_requests (name,email,subject,message) VALUES ($1,$2,$3,$4)', [name, email, subject || '', message]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/suggest', async (req, res) => {
  const { content, email } = req.body;
  if (!content) return res.status(400).json({ error: 'Missing content' });
  try {
    await getPool().query('INSERT INTO suggestions (content,email) VALUES ($1,$2)', [content, email || '']);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
