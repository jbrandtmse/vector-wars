/**
 * EnemySpawner — Distance-based spawn trigger system with object pooling.
 *
 * Reads spawn event definitions and checks rail progress each frame.
 * When the player reaches a trigger distance, enemies are acquired from
 * a pre-warmed ObjectPool and begin their SpawnState animation.
 *
 * Enemies are released back to the pool on destruction via EventBus.
 *
 * Spawn events fire once per game session (not per rail loop).
 *
 * Created by: Story 2-2
 * Updated by: Story 2-5 (added fire callback and attack-patrol cycle wiring)
 * Updated by: Story 2-9 (refactored to use ObjectPool<Sentinel>)
 * Updated by: Story 3-1 (added Watchdog pool and pursuit AI state wiring)
 * Updated by: Story 3-2 (added Gatekeeper pool and block AI state wiring)
 * Updated by: Story 5-6 (added Overseer pool and coordinator AI state wiring)
 */

import * as THREE from 'three';
import { SPAWN_EVENTS, SENTINEL_POOL_SIZE, WATCHDOG_POOL_SIZE, GATEKEEPER_POOL_SIZE, OVERSEER_POOL_SIZE } from '../config/constants.ts';
import type { SpawnEvent, LevelBehaviorConfig } from '../config/constants.ts';
import { GameObjectManager } from '../entities/GameObjectManager.ts';
import { Sentinel } from '../entities/enemies/Sentinel.ts';
import { Watchdog } from '../entities/enemies/Watchdog.ts';
import { Gatekeeper } from '../entities/enemies/Gatekeeper.ts';
import { Overseer } from '../entities/enemies/Overseer.ts';
import { SpawnState } from '../ai/states/SpawnState.ts';
import { PatrolState } from '../ai/states/PatrolState.ts';
import { PursuitState } from '../ai/states/PursuitState.ts';
import { BlockState } from '../ai/states/BlockState.ts';
import { OverseerState } from '../ai/states/OverseerState.ts';
import { AttackState, type FireCallback } from '../ai/states/AttackState.ts';
import { ObjectPool } from '../core/ObjectPool.ts';
import { eventBus } from '../core/GameEvents.ts';
import { Logger } from '../core/Logger.ts';
import type { VectorMaterials } from '../rendering/VectorMaterials.ts';
import type { RailMovement } from './RailMovement.ts';

export class EnemySpawner {
  private firedEvents: Set<number> = new Set();
  private scene: THREE.Scene;
  private gameObjectManager: GameObjectManager;
  private vectorMaterials: VectorMaterials;
  private lastProgress = 0;
  private fireCallback: FireCallback;
  private playerPositionGetter: () => THREE.Vector3;
  private sentinelPool: ObjectPool<Sentinel>;
  private watchdogPool: ObjectPool<Watchdog>;
  private gatekeeperPool: ObjectPool<Gatekeeper>;
  private overseerPool: ObjectPool<Overseer>;
  private railMovement: RailMovement | null;
  private tempSpawnPos = new THREE.Vector3();
  private tempRailDir = new THREE.Vector3();
  private currentSpawnEvents: SpawnEvent[] = SPAWN_EVENTS;
  private levelBehaviors: LevelBehaviorConfig | null = null;

  constructor(
    scene: THREE.Scene,
    gameObjectManager: GameObjectManager,
    vectorMaterials: VectorMaterials,
    fireCallback?: FireCallback,
    playerPositionGetter?: () => THREE.Vector3,
    railMovement?: RailMovement,
  ) {
    this.scene = scene;
    this.gameObjectManager = gameObjectManager;
    this.vectorMaterials = vectorMaterials;
    this.fireCallback = fireCallback ?? (() => {});
    this.playerPositionGetter = playerPositionGetter ?? (() => new THREE.Vector3());
    this.railMovement = railMovement ?? null;

    // Pre-warm Sentinel pool. Each sentinel is added to the scene and
    // GameObjectManager at creation time (inactive, invisible).
    this.sentinelPool = new ObjectPool<Sentinel>(
      () => {
        const sentinel = new Sentinel(this.vectorMaterials);
        this.scene.add(sentinel.getObject3D());
        sentinel.getObject3D().visible = false;
        sentinel.setActive(false);
        this.gameObjectManager.add(sentinel);
        return sentinel;
      },
      SENTINEL_POOL_SIZE,
    );

    // Pre-warm Watchdog pool (Story 3-1)
    this.watchdogPool = new ObjectPool<Watchdog>(
      () => {
        const watchdog = new Watchdog(this.vectorMaterials);
        this.scene.add(watchdog.getObject3D());
        watchdog.getObject3D().visible = false;
        watchdog.setActive(false);
        this.gameObjectManager.add(watchdog);
        return watchdog;
      },
      WATCHDOG_POOL_SIZE,
    );

    // Pre-warm Gatekeeper pool (Story 3-2)
    this.gatekeeperPool = new ObjectPool<Gatekeeper>(
      () => {
        const gatekeeper = new Gatekeeper(this.vectorMaterials);
        this.scene.add(gatekeeper.getObject3D());
        gatekeeper.getObject3D().visible = false;
        gatekeeper.setActive(false);
        this.gameObjectManager.add(gatekeeper);
        return gatekeeper;
      },
      GATEKEEPER_POOL_SIZE,
    );

    // Pre-warm Overseer pool (Story 5-6)
    this.overseerPool = new ObjectPool<Overseer>(
      () => {
        const overseer = new Overseer(this.vectorMaterials);
        this.scene.add(overseer.getObject3D());
        overseer.getObject3D().visible = false;
        overseer.setActive(false);
        this.gameObjectManager.add(overseer);
        return overseer;
      },
      OVERSEER_POOL_SIZE,
    );

    // Release enemies back to pool when destroyed
    eventBus.on('enemyDestroyed', ({ enemy }) => {
      if (enemy instanceof Sentinel) {
        this.sentinelPool.release(enemy);
      } else if (enemy instanceof Watchdog) {
        this.watchdogPool.release(enemy);
      } else if (enemy instanceof Gatekeeper) {
        this.gatekeeperPool.release(enemy);
      } else if (enemy instanceof Overseer) {
        this.overseerPool.release(enemy);
      }
    });
  }

  /** Expose the sentinel pool for diagnostics registration */
  getSentinelPool(): ObjectPool<Sentinel> {
    return this.sentinelPool;
  }

  /** Expose the watchdog pool for diagnostics registration */
  getWatchdogPool(): ObjectPool<Watchdog> {
    return this.watchdogPool;
  }

  /** Expose the gatekeeper pool for diagnostics registration (Story 3-2) */
  getGatekeeperPool(): ObjectPool<Gatekeeper> {
    return this.gatekeeperPool;
  }

  /** Expose the overseer pool for diagnostics registration (Story 5-6) */
  getOverseerPool(): ObjectPool<Overseer> {
    return this.overseerPool;
  }

  /**
   * Sets the spawn events for the current level.
   * Call before each level start; also resets fired events.
   */
  setSpawnEvents(events: SpawnEvent[]): void {
    this.currentSpawnEvents = events;
    this.firedEvents.clear();
    this.lastProgress = 0;
  }

  /**
   * Sets the behavior params applied to spawned enemies for the current level.
   * When set, overrides enemy default params on each spawn.
   */
  setLevelBehaviors(behaviors: LevelBehaviorConfig): void {
    this.levelBehaviors = behaviors;
  }

  /**
   * Resets spawner state for a new level (clears fired events, resets progress).
   */
  resetForNewLevel(): void {
    this.firedEvents.clear();
    this.lastProgress = 0;
  }

  /** Get the current rail direction, or fallback to (0, 0, -1) for tests */
  private getRailDirection(): THREE.Vector3 {
    if (this.railMovement) {
      return this.railMovement.getCurrentDirection(this.tempRailDir);
    }
    return this.tempRailDir.set(0, 0, -1);
  }

  update(currentProgress: number): void {
    for (let i = 0; i < this.currentSpawnEvents.length; i++) {
      if (this.firedEvents.has(i)) continue;
      const trigger = this.currentSpawnEvents[i].railProgress;

      if (this.hasCrossed(this.lastProgress, currentProgress, trigger)) {
        this.spawnWave(this.currentSpawnEvents[i], i);
        this.firedEvents.add(i);
      }
    }
    this.lastProgress = currentProgress;
  }

  /**
   * Checks if the progress has crossed a trigger point (handles wrap-around).
   */
  private hasCrossed(prev: number, curr: number, trigger: number): boolean {
    if (prev <= curr) {
      // Normal forward movement (no wrap)
      return prev < trigger && trigger <= curr;
    } else {
      // Wrapped around (e.g., 0.95 -> 0.05)
      return prev < trigger || trigger <= curr;
    }
  }

  private spawnWave(event: SpawnEvent, _eventIndex: number): void {
    for (let j = 0; j < event.count; j++) {
      let enemy: Sentinel | Watchdog | Gatekeeper | Overseer | undefined;
      if (event.enemyType === 'overseer') {
        enemy = this.overseerPool.acquire();
      } else if (event.enemyType === 'gatekeeper') {
        enemy = this.gatekeeperPool.acquire();
      } else if (event.enemyType === 'watchdog') {
        enemy = this.watchdogPool.acquire();
      } else {
        enemy = this.sentinelPool.acquire();
      }
      if (!enemy) continue; // pool exhausted (should not happen with proper sizing)

      // Apply level-specific behavior params if configured
      if (this.levelBehaviors) {
        if (event.enemyType === 'sentinel') {
          enemy.params = this.levelBehaviors.sentinel;
        } else if (event.enemyType === 'watchdog') {
          enemy.params = this.levelBehaviors.watchdog;
        } else if (event.enemyType === 'gatekeeper') {
          enemy.params = this.levelBehaviors.gatekeeper;
        } else if (event.enemyType === 'overseer') {
          enemy.params = this.levelBehaviors.overseer;
        }
      }

      // Reactivate for use
      enemy.setActive(true);
      enemy.getObject3D().visible = true;

      // Place enemies ahead on the rail path with small lateral offsets
      // Each enemy staggers further ahead (0.05-0.15 progress units apart)
      const aheadOffset = 0.05 + j * 0.03;
      if (this.railMovement) {
        this.railMovement.getPointAhead(aheadOffset, this.tempSpawnPos);
      } else {
        // Fallback to fixed positions (for tests without rail)
        this.tempSpawnPos.set(...event.position);
      }
      // Small lateral offset so enemies aren't all stacked on the rail center
      const lateralSpread = (j - (event.count - 1) / 2) * 1.5;
      const spawnPos = new THREE.Vector3().copy(this.tempSpawnPos);
      spawnPos.x += lateralSpread;
      spawnPos.y += 0.5; // Slightly above rail level for visibility
      enemy.setSpawnPosition(spawnPos);

      // NOTE: Do NOT call gameObjectManager.add(enemy) here -- enemy was
      // already added during pool prewarm. It starts inactive, so update() skips it.

      // Wire AI state chain based on enemy type
      if (event.enemyType === 'overseer') {
        // Overseer: Spawn -> OverseerState -> Attack -> OverseerState cycle (Story 5-6)
        const createOverseerState = (): OverseerState => new OverseerState(
          this.gameObjectManager,
          this.playerPositionGetter,
          createAttackFromOverseer,
        );
        const createAttackFromOverseer = (): AttackState => new AttackState(
          this.fireCallback,
          this.playerPositionGetter,
          createOverseerState(),  // attack returns to coordinating
        );
        enemy.transitionToState(new SpawnState(createOverseerState()));
      } else if (event.enemyType === 'gatekeeper') {
        // Gatekeeper: Spawn -> Block -> Attack -> Block cycle (Story 3-2)
        const getRailDir = () => this.getRailDirection();
        const createBlockState = (): BlockState => new BlockState(
          this.playerPositionGetter,
          getRailDir,
          createAttackFromBlock,
        );
        const createAttackFromBlock = (): AttackState => new AttackState(
          this.fireCallback,
          this.playerPositionGetter,
          createBlockState(),  // attack returns to blocking
        );
        enemy.transitionToState(new SpawnState(createBlockState()));
      } else if (event.enemyType === 'watchdog') {
        // Watchdog: Spawn -> Pursuit -> Attack -> Pursuit cycle (Story 3-1)
        const createPursuitState = (): PursuitState => new PursuitState(
          this.playerPositionGetter,
          createAttackFromPursuit,
        );
        const createAttackFromPursuit = (): AttackState => new AttackState(
          this.fireCallback,
          this.playerPositionGetter,
          createPursuitState(),  // attack returns to pursuit
        );
        enemy.transitionToState(new SpawnState(createPursuitState()));
      } else {
        // Sentinel: Spawn -> Patrol -> Attack -> Patrol cycle (existing logic)
        const createAttackState = (): AttackState => new AttackState(
          this.fireCallback,
          this.playerPositionGetter,
          new PatrolState(createAttackState),  // attack returns to patrol which attacks again
        );
        const patrolState = new PatrolState(createAttackState);
        enemy.transitionToState(new SpawnState(patrolState));
      }

      eventBus.emit('enemySpawned', {
        enemy,
        position: { x: spawnPos.x, y: spawnPos.y, z: spawnPos.z },
      });
      Logger.info('Spawner', `${event.enemyType} acquired from pool`, { id: enemy.id });
    }
  }
}
