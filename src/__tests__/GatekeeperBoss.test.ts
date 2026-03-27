import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as THREE from 'three';
import { GatekeeperBoss } from '../entities/bosses/GatekeeperBoss.ts';
import { VectorMaterials } from '../rendering/VectorMaterials.ts';
import { setActivePalette } from '../rendering/ColorPalette.ts';
import { eventBus } from '../core/GameEvents.ts';
import {
  BLOOM_LAYER,
  BOSS_GATEKEEPER_HEALTH,
  BOSS_GATEKEEPER_COLLIDER_RADIUS,
  BOSS_GATEKEEPER_SCORE_VALUE,
  BOSS_GATEKEEPER_BARRAGE_DURATION,
  BOSS_GATEKEEPER_SWEEP_DURATION,
  BOSS_GATEKEEPER_VULNERABLE_DURATION,
  BOSS_GATEKEEPER_DAMAGE_REDUCTION,
  BOSS_GATEKEEPER_BARRAGE_INTERVAL,
  BOSS_GATEKEEPER_BARRAGE_COUNT,
} from '../config/constants.ts';

describe('GatekeeperBoss', () => {
  let vectorMaterials: VectorMaterials;
  let boss: GatekeeperBoss;
  let playerPosition: THREE.Vector3;

  beforeEach(() => {
    setActivePalette('green');
    vectorMaterials = new VectorMaterials();
    playerPosition = new THREE.Vector3(0, 10, -30);
    boss = new GatekeeperBoss(vectorMaterials, () => playerPosition);
  });

  afterEach(() => {
    boss.dispose();
    vectorMaterials.dispose();
  });

  describe('Construction and Geometry', () => {
    it('should extend Boss with correct health, score, and collider', () => {
      expect(boss.health).toBe(BOSS_GATEKEEPER_HEALTH);
      expect(boss.maxHealth).toBe(BOSS_GATEKEEPER_HEALTH);
      expect(boss.scoreValue).toBe(BOSS_GATEKEEPER_SCORE_VALUE);
      expect(boss.getCollider().radius).toBe(BOSS_GATEKEEPER_COLLIDER_RADIUS);
    });

    it('should create three geometry layers as children of object3D', () => {
      const obj = boss.getObject3D();
      // outerShell, midStructure, innerCore
      expect(obj.children.length).toBe(3);
    });

    it('should have outer shell as first child with LineSegments', () => {
      const outerShell = boss.getOuterShell();
      expect(outerShell.children.length).toBe(1);
      expect(outerShell.children[0]).toBeInstanceOf(THREE.LineSegments);
    });

    it('should have mid structure as second child with LineSegments', () => {
      const midStructure = boss.getMidStructure();
      expect(midStructure.children.length).toBe(1);
      expect(midStructure.children[0]).toBeInstanceOf(THREE.LineSegments);
    });

    it('should have inner core as third child with LineSegments', () => {
      const innerCore = boss.getInnerCore();
      expect(innerCore.children.length).toBe(1);
      expect(innerCore.children[0]).toBeInstanceOf(THREE.LineSegments);
    });

    it('should enable bloom layer on all LineSegments', () => {
      const obj = boss.getObject3D();
      // THREE.Layers.test() takes a Layers object, not a plain object
      const testLayers = new THREE.Layers();
      testLayers.set(BLOOM_LAYER);
      for (const layer of obj.children) {
        const lineSegments = layer.children[0] as THREE.LineSegments;
        expect(lineSegments.layers.test(testLayers)).toBe(true);
      }
    });

    it('should start in barrage phase', () => {
      expect(boss.getCurrentPhase()).toBe('barrage');
    });
  });

  describe('Layer Animation', () => {
    it('should counter-rotate outer shell on Y axis', () => {
      const initialY = boss.getOuterShell().rotation.y;
      boss.update(1.0);
      expect(boss.getOuterShell().rotation.y).toBeLessThan(initialY);
    });

    it('should rotate mid structure on X axis', () => {
      const initialX = boss.getMidStructure().rotation.x;
      boss.update(1.0);
      expect(boss.getMidStructure().rotation.x).toBeGreaterThan(initialX);
    });

    it('should pulse inner core scale', () => {
      // After small dt, scale should differ from 1.0
      boss.update(0.2);
      const scale = boss.getInnerCore().scale.x;
      // Scale should be within pulse range (0.9 - 1.1)
      expect(scale).toBeGreaterThanOrEqual(0.9);
      expect(scale).toBeLessThanOrEqual(1.1);
    });
  });

  describe('Attack Phase Cycling', () => {
    it('should start in barrage phase', () => {
      expect(boss.getCurrentPhase()).toBe('barrage');
    });

    it('should transition from barrage to sweep after barrage duration', () => {
      // Advance past barrage duration
      boss.update(BOSS_GATEKEEPER_BARRAGE_DURATION + 0.1);
      expect(boss.getCurrentPhase()).toBe('sweep');
    });

    it('should transition from sweep to vulnerable after sweep duration', () => {
      // Advance through barrage
      boss.update(BOSS_GATEKEEPER_BARRAGE_DURATION + 0.1);
      expect(boss.getCurrentPhase()).toBe('sweep');
      // Advance through sweep
      boss.update(BOSS_GATEKEEPER_SWEEP_DURATION + 0.1);
      expect(boss.getCurrentPhase()).toBe('vulnerable');
    });

    it('should transition from vulnerable back to barrage', () => {
      // Advance through full cycle
      boss.update(BOSS_GATEKEEPER_BARRAGE_DURATION + 0.1);
      boss.update(BOSS_GATEKEEPER_SWEEP_DURATION + 0.1);
      expect(boss.getCurrentPhase()).toBe('vulnerable');
      boss.update(BOSS_GATEKEEPER_VULNERABLE_DURATION + 0.1);
      expect(boss.getCurrentPhase()).toBe('barrage');
    });

    it('should emit bossPhaseChanged events on phase transitions', () => {
      const handler = vi.fn();
      eventBus.on('bossPhaseChanged', handler);

      // Initial phase emission is in constructor - reset
      handler.mockClear();

      // Trigger barrage -> sweep
      boss.update(BOSS_GATEKEEPER_BARRAGE_DURATION + 0.1);
      expect(handler).toHaveBeenCalledWith({ phase: 'sweep' });

      eventBus.off('bossPhaseChanged', handler);
    });
  });

  describe('Barrage Attack', () => {
    it('should emit bossAttack events during barrage phase', () => {
      const handler = vi.fn();
      eventBus.on('bossAttack', handler);

      // Advance enough to trigger at least one barrage
      boss.update(BOSS_GATEKEEPER_BARRAGE_INTERVAL + 0.01);

      expect(handler).toHaveBeenCalled();
      const event = handler.mock.calls[0][0];
      expect(event.positions.length).toBe(BOSS_GATEKEEPER_BARRAGE_COUNT);
      expect(event.targetPosition).toBeDefined();
      expect(event.speed).toBeDefined();
      expect(event.damage).toBeDefined();

      eventBus.off('bossAttack', handler);
    });
  });

  describe('Sweep Attack', () => {
    it('should emit bossAttack events during sweep phase', () => {
      const handler = vi.fn();
      eventBus.on('bossAttack', handler);

      // Move to sweep phase
      boss.update(BOSS_GATEKEEPER_BARRAGE_DURATION + 0.1);
      handler.mockClear();

      // Advance sweep phase enough to fire
      boss.update(0.25);

      expect(handler).toHaveBeenCalled();
      const event = handler.mock.calls[0][0];
      // Sweep fires single bursts
      expect(event.positions.length).toBe(1);

      eventBus.off('bossAttack', handler);
    });
  });

  describe('Damage Reduction', () => {
    it('should apply damage reduction during barrage phase (non-vulnerable)', () => {
      expect(boss.vulnerable).toBe(false);
      boss.takeDamage(100);
      // 100 * 0.25 = 25 damage
      expect(boss.health).toBe(BOSS_GATEKEEPER_HEALTH - 100 * BOSS_GATEKEEPER_DAMAGE_REDUCTION);
    });

    it('should take full damage during vulnerable phase', () => {
      // Move to vulnerable phase
      boss.update(BOSS_GATEKEEPER_BARRAGE_DURATION + 0.1);
      boss.update(BOSS_GATEKEEPER_SWEEP_DURATION + 0.1);
      expect(boss.vulnerable).toBe(true);

      boss.takeDamage(100);
      expect(boss.health).toBe(BOSS_GATEKEEPER_HEALTH - 100);
    });

    it('should apply damage reduction during sweep phase', () => {
      // Move to sweep phase
      boss.update(BOSS_GATEKEEPER_BARRAGE_DURATION + 0.1);
      expect(boss.getCurrentPhase()).toBe('sweep');
      expect(boss.vulnerable).toBe(false);

      boss.takeDamage(100);
      expect(boss.health).toBe(BOSS_GATEKEEPER_HEALTH - 100 * BOSS_GATEKEEPER_DAMAGE_REDUCTION);
    });
  });

  describe('Vulnerability Visual State', () => {
    it('should set outer shell opacity to 0.3 during vulnerable phase', () => {
      // Move to vulnerable
      boss.update(BOSS_GATEKEEPER_BARRAGE_DURATION + 0.1);
      boss.update(BOSS_GATEKEEPER_SWEEP_DURATION + 0.1);

      const outerMaterial = boss.getOuterMaterial();
      expect(outerMaterial.opacity).toBe(0.3);
      expect(outerMaterial.transparent).toBe(true);
      expect(outerMaterial.depthWrite).toBe(false);
    });

    it('should restore outer shell opacity when leaving vulnerable phase', () => {
      // Move through full cycle back to barrage
      boss.update(BOSS_GATEKEEPER_BARRAGE_DURATION + 0.1);
      boss.update(BOSS_GATEKEEPER_SWEEP_DURATION + 0.1);
      boss.update(BOSS_GATEKEEPER_VULNERABLE_DURATION + 0.1);

      const outerMaterial = boss.getOuterMaterial();
      expect(outerMaterial.transparent).toBe(false);
      expect(outerMaterial.depthWrite).toBe(true);
    });

    it('should emit bossVulnerable events on vulnerability changes', () => {
      const handler = vi.fn();
      eventBus.on('bossVulnerable', handler);

      // Move to vulnerable
      boss.update(BOSS_GATEKEEPER_BARRAGE_DURATION + 0.1);
      boss.update(BOSS_GATEKEEPER_SWEEP_DURATION + 0.1);
      expect(handler).toHaveBeenCalledWith({ vulnerable: true });

      // Leave vulnerable
      boss.update(BOSS_GATEKEEPER_VULNERABLE_DURATION + 0.1);
      expect(handler).toHaveBeenCalledWith({ vulnerable: false });

      eventBus.off('bossVulnerable', handler);
    });
  });

  describe('Hit Flash Effect', () => {
    it('should scale all layers to 1.15 on hit', () => {
      boss.takeDamage(10);

      expect(boss.getOuterShell().scale.x).toBeCloseTo(1.15);
      expect(boss.getMidStructure().scale.x).toBeCloseTo(1.15);
      expect(boss.getInnerCore().scale.x).toBeCloseTo(1.15);
    });

    it('should restore scales after flash timer expires', () => {
      boss.takeDamage(10);
      // Flash timer is 0.1 seconds, advance past it
      boss.update(0.15);

      // Outer and mid should be back to ~1.0, core may be pulsing
      expect(boss.getOuterShell().scale.x).toBeCloseTo(1.0, 0);
      expect(boss.getMidStructure().scale.x).toBeCloseTo(1.0, 0);
    });
  });

  describe('Boss Health Events', () => {
    it('should emit bossHealthChanged on damage', () => {
      const handler = vi.fn();
      eventBus.on('bossHealthChanged', handler);

      boss.takeDamage(100);

      expect(handler).toHaveBeenCalledWith({
        health: BOSS_GATEKEEPER_HEALTH - 100 * BOSS_GATEKEEPER_DAMAGE_REDUCTION,
        maxHealth: BOSS_GATEKEEPER_HEALTH,
      });

      eventBus.off('bossHealthChanged', handler);
    });
  });

  describe('Defeat', () => {
    it('should emit bossDefeated event when health reaches 0', () => {
      const handler = vi.fn();
      eventBus.on('bossDefeated', handler);

      // Move to vulnerable for full damage
      boss.update(BOSS_GATEKEEPER_BARRAGE_DURATION + 0.1);
      boss.update(BOSS_GATEKEEPER_SWEEP_DURATION + 0.1);

      // Deal lethal damage
      boss.takeDamage(BOSS_GATEKEEPER_HEALTH);

      expect(boss.defeated).toBe(true);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ scoreValue: BOSS_GATEKEEPER_SCORE_VALUE }),
      );

      eventBus.off('bossDefeated', handler);
    });

    it('should stop updating when defeated', () => {
      // Defeat the boss
      boss.update(BOSS_GATEKEEPER_BARRAGE_DURATION + 0.1);
      boss.update(BOSS_GATEKEEPER_SWEEP_DURATION + 0.1);
      boss.takeDamage(BOSS_GATEKEEPER_HEALTH);

      const phaseBefore = boss.getCurrentPhase();
      boss.update(10.0);
      // Phase should not change since updateBoss is not called
      expect(boss.getCurrentPhase()).toBe(phaseBefore);
    });

    it('should not take further damage after defeat', () => {
      boss.update(BOSS_GATEKEEPER_BARRAGE_DURATION + 0.1);
      boss.update(BOSS_GATEKEEPER_SWEEP_DURATION + 0.1);
      boss.takeDamage(BOSS_GATEKEEPER_HEALTH);

      const healthAfterDefeat = boss.health;
      boss.takeDamage(100);
      expect(boss.health).toBe(healthAfterDefeat);
    });
  });

  describe('Duck-typing Compatibility', () => {
    it('should have takeDamage method for CollisionSystem', () => {
      expect('takeDamage' in boss).toBe(true);
    });

    it('should NOT have applyStun (bosses are not stunnable)', () => {
      expect('applyStun' in boss).toBe(false);
    });
  });

  describe('Disposal', () => {
    it('should remove layers from object3D on dispose', () => {
      boss.dispose();
      expect(boss.getObject3D().children.length).toBe(0);
    });
  });
});
