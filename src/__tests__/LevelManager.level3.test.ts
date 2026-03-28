/**
 * Tests for Level 3 constants and LevelManager Level 3 support (Story 5-3).
 *
 * Validates:
 * - Level 3 sets red palette
 * - Level 3 behavior params reflect "Glitchy" profile (more extreme than Level 2)
 * - Level 3 spawn events have higher enemy counts than Level 2
 * - Level 3 surface targets and corridor obstacles have higher counts than Level 2
 * - LEVEL_PALETTES, LEVEL_BEHAVIORS include Level 3 entries
 * - Level 3 handler voice lines are registered
 */
import { describe, it, expect } from 'vitest';
import {
  SENTINEL_BEHAVIOR_LEVEL2,
  SENTINEL_BEHAVIOR_LEVEL3,
  WATCHDOG_BEHAVIOR_LEVEL2,
  WATCHDOG_BEHAVIOR_LEVEL3,
  GATEKEEPER_BEHAVIOR_LEVEL2,
  GATEKEEPER_BEHAVIOR_LEVEL3,
  SPAWN_EVENTS_LEVEL2,
  SPAWN_EVENTS_LEVEL3,
  SURFACE_TARGETS_LEVEL2,
  SURFACE_TARGETS_LEVEL3,
  CORRIDOR_OBSTACLES_LEVEL2,
  CORRIDOR_OBSTACLES_LEVEL3,
  LEVEL_PALETTES,
  LEVEL_BEHAVIORS,
} from '../config/constants.ts';
import { VoiceLineGenerator } from '../audio/VoiceLineGenerator.ts';

describe('Level 3 Constants (Story 5-3)', () => {
  describe('Level 3 Behavior Params — Glitchy Profile', () => {
    it('should have higher evasion chance than Level 2 for sentinels', () => {
      expect(SENTINEL_BEHAVIOR_LEVEL3.evasionChance).toBeGreaterThan(SENTINEL_BEHAVIOR_LEVEL2.evasionChance);
    });

    it('should have higher movement randomness than Level 2 for sentinels', () => {
      expect(SENTINEL_BEHAVIOR_LEVEL3.movementRandomness).toBeGreaterThan(SENTINEL_BEHAVIOR_LEVEL2.movementRandomness);
    });

    it('should have shorter sentinel attack cooldown than Level 2', () => {
      expect(SENTINEL_BEHAVIOR_LEVEL3.attackCooldown).toBeLessThan(SENTINEL_BEHAVIOR_LEVEL2.attackCooldown);
    });

    it('should have higher sentinel attack damage than Level 2', () => {
      expect(SENTINEL_BEHAVIOR_LEVEL3.attackDamage).toBeGreaterThan(SENTINEL_BEHAVIOR_LEVEL2.attackDamage);
    });

    it('should have higher sentinel projectile speed than Level 2', () => {
      expect(SENTINEL_BEHAVIOR_LEVEL3.projectileSpeed).toBeGreaterThan(SENTINEL_BEHAVIOR_LEVEL2.projectileSpeed);
    });

    it('should have higher evasion chance than Level 2 for watchdogs', () => {
      expect(WATCHDOG_BEHAVIOR_LEVEL3.evasionChance).toBeGreaterThan(WATCHDOG_BEHAVIOR_LEVEL2.evasionChance);
    });

    it('should have higher movement randomness than Level 2 for watchdogs', () => {
      expect(WATCHDOG_BEHAVIOR_LEVEL3.movementRandomness).toBeGreaterThan(WATCHDOG_BEHAVIOR_LEVEL2.movementRandomness);
    });

    it('should have shorter watchdog attack cooldown than Level 2', () => {
      expect(WATCHDOG_BEHAVIOR_LEVEL3.attackCooldown).toBeLessThan(WATCHDOG_BEHAVIOR_LEVEL2.attackCooldown);
    });

    it('should have higher watchdog attack damage than Level 2', () => {
      expect(WATCHDOG_BEHAVIOR_LEVEL3.attackDamage).toBeGreaterThan(WATCHDOG_BEHAVIOR_LEVEL2.attackDamage);
    });

    it('should have higher evasion chance than Level 2 for gatekeepers', () => {
      expect(GATEKEEPER_BEHAVIOR_LEVEL3.evasionChance).toBeGreaterThan(GATEKEEPER_BEHAVIOR_LEVEL2.evasionChance);
    });

    it('should have higher movement randomness than Level 2 for gatekeepers', () => {
      expect(GATEKEEPER_BEHAVIOR_LEVEL3.movementRandomness).toBeGreaterThan(GATEKEEPER_BEHAVIOR_LEVEL2.movementRandomness);
    });

    it('should have shorter gatekeeper attack cooldown than Level 2', () => {
      expect(GATEKEEPER_BEHAVIOR_LEVEL3.attackCooldown).toBeLessThan(GATEKEEPER_BEHAVIOR_LEVEL2.attackCooldown);
    });

    it('should have higher gatekeeper attack damage than Level 2', () => {
      expect(GATEKEEPER_BEHAVIOR_LEVEL3.attackDamage).toBeGreaterThan(GATEKEEPER_BEHAVIOR_LEVEL2.attackDamage);
    });

    it('should have 0.5 evasion chance for all Level 3 enemy types', () => {
      expect(SENTINEL_BEHAVIOR_LEVEL3.evasionChance).toBe(0.5);
      expect(WATCHDOG_BEHAVIOR_LEVEL3.evasionChance).toBe(0.5);
      expect(GATEKEEPER_BEHAVIOR_LEVEL3.evasionChance).toBe(0.5);
    });

    it('should have 0.5 movement randomness for all Level 3 enemy types', () => {
      expect(SENTINEL_BEHAVIOR_LEVEL3.movementRandomness).toBe(0.5);
      expect(WATCHDOG_BEHAVIOR_LEVEL3.movementRandomness).toBe(0.5);
      expect(GATEKEEPER_BEHAVIOR_LEVEL3.movementRandomness).toBe(0.5);
    });
  });

  describe('Level Palettes', () => {
    it('should map level 3 to red', () => {
      expect(LEVEL_PALETTES[3]).toBe('red');
    });
  });

  describe('Level Behaviors', () => {
    it('should contain behavior configs for Level 3', () => {
      expect(LEVEL_BEHAVIORS[3]).toBeDefined();
      expect(LEVEL_BEHAVIORS[3].sentinel).toBe(SENTINEL_BEHAVIOR_LEVEL3);
      expect(LEVEL_BEHAVIORS[3].watchdog).toBe(WATCHDOG_BEHAVIOR_LEVEL3);
      expect(LEVEL_BEHAVIORS[3].gatekeeper).toBe(GATEKEEPER_BEHAVIOR_LEVEL3);
    });
  });

  describe('Level 3 Spawn Events', () => {
    it('should have valid spawn event structure', () => {
      for (const event of SPAWN_EVENTS_LEVEL3) {
        expect(event.railProgress).toBeGreaterThanOrEqual(0);
        expect(event.railProgress).toBeLessThanOrEqual(1);
        expect(event.count).toBeGreaterThan(0);
        expect(event.position).toHaveLength(3);
        expect(['sentinel', 'watchdog', 'gatekeeper', 'firewallNode', 'iceTower']).toContain(event.enemyType);
      }
    });

    it('should spawn more total enemies than Level 2', () => {
      const level2Total = SPAWN_EVENTS_LEVEL2.reduce((sum, e) => sum + e.count, 0);
      const level3Total = SPAWN_EVENTS_LEVEL3.reduce((sum, e) => sum + e.count, 0);
      expect(level3Total).toBeGreaterThan(level2Total);
    });

    it('should have more gatekeeper spawns than Level 2', () => {
      const level2Gatekeepers = SPAWN_EVENTS_LEVEL2.filter(e => e.enemyType === 'gatekeeper').reduce((sum, e) => sum + e.count, 0);
      const level3Gatekeepers = SPAWN_EVENTS_LEVEL3.filter(e => e.enemyType === 'gatekeeper').reduce((sum, e) => sum + e.count, 0);
      expect(level3Gatekeepers).toBeGreaterThan(level2Gatekeepers);
    });

    it('should have more watchdog spawns than Level 2', () => {
      const level2Watchdogs = SPAWN_EVENTS_LEVEL2.filter(e => e.enemyType === 'watchdog').reduce((sum, e) => sum + e.count, 0);
      const level3Watchdogs = SPAWN_EVENTS_LEVEL3.filter(e => e.enemyType === 'watchdog').reduce((sum, e) => sum + e.count, 0);
      expect(level3Watchdogs).toBeGreaterThan(level2Watchdogs);
    });
  });

  describe('Level 3 Surface Targets', () => {
    it('should have more total targets than Level 2', () => {
      expect(SURFACE_TARGETS_LEVEL3.length).toBeGreaterThan(SURFACE_TARGETS_LEVEL2.length);
    });

    it('should have valid target structure', () => {
      for (const target of SURFACE_TARGETS_LEVEL3) {
        expect(['firewallNode', 'iceTower']).toContain(target.type);
        expect(target.position).toHaveLength(3);
      }
    });
  });

  describe('Level 3 Corridor Obstacles', () => {
    it('should have more total obstacles than Level 2', () => {
      expect(CORRIDOR_OBSTACLES_LEVEL3.length).toBeGreaterThan(CORRIDOR_OBSTACLES_LEVEL2.length);
    });

    it('should have valid obstacle structure', () => {
      for (const obstacle of CORRIDOR_OBSTACLES_LEVEL3) {
        expect(['firewall', 'networkCable', 'dataStream']).toContain(obstacle.type);
        expect(obstacle.position).toHaveLength(3);
      }
    });
  });

  describe('Level 3 Voice Lines', () => {
    it('should have voice definitions for all Level 3 handler lines', () => {
      const generator = new VoiceLineGenerator();
      const level3VoiceIds = [
        'handler_l3_dogfight_start',
        'handler_l3_surface_start',
        'handler_l3_corridor_start',
        'handler_l3_boss_start',
        'handler_l3_level_complete',
      ];
      for (const id of level3VoiceIds) {
        expect(generator.hasSound(id)).toBe(true);
      }
    });
  });
});
