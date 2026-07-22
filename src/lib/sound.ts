/**
 * Web Audio API ambient audio synthesizer for LoveWrapped stories.
 * Generates gentle, soothing romantic chord progressions using FM/Sine synthesis.
 */

class RomanticAudioSynthesizer {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private masterGain: GainNode | null = null;
  private intervalId: number | null = null;

  // Romantic gentle pentatonic chords in F Major (F, A, C, E, G)
  private frequencies = [
    174.61, // F3
    220.0,  // A3
    261.63, // C4
    329.63, // E4
    392.0,  // G4
    523.25, // C5
  ];

  public init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
  }

  public playNote(freq: number, duration = 3.5, volume = 0.08) {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const osc = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    const now = this.ctx.currentTime;
    noteGain.gain.setValueAtTime(0, now);
    // Soft attack
    noteGain.gain.linearRampToValueAtTime(volume, now + 0.8);
    // Exponential decay
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(noteGain);
    if (this.masterGain) {
      noteGain.connect(this.masterGain);
    } else {
      noteGain.connect(this.ctx.destination);
    }

    osc.start(now);
    osc.stop(now + duration);
  }

  public start() {
    this.init();
    if (!this.ctx) return;

    if (this.isPlaying) return;
    this.isPlaying = true;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Play an opening gentle arpeggio
    this.playChordSequence();

    // Repeat soft chord sequence every 4.5 seconds
    this.intervalId = window.setInterval(() => {
      if (this.isPlaying) {
        this.playChordSequence();
      }
    }, 4500);
  }

  private playChordSequence() {
    const f1 = this.frequencies[Math.floor(Math.random() * 2)]; // Root / 3rd
    const f2 = this.frequencies[2 + Math.floor(Math.random() * 2)]; // 5th / 7th
    const f3 = this.frequencies[4 + Math.floor(Math.random() * 2)]; // High tone

    this.playNote(f1, 4.0, 0.09);
    setTimeout(() => this.playNote(f2, 3.8, 0.07), 400);
    setTimeout(() => this.playNote(f3, 3.5, 0.06), 900);
  }

  public stop() {
    this.isPlaying = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5);
    }
  }

  public toggle(): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const soundSynth = new RomanticAudioSynthesizer();
