/*
 * The one validation module. Every route that accepts input uses it.
 *
 *   const clean = validate.body(req.body, {
 *     title: { type: 'string', required: true, max: 120 },
 *     url:   { type: 'url' },
 *     tags:  { type: 'tags' },
 *   });
 *
 * Unknown fields are rejected (admin writes) or ignored (allowUnknown). Failures throw an ApiError
 * with status 400 and the shape { error, code: 'validation', fields: { name: 'message' } }.
 */
const { ApiError } = require('./apiError');
const iconVocab = require('./iconVocab');

const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const EMAIL_RE = /^[^\s@<>"'`,;:\\()[\]]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

function clean(value, multiline) {
  let s = String(value).replace(CONTROL, '');
  if (!multiline) s = s.replace(/[\r\n\t]+/g, ' ');
  else s = s.replace(/\r\n?/g, '\n');
  return s.trim();
}

function fail(fields) {
  throw new ApiError(400, 'Please check the highlighted fields.', 'validation', { fields });
}

// Parse and range check an integer. Returns the number or throws a 400.
function int(value, { min = 1, max = 2147483647, name = 'value' } = {}) {
  const s = typeof value === 'number' ? String(value) : String(value == null ? '' : value).trim();
  if (!/^-?\d{1,10}$/.test(s)) throw new ApiError(400, `The ${name} is not valid.`, 'validation');
  const n = Number(s);
  if (!Number.isSafeInteger(n) || n < min || n > max) throw new ApiError(400, `The ${name} is not valid.`, 'validation');
  return n;
}

function url(value, max) {
  const s = clean(value, false);
  if (!s) return '';
  if (s.length > max) throw new Error(`Use at most ${max} characters.`);
  let u;
  try { u = new URL(s); } catch { throw new Error('Enter a full web address that starts with http:// or https://'); }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('Only http and https addresses are allowed.');
  if (u.username || u.password) throw new Error('The address must not contain a user name or password.');
  return s;
}

function tags(value, { maxItems = 20, maxLen = 40 } = {}) {
  let arr = value;
  if (typeof arr === 'string') { try { arr = JSON.parse(arr); } catch { throw new Error('Tags must be a list.'); } }
  if (arr == null || arr === '') return '[]';
  if (!Array.isArray(arr)) throw new Error('Tags must be a list.');
  if (arr.length > maxItems) throw new Error(`Use at most ${maxItems} tags.`);
  const out = arr.map(t => {
    if (typeof t !== 'string') throw new Error('Each tag must be text.');
    const c = clean(t, false);
    if (c.length > maxLen) throw new Error(`Each tag can have at most ${maxLen} characters.`);
    return c;
  }).filter(Boolean);
  return JSON.stringify(out);
}

function checkField(value, rule) {
  switch (rule.type) {
    case 'string': {
      if (typeof value !== 'string' && typeof value !== 'number') throw new Error('Enter text.');
      const s = clean(value, !!rule.multiline);
      if (rule.required && !s) throw new Error('This field is required.');
      if (s.length > rule.max) throw new Error(`Use at most ${rule.max} characters.`);
      if (rule.min && s.length < rule.min) throw new Error(`Use at least ${rule.min} characters.`);
      if (rule.enum && s && !rule.enum.includes(s)) throw new Error('Choose one of the allowed values.');
      if (rule.pattern && s && !rule.pattern.test(s)) throw new Error(rule.patternMessage || 'That value is not in the right format.');
      return rule.lower ? s.toLowerCase() : s;
    }
    case 'email': {
      if (typeof value !== 'string') throw new Error('Enter an email address.');
      const s = clean(value, false).toLowerCase();
      if (!s) { if (rule.required) throw new Error('This field is required.'); return ''; }
      if (s.length > 254 || s.includes('..') || !EMAIL_RE.test(s)) throw new Error('Enter a valid email address.');
      return s;
    }
    case 'url': {
      if (typeof value !== 'string') throw new Error('Enter a web address.');
      const s = url(value, rule.max || 2000);
      if (rule.required && !s) throw new Error('This field is required.');
      return s;
    }
    case 'int': {
      if (value === '' || value == null) { if (rule.required) throw new Error('This field is required.'); return rule.default == null ? 0 : rule.default; }
      const s = String(value).trim();
      if (!/^-?\d{1,9}$/.test(s)) throw new Error('Enter a whole number.');
      const n = Number(s);
      if (n < (rule.min == null ? 0 : rule.min) || n > (rule.max == null ? 100000 : rule.max)) throw new Error(`Enter a number from ${rule.min == null ? 0 : rule.min} to ${rule.max == null ? 100000 : rule.max}.`);
      return n;
    }
    case 'bool': {
      if (value === true || value === 'true' || value === 1 || value === '1') return true;
      if (value === false || value === 'false' || value === 0 || value === '0') return false;
      throw new Error('Choose yes or no.');
    }
    case 'tags': return tags(value, rule);
    case 'icon': {
      const v = typeof value === 'string' ? value.trim() : '';
      return iconVocab.isValidIcon(v) ? v : (rule.fallback || iconVocab.FALLBACK);
    }
    default: throw new Error('Unsupported field type.');
  }
}

/**
 * body(input, spec, options)
 * options.allowUnknown   ignore unexpected fields instead of rejecting them
 * options.partial        fields missing from the input are skipped instead of defaulted
 * options.stripEmoji     remove emoji from text fields (used for the owner's own content)
 */
function body(input, spec, options = {}) {
  if (input == null || typeof input !== 'object' || Array.isArray(input)) {
    throw new ApiError(400, 'The request body must be a JSON object.', 'validation');
  }
  const errors = {};
  const out = {};
  if (!options.allowUnknown) {
    for (const key of Object.keys(input)) {
      if (!Object.prototype.hasOwnProperty.call(spec, key)) errors[key] = 'This field is not accepted.';
    }
  }
  for (const [key, rule] of Object.entries(spec)) {
    const present = Object.prototype.hasOwnProperty.call(input, key) && input[key] !== undefined;
    if (!present) {
      if (rule.required && !options.partial) errors[key] = 'This field is required.';
      else if (!options.partial) out[key] = rule.default !== undefined ? rule.default : (rule.type === 'int' ? 0 : rule.type === 'bool' ? true : rule.type === 'tags' ? '[]' : '');
      continue;
    }
    try {
      out[key] = checkField(input[key], rule);
      if (options.stripEmoji && !rule.keepEmoji && typeof out[key] === 'string' && rule.type === 'string') out[key] = iconVocab.stripEmoji(out[key]);
    }
    catch (e) { errors[key] = e.message; }
  }
  if (Object.keys(errors).length) fail(errors);
  return out;
}

module.exports = { body, int, clean, url, tags, EMAIL_RE };
