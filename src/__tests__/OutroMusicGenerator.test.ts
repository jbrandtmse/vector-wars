/**
 * OutroMusicGenerator tests -- validates procedural outro music generation.
 *
 * Story 5-10: Ending Sequence
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================
// Mock OfflineAudioContext for Web Audio API
// ============================================================

const mockStartRendering = vi.fn();

globalThis.OfflineAudioContext = vi.fn().mockImplementation(
  function MockOfflineAudioContext(channels: number, length: number, sampleRate: number) {
    const buffer = {
      length,
      sampleRate,
      duration: length / sampleRate,
      numberOfChannels: channels,
      getChannelData: vi.fn().mockReturnValue(new Float32Array(length)),
      copyFromChannel: vi.fn(),
      copyToChannel: vi.fn(),
    } as unknown as AudioBuffer;

    mockStartRendering.mockResolvedValue(buffer);

    return {
      sampleRate,
      length,
      destination: {},
      createOscillator: vi.fn().mockReturnValue({
        type: 'sine',
        frequency: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      }),
      createGain: vi.fn().mockReturnValue({
        gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        connect: vi.fn(),
      }),
      createDelay: vi.fn().mockReturnValue({
        delayTime: { setValueAtTime: vi.fn() },
        connect: vi.fn(),
      }),
      createBiquadFilter: vi.fn().mockReturnValue({
        type: 'lowpass',
        frequency: { setValueAtTime: vi.fn() },
        connect: vi.fn(),
      }),
      createBuffer: vi.fn().mockReturnValue({
        getChannelData: vi.fn().mockReturnValue(new Float32Array(1024)),
      }),
      createBufferSource: vi.fn().mockReturnValue({
        buffer: null,
        loop: false,
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      }),
      startRendering: mockStartRendering,
    };
  }
) as unknown as typeof OfflineAudioContext;

vi.mock('../core/Logger.ts', () => ({
  Logger: {
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

import { OutroMusicGenerator } from '../audio/OutroMusicGenerator.ts';

describe('OutroMusicGenerator', () => {
  let generator: OutroMusicGenerator;

  beforeEach(() => {
    generator = new OutroMusicGenerator();
    mockStartRendering.mockClear();
    vi.mocked(OfflineAudioContext).mockClear();
  });

  describe('hasSound', () => {
    it('returns true for "outro" ID', () => {
      expect(generator.hasSound('outro')).toBe(true);
    });

    it('returns false for unknown IDs', () => {
      expect(generator.hasSound('unknown')).toBe(false);
      expect(generator.hasSound('data_lance_fire')).toBe(false);
    });
  });

  describe('generate', () => {
    it('returns an AudioBuffer for "outro"', async () => {
      const buffer = await generator.generate('outro');
      expect(buffer).not.toBeNull();
      expect(buffer).toBeDefined();
    });

    it('returns null for unknown IDs', async () => {
      const buffer = await generator.generate('unknown');
      expect(buffer).toBeNull();
    });

    it('generates buffer with correct duration (~60s)', async () => {
      const buffer = await generator.generate('outro');
      expect(buffer).not.toBeNull();
      // The mock buffer has duration = length / sampleRate
      // OfflineAudioContext is created with 2 channels, 44100 * 60 length, 44100 sampleRate
      expect(buffer!.duration).toBeCloseTo(60, 0);
    });

    it('creates OfflineAudioContext with stereo (2 channels)', async () => {
      await generator.generate('outro');
      expect(OfflineAudioContext).toHaveBeenCalledWith(2, expect.any(Number), 44100);
    });

    it('caches buffer on subsequent calls', async () => {
      const buffer1 = await generator.generate('outro');
      const buffer2 = await generator.generate('outro');
      expect(buffer1).toBe(buffer2);
      // startRendering should only be called once (second call returns cached)
      expect(mockStartRendering).toHaveBeenCalledTimes(1);
    });

    it('handles OfflineAudioContext rendering failure gracefully', async () => {
      mockStartRendering.mockRejectedValueOnce(new Error('Rendering failed'));
      const buffer = await generator.generate('outro');
      expect(buffer).toBeNull();
    });
  });

  describe('generateAll', () => {
    it('pre-generates the outro buffer', async () => {
      await generator.generateAll();
      expect(mockStartRendering).toHaveBeenCalledTimes(1);
    });

    it('subsequent generate calls return cached buffer after generateAll', async () => {
      await generator.generateAll();
      mockStartRendering.mockClear();

      const buffer = await generator.generate('outro');
      expect(buffer).not.toBeNull();
      // Should not have called startRendering again (cached)
      expect(mockStartRendering).not.toHaveBeenCalled();
    });
  });
});
