import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { Enemy } from '../entities/enemies/Enemy.ts';
import {
  EMP_BURST_SLOW_FACTOR,
  EMP_BURST_STUN_PULSE_RATE,
} from '../config/constants.ts';
import type { BehaviorParams } from '../ai/BehaviorParams.ts';
import type { AIState } from '../ai/AIState.ts';

// Concrete test subclass of abstract Enemy
class TestEnemy extends Enemy {
  constructor(params: BehaviorParams) {
    super(30, 100, params, 1.5);
    // Create minimal object3D geometry so the enemy is valid
    this.object3D.position.set(0, 0, 0);
  }
}

const defaultParams: BehaviorParams = {
  patrolSpeed: 1.0,
  attackCooldown: 2.0,
  evasionChance: 0.0,
  movementRandomness: 0.0,
  attackDamage: 10,
  projectileSpeed: 15,
};

describe('Enemy Stun Mechanics', () => {
  let enemy: TestEnemy;

  beforeEach(() => {
    enemy = new TestEnemy({ ...defaultParams });
    // Give the enemy a mock state so update() doesn't crash
    const mockState: AIState = {
      enter: vi.fn(),
      update: vi.fn(),
      exit: vi.fn(),
    };
    enemy.transitionToState(mockState);
  });

  describe('applyStun()', () => {
    it('should set stun timer and make isStunned return true', () => {
      enemy.applyStun(3.0);
      expect(enemy.isStunned).toBe(true);
    });

    it('should not stack — reapplying resets timer', () => {
      enemy.applyStun(3.0);
      // Advance time by 1 second
      enemy.update(1.0);
      expect(enemy.isStunned).toBe(true);
      // Reapply stun
      enemy.applyStun(3.0);
      // After 2.5 seconds total from reapply, should still be stunned
      enemy.update(2.5);
      expect(enemy.isStunned).toBe(true);
    });
  });

  describe('isStunned', () => {
    it('should return false when not stunned', () => {
      expect(enemy.isStunned).toBe(false);
    });

    it('should return true when stun timer > 0', () => {
      enemy.applyStun(1.0);
      expect(enemy.isStunned).toBe(true);
    });

    it('should return false when stun timer has expired', () => {
      enemy.applyStun(1.0);
      enemy.update(1.5); // Advance past stun duration
      expect(enemy.isStunned).toBe(false);
    });
  });

  describe('getEffectiveParams()', () => {
    it('should return normal params when not stunned', () => {
      const effective = enemy.getEffectiveParams();
      expect(effective).toBe(enemy.params);
    });

    it('should return slowed params when stunned', () => {
      enemy.applyStun(3.0);
      const effective = enemy.getEffectiveParams();
      expect(effective.patrolSpeed).toBeCloseTo(defaultParams.patrolSpeed * EMP_BURST_SLOW_FACTOR);
      expect(effective.projectileSpeed).toBeCloseTo(defaultParams.projectileSpeed * EMP_BURST_SLOW_FACTOR);
    });

    it('should slow attackCooldown by inverse factor when stunned', () => {
      enemy.applyStun(3.0);
      const effective = enemy.getEffectiveParams();
      expect(effective.attackCooldown).toBeCloseTo(defaultParams.attackCooldown / EMP_BURST_SLOW_FACTOR);
    });

    it('should NOT modify attackDamage when stunned', () => {
      enemy.applyStun(3.0);
      const effective = enemy.getEffectiveParams();
      expect(effective.attackDamage).toBe(defaultParams.attackDamage);
    });

    it('should NOT modify evasionChance when stunned', () => {
      enemy.applyStun(3.0);
      const effective = enemy.getEffectiveParams();
      expect(effective.evasionChance).toBe(defaultParams.evasionChance);
    });

    it('should NOT modify movementRandomness when stunned', () => {
      enemy.applyStun(3.0);
      const effective = enemy.getEffectiveParams();
      expect(effective.movementRandomness).toBe(defaultParams.movementRandomness);
    });
  });

  describe('Stun timer', () => {
    it('should decrement with update(dt)', () => {
      enemy.applyStun(3.0);
      enemy.update(1.0);
      expect(enemy.isStunned).toBe(true);
      enemy.update(1.0);
      expect(enemy.isStunned).toBe(true);
      enemy.update(1.5); // Past 3.0 seconds total
      expect(enemy.isStunned).toBe(false);
    });

    it('should not go below zero', () => {
      enemy.applyStun(0.5);
      enemy.update(5.0); // Way past stun duration
      expect(enemy.isStunned).toBe(false);
    });
  });

  describe('Visual pulse oscillation during stun', () => {
    it('should oscillate scale between 0.8 and 1.2 while stunned', () => {
      enemy.applyStun(3.0);
      // Capture several scale values during stun
      const scales: number[] = [];
      for (let i = 0; i < 30; i++) {
        enemy.update(0.016);
        scales.push(enemy.getObject3D().scale.x);
      }
      // Check that scale varies (not constant)
      const uniqueScales = new Set(scales.map(s => s.toFixed(3)));
      expect(uniqueScales.size).toBeGreaterThan(1);
      // All scales should be between 0.8 and 1.2 (with floating point tolerance)
      for (const s of scales) {
        expect(s).toBeGreaterThanOrEqual(0.79);
        expect(s).toBeLessThanOrEqual(1.21);
      }
    });

    it('should reset scale to 1.0 after stun expires', () => {
      enemy.applyStun(0.5);
      enemy.update(1.0); // Past stun duration
      expect(enemy.getObject3D().scale.x).toBeCloseTo(1.0);
    });
  });

  describe('reset()', () => {
    it('should clear stun state', () => {
      enemy.applyStun(3.0);
      expect(enemy.isStunned).toBe(true);
      enemy.reset();
      expect(enemy.isStunned).toBe(false);
    });
  });
});
