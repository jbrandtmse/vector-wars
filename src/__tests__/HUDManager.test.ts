import { describe, it, expect } from 'vitest';

describe('HUDManager', () => {
  it('should be exported as a class from ui/hud/HUDManager', async () => {
    const mod = await import('../ui/hud/HUDManager.ts');
    expect(mod.HUDManager).toBeDefined();
    expect(typeof mod.HUDManager).toBe('function');
  });

  it('should have dispose method on prototype', async () => {
    const mod = await import('../ui/hud/HUDManager.ts');
    expect(typeof mod.HUDManager.prototype.dispose).toBe('function');
  });

  it('should have hideHUD method on prototype (Story 2-10)', async () => {
    const mod = await import('../ui/hud/HUDManager.ts');
    expect(typeof mod.HUDManager.prototype.hideHUD).toBe('function');
  });
});
