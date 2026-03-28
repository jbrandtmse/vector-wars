/**
 * Overseer — "Coordinator / Elite" enemy type.
 *
 * A complex, multi-part wireframe construct with a central icosahedron
 * and 4 orbiting satellite cubes. Visually distinct — commands attention.
 * Uses shared geometry and material across all instances for performance.
 *
 * GDD: "Coordinates nearby enemies, buffs attack patterns of surrounding
 * constructs. Priority target. Complex, multi-part construct -- visually
 * distinct, commands attention."
 *
 * Created by: Story 5-6
 */

import * as THREE from 'three';
import { Enemy } from './Enemy.ts';
import {
  BLOOM_LAYER,
  OVERSEER_HEALTH,
  OVERSEER_SCORE_VALUE,
  OVERSEER_COLLIDER_RADIUS,
  OVERSEER_BEHAVIOR_LEVEL2,
} from '../../config/constants.ts';
import type { VectorMaterials } from '../../rendering/VectorMaterials.ts';
import type { BehaviorParams } from '../../ai/BehaviorParams.ts';

export class Overseer extends Enemy {
  // Shared resources across all Overseer instances
  private static sharedCenterGeometry: THREE.EdgesGeometry | null = null;
  private static sharedSatelliteGeometry: THREE.EdgesGeometry | null = null;
  private static sharedMaterial: THREE.LineBasicMaterial | null = null;

  constructor(vectorMaterials: VectorMaterials, params?: BehaviorParams) {
    super(
      OVERSEER_HEALTH,
      OVERSEER_SCORE_VALUE,
      params ?? OVERSEER_BEHAVIOR_LEVEL2,
      OVERSEER_COLLIDER_RADIUS,
    );
    this.createGeometry(vectorMaterials);
  }

  private createGeometry(vectorMaterials: VectorMaterials): void {
    // Initialize shared resources once across all Overseers
    if (!Overseer.sharedCenterGeometry) {
      // IcosahedronGeometry: 20-face polyhedron -- more complex than Sentinel's
      // octahedron, creating a visually dense central body
      const centerBase = new THREE.IcosahedronGeometry(1.0, 0);
      Overseer.sharedCenterGeometry = new THREE.EdgesGeometry(centerBase);
      centerBase.dispose();
    }

    if (!Overseer.sharedSatelliteGeometry) {
      // Small cube satellites at cardinal positions
      const satelliteBase = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      Overseer.sharedSatelliteGeometry = new THREE.EdgesGeometry(satelliteBase);
      satelliteBase.dispose();
    }

    if (!Overseer.sharedMaterial) {
      Overseer.sharedMaterial = vectorMaterials.create('overseer');
    }

    // Central body
    const center = new THREE.LineSegments(
      Overseer.sharedCenterGeometry,
      Overseer.sharedMaterial,
    );
    center.layers.enable(BLOOM_LAYER);
    this.object3D.add(center);

    // 4 satellite cubes at cardinal offsets
    const satelliteOffsets: [number, number, number][] = [
      [0, 1.2, 0],    // top
      [0, -1.2, 0],   // bottom
      [-1.2, 0, 0],   // left
      [1.2, 0, 0],    // right
    ];

    for (const offset of satelliteOffsets) {
      const satellite = new THREE.LineSegments(
        Overseer.sharedSatelliteGeometry,
        Overseer.sharedMaterial,
      );
      satellite.position.set(offset[0], offset[1], offset[2]);
      satellite.layers.enable(BLOOM_LAYER);
      this.object3D.add(satellite);
    }
  }

  /** Reset shared resources (useful for testing) */
  static resetSharedResources(): void {
    Overseer.sharedCenterGeometry = null;
    Overseer.sharedSatelliteGeometry = null;
    Overseer.sharedMaterial = null;
  }
}
