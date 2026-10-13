/* ============================================================================
   CORE — the shared namespace and a few small helpers used by every component.
   Plain scripts (no modules, no build step) so the page also works when
   index.html is simply double-clicked.
   ============================================================================ */
(function () {
  'use strict';

  const Invite = (window.Invite = window.Invite || {});
  const root = typeof document !== 'undefined' ? document.documentElement : null;

  Invite.config = window.INVITE_CONFIG || {};

  /* ---------- maths ---------- */
  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
  const clamp01 = (v) => clamp(v, 0, 1);
  Invite.clamp = clamp;
  Invite.clamp01 = clamp01;
  Invite.lerp = (a, b, t) => a + (b - a) * t;
  /** How far `v` has travelled from `a` to `b`, as 0 → 1. */
  Invite.span = (v, a, b) => clamp01((v - a) / (b - a));
  Invite.ease = {
    inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    out: (t) => 1 - Math.pow(1 - t, 3),
    outBack: (t) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2),
  };

  /** Read "a.b.0.c" out of an object. */
  Invite.get = (obj, path) => String(path).split('.').reduce((o, key) => (o == null ? undefined : o[key]), obj);

  /* ---------- motion preference ---------- */
  Invite.motion = { reduced: !!root && root.classList.contains('reduce-motion') };

  /* ---------- tiny event bus ---------- */
  const listeners = {};
  Invite.on = (name, fn) => { (listeners[name] = listeners[name] || []).push(fn); };
  Invite.emit = (name, data) => { (listeners[name] || []).forEach((fn) => { try { fn(data); } catch (err) { console.error(err); } }); };

  /* ---------- a minimal tween ---------- */
  Invite.tween = ({ from = 0, to = 1, duration = 600, ease = (t) => t, update, done }) => {
    let raf = 0;
    let cancelled = false;
    const start = performance.now();
    const step = (now) => {
      if (cancelled) return;
      const t = clamp01((now - start) / duration);
      update(from + (to - from) * ease(t));
      if (t < 1) raf = requestAnimationFrame(step);
      else if (done) done();
    };
    raf = requestAnimationFrame(step);
    return () => { cancelled = true; cancelAnimationFrame(raf); };
  };

  /** Write a CSS custom property only when it actually changed (keeps style recalculation cheap). */
  Invite.setVar = (el, name, value, digits = 4) => {
    const v = typeof value === 'number' ? String(+value.toFixed(digits)) : value;
    const cache = el.__vars || (el.__vars = {});
    if (cache[name] === v) return;
    cache[name] = v;
    el.style.setProperty(name, v);
  };
  Invite.clearVars = (el) => {
    if (!el.__vars) return;
    Object.keys(el.__vars).forEach((name) => el.style.removeProperty(name));
    el.__vars = {};
  };
})();
