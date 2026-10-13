/* ============================================================================
   ASSETS — points the pictures at the files named in invitation.config.js and
   makes sure a missing file never shows as a broken image:
     · a missing character becomes a monogram medallion
     · a missing scenery plate becomes a soft CSS landscape
     · a missing decoration quietly disappears
   Also installs optional full-scene paintings (config → art.backdrops).
   ============================================================================ */
(function () {
  'use strict';
  const Invite = window.Invite;

  const whenBroken = (img, fn) => {
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) { fn(); return; }
    img.addEventListener('error', fn, { once: true });
  };

  function init() {
    const cfg = Invite.config;
    const initials = Invite.derived.initials;

    // 1 · character art paths from the config
    document.querySelectorAll('img[data-art-src]').forEach((img) => {
      const path = Invite.get(cfg, img.getAttribute('data-art-src'));
      if (path && img.getAttribute('src') !== path) img.setAttribute('src', path);
    });

    // 2 · characters → monogram medallion
    document.querySelectorAll('[data-fallback-initial]').forEach((holder) => {
      const img = holder.querySelector('img');
      if (!img) return;
      holder.setAttribute('data-initial', initials[holder.getAttribute('data-fallback-initial')] || '');
      whenBroken(img, () => {
        holder.classList.add('is-missing');
        holder.setAttribute('role', 'img');
        holder.setAttribute('aria-label', img.getAttribute('alt') || '');
        Invite.emit('asset-missing', img.getAttribute('src'));
      });
    });

    // 3 · scenery plates → CSS landscape
    document.querySelectorAll('.scene__art').forEach((art) => {
      art.querySelectorAll('img.layer').forEach((img) => {
        whenBroken(img, () => {
          img.hidden = true;
          art.classList.add('is-missing');
          Invite.emit('asset-missing', img.getAttribute('src'));
        });
      });
    });

    // 4 · decorations (branches, florals, extra figures) → simply hidden
    document.querySelectorAll('img').forEach((img) => {
      if (img.classList.contains('layer') || img.closest('[data-fallback-initial]')) return;
      whenBroken(img, () => { img.hidden = true; Invite.emit('asset-missing', img.getAttribute('src')); });
    });

    // 5 · optional guest-supplied paintings
    const backdrops = (cfg.art && cfg.art.backdrops) || {};
    Object.keys(backdrops).forEach((key) => {
      const src = backdrops[key];
      const scene = document.querySelector(`.scene[data-scene="${key}"]`);
      if (!src || !scene) return;
      const img = new Image();
      img.className = 'scene__backdrop';
      img.alt = '';
      img.decoding = 'async';
      img.setAttribute('aria-hidden', 'true');
      img.addEventListener('load', () => scene.classList.add('has-backdrop'), { once: true });
      img.addEventListener('error', () => { img.remove(); Invite.emit('asset-missing', src); }, { once: true });
      img.src = src;
      const host = scene.querySelector('.scene__stage') || scene;
      host.insertBefore(img, host.firstChild);
    });
  }

  Invite.assets = { init };
})();
