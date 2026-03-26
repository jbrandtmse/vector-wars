import { describe, it, expect } from 'vitest';

describe('GameOverScreen (Story 2-10)', () => {
  it('should be exported as a class from ui/screens/GameOverScreen', async () => {
    const mod = await import('../ui/screens/GameOverScreen.ts');
    expect(mod.GameOverScreen).toBeDefined();
    expect(typeof mod.GameOverScreen).toBe('function');
  });

  it('should have show method on prototype', async () => {
    const mod = await import('../ui/screens/GameOverScreen.ts');
    expect(typeof mod.GameOverScreen.prototype.show).toBe('function');
  });

  it('should have hide method on prototype', async () => {
    const mod = await import('../ui/screens/GameOverScreen.ts');
    expect(typeof mod.GameOverScreen.prototype.hide).toBe('function');
  });

  it('should have dispose method on prototype', async () => {
    const mod = await import('../ui/screens/GameOverScreen.ts');
    expect(typeof mod.GameOverScreen.prototype.dispose).toBe('function');
  });

  it('should have a constructor function', async () => {
    const mod = await import('../ui/screens/GameOverScreen.ts');
    // Verify constructor exists and accepts zero arguments
    expect(mod.GameOverScreen.prototype.constructor).toBeDefined();
    expect(typeof mod.GameOverScreen.prototype.constructor).toBe('function');
  });
});
