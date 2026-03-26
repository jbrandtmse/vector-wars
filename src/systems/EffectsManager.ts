/**
 * EffectsManager — Event-driven visual effects spawning with pre-allocated pool.
 *
 * Subscribes to game events via EventBus and spawns visual effects.
 * Pre-creates all explosion instances at construction time (pool pattern).
 * Does NOT import any other system -- architecture: systems never import each other.
 *
 * Created by: Story 2-4
 */

import * as THREE from 'three';
import { eventBus } from '../core/GameEvents.ts';
import { VectorShardExplosion } from '../entities/effects/VectorShardExplosion.ts';
import { MAX_ACTIVE_EXPLOSIONS } from '../config/constants.ts';
import { Logger } from '../core/Logger.ts';
import type { VectorMaterials } from '../rendering/VectorMaterials.ts';

export class EffectsManager {
  private explosions: VectorShardExplosion[];
  private nextExplosionIndex = 0;

  constructor(scene: THREE.Scene, vectorMaterials: VectorMaterials) {
    // Pre-create all explosion instances (pool pattern)
    this.explosions = [];
    for (let i = 0; i < MAX_ACTIVE_EXPLOSIONS; i++) {
      this.explosions.push(new VectorShardExplosion(scene, vectorMaterials));
    }

    // Subscribe to enemy destruction events
    eventBus.on('enemyDestroyed', ({ position }) => {
      this.spawnExplosion(position.x, position.y, position.z);
    });

    Logger.info('Effects', 'EffectsManager initialized', {
      poolSize: MAX_ACTIVE_EXPLOSIONS,
    });
  }

  private spawnExplosion(x: number, y: number, z: number): void {
    // Round-robin through the pool -- reuse oldest completed, or forcibly recycle oldest
    const explosion = this.explosions[this.nextExplosionIndex];
    explosion.spawn(x, y, z);
    this.nextExplosionIndex = (this.nextExplosionIndex + 1) % this.explosions.length;
    Logger.debug('Effects', 'Explosion spawned', { x, y, z, poolIndex: this.nextExplosionIndex });
  }

  update(dt: number): void {
    for (const explosion of this.explosions) {
      explosion.update(dt);
    }
  }
}
