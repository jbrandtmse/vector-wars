/**
 * AttackState — AI state that fires one data burst at the player and transitions back.
 *
 * Receives a fire callback via constructor (does NOT import EnemyProjectileSystem).
 * Uses playerPositionGetter to aim without importing camera or Player.
 * Fires once per entry, then transitions to nextState (or EvadeState if evasion triggers).
 *
 * Evasion: When evasionReturnState is provided and Math.random() < evasionChance,
 * the enemy enters EvadeState instead of returning to the normal nextState.
 * This is part of the behavioral evolution system (Story 5-7).
 *
 * Created by: Story 2-5
 * Updated by: Story 5-7 (added evasion support)
 */

import * as THREE from 'three';
import { EvadeState } from './EvadeState.ts';
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
  private evasionReturnState: AIState | undefined;
  private fired = false;

  // Pre-allocated temp vector for enemy position read
  private tempOrigin = new THREE.Vector3();

  constructor(
    fireCallback: FireCallback,
    playerPositionGetter: () => THREE.Vector3,
    nextState: AIState,
    evasionReturnState?: AIState,
  ) {
    this.fireCallback = fireCallback;
    this.playerPositionGetter = playerPositionGetter;
    this.nextState = nextState;
    this.evasionReturnState = evasionReturnState;
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

    // Evasion check: if evasionReturnState is wired and random check passes, evade
    if (this.evasionReturnState !== undefined) {
      const evasionChance = enemy.getEffectiveParams().evasionChance;
      if (evasionChance > 0 && Math.random() < evasionChance) {
        enemy.transitionToState(
          new EvadeState(this.playerPositionGetter, this.evasionReturnState),
        );
        return;
      }
    }

    // Normal transition back to patrol/pursuit/block/overseer
    enemy.transitionToState(this.nextState);
  }

  exit(_enemy: Enemy): void {
    // No cleanup needed
  }
}
