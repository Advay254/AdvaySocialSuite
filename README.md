<div align="center">

[![Version](https://img.shields.io/badge/version-v1.0.0-00e5ff?style=for-the-badge&logoColor=white)](https://github.com/Advay254/AdvaySocialSuite/releases/latest)
[![Node.js](https://img.shields.io/badge/Node.js-Runtime-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Render](https://img.shields.io/badge/Render-Deploy-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com)
[![Support Me](https://img.shields.io/badge/Support%20Me-%E2%98%95%20Buy%20Me%20a%20Coffee-ffdd57?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/advay254)

# AdvaySocialSuite

[![Typing SVG](https://readme-typing-svg.demolab.com?font=Fira+Code&size=18&duration=2800&pause=900&color=00E5FF&center=true&vCenter=true&width=750&lines=Portfolio+%7C+Tools+Hub+%7C+Personal+Brand;Built+for+Creators+and+Indie+Builders;Automation+%7C+Bots+%7C+Web+Tools)](https://github.com/Advay254/AdvaySocialSuite)

**Advay's personal portfolio, tools showcase, and brand hub — all in one place.**  
A lean, self-hostable Node.js + Supabase web app with a built-in AI assistant, admin dashboard, and full content management.

</div>

---

## ✨ Features

- **Home** — Dynamic landing page with animated hero and featured tools
- **About / Profile** — Full profile page with bio, skills, and tech stack
- **GitHub Repos** — List of public repos with collapsible README.md previews
- **Live Tools** — Showcase of active deployed tools with category filters
- **Collaborate** — Contact form for collaboration requests
- **AI Assistant** - In-page chat that works with any OpenAI compatible provider, set up from the admin panel (on-topic only)
- **Suggestion Box** — Floating button for visitors to send feedback
- **Admin Dashboard** — Hidden management panel at a secret URL path
- **Health Endpoint** — `/health` for uptime monitoring

---

## 🗂️ Project Structure

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

> Lean structure by design — all logic is modular and clearly separated.

---

## 🚀 Quick Start

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

## ⚙️ Environment Variables

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

## Appearance

Visitors can choose System, Light or Dark. The accent colour is set in Settings, General. Text colour on buttons and the light and dark variants are calculated automatically so they stay readable.

## ☁️ Deploying to Production

### Render (Recommended — Free Tier)

1. Create a new **Web Service** on [Render](https://render.com)
2. Connect this repository
3. Set **Build Command:** `npm install`
4. Set **Start Command:** `npm start`
5. Add all environment variables from the table above
6. Deploy

### Railway / VPS

Works on any Node.js host. Set environment variables and run `npm start`.

---

## 🔧 How It Works

```
Browser → Express Server → Routes → PostgreSQL (Supabase)
                        ↘ /api/chat → your AI provider (server-side only)
                        ↘ /{ADMIN_PATH} → Admin Dashboard
```

The admin dashboard is only accessible at the secret path set via `ADMIN_PATH`. It is not linked anywhere on the public site.

---

## 🔄 Updates

To update your deployment:

1. Pull the latest changes from the repository
2. Run `npm install` to update dependencies
3. Redeploy on Render (or restart your server)

The database schema is non-destructive — updates only add new tables or columns, never drop existing data.

---

## 🛠️ Tech Stack

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CDN-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Groq](https://img.shields.io/badge/Groq-AI-F55036?style=flat-square)](https://groq.com)

---

## 🤝 Contributing

This is a personal project. Issues and discussions are welcome via [GitHub Issues](https://github.com/Advay254/AdvaySocialSuite/issues).

---

## ⚠️ Disclaimer

This project is provided as-is for personal use and self-hosting. The author is not responsible for misuse or downtime of third-party services.

---

## 📄 License

MIT © 2026 [Advay](https://github.com/Advay254)

---

<div align="center">

![Visitor Count](https://visitor-badge.laobi.icu/badge?page_id=Advay254.AdvaySocialSuite)

⭐ Star this repo if it helped you

<br>

<a href="https://www.buymeacoffee.com/advay254">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;">
</a>

</div>
