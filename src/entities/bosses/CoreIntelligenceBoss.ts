/**
 * CoreIntelligenceBoss -- The Level 3 boss: an enormous fractal geometric entity.
 *
 * Four concentric wireframe dodecahedron layers that rotate with increasing
 * complexity. The source. A mind. The final AI.
 *
 * GDD: "Eerily calm -> increasingly unhinged -- the source, the final AI.
 * Starts with measured attacks, may try to reason with you. As damaged,
 * becomes desperate, glitchy, chaotic."
 *
 * Narrative: "An enormous, fractal geometric entity at the center of the AI
 * network. Not a soldier or a guardian -- a mind. The intelligence that
 * orchestrated the takeover."
 *
 * Created by: Story 5-4
 */

import * as THREE from 'three';
import { Boss } from './Boss.ts';
import { DestructionSequence } from './DestructionSequence.ts';
import type { DestructionStage } from './DestructionSequence.ts';
import { eventBus } from '../../core/GameEvents.ts';
import { Logger } from '../../core/Logger.ts';
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
  BOSS_CORE_PULSE_RATE,
  BOSS_CORE_PULSE_AMPLITUDE,
  BOSS_CORE_REASON_DURATION,
  BOSS_CORE_REASON_INTERVAL,
  BOSS_CORE_REASON_DAMAGE,
  BOSS_CORE_BARRAGE_DURATION,
  BOSS_CORE_BARRAGE_INTERVAL,
  BOSS_CORE_BARRAGE_COUNT,
  BOSS_CORE_BARRAGE_SPREAD,
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
  BOSS_DESTRUCTION_PEEL_DURATION,
  BOSS_DESTRUCTION_STRIP_DURATION,
  BOSS_DESTRUCTION_SHATTER_DURATION,
  BOSS_DESTRUCTION_PEEL_SCALE_END,
  BOSS_DESTRUCTION_STRIP_SCALE_END,
  BOSS_DESTRUCTION_ROTATION_MULTIPLIER_PEEL,
  BOSS_DESTRUCTION_ROTATION_MULTIPLIER_STRIP,
  BOSS_DESTRUCTION_SHATTER_PULSE_FREQUENCY,
} from '../../config/constants.ts';
import type { VectorMaterials } from '../../rendering/VectorMaterials.ts';

export type CorePhaseType = 'reason' | 'barrage' | 'surge' | 'vulnerable';

export class CoreIntelligenceBoss extends Boss {
  // Geometry layers (4 layers -- unique to Core Intelligence)
  private outerFractal: THREE.Object3D;
  private midLattice: THREE.Object3D;
  private innerMatrix: THREE.Object3D;
  private deepCore: THREE.Object3D;

  // Materials (kept for independent opacity/color control)
  private outerMaterial: THREE.LineBasicMaterial;
  private midMaterial: THREE.LineBasicMaterial;
  private innerMaterial: THREE.LineBasicMaterial;
  private deepMaterial: THREE.LineBasicMaterial;

  // Geometries (kept for disposal)
  private outerGeometry: THREE.EdgesGeometry;
  private midGeometry: THREE.EdgesGeometry;
  private innerGeometry: THREE.EdgesGeometry;
  private deepGeometry: THREE.EdgesGeometry;
  private outerBaseGeometry: THREE.DodecahedronGeometry;
  private midBaseGeometry: THREE.DodecahedronGeometry;
  private innerBaseGeometry: THREE.DodecahedronGeometry;
  private deepBaseGeometry: THREE.DodecahedronGeometry;

  // Attack phase state machine
  private currentPhase: CorePhaseType = 'reason';
  private phaseTimer = 0;
  private attackTimer = 0;
  private elapsed = 0;

  // Hit flash
  private flashTimer = 0;
  private originalOuterScale = 1.0;
  private originalMidScale = 1.0;
  private originalInnerScale = 1.0;
  private originalDeepScale = 1.0;

  // Vulnerability visual state
  private outerOriginalOpacity = 1.0;

  // Emotional escalation state
  private currentRotationMult = 1.0;
  private currentJitter = 0.0;
  private currentPulseMult = 1.0;

  // Player position getter (decoupled from Player)
  private playerPositionGetter: () => THREE.Vector3;

  // Pre-allocated temp vectors (zero per-frame allocation)
  private tempPlayerPos = new THREE.Vector3();
  private tempAttackDir = new THREE.Vector3();
  private tempBarragePos = new THREE.Vector3();

  constructor(vectorMaterials: VectorMaterials, playerPositionGetter: () => THREE.Vector3) {
    super(BOSS_CORE_HEALTH, BOSS_CORE_SCORE_VALUE, BOSS_CORE_COLLIDER_RADIUS);

    this.playerPositionGetter = playerPositionGetter;

    // Create four geometry layers using DodecahedronGeometry (complex, fractal, alien)
    // Outer fractal: DodecahedronGeometry(12, 2)
    this.outerBaseGeometry = new THREE.DodecahedronGeometry(BOSS_CORE_OUTER_RADIUS, 2);
    this.outerGeometry = new THREE.EdgesGeometry(this.outerBaseGeometry);
    this.outerMaterial = vectorMaterials.create('boss-core-outer');
    const outerLineSegments = new THREE.LineSegments(this.outerGeometry, this.outerMaterial);
    outerLineSegments.layers.enable(BLOOM_LAYER);
    this.outerFractal = new THREE.Object3D();
    this.outerFractal.add(outerLineSegments);
    this.object3D.add(this.outerFractal);

    // Mid lattice: DodecahedronGeometry(8, 1)
    this.midBaseGeometry = new THREE.DodecahedronGeometry(BOSS_CORE_MID_RADIUS, 1);
    this.midGeometry = new THREE.EdgesGeometry(this.midBaseGeometry);
    this.midMaterial = vectorMaterials.create('boss-core-mid');
    const midLineSegments = new THREE.LineSegments(this.midGeometry, this.midMaterial);
    midLineSegments.layers.enable(BLOOM_LAYER);
    this.midLattice = new THREE.Object3D();
    this.midLattice.add(midLineSegments);
    this.object3D.add(this.midLattice);

    // Inner matrix: DodecahedronGeometry(5, 0)
    this.innerBaseGeometry = new THREE.DodecahedronGeometry(BOSS_CORE_INNER_RADIUS, 0);
    this.innerGeometry = new THREE.EdgesGeometry(this.innerBaseGeometry);
    this.innerMaterial = vectorMaterials.create('boss-core-inner');
    const innerLineSegments = new THREE.LineSegments(this.innerGeometry, this.innerMaterial);
    innerLineSegments.layers.enable(BLOOM_LAYER);
    this.innerMatrix = new THREE.Object3D();
    this.innerMatrix.add(innerLineSegments);
    this.object3D.add(this.innerMatrix);

    // Deep core: DodecahedronGeometry(2.5, 0) -- brighter opacity
    this.deepBaseGeometry = new THREE.DodecahedronGeometry(BOSS_CORE_DEEP_RADIUS, 0);
    this.deepGeometry = new THREE.EdgesGeometry(this.deepBaseGeometry);
    this.deepMaterial = vectorMaterials.create('boss-core-deep', 0.2);
    const deepLineSegments = new THREE.LineSegments(this.deepGeometry, this.deepMaterial);
    deepLineSegments.layers.enable(BLOOM_LAYER);
    this.deepCore = new THREE.Object3D();
    this.deepCore.add(deepLineSegments);
    this.object3D.add(this.deepCore);

    // Emit initial phase
    eventBus.emit('bossPhaseChanged', { phase: this.currentPhase });

    Logger.info('Boss', 'CoreIntelligenceBoss created', {
      health: BOSS_CORE_HEALTH,
      phase: this.currentPhase,
    });
  }

  updateBoss(dt: number): void {
    this.elapsed += dt;

    // Update emotional escalation based on health fraction
    this.updateEscalation();

    const rotSpeed = BOSS_CORE_ROTATION_SPEED * this.currentRotationMult;

    // Layer animation -- measured rotation that speeds up with emotional escalation
    // Outer fractal: slow counter-rotation on Y and Z
    this.outerFractal.rotation.y -= rotSpeed * dt;
    this.outerFractal.rotation.z += rotSpeed * 0.3 * dt;
    // Mid lattice: rotation on X and Y
    this.midLattice.rotation.x += rotSpeed * 0.6 * dt;
    this.midLattice.rotation.y += rotSpeed * 0.4 * dt;
    // Inner matrix: rotation on X
    this.innerMatrix.rotation.x -= rotSpeed * 0.8 * dt;
    // Deep core: pulsing scale with escalation
    const pulseRate = BOSS_CORE_PULSE_RATE * this.currentPulseMult;
    const pulse = Math.sin(this.elapsed * pulseRate * Math.PI * 2);
    const coreScale = 1.0 + pulse * BOSS_CORE_PULSE_AMPLITUDE;
    this.deepCore.scale.setScalar(coreScale);

    // Apply jitter to all layers (emotional escalation)
    if (this.currentJitter > 0) {
      const jitter = this.currentJitter;
      this.outerFractal.position.set(
        (Math.random() - 0.5) * jitter,
        (Math.random() - 0.5) * jitter,
        (Math.random() - 0.5) * jitter,
      );
      this.midLattice.position.set(
        (Math.random() - 0.5) * jitter,
        (Math.random() - 0.5) * jitter,
        (Math.random() - 0.5) * jitter,
      );
      this.innerMatrix.position.set(
        (Math.random() - 0.5) * jitter,
        (Math.random() - 0.5) * jitter,
        (Math.random() - 0.5) * jitter,
      );
      this.deepCore.position.set(
        (Math.random() - 0.5) * jitter * 0.5,
        (Math.random() - 0.5) * jitter * 0.5,
        (Math.random() - 0.5) * jitter * 0.5,
      );

      // Below 25%: outer opacity flickers
      if (this.getHealthFraction() <= 0.25) {
        this.outerMaterial.opacity = 0.5 + Math.random() * 0.5;
        this.outerMaterial.transparent = true;
      }
    } else {
      // Reset positions when no jitter
      this.outerFractal.position.set(0, 0, 0);
      this.midLattice.position.set(0, 0, 0);
      this.innerMatrix.position.set(0, 0, 0);
      this.deepCore.position.set(0, 0, 0);
    }

    // Hit flash timer
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      if (this.flashTimer <= 0) {
        this.outerFractal.scale.setScalar(this.originalOuterScale);
        this.midLattice.scale.setScalar(this.originalMidScale);
        this.innerMatrix.scale.setScalar(this.originalInnerScale);
        this.deepCore.scale.setScalar(this.originalDeepScale);
      }
    }

    // Attack phase state machine
    this.phaseTimer += dt;
    switch (this.currentPhase) {
      case 'reason':
        this.updateReason(dt);
        if (this.phaseTimer >= BOSS_CORE_REASON_DURATION) this.transitionPhase('barrage');
        break;
      case 'barrage':
        this.updateBarrage(dt);
        if (this.phaseTimer >= BOSS_CORE_BARRAGE_DURATION) this.transitionPhase('surge');
        break;
      case 'surge':
        this.updateSurge(dt);
        if (this.phaseTimer >= BOSS_CORE_SURGE_DURATION) this.transitionPhase('vulnerable');
        break;
      case 'vulnerable':
        if (this.phaseTimer >= BOSS_CORE_VULNERABLE_DURATION) this.transitionPhase('reason');
        break;
    }
  }

  private updateEscalation(): void {
    const healthFrac = this.getHealthFraction();

    if (healthFrac <= 0.25) {
      this.currentRotationMult = BOSS_CORE_ESCALATION_25_ROTATION_MULT;
      this.currentJitter = BOSS_CORE_ESCALATION_25_JITTER;
      this.currentPulseMult = BOSS_CORE_ESCALATION_25_PULSE_MULT;
    } else if (healthFrac <= 0.50) {
      this.currentRotationMult = BOSS_CORE_ESCALATION_50_ROTATION_MULT;
      this.currentJitter = BOSS_CORE_ESCALATION_50_JITTER;
      this.currentPulseMult = BOSS_CORE_ESCALATION_50_PULSE_MULT;
    } else if (healthFrac <= 0.75) {
      this.currentRotationMult = BOSS_CORE_ESCALATION_75_ROTATION_MULT;
      this.currentJitter = BOSS_CORE_ESCALATION_75_JITTER;
      this.currentPulseMult = 1.0;
    } else {
      this.currentRotationMult = 1.0;
      this.currentJitter = 0.0;
      this.currentPulseMult = 1.0;
    }
  }

  private updateReason(dt: number): void {
    // Slow, aimed projectiles -- the boss is "talking," measured and calm
    this.attackTimer += dt;
    if (this.attackTimer >= BOSS_CORE_REASON_INTERVAL) {
      this.attackTimer -= BOSS_CORE_REASON_INTERVAL;

      this.tempPlayerPos.copy(this.playerPositionGetter());
      const bossPos = this.object3D.position;
      this.tempAttackDir.subVectors(this.tempPlayerPos, bossPos).normalize();

      const positions = [{
        x: bossPos.x + this.tempAttackDir.x * BOSS_CORE_OUTER_RADIUS,
        y: bossPos.y + this.tempAttackDir.y * BOSS_CORE_OUTER_RADIUS,
        z: bossPos.z + this.tempAttackDir.z * BOSS_CORE_OUTER_RADIUS,
      }];

      eventBus.emit('bossAttack', {
        positions,
        targetPosition: {
          x: this.tempPlayerPos.x,
          y: this.tempPlayerPos.y,
          z: this.tempPlayerPos.z,
        },
        speed: BOSS_CORE_PROJECTILE_SPEED,
        damage: BOSS_CORE_REASON_DAMAGE,
      });
    }
  }

  private updateBarrage(dt: number): void {
    this.attackTimer += dt;
    if (this.attackTimer >= BOSS_CORE_BARRAGE_INTERVAL) {
      this.attackTimer -= BOSS_CORE_BARRAGE_INTERVAL;

      this.tempPlayerPos.copy(this.playerPositionGetter());
      const bossPos = this.object3D.position;

      this.tempAttackDir.subVectors(this.tempPlayerPos, bossPos).normalize();

      const positions: Array<{ x: number; y: number; z: number }> = [];
      for (let i = 0; i < BOSS_CORE_BARRAGE_COUNT; i++) {
        const spreadOffset = (i - (BOSS_CORE_BARRAGE_COUNT - 1) / 2) * BOSS_CORE_BARRAGE_SPREAD;

        this.tempBarragePos.copy(this.tempAttackDir);
        const cosSpread = Math.cos(spreadOffset);
        const sinSpread = Math.sin(spreadOffset);
        const origX = this.tempBarragePos.x;
        const origZ = this.tempBarragePos.z;
        this.tempBarragePos.x = origX * cosSpread - origZ * sinSpread;
        this.tempBarragePos.z = origX * sinSpread + origZ * cosSpread;
        this.tempBarragePos.normalize();

        positions.push({
          x: bossPos.x + this.tempBarragePos.x * BOSS_CORE_OUTER_RADIUS,
          y: bossPos.y + this.tempBarragePos.y * BOSS_CORE_OUTER_RADIUS,
          z: bossPos.z + this.tempBarragePos.z * BOSS_CORE_OUTER_RADIUS,
        });
      }

      eventBus.emit('bossAttack', {
        positions,
        targetPosition: {
          x: this.tempPlayerPos.x,
          y: this.tempPlayerPos.y,
          z: this.tempPlayerPos.z,
        },
        speed: BOSS_CORE_PROJECTILE_SPEED,
        damage: BOSS_CORE_ATTACK_DAMAGE,
      });
    }
  }

  private updateSurge(dt: number): void {
    // Radial burst pattern -- 8 evenly-spaced projectiles per burst
    this.attackTimer += dt;
    if (this.attackTimer >= BOSS_CORE_SURGE_BURST_INTERVAL) {
      this.attackTimer -= BOSS_CORE_SURGE_BURST_INTERVAL;

      this.tempPlayerPos.copy(this.playerPositionGetter());
      const bossPos = this.object3D.position;

      const positions: Array<{ x: number; y: number; z: number }> = [];
      for (let i = 0; i < BOSS_CORE_SURGE_BURST_COUNT; i++) {
        const angle = (i / BOSS_CORE_SURGE_BURST_COUNT) * Math.PI * 2;
        const dirX = Math.cos(angle);
        const dirZ = Math.sin(angle);

        positions.push({
          x: bossPos.x + dirX * BOSS_CORE_OUTER_RADIUS,
          y: bossPos.y,
          z: bossPos.z + dirZ * BOSS_CORE_OUTER_RADIUS,
        });
      }

      eventBus.emit('bossAttack', {
        positions,
        targetPosition: {
          x: this.tempPlayerPos.x,
          y: this.tempPlayerPos.y,
          z: this.tempPlayerPos.z,
        },
        speed: BOSS_CORE_PROJECTILE_SPEED,
        damage: BOSS_CORE_SURGE_DAMAGE,
      });
    }

    // Visual pulse effect during surge -- layers expand slightly
    const surgeProgress = this.phaseTimer / BOSS_CORE_SURGE_DURATION;
    const surgePulse = Math.sin(surgeProgress * Math.PI * 4) * 0.1;
    this.outerFractal.scale.setScalar(1.0 + surgePulse);
  }

  private transitionPhase(newPhase: CorePhaseType): void {
    // If leaving vulnerable phase, restore visuals
    if (this.currentPhase === 'vulnerable') {
      this.vulnerable = false;
      this.outerMaterial.opacity = this.outerOriginalOpacity;
      this.outerMaterial.transparent = false;
      this.outerMaterial.depthWrite = true;
      eventBus.emit('bossVulnerable', { vulnerable: false });
    }

    // Reset surge visual if leaving surge phase
    if (this.currentPhase === 'surge') {
      this.outerFractal.scale.setScalar(1.0);
    }

    this.currentPhase = newPhase;
    this.phaseTimer = 0;
    this.attackTimer = 0;

    // If entering vulnerable phase, set visuals
    if (newPhase === 'vulnerable') {
      this.vulnerable = true;
      this.outerOriginalOpacity = this.outerMaterial.opacity;
      this.outerMaterial.opacity = 0.3;
      this.outerMaterial.transparent = true;
      this.outerMaterial.depthWrite = false;
      eventBus.emit('bossVulnerable', { vulnerable: true });
    }

    eventBus.emit('bossPhaseChanged', { phase: newPhase });

    Logger.debug('Boss', `Core Intelligence phase transition: ${newPhase}`, { phase: newPhase });
  }

  /**
   * Override takeDamage to apply damage reduction during non-vulnerable phases.
   */
  takeDamage(amount: number): void {
    if (this.defeated) return;

    const effectiveAmount = this.vulnerable
      ? amount
      : amount * BOSS_CORE_DAMAGE_REDUCTION;

    super.takeDamage(effectiveAmount);
  }

  onHit(): void {
    // Brief flash on all four layers -- scale each to 1.15 for 0.1 seconds
    this.originalOuterScale = this.outerFractal.scale.x;
    this.originalMidScale = this.midLattice.scale.x;
    this.originalInnerScale = this.innerMatrix.scale.x;
    this.originalDeepScale = this.deepCore.scale.x;

    this.outerFractal.scale.setScalar(1.15);
    this.midLattice.scale.setScalar(1.15);
    this.innerMatrix.scale.setScalar(1.15);
    this.deepCore.scale.setScalar(1.15);
    this.flashTimer = 0.1;
  }

  onDefeated(): void {
    // Emit bossDefeated event
    eventBus.emit('bossDefeated', {
      position: {
        x: this.object3D.position.x,
        y: this.object3D.position.y,
        z: this.object3D.position.z,
      },
      scoreValue: this.scoreValue,
    });

    Logger.info('Boss', 'CoreIntelligenceBoss defeated, starting destruction sequence', {
      scoreValue: this.scoreValue,
    });

    // Capture mid material HSL for interpolation during strip stage
    const midHSL = { h: 0, s: 0, l: 0 };
    this.midMaterial.color.getHSL(midHSL);
    const baseMidHue = midHSL.h;
    const baseMidSaturation = midHSL.s;
    const baseMidLightness = midHSL.l;

    const getBossPos = () => ({
      x: this.object3D.position.x,
      y: this.object3D.position.y,
      z: this.object3D.position.z,
    });

    // Define three destruction stages: peel, strip, shatter
    // Core Intelligence unique: all four layers flash white in shatter
    const stages: DestructionStage[] = [
      // === PEEL STAGE ===
      {
        name: 'peel',
        duration: BOSS_DESTRUCTION_PEEL_DURATION,
        onStart: () => {
          this.outerMaterial.transparent = true;
          this.outerMaterial.depthWrite = false;
          Logger.info('Boss', 'Core Intelligence destruction peel stage started');
        },
        onUpdate: (progress: number, dt: number) => {
          this.outerFractal.scale.setScalar(1.0 + progress * (BOSS_DESTRUCTION_PEEL_SCALE_END - 1.0));
          this.outerMaterial.opacity = 1.0 - progress;
          this.outerFractal.rotation.y -= BOSS_CORE_ROTATION_SPEED * BOSS_DESTRUCTION_ROTATION_MULTIPLIER_PEEL * dt;
          eventBus.emit('bossDestructionStage', { stage: 'peel', progress, position: getBossPos() });
        },
        onEnd: () => {
          this.object3D.remove(this.outerFractal);
          this.outerGeometry.dispose();
          this.outerBaseGeometry.dispose();
          this.outerMaterial.dispose();
          Logger.info('Boss', 'Core Intelligence destruction peel stage complete - outer fractal removed');
        },
      },
      // === STRIP STAGE ===
      {
        name: 'strip',
        duration: BOSS_DESTRUCTION_STRIP_DURATION,
        onStart: () => {
          this.midMaterial.transparent = true;
          this.midMaterial.depthWrite = false;
          this.innerMaterial.transparent = true;
          this.innerMaterial.depthWrite = false;
          Logger.info('Boss', 'Core Intelligence destruction strip stage started');
        },
        onUpdate: (progress: number, dt: number) => {
          // Strip both mid lattice and inner matrix simultaneously
          this.midLattice.scale.setScalar(1.0 + progress * (BOSS_DESTRUCTION_STRIP_SCALE_END - 1.0));
          this.midMaterial.opacity = 1.0 - progress;
          this.midMaterial.color.setHSL(
            baseMidHue,
            baseMidSaturation,
            baseMidLightness + progress * (1.0 - baseMidLightness),
          );
          this.midLattice.rotation.x += BOSS_CORE_ROTATION_SPEED * BOSS_DESTRUCTION_ROTATION_MULTIPLIER_STRIP * dt;

          this.innerMatrix.scale.setScalar(1.0 + progress * (BOSS_DESTRUCTION_STRIP_SCALE_END - 1.0) * 0.7);
          this.innerMaterial.opacity = 1.0 - progress;

          eventBus.emit('bossDestructionStage', { stage: 'strip', progress, position: getBossPos() });
        },
        onEnd: () => {
          this.object3D.remove(this.midLattice);
          this.object3D.remove(this.innerMatrix);
          this.midGeometry.dispose();
          this.midBaseGeometry.dispose();
          this.midMaterial.dispose();
          this.innerGeometry.dispose();
          this.innerBaseGeometry.dispose();
          this.innerMaterial.dispose();
          Logger.info('Boss', 'Core Intelligence destruction strip stage complete - mid and inner removed');
        },
      },
      // === SHATTER STAGE ===
      {
        name: 'shatter',
        duration: BOSS_DESTRUCTION_SHATTER_DURATION,
        onStart: () => {
          // Pure white flash on the deep core -- the final boss unique
          this.deepMaterial.color.setHSL(0, 0, 1.0);
          this.deepMaterial.transparent = true;
          Logger.info('Boss', 'Core Intelligence destruction shatter stage started - pure white flash');
        },
        onUpdate: (progress: number, _dt: number) => {
          const shatterPulse = Math.sin(progress * BOSS_DESTRUCTION_SHATTER_PULSE_FREQUENCY * Math.PI);
          this.deepCore.scale.setScalar(1.0 + shatterPulse * (1.0 - progress));
          if (progress > 0.5) {
            this.deepMaterial.opacity = 1.0 - ((progress - 0.5) * 2.0);
          } else {
            this.deepMaterial.opacity = 1.0;
          }
          this.deepMaterial.depthWrite = false;
          eventBus.emit('bossDestructionStage', { stage: 'shatter', progress, position: getBossPos() });
        },
        onEnd: () => {
          this.object3D.remove(this.deepCore);
          this.deepGeometry.dispose();
          this.deepBaseGeometry.dispose();
          this.deepMaterial.dispose();
          eventBus.emit('bossDestructionStage', { stage: 'shatter', progress: 1.0, position: getBossPos() });
          Logger.info('Boss', 'Core Intelligence destruction shatter stage complete - deep core removed');
        },
      },
    ];

    this.destructionSequence = new DestructionSequence(stages);
  }

  /** Returns the current attack phase */
  getCurrentPhase(): CorePhaseType {
    return this.currentPhase;
  }

  /** Returns the phase timer value */
  getPhaseTimer(): number {
    return this.phaseTimer;
  }

  /** Returns geometry layer references for testing */
  getOuterFractal(): THREE.Object3D {
    return this.outerFractal;
  }

  getMidLattice(): THREE.Object3D {
    return this.midLattice;
  }

  getInnerMatrix(): THREE.Object3D {
    return this.innerMatrix;
  }

  getDeepCore(): THREE.Object3D {
    return this.deepCore;
  }

  /** Returns materials for testing */
  getOuterMaterial(): THREE.LineBasicMaterial {
    return this.outerMaterial;
  }

  getMidMaterial(): THREE.LineBasicMaterial {
    return this.midMaterial;
  }

  getInnerMaterial(): THREE.LineBasicMaterial {
    return this.innerMaterial;
  }

  getDeepMaterial(): THREE.LineBasicMaterial {
    return this.deepMaterial;
  }

  /** Returns emotional escalation state for testing */
  getEscalationState(): { rotationMult: number; jitter: number; pulseMult: number } {
    return {
      rotationMult: this.currentRotationMult,
      jitter: this.currentJitter,
      pulseMult: this.currentPulseMult,
    };
  }

  dispose(): void {
    this.object3D.remove(this.outerFractal);
    this.object3D.remove(this.midLattice);
    this.object3D.remove(this.innerMatrix);
    this.object3D.remove(this.deepCore);

    this.outerGeometry.dispose();
    this.midGeometry.dispose();
    this.innerGeometry.dispose();
    this.deepGeometry.dispose();
    this.outerBaseGeometry.dispose();
    this.midBaseGeometry.dispose();
    this.innerBaseGeometry.dispose();
    this.deepBaseGeometry.dispose();

    this.outerMaterial.dispose();
    this.midMaterial.dispose();
    this.innerMaterial.dispose();
    this.deepMaterial.dispose();

    Logger.info('Boss', 'CoreIntelligenceBoss disposed');
  }
}
