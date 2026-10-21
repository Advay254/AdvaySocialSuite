/*
 * Same origin by default. Other origins are allowed only when the owner lists them in the
 * allowed_origins setting (comma separated, for example https://example.com).
 */
const { getPool } = require('../db/init');

let cache = { at: 0, list: [] };
const TTL_MS = 60 * 1000;

async function allowedOrigins() {
  if (Date.now() - cache.at < TTL_MS) return cache.list;
  try {
    const { rows } = await getPool().query("SELECT value FROM site_settings WHERE key = 'allowed_origins'");
    const raw = rows[0] ? String(rows[0].value || '') : '';
    cache = { at: Date.now(), list: raw.split(',').map(s => s.trim().replace(/\/+$/, '')).filter(s => /^https?:\/\/[A-Za-z0-9.-]+(:\d{1,5})?$/.test(s)).slice(0, 10) };
  } catch {
    cache = { at: Date.now() - TTL_MS + 5000, list: [] };
  }
  return cache.list;
}

function sameOrigin(req, origin) {
  const host = req.headers.host;
  if (!host) return false;
  return origin === `http://${host}` || origin === `https://${host}`;
}

function corsPolicy() {
  return async function cors(req, res, next) {
    const origin = req.headers.origin;
    if (!origin || sameOrigin(req, origin)) return next();
    let allowed = [];
    try { allowed = await allowedOrigins(); } catch { allowed = []; }
    res.vary('Origin');
    if (allowed.includes(origin)) {
      res.set('Access-Control-Allow-Origin', origin);
      if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.set('Access-Control-Max-Age', '600');
        return res.status(204).end();
      }
      return next();
    }
    // Not allowed: no CORS headers, so the browser blocks the response. A preflight is refused.
    if (req.method === 'OPTIONS') return res.status(403).json({ error: 'This origin is not allowed.', code: 'cors' });
    return next();
  };
}

// Called when the owner saves the setting, so a change applies at once.
function resetCache() { cache = { at: 0, list: [] }; }

module.exports = { corsPolicy, allowedOrigins, resetCache };
