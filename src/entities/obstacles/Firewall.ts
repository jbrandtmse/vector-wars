/**
 * Firewall — Timing-based corridor obstacle that opens and closes.
 *
 * A flat wireframe barrier spanning the corridor cross-section.
 * Cycles between closed (visible, collidable) and open (invisible,
 * non-collidable) states on a timer.
 *
 * GDD: "Firewalls slamming shut (timing-based)"
 *
 * Created by: Story 3-4
 */

import * as THREE from 'three';
import { Obstacle } from './Obstacle.ts';
import {
  BLOOM_LAYER,
  CORRIDOR_HEIGHT,
  FIREWALL_CLOSE_DURATION,
  FIREWALL_OPEN_DURATION,
  FIREWALL_COLLIDER_DEPTH,
} from '../../config/constants.ts';
import type { VectorMaterials } from '../../rendering/VectorMaterials.ts';

const FULL_CYCLE = FIREWALL_CLOSE_DURATION + FIREWALL_OPEN_DURATION;

export class Firewall extends Obstacle {
  private lineSegments: THREE.LineSegments;
  private edgesGeometry: THREE.EdgesGeometry;
  private material: THREE.LineBasicMaterial;
  private timer: number;

  constructor(
    position: [number, number, number],
    corridorWidth: number,
    phaseOffset: number,
    vectorMaterials: VectorMaterials,
  ) {
    super();

    // Create geometry: flat barrier spanning corridor cross-section
    const basePlane = new THREE.PlaneGeometry(corridorWidth, CORRIDOR_HEIGHT);
    this.edgesGeometry = new THREE.EdgesGeometry(basePlane);
    basePlane.dispose();

    this.material = vectorMaterials.create('firewall');

    this.lineSegments = new THREE.LineSegments(this.edgesGeometry, this.material);
    this.lineSegments.layers.enable(BLOOM_LAYER);
    this.lineSegments.position.set(position[0], position[1], position[2]);

    this.object3D = this.lineSegments;

    // Collider: Box3 centered on firewall position
    const center = new THREE.Vector3(position[0], position[1], position[2]);
    const size = new THREE.Vector3(corridorWidth, CORRIDOR_HEIGHT, FIREWALL_COLLIDER_DEPTH);
    this.collider.setFromCenterAndSize(center, size);

    // Initialize timer with phaseOffset stagger
    this.timer = phaseOffset * FULL_CYCLE;

    // Set initial state based on timer
    this.updateState();
  }

  update(dt: number): void {
    this.timer += dt;

    // Wrap timer for cycling
    while (this.timer >= FULL_CYCLE) {
      this.timer -= FULL_CYCLE;
    }

    this.updateState();
  }

  private updateState(): void {
    if (this.timer < FIREWALL_CLOSE_DURATION) {
      // Closed state: visible, collidable
      this.lineSegments.visible = true;
      this.active = true;
    } else {
      // Open state: invisible, non-collidable
      this.lineSegments.visible = false;
      this.active = false;
    }
  }

  dispose(): void {
    this.edgesGeometry.dispose();
    this.material.dispose();
  }
}
