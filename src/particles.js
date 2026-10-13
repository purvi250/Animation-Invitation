/* ============================================================================
   PARTICLES — one light canvas for everything that floats: petals and leaves by
   day, sun-motes at golden hour, fireflies after dark. The mix follows the
   sky's "time", and the whole field drifts a little as the page scrolls.
   Drawn beneath the text, so it can never cover the invitation details.
   ============================================================================ */
(function () {
  'use strict';
  const Invite = window.Invite;
  const { clamp, lerp, span } = Invite;

  const PETAL_TINTS = [['#fff0f4', '#f9bfd0'], ['#fffaf2', '#ffd9cf'], ['#ffd3de', '#ef8faa'], ['#fff1cc', '#ffcd86']];
  const LEAF_TINTS = [['#d3ee9a', '#78b964'], ['#f3e08c', '#c7a548']];

  let canvas, ctx, w = 0, h = 0, dpr = 1;
  let sprites = null;
  let pools = null;
  let bursts = [];
  let weights = { petal: 1, leaf: 1, mote: 0.6, firefly: 0 };
  let running = false, raf = 0, lastT = 0, clock = 0;

  const rnd = (a, b) => a + Math.random() * (b - a);

  function sprite(size, draw) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    draw(c.getContext('2d'), size);
    return c;
  }
  function petalSprite([light, dark]) {
    return sprite(64, (g, s) => {
      const grad = g.createLinearGradient(s * 0.2, 0, s * 0.8, s);
      grad.addColorStop(0, light); grad.addColorStop(1, dark);
      g.fillStyle = grad;
      g.beginPath();
      g.moveTo(s * 0.5, s * 0.04);
      g.bezierCurveTo(s * 0.9, s * 0.2, s * 0.92, s * 0.66, s * 0.5, s * 0.96);
      g.bezierCurveTo(s * 0.08, s * 0.66, s * 0.1, s * 0.2, s * 0.5, s * 0.04);
      g.fill();
      g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(s * 0.5, s * 0.16); g.quadraticCurveTo(s * 0.56, s * 0.5, s * 0.5, s * 0.84); g.stroke();
    });
  }
  function leafSprite([light, dark]) {
    return sprite(64, (g, s) => {
      const grad = g.createLinearGradient(0, 0, s, s);
      grad.addColorStop(0, light); grad.addColorStop(1, dark);
      g.fillStyle = grad;
      g.beginPath();
      g.moveTo(s * 0.5, s * 0.02);
      g.quadraticCurveTo(s * 0.86, s * 0.42, s * 0.5, s * 0.98);
      g.quadraticCurveTo(s * 0.14, s * 0.42, s * 0.5, s * 0.02);
      g.fill();
      g.strokeStyle = 'rgba(60,110,60,.5)'; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(s * 0.5, s * 0.08); g.lineTo(s * 0.5, s * 0.92); g.stroke();
    });
  }
  function glowSprite(inner, mid) {
    return sprite(64, (g, s) => {
      const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      grad.addColorStop(0, inner); grad.addColorStop(0.22, mid); grad.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grad; g.fillRect(0, 0, s, s);
    });
  }

  function make(kind, anywhere) {
    const depth = rnd(0.35, 1);
    const p = { kind, depth, x: rnd(-40, w + 40), y: anywhere ? rnd(-40, h + 40) : -40, ph: rnd(0, 6.283), ph2: rnd(0, 6.283), a: rnd(0.55, 1) };
    if (kind === 'petal' || kind === 'leaf') {
      p.size = (kind === 'leaf' ? rnd(12, 22) : rnd(9, 20)) * depth * (w < 600 ? 0.9 : 1.1);
      p.vx = rnd(12, 40) * depth; p.vy = rnd(18, 46) * depth;
      p.rot = rnd(0, 6.283); p.spin = rnd(-1.2, 1.2); p.sway = rnd(10, 34); p.swaySpeed = rnd(0.5, 1.3);
      p.sprite = kind === 'leaf' ? sprites.leaves[(Math.random() * sprites.leaves.length) | 0] : sprites.petals[(Math.random() * sprites.petals.length) | 0];
    } else if (kind === 'mote') {
      p.size = rnd(3, 9) * depth; p.vx = rnd(-6, 10); p.vy = rnd(-10, -2); p.y = anywhere ? p.y : h + 20;
      p.speed = rnd(0.4, 1.1);
    } else { // firefly
      p.size = rnd(14, 30) * depth; p.y = rnd(h * 0.3, h + 20); p.speed = rnd(0.6, 1.5); p.roam = rnd(10, 26);
    }
    return p;
  }

  function populate() {
    const base = clamp(Math.round((w * h) / 27000), 16, 46);
    const counts = { petal: base, leaf: Math.max(3, Math.round(base * 0.14)), mote: Math.round(base * 0.55), firefly: Math.round(base * 0.95) };
    pools = {};
    Object.keys(counts).forEach((kind) => {
      pools[kind] = [];
      for (let i = 0; i < counts[kind]; i++) pools[kind].push(make(kind, true));
    });
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    populate();
  }

  function step(dt) {
    clock += dt;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // petals and leaves
    ['petal', 'leaf'].forEach((kind) => {
      const list = pools[kind], weight = weights[kind];
      const live = Math.ceil(list.length * Math.min(1, weight * 1.15));
      for (let i = 0; i < live; i++) {
        const p = list[i];
        p.ph += p.swaySpeed * dt; p.ph2 += dt * (1.4 + p.depth);
        p.x += (p.vx + Math.sin(p.ph) * p.sway) * dt;
        p.y += p.vy * dt;
        p.rot += p.spin * dt;
        if (p.y > h + 50 || p.x > w + 60) { Object.assign(p, make(kind, false)); if (Math.random() < 0.35) { p.x = -40; p.y = rnd(0, h * 0.6); } }
        if (p.y < -60) p.y = h + 40;
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, 0.35 + 0.65 * Math.abs(Math.cos(p.ph2)));
        ctx.globalAlpha = p.a * Math.min(1, weight) * (0.55 + 0.45 * p.depth);
        ctx.drawImage(p.sprite, -p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
    });

    // a burst of petals (envelope opening, the couple meeting)
    if (bursts.length) {
      bursts = bursts.filter((b) => {
        b.life += dt;
        if (b.life > b.ttl) return false;
        b.vy += 60 * dt; b.vx *= 1 - 0.9 * dt; b.vy *= 1 - 0.5 * dt;
        b.x += b.vx * dt; b.y += b.vy * dt; b.rot += b.spin * dt; b.ph += dt * 5;
        ctx.save();
        ctx.translate(b.x, b.y); ctx.rotate(b.rot); ctx.scale(1, 0.35 + 0.65 * Math.abs(Math.cos(b.ph)));
        ctx.globalAlpha = Math.min(1, (b.ttl - b.life) / 0.9);
        ctx.drawImage(b.sprite, -b.size / 2, -b.size / 2, b.size, b.size);
        ctx.restore();
        return true;
      });
    }

    // light: sun-motes and fireflies add to what is behind them
    ctx.globalCompositeOperation = 'lighter';
    const motes = pools.mote, mw = weights.mote;
    if (mw > 0.01) {
      for (let i = 0; i < motes.length; i++) {
        const p = motes[i];
        p.ph += p.speed * dt;
        p.x += (p.vx + Math.sin(p.ph) * 8) * dt; p.y += p.vy * dt;
        if (p.y < -20 || p.x < -30 || p.x > w + 30) Object.assign(p, make('mote', false));
        if (p.y > h + 40) p.y = -10;
        ctx.globalAlpha = mw * p.a * (0.3 + 0.5 * (0.5 + 0.5 * Math.sin(p.ph * 2.3 + p.ph2)));
        ctx.drawImage(sprites.mote, p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
      }
    }
    const flies = pools.firefly, fw = weights.firefly;
    if (fw > 0.01) {
      for (let i = 0; i < flies.length; i++) {
        const p = flies[i];
        p.ph += p.speed * dt; p.ph2 += p.speed * 0.63 * dt;
        p.x += (Math.cos(p.ph) + Math.sin(p.ph2 * 1.7)) * p.roam * dt;
        p.y += (Math.sin(p.ph * 0.8) + Math.cos(p.ph2 * 1.3)) * p.roam * 0.7 * dt - 3 * dt;
        if (p.x < -40) p.x = w + 30; if (p.x > w + 40) p.x = -30;
        if (p.y < h * 0.12) p.y = h + 20; if (p.y > h + 40) p.y = h * 0.3;
        const pulse = Math.pow(0.5 + 0.5 * Math.sin(p.ph * 1.9 + p.ph2), 2);
        ctx.globalAlpha = fw * (0.25 + 0.75 * pulse) * p.a;
        ctx.drawImage(sprites.firefly, p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - lastT) / 1000 || 0.016);
    lastT = now;
    step(dt);
    raf = requestAnimationFrame(frame);
  }
  function start() {
    if (running || !ctx || Invite.motion.reduced || document.hidden) return;
    running = true; lastT = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() { running = false; cancelAnimationFrame(raf); }

  /* ---------- public ---------- */
  function setTime(t) {
    const dusk = span(t, 2.3, 3.5);
    weights.petal = lerp(1, 0.42, dusk);
    weights.leaf = 1 - span(t, 1.6, 2.6);
    weights.mote = lerp(0.45, 1, span(t, 0.3, 1)) * (1 - span(t, 1.7, 2.4));
    weights.firefly = span(t, 2.1, 3.1);
  }
  /** The field lives in the world, not on the glass: scrolling moves it a little. */
  function nudge(dy) {
    if (!pools || !running) return;
    const d = clamp(dy, -160, 160);
    Object.keys(pools).forEach((kind) => pools[kind].forEach((p) => { p.y -= d * p.depth * 0.32; }));
  }
  function burst(x, y, count) {
    if (!running || !sprites) return;
    const n = Math.min(count || 26, 60);
    for (let i = 0; i < n; i++) {
      const a = rnd(0, 6.283), v = rnd(90, 420);
      bursts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 140, rot: rnd(0, 6.283), spin: rnd(-5, 5), ph: rnd(0, 6.283), size: rnd(10, 22), life: 0, ttl: rnd(1.6, 3), sprite: sprites.petals[(Math.random() * sprites.petals.length) | 0] });
    }
  }

  function init() {
    canvas = document.getElementById('particles');
    if (!canvas || !canvas.getContext) return;
    ctx = canvas.getContext('2d');
    if (!ctx) return;
    sprites = {
      petals: PETAL_TINTS.map(petalSprite),
      leaves: LEAF_TINTS.map(leafSprite),
      mote: glowSprite('rgba(255,250,224,.95)', 'rgba(255,238,180,.45)'),
      firefly: glowSprite('rgba(255,255,220,1)', 'rgba(250,236,130,.55)'),
    };
    resize();
    let timer = 0;
    window.addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(resize, 160); });
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    start();
  }

  Invite.particles = { init, setTime, nudge, burst, start, stop };
})();
