import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as THREE from 'three';
import { AvengerBoss } from '../entities/bosses/AvengerBoss.ts';
import { VectorMaterials } from '../rendering/VectorMaterials.ts';
import { setActivePalette } from '../rendering/ColorPalette.ts';
import { eventBus } from '../core/GameEvents.ts';
import {
  BLOOM_LAYER,
  BOSS_AVENGER_HEALTH,
  BOSS_AVENGER_COLLIDER_RADIUS,
  BOSS_AVENGER_SCORE_VALUE,
  BOSS_AVENGER_RUSH_DURATION,
  BOSS_AVENGER_BARRAGE_DURATION,
  BOSS_AVENGER_VULNERABLE_DURATION,
  BOSS_AVENGER_DAMAGE_REDUCTION,
  BOSS_AVENGER_RUSH_PROJECTILE_INTERVAL,
  BOSS_AVENGER_BARRAGE_INTERVAL,
  BOSS_AVENGER_BARRAGE_COUNT,
  BOSS_AVENGER_PROJECTILE_SPEED,
  BOSS_AVENGER_RUSH_DAMAGE,
  BOSS_AVENGER_ATTACK_DAMAGE,
  BOSS_AVENGER_OUTER_RADIUS,
  BOSS_AVENGER_MID_RADIUS,
  BOSS_AVENGER_CORE_RADIUS,
  BOSS_AVENGER_ROTATION_SPEED,
  BOSS_GATEKEEPER_HEALTH,
  BOSS_GATEKEEPER_VULNERABLE_DURATION,
  BOSS_GATEKEEPER_BARRAGE_INTERVAL,
  BOSS_GATEKEEPER_BARRAGE_COUNT,
  BOSS_GATEKEEPER_PROJECTILE_SPEED,
  BOSS_GATEKEEPER_ATTACK_DAMAGE,
  BOSS_GATEKEEPER_DAMAGE_REDUCTION,
  BOSS_GATEKEEPER_SCORE_VALUE,
} from '../config/constants.ts';

describe('AvengerBoss', () => {
  let vectorMaterials: VectorMaterials;
  let boss: AvengerBoss;
  let playerPosition: THREE.Vector3;

  beforeEach(() => {
    setActivePalette('amber');
    vectorMaterials = new VectorMaterials();
    playerPosition = new THREE.Vector3(0, 10, -30);
    boss = new AvengerBoss(vectorMaterials, () => playerPosition);
  });

  afterEach(() => {
    boss.dispose();
    vectorMaterials.dispose();
  });

  describe('Construction and Geometry', () => {
    it('should extend Boss with correct health, score, and collider', () => {
      expect(boss.health).toBe(BOSS_AVENGER_HEALTH);
      expect(boss.maxHealth).toBe(BOSS_AVENGER_HEALTH);
      expect(boss.scoreValue).toBe(BOSS_AVENGER_SCORE_VALUE);
      expect(boss.getCollider().radius).toBe(BOSS_AVENGER_COLLIDER_RADIUS);
    });

    it('should create three geometry layers as children of object3D', () => {
      const obj = boss.getObject3D();
      expect(obj.children.length).toBe(3);
    });

    it('should have outer spines as first child with LineSegments', () => {
      const outerSpines = boss.getOuterSpines();
      expect(outerSpines.children.length).toBe(1);
      expect(outerSpines.children[0]).toBeInstanceOf(THREE.LineSegments);
    });

    it('should have mid blades as second child with LineSegments', () => {
      const midBlades = boss.getMidBlades();
      expect(midBlades.children.length).toBe(1);
      expect(midBlades.children[0]).toBeInstanceOf(THREE.LineSegments);
    });

    it('should have inner core as third child with LineSegments', () => {
      const innerCore = boss.getInnerCore();
      expect(innerCore.children.length).toBe(1);
      expect(innerCore.children[0]).toBeInstanceOf(THREE.LineSegments);
    });

    it('should enable bloom layer on all LineSegments', () => {
      const obj = boss.getObject3D();
      const testLayers = new THREE.Layers();
      testLayers.set(BLOOM_LAYER);
      for (const layer of obj.children) {
        const lineSegments = layer.children[0] as THREE.LineSegments;
        expect(lineSegments.layers.test(testLayers)).toBe(true);
      }
    });

    it('should start in rush phase', () => {
      expect(boss.getCurrentPhase()).toBe('rush');
    });

    it('should emit bossPhaseChanged on construction', () => {
      const handler = vi.fn();
      eventBus.on('bossPhaseChanged', handler);

      const testBoss = new AvengerBoss(vectorMaterials, () => playerPosition);
      expect(handler).toHaveBeenCalledWith({ phase: 'rush' });

      eventBus.off('bossPhaseChanged', handler);
      testBoss.dispose();
    });
  });

  describe('Layer Animation', () => {
    it('should rotate outer spines on Y and Z axes', () => {
      const initialY = boss.getOuterSpines().rotation.y;
      boss.update(1.0);
      expect(boss.getOuterSpines().rotation.y).not.toBe(initialY);
    });

    it('should rotate mid blades on X and Y axes', () => {
      const initialX = boss.getMidBlades().rotation.x;
      boss.update(1.0);
      expect(boss.getMidBlades().rotation.x).toBeGreaterThan(initialX);
    });

    it('should pulse inner core scale', () => {
      boss.update(0.2);
      const scale = boss.getInnerCore().scale.x;
      expect(scale).toBeGreaterThanOrEqual(0.85);
      expect(scale).toBeLessThanOrEqual(1.15);
    });
  });

  describe('Attack Phase Cycling', () => {
    it('should start in rush phase', () => {
      expect(boss.getCurrentPhase()).toBe('rush');
    });

    it('should transition from rush to barrage after rush duration', () => {
      boss.update(BOSS_AVENGER_RUSH_DURATION + 0.1);
      expect(boss.getCurrentPhase()).toBe('barrage');
    });

    it('should transition from barrage to vulnerable after barrage duration', () => {
      boss.update(BOSS_AVENGER_RUSH_DURATION + 0.1);
      expect(boss.getCurrentPhase()).toBe('barrage');
      boss.update(BOSS_AVENGER_BARRAGE_DURATION + 0.1);
      expect(boss.getCurrentPhase()).toBe('vulnerable');
    });

    it('should transition from vulnerable back to rush', () => {
      boss.update(BOSS_AVENGER_RUSH_DURATION + 0.1);
      boss.update(BOSS_AVENGER_BARRAGE_DURATION + 0.1);
      expect(boss.getCurrentPhase()).toBe('vulnerable');
      boss.update(BOSS_AVENGER_VULNERABLE_DURATION + 0.1);
      expect(boss.getCurrentPhase()).toBe('rush');
    });

    it('should emit bossPhaseChanged events on phase transitions', () => {
      const handler = vi.fn();
      eventBus.on('bossPhaseChanged', handler);
      handler.mockClear();

      // Trigger rush -> barrage
      boss.update(BOSS_AVENGER_RUSH_DURATION + 0.1);
      expect(handler).toHaveBeenCalledWith({ phase: 'barrage' });

      eventBus.off('bossPhaseChanged', handler);
    });

    it('should set vulnerable flag during vulnerable phase', () => {
      expect(boss.vulnerable).toBe(false);
      boss.update(BOSS_AVENGER_RUSH_DURATION + 0.1);
      boss.update(BOSS_AVENGER_BARRAGE_DURATION + 0.1);
      expect(boss.vulnerable).toBe(true);
    });

    it('should emit bossVulnerable events', () => {
      const handler = vi.fn();
      eventBus.on('bossVulnerable', handler);

      boss.update(BOSS_AVENGER_RUSH_DURATION + 0.1);
      boss.update(BOSS_AVENGER_BARRAGE_DURATION + 0.1);
      expect(handler).toHaveBeenCalledWith({ vulnerable: true });

      eventBus.off('bossVulnerable', handler);
    });

    it('should clear vulnerable flag when leaving vulnerable phase', () => {
      boss.update(BOSS_AVENGER_RUSH_DURATION + 0.1);
      boss.update(BOSS_AVENGER_BARRAGE_DURATION + 0.1);
      expect(boss.vulnerable).toBe(true);
      boss.update(BOSS_AVENGER_VULNERABLE_DURATION + 0.1);
      expect(boss.vulnerable).toBe(false);
    });
  });

  describe('Rush Attack', () => {
    it('should emit bossAttack events during rush phase', () => {
      const handler = vi.fn();
      eventBus.on('bossAttack', handler);

      boss.update(BOSS_AVENGER_RUSH_PROJECTILE_INTERVAL + 0.01);
      expect(handler).toHaveBeenCalled();

      eventBus.off('bossAttack', handler);
    });

    it('should emit bossAttack with correct projectile speed and damage', () => {
      const handler = vi.fn();
      eventBus.on('bossAttack', handler);

      boss.update(BOSS_AVENGER_RUSH_PROJECTILE_INTERVAL + 0.01);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          speed: BOSS_AVENGER_PROJECTILE_SPEED,
          damage: BOSS_AVENGER_RUSH_DAMAGE,
        }),
      );

      eventBus.off('bossAttack', handler);
    });

    it('should move boss position during rush', () => {
      const initialPos = boss.getObject3D().position.clone();
      // Update with a small dt to begin rush movement
      boss.update(0.5);
      const newPos = boss.getObject3D().position;
      // Position should change as the boss charges toward the player
      const distance = initialPos.distanceTo(newPos);
      expect(distance).toBeGreaterThan(0);
    });

    it('should return to start position when leaving rush', () => {
      const initialPos = boss.getObject3D().position.clone();
      // Complete the rush phase
      boss.update(BOSS_AVENGER_RUSH_DURATION + 0.1);
      // Boss should be back near starting position
      const finalPos = boss.getObject3D().position;
      const distance = initialPos.distanceTo(finalPos);
      expect(distance).toBeLessThan(1.0);
    });
  });

  describe('Barrage Attack', () => {
    it('should emit bossAttack events during barrage phase', () => {
      // Advance to barrage phase
      boss.update(BOSS_AVENGER_RUSH_DURATION + 0.1);
      expect(boss.getCurrentPhase()).toBe('barrage');

      const handler = vi.fn();
      eventBus.on('bossAttack', handler);

      boss.update(BOSS_AVENGER_BARRAGE_INTERVAL + 0.01);
      expect(handler).toHaveBeenCalled();

      eventBus.off('bossAttack', handler);
    });

    it('should emit barrage with correct count of positions', () => {
      boss.update(BOSS_AVENGER_RUSH_DURATION + 0.1);

      const handler = vi.fn();
      eventBus.on('bossAttack', handler);

      boss.update(BOSS_AVENGER_BARRAGE_INTERVAL + 0.01);
      expect(handler.mock.calls[0][0].positions.length).toBe(BOSS_AVENGER_BARRAGE_COUNT);

      eventBus.off('bossAttack', handler);
    });

    it('should emit barrage with correct speed and damage', () => {
      boss.update(BOSS_AVENGER_RUSH_DURATION + 0.1);

      const handler = vi.fn();
      eventBus.on('bossAttack', handler);

      boss.update(BOSS_AVENGER_BARRAGE_INTERVAL + 0.01);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          speed: BOSS_AVENGER_PROJECTILE_SPEED,
          damage: BOSS_AVENGER_ATTACK_DAMAGE,
        }),
      );

      eventBus.off('bossAttack', handler);
    });
  });

  describe('Damage and Vulnerability', () => {
    it('should apply damage reduction during non-vulnerable phases', () => {
      const initialHealth = boss.health;
      boss.takeDamage(100);
      expect(boss.health).toBe(initialHealth - 100 * BOSS_AVENGER_DAMAGE_REDUCTION);
    });

    it('should apply full damage during vulnerable phase', () => {
      // Advance to vulnerable phase
      boss.update(BOSS_AVENGER_RUSH_DURATION + 0.1);
      boss.update(BOSS_AVENGER_BARRAGE_DURATION + 0.1);
      expect(boss.vulnerable).toBe(true);

      const healthBefore = boss.health;
      boss.takeDamage(100);
      expect(boss.health).toBe(healthBefore - 100);
    });

    it('should emit bossHealthChanged on damage', () => {
      const handler = vi.fn();
      eventBus.on('bossHealthChanged', handler);

      boss.takeDamage(50);
      expect(handler).toHaveBeenCalledWith({
        health: expect.any(Number),
        maxHealth: BOSS_AVENGER_HEALTH,
      });

      eventBus.off('bossHealthChanged', handler);
    });

    it('should emit bossDefeated when health reaches zero', () => {
      const handler = vi.fn();
      eventBus.on('bossDefeated', handler);

      // Enter vulnerable phase for full damage
      boss.update(BOSS_AVENGER_RUSH_DURATION + 0.1);
      boss.update(BOSS_AVENGER_BARRAGE_DURATION + 0.1);

      boss.takeDamage(BOSS_AVENGER_HEALTH);
      expect(handler).toHaveBeenCalled();
      expect(boss.defeated).toBe(true);

      eventBus.off('bossDefeated', handler);
    });

    it('should not take damage after defeated', () => {
      boss.update(BOSS_AVENGER_RUSH_DURATION + 0.1);
      boss.update(BOSS_AVENGER_BARRAGE_DURATION + 0.1);
      boss.takeDamage(BOSS_AVENGER_HEALTH);
      expect(boss.defeated).toBe(true);

      const healthAfterDefeat = boss.health;
      boss.takeDamage(100);
      expect(boss.health).toBe(healthAfterDefeat);
    });
  });

  describe('Hit Flash', () => {
    it('should scale layers on hit', () => {
      boss.takeDamage(10);
      expect(boss.getOuterSpines().scale.x).toBeCloseTo(1.15);
      expect(boss.getMidBlades().scale.x).toBeCloseTo(1.15);
      expect(boss.getInnerCore().scale.x).toBeCloseTo(1.15);
    });

    it('should restore scale after flash timer', () => {
      boss.takeDamage(10);
      // Update past the flash duration (0.1s)
      boss.update(0.15);
      // Scale should be restored (approximately)
      expect(boss.getOuterSpines().scale.x).not.toBeCloseTo(1.15);
    });
  });

  describe('Destruction Sequence', () => {
    it('should start destruction sequence when defeated', () => {
      boss.update(BOSS_AVENGER_RUSH_DURATION + 0.1);
      boss.update(BOSS_AVENGER_BARRAGE_DURATION + 0.1);
      boss.takeDamage(BOSS_AVENGER_HEALTH);
      expect(boss.defeated).toBe(true);
    });

    it('should emit bossDestructionStage events during destruction', () => {
      const handler = vi.fn();
      eventBus.on('bossDestructionStage', handler);

      boss.update(BOSS_AVENGER_RUSH_DURATION + 0.1);
      boss.update(BOSS_AVENGER_BARRAGE_DURATION + 0.1);
      boss.takeDamage(BOSS_AVENGER_HEALTH);

      // Drive destruction sequence
      boss.update(0.5);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ stage: 'peel' }),
      );

      eventBus.off('bossDestructionStage', handler);
    });

    it('should emit bossDestroyed after destruction sequence completes', () => {
      const handler = vi.fn();
      eventBus.on('bossDestroyed', handler);

      boss.update(BOSS_AVENGER_RUSH_DURATION + 0.1);
      boss.update(BOSS_AVENGER_BARRAGE_DURATION + 0.1);
      boss.takeDamage(BOSS_AVENGER_HEALTH);

      // Drive through entire destruction sequence (peel: 2.0 + strip: 1.5 + shatter: 2.0 = 5.5s)
      boss.update(2.1); // peel
      boss.update(1.6); // strip
      boss.update(2.1); // shatter completes
      // One more update for bossDestroyed emission (else-if chain in Boss.update)
      boss.update(0.016);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ scoreValue: BOSS_AVENGER_SCORE_VALUE }),
      );

      eventBus.off('bossDestroyed', handler);
    });

    it('should report destruction complete after all stages', () => {
      boss.update(BOSS_AVENGER_RUSH_DURATION + 0.1);
      boss.update(BOSS_AVENGER_BARRAGE_DURATION + 0.1);
      boss.takeDamage(BOSS_AVENGER_HEALTH);

      boss.update(2.1); // peel
      boss.update(1.6); // strip
      boss.update(2.1); // shatter completes

      expect(boss.isDestructionComplete()).toBe(true);
    });
  });

  describe('Avenger Constants Validation', () => {
    it('should have more health than Gatekeeper', () => {
      expect(BOSS_AVENGER_HEALTH).toBeGreaterThan(BOSS_GATEKEEPER_HEALTH);
    });

    it('should have shorter vulnerable window than Gatekeeper', () => {
      expect(BOSS_AVENGER_VULNERABLE_DURATION).toBeLessThan(BOSS_GATEKEEPER_VULNERABLE_DURATION);
    });

    it('should have faster barrage interval than Gatekeeper', () => {
      expect(BOSS_AVENGER_BARRAGE_INTERVAL).toBeLessThan(BOSS_GATEKEEPER_BARRAGE_INTERVAL);
    });

    it('should have more barrage projectiles than Gatekeeper', () => {
      expect(BOSS_AVENGER_BARRAGE_COUNT).toBeGreaterThan(BOSS_GATEKEEPER_BARRAGE_COUNT);
    });

    it('should have faster projectile speed than Gatekeeper', () => {
      expect(BOSS_AVENGER_PROJECTILE_SPEED).toBeGreaterThan(BOSS_GATEKEEPER_PROJECTILE_SPEED);
    });

    it('should have higher attack damage than Gatekeeper', () => {
      expect(BOSS_AVENGER_ATTACK_DAMAGE).toBeGreaterThan(BOSS_GATEKEEPER_ATTACK_DAMAGE);
    });

    it('should have less damage reduction than Gatekeeper', () => {
      expect(BOSS_AVENGER_DAMAGE_REDUCTION).toBeLessThan(BOSS_GATEKEEPER_DAMAGE_REDUCTION);
    });

    it('should have higher score value than Gatekeeper', () => {
      expect(BOSS_AVENGER_SCORE_VALUE).toBeGreaterThan(BOSS_GATEKEEPER_SCORE_VALUE);
    });
  });
});
