import { describe, it, expect, vi } from 'vitest';

// Mock three.js
vi.mock('three', () => {
  class MockVector3 {
    x: number; y: number; z: number;
    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
    copy(v: MockVector3) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
    set(x: number, y: number, z: number) { this.x = x; this.y = y; this.z = z; return this; }
    setScalar(s: number) { this.x = s; this.y = s; this.z = s; return this; }
    subVectors(a: MockVector3, b: MockVector3) { this.x = a.x - b.x; this.y = a.y - b.y; this.z = a.z - b.z; return this; }
    normalize() {
      const len = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
      if (len > 0) { this.x /= len; this.y /= len; this.z /= len; }
      return this;
    }
    crossVectors(a: MockVector3, b: MockVector3) {
      this.x = a.y * b.z - a.z * b.y;
      this.y = a.z * b.x - a.x * b.z;
      this.z = a.x * b.y - a.y * b.x;
      return this;
    }
    negate() { this.x = -this.x; this.y = -this.y; this.z = -this.z; return this; }
    addScaledVector(v: MockVector3, s: number) { this.x += v.x * s; this.y += v.y * s; this.z += v.z * s; return this; }
  }
  class MockObject3D {
    position = new MockVector3();
    scale = new MockVector3(1, 1, 1);
    visible = true;
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

describe('EvadeState (Story 5-7)', () => {
  function createMockEnemy(x = 0, y = 0, z = 0) {
    const position = {
      x, y, z,
      set: vi.fn((px: number, py: number, pz: number) => { position.x = px; position.y = py; position.z = pz; }),
      copy: vi.fn(),
      addScaledVector: vi.fn((v: { x: number; y: number; z: number }, s: number) => {
        position.x += v.x * s;
        position.y += v.y * s;
        position.z += v.z * s;
      }),
    };
    const scale = { x: 1, y: 1, z: 1, setScalar: vi.fn() };
    const object3D = { position, scale, visible: true, add: vi.fn() };
    return {
      getObject3D: () => object3D,
      getEffectiveParams: () => ({
        patrolSpeed: 1.5,
        attackCooldown: 1.2,
        evasionChance: 0.5,
        movementRandomness: 0.5,
        attackDamage: 15,
        projectileSpeed: 20,
      }),
      params: {
        patrolSpeed: 1.5,
        attackCooldown: 1.2,
        evasionChance: 0.5,
        movementRandomness: 0.5,
        attackDamage: 15,
        projectileSpeed: 20,
      },
      transitionToState: vi.fn(),
    } as never;
  }

  it('should export EvadeState class', async () => {
    const mod = await import('../ai/states/EvadeState.ts');
    expect(mod.EvadeState).toBeDefined();
    expect(typeof mod.EvadeState).toBe('function');
  });

  it('should implement AIState interface (enter, update, exit)', async () => {
    const { EvadeState } = await import('../ai/states/EvadeState.ts');
    const proto = EvadeState.prototype;
    expect(typeof proto.enter).toBe('function');
    expect(typeof proto.update).toBe('function');
    expect(typeof proto.exit).toBe('function');
  });

  it('should accept playerPositionGetter and returnState in constructor', async () => {
    const { EvadeState } = await import('../ai/states/EvadeState.ts');
    const returnState = { enter: vi.fn(), update: vi.fn(), exit: vi.fn() };
    const state = new EvadeState(
      () => ({ x: 10, y: 0, z: 0 }) as never,
      returnState as never,
    );
    expect(state).toBeDefined();
  });

  it('should move enemy position during evasion', async () => {
    const { EvadeState } = await import('../ai/states/EvadeState.ts');
    const returnState = { enter: vi.fn(), update: vi.fn(), exit: vi.fn() };
    const state = new EvadeState(
      () => ({ x: 10, y: 0, z: 0 }) as never,
      returnState as never,
    );
    const enemy = createMockEnemy(0, 0, 0);
    state.enter(enemy);

    const posBefore = { ...(enemy as unknown as { getObject3D: () => { position: { x: number; y: number; z: number } } }).getObject3D().position };
    state.update(enemy, 0.1);
    const posAfter = (enemy as unknown as { getObject3D: () => { position: { x: number; y: number; z: number } } }).getObject3D().position;

    // Enemy should have moved (addScaledVector called)
    expect(posAfter.addScaledVector).toHaveBeenCalled();
  });

  it('should transition to returnState after EVASION_DURATION', async () => {
    const { EvadeState } = await import('../ai/states/EvadeState.ts');
    const { EVASION_DURATION } = await import('../config/constants.ts');
    const returnState = { enter: vi.fn(), update: vi.fn(), exit: vi.fn() };
    const state = new EvadeState(
      () => ({ x: 10, y: 0, z: 0 }) as never,
      returnState as never,
    );
    const enemy = createMockEnemy(0, 0, 0);
    state.enter(enemy);

    // Update past evasion duration
    state.update(enemy, EVASION_DURATION + 0.1);

    expect((enemy as unknown as { transitionToState: ReturnType<typeof vi.fn> }).transitionToState).toHaveBeenCalledWith(returnState);
  });

  it('should NOT transition before EVASION_DURATION', async () => {
    const { EvadeState } = await import('../ai/states/EvadeState.ts');
    const { EVASION_DURATION } = await import('../config/constants.ts');
    const returnState = { enter: vi.fn(), update: vi.fn(), exit: vi.fn() };
    const state = new EvadeState(
      () => ({ x: 10, y: 0, z: 0 }) as never,
      returnState as never,
    );
    const enemy = createMockEnemy(0, 0, 0);
    state.enter(enemy);

    // Update to just before evasion duration
    state.update(enemy, EVASION_DURATION - 0.1);

    expect((enemy as unknown as { transitionToState: ReturnType<typeof vi.fn> }).transitionToState).not.toHaveBeenCalled();
  });

  it('should use patrolSpeed * EVASION_SPEED_MULTIPLIER for movement speed', async () => {
    const { EvadeState } = await import('../ai/states/EvadeState.ts');
    const { EVASION_SPEED_MULTIPLIER } = await import('../config/constants.ts');
    const returnState = { enter: vi.fn(), update: vi.fn(), exit: vi.fn() };
    const state = new EvadeState(
      () => ({ x: 10, y: 0, z: 0 }) as never,
      returnState as never,
    );
    const enemy = createMockEnemy(0, 0, 0);
    state.enter(enemy);

    const dt = 0.1;
    state.update(enemy, dt);

    // Verify addScaledVector was called with correct speed argument
    const posObj = (enemy as unknown as { getObject3D: () => { position: { addScaledVector: ReturnType<typeof vi.fn> } } }).getObject3D().position;
    const call = posObj.addScaledVector.mock.calls[0];
    // The second argument should be speed * dt = patrolSpeed * EVASION_SPEED_MULTIPLIER * dt
    const expectedSpeedDt = 1.5 * EVASION_SPEED_MULTIPLIER * dt;
    expect(call[1]).toBeCloseTo(expectedSpeedDt);
  });
});
