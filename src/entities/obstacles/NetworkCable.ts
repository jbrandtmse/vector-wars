/**
 * NetworkCable — Positioning-based corridor obstacle.
 *
 * Wireframe lines crossing the corridor horizontally at a fixed
 * y-position. Player must use viewport offset to dodge above/below.
 *
 * GDD: "Network cables crossing the path (positioning-based)"
 *
 * Created by: Story 3-4
 */

import * as THREE from 'three';
import { Obstacle } from './Obstacle.ts';
import {
  BLOOM_LAYER,
  NETWORK_CABLE_COLLIDER_HEIGHT,
} from '../../config/constants.ts';
import type { VectorMaterials } from '../../rendering/VectorMaterials.ts';

export class NetworkCable extends Obstacle {
  private lineSegments: THREE.LineSegments;
  private bufferGeometry: THREE.BufferGeometry;
  private material: THREE.LineBasicMaterial;

  constructor(
    position: [number, number, number],
    corridorWidth: number,
    vectorMaterials: VectorMaterials,
  ) {
    super();

    const halfWidth = corridorWidth / 2;
    const y = position[1];
    const z = position[2];
    const x = position[0];

    // Create 3 horizontal cable lines spanning the corridor width
    // with slight vertical spacing to create a "cable bundle" look
    const vertices = new Float32Array([
      // Cable 1: main line at cable y
      x - halfWidth, y, z,
      x + halfWidth, y, z,
      // Cable 2: slightly above
      x - halfWidth, y + 0.3, z,
      x + halfWidth, y + 0.3, z,
      // Cable 3: slightly below
      x - halfWidth, y - 0.3, z,
      x + halfWidth, y - 0.3, z,
      // Cable 4: diagonal crossing for visual variety
      x - halfWidth, y - 0.2, z,
      x + halfWidth, y + 0.2, z,
    ]);

    this.bufferGeometry = new THREE.BufferGeometry();
    this.bufferGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    this.material = vectorMaterials.create('networkCable');

    this.lineSegments = new THREE.LineSegments(this.bufferGeometry, this.material);
    this.lineSegments.layers.enable(BLOOM_LAYER);

    this.object3D = this.lineSegments;

    // Collider: Box3 centered at cable position
    const center = new THREE.Vector3(x, y, z);
    const size = new THREE.Vector3(corridorWidth, NETWORK_CABLE_COLLIDER_HEIGHT, 1.0);
    this.collider.setFromCenterAndSize(center, size);
  }

  update(_dt: number): void {
    // Static obstacle — no animation needed
  }

  dispose(): void {
    this.bufferGeometry.dispose();
    this.material.dispose();
  }
}
