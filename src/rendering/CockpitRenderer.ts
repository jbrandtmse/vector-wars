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
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { BLOOM_LAYER, RECOIL_INTENSITY, RECOIL_RECOVERY_SPEED } from '../config/constants.ts';
import type { VectorMaterials } from './VectorMaterials.ts';

const COCKPIT_LINE_WIDTH = 2.5;
const FRAME_LINE_WIDTH = 2.0;

export class CockpitRenderer {
  private cockpitGroup: THREE.Group;
  private camera: THREE.PerspectiveCamera;
  private geometries: LineSegmentsGeometry[] = [];
  private recoilOffset = 0;
  private restZ = -1.5;

  constructor(camera: THREE.PerspectiveCamera, vectorMaterials: VectorMaterials) {
    this.camera = camera;
    this.cockpitGroup = new THREE.Group();
    this.cockpitGroup.position.set(0, -0.1, -1.5);

    // --- Left Actuator Arm (fat lines) ---
    const leftArmGeometry = this.createFatGeometry(this.getLeftArmPositions());
    const leftArmMaterial = vectorMaterials.createFat('cockpit-arm-left', COCKPIT_LINE_WIDTH);
    const leftArm = new LineSegments2(leftArmGeometry, leftArmMaterial);
    leftArm.layers.enable(BLOOM_LAYER);
    this.cockpitGroup.add(leftArm);
    this.geometries.push(leftArmGeometry);

    // --- Right Actuator Arm (mirrored, fat lines) ---
    const rightArmGeometry = this.createFatGeometry(this.getRightArmPositions());
    const rightArmMaterial = vectorMaterials.createFat('cockpit-arm-right', COCKPIT_LINE_WIDTH);
    const rightArm = new LineSegments2(rightArmGeometry, rightArmMaterial);
    rightArm.layers.enable(BLOOM_LAYER);
    this.cockpitGroup.add(rightArm);
    this.geometries.push(rightArmGeometry);

    // --- Cockpit Frame (fat lines, slightly dimmer) ---
    const frameGeometry = this.createFatGeometry(this.getFramePositions());
    const frameMaterial = vectorMaterials.createFat('cockpit-frame', FRAME_LINE_WIDTH, -0.1);
    const frame = new LineSegments2(frameGeometry, frameMaterial);
    frame.layers.enable(BLOOM_LAYER);
    this.cockpitGroup.add(frame);
    this.geometries.push(frameGeometry);

    // Parent to camera so it follows the view automatically
    camera.add(this.cockpitGroup);
  }

  /**
   * Creates a LineSegmentsGeometry from a flat positions array.
   */
  private createFatGeometry(positions: number[]): LineSegmentsGeometry {
    const geometry = new LineSegmentsGeometry();
    geometry.setPositions(positions);
    return geometry;
  }

  private getLeftArmPositions(): number[] {
    return [
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
    ];
  }

  private getRightArmPositions(): number[] {
    return [
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
    ];
  }

  private getFramePositions(): number[] {
    return [
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
    ];
  }

  /**
   * Recoil animation for actuator arms when firing weapons.
   * Applies an immediate backward offset on the cockpit group Z axis.
   * @param intensity Recoil strength (0-1)
   */
  recoilArms(intensity: number): void {
    this.recoilOffset = -RECOIL_INTENSITY * intensity;
    this.cockpitGroup.position.z = this.restZ + this.recoilOffset;
  }

  /**
   * Updates the cockpit recoil recovery animation.
   * Lerps the recoil offset back toward zero (rest position).
   * @param dt Delta time in seconds
   */
  update(dt: number): void {
    if (this.recoilOffset === 0) return;
    this.recoilOffset = this.recoilOffset * Math.max(0, 1 - RECOIL_RECOVERY_SPEED * dt);
    // Snap to zero when very close to prevent infinite approach
    if (Math.abs(this.recoilOffset) < 0.001) this.recoilOffset = 0;
    this.cockpitGroup.position.z = this.restZ + this.recoilOffset;
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
