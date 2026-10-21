#!/usr/bin/env node
/*
 * Builds the icon bundles used by the site. Development only: the running app never
 * needs the icon packages, it reads the JSON files this script writes to public/icons.
 *
 *   npm install            (installs the pinned dev dependency react-icons)
 *   npm run build:icons
 *
 * react-icons packages Lucide (lu), Tabler (tb), Phosphor (pi), Heroicons v2 (hi2) and
 * Feather (fi) with their drawings unchanged. Optional argument: path to the react-icons folder.
 */
const fs = require('fs');
const path = require('path');
const vocab = require('../lib/iconVocab');
const { MAP, OVERRIDES } = require('./icon-map');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'public', 'icons');
const SRC = process.argv[2] || path.join(ROOT, 'node_modules', 'react-icons');
const SRC_VERSION = JSON.parse(fs.readFileSync(path.join(SRC, 'package.json'), 'utf8')).version;

const PACKS = [
  { id: 'lucide', label: 'Lucide', dir: 'lu', prefix: 'Lu', licence: 'ISC', kind: 's', strokeWidth: 1.75 },
  { id: 'tabler', label: 'Tabler', dir: 'tb', prefix: 'Tb', licence: 'MIT', kind: 's', strokeWidth: 1.75 },
  { id: 'phosphor', label: 'Phosphor', dir: 'pi', prefix: 'Pi', licence: 'MIT', kind: 'f', strokeWidth: 0 },
  { id: 'heroicons', label: 'Heroicons', dir: 'hi2', prefix: 'HiOutline', licence: 'MIT', kind: 's', strokeWidth: 1.5, key: 'hi' },
  { id: 'feather', label: 'Feather', dir: 'fi', prefix: 'Fi', licence: 'MIT', kind: 's', strokeWidth: 1.75 },
];

// react style attribute names to SVG attribute names
const ATTR = { strokeWidth: 'stroke-width', strokeLinecap: 'stroke-linecap', strokeLinejoin: 'stroke-linejoin', fillRule: 'fill-rule', clipRule: 'clip-rule', strokeMiterlimit: 'stroke-miterlimit', strokeOpacity: 'stroke-opacity', fillOpacity: 'fill-opacity' };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function nodeToMarkup(n) {
  if (!n || n.tag === 'title') return '';
  const attrs = n.attr || {};
  // Tabler draws an invisible bounding box first, it has no stroke and no fill, drop it.
  if (n.tag === 'path' && attrs.stroke === 'none' && attrs.fill === 'none') return '';
  const a = Object.keys(attrs).filter(k => k !== 'key').map(k => ` ${ATTR[k] || k}="${esc(attrs[k])}"`).join('');
  const kids = (n.child || []).map(nodeToMarkup).join('');
  return kids ? `<${n.tag}${a}>${kids}</${n.tag}>` : `<${n.tag}${a}/>`;
}

function readIcons(dir, wanted) {
  const text = fs.readFileSync(path.join(SRC, dir, 'index.js'), 'utf8');
  const out = {};
  for (const name of wanted) {
    const m = text.match(new RegExp(`module\\.exports\\.${name} = function ${name} \\(props\\) \\{\\s*return GenIcon\\((\\{.*?\\})\\)\\(props\\);`));
    if (m) out[name] = JSON.parse(m[1]);
  }
  return out;
}

function resolve(pack, semantic) {
  const o = OVERRIDES[semantic] && OVERRIDES[semantic][pack.key || pack.dir];
  return (o || []).concat(MAP[semantic] || []).map(c => pack.prefix + c);
}

fs.mkdirSync(OUT, { recursive: true });
let problems = 0;
const report = [];

for (const pack of PACKS) {
  const wantedNames = new Set();
  for (const sem of vocab.NAMES) resolve(pack, sem).forEach(n => wantedNames.add(n));
  const found = readIcons(pack.dir, wantedNames);
  const icons = {};
  const missing = [];
  for (const sem of vocab.NAMES) {
    const hit = resolve(pack, sem).find(n => found[n]);
    if (!hit) { missing.push(sem); continue; }
    const root = found[hit];
    const viewBox = (root.attr && root.attr.viewBox) || '0 0 24 24';
    const inner = (root.child || []).map(nodeToMarkup).join('');
    icons[sem] = [viewBox, inner, hit.slice(pack.prefix.length)];
  }
  if (missing.length) { problems += missing.length; console.error(`MISSING in ${pack.label}: ${missing.join(', ')}`); }
  const file = { pack: pack.id, label: pack.label, licence: pack.licence, kind: pack.kind, strokeWidth: pack.strokeWidth, source: `react-icons ${SRC_VERSION}`, icons };
  fs.writeFileSync(path.join(OUT, `${pack.id}.json`), JSON.stringify(file));
  report.push(`${pack.label}: ${Object.keys(icons).length}/${vocab.NAMES.length} icons`);
}

// Brand glyphs: Simple Icons (CC0 1.0), shown with currentColor. LinkedIn was removed from
// the current Simple Icons release, its glyph is kept from an earlier release of the same set.
const BRANDS = { github: 'SiGithub', youtube: 'SiYoutube', tiktok: 'SiTiktok', x: 'SiX', discord: 'SiDiscord', instagram: 'SiInstagram', facebook: 'SiFacebook', whatsapp: 'SiWhatsapp', telegram: 'SiTelegram', bluesky: 'SiBluesky', mastodon: 'SiMastodon', threads: 'SiThreads', buymeacoffee: 'SiBuymeacoffee' };
const LINKEDIN = 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z';
const si = readIcons('si', Object.values(BRANDS));
const brands = { linkedin: LINKEDIN };
for (const [key, comp] of Object.entries(BRANDS)) {
  const d = si[comp] && si[comp].child && si[comp].child[0] && si[comp].child[0].attr && si[comp].child[0].attr.d;
  if (!d) { problems++; console.error(`MISSING brand glyph: ${key}`); continue; }
  brands[key] = d;
}
fs.writeFileSync(path.join(OUT, 'brands.json'), JSON.stringify({ licence: 'CC0 1.0 (Simple Icons)', viewBox: '0 0 24 24', brands }));
report.push(`Brands: ${Object.keys(brands).length} glyphs`);

fs.writeFileSync(path.join(OUT, 'vocab.json'), JSON.stringify({ groups: vocab.GROUPS, categoryDefaults: vocab.CATEGORY_DEFAULTS, serviceDefaults: vocab.SERVICE_DEFAULTS, fallback: vocab.FALLBACK }));

console.log(report.join('\n'));
if (problems) { console.error(`\n${problems} problem(s). Fix scripts/icon-map.js and run again.`); process.exit(1); }
console.log(`\nAll ${vocab.NAMES.length} semantic names are present in all ${PACKS.length} bundles.`);
