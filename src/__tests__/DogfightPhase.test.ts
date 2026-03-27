import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DogfightPhase } from '../state/phases/DogfightPhase.ts';

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
    it('calls enemySpawner with rail progress', () => {
      phase.enter();
      mocks.railMovement._setProgress(0.5);

      phase.update(0.016);

      expect(mocks.enemySpawner.update).toHaveBeenCalledWith(0.5);
    });

    it('passes rail progress to enemySpawner', () => {
      phase.enter();
      mocks.railMovement._setProgress(0.5);

      phase.update(0.016);

      expect(mocks.enemySpawner.update).toHaveBeenCalledWith(0.5);
    });
  });

  describe('isComplete()', () => {
    it('returns false initially', () => {
      phase.enter();
      expect(phase.isComplete()).toBe(false);
    });

    it('returns false after one loop (requires 2 loops)', () => {
      phase.enter();
      // Simulate reaching threshold
      mocks.railMovement._setProgress(0.99);
      phase.update(0.016);
      // Then wrapping around
      mocks.railMovement._setProgress(0.05);
      phase.update(0.016);

      // Only 1 loop — should not be complete
      expect(phase.isComplete()).toBe(false);
    });

    it('returns true after 2 complete loops', () => {
      phase.enter();
      // Loop 1: cross threshold then wrap
      mocks.railMovement._setProgress(0.99);
      phase.update(0.016);
      mocks.railMovement._setProgress(0.05);
      phase.update(0.016);

      // Loop 2: cross threshold then wrap
      mocks.railMovement._setProgress(0.99);
      phase.update(0.016);
      mocks.railMovement._setProgress(0.05);
      phase.update(0.016);

      expect(phase.isComplete()).toBe(true);
    });

    it('returns false when rail progress < threshold', () => {
      phase.enter();
      mocks.railMovement._setProgress(0.5);
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
