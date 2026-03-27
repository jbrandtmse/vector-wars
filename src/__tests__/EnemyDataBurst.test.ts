import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';

// Mock Logger to avoid console output
vi.mock('../core/Logger.ts', () => ({
  Logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('EnemyDataBurst', () => {
  it('should be exported as a class from entities/projectiles/EnemyDataBurst', async () => {
    const mod = await import('../entities/projectiles/EnemyDataBurst.ts');
    expect(mod.EnemyDataBurst).toBeDefined();
    expect(typeof mod.EnemyDataBurst).toBe('function');
  });

  it('should have activate method on prototype', async () => {
    const mod = await import('../entities/projectiles/EnemyDataBurst.ts');
    expect(typeof mod.EnemyDataBurst.prototype.activate).toBe('function');
  });

  it('should have deactivate method on prototype', async () => {
    const mod = await import('../entities/projectiles/EnemyDataBurst.ts');
    expect(typeof mod.EnemyDataBurst.prototype.deactivate).toBe('function');
  });

  it('should have update method on prototype', async () => {
    const mod = await import('../entities/projectiles/EnemyDataBurst.ts');
    expect(typeof mod.EnemyDataBurst.prototype.update).toBe('function');
  });

  it('should construct with required properties', async () => {
    const { EnemyDataBurst } = await import('../entities/projectiles/EnemyDataBurst.ts');
    const material = new LineMaterial({ color: 0x00ff00, linewidth: 2 });
    const burst = new EnemyDataBurst(material);

    expect(burst.active).toBe(false);
    expect(burst.speed).toBe(0);
    expect(burst.damage).toBe(0);
    expect(burst.distance).toBe(0);
    expect(burst.direction).toBeInstanceOf(THREE.Vector3);
    expect(burst.mesh).toBeInstanceOf(LineSegments2);
    expect(burst.collider).toBeInstanceOf(THREE.Sphere);
  });

  it('should activate with correct state', async () => {
    const { EnemyDataBurst } = await import('../entities/projectiles/EnemyDataBurst.ts');
    const material = new LineMaterial({ color: 0x00ff00, linewidth: 2 });
    const burst = new EnemyDataBurst(material);

    const origin = new THREE.Vector3(1, 2, 3);
    const dir = new THREE.Vector3(0, 0, -1);
    burst.activate(origin, dir, 15, 10);

    expect(burst.active).toBe(true);
    expect(burst.mesh.visible).toBe(true);
    expect(burst.speed).toBe(15);
    expect(burst.damage).toBe(10);
    expect(burst.distance).toBe(0);
  });

  it('should deactivate correctly', async () => {
    const { EnemyDataBurst } = await import('../entities/projectiles/EnemyDataBurst.ts');
    const material = new LineMaterial({ color: 0x00ff00, linewidth: 2 });
    const burst = new EnemyDataBurst(material);

    burst.activate(new THREE.Vector3(), new THREE.Vector3(0, 0, -1), 15, 10);
    burst.deactivate();

    expect(burst.active).toBe(false);
    expect(burst.mesh.visible).toBe(false);
    expect(burst.distance).toBe(0);
  });

  it('should move along direction on update', async () => {
    const { EnemyDataBurst } = await import('../entities/projectiles/EnemyDataBurst.ts');
    const material = new LineMaterial({ color: 0x00ff00, linewidth: 2 });
    const burst = new EnemyDataBurst(material);

    const origin = new THREE.Vector3(0, 0, 0);
    const dir = new THREE.Vector3(0, 0, -1);
    burst.activate(origin, dir, 15, 10);
    burst.update(1.0); // 1 second = 15 units

    expect(burst.distance).toBeCloseTo(15, 5);
    expect(burst.mesh.position.z).toBeCloseTo(-15, 5);
  });

  it('should not move when inactive', async () => {
    const { EnemyDataBurst } = await import('../entities/projectiles/EnemyDataBurst.ts');
    const material = new LineMaterial({ color: 0x00ff00, linewidth: 2 });
    const burst = new EnemyDataBurst(material);

    burst.update(1.0);
    expect(burst.distance).toBe(0);
  });

  it('should sync collider center to mesh position on update', async () => {
    const { EnemyDataBurst } = await import('../entities/projectiles/EnemyDataBurst.ts');
    const material = new LineMaterial({ color: 0x00ff00, linewidth: 2 });
    const burst = new EnemyDataBurst(material);

    burst.activate(new THREE.Vector3(5, 10, 15), new THREE.Vector3(1, 0, 0), 10, 5);
    burst.update(0.5);

    expect(burst.collider.center.x).toBeCloseTo(burst.mesh.position.x, 5);
    expect(burst.collider.center.y).toBeCloseTo(burst.mesh.position.y, 5);
    expect(burst.collider.center.z).toBeCloseTo(burst.mesh.position.z, 5);
  });

  it('should enable bloom layer on mesh', async () => {
    const { EnemyDataBurst } = await import('../entities/projectiles/EnemyDataBurst.ts');
    const { BLOOM_LAYER } = await import('../config/constants.ts');
    const material = new LineMaterial({ color: 0x00ff00, linewidth: 2 });
    const burst = new EnemyDataBurst(material);

    // Check that bloom layer is enabled by testing mesh.layers bitmask
    const bloomLayers = new THREE.Layers();
    bloomLayers.set(BLOOM_LAYER);
    expect(burst.mesh.layers.test(bloomLayers)).toBe(true);
  });
});
