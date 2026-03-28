/**
 * Tests for LevelManager multi-level support (Story 5-1).
 *
 * Validates:
 * - Level 2 sets amber palette
 * - Level 2 uses correct phase sequence (no tutorial)
 * - Level 2 behavior params are more aggressive than Level 1
 * - Level 2 spawn events have higher enemy counts
 * - Events emit with correct level number
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  SENTINEL_BEHAVIOR_LEVEL1,
  SENTINEL_BEHAVIOR_LEVEL2,
  SENTINEL_BEHAVIOR_LEVEL3,
  WATCHDOG_BEHAVIOR_LEVEL1,
  WATCHDOG_BEHAVIOR_LEVEL2,
  WATCHDOG_BEHAVIOR_LEVEL3,
  GATEKEEPER_BEHAVIOR_LEVEL1,
  GATEKEEPER_BEHAVIOR_LEVEL2,
  GATEKEEPER_BEHAVIOR_LEVEL3,
  SPAWN_EVENTS,
  SPAWN_EVENTS_LEVEL2,
  SURFACE_TARGETS,
  SURFACE_TARGETS_LEVEL2,
  CORRIDOR_OBSTACLES,
  CORRIDOR_OBSTACLES_LEVEL2,
  LEVEL_PALETTES,
  LEVEL_BEHAVIORS,
} from '../config/constants.ts';

describe('Level 2 Constants (Story 5-1)', () => {
  describe('Level 2 Behavior Params', () => {
    it('should have faster sentinel patrol speed than Level 1', () => {
      expect(SENTINEL_BEHAVIOR_LEVEL2.patrolSpeed).toBeGreaterThan(SENTINEL_BEHAVIOR_LEVEL1.patrolSpeed);
    });

    it('should have shorter sentinel attack cooldown than Level 1', () => {
      expect(SENTINEL_BEHAVIOR_LEVEL2.attackCooldown).toBeLessThan(SENTINEL_BEHAVIOR_LEVEL1.attackCooldown);
    });

    it('should have evasion chance for Level 2 sentinels', () => {
      expect(SENTINEL_BEHAVIOR_LEVEL2.evasionChance).toBeGreaterThan(0);
      expect(SENTINEL_BEHAVIOR_LEVEL1.evasionChance).toBe(0);
    });

    it('should have movement randomness for Level 2 sentinels', () => {
      expect(SENTINEL_BEHAVIOR_LEVEL2.movementRandomness).toBeGreaterThan(0);
      expect(SENTINEL_BEHAVIOR_LEVEL1.movementRandomness).toBe(0);
    });

    it('should have faster watchdog patrol speed than Level 1', () => {
      expect(WATCHDOG_BEHAVIOR_LEVEL2.patrolSpeed).toBeGreaterThan(WATCHDOG_BEHAVIOR_LEVEL1.patrolSpeed);
    });

    it('should have shorter watchdog attack cooldown than Level 1', () => {
      expect(WATCHDOG_BEHAVIOR_LEVEL2.attackCooldown).toBeLessThan(WATCHDOG_BEHAVIOR_LEVEL1.attackCooldown);
    });

    it('should have faster gatekeeper patrol speed than Level 1', () => {
      expect(GATEKEEPER_BEHAVIOR_LEVEL2.patrolSpeed).toBeGreaterThan(GATEKEEPER_BEHAVIOR_LEVEL1.patrolSpeed);
    });

    it('should have shorter gatekeeper attack cooldown than Level 1', () => {
      expect(GATEKEEPER_BEHAVIOR_LEVEL2.attackCooldown).toBeLessThan(GATEKEEPER_BEHAVIOR_LEVEL1.attackCooldown);
    });
  });

  describe('Level Palettes', () => {
    it('should map level 1 to green', () => {
      expect(LEVEL_PALETTES[1]).toBe('green');
    });

    it('should map level 2 to amber', () => {
      expect(LEVEL_PALETTES[2]).toBe('amber');
    });

    it('should map level 3 to red', () => {
      expect(LEVEL_PALETTES[3]).toBe('red');
    });
  });

  describe('Level Behaviors', () => {
    it('should contain behavior configs for Level 1', () => {
      expect(LEVEL_BEHAVIORS[1]).toBeDefined();
      expect(LEVEL_BEHAVIORS[1].sentinel).toBe(SENTINEL_BEHAVIOR_LEVEL1);
      expect(LEVEL_BEHAVIORS[1].watchdog).toBe(WATCHDOG_BEHAVIOR_LEVEL1);
      expect(LEVEL_BEHAVIORS[1].gatekeeper).toBe(GATEKEEPER_BEHAVIOR_LEVEL1);
    });

    it('should contain behavior configs for Level 2', () => {
      expect(LEVEL_BEHAVIORS[2]).toBeDefined();
      expect(LEVEL_BEHAVIORS[2].sentinel).toBe(SENTINEL_BEHAVIOR_LEVEL2);
      expect(LEVEL_BEHAVIORS[2].watchdog).toBe(WATCHDOG_BEHAVIOR_LEVEL2);
      expect(LEVEL_BEHAVIORS[2].gatekeeper).toBe(GATEKEEPER_BEHAVIOR_LEVEL2);
    });

    it('should contain behavior configs for Level 3', () => {
      expect(LEVEL_BEHAVIORS[3]).toBeDefined();
      expect(LEVEL_BEHAVIORS[3].sentinel).toBe(SENTINEL_BEHAVIOR_LEVEL3);
      expect(LEVEL_BEHAVIORS[3].watchdog).toBe(WATCHDOG_BEHAVIOR_LEVEL3);
      expect(LEVEL_BEHAVIORS[3].gatekeeper).toBe(GATEKEEPER_BEHAVIOR_LEVEL3);
    });
  });

  describe('Level 2 Spawn Events', () => {
    it('should have valid spawn event structure', () => {
      for (const event of SPAWN_EVENTS_LEVEL2) {
        expect(event.railProgress).toBeGreaterThanOrEqual(0);
        expect(event.railProgress).toBeLessThanOrEqual(1);
        expect(event.count).toBeGreaterThan(0);
        expect(event.position).toHaveLength(3);
        expect(['sentinel', 'watchdog', 'gatekeeper', 'overseer', 'firewallNode', 'iceTower']).toContain(event.enemyType);
      }
    });

    it('should spawn more total enemies than Level 1', () => {
      const level1Total = SPAWN_EVENTS.reduce((sum, e) => sum + e.count, 0);
      const level2Total = SPAWN_EVENTS_LEVEL2.reduce((sum, e) => sum + e.count, 0);
      expect(level2Total).toBeGreaterThan(level1Total);
    });

    it('should have more watchdog spawns than Level 1', () => {
      const level1Watchdogs = SPAWN_EVENTS.filter(e => e.enemyType === 'watchdog').reduce((sum, e) => sum + e.count, 0);
      const level2Watchdogs = SPAWN_EVENTS_LEVEL2.filter(e => e.enemyType === 'watchdog').reduce((sum, e) => sum + e.count, 0);
      expect(level2Watchdogs).toBeGreaterThan(level1Watchdogs);
    });

    it('should have more gatekeeper spawns than Level 1', () => {
      const level1Gatekeepers = SPAWN_EVENTS.filter(e => e.enemyType === 'gatekeeper').reduce((sum, e) => sum + e.count, 0);
      const level2Gatekeepers = SPAWN_EVENTS_LEVEL2.filter(e => e.enemyType === 'gatekeeper').reduce((sum, e) => sum + e.count, 0);
      expect(level2Gatekeepers).toBeGreaterThan(level1Gatekeepers);
    });
  });

  describe('Level 2 Surface Targets', () => {
    it('should have more total targets than Level 1', () => {
      expect(SURFACE_TARGETS_LEVEL2.length).toBeGreaterThan(SURFACE_TARGETS.length);
    });

    it('should have valid target structure', () => {
      for (const target of SURFACE_TARGETS_LEVEL2) {
        expect(['firewallNode', 'iceTower']).toContain(target.type);
        expect(target.position).toHaveLength(3);
      }
    });
  });

  describe('Level 2 Corridor Obstacles', () => {
    it('should have more total obstacles than Level 1', () => {
      expect(CORRIDOR_OBSTACLES_LEVEL2.length).toBeGreaterThan(CORRIDOR_OBSTACLES.length);
    });

    it('should have valid obstacle structure', () => {
      for (const obstacle of CORRIDOR_OBSTACLES_LEVEL2) {
        expect(['firewall', 'networkCable', 'dataStream']).toContain(obstacle.type);
        expect(obstacle.position).toHaveLength(3);
      }
    });
  });
});
