/**
 * audio.js - Escape the College Procedural Sound Synthesizer & Spooky BGM
 * Uses Web Audio API for zero-dependency, instant, cross-browser audio.
 * Zero audio assets to download - works offline and loads in 0ms!
 */

class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.bgmPlaying = false;
    this.bgmGain = null;
    this.droneOsc1 = null;
    this.droneOsc2 = null;
    this.bgmInterval = null;
    this.bossThemePlaying = false;
    this.bossInterval = null;
    this.lastFootstepTime = 0;
    this.lastHeartbeatTime = 0;
    this.masterVolume = 1.0;

    // Load persisted audio settings (etc_ prefix)
    try {
      const savedMute = localStorage.getItem('etc_muted');
      if (savedMute !== null) this.muted = (savedMute === 'true');
      const savedVol = localStorage.getItem('etc_volume');
      if (savedVol !== null) this.masterVolume = parseFloat(savedVol) || 1.0;
    } catch (e) {
      // RAM fallback
    }
  }

  // Ensure AudioContext is created/resumed upon user interaction
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    try {
      localStorage.setItem('etc_muted', this.muted.toString());
    } catch (e) {}
    if (this.bgmGain && this.ctx) {
      const targetGain = this.muted ? 0.0001 : 0.06;
      this.bgmGain.gain.setValueAtTime(this.bgmGain.gain.value, this.ctx.currentTime);
      this.bgmGain.gain.exponentialRampToValueAtTime(targetGain, this.ctx.currentTime + 0.1);
    }
    return this.muted;
  }

  // ==========================================================================
  // PROCEDURAL SPOOKY BACKGROUND MUSIC (BGM)
  // Ambient collegiate midnight drone with distant eerie synth chimes
  // ==========================================================================

  startBgm() {
    if (this.bgmPlaying) return;
    this.init();
    if (!this.ctx) return;

    this.bgmPlaying = true;

    // Master BGM gain node
    this.bgmGain = this.ctx.createGain();
    const initialGain = this.muted ? 0.0001 : 0.06;
    this.bgmGain.gain.setValueAtTime(initialGain, this.ctx.currentTime);
    this.bgmGain.connect(this.ctx.destination);

    // 1. Ambient Low Drone: Dual detuned sine waves through lowpass filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, this.ctx.currentTime);

    this.droneOsc1 = this.ctx.createOscillator();
    this.droneOsc1.type = 'sine';
    this.droneOsc1.frequency.setValueAtTime(55.0, this.ctx.currentTime); // A1 note

    this.droneOsc2 = this.ctx.createOscillator();
    this.droneOsc2.type = 'triangle';
    this.droneOsc2.frequency.setValueAtTime(55.6, this.ctx.currentTime); // Slight detune for spooky beating

    this.droneOsc1.connect(filter);
    this.droneOsc2.connect(filter);
    filter.connect(this.bgmGain);

    this.droneOsc1.start();
    this.droneOsc2.start();

    // 2. Periodic Spooky Minor Chimes (D minor mysterious scale)
    const spookyNotes = [
      146.83, // D3
      174.61, // F3
      220.00, // A3
      233.08, // Bb3
      293.66, // D4
      349.23, // F4
      440.00  // A4
    ];

    let noteIdx = 0;
    const playNextSpookyNote = () => {
      if (!this.bgmPlaying || !this.ctx || this.muted) return;

      try {
        const freq = spookyNotes[noteIdx % spookyNotes.length];
        noteIdx = (noteIdx + Math.floor(Math.random() * 3) + 1) % spookyNotes.length;

        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();
        const t = this.ctx.currentTime;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        noteGain.gain.setValueAtTime(0.001, t);
        noteGain.gain.linearRampToValueAtTime(0.04, t + 0.15);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);

        osc.connect(noteGain);
        noteGain.connect(this.bgmGain);

        osc.start(t);
        osc.stop(t + 1.8);
      } catch (err) {
        // Safe fallback if audio context state changes
      }
    };

    // Schedule chimes every 1.5 - 2.5 seconds
    this.bgmInterval = setInterval(() => {
      playNextSpookyNote();
    }, 1800);
  }

  stopBgm() {
    this.bgmPlaying = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }

    if (this.bgmGain && this.ctx) {
      try {
        this.bgmGain.gain.setValueAtTime(this.bgmGain.gain.value, this.ctx.currentTime);
        this.bgmGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.3);
      } catch (e) {}
    }

    setTimeout(() => {
      if (this.droneOsc1) {
        try { this.droneOsc1.stop(); this.droneOsc1.disconnect(); } catch (e) {}
        this.droneOsc1 = null;
      }
      if (this.droneOsc2) {
        try { this.droneOsc2.stop(); this.droneOsc2.disconnect(); } catch (e) {}
        this.droneOsc2 = null;
      }
      if (this.bgmGain) {
        try { this.bgmGain.disconnect(); } catch (e) {}
        this.bgmGain = null;
      }
    }, 350);
  }

  // ==========================================================================
  // SOUND EFFECTS (SFX)
  // ==========================================================================

  // Midnight Grandfather Clock Chime / Bell Gong
  playClockChime() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const chimeTones = [110, 220, 440, 659.25, 880];
    chimeTones.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      const amp = idx === 0 ? 0.35 : 0.18 / (idx + 1);
      gain.gain.setValueAtTime(amp, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 1.8);
    });
  }

  // Collect Key: Bright sparkling chime
  playKey() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = this.ctx.currentTime + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  }

  // Coffee pickup: Refreshing rising bubbly chirp
  playCoffee() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.2);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  // Attendance Shield Pickup: Crystalline energetic shield sound
  playShield() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime + idx * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.35);
    });
  }

  // Shield Break: Energy deflection / shatter sound
  playShieldBreak() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.2);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  // Proxy Attendance Pickup: Ethereal ghost / phase-shift whoosh
  playProxy() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.18);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.35);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.35);
  }

  // Proxy End: Soft warning chime
  playProxyEnd() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.setValueAtTime(440, t + 0.1);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  // Hit / Damage: Low frequency impact punch
  playHit() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.25);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  // Exit Gate Unlocked: Fanfare chords
  playGateUnlocked() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [392.00, 523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime + idx * 0.1;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.45);
    });
  }

  // Level Clear / Semester Passed: Joyous progression chord
  playLevelUp() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const melody = [
      { f: 440.00, d: 0.12 }, // A4
      { f: 554.37, d: 0.12 }, // C#5
      { f: 659.25, d: 0.12 }, // E5
      { f: 880.00, d: 0.35 }  // A5
    ];

    let t = this.ctx.currentTime;
    melody.forEach(note => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + note.d);
      t += note.d * 1.1;
    });
  }

  // Victory: Full triumphant melody
  playVictory() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const melody = [
      { f: 523.25, d: 0.15 }, // C5
      { f: 659.25, d: 0.15 }, // E5
      { f: 783.99, d: 0.15 }, // G5
      { f: 1046.50, d: 0.45 } // C6
    ];

    let t = this.ctx.currentTime;
    melody.forEach(note => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + note.d);
      t += note.d * 1.1;
    });
  }

  // Game Over: Sad descending minor tones
  playGameOver() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [392.00, 370.00, 349.23, 293.66]; // G4, F#4, F4, D4
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime + idx * 0.2;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.35);
    });
  }

  // Click UI pop

  setMasterVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    try {
      localStorage.setItem('etc_volume', this.masterVolume.toString());
    } catch (e) {}
    if (this.bgmGain && this.ctx && !this.muted) {
      this.bgmGain.gain.setValueAtTime(0.06 * this.masterVolume, this.ctx.currentTime);
    }
  }

  // Soft collegiate hallway footstep sound
  playFootstep() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    if (now - this.lastFootstepTime < 0.22) return;
    this.lastFootstepTime = now;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(85 + Math.random() * 30, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.05);

      gain.gain.setValueAtTime(0.035 * this.masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {}
  }

  // Suspenseful heartbeat pulsing sound (accelerates under pressure)
  playHeartbeat(rate = 1.0) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const interval = Math.max(0.35, 0.85 / rate);
    if (now - this.lastHeartbeatTime < interval) return;
    this.lastHeartbeatTime = now;

    try {
      // First thump
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(70, now);
      osc1.frequency.exponentialRampToValueAtTime(35, now + 0.1);
      gain1.gain.setValueAtTime(0.18 * this.masterVolume, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.1);

      // Second thump (lub-dub)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(80, now + 0.12);
      osc2.frequency.exponentialRampToValueAtTime(38, now + 0.22);
      gain2.gain.setValueAtTime(0.14 * this.masterVolume, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.22);
    } catch (e) {}
  }

  // Boss Fight Synth Arpeggio Theme
  startBossTheme() {
    if (this.bossThemePlaying) return;
    this.init();
    if (!this.ctx) return;

    this.bossThemePlaying = true;
    const bossNotes = [110, 130.81, 146.83, 155.56, 174.61, 196, 220, 261.63];
    let noteIdx = 0;

    this.bossInterval = setInterval(() => {
      if (!this.bossThemePlaying || !this.ctx || this.muted) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = this.ctx.currentTime;
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(bossNotes[noteIdx % bossNotes.length], t);
        noteIdx++;

        gain.gain.setValueAtTime(0.06 * this.masterVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.14);
      } catch (e) {}
    }, 150);
  }

  stopBossTheme() {
    this.bossThemePlaying = false;
    if (this.bossInterval) {
      clearInterval(this.bossInterval);
      this.bossInterval = null;
    }
  }

  playClick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.05);

    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.05);
  }
}

// Global Sound Instance
window.soundManager = new SoundManager();
