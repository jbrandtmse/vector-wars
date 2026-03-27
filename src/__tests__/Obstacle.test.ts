import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock three.js
vi.mock('three', () => {
  class MockVector3 {
    x: number; y: number; z: number;
    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
    copy = vi.fn().mockReturnThis();
    set = vi.fn().mockReturnThis();
    clone() { return new MockVector3(this.x, this.y, this.z); }
  }
  class MockObject3D {
    position = new MockVector3();
    rotation = { x: 0, y: 0, z: 0 };
    visible = true;
    add = vi.fn();
    remove = vi.fn();
  }
  class MockBox3 {
    min = new MockVector3(-1, -1, -1);
    max = new MockVector3(1, 1, 1);
    setFromCenterAndSize = vi.fn().mockReturnThis();
    intersectsSphere = vi.fn().mockReturnValue(false);
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
    Vector3: MockVector3,
    Box3: MockBox3,
    Sphere: MockSphere,
  };
});

describe('Obstacle Base Class (Story 3-4)', () => {
  // Create a concrete subclass for testing the abstract base
  let ConcreteObstacle: new () => InstanceType<typeof import('../entities/obstacles/Obstacle.ts').Obstacle>;

  beforeEach(async () => {
    vi.resetModules();
    const { Obstacle } = await import('../entities/obstacles/Obstacle.ts');
    // Create a concrete implementation for testing
    ConcreteObstacle = class extends Obstacle {
      update(_dt: number): void {
        // no-op for testing
      }
    } as never;
  });

  it('should construct with default properties', () => {
    const obs = new ConcreteObstacle();
    expect(obs).toBeDefined();
    expect(obs.isActive).toBe(true);
    expect(obs.getObject3D()).toBeDefined();
  });

  it('should have a getObject3D method that returns an Object3D', () => {
    const obs = new ConcreteObstacle();
    const obj = obs.getObject3D();
    expect(obj).toBeDefined();
    expect(obj.position).toBeDefined();
  });

  it('should return false from checkCollision when not active', () => {
    const obs = new ConcreteObstacle();
    // Manually deactivate via the protected member
    (obs as unknown as { active: boolean }).active = false;
    const THREE = require('three');
    const sphere = new THREE.Sphere(new THREE.Vector3(), 1);
    expect(obs.checkCollision(sphere)).toBe(false);
  });

  it('should delegate collision check to Box3.intersectsSphere when active', () => {
    const obs = new ConcreteObstacle();
    const THREE = require('three');
    const sphere = new THREE.Sphere(new THREE.Vector3(), 1);

    // Access collider to set up mock behavior
    const collider = (obs as unknown as { collider: { intersectsSphere: ReturnType<typeof vi.fn> } }).collider;
    collider.intersectsSphere.mockReturnValue(true);

    expect(obs.checkCollision(sphere)).toBe(true);
    expect(collider.intersectsSphere).toHaveBeenCalledWith(sphere);
  });

  it('should return false from checkCollision when Box3 does not intersect', () => {
    const obs = new ConcreteObstacle();
    const THREE = require('three');
    const sphere = new THREE.Sphere(new THREE.Vector3(100, 100, 100), 0.1);

    const collider = (obs as unknown as { collider: { intersectsSphere: ReturnType<typeof vi.fn> } }).collider;
    collider.intersectsSphere.mockReturnValue(false);

    expect(obs.checkCollision(sphere)).toBe(false);
  });

  it('should have a dispose method', () => {
    const obs = new ConcreteObstacle();
    expect(() => obs.dispose()).not.toThrow();
  });
});
