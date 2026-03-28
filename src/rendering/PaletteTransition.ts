/**
 * PaletteTransition -- Animates smooth HSL interpolation between palette presets.
 *
 * When a new level starts, instead of snapping instantly to the new palette,
 * this class lerps hue/saturation/lightness over a configurable duration so
 * the color shift feels like descending deeper into cyberspace.
 *
 * Created by: Story 5-5
 */

import { PALETTES, type PaletteName } from './ColorPalette.ts';
import type { VectorMaterials } from './VectorMaterials.ts';
import type { SceneEnvironment } from './SceneEnvironment.ts';

export class PaletteTransition {
  private vectorMaterials: VectorMaterials;
  private sceneEnvironment: SceneEnvironment | null;

  private active = false;
  private elapsed = 0;
  private duration = 0;
  private targetName: PaletteName = 'green';

  // Pre-stored HSL values to avoid per-frame lookups
  private fromHue = 0;
  private fromSaturation = 0;
  private fromLightness = 0;
  private toHue = 0;
  private toSaturation = 0;
  private toLightness = 0;

  constructor(vectorMaterials: VectorMaterials, sceneEnvironment?: SceneEnvironment) {
    this.vectorMaterials = vectorMaterials;
    this.sceneEnvironment = sceneEnvironment ?? null;
  }

  /**
   * Begins an animated palette transition from one palette to another.
   * @param from Source palette name
   * @param to Target palette name
   * @param duration Transition duration in seconds
   */
  start(from: PaletteName, to: PaletteName, duration: number): void {
    const fromPalette = PALETTES[from];
    const toPalette = PALETTES[to];

    this.fromHue = fromPalette.hue;
    this.fromSaturation = fromPalette.saturation;
    this.fromLightness = fromPalette.lightness;
    this.toHue = toPalette.hue;
    this.toSaturation = toPalette.saturation;
    this.toLightness = toPalette.lightness;

    this.targetName = to;
    this.duration = duration;
    this.elapsed = 0;
    this.active = true;
  }

  /**
   * Advances the transition by dt seconds.
   * Interpolates HSL values and updates all materials each frame.
   * When complete, finalizes the discrete palette name.
   */
  update(dt: number): void {
    if (!this.active) return;

    this.elapsed += dt;
    const progress = Math.min(this.elapsed / this.duration, 1.0);

    // Linear interpolation of HSL components
    const hue = this.fromHue + (this.toHue - this.fromHue) * progress;
    const saturation = this.fromSaturation + (this.toSaturation - this.fromSaturation) * progress;
    const lightness = this.fromLightness + (this.toLightness - this.fromLightness) * progress;

    // Update all vector materials with interpolated values
    this.vectorMaterials.setPaletteHSL(hue, saturation, lightness);

    // Update starfield if scene environment is available
    if (this.sceneEnvironment) {
      this.sceneEnvironment.updatePaletteHSL(hue, saturation, lightness);
    }

    // Finalize when transition is complete
    if (progress >= 1.0) {
      this.vectorMaterials.setPalette(this.targetName);
      if (this.sceneEnvironment) {
        this.sceneEnvironment.updatePalette();
      }
      this.active = false;
    }
  }

  /**
   * Returns whether a palette transition is currently in progress.
   */
  isActive(): boolean {
    return this.active;
  }
}
