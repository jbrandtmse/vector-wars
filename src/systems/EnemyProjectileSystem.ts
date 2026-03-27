/**
 * EnemyProjectileSystem — Manages enemy data burst projectile pool and player collision.
 *
 * Owns the pre-allocated EnemyDataBurst pool. Exposes fireAt() for AI states
 * to fire projectiles via callback injection. Checks sphere-sphere collision
 * between active projectiles and the player's bounding sphere each frame.
 * Emits playerHit events via EventBus on collision.
 *
 * Does NOT import any other system (CollisionSystem, DataLanceSystem, etc.).
 *
 * Created by: Story 2-5
 */

import * as THREE from 'three';
import { EnemyDataBurst } from '../entities/projectiles/EnemyDataBurst.ts';
import { eventBus } from '../core/GameEvents.ts';
import { Logger } from '../core/Logger.ts';
import {
  ENEMY_DATA_BURST_POOL_SIZE,
  ENEMY_DATA_BURST_MAX_RANGE,
} from '../config/constants.ts';
import type { VectorMaterials } from '../rendering/VectorMaterials.ts';

export class EnemyProjectileSystem {
  private bursts: EnemyDataBurst[] = [];
  private playerCollider: THREE.Sphere;

  // Pre-allocated temp vector for direction calculation
  private tempDirection = new THREE.Vector3();

  constructor(
    scene: THREE.Scene,
    vectorMaterials: VectorMaterials,
    playerCollider: THREE.Sphere,
  ) {
    this.playerCollider = playerCollider;

    // Create ONE shared fat material for all data bursts (visible streaks)
    const burstMaterial = vectorMaterials.createFat('enemy-data-burst', 2.0, -0.1);

    // Pre-allocate projectile pool
    for (let i = 0; i < ENEMY_DATA_BURST_POOL_SIZE; i++) {
      const burst = new EnemyDataBurst(burstMaterial);
      scene.add(burst.mesh);
      this.bursts.push(burst);
    }

    Logger.info('EnemyProjectile', 'EnemyProjectileSystem initialized', {
      poolSize: ENEMY_DATA_BURST_POOL_SIZE,
    });
  }

  /**
   * Fire a data burst from origin toward target.
   * Called by AttackState fire callback.
   */
  fireAt(origin: THREE.Vector3, target: THREE.Vector3, speed: number, damage: number): void {
    const burst = this.acquireBurst();
    if (!burst) return;

    this.tempDirection.subVectors(target, origin).normalize();
    burst.activate(origin, this.tempDirection, speed, damage);

    Logger.debug('EnemyProjectile', 'Data burst fired', {
      originX: origin.x.toFixed(1),
      originY: origin.y.toFixed(1),
      originZ: origin.z.toFixed(1),
    });
  }

  update(dt: number): void {
    for (const burst of this.bursts) {
      if (!burst.active) continue;
      burst.update(dt);

      // Range check
      if (burst.distance > ENEMY_DATA_BURST_MAX_RANGE) {
        burst.deactivate();
        continue;
      }

      // Sphere-sphere collision: projectile vs player
      if (burst.collider.intersectsSphere(this.playerCollider)) {
        eventBus.emit('playerHit', {
          damage: burst.damage,
          source: 'enemyDataBurst',
        });
        burst.deactivate();
        Logger.debug('EnemyProjectile', 'Player hit by data burst', {
          damage: burst.damage,
        });
      }
    }
  }

  /**
   * Returns pool stats for debug diagnostics (Story 2-9).
   */
  getPoolStats(): { active: number; total: number } {
    let active = 0;
    for (const burst of this.bursts) {
      if (burst.active) active++;
    }
    return { active, total: this.bursts.length };
  }

  private acquireBurst(): EnemyDataBurst | undefined {
    for (const burst of this.bursts) {
      if (!burst.active) return burst;
    }
    Logger.warn('EnemyProjectile', 'Burst pool exhausted');
    return undefined;
  }
}
