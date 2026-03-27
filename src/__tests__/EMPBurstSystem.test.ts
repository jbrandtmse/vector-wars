import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as THREE from 'three';
import { EMPBurstSystem } from '../systems/EMPBurstSystem.ts';
import { VectorMaterials } from '../rendering/VectorMaterials.ts';
import { CockpitRenderer } from '../rendering/CockpitRenderer.ts';
import { setActivePalette } from '../rendering/ColorPalette.ts';
import { eventBus } from '../core/GameEvents.ts';
import {
  EMP_BURST_COOLDOWN,
  EMP_BURST_RADIUS,
  EMP_BURST_STUN_DURATION,
  EMP_BURST_POOL_SIZE,
} from '../config/constants.ts';
import type { InputManager } from '../core/InputManager.ts';
import type { GameObjectManager } from '../entities/GameObjectManager.ts';
import type { Enemy } from '../entities/enemies/Enemy.ts';
import type { GameObject } from '../entities/GameObject.ts';

function makeMockEnemy(position: THREE.Vector3, active: boolean = true): Enemy {
  const enemy = {
    isActive: active,
    getPosition: () => position,
    applyStun: vi.fn(),
    id: Math.floor(Math.random() * 10000),
  } as unknown as Enemy;
  return enemy;
}

describe('EMPBurstSystem', () => {
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let vectorMaterials: VectorMaterials;
  let cockpitRenderer: CockpitRenderer;
  let mockIsActive: ReturnType<typeof vi.fn>;
  let inputManager: InputManager;
  let mockEnemies: GameObject[];
  let gameObjectManager: GameObjectManager;
  let system: EMPBurstSystem;

  function setEmpActive(active: boolean): void {
    mockIsActive.mockImplementation((action: string) => {
      if (action === 'emp') return active;
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

    system = new EMPBurstSystem(
      scene, camera, inputManager, vectorMaterials, cockpitRenderer, gameObjectManager,
    );
  });

  afterEach(() => {
    system.dispose();
  });

  describe('Pool initialization', () => {
    it('should pre-allocate correct number of visual instances', () => {
      const stats = system.getPoolStats();
      expect(stats.total).toBe(EMP_BURST_POOL_SIZE);
    });

    it('should start with all visuals inactive', () => {
      const stats = system.getPoolStats();
      expect(stats.active).toBe(0);
    });
  });

  describe('Activation', () => {
    it('should activate when X pressed and cooldown ready', () => {
      setEmpActive(true);
      system.update(0.016);

      // Should have set cooldown (can check via getCooldownRemaining)
      expect(system.getCooldownRemaining()).toBeGreaterThan(0);
    });

    it('should NOT activate when cooldown > 0', () => {
      // First activation
      setEmpActive(true);
      system.update(0.016);
      expect(system.getCooldownRemaining()).toBeGreaterThan(0);

      // Try to activate again immediately
      const cooldownAfterFirst = system.getCooldownRemaining();
      system.update(0.016);
      // Cooldown should have decreased slightly (by ~0.016), not reset
      expect(system.getCooldownRemaining()).toBeCloseTo(cooldownAfterFirst - 0.016, 1);
    });
  });

  describe('Cooldown', () => {
    it('should start at 0 (ready)', () => {
      expect(system.getCooldownRemaining()).toBe(0);
    });

    it('should set to EMP_BURST_COOLDOWN on activation', () => {
      setEmpActive(true);
      system.update(0.016);
      expect(system.getCooldownRemaining()).toBeCloseTo(EMP_BURST_COOLDOWN - 0.016, 1);
    });

    it('should decrement over time', () => {
      setEmpActive(true);
      system.update(0.016);
      const remaining = system.getCooldownRemaining();
      setEmpActive(false);
      system.update(1.0);
      expect(system.getCooldownRemaining()).toBeCloseTo(remaining - 1.0, 1);
    });

    it('getCooldownFraction() should return correct ratio', () => {
      expect(system.getCooldownFraction()).toBe(0);
      setEmpActive(true);
      system.update(0.016);
      // After activation: cooldown should be near EMP_BURST_COOLDOWN
      expect(system.getCooldownFraction()).toBeGreaterThan(0.9);
    });
  });

  describe('AoE detection', () => {
    it('should stun enemies within radius', () => {
      // Place enemy near camera (within EMP_BURST_RADIUS)
      const enemy = makeMockEnemy(new THREE.Vector3(0, 0, -10), true);
      mockEnemies.push(enemy as unknown as GameObject);

      setEmpActive(true);
      system.update(0.016);

      expect(enemy.applyStun).toHaveBeenCalledWith(EMP_BURST_STUN_DURATION);
    });

    it('should NOT stun enemies outside radius', () => {
      // Place enemy far from camera (beyond EMP_BURST_RADIUS)
      const enemy = makeMockEnemy(new THREE.Vector3(0, 0, -(EMP_BURST_RADIUS + 10)), true);
      mockEnemies.push(enemy as unknown as GameObject);

      setEmpActive(true);
      system.update(0.016);

      expect(enemy.applyStun).not.toHaveBeenCalled();
    });

    it('should stun multiple enemies in single activation', () => {
      const enemy1 = makeMockEnemy(new THREE.Vector3(5, 0, -5), true);
      const enemy2 = makeMockEnemy(new THREE.Vector3(-5, 0, -5), true);
      const enemy3 = makeMockEnemy(new THREE.Vector3(0, 5, -3), true);
      mockEnemies.push(enemy1 as unknown as GameObject);
      mockEnemies.push(enemy2 as unknown as GameObject);
      mockEnemies.push(enemy3 as unknown as GameObject);

      setEmpActive(true);
      system.update(0.016);

      expect(enemy1.applyStun).toHaveBeenCalledWith(EMP_BURST_STUN_DURATION);
      expect(enemy2.applyStun).toHaveBeenCalledWith(EMP_BURST_STUN_DURATION);
      expect(enemy3.applyStun).toHaveBeenCalledWith(EMP_BURST_STUN_DURATION);
    });

    it('should not stun inactive enemies', () => {
      const enemy = makeMockEnemy(new THREE.Vector3(0, 0, -5), false);
      mockEnemies.push(enemy as unknown as GameObject);

      setEmpActive(true);
      system.update(0.016);

      expect(enemy.applyStun).not.toHaveBeenCalled();
    });
  });

  describe('Events', () => {
    it('should emit weaponFired with weapon: "emp"', () => {
      const handler = vi.fn();
      eventBus.on('weaponFired', handler);

      setEmpActive(true);
      system.update(0.016);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ weapon: 'emp' }),
      );
      eventBus.off('weaponFired', handler);
    });

    it('should emit empBurstActivated with position and radius', () => {
      const handler = vi.fn();
      eventBus.on('empBurstActivated', handler);

      setEmpActive(true);
      system.update(0.016);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ radius: EMP_BURST_RADIUS }),
      );
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          position: expect.objectContaining({
            x: expect.any(Number),
            y: expect.any(Number),
            z: expect.any(Number),
          }),
        }),
      );
      eventBus.off('empBurstActivated', handler);
    });
  });

  describe('Visual', () => {
    it('should spawn visual on activation', () => {
      setEmpActive(true);
      system.update(0.016);

      const stats = system.getPoolStats();
      expect(stats.active).toBe(1);
    });
  });

  describe('Cockpit recoil', () => {
    it('should trigger medium recoil (1.5) on activation', () => {
      const recoilSpy = vi.spyOn(cockpitRenderer, 'recoilArms');

      setEmpActive(true);
      system.update(0.016);

      expect(recoilSpy).toHaveBeenCalledWith(1.5);
    });
  });

  describe('Pool management', () => {
    it('should handle pool exhaustion gracefully', () => {
      // With 8-second cooldown and pool size 3, exhaustion is unlikely
      // but we should still handle it without crashing
      setEmpActive(true);
      system.update(0.016);
      const stats = system.getPoolStats();
      expect(stats.active).toBeLessThanOrEqual(EMP_BURST_POOL_SIZE);
    });
  });

  describe('getPoolStats()', () => {
    it('should return correct active and total counts', () => {
      const stats = system.getPoolStats();
      expect(stats).toEqual({ active: 0, total: EMP_BURST_POOL_SIZE });
    });
  });

  describe('Dispose', () => {
    it('should remove all visual meshes from scene on dispose', () => {
      const childrenBefore = scene.children.length;
      system.dispose();
      expect(scene.children.length).toBeLessThan(childrenBefore);
    });
  });
});
