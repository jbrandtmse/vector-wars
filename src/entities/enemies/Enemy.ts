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
import { DestroyedState } from '../../ai/states/DestroyedState.ts';
import { eventBus } from '../../core/GameEvents.ts';
import { Logger } from '../../core/Logger.ts';
import type { AIState } from '../../ai/AIState.ts';
import type { BehaviorParams } from '../../ai/BehaviorParams.ts';
import type { Poolable } from '../../core/ObjectPool.ts';

export abstract class Enemy extends GameObject implements Poolable {
  private static nextId = 0;
  public readonly id: number = Enemy.nextId++;

  public health: number;
  protected maxHealth: number;
  public scoreValue: number;
  public params: BehaviorParams;
  protected currentState: AIState | null = null;
  private spawnPosition = new THREE.Vector3();
  private flashTimer = 0;

  constructor(
    health: number,
    scoreValue: number,
    params: BehaviorParams,
    colliderRadius: number,
  ) {
    super(colliderRadius);
    this.health = health;
    this.maxHealth = health;
    this.scoreValue = scoreValue;
    this.params = params;
  }

  reset(): void {
    this.health = this.maxHealth;
    this.setActive(false);
    this.object3D.visible = false;
    this.object3D.position.set(0, -1000, 0);
    this.object3D.scale.setScalar(1.0);
    this.currentState = null;
    this.flashTimer = 0;
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

  takeDamage(amount: number): void {
    this.health -= amount;
    this.onHit();
    if (this.health <= 0) {
      this.onDestroyed();
    }
  }

  protected onHit(): void {
    // Brief flash -- increase scale to create visible "pulse" effect
    // Subclasses can override for custom hit effects
    this.flashTimer = 0.1; // seconds of flash remaining
    this.setFlashState(true);
  }

  protected onDestroyed(): void {
    this.transitionToState(new DestroyedState());
    eventBus.emit('enemyDestroyed', {
      enemy: this,
      position: {
        x: this.object3D.position.x,
        y: this.object3D.position.y,
        z: this.object3D.position.z,
      },
    });
    Logger.info('Combat', `Enemy destroyed`, { id: this.id, scoreValue: this.scoreValue });
  }

  protected setFlashState(flashing: boolean): void {
    // Scale up slightly when hit to create a visible "pulse" effect
    const scale = flashing ? 1.4 : 1.0;
    this.object3D.scale.setScalar(scale);
  }

  update(dt: number): void {
    // Hit flash timer
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      this.setFlashState(this.flashTimer > 0);
    }

    if (this.currentState) {
      this.currentState.update(this, dt);
    }
    // Sync collider position to object3D position
    this.syncCollider();
  }
}
