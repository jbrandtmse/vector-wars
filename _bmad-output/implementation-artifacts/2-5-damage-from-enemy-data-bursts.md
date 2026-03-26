# Story 2.5: Damage from Enemy Data Bursts

Status: done

## Story

As a player,
I want to take damage from enemy data bursts,
so that there are stakes and tension.

## Acceptance Criteria

1. An `AttackState` AI state exists at `src/ai/states/AttackState.ts` that makes enemies fire data burst projectiles at the player's current position on a cooldown timer driven by `enemy.params.attackCooldown`
2. `PatrolState` transitions to `AttackState` after a configurable patrol duration (~3 seconds for Level 1), and `AttackState` transitions back to `PatrolState` after firing a burst -- creating a Patrol -> Attack -> Patrol loop
3. An `EnemyDataBurst` projectile class exists at `src/entities/projectiles/EnemyDataBurst.ts` that renders as a short `THREE.LineSegments` line (similar aesthetic to Data Lance bolts but visually distinct -- shorter, dimmer)
4. Each `EnemyDataBurst` travels in a straight line from the enemy's position toward the player's position at spawn time, at the speed defined by `enemy.params.projectileSpeed` (15 u/s for Level 1 Sentinels)
5. `EnemyDataBurst` projectiles have bloom layer enabled (`mesh.layers.enable(BLOOM_LAYER)`) and use `VectorMaterials.create()` for palette compliance
6. `EnemyDataBurst` projectiles use a pre-allocated pool managed by `EnemyProjectileSystem` (NOT individual `new` calls during gameplay) -- pool size is `ENEMY_DATA_BURST_POOL_SIZE` (30) from constants
7. A `playerHit` event is added to `GameEvents.ts` with payload `{ damage: number; source: string }` matching the architecture spec
8. An `EnemyProjectileSystem` class exists at `src/systems/EnemyProjectileSystem.ts` that:
   - Owns the `EnemyDataBurst` projectile pool (pre-allocated at construction)
   - Subscribes to no events from other systems (receives camera reference for player position via constructor)
   - Exposes a `fireAt(origin: Vector3, target: Vector3, speed: number, damage: number)` method called by `AttackState`
   - Each frame checks sphere-sphere collision between active projectiles and the player's bounding sphere
   - Emits `playerHit` event on the EventBus when a projectile hits the player
   - Deactivates projectiles that exceed max range or hit the player
9. A `Player` entity class exists at `src/entities/player/Player.ts` that:
   - Has `shields` (current) and `maxShields` properties, initialized from `PLAYER_MAX_SHIELDS` constant (100)
   - Has a bounding sphere collider for projectile-player collision detection
   - Subscribes to `playerHit` events and reduces shields by `damage` amount
   - Clamps shields to minimum 0
   - Logs shield damage via Logger
10. New constants in `src/config/constants.ts`:
    - `ENEMY_DATA_BURST_POOL_SIZE = 30`
    - `ENEMY_DATA_BURST_LENGTH = 0.8` (line segment length)
    - `ENEMY_DATA_BURST_MAX_RANGE = 80` (deactivate beyond this distance)
    - `ENEMY_DATA_BURST_COLLIDER_RADIUS = 0.3` (sphere for hit detection)
    - `PLAYER_MAX_SHIELDS = 100`
    - `PLAYER_COLLIDER_RADIUS = 1.0`
    - `ATTACK_STATE_PATROL_DURATION = 3.0` (seconds before PatrolState transitions to AttackState)
11. The `EnemyProjectileSystem` does NOT import `CollisionSystem`, `DataLanceSystem`, `EnemySpawner`, `EffectsManager`, or any other system -- it checks its own projectile-player collisions internally and emits events via EventBus
12. `AttackState` does NOT import `EnemyProjectileSystem` directly -- it receives a fire callback `(origin: Vector3, target: Vector3, speed: number, damage: number) => void` through its constructor, keeping systems decoupled
13. Running `npm run build` produces a clean production build with zero TypeScript errors
14. Unit tests exist for: `EnemyDataBurst` class construction and method exports, `EnemyProjectileSystem` class construction and method exports, `AttackState` class conformance to `AIState` interface, `Player` class construction and method exports, new constant validation, `playerHit` event type existence
15. All existing 401 tests continue to pass -- zero regressions
16. Frame rate remains at 60 FPS stable -- 30 pooled projectiles with sphere-sphere checks against 1 player bounding sphere is trivial (<0.1ms)
17. Enemy Sentinels now periodically fire visible data burst projectiles toward the player; if a burst reaches the player's position, the `playerHit` event fires with damage value -- creating actual gameplay stakes
18. Data bursts are visually readable and dodgeable -- they travel at 15 u/s (player viewport can dodge), have a visible travel path, and match the vector wireframe aesthetic

## Tasks / Subtasks

- [x] Task 1: Add new constants to `src/config/constants.ts` (AC: #10)
  - [x] 1.1 Add enemy data burst constants:
    ```typescript
    // Enemy data burst constants (Story 2-5)
    export const ENEMY_DATA_BURST_POOL_SIZE = 30;
    export const ENEMY_DATA_BURST_LENGTH = 0.8;       // line segment length (units)
    export const ENEMY_DATA_BURST_MAX_RANGE = 80;      // deactivate beyond this distance
    export const ENEMY_DATA_BURST_COLLIDER_RADIUS = 0.3; // sphere for hit detection
    ```
  - [x] 1.2 Add player constants:
    ```typescript
    // Player constants (Story 2-5)
    export const PLAYER_MAX_SHIELDS = 100;
    export const PLAYER_COLLIDER_RADIUS = 1.0;
    ```
  - [x] 1.3 Add attack state constants:
    ```typescript
    // Attack state constants (Story 2-5)
    export const ATTACK_STATE_PATROL_DURATION = 3.0; // seconds in patrol before attacking
    ```
  - [x] 1.4 Do NOT modify existing constants -- only add new ones

- [x] Task 2: Add `playerHit` event to `src/core/GameEvents.ts` (AC: #7)
  - [x] 2.1 Add the `PlayerHitEvent` interface:
    ```typescript
    export interface PlayerHitEvent {
      damage: number;
      source: string;
    }
    ```
  - [x] 2.2 Add `playerHit` to the `GameEvents` interface:
    ```typescript
    export interface GameEvents {
      weaponFired: WeaponFiredEvent;
      enemySpawned: { enemy: Enemy; position: { x: number; y: number; z: number } };
      enemyDestroyed: { enemy: Enemy; position: { x: number; y: number; z: number } };
      playerHit: PlayerHitEvent;  // NEW (Story 2-5)
    }
    ```
  - [x] 2.3 Do NOT modify existing event types -- only add the new one

- [x] Task 3: Create `EnemyDataBurst` at `src/entities/projectiles/EnemyDataBurst.ts` (AC: #3, #4, #5)
  - [x] 3.1 Create the projectile class:
    ```typescript
    import * as THREE from 'three';
    import { BLOOM_LAYER, ENEMY_DATA_BURST_LENGTH, ENEMY_DATA_BURST_COLLIDER_RADIUS } from '../../config/constants.ts';

    export class EnemyDataBurst {
      public readonly mesh: THREE.LineSegments;
      public readonly collider: THREE.Sphere;
      public direction = new THREE.Vector3();
      public speed = 0;
      public damage = 0;
      public active = false;
      public distance = 0;

      private geometry: THREE.BufferGeometry;
      private positions: Float32Array;

      constructor(material: THREE.LineBasicMaterial) {
        // Pre-allocate position buffer: 1 line segment = 2 vertices = 6 floats
        this.positions = new Float32Array(6);
        const halfLen = ENEMY_DATA_BURST_LENGTH / 2;
        this.positions[0] = 0; this.positions[1] = 0; this.positions[2] = halfLen;
        this.positions[3] = 0; this.positions[4] = 0; this.positions[5] = -halfLen;

        this.geometry = new THREE.BufferGeometry();
        const posAttr = new THREE.BufferAttribute(this.positions, 3);
        this.geometry.setAttribute('position', posAttr);

        this.mesh = new THREE.LineSegments(this.geometry, material);
        this.mesh.layers.enable(BLOOM_LAYER);
        this.mesh.visible = false;

        this.collider = new THREE.Sphere(new THREE.Vector3(), ENEMY_DATA_BURST_COLLIDER_RADIUS);
      }

      activate(origin: THREE.Vector3, dir: THREE.Vector3, speed: number, damage: number): void {
        this.mesh.position.copy(origin);
        this.direction.copy(dir);
        this.speed = speed;
        this.damage = damage;
        this.distance = 0;
        this.active = true;
        this.mesh.visible = true;

        // Orient line along travel direction
        this.mesh.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 0, 1),  // default line axis
          dir,
        );
      }

      deactivate(): void {
        this.active = false;
        this.mesh.visible = false;
        this.distance = 0;
      }

      update(dt: number): void {
        if (!this.active) return;
        const moveDistance = this.speed * dt;
        this.mesh.position.addScaledVector(this.direction, moveDistance);
        this.distance += moveDistance;

        // Sync collider center
        this.collider.center.copy(this.mesh.position);
      }
    }
    ```
  - [x] 3.2 CRITICAL: Use the shared material passed in via constructor -- do NOT call `new LineBasicMaterial()`. The material is created once via `VectorMaterials.create()` in `EnemyProjectileSystem` and shared across all burst instances (unlike explosion shards, projectiles all look identical, so one shared material is correct).
  - [x] 3.3 CRITICAL: `mesh.layers.enable(BLOOM_LAYER)` -- data bursts MUST glow through the bloom pipeline.
  - [x] 3.4 The `collider` sphere center is synced to `mesh.position` each frame in `update()`. The `EnemyProjectileSystem` reads this for collision checks.
  - [x] 3.5 The `activate()` / `deactivate()` pattern mirrors the Data Lance bolt pool pattern -- visibility toggling, no scene graph mutations during gameplay.
  - [x] 3.6 `setFromUnitVectors` orients the line segment along the travel direction so it visually "points" where it's going.
  - [x] 3.7 Use a slight negative lightness offset (e.g., `-0.1`) when creating the material in `EnemyProjectileSystem` to make data bursts visually slightly dimmer than player bolts -- reinforcing the visual distinction that these are enemy projectiles.

- [x] Task 4: Create `EnemyProjectileSystem` at `src/systems/EnemyProjectileSystem.ts` (AC: #6, #8, #11)
  - [x] 4.1 Create the system class:
    ```typescript
    import * as THREE from 'three';
    import { EnemyDataBurst } from '../entities/projectiles/EnemyDataBurst.ts';
    import { eventBus } from '../core/GameEvents.ts';
    import { Logger } from '../core/Logger.ts';
    import {
      ENEMY_DATA_BURST_POOL_SIZE,
      ENEMY_DATA_BURST_MAX_RANGE,
    } from '../config/constants.ts';
    import type { VectorMaterials } from '../rendering/VectorMaterials.ts';

    export class EnemyProjectileSystem {
      private bursts: EnemyDataBurst[] = [];
      private scene: THREE.Scene;
      private playerCollider: THREE.Sphere;

      // Pre-allocated temp vector for direction calculation
      private tempDirection = new THREE.Vector3();

      constructor(
        scene: THREE.Scene,
        vectorMaterials: VectorMaterials,
        playerCollider: THREE.Sphere,
      ) {
        this.scene = scene;
        this.playerCollider = playerCollider;

        // Create ONE shared material for all data bursts (slightly dimmer than base)
        const burstMaterial = vectorMaterials.create('enemy-data-burst', -0.1);

        // Pre-allocate projectile pool
        for (let i = 0; i < ENEMY_DATA_BURST_POOL_SIZE; i++) {
          const burst = new EnemyDataBurst(burstMaterial);
          scene.add(burst.mesh);
          this.bursts.push(burst);
        }

        Logger.info('EnemyProjectile', 'EnemyProjectileSystem initialized', {
          poolSize: ENEMY_DATA_BURST_POOL_SIZE,
        });
      }

      /**
       * Fire a data burst from origin toward target.
       * Called by AttackState fire callback.
       */
      fireAt(origin: THREE.Vector3, target: THREE.Vector3, speed: number, damage: number): void {
        const burst = this.acquireBurst();
        if (!burst) return;

        this.tempDirection.subVectors(target, origin).normalize();
        burst.activate(origin, this.tempDirection, speed, damage);

        Logger.debug('EnemyProjectile', 'Data burst fired', {
          originX: origin.x.toFixed(1),
          originY: origin.y.toFixed(1),
          originZ: origin.z.toFixed(1),
        });
      }

      update(dt: number): void {
        for (const burst of this.bursts) {
          if (!burst.active) continue;
          burst.update(dt);

          // Range check
          if (burst.distance > ENEMY_DATA_BURST_MAX_RANGE) {
            burst.deactivate();
            continue;
          }

          // Sphere-sphere collision: projectile vs player
          if (burst.collider.intersectsSphere(this.playerCollider)) {
            eventBus.emit('playerHit', {
              damage: burst.damage,
              source: 'enemyDataBurst',
            });
            burst.deactivate();
            Logger.debug('EnemyProjectile', 'Player hit by data burst', {
              damage: burst.damage,
            });
          }
        }
      }

      private acquireBurst(): EnemyDataBurst | undefined {
        for (const burst of this.bursts) {
          if (!burst.active) return burst;
        }
        Logger.warn('EnemyProjectile', 'Burst pool exhausted');
        return undefined;
      }
    }
    ```
  - [x] 4.2 CRITICAL: `EnemyProjectileSystem` does NOT import `CollisionSystem`, `DataLanceSystem`, `EnemySpawner`, `EffectsManager`, or any other system. It only interacts with other systems via EventBus emissions.
  - [x] 4.3 The `playerCollider` reference is passed in via constructor. This is a `THREE.Sphere` whose center is synced to the camera position each frame by `Player` (or by `main.ts` directly if Player entity isn't fully instantiated yet).
  - [x] 4.4 `intersectsSphere()` is a built-in Three.js method on `THREE.Sphere` -- O(1) distance comparison. No raycasting needed for projectile-player.
  - [x] 4.5 Pool exhaustion logs a warning but does NOT crash. This is expected during extreme burst scenarios and is acceptable -- enemy fire simply stops until a slot frees up.
  - [x] 4.6 ONE shared material for all 30 data bursts -- `vectorMaterials.create('enemy-data-burst', -0.1)`. Unlike explosions (which needed unique IDs per instance for potential future independent fading), projectiles are visually identical.

- [x] Task 5: Create `Player` entity at `src/entities/player/Player.ts` (AC: #9)
  - [x] 5.1 Create the Player class:
    ```typescript
    import * as THREE from 'three';
    import { PLAYER_MAX_SHIELDS, PLAYER_COLLIDER_RADIUS } from '../../config/constants.ts';
    import { eventBus } from '../../core/GameEvents.ts';
    import { Logger } from '../../core/Logger.ts';

    export class Player {
      public shields: number;
      public maxShields: number;
      public readonly collider: THREE.Sphere;

      constructor() {
        this.maxShields = PLAYER_MAX_SHIELDS;
        this.shields = PLAYER_MAX_SHIELDS;
        this.collider = new THREE.Sphere(new THREE.Vector3(), PLAYER_COLLIDER_RADIUS);

        // Subscribe to damage events
        eventBus.on('playerHit', ({ damage, source }) => {
          this.takeDamage(damage, source);
        });

        Logger.info('Player', 'Player initialized', {
          shields: this.shields,
          maxShields: this.maxShields,
        });
      }

      takeDamage(damage: number, source: string): void {
        this.shields = Math.max(0, this.shields - damage);
        Logger.info('Player', 'Damage taken', {
          damage,
          source,
          shieldsRemaining: this.shields,
        });
      }

      /**
       * Sync collider center to camera position each frame.
       * Called from main.ts animation loop.
       */
      syncToCamera(camera: THREE.Camera): void {
        this.collider.center.copy(camera.position);
      }
    }
    ```
  - [x] 5.2 Player does NOT extend `GameObject` -- it's a special entity that syncs to the camera, not a scene object with its own Object3D. The cockpit geometry is managed by `CockpitRenderer`, not Player.
  - [x] 5.3 Player subscribes to `playerHit` events via EventBus -- it does NOT import `EnemyProjectileSystem` or `CollisionSystem`.
  - [x] 5.4 `syncToCamera()` must be called each frame in the animation loop AFTER `railMovement.update()` so the collider tracks the camera position as it moves along the rail.
  - [x] 5.5 Shields clamp to minimum 0 -- `playerDied` event and game-over state are Story 2-10, not this story.

- [x] Task 6: Create `AttackState` at `src/ai/states/AttackState.ts` (AC: #1, #2, #12)
  - [x] 6.1 Create the AI state:
    ```typescript
    import * as THREE from 'three';
    import type { AIState } from '../AIState.ts';
    import type { Enemy } from '../../entities/enemies/Enemy.ts';

    export type FireCallback = (
      origin: THREE.Vector3,
      target: THREE.Vector3,
      speed: number,
      damage: number,
    ) => void;

    export class AttackState implements AIState {
      private fireCallback: FireCallback;
      private playerPositionGetter: () => THREE.Vector3;
      private nextState: AIState;
      private fired = false;

      // Pre-allocated temp vector for enemy position read
      private tempOrigin = new THREE.Vector3();

      constructor(
        fireCallback: FireCallback,
        playerPositionGetter: () => THREE.Vector3,
        nextState: AIState,
      ) {
        this.fireCallback = fireCallback;
        this.playerPositionGetter = playerPositionGetter;
        this.nextState = nextState;
      }

      enter(_enemy: Enemy): void {
        this.fired = false;
      }

      update(enemy: Enemy, _dt: number): void {
        if (this.fired) return;

        // Fire one burst toward the player's current position
        this.tempOrigin.copy(enemy.getObject3D().position);
        const playerPos = this.playerPositionGetter();

        this.fireCallback(
          this.tempOrigin,
          playerPos,
          enemy.params.projectileSpeed,
          enemy.params.attackDamage,
        );

        this.fired = true;

        // Immediately transition back to patrol
        enemy.transitionToState(this.nextState);
      }

      exit(_enemy: Enemy): void {
        // No cleanup needed
      }
    }
    ```
  - [x] 6.2 CRITICAL: `AttackState` does NOT import `EnemyProjectileSystem`. It receives a `fireCallback` function through its constructor. This callback is bound in `EnemySpawner` (or wherever enemy state chains are wired) to `enemyProjectileSystem.fireAt(...)`.
  - [x] 6.3 The `playerPositionGetter` is a function `() => Vector3` that returns the camera/player position. This avoids importing the camera or Player directly into the AI state.
  - [x] 6.4 `AttackState` fires once and immediately transitions back to `nextState` (which will be `PatrolState`). The cooldown between attacks is handled by `PatrolState` timing out after `ATTACK_STATE_PATROL_DURATION` seconds.

- [x] Task 7: Modify `PatrolState` to transition to `AttackState` (AC: #2)
  - [x] 7.1 Add a patrol timer and attack state reference to `PatrolState`:
    ```typescript
    import { ATTACK_STATE_PATROL_DURATION } from '../../config/constants.ts';
    import type { AIState } from '../AIState.ts';
    import type { Enemy } from '../../entities/enemies/Enemy.ts';

    export class PatrolState implements AIState {
      private angle = 0;
      private patrolTimer = 0;
      private createAttackState: (() => AIState) | null;

      constructor(createAttackState?: () => AIState) {
        this.createAttackState = createAttackState ?? null;
      }

      enter(_enemy: Enemy): void {
        this.angle = 0;
        this.patrolTimer = 0;
      }

      update(enemy: Enemy, dt: number): void {
        // Existing orbit patrol logic (unchanged)
        this.angle += enemy.params.patrolSpeed * dt;
        const spawnPos = enemy.getSpawnPosition();
        enemy.getObject3D().position.set(
          spawnPos.x + Math.cos(this.angle) * ORBIT_RADIUS,
          spawnPos.y + Math.sin(this.angle * Y_BOB_FREQUENCY) * Y_BOB_AMPLITUDE,
          spawnPos.z + Math.sin(this.angle) * ORBIT_RADIUS,
        );

        // Attack timer -- transition to AttackState after patrol duration
        if (this.createAttackState) {
          this.patrolTimer += dt;
          if (this.patrolTimer >= ATTACK_STATE_PATROL_DURATION) {
            enemy.transitionToState(this.createAttackState());
          }
        }
      }

      exit(_enemy: Enemy): void {
        // No cleanup needed
      }
    }
    ```
  - [x] 7.2 The `createAttackState` factory is optional (default `null`) so existing usages of `PatrolState` with no attack behavior still work (backward compatible for tests).
  - [x] 7.3 The factory returns a NEW `AttackState` instance each time because `AttackState` has `fired` state that needs to reset per attack cycle.
  - [x] 7.4 Timer resets in `enter()` so re-entering PatrolState (from AttackState) starts a fresh patrol duration before the next attack.

- [x] Task 8: Wire up the attack chain in `EnemySpawner` (AC: #2, #12)
  - [x] 8.1 Modify `EnemySpawner` constructor to accept `EnemyProjectileSystem` fire callback and camera reference:
    ```typescript
    import { AttackState, type FireCallback } from '../ai/states/AttackState.ts';

    export class EnemySpawner {
      // ... existing fields ...
      private fireCallback: FireCallback;
      private playerPositionGetter: () => THREE.Vector3;

      constructor(
        scene: THREE.Scene,
        gameObjectManager: GameObjectManager,
        vectorMaterials: VectorMaterials,
        fireCallback: FireCallback,
        playerPositionGetter: () => THREE.Vector3,
      ) {
        // ... existing setup ...
        this.fireCallback = fireCallback;
        this.playerPositionGetter = playerPositionGetter;
      }
    ```
  - [x] 8.2 In `spawnWave()`, create the Patrol -> Attack -> Patrol cycle:
    ```typescript
    // Replace: enemy.transitionToState(new SpawnState(new PatrolState()));
    // With:
    const createAttackState = () => new AttackState(
      this.fireCallback,
      this.playerPositionGetter,
      new PatrolState(createAttackState),  // attack returns to patrol which attacks again
    );
    const patrolState = new PatrolState(createAttackState);
    enemy.transitionToState(new SpawnState(patrolState));
    ```
  - [x] 8.3 This creates a self-referencing cycle: PatrolState -> (timer) -> AttackState -> (fire) -> PatrolState -> (timer) -> AttackState... The cycle continues until the enemy is destroyed.
  - [x] 8.4 The `createAttackState` factory is called fresh each time, producing a new `AttackState` with `fired = false`, and a new `PatrolState` with `patrolTimer = 0`. This ensures clean state transitions without stale data.

- [x] Task 9: Integrate new systems into `main.ts` (AC: #8, #9)
  - [x] 9.1 Import new modules:
    ```typescript
    import { Player } from './entities/player/Player.ts';
    import { EnemyProjectileSystem } from './systems/EnemyProjectileSystem.ts';
    ```
  - [x] 9.2 Create Player instance (BEFORE EnemyProjectileSystem and EnemySpawner):
    ```typescript
    // --- Player Setup (Story 2-5) ---
    const player = new Player();
    ```
  - [x] 9.3 Create EnemyProjectileSystem (AFTER Player, BEFORE EnemySpawner):
    ```typescript
    // --- Enemy Projectile System Setup (Story 2-5) ---
    const enemyProjectileSystem = new EnemyProjectileSystem(
      scene,
      vectorMaterials,
      player.collider,
    );
    ```
  - [x] 9.4 Update EnemySpawner construction to pass fire callback and player position getter:
    ```typescript
    const enemySpawner = new EnemySpawner(
      scene,
      gameObjectManager,
      vectorMaterials,
      (origin, target, speed, damage) => enemyProjectileSystem.fireAt(origin, target, speed, damage),
      () => camera.position,
    );
    ```
  - [x] 9.5 Add to animation loop -- Player sync AFTER rail movement, enemy projectile update AFTER collision:
    ```typescript
    // Rail movement
    railMovement.update(dt, viewportOffset);

    // ... banking effect ...

    // Sync player collider to camera position (Story 2-5)
    player.syncToCamera(camera);

    // Enemy spawning, game objects, data lance, collision (existing order)
    enemySpawner.update(railMovement.getRailProgress());
    gameObjectManager.update(dt);
    dataLanceSystem.update(dt);
    collisionSystem.update();

    // Enemy projectile movement + player collision (Story 2-5)
    enemyProjectileSystem.update(dt);

    // Effects (after all collision events emitted)
    effectsManager.update(dt);

    cockpitRenderer.update(dt);
    renderPipeline.render();
    ```
  - [x] 9.6 The animation loop order ensures:
    1. `updateViewportOffset()` -- input processing
    2. `railMovement.update()` -- camera position along rail
    3. Banking quaternion -- camera roll
    4. `player.syncToCamera()` -- player collider at camera position
    5. `enemySpawner.update()` -- spawn enemies (may fire immediately if AttackState)
    6. `gameObjectManager.update(dt)` -- enemy AI/movement (PatrolState timer, AttackState fires)
    7. `dataLanceSystem.update(dt)` -- fire and move player bolts
    8. `collisionSystem.update()` -- player bolts vs enemies
    9. `enemyProjectileSystem.update(dt)` -- move enemy bursts, check vs player collider
    10. `effectsManager.update(dt)` -- explosion animations
    11. `cockpitRenderer.update(dt)` -- cosmetic recoil
    12. `renderPipeline.render()` -- draw frame

- [x] Task 10: Write tests (AC: #14, #15)
  - [x] 10.1 Create `src/__tests__/EnemyDataBurst.test.ts`:
    - Test: `EnemyDataBurst` is exported as a class from `src/entities/projectiles/EnemyDataBurst.ts`
    - Test: `EnemyDataBurst` prototype has `activate` method
    - Test: `EnemyDataBurst` prototype has `deactivate` method
    - Test: `EnemyDataBurst` prototype has `update` method
    - Test: `EnemyDataBurst` has `active`, `direction`, `speed`, `damage`, `distance`, `mesh`, `collider` properties
  - [x] 10.2 Create `src/__tests__/EnemyProjectileSystem.test.ts`:
    - Test: `EnemyProjectileSystem` is exported as a class from `src/systems/EnemyProjectileSystem.ts`
    - Test: `EnemyProjectileSystem` prototype has `fireAt` method
    - Test: `EnemyProjectileSystem` prototype has `update` method
  - [x] 10.3 Create `src/__tests__/AttackState.test.ts`:
    - Test: `AttackState` is exported as a class from `src/ai/states/AttackState.ts`
    - Test: `AttackState` prototype has `enter`, `update`, `exit` methods (AIState interface)
    - Test: `FireCallback` type is exported
  - [x] 10.4 Create `src/__tests__/Player.test.ts`:
    - Test: `Player` is exported as a class from `src/entities/player/Player.ts`
    - Test: `Player` prototype has `takeDamage` method
    - Test: `Player` prototype has `syncToCamera` method
    - Test: `Player` has `shields`, `maxShields`, `collider` properties
  - [x] 10.5 Add to existing `src/__tests__/constants.test.ts` (or create `src/__tests__/EnemyBurstConstants.test.ts`):
    - Test: `ENEMY_DATA_BURST_POOL_SIZE` is exported and is a positive integer
    - Test: `ENEMY_DATA_BURST_LENGTH` is a positive number
    - Test: `ENEMY_DATA_BURST_MAX_RANGE` is a positive number
    - Test: `ENEMY_DATA_BURST_COLLIDER_RADIUS` is a positive number
    - Test: `PLAYER_MAX_SHIELDS` is a positive number
    - Test: `PLAYER_COLLIDER_RADIUS` is a positive number
    - Test: `ATTACK_STATE_PATROL_DURATION` is a positive number
  - [x] 10.6 Add to existing `src/__tests__/EventBus.test.ts` (or create separate):
    - Test: `GameEvents` interface includes `playerHit` with `damage` and `source` fields
  - [x] 10.7 Follow existing test patterns: `vitest` with `describe`/`it`/`expect`, prototype checks for classes, config value validation
  - [x] 10.8 Run all tests -- verify 401 existing tests pass plus new tests, zero regressions

- [x] Task 11: Visual verification and performance validation (AC: #13, #16, #17, #18)
  - [x] 11.1 Run `npm run build` -- verify clean production build with zero TypeScript errors
  - [x] 11.2 Run `npm run dev` -- visual verification:
    - Fly along rail, enemies spawn and patrol as before
    - After ~3 seconds of patrolling, a Sentinel fires a visible data burst toward the player
    - Data burst is a short glowing green line that travels toward the player's position
    - Data bursts are visually distinguishable from Data Lance bolts (slightly dimmer, shorter)
    - If the player doesn't dodge, the burst reaches the player and `playerHit` fires (check console log)
    - If the player moves with arrow keys, they can dodge the burst
    - Enemies cycle: patrol -> fire -> patrol -> fire (repeating until destroyed)
    - Multiple enemies fire independently based on their own timers
    - Destroying an enemy still produces vector shard explosions (no regression)
    - Data Lance bolt-enemy collision still works (no regression)
    - Cockpit, banking, grid, starfield all still work (no regression)
  - [x] 11.3 Verify 60 FPS stable with enemy projectiles active
  - [x] 11.4 Verify burst pool handles burst fire gracefully (30 slots should be plenty for 11 max enemies with 2s+ cooldown)

## Dev Notes

### Architecture Compliance

- **`EnemyDataBurst` at `src/entities/projectiles/EnemyDataBurst.ts`** -- matches architecture: `Projectile (abstract) > EnemyDataBurst` in entity hierarchy [Source: game-architecture.md#Entity System]
- **`EnemyProjectileSystem` at `src/systems/EnemyProjectileSystem.ts`** -- game systems belong in `src/systems/` [Source: game-architecture.md#Directory Structure]
- **`Player` at `src/entities/player/Player.ts`** -- matches architecture directory structure [Source: game-architecture.md#Directory Structure: `src/entities/player/Player.ts`]
- **`AttackState` at `src/ai/states/AttackState.ts`** -- AI states belong in `src/ai/states/` [Source: game-architecture.md#Enemy AI: "States: Spawn -> Patrol -> Attack -> Evade -> Destroyed"]
- **Systems never import each other** -- EnemyProjectileSystem emits events via EventBus, does NOT import CollisionSystem; AttackState uses callback injection, does NOT import EnemyProjectileSystem [Source: project-context.md#Architecture Rules]
- **Materials via `VectorMaterials.create()`** -- NEVER `new LineBasicMaterial()` directly [Source: project-context.md#Critical Rules]
- **Bloom layer enabled** -- `mesh.layers.enable(BLOOM_LAYER)` on all data burst meshes [Source: project-context.md#Critical Rules]
- **Event naming: camelCase verbs** -- `playerHit` matches the architecture event spec exactly [Source: game-architecture.md#Event System: `playerHit: { damage: number, source: string }`]
- **No GC pauses** -- pre-allocated projectile pool, no per-frame allocations, pre-allocated temp vectors [Source: project-context.md#Performance Rules]
- **Logging via Logger** -- not `console.log()` [Source: project-context.md#Critical Rules]
- **AI states NEVER check level number** -- behavioral variation comes from `BehaviorParams` injected at spawn time [Source: project-context.md#Architecture Rules]
- **Collision: Sphere-sphere for enemy projectiles vs player** -- architecture specifies this pattern [Source: game-architecture.md#Collision System: "Enemy projectiles -> Player: Sphere-sphere distance check each frame"]
- **Object pooling for projectiles** -- `ObjectPool<EnemyDataBurst> pre-warm 30` specified in architecture [Source: game-architecture.md#Object Pooling]

### Critical Technical Details

**Sphere-sphere collision for projectile-player:**

The architecture specifies bounding sphere intersection checks per frame for enemy projectiles vs player. `THREE.Sphere.intersectsSphere()` is an O(1) distance comparison -- it checks whether the distance between sphere centers is less than the sum of both radii. With 30 max projectiles and 1 player sphere, this is 30 comparisons per frame (~0.01ms). No raycasting needed.

```typescript
// Built-in Three.js method:
burst.collider.intersectsSphere(playerCollider) // true if spheres overlap
```

**Pre-allocated projectile pool pattern:**

The pool pattern matches DataLanceSystem exactly: pre-allocate all instances at construction, toggle `visible` and `active` flags to acquire/release. No scene graph mutations during gameplay. All meshes are added to the scene once at construction and stay there.

**Attack-patrol cycle via factory functions:**

The Patrol -> Attack -> Patrol cycle uses factory functions to avoid stale state:

```
PatrolState(createAttackState) -> [timer expires] -> createAttackState() ->
  AttackState(fireCallback, getPlayerPos, new PatrolState(createAttackState)) -> [fires] ->
  PatrolState(createAttackState) -> [timer expires] -> ...
```

Each transition creates fresh state instances. This prevents bugs where `fired = false` or `patrolTimer` carry over from previous cycles.

**Player position for targeting:**

`AttackState` gets a `playerPositionGetter: () => Vector3` function. This returns `camera.position` which is updated by `railMovement` each frame. The burst fires toward WHERE the player IS, not where they WILL be -- this makes data bursts dodgeable (player can move with arrow keys after the burst is fired). At 15 u/s burst speed and typical engagement distance of 20-40 units, the player has 1-3 seconds to dodge.

**EnemySpawner constructor change:**

Adding `fireCallback` and `playerPositionGetter` parameters changes the `EnemySpawner` constructor signature. The `main.ts` call site must be updated. This is a breaking change to `EnemySpawner` but only `main.ts` instantiates it, so impact is contained.

**PatrolState backward compatibility:**

The `createAttackState` parameter is optional (defaults to `null`). Existing tests that create `PatrolState()` with no args will still work -- enemies just won't attack. This preserves the 401 existing tests.

### What NOT to Do

- Do NOT create individual `THREE.LineSegments` per projectile per fire event -- use the pre-allocated pool
- Do NOT use `THREE.Points` or particle textures for data bursts -- vector wireframe aesthetic only
- Do NOT use `new LineBasicMaterial()` directly -- always `vectorMaterials.create()`
- Do NOT import one system from another -- use EventBus and callback injection
- Do NOT use `console.log()` -- use `Logger.level('System', msg, ctx)`
- Do NOT use `fetch()` or `await` in the update loop
- Do NOT implement screen shake or damage flash -- those are Story 2-7
- Do NOT implement HUD shield display -- that is Story 2-6
- Do NOT implement game over state -- that is Story 2-10
- Do NOT implement `playerDied` event -- that is Story 2-10
- Do NOT implement EvadeState -- that is optional for Level 1 Sentinels (evasionChance = 0.0 per BehaviorParams)
- Do NOT create any new objects in the `update()` method -- all allocations happen in constructors and activation methods
- Do NOT modify `CollisionSystem.ts`, `DataLanceSystem.ts`, `EffectsManager.ts`, `VectorShardExplosion.ts`, `RenderPipeline.ts`, `SceneEnvironment.ts`, or `CockpitRenderer.ts`
- Do NOT modify `Enemy.ts` or `Sentinel.ts` -- enemy classes are unchanged
- Do NOT modify `DestroyedState.ts` or `SpawnState.ts` -- these states are unchanged
- Do NOT break existing event types in `GameEvents.ts` (`weaponFired`, `enemySpawned`, `enemyDestroyed`)
- Do NOT add `if (level === X)` checks in AI states -- use `BehaviorParams` values

### Performance Considerations

- **Draw calls:** 30 data burst meshes in the scene (always there, visibility toggled). Only visible/active ones contribute draw calls. Typical active count: 3-5 at any time. Well within 500 budget.
- **Collision checks:** 30 sphere-sphere intersections per frame (active projectiles vs player). Each is a single distance comparison. ~0.01ms total.
- **Memory:** 30 `EnemyDataBurst` instances x (Float32Array(6) + Sphere + metadata) = ~5 KB total. Negligible.
- **No GC pressure:** All pools pre-allocated. No per-frame `new` calls. Pre-allocated temp vectors in `EnemyProjectileSystem` and `AttackState`.
- **Material count:** 1 additional `LineBasicMaterial` registered with `VectorMaterials`. Shared across all 30 burst instances.

### Previous Story Intelligence (2-4)

**Key patterns from Story 2-4 to preserve:**

- 401 tests currently pass (30 test files) -- new tests must not break any
- `main.ts` animation loop order: viewport -> rail -> banking -> spawner -> gameObjects -> dataLance -> collision -> effects -> cockpit -> render
- `effectsManager.update(dt)` is called AFTER `collisionSystem.update()` -- maintain this ordering
- `eventBus` singleton at `src/core/GameEvents.ts` -- import and use for event emission/subscription
- `VectorMaterials.create(id, lightnessOffset)` creates a `LineBasicMaterial` registered for palette transitions
- `VectorMaterials.create()` enforces unique IDs in dev mode (`__DEV__` check)
- `BLOOM_LAYER = 1` in constants -- all vector geometry enables this layer
- `Logger` import from `../core/Logger.ts` with `.info()`, `.debug()`, `.warn()` methods
- Test pattern: `vitest` with `describe`/`it`/`expect`, prototype checks for classes, config value validation
- `SENTINEL_BEHAVIOR_LEVEL1` has `attackDamage: 10` and `projectileSpeed: 15` -- these drive the data burst behavior
- `SENTINEL_BEHAVIOR_LEVEL1.attackCooldown = 2.0` -- this is the original design parameter but `ATTACK_STATE_PATROL_DURATION` (3.0s) controls patrol-to-attack timing for a gentler initial experience

### Project Structure Notes

New files:
- `src/entities/projectiles/EnemyDataBurst.ts` -- Enemy data burst projectile entity
- `src/systems/EnemyProjectileSystem.ts` -- Projectile pool management + player collision
- `src/entities/player/Player.ts` -- Player entity with shields and collider
- `src/ai/states/AttackState.ts` -- AI state that fires data bursts
- `src/__tests__/EnemyDataBurst.test.ts` -- Tests for EnemyDataBurst
- `src/__tests__/EnemyProjectileSystem.test.ts` -- Tests for EnemyProjectileSystem
- `src/__tests__/Player.test.ts` -- Tests for Player
- `src/__tests__/AttackState.test.ts` -- Tests for AttackState
- `src/__tests__/EnemyBurstConstants.test.ts` -- Tests for new constants

Modified files:
- `src/config/constants.ts` -- Add data burst, player, and attack state constants
- `src/core/GameEvents.ts` -- Add `playerHit` event type
- `src/ai/states/PatrolState.ts` -- Add attack timer and state factory
- `src/systems/EnemySpawner.ts` -- Accept fire callback and wire attack-patrol cycle
- `src/main.ts` -- Integrate Player, EnemyProjectileSystem, update animation loop order

NOT modified:
- `src/systems/CollisionSystem.ts` -- player bolt-enemy collisions unchanged
- `src/systems/DataLanceSystem.ts` -- player weapon system unchanged
- `src/systems/EffectsManager.ts` -- explosion effects unchanged
- `src/rendering/RenderPipeline.ts`
- `src/rendering/VectorMaterials.ts` (no API changes needed)
- `src/rendering/CockpitRenderer.ts`
- `src/rendering/SceneEnvironment.ts`
- `src/entities/enemies/Enemy.ts` -- enemy base class unchanged
- `src/entities/enemies/Sentinel.ts` -- sentinel geometry unchanged
- `src/entities/effects/VectorShardExplosion.ts` -- explosions unchanged
- `src/entities/GameObject.ts`
- `src/entities/GameObjectManager.ts`
- `src/ai/states/SpawnState.ts`
- `src/ai/states/DestroyedState.ts`
- `src/core/EventBus.ts`
- `src/core/ObjectPool.ts` (placeholder stays; real pooling is Story 2-9)

### Technology Versions Verified

- **Three.js r183** (`^0.183.2`) -- `THREE.Sphere`: `intersectsSphere(sphere)` returns boolean, `.center.copy(vec3)` for position sync. `THREE.BufferGeometry`, `THREE.BufferAttribute`, `THREE.LineSegments` -- all APIs stable, no breaking changes in r183. `THREE.Vector3.subVectors(a, b).normalize()` for direction calculation. Confirmed via Perplexity research: no r183 breaking changes to Sphere, Ray, BufferGeometry, or LineSegments APIs.
- **TypeScript ~5.9.3** -- strict mode. Interface types, callback typing.
- **Vitest ^4.1.2** -- test framework. Existing patterns preserved.
- **Vite 8.0.3** -- build tool. No new dependencies added.

### References

- [Source: _bmad-output/epics.md#Epic 2 Story 5] -- "As a player, I can take damage from enemy data bursts so that there are stakes and tension"
- [Source: _bmad-output/epics.md#Epic 2 Scope] -- "Bounding sphere collision (enemy projectiles -> player)", "Shield/health system with damage feedback"
- [Source: _bmad-output/epics.md#Epic 2 Deliverable] -- "dodge incoming data bursts, see shields deplete on hits"
- [Source: _bmad-output/gdd.md#Hit Detection] -- "Enemy projectiles -> Player: Bounding sphere intersection checks per frame. Enemy data bursts are visible, readable, and dodgeable."
- [Source: _bmad-output/gdd.md#Enemy Design] -- "Enemies are hostile AI defense programs... They fire data bursts at the player."
- [Source: _bmad-output/gdd.md#Survive Mechanic] -- "Dodge enemy data bursts, navigate corridor obstacles, manage shields."
- [Source: _bmad-output/gdd.md#Failure Conditions] -- "Shield Depletion: Player's shields reach zero = destruction of the combat program."
- [Source: _bmad-output/game-architecture.md#Entity System] -- "Projectile (abstract) > EnemyDataBurst", "Player (cockpit, shields, position)"
- [Source: _bmad-output/game-architecture.md#Collision System] -- "Enemy projectiles -> Player: Sphere-sphere distance check each frame. Player has a bounding sphere; enemy projectiles have small spheres."
- [Source: _bmad-output/game-architecture.md#Object Pooling] -- "ObjectPool<EnemyDataBurst> -- pre-warm 30"
- [Source: _bmad-output/game-architecture.md#Event System] -- "playerHit: { damage: number, source: string } Publisher: CollisionSystem Subscribers: Player, HUD, AudioManager, ScreenShake"
- [Source: _bmad-output/game-architecture.md#Enemy AI] -- "States: SpawnState -> PatrolState -> AttackState -> EvadeState -> DestroyedState", "attackCooldown: 2.0s (Level 1)"
- [Source: _bmad-output/project-context.md#Architecture Rules] -- "Entities never import systems", "Systems never import each other"
- [Source: _bmad-output/project-context.md#Performance Rules] -- "No GC pauses during gameplay", "Raycasting on fire events only"

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Fixed TS6133 error: `EnemyProjectileSystem.scene` field was unused after construction. Removed private field, used constructor parameter directly for `scene.add()` calls.
- Fixed bloom layer test: `THREE.Layers.set()` returns void, not chainable. Split into two-line pattern.

### Completion Notes List

- All 11 tasks and their subtasks implemented per story spec
- 4 new source files created: EnemyDataBurst, EnemyProjectileSystem, Player, AttackState
- 3 existing files modified: constants.ts (new constants), GameEvents.ts (playerHit event), PatrolState.ts (attack timer), EnemySpawner.ts (attack chain wiring), main.ts (system integration)
- 5 new test files created: EnemyDataBurst.test.ts, EnemyProjectileSystem.test.ts, AttackState.test.ts, Player.test.ts, EnemyBurstConstants.test.ts
- 1 existing test file updated: EventBus.test.ts (playerHit event test)
- All 446 tests pass (409 pre-existing + 37 new), zero regressions
- Clean production build with zero TypeScript errors
- Architecture compliance verified: no cross-system imports, EventBus for communication, VectorMaterials.create() for materials, BLOOM_LAYER enabled, Logger for logging, pre-allocated pool for projectiles

### File List

New files:
- src/entities/projectiles/EnemyDataBurst.ts
- src/systems/EnemyProjectileSystem.ts
- src/entities/player/Player.ts
- src/ai/states/AttackState.ts
- src/__tests__/EnemyDataBurst.test.ts
- src/__tests__/EnemyProjectileSystem.test.ts
- src/__tests__/Player.test.ts
- src/__tests__/AttackState.test.ts
- src/__tests__/EnemyBurstConstants.test.ts

Modified files:
- src/config/constants.ts
- src/core/GameEvents.ts
- src/ai/states/PatrolState.ts
- src/systems/EnemySpawner.ts
- src/main.ts
- src/__tests__/EventBus.test.ts

## Change Log

- 2026-03-26: Story 2-5 implemented — Added enemy data burst projectile system with pre-allocated pool (30 bursts), Player entity with shields and bounding sphere collider, AttackState AI state with fire callback injection, PatrolState attack timer for Patrol->Attack->Patrol loop, playerHit event for damage communication, and full main.ts integration with correct animation loop ordering. 37 new tests added, all 446 tests pass.
- 2026-03-26: Code review (AI) — 1 LOW issue found and fixed: Extracted per-activation `new THREE.Vector3(0, 0, 1)` allocation in `EnemyDataBurst.activate()` to module-level `DEFAULT_LINE_AXIS` constant to eliminate GC pressure during gameplay. All 446 tests pass, clean build verified. All ACs validated against implementation. Architecture compliance confirmed (no cross-system imports, EventBus communication, VectorMaterials.create() usage, bloom layer enabled, Logger for logging, pre-allocated pools).
