/**
 * OverseerState — AI state that provides the Overseer's unique coordination behavior.
 *
 * Orbits slowly around spawn position at a higher altitude (commanding position).
 * Periodically scans for nearby enemies and buffs their attack cooldown and movement
 * speed. Transitions to AttackState after attackCooldown, then returns to OverseerState.
 *
 * Receives GameObjectManager via constructor to scan for nearby enemies.
 * Does NOT import any system or call add()/remove() on GameObjectManager.
 *
 * Created by: Story 5-6
 */

import * as THREE from 'three';
import type { AIState } from '../AIState.ts';
import type { Enemy } from '../../entities/enemies/Enemy.ts';
import type { GameObjectManager } from '../../entities/GameObjectManager.ts';
import {
  OVERSEER_BUFF_RADIUS,
  OVERSEER_BUFF_COOLDOWN_MULTIPLIER,
  OVERSEER_BUFF_SPEED_MULTIPLIER,
  OVERSEER_BUFF_INTERVAL,
} from '../../config/constants.ts';

const ORBIT_RADIUS = 2.5;
const Y_ALTITUDE_OFFSET = 2.0;
const Y_BOB_AMPLITUDE = 0.5;
const Y_BOB_FREQUENCY = 0.4;
const BUFF_PULSE_DURATION = 0.3;
const BUFF_PULSE_SCALE = 1.3;

export class OverseerState implements AIState {
  private gameObjectManager: GameObjectManager;
  private createAttackState: (() => AIState) | null;
  private angle = 0;
  private buffTimer = 0;
  private attackTimer = 0;
  private pulseTimer = 0;
  private isPulsing = false;

  // Pre-allocated temp vectors for zero-allocation per-frame
  private tempPosition = new THREE.Vector3();

  constructor(
    gameObjectManager: GameObjectManager,
    _playerPositionGetter: () => THREE.Vector3,
    createAttackState?: () => AIState,
  ) {
    this.gameObjectManager = gameObjectManager;
    this.createAttackState = createAttackState ?? null;
  }

  enter(_enemy: Enemy): void {
    this.angle = 0;
    this.buffTimer = 0;
    this.attackTimer = 0;
    this.pulseTimer = 0;
    this.isPulsing = false;
  }

  update(enemy: Enemy, dt: number): void {
    const params = enemy.getEffectiveParams();

    // Orbit movement around spawn position (elevated for commanding position)
    this.angle += params.patrolSpeed * dt;
    const spawnPos = enemy.getSpawnPosition();
    enemy.getObject3D().position.set(
      spawnPos.x + Math.cos(this.angle) * ORBIT_RADIUS,
      spawnPos.y + Y_ALTITUDE_OFFSET + Math.sin(this.angle * Y_BOB_FREQUENCY) * Y_BOB_AMPLITUDE,
      spawnPos.z + Math.sin(this.angle) * ORBIT_RADIUS,
    );

    // Buff timer — scan and buff nearby enemies periodically
    this.buffTimer += dt;
    if (this.buffTimer >= OVERSEER_BUFF_INTERVAL) {
      this.buffTimer = 0;
      this.applyBuff(enemy);
      // Trigger visual pulse
      this.isPulsing = true;
      this.pulseTimer = 0;
    }

    // Visual buff pulse (scale up then back down)
    if (this.isPulsing) {
      this.pulseTimer += dt;
      const pulseProgress = Math.min(this.pulseTimer / BUFF_PULSE_DURATION, 1.0);
      // Triangle wave: 0->1->0 over duration
      const pulseFactor = pulseProgress <= 0.5
        ? pulseProgress * 2
        : (1 - pulseProgress) * 2;
      const scale = 1.0 + (BUFF_PULSE_SCALE - 1.0) * pulseFactor;
      enemy.getObject3D().scale.setScalar(scale);
      if (pulseProgress >= 1.0) {
        this.isPulsing = false;
        enemy.getObject3D().scale.setScalar(1.0);
      }
    }

    // Attack timer — transition to AttackState after cooldown
    if (this.createAttackState) {
      this.attackTimer += dt;
      if (this.attackTimer >= params.attackCooldown) {
        enemy.transitionToState(this.createAttackState());
      }
    }
  }

  exit(_enemy: Enemy): void {
    // No cleanup needed
  }

  private applyBuff(overseer: Enemy): void {
    const overseerPos = overseer.getObject3D().position;
    const entities = this.gameObjectManager.getAll();
    const buffRadiusSq = OVERSEER_BUFF_RADIUS * OVERSEER_BUFF_RADIUS;

    for (const entity of entities) {
      if (!entity.isActive) continue;
      // Only buff Enemy instances (not bosses, projectiles, effects, etc.)
      if (!(entity instanceof (overseer.constructor as never))) {
        // Check if it's an Enemy by duck-typing (has params property)
        if (!('params' in entity) || entity === overseer) continue;
      }
      if (entity === overseer) continue;

      this.tempPosition.copy(entity.getObject3D().position);
      const dx = this.tempPosition.x - overseerPos.x;
      const dy = this.tempPosition.y - overseerPos.y;
      const dz = this.tempPosition.z - overseerPos.z;
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq <= buffRadiusSq) {
        // Apply buff to the enemy's base params
        const target = entity as Enemy;
        target.params = {
          ...target.params,
          attackCooldown: target.params.attackCooldown * OVERSEER_BUFF_COOLDOWN_MULTIPLIER,
          patrolSpeed: target.params.patrolSpeed * OVERSEER_BUFF_SPEED_MULTIPLIER,
        };
      }
    }
  }
}
