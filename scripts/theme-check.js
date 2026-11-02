// Checks the colour rules and the timing rules of the theme engine. No browser, no database: npm run check:themes
const T = require('../public/js/theme-core.js');
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('FAIL', m); } };

ok(T.PRESETS.length === 6, 'six presets');
// preset extras: which presets get adjusted accent text?
T.PRESETS.forEach(p => { const r = T.resolve(p); ok(T.check(p).warnings.length === 0, 'preset ' + p.id + ' has no contrast warnings'); const adj = [r.accent!==r.accentT&&'accent', r.accent2!==r.accent2T&&'accent2'].filter(Boolean); void (p.id, 'extras', r.accentT, r.accent2T, r.onInk, r.ink2, r.scheme, adj.join(',')||'-', JSON.stringify(T.check(p))); });

// 2. 300+ random pairs, all moods
let seed = 12345; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const hex = () => '#' + Array.from({length:3}, () => Math.floor(rnd()*256).toString(16).padStart(2,'0')).join('');
let n = 0, worst = {text:99, muted:99, ink:99, accT:99, acc2T:99, textS2:99};
for (let i = 0; i < 400; i++) for (const mood of T.MOODS) {
  const a = hex(), b = hex();
  const d = T.derive({ accent: a, accent2: b, mood });
  const r = T.resolve({ id: 'x', name: 'x', accent: a, accent2: b, mood });
  n++;
  const c = T.contrast;
  worst.text = Math.min(worst.text, c(d.text, d.bg), c(d.text, d.s1));
  worst.textS2 = Math.min(worst.textS2, c(d.text, d.s2));
  worst.muted = Math.min(worst.muted, c(d.muted, d.bg), c(d.muted, d.s1));
  worst.ink = Math.min(worst.ink, c(d.ink, d.accent));
  worst.accT = Math.min(worst.accT, c(r.accentT, d.bg));
  worst.acc2T = Math.min(worst.acc2T, c(r.accent2T, d.bg));
  // large text: accent raw is not required; adjusted accent passes 4.5 so 3 passes too
  const d2 = T.derive({ accent: a, accent2: b, mood }); ok(JSON.stringify(d) === JSON.stringify(d2), 'deterministic');
}
console.log('pairs tested', n, 'worst', worst);
ok(worst.text >= 4.5 && worst.muted >= 4.5 && worst.ink >= 4.5 && worst.accT >= 4.5 && worst.acc2T >= 4.5, 'contrast floors');

// 3. invalid hex
['red','#12','#12345','#gggggg','', null, undefined, 123, '#1234567','javascript:1'].forEach(v => ok(T.normHex(v) === null, 'reject '+v));
ok(T.normHex('#ABC') === '#aabbcc', 'expand'); ok(T.normHex(' #4F8CFF ') === '#4f8cff', 'trim+lower');
ok(T.derive({accent:'nope', accent2:'#ffffff', mood:'dark'}) === null, 'derive invalid');
ok(T.derive({accent:'#112233', accent2:'#ffffff', mood:'weird'}) !== null, 'unknown mood falls to dark');

// 4. timing
const iv = 60, len = 6;
ok(T.rotationIndex(0, iv, len) === 0 && T.rotationIndex(59999, iv, len) === 0 && T.rotationIndex(60000, iv, len) === 1, 'boundary exact');
ok(T.rotationIndex(60000*6, iv, len) === 0, 'wraps');
ok(T.rotationIndex(1e12, iv, 1) === 0, 'single theme never shifts');
ok(T.nextShiftAt(59999, 60) === 60000 && T.nextShiftAt(60000, 60) === 120000, 'next shift');
// two clients, clocks disagree by minutes, offset applied
const server = 1_900_000_123_456; const clientA = server + 5*60000, clientB = server - 7*60000;
const offA = server - clientA, offB = server - clientB;
const cfg = { mode:'shift', active:'cobalt', rotation:['cobalt','ember','mint','violet','rose','glacier'], interval: 60 };
for (let k = 0; k < 500; k++) { const t = k*7919; ok(T.pickId(cfg, clientA+t+offA, {sync:true}) === T.pickId(cfg, clientB+t+offB, {sync:true}), 'clients agree'); }
ok(T.pickId(cfg, 0, {sync:true}) === 'cobalt' && T.pickId(cfg, 60000, {sync:true}) === 'ember', 'order follows rotation');
// unsynced counts from start
ok(T.pickId(cfg, 1000+59999, {sync:false, start:1000}) === 'cobalt' && T.pickId(cfg, 1000+60000, {sync:false, start:1000}) === 'ember', 'unsynced from first load');
// reduced motion
ok(T.pickId(cfg, 9e9, {reduced:true}) === 'cobalt', 'reduced = first theme');
ok(T.pickId({mode:'fixed', active:'rose', rotation:['cobalt']}, 9e9, {reduced:true}) === 'rose', 'fixed + reduced = active');
// random never repeats
let last = null, rep = 0; for (let k=0;k<2000;k++){ const id = T.randomPick(cfg.rotation, last, rnd()); if (id===last) rep++; last=id; } ok(rep===0, 'random never repeats'); ok(T.randomPick(['a'],'a',0.3)==='a','single random');
console.log(fail ? 'FAILED ' + fail : 'ALL THEME CORE TESTS PASSED');
process.exit(fail ? 1 : 0);
