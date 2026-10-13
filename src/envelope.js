/* ============================================================================
   ENVELOPE — the interactive opening.
     · Tap / click / Enter / Space on the envelope breaks the seal, swings the
       flap and slides the letter out (and may start the music — it is a real gesture).
     · Guests who simply scroll are never blocked: scrolling opens it too.
     · "Replay" seals it again.
   One number (0 → 1) describes how open it is; CSS does the rest.
   ============================================================================ */
(function () {
  'use strict';
  const Invite = window.Invite;
  const { span, ease, setVar } = Invite;

  let el, button, opening, beginLink;
  let active = false;
  let tapped = 0;     // progress from the tap animation
  let scrolled = 0;   // progress from scrolling
  let shown = -1;
  let cancelTween = null;
  let state = 'sealed';

  function render() {
    const v = Math.max(tapped, scrolled);
    if (v === shown) return;
    shown = v;
    const flap = ease.inOut(span(v, 0.1, 0.56));
    setVar(el, '--seal', span(v, 0, 0.16));
    setVar(el, '--flap', flap);
    setVar(el, '--flap-z', flap > 0.5 ? '1' : '5');
    setVar(el, '--rise', ease.out(span(v, 0.44, 1)));
    setVar(opening, '--open', v);

    const next = v >= 0.995 ? 'open' : v <= 0.002 ? 'sealed' : 'opening';
    if (next !== state) {
      state = next;
      el.setAttribute('data-state', state);
      button.setAttribute('aria-expanded', state === 'open' ? 'true' : 'false');
      Invite.emit('envelope', state);
    }
  }

  function open() {
    if (!active || tapped >= 1) return;
    Invite.audio.startFromGesture(); // must run inside the tap handler
    if (cancelTween) cancelTween();
    const hadFocus = document.activeElement === button;
    if (Invite.motion.reduced) {
      tapped = 1; render();
      if (hadFocus && beginLink) beginLink.focus({ preventScroll: true });
      return;
    }
    const box = el.getBoundingClientRect();
    Invite.particles.burst(box.left + box.width / 2, box.top + box.height * 0.58, 30);
    cancelTween = Invite.tween({
      from: Math.max(tapped, scrolled), to: 1, duration: 2300,
      update: (v) => { tapped = v; render(); },
      done: () => {
        cancelTween = null;
        // the envelope button is gone now, so hand keyboard focus to the next step
        if (hadFocus && beginLink) beginLink.focus({ preventScroll: true });
      },
    });
  }

  function reset() {
    if (!active) return;
    if (cancelTween) { cancelTween(); cancelTween = null; }
    tapped = 0;
    render();
  }

  function init() {
    // the envelope is the alternative opening; it only runs when chosen (config: opening: 'envelope')
    if (Invite.openingMode !== 'envelope') return;
    el = document.getElementById('envelope');
    button = document.getElementById('envelope-button');
    opening = el && el.closest('.opening');
    beginLink = document.getElementById('begin-link');
    if (!el || !button || !opening) return;
    active = true;

    button.addEventListener('click', open);
    // scrolling through the first screen opens the envelope as well
    Invite.scroll.handlers.opening = (q) => { scrolled = span(q, 0.05, 0.62); render(); };
    render();
  }

  Invite.envelope = { init, open, reset, get state() { return state; } };
})();
