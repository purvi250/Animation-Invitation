/* ============================================================================
   TOGETHER — the pinned chapter where the two meet. Scroll progress (0 → 1)
   is turned into a little sequence:
     0.00 – 0.40   groom and bride walk in from either side
     0.36 – 0.52   they meet; a bloom of light, a flurry of petals
     0.44 – 0.74   the floral ring turns into place and the portrait appears
     0.68 – 0.93   the closing lines arrive one by one
   Scrolling back plays it in reverse. With reduced motion the finished
   picture is simply shown (see components.css).
   ============================================================================ */
(function () {
  'use strict';
  const Invite = window.Invite;
  const { span, ease, setVar } = Invite;

  let stage, text;
  let lastQ = 0;

  function play(q) {
    setVar(stage, '--a', ease.inOut(span(q, -0.08, 0.4)));
    setVar(stage, '--so', Math.min(span(q, -0.03, 0.09), 1 - span(q, 0.4, 0.53)));
    setVar(stage, '--g', span(q, 0.33, 0.5) * (1 - 0.5 * span(q, 0.62, 0.92)));
    setVar(stage, '--r', ease.out(span(q, 0.44, 0.7)));
    setVar(stage, '--p', ease.out(span(q, 0.5, 0.74)));

    setVar(text, '--t0', 1 - span(q, 0.26, 0.38));
    setVar(text, '--t1', ease.out(span(q, 0.68, 0.78)));
    setVar(text, '--t2', ease.out(span(q, 0.75, 0.85)));
    setVar(text, '--t3', ease.out(span(q, 0.83, 0.93)));

    // petals fly the moment they meet (only when scrolling forward through it)
    if (lastQ < 0.46 && q >= 0.46 && q < 0.6) {
      Invite.particles.burst(window.innerWidth / 2, window.innerHeight * 0.46, 40);
    }
    lastQ = q;
  }

  function init() {
    stage = document.getElementById('together-stage');
    text = document.querySelector('.together__text');
    if (!stage || !text) return;
    if (Invite.motion.reduced) return; // CSS shows the finished picture
    Invite.scroll.handlers.together = play;
    play(0);
  }

  Invite.together = { init };
})();
