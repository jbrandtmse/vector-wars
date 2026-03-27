/**
 * DogfightPhase -- Phase 1 state: open-space dogfight combat.
 *
 * Encapsulates the dogfight gameplay that previously lived inline in main.ts:
 * enemy spawning, game object updates, weapon systems, collision detection,
 * enemy projectiles, and visual effects.
 *
 * The dogfight phase uses the main RailMovement instance from main.ts
 * (unlike SurfacePhase/CorridorPhase which create their own).
 * Visual/input concerns (viewport movement, banking, cockpit) remain in main.ts.
 *
 * Pattern: Same lifecycle as SurfacePhase/CorridorPhase -- enter/update/exit/isComplete.
 *
 * Created by: Story 3-10
 */

import { Logger } from '../../core/Logger.ts';
import { RAIL_COMPLETION_THRESHOLD } from '../../config/constants.ts';
import type { EnemySpawner } from '../../systems/EnemySpawner.ts';
import type { GameObjectManager } from '../../entities/GameObjectManager.ts';
import type { DataLanceSystem } from '../../systems/DataLanceSystem.ts';
import type { CollisionSystem } from '../../systems/CollisionSystem.ts';
import type { EnemyProjectileSystem } from '../../systems/EnemyProjectileSystem.ts';
import type { EffectsManager } from '../../systems/EffectsManager.ts';
import type { RailMovement } from '../../systems/RailMovement.ts';

export class DogfightPhase {
  private enemySpawner: EnemySpawner;
  private gameObjectManager: GameObjectManager;
  private dataLanceSystem: DataLanceSystem;
  private collisionSystem: CollisionSystem;
  private enemyProjectileSystem: EnemyProjectileSystem;
  private effectsManager: EffectsManager;
  private railMovement: RailMovement;
  private completed = false;

  constructor(
    enemySpawner: EnemySpawner,
    gameObjectManager: GameObjectManager,
    dataLanceSystem: DataLanceSystem,
    collisionSystem: CollisionSystem,
    enemyProjectileSystem: EnemyProjectileSystem,
    effectsManager: EffectsManager,
    railMovement: RailMovement,
  ) {
    this.enemySpawner = enemySpawner;
    this.gameObjectManager = gameObjectManager;
    this.dataLanceSystem = dataLanceSystem;
    this.collisionSystem = collisionSystem;
    this.enemyProjectileSystem = enemyProjectileSystem;
    this.effectsManager = effectsManager;
    this.railMovement = railMovement;
  }

  /**
   * Enters the dogfight phase.
   * Resets state for a fresh dogfight run. Does NOT emit phaseStart
   * (LevelManager handles that).
   */
  enter(): void {
    Logger.info('DogfightPhase', 'Entering dogfight phase');
    this.completed = false;
    Logger.info('DogfightPhase', 'Dogfight phase entered');
  }

  /**
   * Updates all gameplay systems for the dogfight phase.
   * Called each frame by LevelManager.
   */
  update(dt: number): void {
    if (this.completed) return;

    const railProgress = this.railMovement.getRailProgress();

    this.enemySpawner.update(railProgress);
    this.gameObjectManager.update(dt);
    this.dataLanceSystem.update(dt);
    this.collisionSystem.update();
    this.enemyProjectileSystem.update(dt);
    this.effectsManager.update(dt);

    // Check rail completion
    if (railProgress >= RAIL_COMPLETION_THRESHOLD) {
      this.completed = true;
      Logger.info('DogfightPhase', 'Phase complete: rail path end reached', {
        railProgress,
      });
    }
  }

  /**
   * Exits the dogfight phase. Cleans up active enemies and projectiles.
   */
  exit(): void {
    Logger.info('DogfightPhase', 'Exiting dogfight phase');
    // Cleanup is handled by the systems themselves when
    // LevelManager transitions to the next phase.
    // Active enemies will be cleaned up by the game object manager
    // when the next phase's enter() creates its own entities.
    Logger.info('DogfightPhase', 'Dogfight phase exited');
  }

  /**
   * Returns whether the dogfight phase has completed.
   */
  isComplete(): boolean {
    return this.completed;
  }
}
