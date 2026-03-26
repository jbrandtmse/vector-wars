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

describe('EnemyProjectileSystem', () => {
  it('should be exported as a class from systems/EnemyProjectileSystem', async () => {
    const mod = await import('../systems/EnemyProjectileSystem.ts');
    expect(mod.EnemyProjectileSystem).toBeDefined();
    expect(typeof mod.EnemyProjectileSystem).toBe('function');
  });

  it('should have fireAt method on prototype', async () => {
    const mod = await import('../systems/EnemyProjectileSystem.ts');
    expect(typeof mod.EnemyProjectileSystem.prototype.fireAt).toBe('function');
  });

  it('should have update method on prototype', async () => {
    const mod = await import('../systems/EnemyProjectileSystem.ts');
    expect(typeof mod.EnemyProjectileSystem.prototype.update).toBe('function');
  });
});
