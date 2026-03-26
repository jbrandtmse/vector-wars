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

describe('EffectsManager', () => {
  it('should export EffectsManager as a class', async () => {
    const mod = await import('../systems/EffectsManager.ts');
    expect(mod.EffectsManager).toBeDefined();
    expect(typeof mod.EffectsManager).toBe('function');
  });

  it('should have update method on prototype', async () => {
    const mod = await import('../systems/EffectsManager.ts');
    expect(typeof mod.EffectsManager.prototype.update).toBe('function');
  });

  it('should construct with scene and vectorMaterials', async () => {
    const { EffectsManager } = await import('../systems/EffectsManager.ts');

    const scene = new THREE.Scene();
    let callCount = 0;
    const mockMaterial = new THREE.LineBasicMaterial();
    const mockVectorMaterials = {
      create: vi.fn().mockImplementation(() => {
        callCount++;
        return mockMaterial;
      }),
    };

    expect(() => new EffectsManager(scene, mockVectorMaterials as never)).not.toThrow();
    // Should have pre-created MAX_ACTIVE_EXPLOSIONS instances (12 materials created)
    expect(mockVectorMaterials.create).toHaveBeenCalled();
  });

  it('should subscribe to enemyDestroyed event', async () => {
    const { EffectsManager } = await import('../systems/EffectsManager.ts');
    const { eventBus } = await import('../core/GameEvents.ts');

    const scene = new THREE.Scene();
    const mockMaterial = new THREE.LineBasicMaterial();
    const mockVectorMaterials = {
      create: vi.fn().mockReturnValue(mockMaterial),
    };

    new EffectsManager(scene, mockVectorMaterials as never);

    // Emit an enemyDestroyed event -- should not throw
    expect(() => {
      eventBus.emit('enemyDestroyed', {
        enemy: {} as never,
        position: { x: 1, y: 2, z: 3 },
      });
    }).not.toThrow();
  });
});
