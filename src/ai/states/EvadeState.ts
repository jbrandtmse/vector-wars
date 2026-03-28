/**
 * EvadeState — AI state that moves the enemy away from the player briefly after attacking.
 *
 * Picks a random evasion direction perpendicular to line-of-sight, moves the enemy
 * along it for EVASION_DURATION seconds, then transitions to the returnState.
 *
 * Part of the behavioral evolution system (Story 5-7): enemies with evasionChance > 0
 * may enter this state after firing, making them harder to hit in Levels 2 and 3.
 *
 * Created by: Story 5-7
 */

import * as THREE from 'three';
import type { AIState } from '../AIState.ts';
import type { Enemy } from '../../entities/enemies/Enemy.ts';
import { EVASION_SPEED_MULTIPLIER, EVASION_DURATION } from '../../config/constants.ts';

export class EvadeState implements AIState {
  private playerPositionGetter: () => THREE.Vector3;
  private returnState: AIState;
  private timer = 0;

  // Pre-allocated temp vectors for zero-allocation per-frame evasion
  private evasionDir = new THREE.Vector3();
  private toPlayer = new THREE.Vector3();

  constructor(
    playerPositionGetter: () => THREE.Vector3,
    returnState: AIState,
  ) {
    this.playerPositionGetter = playerPositionGetter;
    this.returnState = returnState;
  }

  enter(enemy: Enemy): void {
    this.timer = 0;

    // Compute evasion direction: perpendicular to line-of-sight to player
    const playerPos = this.playerPositionGetter();
    this.toPlayer.subVectors(playerPos, enemy.getObject3D().position);
    this.toPlayer.normalize();

    // Cross with world up to get a lateral direction
    // If toPlayer is nearly vertical, use world forward instead
    const upRef = Math.abs(this.toPlayer.y) > 0.9
      ? new THREE.Vector3(0, 0, 1)
      : new THREE.Vector3(0, 1, 0);
    this.evasionDir.crossVectors(this.toPlayer, upRef).normalize();

    // Randomly flip direction and add a random Y component for variety
    if (Math.random() > 0.5) {
      this.evasionDir.negate();
    }
    this.evasionDir.y += (Math.random() - 0.5) * 0.6;
    this.evasionDir.normalize();
  }

  update(enemy: Enemy, dt: number): void {
    this.timer += dt;

    if (this.timer >= EVASION_DURATION) {
      enemy.transitionToState(this.returnState);
      return;
    }

    // Move along evasion direction at patrolSpeed * EVASION_SPEED_MULTIPLIER
    const speed = enemy.getEffectiveParams().patrolSpeed * EVASION_SPEED_MULTIPLIER;
    enemy.getObject3D().position.addScaledVector(this.evasionDir, speed * dt);
  }

  exit(_enemy: Enemy): void {
    // No cleanup needed
  }
}
