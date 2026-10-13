/* ============================================================================
   SFX — a handful of tiny sounds, made in the browser (no files): a temple-style
   bell, a sparkle, a rustle of paper, a soft whoosh and a pop.
   They are deliberately sparse, and they obey the music button: if the guest
   has not started the music, or has muted it, nothing here makes a sound.
   ============================================================================ */
(function () {
  'use strict';
  const Invite = window.Invite;
  const cfg = Invite.config.music || {};
  let ac = null, out = null;

  function context() {
    if (ac) return ac;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ac = new AC();
    out = ac.createGain();
    out.gain.value = 0.5 * (typeof cfg.volume === 'number' ? cfg.volume : 0.6);
    out.connect(ac.destination);
    return ac;
  }

  const tone = (freq, start, length, peak, type) => {
    const osc = ac.createOscillator(), g = ac.createGain();
    osc.type = type || 'sine'; osc.frequency.value = freq;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(peak, start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, start + length);
    osc.connect(g); g.connect(out);
    osc.start(start); osc.stop(start + length + 0.05);
    return osc;
  };
  const noise = (start, length, peak, lo, hi) => {
    const buffer = ac.createBuffer(1, Math.ceil(ac.sampleRate * length), ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource(); src.buffer = buffer;
    const band = ac.createBiquadFilter(); band.type = 'bandpass';
    band.frequency.setValueAtTime(lo, start); band.frequency.exponentialRampToValueAtTime(hi, start + length);
    band.Q.value = 0.8;
    const g = ac.createGain();
    g.gain.setValueAtTime(0, start); g.gain.linearRampToValueAtTime(peak, start + length * 0.25); g.gain.exponentialRampToValueAtTime(0.0001, start + length);
    src.connect(band); band.connect(g); g.connect(out);
    src.start(start); src.stop(start + length + 0.02);
  };

  const SOUNDS = {
    bell(t) { [[1, 0.22], [2.76, 0.09], [5.4, 0.04], [8.1, 0.02]].forEach(([m, p]) => tone(784 * m, t, 1.9, p)); },
    sparkle(t) { [1318, 1568, 1976, 2349, 2637].forEach((f, i) => tone(f, t + i * 0.07, 0.5, 0.07, 'triangle')); },
    paper(t) { noise(t, 0.38, 0.11, 1800, 5200); noise(t + 0.16, 0.3, 0.07, 2600, 6400); },
    whoosh(t) { noise(t, 0.42, 0.06, 500, 1700); },
    pop(t) { const o = tone(420, t, 0.16, 0.14); o.frequency.exponentialRampToValueAtTime(900, t + 0.1); },
  };

  /** Plays a sound — but only while the guest has the music switched on. */
  function play(name) {
    if (cfg.effects === false || !Invite.audio || !Invite.audio.playing || !SOUNDS[name]) return false;
    try {
      if (!context()) return false;
      if (ac.state === 'suspended') ac.resume();
      SOUNDS[name](ac.currentTime + 0.01);
      Invite.emit('sfx', name);
      return true;
    } catch (err) {
      return false;
    }
  }

  Invite.sfx = { play };
})();
