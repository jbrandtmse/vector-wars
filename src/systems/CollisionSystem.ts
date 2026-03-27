/**
 * CollisionSystem -- Ray-sphere collision detection between Data Lance bolts and enemies.
 *
 * Uses THREE.Ray.intersectSphere() for efficient mathematical sphere intersection tests.
 * Pre-allocates temp vectors for zero-allocation per-frame collision checks.
 *
 * Architecture: receives bolt data and GameObjectManager via constructor --
 * does NOT import DataLanceSystem or EnemySpawner directly.
 *
 * Created by: Story 2-3
 */

import * as THREE from 'three';
import type { BoltData } from './DataLanceSystem.ts';
import type { GameObjectManager } from '../entities/GameObjectManager.ts';
import type { Enemy } from '../entities/enemies/Enemy.ts';
import { DATA_LANCE_BOLT_DAMAGE } from '../config/constants.ts';
import { eventBus } from '../core/GameEvents.ts';
import { Logger } from '../core/Logger.ts';

const RAM_DAMAGE_TO_PLAYER = 15;
const RAM_DAMAGE_TO_ENEMY = 9999; // instant kill
const RAM_COOLDOWN = 0.5;

export class CollisionSystem {
  private gameObjectManager: GameObjectManager;
  private bolts: readonly BoltData[];
  private playerCollider: THREE.Sphere | null;
  private ramCooldown = 0;

  // Pre-allocated temp vectors for zero-allocation collision checks
  private tempRay = new THREE.Ray();
  private tempTarget = new THREE.Vector3();

  constructor(
    gameObjectManager: GameObjectManager,
    bolts: readonly BoltData[],
    playerCollider?: THREE.Sphere,
  ) {
    this.gameObjectManager = gameObjectManager;
    this.bolts = bolts;
    this.playerCollider = playerCollider ?? null;
  }

  update(dt?: number): void {
    this.checkBoltEnemyCollisions();
    if (this.playerCollider && dt !== undefined) {
      this.checkPlayerEnemyCollisions(dt);
    }
  }

  private checkPlayerEnemyCollisions(dt: number): void {
    if (this.ramCooldown > 0) {
      this.ramCooldown -= dt;
      return;
    }

    const entities = this.gameObjectManager.getAll();
    for (const entity of entities) {
      if (!entity.isActive) continue;
      if (!('takeDamage' in entity)) continue;

      const enemy = entity as Enemy;
      const collider = enemy.getCollider();

      if (this.playerCollider!.intersectsSphere(collider)) {
        // Ram: destroy enemy and damage player
        enemy.takeDamage(RAM_DAMAGE_TO_ENEMY);
        eventBus.emit('playerHit', { damage: RAM_DAMAGE_TO_PLAYER, source: 'ram' });
        this.ramCooldown = RAM_COOLDOWN;
        Logger.debug('Collision', 'Player rammed enemy', { enemyId: enemy.id });
        break; // One ram per cooldown
      }
    }
  }

  private checkBoltEnemyCollisions(): void {
    const entities = this.gameObjectManager.getAll();

    for (const bolt of this.bolts) {
      if (!bolt.active) continue;

      // Build ray from bolt position along bolt direction
      this.tempRay.origin.copy(bolt.mesh.position);
      this.tempRay.direction.copy(bolt.direction);

      for (const entity of entities) {
        if (!entity.isActive) continue;

        // Only test Enemy instances (check for takeDamage method)
        if (!('takeDamage' in entity)) continue;

        const enemy = entity as Enemy;
        const collider = enemy.getCollider();

        // Ray-sphere intersection test
        const hit = this.tempRay.intersectSphere(collider, this.tempTarget);

        if (hit) {
          // Verify the hit is near the bolt (not behind it or far ahead)
          const distToHit = bolt.mesh.position.distanceTo(hit);
          if (distToHit < collider.radius * 2 + 2) {
            // Hit confirmed
            enemy.takeDamage(DATA_LANCE_BOLT_DAMAGE);
            bolt.active = false;
            bolt.mesh.visible = false;
            Logger.debug('Collision', 'Bolt hit enemy', {
              distance: distToHit,
            });
            break; // Bolt can only hit one enemy
          }
        }
      }
    }
  }
}
