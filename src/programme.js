/* ============================================================================
   PROGRAMME — Thursday's gathering, before the reception (config → programme).

   When the chapter comes into view the card unfolds and its lines arrive one
   by one; then a helper walks along the foot of the screen with a lantern,
   lighting a row of lamps. The card's own buttons give directions to the
   programme venue, copy its address, and download its calendar entries.

   Information first: the card opens as soon as the chapter is reached — the
   helper's lamp-lighting only follows it. With reduced motion or without
   scripting the card is simply open and the lamps are lit.
   ============================================================================ */
(function () {
  'use strict';
  const Invite = window.Invite;
  const GROUND = 20;      // feet, as a % of the helper's strip of ground (see .scene--programme > .troupe)
  const STEPS = ['show-card', 'show-lines'];

  let scene, layer, troupe, lamps = [];
  let statusTimer = 0;

  function setupButtons() {
    const cfg = Invite.config, derived = Invite.derived;
    const directions = document.getElementById('programme-directions');
    if (directions && derived.programmeMaps) directions.href = derived.programmeMaps;

    const copy = document.getElementById('programme-copy');
    const status = document.getElementById('programme-status');
    const address = document.getElementById('programme-address');
    if (copy && status && Invite.venue && Invite.venue.copyText) {
      const label = copy.querySelector('.btn__text');
      const idle = label ? label.textContent : '';
      copy.addEventListener('click', () => {
        Invite.venue.copyText(derived.programmeAddressOneLine).then((ok) => {
          clearTimeout(statusTimer);
          if (ok) {
            status.textContent = 'Programme address copied — paste it anywhere.';
            copy.classList.add('is-done');
            if (label) label.textContent = 'Copied';
          } else {
            if (address && window.getSelection) {
              const range = document.createRange();
              range.selectNodeContents(address);
              const sel = window.getSelection();
              sel.removeAllRanges(); sel.addRange(range);
            }
            status.textContent = 'The address is selected — press Ctrl + C (or long-press) to copy.';
          }
          statusTimer = setTimeout(() => {
            status.textContent = '';
            copy.classList.remove('is-done');
            if (label) label.textContent = idle;
          }, 3200);
        });
      });
    }

    const calendar = document.getElementById('programme-calendar');
    if (calendar) {
      calendar.setAttribute('download', Invite.calendar.programmeFilename(derived));
      try {
        const ics = Invite.calendar.buildProgrammeICS(cfg, derived);
        if (ics && window.Blob && window.URL && URL.createObjectURL) {
          calendar.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
          calendar.setAttribute('data-generated', 'true');
        }
      } catch (err) {
        console.warn('Programme calendar file could not be generated; using the bundled one.', err);
      }
    }
  }

  function reset() {
    if (!troupe) return;
    troupe.clear();
    STEPS.forEach((c) => scene.classList.remove(c));
    lamps.forEach((l) => l.classList.remove('is-lit'));
  }

  function play() {
    reset();
    troupe.play(async (s) => {
      scene.classList.add('show-card');                  // the card unfolds…
      await s.wait(650);
      scene.classList.add('show-lines');                 // …and its lines arrive one by one
      Invite.sfx.play('paper');
      await s.wait(1400);

      // a helper walks the row with a lantern, lighting each lamp in turn
      const helper = troupe.add('chameli', { x: -9, y: GROUND, prop: 'lantern' });
      const order = lamps.slice().sort((a, b) => parseFloat(a.style.getPropertyValue('--dx')) - parseFloat(b.style.getPropertyValue('--dx')));
      for (const lamp of order) {
        const x = parseFloat(lamp.style.getPropertyValue('--dx'));
        await helper.go(x - 3.2, { s, speed: 26 });
        helper.face('right').set('point');
        await s.wait(240);
        lamp.classList.add('is-lit');
        await s.wait(180);
      }
      Invite.sfx.play('sparkle');
      await helper.go(Math.min(94, parseFloat(order[order.length - 1].style.getPropertyValue('--dx')) + 5), { s, speed: 26 });
      helper.face('left').set('cheer');
      await s.wait(1800);
      helper.set('hold');
    });
  }

  function init() {
    scene = document.getElementById('programme');
    layer = scene && scene.querySelector('.troupe');
    if (!scene || !layer) return;
    lamps = Array.prototype.slice.call(layer.querySelectorAll('.diya'));
    setupButtons();
    if (!Invite.helpers) return;
    troupe = Invite.helpers.troupe(layer);

    if (Invite.motion.reduced) {                         // everything simply in place
      lamps.forEach((l) => l.classList.add('is-lit'));
      troupe.add('chameli', { x: 6, y: GROUND, prop: 'lantern' }).set('hold');
      return;
    }
    scene.classList.add('is-staged');
    Invite.helpers.onView(scene, play, reset, 0.2);
  }

  Invite.programme = { init, reset };
})();
