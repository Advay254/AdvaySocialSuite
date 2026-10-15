/* AdvaySocialSuite 1.0.0 shared UI helpers: text safety, icons, theme, accent, toast, reveal, states. */
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
  // Move colour toward `target` until it reaches AA contrast (4.5) against `bg`.
  function fitContrast(color, target, bg) {
    let c = color;
    for (let i = 0; i <= 20 && contrast(c, bg) < 4.5; i++) c = mix(color, target, (i + 1) / 20);
    return c;
  }
  const HEX_RE = /^#[0-9a-fA-F]{6}$/;
  function computeAccent(hex) {
    if (!HEX_RE.test(String(hex || ''))) return null;
    const a = hexToRgb(hex);
    const onAccent = contrast(a, [255, 255, 255]) >= contrast(a, [0, 0, 0]) ? '#ffffff' : '#000000';
    return {
      a: rgbToHex(a),
      o: onAccent,
      l: rgbToHex(fitContrast(a, [0, 0, 0], hexToRgb('#f0f2f5'))),
      d: rgbToHex(fitContrast(a, [255, 255, 255], hexToRgb('#1a2027'))),
    };
  }
  function applyAccent(hex) {
    const c = computeAccent(hex);
    if (!c) return;
    const r = document.documentElement.style;
    r.setProperty('--accent', c.a);
    r.setProperty('--on-accent', c.o);
    r.setProperty('--accent-fg-light', c.l);
    r.setProperty('--accent-fg-dark', c.d);
    try { localStorage.setItem('adv_accent', JSON.stringify(c)); } catch { /* storage blocked */ }
  }

  // ─── Theme: system, light, dark ──────────────────────────────────────────────
  const theme = (() => {
    const KEY = 'adv_theme';
    function get() { try { const v = localStorage.getItem(KEY); return v === 'light' || v === 'dark' ? v : 'system'; } catch { return 'system'; } }
    function apply(pref) {
      const r = document.documentElement;
      if (pref === 'light' || pref === 'dark') r.setAttribute('data-theme', pref); else r.removeAttribute('data-theme');
      document.querySelectorAll('[data-theme-pref]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.themePref === pref)));
    }
    function set(pref) {
      try { if (pref === 'system') localStorage.removeItem(KEY); else localStorage.setItem(KEY, pref); } catch { /* storage blocked */ }
      apply(pref);
    }
    function switchHtml() {
      const cur = get();
      const b = (pref, ic, label) => `<button type="button" data-theme-pref="${pref}" aria-pressed="${cur === pref}" aria-label="${label}" title="${label}">${icon(ic)}</button>`;
      return `<div class="theme-switch" role="group" aria-label="Theme">${b('system', 'monitor', 'System theme')}${b('light', 'sun', 'Light theme')}${b('dark', 'moon', 'Dark theme')}</div>`;
    }
    document.addEventListener('click', e => {
      const btn = e.target.closest && e.target.closest('[data-theme-pref]');
      if (btn) set(btn.dataset.themePref);
    });
    return { get, set, apply, switchHtml };
  })();

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

  return { sanitizeHtml, stripEmoji, esc, text, safeUrl, hostOf, parseJSON, icon, socialLinks, categoryIcon, serviceIcon, computeAccent, applyAccent, theme, toast, reveal, skeletonCards, emptyState, errorState };
})();
