/**
 * HandlerVoiceEscalation tests — validates per-level voice profiles,
 * new dialogue entries, palette-aware speaker configs, and level tracking.
 *
 * Story 5-8: Handler Voice Escalation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventBus } from '../core/EventBus.ts';
import type { GameEvents } from '../core/GameEvents.ts';

// Mock the eventBus module so DialogueManager uses our test bus
let testBus: EventBus<GameEvents>;

vi.mock('../core/GameEvents.ts', () => {
  const { EventBus: EB } = require('../core/EventBus.ts');
  const bus = new EB();
  testBus = bus;
  return {
    eventBus: bus,
  };
});

vi.mock('../core/Logger.ts', () => ({
  Logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const mockPlayVoice = vi.fn();
vi.mock('../audio/AudioManager.ts', () => ({
  audioManager: {
    playVoice: mockPlayVoice,
  },
}));

// Mock OfflineAudioContext for VoiceLineGenerator tests
let startRenderingCallCount = 0;
const originalOfflineAudioContext = globalThis.OfflineAudioContext;

function setupOfflineAudioContextMock() {
  startRenderingCallCount = 0;

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
          return Promise.resolve(renderResult);
        }),
      };
    }
  ) as unknown as typeof OfflineAudioContext;
}

describe('Handler Voice Escalation - VoiceLineGenerator (Story 5-8)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupOfflineAudioContextMock();
  });

  afterEach(() => {
    if (originalOfflineAudioContext) {
      globalThis.OfflineAudioContext = originalOfflineAudioContext;
    }
  });

  it('should have voice definitions for new Level 2 handler lines', async () => {
    const { VoiceLineGenerator } = await import('../audio/VoiceLineGenerator.ts');
    const generator = new VoiceLineGenerator();

    expect(generator.hasSound('handler_l2_first_kill')).toBe(true);
    expect(generator.hasSound('handler_l2_boss_vulnerable')).toBe(true);
  });

  it('should have voice definitions for new Level 3 handler lines', async () => {
    const { VoiceLineGenerator } = await import('../audio/VoiceLineGenerator.ts');
    const generator = new VoiceLineGenerator();

    expect(generator.hasSound('handler_l3_first_kill')).toBe(true);
    expect(generator.hasSound('handler_l3_boss_vulnerable')).toBe(true);
  });

  it('should generate AudioBuffer for new Level 2 handler lines', async () => {
    const { VoiceLineGenerator } = await import('../audio/VoiceLineGenerator.ts');
    const generator = new VoiceLineGenerator();

    const buffer1 = await generator.generate('handler_l2_first_kill');
    expect(buffer1).not.toBeNull();

    const buffer2 = await generator.generate('handler_l2_boss_vulnerable');
    expect(buffer2).not.toBeNull();
  });

  it('should generate AudioBuffer for new Level 3 handler lines', async () => {
    const { VoiceLineGenerator } = await import('../audio/VoiceLineGenerator.ts');
    const generator = new VoiceLineGenerator();

    const buffer1 = await generator.generate('handler_l3_first_kill');
    expect(buffer1).not.toBeNull();

    const buffer2 = await generator.generate('handler_l3_boss_vulnerable');
    expect(buffer2).not.toBeNull();
  });

  it('total voice line count should be 59 (52 original + 4 escalation + 3 briefing)', async () => {
    const { VoiceLineGenerator } = await import('../audio/VoiceLineGenerator.ts');
    const generator = new VoiceLineGenerator();

    const ids = generator.getSoundIds();
    expect(ids.length).toBe(59);
  });

  it('tutorial lines should still exist and be generateable', async () => {
    const { VoiceLineGenerator } = await import('../audio/VoiceLineGenerator.ts');
    const generator = new VoiceLineGenerator();

    expect(generator.hasSound('tutorial_welcome')).toBe(true);
    expect(generator.hasSound('tutorial_alarm')).toBe(true);
    const buffer = await generator.generate('tutorial_welcome');
    expect(buffer).not.toBeNull();
  });

  it('Level 1 handler lines should still be generateable', async () => {
    const { VoiceLineGenerator } = await import('../audio/VoiceLineGenerator.ts');
    const generator = new VoiceLineGenerator();

    expect(generator.hasSound('handler_phase1_start')).toBe(true);
    expect(generator.hasSound('handler_level_complete')).toBe(true);
    const buffer = await generator.generate('handler_phase1_start');
    expect(buffer).not.toBeNull();
  });

  it('all existing Level 2 handler lines should still be generateable', async () => {
    const { VoiceLineGenerator } = await import('../audio/VoiceLineGenerator.ts');
    const generator = new VoiceLineGenerator();

    const l2Lines = [
      'handler_l2_dogfight_start',
      'handler_l2_surface_start',
      'handler_l2_corridor_start',
      'handler_l2_boss_start',
      'handler_l2_level_complete',
    ];

    for (const id of l2Lines) {
      expect(generator.hasSound(id)).toBe(true);
      const buffer = await generator.generate(id);
      expect(buffer).not.toBeNull();
    }
  });

  it('all existing Level 3 handler lines should still be generateable', async () => {
    const { VoiceLineGenerator } = await import('../audio/VoiceLineGenerator.ts');
    const generator = new VoiceLineGenerator();

    const l3Lines = [
      'handler_l3_dogfight_start',
      'handler_l3_surface_start',
      'handler_l3_corridor_start',
      'handler_l3_boss_start',
      'handler_l3_level_complete',
    ];

    for (const id of l3Lines) {
      expect(generator.hasSound(id)).toBe(true);
      const buffer = await generator.generate(id);
      expect(buffer).not.toBeNull();
    }
  });
});

describe('Handler Voice Escalation - DialogueManager (Story 5-8)', () => {
  let DialogueManager: typeof import('../narrative/DialogueManager.ts').DialogueManager;
  let mockOverlay: {
    show: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    hide: ReturnType<typeof vi.fn>;
    isVisible: ReturnType<typeof vi.fn>;
    dispose: ReturnType<typeof vi.fn>;
  };
  let manager: InstanceType<typeof DialogueManager>;

  beforeEach(async () => {
    vi.resetModules();
    mockPlayVoice.mockClear();

    const mod = await import('../narrative/DialogueManager.ts');
    DialogueManager = mod.DialogueManager;

    mockOverlay = {
      show: vi.fn(),
      update: vi.fn(),
      hide: vi.fn(),
      isVisible: vi.fn().mockReturnValue(false),
      dispose: vi.fn(),
    };

    const gameEvents = await import('../core/GameEvents.ts');
    testBus = gameEvents.eventBus as unknown as EventBus<GameEvents>;

    manager = new DialogueManager(mockOverlay as never);
  });

  afterEach(() => {
    manager.dispose();
  });

  it('speaker configs should not pass hardcoded color (palette-aware)', () => {
    manager.loadScript({
      entries: [
        { id: 'test', trigger: 'testTrig', speaker: 'handler', text: 'Hello', priority: 1 },
      ],
    });

    testBus.emit('dialogueTrigger', { triggerId: 'testTrig' });
    manager.update(0);

    // Color should be undefined (palette fallback), not hardcoded '#00ff41'
    expect(mockOverlay.show).toHaveBeenCalledWith('HANDLER', 'Hello', undefined);
  });

  it('all speaker configs should use palette-aware colors (no hardcoded green)', () => {
    const speakers = ['handler', 'gatekeeper', 'avenger', 'coreIntelligence'] as const;

    for (const speaker of speakers) {
      mockOverlay.show.mockClear();

      manager.loadScript({
        entries: [
          { id: `test_${speaker}`, trigger: `trig_${speaker}`, speaker, text: `${speaker} text`, priority: 1, duration: 0.1 },
        ],
      });

      testBus.emit('dialogueTrigger', { triggerId: `trig_${speaker}` });
      manager.update(0);

      // Third argument should be undefined (palette-aware)
      const showCall = mockOverlay.show.mock.calls[0];
      expect(showCall[2]).toBeUndefined();

      // Let entry expire
      manager.update(0.2);
    }
  });

  it('should track current level from phaseStart events', () => {
    // Initial level should be 1
    expect(manager.getCurrentLevel()).toBe(1);

    // Phase start for level 2
    testBus.emit('phaseStart', { phase: 'dogfight' as never, level: 2 });
    expect(manager.getCurrentLevel()).toBe(2);

    // Phase start for level 3
    testBus.emit('phaseStart', { phase: 'dogfight' as never, level: 3 });
    expect(manager.getCurrentLevel()).toBe(3);
  });

  it('firstEnemyDestroyed should fire generic trigger for Level 1', () => {
    manager.loadScript({
      entries: [
        { id: 'generic_kill', trigger: 'firstEnemyDestroyed', speaker: 'handler', text: 'Good kill.', priority: 1, duration: 3 },
      ],
    });

    // Level 1 (default)
    const mockEnemy = {} as never;
    testBus.emit('enemyDestroyed', { enemy: mockEnemy, position: { x: 0, y: 0, z: 0 } });
    manager.update(0);

    expect(mockOverlay.show).toHaveBeenCalledWith('HANDLER', 'Good kill.', undefined);
  });

  it('firstEnemyDestroyed should fire both generic and level-specific triggers for Level 2', () => {
    manager.loadScript({
      entries: [
        { id: 'generic_kill', trigger: 'firstEnemyDestroyed', speaker: 'handler', text: 'Good kill.', priority: 1, duration: 1 },
        { id: 'l2_kill', trigger: 'firstEnemyDestroyed:2', speaker: 'handler', text: 'Faster now.', priority: 1, duration: 1 },
      ],
    });

    // Set level to 2
    testBus.emit('phaseStart', { phase: 'dogfight' as never, level: 2 });

    const mockEnemy = {} as never;
    testBus.emit('enemyDestroyed', { enemy: mockEnemy, position: { x: 0, y: 0, z: 0 } });
    manager.update(0);

    // Both triggers should have been fired, first one shown (FIFO for same priority)
    expect(mockOverlay.show).toHaveBeenCalledWith('HANDLER', 'Good kill.', undefined);

    // Let first expire, second should show
    manager.update(1.1);
    manager.update(0);
    expect(mockOverlay.show).toHaveBeenCalledWith('HANDLER', 'Faster now.', undefined);
  });

  it('firstEnemyDestroyed should fire both generic and level-specific triggers for Level 3', () => {
    manager.loadScript({
      entries: [
        { id: 'generic_kill', trigger: 'firstEnemyDestroyed', speaker: 'handler', text: 'Good kill.', priority: 1, duration: 1 },
        { id: 'l3_kill', trigger: 'firstEnemyDestroyed:3', speaker: 'handler', text: 'Keep firing!', priority: 1, duration: 1 },
      ],
    });

    // Set level to 3
    testBus.emit('phaseStart', { phase: 'dogfight' as never, level: 3 });

    const mockEnemy = {} as never;
    testBus.emit('enemyDestroyed', { enemy: mockEnemy, position: { x: 0, y: 0, z: 0 } });
    manager.update(0);

    expect(mockOverlay.show).toHaveBeenCalledTimes(1);

    // Let first expire, second should show
    manager.update(1.1);
    manager.update(0);
    expect(mockOverlay.show).toHaveBeenCalledTimes(2);
  });

  it('bossVulnerable should fire both generic and level-specific triggers for Level 2', () => {
    manager.loadScript({
      entries: [
        { id: 'generic_vuln', trigger: 'bossVulnerable', speaker: 'handler', text: 'Hit it!', priority: 2, duration: 1 },
        { id: 'l2_vuln', trigger: 'bossVulnerable:2', speaker: 'handler', text: 'Now! Everything!', priority: 2, duration: 1 },
      ],
    });

    // Set level to 2
    testBus.emit('phaseStart', { phase: 'boss' as never, level: 2 });

    testBus.emit('bossVulnerable', { vulnerable: true });
    manager.update(0);

    // Both triggers fired, first shown
    expect(mockOverlay.show).toHaveBeenCalledWith('HANDLER', 'Hit it!', undefined);

    // Let first expire
    manager.update(1.1);
    manager.update(0);
    expect(mockOverlay.show).toHaveBeenCalledWith('HANDLER', 'Now! Everything!', undefined);
  });

  it('bossVulnerable should NOT fire level-specific trigger for Level 1', () => {
    manager.loadScript({
      entries: [
        { id: 'generic_vuln', trigger: 'bossVulnerable', speaker: 'handler', text: 'Hit it!', priority: 2, duration: 1 },
        { id: 'l2_vuln', trigger: 'bossVulnerable:2', speaker: 'handler', text: 'Level 2 only', priority: 2, duration: 1 },
      ],
    });

    // Level 1 (default)
    testBus.emit('bossVulnerable', { vulnerable: true });
    manager.update(0);

    // Only generic trigger should fire
    expect(mockOverlay.show).toHaveBeenCalledTimes(1);
    expect(mockOverlay.show).toHaveBeenCalledWith('HANDLER', 'Hit it!', undefined);

    // Let first expire, no second should appear
    manager.update(1.1);
    manager.update(0);
    expect(mockOverlay.show).toHaveBeenCalledTimes(1);
  });
});

describe('Handler Voice Escalation - handler.json validation (Story 5-8)', () => {
  it('handler.json should contain the new Level 2 first kill entry', async () => {
    const response = await import('../../assets/dialogue/handler.json');
    const entries = response.default?.entries ?? response.entries;

    const l2FirstKill = entries.find((e: { id: string }) => e.id === 'handler_l2_first_kill');
    expect(l2FirstKill).toBeDefined();
    expect(l2FirstKill.trigger).toBe('firstEnemyDestroyed:2');
    expect(l2FirstKill.speaker).toBe('handler');
    expect(l2FirstKill.audio).toBe('handler_l2_first_kill');
  });

  it('handler.json should contain the new Level 2 boss vulnerable entry', async () => {
    const response = await import('../../assets/dialogue/handler.json');
    const entries = response.default?.entries ?? response.entries;

    const l2BossVuln = entries.find((e: { id: string }) => e.id === 'handler_l2_boss_vulnerable');
    expect(l2BossVuln).toBeDefined();
    expect(l2BossVuln.trigger).toBe('bossVulnerable:2');
    expect(l2BossVuln.speaker).toBe('handler');
    expect(l2BossVuln.audio).toBe('handler_l2_boss_vulnerable');
  });

  it('handler.json should contain the new Level 3 first kill entry', async () => {
    const response = await import('../../assets/dialogue/handler.json');
    const entries = response.default?.entries ?? response.entries;

    const l3FirstKill = entries.find((e: { id: string }) => e.id === 'handler_l3_first_kill');
    expect(l3FirstKill).toBeDefined();
    expect(l3FirstKill.trigger).toBe('firstEnemyDestroyed:3');
    expect(l3FirstKill.speaker).toBe('handler');
    expect(l3FirstKill.audio).toBe('handler_l3_first_kill');
  });

  it('handler.json should contain the new Level 3 boss vulnerable entry', async () => {
    const response = await import('../../assets/dialogue/handler.json');
    const entries = response.default?.entries ?? response.entries;

    const l3BossVuln = entries.find((e: { id: string }) => e.id === 'handler_l3_boss_vulnerable');
    expect(l3BossVuln).toBeDefined();
    expect(l3BossVuln.trigger).toBe('bossVulnerable:3');
    expect(l3BossVuln.speaker).toBe('handler');
    expect(l3BossVuln.audio).toBe('handler_l3_boss_vulnerable');
  });

  it('existing handler.json entries should not be modified', async () => {
    const response = await import('../../assets/dialogue/handler.json');
    const entries = response.default?.entries ?? response.entries;

    // Check a few original entries still have their original text
    const phase1Start = entries.find((e: { id: string }) => e.id === 'handler_phase1_start');
    expect(phase1Start).toBeDefined();
    expect(phase1Start.text).toBe("Cipher, you're clear of the perimeter. Stay sharp.");

    const firstKill = entries.find((e: { id: string }) => e.id === 'handler_first_kill');
    expect(firstKill).toBeDefined();
    expect(firstKill.text).toBe('Good kill. Keep moving.');
  });
});
