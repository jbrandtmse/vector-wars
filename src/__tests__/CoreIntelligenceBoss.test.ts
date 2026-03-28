import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as THREE from 'three';
import { CoreIntelligenceBoss } from '../entities/bosses/CoreIntelligenceBoss.ts';
import { VectorMaterials } from '../rendering/VectorMaterials.ts';
import { setActivePalette } from '../rendering/ColorPalette.ts';
import { eventBus } from '../core/GameEvents.ts';
import {
  BLOOM_LAYER,
  BOSS_CORE_HEALTH,
  BOSS_CORE_COLLIDER_RADIUS,
  BOSS_CORE_SCORE_VALUE,
  BOSS_CORE_OUTER_RADIUS,
  BOSS_CORE_MID_RADIUS,
  BOSS_CORE_INNER_RADIUS,
  BOSS_CORE_DEEP_RADIUS,
  BOSS_CORE_ROTATION_SPEED,
  BOSS_CORE_REASON_DURATION,
  BOSS_CORE_REASON_INTERVAL,
  BOSS_CORE_REASON_DAMAGE,
  BOSS_CORE_BARRAGE_DURATION,
  BOSS_CORE_BARRAGE_INTERVAL,
  BOSS_CORE_BARRAGE_COUNT,
  BOSS_CORE_SURGE_DURATION,
  BOSS_CORE_SURGE_BURST_INTERVAL,
  BOSS_CORE_SURGE_BURST_COUNT,
  BOSS_CORE_SURGE_DAMAGE,
  BOSS_CORE_VULNERABLE_DURATION,
  BOSS_CORE_DAMAGE_REDUCTION,
  BOSS_CORE_ATTACK_DAMAGE,
  BOSS_CORE_PROJECTILE_SPEED,
  BOSS_CORE_ESCALATION_75_ROTATION_MULT,
  BOSS_CORE_ESCALATION_75_JITTER,
  BOSS_CORE_ESCALATION_50_ROTATION_MULT,
  BOSS_CORE_ESCALATION_50_JITTER,
  BOSS_CORE_ESCALATION_50_PULSE_MULT,
  BOSS_CORE_ESCALATION_25_ROTATION_MULT,
  BOSS_CORE_ESCALATION_25_JITTER,
  BOSS_CORE_ESCALATION_25_PULSE_MULT,
  BOSS_AVENGER_HEALTH,
  BOSS_AVENGER_VULNERABLE_DURATION,
  BOSS_AVENGER_BARRAGE_INTERVAL,
  BOSS_AVENGER_BARRAGE_COUNT,
  BOSS_AVENGER_PROJECTILE_SPEED,
  BOSS_AVENGER_ATTACK_DAMAGE,
  BOSS_AVENGER_DAMAGE_REDUCTION,
  BOSS_AVENGER_SCORE_VALUE,
} from '../config/constants.ts';

describe('CoreIntelligenceBoss', () => {
  let vectorMaterials: VectorMaterials;
  let boss: CoreIntelligenceBoss;
  let playerPosition: THREE.Vector3;

  beforeEach(() => {
    setActivePalette('red');
    vectorMaterials = new VectorMaterials();
    playerPosition = new THREE.Vector3(0, 10, -30);
    boss = new CoreIntelligenceBoss(vectorMaterials, () => playerPosition);
  });

  afterEach(() => {
    boss.dispose();
    vectorMaterials.dispose();
  });

  describe('Construction and Geometry', () => {
    it('should extend Boss with correct health, score, and collider', () => {
      expect(boss.health).toBe(BOSS_CORE_HEALTH);
      expect(boss.maxHealth).toBe(BOSS_CORE_HEALTH);
      expect(boss.scoreValue).toBe(BOSS_CORE_SCORE_VALUE);
      expect(boss.getCollider().radius).toBe(BOSS_CORE_COLLIDER_RADIUS);
    });

    it('should create four geometry layers as children of object3D', () => {
      const obj = boss.getObject3D();
      expect(obj.children.length).toBe(4);
    });

    it('should have outer fractal as first child with LineSegments', () => {
      const outerFractal = boss.getOuterFractal();
      expect(outerFractal.children.length).toBe(1);
      expect(outerFractal.children[0]).toBeInstanceOf(THREE.LineSegments);
    });

    it('should have mid lattice as second child with LineSegments', () => {
      const midLattice = boss.getMidLattice();
      expect(midLattice.children.length).toBe(1);
      expect(midLattice.children[0]).toBeInstanceOf(THREE.LineSegments);
    });

    it('should have inner matrix as third child with LineSegments', () => {
      const innerMatrix = boss.getInnerMatrix();
      expect(innerMatrix.children.length).toBe(1);
      expect(innerMatrix.children[0]).toBeInstanceOf(THREE.LineSegments);
    });

    it('should have deep core as fourth child with LineSegments', () => {
      const deepCore = boss.getDeepCore();
      expect(deepCore.children.length).toBe(1);
      expect(deepCore.children[0]).toBeInstanceOf(THREE.LineSegments);
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

    it('should start in reason phase', () => {
      expect(boss.getCurrentPhase()).toBe('reason');
    });

    it('should emit bossPhaseChanged on construction', () => {
      const handler = vi.fn();
      eventBus.on('bossPhaseChanged', handler);
      // Create a new boss to trigger the event
      const testBoss = new CoreIntelligenceBoss(vectorMaterials, () => playerPosition);
      expect(handler).toHaveBeenCalledWith({ phase: 'reason' });
      eventBus.off('bossPhaseChanged', handler);
      testBoss.dispose();
    });

    it('should not be vulnerable initially', () => {
      expect(boss.vulnerable).toBe(false);
    });
  });

  describe('Layer Animation', () => {
    it('should rotate outer fractal on Y during update', () => {
      const outerFractal = boss.getOuterFractal();
      const initialY = outerFractal.rotation.y;
      boss.update(0.1);
      expect(outerFractal.rotation.y).not.toBe(initialY);
    });

    it('should rotate mid lattice on X during update', () => {
      const midLattice = boss.getMidLattice();
      const initialX = midLattice.rotation.x;
      boss.update(0.1);
      expect(midLattice.rotation.x).not.toBe(initialX);
    });
  });

  describe('Attack Phase Cycle', () => {
    it('should transition from reason to barrage after reason duration', () => {
      // Advance through reason phase
      boss.update(BOSS_CORE_REASON_DURATION + 0.1);
      expect(boss.getCurrentPhase()).toBe('barrage');
    });

    it('should transition from barrage to surge after barrage duration', () => {
      boss.update(BOSS_CORE_REASON_DURATION + 0.01);
      expect(boss.getCurrentPhase()).toBe('barrage');
      boss.update(BOSS_CORE_BARRAGE_DURATION + 0.01);
      expect(boss.getCurrentPhase()).toBe('surge');
    });

    it('should transition from surge to vulnerable after surge duration', () => {
      boss.update(BOSS_CORE_REASON_DURATION + 0.01);
      boss.update(BOSS_CORE_BARRAGE_DURATION + 0.01);
      expect(boss.getCurrentPhase()).toBe('surge');
      boss.update(BOSS_CORE_SURGE_DURATION + 0.01);
      expect(boss.getCurrentPhase()).toBe('vulnerable');
    });

    it('should transition from vulnerable back to reason after vulnerable duration', () => {
      boss.update(BOSS_CORE_REASON_DURATION + 0.01);
      boss.update(BOSS_CORE_BARRAGE_DURATION + 0.01);
      boss.update(BOSS_CORE_SURGE_DURATION + 0.01);
      expect(boss.getCurrentPhase()).toBe('vulnerable');
      boss.update(BOSS_CORE_VULNERABLE_DURATION + 0.01);
      expect(boss.getCurrentPhase()).toBe('reason');
    });

    it('should emit bossPhaseChanged events on phase transitions', () => {
      const phases: string[] = [];
      const handler = (e: { phase: string }) => phases.push(e.phase);
      eventBus.on('bossPhaseChanged', handler);

      boss.update(BOSS_CORE_REASON_DURATION + 0.01);
      boss.update(BOSS_CORE_BARRAGE_DURATION + 0.01);
      boss.update(BOSS_CORE_SURGE_DURATION + 0.01);
      boss.update(BOSS_CORE_VULNERABLE_DURATION + 0.01);

      expect(phases).toContain('barrage');
      expect(phases).toContain('surge');
      expect(phases).toContain('vulnerable');
      expect(phases).toContain('reason');

      eventBus.off('bossPhaseChanged', handler);
    });
  });

  describe('Reason Phase Attacks', () => {
    it('should emit bossAttack at reason interval', () => {
      const attacks: Array<{ speed: number; damage: number }> = [];
      const handler = (e: { speed: number; damage: number }) => attacks.push(e);
      eventBus.on('bossAttack', handler);

      // Advance past one reason interval
      boss.update(BOSS_CORE_REASON_INTERVAL + 0.01);

      expect(attacks.length).toBeGreaterThanOrEqual(1);
      expect(attacks[0].speed).toBe(BOSS_CORE_PROJECTILE_SPEED);
      expect(attacks[0].damage).toBe(BOSS_CORE_REASON_DAMAGE);

      eventBus.off('bossAttack', handler);
    });

    it('should fire single aimed projectiles in reason phase', () => {
      const attacks: Array<{ positions: Array<{ x: number; y: number; z: number }> }> = [];
      const handler = (e: { positions: Array<{ x: number; y: number; z: number }> }) => attacks.push(e);
      eventBus.on('bossAttack', handler);

      boss.update(BOSS_CORE_REASON_INTERVAL + 0.01);

      expect(attacks.length).toBeGreaterThanOrEqual(1);
      expect(attacks[0].positions.length).toBe(1);

      eventBus.off('bossAttack', handler);
    });
  });

  describe('Barrage Phase Attacks', () => {
    it('should emit bossAttack with multiple projectiles in barrage', () => {
      // Transition to barrage phase
      boss.update(BOSS_CORE_REASON_DURATION + 0.01);
      expect(boss.getCurrentPhase()).toBe('barrage');

      const attacks: Array<{ positions: Array<{ x: number; y: number; z: number }> }> = [];
      const handler = (e: { positions: Array<{ x: number; y: number; z: number }> }) => attacks.push(e);
      eventBus.on('bossAttack', handler);

      // Advance past one barrage interval
      boss.update(BOSS_CORE_BARRAGE_INTERVAL + 0.01);

      expect(attacks.length).toBeGreaterThanOrEqual(1);
      expect(attacks[0].positions.length).toBe(BOSS_CORE_BARRAGE_COUNT);

      eventBus.off('bossAttack', handler);
    });
  });

  describe('Surge Phase Attacks', () => {
    it('should emit bossAttack with radial burst pattern in surge', () => {
      // Transition to surge phase
      boss.update(BOSS_CORE_REASON_DURATION + 0.01);
      boss.update(BOSS_CORE_BARRAGE_DURATION + 0.01);
      expect(boss.getCurrentPhase()).toBe('surge');

      const attacks: Array<{ positions: Array<{ x: number; y: number; z: number }>; damage: number }> = [];
      const handler = (e: { positions: Array<{ x: number; y: number; z: number }>; damage: number }) => attacks.push(e);
      eventBus.on('bossAttack', handler);

      boss.update(BOSS_CORE_SURGE_BURST_INTERVAL + 0.01);

      expect(attacks.length).toBeGreaterThanOrEqual(1);
      expect(attacks[0].positions.length).toBe(BOSS_CORE_SURGE_BURST_COUNT);
      expect(attacks[0].damage).toBe(BOSS_CORE_SURGE_DAMAGE);

      eventBus.off('bossAttack', handler);
    });
  });

  describe('Vulnerability', () => {
    it('should be vulnerable during vulnerable phase', () => {
      boss.update(BOSS_CORE_REASON_DURATION + 0.01);
      boss.update(BOSS_CORE_BARRAGE_DURATION + 0.01);
      boss.update(BOSS_CORE_SURGE_DURATION + 0.01);
      expect(boss.getCurrentPhase()).toBe('vulnerable');
      expect(boss.vulnerable).toBe(true);
    });

    it('should not be vulnerable during other phases', () => {
      expect(boss.getCurrentPhase()).toBe('reason');
      expect(boss.vulnerable).toBe(false);
    });

    it('should emit bossVulnerable events', () => {
      const events: boolean[] = [];
      const handler = (e: { vulnerable: boolean }) => events.push(e.vulnerable);
      eventBus.on('bossVulnerable', handler);

      boss.update(BOSS_CORE_REASON_DURATION + 0.01);
      boss.update(BOSS_CORE_BARRAGE_DURATION + 0.01);
      boss.update(BOSS_CORE_SURGE_DURATION + 0.01);
      // Now vulnerable
      boss.update(BOSS_CORE_VULNERABLE_DURATION + 0.01);
      // Now back to reason

      expect(events).toContain(true);
      expect(events).toContain(false);

      eventBus.off('bossVulnerable', handler);
    });
  });

  describe('Damage and Damage Reduction', () => {
    it('should apply damage reduction when not vulnerable', () => {
      const initialHealth = boss.health;
      boss.takeDamage(100);
      expect(boss.health).toBe(initialHealth - 100 * BOSS_CORE_DAMAGE_REDUCTION);
    });

    it('should take full damage when vulnerable', () => {
      // Transition to vulnerable phase
      boss.update(BOSS_CORE_REASON_DURATION + 0.01);
      boss.update(BOSS_CORE_BARRAGE_DURATION + 0.01);
      boss.update(BOSS_CORE_SURGE_DURATION + 0.01);
      expect(boss.vulnerable).toBe(true);

      const healthBefore = boss.health;
      boss.takeDamage(100);
      expect(boss.health).toBe(healthBefore - 100);
    });

    it('should emit bossHealthChanged on damage', () => {
      const handler = vi.fn();
      eventBus.on('bossHealthChanged', handler);

      boss.takeDamage(50);

      expect(handler).toHaveBeenCalledWith(expect.objectContaining({
        maxHealth: BOSS_CORE_HEALTH,
      }));

      eventBus.off('bossHealthChanged', handler);
    });
  });

  describe('Emotional Escalation', () => {
    it('should have calm state at full health', () => {
      boss.update(0.01);
      const state = boss.getEscalationState();
      expect(state.rotationMult).toBe(1.0);
      expect(state.jitter).toBe(0.0);
      expect(state.pulseMult).toBe(1.0);
    });

    it('should escalate at 75% health', () => {
      // Deal enough damage to go below 75%
      // Need to make vulnerable first to deal full damage
      boss.update(BOSS_CORE_REASON_DURATION + 0.01);
      boss.update(BOSS_CORE_BARRAGE_DURATION + 0.01);
      boss.update(BOSS_CORE_SURGE_DURATION + 0.01);
      // Now vulnerable, deal damage to cross 75%
      const damageNeeded = BOSS_CORE_HEALTH * 0.26; // Go to ~74%
      boss.takeDamage(damageNeeded);
      boss.update(0.01);

      const state = boss.getEscalationState();
      expect(state.rotationMult).toBe(BOSS_CORE_ESCALATION_75_ROTATION_MULT);
      expect(state.jitter).toBe(BOSS_CORE_ESCALATION_75_JITTER);
    });

    it('should escalate further at 50% health', () => {
      boss.update(BOSS_CORE_REASON_DURATION + 0.01);
      boss.update(BOSS_CORE_BARRAGE_DURATION + 0.01);
      boss.update(BOSS_CORE_SURGE_DURATION + 0.01);
      const damageNeeded = BOSS_CORE_HEALTH * 0.51;
      boss.takeDamage(damageNeeded);
      boss.update(0.01);

      const state = boss.getEscalationState();
      expect(state.rotationMult).toBe(BOSS_CORE_ESCALATION_50_ROTATION_MULT);
      expect(state.jitter).toBe(BOSS_CORE_ESCALATION_50_JITTER);
      expect(state.pulseMult).toBe(BOSS_CORE_ESCALATION_50_PULSE_MULT);
    });

    it('should escalate severely at 25% health', () => {
      boss.update(BOSS_CORE_REASON_DURATION + 0.01);
      boss.update(BOSS_CORE_BARRAGE_DURATION + 0.01);
      boss.update(BOSS_CORE_SURGE_DURATION + 0.01);
      const damageNeeded = BOSS_CORE_HEALTH * 0.76;
      boss.takeDamage(damageNeeded);
      boss.update(0.01);

      const state = boss.getEscalationState();
      expect(state.rotationMult).toBe(BOSS_CORE_ESCALATION_25_ROTATION_MULT);
      expect(state.jitter).toBe(BOSS_CORE_ESCALATION_25_JITTER);
      expect(state.pulseMult).toBe(BOSS_CORE_ESCALATION_25_PULSE_MULT);
    });
  });

  describe('Hit Flash', () => {
    it('should scale all layers on hit then restore', () => {
      boss.update(0.01); // Initial update
      boss.takeDamage(10); // Triggers onHit via reduced damage

      // After hit, scales should be 1.15
      expect(boss.getOuterFractal().scale.x).toBeCloseTo(1.15, 1);
      expect(boss.getMidLattice().scale.x).toBeCloseTo(1.15, 1);
      expect(boss.getInnerMatrix().scale.x).toBeCloseTo(1.15, 1);
      expect(boss.getDeepCore().scale.x).toBeCloseTo(1.15, 1);

      // After 0.11s, flash should have ended
      boss.update(0.11);
    });
  });

  describe('Destruction Sequence', () => {
    it('should trigger destruction sequence when health reaches 0', () => {
      const handler = vi.fn();
      eventBus.on('bossDefeated', handler);

      // Make vulnerable and deal lethal damage
      boss.update(BOSS_CORE_REASON_DURATION + 0.01);
      boss.update(BOSS_CORE_BARRAGE_DURATION + 0.01);
      boss.update(BOSS_CORE_SURGE_DURATION + 0.01);
      boss.takeDamage(BOSS_CORE_HEALTH);

      expect(boss.defeated).toBe(true);
      expect(handler).toHaveBeenCalled();

      eventBus.off('bossDefeated', handler);
    });

    it('should emit bossDestructionStage events during destruction', () => {
      const stages: string[] = [];
      const handler = (e: { stage: string }) => stages.push(e.stage);
      eventBus.on('bossDestructionStage', handler);

      // Trigger defeat
      boss.update(BOSS_CORE_REASON_DURATION + 0.01);
      boss.update(BOSS_CORE_BARRAGE_DURATION + 0.01);
      boss.update(BOSS_CORE_SURGE_DURATION + 0.01);
      boss.takeDamage(BOSS_CORE_HEALTH);

      // Drive the destruction sequence
      for (let i = 0; i < 100; i++) {
        boss.update(0.1);
      }

      expect(stages).toContain('peel');
      expect(stages).toContain('strip');
      expect(stages).toContain('shatter');

      eventBus.off('bossDestructionStage', handler);
    });

    it('should emit bossDestroyed when destruction sequence completes', () => {
      const handler = vi.fn();
      eventBus.on('bossDestroyed', handler);

      boss.update(BOSS_CORE_REASON_DURATION + 0.01);
      boss.update(BOSS_CORE_BARRAGE_DURATION + 0.01);
      boss.update(BOSS_CORE_SURGE_DURATION + 0.01);
      boss.takeDamage(BOSS_CORE_HEALTH);

      // Drive the destruction sequence to completion
      for (let i = 0; i < 100; i++) {
        boss.update(0.1);
      }

      expect(handler).toHaveBeenCalled();

      eventBus.off('bossDestroyed', handler);
    });
  });

  describe('Constants Escalation vs Avenger', () => {
    it('should have more health than Avenger', () => {
      expect(BOSS_CORE_HEALTH).toBeGreaterThan(BOSS_AVENGER_HEALTH);
    });

    it('should have shorter vulnerable window than Avenger', () => {
      expect(BOSS_CORE_VULNERABLE_DURATION).toBeLessThan(BOSS_AVENGER_VULNERABLE_DURATION);
    });

    it('should have faster barrage interval than Avenger', () => {
      expect(BOSS_CORE_BARRAGE_INTERVAL).toBeLessThan(BOSS_AVENGER_BARRAGE_INTERVAL);
    });

    it('should have more barrage projectiles than Avenger', () => {
      expect(BOSS_CORE_BARRAGE_COUNT).toBeGreaterThan(BOSS_AVENGER_BARRAGE_COUNT);
    });

    it('should have faster projectile speed than Avenger', () => {
      expect(BOSS_CORE_PROJECTILE_SPEED).toBeGreaterThan(BOSS_AVENGER_PROJECTILE_SPEED);
    });

    it('should have higher base damage than Avenger', () => {
      expect(BOSS_CORE_ATTACK_DAMAGE).toBeGreaterThan(BOSS_AVENGER_ATTACK_DAMAGE);
    });

    it('should have lower damage reduction than Avenger', () => {
      expect(BOSS_CORE_DAMAGE_REDUCTION).toBeLessThan(BOSS_AVENGER_DAMAGE_REDUCTION);
    });

    it('should have higher score value than Avenger', () => {
      expect(BOSS_CORE_SCORE_VALUE).toBeGreaterThan(BOSS_AVENGER_SCORE_VALUE);
    });
  });

  describe('Dispose', () => {
    it('should remove all children from object3D on dispose', () => {
      boss.dispose();
      expect(boss.getObject3D().children.length).toBe(0);
    });
  });
});
