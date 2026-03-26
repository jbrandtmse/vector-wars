/**
 * ScoreDisplay — HUD component that renders the current score as seven-segment digits.
 *
 * Uses LineSegments geometry with pre-allocated vertex buffers for each digit position.
 * Subscribes to scoreChanged events on the EventBus -- does NOT import ScoreManager directly.
 *
 * Created by: Story 2-6
 */

import * as THREE from 'three';
import {
  BLOOM_LAYER,
  HUD_SCORE_DIGIT_WIDTH,
  HUD_SCORE_DIGIT_HEIGHT,
  HUD_SCORE_DIGIT_SPACING,
  HUD_SCORE_MAX_DIGITS,
} from '../../config/constants.ts';
import { eventBus } from '../../core/GameEvents.ts';
import type { VectorMaterials } from '../../rendering/VectorMaterials.ts';
import { SEGMENTS, DIGIT_SEGMENTS } from './SevenSegmentData.ts';

export class ScoreDisplay {
  public readonly group: THREE.Group;
  private digitMeshes: THREE.LineSegments[];
  private currentScore = 0;
  private scoreChangedHandler: (data: { score: number }) => void;

  constructor(vectorMaterials: VectorMaterials) {
    this.group = new THREE.Group();
    this.digitMeshes = [];

    // Pre-allocate digit meshes for max digits
    // Each digit gets its own LineSegments mesh with enough vertex buffer
    // for all 7 segments (7 segments x 2 vertices x 3 floats = 42 floats)
    const material = vectorMaterials.create('hud-score');
    for (let i = 0; i < HUD_SCORE_MAX_DIGITS; i++) {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(42); // 7 segments max
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const mesh = new THREE.LineSegments(geometry, material);
      mesh.layers.enable(BLOOM_LAYER);
      mesh.position.x = i * (HUD_SCORE_DIGIT_WIDTH + HUD_SCORE_DIGIT_SPACING);
      mesh.visible = false;
      this.group.add(mesh);
      this.digitMeshes.push(mesh);
    }

    // Subscribe to score changes (store reference for disposal)
    this.scoreChangedHandler = ({ score }) => {
      this.updateScore(score);
    };
    eventBus.on('scoreChanged', this.scoreChangedHandler);

    // Display initial "0"
    this.updateScore(0);
  }

  updateScore(score: number): void {
    this.currentScore = Math.min(score, 999999);
    const scoreStr = String(this.currentScore);

    // Hide all digits first
    for (const mesh of this.digitMeshes) {
      mesh.visible = false;
    }

    // Right-align: display digits from right to left
    const startIndex = HUD_SCORE_MAX_DIGITS - scoreStr.length;
    for (let i = 0; i < scoreStr.length; i++) {
      const digitValue = parseInt(scoreStr[i], 10);
      const meshIndex = startIndex + i;
      this.renderDigit(meshIndex, digitValue);
      this.digitMeshes[meshIndex].visible = true;
    }
  }

  private renderDigit(meshIndex: number, digit: number): void {
    const segments = DIGIT_SEGMENTS[digit];
    const positions = this.digitMeshes[meshIndex].geometry
      .getAttribute('position') as THREE.BufferAttribute;
    const arr = positions.array as Float32Array;

    // Fill segment line pairs
    let idx = 0;
    for (const segName of segments) {
      const seg = SEGMENTS[segName as keyof typeof SEGMENTS];
      arr[idx++] = seg[0] * HUD_SCORE_DIGIT_WIDTH;
      arr[idx++] = seg[1] * HUD_SCORE_DIGIT_HEIGHT;
      arr[idx++] = 0;
      arr[idx++] = seg[2] * HUD_SCORE_DIGIT_WIDTH;
      arr[idx++] = seg[3] * HUD_SCORE_DIGIT_HEIGHT;
      arr[idx++] = 0;
    }
    // Zero out remaining positions
    while (idx < 42) {
      arr[idx++] = 0;
    }
    positions.needsUpdate = true;

    // Update draw range to only render active segments
    this.digitMeshes[meshIndex].geometry.setDrawRange(0, segments.length * 2);
  }

  /**
   * Unsubscribes from events and disposes geometries.
   * Materials are managed by VectorMaterials singleton and not disposed here.
   */
  dispose(): void {
    eventBus.off('scoreChanged', this.scoreChangedHandler);
    for (const mesh of this.digitMeshes) {
      mesh.geometry.dispose();
    }
  }
}
