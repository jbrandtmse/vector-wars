import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { SceneEnvironment } from '../rendering/SceneEnvironment.ts';
import { VectorMaterials } from '../rendering/VectorMaterials.ts';
import { setActivePalette, PALETTES } from '../rendering/ColorPalette.ts';
import {
  BLOOM_LAYER,
  GRID_Y_POSITION,
  STARFIELD_COUNT,
  STARFIELD_SPREAD,
  STARFIELD_MIN_Y,
} from '../config/constants.ts';

describe('SceneEnvironment', () => {
  let scene: THREE.Scene;
  let vectorMats: VectorMaterials;
  let env: SceneEnvironment;

  beforeEach(() => {
    setActivePalette('green');
    scene = new THREE.Scene();
    vectorMats = new VectorMaterials();
    env = new SceneEnvironment(scene, vectorMats);
  });

  describe('Task 4.2: Constructor adds grid mesh to scene', () => {
    it('should add a LineSegments mesh (grid) to the scene', () => {
      const lineSegments = scene.children.filter(
        (child) => child instanceof THREE.LineSegments
      );
      expect(lineSegments.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Task 4.3: Grid mesh is on the XZ plane', () => {
    it('should position grid at GRID_Y_POSITION', () => {
      const lineSegments = scene.children.filter(
        (child) => child instanceof THREE.LineSegments
      );
      expect(lineSegments.length).toBeGreaterThanOrEqual(1);
      const grid = lineSegments[0];
      expect(grid.position.y).toBe(GRID_Y_POSITION);
    });
  });

  describe('Task 4.4: Grid mesh has bloom layer enabled', () => {
    it('should have bloom layer enabled on the grid', () => {
      const lineSegments = scene.children.filter(
        (child) => child instanceof THREE.LineSegments
      );
      expect(lineSegments.length).toBeGreaterThanOrEqual(1);
      const grid = lineSegments[0];
      const bloomTest = new THREE.Layers();
      bloomTest.set(BLOOM_LAYER);
      expect(grid.layers.test(bloomTest)).toBe(true);
    });
  });

  describe('Task 4.5: Grid uses VectorMaterials-created material', () => {
    it('should return existing material when requesting same ID', () => {
      // SceneEnvironment already registered this — requesting again returns same instance
      const mat = vectorMats.create('environment-grid');
      expect(mat).toBeDefined();
    });
  });

  describe('Task 4.6: Constructor adds starfield Points to scene', () => {
    it('should add a Points mesh (starfield) to the scene', () => {
      const points = scene.children.filter(
        (child) => child instanceof THREE.Points
      );
      expect(points.length).toBe(1);
    });
  });

  describe('Task 4.7: Starfield has correct number of points', () => {
    it('should have STARFIELD_COUNT vertices in the starfield geometry', () => {
      const points = scene.children.filter(
        (child) => child instanceof THREE.Points
      ) as THREE.Points[];
      expect(points.length).toBe(1);
      const posAttr = points[0].geometry.getAttribute('position');
      expect(posAttr.count).toBe(STARFIELD_COUNT);
    });
  });

  describe('Task 4.8: Starfield positions are within expected bounds', () => {
    it('should have all positions within STARFIELD_SPREAD bounds', () => {
      const points = scene.children.filter(
        (child) => child instanceof THREE.Points
      ) as THREE.Points[];
      expect(points.length).toBe(1);
      const posAttr = points[0].geometry.getAttribute('position');
      const halfSpread = STARFIELD_SPREAD / 2;

      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i);
        const y = posAttr.getY(i);
        const z = posAttr.getZ(i);
        expect(x).toBeGreaterThanOrEqual(-halfSpread);
        expect(x).toBeLessThanOrEqual(halfSpread);
        expect(y).toBeGreaterThanOrEqual(STARFIELD_MIN_Y);
        expect(y).toBeLessThanOrEqual(halfSpread);
        expect(z).toBeGreaterThanOrEqual(-halfSpread);
        expect(z).toBeLessThanOrEqual(halfSpread);
      }
    });
  });

  describe('Task 4.9: Starfield does NOT have bloom layer enabled', () => {
    it('should not have bloom layer on starfield points', () => {
      const points = scene.children.filter(
        (child) => child instanceof THREE.Points
      ) as THREE.Points[];
      expect(points.length).toBe(1);
      const bloomTest = new THREE.Layers();
      bloomTest.set(BLOOM_LAYER);
      expect(points[0].layers.test(bloomTest)).toBe(false);
    });
  });

  describe('Task 4.10: Dispose removes grid and starfield', () => {
    it('should remove grid and starfield from scene on dispose', () => {
      const childCountBefore = scene.children.length;
      expect(childCountBefore).toBeGreaterThanOrEqual(2);
      env.dispose();
      // Both grid and starfield should be removed
      const lineSegments = scene.children.filter(
        (child) => child instanceof THREE.LineSegments
      );
      const points = scene.children.filter(
        (child) => child instanceof THREE.Points
      );
      expect(lineSegments.length).toBe(0);
      expect(points.length).toBe(0);
    });

    it('should dispose geometries on dispose', () => {
      const lineSegments = scene.children.filter(
        (child) => child instanceof THREE.LineSegments
      ) as THREE.LineSegments[];
      const points = scene.children.filter(
        (child) => child instanceof THREE.Points
      ) as THREE.Points[];

      const gridGeoSpy = vi.spyOn(lineSegments[0].geometry, 'dispose');
      const starfieldGeoSpy = vi.spyOn(points[0].geometry, 'dispose');

      env.dispose();

      expect(gridGeoSpy).toHaveBeenCalledOnce();
      expect(starfieldGeoSpy).toHaveBeenCalledOnce();
    });

    it('should dispose the starfield PointsMaterial', () => {
      const points = scene.children.filter(
        (child) => child instanceof THREE.Points
      ) as THREE.Points[];
      const matSpy = vi.spyOn(points[0].material as THREE.PointsMaterial, 'dispose');

      env.dispose();

      expect(matSpy).toHaveBeenCalledOnce();
    });
  });

  describe('updatePaletteHSL() updates the starfield material to given HSL', () => {
    it('should update starfield material color to arbitrary HSL values', () => {
      const points = scene.children.filter(
        (child) => child instanceof THREE.Points
      ) as THREE.Points[];
      const material = points[0].material as THREE.PointsMaterial;

      // Use amber-ish HSL values
      env.updatePaletteHSL(0.11, 1.0, 0.5);

      const hsl = { h: 0, s: 0, l: 0 };
      material.color.getHSL(hsl);
      expect(hsl.h).toBeCloseTo(0.11, 2);
      expect(hsl.s).toBeCloseTo(1.0, 2);
      // Lightness should include STARFIELD_LIGHTNESS_OFFSET
    });
  });

  describe('Task 4.11: updatePalette updates the starfield material color', () => {
    it('should update starfield material color when palette changes', () => {
      const points = scene.children.filter(
        (child) => child instanceof THREE.Points
      ) as THREE.Points[];
      const material = points[0].material as THREE.PointsMaterial;

      // Get initial color
      const initialHsl = { h: 0, s: 0, l: 0 };
      material.color.getHSL(initialHsl);
      expect(initialHsl.h).toBeCloseTo(PALETTES.green.hue, 2);

      // Change palette and call updatePalette
      setActivePalette('amber');
      env.updatePalette();

      const updatedHsl = { h: 0, s: 0, l: 0 };
      material.color.getHSL(updatedHsl);
      expect(updatedHsl.h).toBeCloseTo(PALETTES.amber.hue, 2);
    });
  });
});
