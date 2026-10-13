/* ============================================================================
   FINALE — the helpers come back to say goodbye.
     · one climbs the little ladder, rung by rung, and sets the last flower at
       the top of the floral frame
     · one lets a paper lantern go into the night sky, then waves
     · one runs in with a last handful of petals and throws them over the couple
   Plays when the chapter comes into view; resets when it has gone.
   Helpers here stand in the painting's own coordinates (x and y are % of it).
   ============================================================================ */
(function () {
  'use strict';
  const Invite = window.Invite;
  const GROUND = 3.5;
  const LADDER = 40.8;      // matches .ladder in story.css
  const TOP = 43;           // how high the climber's feet go

  let scene, layer, troupe;

  function reset() {
    if (!troupe) return;
    troupe.clear();
    layer.querySelectorAll('.released-lantern').forEach((l) => l.remove());
    scene.classList.remove('is-crowned');
  }

  function play() {
    reset();
    const climber = troupe.add('chameli', { x: 36.5, y: GROUND, prop: 'flower' });
    const lamplighter = troupe.add('genda', { x: 64, y: GROUND, prop: 'lantern', facing: 'left' });
    const runner = troupe.add('mor', { x: 36, y: GROUND - 1.5, prop: 'petals', hidden: true });

    troupe.play(async (s) => {
      // to the foot of the ladder, then up it, hand over hand
      await climber.go(LADDER - 0.3, { s, speed: 5 });
      climber.face('right');
      await climber.go(LADDER + 0.9, { s, y: TOP, duration: 2800, state: 'climb', face: false, then: false });
      climber.set('place');                               // reaching up with the flower…
      await s.wait(650);
      scene.classList.add('is-crowned');                  // …and the frame is finished
      climber.prop(null);
      const crown = scene.querySelector('.finale__crown').getBoundingClientRect();
      Invite.particles.burst(crown.left + crown.width / 2, crown.top + crown.height / 2, 34);
      Invite.sfx.play('sparkle');
      await s.wait(500);
      climber.face('left').set('wave');                   // a wave from the top of the ladder
    });

    // the other two have their own little errands, running alongside
    const side = Invite.helpers.director();
    side.play(async (s) => {
      await s.wait(600);
      await lamplighter.go(58.6, { s, speed: 5 });
      lamplighter.face('left').set('hold');
      await s.wait(900);
      const lantern = document.createElement('i');        // let the lantern go
      lantern.className = 'released-lantern';
      lantern.style.cssText = `--lx:${(lamplighter.x - 0.9).toFixed(2)}%;--ly:${(GROUND + 9).toFixed(2)}%`;
      layer.appendChild(lantern);
      lamplighter.prop(null).set('lookup');
      await s.wait(1500);
      lamplighter.face('left').set('wave');               // goodbye!

      runner.show(true);
      await runner.go(52, { s, speed: 6 });
      runner.prop(null).set('cheer');                     // a last handful of petals over the couple
      const r = runner.el.getBoundingClientRect();
      Invite.particles.burst(r.left + r.width / 2, r.top - r.height * 0.6, 40);
      if (Invite.shower) Invite.shower(scene, 18);
      await s.wait(2200);
      runner.set('wave');
    });
    troupe.side = side;
  }

  function init() {
    scene = document.getElementById('save-the-date');
    layer = scene && scene.querySelector('.troupe');
    if (!scene || !layer || !Invite.helpers) return;
    troupe = Invite.helpers.troupe(layer);
    const clear = troupe.clear;
    troupe.clear = () => { if (troupe.side) troupe.side.cancel(); clear(); };

    if (Invite.motion.reduced) {   // everyone in their final place, waving
      troupe.add('chameli', { x: LADDER + 0.9, y: TOP, facing: 'left' }).set('wave');
      troupe.add('genda', { x: 58.6, y: GROUND, facing: 'left' }).set('wave');
      troupe.add('mor', { x: 52, y: GROUND - 1.5 }).set('wave');
      return;
    }
    scene.classList.add('is-staged');
    Invite.helpers.onView(scene, play, reset, 0.3);
  }

  Invite.finale = { init, reset };
})();
