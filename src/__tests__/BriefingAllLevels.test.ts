/**
 * BriefingAllLevels tests — validates multi-level briefing voice-over integration,
 * briefing JSON content, and BriefingData voiceLineId field.
 *
 * Story 5-9: Briefing Screens All Levels
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ============================================================
// Hoisted variables for vi.mock factories
// ============================================================

const { mockPlayVoice, mockShow, mockDispose } = vi.hoisted(() => ({
  mockPlayVoice: vi.fn(),
  mockShow: vi.fn(),
  mockDispose: vi.fn(),
}));

// ============================================================
// Mocks
// ============================================================

vi.mock('../core/Logger.ts', () => ({
  Logger: {
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../audio/AudioManager.ts', () => ({
  audioManager: {
    playVoice: mockPlayVoice,
  },
}));

vi.mock('../ui/screens/BriefingScreen.ts', () => {
  class MockBriefingScreen {
    show = mockShow;
    skip = vi.fn();
    dispose = mockDispose;
  }
  return {
    BriefingScreen: MockBriefingScreen,
  };
});

// Mock OfflineAudioContext for VoiceLineGenerator
globalThis.OfflineAudioContext = vi.fn().mockImplementation(
  function MockOfflineAudioContext(_channels: number, length: number, sampleRate: number) {
    const buffer = {
      length,
      sampleRate,
      duration: length / sampleRate,
      numberOfChannels: 1,
      getChannelData: vi.fn().mockReturnValue(new Float32Array(length)),
      copyFromChannel: vi.fn(),
      copyToChannel: vi.fn(),
    } as unknown as AudioBuffer;

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
      createBiquadFilter: vi.fn().mockReturnValue({
        type: 'bandpass',
        frequency: { setValueAtTime: vi.fn() },
        Q: { setValueAtTime: vi.fn() },
        connect: vi.fn(),
      }),
      createBufferSource: vi.fn().mockReturnValue({
        buffer: null,
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      }),
      createBuffer: vi.fn().mockImplementation((_ch: number, len: number, sr: number) => ({
        length: len,
        sampleRate: sr,
        numberOfChannels: 1,
        getChannelData: vi.fn().mockReturnValue(new Float32Array(len)),
        copyFromChannel: vi.fn(),
        copyToChannel: vi.fn(),
      })),
      startRendering: vi.fn().mockResolvedValue(buffer),
    };
  }
) as unknown as typeof OfflineAudioContext;

// ============================================================
// Imports — after all mocks
// ============================================================

import { VoiceLineGenerator } from '../audio/VoiceLineGenerator.ts';
import { BriefingPhase } from '../state/phases/BriefingPhase.ts';
import type { BriefingData } from '../ui/screens/BriefingScreen.ts';

// ============================================================
// VoiceLineGenerator voice definition tests
// ============================================================

describe('Briefing voice line definitions (Story 5-9)', () => {
  let generator: VoiceLineGenerator;

  beforeEach(() => {
    generator = new VoiceLineGenerator();
  });

  it('should have briefing_l1 voice line definition', () => {
    expect(generator.hasSound('briefing_l1')).toBe(true);
  });

  it('should have briefing_l2 voice line definition', () => {
    expect(generator.hasSound('briefing_l2')).toBe(true);
  });

  it('should have briefing_l3 voice line definition', () => {
    expect(generator.hasSound('briefing_l3')).toBe(true);
  });

  it('should include briefing IDs in getSoundIds()', () => {
    const ids = generator.getSoundIds();
    expect(ids).toContain('briefing_l1');
    expect(ids).toContain('briefing_l2');
    expect(ids).toContain('briefing_l3');
  });

  it('should generate briefing_l1 with handler L1 profile (sampleRate 11025)', async () => {
    await generator.generate('briefing_l1');
    // Handler L1 profile uses 11025 Hz sample rate
    expect(globalThis.OfflineAudioContext).toHaveBeenCalledWith(
      1,
      expect.any(Number),
      11025
    );
  });

  it('should generate briefing_l2 with handler L2 profile (sampleRate 11025)', async () => {
    await generator.generate('briefing_l2');
    expect(globalThis.OfflineAudioContext).toHaveBeenCalledWith(
      1,
      expect.any(Number),
      11025
    );
  });

  it('should generate briefing_l3 with handler L3 profile (sampleRate 11025)', async () => {
    await generator.generate('briefing_l3');
    expect(globalThis.OfflineAudioContext).toHaveBeenCalledWith(
      1,
      expect.any(Number),
      11025
    );
  });

  it('should generate briefing lines with 4.0s duration (44100 samples at 11025)', async () => {
    await generator.generate('briefing_l1');
    // duration 4.0 * sampleRate 11025 = 44100
    expect(globalThis.OfflineAudioContext).toHaveBeenCalledWith(
      1,
      44100,
      11025
    );
  });
});

// ============================================================
// BriefingPhase voice playback tests
// ============================================================

describe('BriefingPhase voice playback (Story 5-9)', () => {
  beforeEach(() => {
    mockShow.mockReset();
    mockDispose.mockReset();
    mockPlayVoice.mockReset();
  });

  it('should call audioManager.playVoice when voiceLineId is present', () => {
    const data: BriefingData = {
      title: 'TEST',
      speaker: 'handler',
      lines: ['Line 1'],
      voiceLineId: 'briefing_l1',
    };

    const phase = new BriefingPhase(data);
    phase.enter();

    expect(mockPlayVoice).toHaveBeenCalledWith('briefing_l1');
  });

  it('should NOT call audioManager.playVoice when voiceLineId is absent', () => {
    const data: BriefingData = {
      title: 'TEST',
      speaker: 'handler',
      lines: ['Line 1'],
    };

    const phase = new BriefingPhase(data);
    phase.enter();

    expect(mockPlayVoice).not.toHaveBeenCalled();
  });

  it('should play correct voice line for Level 2 briefing', () => {
    const data: BriefingData = {
      title: 'MISSION BRIEFING',
      speaker: 'handler',
      lines: ['Level 2 content'],
      voiceLineId: 'briefing_l2',
    };

    const phase = new BriefingPhase(data);
    phase.enter();

    expect(mockPlayVoice).toHaveBeenCalledWith('briefing_l2');
  });

  it('should play correct voice line for Level 3 briefing', () => {
    const data: BriefingData = {
      title: 'MISSION BRIEFING',
      speaker: 'handler',
      lines: ['Level 3 content'],
      voiceLineId: 'briefing_l3',
    };

    const phase = new BriefingPhase(data);
    phase.enter();

    expect(mockPlayVoice).toHaveBeenCalledWith('briefing_l3');
  });
});

// ============================================================
// BriefingData interface tests
// ============================================================

describe('BriefingData interface (Story 5-9)', () => {
  it('should accept BriefingData with voiceLineId field', () => {
    const data: BriefingData = {
      title: 'MISSION BRIEFING',
      speaker: 'handler',
      lines: ['Content'],
      voiceLineId: 'briefing_l1',
    };

    expect(data.voiceLineId).toBe('briefing_l1');
  });

  it('should accept BriefingData without voiceLineId (backward compatible)', () => {
    const data: BriefingData = {
      title: 'MISSION BRIEFING',
      speaker: 'handler',
      lines: ['Content'],
    };

    expect(data.voiceLineId).toBeUndefined();
  });
});

// ============================================================
// Briefing JSON content validation tests
// ============================================================

describe('Briefing JSON content (Story 5-9)', () => {
  const briefingsDir = resolve(__dirname, '../../assets/briefings');

  it('level-1.json should have voiceLineId "briefing_l1"', () => {
    const content = JSON.parse(readFileSync(resolve(briefingsDir, 'level-1.json'), 'utf-8'));
    expect(content.voiceLineId).toBe('briefing_l1');
  });

  it('level-2.json should have voiceLineId "briefing_l2"', () => {
    const content = JSON.parse(readFileSync(resolve(briefingsDir, 'level-2.json'), 'utf-8'));
    expect(content.voiceLineId).toBe('briefing_l2');
  });

  it('level-3.json should have voiceLineId "briefing_l3"', () => {
    const content = JSON.parse(readFileSync(resolve(briefingsDir, 'level-3.json'), 'utf-8'));
    expect(content.voiceLineId).toBe('briefing_l3');
  });

  it('level-2.json should mention The Avenger', () => {
    const content = JSON.parse(readFileSync(resolve(briefingsDir, 'level-2.json'), 'utf-8'));
    const allText = content.lines.join(' ');
    expect(allText).toContain('Avenger');
  });

  it('level-2.json should mention network retaliation or being flagged', () => {
    const content = JSON.parse(readFileSync(resolve(briefingsDir, 'level-2.json'), 'utf-8'));
    const allText = content.lines.join(' ');
    const hasRetaliation = allText.includes('retaliation') || allText.includes('flagged') || allText.includes('knows');
    expect(hasRetaliation).toBe(true);
  });

  it('level-2.json should mention Overseers or coordinated behavior', () => {
    const content = JSON.parse(readFileSync(resolve(briefingsDir, 'level-2.json'), 'utf-8'));
    const allText = content.lines.join(' ');
    const hasCoordination = allText.includes('Overseer') || allText.includes('Coordinated') || allText.includes('formation');
    expect(hasCoordination).toBe(true);
  });

  it('level-3.json should mention point of no return or extraction', () => {
    const content = JSON.parse(readFileSync(resolve(briefingsDir, 'level-3.json'), 'utf-8'));
    const allText = content.lines.join(' ');
    const hasNoReturn = allText.includes('extraction') || allText.includes('no return') || allText.includes('bring you back');
    expect(hasNoReturn).toBe(true);
  });

  it('level-3.json should mention Core Intelligence', () => {
    const content = JSON.parse(readFileSync(resolve(briefingsDir, 'level-3.json'), 'utf-8'));
    const allText = content.lines.join(' ');
    expect(allText).toContain('Core Intelligence');
  });

  it('all briefing files should have required BriefingData fields', () => {
    for (const file of ['level-1.json', 'level-2.json', 'level-3.json']) {
      const content = JSON.parse(readFileSync(resolve(briefingsDir, file), 'utf-8'));
      expect(content).toHaveProperty('title');
      expect(content).toHaveProperty('speaker');
      expect(content).toHaveProperty('lines');
      expect(content).toHaveProperty('voiceLineId');
      expect(Array.isArray(content.lines)).toBe(true);
      expect(content.lines.length).toBeGreaterThan(0);
    }
  });

  it('all briefing files should have speaker "handler"', () => {
    for (const file of ['level-1.json', 'level-2.json', 'level-3.json']) {
      const content = JSON.parse(readFileSync(resolve(briefingsDir, file), 'utf-8'));
      expect(content.speaker).toBe('handler');
    }
  });
});
