/**
 * RailMovement — Manages camera movement along a CatmullRomCurve3 spline path.
 *
 * The camera follows a predefined rail path through cyberspace at constant speed.
 * Player viewport offset (from arrow keys) is applied relative to the rail direction
 * so that "left" always means left of the travel direction.
 *
 * Created by: Story 2-1
 */

import * as THREE from 'three';
import { CatmullRomCurve3 } from 'three';
import {
  RAIL_SPEED,
  RAIL_PATH_POINTS,
  RAIL_CAMERA_LERP_SPEED,
} from '../config/constants.ts';

const WORLD_UP = new THREE.Vector3(0, 1, 0);
const FALLBACK_UP = new THREE.Vector3(0, 0, 1);

export class RailMovement {
  private camera: THREE.PerspectiveCamera;
  private curve: CatmullRomCurve3;
  private progress: number = 0;
  private totalLength: number;

  // Pre-allocated temp vectors to avoid per-frame GC
  private railPosition = new THREE.Vector3();
  private tangent = new THREE.Vector3();
  private right = new THREE.Vector3();
  private localUp = new THREE.Vector3();
  private targetQuaternion = new THREE.Quaternion();
  private tempMatrix = new THREE.Matrix4();
  private lookTarget = new THREE.Vector3();

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;

    const points = RAIL_PATH_POINTS.map(
      ([x, y, z]) => new THREE.Vector3(x, y, z),
    );
    this.curve = new CatmullRomCurve3(points, true, 'catmullrom', 0.5);
    this.totalLength = this.curve.getLength();
  }

  /**
   * Advances the camera along the rail path by dt seconds.
   * Applies viewport offset in the local rail frame (tangent/right/up).
   */
  update(dt: number, viewportOffset: { x: number; y: number }): void {
    // Advance progress along arc length
    this.progress += (RAIL_SPEED * dt) / this.totalLength;
    // Wrap for seamless looping
    this.progress = this.progress % 1;
    if (this.progress < 0) this.progress += 1;

    // Get rail position and tangent at current progress
    this.curve.getPointAt(this.progress, this.railPosition);
    this.curve.getTangentAt(this.progress, this.tangent);

    // Compute stable local frame via cross products
    // Guard against tangent nearly parallel to world up
    if (Math.abs(this.tangent.dot(WORLD_UP)) > 0.99) {
      this.right.crossVectors(this.tangent, FALLBACK_UP).normalize();
    } else {
      this.right.crossVectors(this.tangent, WORLD_UP).normalize();
    }
    this.localUp.crossVectors(this.right, this.tangent).normalize();

    // Apply viewport offset in local rail coordinate frame
    this.camera.position.copy(this.railPosition);
    this.camera.position.addScaledVector(this.right, viewportOffset.x);
    this.camera.position.addScaledVector(this.localUp, viewportOffset.y);

    // Smoothly interpolate camera orientation toward forward direction
    this.lookTarget.copy(this.railPosition).add(this.tangent);
    this.tempMatrix.lookAt(this.railPosition, this.lookTarget, this.localUp);
    this.targetQuaternion.setFromRotationMatrix(this.tempMatrix);

    const lerpFactor = Math.min(1, RAIL_CAMERA_LERP_SPEED * dt);
    this.camera.quaternion.slerp(this.targetQuaternion, lerpFactor);
  }

  /**
   * Returns the current normalized progress (0-1) along the rail path.
   */
  getRailProgress(): number {
    return this.progress;
  }

  /**
   * Returns a copy of the current world position on the rail.
   */
  getRailPosition(): THREE.Vector3 {
    return this.railPosition.clone();
  }
}
