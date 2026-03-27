import { describe, it, expect } from 'vitest';
import { RailMovement } from '../systems/RailMovement.ts';

describe('RailMovement', () => {
  describe('Module exports', () => {
    it('should export a RailMovement class', () => {
      expect(RailMovement).toBeDefined();
      expect(typeof RailMovement).toBe('function');
    });

    it('should have an update method on the prototype', () => {
      expect(typeof RailMovement.prototype.update).toBe('function');
    });

    it('should have a getRailProgress method on the prototype', () => {
      expect(typeof RailMovement.prototype.getRailProgress).toBe('function');
    });

    it('should have a getRailPosition method on the prototype', () => {
      expect(typeof RailMovement.prototype.getRailPosition).toBe('function');
    });
  });

  describe('Construction', () => {
    it('should construct with a THREE.PerspectiveCamera', () => {
      // Use dynamic import to create a camera for construction test
      const THREE = require('three');
      const camera = new THREE.PerspectiveCamera(70, 16 / 9, 0.01, 1000);
      const rail = new RailMovement(camera);
      expect(rail).toBeInstanceOf(RailMovement);
    });

    it('should start with progress at 0', () => {
      const THREE = require('three');
      const camera = new THREE.PerspectiveCamera(70, 16 / 9, 0.01, 1000);
      const rail = new RailMovement(camera);
      expect(rail.getRailProgress()).toBe(0);
    });
  });

  describe('update() progress advancement', () => {
    it('should advance progress when update is called with positive dt', () => {
      const THREE = require('three');
      const camera = new THREE.PerspectiveCamera(70, 16 / 9, 0.01, 1000);
      const rail = new RailMovement(camera);

      rail.update(1.0, { x: 0, y: 0 });
      expect(rail.getRailProgress()).toBeGreaterThan(0);
    });

    it('should not advance progress when dt is 0', () => {
      const THREE = require('three');
      const camera = new THREE.PerspectiveCamera(70, 16 / 9, 0.01, 1000);
      const rail = new RailMovement(camera);

      rail.update(0, { x: 0, y: 0 });
      expect(rail.getRailProgress()).toBe(0);
    });

    it('should wrap progress when it exceeds 1.0', () => {
      const THREE = require('three');
      const camera = new THREE.PerspectiveCamera(70, 16 / 9, 0.01, 1000);
      const rail = new RailMovement(camera);

      // Update with a very large dt to push progress past 1.0
      for (let i = 0; i < 100; i++) {
        rail.update(1.0, { x: 0, y: 0 });
      }
      const progress = rail.getRailProgress();
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThan(1);
    });
  });

  describe('getRailPosition()', () => {
    it('should return a Vector3 representing current world position', () => {
      const THREE = require('three');
      const camera = new THREE.PerspectiveCamera(70, 16 / 9, 0.01, 1000);
      const rail = new RailMovement(camera);

      const pos = rail.getRailPosition();
      expect(pos).toBeDefined();
      expect(typeof pos.x).toBe('number');
      expect(typeof pos.y).toBe('number');
      expect(typeof pos.z).toBe('number');
    });

    it('should return a copy (not a reference to internal state)', () => {
      const THREE = require('three');
      const camera = new THREE.PerspectiveCamera(70, 16 / 9, 0.01, 1000);
      const rail = new RailMovement(camera);

      const pos1 = rail.getRailPosition();
      const pos2 = rail.getRailPosition();
      expect(pos1).not.toBe(pos2);
    });
  });

  describe('Camera positioning', () => {
    it('should update camera position on the rail path', () => {
      const THREE = require('three');
      const camera = new THREE.PerspectiveCamera(70, 16 / 9, 0.01, 1000);
      camera.position.set(0, 0, 0);
      const rail = new RailMovement(camera);

      rail.update(0.5, { x: 0, y: 0 });

      // Camera should have moved from origin
      const dist = camera.position.length();
      expect(dist).toBeGreaterThan(0);
    });

    it('should have a getCurrentDirection method on the prototype', () => {
      expect(typeof RailMovement.prototype.getCurrentDirection).toBe('function');
    });
  });

  describe('getCurrentDirection()', () => {
    it('should return a Vector3 representing current rail tangent', () => {
      const THREE = require('three');
      const camera = new THREE.PerspectiveCamera(70, 16 / 9, 0.01, 1000);
      const rail = new RailMovement(camera);

      const dir = rail.getCurrentDirection();
      expect(dir).toBeDefined();
      expect(typeof dir.x).toBe('number');
      expect(typeof dir.y).toBe('number');
      expect(typeof dir.z).toBe('number');
    });

    it('should return a roughly unit-length direction vector', () => {
      const THREE = require('three');
      const camera = new THREE.PerspectiveCamera(70, 16 / 9, 0.01, 1000);
      const rail = new RailMovement(camera);

      rail.update(0.5, { x: 0, y: 0 });
      const dir = rail.getCurrentDirection();
      const length = Math.sqrt(dir.x * dir.x + dir.y * dir.y + dir.z * dir.z);
      expect(length).toBeCloseTo(1.0, 1);
    });

    it('should write into optional target vector when provided', () => {
      const THREE = require('three');
      const camera = new THREE.PerspectiveCamera(70, 16 / 9, 0.01, 1000);
      const rail = new RailMovement(camera);

      const target = new THREE.Vector3();
      const result = rail.getCurrentDirection(target);
      expect(result).toBe(target);
    });
  });

  describe('Camera positioning (continued)', () => {
    it('should apply viewport offset relative to rail frame', () => {
      const THREE = require('three');
      const camera = new THREE.PerspectiveCamera(70, 16 / 9, 0.01, 1000);
      const rail = new RailMovement(camera);

      // Update once with zero offset
      rail.update(0.5, { x: 0, y: 0 });
      const posNoOffset = camera.position.clone();

      // Reset and update with offset
      const rail2 = new RailMovement(camera);
      rail2.update(0.5, { x: 2, y: 0 });
      const posWithOffset = camera.position.clone();

      // Positions should differ due to viewport offset
      expect(posWithOffset.distanceTo(posNoOffset)).toBeGreaterThan(0);
    });
  });
});
