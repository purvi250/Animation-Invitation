/* ============================================================================
   ENTRANCES — the bride's chapter and the groom's chapter.

   Bride   a helper runs in with a basket and scatters petals along the path; the
           curtain of flowers parts; Kenvi steps through the marble arch, offers
           her bouquet, and her name plaque unfolds. Tapping the bouquet makes it
           bloom and sends petals across the screen.
   Groom   a helper races through the courtyard with a golden flag; Puru steps out
           from behind a pillar with a second helper trotting beside him holding a
           garland, which he is given; his plaque unfolds and petals fall. Tapping
           him brings a greeting.

   The bride and groom are each ONE illustration. They cannot move their own arms
   or legs, so "walking" here is a careful rise-and-fall of the whole figure and a
   greeting is a small bow — never a distorted face or a cut-up body. If extra
   pose pictures are supplied (config → art.poses) they are used automatically.

   Each chapter plays when it comes into view and resets once it has gone, so it
   plays again on the way back.
   ============================================================================ */
(function () {
  'use strict';
  const Invite = window.Invite;
  const { ease, lerp, setVar } = Invite;
  const GROUND = 5;   // where helpers' feet stand, as a % of the painting's height

  /* ---------- optional extra poses ---------- */
  const poses = {
    ready: {},
    init() {
      const all = (Invite.config.art && Invite.config.art.poses) || {};
      Object.keys(all).forEach((who) => Object.keys(all[who] || {}).forEach((name) => {
        const value = all[who][name];
        const list = Array.isArray(value) ? value : value ? [value] : [];
        list.forEach((src, i) => {
          const img = new Image();
          img.onload = () => { const key = `${who}.${name}`; (this.ready[key] = this.ready[key] || [])[i] = src; };
          img.onerror = () => Invite.emit('asset-missing', src);
          img.src = src;
        });
      }));
    },
    frames(who, name) { return (this.ready[`${who}.${name}`] || []).filter(Boolean); },
    has(who, name) { return this.frames(who, name).length > 0; },
    /** Show a pose picture for a moment. Returns false when there is none (the caller then bows instead). */
    show(figure, who, name, ms) {
      const frames = this.frames(who, name);
      const img = figure.querySelector('img');
      if (!frames.length || !img) return false;
      const base = figure.__base || img.getAttribute('src');
      figure.__base = base;
      img.src = frames[0];
      clearTimeout(figure.__poseTimer);
      figure.__poseTimer = setTimeout(() => { img.src = base; }, ms);
      return true;
    },
    /** Walk: cycle real frames if they exist, otherwise the gentle whole-figure step. */
    walk(figure, who, on) {
      const frames = this.frames(who, 'walk');
      const img = figure.querySelector('img');
      clearInterval(figure.__walkTimer);
      if (on && frames.length >= 2 && img) {
        figure.__base = figure.__base || img.getAttribute('src');
        let i = 0;
        figure.__walkTimer = setInterval(() => { img.src = frames[i++ % frames.length]; }, 125);
        figure.classList.remove('is-walking');
        return;
      }
      if (!on && figure.__base && img) img.src = figure.__base;
      figure.classList.toggle('is-walking', Boolean(on));
    },
  };

  /* ---------- petals falling from above ---------- */
  const PETAL_COLOURS = ['#ffb238', '#ff8f2e', '#f9c2d6', '#fff5f8', '#f08aa8', '#ffd76a'];
  function shower(scene, count) {
    if (Invite.motion.reduced) return;
    let box = scene.querySelector('.petalfall');
    if (!box) { box = document.createElement('div'); box.className = 'petalfall'; box.setAttribute('aria-hidden', 'true'); scene.appendChild(box); }
    for (let i = 0; i < count; i++) {
      const p = document.createElement('i');
      p.style.cssText = `--px:${(Math.random() * 100).toFixed(1)}%;--ps:${(8 + Math.random() * 9).toFixed(0)}px;--pd:${(3.2 + Math.random() * 2.6).toFixed(2)}s;--pw:${(Math.random() * 1.4).toFixed(2)}s;--pdx:${(Math.random() * 160 - 60).toFixed(0)}px;--pc:${PETAL_COLOURS[i % PETAL_COLOURS.length]}`;
      p.addEventListener('animationend', () => p.remove(), { once: true });
      box.appendChild(p);
    }
  }

  const restart = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };

  /* ============================== THE BRIDE ============================== */
  function bride() {
    const scene = document.getElementById('bride');
    if (!scene) return null;
    const layer = scene.querySelector('.troupe');
    const figure = scene.querySelector('.figure--bride');
    const bouquet = document.getElementById('bride-bouquet');
    const troupe = Invite.helpers.troupe(layer);
    const STEPS = ['show-kicker', 'curtain-open', 'has-entered', 'show-bouquet', 'show-plaque', 'show-caption'];
    let helper = null;

    function bloom() {
      restart(bouquet, 'is-bloomed');
      const r = bouquet.getBoundingClientRect();
      Invite.particles.burst(r.left + r.width / 2, r.top + r.height * 0.4, 40);
      shower(scene, 22);
      Invite.sfx.play('sparkle');
      poses.show(figure, 'bride', 'offer', 2200);
      const h = helper;   // (kept locally: the chapter may reset before the timer fires)
      if (h && h.el.isConnected) { h.set('cheer'); setTimeout(() => h.el.isConnected && h.set('idle'), 1700); }
      Invite.emit('bride-bloom');
    }
    bouquet.addEventListener('click', bloom);

    if (Invite.motion.reduced) {
      figure.classList.add('has-arrived');
      troupe.add('chameli', { x: 12, y: GROUND, prop: 'basket' }).set('hold');
      return { reset() {} };
    }

    function reset() {
      troupe.clear(); helper = null;
      layer.querySelectorAll('.trail-petal').forEach((p) => p.remove());
      STEPS.forEach((c) => scene.classList.remove(c));
      figure.classList.remove('has-arrived');
      bouquet.classList.remove('is-bloomed');
      poses.walk(figure, 'bride', false);
    }

    function play() {
      reset();
      helper = troupe.add('chameli', { x: -9, y: GROUND, prop: 'basket' });
      const me = helper;
      troupe.play(async (s) => {
        scene.classList.add('show-kicker');
        const spot = troupe.xOf(figure, 0.6);            // where the bride will stand (the middle of her figure)
        const aside = Math.max(7, spot - 27);

        // run in along the path, scattering petals from the basket
        let running = true;
        (async () => {
          let i = 0;
          while (running && s.alive()) {
            const p = document.createElement('i');
            p.className = 'trail-petal';
            p.style.cssText = `--px:${(me.x + Math.random() * 3 - 4).toFixed(2)}%;--py:${(GROUND - 1.5 + Math.random() * 3).toFixed(2)}%;--pr:${(Math.random() * 180).toFixed(0)}deg;--pc:${PETAL_COLOURS[i++ % PETAL_COLOURS.length]}`;
            layer.appendChild(p);
            await s.wait(110);
          }
        })().catch(() => {});
        await me.go(spot - 3, { s, speed: 25 });
        running = false;

        // step aside, turn, and give the cue
        await me.go(aside, { s, speed: 32 });
        me.prop(null).face('right').set('point');
        await s.wait(380);
        scene.classList.add('curtain-open');             // the curtain of flowers parts
        Invite.sfx.play('whoosh');
        await s.wait(700);
        scene.classList.add('has-entered');              // she steps through the arch
        poses.walk(figure, 'bride', true);
        await s.wait(2300);
        poses.walk(figure, 'bride', false);
        figure.classList.add('has-arrived');
        me.set('cheer');
        scene.classList.add('show-bouquet');             // and holds out her flowers
        await s.wait(650);
        scene.classList.add('show-plaque');              // her name unfolds beside her
        Invite.sfx.play('paper');
        await s.wait(800);
        scene.classList.add('show-caption');
        await s.wait(900);
        me.set('idle');
      });
    }

    scene.classList.add('is-staged');
    Invite.helpers.onView(scene, play, reset, 0.42);
    return { reset, play };
  }

  /* ============================== THE GROOM ============================== */
  const NS = 'http://www.w3.org/2000/svg';
  /** A marigold garland as SVG: a U of blooms. `fit(u)` maps 0…1 along the U to a point. */
  function garlandInto(svg, fit, count, size) {
    let d = '';
    const pts = [];
    for (let i = 0; i <= count; i++) pts.push(fit(i / count));
    pts.forEach(([x, y], i) => { d += `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`; });
    const cord = document.createElementNS(NS, 'path');
    cord.setAttribute('d', d); cord.setAttribute('fill', 'none'); cord.setAttribute('stroke', '#3f8a4a'); cord.setAttribute('stroke-width', size * 0.3);
    svg.appendChild(cord);
    pts.forEach(([x, y], i) => {
      const white = i % 4 === 3;
      [[size, white ? '#fff5e6' : i % 2 ? '#ff8f2e' : '#ffb238'], [size * 0.5, white ? '#fffdf6' : '#ffd76a']].forEach(([r, fill], k) => {
        const c = document.createElementNS(NS, 'circle');
        c.setAttribute('cx', (x - k * size * 0.18).toFixed(1)); c.setAttribute('cy', (y - k * size * 0.18).toFixed(1)); c.setAttribute('r', r); c.setAttribute('fill', fill);
        svg.appendChild(c);
      });
    });
  }

  function groom() {
    const scene = document.getElementById('groom');
    if (!scene) return null;
    const layer = scene.querySelector('.troupe');
    const cast = scene.querySelector('.scene__cast');
    const figure = scene.querySelector('.figure--groom');
    const tap = document.getElementById('groom-tap');
    const worn = document.getElementById('groom-garland');
    const troupe = Invite.helpers.troupe(layer);
    const STEPS = ['show-kicker', 'has-garland', 'show-plaque', 'show-caption'];
    let flagBearer = null, garlandBearer = null;

    // the garland as it hangs once he is wearing it (drawn in the picture's own 534 × 1852 space)
    garlandInto(worn, (u) => {
      const a = Math.PI * u;
      return [300 - Math.cos(a) * 70 * (1 - 0.22 * Math.sin(a)), 400 + Math.pow(Math.sin(a), 0.85) * 420];
    }, 26, 17);

    function greet() {
      // a real wave if a waving picture has been supplied; otherwise a warm little bow of welcome
      if (!poses.show(figure, 'groom', 'wave', 2000)) restart(figure, 'is-greeting');
      shower(scene, 16);
      Invite.sfx.play('pop');
      [flagBearer, garlandBearer].forEach((h) => {
        if (h && h.el.isConnected && s_idle(h)) { h.set('wave'); setTimeout(() => h.el.isConnected && h.rest(), 1700); }
      });
      Invite.emit('groom-greet');
    }
    const s_idle = (h) => h.state === 'idle' || h.state === 'hold' || h.state === 'cheer' || h.state === 'wave';
    tap.addEventListener('click', greet);

    if (Invite.motion.reduced) {
      figure.classList.add('has-arrived');
      troupe.add('genda', { x: 88, y: GROUND, prop: 'flag', facing: 'left' }).set('hold');
      return { reset() {} };
    }

    function reset() {
      troupe.clear(); flagBearer = null; garlandBearer = null;
      layer.querySelectorAll('.flying-garland').forEach((g) => g.remove());
      STEPS.forEach((c) => scene.classList.remove(c));
      figure.classList.remove('has-arrived', 'is-greeting');
      poses.walk(figure, 'groom', false);
      setVar(figure, '--walk', 0);
    }

    function play() {
      reset();
      flagBearer = troupe.add('genda', { x: -9, y: GROUND, prop: 'flag' });
      garlandBearer = troupe.add('mor', { x: -9, y: GROUND, prop: 'garland', hidden: true });
      const flag = flagBearer, mor = garlandBearer;
      troupe.play(async (s) => {
        scene.classList.add('show-kicker');
        // where he will stand, in this layer's own percentages
        const c = cast.getBoundingClientRect(), l = layer.getBoundingClientRect();
        const mark = ((c.left + c.width * 0.235 - l.left) / l.width) * 100;
        const unit = (c.width / l.width);                 // one % of the painting, as % of the screen

        // a helper races through the courtyard with a little golden flag
        await flag.go(Math.min(90, mark + 34), { s, speed: 38 });
        flag.face('left').set('hold');
        await s.wait(250);

        // the groom steps out from behind the pillar, a second helper trotting at his side
        poses.walk(figure, 'groom', true);
        mor.show(true).at(mark - 8.1 * unit - 4, GROUND);
        await Promise.all([
          s.tween({ duration: 2100, ease: ease.inOut, update: (u) => setVar(figure, '--walk', u) }),
          mor.go(mark + 12, { s, duration: 2100, ease: ease.inOut }),
        ]);
        poses.walk(figure, 'groom', false);
        figure.classList.add('has-arrived');

        // the garland is held up to him, and he receives it
        mor.face('left').set('hold');
        await s.wait(450);
        const fr = figure.getBoundingClientRect();
        const from = [mor.x - 3, GROUND + 9];
        const to = [((fr.left + fr.width * 0.56 - l.left) / l.width) * 100, ((l.bottom - (fr.top + fr.height * 0.36)) / l.height) * 100];
        const fly = document.createElement('span');
        fly.className = 'flying-garland';
        fly.innerHTML = '<svg viewBox="0 0 100 110" aria-hidden="true"></svg>';
        garlandInto(fly.firstChild, (u) => { const a = Math.PI * u; return [50 - Math.cos(a) * 40, 12 + Math.sin(a) * 86]; }, 16, 7);
        layer.appendChild(fly);
        mor.prop(null).set('place');
        await s.tween({
          duration: 900, ease: ease.inOut,
          update: (u) => {
            fly.style.setProperty('--gx', `${lerp(from[0], to[0], u).toFixed(2)}%`);
            fly.style.setProperty('--gy', `${(lerp(from[1], to[1], u) + Math.sin(Math.PI * u) * 9).toFixed(2)}%`);
            fly.style.opacity = u > 0.82 ? ((1 - u) / 0.18).toFixed(2) : '1';
          },
        });
        fly.remove();
        scene.classList.add('has-garland');
        Invite.sfx.play('pop');
        mor.set('cheer');
        restart(figure, 'is-greeting');
        await s.wait(700);

        scene.classList.add('show-plaque');               // his name unfolds
        Invite.sfx.play('paper');
        await s.wait(800);
        scene.classList.add('show-caption');
        shower(scene, 20);                                // petals from above
        await s.wait(1300);
        mor.set('idle');
        // the flag-bearer leads the way toward the next chapter
        flag.set('wave');
        await s.wait(1200);
        await flag.go(116, { s, speed: 40 });
        flag.show(false);
      });
    }

    scene.classList.add('is-staged');
    setVar(figure, '--walk', 0);
    Invite.helpers.onView(scene, play, reset, 0.42);
    return { reset, play };
  }

  let acts = [];
  function init() {
    poses.init();
    acts = [bride(), groom()].filter(Boolean);
  }
  function reset() { acts.forEach((a) => a.reset()); }

  Invite.poses = poses;
  Invite.shower = shower;
  Invite.entrances = { init, reset };
})();
