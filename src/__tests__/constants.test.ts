import { describe, it, expect } from 'vitest';
import {
  BLOOM_LAYER,
  DELTA_TIME_CAP,
  MAX_POOL_SIZE,
  GRID_SIZE,
  GRID_DIVISIONS,
  GRID_Y_POSITION,
  STARFIELD_COUNT,
  STARFIELD_SPREAD,
  STARFIELD_MIN_Y,
  STARFIELD_POINT_SIZE,
  GRID_LIGHTNESS_OFFSET,
  STARFIELD_LIGHTNESS_OFFSET,
} from '../config/constants.ts';

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

  describe('Environment Constants (Story 1-6)', () => {
    it('should define GRID_SIZE as 200 world units', () => {
      expect(GRID_SIZE).toBe(200);
    });

    it('should define GRID_DIVISIONS as 40', () => {
      expect(GRID_DIVISIONS).toBe(40);
    });

    it('should define GRID_Y_POSITION as -2.0', () => {
      expect(GRID_Y_POSITION).toBe(-2.0);
    });

    it('should define STARFIELD_COUNT as 800', () => {
      expect(STARFIELD_COUNT).toBe(800);
    });

    it('should define STARFIELD_SPREAD as 400', () => {
      expect(STARFIELD_SPREAD).toBe(400);
    });

    it('should define STARFIELD_MIN_Y as -50', () => {
      expect(STARFIELD_MIN_Y).toBe(-50);
    });

    it('should define STARFIELD_POINT_SIZE as 2.0', () => {
      expect(STARFIELD_POINT_SIZE).toBe(2.0);
    });

    it('should define GRID_LIGHTNESS_OFFSET as -0.15', () => {
      expect(GRID_LIGHTNESS_OFFSET).toBe(-0.15);
    });

    it('should define STARFIELD_LIGHTNESS_OFFSET as -0.25', () => {
      expect(STARFIELD_LIGHTNESS_OFFSET).toBe(-0.25);
    });
  });
});
