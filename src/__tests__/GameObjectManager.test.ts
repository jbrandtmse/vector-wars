import { describe, it, expect, vi } from 'vitest';

// Mock three.js
vi.mock('three', () => {
  class MockVector3 {
    x: number; y: number; z: number;
    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
    copy = vi.fn().mockReturnThis();
  }
  class MockObject3D {
    position = new MockVector3();
    traverse = vi.fn();
  }
  class MockSphere {
    center: MockVector3;
    radius: number;
    constructor(center?: MockVector3, radius = 1) {
      this.center = center || new MockVector3();
      this.radius = radius;
    }
  }
  return { Object3D: MockObject3D, Sphere: MockSphere, Vector3: MockVector3 };
});

import { GameObjectManager } from '../entities/GameObjectManager.ts';
import { GameObject } from '../entities/GameObject.ts';

// Concrete subclass for testing
class TestEntity extends GameObject {
  updateCallCount = 0;
  update(_dt: number): void {
    this.updateCallCount++;
  }
}

describe('GameObjectManager', () => {
  it('should start with zero entities', () => {
    const manager = new GameObjectManager();
    expect(manager.getAll()).toHaveLength(0);
    expect(manager.getActiveCount()).toBe(0);
  });

  it('should add entities', () => {
    const manager = new GameObjectManager();
    const entity = new TestEntity();
    manager.add(entity);
    expect(manager.getAll()).toHaveLength(1);
  });

  it('should remove entities', () => {
    const manager = new GameObjectManager();
    const entity = new TestEntity();
    manager.add(entity);
    manager.remove(entity);
    expect(manager.getAll()).toHaveLength(0);
  });

  it('should return all entities via getAll()', () => {
    const manager = new GameObjectManager();
    const e1 = new TestEntity();
    const e2 = new TestEntity();
    manager.add(e1);
    manager.add(e2);
    const all = manager.getAll();
    expect(all).toHaveLength(2);
    expect(all).toContain(e1);
    expect(all).toContain(e2);
  });

  it('should return active count reflecting active state', () => {
    const manager = new GameObjectManager();
    const e1 = new TestEntity();
    const e2 = new TestEntity();
    manager.add(e1);
    manager.add(e2);
    expect(manager.getActiveCount()).toBe(2);

    e1.setActive(false);
    expect(manager.getActiveCount()).toBe(1);
  });

  it('should call update on active entities only', () => {
    const manager = new GameObjectManager();
    const active = new TestEntity();
    const inactive = new TestEntity();
    inactive.setActive(false);
    manager.add(active);
    manager.add(inactive);

    manager.update(0.016);

    expect(active.updateCallCount).toBe(1);
    expect(inactive.updateCallCount).toBe(0);
  });

  it('should call update with correct delta time', () => {
    const manager = new GameObjectManager();
    const entity = new TestEntity();
    const spy = vi.spyOn(entity, 'update');
    manager.add(entity);
    manager.update(0.033);
    expect(spy).toHaveBeenCalledWith(0.033);
  });

  it('should handle removing non-existent entity gracefully', () => {
    const manager = new GameObjectManager();
    const entity = new TestEntity();
    // Should not throw
    expect(() => manager.remove(entity)).not.toThrow();
  });

  it('should export GameObjectManager class', async () => {
    const mod = await import('../entities/GameObjectManager.ts');
    expect(mod.GameObjectManager).toBeDefined();
    expect(typeof mod.GameObjectManager).toBe('function');
  });
});
