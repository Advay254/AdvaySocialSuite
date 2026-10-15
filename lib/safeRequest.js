/*
 * Outbound HTTPS requests to an address the owner typed in the admin.
 *
 * Rules enforced here for every call:
 *  - https only, no credentials in the URL
 *  - redirects are never followed
 *  - the host is resolved first and the request is refused if ANY resolved
 *    address is private, loopback, link local, unique local, multicast,
 *    reserved or a cloud metadata address (IPv4 and IPv6)
 *  - the connection is made to the address that was checked (the lookup is
 *    pinned), so the name cannot change to a private address in between
 *  - hard timeout and hard response size cap
 */
const https = require('https');
const dns = require('dns');
const net = require('net');

class SafeRequestError extends Error {
  constructor(code, message) {
    super(message || code);
    this.code = code; // blocked | invalid-url | dns | timeout | connect | tls | too-large | aborted
  }
}

// ---- address checks --------------------------------------------------------

function ipv4ToInt(ip) {
  const p = ip.split('.').map(Number);
  return ((p[0] << 24) >>> 0) + (p[1] << 16) + (p[2] << 8) + p[3];
}

const V4_BLOCKS = [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
  ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24],
  ['192.88.99.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24],
  ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4],
].map(([base, bits]) => ({ base: ipv4ToInt(base), mask: bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0 }));

function isBlockedV4(ip) {
  const n = ipv4ToInt(ip);
  return V4_BLOCKS.some(b => ((n & b.mask) >>> 0) === ((b.base & b.mask) >>> 0));
}

// Expand an IPv6 string to eight 16 bit groups. Returns null if it cannot be parsed.
function expandV6(ip) {
  let s = ip.toLowerCase().split('%')[0];
  // embedded dotted IPv4 tail
  const m = s.match(/^(.*:)(\d+\.\d+\.\d+\.\d+)$/);
  if (m) {
    if (!net.isIPv4(m[2])) return null;
    const n = ipv4ToInt(m[2]);
    s = m[1] + ((n >>> 16) & 0xffff).toString(16) + ':' + (n & 0xffff).toString(16);
  }
  const halves = s.split('::');
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(':') : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  let groups;
  if (halves.length === 2) {
    const fill = 8 - head.length - tail.length;
    if (fill < 0) return null;
    groups = [...head, ...Array(fill).fill('0'), ...tail];
  } else {
    groups = head;
  }
  if (groups.length !== 8) return null;
  const out = groups.map(g => parseInt(g || '0', 16));
  if (out.some(x => Number.isNaN(x) || x < 0 || x > 0xffff)) return null;
  return out;
}

function isBlockedV6(ip) {
  const g = expandV6(ip);
  if (!g) return true; // unparseable: refuse
  const allZeroUpTo = (n) => g.slice(0, n).every(x => x === 0);
  if (allZeroUpTo(8)) return true;                         // ::
  if (allZeroUpTo(7) && g[7] === 1) return true;           // ::1
  if (allZeroUpTo(5) && g[5] === 0xffff) {                 // ::ffff:a.b.c.d (mapped)
    return isBlockedV4(`${g[6] >> 8}.${g[6] & 255}.${g[7] >> 8}.${g[7] & 255}`);
  }
  if (allZeroUpTo(6)) {                                    // ::a.b.c.d (deprecated compatible)
    return isBlockedV4(`${g[6] >> 8}.${g[6] & 255}.${g[7] >> 8}.${g[7] & 255}`);
  }
  if (g[0] === 0x64 && g[1] === 0xff9b && g.slice(2, 6).every(x => x === 0)) { // 64:ff9b::/96 NAT64
    return isBlockedV4(`${g[6] >> 8}.${g[6] & 255}.${g[7] >> 8}.${g[7] & 255}`);
  }
  if (g[0] === 0x2002) {                                   // 6to4 embeds an IPv4 address
    return isBlockedV4(`${g[1] >> 8}.${g[1] & 255}.${g[2] >> 8}.${g[2] & 255}`);
  }
  if ((g[0] & 0xfe00) === 0xfc00) return true;             // fc00::/7 unique local (incl. fd00:ec2::254)
  if ((g[0] & 0xffc0) === 0xfe80) return true;             // fe80::/10 link local
  if ((g[0] & 0xffc0) === 0xfec0) return true;             // fec0::/10 site local (deprecated)
  if ((g[0] & 0xff00) === 0xff00) return true;             // ff00::/8 multicast
  if (g[0] === 0x2001 && g[1] === 0x0db8) return true;     // documentation
  if (g[0] === 0x0100 && g[1] === 0 && g[2] === 0 && g[3] === 0) return true; // 100::/64 discard
  return false;
}

function isBlockedAddress(ip) {
  if (net.isIPv4(ip)) return isBlockedV4(ip);
  if (net.isIPv6(ip)) return isBlockedV6(ip);
  return true;
}

// ---- url checks ------------------------------------------------------------

const BAD_HOST_RE = /(^|\.)(localhost|local|internal|localdomain|home\.arpa)$/i;

// Parses and validates a base URL. Returns a URL object or throws SafeRequestError('invalid-url').
function parseHttpsUrl(raw) {
  let u;
  try { u = new URL(String(raw || '').trim()); } catch { throw new SafeRequestError('invalid-url', 'not a valid address'); }
  if (u.protocol !== 'https:') throw new SafeRequestError('invalid-url', 'https only');
  if (u.username || u.password) throw new SafeRequestError('invalid-url', 'no credentials in address');
  if (!u.hostname) throw new SafeRequestError('invalid-url', 'no host');
  if (BAD_HOST_RE.test(u.hostname)) throw new SafeRequestError('blocked', 'host not allowed');
  return u;
}

async function resolveAndCheck(hostname, lookupFn, blockedFn) {
  const host = hostname.replace(/^\[|\]$/g, '');
  let addrs;
  if (net.isIP(host)) {
    addrs = [{ address: host, family: net.isIPv6(host) ? 6 : 4 }];
  } else {
    try {
      addrs = await lookupFn(host);
    } catch {
      throw new SafeRequestError('dns', 'host not found');
    }
  }
  if (!addrs || !addrs.length) throw new SafeRequestError('dns', 'host not found');
  if (addrs.some(a => blockedFn(a.address))) throw new SafeRequestError('blocked', 'address not allowed');
  return addrs;
}

const defaultLookup = (host) => dns.promises.lookup(host, { all: true, verbatim: true });

/**
 * request(url, { method, headers, body, timeoutMs, maxBytes })
 * Resolves { status, headers, text } or throws SafeRequestError.
 * `deps` exists for tests only: { lookup, isBlocked, tls }.
 */
async function request(rawUrl, opts = {}, deps = {}) {
  const lookupFn = deps.lookup || defaultLookup;
  const blockedFn = deps.isBlocked || isBlockedAddress;
  const timeoutMs = opts.timeoutMs || 10000;
  const maxBytes = opts.maxBytes || 2 * 1024 * 1024;

  const u = parseHttpsUrl(rawUrl);
  const addrs = await resolveAndCheck(u.hostname, lookupFn, blockedFn);
  const pinned = addrs[0];

  const body = opts.body == null ? null : (Buffer.isBuffer(opts.body) ? opts.body : Buffer.from(String(opts.body)));
  const headers = { Accept: 'application/json', 'User-Agent': 'AdvaySocialSuite/1', ...(opts.headers || {}) };
  if (body) headers['Content-Length'] = body.length;

  return new Promise((resolve, reject) => {
    let settled = false;
    const done = (fn, val) => { if (!settled) { settled = true; clearTimeout(timer); fn(val); } };

    const req = https.request({
      protocol: 'https:',
      hostname: u.hostname.replace(/^\[|\]$/g, ''),
      servername: net.isIP(u.hostname.replace(/^\[|\]$/g, '')) ? undefined : u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      method: opts.method || 'GET',
      headers,
      agent: false,
      // Pin the connection to the address that passed the check.
      lookup: (_host, options, cb) => {
        if (options && options.all) return cb(null, [{ address: pinned.address, family: pinned.family }]);
        return cb(null, pinned.address, pinned.family);
      },
      ...(deps.tls || {}),
    }, (res) => {
      // Redirects are never followed. Report them as a status the caller can map.
      let size = 0;
      const chunks = [];
      res.on('data', (c) => {
        size += c.length;
        if (size > maxBytes) {
          res.destroy();
          req.destroy();
          return done(reject, new SafeRequestError('too-large', 'response too large'));
        }
        chunks.push(c);
      });
      res.on('end', () => done(resolve, { status: res.statusCode, headers: res.headers, text: Buffer.concat(chunks).toString('utf8') }));
      res.on('error', () => done(reject, new SafeRequestError('connect', 'connection failed')));
    });

    const timer = setTimeout(() => {
      req.destroy();
      done(reject, new SafeRequestError('timeout', 'timed out'));
    }, timeoutMs);

    req.on('error', (err) => {
      const c = err && err.code;
      if (c === 'ENOTFOUND' || c === 'EAI_AGAIN') return done(reject, new SafeRequestError('dns', 'host not found'));
      if (c && /CERT|SSL|TLS|ERR_TLS|UNABLE_TO_VERIFY|DEPTH_ZERO|SELF_SIGNED|HOSTNAME_MISMATCH/i.test(c)) return done(reject, new SafeRequestError('tls', 'secure connection failed'));
      return done(reject, new SafeRequestError('connect', 'connection failed'));
    });

    if (body) req.write(body);
    req.end();
  });
}

module.exports = { request, parseHttpsUrl, isBlockedAddress, SafeRequestError };
