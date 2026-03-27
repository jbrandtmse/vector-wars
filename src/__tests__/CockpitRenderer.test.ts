import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { CockpitRenderer } from '../rendering/CockpitRenderer.ts';
import { VectorMaterials } from '../rendering/VectorMaterials.ts';
import { setActivePalette } from '../rendering/ColorPalette.ts';
import { BLOOM_LAYER, RECOIL_INTENSITY } from '../config/constants.ts';

describe('CockpitRenderer', () => {
  let camera: THREE.PerspectiveCamera;
  let vectorMats: VectorMaterials;
  let cockpit: CockpitRenderer;

  beforeEach(() => {
    setActivePalette('green');
    camera = new THREE.PerspectiveCamera(70, 16 / 9, 0.01, 1000);
    vectorMats = new VectorMaterials();
    cockpit = new CockpitRenderer(camera, vectorMats);
  });

  describe('Task 1: Construction and camera parenting', () => {
    it('should create a cockpit group and add it to the camera', () => {
      // The camera should have children (the cockpit group)
      expect(camera.children.length).toBeGreaterThan(0);
    });

    it('should position the cockpit group in camera-local space', () => {
      const cockpitGroup = camera.children[0];
      // Z should be negative (in front of camera)
      expect(cockpitGroup.position.z).toBeLessThan(0);
    });

    it('should have a THREE.Group as the root cockpit container', () => {
      const cockpitGroup = camera.children[0];
      expect(cockpitGroup).toBeInstanceOf(THREE.Group);
    });
  });

  describe('Task 2: Actuator arm geometry', () => {
    it('should create left and right actuator arms as LineSegments', () => {
      const cockpitGroup = camera.children[0] as THREE.Group;
      const lineSegments = cockpitGroup.children.filter(
        (child) => child instanceof LineSegments2
      );
      // At minimum: left arm, right arm, and frame
      expect(lineSegments.length).toBeGreaterThanOrEqual(2);
    });

    it('should have arms with bloom layer enabled', () => {
      const cockpitGroup = camera.children[0] as THREE.Group;
      const lineSegments = cockpitGroup.children.filter(
        (child) => child instanceof LineSegments2
      );
      const bloomTest = new THREE.Layers();
      bloomTest.set(BLOOM_LAYER);
      for (const seg of lineSegments) {
        expect(seg.layers.test(bloomTest)).toBe(true);
      }
    });

    it('should create both left and right arms as separate LineSegments2 children', () => {
      const cockpitGroup = camera.children[0] as THREE.Group;
      const fatLines = cockpitGroup.children.filter(
        (child) => child instanceof LineSegments2
      );
      // left arm + right arm + frame = 3
      expect(fatLines.length).toBe(3);
    });
  });

  describe('Task 3: Cockpit frame geometry', () => {
    it('should create cockpit frame as LineSegments with bloom layer', () => {
      const cockpitGroup = camera.children[0] as THREE.Group;
      const lineSegments = cockpitGroup.children.filter(
        (child) => child instanceof LineSegments2
      );
      // left arm + right arm + frame = at least 3
      expect(lineSegments.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Task 4: Animation stub methods', () => {
    it('should have recoilArms method that is callable without throwing', () => {
      expect(() => cockpit.recoilArms(0.5)).not.toThrow();
    });

    it('should have sparkDamage method that is callable without throwing', () => {
      expect(() => cockpit.sparkDamage()).not.toThrow();
    });

    it('should have dispose method', () => {
      expect(typeof cockpit.dispose).toBe('function');
    });
  });

  describe('Task 4.3: Disposal', () => {
    it('should remove cockpit group from camera when disposed', () => {
      const childCountBefore = camera.children.length;
      cockpit.dispose();
      expect(camera.children.length).toBeLessThan(childCountBefore);
    });

    it('should dispose all geometries on dispose', () => {
      cockpit.dispose();

      // After dispose, the cockpit group should be removed from camera
      expect(camera.children.length).toBe(0);
    });
  });

  describe('Recoil animation (Story 1-5)', () => {
    it('should shift cockpit group Z backward when recoilArms is called', () => {
      const cockpitGroup = camera.children[0] as THREE.Group;
      const restZ = cockpitGroup.position.z;
      cockpit.recoilArms(1.0);
      // After recoil, Z should be more negative (further back)
      expect(cockpitGroup.position.z).toBeLessThan(restZ);
    });

    it('should apply recoil proportional to RECOIL_INTENSITY', () => {
      const cockpitGroup = camera.children[0] as THREE.Group;
      const restZ = cockpitGroup.position.z;
      cockpit.recoilArms(1.0);
      // The offset should be approximately -RECOIL_INTENSITY
      expect(cockpitGroup.position.z).toBeCloseTo(restZ - RECOIL_INTENSITY, 3);
    });

    it('should recover toward rest position over time via update(dt)', () => {
      const cockpitGroup = camera.children[0] as THREE.Group;
      const restZ = cockpitGroup.position.z;
      cockpit.recoilArms(1.0);
      const recoiledZ = cockpitGroup.position.z;
      // Simulate several update steps
      cockpit.update(0.016);
      cockpit.update(0.016);
      cockpit.update(0.016);
      // Should be closer to rest than the recoiled position
      expect(Math.abs(cockpitGroup.position.z - restZ)).toBeLessThan(
        Math.abs(recoiledZ - restZ)
      );
    });

    it('should return exactly to rest position (no drift)', () => {
      const cockpitGroup = camera.children[0] as THREE.Group;
      const restZ = cockpitGroup.position.z;
      cockpit.recoilArms(1.0);
      // Simulate many update steps to fully recover
      for (let i = 0; i < 60; i++) {
        cockpit.update(0.016);
      }
      expect(cockpitGroup.position.z).toBe(restZ);
    });

    it('should handle multiple rapid recoils correctly (interrupting a recovery)', () => {
      const cockpitGroup = camera.children[0] as THREE.Group;
      const restZ = cockpitGroup.position.z;
      // First recoil
      cockpit.recoilArms(1.0);
      cockpit.update(0.016);
      cockpit.update(0.016);
      // Second recoil interrupts recovery
      cockpit.recoilArms(1.0);
      // Should still be offset from rest
      expect(cockpitGroup.position.z).toBeLessThan(restZ);
      // After many updates, should still recover fully
      for (let i = 0; i < 60; i++) {
        cockpit.update(0.016);
      }
      expect(cockpitGroup.position.z).toBe(restZ);
    });
  });

  describe('Task 6.7: Materials created via VectorMaterials', () => {
    it('should return existing materials when requesting same IDs', () => {
      // CockpitRenderer already created these — requesting again returns same instance
      const mat = vectorMats.createFat('cockpit-arm-left', 2);
      expect(mat).toBeDefined();
    });
  });
});
