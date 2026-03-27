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

describe('DataLanceSystem.getPoolStats()', () => {
  it('should have getPoolStats method on prototype', async () => {
    const { DataLanceSystem } = await import('../systems/DataLanceSystem.ts');
    expect(typeof DataLanceSystem.prototype.getPoolStats).toBe('function');
  });

  it('should return { active: number, total: number } shape', async () => {
    const { DataLanceSystem } = await import('../systems/DataLanceSystem.ts');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera();
    const mockInput = { isActive: vi.fn().mockReturnValue(false) } as never;
    const mockMaterials = { createFat: vi.fn().mockReturnValue(new THREE.LineBasicMaterial()) } as never;
    const mockCockpit = { recoilArms: vi.fn() } as never;
    const system = new DataLanceSystem(scene, camera, mockInput, mockMaterials, mockCockpit);
    const stats = system.getPoolStats();
    expect(stats).toHaveProperty('active');
    expect(stats).toHaveProperty('total');
    expect(typeof stats.active).toBe('number');
    expect(typeof stats.total).toBe('number');
    expect(stats.active).toBe(0);
    expect(stats.total).toBeGreaterThan(0);
  });
});

describe('EnemyProjectileSystem.getPoolStats()', () => {
  it('should have getPoolStats method on prototype', async () => {
    const { EnemyProjectileSystem } = await import('../systems/EnemyProjectileSystem.ts');
    expect(typeof EnemyProjectileSystem.prototype.getPoolStats).toBe('function');
  });

  it('should return { active: number, total: number } shape', async () => {
    const { EnemyProjectileSystem } = await import('../systems/EnemyProjectileSystem.ts');
    const { LineMaterial } = await import('three/addons/lines/LineMaterial.js');
    const scene = new THREE.Scene();
    const mockMaterials = { createFat: vi.fn().mockReturnValue(new LineMaterial({ linewidth: 2 })) } as never;
    const playerCollider = new THREE.Sphere(new THREE.Vector3(), 1.0);
    const system = new EnemyProjectileSystem(scene, mockMaterials, playerCollider);
    const stats = system.getPoolStats();
    expect(stats).toHaveProperty('active');
    expect(stats).toHaveProperty('total');
    expect(typeof stats.active).toBe('number');
    expect(typeof stats.total).toBe('number');
    expect(stats.active).toBe(0);
    expect(stats.total).toBeGreaterThan(0);
  });
});

describe('EffectsManager.getPoolStats()', () => {
  it('should have getPoolStats method on prototype', async () => {
    const { EffectsManager } = await import('../systems/EffectsManager.ts');
    expect(typeof EffectsManager.prototype.getPoolStats).toBe('function');
  });

  it('should return { active: number, total: number } shape', async () => {
    const { EffectsManager } = await import('../systems/EffectsManager.ts');
    const scene = new THREE.Scene();
    const mockMaterials = { create: vi.fn().mockReturnValue(new THREE.LineBasicMaterial()) } as never;
    const manager = new EffectsManager(scene, mockMaterials);
    const stats = manager.getPoolStats();
    expect(stats).toHaveProperty('active');
    expect(stats).toHaveProperty('total');
    expect(typeof stats.active).toBe('number');
    expect(typeof stats.total).toBe('number');
    expect(stats.active).toBe(0);
    expect(stats.total).toBeGreaterThan(0);
  });
});
