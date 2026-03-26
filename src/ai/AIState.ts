/**
 * AIState — Interface for enemy AI state machine states.
 *
 * Each state receives the Enemy reference and controls behavior
 * during that state. Transitions are triggered by the state itself
 * calling enemy.transitionToState(nextState).
 *
 * Created by: Story 2-2
 */

import type { Enemy } from '../entities/enemies/Enemy.ts';

export interface AIState {
  enter(enemy: Enemy): void;
  update(enemy: Enemy, dt: number): void;
  exit(enemy: Enemy): void;
}
