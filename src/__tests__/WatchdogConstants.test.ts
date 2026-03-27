import { describe, it, expect } from 'vitest';

describe('Watchdog Constants (Story 3-1)', () => {
  describe('WATCHDOG_BEHAVIOR_LEVEL1', () => {
    it('should have all BehaviorParams fields', async () => {
      const mod = await import('../config/constants.ts');
      const params = mod.WATCHDOG_BEHAVIOR_LEVEL1;
      expect(params).toHaveProperty('patrolSpeed');
      expect(params).toHaveProperty('attackCooldown');
      expect(params).toHaveProperty('evasionChance');
      expect(params).toHaveProperty('movementRandomness');
      expect(params).toHaveProperty('attackDamage');
      expect(params).toHaveProperty('projectileSpeed');
    });

    it('should have patrolSpeed === 1.5', async () => {
      const mod = await import('../config/constants.ts');
      expect(mod.WATCHDOG_BEHAVIOR_LEVEL1.patrolSpeed).toBe(1.5);
    });

    it('should have attackCooldown === 1.5', async () => {
      const mod = await import('../config/constants.ts');
      expect(mod.WATCHDOG_BEHAVIOR_LEVEL1.attackCooldown).toBe(1.5);
    });

    it('should have evasionChance === 0.0', async () => {
      const mod = await import('../config/constants.ts');
      expect(mod.WATCHDOG_BEHAVIOR_LEVEL1.evasionChance).toBe(0.0);
    });

    it('should have movementRandomness === 0.0', async () => {
      const mod = await import('../config/constants.ts');
      expect(mod.WATCHDOG_BEHAVIOR_LEVEL1.movementRandomness).toBe(0.0);
    });

    it('should have attackDamage === 12', async () => {
      const mod = await import('../config/constants.ts');
      expect(mod.WATCHDOG_BEHAVIOR_LEVEL1.attackDamage).toBe(12);
    });

    it('should have projectileSpeed === 18', async () => {
      const mod = await import('../config/constants.ts');
      expect(mod.WATCHDOG_BEHAVIOR_LEVEL1.projectileSpeed).toBe(18);
    });
  });

  describe('Watchdog entity constants', () => {
    it('should export WATCHDOG_HEALTH === 40', async () => {
      const mod = await import('../config/constants.ts');
      expect(mod.WATCHDOG_HEALTH).toBe(40);
    });

    it('should export WATCHDOG_SCORE_VALUE === 200', async () => {
      const mod = await import('../config/constants.ts');
      expect(mod.WATCHDOG_SCORE_VALUE).toBe(200);
    });

    it('should export WATCHDOG_COLLIDER_RADIUS === 1.2', async () => {
      const mod = await import('../config/constants.ts');
      expect(mod.WATCHDOG_COLLIDER_RADIUS).toBe(1.2);
    });

    it('should export WATCHDOG_POOL_SIZE === 10', async () => {
      const mod = await import('../config/constants.ts');
      expect(mod.WATCHDOG_POOL_SIZE).toBe(10);
    });

    it('should export WATCHDOG_PURSUIT_SPEED_MULTIPLIER === 1.8', async () => {
      const mod = await import('../config/constants.ts');
      expect(mod.WATCHDOG_PURSUIT_SPEED_MULTIPLIER).toBe(1.8);
    });

    it('should export WATCHDOG_MIN_ENGAGE_DISTANCE === 8.0', async () => {
      const mod = await import('../config/constants.ts');
      expect(mod.WATCHDOG_MIN_ENGAGE_DISTANCE).toBe(8.0);
    });

    it('should export WATCHDOG_ATTACK_INTERVAL === 2.5', async () => {
      const mod = await import('../config/constants.ts');
      expect(mod.WATCHDOG_ATTACK_INTERVAL).toBe(2.5);
    });
  });

  describe('SpawnEvent type extension', () => {
    it('should have SPAWN_EVENTS with watchdog enemyType entries', async () => {
      const mod = await import('../config/constants.ts');
      const watchdogEvents = mod.SPAWN_EVENTS.filter(
        (e: { enemyType: string }) => e.enemyType === 'watchdog'
      );
      expect(watchdogEvents.length).toBeGreaterThanOrEqual(2);
    });

    it('should still have sentinel enemyType entries', async () => {
      const mod = await import('../config/constants.ts');
      const sentinelEvents = mod.SPAWN_EVENTS.filter(
        (e: { enemyType: string }) => e.enemyType === 'sentinel'
      );
      expect(sentinelEvents.length).toBeGreaterThanOrEqual(3);
    });

    it('should have watchdog events at different rail progress points than sentinels', async () => {
      const mod = await import('../config/constants.ts');
      const sentinelProgresses = mod.SPAWN_EVENTS
        .filter((e: { enemyType: string }) => e.enemyType === 'sentinel')
        .map((e: { railProgress: number }) => e.railProgress);
      const watchdogProgresses = mod.SPAWN_EVENTS
        .filter((e: { enemyType: string }) => e.enemyType === 'watchdog')
        .map((e: { railProgress: number }) => e.railProgress);

      for (const wp of watchdogProgresses) {
        expect(sentinelProgresses).not.toContain(wp);
      }
    });
  });
});
