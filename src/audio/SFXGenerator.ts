/**
 * SFXGenerator — Procedural retro arcade SFX generator using Web Audio API.
 *
 * Generates 8-bit style sound effects at runtime via OfflineAudioContext.
 * Each sound is synthesized using oscillators, noise, filters, and gain
 * envelopes, then cached as an AudioBuffer for reuse by AudioManager.
 *
 * Created by: Story 4-6 (Retro SFX for Weapons and Actions)
 */

import { Logger } from '../core/Logger.ts';

type SoundSetup = (ctx: OfflineAudioContext) => void;

interface SoundDefinition {
  duration: number;
  sampleRate: number;
  setup: SoundSetup;
}

/** Create a noise buffer filled with random samples for use as a noise source. */
function createNoiseBuffer(ctx: OfflineAudioContext, duration: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

const SOUND_DEFINITIONS: Record<string, SoundDefinition> = {
  data_lance_fire: {
    duration: 0.1,
    sampleRate: 44100,
    setup(ctx: OfflineAudioContext): void {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1200, 0);
      osc.frequency.exponentialRampToValueAtTime(200, 0.08);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, 0);
      gain.gain.linearRampToValueAtTime(0.8, 0.001);
      gain.gain.exponentialRampToValueAtTime(0.001, 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(0);
      osc.stop(0.1);
    },
  },

  logic_bomb_fire: {
    duration: 0.25,
    sampleRate: 44100,
    setup(ctx: OfflineAudioContext): void {
      // Onset click
      const click = ctx.createOscillator();
      click.type = 'sine';
      click.frequency.setValueAtTime(800, 0);
      const clickGain = ctx.createGain();
      clickGain.gain.setValueAtTime(0.6, 0);
      clickGain.gain.exponentialRampToValueAtTime(0.001, 0.005);
      click.connect(clickGain);
      clickGain.connect(ctx.destination);
      click.start(0);
      click.stop(0.01);

      // Main body — heavy sawtooth sweep
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, 0);
      osc.frequency.exponentialRampToValueAtTime(80, 0.2);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, 0);
      gain.gain.linearRampToValueAtTime(0.7, 0.005);
      gain.gain.setValueAtTime(0.7, 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(0);
      osc.stop(0.25);
    },
  },

  emp_burst: {
    duration: 0.15,
    sampleRate: 44100,
    setup(ctx: OfflineAudioContext): void {
      const noiseBuffer = createNoiseBuffer(ctx, 0.15);
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2000, 0);
      filter.Q.setValueAtTime(5, 0);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, 0);
      gain.gain.linearRampToValueAtTime(0.9, 0.001);
      gain.gain.exponentialRampToValueAtTime(0.001, 0.1);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(0);
      noise.stop(0.15);
    },
  },

  virus_payload: {
    duration: 0.35,
    sampleRate: 44100,
    setup(ctx: OfflineAudioContext): void {
      // Descending sine sweep
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, 0);
      osc.frequency.exponentialRampToValueAtTime(200, 0.3);

      // Tremolo LFO
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(20, 0);

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(0.3, 0);

      // Main envelope
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, 0);
      gain.gain.linearRampToValueAtTime(0.7, 0.01);
      gain.gain.setValueAtTime(0.7, 0.26);
      gain.gain.exponentialRampToValueAtTime(0.001, 0.34);

      // LFO modulates gain
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(0);
      osc.stop(0.35);
      lfo.start(0);
      lfo.stop(0.35);
    },
  },

  shield_hit: {
    duration: 0.1,
    sampleRate: 44100,
    setup(ctx: OfflineAudioContext): void {
      // Noise burst
      const noiseBuffer = createNoiseBuffer(ctx, 0.1);
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.6, 0);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, 0.05);

      noise.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(0);
      noise.stop(0.1);

      // Low sine pulse
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(100, 0);

      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0.5, 0);
      oscGain.gain.exponentialRampToValueAtTime(0.001, 0.08);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(0);
      osc.stop(0.1);
    },
  },

  enemy_explosion: {
    duration: 0.2,
    sampleRate: 44100,
    setup(ctx: OfflineAudioContext): void {
      const noiseBuffer = createNoiseBuffer(ctx, 0.2);
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(4000, 0);
      filter.frequency.exponentialRampToValueAtTime(200, 0.15);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.8, 0);
      gain.gain.exponentialRampToValueAtTime(0.001, 0.18);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(0);
      noise.stop(0.2);
    },
  },

  boss_destruction: {
    duration: 1.0,
    sampleRate: 44100,
    setup(ctx: OfflineAudioContext): void {
      // Phase 1: Rising tone (0-200ms)
      const rise = ctx.createOscillator();
      rise.type = 'sine';
      rise.frequency.setValueAtTime(200, 0);
      rise.frequency.exponentialRampToValueAtTime(2000, 0.2);

      const riseGain = ctx.createGain();
      riseGain.gain.setValueAtTime(0, 0);
      riseGain.gain.linearRampToValueAtTime(0.7, 0.02);
      riseGain.gain.setValueAtTime(0.7, 0.18);
      riseGain.gain.exponentialRampToValueAtTime(0.001, 0.22);

      rise.connect(riseGain);
      riseGain.connect(ctx.destination);
      rise.start(0);
      rise.stop(0.25);

      // Phase 2: Noise burst (200-500ms)
      const noiseBuffer = createNoiseBuffer(ctx, 0.35);
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(3000, 0.2);
      noiseFilter.frequency.exponentialRampToValueAtTime(500, 0.5);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0, 0);
      noiseGain.gain.setValueAtTime(0, 0.19);
      noiseGain.gain.linearRampToValueAtTime(0.9, 0.2);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, 0.5);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(0.2);
      noise.stop(0.55);

      // Phase 3: Low rumble decay (500-1000ms)
      const rumble = ctx.createOscillator();
      rumble.type = 'sine';
      rumble.frequency.setValueAtTime(80, 0.5);

      const rumbleGain = ctx.createGain();
      rumbleGain.gain.setValueAtTime(0, 0);
      rumbleGain.gain.setValueAtTime(0, 0.49);
      rumbleGain.gain.linearRampToValueAtTime(0.6, 0.5);
      rumbleGain.gain.exponentialRampToValueAtTime(0.001, 0.95);

      rumble.connect(rumbleGain);
      rumbleGain.connect(ctx.destination);
      rumble.start(0.5);
      rumble.stop(1.0);
    },
  },

  corridor_whoosh: {
    duration: 0.5,
    sampleRate: 44100,
    setup(ctx: OfflineAudioContext): void {
      const noiseBuffer = createNoiseBuffer(ctx, 0.5);
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.setValueAtTime(3, 0);
      filter.frequency.setValueAtTime(500, 0);
      filter.frequency.exponentialRampToValueAtTime(2000, 0.2);
      filter.frequency.exponentialRampToValueAtTime(500, 0.4);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, 0);
      gain.gain.linearRampToValueAtTime(0.6, 0.05);
      gain.gain.setValueAtTime(0.6, 0.35);
      gain.gain.exponentialRampToValueAtTime(0.001, 0.48);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(0);
      noise.stop(0.5);
    },
  },
};

export class SFXGenerator {
  private cache: Map<string, AudioBuffer> = new Map();

  /**
   * Generate a sound effect by ID. Returns cached buffer if available,
   * otherwise synthesizes via OfflineAudioContext.
   */
  async generate(id: string): Promise<AudioBuffer | null> {
    const cached = this.cache.get(id);
    if (cached) return cached;

    const definition = SOUND_DEFINITIONS[id];
    if (!definition) {
      return null;
    }

    try {
      const ctx = new OfflineAudioContext(
        1,
        Math.floor(definition.sampleRate * definition.duration),
        definition.sampleRate
      );

      definition.setup(ctx);

      const buffer = await ctx.startRendering();
      this.cache.set(id, buffer);
      Logger.info('Audio', 'SFX generated', { id });
      return buffer;
    } catch (error) {
      Logger.warn('Audio', 'Failed to generate SFX', { id, error: String(error) });
      return null;
    }
  }

  /**
   * Pre-generate all registered sound effects.
   * Called at init time so buffers are ready before gameplay.
   */
  async generateAll(): Promise<void> {
    const ids = Object.keys(SOUND_DEFINITIONS);
    const results = await Promise.allSettled(ids.map((id) => this.generate(id)));

    let generated = 0;
    let failed = 0;
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value !== null) {
        generated++;
      } else {
        failed++;
      }
    }

    Logger.info('Audio', 'SFX generation complete', { generated, failed, total: ids.length });
  }

  /** Check if this generator has a definition for the given sound ID. */
  hasSound(id: string): boolean {
    return id in SOUND_DEFINITIONS;
  }

  /** Get all registered sound IDs. */
  getSoundIds(): string[] {
    return Object.keys(SOUND_DEFINITIONS);
  }
}
