import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DogfightPhase } from '../state/phases/DogfightPhase.ts';
import { RAIL_COMPLETION_THRESHOLD } from '../config/constants.ts';

// Mock Logger
vi.mock('../core/Logger.ts', () => ({
  Logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

function createMockSystems() {
  let railProgress = 0;
  return {
    enemySpawner: { update: vi.fn() },
    gameObjectManager: { update: vi.fn() },
    dataLanceSystem: { update: vi.fn() },
    collisionSystem: { update: vi.fn() },
    enemyProjectileSystem: { update: vi.fn() },
    effectsManager: { update: vi.fn() },
    railMovement: {
      getRailProgress: vi.fn(() => railProgress),
      update: vi.fn(),
      _setProgress: (p: number) => { railProgress = p; },
    },
  };
}

describe('DogfightPhase (Story 3-10)', () => {
  let mocks: ReturnType<typeof createMockSystems>;
  let phase: DogfightPhase;

  beforeEach(() => {
    mocks = createMockSystems();
    phase = new DogfightPhase(
      mocks.enemySpawner as any,
      mocks.gameObjectManager as any,
      mocks.dataLanceSystem as any,
      mocks.collisionSystem as any,
      mocks.enemyProjectileSystem as any,
      mocks.effectsManager as any,
      mocks.railMovement as any,
    );
  });

  describe('enter()', () => {
    it('resets completed flag', () => {
      phase.enter();
      expect(phase.isComplete()).toBe(false);
    });
  });

  describe('update(dt)', () => {
    it('calls all gameplay systems in order', () => {
      phase.enter();
      const callOrder: string[] = [];

      mocks.enemySpawner.update.mockImplementation(() => callOrder.push('enemySpawner'));
      mocks.gameObjectManager.update.mockImplementation(() => callOrder.push('gameObjectManager'));
      mocks.dataLanceSystem.update.mockImplementation(() => callOrder.push('dataLanceSystem'));
      mocks.collisionSystem.update.mockImplementation(() => callOrder.push('collisionSystem'));
      mocks.enemyProjectileSystem.update.mockImplementation(() => callOrder.push('enemyProjectileSystem'));
      mocks.effectsManager.update.mockImplementation(() => callOrder.push('effectsManager'));

      phase.update(0.016);

      expect(callOrder).toEqual([
        'enemySpawner',
        'gameObjectManager',
        'dataLanceSystem',
        'collisionSystem',
        'enemyProjectileSystem',
        'effectsManager',
      ]);
    });

    it('passes rail progress to enemySpawner', () => {
      phase.enter();
      mocks.railMovement._setProgress(0.5);

      phase.update(0.016);

      expect(mocks.enemySpawner.update).toHaveBeenCalledWith(0.5);
    });

    it('passes dt to systems that accept it', () => {
      phase.enter();
      phase.update(0.033);

      expect(mocks.gameObjectManager.update).toHaveBeenCalledWith(0.033);
      expect(mocks.dataLanceSystem.update).toHaveBeenCalledWith(0.033);
      expect(mocks.enemyProjectileSystem.update).toHaveBeenCalledWith(0.033);
      expect(mocks.effectsManager.update).toHaveBeenCalledWith(0.033);
    });
  });

  describe('isComplete()', () => {
    it('returns false initially', () => {
      phase.enter();
      expect(phase.isComplete()).toBe(false);
    });

    it('returns true when rail progress >= RAIL_COMPLETION_THRESHOLD', () => {
      phase.enter();
      mocks.railMovement._setProgress(RAIL_COMPLETION_THRESHOLD);

      phase.update(0.016);

      expect(phase.isComplete()).toBe(true);
    });

    it('returns false when rail progress < RAIL_COMPLETION_THRESHOLD', () => {
      phase.enter();
      mocks.railMovement._setProgress(RAIL_COMPLETION_THRESHOLD - 0.01);

      phase.update(0.016);

      expect(phase.isComplete()).toBe(false);
    });
  });

  describe('exit()', () => {
    it('can be called without errors', () => {
      phase.enter();
      expect(() => phase.exit()).not.toThrow();
    });
  });
});
