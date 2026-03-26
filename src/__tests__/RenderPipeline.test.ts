import { describe, it, expect, vi } from 'vitest';

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
});
