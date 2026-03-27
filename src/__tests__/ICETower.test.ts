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
  class MockCylinderGeometry {
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
    CylinderGeometry: MockCylinderGeometry,
    EdgesGeometry: MockEdgesGeometry,
    LineSegments: MockLineSegments,
    LineBasicMaterial: MockLineBasicMaterial,
  };
});

describe('ICETower Class (Story 3-3)', () => {
  it('should export ICETower class', async () => {
    const mod = await import('../entities/enemies/ICETower.ts');
    expect(mod.ICETower).toBeDefined();
    expect(typeof mod.ICETower).toBe('function');
  });

  it('should have update, takeDamage, reset methods (inherited from Enemy)', async () => {
    const mod = await import('../entities/enemies/ICETower.ts');
    const proto = mod.ICETower.prototype;
    expect(typeof proto.update).toBe('function');
    expect(typeof proto.takeDamage).toBe('function');
    expect(typeof proto.reset).toBe('function');
  });

  it('should have resetSharedResources as a static method', async () => {
    const mod = await import('../entities/enemies/ICETower.ts');
    expect(typeof mod.ICETower.resetSharedResources).toBe('function');
  });

  it('should create an ICETower with default params', async () => {
    const { ICETower } = await import('../entities/enemies/ICETower.ts');
    ICETower.resetSharedResources();
    const mockVectorMaterials = {
      create: vi.fn().mockReturnValue({}),
    };
    const tower = new ICETower(mockVectorMaterials as never);
    expect(tower).toBeDefined();
  });

  it('should use ICE_TOWER_HEALTH and ICE_TOWER_SCORE_VALUE defaults', async () => {
    const { ICETower } = await import('../entities/enemies/ICETower.ts');
    const { ICE_TOWER_HEALTH, ICE_TOWER_SCORE_VALUE } = await import('../config/constants.ts');
    ICETower.resetSharedResources();
    const mockVectorMaterials = { create: vi.fn().mockReturnValue({}) };
    const tower = new ICETower(mockVectorMaterials as never);
    expect(tower.health).toBe(ICE_TOWER_HEALTH);
    expect(tower.scoreValue).toBe(ICE_TOWER_SCORE_VALUE);
  });

  it('should accept custom BehaviorParams', async () => {
    const { ICETower } = await import('../entities/enemies/ICETower.ts');
    ICETower.resetSharedResources();
    const mockVectorMaterials = { create: vi.fn().mockReturnValue({}) };
    const customParams = {
      patrolSpeed: 0, attackCooldown: 5.0, evasionChance: 0,
      movementRandomness: 0, attackDamage: 20, projectileSpeed: 25,
    };
    const tower = new ICETower(mockVectorMaterials as never, customParams);
    expect(tower.params.attackCooldown).toBe(5.0);
  });

  it('should call vectorMaterials.create with iceTower id', async () => {
    const { ICETower } = await import('../entities/enemies/ICETower.ts');
    ICETower.resetSharedResources();
    const mockVectorMaterials = { create: vi.fn().mockReturnValue({}) };
    new ICETower(mockVectorMaterials as never);
    expect(mockVectorMaterials.create).toHaveBeenCalledWith('iceTower');
  });

  it('should reuse shared geometry across instances', async () => {
    const { ICETower } = await import('../entities/enemies/ICETower.ts');
    ICETower.resetSharedResources();
    const mockVectorMaterials = { create: vi.fn().mockReturnValue({}) };
    new ICETower(mockVectorMaterials as never);
    new ICETower(mockVectorMaterials as never);
    // create() should only be called once for shared material
    expect(mockVectorMaterials.create).toHaveBeenCalledTimes(1);
  });

  it('should have ICE_TOWER_BEHAVIOR params by default (stationary turret)', async () => {
    const { ICETower } = await import('../entities/enemies/ICETower.ts');
    ICETower.resetSharedResources();
    const mockVectorMaterials = { create: vi.fn().mockReturnValue({}) };
    const tower = new ICETower(mockVectorMaterials as never);
    expect(tower.params.patrolSpeed).toBe(0);
    expect(tower.params.attackCooldown).toBe(3.0);
    expect(tower.params.attackDamage).toBe(12);
    expect(tower.params.projectileSpeed).toBe(14);
  });

  it('should implement Poolable reset behavior', async () => {
    const { ICETower } = await import('../entities/enemies/ICETower.ts');
    ICETower.resetSharedResources();
    const mockVectorMaterials = { create: vi.fn().mockReturnValue({}) };
    const tower = new ICETower(mockVectorMaterials as never);
    // Simulate damage
    tower.health = 10;
    // Reset should restore to full health
    tower.reset();
    expect(tower.health).toBe(50);
    expect(tower.isActive).toBe(false);
  });

  it('should support attack state wiring via transitionToState', async () => {
    const { ICETower } = await import('../entities/enemies/ICETower.ts');
    ICETower.resetSharedResources();
    const mockVectorMaterials = { create: vi.fn().mockReturnValue({}) };
    const tower = new ICETower(mockVectorMaterials as never);
    // transitionToState is inherited from Enemy
    expect(typeof tower.transitionToState).toBe('function');
  });
});
