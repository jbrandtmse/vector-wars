/**
 * CyberspaceFragmentation — Large-scale line-segment fragmentation effect
 * for the ending sequence.
 *
 * Creates the visual of cyberspace breaking apart and scattering into the void
 * as the player jacks out after defeating the Core Intelligence.
 *
 * Uses a SINGLE THREE.LineSegments with pre-allocated BufferGeometry
 * for zero per-frame allocations. Same pattern as VectorShardExplosion.
 *
 * Three temporal phases:
 * - Phase 1 (0-3s): Initial fracture — grid-level shards scatter
 * - Phase 2 (3-8s): Full collapse — environment-wide shard waves
 * - Phase 3 (8-12s): Void — existing shards decay, no new spawns
 *
 * Created by: Story 5-12
 */

import * as THREE from 'three';
import {
  BLOOM_LAYER,
  GRID_Y_POSITION,
  STARFIELD_SPREAD,
  FRAG_TOTAL_SHARDS,
  FRAG_SHARD_MIN_SPEED,
  FRAG_SHARD_MAX_SPEED,
  FRAG_SHARD_MIN_LIFETIME,
  FRAG_SHARD_MAX_LIFETIME,
  FRAG_SHARD_LENGTH,
  FRAG_PHASE1_DURATION,
  FRAG_PHASE2_DURATION,
  FRAG_TOTAL_DURATION,
} from '../../config/constants.ts';
import type { VectorMaterials } from '../../rendering/VectorMaterials.ts';
import { Logger } from '../../core/Logger.ts';

interface FragShardData {
  directionX: number;
  directionY: number;
  directionZ: number;
  speed: number;
  lifetime: number;
  age: number;
  originX: number;
  originY: number;
  originZ: number;
  rotSpeed: number;
  spawned: boolean;
}

/** Number of shards spawned in Phase 1 (initial fracture). */
const PHASE1_SHARD_COUNT = Math.floor(FRAG_TOTAL_SHARDS * 0.3);

export class CyberspaceFragmentation {
  private mesh: THREE.LineSegments;
  private geometry: THREE.BufferGeometry;
  private positions: Float32Array;
  private shards: FragShardData[];
  private active = false;
  private elapsed = 0;
  private spawnedCount = 0;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene, vectorMaterials: VectorMaterials) {
    this.scene = scene;

    // Pre-allocate position buffer: each shard = 1 line segment = 2 vertices = 6 floats
    this.positions = new Float32Array(FRAG_TOTAL_SHARDS * 6);
    this.geometry = new THREE.BufferGeometry();
    const posAttr = new THREE.BufferAttribute(this.positions, 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    this.geometry.setAttribute('position', posAttr);
    this.geometry.setDrawRange(0, 0);

    const material = vectorMaterials.create('cyberspace-fragmentation', 0.1);

    this.mesh = new THREE.LineSegments(this.geometry, material);
    this.mesh.layers.enable(BLOOM_LAYER);
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
    scene.add(this.mesh);

    // Pre-allocate shard data array
    this.shards = [];
    for (let i = 0; i < FRAG_TOTAL_SHARDS; i++) {
      this.shards.push({
        directionX: 0, directionY: 0, directionZ: 0,
        speed: 0, lifetime: 0, age: 0,
        originX: 0, originY: 0, originZ: 0,
        rotSpeed: 0,
        spawned: false,
      });
    }

    Logger.info('CyberspaceFragmentation', 'Effect created', {
      totalShards: FRAG_TOTAL_SHARDS,
    });
  }

  get isActive(): boolean {
    return this.active;
  }

  start(): void {
    this.active = true;
    this.elapsed = 0;
    this.spawnedCount = 0;
    this.mesh.visible = true;

    // Reset all shards
    for (let i = 0; i < FRAG_TOTAL_SHARDS; i++) {
      this.shards[i].spawned = false;
      this.shards[i].age = 0;
    }

    // Zero out positions
    this.positions.fill(0);

    Logger.info('CyberspaceFragmentation', 'Fragmentation started');
  }

  update(dt: number): void {
    if (!this.active) return;

    this.elapsed += dt;

    // Phase-based shard spawning
    this.spawnShardsForCurrentPhase();

    // Update all spawned shards
    let allDead = true;
    for (let i = 0; i < FRAG_TOTAL_SHARDS; i++) {
      const shard = this.shards[i];
      if (!shard.spawned) continue;

      shard.age += dt;

      if (shard.age >= shard.lifetime) {
        // Dead shard — collapse to zero-length line
        const idx = i * 6;
        this.positions[idx] = 0;
        this.positions[idx + 1] = 0;
        this.positions[idx + 2] = 0;
        this.positions[idx + 3] = 0;
        this.positions[idx + 4] = 0;
        this.positions[idx + 5] = 0;
        continue;
      }

      allDead = false;
      const t = shard.age;
      const progress = shard.age / shard.lifetime;

      // Current center position: origin + direction * speed * time
      const cx = shard.originX + shard.directionX * shard.speed * t;
      const cy = shard.originY + shard.directionY * shard.speed * t;
      const cz = shard.originZ + shard.directionZ * shard.speed * t;

      // Shard line endpoints with tumble rotation
      const halfLen = FRAG_SHARD_LENGTH * 0.5 * (1.0 - progress * 0.5);
      const rot = shard.rotSpeed * t;
      const perpX = Math.cos(rot) * halfLen;
      const perpY = Math.sin(rot) * halfLen;

      const idx = i * 6;
      this.positions[idx]     = cx - perpX;
      this.positions[idx + 1] = cy - perpY;
      this.positions[idx + 2] = cz;
      this.positions[idx + 3] = cx + perpX;
      this.positions[idx + 4] = cy + perpY;
      this.positions[idx + 5] = cz;
    }

    (this.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;

    // Check if effect is complete
    if (this.elapsed >= FRAG_TOTAL_DURATION && allDead) {
      this.active = false;
      this.mesh.visible = false;
      this.geometry.setDrawRange(0, 0);
      Logger.info('CyberspaceFragmentation', 'Fragmentation complete');
    }
  }

  dispose(): void {
    this.scene.remove(this.mesh);
    this.geometry.dispose();
    this.active = false;
    Logger.info('CyberspaceFragmentation', 'Fragmentation disposed');
  }

  private spawnShardsForCurrentPhase(): void {
    if (this.elapsed < FRAG_PHASE1_DURATION) {
      // Phase 1: spawn grid-level shards progressively
      const phase1Progress = this.elapsed / FRAG_PHASE1_DURATION;
      const targetCount = Math.floor(phase1Progress * PHASE1_SHARD_COUNT);
      while (this.spawnedCount < targetCount && this.spawnedCount < PHASE1_SHARD_COUNT) {
        this.spawnShard(this.spawnedCount, 'grid');
        this.spawnedCount++;
      }
    } else if (this.elapsed < FRAG_PHASE1_DURATION + FRAG_PHASE2_DURATION) {
      // Ensure all Phase 1 shards are spawned
      while (this.spawnedCount < PHASE1_SHARD_COUNT) {
        this.spawnShard(this.spawnedCount, 'grid');
        this.spawnedCount++;
      }

      // Phase 2: spawn environment-wide shards progressively
      const phase2Elapsed = this.elapsed - FRAG_PHASE1_DURATION;
      const phase2Progress = phase2Elapsed / FRAG_PHASE2_DURATION;
      const targetCount = PHASE1_SHARD_COUNT + Math.floor(phase2Progress * (FRAG_TOTAL_SHARDS - PHASE1_SHARD_COUNT));
      while (this.spawnedCount < targetCount && this.spawnedCount < FRAG_TOTAL_SHARDS) {
        this.spawnShard(this.spawnedCount, 'environment');
        this.spawnedCount++;
      }
    } else {
      // Phase 3: ensure all remaining shards are spawned (decay only)
      while (this.spawnedCount < FRAG_TOTAL_SHARDS) {
        this.spawnShard(this.spawnedCount, 'environment');
        this.spawnedCount++;
      }
    }

    // Update draw range to cover all spawned shards
    this.geometry.setDrawRange(0, this.spawnedCount * 2);
  }

  private spawnShard(index: number, origin: 'grid' | 'environment'): void {
    const shard = this.shards[index];
    shard.spawned = true;
    shard.age = 0;

    // Random outward direction (spherical uniform distribution)
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    shard.directionX = Math.sin(phi) * Math.cos(theta);
    shard.directionY = Math.sin(phi) * Math.sin(theta);
    shard.directionZ = Math.cos(phi);

    shard.speed = FRAG_SHARD_MIN_SPEED + Math.random() * (FRAG_SHARD_MAX_SPEED - FRAG_SHARD_MIN_SPEED);
    shard.lifetime = FRAG_SHARD_MIN_LIFETIME + Math.random() * (FRAG_SHARD_MAX_LIFETIME - FRAG_SHARD_MIN_LIFETIME);
    shard.rotSpeed = (Math.random() - 0.5) * 8;

    if (origin === 'grid') {
      // Phase 1: shards originate near the grid plane
      shard.originX = (Math.random() - 0.5) * 100;
      shard.originY = GRID_Y_POSITION + (Math.random() - 0.5) * 2;
      shard.originZ = (Math.random() - 0.5) * 100;
    } else {
      // Phase 2: shards originate from full environment volume
      const halfSpread = STARFIELD_SPREAD / 2;
      shard.originX = (Math.random() - 0.5) * halfSpread;
      shard.originY = GRID_Y_POSITION + Math.random() * (halfSpread * 0.5);
      shard.originZ = (Math.random() - 0.5) * halfSpread;
    }
  }
}
