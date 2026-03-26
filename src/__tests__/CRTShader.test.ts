import { describe, it, expect } from 'vitest';
import { CRTShader } from '../rendering/shaders/CRTShader.ts';

describe('CRTShader', () => {
  it('should export a valid shader definition object with uniforms, vertexShader, fragmentShader', () => {
    expect(CRTShader).toBeDefined();
    expect(CRTShader.uniforms).toBeDefined();
    expect(CRTShader.vertexShader).toBeDefined();
    expect(CRTShader.fragmentShader).toBeDefined();
  });

  it('should have all required uniforms', () => {
    const uniformNames = Object.keys(CRTShader.uniforms);
    expect(uniformNames).toContain('tDiffuse');
    expect(uniformNames).toContain('scanlineIntensity');
    expect(uniformNames).toContain('scanlineCount');
    expect(uniformNames).toContain('chromaticAberration');
    expect(uniformNames).toContain('vignetteIntensity');
    expect(uniformNames).toContain('enabled');
  });

  it('should have correct default uniform value types', () => {
    expect(CRTShader.uniforms.tDiffuse.value).toBeNull();
    expect(typeof CRTShader.uniforms.scanlineIntensity.value).toBe('number');
    expect(typeof CRTShader.uniforms.scanlineCount.value).toBe('number');
    expect(typeof CRTShader.uniforms.chromaticAberration.value).toBe('number');
    expect(typeof CRTShader.uniforms.vignetteIntensity.value).toBe('number');
    expect(typeof CRTShader.uniforms.enabled.value).toBe('number');
  });

  it('should have non-empty vertexShader string', () => {
    expect(typeof CRTShader.vertexShader).toBe('string');
    expect(CRTShader.vertexShader.length).toBeGreaterThan(0);
  });

  it('should have non-empty fragmentShader string', () => {
    expect(typeof CRTShader.fragmentShader).toBe('string');
    expect(CRTShader.fragmentShader.length).toBeGreaterThan(0);
  });

  it('should reference tDiffuse sampler in fragmentShader', () => {
    expect(CRTShader.fragmentShader).toContain('tDiffuse');
  });

  it('should reference scanlineIntensity uniform in fragmentShader', () => {
    expect(CRTShader.fragmentShader).toContain('scanlineIntensity');
  });

  it('should reference chromaticAberration uniform in fragmentShader', () => {
    expect(CRTShader.fragmentShader).toContain('chromaticAberration');
  });

  it('should reference vignetteIntensity uniform in fragmentShader', () => {
    expect(CRTShader.fragmentShader).toContain('vignetteIntensity');
  });
});
