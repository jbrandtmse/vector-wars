import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as THREE from 'three';
import { VirusPayloadSystem } from '../systems/VirusPayloadSystem.ts';
import { VectorMaterials } from '../rendering/VectorMaterials.ts';
import { CockpitRenderer } from '../rendering/CockpitRenderer.ts';
import { setActivePalette } from '../rendering/ColorPalette.ts';
import { eventBus } from '../core/GameEvents.ts';
import {
  VIRUS_PAYLOAD_POOL_SIZE,
  VIRUS_PAYLOAD_FIRE_COOLDOWN,
  VIRUS_PAYLOAD_DAMAGE,
} from '../config/constants.ts';
import type { InputManager } from '../core/InputManager.ts';
import type { GameObjectManager } from '../entities/GameObjectManager.ts';
import type { GameObject } from '../entities/GameObject.ts';

function makeMockBoss(position: THREE.Vector3, active: boolean = true, defeated: boolean = false) {
  const collider = new THREE.Sphere(position.clone(), 6.0);
  return {
    isActive: active,
    defeated,
    getPosition: () => position,
    getCollider: () => collider,
    takeDamage: vi.fn(),
    health: 500,
    id: Math.floor(Math.random() * 10000),
  } as unknown as GameObject;
}

function makeMockEnemy(position: THREE.Vector3, active: boolean = true) {
  // Regular enemy: does NOT have 'defeated' property
  return {
    isActive: active,
    getPosition: () => position,
    getCollider: () => new THREE.Sphere(position.clone(), 1.5),
    takeDamage: vi.fn(),
    health: 30,
    id: Math.floor(Math.random() * 10000),
  } as unknown as GameObject;
}

describe('VirusPayloadSystem', () => {
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let vectorMaterials: VectorMaterials;
  let cockpitRenderer: CockpitRenderer;
  let mockIsActive: ReturnType<typeof vi.fn>;
  let inputManager: InputManager;
  let mockEntities: GameObject[];
  let gameObjectManager: GameObjectManager;
  let system: VirusPayloadSystem;

  function setVirusPayloadActive(active: boolean): void {
    mockIsActive.mockImplementation((action: string) => {
      if (action === 'virusPayload') return active;
      return false;
    });
  }

  function makeBossVulnerable(): void {
    eventBus.emit('bossVulnerable', { vulnerable: true });
  }

  function makeBossNotVulnerable(): void {
    eventBus.emit('bossVulnerable', { vulnerable: false });
  }

  function triggerBossDefeated(): void {
    eventBus.emit('bossDefeated', { position: { x: 0, y: 0, z: 0 }, scoreValue: 5000 });
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

    mockEntities = [];
    gameObjectManager = {
      getAll: () => mockEntities,
      add: vi.fn(),
      remove: vi.fn(),
      update: vi.fn(),
      getActiveCount: vi.fn(),
    } as unknown as GameObjectManager;

    system = new VirusPayloadSystem(
      scene, camera, inputManager, vectorMaterials, cockpitRenderer, gameObjectManager,
    );
  });

  afterEach(() => {
    system.dispose();
  });

  describe('Pool initialization', () => {
    it('should start with all payloads inactive', () => {
      const stats = system.getPoolStats();
      expect(stats.active).toBe(0);
      expect(stats.total).toBe(VIRUS_PAYLOAD_POOL_SIZE);
    });
  });

  describe('Vulnerability window gating', () => {
    it('should NOT fire when boss is not vulnerable', () => {
      // Boss is in scene but NOT vulnerable (default state)
      const boss = makeMockBoss(new THREE.Vector3(0, 0, -20));
      mockEntities.push(boss);

      setVirusPayloadActive(true);
      system.update(0.016);

      const stats = system.getPoolStats();
      expect(stats.active).toBe(0);
    });

    it('should fire when boss IS vulnerable and input active', () => {
      makeBossVulnerable();

      setVirusPayloadActive(true);
      system.update(0.016);

      const stats = system.getPoolStats();
      expect(stats.active).toBe(1);
    });

    it('should stop allowing fire when vulnerability window closes', () => {
      makeBossVulnerable();

      // Fire one payload
      setVirusPayloadActive(true);
      system.update(0.016);
      expect(system.getPoolStats().active).toBe(1);

      // Close vulnerability window
      makeBossNotVulnerable();

      // Wait for cooldown
      setVirusPayloadActive(true);
      system.update(VIRUS_PAYLOAD_FIRE_COOLDOWN + 0.01);

      // Should NOT have fired a second time (still 1 active from before)
      // The first payload may still be in flight
      const stats = system.getPoolStats();
      expect(stats.active).toBe(1);
    });

    it('isBossVulnerable() should reflect current vulnerability state', () => {
      expect(system.isBossVulnerable()).toBe(false);
      makeBossVulnerable();
      expect(system.isBossVulnerable()).toBe(true);
      makeBossNotVulnerable();
      expect(system.isBossVulnerable()).toBe(false);
    });
  });

  describe('Cooldown enforcement', () => {
    it('should respect cooldown between shots', () => {
      makeBossVulnerable();
      setVirusPayloadActive(true);

      // First shot
      system.update(0.016);
      expect(system.getPoolStats().active).toBe(1);

      // Immediate second attempt -- should not fire (cooldown)
      system.update(0.016);
      expect(system.getPoolStats().active).toBe(1);

      // After cooldown expires -- should fire
      system.update(VIRUS_PAYLOAD_FIRE_COOLDOWN);
      expect(system.getPoolStats().active).toBe(2);
    });

    it('getCooldownRemaining() should return time until next fire', () => {
      makeBossVulnerable();
      setVirusPayloadActive(true);

      system.update(0.016);
      expect(system.getCooldownRemaining()).toBeGreaterThan(0);
      expect(system.getCooldownRemaining()).toBeLessThanOrEqual(VIRUS_PAYLOAD_FIRE_COOLDOWN);
    });
  });

  describe('Collision with boss', () => {
    it('should deal VIRUS_PAYLOAD_DAMAGE to boss on sphere-sphere hit', () => {
      const bossPos = new THREE.Vector3(0, 0, -3);
      const boss = makeMockBoss(bossPos);
      mockEntities.push(boss);

      makeBossVulnerable();
      setVirusPayloadActive(true);
      system.update(0.016);

      // Move payload into collision range
      setVirusPayloadActive(false);
      for (let i = 0; i < 30; i++) {
        system.update(0.016);
      }

      expect(boss.takeDamage).toHaveBeenCalledWith(VIRUS_PAYLOAD_DAMAGE);
    });

    it('should deactivate payload on hit', () => {
      // Place boss far enough that the payload doesn't collide on fire frame
      const bossPos = new THREE.Vector3(0, 0, -15);
      const boss = makeMockBoss(bossPos);
      mockEntities.push(boss);

      makeBossVulnerable();
      setVirusPayloadActive(true);
      system.update(0.016);
      expect(system.getPoolStats().active).toBe(1);

      // Move payload into collision range
      setVirusPayloadActive(false);
      for (let i = 0; i < 60; i++) {
        system.update(0.016);
      }

      expect(system.getPoolStats().active).toBe(0);
    });

    it('should NOT hit regular enemies (only boss entities with "defeated" property)', () => {
      const enemyPos = new THREE.Vector3(0, 0, -3);
      const enemy = makeMockEnemy(enemyPos);
      mockEntities.push(enemy);

      makeBossVulnerable();
      setVirusPayloadActive(true);
      system.update(0.016);

      // Move payload into collision range
      setVirusPayloadActive(false);
      for (let i = 0; i < 30; i++) {
        system.update(0.016);
      }

      // Regular enemy should NOT be damaged
      expect(enemy.takeDamage).not.toHaveBeenCalled();
    });

    it('should emit virusPayloadDelivered event on hit', () => {
      const deliveredHandler = vi.fn();
      eventBus.on('virusPayloadDelivered', deliveredHandler);

      const bossPos = new THREE.Vector3(0, 0, -3);
      const boss = makeMockBoss(bossPos);
      mockEntities.push(boss);

      makeBossVulnerable();
      setVirusPayloadActive(true);
      system.update(0.016);

      setVirusPayloadActive(false);
      for (let i = 0; i < 30; i++) {
        system.update(0.016);
      }

      expect(deliveredHandler).toHaveBeenCalledWith(
        expect.objectContaining({ damage: VIRUS_PAYLOAD_DAMAGE }),
      );
      eventBus.off('virusPayloadDelivered', deliveredHandler);
    });
  });

  describe('Event emission on fire', () => {
    it('should emit weaponFired event with weapon: virusPayload on fire', () => {
      const weaponFiredHandler = vi.fn();
      eventBus.on('weaponFired', weaponFiredHandler);

      makeBossVulnerable();
      setVirusPayloadActive(true);
      system.update(0.016);

      expect(weaponFiredHandler).toHaveBeenCalledWith(
        expect.objectContaining({ weapon: 'virusPayload' }),
      );
      eventBus.off('weaponFired', weaponFiredHandler);
    });
  });

  describe('Recoil', () => {
    it('should trigger cockpitRenderer.recoilArms(2.5) on fire (heaviest recoil)', () => {
      const recoilSpy = vi.spyOn(cockpitRenderer, 'recoilArms');

      makeBossVulnerable();
      setVirusPayloadActive(true);
      system.update(0.016);

      expect(recoilSpy).toHaveBeenCalledWith(2.5);
    });
  });

  describe('bossDefeated handling', () => {
    it('should deactivate all in-flight payloads on bossDefeated', () => {
      makeBossVulnerable();
      setVirusPayloadActive(true);
      system.update(0.016);
      expect(system.getPoolStats().active).toBe(1);

      // Boss defeated
      triggerBossDefeated();

      // Next update should deactivate all payloads
      setVirusPayloadActive(false);
      system.update(0.016);
      expect(system.getPoolStats().active).toBe(0);
    });

    it('should prevent further firing after bossDefeated', () => {
      makeBossVulnerable();
      triggerBossDefeated();

      setVirusPayloadActive(true);
      system.update(0.016);

      expect(system.getPoolStats().active).toBe(0);
    });
  });

  describe('Pool stats', () => {
    it('should return correct active and total counts', () => {
      const stats = system.getPoolStats();
      expect(stats).toEqual({ active: 0, total: VIRUS_PAYLOAD_POOL_SIZE });
    });

    it('should increment active count when firing', () => {
      makeBossVulnerable();
      setVirusPayloadActive(true);
      system.update(0.016);

      expect(system.getPoolStats().active).toBe(1);
    });
  });

  describe('Dispose', () => {
    it('should remove all payload meshes from scene on dispose', () => {
      const childrenBefore = scene.children.length;
      system.dispose();
      expect(scene.children.length).toBeLessThan(childrenBefore);
    });
  });
});
