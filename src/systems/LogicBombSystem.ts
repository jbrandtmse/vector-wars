/**
 * LogicBombSystem — Manages lock-on targeting, firing, and homing
 * projectile lifecycle for the Logic Bomb heavy weapon.
 *
 * Architecture: Same pattern as DataLanceSystem — owns its projectile
 * pool, handles its own collision detection (bomb->target sphere check),
 * and does NOT import other systems.
 *
 * GDD: "Limited-supply heavy missiles with lock-on targeting.
 * Weighty feel — slight delay before launch, then powerful impact."
 *
 * Created by: Story 3-5
 */

import * as THREE from 'three';
import {
  LOGIC_BOMB_POOL_SIZE,
  LOGIC_BOMB_MAX_AMMO,
  LOGIC_BOMB_FIRE_COOLDOWN,
  LOGIC_BOMB_DAMAGE,
  LOGIC_BOMB_LOCK_CONE_ANGLE,
  LOGIC_BOMB_LOCK_RANGE,
} from '../config/constants.ts';
import { LogicBomb } from '../entities/projectiles/LogicBomb.ts';
import { eventBus } from '../core/GameEvents.ts';
import { Logger } from '../core/Logger.ts';
import type { InputManager } from '../core/InputManager.ts';
import type { VectorMaterials } from '../rendering/VectorMaterials.ts';
import type { CockpitRenderer } from '../rendering/CockpitRenderer.ts';
import type { GameObjectManager } from '../entities/GameObjectManager.ts';
import type { Enemy } from '../entities/enemies/Enemy.ts';

const BOMB_LINE_WIDTH = 3.5;

export class LogicBombSystem {
  private bombs: LogicBomb[] = [];
  private cooldown = 0;
  private ammo: number = LOGIC_BOMB_MAX_AMMO;
  private lockedTarget: Enemy | null = null;

  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private inputManager: InputManager;
  private cockpitRenderer: CockpitRenderer;
  private gameObjectManager: GameObjectManager;

  // Pre-allocated vectors for lock-on computation (zero-allocation pattern)
  private tempCameraPos = new THREE.Vector3();
  private tempCameraDir = new THREE.Vector3();
  private tempToEnemy = new THREE.Vector3();

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

    // Create ONE shared fat material for all Logic Bomb instances
    const bombMaterial = vectorMaterials.createFat('logic-bomb', BOMB_LINE_WIDTH);

    // Pre-allocate bomb pool
    for (let i = 0; i < LOGIC_BOMB_POOL_SIZE; i++) {
      const bomb = new LogicBomb(bombMaterial);
      scene.add(bomb.mesh);
      this.bombs.push(bomb);
    }
  }

  update(dt: number): void {
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.scanForTarget();

    if (
      this.inputManager.isActive('logicBomb') &&
      this.lockedTarget &&
      this.ammo > 0 &&
      this.cooldown <= 0
    ) {
      this.fire();
    }

    this.updateBombs(dt);
    this.checkBombCollisions();
  }

  private scanForTarget(): void {
    // Only scan when ammo > 0
    if (this.ammo <= 0) {
      if (this.lockedTarget !== null) {
        this.lockedTarget = null;
        eventBus.emit('logicBombLockLost', {} as Record<string, never>);
      }
      return;
    }

    this.camera.getWorldPosition(this.tempCameraPos);
    this.camera.getWorldDirection(this.tempCameraDir);

    let bestTarget: Enemy | null = null;
    let bestAngle = LOGIC_BOMB_LOCK_CONE_ANGLE;

    const entities = this.gameObjectManager.getAll();
    for (const entity of entities) {
      if (!entity.isActive) continue;
      if (!('takeDamage' in entity)) continue;

      const enemy = entity as Enemy;
      this.tempToEnemy.copy(enemy.getPosition()).sub(this.tempCameraPos);
      const distance = this.tempToEnemy.length();
      if (distance > LOGIC_BOMB_LOCK_RANGE) continue;

      this.tempToEnemy.normalize();
      const angle = this.tempToEnemy.angleTo(this.tempCameraDir);
      if (angle < bestAngle) {
        bestAngle = angle;
        bestTarget = enemy;
      }
    }

    // Emit lock events on state change
    if (bestTarget !== this.lockedTarget) {
      this.lockedTarget = bestTarget;
      if (bestTarget) {
        eventBus.emit('logicBombLockOn', { target: bestTarget });
      } else {
        eventBus.emit('logicBombLockLost', {} as Record<string, never>);
      }
    }
  }

  private fire(): void {
    const bomb = this.acquireBomb();
    if (!bomb) return;

    this.camera.getWorldPosition(this.tempCameraPos);
    this.camera.getWorldDirection(this.tempCameraDir);

    bomb.activate(this.tempCameraPos, this.tempCameraDir, this.lockedTarget);
    this.ammo--;
    this.cooldown = LOGIC_BOMB_FIRE_COOLDOWN;

    // Emit weapon fired event
    eventBus.emit('weaponFired', {
      weapon: 'logicBomb',
      position: {
        x: this.tempCameraPos.x,
        y: this.tempCameraPos.y,
        z: this.tempCameraPos.z,
      },
    });

    // Trigger heavier recoil than Data Lance (2.0 vs 1.0)
    this.cockpitRenderer.recoilArms(2.0);

    Logger.debug('Weapon', 'Logic Bomb fired', { ammo: this.ammo });
  }

  private acquireBomb(): LogicBomb | undefined {
    for (const bomb of this.bombs) {
      if (!bomb.active) return bomb;
    }
    return undefined;
  }

  private updateBombs(dt: number): void {
    for (const bomb of this.bombs) {
      if (bomb.active) {
        bomb.update(dt);
      }
    }
  }

  private checkBombCollisions(): void {
    for (const bomb of this.bombs) {
      if (!bomb.active || !bomb.target) continue;
      if (!bomb.target.isActive) continue;

      const targetCollider = bomb.target.getCollider();
      if (bomb.collider.intersectsSphere(targetCollider)) {
        bomb.target.takeDamage(LOGIC_BOMB_DAMAGE);
        bomb.deactivate();
        Logger.debug('Combat', 'Logic Bomb hit target', {});
      }
    }
  }

  resetAmmo(): void {
    this.ammo = LOGIC_BOMB_MAX_AMMO;
  }

  getAmmo(): number {
    return this.ammo;
  }

  getLockedTarget(): Enemy | null {
    return this.lockedTarget;
  }

  getPoolStats(): { active: number; total: number } {
    let active = 0;
    for (const bomb of this.bombs) {
      if (bomb.active) active++;
    }
    return { active, total: this.bombs.length };
  }

  dispose(): void {
    for (const bomb of this.bombs) {
      this.scene.remove(bomb.mesh);
      bomb.mesh.geometry.dispose();
    }
    this.bombs.length = 0;
  }
}
