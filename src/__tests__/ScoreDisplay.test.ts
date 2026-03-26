import { describe, it, expect } from 'vitest';

describe('ScoreDisplay', () => {
  it('should be exported as a class from ui/hud/ScoreDisplay', async () => {
    const mod = await import('../ui/hud/ScoreDisplay.ts');
    expect(mod.ScoreDisplay).toBeDefined();
    expect(typeof mod.ScoreDisplay).toBe('function');
  });

  it('should have updateScore method on prototype', async () => {
    const mod = await import('../ui/hud/ScoreDisplay.ts');
    expect(typeof mod.ScoreDisplay.prototype.updateScore).toBe('function');
  });

  it('should have dispose method on prototype', async () => {
    const mod = await import('../ui/hud/ScoreDisplay.ts');
    expect(typeof mod.ScoreDisplay.prototype.dispose).toBe('function');
  });
});
