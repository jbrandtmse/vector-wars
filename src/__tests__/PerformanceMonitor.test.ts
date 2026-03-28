import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PerformanceMonitor } from '../core/PerformanceMonitor.ts';

const { Logger } = vi.hoisted(() => ({
  Logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));
vi.mock('../core/Logger.ts', () => ({ Logger }));

function createMockRenderer(overrides: {
  calls?: number;
  triangles?: number;
  geometries?: number;
  textures?: number;
} = {}) {
  return {
    info: {
      render: {
        calls: overrides.calls ?? 42,
        triangles: overrides.triangles ?? 1000,
        frame: 0,
        points: 0,
        lines: 0,
      },
      memory: {
        geometries: overrides.geometries ?? 10,
        textures: overrides.textures ?? 5,
      },
      programs: null,
    },
  } as unknown as import('three').WebGLRenderer;
}

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getDrawCalls() returns renderer.info.render.calls value', () => {
    const renderer = createMockRenderer({ calls: 123 });
    const monitor = new PerformanceMonitor(renderer);
    expect(monitor.getDrawCalls()).toBe(123);
  });

  it('getTriangles() returns renderer.info.render.triangles value', () => {
    const renderer = createMockRenderer({ triangles: 5000 });
    const monitor = new PerformanceMonitor(renderer);
    expect(monitor.getTriangles()).toBe(5000);
  });

  it('getMemoryMB() returns computed value from renderer.info.memory', () => {
    const renderer = createMockRenderer({ geometries: 20, textures: 8 });
    const monitor = new PerformanceMonitor(renderer);
    expect(monitor.getMemoryMB()).toBe(28); // 20 + 8
  });

  it('periodic logging fires at configured interval', () => {
    const renderer = createMockRenderer({ calls: 100, triangles: 2000, geometries: 15, textures: 3 });
    const monitor = new PerformanceMonitor(renderer, 2.0);

    // Not enough time elapsed - no log
    monitor.update(1.0);
    expect(Logger.debug).not.toHaveBeenCalled();

    // Enough time elapsed - should log
    monitor.update(1.5);
    expect(Logger.debug).toHaveBeenCalledWith('Perf', 'Frame metrics', {
      drawCalls: 100,
      triangles: 2000,
      geometries: 15,
      textures: 3,
    });
  });

  it('warns when draw calls exceed 500', () => {
    const renderer = createMockRenderer({ calls: 600 });
    const monitor = new PerformanceMonitor(renderer, 1.0);

    monitor.update(1.5);
    expect(Logger.warn).toHaveBeenCalledWith('Perf', 'Draw calls exceed budget', { calls: 600 });
  });

  it('does not warn when draw calls are within budget', () => {
    const renderer = createMockRenderer({ calls: 300 });
    const monitor = new PerformanceMonitor(renderer, 1.0);

    monitor.update(1.5);
    expect(Logger.warn).not.toHaveBeenCalled();
  });
});
