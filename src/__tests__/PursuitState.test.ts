import { describe, it, expect, vi } from 'vitest';

// Mock three.js with functional Vector3
vi.mock('three', () => {
  class MockVector3 {
    x: number; y: number; z: number;
    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
    copy(v: MockVector3) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
    set(x: number, y: number, z: number) { this.x = x; this.y = y; this.z = z; return this; }
    subVectors(a: MockVector3, b: MockVector3) {
      this.x = a.x - b.x;
      this.y = a.y - b.y;
      this.z = a.z - b.z;
      return this;
    }
    normalize() {
      const len = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
      if (len > 0) { this.x /= len; this.y /= len; this.z /= len; }
      return this;
    }
    length() {
      return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }
    addScaledVector(v: MockVector3, s: number) {
      this.x += v.x * s;
      this.y += v.y * s;
      this.z += v.z * s;
      return this;
    }
    lerp(target: MockVector3, alpha: number) {
      this.x += (target.x - this.x) * alpha;
      this.y += (target.y - this.y) * alpha;
      this.z += (target.z - this.z) * alpha;
      return this;
    }
    setScalar(s: number) { this.x = s; this.y = s; this.z = s; return this; }
    add = vi.fn().mockReturnThis();
  }
  class MockObject3D {
    position = new MockVector3();
    scale = new MockVector3(1, 1, 1);
    visible = true;
    traverse = vi.fn();
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
  return {
    Object3D: MockObject3D,
    Sphere: MockSphere,
    Vector3: MockVector3,
  };
});

describe('PursuitState (Story 3-1)', () => {
  it('should export PursuitState class', async () => {
    const mod = await import('../ai/states/PursuitState.ts');
    expect(mod.PursuitState).toBeDefined();
    expect(typeof mod.PursuitState).toBe('function');
  });

  it('should implement AIState interface (has enter/update/exit on prototype)', async () => {
    const mod = await import('../ai/states/PursuitState.ts');
    const proto = mod.PursuitState.prototype;
    expect(typeof proto.enter).toBe('function');
    expect(typeof proto.update).toBe('function');
    expect(typeof proto.exit).toBe('function');
  });

  it('should accept playerPositionGetter and optional createAttackState', async () => {
    const { PursuitState } = await import('../ai/states/PursuitState.ts');
    const THREE = await import('three');
    const getter = () => new THREE.Vector3(10, 0, 10);
    const state = new PursuitState(getter);
    expect(state).toBeDefined();

    const stateWithAttack = new PursuitState(getter, () => ({
      enter: vi.fn(), update: vi.fn(), exit: vi.fn(),
    }));
    expect(stateWithAttack).toBeDefined();
  });

  it('should move enemy toward player when beyond engage distance', async () => {
    const { PursuitState } = await import('../ai/states/PursuitState.ts');
    const THREE = await import('three');

    // Player at (30, 0, 0), enemy at (0, 0, 0) -- distance 30, well beyond engage distance of 8
    const playerPos = new THREE.Vector3(30, 0, 0);
    const getter = () => playerPos;
    const state = new PursuitState(getter);

    // Create a mock enemy
    const enemyObj = new THREE.Object3D();
    enemyObj.position.set(0, 0, 0);
    const mockEnemy = {
      getObject3D: () => enemyObj,
      params: { patrolSpeed: 1.5 },
      transitionToState: vi.fn(),
    };

    state.enter(mockEnemy as never);
    state.update(mockEnemy as never, 1.0); // 1 second

    // Enemy should have moved closer to player (positive x direction)
    // Speed = 1.5 * 1.8 = 2.7 units/sec, so after 1s should be at ~2.7 in x
    expect(enemyObj.position.x).toBeGreaterThan(0);
    expect(enemyObj.position.x).toBeCloseTo(2.7, 1);
  });

  it('should not move closer when within engage distance', async () => {
    const { PursuitState } = await import('../ai/states/PursuitState.ts');
    const THREE = await import('three');

    // Player at (5, 0, 0), enemy at (0, 0, 0) -- distance 5, within engage distance of 8
    const playerPos = new THREE.Vector3(5, 0, 0);
    const getter = () => playerPos;
    const state = new PursuitState(getter);

    const enemyObj = new THREE.Object3D();
    enemyObj.position.set(0, 0, 0);
    const mockEnemy = {
      getObject3D: () => enemyObj,
      params: { patrolSpeed: 1.5 },
      transitionToState: vi.fn(),
    };

    state.enter(mockEnemy as never);
    const initialX = enemyObj.position.x;
    state.update(mockEnemy as never, 0.016);

    // Within engage distance: enemy should orbit/strafe, not chase directly
    // The position should change but not necessarily toward the player in a straight line
    // Just verify movement happens (not zero change)
    const movedX = enemyObj.position.x !== initialX;
    const movedZ = enemyObj.position.z !== 0;
    expect(movedX || movedZ).toBe(true);
  });

  it('should transition to AttackState after WATCHDOG_ATTACK_INTERVAL', async () => {
    const { PursuitState } = await import('../ai/states/PursuitState.ts');
    const { WATCHDOG_ATTACK_INTERVAL } = await import('../config/constants.ts');
    const THREE = await import('three');

    const playerPos = new THREE.Vector3(30, 0, 0);
    const getter = () => playerPos;
    const mockAttackState = { enter: vi.fn(), update: vi.fn(), exit: vi.fn() };
    const createAttack = () => mockAttackState;
    const state = new PursuitState(getter, createAttack);

    const enemyObj = new THREE.Object3D();
    enemyObj.position.set(0, 0, 0);
    const mockEnemy = {
      getObject3D: () => enemyObj,
      params: { patrolSpeed: 1.5 },
      transitionToState: vi.fn(),
    };

    state.enter(mockEnemy as never);

    // Update with enough dt to exceed WATCHDOG_ATTACK_INTERVAL
    state.update(mockEnemy as never, WATCHDOG_ATTACK_INTERVAL + 0.1);

    expect(mockEnemy.transitionToState).toHaveBeenCalled();
  });

  it('should NOT transition to AttackState before interval', async () => {
    const { PursuitState } = await import('../ai/states/PursuitState.ts');
    const THREE = await import('three');

    const playerPos = new THREE.Vector3(30, 0, 0);
    const getter = () => playerPos;
    const mockAttackState = { enter: vi.fn(), update: vi.fn(), exit: vi.fn() };
    const createAttack = () => mockAttackState;
    const state = new PursuitState(getter, createAttack);

    const enemyObj = new THREE.Object3D();
    enemyObj.position.set(0, 0, 0);
    const mockEnemy = {
      getObject3D: () => enemyObj,
      params: { patrolSpeed: 1.5 },
      transitionToState: vi.fn(),
    };

    state.enter(mockEnemy as never);
    // Update with small dt (well under 2.5s interval)
    state.update(mockEnemy as never, 0.5);

    expect(mockEnemy.transitionToState).not.toHaveBeenCalled();
  });

  it('should reset attack timer on enter', async () => {
    const { PursuitState } = await import('../ai/states/PursuitState.ts');
    const { WATCHDOG_ATTACK_INTERVAL } = await import('../config/constants.ts');
    const THREE = await import('three');

    const playerPos = new THREE.Vector3(30, 0, 0);
    const getter = () => playerPos;
    const mockAttackState = { enter: vi.fn(), update: vi.fn(), exit: vi.fn() };
    const createAttack = () => mockAttackState;
    const state = new PursuitState(getter, createAttack);

    const enemyObj = new THREE.Object3D();
    enemyObj.position.set(0, 0, 0);
    const mockEnemy = {
      getObject3D: () => enemyObj,
      params: { patrolSpeed: 1.5 },
      transitionToState: vi.fn(),
    };

    // Accumulate timer near the threshold
    state.enter(mockEnemy as never);
    state.update(mockEnemy as never, WATCHDOG_ATTACK_INTERVAL - 0.5);

    // Re-enter resets timer
    state.enter(mockEnemy as never);
    state.update(mockEnemy as never, 0.3);

    // Should NOT have transitioned because timer was reset
    expect(mockEnemy.transitionToState).not.toHaveBeenCalled();
  });
});
