/**
 * DataLanceSystem — Manages Data Lance bolt firing, pooling, and movement.
 *
 * Fires twin bolts from the actuator arm tips with slight inward convergence,
 * creating visible laser streams in the classic 1983 arcade style.
 *
 * Uses a lightweight pre-allocated bolt pool with visibility toggling
 * to avoid GC pauses and scene graph mutations.
 *
 * Created by: Story 1-5
 */

import * as THREE from 'three';
import {
  BLOOM_LAYER,
  DATA_LANCE_BOLT_LENGTH,
  DATA_LANCE_BOLT_SPEED,
  DATA_LANCE_FIRE_RATE,
  DATA_LANCE_MAX_RANGE,
  DATA_LANCE_POOL_SIZE,
} from '../config/constants.ts';
import { Logger } from '../core/Logger.ts';
import type { InputManager } from '../core/InputManager.ts';
import type { VectorMaterials } from '../rendering/VectorMaterials.ts';
import type { CockpitRenderer } from '../rendering/CockpitRenderer.ts';

// Arm tip positions in camera-local space
// Cockpit group is at (0, -0.1, -1.5), arm tips are at ~(±0.5, 0.05, -0.7) in group space
const LEFT_ARM_TIP = new THREE.Vector3(-0.5, -0.05, -2.2);
const RIGHT_ARM_TIP = new THREE.Vector3(0.5, -0.05, -2.2);

// Slight inward convergence angle (radians) so bolts cross ~40 units ahead
const CONVERGENCE_ANGLE = 0.012;

interface BoltData {
  mesh: THREE.LineSegments;
  direction: THREE.Vector3;
  active: boolean;
  distance: number;
}

export class DataLanceSystem {
  private bolts: BoltData[] = [];
  private cooldown = 0;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private inputManager: InputManager;
  private cockpitRenderer: CockpitRenderer;

  // Pre-allocated vectors for per-frame calculations (zero-allocation update loop)
  private tempDirection = new THREE.Vector3();
  private tempArmWorld = new THREE.Vector3();

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    inputManager: InputManager,
    vectorMaterials: VectorMaterials,
    cockpitRenderer: CockpitRenderer,
  ) {
    this.scene = scene;
    this.camera = camera;
    this.inputManager = inputManager;
    this.cockpitRenderer = cockpitRenderer;

    // Create bolt geometry — a long line segment (visible as a streak)
    const halfLen = DATA_LANCE_BOLT_LENGTH / 2;
    const positions = new Float32Array([
      0, 0, halfLen,    // tail
      0, 0, -halfLen,   // head
    ]);
    const templateGeometry = new THREE.BufferGeometry();
    templateGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Create ONE shared material for all bolts
    const boltMaterial = vectorMaterials.create('data-lance-bolt');

    // Pre-allocate bolt pool
    for (let i = 0; i < DATA_LANCE_POOL_SIZE; i++) {
      const mesh = new THREE.LineSegments(templateGeometry.clone(), boltMaterial);
      mesh.layers.enable(BLOOM_LAYER);
      mesh.visible = false;
      scene.add(mesh);
      this.bolts.push({
        mesh,
        direction: new THREE.Vector3(),
        active: false,
        distance: 0,
      });
    }

    // Dispose the template geometry (each bolt has its own clone)
    templateGeometry.dispose();
  }

  /**
   * Updates the Data Lance system: checks fire input, enforces cooldown,
   * spawns bolts, moves active bolts, and deactivates out-of-range bolts.
   */
  update(dt: number): void {
    this.cooldown = Math.max(0, this.cooldown - dt);

    if (this.inputManager.isActive('fire') && this.cooldown <= 0) {
      this.fireTwinBolts();
      this.cooldown = DATA_LANCE_FIRE_RATE;
    }

    this.updateBolts(dt);
  }

  /**
   * Fires twin bolts from both actuator arm tips with slight inward convergence.
   */
  private fireTwinBolts(): void {
    this.fireFromArm(LEFT_ARM_TIP, CONVERGENCE_ANGLE);
    this.fireFromArm(RIGHT_ARM_TIP, -CONVERGENCE_ANGLE);

    // Trigger cockpit recoil (cosmetic only)
    this.cockpitRenderer.recoilArms(1.0);

    Logger.debug('Weapon', 'Data Lance fired (twin bolts)');
  }

  /**
   * Fires a single bolt from the given arm tip position (in camera-local space)
   * with an optional horizontal convergence offset.
   */
  private fireFromArm(armLocal: THREE.Vector3, yawOffset: number): void {
    const bolt = this.acquireBolt();
    if (!bolt) return;

    // Convert arm tip from camera-local to world space
    this.tempArmWorld.copy(armLocal);
    this.camera.localToWorld(this.tempArmWorld);
    bolt.mesh.position.copy(this.tempArmWorld);

    // Get camera forward direction, then apply slight inward yaw
    this.camera.getWorldDirection(this.tempDirection);
    if (yawOffset !== 0) {
      const cos = Math.cos(yawOffset);
      const sin = Math.sin(yawOffset);
      const dx = this.tempDirection.x;
      const dz = this.tempDirection.z;
      this.tempDirection.x = dx * cos - dz * sin;
      this.tempDirection.z = dx * sin + dz * cos;
      this.tempDirection.normalize();
    }

    bolt.direction.copy(this.tempDirection);

    // Orient the bolt mesh to face along its travel direction
    bolt.mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 0, -1),
      this.tempDirection,
    );

    // Activate bolt
    bolt.active = true;
    bolt.distance = 0;
    bolt.mesh.visible = true;
  }

  /**
   * Finds and returns the first inactive bolt from the pool.
   * Returns undefined if all bolts are in use (pool exhaustion).
   */
  private acquireBolt(): BoltData | undefined {
    for (const bolt of this.bolts) {
      if (!bolt.active) return bolt;
    }
    return undefined;
  }

  /**
   * Moves all active bolts forward and deactivates those that
   * exceed the maximum range.
   */
  private updateBolts(dt: number): void {
    for (const bolt of this.bolts) {
      if (!bolt.active) continue;

      const moveDistance = DATA_LANCE_BOLT_SPEED * dt;
      bolt.mesh.position.addScaledVector(bolt.direction, moveDistance);
      bolt.distance += moveDistance;

      if (bolt.distance > DATA_LANCE_MAX_RANGE) {
        this.deactivateBolt(bolt);
      }
    }
  }

  /**
   * Deactivates a bolt and returns it to the pool.
   */
  private deactivateBolt(bolt: BoltData): void {
    bolt.active = false;
    bolt.mesh.visible = false;
    bolt.distance = 0;
  }

  /**
   * Removes all bolt meshes from the scene and disposes their geometries.
   * Material is managed by VectorMaterials and not disposed here.
   */
  dispose(): void {
    for (const bolt of this.bolts) {
      this.scene.remove(bolt.mesh);
      bolt.mesh.geometry.dispose();
    }
    this.bolts.length = 0;
  }
}
