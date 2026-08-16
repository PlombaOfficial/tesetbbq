export class SpatialAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientDroneOsc1: OscillatorNode | null = null;
  private ambientDroneOsc2: OscillatorNode | null = null;
  private ambientFilter: BiquadFilterNode | null = null;
  private humGain: GainNode | null = null;
  private masterVolume: number = 0.7;

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    this.masterVolume = THREE_CLAMP(vol, 0, 1);
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.05);
    }
  }

  public startAmbientDrone(pitchHz: number) {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    this.stopAmbientDrone();
    const now = this.ctx.currentTime;

    // Dual-oscillator analog transformer ballast hum
    this.ambientDroneOsc1 = this.ctx.createOscillator();
    this.ambientDroneOsc2 = this.ctx.createOscillator();
    this.ambientFilter = this.ctx.createBiquadFilter();
    this.humGain = this.ctx.createGain();

    this.ambientDroneOsc1.type = 'sawtooth';
    this.ambientDroneOsc1.frequency.setValueAtTime(pitchHz, now);

    this.ambientDroneOsc2.type = 'sine';
    this.ambientDroneOsc2.frequency.setValueAtTime(pitchHz * 2 + 1.2, now); // subtle beating

    this.ambientFilter.type = 'lowpass';
    this.ambientFilter.frequency.setValueAtTime(450, now);

    this.humGain.gain.setValueAtTime(0.08, now);

    this.ambientDroneOsc1.connect(this.ambientFilter);
    this.ambientDroneOsc2.connect(this.ambientFilter);
    this.ambientFilter.connect(this.humGain);
    this.humGain.connect(this.masterGain);

    this.ambientDroneOsc1.start(now);
    this.ambientDroneOsc2.start(now);
  }

  public stopAmbientDrone() {
    if (this.ambientDroneOsc1) {
      try { this.ambientDroneOsc1.stop(); this.ambientDroneOsc1.disconnect(); } catch {}
      this.ambientDroneOsc1 = null;
    }
    if (this.ambientDroneOsc2) {
      try { this.ambientDroneOsc2.stop(); this.ambientDroneOsc2.disconnect(); } catch {}
      this.ambientDroneOsc2 = null;
    }
  }

  // --- FOOTSTEPS ---
  public playFootstep(surface: 'carpet' | 'concrete' | 'puddle') {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    if (surface === 'carpet') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110 + Math.random() * 30, now);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(250, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    } else if (surface === 'puddle') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320 + Math.random() * 80, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    } else {
      // Concrete
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180 + Math.random() * 40, now);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(500, now);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    }

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  // --- FLASHLIGHT CLICK ---
  public playFlashlightClick() {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(2400, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.02);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  // --- WALKIE TALKIE TRANSMISSION SQUELCH ---
  public playRadioSquelch(isStart: boolean) {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.06;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(isStart ? 1800 : 1200, now);
    bandpass.Q.setValueAtTime(3.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    whiteNoise.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(this.masterGain);

    whiteNoise.start(now);
  }

  // --- 3D POSITIONAL ENTITY NOISE ---
  public playEntitySound(type: 'listener_roar' | 'mimic_whisper' | 'smiler_sub' | 'door_slam', distance: number) {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const distFactor = THREE_CLAMP(1.0 - distance / 35.0, 0.02, 1.0);

    if (type === 'door_slam') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);

      gain.gain.setValueAtTime(0.4 * distFactor, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'smiler_sub') {
      // Sub-bass dread frequency
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(45, now);
      osc.frequency.linearRampToValueAtTime(35, now + 1.2);

      gain.gain.setValueAtTime(0.35 * distFactor, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 1.3);
    } else if (type === 'mimic_whisper') {
      // Eerie frequency shift
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(340 + Math.random() * 100, now);
      osc.frequency.linearRampToValueAtTime(220, now + 0.8);

      gain.gain.setValueAtTime(0.15 * distFactor, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.85);
    } else {
      // Listener roar
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.5);

      gain.gain.setValueAtTime(0.3 * distFactor, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.55);
    }
  }

  // --- HEARTBEAT FOR LOW SANITY ---
  public playHeartbeat(sanity: number) {
    if (sanity > 45) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(75, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);

    const vol = (1.0 - sanity / 45) * 0.25;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }
}

function THREE_CLAMP(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export const spatialAudio = new SpatialAudioEngine();
