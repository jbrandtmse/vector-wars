import { describe, it, expect } from 'vitest';
import { PhaseTransitionShader } from '../rendering/shaders/PhaseTransitionShader.ts';

describe('PhaseTransitionShader (Story 3-10)', () => {
  it('is exported from src/rendering/shaders/PhaseTransitionShader.ts', () => {
    expect(PhaseTransitionShader).toBeDefined();
  });

  it('has name "PhaseTransitionShader"', () => {
    expect(PhaseTransitionShader.name).toBe('PhaseTransitionShader');
  });

  it('has uniforms property', () => {
    expect(PhaseTransitionShader.uniforms).toBeDefined();
  });

  it('has tDiffuse uniform', () => {
    expect(PhaseTransitionShader.uniforms.tDiffuse).toBeDefined();
  });

  it('has transitionProgress uniform', () => {
    expect(PhaseTransitionShader.uniforms.transitionProgress).toBeDefined();
  });

  it('transitionProgress initial value is 0.0', () => {
    expect(PhaseTransitionShader.uniforms.transitionProgress.value).toBe(0.0);
  });

  it('has vertexShader string', () => {
    expect(typeof PhaseTransitionShader.vertexShader).toBe('string');
  });

  it('has fragmentShader string', () => {
    expect(typeof PhaseTransitionShader.fragmentShader).toBe('string');
  });

  it('fragmentShader contains transitionProgress', () => {
    expect(PhaseTransitionShader.fragmentShader).toContain('transitionProgress');
  });

  it('fragmentShader contains tDiffuse', () => {
    expect(PhaseTransitionShader.fragmentShader).toContain('tDiffuse');
  });

  it('fragmentShader mixes with black (vec3(0.0))', () => {
    expect(PhaseTransitionShader.fragmentShader).toContain('vec3(0.0)');
  });
});
