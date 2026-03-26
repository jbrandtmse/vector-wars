import { describe, it, expect, vi } from 'vitest';

// Mock three.js
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
  class MockOctahedronGeometry {
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
    OctahedronGeometry: MockOctahedronGeometry,
    EdgesGeometry: MockEdgesGeometry,
    LineSegments: MockLineSegments,
    LineBasicMaterial: MockLineBasicMaterial,
  };
});

describe('Enemy Poolable support', () => {
  it('should have a reset() method on Enemy prototype', async () => {
    const { Enemy } = await import('../entities/enemies/Enemy.ts');
    expect(typeof Enemy.prototype.reset).toBe('function');
  });

  it('should have a maxHealth property after construction', async () => {
    const { Enemy } = await import('../entities/enemies/Enemy.ts');
    class TestEnemy extends Enemy {
      constructor() {
        super(75, 100, {
          patrolSpeed: 1, attackCooldown: 2, evasionChance: 0,
          movementRandomness: 0, attackDamage: 10, projectileSpeed: 15,
        }, 1.0);
      }
    }
    const e = new TestEnemy();
    expect((e as unknown as { maxHealth: number }).maxHealth).toBe(75);
  });

  it('should restore health to maxHealth on reset()', async () => {
    const { Enemy } = await import('../entities/enemies/Enemy.ts');
    class TestEnemy extends Enemy {
      constructor() {
        super(100, 50, {
          patrolSpeed: 1, attackCooldown: 2, evasionChance: 0,
          movementRandomness: 0, attackDamage: 10, projectileSpeed: 15,
        }, 1.0);
      }
    }
    const e = new TestEnemy();
    e.takeDamage(40);
    expect(e.health).toBe(60);
    e.reset();
    expect(e.health).toBe(100);
  });

  it('should set active to false on reset()', async () => {
    const { Enemy } = await import('../entities/enemies/Enemy.ts');
    class TestEnemy extends Enemy {
      constructor() {
        super(100, 50, {
          patrolSpeed: 1, attackCooldown: 2, evasionChance: 0,
          movementRandomness: 0, attackDamage: 10, projectileSpeed: 15,
        }, 1.0);
      }
    }
    const e = new TestEnemy();
    // Enemy starts active by default (from GameObject)
    e.reset();
    expect(e.isActive).toBe(false);
  });

  it('should set visible to false on reset()', async () => {
    const { Enemy } = await import('../entities/enemies/Enemy.ts');
    class TestEnemy extends Enemy {
      constructor() {
        super(100, 50, {
          patrolSpeed: 1, attackCooldown: 2, evasionChance: 0,
          movementRandomness: 0, attackDamage: 10, projectileSpeed: 15,
        }, 1.0);
      }
    }
    const e = new TestEnemy();
    e.reset();
    expect(e.getObject3D().visible).toBe(false);
  });

  it('should reset scale to 1.0 on reset() (clears flash state)', async () => {
    const { Enemy } = await import('../entities/enemies/Enemy.ts');
    class TestEnemy extends Enemy {
      constructor() {
        super(100, 50, {
          patrolSpeed: 1, attackCooldown: 2, evasionChance: 0,
          movementRandomness: 0, attackDamage: 10, projectileSpeed: 15,
        }, 1.0);
      }
    }
    const e = new TestEnemy();
    e.takeDamage(5); // triggers flash scale to 1.4
    e.reset();
    const obj = e.getObject3D();
    expect(obj.scale.x).toBeCloseTo(1.0);
  });
});

describe('Sentinel with ObjectPool', () => {
  it('should be usable with ObjectPool (has reset method)', async () => {
    const { Sentinel } = await import('../entities/enemies/Sentinel.ts');
    const { ObjectPool } = await import('../core/ObjectPool.ts');
    const mockVectorMaterials = { create: vi.fn().mockReturnValue({}) };
    const pool = new ObjectPool<Sentinel>(
      () => new Sentinel(mockVectorMaterials as never),
      3,
    );
    expect(pool.totalCount).toBe(3);
    const sentinel = pool.acquire()!;
    expect(sentinel).toBeDefined();
    pool.release(sentinel);
    expect(pool.availableCount).toBe(3);
  });

  it('should reset health to SENTINEL_HEALTH on release', async () => {
    const { Sentinel } = await import('../entities/enemies/Sentinel.ts');
    const { SENTINEL_HEALTH } = await import('../config/constants.ts');
    const { ObjectPool } = await import('../core/ObjectPool.ts');
    const mockVectorMaterials = { create: vi.fn().mockReturnValue({}) };
    const pool = new ObjectPool<Sentinel>(
      () => new Sentinel(mockVectorMaterials as never),
      1,
    );
    const sentinel = pool.acquire()!;
    sentinel.takeDamage(10);
    expect(sentinel.health).toBe(SENTINEL_HEALTH - 10);
    pool.release(sentinel);
    expect(sentinel.health).toBe(SENTINEL_HEALTH);
  });
});
