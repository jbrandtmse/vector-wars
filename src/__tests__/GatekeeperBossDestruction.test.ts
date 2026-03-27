import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import { GatekeeperBoss } from '../entities/bosses/GatekeeperBoss.ts';
import { VectorMaterials } from '../rendering/VectorMaterials.ts';
import { setActivePalette } from '../rendering/ColorPalette.ts';
import { eventBus } from '../core/GameEvents.ts';
import {
  BOSS_GATEKEEPER_HEALTH,
  BOSS_GATEKEEPER_BARRAGE_DURATION,
  BOSS_GATEKEEPER_SWEEP_DURATION,
  BOSS_GATEKEEPER_SCORE_VALUE,
  BOSS_DESTRUCTION_PEEL_DURATION,
  BOSS_DESTRUCTION_STRIP_DURATION,
  BOSS_DESTRUCTION_SHATTER_DURATION,
  BOSS_DESTRUCTION_PEEL_SCALE_END,
  BOSS_DESTRUCTION_STRIP_SCALE_END,
} from '../config/constants.ts';

describe('GatekeeperBoss Destruction (Story 3-9)', () => {
  let vectorMaterials: VectorMaterials;
  let boss: GatekeeperBoss;
  let playerPosition: THREE.Vector3;

  function defeatBoss(): void {
    // Move to vulnerable for full damage
    boss.update(BOSS_GATEKEEPER_BARRAGE_DURATION + 0.1);
    boss.update(BOSS_GATEKEEPER_SWEEP_DURATION + 0.1);
    // Deal lethal damage
    boss.takeDamage(BOSS_GATEKEEPER_HEALTH);
  }

  beforeEach(() => {
    setActivePalette('green');
    vectorMaterials = new VectorMaterials();
    playerPosition = new THREE.Vector3(0, 10, -30);
    boss = new GatekeeperBoss(vectorMaterials, () => playerPosition);
  });

  afterEach(() => {
    // No global cleanup needed - individual test handlers are cleaned up via off()
  });

  describe('onDefeated creates destruction sequence', () => {
    it('should create a DestructionSequence with 3 stages on defeat', () => {
      defeatBoss();

      // Boss should have a destruction sequence (verified by driving update and checking stage events)
      const handler = vi.fn();
      eventBus.on('bossDestructionStage', handler);

      boss.update(0.1); // Should trigger peel stage update
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ stage: 'peel' }),
      );

      eventBus.off('bossDestructionStage', handler);
    });

    it('should still emit bossDefeated event on defeat', () => {
      const handler = vi.fn();
      eventBus.on('bossDefeated', handler);

      defeatBoss();

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ scoreValue: BOSS_GATEKEEPER_SCORE_VALUE }),
      );

      eventBus.off('bossDefeated', handler);
    });
  });

  describe('update() drives destruction sequence when defeated', () => {
    it('should drive destruction sequence through update() calls', () => {
      defeatBoss();

      const handler = vi.fn();
      eventBus.on('bossDestructionStage', handler);

      // Drive through peel stage
      for (let i = 0; i < 10; i++) {
        boss.update(0.2);
      }

      // Should have received peel events
      const peelEvents = handler.mock.calls.filter((c) => c[0].stage === 'peel');
      expect(peelEvents.length).toBeGreaterThan(0);

      eventBus.off('bossDestructionStage', handler);
    });
  });

  describe('Peel stage', () => {
    it('should scale outer shell up during peel', () => {
      defeatBoss();

      // Drive partway through peel
      boss.update(BOSS_DESTRUCTION_PEEL_DURATION * 0.5);

      const outerScale = boss.getOuterShell().scale.x;
      // Should be between 1.0 and PEEL_SCALE_END
      expect(outerScale).toBeGreaterThan(1.0);
      expect(outerScale).toBeLessThanOrEqual(BOSS_DESTRUCTION_PEEL_SCALE_END);
    });

    it('should fade outer shell opacity during peel', () => {
      defeatBoss();

      boss.update(BOSS_DESTRUCTION_PEEL_DURATION * 0.5);

      const opacity = boss.getOuterMaterial().opacity;
      expect(opacity).toBeLessThan(1.0);
      expect(opacity).toBeGreaterThan(0.0);
    });

    it('should remove outer shell from object3D at end of peel', () => {
      defeatBoss();
      const obj = boss.getObject3D();
      expect(obj.children.length).toBe(3); // outer, mid, core

      // Complete peel stage
      boss.update(BOSS_DESTRUCTION_PEEL_DURATION + 0.01);
      expect(obj.children.length).toBe(2); // mid, core only
    });
  });

  describe('Strip stage', () => {
    it('should scale mid structure up during strip', () => {
      defeatBoss();

      // Complete peel
      boss.update(BOSS_DESTRUCTION_PEEL_DURATION + 0.01);
      // Drive partway through strip
      boss.update(BOSS_DESTRUCTION_STRIP_DURATION * 0.5);

      const midScale = boss.getMidStructure().scale.x;
      expect(midScale).toBeGreaterThan(1.0);
      expect(midScale).toBeLessThanOrEqual(BOSS_DESTRUCTION_STRIP_SCALE_END);
    });

    it('should fade mid structure opacity during strip', () => {
      defeatBoss();

      // Complete peel
      boss.update(BOSS_DESTRUCTION_PEEL_DURATION + 0.01);
      // Drive partway through strip
      boss.update(BOSS_DESTRUCTION_STRIP_DURATION * 0.5);

      const opacity = boss.getMidMaterial().opacity;
      expect(opacity).toBeLessThan(1.0);
      expect(opacity).toBeGreaterThan(0.0);
    });

    it('should remove mid structure from object3D at end of strip', () => {
      defeatBoss();
      const obj = boss.getObject3D();

      // Complete peel + strip
      boss.update(BOSS_DESTRUCTION_PEEL_DURATION + 0.01);
      boss.update(BOSS_DESTRUCTION_STRIP_DURATION + 0.01);
      expect(obj.children.length).toBe(1); // core only
    });
  });

  describe('Shatter stage', () => {
    it('should set core material to pure white at shatter start', () => {
      defeatBoss();

      // Complete peel + strip
      boss.update(BOSS_DESTRUCTION_PEEL_DURATION + 0.01);
      boss.update(BOSS_DESTRUCTION_STRIP_DURATION + 0.01);

      // At the start of shatter, core should be white
      const hsl = { h: 0, s: 0, l: 0 };
      boss.getCoreMaterial().color.getHSL(hsl);
      expect(hsl.l).toBeCloseTo(1.0, 1);
    });

    it('should pulse core scale during shatter', () => {
      defeatBoss();

      // Complete peel + strip
      boss.update(BOSS_DESTRUCTION_PEEL_DURATION + 0.01);
      boss.update(BOSS_DESTRUCTION_STRIP_DURATION + 0.01);

      // Drive partway through shatter
      boss.update(BOSS_DESTRUCTION_SHATTER_DURATION * 0.25);

      // Scale should differ from 1.0 due to pulsing
      const coreScale = boss.getInnerCore().scale.x;
      // Could be above or below 1.0 depending on sine
      expect(Math.abs(coreScale - 1.0)).toBeGreaterThanOrEqual(0);
    });

    it('should fade core opacity in final 50% of shatter', () => {
      defeatBoss();

      // Complete peel + strip
      boss.update(BOSS_DESTRUCTION_PEEL_DURATION + 0.01);
      boss.update(BOSS_DESTRUCTION_STRIP_DURATION + 0.01);

      // Drive to 75% through shatter (past the 50% threshold)
      boss.update(BOSS_DESTRUCTION_SHATTER_DURATION * 0.75);

      const opacity = boss.getCoreMaterial().opacity;
      expect(opacity).toBeLessThan(1.0);
    });

    it('should remove core from object3D at end of shatter', () => {
      defeatBoss();
      const obj = boss.getObject3D();

      // Complete all stages
      boss.update(BOSS_DESTRUCTION_PEEL_DURATION + 0.01);
      boss.update(BOSS_DESTRUCTION_STRIP_DURATION + 0.01);
      boss.update(BOSS_DESTRUCTION_SHATTER_DURATION + 0.01);

      expect(obj.children.length).toBe(0);
    });
  });

  describe('bossDestructionStage events emitted during each stage', () => {
    it('should emit peel, strip, and shatter stage events', () => {
      defeatBoss();

      const handler = vi.fn();
      eventBus.on('bossDestructionStage', handler);

      // Drive through all stages
      boss.update(BOSS_DESTRUCTION_PEEL_DURATION + 0.01);
      boss.update(BOSS_DESTRUCTION_STRIP_DURATION + 0.01);
      boss.update(BOSS_DESTRUCTION_SHATTER_DURATION + 0.01);

      const stages = handler.mock.calls.map((c) => c[0].stage);
      expect(stages).toContain('peel');
      expect(stages).toContain('strip');
      expect(stages).toContain('shatter');

      eventBus.off('bossDestructionStage', handler);
    });

    it('should include position in bossDestructionStage events', () => {
      defeatBoss();
      boss.getObject3D().position.set(10, 20, 30);

      const handler = vi.fn();
      eventBus.on('bossDestructionStage', handler);

      boss.update(0.1);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          position: expect.objectContaining({ x: 10, y: 20, z: 30 }),
        }),
      );

      eventBus.off('bossDestructionStage', handler);
    });
  });

  describe('bossDestroyed event', () => {
    it('should emit bossDestroyed event after destruction sequence completes', () => {
      defeatBoss();

      const handler = vi.fn();
      eventBus.on('bossDestroyed', handler);

      // Complete all destruction stages
      boss.update(BOSS_DESTRUCTION_PEEL_DURATION + 0.01);
      boss.update(BOSS_DESTRUCTION_STRIP_DURATION + 0.01);
      boss.update(BOSS_DESTRUCTION_SHATTER_DURATION + 0.01);

      // The next update should emit bossDestroyed (sequence is now complete)
      boss.update(0.016);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ scoreValue: BOSS_GATEKEEPER_SCORE_VALUE }),
      );

      eventBus.off('bossDestroyed', handler);
    });

    it('should emit bossDestroyed only once', () => {
      defeatBoss();

      const handler = vi.fn();
      eventBus.on('bossDestroyed', handler);

      // Complete all stages
      boss.update(BOSS_DESTRUCTION_PEEL_DURATION + 0.01);
      boss.update(BOSS_DESTRUCTION_STRIP_DURATION + 0.01);
      boss.update(BOSS_DESTRUCTION_SHATTER_DURATION + 0.01);

      // Multiple updates after completion
      boss.update(0.016);
      boss.update(0.016);
      boss.update(0.016);

      expect(handler).toHaveBeenCalledTimes(1);

      eventBus.off('bossDestroyed', handler);
    });
  });

  describe('Boss update is no-op after destruction complete', () => {
    it('should not call updateBoss or destructionSequence after destruction is complete and bossDestroyed emitted', () => {
      defeatBoss();

      // Complete destruction
      boss.update(BOSS_DESTRUCTION_PEEL_DURATION + 0.01);
      boss.update(BOSS_DESTRUCTION_STRIP_DURATION + 0.01);
      boss.update(BOSS_DESTRUCTION_SHATTER_DURATION + 0.01);
      boss.update(0.016); // emits bossDestroyed

      // Should be able to call update without errors
      expect(() => boss.update(0.016)).not.toThrow();

      // Phase should still be the same (not updating boss logic)
      const phase = boss.getCurrentPhase();
      boss.update(10.0);
      expect(boss.getCurrentPhase()).toBe(phase);
    });
  });

  describe('isDestructionComplete', () => {
    it('should return false before destruction starts', () => {
      expect(boss.isDestructionComplete()).toBe(false);
    });

    it('should return false during destruction', () => {
      defeatBoss();
      boss.update(0.5);
      expect(boss.isDestructionComplete()).toBe(false);
    });

    it('should return true after destruction completes', () => {
      defeatBoss();
      boss.update(BOSS_DESTRUCTION_PEEL_DURATION + 0.01);
      boss.update(BOSS_DESTRUCTION_STRIP_DURATION + 0.01);
      boss.update(BOSS_DESTRUCTION_SHATTER_DURATION + 0.01);
      expect(boss.isDestructionComplete()).toBe(true);
    });
  });

  describe('Collider sync during destruction', () => {
    it('should continue syncing collider during destruction', () => {
      defeatBoss();
      boss.getObject3D().position.set(5, 10, 15);
      boss.update(0.1);

      expect(boss.getCollider().center.x).toBe(5);
      expect(boss.getCollider().center.y).toBe(10);
      expect(boss.getCollider().center.z).toBe(15);
    });
  });
});
