import { describe, it, expect, vi } from 'vitest';

// Mock Logger
vi.mock('../core/Logger.ts', () => ({
  Logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ScoreManager', () => {
  it('should be exported as a class from systems/ScoreManager', async () => {
    const mod = await import('../systems/ScoreManager.ts');
    expect(mod.ScoreManager).toBeDefined();
    expect(typeof mod.ScoreManager).toBe('function');
  });

  it('should have addScore method on prototype', async () => {
    const mod = await import('../systems/ScoreManager.ts');
    expect(typeof mod.ScoreManager.prototype.addScore).toBe('function');
  });

  it('should have getScore method on prototype', async () => {
    const mod = await import('../systems/ScoreManager.ts');
    expect(typeof mod.ScoreManager.prototype.getScore).toBe('function');
  });

  it('should have reset method on prototype', async () => {
    const mod = await import('../systems/ScoreManager.ts');
    expect(typeof mod.ScoreManager.prototype.reset).toBe('function');
  });

  it('should have dispose method on prototype', async () => {
    const mod = await import('../systems/ScoreManager.ts');
    expect(typeof mod.ScoreManager.prototype.dispose).toBe('function');
  });
});
