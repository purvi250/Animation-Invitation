/* ============================================================================
   The painted world of the invitation: one garden, followed from a sunlit
   afternoon to a starlit night. Each function returns transparent layers
   (far → near) that the website stacks and moves at different speeds.
   Canvas: 2400 × 1000, horizon near y = 520, characters stand near y = 930.
   ============================================================================ */
import {
  W, H, rng, n, lerp, spline, ribbon, ridge, ground, yAt, Sheet, glow, foliage, tree, cypress,
  flower, pom, flowerField, grass, strokes, cloud, lantern, lampPost, lightString, diya, chhatri,
  pavilion, palaceFar, balustrade,
} from './kit.mjs';
import { SETPIECES } from './setpieces.mjs';

const hill = (sh, pts, stops, y1, y2, wobble = 5) => {
  const d = ground(pts);
  return { d, art: `<path d="${d}" fill="${sh.linear(stops, { user: true, y1, y2 })}" filter="${sh.paint(wobble, 0.02)}"/>` };
};
const within = (sh, d, inner) => `<g clip-path="${sh.clip(d)}">${inner}</g>`;
const woods = (r, pts, pal, { step = 46, w = 36, h = 24, lift = 8, lx = -0.5, x0 = -40, x1 = W + 40, skip } = {}) => {
  let s = '';
  for (let x = x0; x < x1; x += step * r.range(0.7, 1.3)) {
    if (skip && skip(x)) continue;
    const k = r.range(0.75, 1.35);
    s += foliage(r, { x, y: yAt(pts, x) - lift * k, w: w * k, h: h * k, pal, puffs: 4, dabs: 5, lx });
  }
  return s;
};

/* ----------------------------------------------------------------------------
   1 · AFTERNOON MEADOW — the opening, behind the envelope
   ---------------------------------------------------------------------------- */
export function meadow() {
  const leaf = { dark: '#2e7d57', mid: '#4fab5e', light: '#8ed26a', hi: '#d8f193' };
  const leafFar = { dark: '#62a583', mid: '#82c08a', light: '#aadb9c', hi: '#d5f0b6' };
  const stone = { light: '#fdf3e3', mid: '#ecd0c0', dark: '#b98f8f', domeLight: '#fffaf0', domeShade: '#e6c6c2', trim: '#d9a441' };
  const out = [];

  { // far: blue mountains, a palace on a distant rise, hazy woods
    const sh = new Sheet(); const r = rng(101);
    const m1 = ridge(r, { y: 428, amp: 92, waves: [[1.1, 1], [2.3, 0.5], [4.9, 0.22]] });
    const a = hill(sh, m1, [[0, '#8dbde6'], [0.45, '#b8d8f0'], [1, '#e4f1f5']], 330, 640, 6);
    sh.add(a.art, within(sh, a.d, strokes(r, { y0: 390, y1: 560, count: 46, colors: ['#ffffff', '#dcecf8', '#7fb0dc'], w: [8, 22], len: [120, 320], op: [0.1, 0.26], tilt: 0.25 })));
    const m2 = ridge(r, { y: 502, amp: 42, waves: [[1.7, 1], [3.6, 0.4], [7.1, 0.2]] });
    const b = hill(sh, m2, [[0, '#84c0bd'], [0.5, '#a8d7bf'], [1, '#d0eaca']], 450, 640, 5);
    sh.add(b.art, within(sh, b.d, strokes(r, { y0: 470, y1: 600, count: 36, colors: ['#e9f7dc', '#6aa9a8'], w: [6, 16], len: [100, 260], op: [0.1, 0.22], tilt: 0.15 })));
    sh.add(`<g opacity=".94">${palaceFar(sh, { x: 1560, y: yAt(m2, 1560) + 8, s: 0.62, pal: stone })}</g>`);
    const m3 = ridge(r, { y: 546, amp: 16, waves: [[2.1, 1], [5.3, 0.5]] });
    sh.add(woods(r, m3, leafFar, { lx: 0.5 }), `<path d="${ground(m3)}" fill="#a4d594"/>`);
    sh.add(`<rect x="0" y="455" width="${W}" height="170" fill="${sh.linear([[0, '#fff', 0], [0.55, '#fff', 0.42], [1, '#fff', 0.06]])}"/>`);
    out.push({ name: 'meadow-far', sheet: sh });
  }

  { // mid: rolling hills, a winding path, sunlit trees
    const sh = new Sheet(); const r = rng(202);
    const h1 = ridge(r, { y: 592, amp: 32, waves: [[0.9, 1], [2.2, 0.5], [4.3, 0.2]] });
    const a = hill(sh, h1, [[0, '#cdee86'], [0.3, '#9bd56f'], [1, '#62b05e']], 545, 900);
    let shade = '';
    for (const [x, y, rx] of [[420, 640, 300], [1750, 660, 340], [1050, 700, 260]]) shade += `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="34" fill="#2f7d57" opacity=".16" filter="${sh.blur(16)}"/>`;
    sh.add(a.art, within(sh, a.d, shade + strokes(r, { y0: 570, y1: 760, count: 70, colors: ['#e6f7a4', '#fff7c0', '#4e9f58'], w: [5, 16], len: [90, 260], op: [0.12, 0.28] })));
    for (const x of [150, 560, 790, 1010, 1200, 1720, 1930, 2270]) sh.add(tree(r, { x, y: yAt(h1, x) + 12, s: r.range(0.3, 0.46), pal: leaf, lx: 0.5, dabs: 12, puffs: 6 }));

    const L = [[980, 1040], [1120, 884], [1322, 772], [1424, 678], [1490, 622], [1526, 592]];
    const R = [[1500, 1040], [1424, 894], [1506, 784], [1524, 686], [1538, 626], [1550, 592]];
    sh.add(`<path d="${ribbon(L, R)}" fill="${sh.linear([[0, '#fff6d6'], [1, '#f0dba6']], { user: true, y1: 590, y2: 1000 })}" filter="${sh.paint(4, 0.03)}"/>`);
    sh.add(`<path d="${spline(R)}" stroke="#d9bf86" stroke-width="5" fill="none" opacity=".6"/>`);

    const h2 = ridge(r, { y: 690, amp: 40, waves: [[0.8, 1], [1.9, 0.5]], shape: (x) => Math.exp(-(((x - 1270) / 400) ** 2)) * 150 });
    const c = hill(sh, h2, [[0, '#b8e678'], [0.35, '#86cb69'], [1, '#55a65b']], 650, 980);
    sh.add(c.art, within(sh, c.d, strokes(r, { y0: 660, y1: 900, count: 60, colors: ['#e8f8a8', '#fff3b8', '#3f9052'], w: [6, 18], len: [100, 280], op: [0.12, 0.28] })
      + flowerField(r, { top: (x) => yAt(h2, x) + 8, bottom: 900, count: 260, colors: ['#fff', '#ffe0ea', '#ffe680', '#ffb3cc'], far: 2.4, near: 6, stems: null })));
    for (const [x, s, lean] of [[90, 1.25, 10], [300, 1.6, -14], [520, 1.15, 12], [1850, 1.0, -8], [2040, 1.55, 16], [2260, 1.25, -10]]) {
      sh.add(tree(r, { x, y: yAt(h2, x) + 26, s, pal: leaf, lean, lx: 0.5, puffs: 11, dabs: 56 }));
    }
    for (const [x, w] of [[690, 90], [1700, 80], [2380, 110]]) sh.add(foliage(r, { x, y: yAt(h2, x) + 4, w, h: w * 0.5, pal: leaf, puffs: 6, dabs: 18, lx: 0.5 }));
    out.push({ name: 'meadow-mid', sheet: sh });
  }

  { // near: a bank of wildflowers
    const sh = new Sheet(); const r = rng(303);
    const g1 = ridge(r, { y: 846, amp: 20, waves: [[1.3, 1], [3.1, 0.4]], shape: (x) => Math.exp(-(((x - 1200) / 520) ** 2)) * 30 });
    const a = hill(sh, g1, [[0, '#a2dc76'], [0.4, '#66b55d'], [1, '#3b8850']], 805, 1010, 4);
    sh.add(grass(r, { y: (x) => yAt(g1, x) + 6, count: 300, colors: ['#bfe884', '#84ca69', '#4f9f57'], h: 36, w: 3.2 }));
    sh.add(a.art, within(sh, a.d, strokes(r, { y0: 830, y1: 1000, count: 70, colors: ['#d5f39a', '#2f7d4f'], w: [5, 16], len: [80, 240], op: [0.14, 0.3] })));
    sh.add(foliage(r, { x: 120, y: 935, w: 250, h: 120, pal: leaf, puffs: 12, dabs: 70, lx: 0.5 }));
    sh.add(foliage(r, { x: 2290, y: 940, w: 260, h: 125, pal: leaf, puffs: 12, dabs: 70, lx: 0.5 }));
    sh.add(flowerField(r, { top: (x) => yAt(g1, x), count: 360, colors: ['#ffffff', '#fff5fb', '#ffc9dc', '#ff9dbb', '#ffe680', '#f7a8d8'], far: 4.5, near: 16 }));
    sh.add(grass(r, { y: 1004, count: 150, colors: ['#8fd06a', '#4f9f57', '#2f7d4f'], h: 64, w: 4.6 }));
    out.push({ name: 'meadow-near', sheet: sh });
  }
  return out;
}

/* ----------------------------------------------------------------------------
   2 · GOLDEN HOUR — a sandstone pavilion in a formal garden (the groom)
   ---------------------------------------------------------------------------- */
export function golden() {
  const leaf = { dark: '#3d5a36', mid: '#6d8a3e', light: '#b3b24e', hi: '#f3de7c' };
  const cyp = { dark: '#2c4833', mid: '#4a6c3c', light: '#8fa349', hi: '#e8d572' };
  const stone = {
    light: '#f0b48c', mid: '#d78d66', dark: '#a85e49', deep: '#55262f', deep2: '#8b4239', inner: '#dd9052',
    trim: '#f6d892', glow: '#ffbe6a', sky: '#ffd9a0', domeLight: '#fff4e1', domeShade: '#e7b99c',
  };
  const blooms = ['#ff8f2e', '#ffb238', '#ffd76a', '#fff3d6'];
  const out = [];

  { // far: hazy amber hills
    const sh = new Sheet(); const r = rng(404);
    const m1 = ridge(r, { y: 468, amp: 62, waves: [[1.0, 1], [2.6, 0.45], [5.1, 0.2]] });
    const a = hill(sh, m1, [[0, '#eebf96'], [0.5, '#f6d7b0'], [1, '#fbe8c8']], 390, 640, 6);
    sh.add(a.art, within(sh, a.d, strokes(r, { y0: 410, y1: 560, count: 40, colors: ['#fff3d2', '#d99a78'], w: [8, 20], len: [120, 300], op: [0.1, 0.24], tilt: 0.2 })));
    const m2 = ridge(r, { y: 512, amp: 32, waves: [[1.9, 1], [4.1, 0.4]] });
    const b = hill(sh, m2, [[0, '#d7a476'], [0.6, '#e8c08c'], [1, '#f2d7a2']], 470, 640, 5);
    sh.add(b.art);
    const m3 = ridge(r, { y: 556, amp: 12, waves: [[2.4, 1], [6.2, 0.4]] });
    sh.add(woods(r, m3, { dark: '#9c8250', mid: '#b99a5c', light: '#d9bb70', hi: '#f6dc8c' }, {}), `<path d="${ground(m3)}" fill="#cdb866"/>`);
    sh.add(`<rect x="0" y="450" width="${W}" height="180" fill="${sh.linear([[0, '#fff0c8', 0], [0.6, '#ffe9bc', 0.55], [1, '#ffe9bc', 0.1]])}"/>`);
    out.push({ name: 'golden-far', sheet: sh });
  }

  { // mid: lawns, hedges and a receding line of cypresses
    const sh = new Sheet(); const r = rng(505);
    const h1 = ridge(r, { y: 606, amp: 7, waves: [[1.4, 1], [3.3, 0.4]] });
    const a = hill(sh, h1, [[0, '#decf74'], [0.4, '#b7b65a'], [1, '#8f9c49']], 590, 900, 3);
    sh.add(a.art, within(sh, a.d, strokes(r, { y0: 612, y1: 760, count: 60, colors: ['#fff0a2', '#f7dc7a', '#6d8540'], w: [4, 12], len: [120, 340], op: [0.12, 0.3], tilt: 0.02 })));
    sh.add(woods(r, h1, leaf, { step: 62, w: 46, h: 22, lift: 2 }));
    // The pavilion stands at x ≈ 564 (near layer). Tall cypresses frame it; to its right a line of
    // smaller ones recedes, kept low so the sky above stays clear for the words on wide screens.
    for (const [x, y, s] of [[1790, 640, 0.56], [1665, 642, 0.66], [1530, 646, 0.76], [1385, 652, 0.86], [1235, 660, 0.95], [1098, 668, 1.05], [-70, 658, 1.15], [34, 668, 1.5]]) {
      sh.add(`<path d="M${x},${y}l${n(260 * s)},${n(34 * s)}l${n(-200 * s)},${n(8 * s)}z" fill="#55683a" opacity=".22" filter="${sh.blur(5)}"/>`);
      sh.add(cypress(r, { x, y, s, pal: cyp }));
    }
    sh.add(tree(r, { x: 1930, y: 690, s: 1.05, pal: leaf, dabs: 40 }));
    sh.add(tree(r, { x: 2140, y: 664, s: 0.8, pal: leaf, dabs: 30 }));
    sh.add(tree(r, { x: 2340, y: 704, s: 1.3, pal: leaf, lean: -12, puffs: 11, dabs: 50 }));
    out.push({ name: 'golden-mid', sheet: sh });
  }

  { // near: the pavilion, its stone path and marigold borders
    const sh = new Sheet(); const r = rng(606);
    const g1 = ridge(r, { y: 642, amp: 5, waves: [[1.1, 1], [2.9, 0.5]] });
    const a = hill(sh, g1, [[0, '#cbc762'], [0.35, '#9cab4c'], [1, '#6f8842']], 630, 1010, 3);
    sh.add(a.art, within(sh, a.d, strokes(r, { y0: 650, y1: 1000, count: 110, colors: ['#f3e486', '#e2d06a', '#55703a'], w: [4, 18], len: [110, 360], op: [0.12, 0.3], tilt: 0.02 })));
    // long evening shadows across the lawn
    for (const [x, y, w] of [[1080, 764, 560], [1480, 850, 620], [960, 700, 380], [1780, 760, 520]]) {
      sh.add(`<path d="M${x},${y}l${w},${n(w * 0.1)}l${n(-w * 0.2)},${n(w * 0.1)}l${n(-w * 0.86)},${n(-w * 0.12)}z" fill="#4c6436" opacity=".24" filter="${sh.blur(9)}"/>`);
    }
    const PX = 564; // where the pavilion (and the groom in front of it) stands
    const L = [[PX - 78, 664], [PX - 136, 760], [PX - 224, 880], [PX - 344, 1040]];
    const R = [[PX + 78, 664], [PX + 138, 760], [PX + 236, 880], [PX + 376, 1040]];
    const road = ribbon(L, R);
    sh.add(`<path d="${road}" fill="${sh.linear([[0, '#f9e4b6'], [1, '#e5bd8c']], { user: true, y1: 660, y2: 1010 })}"/>`);
    let joints = '';
    for (let i = 0; i < 9; i++) {
      const y = 664 + 350 * ((i + 1) / 9) ** 1.7;
      joints += `<path d="M${PX - 600},${n(y)}H${PX + 640}" stroke="#c99a6c" stroke-width="${n(1 + i * 0.35)}" opacity=".45"/>`;
    }
    for (const u of [0.33, 0.66]) joints += `<path d="M${n(lerp(L[0][0], R[0][0], u))},664L${n(lerp(L[3][0], R[3][0], u))},1040" stroke="#c99a6c" stroke-width="2" opacity=".35"/>`;
    sh.add(within(sh, road, joints + strokes(r, { x0: PX - 380, x1: PX + 400, y0: 670, y1: 1000, count: 30, colors: ['#fff6d8', '#d9a878'], w: [4, 12], len: [60, 200], op: [0.12, 0.26] })));
    sh.add(`<ellipse cx="${PX}" cy="668" rx="430" ry="20" fill="#5a4a2e" opacity=".28" filter="${sh.blur(8)}"/>`);
    sh.add(`<g filter="${sh.paint(2.2, 0.05)}">${pavilion(r, sh, { x: PX, y: 664, s: 1.25, pal: stone })}</g>`);
    // marigold borders along the path, growing toward the viewer
    for (const side of [-1, 1]) {
      const edge = side < 0 ? L : R;
      for (let i = 0; i < 46; i++) {
        const u = (i / 45) ** 1.25, y = lerp(690, 1010, u);
        const x = lerp(edge[0][0], edge[3][0], (y - 664) / 376) + side * r.range(8, 40) * (0.5 + u);
        const s = lerp(5, 17, u) * r.range(0.8, 1.2);
        sh.add(`<ellipse cx="${n(x)}" cy="${n(y + s * 0.5)}" rx="${n(s * 1.5)}" ry="${n(s * 0.6)}" fill="#56703a" opacity=".5"/>`);
        sh.add(pom(r, x, y, s, r.pick(['#ff8f2e', '#ffb238', '#ffa733']), '#cf621a', '#ffe08a'));
      }
    }
    for (const [dx, y, s] of [[-162, 772, 0.55], [166, 772, 0.55], [-258, 902, 0.92], [272, 902, 0.92]]) sh.add(lampPost(sh, { x: PX + dx, y, s, glowColor: '#ffd98a', frame: '#5a3d2c' }));
    sh.add(flowerField(r, { x0: 1040, x1: W, top: 716, count: 190, colors: blooms, far: 4, near: 14, stems: '#5f7a3a' }));
    sh.add(flowerField(r, { x0: 0, x1: 170, top: 780, count: 26, colors: blooms, far: 5, near: 13, stems: '#5f7a3a' }));
    sh.add(foliage(r, { x: 30, y: 975, w: 200, h: 100, pal: leaf, puffs: 11, dabs: 56 }));
    sh.add(foliage(r, { x: 2310, y: 970, w: 250, h: 110, pal: leaf, puffs: 12, dabs: 66 }));
    sh.add(foliage(r, { x: 1420, y: 985, w: 230, h: 90, pal: leaf, puffs: 11, dabs: 56 }));
    for (let i = 0; i < 30; i++) {
      const spot = i % 3;
      sh.add(pom(r, spot === 0 ? r.range(0, 190) : spot === 1 ? r.range(1260, 1600) : r.range(2080, W), r.range(900, 992), r.range(11, 19), r.pick(['#ff8f2e', '#ffb238']), '#cf621a', '#ffe08a'));
    }
    out.push({ name: 'golden-near', sheet: sh });
  }
  return out;
}

/* ----------------------------------------------------------------------------
   3 · ROSE DUSK — a marble terrace above a lake, under blossom (the bride)
   ---------------------------------------------------------------------------- */
const BLOSSOM = { dark: '#b45a8b', mid: '#e58cb0', light: '#f9c2d6', hi: '#fff2f6' };

export function dusk() {
  const leaf = { dark: '#34526b', mid: '#4d787a', light: '#84a892', hi: '#dcc6b6' };
  const marble = {
    light: '#fcf0f2', mid: '#dcc1d6', dark: '#a98bb8', deep: '#5a4a82', trim: '#e9c98a',
    domeLight: '#fff5f5', domeShade: '#d9b3cf', glow: '#ffd08a', lit: '#ffe0a0',
  };
  const out = [];

  { // far: lavender ranges and a lake holding the last light
    const sh = new Sheet(); const r = rng(707);
    const m1 = ridge(r, { y: 432, amp: 80, waves: [[1.2, 1], [2.5, 0.5], [5.3, 0.2]] });
    const a = hill(sh, m1, [[0, '#8a80c8'], [0.5, '#b29dd6'], [1, '#e2bcd6']], 340, 560, 6);
    sh.add(a.art, within(sh, a.d, strokes(r, { y0: 370, y1: 520, count: 44, colors: ['#ffd2d8', '#6f66b4'], w: [8, 22], len: [120, 320], op: [0.1, 0.24], tilt: 0.25 })));
    const m2 = ridge(r, { y: 486, amp: 40, waves: [[1.8, 1], [3.9, 0.4]] });
    sh.add(hill(sh, m2, [[0, '#786fb8'], [0.6, '#a38fca'], [1, '#d7aed2']], 440, 560, 5).art);
    sh.add(`<g opacity=".8">${palaceFar(sh, { x: 1010, y: 526, s: 0.42, lit: true, pal: { light: '#a696cf', mid: '#8a7cc0', dark: '#6a5fa8', domeLight: '#b8a8d8', domeShade: '#8a7cc0', trim: '#f3d38a', lit: '#ffdc94' } })}</g>`);
    sh.add(`<rect x="-40" y="524" width="${W + 80}" height="520" fill="${sh.linear([[0, '#ffd3c2'], [0.18, '#f2b8cc'], [0.5, '#b89bd4'], [1, '#8f86c8']], { user: true, y1: 524, y2: 760 })}"/>`);
    sh.add(`<rect x="-40" y="518" width="${W + 80}" height="9" fill="#6f66ac" opacity=".7"/>`);
    let glitter = '';
    for (let i = 0; i < 150; i++) {
      const y = 530 + 170 * r() ** 1.5, spread = 60 + (y - 530) * 1.5;
      glitter += `<rect x="${n(1900 + r.range(-spread, spread))}" y="${n(y)}" width="${n(r.range(14, 60))}" height="${n(r.range(1.4, 3.6))}" rx="2" fill="#fff3cf" opacity="${n(r.range(0.35, 0.9))}"/>`;
    }
    for (let i = 0; i < 110; i++) glitter += `<rect x="${n(r.range(0, W))}" y="${n(532 + 180 * r())}" width="${n(r.range(20, 90))}" height="${n(r.range(1.2, 3))}" rx="2" fill="${r.pick(['#fff', '#ffe3d6', '#d9c8f0'])}" opacity="${n(r.range(0.15, 0.45))}"/>`;
    for (let i = 0; i < 26; i++) glitter += glow(sh, r.range(0, W), 521, r.range(5, 10), '#ffd98a', 0.9);
    sh.add(glitter);
    out.push({ name: 'dusk-far', sheet: sh });
  }

  { // mid: the shore, a little kiosk, trees in blossom
    const sh = new Sheet(); const r = rng(808);
    const h1 = ridge(r, { y: 614, amp: 11, waves: [[1.3, 1], [3.4, 0.4]] });
    const a = hill(sh, h1, [[0, '#86ab92'], [0.4, '#557f7a'], [1, '#3d6570']], 600, 900, 4);
    sh.add(a.art, within(sh, a.d, strokes(r, { y0: 618, y1: 780, count: 50, colors: ['#f3c9cf', '#c9e0b4', '#2f5568'], w: [4, 12], len: [100, 300], op: [0.1, 0.24], tilt: 0.02 })));
    sh.add(woods(r, h1, leaf, { step: 58, w: 44, h: 22, lift: 2 }));
    // The bride stands at x ≈ 1836 (see scenes.css). A great blossom tree leans in from her right;
    // everything to her left stays low, leaving open sky for the words on wide screens.
    sh.add(chhatri(sh, { x: 1010, y: 634, s: 0.66, pal: marble, lit: true }));
    const trunk = { trunk: '#5a3f4c', trunkDark: '#3e2a38' };
    for (const [x, y, s, lean] of [[90, 694, 1.2, 10], [360, 662, 0.8, 8], [700, 660, 0.7, -6], [1250, 664, 0.72, 10], [1420, 652, 0.5, -6]]) {
      sh.add(tree(r, { x, y, s, lean, pal: BLOSSOM, ...trunk, puffs: 10, dabs: 44, shadow: 'rgba(30,40,70,.25)' }));
    }
    sh.add(tree(r, { x: 2300, y: 724, s: 1.85, lean: -50, pal: BLOSSOM, ...trunk, cw: 150, ch: 105, puffs: 13, dabs: 80, shadow: 'rgba(30,40,70,.25)' }));
    let petals = '';
    for (let i = 0; i < 70; i++) petals += `<ellipse cx="${n(r.range(1880, 2400))}" cy="${n(r.range(640, 760))}" rx="${n(r.range(3, 6))}" ry="${n(r.range(1.5, 3))}" fill="${r.pick(['#f9c2d6', '#fff2f6'])}" opacity=".85" transform="rotate(${n(r.range(0, 180))})" transform-origin="center" style="transform-box:fill-box"/>`;
    sh.add(petals);
    out.push({ name: 'dusk-mid', sheet: sh });
  }

  { // near: marble terrace and balustrade
    const sh = new Sheet(); const r = rng(909);
    sh.add(`<rect x="-40" y="756" width="${W + 80}" height="300" fill="${sh.linear([[0, '#f8e7ec'], [0.5, '#dfc6d9'], [1, '#bfa5cc']], { user: true, y1: 756, y2: 1010 })}"/>`);
    let tiles = '';
    for (let i = 0; i < 7; i++) tiles += `<path d="M-40,${n(756 + 250 * ((i + 1) / 7) ** 1.7)}H${W + 40}" stroke="#a98bb8" stroke-width="${n(1.2 + i * 0.5)}" opacity=".4"/>`;
    for (let x = -1400; x <= W + 1400; x += 190) tiles += `<path d="M${n(lerp(1836, x, 0.5))},756L${x},1010" stroke="#a98bb8" stroke-width="2" opacity=".32"/>`;
    sh.add(tiles, strokes(r, { y0: 770, y1: 1000, count: 46, colors: ['#fff', '#b79cc8'], w: [5, 16], len: [120, 360], op: [0.1, 0.22], tilt: 0.01 }));
    sh.add(`<rect x="-40" y="756" width="${W + 80}" height="30" fill="${sh.linear([[0, '#7a5f98', 0.4], [1, '#7a5f98', 0]])}"/>`);
    sh.add(balustrade(sh, { y: 770, h: 132, pal: marble, post: 380, gap: 31 }));
    for (const x of [1300, 2240, 500]) { // urns of roses along the balustrade
      sh.add(`<path d="M${x - 34},770c-10,-40 -6,-66 34,-70c40,4 44,30 34,70z" fill="${sh.linear([[0, '#fcf0f2'], [1, '#c9aad0']], { x1: 0, y1: 0, x2: 1, y2: 0 })}"/>`);
      sh.add(foliage(r, { x, y: 666, w: 84, h: 52, pal: leaf, puffs: 7, dabs: 26 }));
      for (let i = 0; i < 12; i++) sh.add(pom(r, x + r.range(-70, 70), 660 + r.range(-34, 24), r.range(8, 13), r.pick(['#f6a6c0', '#fff0f4', '#e0708f']), '#b14f78', '#fff2f6'));
    }
    out.push({ name: 'dusk-near', sheet: sh });
  }
  return out;
}

/* ----------------------------------------------------------------------------
   4 · BLUE HOUR — a lantern-hung clearing (the two together)
   ---------------------------------------------------------------------------- */
const NIGHT_LEAF = { dark: '#0f2742', mid: '#1c4560', light: '#2f6f7c', hi: '#68b4a4' };

function fairyTree(r, sh, { x, y, s, lean = 0, lanterns = 3, pal = NIGHT_LEAF }) {
  let g = tree(r, { x, y, s, lean, pal, trunk: '#2b2333', trunkDark: '#1a1524', puffs: 12, dabs: 60, shadow: 'rgba(5,10,30,.35)' });
  const cx = x + lean * s, cy = y - 150 * s - 42 * s;
  for (let i = 0; i < 22 * s; i++) {
    const a = r() * 6.283, d = Math.sqrt(r());
    g += glow(sh, cx + Math.cos(a) * d * 120 * s, cy + Math.sin(a) * d * 80 * s, r.range(5, 9), '#ffe2a0', 0.9);
  }
  for (let i = 0; i < lanterns; i++) {
    const lx = cx + lerp(-90, 90, (i + 0.5) / lanterns) * s + r.range(-12, 12);
    g += lantern(sh, { x: lx, y: cy + 62 * s, s: 1.1 * Math.min(1.3, s), drop: r.range(24, 70) * s });
  }
  return g;
}

export function grove() {
  const out = [];
  { // far: indigo hills in mist
    const sh = new Sheet(); const r = rng(1010);
    const m1 = ridge(r, { y: 468, amp: 62, waves: [[1.1, 1], [2.4, 0.5], [5.2, 0.2]] });
    const a = hill(sh, m1, [[0, '#3a3f90'], [0.6, '#5856a8'], [1, '#8a7cc4']], 390, 640, 6);
    sh.add(a.art, within(sh, a.d, strokes(r, { y0: 410, y1: 560, count: 36, colors: ['#9f95e0', '#262a70'], w: [8, 20], len: [120, 300], op: [0.1, 0.22], tilt: 0.22 })));
    const m2 = ridge(r, { y: 516, amp: 28, waves: [[1.9, 1], [4.2, 0.4]] });
    sh.add(hill(sh, m2, [[0, '#2e3a80'], [0.6, '#46509c'], [1, '#6c6cb4']], 480, 640, 5).art);
    const m3 = ridge(r, { y: 560, amp: 12, waves: [[2.4, 1], [6.2, 0.4]] });
    sh.add(woods(r, m3, { dark: '#1c2c60', mid: '#263c70', light: '#35547f', hi: '#4f7a94' }), `<path d="${ground(m3)}" fill="#22386a"/>`);
    sh.add(`<rect x="0" y="470" width="${W}" height="170" fill="${sh.linear([[0, '#c8b6f0', 0], [0.6, '#c8b6f0', 0.38], [1, '#c8b6f0', 0.05]])}"/>`);
    out.push({ name: 'grove-far', sheet: sh });
  }
  { // mid: trees strung with lights
    const sh = new Sheet(); const r = rng(1111);
    const h1 = ridge(r, { y: 608, amp: 9, waves: [[1.2, 1], [3.0, 0.4]] });
    const a = hill(sh, h1, [[0, '#356a7c'], [0.4, '#22485f'], [1, '#162c4a']], 596, 900, 3);
    sh.add(a.art, within(sh, a.d, strokes(r, { y0: 612, y1: 780, count: 50, colors: ['#5fa59a', '#0f2240'], w: [4, 12], len: [100, 300], op: [0.1, 0.22], tilt: 0.02 })));
    sh.add(woods(r, h1, NIGHT_LEAF, { step: 60, w: 46, h: 22, lift: 2 }));
    sh.add(fairyTree(r, sh, { x: 110, y: 724, s: 1.5, lean: 8 }));
    sh.add(fairyTree(r, sh, { x: 2300, y: 724, s: 1.5, lean: -8 }));
    sh.add(fairyTree(r, sh, { x: 430, y: 738, s: 2.0, lean: 20, lanterns: 4 }));
    sh.add(fairyTree(r, sh, { x: 1980, y: 738, s: 2.0, lean: -20, lanterns: 4 }));
    sh.add(fairyTree(r, sh, { x: 850, y: 704, s: 1.55, lean: 34 }));
    sh.add(fairyTree(r, sh, { x: 1550, y: 704, s: 1.55, lean: -34 }));
    sh.add(lightString(r, sh, { x0: 300, y0: 236, x1: 1200, y1: 168, sag: 46, count: 30, hang: 5 }));
    sh.add(lightString(r, sh, { x0: 1200, y0: 168, x1: 2100, y1: 236, sag: 46, count: 30, hang: 5 }));
    sh.add(lightString(r, sh, { x0: 700, y0: 340, x1: 1200, y1: 262, sag: 40, count: 18, hang: 6 }));
    sh.add(lightString(r, sh, { x0: 1200, y0: 262, x1: 1700, y1: 340, sag: 40, count: 18, hang: 6 }));
    out.push({ name: 'grove-mid', sheet: sh });
  }
  { // near: a lawn ringed with oil lamps
    const sh = new Sheet(); const r = rng(1212);
    const g1 = ridge(r, { y: 804, amp: 12, waves: [[1.3, 1], [3.1, 0.4]] });
    const a = hill(sh, g1, [[0, '#2a586c'], [0.4, '#1a3a55'], [1, '#0f2038']], 790, 1010, 3);
    sh.add(grass(r, { y: (x) => yAt(g1, x) + 5, count: 240, colors: ['#3f8a8a', '#21506a', '#16304d'], h: 30, w: 3 }));
    sh.add(a.art);
    sh.add(`<ellipse cx="1200" cy="905" rx="620" ry="90" fill="${sh.glowFill('#ffcf8a')}" opacity=".42"/>`);
    sh.add(flowerField(r, { top: (x) => yAt(g1, x), count: 230, colors: ['#ffffff', '#ffd9e6', '#f7b8d2', '#fff0b8'], far: 4, near: 13, stems: '#2f6f7c', glowSheet: sh, glowColor: '#ffe9f2' }));
    for (let i = 0; i < 15; i++) {
      const a2 = lerp(0.12, 0.88, i / 14) * Math.PI;
      sh.add(diya(sh, 1200 - Math.cos(a2) * 520, 872 + Math.sin(a2) * 78, lerp(0.8, 1.25, Math.sin(a2))));
    }
    sh.add(foliage(r, { x: 90, y: 950, w: 250, h: 120, pal: NIGHT_LEAF, puffs: 12, dabs: 60 }));
    sh.add(foliage(r, { x: 2320, y: 955, w: 260, h: 120, pal: NIGHT_LEAF, puffs: 12, dabs: 60 }));
    sh.add(grass(r, { y: 1004, count: 120, colors: ['#2f6f7c', '#16304d', '#0f2240'], h: 58, w: 4.4 }));
    out.push({ name: 'grove-near', sheet: sh });
  }
  return out;
}

/* ----------------------------------------------------------------------------
   5 · EVENING GARDEN — lamp-lit walk (invitation card and venue)
   ---------------------------------------------------------------------------- */
export function evening() {
  const out = [];
  { const sh = new Sheet(); const r = rng(1313);
    const m1 = ridge(r, { y: 486, amp: 54, waves: [[1.3, 1], [2.8, 0.5], [5.6, 0.2]] });
    const a = hill(sh, m1, [[0, '#2a2f7a'], [0.6, '#3d3f90'], [1, '#5f5aa8']], 410, 660, 6);
    sh.add(a.art, within(sh, a.d, strokes(r, { y0: 430, y1: 580, count: 30, colors: ['#8f88d8', '#1c205c'], w: [8, 20], len: [120, 300], op: [0.1, 0.2], tilt: 0.22 })));
    const m2 = ridge(r, { y: 540, amp: 22, waves: [[2.0, 1], [4.6, 0.4]] });
    sh.add(hill(sh, m2, [[0, '#222a6a'], [1, '#34407f']], 500, 680, 5).art);
    let town = '';
    for (let i = 0; i < 60; i++) { const x = r.range(0, W); town += glow(sh, x, yAt(m2, x) + r.range(4, 40), r.range(4, 9), '#ffd98a', 0.9); }
    sh.add(town, `<rect x="0" y="490" width="${W}" height="170" fill="${sh.linear([[0, '#a99be6', 0], [0.6, '#a99be6', 0.3], [1, '#a99be6', 0.04]])}"/>`);
    out.push({ name: 'evening-far', sheet: sh });
  }
  { const sh = new Sheet(); const r = rng(1414);
    const g1 = ridge(r, { y: 716, amp: 14, waves: [[1.1, 1], [2.9, 0.4]] });
    const a = hill(sh, g1, [[0, '#28566e'], [0.4, '#193853'], [1, '#0e1e38']], 700, 1010, 3);
    sh.add(woods(r, g1, NIGHT_LEAF, { step: 64, w: 50, h: 26, lift: 4 }));
    sh.add(a.art, within(sh, a.d, strokes(r, { y0: 724, y1: 1000, count: 60, colors: ['#4f9a94', '#0b1a34'], w: [4, 14], len: [100, 320], op: [0.1, 0.22], tilt: 0.02 })));
    const L = [[1128, 724], [1080, 800], [1000, 900], [900, 1040]];
    const R = [[1272, 724], [1320, 800], [1400, 900], [1500, 1040]];
    sh.add(`<path d="${ribbon(L, R)}" fill="${sh.linear([[0, '#6f76a8'], [1, '#474c86']], { user: true, y1: 720, y2: 1010 })}" opacity=".9"/>`);
    sh.add(`<ellipse cx="1200" cy="900" rx="380" ry="110" fill="${sh.glowFill('#ffcf8a')}" opacity=".35"/>`);
    for (const [x, y, s, lean] of [[120, 806, 1.75, 12], [2290, 806, 1.75, -12], [700, 742, 1.05, 8], [1700, 742, 1.05, -8]]) sh.add(fairyTree(r, sh, { x, y, s, lean, lanterns: 2 }));
    for (const [x, y, s] of [[1040, 738, 1.0], [1360, 738, 1.0], [950, 748, 0.82], [1450, 748, 0.82]]) sh.add(cypress(r, { x, y, s, pal: NIGHT_LEAF }));
    for (const [x, y, s] of [[330, 790, 1.0], [560, 776, 0.86], [1840, 776, 0.86], [2070, 790, 1.0], [1010, 812, 0.9], [1390, 812, 0.9]]) sh.add(lampPost(sh, { x, y, s }));
    sh.add(lightString(r, sh, { x0: 352, y0: 640, x1: 579, y1: 648, sag: 18, count: 12 }));
    sh.add(lightString(r, sh, { x0: 1859, y0: 648, x1: 2092, y1: 640, sag: 18, count: 12 }));
    for (let i = 0; i < 6; i++) {
      const u = (i + 0.5) / 6, y = lerp(760, 1000, u);
      sh.add(diya(sh, lerp(1110, 900, u) - 14, y, lerp(0.6, 1.2, u)), diya(sh, lerp(1290, 1500, u) + 14, y, lerp(0.6, 1.2, u)));
    }
    sh.add(flowerField(r, { x0: 0, x1: 860, top: 780, count: 110, colors: ['#fff', '#ffd9e6', '#f7b8d2'], far: 4, near: 12, stems: '#2f6f7c', glowSheet: sh, glowColor: '#ffe9f2' }));
    sh.add(flowerField(r, { x0: 1540, x1: W, top: 780, count: 110, colors: ['#fff', '#ffd9e6', '#f7b8d2'], far: 4, near: 12, stems: '#2f6f7c', glowSheet: sh, glowColor: '#ffe9f2' }));
    sh.add(grass(r, { y: 1004, count: 110, colors: ['#2f6f7c', '#16304d', '#0f2240'], h: 54, w: 4.2 }));
    out.push({ name: 'evening-garden', sheet: sh });
  }
  return out;
}

/* ----------------------------------------------------------------------------
   6 · STARLIT NIGHT — the garden dressed for the celebration (save the date)
   ---------------------------------------------------------------------------- */
export function night() {
  const leaf = { dark: '#0c1c38', mid: '#16304d', light: '#235570', hi: '#4f9a94' };
  const out = [];
  { const sh = new Sheet(); const r = rng(1515);
    const m1 = ridge(r, { y: 492, amp: 50, waves: [[1.2, 1], [2.6, 0.5], [5.1, 0.2]] });
    sh.add(hill(sh, m1, [[0, '#161c52'], [0.6, '#222868'], [1, '#383a82']], 420, 660, 6).art);
    const m2 = ridge(r, { y: 548, amp: 20, waves: [[2.1, 1], [4.4, 0.4]] });
    sh.add(hill(sh, m2, [[0, '#121848'], [1, '#1e2660']], 510, 680, 5).art);
    sh.add(`<g opacity=".85">${palaceFar(sh, { x: 470, y: yAt(m2, 470) + 6, s: 0.5, lit: true, pal: { light: '#3a3f86', mid: '#2c3174', dark: '#1e2260', domeLight: '#4a4f98', domeShade: '#2c3174', trim: '#f3d38a', lit: '#ffdc94' } })}</g>`);
    let town = '';
    for (let i = 0; i < 80; i++) { const x = r.range(0, W); town += glow(sh, x, yAt(m2, x) + r.range(4, 44), r.range(4, 9), '#ffd98a', 0.9); }
    sh.add(town, `<rect x="0" y="500" width="${W}" height="160" fill="${sh.linear([[0, '#8f86d8', 0], [0.6, '#8f86d8', 0.24], [1, '#8f86d8', 0.03]])}"/>`);
    out.push({ name: 'night-far', sheet: sh });
  }
  { const sh = new Sheet(); const r = rng(1616);
    const g1 = ridge(r, { y: 652, amp: 10, waves: [[1.2, 1], [3.1, 0.4]] });
    const a = hill(sh, g1, [[0, '#1f4660'], [0.4, '#142d4a'], [1, '#0a1630']], 640, 1010, 3);
    sh.add(woods(r, g1, leaf, { step: 60, w: 50, h: 26, lift: 4 }));
    sh.add(a.art, within(sh, a.d, strokes(r, { y0: 660, y1: 1000, count: 70, colors: ['#3f8a8a', '#081228'], w: [4, 14], len: [100, 320], op: [0.1, 0.22], tilt: 0.02 })));
    sh.add(`<ellipse cx="1200" cy="800" rx="760" ry="170" fill="${sh.glowFill('#ffd9a0')}" opacity=".36"/>`);
    for (const [x, y, s, lean, k] of [[60, 744, 1.4, 6, 2], [2340, 744, 1.4, -6, 2], [640, 704, 1.2, 10, 2], [1760, 704, 1.2, -10, 2], [330, 766, 1.95, 16, 4], [2070, 766, 1.95, -16, 4]]) {
      sh.add(fairyTree(r, sh, { x, y, s, lean, lanterns: k, pal: leaf }));
    }
    for (const [x1, y1, c] of [[330, 350, 26], [2070, 350, 26], [700, 400, 20], [1700, 400, 20], [-40, 280, 34], [2440, 280, 34]]) {
      sh.add(lightString(r, sh, { x0: 1200, y0: 70, x1, y1, sag: 26, count: c }));
    }
    for (let i = 0; i < 7; i++) {
      const u = (i + 0.5) / 7, y = lerp(700, 1000, u);
      sh.add(diya(sh, lerp(900, 560, u), y, lerp(0.6, 1.25, u)), diya(sh, lerp(1500, 1840, u), y, lerp(0.6, 1.25, u)));
    }
    sh.add(flowerField(r, { x0: 0, x1: 760, top: 730, count: 120, colors: ['#fff', '#ffd9e6', '#f7b8d2', '#fff0b8'], far: 4, near: 13, stems: '#235570', glowSheet: sh, glowColor: '#ffe9f2' }));
    sh.add(flowerField(r, { x0: 1640, x1: W, top: 730, count: 120, colors: ['#fff', '#ffd9e6', '#f7b8d2', '#fff0b8'], far: 4, near: 13, stems: '#235570', glowSheet: sh, glowColor: '#ffe9f2' }));
    out.push({ name: 'night-garden', sheet: sh });
  }
  return out;
}

/* ----------------------------------------------------------------------------
   Sky furniture: clouds in three lights, and a branch of blossom for framing
   ---------------------------------------------------------------------------- */
export const CLOUD_TINTS = {
  day: { top: '#ffffff', shade: '#d3e1f6', deep: '#b3c8ec', rim: '#ffffff' },
  sunset: { top: '#fbd3bd', shade: '#e79aae', deep: '#a97fc0', rim: '#ffe8d2' },
  night: { top: '#2b3070', shade: '#20245c', deep: '#171a4a', rim: '#474c94' },
};

export function clouds() {
  const out = [];
  const shapes = [
    { seed: 21, w: 820, h: 330, lobes: 10 },
    { seed: 34, w: 700, h: 250, lobes: 8 },
    { seed: 47, w: 860, h: 290, lobes: 11 },
    { seed: 58, w: 560, h: 200, lobes: 7 },
  ];
  for (const [tint, pal] of Object.entries(CLOUD_TINTS)) {
    shapes.forEach((sp, i) => {
      const sh = new Sheet(960, 460);
      sh.add(cloud(rng(sp.seed), sh, { x: 480, y: 410, w: sp.w, h: sp.h, pal, lobes: sp.lobes }));
      out.push({ name: `cloud-${i + 1}-${tint}`, sheet: sh, grain: false });
    });
  }
  return out;
}

export function blossomBranch() {
  const sh = new Sheet(1100, 760); const r = rng(77);
  const bough = [[-30, 40], [150, 96], [330, 120], [520, 190], [690, 300], [800, 420]];
  const twigs = [
    [[150, 96], [230, 190], [250, 300]], [[330, 120], [430, 60], [540, 40]], [[520, 190], [560, 320], [520, 430]],
    [[690, 300], [800, 290], [900, 330]], [[330, 120], [300, 230], [360, 330]],
  ];
  let wood = `<path d="${spline(bough)}" stroke="#5b3d46" stroke-width="20" fill="none" stroke-linecap="round"/><path d="${spline(bough)}" stroke="#8a6064" stroke-width="6" fill="none" stroke-linecap="round" transform="translate(-2,-5)"/>`;
  for (const t of twigs) wood += `<path d="${spline(t)}" stroke="#5b3d46" stroke-width="9" fill="none" stroke-linecap="round"/>`;
  sh.add(`<g filter="${sh.paint(4, 0.04)}">${wood}</g>`);
  const spots = [[90, 80, 80], [240, 150, 96], [250, 300, 70], [420, 80, 90], [540, 40, 66], [470, 190, 80], [560, 330, 84], [520, 440, 60], [680, 290, 90], [800, 420, 70], [890, 330, 62], [350, 320, 64], [20, 30, 90], [640, 180, 60]];
  for (const [x, y, w] of spots) sh.add(foliage(r, { x, y, w, h: w * 0.72, pal: BLOSSOM, puffs: 7, dabs: 26, lx: 0.4, ly: -0.7 }));
  for (let i = 0; i < 90; i++) {
    const [x, y, w] = r.pick(spots);
    sh.add(flower(x + r.range(-w, w), y + r.range(-w * 0.7, w * 0.7), r.range(7, 13), r.pick(['#fff5f8', '#ffd9e6', '#ffc2d6']), r.pick(['#ffd76a', '#f08aa8']), r.range(0, 72)));
  }
  for (let i = 0; i < 26; i++) {
    const x = r.range(80, 1000), y = r.range(260, 720);
    sh.add(`<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(r.range(5, 9))}" ry="${n(r.range(2.5, 4.5))}" fill="${r.pick(['#f9c2d6', '#fff2f6', '#f4a6c2'])}" opacity="${n(r.range(0.6, 0.95))}" transform="rotate(${n(r.range(0, 180))} ${n(x)} ${n(y)})"/>`);
  }
  return [{ name: 'blossom-branch', sheet: sh }];
}

/* Colour grades: the story now meets the bride at golden hour and the groom at sunset, so the two
   paintings are re-lit rather than repainted. Values are an SVG colour matrix (R, G, B, A rows). */
const GRADE = {
  // the marble terrace, warmed toward gold
  goldenRose: '1.06 0.05 0 0 0.03  0.02 1.0 0 0 0.02  0 0.02 0.88 0 0  0 0 0 1 0',
  // the sandstone garden, deepened toward a late, rosy sunset
  sunset: '1.0 0.04 0 0 0.02  0.03 0.82 0 0 0  0.08 0 0.80 0 0.05  0 0 0 1 0',
};
const graded = (layers, grade) => layers.map((l) => ({ ...l, grade }));

export const ALL = () => [
  ...meadow(), ...graded(golden(), GRADE.sunset), ...graded(dusk(), GRADE.goldenRose),
  ...grove(), ...evening(), ...night(), ...clouds(), ...blossomBranch(), ...SETPIECES(),
];
export { H };
