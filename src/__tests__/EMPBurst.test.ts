import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { EMPBurst } from '../entities/projectiles/EMPBurst.ts';
import { VectorMaterials } from '../rendering/VectorMaterials.ts';
import { setActivePalette } from '../rendering/ColorPalette.ts';
import {
  BLOOM_LAYER,
  EMP_BURST_RADIUS,
  EMP_BURST_VISUAL_DURATION,
} from '../config/constants.ts';

describe('EMPBurst Visual Effect', () => {
  let vectorMaterials: VectorMaterials;
  let burst: EMPBurst;

  beforeEach(() => {
    setActivePalette('green');
    vectorMaterials = new VectorMaterials();
    burst = new EMPBurst(vectorMaterials, 0);
  });

  describe('Construction', () => {
    it('should create a mesh with LineSegments geometry', () => {
      expect(burst.mesh).toBeInstanceOf(THREE.LineSegments);
    });

    it('should enable bloom layer on the mesh', () => {
      const bloomTest = new THREE.Layers();
      bloomTest.set(BLOOM_LAYER);
      expect(burst.mesh.layers.test(bloomTest)).toBe(true);
    });

    it('should start invisible', () => {
      expect(burst.mesh.visible).toBe(false);
    });

    it('should start inactive', () => {
      expect(burst.active).toBe(false);
    });
  });

  describe('Activate/Deactivate', () => {
    it('should become visible and active when activated', () => {
      const pos = new THREE.Vector3(5, 10, 15);
      burst.activate(pos);
      expect(burst.active).toBe(true);
      expect(burst.mesh.visible).toBe(true);
    });

    it('should copy position to mesh on activation', () => {
      const pos = new THREE.Vector3(5, 10, 15);
      burst.activate(pos);
      expect(burst.mesh.position.x).toBeCloseTo(5);
      expect(burst.mesh.position.y).toBeCloseTo(10);
      expect(burst.mesh.position.z).toBeCloseTo(15);
    });

    it('should reset scale to 0.5 on activation', () => {
      burst.activate(new THREE.Vector3());
      expect(burst.mesh.scale.x).toBeCloseTo(0.5);
    });

    it('should reset opacity to 1.0 on activation', () => {
      burst.activate(new THREE.Vector3());
      const material = burst.mesh.material as THREE.LineBasicMaterial;
      expect(material.opacity).toBeCloseTo(1.0);
    });

    it('should become invisible and inactive when deactivated', () => {
      burst.activate(new THREE.Vector3());
      burst.deactivate();
      expect(burst.active).toBe(false);
      expect(burst.mesh.visible).toBe(false);
    });
  });

  describe('Expansion animation', () => {
    it('should increase scale over time', () => {
      burst.activate(new THREE.Vector3());
      const initialScale = burst.mesh.scale.x;
      burst.update(EMP_BURST_VISUAL_DURATION / 2);
      expect(burst.mesh.scale.x).toBeGreaterThan(initialScale);
    });

    it('should reach approximately EMP_BURST_RADIUS at full duration', () => {
      burst.activate(new THREE.Vector3());
      // Update to just before full duration
      burst.update(EMP_BURST_VISUAL_DURATION * 0.99);
      // Scale should be close to EMP_BURST_RADIUS
      expect(burst.mesh.scale.x).toBeGreaterThan(EMP_BURST_RADIUS * 0.8);
    });
  });

  describe('Opacity fade', () => {
    it('should decrease opacity over time', () => {
      burst.activate(new THREE.Vector3());
      burst.update(EMP_BURST_VISUAL_DURATION / 2);
      const material = burst.mesh.material as THREE.LineBasicMaterial;
      expect(material.opacity).toBeLessThan(1.0);
      expect(material.opacity).toBeGreaterThan(0);
    });
  });

  describe('Auto-deactivation', () => {
    it('should deactivate when visual duration exceeded', () => {
      burst.activate(new THREE.Vector3());
      burst.update(EMP_BURST_VISUAL_DURATION + 0.01);
      expect(burst.active).toBe(false);
      expect(burst.mesh.visible).toBe(false);
    });
  });
});
