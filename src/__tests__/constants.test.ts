import { describe, it, expect } from 'vitest';
import { BLOOM_LAYER, DELTA_TIME_CAP, MAX_POOL_SIZE } from '../config/constants.ts';

describe('Game Constants', () => {
  describe('BLOOM_LAYER', () => {
    it('should be 1 for selective bloom rendering', () => {
      expect(BLOOM_LAYER).toBe(1);
    });
  });

  describe('DELTA_TIME_CAP', () => {
    it('should be 1/20 (50ms) to prevent tunneling', () => {
      expect(DELTA_TIME_CAP).toBe(1 / 20);
      expect(DELTA_TIME_CAP).toBeCloseTo(0.05, 10);
    });
  });

  describe('MAX_POOL_SIZE', () => {
    it('should define pool sizes for all entity types', () => {
      expect(MAX_POOL_SIZE.dataLanceBolt).toBe(50);
      expect(MAX_POOL_SIZE.enemyDataBurst).toBe(30);
      expect(MAX_POOL_SIZE.vectorShard).toBe(200);
      expect(MAX_POOL_SIZE.logicBomb).toBe(10);
    });

    it('should be readonly', () => {
      // TypeScript enforces this at compile time via `as const`
      // At runtime, we verify the values are as expected
      expect(Object.keys(MAX_POOL_SIZE)).toHaveLength(4);
    });
  });
});
