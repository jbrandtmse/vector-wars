/**
 * VoiceLineGenerator — Procedural voice-like audio synthesis using Web Audio API.
 *
 * Generates "digital comm channel transmission" audio buffers at runtime via
 * OfflineAudioContext. Each voice line is a tonal pattern that suggests speech
 * through heavy digital processing — robotic, synthesized tones that convey
 * speaker intent through pitch, rhythm, and tonal character.
 *
 * Follows the same pattern as SFXGenerator: SOUND_DEFINITIONS record,
 * generate() with cache, hasSound(), generateAll().
 *
 * Created by: Story 4-9 (Synthesized Handler Voice Lines)
 */

import { Logger } from '../core/Logger.ts';

type VoiceSetup = (ctx: OfflineAudioContext) => void;

interface VoiceDefinition {
  duration: number;
  sampleRate: number;
  setup: VoiceSetup;
}

/** Speaker profile parameters for procedural voice synthesis. */
interface VoiceProfile {
  /** Base oscillator frequency in Hz */
  baseFreq: number;
  /** Oscillator waveform type */
  waveform: OscillatorType;
  /** Frequency drift range in Hz (added to base for variation) */
  freqDrift: number;
  /** Amplitude modulation rate in Hz (tremolo speed) */
  modRate: number;
  /** Amplitude modulation depth (0-1) */
  modDepth: number;
  /** Noise level (0-1) */
  noiseLevel: number;
  /** Noise bandpass center frequency in Hz */
  noiseFreq: number;
  /** Attack time in seconds */
  attack: number;
  /** Release time in seconds */
  release: number;
  /** Sample rate for lo-fi quality */
  sampleRate: number;
}

const HANDLER_PROFILE: VoiceProfile = {
  baseFreq: 180,
  waveform: 'square',
  freqDrift: 40,
  modRate: 8,
  modDepth: 0.3,
  noiseLevel: 0.1,
  noiseFreq: 2000,
  attack: 0.02,
  release: 0.05,
  sampleRate: 11025,
};

const GATEKEEPER_PROFILE: VoiceProfile = {
  baseFreq: 100,
  waveform: 'sawtooth',
  freqDrift: 30,
  modRate: 5,
  modDepth: 0.5,
  noiseLevel: 0.2,
  noiseFreq: 1500,
  attack: 0.01,
  release: 0.1,
  sampleRate: 8000,
};

/** Create a noise buffer for use as a filtered noise source. */
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

/**
 * Create a voice definition from a profile and duration.
 * Uses seeded variation from the ID hash to make each line unique.
 */
function createVoiceDefinition(
  profile: VoiceProfile,
  duration: number,
  idHash: number
): VoiceDefinition {
  // Use hash to create deterministic but unique variation per line
  const freqVariation = (idHash % 7) / 7; // 0-1
  const pitchOffset = profile.freqDrift * (freqVariation - 0.5); // +/- half drift range

  return {
    duration,
    sampleRate: profile.sampleRate,
    setup(ctx: OfflineAudioContext): void {
      const sustain = duration - profile.attack - profile.release;

      // Base oscillator — speech-like tone
      const osc = ctx.createOscillator();
      osc.type = profile.waveform;
      const startFreq = profile.baseFreq + pitchOffset;
      osc.frequency.setValueAtTime(startFreq, 0);
      // Gentle frequency drift during sustain to suggest speech inflection
      const endFreq = startFreq + profile.freqDrift * (((idHash % 3) - 1) * 0.5);
      osc.frequency.linearRampToValueAtTime(
        Math.max(60, endFreq),
        Math.max(0.01, duration - profile.release)
      );

      // Amplitude modulation (tremolo) for "transmission warble"
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(profile.modRate + (idHash % 3), 0);

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(profile.modDepth, 0);

      // Main envelope: attack-sustain-release
      const mainGain = ctx.createGain();
      mainGain.gain.setValueAtTime(0, 0);
      mainGain.gain.linearRampToValueAtTime(0.6, profile.attack);
      if (sustain > 0) {
        mainGain.gain.setValueAtTime(0.6, profile.attack + sustain);
      }
      mainGain.gain.exponentialRampToValueAtTime(
        0.001,
        Math.max(profile.attack + 0.01, duration)
      );

      // LFO modulates main gain
      lfo.connect(lfoGain);
      lfoGain.connect(mainGain.gain);

      osc.connect(mainGain);
      mainGain.connect(ctx.destination);

      osc.start(0);
      osc.stop(duration);
      lfo.start(0);
      lfo.stop(duration);

      // Noise layer — static/interference
      if (profile.noiseLevel > 0) {
        const noiseBuffer = createNoiseBuffer(ctx, duration);
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(profile.noiseFreq, 0);
        noiseFilter.Q.setValueAtTime(3, 0);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0, 0);
        noiseGain.gain.linearRampToValueAtTime(profile.noiseLevel, profile.attack);
        if (sustain > 0) {
          noiseGain.gain.setValueAtTime(profile.noiseLevel, profile.attack + sustain);
        }
        noiseGain.gain.exponentialRampToValueAtTime(
          0.001,
          Math.max(profile.attack + 0.01, duration)
        );

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        noise.start(0);
        noise.stop(duration);
      }
    },
  };
}

/** Simple string hash for deterministic variation per voice line ID. */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash);
}

// ============================================================
// Voice line definitions for all dialogue entries
// ============================================================

// Handler lines — mid-range, calm comm channel
const HANDLER_DEFINITIONS: Record<string, VoiceDefinition> = {
  // handler.json entries
  handler_phase1_start: createVoiceDefinition(HANDLER_PROFILE, 1.5, hashString('handler_phase1_start')),
  handler_first_kill: createVoiceDefinition(HANDLER_PROFILE, 1.0, hashString('handler_first_kill')),
  handler_surface_start: createVoiceDefinition(HANDLER_PROFILE, 1.5, hashString('handler_surface_start')),
  handler_corridor_start: createVoiceDefinition(HANDLER_PROFILE, 2.0, hashString('handler_corridor_start')),
  handler_corridor_encourage: createVoiceDefinition(HANDLER_PROFILE, 0.8, hashString('handler_corridor_encourage')),
  handler_boss_start: createVoiceDefinition(HANDLER_PROFILE, 1.5, hashString('handler_boss_start')),
  handler_boss_vulnerable: createVoiceDefinition(HANDLER_PROFILE, 1.0, hashString('handler_boss_vulnerable')),
  handler_level_complete: createVoiceDefinition(HANDLER_PROFILE, 2.0, hashString('handler_level_complete')),
};

// Tutorial lines — same handler profile
const TUTORIAL_DEFINITIONS: Record<string, VoiceDefinition> = {
  tutorial_welcome: createVoiceDefinition(HANDLER_PROFILE, 2.0, hashString('tutorial_welcome')),
  tutorial_movement: createVoiceDefinition(HANDLER_PROFILE, 1.5, hashString('tutorial_movement')),
  tutorial_movement_done: createVoiceDefinition(HANDLER_PROFILE, 1.0, hashString('tutorial_movement_done')),
  tutorial_fire: createVoiceDefinition(HANDLER_PROFILE, 1.5, hashString('tutorial_fire')),
  tutorial_fire_done: createVoiceDefinition(HANDLER_PROFILE, 1.0, hashString('tutorial_fire_done')),
  tutorial_weapons: createVoiceDefinition(HANDLER_PROFILE, 2.0, hashString('tutorial_weapons')),
  tutorial_shields: createVoiceDefinition(HANDLER_PROFILE, 2.0, hashString('tutorial_shields')),
  tutorial_shields_done: createVoiceDefinition(HANDLER_PROFILE, 2.0, hashString('tutorial_shields_done')),
  tutorial_calibration_done: createVoiceDefinition(HANDLER_PROFILE, 1.0, hashString('tutorial_calibration_done')),
  tutorial_alarm: createVoiceDefinition(HANDLER_PROFILE, 1.5, hashString('tutorial_alarm')),
};

// Gatekeeper lines — low, cold AI
const GATEKEEPER_DEFINITIONS: Record<string, VoiceDefinition> = {
  gk_encounter_start: createVoiceDefinition(GATEKEEPER_PROFILE, 1.5, hashString('gk_encounter_start')),
  gk_health_below_75: createVoiceDefinition(GATEKEEPER_PROFILE, 1.5, hashString('gk_health_below_75')),
  gk_vulnerable_1: createVoiceDefinition(GATEKEEPER_PROFILE, 1.0, hashString('gk_vulnerable_1')),
  gk_barrage_phase: createVoiceDefinition(GATEKEEPER_PROFILE, 1.5, hashString('gk_barrage_phase')),
  gk_health_below_50: createVoiceDefinition(GATEKEEPER_PROFILE, 1.0, hashString('gk_health_below_50')),
  gk_sweep_phase: createVoiceDefinition(GATEKEEPER_PROFILE, 1.5, hashString('gk_sweep_phase')),
  gk_health_below_25: createVoiceDefinition(GATEKEEPER_PROFILE, 2.0, hashString('gk_health_below_25')),
  gk_vulnerable_2: createVoiceDefinition(GATEKEEPER_PROFILE, 1.5, hashString('gk_vulnerable_2')),
  gk_defeated: createVoiceDefinition(GATEKEEPER_PROFILE, 2.0, hashString('gk_defeated')),
};

/** Combined definitions for all voice lines. */
const VOICE_DEFINITIONS: Record<string, VoiceDefinition> = {
  ...HANDLER_DEFINITIONS,
  ...TUTORIAL_DEFINITIONS,
  ...GATEKEEPER_DEFINITIONS,
};

export class VoiceLineGenerator {
  private cache: Map<string, AudioBuffer> = new Map();

  /**
   * Generate a voice line by ID. Returns cached buffer if available,
   * otherwise synthesizes via OfflineAudioContext.
   */
  async generate(id: string): Promise<AudioBuffer | null> {
    const cached = this.cache.get(id);
    if (cached) return cached;

    const definition = VOICE_DEFINITIONS[id];
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
      Logger.info('Audio', 'Voice line generated', { id });
      return buffer;
    } catch (error) {
      Logger.warn('Audio', 'Failed to generate voice line', { id, error: String(error) });
      return null;
    }
  }

  /**
   * Pre-generate all registered voice line buffers.
   * Called at init time so buffers are ready before gameplay.
   */
  async generateAll(): Promise<void> {
    const ids = Object.keys(VOICE_DEFINITIONS);
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

    Logger.info('Audio', 'Voice line generation complete', { generated, failed, total: ids.length });
  }

  /** Check if this generator has a definition for the given voice line ID. */
  hasSound(id: string): boolean {
    return id in VOICE_DEFINITIONS;
  }

  /** Get all registered voice line IDs. */
  getSoundIds(): string[] {
    return Object.keys(VOICE_DEFINITIONS);
  }
}
