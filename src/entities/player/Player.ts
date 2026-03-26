/**
 * Player — Player entity with shields and bounding sphere collider.
 *
 * Syncs its collider to the camera position each frame (called from main.ts).
 * Subscribes to playerHit events and reduces shields on damage.
 * Does NOT extend GameObject -- it's a special entity that tracks the camera.
 *
 * Created by: Story 2-5
 */

import * as THREE from 'three';
import { PLAYER_MAX_SHIELDS, PLAYER_COLLIDER_RADIUS } from '../../config/constants.ts';
import { eventBus } from '../../core/GameEvents.ts';
import { Logger } from '../../core/Logger.ts';

export class Player {
  public shields: number;
  public maxShields: number;
  public readonly collider: THREE.Sphere;
  private dead = false;

  constructor() {
    this.maxShields = PLAYER_MAX_SHIELDS;
    this.shields = PLAYER_MAX_SHIELDS;
    this.collider = new THREE.Sphere(new THREE.Vector3(), PLAYER_COLLIDER_RADIUS);

    // Subscribe to damage events
    eventBus.on('playerHit', ({ damage, source }) => {
      this.takeDamage(damage, source);
    });

    // Emit initial shield state for HUD (Story 2-6)
    eventBus.emit('shieldChanged', {
      shields: this.shields,
      maxShields: this.maxShields,
    });

    Logger.info('Player', 'Player initialized', {
      shields: this.shields,
      maxShields: this.maxShields,
    });
  }

  takeDamage(damage: number, source: string): void {
    this.shields = Math.max(0, this.shields - damage);

    // Emit shield change for HUD (Story 2-6)
    eventBus.emit('shieldChanged', {
      shields: this.shields,
      maxShields: this.maxShields,
    });

    // Emit playerDied exactly once when shields deplete (Story 2-10)
    if (this.shields <= 0 && !this.dead) {
      this.dead = true;
      eventBus.emit('playerDied', {} as Record<string, never>);
      Logger.info('Player', 'Player destroyed -- shields depleted');
    }

    Logger.info('Player', 'Damage taken', {
      damage,
      source,
      shieldsRemaining: this.shields,
    });
  }

  /**
   * Sync collider center to camera position each frame.
   * Called from main.ts animation loop.
   */
  syncToCamera(camera: THREE.Camera): void {
    this.collider.center.copy(camera.position);
  }
}
