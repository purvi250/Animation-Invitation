/* ============================================================================
   TOGETHER — the pinned chapter where the two meet, played by the scroll bar.
   Progress through the chapter (0 → 1) becomes this sequence:

     0.00 – 0.40   groom from the left, bride from the right; two helpers run
                   between them with petals (their run cycle advances with the scroll)
     0.26 – 0.50   the floral mandap rises behind them
     0.36 – 0.52   they meet: a bloom of light, a flurry of petals
     0.42 – 0.86   the lamps around the mandap light, from the middle outward
     0.44 – 0.74   the ring of flowers turns into place and the portrait appears
     0.56 →        the helpers stop, turn to the couple and cheer
     0.70 – 0.94   the names, then the closing line

   The sky moves from sunset to evening over the same stretch (see data-time on the
   section). Scrolling back plays everything in reverse. With reduced motion the
   finished picture is simply shown (components.css / story.css).
   ============================================================================ */
(function () {
  'use strict';
  const Invite = window.Invite;
  const { span, ease, setVar, lerp } = Invite;

  const LAMP_ORDER = [3, 4, 2, 5, 1, 6, 0, 7];   // middle lamps first
  let stage, text, lamps = [], portrait;
  let left = null, right = null;                 // the two helpers
  let lastQ = 0, cheering = false, frontShown = false;

  function helpers(q) {
    if (!left) return;
    const settled = q >= 0.56;
    if (settled !== cheering) {
      cheering = settled;
      [left, right].forEach((h) => {
        h.el.classList.toggle('is-scrubbed', !settled);
        h.prop(settled ? null : 'petals').set(settled ? 'cheer' : 'carry');
      });
      left.face('right'); right.face('left');
    }
    if (settled) { left.at(13, 5); right.at(87, 5); return; }

    // out from the wings, across the middle and back, then away to the sides as the couple meet
    const lx = q < 0.22 ? lerp(-10, 60, span(q, 0.03, 0.22)) : q < 0.4 ? lerp(60, 38, span(q, 0.22, 0.4)) : lerp(38, 13, span(q, 0.4, 0.56));
    const rx = q < 0.26 ? lerp(110, 40, span(q, 0.06, 0.26)) : q < 0.4 ? lerp(40, 62, span(q, 0.26, 0.4)) : lerp(62, 87, span(q, 0.4, 0.56));
    left.face(q < 0.22 ? 'right' : 'left'); left.at(lx, 5);
    right.face(q < 0.26 ? 'left' : 'right'); right.at(rx, 5);
    // their legs keep time with the scrolling, not with the clock
    const frame = (q * 14).toFixed(3);
    left.el.style.setProperty('--scrub', frame);
    right.el.style.setProperty('--scrub', frame);
  }

  function play(q) {
    setVar(stage, '--a', ease.inOut(span(q, -0.08, 0.4)));
    setVar(stage, '--so', Math.min(span(q, -0.03, 0.09), 1 - span(q, 0.4, 0.53)));
    setVar(stage, '--m', ease.out(span(q, 0.26, 0.5)));
    setVar(stage, '--g', span(q, 0.33, 0.5) * (1 - 0.5 * span(q, 0.62, 0.92)));
    setVar(stage, '--r', ease.out(span(q, 0.44, 0.7)));
    setVar(stage, '--p', ease.out(span(q, 0.5, 0.74)));

    setVar(text, '--t0', 1 - span(q, 0.24, 0.36));
    setVar(text, '--t1', ease.out(span(q, 0.7, 0.8)));
    setVar(text, '--t2', ease.out(span(q, 0.76, 0.86)));
    setVar(text, '--t3', ease.out(span(q, 0.84, 0.94)));

    const lit = Math.round(span(q, 0.42, 0.86) * lamps.length);
    LAMP_ORDER.forEach((index, i) => { if (lamps[index]) lamps[index].classList.toggle('is-lit', i < lit); });

    helpers(q);

    // petals fly the moment they meet (only when scrolling forward through it)
    if (lastQ < 0.46 && q >= 0.46 && q < 0.6) {
      Invite.particles.burst(window.innerWidth / 2, window.innerHeight * 0.46, 44);
      Invite.sfx.play('sparkle');
    }
    // an optional "facing the visitor" portrait, if one has been supplied
    if (portrait && Invite.poses && Invite.poses.has('couple', 'front')) {
      const want = q > 0.9;
      if (want !== frontShown) {
        frontShown = want;
        const img = portrait.querySelector('img');
        portrait.__base = portrait.__base || img.getAttribute('src');
        img.src = want ? Invite.poses.frames('couple', 'front')[0] : portrait.__base;
      }
    }
    lastQ = q;
  }

  function init() {
    stage = document.getElementById('together-stage');
    text = document.querySelector('.together__text');
    if (!stage || !text) return;
    lamps = Array.prototype.slice.call(stage.querySelectorAll('.together__diyas .diya'));
    portrait = stage.querySelector('.together__portrait');
    const layer = stage.querySelector('.troupe');

    if (Invite.motion.reduced) {   // the finished picture: lamps lit, helpers cheering either side
      lamps.forEach((l) => l.classList.add('is-lit'));
      if (layer) {
        const troupe = Invite.helpers.troupe(layer);
        troupe.add('chameli', { x: 13, y: 5 }).set('cheer');
        troupe.add('mor', { x: 87, y: 5, facing: 'left' }).set('cheer');
      }
      return;
    }
    if (layer) {
      const troupe = Invite.helpers.troupe(layer);
      left = troupe.add('chameli', { x: -10, y: 5, prop: 'petals', state: 'carry' });
      right = troupe.add('mor', { x: 110, y: 5, prop: 'petals', state: 'carry', facing: 'left' });
      [left, right].forEach((h) => h.el.classList.add('is-scrubbed'));
    }
    Invite.scroll.handlers.together = play;
    play(0);
  }

  Invite.together = { init };
})();
