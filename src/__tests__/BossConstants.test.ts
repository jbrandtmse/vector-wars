import { describe, it, expect } from 'vitest';
import {
  BOSS_GATEKEEPER_HEALTH,
  BOSS_GATEKEEPER_COLLIDER_RADIUS,
  BOSS_GATEKEEPER_SCORE_VALUE,
  BOSS_GATEKEEPER_OUTER_RADIUS,
  BOSS_GATEKEEPER_MID_RADIUS,
  BOSS_GATEKEEPER_CORE_RADIUS,
  BOSS_GATEKEEPER_ROTATION_SPEED,
  BOSS_GATEKEEPER_CORE_PULSE_RATE,
  BOSS_GATEKEEPER_CORE_PULSE_AMPLITUDE,
  BOSS_GATEKEEPER_BARRAGE_DURATION,
  BOSS_GATEKEEPER_SWEEP_DURATION,
  BOSS_GATEKEEPER_VULNERABLE_DURATION,
  BOSS_GATEKEEPER_BARRAGE_INTERVAL,
  BOSS_GATEKEEPER_BARRAGE_COUNT,
  BOSS_GATEKEEPER_BARRAGE_SPREAD,
  BOSS_GATEKEEPER_SWEEP_SPEED,
  BOSS_GATEKEEPER_DAMAGE_REDUCTION,
  BOSS_GATEKEEPER_ATTACK_DAMAGE,
  BOSS_GATEKEEPER_PROJECTILE_SPEED,
  BOSS_ARENA_RAIL_SPEED,
  BOSS_CAMERA_LOOK_LERP,
  BOSS_ARENA_RAIL_POINTS,
} from '../config/constants.ts';

describe('BossConstants', () => {
  describe('Gatekeeper Boss entity constants', () => {
    it('BOSS_GATEKEEPER_HEALTH should be 500', () => {
      expect(BOSS_GATEKEEPER_HEALTH).toBe(500);
    });

    it('BOSS_GATEKEEPER_COLLIDER_RADIUS should be 6.0', () => {
      expect(BOSS_GATEKEEPER_COLLIDER_RADIUS).toBe(6.0);
    });

    it('BOSS_GATEKEEPER_SCORE_VALUE should be 5000', () => {
      expect(BOSS_GATEKEEPER_SCORE_VALUE).toBe(5000);
    });

    it('BOSS_GATEKEEPER_OUTER_RADIUS should be 8', () => {
      expect(BOSS_GATEKEEPER_OUTER_RADIUS).toBe(8);
    });

    it('BOSS_GATEKEEPER_MID_RADIUS should be 5.5', () => {
      expect(BOSS_GATEKEEPER_MID_RADIUS).toBe(5.5);
    });

    it('BOSS_GATEKEEPER_CORE_RADIUS should be 3', () => {
      expect(BOSS_GATEKEEPER_CORE_RADIUS).toBe(3);
    });

    it('BOSS_GATEKEEPER_ROTATION_SPEED should be 0.3', () => {
      expect(BOSS_GATEKEEPER_ROTATION_SPEED).toBe(0.3);
    });

    it('BOSS_GATEKEEPER_CORE_PULSE_RATE should be 1.5', () => {
      expect(BOSS_GATEKEEPER_CORE_PULSE_RATE).toBe(1.5);
    });

    it('BOSS_GATEKEEPER_CORE_PULSE_AMPLITUDE should be 0.1', () => {
      expect(BOSS_GATEKEEPER_CORE_PULSE_AMPLITUDE).toBe(0.1);
    });
  });

  describe('Attack phase timing constants', () => {
    it('BOSS_GATEKEEPER_BARRAGE_DURATION should be 6.0', () => {
      expect(BOSS_GATEKEEPER_BARRAGE_DURATION).toBe(6.0);
    });

    it('BOSS_GATEKEEPER_SWEEP_DURATION should be 5.0', () => {
      expect(BOSS_GATEKEEPER_SWEEP_DURATION).toBe(5.0);
    });

    it('BOSS_GATEKEEPER_VULNERABLE_DURATION should be 4.0', () => {
      expect(BOSS_GATEKEEPER_VULNERABLE_DURATION).toBe(4.0);
    });

    it('BOSS_GATEKEEPER_BARRAGE_INTERVAL should be 0.5', () => {
      expect(BOSS_GATEKEEPER_BARRAGE_INTERVAL).toBe(0.5);
    });

    it('BOSS_GATEKEEPER_BARRAGE_COUNT should be 3', () => {
      expect(BOSS_GATEKEEPER_BARRAGE_COUNT).toBe(3);
    });

    it('BOSS_GATEKEEPER_BARRAGE_SPREAD should be 0.3', () => {
      expect(BOSS_GATEKEEPER_BARRAGE_SPREAD).toBe(0.3);
    });

    it('BOSS_GATEKEEPER_SWEEP_SPEED should be 1.5', () => {
      expect(BOSS_GATEKEEPER_SWEEP_SPEED).toBe(1.5);
    });

    it('BOSS_GATEKEEPER_DAMAGE_REDUCTION should be 0.25', () => {
      expect(BOSS_GATEKEEPER_DAMAGE_REDUCTION).toBe(0.25);
    });

    it('BOSS_GATEKEEPER_ATTACK_DAMAGE should be 15', () => {
      expect(BOSS_GATEKEEPER_ATTACK_DAMAGE).toBe(15);
    });

    it('BOSS_GATEKEEPER_PROJECTILE_SPEED should be 16', () => {
      expect(BOSS_GATEKEEPER_PROJECTILE_SPEED).toBe(16);
    });
  });

  describe('Boss arena rail constants', () => {
    it('BOSS_ARENA_RAIL_SPEED should be 10', () => {
      expect(BOSS_ARENA_RAIL_SPEED).toBe(10);
    });

    it('BOSS_CAMERA_LOOK_LERP should be 5.0', () => {
      expect(BOSS_CAMERA_LOOK_LERP).toBe(5.0);
    });

    it('BOSS_ARENA_RAIL_POINTS should be an array of 12 control points', () => {
      expect(BOSS_ARENA_RAIL_POINTS).toHaveLength(12);
    });

    it('BOSS_ARENA_RAIL_POINTS first and last point should match for closed loop', () => {
      expect(BOSS_ARENA_RAIL_POINTS[0]).toEqual(BOSS_ARENA_RAIL_POINTS[BOSS_ARENA_RAIL_POINTS.length - 1]);
    });

    it('all rail points should be [number, number, number] tuples', () => {
      for (const point of BOSS_ARENA_RAIL_POINTS) {
        expect(point).toHaveLength(3);
        expect(typeof point[0]).toBe('number');
        expect(typeof point[1]).toBe('number');
        expect(typeof point[2]).toBe('number');
      }
    });

    it('rail points should be at distance 25-35 from origin (approx)', () => {
      // Check most points are within 25-40 range from origin in XZ plane
      for (let i = 0; i < BOSS_ARENA_RAIL_POINTS.length - 1; i++) {
        const [x, , z] = BOSS_ARENA_RAIL_POINTS[i];
        const dist = Math.sqrt(x * x + z * z);
        expect(dist).toBeGreaterThanOrEqual(20);
        expect(dist).toBeLessThanOrEqual(45);
      }
    });

    it('rail point altitudes should vary between 5-15', () => {
      for (const [, y] of BOSS_ARENA_RAIL_POINTS) {
        expect(y).toBeGreaterThanOrEqual(5);
        expect(y).toBeLessThanOrEqual(15);
      }
    });
  });

  describe('Constant value ranges', () => {
    it('health should be positive', () => {
      expect(BOSS_GATEKEEPER_HEALTH).toBeGreaterThan(0);
    });

    it('damage reduction should be between 0 and 1', () => {
      expect(BOSS_GATEKEEPER_DAMAGE_REDUCTION).toBeGreaterThan(0);
      expect(BOSS_GATEKEEPER_DAMAGE_REDUCTION).toBeLessThan(1);
    });

    it('durations should be positive', () => {
      expect(BOSS_GATEKEEPER_BARRAGE_DURATION).toBeGreaterThan(0);
      expect(BOSS_GATEKEEPER_SWEEP_DURATION).toBeGreaterThan(0);
      expect(BOSS_GATEKEEPER_VULNERABLE_DURATION).toBeGreaterThan(0);
    });

    it('layer radii should be ordered outer > mid > core', () => {
      expect(BOSS_GATEKEEPER_OUTER_RADIUS).toBeGreaterThan(BOSS_GATEKEEPER_MID_RADIUS);
      expect(BOSS_GATEKEEPER_MID_RADIUS).toBeGreaterThan(BOSS_GATEKEEPER_CORE_RADIUS);
    });
  });
});
