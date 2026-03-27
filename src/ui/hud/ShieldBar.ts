/**
 * ShieldBar — HUD component that renders a horizontal shield bar as vector line geometry.
 *
 * Parented to the camera via HUDManager. Subscribes to shieldChanged events
 * on the EventBus -- does NOT import Player directly.
 *
 * Created by: Story 2-6
 */

import * as THREE from 'three';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { BLOOM_LAYER, HUD_SHIELD_BAR_WIDTH, HUD_SHIELD_BAR_HEIGHT } from '../../config/constants.ts';
import { eventBus } from '../../core/GameEvents.ts';
import type { VectorMaterials } from '../../rendering/VectorMaterials.ts';

const HUD_LINE_WIDTH = 2.0;

export class ShieldBar {
  public readonly group: THREE.Group;
  private fillPositions: Float32Array;
  private fillGeometry: THREE.BufferGeometry;
  private borderGeometry: LineSegmentsGeometry;
  private fullWidth: number;
  private shieldChangedHandler: (data: { shields: number; maxShields: number }) => void;

  constructor(vectorMaterials: VectorMaterials) {
    this.group = new THREE.Group();
    this.fullWidth = HUD_SHIELD_BAR_WIDTH;
    const h = HUD_SHIELD_BAR_HEIGHT;
    const w = HUD_SHIELD_BAR_WIDTH;

    // --- Outer border (fat lines for visibility) ---
    this.borderGeometry = new LineSegmentsGeometry();
    this.borderGeometry.setPositions([
      0, 0, 0,  w, 0, 0,
      w, 0, 0,  w, h, 0,
      w, h, 0,  0, h, 0,
      0, h, 0,  0, 0, 0,
    ]);
    const borderMat = vectorMaterials.createFat('hud-shield-border', HUD_LINE_WIDTH, -0.15);
    const borderMesh = new LineSegments2(this.borderGeometry, borderMat);
    borderMesh.layers.enable(BLOOM_LAYER);
    this.group.add(borderMesh);

    // --- Inner fill bar (dynamic width) ---
    // Inset slightly from border
    const inset = h * 0.15;
    this.fillPositions = new Float32Array([
      // bottom-left to bottom-right
      inset, inset, 0,         w - inset, inset, 0,
      // bottom-right to top-right
      w - inset, inset, 0,     w - inset, h - inset, 0,
      // top-right to top-left
      w - inset, h - inset, 0, inset, h - inset, 0,
      // top-left to bottom-left
      inset, h - inset, 0,     inset, inset, 0,
    ]);
    this.fillGeometry = new THREE.BufferGeometry();
    this.fillGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.fillPositions, 3),
    );
    const fillMat = vectorMaterials.create('hud-shield-fill');
    const fillMesh = new THREE.LineSegments(this.fillGeometry, fillMat);
    fillMesh.layers.enable(BLOOM_LAYER);
    this.group.add(fillMesh);

    // Subscribe to shield changes (store reference for disposal)
    this.shieldChangedHandler = ({ shields, maxShields }) => {
      this.updateFill(shields / maxShields);
    };
    eventBus.on('shieldChanged', this.shieldChangedHandler);
  }

  /**
   * Updates the fill bar width to match the shield percentage (0-1).
   * Modifies position attribute in-place -- no geometry recreation.
   */
  updateFill(percent: number): void {
    const p = Math.max(0, Math.min(1, percent));
    const h = HUD_SHIELD_BAR_HEIGHT;
    const inset = h * 0.15;
    const fillRight = inset + (this.fullWidth - 2 * inset) * p;

    // Update X coordinates of right-side vertices (indices 1, 2, 3, 4 -- the vertices at fillRight)
    // Vertex layout: 8 vertices, pairs forming 4 line segments
    // [0] bottom-left, [1] bottom-right, [2] bottom-right, [3] top-right,
    // [4] top-right, [5] top-left, [6] top-left, [7] bottom-left
    this.fillPositions[3] = fillRight;   // vertex 1 x (bottom-right)
    this.fillPositions[6] = fillRight;   // vertex 2 x (bottom-right, start of right edge)
    this.fillPositions[9] = fillRight;   // vertex 3 x (top-right)
    this.fillPositions[12] = fillRight;  // vertex 4 x (top-right, start of top edge)

    const posAttr = this.fillGeometry.getAttribute('position');
    (posAttr as THREE.BufferAttribute).needsUpdate = true;
  }

  /**
   * Unsubscribes from events and disposes geometries.
   * Materials are managed by VectorMaterials singleton and not disposed here.
   */
  dispose(): void {
    eventBus.off('shieldChanged', this.shieldChangedHandler);
    this.borderGeometry.dispose();
    this.fillGeometry.dispose();
  }
}
