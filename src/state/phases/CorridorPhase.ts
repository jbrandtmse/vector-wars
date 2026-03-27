/**
 * CorridorPhase — Phase 3: Data Corridor.
 *
 * Player flies through a narrowing wireframe corridor, dodging
 * firewalls (timing), network cables (positioning), and data
 * streams (reflexes). Pure survival run — phase completes when
 * the player reaches the end of the rail path.
 *
 * Architecture: Manages its own geometry and obstacles independently.
 * Same enter/update/exit lifecycle as SurfacePhase.
 *
 * Created by: Story 3-4
 */

import * as THREE from 'three';
import { Firewall } from '../../entities/obstacles/Firewall.ts';
import { NetworkCable } from '../../entities/obstacles/NetworkCable.ts';
import { DataStream } from '../../entities/obstacles/DataStream.ts';
import { RailMovement } from '../../systems/RailMovement.ts';
import { eventBus } from '../../core/GameEvents.ts';
import { Logger } from '../../core/Logger.ts';
import type { Obstacle } from '../../entities/obstacles/Obstacle.ts';
import type { VectorMaterials } from '../../rendering/VectorMaterials.ts';
import {
  BLOOM_LAYER,
  CORRIDOR_RAIL_PATH_POINTS,
  CORRIDOR_OBSTACLES,
  CORRIDOR_WALL_WIDTH,
  CORRIDOR_WALL_MIN_WIDTH,
  CORRIDOR_HEIGHT,
  CORRIDOR_LENGTH,
  CORRIDOR_OBSTACLE_DAMAGE,
  CORRIDOR_HIT_COOLDOWN,
  CORRIDOR_RAIL_SPEED_MULTIPLIER,
  RAIL_SPEED,
} from '../../config/constants.ts';

/** Completion threshold for rail progress — near the end of the path */
const RAIL_COMPLETION_THRESHOLD = 0.98;

/** Number of wall segments per side for the narrowing effect */
const WALL_SEGMENTS = 7;

export class CorridorPhase {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private vectorMaterials: VectorMaterials;
  private playerSphere: THREE.Sphere;

  // Corridor wall geometry
  private wallSegments: THREE.LineSegments[] = [];
  private wallGeometries: THREE.EdgesGeometry[] = [];
  private wallMaterial: THREE.LineBasicMaterial | null = null;
  private floorMaterial: THREE.LineBasicMaterial | null = null;

  // Obstacles
  private obstacles: Obstacle[] = [];

  // Rail movement
  private railMovement: RailMovement | null = null;

  // Phase state
  private completed = false;
  private hitCooldownTimer = 0;

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    vectorMaterials: VectorMaterials,
    playerSphere: THREE.Sphere,
  ) {
    this.scene = scene;
    this.camera = camera;
    this.vectorMaterials = vectorMaterials;
    this.playerSphere = playerSphere;
  }

  enter(): void {
    Logger.info('CorridorPhase', 'Entering data corridor phase');

    this.completed = false;
    this.hitCooldownTimer = 0;

    // Create corridor wall geometry
    this.createCorridorWalls();

    // Create obstacles
    this.createObstacles();

    // Create rail movement for corridor path (non-looping)
    this.railMovement = new RailMovement(
      this.camera,
      CORRIDOR_RAIL_PATH_POINTS,
      false, // open (non-looping) path
    );

    Logger.info('CorridorPhase', 'Corridor phase entered', {
      obstacles: this.obstacles.length,
      wallSegments: this.wallSegments.length,
    });
  }

  update(dt: number, viewportOffset?: { x: number; y: number }): void {
    if (this.completed) return;

    // Update rail movement with corridor speed multiplier and viewport offset
    if (this.railMovement) {
      this.railMovement.update(
        dt,
        viewportOffset ?? { x: 0, y: 0 },
        RAIL_SPEED * CORRIDOR_RAIL_SPEED_MULTIPLIER,
      );
    }

    // Update all obstacles
    for (const obstacle of this.obstacles) {
      obstacle.update(dt);
    }

    // Decrement hit cooldown
    if (this.hitCooldownTimer > 0) {
      this.hitCooldownTimer -= dt;
    }

    // Check obstacle collisions (only if not in cooldown)
    if (this.hitCooldownTimer <= 0) {
      for (const obstacle of this.obstacles) {
        if (obstacle.checkCollision(this.playerSphere)) {
          eventBus.emit('playerHit', {
            damage: CORRIDOR_OBSTACLE_DAMAGE,
            source: 'corridorObstacle',
          });
          this.hitCooldownTimer = CORRIDOR_HIT_COOLDOWN;
          Logger.debug('CorridorPhase', 'Player hit by corridor obstacle');
          break; // Only one hit per frame
        }
      }
    }

    // Check phase completion
    this.checkCompletion();
  }

  exit(): void {
    Logger.info('CorridorPhase', 'Exiting data corridor phase');

    // Remove and dispose corridor wall geometry
    for (const segment of this.wallSegments) {
      this.scene.remove(segment);
    }
    for (const geo of this.wallGeometries) {
      geo.dispose();
    }
    this.wallSegments = [];
    this.wallGeometries = [];

    if (this.wallMaterial) {
      this.wallMaterial.dispose();
      this.wallMaterial = null;
    }
    if (this.floorMaterial) {
      this.floorMaterial.dispose();
      this.floorMaterial = null;
    }

    // Remove and dispose all obstacles
    for (const obstacle of this.obstacles) {
      this.scene.remove(obstacle.getObject3D());
      obstacle.dispose();
    }
    this.obstacles = [];

    // Null out references
    this.railMovement = null;

    Logger.info('CorridorPhase', 'Corridor phase exited, resources disposed');
  }

  /** Returns whether the phase has completed */
  isComplete(): boolean {
    return this.completed;
  }

  /**
   * Computes the corridor half-width at a given z-position.
   * Linearly interpolates from full width at entrance (z=0) to narrow width at exit.
   */
  private getCorridorHalfWidth(z: number): number {
    // z goes from 0 to -CORRIDOR_LENGTH, so use absolute value for interpolation
    const t = Math.abs(z) / CORRIDOR_LENGTH;
    const width = CORRIDOR_WALL_WIDTH + t * (CORRIDOR_WALL_MIN_WIDTH - CORRIDOR_WALL_WIDTH);
    return width / 2;
  }

  /**
   * Computes the full corridor width at a given z-position.
   */
  private getCorridorWidth(z: number): number {
    return this.getCorridorHalfWidth(z) * 2;
  }

  private createCorridorWalls(): void {
    this.wallMaterial = this.vectorMaterials.create('corridorWall');
    this.floorMaterial = this.vectorMaterials.create('corridorFloor');

    const segmentLength = CORRIDOR_LENGTH / WALL_SEGMENTS;

    for (let i = 0; i < WALL_SEGMENTS; i++) {
      const zMid = -(i * segmentLength + segmentLength / 2);
      const halfWidth = this.getCorridorHalfWidth(zMid);

      // Create wall segment geometry
      const basePlane = new THREE.PlaneGeometry(segmentLength, CORRIDOR_HEIGHT);
      const edgesGeo = new THREE.EdgesGeometry(basePlane);
      basePlane.dispose();
      this.wallGeometries.push(edgesGeo);

      // Left wall
      const leftWall = new THREE.LineSegments(edgesGeo, this.wallMaterial);
      leftWall.layers.enable(BLOOM_LAYER);
      leftWall.position.set(-halfWidth, CORRIDOR_HEIGHT / 2, zMid);
      leftWall.rotation.y = Math.PI / 2;
      this.scene.add(leftWall);
      this.wallSegments.push(leftWall);

      // Right wall (separate geometry instance — different LineSegments object)
      const rightBasePlane = new THREE.PlaneGeometry(segmentLength, CORRIDOR_HEIGHT);
      const rightEdgesGeo = new THREE.EdgesGeometry(rightBasePlane);
      rightBasePlane.dispose();
      this.wallGeometries.push(rightEdgesGeo);
      const rightWall = new THREE.LineSegments(rightEdgesGeo, this.wallMaterial);
      rightWall.layers.enable(BLOOM_LAYER);
      rightWall.position.set(halfWidth, CORRIDOR_HEIGHT / 2, zMid);
      rightWall.rotation.y = -Math.PI / 2;
      this.scene.add(rightWall);
      this.wallSegments.push(rightWall);

      // Floor segment
      const floorBasePlane = new THREE.PlaneGeometry(halfWidth * 2, segmentLength);
      const floorEdgesGeo = new THREE.EdgesGeometry(floorBasePlane);
      floorBasePlane.dispose();
      this.wallGeometries.push(floorEdgesGeo);

      const floor = new THREE.LineSegments(floorEdgesGeo, this.floorMaterial);
      floor.layers.enable(BLOOM_LAYER);
      floor.position.set(0, 0, zMid);
      floor.rotation.x = -Math.PI / 2;
      this.scene.add(floor);
      this.wallSegments.push(floor);

      // Ceiling segment
      const ceilBasePlane = new THREE.PlaneGeometry(halfWidth * 2, segmentLength);
      const ceilEdgesGeo = new THREE.EdgesGeometry(ceilBasePlane);
      ceilBasePlane.dispose();
      this.wallGeometries.push(ceilEdgesGeo);

      const ceiling = new THREE.LineSegments(ceilEdgesGeo, this.floorMaterial);
      ceiling.layers.enable(BLOOM_LAYER);
      ceiling.position.set(0, CORRIDOR_HEIGHT, zMid);
      ceiling.rotation.x = Math.PI / 2;
      this.scene.add(ceiling);
      this.wallSegments.push(ceiling);
    }
  }

  private createObstacles(): void {
    for (const config of CORRIDOR_OBSTACLES) {
      const corridorWidth = this.getCorridorWidth(config.position[2]);
      let obstacle: Obstacle;

      switch (config.type) {
        case 'firewall':
          obstacle = new Firewall(
            config.position,
            corridorWidth,
            config.phaseOffset ?? 0,
            this.vectorMaterials,
          );
          break;
        case 'networkCable':
          obstacle = new NetworkCable(
            config.position,
            corridorWidth,
            this.vectorMaterials,
          );
          break;
        case 'dataStream':
          obstacle = new DataStream(
            config.position,
            corridorWidth,
            config.direction ?? 'right',
            this.vectorMaterials,
          );
          break;
      }

      this.scene.add(obstacle.getObject3D());
      this.obstacles.push(obstacle);
    }

    Logger.info('CorridorPhase', 'Obstacles created', {
      total: this.obstacles.length,
    });
  }

  private checkCompletion(): void {
    if (this.railMovement && this.railMovement.getRailProgress() >= RAIL_COMPLETION_THRESHOLD) {
      this.completed = true;
      Logger.info('CorridorPhase', 'Phase complete: corridor end reached');
    }
  }
}
