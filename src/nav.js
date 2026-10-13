/* ============================================================================
   NAV — chapter dots, and the two ways back to the start:
   the replay button in the corner and "Replay invitation" at the end.
   Chapter links are ordinary anchors, so they work with keyboard, screen
   readers, and even without this file.
   ============================================================================ */
(function () {
  'use strict';
  const Invite = window.Invite;

  function setupChapters() {
    const links = Array.prototype.slice.call(document.querySelectorAll('.chapters a[data-chapter]'));
    const mark = (id) => {
      links.forEach((a) => {
        if (a.getAttribute('data-chapter') === id) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    };
    Invite.on('chapter', mark);
    mark(Invite.scroll.chapter || 'opening');
  }

  /** Everything back to how it was at the very beginning. */
  function resetStory() {
    ['hero', 'envelope', 'entrances', 'scrollcard', 'finale'].forEach((name) => {
      try { if (Invite[name] && Invite[name].reset) Invite[name].reset(); } catch (err) { console.error(err); }
    });
  }

  /** Back to the first page — banner down (or envelope sealed), helpers waiting — ready to begin again. */
  function replay() {
    const first = document.getElementById(Invite.openingMode === 'envelope' ? 'envelope-button' : 'hero-begin');
    resetStory();
    window.scrollTo({ top: 0, behavior: Invite.motion.reduced ? 'auto' : 'smooth' });
    const started = performance.now();
    const settle = () => {
      if (window.scrollY > 2 && performance.now() - started < 4000) { requestAnimationFrame(settle); return; }
      resetStory();
      // (a beat later: the button is fading back in, and a still-hidden element cannot take focus)
      setTimeout(() => { if (first && first.offsetParent !== null) first.focus({ preventScroll: true }); }, 160);
    };
    requestAnimationFrame(settle);
  }

  function init() {
    setupChapters();
    ['replay', 'revisit'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', replay);
    });
  }

  Invite.nav = { init, replay };
})();
