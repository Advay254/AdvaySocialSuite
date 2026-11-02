/*
 * AdvaySocialSuite 1.2.0 theme runtime for the public site.
 * Applies the theme the owner chose, shifts between themes on a timer, keeps every visitor in step
 * through the server clock, and offers the optional visitor panel (pause, interval, pin a theme).
 * Colours are registered custom properties (see style.css), so changing them animates smoothly.
 */
const Theme = (() => {
  const T = AdvayTheme;
  const STORE = 'adv_theme_v1', LAST = 'adv_theme_last';
  const root = document.documentElement;
  const reduce = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  let cfg = null, byId = {}, offset = 0, vis = { v: 1 }, timer = null, curId = null, ready = false;
  let chipBtn = null, panel = null, panelOpen = false, panelTrigger = null;

  // ─── Visit state kept in session storage (may be blocked) ───────────────────
  function load() { try { const s = JSON.parse(sessionStorage.getItem(STORE) || 'null'); if (s && s.v === 1) vis = s; } catch (e) { vis = { v: 1 }; } }
  function save(t) {
    vis.v = 1;
    vis.hold = !!(vis.pin || (cfg && (cfg.mode === 'random' || (cfg.mode === 'shift' && !cfg.sync))));
    if (t && vis.hold) { vis.vars = T.cssVars(t); vis.scheme = t.scheme; vis.id = t.id; } else { delete vis.vars; delete vis.scheme; delete vis.id; }
    try { sessionStorage.setItem(STORE, JSON.stringify(vis)); } catch (e) { /* storage blocked */ }
  }
  const now = () => Date.now() + offset;
  const interval = () => (cfg.visitorPanel && vis.interval >= T.LIMITS.minInterval && vis.interval <= T.LIMITS.maxInterval ? vis.interval : cfg.interval);
  const rotation = () => cfg.rotation.filter(id => byId[id]);
  const rotating = () => !reduce() && !vis.pin && cfg.mode === 'shift' && rotation().length > 1;

  // ─── Which theme is showing right now ───────────────────────────────────────
  function currentId() {
    if (cfg.visitorPanel && vis.pin && byId[vis.pin]) return vis.pin;
    const c = { mode: cfg.mode, active: byId[cfg.active] ? cfg.active : T.DEFAULT_ID, rotation: rotation(), interval: interval() };
    return T.pickId(c, now(), { reduced: reduce(), sync: cfg.sync || interval() !== cfg.interval, start: vis.start, randomId: vis.random });
  }

  function apply(id) {
    const t = byId[id] || byId[cfg.active] || byId[T.DEFAULT_ID];
    if (!t) return;
    const changed = curId !== t.id;
    curId = t.id;
    const v = T.cssVars(t);
    Object.keys(v).forEach(k => root.style.setProperty(k, v[k]));
    root.style.setProperty('color-scheme', t.scheme);
    root.setAttribute('data-theme', t.id);
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', t.bg);
    save(t);
    if (ready) { paintUi(); restartRing(); }
    if (changed) document.dispatchEvent(new CustomEvent('theme:changed', { detail: t }));
  }

  // ─── Timer: wake exactly at the next boundary, not on a fixed tick ──────────
  function schedule() {
    clearTimeout(timer);
    if (document.hidden || !rotating()) return;
    const iv = interval();
    const synced = cfg.sync || iv !== cfg.interval;
    const next = T.nextShiftAt(now(), iv, synced ? 0 : vis.start);
    timer = setTimeout(() => { apply(currentId()); schedule(); }, Math.max(50, next - now() + 20));
  }
  function refresh() { apply(currentId()); schedule(); }

  // ─── Progress ring and bar: a CSS animation matched to the timer ────────────
  function phase() {
    const iv = interval(), synced = cfg.sync || iv !== cfg.interval, start = synced ? 0 : vis.start;
    const elapsed = ((now() - start) % (iv * 1000) + iv * 1000) % (iv * 1000);
    return { iv, elapsed: elapsed / 1000 };
  }
  function restartRing() {
    const els = document.querySelectorAll('.ring, .track i');
    const on = rotating() && !document.hidden;
    els.forEach(el => {
      el.classList.remove('run');
      void el.getBoundingClientRect();
      const p = phase();
      el.style.setProperty('--ring-dur', p.iv + 's');
      el.style.setProperty('--ring-delay', '-' + p.elapsed.toFixed(2) + 's');
      el.classList.toggle('is-idle', !rotating());
      if (on) el.classList.add('run');
    });
  }

  // ─── Visitor panel ──────────────────────────────────────────────────────────
  function swatchIds() { return cfg.mode === 'fixed' ? cfg.themes.map(t => t.id) : rotation(); }
  function chipInner() {
    const t = byId[curId] || {};
    return `<svg class="ring-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle class="ring-track" cx="12" cy="12" r="9"/><circle class="ring" cx="12" cy="12" r="9" pathLength="100"/></svg><span class="chip-name">${UI.text(t.name || '')}</span>`;
  }
  function buildUi() {
    if (!cfg.visitorPanel) return;
    const host = document.getElementById('theme-root');
    if (host) {
      host.innerHTML = `<button type="button" class="theme-chip" id="theme-chip" aria-haspopup="dialog" aria-expanded="false" aria-controls="theme-panel"></button>
        <div class="theme-panel" id="theme-panel" role="dialog" aria-label="${UI.esc(UI.S.themeOptions)}" hidden></div>`;
      chipBtn = document.getElementById('theme-chip');
      panel = document.getElementById('theme-panel');
      chipBtn.addEventListener('click', () => togglePanel(chipBtn));
      panel.addEventListener('click', onPanelClick);
      panel.addEventListener('change', onPanelChange);
      panel.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); closePanel(true); } else UI.trapKeys(panel, e); });
      document.addEventListener('click', e => {
        // The path is read from the event, because the chip is repainted while the click is handled.
        const path = e.composedPath();
        if (panelOpen && !path.includes(panel) && !path.some(n => n.classList && n.classList.contains('theme-chip'))) closePanel(false);
      });
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && panelOpen) closePanel(true); });
    }
    paintUi();
  }
  function intervalOptions() {
    const base = [10, 15, 30, 60, 300];
    if (!base.includes(cfg.interval)) base.push(cfg.interval);
    return base.filter(n => n >= T.LIMITS.minInterval && n <= T.LIMITS.maxInterval).sort((a, b) => a - b);
  }
  const fmtSec = n => (n < 60 ? n + ' s' : n < 3600 ? Math.round(n / 60) + ' min' : n < 86400 ? Math.round(n / 3600) + ' h' : Math.round(n / 86400) + ' d');
  function paintUi() {
    if (!cfg || !cfg.visitorPanel) return;
    const t = byId[curId] || {};
    document.querySelectorAll('.theme-chip').forEach(b => {
      b.innerHTML = chipInner();
      b.setAttribute('aria-label', `${UI.S.theme}: ${t.name || ''}. ${UI.S.themeOptions}`);
    });
    if (!panel) return;
    const isShift = cfg.mode === 'shift' && rotation().length > 1;
    const pinned = !!vis.pin;
    const hint = reduce() && cfg.mode !== 'fixed' ? UI.S.reducedMotion : pinned ? UI.S.pinned : UI.S.tapToPin;
    panel.innerHTML = `
      <div class="panel-top">
        <div><div class="label">${UI.text(UI.S.current)}</div><p class="theme-name" aria-live="polite">${UI.text(t.name || '')}</p></div>
        <div class="ctrl">
          ${isShift && !reduce() ? `<button class="icon-btn" type="button" data-act="toggle" aria-label="${UI.esc(pinned ? UI.S.play : UI.S.pause)}" aria-pressed="${pinned}">${UI.icon(pinned ? 'play' : 'pause', 18)}</button>
          <label><span class="sr-only">${UI.text(UI.S.interval)}</span><select class="select" data-act="interval" aria-label="${UI.esc(UI.S.interval)}">${intervalOptions().map(n => `<option value="${n}"${n === interval() ? ' selected' : ''}>${fmtSec(n)}</option>`).join('')}</select></label>` : ''}
          ${pinned && !isShift ? `<button class="btn btn--secondary btn--sm" type="button" data-act="toggle"><span class="btn__label">${UI.text(UI.S.backToSite)}</span></button>` : ''}
        </div>
      </div>
      ${isShift && !reduce() ? '<div class="track" aria-hidden="true"><i></i></div>' : ''}
      <p class="hint">${UI.text(hint)}</p>
      <div class="swatches" role="group" aria-label="${UI.esc(UI.S.theme)}">${swatchIds().map(id => { const s = byId[id]; return s ? `<button type="button" class="swatch" data-id="${UI.esc(s.id)}" aria-pressed="${s.id === curId}" style="background:${s.bg};color:${s.text}"><span class="n">${UI.text(s.name)}</span><span class="dots"><span style="background:${s.s2}"></span><span style="background:${s.accent}"></span><span style="background:${s.accent2}"></span></span></button>` : ''; }).join('')}</div>`;
    restartRing();
  }
  function togglePanel(trigger) { if (panelOpen) closePanel(true); else openPanel(trigger); }
  function openPanel(trigger) {
    if (!panel) return;
    panelTrigger = trigger || chipBtn; panelOpen = true;
    paintUi(); panel.hidden = false;
    document.querySelectorAll('.theme-chip').forEach(b => b.setAttribute('aria-expanded', 'true'));
    const first = panel.querySelector('button, select'); if (first) first.focus();
  }
  function closePanel(restore) {
    if (!panel || !panelOpen) return;
    panelOpen = false; panel.hidden = true;
    document.querySelectorAll('.theme-chip').forEach(b => b.setAttribute('aria-expanded', 'false'));
    if (restore && panelTrigger) panelTrigger.focus();
  }
  function onPanelClick(e) {
    const sw = e.target.closest('.swatch');
    if (sw) { vis.pin = sw.dataset.id; apply(vis.pin); schedule(); return; }
    const tg = e.target.closest('[data-act="toggle"]');
    if (tg) {
      if (vis.pin) delete vis.pin; else vis.pin = curId;
      refresh();
      const again = panel.querySelector('[data-act="toggle"]'); if (again) again.focus();
    }
  }
  function onPanelChange(e) {
    if (e.target.dataset.act === 'interval') {
      const n = parseInt(e.target.value, 10);
      if (n >= T.LIMITS.minInterval && n <= T.LIMITS.maxInterval) { vis.interval = n; refresh(); const s = panel.querySelector('[data-act="interval"]'); if (s) s.focus(); }
    }
  }
  // A chip for the menu. It opens the same panel.
  function mountMenu(el) {
    if (!el) return;
    if (!cfg || !cfg.visitorPanel) { el.innerHTML = ''; return; }
    el.innerHTML = '<button type="button" class="theme-chip theme-chip--menu" aria-haspopup="dialog" aria-expanded="false" aria-controls="theme-panel"></button>';
    const b = el.firstChild;
    b.addEventListener('click', () => togglePanel(b));
    paintUi();
  }

  // ─── Start ──────────────────────────────────────────────────────────────────
  async function init() {
    load();
    const t0 = Date.now();
    try {
      const res = await fetch('/api/theme');
      if (!res.ok) throw new Error('theme');
      cfg = await res.json();
      // The server clock was read about halfway through the request.
      offset = cfg.now - (t0 + Date.now()) / 2;
    } catch (e) { return; }   // the server painted a theme already, and it stays
    cfg.themes.forEach(t => { byId[t.id] = t; });
    if (!vis.start) vis.start = Date.now();
    if (cfg.mode === 'random' && !(vis.random && byId[vis.random])) {
      let last = null; try { last = localStorage.getItem(LAST); } catch (e) { /* storage blocked */ }
      const painted = root.getAttribute('data-theme');
      vis.random = painted && painted !== last && rotation().includes(painted) ? painted : T.randomPick(rotation(), last);
      try { localStorage.setItem(LAST, vis.random); } catch (e) { /* storage blocked */ }
    }
    if (!cfg.visitorPanel) { delete vis.pin; delete vis.interval; }
    apply(currentId());
    ready = true;
    buildUi();
    schedule();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { clearTimeout(timer); document.querySelectorAll('.ring, .track i').forEach(el => el.classList.remove('run')); }
      else refresh();
    });
  }

  return { init, mountMenu, openPanel, current: () => byId[curId] || null, get config() { return cfg; } };
})();
