/**
 * PaletteTransition tests -- Animated HSL palette interpolation.
 *
 * Validates:
 * - Construction with VectorMaterials and optional SceneEnvironment
 * - start() activates transition with from/to palettes
 * - update() interpolates HSL values per frame
 * - Midpoint HSL values are halfway between from and to palettes
 * - Transition finalizes: calls setPalette(target), isActive becomes false
 * - SceneEnvironment.updatePaletteHSL() called each frame when provided
 * - No-op when update() called while not active
 *
 * Created by: Story 5-5
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VectorMaterials } from '../rendering/VectorMaterials.ts';
import { PaletteTransition } from '../rendering/PaletteTransition.ts';
import { PALETTES, setActivePalette } from '../rendering/ColorPalette.ts';
import { PALETTE_TRANSITION_DURATION } from '../config/constants.ts';

// Minimal mock for SceneEnvironment
function createMockSceneEnvironment() {
  return {
    updatePaletteHSL: vi.fn(),
    updatePalette: vi.fn(),
  };
}

describe('PaletteTransition', () => {
  let vm: VectorMaterials;
  let pt: PaletteTransition;

  beforeEach(() => {
    setActivePalette('green');
    vm = new VectorMaterials();
  });

  describe('construction', () => {
    it('should store VectorMaterials reference', () => {
      pt = new PaletteTransition(vm);
      expect(pt).toBeDefined();
      expect(pt.isActive()).toBe(false);
    });

    it('should accept optional SceneEnvironment', () => {
      const mockScene = createMockSceneEnvironment();
      pt = new PaletteTransition(vm, mockScene as any);
      expect(pt).toBeDefined();
    });
  });

  describe('start()', () => {
    it('should set active state and store from/to palettes', () => {
      pt = new PaletteTransition(vm);
      expect(pt.isActive()).toBe(false);
      pt.start('green', 'amber', 2.0);
      expect(pt.isActive()).toBe(true);
    });
  });

  describe('update()', () => {
    it('should advance progress with dt and call setPaletteHSL with interpolated values', () => {
      pt = new PaletteTransition(vm);
      const mat = vm.create('test-transition');
      pt.start('green', 'amber', 2.0);

      const setPaletteHSLSpy = vi.spyOn(vm, 'setPaletteHSL');

      // Update with 0.5s => 25% progress
      pt.update(0.5);

      expect(setPaletteHSLSpy).toHaveBeenCalledOnce();
      const [h, s, l] = setPaletteHSLSpy.mock.calls[0];
      const expectedHue = PALETTES.green.hue + (PALETTES.amber.hue - PALETTES.green.hue) * 0.25;
      expect(h).toBeCloseTo(expectedHue, 4);
      expect(s).toBeCloseTo(1.0, 4);
      expect(l).toBeCloseTo(0.5, 4);
    });

    it('should produce midpoint HSL values at halfway through duration', () => {
      pt = new PaletteTransition(vm);
      vm.create('test-mid');
      pt.start('green', 'amber', 2.0);

      const setPaletteHSLSpy = vi.spyOn(vm, 'setPaletteHSL');

      // Update to exactly halfway
      pt.update(1.0);

      const [h, s, l] = setPaletteHSLSpy.mock.calls[0];
      const midHue = (PALETTES.green.hue + PALETTES.amber.hue) / 2;
      expect(h).toBeCloseTo(midHue, 4);
    });

    it('should call setPalette(target) when progress reaches 1.0 and deactivate', () => {
      pt = new PaletteTransition(vm);
      vm.create('test-finalize');
      pt.start('green', 'amber', 2.0);

      const setPaletteSpy = vi.spyOn(vm, 'setPalette');

      // Update past the full duration
      pt.update(2.5);

      expect(setPaletteSpy).toHaveBeenCalledWith('amber');
      expect(pt.isActive()).toBe(false);
    });

    it('should call sceneEnvironment.updatePaletteHSL() each frame when provided', () => {
      const mockScene = createMockSceneEnvironment();
      pt = new PaletteTransition(vm, mockScene as any);
      pt.start('green', 'red', 1.0);

      pt.update(0.5);

      expect(mockScene.updatePaletteHSL).toHaveBeenCalledOnce();
      const [h, s, l] = mockScene.updatePaletteHSL.mock.calls[0];
      // At 50% from green (0.33) to red (0.0)
      const expectedHue = PALETTES.green.hue + (PALETTES.red.hue - PALETTES.green.hue) * 0.5;
      expect(h).toBeCloseTo(expectedHue, 4);
    });

    it('should call sceneEnvironment.updatePalette() on finalization', () => {
      const mockScene = createMockSceneEnvironment();
      pt = new PaletteTransition(vm, mockScene as any);
      pt.start('amber', 'red', 1.0);

      pt.update(1.5);

      expect(mockScene.updatePalette).toHaveBeenCalledOnce();
    });

    it('should do nothing when update() called while not active', () => {
      pt = new PaletteTransition(vm);
      vm.create('test-noop');

      const setPaletteHSLSpy = vi.spyOn(vm, 'setPaletteHSL');

      pt.update(0.5);

      expect(setPaletteHSLSpy).not.toHaveBeenCalled();
      expect(pt.isActive()).toBe(false);
    });

    it('should handle amber to red transition correctly', () => {
      pt = new PaletteTransition(vm);
      vm.create('test-amber-red');
      pt.start('amber', 'red', 1.0);

      const setPaletteHSLSpy = vi.spyOn(vm, 'setPaletteHSL');

      // At 100% progress
      pt.update(1.0);

      const [h] = setPaletteHSLSpy.mock.calls[0];
      expect(h).toBeCloseTo(PALETTES.red.hue, 4);
    });

    it('should clamp progress to 1.0 when dt exceeds remaining duration', () => {
      pt = new PaletteTransition(vm);
      vm.create('test-clamp');
      pt.start('green', 'amber', 1.0);

      const setPaletteSpy = vi.spyOn(vm, 'setPalette');
      const setPaletteHSLSpy = vi.spyOn(vm, 'setPaletteHSL');

      // Way past the end
      pt.update(5.0);

      // Should have finalized to amber
      expect(setPaletteSpy).toHaveBeenCalledWith('amber');
      expect(pt.isActive()).toBe(false);

      // The interpolated values at progress=1.0 should be exactly the target
      const [h] = setPaletteHSLSpy.mock.calls[0];
      expect(h).toBeCloseTo(PALETTES.amber.hue, 4);
    });

    it('should support multiple sequential update calls accumulating elapsed time', () => {
      pt = new PaletteTransition(vm);
      vm.create('test-multi');
      pt.start('green', 'amber', 2.0);

      const setPaletteHSLSpy = vi.spyOn(vm, 'setPaletteHSL');

      // Three updates: 0.5 + 0.5 + 0.5 = 1.5s (75% of 2.0s)
      pt.update(0.5);
      pt.update(0.5);
      pt.update(0.5);

      expect(setPaletteHSLSpy).toHaveBeenCalledTimes(3);
      const lastCall = setPaletteHSLSpy.mock.calls[2];
      const expectedHue = PALETTES.green.hue + (PALETTES.amber.hue - PALETTES.green.hue) * 0.75;
      expect(lastCall[0]).toBeCloseTo(expectedHue, 4);
    });
  });

  describe('constants', () => {
    it('should have PALETTE_TRANSITION_DURATION equal to 2.0', () => {
      expect(PALETTE_TRANSITION_DURATION).toBe(2.0);
    });
  });
});
