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
});
