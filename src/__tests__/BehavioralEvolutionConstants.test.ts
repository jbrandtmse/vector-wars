import { describe, it, expect } from 'vitest';

describe('Behavioral Evolution Constants (Story 5-7)', () => {
  it('should export PATROL_RANDOMNESS_SCALE with correct value', async () => {
    const { PATROL_RANDOMNESS_SCALE } = await import('../config/constants.ts');
    expect(PATROL_RANDOMNESS_SCALE).toBe(1.5);
  });

  it('should export PURSUIT_RANDOMNESS_SCALE with correct value', async () => {
    const { PURSUIT_RANDOMNESS_SCALE } = await import('../config/constants.ts');
    expect(PURSUIT_RANDOMNESS_SCALE).toBe(2.0);
  });

  it('should export BLOCK_RANDOMNESS_SCALE with correct value', async () => {
    const { BLOCK_RANDOMNESS_SCALE } = await import('../config/constants.ts');
    expect(BLOCK_RANDOMNESS_SCALE).toBe(1.0);
  });

  it('should export OVERSEER_RANDOMNESS_SCALE with correct value', async () => {
    const { OVERSEER_RANDOMNESS_SCALE } = await import('../config/constants.ts');
    expect(OVERSEER_RANDOMNESS_SCALE).toBe(1.5);
  });

  it('should export EVASION_SPEED_MULTIPLIER with correct value', async () => {
    const { EVASION_SPEED_MULTIPLIER } = await import('../config/constants.ts');
    expect(EVASION_SPEED_MULTIPLIER).toBe(2.5);
  });

  it('should export EVASION_DURATION with correct value', async () => {
    const { EVASION_DURATION } = await import('../config/constants.ts');
    expect(EVASION_DURATION).toBe(0.6);
  });

  it('should export GLITCH_THRESHOLD with correct value', async () => {
    const { GLITCH_THRESHOLD } = await import('../config/constants.ts');
    expect(GLITCH_THRESHOLD).toBe(0.4);
  });

  it('should export GLITCH_SCALE_INTENSITY with correct value', async () => {
    const { GLITCH_SCALE_INTENSITY } = await import('../config/constants.ts');
    expect(GLITCH_SCALE_INTENSITY).toBe(0.06);
  });

  it('Level 1 sentinel behavior should have movementRandomness=0 and evasionChance=0', async () => {
    const { SENTINEL_BEHAVIOR_LEVEL1 } = await import('../config/constants.ts');
    expect(SENTINEL_BEHAVIOR_LEVEL1.movementRandomness).toBe(0.0);
    expect(SENTINEL_BEHAVIOR_LEVEL1.evasionChance).toBe(0.0);
  });

  it('Level 2 sentinel behavior should have movementRandomness=0.1 and evasionChance=0.2', async () => {
    const { SENTINEL_BEHAVIOR_LEVEL2 } = await import('../config/constants.ts');
    expect(SENTINEL_BEHAVIOR_LEVEL2.movementRandomness).toBe(0.1);
    expect(SENTINEL_BEHAVIOR_LEVEL2.evasionChance).toBe(0.2);
  });

  it('Level 3 sentinel behavior should have movementRandomness=0.5 and evasionChance=0.5', async () => {
    const { SENTINEL_BEHAVIOR_LEVEL3 } = await import('../config/constants.ts');
    expect(SENTINEL_BEHAVIOR_LEVEL3.movementRandomness).toBe(0.5);
    expect(SENTINEL_BEHAVIOR_LEVEL3.evasionChance).toBe(0.5);
  });

  it('Level 2 watchdog behavior should have movementRandomness=0.1 and evasionChance=0.2', async () => {
    const { WATCHDOG_BEHAVIOR_LEVEL2 } = await import('../config/constants.ts');
    expect(WATCHDOG_BEHAVIOR_LEVEL2.movementRandomness).toBe(0.1);
    expect(WATCHDOG_BEHAVIOR_LEVEL2.evasionChance).toBe(0.2);
  });

  it('Level 3 watchdog behavior should have movementRandomness=0.5 and evasionChance=0.5', async () => {
    const { WATCHDOG_BEHAVIOR_LEVEL3 } = await import('../config/constants.ts');
    expect(WATCHDOG_BEHAVIOR_LEVEL3.movementRandomness).toBe(0.5);
    expect(WATCHDOG_BEHAVIOR_LEVEL3.evasionChance).toBe(0.5);
  });

  it('Level 2 gatekeeper behavior should have movementRandomness=0.1 and evasionChance=0.2', async () => {
    const { GATEKEEPER_BEHAVIOR_LEVEL2 } = await import('../config/constants.ts');
    expect(GATEKEEPER_BEHAVIOR_LEVEL2.movementRandomness).toBe(0.1);
    expect(GATEKEEPER_BEHAVIOR_LEVEL2.evasionChance).toBe(0.2);
  });

  it('Level 3 gatekeeper behavior should have movementRandomness=0.5 and evasionChance=0.5', async () => {
    const { GATEKEEPER_BEHAVIOR_LEVEL3 } = await import('../config/constants.ts');
    expect(GATEKEEPER_BEHAVIOR_LEVEL3.movementRandomness).toBe(0.5);
    expect(GATEKEEPER_BEHAVIOR_LEVEL3.evasionChance).toBe(0.5);
  });

  it('Level 2 overseer behavior should have movementRandomness=0.1 and evasionChance=0.15', async () => {
    const { OVERSEER_BEHAVIOR_LEVEL2 } = await import('../config/constants.ts');
    expect(OVERSEER_BEHAVIOR_LEVEL2.movementRandomness).toBe(0.1);
    expect(OVERSEER_BEHAVIOR_LEVEL2.evasionChance).toBe(0.15);
  });

  it('Level 3 overseer behavior should have movementRandomness=0.4 and evasionChance=0.35', async () => {
    const { OVERSEER_BEHAVIOR_LEVEL3 } = await import('../config/constants.ts');
    expect(OVERSEER_BEHAVIOR_LEVEL3.movementRandomness).toBe(0.4);
    expect(OVERSEER_BEHAVIOR_LEVEL3.evasionChance).toBe(0.35);
  });

  it('LEVEL_BEHAVIORS should contain behavior configs for all 3 levels', async () => {
    const { LEVEL_BEHAVIORS } = await import('../config/constants.ts');
    expect(LEVEL_BEHAVIORS[1]).toBeDefined();
    expect(LEVEL_BEHAVIORS[2]).toBeDefined();
    expect(LEVEL_BEHAVIORS[3]).toBeDefined();
  });

  it('all LEVEL_BEHAVIORS entries should have sentinel, watchdog, gatekeeper, overseer keys', async () => {
    const { LEVEL_BEHAVIORS } = await import('../config/constants.ts');
    for (const level of [1, 2, 3]) {
      const config = LEVEL_BEHAVIORS[level];
      expect(config).toHaveProperty('sentinel');
      expect(config).toHaveProperty('watchdog');
      expect(config).toHaveProperty('gatekeeper');
      expect(config).toHaveProperty('overseer');
      // Verify each has BehaviorParams shape
      for (const key of ['sentinel', 'watchdog', 'gatekeeper', 'overseer'] as const) {
        const p = config[key];
        expect(p).toHaveProperty('patrolSpeed');
        expect(p).toHaveProperty('attackCooldown');
        expect(p).toHaveProperty('evasionChance');
        expect(p).toHaveProperty('movementRandomness');
        expect(p).toHaveProperty('attackDamage');
        expect(p).toHaveProperty('projectileSpeed');
      }
    }
  });
});
