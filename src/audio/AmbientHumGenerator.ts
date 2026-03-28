/**
 * AmbientHumGenerator — Procedural ambient electronic hum using live Web Audio API.
 *
 * Generates a layered electronic drone that intensifies with gameplay action.
 * Uses live AudioContext (not OfflineAudioContext) because the hum must
 * respond to intensity changes in real time.
 *
 * Layers:
 *   - Base drone: 60Hz sine (electrical mains hum)
 *   - Harmonic: 120Hz sine (first harmonic)
 *   - Upper harmonic: 180Hz triangle (second harmonic, texture)
 *   - High shimmer: 440Hz sawtooth through lowpass (electronic character)
 *
 * Created by: Story 4-7 (Ambient Electronic Hum)
 */

import { Logger } from '../core/Logger.ts';

const INTENSITY_EPSILON = 0.01;
const RAMP_DURATION = 2.0; // seconds for smooth crossfade

interface OscillatorLayer {
  oscillator: OscillatorNode;
  gain: GainNode;
  filter?: BiquadFilterNode;
}

export class AmbientHumGenerator {
  private ctx: AudioContext;
  private outputNode: GainNode;
  private masterGain: GainNode | null = null;
  private layers: OscillatorLayer[] = [];
  private playing = false;
  private currentIntensity = -1; // Force first setIntensity to apply

  constructor(ctx: AudioContext, outputNode: GainNode) {
    this.ctx = ctx;
    this.outputNode = outputNode;
  }

  /**
   * Begin playback. Creates oscillators and connects the audio graph.
   * Idempotent — no-op if already playing.
   */
  start(): void {
    if (this.playing) return;

    try {
      // Master gain node for overall ambient volume
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
      this.masterGain.connect(this.outputNode);

      // Layer 0: Base drone — 60Hz sine
      const baseDrone = this.createLayer('sine', 60);
      baseDrone.gain.gain.setValueAtTime(0.0, this.ctx.currentTime);

      // Layer 1: Harmonic — 120Hz sine
      const harmonic = this.createLayer('sine', 120);
      harmonic.gain.gain.setValueAtTime(0.0, this.ctx.currentTime);

      // Layer 2: Upper harmonic — 180Hz triangle
      const upperHarmonic = this.createLayer('triangle', 180);
      upperHarmonic.gain.gain.setValueAtTime(0.0, this.ctx.currentTime);

      // Layer 3: High shimmer — 440Hz sawtooth through lowpass filter
      const shimmerFilter = this.ctx.createBiquadFilter();
      shimmerFilter.type = 'lowpass';
      shimmerFilter.frequency.setValueAtTime(600, this.ctx.currentTime);
      shimmerFilter.Q.setValueAtTime(1, this.ctx.currentTime);

      const shimmerOsc = this.ctx.createOscillator();
      shimmerOsc.type = 'sawtooth';
      shimmerOsc.frequency.setValueAtTime(440, this.ctx.currentTime);

      const shimmerGain = this.ctx.createGain();
      shimmerGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

      shimmerOsc.connect(shimmerFilter);
      shimmerFilter.connect(shimmerGain);
      shimmerGain.connect(this.masterGain);
      shimmerOsc.start(0);

      this.layers.push(
        baseDrone,
        harmonic,
        upperHarmonic,
        { oscillator: shimmerOsc, gain: shimmerGain, filter: shimmerFilter },
      );

      this.playing = true;
      this.currentIntensity = -1; // Reset to force next setIntensity to apply

      Logger.info('Audio', 'Ambient hum started');
    } catch (error) {
      Logger.warn('Audio', 'Failed to start ambient hum', { error: String(error) });
    }
  }

  /**
   * Stop playback. Disconnects and cleans up all nodes.
   * Idempotent — no-op if not playing.
   */
  stop(): void {
    if (!this.playing) return;

    for (const layer of this.layers) {
      try {
        layer.oscillator.stop();
      } catch {
        // Already stopped
      }
      layer.oscillator.disconnect();
      layer.gain.disconnect();
      if (layer.filter) {
        layer.filter.disconnect();
      }
    }

    if (this.masterGain) {
      this.masterGain.disconnect();
      this.masterGain = null;
    }

    this.layers = [];
    this.playing = false;
    this.currentIntensity = -1;

    Logger.info('Audio', 'Ambient hum stopped');
  }

  /**
   * Adjust hum character based on gameplay intensity.
   * @param level 0.0 (idle) to 1.0 (maximum intensity)
   * Transitions smoothly over 2 seconds. Idempotent for same value.
   */
  setIntensity(level: number): void {
    const clamped = Math.max(0, Math.min(1, level));

    // Skip if same as current (within epsilon)
    if (Math.abs(clamped - this.currentIntensity) < INTENSITY_EPSILON) return;

    this.currentIntensity = clamped;

    if (!this.playing || !this.masterGain || this.layers.length < 4) return;

    const now = this.ctx.currentTime;
    const rampEnd = now + RAMP_DURATION;

    // Set master gain to 1.0 so individual layers control volume
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(1.0, rampEnd);

    // Layer 0: Base drone — 0.15 * level (minimum 0.02 when level > 0)
    const baseGain = clamped > 0 ? Math.max(0.02, 0.15 * clamped) : 0;
    this.layers[0].gain.gain.setValueAtTime(this.layers[0].gain.gain.value, now);
    this.layers[0].gain.gain.linearRampToValueAtTime(baseGain, rampEnd);

    // Layer 1: Harmonic — 0.08 * level
    const harmonicGain = 0.08 * clamped;
    this.layers[1].gain.gain.setValueAtTime(this.layers[1].gain.gain.value, now);
    this.layers[1].gain.gain.linearRampToValueAtTime(harmonicGain, rampEnd);

    // Layer 2: Upper harmonic — 0.04 * level
    const upperGain = 0.04 * clamped;
    this.layers[2].gain.gain.setValueAtTime(this.layers[2].gain.gain.value, now);
    this.layers[2].gain.gain.linearRampToValueAtTime(upperGain, rampEnd);

    // Layer 3: Shimmer — fades in above 0.4 intensity
    const shimmerGain = clamped > 0.4 ? 0.02 * ((clamped - 0.4) / 0.6) : 0;
    this.layers[3].gain.gain.setValueAtTime(this.layers[3].gain.gain.value, now);
    this.layers[3].gain.gain.linearRampToValueAtTime(shimmerGain, rampEnd);

    // Detuning at high intensity (>= 0.8) for tension
    if (clamped >= 0.8) {
      const detuneAmount = 2 * ((clamped - 0.8) / 0.2); // 0-2 Hz
      this.layers[1].oscillator.frequency.setValueAtTime(
        this.layers[1].oscillator.frequency.value,
        now
      );
      this.layers[1].oscillator.frequency.linearRampToValueAtTime(120 + detuneAmount, rampEnd);
      this.layers[2].oscillator.frequency.setValueAtTime(
        this.layers[2].oscillator.frequency.value,
        now
      );
      this.layers[2].oscillator.frequency.linearRampToValueAtTime(180 - detuneAmount, rampEnd);
    } else {
      // Reset detuning
      this.layers[1].oscillator.frequency.setValueAtTime(
        this.layers[1].oscillator.frequency.value,
        now
      );
      this.layers[1].oscillator.frequency.linearRampToValueAtTime(120, rampEnd);
      this.layers[2].oscillator.frequency.setValueAtTime(
        this.layers[2].oscillator.frequency.value,
        now
      );
      this.layers[2].oscillator.frequency.linearRampToValueAtTime(180, rampEnd);
    }

    Logger.debug('Audio', 'Ambient hum intensity changed', { intensity: clamped });
  }

  /**
   * Set the master gain volume (0.0-1.0).
   * This is controlled by AudioManager's ambient channel volume.
   */
  setVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(clamped, this.ctx.currentTime);
    }
  }

  /**
   * Stop playback and release all resources.
   */
  dispose(): void {
    this.stop();
    Logger.info('Audio', 'Ambient hum generator disposed');
  }

  /**
   * Returns current playback state.
   */
  isPlaying(): boolean {
    return this.playing;
  }

  /**
   * Create an oscillator layer connected to the master gain.
   */
  private createLayer(type: OscillatorType, frequency: number): OscillatorLayer {
    const oscillator = this.ctx.createOscillator();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    oscillator.connect(gain);
    gain.connect(this.masterGain!);
    oscillator.start(0);

    return { oscillator, gain };
  }
}
