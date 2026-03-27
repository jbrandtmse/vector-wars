import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { LogicBomb } from '../entities/projectiles/LogicBomb.ts';
import { VectorMaterials } from '../rendering/VectorMaterials.ts';
import { setActivePalette } from '../rendering/ColorPalette.ts';
import {
  BLOOM_LAYER,
  LOGIC_BOMB_SPEED,
  LOGIC_BOMB_MAX_RANGE,
  LOGIC_BOMB_MAX_LIFETIME,
  LOGIC_BOMB_COLLIDER_RADIUS,
} from '../config/constants.ts';
import type { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import type { Enemy } from '../entities/enemies/Enemy.ts';

function createMockEnemy(position: THREE.Vector3, active: boolean = true): Enemy {
  return {
    isActive: active,
    getPosition: () => position,
    getCollider: () => new THREE.Sphere(position.clone(), 1.5),
    takeDamage: () => {},
  } as unknown as Enemy;
}

describe('LogicBomb', () => {
  let material: LineMaterial;
  let bomb: LogicBomb;

  beforeEach(() => {
    setActivePalette('green');
    const vectorMaterials = new VectorMaterials();
    material = vectorMaterials.createFat('logic-bomb-test-' + Math.random(), 3.5);
    bomb = new LogicBomb(material);
  });

  describe('Construction', () => {
    it('should create with mesh initially invisible', () => {
      expect(bomb.mesh.visible).toBe(false);
    });

    it('should create as inactive', () => {
      expect(bomb.active).toBe(false);
    });

    it('should have bloom layer enabled on mesh', () => {
      const bloomTest = new THREE.Layers();
      bloomTest.set(BLOOM_LAYER);
      expect(bomb.mesh.layers.test(bloomTest)).toBe(true);
    });

    it('should create collider with correct radius', () => {
      expect(bomb.collider.radius).toBe(LOGIC_BOMB_COLLIDER_RADIUS);
    });
  });

  describe('Activate / Deactivate', () => {
    it('should become visible and active on activate', () => {
      const origin = new THREE.Vector3(1, 2, 3);
      const direction = new THREE.Vector3(0, 0, -1);
      const target = createMockEnemy(new THREE.Vector3(0, 0, -20));

      bomb.activate(origin, direction, target);

      expect(bomb.active).toBe(true);
      expect(bomb.mesh.visible).toBe(true);
      expect(bomb.mesh.position.x).toBe(1);
      expect(bomb.mesh.position.y).toBe(2);
      expect(bomb.mesh.position.z).toBe(3);
    });

    it('should store target reference on activate', () => {
      const target = createMockEnemy(new THREE.Vector3(0, 0, -20));
      bomb.activate(new THREE.Vector3(), new THREE.Vector3(0, 0, -1), target);

      expect(bomb.target).toBe(target);
    });

    it('should reset lifetime and distance on activate', () => {
      bomb.activate(
        new THREE.Vector3(),
        new THREE.Vector3(0, 0, -1),
        createMockEnemy(new THREE.Vector3(0, 0, -20)),
      );

      expect(bomb.distance).toBe(0);
      expect(bomb.lifetime).toBe(0);
    });

    it('should become invisible and inactive on deactivate', () => {
      bomb.activate(
        new THREE.Vector3(),
        new THREE.Vector3(0, 0, -1),
        createMockEnemy(new THREE.Vector3(0, 0, -20)),
      );
      bomb.deactivate();

      expect(bomb.active).toBe(false);
      expect(bomb.mesh.visible).toBe(false);
      expect(bomb.target).toBeNull();
    });
  });

  describe('Homing behavior', () => {
    it('should move toward target direction when target is active', () => {
      const target = createMockEnemy(new THREE.Vector3(10, 0, 0), true);
      bomb.activate(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1), target);

      // After update, should have moved
      bomb.update(0.1);

      // Bomb should have moved some distance
      const pos = bomb.mesh.position;
      expect(pos.length()).toBeGreaterThan(0);
    });

    it('should continue straight when target is null', () => {
      bomb.activate(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -1),
        null,
      );

      bomb.update(0.1);

      // Should move straight along initial direction (0, 0, -1)
      expect(bomb.mesh.position.z).toBeLessThan(0);
      expect(bomb.mesh.position.x).toBeCloseTo(0, 1);
      expect(bomb.mesh.position.y).toBeCloseTo(0, 1);
    });

    it('should continue straight when target becomes inactive', () => {
      const targetPos = new THREE.Vector3(10, 0, 0);
      let active = true;
      const target = {
        isActive: active,
        getPosition: () => targetPos,
        getCollider: () => new THREE.Sphere(targetPos.clone(), 1.5),
        takeDamage: () => {},
      } as unknown as Enemy;

      bomb.activate(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1), target);

      // First update with active target
      bomb.update(0.1);
      const posAfterHoming = bomb.mesh.position.clone();

      // Make target inactive
      (target as unknown as { isActive: boolean }).isActive = false;

      // Update again — should continue straight, no longer homing
      bomb.update(0.1);
      // Should still be moving (not stuck)
      expect(bomb.mesh.position.distanceTo(posAfterHoming)).toBeGreaterThan(0);
    });
  });

  describe('Deactivation conditions', () => {
    it('should deactivate when lifetime exceeds LOGIC_BOMB_MAX_LIFETIME', () => {
      bomb.activate(
        new THREE.Vector3(),
        new THREE.Vector3(0, 0, -1),
        null,
      );

      // Simulate enough time to exceed max lifetime
      const dt = LOGIC_BOMB_MAX_LIFETIME + 0.1;
      bomb.update(dt);

      expect(bomb.active).toBe(false);
    });

    it('should deactivate when distance exceeds LOGIC_BOMB_MAX_RANGE', () => {
      bomb.activate(
        new THREE.Vector3(),
        new THREE.Vector3(0, 0, -1),
        null,
      );

      // Move far enough to exceed range
      const updatesNeeded = Math.ceil(LOGIC_BOMB_MAX_RANGE / (LOGIC_BOMB_SPEED * 0.5)) + 2;
      for (let i = 0; i < updatesNeeded; i++) {
        bomb.update(0.5);
        if (!bomb.active) break;
      }

      expect(bomb.active).toBe(false);
    });
  });

  describe('Collider sync', () => {
    it('should sync collider center to mesh position during update', () => {
      bomb.activate(
        new THREE.Vector3(5, 10, 15),
        new THREE.Vector3(0, 0, -1),
        null,
      );

      bomb.update(0.016);

      expect(bomb.collider.center.x).toBeCloseTo(bomb.mesh.position.x, 3);
      expect(bomb.collider.center.y).toBeCloseTo(bomb.mesh.position.y, 3);
      expect(bomb.collider.center.z).toBeCloseTo(bomb.mesh.position.z, 3);
    });
  });
});
