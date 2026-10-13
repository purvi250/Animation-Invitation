/* ============================================================================
   HERO — the garden gate. Three little helpers find the rope, take hold of it,
   and (when the visitor says "Begin Our Story") haul the banner up to reveal
   the date, tumble over, celebrate, and send one of their number running ahead.

   It is a scripted performance, not a video: every helper is a live rig, the
   rope is drawn each frame through their hands, and the banner's height is the
   same number that moves them. It never blocks the page — a visitor who simply
   scrolls sets it off as well, and with reduced motion the date is just shown.
   ============================================================================ */
(function () {
  'use strict';
  const Invite = window.Invite;
  const { ease, setVar, lerp } = Invite;

  const GROUND = 2.6;               // where feet stand, as a % of the gate's height from its foot
  // The rope comes down the inside of the left pillar and turns through a low pulley, so it runs
  // diagonally to the helpers BELOW the date panel and never crosses the words.
  const ROPE_TOP = [0.198, 0.25];   // where it disappears up behind the lintel (fractions of the gate's box)
  const PULLEY = [0.198, 0.715];    // the pulley on the pillar
  const READY = [38, 49.5, 61];     // where the three stand to pull (x %, nearest the pulley first)
  const HAUL = 23;                  // how far they back away while pulling
  const POT = 78.5;                 // the flower pot one of them hides behind

  let root, gate, paths, troupe, A, B, C;
  let grabbers = [];
  let slack = 1;
  let state = 'idle';
  let ready = false;                // the helpers exist and the scene can be played
  let lastQ = 0;

  const setState = (s) => { state = s; root.setAttribute('data-state', s); Invite.emit('hero', s); };
  const lift = (v) => setVar(root, '--lift', v);
  const layer = (actor, z) => actor.el.style.setProperty('--z', z);

  /* ---------- the rope: from the pulley, through every pair of hands, to a tail on the ground ---------- */
  function drawRope() {
    const w = gate.clientWidth, h = gate.clientHeight;
    if (!w) return;
    const f = (v) => v.toFixed(1);
    const P = [w * PULLEY[0], h * PULLEY[1]];
    const gy = h * (1 - GROUND / 100) - 2;
    let d = `M${f(w * ROPE_TOP[0])},${f(h * ROPE_TOP[1])}L${f(P[0])},${f(P[1])}`;
    if (!grabbers.length) {
      // let go: it hangs from the pulley with its end coiled at the foot of the pillar
      d += `C${f(P[0] + w * 0.012)},${f(P[1] + (gy - P[1]) * 0.5)} ${f(P[0] - w * 0.01)},${f(gy - h * 0.04)} ${f(P[0] + w * 0.03)},${f(gy)}`;
      d += `q${f(w * 0.03)},${f(h * 0.012)} ${f(w * 0.07)},0`;
    } else {
      const pts = grabbers.map((a) => a.hands(gate));
      const first = pts[0];
      const sag = slack * Math.hypot(first[0] - P[0], first[1] - P[1]) * 0.3;
      d += `Q${f((P[0] + first[0]) / 2)},${f((P[1] + first[1]) / 2 + sag)} ${f(first[0])},${f(first[1])}`;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i];
        d += `Q${f((a[0] + b[0]) / 2)},${f((a[1] + b[1]) / 2 + slack * h * 0.03)} ${f(b[0])},${f(b[1])}`;
      }
      const last = pts[pts.length - 1];
      d += `q${f(w * 0.03)},${f((gy - last[1]) * 0.9)} ${f(w * 0.08)},${f(gy - last[1])}q${f(w * 0.03)},${f(h * 0.01)} ${f(w * 0.06)},0`;
    }
    paths.forEach((p) => p.setAttribute('d', d));
  }

  const burst = (fx, fy, n) => {
    const r = gate.getBoundingClientRect();
    Invite.particles.burst(r.left + r.width * fx, r.top + r.height * fy, n);
  };

  /** Four heaves rather than one smooth glide: each tug starts fast and runs out of breath. */
  const heave = (t) => {
    const n = 4, k = Math.min(n - 1, Math.floor(t * n)), f = t * n - k;
    return (k + 1 - Math.pow(1 - f, 2.6)) / n;
  };

  /* ---------- tableau: everyone in place with the rope in their hands ---------- */
  function stageReady() {
    [A, B, C].forEach((h, i) => { h.show(true).at(READY[i], GROUND).face('left').set('grab'); layer(h, 10); });
    grabbers = [A, B, C]; slack = 0.35;
    lift(0); drawRope();
    root.classList.add('is-awake');
    root.classList.remove('is-ringing');
    setState('ready');
  }

  /* ---------- act one: the garden wakes and the helpers find the rope ---------- */
  function intro() {
    return troupe.play(async (s) => {
      setState('intro');
      lift(0); grabbers = []; slack = 1; drawRope();
      A.at(10, GROUND).face('right').set('idle').show(false); layer(A, 3);     // behind the left pillar
      B.at(90, GROUND).face('left').set('idle').show(false); layer(B, 3);      // behind the right pillar
      C.at(POT, GROUND - 13).face('left').set('idle').show(true); layer(C, 8); // crouched behind the pot
      await s.wait(700);
      root.classList.add('is-awake');                                          // lamps light one by one, the rangoli draws itself

      // someone peeks out from behind the flower pot, looks one way, then the other
      await s.tween({ duration: 520, ease: ease.out, update: (u) => C.at(POT, GROUND - 13 + 9 * u) });
      await s.wait(420); C.face('right');
      await s.wait(380); C.face('left');
      await s.wait(260);

      // two more step out from behind the pillars
      A.show(true); B.show(true);
      await Promise.all([A.go(30, { s, speed: 24 }), B.go(67, { s, speed: 24 })]);
      layer(A, 10); layer(B, 10);
      A.set('lookup');                                                         // "look at that banner!"
      await s.wait(900);
      B.face('left').set('point');                                             // "the rope — there!"
      await s.wait(950);
      A.face('right').set('idle');
      await s.wait(300);                                                       // they look at each other…
      A.set('hop'); B.set('hop'); C.set('hop');
      await s.wait(840);                                                       // …and can hardly wait

      // the first takes the rope in both hands, leans back and plants his feet
      await A.go(READY[0], { s, speed: 30 });
      A.face('left').set('grab'); grabbers = [A]; slack = 0.5; drawRope();
      await s.wait(260);

      // the others run in behind him and take hold too (one hops out over the pot)
      layer(C, 10); C.set('hop');
      const hop = s.tween({ duration: 620, update: (u) => C.at(lerp(POT, READY[2] + 7, u), GROUND - 4 + 4 * u + Math.sin(Math.PI * u) * 15) });
      await Promise.all([B.go(READY[1], { s, speed: 30 }), hop.then(() => C.go(READY[2], { s, speed: 30 }))]);
      B.face('left').set('grab'); C.face('left').set('grab');
      grabbers = [A, B, C]; slack = 0.35; drawRope();
      setState('ready');
    });
  }

  /* ---------- act two: the pull ---------- */
  function pull() {
    return troupe.play(async (s) => {
      stageReady();                       // also covers a visitor who taps before the helpers are quite ready
      setState('pulling');
      root.classList.add('is-ringing');
      Invite.sfx.play('bell');
      [A, B, C].forEach((h) => h.set('pull'));
      slack = 0;

      const marks = [0.3, 0.62, 0.9];
      let fired = 0;
      await s.tween({
        duration: 3000, ease: heave,
        update: (u) => {
          lift(u);                                                            // the banner rises…
          A.at(READY[0] + HAUL * u); B.at(READY[1] + HAUL * u); C.at(READY[2] + HAUL * u); // …exactly as far as they back away
          paths[2].style.strokeDashoffset = (-u * gate.clientWidth * 0.6).toFixed(1);       // the rope's twist travels along it
          drawRope();
          if (fired < marks.length && u >= marks[fired]) { fired += 1; burst(0.5, 0.42, 16); Invite.sfx.play('whoosh'); }
        },
      });

      // the banner reaches the top: the rope stops dead and all three sit down with a bump
      setState('revealed');
      root.classList.remove('is-ringing');
      burst(0.5, 0.45, 46);
      Invite.sfx.play('sparkle');
      for (const h of [C, B, A]) { h.set('sit'); await s.wait(90); }
      await s.tween({ duration: 500, update: (u) => { slack = u; drawRope(); } });
      await s.wait(950);

      // up they get, to cheer on either side of the date
      grabbers = []; drawRope();
      await Promise.all([A.go(12, { s, speed: 46 }), B.go(88, { s, speed: 40 }), C.go(72, { s, speed: 40 })]);
      A.face('right').set('cheer'); B.face('left').set('cheer'); C.face('left').set('cheer');
      await s.wait(1900);

      // one of them runs on ahead, waving for the visitor to follow
      C.face('right').set('wave'); A.set('wave'); B.set('idle');
      await s.wait(1100);
      await C.go(118, { s, speed: 52 });
      C.show(false);
      A.set('idle');
      setState('done');
    });
  }

  /** Start the reveal. `gesture` is true when it comes from a tap, click or key press (so music may begin). */
  function begin(gesture) {
    if (!ready || state === 'pulling' || state === 'revealed' || state === 'done') return;
    if (gesture) Invite.audio.startFromGesture();
    pull();
  }

  /** Put the banner back down with the helpers ready to pull again. */
  function reset() {
    if (!ready) return;
    troupe.cancel();
    // Treat the page as "already scrolled past": the scroll trigger must not fire while the visitor is
    // being carried back up to the top — only when they next scroll forward from there.
    lastQ = Infinity;
    if (Invite.motion.reduced) return;
    stageReady();
  }

  function init() {
    root = document.getElementById('hero');
    gate = document.getElementById('gate');
    if (!root || !gate || Invite.openingMode !== 'rope') return;
    paths = Array.prototype.slice.call(document.querySelectorAll('#rope path'));
    troupe = Invite.helpers.troupe(gate);
    A = troupe.add('genda', { x: 12, y: GROUND });
    B = troupe.add('chameli', { x: 88, y: GROUND, facing: 'left' });
    C = troupe.add('mor', { x: 72, y: GROUND, facing: 'left' });
    ready = true;

    if (Invite.motion.reduced) {
      // no performance: the date is simply there, with the helpers celebrating beside it
      A.set('cheer'); B.set('cheer'); C.set('wave');
      [A, B, C].forEach((h) => layer(h, 10));
      root.classList.add('is-awake');
      drawRope();
      setState('done');
      return;
    }

    document.getElementById('hero-begin').addEventListener('click', () => begin(true));
    gate.addEventListener('click', (e) => { if (e.target.closest('.helper')) begin(true); });
    // a visitor who simply scrolls on sets the helpers off too (no sound: scrolling is not a tap)
    Invite.scroll.handlers.opening = (q) => {
      if (lastQ <= 0.14 && q > 0.14) begin(false);
      lastQ = q;
    };
    window.addEventListener('resize', drawRope);
    intro();
  }

  Invite.hero = { init, begin, reset, get state() { return state; } };
})();
