/* ============================================================================
   Painter's kit — small, dependency-free helpers that build hand-painted-looking
   SVG illustrations (foliage, clouds, hills, flowers, garden architecture).
   Every scene is deterministic: the same seed always paints the same picture.
   ============================================================================ */

export const W = 2400;
export const H = 1000;

/* ---------- seeded random ---------- */
export function rng(seed) {
  let a = seed >>> 0;
  const r = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  r.range = (lo, hi) => lo + (hi - lo) * r();
  r.int = (lo, hi) => Math.floor(r.range(lo, hi + 1));
  r.pick = (list) => list[Math.floor(r() * list.length)];
  r.chance = (p) => r() < p;
  return r;
}

/* ---------- number / path helpers ---------- */
export const n = (v) => Math.round(v * 10) / 10;
const pt = (p) => `${n(p[0])},${n(p[1])}`;
export const lerp = (a, b, t) => a + (b - a) * t;

/** Smooth curve through points (Catmull-Rom converted to cubic Béziers). */
export function spline(pts, closed = false) {
  const N = pts.length;
  if (N < 2) return '';
  const at = (i) => (closed ? pts[(i + N) % N] : pts[Math.max(0, Math.min(N - 1, i))]);
  let d = `M${pt(pts[0])}`;
  const segs = closed ? N : N - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${pt(c1)} ${pt(c2)} ${pt(p2)}`;
  }
  return closed ? `${d}Z` : d;
}

/** A band between two edges (used for paths, rivers, carpets). */
export function ribbon(left, right) {
  const back = [...right].reverse();
  return `${spline(left)}L${pt(back[0])}${spline(back).replace(/^M[^C]+/, '')}Z`;
}

/** Organic closed shape — the basic "dab of paint". */
export function blob(r, cx, cy, rad, { k = 9, jit = 0.18, sx = 1, sy = 1 } = {}) {
  const pts = [];
  const off = r() * 6.283;
  for (let i = 0; i < k; i++) {
    const a = off + (i / k) * 6.283;
    const rr = rad * (1 + r.range(-jit, jit));
    pts.push([cx + Math.cos(a) * rr * sx, cy + Math.sin(a) * rr * sy]);
  }
  return spline(pts, true);
}

/** Rolling skyline: returns the top contour as points. */
export function ridge(r, { y, amp = 40, waves = [[1.2, 1], [2.7, 0.45], [5.3, 0.2]], step = 60, x0 = -80, x1 = W + 80, shape }) {
  const ph = waves.map(() => r() * 6.283);
  const pts = [];
  for (let x = x0; x <= x1; x += step) {
    let v = 0;
    waves.forEach(([f, a], i) => { v += Math.sin((x / W) * 6.283 * f + ph[i]) * a; });
    pts.push([x, y - v * amp + (shape ? shape(x) : 0)]);
  }
  return pts;
}

export const ground = (pts, bottom = H + 30) => `${spline(pts)}L${n(pts[pts.length - 1][0])},${bottom}L${n(pts[0][0])},${bottom}Z`;

export function yAt(pts, x) {
  for (let i = 1; i < pts.length; i++) {
    if (x <= pts[i][0]) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      return lerp(y0, y1, (x - x0) / (x1 - x0 || 1));
    }
  }
  return pts[pts.length - 1][1];
}

/* ---------- a sheet of paper: collects defs and artwork ---------- */
const stopList = (stops) => stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a === undefined ? '' : ` stop-opacity="${a}"`}/>`).join('');

export class Sheet {
  constructor(w = W, h = H) {
    this.w = w; this.h = h;
    this.defs = []; this.body = [];
    this.k = 0; this.cache = {};
  }
  id(p = 'i') { return `${p}${(this.k++).toString(36)}`; }
  linear(stops, { x1 = 0, y1 = 0, x2 = 0, y2 = 1, user = false } = {}) {
    const id = this.id('l');
    this.defs.push(`<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${user ? ' gradientUnits="userSpaceOnUse"' : ''}>${stopList(stops)}</linearGradient>`);
    return `url(#${id})`;
  }
  radial(stops, { cx = 0.5, cy = 0.5, r = 0.5 } = {}) {
    const id = this.id('r');
    this.defs.push(`<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stopList(stops)}</radialGradient>`);
    return `url(#${id})`;
  }
  once(key, make) {
    if (!this.cache[key]) this.cache[key] = make();
    return this.cache[key];
  }
  /** Wobbly, hand-cut edges. */
  paint(scale = 7, freq = 0.03) {
    return this.once(`p${scale}/${freq}`, () => {
      const id = this.id('f');
      this.defs.push(`<filter id="${id}" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="${scale}" xChannelSelector="R" yChannelSelector="G"/></filter>`);
      return `url(#${id})`;
    });
  }
  blur(sd) {
    return this.once(`b${sd}`, () => {
      const id = this.id('f');
      this.defs.push(`<filter id="${id}" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="${sd}"/></filter>`);
      return `url(#${id})`;
    });
  }
  glowFill(color) {
    return this.once(`g${color}`, () => this.radial([[0, color, 1], [0.3, color, 0.5], [0.65, color, 0.14], [1, color, 0]]));
  }
  clip(d) {
    const id = this.id('c');
    this.defs.push(`<clipPath id="${id}"><path d="${d}"/></clipPath>`);
    return `url(#${id})`;
  }
  add(...parts) { this.body.push(parts.flat().join('')); return this; }

  /** Finished SVG. `grain` lays a faint paper/brush texture over the painted pixels only. */
  render({ grain = true, scale = 1 } = {}) {
    const gid = 'grain';
    const grainDef = grain
      ? `<filter id="${gid}" x="0" y="0" width="${this.w}" height="${this.h}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">`
        + '<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="11" result="t"/>'
        + '<feColorMatrix in="t" type="matrix" values="0 0 0 0 1  0 0 0 0 0.97  0 0 0 0 0.9  0.42 0 0 0 -0.17" result="light"/>'
        + '<feComposite in="light" in2="SourceAlpha" operator="in" result="lightIn"/>'
        + '<feTurbulence type="fractalNoise" baseFrequency="0.011 0.017" numOctaves="2" seed="5" result="t2"/>'
        + '<feColorMatrix in="t2" type="matrix" values="0 0 0 0 0.1  0 0 0 0 0.07  0 0 0 0 0.2  0.3 0 0 0 -0.125" result="dark"/>'
        + '<feComposite in="dark" in2="SourceAlpha" operator="in" result="darkIn"/>'
        + '<feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="darkIn"/><feMergeNode in="lightIn"/></feMerge></filter>'
      : '';
    const inner = grain ? `<g filter="url(#${gid})">${this.body.join('')}</g>` : this.body.join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.w} ${this.h}" width="${Math.round(this.w * scale)}" height="${Math.round(this.h * scale)}"><defs>${grainDef}${this.defs.join('')}</defs>${inner}</svg>`;
  }
}

/* ---------- light ---------- */
export const glow = (sheet, x, y, rad, color, op = 1) => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(rad)}" fill="${sheet.glowFill(color)}" opacity="${op}"/>`;

/* ---------- foliage ---------- */
/**
 * A mass of leaves painted the way background artists do it: one dark base, a mid tone pushed
 * toward the light, a light tone on top, then loose leaf dabs breaking up the silhouette.
 */
export function foliage(r, { x, y, w, h, pal, puffs = 9, dabs = 34, lx = -0.5, ly = -0.7, rough = 0.2 }) {
  const P = [];
  const m = Math.min(w, h);
  for (let i = 0; i < puffs; i++) {
    const a = r() * 6.283, d = Math.sqrt(r()) * 0.7;
    P.push([x + Math.cos(a) * d * w, y + Math.sin(a) * d * h * 0.8, m * r.range(0.42, 0.64)]);
  }
  const rim = Math.max(6, Math.round(puffs * 0.8));
  for (let i = 0; i < rim; i++) {
    const a = (i / rim) * 6.283 + r() * 0.5;
    P.push([x + Math.cos(a) * w * 0.74, y + Math.sin(a) * h * 0.62, m * r.range(0.3, 0.44)]);
  }
  const b = (cx, cy, rad) => `<path d="${blob(r, cx, cy, rad, { jit: rough })}"/>`;
  const layer = (fill, fn) => `<g fill="${fill}">${P.map(fn).join('')}</g>`;
  let s = layer(pal.dark, ([px, py, pr]) => b(px + pr * 0.05, py + pr * 0.1, pr));
  s += layer(pal.mid, ([px, py, pr]) => b(px + lx * pr * 0.2, py + ly * pr * 0.2, pr * 0.82));
  s += layer(pal.light, ([px, py, pr]) => (py < y + h * 0.3 ? `<path d="${blob(r, px + lx * pr * 0.44, py + ly * pr * 0.44, pr * 0.5, { jit: 0.3, k: 7 })}"/>` : ''));
  let leaves = '';
  // sprays of sunlit leaves where each clump catches the light
  for (const [px, py, pr] of P) {
    if (py > y + h * 0.12) continue;
    const count = 3 + Math.floor(r() * 5);
    for (let i = 0; i < count; i++) {
      const cx = n(px + lx * pr * 0.56 + r.range(-0.42, 0.42) * pr), cy = n(py + ly * pr * 0.56 + r.range(-0.34, 0.34) * pr);
      const sz = m * r.range(0.04, 0.072);
      leaves += `<ellipse cx="${cx}" cy="${cy}" rx="${n(sz)}" ry="${n(sz * 0.52)}" fill="${pal.hi}" transform="rotate(${n(r.range(0, 180))} ${cx} ${cy})"/>`;
    }
  }
  for (let i = 0; i < dabs; i++) {
    const a = r() * 6.283, d = Math.sqrt(r()) * 1.04;
    const dx = Math.cos(a) * d * w, dy = Math.sin(a) * d * h * 0.9;
    const lit = (dx * lx + dy * ly) / Math.hypot(w, h);
    const col = lit > 0.14 ? r.pick([pal.hi, pal.light, pal.light]) : lit > -0.08 ? r.pick([pal.light, pal.mid]) : r.pick([pal.mid, pal.dark, pal.dark]);
    const sz = m * r.range(0.035, 0.075);
    const cx = n(x + dx), cy = n(y + dy);
    leaves += `<ellipse cx="${cx}" cy="${cy}" rx="${n(sz)}" ry="${n(sz * 0.5)}" fill="${col}" transform="rotate(${n(r.range(0, 180))} ${cx} ${cy})"/>`;
  }
  return s + leaves;
}

export function tree(r, { x, y, s = 1, pal, trunk = '#6f4e3c', trunkDark = '#4b3329', lean = 0, cw = 125, ch = 100, th = 150, lx = -0.5, ly = -0.7, puffs = 10, dabs = 44, shadow = 'rgba(20,50,30,.22)' }) {
  const tw = 15 * s, hgt = th * s;
  const cx = x + lean * s, cy = y - hgt - ch * s * 0.42;
  const trunkD = `M${n(x - tw)},${n(y)}C${n(x - tw * 0.55)},${n(y - hgt * 0.5)} ${n(cx - tw * 0.5)},${n(y - hgt * 0.85)} ${n(cx - tw * 0.4)},${n(y - hgt * 1.2)}L${n(cx + tw * 0.4)},${n(y - hgt * 1.2)}C${n(cx + tw * 0.5)},${n(y - hgt * 0.85)} ${n(x + tw * 0.55)},${n(y - hgt * 0.5)} ${n(x + tw)},${n(y)}Z`;
  const shade = `M${n(x + tw * 0.2)},${n(y)}C${n(x + tw * 0.3)},${n(y - hgt * 0.5)} ${n(cx + tw * 0.2)},${n(y - hgt * 0.85)} ${n(cx + tw * 0.15)},${n(y - hgt * 1.2)}L${n(cx + tw * 0.4)},${n(y - hgt * 1.2)}C${n(cx + tw * 0.5)},${n(y - hgt * 0.85)} ${n(x + tw * 0.55)},${n(y - hgt * 0.5)} ${n(x + tw)},${n(y)}Z`;
  const branch = (dir) => `<path d="M${n(cx)},${n(y - hgt * 0.78)}Q${n(cx + dir * 30 * s)},${n(y - hgt * 0.95)} ${n(cx + dir * 62 * s)},${n(y - hgt * 1.12)}" stroke="${trunk}" stroke-width="${n(7 * s)}" fill="none" stroke-linecap="round"/>`;
  return [
    shadow ? `<ellipse cx="${n(x + 26 * s)}" cy="${n(y + 2 * s)}" rx="${n(cw * s * 0.95)}" ry="${n(13 * s)}" fill="${shadow}"/>` : '',
    branch(-1), branch(1),
    `<path d="${trunkD}" fill="${trunk}"/><path d="${shade}" fill="${trunkDark}"/>`,
    foliage(r, { x: cx, y: cy, w: cw * s, h: ch * s, pal, puffs, dabs, lx, ly }),
  ].join('');
}

export function cypress(r, { x, y, s = 1, pal, lx = -0.5, hgt = 300, wid = 40 }) {
  const h = hgt * s, w = wid * s;
  const body = `M${n(x)},${n(y)}C${n(x - w * 1.25)},${n(y - h * 0.18)} ${n(x - w * 0.95)},${n(y - h * 0.82)} ${n(x)},${n(y - h)}C${n(x + w * 0.95)},${n(y - h * 0.82)} ${n(x + w * 1.25)},${n(y - h * 0.18)} ${n(x)},${n(y)}Z`;
  const side = lx < 0 ? -1 : 1;
  const lit = `M${n(x + side * w * 0.1)},${n(y - h * 0.04)}C${n(x + side * w * 1.05)},${n(y - h * 0.2)} ${n(x + side * w * 0.8)},${n(y - h * 0.8)} ${n(x)},${n(y - h * 0.97)}C${n(x + side * w * 0.25)},${n(y - h * 0.7)} ${n(x + side * w * 0.3)},${n(y - h * 0.3)} ${n(x + side * w * 0.1)},${n(y - h * 0.04)}Z`;
  let dabs = '';
  for (let i = 0; i < 26 * s + 8; i++) {
    const v = r(), u = r.range(-1, 1) * (0.25 + 0.75 * Math.sin(Math.PI * Math.min(0.98, v + 0.06)));
    const px = n(x + u * w * 0.95), py = n(y - v * h * 0.96);
    const col = u * side > 0.1 ? r.pick([pal.light, pal.hi]) : r.pick([pal.mid, pal.dark]);
    dabs += `<ellipse cx="${px}" cy="${py}" rx="${n(w * 0.17)}" ry="${n(w * 0.085)}" fill="${col}" transform="rotate(${n(r.range(40, 140))} ${px} ${py})"/>`;
  }
  return `<ellipse cx="${n(x + 12 * s)}" cy="${n(y)}" rx="${n(w * 1.2)}" ry="${n(7 * s)}" fill="rgba(30,40,30,.2)"/><rect x="${n(x - 4 * s)}" y="${n(y - 14 * s)}" width="${n(8 * s)}" height="${n(16 * s)}" fill="#5a4034"/><path d="${body}" fill="${pal.dark}"/><path d="${lit}" fill="${pal.mid}"/>${dabs}`;
}

/* ---------- flowers & grass ---------- */
export function flower(x, y, s, col, center = '#ffd76a', rot = 0) {
  let p = '';
  for (let i = 0; i < 5; i++) {
    p += `<ellipse cx="${n(x)}" cy="${n(y - s * 0.55)}" rx="${n(s * 0.38)}" ry="${n(s * 0.6)}" transform="rotate(${n(rot + i * 72)} ${n(x)} ${n(y)})"/>`;
  }
  return `<g fill="${col}">${p}</g><circle cx="${n(x)}" cy="${n(y)}" r="${n(s * 0.27)}" fill="${center}"/>`;
}

/** Pom-pom bloom (marigolds, roses seen from afar). */
export function pom(r, x, y, s, col, dark, hi) {
  let p = `<circle cx="${n(x)}" cy="${n(y)}" r="${n(s)}" fill="${dark}"/>`;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * 6.283 + r() * 0.6;
    p += `<circle cx="${n(x + Math.cos(a) * s * 0.42)}" cy="${n(y + Math.sin(a) * s * 0.42)}" r="${n(s * 0.6)}" fill="${col}"/>`;
  }
  return `${p}<circle cx="${n(x - s * 0.2)}" cy="${n(y - s * 0.25)}" r="${n(s * 0.42)}" fill="${hi}"/>`;
}

/** Scatter of blooms with perspective: tiny and dense far away, large and sparse up close. */
export function flowerField(r, { x0 = 0, x1 = W, top, bottom = H, count, colors, far = 3, near = 14, stems = '#3f8a4a', centers = ['#ffd76a', '#ffb347', '#fff2b0'], bias = 0.75, glowSheet, glowColor }) {
  const items = [];
  for (let i = 0; i < count; i++) {
    const x = r.range(x0, x1);
    const yt = typeof top === 'function' ? top(x) : top;
    const d = Math.pow(r(), bias);
    items.push([x, lerp(yt + 6, bottom, d), d]);
  }
  items.sort((a, b) => a[1] - b[1]);
  let s = '';
  for (const [x, y, d] of items) {
    const sz = lerp(far, near, d) * r.range(0.75, 1.25);
    const col = r.pick(colors);
    if (glowSheet && r.chance(0.35)) s += glow(glowSheet, x, y, sz * 3.2, glowColor, 0.5);
    if (sz < 5.2) { s += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(sz * 0.62)}" fill="${col}"/>`; continue; }
    if (stems) s += `<path d="M${n(x)},${n(y)}q${n(r.range(-4, 4))},${n(sz * 1.2)} ${n(r.range(-3, 3))},${n(sz * 2.6)}" stroke="${stems}" stroke-width="${n(sz * 0.16)}" fill="none"/>`;
    s += flower(x, y, sz, col, r.pick(centers), r.range(0, 72));
  }
  return s;
}

export function grass(r, { x0 = 0, x1 = W, y, count, colors, h = 30, w = 3 }) {
  let s = '';
  for (let i = 0; i < count; i++) {
    const x = r.range(x0, x1);
    const yy = (typeof y === 'function' ? y(x) : y) + r.range(-2, 8);
    const hh = h * r.range(0.5, 1.3), dx = r.range(-0.5, 0.5) * hh;
    s += `<path d="M${n(x)},${n(yy)}q${n(dx * 0.2)},${n(-hh * 0.6)} ${n(dx)},${n(-hh)}" stroke="${r.pick(colors)}" stroke-width="${n(w * r.range(0.6, 1.3))}" fill="none" stroke-linecap="round"/>`;
  }
  return s;
}

/** Loose brush streaks that follow the lie of the land. */
export function strokes(r, { x0 = 0, x1 = W, y0, y1, count, colors, w = [4, 14], len = [60, 220], op = [0.1, 0.25], tilt = 0.06 }) {
  let s = '';
  for (let i = 0; i < count; i++) {
    const d = r();
    const x = r.range(x0, x1), y = lerp(y0, y1, d);
    const L = r.range(len[0], len[1]) * (0.5 + d);
    const t = r.range(-tilt, tilt) * L;
    s += `<path d="M${n(x)},${n(y)}q${n(L / 2)},${n(t - r.range(2, 10))} ${n(L)},${n(t)}" stroke="${r.pick(colors)}" stroke-width="${n(lerp(w[0], w[1], d))}" opacity="${n(r.range(op[0], op[1]) * 100) / 100}" fill="none" stroke-linecap="round"/>`;
  }
  return s;
}

/* ---------- clouds ---------- */
export function cloud(r, sheet, { x, y, w, h, pal, lobes = 9 }) {
  const P = [];
  for (let i = 0; i < lobes; i++) {
    const u = Math.min(1, Math.max(0, (i + r.range(-0.2, 0.2)) / (lobes - 1)));
    const bell = Math.pow(Math.sin(Math.PI * u), 0.8);
    const pr = h * (0.2 + 0.3 * bell) * r.range(0.85, 1.15);
    P.push([x + (u - 0.5) * w * 0.84, y - pr * 0.7 - bell * h * 0.12 * r(), pr]);
  }
  for (let i = 0; i < Math.ceil(lobes * 0.6); i++) {
    const u = r.range(0.24, 0.76);
    P.push([x + (u - 0.5) * w * 0.62, y - h * r.range(0.4, 0.72), h * r.range(0.18, 0.3)]);
  }
  const b = (cx, cy, rad) => `<path d="${blob(r, cx, cy, rad, { jit: 0.1, k: 10 })}"/>`;
  const base = `<ellipse cx="${n(x)}" cy="${n(y - h * 0.16)}" rx="${n(w * 0.44)}" ry="${n(h * 0.2)}"/>`;
  // the underside dissolves instead of ending in a hard edge
  const fade = sheet.id('m');
  const fadeFill = sheet.linear([[0, '#fff'], [0.6, '#fff'], [1, '#000']], { user: true, y1: y - h * 0.9, y2: y + h * 0.04 });
  sheet.defs.push(`<mask id="${fade}" maskUnits="userSpaceOnUse" x="${n(x - w)}" y="${n(y - h * 1.6)}" width="${n(w * 2)}" height="${n(h * 2)}"><rect x="${n(x - w)}" y="${n(y - h * 1.6)}" width="${n(w * 2)}" height="${n(h * 2)}" fill="${fadeFill}"/></mask>`);
  return `<g mask="url(#${fade})"><g filter="${sheet.blur(1.6)}">`
    + `<g fill="${pal.deep || pal.shade}" opacity=".9">${base}${P.map(([px, py, pr]) => b(px + pr * 0.06, py + pr * 0.12, pr)).join('')}</g>`
    + `<g fill="${pal.shade}">${P.map(([px, py, pr]) => b(px, py, pr * 0.96)).join('')}</g>`
    + `<g fill="${pal.top}">${P.map(([px, py, pr]) => b(px - pr * 0.1, py - pr * 0.16, pr * 0.86)).join('')}</g>`
    + `<g fill="${pal.rim}">${P.map(([px, py, pr]) => (r.chance(0.7) ? b(px - pr * 0.24, py - pr * 0.34, pr * 0.5) : '')).join('')}</g>`
    + '</g></g>';
}

/* ---------- garden lights ---------- */
export function lantern(sheet, { x, y, s = 1, drop = 40, lit = true, frame = '#3b2a25', glowColor = '#ffc35a', glowSize = 1 }) {
  const by = y + drop, w = 15 * s, h = 25 * s;
  return [
    lit ? glow(sheet, x, by + h * 0.5, 74 * s * glowSize, glowColor, 0.78) : '',
    drop ? `<path d="M${n(x)},${n(y)}V${n(by)}" stroke="${frame}" stroke-width="${n(1.3 * s)}"/>` : '',
    `<path d="M${n(x - w * 0.34)},${n(by)}h${n(w * 0.68)}l${n(w * 0.16)},${n(h * 0.18)}v${n(h * 0.6)}l${n(-w * 0.16)},${n(h * 0.22)}h${n(-w * 0.68)}l${n(-w * 0.16)},${n(-h * 0.22)}v${n(-h * 0.6)}Z" fill="${lit ? '#ffe7a8' : '#e6d3aa'}" stroke="${frame}" stroke-width="${n(1.7 * s)}" stroke-linejoin="round"/>`,
    lit ? `<ellipse cx="${n(x)}" cy="${n(by + h * 0.56)}" rx="${n(w * 0.2)}" ry="${n(h * 0.24)}" fill="#fffbe6"/>` : '',
    `<path d="M${n(x - w * 0.5)},${n(by)}h${n(w)}M${n(x - w * 0.5)},${n(by + h)}h${n(w)}M${n(x)},${n(by + h * 0.18)}v${n(h * 0.62)}" stroke="${frame}" stroke-width="${n(1.7 * s)}" stroke-linecap="round" fill="none"/>`,
  ].join('');
}

export function lampPost(sheet, { x, y, s = 1, lit = true, frame = '#3b2a25', glowColor = '#ffc35a', hgt = 150 }) {
  const top = y - hgt * s;
  return `<path d="M${n(x)},${n(y)}V${n(top + 22 * s)}q0,${n(-22 * s)} ${n(22 * s)},${n(-22 * s)}" stroke="${frame}" stroke-width="${n(3.4 * s)}" fill="none" stroke-linecap="round"/>`
    + `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(9 * s)}" ry="${n(3 * s)}" fill="${frame}"/>`
    + lantern(sheet, { x: x + 22 * s, y: top, s: s * 1.15, drop: 5 * s, lit, frame, glowColor });
}

export function lightString(r, sheet, { x0, y0, x1, y1, sag = 60, count = 18, wire = 'rgba(40,30,40,.55)', bulb = '#fff4cf', glowColor = '#ffd27a', size = 3, hang = 0, hangSheet }) {
  let s = `<path d="M${n(x0)},${n(y0)}Q${n((x0 + x1) / 2)},${n((y0 + y1) / 2 + sag * 2)} ${n(x1)},${n(y1)}" stroke="${wire}" stroke-width="1.4" fill="none"/>`;
  for (let i = 1; i < count; i++) {
    const u = i / count;
    const x = lerp(x0, x1, u), y = lerp(y0, y1, u) + sag * 4 * u * (1 - u);
    s += glow(sheet, x, y + size, size * 5.5, glowColor, 0.6);
    s += `<circle cx="${n(x)}" cy="${n(y + size)}" r="${n(size * r.range(0.8, 1.15))}" fill="${bulb}"/>`;
    if (hang && i % hang === 0) s += lantern(hangSheet || sheet, { x, y, s: 1.05, drop: r.range(26, 64) });
  }
  return s;
}

export function diya(sheet, x, y, s = 1) {
  return glow(sheet, x, y - 6 * s, 34 * s, '#ffb85a', 0.8)
    + `<path d="M${n(x - 11 * s)},${n(y)}q${n(11 * s)},${n(9 * s)} ${n(22 * s)},0z" fill="#b5673a"/>`
    + `<path d="M${n(x)},${n(y - 1 * s)}q${n(-5 * s)},${n(-8 * s)} 0,${n(-17 * s)}q${n(5 * s)},${n(9 * s)} 0,${n(17 * s)}z" fill="#ffe9a6"/>`;
}

/* ---------- garden architecture (original designs) ---------- */
export function domePath(cx, by, w, h) {
  const hw = w / 2;
  return `M${n(cx - hw * 0.8)},${n(by)}C${n(cx - hw * 1.25)},${n(by - h * 0.25)} ${n(cx - hw * 1.05)},${n(by - h * 0.7)} ${n(cx - hw * 0.18)},${n(by - h * 0.9)}C${n(cx - hw * 0.05)},${n(by - h * 0.95)} ${n(cx)},${n(by - h)} ${n(cx)},${n(by - h * 1.1)}C${n(cx)},${n(by - h)} ${n(cx + hw * 0.05)},${n(by - h * 0.95)} ${n(cx + hw * 0.18)},${n(by - h * 0.9)}C${n(cx + hw * 1.05)},${n(by - h * 0.7)} ${n(cx + hw * 1.25)},${n(by - h * 0.25)} ${n(cx + hw * 0.8)},${n(by)}Z`;
}

function dome(sheet, cx, by, w, h, pal) {
  const d = domePath(cx, by, w, h);
  const cid = sheet.clip(d);
  return `<path d="${d}" fill="${pal.domeLight}"/>`
    + `<g clip-path="${cid}"><ellipse cx="${n(cx + w * 0.3)}" cy="${n(by - h * 0.4)}" rx="${n(w * 0.38)}" ry="${n(h * 0.75)}" fill="${pal.domeShade}" opacity=".75"/>`
    + `<ellipse cx="${n(cx - w * 0.2)}" cy="${n(by - h * 0.6)}" rx="${n(w * 0.12)}" ry="${n(h * 0.3)}" fill="#fff" opacity=".5"/></g>`
    + `<path d="M${n(cx)},${n(by - h * 1.08)}v${n(-h * 0.22)}" stroke="${pal.trim}" stroke-width="${n(Math.max(1.5, w * 0.035))}" stroke-linecap="round"/><circle cx="${n(cx)}" cy="${n(by - h * 1.16)}" r="${n(Math.max(2, w * 0.045))}" fill="${pal.trim}"/>`;
}

/** Small domed kiosk on slender columns. */
export function chhatri(sheet, { x, y, s = 1, pal, lit = false }) {
  const w = 120 * s, colH = 86 * s;
  let g = '';
  if (lit) g += glow(sheet, x, y - colH * 0.5, 120 * s, pal.glow || '#ffc86a', 0.8);
  g += `<rect x="${n(x - w * 0.56)}" y="${n(y - 12 * s)}" width="${n(w * 1.12)}" height="${n(12 * s)}" fill="${pal.mid}"/>`;
  g += `<rect x="${n(x - w * 0.42)}" y="${n(y - colH - 12 * s)}" width="${n(w * 0.84)}" height="${n(colH)}" fill="${lit ? (pal.lit || '#ffdf9a') : pal.deep}" opacity="${lit ? 0.95 : 0.55}"/>`;
  for (const u of [-0.42, -0.14, 0.14, 0.42]) {
    g += `<rect x="${n(x + u * w - 4 * s)}" y="${n(y - colH - 12 * s)}" width="${n(8 * s)}" height="${n(colH)}" fill="${u < 0 ? pal.light : pal.mid}"/>`;
  }
  g += `<path d="M${n(x - w * 0.62)},${n(y - colH - 12 * s)}h${n(w * 1.24)}l${n(-w * 0.06)},${n(-10 * s)}h${n(-w * 1.12)}Z" fill="${pal.dark}"/>`;
  g += `<rect x="${n(x - w * 0.4)}" y="${n(y - colH - 34 * s)}" width="${n(w * 0.8)}" height="${n(13 * s)}" fill="${pal.light}"/>`;
  g += dome(sheet, x, y - colH - 34 * s, w * 0.86, 62 * s, pal);
  return g;
}

/** Three-arched garden pavilion (baradari) with corner kiosks and marigold swags. */
export function pavilion(r, sheet, { x, y, s = 1, pal, garlands = true }) {
  const X = (v) => n(x + v * s), Y = (v) => n(y + v * s), S = (v) => n(v * s);
  const bays = [[-237, -123], [-97, 97], [123, 237]];
  const arch = ([l, rr]) => {
    const c = (l + rr) / 2, top = rr - l > 150 ? -246 : -232, sh = rr - l > 150 ? -168 : -176;
    return `M${X(l)},${Y(-40)}L${X(l)},${Y(sh)}Q${X(l)},${Y(top + 14)} ${X(c)},${Y(top)}Q${X(rr)},${Y(top + 14)} ${X(rr)},${Y(sh)}L${X(rr)},${Y(-40)}Z`;
  };
  let g = '';
  // warm, shadowed interior
  g += `<rect x="${X(-262)}" y="${Y(-262)}" width="${S(524)}" height="${S(222)}" fill="${sheet.linear([[0, pal.deep], [0.55, pal.deep2 || pal.deep], [1, pal.inner]])}"/>`;
  g += `<ellipse cx="${X(0)}" cy="${Y(-70)}" rx="${S(120)}" ry="${S(60)}" fill="${sheet.glowFill(pal.glow || '#ffbe6a')}" opacity=".7"/>`;
  // far-side arches seen through the bays
  for (const [l, rr] of bays) {
    const c = (l + rr) / 2, hw = (rr - l) * 0.3;
    g += `<path d="M${X(c - hw)},${Y(-40)}V${Y(-150)}Q${X(c - hw)},${Y(-205)} ${X(c)},${Y(-212)}Q${X(c + hw)},${Y(-205)} ${X(c + hw)},${Y(-150)}V${Y(-40)}Z" fill="${pal.sky || '#ffd9a0'}" opacity=".5"/>`;
  }
  // facade with arched openings
  g += `<path fill-rule="evenodd" d="M${X(-264)},${Y(-264)}H${X(264)}V${Y(-40)}H${X(-264)}Z ${bays.map(arch).join(' ')}" fill="${sheet.linear([[0, pal.light], [1, pal.mid]], { x1: 0, y1: 0, x2: 1, y2: 0.4 })}"/>`;
  // scalloped cusps along each arch
  for (const [l, rr] of bays) {
    const c = (l + rr) / 2, hw = (rr - l) / 2, top = rr - l > 150 ? -246 : -232;
    for (let i = 1; i < 8; i++) {
      const a = Math.PI * (i / 8);
      g += `<circle cx="${X(c - Math.cos(a) * hw * 0.98)}" cy="${Y(-172 + (top + 172) * Math.sin(a) * 0.98)}" r="${S(9)}" fill="${pal.light}"/>`;
    }
    g += `<path d="${arch([l, rr])}" fill="none" stroke="${pal.trim}" stroke-width="${S(2.2)}" opacity=".7"/>`;
  }
  // pilasters, capitals and bases
  for (const v of [-250, -110, 110, 250]) {
    g += `<rect x="${X(v - 15)}" y="${Y(-176)}" width="${S(30)}" height="${S(136)}" fill="${v < 0 ? pal.light : pal.mid}"/>`;
    g += `<rect x="${X(v - 15)}" y="${Y(-176)}" width="${S(10)}" height="${S(136)}" fill="#fff" opacity=".22"/>`;
    g += `<rect x="${X(v - 20)}" y="${Y(-184)}" width="${S(40)}" height="${S(10)}" fill="${pal.dark}"/><rect x="${X(v - 20)}" y="${Y(-52)}" width="${S(40)}" height="${S(12)}" fill="${pal.dark}"/>`;
  }
  // frieze, deep eave and parapet
  g += `<rect x="${X(-276)}" y="${Y(-284)}" width="${S(552)}" height="${S(22)}" fill="${pal.mid}"/>`;
  for (let v = -262; v < 262; v += 24) g += `<rect x="${X(v)}" y="${Y(-279)}" width="${S(12)}" height="${S(12)}" fill="${pal.trim}" opacity=".55"/>`;
  g += `<path d="M${X(-306)},${Y(-298)}H${X(306)}L${X(288)},${Y(-284)}H${X(-288)}Z" fill="${pal.dark}"/><rect x="${X(-306)}" y="${Y(-304)}" width="${S(612)}" height="${S(7)}" fill="${pal.light}"/>`;
  g += `<rect x="${X(-272)}" y="${Y(-330)}" width="${S(544)}" height="${S(26)}" fill="${pal.light}"/>`;
  for (let v = -264; v < 264; v += 22) g += `<path d="M${X(v)},${Y(-330)}q${S(8)},${S(-16)} ${S(16)},0z" fill="${pal.light}"/>`;
  g += `<rect x="${X(-272)}" y="${Y(-312)}" width="${S(544)}" height="${S(8)}" fill="${pal.mid}" opacity=".7"/>`;
  // corner kiosks
  for (const v of [-214, 214]) g += chhatri(sheet, { x: x + v * s, y: y - 330 * s, s: s * 0.62, pal });
  // steps
  g += `<rect x="${X(-292)}" y="${Y(-40)}" width="${S(584)}" height="${S(16)}" fill="${pal.light}"/><rect x="${X(-312)}" y="${Y(-24)}" width="${S(624)}" height="${S(13)}" fill="${pal.mid}"/><rect x="${X(-332)}" y="${Y(-11)}" width="${S(664)}" height="${S(13)}" fill="${pal.dark}"/>`;
  // marigold swags
  if (garlands) {
    for (const [l, rr] of [[-288, -150], [-150, 0], [0, 150], [150, 288]]) {
      for (let i = 0; i <= 12; i++) {
        const u = i / 12;
        g += pom(r, x + lerp(l, rr, u) * s, y + (-282 + 30 * 4 * u * (1 - u)) * s, 6.4 * s, i % 2 ? '#ffb238' : '#ff8f2e', '#d96a1c', '#ffd76a');
      }
    }
    for (const v of [-288, 288]) for (let i = 0; i < 9; i++) g += pom(r, x + v * s, y + (-282 + i * 13) * s, 6 * s, i % 2 ? '#ff8f2e' : '#ffb238', '#d96a1c', '#ffd76a');
  }
  return g;
}

/** Distant palace skyline, used as a far-off silhouette. */
export function palaceFar(sheet, { x, y, s = 1, pal, lit = false }) {
  const X = (v) => n(x + v * s), Y = (v) => n(y + v * s), S = (v) => n(v * s);
  let g = `<rect x="${X(-190)}" y="${Y(-62)}" width="${S(380)}" height="${S(62)}" fill="${pal.light}"/>`;
  g += `<rect x="${X(-190)}" y="${Y(-62)}" width="${S(380)}" height="${S(62)}" fill="${sheet.linear([[0, pal.mid, 0], [1, pal.mid, 0.8]], { x1: 0, y1: 0, x2: 1, y2: 0 })}"/>`;
  g += `<rect x="${X(-52)}" y="${Y(-96)}" width="${S(104)}" height="${S(96)}" fill="${pal.light}"/>`;
  for (let v = -186; v < 186; v += 14) g += `<rect x="${X(v)}" y="${Y(-68)}" width="${S(7)}" height="${S(7)}" fill="${pal.light}"/>`;
  g += dome(sheet, x, y - 96 * s, 84 * s, 58 * s, pal);
  for (const v of [-128, 128]) g += dome(sheet, x + v * s, y - 62 * s, 54 * s, 36 * s, pal);
  for (const v of [-196, -72, 72, 196]) {
    g += `<rect x="${X(v - 6)}" y="${Y(-130)}" width="${S(12)}" height="${S(130)}" fill="${v < 0 ? pal.light : pal.mid}"/>`;
    g += dome(sheet, x + v * s, y - 130 * s, 22 * s, 18 * s, pal);
  }
  const win = lit ? (pal.lit || '#ffd98a') : pal.dark;
  g += `<path d="M${X(-16)},${Y(0)}V${Y(-44)}Q${X(-16)},${Y(-66)} ${X(0)},${Y(-70)}Q${X(16)},${Y(-66)} ${X(16)},${Y(-44)}V${Y(0)}Z" fill="${win}" opacity="${lit ? 1 : 0.55}"/>`;
  for (let v = -168; v <= 168; v += 28) {
    if (Math.abs(v) < 60) continue;
    g += `<path d="M${X(v - 5)},${Y(-12)}v${S(-22)}q${S(5)},${S(-9)} ${S(10)},0v${S(22)}z" fill="${win}" opacity="${lit ? 0.95 : 0.5}"/>`;
  }
  return g;
}

export function balustrade(sheet, { x0 = -40, x1 = W + 40, y, h = 120, pal, post = 340, gap = 30 }) {
  let g = '';
  const top = y - h;
  g += `<rect x="${n(x0)}" y="${n(top + 16)}" width="${n(x1 - x0)}" height="${n(h - 28)}" fill="${pal.deep}" opacity=".18"/>`;
  for (let x = x0 + gap / 2; x < x1; x += gap) {
    const cx = n(x);
    g += `<path d="M${cx},${n(top + 14)}c${n(-5)},${n(h * 0.14)} ${n(-11)},${n(h * 0.3)} ${n(-4)},${n(h * 0.5)}c${n(3)},${n(h * 0.12)} ${n(-1)},${n(h * 0.2)} ${n(-3)},${n(h * 0.28)}h14c${n(-2)},${n(-h * 0.08)} ${n(-6)},${n(-h * 0.16)} ${n(-3)},${n(-h * 0.28)}c${n(7)},${n(-h * 0.2)} ${n(1)},${n(-h * 0.36)} ${n(-4)},${n(-h * 0.5)}z" fill="${pal.light}"/>`;
    g += `<path d="M${n(x + 3)},${n(top + 18)}c${n(4)},${n(h * 0.14)} ${n(6)},${n(h * 0.3)} ${n(1)},${n(h * 0.48)}" stroke="${pal.mid}" stroke-width="3" fill="none" opacity=".8"/>`;
  }
  g += `<rect x="${n(x0)}" y="${n(top)}" width="${n(x1 - x0)}" height="18" fill="${sheet.linear([[0, '#fff'], [0.35, pal.light], [1, pal.mid]])}"/>`;
  g += `<rect x="${n(x0)}" y="${n(top + 18)}" width="${n(x1 - x0)}" height="5" fill="${pal.dark}" opacity=".45"/>`;
  g += `<rect x="${n(x0)}" y="${n(y - 16)}" width="${n(x1 - x0)}" height="18" fill="${sheet.linear([[0, pal.light], [1, pal.mid]])}"/>`;
  for (let x = x0 + post * 0.4; x < x1; x += post) {
    g += `<rect x="${n(x - 22)}" y="${n(top - 12)}" width="44" height="${n(h + 14)}" fill="${sheet.linear([[0, pal.light], [0.6, pal.light], [1, pal.mid]], { x1: 0, y1: 0, x2: 1, y2: 0 })}"/>`;
    g += `<rect x="${n(x - 28)}" y="${n(top - 20)}" width="56" height="12" fill="${pal.light}"/><rect x="${n(x - 28)}" y="${n(top - 8)}" width="56" height="4" fill="${pal.dark}" opacity=".4"/>`;
    g += `<circle cx="${n(x)}" cy="${n(top - 34)}" r="16" fill="${pal.light}"/><circle cx="${n(x + 5)}" cy="${n(top - 31)}" r="11" fill="${pal.mid}" opacity=".6"/><circle cx="${n(x - 5)}" cy="${n(top - 39)}" r="5" fill="#fff" opacity=".7"/>`;
  }
  return g;
}
