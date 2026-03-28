import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as THREE from 'three';
import { eventBus } from '../core/GameEvents.ts';
import {
  PHASE_SHIELD_RECHARGE_AMOUNT,
  PLAYER_MAX_SHIELDS,
} from '../config/constants.ts';

// Mock Logger
vi.mock('../core/Logger.ts', () => ({
  Logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Track phase instances created in order
let createdPhases: any[] = [];

vi.mock('../state/phases/DogfightPhase.ts', () => {
  class MockDogfightPhase {
    enter = vi.fn();
    update = vi.fn();
    exit = vi.fn();
    isComplete = vi.fn(() => false);
    constructor(..._args: any[]) {
      createdPhases.push(this);
    }
  }
  return { DogfightPhase: MockDogfightPhase };
});

vi.mock('../state/phases/SurfacePhase.ts', () => {
  class MockSurfacePhase {
    enter = vi.fn();
    update = vi.fn();
    exit = vi.fn();
    isComplete = vi.fn(() => false);
    constructor(..._args: any[]) {
      createdPhases.push(this);
    }
  }
  return { SurfacePhase: MockSurfacePhase };
});

vi.mock('../state/phases/CorridorPhase.ts', () => {
  class MockCorridorPhase {
    enter = vi.fn();
    update = vi.fn();
    exit = vi.fn();
    isComplete = vi.fn(() => false);
    constructor(..._args: any[]) {
      createdPhases.push(this);
    }
  }
  return { CorridorPhase: MockCorridorPhase };
});

vi.mock('../state/phases/BossPhase.ts', () => {
  class MockBossPhase {
    enter = vi.fn();
    update = vi.fn();
    exit = vi.fn();
    isComplete = vi.fn(() => false);
    constructor(..._args: any[]) {
      createdPhases.push(this);
    }
  }
  return { BossPhase: MockBossPhase };
});

vi.mock('../state/phases/TutorialPhase.ts', () => {
  class MockTutorialPhase {
    enter = vi.fn();
    update = vi.fn();
    exit = vi.fn();
    isComplete = vi.fn(() => false);
    constructor(..._args: any[]) {
      createdPhases.push(this);
    }
  }
  return { TutorialPhase: MockTutorialPhase };
});

vi.mock('../state/phases/BriefingPhase.ts', () => {
  class MockBriefingPhase {
    enter = vi.fn();
    update = vi.fn();
    exit = vi.fn();
    isComplete = vi.fn(() => false);
    constructor(..._args: any[]) {
      createdPhases.push(this);
    }
  }
  return { BriefingPhase: MockBriefingPhase };
});

// Mock PhaseTransition that resolves on the first update() call
vi.mock('../state/phases/PhaseTransition.ts', () => {
  class MockPhaseTransition {
    private _active = false;
    private _onSwapCb: (() => void) | null = null;
    private _onCompleteCb: (() => void) | null = null;

    start = vi.fn((onSwap: () => void, onComplete: () => void) => {
      this._active = true;
      this._onSwapCb = onSwap;
      this._onCompleteCb = onComplete;
    });

    update = vi.fn(() => {
      if (this._active && this._onSwapCb) {
        const swap = this._onSwapCb;
        this._onSwapCb = null;
        swap();
      }
      if (this._active && this._onCompleteCb) {
        const complete = this._onCompleteCb;
        this._onCompleteCb = null;
        complete();
        this._active = false;
      }
    });

    isActive = vi.fn(() => this._active);

    constructor(..._args: any[]) {}
  }
  return { PhaseTransition: MockPhaseTransition };
});

function createMockDeps() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, 16 / 9, 0.01, 1000);
  scene.add(camera);

  return {
    scene,
    camera,
    vectorMaterials: { setPalette: vi.fn() } as any,
    gameObjectManager: {} as any,
    player: {
      shields: PLAYER_MAX_SHIELDS,
      maxShields: PLAYER_MAX_SHIELDS,
      collider: new THREE.Sphere(),
      rechargeShields: vi.fn(function (this: any, amount: number) {
        this.shields = Math.min(this.maxShields, this.shields + amount);
      }),
      reset: vi.fn(function (this: any) {
        this.shields = this.maxShields;
      }),
      takeDamage: vi.fn(),
      syncToCamera: vi.fn(),
    } as any,
    renderPipeline: {
      setTransitionProgress: vi.fn(),
      getTransitionProgress: vi.fn(() => 0),
    } as any,
    railMovement: {
      getRailProgress: vi.fn(() => 0),
      update: vi.fn(),
    } as any,
    enemySpawner: { update: vi.fn(), setSpawnEvents: vi.fn(), setLevelBehaviors: vi.fn(), resetForNewLevel: vi.fn() } as any,
    collisionSystem: { update: vi.fn() } as any,
    effectsManager: { update: vi.fn() } as any,
    enemyProjectileSystem: { update: vi.fn() } as any,
    dataLanceSystem: { update: vi.fn() } as any,
    gameOverManager: {
      isGameOver: false,
      preventGameOver: false,
    } as any,
    inputManager: {
      isActive: vi.fn(() => false),
      dispose: vi.fn(),
    } as any,
  };
}

// Helper to get phase mocks from the createdPhases array.
// LevelManager.enter() creates phases in order: tutorial(idx), dogfight(idx+1), surface(idx+2), corridor(idx+3), boss(idx+4)
function getPhases(startIdx: number) {
  return {
    tutorial: createdPhases[startIdx],
    dogfight: createdPhases[startIdx + 1],
    surface: createdPhases[startIdx + 2],
    corridor: createdPhases[startIdx + 3],
    boss: createdPhases[startIdx + 4],
  };
}

/**
 * Helper: advance through one phase transition.
 * First update() starts the transition (phase reports isComplete).
 * Second update() resolves the transition (mock fires swap+complete immediately).
 */
function advanceTransition(lm: any) {
  lm.update(0.016); // starts transition
  lm.update(0.016); // resolves transition
}

describe('LevelManager (Story 3-10)', () => {
  let deps: ReturnType<typeof createMockDeps>;
  let levelManager: any;
  let phaseStartIdx: number;

  // Track events emitted
  let emittedEvents: Array<{ event: string; data: any }>;
  const trackEvent = (event: string) => (data: any) => {
    emittedEvents.push({ event, data });
  };
  let phaseStartListener: (data: any) => void;
  let phaseEndListener: (data: any) => void;
  let levelCompleteListener: (data: any) => void;
  let phaseRestartListener: (data: any) => void;

  beforeEach(async () => {
    emittedEvents = [];
    createdPhases = [];
    deps = createMockDeps();

    const { LevelManager } = await import('../systems/LevelManager.ts');
    phaseStartIdx = createdPhases.length;

    levelManager = new LevelManager(
      deps.scene,
      deps.camera,
      deps.vectorMaterials,
      deps.gameObjectManager,
      deps.player,
      deps.renderPipeline,
      deps.railMovement,
      deps.enemySpawner,
      deps.collisionSystem,
      deps.effectsManager,
      deps.enemyProjectileSystem,
      deps.dataLanceSystem,
      deps.gameOverManager,
      deps.inputManager,
    );

    phaseStartListener = trackEvent('phaseStart');
    phaseEndListener = trackEvent('phaseEnd');
    levelCompleteListener = trackEvent('levelComplete');
    phaseRestartListener = trackEvent('phaseRestart');

    eventBus.on('phaseStart', phaseStartListener);
    eventBus.on('phaseEnd', phaseEndListener);
    eventBus.on('levelComplete', levelCompleteListener);
    eventBus.on('phaseRestart', phaseRestartListener);
  });

  afterEach(() => {
    eventBus.off('phaseStart', phaseStartListener);
    eventBus.off('phaseEnd', phaseEndListener);
    eventBus.off('levelComplete', levelCompleteListener);
    eventBus.off('phaseRestart', phaseRestartListener);

    try { levelManager?.exit(); } catch { /* ok */ }
  });

  describe('enter()', () => {
    it('emits phaseStart with tutorial phase', () => {
      levelManager.enter();

      const events = emittedEvents.filter((e: any) => e.event === 'phaseStart');
      expect(events.length).toBe(1);
      expect(events[0].data).toEqual({ phase: 'tutorial', level: 1 });
    });

    it('sets preventGameOver on GameOverManager', () => {
      levelManager.enter();
      expect(deps.gameOverManager.preventGameOver).toBe(true);
    });

    it('starts on the tutorial phase', () => {
      levelManager.enter();
      expect(levelManager.getCurrentPhaseType()).toBe('tutorial');
    });

    it('isUsingMainRail returns true during tutorial phase', () => {
      levelManager.enter();
      expect(levelManager.isUsingMainRail()).toBe(true);
    });

    it('calls enter() on the first phase (tutorial)', () => {
      levelManager.enter();
      const phases = getPhases(phaseStartIdx);
      expect(phases.tutorial.enter).toHaveBeenCalledTimes(1);
    });
  });

  describe('Phase sequencing', () => {
    it('advances from tutorial to dogfight on completion', () => {
      levelManager.enter();
      const phases = getPhases(phaseStartIdx);

      phases.tutorial.isComplete.mockReturnValue(true);
      advanceTransition(levelManager);

      expect(levelManager.getCurrentPhaseType()).toBe('dogfight');
    });

    it('advances through all five phases: tutorial -> dogfight -> surface -> corridor -> boss', () => {
      levelManager.enter();
      const phases = getPhases(phaseStartIdx);

      phases.tutorial.isComplete.mockReturnValue(true);
      advanceTransition(levelManager);
      expect(levelManager.getCurrentPhaseType()).toBe('dogfight');

      phases.dogfight.isComplete.mockReturnValue(true);
      advanceTransition(levelManager);
      expect(levelManager.getCurrentPhaseType()).toBe('surface');

      phases.surface.isComplete.mockReturnValue(true);
      advanceTransition(levelManager);
      expect(levelManager.getCurrentPhaseType()).toBe('corridor');

      phases.corridor.isComplete.mockReturnValue(true);
      advanceTransition(levelManager);
      expect(levelManager.getCurrentPhaseType()).toBe('boss');
    });

    it('calls exit() on outgoing phase and enter() on incoming phase', () => {
      levelManager.enter();
      const phases = getPhases(phaseStartIdx);

      phases.tutorial.isComplete.mockReturnValue(true);
      advanceTransition(levelManager);

      expect(phases.tutorial.exit).toHaveBeenCalledTimes(1);
      expect(phases.dogfight.enter).toHaveBeenCalledTimes(1);
    });
  });

  describe('Shield recharge between phases', () => {
    it('recharges shields when transitioning to next phase', () => {
      levelManager.enter();
      const phases = getPhases(phaseStartIdx);

      deps.player.shields = 50;

      phases.tutorial.isComplete.mockReturnValue(true);
      advanceTransition(levelManager);

      expect(deps.player.rechargeShields).toHaveBeenCalledWith(PHASE_SHIELD_RECHARGE_AMOUNT);
    });
  });

  describe('Phase events', () => {
    it('emits phaseEnd for outgoing phase and phaseStart for incoming phase', () => {
      levelManager.enter();
      const phases = getPhases(phaseStartIdx);
      emittedEvents = [];

      phases.tutorial.isComplete.mockReturnValue(true);
      advanceTransition(levelManager);

      const phaseEndEvents = emittedEvents.filter((e: any) => e.event === 'phaseEnd');
      const phaseStartEvents = emittedEvents.filter((e: any) => e.event === 'phaseStart');

      expect(phaseEndEvents.length).toBe(1);
      expect(phaseEndEvents[0].data).toEqual({ phase: 'tutorial', level: 1 });
      expect(phaseStartEvents.length).toBe(1);
      expect(phaseStartEvents[0].data).toEqual({ phase: 'dogfight', level: 1 });
    });

    it('emits phaseStart for each phase as it starts', () => {
      levelManager.enter();
      const phases = getPhases(phaseStartIdx);
      emittedEvents = [];

      phases.tutorial.isComplete.mockReturnValue(true);
      advanceTransition(levelManager);

      phases.dogfight.isComplete.mockReturnValue(true);
      advanceTransition(levelManager);

      phases.surface.isComplete.mockReturnValue(true);
      advanceTransition(levelManager);

      phases.corridor.isComplete.mockReturnValue(true);
      advanceTransition(levelManager);

      const starts = emittedEvents.filter((e: any) => e.event === 'phaseStart');
      expect(starts.map((e: any) => e.data.phase)).toEqual(['dogfight', 'surface', 'corridor', 'boss']);
    });
  });

  describe('Level completion', () => {
    it('emits levelComplete when boss phase completes', () => {
      levelManager.enter();
      const phases = getPhases(phaseStartIdx);

      // Advance through all phases to boss
      phases.tutorial.isComplete.mockReturnValue(true);
      advanceTransition(levelManager);
      phases.dogfight.isComplete.mockReturnValue(true);
      advanceTransition(levelManager);
      phases.surface.isComplete.mockReturnValue(true);
      advanceTransition(levelManager);
      phases.corridor.isComplete.mockReturnValue(true);
      advanceTransition(levelManager);

      emittedEvents = [];
      phases.boss.isComplete.mockReturnValue(true);
      levelManager.update(0.016); // Boss complete triggers levelComplete directly (no transition)

      const events = emittedEvents.filter((e: any) => e.event === 'levelComplete');
      expect(events.length).toBe(1);
      expect(events[0].data).toEqual({ level: 1 });
    });

    it('disables checkpoint after level complete', () => {
      levelManager.enter();
      const phases = getPhases(phaseStartIdx);

      phases.tutorial.isComplete.mockReturnValue(true);
      advanceTransition(levelManager);
      phases.dogfight.isComplete.mockReturnValue(true);
      advanceTransition(levelManager);
      phases.surface.isComplete.mockReturnValue(true);
      advanceTransition(levelManager);
      phases.corridor.isComplete.mockReturnValue(true);
      advanceTransition(levelManager);
      phases.boss.isComplete.mockReturnValue(true);
      levelManager.update(0.016);

      expect(deps.gameOverManager.preventGameOver).toBe(false);
      expect(levelManager.isLevelComplete()).toBe(true);
    });

    it('does not start a phase transition when boss completes', () => {
      levelManager.enter();
      const phases = getPhases(phaseStartIdx);

      phases.tutorial.isComplete.mockReturnValue(true);
      advanceTransition(levelManager);
      phases.dogfight.isComplete.mockReturnValue(true);
      advanceTransition(levelManager);
      phases.surface.isComplete.mockReturnValue(true);
      advanceTransition(levelManager);
      phases.corridor.isComplete.mockReturnValue(true);
      advanceTransition(levelManager);

      emittedEvents = [];
      phases.boss.isComplete.mockReturnValue(true);
      levelManager.update(0.016);

      const phaseEndEvents = emittedEvents.filter((e: any) => e.event === 'phaseEnd');
      expect(phaseEndEvents.length).toBe(0);
    });
  });

  describe('Phase checkpoint on death', () => {
    it('restarts current phase when playerDied fires', () => {
      levelManager.enter();
      const phases = getPhases(phaseStartIdx);
      emittedEvents = [];

      // Emit playerDied -> starts transition
      eventBus.emit('playerDied', {} as Record<string, never>);

      // Resolve the transition
      levelManager.update(0.016);

      expect(phases.tutorial.exit).toHaveBeenCalled();
      expect(deps.player.reset).toHaveBeenCalled();
      // enter called: once from level start, once from restart
      expect(phases.tutorial.enter).toHaveBeenCalledTimes(2);

      const restartEvents = emittedEvents.filter((e: any) => e.event === 'phaseRestart');
      expect(restartEvents.length).toBe(1);
      expect(restartEvents[0].data).toEqual({ phase: 'tutorial', level: 1 });
    });

    it('calls Player.reset() on checkpoint', () => {
      levelManager.enter();

      eventBus.emit('playerDied', {} as Record<string, never>);
      levelManager.update(0.016); // Resolve transition

      expect(deps.player.reset).toHaveBeenCalledTimes(1);
    });

    it('emits phaseRestart event on checkpoint', () => {
      levelManager.enter();
      emittedEvents = [];

      eventBus.emit('playerDied', {} as Record<string, never>);
      levelManager.update(0.016);

      const restartEvents = emittedEvents.filter((e: any) => e.event === 'phaseRestart');
      expect(restartEvents.length).toBe(1);
    });

    it('GameOverManager is blocked during level play', () => {
      levelManager.enter();
      expect(deps.gameOverManager.preventGameOver).toBe(true);
    });
  });

  describe('isUsingMainRail()', () => {
    it('returns true during tutorial phase', () => {
      levelManager.enter();
      expect(levelManager.isUsingMainRail()).toBe(true);
    });

    it('returns true during dogfight phase', () => {
      levelManager.enter();
      const phases = getPhases(phaseStartIdx);

      phases.tutorial.isComplete.mockReturnValue(true);
      advanceTransition(levelManager);

      // Now on dogfight (index 1)
      expect(levelManager.isUsingMainRail()).toBe(true);
    });

    it('returns false during non-tutorial/dogfight phases', () => {
      levelManager.enter();
      const phases = getPhases(phaseStartIdx);

      phases.tutorial.isComplete.mockReturnValue(true);
      advanceTransition(levelManager);
      phases.dogfight.isComplete.mockReturnValue(true);
      advanceTransition(levelManager);

      // Now on surface (index 2)
      expect(levelManager.isUsingMainRail()).toBe(false);
    });

    it('returns false after level complete', () => {
      levelManager.enter();
      const phases = getPhases(phaseStartIdx);

      phases.tutorial.isComplete.mockReturnValue(true);
      advanceTransition(levelManager);
      phases.dogfight.isComplete.mockReturnValue(true);
      advanceTransition(levelManager);
      phases.surface.isComplete.mockReturnValue(true);
      advanceTransition(levelManager);
      phases.corridor.isComplete.mockReturnValue(true);
      advanceTransition(levelManager);
      phases.boss.isComplete.mockReturnValue(true);
      levelManager.update(0.016);

      expect(levelManager.isUsingMainRail()).toBe(false);
    });
  });
});

/**
 * Helper to get phase mocks for the 6-phase (with briefing) sequence.
 * LevelManager.enter() creates phases in order: tutorial, briefing, dogfight, surface, corridor, boss
 */
function getPhasesWithBriefing(startIdx: number) {
  return {
    tutorial: createdPhases[startIdx],
    briefing: createdPhases[startIdx + 1],
    dogfight: createdPhases[startIdx + 2],
    surface: createdPhases[startIdx + 3],
    corridor: createdPhases[startIdx + 4],
    boss: createdPhases[startIdx + 5],
  };
}

describe('LevelManager with briefing data (Story 4-4)', () => {
  let deps: ReturnType<typeof createMockDeps>;
  let levelManager: any;
  let phaseStartIdx: number;

  let emittedEvents: Array<{ event: string; data: any }>;
  const trackEvent = (event: string) => (data: any) => {
    emittedEvents.push({ event, data });
  };
  let phaseStartListener: (data: any) => void;
  let phaseEndListener: (data: any) => void;
  let levelCompleteListener: (data: any) => void;

  const testBriefingData = {
    title: 'MISSION BRIEFING',
    speaker: 'handler',
    lines: ['Line 1', 'Line 2'],
  };

  beforeEach(async () => {
    emittedEvents = [];
    createdPhases = [];
    deps = createMockDeps();

    const { LevelManager } = await import('../systems/LevelManager.ts');
    phaseStartIdx = createdPhases.length;

    levelManager = new LevelManager(
      deps.scene,
      deps.camera,
      deps.vectorMaterials,
      deps.gameObjectManager,
      deps.player,
      deps.renderPipeline,
      deps.railMovement,
      deps.enemySpawner,
      deps.collisionSystem,
      deps.effectsManager,
      deps.enemyProjectileSystem,
      deps.dataLanceSystem,
      deps.gameOverManager,
      deps.inputManager,
    );

    // Set briefing data before entering
    levelManager.setBriefingData(testBriefingData);

    phaseStartListener = trackEvent('phaseStart');
    phaseEndListener = trackEvent('phaseEnd');
    levelCompleteListener = trackEvent('levelComplete');

    eventBus.on('phaseStart', phaseStartListener);
    eventBus.on('phaseEnd', phaseEndListener);
    eventBus.on('levelComplete', levelCompleteListener);
  });

  afterEach(() => {
    eventBus.off('phaseStart', phaseStartListener);
    eventBus.off('phaseEnd', phaseEndListener);
    eventBus.off('levelComplete', levelCompleteListener);

    try { levelManager?.exit(); } catch { /* ok */ }
  });

  it('creates 6 phases when briefing data is set', () => {
    levelManager.enter();
    // tutorial + briefing + dogfight + surface + corridor + boss = 6 new phases
    expect(createdPhases.length - phaseStartIdx).toBe(6);
  });

  it('starts on tutorial phase', () => {
    levelManager.enter();
    expect(levelManager.getCurrentPhaseType()).toBe('tutorial');
  });

  it('advances from tutorial to briefing phase', () => {
    levelManager.enter();
    const phases = getPhasesWithBriefing(phaseStartIdx);

    phases.tutorial.isComplete.mockReturnValue(true);
    advanceTransition(levelManager);

    expect(levelManager.getCurrentPhaseType()).toBe('briefing');
  });

  it('advances from briefing to dogfight phase', () => {
    levelManager.enter();
    const phases = getPhasesWithBriefing(phaseStartIdx);

    phases.tutorial.isComplete.mockReturnValue(true);
    advanceTransition(levelManager);

    phases.briefing.isComplete.mockReturnValue(true);
    advanceTransition(levelManager);

    expect(levelManager.getCurrentPhaseType()).toBe('dogfight');
  });

  it('advances through all 6 phases to boss', () => {
    levelManager.enter();
    const phases = getPhasesWithBriefing(phaseStartIdx);

    phases.tutorial.isComplete.mockReturnValue(true);
    advanceTransition(levelManager);
    expect(levelManager.getCurrentPhaseType()).toBe('briefing');

    phases.briefing.isComplete.mockReturnValue(true);
    advanceTransition(levelManager);
    expect(levelManager.getCurrentPhaseType()).toBe('dogfight');

    phases.dogfight.isComplete.mockReturnValue(true);
    advanceTransition(levelManager);
    expect(levelManager.getCurrentPhaseType()).toBe('surface');

    phases.surface.isComplete.mockReturnValue(true);
    advanceTransition(levelManager);
    expect(levelManager.getCurrentPhaseType()).toBe('corridor');

    phases.corridor.isComplete.mockReturnValue(true);
    advanceTransition(levelManager);
    expect(levelManager.getCurrentPhaseType()).toBe('boss');
  });

  it('emits correct phase events with briefing', () => {
    levelManager.enter();
    const phases = getPhasesWithBriefing(phaseStartIdx);
    emittedEvents = [];

    phases.tutorial.isComplete.mockReturnValue(true);
    advanceTransition(levelManager);

    const starts = emittedEvents.filter((e) => e.event === 'phaseStart');
    expect(starts[0].data).toEqual({ phase: 'briefing', level: 1 });
  });

  it('isUsingMainRail returns false during briefing phase', () => {
    levelManager.enter();
    const phases = getPhasesWithBriefing(phaseStartIdx);

    phases.tutorial.isComplete.mockReturnValue(true);
    advanceTransition(levelManager);

    // Now on briefing
    expect(levelManager.isUsingMainRail()).toBe(false);
  });

  it('isUsingMainRail returns true during dogfight phase (after briefing)', () => {
    levelManager.enter();
    const phases = getPhasesWithBriefing(phaseStartIdx);

    phases.tutorial.isComplete.mockReturnValue(true);
    advanceTransition(levelManager);

    phases.briefing.isComplete.mockReturnValue(true);
    advanceTransition(levelManager);

    // Now on dogfight
    expect(levelManager.isUsingMainRail()).toBe(true);
  });

  it('emits levelComplete when boss phase completes (6-phase)', () => {
    levelManager.enter();
    const phases = getPhasesWithBriefing(phaseStartIdx);

    phases.tutorial.isComplete.mockReturnValue(true);
    advanceTransition(levelManager);
    phases.briefing.isComplete.mockReturnValue(true);
    advanceTransition(levelManager);
    phases.dogfight.isComplete.mockReturnValue(true);
    advanceTransition(levelManager);
    phases.surface.isComplete.mockReturnValue(true);
    advanceTransition(levelManager);
    phases.corridor.isComplete.mockReturnValue(true);
    advanceTransition(levelManager);

    emittedEvents = [];
    phases.boss.isComplete.mockReturnValue(true);
    levelManager.update(0.016);

    const events = emittedEvents.filter((e) => e.event === 'levelComplete');
    expect(events.length).toBe(1);
    expect(events[0].data).toEqual({ level: 1 });
  });
});
