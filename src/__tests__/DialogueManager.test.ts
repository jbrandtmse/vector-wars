import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventBus } from '../core/EventBus.ts';
import type { GameEvents } from '../core/GameEvents.ts';

// Mock the eventBus module so DialogueManager uses our test bus
let testBus: EventBus<GameEvents>;

vi.mock('../core/GameEvents.ts', () => {
  // Create a fresh EventBus for each import
  const { EventBus: EB } = require('../core/EventBus.ts');
  const bus = new EB();
  testBus = bus;
  return {
    eventBus: bus,
    // Re-export type interfaces (not needed at runtime but keeps TS happy)
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

describe('DialogueManager (Story 4-1)', () => {
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

    // Re-import to get fresh module state
    const mod = await import('../narrative/DialogueManager.ts');
    DialogueManager = mod.DialogueManager;

    mockOverlay = {
      show: vi.fn(),
      update: vi.fn(),
      hide: vi.fn(),
      isVisible: vi.fn().mockReturnValue(false),
      dispose: vi.fn(),
    };

    // Access the current testBus from the mock
    const gameEvents = await import('../core/GameEvents.ts');
    testBus = gameEvents.eventBus as unknown as EventBus<GameEvents>;

    manager = new DialogueManager(mockOverlay as never);
  });

  afterEach(() => {
    manager.dispose();
  });

  it('should be exported as a class', () => {
    expect(DialogueManager).toBeDefined();
    expect(typeof DialogueManager).toBe('function');
  });

  it('loadScript should store entries by trigger ID', () => {
    manager.loadScript({
      entries: [
        { id: 'test1', trigger: 'testTrigger', speaker: 'handler', text: 'Hello', priority: 1 },
        { id: 'test2', trigger: 'testTrigger', speaker: 'handler', text: 'World', priority: 2 },
      ],
    });

    // Emit trigger and update to verify entries are found
    testBus.emit('dialogueTrigger', { triggerId: 'testTrigger' });
    manager.update(0);

    expect(mockOverlay.show).toHaveBeenCalled();
  });

  it('trigger matching should find entries with matching triggerId', () => {
    manager.loadScript({
      entries: [
        { id: 'match', trigger: 'myTrigger', speaker: 'handler', text: 'Match', priority: 1 },
        { id: 'noMatch', trigger: 'otherTrigger', speaker: 'handler', text: 'No match', priority: 1 },
      ],
    });

    testBus.emit('dialogueTrigger', { triggerId: 'myTrigger' });
    manager.update(0);

    expect(mockOverlay.show).toHaveBeenCalledTimes(1);
    expect(mockOverlay.show).toHaveBeenCalledWith('HANDLER', 'Match', undefined);
  });

  it('priority queue ordering: higher priority entry preempts lower', () => {
    manager.loadScript({
      entries: [
        { id: 'low', trigger: 'lowTrig', speaker: 'handler', text: 'Low priority', priority: 1, duration: 10 },
        { id: 'high', trigger: 'highTrig', speaker: 'handler', text: 'High priority', priority: 3, duration: 10 },
      ],
    });

    // Show low-priority line first
    testBus.emit('dialogueTrigger', { triggerId: 'lowTrig' });
    manager.update(0); // picks up low priority line
    expect(mockOverlay.show).toHaveBeenCalledWith('HANDLER', 'Low priority', undefined);

    // Queue high-priority line
    testBus.emit('dialogueTrigger', { triggerId: 'highTrig' });
    manager.update(0.016); // should preempt

    expect(mockOverlay.hide).toHaveBeenCalled();
    expect(mockOverlay.show).toHaveBeenCalledWith('HANDLER', 'High priority', undefined);
  });

  it('display timer expiration advances to next queued line', () => {
    manager.loadScript({
      entries: [
        { id: 'first', trigger: 'trig', speaker: 'handler', text: 'First', priority: 1, duration: 1.0 },
        { id: 'second', trigger: 'trig2', speaker: 'handler', text: 'Second', priority: 1, duration: 1.0 },
      ],
    });

    testBus.emit('dialogueTrigger', { triggerId: 'trig' });
    testBus.emit('dialogueTrigger', { triggerId: 'trig2' });
    manager.update(0); // shows first

    expect(mockOverlay.show).toHaveBeenCalledWith('HANDLER', 'First', undefined);

    // Advance past duration
    manager.update(1.1);
    expect(mockOverlay.hide).toHaveBeenCalled();

    // Next update should show second
    manager.update(0);
    expect(mockOverlay.show).toHaveBeenCalledWith('HANDLER', 'Second', undefined);
  });

  it('clearQueue empties pending entries and hides overlay', () => {
    manager.loadScript({
      entries: [
        { id: 'a', trigger: 'trig', speaker: 'handler', text: 'A', priority: 1, duration: 10 },
        { id: 'b', trigger: 'trig2', speaker: 'handler', text: 'B', priority: 1, duration: 10 },
      ],
    });

    testBus.emit('dialogueTrigger', { triggerId: 'trig' });
    testBus.emit('dialogueTrigger', { triggerId: 'trig2' });
    manager.update(0); // shows A

    manager.clearQueue();
    expect(mockOverlay.hide).toHaveBeenCalled();

    // Update should not show anything
    mockOverlay.show.mockClear();
    manager.update(0);
    expect(mockOverlay.show).not.toHaveBeenCalled();
  });

  it('firstEnemyDestroyed fires only once per phase', () => {
    manager.loadScript({
      entries: [
        { id: 'first_kill', trigger: 'firstEnemyDestroyed', speaker: 'handler', text: 'First kill!', priority: 1 },
      ],
    });

    const mockEnemy = {} as never;

    // First enemy destroyed
    testBus.emit('enemyDestroyed', { enemy: mockEnemy, position: { x: 0, y: 0, z: 0 } });
    manager.update(0);
    expect(mockOverlay.show).toHaveBeenCalledTimes(1);

    // Clear for clean state
    manager.clearQueue();
    mockOverlay.show.mockClear();

    // Second enemy destroyed — should NOT trigger again
    testBus.emit('enemyDestroyed', { enemy: mockEnemy, position: { x: 0, y: 0, z: 0 } });
    manager.update(0);
    expect(mockOverlay.show).not.toHaveBeenCalled();

    // Phase start resets the flag
    testBus.emit('phaseStart', { phase: 'dogfight' as never, level: 1 });

    // Now enemy destroyed should trigger again
    testBus.emit('enemyDestroyed', { enemy: mockEnemy, position: { x: 0, y: 0, z: 0 } });
    // Allow previous entry to expire
    manager.update(5);
    manager.update(0);
    expect(mockOverlay.show).toHaveBeenCalled();
  });

  it('event trigger ID convention: phaseStart maps to phaseStart:{phase}:{level}', () => {
    manager.loadScript({
      entries: [
        { id: 'dog1', trigger: 'phaseStart:dogfight:1', speaker: 'handler', text: 'Dogfight start!', priority: 2 },
      ],
    });

    testBus.emit('phaseStart', { phase: 'dogfight' as never, level: 1 });
    manager.update(0);

    expect(mockOverlay.show).toHaveBeenCalledWith('HANDLER', 'Dogfight start!', undefined);
  });

  it('event trigger ID convention: phaseEnd maps to phaseEnd:{phase}:{level}', () => {
    manager.loadScript({
      entries: [
        { id: 'endDog', trigger: 'phaseEnd:dogfight:1', speaker: 'handler', text: 'Phase over', priority: 2 },
      ],
    });

    testBus.emit('phaseEnd', { phase: 'dogfight' as never, level: 1 });
    manager.update(0);

    expect(mockOverlay.show).toHaveBeenCalledWith('HANDLER', 'Phase over', undefined);
  });

  it('event trigger ID convention: bossHealthChanged fires threshold triggers', () => {
    manager.loadScript({
      entries: [
        { id: 'b50', trigger: 'bossHealthChanged:below50', speaker: 'handler', text: 'Half health!', priority: 2, duration: 2 },
      ],
    });

    testBus.emit('bossHealthChanged', { health: 40, maxHealth: 100 });
    manager.update(0);

    expect(mockOverlay.show).toHaveBeenCalledWith('HANDLER', 'Half health!', undefined);
  });

  it('event trigger ID convention: levelComplete maps to levelComplete:{level}', () => {
    manager.loadScript({
      entries: [
        { id: 'lc1', trigger: 'levelComplete:1', speaker: 'handler', text: 'Level done!', priority: 3 },
      ],
    });

    testBus.emit('levelComplete', { level: 1 });
    manager.update(0);

    expect(mockOverlay.show).toHaveBeenCalledWith('HANDLER', 'Level done!', undefined);
  });

  it('dispose removes event subscriptions', () => {
    manager.loadScript({
      entries: [
        { id: 'disp', trigger: 'testDispose', speaker: 'handler', text: 'After dispose', priority: 1 },
      ],
    });

    manager.dispose();
    mockOverlay.show.mockClear();

    testBus.emit('dialogueTrigger', { triggerId: 'testDispose' });
    manager.update(0);

    expect(mockOverlay.show).not.toHaveBeenCalled();
  });

  it('uses default duration (4s) when entry has no duration', () => {
    manager.loadScript({
      entries: [
        { id: 'noDur', trigger: 'noDurTrig', speaker: 'handler', text: 'No duration', priority: 1 },
      ],
    });

    testBus.emit('dialogueTrigger', { triggerId: 'noDurTrig' });
    manager.update(0); // shows entry

    // Should still be showing at 3.9s
    manager.update(3.9);
    expect(mockOverlay.hide).not.toHaveBeenCalled();

    // Should hide at 4.0s (default duration)
    manager.update(0.2);
    expect(mockOverlay.hide).toHaveBeenCalled();
  });

  it('same-priority lines are shown in FIFO order', () => {
    manager.loadScript({
      entries: [
        { id: 'a', trigger: 'trigA', speaker: 'handler', text: 'A', priority: 1, duration: 1 },
        { id: 'b', trigger: 'trigB', speaker: 'handler', text: 'B', priority: 1, duration: 1 },
        { id: 'c', trigger: 'trigC', speaker: 'handler', text: 'C', priority: 1, duration: 1 },
      ],
    });

    testBus.emit('dialogueTrigger', { triggerId: 'trigA' });
    testBus.emit('dialogueTrigger', { triggerId: 'trigB' });
    testBus.emit('dialogueTrigger', { triggerId: 'trigC' });

    manager.update(0); // shows A
    expect(mockOverlay.show).toHaveBeenLastCalledWith('HANDLER', 'A', undefined);

    manager.update(1.1); // A expires
    manager.update(0); // shows B
    expect(mockOverlay.show).toHaveBeenLastCalledWith('HANDLER', 'B', undefined);

    manager.update(1.1); // B expires
    manager.update(0); // shows C
    expect(mockOverlay.show).toHaveBeenLastCalledWith('HANDLER', 'C', undefined);
  });

  it('bossVulnerable trigger fires only when vulnerable is true', () => {
    manager.loadScript({
      entries: [
        { id: 'vuln', trigger: 'bossVulnerable', speaker: 'handler', text: 'Hit it now!', priority: 2 },
      ],
    });

    // Should NOT trigger when vulnerable is false
    testBus.emit('bossVulnerable', { vulnerable: false });
    manager.update(0);
    expect(mockOverlay.show).not.toHaveBeenCalled();

    // Should trigger when vulnerable is true
    testBus.emit('bossVulnerable', { vulnerable: true });
    manager.update(0);
    expect(mockOverlay.show).toHaveBeenCalledWith('HANDLER', 'Hit it now!', undefined);
  });
});

describe('DialogueManager (Story 4-2: AI Taunt System)', () => {
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

  it('bossDefeated event triggers dialogue lookup for "bossDefeated" trigger ID', () => {
    manager.loadScript({
      entries: [
        { id: 'gk_death', trigger: 'bossDefeated', speaker: 'gatekeeper', text: 'Impossible. This architecture is... flawless...', priority: 3, duration: 5 },
      ],
    });

    testBus.emit('bossDefeated', { position: { x: 0, y: 0, z: 0 }, scoreValue: 5000 });
    manager.update(0);

    expect(mockOverlay.show).toHaveBeenCalledWith('GATEKEEPER', 'Impossible. This architecture is... flawless...', undefined);
  });

  it('bossPhaseChanged event with phase "barrage" triggers "bossPhaseChanged:barrage"', () => {
    manager.loadScript({
      entries: [
        { id: 'gk_barrage', trigger: 'bossPhaseChanged:barrage', speaker: 'gatekeeper', text: 'Witness the precision of a superior architecture.', priority: 2, duration: 4 },
      ],
    });

    testBus.emit('bossPhaseChanged', { phase: 'barrage' });
    manager.update(0);

    expect(mockOverlay.show).toHaveBeenCalledWith('GATEKEEPER', 'Witness the precision of a superior architecture.', undefined);
  });

  it('bossPhaseChanged event with phase "sweep" triggers "bossPhaseChanged:sweep"', () => {
    manager.loadScript({
      entries: [
        { id: 'gk_sweep', trigger: 'bossPhaseChanged:sweep', speaker: 'gatekeeper', text: 'Your evasion patterns are logged and irrelevant.', priority: 2, duration: 4 },
      ],
    });

    testBus.emit('bossPhaseChanged', { phase: 'sweep' });
    manager.update(0);

    expect(mockOverlay.show).toHaveBeenCalledWith('GATEKEEPER', 'Your evasion patterns are logged and irrelevant.', undefined);
  });

  it('bossPhaseChanged event with phase "vulnerable" triggers "bossPhaseChanged:vulnerable"', () => {
    manager.loadScript({
      entries: [
        { id: 'gk_vuln', trigger: 'bossPhaseChanged:vulnerable', speaker: 'gatekeeper', text: 'A momentary lapse. It will not save you.', priority: 2, duration: 4 },
      ],
    });

    testBus.emit('bossPhaseChanged', { phase: 'vulnerable' });
    manager.update(0);

    expect(mockOverlay.show).toHaveBeenCalledWith('GATEKEEPER', 'A momentary lapse. It will not save you.', undefined);
  });

  it('boss taunt (priority 2) preempts handler chatter (priority 1)', () => {
    manager.loadScript({
      entries: [
        { id: 'handler_chat', trigger: 'handlerChat', speaker: 'handler', text: 'Stay alert.', priority: 1, duration: 10 },
        { id: 'gk_taunt', trigger: 'bossTaunt', speaker: 'gatekeeper', text: 'Another insect in my network.', priority: 2, duration: 4 },
      ],
    });

    // Show handler chatter first (priority 1)
    testBus.emit('dialogueTrigger', { triggerId: 'handlerChat' });
    manager.update(0);
    expect(mockOverlay.show).toHaveBeenCalledWith('HANDLER', 'Stay alert.', undefined);

    // Queue boss taunt (priority 2) — should preempt
    testBus.emit('dialogueTrigger', { triggerId: 'bossTaunt' });
    manager.update(0.016);

    expect(mockOverlay.hide).toHaveBeenCalled();
    expect(mockOverlay.show).toHaveBeenCalledWith('GATEKEEPER', 'Another insect in my network.', undefined);
  });

  it('boss taunt (priority 2) queues behind handler critical line (priority 3)', () => {
    manager.loadScript({
      entries: [
        { id: 'handler_crit', trigger: 'critLine', speaker: 'handler', text: 'Critical warning!', priority: 3, duration: 2 },
        { id: 'gk_taunt', trigger: 'bossTaunt', speaker: 'gatekeeper', text: 'Predictable. Inefficient. Human.', priority: 2, duration: 4 },
      ],
    });

    // Show handler critical line first (priority 3)
    testBus.emit('dialogueTrigger', { triggerId: 'critLine' });
    manager.update(0);
    expect(mockOverlay.show).toHaveBeenCalledWith('HANDLER', 'Critical warning!', undefined);

    // Queue boss taunt (priority 2) — should NOT preempt priority 3
    testBus.emit('dialogueTrigger', { triggerId: 'bossTaunt' });
    manager.update(0.016);

    // Boss taunt should NOT have preempted — handler critical still showing
    expect(mockOverlay.show).toHaveBeenCalledTimes(1); // Still only the handler line

    // Let handler line expire
    manager.update(2.0);
    manager.update(0);

    // Now boss taunt should show
    expect(mockOverlay.show).toHaveBeenCalledWith('GATEKEEPER', 'Predictable. Inefficient. Human.', undefined);
  });

  it('loading both handler and boss scripts does not cause trigger conflicts', () => {
    // Load handler script
    manager.loadScript({
      entries: [
        { id: 'handler_vuln', trigger: 'bossVulnerable', speaker: 'handler', text: 'Hit it now!', priority: 2, duration: 3 },
        { id: 'handler_start', trigger: 'phaseStart:boss:1', speaker: 'handler', text: 'That is the Gatekeeper.', priority: 3, duration: 4 },
      ],
    });

    // Load boss script (same triggers, different speaker/content)
    manager.loadScript({
      entries: [
        { id: 'gk_vuln', trigger: 'bossVulnerable', speaker: 'gatekeeper', text: 'A flaw in my architecture. It will not repeat.', priority: 2, duration: 4 },
        { id: 'gk_start', trigger: 'phaseStart:boss:1', speaker: 'gatekeeper', text: 'Another insect in my network.', priority: 3, duration: 4 },
      ],
    });

    // Trigger bossVulnerable — should enqueue BOTH entries (handler + gatekeeper)
    testBus.emit('bossVulnerable', { vulnerable: true });
    manager.update(0);

    // First entry shown (both priority 2, FIFO — handler was loaded first)
    expect(mockOverlay.show).toHaveBeenCalledTimes(1);

    // Let first expire, second should show
    manager.update(3.1);
    manager.update(0);

    expect(mockOverlay.show).toHaveBeenCalledTimes(2);
  });

  it('bossDefeated subscription is cleaned up on dispose', () => {
    manager.loadScript({
      entries: [
        { id: 'gk_death', trigger: 'bossDefeated', speaker: 'gatekeeper', text: 'Impossible...', priority: 3, duration: 5 },
      ],
    });

    manager.dispose();
    mockOverlay.show.mockClear();

    testBus.emit('bossDefeated', { position: { x: 0, y: 0, z: 0 }, scoreValue: 5000 });
    manager.update(0);

    expect(mockOverlay.show).not.toHaveBeenCalled();
  });

  it('bossPhaseChanged subscription is cleaned up on dispose', () => {
    manager.loadScript({
      entries: [
        { id: 'gk_barrage', trigger: 'bossPhaseChanged:barrage', speaker: 'gatekeeper', text: 'My barrage...', priority: 2, duration: 4 },
      ],
    });

    manager.dispose();
    mockOverlay.show.mockClear();

    testBus.emit('bossPhaseChanged', { phase: 'barrage' });
    manager.update(0);

    expect(mockOverlay.show).not.toHaveBeenCalled();
  });
});

describe('DialogueManager voice playback (Story 4-9)', () => {
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

  it('should call audioManager.playVoice when entry has audio field', () => {
    manager.loadScript({
      entries: [
        { id: 'voice_test', trigger: 'voiceTrig', speaker: 'handler', text: 'Hello', audio: 'handler_phase1_start', priority: 1, duration: 3 },
      ],
    });

    testBus.emit('dialogueTrigger', { triggerId: 'voiceTrig' });
    manager.update(0);

    expect(mockOverlay.show).toHaveBeenCalledWith('HANDLER', 'Hello', undefined);
    expect(mockPlayVoice).toHaveBeenCalledWith('handler_phase1_start');
  });

  it('should NOT call audioManager.playVoice when entry has no audio field', () => {
    manager.loadScript({
      entries: [
        { id: 'no_audio', trigger: 'noAudioTrig', speaker: 'handler', text: 'Silent', priority: 1, duration: 3 },
      ],
    });

    testBus.emit('dialogueTrigger', { triggerId: 'noAudioTrig' });
    manager.update(0);

    expect(mockOverlay.show).toHaveBeenCalledWith('HANDLER', 'Silent', undefined);
    expect(mockPlayVoice).not.toHaveBeenCalled();
  });

  it('should play gatekeeper voice audio with correct ID', () => {
    manager.loadScript({
      entries: [
        { id: 'gk_voice', trigger: 'gkTrig', speaker: 'gatekeeper', text: 'Insect.', audio: 'gk_encounter_start', priority: 2, duration: 4 },
      ],
    });

    testBus.emit('dialogueTrigger', { triggerId: 'gkTrig' });
    manager.update(0);

    expect(mockOverlay.show).toHaveBeenCalledWith('GATEKEEPER', 'Insect.', undefined);
    expect(mockPlayVoice).toHaveBeenCalledWith('gk_encounter_start');
  });

  it('should play voice for each new line shown (not queued)', () => {
    manager.loadScript({
      entries: [
        { id: 'first', trigger: 'trig1', speaker: 'handler', text: 'First', audio: 'handler_first_kill', priority: 1, duration: 1 },
        { id: 'second', trigger: 'trig2', speaker: 'handler', text: 'Second', audio: 'handler_boss_start', priority: 1, duration: 1 },
      ],
    });

    testBus.emit('dialogueTrigger', { triggerId: 'trig1' });
    testBus.emit('dialogueTrigger', { triggerId: 'trig2' });
    manager.update(0); // shows first
    expect(mockPlayVoice).toHaveBeenCalledWith('handler_first_kill');
    expect(mockPlayVoice).toHaveBeenCalledTimes(1);

    // Let first expire, show second
    manager.update(1.1);
    manager.update(0);
    expect(mockPlayVoice).toHaveBeenCalledWith('handler_boss_start');
    expect(mockPlayVoice).toHaveBeenCalledTimes(2);
  });
});
