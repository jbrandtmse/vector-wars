import { describe, it, expect } from 'vitest';

/**
 * RenderPipeline tests.
 *
 * The RenderPipeline relies on WebGL context for EffectComposer/UnrealBloomPass
 * which are unavailable in Node.js test environment. We test the module's
 * structural requirements: exports, constructor signature, method existence.
 *
 * Visual correctness (bloom appearance, selective rendering) is verified
 * via manual inspection in the browser.
 */
describe('RenderPipeline', () => {
  it('should export RenderPipeline class', async () => {
    const mod = await import('../rendering/RenderPipeline.ts');
    expect(mod.RenderPipeline).toBeDefined();
    expect(typeof mod.RenderPipeline).toBe('function');
  });

  it('should export BLOOM_LAYER constant re-export or use from constants', async () => {
    const constants = await import('../config/constants.ts');
    expect(constants.BLOOM_LAYER).toBe(1);
  });

  it('should have setCRTEnabled method on prototype', async () => {
    const mod = await import('../rendering/RenderPipeline.ts');
    expect(typeof mod.RenderPipeline.prototype.setCRTEnabled).toBe('function');
  });

  it('should have setCRTIntensity method on prototype', async () => {
    const mod = await import('../rendering/RenderPipeline.ts');
    expect(typeof mod.RenderPipeline.prototype.setCRTIntensity).toBe('function');
  });

  it('should have render method on prototype', async () => {
    const mod = await import('../rendering/RenderPipeline.ts');
    expect(typeof mod.RenderPipeline.prototype.render).toBe('function');
  });

  it('should have resize method on prototype', async () => {
    const mod = await import('../rendering/RenderPipeline.ts');
    expect(typeof mod.RenderPipeline.prototype.resize).toBe('function');
  });

  it('should have triggerDamageFlash method on prototype', async () => {
    const mod = await import('../rendering/RenderPipeline.ts');
    expect(typeof mod.RenderPipeline.prototype.triggerDamageFlash).toBe('function');
  });

  it('should have updateDamageFlash method on prototype', async () => {
    const mod = await import('../rendering/RenderPipeline.ts');
    expect(typeof mod.RenderPipeline.prototype.updateDamageFlash).toBe('function');
  });

  it('should have setTransitionProgress method on prototype', async () => {
    const mod = await import('../rendering/RenderPipeline.ts');
    expect(typeof mod.RenderPipeline.prototype.setTransitionProgress).toBe('function');
  });

  it('should have getTransitionProgress method on prototype', async () => {
    const mod = await import('../rendering/RenderPipeline.ts');
    expect(typeof mod.RenderPipeline.prototype.getTransitionProgress).toBe('function');
  });
});

describe('RenderPipeline bloom half-resolution (Story 6-4)', () => {
  it('bloom composer should be created at half resolution', async () => {
    // Read the source to verify the half-resolution pattern is present
    // Since we cannot instantiate RenderPipeline without WebGL,
    // we verify the source code contains the half-resolution logic
    const sourceModule = await import('../rendering/RenderPipeline.ts?raw');
    const source = sourceModule.default as string;
    expect(source).toContain('Math.floor(width / 2)');
    expect(source).toContain('Math.floor(height / 2)');
    // Verify bloom render target creation at half resolution
    expect(source).toContain('bloomWidth');
    expect(source).toContain('bloomHeight');
    expect(source).toContain('WebGLRenderTarget');
  });

  it('resize updates bloom composer at half resolution', async () => {
    const sourceModule = await import('../rendering/RenderPipeline.ts?raw');
    const source = sourceModule.default as string;
    // The resize method should use half dimensions for bloom composer
    // Look for the pattern in the resize method
    expect(source).toContain('this.bloomComposer.setSize(Math.max(1, Math.floor(width / 2))');
  });
});
