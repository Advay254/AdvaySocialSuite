/*
 * One time (and safe to repeat) conversion of stored emoji.
 *  - tool icons and the icons inside the services, specializations and collaboration
 *    services settings become semantic icon names from lib/iconVocab.js
 *  - emoji are removed from titles, descriptions and the other owner written text
 * Visitor submissions (collaboration requests, suggestions) and secrets are never touched.
 * Running it again changes nothing and logs 0.
 */
const vocab = require('../lib/iconVocab');

const JSON_LIST_KEYS = ['specializations', 'collab_services'];
const SKIP_SETTING = (key) => key.startsWith('_') || key.startsWith('ai_') || key === 'webhook_url' || key === 'chat_system_prompt';

function clean(value) { return vocab.hasEmoji(value) ? vocab.stripEmoji(value) : value; }

async function migrateEmoji(db, log) {
  log = log || console.log;
  const changed = { tools: 0, repos: 0, templates: 0, profile: 0, settings: 0 };

  // Tools: icon, title, description
  const tools = await db.query('SELECT id, icon, category, title, description FROM tools');
  for (const t of tools.rows) {
    const icon = vocab.iconFromStored(t.icon, t.category);
    const title = clean(t.title || '');
    const description = clean(t.description || '');
    let n = 0;
    if (icon !== t.icon) n++;
    if (title !== (t.title || '')) n++;
    if (description !== (t.description || '')) n++;
    if (n) {
      await db.query('UPDATE tools SET icon=$1, title=$2, description=$3 WHERE id=$4', [icon, title, description, t.id]);
      changed.tools += n;
    }
  }

  // Repos and templates: title and description
  for (const [table, key] of [['repos', 'repos'], ['n8n_templates', 'templates']]) {
    const sel = table === 'repos' ? 'SELECT id, title, description FROM repos' : 'SELECT id, title, description FROM n8n_templates';
    const upd = table === 'repos' ? 'UPDATE repos SET title=$1, description=$2 WHERE id=$3' : 'UPDATE n8n_templates SET title=$1, description=$2 WHERE id=$3';
    const rows = await db.query(sel);
    for (const r of rows.rows) {
      const title = clean(r.title || ''), description = clean(r.description || '');
      const n = (title !== (r.title || '') ? 1 : 0) + (description !== (r.description || '') ? 1 : 0);
      if (n) { await db.query(upd, [title, description, r.id]); changed[key] += n; }
    }
  }

  // Profile text
  const prof = await db.query('SELECT id, name, tagline, bio, location FROM profile');
  for (const r of prof.rows) {
    const next = { name: clean(r.name || ''), tagline: clean(r.tagline || ''), bio: clean(r.bio || ''), location: clean(r.location || '') };
    const n = ['name', 'tagline', 'bio', 'location'].filter(k => next[k] !== (r[k] || '')).length;
    if (n) { await db.query('UPDATE profile SET name=$1, tagline=$2, bio=$3, location=$4 WHERE id=$5', [next.name, next.tagline, next.bio, next.location, r.id]); changed.profile += n; }
  }

  // Settings
  const settings = await db.query('SELECT key, value FROM site_settings');
  for (const row of settings.rows) {
    if (SKIP_SETTING(row.key) || typeof row.value !== 'string') continue;
    let next = row.value;
    let n = 0;
    if (JSON_LIST_KEYS.includes(row.key)) {
      let list = null;
      try { list = JSON.parse(row.value); } catch { list = null; }
      if (Array.isArray(list)) {
        list = list.map((item, i) => {
          if (!item || typeof item !== 'object') return item;
          const out = { ...item };
          const icon = vocab.convertIcon(item.icon, vocab.serviceDefault(i));
          if (icon !== item.icon) n++;
          out.icon = icon;
          for (const f of ['title', 'desc']) {
            if (typeof item[f] === 'string') { const c = clean(item[f]); if (c !== item[f]) n++; out[f] = c; }
          }
          return out;
        });
        if (n) next = JSON.stringify(list);
      } else if (vocab.hasEmoji(row.value)) { next = vocab.stripEmoji(row.value); n = 1; }
    } else if (vocab.hasEmoji(row.value)) {
      next = vocab.stripEmoji(row.value); n = 1;
    }
    if (n && next !== row.value) {
      await db.query('UPDATE site_settings SET value=$1, updated_at=NOW() WHERE key=$2', [next, row.key]);
      changed.settings += n;
    }
  }

  const total = Object.values(changed).reduce((a, b) => a + b, 0);
  log(`[Icons] Emoji conversion changed ${total} value${total === 1 ? '' : 's'} (tools ${changed.tools}, repos ${changed.repos}, templates ${changed.templates}, profile ${changed.profile}, settings ${changed.settings}).`);
  return { total, ...changed };
}

module.exports = { migrateEmoji };
