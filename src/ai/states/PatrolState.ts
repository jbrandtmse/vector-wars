/**
 * PatrolState — Enemy orbits around its spawn point in a circular pattern.
 *
 * Creates predictable, readable movement that communicates "this is a target."
 * Orbit is in the XZ plane with slight Y bobbing.
 * At Level 1 patrolSpeed=1.0, one full orbit takes ~6.3 seconds (2*PI/1.0).
 *
 * After ATTACK_STATE_PATROL_DURATION seconds, transitions to AttackState
 * (if createAttackState factory is provided).
 *
 * Created by: Story 2-2
 * Updated by: Story 2-5 (added attack timer and state factory)
 */

import type { AIState } from '../AIState.ts';
import type { Enemy } from '../../entities/enemies/Enemy.ts';
import { ATTACK_STATE_PATROL_DURATION } from '../../config/constants.ts';

const ORBIT_RADIUS = 2.5;
const Y_BOB_AMPLITUDE = 0.8;
const Y_BOB_FREQUENCY = 0.5;

export class PatrolState implements AIState {
  private angle = 0;
  private patrolTimer = 0;
  private createAttackState: (() => AIState) | null;

  constructor(createAttackState?: () => AIState) {
    this.createAttackState = createAttackState ?? null;
  }

  enter(_enemy: Enemy): void {
    this.angle = 0;
    this.patrolTimer = 0;
  }

  update(enemy: Enemy, dt: number): void {
    // Existing orbit patrol logic (unchanged)
    this.angle += enemy.params.patrolSpeed * dt;
    const spawnPos = enemy.getSpawnPosition();
    enemy.getObject3D().position.set(
      spawnPos.x + Math.cos(this.angle) * ORBIT_RADIUS,
      spawnPos.y + Math.sin(this.angle * Y_BOB_FREQUENCY) * Y_BOB_AMPLITUDE,
      spawnPos.z + Math.sin(this.angle) * ORBIT_RADIUS,
    );

    // Attack timer -- transition to AttackState after patrol duration
    if (this.createAttackState) {
      this.patrolTimer += dt;
      if (this.patrolTimer >= ATTACK_STATE_PATROL_DURATION) {
        enemy.transitionToState(this.createAttackState());
      }
    }
  }

  exit(_enemy: Enemy): void {
    // No cleanup needed
  }
}
