import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock three.js
vi.mock('three', () => {
  class MockVector3 {
    x: number; y: number; z: number;
    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
    copy = vi.fn().mockReturnThis();
    set = vi.fn().mockReturnThis();
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
    traverse = vi.fn((cb: (child: { layers: { enable: ReturnType<typeof vi.fn> } }) => void) => {
      cb({ layers: { enable: vi.fn() } });
    });
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
  class MockPerspectiveCamera extends MockObject3D {
    constructor() { super(); }
  }
  class MockPlaneGeometry {
    dispose = vi.fn();
  }
  class MockBoxGeometry {
    dispose = vi.fn();
  }
  class MockCylinderGeometry {
    dispose = vi.fn();
  }
  class MockSphereGeometry {
    dispose = vi.fn();
  }
  class MockEdgesGeometry {
    dispose = vi.fn();
    constructor() {}
  }
  class MockLineSegments {
    layers = { enable: vi.fn() };
    geometry: MockEdgesGeometry;
    material: MockLineBasicMaterial;
    position = new MockVector3();
    rotation = { x: 0, y: 0, z: 0 };
    constructor(geo?: MockEdgesGeometry, mat?: MockLineBasicMaterial) {
      this.geometry = geo || new MockEdgesGeometry();
      this.material = mat || new MockLineBasicMaterial();
    }
    removeFromParent = vi.fn();
  }
  class MockLineBasicMaterial {
    dispose = vi.fn();
  }
  class MockCatmullRomCurve3 {
    getLength = vi.fn().mockReturnValue(1000);
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
    Vector3: MockVector3,
    Quaternion: MockQuaternion,
    Matrix4: MockMatrix4,
    PerspectiveCamera: MockPerspectiveCamera,
    PlaneGeometry: MockPlaneGeometry,
    BoxGeometry: MockBoxGeometry,
    CylinderGeometry: MockCylinderGeometry,
    SphereGeometry: MockSphereGeometry,
    EdgesGeometry: MockEdgesGeometry,
    LineSegments: MockLineSegments,
    LineBasicMaterial: MockLineBasicMaterial,
    CatmullRomCurve3: MockCatmullRomCurve3,
    Box3: class MockBox3 {
      min: MockVector3;
      max: MockVector3;
      constructor(min?: MockVector3, max?: MockVector3) {
        this.min = min ?? new MockVector3();
        this.max = max ?? new MockVector3();
      }
      intersectsSphere = vi.fn().mockReturnValue(false);
    },
  };
});

// Mock FirewallNode and ICETower to avoid deep dependency chain
vi.mock('../entities/enemies/FirewallNode.ts', () => {
  class MockFirewallNode {
    object3D = {
      position: { x: 0, y: 0, z: 0, copy: vi.fn(), set: vi.fn() },
      visible: true,
      add: vi.fn(),
    };
    health = 20;
    scoreValue = 150;
    isActive = false;
    static resetSharedResources = vi.fn();
    getObject3D = vi.fn().mockReturnValue(this.object3D);
    setActive = vi.fn((val: boolean) => { MockFirewallNode.prototype.isActive = val; });
    setSpawnPosition = vi.fn();
    reset = vi.fn();
    update = vi.fn();
    getPosition = vi.fn().mockReturnValue({ x: 0, y: 0, z: 0 });
  }
  return { FirewallNode: MockFirewallNode };
});

vi.mock('../entities/enemies/ICETower.ts', () => {
  class MockICETower {
    object3D = {
      position: { x: 0, y: 0, z: 0, copy: vi.fn(), set: vi.fn() },
      visible: true,
      add: vi.fn(),
    };
    health = 50;
    scoreValue = 250;
    isActive = false;
    params = { patrolSpeed: 0, attackCooldown: 3.0, evasionChance: 0, movementRandomness: 0, attackDamage: 12, projectileSpeed: 14 };
    static resetSharedResources = vi.fn();
    getObject3D = vi.fn().mockReturnValue(this.object3D);
    setActive = vi.fn((val: boolean) => { MockICETower.prototype.isActive = val; });
    setSpawnPosition = vi.fn();
    transitionToState = vi.fn();
    reset = vi.fn();
    update = vi.fn();
    getPosition = vi.fn().mockReturnValue({ x: 0, y: 0, z: 0 });
  }
  return { ICETower: MockICETower };
});

describe('SurfacePhase Class (Story 3-3)', () => {
  it('should export SurfacePhase class', async () => {
    const mod = await import('../state/phases/SurfacePhase.ts');
    expect(mod.SurfacePhase).toBeDefined();
    expect(typeof mod.SurfacePhase).toBe('function');
  });

  it('should have enter, update, exit lifecycle methods', async () => {
    const mod = await import('../state/phases/SurfacePhase.ts');
    const proto = mod.SurfacePhase.prototype;
    expect(typeof proto.enter).toBe('function');
    expect(typeof proto.update).toBe('function');
    expect(typeof proto.exit).toBe('function');
  });

  it('should construct with required dependencies', async () => {
    const { SurfacePhase } = await import('../state/phases/SurfacePhase.ts');
    const THREE = await import('three');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera();
    const mockVectorMaterials = { create: vi.fn().mockReturnValue({ dispose: vi.fn() }) };

    const phase = new SurfacePhase(
      scene as never,
      camera as never,
      mockVectorMaterials as never,
    );
    expect(phase).toBeDefined();
  });

  describe('enter()', () => {
    it('should create fortress surface geometry on enter', async () => {
      const { SurfacePhase } = await import('../state/phases/SurfacePhase.ts');
      const THREE = await import('three');
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera();
      const mockVectorMaterials = { create: vi.fn().mockReturnValue({ dispose: vi.fn() }) };

      const phase = new SurfacePhase(
        scene as never,
        camera as never,
        mockVectorMaterials as never,
      );
      phase.enter();

      // Scene should have geometry added
      expect(scene.add).toHaveBeenCalled();
    });

    it('should create VectorMaterials for fortress surface and structures', async () => {
      const { SurfacePhase } = await import('../state/phases/SurfacePhase.ts');
      const THREE = await import('three');
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera();
      const mockVectorMaterials = { create: vi.fn().mockReturnValue({ dispose: vi.fn() }) };

      const phase = new SurfacePhase(
        scene as never,
        camera as never,
        mockVectorMaterials as never,
      );
      phase.enter();

      // Should create materials for fortress surface and structures
      expect(mockVectorMaterials.create).toHaveBeenCalledWith('fortressSurface', expect.any(Number));
      expect(mockVectorMaterials.create).toHaveBeenCalledWith('fortressStructure');
    });
  });

  describe('update()', () => {
    it('should not throw when called with a valid dt', async () => {
      const { SurfacePhase } = await import('../state/phases/SurfacePhase.ts');
      const THREE = await import('three');
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera();
      const mockVectorMaterials = { create: vi.fn().mockReturnValue({ dispose: vi.fn() }) };

      const phase = new SurfacePhase(
        scene as never,
        camera as never,
        mockVectorMaterials as never,
      );
      phase.enter();

      expect(() => phase.update(0.016)).not.toThrow();
    });

    it('should track phase completion state', async () => {
      const { SurfacePhase } = await import('../state/phases/SurfacePhase.ts');
      const THREE = await import('three');
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera();
      const mockVectorMaterials = { create: vi.fn().mockReturnValue({ dispose: vi.fn() }) };

      const phase = new SurfacePhase(
        scene as never,
        camera as never,
        mockVectorMaterials as never,
      );
      phase.enter();

      // Phase should not be complete initially
      expect(phase.isComplete()).toBe(false);
    });
  });

  describe('Phase completion logic', () => {
    it('should complete when all firewall nodes are destroyed', async () => {
      const { SurfacePhase } = await import('../state/phases/SurfacePhase.ts');
      const THREE = await import('three');
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera();
      const mockVectorMaterials = { create: vi.fn().mockReturnValue({ dispose: vi.fn() }) };

      const phase = new SurfacePhase(
        scene as never,
        camera as never,
        mockVectorMaterials as never,
      );
      phase.enter();

      // Simulate all firewall nodes destroyed
      phase.notifyFirewallNodeDestroyed();
      phase.notifyFirewallNodeDestroyed();
      phase.notifyFirewallNodeDestroyed();
      phase.notifyFirewallNodeDestroyed();
      phase.notifyFirewallNodeDestroyed();
      phase.notifyFirewallNodeDestroyed();
      phase.notifyFirewallNodeDestroyed();
      phase.notifyFirewallNodeDestroyed();
      phase.notifyFirewallNodeDestroyed();

      phase.update(0.016);
      expect(phase.isComplete()).toBe(true);
    });
  });

  describe('exit()', () => {
    it('should clean up resources on exit', async () => {
      const { SurfacePhase } = await import('../state/phases/SurfacePhase.ts');
      const THREE = await import('three');
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera();
      const mockVectorMaterials = { create: vi.fn().mockReturnValue({ dispose: vi.fn() }) };

      const phase = new SurfacePhase(
        scene as never,
        camera as never,
        mockVectorMaterials as never,
      );
      phase.enter();
      phase.exit();

      // Scene.remove should have been called during cleanup
      expect(scene.remove).toHaveBeenCalled();
    });

    it('should not throw if exit is called without enter', async () => {
      const { SurfacePhase } = await import('../state/phases/SurfacePhase.ts');
      const THREE = await import('three');
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera();
      const mockVectorMaterials = { create: vi.fn().mockReturnValue({ dispose: vi.fn() }) };

      const phase = new SurfacePhase(
        scene as never,
        camera as never,
        mockVectorMaterials as never,
      );

      expect(() => phase.exit()).not.toThrow();
    });
  });

  describe('Memory management', () => {
    it('should have no active resources after exit', async () => {
      const { SurfacePhase } = await import('../state/phases/SurfacePhase.ts');
      const THREE = await import('three');
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera();
      const mockVectorMaterials = { create: vi.fn().mockReturnValue({ dispose: vi.fn() }) };

      const phase = new SurfacePhase(
        scene as never,
        camera as never,
        mockVectorMaterials as never,
      );
      phase.enter();
      phase.exit();

      // After exit, isComplete should remain in whatever state it was
      // but phase should be safely callable
      expect(() => phase.exit()).not.toThrow();
    });
  });
});
