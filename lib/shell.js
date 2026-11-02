/*
 * The public page shell. Every page of the site is the same HTML file (views/app.html) with a few
 * values filled in per request: the theme that is active at that moment (so the first paint is
 * already in the right colours), the page title and description, and the preload for the font.
 *
 * The Content Security Policy of the public site allows no inline scripts, so nothing here is a
 * script. The theme travels as CSS custom properties in the style attribute of the html element,
 * which the policy allows, and as a data attribute that the site script reads.
 */
const fs = require('fs');
const path = require('path');
const themes = require('./themes');
const T = require('../public/js/theme-core');

// The pages of the site. `label` is the settings key that holds the menu text for the page.
const PAGES = [
  { id: 'home', path: '/', label: 'nav_home' },
  { id: 'about', path: '/about', label: 'nav_about' },
  { id: 'repos', path: '/repos', label: 'nav_repos' },
  { id: 'tools', path: '/tools', label: 'nav_tools' },
  { id: 'templates', path: '/templates', label: 'templates_label' },
  { id: 'collab', path: '/collab', label: 'nav_collab' },
  { id: 'faq', path: '/faq', label: 'nav_faq' },
];
const BY_PATH = new Map(PAGES.map(p => [p.path, p]));

// Paths that belong to files or the API and must never return the page shell.
const NOT_APP = /^\/(api|health|vendor|css|js|fonts|icons)(\/|$)/;

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const oneLine = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();

function parseList(v) { try { const x = JSON.parse(v); return Array.isArray(x) ? x : []; } catch { return []; } }
function faqItems(map) {
  return parseList(map.faq_items).filter(i => i && typeof i === 'object' && i.on !== false && String(i.q || '').trim() && String(i.a || '').trim());
}

function normalisePath(p) {
  let s = String(p || '/');
  s = s.replace(/\/{2,}/g, '/');
  if (s.length > 1) s = s.replace(/\/+$/, '');
  return s || '/';
}

function pageVisible(page, map) {
  if (page.id === 'templates') return map.templates_visible !== '0';
  if (page.id === 'faq') return faqItems(map).length > 0;
  return true;
}

// Title and description for a page, from the settings the owner edits.
function pageMeta(page, map, profile) {
  const site = oneLine(map.site_name);
  const label = page ? oneLine(map[page.label]) : '';
  const desc = {
    home: map.meta_description,
    about: (profile && profile.bio) || map.meta_description,
    repos: map.repos_subtitle || map.meta_description,
    tools: map.tools_subtitle || map.meta_description,
    templates: map.templates_subtitle || map.meta_description,
    collab: map.collab_subtitle || map.collab_intro || map.meta_description,
    faq: map.faq_subtitle || map.meta_description,
  };
  let title = site || 'Home';
  if (!page) title = site ? `Page not found | ${site}` : 'Page not found';
  else if (page.id !== 'home' && label) title = site ? `${label} | ${site}` : label;
  let d = oneLine(page ? desc[page.id] : map.meta_description);
  if (d.length > 160) d = d.slice(0, 157).replace(/\s+\S*$/, '') + '...';
  return { title, description: d };
}

function origin(req) {
  const proto = (req.secure || String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https') ? 'https' : 'http';
  const host = String(req.headers.host || '').replace(/[^A-Za-z0-9.:\-\[\]]/g, '');
  return host ? `${proto}://${host}` : '';
}

function createShell({ templateFile, publicDir, getDb }) {
  const template = fs.readFileSync(templateFile, 'utf8');
  const fontFile = path.join(publicDir, 'fonts', 'inter-var.woff2');

  async function load(db) {
    const [s, p] = await Promise.all([
      db.query('SELECT key, value FROM site_settings'),
      db.query('SELECT name, bio FROM profile WHERE id = 1').catch(() => ({ rows: [] })),
    ]);
    const map = {};
    s.rows.forEach(r => { map[r.key] = r.value; });
    return { map, profile: p.rows[0] || null };
  }

  // Returns { status, html }
  // `preloaded` is { map, profile } and lets the caller render with defaults when the database is down.
  async function render(req, now, preloaded) {
    const { map, profile } = preloaded || await load(getDb());
    const p = normalisePath(req.path);
    const page = BY_PATH.get(p) || null;
    const hidden = page && !pageVisible(page, map);
    const known = page && !hidden;
    const meta = pageMeta(known ? page : null, map, profile);

    const config = themes.readConfig(map);
    const theme = themes.pickForRender(config, now);
    const base = origin(req);
    const canonical = known && base ? `${base}${page.path}` : '';

    let jsonld = '';
    if (known && page.id === 'faq') {
      const items = faqItems(map).slice(0, 30);
      const data = {
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: items.map(i => ({ '@type': 'Question', name: oneLine(i.q), acceptedAnswer: { '@type': 'Answer', text: String(i.a).trim() } })),
      };
      jsonld = `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')}</script>`;
    }

    const preload = fs.existsSync(fontFile)
      ? '<link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin>'
      : '';
    const og = [
      `<meta property="og:title" content="${esc(meta.title)}">`,
      meta.description ? `<meta property="og:description" content="${esc(meta.description)}">` : '',
      '<meta property="og:type" content="website">',
      canonical ? `<meta property="og:url" content="${esc(canonical)}">` : '',
      '<meta name="twitter:card" content="summary">',
    ].filter(Boolean).join('\n  ');

    const fill = {
      '{{HTML_ATTRS}}': `data-theme="${esc(theme.id)}" data-page="${known ? page.id : 'notfound'}" style="${esc(T.styleText(theme, config.transition))}"`,
      '{{THEME_COLOR}}': esc(theme.bg),
      '{{TITLE}}': esc(meta.title),
      '{{DESCRIPTION}}': esc(meta.description),
      '{{CANONICAL}}': canonical ? `<link rel="canonical" href="${esc(canonical)}">` : '',
      '{{OG}}': og,
      '{{PRELOAD}}': preload,
      '{{JSONLD}}': jsonld,
    };
    let html = template;
    Object.keys(fill).forEach(k => { html = html.split(k).join(fill[k]); });
    return { status: known ? 200 : 404, html, hidden: !!hidden };
  }

  async function sitemap(req) {
    const { map } = await load(getDb());
    const base = origin(req);
    const urls = PAGES.filter(p => pageVisible(p, map)).map(p => `  <url><loc>${esc(base + p.path)}</loc></url>`).join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  }

  // The admin path is deliberately not written here. A robots.txt entry would publish the secret
  // address to anyone who asks for the file. The admin page and its API already send noindex headers.
  function robots(req) {
    const base = origin(req);
    return ['User-agent: *', 'Allow: /', 'Disallow: /api/', base ? `Sitemap: ${base}/sitemap.xml` : ''].filter(Boolean).join('\n') + '\n';
  }

  return { render, sitemap, robots, load };
}

module.exports = { createShell, PAGES, NOT_APP, normalisePath, pageMeta, faqItems, pageVisible };
