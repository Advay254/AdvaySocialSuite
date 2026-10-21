/*
 * express.Router() whose handlers are wrapped so a rejected promise or a thrown error
 * goes to the central error handler instead of crashing the request or leaking details.
 * Use it exactly like express.Router().
 */
const express = require('express');

function wrap(fn) {
  if (typeof fn !== 'function' || fn.length >= 4) return fn; // error handlers are left alone
  return function wrapped(req, res, next) {
    try {
      const out = fn(req, res, next);
      if (out && typeof out.then === 'function') return out.catch(next);
    } catch (err) { next(err); }
  };
}

function safeRouter() {
  const router = express.Router();
  for (const method of ['get', 'post', 'put', 'patch', 'delete', 'all']) {
    const original = router[method].bind(router);
    router[method] = (path, ...handlers) => original(path, ...handlers.map(h => (Array.isArray(h) ? h.map(wrap) : wrap(h))));
  }
  const originalUse = router.use.bind(router);
  router.use = (...args) => originalUse(...args.map(a => (typeof a === 'function' ? wrap(a) : a)));
  return router;
}

module.exports = safeRouter;
module.exports.wrap = wrap;
