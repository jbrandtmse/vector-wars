/**
 * BossPhase -- Phase 4 state: boss encounter arena.
 *
 * Manages the boss arena lifecycle: creates arena environment, spawns
 * a boss via factory function, drives a closed-loop orbit rail path,
 * and handles camera lookAt toward the boss.
 *
 * Pattern: Same lifecycle as SurfacePhase/CorridorPhase -- enter/update/exit.
 *
 * Created by: Story 3-7
 * Updated by: Story 5-2 (boss factory pattern for per-level boss selection)
 */

import * as THREE from 'three';
import { GatekeeperBoss } from '../../entities/bosses/GatekeeperBoss.ts';
import { eventBus } from '../../core/GameEvents.ts';
import { Logger } from '../../core/Logger.ts';
import {
  BLOOM_LAYER,
  BOSS_ARENA_RAIL_POINTS,
  BOSS_ARENA_RAIL_SPEED,
  BOSS_CAMERA_LOOK_LERP,
} from '../../config/constants.ts';
import type { Boss } from '../../entities/bosses/Boss.ts';
import type { VectorMaterials } from '../../rendering/VectorMaterials.ts';
import type { GameObjectManager } from '../../entities/GameObjectManager.ts';

/** Factory function type for creating boss instances */
export type BossFactory = (vectorMaterials: VectorMaterials, playerPositionGetter: () => THREE.Vector3) => Boss;

export class BossPhase {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private vectorMaterials: VectorMaterials;
  private gameObjectManager: GameObjectManager;
  private playerPositionGetter: () => THREE.Vector3;
  private bossFactory: BossFactory;

  // Boss entity
  private boss: Boss | null = null;

  // Rail path
  private curve: THREE.CatmullRomCurve3 | null = null;
  private orbitProgress = 0;
  private totalLength = 0;

  // Arena environment
  private gridFloor: THREE.LineSegments | null = null;
  private gridFloorGeometry: THREE.EdgesGeometry | null = null;
  private gridFloorMaterial: THREE.LineBasicMaterial | null = null;

  // Phase state
  private bossDefeated = false;
  private completed = false;

  // Pre-allocated temp objects for camera lookAt (zero per-frame allocation)
  private targetMatrix = new THREE.Matrix4();
  private targetQuat = new THREE.Quaternion();
  private upVector = new THREE.Vector3(0, 1, 0);
  private tempRailPos = new THREE.Vector3();
  private tempBossPos = new THREE.Vector3();

  // Event listener references for cleanup
  private onBossDefeated: ((data: { position: { x: number; y: number; z: number }; scoreValue: number }) => void) | null = null;
  private onBossDestroyed: ((data: { position: { x: number; y: number; z: number }; scoreValue: number }) => void) | null = null;

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    vectorMaterials: VectorMaterials,
    gameObjectManager: GameObjectManager,
    playerPositionGetter: () => THREE.Vector3,
    bossFactory?: BossFactory,
  ) {
    this.scene = scene;
    this.camera = camera;
    this.vectorMaterials = vectorMaterials;
    this.gameObjectManager = gameObjectManager;
    this.playerPositionGetter = playerPositionGetter;
    // Default to GatekeeperBoss if no factory provided (backward compatibility)
    this.bossFactory = bossFactory ?? ((vm, ppg) => new GatekeeperBoss(vm, ppg));
  }

  enter(): void {
    Logger.info('BossPhase', 'Entering boss encounter phase');

    this.completed = false;
    this.bossDefeated = false;
    this.orbitProgress = 0;

    // Create boss arena environment (minimal grid)
    this.createArenaEnvironment();

    // Create boss arena rail path (closed loop)
    const pts = BOSS_ARENA_RAIL_POINTS.map(
      ([x, y, z]) => new THREE.Vector3(x, y, z),
    );
    this.curve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5);
    this.totalLength = this.curve.getLength();

    // Spawn boss at world origin using factory
    this.boss = this.bossFactory(this.vectorMaterials, this.playerPositionGetter);
    this.boss.getObject3D().position.set(0, 0, 0);
    this.scene.add(this.boss.getObject3D());
    this.gameObjectManager.add(this.boss);

    // Subscribe to boss defeated event (for state tracking, NOT completion)
    this.onBossDefeated = () => {
      this.bossDefeated = true;
      Logger.info('BossPhase', 'Boss defeated, awaiting destruction sequence');
    };
    eventBus.on('bossDefeated', this.onBossDefeated);

    // Subscribe to boss destroyed event (fires after destruction sequence completes)
    // This is the actual completion trigger -- ensures the 5.5s destruction
    // sequence plays fully before the phase transition begins.
    this.onBossDestroyed = () => {
      this.completed = true;
      Logger.info('BossPhase', 'Boss destroyed, phase signaling completion');
    };
    eventBus.on('bossDestroyed', this.onBossDestroyed);

    Logger.info('BossPhase', 'Boss phase entered', {
      bossHealth: this.boss.health,
      railLength: this.totalLength,
    });
  }

  update(dt: number): void {
    if (!this.curve || !this.boss) return;

    // Advance orbit progress along rail
    this.orbitProgress += (BOSS_ARENA_RAIL_SPEED * dt) / this.totalLength;
    // Wrap for seamless looping
    this.orbitProgress = this.orbitProgress % 1;
    if (this.orbitProgress < 0) this.orbitProgress += 1;

    // Update camera position from rail
    this.curve.getPointAt(this.orbitProgress, this.tempRailPos);
    this.camera.position.copy(this.tempRailPos);

    // Smooth lookAt toward boss position using quaternion slerp
    this.tempBossPos.copy(this.boss.getPosition());
    this.targetMatrix.lookAt(this.camera.position, this.tempBossPos, this.upVector);
    this.targetQuat.setFromRotationMatrix(this.targetMatrix);
    this.camera.quaternion.slerp(this.targetQuat, Math.min(1, BOSS_CAMERA_LOOK_LERP * dt));

    // Update boss entity
    this.boss.update(dt);

    // NOTE: Phase completion is now triggered by bossDestroyed event,
    // NOT by bossDefeated. This ensures the destruction sequence plays
    // fully before the phase transition begins. (Story 3-10)
  }

  exit(): void {
    Logger.info('BossPhase', 'Exiting boss encounter phase');

    // Unsubscribe from events
    if (this.onBossDefeated) {
      eventBus.off('bossDefeated', this.onBossDefeated);
      this.onBossDefeated = null;
    }
    if (this.onBossDestroyed) {
      eventBus.off('bossDestroyed', this.onBossDestroyed);
      this.onBossDestroyed = null;
    }

    // Dispose boss
    if (this.boss) {
      this.scene.remove(this.boss.getObject3D());
      this.gameObjectManager.remove(this.boss);
      this.boss.dispose();
      this.boss = null;
    }

    // Dispose arena environment
    if (this.gridFloor) {
      this.scene.remove(this.gridFloor);
      this.gridFloor = null;
    }
    if (this.gridFloorGeometry) {
      this.gridFloorGeometry.dispose();
      this.gridFloorGeometry = null;
    }
    if (this.gridFloorMaterial) {
      this.gridFloorMaterial.dispose();
      this.gridFloorMaterial = null;
    }

    // Null out references
    this.curve = null;

    Logger.info('BossPhase', 'Boss phase exited, resources disposed');
  }

  /** Returns whether the phase has completed (boss defeated) */
  isComplete(): boolean {
    return this.completed;
  }

  /** Returns the boss entity (for testing/inspection) */
  getBoss(): Boss | null {
    return this.boss;
  }

  /** Returns whether the boss has been defeated */
  isBossDefeated(): boolean {
    return this.bossDefeated;
  }

  /** Returns current orbit progress for testing */
  getOrbitProgress(): number {
    return this.orbitProgress;
  }

  private createArenaEnvironment(): void {
    // Minimal grid floor below the boss
    const basePlane = new THREE.PlaneGeometry(200, 200, 20, 20);
    this.gridFloorGeometry = new THREE.EdgesGeometry(basePlane);
    basePlane.dispose();

    this.gridFloorMaterial = this.vectorMaterials.create('bossArenaGrid', -0.2);

    this.gridFloor = new THREE.LineSegments(this.gridFloorGeometry, this.gridFloorMaterial);
    this.gridFloor.layers.enable(BLOOM_LAYER);
    this.gridFloor.rotation.x = -Math.PI / 2;
    this.gridFloor.position.set(0, -15, 0);

    this.scene.add(this.gridFloor);
  }
}
