import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as THREE from 'three';
import { EnemyProjectileSystem } from '../systems/EnemyProjectileSystem.ts';
import { VectorMaterials } from '../rendering/VectorMaterials.ts';
import { setActivePalette } from '../rendering/ColorPalette.ts';
import { eventBus } from '../core/GameEvents.ts';

// Mock Logger to avoid console noise
vi.mock('../core/Logger.ts', () => ({
  Logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('BossProjectiles - EnemyProjectileSystem bossAttack handling', () => {
  let scene: THREE.Scene;
  let vectorMaterials: VectorMaterials;
  let system: EnemyProjectileSystem;
  let playerCollider: THREE.Sphere;

  beforeEach(() => {
    setActivePalette('green');
    scene = new THREE.Scene();
    vectorMaterials = new VectorMaterials();
    playerCollider = new THREE.Sphere(new THREE.Vector3(0, 10, -30), 1.0);
    system = new EnemyProjectileSystem(scene, vectorMaterials, playerCollider);
  });

  afterEach(() => {
    vectorMaterials.dispose();
  });

  it('should subscribe to bossAttack events', () => {
    // Spy on fireAt to confirm it gets called when bossAttack is emitted
    const fireAtSpy = vi.spyOn(system, 'fireAt');

    eventBus.emit('bossAttack', {
      positions: [{ x: 0, y: 0, z: 0 }],
      targetPosition: { x: 0, y: 10, z: -30 },
      speed: 16,
      damage: 15,
    });

    expect(fireAtSpy).toHaveBeenCalledTimes(1);
  });

  it('should spawn correct number of data bursts from bossAttack positions', () => {
    const fireAtSpy = vi.spyOn(system, 'fireAt');

    // Boss fires 3 positions (barrage)
    eventBus.emit('bossAttack', {
      positions: [
        { x: 8, y: 0, z: 0 },
        { x: -4, y: 0, z: 7 },
        { x: -4, y: 0, z: -7 },
      ],
      targetPosition: { x: 0, y: 10, z: -30 },
      speed: 16,
      damage: 15,
    });

    expect(fireAtSpy).toHaveBeenCalledTimes(3);
  });

  it('should pass correct speed and damage to fireAt', () => {
    const fireAtSpy = vi.spyOn(system, 'fireAt');

    eventBus.emit('bossAttack', {
      positions: [{ x: 5, y: 0, z: 0 }],
      targetPosition: { x: 0, y: 10, z: -30 },
      speed: 16,
      damage: 15,
    });

    expect(fireAtSpy).toHaveBeenCalledWith(
      expect.any(THREE.Vector3),
      expect.any(THREE.Vector3),
      16,
      15,
    );
  });

  it('should pass correct origin position to fireAt', () => {
    const fireAtSpy = vi.spyOn(system, 'fireAt');

    eventBus.emit('bossAttack', {
      positions: [{ x: 5, y: 3, z: -2 }],
      targetPosition: { x: 0, y: 10, z: -30 },
      speed: 16,
      damage: 15,
    });

    const origin = fireAtSpy.mock.calls[0][0] as THREE.Vector3;
    expect(origin.x).toBe(5);
    expect(origin.y).toBe(3);
    expect(origin.z).toBe(-2);
  });

  it('should pass correct target position to fireAt', () => {
    const fireAtSpy = vi.spyOn(system, 'fireAt');

    eventBus.emit('bossAttack', {
      positions: [{ x: 5, y: 0, z: 0 }],
      targetPosition: { x: 10, y: 20, z: -40 },
      speed: 16,
      damage: 15,
    });

    const target = fireAtSpy.mock.calls[0][1] as THREE.Vector3;
    expect(target.x).toBe(10);
    expect(target.y).toBe(20);
    expect(target.z).toBe(-40);
  });

  it('should increase active burst count after bossAttack event', () => {
    const statsBefore = system.getPoolStats();
    expect(statsBefore.active).toBe(0);

    eventBus.emit('bossAttack', {
      positions: [
        { x: 8, y: 0, z: 0 },
        { x: -4, y: 0, z: 7 },
      ],
      targetPosition: { x: 0, y: 10, z: -30 },
      speed: 16,
      damage: 15,
    });

    const statsAfter = system.getPoolStats();
    expect(statsAfter.active).toBe(2);
  });
});
