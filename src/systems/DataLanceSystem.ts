/**
 * DataLanceSystem — Manages Data Lance bolt firing, pooling, and movement.
 *
 * Implements the primary weapon system for Epic 1. Uses a lightweight
 * pre-allocated bolt pool (not the full ObjectPool<T> from Epic 2) with
 * visibility toggling to avoid GC pauses and scene graph mutations.
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
  private tempPosition = new THREE.Vector3();
  private tempDirection = new THREE.Vector3();

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

    // Create bolt geometry template — cross-shaped so it's visible from behind
    // Main shaft along Z + horizontal crossbar for visibility from any angle
    const halfLen = DATA_LANCE_BOLT_LENGTH / 2;
    const crossSize = 0.03;
    const positions = new Float32Array([
      // Main shaft (along -Z)
      0, 0, halfLen,                     // tail
      0, 0, -halfLen,                    // head
      // Horizontal crossbar at midpoint
      -crossSize, 0, 0,
      crossSize, 0, 0,
      // Vertical crossbar at midpoint
      0, -crossSize, 0,
      0, crossSize, 0,
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
      this.fireBolt();
      this.cooldown = DATA_LANCE_FIRE_RATE;
    }

    this.updateBolts(dt);
  }

  /**
   * Fires a single bolt from the camera's current position along
   * the camera's look direction.
   */
  private fireBolt(): void {
    const bolt = this.acquireBolt();
    if (!bolt) return;

    // Orient bolt along camera look direction
    this.camera.getWorldDirection(this.tempDirection);
    bolt.direction.copy(this.tempDirection);
    bolt.mesh.quaternion.copy(this.camera.quaternion);

    // Position bolt slightly ahead of camera so it spawns visible (past the cockpit)
    this.camera.getWorldPosition(this.tempPosition);
    this.tempPosition.addScaledVector(this.tempDirection, 2.0);
    bolt.mesh.position.copy(this.tempPosition);

    // Activate bolt
    bolt.active = true;
    bolt.distance = 0;
    bolt.mesh.visible = true;

    // Trigger cockpit recoil (cosmetic only)
    this.cockpitRenderer.recoilArms(1.0);

    // Placeholder SFX trigger (actual audio is Epic 4)
    Logger.debug('Weapon', 'Data Lance fired', {
      x: this.tempPosition.x,
      y: this.tempPosition.y,
      z: this.tempPosition.z,
    });
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
