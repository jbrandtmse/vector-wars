/**
 * Boss -- Abstract base class for boss entities.
 *
 * Separate from Enemy hierarchy. Bosses have multi-phase attack patterns,
 * vulnerability windows, health tracking with event emission, and
 * destruction sequences.
 *
 * Architecture: Boss is a sibling to Enemy in the GameObject hierarchy,
 * NOT a subclass of Enemy. Bosses are unique encounters, not pooled.
 *
 * Created by: Story 3-7
 */

import { GameObject } from '../GameObject.ts';
import { eventBus } from '../../core/GameEvents.ts';

export abstract class Boss extends GameObject {
  public health: number;
  public maxHealth: number;
  public scoreValue: number;
  public vulnerable: boolean = false;
  public defeated: boolean = false;

  constructor(maxHealth: number, scoreValue: number, colliderRadius: number) {
    super(colliderRadius);
    this.maxHealth = maxHealth;
    this.health = maxHealth;
    this.scoreValue = scoreValue;
  }

  /**
   * Take damage. Reduces health, emits bossHealthChanged, calls onHit().
   * When health <= 0, calls onDefeated().
   */
  takeDamage(amount: number): void {
    if (this.defeated) return;

    this.health = Math.max(0, this.health - amount);

    eventBus.emit('bossHealthChanged', {
      health: this.health,
      maxHealth: this.maxHealth,
    });

    this.onHit();

    if (this.health <= 0 && !this.defeated) {
      this.defeated = true;
      this.onDefeated();
    }
  }

  /**
   * Returns health as a 0-1 fraction.
   */
  getHealthFraction(): number {
    return this.health / this.maxHealth;
  }

  /**
   * Called every frame. Drives subclass update if not defeated. Syncs collider.
   */
  update(dt: number): void {
    if (!this.defeated) {
      this.updateBoss(dt);
    }
    this.syncCollider();
  }

  /** Subclass implements hit visual feedback */
  abstract onHit(): void;

  /** Subclass implements defeat behavior */
  abstract onDefeated(): void;

  /** Subclass implements per-frame logic (animation, attack phases, etc.) */
  abstract updateBoss(dt: number): void;
}
