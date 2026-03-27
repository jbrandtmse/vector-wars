/**
 * EMPBurst — Expanding wireframe sphere visual effect.
 *
 * An icosahedron wireframe that rapidly expands outward from the
 * activation point, fading as it grows, representing the EMP pulse wave.
 * Uses pre-allocated pool pattern: activate/deactivate toggle visibility.
 *
 * GDD: "Punchy and instant. Activation is immediate with a distinctive
 * visual pulse. Enemies visibly stutter/slow. You FEEL the disruption."
 *
 * Created by: Story 3-6
 */

import * as THREE from 'three';
import {
  BLOOM_LAYER,
  EMP_BURST_RADIUS,
  EMP_BURST_VISUAL_DURATION,
} from '../../config/constants.ts';
import type { VectorMaterials } from '../../rendering/VectorMaterials.ts';

// Shared geometry across all pool instances — created once
let sharedGeometry: THREE.EdgesGeometry | null = null;

function getSharedGeometry(): THREE.EdgesGeometry {
  if (!sharedGeometry) {
    const ico = new THREE.IcosahedronGeometry(1, 2);
    sharedGeometry = new THREE.EdgesGeometry(ico);
    ico.dispose(); // Source geometry no longer needed
  }
  return sharedGeometry;
}

export class EMPBurst {
  public readonly mesh: THREE.LineSegments;
  public active = false;
  public lifetime = 0;

  private material: THREE.LineBasicMaterial;

  constructor(vectorMaterials: VectorMaterials, index: number) {
    this.material = vectorMaterials.create(`emp-burst-${index}`, 0.15);
    this.material.transparent = true;
    this.material.depthWrite = false;

    const geometry = getSharedGeometry();
    this.mesh = new THREE.LineSegments(geometry, this.material);
    this.mesh.layers.enable(BLOOM_LAYER);
    this.mesh.visible = false;
  }

  activate(position: THREE.Vector3): void {
    this.mesh.position.copy(position);
    this.lifetime = 0;
    this.active = true;
    this.mesh.visible = true;
    this.material.opacity = 1.0;
    this.mesh.scale.setScalar(0.5);
  }

  deactivate(): void {
    this.active = false;
    this.mesh.visible = false;
  }

  update(dt: number): void {
    if (!this.active) return;

    this.lifetime += dt;
    const t = this.lifetime / EMP_BURST_VISUAL_DURATION;

    if (t >= 1.0) {
      this.deactivate();
      return;
    }

    // Expand from 0.5 to EMP_BURST_RADIUS
    this.mesh.scale.setScalar(0.5 + t * (EMP_BURST_RADIUS - 0.5));
    // Fade opacity from 1.0 to 0.0
    this.material.opacity = 1.0 - t;
  }
}
