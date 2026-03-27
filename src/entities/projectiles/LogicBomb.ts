/**
 * LogicBomb — Homing heavy missile projectile entity.
 *
 * A diamond/rhombus wireframe shape that tracks toward a locked target.
 * Thicker line width than Data Lance bolts to convey weight and impact.
 * Uses pre-allocated pool pattern: activate/deactivate toggle visibility.
 *
 * GDD: "Weighty feel — slight delay before launch, then powerful impact."
 *
 * Created by: Story 3-5
 */

import * as THREE from 'three';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import type { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import {
  BLOOM_LAYER,
  LOGIC_BOMB_LENGTH,
  LOGIC_BOMB_SPEED,
  LOGIC_BOMB_MAX_RANGE,
  LOGIC_BOMB_MAX_LIFETIME,
  LOGIC_BOMB_TURN_RATE,
  LOGIC_BOMB_COLLIDER_RADIUS,
} from '../../config/constants.ts';
import type { Enemy } from '../enemies/Enemy.ts';

// Pre-allocated unit vector for setFromUnitVectors default axis
const DEFAULT_FORWARD = new THREE.Vector3(0, 0, -1);

export class LogicBomb {
  public readonly mesh: LineSegments2;
  public readonly collider: THREE.Sphere;
  public direction = new THREE.Vector3();
  public target: Enemy | null = null;
  public active = false;
  public distance = 0;
  public lifetime = 0;

  // Pre-allocated temp vectors for homing computation (zero-allocation pattern)
  private tempTargetDir = new THREE.Vector3();

  private geometry: LineSegmentsGeometry;

  constructor(material: LineMaterial) {
    // Diamond/rhombus shape: two diagonal lines + horizontal center
    const s = LOGIC_BOMB_LENGTH / 2;
    const positions = [
      // Diagonal 1: top-left to bottom-right
      -s, s, 0,    s, -s, 0,
      // Diagonal 2: top-right to bottom-left
      s, s, 0,     -s, -s, 0,
      // Horizontal center line
      -s, 0, 0,    s, 0, 0,
    ];

    this.geometry = new LineSegmentsGeometry();
    this.geometry.setPositions(positions);

    this.mesh = new LineSegments2(this.geometry, material);
    this.mesh.layers.enable(BLOOM_LAYER);
    this.mesh.visible = false;

    this.collider = new THREE.Sphere(new THREE.Vector3(), LOGIC_BOMB_COLLIDER_RADIUS);
  }

  activate(origin: THREE.Vector3, dir: THREE.Vector3, target: Enemy | null): void {
    this.mesh.position.copy(origin);
    this.direction.copy(dir).normalize();
    this.target = target;
    this.distance = 0;
    this.lifetime = 0;
    this.active = true;
    this.mesh.visible = true;

    // Orient mesh to face travel direction
    this.mesh.quaternion.setFromUnitVectors(DEFAULT_FORWARD, this.direction);

    // Sync collider
    this.collider.center.copy(origin);
  }

  deactivate(): void {
    this.active = false;
    this.mesh.visible = false;
    this.target = null;
    this.distance = 0;
    this.lifetime = 0;
  }

  update(dt: number): void {
    if (!this.active) return;

    // Homing: if target is active, steer toward it
    if (this.target && this.target.isActive) {
      this.tempTargetDir.copy(this.target.getPosition()).sub(this.mesh.position).normalize();
      // Smoothly rotate direction toward target using lerp, clamped to [0, 1]
      const lerpFactor = Math.min(1, LOGIC_BOMB_TURN_RATE * dt);
      this.direction.lerp(this.tempTargetDir, lerpFactor).normalize();
    }
    // If target is null or inactive, continue straight (no homing)

    // Move along current direction
    const moveDistance = LOGIC_BOMB_SPEED * dt;
    this.mesh.position.addScaledVector(this.direction, moveDistance);
    this.distance += moveDistance;
    this.lifetime += dt;

    // Sync collider center to mesh position
    this.collider.center.copy(this.mesh.position);

    // Orient mesh to face travel direction
    this.mesh.quaternion.setFromUnitVectors(DEFAULT_FORWARD, this.direction);

    // Deactivate if lifetime or range exceeded
    if (this.lifetime > LOGIC_BOMB_MAX_LIFETIME || this.distance > LOGIC_BOMB_MAX_RANGE) {
      this.deactivate();
    }
  }
}
