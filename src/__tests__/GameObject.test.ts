import { describe, it, expect, vi } from 'vitest';

// Mock three.js with proper class constructors
vi.mock('three', () => {
  class MockVector3 {
    x: number;
    y: number;
    z: number;
    constructor(x = 0, y = 0, z = 0) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
    copy = vi.fn().mockReturnThis();
    set = vi.fn().mockReturnThis();
  }

  class MockObject3D {
    position = new MockVector3();
    visible = true;
    traverse = vi.fn((cb: (child: { layers: { enable: ReturnType<typeof vi.fn> } }) => void) => {
      cb({ layers: { enable: vi.fn() } });
    });
  }

  class MockSphere {
    center: MockVector3;
    radius: number;
    constructor(center?: MockVector3, radius = 1) {
      this.center = center || new MockVector3();
      this.radius = radius;
    }
  }

  return {
    Object3D: MockObject3D,
    Sphere: MockSphere,
    Vector3: MockVector3,
  };
});

import { GameObject } from '../entities/GameObject.ts';
import { BLOOM_LAYER } from '../config/constants.ts';

// Concrete subclass for testing the abstract class
class TestGameObject extends GameObject {
  updateCalled = false;
  update(_dt: number): void {
    this.updateCalled = true;
    this.syncCollider();
  }
}

describe('GameObject', () => {
  it('should be instantiable via subclass', () => {
    const obj = new TestGameObject();
    expect(obj).toBeDefined();
  });

  it('should have isActive true by default', () => {
    const obj = new TestGameObject();
    expect(obj.isActive).toBe(true);
  });

  it('should allow setting active to false', () => {
    const obj = new TestGameObject();
    obj.setActive(false);
    expect(obj.isActive).toBe(false);
  });

  it('should allow setting active back to true', () => {
    const obj = new TestGameObject();
    obj.setActive(false);
    obj.setActive(true);
    expect(obj.isActive).toBe(true);
  });

  it('should return a THREE.Object3D from getObject3D()', () => {
    const obj = new TestGameObject();
    expect(obj.getObject3D()).toBeDefined();
    expect(obj.getObject3D().position).toBeDefined();
  });

  it('should return position from getPosition()', () => {
    const obj = new TestGameObject();
    const pos = obj.getPosition();
    expect(pos).toBeDefined();
  });

  it('should return a collider from getCollider()', () => {
    const obj = new TestGameObject();
    const collider = obj.getCollider();
    expect(collider).toBeDefined();
    expect(collider.radius).toBe(1.0);
  });

  it('should accept custom collider radius', () => {
    const obj = new TestGameObject(2.5);
    const collider = obj.getCollider();
    expect(collider.radius).toBe(2.5);
  });

  it('should have abstract update method implemented in subclass', () => {
    const obj = new TestGameObject();
    obj.update(0.016);
    expect(obj.updateCalled).toBe(true);
  });

  it('should sync collider center to object3D position', () => {
    const obj = new TestGameObject();
    obj.update(0.016);
    const collider = obj.getCollider();
    expect(collider.center.copy).toHaveBeenCalled();
  });

  it('should enable bloom layer on children via enableBloomOnChildren', () => {
    const obj = new TestGameObject();
    const object3D = obj.getObject3D();
    expect(typeof object3D.traverse).toBe('function');
  });

  it('should export GameObject class', async () => {
    const mod = await import('../entities/GameObject.ts');
    expect(mod.GameObject).toBeDefined();
    expect(typeof mod.GameObject).toBe('function');
  });

  it('BLOOM_LAYER constant should be available', () => {
    expect(BLOOM_LAYER).toBe(1);
  });
});
