/* ============================================================================
   NAV — chapter dots, and the two ways back to the start:
   the replay button in the corner and "Revisit the invitation" at the end.
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

  /** Back to the first page, envelope sealed again, ready to be opened. */
  function replay() {
    const button = document.getElementById('envelope-button');
    Invite.envelope.reset();
    window.scrollTo({ top: 0, behavior: Invite.motion.reduced ? 'auto' : 'smooth' });
    const started = performance.now();
    const settle = () => {
      if (window.scrollY > 2 && performance.now() - started < 4000) { requestAnimationFrame(settle); return; }
      Invite.envelope.reset();
      if (button) button.focus({ preventScroll: true });
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
