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

  // ─── Icons (inline SVG, stroke style unless noted) ───────────────────────────
  const P = {
    'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>',
    'arrow-up-right': '<path d="M7 17L17 7M8 7h9v9"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    x: '<path d="M18 6L6 18M6 6l12 12"/>',
    send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>',
    chat: '<path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 15.5-6.2L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.2L3 16M3 21v-5h5"/>',
    compose: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    'chevron-down': '<path d="M6 9l6 6 6-6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>',
    play: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5l5.5 3.5L10 15.5z"/>',
    pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    workflow: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.5 6H14a4 4 0 0 1 4 4v5.5"/>',
    code: '<path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    layers: '<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>',
    zap: '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>',
    plug: '<path d="M9 2v6M15 2v6M6 8h12v4a6 6 0 0 1-12 0V8zM12 18v4"/>',
    github: '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.9a3.4 3.4 0 0 0-.9-2.6c3.1-.3 6.4-1.5 6.4-7A5.4 5.4 0 0 0 20 4.8 5.1 5.1 0 0 0 19.9 1S18.7.7 16 2.5a13.4 13.4 0 0 0-7 0C6.3.7 5.1 1 5.1 1A5.1 5.1 0 0 0 5 4.8a5.4 5.4 0 0 0-1.5 3.8c0 5.4 3.3 6.6 6.4 7a3.4 3.4 0 0 0-.9 2.6V22"/>'
  };
  function icon(name, size) {
    const s = size ? ` width="${size}" height="${size}"` : '';
    return `<svg class="icon"${s} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${P[name] || P.grid}</svg>`;
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

  // Filled brand marks, used for the links in Profile.
  const SOCIALS = [
    { key: 'github_url', label: 'GitHub', path: 'M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.929.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z' },
    { key: 'linkedin_url', label: 'LinkedIn', path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
    { key: 'twitter_url', label: 'X', path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
    { key: 'youtube_url', label: 'YouTube', path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
    { key: 'discord_url', label: 'Discord', path: 'M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.11 18.1.126 18.11a19.904 19.904 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z' },
    { key: 'tiktok_url', label: 'TikTok', path: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z' },
  ];
  function socialLinks(profile, cls) {
    return SOCIALS.map(s => {
      const href = safeUrl(profile && profile[s.key]);
      if (!href) return '';
      return `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer" class="${cls || 'social'}" aria-label="${esc(s.label)}" title="${esc(s.label)}"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="${s.path}"/></svg></a>`;
    }).join('');
  }

  // Neutral placeholder icons. Emoji stored with tools and services are never shown.
  const CATEGORY_ICON = { downloader: 'download', entertainment: 'play', utility: 'link', blog: 'pen', tool: 'wrench' };
  function categoryIcon(cat) { return icon(CATEGORY_ICON[String(cat || '').toLowerCase()] || 'grid'); }
  const SERVICE_ICONS = ['workflow', 'code', 'globe', 'plug', 'layers', 'zap'];
  function serviceIcon(i) { return icon(SERVICE_ICONS[i % SERVICE_ICONS.length]); }

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

  // ─── HTML from Markdown (README files): strip anything that can run script ───
  function sanitizeHtml(html) {
    const tpl = document.createElement('template');
    tpl.innerHTML = String(html || '');
    tpl.content.querySelectorAll('script,style,iframe,object,embed,form,link,meta,base,svg,math').forEach(n => n.remove());
    tpl.content.querySelectorAll('*').forEach(n => {
      Array.from(n.attributes).forEach(a => {
        const name = a.name.toLowerCase();
        const val = a.value.trim().toLowerCase();
        if (name.startsWith('on') || name === 'srcdoc' || name === 'style') n.removeAttribute(a.name);
        else if ((name === 'href' || name === 'src' || name === 'xlink:href') && !/^(https?:|mailto:|#|\/(?!\/))/.test(val)) n.removeAttribute(a.name);
      });
      if (n.tagName === 'A') { n.setAttribute('target', '_blank'); n.setAttribute('rel', 'noopener noreferrer'); }
    });
    return tpl.innerHTML;
  }

  return { chatMark, sanitizeHtml, stripEmoji, esc, text, safeUrl, hostOf, parseJSON, icon, socialLinks, categoryIcon, serviceIcon, computeAccent, applyAccent, btn, toast, reveal, skeletonCards, emptyState, errorState };
})();
