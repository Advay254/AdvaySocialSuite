const router = require('../lib/safeRouter')();
const { getPool } = require('../db/init');
const { pickPublic } = require('../lib/settingsPolicy');
const validate = require('../lib/validate');
const iconVocab = require('../lib/iconVocab');
const { sanitize } = require('../lib/svgSanitizer');

// Every query in this file is parameterised or has no input at all. Nothing from the
// request ever becomes a table name, column name, order or limit.

const PAGES = ['home', 'about', 'repos', 'tools', 'templates', 'collab'];

router.post('/pageview', async (req, res) => {
  const { page } = validate.body(req.body, { page: { type: 'string', required: true, max: 20, enum: PAGES } });
  await getPool().query('INSERT INTO page_views (page) VALUES ($1)', [page]);
  res.json({ ok: true });
});

router.get('/profile', async (req, res) => {
  const { rows } = await getPool().query('SELECT * FROM profile WHERE id = 1');
  res.json(rows[0] || {});
});

// Only an explicit allowlist of keys is public (see lib/settingsPolicy.js).
// Internal keys, the AI settings and the webhook URL are never returned here.
router.get('/settings', async (req, res) => {
  const { rows } = await getPool().query('SELECT key, value FROM site_settings ORDER BY key');
  res.json(pickPublic(rows));
});

router.get('/repos', async (req, res) => {
  const { rows } = await getPool().query('SELECT * FROM repos WHERE visible = true ORDER BY display_order ASC, created_at ASC');
  res.json(rows);
});

router.get('/tools', async (req, res) => {
  const { rows } = await getPool().query("SELECT * FROM tools WHERE status = 'active' ORDER BY display_order ASC, created_at ASC");
  // Icons are always a name from the vocabulary or custom:ID, whatever is stored.
  res.json(rows.map(t => ({ ...t, icon: iconVocab.iconFromStored(t.icon, t.category) })));
});

router.get('/templates', async (req, res) => {
  const { rows } = await getPool().query('SELECT * FROM n8n_templates WHERE visible = true ORDER BY display_order ASC, created_at ASC');
  res.json(rows);
});

// Custom icons: only sanitised markup is ever returned.
router.get('/icons/custom', async (req, res) => {
  const { rows } = await getPool().query('SELECT id, name, svg FROM custom_icons ORDER BY id ASC LIMIT 200');
  const icons = [];
  for (const r of rows) {
    try {
      const clean = sanitize(r.svg); // sanitised again on the way out
      icons.push({ id: r.id, name: r.name, viewBox: clean.viewBox, body: clean.body });
    } catch { /* an icon that no longer passes is skipped */ }
  }
  res.json({ icons });
});

// The hidden "website" field is a trap for bots. If it is filled in, answer as if it worked and store nothing.
const isBot = (b) => b && typeof b === 'object' && typeof b.website === 'string' && b.website.trim() !== '';

router.post('/collab', async (req, res) => {
  if (isBot(req.body)) return res.json({ ok: true });
  const f = validate.body(req.body, {
    name: { type: 'string', required: true, max: 100 },
    email: { type: 'email', required: true },
    subject: { type: 'string', max: 120 },
    message: { type: 'string', required: true, min: 5, max: 1000, multiline: true },
    website: { type: 'string', max: 200 },
  });
  await getPool().query('INSERT INTO collab_requests (name,email,subject,message) VALUES ($1,$2,$3,$4)', [f.name, f.email, f.subject, f.message]);
  res.json({ ok: true });
});

router.post('/suggest', async (req, res) => {
  if (isBot(req.body)) return res.json({ ok: true });
  const f = validate.body(req.body, {
    content: { type: 'string', required: true, min: 3, max: 1000, multiline: true },
    email: { type: 'email' },
    website: { type: 'string', max: 200 },
  });
  await getPool().query('INSERT INTO suggestions (content,email) VALUES ($1,$2)', [f.content, f.email]);
  res.json({ ok: true });
});

module.exports = router;
