import { describe, it, expect } from 'vitest';

describe('Overseer Constants (Story 5-6)', () => {
  describe('Overseer entity constants', () => {
    it('should export OVERSEER_HEALTH === 60', async () => {
      const mod = await import('../config/constants.ts');
      expect(mod.OVERSEER_HEALTH).toBe(60);
    });

    it('should export OVERSEER_SCORE_VALUE === 400', async () => {
      const mod = await import('../config/constants.ts');
      expect(mod.OVERSEER_SCORE_VALUE).toBe(400);
    });

    it('should export OVERSEER_COLLIDER_RADIUS === 1.8', async () => {
      const mod = await import('../config/constants.ts');
      expect(mod.OVERSEER_COLLIDER_RADIUS).toBe(1.8);
    });

    it('should export OVERSEER_POOL_SIZE === 6', async () => {
      const mod = await import('../config/constants.ts');
      expect(mod.OVERSEER_POOL_SIZE).toBe(6);
    });

    it('should export OVERSEER_BUFF_RADIUS === 15.0', async () => {
      const mod = await import('../config/constants.ts');
      expect(mod.OVERSEER_BUFF_RADIUS).toBe(15.0);
    });

    it('should export OVERSEER_BUFF_COOLDOWN_MULTIPLIER === 0.6', async () => {
      const mod = await import('../config/constants.ts');
      expect(mod.OVERSEER_BUFF_COOLDOWN_MULTIPLIER).toBe(0.6);
    });

    it('should export OVERSEER_BUFF_SPEED_MULTIPLIER === 1.3', async () => {
      const mod = await import('../config/constants.ts');
      expect(mod.OVERSEER_BUFF_SPEED_MULTIPLIER).toBe(1.3);
    });

    it('should export OVERSEER_BUFF_INTERVAL === 3.0', async () => {
      const mod = await import('../config/constants.ts');
      expect(mod.OVERSEER_BUFF_INTERVAL).toBe(3.0);
    });
  });

  describe('OVERSEER_BEHAVIOR_LEVEL2', () => {
    it('should have all BehaviorParams fields', async () => {
      const mod = await import('../config/constants.ts');
      const params = mod.OVERSEER_BEHAVIOR_LEVEL2;
      expect(params).toHaveProperty('patrolSpeed');
      expect(params).toHaveProperty('attackCooldown');
      expect(params).toHaveProperty('evasionChance');
      expect(params).toHaveProperty('movementRandomness');
      expect(params).toHaveProperty('attackDamage');
      expect(params).toHaveProperty('projectileSpeed');
    });

    it('should have patrolSpeed === 1.2', async () => {
      const mod = await import('../config/constants.ts');
      expect(mod.OVERSEER_BEHAVIOR_LEVEL2.patrolSpeed).toBe(1.2);
    });

    it('should have attackCooldown === 2.5', async () => {
      const mod = await import('../config/constants.ts');
      expect(mod.OVERSEER_BEHAVIOR_LEVEL2.attackCooldown).toBe(2.5);
    });

    it('should have evasionChance === 0.15', async () => {
      const mod = await import('../config/constants.ts');
      expect(mod.OVERSEER_BEHAVIOR_LEVEL2.evasionChance).toBe(0.15);
    });

    it('should have movementRandomness === 0.1', async () => {
      const mod = await import('../config/constants.ts');
      expect(mod.OVERSEER_BEHAVIOR_LEVEL2.movementRandomness).toBe(0.1);
    });

    it('should have attackDamage === 15', async () => {
      const mod = await import('../config/constants.ts');
      expect(mod.OVERSEER_BEHAVIOR_LEVEL2.attackDamage).toBe(15);
    });

    it('should have projectileSpeed === 16', async () => {
      const mod = await import('../config/constants.ts');
      expect(mod.OVERSEER_BEHAVIOR_LEVEL2.projectileSpeed).toBe(16);
    });
  });

  describe('OVERSEER_BEHAVIOR_LEVEL3', () => {
    it('should have all BehaviorParams fields', async () => {
      const mod = await import('../config/constants.ts');
      const params = mod.OVERSEER_BEHAVIOR_LEVEL3;
      expect(params).toHaveProperty('patrolSpeed');
      expect(params).toHaveProperty('attackCooldown');
      expect(params).toHaveProperty('evasionChance');
      expect(params).toHaveProperty('movementRandomness');
      expect(params).toHaveProperty('attackDamage');
      expect(params).toHaveProperty('projectileSpeed');
    });

    it('should have patrolSpeed === 1.5', async () => {
      const mod = await import('../config/constants.ts');
      expect(mod.OVERSEER_BEHAVIOR_LEVEL3.patrolSpeed).toBe(1.5);
    });

    it('should have attackCooldown === 1.8', async () => {
      const mod = await import('../config/constants.ts');
      expect(mod.OVERSEER_BEHAVIOR_LEVEL3.attackCooldown).toBe(1.8);
    });

    it('should have evasionChance === 0.35', async () => {
      const mod = await import('../config/constants.ts');
      expect(mod.OVERSEER_BEHAVIOR_LEVEL3.evasionChance).toBe(0.35);
    });

    it('should have movementRandomness === 0.4', async () => {
      const mod = await import('../config/constants.ts');
      expect(mod.OVERSEER_BEHAVIOR_LEVEL3.movementRandomness).toBe(0.4);
    });

    it('should have attackDamage === 18', async () => {
      const mod = await import('../config/constants.ts');
      expect(mod.OVERSEER_BEHAVIOR_LEVEL3.attackDamage).toBe(18);
    });

    it('should have projectileSpeed === 18', async () => {
      const mod = await import('../config/constants.ts');
      expect(mod.OVERSEER_BEHAVIOR_LEVEL3.projectileSpeed).toBe(18);
    });
  });

  describe('LevelBehaviorConfig extension', () => {
    it('should have overseer field in LEVEL_BEHAVIORS level 1', async () => {
      const mod = await import('../config/constants.ts');
      expect(mod.LEVEL_BEHAVIORS[1]).toHaveProperty('overseer');
    });

    it('should have overseer field in LEVEL_BEHAVIORS level 2', async () => {
      const mod = await import('../config/constants.ts');
      expect(mod.LEVEL_BEHAVIORS[2]).toHaveProperty('overseer');
    });

    it('should have overseer field in LEVEL_BEHAVIORS level 3', async () => {
      const mod = await import('../config/constants.ts');
      expect(mod.LEVEL_BEHAVIORS[3]).toHaveProperty('overseer');
    });

    it('should use OVERSEER_BEHAVIOR_LEVEL2 for Level 1 (fallback)', async () => {
      const mod = await import('../config/constants.ts');
      expect(mod.LEVEL_BEHAVIORS[1].overseer).toBe(mod.OVERSEER_BEHAVIOR_LEVEL2);
    });

    it('should use OVERSEER_BEHAVIOR_LEVEL2 for Level 2', async () => {
      const mod = await import('../config/constants.ts');
      expect(mod.LEVEL_BEHAVIORS[2].overseer).toBe(mod.OVERSEER_BEHAVIOR_LEVEL2);
    });

    it('should use OVERSEER_BEHAVIOR_LEVEL3 for Level 3', async () => {
      const mod = await import('../config/constants.ts');
      expect(mod.LEVEL_BEHAVIORS[3].overseer).toBe(mod.OVERSEER_BEHAVIOR_LEVEL3);
    });
  });

  describe('SpawnEvent overseer entries', () => {
    it('should have SPAWN_EVENTS_LEVEL2 with overseer enemyType entries', async () => {
      const mod = await import('../config/constants.ts');
      const overseerEvents = mod.SPAWN_EVENTS_LEVEL2.filter(
        (e: { enemyType: string }) => e.enemyType === 'overseer'
      );
      expect(overseerEvents.length).toBeGreaterThanOrEqual(2);
    });

    it('should have SPAWN_EVENTS_LEVEL3 with overseer enemyType entries', async () => {
      const mod = await import('../config/constants.ts');
      const overseerEvents = mod.SPAWN_EVENTS_LEVEL3.filter(
        (e: { enemyType: string }) => e.enemyType === 'overseer'
      );
      expect(overseerEvents.length).toBeGreaterThanOrEqual(3);
    });

    it('should still have sentinel, watchdog, and gatekeeper entries in Level 2', async () => {
      const mod = await import('../config/constants.ts');
      const types = new Set(mod.SPAWN_EVENTS_LEVEL2.map((e: { enemyType: string }) => e.enemyType));
      expect(types.has('sentinel')).toBe(true);
      expect(types.has('watchdog')).toBe(true);
      expect(types.has('gatekeeper')).toBe(true);
    });

    it('should still have sentinel, watchdog, and gatekeeper entries in Level 3', async () => {
      const mod = await import('../config/constants.ts');
      const types = new Set(mod.SPAWN_EVENTS_LEVEL3.map((e: { enemyType: string }) => e.enemyType));
      expect(types.has('sentinel')).toBe(true);
      expect(types.has('watchdog')).toBe(true);
      expect(types.has('gatekeeper')).toBe(true);
    });
  });
});
