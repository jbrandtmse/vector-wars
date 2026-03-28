import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as THREE from 'three';
import { BossPhase } from '../state/phases/BossPhase.ts';
import { VectorMaterials } from '../rendering/VectorMaterials.ts';
import { GameObjectManager } from '../entities/GameObjectManager.ts';
import { setActivePalette } from '../rendering/ColorPalette.ts';
import { eventBus } from '../core/GameEvents.ts';
import { GatekeeperBoss } from '../entities/bosses/GatekeeperBoss.ts';
import { AvengerBoss } from '../entities/bosses/AvengerBoss.ts';

describe('BossPhase', () => {
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let vectorMaterials: VectorMaterials;
  let gameObjectManager: GameObjectManager;
  let playerPosition: THREE.Vector3;
  let phase: BossPhase;

  beforeEach(() => {
    setActivePalette('green');
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, 16 / 9, 0.01, 1000);
    camera.position.set(35, 10, 0);
    scene.add(camera);
    camera.updateMatrixWorld(true);

    vectorMaterials = new VectorMaterials();
    gameObjectManager = new GameObjectManager();
    playerPosition = new THREE.Vector3(35, 10, 0);

    phase = new BossPhase(
      scene,
      camera,
      vectorMaterials,
      gameObjectManager,
      () => playerPosition,
    );
  });

  afterEach(() => {
    // Clean up if enter was called
    if (phase.getBoss()) {
      phase.exit();
    }
    vectorMaterials.dispose();
  });

  describe('enter()', () => {
    it('should create the GatekeeperBoss', () => {
      phase.enter();
      expect(phase.getBoss()).toBeInstanceOf(GatekeeperBoss);
    });

    it('should register boss with GameObjectManager', () => {
      phase.enter();
      const entities = gameObjectManager.getAll();
      expect(entities.length).toBe(1);
      expect(entities[0]).toBe(phase.getBoss());
    });

    it('should add boss object3D to scene', () => {
      const addSpy = vi.spyOn(scene, 'add');
      phase.enter();
      // Should have added grid floor and boss object3D
      expect(addSpy).toHaveBeenCalled();
      const boss = phase.getBoss();
      expect(boss).not.toBeNull();
      expect(scene.children).toContain(boss!.getObject3D());
    });

    it('should position boss at world origin', () => {
      phase.enter();
      const boss = phase.getBoss()!;
      expect(boss.getPosition().x).toBe(0);
      expect(boss.getPosition().y).toBe(0);
      expect(boss.getPosition().z).toBe(0);
    });

    it('should create arena grid environment', () => {
      phase.enter();
      // Scene should contain camera, grid, and boss at minimum
      expect(scene.children.length).toBeGreaterThanOrEqual(2);
    });

    it('should initialize orbit progress to 0', () => {
      phase.enter();
      expect(phase.getOrbitProgress()).toBe(0);
    });

    it('should not be complete initially', () => {
      phase.enter();
      expect(phase.isComplete()).toBe(false);
      expect(phase.isBossDefeated()).toBe(false);
    });
  });

  describe('update()', () => {
    it('should advance orbit progress along rail', () => {
      phase.enter();
      phase.update(1.0);
      expect(phase.getOrbitProgress()).toBeGreaterThan(0);
    });

    it('should update camera position from rail', () => {
      phase.enter();
      const initialPos = camera.position.clone();
      phase.update(0.5);
      // Camera should have moved
      expect(camera.position.distanceTo(initialPos)).toBeGreaterThan(0);
    });

    it('should smoothly orient camera toward boss', () => {
      phase.enter();
      // Set camera facing away from boss
      camera.lookAt(100, 100, 100);
      const initialQuat = camera.quaternion.clone();

      phase.update(0.016);

      // Camera quaternion should have changed (slerp toward boss)
      const quatChanged =
        camera.quaternion.x !== initialQuat.x ||
        camera.quaternion.y !== initialQuat.y ||
        camera.quaternion.z !== initialQuat.z ||
        camera.quaternion.w !== initialQuat.w;
      expect(quatChanged).toBe(true);
    });

    it('should update boss entity', () => {
      phase.enter();
      const boss = phase.getBoss()!;
      const updateSpy = vi.spyOn(boss, 'update');
      phase.update(0.016);
      expect(updateSpy).toHaveBeenCalledWith(0.016);
    });

    it('should wrap orbit progress for seamless looping', () => {
      phase.enter();
      // Advance many frames to go past 1.0
      for (let i = 0; i < 500; i++) {
        phase.update(0.1);
      }
      const progress = phase.getOrbitProgress();
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThan(1);
    });
  });

  describe('Boss defeat handling', () => {
    it('should set bossDefeated flag on bossDefeated event', () => {
      phase.enter();
      expect(phase.isBossDefeated()).toBe(false);

      eventBus.emit('bossDefeated', {
        position: { x: 0, y: 0, z: 0 },
        scoreValue: 5000,
      });

      expect(phase.isBossDefeated()).toBe(true);
    });

    it('should NOT mark phase complete on bossDefeated alone (Story 3-10)', () => {
      phase.enter();

      eventBus.emit('bossDefeated', {
        position: { x: 0, y: 0, z: 0 },
        scoreValue: 5000,
      });

      phase.update(0.016);
      // bossDefeated no longer triggers completion; bossDestroyed does
      expect(phase.isComplete()).toBe(false);
    });

    it('should mark phase complete on bossDestroyed event (Story 3-10)', () => {
      phase.enter();

      // First boss is defeated (health = 0)
      eventBus.emit('bossDefeated', {
        position: { x: 0, y: 0, z: 0 },
        scoreValue: 5000,
      });
      expect(phase.isComplete()).toBe(false);

      // Then destruction sequence completes
      eventBus.emit('bossDestroyed', {
        position: { x: 0, y: 0, z: 0 },
        scoreValue: 5000,
      });
      expect(phase.isComplete()).toBe(true);
    });

    it('should mark phase complete on bossDestroyed even without bossDefeated', () => {
      phase.enter();

      eventBus.emit('bossDestroyed', {
        position: { x: 0, y: 0, z: 0 },
        scoreValue: 5000,
      });

      expect(phase.isComplete()).toBe(true);
    });
  });

  describe('exit()', () => {
    it('should dispose boss and remove from scene', () => {
      phase.enter();
      const boss = phase.getBoss()!;
      const bossObj = boss.getObject3D();

      phase.exit();

      expect(phase.getBoss()).toBeNull();
      expect(scene.children).not.toContain(bossObj);
    });

    it('should remove boss from GameObjectManager', () => {
      phase.enter();
      expect(gameObjectManager.getAll().length).toBe(1);

      phase.exit();
      expect(gameObjectManager.getAll().length).toBe(0);
    });

    it('should unsubscribe from events', () => {
      phase.enter();
      phase.exit();

      // Emitting bossDefeated should not affect the phase
      eventBus.emit('bossDefeated', {
        position: { x: 0, y: 0, z: 0 },
        scoreValue: 5000,
      });
      expect(phase.isBossDefeated()).toBe(false);
    });

    it('should clean up arena geometry', () => {
      phase.enter();
      const removeSpy = vi.spyOn(scene, 'remove');

      phase.exit();

      // Should remove boss object and grid floor
      expect(removeSpy).toHaveBeenCalled();
    });
  });

  describe('Boss factory (Story 5-2)', () => {
    it('should create GatekeeperBoss by default when no factory provided', () => {
      phase.enter();
      expect(phase.getBoss()).toBeInstanceOf(GatekeeperBoss);
      phase.exit();
    });

    it('should create AvengerBoss when avenger factory provided', () => {
      setActivePalette('amber');
      const avengerPhase = new BossPhase(
        scene,
        camera,
        vectorMaterials,
        gameObjectManager,
        () => playerPosition,
        (vm, ppg) => new AvengerBoss(vm, ppg),
      );
      avengerPhase.enter();
      expect(avengerPhase.getBoss()).toBeInstanceOf(AvengerBoss);
      avengerPhase.exit();
    });

    it('should use custom factory to create boss', () => {
      const factorySpy = vi.fn((vm: VectorMaterials, ppg: () => THREE.Vector3) => new GatekeeperBoss(vm, ppg));
      const factoryPhase = new BossPhase(
        scene,
        camera,
        vectorMaterials,
        gameObjectManager,
        () => playerPosition,
        factorySpy,
      );
      factoryPhase.enter();
      expect(factorySpy).toHaveBeenCalledOnce();
      factoryPhase.exit();
    });
  });
});
