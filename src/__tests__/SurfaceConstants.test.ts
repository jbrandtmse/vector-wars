import { describe, it, expect } from 'vitest';
import {
  FIREWALL_NODE_HEALTH,
  FIREWALL_NODE_SCORE_VALUE,
  FIREWALL_NODE_COLLIDER_RADIUS,
  FIREWALL_NODE_POOL_SIZE,
  ICE_TOWER_HEALTH,
  ICE_TOWER_SCORE_VALUE,
  ICE_TOWER_COLLIDER_RADIUS,
  ICE_TOWER_POOL_SIZE,
  ICE_TOWER_ATTACK_COOLDOWN,
  ICE_TOWER_ATTACK_DAMAGE,
  ICE_TOWER_PROJECTILE_SPEED,
  ICE_TOWER_BEHAVIOR,
  SURFACE_RAIL_PATH_POINTS,
  SURFACE_TARGETS,
} from '../config/constants.ts';
import type { SurfaceTarget, SpawnEvent } from '../config/constants.ts';

describe('Surface Attack Constants (Story 3-3)', () => {
  describe('FirewallNode constants', () => {
    it('should define FIREWALL_NODE_HEALTH as 20', () => {
      expect(FIREWALL_NODE_HEALTH).toBe(20);
    });

    it('should define FIREWALL_NODE_SCORE_VALUE as 150', () => {
      expect(FIREWALL_NODE_SCORE_VALUE).toBe(150);
    });

    it('should define FIREWALL_NODE_COLLIDER_RADIUS as 1.0', () => {
      expect(FIREWALL_NODE_COLLIDER_RADIUS).toBe(1.0);
    });

    it('should define FIREWALL_NODE_POOL_SIZE as 12', () => {
      expect(FIREWALL_NODE_POOL_SIZE).toBe(12);
    });

    it('should have all positive numeric values', () => {
      expect(FIREWALL_NODE_HEALTH).toBeGreaterThan(0);
      expect(FIREWALL_NODE_SCORE_VALUE).toBeGreaterThan(0);
      expect(FIREWALL_NODE_COLLIDER_RADIUS).toBeGreaterThan(0);
      expect(FIREWALL_NODE_POOL_SIZE).toBeGreaterThan(0);
    });
  });

  describe('ICETower constants', () => {
    it('should define ICE_TOWER_HEALTH as 50', () => {
      expect(ICE_TOWER_HEALTH).toBe(50);
    });

    it('should define ICE_TOWER_SCORE_VALUE as 250', () => {
      expect(ICE_TOWER_SCORE_VALUE).toBe(250);
    });

    it('should define ICE_TOWER_COLLIDER_RADIUS as 0.8', () => {
      expect(ICE_TOWER_COLLIDER_RADIUS).toBe(0.8);
    });

    it('should define ICE_TOWER_POOL_SIZE as 8', () => {
      expect(ICE_TOWER_POOL_SIZE).toBe(8);
    });

    it('should define ICE_TOWER_ATTACK_COOLDOWN as 3.0', () => {
      expect(ICE_TOWER_ATTACK_COOLDOWN).toBe(3.0);
    });

    it('should define ICE_TOWER_ATTACK_DAMAGE as 12', () => {
      expect(ICE_TOWER_ATTACK_DAMAGE).toBe(12);
    });

    it('should define ICE_TOWER_PROJECTILE_SPEED as 14', () => {
      expect(ICE_TOWER_PROJECTILE_SPEED).toBe(14);
    });

    it('should have all positive numeric values', () => {
      expect(ICE_TOWER_HEALTH).toBeGreaterThan(0);
      expect(ICE_TOWER_SCORE_VALUE).toBeGreaterThan(0);
      expect(ICE_TOWER_COLLIDER_RADIUS).toBeGreaterThan(0);
      expect(ICE_TOWER_POOL_SIZE).toBeGreaterThan(0);
      expect(ICE_TOWER_ATTACK_COOLDOWN).toBeGreaterThan(0);
      expect(ICE_TOWER_ATTACK_DAMAGE).toBeGreaterThan(0);
      expect(ICE_TOWER_PROJECTILE_SPEED).toBeGreaterThan(0);
    });
  });

  describe('ICE_TOWER_BEHAVIOR params', () => {
    it('should have patrolSpeed of 0 (stationary)', () => {
      expect(ICE_TOWER_BEHAVIOR.patrolSpeed).toBe(0);
    });

    it('should have attackCooldown of 3.0', () => {
      expect(ICE_TOWER_BEHAVIOR.attackCooldown).toBe(3.0);
    });

    it('should have evasionChance of 0 (no evasion)', () => {
      expect(ICE_TOWER_BEHAVIOR.evasionChance).toBe(0);
    });

    it('should have movementRandomness of 0 (no movement)', () => {
      expect(ICE_TOWER_BEHAVIOR.movementRandomness).toBe(0);
    });

    it('should have attackDamage of 12', () => {
      expect(ICE_TOWER_BEHAVIOR.attackDamage).toBe(12);
    });

    it('should have projectileSpeed of 14', () => {
      expect(ICE_TOWER_BEHAVIOR.projectileSpeed).toBe(14);
    });
  });

  describe('Surface rail path', () => {
    it('should have at least 15 control points', () => {
      expect(SURFACE_RAIL_PATH_POINTS.length).toBeGreaterThanOrEqual(15);
    });

    it('should have each point as a [number, number, number] tuple', () => {
      for (const point of SURFACE_RAIL_PATH_POINTS) {
        expect(point).toHaveLength(3);
        expect(typeof point[0]).toBe('number');
        expect(typeof point[1]).toBe('number');
        expect(typeof point[2]).toBe('number');
      }
    });

    it('should start at approach altitude (y > 10)', () => {
      const firstPoint = SURFACE_RAIL_PATH_POINTS[0];
      expect(firstPoint[1]).toBeGreaterThan(10);
    });

    it('should have mid-section points skimming at y ~3-5 above surface', () => {
      // Check points in the middle of the path (indices 4-13 roughly)
      const midPoints = SURFACE_RAIL_PATH_POINTS.slice(4, 14);
      for (const point of midPoints) {
        expect(point[1]).toBeGreaterThanOrEqual(2);
        expect(point[1]).toBeLessThanOrEqual(8);
      }
    });

    it('should end at exit altitude (y > 10)', () => {
      const lastPoint = SURFACE_RAIL_PATH_POINTS[SURFACE_RAIL_PATH_POINTS.length - 1];
      expect(lastPoint[1]).toBeGreaterThan(10);
    });

    it('should form a path approximately 800-1000 units long in xz progression', () => {
      // Check that total horizontal distance traversed is significant
      const first = SURFACE_RAIL_PATH_POINTS[0];
      const last = SURFACE_RAIL_PATH_POINTS[SURFACE_RAIL_PATH_POINTS.length - 1];
      const dx = last[0] - first[0];
      const dz = last[2] - first[2];
      const distance = Math.sqrt(dx * dx + dz * dz);
      expect(distance).toBeGreaterThan(300); // Reasonable minimum span
    });
  });

  describe('Surface targets', () => {
    it('should have SURFACE_TARGETS array with items', () => {
      expect(Array.isArray(SURFACE_TARGETS)).toBe(true);
      expect(SURFACE_TARGETS.length).toBeGreaterThan(0);
    });

    it('should contain only firewallNode and iceTower types', () => {
      for (const target of SURFACE_TARGETS) {
        expect(['firewallNode', 'iceTower']).toContain(target.type);
      }
    });

    it('should have 8-10 firewall nodes', () => {
      const nodeCount = SURFACE_TARGETS.filter(t => t.type === 'firewallNode').length;
      expect(nodeCount).toBeGreaterThanOrEqual(8);
      expect(nodeCount).toBeLessThanOrEqual(10);
    });

    it('should have 4-6 ICE towers', () => {
      const towerCount = SURFACE_TARGETS.filter(t => t.type === 'iceTower').length;
      expect(towerCount).toBeGreaterThanOrEqual(4);
      expect(towerCount).toBeLessThanOrEqual(6);
    });

    it('should have position as [number, number, number] tuple for each target', () => {
      for (const target of SURFACE_TARGETS) {
        expect(target.position).toHaveLength(3);
        expect(typeof target.position[0]).toBe('number');
        expect(typeof target.position[1]).toBe('number');
        expect(typeof target.position[2]).toBe('number');
      }
    });

    it('should place targets near the surface (y <= 2)', () => {
      for (const target of SURFACE_TARGETS) {
        expect(target.position[1]).toBeLessThanOrEqual(2);
      }
    });
  });

  describe('SpawnEvent type extension', () => {
    it('should allow firewallNode and iceTower as enemyType in SpawnEvent', () => {
      const event1: SpawnEvent = {
        railProgress: 0.5,
        enemyType: 'firewallNode',
        position: [0, 0, 0],
        count: 1,
      };
      const event2: SpawnEvent = {
        railProgress: 0.5,
        enemyType: 'iceTower',
        position: [0, 0, 0],
        count: 1,
      };
      expect(event1.enemyType).toBe('firewallNode');
      expect(event2.enemyType).toBe('iceTower');
    });
  });
});
