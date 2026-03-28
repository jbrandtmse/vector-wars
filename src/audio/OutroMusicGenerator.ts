/**
 * OutroMusicGenerator -- Procedural outro music generation using Web Audio API.
 *
 * Generates an ambient/melodic ~60-second audio buffer via OfflineAudioContext.
 * Layered sine/triangle oscillators with a slow chord progression and
 * feedback-delay reverb create an atmospheric, hopeful tone -- the earned
 * reward after completing the full campaign.
 *
 * Follows the same generator pattern as SFXGenerator / VoiceLineGenerator:
 *   generate(id) with cache, hasSound(id), generateAll().
 *
 * Created by: Story 5-10
 */

import { Logger } from '../core/Logger.ts';

/** Duration of the outro track in seconds. */
const OUTRO_DURATION = 60;
const SAMPLE_RATE = 44100;

/** Chord progression -- 4 chords, each held for ~15 seconds. */
const CHORD_PROGRESSION: readonly (readonly number[])[] = [
  [261.63, 329.63, 392.00],   // C major  (hopeful)
  [293.66, 369.99, 440.00],   // D major  (rising)
  [329.63, 415.30, 493.88],   // E major  (bright)
  [261.63, 329.63, 392.00],   // C major  (return home)
] as const;

const CHORD_DURATION = OUTRO_DURATION / CHORD_PROGRESSION.length;

/** Known sound IDs this generator can produce. */
const OUTRO_IDS = new Set(['outro']);

export class OutroMusicGenerator {
  private cache: Map<string, AudioBuffer> = new Map();

  /**
   * Generate an outro music buffer by ID. Returns cached buffer if available,
   * otherwise synthesizes via OfflineAudioContext.
   */
  async generate(id: string): Promise<AudioBuffer | null> {
    if (!OUTRO_IDS.has(id)) return null;

    const cached = this.cache.get(id);
    if (cached) return cached;

    try {
      const length = Math.floor(SAMPLE_RATE * OUTRO_DURATION);
      const ctx = new OfflineAudioContext(2, length, SAMPLE_RATE);

      this.buildOutroGraph(ctx);

      const buffer = await ctx.startRendering();
      this.cache.set(id, buffer);
      Logger.info('Audio', 'Outro music generated', { id, duration: OUTRO_DURATION });
      return buffer;
    } catch (error) {
      Logger.warn('Audio', 'Failed to generate outro music', { id, error: String(error) });
      return null;
    }
  }

  /** Check if this generator has a definition for the given ID. */
  hasSound(id: string): boolean {
    return OUTRO_IDS.has(id);
  }

  /** Pre-generate all outro buffers. */
  async generateAll(): Promise<void> {
    for (const id of OUTRO_IDS) {
      await this.generate(id);
    }
  }

  /**
   * Build the audio graph for the outro track.
   * Layers: pad chords (sine), shimmer (triangle), sub bass (sine), delay tail.
   */
  private buildOutroGraph(ctx: OfflineAudioContext): void {
    // Master gain for overall volume
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, 0);
    // Fade in over 4 seconds
    masterGain.gain.linearRampToValueAtTime(0.25, 4);
    // Sustain until near end
    masterGain.gain.setValueAtTime(0.25, OUTRO_DURATION - 6);
    // Fade out over last 6 seconds
    masterGain.gain.linearRampToValueAtTime(0, OUTRO_DURATION);
    masterGain.connect(ctx.destination);

    // Feedback delay for reverb-like tail
    const delayNode = ctx.createDelay(1.0);
    delayNode.delayTime.setValueAtTime(0.5, 0);
    const feedbackGain = ctx.createGain();
    feedbackGain.gain.setValueAtTime(0.3, 0);
    const delayFilter = ctx.createBiquadFilter();
    delayFilter.type = 'lowpass';
    delayFilter.frequency.setValueAtTime(2000, 0);

    delayNode.connect(feedbackGain);
    feedbackGain.connect(delayFilter);
    delayFilter.connect(delayNode);
    delayNode.connect(masterGain);

    // Dry + wet mix node
    const dryGain = ctx.createGain();
    dryGain.gain.setValueAtTime(0.7, 0);
    dryGain.connect(masterGain);

    const wetSend = ctx.createGain();
    wetSend.gain.setValueAtTime(0.4, 0);
    wetSend.connect(delayNode);

    // --- Pad layer: sine chords ---
    for (let ci = 0; ci < CHORD_PROGRESSION.length; ci++) {
      const chord = CHORD_PROGRESSION[ci];
      const startTime = ci * CHORD_DURATION;
      const endTime = startTime + CHORD_DURATION;

      for (const freq of chord) {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0, startTime);
        // Crossfade: fade in 2s
        oscGain.gain.linearRampToValueAtTime(0.15, startTime + 2);
        // Hold
        oscGain.gain.setValueAtTime(0.15, endTime - 2);
        // Crossfade: fade out 2s
        oscGain.gain.linearRampToValueAtTime(0, endTime);

        osc.connect(oscGain);
        oscGain.connect(dryGain);
        oscGain.connect(wetSend);
        osc.start(startTime);
        osc.stop(endTime);
      }
    }

    // --- Shimmer layer: triangle oscillators an octave up ---
    for (let ci = 0; ci < CHORD_PROGRESSION.length; ci++) {
      const chord = CHORD_PROGRESSION[ci];
      const startTime = ci * CHORD_DURATION;
      const endTime = startTime + CHORD_DURATION;
      const rootFreq = chord[0] * 2; // octave up

      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(rootFreq, startTime);

      const shimmerGain = ctx.createGain();
      shimmerGain.gain.setValueAtTime(0, startTime);
      shimmerGain.gain.linearRampToValueAtTime(0.05, startTime + 3);
      shimmerGain.gain.setValueAtTime(0.05, endTime - 3);
      shimmerGain.gain.linearRampToValueAtTime(0, endTime);

      osc.connect(shimmerGain);
      shimmerGain.connect(dryGain);
      shimmerGain.connect(wetSend);
      osc.start(startTime);
      osc.stop(endTime);
    }

    // --- Sub bass layer: sine at root note / 2 ---
    for (let ci = 0; ci < CHORD_PROGRESSION.length; ci++) {
      const chord = CHORD_PROGRESSION[ci];
      const startTime = ci * CHORD_DURATION;
      const endTime = startTime + CHORD_DURATION;

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(chord[0] / 2, startTime);

      const bassGain = ctx.createGain();
      bassGain.gain.setValueAtTime(0, startTime);
      bassGain.gain.linearRampToValueAtTime(0.1, startTime + 2);
      bassGain.gain.setValueAtTime(0.1, endTime - 2);
      bassGain.gain.linearRampToValueAtTime(0, endTime);

      osc.connect(bassGain);
      bassGain.connect(dryGain);
      osc.start(startTime);
      osc.stop(endTime);
    }
  }
}
