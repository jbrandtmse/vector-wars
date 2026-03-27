import { describe, it, expect } from 'vitest';

describe('Gatekeeper BehaviorParams Constants (Story 3-2)', () => {
  it('should export GATEKEEPER_BEHAVIOR_LEVEL1 with all BehaviorParams fields', async () => {
    const mod = await import('../config/constants.ts');
    const params = mod.GATEKEEPER_BEHAVIOR_LEVEL1;
    expect(params).toBeDefined();
    expect(params).toHaveProperty('patrolSpeed');
    expect(params).toHaveProperty('attackCooldown');
    expect(params).toHaveProperty('evasionChance');
    expect(params).toHaveProperty('movementRandomness');
    expect(params).toHaveProperty('attackDamage');
    expect(params).toHaveProperty('projectileSpeed');
  });

  it('should have correct GATEKEEPER_BEHAVIOR_LEVEL1 values', async () => {
    const mod = await import('../config/constants.ts');
    const params = mod.GATEKEEPER_BEHAVIOR_LEVEL1;
    expect(params.patrolSpeed).toBe(0.8);
    expect(params.attackCooldown).toBe(2.5);
    expect(params.evasionChance).toBe(0.0);
    expect(params.movementRandomness).toBe(0.0);
    expect(params.attackDamage).toBe(15);
    expect(params.projectileSpeed).toBe(12);
  });

  it('should have correct GATEKEEPER_HEALTH, SCORE_VALUE, COLLIDER_RADIUS', async () => {
    const mod = await import('../config/constants.ts');
    expect(mod.GATEKEEPER_HEALTH).toBe(80);
    expect(mod.GATEKEEPER_SCORE_VALUE).toBe(300);
    expect(mod.GATEKEEPER_COLLIDER_RADIUS).toBe(2.0);
  });

  it('should have correct GATEKEEPER_POOL_SIZE', async () => {
    const mod = await import('../config/constants.ts');
    expect(mod.GATEKEEPER_POOL_SIZE).toBe(6);
  });

  it('should have correct GATEKEEPER_BLOCK_DISTANCE and BLOCK_SPEED_MULTIPLIER', async () => {
    const mod = await import('../config/constants.ts');
    expect(mod.GATEKEEPER_BLOCK_DISTANCE).toBe(15.0);
    expect(mod.GATEKEEPER_BLOCK_SPEED_MULTIPLIER).toBe(1.2);
  });

  it('should have correct GATEKEEPER_LATERAL_SWAY and SWAY_FREQUENCY', async () => {
    const mod = await import('../config/constants.ts');
    expect(mod.GATEKEEPER_LATERAL_SWAY).toBe(2.5);
    expect(mod.GATEKEEPER_SWAY_FREQUENCY).toBe(0.6);
  });

  it('should have correct GATEKEEPER_ATTACK_INTERVAL', async () => {
    const mod = await import('../config/constants.ts');
    expect(mod.GATEKEEPER_ATTACK_INTERVAL).toBe(3.5);
  });
});

describe('SpawnEvent Gatekeeper Support (Story 3-2)', () => {
  it('should accept gatekeeper as enemyType in SpawnEvent', async () => {
    const mod = await import('../config/constants.ts');
    const gatekeeperEvents = mod.SPAWN_EVENTS.filter(
      (e: { enemyType: string }) => e.enemyType === 'gatekeeper'
    );
    expect(gatekeeperEvents.length).toBeGreaterThanOrEqual(1);
  });

  it('should have gatekeeper spawn events at railProgress 0.40 and 0.70', async () => {
    const mod = await import('../config/constants.ts');
    const gatekeeperEvents = mod.SPAWN_EVENTS.filter(
      (e: { enemyType: string }) => e.enemyType === 'gatekeeper'
    );
    const progresses = gatekeeperEvents.map((e: { railProgress: number }) => e.railProgress);
    expect(progresses).toContain(0.40);
    expect(progresses).toContain(0.70);
  });

  it('should spawn single gatekeepers (count 1)', async () => {
    const mod = await import('../config/constants.ts');
    const gatekeeperEvents = mod.SPAWN_EVENTS.filter(
      (e: { enemyType: string }) => e.enemyType === 'gatekeeper'
    );
    for (const event of gatekeeperEvents) {
      expect(event.count).toBe(1);
    }
  });
});
