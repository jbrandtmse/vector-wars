/**
 * PaletteColors — CSS color/glow utility derived from the active ColorPalette.
 *
 * Provides CSS-ready color and glow strings that match the current palette,
 * so HTML/CSS UI elements can stay synchronized with Three.js rendered geometry.
 *
 * Created by: Story 5-1
 */

import { type PaletteName } from './ColorPalette.ts';
import { getActivePalette } from './ColorPalette.ts';

/** CSS hex colors matching each palette's visual identity */
const PALETTE_CSS_HEX: Record<PaletteName, string> = {
  green: '#00ff41',
  amber: '#ffb000',
  red: '#ff2020',
} as const;

/**
 * Returns the CSS hex color string for the currently active palette.
 * Example: '#00ff41' for green, '#ffb000' for amber, '#ff2020' for red.
 */
export function getPaletteHexColor(): string {
  const palette = getActivePalette();
  // Identify palette by hue value
  if (palette.hue === 0.33) return PALETTE_CSS_HEX.green;
  if (palette.hue === 0.11) return PALETTE_CSS_HEX.amber;
  if (palette.hue === 0.0) return PALETTE_CSS_HEX.red;
  // Fallback to green if unknown
  return PALETTE_CSS_HEX.green;
}

/**
 * Returns a CSS color string for the given palette name.
 */
export function getPaletteHexForName(name: PaletteName): string {
  return PALETTE_CSS_HEX[name];
}

/**
 * Returns a CSS text-shadow glow string for the currently active palette.
 * Example: '0 0 10px #00ff41' for green.
 */
export function getPaletteCSSGlow(radius: number = 10): string {
  const hex = getPaletteHexColor();
  return `0 0 ${radius}px ${hex}`;
}

/**
 * Returns a CSS text-shadow with multiple glow layers for the currently active palette.
 * Example: '0 0 20px #00ff41, 0 0 40px #00ff41' for green.
 */
export function getPaletteCSSMultiGlow(radii: number[] = [20, 40]): string {
  const hex = getPaletteHexColor();
  return radii.map((r) => `0 0 ${r}px ${hex}`).join(', ');
}
