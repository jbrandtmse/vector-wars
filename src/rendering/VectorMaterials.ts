/**
 * VectorMaterials — Singleton that manages all line material creation.
 *
 * ALL line materials in the game must be created through this module.
 * This ensures palette transitions (green -> amber -> red) update every
 * material globally, and that all materials conform to the vector aesthetic.
 */

import * as THREE from 'three';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import {
  PALETTES,
  getActivePalette,
  setActivePalette,
  type PaletteName,
} from './ColorPalette.ts';

interface ThinMaterialEntry {
  material: THREE.LineBasicMaterial;
  lightnessOffset: number;
}

interface FatMaterialEntry {
  material: LineMaterial;
  lightnessOffset: number;
}

export class VectorMaterials {
  private thinMaterials: Map<string, ThinMaterialEntry> = new Map();
  private fatMaterials: Map<string, FatMaterialEntry> = new Map();

  /**
   * Creates a thin LineBasicMaterial registered for palette updates.
   * @param id Unique identifier for this material
   * @param lightnessOffset Optional offset applied to base palette lightness (-1 to 1)
   */
  create(id: string, lightnessOffset: number = 0): THREE.LineBasicMaterial {
    if (__DEV__ && (this.thinMaterials.has(id) || this.fatMaterials.has(id))) {
      throw new Error(`VectorMaterials: duplicate material id "${id}"`);
    }

    const palette = getActivePalette();
    const color = new THREE.Color();
    color.setHSL(
      palette.hue,
      palette.saturation,
      Math.max(0, Math.min(1, palette.lightness + lightnessOffset)),
    );

    const material = new THREE.LineBasicMaterial({ color });
    this.thinMaterials.set(id, { material, lightnessOffset });
    return material;
  }

  /**
   * Creates a fat LineMaterial with pixel-width control, registered for palette updates.
   * @param id Unique identifier for this material
   * @param linewidth Line width in pixels
   * @param lightnessOffset Optional offset applied to base palette lightness (-1 to 1)
   */
  createFat(id: string, linewidth: number, lightnessOffset: number = 0): LineMaterial {
    if (__DEV__ && (this.thinMaterials.has(id) || this.fatMaterials.has(id))) {
      throw new Error(`VectorMaterials: duplicate material id "${id}"`);
    }

    const palette = getActivePalette();
    const color = new THREE.Color();
    color.setHSL(
      palette.hue,
      palette.saturation,
      Math.max(0, Math.min(1, palette.lightness + lightnessOffset)),
    );

    const material = new LineMaterial({
      color: color.getHex(),
      linewidth,
    });
    this.fatMaterials.set(id, { material, lightnessOffset });
    return material;
  }

  /**
   * Updates all registered materials to a new palette.
   * Also updates the active palette in ColorPalette module.
   */
  setPalette(name: PaletteName): void {
    setActivePalette(name);
    const palette = PALETTES[name];

    for (const entry of this.thinMaterials.values()) {
      const lightness = Math.max(0, Math.min(1, palette.lightness + entry.lightnessOffset));
      entry.material.color.setHSL(palette.hue, palette.saturation, lightness);
    }

    for (const entry of this.fatMaterials.values()) {
      const lightness = Math.max(0, Math.min(1, palette.lightness + entry.lightnessOffset));
      entry.material.color.setHSL(palette.hue, palette.saturation, lightness);
    }
  }

  /**
   * Updates the resolution on all registered LineMaterial instances.
   * Required for correct Line2 rendering; must be called on window resize.
   */
  updateResolution(width: number, height: number): void {
    for (const entry of this.fatMaterials.values()) {
      entry.material.resolution.set(width, height);
    }
  }

  /**
   * Disposes all registered materials and clears the registry.
   */
  dispose(): void {
    for (const entry of this.thinMaterials.values()) {
      entry.material.dispose();
    }
    for (const entry of this.fatMaterials.values()) {
      entry.material.dispose();
    }
    this.thinMaterials.clear();
    this.fatMaterials.clear();
  }
}

/** Module-level singleton instance */
export const vectorMaterials = new VectorMaterials();
