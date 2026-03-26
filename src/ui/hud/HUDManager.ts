/**
 * HUDManager — Creates and owns all HUD components, parents them to the camera.
 *
 * All HUD updates are event-driven (not per-frame). HUDManager does NOT have
 * an update(dt) method. Provides a dispose() method for cleanup.
 *
 * Created by: Story 2-6
 */

import * as THREE from 'three';
import { HUD_Z_DEPTH } from '../../config/constants.ts';
import type { VectorMaterials } from '../../rendering/VectorMaterials.ts';
import { ShieldBar } from './ShieldBar.ts';
import { ScoreDisplay } from './ScoreDisplay.ts';
import { WeaponIndicator } from './WeaponIndicator.ts';

export class HUDManager {
  private hudGroup: THREE.Group;
  private shieldBar: ShieldBar;
  private scoreDisplay: ScoreDisplay;
  private weaponIndicator: WeaponIndicator;

  constructor(camera: THREE.PerspectiveCamera, vectorMaterials: VectorMaterials) {
    this.hudGroup = new THREE.Group();
    this.hudGroup.position.z = HUD_Z_DEPTH;

    // Shield bar -- bottom-left
    this.shieldBar = new ShieldBar(vectorMaterials);
    this.shieldBar.group.position.set(-0.85, -0.42, 0);
    this.hudGroup.add(this.shieldBar.group);

    // Score display -- bottom-right
    this.scoreDisplay = new ScoreDisplay(vectorMaterials);
    this.scoreDisplay.group.position.set(0.55, -0.42, 0);
    this.hudGroup.add(this.scoreDisplay.group);

    // Weapon indicator -- bottom-center
    this.weaponIndicator = new WeaponIndicator(vectorMaterials);
    this.weaponIndicator.group.position.set(0.0, -0.42, 0);
    this.hudGroup.add(this.weaponIndicator.group);

    // Parent to camera so HUD follows the view
    camera.add(this.hudGroup);
  }

  /**
   * Removes HUD from the camera, unsubscribes events, and disposes all geometries.
   * Materials are managed by VectorMaterials singleton and not disposed here.
   */
  dispose(): void {
    this.shieldBar.dispose();
    this.scoreDisplay.dispose();
    this.weaponIndicator.dispose();
    this.hudGroup.parent?.remove(this.hudGroup);
  }
}
