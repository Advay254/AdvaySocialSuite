<div align="center">

[![Version](https://img.shields.io/badge/version-v1.1.0-00e5ff?style=for-the-badge&logoColor=white)](https://github.com/Advay254/AdvaySocialSuite/releases/latest)
[![Node.js](https://img.shields.io/badge/Node.js-Runtime-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Render](https://img.shields.io/badge/Render-Deploy-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com)
[![Support Me](https://img.shields.io/badge/Support%20Me-Buy%20Me%20a%20Coffee-ffdd57?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/advay254)

# AdvaySocialSuite

[![Typing SVG](https://readme-typing-svg.demolab.com?font=Fira+Code&size=18&duration=2800&pause=900&color=00E5FF&center=true&vCenter=true&width=750&lines=Portfolio+%7C+Tools+Hub+%7C+Personal+Brand;Built+for+Creators+and+Indie+Builders;Automation+%7C+Bots+%7C+Web+Tools)](https://github.com/Advay254/AdvaySocialSuite)

**Advay's personal portfolio, tools showcase, and brand hub - all in one place.**  
A lean, self-hostable Node.js + Supabase web app with a built-in AI assistant, admin dashboard, and full content management.

</div>

---

## Features

- **Home** - Dynamic landing page with animated hero and featured tools
- **About / Profile** - Full profile page with bio, skills, and tech stack
- **GitHub Repos** - List of public repos with collapsible README.md previews
- **Live Tools** - Showcase of active deployed tools with category filters
- **Collaborate** - Contact form for collaboration requests
- **AI Assistant** - In-page chat that works with any OpenAI compatible provider, set up from the admin panel (on-topic only)
- **Suggestion Box** - Floating button for visitors to send feedback
- **Admin Dashboard** - Hidden management panel at a secret URL path
- **Health Endpoint** - `/health` for uptime monitoring

---

## Project Structure

```
AdvaySocialSuite/
├── server.js
├── package.json
├── .env.example
├── .gitignore
├── db/
├── middleware/
├── routes/
├── views/
└── public/
```

> Lean structure by design - all logic is modular and clearly separated.

---

## Quick Start

```bash
git clone https://github.com/Advay254/AdvaySocialSuite.git
cd AdvaySocialSuite
npm install
cp .env.example .env
# Fill in your .env values
npm start
```

The app will auto-create all required database tables on first boot. No manual SQL needed.

---

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Server port (default: `3000`) |
| `DATABASE_URL` | PostgreSQL / Supabase connection string |
| `ADMIN_PATH` | Secret URL path for the admin dashboard (e.g. `xk9m4a-panel`) |
| `ADMIN_USERNAME` | Admin login username |
| `ADMIN_PASSWORD` | Admin login password |
| `JWT_SECRET` | Long random string for JWT signing |
| `GROQ_API_KEY` | Optional legacy fallback. Used only until a provider is saved in the admin panel |
| `GROQ_MODEL` | Optional legacy fallback model name |
| `SITE_NAME` | Display name for the site |

---

## AI provider setup

The assistant works with any service that follows the OpenAI chat format.

1. Open the admin panel, then Settings, then the AI Chat tab.
2. Pick a provider preset (OpenAI, Google Gemini, Groq, OpenRouter, Together, Mistral, DeepSeek) or choose Custom and type the Base URL.
3. Paste your API key and press Load models, then choose a model from the list.
4. Press Test connection, then Save Settings.

Notes:

- The key is stored encrypted in your database (AES-256-GCM, derived from `JWT_SECRET`). It is never sent back to the browser. If you change `JWT_SECRET`, enter the key again.
- If you change the Base URL you must enter that provider's key again. The saved key is never sent to a different address.
- The Base URL must be a public https address. Private, local and cloud metadata addresses are refused.
- Until a provider is saved, the older `GROQ_API_KEY` and `GROQ_MODEL` variables keep working as a fallback.
- The daily limit is counted per visitor in server memory and resets when the server restarts or the day changes.

## Icons

Every icon on the public site and in the admin panel is an inline SVG that takes the colour of the text around it. There are no emoji anywhere.

- **Choose the style:** Admin, Settings, General, Icon style. Pick Lucide, Tabler, Phosphor, Heroicons or Feather. The change goes live when you press Save Settings.
- **Choose an icon for an item:** tools, services and specialization cards all use the same picker (search, grouped, keyboard friendly).
- **Your own icons:** Settings, General, Your own icons. Upload an SVG up to 10 KB. It is cleaned automatically (scripts, links, styles, colours and external references are removed) and drawn in your site colours.
- **Rebuilding the style files** (only when you change `scripts/icon-map.js`): run `npm install`, then `npm run build:icons`. The app itself only reads the generated files in `public/icons`.
- Existing emoji icons are converted to icon names automatically the first time the server starts. The log line `[Icons] Emoji conversion changed N values` tells you how many values changed. Running it again changes nothing.

## Security

What is in place:

- Every database value is sent as a parameter. Ids in addresses must be whole numbers. No query is built from request text.
- Every field a visitor or the admin can send is checked for type, length and format in one module (`lib/validate.js`). Unknown fields on admin writes are refused.
- All text written into pages is escaped, README previews are cleaned with DOMPurify, and custom icons pass a strict SVG allowlist.
- Security headers and a Content Security Policy on every page. The public site allows scripts from itself only. The admin page has its own, wider policy because it still uses the Tailwind CDN script, one inline script, inline handlers and inline styles.
- Cross origin access is off unless you list an origin in Settings, General, Allowed origins.
- Rate limits: five form posts per 15 minutes, 40 page views per minute, 300 public requests and 600 admin requests per 15 minutes, plus the existing login and chat limits. Bodies are limited to 50 KB for public requests and 1 MB for admin.
- Errors never reveal database messages, file paths or stack traces. Each failure gets a request id you can find in the server log.
- Admin login compares credentials in constant time and answers every failure the same way after a short delay. An account with no configured password can never log in.

Check a running site any time:

```
npm run security-check -- https://your-site.example --admin-path=your-secret-path
```

Add `--limits` to also confirm the form rate limit (your address is then limited for 15 minutes). Behind more than one proxy (for example Cloudflare in front of your host), raise `trust proxy` in `server.js` so limits see the visitor address.

## Appearance

The public site has one warm light look with black bands, there is no theme switch. The accent colour is set in Settings, General. Text colour on buttons, a darker accent for text on cream and a lighter accent for text on black are calculated automatically, so any colour stays readable.

Fonts are self hosted from `public/fonts` (see THIRD-PARTY-NOTICES.md).

## Reply length

In Settings, AI Chat, set Maximum reply length (characters) from 200 to 3000. The assistant is told the limit and writes to fit it. If a reply still runs long it is shortened on the server to the last complete sentence, so a visitor never sees a half finished answer.

## Deploying to Production

### Render (Recommended - Free Tier)

1. Create a new **Web Service** on [Render](https://render.com)
2. Connect this repository
3. Set **Build Command:** `npm install`
4. Set **Start Command:** `npm start`
5. Add all environment variables from the table above
6. Deploy

### Railway / VPS

Works on any Node.js host. Set environment variables and run `npm start`.

---

## How It Works

```
Browser → Express Server → Routes → PostgreSQL (Supabase)
                        ↘ /api/chat → your AI provider (server-side only)
                        ↘ /{ADMIN_PATH} → Admin Dashboard
```

The admin dashboard is only accessible at the secret path set via `ADMIN_PATH`. It is not linked anywhere on the public site.

---

## Updates

To update your deployment:

1. Pull the latest changes from the repository
2. Run `npm install` to update dependencies
3. Redeploy on Render (or restart your server)

The database schema is non-destructive - updates only add new tables or columns, never drop existing data.

---

## Tech Stack

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CDN-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Groq](https://img.shields.io/badge/Groq-AI-F55036?style=flat-square)](https://groq.com)

---

## Contributing

This is a personal project. Issues and discussions are welcome via [GitHub Issues](https://github.com/Advay254/AdvaySocialSuite/issues).

---

## Disclaimer

This project is provided as-is for personal use and self-hosting. The author is not responsible for misuse or downtime of third-party services.

---

## License

MIT © 2026 [Advay](https://github.com/Advay254)

---

<div align="center">

![Visitor Count](https://visitor-badge.laobi.icu/badge?page_id=Advay254.AdvaySocialSuite)

Star this repo if it helped you

<br>

<a href="https://www.buymeacoffee.com/advay254">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;">
</a>

</div>
