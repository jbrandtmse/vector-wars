import { describe, it, expect, vi } from 'vitest';
import { DestructionSequence } from '../entities/bosses/DestructionSequence.ts';
import type { DestructionStage } from '../entities/bosses/DestructionSequence.ts';

function makeStage(name: string, duration: number): DestructionStage & {
  onStartMock: ReturnType<typeof vi.fn>;
  onUpdateMock: ReturnType<typeof vi.fn>;
  onEndMock: ReturnType<typeof vi.fn>;
} {
  const onStartMock = vi.fn();
  const onUpdateMock = vi.fn();
  const onEndMock = vi.fn();
  return {
    name,
    duration,
    onStart: onStartMock,
    onUpdate: onUpdateMock,
    onEnd: onEndMock,
    onStartMock,
    onUpdateMock,
    onEndMock,
  };
}

describe('DestructionSequence', () => {
  describe('Stage progression', () => {
    it('should advance through stages in order', () => {
      const s1 = makeStage('peel', 1.0);
      const s2 = makeStage('strip', 1.0);
      const s3 = makeStage('shatter', 1.0);
      const seq = new DestructionSequence([s1, s2, s3]);

      expect(seq.getCurrentStage()).toBe('peel');
      seq.update(1.0); // completes stage 1
      expect(seq.getCurrentStage()).toBe('strip');
      seq.update(1.0); // completes stage 2
      expect(seq.getCurrentStage()).toBe('shatter');
      seq.update(1.0); // completes stage 3
      expect(seq.complete).toBe(true);
    });

    it('should call onStart on the first stage immediately at construction', () => {
      const s1 = makeStage('peel', 1.0);
      new DestructionSequence([s1]);
      expect(s1.onStartMock).toHaveBeenCalledTimes(1);
    });

    it('should call onStart on next stage when previous completes', () => {
      const s1 = makeStage('peel', 1.0);
      const s2 = makeStage('strip', 1.0);
      const seq = new DestructionSequence([s1, s2]);

      seq.update(1.0); // complete stage 1
      expect(s2.onStartMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Callbacks fire at correct times', () => {
    it('should call onUpdate with progress 0-1 during the stage', () => {
      const s1 = makeStage('peel', 2.0);
      const seq = new DestructionSequence([s1]);

      seq.update(0.5); // progress = 0.25
      expect(s1.onUpdateMock).toHaveBeenCalledWith(0.25, 0.5);

      seq.update(0.5); // progress = 0.5
      expect(s1.onUpdateMock).toHaveBeenCalledWith(0.5, 0.5);
    });

    it('should call onEnd when stage progress reaches 1.0', () => {
      const s1 = makeStage('peel', 1.0);
      const seq = new DestructionSequence([s1]);

      seq.update(1.0); // progress = 1.0
      expect(s1.onEndMock).toHaveBeenCalledTimes(1);
    });

    it('should call onUpdate with progress clamped at 1.0 even with overshoot', () => {
      const s1 = makeStage('peel', 1.0);
      const seq = new DestructionSequence([s1]);

      seq.update(2.0); // overshoot
      expect(s1.onUpdateMock).toHaveBeenCalledWith(1.0, 2.0);
    });
  });

  describe('Progress calculation', () => {
    it('should compute progress as elapsed / duration, clamped to 1.0', () => {
      const s1 = makeStage('peel', 4.0);
      const seq = new DestructionSequence([s1]);

      seq.update(1.0); // elapsed=1, progress=0.25
      expect(seq.getProgress()).toBeCloseTo(0.25);

      seq.update(1.0); // elapsed=2, progress=0.5
      expect(seq.getProgress()).toBeCloseTo(0.5);
    });

    it('should return 1.0 from getProgress when complete', () => {
      const s1 = makeStage('peel', 1.0);
      const seq = new DestructionSequence([s1]);
      seq.update(1.0);
      expect(seq.getProgress()).toBe(1.0);
    });
  });

  describe('Completion flag', () => {
    it('should set complete = true when all stages are done', () => {
      const s1 = makeStage('peel', 1.0);
      const s2 = makeStage('strip', 1.0);
      const seq = new DestructionSequence([s1, s2]);

      expect(seq.complete).toBe(false);
      seq.update(1.0);
      expect(seq.complete).toBe(false);
      seq.update(1.0);
      expect(seq.complete).toBe(true);
    });

    it('should not be complete during an intermediate stage', () => {
      const s1 = makeStage('peel', 1.0);
      const s2 = makeStage('strip', 1.0);
      const seq = new DestructionSequence([s1, s2]);

      seq.update(1.0);
      expect(seq.complete).toBe(false);
    });
  });

  describe('dt parameter passed to onUpdate', () => {
    it('should pass dt as the second argument to onUpdate', () => {
      const s1 = makeStage('peel', 2.0);
      const seq = new DestructionSequence([s1]);

      seq.update(0.016);
      expect(s1.onUpdateMock).toHaveBeenCalledWith(expect.any(Number), 0.016);
    });
  });

  describe('Single stage works correctly', () => {
    it('should handle a single stage from start to completion', () => {
      const s1 = makeStage('only', 1.0);
      const seq = new DestructionSequence([s1]);

      expect(s1.onStartMock).toHaveBeenCalledTimes(1);
      seq.update(0.5);
      expect(s1.onUpdateMock).toHaveBeenCalledTimes(1);
      seq.update(0.5);
      expect(s1.onEndMock).toHaveBeenCalledTimes(1);
      expect(seq.complete).toBe(true);
    });
  });

  describe('Empty stages edge case', () => {
    it('should be immediately complete with empty stage array', () => {
      const seq = new DestructionSequence([]);
      expect(seq.complete).toBe(true);
    });
  });

  describe('getCurrentStage()', () => {
    it('should return current stage name', () => {
      const s1 = makeStage('peel', 1.0);
      const s2 = makeStage('strip', 1.0);
      const seq = new DestructionSequence([s1, s2]);

      expect(seq.getCurrentStage()).toBe('peel');
      seq.update(1.0);
      expect(seq.getCurrentStage()).toBe('strip');
    });

    it('should return empty string when complete', () => {
      const s1 = makeStage('peel', 1.0);
      const seq = new DestructionSequence([s1]);
      seq.update(1.0);
      expect(seq.getCurrentStage()).toBe('');
    });
  });

  describe('getProgress()', () => {
    it('should return correct progress value', () => {
      const s1 = makeStage('peel', 2.0);
      const seq = new DestructionSequence([s1]);

      seq.update(1.0);
      expect(seq.getProgress()).toBeCloseTo(0.5);
    });
  });

  describe('update() after completion is a no-op', () => {
    it('should not call any callbacks after completion', () => {
      const s1 = makeStage('peel', 1.0);
      const seq = new DestructionSequence([s1]);
      seq.update(1.0);
      expect(seq.complete).toBe(true);

      s1.onUpdateMock.mockClear();
      s1.onStartMock.mockClear();
      s1.onEndMock.mockClear();

      seq.update(1.0);
      expect(s1.onStartMock).not.toHaveBeenCalled();
      expect(s1.onUpdateMock).not.toHaveBeenCalled();
      expect(s1.onEndMock).not.toHaveBeenCalled();
    });
  });
});
