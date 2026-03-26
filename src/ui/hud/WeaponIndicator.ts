/**
 * WeaponIndicator — HUD component that renders a small vector icon for the active weapon.
 *
 * For Epic 2, only the Data Lance icon is rendered. Future stories can add weapon switching.
 * Parented to the camera via HUDManager.
 *
 * Created by: Story 2-6
 */

import * as THREE from 'three';
import { BLOOM_LAYER } from '../../config/constants.ts';
import type { VectorMaterials } from '../../rendering/VectorMaterials.ts';

export class WeaponIndicator {
  public readonly group: THREE.Group;
  private geometry: THREE.BufferGeometry;

  constructor(vectorMaterials: VectorMaterials) {
    this.group = new THREE.Group();

    // Simple Data Lance icon: a small crosshair/bolt shape
    // Two crossed lines + a center dot indicator
    const iconSize = 0.04;
    const positions = new Float32Array([
      // Vertical line (bolt shape)
      0, -iconSize, 0,    0, iconSize, 0,
      // Horizontal tick marks
      -iconSize * 0.5, 0, 0,    iconSize * 0.5, 0, 0,
      // Arrowhead / forward indicator
      -iconSize * 0.3, iconSize * 0.6, 0,    0, iconSize, 0,
      iconSize * 0.3, iconSize * 0.6, 0,     0, iconSize, 0,
    ]);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = vectorMaterials.create('hud-weapon-indicator');
    const mesh = new THREE.LineSegments(this.geometry, material);
    mesh.layers.enable(BLOOM_LAYER);
    this.group.add(mesh);
  }

  /**
   * Disposes geometry.
   * Materials are managed by VectorMaterials singleton and not disposed here.
   */
  dispose(): void {
    this.geometry.dispose();
  }
}
