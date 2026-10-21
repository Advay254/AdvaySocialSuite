/*
 * Every rate limiter for the public and admin API lives here, apart from two that already
 * exist elsewhere and stay where they are: the admin login limiter (server.js) and the chat
 * limiter (routes/chat.js).
 *
 * Limits are per client IP. server.js trusts one proxy hop, so req.ip is the visitor behind
 * the host's proxy. If a second proxy such as Cloudflare sits in front, raise that setting.
 */
const rateLimit = require('express-rate-limit');

function wait(resetTime, windowMs) {
  const ms = resetTime instanceof Date ? resetTime.getTime() - Date.now() : windowMs;
  return Math.max(1, Math.ceil(ms / 1000));
}

function make({ windowMs, max, message, skip }) {
  return rateLimit({
    windowMs, max, skip,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      const secs = wait(req.rateLimit && req.rateLimit.resetTime, windowMs);
      const mins = Math.ceil(secs / 60);
      const when = secs < 90 ? `${secs} seconds` : `about ${mins} minute${mins === 1 ? '' : 's'}`;
      res.set('Retry-After', String(secs));
      res.status(429).json({ error: `${message} Please wait ${when} and try again.`, code: 'rate_limited', retryAfter: secs });
    },
  });
}

const isAdminOrChat = (req) => /^\/(admin|chat)(\/|$)/.test(req.path);

// General limit for the public API.
const publicApi = make({ windowMs: 15 * 60 * 1000, max: 300, message: 'You are sending requests very quickly.', skip: isAdminOrChat });
// Forms: five submissions per fifteen minutes.
const forms = make({ windowMs: 15 * 60 * 1000, max: 5, message: 'You have sent several messages already.' });
// Page view counter.
const pageview = make({ windowMs: 60 * 1000, max: 40, message: 'Too many page views were recorded.' });
// Admin API calls (moderate, a real session makes many small calls).
const admin = make({ windowMs: 15 * 60 * 1000, max: 600, message: 'There have been a lot of admin requests.' });

const FORM_PATHS = new Set(['/collab', '/suggest']);

// Mounted in front of the public router: picks the right limiter for the request.
function publicMount(req, res, next) {
  if (isAdminOrChat(req)) return next();
  if (req.method === 'POST' && req.path === '/pageview') return pageview(req, res, next);
  if (req.method === 'POST' && FORM_PATHS.has(req.path)) {
    return forms(req, res, (err) => (err ? next(err) : publicApi(req, res, next)));
  }
  return publicApi(req, res, next);
}

module.exports = { publicMount, publicApi, forms, pageview, admin };
