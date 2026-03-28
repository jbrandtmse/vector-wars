/**
 * PatrolState — Enemy orbits around its spawn point in a circular pattern.
 *
 * Creates predictable, readable movement that communicates "this is a target."
 * Orbit is in the XZ plane with slight Y bobbing.
 * At Level 1 patrolSpeed=1.0, one full orbit takes ~6.3 seconds (2*PI/1.0).
 *
 * Behavioral evolution (Story 5-7): When movementRandomness > 0, a smooth noise
 * offset is added to the orbit position, creating wobble (Level 2) or erratic
 * movement (Level 3).
 *
 * After ATTACK_STATE_PATROL_DURATION seconds, transitions to AttackState
 * (if createAttackState factory is provided).
 *
 * Created by: Story 2-2
 * Updated by: Story 2-5 (added attack timer and state factory)
 * Updated by: Story 5-7 (added movementRandomness support)
 */

import type { AIState } from '../AIState.ts';
import type { Enemy } from '../../entities/enemies/Enemy.ts';
import { ATTACK_STATE_PATROL_DURATION, PATROL_RANDOMNESS_SCALE } from '../../config/constants.ts';

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
    const params = enemy.getEffectiveParams();

    // Existing orbit patrol logic
    this.angle += params.patrolSpeed * dt;
    const spawnPos = enemy.getSpawnPosition();

    let xOffset = Math.cos(this.angle) * ORBIT_RADIUS;
    let zOffset = Math.sin(this.angle) * ORBIT_RADIUS;
    let yOffset = Math.sin(this.angle * Y_BOB_FREQUENCY) * Y_BOB_AMPLITUDE;

    // Behavioral evolution: add smooth noise offset when movementRandomness > 0
    if (params.movementRandomness > 0) {
      const scale = params.movementRandomness * PATROL_RANDOMNESS_SCALE;
      // Multi-frequency sine pattern creates smooth but unpredictable wobble
      xOffset += Math.sin(this.angle * 2.3) * Math.cos(this.angle * 1.7) * scale;
      zOffset += Math.cos(this.angle * 1.9) * Math.sin(this.angle * 2.7) * scale;
      yOffset += Math.sin(this.angle * 3.1) * scale * 0.4;
    }

    enemy.getObject3D().position.set(
      spawnPos.x + xOffset,
      spawnPos.y + yOffset,
      spawnPos.z + zOffset,
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
