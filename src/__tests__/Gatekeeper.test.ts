import { describe, it, expect, vi } from 'vitest';

// Mock three.js (same pattern as Watchdog.test.ts)
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
  class MockDodecahedronGeometry {
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
    DodecahedronGeometry: MockDodecahedronGeometry,
    EdgesGeometry: MockEdgesGeometry,
    LineSegments: MockLineSegments,
    LineBasicMaterial: MockLineBasicMaterial,
  };
});

describe('Gatekeeper Class (Story 3-2)', () => {
  it('should export Gatekeeper class', async () => {
    const mod = await import('../entities/enemies/Gatekeeper.ts');
    expect(mod.Gatekeeper).toBeDefined();
    expect(typeof mod.Gatekeeper).toBe('function');
  });

  it('should have update, takeDamage, reset methods (inherited from Enemy)', async () => {
    const mod = await import('../entities/enemies/Gatekeeper.ts');
    const proto = mod.Gatekeeper.prototype;
    expect(typeof proto.update).toBe('function');
    expect(typeof proto.takeDamage).toBe('function');
    expect(typeof proto.reset).toBe('function');
  });

  it('should have resetSharedResources as a static method', async () => {
    const mod = await import('../entities/enemies/Gatekeeper.ts');
    expect(typeof mod.Gatekeeper.resetSharedResources).toBe('function');
  });

  it('should create a Gatekeeper with default params', async () => {
    const { Gatekeeper } = await import('../entities/enemies/Gatekeeper.ts');
    Gatekeeper.resetSharedResources();
    const mockVectorMaterials = {
      create: vi.fn().mockReturnValue({}),
    };
    const gatekeeper = new Gatekeeper(mockVectorMaterials as never);
    expect(gatekeeper).toBeDefined();
  });

  it('should use GATEKEEPER_HEALTH and GATEKEEPER_SCORE_VALUE defaults', async () => {
    const { Gatekeeper } = await import('../entities/enemies/Gatekeeper.ts');
    const { GATEKEEPER_HEALTH, GATEKEEPER_SCORE_VALUE } = await import('../config/constants.ts');
    Gatekeeper.resetSharedResources();
    const mockVectorMaterials = { create: vi.fn().mockReturnValue({}) };
    const gatekeeper = new Gatekeeper(mockVectorMaterials as never);
    expect(gatekeeper.health).toBe(GATEKEEPER_HEALTH);
    expect(gatekeeper.scoreValue).toBe(GATEKEEPER_SCORE_VALUE);
  });

  it('should accept custom BehaviorParams', async () => {
    const { Gatekeeper } = await import('../entities/enemies/Gatekeeper.ts');
    Gatekeeper.resetSharedResources();
    const mockVectorMaterials = { create: vi.fn().mockReturnValue({}) };
    const customParams = {
      patrolSpeed: 3.0, attackCooldown: 1.0, evasionChance: 0.5,
      movementRandomness: 0.3, attackDamage: 20, projectileSpeed: 25,
    };
    const gatekeeper = new Gatekeeper(mockVectorMaterials as never, customParams);
    expect(gatekeeper.params.patrolSpeed).toBe(3.0);
  });

  it('should call vectorMaterials.create with gatekeeper id', async () => {
    const { Gatekeeper } = await import('../entities/enemies/Gatekeeper.ts');
    Gatekeeper.resetSharedResources();
    const mockVectorMaterials = { create: vi.fn().mockReturnValue({}) };
    new Gatekeeper(mockVectorMaterials as never);
    expect(mockVectorMaterials.create).toHaveBeenCalledWith('gatekeeper');
  });

  it('should reuse shared geometry across instances', async () => {
    const { Gatekeeper } = await import('../entities/enemies/Gatekeeper.ts');
    Gatekeeper.resetSharedResources();
    const mockVectorMaterials = { create: vi.fn().mockReturnValue({}) };
    new Gatekeeper(mockVectorMaterials as never);
    new Gatekeeper(mockVectorMaterials as never);
    // create() should only be called once for shared material
    expect(mockVectorMaterials.create).toHaveBeenCalledTimes(1);
  });
});
