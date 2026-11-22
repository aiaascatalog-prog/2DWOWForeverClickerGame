class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private adPaused: boolean = false;

  private ensureContext(): AudioContext | null {
    if (this.muted || this.adPaused) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setAdPaused(paused: boolean) {
    this.adPaused = paused;
  }

  public playClick(isCrit = false, combo = 0) {
    this.playHit('cleave', isCrit, combo);
  }

  public playHit(style: string, isCrit = false, combo = 0) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    const pitchBoost = Math.min(combo * 8, 120);
    let wave: OscillatorType = 'triangle';
    let startFreq = 220 + pitchBoost;
    let endFreq = 95;
    let dur = 0.075;

    if (style === 'arrow') {
      wave = 'triangle';
      startFreq = 520 + pitchBoost * 0.5;
      endFreq = 190;
      dur = 0.065;
    } else if (style === 'frost_orb' || style === 'moonfire' || style === 'holy_beam') {
      wave = 'sine';
      startFreq = (style === 'holy_beam' ? 660 : 540) + pitchBoost * 0.6;
      endFreq = 280;
      dur = 0.095;
    } else if (style === 'lightning' || style === 'fel_bolt') {
      wave = 'triangle';
      startFreq = 360 + pitchBoost;
      endFreq = 130;
      dur = 0.085;
    } else if (style === 'hammer_wave') {
      wave = 'triangle';
      startFreq = 165 + pitchBoost * 0.4;
      endFreq = 65;
      dur = 0.1;
    }

    if (isCrit) {
      startFreq *= 1.38;
      dur += 0.03;
    }

    osc.type = isCrit ? 'triangle' : wave;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), now + dur);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isCrit ? 2600 : 1800, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(isCrit ? 0.12 : 0.075, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  public playEnemyDefeat(isBoss = false) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = isBoss ? [330, 440, 554.37, 659.25, 880] : [659.25, 987.77];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isBoss ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.045);

      gain.gain.setValueAtTime(isBoss ? 0.11 : 0.065, now + idx * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + (isBoss ? 0.28 : 0.14));

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.045);
      osc.stop(now + idx * 0.045 + (isBoss ? 0.3 : 0.15));
    });
  }

  public playSkillCast() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const freqs = [293.66, 440, 587.33, 880];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.04);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.18, now + i * 0.04 + 0.18);

      gain.gain.setValueAtTime(0.06, now + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.04);
      osc.stop(now + i * 0.04 + 0.24);
    });
  }

  public playUpgrade() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [440, 554.37, 659.25];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(0.001, now + idx * 0.04);
      gain.gain.linearRampToValueAtTime(0.085, now + idx * 0.04 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.15);
    });
  }

  public playFeverStart() {
    this.playSkillCast();
  }

  public playGoldenCatch() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [587.33, 783.99, 987.77, 1174.66, 1318.51];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.04);

      gain.gain.setValueAtTime(0.095, now + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.04);
      osc.stop(now + i * 0.04 + 0.24);
    });
  }

  public playAchievement() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.055);

      gain.gain.setValueAtTime(0.1, now + i * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.055 + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.055);
      osc.stop(now + i * 0.055 + 0.26);
    });
  }

  public playPrestige() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);

      gain.gain.setValueAtTime(0.12, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.36);
    });
  }

  public playClassAutoSkill(aoe = false) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = aoe ? [392, 523.25, 659.25] : [440, 622.25];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = aoe ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.03);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.15, now + i * 0.03 + 0.11);

      gain.gain.setValueAtTime(0.045, now + i * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.03 + 0.13);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.03);
      osc.stop(now + i * 0.03 + 0.14);
    });
  }

  public playEnemyCounter() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(175, now);
    osc.frequency.exponentialRampToValueAtTime(68, now + 0.22);

    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playShieldBlock() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(740, now);
    osc.frequency.exponentialRampToValueAtTime(1180, now + 0.1);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }
}

export const soundEngine = new SoundEngine();
