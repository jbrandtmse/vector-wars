/**
 * LevelManager -- Orchestrates sequential phase progression for levels.
 *
 * Manages the phase sequence: Dogfight -> Surface -> Corridor -> Boss.
 * Handles phase transitions (fade-out/fade-in), shield recharge between
 * phases, phase checkpoint restart on death, and level completion.
 * Supports multi-level progression with per-level palette, behaviors,
 * spawn events, surface targets, and corridor obstacles.
 *
 * Architecture: `LevelManager` loads config, instantiates phase classes
 * with config, manages sequential phase transitions.
 * [Source: game-architecture.md#Level/Phase System]
 *
 * Created by: Story 3-10
 * Updated by: Story 5-1 (multi-level support, amber palette)
 */

import * as THREE from 'three';
import { DogfightPhase } from '../state/phases/DogfightPhase.ts';
import { SurfacePhase } from '../state/phases/SurfacePhase.ts';
import { CorridorPhase } from '../state/phases/CorridorPhase.ts';
import { BossPhase } from '../state/phases/BossPhase.ts';
import type { BossFactory } from '../state/phases/BossPhase.ts';
import { TutorialPhase } from '../state/phases/TutorialPhase.ts';
import { BriefingPhase } from '../state/phases/BriefingPhase.ts';
import { PhaseTransition } from '../state/phases/PhaseTransition.ts';
import { GatekeeperBoss } from '../entities/bosses/GatekeeperBoss.ts';
import { AvengerBoss } from '../entities/bosses/AvengerBoss.ts';
import { eventBus } from '../core/GameEvents.ts';
import { Logger } from '../core/Logger.ts';
import {
  PHASE_SHIELD_RECHARGE_AMOUNT,
  SPAWN_EVENTS,
  SPAWN_EVENTS_LEVEL2,
  SURFACE_TARGETS,
  SURFACE_TARGETS_LEVEL2,
  CORRIDOR_OBSTACLES,
  CORRIDOR_OBSTACLES_LEVEL2,
  LEVEL_PALETTES,
  LEVEL_BEHAVIORS,
} from '../config/constants.ts';
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
import type { InputManager } from '../core/InputManager.ts';
import type { BriefingData } from '../ui/screens/BriefingScreen.ts';

/** Interface matching the lifecycle of all phase classes */
interface Phase {
  enter(): void;
  update(dt: number, viewportOffset?: { x: number; y: number }): void;
  exit(): void;
  isComplete(): boolean;
}

/** Level 1 phase type sequence (with tutorial + briefing) */
const LEVEL1_PHASES_WITH_BRIEFING: readonly PhaseType[] = ['tutorial', 'briefing', 'dogfight', 'surface', 'corridor', 'boss'] as const;

/** Level 1 phase type sequence without briefing */
const LEVEL1_PHASES_WITHOUT_BRIEFING: readonly PhaseType[] = ['tutorial', 'dogfight', 'surface', 'corridor', 'boss'] as const;

/** Level 2+ phase type sequence (with briefing, no tutorial) */
const LEVEL_PHASES_WITH_BRIEFING: readonly PhaseType[] = ['briefing', 'dogfight', 'surface', 'corridor', 'boss'] as const;

/** Level 2+ phase type sequence without briefing */
const LEVEL_PHASES_WITHOUT_BRIEFING: readonly PhaseType[] = ['dogfight', 'surface', 'corridor', 'boss'] as const;

/** Per-level spawn events */
const LEVEL_SPAWN_EVENTS: Record<number, typeof SPAWN_EVENTS> = {
  1: SPAWN_EVENTS,
  2: SPAWN_EVENTS_LEVEL2,
};

/** Per-level surface targets */
const LEVEL_SURFACE_TARGETS: Record<number, typeof SURFACE_TARGETS> = {
  1: SURFACE_TARGETS,
  2: SURFACE_TARGETS_LEVEL2,
};

/** Per-level corridor obstacles */
const LEVEL_CORRIDOR_OBSTACLES: Record<number, typeof CORRIDOR_OBSTACLES> = {
  1: CORRIDOR_OBSTACLES,
  2: CORRIDOR_OBSTACLES_LEVEL2,
};

/** Per-level boss factories (Story 5-2) */
const LEVEL_BOSS_FACTORIES: Record<number, BossFactory> = {
  1: (vm, ppg) => new GatekeeperBoss(vm, ppg),
  2: (vm, ppg) => new AvengerBoss(vm, ppg),
};

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
  private inputManager: InputManager;
  private briefingDataMap: Map<number, BriefingData> = new Map();

  // Level tracking
  private currentLevel = 1;

  // Phase management
  private phases: Phase[] = [];
  private phaseTypes: readonly PhaseType[] = LEVEL1_PHASES_WITH_BRIEFING;
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
    inputManager: InputManager,
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
    this.inputManager = inputManager;

    this.phaseTransition = new PhaseTransition(renderPipeline);
  }

  /**
   * Initializes Level 1 phase sequence and enters the first phase.
   * Convenience method that calls startLevel(1).
   */
  enter(): void {
    this.startLevel(1);
  }

  /**
   * Starts a specific level, configuring palette, behavior, and phases.
   */
  startLevel(level: number): void {
    Logger.info('LevelManager', `Starting Level ${level}`);

    this.currentLevel = level;
    this.levelComplete = false;
    this.currentPhaseIndex = 0;

    // Set palette for this level
    const paletteName = LEVEL_PALETTES[level] ?? 'green';
    this.vectorMaterials.setPalette(paletteName);
    Logger.info('LevelManager', `Palette set to ${paletteName}`);

    // Configure enemy spawner for this level
    const spawnEvents = LEVEL_SPAWN_EVENTS[level] ?? SPAWN_EVENTS;
    this.enemySpawner.setSpawnEvents(spawnEvents);
    const behaviors = LEVEL_BEHAVIORS[level];
    if (behaviors) {
      this.enemySpawner.setLevelBehaviors(behaviors);
    }

    // Get level-specific configs
    const surfaceTargets = LEVEL_SURFACE_TARGETS[level];
    const corridorObstacles = LEVEL_CORRIDOR_OBSTACLES[level];
    const bossFactory = LEVEL_BOSS_FACTORIES[level];

    // Build phase list based on level
    if (level === 1) {
      this.buildLevel1Phases(surfaceTargets, corridorObstacles, bossFactory);
    } else {
      this.buildLevelPhases(surfaceTargets, corridorObstacles, bossFactory);
    }

    // Enter first phase
    this.phases[0].enter();
    eventBus.emit('phaseStart', { phase: this.phaseTypes[0], level: this.currentLevel });

    // Subscribe to playerDied for checkpoint handling
    this.onPlayerDied = () => this.handlePlayerDied();
    eventBus.on('playerDied', this.onPlayerDied);

    // Enable checkpoint system and prevent game over during level play
    this.checkpointEnabled = true;
    this.gameOverManager.preventGameOver = true;

    Logger.info('LevelManager', `Level ${level} started`, {
      phaseCount: this.phases.length,
      firstPhase: this.phaseTypes[0],
    });
  }

  /**
   * Builds the Level 1 phase sequence (includes tutorial).
   */
  private buildLevel1Phases(
    surfaceTargets?: typeof SURFACE_TARGETS,
    corridorObstacles?: typeof CORRIDOR_OBSTACLES,
    bossFactory?: BossFactory,
  ): void {
    const tutorialPhase = new TutorialPhase(
      this.scene,
      this.camera,
      this.vectorMaterials,
      this.inputManager,
      this.gameObjectManager,
      this.effectsManager,
    );

    const briefingPhase = this.briefingDataMap.has(1)
      ? new BriefingPhase(this.briefingDataMap.get(1)!)
      : null;

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
      surfaceTargets,
    );

    const corridorPhase = new CorridorPhase(
      this.scene,
      this.camera,
      this.vectorMaterials,
      this.player.collider,
      corridorObstacles,
    );

    const bossPhase = new BossPhase(
      this.scene,
      this.camera,
      this.vectorMaterials,
      this.gameObjectManager,
      () => this.camera.position.clone(),
      bossFactory,
    );

    if (briefingPhase) {
      this.phases = [tutorialPhase, briefingPhase, dogfightPhase, surfacePhase, corridorPhase, bossPhase];
      this.phaseTypes = LEVEL1_PHASES_WITH_BRIEFING;
    } else {
      this.phases = [tutorialPhase, dogfightPhase, surfacePhase, corridorPhase, bossPhase];
      this.phaseTypes = LEVEL1_PHASES_WITHOUT_BRIEFING;
      Logger.warn('LevelManager', 'Briefing data not loaded for Level 1 — skipping briefing phase');
    }
  }

  /**
   * Builds the Level 2+ phase sequence (no tutorial).
   */
  private buildLevelPhases(
    surfaceTargets?: typeof SURFACE_TARGETS,
    corridorObstacles?: typeof CORRIDOR_OBSTACLES,
    bossFactory?: BossFactory,
  ): void {
    const briefingPhase = this.briefingDataMap.has(this.currentLevel)
      ? new BriefingPhase(this.briefingDataMap.get(this.currentLevel)!)
      : null;

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
      surfaceTargets,
    );

    const corridorPhase = new CorridorPhase(
      this.scene,
      this.camera,
      this.vectorMaterials,
      this.player.collider,
      corridorObstacles,
    );

    const bossPhase = new BossPhase(
      this.scene,
      this.camera,
      this.vectorMaterials,
      this.gameObjectManager,
      () => this.camera.position.clone(),
      bossFactory,
    );

    if (briefingPhase) {
      this.phases = [briefingPhase, dogfightPhase, surfacePhase, corridorPhase, bossPhase];
      this.phaseTypes = LEVEL_PHASES_WITH_BRIEFING;
    } else {
      this.phases = [dogfightPhase, surfacePhase, corridorPhase, bossPhase];
      this.phaseTypes = LEVEL_PHASES_WITHOUT_BRIEFING;
      Logger.warn('LevelManager', `Briefing data not loaded for Level ${this.currentLevel} — skipping briefing phase`);
    }
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
      const currentType = this.phaseTypes[this.currentPhaseIndex];

      // If final phase (boss) completed -> level complete
      if (this.currentPhaseIndex === this.phases.length - 1) {
        this.levelComplete = true;
        this.checkpointEnabled = false;
        this.gameOverManager.preventGameOver = false;
        eventBus.emit('levelComplete', { level: this.currentLevel });
        Logger.info('LevelManager', `Level ${this.currentLevel} complete!`);
        return;
      }

      // Start phase transition
      const oldPhaseIndex = this.currentPhaseIndex;
      this.phaseTransition.start(
        // onSwap -- called at midpoint (fully black)
        () => {
          // Exit old phase
          this.phases[oldPhaseIndex].exit();
          eventBus.emit('phaseEnd', { phase: this.phaseTypes[oldPhaseIndex], level: this.currentLevel });

          // Advance to next phase
          this.currentPhaseIndex = oldPhaseIndex + 1;
          const newType = this.phaseTypes[this.currentPhaseIndex];

          // Recharge shields between phases (NOT before first phase)
          this.player.rechargeShields(PHASE_SHIELD_RECHARGE_AMOUNT);

          // Enter new phase
          try {
            this.phases[this.currentPhaseIndex].enter();
          } catch (err) {
            Logger.error('LevelManager', 'Phase enter() failed', { phase: newType, error: String(err) });
          }
          eventBus.emit('phaseStart', { phase: newType, level: this.currentLevel });

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

    const currentType = this.phaseTypes[this.currentPhaseIndex];
    Logger.info('LevelManager', 'Player died, restarting phase', { phase: currentType });

    const phaseIndex = this.currentPhaseIndex;
    this.phaseTransition.start(
      // onSwap
      () => {
        this.phases[phaseIndex].exit();
        this.player.reset();
        this.phases[phaseIndex].enter();
        eventBus.emit('phaseRestart', { phase: currentType, level: this.currentLevel });
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
   * True during tutorial phase and dogfight phase.
   * Briefing phase and other phases do NOT use the main rail.
   */
  isUsingMainRail(): boolean {
    if (this.levelComplete) return false;
    const currentType = this.getCurrentPhaseType();
    return currentType === 'tutorial' || currentType === 'dogfight';
  }

  /**
   * Returns the current phase type for external inspection.
   */
  getCurrentPhaseType(): PhaseType {
    return this.phaseTypes[this.currentPhaseIndex];
  }

  /**
   * Returns whether the level has been completed.
   */
  isLevelComplete(): boolean {
    return this.levelComplete;
  }

  /**
   * Returns the current level number.
   */
  getCurrentLevel(): number {
    return this.currentLevel;
  }

  /**
   * Sets briefing data for a specific level. Must be called before startLevel().
   * If not called or called with null, the briefing phase is skipped for that level.
   */
  setBriefingData(data: BriefingData, level: number = 1): void {
    this.briefingDataMap.set(level, data);
  }
}
