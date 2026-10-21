const { Pool } = require('pg');
const { DEFAULTS: AI_DEFAULTS } = require('../lib/aiDefaults');
const { migrateEmoji } = require('./migrateEmoji');

let pool;
function getPool() {
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  return pool;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS profile (
  id SERIAL PRIMARY KEY,
  name TEXT DEFAULT '',
  tagline TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  location TEXT DEFAULT '',
  github_url TEXT DEFAULT '',
  linkedin_url TEXT DEFAULT '',
  twitter_url TEXT DEFAULT '',
  youtube_url TEXT DEFAULT '',
  discord_url TEXT DEFAULT '',
  tiktok_url TEXT DEFAULT '',
  bmc_url TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  skills TEXT DEFAULT '[]',
  principles TEXT DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS repos (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT DEFAULT '',
  description TEXT DEFAULT '',
  readme_md TEXT DEFAULT '',
  tags TEXT DEFAULT '[]',
  display_order INT DEFAULT 0,
  visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tools (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT DEFAULT '',
  description TEXT DEFAULT '',
  icon TEXT DEFAULT 'wrench',
  category TEXT DEFAULT 'tool',
  status TEXT DEFAULT 'active',
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS n8n_templates (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  json_url TEXT DEFAULT '',
  tags TEXT DEFAULT '[]',
  display_order INT DEFAULT 0,
  visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collab_requests (
  id SERIAL PRIMARY KEY,
  name TEXT, email TEXT, subject TEXT, message TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS suggestions (
  id SERIAL PRIMARY KEY,
  content TEXT, email TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS page_views (
  id SERIAL PRIMARY KEY,
  page TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS custom_icons (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  svg TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

const MIGRATIONS = `
ALTER TABLE profile ADD COLUMN IF NOT EXISTS twitter_url TEXT DEFAULT '';
ALTER TABLE profile ADD COLUMN IF NOT EXISTS youtube_url TEXT DEFAULT '';
ALTER TABLE profile ADD COLUMN IF NOT EXISTS discord_url TEXT DEFAULT '';
ALTER TABLE profile ADD COLUMN IF NOT EXISTS tiktok_url TEXT DEFAULT '';
`;

const SEED_SETTINGS = [
  ['site_name', process.env.SITE_NAME || 'AdvaySocialSuite'],
  ['repo_count', '26'],
  ['years_exp', '1'],
  ['site_tagline', 'Build. Automate. Deploy.'],
  ['meta_description', 'Portfolio and tools hub for an automation engineer and builder.'],
  ['home_headline', 'Building the Internet,\nOne Tool at a Time.'],
  ['home_subheadline', 'Automation engineer. I ship practical web tools, bots, and systems that solve real problems and keep solving them, indefinitely.'],
  ['philosophy_quote', 'Build things that work.\nKeep them simple.\nMake them last.'],
  ['philosophy_sub', 'If something runs once, it runs forever. If it runs daily, it runs itself.'],
  ['timeline_1', 'Automation & n8n Workflows'],
  ['timeline_2', 'Bot Development (WhatsApp, Telegram)'],
  ['timeline_3', 'Web Tools & API Microservices'],
  ['templates_label', 'n8n Templates'],
  ['templates_visible', '1'],
  ['cylinder_labels', 'BAILEYS BOTS,REST APIs,N8N WORKFLOWS,SUPABASE / POSTGRES,RENDER DEPLOYMENTS,WEBHOOK SYSTEMS,PWA TOOLS,ADSTERRA MONETIZATION'],
  ['theme_interval', '6'],
  ['collab_intro', 'I build automation systems, bots, and web tools. Remote only, global clients welcome. Most projects are completed within 1 to 2 weeks. I keep things practical, free-tier first, and built to last.'],
  ['collab_subtitle', 'Got a project idea? Let\'s talk.'],
  ['collab_qi_1', 'Usually responds within 24 hours'],
  ['collab_qi_2', 'Specializes in free-tier, zero-cost production systems'],
  ['collab_qi_3', 'Prefers small-to-medium scoped projects with clear goals'],
  ['collab_services', JSON.stringify([
    { icon: 'settings', title: 'Automation Systems', desc: 'n8n workflows, API pipelines, scheduled tasks and complex multi-step automation.' },
    { icon: 'bot', title: 'Bot Development', desc: 'WhatsApp bots (Baileys), Telegram bots, webhook-driven messaging systems.' },
    { icon: 'globe', title: 'Web Tools & Apps', desc: 'Downloaders, utilities, dashboards. Fast, mobile-first, deployable on free tier.' },
    { icon: 'plug', title: 'API Integrations', desc: 'Connecting third-party services, building proxy layers, REST API microservices.' },
    { icon: 'chart', title: 'Data Pipelines', desc: 'Automated data collection, transformation, and delivery workflows.' },
    { icon: 'lightbulb', title: 'Technical Consulting', desc: 'Architecture reviews, workflow optimization, free-tier scaling strategy.' },
  ])],
  ['tools_subtitle', 'Fully deployed, free-to-use tools. Click any card to visit.'],
  ['templates_subtitle', 'Ready-to-import workflow templates. Click the JSON button to download and import.'],
  ['webhook_url', ''],
  ['specializations', JSON.stringify([
    { icon:'workflow', title:'Workflow Engineering', desc:'Advanced n8n implementations with custom logic, multi-agent architectures, and sophisticated automation flows.' },
    { icon:'bot', title:'Bot Development', desc:'Functional, reliable bots with clean architecture. WhatsApp (Baileys), Telegram, and webhook-driven systems.' },
    { icon:'globe', title:'Web Tools', desc:'Fast, mobile-first web apps with real usability: downloaders, shorteners, discovery platforms.' },
    { icon:'plug', title:'API Microservices', desc:'High-performance, purpose-built services designed for automation pipelines and free-tier hosting.' },
  ])],
  ['funfact', 'If I do it twice, I automate it. If it takes more than 20 seconds daily, I automate it aggressively.'],
];

// Added in 1.0.0. Every value here is only ever inserted when the key does not exist yet.
const SEED_SETTINGS_V1 = [
  ['accent_color', '#b98b6e'],
  ['nav_home', 'Home'],
  ['nav_about', 'About'],
  ['nav_repos', 'Repos'],
  ['nav_tools', 'Tools'],
  ['nav_collab', 'Collaborate'],
  ['support_label', 'Support'],
  ['footer_nav_heading', 'Explore'],
  ['footer_connect_heading', 'Connect'],
  ['footer_support_heading', 'Support'],
  ['footer_support_text', 'These tools are free to use. If they saved you time, you can help cover the hosting costs.'],
  ['home_availability_label', 'Available for new projects'],
  ['home_cta_primary_label', 'Explore tools'],
  ['home_cta_secondary_label', 'Work with me'],
  ['home_tools_kicker', 'Live products'],
  ['home_tools_heading', 'Featured tools'],
  ['home_tools_more_label', 'View all tools'],
  ['home_templates_kicker', 'Automation'],
  ['home_templates_more_label', 'View all templates'],
  ['template_import_label', 'Import JSON'],
  ['home_services_kicker', 'Services'],
  ['home_services_heading', 'What I can build for you'],
  ['home_services_subtitle', 'Practical systems that are simple to run and built to last.'],
  ['home_philosophy_kicker', 'Philosophy'],
  ['home_cta_heading', 'Have a project in mind?'],
  ['home_cta_text', 'Tell me what you need. I will say honestly whether I can help and what it would take.'],
  ['home_cta_button', 'Start a conversation'],
  ['home_stat_tools_label', 'Live tools'],
  ['home_stat_repos_label', 'Public repositories'],
  ['icon_pack', 'lucide'],
  ['home_stat_years_label', 'Years building'],
  ['nav_cta_label', 'Work with me'],
  ['nav_cta_link', '#/collab'],
  ['home_about_kicker', 'About me'],
  ['home_about_button', 'Read my story'],
  ['tool_open_label', 'Open'],
  ['collab_success_title', 'Message sent'],
  ['collab_success_text', 'I will read it and reply by email within 24 hours.'],
  ['status_live_label', 'Live'],
  ['status_waking_label', 'Waking up'],
  ['status_down_label', 'Down'],
  ...Object.entries(AI_DEFAULTS).filter(([k]) => k !== 'ai_system_prompt'),
];

const SEED_PROFILE = {
  name: 'Advay', tagline: 'Builder of Useful Things',
  bio: 'Automation engineer and full-stack builder. I build practical digital products: tools, bots, and systems that solve real problems without unnecessary complexity.',
  location: 'Kenya', github_url: 'https://github.com/Advay254',
  linkedin_url: 'https://www.linkedin.com/in/advay-glimmer-571145380',
  bmc_url: 'https://www.buymeacoffee.com/advay254', avatar_url: '',
  skills: JSON.stringify(['n8n','Node.js','Express','Supabase','PostgreSQL','Tailwind CSS','Vanilla JS','Baileys','Telegram Bots','MacroDroid','Cloudflare Workers','Render','GitHub Actions','REST APIs','Webhooks']),
  principles: JSON.stringify(['Build things that work','Keep them simple','Make them last','Zero unnecessary complexity','Free-tier first']),
};

const SEED_REPOS = [
  { title:'SkyluxMovies', url:'https://github.com/Advay254/SkyluxMovies', description:'Stream and download free HD movies. No account, no watermark. Self-hostable.', tags:'["Node.js","Express","YTS API","PWA","Render"]', display_order:1 },
  { title:'Pinterest-Downloader', url:'https://github.com/Advay254/Pinterest-Downloader', description:'Download Pinterest videos and images in original quality. No watermarks, no sign-in required.', tags:'["Node.js","Express","Pinterest API","PWA"]', display_order:2 },
  { title:'TikTok-Downloder', url:'https://github.com/Advay254/TikTok-Downloder', description:'Free TikTok video downloader. No-watermark MP4, MP3 audio, slideshow downloads. Installable PWA.', tags:'["Node.js","Express","TikTok","PWA"]', display_order:3 },
];

const SEED_TOOLS = [
  { title:'SkyluxMovies', url:'https://skyluxmovies.onrender.com', description:'Mobile-first movie browsing and download helper. YTS-powered, quality selection 720p to 4K, PWA installable.', icon:'film', category:'entertainment', status:'active', display_order:1 },
  { title:'PinSaver', url:'https://advaypinsaver.onrender.com', description:'Pinterest media downloader. No account required, bulk board download up to 50 pins, ZIP export.', icon:'pin', category:'downloader', status:'active', display_order:2 },
  { title:'AdvaySnapTik', url:'https://advaysnaptik.onrender.com', description:'TikTok downloader with no watermark, slideshow support and fast processing. Installable as PWA.', icon:'music', category:'downloader', status:'active', display_order:3 },
  { title:'AdvayPass', url:'https://advaypass.onrender.com', description:'Smart link shortener with analytics, custom slugs, password protection, auto-expiry and QR codes.', icon:'link', category:'utility', status:'active', display_order:4 },
  { title:'Code & Clarity', url:'https://code-n-clarity.blogspot.com', description:'Tech blog covering automation, web development, and digital tools. Automated Bluesky posting pipeline.', icon:'pen', category:'blog', status:'active', display_order:5 },
];

async function initDB() {
  const db = getPool();
  try {
    console.log('[DB] Connecting...');
    await db.query('SELECT 1');
    console.log('[DB] Connected.');
    await db.query(SCHEMA);
    await db.query(MIGRATIONS);
    console.log('[DB] Schema + migrations ready.');

    const pc = await db.query('SELECT COUNT(*) FROM profile');
    if (parseInt(pc.rows[0].count) === 0) {
      await db.query(`INSERT INTO profile (name,tagline,bio,location,github_url,linkedin_url,bmc_url,avatar_url,skills,principles) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [SEED_PROFILE.name,SEED_PROFILE.tagline,SEED_PROFILE.bio,SEED_PROFILE.location,SEED_PROFILE.github_url,SEED_PROFILE.linkedin_url,SEED_PROFILE.bmc_url,SEED_PROFILE.avatar_url,SEED_PROFILE.skills,SEED_PROFILE.principles]);
    }

    // Always upsert new settings so existing deployments pick them up
    for (const [k, v] of SEED_SETTINGS) {
      await db.query('INSERT INTO site_settings (key,value) VALUES ($1,$2) ON CONFLICT (key) DO NOTHING', [k, v]);
    }

    // 1.0.0 settings. Existing values are never overwritten.
    // The AI system prompt starts from whatever the owner already saved as chat_system_prompt.
    await db.query("INSERT INTO site_settings (key,value) SELECT 'ai_system_prompt', value FROM site_settings WHERE key='chat_system_prompt' AND COALESCE(value,'') <> '' ON CONFLICT (key) DO NOTHING");
    await db.query('INSERT INTO site_settings (key,value) VALUES ($1,$2) ON CONFLICT (key) DO NOTHING', ['ai_system_prompt', AI_DEFAULTS.ai_system_prompt]);
    // 1.0.1: the reply length is now set in characters. Carry an old token value over (about three characters per token).
    await db.query("INSERT INTO site_settings (key,value) SELECT 'ai_max_chars', LEAST(3000, GREATEST(200, CAST(value AS INTEGER) * 3))::text FROM site_settings WHERE key='ai_max_tokens' AND value ~ '^[0-9]{1,5}$' ON CONFLICT (key) DO NOTHING");
    // 1.0.1: the accent default changed. Move only the untouched old default, once.
    const accentMove = await db.query("INSERT INTO site_settings (key,value) VALUES ('_migrated_accent_101','1') ON CONFLICT (key) DO NOTHING RETURNING key");
    if (accentMove.rowCount === 1) {
      await db.query("UPDATE site_settings SET value='#b98b6e', updated_at=NOW() WHERE key='accent_color' AND value='#0b7285'");
    }
    for (const [k, v] of SEED_SETTINGS_V1) {
      await db.query('INSERT INTO site_settings (key,value) VALUES ($1,$2) ON CONFLICT (key) DO NOTHING', [k, v]);
    }

    const rc = await db.query('SELECT COUNT(*) FROM repos');
    if (parseInt(rc.rows[0].count) === 0) {
      for (const r of SEED_REPOS)
        await db.query('INSERT INTO repos (title,url,description,tags,display_order) VALUES ($1,$2,$3,$4,$5)', [r.title,r.url,r.description,r.tags,r.display_order]);
    }

    const tc = await db.query('SELECT COUNT(*) FROM tools');
    if (parseInt(tc.rows[0].count) === 0) {
      for (const t of SEED_TOOLS)
        await db.query('INSERT INTO tools (title,url,description,icon,category,status,display_order) VALUES ($1,$2,$3,$4,$5,$6,$7)', [t.title,t.url,t.description,t.icon,t.category,t.status,t.display_order]);
    }

    // 1.1.0: stored emoji become icon names, emoji text is removed. Safe to repeat.
    await migrateEmoji(db);

    console.log('[DB] Init complete.');
  } catch (err) {
    console.error('[DB] Init error:', err.message);
    throw err;
  }
}

module.exports = { getPool, initDB };
