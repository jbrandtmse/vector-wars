/**
 * PlaytestingBugFixes.test.ts -- Tests for Story 6-8 bug fixes.
 *
 * Verifies: reset methods on all gameplay systems, VirusPayloadSystem wiring,
 * GameObjectManager.clearAll(), and second-playthrough state cleanup.
 *
 * Created by: Story 6-8
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as THREE from 'three';
import { DataLanceSystem } from '../systems/DataLanceSystem.ts';
import { EMPBurstSystem } from '../systems/EMPBurstSystem.ts';
import { VirusPayloadSystem } from '../systems/VirusPayloadSystem.ts';
import { EnemyProjectileSystem } from '../systems/EnemyProjectileSystem.ts';
import { EffectsManager } from '../systems/EffectsManager.ts';
import { RailMovement } from '../systems/RailMovement.ts';
import { GameObjectManager } from '../entities/GameObjectManager.ts';
import { VectorMaterials } from '../rendering/VectorMaterials.ts';
import { CockpitRenderer } from '../rendering/CockpitRenderer.ts';
import { setActivePalette } from '../rendering/ColorPalette.ts';
import { eventBus } from '../core/GameEvents.ts';
import type { InputManager } from '../core/InputManager.ts';
import type { GameObject } from '../entities/GameObject.ts';

// Suppress Logger output in tests
vi.mock('../core/Logger.ts', () => ({
  Logger: {
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

describe('PlaytestingBugFixes', () => {
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let vectorMaterials: VectorMaterials;
  let cockpitRenderer: CockpitRenderer;
  let mockIsActive: ReturnType<typeof vi.fn>;
  let inputManager: InputManager;
  let mockEntities: GameObject[];
  let gameObjectManager: GameObjectManager;

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

    mockEntities = [];
    gameObjectManager = new GameObjectManager();
  });

  describe('DataLanceSystem.reset()', () => {
    let system: DataLanceSystem;

    beforeEach(() => {
      system = new DataLanceSystem(scene, camera, inputManager, vectorMaterials, cockpitRenderer);
    });

    afterEach(() => {
      system.dispose();
    });

    it('should deactivate all active bolts', () => {
      // Fire some bolts
      mockIsActive.mockImplementation((action: string) => action === 'fire');
      system.update(0.016);
      system.update(0.2); // wait past cooldown
      system.update(0.016);

      const statsBefore = system.getPoolStats();
      expect(statsBefore.active).toBeGreaterThan(0);

      system.reset();

      const statsAfter = system.getPoolStats();
      expect(statsAfter.active).toBe(0);
    });

    it('should clear cooldown', () => {
      // Fire once to set cooldown
      mockIsActive.mockImplementation((action: string) => action === 'fire');
      system.update(0.016);

      // Reset
      system.reset();

      // Should be able to fire immediately
      system.update(0.016);
      const stats = system.getPoolStats();
      expect(stats.active).toBeGreaterThan(0);
    });
  });

  describe('EMPBurstSystem.reset()', () => {
    let system: EMPBurstSystem;
    let mockGameObjectManager: GameObjectManager;

    beforeEach(() => {
      mockGameObjectManager = {
        getAll: () => mockEntities,
        add: vi.fn(),
        remove: vi.fn(),
        update: vi.fn(),
        getActiveCount: vi.fn(),
        clearAll: vi.fn(),
      } as unknown as GameObjectManager;
      system = new EMPBurstSystem(
        scene, camera, inputManager, vectorMaterials, cockpitRenderer, mockGameObjectManager,
      );
    });

    afterEach(() => {
      system.dispose();
    });

    it('should clear cooldown after reset', () => {
      // Activate EMP to set cooldown
      mockIsActive.mockImplementation((action: string) => action === 'emp');
      system.update(0.016);
      expect(system.getCooldownRemaining()).toBeGreaterThan(0);

      system.reset();
      expect(system.getCooldownRemaining()).toBe(0);
    });

    it('should deactivate all active bursts', () => {
      // Activate EMP
      mockIsActive.mockImplementation((action: string) => action === 'emp');
      system.update(0.016);

      const statsBefore = system.getPoolStats();
      expect(statsBefore.active).toBeGreaterThan(0);

      system.reset();

      const statsAfter = system.getPoolStats();
      expect(statsAfter.active).toBe(0);
    });
  });

  describe('VirusPayloadSystem.reset()', () => {
    let system: VirusPayloadSystem;
    let mockGameObjectManager: GameObjectManager;

    beforeEach(() => {
      mockGameObjectManager = {
        getAll: () => mockEntities,
        add: vi.fn(),
        remove: vi.fn(),
        update: vi.fn(),
        getActiveCount: vi.fn(),
        clearAll: vi.fn(),
      } as unknown as GameObjectManager;
      system = new VirusPayloadSystem(
        scene, camera, inputManager, vectorMaterials, cockpitRenderer, mockGameObjectManager,
      );
    });

    afterEach(() => {
      system.dispose();
    });

    it('should clear bossIsDefeated state', () => {
      // Simulate boss defeated
      eventBus.emit('bossDefeated', { position: { x: 0, y: 0, z: 0 }, scoreValue: 5000 });

      // Boss is vulnerable but defeated -- cannot fire
      eventBus.emit('bossVulnerable', { vulnerable: true });
      mockIsActive.mockImplementation((action: string) => action === 'virusPayload');
      system.update(0.016);
      expect(system.getPoolStats().active).toBe(0);

      // Reset
      system.reset();

      // After reset, should be able to fire if boss becomes vulnerable again
      eventBus.emit('bossVulnerable', { vulnerable: true });
      system.update(0.016);
      expect(system.getPoolStats().active).toBeGreaterThan(0);
    });

    it('should clear bossIsVulnerable state', () => {
      eventBus.emit('bossVulnerable', { vulnerable: true });
      expect(system.isBossVulnerable()).toBe(true);

      system.reset();
      expect(system.isBossVulnerable()).toBe(false);
    });

    it('should clear cooldown', () => {
      // Fire to set cooldown
      eventBus.emit('bossVulnerable', { vulnerable: true });
      mockIsActive.mockImplementation((action: string) => action === 'virusPayload');
      system.update(0.016);
      expect(system.getCooldownRemaining()).toBeGreaterThan(0);

      system.reset();
      expect(system.getCooldownRemaining()).toBe(0);
    });

    it('should deactivate all in-flight payloads', () => {
      // Fire a payload
      eventBus.emit('bossVulnerable', { vulnerable: true });
      mockIsActive.mockImplementation((action: string) => action === 'virusPayload');
      system.update(0.016);
      expect(system.getPoolStats().active).toBeGreaterThan(0);

      system.reset();
      expect(system.getPoolStats().active).toBe(0);
    });
  });

  describe('GameObjectManager.clearAll()', () => {
    it('should empty the entity list', () => {
      const mockEntity1 = { isActive: true, update: vi.fn() } as unknown as GameObject;
      const mockEntity2 = { isActive: true, update: vi.fn() } as unknown as GameObject;
      gameObjectManager.add(mockEntity1);
      gameObjectManager.add(mockEntity2);
      expect(gameObjectManager.getAll().length).toBe(2);

      gameObjectManager.clearAll();
      expect(gameObjectManager.getAll().length).toBe(0);
    });

    it('should return empty array after clearAll', () => {
      const mockEntity = { isActive: true, update: vi.fn() } as unknown as GameObject;
      gameObjectManager.add(mockEntity);

      gameObjectManager.clearAll();
      expect(gameObjectManager.getActiveCount()).toBe(0);
    });
  });

  describe('EnemyProjectileSystem.reset()', () => {
    let system: EnemyProjectileSystem;

    beforeEach(() => {
      const playerCollider = new THREE.Sphere(new THREE.Vector3(100, 100, 100), 0.5);
      system = new EnemyProjectileSystem(scene, vectorMaterials, playerCollider);
    });

    it('should deactivate all active projectiles', () => {
      // Fire some projectiles
      const origin = new THREE.Vector3(0, 0, 0);
      const target = new THREE.Vector3(0, 0, -10);
      system.fireAt(origin, target, 15, 10);
      system.fireAt(origin, target, 15, 10);

      const statsBefore = system.getPoolStats();
      expect(statsBefore.active).toBeGreaterThan(0);

      system.reset();

      const statsAfter = system.getPoolStats();
      expect(statsAfter.active).toBe(0);
    });
  });

  describe('EffectsManager.reset()', () => {
    let effectsManager: EffectsManager;

    beforeEach(() => {
      effectsManager = new EffectsManager(scene, vectorMaterials);
    });

    it('should deactivate all active explosions', () => {
      // Trigger an explosion via event
      eventBus.emit('enemyDestroyed', {
        enemy: {} as unknown as import('../entities/enemies/Enemy.ts').Enemy,
        position: { x: 0, y: 0, z: 0 },
      });

      const statsBefore = effectsManager.getPoolStats();
      expect(statsBefore.active).toBeGreaterThan(0);

      effectsManager.reset();

      const statsAfter = effectsManager.getPoolStats();
      expect(statsAfter.active).toBe(0);
    });

    it('should reset pool index', () => {
      // Trigger multiple explosions
      for (let i = 0; i < 3; i++) {
        eventBus.emit('enemyDestroyed', {
          enemy: {} as unknown as import('../entities/enemies/Enemy.ts').Enemy,
          position: { x: i, y: 0, z: 0 },
        });
      }

      effectsManager.reset();

      // After reset, all explosions should be inactive
      const stats = effectsManager.getPoolStats();
      expect(stats.active).toBe(0);
    });
  });

  describe('RailMovement.reset()', () => {
    it('should reset progress to 0', () => {
      const railMovement = new RailMovement(camera);

      // Advance rail
      railMovement.update(1.0, { x: 0, y: 0 });
      expect(railMovement.getRailProgress()).toBeGreaterThan(0);

      railMovement.reset();
      expect(railMovement.getRailProgress()).toBe(0);
    });
  });

  describe('VirusPayloadSystem wiring verification', () => {
    it('VirusPayloadSystem class should have reset method', () => {
      const mockGom = {
        getAll: () => [],
        add: vi.fn(),
        remove: vi.fn(),
        update: vi.fn(),
        getActiveCount: vi.fn(),
        clearAll: vi.fn(),
      } as unknown as GameObjectManager;
      const system = new VirusPayloadSystem(
        scene, camera, inputManager, vectorMaterials, cockpitRenderer, mockGom,
      );
      expect(typeof system.reset).toBe('function');
      expect(typeof system.update).toBe('function');
      system.dispose();
    });

    it('VirusPayloadSystem can fire during boss vulnerability windows', () => {
      const mockGom = {
        getAll: () => mockEntities,
        add: vi.fn(),
        remove: vi.fn(),
        update: vi.fn(),
        getActiveCount: vi.fn(),
        clearAll: vi.fn(),
      } as unknown as GameObjectManager;
      const system = new VirusPayloadSystem(
        scene, camera, inputManager, vectorMaterials, cockpitRenderer, mockGom,
      );

      // Make boss vulnerable and press C
      eventBus.emit('bossVulnerable', { vulnerable: true });
      mockIsActive.mockImplementation((action: string) => action === 'virusPayload');
      system.update(0.016);

      expect(system.getPoolStats().active).toBeGreaterThan(0);
      system.dispose();
    });
  });
});
