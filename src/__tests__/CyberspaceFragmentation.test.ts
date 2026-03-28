/**
 * CyberspaceFragmentation tests -- validates the ending fragmentation effect
 * that scatters cyberspace geometry into the void during the ending sequence.
 *
 * Story 5-12: Cyberspace Fragmentation Ending
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { CyberspaceFragmentation } from '../entities/effects/CyberspaceFragmentation.ts';
import { VectorMaterials } from '../rendering/VectorMaterials.ts';
import { setActivePalette } from '../rendering/ColorPalette.ts';
import {
  BLOOM_LAYER,
  FRAG_TOTAL_SHARDS,
  FRAG_TOTAL_DURATION,
  FRAG_SHARD_MIN_SPEED,
  FRAG_SHARD_MAX_SPEED,
  FRAG_SHARD_MIN_LIFETIME,
  FRAG_SHARD_MAX_LIFETIME,
  FRAG_SHARD_LENGTH,
  FRAG_PHASE1_DURATION,
  FRAG_PHASE2_DURATION,
} from '../config/constants.ts';

vi.mock('../core/Logger.ts', () => ({
  Logger: {
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

describe('CyberspaceFragmentation', () => {
  let scene: THREE.Scene;
  let vectorMats: VectorMaterials;
  let fragmentation: CyberspaceFragmentation;

  beforeEach(() => {
    setActivePalette('red');
    scene = new THREE.Scene();
    vectorMats = new VectorMaterials();
    fragmentation = new CyberspaceFragmentation(scene, vectorMats);
  });

  describe('constructor', () => {
    it('creates LineSegments mesh added to scene', () => {
      const lineSegments = scene.children.filter(
        (child) => child instanceof THREE.LineSegments
      );
      expect(lineSegments.length).toBe(1);
    });

    it('mesh has BLOOM_LAYER enabled', () => {
      const lineSegments = scene.children.filter(
        (child) => child instanceof THREE.LineSegments
      );
      const bloomTest = new THREE.Layers();
      bloomTest.set(BLOOM_LAYER);
      expect(lineSegments[0].layers.test(bloomTest)).toBe(true);
    });

    it('mesh is initially not visible', () => {
      const lineSegments = scene.children.filter(
        (child) => child instanceof THREE.LineSegments
      );
      expect(lineSegments[0].visible).toBe(false);
    });

    it('pre-allocates position buffer for all shards', () => {
      const lineSegments = scene.children.filter(
        (child) => child instanceof THREE.LineSegments
      ) as THREE.LineSegments[];
      const posAttr = lineSegments[0].geometry.getAttribute('position');
      expect(posAttr.count).toBe(FRAG_TOTAL_SHARDS * 2); // 2 vertices per shard
    });
  });

  describe('start()', () => {
    it('activates the effect', () => {
      expect(fragmentation.isActive).toBe(false);
      fragmentation.start();
      expect(fragmentation.isActive).toBe(true);
    });

    it('makes mesh visible', () => {
      fragmentation.start();
      const lineSegments = scene.children.filter(
        (child) => child instanceof THREE.LineSegments
      );
      expect(lineSegments[0].visible).toBe(true);
    });
  });

  describe('update()', () => {
    it('moves shards outward over time', () => {
      fragmentation.start();

      // Advance a small amount to spawn some shards
      fragmentation.update(1.0);

      const lineSegments = scene.children.filter(
        (child) => child instanceof THREE.LineSegments
      ) as THREE.LineSegments[];
      const posAttr = lineSegments[0].geometry.getAttribute('position') as THREE.BufferAttribute;
      const positions = posAttr.array as Float32Array;

      // Some positions should be non-zero (shards have spawned and moved)
      let hasNonZero = false;
      for (let i = 0; i < positions.length; i++) {
        if (positions[i] !== 0) {
          hasNonZero = true;
          break;
        }
      }
      expect(hasNonZero).toBe(true);
    });

    it('does nothing when not active', () => {
      // Don't call start()
      fragmentation.update(1.0);
      expect(fragmentation.isActive).toBe(false);
    });

    it('spawns Phase 1 shards from grid-level positions in first 3 seconds', () => {
      fragmentation.start();

      // Advance 2 seconds (within Phase 1)
      fragmentation.update(2.0);

      const lineSegments = scene.children.filter(
        (child) => child instanceof THREE.LineSegments
      ) as THREE.LineSegments[];
      const geo = lineSegments[0].geometry;
      const drawRange = geo.drawRange;

      // Draw range should cover some shards but not all
      expect(drawRange.count).toBeGreaterThan(0);
      expect(drawRange.count).toBeLessThan(FRAG_TOTAL_SHARDS * 2);
    });

    it('spawns more shards during Phase 2 (3-8s)', () => {
      fragmentation.start();

      // Complete Phase 1
      fragmentation.update(FRAG_PHASE1_DURATION);

      const lineSegments = scene.children.filter(
        (child) => child instanceof THREE.LineSegments
      ) as THREE.LineSegments[];
      const geo = lineSegments[0].geometry;
      const phase1DrawCount = geo.drawRange.count;

      // Advance into Phase 2
      fragmentation.update(3.0);

      const phase2DrawCount = geo.drawRange.count;
      expect(phase2DrawCount).toBeGreaterThan(phase1DrawCount);
    });
  });

  describe('completion', () => {
    it('self-completes after FRAG_TOTAL_DURATION when all shards expire', () => {
      fragmentation.start();

      // Advance past total duration
      fragmentation.update(FRAG_TOTAL_DURATION + 1.0);

      // All shards should have expired by now (max lifetime is 10s, total duration is 12s)
      // Advance a bit more to ensure all shards with max lifetime are dead
      fragmentation.update(FRAG_SHARD_MAX_LIFETIME);

      expect(fragmentation.isActive).toBe(false);
    });

    it('isActive returns false before start', () => {
      expect(fragmentation.isActive).toBe(false);
    });
  });

  describe('dispose()', () => {
    it('removes mesh from scene', () => {
      const childrenBefore = scene.children.filter(
        (child) => child instanceof THREE.LineSegments
      );
      expect(childrenBefore.length).toBe(1);

      fragmentation.dispose();

      const childrenAfter = scene.children.filter(
        (child) => child instanceof THREE.LineSegments
      );
      expect(childrenAfter.length).toBe(0);
    });

    it('disposes geometry', () => {
      const lineSegments = scene.children.filter(
        (child) => child instanceof THREE.LineSegments
      ) as THREE.LineSegments[];
      const geoSpy = vi.spyOn(lineSegments[0].geometry, 'dispose');

      fragmentation.dispose();

      expect(geoSpy).toHaveBeenCalledOnce();
    });

    it('sets isActive to false', () => {
      fragmentation.start();
      expect(fragmentation.isActive).toBe(true);

      fragmentation.dispose();
      expect(fragmentation.isActive).toBe(false);
    });
  });
});

describe('Fragmentation constants', () => {
  it('exports all fragmentation constants with correct values', () => {
    expect(FRAG_TOTAL_SHARDS).toBe(200);
    expect(FRAG_SHARD_MIN_SPEED).toBe(8);
    expect(FRAG_SHARD_MAX_SPEED).toBe(30);
    expect(FRAG_SHARD_MIN_LIFETIME).toBe(3.0);
    expect(FRAG_SHARD_MAX_LIFETIME).toBe(10.0);
    expect(FRAG_SHARD_LENGTH).toBe(1.5);
    expect(FRAG_PHASE1_DURATION).toBe(3.0);
    expect(FRAG_PHASE2_DURATION).toBe(5.0);
    expect(FRAG_TOTAL_DURATION).toBe(12.0);
  });
});
