/**
 * SpawnState — Enemy fades/scales in over ~0.5s, then transitions to the next state.
 *
 * On enter: set scale to 0, start timer.
 * On update: lerp scale from 0 to 1 over 0.5s.
 * When complete: transition to the provided next state (PatrolState).
 *
 * Created by: Story 2-2
 */

import type { AIState } from '../AIState.ts';
import type { Enemy } from '../../entities/enemies/Enemy.ts';

const SPAWN_DURATION = 0.5;

export class SpawnState implements AIState {
  private timer = 0;
  private nextState: AIState;

  constructor(nextState: AIState) {
    this.nextState = nextState;
  }

  enter(enemy: Enemy): void {
    this.timer = 0;
    const obj = enemy.getObject3D();
    obj.scale.set(0, 0, 0);
  }

  update(enemy: Enemy, dt: number): void {
    this.timer += dt;
    const t = Math.min(this.timer / SPAWN_DURATION, 1.0);
    enemy.getObject3D().scale.set(t, t, t);

    if (this.timer >= SPAWN_DURATION) {
      enemy.transitionToState(this.nextState);
    }
  }

  exit(enemy: Enemy): void {
    // Ensure scale is exactly 1
    enemy.getObject3D().scale.set(1, 1, 1);
  }
}
