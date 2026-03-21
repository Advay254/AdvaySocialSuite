const { Pool } = require('pg');

let pool;
function getPool() {
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  return pool;
}

// CREATE TABLE (adds columns that may not exist via ALTER)
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
  icon TEXT DEFAULT '🔧',
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
`;

// Safely add columns that may not exist on older deployments
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
  ['meta_description', 'Portfolio and tools hub — automation engineer and builder.'],
  ['home_headline', 'Building the Internet,\nOne Tool at a Time.'],
  ['home_subheadline', 'Automation engineer. I ship practical web tools, bots, and systems that solve real problems — and keep solving them, indefinitely.'],
  ['philosophy_quote', 'Build things that work.\nKeep them simple.\nMake them last.'],
  ['philosophy_sub', 'If something runs once, it runs forever — and if it runs daily, it runs itself.'],
  ['timeline_1', 'Automation & n8n Workflows'],
  ['timeline_2', 'Bot Development (WhatsApp, Telegram)'],
  ['timeline_3', 'Web Tools & API Microservices'],
  ['templates_label', 'n8n Templates'],
  ['templates_visible', '1'],
  ['specializations', JSON.stringify([
    { icon:'⚙️', title:'Workflow Engineering', desc:'Advanced n8n implementations with custom logic, multi-agent architectures, and sophisticated automation flows.' },
    { icon:'🤖', title:'Bot Development', desc:'Functional, reliable bots with clean architecture — WhatsApp (Baileys), Telegram, and webhook-driven systems.' },
    { icon:'🌐', title:'Web Tools', desc:'Fast, mobile-first web apps with real usability — downloaders, shorteners, discovery platforms.' },
    { icon:'🔌', title:'API Microservices', desc:'High-performance, purpose-built services designed for automation pipelines and free-tier hosting.' },
  ])],
  ['funfact', 'If I do it twice, I automate it. If it takes more than 20 seconds daily, I automate it aggressively.'],
  ['chat_system_prompt', `You are the AdvaySocialSuite AI Assistant — a helpful guide for visitors to this portfolio and tools hub.

STRICT RULE: Only answer questions about the owner and their projects. If asked anything off-topic, respond ONLY with: "I can only help with questions about this portfolio and its projects. For everything else, try a general-purpose AI assistant!"`],
];

const SEED_PROFILE = {
  name: 'Advay', tagline: 'Builder of Useful Things',
  bio: 'Automation engineer and full-stack builder. I build practical digital products — tools, bots, and systems that solve real problems without unnecessary complexity.',
  location: 'Kenya', github_url: 'https://github.com/Advay254',
  linkedin_url: 'https://www.linkedin.com/in/advay-glimmer-571145380',
  bmc_url: 'https://www.buymeacoffee.com/advay254', avatar_url: '',
  skills: JSON.stringify(['n8n','Node.js','Express','Supabase','PostgreSQL','Tailwind CSS','Vanilla JS','Baileys','Telegram Bots','MacroDroid','Cloudflare Workers','Render','GitHub Actions','REST APIs','Webhooks']),
  principles: JSON.stringify(['Build things that work','Keep them simple','Make them last','Zero unnecessary complexity','Free-tier first']),
};

const SEED_REPOS = [
  { title:'SkyluxMovies', url:'https://github.com/Advay254/SkyluxMovies', description:'🎬 Stream and download free HD movies — no account, no watermark. Self-hostable.', tags:'["Node.js","Express","YTS API","PWA","Render"]', display_order:1 },
  { title:'Pinterest-Downloader', url:'https://github.com/Advay254/Pinterest-Downloader', description:'📌 Download Pinterest videos and images in original quality — no watermarks, no sign-in required.', tags:'["Node.js","Express","Pinterest API","PWA"]', display_order:2 },
  { title:'TikTok-Downloder', url:'https://github.com/Advay254/TikTok-Downloder', description:'🎵 Free TikTok video downloader. No-watermark MP4, MP3 audio, slideshow downloads. Installable PWA.', tags:'["Node.js","Express","TikTok","PWA"]', display_order:3 },
];

const SEED_TOOLS = [
  { title:'SkyluxMovies', url:'https://skyluxmovies.onrender.com', description:'Mobile-first movie browsing and download helper. YTS-powered, quality selection 720p–4K, PWA installable.', icon:'🎬', category:'entertainment', status:'active', display_order:1 },
  { title:'PinSaver', url:'https://advaypinsaver.onrender.com', description:'Pinterest media downloader. No account required, bulk board download up to 50 pins, ZIP export.', icon:'📌', category:'downloader', status:'active', display_order:2 },
  { title:'AdvaySnapTik', url:'https://advaysnaptik.onrender.com', description:'TikTok downloader — no watermark, slideshow support, fast processing. Installable as PWA.', icon:'🎵', category:'downloader', status:'active', display_order:3 },
  { title:'AdvayPass', url:'https://advaypass.onrender.com', description:'Smart link shortener with analytics, custom slugs, password protection, auto-expiry and QR codes.', icon:'🔗', category:'utility', status:'active', display_order:4 },
  { title:'Code & Clarity', url:'https://code-n-clarity.blogspot.com', description:'Tech blog covering automation, web development, and digital tools. Automated Bluesky posting pipeline.', icon:'✍️', category:'blog', status:'active', display_order:5 },
];

async function initDB() {
  const db = getPool();
  try {
    console.log('[DB] Connecting...');
    await db.query('SELECT 1');
    console.log('[DB] Connected.');
    await db.query(SCHEMA);
    await db.query(MIGRATIONS); // safe ADD COLUMN IF NOT EXISTS
    console.log('[DB] Schema + migrations ready.');

    const pc = await db.query('SELECT COUNT(*) FROM profile');
    if (parseInt(pc.rows[0].count) === 0) {
      await db.query(`INSERT INTO profile (name,tagline,bio,location,github_url,linkedin_url,bmc_url,avatar_url,skills,principles) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [SEED_PROFILE.name,SEED_PROFILE.tagline,SEED_PROFILE.bio,SEED_PROFILE.location,SEED_PROFILE.github_url,SEED_PROFILE.linkedin_url,SEED_PROFILE.bmc_url,SEED_PROFILE.avatar_url,SEED_PROFILE.skills,SEED_PROFILE.principles]);
    }

    // Always upsert new settings keys so existing deployments get them
    for (const [k, v] of SEED_SETTINGS) {
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

    console.log('[DB] Init complete.');
  } catch (err) {
    console.error('[DB] Init error:', err.message);
    throw err;
  }
}

module.exports = { getPool, initDB };
