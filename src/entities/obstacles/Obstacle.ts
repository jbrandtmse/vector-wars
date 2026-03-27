/**
 * Obstacle — Base class for corridor environmental hazards.
 *
 * NOT an Enemy — obstacles are environmental geometry that damages
 * the player on contact. Uses Box3 collision instead of sphere.
 * Not pooled — pre-placed at fixed positions, static count.
 *
 * Created by: Story 3-4
 */
import * as THREE from 'three';

export abstract class Obstacle {
  protected object3D: THREE.Object3D;
  protected collider: THREE.Box3;
  protected active: boolean = true;

  constructor() {
    this.object3D = new THREE.Object3D();
    this.collider = new THREE.Box3();
  }

  abstract update(dt: number): void;

  get isActive(): boolean {
    return this.active;
  }

  getObject3D(): THREE.Object3D {
    return this.object3D;
  }

  checkCollision(playerSphere: THREE.Sphere): boolean {
    if (!this.active) return false;
    return this.collider.intersectsSphere(playerSphere);
  }

  dispose(): void {
    // Subclasses override to dispose geometry/material
  }
}
