# Changelog

## 1.0.0

### Design
- New design system: one stylesheet with light and dark tokens, a type and spacing scale, and shared components.
- System, Light and Dark theme choice that is remembered and applied before first paint.
- Accent colour is a setting (Settings, General). Contrast safe text and light and dark variants are calculated automatically.
- Rebuilt navbar with a mobile drawer, and a new footer.
- New Home page: hero, real numbers from your data, featured tools, templates, services, philosophy and a call to action.
- Removed the 3D cylinder, the spinning theme rotation and the Bebas Neue and Syne fonts. Tailwind is no longer loaded on the public site.
- Emoji are no longer shown anywhere on the public site. Stored emoji are filtered at display time and replaced with neutral icons.
- Other pages restyled with the new tokens.

### AI chat
- Works with any OpenAI compatible provider. Provider, key, model and chat behaviour are managed in Settings, AI Chat.
- API key stored encrypted, never returned to the browser.
- Model list loading and a test connection button.
- Safe outbound requests: https only, private and metadata addresses refused, pinned connection, no redirects, timeouts and size limits.
- Per visitor daily limit, off switch and owner editable visitor text.
- Answers are grounded in your profile, tools, repositories and templates.
- New chat widget with a reply formatter, copy button, retry, suggestion chips, mobile sheet and keyboard support.
- The Groq SDK dependency was removed. `GROQ_API_KEY` and `GROQ_MODEL` remain as an optional fallback.

### Security
- Public settings endpoint now returns an explicit allowlist only. The webhook URL, AI settings and internal keys are no longer public.
- The general settings endpoint refuses internal and AI keys.
- README previews are sanitised before display.
