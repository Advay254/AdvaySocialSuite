/*
 * Strict SVG icon sanitiser. It tokenises the input, builds a small tree and writes
 * clean markup back out from allowlists. Nothing from the input is copied through
 * unchecked. Every colour becomes currentColor (or none).
 *
 * Accepts:  svg g path circle ellipse rect line polyline polygon
 * Rejects:  anything dangerous or external (script, style, use, image, foreignObject,
 *           links, event handlers, style attributes, references to other files),
 *           more than 10 KB, more than 200 elements, nesting deeper than 8.
 */

const MAX_BYTES = 10 * 1024;
const MAX_ELEMENTS = 200;
const MAX_DEPTH = 8;

const SHAPES = new Set(['svg', 'g', 'path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon']);
// Elements that are harmless to drop together with their contents (editors add them).
const DROPPABLE = new Set(['title', 'desc', 'defs', 'metadata', 'lineargradient', 'radialgradient', 'stop', 'clippath', 'mask', 'pattern', 'symbol', 'sodipodi:namedview', 'namedview', 'switch']);

const GEOMETRY = {
  path: ['d'], circle: ['cx', 'cy', 'r'], ellipse: ['cx', 'cy', 'rx', 'ry'], rect: ['x', 'y', 'width', 'height', 'rx', 'ry'],
  line: ['x1', 'y1', 'x2', 'y2'], polyline: ['points'], polygon: ['points'], g: [], svg: [],
};
const PAINT = ['fill', 'stroke'];
const PLAIN = { 'stroke-width': 'number', 'stroke-linecap': ['butt', 'round', 'square'], 'stroke-linejoin': ['miter', 'round', 'bevel', 'arcs', 'miter-clip'], 'stroke-miterlimit': 'number', 'fill-rule': ['nonzero', 'evenodd'], 'clip-rule': ['nonzero', 'evenodd'] };

class SvgRejected extends Error {
  constructor(message) { super(message); this.name = 'SvgRejected'; }
}
const reject = (m) => { throw new SvgRejected(m); };

// ---- value checks -----------------------------------------------------------------------

const NUM_RE = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;
function number(v, what) {
  const t = v.trim().replace(/px$/i, '');
  if (!NUM_RE.test(t) || t.length > 24) reject(`The ${what} value is not a plain number.`);
  return t;
}
function onlyChars(v, allowed, what, max) {
  if (v.length > max) reject(`The ${what} is too long.`);
  for (const ch of v) if (!allowed.includes(ch)) reject(`The ${what} contains a character that is not allowed.`);
  return v.trim();
}
const PATH_CHARS = 'MmLlHhVvCcSsQqTtAaZz0123456789eE+-., \t\r\n';
const POINT_CHARS = '0123456789eE+-., \t\r\n';
function transform(v) {
  if (v.length > 200) reject('A transform is too long.');
  // Only functions with plain numbers, nothing else.
  const parts = v.trim().split(')').map(s => s.trim()).filter(Boolean);
  if (!parts.length || parts.length > 6) reject('A transform is not allowed.');
  const out = [];
  for (const p of parts) {
    const i = p.indexOf('(');
    if (i < 1) reject('A transform is not allowed.');
    const fn = p.slice(0, i).trim();
    if (!['translate', 'rotate', 'scale', 'skewX', 'skewY', 'matrix'].includes(fn)) reject('A transform is not allowed.');
    const args = p.slice(i + 1).split(/[\s,]+/).filter(Boolean);
    if (!args.length || args.length > 6) reject('A transform is not allowed.');
    out.push(`${fn}(${args.map(a => number(a, 'transform')).join(' ')})`);
  }
  return out.join(' ');
}
function viewBox(v) {
  const p = v.trim().split(/[\s,]+/);
  if (p.length !== 4) reject('The viewBox must have four numbers.');
  const n = p.map(x => number(x, 'viewBox'));
  if (!(Number(n[2]) > 0 && Number(n[3]) > 0) || Number(n[2]) > 4096 || Number(n[3]) > 4096) reject('The viewBox size is not allowed.');
  return n.join(' ');
}
const paint = (v) => (v.trim().toLowerCase() === 'none' ? 'none' : 'currentColor');

// ---- tokenizer ----------------------------------------------------------------------------

const NAME_START = /[A-Za-z_:]/;
const NAME_CHAR = /[A-Za-z0-9_:.\-]/;
const isSpace = (c) => c === ' ' || c === '\t' || c === '\n' || c === '\r';

function tokenize(src) {
  const tokens = [];
  let i = 0;
  const n = src.length;
  let seenRoot = false;
  while (i < n) {
    if (src[i] !== '<') { // text between tags
      let j = src.indexOf('<', i);
      if (j === -1) j = n;
      tokens.push({ t: 'text', v: src.slice(i, j) });
      i = j; continue;
    }
    if (src.startsWith('<!--', i)) {
      const end = src.indexOf('-->', i + 4);
      if (end === -1) reject('A comment is not closed.');
      i = end + 3; continue;
    }
    if (src.startsWith('<?', i)) { // xml declaration is fine before the root, nothing else
      if (seenRoot) reject('Processing instructions are not allowed.');
      const end = src.indexOf('?>', i + 2);
      if (end === -1) reject('An xml declaration is not closed.');
      i = end + 2; continue;
    }
    if (src.startsWith('<!', i)) reject('DOCTYPE, CDATA and entity declarations are not allowed.');
    if (src[i + 1] === '/') { // closing tag
      let j = i + 2; let name = '';
      while (j < n && NAME_CHAR.test(src[j])) name += src[j++];
      while (j < n && isSpace(src[j])) j++;
      if (!name || src[j] !== '>') reject('A closing tag is not valid.');
      tokens.push({ t: 'close', name: name.toLowerCase() });
      i = j + 1; continue;
    }
    // opening tag
    let j = i + 1; let name = '';
    if (!NAME_START.test(src[j] || '')) reject('A tag is not valid.');
    while (j < n && NAME_CHAR.test(src[j])) name += src[j++];
    const attrs = [];
    let selfClose = false;
    for (;;) {
      while (j < n && isSpace(src[j])) j++;
      if (j >= n) reject('A tag is not closed.');
      if (src[j] === '>') { j++; break; }
      if (src[j] === '/' && src[j + 1] === '>') { selfClose = true; j += 2; break; }
      let an = '';
      if (!NAME_START.test(src[j])) reject('An attribute name is not valid.');
      while (j < n && NAME_CHAR.test(src[j])) an += src[j++];
      while (j < n && isSpace(src[j])) j++;
      if (src[j] !== '=') reject('An attribute has no value.');
      j++;
      while (j < n && isSpace(src[j])) j++;
      const q = src[j];
      if (q !== '"' && q !== "'") reject('Attribute values must be in quotes.');
      const end = src.indexOf(q, j + 1);
      if (end === -1) reject('An attribute value is not closed.');
      const val = src.slice(j + 1, end);
      if (val.indexOf('<') !== -1) reject('An attribute value contains a character that is not allowed.');
      attrs.push([an, val]);
      j = end + 1;
      if (attrs.length > 40) reject('A tag has too many attributes.');
    }
    tokens.push({ t: 'open', name: name.toLowerCase(), attrs, selfClose });
    if (!seenRoot && name.toLowerCase() === 'svg') seenRoot = true;
    i = j;
  }
  return tokens;
}

// ---- tree ---------------------------------------------------------------------------------

function buildTree(tokens) {
  let count = 0;
  const root = { name: '#root', attrs: [], children: [] };
  const stack = [root];
  for (const tk of tokens) {
    const top = stack[stack.length - 1];
    if (tk.t === 'text') {
      if (tk.v.trim() && stack.length === 1) reject('Text outside the svg is not allowed.');
      continue;
    }
    if (tk.t === 'open') {
      if (++count > MAX_ELEMENTS) reject(`The icon has more than ${MAX_ELEMENTS} elements.`);
      const node = { name: tk.name, attrs: tk.attrs, children: [] };
      top.children.push(node);
      if (!tk.selfClose) {
        if (stack.length > MAX_DEPTH) reject('The icon is nested too deeply.');
        stack.push(node);
      }
    } else { // close
      if (stack.length < 2 || top.name !== tk.name) reject('A tag is closed in the wrong place.');
      stack.pop();
    }
  }
  if (stack.length !== 1) reject('A tag is not closed.');
  return root;
}

// ---- rebuild ------------------------------------------------------------------------------

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function cleanAttrs(node, isRoot) {
  const out = [];
  const geo = GEOMETRY[node.name] || [];
  for (const [rawName, rawVal] of node.attrs) {
    const name = rawName.toLowerCase();
    const val = rawVal;
    // Hard rejections: handlers, style, links and anything that points elsewhere.
    if (name.startsWith('on')) reject('Event handlers are not allowed.');
    if (name === 'style') reject('Style attributes are not allowed.');
    if (name === 'href' || name.endsWith(':href') || name === 'src') reject('Links and external references are not allowed.');
    if (val.indexOf('&') !== -1) reject('Entities are not allowed in attribute values.');
    const lower = val.toLowerCase();
    if (lower.indexOf('javascript:') !== -1 || lower.indexOf('data:') !== -1 || lower.indexOf('http:') !== -1 || lower.indexOf('https:') !== -1 || lower.indexOf('//') !== -1) {
      if (name !== 'xmlns' && !name.startsWith('xmlns:')) reject('External references are not allowed.');
    }
    if (lower.indexOf('url(') !== -1 && !PAINT.includes(name)) reject('References to other parts of the file are not allowed.');

    if (PAINT.includes(name)) { out.push([name, paint(val)]); continue; }
    if (name === 'transform') { out.push(['transform', transform(val)]); continue; }
    if (name === 'viewbox' && isRoot) { out.push(['viewBox', viewBox(val)]); continue; }
    if (PLAIN[name]) {
      const rule = PLAIN[name];
      if (rule === 'number') out.push([name, number(val, name)]);
      else if (rule.includes(val.trim())) out.push([name, val.trim()]);
      else reject(`The ${name} value is not allowed.`);
      continue;
    }
    if (geo.includes(name)) {
      if (name === 'd') out.push([name, onlyChars(val, PATH_CHARS, 'path data', 8000)]);
      else if (name === 'points') out.push([name, onlyChars(val, POINT_CHARS, 'points list', 4000)]);
      else out.push([name, number(val, name)]);
      continue;
    }
    // Anything else (id, class, xmlns, width, height, data-*, editor attributes) is dropped.
  }
  return out;
}

function write(node, isRoot) {
  const attrs = cleanAttrs(node, isRoot);
  const kids = [];
  for (const c of node.children) {
    if (DROPPABLE.has(c.name)) continue;
    if (!SHAPES.has(c.name) || c.name === 'svg') reject(`The element <${c.name}> is not allowed.`);
    kids.push(serialiseNode(c));
  }
  return { attrs, markup: kids.join('') };
}

function serialiseNode(node) {
  const { attrs, markup } = write(node, false);
  const a = attrs.map(([k, v]) => ` ${k}="${esc(v)}"`).join('');
  return markup ? `<${node.name}${a}>${markup}</${node.name}>` : `<${node.name}${a}/>`;
}

/**
 * sanitize(svgText) returns { viewBox, body, svg }.
 * `body` is the clean inner markup, `svg` is the full clean <svg> element.
 * Throws SvgRejected with a plain language reason.
 */
function sanitize(input) {
  if (typeof input !== 'string') reject('Paste the SVG code as text.');
  if (Buffer.byteLength(input, 'utf8') > MAX_BYTES) reject('The icon is larger than 10 KB.');
  if (input.indexOf('\u0000') !== -1) reject('The icon contains a character that is not allowed.');
  const tree = buildTree(tokenize(input.trim()));
  const roots = tree.children;
  if (roots.length !== 1 || roots[0].name !== 'svg') reject('The code must be one <svg> element.');
  const root = roots[0];

  const rootAttrs = cleanAttrs(root, true);
  let vb = (rootAttrs.find(a => a[0] === 'viewBox') || [])[1];
  if (!vb) {
    const get = (n) => { const f = root.attrs.find(a => a[0].toLowerCase() === n); return f ? f[1] : null; };
    const w = get('width'), h = get('height');
    vb = w && h ? viewBox(`0 0 ${number(w, 'width')} ${number(h, 'height')}`) : '0 0 24 24';
  }
  // Paint set on the svg itself is applied through a wrapper group, so it is not lost.
  const paintAttrs = rootAttrs.filter(a => a[0] !== 'viewBox' && a[0] !== 'transform');
  let inner = '';
  for (const c of root.children) {
    if (DROPPABLE.has(c.name)) continue;
    if (!SHAPES.has(c.name) || c.name === 'svg') reject(`The element <${c.name}> is not allowed.`);
    inner += serialiseNode(c);
  }
  if (!inner) reject('The icon has no shapes in it.');
  let body = inner;
  if (paintAttrs.length) body = `<g${paintAttrs.map(([k, v]) => ` ${k}="${esc(v)}"`).join('')}>${inner}</g>`;
  if (body.length > MAX_BYTES) reject('The cleaned icon is larger than 10 KB.');
  return { viewBox: vb, body, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${body}</svg>` };
}

module.exports = { sanitize, SvgRejected, MAX_BYTES, MAX_ELEMENTS };
