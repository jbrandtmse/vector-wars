import { describe, it, expect, vi } from 'vitest';

// Mock three.js (same pattern as Watchdog.test.ts)
vi.mock('three', () => {
  class MockVector3 {
    x: number; y: number; z: number;
    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
    copy = vi.fn().mockReturnThis();
    set = vi.fn().mockReturnThis();
    add = vi.fn().mockReturnThis();
    setScalar(s: number) { this.x = s; this.y = s; this.z = s; return this; }
  }
  class MockObject3D {
    position = new MockVector3();
    scale = new MockVector3(1, 1, 1);
    visible = true;
    traverse = vi.fn((cb: (child: { layers: { enable: ReturnType<typeof vi.fn> } }) => void) => {
      cb({ layers: { enable: vi.fn() } });
    });
    add = vi.fn();
  }
  class MockSphere {
    center: MockVector3;
    radius: number;
    constructor(center?: MockVector3, radius = 1) {
      this.center = center || new MockVector3();
      this.radius = radius;
    }
  }
  class MockSphereGeometry {
    dispose = vi.fn();
  }
  class MockEdgesGeometry {
    constructor() {}
  }
  class MockLineSegments {
    layers = { enable: vi.fn() };
    constructor() {}
  }
  class MockLineBasicMaterial {}
  return {
    Object3D: MockObject3D,
    Sphere: MockSphere,
    Vector3: MockVector3,
    SphereGeometry: MockSphereGeometry,
    EdgesGeometry: MockEdgesGeometry,
    LineSegments: MockLineSegments,
    LineBasicMaterial: MockLineBasicMaterial,
  };
});

describe('FirewallNode Class (Story 3-3)', () => {
  it('should export FirewallNode class', async () => {
    const mod = await import('../entities/enemies/FirewallNode.ts');
    expect(mod.FirewallNode).toBeDefined();
    expect(typeof mod.FirewallNode).toBe('function');
  });

  it('should have update, takeDamage, reset methods (inherited from Enemy)', async () => {
    const mod = await import('../entities/enemies/FirewallNode.ts');
    const proto = mod.FirewallNode.prototype;
    expect(typeof proto.update).toBe('function');
    expect(typeof proto.takeDamage).toBe('function');
    expect(typeof proto.reset).toBe('function');
  });

  it('should have resetSharedResources as a static method', async () => {
    const mod = await import('../entities/enemies/FirewallNode.ts');
    expect(typeof mod.FirewallNode.resetSharedResources).toBe('function');
  });

  it('should create a FirewallNode with default params', async () => {
    const { FirewallNode } = await import('../entities/enemies/FirewallNode.ts');
    FirewallNode.resetSharedResources();
    const mockVectorMaterials = {
      create: vi.fn().mockReturnValue({}),
    };
    const node = new FirewallNode(mockVectorMaterials as never);
    expect(node).toBeDefined();
  });

  it('should use FIREWALL_NODE_HEALTH and FIREWALL_NODE_SCORE_VALUE defaults', async () => {
    const { FirewallNode } = await import('../entities/enemies/FirewallNode.ts');
    const { FIREWALL_NODE_HEALTH, FIREWALL_NODE_SCORE_VALUE } = await import('../config/constants.ts');
    FirewallNode.resetSharedResources();
    const mockVectorMaterials = { create: vi.fn().mockReturnValue({}) };
    const node = new FirewallNode(mockVectorMaterials as never);
    expect(node.health).toBe(FIREWALL_NODE_HEALTH);
    expect(node.scoreValue).toBe(FIREWALL_NODE_SCORE_VALUE);
  });

  it('should call vectorMaterials.create with firewallNode id', async () => {
    const { FirewallNode } = await import('../entities/enemies/FirewallNode.ts');
    FirewallNode.resetSharedResources();
    const mockVectorMaterials = { create: vi.fn().mockReturnValue({}) };
    new FirewallNode(mockVectorMaterials as never);
    expect(mockVectorMaterials.create).toHaveBeenCalledWith('firewallNode');
  });

  it('should reuse shared geometry across instances', async () => {
    const { FirewallNode } = await import('../entities/enemies/FirewallNode.ts');
    FirewallNode.resetSharedResources();
    const mockVectorMaterials = { create: vi.fn().mockReturnValue({}) };
    new FirewallNode(mockVectorMaterials as never);
    new FirewallNode(mockVectorMaterials as never);
    // create() should only be called once for shared material
    expect(mockVectorMaterials.create).toHaveBeenCalledTimes(1);
  });

  it('should have zero behavior params (stationary target)', async () => {
    const { FirewallNode } = await import('../entities/enemies/FirewallNode.ts');
    FirewallNode.resetSharedResources();
    const mockVectorMaterials = { create: vi.fn().mockReturnValue({}) };
    const node = new FirewallNode(mockVectorMaterials as never);
    expect(node.params.patrolSpeed).toBe(0);
    expect(node.params.attackCooldown).toBe(0);
    expect(node.params.attackDamage).toBe(0);
    expect(node.params.projectileSpeed).toBe(0);
  });

  it('should implement Poolable reset behavior', async () => {
    const { FirewallNode } = await import('../entities/enemies/FirewallNode.ts');
    FirewallNode.resetSharedResources();
    const mockVectorMaterials = { create: vi.fn().mockReturnValue({}) };
    const node = new FirewallNode(mockVectorMaterials as never);
    // Simulate damage
    node.health = 5;
    // Reset should restore to full health
    node.reset();
    expect(node.health).toBe(20);
    expect(node.isActive).toBe(false);
  });
});
