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
 */

import * as THREE from 'three';
import { SPAWN_EVENTS, SENTINEL_POOL_SIZE, WATCHDOG_POOL_SIZE } from '../config/constants.ts';
import { GameObjectManager } from '../entities/GameObjectManager.ts';
import { Sentinel } from '../entities/enemies/Sentinel.ts';
import { Watchdog } from '../entities/enemies/Watchdog.ts';
import { SpawnState } from '../ai/states/SpawnState.ts';
import { PatrolState } from '../ai/states/PatrolState.ts';
import { PursuitState } from '../ai/states/PursuitState.ts';
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
  private railMovement: RailMovement | null;
  private tempSpawnPos = new THREE.Vector3();

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

    // Release enemies back to pool when destroyed
    eventBus.on('enemyDestroyed', ({ enemy }) => {
      if (enemy instanceof Sentinel) {
        this.sentinelPool.release(enemy);
      } else if (enemy instanceof Watchdog) {
        this.watchdogPool.release(enemy);
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

  update(currentProgress: number): void {
    for (let i = 0; i < SPAWN_EVENTS.length; i++) {
      if (this.firedEvents.has(i)) continue;
      const trigger = SPAWN_EVENTS[i].railProgress;

      if (this.hasCrossed(this.lastProgress, currentProgress, trigger)) {
        this.spawnWave(SPAWN_EVENTS[i], i);
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

  private spawnWave(event: typeof SPAWN_EVENTS[number], _eventIndex: number): void {
    for (let j = 0; j < event.count; j++) {
      const enemy = event.enemyType === 'watchdog'
        ? this.watchdogPool.acquire()
        : this.sentinelPool.acquire();
      if (!enemy) continue; // pool exhausted (should not happen with proper sizing)

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
      if (event.enemyType === 'watchdog') {
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
