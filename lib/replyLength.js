/*
 * Keeps AI replies inside the owner's length limit and always ending on a
 * complete sentence. A token cap alone can never do this, so the model is told
 * the limit in plain words and the result is checked here afterwards.
 */

const MIN_CHARS = 200;
const MAX_CHARS = 3000;

function clampChars(n) {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return 700;
  return Math.min(MAX_CHARS, Math.max(MIN_CHARS, v));
}

// Rule appended to the very end of the system message. The owner cannot edit it away.
function lengthRule(maxChars) {
  const n = clampChars(maxChars);
  const words = Math.max(20, Math.round(n / 6));
  return `Reply length rule, always applies: write a complete reply of at most ${n} characters, which is about ${words} words. ` +
    'Plan the answer so it fits before you start. Keep paragraphs short. ' +
    'Never start a list or an example that you cannot finish. Always end on a complete sentence.';
}

// Token cap sent to the provider. A safety net only, clearly above the target length.
function tokenCap(maxChars) {
  const n = clampChars(maxChars);
  return Math.min(4000, Math.max(100, Math.ceil(n / 2) + 50));
}

// ---- trimming ----------------------------------------------------------------

const ABBREVIATIONS = new Set(['e.g', 'i.e', 'etc', 'vs', 'mr', 'mrs', 'ms', 'dr', 'prof', 'no', 'approx', 'inc', 'ltd', 'st']);

// Finds the index just after the last place where a sentence or a short line ends.
function lastBoundary(text, maxEnd) {
  let best = -1;
  const re = /([.!?\u2026])(["')\]*_`]*)(?=\s|$)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const end = m.index + m[0].length;
    if (maxEnd != null && end > maxEnd) continue;
    const before = text.slice(0, m.index);
    const word = (before.match(/([A-Za-z.]+|\d+)$/) || [''])[0].toLowerCase();
    if (m[1] === '.' && ABBREVIATIONS.has(word.replace(/\.$/, ''))) continue;
    if (m[1] === '.' && /^\d+$/.test(word)) {
      const lineStart = before.lastIndexOf('\n') + 1;
      if (/^\s*$/.test(before.slice(lineStart, m.index - word.length))) continue; // "1." list number
    }
    best = end;
  }
  // A blank line is also a safe place to stop.
  const para = text.lastIndexOf('\n\n', maxEnd == null ? undefined : maxEnd);
  if (para > best && para > 0) best = para;
  return best;
}

// Removes anything half finished at the end: list markers, intro lines ending in a colon,
// open links, bold or italic markers and code fences.
function stripDangling(text) {
  let t = text.replace(/\s+$/, '');
  for (let i = 0; i < 6; i++) {
    const before = t;
    // unclosed code fence
    const fences = (t.match(/```/g) || []).length;
    if (fences % 2 === 1) t = t.slice(0, t.lastIndexOf('```'));
    // open markdown link or image: "[text" or "[text](http..."
    t = t.replace(/!?\[[^\]\n]*$/, '').replace(/!?\[[^\]\n]*\]\([^)\n]*$/, '');
    // open inline code
    if (((t.match(/`/g) || []).length) % 2 === 1) t = t.slice(0, t.lastIndexOf('`'));
    // unbalanced bold or italic markers: drop from the last unmatched marker
    if (((t.match(/\*\*/g) || []).length) % 2 === 1) t = t.slice(0, t.lastIndexOf('**'));
    const singles = t.replace(/\*\*/g, '').match(/\*/g) || [];
    if (singles.length % 2 === 1 && !/^\s*\*\s/m.test(t.slice(t.lastIndexOf('\n') + 1))) t = t.slice(0, t.lastIndexOf('*'));
    // trailing lines that are only a list marker, a heading marker or an intro ending with a colon
    t = t.replace(/(^|\n)[ \t]*(?:[-*\u2022]|\d+[.)]|#{1,6})[ \t]*$/, '');
    t = t.replace(/(^|\n)[^\n]*:[ \t]*$/, '');
    t = t.replace(/\s+$/, '');
    if (t === before) break;
  }
  return t;
}

// Cut at a code point boundary so a surrogate pair is never split.
function safeSlice(text, n) {
  if (text.length <= n) return text;
  let cut = n;
  const code = text.charCodeAt(cut - 1);
  if (code >= 0xD800 && code <= 0xDBFF) cut -= 1;
  return text.slice(0, cut);
}

/**
 * fitReply(text, maxChars, { truncated })
 * Returns { text, trimmed }. `truncated` is true when the provider said it stopped
 * because of length. Never adds dots or notes.
 */
function fitReply(raw, maxChars, opts = {}) {
  const limit = clampChars(maxChars);
  let text = String(raw == null ? '' : raw).replace(/\r\n/g, '\n').trim();
  const tooLong = text.length > limit;
  if (!tooLong && !opts.truncated) return { text, trimmed: false };

  const window = tooLong ? safeSlice(text, limit) : text;
  // Look one character past the window so "3.5" or a link that continues is not mistaken for a sentence end.
  const probe = tooLong ? text.slice(0, window.length + 1) : text;

  let candidate = '';
  const cutAt = lastBoundary(probe, window.length);
  if (cutAt > 0) candidate = stripDangling(window.slice(0, cutAt));

  if (!candidate) {
    // No sentence boundary: cut at the last whole word.
    const lastSpace = window.search(/\s\S*$/);
    const wordCut = lastSpace > 0 ? window.slice(0, lastSpace) : window;
    candidate = stripDangling(wordCut);
  }
  if (!candidate) candidate = stripDangling(window);
  return { text: candidate.slice(0, limit).trim(), trimmed: true };
}

module.exports = { MIN_CHARS, MAX_CHARS, clampChars, lengthRule, tokenCap, fitReply };
