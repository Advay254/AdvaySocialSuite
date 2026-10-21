#!/usr/bin/env node
/*
 * Checks a running site for the protections this project promises.
 *
 *   npm run security-check -- https://your-site.example [--admin-path=your-secret-path] [--limits]
 *
 * It only reads pages and sends a few harmless probes. It never logs in and stores nothing.
 * --limits also sends six bot-trap form posts to confirm the rate limit answers 429
 * (nothing is saved, but your address is limited for the next 15 minutes).
 * Exit code is 1 when anything fails.
 */
const base = (process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'http://localhost:3000').replace(/\/+$/, '');
const adminPath = (process.argv.find(a => a.startsWith('--admin-path=')) || '').split('=')[1] || '';
const withLimits = process.argv.includes('--limits');
const secure = base.startsWith('https://');

let failed = 0;
const pass = (m) => console.log('  PASS  ' + m);
const fail = (m) => { failed++; console.log('  FAIL  ' + m); };
const check = (ok, good, bad) => (ok ? pass(good) : fail(bad || good));

async function get(path, opts = {}) {
  const res = await fetch(base + path, { redirect: 'manual', ...opts });
  const text = await res.text().catch(() => '');
  return { res, text, h: (n) => res.headers.get(n) };
}

(async () => {
  console.log(`Security check for ${base}\n`);

  console.log('Headers on the public page');
  const home = await get('/');
  check(home.res.status === 200, 'home page answers 200', `home page answered ${home.res.status}`);
  check(home.h('x-content-type-options') === 'nosniff', 'X-Content-Type-Options is nosniff');
  check(/deny|sameorigin/i.test(home.h('x-frame-options') || ''), 'framing is blocked (X-Frame-Options)');
  check(!!home.h('referrer-policy'), 'Referrer-Policy is set');
  check(!!home.h('permissions-policy'), 'Permissions-Policy is set');
  check(!home.h('x-powered-by'), 'X-Powered-By is not sent');
  const csp = home.h('content-security-policy') || '';
  check(!!csp, 'Content-Security-Policy is set', 'Content-Security-Policy is missing');
  const scriptSrc = (csp.split(';').map(s => s.trim()).find(s => s.startsWith('script-src ')) || '');
  check(scriptSrc && !/unsafe-inline|unsafe-eval|\*/.test(scriptSrc), 'public script-src has no unsafe-inline, unsafe-eval or wildcard', `public script-src is too loose: ${scriptSrc || 'missing'}`);
  check(/object-src 'none'/.test(csp) && /frame-ancestors 'none'/.test(csp) && /base-uri 'self'/.test(csp), 'object-src, frame-ancestors and base-uri are locked down');
  if (secure) check(/max-age=\d+/.test(home.h('strict-transport-security') || ''), 'HSTS is sent over https');
  else console.log('  SKIP  HSTS (the address is not https)');

  console.log('\nPublic data');
  const settings = await get('/api/settings');
  let keys = [];
  try { keys = Object.keys(JSON.parse(settings.text)); } catch { /* handled below */ }
  check(keys.length > 0, 'public settings load', 'public settings did not load');
  const leaked = keys.filter(k => k.startsWith('_') || k.startsWith('ai_') || k === 'webhook_url' || k === 'chat_system_prompt' || k === 'allowed_origins');
  check(leaked.length === 0, 'public settings contain no private keys', 'private keys are public: ' + leaked.join(', '));
  check(/no-store/.test(settings.h('cache-control') || ''), 'API responses are marked no-store');

  console.log('\nErrors');
  const nf = await get('/api/this-does-not-exist');
  let nfBody = {}; try { nfBody = JSON.parse(nf.text); } catch { /* not json */ }
  check(nf.res.status === 404 && nfBody.code === 'not_found', 'unknown API paths give a JSON 404', `unknown API path answered ${nf.res.status}`);
  const bad = await get('/api/collab', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{not json' });
  check(bad.res.status === 400 && !/at \w|node_modules|SyntaxError|\.js:\d+/.test(bad.text), 'malformed JSON gets a clean 400 with no stack trace', `malformed JSON answered ${bad.res.status}: ${bad.text.slice(0, 80)}`);
  const big = await get('/api/suggest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: 'x'.repeat(70 * 1024), website: 'trap' }) });
  check(big.res.status === 413, 'a 70 KB public request is refused with 413', `a 70 KB public request answered ${big.res.status}`);
  const probe = await get('/api/admin/tools/1%3BDROP%20TABLE%20tools');
  check([400, 401, 404].includes(probe.res.status), 'a hostile id on an admin route is refused without a server error', `hostile id answered ${probe.res.status}`);
  const noAuth = await get('/api/admin/stats');
  check(noAuth.res.status === 401, 'admin API refuses requests without a token', `admin API answered ${noAuth.res.status} without a token`);

  console.log('\nCORS');
  const cors = await get('/api/settings', { headers: { Origin: 'https://not-allowed.example' } });
  check(!cors.h('access-control-allow-origin'), 'another origin gets no CORS access');
  const pre = await get('/api/collab', { method: 'OPTIONS', headers: { Origin: 'https://not-allowed.example', 'Access-Control-Request-Method': 'POST' } });
  check(pre.res.status >= 400 || !pre.h('access-control-allow-origin'), 'a preflight from another origin is refused');

  console.log('\nSpeed and caching');
  const gz = await fetch(base + '/css/style.css', { headers: { 'Accept-Encoding': 'gzip, br' } });
  check(/gzip|br/.test(gz.headers.get('content-encoding') || ''), 'CSS is compressed', 'CSS is not compressed');
  const font = await get('/fonts/satoshi-400.woff2');
  check(/immutable/.test(font.h('cache-control') || ''), 'fonts are cached for a long time', `font cache header is: ${font.h('cache-control')}`);

  if (adminPath) {
    console.log('\nAdmin page');
    const adm = await get('/' + adminPath.replace(/^\/+/, ''));
    check(adm.res.status === 200, 'admin page answers', `admin page answered ${adm.res.status}`);
    check(/noindex/.test(adm.h('x-robots-tag') || ''), 'admin page is marked noindex');
    check(/no-store/.test(adm.h('cache-control') || ''), 'admin page is marked no-store');
    check(!!adm.h('content-security-policy'), 'admin page has its own Content-Security-Policy');
  } else console.log('\nAdmin page: skipped (pass --admin-path=your-secret-path to include it)');

  if (withLimits) {
    console.log('\nRate limit');
    let last = 0;
    for (let i = 0; i < 7; i++) {
      const r = await get('/api/suggest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: 'rate limit check', website: 'trap' }) });
      last = r.res.status;
      if (last === 429) { check(!!r.h('retry-after'), 'the 429 answer includes Retry-After'); break; }
    }
    check(last === 429, 'the form limit answers 429 after repeated posts', 'the form limit never answered 429');
  } else console.log('\nRate limit: skipped (add --limits to test it)');

  console.log(failed ? `\n${failed} check${failed === 1 ? '' : 's'} failed.` : '\nAll checks passed.');
  process.exit(failed ? 1 : 0);
})().catch(err => { console.error('Could not run the checks:', err.message); process.exit(2); });
