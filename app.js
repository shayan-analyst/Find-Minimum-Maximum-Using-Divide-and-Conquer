/* AlgoVision: Min and Max by Divide and Conquer. Plain JavaScript, no libraries. */
(() => {
'use strict';

/* ================= configuration (edit before presenting) ================= */
const CONFIG = {
  course: 'Design Analysis and Algorithm',
  date: '3 December 2026',
  university: '',          // e.g. 'Your University'
  instructor: '',          // e.g. 'Instructor name'
  members: ['Muhammad Shayan Shamim', 'Shayan Khan', 'Hasnain Raza']
};

/* ================= helpers ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const SVGNS = 'http://www.w3.org/2000/svg';
const sv = (tag, attrs = {}, parent) => { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (_) { /* storage unavailable */ } }
};
const fmt = n => n.toLocaleString('en-US');
const isPow2 = n => n > 0 && (n & (n - 1)) === 0;

/* ================= algorithm engine ================= */
// Independent copy of the recurrence, used only to double-check the real counter.
const trMemo = new Map();
function Trec(n) {
  if (n === 1) return 0;
  if (n === 2) return 1;
  if (trMemo.has(n)) return trMemo.get(n);
  const v = Trec(Math.ceil(n / 2)) + Trec(Math.floor(n / 2)) + 2;
  trMemo.set(n, v);
  return v;
}
const scanCost = n => 2 * (n - 1);
const lowerBound = n => (n <= 1 ? 0 : Math.ceil(3 * n / 2) - 2);

const PSEUDO = [
  'FIND-MIN-MAX(A, low, high)',
  '  if low = high',
  '      return (A[low], A[low])',
  '  if high = low + 1',
  '      if A[low] ≤ A[high]',
  '          return (A[low], A[high])',
  '      else return (A[high], A[low])',
  '  mid ← ⌊(low + high) / 2⌋',
  '  (min1, max1) ← FIND-MIN-MAX(A, low, mid)',
  '  (min2, max2) ← FIND-MIN-MAX(A, mid + 1, high)',
  '  min ← (min1 ≤ min2) ? min1 : min2',
  '  max ← (max1 ≥ max2) ? max1 : max2',
  '  return (min, max)'
];
const TAGNAME = { CALL: 'Call', DIVIDE: 'Divide', BASE: 'Base case', COMPARE: 'Compare', COMBINE: 'Combine', SOLVED: 'Solved', RESULT: 'Result' };

// Runs the real algorithm once and records every step as an event.
function buildTrace(arr) {
  const events = [], nodes = [];
  let comps = 0, calls = 0, maxDepth = 0;
  const rng = (lo, hi) => (lo === hi ? `A[${lo}]` : `A[${lo}..${hi}]`);
  const list = a => '[' + a.join(', ') + ']';
  const ev = (type, node, x) => events.push(Object.assign({ idx: events.length, type, node: node.id, comps, calls }, x));

  function solve(lo, hi, depth, parent, side) {
    const n = hi - lo + 1;
    const node = { id: nodes.length, parent: parent ? parent.id : -1, side, depth, lo, hi, n, vals: arr.slice(lo, hi + 1), kids: [],
      kind: n === 1 ? 'single' : n === 2 ? 'pair' : 'split', min: null, max: null, minI: -1, maxI: -1 };
    nodes.push(node);
    if (parent) parent.kids.push(node.id);
    calls++;
    maxDepth = Math.max(maxDepth, depth);
    ev('enter', node, {
      tag: 'CALL', line: [1].concat(parent ? [side === 'L' ? 9 : 10] : []),
      text: `FIND-MIN-MAX on <b>${rng(lo, hi)}</b> = ${list(node.vals)} <i>(${parent ? (side === 'L' ? 'left half' : 'right half') + ', depth ' + depth : 'whole array'})</i>`
    });

    if (n === 1) {
      node.min = node.max = arr[lo]; node.minI = node.maxI = lo;
      ev('single', node, { tag: 'BASE', line: [2, 3], min: node.min, max: node.max, minI: lo, maxI: lo,
        text: `One element: <b>${arr[lo]}</b> is both min and max. <i>0 comparisons</i>` });
      return node;
    }
    if (n === 2) {
      comps++;
      const a = arr[lo], b = arr[hi], le = a <= b;
      node.min = le ? a : b; node.max = le ? b : a;
      node.minI = le ? lo : hi; node.maxI = le ? hi : lo;
      ev('pair', node, { tag: 'COMPARE', line: [4, 5, le ? 6 : 7], cmp: [lo, hi], min: node.min, max: node.max, minI: node.minI, maxI: node.maxI,
        text: `Compare <b>${a}</b> ${le ? '≤' : '>'} <b>${b}</b> → min = <b>${node.min}</b>, max = <b>${node.max}</b> <span class="cnt">comparison #${comps}</span>` });
      return node;
    }
    const mid = (lo + hi) >> 1;
    ev('divide', node, { tag: 'DIVIDE', line: [8], mid,
      text: `mid = ⌊(${lo}+${hi})/2⌋ = <b>${mid}</b> → left ${rng(lo, mid)} = ${list(arr.slice(lo, mid + 1))}, right ${rng(mid + 1, hi)} = ${list(arr.slice(mid + 1, hi + 1))}` });
    const L = solve(lo, mid, depth + 1, node, 'L');
    const R = solve(mid + 1, hi, depth + 1, node, 'R');

    comps++;
    const takeLmin = L.min <= R.min;
    node.min = takeLmin ? L.min : R.min; node.minI = takeLmin ? L.minI : R.minI;
    ev('cmin', node, { tag: 'COMBINE', line: [11], cmp: [L.minI, R.minI], pickMin: node.minI, partialMin: node.min, kidL: L.id, kidR: R.id,
      text: `MIN: left <b>${L.min}</b> ${takeLmin ? '≤' : '>'} right <b>${R.min}</b> → min = <b>${node.min}</b> <span class="cnt">comparison #${comps}</span>` });

    comps++;
    const takeLmax = L.max >= R.max;
    node.max = takeLmax ? L.max : R.max; node.maxI = takeLmax ? L.maxI : R.maxI;
    ev('cmax', node, { tag: 'COMBINE', line: [12], cmp: [L.maxI, R.maxI], pickMax: node.maxI, partialMax: node.max, kidL: L.id, kidR: R.id,
      text: `MAX: left <b>${L.max}</b> ${takeLmax ? '≥' : '<'} right <b>${R.max}</b> → max = <b>${node.max}</b> <span class="cnt">comparison #${comps}</span>` });

    ev('done', node, { tag: 'SOLVED', line: [13], min: node.min, max: node.max, minI: node.minI, maxI: node.maxI,
      text: `${rng(lo, hi)} solved → min = <b>${node.min}</b>, max = <b>${node.max}</b>` });
    return node;
  }

  const root = solve(0, arr.length - 1, 0, null, '');
  const n = arr.length;
  ev('final', root, { tag: 'RESULT', line: [], min: root.min, max: root.max, minI: root.minI, maxI: root.maxI,
    text: `Answer: min = <b>${root.min}</b>, max = <b>${root.max}</b> using <span class="cnt">${comps} comparisons</span> <i>(recurrence T(${n}) = ${Trec(n)}, scan 2(n−1) = ${scanCost(n)})</i>` });
  return { arr, events, nodes, total: comps, calls, maxDepth, root };
}

// Rebuilds the whole visible state after event idx (so stepping back and scrubbing are exact).
function replay(tr, idx) {
  const st = { nodes: tr.nodes.map(() => ({ phase: 'hidden', min: null, max: null })), stack: [], comps: 0, calls: 0,
    reg: { min: null, max: null, minSrc: '', maxSrc: '' }, ev: idx >= 0 ? tr.events[idx] : null };
  const r = n => (n.lo === n.hi ? `A[${n.lo}]` : `A[${n.lo}..${n.hi}]`);
  for (let i = 0; i <= idx; i++) {
    const e = tr.events[i], n = tr.nodes[e.node], s = st.nodes[e.node];
    st.comps = e.comps; st.calls = e.calls;
    switch (e.type) {
      case 'enter': s.phase = 'active'; st.stack.push(e.node); break;
      case 'single': case 'pair':
        s.phase = 'solved'; s.min = e.min; s.max = e.max; st.stack.pop();
        st.reg = { min: e.min, max: e.max, minSrc: r(n), maxSrc: r(n) }; break;
      case 'divide': s.phase = 'divided'; break;
      case 'cmin': s.phase = 'combining'; s.min = e.partialMin; st.reg.min = e.partialMin; st.reg.minSrc = r(n); break;
      case 'cmax': s.max = e.partialMax; st.reg.max = e.partialMax; st.reg.maxSrc = r(n); break;
      case 'done': s.phase = 'solved'; st.stack.pop(); break;
      default: break;
    }
  }
  return st;
}

/* ================= typewriter ================= */
function typeHTML(node, html, ms, done) {
  node.innerHTML = html;
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  const texts = []; let t;
  while ((t = walker.nextNode())) texts.push(t);
  // Untyped text stays in the layout (hidden), so lines never jump while they are being written.
  const parts = texts.map(tn => {
    const s = tn.nodeValue, shown = document.createTextNode(''), ghost = document.createElement('span');
    ghost.className = 'ghost'; ghost.textContent = s;
    tn.parentNode.replaceChild(shown, tn); shown.after(ghost);
    return { shown, ghost, s };
  });
  const total = parts.reduce((a, p) => a + p.s.length, 0);
  const cursor = el('span', 'cursor');
  let raf = 0, t0 = 0, finished = false;
  const setN = n => {
    let left = n, active = null;
    for (const p of parts) {
      const k = clamp(left, 0, p.s.length);
      p.shown.nodeValue = p.s.slice(0, k); p.ghost.textContent = p.s.slice(k);
      if (k < p.s.length && !active) active = p;
      left -= k;
    }
    const at = active || parts[parts.length - 1];
    if (at) at.ghost.before(cursor);
  };
  const finish = () => { if (finished) return; finished = true; cancelAnimationFrame(raf); setN(total); cursor.remove(); if (done) done(); };
  if (RM || ms <= 40 || !total) { finish(); return { finish }; }
  setN(0);
  const step = ts => { if (!t0) t0 = ts; const p = Math.min(1, (ts - t0) / ms); setN(Math.round(p * total)); if (p < 1) raf = requestAnimationFrame(step); else finish(); };
  raf = requestAnimationFrame(step);
  return { finish };
}

/* ================= array bars ================= */
class Bars {
  constructor(host) { this.host = host; }
  set(arr) {
    this.arr = arr; this.host.innerHTML = '';
    const lo = Math.min(0, ...arr), hi = Math.max(0, ...arr), span = (hi - lo) || 1;
    this.host.classList.toggle('has-neg', lo < 0);
    this.cells = arr.map((v, i) => {
      const base = 'bar ' + (v < 0 ? 'neg' : 'pos');
      const c = el('div', base); c.dataset.base = base;
      const f = el('div', 'bfield');
      const fill = el('div', 'bfill');
      fill.style.bottom = ((Math.min(v, 0) - lo) / span * 100) + '%';
      fill.style.height = (Math.abs(v) / span * 100) + '%';
      fill.appendChild(el('span', 'bv', String(v)));
      if (lo < 0) { const z = el('i', 'zero'); z.style.bottom = ((0 - lo) / span * 100) + '%'; f.appendChild(z); }
      f.appendChild(fill);
      c.append(f, el('span', 'bi', String(i)));
      this.host.appendChild(c);
      return c;
    });
  }
  apply(e, tr) {
    const sets = this.cells.map(() => []);
    if (e) {
      const nd = tr.nodes[e.node];
      this.cells.forEach((_, i) => sets[i].push(i >= nd.lo && i <= nd.hi ? 'in' : 'out'));
      if (e.type === 'divide') {
        for (let i = nd.lo; i <= e.mid; i++) sets[i].push('sl');
        for (let i = e.mid + 1; i <= nd.hi; i++) sets[i].push('sr');
        sets[e.mid].push('cut');
      }
      if (e.cmp) e.cmp.forEach(i => sets[i].push('cmp'));
      if (['single', 'pair', 'done', 'final'].includes(e.type)) { sets[e.minI].push('pmin'); sets[e.maxI].push('pmax'); }
      if (e.type === 'cmin') sets[e.pickMin].push('pmin');
      if (e.type === 'cmax') sets[e.pickMax].push('pmax');
    }
    this.cells.forEach((c, i) => { c.className = c.dataset.base + ' ' + sets[i].join(' '); });
  }
}

/* ================= recursion tree (SVG) ================= */
class TreeView {
  constructor(svg, tr, o = {}) {
    this.svg = svg; this.tr = tr;
    this.o = Object.assign({ W: 112, H: 68, gx: 16, gy: 46, autoFit: true, minScale: .8, maxScale: 1.25 }, o);
    this.build();
  }
  build() {
    const { W, H, gx, gy } = this.o, nodes = this.tr.nodes, svg = this.svg;
    svg.innerHTML = '';
    let leaf = 0; const pos = [];
    const lay = id => {
      const n = nodes[id];
      if (!n.kids.length) pos[id] = { x: leaf++ * (W + gx) };
      else { n.kids.forEach(lay); pos[id] = { x: (pos[n.kids[0]].x + pos[n.kids[n.kids.length - 1]].x) / 2 }; }
      pos[id].y = n.depth * (H + gy);
    };
    lay(0);
    this.pos = pos;
    const pad = 12;
    this.vw = leaf * (W + gx) - gx + pad * 2;
    this.vh = (this.tr.maxDepth + 1) * (H + gy) - gy + pad * 2;
    svg.setAttribute('viewBox', `${-pad} ${-pad} ${this.vw} ${this.vh}`);
    const gE = sv('g', {}, svg), gN = sv('g', {}, svg), gS = sv('g', {}, svg);
    this.gS = gS; this.edges = []; this.g = [];
    nodes.forEach(n => {
      if (n.parent >= 0) {
        const p = pos[n.parent], c = pos[n.id];
        const x1 = p.x + W / 2, y1 = p.y + H, x2 = c.x + W / 2, y2 = c.y;
        const d = `M${x1},${y1} C${x1},${y1 + gy * .55} ${x2},${y2 - gy * .55} ${x2},${y2}`;
        this.edges[n.id] = sv('path', { d, pathLength: 1, class: 'edge' }, gE);
      }
      const outer = sv('g', { transform: `translate(${pos[n.id].x},${pos[n.id].y})`, class: 'tnode' }, gN);
      const g = sv('g', { class: 'tn-in' }, outer);
      sv('title', {}, g).textContent = `${n.lo === n.hi ? 'A[' + n.lo + ']' : 'A[' + n.lo + '..' + n.hi + ']'} = [${n.vals.join(', ')}]\nmin = ${n.min}, max = ${n.max}`;
      sv('rect', { class: 'box', width: W, height: H, rx: 13 }, g);
      const r = sv('text', { class: 'rng', x: 10, y: 17 }, g);
      r.textContent = n.lo === n.hi ? `A[${n.lo}]` : `A[${n.lo}..${n.hi}]`;
      if (n.side) { const s = sv('text', { class: 'side', x: W - 10, y: 17, 'text-anchor': 'end' }, g); s.textContent = n.side; }
      const vs = n.n <= 4 ? n.vals.join('  ') : `n = ${n.n}`;
      const v = sv('text', { class: 'vals', x: W / 2, y: 38, 'text-anchor': 'middle' }, g);
      v.textContent = vs;
      if (vs.length > 13) v.setAttribute('font-size', '11');
      const cw = (W - 24) / 2, chips = {};
      ['min', 'max'].forEach((k, i) => {
        const cg = sv('g', { class: 'chip ' + k }, g);
        sv('rect', { class: 'chip-r', x: 8 + i * (cw + 8), y: H - 24, width: cw, height: 18, rx: 6 }, cg);
        const t = sv('text', { class: 'chip-t', x: 8 + i * (cw + 8) + cw / 2, y: H - 11 }, cg);
        t.textContent = k + ' –';
        chips[k] = { g: cg, t };
      });
      this.g[n.id] = { outer, chips };
    });
    this.shown = new Set();
    if (this.o.autoFit) this.fit();
  }
  fit() {
    const wrap = this.svg.parentElement;
    const avail = wrap.clientWidth - 6;
    if (avail <= 0) return;
    const s = clamp(avail / this.vw, this.o.minScale, this.o.maxScale);
    this.svg.style.width = (this.vw * s) + 'px';
    this.svg.style.height = (this.vh * s) + 'px';
    this.scale = s;
  }
  apply(st, e, animate) {
    const cur = e ? e.node : -1;
    this.tr.nodes.forEach(n => {
      const s = st.nodes[n.id], g = this.g[n.id], vis = s.phase !== 'hidden';
      g.outer.setAttribute('class', `tnode ${vis ? 'on' : ''} ph-${s.phase} ${n.id === cur ? 'cur' : ''}`);
      const setChip = (k, v) => { const c = g.chips[k]; c.t.textContent = k + ' ' + (v == null ? '–' : v); c.g.setAttribute('class', `chip ${k}${v == null ? '' : ' known'}`); };
      setChip('min', s.min); setChip('max', s.max);
      const ed = this.edges[n.id];
      if (ed) ed.setAttribute('class', `edge ${vis ? 'on' : ''} ${(n.id === cur || (e && (e.kidL === n.id || e.kidR === n.id))) && vis ? 'hot' : ''}`);
    });
    if (animate && e && (e.type === 'cmin' || e.type === 'cmax')) {
      this.fly(e.kidL, e.type === 'cmin' ? 'var(--min)' : 'var(--max)');
      this.fly(e.kidR, e.type === 'cmin' ? 'var(--min)' : 'var(--max)');
    }
    if (this.o.follow && cur >= 0) this.follow(cur);
  }
  fly(childId, color) {
    const path = this.edges[childId]; if (!path || RM) return;
    const len = path.getTotalLength();
    const dot = sv('circle', { r: 6, class: 'sig', style: `fill:${color};color:${color}` }, this.gS);
    const t0 = performance.now(), dur = clamp(700 / (this.o.speed ? this.o.speed() : 1), 220, 900);
    const tick = now => {
      const p = clamp((now - t0) / dur, 0, 1), q = path.getPointAtLength(len * (1 - p));
      dot.setAttribute('cx', q.x); dot.setAttribute('cy', q.y);
      if (p < 1) requestAnimationFrame(tick); else dot.remove();
    };
    requestAnimationFrame(tick);
  }
  follow(id) {
    const wrap = this.svg.parentElement;
    if (wrap.scrollWidth <= wrap.clientWidth + 2) return;
    const s = this.scale || 1, x = (this.pos[id].x + this.o.W / 2 + 12) * s;
    wrap.scrollTo({ left: x - wrap.clientWidth / 2, behavior: RM ? 'auto' : 'smooth' });
  }
}

/* ================= charts ================= */
function niceTicks(max, count = 5) {
  const raw = max / count, mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw) || raw;
  const out = [];
  for (let v = 0; ; v += step) { out.push(+v.toFixed(6)); if (v >= max - 1e-9) break; }
  return out;
}
function playChart(host) {
  host.classList.remove('in'); void host.offsetWidth;
  requestAnimationFrame(() => requestAnimationFrame(() => host.classList.add('in')));
}

function barChart(host, o) {
  const W = 680, H = 360, m = { l: 50, r: 14, t: 26, b: o.sub ? 66 : 46 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const ticks = niceTicks(o.ymax), top = ticks[ticks.length - 1];
  const sy = v => m.t + ih - v / top * ih;
  const gw = iw / o.groups.length, k = o.series.length, bw = Math.min(54, gw * .72 / k);
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${o.aria}"><g class="ax">`;
  ticks.forEach(t => { s += `<line class="grid" x1="${m.l}" x2="${W - m.r}" y1="${sy(t)}" y2="${sy(t)}"/><text x="${m.l - 8}" y="${sy(t) + 4}" text-anchor="end">${t}</text>`; });
  s += `<line class="base" x1="${m.l}" x2="${W - m.r}" y1="${sy(0)}" y2="${sy(0)}"/>`;
  if (o.yTitle) s += `<text class="title" transform="translate(13 ${m.t + ih / 2}) rotate(-90)" text-anchor="middle">${o.yTitle}</text>`;
  s += '</g>';
  o.groups.forEach((g, gi) => {
    const cx = m.l + gw * gi + gw / 2;
    g.values.forEach((v, si) => {
      const x = cx - (k * bw + (k - 1) * 4) / 2 + si * (bw + 4), y = sy(v), h = Math.max(0, sy(0) - y);
      s += `<rect class="bar-r" style="--i:${gi * k + si};fill:${o.series[si].color}" x="${x}" y="${y}" width="${bw}" height="${h}" rx="6"><title>${o.series[si].name}: ${v}</title></rect>`;
      s += `<text class="bar-l" text-anchor="middle" x="${x + bw / 2}" y="${y - 6}">${v}</text>`;
    });
    s += `<g class="ax"><text text-anchor="middle" x="${cx}" y="${H - m.b + 20}">${g.label}</text>${g.sub ? `<text text-anchor="middle" x="${cx}" y="${H - m.b + 36}">${g.sub}</text>` : ''}</g>`;
  });
  if (o.xTitle) s += `<g class="ax"><text class="title" text-anchor="middle" x="${m.l + iw / 2}" y="${H - 6}">${o.xTitle}</text></g>`;
  host.innerHTML = s + '</svg>';
}

function lineChart(host, o) {
  const W = 680, H = 400, m = { l: 54, r: 20, t: 16, b: 50 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const [x0, x1] = o.x, [y0, y1] = o.y;
  const sx = x => m.l + (x - x0) / (x1 - x0) * iw, sy = y => m.t + ih - (y - y0) / (y1 - y0) * ih;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${o.aria}"><g class="ax">`;
  o.yTicks.forEach(t => { s += `<line class="grid" x1="${m.l}" x2="${W - m.r}" y1="${sy(t)}" y2="${sy(t)}"/><text x="${m.l - 8}" y="${sy(t) + 4}" text-anchor="end">${o.fmtY ? o.fmtY(t) : t}</text>`; });
  o.xTicks.forEach(t => { s += `<text x="${sx(t)}" y="${H - m.b + 20}" text-anchor="middle">${t}</text>`; });
  s += `<line class="base" x1="${m.l}" x2="${W - m.r}" y1="${sy(y0)}" y2="${sy(y0)}"/>`;
  s += `<text class="title" x="${m.l + iw / 2}" y="${H - 8}" text-anchor="middle">${o.xTitle}</text>`;
  s += `<text class="title" transform="translate(14 ${m.t + ih / 2}) rotate(-90)" text-anchor="middle">${o.yTitle}</text></g>`;
  o.series.forEach((sr, i) => {
    const d = 'M' + sr.pts.map(p => sx(p[0]).toFixed(1) + ',' + sy(p[1]).toFixed(1)).join('L');
    s += `<path class="ln${sr.dash ? ' dash' : ''}" data-s="${i}" pathLength="1" d="${d}" style="stroke:${sr.color}"/>`;
  });
  o.series.forEach((sr, i) => {
    if (!sr.dots) return;
    s += `<g class="dots" data-s="${i}">` + sr.dots.map(p => `<circle cx="${sx(p[0])}" cy="${sy(p[1])}" r="4.6" style="fill:${sr.color};stroke:var(--panel-solid);stroke-width:2"/>`).join('') + '</g>';
  });
  s += `<line class="hoverline" x1="0" x2="0" y1="${m.t}" y2="${m.t + ih}"/>`;
  o.series.forEach((sr, i) => { s += `<circle class="hoverdot" data-s="${i}" r="5" style="fill:${sr.color};stroke:var(--panel-solid);stroke-width:2"/>`; });
  s += `<rect class="hit" x="${m.l}" y="${m.t}" width="${iw}" height="${ih}" fill="transparent"/></svg><div class="tip"></div>`;
  host.innerHTML = s;
  const svg = $('svg', host), tip = $('.tip', host), line = $('.hoverline', svg), dots = $$('.hoverdot', svg);
  const hidden = new Set();
  const lookup = new Map(o.series.map((sr, i) => [i, new Map(sr.pts.map(p => [p[0], p[1]]))]));
  const hit = $('.hit', svg);
  const move = e => {
    const r = svg.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width * W;
    const xv = clamp(Math.round(x0 + (px - m.l) / iw * (x1 - x0)), x0, x1);
    line.setAttribute('x1', sx(xv)); line.setAttribute('x2', sx(xv)); line.style.opacity = 1;
    let rows = `<div><b>${o.xName} = ${xv}</b></div>`;
    o.series.forEach((sr, i) => {
      const v = lookup.get(i).get(xv), d = dots[i];
      if (v == null || hidden.has(i)) { d.style.opacity = 0; return; }
      d.setAttribute('cx', sx(xv)); d.setAttribute('cy', sy(v)); d.style.opacity = 1;
      rows += `<div class="row"><span><i class="sw" style="background:${sr.color}"></i>${sr.name}</span><b>${o.fmtV ? o.fmtV(v) : v}</b></div>`;
    });
    tip.innerHTML = rows; tip.classList.add('on');
    const hr = host.getBoundingClientRect(), left = e.clientX - hr.left;
    tip.style.left = (left > hr.width * .6 ? left - tip.offsetWidth - 14 : left + 14) + 'px';
    tip.style.top = clamp(e.clientY - hr.top - 20, 0, hr.height - tip.offsetHeight) + 'px';
  };
  hit.addEventListener('pointermove', move);
  hit.addEventListener('pointerleave', () => { line.style.opacity = 0; dots.forEach(d => { d.style.opacity = 0; }); tip.classList.remove('on'); });
  return { toggle(i) { hidden.has(i) ? hidden.delete(i) : hidden.add(i); $$(`[data-s="${i}"]:not(.hoverdot)`, svg).forEach(n => { n.style.opacity = hidden.has(i) ? 0 : 1; }); return !hidden.has(i); } };
}

function legend(host, series, chart) {
  host.innerHTML = '';
  series.forEach((sr, i) => {
    const b = el('button', '', `<i style="background:${sr.color}"></i>${sr.name}`);
    b.type = 'button';
    if (chart) b.addEventListener('click', () => b.classList.toggle('off', !chart.toggle(i)));
    host.appendChild(b);
  });
}

const C = { scan: 'var(--divide)', dc: 'var(--combine)', lb: 'var(--base)', ub: 'var(--compare)' };

/* ---- chart: problem ---- */
function drawProblem() {
  const ns = [4, 8, 16, 32, 64];
  const series = [{ name: 'Scan 2(n − 1)', color: C.scan }, { name: 'Divide and conquer', color: C.dc }];
  barChart($('#chProblem'), { aria: 'Comparisons for the scan and for divide and conquer', ymax: 130, xTitle: 'Array size n', yTitle: 'Comparisons', series,
    groups: ns.map(n => ({ label: 'n = ' + n, values: [scanCost(n), Trec(n)] })) });
  legend($('#lgProblem'), series);
  playChart($('#chProblem'));
}

/* ---- chart: growth ---- */
let growthChart = null;
function drawGrowth() {
  const host = $('#chGrowth'), ns = []; for (let n = 2; n <= 64; n++) ns.push(n);
  const series = [
    { name: 'Scan 2(n − 1)', color: C.scan, pts: ns.map(n => [n, scanCost(n)]) },
    { name: 'Divide and conquer T(n)', color: C.dc, pts: ns.map(n => [n, Trec(n)]), dots: [2, 4, 8, 16, 32, 64].map(n => [n, Trec(n)]) },
    { name: 'Lower bound ⌈3n/2⌉ − 2', color: C.lb, dash: true, pts: ns.map(n => [n, lowerBound(n)]) },
    { name: 'Upper bound 5n/3 − 2', color: C.ub, dash: true, pts: ns.map(n => [n, +(5 * n / 3 - 2).toFixed(2)]) }
  ];
  growthChart = lineChart(host, { aria: 'Comparison counts as n grows', x: [2, 64], y: [0, 130], xTicks: [2, 8, 16, 24, 32, 40, 48, 56, 64], yTicks: [0, 20, 40, 60, 80, 100, 120],
    xTitle: 'Array size n', yTitle: 'Comparisons', xName: 'n', series, fmtV: v => (Number.isInteger(v) ? v : v.toFixed(1)) });
  legend($('#lgGrowth'), series, growthChart);
  playChart(host);
}

/* ---- chart: saving ---- */
function drawSaving() {
  const ns = []; for (let n = 4; n <= 128; n++) ns.push(n);
  const pct = n => (1 - Trec(n) / scanCost(n)) * 100;
  const series = [{ name: 'Saved', color: C.dc, pts: ns.map(n => [n, +pct(n).toFixed(2)]), dots: [4, 8, 16, 32, 64, 128].map(n => [n, +pct(n).toFixed(2)]) }];
  lineChart($('#chSaving'), { aria: 'Percentage of comparisons saved versus the scan', x: [4, 128], y: [15, 35], xTicks: [4, 16, 32, 48, 64, 80, 96, 112, 128], yTicks: [15, 20, 25, 30, 35],
    fmtY: v => v + '%', fmtV: v => v.toFixed(1) + '%', xTitle: 'Array size n', yTitle: 'Saved vs scan', xName: 'n', series });
  playChart($('#chSaving'));
}

/* ---- chart: levels + stack ---- */
function levelCosts(n) {
  const lv = [];
  (function rec(size, d) {
    lv[d] = lv[d] || { nodes: 0, comps: 0 };
    lv[d].nodes++;
    if (size === 1) return;
    if (size === 2) { lv[d].comps += 1; return; }
    lv[d].comps += 2;
    rec(Math.ceil(size / 2), d + 1); rec(Math.floor(size / 2), d + 1);
  })(n, 0);
  return lv;
}
function drawLevels() {
  const n = +$('#lvN').value; $('#lvNOut').textContent = n;
  const lv = levelCosts(n), vals = lv.map(l => l.comps), sum = vals.reduce((a, b) => a + b, 0);
  barChart($('#chLevels'), { aria: 'Comparisons spent at each level of the recursion tree', ymax: Math.max(4, ...vals) * 1.15, xTitle: 'Tree level (0 is the root)', yTitle: 'Comparisons',
    series: [{ name: 'Comparisons', color: C.dc }], sub: true,
    groups: lv.map((l, d) => ({ label: 'level ' + d, sub: l.nodes + (l.nodes === 1 ? ' call' : ' calls'), values: [l.comps] })) });
  $('#lvSum').innerHTML = `${vals.join(' + ')} = <b>${sum}</b> = T(${n})` + (isPow2(n) ? ` = 3·${n}/2 − 2` : '');
  playChart($('#chLevels'));
}
function drawStack() {
  const ks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  barChart($('#chStack'), { aria: 'Stack frames needed for n equal to powers of two', ymax: 10, xTitle: 'Array size n', yTitle: 'Stack frames',
    series: [{ name: 'Frames', color: C.lb }], groups: ks.map(k => ({ label: String(2 ** k), values: [k] })) });
  playChart($('#chStack'));
}

/* ---- compare ---- */
function drawCompare(replayAnim) {
  const n = +$('#cmN').value; $('#cmNOut').textContent = n;
  const a = scanCost(n), t = Trec(n), lb = lowerBound(n);
  const rows = [['Scan 2(n − 1)', a, C.scan], ['Divide and conquer', t, C.dc], ['Lower bound ⌈3n/2⌉ − 2', lb, C.lb]];
  const host = $('#hbars');
  if (!host.children.length) rows.forEach(() => host.appendChild(el('div', 'hrow', '<span></span><div class="htrack"><i></i></div><b></b>')));
  if (replayAnim === true) { $$('i', host).forEach(b => { b.style.transition = 'none'; b.style.width = '0%'; }); void host.offsetWidth; $$('i', host).forEach(b => { b.style.transition = ''; }); }
  rows.forEach((r, i) => {
    const row = host.children[i];
    $('span', row).textContent = r[0]; $('b', row).textContent = r[1];
    const bar = $('i', row); bar.style.background = r[2]; bar.style.width = (a ? r[1] / a * 100 : 0) + '%';
  });
  const saved = a - t, p = a ? saved / a * 100 : 0;
  $('#saving').innerHTML = `At n = ${n}, divide and conquer saves <b>${saved}</b> comparisons (<b>${p.toFixed(1)}%</b>). ` +
    (t === lb ? 'This matches the lower bound, so no comparison-based method can do better.' : `The lower bound is ${lb}; the extra ${t - lb} appear because n is not a power of 2.`);
}

/* ================= test cases ================= */
const CASES = [
  ['Normal array', [5, 2, 9, 1]], ['Negative numbers', [-5, -2, -9]], ['Duplicate values', [5, 5, 5, 5]], ['Sorted ascending', [1, 2, 3, 4]],
  ['Sorted descending', [9, 7, 5, 1]], ['Single element', [42]], ['Two elements', [90, 10]], ['Odd length', [7, 3, 11, 2, 8]],
  ['Eight elements (2³)', [38, 12, 77, 5, 41, 90, 23, 66]], ['Six elements (3·2¹)', [9, 4, 7, 1, 8, 3]], ['Mixed signs', [-3, 8, 0, -12, 15, 4, -7]], ['All equal negatives', [-1, -1, -1]]
];
function checkArray(arr, given) {
  const tr = given || buildTrace(arr), r = tr.root;
  const okVals = r.min === Math.min(...arr) && r.max === Math.max(...arr);
  const okIdx = arr[r.minI] === r.min && arr[r.maxI] === r.max;
  const okCount = tr.total === Trec(arr.length);
  return { tr, min: r.min, max: r.max, ok: okVals && okIdx && okCount };
}
function initTests() {
  const body = $('#testTable tbody'); body.innerHTML = '';
  CASES.forEach(([name, arr], i) => {
    const tr = el('tr', '', `<td>${name}</td><td class="mono">[${arr.join(', ')}]</td><td>${arr.length}</td><td class="mn">–</td><td class="mx">–</td><td class="cm">–</td><td>${Trec(arr.length)}</td><td><span class="badge">Pending</span></td><td><button class="btn sm" data-go="lab" data-load="${arr.join(',')}">Open in lab</button></td>`);
    body.appendChild(tr);
  });
}
let testsRan = false;
async function runTests(animated) {
  testsRan = true;
  const rows = $$('#testTable tbody tr');
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (animated) { row.classList.add('run'); await new Promise(r => setTimeout(r, RM ? 0 : 260)); }
    const res = checkArray(CASES[i][1], await traceFor(CASES[i][1]));
    $('.mn', row).textContent = res.min; $('.mx', row).textContent = res.max; $('.cm', row).textContent = res.tr.total;
    const b = $('.badge', row); b.textContent = res.ok ? 'Passed' : 'Failed'; b.className = 'badge ' + (res.ok ? 'ok' : 'bad');
    row.classList.remove('run');
  }
}
let stressBusy = false;
function runStress() {
  if (stressBusy) return; stressBusy = true;
  const TOTAL = 2000, bar = $('#stressBar'), title = $('#stressTitle'), sub = $('#stressSub');
  let done = 0, pass = 0, firstFail = null, cmpSum = 0;
  title.textContent = 'Stress test running';
  const batch = () => {
    for (let k = 0; k < 100 && done < TOTAL; k++, done++) {
      const n = 1 + Math.floor(Math.random() * 40), span = Math.random() < .4 ? 4 : 100;
      const arr = Array.from({ length: n }, () => Math.floor(Math.random() * (2 * span + 1)) - span);
      const r = checkArray(arr); cmpSum += r.tr.total;
      if (r.ok) pass++; else if (!firstFail) firstFail = arr;
    }
    bar.style.width = (done / TOTAL * 100) + '%';
    sub.textContent = `${fmt(done)} / ${fmt(TOTAL)} arrays checked`;
    if (done < TOTAL) setTimeout(batch, 0);
    else {
      stressBusy = false;
      title.textContent = pass === TOTAL ? `All ${fmt(TOTAL)} random arrays passed` : `${fmt(TOTAL - pass)} arrays failed`;
      sub.textContent = pass === TOTAL ? `Min, max, index and comparison count verified for each array (${fmt(cmpSum)} comparisons counted in total).` : 'First failing array: [' + firstFail.join(', ') + ']';
    }
  };
  bar.style.width = '0%'; batch();
}

/* ================= trace provider: Python first, JavaScript as fallback ================= */
// When the page is opened through server.py, steps come from algorithm.py (Python).
// When index.html is opened directly from a folder, the same algorithm runs in JavaScript.
const Engine = { kind: 'js', checked: false };
async function pyFetch(url, opts) {
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 2500);
  try { const r = await fetch(url, Object.assign({ signal: ctl.signal }, opts)); return r.ok ? await r.json() : null; }
  catch (_) { return null; } finally { clearTimeout(timer); }
}
async function traceFor(arr) {
  if (/^https?:$/.test(location.protocol) && Engine.kind !== 'off') {
    const d = await pyFetch('/api/trace', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ array: arr }) });
    if (d && d.events) { d.root = d.nodes[0]; Engine.kind = 'python'; setEngineBadge(); return d; }
    Engine.kind = 'js'; setEngineBadge();
  }
  return buildTrace(arr);
}
function setEngineBadge() {
  const py = Engine.kind === 'python';
  $$('.engine').forEach(b => { b.textContent = py ? 'Engine: Python (algorithm.py)' : 'Engine: JavaScript (offline)'; b.classList.toggle('py', py); });
}

/* ================= live lab ================= */
const PRESETS = [
  ['Sample, n = 8', '38, 12, 77, 5, 41, 90, 23, 66'], ['n = 6 (not a power of 2)', '9, 4, 7, 1, 8, 3'], ['n = 16', '23, 91, 4, 58, 77, 12, 66, 35, 8, 49, 100, 2, 71, 30, 85, 17'],
  ['Descending', '90, 70, 50, 30, 20, 10, 5, 1'], ['Duplicates', '7, 7, 3, 3, 9, 9, 3, 7'], ['Negatives', '-4, 15, -22, 8, 0, -9, 31, -17'], ['Odd, n = 7', '14, 3, 27, 9, 21, 5, 33']
];
const Lab = {
  idx: -1, playing: false, speed: 1, timer: 0, started: false, typing: null, last: -1, loading: false, loadId: 0, wantPlay: false,
  init() {
    this.bars = new Bars($('#labBars'));
    this.wrap = $('#treeWrap'); this.svg = $('#labTree');
    this.sol = $('#solution'); this.code = $('#labCode');
    PSEUDO.forEach(l => this.code.appendChild(el('li', '', l.replace(/</g, '&lt;'))));
    this.codeLines = $$('li', this.code);
    const pre = $('#presets');
    PRESETS.forEach(([name, v]) => { const b = el('button', '', name); b.type = 'button'; b.addEventListener('click', () => { $('#labArr').value = v; this.submit(); }); pre.appendChild(b); });
    $('#labForm').addEventListener('submit', e => { e.preventDefault(); this.submit(); });
    $('#labRandom').addEventListener('click', () => {
      const n = 6 + Math.floor(Math.random() * 11);
      $('#labArr').value = Array.from({ length: n }, () => Math.floor(Math.random() * 99) + 1).join(', '); this.submit();
    });
    $('#cPlay').addEventListener('click', () => this.toggle());
    $('#cNext').addEventListener('click', () => { this.pause(); this.step(1); });
    $('#cPrev').addEventListener('click', () => { this.pause(); this.step(-1); });
    $('#cRestart').addEventListener('click', () => { this.restart(true); });
    $('#cEnd').addEventListener('click', () => { this.pause(); this.goTo(this.tr.events.length - 1, false); });
    $('#cTime').addEventListener('input', e => { this.pause(); this.goTo(+e.target.value, false); });
    $$('#speedSeg button').forEach(b => b.addEventListener('click', () => {
      this.speed = +b.dataset.s; $$('#speedSeg button').forEach(x => x.classList.toggle('on', x === b));
    }));
    this.treeOpts = { follow: true, speed: () => this.speed };
    const first = [38, 12, 77, 5, 41, 90, 23, 66];
    this.apply(first, buildTrace(first), false);
    this.load(first, false);
    new ResizeObserver(() => { if (this.tree && $('#lab').classList.contains('active')) this.tree.fit(); }).observe(this.wrap);
  },
  parse(raw) {
    const toks = raw.split(/[\s,;]+/).filter(Boolean);
    if (!toks.length) throw new Error('Enter at least one whole number, for example 38, 12, 77, 5.');
    if (toks.length > 24) throw new Error('The live lab shows up to 24 numbers so the tree stays readable. You entered ' + toks.length + '.');
    return toks.map(t => { if (!/^[-+]?\d+$/.test(t)) throw new Error(`"${t}" is not a whole number. Use integers separated by commas or spaces.`); return parseInt(t, 10); });
  },
  submit() {
    const err = $('#labErr');
    try { const arr = this.parse($('#labArr').value); err.hidden = true; this.load(arr, true); }
    catch (e) { err.textContent = e.message; err.hidden = false; }
  },
  async load(arr, auto) {
    this.pause(); this.started = true; this.loading = true;
    const id = ++this.loadId, tr = await traceFor(arr);
    if (id !== this.loadId) return;
    this.loading = false; this.apply(arr, tr, auto);
  },
  apply(arr, tr, auto) {
    this.pause(); this.started = true; this.arr = arr; this.tr = tr; this.idx = -1; this.last = -1;
    $$('#presets button').forEach(b => b.classList.toggle('on', false));
    this.bars.set(arr);
    this.tree = new TreeView(this.svg, this.tr, Object.assign({ minScale: .85, maxScale: 1.3 }, this.treeOpts));
    $('#cTime').max = this.tr.events.length - 1; $('#cTime').value = -1;
    $('#sTarget').textContent = `T(${arr.length}) = ${this.tr.total} · scan = ${scanCost(arr.length)}`;
    $('#sCallsOf').textContent = `of ${this.tr.nodes.length} in total`;
    $('#sDepthOf').textContent = `at most ${this.tr.maxDepth + 1}`;
    $('#labArr').value = arr.join(', ');
    this.render(-1, false);
    requestAnimationFrame(() => this.tree.fit());
    if (auto || this.wantPlay) { this.wantPlay = false; this.play(); }
  },
  enter() {
    if (this.loading) { this.wantPlay = true; return; }
    if (!this.started) this.load(this.arr, true); else if (!this.playing && this.idx < 0) this.play();
    this.tree.fit();
  },
  leave() { this.pause(); },
  restart(play) { this.pause(); this.goTo(-1, false); if (play) this.play(); },
  toggle() { this.playing ? this.pause() : this.play(); },
  play() {
    if (this.idx >= this.tr.events.length - 1) this.goTo(-1, false);
    this.playing = true; this.syncPlay(); this.schedule(250);
  },
  pause() { this.playing = false; clearTimeout(this.timer); this.syncPlay(); },
  syncPlay() {
    $('#playIcon').innerHTML = this.playing ? '<path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/>' : '<path d="M8 5l12 7-12 7z" fill="currentColor"/>';
    $('#cPlay').setAttribute('aria-label', this.playing ? 'Pause' : 'Play');
  },
  weight(e) { return { CALL: .75, BASE: .85, DIVIDE: 1.05, COMPARE: 1.2, COMBINE: 1.2, SOLVED: .8, RESULT: 1 }[e.tag] || 1; },
  schedule(delay) {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      if (!this.playing) return;
      if (this.idx >= this.tr.events.length - 1) { this.pause(); return; }
      this.step(1, true);
      if (this.idx >= this.tr.events.length - 1) { this.pause(); return; }
      this.schedule(1350 / this.speed * this.weight(this.tr.events[this.idx]));
    }, delay);
  },
  step(d, animate) { const i = clamp(this.idx + d, -1, this.tr.events.length - 1); this.goTo(i, !!animate && d === 1); },
  goTo(i, animate) { this.idx = i; this.render(i, animate); },
  render(i, animate) {
    const tr = this.tr, e = i >= 0 ? tr.events[i] : null, st = replay(tr, i);
    this.tree.apply(st, e, animate);
    this.bars.apply(e, tr);
    // stats
    const setNum = (id, v) => { const n = $(id); if (n.textContent !== String(v)) { n.textContent = v; n.classList.remove('bump'); void n.offsetWidth; if (animate) n.classList.add('bump'); } };
    setNum('#sCmp', st.comps); setNum('#sCalls', st.calls); setNum('#sDepth', st.stack.length);
    $('#sMeter').style.width = (st.comps / tr.total * 100) + '%';
    setNum('#rMin', st.reg.min == null ? '–' : st.reg.min); setNum('#rMax', st.reg.max == null ? '–' : st.reg.max);
    $('#rMinSrc').textContent = st.reg.minSrc ? 'from ' + st.reg.minSrc : ' ';
    $('#rMaxSrc').textContent = st.reg.maxSrc ? 'from ' + st.reg.maxSrc : ' ';
    // pseudocode
    this.codeLines.forEach((li, k) => li.classList.toggle('hl', !!e && e.line.includes(k + 1)));
    // stack
    const stk = $('#labStack'); stk.innerHTML = '';
    if (!st.stack.length) stk.appendChild(el('span', 'empty', i < 0 ? 'No calls yet' : 'Empty: all calls returned'));
    st.stack.forEach((id, k) => { const n = tr.nodes[id]; stk.appendChild(el('div', 'frame' + (k === st.stack.length - 1 ? ' top' : ''), `FMM(${n.lo}, ${n.hi})`)); });
    // timeline
    $('#cTime').value = i;
    $('#cStep').textContent = i < 0 ? 'Ready' : `Step ${i + 1} / ${tr.events.length}`;
    // solution
    this.writeSolution(i, animate);
    // result
    const res = $('#result');
    if (e && e.type === 'final') {
      const ok = tr.root.min === Math.min(...tr.arr) && tr.root.max === Math.max(...tr.arr) && tr.total === Trec(tr.arr.length);
      res.hidden = false;
      res.innerHTML = `${ok ? '✔ Verified' : '✖ Mismatch'}: min = <b>${tr.root.min}</b> at A[${tr.root.minI}], max = <b>${tr.root.max}</b> at A[${tr.root.maxI}]. ` +
        `${tr.total} comparisons, ${scanCost(tr.arr.length) - tr.total} fewer than the scan.`;
    } else res.hidden = true;
  },
  lineEl(e) {
    const d = el('div', 'sl');
    d.innerHTML = `<span class="sn">${e.idx + 1}</span><span class="stag t-${e.tag}">${TAGNAME[e.tag]}</span><span class="stext"></span>`;
    return d;
  },
  writeSolution(i, animate) {
    if (this.typing) { this.typing.finish(); this.typing = null; }
    const host = this.sol, tr = this.tr;
    if (animate && i === this.last + 1 && i >= 0) {
      const e = tr.events[i], d = this.lineEl(e); host.appendChild(d);
      const ms = RM ? 0 : clamp(1350 / this.speed * .62, 0, e.text.length * 14);
      this.typing = typeHTML($('.stext', d), e.text, ms);
    } else {
      host.innerHTML = '';
      if (i < 0) host.appendChild(el('div', 'muted', 'Press play, or step forward, and each move is written here.'));
      for (let k = 0; k <= i; k++) { const d = this.lineEl(tr.events[k]); d.style.animation = 'none'; $('.stext', d).innerHTML = tr.events[k].text; host.appendChild(d); }
    }
    this.last = i;
    host.scrollTop = host.scrollHeight;
  },
  loadString(s) { $('#labArr').value = s.split(',').join(', '); this.submit(); }
};

/* ================= hero demo ================= */
const Hero = {
  timer: 0, idx: -1,
  init() {
    this.tr = buildTrace([14, 3, 27, 9, 21, 5, 33, 12]);
    this.bars = new Bars($('#heroBars')); this.bars.set(this.tr.arr);
    this.tree = new TreeView($('#heroTree'), this.tr, { autoFit: false });
    this.paint(-1, false);
  },
  paint(i, animate) {
    const e = i >= 0 ? this.tr.events[i] : null, st = replay(this.tr, i);
    this.tree.apply(st, e, animate); this.bars.apply(e, this.tr);
    $('#heroComps').textContent = st.comps;
    const m = $('#heroMsg'); m.innerHTML = e ? e.text : 'Array of 8 numbers, ready to split.';
  },
  enter() { this.leave(); this.tick(900); },
  leave() { clearTimeout(this.timer); },
  tick(delay) {
    this.timer = setTimeout(() => {
      if (this.idx >= this.tr.events.length - 1) { this.idx = -1; this.paint(-1, false); this.tick(1100); return; }
      this.idx++; this.paint(this.idx, true);
      this.tick(this.idx >= this.tr.events.length - 1 ? 3200 : 850 * (Lab.weight(this.tr.events[this.idx])));
    }, delay);
  }
};

/* ================= paradigm diagram ================= */
const SD = {
  timer: 0, phase: -1, running: true, ARR: [7, 3, 9, 1, 8, 4, 6, 2],
  CAP: [
    'Start with the whole array: 8 elements.',
    '<b style="color:var(--divide)">Divide.</b> mid splits it into two halves of 4.',
    '<b style="color:var(--divide)">Divide again.</b> Each half splits into pieces of 2. Pairs are the base case, so we stop here.',
    '<b style="color:var(--base)">Conquer.</b> One comparison per pair gives its min and max: 4 comparisons.',
    '<b style="color:var(--combine)">Combine.</b> Compare the two mins and the two maxes of each half: 2 comparisons each, 4 more.',
    '<b style="color:var(--combine)">Combine the halves.</b> Two last comparisons give the answer: min 1, max 9.'
  ],
  COUNT: [0, 0, 0, 4, 8, 10],
  init() {
    const host = $('#sd'), A = this.ARR; host.innerHTML = '';
    const mm = (lo, hi) => { const s = A.slice(lo, hi + 1); return [Math.min(...s), Math.max(...s)]; };
    const rows = [[[0, 7]], [[0, 3], [4, 7]], [[0, 1], [2, 3], [4, 5], [6, 7]]];
    this.rows = rows.map((r, ri) => {
      const row = el('div', 'sd-row');
      const boxes = r.map(([lo, hi]) => {
        const b = el('div', 'sd-box'); b.style.gridColumn = `span ${hi - lo + 1}`;
        const [mn, mx] = mm(lo, hi);
        b.innerHTML = `<div class="sd-vals">${A.slice(lo, hi + 1).join(' ')}</div><div class="sd-res"><span class="mm mn">min ${mn}</span><span class="mm mx">max ${mx}</span></div>`;
        row.appendChild(b); return b;
      });
      host.appendChild(row); return boxes;
    });
    $('#sdToggle').addEventListener('click', () => { this.running = !this.running; $('#sdToggle').textContent = this.running ? 'Pause' : 'Play'; if (this.running) this.tick(600); else clearTimeout(this.timer); });
    $('#sdReplay').addEventListener('click', () => { this.phase = -1; this.running = true; $('#sdToggle').textContent = 'Pause'; clearTimeout(this.timer); this.tick(200); });
    this.show(5);
  },
  show(p) {
    this.phase = p;
    const vis = { 0: [1, 0, 0], 1: [1, 1, 0], 2: [1, 1, 1], 3: [1, 1, 1], 4: [1, 1, 1], 5: [1, 1, 1] }[p];
    const res = { 3: [0, 0, 1], 4: [0, 1, 1], 5: [1, 1, 1] }[p] || [0, 0, 0];
    this.rows.forEach((boxes, ri) => boxes.forEach(b => {
      b.classList.toggle('show', !!vis[ri]); $('.sd-res', b).classList.toggle('show', !!res[ri]);
      b.classList.toggle('dv', p <= 2 && !!vis[ri] && ri === p); b.classList.toggle('glow', !!res[ri] && ((p === 3 && ri === 2) || (p === 4 && ri === 1) || (p === 5 && ri === 0)));
    }));
    $('#sdCaption').innerHTML = this.CAP[p];
    const c = $('#sdCount'), v = String(this.COUNT[p]); if (c.textContent !== v) { c.textContent = v; c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); }
  },
  enter() { this.leave(); this.phase = -1; if (this.running) this.tick(500); else this.show(5); },
  leave() { clearTimeout(this.timer); },
  tick(delay) {
    this.timer = setTimeout(() => {
      this.show(this.phase >= 5 ? 0 : this.phase + 1);
      if (this.running) this.tick(this.phase === 5 ? 3400 : 2100);
    }, delay);
  }
};

/* ================= algorithm code tabs ================= */
const CODE = {
  pseudo: [
    ['FIND-MIN-MAX(A, low, high)', 'The function. It finds the min and max of A from index low to index high.'],
    ['  if low = high', 'Only one element is left in this part.'],
    ['      return (A[low], A[low])', 'That element is both the min and the max. 0 comparisons.'],
    ['  if high = low + 1', 'Exactly two elements are left in this part.'],
    ['      if A[low] ≤ A[high]', 'Compare the two elements. This is the 1 comparison for a pair.'],
    ['          return (A[low], A[high])', 'The first is smaller: it is the min, the second is the max.'],
    ['      else return (A[high], A[low])', 'The second is smaller: it is the min, the first is the max.'],
    ['  mid ← ⌊(low + high) / 2⌋', 'DIVIDE: find the middle index so we can cut the part into two halves.'],
    ['  (min1, max1) ← FIND-MIN-MAX(A, low, mid)', 'CONQUER: solve the left half by calling the same function.'],
    ['  (min2, max2) ← FIND-MIN-MAX(A, mid + 1, high)', 'CONQUER: solve the right half the same way.'],
    ['  min ← (min1 ≤ min2) ? min1 : min2', 'COMBINE: the smaller of the two mins is the real min. 1 comparison.'],
    ['  max ← (max1 ≥ max2) ? max1 : max2', 'COMBINE: the larger of the two maxes is the real max. 1 comparison.'],
    ['  return (min, max)', 'Send the answer back to whoever called this function.']
  ],
  python: [
    ['def find_min_max(a, low, high, count):', 'The function. count[0] keeps the number of comparisons.'],
    ['    if low == high:', 'Only one element is left in this part.'],
    ['        return a[low], a[low]', 'It is both min and max. No comparison needed.'],
    ['    if high == low + 1:', 'Exactly two elements are left in this part.'],
    ['        count[0] += 1', 'We will compare them once, so add 1 to the counter.'],
    ['        if a[low] <= a[high]:', 'The one comparison for the pair.'],
    ['            return a[low], a[high]', 'First is smaller: (min, max) = (first, second).'],
    ['        return a[high], a[low]', 'Otherwise the second is smaller: (min, max) = (second, first).'],
    ['    mid = (low + high) // 2', 'DIVIDE: the middle index (// drops the decimal part).'],
    ['    min1, max1 = find_min_max(a, low, mid, count)', 'CONQUER: solve the left half.'],
    ['    min2, max2 = find_min_max(a, mid + 1, high, count)', 'CONQUER: solve the right half.'],
    ['    count[0] += 1', 'COMBINE: we compare the two minimums once.'],
    ['    mn = min1 if min1 <= min2 else min2', 'Keep the smaller minimum.'],
    ['    count[0] += 1', 'COMBINE: we compare the two maximums once.'],
    ['    mx = max1 if max1 >= max2 else max2', 'Keep the larger maximum.'],
    ['    return mn, mx', 'Give the answer back to the caller.'],
    ['count = [0]', 'Start the comparison counter at 0.'],
    ['lo, hi = find_min_max(arr, 0, len(arr) - 1, count)', 'Run the function on the whole array.'],
    ['print(lo, hi, count[0])', 'Show the min, the max and the number of comparisons.']
  ]
};
function colorCode(s, lang) {
  let x = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const kw = lang === 'python' ? /\b(def|if|else|return|print|len)\b/g : /\b(if|else|return)\b/g;
  x = x.replace(kw, '<span class="k">$1</span>').replace(/\b(FIND-MIN-MAX|find_min_max)\b/g, '<span class="f">$1</span>');
  return x;
}
function initCode() {
  const block = $('#codeBlock'); let tab = 'pseudo';
  const show = t => {
    tab = t; block.innerHTML = '';
    CODE[t].forEach(([code, note], i) => {
      const row = el('div', 'cl');
      row.innerHTML = `<span class="ln">${i + 1}</span><code>${colorCode(code, t)}</code><span class="cm">${note}</span>`;
      block.appendChild(row);
    });
    $$('#codeTabs button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === t)));
  };
  $$('#codeTabs button').forEach(b => b.addEventListener('click', () => show(b.dataset.tab)));
  $('#copyCode').addEventListener('click', async e => {
    const btn = e.currentTarget, mark = tab === 'python' ? '# ' : '// ';
    const text = CODE[tab].map(([c, m]) => c.padEnd(54) + mark + m).join('\n');
    try { await navigator.clipboard.writeText(text); btn.textContent = 'Copied'; }
    catch (_) { const r = document.createRange(); r.selectNodeContents(block); const s = getSelection(); s.removeAllRanges(); s.addRange(r); btn.textContent = 'Selected'; }
    setTimeout(() => { btn.textContent = 'Copy'; }, 1400);
  });
  show(tab);
}

/* ================= derivation writer ================= */
const DERIV = [
  { why: 'Start from the recurrence, for n = 2<sup>k</sup>', m: 'T(n) = 2·T(n/2) + 2,    T(2) = 1' },
  { why: 'Substitute T(n/2) = 2·T(n/4) + 2', m: 'T(n) = 2[2·T(n/4) + 2] + 2 = 4·T(n/4) + 4 + 2' },
  { why: 'Substitute once more', m: 'T(n) = 4[2·T(n/8) + 2] + 4 + 2 = 8·T(n/8) + 8 + 4 + 2' },
  { why: 'The pattern after k substitutions', m: 'T(n) = 2<sup>k</sup>·T(n/2<sup>k</sup>) + (2<sup>k</sup> + … + 4 + 2) = 2<sup>k</sup>·T(n/2<sup>k</sup>) + 2(2<sup>k</sup> − 1)' },
  { why: 'Stop at the base case T(2)', m: 'n/2<sup>k</sup> = 2   ⇒   2<sup>k</sup> = n/2' },
  { why: 'Replace 2<sup>k</sup> by n/2 and T(2) by 1', m: 'T(n) = (n/2)·1 + 2(n/2 − 1) = n/2 + n − 2' },
  { why: 'Simplify', m: 'T(n) = 3n/2 − 2', final: true }
];
const Deriv = {
  i: 0, typing: null, timer: 0, auto: false, first: true,
  init() {
    this.host = $('#derivation');
    $('#dvNext').addEventListener('click', () => { this.auto = false; this.next(); });
    $('#dvAuto').addEventListener('click', () => { this.auto = true; this.next(); });
    $('#dvReset').addEventListener('click', () => this.reset());
  },
  reset() { clearTimeout(this.timer); if (this.typing) this.typing.finish(); this.typing = null; this.auto = false; this.i = 0; this.host.innerHTML = ''; },
  next() {
    clearTimeout(this.timer);
    if (this.typing) { this.typing.finish(); this.typing = null; }
    if (this.i >= DERIV.length) return;
    const d = DERIV[this.i++];
    const row = el('div', 'dv-step' + (d.final ? ' dv-final' : ''), `<span class="dv-n">${this.i}</span><div class="dv-body"><span class="dv-why">${d.why}</span><span class="dv-math"></span></div>`);
    this.host.appendChild(row);
    this.typing = typeHTML($('.dv-math', row), d.m, RM ? 0 : 1100, () => { this.typing = null; if (this.auto && this.i < DERIV.length) this.timer = setTimeout(() => this.next(), 650); });
  },
  enter() { if (this.first) { this.first = false; this.auto = true; this.timer = setTimeout(() => this.next(), 700); } },
  leave() { clearTimeout(this.timer); }
};

/* ================= viva ================= */
const QA = [
  ['Why does divide and conquer use fewer comparisons than the simple loop?', 'The simple loop makes 2 comparisons for every element. Here, one comparison settles both the min and the max of a pair. Then joining two finished halves always costs just 2 comparisons, however big the halves are. For n = 2<sup>k</sup> the total is 3n/2 − 2 instead of 2n − 2.'],
  ['What is the recurrence and what does it give?', 'T(n) = T(⌈n/2⌉) + T(⌊n/2⌋) + 2, with T(1) = 0 and T(2) = 1. In words: the cost of the whole array is the cost of the left half, plus the right half, plus 2 comparisons to join them. For n = 2<sup>k</sup> it gives 3n/2 − 2, and the Master theorem gives Θ(n).'],
  ['Why do we stop at 2 elements and not at 1?', 'If we went down to 1 element, every join would still cost 2 and the total would be 2n − 2, the same as the simple loop. A pair costs only 1 comparison for both min and max, and that is where the saving comes from.'],
  ['What happens when n is not a power of 2?', 'The count is still exact, but it is a little higher. It stays between 3n/2 − 2 and 5n/3 − 2. For n = 6 we use 8 comparisons, while the best possible is 7.'],
  ['What are the time and space complexity?', 'Time is Θ(n) because every element must be looked at. Extra memory is O(log n) because the recursion is about log<sub>2</sub> n calls deep and we only pass indices, not copies of the array.'],
  ['Is there a best case or worst case?', 'No. The number of comparisons depends only on n, never on the values. Sorted, reversed or random data all cost exactly the same.'],
  ['Is 3n/2 − 2 the best possible?', 'For methods that compare elements, yes. Any such method needs at least ⌈3n/2⌉ − 2 comparisons to find both min and max (Pohl, 1972; CLRS section 9.1). Divide and conquer reaches this exactly when n is a power of 2.'],
  ['Is it faster in real running time?', 'Not always. It saves comparisons, but recursion has its own cost (function calls). In our Python code a plain loop ran faster on the clock. This project counts comparisons, so that is what we report.'],
  ['How are duplicate values handled?', 'For the min we use ≤ and for the max we use ≥, so on a tie we keep the left one. The min and max values are always correct. If values are equal, the reported index may not be the first one.'],
  ['What if the array has one element, or none?', 'One element is returned as both min and max with 0 comparisons. An empty array has no min or max, so the project rejects it with a clear message.'],
  ['How did you check that the code is correct?', 'Each test compares our answer with the built-in min and max, checks the indices, and compares the counted comparisons with the recurrence. The stress test repeats this on 2,000 random arrays.'],
  ['Why not just sort the array?', 'Sorting needs about n log n comparisons. Finding min and max needs only about n, so sorting does much more work than needed.']
];
function initQA() {
  const host = $('#qa'), cols = [el('div', 'qcol'), el('div', 'qcol')];
  cols.forEach(c => host.appendChild(c));
  QA.forEach(([q, a], i) => {
    const d = el('div', 'q');
    d.innerHTML = `<button type="button" aria-expanded="false" id="q${i}">${q}</button><div class="q-a" role="region" aria-labelledby="q${i}"><div><p>${a}</p></div></div>`;
    $('button', d).addEventListener('click', e => { const open = d.classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded', String(open)); });
    cols[i % 2].appendChild(d);
  });
}

/* ================= background animation ================= */
function initBackground() {
  const cv = $('#bg'), ctx = cv.getContext('2d');
  let w = 0, h = 0, nodes = [], streams = [], words = [], col = { node: '44,89,245', text: '24,44,96' };
  const WORDS = ['DIVIDE', 'CONQUER', 'COMBINE', 'MIN', 'MAX', 'T(n) = 2T(n/2) + 2', 'O(n)', '3n/2 − 2', 'mid = ⌊(low+high)/2⌋', 'A[i] ≤ A[j]', 'low … high'];
  const readColors = () => { const cs = getComputedStyle(document.documentElement); col.node = cs.getPropertyValue('--bgfx-node').trim() || col.node; col.text = cs.getPropertyValue('--bgfx-text').trim() || col.text; };
  const seed = () => {
    const count = clamp(Math.round(w * h / 26000), 26, 70);
    nodes = Array.from({ length: count }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .28, vy: (Math.random() - .5) * .28, r: 1.6 + Math.random() * 2.2, p: Math.random() * 6.28 }));
    streams = Array.from({ length: Math.round(w / 110) }, (_, i) => ({ x: i * 110 + 20 + Math.random() * 60, y: Math.random() * h, v: .25 + Math.random() * .5, len: 6 + Math.floor(Math.random() * 8), ch: Array.from({ length: 14 }, () => (Math.random() < .5 ? '0' : '1')) }));
    words = Array.from({ length: Math.min(8, Math.round(w / 190)) }, (_, i) => ({ t: WORDS[i % WORDS.length], x: Math.random() * w, y: Math.random() * h, v: .12 + Math.random() * .2, s: 13 + Math.random() * 9, p: Math.random() * 6.28 }));
  };
  const resize = () => { const dpr = Math.min(devicePixelRatio || 1, 2); w = innerWidth; h = innerHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); seed(); if (RM) draw(0); };
  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    ctx.font = '12px "JetBrains Mono", ui-monospace, monospace'; ctx.textAlign = 'left';
    streams.forEach(s => {
      for (let k = 0; k < s.len; k++) { ctx.fillStyle = `rgba(${col.text},${.11 * (1 - k / s.len)})`; ctx.fillText(s.ch[k], s.x, s.y - k * 16); }
      if (!RM) { s.y += s.v; if (Math.random() < .02) s.ch[Math.floor(Math.random() * s.ch.length)] = Math.random() < .5 ? '0' : '1'; if (s.y - s.len * 16 > h) s.y = -10; }
    });
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy);
        if (d < 150) { ctx.strokeStyle = `rgba(${col.node},${(1 - d / 150) * .24})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      }
    }
    nodes.forEach(n => {
      const pulse = RM ? 1 : 1 + .35 * Math.sin(t / 700 + n.p);
      ctx.fillStyle = `rgba(${col.node},.55)`; ctx.beginPath(); ctx.arc(n.x, n.y, n.r * pulse, 0, 6.283); ctx.fill();
      if (!RM) { n.x += n.vx; n.y += n.vy; if (n.x < -20) n.x = w + 20; if (n.x > w + 20) n.x = -20; if (n.y < -20) n.y = h + 20; if (n.y > h + 20) n.y = -20; }
    });
    words.forEach(o => {
      const a = RM ? .09 : .05 + .07 * (.5 + .5 * Math.sin(t / 2600 + o.p));
      ctx.font = `700 ${o.s}px "Bricolage Grotesque", system-ui, sans-serif`; ctx.fillStyle = `rgba(${col.text},${a})`; ctx.fillText(o.t, o.x, o.y);
      if (!RM) { o.y -= o.v; if (o.y < -30) { o.y = h + 30; o.x = Math.random() * w; } }
    });
  }
  let last = 0;
  const loop = t => { if (t - last > 28) { draw(t); last = t; } requestAnimationFrame(loop); };
  readColors(); resize();
  addEventListener('resize', resize);
  new MutationObserver(readColors).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => setTimeout(readColors, 50));
  if (!RM) requestAnimationFrame(loop);
}

/* ================= slide manager ================= */
const NAMES = { home: 'Home', problem: 'Problem', paradigm: 'Paradigm', algorithm: 'Algorithm', lab: 'Live lab', recurrence: 'Recurrence', tree: 'Tree & stack', growth: 'Growth', compare: 'Compare', tests: 'Tests', viva: 'Viva', end: 'Summary' };
const SLIDES = $$('.slide').map(s => ({ id: s.id, el: s, name: NAMES[s.id] || s.id }));
const stage = $('#stage');
let cur = -1;
const hooks = {
  home: { enter: () => Hero.enter(), leave: () => Hero.leave() },
  problem: { enter: drawProblem },
  paradigm: { enter: () => SD.enter(), leave: () => SD.leave() },
  lab: { enter: () => Lab.enter(), leave: () => Lab.leave() },
  recurrence: { enter: () => Deriv.enter(), leave: () => Deriv.leave() },
  tree: { enter: () => { drawLevels(); drawStack(); } },
  growth: { enter: drawGrowth },
  compare: { enter: () => { drawCompare(true); drawSaving(); } },
  tests: { enter: () => { if (!testsRan) setTimeout(() => runTests(true), 500); } }
};
function go(i) {
  i = clamp(i, 0, SLIDES.length - 1);
  if (i === cur) return;
  stage.dataset.dir = i < cur ? 'back' : 'fwd';
  const prev = SLIDES[cur];
  if (prev) {
    const pe = prev.el; pe.classList.remove('active'); pe.classList.add('leaving'); pe.inert = true;
    setTimeout(() => pe.classList.remove('leaving'), 700);
    if (hooks[prev.id] && hooks[prev.id].leave) hooks[prev.id].leave();
  }
  cur = i;
  const s = SLIDES[i];
  s.el.classList.remove('leaving'); s.el.inert = false; s.el.scrollTop = 0; s.el.classList.add('active');
  $$('.pill').forEach((p, k) => { p.setAttribute('aria-current', String(k === i)); });
  const pill = $$('.pill')[i], pc = $('#pills'); if (pill) pc.scrollTo({ left: pill.offsetLeft - pc.clientWidth / 2 + pill.offsetWidth / 2, behavior: RM ? 'auto' : 'smooth' });
  $('#progressBar').style.width = ((i + 1) / SLIDES.length * 100) + '%';
  $('#navPrev').disabled = i === 0; $('#navNext').disabled = i === SLIDES.length - 1;
  try { history.replaceState(null, '', '#' + s.id); } catch (_) { /* ignore */ }
  document.title = 'AlgoVision Min-Max · ' + s.name;
  if (hooks[s.id] && hooks[s.id].enter) hooks[s.id].enter();
}

function initNav() {
  const pills = $('#pills');
  SLIDES.forEach((s, i) => { const b = el('button', 'pill', s.name); b.type = 'button'; b.addEventListener('click', () => go(i)); pills.appendChild(b); });
  $('#navPrev').addEventListener('click', () => go(cur - 1));
  $('#navNext').addEventListener('click', () => go(cur + 1));
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-go]'); if (!t) return;
    const idx = SLIDES.findIndex(s => s.id === t.dataset.go); if (idx < 0) return;
    const load = t.dataset.load;
    if (load) { Lab.started = true; Lab.load(load.split(',').map(Number), true); }
    go(idx);
  });
  addEventListener('hashchange', () => { const i = SLIDES.findIndex(s => s.id === location.hash.slice(1)); if (i >= 0) go(i); });

  const help = $('#help');
  const toggleHelp = open => { help.hidden = !open; if (open) $('#helpClose').focus(); };
  $('#btnHelp').addEventListener('click', () => toggleHelp(true));
  $('#helpClose').addEventListener('click', () => toggleHelp(false));
  help.addEventListener('click', e => { if (e.target === help) toggleHelp(false); });

  const root = document.documentElement;
  const effective = () => root.dataset.theme || 'light';
  const saved = store.get('algovision-theme'); if (saved === 'light' || saved === 'dark') root.dataset.theme = saved;
  const toggleTheme = () => { const t = effective() === 'dark' ? 'light' : 'dark'; root.dataset.theme = t; store.set('algovision-theme', t); };
  $('#btnTheme').addEventListener('click', toggleTheme);
  const toggleFull = () => { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); else document.documentElement.requestFullscreen().catch(() => {}); };
  $('#btnFull').addEventListener('click', toggleFull);

  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') { if (e.key === 'Escape') e.target.blur(); return; }
    if (e.key === 'Escape') { toggleHelp(false); return; }
    if ((e.key === ' ' || e.key === 'Enter') && tag === 'BUTTON') return;
    const inLab = SLIDES[cur].id === 'lab';
    switch (e.key) {
      case 'ArrowRight': if (inLab) { Lab.pause(); Lab.step(1, true); } else go(cur + 1); break;
      case 'ArrowLeft': if (inLab) { Lab.pause(); Lab.step(-1); } else go(cur - 1); break;
      case 'PageDown': go(cur + 1); break;
      case 'PageUp': go(cur - 1); break;
      case ' ': if (inLab) Lab.toggle(); else return; break;
      case 'f': case 'F': toggleFull(); break;
      case 't': case 'T': toggleTheme(); break;
      case '?': toggleHelp(help.hidden); break;
      default:
        if (/^[1-9]$/.test(e.key)) { go(+e.key - 1); break; }
        return;
    }
    e.preventDefault();
  });
}

function initStatic() {
  const members = CONFIG.members.map(m => `<span class="chip">${m}</span>`).join('');
  $('#teamChips').innerHTML = members; $('#kicker').textContent = CONFIG.course; $('#brandSub').textContent = CONFIG.course;
  $('#teamEnd').innerHTML = members;
  const meta = [CONFIG.course, CONFIG.university, CONFIG.instructor && 'Instructor: ' + CONFIG.instructor, 'Presentation: ' + CONFIG.date].filter(Boolean);
  $('#metaEnd').textContent = meta.join(' · ');
  $('#cmN').addEventListener('input', () => drawCompare());
  $('#lvN').addEventListener('input', drawLevels);
  $('#tRun').addEventListener('click', () => { initTests(); runTests(true); });
  $('#tStress').addEventListener('click', runStress);
  addEventListener('resize', () => { if (Lab.tree) Lab.tree.fit(); });
}

/* ================= mouse effects ================= */
function initMouse() {
  if (RM) return;
  const glow = $('#cursorGlow');
  document.addEventListener('pointermove', e => {
    glow.style.transform = `translate(${e.clientX - 100}px,${e.clientY - 100}px)`; glow.classList.add('on');
    const t = e.target.closest && e.target.closest('.card,.stat,.facts li');
    if (t) { const r = t.getBoundingClientRect(); t.style.setProperty('--mx', (e.clientX - r.left) + 'px'); t.style.setProperty('--my', (e.clientY - r.top) + 'px'); }
  });
  document.addEventListener('pointerleave', () => glow.classList.remove('on'));
  const demo = $('.hero-demo');
  demo.addEventListener('pointermove', e => { const r = demo.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; demo.style.transform = `perspective(900px) rotateY(${x * 2}deg) rotateX(${-y * 2}deg)`; });
  demo.addEventListener('pointerleave', () => { demo.style.transform = ''; });
}

/* ================= boot ================= */
initBackground();
setEngineBadge(); initMouse(); initStatic(); initCode(); initQA(); initTests(); Deriv.init(); SD.init(); Hero.init(); Lab.init(); initNav();
drawCompare();
const startIdx = SLIDES.findIndex(s => s.id === location.hash.slice(1));
SLIDES.forEach(s => { s.el.inert = true; s.el.addEventListener('scroll', () => { if (s.el.scrollLeft) s.el.scrollLeft = 0; }); });
go(startIdx >= 0 ? startIdx : 0);

window.AlgoVision = { traceFor, Engine, buildTrace, replay, Trec, levelCosts, scanCost, lowerBound, checkArray };
})();
