/*
 * Theme settings on the server: reading them leniently, validating them strictly,
 * building the public payload and the one time colour migration.
 *
 * The colour rules live in public/js/theme-core.js, the same file the browser uses.
 */
const crypto = require('crypto');
const T = require('../public/js/theme-core');
const { ApiError } = require('./apiError');
const iconVocab = require('./iconVocab');

const KEYS = ['theme_mode', 'theme_active', 'theme_rotation', 'theme_interval_sec', 'theme_transition', 'theme_sync', 'theme_visitor_panel', 'theme_custom'];
const MODES = ['fixed', 'shift', 'random'];
const TRANSITIONS = Object.keys(T.TRANSITIONS);
const MAX_ROTATION = T.PRESETS.length + T.LIMITS.custom;

const DEFAULTS = Object.freeze({
  theme_mode: 'shift',
  theme_active: T.DEFAULT_ID,
  theme_rotation: JSON.stringify(T.PRESET_IDS),
  theme_interval_sec: '60',
  theme_transition: 'smooth',
  theme_sync: 'on',
  theme_visitor_panel: 'on',
  theme_custom: '[]',
});

const onOff = (v, fallback) => (v === 'on' || v === 'off' ? v === 'on' : fallback);
function parseJson(v, fallback) { try { const x = JSON.parse(v); return x == null ? fallback : x; } catch { return fallback; } }
function cleanName(v) {
  return iconVocab.stripEmoji(String(v == null ? '' : v).replace(/[\u0000-\u001F\u007F]+/g, ' ')).replace(/\s+/g, ' ').trim();
}

// One custom theme definition from stored data. Returns null when it is unusable.
function readCustomDef(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const name = cleanName(raw.name).slice(0, T.LIMITS.name);
  const accent = T.normHex(raw.accent), accent2 = T.normHex(raw.accent2);
  if (!name || !accent || !accent2 || !T.CUSTOM_ID_RE.test(String(raw.id || ''))) return null;
  const def = { id: raw.id, name, accent, accent2, mood: T.MOODS.includes(raw.mood) ? raw.mood : 'dark' };
  const o = {};
  if (raw.overrides && typeof raw.overrides === 'object') T.KEYS.forEach(k => { const v = T.normHex(raw.overrides[k]); if (v) o[k] = v; });
  if (Object.keys(o).length) def.overrides = o;
  return def;
}

// Reads the stored settings without ever throwing. `map` is { key: value } from site_settings.
function readConfig(map) {
  map = map || {};
  const custom = [];
  const seen = new Set();
  const list = parseJson(map.theme_custom, []);
  (Array.isArray(list) ? list : []).forEach(item => {
    const d = readCustomDef(item);
    if (d && !seen.has(d.id) && custom.length < T.LIMITS.custom) { seen.add(d.id); custom.push(d); }
  });
  const known = new Set([...T.PRESET_IDS, ...custom.map(c => c.id)]);

  const mode = MODES.includes(map.theme_mode) ? map.theme_mode : DEFAULTS.theme_mode;
  const active = known.has(map.theme_active) ? map.theme_active : T.DEFAULT_ID;
  const rawRot = parseJson(map.theme_rotation, T.PRESET_IDS);
  let rotation = [];
  (Array.isArray(rawRot) ? rawRot : []).forEach(id => { if (known.has(id) && !rotation.includes(id)) rotation.push(id); });
  if (!rotation.length) rotation = [active];
  const iv = Number(map.theme_interval_sec);
  const interval = Number.isInteger(iv) && iv >= T.LIMITS.minInterval && iv <= T.LIMITS.maxInterval ? iv : 60;
  return {
    mode, active, rotation, interval,
    transition: TRANSITIONS.includes(map.theme_transition) ? map.theme_transition : 'smooth',
    sync: onOff(map.theme_sync, true),
    visitorPanel: onOff(map.theme_visitor_panel, true),
    custom,
  };
}

function allDefs(config) { return [...T.PRESETS, ...config.custom]; }
function resolveAll(config) { return allDefs(config).map(d => T.resolve(d)).filter(Boolean); }
function resolveById(config, id) {
  const defs = allDefs(config);
  const d = defs.find(x => x.id === id) || T.PRESETS[0];
  return T.resolve(d);
}

// What the public site receives. `now` is the server clock in milliseconds.
function publicPayload(config, now) {
  return {
    now,
    mode: config.mode, active: config.active, rotation: config.rotation, interval: config.interval,
    transition: config.transition, sync: config.sync, visitorPanel: config.visitorPanel,
    themes: resolveAll(config),
  };
}

// What the admin screen receives: the same, plus the editable definitions.
function adminPayload(config, now) {
  return {
    now,
    mode: config.mode, active: config.active, rotation: config.rotation, interval: config.interval,
    transition: config.transition, sync: config.sync, visitorPanel: config.visitorPanel,
    presets: T.PRESETS,
    custom: config.custom,
    limits: { name: T.LIMITS.name, custom: T.LIMITS.custom, minInterval: T.LIMITS.minInterval, maxInterval: T.LIMITS.maxInterval },
  };
}

// The theme the server paints into the first response.
function pickForRender(config, now, rnd) {
  const ids = config.rotation;
  let id;
  if (config.mode === 'random') id = ids[Math.min(ids.length - 1, Math.floor((typeof rnd === 'number' ? rnd : Math.random()) * ids.length))];
  else id = T.pickId(config, now, { sync: true, start: 0, reduced: false });
  if (config.mode === 'shift' && !config.sync) id = ids[0];
  return resolveById(config, id);
}

// ─── Strict validation for the admin ───────────────────────────────────────────
const ALLOWED = new Set(['mode', 'active', 'rotation', 'interval', 'transition', 'sync', 'visitor_panel', 'custom']);

function bool(v, field, errors) {
  if (v === true || v === 'on' || v === 'true' || v === 1) return true;
  if (v === false || v === 'off' || v === 'false' || v === 0) return false;
  errors[field] = 'Choose on or off.';
  return true;
}

function newId(taken) {
  for (let i = 0; i < 50; i++) {
    const id = 'c_' + crypto.randomBytes(4).toString('hex');
    if (!taken.has(id)) return id;
  }
  return 'c_' + crypto.randomBytes(4).toString('hex');
}

// Returns { rows: [[key, value], ...], config } or throws ApiError with a message per field.
function validateUpdate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ApiError(400, 'The request body must be a JSON object.', 'validation');
  const errors = {};
  Object.keys(body).forEach(k => { if (!ALLOWED.has(k)) errors[k] = 'This field is not accepted.'; });

  const mode = body.mode;
  if (!MODES.includes(mode)) errors.mode = 'Choose fixed, shift or random.';

  // Custom themes first, because the other fields refer to their ids.
  const custom = [];
  if (!Array.isArray(body.custom)) errors.custom = 'Custom themes must be a list.';
  else if (body.custom.length > T.LIMITS.custom) errors.custom = `You can keep at most ${T.LIMITS.custom} custom themes.`;
  else {
    const taken = new Set([...T.PRESET_IDS]);
    body.custom.forEach((raw, i) => {
      const label = `custom.${i}`;
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) { errors[label] = 'This theme is not valid.'; return; }
      const name = cleanName(raw.name);
      const accent = T.normHex(raw.accent), accent2 = T.normHex(raw.accent2);
      if (!name) errors[label + '.name'] = 'Give the theme a name.';
      else if (name.length > T.LIMITS.name) errors[label + '.name'] = `Use at most ${T.LIMITS.name} characters.`;
      if (!accent) errors[label + '.accent'] = 'Use a hex colour such as #4f8cff.';
      if (!accent2) errors[label + '.accent2'] = 'Use a hex colour such as #ffc857.';
      if (!T.MOODS.includes(raw.mood)) errors[label + '.mood'] = 'Choose very dark, dark or light.';
      const overrides = {};
      if (raw.overrides != null) {
        if (typeof raw.overrides !== 'object' || Array.isArray(raw.overrides)) errors[label + '.overrides'] = 'Advanced colours are not valid.';
        else Object.keys(raw.overrides).forEach(k => {
          if (!T.KEYS.includes(k)) { errors[`${label}.overrides.${k}`] = 'This colour is not accepted.'; return; }
          const v = raw.overrides[k];
          if (v === '' || v == null) return;
          const h = T.normHex(v);
          if (!h) errors[`${label}.overrides.${k}`] = 'Use a hex colour such as #0f1522.'; else overrides[k] = h;
        });
      }
      let id = typeof raw.id === 'string' && T.CUSTOM_ID_RE.test(raw.id) && !taken.has(raw.id) ? raw.id : newId(taken);
      taken.add(id);
      if (name && name.length <= T.LIMITS.name && accent && accent2 && T.MOODS.includes(raw.mood)) {
        const def = { id, name, accent, accent2, mood: raw.mood };
        if (Object.keys(overrides).length) def.overrides = overrides;
        custom.push(def);
      }
    });
  }
  const known = new Set([...T.PRESET_IDS, ...custom.map(c => c.id)]);

  // A removed or unknown active theme falls back to the default, as the owner's delete should.
  let active = typeof body.active === 'string' && known.has(body.active) ? body.active : T.DEFAULT_ID;
  if (body.active != null && typeof body.active !== 'string') errors.active = 'Choose one of the themes.';

  let rotation = [];
  if (!Array.isArray(body.rotation)) errors.rotation = 'The rotation must be a list.';
  else if (body.rotation.length > MAX_ROTATION * 2) errors.rotation = 'The rotation is too long.';
  else body.rotation.forEach(id => { if (typeof id === 'string' && known.has(id) && !rotation.includes(id)) rotation.push(id); });
  if (!rotation.length) rotation = [active];

  const interval = body.interval;
  if (!Number.isInteger(interval) || interval < T.LIMITS.minInterval || interval > T.LIMITS.maxInterval) {
    errors.interval = `Use a whole number of seconds from ${T.LIMITS.minInterval} to ${T.LIMITS.maxInterval} (one day).`;
  }
  if (!TRANSITIONS.includes(body.transition)) errors.transition = 'Choose instant, smooth or slow.';
  const sync = bool(body.sync, 'sync', errors);
  const panel = bool(body.visitor_panel, 'visitor_panel', errors);

  if (Object.keys(errors).length) {
    throw new ApiError(400, Object.values(errors)[0], 'validation', { fields: errors });
  }
  const rows = [
    ['theme_mode', mode], ['theme_active', active], ['theme_rotation', JSON.stringify(rotation)],
    ['theme_interval_sec', String(interval)], ['theme_transition', body.transition],
    ['theme_sync', sync ? 'on' : 'off'], ['theme_visitor_panel', panel ? 'on' : 'off'], ['theme_custom', JSON.stringify(custom)],
  ];
  const map = Object.fromEntries(rows);
  return { rows, config: readConfig(map) };
}

// ─── Database access ──────────────────────────────────────────────────────────
async function loadMap(db) {
  const { rows } = await db.query('SELECT key, value FROM site_settings');
  const map = {};
  rows.forEach(r => { map[r.key] = r.value; });
  return map;
}
async function loadConfig(db) { return readConfig(await loadMap(db)); }

async function saveRows(db, rows) {
  for (const [k, v] of rows) {
    await db.query('INSERT INTO site_settings (key,value,updated_at) VALUES ($1,$2,NOW()) ON CONFLICT (key) DO UPDATE SET value=$2,updated_at=NOW()', [k, v]);
  }
}

// ─── Migration of the 1.0.1 accent colour ─────────────────────────────────────
const OLD_DEFAULTS = new Set(['#b98b6e', '#0b7285']);
const MARKER = '_migrated_theme_120';

// Runs once. A colour the owner saved in 1.0.1 becomes a custom theme called My colours,
// set as the active theme in fixed mode. Safe to run on every boot.
async function migrateAccent(db) {
  const done = await db.query('SELECT 1 FROM site_settings WHERE key = $1', [MARKER]);
  if (done.rows.length) return false;
  const cur = await db.query("SELECT value FROM site_settings WHERE key = 'accent_color'");
  const accent = cur.rows.length ? T.normHex(cur.rows[0].value) : null;
  let migrated = false;
  if (accent && !OLD_DEFAULTS.has(accent)) {
    const id = 'c_' + crypto.createHash('sha1').update(accent).digest('hex').slice(0, 8);
    const def = { id, name: 'My colours', accent, accent2: T.companion(accent), mood: 'dark' };
    const map = await loadMap(db);
    const existing = readConfig(map).custom.filter(c => c.id !== id);
    if (existing.length < T.LIMITS.custom) {
      await saveRows(db, [['theme_custom', JSON.stringify([...existing, def])], ['theme_active', id], ['theme_mode', 'fixed']]);
      migrated = true;
    }
  }
  await db.query("INSERT INTO site_settings (key,value) VALUES ($1,'1') ON CONFLICT (key) DO NOTHING", [MARKER]);
  return migrated;
}

module.exports = {
  KEYS, DEFAULTS, MODES, TRANSITIONS,
  readConfig, publicPayload, adminPayload, pickForRender, resolveAll, resolveById, validateUpdate,
  loadMap, loadConfig, saveRows, migrateAccent,
};
