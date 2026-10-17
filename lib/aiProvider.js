/*
 * Talks to any OpenAI compatible provider through the safe request layer.
 * Provider error text is never returned to callers: every failure is mapped
 * to a short plain language reason and a machine code.
 */
const { request, parseHttpsUrl, SafeRequestError } = require('./safeRequest');

class ProviderError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code; // key | address | model | quota | server | timeout | blocked | tls | connect | format | config
    this.publicMessage = message; // plain language, safe to show to the owner (never to visitors)
  }
}

const MESSAGES = {
  key: 'The provider rejected the API key. Check the key and enter it again.',
  address: 'The address was not found. Check the Base URL, it usually ends in /v1.',
  dns: 'The address was not found. Check the Base URL for typing mistakes.',
  model: 'The provider does not have that model. Load the models again and pick one from the list.',
  quota: 'The provider says you are sending too many requests or the quota is used up.',
  server: 'The provider had a problem on its side. Try again in a moment.',
  timeout: 'The provider did not answer in time.',
  blocked: 'That address is not allowed. Use the public https address of the provider.',
  tls: 'The secure connection to the provider failed. Check the address.',
  connect: 'Could not connect to the provider. Check the address.',
  format: 'The provider answered in a format this site does not understand. Check that it is OpenAI compatible.',
  config: 'The provider is not fully set up yet.',
  url: 'The Base URL is not valid. It must start with https://',
};

function fail(code, override) { return new ProviderError(code, override || MESSAGES[code] || MESSAGES.connect); }

// Strip a trailing slash and anything after the path. Returns a clean string or throws ProviderError.
function normaliseBaseUrl(raw) {
  let u;
  try { u = parseHttpsUrl(raw); }
  catch (e) {
    if (e instanceof SafeRequestError && e.code === 'blocked') throw fail('blocked');
    throw fail('url');
  }
  if (u.search || u.hash) throw fail('url', 'The Base URL must not contain a question mark or a hash.');
  return u.origin + u.pathname.replace(/\/+$/, '');
}

function mapTransport(err) {
  if (err instanceof SafeRequestError) {
    switch (err.code) {
      case 'blocked': return fail('blocked');
      case 'invalid-url': return fail('url');
      case 'dns': return fail('dns');
      case 'timeout': return fail('timeout');
      case 'tls': return fail('tls');
      case 'too-large': return fail('format');
      default: return fail('connect');
    }
  }
  return fail('connect');
}

function mapStatus(status, bodyText) {
  if (status === 401 || status === 403) return fail('key');
  if (status === 404) return /model/i.test(bodyText || '') ? fail('model') : fail('address');
  if (status === 400 || status === 422) return /model/i.test(bodyText || '') && /(not found|does not exist|unknown|invalid|not supported|unavailable)/i.test(bodyText || '') ? fail('model') : fail('format', 'The provider did not accept the request. Check the model and settings.');
  if (status === 429) return fail('quota');
  if (status === 408 || status === 504) return fail('timeout');
  if (status >= 500) return fail('server');
  if (status >= 300 && status < 400) return fail('address', 'The address redirected somewhere else. Use the final address of the provider.');
  return fail('format');
}

function authHeaders(apiKey, extra) {
  const h = { 'Content-Type': 'application/json', ...(extra || {}) };
  if (apiKey) h.Authorization = `Bearer ${apiKey}`;
  return h;
}

function safeJson(text) { try { return JSON.parse(text); } catch { return null; } }

// ---- models ----------------------------------------------------------------

function extractModelIds(json, baseUrl) {
  let list = null;
  if (json && Array.isArray(json.data)) list = json.data;
  else if (json && Array.isArray(json.models)) list = json.models;
  else if (Array.isArray(json)) list = json;
  if (!list) return null;
  const googleHost = /generativelanguage\.googleapis\.com/i.test(baseUrl || '');
  const ids = new Set();
  for (const m of list) {
    let id = null;
    if (typeof m === 'string') id = m;
    else if (m && typeof m === 'object') id = m.id || m.name || m.model || null;
    if (typeof id !== 'string') continue;
    id = id.trim();
    if (googleHost) id = id.replace(/^models\//, '');
    if (id && id.length <= 200) ids.add(id);
  }
  return Array.from(ids).sort((a, b) => a.localeCompare(b));
}

async function listModels({ baseUrl, apiKey }, deps) {
  const base = normaliseBaseUrl(baseUrl);
  let res;
  try {
    res = await request(base + '/models', { method: 'GET', headers: authHeaders(apiKey), timeoutMs: 10000, maxBytes: 2 * 1024 * 1024 }, deps);
  } catch (e) { throw mapTransport(e); }
  if (res.status < 200 || res.status >= 300) throw mapStatus(res.status, res.text);
  const ids = extractModelIds(safeJson(res.text), base);
  if (!ids) throw fail('format');
  return ids;
}

// ---- chat ------------------------------------------------------------------

function extractReply(json) {
  const c = json && json.choices && json.choices[0];
  const content = c && c.message && c.message.content;
  const finishReason = c && typeof c.finish_reason === 'string' ? c.finish_reason : '';
  if (typeof content === 'string') return { text: content, finishReason };
  if (Array.isArray(content)) {
    const t = content.map(p => (p && typeof p.text === 'string' ? p.text : '')).join('');
    return { text: t, finishReason };
  }
  // Some models spend the whole cap on hidden thinking and send no content at all.
  if (c && content == null && finishReason === 'length') return { text: '', finishReason };
  return null;
}

/**
 * chat({ baseUrl, apiKey, model, messages, temperature, maxTokens, timeoutMs, detailed })
 * Resolves the reply text, or { text, finishReason } when `detailed` is true. Adapts once or twice for providers that renamed
 * max_tokens or refuse a temperature value.
 */
async function chat(cfg, deps) {
  const base = normaliseBaseUrl(cfg.baseUrl);
  if (!cfg.model) throw fail('config', 'No model is chosen yet.');
  const payload = { model: cfg.model, messages: cfg.messages, max_tokens: cfg.maxTokens, temperature: cfg.temperature, stream: false };

  for (let attempt = 0; attempt < 3; attempt++) {
    let res;
    try {
      res = await request(base + '/chat/completions', {
        method: 'POST', headers: authHeaders(cfg.apiKey), body: JSON.stringify(payload),
        timeoutMs: cfg.timeoutMs || 25000, maxBytes: 2 * 1024 * 1024,
      }, deps);
    } catch (e) { throw mapTransport(e); }

    if (res.status >= 200 && res.status < 300) {
      const reply = extractReply(safeJson(res.text));
      if (reply == null) throw fail('format');
      return cfg.detailed ? reply : reply.text;
    }
    if (res.status === 400 && attempt < 2) {
      const t = res.text || '';
      if ('max_tokens' in payload && /max_completion_tokens/i.test(t)) {
        payload.max_completion_tokens = payload.max_tokens; delete payload.max_tokens; continue;
      }
      if ('temperature' in payload && /temperature/i.test(t)) { delete payload.temperature; continue; }
    }
    throw mapStatus(res.status, res.text);
  }
  throw fail('format');
}

async function testConnection({ baseUrl, apiKey, model }, deps) {
  const started = Date.now();
  await chat({
    baseUrl, apiKey, model, temperature: 0, maxTokens: 16, timeoutMs: 15000,
    messages: [{ role: 'user', content: 'Reply with the single word OK.' }],
  }, deps);
  return Date.now() - started;
}

module.exports = { listModels, chat, testConnection, normaliseBaseUrl, extractModelIds, ProviderError, MESSAGES };
