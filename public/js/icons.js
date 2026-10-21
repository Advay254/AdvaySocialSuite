/* AdvaySocialSuite 1.1.0 icon module. Inline SVG from the chosen bundle, always currentColor. */
const Icons = (() => {
  const ASSET_V = '1.1.0'; // changes the icon file addresses when a release updates them
  const PACKS = ['lucide', 'tabler', 'phosphor', 'heroicons', 'feather'];
  const DEFAULT_PACK = 'lucide';
  const FALLBACK = 'grid';
  // Older call sites use short names. They are translated to the vocabulary here.
  const ALIAS = { chat: 'message', x: 'close', pin: 'map-pin', compose: 'edit', pen: 'pen', refresh: 'refresh', layers: 'layers' };

  let pack = DEFAULT_PACK;
  let bundle = null;           // { kind, strokeWidth, icons: { name: [viewBox, inner] } }
  let brands = null;           // { viewBox, brands: { key: pathData } }
  let vocab = null;            // { groups, categoryDefaults, serviceDefaults }
  let custom = {};             // id -> { viewBox, body }
  const bundleCache = {};

  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  async function getJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('icon file');
    return res.json();
  }

  // Loads the active bundle, the brand glyphs and the vocabulary. Never throws.
  async function load(packId, opts = {}) {
    pack = PACKS.includes(packId) ? packId : DEFAULT_PACK;
    try {
      const tasks = [
        bundleCache[pack] ? Promise.resolve(bundleCache[pack]) : getJson(`/icons/${pack}.json?v=${ASSET_V}`),
        brands ? Promise.resolve(brands) : getJson(`/icons/brands.json?v=${ASSET_V}`).catch(() => null),
        vocab ? Promise.resolve(vocab) : getJson(`/icons/vocab.json?v=${ASSET_V}`).catch(() => null),
        opts.skipCustom ? Promise.resolve(null) : getJson('/api/icons/custom').catch(() => null),
      ];
      const [b, br, vo, cu] = await Promise.all(tasks);
      bundle = bundleCache[pack] = b; brands = br; vocab = vo;
      if (cu && Array.isArray(cu.icons)) { custom = {}; cu.icons.forEach(i => { custom[i.id] = i; }); }
    } catch { /* icons fall back to blanks, the page still works */ }
    return pack;
  }

  function sizeAttr(size) { return size ? ` width="${esc(size)}" height="${esc(size)}"` : ''; }

  function wrap(viewBox, inner, kind, opts) {
    const label = opts.label ? ` role="img" aria-label="${esc(opts.label)}"` : ' aria-hidden="true" focusable="false"';
    const stroke = kind === 's';
    const sw = opts.stroke != null ? opts.stroke : (bundle && bundle.strokeWidth) || 1.75;
    const paint = stroke
      ? ` fill="none" stroke="currentColor" stroke-width="${esc(sw)}" stroke-linecap="round" stroke-linejoin="round"`
      : ' fill="currentColor"';
    return `<svg class="icon${opts.cls ? ' ' + esc(opts.cls) : ''}"${sizeAttr(opts.size)} viewBox="${esc(viewBox)}"${paint}${label}>${inner}</svg>`;
  }

  // svg('rocket'), svg('rocket', { size: 20, stroke: 1.5, label: 'Launch', cls: 'x' })
  function svg(name, opts) {
    opts = opts || {};
    if (typeof opts === 'number') opts = { size: opts };
    if (name && name.indexOf('brand:') === 0) return brand(name.slice(6), opts);
    const key = ALIAS[name] || name;
    if (/^custom:\d+$/.test(key || '')) {
      const c = custom[key.slice(7)];
      if (c) return wrap(c.viewBox, c.body, 'f', opts);   // custom icons carry their own stroke or fill attributes
      return fallbackSvg(opts);
    }
    if (!bundle) return `<svg class="icon"${sizeAttr(opts.size)} viewBox="0 0 24 24" aria-hidden="true" focusable="false"></svg>`;
    const entry = bundle.icons[key];
    if (!entry) return fallbackSvg(opts);
    return wrap(entry[0], entry[1], bundle.kind, opts);
  }
  function fallbackSvg(opts) {
    const e = bundle && bundle.icons[FALLBACK];
    return e ? wrap(e[0], e[1], bundle.kind, opts) : `<svg class="icon"${sizeAttr(opts.size)} viewBox="0 0 24 24" aria-hidden="true" focusable="false"></svg>`;
  }

  // Single colour brand glyph (Simple Icons, CC0). Returns '' when the key is unknown.
  function brand(key, opts) {
    opts = opts || {};
    const d = brands && brands.brands && brands.brands[String(key || '').toLowerCase()];
    if (!d) return '';
    const label = opts.label ? ` role="img" aria-label="${esc(opts.label)}"` : ' aria-hidden="true" focusable="false"';
    return `<svg class="icon icon--brand"${sizeAttr(opts.size || 18)} viewBox="0 0 24 24" fill="currentColor"${label}><path d="${esc(d)}"/></svg>`;
  }

  // Fills every element that carries data-ico="name" (used by static admin markup).
  function hydrate(root) {
    (root || document).querySelectorAll('[data-ico]').forEach(el => {
      el.innerHTML = svg(el.getAttribute('data-ico'), { size: el.getAttribute('data-ico-size') || undefined });
    });
  }

  // Redraws everything after the owner changes the bundle (admin) without a reload.
  async function switchPack(packId) { await load(packId, { skipCustom: true }); hydrate(document); document.dispatchEvent(new CustomEvent('icons:changed')); }

  return {
    load, svg, brand, hydrate, switchPack,
    get pack() { return pack; },
    packs: PACKS,
    groups: () => (vocab && vocab.groups) || [],
    names: () => ((vocab && vocab.groups) || []).reduce((a, g) => a.concat(g[1]), []),
    categoryDefault: c => ((vocab && vocab.categoryDefaults) || {})[String(c || '').toLowerCase()] || 'wrench',
    serviceDefault: i => { const d = (vocab && vocab.serviceDefaults) || ['workflow']; return d[Math.abs(Number(i) || 0) % d.length]; },
    custom: () => custom,
    setCustom: list => { custom = {}; (list || []).forEach(i => { custom[i.id] = i; }); },
    has: name => !!(bundle && bundle.icons[ALIAS[name] || name]) || (/^custom:\d+$/.test(name || '') && !!custom[String(name).slice(7)]),
  };
})();
