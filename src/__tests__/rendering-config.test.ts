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

  describe('crt config', () => {
    it('should have crt configuration object', () => {
      expect(RENDERING_CONFIG.crt).toBeDefined();
      expect(typeof RENDERING_CONFIG.crt).toBe('object');
    });

    it('should have crt.enabled as a boolean', () => {
      expect(typeof RENDERING_CONFIG.crt.enabled).toBe('boolean');
    });

    it('should have crt.scanlineIntensity as a number in range [0, 1]', () => {
      expect(typeof RENDERING_CONFIG.crt.scanlineIntensity).toBe('number');
      expect(RENDERING_CONFIG.crt.scanlineIntensity).toBeGreaterThanOrEqual(0);
      expect(RENDERING_CONFIG.crt.scanlineIntensity).toBeLessThanOrEqual(1);
    });

    it('should have crt.scanlineCount as a positive number', () => {
      expect(typeof RENDERING_CONFIG.crt.scanlineCount).toBe('number');
      expect(RENDERING_CONFIG.crt.scanlineCount).toBeGreaterThan(0);
    });

    it('should have crt.chromaticAberration as a number in range [0, 0.01]', () => {
      expect(typeof RENDERING_CONFIG.crt.chromaticAberration).toBe('number');
      expect(RENDERING_CONFIG.crt.chromaticAberration).toBeGreaterThanOrEqual(0);
      expect(RENDERING_CONFIG.crt.chromaticAberration).toBeLessThanOrEqual(0.01);
    });

    it('should have crt.vignetteIntensity as a number in range [0, 1]', () => {
      expect(typeof RENDERING_CONFIG.crt.vignetteIntensity).toBe('number');
      expect(RENDERING_CONFIG.crt.vignetteIntensity).toBeGreaterThanOrEqual(0);
      expect(RENDERING_CONFIG.crt.vignetteIntensity).toBeLessThanOrEqual(1);
    });
  });
});
