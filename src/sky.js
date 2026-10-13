/* ============================================================================
   SKY — one continuous sky behind every chapter. "Time" runs from 0 (afternoon)
   through 1 (golden hour), 2 (dusk), 3 (blue hour) to 4 (night); scroll.js
   feeds it in and this file moves the sun, raises the moon, lights the stars
   and re-tints the clouds.
   ============================================================================ */
(function () {
  'use strict';
  const Invite = window.Invite;
  const { clamp01, lerp, span } = Invite;

  // [time, x %, y %, scale] — the sun sinks toward the horizon and swells as it goes.
  // Two paths, so it stays clear of the words and the characters on wide and on tall screens.
  const SUN_WIDE = [[0, 78, 15, 1], [1, 86, 45, 1.2], [2, 72, 57, 1.5], [2.7, 70, 74, 1.6]];
  const SUN_TALL = [[0, 80, 13, 1], [1, 86, 25, 1.15], [2, 76, 56, 1.5], [2.7, 72, 74, 1.6]];
  const MOON_WIDE = [[2.4, 84, 42, 0.9], [3, 84, 24, 1], [4, 83, 13.5, 1]];
  // on tall screens the words fill the top of the later chapters, so the moon climbs out of the frame
  const MOON_TALL = [[2.4, 82, 40, 0.85], [3, 80, 20, 0.9], [3.45, 80, 7, 0.8], [3.75, 80, -12, 0.8]];
  const THEME = ['#3a8bdb', '#5c8dd2', '#37398a', '#0f174c', '#050826'];

  // one formation of clouds, drifting at different heights and speeds
  const CLOUDS = [
    { shape: 1, top: 7, w: 1.0, dur: 230, delay: -24, rest: 4 },
    { shape: 3, top: 14, w: 1.15, dur: 260, delay: -128, rest: 46 },
    { shape: 2, top: 25, w: 0.72, dur: 300, delay: -166, rest: 60 },
    { shape: 4, top: 37, w: 0.58, dur: 340, delay: -276, rest: 80, o: 0.9 },
    { shape: 2, top: 43, w: 0.5, dur: 320, delay: -66, rest: 16, o: 0.85 },
    { shape: 4, top: 3, w: 0.55, dur: 280, delay: -214, rest: 72 },
  ];

  let els = null;
  let last = {};

  const track = (points, t) => {
    if (t <= points[0][0]) return points[0];
    for (let i = 1; i < points.length; i++) {
      if (t <= points[i][0]) {
        const a = points[i - 1], b = points[i];
        const u = (t - a[0]) / (b[0] - a[0]);
        return [t, lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3], b[3], u)];
      }
    }
    return points[points.length - 1];
  };

  const set = (key, el, prop, value) => {
    if (last[key] === value) return;
    last[key] = value;
    el.style[prop] = value;
  };

  const hexMix = (a, b, u) => {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const ch = (shift) => Math.round(lerp((pa >> shift) & 255, (pb >> shift) & 255, u));
    return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
  };

  function buildClouds(field) {
    ['day', 'sunset', 'night'].forEach((tint) => {
      const group = document.createElement('div');
      group.className = `cloudset cloudset--${tint}`;
      CLOUDS.forEach((c) => {
        const img = new Image();
        img.className = 'cloud';
        img.alt = '';
        img.decoding = 'async';
        img.style.cssText = `--top:${c.top}%;--w:${c.w};--dur:${c.dur}s;--delay:${c.delay}s;--rest:${c.rest};--o:${c.o || 1}`;
        img.addEventListener('error', () => { img.hidden = true; }, { once: true });
        img.src = `assets/scenery/cloud-${c.shape}-${tint}.webp`;
        group.appendChild(img);
      });
      field.appendChild(group);
    });
  }

  function drawStars(canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth, h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    let seed = 20261128;
    const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const count = Math.round(clamp01((w * h) / 1600000) * 190 + 70);
    for (let i = 0; i < count; i++) {
      const x = rand() * w, y = Math.pow(rand(), 1.5) * h * 0.78, r = 0.4 + Math.pow(rand(), 3) * 1.5;
      const a = 0.35 + rand() * 0.65;
      if (r > 1.25) {
        const g = ctx.createRadialGradient(x, y, 0, x, y, r * 5);
        g.addColorStop(0, `rgba(255,248,226,${a * 0.5})`);
        g.addColorStop(1, 'rgba(255,248,226,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - r * 5, y - r * 5, r * 10, r * 10);
      }
      ctx.fillStyle = rand() < 0.2 ? `rgba(206,214,255,${a})` : `rgba(255,250,236,${a})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
    }
  }

  function setTime(t) {
    if (!els) return;
    const vw = window.innerWidth, vh = window.innerHeight;

    const layers = [clamp01(t), clamp01(t - 1), clamp01(t - 2), clamp01(t - 3)];
    els.sky.forEach((el, i) => set(`sky${i}`, el, 'opacity', layers[i].toFixed(3)));

    const wide = vw > vh * 1.1;
    const s = track(wide ? SUN_WIDE : SUN_TALL, t);
    set('sunT', els.sun, 'transform', `translate3d(${(s[1] * vw / 100).toFixed(1)}px, ${(s[2] * vh / 100).toFixed(1)}px, 0) scale(${s[3].toFixed(3)})`);
    set('sunO', els.sun, 'opacity', (1 - span(t, 2.05, 2.6)).toFixed(3));
    set('sunW', els.sunWarm, 'opacity', clamp01(t / 0.9).toFixed(3));
    set('sunR', els.sunRays, 'opacity', (1 - span(t, 0.9, 1.9)).toFixed(3));

    const m = track(wide ? MOON_WIDE : MOON_TALL, t);
    set('moonT', els.moon, 'transform', `translate3d(${(m[1] * vw / 100).toFixed(1)}px, ${(m[2] * vh / 100).toFixed(1)}px, 0) scale(${m[3].toFixed(3)})`);
    set('moonO', els.moon, 'opacity', span(t, 2.45, 3.05).toFixed(3));

    set('stars', els.stars, 'opacity', span(t, 2.5, 3.6).toFixed(3));

    const sunset = span(t, 0.4, 1.1), night = span(t, 2.3, 3.0);
    set('cDay', els.cloudDay, 'visibility', sunset >= 1 ? 'hidden' : 'visible');
    set('cSun', els.cloudSunset, 'opacity', sunset.toFixed(3));
    set('cSunV', els.cloudSunset, 'visibility', night >= 1 || sunset <= 0 ? 'hidden' : 'visible');
    set('cNight', els.cloudNight, 'opacity', night.toFixed(3));
    set('cNightV', els.cloudNight, 'visibility', night <= 0 ? 'hidden' : 'visible');
    set('cField', els.field, 'opacity', lerp(1, 0.6, span(t, 2.6, 3.6)).toFixed(3));

    if (els.theme) {
      const i = Math.min(3, Math.floor(clamp01(t / 4) * 4));
      const colour = hexMix(THEME[i], THEME[i + 1], clamp01(t - i));
      if (last.theme !== colour) { last.theme = colour; els.theme.setAttribute('content', colour); }
    }
    Invite.sky.time = t;
  }

  function init() {
    const backdrop = document.getElementById('backdrop');
    if (!backdrop) return;
    const field = document.getElementById('cloudfield');
    buildClouds(field);
    els = {
      sky: ['golden', 'dusk', 'blue', 'night'].map((n) => backdrop.querySelector(`.sky--${n}`)),
      sun: document.getElementById('sun'),
      sunWarm: backdrop.querySelector('.sun__disc--warm'),
      sunRays: backdrop.querySelector('.sun__rays'),
      moon: document.getElementById('moon'),
      stars: document.getElementById('stars'),
      field,
      cloudDay: field.querySelector('.cloudset--day'),
      cloudSunset: field.querySelector('.cloudset--sunset'),
      cloudNight: field.querySelector('.cloudset--night'),
      theme: document.querySelector('meta[name="theme-color"]'),
    };
    drawStars(els.stars);
    let resizeTimer = 0;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { drawStars(els.stars); last = {}; setTime(Invite.sky.time || 0); }, 180);
    });
    setTime(0);
  }

  Invite.sky = { init, setTime, time: 0 };
})();
