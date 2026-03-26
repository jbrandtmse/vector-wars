/**
 * Sentinel — Basic "Patrol / Fodder" enemy type.
 *
 * A simple geometric wireframe construct (octahedron) with predictable patrol patterns.
 * Uses shared geometry and material across all instances for performance.
 *
 * GDD: "Predictable patrol patterns, timed attacks. Simple geometric construct --
 * clean, minimal wireframe."
 *
 * Created by: Story 2-2
 */

import * as THREE from 'three';
import { Enemy } from './Enemy.ts';
import {
  BLOOM_LAYER,
  SENTINEL_HEALTH,
  SENTINEL_SCORE_VALUE,
  SENTINEL_COLLIDER_RADIUS,
  SENTINEL_BEHAVIOR_LEVEL1,
} from '../../config/constants.ts';
import type { VectorMaterials } from '../../rendering/VectorMaterials.ts';
import type { BehaviorParams } from '../../ai/BehaviorParams.ts';

export class Sentinel extends Enemy {
  // Shared resources across all Sentinel instances
  private static sharedGeometry: THREE.EdgesGeometry | null = null;
  private static sharedMaterial: THREE.LineBasicMaterial | null = null;

  constructor(vectorMaterials: VectorMaterials, params?: BehaviorParams) {
    super(
      SENTINEL_HEALTH,
      SENTINEL_SCORE_VALUE,
      params ?? SENTINEL_BEHAVIOR_LEVEL1,
      SENTINEL_COLLIDER_RADIUS,
    );
    this.createGeometry(vectorMaterials);
  }

  private createGeometry(vectorMaterials: VectorMaterials): void {
    // Initialize shared resources once across all Sentinels
    if (!Sentinel.sharedGeometry) {
      const baseGeometry = new THREE.OctahedronGeometry(1.0, 0);
      Sentinel.sharedGeometry = new THREE.EdgesGeometry(baseGeometry);
      baseGeometry.dispose();
    }

    if (!Sentinel.sharedMaterial) {
      Sentinel.sharedMaterial = vectorMaterials.create('sentinel');
    }

    const wireframe = new THREE.LineSegments(
      Sentinel.sharedGeometry,
      Sentinel.sharedMaterial,
    );
    wireframe.layers.enable(BLOOM_LAYER);
    this.object3D.add(wireframe);
  }

  /** Reset shared resources (useful for testing) */
  static resetSharedResources(): void {
    Sentinel.sharedGeometry = null;
    Sentinel.sharedMaterial = null;
  }
}
