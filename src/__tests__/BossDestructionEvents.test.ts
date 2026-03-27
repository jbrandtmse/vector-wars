import { describe, it, expect, vi } from 'vitest';
import { eventBus } from '../core/GameEvents.ts';
import type {
  BossDestructionStageEvent,
  BossDestroyedEvent,
} from '../core/GameEvents.ts';

describe('BossDestructionEvents (Story 3-9)', () => {
  describe('GameEvents interface includes bossDestructionStage', () => {
    it('should accept bossDestructionStage subscriptions', () => {
      const handler = vi.fn();
      expect(() => eventBus.on('bossDestructionStage', handler)).not.toThrow();
      eventBus.off('bossDestructionStage', handler);
    });

    it('should emit and receive bossDestructionStage events', () => {
      const handler = vi.fn();
      eventBus.on('bossDestructionStage', handler);

      const payload: BossDestructionStageEvent = {
        stage: 'peel',
        progress: 0.5,
        position: { x: 1, y: 2, z: 3 },
      };
      eventBus.emit('bossDestructionStage', payload);

      expect(handler).toHaveBeenCalledWith(payload);
      eventBus.off('bossDestructionStage', handler);
    });
  });

  describe('GameEvents interface includes bossDestroyed', () => {
    it('should accept bossDestroyed subscriptions', () => {
      const handler = vi.fn();
      expect(() => eventBus.on('bossDestroyed', handler)).not.toThrow();
      eventBus.off('bossDestroyed', handler);
    });

    it('should emit and receive bossDestroyed events', () => {
      const handler = vi.fn();
      eventBus.on('bossDestroyed', handler);

      const payload: BossDestroyedEvent = {
        position: { x: 10, y: 20, z: 30 },
        scoreValue: 5000,
      };
      eventBus.emit('bossDestroyed', payload);

      expect(handler).toHaveBeenCalledWith(payload);
      eventBus.off('bossDestroyed', handler);
    });
  });

  describe('Event payloads have correct shape', () => {
    it('bossDestructionStage payload should have stage, progress, position', () => {
      const handler = vi.fn();
      eventBus.on('bossDestructionStage', handler);

      eventBus.emit('bossDestructionStage', {
        stage: 'shatter',
        progress: 0.75,
        position: { x: 0, y: 0, z: 0 },
      });

      const payload = handler.mock.calls[0][0] as BossDestructionStageEvent;
      expect(payload).toHaveProperty('stage');
      expect(payload).toHaveProperty('progress');
      expect(payload).toHaveProperty('position');
      expect(typeof payload.stage).toBe('string');
      expect(typeof payload.progress).toBe('number');
      expect(typeof payload.position.x).toBe('number');
      expect(typeof payload.position.y).toBe('number');
      expect(typeof payload.position.z).toBe('number');

      eventBus.off('bossDestructionStage', handler);
    });

    it('bossDestroyed payload should have position and scoreValue', () => {
      const handler = vi.fn();
      eventBus.on('bossDestroyed', handler);

      eventBus.emit('bossDestroyed', {
        position: { x: 5, y: 10, z: 15 },
        scoreValue: 3000,
      });

      const payload = handler.mock.calls[0][0] as BossDestroyedEvent;
      expect(payload).toHaveProperty('position');
      expect(payload).toHaveProperty('scoreValue');
      expect(typeof payload.scoreValue).toBe('number');
      expect(typeof payload.position.x).toBe('number');

      eventBus.off('bossDestroyed', handler);
    });
  });
});
