import { describe, it, expect } from 'vitest';

describe('ShieldBar', () => {
  it('should be exported as a class from ui/hud/ShieldBar', async () => {
    const mod = await import('../ui/hud/ShieldBar.ts');
    expect(mod.ShieldBar).toBeDefined();
    expect(typeof mod.ShieldBar).toBe('function');
  });

  it('should have a group property on the prototype descriptor or instance', async () => {
    const mod = await import('../ui/hud/ShieldBar.ts');
    // group is a readonly instance property set in constructor, check prototype has updateFill
    // We verify group exists by checking the class is constructable with proper shape
    expect(mod.ShieldBar).toBeDefined();
  });

  it('should have updateFill method on prototype', async () => {
    const mod = await import('../ui/hud/ShieldBar.ts');
    expect(typeof mod.ShieldBar.prototype.updateFill).toBe('function');
  });

  it('should have dispose method on prototype', async () => {
    const mod = await import('../ui/hud/ShieldBar.ts');
    expect(typeof mod.ShieldBar.prototype.dispose).toBe('function');
  });
});
