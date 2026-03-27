/**
 * EnemyDataBurst — Enemy data burst projectile entity.
 *
 * A short line segment that travels in a straight line from enemy to player.
 * Visually similar to Data Lance bolts but shorter and dimmer.
 * Uses pre-allocated pool pattern: activate/deactivate toggle visibility.
 *
 * Created by: Story 2-5
 */

import * as THREE from 'three';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import type { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { BLOOM_LAYER, ENEMY_DATA_BURST_LENGTH, ENEMY_DATA_BURST_COLLIDER_RADIUS } from '../../config/constants.ts';

// Pre-allocated unit vector for setFromUnitVectors default axis (avoid per-activation allocation)
const DEFAULT_LINE_AXIS = new THREE.Vector3(0, 0, 1);

export class EnemyDataBurst {
  public readonly mesh: LineSegments2;
  public readonly collider: THREE.Sphere;
  public direction = new THREE.Vector3();
  public speed = 0;
  public damage = 0;
  public active = false;
  public distance = 0;

  private geometry: LineSegmentsGeometry;

  constructor(material: LineMaterial) {
    const halfLen = ENEMY_DATA_BURST_LENGTH / 2;
    this.geometry = new LineSegmentsGeometry();
    this.geometry.setPositions([0, 0, halfLen, 0, 0, -halfLen]);

    this.mesh = new LineSegments2(this.geometry, material);
    this.mesh.layers.enable(BLOOM_LAYER);
    this.mesh.visible = false;

    this.collider = new THREE.Sphere(new THREE.Vector3(), ENEMY_DATA_BURST_COLLIDER_RADIUS);
  }

  activate(origin: THREE.Vector3, dir: THREE.Vector3, speed: number, damage: number): void {
    this.mesh.position.copy(origin);
    this.direction.copy(dir);
    this.speed = speed;
    this.damage = damage;
    this.distance = 0;
    this.active = true;
    this.mesh.visible = true;

    // Orient line along travel direction
    this.mesh.quaternion.setFromUnitVectors(DEFAULT_LINE_AXIS, dir);
  }

  deactivate(): void {
    this.active = false;
    this.mesh.visible = false;
    this.distance = 0;
  }

  update(dt: number): void {
    if (!this.active) return;
    const moveDistance = this.speed * dt;
    this.mesh.position.addScaledVector(this.direction, moveDistance);
    this.distance += moveDistance;

    // Sync collider center
    this.collider.center.copy(this.mesh.position);
  }
}
