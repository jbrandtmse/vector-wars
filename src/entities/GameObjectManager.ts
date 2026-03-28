/**
 * GameObjectManager — Maintains the active entity list and updates all entities each frame.
 *
 * Systems add/remove entities; the manager calls update(dt) on all active entities.
 *
 * Created by: Story 2-2
 */

import type { GameObject } from './GameObject.ts';

export class GameObjectManager {
  private entities: GameObject[] = [];

  add(entity: GameObject): void {
    this.entities.push(entity);
  }

  remove(entity: GameObject): void {
    const index = this.entities.indexOf(entity);
    if (index !== -1) {
      const last = this.entities.length - 1;
      if (index !== last) {
        this.entities[index] = this.entities[last];
      }
      this.entities.pop();
    }
  }

  getAll(): readonly GameObject[] {
    return this.entities;
  }

  update(dt: number): void {
    for (const entity of this.entities) {
      if (entity.isActive) {
        entity.update(dt);
      }
    }
  }

  getActiveCount(): number {
    let count = 0;
    for (const entity of this.entities) {
      if (entity.isActive) count++;
    }
    return count;
  }
}
