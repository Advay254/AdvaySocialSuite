/*
 * Runs before first paint, as a file so the page needs no inline script.
 * The server already paints the theme that is active right now. This only matters when the visitor
 * pinned a theme for this visit, or when the site is set to follow each visitor's own timer or to a
 * random theme per visit: then the theme this browser was showing is put back before anything is drawn.
 * It also removes the colour a version before 1.2.0 stored in this browser.
 */
(function () {
  try { localStorage.removeItem('adv_accent2'); } catch (e) { /* storage blocked */ }
  try {
    var s = JSON.parse(sessionStorage.getItem('adv_theme_v1') || 'null');
    if (!s || s.v !== 1 || !s.hold || !s.vars || typeof s.vars !== 'object') return;
    var hex = /^#[0-9a-f]{6}$/;
    var keys = ['--bg', '--s1', '--s2', '--text', '--muted', '--accent', '--ink', '--accent2', '--accent-t', '--accent2-t', '--on-ink', '--ink2'];
    for (var i = 0; i < keys.length; i++) if (!hex.test(String(s.vars[keys[i]]))) return;
    var r = document.documentElement;
    for (var j = 0; j < keys.length; j++) r.style.setProperty(keys[j], s.vars[keys[j]]);
    if (s.scheme === 'dark' || s.scheme === 'light') r.style.setProperty('color-scheme', s.scheme);
    if (/^[A-Za-z0-9_]{1,16}$/.test(String(s.id))) r.setAttribute('data-theme', s.id);
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', s.vars['--bg']);
  } catch (e) { /* storage blocked: the server colours apply */ }
})();
