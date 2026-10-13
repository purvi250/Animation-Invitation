/* ============================================================================
   AUDIO — the music toggle.
     · Nothing plays until the guest taps (browsers require it, and it is polite).
     · The guest can mute at any time; their choice is remembered for the visit.
     · If the music file is missing, a soft chime melody is played instead.
     · Music pauses when the tab is hidden and resumes when it returns.
   ============================================================================ */
(function () {
  'use strict';
  const Invite = window.Invite;
  const cfg = Invite.config.music || {};
  const TARGET = typeof cfg.volume === 'number' ? Invite.clamp01(cfg.volume) : 0.6;

  let el, button;
  let playing = false;
  let wanted = false;      // the guest has asked for music (even if the file turns out to be unplayable)
  let userMuted = false;
  let useSynth = !cfg.src;
  let synth = null;
  let fadeRaf = 0;
  let pausedByTab = false;
  let loaded = false;

  /* ---------- built-in fallback: a slow pentatonic chime over a quiet drone ---------- */
  function createSynth() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    const ac = new AC();
    const master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination);
    const delay = ac.createDelay(1.5); delay.delayTime.value = 0.46;
    const feedback = ac.createGain(); feedback.gain.value = 0.36;
    const wet = ac.createGain(); wet.gain.value = 0.5;
    delay.connect(feedback); feedback.connect(delay); delay.connect(wet); wet.connect(master);
    const NOTES = [293.66, 369.99, 440, 493.88, 587.33, 659.25, 739.99, 880];
    let timer = 0, step = 0, drone = null;

    const chime = () => {
      const now = ac.currentTime;
      const f = NOTES[[0, 2, 4, 3, 5, 4, 2, 1, 4, 6, 5, 7, 4, 3, 2, 0][step % 16] + 0];
      step += 1;
      [1, 2.01, 3.02].forEach((mult, i) => {
        const osc = ac.createOscillator(); const g = ac.createGain();
        osc.type = i ? 'sine' : 'triangle'; osc.frequency.value = f * mult;
        const peak = [0.2, 0.06, 0.025][i];
        g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(peak, now + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);
        osc.connect(g); g.connect(master); g.connect(delay);
        osc.start(now); osc.stop(now + 3.4);
      });
      timer = setTimeout(chime, step % 4 === 0 ? 1900 : 950);
    };
    return {
      start() {
        if (ac.state === 'suspended') ac.resume();
        if (!drone) {
          drone = [146.83, 220.0].map((f, i) => {
            const osc = ac.createOscillator(); const g = ac.createGain();
            osc.type = 'sine'; osc.frequency.value = f; osc.detune.value = i ? 4 : -4; g.gain.value = 0.05;
            osc.connect(g); g.connect(master); osc.start(); return osc;
          });
        }
        master.gain.cancelScheduledValues(ac.currentTime);
        master.gain.setTargetAtTime(TARGET * 0.8, ac.currentTime, 0.6);
        clearTimeout(timer); chime();
      },
      stop() {
        clearTimeout(timer);
        master.gain.cancelScheduledValues(ac.currentTime);
        master.gain.setTargetAtTime(0, ac.currentTime, 0.25);
      },
    };
  }

  /* ---------- helpers ---------- */
  function fadeTo(target, ms, then) {
    cancelAnimationFrame(fadeRaf);
    const from = el.volume, t0 = performance.now();
    const step = (now) => {
      const u = Invite.clamp01((now - t0) / ms);
      try { el.volume = Invite.clamp01(from + (target - from) * u); } catch (e) { /* iOS keeps volume read-only */ }
      if (u < 1) fadeRaf = requestAnimationFrame(step);
      else if (then) then();
    };
    fadeRaf = requestAnimationFrame(step);
  }

  function reflect() {
    if (!button) return;
    button.setAttribute('aria-pressed', playing ? 'true' : 'false');
    button.setAttribute('aria-label', playing ? 'Mute music' : 'Play music');
    button.title = playing ? 'Mute music' : 'Play music';
    document.documentElement.classList.toggle('is-playing', playing);
    Invite.emit('music', playing);
  }

  function startSynth() {
    synth = synth || createSynth();
    if (!synth) { // no way to make sound at all — say so honestly
      playing = false; reflect();
      if (button) { button.disabled = true; button.setAttribute('aria-label', 'Music is unavailable'); button.title = 'Music is unavailable in this browser'; }
      return;
    }
    synth.start(); playing = true; reflect();
  }

  /** The music file could not be played: switch to the chimes, and keep playing if music was wanted. */
  function fallBack() {
    if (useSynth) return;
    useSynth = true;
    cancelAnimationFrame(fadeRaf);
    Invite.emit('asset-missing', cfg.src);
    if (wanted) startSynth(); else { playing = false; reflect(); }
  }

  function start() {
    if (playing) return;
    wanted = true;
    if (useSynth) { startSynth(); return; }
    if (!loaded) { el.src = cfg.src; loaded = true; }
    try { el.volume = 0; } catch (e) { /* ignore */ }
    const attempt = el.play();
    playing = true; reflect();
    if (attempt && attempt.then) {
      attempt.then(() => { if (!useSynth && playing) fadeTo(TARGET, 1400); }).catch((err) => {
        if (useSynth) return; // the error handler already switched to the chimes
        if (err && err.name === 'NotAllowedError') { wanted = false; playing = false; reflect(); return; } // the browser wants a tap first
        if (err && err.name === 'AbortError') return; // interrupted by a quick mute — nothing is wrong
        fallBack();
      });
    }
  }

  function stop() {
    wanted = false;
    if (!playing) return;
    playing = false; reflect();
    if (useSynth) { if (synth) synth.stop(); return; }
    fadeTo(0, 500, () => { if (!playing) el.pause(); });
  }

  function toggle() {
    if (playing) { userMuted = true; stop(); }
    else { userMuted = false; start(); }
    try { sessionStorage.setItem('invite-muted', userMuted ? '1' : '0'); } catch (e) { /* private mode */ }
  }

  /** Called from inside the envelope's tap handler — a genuine user gesture. */
  function startFromGesture() {
    if (cfg.startOnOpen === false || userMuted || playing) return;
    start();
  }

  function init() {
    el = document.getElementById('music');
    button = document.getElementById('music-toggle');
    if (!el || !button) return;
    try { userMuted = sessionStorage.getItem('invite-muted') === '1'; } catch (e) { /* private mode */ }

    // a missing or unplayable file switches to the built-in chimes
    el.addEventListener('error', () => { if (loaded) fallBack(); });

    button.addEventListener('click', toggle);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && playing) { pausedByTab = true; stop(); }
      else if (!document.hidden && pausedByTab) { pausedByTab = false; if (!userMuted) start(); }
    });
    reflect();
  }

  Invite.audio = { init, start, stop, toggle, startFromGesture, get playing() { return playing; }, get usingFallback() { return useSynth; } };
})();
