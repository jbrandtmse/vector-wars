/**
 * EnemySpawner — Distance-based spawn trigger system.
 *
 * Reads spawn event definitions and checks rail progress each frame.
 * When the player reaches a trigger distance, enemies spawn and begin
 * their SpawnState animation before transitioning to PatrolState.
 *
 * Spawn events fire once per game session (not per rail loop).
 *
 * Created by: Story 2-2
 */

import * as THREE from 'three';
import { SPAWN_EVENTS } from '../config/constants.ts';
import { GameObjectManager } from '../entities/GameObjectManager.ts';
import { Sentinel } from '../entities/enemies/Sentinel.ts';
import { SpawnState } from '../ai/states/SpawnState.ts';
import { PatrolState } from '../ai/states/PatrolState.ts';
import { eventBus } from '../core/GameEvents.ts';
import { Logger } from '../core/Logger.ts';
import type { VectorMaterials } from '../rendering/VectorMaterials.ts';

export class EnemySpawner {
  private firedEvents: Set<number> = new Set();
  private scene: THREE.Scene;
  private gameObjectManager: GameObjectManager;
  private vectorMaterials: VectorMaterials;
  private lastProgress = 0;

  constructor(
    scene: THREE.Scene,
    gameObjectManager: GameObjectManager,
    vectorMaterials: VectorMaterials,
  ) {
    this.scene = scene;
    this.gameObjectManager = gameObjectManager;
    this.vectorMaterials = vectorMaterials;
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
      const enemy = new Sentinel(this.vectorMaterials);
      // Offset each enemy in the group so they don't stack
      const offset = new THREE.Vector3(
        (j - event.count / 2) * 3, // spread horizontally
        0,
        (j % 2) * 2, // slight depth offset
      );
      const spawnPos = new THREE.Vector3(...event.position).add(offset);
      enemy.setSpawnPosition(spawnPos);
      this.scene.add(enemy.getObject3D());
      this.gameObjectManager.add(enemy);
      // Each enemy gets its own state instances for independent behavior
      enemy.transitionToState(new SpawnState(new PatrolState()));
      eventBus.emit('enemySpawned', {
        enemy,
        position: { x: spawnPos.x, y: spawnPos.y, z: spawnPos.z },
      });
      Logger.info('Spawner', 'Sentinel spawned', { id: enemy.id, position: spawnPos });
    }
  }
}
