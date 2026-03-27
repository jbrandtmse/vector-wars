/**
 * LevelManager -- Orchestrates sequential phase progression for a level.
 *
 * Manages the phase sequence: Dogfight -> Surface -> Corridor -> Boss.
 * Handles phase transitions (fade-out/fade-in), shield recharge between
 * phases, phase checkpoint restart on death, and level completion.
 *
 * Architecture: `LevelManager` loads config, instantiates phase classes
 * with config, manages sequential phase transitions.
 * [Source: game-architecture.md#Level/Phase System]
 *
 * Created by: Story 3-10
 */

import * as THREE from 'three';
import { DogfightPhase } from '../state/phases/DogfightPhase.ts';
import { SurfacePhase } from '../state/phases/SurfacePhase.ts';
import { CorridorPhase } from '../state/phases/CorridorPhase.ts';
import { BossPhase } from '../state/phases/BossPhase.ts';
import { PhaseTransition } from '../state/phases/PhaseTransition.ts';
import { eventBus } from '../core/GameEvents.ts';
import { Logger } from '../core/Logger.ts';
import { PHASE_SHIELD_RECHARGE_AMOUNT } from '../config/constants.ts';
import type { PhaseType } from '../types/game.ts';
import type { RenderPipeline } from '../rendering/RenderPipeline.ts';
import type { VectorMaterials } from '../rendering/VectorMaterials.ts';
import type { GameObjectManager } from '../entities/GameObjectManager.ts';
import type { Player } from '../entities/player/Player.ts';
import type { EnemySpawner } from './EnemySpawner.ts';
import type { CollisionSystem } from './CollisionSystem.ts';
import type { EffectsManager } from './EffectsManager.ts';
import type { EnemyProjectileSystem } from './EnemyProjectileSystem.ts';
import type { DataLanceSystem } from './DataLanceSystem.ts';
import type { RailMovement } from './RailMovement.ts';
import type { GameOverManager } from './GameOverManager.ts';

/** Interface matching the lifecycle of all phase classes */
interface Phase {
  enter(): void;
  update(dt: number, viewportOffset?: { x: number; y: number }): void;
  exit(): void;
  isComplete(): boolean;
}

/** Ordered list of phase types matching the phase array indices */
const PHASE_TYPES: readonly PhaseType[] = ['dogfight', 'surface', 'corridor', 'boss'] as const;

export class LevelManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private vectorMaterials: VectorMaterials;
  private gameObjectManager: GameObjectManager;
  private player: Player;
  private railMovement: RailMovement;
  private enemySpawner: EnemySpawner;
  private collisionSystem: CollisionSystem;
  private effectsManager: EffectsManager;
  private enemyProjectileSystem: EnemyProjectileSystem;
  private dataLanceSystem: DataLanceSystem;
  private gameOverManager: GameOverManager;

  // Phase management
  private phases: Phase[] = [];
  private currentPhaseIndex = 0;
  private phaseTransition: PhaseTransition;
  private checkpointEnabled = false;
  private levelComplete = false;

  // Event listener reference for cleanup
  private onPlayerDied: (() => void) | null = null;

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    vectorMaterials: VectorMaterials,
    gameObjectManager: GameObjectManager,
    player: Player,
    renderPipeline: RenderPipeline,
    railMovement: RailMovement,
    enemySpawner: EnemySpawner,
    collisionSystem: CollisionSystem,
    effectsManager: EffectsManager,
    enemyProjectileSystem: EnemyProjectileSystem,
    dataLanceSystem: DataLanceSystem,
    gameOverManager: GameOverManager,
  ) {
    this.scene = scene;
    this.camera = camera;
    this.vectorMaterials = vectorMaterials;
    this.gameObjectManager = gameObjectManager;
    this.player = player;
    this.railMovement = railMovement;
    this.enemySpawner = enemySpawner;
    this.collisionSystem = collisionSystem;
    this.effectsManager = effectsManager;
    this.enemyProjectileSystem = enemyProjectileSystem;
    this.dataLanceSystem = dataLanceSystem;
    this.gameOverManager = gameOverManager;

    this.phaseTransition = new PhaseTransition(renderPipeline);
  }

  /**
   * Initializes Level 1 phase sequence and enters the first phase.
   */
  enter(): void {
    Logger.info('LevelManager', 'Entering Level 1');

    this.levelComplete = false;
    this.currentPhaseIndex = 0;

    // Create all four phase instances
    const dogfightPhase = new DogfightPhase(
      this.enemySpawner,
      this.gameObjectManager,
      this.dataLanceSystem,
      this.collisionSystem,
      this.enemyProjectileSystem,
      this.effectsManager,
      this.railMovement,
    );

    const surfacePhase = new SurfacePhase(
      this.scene,
      this.camera,
      this.vectorMaterials,
      this.player.collider,
      this.gameObjectManager,
    );

    const corridorPhase = new CorridorPhase(
      this.scene,
      this.camera,
      this.vectorMaterials,
      this.player.collider,
    );

    const bossPhase = new BossPhase(
      this.scene,
      this.camera,
      this.vectorMaterials,
      this.gameObjectManager,
      () => this.camera.position.clone(),
    );

    this.phases = [dogfightPhase, surfacePhase, corridorPhase, bossPhase];

    // Enter first phase
    this.phases[0].enter();
    eventBus.emit('phaseStart', { phase: 'dogfight', level: 1 });

    // Subscribe to playerDied for checkpoint handling
    this.onPlayerDied = () => this.handlePlayerDied();
    eventBus.on('playerDied', this.onPlayerDied);

    // Enable checkpoint system and prevent game over during level play
    this.checkpointEnabled = true;
    this.gameOverManager.preventGameOver = true;

    Logger.info('LevelManager', 'Level 1 started', {
      phaseCount: this.phases.length,
      firstPhase: PHASE_TYPES[0],
    });
  }

  /**
   * Updates the current phase and handles transitions.
   * Called each frame from main.ts animation loop.
   */
  update(dt: number, viewportOffset?: { x: number; y: number }): void {
    if (this.levelComplete) return;

    // If transition is active, drive the animation and keep the scene alive
    if (this.phaseTransition.isActive()) {
      this.phaseTransition.update(dt);
      // Still update the current phase during fade-out to prevent a frozen frame
      this.phases[this.currentPhaseIndex].update(dt, viewportOffset);
      return;
    }

    // Normal phase update
    this.phases[this.currentPhaseIndex].update(dt, viewportOffset);

    // Check if current phase completed
    if (this.phases[this.currentPhaseIndex].isComplete()) {
      const currentType = PHASE_TYPES[this.currentPhaseIndex];

      // If final phase (boss) completed -> level complete
      if (this.currentPhaseIndex === this.phases.length - 1) {
        this.levelComplete = true;
        this.checkpointEnabled = false;
        this.gameOverManager.preventGameOver = false;
        eventBus.emit('levelComplete', { level: 1 });
        Logger.info('LevelManager', 'Level 1 complete!');
        return;
      }

      // Start phase transition
      const oldPhaseIndex = this.currentPhaseIndex;
      this.phaseTransition.start(
        // onSwap -- called at midpoint (fully black)
        () => {
          // Exit old phase
          this.phases[oldPhaseIndex].exit();
          eventBus.emit('phaseEnd', { phase: PHASE_TYPES[oldPhaseIndex], level: 1 });

          // Advance to next phase
          this.currentPhaseIndex = oldPhaseIndex + 1;
          const newType = PHASE_TYPES[this.currentPhaseIndex];

          // Recharge shields between phases (NOT before first phase)
          this.player.rechargeShields(PHASE_SHIELD_RECHARGE_AMOUNT);

          // Enter new phase
          try {
            this.phases[this.currentPhaseIndex].enter();
          } catch (err) {
            Logger.error('LevelManager', 'Phase enter() failed', { phase: newType, error: String(err) });
          }
          eventBus.emit('phaseStart', { phase: newType, level: 1 });

          Logger.info('LevelManager', 'Phase swapped', {
            from: currentType,
            to: newType,
          });
        },
        // onComplete -- gameplay resumes automatically
        () => {
          Logger.info('LevelManager', 'Phase transition complete');
        },
      );
    }
  }

  /**
   * Handles player death during level play.
   * Restarts the current phase with a fade transition.
   */
  private handlePlayerDied(): void {
    if (!this.checkpointEnabled) return;

    // Don't restart if a transition is already active (avoids double-trigger)
    if (this.phaseTransition.isActive()) return;

    const currentType = PHASE_TYPES[this.currentPhaseIndex];
    Logger.info('LevelManager', 'Player died, restarting phase', { phase: currentType });

    const phaseIndex = this.currentPhaseIndex;
    this.phaseTransition.start(
      // onSwap
      () => {
        this.phases[phaseIndex].exit();
        this.player.reset();
        this.phases[phaseIndex].enter();
        eventBus.emit('phaseRestart', { phase: currentType, level: 1 });
        Logger.info('LevelManager', 'Phase restarted', { phase: currentType });
      },
      // onComplete
      () => {
        Logger.info('LevelManager', 'Phase restart transition complete');
      },
    );
  }

  /**
   * Cleans up and exits the level.
   */
  exit(): void {
    Logger.info('LevelManager', 'Exiting level');

    // Exit current phase
    if (this.phases.length > 0) {
      this.phases[this.currentPhaseIndex].exit();
    }

    // Unsubscribe from events
    if (this.onPlayerDied) {
      eventBus.off('playerDied', this.onPlayerDied);
      this.onPlayerDied = null;
    }

    // Disable checkpoint
    this.checkpointEnabled = false;
    this.gameOverManager.preventGameOver = false;

    this.phases = [];

    Logger.info('LevelManager', 'Level exited');
  }

  /**
   * Returns whether the main rail movement should be used.
   * True only during the dogfight phase (other phases manage their own camera/rail).
   */
  isUsingMainRail(): boolean {
    return this.currentPhaseIndex === 0 && !this.levelComplete;
  }

  /**
   * Returns the current phase type for external inspection.
   */
  getCurrentPhaseType(): PhaseType {
    return PHASE_TYPES[this.currentPhaseIndex];
  }

  /**
   * Returns whether the level has been completed.
   */
  isLevelComplete(): boolean {
    return this.levelComplete;
  }
}
