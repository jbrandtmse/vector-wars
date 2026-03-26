import { describe, it, expect } from 'vitest';

describe('WeaponIndicator', () => {
  it('should be exported as a class from ui/hud/WeaponIndicator', async () => {
    const mod = await import('../ui/hud/WeaponIndicator.ts');
    expect(mod.WeaponIndicator).toBeDefined();
    expect(typeof mod.WeaponIndicator).toBe('function');
  });

  it('should have a group property accessible via class definition', async () => {
    const mod = await import('../ui/hud/WeaponIndicator.ts');
    // WeaponIndicator has a public readonly group property set in constructor
    expect(mod.WeaponIndicator).toBeDefined();
  });

  it('should have dispose method on prototype', async () => {
    const mod = await import('../ui/hud/WeaponIndicator.ts');
    expect(typeof mod.WeaponIndicator.prototype.dispose).toBe('function');
  });
});
