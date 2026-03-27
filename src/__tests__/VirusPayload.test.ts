import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { VirusPayload } from '../entities/projectiles/VirusPayload.ts';
import { VectorMaterials } from '../rendering/VectorMaterials.ts';
import { setActivePalette } from '../rendering/ColorPalette.ts';
import {
  BLOOM_LAYER,
  VIRUS_PAYLOAD_SPEED,
  VIRUS_PAYLOAD_MAX_RANGE,
  VIRUS_PAYLOAD_MAX_LIFETIME,
  VIRUS_PAYLOAD_COLLIDER_RADIUS,
} from '../config/constants.ts';

describe('VirusPayload', () => {
  let vectorMaterials: VectorMaterials;
  let payload: VirusPayload;

  beforeEach(() => {
    setActivePalette('green');
    vectorMaterials = new VectorMaterials();
    payload = new VirusPayload(vectorMaterials, 0);
  });

  describe('Construction', () => {
    it('should create with mesh initially invisible', () => {
      expect(payload.mesh.visible).toBe(false);
    });

    it('should create as inactive', () => {
      expect(payload.active).toBe(false);
    });

    it('should create mesh as Object3D group containing two ring LineSegments', () => {
      // The mesh is an Object3D group with two child LineSegments
      const lineSegmentsChildren = payload.mesh.children.filter(
        (child) => child instanceof THREE.LineSegments
      );
      expect(lineSegmentsChildren.length).toBe(2);
    });

    it('should have bloom layer enabled on both ring LineSegments', () => {
      const bloomTest = new THREE.Layers();
      bloomTest.set(BLOOM_LAYER);
      const lineSegments = payload.mesh.children.filter(
        (child) => child instanceof THREE.LineSegments
      );
      for (const ring of lineSegments) {
        expect(ring.layers.test(bloomTest)).toBe(true);
      }
    });

    it('should create collider with correct radius', () => {
      expect(payload.collider.radius).toBe(VIRUS_PAYLOAD_COLLIDER_RADIUS);
    });

    it('should use shared geometry across instances', () => {
      const payload2 = new VirusPayload(vectorMaterials, 1);
      const rings1 = payload.mesh.children.filter(
        (child) => child instanceof THREE.LineSegments
      ) as THREE.LineSegments[];
      const rings2 = payload2.mesh.children.filter(
        (child) => child instanceof THREE.LineSegments
      ) as THREE.LineSegments[];
      // Both instances should share the same geometry references
      expect(rings1[0].geometry).toBe(rings2[0].geometry);
      expect(rings1[1].geometry).toBe(rings2[1].geometry);
    });
  });

  describe('Activate / Deactivate', () => {
    it('should become visible and active on activate', () => {
      const origin = new THREE.Vector3(1, 2, 3);
      const direction = new THREE.Vector3(0, 0, -1);

      payload.activate(origin, direction);

      expect(payload.active).toBe(true);
      expect(payload.mesh.visible).toBe(true);
      expect(payload.mesh.position.x).toBe(1);
      expect(payload.mesh.position.y).toBe(2);
      expect(payload.mesh.position.z).toBe(3);
    });

    it('should reset lifetime and distance on activate', () => {
      payload.activate(new THREE.Vector3(), new THREE.Vector3(0, 0, -1));
      expect(payload.distance).toBe(0);
      expect(payload.lifetime).toBe(0);
    });

    it('should become invisible and inactive on deactivate', () => {
      payload.activate(new THREE.Vector3(), new THREE.Vector3(0, 0, -1));
      payload.deactivate();

      expect(payload.active).toBe(false);
      expect(payload.mesh.visible).toBe(false);
    });

    it('should reset distance and lifetime on deactivate', () => {
      payload.activate(new THREE.Vector3(), new THREE.Vector3(0, 0, -1));
      payload.update(0.1); // advance some
      payload.deactivate();

      expect(payload.distance).toBe(0);
      expect(payload.lifetime).toBe(0);
    });
  });

  describe('Movement', () => {
    it('should move along direction at VIRUS_PAYLOAD_SPEED', () => {
      payload.activate(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1));
      payload.update(1.0);

      expect(payload.mesh.position.z).toBeCloseTo(-VIRUS_PAYLOAD_SPEED, 1);
    });

    it('should increment distance', () => {
      payload.activate(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1));
      payload.update(0.1);

      expect(payload.distance).toBeCloseTo(VIRUS_PAYLOAD_SPEED * 0.1, 3);
    });

    it('should increment lifetime', () => {
      payload.activate(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1));
      payload.update(0.5);

      expect(payload.lifetime).toBeCloseTo(0.5, 3);
    });

    it('should not move when inactive', () => {
      // Don't activate
      payload.update(1.0);
      expect(payload.mesh.position.z).toBe(0);
    });
  });

  describe('Spin animation', () => {
    it('should spin the mesh group on Z axis during update', () => {
      payload.activate(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1));
      const initialRotZ = payload.mesh.rotation.z;
      payload.update(0.5);

      expect(payload.mesh.rotation.z).toBeGreaterThan(initialRotZ);
    });
  });

  describe('Collider sync', () => {
    it('should sync collider center to mesh position during update', () => {
      payload.activate(new THREE.Vector3(5, 10, 15), new THREE.Vector3(0, 0, -1));
      payload.update(0.016);

      expect(payload.collider.center.x).toBeCloseTo(payload.mesh.position.x, 3);
      expect(payload.collider.center.y).toBeCloseTo(payload.mesh.position.y, 3);
      expect(payload.collider.center.z).toBeCloseTo(payload.mesh.position.z, 3);
    });
  });

  describe('Deactivation conditions', () => {
    it('should deactivate when lifetime exceeds VIRUS_PAYLOAD_MAX_LIFETIME', () => {
      payload.activate(new THREE.Vector3(), new THREE.Vector3(0, 0, -1));

      const dt = VIRUS_PAYLOAD_MAX_LIFETIME + 0.1;
      payload.update(dt);

      expect(payload.active).toBe(false);
    });

    it('should deactivate when distance exceeds VIRUS_PAYLOAD_MAX_RANGE', () => {
      payload.activate(new THREE.Vector3(), new THREE.Vector3(0, 0, -1));

      // Move far enough to exceed range
      const updatesNeeded = Math.ceil(VIRUS_PAYLOAD_MAX_RANGE / (VIRUS_PAYLOAD_SPEED * 0.5)) + 2;
      for (let i = 0; i < updatesNeeded; i++) {
        payload.update(0.5);
        if (!payload.active) break;
      }

      expect(payload.active).toBe(false);
    });
  });
});
