import { describe, it, expect } from 'vitest';

describe('DamageEffectsManager (Story 2-7)', () => {
  it('is exported as a class from src/systems/DamageEffectsManager.ts', async () => {
    const mod = await import('../systems/DamageEffectsManager.ts');
    expect(mod.DamageEffectsManager).toBeDefined();
    expect(typeof mod.DamageEffectsManager).toBe('function');
  });
});
