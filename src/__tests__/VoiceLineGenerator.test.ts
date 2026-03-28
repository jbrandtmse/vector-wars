/**
 * VoiceLineGenerator tests — validates procedural voice line synthesis.
 *
 * Story 4-9: Synthesized Handler Voice Lines
 */

import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';

vi.mock('../core/Logger.ts', () => ({
  Logger: {
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

import { VoiceLineGenerator } from '../audio/VoiceLineGenerator.ts';
import { Logger } from '../core/Logger.ts';

// Store reference to track startRendering calls
let startRenderingCallCount = 0;
const originalOfflineAudioContext = globalThis.OfflineAudioContext;

function setupOfflineAudioContextMock(shouldFail = false) {
  startRenderingCallCount = 0;

  // Create a proper AudioBuffer mock result
  const createRenderResult = (sampleRate: number, duration: number) => {
    const length = Math.floor(sampleRate * duration);
    return {
      length,
      sampleRate,
      duration,
      numberOfChannels: 1,
      getChannelData: vi.fn().mockReturnValue(new Float32Array(length)),
      copyFromChannel: vi.fn(),
      copyToChannel: vi.fn(),
    } as unknown as AudioBuffer;
  };

  globalThis.OfflineAudioContext = vi.fn().mockImplementation(
    function MockOfflineAudioContext(_channels: number, length: number, sampleRate: number) {
      const renderResult = createRenderResult(sampleRate, length / sampleRate);

      return {
        sampleRate,
        length,
        destination: {},
        createOscillator: vi.fn().mockReturnValue({
          type: 'sine',
          frequency: {
            setValueAtTime: vi.fn(),
            linearRampToValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
        }),
        createGain: vi.fn().mockReturnValue({
          gain: {
            value: 1,
            setValueAtTime: vi.fn(),
            linearRampToValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
          connect: vi.fn(),
        }),
        createBufferSource: vi.fn().mockReturnValue({
          buffer: null,
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
        }),
        createBiquadFilter: vi.fn().mockReturnValue({
          type: 'lowpass',
          frequency: {
            setValueAtTime: vi.fn(),
            linearRampToValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
          Q: { setValueAtTime: vi.fn() },
          connect: vi.fn(),
        }),
        createBuffer: vi.fn().mockImplementation((_channels: number, len: number, sr: number) => ({
          length: len,
          sampleRate: sr,
          numberOfChannels: 1,
          getChannelData: vi.fn().mockReturnValue(new Float32Array(len)),
        })),
        startRendering: vi.fn().mockImplementation(() => {
          startRenderingCallCount++;
          if (shouldFail && startRenderingCallCount === 1) {
            return Promise.reject(new Error('Render failed'));
          }
          return Promise.resolve(renderResult);
        }),
      };
    }
  ) as unknown as typeof OfflineAudioContext;
}

beforeEach(() => {
  vi.clearAllMocks();
  setupOfflineAudioContextMock();
});

afterAll(() => {
  if (originalOfflineAudioContext) {
    globalThis.OfflineAudioContext = originalOfflineAudioContext;
  }
});

describe('VoiceLineGenerator (Story 4-9)', () => {
  let generator: VoiceLineGenerator;

  beforeEach(() => {
    generator = new VoiceLineGenerator();
  });

  describe('hasSound', () => {
    it('should return true for known handler voice line IDs', () => {
      expect(generator.hasSound('handler_phase1_start')).toBe(true);
      expect(generator.hasSound('handler_first_kill')).toBe(true);
      expect(generator.hasSound('handler_level_complete')).toBe(true);
    });

    it('should return true for known tutorial voice line IDs', () => {
      expect(generator.hasSound('tutorial_welcome')).toBe(true);
      expect(generator.hasSound('tutorial_movement')).toBe(true);
      expect(generator.hasSound('tutorial_alarm')).toBe(true);
    });

    it('should return true for known gatekeeper voice line IDs', () => {
      expect(generator.hasSound('gk_encounter_start')).toBe(true);
      expect(generator.hasSound('gk_health_below_75')).toBe(true);
      expect(generator.hasSound('gk_defeated')).toBe(true);
    });

    it('should return true for known avenger voice line IDs', () => {
      expect(generator.hasSound('av_encounter_start')).toBe(true);
      expect(generator.hasSound('av_health_below_75')).toBe(true);
      expect(generator.hasSound('av_health_below_50')).toBe(true);
      expect(generator.hasSound('av_health_below_25')).toBe(true);
      expect(generator.hasSound('av_rush_phase')).toBe(true);
      expect(generator.hasSound('av_vulnerable')).toBe(true);
      expect(generator.hasSound('av_defeated')).toBe(true);
    });

    it('should return true for known Level 3 handler voice line IDs', () => {
      expect(generator.hasSound('handler_l3_dogfight_start')).toBe(true);
      expect(generator.hasSound('handler_l3_surface_start')).toBe(true);
      expect(generator.hasSound('handler_l3_corridor_start')).toBe(true);
      expect(generator.hasSound('handler_l3_boss_start')).toBe(true);
      expect(generator.hasSound('handler_l3_level_complete')).toBe(true);
    });

    it('should return true for known Core Intelligence voice line IDs', () => {
      expect(generator.hasSound('ci_encounter_start')).toBe(true);
      expect(generator.hasSound('ci_health_below_75')).toBe(true);
      expect(generator.hasSound('ci_health_below_50')).toBe(true);
      expect(generator.hasSound('ci_health_below_25')).toBe(true);
      expect(generator.hasSound('ci_reason_phase')).toBe(true);
      expect(generator.hasSound('ci_surge_phase')).toBe(true);
      expect(generator.hasSound('ci_vulnerable')).toBe(true);
      expect(generator.hasSound('ci_defeated')).toBe(true);
    });

    it('should return false for unknown IDs', () => {
      expect(generator.hasSound('nonexistent')).toBe(false);
      expect(generator.hasSound('data_lance_fire')).toBe(false);
    });
  });

  describe('getSoundIds', () => {
    it('should return all registered voice line IDs', () => {
      const ids = generator.getSoundIds();
      expect(ids).toContain('handler_phase1_start');
      expect(ids).toContain('tutorial_welcome');
      expect(ids).toContain('gk_encounter_start');
      expect(ids).toContain('av_encounter_start');
    });

    it('should include all 39 voice line definitions', () => {
      const ids = generator.getSoundIds();
      // 8 handler L1 + 7 handler L2 + 7 handler L3 + 3 briefing + 10 tutorial + 9 gatekeeper + 7 avenger + 8 core intelligence = 59
      expect(ids.length).toBe(59);
    });
  });

  describe('generate', () => {
    it('should generate AudioBuffer for a known handler ID', async () => {
      const buffer = await generator.generate('handler_phase1_start');
      expect(buffer).not.toBeNull();
      expect(Logger.info).toHaveBeenCalledWith('Audio', 'Voice line generated', { id: 'handler_phase1_start' });
    });

    it('should generate AudioBuffer for a known gatekeeper ID', async () => {
      const buffer = await generator.generate('gk_encounter_start');
      expect(buffer).not.toBeNull();
      expect(Logger.info).toHaveBeenCalledWith('Audio', 'Voice line generated', { id: 'gk_encounter_start' });
    });

    it('should generate AudioBuffer for a known tutorial ID', async () => {
      const buffer = await generator.generate('tutorial_welcome');
      expect(buffer).not.toBeNull();
      expect(Logger.info).toHaveBeenCalledWith('Audio', 'Voice line generated', { id: 'tutorial_welcome' });
    });

    it('should return null for unknown ID', async () => {
      const buffer = await generator.generate('nonexistent');
      expect(buffer).toBeNull();
    });

    it('should cache generated buffers', async () => {
      const buffer1 = await generator.generate('handler_phase1_start');
      const buffer2 = await generator.generate('handler_phase1_start');
      expect(buffer1).toBe(buffer2);
      // OfflineAudioContext should only be constructed once (cached on second call)
      expect(startRenderingCallCount).toBe(1);
    });

    it('should handle OfflineAudioContext rendering failure', async () => {
      setupOfflineAudioContextMock(true); // first call will fail

      const buffer = await generator.generate('handler_phase1_start');
      expect(buffer).toBeNull();
      expect(Logger.warn).toHaveBeenCalledWith(
        'Audio',
        'Failed to generate voice line',
        expect.objectContaining({ id: 'handler_phase1_start' })
      );
    });

    it('should create OfflineAudioContext with correct sample rate for handler', async () => {
      await generator.generate('handler_phase1_start');
      // Handler profile uses 11025 Hz sample rate
      expect(globalThis.OfflineAudioContext).toHaveBeenCalledWith(
        1,
        expect.any(Number),
        11025
      );
    });

    it('should create OfflineAudioContext with correct sample rate for gatekeeper', async () => {
      await generator.generate('gk_encounter_start');
      // Gatekeeper profile uses 8000 Hz sample rate
      expect(globalThis.OfflineAudioContext).toHaveBeenCalledWith(
        1,
        expect.any(Number),
        8000
      );
    });
  });

  describe('generateAll', () => {
    it('should generate all voice line buffers', async () => {
      await generator.generateAll();
      expect(Logger.info).toHaveBeenCalledWith(
        'Audio',
        'Voice line generation complete',
        expect.objectContaining({ total: 59 })
      );
    });

    it('should report generation counts', async () => {
      await generator.generateAll();
      expect(Logger.info).toHaveBeenCalledWith(
        'Audio',
        'Voice line generation complete',
        expect.objectContaining({ generated: 59, failed: 0, total: 59 })
      );
    });

    it('should handle partial failures gracefully', async () => {
      setupOfflineAudioContextMock(true); // first call fails

      await generator.generateAll();
      expect(Logger.info).toHaveBeenCalledWith(
        'Audio',
        'Voice line generation complete',
        expect.objectContaining({ failed: 1 })
      );
    });
  });
});
