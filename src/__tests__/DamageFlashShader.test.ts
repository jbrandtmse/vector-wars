import { describe, it, expect } from 'vitest';
import { DamageFlashShader } from '../rendering/shaders/DamageFlashShader.ts';

describe('DamageFlashShader (Story 2-7)', () => {
  it('is exported from src/rendering/shaders/DamageFlashShader.ts', () => {
    expect(DamageFlashShader).toBeDefined();
  });

  it('has uniforms property', () => {
    expect(DamageFlashShader.uniforms).toBeDefined();
  });

  it('has tDiffuse uniform', () => {
    expect(DamageFlashShader.uniforms.tDiffuse).toBeDefined();
  });

  it('has damageIntensity uniform', () => {
    expect(DamageFlashShader.uniforms.damageIntensity).toBeDefined();
  });

  it('has damageColor uniform', () => {
    expect(DamageFlashShader.uniforms.damageColor).toBeDefined();
  });

  it('damageIntensity initial value is 0.0', () => {
    expect(DamageFlashShader.uniforms.damageIntensity.value).toBe(0.0);
  });

  it('has vertexShader string', () => {
    expect(typeof DamageFlashShader.vertexShader).toBe('string');
  });

  it('has fragmentShader string', () => {
    expect(typeof DamageFlashShader.fragmentShader).toBe('string');
  });

  it('fragmentShader contains damageIntensity', () => {
    expect(DamageFlashShader.fragmentShader).toContain('damageIntensity');
  });

  it('fragmentShader contains tDiffuse', () => {
    expect(DamageFlashShader.fragmentShader).toContain('tDiffuse');
  });
});
