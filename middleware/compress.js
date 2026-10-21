/*
 * Response compression with Node's built in zlib (Brotli or gzip). Text content only,
 * skipped for small bodies, range requests, already encoded responses and event streams.
 */
const zlib = require('zlib');

const TYPES = /^(text\/|application\/(json|javascript|xml|manifest\+json)|image\/svg\+xml)/i;
const MIN_BYTES = 1024;

function pick(header) {
  const h = String(header || '').toLowerCase();
  if (/\bbr\b/.test(h)) return 'br';
  if (/\bgzip\b/.test(h)) return 'gzip';
  return null;
}

function compress() {
  return function compression(req, res, next) {
    const encoding = pick(req.headers['accept-encoding']);
    if (!encoding || req.method === 'HEAD' || req.headers.range) return next();

    const write = res.write.bind(res);
    const end = res.end.bind(res);
    let stream = null;
    let decided = false;

    function decide() {
      if (decided) return;
      decided = true;
      const type = String(res.getHeader('Content-Type') || '');
      const len = Number(res.getHeader('Content-Length') || 0);
      const skip = res.getHeader('Content-Encoding') || res.statusCode === 204 || res.statusCode === 304 ||
        !TYPES.test(type) || /text\/event-stream/i.test(type) || (len && len < MIN_BYTES);
      res.vary('Accept-Encoding');
      if (skip) return;
      res.setHeader('Content-Encoding', encoding);
      res.removeHeader('Content-Length');
      const etag = res.getHeader('ETag');
      if (etag && !/^W\//.test(String(etag))) res.setHeader('ETag', 'W/' + etag);
      stream = encoding === 'br'
        ? zlib.createBrotliCompress({ params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 4 } })
        : zlib.createGzip({ level: 6 });
      stream.on('data', chunk => write(chunk));
      stream.on('end', () => end());
      stream.on('error', () => end());
    }

    res.write = function (chunk, enc, cb) {
      decide();
      if (!stream) return write(chunk, enc, cb);
      if (typeof enc === 'function') { cb = enc; enc = undefined; }
      return stream.write(chunk, enc, cb);
    };
    res.end = function (chunk, enc, cb) {
      if (typeof chunk === 'function') { cb = chunk; chunk = null; enc = null; }
      else if (typeof enc === 'function') { cb = enc; enc = null; }
      // Small known bodies: look at the real size before deciding.
      if (!decided && chunk && !res.getHeader('Content-Length')) {
        const size = Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk, enc || 'utf8');
        if (size < MIN_BYTES) { decided = true; res.vary('Accept-Encoding'); return end(chunk, enc, cb); }
      }
      decide();
      if (!stream) return end(chunk, enc, cb);
      if (chunk) stream.write(chunk, enc);
      if (typeof cb === 'function') res.once('finish', cb);
      stream.end();
      return res;
    };
    next();
  };
}

module.exports = compress;
