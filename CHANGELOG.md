# Changelog

## 1.0.1

### Admin
- The Settings screen has a sticky action bar with Save, Discard and an unsaved changes indicator, visible on every tab on phones and laptops.
- Root cause of the unreachable Save button: the admin scroll area and sidebar were sized to 100vh, which is taller than the visible area on phones, and the Save button sat at the very end of a tall tab inside a card that clips overflow.
- Long text in the AI Chat tab wraps. The full name of the selected model is always shown below the dropdown.

### AI chat
- Reply length is now set in characters (ai_max_chars, 200 to 3000, default 700). An old ai_max_tokens value is carried over automatically (multiplied by three).
- The model is told the limit in plain words at the end of its instructions, the provider token cap is only a safety net, and replies are checked on the server and shortened to the last complete sentence when needed.
- An empty reply caused by a length stop is retried once with a larger cap, then the friendly message from settings is shown.

### Public site
- New look based on the Nova design: warm light palette, black bands, Satoshi type, floating navigation, pill buttons with a rolling label, bento tools, skills marquee, services, about split, quote block, closing call to action and a black footer.
- One look only. The theme switch, dark mode and theme storage were removed from the public site.
- Fonts are self hosted. The Google Fonts links were removed.
- Tool status is shown as a word in a bordered tag. The status dot in the chat header was removed.
- Search and filter tabs on Repos and Tools, inline validation and a clear success state on Collaborate.
- Accent colour default is now #b98b6e. An untouched previous default (#0b7285) is moved once, a colour you chose is kept.
- New text settings with seeded defaults: navigation button, years label, about section, tool status words, open button and message sent text.

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
- New chat icon: a friendly speech bubble mark with a gradient fill, used on the launcher and in the chat header. The eyes blink slowly and stop blinking for visitors who prefer reduced motion.

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
