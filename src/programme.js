/* ============================================================================
   PROGRAMME — Thursday's gathering, before the reception (config → programme).

   A pinned chapter, played by the scroll bar, so nobody can scroll past it
   without seeing it:

     while it rises into view (entry 0 → 1)
       0.28 – 0.72   the card unfolds from its centre
       0.40 – 0.96   its lines arrive, one after another
       0.58 – 0.99   a marigold toran drops into place above it
     while it is held on screen (progress 0 → 1) — the card is fully readable
       0.02 – 0.78   a helper walks the row with a lantern, lighting six lamps;
                     the evening warms, and the two items light up in turn
       0.80 →        all lit: a shower of petals, a bell, and the helper cheers

   Information first: the moment the chapter is reached (by scrolling, a chapter
   dot or one of the "see the programme" links) every line is already in place.
   Scrolling back plays it in reverse. If a screen is too short to hold the card
   it simply scrolls past like any other chapter, and with reduced motion or
   without scripting the card is open and the lamps are lit.
   ============================================================================ */
(function () {
  'use strict';
  const Invite = window.Invite;
  const { span, ease, setVar, lerp, clamp01 } = Invite;
  const GROUND = 16;        // the helper's feet, as a % of the strip of ground below the card
  const MIN_ZOOM = 0.74;    // below this the card would be too small to read — let the chapter scroll instead
  const canZoom = !!(window.CSS && CSS.supports && CSS.supports('zoom', '0.5'));

  let scene, stage, frame, card, layer, lamps = [], items = [];
  let helper = null, lastB = 0, cheering = false, statusTimer = 0;

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

  /* ---------- does the card fit between the header and the lamps? ---------- */
  function fit() {
    if (!frame) return;
    const vh = window.innerHeight;
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 64;
    frame.style.zoom = '';
    frame.style.removeProperty('--z');
    scene.classList.remove('is-loose');
    const room = vh - header - 22 - vh * 0.15;           // the strip of ground for the lamps is 15% of the screen
    let zoom = Math.min(1, room / Math.max(1, frame.offsetHeight));
    // the buttons grow as the card shrinks (--z), so they stay a comfortable size for a finger: settle on a zoom that allows for it
    for (let i = 0; i < 3 && zoom < 1 && zoom >= MIN_ZOOM; i++) {
      frame.style.setProperty('--z', zoom.toFixed(3));
      zoom = Math.min(1, room / Math.max(1, frame.offsetHeight));
    }
    if (zoom < 1 && (!canZoom || zoom < MIN_ZOOM)) { scene.classList.add('is-loose'); frame.style.removeProperty('--z'); }
    else if (zoom < 1) { frame.style.setProperty('--z', zoom.toFixed(3)); frame.style.zoom = zoom.toFixed(3); }
    Invite.scroll.refresh();
  }

  /* ---------- the scroll plays the chapter ---------- */
  function play(q, s) {
    const vh = window.innerHeight;
    const raw = (Invite.scroll.y + vh - s.top) / vh;      // 1 = the chapter has reached the top of the screen
    const enter = clamp01(raw);
    setVar(scene, '--u', ease.out(span(enter, 0.28, 0.72)));
    setVar(scene, '--l', span(enter, 0.4, 0.96));
    setVar(scene, '--t', ease.outBack(span(enter, 0.58, 0.99)));

    // once it is held, the lamplighting (a chapter that only scrolls by gets it on the way past)
    const b = s.pinned ? q : span(raw, 1, 1.6);
    const x = lerp(-8, 91, span(b, 0.02, 0.78));
    let lit = 0;
    lamps.forEach((lamp) => {
      const on = x >= lamp.__x - 1.5;
      lamp.classList.toggle('is-lit', on);
      if (on) lit += 1;
    });
    setVar(scene, '--glow', lit / Math.max(1, lamps.length));
    items.forEach((item, i) => item.classList.toggle('is-lit', lit >= Math.ceil(((i + 1) * lamps.length) / items.length)));

    if (helper) {
      const done = b >= 0.8;
      if (done !== cheering) {
        cheering = done;
        helper.el.classList.toggle('is-scrubbed', !done);
        helper.set(done ? 'cheer' : 'carry');
      }
      const facing = done ? 'left' : 'right';
      if (helper.facing !== facing) helper.face(facing);
      helper.at(x, GROUND);
      if (!done) helper.el.style.setProperty('--scrub', (b * 16).toFixed(3));
    }

    // every lamp lit: petals, a bell, and the card glows (only when scrolling forward into it)
    if (lastB < 0.8 && b >= 0.8 && b < 0.95) {
      const r = card.getBoundingClientRect();
      Invite.particles.burst(r.left + r.width / 2, Math.max(70, r.top + r.height * 0.3), 46);
      if (Invite.shower) Invite.shower(stage, 22);
      Invite.sfx.play('bell');
      scene.classList.remove('is-glowing'); void scene.offsetWidth; scene.classList.add('is-glowing');
    }
    if (b < 0.6) scene.classList.remove('is-glowing');
    lastB = b;
  }

  function reset() {
    lastB = 0;
    if (scene) scene.classList.remove('is-glowing');
  }

  function init() {
    scene = document.getElementById('programme');
    stage = document.getElementById('programme-stage');
    frame = document.getElementById('programme-frame');
    card = document.getElementById('programme-card');
    layer = scene && scene.querySelector('.troupe');
    if (!scene || !stage || !frame || !card) return;
    lamps = Array.prototype.slice.call(scene.querySelectorAll('.programme-lamps .diya'));
    lamps.forEach((l) => { l.__x = parseFloat(l.style.getPropertyValue('--dx')) || 0; });
    items = Array.prototype.slice.call(scene.querySelectorAll('.programme-card__item'));
    setupButtons();
    const troupe = layer && Invite.helpers ? Invite.helpers.troupe(layer) : null;

    if (Invite.motion.reduced) {                         // everything simply in place
      lamps.concat(items).forEach((l) => l.classList.add('is-lit'));
      if (troupe) troupe.add('chameli', { x: 90, y: GROUND, prop: 'lantern', facing: 'left' }).set('hold');
      return;
    }
    if (troupe) {
      helper = troupe.add('chameli', { x: -8, y: GROUND, prop: 'lantern', state: 'carry' });
      helper.el.classList.add('is-scrubbed');
    }
    scene.classList.add('is-staged');
    Invite.scroll.handlers.programme = play;

    let pending = 0;
    const refit = () => { cancelAnimationFrame(pending); pending = requestAnimationFrame(fit); };
    window.addEventListener('resize', refit);
    window.addEventListener('orientationchange', refit);
    window.addEventListener('load', refit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refit).catch(() => {});
    fit();
    const s = Invite.scroll.scene('programme');
    if (s) play(0, s);
  }

  Invite.programme = { init, reset, fit };
})();
