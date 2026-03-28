/**
 * TutorialPhase -- Diegetic tutorial sequence before Level 1.
 *
 * Runs a step-based calibration protocol where the handler walks the player
 * through controls: movement, Data Lance, secondary weapons, and shields.
 * Ends with an alarm transition into the dogfight phase.
 *
 * Pattern: Same lifecycle as DogfightPhase -- enter/update/exit/isComplete.
 *
 * Created by: Story 4-3
 */

import * as THREE from 'three';
import { eventBus } from '../../core/GameEvents.ts';
import { Logger } from '../../core/Logger.ts';
import { BLOOM_LAYER } from '../../config/constants.ts';
import { TutorialPrompt } from '../../ui/screens/TutorialPrompt.ts';
import type { InputManager } from '../../core/InputManager.ts';
import type { VectorMaterials } from '../../rendering/VectorMaterials.ts';
import type { GameObjectManager } from '../../entities/GameObjectManager.ts';
import type { GameObject } from '../../entities/GameObject.ts';

/**
 * CalibrationTarget -- Simple wireframe object used as a tutorial firing target.
 * Has a takeDamage method so the CollisionSystem treats it like an enemy.
 * Registered with GameObjectManager for collision detection.
 *
 * When destroyed by Data Lance, emits enemyDestroyed so EffectsManager
 * spawns vector shard explosions automatically (EventBus-only communication).
 */
class CalibrationTarget {
  public readonly id: number;
  public isActive = true;
  public health = 1;
  public scoreValue = 0; // No score for calibration targets
  private object3D: THREE.Object3D;
  private collider: THREE.Sphere;
  private mesh: THREE.LineSegments;
  private rotationSpeed: number;

  private static nextId = 10000; // Offset to avoid collision with Enemy IDs

  constructor(
    scene: THREE.Scene,
    position: THREE.Vector3,
    vectorMaterials: VectorMaterials,
  ) {
    this.id = CalibrationTarget.nextId++;
    this.rotationSpeed = 1.0 + Math.random() * 0.5;

    this.object3D = new THREE.Object3D();
    this.object3D.position.copy(position);

    // Create wireframe octahedron geometry
    const geometry = new THREE.OctahedronGeometry(0.8, 0);
    const edges = new THREE.EdgesGeometry(geometry);
    const material = vectorMaterials.create(`calibration-target-${this.id}`);
    this.mesh = new THREE.LineSegments(edges, material);
    this.mesh.layers.enable(BLOOM_LAYER);
    this.object3D.add(this.mesh);

    scene.add(this.object3D);

    this.collider = new THREE.Sphere(position.clone(), 1.2);
  }

  update(dt: number): void {
    if (!this.isActive) return;
    this.object3D.rotation.y += this.rotationSpeed * dt;
    this.object3D.rotation.x += this.rotationSpeed * 0.7 * dt;
    this.collider.center.copy(this.object3D.position);
  }

  takeDamage(_damage: number): void {
    if (!this.isActive) return;
    this.health = 0;
    this.isActive = false;
    this.object3D.visible = false;
    // Emit enemyDestroyed so EffectsManager spawns explosion via EventBus
    eventBus.emit('enemyDestroyed', {
      enemy: this as unknown as import('../../entities/enemies/Enemy.ts').Enemy,
      position: {
        x: this.object3D.position.x,
        y: this.object3D.position.y,
        z: this.object3D.position.z,
      },
    });
  }

  getObject3D(): THREE.Object3D {
    return this.object3D;
  }

  getCollider(): THREE.Sphere {
    return this.collider;
  }

  getPosition(): THREE.Vector3 {
    return this.object3D.position;
  }

  setActive(value: boolean): void {
    this.isActive = value;
  }

  removeFromScene(scene: THREE.Scene): void {
    scene.remove(this.object3D);
  }
}

/** Tutorial step constants (using const object instead of enum for erasableSyntaxOnly) */
const TutorialStep = {
  Welcome: 0,
  Movement: 1,
  DataLance: 2,
  SecondaryWeapons: 3,
  Shields: 4,
  Alarm: 5,
  Done: 6,
} as const;
type TutorialStepType = typeof TutorialStep[keyof typeof TutorialStep];

export class TutorialPhase {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private vectorMaterials: VectorMaterials;
  private inputManager: InputManager;
  private gameObjectManager: GameObjectManager;
  private completed = false;
  private currentStep: TutorialStepType = TutorialStep.Welcome;
  private stepTimer = 0;

  // TutorialPrompt overlay
  private tutorialPrompt: TutorialPrompt | null = null;

  // Step 2: Movement tracking
  private movedUp = false;
  private movedDown = false;
  private movedLeft = false;
  private movedRight = false;
  private movementCompleted = false;

  // Step 3: Data Lance target tracking
  private calibrationTargets: CalibrationTarget[] = [];
  private targetsSpawned = false;
  private targetsCompleted = false;

  // Step 5: Shield demo tracking
  private shieldHitFired = false;
  private shieldHitConfirmed = false;
  private shieldCompleted = false;
  private onShieldChanged: (() => void) | null = null;

  // Step 6: Alarm tracking
  private alarmTriggered = false;

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    vectorMaterials: VectorMaterials,
    inputManager: InputManager,
    gameObjectManager: GameObjectManager,
    _effectsManager: unknown, // kept for interface compatibility but unused (effects via EventBus)
  ) {
    this.scene = scene;
    this.camera = camera;
    this.vectorMaterials = vectorMaterials;
    this.inputManager = inputManager;
    this.gameObjectManager = gameObjectManager;
  }

  enter(): void {
    Logger.info('Tutorial', 'Entering tutorial phase');
    this.completed = false;
    this.currentStep = TutorialStep.Welcome;
    this.stepTimer = 0;
    this.movedUp = false;
    this.movedDown = false;
    this.movedLeft = false;
    this.movedRight = false;
    this.movementCompleted = false;
    this.calibrationTargets = [];
    this.targetsSpawned = false;
    this.targetsCompleted = false;
    this.shieldHitFired = false;
    this.shieldHitConfirmed = false;
    this.shieldCompleted = false;
    this.alarmTriggered = false;

    this.tutorialPrompt = new TutorialPrompt();

    // Subscribe to shield changes for step 5
    this.onShieldChanged = () => {
      if (this.currentStep === TutorialStep.Shields && this.shieldHitFired) {
        this.shieldHitConfirmed = true;
      }
    };
    eventBus.on('shieldChanged', this.onShieldChanged);

    // Trigger welcome dialogue
    eventBus.emit('dialogueTrigger', { triggerId: 'tutorial:step1' });

    Logger.info('Tutorial', 'Tutorial phase entered');
  }

  update(dt: number): void {
    if (this.completed) return;

    this.stepTimer += dt;

    // Update calibration targets
    for (const target of this.calibrationTargets) {
      target.update(dt);
    }

    switch (this.currentStep) {
      case TutorialStep.Welcome:
        this.updateWelcome();
        break;
      case TutorialStep.Movement:
        this.updateMovement();
        break;
      case TutorialStep.DataLance:
        this.updateDataLance();
        break;
      case TutorialStep.SecondaryWeapons:
        this.updateSecondaryWeapons();
        break;
      case TutorialStep.Shields:
        this.updateShields();
        break;
      case TutorialStep.Alarm:
        this.updateAlarm();
        break;
      case TutorialStep.Done:
        this.completed = true;
        break;
    }
  }

  exit(): void {
    Logger.info('Tutorial', 'Exiting tutorial phase');

    // Clean up calibration targets
    for (const target of this.calibrationTargets) {
      this.gameObjectManager.remove(target as unknown as GameObject);
      target.removeFromScene(this.scene);
    }
    this.calibrationTargets = [];

    // Dispose tutorial prompt
    if (this.tutorialPrompt) {
      this.tutorialPrompt.dispose();
      this.tutorialPrompt = null;
    }

    // Unsubscribe from events
    if (this.onShieldChanged) {
      eventBus.off('shieldChanged', this.onShieldChanged);
      this.onShieldChanged = null;
    }

    Logger.info('Tutorial', 'Tutorial phase exited');
  }

  isComplete(): boolean {
    return this.completed;
  }

  // --- Step update methods ---

  private advanceStep(nextStep: TutorialStepType): void {
    Logger.info('Tutorial', 'Advancing to step', { from: this.currentStep, to: nextStep });
    this.currentStep = nextStep;
    this.stepTimer = 0;
  }

  private updateWelcome(): void {
    // Auto-advance after welcome dialogue duration (5 seconds)
    if (this.stepTimer >= 5.0) {
      eventBus.emit('dialogueTrigger', { triggerId: 'tutorial:step2' });
      this.tutorialPrompt?.show('PRESS ARROW KEYS TO ALIGN TARGETING ARRAY');
      this.advanceStep(TutorialStep.Movement);
    }
  }

  private updateMovement(): void {
    if (this.movementCompleted) return;

    // Track arrow key presses
    if (this.inputManager.isActive('moveUp')) this.movedUp = true;
    if (this.inputManager.isActive('moveDown')) this.movedDown = true;
    if (this.inputManager.isActive('moveLeft')) this.movedLeft = true;
    if (this.inputManager.isActive('moveRight')) this.movedRight = true;

    if (this.movedUp && this.movedDown && this.movedLeft && this.movedRight) {
      this.movementCompleted = true;
      this.tutorialPrompt?.hide();
      eventBus.emit('dialogueTrigger', { triggerId: 'tutorial:step2:complete' });
      // Wait for completion dialogue before advancing (3s)
      setTimeout(() => {
        this.spawnCalibrationTargets();
        eventBus.emit('dialogueTrigger', { triggerId: 'tutorial:step3' });
        this.tutorialPrompt?.show('PRESS SPACE TO FIRE DATA LANCE');
        this.advanceStep(TutorialStep.DataLance);
      }, 3000);
    }
  }

  private updateDataLance(): void {
    if (this.targetsCompleted) return;

    // Check if all calibration targets are destroyed
    const allDestroyed = this.targetsSpawned &&
      this.calibrationTargets.every(t => !t.isActive);

    if (allDestroyed) {
      this.targetsCompleted = true;
      this.tutorialPrompt?.hide();
      eventBus.emit('dialogueTrigger', { triggerId: 'tutorial:step3:complete' });
      // Clean up destroyed targets from scene
      for (const target of this.calibrationTargets) {
        this.gameObjectManager.remove(target as unknown as GameObject);
        target.removeFromScene(this.scene);
      }
      this.calibrationTargets = [];

      setTimeout(() => {
        eventBus.emit('dialogueTrigger', { triggerId: 'tutorial:step4' });
        this.tutorialPrompt?.show('Z: LOGIC BOMBS  X: EMP BURST  C: VIRUS PAYLOAD');
        this.advanceStep(TutorialStep.SecondaryWeapons);
      }, 3000);
    }
  }

  private updateSecondaryWeapons(): void {
    // Auto-advance after 5 seconds
    if (this.stepTimer >= 5.0) {
      this.tutorialPrompt?.hide();
      eventBus.emit('dialogueTrigger', { triggerId: 'tutorial:step5' });
      this.advanceStep(TutorialStep.Shields);
    }
  }

  private updateShields(): void {
    // Fire a calibration hit at player after 3 seconds
    if (!this.shieldHitFired && this.stepTimer >= 3.0) {
      this.shieldHitFired = true;
      // Emit playerHit directly to demonstrate shields
      eventBus.emit('playerHit', { damage: 10, source: 'calibration' });
      Logger.debug('Tutorial', 'Calibration shield hit fired');
    }

    // After shield change confirmed, show completion dialogue
    if (this.shieldHitConfirmed && !this.shieldCompleted) {
      this.shieldCompleted = true;
      eventBus.emit('dialogueTrigger', { triggerId: 'tutorial:step5:complete' });
      setTimeout(() => {
        eventBus.emit('dialogueTrigger', { triggerId: 'tutorial:step6' });
        this.advanceStep(TutorialStep.Alarm);
      }, 5000);
    }
  }

  private updateAlarm(): void {
    // Trigger alarm after the calibration-complete line (3 seconds)
    if (!this.alarmTriggered && this.stepTimer >= 3.0) {
      this.alarmTriggered = true;
      eventBus.emit('dialogueTrigger', { triggerId: 'tutorial:step6:alarm' });
    }

    // Complete tutorial after alarm dialogue (3 + 4 = 7 seconds)
    if (this.stepTimer >= 7.0) {
      this.tutorialPrompt?.hide();
      this.advanceStep(TutorialStep.Done);
    }
  }

  // --- Calibration target spawning ---

  private spawnCalibrationTargets(): void {
    // Spawn 3 targets ahead of the camera's current direction
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    const up = new THREE.Vector3(0, 1, 0);

    const basePosition = this.camera.position.clone().add(forward.clone().multiplyScalar(30));

    const offsets = [
      right.clone().multiplyScalar(-5).add(up.clone().multiplyScalar(1)),
      new THREE.Vector3(0, 2, 0),
      right.clone().multiplyScalar(5).add(up.clone().multiplyScalar(1)),
    ];

    for (const offset of offsets) {
      const pos = basePosition.clone().add(offset);
      const target = new CalibrationTarget(this.scene, pos, this.vectorMaterials);
      this.calibrationTargets.push(target);
      // Register with GameObjectManager so CollisionSystem can detect hits
      this.gameObjectManager.add(target as unknown as GameObject);
    }

    this.targetsSpawned = true;
    Logger.info('Tutorial', 'Calibration targets spawned', { count: 3 });
  }
}
