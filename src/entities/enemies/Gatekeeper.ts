/**
 * Gatekeeper — "Blocker / Tank" enemy type.
 *
 * A large, dense wireframe construct that blocks the player's path.
 * Uses shared geometry and material across all instances for performance.
 *
 * GDD: "Blocks the path, absorbs damage, forces sustained engagement
 * before allowing progress. Larger, heavier construct -- dense wireframe,
 * imposing presence."
 *
 * Created by: Story 3-2
 */

import * as THREE from 'three';
import { Enemy } from './Enemy.ts';
import {
  BLOOM_LAYER,
  GATEKEEPER_HEALTH,
  GATEKEEPER_SCORE_VALUE,
  GATEKEEPER_COLLIDER_RADIUS,
  GATEKEEPER_BEHAVIOR_LEVEL1,
} from '../../config/constants.ts';
import type { VectorMaterials } from '../../rendering/VectorMaterials.ts';
import type { BehaviorParams } from '../../ai/BehaviorParams.ts';

export class Gatekeeper extends Enemy {
  // Shared resources across all Gatekeeper instances
  private static sharedGeometry: THREE.EdgesGeometry | null = null;
  private static sharedMaterial: THREE.LineBasicMaterial | null = null;

  constructor(vectorMaterials: VectorMaterials, params?: BehaviorParams) {
    super(
      GATEKEEPER_HEALTH,
      GATEKEEPER_SCORE_VALUE,
      params ?? GATEKEEPER_BEHAVIOR_LEVEL1,
      GATEKEEPER_COLLIDER_RADIUS,
    );
    this.createGeometry(vectorMaterials);
  }

  private createGeometry(vectorMaterials: VectorMaterials): void {
    // Initialize shared resources once across all Gatekeepers
    if (!Gatekeeper.sharedGeometry) {
      // DodecahedronGeometry: 12-pentagon polyhedron -- bulky, multifaceted,
      // tank-like. Radius 1.5 makes it visibly larger than Sentinel (1.0)
      // and Watchdog (0.8 cone). The dense edge pattern creates an
      // imposing wireframe presence.
      const baseGeometry = new THREE.DodecahedronGeometry(1.5, 0);
      Gatekeeper.sharedGeometry = new THREE.EdgesGeometry(baseGeometry);
      baseGeometry.dispose();
    }

    if (!Gatekeeper.sharedMaterial) {
      Gatekeeper.sharedMaterial = vectorMaterials.create('gatekeeper');
    }

    const wireframe = new THREE.LineSegments(
      Gatekeeper.sharedGeometry,
      Gatekeeper.sharedMaterial,
    );
    wireframe.layers.enable(BLOOM_LAYER);
    this.object3D.add(wireframe);
  }

  /** Reset shared resources (useful for testing) */
  static resetSharedResources(): void {
    Gatekeeper.sharedGeometry = null;
    Gatekeeper.sharedMaterial = null;
  }
}
