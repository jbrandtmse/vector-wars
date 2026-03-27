import { describe, it, expect, vi } from 'vitest';

// Mock three.js (same pattern as Enemy.test.ts)
vi.mock('three', () => {
  class MockVector3 {
    x: number; y: number; z: number;
    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
    copy = vi.fn().mockReturnThis();
    set = vi.fn().mockReturnThis();
    add = vi.fn().mockReturnThis();
    setScalar(s: number) { this.x = s; this.y = s; this.z = s; return this; }
  }
  class MockObject3D {
    position = new MockVector3();
    scale = new MockVector3(1, 1, 1);
    visible = true;
    traverse = vi.fn((cb: (child: { layers: { enable: ReturnType<typeof vi.fn> } }) => void) => {
      cb({ layers: { enable: vi.fn() } });
    });
    add = vi.fn();
  }
  class MockSphere {
    center: MockVector3;
    radius: number;
    constructor(center?: MockVector3, radius = 1) {
      this.center = center || new MockVector3();
      this.radius = radius;
    }
  }
  class MockConeGeometry {
    dispose = vi.fn();
  }
  class MockEdgesGeometry {
    constructor() {}
  }
  class MockLineSegments {
    layers = { enable: vi.fn() };
    constructor() {}
  }
  class MockLineBasicMaterial {}
  return {
    Object3D: MockObject3D,
    Sphere: MockSphere,
    Vector3: MockVector3,
    ConeGeometry: MockConeGeometry,
    EdgesGeometry: MockEdgesGeometry,
    LineSegments: MockLineSegments,
    LineBasicMaterial: MockLineBasicMaterial,
  };
});

describe('Watchdog Class (Story 3-1)', () => {
  it('should export Watchdog class', async () => {
    const mod = await import('../entities/enemies/Watchdog.ts');
    expect(mod.Watchdog).toBeDefined();
    expect(typeof mod.Watchdog).toBe('function');
  });

  it('should have update, takeDamage, reset methods (inherited from Enemy)', async () => {
    const mod = await import('../entities/enemies/Watchdog.ts');
    const proto = mod.Watchdog.prototype;
    expect(typeof proto.update).toBe('function');
    expect(typeof proto.takeDamage).toBe('function');
    expect(typeof proto.reset).toBe('function');
  });

  it('should have resetSharedResources as a static method', async () => {
    const mod = await import('../entities/enemies/Watchdog.ts');
    expect(typeof mod.Watchdog.resetSharedResources).toBe('function');
  });

  it('should create a Watchdog with default params', async () => {
    const { Watchdog } = await import('../entities/enemies/Watchdog.ts');
    Watchdog.resetSharedResources();
    const mockVectorMaterials = {
      create: vi.fn().mockReturnValue({}),
    };
    const watchdog = new Watchdog(mockVectorMaterials as never);
    expect(watchdog).toBeDefined();
  });

  it('should use WATCHDOG_HEALTH and WATCHDOG_SCORE_VALUE defaults', async () => {
    const { Watchdog } = await import('../entities/enemies/Watchdog.ts');
    const { WATCHDOG_HEALTH, WATCHDOG_SCORE_VALUE } = await import('../config/constants.ts');
    Watchdog.resetSharedResources();
    const mockVectorMaterials = { create: vi.fn().mockReturnValue({}) };
    const watchdog = new Watchdog(mockVectorMaterials as never);
    expect(watchdog.health).toBe(WATCHDOG_HEALTH);
    expect(watchdog.scoreValue).toBe(WATCHDOG_SCORE_VALUE);
  });

  it('should accept custom BehaviorParams', async () => {
    const { Watchdog } = await import('../entities/enemies/Watchdog.ts');
    Watchdog.resetSharedResources();
    const mockVectorMaterials = { create: vi.fn().mockReturnValue({}) };
    const customParams = {
      patrolSpeed: 3.0, attackCooldown: 1.0, evasionChance: 0.5,
      movementRandomness: 0.3, attackDamage: 20, projectileSpeed: 25,
    };
    const watchdog = new Watchdog(mockVectorMaterials as never, customParams);
    expect(watchdog.params.patrolSpeed).toBe(3.0);
  });

  it('should call vectorMaterials.create with watchdog id', async () => {
    const { Watchdog } = await import('../entities/enemies/Watchdog.ts');
    Watchdog.resetSharedResources();
    const mockVectorMaterials = { create: vi.fn().mockReturnValue({}) };
    new Watchdog(mockVectorMaterials as never);
    expect(mockVectorMaterials.create).toHaveBeenCalledWith('watchdog');
  });

  it('should reuse shared geometry across instances', async () => {
    const { Watchdog } = await import('../entities/enemies/Watchdog.ts');
    Watchdog.resetSharedResources();
    const mockVectorMaterials = { create: vi.fn().mockReturnValue({}) };
    new Watchdog(mockVectorMaterials as never);
    new Watchdog(mockVectorMaterials as never);
    // create() should only be called once for shared material
    expect(mockVectorMaterials.create).toHaveBeenCalledTimes(1);
  });
});
