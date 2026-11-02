/*
 * AdvaySocialSuite 1.2.0 theme core.
 *
 * One small module with no dependencies. The server loads it with require, the public site and
 * the admin preview load it as a script (global name: AdvayTheme). It holds:
 *   - the six built in themes (same values as theme-preview.html)
 *   - the derivation that turns two colours and a mood into a full, readable theme
 *   - contrast checks and plain language warnings
 *   - the timing rules that decide which theme is showing at a given moment
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AdvayTheme = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var KEYS = ['bg', 's1', 's2', 'text', 'muted', 'accent', 'ink', 'accent2'];
  var MOODS = ['very-dark', 'dark', 'light'];
  var MOOD_LABELS = { 'very-dark': 'Very dark', dark: 'Dark', light: 'Light' };
  var CUSTOM_ID_RE = /^c_[0-9a-f]{8}$/;
  var DEFAULT_ID = 'cobalt';
  var LIMITS = { name: 30, custom: 12, minInterval: 5, maxInterval: 86400 };
  var TRANSITIONS = { instant: 0, smooth: 0.9, slow: 2 };

  var PRESETS = [
    { id: 'cobalt', name: 'Cobalt Hour', bg: '#070a12', s1: '#0f1522', s2: '#172033', text: '#f2f5fb', muted: '#9ba6ba', accent: '#4f8cff', ink: '#06101f', accent2: '#ffc857' },
    { id: 'ember', name: 'Ember Line', bg: '#0b0807', s1: '#161010', s2: '#211817', text: '#f7f1ee', muted: '#a99a94', accent: '#ff7a45', ink: '#1a0a02', accent2: '#ffd36e' },
    { id: 'mint', name: 'Mint Circuit', bg: '#060d0b', s1: '#0d1815', s2: '#14231f', text: '#eef7f4', muted: '#92a8a1', accent: '#34e0a1', ink: '#03160f', accent2: '#d8ff6b' },
    { id: 'violet', name: 'Violet Dusk', bg: '#0a0813', s1: '#130f21', s2: '#1c1630', text: '#f4f1fb', muted: '#a29bb8', accent: '#a58bff', ink: '#12072b', accent2: '#ff86d6' },
    { id: 'rose', name: 'Rose Noir', bg: '#0d0709', s1: '#170e12', s2: '#22151b', text: '#fbf1f4', muted: '#b09aa3', accent: '#ff5c8a', ink: '#260612', accent2: '#ffc2d4' },
    { id: 'glacier', name: 'Glacier Signal', bg: '#050b0f', s1: '#0b161c', s2: '#112430', text: '#eef8fb', muted: '#8fa9b4', accent: '#38d6f2', ink: '#021419', accent2: '#fff176' },
  ];
  var PRESET_IDS = PRESETS.map(function (p) { return p.id; });

  // ─── Colour maths ──────────────────────────────────────────────────────────
  var HEX_RE = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/;

  // Returns a lower case six digit hex string, or null when the value is not a hex colour.
  function normHex(v) {
    if (typeof v !== 'string') return null;
    var s = v.trim();
    if (!HEX_RE.test(s)) return null;
    var h = s.slice(1).toLowerCase();
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    return '#' + h;
  }
  function toRgb(hex) { return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]; }
  function toHex(c) {
    return '#' + c.map(function (v) { return Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'); }).join('');
  }
  function lum(hex) {
    var c = toRgb(hex).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function contrast(a, b) {
    var l1 = lum(a), l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }
  function mix(a, b, t) {
    var x = toRgb(a), y = toRgb(b);
    return toHex(x.map(function (v, i) { return v + (y[i] - v) * t; }));
  }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function hslOf(hex) {
    var c = toRgb(hex), r = c[0] / 255, g = c[1] / 255, b = c[2] / 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
    if (mx === mn) return [0, 0, l];
    var d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    var h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h / 6, s, l];
  }
  function hsl(h, s, l) {
    if (s === 0) return toHex([l * 255, l * 255, l * 255]);
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    function f(t) {
      t = ((t % 1) + 1) % 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    }
    return toHex([f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255]);
  }
  function minContrast(c, bgs) {
    return bgs.reduce(function (m, b) { return Math.min(m, contrast(c, b)); }, 21);
  }

  // Moves a colour's lightness the smallest amount that reaches the target contrast on every background.
  function ensure(fg, bgs, target) {
    if (minContrast(fg, bgs) >= target) return fg;
    var hsv = hslOf(fg), best = null;
    [1, -1].forEach(function (dir) {
      for (var i = 1; i <= 100; i++) {
        var l = clamp(hsv[2] + dir * i * 0.01, 0, 1);
        var c = hsl(hsv[0], hsv[1], l);
        if (minContrast(c, bgs) >= target) {
          if (!best || i < best.steps) best = { c: c, steps: i };
          break;
        }
        if (l === 0 || l === 1) break;
      }
    });
    if (best) return best.c;
    return minContrast('#ffffff', bgs) >= minContrast('#000000', bgs) ? '#ffffff' : '#000000';
  }
  function blackOrWhite(against) { return contrast('#000000', against) >= contrast('#ffffff', against) ? '#000000' : '#ffffff'; }

  // ─── Derivation ────────────────────────────────────────────────────────────
  // Two colours and a mood give the other six. Same input, same output, always.
  function derive(input) {
    input = input || {};
    var a = normHex(input.accent), b = normHex(input.accent2);
    if (!a || !b) return null;
    var mood = MOODS.indexOf(input.mood) >= 0 ? input.mood : 'dark';
    var h = hslOf(a), tint = clamp(h[1] * 0.5, 0.12, 0.42);
    var light = mood === 'light';
    var L = { 'very-dark': [0.05, 0.085, 0.13], dark: [0.11, 0.15, 0.2], light: [0.955, 0.985, 0.9] }[mood];
    var bg = hsl(h[0], tint, L[0]), s1 = hsl(h[0], tint, L[1]), s2 = hsl(h[0], tint, L[2]);
    var surfaces = [bg, s1, s2];
    var text = ensure(light ? hsl(h[0], tint * 0.5, 0.08) : hsl(h[0], Math.min(tint, 0.3) * 0.6, 0.96), surfaces, 7);
    var muted = ensure(mix(text, bg, light ? 0.45 : 0.42), surfaces, 4.5);
    return { bg: bg, s1: s1, s2: s2, text: text, muted: muted, accent: a, ink: blackOrWhite(a), accent2: b };
  }

  // Builds the final eight colours of a theme definition (preset or custom).
  function base(def) {
    if (!def) return null;
    var t = null;
    if (def.bg && !def.mood) {
      t = {};
      for (var i = 0; i < KEYS.length; i++) { var v = normHex(def[KEYS[i]]); if (!v) return null; t[KEYS[i]] = v; }
      return t;
    }
    t = derive(def);
    if (!t) return null;
    var o = def.overrides || {};
    KEYS.forEach(function (k) { var v = normHex(o[k]); if (v) t[k] = v; });
    return t;
  }

  // Values the site needs beyond the eight stored colours. They are always calculated.
  function extras(t) {
    var surfaces = [t.bg, t.s1, t.s2];
    return {
      accentT: ensure(t.accent, surfaces, 4.5),     // accent when it is used as small text
      accent2T: ensure(t.accent2, surfaces, 4.5),
      onInk: contrast(t.text, t.ink) >= 4.5 ? t.text : blackOrWhite(t.ink),   // text on an ink coloured button
      ink2: contrast(t.ink, t.accent2) >= 4.5 ? t.ink : blackOrWhite(t.accent2), // text on an accent2 fill
      scheme: lum(t.bg) < 0.4 ? 'dark' : 'light',
    };
  }

  // Full resolved theme: id, name, the eight colours and the calculated extras.
  function resolve(def) {
    var t = base(def);
    if (!t) return null;
    var x = extras(t), out = { id: def.id, name: def.name, custom: !!def.mood };
    KEYS.forEach(function (k) { out[k] = t[k]; });
    out.accentT = x.accentT; out.accent2T = x.accent2T; out.onInk = x.onInk; out.ink2 = x.ink2; out.scheme = x.scheme;
    return out;
  }

  // CSS custom properties for a resolved theme.
  function cssVars(t) {
    return {
      '--bg': t.bg, '--s1': t.s1, '--s2': t.s2, '--text': t.text, '--muted': t.muted, '--accent': t.accent,
      '--ink': t.ink, '--accent2': t.accent2, '--accent-t': t.accentT, '--accent2-t': t.accent2T,
      '--on-ink': t.onInk, '--ink2': t.ink2,
    };
  }
  // The same properties as a string for a style attribute. Only validated hex values can reach it.
  function styleText(t, transition) {
    var v = cssVars(t), parts = [];
    Object.keys(v).forEach(function (k) { parts.push(k + ':' + v[k]); });
    parts.push('color-scheme:' + t.scheme);
    var d = TRANSITIONS[transition];
    parts.push('--theme-dur:' + (d === undefined ? TRANSITIONS.smooth : d) + 's');
    return parts.join(';');
  }

  // A readable second colour for a single accent: lighter, from further round the colour wheel.
  function companion(accent) {
    var a = normHex(accent);
    if (!a) return null;
    var h = hslOf(a);
    return hsl((h[0] + 0.42) % 1, clamp(h[1], 0.55, 0.9), 0.7);
  }

  // ─── Plain language checks ─────────────────────────────────────────────────
  function ratio(a, b) { return Math.round(contrast(a, b) * 10) / 10; }
  function check(def) {
    var t = base(def);
    if (!t) return { warnings: ['One of the colours is not a valid hex value.'], notes: [] };
    var x = extras(t), w = [], n = [];
    if (contrast(t.text, t.bg) < 4.5) w.push('Body text is hard to read on the page background (' + ratio(t.text, t.bg) + ' to 1, needs 4.5 to 1).');
    if (contrast(t.text, t.s1) < 4.5) w.push('Body text is hard to read on cards (' + ratio(t.text, t.s1) + ' to 1, needs 4.5 to 1).');
    if (contrast(t.muted, t.bg) < 4.5) w.push('Softer text is hard to read on the page background (' + ratio(t.muted, t.bg) + ' to 1, needs 4.5 to 1).');
    if (contrast(t.muted, t.s1) < 4.5) w.push('Softer text is hard to read on cards (' + ratio(t.muted, t.s1) + ' to 1, needs 4.5 to 1).');
    if (contrast(t.ink, t.accent) < 4.5) w.push('Text on accent buttons is hard to read (' + ratio(t.ink, t.accent) + ' to 1, needs 4.5 to 1).');
    if (contrast(t.accent, t.bg) < 3) w.push('The accent colour almost disappears into the background (' + ratio(t.accent, t.bg) + ' to 1). Buttons and chips may be hard to see.');
    if (t.accent !== x.accentT) n.push('The accent colour is adjusted automatically when it is used as small text, so it stays readable.');
    if (t.accent2 !== x.accent2T) n.push('The second accent colour is adjusted automatically when it is used as small text.');
    if (x.ink2 !== t.ink) n.push('Text on second accent fills uses ' + (x.ink2 === '#000000' ? 'black' : x.ink2 === '#ffffff' ? 'white' : 'the ink colour') + ' for readability.');
    return { warnings: w, notes: n };
  }

  // ─── Timing: which theme is showing right now ──────────────────────────────
  function rotationIndex(nowMs, intervalSec, len, startMs) {
    if (!(len > 1)) return 0;
    var step = Math.floor((nowMs - (startMs || 0)) / (intervalSec * 1000));
    return ((step % len) + len) % len;
  }
  function nextShiftAt(nowMs, intervalSec, startMs) {
    var iv = intervalSec * 1000, s = startMs || 0;
    return s + (Math.floor((nowMs - s) / iv) + 1) * iv;
  }
  // A random choice that is never the one before it, unless there is only one theme.
  function randomPick(ids, lastId, rnd) {
    var pool = ids.filter(function (i) { return i !== lastId; });
    if (!pool.length) pool = ids.slice();
    if (!pool.length) return null;
    var r = typeof rnd === 'number' ? rnd : Math.random();
    return pool[Math.min(pool.length - 1, Math.floor(r * pool.length))];
  }
  // cfg: { mode, active, rotation, interval }   opts: { reduced, sync, start, randomId }
  // nowMs must already be server corrected when opts.sync is true.
  function pickId(cfg, nowMs, opts) {
    opts = opts || {};
    var rot = (cfg.rotation && cfg.rotation.length ? cfg.rotation : [cfg.active || DEFAULT_ID]);
    if (cfg.mode === 'fixed') return cfg.active || rot[0];
    if (opts.reduced) return rot[0];
    if (cfg.mode === 'random') return opts.randomId && rot.indexOf(opts.randomId) >= 0 ? opts.randomId : rot[0];
    var start = opts.sync === false ? (opts.start || nowMs) : 0;
    return rot[rotationIndex(nowMs, cfg.interval, rot.length, start)];
  }

  return {
    KEYS: KEYS, MOODS: MOODS, MOOD_LABELS: MOOD_LABELS, PRESETS: PRESETS, PRESET_IDS: PRESET_IDS, DEFAULT_ID: DEFAULT_ID,
    CUSTOM_ID_RE: CUSTOM_ID_RE, LIMITS: LIMITS, TRANSITIONS: TRANSITIONS,
    normHex: normHex, contrast: contrast, derive: derive, resolve: resolve, extras: extras, cssVars: cssVars, styleText: styleText,
    check: check, ensure: ensure, companion: companion, rotationIndex: rotationIndex, nextShiftAt: nextShiftAt, randomPick: randomPick, pickId: pickId,
  };
});
