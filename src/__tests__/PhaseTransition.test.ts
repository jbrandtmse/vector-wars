import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PhaseTransition } from '../state/phases/PhaseTransition.ts';
import { PHASE_TRANSITION_FADE_DURATION } from '../config/constants.ts';

// Mock RenderPipeline with the methods PhaseTransition needs
function createMockRenderPipeline() {
  let transitionProgress = 0;
  return {
    setTransitionProgress: vi.fn((p: number) => {
      transitionProgress = Math.min(1.0, Math.max(0.0, p));
    }),
    getTransitionProgress: vi.fn(() => transitionProgress),
  };
}

describe('PhaseTransition (Story 3-10)', () => {
  let mockPipeline: ReturnType<typeof createMockRenderPipeline>;
  let transition: PhaseTransition;

  beforeEach(() => {
    mockPipeline = createMockRenderPipeline();
    transition = new PhaseTransition(
      mockPipeline as unknown as Parameters<typeof PhaseTransition['prototype']['start']> extends never[]
        ? never
        : ConstructorParameters<typeof PhaseTransition>[0],
    );
  });

  describe('isActive()', () => {
    it('returns false before start()', () => {
      expect(transition.isActive()).toBe(false);
    });

    it('returns true during transition', () => {
      transition.start(vi.fn(), vi.fn());
      expect(transition.isActive()).toBe(true);
    });

    it('returns false after transition completes', () => {
      transition.start(vi.fn(), vi.fn());
      // Complete fade-out
      transition.update(PHASE_TRANSITION_FADE_DURATION);
      // Complete fade-in
      transition.update(PHASE_TRANSITION_FADE_DURATION);
      expect(transition.isActive()).toBe(false);
    });
  });

  describe('Fade-out phase', () => {
    it('progress increases from 0 to 1 over fadeDuration', () => {
      const onSwap = vi.fn();
      transition.start(onSwap, vi.fn());

      // At half the fade duration
      transition.update(PHASE_TRANSITION_FADE_DURATION / 2);
      expect(mockPipeline.setTransitionProgress).toHaveBeenCalledWith(
        expect.closeTo(0.5, 1),
      );

      // At full fade duration
      transition.update(PHASE_TRANSITION_FADE_DURATION / 2);
      expect(mockPipeline.setTransitionProgress).toHaveBeenCalledWith(1.0);
    });

    it('onSwap callback fires when progress reaches 1.0', () => {
      const onSwap = vi.fn();
      transition.start(onSwap, vi.fn());

      // Not called yet at 50%
      transition.update(PHASE_TRANSITION_FADE_DURATION / 2);
      expect(onSwap).not.toHaveBeenCalled();

      // Called at 100%
      transition.update(PHASE_TRANSITION_FADE_DURATION / 2);
      expect(onSwap).toHaveBeenCalledTimes(1);
    });
  });

  describe('Fade-in phase', () => {
    it('progress decreases from 1 to 0 after swap', () => {
      transition.start(vi.fn(), vi.fn());

      // Complete fade-out
      transition.update(PHASE_TRANSITION_FADE_DURATION);

      // Clear call history to focus on fade-in
      mockPipeline.setTransitionProgress.mockClear();

      // At half the fade-in
      transition.update(PHASE_TRANSITION_FADE_DURATION / 2);
      expect(mockPipeline.setTransitionProgress).toHaveBeenCalledWith(
        expect.closeTo(0.5, 1),
      );
    });

    it('onComplete callback fires when fade-in completes', () => {
      const onComplete = vi.fn();
      transition.start(vi.fn(), onComplete);

      // Complete fade-out
      transition.update(PHASE_TRANSITION_FADE_DURATION);
      expect(onComplete).not.toHaveBeenCalled();

      // Complete fade-in
      transition.update(PHASE_TRANSITION_FADE_DURATION);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('sets transitionProgress to 0.0 when complete', () => {
      transition.start(vi.fn(), vi.fn());

      // Complete fade-out
      transition.update(PHASE_TRANSITION_FADE_DURATION);
      // Complete fade-in
      transition.update(PHASE_TRANSITION_FADE_DURATION);

      // Last call should be 0.0
      const calls = mockPipeline.setTransitionProgress.mock.calls;
      expect(calls[calls.length - 1][0]).toBe(0.0);
    });
  });

  describe('Edge cases', () => {
    it('multiple start() calls reset state correctly', () => {
      const onSwap1 = vi.fn();
      const onComplete1 = vi.fn();
      transition.start(onSwap1, onComplete1);

      // Partial progress
      transition.update(PHASE_TRANSITION_FADE_DURATION / 2);

      // Restart
      const onSwap2 = vi.fn();
      const onComplete2 = vi.fn();
      transition.start(onSwap2, onComplete2);

      expect(transition.isActive()).toBe(true);

      // First callbacks should not fire
      transition.update(PHASE_TRANSITION_FADE_DURATION);
      expect(onSwap1).not.toHaveBeenCalled();
      expect(onSwap2).toHaveBeenCalledTimes(1);

      transition.update(PHASE_TRANSITION_FADE_DURATION);
      expect(onComplete1).not.toHaveBeenCalled();
      expect(onComplete2).toHaveBeenCalledTimes(1);
    });

    it('zero dt edge case (progress stays at 0)', () => {
      transition.start(vi.fn(), vi.fn());
      transition.update(0);

      // Progress should be 0/fadeDuration = 0
      expect(mockPipeline.setTransitionProgress).toHaveBeenCalledWith(0);
    });

    it('very large dt completes in one frame', () => {
      const onSwap = vi.fn();
      const onComplete = vi.fn();
      transition.start(onSwap, onComplete);

      // Large dt that exceeds both fade durations
      transition.update(100);
      expect(onSwap).toHaveBeenCalledTimes(1);

      // Fade-in also completes with a large dt
      transition.update(100);
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(transition.isActive()).toBe(false);
    });

    it('update with no active transition is a no-op', () => {
      transition.update(1.0);
      expect(mockPipeline.setTransitionProgress).not.toHaveBeenCalled();
    });
  });

  describe('Custom fade duration', () => {
    it('respects custom fadeDuration', () => {
      const customTransition = new PhaseTransition(
        mockPipeline as unknown as ConstructorParameters<typeof PhaseTransition>[0],
        0.5,
      );

      const onSwap = vi.fn();
      customTransition.start(onSwap, vi.fn());

      // At 0.25 seconds (50% of 0.5s duration)
      customTransition.update(0.25);
      expect(mockPipeline.setTransitionProgress).toHaveBeenCalledWith(
        expect.closeTo(0.5, 1),
      );

      // At 0.5 seconds (100%)
      customTransition.update(0.25);
      expect(onSwap).toHaveBeenCalledTimes(1);
    });
  });
});
