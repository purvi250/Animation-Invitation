/* ============================================================================
   Set pieces — the built things in the garden, painted as transparent cut-outs
   that the website stands in front of the scenery and animates around:
     gate      carved sandstone garden gateway (hero)
     toran     mango-leaf and marigold door garland (hero, groom)
     arch      carved marble archway with hanging lamps (bride)
     curtain   one half of a curtain of flower strings (bride)
     pillar    a single sandstone pillar (groom steps out from behind it)
     mandap    floral canopy on four flower-wrapped pillars (the couple)
     hotel     an imagined grand hotel entrance at night (venue) — an illustration,
               NOT a likeness of the real building
   All designs are original.
   ============================================================================ */
import {
  rng, n, lerp, spline, ridge, ground, yAt, Sheet, glow, foliage, cypress, pom, flower, flowerField,
  lantern, lampPost, lightString, diya, chhatri, domePath, strokes, grass, W,
} from './kit.mjs';

const SAND = {
  light: '#f4bd94', mid: '#dd966e', dark: '#ad634c', deep: '#5a2a33', trim: '#f8dc98',
  domeLight: '#fff4e1', domeShade: '#e7b99c', glow: '#ffbe6a', lit: '#ffdf9a',
};
const MARBLE = {
  light: '#fffaf5', mid: '#eddbe0', dark: '#c3a8c0', deep: '#6a5a8c', trim: '#e2bd6e',
  domeLight: '#fffaf6', domeShade: '#dcc1d6', glow: '#ffd08a', lit: '#ffe0a0',
};
const MANGO = ['#2f7d3a', '#3f9a47', '#5ab04e', '#256b34'];
const GENDA = [['#ff8f2e', '#cf621a', '#ffd76a'], ['#ffb238', '#d98a1c', '#ffe9a0'], ['#ffa733', '#cf621a', '#ffe08a']];

const marigold = (r, x, y, s) => { const [c, d, h] = r.pick(GENDA); return pom(r, x, y, s, c, d, h); };

/** Many-lobed ("multifoil") arch opening, the signature of North Indian architecture. */
export function cuspArch(l, rr, yBase, ySpring, yTop, lobes = 7) {
  const c = (l + rr) / 2, hw = (rr - l) / 2, rise = ySpring - yTop;
  const pts = [];
  for (let i = 0; i <= lobes; i++) {
    const a = Math.PI - (i / lobes) * Math.PI;
    pts.push([c + Math.cos(a) * hw, ySpring - Math.pow(Math.sin(a), 0.82) * rise]);
  }
  let d = `M${n(l)},${n(yBase)}L${n(pts[0][0])},${n(pts[0][1])}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    const ox = mx - c, oy = my - ySpring, len = Math.hypot(ox, oy) || 1;
    const k = Math.hypot(x1 - x0, y1 - y0) * 0.42;
    d += `Q${n(mx + (ox / len) * k)},${n(my + (oy / len) * k)} ${n(x1)},${n(y1)}`;
  }
  return `${d}L${n(rr)},${n(yBase)}Z`;
}

function garlandAlong(r, pts, size, step = 0.9) {
  let s = '';
  const total = pts.length - 1;
  for (let i = 0; i <= total * (1 / step) * 6; i++) {
    const u = (i / (total * (1 / step) * 6)) * total;
    const k = Math.min(total - 1, Math.floor(u)), f = u - k;
    s += marigold(r, lerp(pts[k][0], pts[k + 1][0], f), lerp(pts[k][1], pts[k + 1][1], f), size * r.range(0.85, 1.15));
  }
  return s;
}

function mangoLeaf(x, y, len, rot, col) {
  const w = len * 0.2;
  return `<path d="M${n(x)},${n(y)}c${n(-w)},${n(len * 0.3)} ${n(-w)},${n(len * 0.7)} 0,${n(len)}c${n(w)},${n(-len * 0.3)} ${n(w)},${n(-len * 0.7)} 0,${n(-len)}z" fill="${col}" transform="rotate(${n(rot)} ${n(x)} ${n(y)})"/>`
    + `<path d="M${n(x)},${n(y + len * 0.08)}v${n(len * 0.8)}" stroke="#1f5a2c" stroke-width="${n(Math.max(0.8, len * 0.02))}" opacity=".5" transform="rotate(${n(rot)} ${n(x)} ${n(y)})"/>`;
}

/** Brass water-pot crowned with mango leaves — a traditional sign of welcome. */
function kalash(sh, r, { x, y, s = 1 }) {
  const X = (v) => n(x + v * s), Y = (v) => n(y + v * s);
  let g = `<rect x="${X(-46)}" y="${Y(-26)}" width="${n(92 * s)}" height="${n(26 * s)}" rx="${n(4 * s)}" fill="${sh.linear([[0, SAND.light], [1, SAND.dark]], { x1: 0, y1: 0, x2: 1, y2: 0 })}"/>`;
  for (const a of [-52, -28, 0, 28, 52]) g += mangoLeaf(x, y - 118 * s, 64 * s, 180 + a, MANGO[(a + 52) / 26 % 4 | 0]);
  g += `<ellipse cx="${X(0)}" cy="${Y(-134)}" rx="${n(22 * s)}" ry="${n(26 * s)}" fill="#8a5a36"/><path d="M${X(-4)},${Y(-160)}q${n(4 * s)},${n(-16 * s)} ${n(12 * s)},${n(-8 * s)}" stroke="#6b4426" stroke-width="${n(4 * s)}" fill="none" stroke-linecap="round"/>`;
  g += `<path d="M${X(-22)},${Y(-112)}h${n(44 * s)}l${n(-6 * s)},${n(12 * s)}c${n(34 * s)},${n(8 * s)} ${n(42 * s)},${n(56 * s)} ${n(6 * s)},${n(72 * s)}h${n(-44 * s)}c${n(-36 * s)},${n(-16 * s)} ${n(-28 * s)},${n(-64 * s)} ${n(6 * s)},${n(-72 * s)}z" fill="${sh.linear([[0, '#fff0b0'], [0.35, '#e9b949'], [1, '#9c6a1c']], { x1: 0, y1: 0, x2: 1, y2: 0.3 })}"/>`;
  g += `<path d="M${X(-34)},${Y(-66)}q${n(34 * s)},${n(12 * s)} ${n(68 * s)},0" stroke="#b3202f" stroke-width="${n(7 * s)}" fill="none"/>`;
  for (let i = -3; i <= 3; i++) g += `<circle cx="${X(i * 9)}" cy="${Y(-58 + (9 - i * i) * 0.5)}" r="${n(2 * s)}" fill="#fff3c4"/>`;
  g += `<ellipse cx="${X(-14)}" cy="${Y(-80)}" rx="${n(6 * s)}" ry="${n(16 * s)}" fill="#fff" opacity=".35"/>`;
  return g;
}

/** Small projecting balcony window. */
function jharokha(sh, { x, y, s = 1, pal }) {
  const X = (v) => n(x + v * s), Y = (v) => n(y + v * s), S = (v) => n(v * s);
  let g = `<path d="M${X(-50)},${Y(0)}h${S(100)}l${S(-14)},${S(26)}h${S(-72)}z" fill="${pal.dark}"/>`;
  g += `<rect x="${X(-46)}" y="${Y(-112)}" width="${S(92)}" height="${S(112)}" fill="${sh.linear([[0, pal.light], [1, pal.mid]], { x1: 0, y1: 0, x2: 1, y2: 0 })}"/>`;
  g += `<path d="${cuspArch(x - 30 * s, x + 30 * s, y - 10 * s, y - 62 * s, y - 96 * s, 5)}" fill="${sh.linear([[0, pal.deep], [1, '#c9763f']])}"/>`;
  g += glow(sh, x, y - 34 * s, 46 * s, pal.glow, 0.55);
  g += `<rect x="${X(-46)}" y="${Y(-20)}" width="${S(92)}" height="${S(20)}" fill="${pal.mid}"/>`;
  for (let i = -3; i <= 3; i++) g += `<rect x="${X(i * 12 - 2)}" y="${Y(-18)}" width="${S(4)}" height="${S(16)}" fill="${pal.light}"/>`;
  g += `<path d="M${X(-62)},${Y(-112)}h${S(124)}l${S(-10)},${S(-12)}h${S(-104)}z" fill="${pal.dark}"/>`;
  const d = domePath(x, y - 124 * s, 78 * s, 50 * s);
  g += `<path d="${d}" fill="${pal.domeLight}"/><path d="${d}" fill="${pal.domeShade}" opacity=".45" clip-path="${sh.clip(`M${X(4)},${Y(-200)}h${S(60)}v${S(90)}h${S(-60)}z`)}"/>`;
  g += `<circle cx="${X(0)}" cy="${Y(-182)}" r="${S(4)}" fill="${pal.trim}"/>`;
  return g;
}

function carvedPillar(sh, r, { x, top, bottom, w, pal, garland = true, niches = true }) {
  const l = x - w / 2, h = bottom - top;
  let g = `<rect x="${n(l)}" y="${n(top)}" width="${n(w)}" height="${n(h)}" fill="${sh.linear([[0, pal.light], [0.5, pal.mid], [1, pal.dark]], { x1: 0, y1: 0, x2: 1, y2: 0 })}"/>`;
  g += `<rect x="${n(l + w * 0.1)}" y="${n(top)}" width="${n(w * 0.1)}" height="${n(h)}" fill="#fff" opacity=".22"/>`;
  for (const u of [0.34, 0.66]) g += `<path d="M${n(l + w * u)},${n(top)}V${n(bottom)}" stroke="${pal.dark}" stroke-width="2" opacity=".28"/>`;
  if (niches) {
    const count = Math.max(2, Math.round(h / 250));
    for (let i = 0; i < count; i++) {
      const y0 = top + h * ((i + 0.16) / count), ph = (h / count) * 0.62;
      g += `<path d="${cuspArch(l + w * 0.2, l + w * 0.8, y0 + ph, y0 + ph * 0.42, y0, 5)}" fill="${pal.dark}" opacity=".5"/>`;
      g += `<path d="${cuspArch(l + w * 0.26, l + w * 0.74, y0 + ph, y0 + ph * 0.46, y0 + ph * 0.1, 5)}" fill="none" stroke="${pal.trim}" stroke-width="2.5" opacity=".75"/>`;
      g += `<rect x="${n(l - 6)}" y="${n(y0 + ph + 16)}" width="${n(w + 12)}" height="12" fill="${pal.dark}"/><rect x="${n(l - 6)}" y="${n(y0 + ph + 16)}" width="${n(w + 12)}" height="4" fill="${pal.light}"/>`;
    }
  }
  // lotus-petal capital and stepped base
  g += `<rect x="${n(l - 16)}" y="${n(top - 4)}" width="${n(w + 32)}" height="26" fill="${pal.light}"/><rect x="${n(l - 16)}" y="${n(top + 18)}" width="${n(w + 32)}" height="6" fill="${pal.dark}" opacity=".6"/>`;
  for (let i = 0; i < 7; i++) {
    const px = l - 12 + ((w + 24) * (i + 0.5)) / 7;
    g += `<path d="M${n(px - 13)},${n(top + 24)}q13,36 26,0q-13,-12 -26,0z" fill="${i % 2 ? pal.mid : pal.light}" stroke="${pal.dark}" stroke-width="1.5"/>`;
  }
  g += `<rect x="${n(l - 14)}" y="${n(bottom - 44)}" width="${n(w + 28)}" height="22" fill="${pal.light}"/><rect x="${n(l - 26)}" y="${n(bottom - 22)}" width="${n(w + 52)}" height="24" fill="${pal.mid}"/><rect x="${n(l - 26)}" y="${n(bottom - 22)}" width="${n(w + 52)}" height="6" fill="#fff" opacity=".3"/>`;
  if (garland) {
    const pts = [];
    for (let y = top + 70, i = 0; y < bottom - 70; y += 86, i++) pts.push([x + (i % 2 ? w * 0.56 : -w * 0.56), y]);
    g += garlandAlong(r, pts, w * 0.07);
  }
  return g;
}

/* ---------------------------------------------------------------------------- */
export function gate() {
  const sh = new Sheet(1200, 1300); const r = rng(2101);
  const pal = SAND;
  let g = '';
  // kiosks on top, behind the lintel
  for (const x of [130, 1070]) g += chhatri(sh, { x, y: 238, s: 1.2, pal });
  // lintel with a cusped valance between the pillars
  // (the cut-out stops at the foot of the lintel block, so the way through stays open below it)
  const opening = cuspArch(214, 986, 560, 470, 292, 9);
  g += `<path fill-rule="evenodd" d="M150,186H1050V560H150Z ${opening}" fill="${sh.linear([[0, pal.light], [1, pal.mid]], { x1: 0, y1: 0, x2: 0.3, y2: 1 })}"/>`;
  g += `<path d="${opening.replace(/^M[^L]+L/, 'M').replace(/L[^L]+Z$/, '')}" fill="none" stroke="${pal.trim}" stroke-width="5" opacity=".8"/>`;
  g += `<rect x="124" y="170" width="952" height="26" fill="${pal.light}"/><rect x="124" y="192" width="952" height="8" fill="${pal.dark}" opacity=".55"/>`;
  for (let x = 160; x < 1040; x += 34) g += `<path d="M${x},186q10,-22 20,0z" fill="${pal.light}"/><rect x="${x + 2}" y="214" width="16" height="16" fill="${pal.trim}" opacity=".5"/>`;
  // carved lotus roundels in the spandrels
  for (const x of [270, 930]) {
    g += `<circle cx="${x}" cy="330" r="34" fill="${pal.mid}" stroke="${pal.trim}" stroke-width="3"/>`;
    for (let i = 0; i < 8; i++) g += `<ellipse cx="${x}" cy="${330 - 17}" rx="7" ry="15" fill="${pal.light}" transform="rotate(${i * 45} ${x} 330)"/>`;
    g += `<circle cx="${x}" cy="330" r="7" fill="${pal.trim}"/>`;
  }
  g += carvedPillar(sh, r, { x: 130, top: 250, bottom: 1262, w: 172, pal });
  g += carvedPillar(sh, r, { x: 1070, top: 250, bottom: 1262, w: 172, pal });
  for (const x of [130, 1070]) g += jharokha(sh, { x, y: 640, s: 0.92, pal });
  // threshold, and a brass kalash either side of the way in
  g += `<rect x="190" y="1238" width="820" height="26" rx="4" fill="${sh.linear([[0, pal.light], [1, pal.mid]])}"/>`;
  g += kalash(sh, r, { x: 282, y: 1240, s: 0.86 }) + kalash(sh, r, { x: 918, y: 1240, s: 0.86 });
  for (let i = 0; i < 16; i++) g += marigold(r, r.chance(0.5) ? r.range(210, 350) : r.range(850, 990), r.range(1226, 1258), r.range(8, 13));
  sh.add(`<g filter="${sh.paint(2.4, 0.05)}">${g}</g>`);
  return [{ name: 'gate', sheet: sh }];
}

export function toran() {
  const sh = new Sheet(1200, 330); const r = rng(2202);
  const scallops = 6, drop = 62;
  const yAtX = (x) => 30 + drop * Math.abs(Math.sin((x / 1200) * Math.PI * scallops));
  let g = '';
  const cord = [];
  for (let x = 0; x <= 1200; x += 20) cord.push([x, yAtX(x)]);
  g += `<path d="${spline(cord)}" stroke="#7a4a22" stroke-width="5" fill="none"/>`;
  // mango leaves hang from the cord, marigolds sit along it
  for (let x = 8; x < 1200; x += 21) g += mangoLeaf(x, yAtX(x) + 2, r.range(64, 92), r.range(-9, 9), r.pick(MANGO));
  for (let x = 0; x <= 1200; x += 17) g += marigold(r, x, yAtX(x), r.range(10, 13));
  // strings of marigold where the scallops meet
  for (let i = 0; i <= scallops; i++) {
    const x = Math.min(1188, Math.max(12, (1200 * i) / scallops));
    const len = i === 0 || i === scallops ? 250 : i % 2 ? 150 : 200;
    for (let y = 36; y < 36 + len; y += 17) g += marigold(r, x + Math.sin(y / 30) * 3, y, 9.5);
    g += `<path d="M${x},${36 + len}l-9,26h18z" fill="#b3202f"/><circle cx="${x}" cy="${36 + len + 4}" r="8" fill="#f6c445"/>`;
  }
  sh.add(g);
  return [{ name: 'toran', sheet: sh }];
}

export function arch() {
  const sh = new Sheet(900, 1260); const r = rng(2303);
  const pal = MARBLE;
  const opening = cuspArch(196, 704, 640, 430, 214, 9);
  const openLine = (d) => d.replace(/^M[^L]+L/, 'M').replace(/L[^L]+Z$/, '');
  let g = `<path fill-rule="evenodd" d="M70,120H830V640H70Z ${opening}" fill="${sh.linear([[0, pal.light], [1, pal.mid]], { x1: 0, y1: 0, x2: 0.4, y2: 1 })}"/>`;
  g += `<path d="${openLine(opening)}" fill="none" stroke="${pal.trim}" stroke-width="5" opacity=".85"/>`;
  g += `<path d="${openLine(cuspArch(176, 724, 640, 426, 190, 9))}" fill="none" stroke="${pal.dark}" stroke-width="3" opacity=".4"/>`;
  g += `<rect x="44" y="96" width="812" height="30" fill="${pal.light}"/><rect x="44" y="122" width="812" height="8" fill="${pal.dark}" opacity=".5"/>`;
  for (let x = 70; x < 830; x += 30) g += `<path d="M${x},100q9,-22 18,0z" fill="${pal.light}"/>`;
  g += `<path d="${domePath(450, 96, 150, 78)}" fill="${pal.domeLight}"/><circle cx="450" cy="4" r="9" fill="${pal.trim}"/>`;
  for (const x of [196, 704]) {
    g += `<circle cx="${x}" cy="262" r="36" fill="${pal.mid}" stroke="${pal.trim}" stroke-width="3"/>`;
    for (let i = 0; i < 8; i++) g += `<ellipse cx="${x}" cy="244" rx="7.5" ry="16" fill="#f7c9d6" transform="rotate(${i * 45} ${x} 262)"/>`;
    g += `<circle cx="${x}" cy="262" r="7" fill="${pal.trim}"/>`;
  }
  g += carvedPillar(sh, r, { x: 130, top: 420, bottom: 1250, w: 136, pal, garland: false });
  g += carvedPillar(sh, r, { x: 770, top: 420, bottom: 1250, w: 136, pal, garland: false });
  sh.add(`<g filter="${sh.paint(2, 0.05)}">${g}</g>`);
  // hanging lamps, and marigold massed at the feet of the pillars
  sh.add(lantern(sh, { x: 300, y: 300, s: 2.1, drop: 96 }), lantern(sh, { x: 600, y: 300, s: 2.1, drop: 96 }));
  for (const x of [130, 770]) {
    sh.add(foliage(r, { x, y: 1196, w: 120, h: 56, pal: { dark: '#2f6b4a', mid: '#4a9a5c', light: '#86c873', hi: '#d6f09a' }, puffs: 8, dabs: 30 }));
    for (let i = 0; i < 20; i++) sh.add(marigold(r, x + r.range(-112, 112), 1196 + r.range(-46, 40), r.range(11, 18)));
  }
  return [{ name: 'arch', sheet: sh }];
}

export function curtain() {
  const sh = new Sheet(380, 1000); const r = rng(2404);
  let g = `<rect x="0" y="0" width="380" height="16" rx="8" fill="#c9962e"/>`;
  for (let i = 0; i < 12; i++) {
    const x = 16 + i * 31.6, len = r.range(820, 960), phase = r.range(0, 6);
    for (let y = 14, k = 0; y < len; y += 15, k++) {
      const px = x + Math.sin(y / 70 + phase) * 6;
      if (k % 5 === 4) g += marigold(r, px, y, 9);
      else if (k % 5 === 2) g += pom(r, px, y, 7, '#f6a6c0', '#d0688c', '#fff0f4');
      else g += `<circle cx="${n(px)}" cy="${n(y)}" r="6" fill="#fffdf6"/><circle cx="${n(px - 1.5)}" cy="${n(y - 1.5)}" r="2.4" fill="#f3e6c8"/>`;
    }
    g += marigold(r, x + Math.sin(len / 70 + phase) * 6, len + 6, 13);
  }
  sh.add(g);
  return [{ name: 'curtain', sheet: sh }];
}

export function pillar() {
  const sh = new Sheet(300, 1250); const r = rng(2505);
  sh.add(`<g filter="${sh.paint(2, 0.05)}">${carvedPillar(sh, r, { x: 150, top: 60, bottom: 1240, w: 170, pal: SAND })}</g>`);
  return [{ name: 'pillar', sheet: sh }];
}

export function mandap() {
  const sh = new Sheet(1400, 1280); const r = rng(2606);
  const leaf = { dark: '#2f6b4a', mid: '#4a9a5c', light: '#86c873', hi: '#d6f09a' };
  const blooms = [['#fff5f8', '#e9c7d2', '#ffffff'], ['#f9c2d6', '#d98aa8', '#fff0f4'], ['#f08aa8', '#c0507a', '#ffd9e6'], ['#fff3d6', '#e6c98a', '#fffbe8']];
  const bloom = (x, y, s) => { const [c, d, h] = r.pick(blooms); return pom(r, x, y, s, c, d, h); };
  // platform
  sh.add(`<path d="M90,1196h1220l40,70h-1300z" fill="${sh.linear([[0, '#fff6e6'], [1, '#e9cfa6']])}"/><rect x="90" y="1186" width="1220" height="14" fill="#c9962e"/>`);
  for (let x = 130; x < 1290; x += 38) sh.add(`<path d="M${x},1232q12,-18 24,0q-12,18 -24,0z" fill="#d9a441" opacity=".6"/>`);
  // rear pillars (paler, further away), then the canopy, then the front pillars
  const wrapped = (x, top, w, alpha) => {
    let g = `<rect x="${x - w / 2}" y="${top}" width="${w}" height="${1190 - top}" fill="${sh.linear([[0, '#fff7ea'], [0.6, '#f1dcbc'], [1, '#cdb08a']], { x1: 0, y1: 0, x2: 1, y2: 0 })}"/>`;
    for (let y = top + 20, i = 0; y < 1180; y += 30, i++) {
      const px = x + Math.sin(i * 0.9) * w * 0.52;
      g += foliage(r, { x: px, y, w: w * 0.34, h: w * 0.24, pal: leaf, puffs: 3, dabs: 5 }) + bloom(px + r.range(-8, 8), y + r.range(-6, 6), w * r.range(0.16, 0.26));
    }
    return `<g opacity="${alpha}">${g}</g>`;
  };
  sh.add(wrapped(360, 300, 46, 0.82), wrapped(1040, 300, 46, 0.82));
  // canopy: beam, draped cloth, a valance of flower strings
  sh.add(`<path d="M150,250Q700,150 1250,250L1290,300H110Z" fill="${sh.linear([[0, '#fff3dc'], [1, '#f0cf9a']])}"/>`);
  for (let i = 0; i < 4; i++) {
    const x0 = 130 + i * 285, x1 = x0 + 285;
    sh.add(`<path d="M${x0},292Q${(x0 + x1) / 2},${420 + (i % 2) * 20} ${x1},292Z" fill="${i % 2 ? '#f6b7c8' : '#fff0d6'}" opacity=".92"/><path d="M${x0},292Q${(x0 + x1) / 2},${420 + (i % 2) * 20} ${x1},292" fill="none" stroke="#c9962e" stroke-width="4"/>`);
  }
  for (let x = 130; x <= 1270; x += 30) {
    const len = 70 + 46 * Math.abs(Math.sin(((x - 130) / 1140) * Math.PI * 4));
    for (let y = 300; y < 300 + len; y += 15) sh.add(y % 30 < 15 ? marigold(r, x, y, 7.5) : `<circle cx="${x}" cy="${y}" r="5.5" fill="#fffdf6"/>`);
  }
  for (let x = 110; x <= 1290; x += 26) sh.add(foliage(r, { x, y: 268 + r.range(-10, 10), w: 34, h: 24, pal: leaf, puffs: 3, dabs: 6 }));
  for (let i = 0; i < 90; i++) sh.add(bloom(r.range(110, 1290), 262 + r.range(-34, 26) - Math.sin((i / 90) * Math.PI) * 34, r.range(11, 24)));
  // crest of flowers at the centre
  sh.add(foliage(r, { x: 700, y: 176, w: 150, h: 60, pal: leaf, puffs: 9, dabs: 36 }));
  for (let i = 0; i < 34; i++) sh.add(bloom(700 + r.range(-150, 150), 176 + r.range(-50, 40), r.range(13, 28)));
  sh.add(wrapped(180, 280, 78, 1), wrapped(1220, 280, 78, 1));
  for (const x of [180, 1220]) for (let i = 0; i < 18; i++) sh.add(bloom(x + r.range(-90, 90), 1180 + r.range(-40, 30), r.range(14, 26)));
  return [{ name: 'mandap', sheet: sh }];
}

/* ----------------------------------------------------------------------------
   Venue backdrop: an imagined hotel entrance. Deliberately generic — it is
   storybook scenery, not a drawing of Hotel Royal Residency.
   ---------------------------------------------------------------------------- */
export function hotel() {
  const sh = new Sheet(); const r = rng(2707);
  const leaf = { dark: '#0f2742', mid: '#1c4560', light: '#2f6f7c', hi: '#68b4a4' };
  const wall = { light: '#f3dcc0', mid: '#d9b392', dark: '#a8805f', deep: '#3a2a3a', trim: '#f6d892', domeLight: '#fbe9cf', domeShade: '#c9a184', glow: '#ffc86a', lit: '#ffdc94' };
  const g1 = ridge(r, { y: 716, amp: 8, waves: [[1.1, 1], [2.9, 0.4]] });
  sh.add(`<path d="${ground(g1)}" fill="${sh.linear([[0, '#28566e'], [0.4, '#193853'], [1, '#0e1e38']], { user: true, y1: 700, y2: 1010 })}"/>`);
  sh.add(strokes(r, { y0: 724, y1: 1000, count: 50, colors: ['#4f9a94', '#0b1a34'], w: [4, 14], len: [100, 320], op: [0.1, 0.2], tilt: 0.02 }));

  const cx = 1200, base = 724;
  let b = '';
  const win = (x, y, w, h, lit = true) => `<path d="${cuspArch(x - w / 2, x + w / 2, y, y - h * 0.55, y - h, 5)}" fill="${lit ? sh.linear([[0, '#ffe9a8'], [1, '#ffb85a']]) : wall.deep}"/>`;
  // wings
  b += `<rect x="${cx - 470}" y="${base - 330}" width="940" height="330" fill="${sh.linear([[0, wall.light], [1, wall.mid]], { x1: 0, y1: 0, x2: 0, y2: 1 })}"/>`;
  b += `<rect x="${cx - 482}" y="${base - 346}" width="964" height="18" fill="${wall.light}"/>`;
  for (let x = cx - 470; x < cx + 470; x += 24) b += `<path d="M${x},${base - 346}q8,-16 16,0z" fill="${wall.light}"/>`;
  for (const row of [0, 1, 2]) {
    for (let i = 0; i < 12; i++) {
      const x = cx - 430 + i * 78.2;
      if (Math.abs(x - cx) < 150) continue;
      const y = base - 40 - row * 104;
      b += win(x, y, 40, 70, r.chance(0.82));
      if (row > 0) b += `<rect x="${x - 26}" y="${y}" width="52" height="7" fill="${wall.dark}"/>`;
    }
  }
  for (const x of [cx - 470, cx + 470]) {
    b += `<rect x="${x - 34}" y="${base - 420}" width="68" height="420" fill="${sh.linear([[0, wall.light], [1, wall.mid]], { x1: 0, y1: 0, x2: 1, y2: 0 })}"/>`;
    b += chhatri(sh, { x, y: base - 420, s: 0.72, pal: wall, lit: true });
  }
  // central block and porch
  b += `<rect x="${cx - 160}" y="${base - 430}" width="320" height="430" fill="${sh.linear([[0, wall.light], [1, wall.mid]], { x1: 0, y1: 0, x2: 0, y2: 1 })}"/>`;
  b += `<rect x="${cx - 174}" y="${base - 446}" width="348" height="18" fill="${wall.light}"/>`;
  b += `<path d="${domePath(cx, base - 446, 190, 104)}" fill="${wall.domeLight}"/><circle cx="${cx}" cy="${base - 566}" r="7" fill="${wall.trim}"/>`;
  for (const dx of [-84, 0, 84]) b += win(cx + dx, base - 250, 54, 96);
  b += `<rect x="${cx - 150}" y="${base - 240}" width="300" height="10" fill="${wall.dark}"/>`;
  b += `<path d="M${cx - 230},${base - 190}h460l-22,-26h-416z" fill="${wall.dark}"/><rect x="${cx - 230}" y="${base - 190}" width="460" height="16" fill="${wall.light}"/>`;
  b += `<rect x="${cx - 214}" y="${base - 174}" width="428" height="174" fill="${sh.linear([[0, '#7a3f3a'], [1, '#e39a5a']])}"/>`;
  b += glow(sh, cx, base - 70, 230, '#ffcf8a', 0.9);
  b += `<path fill-rule="evenodd" d="M${cx - 214},${base - 174}h428v174h-428z ${[-140, 0, 140].map((dx) => cuspArch(cx + dx - 52, cx + dx + 52, base, base - 96, base - 150, 7)).join(' ')}" fill="${sh.linear([[0, wall.light], [1, wall.mid]], { x1: 0, y1: 0, x2: 0, y2: 1 })}"/>`;
  for (const dx of [-214, -72, 72, 214]) b += `<rect x="${cx + dx - 11}" y="${base - 174}" width="22" height="174" fill="${wall.light}"/>`;
  b += `<rect x="${cx - 250}" y="${base - 6}" width="500" height="14" fill="${wall.light}"/><rect x="${cx - 280}" y="${base + 8}" width="560" height="14" fill="${wall.mid}"/><rect x="${cx - 310}" y="${base + 22}" width="620" height="14" fill="${wall.dark}"/>`;
  sh.add(`<ellipse cx="${cx}" cy="${base + 20}" rx="620" ry="34" fill="#061024" opacity=".4" filter="${sh.blur(10)}"/>`);
  sh.add(`<g filter="${sh.paint(2, 0.05)}">${b}</g>`);
  // lights along the roofline and across the forecourt
  sh.add(lightString(r, sh, { x0: cx - 470, y0: base - 344, x1: cx - 160, y1: base - 440, sag: 12, count: 22, size: 2.4 }));
  sh.add(lightString(r, sh, { x0: cx + 160, y0: base - 440, x1: cx + 470, y1: base - 344, sag: 12, count: 22, size: 2.4 }));
  sh.add(lightString(r, sh, { x0: cx - 214, y0: base - 186, x1: cx + 214, y1: base - 186, sag: 8, count: 26, size: 2.2 }));
  // forecourt: path, floral welcome stands, clipped trees in pots, lamp posts
  const L = [[cx - 96, base + 34], [cx - 150, 820], [cx - 250, 920], [cx - 380, 1040]];
  const R = [[cx + 96, base + 34], [cx + 150, 820], [cx + 250, 920], [cx + 380, 1040]];
  sh.add(`<path d="${spline(L)}L${R[3][0]},${R[3][1]}${spline([...R].reverse()).replace(/^M[^C]+/, '')}Z" fill="${sh.linear([[0, '#8f8fb8'], [1, '#55598f']], { user: true, y1: 750, y2: 1010 })}" opacity=".92"/>`);
  sh.add(`<ellipse cx="${cx}" cy="880" rx="330" ry="110" fill="${sh.glowFill('#ffcf8a')}" opacity=".32"/>`);
  for (const side of [-1, 1]) {
    const x = cx + side * 150;
    sh.add(`<rect x="${x - 5}" y="${base - 96}" width="10" height="130" fill="#c9962e"/>`);
    sh.add(foliage(r, { x, y: base - 110, w: 46, h: 40, pal: { dark: '#2f6b4a', mid: '#4a9a5c', light: '#86c873', hi: '#d6f09a' }, puffs: 6, dabs: 16 }));
    for (let i = 0; i < 16; i++) sh.add(pom(r, x + r.range(-44, 44), base - 110 + r.range(-38, 34), r.range(9, 15), r.pick(['#fff5f8', '#f9c2d6', '#ffb238']), r.pick(['#d98aa8', '#cf621a']), '#fffbe8'));
    for (const [dx, s] of [[310, 0.9], [470, 1.0], [650, 1.1]]) {
      const px = cx + side * dx, py = 760 + (dx - 310) * 0.12;
      sh.add(`<path d="M${px - 22 * s},${py}h${44 * s}l${-6 * s},${34 * s}h${-32 * s}z" fill="#b9825f"/>`);
      sh.add(cypress(r, { x: px, y: py + 2, s: 0.62 * s, pal: leaf }));
    }
    for (const [dx, y, s] of [[230, 800, 0.8], [330, 900, 1.05]]) sh.add(lampPost(sh, { x: cx + side * dx, y, s }));
    for (let i = 0; i < 6; i++) { const u = (i + 0.5) / 6; sh.add(diya(sh, cx + side * lerp(120, 360, u), lerp(770, 1000, u), lerp(0.6, 1.2, u))); }
  }
  sh.add(flowerField(r, { x0: 0, x1: cx - 420, top: 780, count: 120, colors: ['#fff', '#ffd9e6', '#f7b8d2'], far: 4, near: 12, stems: '#2f6f7c', glowSheet: sh, glowColor: '#ffe9f2' }));
  sh.add(flowerField(r, { x0: cx + 420, x1: W, top: 780, count: 120, colors: ['#fff', '#ffd9e6', '#f7b8d2'], far: 4, near: 12, stems: '#2f6f7c', glowSheet: sh, glowColor: '#ffe9f2' }));
  sh.add(grass(r, { y: 1004, count: 110, colors: ['#2f6f7c', '#16304d', '#0f2240'], h: 54, w: 4.2 }));
  return [{ name: 'hotel-front', sheet: sh }];
}

export const SETPIECES = () => [...gate(), ...toran(), ...arch(), ...curtain(), ...pillar(), ...mandap(), ...hotel()];
