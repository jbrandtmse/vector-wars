/**
 * ColorPalette — HSL palette presets for the vector aesthetic.
 *
 * Palettes define the base hue/saturation/lightness used by VectorMaterials.
 * Green is active by default (Level 1). Amber and red are used in later levels.
 */

export interface PaletteValues {
  readonly hue: number;
  readonly saturation: number;
  readonly lightness: number;
}

export const PALETTES = {
  green: { hue: 0.33, saturation: 1.0, lightness: 0.5 },
  amber: { hue: 0.11, saturation: 1.0, lightness: 0.5 },
  red:   { hue: 0.0,  saturation: 1.0, lightness: 0.5 },
} as const;

export type PaletteName = keyof typeof PALETTES;

let activePalette: PaletteName = 'green';

/**
 * Returns the currently active palette values.
 */
export function getActivePalette(): PaletteValues {
  return PALETTES[activePalette];
}

/**
 * Sets the active palette by name. VectorMaterials.setPalette() should
 * be called after this to update all registered materials.
 */
export function setActivePalette(name: PaletteName): void {
  activePalette = name;
}
