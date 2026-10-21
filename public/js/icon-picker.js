/* AdvaySocialSuite 1.1.0 icon picker (admin). One dialog, used wherever an icon is chosen. */
const IconPicker = (() => {
  let overlay = null;
  let returnFocus = null;
  let onSelect = null;

  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  function item(name, label, selected) {
    return `<button type="button" class="ip-item" data-name="${esc(name)}" aria-pressed="${selected ? 'true' : 'false'}" aria-label="${esc(label)}" title="${esc(label)}">${Icons.svg(name)}<span>${esc(label)}</span></button>`;
  }

  function draw(query, value) {
    const q = String(query || '').trim().toLowerCase();
    let html = '';
    let count = 0;
    const customs = Object.values(Icons.custom());
    const custom = customs.filter(c => !q || String(c.name).toLowerCase().includes(q));
    if (custom.length) {
      count += custom.length;
      html += `<div class="ip-group">Your icons</div><div class="ip-grid">${custom.map(c => item('custom:' + c.id, c.name, value === 'custom:' + c.id)).join('')}</div>`;
    }
    Icons.groups().forEach(([label, names]) => {
      const shown = names.filter(n => !q || n.includes(q) || n.replace(/-/g, ' ').includes(q));
      if (!shown.length) return;
      count += shown.length;
      html += `<div class="ip-group">${esc(label)}</div><div class="ip-grid">${shown.map(n => item(n, n.replace(/-/g, ' '), value === n)).join('')}</div>`;
    });
    overlay.querySelector('.ip-body').innerHTML = html || '<p style="color:#7a8499;font-size:13px;">No icons match your search.</p>';
    overlay.querySelector('.ip-count').textContent = count + (count === 1 ? ' icon' : ' icons');
  }

  function close() {
    if (!overlay) return;
    document.removeEventListener('keydown', onKey, true);
    overlay.remove(); overlay = null; onSelect = null;
    if (returnFocus && returnFocus.focus) returnFocus.focus();
  }

  function onKey(e) {
    if (!overlay) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
    if (e.key !== 'Tab') return;
    const f = Array.from(overlay.querySelectorAll('button, input')).filter(x => !x.disabled && x.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  // open({ value, onSelect(value) })
  function open(opts) {
    close();
    returnFocus = document.activeElement;
    onSelect = opts.onSelect;
    overlay = document.createElement('div');
    overlay.className = 'ip-overlay';
    overlay.innerHTML = `
      <div class="ip-panel" role="dialog" aria-modal="true" aria-label="Choose an icon">
        <div class="ip-head">
          <input type="search" class="a-input ip-search" placeholder="Search icons" aria-label="Search icons" autocomplete="off" style="flex:1;">
          <span class="ip-count" role="status" aria-live="polite" style="font-size:11px;color:#7a8499;white-space:nowrap;"></span>
          <button type="button" class="btn-a-ghost ip-close">Close</button>
        </div>
        <div class="ip-body"></div>
      </div>`;
    document.body.appendChild(overlay);
    draw('', opts.value || '');
    overlay.addEventListener('click', e => {
      if (e.target === overlay) return close();
      if (e.target.closest('.ip-close')) return close();
      const b = e.target.closest('.ip-item');
      if (b) { const cb = onSelect; const v = b.dataset.name; close(); if (cb) cb(v); }
    });
    overlay.querySelector('.ip-search').addEventListener('input', e => draw(e.target.value, opts.value || ''));
    document.addEventListener('keydown', onKey, true);
    setTimeout(() => { const s = overlay && overlay.querySelector('.ip-search'); if (s) s.focus(); }, 30);
  }

  return { open, close };
})();
