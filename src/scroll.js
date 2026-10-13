/* ============================================================================
   SCROLL — the engine behind the storybook. It never takes over scrolling:
   the browser scrolls natively (wheel, touch, keyboard, trackpad) and this file
   only READS the position and turns it into
     · parallax between the painted layers of each chapter
     · a 0 → 1 progress value for pinned chapters (envelope, the couple's meeting)
     · the time of day for the sky
     · the progress line and the current chapter
     · "reveal on arrival" for text and characters
   A little easing is applied to the read position so wheel steps look fluid.
   ============================================================================ */
(function () {
  'use strict';
  const Invite = window.Invite;
  const { clamp01 } = Invite;

  const PARALLAX = 0.2;      // how far the far layers slide, as a share of the screen height
  const handlers = {};       // chapter id → fn(progress, scene)
  let scenes = [];
  let anchors = [];
  let vh = 1, docH = 1;
  let y = 0, lastY = 0;
  let raf = 0;
  let bar = null;
  let activeId = '';
  const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

  function measure() {
    vh = window.innerHeight;
    const scrollY = window.scrollY;
    scenes.forEach((s) => {
      const rect = s.el.getBoundingClientRect();
      s.top = rect.top + scrollY;
      s.height = rect.height;
      s.stageH = s.stage ? s.stage.offsetHeight : vh;
      s.pinned = s.pin && !Invite.motion.reduced && s.height > s.stageH + 2;
    });
    docH = Math.max(1, document.documentElement.scrollHeight - vh);
    // key moments for the sky: [scroll position, time of day]
    anchors = [];
    scenes.forEach((s) => {
      anchors.push([s.top, s.time]);
      if (s.pinned && s.timeEnd !== s.time) anchors.push([s.top + s.height - s.stageH, s.timeEnd]);
    });
    anchors.sort((a, b) => a[0] - b[0]);
  }

  function timeAt(pos) {
    if (!anchors.length) return 0;
    if (pos <= anchors[0][0]) return anchors[0][1];
    for (let i = 1; i < anchors.length; i++) {
      if (pos <= anchors[i][0]) {
        const a = anchors[i - 1], b = anchors[i];
        return a[1] + (b[1] - a[1]) * ((pos - a[0]) / Math.max(1, b[0] - a[0]));
      }
    }
    return anchors[anchors.length - 1][1];
  }

  function render() {
    const reduced = Invite.motion.reduced;
    if (bar) bar.style.transform = `scaleX(${clamp01(y / docH).toFixed(4)})`;

    const t = timeAt(y);
    Invite.sky.setTime(t);
    Invite.particles.setTime(t);
    Invite.particles.nudge(y - lastY);
    lastY = y;

    const mid = y + vh * 0.5;
    let current = scenes.length ? scenes[0] : null;

    scenes.forEach((s) => {
      if (mid >= s.top) current = s;
      const near = s.top - y < vh * 1.4 && s.top + s.height - y > -vh * 0.4;
      // chapters far from the screen are marked as resting, and their looping animations pause (see helpers.css)
      if (s.live !== near) { s.live = near; s.el.classList.toggle('is-live', near); }
      if (!near) return;
      const enter = clamp01((y + vh - s.top) / vh);                 // 0 → 1 while the chapter slides in
      const exit = clamp01((y + vh - (s.top + s.height)) / vh);     // 0 → 1 while it slides out
      const q = s.pinned ? clamp01((y - s.top) / Math.max(1, s.height - s.stageH)) : enter;
      if (!reduced) {
        const drift = (exit - (1 - enter)) * vh * PARALLAX;
        s.layers.forEach((l) => {
          const ty = (drift * l.depth).toFixed(1);
          const scale = s.pinned && l.zoom ? (1 + l.zoom * q).toFixed(4) : '1';
          const value = `translate3d(0, ${ty}px, 0) scale(${scale})`;
          if (l.last !== value) { l.last = value; l.el.style.transform = value; }
        });
        if (handlers[s.id]) handlers[s.id](q, s);
      }
    });

    if (current && current.id !== activeId) {
      activeId = current.id;
      document.body.setAttribute('data-chapter', activeId);
      Invite.emit('chapter', activeId);
    }
  }

  function tick() {
    raf = 0;
    const target = window.scrollY;
    const diff = target - y;
    if (Invite.motion.reduced || Math.abs(diff) < 0.5) y = target;
    else y += diff * (coarse ? 0.34 : 0.16);
    render();
    if (y !== target) raf = requestAnimationFrame(tick);
  }
  const request = () => { if (!raf) raf = requestAnimationFrame(tick); };

  function refresh() { measure(); request(); }

  /* ---------- reveal on arrival (and reset on leaving, so it plays again on the way back) ---------- */
  function setupReveals() {
    const items = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
    // "written by hand" text: the wipe goes on an inner span so the watched element itself is never clipped
    document.querySelectorAll('[data-reveal="write"]').forEach((el) => {
      if (el.querySelector('.ink')) return;
      const ink = document.createElement('span');
      ink.className = 'ink';
      while (el.firstChild) ink.appendChild(el.firstChild);
      el.appendChild(ink);
    });
    document.querySelectorAll('.scene').forEach((scene) => {
      scene.querySelectorAll('.scene__content [data-reveal]').forEach((el, i) => el.style.setProperty('--i', i));
    });
    if (Invite.motion.reduced || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.12) entry.target.classList.add('is-in');
        else if (!entry.isIntersecting) entry.target.classList.remove('is-in');
      });
    }, { threshold: [0, 0.12, 0.3] });
    items.forEach((el) => io.observe(el));
  }

  function init() {
    bar = document.getElementById('progress-bar');
    scenes = Array.prototype.map.call(document.querySelectorAll('.scene'), (el) => {
      const time = parseFloat(el.getAttribute('data-time')) || 0;
      const timeEnd = el.hasAttribute('data-time-end') ? parseFloat(el.getAttribute('data-time-end')) : time;
      return {
        el,
        id: el.id,
        key: el.getAttribute('data-scene'),
        pin: el.hasAttribute('data-pin'),
        stage: el.querySelector('.scene__stage'),
        time, timeEnd,
        layers: Array.prototype.map.call(el.querySelectorAll('[data-depth]'), (layer) => ({
          el: layer,
          depth: parseFloat(layer.getAttribute('data-depth')) || 0,
          zoom: parseFloat(layer.getAttribute('data-zoom')) || 0,
        })),
      };
    });

    setupReveals();
    measure();
    y = lastY = window.scrollY;

    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', refresh);
    window.addEventListener('orientationchange', refresh);
    window.addEventListener('load', refresh);
    if ('ResizeObserver' in window) new ResizeObserver(refresh).observe(document.body);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh).catch(() => {});
    render();
  }

  Invite.scroll = {
    init, refresh, handlers,
    get y() { return y; },
    get chapter() { return activeId; },
    scene: (id) => scenes.filter((s) => s.id === id)[0],
  };
})();
