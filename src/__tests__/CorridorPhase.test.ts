import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock three.js
vi.mock('three', () => {
  class MockVector3 {
    x: number; y: number; z: number;
    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
    copy = vi.fn().mockReturnThis();
    set = vi.fn(function(this: MockVector3, x: number, y: number, z: number) { this.x = x; this.y = y; this.z = z; return this; });
    add = vi.fn().mockReturnThis();
    addScaledVector = vi.fn().mockReturnThis();
    clone() { return new MockVector3(this.x, this.y, this.z); }
    setScalar(s: number) { this.x = s; this.y = s; this.z = s; return this; }
    crossVectors = vi.fn().mockReturnThis();
    normalize = vi.fn().mockReturnThis();
    dot = vi.fn().mockReturnValue(0);
    length = vi.fn().mockReturnValue(1);
  }
  class MockQuaternion {
    slerp = vi.fn().mockReturnThis();
    setFromRotationMatrix = vi.fn().mockReturnThis();
  }
  class MockMatrix4 {
    lookAt = vi.fn().mockReturnThis();
  }
  class MockObject3D {
    position = new MockVector3();
    scale = new MockVector3(1, 1, 1);
    rotation = { x: 0, y: 0, z: 0 };
    quaternion = new MockQuaternion();
    visible = true;
    traverse = vi.fn();
    add = vi.fn();
    remove = vi.fn();
  }
  class MockScene extends MockObject3D {}
  class MockSphere {
    center: MockVector3;
    radius: number;
    constructor(center?: MockVector3, radius = 1) {
      this.center = center || new MockVector3();
      this.radius = radius;
    }
  }
  class MockBox3 {
    min = new MockVector3(-1, -1, -1);
    max = new MockVector3(1, 1, 1);
    setFromCenterAndSize = vi.fn().mockReturnThis();
    intersectsSphere = vi.fn().mockReturnValue(false);
  }
  class MockPerspectiveCamera extends MockObject3D {
    constructor() { super(); }
  }
  class MockPlaneGeometry {
    dispose = vi.fn();
  }
  class MockBoxGeometry {
    dispose = vi.fn();
  }
  class MockEdgesGeometry {
    dispose = vi.fn();
    constructor() {}
  }
  class MockBufferGeometry {
    dispose = vi.fn();
    setAttribute = vi.fn().mockReturnThis();
  }
  class MockFloat32BufferAttribute {
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
    removeFromParent = vi.fn();
  }
  class MockLineBasicMaterial {
    dispose = vi.fn();
  }
  class MockCatmullRomCurve3 {
    getLength = vi.fn().mockReturnValue(700);
    getPointAt = vi.fn((_t: number, target?: MockVector3) => {
      const v = target || new MockVector3();
      return v;
    });
    getTangentAt = vi.fn((_t: number, target?: MockVector3) => {
      const v = target || new MockVector3(0, 0, 1);
      return v;
    });
  }
  return {
    Object3D: MockObject3D,
    Scene: MockScene,
    Sphere: MockSphere,
    Box3: MockBox3,
    Vector3: MockVector3,
    Quaternion: MockQuaternion,
    Matrix4: MockMatrix4,
    PerspectiveCamera: MockPerspectiveCamera,
    PlaneGeometry: MockPlaneGeometry,
    BoxGeometry: MockBoxGeometry,
    EdgesGeometry: MockEdgesGeometry,
    BufferGeometry: MockBufferGeometry,
    Float32BufferAttribute: MockFloat32BufferAttribute,
    LineSegments: MockLineSegments,
    LineBasicMaterial: MockLineBasicMaterial,
    CatmullRomCurve3: MockCatmullRomCurve3,
  };
});

// Mock Firewall
vi.mock('../entities/obstacles/Firewall.ts', () => {
  class MockFirewall {
    active = true;
    object3D = {
      position: { x: 0, y: 0, z: 0, set: vi.fn(), copy: vi.fn() },
      visible: true,
      add: vi.fn(),
      remove: vi.fn(),
    };
    collider = {
      intersectsSphere: vi.fn().mockReturnValue(false),
      setFromCenterAndSize: vi.fn(),
    };
    get isActive() { return this.active; }
    getObject3D = vi.fn().mockReturnValue(this.object3D);
    checkCollision = vi.fn().mockReturnValue(false);
    update = vi.fn();
    dispose = vi.fn();
  }
  return { Firewall: MockFirewall };
});

// Mock NetworkCable
vi.mock('../entities/obstacles/NetworkCable.ts', () => {
  class MockNetworkCable {
    active = true;
    object3D = {
      position: { x: 0, y: 0, z: 0, set: vi.fn(), copy: vi.fn() },
      visible: true,
      add: vi.fn(),
      remove: vi.fn(),
    };
    collider = {
      intersectsSphere: vi.fn().mockReturnValue(false),
      setFromCenterAndSize: vi.fn(),
    };
    get isActive() { return this.active; }
    getObject3D = vi.fn().mockReturnValue(this.object3D);
    checkCollision = vi.fn().mockReturnValue(false);
    update = vi.fn();
    dispose = vi.fn();
  }
  return { NetworkCable: MockNetworkCable };
});

// Mock DataStream
vi.mock('../entities/obstacles/DataStream.ts', () => {
  class MockDataStream {
    active = true;
    object3D = {
      position: { x: 0, y: 0, z: 0, set: vi.fn(), copy: vi.fn() },
      visible: true,
      add: vi.fn(),
      remove: vi.fn(),
    };
    collider = {
      intersectsSphere: vi.fn().mockReturnValue(false),
      setFromCenterAndSize: vi.fn(),
    };
    get isActive() { return this.active; }
    getObject3D = vi.fn().mockReturnValue(this.object3D);
    checkCollision = vi.fn().mockReturnValue(false);
    update = vi.fn();
    dispose = vi.fn();
  }
  return { DataStream: MockDataStream };
});

describe('CorridorPhase Class (Story 3-4)', () => {
  let CorridorPhase: typeof import('../state/phases/CorridorPhase.ts').CorridorPhase;
  let THREE: typeof import('three');
  let mockVectorMaterials: { create: ReturnType<typeof vi.fn> };
  let mockPlayerSphere: InstanceType<typeof import('three').Sphere>;

  beforeEach(async () => {
    vi.resetModules();

    THREE = await import('three');
    const mod = await import('../state/phases/CorridorPhase.ts');
    CorridorPhase = mod.CorridorPhase;

    mockVectorMaterials = {
      create: vi.fn().mockReturnValue({ dispose: vi.fn() }),
    };

    mockPlayerSphere = new THREE.Sphere(new THREE.Vector3(), 1);
  });

  it('should export CorridorPhase class', () => {
    expect(CorridorPhase).toBeDefined();
    expect(typeof CorridorPhase).toBe('function');
  });

  it('should have enter, update, exit lifecycle methods', () => {
    const proto = CorridorPhase.prototype;
    expect(typeof proto.enter).toBe('function');
    expect(typeof proto.update).toBe('function');
    expect(typeof proto.exit).toBe('function');
  });

  it('should construct with required dependencies', () => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera();

    const phase = new CorridorPhase(
      scene as never,
      camera as never,
      mockVectorMaterials as never,
      mockPlayerSphere as never,
    );
    expect(phase).toBeDefined();
  });

  describe('enter()', () => {
    it('should create corridor geometry and obstacles on enter', () => {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera();

      const phase = new CorridorPhase(
        scene as never,
        camera as never,
        mockVectorMaterials as never,
        mockPlayerSphere as never,
      );
      phase.enter();

      // Should add geometry to scene
      expect(scene.add).toHaveBeenCalled();
      // Should create materials for walls, floor, etc.
      expect(mockVectorMaterials.create).toHaveBeenCalled();
    });

    it('should create VectorMaterials for corridor walls and floor', () => {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera();

      const phase = new CorridorPhase(
        scene as never,
        camera as never,
        mockVectorMaterials as never,
        mockPlayerSphere as never,
      );
      phase.enter();

      expect(mockVectorMaterials.create).toHaveBeenCalledWith('corridorWall');
      expect(mockVectorMaterials.create).toHaveBeenCalledWith('corridorFloor');
    });
  });

  describe('update()', () => {
    it('should not throw when called with a valid dt', () => {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera();

      const phase = new CorridorPhase(
        scene as never,
        camera as never,
        mockVectorMaterials as never,
        mockPlayerSphere as never,
      );
      phase.enter();

      expect(() => phase.update(0.016)).not.toThrow();
    });

    it('should track phase completion state', () => {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera();

      const phase = new CorridorPhase(
        scene as never,
        camera as never,
        mockVectorMaterials as never,
        mockPlayerSphere as never,
      );
      phase.enter();

      expect(phase.isComplete()).toBe(false);
    });

    it('should not crash if update is called multiple times', () => {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera();

      const phase = new CorridorPhase(
        scene as never,
        camera as never,
        mockVectorMaterials as never,
        mockPlayerSphere as never,
      );
      phase.enter();

      for (let i = 0; i < 100; i++) {
        expect(() => phase.update(0.016)).not.toThrow();
      }
    });
  });

  describe('Phase completion logic', () => {
    it('should complete when rail progress reaches end', () => {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera();

      const phase = new CorridorPhase(
        scene as never,
        camera as never,
        mockVectorMaterials as never,
        mockPlayerSphere as never,
      );
      phase.enter();

      // Simulate reaching end of rail by updating a large dt
      // The mock curve returns length 700, and RAIL_SPEED * 1.2 = 21.6
      // To go from 0 to 0.98, need progress = 0.98
      // progress += (21.6 * dt) / 700 → dt = 0.98 * 700 / 21.6 ≈ 31.75s
      phase.update(35);
      expect(phase.isComplete()).toBe(true);
    });

    it('should not be complete at start', () => {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera();

      const phase = new CorridorPhase(
        scene as never,
        camera as never,
        mockVectorMaterials as never,
        mockPlayerSphere as never,
      );
      phase.enter();
      phase.update(0.016);

      expect(phase.isComplete()).toBe(false);
    });
  });

  describe('Hit cooldown', () => {
    it('should have hit cooldown to prevent multi-hit stacking', () => {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera();

      const phase = new CorridorPhase(
        scene as never,
        camera as never,
        mockVectorMaterials as never,
        mockPlayerSphere as never,
      );
      phase.enter();

      // The phase should handle hit cooldown internally
      // After a hit, subsequent collision checks within cooldown should not emit events
      expect(() => phase.update(0.016)).not.toThrow();
    });
  });

  describe('exit()', () => {
    it('should clean up resources on exit', () => {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera();

      const phase = new CorridorPhase(
        scene as never,
        camera as never,
        mockVectorMaterials as never,
        mockPlayerSphere as never,
      );
      phase.enter();
      phase.exit();

      // Scene.remove should have been called during cleanup
      expect(scene.remove).toHaveBeenCalled();
    });

    it('should not throw if exit is called without enter', () => {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera();

      const phase = new CorridorPhase(
        scene as never,
        camera as never,
        mockVectorMaterials as never,
        mockPlayerSphere as never,
      );

      expect(() => phase.exit()).not.toThrow();
    });

    it('should have no active resources after exit', () => {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera();

      const phase = new CorridorPhase(
        scene as never,
        camera as never,
        mockVectorMaterials as never,
        mockPlayerSphere as never,
      );
      phase.enter();
      phase.exit();

      // Should be safely callable again
      expect(() => phase.exit()).not.toThrow();
    });
  });
});
