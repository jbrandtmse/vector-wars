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

describe('Enemy Exports', () => {
  it('should export Enemy class', async () => {
    const mod = await import('../entities/enemies/Enemy.ts');
    expect(mod.Enemy).toBeDefined();
    expect(typeof mod.Enemy).toBe('function');
  });

  it('should export Sentinel class', async () => {
    const mod = await import('../entities/enemies/Sentinel.ts');
    expect(mod.Sentinel).toBeDefined();
    expect(typeof mod.Sentinel).toBe('function');
  });

  it('should verify BehaviorParams shape via constants export', async () => {
    const mod = await import('../config/constants.ts');
    const params = mod.SENTINEL_BEHAVIOR_LEVEL1;
    expect(params).toHaveProperty('patrolSpeed');
    expect(params).toHaveProperty('attackCooldown');
    expect(params).toHaveProperty('evasionChance');
    expect(params).toHaveProperty('movementRandomness');
    expect(params).toHaveProperty('attackDamage');
    expect(params).toHaveProperty('projectileSpeed');
  });
});

describe('Enemy Base Class', () => {
  it('should have unique incrementing ids', async () => {
    const { Enemy } = await import('../entities/enemies/Enemy.ts');
    // Create a concrete subclass inline
    class TestEnemy extends Enemy {
      constructor() {
        super(100, 50, {
          patrolSpeed: 1, attackCooldown: 2, evasionChance: 0,
          movementRandomness: 0, attackDamage: 10, projectileSpeed: 15,
        }, 1.0);
      }
    }
    const e1 = new TestEnemy();
    const e2 = new TestEnemy();
    expect(e2.id).toBe(e1.id + 1);
  });

  it('should store health, scoreValue, and params', async () => {
    const { Enemy } = await import('../entities/enemies/Enemy.ts');
    class TestEnemy extends Enemy {
      constructor() {
        super(75, 200, {
          patrolSpeed: 2, attackCooldown: 3, evasionChance: 0.1,
          movementRandomness: 0.2, attackDamage: 15, projectileSpeed: 20,
        }, 2.0);
      }
    }
    const e = new TestEnemy();
    expect(e.health).toBe(75);
    expect(e.scoreValue).toBe(200);
    expect(e.params.patrolSpeed).toBe(2);
    expect(e.params.attackDamage).toBe(15);
  });

  it('should transition between AI states', async () => {
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
    const mockState = {
      enter: vi.fn(),
      update: vi.fn(),
      exit: vi.fn(),
    };
    e.transitionToState(mockState);
    expect(mockState.enter).toHaveBeenCalledWith(e);
  });

  it('should call current state update on enemy update', async () => {
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
    const mockState = {
      enter: vi.fn(),
      update: vi.fn(),
      exit: vi.fn(),
    };
    e.transitionToState(mockState);
    e.update(0.016);
    expect(mockState.update).toHaveBeenCalledWith(e, 0.016);
  });

  it('should exit previous state on transition', async () => {
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
    const state1 = { enter: vi.fn(), update: vi.fn(), exit: vi.fn() };
    const state2 = { enter: vi.fn(), update: vi.fn(), exit: vi.fn() };
    e.transitionToState(state1);
    e.transitionToState(state2);
    expect(state1.exit).toHaveBeenCalledWith(e);
    expect(state2.enter).toHaveBeenCalledWith(e);
  });

  it('should set and get spawn position', async () => {
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
    const spawnPos = e.getSpawnPosition();
    expect(spawnPos).toBeDefined();
  });
});

describe('Sentinel Class', () => {
  it('should create a Sentinel with default params', async () => {
    const { Sentinel } = await import('../entities/enemies/Sentinel.ts');
    const mockVectorMaterials = {
      create: vi.fn().mockReturnValue({}),
    };
    const sentinel = new Sentinel(mockVectorMaterials as never);
    expect(sentinel).toBeDefined();
  });

  it('should use SENTINEL_HEALTH and SENTINEL_SCORE_VALUE defaults', async () => {
    const { Sentinel } = await import('../entities/enemies/Sentinel.ts');
    const { SENTINEL_HEALTH, SENTINEL_SCORE_VALUE } = await import('../config/constants.ts');
    const mockVectorMaterials = { create: vi.fn().mockReturnValue({}) };
    const sentinel = new Sentinel(mockVectorMaterials as never);
    expect(sentinel.health).toBe(SENTINEL_HEALTH);
    expect(sentinel.scoreValue).toBe(SENTINEL_SCORE_VALUE);
  });

  it('should accept custom BehaviorParams', async () => {
    const { Sentinel } = await import('../entities/enemies/Sentinel.ts');
    const mockVectorMaterials = { create: vi.fn().mockReturnValue({}) };
    const customParams = {
      patrolSpeed: 3.0, attackCooldown: 1.0, evasionChance: 0.5,
      movementRandomness: 0.3, attackDamage: 20, projectileSpeed: 25,
    };
    const sentinel = new Sentinel(mockVectorMaterials as never, customParams);
    expect(sentinel.params.patrolSpeed).toBe(3.0);
  });
});
