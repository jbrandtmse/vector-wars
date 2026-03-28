/**
 * GatekeeperBoss -- The Level 1 boss: a massive, cold geometric construct.
 *
 * Three concentric wireframe icosahedron layers that rotate independently,
 * creating a living, breathing geometric entity.
 *
 * GDD: "Cold, calculating, dismissive. Predictable but challenging patterns.
 * Teaches boss mechanics through readable attacks."
 *
 * Narrative: "Massive geometric constructs -- sphere or polyhedron shapes
 * with fractal patterns at the center. The Death Star equivalent is a
 * living geometric AI entity."
 *
 * Created by: Story 3-7
 */

import * as THREE from 'three';
import { Boss } from './Boss.ts';
import { DestructionSequence } from './DestructionSequence.ts';
import type { DestructionStage } from './DestructionSequence.ts';
import { eventBus } from '../../core/GameEvents.ts';
import { Logger } from '../../core/Logger.ts';
import {
  BLOOM_LAYER,
  BOSS_GATEKEEPER_HEALTH,
  BOSS_GATEKEEPER_COLLIDER_RADIUS,
  BOSS_GATEKEEPER_SCORE_VALUE,
  BOSS_GATEKEEPER_OUTER_RADIUS,
  BOSS_GATEKEEPER_MID_RADIUS,
  BOSS_GATEKEEPER_CORE_RADIUS,
  BOSS_GATEKEEPER_ROTATION_SPEED,
  BOSS_GATEKEEPER_CORE_PULSE_RATE,
  BOSS_GATEKEEPER_CORE_PULSE_AMPLITUDE,
  BOSS_GATEKEEPER_BARRAGE_DURATION,
  BOSS_GATEKEEPER_SWEEP_DURATION,
  BOSS_GATEKEEPER_VULNERABLE_DURATION,
  BOSS_GATEKEEPER_BARRAGE_INTERVAL,
  BOSS_GATEKEEPER_BARRAGE_COUNT,
  BOSS_GATEKEEPER_BARRAGE_SPREAD,
  BOSS_GATEKEEPER_SWEEP_SPEED,
  BOSS_GATEKEEPER_DAMAGE_REDUCTION,
  BOSS_GATEKEEPER_ATTACK_DAMAGE,
  BOSS_GATEKEEPER_PROJECTILE_SPEED,
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

export type BossPhaseType = 'barrage' | 'sweep' | 'vulnerable' | 'rush' | 'reason' | 'surge';

export class GatekeeperBoss extends Boss {
  // Geometry layers
  private outerShell: THREE.Object3D;
  private midStructure: THREE.Object3D;
  private innerCore: THREE.Object3D;

  // Materials (kept for independent opacity/color control)
  private outerMaterial: THREE.LineBasicMaterial;
  private midMaterial: THREE.LineBasicMaterial;
  private coreMaterial: THREE.LineBasicMaterial;

  // Geometries (kept for disposal)
  private outerGeometry: THREE.EdgesGeometry;
  private midGeometry: THREE.EdgesGeometry;
  private coreGeometry: THREE.EdgesGeometry;
  private outerBaseGeometry: THREE.IcosahedronGeometry;
  private midBaseGeometry: THREE.IcosahedronGeometry;
  private coreBaseGeometry: THREE.IcosahedronGeometry;

  // Attack phase state machine
  private currentPhase: BossPhaseType = 'barrage';
  private phaseTimer = 0;
  private attackTimer = 0;
  private sweepAngle = 0;
  private elapsed = 0;

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
    super(BOSS_GATEKEEPER_HEALTH, BOSS_GATEKEEPER_SCORE_VALUE, BOSS_GATEKEEPER_COLLIDER_RADIUS);

    this.playerPositionGetter = playerPositionGetter;

    // Create three geometry layers
    // Outer shell: IcosahedronGeometry(8, 2)
    this.outerBaseGeometry = new THREE.IcosahedronGeometry(BOSS_GATEKEEPER_OUTER_RADIUS, 2);
    this.outerGeometry = new THREE.EdgesGeometry(this.outerBaseGeometry);
    this.outerMaterial = vectorMaterials.create('boss-gatekeeper-outer');
    const outerLineSegments = new THREE.LineSegments(this.outerGeometry, this.outerMaterial);
    outerLineSegments.layers.enable(BLOOM_LAYER);
    this.outerShell = new THREE.Object3D();
    this.outerShell.add(outerLineSegments);
    this.object3D.add(this.outerShell);

    // Mid structure: IcosahedronGeometry(5.5, 1)
    this.midBaseGeometry = new THREE.IcosahedronGeometry(BOSS_GATEKEEPER_MID_RADIUS, 1);
    this.midGeometry = new THREE.EdgesGeometry(this.midBaseGeometry);
    this.midMaterial = vectorMaterials.create('boss-gatekeeper-mid');
    const midLineSegments = new THREE.LineSegments(this.midGeometry, this.midMaterial);
    midLineSegments.layers.enable(BLOOM_LAYER);
    this.midStructure = new THREE.Object3D();
    this.midStructure.add(midLineSegments);
    this.object3D.add(this.midStructure);

    // Inner core: IcosahedronGeometry(3, 0)
    this.coreBaseGeometry = new THREE.IcosahedronGeometry(BOSS_GATEKEEPER_CORE_RADIUS, 0);
    this.coreGeometry = new THREE.EdgesGeometry(this.coreBaseGeometry);
    this.coreMaterial = vectorMaterials.create('boss-gatekeeper-core', 0.15);
    const coreLineSegments = new THREE.LineSegments(this.coreGeometry, this.coreMaterial);
    coreLineSegments.layers.enable(BLOOM_LAYER);
    this.innerCore = new THREE.Object3D();
    this.innerCore.add(coreLineSegments);
    this.object3D.add(this.innerCore);

    // Emit initial phase
    eventBus.emit('bossPhaseChanged', { phase: this.currentPhase });

    Logger.info('Boss', 'GatekeeperBoss created', {
      health: BOSS_GATEKEEPER_HEALTH,
      phase: this.currentPhase,
    });
  }

  updateBoss(dt: number): void {
    this.elapsed += dt;

    // Layer animation
    // Outer shell: slow counter-rotation on Y
    this.outerShell.rotation.y -= BOSS_GATEKEEPER_ROTATION_SPEED * dt;
    // Mid structure: rotation on X
    this.midStructure.rotation.x += BOSS_GATEKEEPER_ROTATION_SPEED * 0.7 * dt;
    // Core: pulsing scale
    const pulse = Math.sin(this.elapsed * BOSS_GATEKEEPER_CORE_PULSE_RATE * Math.PI * 2);
    const coreScale = 1.0 + pulse * BOSS_GATEKEEPER_CORE_PULSE_AMPLITUDE;
    this.innerCore.scale.setScalar(coreScale);

    // Hit flash timer
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      if (this.flashTimer <= 0) {
        // Restore scales
        this.outerShell.scale.setScalar(this.originalOuterScale);
        this.midStructure.scale.setScalar(this.originalMidScale);
        this.innerCore.scale.setScalar(this.originalCoreScale);
      }
    }

    // Attack phase state machine
    this.phaseTimer += dt;
    switch (this.currentPhase) {
      case 'barrage':
        this.updateBarrage(dt);
        if (this.phaseTimer >= BOSS_GATEKEEPER_BARRAGE_DURATION) this.transitionPhase('sweep');
        break;
      case 'sweep':
        this.updateSweep(dt);
        if (this.phaseTimer >= BOSS_GATEKEEPER_SWEEP_DURATION) this.transitionPhase('vulnerable');
        break;
      case 'vulnerable':
        if (this.phaseTimer >= BOSS_GATEKEEPER_VULNERABLE_DURATION) this.transitionPhase('barrage');
        break;
    }
  }

  private updateBarrage(dt: number): void {
    this.attackTimer += dt;
    if (this.attackTimer >= BOSS_GATEKEEPER_BARRAGE_INTERVAL) {
      this.attackTimer -= BOSS_GATEKEEPER_BARRAGE_INTERVAL;

      // Get player position
      this.tempPlayerPos.copy(this.playerPositionGetter());
      const bossPos = this.object3D.position;

      // Compute direction to player
      this.tempAttackDir.subVectors(this.tempPlayerPos, bossPos).normalize();

      // Generate BARRAGE_COUNT positions with spread
      const positions: Array<{ x: number; y: number; z: number }> = [];
      for (let i = 0; i < BOSS_GATEKEEPER_BARRAGE_COUNT; i++) {
        // Offset angle for each burst in the spread
        const spreadOffset = (i - (BOSS_GATEKEEPER_BARRAGE_COUNT - 1) / 2) * BOSS_GATEKEEPER_BARRAGE_SPREAD;

        // Compute spread around the main direction
        this.tempBarragePos.copy(this.tempAttackDir);
        // Rotate the direction slightly for spread
        const cosSpread = Math.cos(spreadOffset);
        const sinSpread = Math.sin(spreadOffset);
        // Simple rotation in XZ plane relative to attack direction
        const origX = this.tempBarragePos.x;
        const origZ = this.tempBarragePos.z;
        this.tempBarragePos.x = origX * cosSpread - origZ * sinSpread;
        this.tempBarragePos.z = origX * sinSpread + origZ * cosSpread;
        this.tempBarragePos.normalize();

        // Position on boss surface along spread direction
        positions.push({
          x: bossPos.x + this.tempBarragePos.x * BOSS_GATEKEEPER_OUTER_RADIUS,
          y: bossPos.y + this.tempBarragePos.y * BOSS_GATEKEEPER_OUTER_RADIUS,
          z: bossPos.z + this.tempBarragePos.z * BOSS_GATEKEEPER_OUTER_RADIUS,
        });
      }

      eventBus.emit('bossAttack', {
        positions,
        targetPosition: {
          x: this.tempPlayerPos.x,
          y: this.tempPlayerPos.y,
          z: this.tempPlayerPos.z,
        },
        speed: BOSS_GATEKEEPER_PROJECTILE_SPEED,
        damage: BOSS_GATEKEEPER_ATTACK_DAMAGE,
      });
    }
  }

  private updateSweep(dt: number): void {
    this.sweepAngle += BOSS_GATEKEEPER_SWEEP_SPEED * dt;
    this.attackTimer += dt;

    if (this.attackTimer >= 0.2) {
      this.attackTimer -= 0.2;

      const bossPos = this.object3D.position;
      this.tempPlayerPos.copy(this.playerPositionGetter());

      // Orbiting position around the boss
      const sweepX = Math.cos(this.sweepAngle) * BOSS_GATEKEEPER_OUTER_RADIUS;
      const sweepY = Math.sin(this.sweepAngle * 0.5) * 3;
      const sweepZ = Math.sin(this.sweepAngle) * BOSS_GATEKEEPER_OUTER_RADIUS;

      const positions = [{
        x: bossPos.x + sweepX,
        y: bossPos.y + sweepY,
        z: bossPos.z + sweepZ,
      }];

      eventBus.emit('bossAttack', {
        positions,
        targetPosition: {
          x: this.tempPlayerPos.x,
          y: this.tempPlayerPos.y,
          z: this.tempPlayerPos.z,
        },
        speed: BOSS_GATEKEEPER_PROJECTILE_SPEED,
        damage: BOSS_GATEKEEPER_ATTACK_DAMAGE,
      });
    }
  }

  private transitionPhase(newPhase: BossPhaseType): void {
    // If leaving vulnerable phase, restore visuals
    if (this.currentPhase === 'vulnerable') {
      this.vulnerable = false;
      this.outerMaterial.opacity = this.outerOriginalOpacity;
      this.outerMaterial.transparent = false;
      this.outerMaterial.depthWrite = true;
      eventBus.emit('bossVulnerable', { vulnerable: false });
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

    // Reset sweep angle on new sweep phase
    if (newPhase === 'sweep') {
      this.sweepAngle = 0;
    }

    eventBus.emit('bossPhaseChanged', { phase: newPhase });

    Logger.debug('Boss', `Phase transition: ${newPhase}`, { phase: newPhase });
  }

  /**
   * Override takeDamage to apply damage reduction during non-vulnerable phases.
   */
  takeDamage(amount: number): void {
    if (this.defeated) return;

    const effectiveAmount = this.vulnerable
      ? amount
      : amount * BOSS_GATEKEEPER_DAMAGE_REDUCTION;

    super.takeDamage(effectiveAmount);
  }

  onHit(): void {
    // Brief flash on all three layers -- scale each layer to 1.15 for 0.1 seconds
    this.originalOuterScale = this.outerShell.scale.x;
    this.originalMidScale = this.midStructure.scale.x;
    this.originalCoreScale = this.innerCore.scale.x;

    this.outerShell.scale.setScalar(1.15);
    this.midStructure.scale.setScalar(1.15);
    this.innerCore.scale.setScalar(1.15);
    this.flashTimer = 0.1;
  }

  onDefeated(): void {
    // Emit bossDefeated event (existing behavior - signals health reached 0)
    eventBus.emit('bossDefeated', {
      position: {
        x: this.object3D.position.x,
        y: this.object3D.position.y,
        z: this.object3D.position.z,
      },
      scoreValue: this.scoreValue,
    });

    Logger.info('Boss', 'GatekeeperBoss defeated, starting destruction sequence', {
      scoreValue: this.scoreValue,
    });

    // Capture mid material HSL for interpolation during strip stage
    const midHSL = { h: 0, s: 0, l: 0 };
    this.midMaterial.color.getHSL(midHSL);
    const baseMidHue = midHSL.h;
    const baseMidSaturation = midHSL.s;
    const baseMidLightness = midHSL.l;

    // Helper to get boss position for event emission
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
          Logger.info('Boss', 'Destruction peel stage started');
        },
        onUpdate: (progress: number, dt: number) => {
          // Scale outer shell from 1.0 to PEEL_SCALE_END
          this.outerShell.scale.setScalar(1.0 + progress * (BOSS_DESTRUCTION_PEEL_SCALE_END - 1.0));
          // Fade opacity
          this.outerMaterial.opacity = 1.0 - progress;
          // Increase rotation speed
          this.outerShell.rotation.y -= BOSS_GATEKEEPER_ROTATION_SPEED * BOSS_DESTRUCTION_ROTATION_MULTIPLIER_PEEL * dt;
          // Emit destruction stage event
          eventBus.emit('bossDestructionStage', { stage: 'peel', progress, position: getBossPos() });
        },
        onEnd: () => {
          this.object3D.remove(this.outerShell);
          this.outerGeometry.dispose();
          this.outerBaseGeometry.dispose();
          this.outerMaterial.dispose();
          Logger.info('Boss', 'Destruction peel stage complete - outer shell removed');
        },
      },
      // === STRIP STAGE ===
      {
        name: 'strip',
        duration: BOSS_DESTRUCTION_STRIP_DURATION,
        onStart: () => {
          this.midMaterial.transparent = true;
          this.midMaterial.depthWrite = false;
          Logger.info('Boss', 'Destruction strip stage started');
        },
        onUpdate: (progress: number, dt: number) => {
          // Scale mid structure
          this.midStructure.scale.setScalar(1.0 + progress * (BOSS_DESTRUCTION_STRIP_SCALE_END - 1.0));
          // Fade opacity
          this.midMaterial.opacity = 1.0 - progress;
          // Shift color toward white
          this.midMaterial.color.setHSL(
            baseMidHue,
            baseMidSaturation,
            baseMidLightness + progress * (1.0 - baseMidLightness),
          );
          // Increase rotation speed
          this.midStructure.rotation.x += BOSS_GATEKEEPER_ROTATION_SPEED * BOSS_DESTRUCTION_ROTATION_MULTIPLIER_STRIP * dt;
          // Emit destruction stage event
          eventBus.emit('bossDestructionStage', { stage: 'strip', progress, position: getBossPos() });
        },
        onEnd: () => {
          this.object3D.remove(this.midStructure);
          this.midGeometry.dispose();
          this.midBaseGeometry.dispose();
          this.midMaterial.dispose();
          Logger.info('Boss', 'Destruction strip stage complete - mid structure removed');
        },
      },
      // === SHATTER STAGE ===
      {
        name: 'shatter',
        duration: BOSS_DESTRUCTION_SHATTER_DURATION,
        onStart: () => {
          // Pure white flash - the ONLY time pure white appears in the game
          this.coreMaterial.color.setHSL(0, 0, 1.0);
          this.coreMaterial.transparent = true;
          Logger.info('Boss', 'Destruction shatter stage started - pure white flash');
        },
        onUpdate: (progress: number, _dt: number) => {
          // Pulse core scale at high frequency
          const pulse = Math.sin(progress * BOSS_DESTRUCTION_SHATTER_PULSE_FREQUENCY * Math.PI);
          this.innerCore.scale.setScalar(1.0 + pulse * (1.0 - progress));
          // Fade opacity in final 50%
          if (progress > 0.5) {
            this.coreMaterial.opacity = 1.0 - ((progress - 0.5) * 2.0);
          } else {
            this.coreMaterial.opacity = 1.0;
          }
          this.coreMaterial.depthWrite = false;
          // Emit destruction stage event
          eventBus.emit('bossDestructionStage', { stage: 'shatter', progress, position: getBossPos() });
        },
        onEnd: () => {
          this.object3D.remove(this.innerCore);
          this.coreGeometry.dispose();
          this.coreBaseGeometry.dispose();
          this.coreMaterial.dispose();
          // Emit final shatter event for explosion spawning
          eventBus.emit('bossDestructionStage', { stage: 'shatter', progress: 1.0, position: getBossPos() });
          Logger.info('Boss', 'Destruction shatter stage complete - inner core removed');
        },
      },
    ];

    this.destructionSequence = new DestructionSequence(stages);
  }

  /** Returns the current attack phase */
  getCurrentPhase(): BossPhaseType {
    return this.currentPhase;
  }

  /** Returns the phase timer value */
  getPhaseTimer(): number {
    return this.phaseTimer;
  }

  /** Returns geometry layer references for testing */
  getOuterShell(): THREE.Object3D {
    return this.outerShell;
  }

  getMidStructure(): THREE.Object3D {
    return this.midStructure;
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
    // Remove all children from object3D
    this.object3D.remove(this.outerShell);
    this.object3D.remove(this.midStructure);
    this.object3D.remove(this.innerCore);

    // Dispose geometries
    this.outerGeometry.dispose();
    this.midGeometry.dispose();
    this.coreGeometry.dispose();
    this.outerBaseGeometry.dispose();
    this.midBaseGeometry.dispose();
    this.coreBaseGeometry.dispose();

    // Dispose materials
    this.outerMaterial.dispose();
    this.midMaterial.dispose();
    this.coreMaterial.dispose();

    Logger.info('Boss', 'GatekeeperBoss disposed');
  }
}
