/**
 * DataStream — Reflexes-based moving corridor obstacle.
 *
 * A wireframe shape that moves laterally across the corridor,
 * bouncing between the walls. Player must time their position
 * to avoid the moving stream.
 *
 * GDD: "Data streams to dodge (reflexes-based)"
 *
 * Created by: Story 3-4
 */

import * as THREE from 'three';
import { Obstacle } from './Obstacle.ts';
import {
  BLOOM_LAYER,
  DATA_STREAM_SPEED,
  DATA_STREAM_COLLIDER_SIZE,
} from '../../config/constants.ts';
import type { VectorMaterials } from '../../rendering/VectorMaterials.ts';

export class DataStream extends Obstacle {
  private lineSegments: THREE.LineSegments;
  private edgesGeometry: THREE.EdgesGeometry;
  private material: THREE.LineBasicMaterial;
  private lateralPosition: number;
  private direction: number; // +1 (right) or -1 (left)
  private corridorHalfWidth: number;
  private baseY: number;
  private baseZ: number;
  private colliderCenter: THREE.Vector3;
  private colliderSize: THREE.Vector3;

  constructor(
    position: [number, number, number],
    corridorWidth: number,
    startDirection: 'left' | 'right',
    vectorMaterials: VectorMaterials,
  ) {
    super();

    this.lateralPosition = position[0];
    this.baseY = position[1];
    this.baseZ = position[2];
    this.corridorHalfWidth = corridorWidth / 2;
    this.direction = startDirection === 'right' ? 1 : -1;

    // Create geometry: small box shape — a compact "data packet"
    const baseBox = new THREE.BoxGeometry(1.5, 1.5, 0.5);
    this.edgesGeometry = new THREE.EdgesGeometry(baseBox);
    baseBox.dispose();

    this.material = vectorMaterials.create('dataStream');

    this.lineSegments = new THREE.LineSegments(this.edgesGeometry, this.material);
    this.lineSegments.layers.enable(BLOOM_LAYER);
    this.lineSegments.position.set(this.lateralPosition, this.baseY, this.baseZ);

    this.object3D = this.lineSegments;

    // Initialize collider
    this.colliderCenter = new THREE.Vector3(this.lateralPosition, this.baseY, this.baseZ);
    this.colliderSize = new THREE.Vector3(DATA_STREAM_COLLIDER_SIZE, DATA_STREAM_COLLIDER_SIZE, DATA_STREAM_COLLIDER_SIZE);
    this.collider.setFromCenterAndSize(this.colliderCenter, this.colliderSize);
  }

  update(dt: number): void {
    // Move laterally
    this.lateralPosition += this.direction * DATA_STREAM_SPEED * dt;

    // Bounce off corridor walls
    if (this.lateralPosition > this.corridorHalfWidth) {
      this.lateralPosition = this.corridorHalfWidth;
      this.direction = -1;
    } else if (this.lateralPosition < -this.corridorHalfWidth) {
      this.lateralPosition = -this.corridorHalfWidth;
      this.direction = 1;
    }

    // Update visual position
    this.lineSegments.position.x = this.lateralPosition;

    // Update collider to match current position
    this.colliderCenter.set(this.lateralPosition, this.baseY, this.baseZ);
    this.collider.setFromCenterAndSize(this.colliderCenter, this.colliderSize);
  }

  dispose(): void {
    this.edgesGeometry.dispose();
    this.material.dispose();
  }
}
