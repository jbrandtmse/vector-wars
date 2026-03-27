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
import {
  MAX_ACTIVE_EXPLOSIONS,
  BOSS_DESTRUCTION_SHATTER_EXPLOSION_COUNT,
  BOSS_DESTRUCTION_SHAKE_PEEL,
  BOSS_DESTRUCTION_SHAKE_STRIP,
  BOSS_DESTRUCTION_SHAKE_SHATTER,
} from '../config/constants.ts';
import { Logger } from '../core/Logger.ts';
import type { VectorMaterials } from '../rendering/VectorMaterials.ts';
import type { ScreenShake } from './ScreenShake.ts';

export class EffectsManager {
  private explosions: VectorShardExplosion[];
  private nextExplosionIndex = 0;
  private screenShake: ScreenShake | null = null;

  // Throttle tracking for destruction explosion spawning (Story 3-9)
  private destructionLastSpawnProgress: Record<string, number> = {};

  constructor(scene: THREE.Scene, vectorMaterials: VectorMaterials, screenShake?: ScreenShake) {
    this.screenShake = screenShake ?? null;

    // Pre-create all explosion instances (pool pattern)
    this.explosions = [];
    for (let i = 0; i < MAX_ACTIVE_EXPLOSIONS; i++) {
      this.explosions.push(new VectorShardExplosion(scene, vectorMaterials));
    }

    // Subscribe to enemy destruction events
    eventBus.on('enemyDestroyed', ({ position }) => {
      this.spawnExplosion(position.x, position.y, position.z);
    });

    // Subscribe to boss destruction stage events (Story 3-9)
    eventBus.on('bossDestructionStage', ({ stage, progress, position }) => {
      this.onBossDestructionStage(stage, progress, position);
    });

    Logger.info('Effects', 'EffectsManager initialized', {
      poolSize: MAX_ACTIVE_EXPLOSIONS,
    });
  }

  /**
   * Handle boss destruction stage events: spawn explosions and trigger screen shake.
   */
  private onBossDestructionStage(
    stage: string,
    progress: number,
    position: { x: number; y: number; z: number },
  ): void {
    // Screen shake based on stage intensity
    if (this.screenShake) {
      if (stage === 'peel') {
        this.screenShake.shake(BOSS_DESTRUCTION_SHAKE_PEEL);
      } else if (stage === 'strip') {
        this.screenShake.shake(BOSS_DESTRUCTION_SHAKE_STRIP);
      } else if (stage === 'shatter') {
        this.screenShake.shake(BOSS_DESTRUCTION_SHAKE_SHATTER);
      }
    }

    // Explosion spawning with throttling
    if (stage === 'peel') {
      const lastProgress = this.destructionLastSpawnProgress['peel'] ?? -1;
      // Throttle to every ~0.25 progress (approx 0.5s at 2.0s duration)
      if (progress - lastProgress >= 0.25) {
        this.spawnExplosion(position.x, position.y, position.z);
        this.destructionLastSpawnProgress['peel'] = progress;
      }
    } else if (stage === 'strip') {
      const lastProgress = this.destructionLastSpawnProgress['strip'] ?? -1;
      // Throttle to every ~0.33 progress (approx 0.5s at 1.5s duration)
      if (progress - lastProgress >= 0.33) {
        this.spawnExplosion(position.x, position.y, position.z);
        this.spawnExplosion(position.x, position.y, position.z);
        this.destructionLastSpawnProgress['strip'] = progress;
      }
    } else if (stage === 'shatter' && progress >= 1.0) {
      // Final shatter: spawn multiple simultaneous explosions
      for (let i = 0; i < BOSS_DESTRUCTION_SHATTER_EXPLOSION_COUNT; i++) {
        // Slight random offset for visual variety
        const offsetX = position.x + (Math.random() * 4 - 2);
        const offsetY = position.y + (Math.random() * 4 - 2);
        const offsetZ = position.z + (Math.random() * 4 - 2);
        this.spawnExplosion(offsetX, offsetY, offsetZ);
      }
      // Reset throttle tracking
      this.destructionLastSpawnProgress = {};
    }
  }

  private spawnExplosion(x: number, y: number, z: number): void {
    // Round-robin through the pool -- reuse oldest completed, or forcibly recycle oldest
    const explosion = this.explosions[this.nextExplosionIndex];
    explosion.spawn(x, y, z);
    this.nextExplosionIndex = (this.nextExplosionIndex + 1) % this.explosions.length;
    Logger.debug('Effects', 'Explosion spawned', { x, y, z, poolIndex: this.nextExplosionIndex });
  }

  /**
   * Returns pool stats for debug diagnostics (Story 2-9).
   */
  getPoolStats(): { active: number; total: number } {
    let active = 0;
    for (const explosion of this.explosions) {
      if (explosion.isActive) active++;
    }
    return { active, total: this.explosions.length };
  }

  update(dt: number): void {
    for (const explosion of this.explosions) {
      explosion.update(dt);
    }
  }
}
