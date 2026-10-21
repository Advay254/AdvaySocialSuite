/*
 * Admin login. Credentials are compared in constant time, every kind of failure gets the
 * same answer, and a failed attempt waits a short fixed time before replying.
 * No lockout, sessions or two factor here by design.
 */
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const FAIL_DELAY_MS = 700;

function digest(value) {
  return crypto.createHash('sha256').update(String(value)).digest();
}
// Hashing first makes both sides the same length, so timingSafeEqual never throws or leaks the length.
function same(a, b) { return crypto.timingSafeEqual(digest(a), digest(b)); }

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function login(req, res) {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const username = typeof body.username === 'string' && body.username.length <= 200 ? body.username : '';
  const password = typeof body.password === 'string' && body.password.length <= 500 ? body.password : '';
  const wantUser = process.env.ADMIN_USERNAME || '';
  const wantPass = process.env.ADMIN_PASSWORD || '';

  // Both comparisons always run. An account with no configured password can never log in.
  const userOk = same(username, wantUser);
  const passOk = same(password, wantPass);
  const ok = userOk && passOk && wantUser.length > 0 && wantPass.length > 0 && !!process.env.JWT_SECRET;

  if (ok) {
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token });
  }
  await sleep(FAIL_DELAY_MS);
  return res.status(401).json({ error: 'Invalid credentials' });
}

module.exports = { login, same };
