import { describe, it, expect } from 'vitest';

describe('ScreenShake (Story 2-7)', () => {
  it('is exported as a class from src/systems/ScreenShake.ts', async () => {
    const mod = await import('../systems/ScreenShake.ts');
    expect(mod.ScreenShake).toBeDefined();
    expect(typeof mod.ScreenShake).toBe('function');
  });

  it('has shake method on prototype', async () => {
    const mod = await import('../systems/ScreenShake.ts');
    expect(typeof mod.ScreenShake.prototype.shake).toBe('function');
  });

  it('has update method on prototype', async () => {
    const mod = await import('../systems/ScreenShake.ts');
    expect(typeof mod.ScreenShake.prototype.update).toBe('function');
  });
});
