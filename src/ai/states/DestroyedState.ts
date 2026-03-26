/**
 * DestroyedState — Terminal state: enemy becomes invisible and inactive.
 *
 * On enter: hide the object, mark inactive. Ready for pool recycling (Story 2-9).
 * On update/exit: no-op (inactive enemies aren't updated by GameObjectManager).
 *
 * Created by: Story 2-2
 */

import type { AIState } from '../AIState.ts';
import type { Enemy } from '../../entities/enemies/Enemy.ts';

export class DestroyedState implements AIState {
  enter(enemy: Enemy): void {
    enemy.getObject3D().visible = false;
    enemy.setActive(false);
  }

  update(_enemy: Enemy, _dt: number): void {
    // No-op -- inactive enemies aren't updated by GameObjectManager
  }

  exit(_enemy: Enemy): void {
    // No-op
  }
}
