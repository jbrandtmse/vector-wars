/**
 * BehaviorParams — Interface defining all tunable AI parameters.
 *
 * AI states read from enemy.params, never check level number.
 * All behavioral variation comes from these params, injected at spawn time.
 *
 * Created by: Story 2-2
 */

export interface BehaviorParams {
  patrolSpeed: number;
  attackCooldown: number;
  evasionChance: number;
  movementRandomness: number;
  attackDamage: number;
  projectileSpeed: number;
}
