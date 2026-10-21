/*
 * The one icon vocabulary. Every stored icon value is one of these semantic names
 * (or custom:ID). Bundles map each name to their own drawing, see scripts/build-icons.js.
 * No dependencies, used by the server, the build script and tests.
 */

const GROUPS = [
  ['Development and automation', ['code', 'terminal', 'bot', 'workflow', 'webhook', 'api', 'database', 'server', 'cloud', 'git-branch', 'package', 'cpu', 'plug', 'zap', 'wrench', 'settings', 'bug', 'shield', 'lock', 'key', 'layers', 'puzzle', 'sliders', 'braces', 'command', 'hammer', 'network', 'hard-drive']],
  ['Media and files', ['film', 'music', 'image', 'video', 'camera', 'mic', 'play', 'pause', 'download', 'upload', 'link', 'qr-code', 'file', 'folder', 'pin', 'bookmark', 'rss', 'headphones', 'book', 'newspaper', 'pen', 'palette']],
  ['Web and communication', ['globe', 'browser', 'layout', 'smartphone', 'monitor', 'search', 'mail', 'message', 'phone', 'send', 'share', 'external-link', 'at-sign', 'hash', 'wifi', 'megaphone', 'bell', 'inbox']],
  ['People and status', ['user', 'users', 'heart', 'star', 'check', 'alert', 'info', 'clock', 'calendar', 'map-pin', 'trophy', 'rocket', 'lightbulb', 'target', 'chart', 'trending-up', 'coffee', 'gift', 'shopping-bag', 'wallet', 'shopping-cart', 'credit-card', 'tag', 'flag', 'sparkles', 'thumbs-up', 'smile', 'help', 'home', 'briefcase', 'award', 'graduation-cap', 'sun', 'moon', 'flame', 'leaf']],
  ['Interface', ['arrow-right', 'arrow-left', 'arrow-up', 'arrow-down', 'arrow-up-right', 'chevron-down', 'chevron-up', 'chevron-left', 'chevron-right', 'menu', 'close', 'plus', 'minus', 'edit', 'trash', 'copy', 'eye', 'eye-off', 'filter', 'grid', 'list', 'refresh', 'more-horizontal', 'check-circle', 'x-circle', 'save', 'log-out', 'log-in', 'maximize']],
];

const NAMES = GROUPS.reduce((all, g) => all.concat(g[1]), []);
const NAME_SET = new Set(NAMES);

// Default icon for items that have none, by tool category.
const CATEGORY_DEFAULTS = {
  tool: 'wrench', downloader: 'download', entertainment: 'play', utility: 'link', blog: 'pen',
  bot: 'bot', automation: 'workflow', api: 'api', template: 'workflow', repo: 'git-branch',
};
const FALLBACK = 'grid';
// Services and specializations without an icon rotate through these.
const SERVICE_DEFAULTS = ['workflow', 'code', 'globe', 'plug', 'layers', 'zap'];

function categoryDefault(category) {
  return CATEGORY_DEFAULTS[String(category || '').toLowerCase()] || CATEGORY_DEFAULTS.tool;
}
function serviceDefault(index) { return SERVICE_DEFAULTS[Math.abs(Number(index) || 0) % SERVICE_DEFAULTS.length]; }

const CUSTOM_RE = /^custom:([1-9][0-9]{0,8})$/;
function isValidIcon(value) {
  return typeof value === 'string' && (NAME_SET.has(value) || CUSTOM_RE.test(value));
}
// Returns the value when valid, otherwise the fallback.
function cleanIcon(value, fallback) { return isValidIcon(value) ? value : fallback; }

// Emoji written as escapes so this file stays free of emoji characters.
// Each entry: [list of code points as hex strings, semantic name].
const E = (cps, name) => [cps, name];
const EMOJI_MAP = [
  E(['1F3AC'], 'film'), E(['1F4FD'], 'film'), E(['1F3A5'], 'video'), E(['1F4F9'], 'video'), E(['1F4F7', '1F4F8'], 'camera'),
  E(['1F3B5', '1F3B6', '1F3BC', '1F3A7'], 'music'), E(['1F3A4'], 'mic'), E(['1F4CD', '1F4CC'], 'pin'), E(['1F4CE'], 'file'),
  E(['1F517'], 'link'), E(['2699'], 'settings'), E(['1F6E0'], 'wrench'), E(['1F527', '1F528'], 'wrench'),
  E(['1F916'], 'bot'), E(['1F310', '1F30D', '1F30E', '1F30F'], 'globe'), E(['1F4CA', '1F4C8', '1F4C9'], 'chart'),
  E(['1F4A1'], 'lightbulb'), E(['1F680'], 'rocket'), E(['26A1'], 'zap'), E(['1F525'], 'flame'), E(['2728', '1F31F', '2B50'], 'sparkles'),
  E(['1F4BB', '1F5A5'], 'monitor'), E(['1F4F1'], 'smartphone'), E(['1F4E7', '2709', '1F4E8', '1F4E9'], 'mail'),
  E(['1F4AC', '1F5E8'], 'message'), E(['1F4DE', '260E'], 'phone'), E(['1F4E4'], 'send'), E(['1F4E5'], 'download'),
  E(['1F512', '1F510'], 'lock'), E(['1F511'], 'key'), E(['1F6E1'], 'shield'), E(['1F41B', '1F41E'], 'bug'),
  E(['1F4E6'], 'package'), E(['1F5C4', '1F5C3', '1F4BE'], 'database'), E(['2601'], 'cloud'), E(['1F50C'], 'plug'),
  E(['1F9E9'], 'puzzle'), E(['1F3AF'], 'target'), E(['1F3C6', '1F947'], 'trophy'), E(['2764', '1F499', '1F49A', '1F49B'], 'heart'),
  E(['1F465', '1F46A'], 'users'), E(['1F464'], 'user'), E(['1F4C5', '1F4C6'], 'calendar'), E(['23F0', '23F1', '1F552'], 'clock'),
  E(['2615'], 'coffee'), E(['1F381'], 'gift'), E(['1F6CD', '1F45C'], 'shopping-bag'), E(['1F6D2'], 'shopping-cart'),
  E(['1F4B3'], 'credit-card'), E(['1F4B0', '1F4B5', '1F4B8'], 'wallet'), E(['1F3A8'], 'palette'), E(['1F4DD', '270F', '1F58A', '270D'], 'pen'),
  E(['1F4DA', '1F4D6'], 'book'), E(['1F4F0'], 'newspaper'), E(['1F4C1', '1F4C2'], 'folder'), E(['1F4C4', '1F4C3'], 'file'),
  E(['1F50D', '1F50E'], 'search'), E(['1F3E0'], 'home'), E(['1F4BC'], 'briefcase'), E(['1F3C5'], 'award'), E(['1F393'], 'graduation-cap'),
  E(['2600', '1F31E'], 'sun'), E(['1F319', '1F31B'], 'moon'), E(['1F343', '1F33F', '1F331'], 'leaf'), E(['1F4E1'], 'rss'),
  E(['1F3AE', '1F579', '25B6'], 'play'), E(['1F4F2'], 'smartphone'), E(['1F44D'], 'thumbs-up'), E(['1F60A', '1F642', '1F600'], 'smile'),
  E(['2753', '2754'], 'help'), E(['2705', '2714', '2611'], 'check'), E(['26A0'], 'alert'), E(['2139'], 'info'), E(['1F514'], 'bell'),
  E(['1F4E2', '1F4E3'], 'megaphone'), E(['1F3F7'], 'tag'), E(['1F6A9', '1F3C1'], 'flag'), E(['1F9F0'], 'wrench'), E(['2699'], 'settings'),
  E(['1F4DC'], 'file'), E(['1F9E0'], 'cpu'), E(['1F5A8'], 'monitor'), E(['1F4D1'], 'file'),
];

const EMOJI_LOOKUP = (() => {
  const m = new Map();
  for (const [cps, name] of EMOJI_MAP) for (const cp of cps) m.set(parseInt(cp, 16), name);
  return m;
})();

// Matches one emoji sequence (base, optional variation selector, keycap, ZWJ parts).
const EMOJI_RE = /(?:\p{Extended_Pictographic}|\p{Emoji_Presentation})[\uFE0F\u20E3]*(?:[\u{1F3FB}-\u{1F3FF}])?(?:\u200D(?:\p{Extended_Pictographic}|\p{Emoji_Presentation})[\uFE0F]*)*|[\uFE0F\u200D\u20E3]/gu;
const COPYRIGHT_SAFE = new Set([0xA9, 0xAE, 0x2122]);

function hasEmoji(s) {
  if (typeof s !== 'string') return false;
  EMOJI_RE.lastIndex = 0;
  let m;
  while ((m = EMOJI_RE.exec(s)) !== null) { if (!(m[0].length <= 2 && COPYRIGHT_SAFE.has(m[0].codePointAt(0)))) return true; }
  return false;
}

// Replaces any emoji with nothing, keeps the copyright and trade mark signs.
function stripEmoji(s) {
  if (typeof s !== 'string') return s;
  return s.replace(EMOJI_RE, m => (COPYRIGHT_SAFE.has(m.codePointAt(0)) && m.length <= 2 ? m : '')).replace(/[ \t]{2,}/g, ' ').trim();
}

// Converts a stored icon value (emoji or name) to a semantic name or custom:ID.
// Unknown emoji and anything else fall back to the category default.
function iconFromStored(value, category) { return convertIcon(value, categoryDefault(category)); }

// Same, with the fallback name given directly.
function convertIcon(value, fallback) {
  if (isValidIcon(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return fallback;
  for (const ch of value) {
    const name = EMOJI_LOOKUP.get(ch.codePointAt(0));
    if (name) return name;
  }
  return fallback;
}

module.exports = {
  GROUPS, NAMES, NAME_SET, CATEGORY_DEFAULTS, FALLBACK, SERVICE_DEFAULTS,
  categoryDefault, serviceDefault, isValidIcon, cleanIcon, hasEmoji, stripEmoji, iconFromStored, convertIcon,
};
