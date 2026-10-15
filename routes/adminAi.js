/*
 * Admin routes for the AI provider settings. Mounted under /api/admin/ai
 * after adminAuth, so every route here already requires the admin token.
 */
const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
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
    console.error('[AI settings] read failed:', err && err.message);
    res.status(500).json({ error: 'Could not load the AI settings.' });
  }
});

router.put('/', async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { rows } = await ai.validateUpdate(body);
    await ai.saveRows(rows);
    res.json({ ok: true, settings: await ai.getAdminView() });
  } catch (err) {
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
    const target = await ai.resolveForTry(req.body || {});
    const models = await provider.listModels({ baseUrl: target.baseUrl, apiKey: target.apiKey });
    res.json({ ok: true, models });
  } catch (err) {
    const r = reasonOf(err);
    if (r.code === 'server') console.error('[AI models] failed:', err && err.message);
    res.status(200).json({ ok: false, error: r.message, code: r.code });
  }
});

router.post('/test', tryLimit, async (req, res) => {
  try {
    const target = await ai.resolveForTry(req.body || {});
    if (!target.model) {
      return res.json({ ok: false, error: 'Choose a model first, then test the connection.', code: 'config' });
    }
    const ms = await provider.testConnection(target);
    res.json({ ok: true, ms, message: `Working. The provider answered in ${ms} ms.` });
  } catch (err) {
    const r = reasonOf(err);
    if (r.code === 'server') console.error('[AI test] failed:', err && err.message);
    res.status(200).json({ ok: false, error: r.message, code: r.code });
  }
});

module.exports = router;
