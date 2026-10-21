/* AdvaySocialSuite 1.0.1 shared UI helpers: text safety, icons, accent colour, buttons, toast, reveal, states. */
const UI = (() => {

  // ─── Text safety ─────────────────────────────────────────────────────────────
  // Stored data may still contain emoji from older versions. They are never displayed.
  const EMOJI_RE = /(?![\u00A9\u00AE\u2122])\p{Extended_Pictographic}[\uFE0F\u20E3]*(?:\u200D\p{Extended_Pictographic}[\uFE0F]*)*|[0-9#*]\uFE0F?\u20E3|\p{Emoji_Presentation}|\uFE0F|[\u{1F3FB}-\u{1F3FF}]/gu;

  function stripEmoji(s) {
    return String(s == null ? '' : s).replace(EMOJI_RE, '').replace(/[ \t]{2,}/g, ' ').trim();
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  // Escaped text with emoji removed. Use for every value that comes from the database.
  function text(s) { return esc(stripEmoji(s)); }

  // Only absolute http(s) links are ever placed in an href. Anything else returns ''.
  function safeUrl(u) {
    try {
      const url = new URL(String(u || '').trim());
      return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
    } catch { return ''; }
  }
  function hostOf(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } }
  function parseJSON(v, fallback) {
    try { const x = typeof v === 'string' ? JSON.parse(v) : v; return x == null ? fallback : x; } catch { return fallback; }
  }

  // ─── Icons come from public/js/icons.js, in the style the owner chose ──────────
  function icon(name, size) {
    if (name === 'github') return Icons.brand('github', { size: size || 18 });
    return Icons.svg(name, { size });
  }

  // ─── Chat mark: friendly speech bubble used by the chat launcher and header ──
  let markN = 0;
  function chatMark(size) {
    const id = 'cm' + (++markN);
    const body = 'M31 6C17.5 6 7 16 7 29C7 41.5 17 51 30 51C33 51 35.5 50.5 38 49.5L45.5 57.5C47 59 49 58 49 56.5L48.6 45.4C54 41 57 35.5 57 29C57 16 46 6 31 6Z';
    return `<svg class="chat-mark" width="${size || 36}" height="${size || 36}" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="${id}a" x1="8" y1="8" x2="56" y2="52" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffd60a"/><stop offset=".42" stop-color="#ff9f1c"/><stop offset=".78" stop-color="#ff5fa8"/><stop offset="1" stop-color="#d36bff"/></linearGradient>
        <radialGradient id="${id}b" cx="22" cy="48" r="26" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity=".98"/><stop offset=".55" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
        <radialGradient id="${id}c" cx="52" cy="54" r="18" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#00d4ff"/><stop offset="1" stop-color="#00d4ff" stop-opacity="0"/></radialGradient>
      </defs>
      <path d="${body}" fill="url(#${id}a)"/><path d="${body}" fill="url(#${id}b)"/><path d="${body}" fill="url(#${id}c)"/>
      <path class="chat-mark__line" d="${body}" fill="none" stroke-width="4.6" stroke-linejoin="round"/>
      <g class="chat-mark__eyes"><ellipse class="chat-mark__ink" cx="25" cy="25" rx="3.3" ry="6.3"/><ellipse class="chat-mark__ink" cx="38" cy="25" rx="3.3" ry="6.3"/></g>
      <path class="chat-mark__line" d="M19.5 37Q31 44.5 43.5 36.5" fill="none" stroke-width="3.6" stroke-linecap="round"/>
    </svg>`;
  }

  // Brand glyphs for the links in Profile (single colour, Simple Icons).
  const SOCIAL_BRANDS = [['github_url', 'github', 'GitHub'], ['linkedin_url', 'linkedin', 'LinkedIn'], ['twitter_url', 'x', 'X'], ['youtube_url', 'youtube', 'YouTube'], ['discord_url', 'discord', 'Discord'], ['tiktok_url', 'tiktok', 'TikTok']];
  function socialLinks(profile, cls) {
    return SOCIAL_BRANDS.map(([field, brand, label]) => {
      const href = safeUrl(profile && profile[field]);
      if (!href) return '';
      return `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer" class="${cls || 'social'}" aria-label="${esc(label)}" title="${esc(label)}">${Icons.brand(brand, { size: 18 })}</a>`;
    }).join('');
  }

  // Neutral defaults for items without an icon, and the item's own icon when it has a valid one.
  function categoryIcon(cat) { return Icons.svg(Icons.categoryDefault(cat)); }
  function serviceIcon(i) { return Icons.svg(Icons.serviceDefault(i)); }
  function iconFor(value, fallback) { return Icons.svg(Icons.has(value) ? value : fallback); }

  // ─── Accent colour ───────────────────────────────────────────────────────────
  // The owner can pick any colour. Everything readable is calculated from it:
  // text on an accent fill, a dark accent for text on cream, a tint, and a light accent for text on black.
  const DEFAULT_ACCENT = '#b98b6e';
  const INK = [22, 22, 22], CREAM = [255, 253, 249], CONTAINER = [238, 232, 223];
  function hexToRgb(hex) {
    const h = String(hex).replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function rgbToHex(c) { return '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
  function lum(c) {
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
  }
  function contrast(a, b) { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); }
  function mix(a, b, t) { return a.map((v, i) => v + (b[i] - v) * t); }
  function toHsl(c) {
    const r = c[0] / 255, g = c[1] / 255, b = c[2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
    if (mx === mn) return [0, 0, l];
    const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    const h = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h / 6, s, l];
  }
  function fromHsl(h, s, l) {
    if (s === 0) return [l * 255, l * 255, l * 255];
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const f = t => { t = (t + 1) % 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; };
    return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
  }
  const HEX_RE = /^#[0-9a-fA-F]{6}$/;
  function computeAccent(hex) {
    if (!HEX_RE.test(String(hex || ''))) return null;
    const a = hexToRgb(hex);
    const isDefault = hex.toLowerCase() === DEFAULT_ACCENT;
    const cInk = contrast(a, INK), cCream = contrast(a, CREAM);
    const onAccent = cInk >= cCream ? '#161616' : '#fffdf9';
    // A mid tone can fail 4.5 to 1 with both black and cream. Nudge the fill just enough so the text on it stays readable.
    let fill = a;
    if (Math.max(cInk, cCream) < 4.5) {
      const textRgb = cInk >= cCream ? INK : CREAM, away = cInk >= cCream ? CREAM : INK;
      for (let i = 1; i <= 20 && contrast(fill, textRgb) < 4.5; i++) fill = mix(a, away, i / 20);
    }
    const tint = isDefault ? '#ead9cc' : rgbToHex(mix(a, CREAM, 0.7));
    // Dark accent for text on cream, container and tint: 7 to 1 against the tint, so it passes everywhere.
    let dark = isDefault ? '#4f3223' : null;
    if (!dark) {
      const [h, s] = toHsl(a);
      const tintRgb = hexToRgb(tint);
      for (let l = 0.26; l >= 0.04; l -= 0.01) {
        const c = fromHsl(h, Math.max(s, 0.3), l);
        dark = rgbToHex(c);
        if (contrast(c, tintRgb) >= 7 && contrast(c, CONTAINER) >= 7) break;
      }
    }
    // Accent for text and lines on black: lighten until 4.5 to 1.
    let onInk = rgbToHex(a);
    for (let i = 0; i <= 20 && contrast(hexToRgb(onInk), INK) < 4.5; i++) onInk = rgbToHex(mix(a, CREAM, (i + 1) / 20));
    return { v: 2, a: rgbToHex(fill), o: onAccent, t: tint, d: dark, i: onInk };
  }
  function applyAccent(hex) {
    const c = computeAccent(hex);
    if (!c) return;
    const r = document.documentElement.style;
    r.setProperty('--accent', c.a);
    r.setProperty('--on-accent', c.o);
    r.setProperty('--accent-tint', c.t);
    r.setProperty('--accent-dark', c.d);
    r.setProperty('--accent-on-ink', c.i);
    try { localStorage.setItem('adv_accent2', JSON.stringify(c)); } catch { /* storage blocked */ }
  }

  // ─── Pill button with the rolling label ──────────────────────────────────────
  // variants: primary, secondary, inverted, inverted-outline. `static` renders a span for use inside a link.
  function btn(o) {
    const label = text(o.label || '');
    if (!label) return '';
    const cls = ['btn', o.variant && o.variant !== 'primary' ? 'btn--' + o.variant : '', o.size === 'sm' ? 'btn--sm' : '', o.block ? 'btn--block' : ''].filter(Boolean).join(' ');
    const inner = `<span class="btn__wrap"><span class="btn__text">${label}</span><span class="btn__text btn__text--hover" aria-hidden="true">${label}</span></span>${o.icon ? icon(o.icon) : ''}`;
    const attrs = o.attrs ? ' ' + o.attrs : '';
    if (o.static) return `<span class="${cls}"${attrs}>${inner}</span>`;
    if (o.tag === 'button') return `<button type="${o.type || 'button'}" class="${cls}"${o.id ? ` id="${o.id}"` : ''}${attrs}>${inner}</button>`;
    return `<a class="${cls}" href="${esc(o.href || '#')}"${o.external ? ' target="_blank" rel="noopener noreferrer"' : ''}${attrs}>${inner}</a>`;
  }

  // ─── Toast (announced to screen readers) ─────────────────────────────────────
  let toastTimer = null;
  function toast(msg, type) {
    let region = document.getElementById('toast-region');
    if (!region) {
      region = document.createElement('div');
      region.id = 'toast-region';
      region.className = 'toast-region';
      region.setAttribute('role', 'status');
      region.setAttribute('aria-live', 'polite');
      region.setAttribute('aria-atomic', 'true');
      document.body.appendChild(region);
    }
    region.textContent = '';
    clearTimeout(toastTimer);
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'toast' + (type === 'error' ? ' toast--error' : '');
      el.textContent = msg;
      region.appendChild(el);
      toastTimer = setTimeout(() => { region.textContent = ''; }, 3200);
    }, 30);
  }

  // ─── Scroll reveal ───────────────────────────────────────────────────────────
  let observer = null;
  function reveal(root) {
    const els = (root || document).querySelectorAll('.reveal');
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('is-visible')); return; }
    document.documentElement.classList.add('js-reveal');
    if (!observer) {
      observer = new IntersectionObserver(entries => {
        entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-visible'); observer.unobserve(en.target); } });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    }
    els.forEach(el => { if (!el.classList.contains('is-visible')) observer.observe(el); });
  }

  // ─── Loading, empty and error states ─────────────────────────────────────────
  function skeletonCards(n, cls) {
    return Array.from({ length: n }, () => `<div class="card skeleton-card ${cls || ''}" aria-hidden="true"><div class="skeleton" style="height:40px;width:40px"></div><div class="skeleton" style="height:16px;width:55%"></div><div class="skeleton" style="height:12px;width:100%"></div><div class="skeleton" style="height:12px;width:70%"></div></div>`).join('');
  }
  function emptyState(title, msg) {
    return `<div class="state"><div class="state__title">${text(title)}</div>${msg ? `<p>${text(msg)}</p>` : ''}</div>`;
  }
  function errorState(title, msg, retryLabel) {
    return `<div class="state" role="alert"><div class="state__title">${text(title)}</div>${msg ? `<p>${text(msg)}</p>` : ''}${retryLabel ? `<button type="button" class="btn btn--secondary" data-action="retry">${icon('refresh')} ${text(retryLabel)}</button>` : ''}</div>`;
  }

  // ─── HTML from Markdown (README files), cleaned with DOMPurify ────────────────────────────
  let purifyReady = false;
  function sanitizeHtml(html) {
    // If the sanitiser is missing, show the text as plain text. Raw markup is never inserted.
    if (typeof DOMPurify === 'undefined') return esc(html).replace(/\n/g, '<br>');
    if (!purifyReady) {
      DOMPurify.addHook('afterSanitizeAttributes', node => {
        if (node.tagName === 'A') { node.setAttribute('target', '_blank'); node.setAttribute('rel', 'noopener noreferrer'); }
      });
      purifyReady = true;
    }
    return DOMPurify.sanitize(String(html || ''), {
      USE_PROFILES: { html: true },
      FORBID_TAGS: ['style', 'form', 'input', 'button', 'textarea', 'select', 'iframe', 'object', 'embed', 'link', 'meta', 'base', 'svg', 'math'],
      FORBID_ATTR: ['style'],
      ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|#|\/(?!\/))/i,
    });
  }

  return { chatMark, iconFor, sanitizeHtml, stripEmoji, esc, text, safeUrl, hostOf, parseJSON, icon, socialLinks, categoryIcon, serviceIcon, computeAccent, applyAccent, btn, toast, reveal, skeletonCards, emptyState, errorState };
})();
