/**
 * VirusPayloadSystem -- Manages Virus Payload firing, pooling,
 * boss collision detection, and vulnerability window gating.
 *
 * Architecture: Same pattern as LogicBombSystem and EMPBurstSystem --
 * owns its projectile pool, handles its own collision detection,
 * and does NOT import other systems. Communicates via eventBus.
 *
 * GDD: "Phase-specific availability. Single use per target.
 * Lethal to AI cores. Boss killer -- literally injecting a virus."
 *
 * The weapon is ONLY fireable during boss vulnerability windows.
 * Subscribes to bossVulnerable events to track window state.
 *
 * Created by: Story 3-8
 */

import * as THREE from 'three';
import {
  VIRUS_PAYLOAD_POOL_SIZE,
  VIRUS_PAYLOAD_FIRE_COOLDOWN,
  VIRUS_PAYLOAD_DAMAGE,
} from '../config/constants.ts';
import { VirusPayload } from '../entities/projectiles/VirusPayload.ts';
import { eventBus } from '../core/GameEvents.ts';
import { Logger } from '../core/Logger.ts';
import type { InputManager } from '../core/InputManager.ts';
import type { VectorMaterials } from '../rendering/VectorMaterials.ts';
import type { CockpitRenderer } from '../rendering/CockpitRenderer.ts';
import type { GameObjectManager } from '../entities/GameObjectManager.ts';

export class VirusPayloadSystem {
  private payloads: VirusPayload[] = [];
  private cooldown = 0;
  private bossIsVulnerable = false;
  private bossIsDefeated = false;

  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private inputManager: InputManager;
  private cockpitRenderer: CockpitRenderer;
  private gameObjectManager: GameObjectManager;

  // Pre-allocated temp vectors for camera position/direction (zero-allocation pattern)
  private tempCameraPos = new THREE.Vector3();
  private tempCameraDir = new THREE.Vector3();

  // Event handler references for cleanup
  private handleBossVulnerable: (event: { vulnerable: boolean }) => void;
  private handleBossDefeated: () => void;

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

    // Pre-allocate payload pool
    for (let i = 0; i < VIRUS_PAYLOAD_POOL_SIZE; i++) {
      const payload = new VirusPayload(vectorMaterials, i);
      scene.add(payload.mesh);
      this.payloads.push(payload);
    }

    // Subscribe to boss vulnerability events
    this.handleBossVulnerable = (event) => {
      this.bossIsVulnerable = event.vulnerable;
    };
    eventBus.on('bossVulnerable', this.handleBossVulnerable);

    // Subscribe to boss defeated events
    this.handleBossDefeated = () => {
      this.bossIsDefeated = true;
      this.bossIsVulnerable = false;
      // Deactivate all in-flight payloads
      for (const payload of this.payloads) {
        if (payload.active) {
          payload.deactivate();
        }
      }
    };
    eventBus.on('bossDefeated', this.handleBossDefeated);
  }

  update(dt: number): void {
    this.cooldown = Math.max(0, this.cooldown - dt);

    if (
      this.inputManager.isActive('virusPayload') &&
      this.bossIsVulnerable &&
      !this.bossIsDefeated &&
      this.cooldown <= 0
    ) {
      this.fire();
    }

    this.updatePayloads(dt);
    this.checkPayloadCollisions();
  }

  private fire(): void {
    const payload = this.acquirePayload();
    if (!payload) return;

    this.camera.getWorldPosition(this.tempCameraPos);
    this.camera.getWorldDirection(this.tempCameraDir);

    payload.activate(this.tempCameraPos, this.tempCameraDir);
    this.cooldown = VIRUS_PAYLOAD_FIRE_COOLDOWN;

    // Emit weapon fired event
    eventBus.emit('weaponFired', {
      weapon: 'virusPayload',
      position: {
        x: this.tempCameraPos.x,
        y: this.tempCameraPos.y,
        z: this.tempCameraPos.z,
      },
    });

    // Trigger heaviest recoil of all weapons (2.5)
    this.cockpitRenderer.recoilArms(2.5);

    Logger.debug('Weapon', 'Virus Payload fired', {});
  }

  private acquirePayload(): VirusPayload | undefined {
    for (const payload of this.payloads) {
      if (!payload.active) return payload;
    }
    return undefined;
  }

  private updatePayloads(dt: number): void {
    for (const payload of this.payloads) {
      if (payload.active) {
        payload.update(dt);
      }
    }
  }

  private checkPayloadCollisions(): void {
    for (const payload of this.payloads) {
      if (!payload.active) continue;

      const entities = this.gameObjectManager.getAll();
      for (const entity of entities) {
        if (!entity.isActive) continue;
        // Duck-type check: only Boss has the 'defeated' property
        if (!('takeDamage' in entity) || !('defeated' in entity)) continue;

        const entityCollider = entity.getCollider();
        if (payload.collider.intersectsSphere(entityCollider)) {
          (entity as unknown as { takeDamage(amount: number): void }).takeDamage(VIRUS_PAYLOAD_DAMAGE);

          // Emit virusPayloadDelivered event
          const pos = payload.mesh.position;
          eventBus.emit('virusPayloadDelivered', {
            position: { x: pos.x, y: pos.y, z: pos.z },
            damage: VIRUS_PAYLOAD_DAMAGE,
          });

          payload.deactivate();
          Logger.debug('Combat', 'Virus Payload hit boss', {});
          break;
        }
      }
    }
  }

  /**
   * Resets the Virus Payload system for a new playthrough.
   * Clears boss state, cooldown, and deactivates all in-flight payloads.
   * Called by resetGameState() when returning to menu.
   * (Story 6-8)
   */
  reset(): void {
    this.bossIsDefeated = false;
    this.bossIsVulnerable = false;
    this.cooldown = 0;
    for (const payload of this.payloads) {
      if (payload.active) {
        payload.deactivate();
      }
    }
    Logger.info('Weapon', 'VirusPayloadSystem reset');
  }

  getPoolStats(): { active: number; total: number } {
    let active = 0;
    for (const payload of this.payloads) {
      if (payload.active) active++;
    }
    return { active, total: this.payloads.length };
  }

  getCooldownRemaining(): number {
    return this.cooldown;
  }

  isBossVulnerable(): boolean {
    return this.bossIsVulnerable;
  }

  dispose(): void {
    // Unsubscribe from events
    eventBus.off('bossVulnerable', this.handleBossVulnerable);
    eventBus.off('bossDefeated', this.handleBossDefeated);

    // Dispose shared geometry only once (all payloads share the same EdgesGeometry)
    let geometry1Disposed = false;
    let geometry2Disposed = false;
    for (const payload of this.payloads) {
      this.scene.remove(payload.mesh);
      const rings = payload.mesh.children as THREE.LineSegments[];
      if (rings.length >= 2) {
        if (!geometry1Disposed) {
          rings[0].geometry.dispose();
          geometry1Disposed = true;
        }
        if (!geometry2Disposed) {
          rings[1].geometry.dispose();
          geometry2Disposed = true;
        }
      }
    }
    this.payloads.length = 0;
  }
}
