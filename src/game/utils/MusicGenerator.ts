/**
 * Music Generator
 * Creates procedural atmospheric music using Web Audio API
 * Inspired by tension and suspense without copying copyrighted material
 */

export default class MusicGenerator {
  private audioContext: AudioContext | null = null;
  private isPlaying: boolean = false;
  private masterGain: GainNode | null = null;
  private currentNodes: (OscillatorNode | GainNode)[] = [];
  private musicType: 'menu' | 'gameplay' | 'tension' = 'menu';
  private intervalId: number | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.3; // Lower volume for background music
      this.masterGain.connect(this.audioContext.destination);
    }
  }

  /**
   * Set master volume
   */
  setVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Play menu background music - calm and mysterious
   */
  playMenuMusic(): void {
    this.stopMusic();
    if (!this.audioContext || !this.masterGain) return;

    this.musicType = 'menu';
    this.isPlaying = true;
    const ctx = this.audioContext;

    // Create ambient pad sound
    const createAmbientPad = (freq: number, startTime: number, duration: number) => {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const osc3 = ctx.createOscillator();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc3.type = 'sine';

      osc1.frequency.value = freq;
      osc2.frequency.value = freq * 1.01; // Slight detune for richness
      osc3.frequency.value = freq * 0.5; // Sub bass

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.05, startTime + 2);
      gain.gain.linearRampToValueAtTime(0.05, startTime + duration - 2);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      filter.Q.value = 1;

      osc1.connect(filter);
      osc2.connect(filter);
      osc3.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      osc1.start(startTime);
      osc2.start(startTime);
      osc3.start(startTime);
      osc1.stop(startTime + duration);
      osc2.stop(startTime + duration);
      osc3.stop(startTime + duration);

      this.currentNodes.push(osc1, osc2, osc3, gain);
    };

    // Chord progression: Am - F - C - G (mysterious mood)
    const chords = [
      [220, 264, 330],  // A minor
      [174.61, 220, 261.63], // F major
      [261.63, 329.63, 392], // C major
      [196, 246.94, 293.66], // G major
    ];

    let chordIndex = 0;
    const playChordProgression = () => {
      if (!this.isPlaying || this.musicType !== 'menu') return;

      const chord = chords[chordIndex];
      chord.forEach(freq => {
        createAmbientPad(freq, this.audioContext!.currentTime, 8);
      });

      chordIndex = (chordIndex + 1) % chords.length;
    };

    // Play initial chord
    playChordProgression();

    // Continue playing chords
    this.intervalId = window.setInterval(playChordProgression, 8000);
  }

  /**
   * Play gameplay music - tense and suspenseful
   */
  playGameplayMusic(): void {
    this.stopMusic();
    if (!this.audioContext || !this.masterGain) return;

    this.musicType = 'gameplay';
    this.isPlaying = true;
    const ctx = this.audioContext;

    // Heartbeat bass pulse
    const createHeartbeat = (startTime: number) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 55; // Low A

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(startTime);
      osc.stop(startTime + 0.3);

      this.currentNodes.push(osc, gain);
    };

    // Tension drone
    const createTensionDrone = (startTime: number, duration: number) => {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();

      osc1.type = 'sawtooth';
      osc2.type = 'square';

      osc1.frequency.value = 110; // A2
      osc2.frequency.value = 165; // E3 (fifth)

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.03, startTime + 1);
      gain.gain.linearRampToValueAtTime(0.03, startTime + duration - 1);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      filter.Q.value = 5;

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      osc1.start(startTime);
      osc2.start(startTime);
      osc1.stop(startTime + duration);
      osc2.stop(startTime + duration);

      this.currentNodes.push(osc1, osc2, gain);
    };

    // High pitched tension
    const createHighTension = (startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, startTime);
      osc.frequency.linearRampToValueAtTime(1400, startTime + duration);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.02, startTime + 1);
      gain.gain.setValueAtTime(0.02, startTime + duration - 0.5);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(startTime);
      osc.stop(startTime + duration);

      this.currentNodes.push(osc, gain);
    };

    let beatCount = 0;
    const playTensionLoop = () => {
      if (!this.isPlaying || this.musicType !== 'gameplay') return;

      const now = ctx.currentTime;

      // Heartbeat on beats 1 and 3
      if (beatCount % 4 === 0 || beatCount % 4 === 2) {
        createHeartbeat(now);
      }

      // Drone every 8 beats
      if (beatCount % 8 === 0) {
        createTensionDrone(now, 8);
        createHighTension(now, 8);
      }

      beatCount++;
    };

    // Start with initial sounds
    createTensionDrone(ctx.currentTime, 8);
    createHighTension(ctx.currentTime, 8);
    createHeartbeat(ctx.currentTime);

    // Continue the tension loop
    this.intervalId = window.setInterval(playTensionLoop, 1000); // Every second
  }

  /**
   * Intensify music during red light
   */
  intensify(): void {
    if (!this.audioContext || !this.masterGain || !this.isPlaying) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Add sharp, dissonant stab
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 880; // A5

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 500;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  /**
   * Relief sound when turning to green light
   */
  relief(): void {
    if (!this.audioContext || !this.masterGain || !this.isPlaying) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Descending tone for relief
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.8);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.8);
  }

  /**
   * Stop all music
   */
  stopMusic(): void {
    this.isPlaying = false;

    // Clear interval
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Stop and disconnect all nodes
    this.currentNodes.forEach(node => {
      try {
        if (node instanceof OscillatorNode) {
          node.stop();
        }
        node.disconnect();
      } catch (e) {
        // Node might already be stopped
      }
    });

    this.currentNodes = [];
  }

  /**
   * Check if music is currently playing
   */
  isPlayingMusic(): boolean {
    return this.isPlaying;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopMusic();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
