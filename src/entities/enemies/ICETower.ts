/**
 * ICETower — Stationary defensive turret for Surface Attack phase.
 *
 * A tall, narrow wireframe tower on the fortress surface that fires
 * data bursts at the player on a cooldown timer. Uses AttackState
 * for firing but does not move.
 *
 * GDD: "ICE towers (destructible targets) — targeted destruction
 * objectives with defensive fire."
 *
 * Created by: Story 3-3
 */

import * as THREE from 'three';
import { Enemy } from './Enemy.ts';
import {
  BLOOM_LAYER,
  ICE_TOWER_HEALTH,
  ICE_TOWER_SCORE_VALUE,
  ICE_TOWER_COLLIDER_RADIUS,
  ICE_TOWER_BEHAVIOR,
} from '../../config/constants.ts';
import type { VectorMaterials } from '../../rendering/VectorMaterials.ts';
import type { BehaviorParams } from '../../ai/BehaviorParams.ts';

export class ICETower extends Enemy {
  private static sharedGeometry: THREE.EdgesGeometry | null = null;
  private static sharedMaterial: THREE.LineBasicMaterial | null = null;

  constructor(vectorMaterials: VectorMaterials, params?: BehaviorParams) {
    super(
      ICE_TOWER_HEALTH,
      ICE_TOWER_SCORE_VALUE,
      params ?? ICE_TOWER_BEHAVIOR,
      ICE_TOWER_COLLIDER_RADIUS,
    );
    this.createGeometry(vectorMaterials);
  }

  private createGeometry(vectorMaterials: VectorMaterials): void {
    if (!ICETower.sharedGeometry) {
      // CylinderGeometry(0.4, 0.2, 3.0, 6): hexagonal tapered tower
      // radiusTop=0.4, radiusBottom=0.2, height=3.0, radialSegments=6
      // Creates a tall, narrow defensive structure silhouette
      const baseGeometry = new THREE.CylinderGeometry(0.4, 0.2, 3.0, 6);
      ICETower.sharedGeometry = new THREE.EdgesGeometry(baseGeometry);
      baseGeometry.dispose();
    }

    if (!ICETower.sharedMaterial) {
      ICETower.sharedMaterial = vectorMaterials.create('iceTower');
    }

    const wireframe = new THREE.LineSegments(
      ICETower.sharedGeometry,
      ICETower.sharedMaterial,
    );
    wireframe.layers.enable(BLOOM_LAYER);
    this.object3D.add(wireframe);
  }

  static resetSharedResources(): void {
    ICETower.sharedGeometry = null;
    ICETower.sharedMaterial = null;
  }
}
