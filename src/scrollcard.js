/* ============================================================================
   SCROLLCARD — the invitation as a physical thing. A helper runs in with the
   rolled invitation and tosses it up onto its wooden stand. The visitor taps
   it: the ribbon lets go, the paper unrolls, a gold border draws itself round
   the card and the details arrive line by line.

   Nothing important can stay hidden: if nobody taps, the helper's patience runs
   out after a few seconds and the scroll opens by itself; with reduced motion
   or without scripting the card is simply open. The text is in the page the
   whole time, so screen readers never have to wait for the animation.
   ============================================================================ */
(function () {
  'use strict';
  const Invite = window.Invite;
  const { ease, setVar, lerp } = Invite;
  const GROUND = 20;          // feet, as a % of the helper's strip of ground (see .scene--invitation > .troupe)
  const PATIENCE = 4200;      // ms the helper waits for a tap before opening it himself

  let root, scene, button, troupe, layer;
  let helper = null;
  let delivered = false, opened = false, timer = 0;
  const director = Invite.helpers ? Invite.helpers.director() : null;

  function stage() {
    setVar(root, '--u', 0); setVar(root, '--b', 0);
    root.classList.remove('has-scroll');
    root.setAttribute('data-state', 'rolled');
  }

  function unroll() {
    if (opened) return;
    opened = true;
    clearTimeout(timer);
    root.classList.add('has-scroll');
    root.setAttribute('data-state', 'opening');          // the ribbon loosens and falls away
    Invite.sfx.play('paper');
    Invite.emit('invitation', 'opening');
    director.play(async (s) => {
      await s.wait(520);
      await s.tween({ duration: 1500, ease: ease.inOut, update: (u) => setVar(root, '--u', u) });   // the paper comes down
      root.setAttribute('data-state', 'open');           // …and the words begin to appear
      Invite.emit('invitation', 'open');
      const r = root.getBoundingClientRect();
      Invite.particles.burst(r.left + r.width / 2, Math.max(60, r.top + 60), 26);
      if (helper && helper.el.isConnected) helper.set('cheer');
      await s.tween({ duration: 1900, ease: ease.inOut, update: (u) => setVar(root, '--b', u) });   // the gold border draws itself
      if (helper && helper.el.isConnected) helper.set('idle');
    });
  }

  /** The helper brings the rolled invitation and puts it on the stand. */
  function deliver() {
    if (delivered || opened) return;
    delivered = true;
    helper = troupe.add('mor', { x: -9, y: GROUND, prop: 'scroll' });
    const me = helper;
    troupe.play(async (s) => {
      const stand = troupe.xOf(root, 0.5);
      await me.go(Math.max(9, stand - 30), { s, speed: 36 });
      // up it goes, onto the stand
      const a = me.hands(scene);
      const r = root.getBoundingClientRect(), sc = scene.getBoundingClientRect();
      const b = [r.left + r.width / 2 - sc.left, r.top - sc.top + 36];
      const fly = document.createElement('span');
      fly.className = 'flying-scroll';
      scene.appendChild(fly);
      me.prop(null).set('place');
      await s.tween({
        duration: 760, ease: ease.out,
        update: (u) => { fly.style.transform = `translate3d(${lerp(a[0], b[0], u).toFixed(1)}px, ${(lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * 60).toFixed(1)}px, 0) rotate(${(u * 360).toFixed(0)}deg)`; },
      });
      fly.remove();
      root.classList.add('has-scroll');
      Invite.sfx.play('pop');
      me.face('right').set('point');
      timer = setTimeout(unroll, PATIENCE);
    });
  }

  function reset() {
    if (!root || Invite.motion.reduced) return;
    clearTimeout(timer);
    director.cancel(); troupe.clear();
    scene.querySelectorAll('.flying-scroll').forEach((f) => f.remove());
    helper = null; delivered = false; opened = false;
    stage();
  }

  function init() {
    root = document.getElementById('scrollcard');
    button = document.getElementById('scroll-open');
    scene = document.getElementById('invitation');
    layer = scene && scene.querySelector('.troupe');
    if (!root || !button || !layer || !director) return;
    if (Invite.motion.reduced) return;                    // the card is simply open
    troupe = Invite.helpers.troupe(layer);
    button.addEventListener('click', unroll);
    stage();
    Invite.helpers.onView(root, deliver, null, 0.18);
  }

  Invite.scrollcard = { init, reset, unroll, get opened() { return opened; } };
})();
