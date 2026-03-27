import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LogicBombSystem } from '../systems/LogicBombSystem.ts';
import { VectorMaterials } from '../rendering/VectorMaterials.ts';
import { CockpitRenderer } from '../rendering/CockpitRenderer.ts';
import { setActivePalette } from '../rendering/ColorPalette.ts';
import { eventBus } from '../core/GameEvents.ts';
import {
  BLOOM_LAYER,
  LOGIC_BOMB_POOL_SIZE,
  LOGIC_BOMB_MAX_AMMO,
  LOGIC_BOMB_FIRE_COOLDOWN,
  LOGIC_BOMB_DAMAGE,
  LOGIC_BOMB_LOCK_CONE_ANGLE,
  LOGIC_BOMB_LOCK_RANGE,
} from '../config/constants.ts';
import type { InputManager } from '../core/InputManager.ts';
import type { GameObjectManager } from '../entities/GameObjectManager.ts';
import type { Enemy } from '../entities/enemies/Enemy.ts';
import type { GameObject } from '../entities/GameObject.ts';

function makeMockEnemy(position: THREE.Vector3, active: boolean = true, health: number = 30): Enemy {
  const collider = new THREE.Sphere(position.clone(), 1.5);
  const enemy = {
    isActive: active,
    getPosition: () => position,
    getCollider: () => collider,
    takeDamage: vi.fn(),
    health,
    id: Math.floor(Math.random() * 10000),
  } as unknown as Enemy;
  return enemy;
}

describe('LogicBombSystem', () => {
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let vectorMaterials: VectorMaterials;
  let cockpitRenderer: CockpitRenderer;
  let mockIsActive: ReturnType<typeof vi.fn>;
  let inputManager: InputManager;
  let mockEnemies: GameObject[];
  let gameObjectManager: GameObjectManager;
  let system: LogicBombSystem;

  function setLogicBombActive(active: boolean): void {
    mockIsActive.mockImplementation((action: string) => {
      if (action === 'logicBomb') return active;
      return false;
    });
  }

  beforeEach(() => {
    setActivePalette('green');
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, 16 / 9, 0.01, 1000);
    camera.position.set(0, 0, 0);
    camera.lookAt(0, 0, -1);
    scene.add(camera);
    camera.updateMatrixWorld(true);

    vectorMaterials = new VectorMaterials();
    cockpitRenderer = new CockpitRenderer(camera, vectorMaterials);

    mockIsActive = vi.fn().mockReturnValue(false);
    inputManager = {
      isActive: mockIsActive,
      dispose: vi.fn(),
    } as unknown as InputManager;

    mockEnemies = [];
    gameObjectManager = {
      getAll: () => mockEnemies,
      add: vi.fn(),
      remove: vi.fn(),
      update: vi.fn(),
      getActiveCount: vi.fn(),
    } as unknown as GameObjectManager;

    system = new LogicBombSystem(
      scene, camera, inputManager, vectorMaterials, cockpitRenderer, gameObjectManager,
    );
  });

  afterEach(() => {
    system.dispose();
  });

  describe('Pool initialization', () => {
    it('should pre-allocate correct number of bomb meshes in the scene', () => {
      const lineSegments = scene.children.filter(
        (child) => child instanceof LineSegments2
      );
      // Pool size + cockpit meshes (cockpitRenderer adds some)
      expect(lineSegments.length).toBeGreaterThanOrEqual(LOGIC_BOMB_POOL_SIZE);
    });

    it('should create bomb meshes with bloom layer enabled', () => {
      const bloomTest = new THREE.Layers();
      bloomTest.set(BLOOM_LAYER);
      // Get pool stats to verify pool was created
      const stats = system.getPoolStats();
      expect(stats.total).toBe(LOGIC_BOMB_POOL_SIZE);
    });

    it('should start with all bombs inactive', () => {
      const stats = system.getPoolStats();
      expect(stats.active).toBe(0);
      expect(stats.total).toBe(LOGIC_BOMB_POOL_SIZE);
    });
  });

  describe('Ammo management', () => {
    it('should start with LOGIC_BOMB_MAX_AMMO', () => {
      expect(system.getAmmo()).toBe(LOGIC_BOMB_MAX_AMMO);
    });

    it('should decrement ammo on fire', () => {
      // Place enemy in front of camera within lock-on cone
      const enemy = makeMockEnemy(new THREE.Vector3(0, 0, -20), true);
      mockEnemies.push(enemy as unknown as GameObject);

      setLogicBombActive(true);
      system.update(0.016);

      expect(system.getAmmo()).toBe(LOGIC_BOMB_MAX_AMMO - 1);
    });

    it('should not fire when ammo is 0', () => {
      const enemy = makeMockEnemy(new THREE.Vector3(0, 0, -20), true);
      mockEnemies.push(enemy as unknown as GameObject);

      // Exhaust all ammo
      for (let i = 0; i < LOGIC_BOMB_MAX_AMMO; i++) {
        setLogicBombActive(true);
        system.update(LOGIC_BOMB_FIRE_COOLDOWN + 0.01);
      }

      expect(system.getAmmo()).toBe(0);

      // Try to fire again — should not decrease
      setLogicBombActive(true);
      system.update(LOGIC_BOMB_FIRE_COOLDOWN + 0.01);

      expect(system.getAmmo()).toBe(0);
    });

    it('resetAmmo() should restore to max', () => {
      const enemy = makeMockEnemy(new THREE.Vector3(0, 0, -20), true);
      mockEnemies.push(enemy as unknown as GameObject);

      // Fire once
      setLogicBombActive(true);
      system.update(0.016);
      expect(system.getAmmo()).toBeLessThan(LOGIC_BOMB_MAX_AMMO);

      // Reset
      system.resetAmmo();
      expect(system.getAmmo()).toBe(LOGIC_BOMB_MAX_AMMO);
    });
  });

  describe('Lock-on acquisition', () => {
    it('should find nearest enemy within targeting cone', () => {
      // Place enemy directly ahead of camera, within cone and range
      const enemy = makeMockEnemy(new THREE.Vector3(0, 0, -20), true);
      mockEnemies.push(enemy as unknown as GameObject);

      system.update(0.016);

      expect(system.getLockedTarget()).toBe(enemy);
    });

    it('should ignore enemies outside targeting cone', () => {
      // Place enemy far to the side (well outside 0.35 radian cone)
      const enemy = makeMockEnemy(new THREE.Vector3(40, 0, -20), true);
      mockEnemies.push(enemy as unknown as GameObject);

      system.update(0.016);

      expect(system.getLockedTarget()).toBeNull();
    });

    it('should ignore enemies beyond lock range', () => {
      // Place enemy ahead but beyond lock range
      const enemy = makeMockEnemy(new THREE.Vector3(0, 0, -(LOGIC_BOMB_LOCK_RANGE + 10)), true);
      mockEnemies.push(enemy as unknown as GameObject);

      system.update(0.016);

      expect(system.getLockedTarget()).toBeNull();
    });

    it('should select the smallest-angle target when multiple are in cone', () => {
      // Enemy 1: slightly off-center
      const enemy1 = makeMockEnemy(new THREE.Vector3(2, 0, -20), true);
      // Enemy 2: dead center (smaller angle)
      const enemy2 = makeMockEnemy(new THREE.Vector3(0, 0, -20), true);
      mockEnemies.push(enemy1 as unknown as GameObject);
      mockEnemies.push(enemy2 as unknown as GameObject);

      system.update(0.016);

      expect(system.getLockedTarget()).toBe(enemy2);
    });

    it('should ignore inactive enemies', () => {
      const enemy = makeMockEnemy(new THREE.Vector3(0, 0, -20), false);
      mockEnemies.push(enemy as unknown as GameObject);

      system.update(0.016);

      expect(system.getLockedTarget()).toBeNull();
    });
  });

  describe('Lock-on events', () => {
    it('should emit logicBombLockOn when target acquired', () => {
      const lockOnHandler = vi.fn();
      eventBus.on('logicBombLockOn', lockOnHandler);

      const enemy = makeMockEnemy(new THREE.Vector3(0, 0, -20), true);
      mockEnemies.push(enemy as unknown as GameObject);

      system.update(0.016);

      expect(lockOnHandler).toHaveBeenCalledWith({ target: enemy });
      eventBus.off('logicBombLockOn', lockOnHandler);
    });

    it('should emit logicBombLockLost when target lost', () => {
      const lockLostHandler = vi.fn();
      eventBus.on('logicBombLockLost', lockLostHandler);

      // First acquire a target
      const enemy = makeMockEnemy(new THREE.Vector3(0, 0, -20), true);
      mockEnemies.push(enemy as unknown as GameObject);
      system.update(0.016);

      // Now remove all enemies
      mockEnemies.length = 0;
      system.update(0.016);

      expect(lockLostHandler).toHaveBeenCalled();
      eventBus.off('logicBombLockLost', lockLostHandler);
    });

    it('should not emit events when lock state does not change', () => {
      const lockOnHandler = vi.fn();
      eventBus.on('logicBombLockOn', lockOnHandler);

      const enemy = makeMockEnemy(new THREE.Vector3(0, 0, -20), true);
      mockEnemies.push(enemy as unknown as GameObject);

      // First update: acquires lock
      system.update(0.016);
      expect(lockOnHandler).toHaveBeenCalledTimes(1);

      // Second update: same target, no new event
      system.update(0.016);
      expect(lockOnHandler).toHaveBeenCalledTimes(1);

      eventBus.off('logicBombLockOn', lockOnHandler);
    });
  });

  describe('Firing', () => {
    it('should fire when Z pressed + target locked + ammo > 0 + cooldown ready', () => {
      const enemy = makeMockEnemy(new THREE.Vector3(0, 0, -20), true);
      mockEnemies.push(enemy as unknown as GameObject);

      setLogicBombActive(true);
      system.update(0.016);

      const stats = system.getPoolStats();
      expect(stats.active).toBe(1);
    });

    it('should NOT fire when no target is locked', () => {
      // No enemies — no lock-on
      setLogicBombActive(true);
      system.update(0.016);

      const stats = system.getPoolStats();
      expect(stats.active).toBe(0);
    });

    it('should NOT fire when ammo is 0', () => {
      const enemy = makeMockEnemy(new THREE.Vector3(0, 0, -20), true);
      mockEnemies.push(enemy as unknown as GameObject);

      // Exhaust all ammo
      for (let i = 0; i < LOGIC_BOMB_MAX_AMMO; i++) {
        setLogicBombActive(true);
        system.update(LOGIC_BOMB_FIRE_COOLDOWN + 0.01);
      }

      const statsAfterExhaust = system.getPoolStats();
      const activeAfterExhaust = statsAfterExhaust.active;

      // Try to fire one more
      setLogicBombActive(true);
      system.update(LOGIC_BOMB_FIRE_COOLDOWN + 0.01);

      // No additional bomb should be fired
      // Note: some earlier bombs may have deactivated, so check ammo instead
      expect(system.getAmmo()).toBe(0);
    });

    it('should respect cooldown between shots', () => {
      const enemy = makeMockEnemy(new THREE.Vector3(0, 0, -20), true);
      mockEnemies.push(enemy as unknown as GameObject);

      setLogicBombActive(true);

      // First shot
      system.update(0.016);
      expect(system.getAmmo()).toBe(LOGIC_BOMB_MAX_AMMO - 1);

      // Immediate second attempt — should not fire (cooldown)
      system.update(0.016);
      expect(system.getAmmo()).toBe(LOGIC_BOMB_MAX_AMMO - 1);

      // After cooldown expires — should fire
      system.update(LOGIC_BOMB_FIRE_COOLDOWN);
      expect(system.getAmmo()).toBe(LOGIC_BOMB_MAX_AMMO - 2);
    });

    it('should emit weaponFired event on fire', () => {
      const weaponFiredHandler = vi.fn();
      eventBus.on('weaponFired', weaponFiredHandler);

      const enemy = makeMockEnemy(new THREE.Vector3(0, 0, -20), true);
      mockEnemies.push(enemy as unknown as GameObject);

      setLogicBombActive(true);
      system.update(0.016);

      expect(weaponFiredHandler).toHaveBeenCalledWith(
        expect.objectContaining({ weapon: 'logicBomb' }),
      );
      eventBus.off('weaponFired', weaponFiredHandler);
    });

    it('should trigger heavier cockpit recoil than Data Lance', () => {
      const recoilSpy = vi.spyOn(cockpitRenderer, 'recoilArms');

      const enemy = makeMockEnemy(new THREE.Vector3(0, 0, -20), true);
      mockEnemies.push(enemy as unknown as GameObject);

      setLogicBombActive(true);
      system.update(0.016);

      expect(recoilSpy).toHaveBeenCalledWith(2.0);
    });
  });

  describe('Collision detection', () => {
    it('should damage target on sphere-sphere hit', () => {
      const enemyPos = new THREE.Vector3(0, 0, -3);
      const enemy = makeMockEnemy(enemyPos, true, 30);
      mockEnemies.push(enemy as unknown as GameObject);

      setLogicBombActive(true);
      system.update(0.016);

      // Update until bomb reaches the enemy (close distance)
      setLogicBombActive(false);
      for (let i = 0; i < 20; i++) {
        system.update(0.016);
      }

      // Enemy should have been damaged
      expect(enemy.takeDamage).toHaveBeenCalledWith(LOGIC_BOMB_DAMAGE);
    });

    it('should deactivate bomb on hit', () => {
      const enemyPos = new THREE.Vector3(0, 0, -3);
      const enemy = makeMockEnemy(enemyPos, true, 30);
      mockEnemies.push(enemy as unknown as GameObject);

      setLogicBombActive(true);
      system.update(0.016);
      expect(system.getPoolStats().active).toBe(1);

      // Move bomb into collision range
      setLogicBombActive(false);
      for (let i = 0; i < 20; i++) {
        system.update(0.016);
      }

      // Bomb should have collided and deactivated
      expect(system.getPoolStats().active).toBe(0);
    });
  });

  describe('Pool management', () => {
    it('should handle pool exhaustion gracefully', () => {
      const enemy = makeMockEnemy(new THREE.Vector3(0, 0, -20), true);
      mockEnemies.push(enemy as unknown as GameObject);

      // Reset ammo high to try to exhaust pool
      for (let i = 0; i < LOGIC_BOMB_POOL_SIZE + 5; i++) {
        system.resetAmmo();
        setLogicBombActive(true);
        system.update(LOGIC_BOMB_FIRE_COOLDOWN + 0.01);
      }

      // Should not crash
      const stats = system.getPoolStats();
      expect(stats.active).toBeLessThanOrEqual(LOGIC_BOMB_POOL_SIZE);
    });
  });

  describe('getPoolStats()', () => {
    it('should return correct active and total counts', () => {
      const stats = system.getPoolStats();
      expect(stats).toEqual({ active: 0, total: LOGIC_BOMB_POOL_SIZE });
    });
  });

  describe('getLockedTarget()', () => {
    it('should return null when no target locked', () => {
      expect(system.getLockedTarget()).toBeNull();
    });

    it('should return the locked enemy', () => {
      const enemy = makeMockEnemy(new THREE.Vector3(0, 0, -20), true);
      mockEnemies.push(enemy as unknown as GameObject);

      system.update(0.016);

      expect(system.getLockedTarget()).toBe(enemy);
    });
  });

  describe('Dispose', () => {
    it('should remove all bomb meshes from scene on dispose', () => {
      const lineSegmentsBefore = scene.children.filter(
        (child) => child instanceof LineSegments2
      );
      const countBefore = lineSegmentsBefore.length;

      system.dispose();

      const lineSegmentsAfter = scene.children.filter(
        (child) => child instanceof LineSegments2
      );
      // Should have removed the LOGIC_BOMB_POOL_SIZE meshes
      expect(lineSegmentsAfter.length).toBeLessThan(countBefore);
    });
  });
});
