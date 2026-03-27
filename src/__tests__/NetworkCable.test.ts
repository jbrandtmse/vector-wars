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
  class MockBufferGeometry {
    dispose = vi.fn();
    setAttribute = vi.fn().mockReturnThis();
  }
  class MockFloat32BufferAttribute {
    constructor() {}
  }
  class MockEdgesGeometry {
    dispose = vi.fn();
    constructor() {}
  }
  class MockLineSegments extends MockObject3D {
    layers = { enable: vi.fn() };
    geometry: MockBufferGeometry;
    material: MockLineBasicMaterial;
    constructor(geo?: MockBufferGeometry, mat?: MockLineBasicMaterial) {
      super();
      this.geometry = geo || new MockBufferGeometry();
      this.material = mat || new MockLineBasicMaterial();
    }
  }
  class MockLineBasicMaterial {
    dispose = vi.fn();
  }
  return {
    Object3D: MockObject3D,
    Vector3: MockVector3,
    Box3: MockBox3,
    Sphere: MockSphere,
    BufferGeometry: MockBufferGeometry,
    Float32BufferAttribute: MockFloat32BufferAttribute,
    EdgesGeometry: MockEdgesGeometry,
    LineSegments: MockLineSegments,
    LineBasicMaterial: MockLineBasicMaterial,
  };
});

describe('NetworkCable Obstacle (Story 3-4)', () => {
  let NetworkCable: typeof import('../entities/obstacles/NetworkCable.ts').NetworkCable;
  let mockVectorMaterials: { create: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../entities/obstacles/NetworkCable.ts');
    NetworkCable = mod.NetworkCable;
    mockVectorMaterials = { create: vi.fn().mockReturnValue({ dispose: vi.fn() }) };
  });

  it('should construct with position and corridor width', () => {
    const cable = new NetworkCable(
      [0, 2.5, -130],
      10,
      mockVectorMaterials as never,
    );
    expect(cable).toBeDefined();
    expect(cable.isActive).toBe(true);
  });

  it('should create geometry using VectorMaterials', () => {
    const cable = new NetworkCable(
      [0, 2.5, -130],
      10,
      mockVectorMaterials as never,
    );
    expect(mockVectorMaterials.create).toHaveBeenCalledWith('networkCable');
    expect(cable.getObject3D()).toBeDefined();
  });

  it('should be a static obstacle (always active)', () => {
    const cable = new NetworkCable(
      [0, 2.5, -130],
      10,
      mockVectorMaterials as never,
    );
    // Update should be a no-op but not change active state
    cable.update(1.0);
    expect(cable.isActive).toBe(true);
    cable.update(10.0);
    expect(cable.isActive).toBe(true);
  });

  it('should have collision via Box3', () => {
    const cable = new NetworkCable(
      [0, 2.5, -130],
      10,
      mockVectorMaterials as never,
    );

    const THREE = require('three');
    const sphere = new THREE.Sphere(new THREE.Vector3(0, 2.5, -130), 1);
    const collider = (cable as unknown as { collider: { intersectsSphere: ReturnType<typeof vi.fn> } }).collider;
    collider.intersectsSphere.mockReturnValue(true);

    expect(cable.checkCollision(sphere)).toBe(true);
  });

  it('should set collider with correct dimensions', () => {
    const cable = new NetworkCable(
      [0, 2.5, -130],
      10,
      mockVectorMaterials as never,
    );

    const collider = (cable as unknown as { collider: { setFromCenterAndSize: ReturnType<typeof vi.fn> } }).collider;
    expect(collider.setFromCenterAndSize).toHaveBeenCalled();
  });

  it('should dispose geometry and material', () => {
    const mockMaterial = { dispose: vi.fn() };
    mockVectorMaterials.create.mockReturnValue(mockMaterial);

    const cable = new NetworkCable(
      [0, 2.5, -130],
      10,
      mockVectorMaterials as never,
    );
    cable.dispose();
    expect(mockMaterial.dispose).toHaveBeenCalled();
  });
});
