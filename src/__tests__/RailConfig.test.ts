import { describe, it, expect } from 'vitest';
import {
  RAIL_SPEED,
  RAIL_PATH_POINTS,
  RAIL_CAMERA_LERP_SPEED,
} from '../config/constants.ts';

describe('Rail Path Configuration', () => {
  describe('RAIL_SPEED', () => {
    it('should be exported and be a positive number', () => {
      expect(typeof RAIL_SPEED).toBe('number');
      expect(RAIL_SPEED).toBeGreaterThan(0);
    });

    it('should be in a comfortable range for dogfight pace (15-20 units/sec)', () => {
      expect(RAIL_SPEED).toBeGreaterThanOrEqual(15);
      expect(RAIL_SPEED).toBeLessThanOrEqual(20);
    });
  });

  describe('RAIL_PATH_POINTS', () => {
    it('should be exported and be an array', () => {
      expect(Array.isArray(RAIL_PATH_POINTS)).toBe(true);
    });

    it('should have at least 8 entries (minimum for a good loop)', () => {
      expect(RAIL_PATH_POINTS.length).toBeGreaterThanOrEqual(8);
    });

    it('should have no more than 12 entries (design spec)', () => {
      expect(RAIL_PATH_POINTS.length).toBeLessThanOrEqual(12);
    });

    it('should have each entry as an array of 3 numbers', () => {
      for (const point of RAIL_PATH_POINTS) {
        expect(Array.isArray(point)).toBe(true);
        expect(point.length).toBe(3);
        expect(typeof point[0]).toBe('number');
        expect(typeof point[1]).toBe('number');
        expect(typeof point[2]).toBe('number');
      }
    });

    it('should have points within expected bounds (+-120 X/Z, +-15 Y)', () => {
      for (const [x, y, z] of RAIL_PATH_POINTS) {
        expect(Math.abs(x)).toBeLessThanOrEqual(120);
        expect(Math.abs(y)).toBeLessThanOrEqual(15);
        expect(Math.abs(z)).toBeLessThanOrEqual(120);
      }
    });
  });

  describe('RAIL_CAMERA_LERP_SPEED', () => {
    it('should be exported and be a positive number', () => {
      expect(typeof RAIL_CAMERA_LERP_SPEED).toBe('number');
      expect(RAIL_CAMERA_LERP_SPEED).toBeGreaterThan(0);
    });
  });
});
