/**
 * CockpitRenderer — Manages the first-person cockpit frame and actuator arm geometry.
 *
 * The cockpit is parented to the camera so it follows the player's view automatically.
 * All geometry is static (no per-frame updates needed) and renders through the
 * selective bloom pipeline via VectorMaterials.
 *
 * Created by: Story 1-3
 */

import * as THREE from 'three';
import { BLOOM_LAYER } from '../config/constants.ts';
import type { VectorMaterials } from './VectorMaterials.ts';

export class CockpitRenderer {
  private cockpitGroup: THREE.Group;
  private camera: THREE.PerspectiveCamera;
  private geometries: THREE.BufferGeometry[] = [];

  constructor(camera: THREE.PerspectiveCamera, vectorMaterials: VectorMaterials) {
    this.camera = camera;
    this.cockpitGroup = new THREE.Group();
    this.cockpitGroup.position.set(0, -0.1, -1.5);

    // --- Left Actuator Arm ---
    const leftArmGeometry = this.createLeftArmGeometry();
    const leftArmMaterial = vectorMaterials.create('cockpit-arm-left');
    const leftArm = new THREE.LineSegments(leftArmGeometry, leftArmMaterial);
    leftArm.layers.enable(BLOOM_LAYER);
    this.cockpitGroup.add(leftArm);
    this.geometries.push(leftArmGeometry);

    // --- Right Actuator Arm (mirrored) ---
    const rightArmGeometry = this.createRightArmGeometry();
    const rightArmMaterial = vectorMaterials.create('cockpit-arm-right');
    const rightArm = new THREE.LineSegments(rightArmGeometry, rightArmMaterial);
    rightArm.layers.enable(BLOOM_LAYER);
    this.cockpitGroup.add(rightArm);
    this.geometries.push(rightArmGeometry);

    // --- Cockpit Frame ---
    const frameGeometry = this.createFrameGeometry();
    const frameMaterial = vectorMaterials.create('cockpit-frame', -0.1);
    const frame = new THREE.LineSegments(frameGeometry, frameMaterial);
    frame.layers.enable(BLOOM_LAYER);
    this.cockpitGroup.add(frame);
    this.geometries.push(frameGeometry);

    // Parent to camera so it follows the view automatically
    camera.add(this.cockpitGroup);
  }

  /**
   * Creates left actuator arm geometry — angular, segmented wireframe shape.
   * Designed as a digital combat program appendage: diagonal strut with
   * crossbar segments and a forward-pointing tip.
   */
  private createLeftArmGeometry(): THREE.BufferGeometry {
    const vertices = new Float32Array([
      // Main strut (diagonal from bottom-left to middle-left)
      -1.0, -0.6, 0.0,    -0.7, -0.2, -0.3,
      // Upper segment
      -0.7, -0.2, -0.3,    -0.6, 0.0, -0.5,
      // Crossbar 1 (lower)
      -0.9, -0.4, -0.1,    -0.7, -0.4, -0.2,
      // Crossbar 2 (upper)
      -0.75, -0.1, -0.35,  -0.55, -0.1, -0.45,
      // Forward tip
      -0.6, 0.0, -0.5,     -0.5, 0.05, -0.7,
      // Lower brace (connects base to crossbar 1)
      -1.0, -0.6, 0.0,     -0.9, -0.4, -0.1,
      // Joint connector
      -0.7, -0.2, -0.3,    -0.75, -0.1, -0.35,
    ]);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    return geometry;
  }

  /**
   * Creates right actuator arm geometry — mirrored version of the left arm
   * (negated X coordinates).
   */
  private createRightArmGeometry(): THREE.BufferGeometry {
    const vertices = new Float32Array([
      // Main strut (mirrored)
      1.0, -0.6, 0.0,     0.7, -0.2, -0.3,
      // Upper segment
      0.7, -0.2, -0.3,     0.6, 0.0, -0.5,
      // Crossbar 1 (lower)
      0.9, -0.4, -0.1,     0.7, -0.4, -0.2,
      // Crossbar 2 (upper)
      0.75, -0.1, -0.35,   0.55, -0.1, -0.45,
      // Forward tip
      0.6, 0.0, -0.5,      0.5, 0.05, -0.7,
      // Lower brace
      1.0, -0.6, 0.0,      0.9, -0.4, -0.1,
      // Joint connector
      0.7, -0.2, -0.3,     0.75, -0.1, -0.35,
    ]);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    return geometry;
  }

  /**
   * Creates cockpit frame geometry — minimal corner brackets and bottom bar
   * that suggest enclosure without blocking the view.
   */
  private createFrameGeometry(): THREE.BufferGeometry {
    const vertices = new Float32Array([
      // Bottom bar
      -0.8, -0.55, 0.0,    0.8, -0.55, 0.0,
      // Bottom-left corner bracket
      -1.1, -0.55, 0.0,    -1.1, -0.35, 0.0,
      -1.1, -0.55, 0.0,    -0.8, -0.55, 0.0,
      // Bottom-right corner bracket
      1.1, -0.55, 0.0,     1.1, -0.35, 0.0,
      1.1, -0.55, 0.0,     0.8, -0.55, 0.0,
      // Top-left corner bracket
      -1.1, 0.55, 0.0,     -1.1, 0.35, 0.0,
      -1.1, 0.55, 0.0,     -0.8, 0.55, 0.0,
      // Top-right corner bracket
      1.1, 0.55, 0.0,      1.1, 0.35, 0.0,
      1.1, 0.55, 0.0,      0.8, 0.55, 0.0,
    ]);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    return geometry;
  }

  /**
   * Recoil animation for actuator arms when firing weapons.
   * @param intensity Recoil strength (0-1)
   */
  recoilArms(intensity: number): void {
    // Recoil animation implemented in Story 1-5
    void intensity;
  }

  /**
   * Spark/damage feedback animation on cockpit.
   */
  sparkDamage(): void {
    // Damage spark animation implemented in Epic 2
  }

  /**
   * Removes cockpit geometry from the camera and disposes all geometries.
   * Materials are managed by VectorMaterials singleton and not disposed here.
   */
  dispose(): void {
    this.camera.remove(this.cockpitGroup);

    for (const geometry of this.geometries) {
      geometry.dispose();
    }
    this.geometries.length = 0;
  }
}
