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
  class MockPlaneGeometry {
    dispose = vi.fn();
  }
  class MockEdgesGeometry {
    dispose = vi.fn();
    constructor() {}
  }
  class MockLineSegments extends MockObject3D {
    layers = { enable: vi.fn() };
    geometry: MockEdgesGeometry;
    material: MockLineBasicMaterial;
    constructor(geo?: MockEdgesGeometry, mat?: MockLineBasicMaterial) {
      super();
      this.geometry = geo || new MockEdgesGeometry();
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
    PlaneGeometry: MockPlaneGeometry,
    EdgesGeometry: MockEdgesGeometry,
    LineSegments: MockLineSegments,
    LineBasicMaterial: MockLineBasicMaterial,
  };
});

// Mock VectorMaterials
vi.mock('../../rendering/VectorMaterials.ts', () => ({
  VectorMaterials: vi.fn(),
  vectorMaterials: { create: vi.fn().mockReturnValue({ dispose: vi.fn() }) },
}));

describe('Firewall Obstacle (Story 3-4)', () => {
  let Firewall: typeof import('../entities/obstacles/Firewall.ts').Firewall;
  let mockVectorMaterials: { create: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../entities/obstacles/Firewall.ts');
    Firewall = mod.Firewall;
    mockVectorMaterials = { create: vi.fn().mockReturnValue({ dispose: vi.fn() }) };
  });

  it('should construct with position and corridor width', () => {
    const fw = new Firewall(
      [0, 4, -80],
      10,
      0,
      mockVectorMaterials as never,
    );
    expect(fw).toBeDefined();
    expect(fw.isActive).toBe(true);
  });

  it('should create geometry with LineSegments', () => {
    const fw = new Firewall(
      [0, 4, -80],
      10,
      0,
      mockVectorMaterials as never,
    );
    expect(mockVectorMaterials.create).toHaveBeenCalledWith('firewall');
    expect(fw.getObject3D()).toBeDefined();
  });

  it('should start in closed state (visible)', () => {
    const fw = new Firewall(
      [0, 4, -80],
      10,
      0,
      mockVectorMaterials as never,
    );
    // With phaseOffset 0, starts at beginning of closed duration
    // The lineSegments should be visible
    const obj = fw.getObject3D();
    // Initially the firewall is closed/visible
    expect(obj.visible).toBe(true);
  });

  describe('Open/close animation cycle', () => {
    it('should be closed at start with phaseOffset 0', () => {
      const fw = new Firewall(
        [0, 4, -80],
        10,
        0,
        mockVectorMaterials as never,
      );
      // With offset 0, timer starts at 0 which is in closed state
      // Advance a tiny bit and it should still be closed
      fw.update(0.1);
      expect(fw.isActive).toBe(true);
    });

    it('should transition to open after FIREWALL_CLOSE_DURATION', () => {
      const fw = new Firewall(
        [0, 4, -80],
        10,
        0,
        mockVectorMaterials as never,
      );
      // Advance past close duration (1.5s)
      fw.update(1.6);
      // Should now be in open state — inactive collision
      expect(fw.isActive).toBe(false);
    });

    it('should cycle back to closed after full period', () => {
      const fw = new Firewall(
        [0, 4, -80],
        10,
        0,
        mockVectorMaterials as never,
      );
      // Full cycle: 1.5 (close) + 2.0 (open) = 3.5s
      fw.update(3.6);
      // Should be back to closed (timer wrapped)
      expect(fw.isActive).toBe(true);
    });

    it('should use phaseOffset to stagger timing', () => {
      // phaseOffset 0.5 means timer starts at 0.5 * 3.5 = 1.75
      // 1.75 > 1.5 → starts in open state
      const fw = new Firewall(
        [0, 4, -80],
        10,
        0.5,
        mockVectorMaterials as never,
      );
      // At t=0 with offset, timer is at 1.75 → open
      fw.update(0.001);
      expect(fw.isActive).toBe(false);
    });
  });

  describe('Collision behavior', () => {
    it('should not collide when in open state', () => {
      const fw = new Firewall(
        [0, 4, -80],
        10,
        0,
        mockVectorMaterials as never,
      );
      // Move to open state
      fw.update(1.6);
      const THREE = require('three');
      const sphere = new THREE.Sphere(new THREE.Vector3(0, 4, -80), 1);
      // Since isActive is false, checkCollision should return false
      expect(fw.checkCollision(sphere)).toBe(false);
    });

    it('should check collision when in closed state', () => {
      const fw = new Firewall(
        [0, 4, -80],
        10,
        0,
        mockVectorMaterials as never,
      );
      fw.update(0.1); // Still closed
      const THREE = require('three');
      const sphere = new THREE.Sphere(new THREE.Vector3(0, 4, -80), 1);

      // Access collider to mock
      const collider = (fw as unknown as { collider: { intersectsSphere: ReturnType<typeof vi.fn> } }).collider;
      collider.intersectsSphere.mockReturnValue(true);

      expect(fw.checkCollision(sphere)).toBe(true);
    });
  });

  it('should dispose geometry and material', () => {
    const mockMaterial = { dispose: vi.fn() };
    mockVectorMaterials.create.mockReturnValue(mockMaterial);

    const fw = new Firewall(
      [0, 4, -80],
      10,
      0,
      mockVectorMaterials as never,
    );
    fw.dispose();
    // Dispose should be callable without error
    expect(mockMaterial.dispose).toHaveBeenCalled();
  });
});
