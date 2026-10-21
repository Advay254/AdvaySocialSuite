/*
 * Request ids, the JSON 404 for unknown API paths and the one central error handler.
 * No stack trace, database message or internal detail ever leaves the server.
 */
const crypto = require('crypto');
const { ApiError } = require('../lib/apiError');

function requestId(req, res, next) {
  req.id = crypto.randomBytes(6).toString('hex');
  res.set('X-Request-Id', req.id);
  next();
}

function notFoundApi(req, res) {
  res.status(404).json({ error: 'That address does not exist.', code: 'not_found', requestId: req.id });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (!req.id) req.id = crypto.randomBytes(6).toString('hex');
  const id = req.id;
  if (res.headersSent) { try { res.end(); } catch { /* connection already closed */ } return; }

  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message, code: err.code, ...(err.extra || {}), requestId: id });
  }
  // Errors raised by the body parser
  if (err && (err.type === 'entity.too.large' || err.status === 413)) {
    return res.status(413).json({ error: 'That request is too large. Please shorten it and try again.', code: 'too_large', requestId: id });
  }
  if (err && (err.type === 'entity.parse.failed' || err instanceof SyntaxError)) {
    return res.status(400).json({ error: 'The request could not be read. Please try again.', code: 'bad_json', requestId: id });
  }
  // Everything else is logged here only, with the request id, and answered generically.
  console.error(`[${id}] ${req.method} ${String(req.originalUrl || req.url).split('?')[0]} failed:`, err && err.stack ? err.stack : err);
  res.status(500).json({ error: 'Something went wrong on our side. Please try again in a moment.', code: 'server_error', requestId: id });
}

module.exports = { requestId, notFoundApi, errorHandler };
