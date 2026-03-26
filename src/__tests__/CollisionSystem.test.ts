import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';

// We need to mock specific things for collision testing
vi.mock('../core/Logger.ts', () => ({
  Logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('CollisionSystem', () => {
  it('should export CollisionSystem class', async () => {
    const mod = await import('../systems/CollisionSystem.ts');
    expect(mod.CollisionSystem).toBeDefined();
    expect(typeof mod.CollisionSystem).toBe('function');
  });

  it('should have update method on prototype', async () => {
    const mod = await import('../systems/CollisionSystem.ts');
    expect(typeof mod.CollisionSystem.prototype.update).toBe('function');
  });

  it('should accept gameObjectManager and bolts array in constructor', async () => {
    const { CollisionSystem } = await import('../systems/CollisionSystem.ts');
    const { GameObjectManager } = await import('../entities/GameObjectManager.ts');
    const gom = new GameObjectManager();
    const bolts: never[] = [];
    expect(() => new CollisionSystem(gom, bolts)).not.toThrow();
  });
});

describe('CollisionSystem collision detection', () => {
  let CollisionSystem: typeof import('../systems/CollisionSystem.ts').CollisionSystem;
  let GameObjectManager: typeof import('../entities/GameObjectManager.ts').GameObjectManager;

  beforeEach(async () => {
    const csModule = await import('../systems/CollisionSystem.ts');
    CollisionSystem = csModule.CollisionSystem;
    const gomModule = await import('../entities/GameObjectManager.ts');
    GameObjectManager = gomModule.GameObjectManager;
  });

  it('should detect bolt-enemy collision when bolt is near enemy', () => {
    const gom = new GameObjectManager();

    // Create a mock enemy with takeDamage
    const mockEnemy = {
      isActive: true,
      update: vi.fn(),
      getCollider: () => new THREE.Sphere(new THREE.Vector3(0, 0, -10), 1.5),
      takeDamage: vi.fn(),
      getObject3D: () => new THREE.Object3D(),
      getPosition: () => new THREE.Vector3(0, 0, -10),
      setActive: vi.fn(),
    };
    gom.add(mockEnemy as never);

    // Create a bolt aimed at the enemy
    const mockMesh = new THREE.Object3D() as never;
    mockMesh.position.set(0, 0, -9); // Very close to enemy
    const bolts = [{
      mesh: mockMesh,
      direction: new THREE.Vector3(0, 0, -1),
      active: true,
      distance: 5,
    }];

    const cs = new CollisionSystem(gom, bolts as never);
    cs.update();

    expect(mockEnemy.takeDamage).toHaveBeenCalled();
    expect(bolts[0].active).toBe(false);
  });

  it('should not detect collision when bolt is far from enemy', () => {
    const gom = new GameObjectManager();

    const mockEnemy = {
      isActive: true,
      update: vi.fn(),
      getCollider: () => new THREE.Sphere(new THREE.Vector3(100, 100, 100), 1.5),
      takeDamage: vi.fn(),
      getObject3D: () => new THREE.Object3D(),
      getPosition: () => new THREE.Vector3(100, 100, 100),
      setActive: vi.fn(),
    };
    gom.add(mockEnemy as never);

    const mockMesh = new THREE.Object3D() as never;
    mockMesh.position.set(0, 0, 0);
    const bolts = [{
      mesh: mockMesh,
      direction: new THREE.Vector3(0, 0, -1),
      active: true,
      distance: 5,
    }];

    const cs = new CollisionSystem(gom, bolts as never);
    cs.update();

    expect(mockEnemy.takeDamage).not.toHaveBeenCalled();
    expect(bolts[0].active).toBe(true);
  });

  it('should skip inactive bolts', () => {
    const gom = new GameObjectManager();

    const mockEnemy = {
      isActive: true,
      update: vi.fn(),
      getCollider: () => new THREE.Sphere(new THREE.Vector3(0, 0, -10), 1.5),
      takeDamage: vi.fn(),
      getObject3D: () => new THREE.Object3D(),
      getPosition: () => new THREE.Vector3(0, 0, -10),
      setActive: vi.fn(),
    };
    gom.add(mockEnemy as never);

    const mockMesh = new THREE.Object3D() as never;
    mockMesh.position.set(0, 0, -9);
    const bolts = [{
      mesh: mockMesh,
      direction: new THREE.Vector3(0, 0, -1),
      active: false, // Inactive bolt
      distance: 5,
    }];

    const cs = new CollisionSystem(gom, bolts as never);
    cs.update();

    expect(mockEnemy.takeDamage).not.toHaveBeenCalled();
  });

  it('should skip inactive enemies', () => {
    const gom = new GameObjectManager();

    const mockEnemy = {
      isActive: false, // Inactive enemy
      update: vi.fn(),
      getCollider: () => new THREE.Sphere(new THREE.Vector3(0, 0, -10), 1.5),
      takeDamage: vi.fn(),
      getObject3D: () => new THREE.Object3D(),
      getPosition: () => new THREE.Vector3(0, 0, -10),
      setActive: vi.fn(),
    };
    gom.add(mockEnemy as never);

    const mockMesh = new THREE.Object3D() as never;
    mockMesh.position.set(0, 0, -9);
    const bolts = [{
      mesh: mockMesh,
      direction: new THREE.Vector3(0, 0, -1),
      active: true,
      distance: 5,
    }];

    const cs = new CollisionSystem(gom, bolts as never);
    cs.update();

    expect(mockEnemy.takeDamage).not.toHaveBeenCalled();
  });

  it('should skip entities without takeDamage method', () => {
    const gom = new GameObjectManager();

    // Non-enemy entity (no takeDamage)
    const mockEntity = {
      isActive: true,
      update: vi.fn(),
      getCollider: () => new THREE.Sphere(new THREE.Vector3(0, 0, -10), 1.5),
      getObject3D: () => new THREE.Object3D(),
      getPosition: () => new THREE.Vector3(0, 0, -10),
      setActive: vi.fn(),
    };
    gom.add(mockEntity as never);

    const mockMesh = new THREE.Object3D() as never;
    mockMesh.position.set(0, 0, -9);
    const bolts = [{
      mesh: mockMesh,
      direction: new THREE.Vector3(0, 0, -1),
      active: true,
      distance: 5,
    }];

    const cs = new CollisionSystem(gom, bolts as never);
    // Should not throw
    expect(() => cs.update()).not.toThrow();
    expect(bolts[0].active).toBe(true);
  });

  it('should deactivate bolt after hitting one enemy (bolt hits one enemy max)', () => {
    const gom = new GameObjectManager();

    const mockEnemy1 = {
      isActive: true,
      update: vi.fn(),
      getCollider: () => new THREE.Sphere(new THREE.Vector3(0, 0, -10), 1.5),
      takeDamage: vi.fn(),
      getObject3D: () => new THREE.Object3D(),
      getPosition: () => new THREE.Vector3(0, 0, -10),
      setActive: vi.fn(),
    };
    const mockEnemy2 = {
      isActive: true,
      update: vi.fn(),
      getCollider: () => new THREE.Sphere(new THREE.Vector3(0, 0, -10), 1.5), // Same position
      takeDamage: vi.fn(),
      getObject3D: () => new THREE.Object3D(),
      getPosition: () => new THREE.Vector3(0, 0, -10),
      setActive: vi.fn(),
    };
    gom.add(mockEnemy1 as never);
    gom.add(mockEnemy2 as never);

    const mockMesh = new THREE.Object3D() as never;
    mockMesh.position.set(0, 0, -9);
    const bolts = [{
      mesh: mockMesh,
      direction: new THREE.Vector3(0, 0, -1),
      active: true,
      distance: 5,
    }];

    const cs = new CollisionSystem(gom, bolts as never);
    cs.update();

    // Only one enemy should be hit
    const totalHits = (mockEnemy1.takeDamage.mock.calls.length + mockEnemy2.takeDamage.mock.calls.length);
    expect(totalHits).toBe(1);
    expect(bolts[0].active).toBe(false);
  });
});
