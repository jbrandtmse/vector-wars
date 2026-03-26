import { describe, it, expect, vi } from 'vitest';

// Mock Logger to avoid side effects
vi.mock('../core/Logger.ts', () => ({
  Logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('PoolDiagnostics', () => {
  it('should export PoolDiagnostics class', async () => {
    const mod = await import('../debug/PoolDiagnostics.ts');
    expect(mod.PoolDiagnostics).toBeDefined();
    expect(typeof mod.PoolDiagnostics).toBe('function');
  });

  it('should register and report stats from PoolStatsSource', async () => {
    const { PoolDiagnostics } = await import('../debug/PoolDiagnostics.ts');
    const diag = new PoolDiagnostics();

    const mockSource = {
      getPoolStats: vi.fn().mockReturnValue({ active: 5, total: 20 }),
    };
    diag.registerSource('testPool', mockSource);

    const stats = diag.getStats();
    expect(stats).toHaveProperty('testPool');
    expect(stats.testPool).toEqual({ active: 5, total: 20 });
  });

  it('should register and report stats from generic ObjectPool', async () => {
    const { PoolDiagnostics } = await import('../debug/PoolDiagnostics.ts');
    const { ObjectPool } = await import('../core/ObjectPool.ts');

    const diag = new PoolDiagnostics();
    const pool = new ObjectPool(() => ({ reset: vi.fn() }), 10);
    pool.acquire();
    pool.acquire();

    diag.registerGenericPool('generic', pool);

    const stats = diag.getStats();
    expect(stats.generic).toEqual({ active: 2, total: 10 });
  });

  it('should report draw calls as -1 when no renderer set', async () => {
    const { PoolDiagnostics } = await import('../debug/PoolDiagnostics.ts');
    const diag = new PoolDiagnostics();
    expect(diag.getDrawCalls()).toBe(-1);
  });

  it('should report draw calls from renderer when set', async () => {
    const { PoolDiagnostics } = await import('../debug/PoolDiagnostics.ts');
    const diag = new PoolDiagnostics();
    const mockRenderer = {
      info: { render: { calls: 150 } },
    };
    diag.setRenderer(mockRenderer as never);
    expect(diag.getDrawCalls()).toBe(150);
  });

  it('should log stats after logIntervalSeconds elapsed', async () => {
    const { PoolDiagnostics } = await import('../debug/PoolDiagnostics.ts');
    const { Logger } = await import('../core/Logger.ts');
    const diag = new PoolDiagnostics();

    const mockSource = {
      getPoolStats: vi.fn().mockReturnValue({ active: 3, total: 10 }),
    };
    diag.registerSource('test', mockSource);

    // Update with 0.5s -- should not log yet
    diag.update(0.5);
    expect(Logger.info).not.toHaveBeenCalled();

    // Update with 0.6s (total 1.1s) -- should log
    diag.update(0.6);
    expect(Logger.info).toHaveBeenCalledWith(
      'Pool',
      'Pool diagnostics',
      expect.objectContaining({ drawCalls: -1 }),
    );
  });

  it('should aggregate stats from multiple sources', async () => {
    const { PoolDiagnostics } = await import('../debug/PoolDiagnostics.ts');
    const diag = new PoolDiagnostics();

    diag.registerSource('a', { getPoolStats: () => ({ active: 1, total: 10 }) });
    diag.registerSource('b', { getPoolStats: () => ({ active: 5, total: 30 }) });

    const stats = diag.getStats();
    expect(Object.keys(stats)).toHaveLength(2);
    expect(stats.a).toEqual({ active: 1, total: 10 });
    expect(stats.b).toEqual({ active: 5, total: 30 });
  });
});
