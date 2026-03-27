import { describe, it, expect } from 'vitest';
import {
  CORRIDOR_OBSTACLE_DAMAGE,
  CORRIDOR_HIT_COOLDOWN,
  FIREWALL_CLOSE_DURATION,
  FIREWALL_OPEN_DURATION,
  FIREWALL_COLLIDER_DEPTH,
  NETWORK_CABLE_COLLIDER_HEIGHT,
  DATA_STREAM_SPEED,
  DATA_STREAM_COLLIDER_SIZE,
  CORRIDOR_WALL_WIDTH,
  CORRIDOR_WALL_MIN_WIDTH,
  CORRIDOR_HEIGHT,
  CORRIDOR_LENGTH,
  CORRIDOR_RAIL_SPEED_MULTIPLIER,
  CORRIDOR_RAIL_PATH_POINTS,
  CORRIDOR_OBSTACLES,
} from '../config/constants.ts';
import type { CorridorObstacleType, CorridorObstacleConfig } from '../config/constants.ts';

describe('Corridor Constants (Story 3-4)', () => {
  describe('Corridor dimension and damage constants', () => {
    it('should export all corridor constants as positive numbers', () => {
      expect(CORRIDOR_OBSTACLE_DAMAGE).toBe(15);
      expect(CORRIDOR_HIT_COOLDOWN).toBe(0.8);
      expect(FIREWALL_CLOSE_DURATION).toBe(1.5);
      expect(FIREWALL_OPEN_DURATION).toBe(2.0);
      expect(FIREWALL_COLLIDER_DEPTH).toBe(1.0);
      expect(NETWORK_CABLE_COLLIDER_HEIGHT).toBe(1.5);
      expect(DATA_STREAM_SPEED).toBe(6.0);
      expect(DATA_STREAM_COLLIDER_SIZE).toBe(1.5);
      expect(CORRIDOR_WALL_WIDTH).toBe(12.0);
      expect(CORRIDOR_WALL_MIN_WIDTH).toBe(6.0);
      expect(CORRIDOR_HEIGHT).toBe(8.0);
      expect(CORRIDOR_LENGTH).toBe(700);
      expect(CORRIDOR_RAIL_SPEED_MULTIPLIER).toBe(1.2);
    });

    it('should have all constant values greater than zero', () => {
      const constants = [
        CORRIDOR_OBSTACLE_DAMAGE, CORRIDOR_HIT_COOLDOWN,
        FIREWALL_CLOSE_DURATION, FIREWALL_OPEN_DURATION,
        FIREWALL_COLLIDER_DEPTH, NETWORK_CABLE_COLLIDER_HEIGHT,
        DATA_STREAM_SPEED, DATA_STREAM_COLLIDER_SIZE,
        CORRIDOR_WALL_WIDTH, CORRIDOR_WALL_MIN_WIDTH,
        CORRIDOR_HEIGHT, CORRIDOR_LENGTH, CORRIDOR_RAIL_SPEED_MULTIPLIER,
      ];
      for (const c of constants) {
        expect(c).toBeGreaterThan(0);
      }
    });

    it('should have corridor narrowing (MIN_WIDTH < WALL_WIDTH)', () => {
      expect(CORRIDOR_WALL_MIN_WIDTH).toBeLessThan(CORRIDOR_WALL_WIDTH);
    });
  });

  describe('Corridor rail path points', () => {
    it('should have 12+ control points', () => {
      expect(CORRIDOR_RAIL_PATH_POINTS.length).toBeGreaterThanOrEqual(12);
    });

    it('should have all y-values near corridor center altitude (3-5)', () => {
      for (const pt of CORRIDOR_RAIL_PATH_POINTS) {
        expect(pt[1]).toBeGreaterThanOrEqual(3);
        expect(pt[1]).toBeLessThanOrEqual(5);
      }
    });

    it('should start at z=0 and end at negative z (forward direction)', () => {
      expect(CORRIDOR_RAIL_PATH_POINTS[0][2]).toBe(0);
      const lastZ = CORRIDOR_RAIL_PATH_POINTS[CORRIDOR_RAIL_PATH_POINTS.length - 1][2];
      expect(lastZ).toBeLessThan(0);
    });

    it('should have each point as a [number, number, number] tuple', () => {
      for (const pt of CORRIDOR_RAIL_PATH_POINTS) {
        expect(pt).toHaveLength(3);
        expect(typeof pt[0]).toBe('number');
        expect(typeof pt[1]).toBe('number');
        expect(typeof pt[2]).toBe('number');
      }
    });
  });

  describe('Corridor obstacle placement', () => {
    it('should have CORRIDOR_OBSTACLES array defined', () => {
      expect(Array.isArray(CORRIDOR_OBSTACLES)).toBe(true);
      expect(CORRIDOR_OBSTACLES.length).toBeGreaterThan(0);
    });

    it('should have correct obstacle types', () => {
      const validTypes: CorridorObstacleType[] = ['firewall', 'networkCable', 'dataStream'];
      for (const obs of CORRIDOR_OBSTACLES) {
        expect(validTypes).toContain(obs.type);
      }
    });

    it('should have approximately correct obstacle counts', () => {
      const firewalls = CORRIDOR_OBSTACLES.filter((o: CorridorObstacleConfig) => o.type === 'firewall');
      const cables = CORRIDOR_OBSTACLES.filter((o: CorridorObstacleConfig) => o.type === 'networkCable');
      const streams = CORRIDOR_OBSTACLES.filter((o: CorridorObstacleConfig) => o.type === 'dataStream');

      // ~5-6 firewalls, 4-5 cables, 3-4 data streams
      expect(firewalls.length).toBeGreaterThanOrEqual(5);
      expect(cables.length).toBeGreaterThanOrEqual(4);
      expect(streams.length).toBeGreaterThanOrEqual(3);
    });

    it('should have all obstacles with valid position tuples', () => {
      for (const obs of CORRIDOR_OBSTACLES) {
        expect(obs.position).toHaveLength(3);
        expect(typeof obs.position[0]).toBe('number');
        expect(typeof obs.position[1]).toBe('number');
        expect(typeof obs.position[2]).toBe('number');
      }
    });

    it('should have firewalls with phaseOffset between 0 and 1', () => {
      const firewalls = CORRIDOR_OBSTACLES.filter((o: CorridorObstacleConfig) => o.type === 'firewall');
      for (const fw of firewalls) {
        expect(fw.phaseOffset).toBeDefined();
        expect(fw.phaseOffset).toBeGreaterThanOrEqual(0);
        expect(fw.phaseOffset).toBeLessThanOrEqual(1);
      }
    });

    it('should have data streams with direction specified', () => {
      const streams = CORRIDOR_OBSTACLES.filter((o: CorridorObstacleConfig) => o.type === 'dataStream');
      for (const ds of streams) {
        expect(ds.direction).toBeDefined();
        expect(['left', 'right']).toContain(ds.direction);
      }
    });
  });
});
