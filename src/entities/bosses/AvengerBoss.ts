/**
 * AvengerBoss -- The Level 2 boss: a sleek, angular, aggressive construct.
 *
 * Three concentric wireframe octahedron layers that rotate rapidly,
 * creating a blade-like, spinning entity.
 *
 * GDD: "Aggressive, fast, angry -- KNOWS what you did to Boss 1.
 * Relentless attacks, shorter windows, punishing aggression."
 *
 * Narrative: "A sleek, angular, aggressive construct -- faster and more
 * dangerous than the Gatekeeper. Born from the network's response to
 * Cipher's intrusion."
 *
 * Created by: Story 5-2
 */

import * as THREE from 'three';
import { Boss } from './Boss.ts';
import { DestructionSequence } from './DestructionSequence.ts';
import type { DestructionStage } from './DestructionSequence.ts';
import { eventBus } from '../../core/GameEvents.ts';
import { Logger } from '../../core/Logger.ts';
import {
  BLOOM_LAYER,
  BOSS_AVENGER_HEALTH,
  BOSS_AVENGER_COLLIDER_RADIUS,
  BOSS_AVENGER_SCORE_VALUE,
  BOSS_AVENGER_OUTER_RADIUS,
  BOSS_AVENGER_MID_RADIUS,
  BOSS_AVENGER_CORE_RADIUS,
  BOSS_AVENGER_ROTATION_SPEED,
  BOSS_AVENGER_CORE_PULSE_RATE,
  BOSS_AVENGER_CORE_PULSE_AMPLITUDE,
  BOSS_AVENGER_RUSH_DURATION,
  BOSS_AVENGER_RUSH_CHARGE_SPEED,
  BOSS_AVENGER_RUSH_PROJECTILE_INTERVAL,
  BOSS_AVENGER_RUSH_DAMAGE,
  BOSS_AVENGER_BARRAGE_DURATION,
  BOSS_AVENGER_BARRAGE_INTERVAL,
  BOSS_AVENGER_BARRAGE_COUNT,
  BOSS_AVENGER_BARRAGE_SPREAD,
  BOSS_AVENGER_VULNERABLE_DURATION,
  BOSS_AVENGER_DAMAGE_REDUCTION,
  BOSS_AVENGER_ATTACK_DAMAGE,
  BOSS_AVENGER_PROJECTILE_SPEED,
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

export type AvengerPhaseType = 'rush' | 'barrage' | 'vulnerable';

export class AvengerBoss extends Boss {
  // Geometry layers
  private outerSpines: THREE.Object3D;
  private midBlades: THREE.Object3D;
  private innerCore: THREE.Object3D;

  // Materials (kept for independent opacity/color control)
  private outerMaterial: THREE.LineBasicMaterial;
  private midMaterial: THREE.LineBasicMaterial;
  private coreMaterial: THREE.LineBasicMaterial;

  // Geometries (kept for disposal)
  private outerGeometry: THREE.EdgesGeometry;
  private midGeometry: THREE.EdgesGeometry;
  private coreGeometry: THREE.EdgesGeometry;
  private outerBaseGeometry: THREE.OctahedronGeometry;
  private midBaseGeometry: THREE.OctahedronGeometry;
  private coreBaseGeometry: THREE.OctahedronGeometry;

  // Attack phase state machine
  private currentPhase: AvengerPhaseType = 'rush';
  private phaseTimer = 0;
  private attackTimer = 0;
  private elapsed = 0;

  // Rush phase state
  private rushStartPosition = new THREE.Vector3();
  private rushDirection = new THREE.Vector3();

  // Hit flash
  private flashTimer = 0;
  private originalOuterScale = 1.0;
  private originalMidScale = 1.0;
  private originalCoreScale = 1.0;

  // Vulnerability visual state
  private outerOriginalOpacity = 1.0;

  // Player position getter (decoupled from Player)
  private playerPositionGetter: () => THREE.Vector3;

  // Pre-allocated temp vectors (zero per-frame allocation)
  private tempPlayerPos = new THREE.Vector3();
  private tempAttackDir = new THREE.Vector3();
  private tempBarragePos = new THREE.Vector3();

  constructor(vectorMaterials: VectorMaterials, playerPositionGetter: () => THREE.Vector3) {
    super(BOSS_AVENGER_HEALTH, BOSS_AVENGER_SCORE_VALUE, BOSS_AVENGER_COLLIDER_RADIUS);

    this.playerPositionGetter = playerPositionGetter;

    // Create three geometry layers using OctahedronGeometry (angular, aggressive)
    // Outer spines: OctahedronGeometry(9, 1)
    this.outerBaseGeometry = new THREE.OctahedronGeometry(BOSS_AVENGER_OUTER_RADIUS, 1);
    this.outerGeometry = new THREE.EdgesGeometry(this.outerBaseGeometry);
    this.outerMaterial = vectorMaterials.create('boss-avenger-outer');
    const outerLineSegments = new THREE.LineSegments(this.outerGeometry, this.outerMaterial);
    outerLineSegments.layers.enable(BLOOM_LAYER);
    this.outerSpines = new THREE.Object3D();
    this.outerSpines.add(outerLineSegments);
    this.object3D.add(this.outerSpines);

    // Mid blades: OctahedronGeometry(6, 0)
    this.midBaseGeometry = new THREE.OctahedronGeometry(BOSS_AVENGER_MID_RADIUS, 0);
    this.midGeometry = new THREE.EdgesGeometry(this.midBaseGeometry);
    this.midMaterial = vectorMaterials.create('boss-avenger-mid');
    const midLineSegments = new THREE.LineSegments(this.midGeometry, this.midMaterial);
    midLineSegments.layers.enable(BLOOM_LAYER);
    this.midBlades = new THREE.Object3D();
    this.midBlades.add(midLineSegments);
    this.object3D.add(this.midBlades);

    // Inner core: OctahedronGeometry(3, 0)
    this.coreBaseGeometry = new THREE.OctahedronGeometry(BOSS_AVENGER_CORE_RADIUS, 0);
    this.coreGeometry = new THREE.EdgesGeometry(this.coreBaseGeometry);
    this.coreMaterial = vectorMaterials.create('boss-avenger-core', 0.15);
    const coreLineSegments = new THREE.LineSegments(this.coreGeometry, this.coreMaterial);
    coreLineSegments.layers.enable(BLOOM_LAYER);
    this.innerCore = new THREE.Object3D();
    this.innerCore.add(coreLineSegments);
    this.object3D.add(this.innerCore);

    // Store initial position for rush return
    this.rushStartPosition.copy(this.object3D.position);

    // Emit initial phase
    eventBus.emit('bossPhaseChanged', { phase: this.currentPhase });

    Logger.info('Boss', 'AvengerBoss created', {
      health: BOSS_AVENGER_HEALTH,
      phase: this.currentPhase,
    });
  }

  updateBoss(dt: number): void {
    this.elapsed += dt;

    // Layer animation -- faster rotation than Gatekeeper
    // Outer spines: rapid counter-rotation on Y and Z
    this.outerSpines.rotation.y -= BOSS_AVENGER_ROTATION_SPEED * dt;
    this.outerSpines.rotation.z += BOSS_AVENGER_ROTATION_SPEED * 0.5 * dt;
    // Mid blades: rotation on X and Y
    this.midBlades.rotation.x += BOSS_AVENGER_ROTATION_SPEED * 0.8 * dt;
    this.midBlades.rotation.y += BOSS_AVENGER_ROTATION_SPEED * 0.4 * dt;
    // Core: pulsing scale
    const pulse = Math.sin(this.elapsed * BOSS_AVENGER_CORE_PULSE_RATE * Math.PI * 2);
    const coreScale = 1.0 + pulse * BOSS_AVENGER_CORE_PULSE_AMPLITUDE;
    this.innerCore.scale.setScalar(coreScale);

    // Hit flash timer
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      if (this.flashTimer <= 0) {
        this.outerSpines.scale.setScalar(this.originalOuterScale);
        this.midBlades.scale.setScalar(this.originalMidScale);
        this.innerCore.scale.setScalar(this.originalCoreScale);
      }
    }

    // Attack phase state machine
    this.phaseTimer += dt;
    switch (this.currentPhase) {
      case 'rush':
        this.updateRush(dt);
        if (this.phaseTimer >= BOSS_AVENGER_RUSH_DURATION) this.transitionPhase('barrage');
        break;
      case 'barrage':
        this.updateBarrage(dt);
        if (this.phaseTimer >= BOSS_AVENGER_BARRAGE_DURATION) this.transitionPhase('vulnerable');
        break;
      case 'vulnerable':
        if (this.phaseTimer >= BOSS_AVENGER_VULNERABLE_DURATION) this.transitionPhase('rush');
        break;
    }
  }

  private updateRush(dt: number): void {
    // During rush, oscillate toward the player position
    this.tempPlayerPos.copy(this.playerPositionGetter());

    // Compute direction from start position toward player
    this.rushDirection.subVectors(this.tempPlayerPos, this.rushStartPosition).normalize();

    // Oscillate along the rush direction (sine wave for back-and-forth)
    const rushProgress = this.phaseTimer / BOSS_AVENGER_RUSH_DURATION;
    const chargeDistance = Math.sin(rushProgress * Math.PI) * BOSS_AVENGER_RUSH_CHARGE_SPEED * 0.5;

    this.object3D.position.copy(this.rushStartPosition);
    this.object3D.position.addScaledVector(this.rushDirection, chargeDistance);

    // Spin outer spines rapidly during rush (visual "spinning blade" effect)
    this.outerSpines.rotation.y -= BOSS_AVENGER_ROTATION_SPEED * 3.0 * dt;

    // Fire projectiles at rush interval
    this.attackTimer += dt;
    if (this.attackTimer >= BOSS_AVENGER_RUSH_PROJECTILE_INTERVAL) {
      this.attackTimer -= BOSS_AVENGER_RUSH_PROJECTILE_INTERVAL;

      const bossPos = this.object3D.position;
      this.tempAttackDir.subVectors(this.tempPlayerPos, bossPos).normalize();

      const positions = [{
        x: bossPos.x + this.tempAttackDir.x * BOSS_AVENGER_OUTER_RADIUS,
        y: bossPos.y + this.tempAttackDir.y * BOSS_AVENGER_OUTER_RADIUS,
        z: bossPos.z + this.tempAttackDir.z * BOSS_AVENGER_OUTER_RADIUS,
      }];

      eventBus.emit('bossAttack', {
        positions,
        targetPosition: {
          x: this.tempPlayerPos.x,
          y: this.tempPlayerPos.y,
          z: this.tempPlayerPos.z,
        },
        speed: BOSS_AVENGER_PROJECTILE_SPEED,
        damage: BOSS_AVENGER_RUSH_DAMAGE,
      });
    }
  }

  private updateBarrage(dt: number): void {
    this.attackTimer += dt;
    if (this.attackTimer >= BOSS_AVENGER_BARRAGE_INTERVAL) {
      this.attackTimer -= BOSS_AVENGER_BARRAGE_INTERVAL;

      this.tempPlayerPos.copy(this.playerPositionGetter());
      const bossPos = this.object3D.position;

      this.tempAttackDir.subVectors(this.tempPlayerPos, bossPos).normalize();

      const positions: Array<{ x: number; y: number; z: number }> = [];
      for (let i = 0; i < BOSS_AVENGER_BARRAGE_COUNT; i++) {
        const spreadOffset = (i - (BOSS_AVENGER_BARRAGE_COUNT - 1) / 2) * BOSS_AVENGER_BARRAGE_SPREAD;

        this.tempBarragePos.copy(this.tempAttackDir);
        const cosSpread = Math.cos(spreadOffset);
        const sinSpread = Math.sin(spreadOffset);
        const origX = this.tempBarragePos.x;
        const origZ = this.tempBarragePos.z;
        this.tempBarragePos.x = origX * cosSpread - origZ * sinSpread;
        this.tempBarragePos.z = origX * sinSpread + origZ * cosSpread;
        this.tempBarragePos.normalize();

        positions.push({
          x: bossPos.x + this.tempBarragePos.x * BOSS_AVENGER_OUTER_RADIUS,
          y: bossPos.y + this.tempBarragePos.y * BOSS_AVENGER_OUTER_RADIUS,
          z: bossPos.z + this.tempBarragePos.z * BOSS_AVENGER_OUTER_RADIUS,
        });
      }

      eventBus.emit('bossAttack', {
        positions,
        targetPosition: {
          x: this.tempPlayerPos.x,
          y: this.tempPlayerPos.y,
          z: this.tempPlayerPos.z,
        },
        speed: BOSS_AVENGER_PROJECTILE_SPEED,
        damage: BOSS_AVENGER_ATTACK_DAMAGE,
      });
    }
  }

  private transitionPhase(newPhase: AvengerPhaseType): void {
    // If leaving vulnerable phase, restore visuals
    if (this.currentPhase === 'vulnerable') {
      this.vulnerable = false;
      this.outerMaterial.opacity = this.outerOriginalOpacity;
      this.outerMaterial.transparent = false;
      this.outerMaterial.depthWrite = true;
      eventBus.emit('bossVulnerable', { vulnerable: false });
    }

    // If leaving rush phase, return to start position
    if (this.currentPhase === 'rush') {
      this.object3D.position.copy(this.rushStartPosition);
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

    // If entering rush phase, store start position
    if (newPhase === 'rush') {
      this.rushStartPosition.copy(this.object3D.position);
    }

    eventBus.emit('bossPhaseChanged', { phase: newPhase });

    Logger.debug('Boss', `Avenger phase transition: ${newPhase}`, { phase: newPhase });
  }

  /**
   * Override takeDamage to apply damage reduction during non-vulnerable phases.
   */
  takeDamage(amount: number): void {
    if (this.defeated) return;

    const effectiveAmount = this.vulnerable
      ? amount
      : amount * BOSS_AVENGER_DAMAGE_REDUCTION;

    super.takeDamage(effectiveAmount);
  }

  onHit(): void {
    // Brief flash on all three layers -- scale each layer to 1.15 for 0.1 seconds
    this.originalOuterScale = this.outerSpines.scale.x;
    this.originalMidScale = this.midBlades.scale.x;
    this.originalCoreScale = this.innerCore.scale.x;

    this.outerSpines.scale.setScalar(1.15);
    this.midBlades.scale.setScalar(1.15);
    this.innerCore.scale.setScalar(1.15);
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

    Logger.info('Boss', 'AvengerBoss defeated, starting destruction sequence', {
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
    const stages: DestructionStage[] = [
      // === PEEL STAGE ===
      {
        name: 'peel',
        duration: BOSS_DESTRUCTION_PEEL_DURATION,
        onStart: () => {
          this.outerMaterial.transparent = true;
          this.outerMaterial.depthWrite = false;
          Logger.info('Boss', 'Avenger destruction peel stage started');
        },
        onUpdate: (progress: number, dt: number) => {
          this.outerSpines.scale.setScalar(1.0 + progress * (BOSS_DESTRUCTION_PEEL_SCALE_END - 1.0));
          this.outerMaterial.opacity = 1.0 - progress;
          this.outerSpines.rotation.y -= BOSS_AVENGER_ROTATION_SPEED * BOSS_DESTRUCTION_ROTATION_MULTIPLIER_PEEL * dt;
          eventBus.emit('bossDestructionStage', { stage: 'peel', progress, position: getBossPos() });
        },
        onEnd: () => {
          this.object3D.remove(this.outerSpines);
          this.outerGeometry.dispose();
          this.outerBaseGeometry.dispose();
          this.outerMaterial.dispose();
          Logger.info('Boss', 'Avenger destruction peel stage complete - outer spines removed');
        },
      },
      // === STRIP STAGE ===
      {
        name: 'strip',
        duration: BOSS_DESTRUCTION_STRIP_DURATION,
        onStart: () => {
          this.midMaterial.transparent = true;
          this.midMaterial.depthWrite = false;
          Logger.info('Boss', 'Avenger destruction strip stage started');
        },
        onUpdate: (progress: number, dt: number) => {
          this.midBlades.scale.setScalar(1.0 + progress * (BOSS_DESTRUCTION_STRIP_SCALE_END - 1.0));
          this.midMaterial.opacity = 1.0 - progress;
          this.midMaterial.color.setHSL(
            baseMidHue,
            baseMidSaturation,
            baseMidLightness + progress * (1.0 - baseMidLightness),
          );
          this.midBlades.rotation.x += BOSS_AVENGER_ROTATION_SPEED * BOSS_DESTRUCTION_ROTATION_MULTIPLIER_STRIP * dt;
          eventBus.emit('bossDestructionStage', { stage: 'strip', progress, position: getBossPos() });
        },
        onEnd: () => {
          this.object3D.remove(this.midBlades);
          this.midGeometry.dispose();
          this.midBaseGeometry.dispose();
          this.midMaterial.dispose();
          Logger.info('Boss', 'Avenger destruction strip stage complete - mid blades removed');
        },
      },
      // === SHATTER STAGE ===
      {
        name: 'shatter',
        duration: BOSS_DESTRUCTION_SHATTER_DURATION,
        onStart: () => {
          this.coreMaterial.color.setHSL(0, 0, 1.0);
          this.coreMaterial.transparent = true;
          Logger.info('Boss', 'Avenger destruction shatter stage started - pure white flash');
        },
        onUpdate: (progress: number, _dt: number) => {
          const shatterPulse = Math.sin(progress * BOSS_DESTRUCTION_SHATTER_PULSE_FREQUENCY * Math.PI);
          this.innerCore.scale.setScalar(1.0 + shatterPulse * (1.0 - progress));
          if (progress > 0.5) {
            this.coreMaterial.opacity = 1.0 - ((progress - 0.5) * 2.0);
          } else {
            this.coreMaterial.opacity = 1.0;
          }
          this.coreMaterial.depthWrite = false;
          eventBus.emit('bossDestructionStage', { stage: 'shatter', progress, position: getBossPos() });
        },
        onEnd: () => {
          this.object3D.remove(this.innerCore);
          this.coreGeometry.dispose();
          this.coreBaseGeometry.dispose();
          this.coreMaterial.dispose();
          eventBus.emit('bossDestructionStage', { stage: 'shatter', progress: 1.0, position: getBossPos() });
          Logger.info('Boss', 'Avenger destruction shatter stage complete - inner core removed');
        },
      },
    ];

    this.destructionSequence = new DestructionSequence(stages);
  }

  /** Returns the current attack phase */
  getCurrentPhase(): AvengerPhaseType {
    return this.currentPhase;
  }

  /** Returns the phase timer value */
  getPhaseTimer(): number {
    return this.phaseTimer;
  }

  /** Returns geometry layer references for testing */
  getOuterSpines(): THREE.Object3D {
    return this.outerSpines;
  }

  getMidBlades(): THREE.Object3D {
    return this.midBlades;
  }

  getInnerCore(): THREE.Object3D {
    return this.innerCore;
  }

  /** Returns materials for testing */
  getOuterMaterial(): THREE.LineBasicMaterial {
    return this.outerMaterial;
  }

  getMidMaterial(): THREE.LineBasicMaterial {
    return this.midMaterial;
  }

  getCoreMaterial(): THREE.LineBasicMaterial {
    return this.coreMaterial;
  }

  dispose(): void {
    this.object3D.remove(this.outerSpines);
    this.object3D.remove(this.midBlades);
    this.object3D.remove(this.innerCore);

    this.outerGeometry.dispose();
    this.midGeometry.dispose();
    this.coreGeometry.dispose();
    this.outerBaseGeometry.dispose();
    this.midBaseGeometry.dispose();
    this.coreBaseGeometry.dispose();

    this.outerMaterial.dispose();
    this.midMaterial.dispose();
    this.coreMaterial.dispose();

    Logger.info('Boss', 'AvengerBoss disposed');
  }
}
