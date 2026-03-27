/**
 * VirusPayload -- The mission weapon projectile.
 *
 * A distinctive wireframe double-ring shape that spins as it travels,
 * conveying the biological/viral injection metaphor. Larger and slower
 * than other projectiles -- deliberate and consequential.
 *
 * GDD: "This is the kill shot -- it should feel like pulling a trigger
 * that matters."
 *
 * Created by: Story 3-8
 */

import * as THREE from 'three';
import {
  BLOOM_LAYER,
  VIRUS_PAYLOAD_LENGTH,
  VIRUS_PAYLOAD_SPEED,
  VIRUS_PAYLOAD_MAX_RANGE,
  VIRUS_PAYLOAD_MAX_LIFETIME,
  VIRUS_PAYLOAD_COLLIDER_RADIUS,
} from '../../config/constants.ts';
import type { VectorMaterials } from '../../rendering/VectorMaterials.ts';

// Pre-allocated unit vector for setFromUnitVectors default axis
const DEFAULT_FORWARD = new THREE.Vector3(0, 0, -1);

// Shared geometry across all pool instances -- created once per ring orientation
let sharedRingGeometry1: THREE.EdgesGeometry | null = null;
let sharedRingGeometry2: THREE.EdgesGeometry | null = null;

function getSharedRingGeometry1(): THREE.EdgesGeometry {
  if (!sharedRingGeometry1) {
    const torus = new THREE.TorusGeometry(
      VIRUS_PAYLOAD_LENGTH * 0.4,
      VIRUS_PAYLOAD_LENGTH * 0.12,
      6,
      8,
    );
    sharedRingGeometry1 = new THREE.EdgesGeometry(torus);
    torus.dispose();
  }
  return sharedRingGeometry1;
}

function getSharedRingGeometry2(): THREE.EdgesGeometry {
  if (!sharedRingGeometry2) {
    const torus = new THREE.TorusGeometry(
      VIRUS_PAYLOAD_LENGTH * 0.4,
      VIRUS_PAYLOAD_LENGTH * 0.12,
      6,
      8,
    );
    // Rotate the source torus 90 degrees on X axis before extracting edges
    torus.rotateX(Math.PI / 2);
    sharedRingGeometry2 = new THREE.EdgesGeometry(torus);
    torus.dispose();
  }
  return sharedRingGeometry2;
}

export class VirusPayload {
  public readonly mesh: THREE.Object3D;
  public readonly collider: THREE.Sphere;
  public direction = new THREE.Vector3();
  public active = false;
  public distance = 0;
  public lifetime = 0;

  constructor(vectorMaterials: VectorMaterials, index: number) {
    this.mesh = new THREE.Object3D();
    this.mesh.visible = false;

    const material = vectorMaterials.create(`virus-payload-${index}`, 0.1);

    // Ring 1: XY plane (default torus orientation)
    const ring1 = new THREE.LineSegments(getSharedRingGeometry1(), material);
    ring1.layers.enable(BLOOM_LAYER);
    this.mesh.add(ring1);

    // Ring 2: XZ plane (rotated 90 degrees on X)
    const ring2 = new THREE.LineSegments(getSharedRingGeometry2(), material);
    ring2.layers.enable(BLOOM_LAYER);
    this.mesh.add(ring2);

    this.collider = new THREE.Sphere(new THREE.Vector3(), VIRUS_PAYLOAD_COLLIDER_RADIUS);
  }

  activate(origin: THREE.Vector3, dir: THREE.Vector3): void {
    this.mesh.position.copy(origin);
    this.direction.copy(dir).normalize();
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
    this.distance = 0;
    this.lifetime = 0;
  }

  update(dt: number): void {
    if (!this.active) return;

    // Move along direction
    const moveDistance = VIRUS_PAYLOAD_SPEED * dt;
    this.mesh.position.addScaledVector(this.direction, moveDistance);
    this.distance += moveDistance;
    this.lifetime += dt;

    // Spin the mesh group slowly on Z axis (visible rotation)
    this.mesh.rotation.z += 2.0 * dt;

    // Sync collider center to mesh position
    this.collider.center.copy(this.mesh.position);

    // Deactivate if lifetime or range exceeded
    if (this.lifetime > VIRUS_PAYLOAD_MAX_LIFETIME || this.distance > VIRUS_PAYLOAD_MAX_RANGE) {
      this.deactivate();
    }
  }
}
