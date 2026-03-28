/**
 * EMPBurstSystem — Manages EMP Burst activation, cooldown, area-of-effect
 * stun application, and expanding visual pulse lifecycle.
 *
 * Architecture: Same pattern as DataLanceSystem and LogicBombSystem — owns
 * its visual effect pool, handles area-of-effect detection, and does NOT
 * import other systems. Communicates via eventBus.
 *
 * GDD: "Cooldown-based area disruption pulse. No direct damage.
 * Stun/slow nearby enemies, create breathing room."
 *
 * Created by: Story 3-6
 */

import * as THREE from 'three';
import {
  EMP_BURST_COOLDOWN,
  EMP_BURST_RADIUS,
  EMP_BURST_STUN_DURATION,
  EMP_BURST_POOL_SIZE,
} from '../config/constants.ts';
import { EMPBurst } from '../entities/projectiles/EMPBurst.ts';
import { eventBus } from '../core/GameEvents.ts';
import { Logger } from '../core/Logger.ts';
import type { InputManager } from '../core/InputManager.ts';
import type { VectorMaterials } from '../rendering/VectorMaterials.ts';
import type { CockpitRenderer } from '../rendering/CockpitRenderer.ts';
import type { GameObjectManager } from '../entities/GameObjectManager.ts';
import type { Enemy } from '../entities/enemies/Enemy.ts';

export class EMPBurstSystem {
  private bursts: EMPBurst[] = [];
  private cooldown = 0;

  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private inputManager: InputManager;
  private cockpitRenderer: CockpitRenderer;
  private gameObjectManager: GameObjectManager;

  // Pre-allocated temp vector for AoE center (zero-allocation pattern)
  private tempCameraPos = new THREE.Vector3();

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    inputManager: InputManager,
    vectorMaterials: VectorMaterials,
    cockpitRenderer: CockpitRenderer,
    gameObjectManager: GameObjectManager,
  ) {
    this.scene = scene;
    this.camera = camera;
    this.inputManager = inputManager;
    this.cockpitRenderer = cockpitRenderer;
    this.gameObjectManager = gameObjectManager;

    // Pre-allocate burst pool
    for (let i = 0; i < EMP_BURST_POOL_SIZE; i++) {
      const burst = new EMPBurst(vectorMaterials, i);
      scene.add(burst.mesh);
      this.bursts.push(burst);
    }
  }

  update(dt: number): void {
    this.cooldown = Math.max(0, this.cooldown - dt);

    if (this.inputManager.isActive('emp') && this.cooldown <= 0) {
      this.activate();
    }

    this.updateVisuals(dt);
  }

  private activate(): void {
    this.camera.getWorldPosition(this.tempCameraPos);

    // Apply stun to all enemies within radius
    const entities = this.gameObjectManager.getAll();
    let stunCount = 0;
    for (const entity of entities) {
      if (!entity.isActive) continue;
      if (!('applyStun' in entity)) continue;

      const enemy = entity as Enemy;
      const distance = enemy.getPosition().distanceTo(this.tempCameraPos);
      if (distance <= EMP_BURST_RADIUS) {
        enemy.applyStun(EMP_BURST_STUN_DURATION);
        stunCount++;
      }
    }

    // Spawn visual pulse
    this.spawnVisual(this.tempCameraPos);

    // Set cooldown
    this.cooldown = EMP_BURST_COOLDOWN;

    // Emit events
    eventBus.emit('weaponFired', {
      weapon: 'emp',
      position: { x: this.tempCameraPos.x, y: this.tempCameraPos.y, z: this.tempCameraPos.z },
    });
    eventBus.emit('empBurstActivated', {
      position: { x: this.tempCameraPos.x, y: this.tempCameraPos.y, z: this.tempCameraPos.z },
      radius: EMP_BURST_RADIUS,
    });

    // Cockpit recoil
    this.cockpitRenderer.recoilArms(1.5);

    Logger.debug('Weapon', 'EMP Burst activated', { stunCount });
  }

  private spawnVisual(position: THREE.Vector3): void {
    for (const burst of this.bursts) {
      if (!burst.active) {
        burst.activate(position);
        return;
      }
    }
    // Pool exhausted — silently skip visual (rare with 8s cooldown and 3 pool)
  }

  private updateVisuals(dt: number): void {
    for (const burst of this.bursts) {
      if (burst.active) {
        burst.update(dt);
      }
    }
  }

  /**
   * Resets the EMP Burst system for a new playthrough.
   * Deactivates all active bursts and clears cooldown.
   * Called by resetGameState() when returning to menu.
   * (Story 6-8)
   */
  reset(): void {
    this.cooldown = 0;
    for (const burst of this.bursts) {
      if (burst.active) {
        burst.deactivate();
      }
    }
    Logger.info('Weapon', 'EMPBurstSystem reset');
  }

  getCooldownRemaining(): number {
    return this.cooldown;
  }

  getCooldownFraction(): number {
    return this.cooldown / EMP_BURST_COOLDOWN;
  }

  getPoolStats(): { active: number; total: number } {
    let active = 0;
    for (const burst of this.bursts) {
      if (burst.active) active++;
    }
    return { active, total: this.bursts.length };
  }

  dispose(): void {
    // Dispose shared geometry only once (all bursts share the same EdgesGeometry)
    let geometryDisposed = false;
    for (const burst of this.bursts) {
      this.scene.remove(burst.mesh);
      if (!geometryDisposed) {
        burst.mesh.geometry.dispose();
        geometryDisposed = true;
      }
    }
    this.bursts.length = 0;
  }
}
