import { describe, it, expect } from 'vitest';

describe('ScorePopup', () => {
  it('should be exported as a class from ui/hud/ScorePopup', async () => {
    const mod = await import('../ui/hud/ScorePopup.ts');
    expect(mod.ScorePopup).toBeDefined();
    expect(typeof mod.ScorePopup).toBe('function');
  });

  it('should have update method on prototype', async () => {
    const mod = await import('../ui/hud/ScorePopup.ts');
    expect(typeof mod.ScorePopup.prototype.update).toBe('function');
  });

  it('should have trigger method on prototype', async () => {
    const mod = await import('../ui/hud/ScorePopup.ts');
    expect(typeof mod.ScorePopup.prototype.trigger).toBe('function');
  });

  it('should have dispose method on prototype', async () => {
    const mod = await import('../ui/hud/ScorePopup.ts');
    expect(typeof mod.ScorePopup.prototype.dispose).toBe('function');
  });
});
