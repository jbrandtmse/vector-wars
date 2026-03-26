/**
 * ScoreManager — Tracks the current score and emits scoreChanged events.
 *
 * Subscribes to enemyDestroyed events via EventBus and adds the enemy's
 * scoreValue to the running total. Does NOT import any other system.
 *
 * Created by: Story 2-6
 */

import { eventBus } from '../core/GameEvents.ts';
import { Logger } from '../core/Logger.ts';

export class ScoreManager {
  private score = 0;
  private enemyDestroyedHandler: (data: { enemy: { scoreValue: number } }) => void;

  constructor() {
    // Subscribe to enemy destruction events (store reference for disposal)
    this.enemyDestroyedHandler = ({ enemy }) => {
      this.addScore(enemy.scoreValue);
    };
    eventBus.on('enemyDestroyed', this.enemyDestroyedHandler);

    // Emit initial score
    eventBus.emit('scoreChanged', { score: 0, delta: 0 });

    Logger.info('ScoreManager', 'Score manager initialized');
  }

  addScore(points: number): void {
    this.score += points;
    eventBus.emit('scoreChanged', { score: this.score, delta: points });
    Logger.debug('ScoreManager', 'Score updated', {
      score: this.score,
      delta: points,
    });
  }

  getScore(): number {
    return this.score;
  }

  reset(): void {
    this.score = 0;
    eventBus.emit('scoreChanged', { score: 0, delta: 0 });
  }

  /**
   * Unsubscribes from events. Call when ScoreManager is no longer needed.
   */
  dispose(): void {
    eventBus.off('enemyDestroyed', this.enemyDestroyedHandler);
  }
}
