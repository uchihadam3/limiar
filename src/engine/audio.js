// Áudio 100% procedural (Web Audio). Trilha por ambiente com crossfade,
// efeitos sonoros sintetizados e reverb gerado.

const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12); // MIDI -> Hz

// A canção da menina: melodia original usada na caixinha de música e como leitmotiv.
export const GIRL_SONG = [76, 79, 83, 81, 79, 78, 76, 71, 72, 76, 74, 71, 76];
const GIRL_DUR = [1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 1, 1, 3];

export class Audio {
  constructor() {
    this.ctx = null;
    this.themes = {};
    this.current = null;
    this.vol = { master: 0.9, music: 0.7, sfx: 0.9 };
  }

  init() {
    if (this.ctx) { this.ctx.resume(); return; }
    const ctx = (this.ctx = new (window.AudioContext || window.webkitAudioContext)());
    this.master = ctx.createGain(); this.master.gain.value = this.vol.master;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 3;
    this.master.connect(comp).connect(ctx.destination);
    this.music = ctx.createGain(); this.music.gain.value = this.vol.music; this.music.connect(this.master);
    this.sfx = ctx.createGain(); this.sfx.gain.value = this.vol.sfx; this.sfx.connect(this.master);
    this.reverb = ctx.createConvolver(); this.reverb.buffer = this.impulse(3.8, 2.6);
    this.reverbGain = ctx.createGain(); this.reverbGain.gain.value = 0.55;
    this.reverb.connect(this.reverbGain).connect(this.master);
    this.noiseBuf = this.makeNoise(4);
    this.brownBuf = this.makeNoise(4, true);
    if (this.pendingTheme) this.setTheme(this.pendingTheme);
  }

  setVolumes(v) {
    Object.assign(this.vol, v);
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.vol.master, t, 0.05);
    this.music.gain.setTargetAtTime(this.vol.music, t, 0.05);
    this.sfx.gain.setTargetAtTime(this.vol.sfx, t, 0.05);
  }

  impulse(seconds, decay) {
    const ctx = this.ctx, rate = ctx.sampleRate, len = rate * seconds;
    const buf = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }
  makeNoise(seconds, brown = false) {
    const ctx = this.ctx, len = ctx.sampleRate * seconds;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
    }
    return buf;
  }
  noise(brown = false) {
    const s = this.ctx.createBufferSource();
    s.buffer = brown ? this.brownBuf : this.noiseBuf; s.loop = true;
    return s;
  }

  // ---------- trilha ----------
  setTheme(name) {
    if (!this.ctx) { this.pendingTheme = name; return; }
    if (this.current && this.current.name === name) return;
    const t = this.ctx.currentTime;
    if (this.current) {
      const old = this.current;
      old.gain.gain.cancelScheduledValues(t);
      old.gain.gain.setValueAtTime(old.gain.gain.value, t);
      old.gain.gain.linearRampToValueAtTime(0, t + 2.5);
      setTimeout(() => old.stop(), 2800);
    }
    const th = this.buildTheme(name);
    th.gain.gain.setValueAtTime(0, t);
    th.gain.gain.linearRampToValueAtTime(1, t + 3);
    this.current = th;
  }

  buildTheme(name) {
    const ctx = this.ctx;
    const gain = ctx.createGain(); gain.connect(this.music);
    const wet = ctx.createGain(); wet.gain.value = 0.8; gain.connect(wet); wet.connect(this.reverb);
    const nodes = [], timers = [];
    const th = { name, gain, stop: () => { timers.forEach(clearInterval); timers.forEach(clearTimeout); nodes.forEach((n) => { try { n.stop(); } catch { } }); gain.disconnect(); } };

    const drone = (midi, vol, type = 'sawtooth', cutoff = 300, detune = 7) => {
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff; f.Q.value = 0.7;
      const g = ctx.createGain(); g.gain.value = vol;
      for (const d of [-detune, detune]) {
        const o = ctx.createOscillator(); o.type = type; o.frequency.value = NOTE(midi); o.detune.value = d;
        o.connect(f); o.start(); nodes.push(o);
      }
      // movimento lento do filtro
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.03 + Math.random() * 0.05;
      const lg = ctx.createGain(); lg.gain.value = cutoff * 0.4;
      lfo.connect(lg).connect(f.frequency); lfo.start(); nodes.push(lfo);
      f.connect(g).connect(gain);
      return g;
    };
    const noiseBed = (type, freq, vol, brown = false, q = 0.8) => {
      const s = this.noise(brown); const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
      const g = ctx.createGain(); g.gain.value = vol;
      s.connect(f).connect(g).connect(gain); s.start(); nodes.push(s);
      return { f, g };
    };
    const sparse = (scale, every, vol, octave = 0, voice = 'piano') => {
      const tick = () => {
        if (Math.random() < 0.55) {
          const n = scale[(Math.random() * scale.length) | 0] + octave;
          this.tone(n, vol, voice, gain);
          if (Math.random() < 0.3) setTimeout(() => this.tone(n + (Math.random() < 0.5 ? 3 : 7), vol * 0.6, voice, gain), 400 + Math.random() * 500);
        }
      };
      timers.push(setInterval(tick, every * 1000));
    };

    const minor = [57, 60, 62, 64, 65, 67, 69]; // lá menor natural (A3..)
    switch (name) {
      case 'menu':
        drone(33, 0.06, 'sawtooth', 180); drone(40, 0.03, 'triangle', 400);
        noiseBed('lowpass', 300, 0.05, true);
        sparse(minor, 3.2, 0.06, 12, 'piano');
        break;
      case 'casa':
        drone(33, 0.05, 'sawtooth', 160); drone(45, 0.018, 'triangle', 600, 11);
        noiseBed('lowpass', 220, 0.04, true);
        sparse(minor, 4.2, 0.05, 0, 'piano');
        break;
      case 'biblioteca':
        drone(36, 0.05, 'sawtooth', 170); drone(43, 0.02, 'sine', 500, 4);
        noiseBed('bandpass', 900, 0.008);
        sparse([60, 63, 67, 70, 72], 5, 0.045, 0, 'piano');
        break;
      case 'jantar': {
        drone(31, 0.05, 'sawtooth', 150); drone(38, 0.02, 'triangle', 500, 13);
        sparse([55, 58, 62, 65, 66], 4.5, 0.045, 0, 'piano');
        timers.push(setInterval(() => this.click(0.035, 2400, gain), 1000));
        break;
      }
      case 'cozinha':
        drone(34, 0.045, 'sawtooth', 140); noiseBed('bandpass', 120, 0.03, false, 6); // zumbido elétrico
        timers.push(setInterval(() => { if (Math.random() < 0.5) this.drip(gain); }, 2300));
        break;
      case 'estufa': {
        const rain = noiseBed('highpass', 1200, 0.09); rain.f.Q.value = 0.3;
        noiseBed('lowpass', 500, 0.07, true);
        const wind = noiseBed('bandpass', 400, 0.05, true, 1.5);
        const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07; const lg = ctx.createGain(); lg.gain.value = 250;
        lfo.connect(lg).connect(wind.f.frequency); lfo.start(); nodes.push(lfo);
        drone(38, 0.025, 'triangle', 400);
        sparse([62, 65, 69, 72], 6, 0.03, 12, 'bell');
        timers.push(setInterval(() => { if (Math.random() < 0.25) this.thunder(gain); }, 9000));
        break;
      }
      case 'jardim': {
        const rain = noiseBed('highpass', 1000, 0.1); rain.f.Q.value = 0.3;
        noiseBed('lowpass', 400, 0.08, true);
        const wind = noiseBed('bandpass', 350, 0.06, true, 1.2);
        const lfo = ctx.createOscillator(); lfo.frequency.value = 0.05; const lg = ctx.createGain(); lg.gain.value = 220;
        lfo.connect(lg).connect(wind.f.frequency); lfo.start(); nodes.push(lfo);
        drone(36, 0.03, 'triangle', 300); drone(43, 0.015, 'sine', 600, 5);
        // fragmentos da canção da Clara, muito longe
        timers.push(setInterval(() => {
          if (Math.random() < 0.35) { const st = (Math.random() * (GIRL_SONG.length - 3)) | 0; for (let i = 0; i < 3; i++) setTimeout(() => this.tone(GIRL_SONG[st + i] - 12, 0.018, 'bell', gain), i * 650); }
        }, 7000));
        timers.push(setInterval(() => { if (Math.random() < 0.22) this.thunder(gain); }, 11000));
        break;
      }
      case 'labirinto': {
        noiseBed('highpass', 1300, 0.06);
        const wind = noiseBed('bandpass', 500, 0.07, true, 2);
        const lfo = ctx.createOscillator(); lfo.frequency.value = 0.09; const lg = ctx.createGain(); lg.gain.value = 300;
        lfo.connect(lg).connect(wind.f.frequency); lfo.start(); nodes.push(lfo);
        drone(31, 0.05, 'sawtooth', 140, 14); drone(38, 0.02, 'sine', 400, 2);
        sparse([62, 63, 67, 68], 5, 0.03, 12, 'bell');
        timers.push(setInterval(() => { if (Math.random() < 0.25) this.whisper(0.04, gain); }, 9000));
        timers.push(setInterval(() => { if (Math.random() < 0.18) this.thunder(gain); }, 13000));
        break;
      }
      case 'jardineiro': {
        const roof = noiseBed('lowpass', 700, 0.09); roof.f.Q.value = 0.5;
        drone(41, 0.03, 'triangle', 500); drone(48, 0.012, 'sine', 900, 4);
        sparse([65, 69, 72, 74, 77], 5.5, 0.035, 0, 'piano');
        timers.push(setInterval(() => { if (Math.random() < 0.3) this.drip(gain); }, 2600));
        break;
      }
      case 'galeria':
        drone(33, 0.045, 'sawtooth', 160, 9); drone(40, 0.02, 'triangle', 500);
        noiseBed('lowpass', 250, 0.035, true);
        sparse([57, 60, 64, 65, 69], 4.8, 0.045, 0, 'piano');
        break;
      case 'casal':
        drone(38, 0.035, 'triangle', 400); drone(45, 0.02, 'sine', 700, 4);
        timers.push(setInterval(() => { if (Math.random() < 0.45) { const i = (Math.random() * (GIRL_SONG.length - 2)) | 0; this.tone(GIRL_SONG[i] - 12, 0.03, 'piano', gain); setTimeout(() => this.tone(GIRL_SONG[i + 1] - 12, 0.025, 'piano', gain), 700); } }, 4200));
        break;
      case 'sotao':
        drone(30, 0.05, 'sawtooth', 130, 12); noiseBed('lowpass', 600, 0.06);
        timers.push(setInterval(() => { if (Math.random() < 0.4) this.creak(0.03, 1.2, 150 + Math.random() * 100); }, 5000));
        timers.push(setInterval(() => { if (Math.random() < 0.3) this.tone(GIRL_SONG[(Math.random() * GIRL_SONG.length) | 0], 0.02, 'box', gain); }, 6000));
        break;
      case 'observatorio':
        drone(48, 0.02, 'sine', 1500, 3); drone(55, 0.015, 'sine', 2000, 6); drone(36, 0.03, 'triangle', 300);
        sparse([72, 76, 79, 83, 86], 3.6, 0.03, 0, 'bell');
        break;
      case 'capela':
        drone(36, 0.05, 'sawtooth', 220, 3); drone(43, 0.04, 'sawtooth', 300, 3); drone(48, 0.02, 'triangle', 600, 2);
        noiseBed('bandpass', 400, 0.01);
        timers.push(setInterval(() => { if (Math.random() < 0.3) this.whisper(0.03, gain); }, 8000));
        break;
      case 'musica':
        drone(33, 0.035, 'triangle', 400);
        timers.push(setInterval(() => { if (Math.random() < 0.4) this.tone(GIRL_SONG[(Math.random() * GIRL_SONG.length) | 0] - 12, 0.03, 'piano', gain); }, 3800));
        break;
      case 'corredor':
        drone(32, 0.055, 'sawtooth', 140, 18); drone(33, 0.03, 'sawtooth', 200, 3); // dissonância
        noiseBed('lowpass', 180, 0.04, true);
        timers.push(setInterval(() => this.heartbeat(0.12, gain), 1500));
        break;
      case 'quarto':
        drone(52, 0.012, 'sine', 1200, 3); drone(59, 0.01, 'sine', 1500, 5);
        noiseBed('bandpass', 2500, 0.005);
        timers.push(setInterval(() => {
          if (Math.random() < 0.5) {
            const i = (Math.random() * GIRL_SONG.length) | 0;
            this.tone(GIRL_SONG[i], 0.025, 'box', gain);
          }
        }, 3500));
        break;
      case 'gabinete':
        drone(29, 0.06, 'sawtooth', 120); drone(41, 0.02, 'sine', 300);
        sparse([53, 56, 60, 61], 3.5, 0.04, 0, 'piano');
        break;
      case 'escada':
        drone(28, 0.07, 'sawtooth', 110, 9); drone(35, 0.03, 'triangle', 260);
        noiseBed('lowpass', 150, 0.06, true);
        timers.push(setInterval(() => { if (Math.random() < 0.6) this.drip(gain); }, 1700));
        break;
      case 'adega':
        drone(26, 0.08, 'sawtooth', 100, 12); drone(33, 0.03, 'sine', 200);
        noiseBed('lowpass', 120, 0.07, true);
        timers.push(setInterval(() => { if (Math.random() < 0.7) this.drip(gain); }, 1300));
        timers.push(setInterval(() => { if (Math.random() < 0.3) this.whisper(0.05, gain); }, 7000));
        break;
      default:
        drone(33, 0.05);
    }
    return th;
  }

  // ---------- vozes ----------
  tone(midi, vol, voice = 'piano', dest = this.sfx) {
    const ctx = this.ctx; if (!ctx) return;
    const t = ctx.currentTime, f = NOTE(midi);
    const g = ctx.createGain(); g.connect(dest);
    const send = ctx.createGain(); send.gain.value = 0.7; g.connect(send).connect(this.reverb);
    const partials = voice === 'box' ? [[1, 1], [4.0, 0.25], [6.8, 0.08]]
      : voice === 'bell' ? [[1, 1], [2.76, 0.4], [5.4, 0.2]]
        : [[1, 1], [2, 0.35], [3, 0.12], [4.01, 0.06]];
    const dur = voice === 'box' ? 1.6 : voice === 'bell' ? 4 : 3.2;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    for (const [mul, amp] of partials) {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f * mul;
      const og = ctx.createGain(); og.gain.value = amp;
      o.connect(og).connect(g); o.start(t); o.stop(t + dur + 0.1);
    }
  }

  playGirlSong(onDone, tempo = 0.36) {
    if (!this.ctx) { onDone && onDone(); return; }
    let acc = 0;
    GIRL_SONG.forEach((n, i) => {
      setTimeout(() => this.tone(n, 0.18, 'box'), acc * 1000);
      acc += GIRL_DUR[i] * tempo;
    });
    // segunda volta, mais lenta e desafinada
    const second = acc + 0.6;
    GIRL_SONG.forEach((n, i) => {
      setTimeout(() => this.tone(n - (i > 8 ? 1 : 0), 0.12, 'box'), (second + GIRL_SONG.slice(0, i).reduce((a, _, k) => a + GIRL_DUR[k] * tempo * 1.25, 0)) * 1000);
    });
    const total = second + GIRL_DUR.reduce((a, b) => a + b, 0) * tempo * 1.25;
    setTimeout(() => onDone && onDone(), (acc + 0.8) * 1000); // o olho abre ao fim da primeira volta
    return total;
  }

  // ---------- efeitos ----------
  env(node, t, a, peak, d) {
    node.gain.setValueAtTime(0.0001, t);
    node.gain.exponentialRampToValueAtTime(peak, t + a);
    node.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }

  footstep(surface = 'wood', vol = 1) {
    const ctx = this.ctx; if (!ctx) return;
    const t = ctx.currentTime;
    const s = ctx.createBufferSource(); s.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter(); const g = ctx.createGain();
    const cfg = {
      wood: ['lowpass', 520, 0.16, 0.12], stone: ['bandpass', 1500, 0.12, 0.07], tile: ['bandpass', 2200, 0.1, 0.05],
      soil: ['lowpass', 900, 0.1, 0.09], rug: ['lowpass', 300, 0.08, 0.08], water: ['bandpass', 1100, 0.14, 0.2],
    }[surface] || ['lowpass', 500, 0.15, 0.1];
    f.type = cfg[0]; f.frequency.value = cfg[1] * (0.85 + Math.random() * 0.3);
    s.connect(f).connect(g).connect(this.sfx);
    this.env(g, t, 0.006, cfg[2] * vol, cfg[3]);
    s.start(t, Math.random() * 3); s.stop(t + 0.4);
    if (surface === 'wood' && Math.random() < 0.12) this.creak(0.03, 0.4);
  }

  creak(vol = 0.08, dur = 1.2, base = 180) {
    const ctx = this.ctx; if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(base, t);
    for (let i = 1; i < 12; i++) o.frequency.linearRampToValueAtTime(base * (0.7 + Math.random() * 0.8), t + (dur * i) / 12);
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 6;
    const g = ctx.createGain();
    const am = ctx.createOscillator(); am.frequency.value = 38; const amg = ctx.createGain(); amg.gain.value = vol * 0.6;
    am.connect(amg).connect(g.gain);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.1); g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(f).connect(g).connect(this.sfx);
    const send = ctx.createGain(); send.gain.value = 0.5; g.connect(send).connect(this.reverb);
    o.start(t); am.start(t); o.stop(t + dur + 0.1); am.stop(t + dur + 0.1);
  }
  doorOpen() { this.creak(0.14, 1.4, 160); this.click(0.2, 1800); }
  doorClose() { this.thud(0.5); }
  doorLocked() {
    for (let i = 0; i < 3; i++) setTimeout(() => { this.click(0.25, 900 + Math.random() * 400); this.thud(0.12); }, i * 110);
  }
  unlock() { this.click(0.3, 2600); setTimeout(() => this.click(0.35, 1400), 160); setTimeout(() => this.click(0.2, 3200), 330); }

  click(vol = 0.2, freq = 2000, dest = this.sfx) {
    const ctx = this.ctx; if (!ctx) return;
    const t = ctx.currentTime;
    const s = ctx.createBufferSource(); s.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 4;
    const g = ctx.createGain(); s.connect(f).connect(g).connect(dest);
    this.env(g, t, 0.002, vol, 0.04); s.start(t, Math.random()); s.stop(t + 0.1);
  }
  thud(vol = 0.4, dest = this.sfx) {
    const ctx = this.ctx; if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.25);
    const g = ctx.createGain(); o.connect(g).connect(dest);
    const send = ctx.createGain(); send.gain.value = 0.6; g.connect(send).connect(this.reverb);
    this.env(g, t, 0.005, vol, 0.35); o.start(t); o.stop(t + 0.5);
  }
  slam() { this.thud(0.9); this.click(0.4, 600); this.creak(0.05, 0.3, 120); }

  pickup() {
    this.tone(84, 0.05, 'bell'); setTimeout(() => this.tone(91, 0.04, 'bell'), 90);
    this.click(0.12, 3000);
  }
  paper() {
    const ctx = this.ctx; if (!ctx) return;
    const t = ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const s = ctx.createBufferSource(); s.buffer = this.noiseBuf;
      const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 2500 + Math.random() * 2000;
      const g = ctx.createGain(); s.connect(f).connect(g).connect(this.sfx);
      const st = t + i * 0.07 + Math.random() * 0.04;
      this.env(g, st, 0.01, 0.07, 0.08); s.start(st, Math.random() * 3); s.stop(st + 0.2);
    }
  }
  heartbeat(vol = 0.3, dest = this.sfx) {
    this.thudLow(vol, dest); setTimeout(() => this.thudLow(vol * 0.7, dest), 260);
  }
  thudLow(vol, dest = this.sfx) {
    const ctx = this.ctx; if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(30, t + 0.18);
    const g = ctx.createGain(); o.connect(g).connect(dest);
    this.env(g, t, 0.01, vol, 0.2); o.start(t); o.stop(t + 0.3);
  }
  drip(dest = this.sfx) {
    const ctx = this.ctx; if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'sine';
    const f0 = 900 + Math.random() * 900;
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 2.2, t + 0.06);
    const g = ctx.createGain(); o.connect(g).connect(dest);
    const send = ctx.createGain(); send.gain.value = 1; g.connect(send).connect(this.reverb);
    this.env(g, t, 0.003, 0.05, 0.08); o.start(t); o.stop(t + 0.15);
  }
  thunder(dest = this.sfx) {
    const ctx = this.ctx; if (!ctx) return;
    const t = ctx.currentTime;
    const s = ctx.createBufferSource(); s.buffer = this.brownBuf;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 200;
    const g = ctx.createGain(); s.connect(f).connect(g).connect(dest);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 5);
    s.start(t, Math.random()); s.stop(t + 5.2);
    if (this.onThunder) this.onThunder();
  }
  whisper(vol = 0.08, dest = this.sfx) {
    const ctx = this.ctx; if (!ctx) return;
    const t = ctx.currentTime;
    const s = ctx.createBufferSource(); s.buffer = this.noiseBuf;
    const g = ctx.createGain();
    const pan = ctx.createStereoPanner(); pan.pan.value = Math.random() * 2 - 1;
    let last = s;
    // formantes que mudam — soa como uma voz sussurrando sílabas
    const f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.Q.value = 9;
    const f2 = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.Q.value = 12;
    const dur = 1.6 + Math.random();
    for (let i = 0; i < 8; i++) {
      const tt = t + (dur * i) / 8;
      f1.frequency.setValueAtTime(400 + Math.random() * 600, tt);
      f2.frequency.setValueAtTime(1400 + Math.random() * 1400, tt);
    }
    const mix = ctx.createGain();
    last.connect(f1).connect(mix); last.connect(f2).connect(mix);
    mix.connect(g).connect(pan).connect(dest);
    const send = ctx.createGain(); send.gain.value = 0.8; pan.connect(send).connect(this.reverb);
    g.gain.setValueAtTime(0, t);
    for (let i = 0; i < 8; i++) g.gain.linearRampToValueAtTime(vol * (0.3 + Math.random()), t + (dur * (i + 0.5)) / 8);
    g.gain.linearRampToValueAtTime(0, t + dur);
    s.start(t, Math.random() * 3); s.stop(t + dur + 0.1);
  }
  stinger() { // susto: cluster dissonante
    const ctx = this.ctx; if (!ctx) return;
    const t = ctx.currentTime;
    for (const n of [45, 46, 52, 58, 59]) {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = NOTE(n);
      const g = ctx.createGain(); o.connect(g).connect(this.sfx);
      const send = ctx.createGain(); send.gain.value = 0.6; g.connect(send).connect(this.reverb);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
      o.start(t); o.stop(t + 2.5);
    }
    this.thud(0.7);
  }
  clockChime(times = 3) {
    for (let i = 0; i < times; i++) setTimeout(() => this.tone(57, 0.16, 'bell'), i * 1400);
  }
  grind() { // pedra / estante arrastando
    const ctx = this.ctx; if (!ctx) return;
    const t = ctx.currentTime;
    const s = ctx.createBufferSource(); s.buffer = this.brownBuf;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 300; f.Q.value = 1.4;
    const g = ctx.createGain(); s.connect(f).connect(g).connect(this.sfx);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.6, t + 0.3); g.gain.linearRampToValueAtTime(0.4, t + 2); g.gain.linearRampToValueAtTime(0, t + 2.6);
    s.start(t); s.stop(t + 2.7);
    this.creak(0.05, 2.4, 90);
  }
}

export const audio = new Audio();
