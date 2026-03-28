/**
 * SFXGenerator tests — validates procedural retro SFX generation.
 *
 * Story 4-6: Retro SFX for Weapons and Actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock AudioParam with scheduling methods
function createMockAudioParam(defaultValue = 0): {
  value: number;
  setValueAtTime: ReturnType<typeof vi.fn>;
  linearRampToValueAtTime: ReturnType<typeof vi.fn>;
  exponentialRampToValueAtTime: ReturnType<typeof vi.fn>;
} {
  return {
    value: defaultValue,
    setValueAtTime: vi.fn().mockReturnThis(),
    linearRampToValueAtTime: vi.fn().mockReturnThis(),
    exponentialRampToValueAtTime: vi.fn().mockReturnThis(),
  };
}

// Mock AudioBuffer
function createMockAudioBuffer(): AudioBuffer {
  return {
    length: 4410,
    duration: 0.1,
    sampleRate: 44100,
    numberOfChannels: 1,
    getChannelData: vi.fn().mockReturnValue(new Float32Array(4410)),
    copyFromChannel: vi.fn(),
    copyToChannel: vi.fn(),
  } as unknown as AudioBuffer;
}

// Mock OfflineAudioContext
const mockRenderedBuffer = createMockAudioBuffer();
let mockStartRendering: ReturnType<typeof vi.fn>;

class MockOfflineAudioContext {
  sampleRate: number;
  destination = {};

  constructor(_channels: number, _length: number, sampleRate: number) {
    this.sampleRate = sampleRate;
  }

  createOscillator() {
    return {
      type: 'sine' as string,
      frequency: createMockAudioParam(440),
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
  }

  createGain() {
    return {
      gain: createMockAudioParam(1),
      connect: vi.fn(),
    };
  }

  createBiquadFilter() {
    return {
      type: 'lowpass' as string,
      frequency: createMockAudioParam(350),
      Q: createMockAudioParam(1),
      connect: vi.fn(),
    };
  }

  createBufferSource() {
    return {
      buffer: null as AudioBuffer | null,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
  }

  createBuffer(channels: number, length: number, sampleRate: number): AudioBuffer {
    return {
      length,
      duration: length / sampleRate,
      sampleRate,
      numberOfChannels: channels,
      getChannelData: vi.fn().mockReturnValue(new Float32Array(length)),
      copyFromChannel: vi.fn(),
      copyToChannel: vi.fn(),
    } as unknown as AudioBuffer;
  }

  startRendering(): Promise<AudioBuffer> {
    return mockStartRendering();
  }
}

// Install mock globally before importing SFXGenerator
vi.stubGlobal('OfflineAudioContext', MockOfflineAudioContext);

// Mock Logger
vi.mock('../core/Logger.ts', () => ({
  Logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Import after mocks are set up
const { SFXGenerator } = await import('../audio/SFXGenerator.ts');

describe('SFXGenerator', () => {
  let generator: InstanceType<typeof SFXGenerator>;

  beforeEach(() => {
    generator = new SFXGenerator();
    mockStartRendering = vi.fn().mockResolvedValue(mockRenderedBuffer);
  });

  describe('generate', () => {
    const EXPECTED_SOUND_IDS = [
      'data_lance_fire',
      'logic_bomb_fire',
      'emp_burst',
      'virus_payload',
      'shield_hit',
      'enemy_explosion',
      'boss_destruction',
      'corridor_whoosh',
    ];

    it.each(EXPECTED_SOUND_IDS)('should generate buffer for %s', async (id) => {
      const buffer = await generator.generate(id);
      expect(buffer).toBe(mockRenderedBuffer);
      expect(mockStartRendering).toHaveBeenCalledOnce();
    });

    it('should return null for unknown sound ID', async () => {
      const buffer = await generator.generate('nonexistent_sound');
      expect(buffer).toBeNull();
      expect(mockStartRendering).not.toHaveBeenCalled();
    });

    it('should cache buffer on second call', async () => {
      const buffer1 = await generator.generate('data_lance_fire');
      const buffer2 = await generator.generate('data_lance_fire');
      expect(buffer1).toBe(buffer2);
      expect(mockStartRendering).toHaveBeenCalledTimes(1);
    });

    it('should return null and log warning on render failure', async () => {
      mockStartRendering = vi.fn().mockRejectedValue(new Error('render failed'));
      const { Logger } = await import('../core/Logger.ts');

      const buffer = await generator.generate('data_lance_fire');
      expect(buffer).toBeNull();
      expect(Logger.warn).toHaveBeenCalledWith(
        'Audio',
        'Failed to generate SFX',
        expect.objectContaining({ id: 'data_lance_fire' })
      );
    });
  });

  describe('generateAll', () => {
    it('should generate all 8 sound effects', async () => {
      await generator.generateAll();
      // 8 sounds means 8 calls to startRendering
      expect(mockStartRendering).toHaveBeenCalledTimes(8);
    });

    it('should cache all generated sounds', async () => {
      await generator.generateAll();
      // Reset mock to verify no new renders happen
      mockStartRendering.mockClear();

      // All subsequent generates should come from cache
      const buffer = await generator.generate('data_lance_fire');
      expect(buffer).toBe(mockRenderedBuffer);
      expect(mockStartRendering).not.toHaveBeenCalled();
    });
  });

  describe('hasSound', () => {
    it('should return true for known sound IDs', () => {
      expect(generator.hasSound('data_lance_fire')).toBe(true);
      expect(generator.hasSound('boss_destruction')).toBe(true);
    });

    it('should return false for unknown sound IDs', () => {
      expect(generator.hasSound('nonexistent')).toBe(false);
    });
  });

  describe('getSoundIds', () => {
    it('should return all 8 sound IDs', () => {
      const ids = generator.getSoundIds();
      expect(ids).toHaveLength(8);
      expect(ids).toContain('data_lance_fire');
      expect(ids).toContain('logic_bomb_fire');
      expect(ids).toContain('emp_burst');
      expect(ids).toContain('virus_payload');
      expect(ids).toContain('shield_hit');
      expect(ids).toContain('enemy_explosion');
      expect(ids).toContain('boss_destruction');
      expect(ids).toContain('corridor_whoosh');
    });
  });
});
