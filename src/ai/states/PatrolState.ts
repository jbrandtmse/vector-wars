/**
 * PatrolState — Enemy orbits around its spawn point in a circular pattern.
 *
 * Creates predictable, readable movement that communicates "this is a target."
 * Orbit is in the XZ plane with slight Y bobbing.
 * At Level 1 patrolSpeed=1.0, one full orbit takes ~6.3 seconds (2*PI/1.0).
 *
 * Created by: Story 2-2
 */

import type { AIState } from '../AIState.ts';
import type { Enemy } from '../../entities/enemies/Enemy.ts';

const ORBIT_RADIUS = 5;
const Y_BOB_AMPLITUDE = 1.5;
const Y_BOB_FREQUENCY = 0.5;

export class PatrolState implements AIState {
  private angle = 0;

  enter(_enemy: Enemy): void {
    this.angle = 0;
  }

  update(enemy: Enemy, dt: number): void {
    this.angle += enemy.params.patrolSpeed * dt;
    const spawnPos = enemy.getSpawnPosition();
    enemy.getObject3D().position.set(
      spawnPos.x + Math.cos(this.angle) * ORBIT_RADIUS,
      spawnPos.y + Math.sin(this.angle * Y_BOB_FREQUENCY) * Y_BOB_AMPLITUDE,
      spawnPos.z + Math.sin(this.angle) * ORBIT_RADIUS,
    );
  }

  exit(_enemy: Enemy): void {
    // No cleanup needed
  }
}
