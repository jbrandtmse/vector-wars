/**
 * ScorePopup — Floating score popups at enemy destruction points.
 *
 * Renders "+100" style score values as seven-segment vector line digits
 * at world-space kill locations. Popups float upward and fade out.
 * Uses a pre-allocated fixed-size pool for zero GC during gameplay.
 *
 * Subscribes to enemyDestroyed events via EventBus -- does NOT import
 * ScoreManager, CollisionSystem, or any other system.
 *
 * Created by: Story 2-8
 */

import * as THREE from 'three';
import {
  BLOOM_LAYER,
  SCORE_POPUP_POOL_SIZE,
  SCORE_POPUP_LIFETIME,
  SCORE_POPUP_FLOAT_SPEED,
  SCORE_POPUP_SCALE,
  SCORE_POPUP_MAX_DIGITS,
} from '../../config/constants.ts';
import { eventBus } from '../../core/GameEvents.ts';
import { Logger } from '../../core/Logger.ts';
import type { VectorMaterials } from '../../rendering/VectorMaterials.ts';
import { SEGMENTS, DIGIT_SEGMENTS } from './SevenSegmentData.ts';

interface PopupInstance {
  group: THREE.Group;
  digitMeshes: THREE.LineSegments[];
  plusMesh: THREE.LineSegments;
  material: THREE.LineBasicMaterial;
  active: boolean;
  elapsed: number;
}

// Digit dimensions for world-space popups (same proportions as HUD digits)
const DIGIT_WIDTH = 0.6;
const DIGIT_HEIGHT = 0.9;
const DIGIT_SPACING = 0.15;

export class ScorePopup {
  private pool: PopupInstance[] = [];
  private tempPosition = new THREE.Vector3();
  private enemyDestroyedHandler: (data: {
    enemy: { scoreValue: number };
    position: { x: number; y: number; z: number };
  }) => void;

  constructor(scene: THREE.Scene, vectorMaterials: VectorMaterials) {
    // Pre-allocate popup pool
    for (let i = 0; i < SCORE_POPUP_POOL_SIZE; i++) {
      const group = new THREE.Group();
      group.visible = false;
      group.scale.setScalar(SCORE_POPUP_SCALE);

      // Each popup gets its own material for independent opacity
      const material = vectorMaterials.create(`score-popup-${i}`);
      material.transparent = true;
      material.opacity = 1.0;

      const digitMeshes: THREE.LineSegments[] = [];

      // Create digit meshes (SCORE_POPUP_MAX_DIGITS)
      for (let d = 0; d < SCORE_POPUP_MAX_DIGITS; d++) {
        const geometry = new THREE.BufferGeometry();
        // 7 segments max x 2 vertices x 3 floats = 42 floats
        const positions = new Float32Array(42);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mesh = new THREE.LineSegments(geometry, material);
        mesh.layers.enable(BLOOM_LAYER);
        // Position each digit to the right of the "+" prefix
        // "+" occupies slot 0, digits start at slot 1
        mesh.position.x = (d + 1) * (DIGIT_WIDTH + DIGIT_SPACING);
        mesh.visible = false;
        group.add(mesh);
        digitMeshes.push(mesh);
      }

      // Create "+" prefix mesh
      const plusGeometry = new THREE.BufferGeometry();
      const plusPositions = new Float32Array([
        // Horizontal bar
        0.1 * DIGIT_WIDTH, 0.5 * DIGIT_HEIGHT, 0,
        0.9 * DIGIT_WIDTH, 0.5 * DIGIT_HEIGHT, 0,
        // Vertical bar
        0.5 * DIGIT_WIDTH, 0.15 * DIGIT_HEIGHT, 0,
        0.5 * DIGIT_WIDTH, 0.85 * DIGIT_HEIGHT, 0,
      ]);
      plusGeometry.setAttribute('position', new THREE.BufferAttribute(plusPositions, 3));
      const plusMesh = new THREE.LineSegments(plusGeometry, material);
      plusMesh.layers.enable(BLOOM_LAYER);
      plusMesh.position.x = 0;
      plusMesh.visible = false;
      group.add(plusMesh);

      scene.add(group);

      this.pool.push({
        group,
        digitMeshes,
        plusMesh,
        material,
        active: false,
        elapsed: 0,
      });
    }

    // Subscribe to enemy destroyed events
    this.enemyDestroyedHandler = ({ enemy, position }) => {
      this.tempPosition.set(position.x, position.y, position.z);
      this.trigger(this.tempPosition, enemy.scoreValue);
    };
    eventBus.on('enemyDestroyed', this.enemyDestroyedHandler);

    Logger.debug('ScorePopup', 'Pool initialized', { size: SCORE_POPUP_POOL_SIZE });
  }

  trigger(position: THREE.Vector3, scoreValue: number): void {
    // Find first inactive popup
    let popup = this.pool.find((p) => !p.active);

    // If none available, reuse the oldest active popup (highest elapsed)
    if (!popup) {
      let maxElapsed = -1;
      for (const p of this.pool) {
        if (p.elapsed > maxElapsed) {
          maxElapsed = p.elapsed;
          popup = p;
        }
      }
    }

    if (!popup) return;

    // Position the popup group at the destruction point
    popup.group.position.copy(position);

    // Clamp score to displayable range (0-9999)
    const clampedScore = Math.max(0, Math.min(scoreValue, 9999));
    const scoreStr = String(clampedScore);

    // Hide all digit meshes first
    for (const mesh of popup.digitMeshes) {
      mesh.visible = false;
    }

    // Render digits right-to-left (right-aligned within SCORE_POPUP_MAX_DIGITS slots)
    const startIndex = SCORE_POPUP_MAX_DIGITS - scoreStr.length;
    for (let i = 0; i < scoreStr.length; i++) {
      const digitValue = parseInt(scoreStr[i], 10);
      const meshIndex = startIndex + i;
      this.renderDigit(popup.digitMeshes[meshIndex], digitValue);
      popup.digitMeshes[meshIndex].visible = true;
    }

    // Show "+" prefix
    popup.plusMesh.visible = true;

    // Reset state
    popup.elapsed = 0;
    popup.active = true;
    popup.group.visible = true;
    popup.material.opacity = 1.0;
  }

  update(dt: number, camera: THREE.Camera): void {
    for (const popup of this.pool) {
      if (!popup.active) continue;

      popup.elapsed += dt;

      if (popup.elapsed >= SCORE_POPUP_LIFETIME) {
        // Deactivate
        popup.active = false;
        popup.group.visible = false;
        continue;
      }

      // Float upward in world Y
      popup.group.position.y += SCORE_POPUP_FLOAT_SPEED * dt;

      // Fade out linearly
      const opacity = 1.0 - (popup.elapsed / SCORE_POPUP_LIFETIME);
      popup.material.opacity = opacity;

      // Billboard: face the camera
      popup.group.quaternion.copy(camera.quaternion);
    }
  }

  dispose(): void {
    eventBus.off('enemyDestroyed', this.enemyDestroyedHandler);
    for (const popup of this.pool) {
      for (const mesh of popup.digitMeshes) {
        mesh.geometry.dispose();
      }
      popup.plusMesh.geometry.dispose();
    }
    Logger.debug('ScorePopup', 'Disposed');
  }

  private renderDigit(mesh: THREE.LineSegments, digit: number): void {
    const segments = DIGIT_SEGMENTS[digit];
    const positions = mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = positions.array as Float32Array;

    let idx = 0;
    for (const segName of segments) {
      const seg = SEGMENTS[segName];
      arr[idx++] = seg[0] * DIGIT_WIDTH;
      arr[idx++] = seg[1] * DIGIT_HEIGHT;
      arr[idx++] = 0;
      arr[idx++] = seg[2] * DIGIT_WIDTH;
      arr[idx++] = seg[3] * DIGIT_HEIGHT;
      arr[idx++] = 0;
    }
    // Zero out remaining positions
    while (idx < 42) {
      arr[idx++] = 0;
    }
    positions.needsUpdate = true;

    // Update draw range to only render active segments
    mesh.geometry.setDrawRange(0, segments.length * 2);
  }
}
