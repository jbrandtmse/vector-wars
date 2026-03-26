import { describe, it, expect } from 'vitest';
import { RENDERING_CONFIG } from '../config/rendering.ts';

describe('RENDERING_CONFIG', () => {
  it('should have toneMapping set to ACESFilmic', () => {
    expect(RENDERING_CONFIG.toneMapping).toBe('ACESFilmic');
  });

  it('should have toneMappingExposure set to 1.0', () => {
    expect(RENDERING_CONFIG.toneMappingExposure).toBe(1.0);
  });

  describe('bloom config', () => {
    it('should have bloom configuration object', () => {
      expect(RENDERING_CONFIG.bloom).toBeDefined();
    });

    it('should have bloom strength as a positive number', () => {
      expect(RENDERING_CONFIG.bloom.strength).toBeGreaterThan(0);
      expect(typeof RENDERING_CONFIG.bloom.strength).toBe('number');
    });

    it('should have bloom radius as a positive number', () => {
      expect(RENDERING_CONFIG.bloom.radius).toBeGreaterThan(0);
      expect(typeof RENDERING_CONFIG.bloom.radius).toBe('number');
    });

    it('should have bloom threshold as a number >= 0', () => {
      expect(RENDERING_CONFIG.bloom.threshold).toBeGreaterThanOrEqual(0);
      expect(typeof RENDERING_CONFIG.bloom.threshold).toBe('number');
    });

    it('should have bloom strength in phosphor glow range (0.4-0.8)', () => {
      expect(RENDERING_CONFIG.bloom.strength).toBeGreaterThanOrEqual(0.4);
      expect(RENDERING_CONFIG.bloom.strength).toBeLessThanOrEqual(0.8);
    });

    it('should have bloom radius in phosphor spread range (1.2-1.8)', () => {
      expect(RENDERING_CONFIG.bloom.radius).toBeGreaterThanOrEqual(1.2);
      expect(RENDERING_CONFIG.bloom.radius).toBeLessThanOrEqual(1.8);
    });
  });

  it('should have fxaa flag', () => {
    expect(RENDERING_CONFIG.fxaa).toBe(true);
  });
});
