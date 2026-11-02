/*
 * AdvaySocialSuite 1.2.0 admin: Home page editors (sections, rotating words, typing phrases)
 * and the FAQ editor. Each editor works on a hidden textarea that is part of the normal settings form,
 * so the one Save button saves it and the server checks it.
 */
(function () {
  'use strict';
  if (typeof Admin === 'undefined' || !Admin.ext) return;
  const ext = Admin.ext, esc = ext.esc;
  const $ = id => document.getElementById(id);
  const SECTION_NAMES = { hero: 'Introduction', metrics: 'Numbers', tools: 'Featured tools', services: 'What I build', templates: 'Templates', about: 'About card', faq: 'Questions', cta: 'Closing call to action' };
  const ORDER = Object.keys(SECTION_NAMES);

  const read = (id, fb) => { try { const v = JSON.parse($(id).value || 'null'); return v == null ? fb : v; } catch { return fb; } };
  const write = (id, v) => { $(id).value = JSON.stringify(v); ext.markDirty(); };

  // Simple list of short texts: add, edit, remove, move.
  function textList(hostId, areaId, o) {
    const host = $(hostId); if (!host) return;
    let items = read(areaId, []).filter(x => typeof x === 'string').slice(0, o.max);
    const draw = () => {
      host.innerHTML = `<div class="he-list">${items.map((t, i) => `<div class="he-row" data-i="${i}"><input class="a-input" maxlength="${o.len}" value="${esc(t)}" aria-label="${o.noun} ${i + 1}" data-f="t"><button type="button" class="btn-a-ghost" data-act="up"${i === 0 ? ' disabled' : ''}>Up</button><button type="button" class="btn-a-ghost" data-act="down"${i === items.length - 1 ? ' disabled' : ''}>Down</button><button type="button" class="btn-a-danger" data-act="rm">Remove</button></div>`).join('')}</div>${items.length < o.max ? `<button type="button" class="btn-a-ghost" data-act="add">Add ${o.noun.toLowerCase()}</button>` : ''}<p class="hint-s">${o.hint}</p>`;
    };
    if (!host.dataset.bound) {
      host.dataset.bound = '1';
      host.addEventListener('input', e => { const r = e.target.closest('[data-i]'); if (r && e.target.dataset.f === 't') { items[Number(r.dataset.i)] = e.target.value; write(areaId, items); } });
      host.addEventListener('click', e => {
        const b = e.target.closest('[data-act]'); if (!b) return; const r = b.closest('[data-i]'), i = r ? Number(r.dataset.i) : -1;
        if (b.dataset.act === 'add' && items.length < o.max) items.push('');
        else if (b.dataset.act === 'rm') items.splice(i, 1);
        else if (b.dataset.act === 'up' && i > 0) [items[i - 1], items[i]] = [items[i], items[i - 1]];
        else if (b.dataset.act === 'down' && i < items.length - 1) [items[i + 1], items[i]] = [items[i], items[i + 1]];
        write(areaId, items); draw();
        if (b.dataset.act === 'add') { const last = host.querySelector('.he-row:last-child input'); if (last) last.focus(); }
      });
    }
    host._reset = () => { items = read(areaId, []).filter(x => typeof x === 'string').slice(0, o.max); draw(); };
    draw();
  }

  function sections() {
    const host = $('he-sections'); if (!host) return;
    let items = read('s-home_sections', []).filter(s => s && ORDER.includes(s.id));
    ORDER.forEach(id => { if (!items.some(s => s.id === id)) items.push({ id, on: true }); });
    const draw = () => {
      host.innerHTML = items.map((s, i) => `<div class="he-sec" data-i="${i}"><span class="n">${esc(SECTION_NAMES[s.id])}</span>
        <label><input type="checkbox" data-act="on" ${s.on !== false ? 'checked' : ''} ${s.id === 'hero' ? 'disabled' : ''} aria-label="Show ${esc(SECTION_NAMES[s.id])}"> Show</label>
        <button type="button" class="btn-a-ghost" data-act="up"${i === 0 ? ' disabled' : ''}>Up</button><button type="button" class="btn-a-ghost" data-act="down"${i === items.length - 1 ? ' disabled' : ''}>Down</button></div>`).join('');
    };
    if (!host.dataset.bound) {
      host.dataset.bound = '1';
      host.addEventListener('click', e => {
        const b = e.target.closest('button[data-act]'); if (!b) return; const i = Number(b.closest('[data-i]').dataset.i);
        if (b.dataset.act === 'up' && i > 0) [items[i - 1], items[i]] = [items[i], items[i - 1]];
        else if (b.dataset.act === 'down' && i < items.length - 1) [items[i + 1], items[i]] = [items[i], items[i + 1]];
        write('s-home_sections', items); draw();
      });
      host.addEventListener('change', e => { const c = e.target.closest('input[data-act="on"]'); if (!c) return; items[Number(c.closest('[data-i]').dataset.i)].on = c.checked; write('s-home_sections', items); });
    }
    write2(items); draw();
    function write2(v) { $('s-home_sections').value = JSON.stringify(v); }
  }

  function faq() {
    const host = $('he-faq'); if (!host) return;
    let items = read('s-faq_items', []).filter(x => x && typeof x === 'object').slice(0, 30).map(x => ({ q: String(x.q || ''), a: String(x.a || ''), on: x.on !== false }));
    const draw = () => {
      host.innerHTML = `<div class="he-list">${items.map((it, i) => `<div class="he-faq" data-i="${i}">
        <input class="a-input" data-f="q" maxlength="160" value="${esc(it.q)}" placeholder="Question" aria-label="Question ${i + 1}">
        <textarea class="a-textarea" data-f="a" maxlength="1200" rows="3" placeholder="Answer" aria-label="Answer ${i + 1}">${esc(it.a)}</textarea>
        <div class="he-row"><label style="display:inline-flex;gap:6px;align-items:center;font-size:12px;min-height:36px"><input type="checkbox" data-f="on" ${it.on ? 'checked' : ''}> Show</label>
        <button type="button" class="btn-a-ghost" data-act="up"${i === 0 ? ' disabled' : ''}>Up</button><button type="button" class="btn-a-ghost" data-act="down"${i === items.length - 1 ? ' disabled' : ''}>Down</button><button type="button" class="btn-a-danger" data-act="rm">Remove</button></div>
        <div class="ai-err" data-for="faq.${i}" style="font-size:11px;color:#f87171;"></div></div>`).join('')}</div>
        ${items.length < 30 ? '<button type="button" class="btn-a-ghost" data-act="add">Add a question</button>' : ''}
        <p class="hint-s">Questions appear on the FAQ page and, three at a time, on the home page. With none, the FAQ page and its menu entry are hidden.</p>`;
    };
    if (!host.dataset.bound) {
      host.dataset.bound = '1';
      host.addEventListener('input', e => { const r = e.target.closest('[data-i]'); const f = e.target.dataset.f; if (r && (f === 'q' || f === 'a')) { items[Number(r.dataset.i)][f] = e.target.value; write('s-faq_items', items); } });
      host.addEventListener('change', e => { const r = e.target.closest('[data-i]'); if (r && e.target.dataset.f === 'on') { items[Number(r.dataset.i)].on = e.target.checked; write('s-faq_items', items); } });
      host.addEventListener('click', e => {
        const b = e.target.closest('[data-act]'); if (!b) return; const r = b.closest('[data-i]'), i = r ? Number(r.dataset.i) : -1;
        if (b.dataset.act === 'add' && items.length < 30) items.push({ q: '', a: '', on: true });
        else if (b.dataset.act === 'rm') items.splice(i, 1);
        else if (b.dataset.act === 'up' && i > 0) [items[i - 1], items[i]] = [items[i], items[i - 1]];
        else if (b.dataset.act === 'down' && i < items.length - 1) [items[i + 1], items[i]] = [items[i], items[i + 1]];
        write('s-faq_items', items); draw();
        if (b.dataset.act === 'add') { const last = host.querySelector('.he-faq:last-child input'); if (last) last.focus(); }
      });
    }
    draw();
  }

  ext.register({
    load() {
      textList('he-words', 's-hero_words', { max: 20, len: 40, noun: 'Word', hint: 'These words swap one at a time under your headline. Leave the list empty to hide the line.' });
      textList('he-phrases', 's-cta_phrases', { max: 8, len: 60, noun: 'Phrase', hint: 'The call to action pill types these one after another, for example "Need a website?".' });
      sections(); faq();
    },
    // Validation happens on the server, which names the setting it did not accept.
    async save() { return true; },
  });
})();
