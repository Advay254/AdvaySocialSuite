/*
 * Admin routes for the AI provider settings. Mounted under /api/admin/ai
 * after adminAuth, so every route here already requires the admin token.
 */
const rateLimit = require('express-rate-limit');
const router = require('../lib/safeRouter')();
const { ApiError } = require('../lib/apiError');
const ai = require('../lib/aiConfig');
const provider = require('../lib/aiProvider');

const tryLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many attempts. Wait a minute and try again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

function reasonOf(err) {
  if (err instanceof provider.ProviderError) return { message: err.publicMessage, code: err.code };
  if (err && err.publicMessage) return { message: err.publicMessage, code: 'config' };
  return { message: 'Something went wrong on the server. Try again.', code: 'server' };
}

router.get('/', async (req, res) => {
  try {
    res.json(await ai.getAdminView());
  } catch (err) {
    if (err instanceof ApiError) throw err;
    console.error('[AI settings] read failed:', err && err.message);
    res.status(500).json({ error: 'Could not load the AI settings.' });
  }
});

const AI_FIELDS = new Set(['ai_enabled', 'ai_base_url', 'ai_model', 'ai_system_prompt', 'ai_temperature', 'ai_max_chars', 'ai_daily_cap', 'ai_off_message', 'ai_name', 'ai_launcher_label', 'ai_greeting', 'ai_suggestions', 'ai_disclaimer', 'ai_api_key', 'ai_api_key_clear']);
const TRY_FIELDS = new Set(['base_url', 'api_key', 'model']);
function onlyFields(body, allowed) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ApiError(400, 'The request body must be a JSON object.', 'validation');
  const extra = Object.keys(body).filter(k => !allowed.has(k));
  if (extra.length) throw new ApiError(400, 'Some fields are not accepted.', 'validation', { fields: Object.fromEntries(extra.map(k => [k, 'This field is not accepted.'])) });
  return body;
}

router.put('/', async (req, res) => {
  try {
    const body = onlyFields(req.body, AI_FIELDS);
    const { rows } = await ai.validateUpdate(body);
    await ai.saveRows(rows);
    res.json({ ok: true, settings: await ai.getAdminView() });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof ai.ValidationError) {
      return res.status(400).json({ error: 'Some AI settings need fixing.', fields: err.fields });
    }
    if (err && err.message === 'missing-secret') {
      return res.status(500).json({ error: 'The server is missing JWT_SECRET, so the key cannot be stored safely.' });
    }
    console.error('[AI settings] save failed:', err && err.message);
    res.status(500).json({ error: 'Could not save the AI settings.' });
  }
});

router.post('/models', tryLimit, async (req, res) => {
  try {
    const target = await ai.resolveForTry(onlyFields(req.body || {}, TRY_FIELDS));
    const models = await provider.listModels({ baseUrl: target.baseUrl, apiKey: target.apiKey });
    res.json({ ok: true, models });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    const r = reasonOf(err);
    if (r.code === 'server') console.error('[AI models] failed:', err && err.message);
    res.status(200).json({ ok: false, error: r.message, code: r.code });
  }
});

router.post('/test', tryLimit, async (req, res) => {
  try {
    const target = await ai.resolveForTry(onlyFields(req.body || {}, TRY_FIELDS));
    if (!target.model) {
      return res.json({ ok: false, error: 'Choose a model first, then test the connection.', code: 'config' });
    }
    const ms = await provider.testConnection(target);
    res.json({ ok: true, ms, message: `Working. The provider answered in ${ms} ms.` });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    const r = reasonOf(err);
    if (r.code === 'server') console.error('[AI test] failed:', err && err.message);
    res.status(200).json({ ok: false, error: r.message, code: r.code });
  }
});

module.exports = router;
