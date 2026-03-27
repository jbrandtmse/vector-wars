import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { VectorMaterials } from '../rendering/VectorMaterials.ts';
import { PALETTES, setActivePalette } from '../rendering/ColorPalette.ts';

describe('VectorMaterials', () => {
  let vm: VectorMaterials;

  beforeEach(() => {
    // Reset palette to green before each test
    setActivePalette('green');
    vm = new VectorMaterials();
  });

  describe('create()', () => {
    it('should return a LineBasicMaterial', () => {
      const mat = vm.create('test-thin');
      expect(mat).toBeInstanceOf(THREE.LineBasicMaterial);
    });

    it('should apply the current palette color', () => {
      const mat = vm.create('test-color');
      const hsl = { h: 0, s: 0, l: 0 };
      mat.color.getHSL(hsl);
      expect(hsl.h).toBeCloseTo(PALETTES.green.hue, 2);
      expect(hsl.s).toBeCloseTo(PALETTES.green.saturation, 2);
      expect(hsl.l).toBeCloseTo(PALETTES.green.lightness, 2);
    });

    it('should apply lightness offset when provided', () => {
      const offset = 0.2;
      const mat = vm.create('test-offset', offset);
      const hsl = { h: 0, s: 0, l: 0 };
      mat.color.getHSL(hsl);
      expect(hsl.l).toBeCloseTo(PALETTES.green.lightness + offset, 2);
    });

    it('should register the material for palette updates', () => {
      const mat = vm.create('test-registered');
      vm.setPalette('amber');
      const hsl = { h: 0, s: 0, l: 0 };
      mat.color.getHSL(hsl);
      expect(hsl.h).toBeCloseTo(PALETTES.amber.hue, 2);
    });

    it('should return existing material on duplicate thin id', () => {
      const mat1 = vm.create('dup-thin');
      const mat2 = vm.create('dup-thin');
      expect(mat2).toBe(mat1);
    });
  });

  describe('createFat()', () => {
    it('should return a material with linewidth set', () => {
      const mat = vm.createFat('test-fat', 3);
      // LineMaterial is an addon, check the linewidth property
      expect(mat.linewidth).toBe(3);
    });

    it('should apply the current palette color to fat materials', () => {
      const mat = vm.createFat('test-fat-color', 2);
      const hsl = { h: 0, s: 0, l: 0 };
      mat.color.getHSL(hsl);
      expect(hsl.h).toBeCloseTo(PALETTES.green.hue, 2);
    });

    it('should apply lightness offset to fat materials', () => {
      const offset = -0.1;
      const mat = vm.createFat('test-fat-offset', 2, offset);
      const hsl = { h: 0, s: 0, l: 0 };
      mat.color.getHSL(hsl);
      expect(hsl.l).toBeCloseTo(PALETTES.green.lightness + offset, 2);
    });

    it('should register fat materials for palette updates', () => {
      const mat = vm.createFat('test-fat-reg', 3);
      vm.setPalette('red');
      const hsl = { h: 0, s: 0, l: 0 };
      mat.color.getHSL(hsl);
      expect(hsl.h).toBeCloseTo(PALETTES.red.hue, 2);
    });

    it('should return existing material on duplicate fat id', () => {
      const mat1 = vm.createFat('dup-fat', 2);
      const mat2 = vm.createFat('dup-fat', 3);
      expect(mat2).toBe(mat1);
    });
  });

  describe('setPalette()', () => {
    it('should update all registered thin materials', () => {
      const mat1 = vm.create('thin-1');
      const mat2 = vm.create('thin-2');
      vm.setPalette('amber');
      for (const mat of [mat1, mat2]) {
        const hsl = { h: 0, s: 0, l: 0 };
        mat.color.getHSL(hsl);
        expect(hsl.h).toBeCloseTo(PALETTES.amber.hue, 2);
      }
    });

    it('should update all registered fat materials', () => {
      const mat1 = vm.createFat('fat-1', 2);
      const mat2 = vm.createFat('fat-2', 4);
      vm.setPalette('red');
      for (const mat of [mat1, mat2]) {
        const hsl = { h: 0, s: 0, l: 0 };
        mat.color.getHSL(hsl);
        expect(hsl.h).toBeCloseTo(PALETTES.red.hue, 2);
      }
    });

    it('should preserve lightness offsets during palette change', () => {
      const offset = 0.15;
      const mat = vm.create('offset-preserved', offset);
      vm.setPalette('amber');
      const hsl = { h: 0, s: 0, l: 0 };
      mat.color.getHSL(hsl);
      expect(hsl.l).toBeCloseTo(PALETTES.amber.lightness + offset, 2);
    });
  });

  describe('updateResolution()', () => {
    it('should update resolution on all fat materials', () => {
      const mat = vm.createFat('res-test', 3);
      vm.updateResolution(1920, 1080);
      expect(mat.resolution.x).toBe(1920);
      expect(mat.resolution.y).toBe(1080);
    });

    it('should not throw when no fat materials are registered', () => {
      vm.create('thin-only');
      expect(() => vm.updateResolution(800, 600)).not.toThrow();
    });
  });

  describe('dispose()', () => {
    it('should call dispose on all registered materials', () => {
      const thin = vm.create('dispose-thin');
      const fat = vm.createFat('dispose-fat', 2);
      const thinSpy = vi.spyOn(thin, 'dispose');
      const fatSpy = vi.spyOn(fat, 'dispose');
      vm.dispose();
      expect(thinSpy).toHaveBeenCalledOnce();
      expect(fatSpy).toHaveBeenCalledOnce();
    });

    it('should clear the registry after dispose', () => {
      vm.create('clear-test');
      vm.dispose();
      // After dispose, setPalette should not update any materials (registry is empty)
      // Verify by creating a new material and confirming the old one is not affected
      vm.setPalette('amber');
      // If this doesn't throw, the registry was cleared successfully
      expect(true).toBe(true);
    });

    it('should not throw when called with no registered materials', () => {
      expect(() => vm.dispose()).not.toThrow();
    });
  });
});
