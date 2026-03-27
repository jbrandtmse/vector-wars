import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { Boss } from '../entities/bosses/Boss.ts';
import { eventBus } from '../core/GameEvents.ts';

/**
 * ConcreteBoss — Minimal concrete implementation of abstract Boss for testing.
 */
class ConcreteBoss extends Boss {
  public onHitCalled = false;
  public onDefeatedCalled = false;
  public lastDt = 0;

  constructor(maxHealth: number, scoreValue: number, colliderRadius: number) {
    super(maxHealth, scoreValue, colliderRadius);
  }

  onHit(): void {
    this.onHitCalled = true;
  }

  onDefeated(): void {
    this.onDefeatedCalled = true;
  }

  updateBoss(dt: number): void {
    this.lastDt = dt;
  }
}

describe('Boss', () => {
  let boss: ConcreteBoss;

  beforeEach(() => {
    boss = new ConcreteBoss(500, 5000, 6.0);
  });

  describe('Construction', () => {
    it('should set health to maxHealth', () => {
      expect(boss.health).toBe(500);
    });

    it('should set maxHealth', () => {
      expect(boss.maxHealth).toBe(500);
    });

    it('should set scoreValue', () => {
      expect(boss.scoreValue).toBe(5000);
    });

    it('should start as not vulnerable', () => {
      expect(boss.vulnerable).toBe(false);
    });

    it('should start as not defeated', () => {
      expect(boss.defeated).toBe(false);
    });

    it('should set collider radius', () => {
      expect(boss.getCollider().radius).toBe(6.0);
    });

    it('should have an Object3D', () => {
      expect(boss.getObject3D()).toBeInstanceOf(THREE.Object3D);
    });
  });

  describe('getHealthFraction', () => {
    it('should return 1.0 at full health', () => {
      expect(boss.getHealthFraction()).toBe(1.0);
    });

    it('should return correct fraction after damage', () => {
      boss.takeDamage(250);
      expect(boss.getHealthFraction()).toBe(0.5);
    });

    it('should return 0 when health is 0', () => {
      boss.takeDamage(500);
      expect(boss.getHealthFraction()).toBe(0);
    });
  });

  describe('takeDamage', () => {
    it('should reduce health by damage amount', () => {
      boss.takeDamage(100);
      expect(boss.health).toBe(400);
    });

    it('should call onHit', () => {
      boss.takeDamage(10);
      expect(boss.onHitCalled).toBe(true);
    });

    it('should emit bossHealthChanged event', () => {
      const handler = vi.fn();
      eventBus.on('bossHealthChanged', handler);

      boss.takeDamage(50);

      expect(handler).toHaveBeenCalledWith({
        health: 450,
        maxHealth: 500,
      });

      eventBus.off('bossHealthChanged', handler);
    });

    it('should call onDefeated when health reaches 0', () => {
      boss.takeDamage(500);
      expect(boss.onDefeatedCalled).toBe(true);
    });

    it('should set defeated flag when health reaches 0', () => {
      boss.takeDamage(500);
      expect(boss.defeated).toBe(true);
    });

    it('should not call onDefeated if already defeated', () => {
      boss.takeDamage(500);
      boss.onDefeatedCalled = false;
      boss.takeDamage(100);
      expect(boss.onDefeatedCalled).toBe(false);
    });

    it('should clamp health at 0 (not go negative)', () => {
      boss.takeDamage(600);
      expect(boss.health).toBe(0);
    });
  });

  describe('update', () => {
    it('should call updateBoss when not defeated', () => {
      boss.update(0.016);
      expect(boss.lastDt).toBe(0.016);
    });

    it('should NOT call updateBoss when defeated', () => {
      boss.takeDamage(500);
      boss.lastDt = 0;
      boss.update(0.016);
      expect(boss.lastDt).toBe(0);
    });

    it('should sync collider position', () => {
      boss.getObject3D().position.set(10, 20, 30);
      boss.update(0.016);
      expect(boss.getCollider().center.x).toBe(10);
      expect(boss.getCollider().center.y).toBe(20);
      expect(boss.getCollider().center.z).toBe(30);
    });
  });

  describe('duck-typing compatibility', () => {
    it('should have takeDamage method for CollisionSystem compatibility', () => {
      expect('takeDamage' in boss).toBe(true);
    });

    it('should NOT have applyStun method (bosses are not stunnable)', () => {
      expect('applyStun' in boss).toBe(false);
    });
  });
});
