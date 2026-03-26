import { describe, it, expect } from 'vitest';

describe('AIState Interface and State Classes', () => {
  it('should export SpawnState class', async () => {
    const mod = await import('../ai/states/SpawnState.ts');
    expect(mod.SpawnState).toBeDefined();
    expect(typeof mod.SpawnState).toBe('function');
  });

  it('should export PatrolState class', async () => {
    const mod = await import('../ai/states/PatrolState.ts');
    expect(mod.PatrolState).toBeDefined();
    expect(typeof mod.PatrolState).toBe('function');
  });

  it('should export DestroyedState class', async () => {
    const mod = await import('../ai/states/DestroyedState.ts');
    expect(mod.DestroyedState).toBeDefined();
    expect(typeof mod.DestroyedState).toBe('function');
  });

  it('SpawnState should have enter/update/exit methods on prototype', async () => {
    const mod = await import('../ai/states/SpawnState.ts');
    const proto = mod.SpawnState.prototype;
    expect(typeof proto.enter).toBe('function');
    expect(typeof proto.update).toBe('function');
    expect(typeof proto.exit).toBe('function');
  });

  it('PatrolState should have enter/update/exit methods on prototype', async () => {
    const mod = await import('../ai/states/PatrolState.ts');
    const proto = mod.PatrolState.prototype;
    expect(typeof proto.enter).toBe('function');
    expect(typeof proto.update).toBe('function');
    expect(typeof proto.exit).toBe('function');
  });

  it('DestroyedState should have enter/update/exit methods on prototype', async () => {
    const mod = await import('../ai/states/DestroyedState.ts');
    const proto = mod.DestroyedState.prototype;
    expect(typeof proto.enter).toBe('function');
    expect(typeof proto.update).toBe('function');
    expect(typeof proto.exit).toBe('function');
  });

  it('should export AIState interface (via type re-export module)', async () => {
    const mod = await import('../ai/AIState.ts');
    // Interfaces are erased at runtime, but the module should import cleanly
    expect(mod).toBeDefined();
  });

  it('should export BehaviorParams interface module', async () => {
    const mod = await import('../ai/BehaviorParams.ts');
    expect(mod).toBeDefined();
  });

  it('should export SENTINEL_BEHAVIOR_LEVEL1 defaults', async () => {
    const mod = await import('../config/constants.ts');
    expect(mod.SENTINEL_BEHAVIOR_LEVEL1).toBeDefined();
    expect(mod.SENTINEL_BEHAVIOR_LEVEL1.patrolSpeed).toBe(1.0);
    expect(mod.SENTINEL_BEHAVIOR_LEVEL1.attackCooldown).toBe(2.0);
    expect(mod.SENTINEL_BEHAVIOR_LEVEL1.evasionChance).toBe(0.0);
    expect(mod.SENTINEL_BEHAVIOR_LEVEL1.movementRandomness).toBe(0.0);
    expect(mod.SENTINEL_BEHAVIOR_LEVEL1.attackDamage).toBe(10);
    expect(mod.SENTINEL_BEHAVIOR_LEVEL1.projectileSpeed).toBe(15);
  });

  it('should export SENTINEL_COLLIDER_RADIUS', async () => {
    const mod = await import('../config/constants.ts');
    expect(mod.SENTINEL_COLLIDER_RADIUS).toBe(1.5);
  });

  it('should export SENTINEL_HEALTH', async () => {
    const mod = await import('../config/constants.ts');
    expect(mod.SENTINEL_HEALTH).toBe(30);
  });

  it('should export SENTINEL_SCORE_VALUE', async () => {
    const mod = await import('../config/constants.ts');
    expect(mod.SENTINEL_SCORE_VALUE).toBe(100);
  });
});
