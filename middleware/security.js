/*
 * Security headers, content security policy, cache rules and request size limits.
 * server.js inserts this right before the line that serves static files.
 *
 * The public site loads only its own files, so its policy has no script allowances.
 * The admin page still uses the Tailwind CDN script, one inline script, inline event
 * handlers and inline styles, so it gets its own, wider policy that applies to that page only.
 */
const crypto = require('crypto');
const fs = require('fs');

const PUBLIC_BODY_LIMIT = 50 * 1024;

// Inline <script> blocks in the admin page are allowed by hash, so no 'unsafe-inline' is needed for them.
function inlineScriptHashes(file) {
  try {
    const html = fs.readFileSync(file, 'utf8');
    const hashes = [];
    const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
      if (m[1].trim()) hashes.push(`'sha256-${crypto.createHash('sha256').update(m[1], 'utf8').digest('base64')}'`);
    }
    return hashes;
  } catch { return []; }
}

function publicCsp(secure) {
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",   // inline style attributes only, see style-src-elem
    "style-src-elem 'self'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "media-src 'self'",
    "manifest-src 'self'",
    "worker-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(secure ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
}

function adminCsp(hashes, secure) {
  return [
    "default-src 'self'",
    `script-src 'self' https://cdn.tailwindcss.com ${hashes.join(' ')} 'unsafe-eval'`.replace(/\s+/g, ' '),
    "script-src-attr 'unsafe-inline'",    // the admin page uses inline onclick handlers
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // inline styles and the style tag Tailwind writes
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https:",
    "connect-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(secure ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
}

function createSecurity({ adminPath, adminHtmlFile }) {
  const adminPage = '/' + String(adminPath || '').replace(/^\/+/, '');
  const hashes = inlineScriptHashes(adminHtmlFile);

  const isSecure = (req) => req.secure || String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https';
  const isApi = (p) => p === '/api' || p.startsWith('/api/') || p === '/health';
  const isAdminApi = (p) => p === '/api/admin' || p.startsWith('/api/admin/');
  const isAdminPage = (p) => p === adminPage || p === adminPage + '/';

  function headers(req, res, next) {
    res.removeHeader('X-Powered-By');
    const secure = isSecure(req);
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': isApi(req.path) ? 'same-site' : 'same-origin',
      'X-DNS-Prefetch-Control': 'off',
      'X-Permitted-Cross-Domain-Policies': 'none',
      'Origin-Agent-Cluster': '?1',
    });
    if (secure) res.set('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
    if (!isApi(req.path)) res.set('Content-Security-Policy', isAdminPage(req.path) ? adminCsp(hashes, secure) : publicCsp(secure));
    next();
  }

  // API responses are never cached. The admin page and admin API are also kept out of search results.
  function cacheRules(req, res, next) {
    const p = req.path;
    if (isApi(p) || isAdminPage(p)) res.set('Cache-Control', 'no-store');
    if (isAdminPage(p) || isAdminApi(p)) res.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    if (req.method === 'GET' || req.method === 'HEAD') {
      // Fonts, vendored libraries and icon files do not change for a given address: cache for a year.
      if (/^\/(fonts|vendor|icons)\//.test(p)) res.set('Cache-Control', 'public, max-age=31536000, immutable');
      // Site scripts and styles are not fingerprinted, so they are cached for an hour and then revalidated.
      else if (/^\/(css|js)\//.test(p)) res.set('Cache-Control', 'public, max-age=3600, must-revalidate');
    }
    next();
  }

  // Public requests are limited to 50 KB. Admin requests are limited by the JSON parser (1 MB).
  function bodyLimit(req, res, next) {
    if (isAdminApi(req.path) || req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();
    const declared = Number(req.headers['content-length'] || 0);
    let size = declared;
    if (!size && req.body && typeof req.body === 'object') {
      try { size = Buffer.byteLength(JSON.stringify(req.body)); } catch { size = 0; }
    }
    if (size > PUBLIC_BODY_LIMIT) {
      return res.status(413).json({ error: 'That request is too large. Please shorten it and try again.', code: 'too_large' });
    }
    next();
  }

  return [headers, cacheRules, bodyLimit];
}

module.exports = { createSecurity, publicCsp, adminCsp, inlineScriptHashes, PUBLIC_BODY_LIMIT };
