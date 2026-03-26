/**
 * Enemy — Abstract base class for all enemy entities.
 *
 * Extends GameObject with health, score value, behavior params, AI state machine,
 * and spawn position tracking. Each enemy archetype (Sentinel, Watchdog, etc.)
 * extends this class with specific geometry and defaults.
 *
 * Created by: Story 2-2
 */

import * as THREE from 'three';
import { GameObject } from '../GameObject.ts';
import type { AIState } from '../../ai/AIState.ts';
import type { BehaviorParams } from '../../ai/BehaviorParams.ts';

export abstract class Enemy extends GameObject {
  private static nextId = 0;
  public readonly id: number = Enemy.nextId++;

  public health: number;
  public scoreValue: number;
  public params: BehaviorParams;
  protected currentState: AIState | null = null;
  private spawnPosition = new THREE.Vector3();

  constructor(
    health: number,
    scoreValue: number,
    params: BehaviorParams,
    colliderRadius: number,
  ) {
    super(colliderRadius);
    this.health = health;
    this.scoreValue = scoreValue;
    this.params = params;
  }

  setSpawnPosition(pos: THREE.Vector3): void {
    this.spawnPosition.copy(pos);
    this.object3D.position.copy(pos);
  }

  getSpawnPosition(): THREE.Vector3 {
    return this.spawnPosition;
  }

  transitionToState(state: AIState): void {
    if (this.currentState) this.currentState.exit(this);
    this.currentState = state;
    this.currentState.enter(this);
  }

  update(dt: number): void {
    if (this.currentState) {
      this.currentState.update(this, dt);
    }
    // Sync collider position to object3D position
    this.syncCollider();
  }
}
