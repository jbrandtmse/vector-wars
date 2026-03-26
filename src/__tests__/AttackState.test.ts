import { describe, it, expect, vi } from 'vitest';

// Mock Logger
vi.mock('../core/Logger.ts', () => ({
  Logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('AttackState', () => {
  it('should be exported as a class from ai/states/AttackState', async () => {
    const mod = await import('../ai/states/AttackState.ts');
    expect(mod.AttackState).toBeDefined();
    expect(typeof mod.AttackState).toBe('function');
  });

  it('should have enter method on prototype (AIState interface)', async () => {
    const mod = await import('../ai/states/AttackState.ts');
    expect(typeof mod.AttackState.prototype.enter).toBe('function');
  });

  it('should have update method on prototype (AIState interface)', async () => {
    const mod = await import('../ai/states/AttackState.ts');
    expect(typeof mod.AttackState.prototype.update).toBe('function');
  });

  it('should have exit method on prototype (AIState interface)', async () => {
    const mod = await import('../ai/states/AttackState.ts');
    expect(typeof mod.AttackState.prototype.exit).toBe('function');
  });

  it('should export FireCallback type (module loads cleanly)', async () => {
    const mod = await import('../ai/states/AttackState.ts');
    // FireCallback is a type, erased at runtime, but module should load
    expect(mod).toBeDefined();
  });

  it('should fire callback on update and transition to next state', async () => {
    const { AttackState } = await import('../ai/states/AttackState.ts');
    const THREE = await import('three');

    const fireCallback = vi.fn();
    const playerPos = new THREE.Vector3(0, 0, 0);
    const playerPositionGetter = () => playerPos;
    const nextState = { enter: vi.fn(), update: vi.fn(), exit: vi.fn() };

    const attackState = new AttackState(fireCallback, playerPositionGetter, nextState);

    const mockEnemy = {
      getObject3D: () => ({ position: new THREE.Vector3(10, 5, 10) }),
      params: { projectileSpeed: 15, attackDamage: 10 },
      transitionToState: vi.fn(),
    } as never;

    attackState.enter(mockEnemy);
    attackState.update(mockEnemy, 0.016);

    expect(fireCallback).toHaveBeenCalledTimes(1);
    expect((mockEnemy as { transitionToState: ReturnType<typeof vi.fn> }).transitionToState).toHaveBeenCalledWith(nextState);
  });

  it('should fire only once per enter cycle', async () => {
    const { AttackState } = await import('../ai/states/AttackState.ts');
    const THREE = await import('three');

    const fireCallback = vi.fn();
    const playerPositionGetter = () => new THREE.Vector3();
    const nextState = { enter: vi.fn(), update: vi.fn(), exit: vi.fn() };

    const attackState = new AttackState(fireCallback, playerPositionGetter, nextState);

    const mockEnemy = {
      getObject3D: () => ({ position: new THREE.Vector3() }),
      params: { projectileSpeed: 15, attackDamage: 10 },
      transitionToState: vi.fn(),
    } as never;

    attackState.enter(mockEnemy);
    attackState.update(mockEnemy, 0.016);
    attackState.update(mockEnemy, 0.016); // second call should be no-op

    expect(fireCallback).toHaveBeenCalledTimes(1);
  });
});
