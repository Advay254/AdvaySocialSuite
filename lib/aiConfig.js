/*
 * Reads and writes the AI provider settings (ai_* rows in site_settings).
 * The API key is stored encrypted in ai_api_key_enc and is never returned.
 */
const { getPool } = require('../db/init');
const secretBox = require('./secretBox');
const { normaliseBaseUrl, ProviderError } = require('./aiProvider');

const { DEFAULTS, DEFAULT_SYSTEM_PROMPT } = require('./aiDefaults');

const TEXT_KEYS = Object.keys(DEFAULTS);
const LEGACY_TOKENS_KEY = 'ai_max_tokens'; // only read to carry an old setting over, never written
const KEY_ROW = 'ai_api_key_enc';

const LEGACY_BASE_URL = 'https://api.groq.com/openai/v1';

async function readRows(keys) {
  const { rows } = await getPool().query('SELECT key, value FROM site_settings WHERE key = ANY($1)', [keys]);
  const out = {};
  rows.forEach(r => { out[r.key] = r.value; });
  return out;
}

// Full settings object with defaults filled in, plus the decrypted key state.
async function loadRaw() {
  const rows = await readRows([...TEXT_KEYS, KEY_ROW, LEGACY_TOKENS_KEY]);
  const cfg = {};
  for (const k of TEXT_KEYS) cfg[k] = rows[k] != null && rows[k] !== '' ? rows[k] : (k === 'ai_base_url' || k === 'ai_model' ? '' : DEFAULTS[k]);
  // Allow an explicitly saved empty string for text fields that may be blank
  for (const k of ['ai_disclaimer', 'ai_suggestions', 'ai_greeting']) if (rows[k] === '') cfg[k] = '';
  // Carry an old token setting over (about three characters per token) when no character limit exists yet.
  if (rows.ai_max_chars == null || rows.ai_max_chars === '') {
    const legacy = Number(rows[LEGACY_TOKENS_KEY]);
    if (Number.isFinite(legacy) && legacy > 0) cfg.ai_max_chars = String(Math.min(3000, Math.max(200, Math.round(legacy * 3))));
  }
  const stored = rows[KEY_ROW] || '';
  let apiKey = null;
  let keyState = 'missing';
  if (stored) {
    apiKey = secretBox.decrypt(stored);
    keyState = apiKey ? 'ok' : 'unreadable';
  }
  return { cfg, apiKey, keyState, hasStored: !!stored };
}

// What the admin screen needs. Never contains the key.
async function getAdminView() {
  const { cfg, apiKey, keyState, hasStored } = await loadRaw();
  return {
    ...cfg,
    ai_api_key_set: hasStored ? '1' : '0',
    ai_api_key_hint: apiKey ? secretBox.mask(apiKey) : '',
    ai_api_key_state: keyState,
    default_system_prompt: DEFAULT_SYSTEM_PROMPT,
    legacy_fallback: !!process.env.GROQ_API_KEY,
  };
}

// Active provider for the public chat. Falls back to the legacy Groq variables.
async function getActiveProvider() {
  const { cfg, apiKey, keyState } = await loadRaw();
  const base = {
    enabled: cfg.ai_enabled !== '0',
    systemPrompt: cfg.ai_system_prompt,
    temperature: clampNum(cfg.ai_temperature, 0, 1.5, 0.7),
    maxChars: Math.round(clampNum(cfg.ai_max_chars, 200, 3000, 700)),
    dailyCap: Math.round(clampNum(cfg.ai_daily_cap, 0, 500, 30)),
    offMessage: cfg.ai_off_message,
  };
  if (cfg.ai_base_url && cfg.ai_model && apiKey) {
    return { ...base, source: 'saved', baseUrl: cfg.ai_base_url, model: cfg.ai_model, apiKey };
  }
  if (process.env.GROQ_API_KEY) {
    return { ...base, source: 'legacy', baseUrl: LEGACY_BASE_URL, model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile', apiKey: process.env.GROQ_API_KEY };
  }
  return { ...base, source: 'none', baseUrl: '', model: '', apiKey: null, keyState };
}

// Only what the widget needs. Nothing else.
async function getWidgetConfig() {
  const { cfg } = await loadRaw();
  const prov = await getActiveProvider();
  return {
    enabled: cfg.ai_enabled !== '0' && prov.source !== 'none',
    name: cfg.ai_name,
    launcher_label: cfg.ai_launcher_label,
    greeting: cfg.ai_greeting,
    suggestions: String(cfg.ai_suggestions || '').split('\n').map(s => s.trim()).filter(Boolean).slice(0, 6),
    disclaimer: cfg.ai_disclaimer,
    off_message: cfg.ai_off_message,
  };
}

function clampNum(v, min, max, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

class ValidationError extends Error {
  constructor(fields) { super('validation'); this.fields = fields; }
}

function checkText(body, key, label, max, errors, { required = false } = {}) {
  if (body[key] === undefined) return undefined;
  if (typeof body[key] !== 'string') { errors[key] = `${label} must be text.`; return undefined; }
  const v = body[key].replace(/\r\n/g, '\n').trim();
  if (required && !v) { errors[key] = `${label} cannot be empty.`; return undefined; }
  if (v.length > max) { errors[key] = `${label} is too long (maximum ${max} characters).`; return undefined; }
  return v;
}

/**
 * Validates the body of PUT /api/admin/ai. Returns { rows, newKey, clearKey }.
 * Throws ValidationError({ field: message }).
 */
async function validateUpdate(body) {
  const errors = {};
  const out = {};
  const current = await loadRaw();

  if (body.ai_enabled !== undefined) {
    if (!['0', '1', 0, 1, true, false].includes(body.ai_enabled)) errors.ai_enabled = 'Chat on or off must be on or off.';
    else out.ai_enabled = (body.ai_enabled === '1' || body.ai_enabled === 1 || body.ai_enabled === true) ? '1' : '0';
  }

  // Base URL
  let urlChanged = false;
  if (body.ai_base_url !== undefined) {
    const raw = typeof body.ai_base_url === 'string' ? body.ai_base_url.trim() : '';
    if (raw.length > 300) errors.ai_base_url = 'The Base URL is too long.';
    else if (raw === '') out.ai_base_url = '';
    else {
      try {
        const clean = normaliseBaseUrl(raw);
        out.ai_base_url = clean;
        if (clean !== current.cfg.ai_base_url) urlChanged = true;
      } catch (e) {
        errors.ai_base_url = e instanceof ProviderError ? e.publicMessage : 'The Base URL is not valid.';
      }
    }
  }

  const model = checkText(body, 'ai_model', 'Model', 200, errors);
  if (model !== undefined) out.ai_model = model;

  // Key handling
  let newKey = null;
  let clearKey = false;
  if (body.ai_api_key !== undefined && body.ai_api_key !== null && body.ai_api_key !== '') {
    if (typeof body.ai_api_key !== 'string' || body.ai_api_key.trim().length < 8 || body.ai_api_key.length > 600 || /\s/.test(body.ai_api_key.trim())) {
      errors.ai_api_key = 'That does not look like an API key. Paste it again without spaces.';
    } else newKey = body.ai_api_key.trim();
  }
  if (body.ai_api_key_clear === true || body.ai_api_key_clear === '1') clearKey = true;
  if (clearKey && newKey) errors.ai_api_key = 'Choose either a new key or clear the key, not both.';

  if (urlChanged && out.ai_base_url && !newKey && !clearKey) {
    errors.ai_api_key = 'You changed the provider address, so enter that provider\'s API key again.';
  }

  const prompt = checkText(body, 'ai_system_prompt', 'System prompt', 8000, errors, { required: true });
  if (prompt !== undefined) out.ai_system_prompt = prompt;

  if (body.ai_temperature !== undefined) {
    const n = Number(body.ai_temperature);
    if (body.ai_temperature === '' || !Number.isFinite(n) || n < 0 || n > 1.5) errors.ai_temperature = 'Temperature must be a number from 0 to 1.5.';
    else out.ai_temperature = String(Math.round(n * 100) / 100);
  }
  if (body.ai_max_chars !== undefined) {
    const n = Number(body.ai_max_chars);
    if (body.ai_max_chars === '' || !Number.isInteger(n) || n < 200 || n > 3000) errors.ai_max_chars = 'Maximum reply length must be a whole number of characters from 200 to 3000.';
    else out.ai_max_chars = String(n);
  }
  if (body.ai_daily_cap !== undefined) {
    const n = Number(body.ai_daily_cap);
    if (body.ai_daily_cap === '' || !Number.isInteger(n) || n < 0 || n > 500) errors.ai_daily_cap = 'Daily limit must be a whole number from 0 to 500 (0 means no limit).';
    else out.ai_daily_cap = String(n);
  }

  const off = checkText(body, 'ai_off_message', 'Message when chat is off', 300, errors, { required: true });
  if (off !== undefined) out.ai_off_message = off;
  const name = checkText(body, 'ai_name', 'Assistant name', 40, errors, { required: true });
  if (name !== undefined) out.ai_name = name;
  const label = checkText(body, 'ai_launcher_label', 'Launcher label', 40, errors, { required: true });
  if (label !== undefined) out.ai_launcher_label = label;
  const greet = checkText(body, 'ai_greeting', 'Greeting', 400, errors);
  if (greet !== undefined) out.ai_greeting = greet;
  const disc = checkText(body, 'ai_disclaimer', 'Disclaimer', 200, errors);
  if (disc !== undefined) out.ai_disclaimer = disc;

  if (body.ai_suggestions !== undefined) {
    if (typeof body.ai_suggestions !== 'string') errors.ai_suggestions = 'Suggested questions must be text, one per line.';
    else {
      const lines = body.ai_suggestions.replace(/\r\n/g, '\n').split('\n').map(s => s.trim()).filter(Boolean);
      if (lines.length > 6) errors.ai_suggestions = 'Use at most 6 suggested questions.';
      else if (lines.some(l => l.length > 100)) errors.ai_suggestions = 'Each suggested question can be at most 100 characters.';
      else out.ai_suggestions = lines.join('\n');
    }
  }

  // Control characters never belong in these fields.
  for (const [k, v] of Object.entries(out)) {
    if (typeof v === 'string' && /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(v)) errors[k] = 'That text contains characters that are not allowed.';
  }

  if (Object.keys(errors).length) throw new ValidationError(errors);

  const rows = { ...out };
  if (clearKey) rows[KEY_ROW] = '';
  if (newKey) rows[KEY_ROW] = secretBox.encrypt(newKey);
  return { rows, newKey, clearKey };
}

async function saveRows(rows) {
  const pool = getPool();
  for (const [k, v] of Object.entries(rows)) {
    await pool.query(
      'INSERT INTO site_settings (key,value,updated_at) VALUES ($1,$2,NOW()) ON CONFLICT (key) DO UPDATE SET value=$2,updated_at=NOW()',
      [k, v]
    );
  }
}

// Resolve provider values for "load models" and "test": typed values win, saved values fill the gaps.
// A typed address that differs from the saved one never reuses the saved key.
async function resolveForTry(body) {
  const { cfg, apiKey, keyState } = await loadRaw();
  const typedUrl = typeof body.base_url === 'string' ? body.base_url.trim() : '';
  const typedKey = typeof body.api_key === 'string' ? body.api_key.trim() : '';
  const typedModel = typeof body.model === 'string' ? body.model.trim() : '';

  const baseUrl = typedUrl || cfg.ai_base_url;
  if (!baseUrl) throw Object.assign(new Error('no-url'), { publicMessage: 'Enter the Base URL first.' });

  let cleanTyped = null;
  if (typedUrl) cleanTyped = normaliseBaseUrl(typedUrl); // throws ProviderError when invalid
  const sameAsSaved = !cleanTyped || cleanTyped === cfg.ai_base_url;

  let key = typedKey || null;
  if (!key) {
    if (!sameAsSaved) throw Object.assign(new Error('key-needed'), { publicMessage: 'You changed the provider address, so enter that provider\'s API key to try it.' });
    if (apiKey) key = apiKey;
    else if (keyState === 'unreadable') throw Object.assign(new Error('key-unreadable'), { publicMessage: 'The saved API key could not be read. Please enter the key again.' });
    else throw Object.assign(new Error('key-missing'), { publicMessage: 'Enter the API key first.' });
  }
  return { baseUrl: cleanTyped || cfg.ai_base_url, apiKey: key, model: typedModel || cfg.ai_model };
}

module.exports = {
  DEFAULTS, DEFAULT_SYSTEM_PROMPT, getAdminView, getActiveProvider, getWidgetConfig,
  validateUpdate, saveRows, resolveForTry, ValidationError,
};
