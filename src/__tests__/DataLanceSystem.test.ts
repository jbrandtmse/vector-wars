import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { DataLanceSystem } from '../systems/DataLanceSystem.ts';
import { VectorMaterials } from '../rendering/VectorMaterials.ts';
import { CockpitRenderer } from '../rendering/CockpitRenderer.ts';
import { setActivePalette } from '../rendering/ColorPalette.ts';
import {
  BLOOM_LAYER,
  DATA_LANCE_BOLT_SPEED,
  DATA_LANCE_FIRE_RATE,
  DATA_LANCE_MAX_RANGE,
  DATA_LANCE_POOL_SIZE,
} from '../config/constants.ts';
import type { InputManager } from '../core/InputManager.ts';

describe('DataLanceSystem', () => {
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let vectorMaterials: VectorMaterials;
  let cockpitRenderer: CockpitRenderer;
  let mockIsActive: ReturnType<typeof vi.fn>;
  let inputManager: InputManager;
  let system: DataLanceSystem;

  /** Set whether the 'fire' action is active */
  function setFireActive(active: boolean): void {
    mockIsActive.mockImplementation((action: string) => {
      if (action === 'fire') return active;
      return false;
    });
  }

  beforeEach(() => {
    setActivePalette('green');
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, 16 / 9, 0.01, 1000);
    camera.position.set(0, 0, 3);
    scene.add(camera);
    vectorMaterials = new VectorMaterials();
    cockpitRenderer = new CockpitRenderer(camera, vectorMaterials);

    // Create mock InputManager with controllable fire state
    mockIsActive = vi.fn().mockReturnValue(false);
    inputManager = {
      isActive: mockIsActive,
      dispose: vi.fn(),
    } as unknown as InputManager;

    system = new DataLanceSystem(scene, camera, inputManager, vectorMaterials, cockpitRenderer);
  });

  describe('Pool initialization', () => {
    it('should pre-allocate bolt meshes in the scene', () => {
      const lineSegments = scene.children.filter(
        (child) => child instanceof THREE.LineSegments
      );
      expect(lineSegments.length).toBe(DATA_LANCE_POOL_SIZE);
    });

    it('should create bolt meshes with bloom layer enabled', () => {
      const bloomTest = new THREE.Layers();
      bloomTest.set(BLOOM_LAYER);
      const lineSegments = scene.children.filter(
        (child) => child instanceof THREE.LineSegments
      );
      for (const seg of lineSegments) {
        expect(seg.layers.test(bloomTest)).toBe(true);
      }
    });

    it('should create all bolt meshes as invisible initially', () => {
      const lineSegments = scene.children.filter(
        (child) => child instanceof THREE.LineSegments
      );
      for (const seg of lineSegments) {
        expect(seg.visible).toBe(false);
      }
    });
  });

  describe('Firing bolts', () => {
    it('should spawn a visible bolt at camera position when fire is active', () => {
      setFireActive(true);
      system.update(0.016);

      const visibleBolts = scene.children.filter(
        (child) => child instanceof THREE.LineSegments && child.visible
      );
      expect(visibleBolts.length).toBe(1);
    });

    it('should not fire when spacebar is not pressed', () => {
      // Fire is already false by default
      system.update(0.016);

      const visibleBolts = scene.children.filter(
        (child) => child instanceof THREE.LineSegments && child.visible
      );
      expect(visibleBolts.length).toBe(0);
    });

    it('should fire rate limit prevents shots faster than DATA_LANCE_FIRE_RATE', () => {
      setFireActive(true);

      // First shot fires immediately
      system.update(0.016);
      // Second shot within cooldown should NOT fire
      system.update(0.016);

      const visibleBolts = scene.children.filter(
        (child) => child instanceof THREE.LineSegments && child.visible
      );
      expect(visibleBolts.length).toBe(1);
    });

    it('should allow firing after cooldown has elapsed', () => {
      setFireActive(true);

      // First shot
      system.update(0.016);
      // Wait for cooldown to expire
      system.update(DATA_LANCE_FIRE_RATE + 0.001);

      const visibleBolts = scene.children.filter(
        (child) => child instanceof THREE.LineSegments && child.visible
      );
      expect(visibleBolts.length).toBe(2);
    });

    it('should support multiple bolts active simultaneously', () => {
      setFireActive(true);

      // Fire multiple bolts with enough time between
      system.update(0.016);
      system.update(DATA_LANCE_FIRE_RATE + 0.001);
      system.update(DATA_LANCE_FIRE_RATE + 0.001);

      const visibleBolts = scene.children.filter(
        (child) => child instanceof THREE.LineSegments && child.visible
      );
      expect(visibleBolts.length).toBe(3);
    });
  });

  describe('Bolt movement', () => {
    it('should move bolt forward by speed * dt each update', () => {
      setFireActive(true);

      // Fire a bolt with a tiny dt
      system.update(0.001);

      const bolt = scene.children.find(
        (child) => child instanceof THREE.LineSegments && child.visible
      ) as THREE.LineSegments;
      const initialPos = bolt.position.clone();

      // Switch to no-fire and update with known dt
      setFireActive(false);
      const dt = 0.1;
      system.update(dt);

      // Bolt should have moved approximately DATA_LANCE_BOLT_SPEED * dt units
      const distance = bolt.position.distanceTo(initialPos);
      expect(distance).toBeCloseTo(DATA_LANCE_BOLT_SPEED * dt, 1);
    });
  });

  describe('Bolt deactivation', () => {
    it('should deactivate bolt when distance exceeds DATA_LANCE_MAX_RANGE', () => {
      setFireActive(true);

      // Fire a bolt
      system.update(0.001);

      // Stop firing
      setFireActive(false);

      // Move bolt beyond max range
      const updatesNeeded = Math.ceil(DATA_LANCE_MAX_RANGE / (DATA_LANCE_BOLT_SPEED * 0.1)) + 1;
      for (let i = 0; i < updatesNeeded; i++) {
        system.update(0.1);
      }

      const visibleBolts = scene.children.filter(
        (child) => child instanceof THREE.LineSegments && child.visible
      );
      expect(visibleBolts.length).toBe(0);
    });

    it('should recycle deactivated bolt for next fire', () => {
      setFireActive(true);

      // Fire a bolt
      system.update(0.001);

      // Stop firing
      setFireActive(false);

      // Move bolt beyond max range to deactivate it
      const updatesNeeded = Math.ceil(DATA_LANCE_MAX_RANGE / (DATA_LANCE_BOLT_SPEED * 0.5)) + 1;
      for (let i = 0; i < updatesNeeded; i++) {
        system.update(0.5);
      }

      // Verify bolt is deactivated
      const visibleBefore = scene.children.filter(
        (child) => child instanceof THREE.LineSegments && child.visible
      );
      expect(visibleBefore.length).toBe(0);

      // Fire again — should reuse the deactivated bolt
      setFireActive(true);
      system.update(DATA_LANCE_FIRE_RATE + 0.001);

      const visibleAfter = scene.children.filter(
        (child) => child instanceof THREE.LineSegments && child.visible
      );
      expect(visibleAfter.length).toBe(1);
    });
  });

  describe('Pool exhaustion', () => {
    it('should handle pool exhaustion gracefully (no crash)', () => {
      setFireActive(true);

      // Try to fire more bolts than pool size allows
      for (let i = 0; i < DATA_LANCE_POOL_SIZE + 5; i++) {
        system.update(DATA_LANCE_FIRE_RATE + 0.001);
      }

      // Should not throw and visible bolts should not exceed pool size
      const visibleBolts = scene.children.filter(
        (child) => child instanceof THREE.LineSegments && child.visible
      );
      expect(visibleBolts.length).toBeLessThanOrEqual(DATA_LANCE_POOL_SIZE);
    });
  });

  describe('Recoil integration', () => {
    it('should trigger cockpit recoil when firing', () => {
      const recoilSpy = vi.spyOn(cockpitRenderer, 'recoilArms');
      setFireActive(true);

      system.update(0.016);

      expect(recoilSpy).toHaveBeenCalledWith(1.0);
    });
  });

  describe('Dispose', () => {
    it('should remove all bolt meshes from scene on dispose', () => {
      const lineSegmentsBefore = scene.children.filter(
        (child) => child instanceof THREE.LineSegments
      );
      expect(lineSegmentsBefore.length).toBe(DATA_LANCE_POOL_SIZE);

      system.dispose();

      const lineSegmentsAfter = scene.children.filter(
        (child) => child instanceof THREE.LineSegments
      );
      expect(lineSegmentsAfter.length).toBe(0);
    });
  });
});
