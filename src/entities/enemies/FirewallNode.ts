/**
 * FirewallNode — Stationary destructible target for Surface Attack phase.
 *
 * A small, glowing wireframe node placed on the AI fortress surface.
 * Does not move or attack. Player destroys these to complete Phase 2.
 * Uses shared geometry and material across all instances for performance.
 *
 * GDD: "Firewall nodes and ICE towers (destructible targets) — targeted
 * destruction objectives."
 *
 * Created by: Story 3-3
 */

import * as THREE from 'three';
import { Enemy } from './Enemy.ts';
import {
  BLOOM_LAYER,
  FIREWALL_NODE_HEALTH,
  FIREWALL_NODE_SCORE_VALUE,
  FIREWALL_NODE_COLLIDER_RADIUS,
} from '../../config/constants.ts';
import type { VectorMaterials } from '../../rendering/VectorMaterials.ts';
import type { BehaviorParams } from '../../ai/BehaviorParams.ts';

// Stationary target — zero behavior params
const FIREWALL_NODE_BEHAVIOR: BehaviorParams = {
  patrolSpeed: 0,
  attackCooldown: 0,
  evasionChance: 0,
  movementRandomness: 0,
  attackDamage: 0,
  projectileSpeed: 0,
};

export class FirewallNode extends Enemy {
  private static sharedGeometry: THREE.EdgesGeometry | null = null;
  private static sharedMaterial: THREE.LineBasicMaterial | null = null;

  constructor(vectorMaterials: VectorMaterials) {
    super(
      FIREWALL_NODE_HEALTH,
      FIREWALL_NODE_SCORE_VALUE,
      FIREWALL_NODE_BEHAVIOR,
      FIREWALL_NODE_COLLIDER_RADIUS,
    );
    this.createGeometry(vectorMaterials);
  }

  private createGeometry(vectorMaterials: VectorMaterials): void {
    if (!FirewallNode.sharedGeometry) {
      // SphereGeometry(0.8, 4, 2): low-poly sphere creates a diamond/node
      // pattern — 4 width segments + 2 height segments = octahedron-like
      // shape that reads as a "data node" in the vector aesthetic
      const baseGeometry = new THREE.SphereGeometry(0.8, 4, 2);
      FirewallNode.sharedGeometry = new THREE.EdgesGeometry(baseGeometry);
      baseGeometry.dispose();
    }

    if (!FirewallNode.sharedMaterial) {
      FirewallNode.sharedMaterial = vectorMaterials.create('firewallNode');
    }

    const wireframe = new THREE.LineSegments(
      FirewallNode.sharedGeometry,
      FirewallNode.sharedMaterial,
    );
    wireframe.layers.enable(BLOOM_LAYER);
    this.object3D.add(wireframe);
  }

  static resetSharedResources(): void {
    FirewallNode.sharedGeometry = null;
    FirewallNode.sharedMaterial = null;
  }
}
