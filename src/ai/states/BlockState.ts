/**
 * BlockState — AI state that positions the enemy in the player's forward path.
 *
 * Smoothly moves to a blocking position ahead of the player each frame.
 * Adds lateral sway to make the Gatekeeper harder to shoot past.
 * Transitions to AttackState after GATEKEEPER_ATTACK_INTERVAL seconds.
 *
 * Receives playerPositionGetter and railDirectionGetter via constructor.
 * Does NOT import Player, Camera, RailMovement, or any system directly.
 *
 * Created by: Story 3-2
 */

import * as THREE from 'three';
import type { AIState } from '../AIState.ts';
import type { Enemy } from '../../entities/enemies/Enemy.ts';
import {
  GATEKEEPER_BLOCK_DISTANCE,
  GATEKEEPER_BLOCK_SPEED_MULTIPLIER,
  GATEKEEPER_LATERAL_SWAY,
  GATEKEEPER_SWAY_FREQUENCY,
  GATEKEEPER_ATTACK_INTERVAL,
} from '../../config/constants.ts';

export class BlockState implements AIState {
  private playerPositionGetter: () => THREE.Vector3;
  private railDirectionGetter: () => THREE.Vector3;
  private createAttackState: (() => AIState) | null;
  private elapsedTime = 0;

  // Pre-allocated temp vectors for zero-allocation per-frame blocking
  private blockTarget = new THREE.Vector3();
  private railDir = new THREE.Vector3();
  private lateralDir = new THREE.Vector3();

  constructor(
    playerPositionGetter: () => THREE.Vector3,
    railDirectionGetter: () => THREE.Vector3,
    createAttackState?: () => AIState,
  ) {
    this.playerPositionGetter = playerPositionGetter;
    this.railDirectionGetter = railDirectionGetter;
    this.createAttackState = createAttackState ?? null;
  }

  enter(_enemy: Enemy): void {
    this.elapsedTime = 0;
  }

  update(enemy: Enemy, dt: number): void {
    this.elapsedTime += dt;
    const playerPos = this.playerPositionGetter();
    const enemyObj = enemy.getObject3D();

    // Get current rail direction and compute blocking position ahead of player
    this.railDir.copy(this.railDirectionGetter());
    this.blockTarget.copy(playerPos);
    this.blockTarget.addScaledVector(this.railDir, GATEKEEPER_BLOCK_DISTANCE);

    // Add lateral sway perpendicular to rail direction
    // Cross rail direction with world up to get lateral axis
    // (-railDir.z, 0, railDir.x) is the 2D perpendicular in the XZ plane
    this.lateralDir.set(-this.railDir.z, 0, this.railDir.x);
    const swayOffset = Math.sin(this.elapsedTime * Math.PI * 2 * GATEKEEPER_SWAY_FREQUENCY) * GATEKEEPER_LATERAL_SWAY;
    this.blockTarget.addScaledVector(this.lateralDir, swayOffset);

    // Smooth, weighty movement toward blocking position
    const lerpSpeed = enemy.getEffectiveParams().patrolSpeed * GATEKEEPER_BLOCK_SPEED_MULTIPLIER;
    enemyObj.position.lerp(this.blockTarget, lerpSpeed * dt);

    // Attack timer -- transition to AttackState after interval
    if (this.createAttackState) {
      if (this.elapsedTime >= GATEKEEPER_ATTACK_INTERVAL) {
        enemy.transitionToState(this.createAttackState());
      }
    }
  }

  exit(_enemy: Enemy): void {
    // No cleanup needed
  }
}
