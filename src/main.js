/* ============================================================================
   MAIN — starts each component in order. Every start is isolated, so if one
   piece fails (an old browser, a blocked feature) the rest of the invitation
   still works and every detail stays readable.
   ============================================================================ */
(function () {
  'use strict';
  const Invite = window.Invite;

  const steps = [
    ['content', () => Invite.bindContent(document)],
    ['assets', () => Invite.assets.init()],
    ['sky', () => Invite.sky.init()],
    ['particles', () => Invite.particles.init()],
    ['audio', () => Invite.audio.init()],
    ['scroll', () => Invite.scroll.init()],
    ['hero', () => Invite.hero.init()],
    ['envelope', () => Invite.envelope.init()],
    ['entrances', () => Invite.entrances.init()],
    ['together', () => Invite.together.init()],
    ['scrollcard', () => Invite.scrollcard.init()],
    ['venue', () => Invite.venue.init()],
    ['finale', () => Invite.finale.init()],
    ['nav', () => Invite.nav.init()],
  ];

  function boot() {
    steps.forEach(([name, run]) => {
      try { run(); } catch (err) { console.error(`[invitation] ${name} failed to start`, err); }
    });
    Invite.scroll.refresh();
    document.documentElement.classList.add('is-ready');

    // If the visitor changes their motion preference while the page is open, start afresh in the right mode.
    if (window.matchMedia) {
      const query = window.matchMedia('(prefers-reduced-motion: reduce)');
      const onChange = () => {
        if (new URLSearchParams(location.search).has('motion')) return;
        if (query.matches !== Invite.motion.reduced) location.reload();
      };
      if (query.addEventListener) query.addEventListener('change', onChange);
      else if (query.addListener) query.addListener(onChange);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
