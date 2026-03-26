/**
 * SceneEnvironment — Creates and manages the cyberspace environment
 * (grid ground plane and starfield background).
 *
 * The grid is a manually-built LineSegments mesh on the XZ plane using
 * VectorMaterials for palette compatibility. The starfield is a Points
 * mesh with a manually-created PointsMaterial.
 *
 * Both meshes are static — no per-frame updates needed for Epic 1.
 */

import * as THREE from 'three';
import type { VectorMaterials } from './VectorMaterials.ts';
import { getActivePalette } from './ColorPalette.ts';
import {
  BLOOM_LAYER,
  GRID_SIZE,
  GRID_DIVISIONS,
  GRID_Y_POSITION,
  GRID_LIGHTNESS_OFFSET,
  STARFIELD_COUNT,
  STARFIELD_SPREAD,
  STARFIELD_MIN_Y,
  STARFIELD_POINT_SIZE,
  STARFIELD_LIGHTNESS_OFFSET,
} from '../config/constants.ts';

export class SceneEnvironment {
  private scene: THREE.Scene;
  private grid: THREE.LineSegments;
  private starfield: THREE.Points;
  private starfieldMaterial: THREE.PointsMaterial;

  constructor(scene: THREE.Scene, vectorMaterials: VectorMaterials) {
    this.scene = scene;
    this.grid = this.createGrid(vectorMaterials);
    const { points, material } = this.createStarfield();
    this.starfield = points;
    this.starfieldMaterial = material;
  }

  private createGrid(vectorMaterials: VectorMaterials): THREE.LineSegments {
    const positions: number[] = [];
    const halfSize = GRID_SIZE / 2;
    const step = GRID_SIZE / GRID_DIVISIONS;

    for (let i = 0; i <= GRID_DIVISIONS; i++) {
      const pos = -halfSize + i * step;
      // Line along Z at this X position
      positions.push(pos, 0, -halfSize, pos, 0, halfSize);
      // Line along X at this Z position
      positions.push(-halfSize, 0, pos, halfSize, 0, pos);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3),
    );

    const material = vectorMaterials.create('environment-grid', GRID_LIGHTNESS_OFFSET);
    const mesh = new THREE.LineSegments(geometry, material);
    mesh.position.y = GRID_Y_POSITION;
    mesh.layers.enable(BLOOM_LAYER);
    this.scene.add(mesh);

    return mesh;
  }

  private createStarfield(): { points: THREE.Points; material: THREE.PointsMaterial } {
    const positions = new Float32Array(STARFIELD_COUNT * 3);
    const halfSpread = STARFIELD_SPREAD / 2;

    for (let i = 0; i < STARFIELD_COUNT; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * STARFIELD_SPREAD;       // X
      positions[i3 + 1] = STARFIELD_MIN_Y + Math.random() * (halfSpread - STARFIELD_MIN_Y); // Y: biased above grid
      positions[i3 + 2] = (Math.random() - 0.5) * STARFIELD_SPREAD;   // Z
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const palette = getActivePalette();
    const color = new THREE.Color();
    color.setHSL(
      palette.hue,
      palette.saturation,
      Math.max(0, Math.min(1, palette.lightness + STARFIELD_LIGHTNESS_OFFSET)),
    );

    const material = new THREE.PointsMaterial({
      color,
      size: STARFIELD_POINT_SIZE,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    // Do NOT enable bloom layer on starfield — stars should be subtle background
    this.scene.add(points);

    return { points, material };
  }

  /**
   * Updates the starfield PointsMaterial color from the current active palette.
   * Called when VectorMaterials.setPalette() is used in future levels.
   */
  updatePalette(): void {
    const palette = getActivePalette();
    this.starfieldMaterial.color.setHSL(
      palette.hue,
      palette.saturation,
      Math.max(0, Math.min(1, palette.lightness + STARFIELD_LIGHTNESS_OFFSET)),
    );
  }

  /**
   * Removes grid and starfield from scene and disposes all geometries
   * and the starfield PointsMaterial.
   *
   * Note: The grid's LineBasicMaterial is NOT disposed here — it is owned
   * and managed by VectorMaterials, which handles its lifecycle via
   * VectorMaterials.dispose().
   */
  dispose(): void {
    this.scene.remove(this.grid);
    this.grid.geometry.dispose();

    this.scene.remove(this.starfield);
    this.starfield.geometry.dispose();
    this.starfieldMaterial.dispose();
  }
}
