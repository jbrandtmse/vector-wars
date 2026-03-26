import { describe, it, expect, vi } from 'vitest';

// Mock three.js
vi.mock('three', () => {
  class MockVector3 {
    x: number; y: number; z: number;
    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
    copy = vi.fn().mockReturnThis();
    set = vi.fn().mockReturnThis();
    add = vi.fn().mockReturnThis();
  }
  class MockObject3D {
    position = new MockVector3();
    scale = new MockVector3(1, 1, 1);
    visible = true;
    traverse = vi.fn();
    add = vi.fn();
  }
  class MockScene extends MockObject3D {}
  class MockSphere {
    center: MockVector3;
    radius: number;
    constructor(center?: MockVector3, radius = 1) {
      this.center = center || new MockVector3();
      this.radius = radius;
    }
  }
  class MockOctahedronGeometry { dispose = vi.fn(); }
  class MockEdgesGeometry {}
  class MockLineSegments {
    layers = { enable: vi.fn() };
  }
  return {
    Object3D: MockObject3D,
    Scene: MockScene,
    Sphere: MockSphere,
    Vector3: MockVector3,
    OctahedronGeometry: MockOctahedronGeometry,
    EdgesGeometry: MockEdgesGeometry,
    LineSegments: MockLineSegments,
  };
});

describe('EnemySpawner Exports', () => {
  it('should export EnemySpawner class', async () => {
    const mod = await import('../systems/EnemySpawner.ts');
    expect(mod.EnemySpawner).toBeDefined();
    expect(typeof mod.EnemySpawner).toBe('function');
  });
});

describe('SPAWN_EVENTS configuration', () => {
  it('should export SPAWN_EVENTS as an array', async () => {
    const mod = await import('../config/constants.ts');
    expect(mod.SPAWN_EVENTS).toBeDefined();
    expect(Array.isArray(mod.SPAWN_EVENTS)).toBe(true);
  });

  it('should have at least 3 spawn events', async () => {
    const mod = await import('../config/constants.ts');
    expect(mod.SPAWN_EVENTS.length).toBeGreaterThanOrEqual(3);
  });

  it('should have required fields on each spawn event', async () => {
    const mod = await import('../config/constants.ts');
    for (const event of mod.SPAWN_EVENTS) {
      expect(event).toHaveProperty('railProgress');
      expect(event).toHaveProperty('enemyType');
      expect(event).toHaveProperty('position');
      expect(event).toHaveProperty('count');
    }
  });

  it('should have railProgress between 0 and 1 for all events', async () => {
    const mod = await import('../config/constants.ts');
    for (const event of mod.SPAWN_EVENTS) {
      expect(event.railProgress).toBeGreaterThanOrEqual(0);
      expect(event.railProgress).toBeLessThanOrEqual(1);
    }
  });

  it('should have positive integer counts for all events', async () => {
    const mod = await import('../config/constants.ts');
    for (const event of mod.SPAWN_EVENTS) {
      expect(event.count).toBeGreaterThan(0);
      expect(Number.isInteger(event.count)).toBe(true);
    }
  });

  it('should have position as [x, y, z] tuple for all events', async () => {
    const mod = await import('../config/constants.ts');
    for (const event of mod.SPAWN_EVENTS) {
      expect(event.position).toHaveLength(3);
      expect(typeof event.position[0]).toBe('number');
      expect(typeof event.position[1]).toBe('number');
      expect(typeof event.position[2]).toBe('number');
    }
  });

  it('should total 8-12 enemies across all spawn events', async () => {
    const mod = await import('../config/constants.ts');
    const total = mod.SPAWN_EVENTS.reduce((sum: number, e: { count: number }) => sum + e.count, 0);
    expect(total).toBeGreaterThanOrEqual(8);
    expect(total).toBeLessThanOrEqual(12);
  });
});

describe('EnemySpawner Trigger Logic', () => {
  it('should not spawn enemies when rail progress has not reached trigger', async () => {
    const { EnemySpawner } = await import('../systems/EnemySpawner.ts');
    const { GameObjectManager } = await import('../entities/GameObjectManager.ts');

    const mockScene = { add: vi.fn() } as never;
    const gom = new GameObjectManager();
    const mockVectorMaterials = { create: vi.fn().mockReturnValue({}) } as never;

    const spawner = new EnemySpawner(mockScene, gom, mockVectorMaterials);
    // Progress 0 means no triggers fired (first trigger is at 0.10)
    spawner.update(0);
    spawner.update(0.05);
    expect(gom.getAll()).toHaveLength(0);
  });

  it('should spawn enemies when rail progress crosses a trigger', async () => {
    const { EnemySpawner } = await import('../systems/EnemySpawner.ts');
    const { GameObjectManager } = await import('../entities/GameObjectManager.ts');

    const mockScene = { add: vi.fn() } as never;
    const gom = new GameObjectManager();
    const mockVectorMaterials = { create: vi.fn().mockReturnValue({}) } as never;

    const spawner = new EnemySpawner(mockScene, gom, mockVectorMaterials);
    spawner.update(0.0); // Initial position
    spawner.update(0.11); // Cross first trigger at 0.10
    expect(gom.getAll().length).toBeGreaterThan(0);
  });

  it('should not re-spawn enemies on repeated crossings', async () => {
    const { EnemySpawner } = await import('../systems/EnemySpawner.ts');
    const { GameObjectManager } = await import('../entities/GameObjectManager.ts');

    const mockScene = { add: vi.fn() } as never;
    const gom = new GameObjectManager();
    const mockVectorMaterials = { create: vi.fn().mockReturnValue({}) } as never;

    const spawner = new EnemySpawner(mockScene, gom, mockVectorMaterials);
    spawner.update(0.0);
    spawner.update(0.11);
    const countAfterFirst = gom.getAll().length;
    // Simulate going backwards past the trigger (wrap scenario)
    spawner.update(0.11);
    expect(gom.getAll().length).toBe(countAfterFirst);
  });
});
