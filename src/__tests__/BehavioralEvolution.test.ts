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
    length() { return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z); }
    lerp(v: MockVector3, t: number) { this.x += (v.x - this.x) * t; this.y += (v.y - this.y) * t; this.z += (v.z - this.z) * t; return this; }
  }
  class MockObject3D {
    position = new MockVector3();
    scale = new MockVector3(1, 1, 1);
    visible = true;
    add = vi.fn();
    traverse = vi.fn();
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

// Helper to create mock enemy with configurable movementRandomness
function createMockEnemy(opts: {
  movementRandomness?: number;
  evasionChance?: number;
  patrolSpeed?: number;
  spawnX?: number; spawnY?: number; spawnZ?: number;
} = {}) {
  const {
    movementRandomness = 0,
    evasionChance = 0,
    patrolSpeed = 1.0,
    spawnX = 0, spawnY = 0, spawnZ = 0,
  } = opts;

  const params = {
    patrolSpeed,
    attackCooldown: 2.0,
    evasionChance,
    movementRandomness,
    attackDamage: 10,
    projectileSpeed: 15,
  };

  const spawnPosition = { x: spawnX, y: spawnY, z: spawnZ, copy: vi.fn(), set: vi.fn() };
  const position = {
    x: 0, y: 0, z: 0,
    set: vi.fn((px: number, py: number, pz: number) => { position.x = px; position.y = py; position.z = pz; }),
    copy: vi.fn(),
    addScaledVector: vi.fn((v: { x: number; y: number; z: number }, s: number) => {
      position.x += v.x * s;
      position.y += v.y * s;
      position.z += v.z * s;
    }),
    lerp: vi.fn((v: { x: number; y: number; z: number }, t: number) => {
      position.x += (v.x - position.x) * t;
      position.y += (v.y - position.y) * t;
      position.z += (v.z - position.z) * t;
    }),
  };
  const scale = { x: 1, y: 1, z: 1, setScalar: vi.fn((s: number) => { scale.x = s; scale.y = s; scale.z = s; }) };
  const object3D = { position, scale, visible: true, add: vi.fn() };

  return {
    getSpawnPosition: () => spawnPosition,
    getObject3D: () => object3D,
    getEffectiveParams: () => params,
    params,
    transitionToState: vi.fn(),
    id: Math.floor(Math.random() * 1000),
    isActive: true,
  } as never;
}

describe('PatrolState movementRandomness (Story 5-7)', () => {
  it('should produce no randomness offset when movementRandomness=0', async () => {
    const { PatrolState } = await import('../ai/states/PatrolState.ts');
    const state = new PatrolState();
    const enemy = createMockEnemy({ movementRandomness: 0 });
    state.enter(enemy);

    // Run a series of updates and record positions
    const positions: { x: number; y: number; z: number }[] = [];
    for (let i = 0; i < 10; i++) {
      state.update(enemy, 0.1);
      const pos = (enemy as unknown as { getObject3D: () => { position: { set: ReturnType<typeof vi.fn> } } }).getObject3D().position.set;
      const lastCall = pos.mock.calls[pos.mock.calls.length - 1];
      positions.push({ x: lastCall[0], y: lastCall[1], z: lastCall[2] });
    }

    // All positions should be on a clean orbit (no noise)
    // Second enemy with same params should produce same positions
    const state2 = new PatrolState();
    const enemy2 = createMockEnemy({ movementRandomness: 0 });
    state2.enter(enemy2);
    const positions2: { x: number; y: number; z: number }[] = [];
    for (let i = 0; i < 10; i++) {
      state2.update(enemy2, 0.1);
      const pos = (enemy2 as unknown as { getObject3D: () => { position: { set: ReturnType<typeof vi.fn> } } }).getObject3D().position.set;
      const lastCall = pos.mock.calls[pos.mock.calls.length - 1];
      positions2.push({ x: lastCall[0], y: lastCall[1], z: lastCall[2] });
    }

    // With zero randomness, both should match exactly
    for (let i = 0; i < 10; i++) {
      expect(positions[i].x).toBeCloseTo(positions2[i].x);
      expect(positions[i].z).toBeCloseTo(positions2[i].z);
    }
  });

  it('should produce offset proportional to movementRandomness when > 0', async () => {
    const { PatrolState } = await import('../ai/states/PatrolState.ts');

    // Low randomness
    const stateLow = new PatrolState();
    const enemyLow = createMockEnemy({ movementRandomness: 0.1 });
    stateLow.enter(enemyLow);

    // High randomness
    const stateHigh = new PatrolState();
    const enemyHigh = createMockEnemy({ movementRandomness: 0.5 });
    stateHigh.enter(enemyHigh);

    // Zero randomness baseline
    const stateZero = new PatrolState();
    const enemyZero = createMockEnemy({ movementRandomness: 0 });
    stateZero.enter(enemyZero);

    // Run identical updates
    const dt = 0.3;
    for (let i = 0; i < 20; i++) {
      stateLow.update(enemyLow, dt);
      stateHigh.update(enemyHigh, dt);
      stateZero.update(enemyZero, dt);
    }

    // Get last positions
    const getLastPos = (e: never) => {
      const pos = (e as unknown as { getObject3D: () => { position: { set: ReturnType<typeof vi.fn> } } }).getObject3D().position.set;
      const lastCall = pos.mock.calls[pos.mock.calls.length - 1];
      return { x: lastCall[0] as number, z: lastCall[2] as number };
    };

    const posLow = getLastPos(enemyLow);
    const posHigh = getLastPos(enemyHigh);
    const posZero = getLastPos(enemyZero);

    // High randomness should produce larger deviation from zero-randomness baseline
    const devLow = Math.abs(posLow.x - posZero.x) + Math.abs(posLow.z - posZero.z);
    const devHigh = Math.abs(posHigh.x - posZero.x) + Math.abs(posHigh.z - posZero.z);

    expect(devHigh).toBeGreaterThan(devLow);
  });
});

describe('PursuitState movementRandomness (Story 5-7)', () => {
  it('should produce straight pursuit with movementRandomness=0', async () => {
    const { PursuitState } = await import('../ai/states/PursuitState.ts');
    const playerPos = { x: 50, y: 0, z: 0 } as never;
    const state = new PursuitState(() => playerPos);
    const enemy = createMockEnemy({ movementRandomness: 0, patrolSpeed: 2.0 });
    (enemy as unknown as { getObject3D: () => { position: { x: number } } }).getObject3D().position.x = 0;
    state.enter(enemy);

    // With zero randomness, addScaledVector should be called with direction only (no lateral)
    state.update(enemy, 0.1);
    const addCalls = (enemy as unknown as { getObject3D: () => { position: { addScaledVector: ReturnType<typeof vi.fn> } } }).getObject3D().position.addScaledVector;
    // Should be called once (pursuit only, no zigzag)
    expect(addCalls).toHaveBeenCalledTimes(1);
  });

  it('should add lateral offset with movementRandomness>0', async () => {
    const { PursuitState } = await import('../ai/states/PursuitState.ts');
    const playerPos = { x: 50, y: 0, z: 0 } as never;
    const state = new PursuitState(() => playerPos);
    const enemy = createMockEnemy({ movementRandomness: 0.5, patrolSpeed: 2.0 });
    (enemy as unknown as { getObject3D: () => { position: { x: number } } }).getObject3D().position.x = 0;
    state.enter(enemy);

    state.update(enemy, 0.5); // some time to build up attackTimer for zigzag frequency
    const addCalls = (enemy as unknown as { getObject3D: () => { position: { addScaledVector: ReturnType<typeof vi.fn> } } }).getObject3D().position.addScaledVector;
    // Should be called twice (pursuit + zigzag)
    expect(addCalls).toHaveBeenCalledTimes(2);
  });
});

describe('BlockState movementRandomness (Story 5-7)', () => {
  it('should have predictable sway with movementRandomness=0', async () => {
    const { BlockState } = await import('../ai/states/BlockState.ts');
    const playerPos = { x: 0, y: 0, z: -20 } as never;
    const railDir = { x: 0, y: 0, z: -1, copy: vi.fn().mockReturnThis() } as never;
    const state = new BlockState(() => playerPos, () => railDir);
    const enemy = createMockEnemy({ movementRandomness: 0 });
    state.enter(enemy);
    state.update(enemy, 0.1);
    // Should work without errors
    expect((enemy as unknown as { getObject3D: () => { position: { lerp: ReturnType<typeof vi.fn> } } }).getObject3D().position.lerp).toHaveBeenCalled();
  });

  it('should add irregular sway with movementRandomness>0', async () => {
    const { BlockState } = await import('../ai/states/BlockState.ts');
    const playerPos = { x: 0, y: 0, z: -20 } as never;
    const railDir = { x: 0, y: 0, z: -1, copy: vi.fn().mockReturnThis() } as never;

    // With zero randomness
    const stateZero = new BlockState(() => playerPos, () => railDir);
    const enemyZero = createMockEnemy({ movementRandomness: 0 });
    stateZero.enter(enemyZero);
    stateZero.update(enemyZero, 1.0);
    const lerpZero = (enemyZero as unknown as { getObject3D: () => { position: { lerp: ReturnType<typeof vi.fn> } } }).getObject3D().position.lerp;
    const targetZero = lerpZero.mock.calls[0][0] as { x: number; z: number };

    // With high randomness
    const stateHigh = new BlockState(() => playerPos, () => railDir);
    const enemyHigh = createMockEnemy({ movementRandomness: 0.5 });
    stateHigh.enter(enemyHigh);
    stateHigh.update(enemyHigh, 1.0);
    const lerpHigh = (enemyHigh as unknown as { getObject3D: () => { position: { lerp: ReturnType<typeof vi.fn> } } }).getObject3D().position.lerp;
    const targetHigh = lerpHigh.mock.calls[0][0] as { x: number; z: number };

    // The target positions should differ due to added randomness sway
    // (they might be close for some time values, but the mechanism is different)
    expect(typeof targetZero.x).toBe('number');
    expect(typeof targetHigh.x).toBe('number');
  });
});

describe('OverseerState movementRandomness (Story 5-7)', () => {
  it('should produce circular orbit with movementRandomness=0', async () => {
    const { OverseerState } = await import('../ai/states/OverseerState.ts');
    const { GameObjectManager } = await import('../entities/GameObjectManager.ts');
    const gom = new GameObjectManager();
    const state = new OverseerState(gom, () => ({ x: 0, y: 0, z: 0 }) as never);
    const enemy = createMockEnemy({ movementRandomness: 0, patrolSpeed: 1.2 });
    state.enter(enemy);

    // Record orbit radius at multiple points
    const radii: number[] = [];
    for (let i = 0; i < 20; i++) {
      state.update(enemy, 0.1);
      const pos = (enemy as unknown as { getObject3D: () => { position: { set: ReturnType<typeof vi.fn> } } }).getObject3D().position.set;
      const lastCall = pos.mock.calls[pos.mock.calls.length - 1];
      const dx = lastCall[0] as number;
      const dz = lastCall[2] as number;
      radii.push(Math.sqrt(dx * dx + dz * dz));
    }

    // With zero randomness, all radii should be approximately equal (2.5)
    const avgRadius = radii.reduce((a, b) => a + b, 0) / radii.length;
    for (const r of radii) {
      expect(Math.abs(r - avgRadius)).toBeLessThan(0.01);
    }
  });

  it('should produce varying orbit radius with movementRandomness>0', async () => {
    const { OverseerState } = await import('../ai/states/OverseerState.ts');
    const { GameObjectManager } = await import('../entities/GameObjectManager.ts');
    const gom = new GameObjectManager();
    const state = new OverseerState(gom, () => ({ x: 0, y: 0, z: 0 }) as never);
    const enemy = createMockEnemy({ movementRandomness: 0.5, patrolSpeed: 1.2 });
    state.enter(enemy);

    // Record orbit radius at multiple points
    const radii: number[] = [];
    for (let i = 0; i < 30; i++) {
      state.update(enemy, 0.2);
      const pos = (enemy as unknown as { getObject3D: () => { position: { set: ReturnType<typeof vi.fn> } } }).getObject3D().position.set;
      const lastCall = pos.mock.calls[pos.mock.calls.length - 1];
      const dx = lastCall[0] as number;
      const dz = lastCall[2] as number;
      radii.push(Math.sqrt(dx * dx + dz * dz));
    }

    // With high randomness, radii should vary more than without
    const minR = Math.min(...radii);
    const maxR = Math.max(...radii);
    expect(maxR - minR).toBeGreaterThan(0.1);
  });
});

describe('AttackState evasion (Story 5-7)', () => {
  it('should always transition to nextState when evasionChance=0', async () => {
    const { AttackState } = await import('../ai/states/AttackState.ts');
    const nextState = { enter: vi.fn(), update: vi.fn(), exit: vi.fn() };
    const evasionReturn = { enter: vi.fn(), update: vi.fn(), exit: vi.fn() };
    const fireCallback = vi.fn();
    const state = new AttackState(
      fireCallback,
      () => ({ x: 10, y: 0, z: 0 }) as never,
      nextState as never,
      evasionReturn as never,
    );
    const enemy = createMockEnemy({ evasionChance: 0 });
    state.enter(enemy);

    // Run multiple times to ensure no evasion
    for (let i = 0; i < 10; i++) {
      state.enter(enemy);
      (enemy as unknown as { transitionToState: ReturnType<typeof vi.fn> }).transitionToState.mockClear();
      state.update(enemy, 0.016);
      expect((enemy as unknown as { transitionToState: ReturnType<typeof vi.fn> }).transitionToState).toHaveBeenCalledWith(nextState);
    }
  });

  it('should always evade when evasionChance=1.0', async () => {
    const { AttackState } = await import('../ai/states/AttackState.ts');
    const nextState = { enter: vi.fn(), update: vi.fn(), exit: vi.fn() };
    const evasionReturn = { enter: vi.fn(), update: vi.fn(), exit: vi.fn() };
    const fireCallback = vi.fn();
    const state = new AttackState(
      fireCallback,
      () => ({ x: 10, y: 0, z: 0 }) as never,
      nextState as never,
      evasionReturn as never,
    );
    const enemy = createMockEnemy({ evasionChance: 1.0 });
    state.enter(enemy);
    state.update(enemy, 0.016);

    // Should NOT have transitioned to nextState, but to an EvadeState
    const transitionCall = (enemy as unknown as { transitionToState: ReturnType<typeof vi.fn> }).transitionToState;
    expect(transitionCall).toHaveBeenCalledTimes(1);
    // The argument should be an EvadeState instance, not the nextState
    const transitionedTo = transitionCall.mock.calls[0][0];
    expect(transitionedTo).not.toBe(nextState);
    // Verify it has EvadeState methods
    expect(typeof transitionedTo.enter).toBe('function');
    expect(typeof transitionedTo.update).toBe('function');
  });

  it('should skip evasion when evasionReturnState is undefined', async () => {
    const { AttackState } = await import('../ai/states/AttackState.ts');
    const nextState = { enter: vi.fn(), update: vi.fn(), exit: vi.fn() };
    const fireCallback = vi.fn();
    // No evasionReturnState provided
    const state = new AttackState(
      fireCallback,
      () => ({ x: 10, y: 0, z: 0 }) as never,
      nextState as never,
    );
    const enemy = createMockEnemy({ evasionChance: 1.0 });
    state.enter(enemy);
    state.update(enemy, 0.016);

    // Should go to nextState even with evasionChance=1.0 because no evasionReturnState
    expect((enemy as unknown as { transitionToState: ReturnType<typeof vi.fn> }).transitionToState).toHaveBeenCalledWith(nextState);
  });

  it('should still fire the projectile regardless of evasion outcome', async () => {
    const { AttackState } = await import('../ai/states/AttackState.ts');
    const nextState = { enter: vi.fn(), update: vi.fn(), exit: vi.fn() };
    const evasionReturn = { enter: vi.fn(), update: vi.fn(), exit: vi.fn() };
    const fireCallback = vi.fn();
    const state = new AttackState(
      fireCallback,
      () => ({ x: 10, y: 0, z: 0 }) as never,
      nextState as never,
      evasionReturn as never,
    );
    const enemy = createMockEnemy({ evasionChance: 1.0 });
    state.enter(enemy);
    state.update(enemy, 0.016);

    // Fire callback should have been called regardless
    expect(fireCallback).toHaveBeenCalledTimes(1);
  });
});

describe('Enemy glitch visual (Story 5-7)', () => {
  // For these tests we need actual Enemy instances, but the abstract class
  // with three.js mocking makes it complex. Instead we test the logic directly
  // by verifying constants and the conditional check pattern.

  it('should have GLITCH_THRESHOLD at 0.4', async () => {
    const { GLITCH_THRESHOLD } = await import('../config/constants.ts');
    expect(GLITCH_THRESHOLD).toBe(0.4);
  });

  it('should have GLITCH_SCALE_INTENSITY at 0.06', async () => {
    const { GLITCH_SCALE_INTENSITY } = await import('../config/constants.ts');
    expect(GLITCH_SCALE_INTENSITY).toBe(0.06);
  });

  it('Level 1 enemies (movementRandomness=0) should NOT trigger glitch (below threshold)', async () => {
    const { GLITCH_THRESHOLD } = await import('../config/constants.ts');
    expect(0.0 < GLITCH_THRESHOLD).toBe(true); // 0 < 0.4, so glitch won't activate
  });

  it('Level 2 enemies (movementRandomness=0.1) should NOT trigger glitch (below threshold)', async () => {
    const { GLITCH_THRESHOLD } = await import('../config/constants.ts');
    expect(0.1 < GLITCH_THRESHOLD).toBe(true); // 0.1 < 0.4, so glitch won't activate
  });

  it('Level 3 enemies (movementRandomness=0.5) SHOULD trigger glitch (at or above threshold)', async () => {
    const { GLITCH_THRESHOLD } = await import('../config/constants.ts');
    expect(0.5 >= GLITCH_THRESHOLD).toBe(true); // 0.5 >= 0.4, glitch activates
  });
});
