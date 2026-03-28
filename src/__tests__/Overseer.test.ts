import { describe, it, expect, vi } from 'vitest';

// Mock three.js (same pattern as Watchdog.test.ts / Gatekeeper.test.ts)
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
  class MockIcosahedronGeometry {
    dispose = vi.fn();
  }
  class MockBoxGeometry {
    dispose = vi.fn();
  }
  class MockEdgesGeometry {
    constructor() {}
  }
  class MockLineSegments {
    layers = { enable: vi.fn() };
    position = new MockVector3();
    constructor() {}
  }
  class MockLineBasicMaterial {}
  return {
    Object3D: MockObject3D,
    Sphere: MockSphere,
    Vector3: MockVector3,
    IcosahedronGeometry: MockIcosahedronGeometry,
    BoxGeometry: MockBoxGeometry,
    EdgesGeometry: MockEdgesGeometry,
    LineSegments: MockLineSegments,
    LineBasicMaterial: MockLineBasicMaterial,
  };
});

describe('Overseer Class (Story 5-6)', () => {
  it('should export Overseer class', async () => {
    const mod = await import('../entities/enemies/Overseer.ts');
    expect(mod.Overseer).toBeDefined();
    expect(typeof mod.Overseer).toBe('function');
  });

  it('should have update, takeDamage, reset methods (inherited from Enemy)', async () => {
    const mod = await import('../entities/enemies/Overseer.ts');
    const proto = mod.Overseer.prototype;
    expect(typeof proto.update).toBe('function');
    expect(typeof proto.takeDamage).toBe('function');
    expect(typeof proto.reset).toBe('function');
  });

  it('should have resetSharedResources as a static method', async () => {
    const mod = await import('../entities/enemies/Overseer.ts');
    expect(typeof mod.Overseer.resetSharedResources).toBe('function');
  });

  it('should create an Overseer with default params', async () => {
    const { Overseer } = await import('../entities/enemies/Overseer.ts');
    Overseer.resetSharedResources();
    const mockVectorMaterials = {
      create: vi.fn().mockReturnValue({}),
    };
    const overseer = new Overseer(mockVectorMaterials as never);
    expect(overseer).toBeDefined();
  });

  it('should use OVERSEER_HEALTH and OVERSEER_SCORE_VALUE defaults', async () => {
    const { Overseer } = await import('../entities/enemies/Overseer.ts');
    const { OVERSEER_HEALTH, OVERSEER_SCORE_VALUE } = await import('../config/constants.ts');
    Overseer.resetSharedResources();
    const mockVectorMaterials = { create: vi.fn().mockReturnValue({}) };
    const overseer = new Overseer(mockVectorMaterials as never);
    expect(overseer.health).toBe(OVERSEER_HEALTH);
    expect(overseer.scoreValue).toBe(OVERSEER_SCORE_VALUE);
  });

  it('should accept custom BehaviorParams', async () => {
    const { Overseer } = await import('../entities/enemies/Overseer.ts');
    Overseer.resetSharedResources();
    const mockVectorMaterials = { create: vi.fn().mockReturnValue({}) };
    const customParams = {
      patrolSpeed: 2.0, attackCooldown: 1.5, evasionChance: 0.3,
      movementRandomness: 0.2, attackDamage: 20, projectileSpeed: 20,
    };
    const overseer = new Overseer(mockVectorMaterials as never, customParams);
    expect(overseer.params.patrolSpeed).toBe(2.0);
  });

  it('should call vectorMaterials.create with overseer id', async () => {
    const { Overseer } = await import('../entities/enemies/Overseer.ts');
    Overseer.resetSharedResources();
    const mockVectorMaterials = { create: vi.fn().mockReturnValue({}) };
    new Overseer(mockVectorMaterials as never);
    expect(mockVectorMaterials.create).toHaveBeenCalledWith('overseer');
  });

  it('should reuse shared geometry across instances', async () => {
    const { Overseer } = await import('../entities/enemies/Overseer.ts');
    Overseer.resetSharedResources();
    const mockVectorMaterials = { create: vi.fn().mockReturnValue({}) };
    new Overseer(mockVectorMaterials as never);
    new Overseer(mockVectorMaterials as never);
    // create() should only be called once for shared material
    expect(mockVectorMaterials.create).toHaveBeenCalledTimes(1);
  });

  it('should add center and 4 satellite wireframes to object3D', async () => {
    const { Overseer } = await import('../entities/enemies/Overseer.ts');
    Overseer.resetSharedResources();
    const mockVectorMaterials = { create: vi.fn().mockReturnValue({}) };
    const overseer = new Overseer(mockVectorMaterials as never);
    // object3D.add should be called 5 times (1 center + 4 satellites)
    expect(overseer.getObject3D().add).toHaveBeenCalledTimes(5);
  });
});
