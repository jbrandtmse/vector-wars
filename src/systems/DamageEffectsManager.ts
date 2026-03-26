/**
 * DamageEffectsManager — Coordinates screen shake and damage flash on player hits.
 *
 * Subscribes to playerHit events and triggers both ScreenShake and RenderPipeline
 * damage flash. Does NOT import Player, CollisionSystem, or any entity.
 *
 * Created by: Story 2-7
 */

import { eventBus } from '../core/GameEvents.ts';
import { PLAYER_MAX_SHIELDS, DAMAGE_FLASH_MIN_INTENSITY } from '../config/constants.ts';
import { Logger } from '../core/Logger.ts';
import type { ScreenShake } from './ScreenShake.ts';
import type { RenderPipeline } from '../rendering/RenderPipeline.ts';

export class DamageEffectsManager {
  private screenShake: ScreenShake;
  private renderPipeline: RenderPipeline;

  constructor(screenShake: ScreenShake, renderPipeline: RenderPipeline) {
    this.screenShake = screenShake;
    this.renderPipeline = renderPipeline;

    // Subscribe to player damage events
    eventBus.on('playerHit', ({ damage }) => {
      this.onPlayerHit(damage);
    });

    Logger.info('DamageEffects', 'DamageEffectsManager initialized');
  }

  private onPlayerHit(damage: number): void {
    // Intensity proportional to damage, clamped to [MIN, 1.0]
    const raw = damage / PLAYER_MAX_SHIELDS;
    const intensity = Math.min(1.0, Math.max(DAMAGE_FLASH_MIN_INTENSITY, raw));

    this.screenShake.shake(intensity);
    this.renderPipeline.triggerDamageFlash(intensity);

    Logger.debug('DamageEffects', 'Damage effects triggered', {
      damage,
      intensity,
    });
  }
}
