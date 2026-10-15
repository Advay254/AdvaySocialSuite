/*
 * Encrypts small secrets (the AI provider key) before they are stored.
 * AES-256-GCM, key derived from the existing JWT_SECRET with HKDF.
 * Stored format: "v1:" + base64url(iv) + ":" + base64url(tag) + ":" + base64url(ciphertext)
 * The version prefix lets the format change later without breaking old rows.
 */
const crypto = require('crypto');

const VERSION = 'v1';
const INFO = 'advaysocialsuite/ai-provider-key/v1';
const SALT = 'advaysocialsuite-static-salt';

let cachedKey = null;
let cachedFor = null;

function deriveKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('missing-secret');
  if (cachedKey && cachedFor === secret) return cachedKey;
  const raw = crypto.hkdfSync('sha256', Buffer.from(secret, 'utf8'), Buffer.from(SALT), Buffer.from(INFO), 32);
  cachedKey = Buffer.from(raw);
  cachedFor = secret;
  return cachedKey;
}

function encrypt(plain) {
  const key = deriveKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString('base64url'), tag.toString('base64url'), ct.toString('base64url')].join(':');
}

// Returns the plain text, or null when the value is empty, unreadable or tampered with.
// Never throws and never includes any part of the value in an error.
function decrypt(stored) {
  try {
    if (!stored || typeof stored !== 'string') return null;
    const parts = stored.split(':');
    if (parts.length !== 4 || parts[0] !== VERSION) return null;
    const key = deriveKey();
    const iv = Buffer.from(parts[1], 'base64url');
    const tag = Buffer.from(parts[2], 'base64url');
    const ct = Buffer.from(parts[3], 'base64url');
    if (iv.length !== 12 || tag.length !== 16) return null;
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

function mask(plain) {
  if (!plain) return '';
  const last = plain.slice(-4);
  return '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022' + last;
}

module.exports = { encrypt, decrypt, mask };
