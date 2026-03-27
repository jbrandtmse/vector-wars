/**
 * PursuitState — AI state that moves the enemy toward the player's position.
 *
 * Smoothly closes distance to the player each frame using delta-time based
 * movement. Maintains a minimum engagement distance to prevent stacking.
 * Transitions to AttackState after WATCHDOG_ATTACK_INTERVAL seconds.
 *
 * Receives playerPositionGetter via constructor (same pattern as AttackState).
 * Does NOT import Player, Camera, or any system directly.
 *
 * Created by: Story 3-1
 */

import * as THREE from 'three';
import type { AIState } from '../AIState.ts';
import type { Enemy } from '../../entities/enemies/Enemy.ts';
import {
  WATCHDOG_PURSUIT_SPEED_MULTIPLIER,
  WATCHDOG_MIN_ENGAGE_DISTANCE,
  WATCHDOG_ATTACK_INTERVAL,
} from '../../config/constants.ts';

// Orbit behavior constants (engagement phase)
const ORBIT_SPEED_FACTOR = 0.8;     // multiplied with patrolSpeed for orbit rate
const ORBIT_Y_BOB_AMPLITUDE = 0.3;  // slight vertical bobbing during orbit
const ORBIT_LERP_SPEED = 2.0;       // smoothing speed toward orbit position

export class PursuitState implements AIState {
  private playerPositionGetter: () => THREE.Vector3;
  private createAttackState: (() => AIState) | null;
  private attackTimer = 0;

  // Pre-allocated temp vectors for zero-allocation per-frame pursuit
  private direction = new THREE.Vector3();
  private targetPos = new THREE.Vector3();

  constructor(
    playerPositionGetter: () => THREE.Vector3,
    createAttackState?: () => AIState,
  ) {
    this.playerPositionGetter = playerPositionGetter;
    this.createAttackState = createAttackState ?? null;
  }

  enter(_enemy: Enemy): void {
    this.attackTimer = 0;
  }

  update(enemy: Enemy, dt: number): void {
    const playerPos = this.playerPositionGetter();
    const enemyObj = enemy.getObject3D();

    // Compute direction and distance to player
    this.direction.subVectors(playerPos, enemyObj.position);
    const distance = this.direction.length();

    // Move toward player if beyond minimum engagement distance
    if (distance > WATCHDOG_MIN_ENGAGE_DISTANCE) {
      this.direction.normalize();
      const speed = enemy.params.patrolSpeed * WATCHDOG_PURSUIT_SPEED_MULTIPLIER;
      enemyObj.position.addScaledVector(this.direction, speed * dt);
    } else {
      // Within engagement range -- strafe/orbit around player
      // Use a simple orbit in the XZ plane relative to player position
      const orbitSpeed = enemy.params.patrolSpeed * ORBIT_SPEED_FACTOR;
      const angle = this.attackTimer * orbitSpeed;
      this.targetPos.set(
        playerPos.x + Math.cos(angle) * WATCHDOG_MIN_ENGAGE_DISTANCE,
        enemyObj.position.y + Math.sin(angle * 0.5) * ORBIT_Y_BOB_AMPLITUDE,
        playerPos.z + Math.sin(angle) * WATCHDOG_MIN_ENGAGE_DISTANCE,
      );
      // Smooth interpolation toward orbit position
      enemyObj.position.lerp(this.targetPos, ORBIT_LERP_SPEED * dt);
    }

    // Attack timer -- transition to AttackState after interval
    if (this.createAttackState) {
      this.attackTimer += dt;
      if (this.attackTimer >= WATCHDOG_ATTACK_INTERVAL) {
        enemy.transitionToState(this.createAttackState());
      }
    }
  }

  exit(_enemy: Enemy): void {
    // No cleanup needed
  }
}
