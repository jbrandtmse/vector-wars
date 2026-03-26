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
import { BLOOM_LAYER, ENEMY_DATA_BURST_LENGTH, ENEMY_DATA_BURST_COLLIDER_RADIUS } from '../../config/constants.ts';

// Pre-allocated unit vector for setFromUnitVectors default axis (avoid per-activation allocation)
const DEFAULT_LINE_AXIS = new THREE.Vector3(0, 0, 1);

export class EnemyDataBurst {
  public readonly mesh: THREE.LineSegments;
  public readonly collider: THREE.Sphere;
  public direction = new THREE.Vector3();
  public speed = 0;
  public damage = 0;
  public active = false;
  public distance = 0;

  private geometry: THREE.BufferGeometry;
  private positions: Float32Array;

  constructor(material: THREE.LineBasicMaterial) {
    // Pre-allocate position buffer: 1 line segment = 2 vertices = 6 floats
    this.positions = new Float32Array(6);
    const halfLen = ENEMY_DATA_BURST_LENGTH / 2;
    this.positions[0] = 0; this.positions[1] = 0; this.positions[2] = halfLen;
    this.positions[3] = 0; this.positions[4] = 0; this.positions[5] = -halfLen;

    this.geometry = new THREE.BufferGeometry();
    const posAttr = new THREE.BufferAttribute(this.positions, 3);
    this.geometry.setAttribute('position', posAttr);

    this.mesh = new THREE.LineSegments(this.geometry, material);
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
