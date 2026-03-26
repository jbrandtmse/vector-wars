/**
 * ScreenShake — Camera shake effect triggered by damage events.
 *
 * Applies decaying random offsets to camera position in local X/Y space.
 * Uses pre-allocated Vector3 for zero per-frame allocations.
 * Does NOT import any entities or other systems -- architecture compliance.
 *
 * Created by: Story 2-7
 */

import * as THREE from 'three';
import {
  SCREEN_SHAKE_MAX_INTENSITY,
  SCREEN_SHAKE_DECAY_RATE,
} from '../config/constants.ts';
import { Logger } from '../core/Logger.ts';

export class ScreenShake {
  private magnitude = 0;
  private readonly offset = new THREE.Vector3();

  /**
   * Trigger a shake with given intensity (0-1).
   * Intensity is scaled by SCREEN_SHAKE_MAX_INTENSITY to get world-unit magnitude.
   * If a shake is already active, takes the max of current and new magnitude.
   */
  shake(intensity: number): void {
    const newMag = Math.min(1.0, Math.max(0, intensity)) * SCREEN_SHAKE_MAX_INTENSITY;
    this.magnitude = Math.max(this.magnitude, newMag);
    Logger.debug('ScreenShake', 'Shake triggered', { intensity, magnitude: this.magnitude });
  }

  /**
   * Apply shake offset to camera. Call AFTER rail movement, BEFORE render.
   * Modifies camera.position directly -- offset is reset each frame.
   */
  update(dt: number, camera: THREE.Camera): void {
    if (this.magnitude < 0.001) {
      this.magnitude = 0;
      return;
    }

    // Random offset in camera-local X/Y
    this.offset.set(
      (Math.random() * 2 - 1) * this.magnitude,
      (Math.random() * 2 - 1) * this.magnitude,
      0,
    );

    // Transform offset from local to world space using camera quaternion
    this.offset.applyQuaternion(camera.quaternion);

    // Apply to camera position
    camera.position.add(this.offset);

    // Exponential decay
    this.magnitude *= Math.max(0, 1 - SCREEN_SHAKE_DECAY_RATE * dt);
  }
}
