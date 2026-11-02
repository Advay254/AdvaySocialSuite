/* AdvaySocialSuite 1.2.0 shared UI helpers: text safety, icons, links, buttons, toast, copy, reveal, states. */
const UI = (() => {

  // Functional interface wording that is not content. Everything the owner can edit comes from settings.
  const S = {
    menu: 'Menu', openMenu: 'Open menu', closeMenu: 'Close menu', search: 'Search', searchPlaceholder: 'Search pages and tools',
    noResults: 'Nothing matches that search.', loadMore: 'Load more', all: 'All', copyLink: 'Copy link', copied: 'Copied',
    copyFail: 'Could not copy. Select the text and copy it by hand.', retry: 'Try again', loadFail: 'This page did not load.',
    checkConnection: 'Check your connection, then try again.', notFound: 'This page does not exist.', notFoundText: 'The address may be wrong, or the page may have moved.',
    home: 'Back to the home page', theme: 'Theme', themeOptions: 'Theme options', pause: 'Pause rotation', play: 'Resume rotation',
    interval: 'Seconds between theme changes', tapToPin: 'Tap a theme to pin it for this visit.', pinned: 'Pinned for this visit.',
    reducedMotion: 'Rotation is off because your device prefers reduced motion.', backToSite: 'Use the site theme', current: 'Current theme',
    openChat: 'Open chat', copyEmail: 'Copy email address', pages: 'Pages', tools: 'Tools', actions: 'Actions', hireMe: 'Hire me',
  };

  // ─── Text safety ─────────────────────────────────────────────────────────────
  // Stored data may still contain emoji from older versions. They are never displayed.
  const EMOJI_RE = /(?![\u00A9\u00AE\u2122])\p{Extended_Pictographic}[\uFE0F\u20E3]*(?:\u200D\p{Extended_Pictographic}[\uFE0F]*)*|[0-9#*]\uFE0F?\u20E3|\p{Emoji_Presentation}|\uFE0F|[\u{1F3FB}-\u{1F3FF}]/gu;

  function stripEmoji(s) { return String(s == null ? '' : s).replace(EMOJI_RE, '').replace(/[ \t]{2,}/g, ' ').trim(); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  // Escaped text with emoji removed. Use for every value that comes from the database.
  function text(s) { return esc(stripEmoji(s)); }
  // Escaped text where line breaks stay line breaks.
  function para(s) { return text(s).replace(/\r?\n/g, '<br>'); }

  function safeUrl(u) {
    try { const url = new URL(String(u || '').trim()); return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : ''; } catch { return ''; }
  }
  function hostOf(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } }
  function parseJSON(v, fallback) { try { const x = typeof v === 'string' ? JSON.parse(v) : v; return x == null ? fallback : x; } catch { return fallback; } }
  const reduced = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // A link from settings: a path inside the site (/collab, or the old #/collab) or a full web address.
  function resolveLink(value) {
    const v = String(value || '').trim();
    const m = v.match(/^#?(\/[a-z]*)$/i);
    if (m) return { href: m[1], external: false };
    const u = safeUrl(v);
    return u ? { href: u, external: true } : null;
  }

  // The page heading style: text followed by a coloured full stop.
  function stop(label, cls) { return `${text(label).replace(/[.]+$/, '')}<span class="dot${cls ? ' ' + cls : ''}">.</span>`; }

  // ─── Icons come from public/js/icons.js, in the style the owner chose ──────────
  function icon(name, size) { return name === 'github' ? Icons.brand('github', { size: size || 18 }) : Icons.svg(name, { size }); }

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

  const SOCIAL_BRANDS = [['github_url', 'github', 'GitHub'], ['linkedin_url', 'linkedin', 'LinkedIn'], ['twitter_url', 'x', 'X'], ['youtube_url', 'youtube', 'YouTube'], ['discord_url', 'discord', 'Discord'], ['tiktok_url', 'tiktok', 'TikTok']];
  function socialList(profile) {
    return SOCIAL_BRANDS.map(([field, brand, label]) => ({ href: safeUrl(profile && profile[field]), brand, label })).filter(s => s.href);
  }
  function socialLinks(profile, cls) {
    return socialList(profile).map(s => `<a href="${esc(s.href)}" target="_blank" rel="noopener noreferrer" class="${cls || 'social'}" aria-label="${esc(s.label)}" title="${esc(s.label)}">${Icons.brand(s.brand, { size: 18 })}</a>`).join('');
  }
  function categoryIcon(cat) { return Icons.svg(Icons.categoryDefault(cat)); }
  function serviceIcon(i) { return Icons.svg(Icons.serviceDefault(i)); }
  function iconFor(value, fallback, size) { return Icons.svg(Icons.has(value) ? value : fallback, { size }); }

  // ─── Buttons: pill, colour sweep, press feedback, ripple, busy spinner ───────
  // variants: primary, secondary. `static` renders a span for use inside a link.
  function btn(o) {
    const label = text(o.label || '');
    if (!label) return '';
    const cls = ['btn', 'btn--' + (o.variant || 'primary'), o.size === 'sm' ? 'btn--sm' : '', o.block ? 'btn--block' : '', o.cls || ''].filter(Boolean).join(' ');
    const inner = `<span class="btn__label">${label}</span>${o.icon ? `<span class="btn__icon">${icon(o.icon)}</span>` : ''}`;
    const attrs = o.attrs ? ' ' + o.attrs : '';
    if (o.static) return `<span class="${cls}"${attrs}>${inner}</span>`;
    if (o.tag === 'button') return `<button type="${o.type || 'button'}" class="${cls}"${o.id ? ` id="${o.id}"` : ''}${attrs}>${inner}</button>`;
    return `<a class="${cls}" href="${esc(o.href || '/')}"${o.external ? ' target="_blank" rel="noopener noreferrer"' : ''}${attrs}>${inner}</a>`;
  }
  // Shows a spinner in a button while its action waits.
  function busy(el, on, label) {
    if (!el) return;
    el.classList.toggle('is-busy', !!on);
    el.disabled = !!on;
    if (on) el.setAttribute('aria-busy', 'true'); else el.removeAttribute('aria-busy');
    if (label != null) { const l = el.querySelector('.btn__label'); if (l) l.textContent = label; }
  }
  // Ripples on primary buttons, on hover and on tap.
  function ripple(b, x, y) {
    if (!b || b.disabled || reduced()) return;
    const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2;
    const s = document.createElement('span');
    s.className = 'ripple';
    s.style.cssText = `width:${d}px;height:${d}px;left:${x - r.left - d / 2}px;top:${y - r.top - d / 2}px`;
    b.appendChild(s);
    s.addEventListener('animationend', () => s.remove(), { once: true });
  }
  document.addEventListener('pointerdown', e => { const b = e.target.closest && e.target.closest('.btn--primary'); if (b) ripple(b, e.clientX, e.clientY); }, true);
  document.addEventListener('pointerover', e => {
    if (e.pointerType === 'touch') return;
    const b = e.target.closest && e.target.closest('.btn--primary');
    if (b && !b.contains(e.relatedTarget)) ripple(b, e.clientX, e.clientY);
  }, true);

  // ─── Toast (announced to screen readers) ─────────────────────────────────────
  let toastTimer = null;
  function toast(msg, type) {
    let region = document.getElementById('toast-region');
    if (!region) {
      region = document.createElement('div');
      region.id = 'toast-region'; region.className = 'toast-region';
      region.setAttribute('role', 'status'); region.setAttribute('aria-live', 'polite'); region.setAttribute('aria-atomic', 'true');
      document.body.appendChild(region);
    }
    region.textContent = '';
    clearTimeout(toastTimer);
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'toast' + (type === 'error' ? ' toast--error' : '');
      el.innerHTML = `<span class="toast__icon">${icon(type === 'error' ? 'alert' : 'check', 18)}</span><span></span>`;
      el.lastChild.textContent = msg;
      region.appendChild(el);
      toastTimer = setTimeout(() => { region.textContent = ''; }, 3200);
    }, 30);
  }

  // ─── Copy with feedback: a checkmark that draws itself on the button, and a toast ──
  async function copy(value, btnEl) {
    let ok = false;
    try { await navigator.clipboard.writeText(value); ok = true; }
    catch {
      try {
        const ta = document.createElement('textarea'); ta.value = value; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0;top:0';
        document.body.appendChild(ta); ta.select(); ok = document.execCommand('copy'); ta.remove();
      } catch { ok = false; }
    }
    if (ok) {
      toast(S.copied);
      if (btnEl && !btnEl.classList.contains('is-copied')) {
        const prev = btnEl.innerHTML;
        btnEl.classList.add('is-copied');
        btnEl.innerHTML = '<svg class="icon icon--draw" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
        setTimeout(() => { btnEl.classList.remove('is-copied'); btnEl.innerHTML = prev; }, 1600);
      }
    } else toast(S.copyFail, 'error');
    return ok;
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-copy]');
    if (b) { e.preventDefault(); copy(b.getAttribute('data-copy'), b); }
  });

  // ─── Scroll reveal: sections fade in once ────────────────────────────────────
  let observer = null;
  function reveal(root) {
    const els = (root || document).querySelectorAll('.reveal');
    if (reduced() || !('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('is-visible')); return; }
    document.documentElement.classList.add('js-reveal');
    if (!observer) {
      observer = new IntersectionObserver(entries => {
        entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-visible'); observer.unobserve(en.target); } });
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0.04 });
    }
    els.forEach(el => { if (!el.classList.contains('is-visible')) observer.observe(el); });
  }

  // Big numbers count up once when they first come into view.
  let countObs = null;
  function countUp(root) {
    const els = (root || document).querySelectorAll('[data-count]');
    const run = el => {
      const to = Number(el.dataset.count) || 0;
      if (reduced() || to < 2) { el.textContent = String(to); return; }
      const t0 = performance.now(), dur = 900;
      const step = now => {
        const p = Math.min(1, (now - t0) / dur);
        el.textContent = String(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1 && !document.hidden) requestAnimationFrame(step); else el.textContent = String(to);
      };
      requestAnimationFrame(step);
    };
    if (!('IntersectionObserver' in window)) { els.forEach(run); return; }
    if (!countObs) countObs = new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) { countObs.unobserve(en.target); run(en.target); } }), { threshold: 0.4 });
    els.forEach(el => { if (!el.dataset.counted) { el.dataset.counted = '1'; countObs.observe(el); } });
  }

  // ─── Loading, empty and error states ─────────────────────────────────────────
  function skeletonCards(n, cls) {
    return Array.from({ length: n }, () => `<div class="card skeleton-card ${cls || ''}" aria-hidden="true"><div class="skeleton" style="height:96px"></div><div class="skeleton" style="height:18px;width:55%"></div><div class="skeleton" style="height:12px;width:100%"></div><div class="skeleton" style="height:12px;width:70%"></div></div>`).join('');
  }
  function emptyState(title, msg) { return `<div class="state"><div class="state__title">${text(title)}</div>${msg ? `<p>${text(msg)}</p>` : ''}</div>`; }
  function errorState(title, msg, retryLabel) {
    return `<div class="state" role="alert"><div class="state__title">${text(title)}</div>${msg ? `<p>${text(msg)}</p>` : ''}${retryLabel ? `<button type="button" class="btn btn--secondary" data-action="retry"><span class="btn__label">${text(retryLabel)}</span><span class="btn__icon">${icon('refresh')}</span></button>` : ''}</div>`;
  }

  // The top of every inner page: bracketed eyebrow, one big heading with a coloured full stop, short intro.
  function head(eyebrow, title, sub) {
    return `<div class="page-head">
      ${eyebrow ? `<p class="eyebrow">( ${text(eyebrow)} )</p>` : ''}
      <h1>${stop(title)}</h1>
      ${sub ? `<p class="lead">${text(sub)}</p>` : ''}
    </div>`;
  }
  // A section heading inside a page.
  function sectionHead(eyebrow, title, sub, action) {
    return `<div class="section-head reveal${action ? ' section-head--row' : ''}">
      <div>
      ${eyebrow ? `<p class="eyebrow">( ${text(eyebrow)} )</p>` : ''}
      <h2>${stop(title, 'dot--2')}</h2>
      ${sub ? `<p class="sub">${text(sub)}</p>` : ''}
      </div>${action || ''}
    </div>`;
  }
  // The round arrow button in the corner of a card. The arrow moves on hover.
  function goButton(href, label, external, decorative) {
    return `<a class="go" href="${esc(href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''} aria-label="${esc(label)}"${decorative ? ' tabindex="-1" aria-hidden="true"' : ''}>${icon('arrow-up-right', 18)}</a>`;
  }
  // The Load more button: shows how many are left.
  function moreButton(left) {
    return left > 0 ? `<div class="more-row"><button type="button" class="btn btn--secondary" data-more><span class="btn__label">${text(S.loadMore)} (${left})</span></button></div>` : '';
  }
  // Horizontally scrolling filter chips.
  function chips(items, active) {
    return `<div class="chips" role="group">${items.map(([v, label]) => `<button type="button" class="chip" data-chip="${esc(v)}" aria-pressed="${v === active}">${text(label)}</button>`).join('')}</div>`;
  }
  function searchBox(id, label, placeholder) {
    return `<div class="search">${icon('search', 18)}<label class="sr-only" for="${id}">${text(label)}</label><input type="search" id="${id}" class="input" placeholder="${esc(placeholder || label)}" autocomplete="off"></div>`;
  }

  // Stacked, solid coloured feature cards with big faint numerals. They take their colours from the active theme.
  function featureCards(items, cls) {
    return `<div class="features${cls ? ' ' + cls : ''}">${items.map((it, i) => `<article class="feature feature--${i % 4} reveal">
      <span class="num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
      <span class="icon-badge">${iconFor(it.icon, Icons.serviceDefault(i), 26)}</span>
      <h3>${text(it.title)}</h3>
      ${it.desc ? `<p>${text(it.desc)}</p>` : ''}
    </article>`).join('')}</div>`;
  }
  // Questions and answers with the round plus. Answers are plain text, never HTML.
  function accordion(items, openFirst) {
    return items.map((it, i) => `<details class="qa"${openFirst && i === 0 ? ' open' : ''}>
      <summary><span>${text(it.q)}</span><span class="plus" aria-hidden="true">${icon('plus', 16)}</span></summary>
      <p>${para(it.a)}</p>
    </details>`).join('');
  }

  // Focus trap for dialogs.
  function trapKeys(container, e) {
    if (e.key !== 'Tab') return;
    const f = Array.from(container.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter(el => !el.disabled && !el.hidden && el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  // ─── HTML from Markdown (README files), cleaned with DOMPurify ───────────────
  let purifyReady = false;
  function sanitizeHtml(html) {
    if (typeof DOMPurify === 'undefined') return esc(html).replace(/\n/g, '<br>');
    if (!purifyReady) {
      DOMPurify.addHook('afterSanitizeAttributes', node => { if (node.tagName === 'A') { node.setAttribute('target', '_blank'); node.setAttribute('rel', 'noopener noreferrer'); } });
      purifyReady = true;
    }
    return DOMPurify.sanitize(String(html || ''), {
      USE_PROFILES: { html: true },
      FORBID_TAGS: ['style', 'form', 'input', 'button', 'textarea', 'select', 'iframe', 'object', 'embed', 'link', 'meta', 'base', 'svg', 'math'],
      FORBID_ATTR: ['style'],
      ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|#|\/(?!\/))/i,
    });
  }

  return { featureCards, accordion, head, sectionHead, goButton, moreButton, chips, searchBox, S, chatMark, iconFor, sanitizeHtml, stripEmoji, esc, text, para, stop, safeUrl, hostOf, parseJSON, reduced, resolveLink, icon, socialLinks, socialList, categoryIcon, serviceIcon, btn, busy, toast, copy, reveal, countUp, skeletonCards, emptyState, errorState, trapKeys };
})();
