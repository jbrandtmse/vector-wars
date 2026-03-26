import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';

// Mock Logger to avoid side effects
vi.mock('../core/Logger.ts', () => ({
  Logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('VectorShardExplosion', () => {
  it('should export VectorShardExplosion as a class', async () => {
    const mod = await import('../entities/effects/VectorShardExplosion.ts');
    expect(mod.VectorShardExplosion).toBeDefined();
    expect(typeof mod.VectorShardExplosion).toBe('function');
  });

  it('should have spawn method on prototype', async () => {
    const mod = await import('../entities/effects/VectorShardExplosion.ts');
    expect(typeof mod.VectorShardExplosion.prototype.spawn).toBe('function');
  });

  it('should have update method on prototype', async () => {
    const mod = await import('../entities/effects/VectorShardExplosion.ts');
    expect(typeof mod.VectorShardExplosion.prototype.update).toBe('function');
  });

  it('should have isActive getter', async () => {
    const mod = await import('../entities/effects/VectorShardExplosion.ts');
    // Check that isActive is defined as a property (getter) on the prototype
    const descriptor = Object.getOwnPropertyDescriptor(
      mod.VectorShardExplosion.prototype,
      'isActive',
    );
    expect(descriptor).toBeDefined();
    expect(typeof descriptor!.get).toBe('function');
  });
});

describe('VectorShardExplosion lifecycle', () => {
  it('should follow spawn -> active -> complete lifecycle', async () => {
    const { VectorShardExplosion } = await import('../entities/effects/VectorShardExplosion.ts');

    // Create a minimal mock scene and vectorMaterials
    const scene = new THREE.Scene();
    const mockMaterial = new THREE.LineBasicMaterial();
    const mockVectorMaterials = {
      create: vi.fn().mockReturnValue(mockMaterial),
    };

    const explosion = new VectorShardExplosion(scene, mockVectorMaterials as never);

    // Initially not active
    expect(explosion.isActive).toBe(false);

    // After spawn, should be active
    explosion.spawn(0, 0, 0);
    expect(explosion.isActive).toBe(true);

    // After enough time passes (beyond max lifetime), should complete
    // SHARD_MAX_LIFETIME = 0.8, so updating with 1.0s should complete all shards
    explosion.update(1.0);
    expect(explosion.isActive).toBe(false);
  });

  it('should remain active while shards are still alive', async () => {
    const { VectorShardExplosion } = await import('../entities/effects/VectorShardExplosion.ts');

    const scene = new THREE.Scene();
    const mockMaterial = new THREE.LineBasicMaterial();
    const mockVectorMaterials = {
      create: vi.fn().mockReturnValue(mockMaterial),
    };

    const explosion = new VectorShardExplosion(scene, mockVectorMaterials as never);
    explosion.spawn(5, 10, 15);

    // Small update -- shards should still be alive (SHARD_MIN_LIFETIME = 0.4)
    explosion.update(0.1);
    expect(explosion.isActive).toBe(true);
  });
});
