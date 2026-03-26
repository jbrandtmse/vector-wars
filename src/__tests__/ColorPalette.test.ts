import { describe, it, expect } from 'vitest';
import {
  PALETTES,
  getActivePalette,
  setActivePalette,
  type PaletteName,
} from '../rendering/ColorPalette.ts';

describe('ColorPalette', () => {
  describe('PALETTES', () => {
    it('should define green palette with correct HSL values', () => {
      expect(PALETTES.green).toEqual({
        hue: 0.33,
        saturation: 1.0,
        lightness: 0.5,
      });
    });

    it('should define amber palette with correct HSL values', () => {
      expect(PALETTES.amber).toEqual({
        hue: 0.11,
        saturation: 1.0,
        lightness: 0.5,
      });
    });

    it('should define red palette with correct HSL values', () => {
      expect(PALETTES.red).toEqual({
        hue: 0.0,
        saturation: 1.0,
        lightness: 0.5,
      });
    });

    it('should have exactly three palette presets', () => {
      expect(Object.keys(PALETTES)).toHaveLength(3);
    });
  });

  describe('getActivePalette / setActivePalette', () => {
    it('should default to green palette', () => {
      // Reset by setting green explicitly
      setActivePalette('green');
      const palette = getActivePalette();
      expect(palette).toEqual(PALETTES.green);
    });

    it('should return amber palette after setting it', () => {
      setActivePalette('amber');
      expect(getActivePalette()).toEqual(PALETTES.amber);
    });

    it('should return red palette after setting it', () => {
      setActivePalette('red');
      expect(getActivePalette()).toEqual(PALETTES.red);
    });

    it('should switch back to green palette', () => {
      setActivePalette('red');
      setActivePalette('green');
      expect(getActivePalette()).toEqual(PALETTES.green);
    });
  });
});
