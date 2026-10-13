/* ============================================================================
   HELPERS — the little storybook characters who run the show.

   Three original garden-folk, each drawn here as an SVG RIG: two legs, two
   arms, a torso and a head are separate groups, so they genuinely run (legs
   and arms alternate), lean back to pull, flop down, jump, wave, point and
   climb. Nothing is a sliding picture. styles/helpers.css holds the motion.

     genda    saffron turban, curled moustache — the leader
     chameli  marigold crown and plaits
     mor      peacock-feather cap — the smallest and the fastest

   Usage
     const troupe = Invite.helpers.troupe(layerElement);
     const g = troupe.add('genda', { x: 20, facing: 'right' });
     troupe.play(async (s) => { await g.go(60, { s }); g.set('cheer'); });
   Positions are percentages of the layer's width (x) and height from the ground (y).
   ============================================================================ */
(function () {
  'use strict';
  const Invite = window.Invite;

  const LOOKS = {
    genda: { skin: '#e7b48c', hair: '#3a2a26', body: '#fff3dd', sleeve: '#f1dfbd', trim: '#c9962e', legs: '#c2452f', shoe: '#8a5a2b', hat: 'turban', hatMain: '#f28c28', hatDark: '#d96f14' },
    chameli: { skin: '#edc09c', hair: '#3a2a26', body: '#e8578a', sleeve: '#f58aa8', trim: '#f6d06a', legs: '#f6c445', shoe: '#b9772b', hat: 'crown', skirt: true },
    mor: { skin: '#dfa87e', hair: '#2e2220', body: '#f6b93b', sleeve: '#f9cf6a', trim: '#0f8b8d', legs: '#fff3dd', shoe: '#7a4a2b', hat: 'cap', hatMain: '#0f8b8d', hatDark: '#0a6b6e' },
  };

  /* ---------- things they carry (drawn in the same 100 × 142 space, in front of the hands) ---------- */
  const PROPS = {
    basket: '<path d="M65 80h26l-3.500 15h-19z" fill="#b9824a"/><path d="M66 85h24M67 90h22" stroke="#8a5a2b" stroke-width="1.4"/><path d="M68 80q10-17 20 0" fill="none" stroke="#8a5a2b" stroke-width="2.2"/>'
      + '<circle cx="71" cy="79" r="4.600" fill="#ff8f2e"/><circle cx="78" cy="77" r="5" fill="#f9c2d6"/><circle cx="85" cy="79" r="4.600" fill="#ffb238"/><circle cx="75" cy="81" r="3.600" fill="#fff5f8"/><circle cx="82" cy="81" r="3.600" fill="#ff8f2e"/>',
    flag: '<path d="M78 86V22" stroke="#8a5a2b" stroke-width="2.600" stroke-linecap="round"/><circle cx="78" cy="21" r="3" fill="#f6c445"/><g class="h-flag"><path d="M78 25l27 8-27 9z" fill="#f6c445" stroke="#c9962e" stroke-width="1.2" stroke-linejoin="round"/><circle cx="87" cy="33" r="2.400" fill="#c2452f"/></g>',
    garland: '<path d="M68 79q10 30 22 0" fill="none" stroke="#3f9a47" stroke-width="1.400"/>'
      + [[68, 79], [70, 86], [73, 92], [77, 96], [81, 96], [85, 92], [88, 86], [90, 79]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="3.700" fill="${i % 2 ? '#ffb238' : '#ff8f2e'}"/>`).join(''),
    scroll: '<rect x="62" y="72" width="34" height="12" rx="6" fill="#fff6e2" stroke="#c9962e" stroke-width="1.400"/><rect x="60" y="71" width="5" height="14" rx="2" fill="#c9962e"/><rect x="93" y="71" width="5" height="14" rx="2" fill="#c9962e"/><rect x="76" y="71" width="6" height="14" fill="#b3202f"/><path d="M79 84l-4 8M79 84l4 8" stroke="#b3202f" stroke-width="2" stroke-linecap="round"/>',
    marker: '<path d="M79 82V58" stroke="#8a5a2b" stroke-width="2.400" stroke-linecap="round"/><path d="M79 60C66 44 64 39 64 33a15 15 0 0 1 30 0c0 6-2 11-15 27z" fill="#a5354f" stroke="#fff8ec" stroke-width="2"/><circle cx="79" cy="33" r="5.600" fill="#fff8ec"/>',
    lantern: '<path d="M79 84V66" stroke="#8a5a2b" stroke-width="2.200" stroke-linecap="round"/><circle cx="79" cy="52" r="20" fill="#ffb65a" opacity=".28"/><path d="M70 44q9-8 18 0l-2 20q-7 4-14 0z" fill="#ffd98a" stroke="#f08a3c" stroke-width="1.400"/><ellipse cx="79" cy="55" rx="3.400" ry="5" fill="#fffbe6"/>',
    flower: '<path d="M79 86V70" stroke="#3f9a47" stroke-width="2.200" stroke-linecap="round"/>' + [0, 60, 120, 180, 240, 300].map((a) => `<ellipse cx="79" cy="56" rx="4.200" ry="7.500" fill="#f9a8c4" transform="rotate(${a} 79 63)"/>`).join('') + '<circle cx="79" cy="63" r="4.200" fill="#ffd76a"/>',
    petals: '<path d="M68 80q11 9 22 0l-2 6q-9 5-18 0z" fill="#b9824a"/><circle cx="73" cy="78" r="3" fill="#f9c2d6"/><circle cx="79" cy="76" r="3.400" fill="#ff8f2e"/><circle cx="85" cy="78" r="3" fill="#fff5f8"/>',
  };

  function hat(look) {
    if (look.hat === 'turban') {
      return `<path d="M26 31q-11 9-6 27 6-7 8-21z" fill="${look.hatDark}"/>`
        + `<path d="M24 37Q21 9 50 8q30 1 27 29-13-9-27-8-14-1-26 8z" fill="${look.hatMain}"/>`
        + `<path d="M29 30Q49 13 73 28M27 22Q48 7 71 18" fill="none" stroke="${look.hatDark}" stroke-width="1.800" stroke-linecap="round"/>`
        + '<path d="M64 14q9-16 15-4-9 0-10 9z" fill="#fff3c4"/><circle cx="66" cy="16" r="3" fill="#f6c445" stroke="#c9962e" stroke-width=".8"/>';
    }
    if (look.hat === 'crown') {
      return `<circle cx="29" cy="25" r="9.500" fill="${look.hair}"/>`
        + [[33, 23], [42, 17.500], [52, 15], [62, 17], [70, 22.500]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="5.800" fill="${i % 2 ? '#ff8f2e' : '#ffb238'}"/><circle cx="${x - 1.200}" cy="${y - 1.200}" r="2.200" fill="#ffe08a"/>`).join('')
        + '<circle cx="61" cy="34" r="1.700" fill="#c0264a"/>';
    }
    return `<path d="M30 15q-11-13-7-25" fill="none" stroke="#3f9a47" stroke-width="1.600" stroke-linecap="round"/><ellipse cx="22" cy="-13" rx="6.500" ry="9" fill="#1aa39a"/><ellipse cx="22" cy="-12" rx="3.600" ry="5.200" fill="#2b3c9a"/><ellipse cx="22" cy="-11.500" rx="1.700" ry="2.400" fill="#f6c445"/>`
      + `<path d="M25 35Q27 11 50 11q23 0 25 24-25-9-50 0z" fill="${look.hatMain}"/><path d="M25 35q25-9 50 0" fill="none" stroke="#f6c445" stroke-width="2.600" stroke-linecap="round"/>`;
  }

  function rig(kind) {
    const k = LOOKS[kind] || LOOKS.genda;
    const leg = (cls, x) => `<g class="h-leg ${cls}"><path d="M${x} 97V114" stroke="${k.legs}" stroke-width="9" stroke-linecap="round"/><path d="M${x - 5.500} 113.500h11q7 0 8-4.500 2 6-2.500 9.500h-16.500z" fill="${k.shoe}"/></g>`;
    const arm = (cls, x, sleeve) => `<g class="h-arm ${cls}"><path d="M${x} 76V96" stroke="${sleeve}" stroke-width="8" stroke-linecap="round"/><circle cx="${x}" cy="100" r="5" fill="${k.skin}"/></g>`;
    const body = k.skirt
      ? `<path d="M37 72Q50 62 63 72L77 106Q50 115 23 106Z" fill="${k.body}"/><path d="M25 101Q50 110 75 101" fill="none" stroke="${k.trim}" stroke-width="2.600"/><path d="M40 72L60 96" stroke="#fbe3a0" stroke-width="5" stroke-linecap="round" opacity=".9"/>`
      : `<path d="M35 72Q50 62 65 72L71 104Q50 111 29 104Z" fill="${k.body}"/><path d="M30 100Q50 107 70 100" fill="none" stroke="${k.trim}" stroke-width="2.400"/><path d="M50 68V86" stroke="${k.trim}" stroke-width="1.600"/><circle cx="50" cy="74" r="1.300" fill="${k.trim}"/><circle cx="50" cy="80" r="1.300" fill="${k.trim}"/>`;
    const extras = kind === 'genda'
      ? '<path d="M58.500 51.500q-5 3.500-9.500-1M61.500 51.500q5 3.500 9.500-1" fill="none" stroke="#3a2a22" stroke-width="2.200" stroke-linecap="round"/>'
      : kind === 'chameli'
        ? `<path d="M27 46q-7 15-2 30" fill="none" stroke="${k.hair}" stroke-width="5.500" stroke-linecap="round"/><circle cx="25" cy="77" r="3.400" fill="#f6c445"/><circle cx="29" cy="52" r="2.200" fill="#f6c445"/>`
        : '';
    return `<svg viewBox="0 -24 100 154" aria-hidden="true" focusable="false">
      <ellipse class="h-shadow" cx="50" cy="124" rx="24" ry="4.500"/>
      <g class="h-fig">
        ${leg('h-leg--b', 44)}${leg('h-leg--a', 56)}
        <g class="h-upper">
          ${arm('h-arm--b', 43, k.sleeve)}
          ${body}
          <g class="h-head">
            <circle cx="50" cy="42" r="25" fill="${k.skin}"/><circle cx="27.500" cy="45" r="4.400" fill="${k.skin}"/>
            <path d="M26 41Q25 16 50 16q24 0 25 22-13-12-29-8-12 2-20 11z" fill="${k.hair}"/>
            <circle cx="64" cy="52.500" r="5.600" fill="#f58aa0" opacity=".5"/><circle cx="41" cy="53" r="4.400" fill="#f58aa0" opacity=".3"/>
            <g class="h-eyes"><ellipse cx="53" cy="44" rx="2.900" ry="4"/><ellipse cx="67" cy="44" rx="2.900" ry="4"/><circle cx="54" cy="42.400" r="1" fill="#fff"/><circle cx="68" cy="42.400" r="1" fill="#fff"/></g>
            <g class="h-eyes-happy"><path d="M49.500 45.500q3.500-5.500 7 0M63.500 45.500q3.500-5.500 7 0"/></g>
            <path class="h-mouth" d="M55 56q5.500 5 11 0"/><path class="h-mouth-open" d="M54.500 55q6 10 12 0z"/>
            ${extras}${hat(k)}
          </g>
          <g class="h-prop"></g>
          ${arm('h-arm--a', 57, k.sleeve)}
        </g>
      </g>
    </svg>`;
  }

  /* ---------- an actor: one helper on a stage ---------- */
  function Actor(kind, opts) {
    const o = opts || {};
    const el = document.createElement('span');
    el.className = `helper helper--${kind}`;
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = `<span class="helper__flip">${rig(kind)}</span>`;
    this.el = el; this.kind = kind;
    this.x = 0; this.y = 0; this.state = ''; this.carrying = '';
    this.at(o.x === undefined ? 50 : o.x, o.y || 0);
    this.face(o.facing || 'right');
    this.set(o.state || 'idle');
    if (o.scale) el.style.setProperty('--s', o.scale);
    if (o.z !== undefined) el.style.setProperty('--z', o.z);
    if (o.prop) this.prop(o.prop);
    if (o.hidden) this.show(false);
  }
  Actor.prototype = {
    at(x, y) { this.x = x; if (y !== undefined) this.y = y; this.el.style.setProperty('--x', this.x.toFixed(3)); this.el.style.setProperty('--y', this.y.toFixed(3)); return this; },
    face(dir) { this.facing = dir; this.el.setAttribute('data-facing', dir); return this; },
    set(state) { if (state !== this.state) { this.state = state; this.el.setAttribute('data-state', state); } return this; },
    show(on) { this.el.style.visibility = on === false ? 'hidden' : ''; return this; },
    /** Hand something to the helper (or take it away with no argument). */
    prop(name) {
      this.carrying = name && PROPS[name] ? name : '';
      this.el.querySelector('.h-prop').innerHTML = this.carrying ? PROPS[this.carrying] : '';
      this.el.toggleAttribute('data-carrying', Boolean(this.carrying));
      return this;
    },
    /** Standing pose that suits what the helper is holding. */
    rest() { return this.set(this.carrying ? 'hold' : 'idle'); },
    /**
     * Travel to x (and optionally y). Legs run for as long as the journey lasts, the helper turns
     * to face the way it is going, and the returned promise resolves on arrival.
     */
    go(x, o) {
      const opt = o || {};
      const s = opt.s;
      const x0 = this.x, y0 = this.y, y1 = opt.y === undefined ? y0 : opt.y;
      const dx = x - x0;
      if (opt.face !== false && Math.abs(dx) > 0.01) this.face(dx > 0 ? 'right' : 'left');
      const duration = opt.duration || Math.max(260, (Math.hypot(dx, (y1 - y0) * 0.6) / (opt.speed || 30)) * 1000);
      this.set(opt.state || (this.carrying ? 'carry' : 'run'));
      const update = (u) => this.at(x0 + dx * u, y0 + (y1 - y0) * u);
      if (Invite.motion.reduced || !s) { update(1); if (opt.then !== false) this.rest(); return Promise.resolve(); }
      return s.tween({ duration, ease: opt.ease, update }).then(() => { if (opt.then !== false) this.rest(); });
    },
    /** Where the hands are, in pixels relative to `frame` — the rope is drawn through these points. */
    hands(frame) {
      const r = this.el.getBoundingClientRect(), f = frame.getBoundingClientRect();
      const forward = this.facing === 'right' ? 0.84 : 0.16;
      return [r.left - f.left + r.width * forward, r.top - f.top + r.height * 0.6];
    },
  };

  /* ---------- a director: runs a scripted scene that can be cancelled and replayed ---------- */
  const CANCELLED = { cancelled: true };
  function director() {
    let run = 0;
    return {
      /** fn receives `s` with s.wait(ms) and s.tween({duration, ease, update}); both stop if the scene is reset. */
      play(fn) {
        const mine = ++run;
        const alive = () => mine === run;
        const s = {
          alive,
          wait: (ms) => new Promise((res, rej) => setTimeout(() => (alive() ? res() : rej(CANCELLED)), Invite.motion.reduced ? 0 : ms)),
          tween: (o) => new Promise((res, rej) => {
            Invite.tween({
              duration: o.duration, ease: o.ease,
              update: (v) => { if (alive()) o.update(v); },
              done: () => (alive() ? res() : rej(CANCELLED)),
            });
          }),
        };
        return Promise.resolve().then(() => fn(s)).catch((err) => { if (err !== CANCELLED) console.error('[invitation] scene error', err); });
      },
      cancel() { run += 1; },
    };
  }

  function troupe(layer) {
    const dir = director();
    const cast = [];
    return {
      layer, cast,
      add(kind, opts) { const a = new Actor(kind, opts); cast.push(a); layer.appendChild(a.el); return a; },
      play: dir.play, cancel: dir.cancel,
      clear() { dir.cancel(); cast.splice(0).forEach((a) => a.el.remove()); },
      /** Convert an element's position on screen into this layer's x percentage. */
      xOf(el, frac) {
        const r = el.getBoundingClientRect(), f = layer.getBoundingClientRect();
        return ((r.left + r.width * (frac === undefined ? 0.5 : frac) - f.left) / Math.max(1, f.width)) * 100;
      },
    };
  }

  /** Run `enter` when an element comes into view and `leave` once it has fully gone. */
  function onView(el, enter, leave, threshold) {
    if (!('IntersectionObserver' in window)) { enter(); return; }
    let inside = false;
    new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= (threshold || 0.35) && !inside) { inside = true; enter(); }
        // "gone" includes merely touching the edge of the screen: browsers still call that intersecting,
        // and chapter links land exactly there
        else if ((!entry.isIntersecting || entry.intersectionRatio <= 0.001) && inside) { inside = false; if (leave) leave(); }
      });
    }, { threshold: [0, threshold || 0.35] }).observe(el);
  }

  Invite.helpers = { troupe, director, onView, rig, PROPS };
})();
