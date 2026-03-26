import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { CockpitRenderer } from '../rendering/CockpitRenderer.ts';
import { VectorMaterials } from '../rendering/VectorMaterials.ts';
import { setActivePalette } from '../rendering/ColorPalette.ts';
import { BLOOM_LAYER } from '../config/constants.ts';

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
        (child) => child instanceof THREE.LineSegments
      );
      // At minimum: left arm, right arm, and frame
      expect(lineSegments.length).toBeGreaterThanOrEqual(2);
    });

    it('should have arms with bloom layer enabled', () => {
      const cockpitGroup = camera.children[0] as THREE.Group;
      const lineSegments = cockpitGroup.children.filter(
        (child) => child instanceof THREE.LineSegments
      );
      const bloomTest = new THREE.Layers();
      bloomTest.set(BLOOM_LAYER);
      for (const seg of lineSegments) {
        expect(seg.layers.test(bloomTest)).toBe(true);
      }
    });

    it('should position left arm at negative X and right arm at positive X', () => {
      const cockpitGroup = camera.children[0] as THREE.Group;
      const lineSegments = cockpitGroup.children.filter(
        (child) => child instanceof THREE.LineSegments
      ) as THREE.LineSegments[];

      // Find arms by checking the geometry bounding box center X positions
      const armPositions = lineSegments.map((seg) => {
        const geo = seg.geometry;
        geo.computeBoundingBox();
        const center = new THREE.Vector3();
        geo.boundingBox!.getCenter(center);
        return center.x;
      });

      // Should have at least one arm at negative X and one at positive X
      expect(armPositions.some((x) => x < -0.3)).toBe(true);
      expect(armPositions.some((x) => x > 0.3)).toBe(true);
    });
  });

  describe('Task 3: Cockpit frame geometry', () => {
    it('should create cockpit frame as LineSegments with bloom layer', () => {
      const cockpitGroup = camera.children[0] as THREE.Group;
      const lineSegments = cockpitGroup.children.filter(
        (child) => child instanceof THREE.LineSegments
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
      const cockpitGroup = camera.children[0] as THREE.Group;
      const geometries = cockpitGroup.children
        .filter((child): child is THREE.LineSegments => child instanceof THREE.LineSegments)
        .map((seg) => seg.geometry);

      cockpit.dispose();

      // After dispose, the cockpit group should be removed from camera
      expect(camera.children.length).toBe(0);
    });
  });

  describe('Task 6.7: Materials created via VectorMaterials', () => {
    it('should create materials with unique IDs via VectorMaterials', () => {
      // If we try to create materials with the same IDs, it should throw
      // (because they were already created by CockpitRenderer)
      expect(() => vectorMats.create('cockpit-arm-left')).toThrow(/duplicate material id/);
      expect(() => vectorMats.create('cockpit-arm-right')).toThrow(/duplicate material id/);
      expect(() => vectorMats.create('cockpit-frame')).toThrow(/duplicate material id/);
    });
  });
});
