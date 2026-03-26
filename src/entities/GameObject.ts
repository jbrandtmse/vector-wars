/**
 * GameObject — Abstract base class for all game entities.
 *
 * Owns a THREE.Object3D (scene graph node), an invisible THREE.Sphere
 * bounding collider, and an `isActive` flag. Subclasses implement `update(dt)`.
 *
 * Created by: Story 2-2
 */

import * as THREE from 'three';
import { BLOOM_LAYER } from '../config/constants.ts';

export abstract class GameObject {
  protected object3D: THREE.Object3D;
  protected collider: THREE.Sphere;
  private active: boolean = true;

  constructor(colliderRadius: number = 1.0) {
    this.object3D = new THREE.Object3D();
    this.collider = new THREE.Sphere(new THREE.Vector3(), colliderRadius);
  }

  abstract update(dt: number): void;

  get isActive(): boolean {
    return this.active;
  }

  setActive(value: boolean): void {
    this.active = value;
  }

  getObject3D(): THREE.Object3D {
    return this.object3D;
  }

  getPosition(): THREE.Vector3 {
    return this.object3D.position;
  }

  getCollider(): THREE.Sphere {
    return this.collider;
  }

  /** Call in subclass constructors after adding geometry to object3D */
  protected enableBloomOnChildren(): void {
    this.object3D.traverse((child) => {
      child.layers.enable(BLOOM_LAYER);
    });
  }

  /** Sync collider center to object3D position -- call in update() */
  protected syncCollider(): void {
    this.collider.center.copy(this.object3D.position);
  }
}
