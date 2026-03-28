/**
 * VectorShardExplosion — Batched line-segment explosion effect.
 *
 * Creates a burst of vector line shards at a given world position.
 * Uses a SINGLE THREE.LineSegments with pre-allocated BufferGeometry
 * for zero per-frame allocations. One draw call per explosion.
 *
 * Created by: Story 2-4
 */

import * as THREE from 'three';
import {
  BLOOM_LAYER,
  SHARD_COUNT,
  SHARD_MIN_SPEED,
  SHARD_MAX_SPEED,
  SHARD_MIN_LIFETIME,
  SHARD_MAX_LIFETIME,
  SHARD_LENGTH,
} from '../../config/constants.ts';
import type { VectorMaterials } from '../../rendering/VectorMaterials.ts';

interface ShardData {
  // Per-shard state (pre-allocated, reused)
  directionX: number;
  directionY: number;
  directionZ: number;
  speed: number;
  lifetime: number;
  age: number;
  originX: number;
  originY: number;
  originZ: number;
  // Random rotation speed for tumble
  rotSpeed: number;
}

export class VectorShardExplosion {
  private mesh: THREE.LineSegments;
  private geometry: THREE.BufferGeometry;
  private positions: Float32Array;
  private shards: ShardData[];
  private active = false;
  private shardCount: number;

  private static nextId = 0;

  constructor(scene: THREE.Scene, vectorMaterials: VectorMaterials) {
    this.shardCount = SHARD_COUNT;

    // Pre-allocate position buffer: each shard = 1 line segment = 2 vertices = 6 floats
    this.positions = new Float32Array(this.shardCount * 6);
    this.geometry = new THREE.BufferGeometry();
    const posAttr = new THREE.BufferAttribute(this.positions, 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    this.geometry.setAttribute('position', posAttr);
    this.geometry.setDrawRange(0, 0); // Nothing drawn initially

    // Use shared material from VectorMaterials for palette compliance
    const material = vectorMaterials.create(
      `shard-explosion-${VectorShardExplosion.nextId++}`,
      0.15, // slightly brighter than base for "flash" feel
    );

    this.mesh = new THREE.LineSegments(this.geometry, material);
    this.mesh.layers.enable(BLOOM_LAYER);
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
    scene.add(this.mesh);

    // Pre-allocate shard data array
    this.shards = [];
    for (let i = 0; i < this.shardCount; i++) {
      this.shards.push({
        directionX: 0, directionY: 0, directionZ: 0,
        speed: 0, lifetime: 0, age: 0,
        originX: 0, originY: 0, originZ: 0,
        rotSpeed: 0,
      });
    }
  }

  get isActive(): boolean {
    return this.active;
  }

  spawn(x: number, y: number, z: number): void {
    this.active = true;
    this.mesh.visible = true;

    for (let i = 0; i < this.shardCount; i++) {
      const shard = this.shards[i];

      // Random outward direction (normalized, spherical uniform distribution)
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      shard.directionX = Math.sin(phi) * Math.cos(theta);
      shard.directionY = Math.sin(phi) * Math.sin(theta);
      shard.directionZ = Math.cos(phi);

      shard.speed = SHARD_MIN_SPEED + Math.random() * (SHARD_MAX_SPEED - SHARD_MIN_SPEED);
      shard.lifetime = SHARD_MIN_LIFETIME + Math.random() * (SHARD_MAX_LIFETIME - SHARD_MIN_LIFETIME);
      shard.age = 0;
      shard.originX = x;
      shard.originY = y;
      shard.originZ = z;
      shard.rotSpeed = (Math.random() - 0.5) * 10; // tumble speed
    }

    this.geometry.setDrawRange(0, this.shardCount * 2);
  }

  /**
   * Forces the explosion to deactivate immediately.
   * Used by EffectsManager.reset() to clear active effects.
   * (Story 6-8)
   */
  forceDeactivate(): void {
    this.active = false;
    this.mesh.visible = false;
    this.geometry.setDrawRange(0, 0);
  }

  update(dt: number): void {
    if (!this.active) return;

    let allDead = true;

    for (let i = 0; i < this.shardCount; i++) {
      const shard = this.shards[i];
      shard.age += dt;

      if (shard.age >= shard.lifetime) {
        // Dead shard -- collapse to zero-length line
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
      const t = shard.age; // time since spawn
      const progress = shard.age / shard.lifetime; // 0-1 normalized

      // Current center position: origin + direction * speed * time
      const cx = shard.originX + shard.directionX * shard.speed * t;
      const cy = shard.originY + shard.directionY * shard.speed * t;
      const cz = shard.originZ + shard.directionZ * shard.speed * t;

      // Shard line endpoints: center +/- half-length along a rotating offset
      // Rotate the shard line around its direction as it tumbles
      const halfLen = SHARD_LENGTH * 0.5 * (1.0 - progress * 0.5); // shrink slightly as it fades
      const rot = shard.rotSpeed * t;
      // Use a perpendicular vector for the shard line orientation
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

    if (allDead) {
      this.active = false;
      this.mesh.visible = false;
      this.geometry.setDrawRange(0, 0);
    }
  }
}
