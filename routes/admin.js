const router = require('../lib/safeRouter')();
const adminAuth = require('../middleware/adminAuth');
const { getPool } = require('../db/init');
const { isInternalKey, normaliseHex, ADMIN_TEXT_LIMITS, ADMIN_SETTING_KEYS, ICON_PACKS } = require('../lib/settingsPolicy');
const aiConfig = require('../lib/aiConfig');
const adminAiRoutes = require('./adminAi');
const validate = require('../lib/validate');
const iconVocab = require('../lib/iconVocab');
const { sanitize, SvgRejected } = require('../lib/svgSanitizer');
const { ApiError } = require('../lib/apiError');
const { resetCache: resetCors } = require('../middleware/corsPolicy');

// Query safety: every value reaches the database as a parameter. Table and column names
// are written out in this file, and nothing from a request ever becomes an ORDER BY,
// LIMIT or OFFSET. Ids are parsed as integers before use.

router.use(adminAuth);

// AI provider settings (own validated routes)
router.use('/ai', adminAiRoutes);

const id = (req) => validate.int(req.params.id, { min: 1, max: 2147483647, name: 'id' });
const NO_EMOJI = { stripEmoji: true };
const order = { type: 'int', min: -100000, max: 100000, default: 0 };

// ─── PROFILE ─────────────────────────────────────────────────────────────────
router.get('/profile', async (req, res) => {
  const { rows } = await getPool().query('SELECT * FROM profile WHERE id = 1');
  res.json(rows[0] || {});
});

router.put('/profile', async (req, res) => {
  const f = validate.body(req.body, {
    name: { type: 'string', max: 100 }, tagline: { type: 'string', max: 200 }, bio: { type: 'string', max: 3000, multiline: true },
    location: { type: 'string', max: 100 },
    github_url: { type: 'url', max: 500 }, linkedin_url: { type: 'url', max: 500 }, twitter_url: { type: 'url', max: 500 },
    youtube_url: { type: 'url', max: 500 }, discord_url: { type: 'url', max: 500 }, tiktok_url: { type: 'url', max: 500 },
    bmc_url: { type: 'url', max: 500 }, avatar_url: { type: 'url', max: 1000 },
    skills: { type: 'tags', maxItems: 40, maxLen: 60 }, principles: { type: 'tags', maxItems: 20, maxLen: 200 },
  }, NO_EMOJI);
  await getPool().query(`UPDATE profile SET name=$1,tagline=$2,bio=$3,location=$4,github_url=$5,linkedin_url=$6,twitter_url=$7,youtube_url=$8,discord_url=$9,tiktok_url=$10,bmc_url=$11,avatar_url=$12,skills=$13,principles=$14,updated_at=NOW() WHERE id=1`,
    [f.name, f.tagline, f.bio, f.location, f.github_url, f.linkedin_url, f.twitter_url, f.youtube_url, f.discord_url, f.tiktok_url, f.bmc_url, f.avatar_url, f.skills, f.principles]);
  res.json({ ok: true });
});

// ─── SETTINGS ────────────────────────────────────────────────────────────────
router.get('/settings', async (req, res) => {
  const { rows } = await getPool().query('SELECT key, value FROM site_settings ORDER BY key');
  const s = {};
  rows.forEach(r => { if (!isInternalKey(r.key) && r.key !== 'ai_api_key_enc') s[r.key] = r.value; });
  // Never return the stored key, only a masked hint and a flag.
  const view = await aiConfig.getAdminView();
  s.ai_api_key_set = view.ai_api_key_set;
  s.ai_api_key_hint = view.ai_api_key_hint;
  res.json(s);
});

const ORIGIN_RE = /^https?:\/\/[A-Za-z0-9.-]+(:\d{1,5})?$/;

// Validates one setting. Returns the value to store or throws an Error with a plain message.
function checkSetting(key, raw) {
  if (raw !== null && typeof raw !== 'string' && typeof raw !== 'number') throw new Error('Enter text.');
  const value = raw === null ? '' : String(raw);
  switch (key) {
    case 'accent_color': {
      if (value === '') return '#b98b6e';
      const hex = normaliseHex(value);
      if (!hex) throw new Error('Accent colour must be a hex value such as #b98b6e.');
      return hex;
    }
    case 'icon_pack':
      if (!ICON_PACKS.includes(value)) throw new Error('Choose one of the five icon styles.');
      return value;
    case 'templates_visible':
      if (!['0', '1', ''].includes(value)) throw new Error('Use on or off.');
      return value === '' ? '1' : value;
    case 'webhook_url': {
      const u = validate.url(value, 500);
      return u;
    }
    case 'allowed_origins': {
      const list = value.split(',').map(s => s.trim().replace(/\/+$/, '')).filter(Boolean);
      if (list.length > 10) throw new Error('List at most 10 origins.');
      if (list.some(o => !ORIGIN_RE.test(o))) throw new Error('Each origin must look like https://example.com with no path.');
      return list.join(', ');
    }
    case 'specializations':
    case 'collab_services': {
      if (value.trim() === '') return '[]';
      let arr;
      try { arr = JSON.parse(value); } catch { throw new Error('This list is not valid. Open the editor and save again.'); }
      if (!Array.isArray(arr) || arr.length > 12) throw new Error('Use at most 12 items.');
      return JSON.stringify(arr.map((item, i) => {
        if (!item || typeof item !== 'object') throw new Error('Each item needs a title and a description.');
        const title = validate.clean(item.title == null ? '' : String(item.title), false);
        const desc = validate.clean(item.desc == null ? '' : String(item.desc), true);
        if (!title) throw new Error('Every item needs a title.');
        if (title.length > 80) throw new Error('Titles can have at most 80 characters.');
        if (desc.length > 400) throw new Error('Descriptions can have at most 400 characters.');
        return { icon: iconVocab.convertIcon(item.icon, iconVocab.serviceDefault(i)), title, desc };
      }));
    }
    default: {
      const max = ADMIN_TEXT_LIMITS[key];
      const v = validate.clean(value, true);
      if (v.length > max) throw new Error(`Use at most ${max} characters.`);
      return iconVocab.stripEmoji(v);
    }
  }
}

router.put('/settings', async (req, res) => {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ApiError(400, 'The request body must be a JSON object.', 'validation');
  const errors = {};
  const updates = [];
  for (const [k, v] of Object.entries(body)) {
    // Internal keys, every ai_ key and anything not on the list are refused. AI settings use /api/admin/ai.
    if (!ADMIN_SETTING_KEYS.includes(k)) { errors[k] = 'This setting cannot be changed here.'; continue; }
    try { updates.push([k, checkSetting(k, v === undefined ? '' : v)]); } catch (e) { errors[k] = e.message; }
  }
  if (Object.keys(errors).length) {
    const first = errors.accent_color || errors.icon_pack || Object.values(errors)[0];
    throw new ApiError(400, first, 'validation', { fields: errors });
  }
  for (const [k, value] of updates) {
    await getPool().query('INSERT INTO site_settings (key,value,updated_at) VALUES ($1,$2,NOW()) ON CONFLICT (key) DO UPDATE SET value=$2,updated_at=NOW()', [k, value]);
  }
  resetCors();
  res.json({ ok: true });
});

// ─── REPOS ───────────────────────────────────────────────────────────────────
const repoSpec = {
  title: { type: 'string', required: true, max: 120 }, url: { type: 'url', max: 500 }, description: { type: 'string', max: 600 },
  readme_md: { type: 'string', max: 200000, multiline: true }, tags: { type: 'tags' }, display_order: order, visible: { type: 'bool', default: true },
};
router.get('/repos', async (req, res) => {
  const { rows } = await getPool().query('SELECT * FROM repos ORDER BY display_order ASC, created_at ASC');
  res.json(rows);
});
router.post('/repos', async (req, res) => {
  const f = validate.body(req.body, repoSpec, NO_EMOJI);
  const { rows } = await getPool().query(
    'INSERT INTO repos (title,url,description,readme_md,tags,display_order,visible) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
    [f.title, f.url, f.description, f.readme_md, f.tags, f.display_order, f.visible]);
  res.json(rows[0]);
});
router.put('/repos/:id', async (req, res) => {
  const rid = id(req);
  const f = validate.body(req.body, repoSpec, NO_EMOJI);
  await getPool().query('UPDATE repos SET title=$1,url=$2,description=$3,readme_md=$4,tags=$5,display_order=$6,visible=$7,updated_at=NOW() WHERE id=$8',
    [f.title, f.url, f.description, f.readme_md, f.tags, f.display_order, f.visible, rid]);
  res.json({ ok: true });
});
router.delete('/repos/:id', async (req, res) => {
  await getPool().query('DELETE FROM repos WHERE id=$1', [id(req)]);
  res.json({ ok: true });
});

// ─── TOOLS ───────────────────────────────────────────────────────────────────
const toolSpec = {
  title: { type: 'string', required: true, max: 120 }, url: { type: 'url', max: 500 }, description: { type: 'string', max: 600 },
  icon: { type: 'string', max: 40, keepEmoji: true }, // converted to an icon name below, so emoji must still be visible here
  category: { type: 'string', max: 40, lower: true, pattern: /^[A-Za-z0-9_-]+$/, patternMessage: 'Use letters, numbers, dashes and underscores only.', default: 'tool' },
  status: { type: 'string', max: 20, enum: ['active', 'inactive'], default: 'active' },
  display_order: order,
};
router.get('/tools', async (req, res) => {
  const { rows } = await getPool().query('SELECT * FROM tools ORDER BY display_order ASC, created_at ASC');
  res.json(rows);
});
router.post('/tools', async (req, res) => {
  const f = validate.body(req.body, toolSpec, NO_EMOJI);
  const category = f.category || 'tool';
  const icon = iconVocab.iconFromStored(f.icon, category); // a name from the vocabulary or custom:ID, never anything else
  const { rows } = await getPool().query(
    'INSERT INTO tools (title,url,description,icon,category,status,display_order) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
    [f.title, f.url, f.description, icon, category, f.status || 'active', f.display_order]);
  res.json(rows[0]);
});
router.put('/tools/:id', async (req, res) => {
  const tid = id(req);
  const f = validate.body(req.body, toolSpec, NO_EMOJI);
  const category = f.category || 'tool';
  const icon = iconVocab.iconFromStored(f.icon, category);
  await getPool().query('UPDATE tools SET title=$1,url=$2,description=$3,icon=$4,category=$5,status=$6,display_order=$7,updated_at=NOW() WHERE id=$8',
    [f.title, f.url, f.description, icon, category, f.status || 'active', f.display_order, tid]);
  res.json({ ok: true });
});
router.delete('/tools/:id', async (req, res) => {
  await getPool().query('DELETE FROM tools WHERE id=$1', [id(req)]);
  res.json({ ok: true });
});

// ─── N8N TEMPLATES ───────────────────────────────────────────────────────────
const templateSpec = {
  title: { type: 'string', required: true, max: 120 }, description: { type: 'string', max: 600 }, json_url: { type: 'url', max: 500 },
  tags: { type: 'tags' }, display_order: order, visible: { type: 'bool', default: true },
};
router.get('/templates', async (req, res) => {
  const { rows } = await getPool().query('SELECT * FROM n8n_templates ORDER BY display_order ASC, created_at ASC');
  res.json(rows);
});
router.post('/templates', async (req, res) => {
  const f = validate.body(req.body, templateSpec, NO_EMOJI);
  const { rows } = await getPool().query(
    'INSERT INTO n8n_templates (title,description,json_url,tags,display_order,visible) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    [f.title, f.description, f.json_url, f.tags, f.display_order, f.visible]);
  res.json(rows[0]);
});
router.put('/templates/:id', async (req, res) => {
  const tid = id(req);
  const f = validate.body(req.body, templateSpec, NO_EMOJI);
  await getPool().query('UPDATE n8n_templates SET title=$1,description=$2,json_url=$3,tags=$4,display_order=$5,visible=$6,updated_at=NOW() WHERE id=$7',
    [f.title, f.description, f.json_url, f.tags, f.display_order, f.visible, tid]);
  res.json({ ok: true });
});
router.delete('/templates/:id', async (req, res) => {
  await getPool().query('DELETE FROM n8n_templates WHERE id=$1', [id(req)]);
  res.json({ ok: true });
});

// ─── COLLAB ──────────────────────────────────────────────────────────────────
router.get('/collabs', async (req, res) => {
  const { rows } = await getPool().query('SELECT * FROM collab_requests ORDER BY created_at DESC');
  res.json(rows);
});
router.put('/collabs/:id/read', async (req, res) => {
  await getPool().query('UPDATE collab_requests SET read=true WHERE id=$1', [id(req)]);
  res.json({ ok: true });
});
router.delete('/collabs/:id', async (req, res) => {
  await getPool().query('DELETE FROM collab_requests WHERE id=$1', [id(req)]);
  res.json({ ok: true });
});

// ─── SUGGESTIONS ─────────────────────────────────────────────────────────────
router.get('/suggestions', async (req, res) => {
  const { rows } = await getPool().query('SELECT * FROM suggestions ORDER BY created_at DESC');
  res.json(rows);
});
router.put('/suggestions/:id/read', async (req, res) => {
  await getPool().query('UPDATE suggestions SET read=true WHERE id=$1', [id(req)]);
  res.json({ ok: true });
});
router.delete('/suggestions/:id', async (req, res) => {
  await getPool().query('DELETE FROM suggestions WHERE id=$1', [id(req)]);
  res.json({ ok: true });
});

// ─── CUSTOM ICONS ────────────────────────────────────────────────────────────
// The public list is GET /api/icons/custom. Creating and deleting needs the admin token.
router.post('/icons/custom', async (req, res) => {
  const f = validate.body(req.body, { name: { type: 'string', required: true, max: 40 }, svg: { type: 'string', required: true, max: 12000, multiline: true } });
  const count = await getPool().query('SELECT COUNT(*) FROM custom_icons');
  if (parseInt(count.rows[0].count, 10) >= 100) throw new ApiError(400, 'You can keep at most 100 custom icons. Delete one first.', 'limit');
  let clean;
  try { clean = sanitize(f.svg); }
  catch (e) {
    if (e instanceof SvgRejected) throw new ApiError(400, `That SVG was not accepted. ${e.message}`, 'svg_rejected');
    throw e;
  }
  const { rows } = await getPool().query('INSERT INTO custom_icons (name,svg) VALUES ($1,$2) RETURNING id, name', [iconVocab.stripEmoji(f.name), clean.svg]);
  res.json({ id: rows[0].id, name: rows[0].name, viewBox: clean.viewBox, body: clean.body });
});
router.delete('/icons/custom/:id', async (req, res) => {
  await getPool().query('DELETE FROM custom_icons WHERE id=$1', [id(req)]);
  res.json({ ok: true });
});

// ─── STATS ───────────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
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
});

module.exports = router;
