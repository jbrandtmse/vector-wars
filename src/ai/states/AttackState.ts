/**
 * AttackState — AI state that fires one data burst at the player and transitions back.
 *
 * Receives a fire callback via constructor (does NOT import EnemyProjectileSystem).
 * Uses playerPositionGetter to aim without importing camera or Player.
 * Fires once per entry, then immediately transitions to nextState (PatrolState).
 *
 * Created by: Story 2-5
 */

import * as THREE from 'three';
import type { AIState } from '../AIState.ts';
import type { Enemy } from '../../entities/enemies/Enemy.ts';

export type FireCallback = (
  origin: THREE.Vector3,
  target: THREE.Vector3,
  speed: number,
  damage: number,
) => void;

export class AttackState implements AIState {
  private fireCallback: FireCallback;
  private playerPositionGetter: () => THREE.Vector3;
  private nextState: AIState;
  private fired = false;

  // Pre-allocated temp vector for enemy position read
  private tempOrigin = new THREE.Vector3();

  constructor(
    fireCallback: FireCallback,
    playerPositionGetter: () => THREE.Vector3,
    nextState: AIState,
  ) {
    this.fireCallback = fireCallback;
    this.playerPositionGetter = playerPositionGetter;
    this.nextState = nextState;
  }

  enter(_enemy: Enemy): void {
    this.fired = false;
  }

  update(enemy: Enemy, _dt: number): void {
    if (this.fired) return;

    // Fire one burst toward the player's current position
    this.tempOrigin.copy(enemy.getObject3D().position);
    const playerPos = this.playerPositionGetter();

    this.fireCallback(
      this.tempOrigin,
      playerPos,
      enemy.getEffectiveParams().projectileSpeed,
      enemy.params.attackDamage,
    );

    this.fired = true;

    // Immediately transition back to patrol
    enemy.transitionToState(this.nextState);
  }

  exit(_enemy: Enemy): void {
    // No cleanup needed
  }
}
