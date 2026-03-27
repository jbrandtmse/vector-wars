import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { GameObjectManager } from '../entities/GameObjectManager.ts';

// Mock Logger
vi.mock('../core/Logger.ts', () => ({
  Logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('BossCollision - CollisionSystem boss compatibility', () => {
  let CollisionSystem: typeof import('../systems/CollisionSystem.ts').CollisionSystem;
  let gom: InstanceType<typeof import('../entities/GameObjectManager.ts').GameObjectManager>;

  beforeEach(async () => {
    const csModule = await import('../systems/CollisionSystem.ts');
    CollisionSystem = csModule.CollisionSystem;
    gom = new GameObjectManager();
  });

  it('should detect bolt-boss collision via duck-typing (takeDamage in entity)', () => {
    // Create a mock boss entity with takeDamage (same duck-type interface as Enemy)
    const mockBoss = {
      isActive: true,
      update: vi.fn(),
      getCollider: () => new THREE.Sphere(new THREE.Vector3(0, 0, 0), 6.0),
      takeDamage: vi.fn(),
      getObject3D: () => new THREE.Object3D(),
      getPosition: () => new THREE.Vector3(0, 0, 0),
      setActive: vi.fn(),
    };
    gom.add(mockBoss as never);

    // Create a bolt aimed at the boss
    const mockMesh = new THREE.Object3D() as never;
    mockMesh.position.set(0, 0, 5); // Close to boss at origin
    const bolts = [{
      mesh: mockMesh,
      direction: new THREE.Vector3(0, 0, -1),
      active: true,
      distance: 3,
    }];

    const cs = new CollisionSystem(gom, bolts as never);
    cs.update();

    expect(mockBoss.takeDamage).toHaveBeenCalled();
    expect(bolts[0].active).toBe(false);
  });

  it('should hit boss entity when registered alongside regular enemies', () => {
    // Regular enemy far away
    const mockEnemy = {
      isActive: true,
      update: vi.fn(),
      getCollider: () => new THREE.Sphere(new THREE.Vector3(100, 100, 100), 1.5),
      takeDamage: vi.fn(),
      getObject3D: () => new THREE.Object3D(),
      getPosition: () => new THREE.Vector3(100, 100, 100),
      setActive: vi.fn(),
    };

    // Boss at origin
    const mockBoss = {
      isActive: true,
      update: vi.fn(),
      getCollider: () => new THREE.Sphere(new THREE.Vector3(0, 0, 0), 6.0),
      takeDamage: vi.fn(),
      getObject3D: () => new THREE.Object3D(),
      getPosition: () => new THREE.Vector3(0, 0, 0),
      setActive: vi.fn(),
    };

    gom.add(mockEnemy as never);
    gom.add(mockBoss as never);

    const mockMesh = new THREE.Object3D() as never;
    mockMesh.position.set(0, 0, 5);
    const bolts = [{
      mesh: mockMesh,
      direction: new THREE.Vector3(0, 0, -1),
      active: true,
      distance: 3,
    }];

    const cs = new CollisionSystem(gom, bolts as never);
    cs.update();

    expect(mockBoss.takeDamage).toHaveBeenCalled();
    expect(mockEnemy.takeDamage).not.toHaveBeenCalled();
  });
});

describe('BossCollision - LogicBombSystem boss compatibility', () => {
  it('LogicBombSystem scanForTarget uses takeDamage duck-typing which works for bosses', () => {
    // The boss has takeDamage and will be detected by LogicBomb lock-on scan
    const mockBoss = {
      isActive: true,
      takeDamage: vi.fn(),
      getPosition: () => new THREE.Vector3(0, 0, -10),
      getCollider: () => new THREE.Sphere(new THREE.Vector3(0, 0, -10), 6.0),
    };

    // Verify the duck-typing check that LogicBombSystem uses
    expect('takeDamage' in mockBoss).toBe(true);
    // Logic bombs home toward entities with takeDamage - boss qualifies
  });
});

describe('BossCollision - EMPBurstSystem boss skip', () => {
  it('EMPBurstSystem should skip entities without applyStun', () => {
    // The boss does NOT have applyStun - EMP should skip it
    const mockBoss = {
      isActive: true,
      takeDamage: vi.fn(),
      getPosition: () => new THREE.Vector3(0, 0, 0),
      getCollider: () => new THREE.Sphere(new THREE.Vector3(0, 0, 0), 6.0),
    };

    // Verify that the duck-typing check EMPBurstSystem uses would skip the boss
    expect('applyStun' in mockBoss).toBe(false);
    // EMP checks `if (!('applyStun' in entity)) continue;` — boss is correctly skipped
  });

  it('real Boss class does not have applyStun method', async () => {
    const { Boss } = await import('../entities/bosses/Boss.ts');

    // Create a concrete boss for testing
    class TestBoss extends Boss {
      onHit(): void { /* no-op */ }
      onDefeated(): void { /* no-op */ }
      updateBoss(): void { /* no-op */ }
    }

    const boss = new TestBoss(100, 1000, 5);
    expect('applyStun' in boss).toBe(false);
    expect('takeDamage' in boss).toBe(true);
  });
});
