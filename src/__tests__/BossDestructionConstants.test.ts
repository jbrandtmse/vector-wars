import { describe, it, expect } from 'vitest';
import {
  BOSS_DESTRUCTION_PEEL_DURATION,
  BOSS_DESTRUCTION_STRIP_DURATION,
  BOSS_DESTRUCTION_SHATTER_DURATION,
  BOSS_DESTRUCTION_PEEL_SCALE_END,
  BOSS_DESTRUCTION_STRIP_SCALE_END,
  BOSS_DESTRUCTION_ROTATION_MULTIPLIER_PEEL,
  BOSS_DESTRUCTION_ROTATION_MULTIPLIER_STRIP,
  BOSS_DESTRUCTION_SHATTER_PULSE_FREQUENCY,
  BOSS_DESTRUCTION_SHATTER_EXPLOSION_COUNT,
  BOSS_DESTRUCTION_SHAKE_PEEL,
  BOSS_DESTRUCTION_SHAKE_STRIP,
  BOSS_DESTRUCTION_SHAKE_SHATTER,
} from '../config/constants.ts';

describe('BossDestructionConstants (Story 3-9)', () => {
  describe('All BOSS_DESTRUCTION_* constants are defined', () => {
    it('BOSS_DESTRUCTION_PEEL_DURATION should be defined', () => {
      expect(BOSS_DESTRUCTION_PEEL_DURATION).toBeDefined();
    });

    it('BOSS_DESTRUCTION_STRIP_DURATION should be defined', () => {
      expect(BOSS_DESTRUCTION_STRIP_DURATION).toBeDefined();
    });

    it('BOSS_DESTRUCTION_SHATTER_DURATION should be defined', () => {
      expect(BOSS_DESTRUCTION_SHATTER_DURATION).toBeDefined();
    });

    it('BOSS_DESTRUCTION_PEEL_SCALE_END should be defined', () => {
      expect(BOSS_DESTRUCTION_PEEL_SCALE_END).toBeDefined();
    });

    it('BOSS_DESTRUCTION_STRIP_SCALE_END should be defined', () => {
      expect(BOSS_DESTRUCTION_STRIP_SCALE_END).toBeDefined();
    });

    it('BOSS_DESTRUCTION_ROTATION_MULTIPLIER_PEEL should be defined', () => {
      expect(BOSS_DESTRUCTION_ROTATION_MULTIPLIER_PEEL).toBeDefined();
    });

    it('BOSS_DESTRUCTION_ROTATION_MULTIPLIER_STRIP should be defined', () => {
      expect(BOSS_DESTRUCTION_ROTATION_MULTIPLIER_STRIP).toBeDefined();
    });

    it('BOSS_DESTRUCTION_SHATTER_PULSE_FREQUENCY should be defined', () => {
      expect(BOSS_DESTRUCTION_SHATTER_PULSE_FREQUENCY).toBeDefined();
    });

    it('BOSS_DESTRUCTION_SHATTER_EXPLOSION_COUNT should be defined', () => {
      expect(BOSS_DESTRUCTION_SHATTER_EXPLOSION_COUNT).toBeDefined();
    });

    it('BOSS_DESTRUCTION_SHAKE_PEEL should be defined', () => {
      expect(BOSS_DESTRUCTION_SHAKE_PEEL).toBeDefined();
    });

    it('BOSS_DESTRUCTION_SHAKE_STRIP should be defined', () => {
      expect(BOSS_DESTRUCTION_SHAKE_STRIP).toBeDefined();
    });

    it('BOSS_DESTRUCTION_SHAKE_SHATTER should be defined', () => {
      expect(BOSS_DESTRUCTION_SHAKE_SHATTER).toBeDefined();
    });
  });

  describe('Constants have expected types (number)', () => {
    it('all destruction constants should be numbers', () => {
      expect(typeof BOSS_DESTRUCTION_PEEL_DURATION).toBe('number');
      expect(typeof BOSS_DESTRUCTION_STRIP_DURATION).toBe('number');
      expect(typeof BOSS_DESTRUCTION_SHATTER_DURATION).toBe('number');
      expect(typeof BOSS_DESTRUCTION_PEEL_SCALE_END).toBe('number');
      expect(typeof BOSS_DESTRUCTION_STRIP_SCALE_END).toBe('number');
      expect(typeof BOSS_DESTRUCTION_ROTATION_MULTIPLIER_PEEL).toBe('number');
      expect(typeof BOSS_DESTRUCTION_ROTATION_MULTIPLIER_STRIP).toBe('number');
      expect(typeof BOSS_DESTRUCTION_SHATTER_PULSE_FREQUENCY).toBe('number');
      expect(typeof BOSS_DESTRUCTION_SHATTER_EXPLOSION_COUNT).toBe('number');
      expect(typeof BOSS_DESTRUCTION_SHAKE_PEEL).toBe('number');
      expect(typeof BOSS_DESTRUCTION_SHAKE_STRIP).toBe('number');
      expect(typeof BOSS_DESTRUCTION_SHAKE_SHATTER).toBe('number');
    });
  });

  describe('Durations are positive', () => {
    it('BOSS_DESTRUCTION_PEEL_DURATION should be positive', () => {
      expect(BOSS_DESTRUCTION_PEEL_DURATION).toBeGreaterThan(0);
    });

    it('BOSS_DESTRUCTION_STRIP_DURATION should be positive', () => {
      expect(BOSS_DESTRUCTION_STRIP_DURATION).toBeGreaterThan(0);
    });

    it('BOSS_DESTRUCTION_SHATTER_DURATION should be positive', () => {
      expect(BOSS_DESTRUCTION_SHATTER_DURATION).toBeGreaterThan(0);
    });
  });

  describe('Total sequence duration', () => {
    it('total should be PEEL + STRIP + SHATTER = 5.5 seconds', () => {
      const total = BOSS_DESTRUCTION_PEEL_DURATION
        + BOSS_DESTRUCTION_STRIP_DURATION
        + BOSS_DESTRUCTION_SHATTER_DURATION;
      expect(total).toBe(5.5);
    });
  });

  describe('Specific constant values', () => {
    it('BOSS_DESTRUCTION_PEEL_DURATION should be 2.0', () => {
      expect(BOSS_DESTRUCTION_PEEL_DURATION).toBe(2.0);
    });

    it('BOSS_DESTRUCTION_STRIP_DURATION should be 1.5', () => {
      expect(BOSS_DESTRUCTION_STRIP_DURATION).toBe(1.5);
    });

    it('BOSS_DESTRUCTION_SHATTER_DURATION should be 2.0', () => {
      expect(BOSS_DESTRUCTION_SHATTER_DURATION).toBe(2.0);
    });

    it('BOSS_DESTRUCTION_PEEL_SCALE_END should be 2.0', () => {
      expect(BOSS_DESTRUCTION_PEEL_SCALE_END).toBe(2.0);
    });

    it('BOSS_DESTRUCTION_STRIP_SCALE_END should be 1.5', () => {
      expect(BOSS_DESTRUCTION_STRIP_SCALE_END).toBe(1.5);
    });

    it('BOSS_DESTRUCTION_ROTATION_MULTIPLIER_PEEL should be 3.0', () => {
      expect(BOSS_DESTRUCTION_ROTATION_MULTIPLIER_PEEL).toBe(3.0);
    });

    it('BOSS_DESTRUCTION_ROTATION_MULTIPLIER_STRIP should be 5.0', () => {
      expect(BOSS_DESTRUCTION_ROTATION_MULTIPLIER_STRIP).toBe(5.0);
    });

    it('BOSS_DESTRUCTION_SHATTER_PULSE_FREQUENCY should be 20', () => {
      expect(BOSS_DESTRUCTION_SHATTER_PULSE_FREQUENCY).toBe(20);
    });

    it('BOSS_DESTRUCTION_SHATTER_EXPLOSION_COUNT should be 5', () => {
      expect(BOSS_DESTRUCTION_SHATTER_EXPLOSION_COUNT).toBe(5);
    });

    it('BOSS_DESTRUCTION_SHAKE_PEEL should be 0.3', () => {
      expect(BOSS_DESTRUCTION_SHAKE_PEEL).toBe(0.3);
    });

    it('BOSS_DESTRUCTION_SHAKE_STRIP should be 0.5', () => {
      expect(BOSS_DESTRUCTION_SHAKE_STRIP).toBe(0.5);
    });

    it('BOSS_DESTRUCTION_SHAKE_SHATTER should be 0.8', () => {
      expect(BOSS_DESTRUCTION_SHAKE_SHATTER).toBe(0.8);
    });
  });

  describe('Shake intensity ordering', () => {
    it('shake intensities should increase: peel < strip < shatter', () => {
      expect(BOSS_DESTRUCTION_SHAKE_PEEL).toBeLessThan(BOSS_DESTRUCTION_SHAKE_STRIP);
      expect(BOSS_DESTRUCTION_SHAKE_STRIP).toBeLessThan(BOSS_DESTRUCTION_SHAKE_SHATTER);
    });
  });
});
