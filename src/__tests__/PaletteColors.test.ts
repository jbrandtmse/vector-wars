import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePalette } from '../rendering/ColorPalette.ts';
import {
  getPaletteHexColor,
  getPaletteHexForName,
  getPaletteCSSGlow,
  getPaletteCSSMultiGlow,
} from '../rendering/PaletteColors.ts';

describe('PaletteColors', () => {
  beforeEach(() => {
    setActivePalette('green');
  });

  describe('getPaletteHexColor()', () => {
    it('should return green hex when green palette is active', () => {
      setActivePalette('green');
      expect(getPaletteHexColor()).toBe('#00ff41');
    });

    it('should return amber hex when amber palette is active', () => {
      setActivePalette('amber');
      expect(getPaletteHexColor()).toBe('#ffb000');
    });

    it('should return red hex when red palette is active', () => {
      setActivePalette('red');
      expect(getPaletteHexColor()).toBe('#ff2020');
    });
  });

  describe('getPaletteHexForName()', () => {
    it('should return correct hex for green regardless of active palette', () => {
      setActivePalette('red');
      expect(getPaletteHexForName('green')).toBe('#00ff41');
    });

    it('should return correct hex for amber', () => {
      expect(getPaletteHexForName('amber')).toBe('#ffb000');
    });

    it('should return correct hex for red', () => {
      expect(getPaletteHexForName('red')).toBe('#ff2020');
    });
  });

  describe('getPaletteCSSGlow()', () => {
    it('should return glow string with default 10px radius for green', () => {
      setActivePalette('green');
      expect(getPaletteCSSGlow()).toBe('0 0 10px #00ff41');
    });

    it('should return glow string with custom radius for amber', () => {
      setActivePalette('amber');
      expect(getPaletteCSSGlow(20)).toBe('0 0 20px #ffb000');
    });
  });

  describe('getPaletteCSSMultiGlow()', () => {
    it('should return multi-glow string with default radii for green', () => {
      setActivePalette('green');
      expect(getPaletteCSSMultiGlow()).toBe('0 0 20px #00ff41, 0 0 40px #00ff41');
    });

    it('should return multi-glow string with custom radii for red', () => {
      setActivePalette('red');
      expect(getPaletteCSSMultiGlow([10, 30, 60])).toBe('0 0 10px #ff2020, 0 0 30px #ff2020, 0 0 60px #ff2020');
    });
  });
});
