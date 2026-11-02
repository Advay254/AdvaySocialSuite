/*
 * Admin routes for the theme engine. Mounted under /api/admin/themes after adminAuth,
 * so every route here already requires the admin token and shares the admin rate limit.
 */
const router = require('../lib/safeRouter')();
const { getPool } = require('../db/init');
const themes = require('../lib/themes');

router.get('/', async (req, res) => {
  res.json(themes.adminPayload(await themes.loadConfig(getPool()), Date.now()));
});

// The whole theme configuration is saved in one request so it is always consistent:
// a deleted custom theme disappears from the rotation and falls back to the default if it was active.
router.put('/', async (req, res) => {
  const { rows } = themes.validateUpdate(req.body);
  await themes.saveRows(getPool(), rows);
  res.json({ ok: true, ...themes.adminPayload(await themes.loadConfig(getPool()), Date.now()) });
});

module.exports = router;
