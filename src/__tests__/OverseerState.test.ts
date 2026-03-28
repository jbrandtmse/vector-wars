import { describe, it, expect, vi } from 'vitest';

// Mock three.js
vi.mock('three', () => {
  class MockVector3 {
    x: number; y: number; z: number;
    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
    copy(v: MockVector3) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
    set(x: number, y: number, z: number) { this.x = x; this.y = y; this.z = z; return this; }
    setScalar(s: number) { this.x = s; this.y = s; this.z = s; return this; }
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

describe('OverseerState (Story 5-6)', () => {
  function createMockEnemy(x = 0, y = 0, z = 0) {
    const THREE = vi.importMock('three') as unknown as {
      Vector3: new (x: number, y: number, z: number) => { x: number; y: number; z: number };
    };
    const spawnPosition = { x, y, z, copy: vi.fn(), set: vi.fn() };
    const position = { x: 0, y: 0, z: 0, set: vi.fn((px: number, py: number, pz: number) => { position.x = px; position.y = py; position.z = pz; }), copy: vi.fn() };
    const scale = { x: 1, y: 1, z: 1, setScalar: vi.fn((s: number) => { scale.x = s; scale.y = s; scale.z = s; }) };
    const object3D = { position, scale, visible: true, add: vi.fn() };
    return {
      getSpawnPosition: () => spawnPosition,
      getObject3D: () => object3D,
      getEffectiveParams: () => ({
        patrolSpeed: 1.2,
        attackCooldown: 2.5,
        evasionChance: 0.15,
        movementRandomness: 0.1,
        attackDamage: 15,
        projectileSpeed: 16,
      }),
      params: {
        patrolSpeed: 1.2,
        attackCooldown: 2.5,
        evasionChance: 0.15,
        movementRandomness: 0.1,
        attackDamage: 15,
        projectileSpeed: 16,
      },
      transitionToState: vi.fn(),
      id: 99,
      isActive: true,
    } as never;
  }

  function createMockNearbyEnemy(x: number, y: number, z: number) {
    const position = { x, y, z, set: vi.fn(), copy: vi.fn() };
    const scale = { x: 1, y: 1, z: 1, setScalar: vi.fn() };
    return {
      getObject3D: () => ({ position, scale, visible: true, add: vi.fn() }),
      isActive: true,
      params: {
        patrolSpeed: 1.0,
        attackCooldown: 2.0,
        evasionChance: 0.0,
        movementRandomness: 0.0,
        attackDamage: 10,
        projectileSpeed: 15,
      },
      id: Math.random(),
    };
  }

  it('should export OverseerState class', async () => {
    const mod = await import('../ai/states/OverseerState.ts');
    expect(mod.OverseerState).toBeDefined();
    expect(typeof mod.OverseerState).toBe('function');
  });

  it('should implement AIState interface (enter, update, exit)', async () => {
    const { OverseerState } = await import('../ai/states/OverseerState.ts');
    const proto = OverseerState.prototype;
    expect(typeof proto.enter).toBe('function');
    expect(typeof proto.update).toBe('function');
    expect(typeof proto.exit).toBe('function');
  });

  it('should accept GameObjectManager and playerPositionGetter in constructor', async () => {
    const { OverseerState } = await import('../ai/states/OverseerState.ts');
    const { GameObjectManager } = await import('../entities/GameObjectManager.ts');
    const gom = new GameObjectManager();
    const state = new OverseerState(gom, () => ({ x: 0, y: 0, z: 0 }) as never);
    expect(state).toBeDefined();
  });

  it('should update enemy position (orbit movement) on each update call', async () => {
    const { OverseerState } = await import('../ai/states/OverseerState.ts');
    const { GameObjectManager } = await import('../entities/GameObjectManager.ts');
    const gom = new GameObjectManager();
    const state = new OverseerState(gom, () => ({ x: 0, y: 0, z: 0 }) as never);
    const enemy = createMockEnemy(10, 5, 20);
    state.enter(enemy);
    state.update(enemy, 0.5);
    // Position should have been set (orbit around spawn)
    const pos = (enemy as unknown as { getObject3D: () => { position: { set: ReturnType<typeof vi.fn> } } }).getObject3D().position.set;
    expect(pos).toHaveBeenCalled();
  });

  it('should trigger buff pulse after OVERSEER_BUFF_INTERVAL seconds', async () => {
    const { OverseerState } = await import('../ai/states/OverseerState.ts');
    const { GameObjectManager } = await import('../entities/GameObjectManager.ts');
    const { OVERSEER_BUFF_INTERVAL } = await import('../config/constants.ts');
    const gom = new GameObjectManager();
    const state = new OverseerState(gom, () => ({ x: 0, y: 0, z: 0 }) as never);
    const enemy = createMockEnemy(0, 0, 0);
    state.enter(enemy);

    // Run updates totaling just under buff interval
    state.update(enemy, OVERSEER_BUFF_INTERVAL - 0.1);
    const scaleFn = (enemy as unknown as { getObject3D: () => { scale: { setScalar: ReturnType<typeof vi.fn> } } }).getObject3D().scale.setScalar;
    const callsBeforeBuff = scaleFn.mock.calls.length;

    // Cross the buff interval
    state.update(enemy, 0.2);
    // Scale should have been set (buff pulse visual)
    expect(scaleFn.mock.calls.length).toBeGreaterThan(callsBeforeBuff);
  });

  it('should buff nearby enemies within OVERSEER_BUFF_RADIUS', async () => {
    const { OverseerState } = await import('../ai/states/OverseerState.ts');
    const { GameObjectManager } = await import('../entities/GameObjectManager.ts');
    const { OVERSEER_BUFF_INTERVAL, OVERSEER_BUFF_COOLDOWN_MULTIPLIER, OVERSEER_BUFF_SPEED_MULTIPLIER } = await import('../config/constants.ts');
    const gom = new GameObjectManager();

    // Create a nearby enemy (within buff radius, distance ~5)
    const nearbyEnemy = createMockNearbyEnemy(5, 0, 0);
    gom.add(nearbyEnemy as never);

    const state = new OverseerState(gom, () => ({ x: 0, y: 0, z: 0 }) as never);
    const enemy = createMockEnemy(0, 0, 0);
    state.enter(enemy);

    const originalCooldown = nearbyEnemy.params.attackCooldown;
    const originalSpeed = nearbyEnemy.params.patrolSpeed;

    // Trigger buff
    state.update(enemy, OVERSEER_BUFF_INTERVAL + 0.01);

    // Nearby enemy should have buffed params
    expect(nearbyEnemy.params.attackCooldown).toBeCloseTo(originalCooldown * OVERSEER_BUFF_COOLDOWN_MULTIPLIER);
    expect(nearbyEnemy.params.patrolSpeed).toBeCloseTo(originalSpeed * OVERSEER_BUFF_SPEED_MULTIPLIER);
  });

  it('should NOT buff enemies outside OVERSEER_BUFF_RADIUS', async () => {
    const { OverseerState } = await import('../ai/states/OverseerState.ts');
    const { GameObjectManager } = await import('../entities/GameObjectManager.ts');
    const { OVERSEER_BUFF_INTERVAL } = await import('../config/constants.ts');
    const gom = new GameObjectManager();

    // Create a far away enemy (well outside 15.0 buff radius)
    const farEnemy = createMockNearbyEnemy(100, 0, 100);
    gom.add(farEnemy as never);

    const state = new OverseerState(gom, () => ({ x: 0, y: 0, z: 0 }) as never);
    const enemy = createMockEnemy(0, 0, 0);
    state.enter(enemy);

    const originalCooldown = farEnemy.params.attackCooldown;
    const originalSpeed = farEnemy.params.patrolSpeed;

    // Trigger buff
    state.update(enemy, OVERSEER_BUFF_INTERVAL + 0.01);

    // Far enemy should NOT be buffed
    expect(farEnemy.params.attackCooldown).toBe(originalCooldown);
    expect(farEnemy.params.patrolSpeed).toBe(originalSpeed);
  });

  it('should transition to AttackState after attackCooldown', async () => {
    const { OverseerState } = await import('../ai/states/OverseerState.ts');
    const { GameObjectManager } = await import('../entities/GameObjectManager.ts');
    const gom = new GameObjectManager();
    const mockAttackState = { enter: vi.fn(), update: vi.fn(), exit: vi.fn() };
    const createAttack = () => mockAttackState as never;
    const state = new OverseerState(gom, () => ({ x: 0, y: 0, z: 0 }) as never, createAttack);
    const enemy = createMockEnemy(0, 0, 0);
    state.enter(enemy);

    // Update past the attack cooldown (2.5s from mock params)
    state.update(enemy, 2.6);

    expect((enemy as unknown as { transitionToState: ReturnType<typeof vi.fn> }).transitionToState).toHaveBeenCalled();
  });

  it('should not transition to AttackState before attackCooldown', async () => {
    const { OverseerState } = await import('../ai/states/OverseerState.ts');
    const { GameObjectManager } = await import('../entities/GameObjectManager.ts');
    const gom = new GameObjectManager();
    const mockAttackState = { enter: vi.fn(), update: vi.fn(), exit: vi.fn() };
    const createAttack = () => mockAttackState as never;
    const state = new OverseerState(gom, () => ({ x: 0, y: 0, z: 0 }) as never, createAttack);
    const enemy = createMockEnemy(0, 0, 0);
    state.enter(enemy);

    // Update to just before cooldown
    state.update(enemy, 2.0);

    expect((enemy as unknown as { transitionToState: ReturnType<typeof vi.fn> }).transitionToState).not.toHaveBeenCalled();
  });
});
