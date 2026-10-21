/* Runs before first paint so the saved accent colour never flashes. Kept as a file so the page needs no inline script. */
(function () {
  try {
    var a = JSON.parse(localStorage.getItem('adv_accent2') || 'null');
    if (a && a.v === 2) {
      var r = document.documentElement.style;
      r.setProperty('--accent', a.a); r.setProperty('--on-accent', a.o);
      r.setProperty('--accent-tint', a.t); r.setProperty('--accent-dark', a.d); r.setProperty('--accent-on-ink', a.i);
    }
  } catch (e) { /* storage blocked: defaults apply */ }
})();
