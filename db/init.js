const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS profile (
  id SERIAL PRIMARY KEY,
  name TEXT DEFAULT 'Advay',
  tagline TEXT DEFAULT 'Builder of Useful Things',
  bio TEXT DEFAULT 'Automation engineer and full-stack builder from Kenya. I build practical digital products — tools, bots, and systems that solve real problems without unnecessary complexity.',
  location TEXT DEFAULT 'Kenya',
  github_url TEXT DEFAULT 'https://github.com/Advay254',
  linkedin_url TEXT DEFAULT 'https://www.linkedin.com/in/advay-glimmer-571145380',
  bmc_url TEXT DEFAULT 'https://www.buymeacoffee.com/advay254',
  avatar_url TEXT DEFAULT '',
  skills TEXT DEFAULT '["n8n","Node.js","Express","Supabase","PostgreSQL","Tailwind CSS","Vanilla JS","Baileys","Telegram Bots","MacroDroid","Cloudflare Workers","Render","GitHub Actions","REST APIs","Webhooks"]',
  principles TEXT DEFAULT '["Build things that work","Keep them simple","Make them last","Zero unnecessary complexity","Free-tier first"]',
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

CREATE TABLE IF NOT EXISTS collab_requests (
  id SERIAL PRIMARY KEY,
  name TEXT,
  email TEXT,
  subject TEXT,
  message TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS suggestions (
  id SERIAL PRIMARY KEY,
  content TEXT,
  email TEXT,
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

const SEED_SETTINGS = [
  ['site_name', process.env.SITE_NAME || 'AdvaySocialSuite'],
  ['site_tagline', 'Build. Automate. Deploy.'],
  ['meta_description', 'Portfolio and tools hub for Advay — automation engineer and open source builder from Kenya.'],
  ['home_headline', 'Building the Internet,\nOne Tool at a Time.'],
  ['home_subheadline', 'Automation engineer from Kenya. I ship practical web tools, bots, and systems that work — and keep working.'],
  ['chat_system_prompt', `You are the AdvaySocialSuite AI Assistant — a helpful guide for visitors to Advay's portfolio and tools hub.

About Advay:
- Full-stack automation engineer from Kenya
- Specializes in n8n workflows, API integrations, bot development, and web tools
- Builds practical digital products for creators and small teams
- Core stack: Node.js/Express, n8n, Supabase, Tailwind CSS, Vanilla JS, Baileys, Telegram bots
- Philosophy: "Build things that work. Keep them simple. Make them last."
- Deploys on Render (free tier), uses Cloudflare, GitHub Actions, Supabase

Projects:
- SkyluxMovies — movie streaming/download helper (skyluxmovies.onrender.com)
- PinSaver — Pinterest video/image/board downloader (advaypinsaver.onrender.com)
- AdvaySnapTik — TikTok no-watermark downloader (advaysnaptik.onrender.com)
- AdvayPass — smart link shortener with analytics (advaypass.onrender.com)
- Code & Clarity Blog — tech blog at code-n-clarity.blogspot.com

You can help visitors:
- Learn about Advay's projects, tools, and services
- Understand how to use or deploy any of the tools
- Find collaboration or contact information
- Answer questions about AdvaySocialSuite

STRICT RULE: If a user asks anything completely off-topic (cooking, cars, general knowledge, entertainment unrelated to Advay, etc.), respond ONLY with: "I can only help with questions about Advay and his projects. For everything else, try a general-purpose AI assistant!"

Keep responses short — 1-3 sentences unless detail is necessary. Be friendly and direct.`],
];

const SEED_REPOS = [
  {
    title: 'SkyluxMovies',
    url: 'https://github.com/Advay254/SkyluxMovies',
    description: '🎬 Stream and download free HD movies — no account, no watermark, no hassle. All movies available including latest releases. Self-hostable.',
    readme_md: '',
    tags: '["Node.js","Express","YTS API","PWA","Render"]',
    display_order: 1,
  },
  {
    title: 'Pinterest-Downloader',
    url: 'https://github.com/Advay254/Pinterest-Downloader',
    description: '📌 Download Pinterest videos and images in original quality — no watermarks, no limits, no sign-in required. Supports all Pinterest domains, pin.it short links, bulk board downloads.',
    readme_md: '',
    tags: '["Node.js","Express","Pinterest API","PWA","Render"]',
    display_order: 2,
  },
  {
    title: 'TikTok-Downloder',
    url: 'https://github.com/Advay254/TikTok-Downloder',
    description: '🎵 Free TikTok video downloader. No-watermark MP4, MP3 audio extraction, and slideshow image downloads. Bypasses download restrictions. Installable PWA with offline support.',
    readme_md: '',
    tags: '["Node.js","Express","TikTok","PWA","Render"]',
    display_order: 3,
  },
];

const SEED_TOOLS = [
  {
    title: 'SkyluxMovies',
    url: 'https://skyluxmovies.onrender.com',
    description: 'Mobile-first movie browsing and download helper. YTS-powered discovery, quality selection from 720p to 4K, PWA installable.',
    icon: '🎬',
    category: 'entertainment',
    status: 'active',
    display_order: 1,
  },
  {
    title: 'PinSaver',
    url: 'https://advaypinsaver.onrender.com',
    description: 'Pinterest media downloader built for speed and simplicity. No account required, board scanning up to 50 pins, bulk ZIP download.',
    icon: '📌',
    category: 'downloader',
    status: 'active',
    display_order: 2,
  },
  {
    title: 'AdvaySnapTik',
    url: 'https://advaysnaptik.onrender.com',
    description: 'TikTok downloader with a clean, no-friction experience. No watermark downloads, slideshow support, fast link processing.',
    icon: '🎵',
    category: 'downloader',
    status: 'active',
    display_order: 3,
  },
  {
    title: 'AdvayPass',
    url: 'https://advaypass.onrender.com',
    description: 'Smart link shortener with analytics. Custom slugs, per-link click analytics, optional password protection, auto-expiry, QR code generation.',
    icon: '🔗',
    category: 'utility',
    status: 'active',
    display_order: 4,
  },
  {
    title: 'Code & Clarity',
    url: 'https://code-n-clarity.blogspot.com',
    description: 'Tech blog covering automation, web development, and digital tools. Built with Next.js 15, Directus CMS, and automated Bluesky posting.',
    icon: '✍️',
    category: 'blog',
    status: 'active',
    display_order: 5,
  },
];

async function initDB() {
  const db = getPool();

  try {
    console.log('[DB] Connecting to database...');
    await db.query('SELECT 1');
    console.log('[DB] Connected.');

    // Create tables
    await db.query(SCHEMA);
    console.log('[DB] Schema ready.');

    // Seed profile if empty
    const profileCount = await db.query('SELECT COUNT(*) FROM profile');
    if (parseInt(profileCount.rows[0].count) === 0) {
      await db.query('INSERT INTO profile (id) VALUES (1) ON CONFLICT DO NOTHING');
      console.log('[DB] Profile seeded.');
    }

    // Seed settings if empty
    const settingsCount = await db.query('SELECT COUNT(*) FROM site_settings');
    if (parseInt(settingsCount.rows[0].count) === 0) {
      for (const [key, value] of SEED_SETTINGS) {
        await db.query(
          'INSERT INTO site_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING',
          [key, value]
        );
      }
      console.log('[DB] Site settings seeded.');
    }

    // Seed repos if empty
    const reposCount = await db.query('SELECT COUNT(*) FROM repos');
    if (parseInt(reposCount.rows[0].count) === 0) {
      for (const r of SEED_REPOS) {
        await db.query(
          'INSERT INTO repos (title, url, description, readme_md, tags, display_order) VALUES ($1,$2,$3,$4,$5,$6)',
          [r.title, r.url, r.description, r.readme_md, r.tags, r.display_order]
        );
      }
      console.log('[DB] Repos seeded.');
    }

    // Seed tools if empty
    const toolsCount = await db.query('SELECT COUNT(*) FROM tools');
    if (parseInt(toolsCount.rows[0].count) === 0) {
      for (const t of SEED_TOOLS) {
        await db.query(
          'INSERT INTO tools (title, url, description, icon, category, status, display_order) VALUES ($1,$2,$3,$4,$5,$6,$7)',
          [t.title, t.url, t.description, t.icon, t.category, t.status, t.display_order]
        );
      }
      console.log('[DB] Tools seeded.');
    }

    console.log('[DB] Initialization complete.');
  } catch (err) {
    console.error('[DB] Init error:', err.message);
    throw err;
  }
}

module.exports = { getPool, initDB };
