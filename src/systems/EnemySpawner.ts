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
 */

import * as THREE from 'three';
import { SPAWN_EVENTS, SENTINEL_POOL_SIZE } from '../config/constants.ts';
import { GameObjectManager } from '../entities/GameObjectManager.ts';
import { Sentinel } from '../entities/enemies/Sentinel.ts';
import { SpawnState } from '../ai/states/SpawnState.ts';
import { PatrolState } from '../ai/states/PatrolState.ts';
import { AttackState, type FireCallback } from '../ai/states/AttackState.ts';
import { ObjectPool } from '../core/ObjectPool.ts';
import { eventBus } from '../core/GameEvents.ts';
import { Logger } from '../core/Logger.ts';
import type { VectorMaterials } from '../rendering/VectorMaterials.ts';

export class EnemySpawner {
  private firedEvents: Set<number> = new Set();
  private scene: THREE.Scene;
  private gameObjectManager: GameObjectManager;
  private vectorMaterials: VectorMaterials;
  private lastProgress = 0;
  private fireCallback: FireCallback;
  private playerPositionGetter: () => THREE.Vector3;
  private sentinelPool: ObjectPool<Sentinel>;

  constructor(
    scene: THREE.Scene,
    gameObjectManager: GameObjectManager,
    vectorMaterials: VectorMaterials,
    fireCallback?: FireCallback,
    playerPositionGetter?: () => THREE.Vector3,
  ) {
    this.scene = scene;
    this.gameObjectManager = gameObjectManager;
    this.vectorMaterials = vectorMaterials;
    this.fireCallback = fireCallback ?? (() => {});
    this.playerPositionGetter = playerPositionGetter ?? (() => new THREE.Vector3());

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

    // Release sentinels back to pool when destroyed
    eventBus.on('enemyDestroyed', ({ enemy }) => {
      if (enemy instanceof Sentinel) {
        this.sentinelPool.release(enemy);
      }
    });
  }

  /** Expose the sentinel pool for diagnostics registration */
  getSentinelPool(): ObjectPool<Sentinel> {
    return this.sentinelPool;
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
      const enemy = this.sentinelPool.acquire();
      if (!enemy) continue; // pool exhausted (should not happen with proper sizing)

      // Reactivate for use
      enemy.setActive(true);
      enemy.getObject3D().visible = true;

      // Position and offset (same as before)
      const offset = new THREE.Vector3(
        (j - event.count / 2) * 3, // spread horizontally
        0,
        (j % 2) * 2, // slight depth offset
      );
      const spawnPos = new THREE.Vector3(...event.position).add(offset);
      enemy.setSpawnPosition(spawnPos);

      // NOTE: Do NOT call gameObjectManager.add(enemy) here -- sentinel was
      // already added during pool prewarm. It starts inactive, so update() skips it.

      // Each enemy gets its own state instances for independent behavior
      // Patrol -> Attack -> Patrol cycle via factory functions (Story 2-5)
      const createAttackState = (): AttackState => new AttackState(
        this.fireCallback,
        this.playerPositionGetter,
        new PatrolState(createAttackState),  // attack returns to patrol which attacks again
      );
      const patrolState = new PatrolState(createAttackState);
      enemy.transitionToState(new SpawnState(patrolState));

      eventBus.emit('enemySpawned', {
        enemy,
        position: { x: spawnPos.x, y: spawnPos.y, z: spawnPos.z },
      });
      Logger.info('Spawner', 'Sentinel acquired from pool', { id: enemy.id });
    }
  }
}
