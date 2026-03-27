/**
 * Watchdog — "Pursuit / Aggressive" enemy type.
 *
 * A sleek, angular wireframe construct that actively pursues the player.
 * Uses shared geometry and material across all instances for performance.
 *
 * GDD: "Pursues the player, faster attacks, harder to shake. Closes distance
 * aggressively. Sleeker, faster-looking construct -- angular, pointed geometry."
 *
 * Created by: Story 3-1
 */

import * as THREE from 'three';
import { Enemy } from './Enemy.ts';
import {
  BLOOM_LAYER,
  WATCHDOG_HEALTH,
  WATCHDOG_SCORE_VALUE,
  WATCHDOG_COLLIDER_RADIUS,
  WATCHDOG_BEHAVIOR_LEVEL1,
} from '../../config/constants.ts';
import type { VectorMaterials } from '../../rendering/VectorMaterials.ts';
import type { BehaviorParams } from '../../ai/BehaviorParams.ts';

export class Watchdog extends Enemy {
  // Shared resources across all Watchdog instances
  private static sharedGeometry: THREE.EdgesGeometry | null = null;
  private static sharedMaterial: THREE.LineBasicMaterial | null = null;

  constructor(vectorMaterials: VectorMaterials, params?: BehaviorParams) {
    super(
      WATCHDOG_HEALTH,
      WATCHDOG_SCORE_VALUE,
      params ?? WATCHDOG_BEHAVIOR_LEVEL1,
      WATCHDOG_COLLIDER_RADIUS,
    );
    this.createGeometry(vectorMaterials);
  }

  private createGeometry(vectorMaterials: VectorMaterials): void {
    // Initialize shared resources once across all Watchdogs
    if (!Watchdog.sharedGeometry) {
      // ConeGeometry: pointed/angular shape suggesting speed and aggression
      // radius=0.8, height=2.0, radialSegments=4 creates a diamond/pyramid look
      const baseGeometry = new THREE.ConeGeometry(0.8, 2.0, 4);
      Watchdog.sharedGeometry = new THREE.EdgesGeometry(baseGeometry);
      baseGeometry.dispose();
    }

    if (!Watchdog.sharedMaterial) {
      Watchdog.sharedMaterial = vectorMaterials.create('watchdog');
    }

    const wireframe = new THREE.LineSegments(
      Watchdog.sharedGeometry,
      Watchdog.sharedMaterial,
    );
    wireframe.layers.enable(BLOOM_LAYER);
    this.object3D.add(wireframe);
  }

  /** Reset shared resources (useful for testing) */
  static resetSharedResources(): void {
    Watchdog.sharedGeometry = null;
    Watchdog.sharedMaterial = null;
  }
}
