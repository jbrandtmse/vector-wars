# Story 2.2: Enemy Spawning and Patrol

Status: done

## Story

As a player,
I want to see enemies spawn and patrol in the environment,
so that there are targets to engage.

## Acceptance Criteria

1. A `GameObject` base class exists at `src/entities/GameObject.ts` with: `THREE.Object3D` ownership, an invisible `THREE.Sphere` bounding collider, an `update(dt)` method, an `isActive` flag, and automatic `BLOOM_LAYER` enabling on all vector geometry
2. A `GameObjectManager` exists at `src/entities/GameObjectManager.ts` that maintains the active entity list, calls `update(dt)` on all active entities each frame, and provides `add()`/`remove()`/`getAll()` methods
3. An abstract `Enemy` base class exists at `src/entities/enemies/Enemy.ts` extending `GameObject` with: `health`, `scoreValue`, `BehaviorParams`, a reference to its `AIStateMachine`, and a bounding sphere radius tunable per archetype
4. A `Sentinel` enemy class exists at `src/entities/enemies/Sentinel.ts` extending `Enemy` with: a vector wireframe geometry (simple geometric construct -- clean, minimal wireframe using `EdgesGeometry` + `LineSegments`), assigned bloom layer, and Sentinel-specific defaults (health, score value, collider radius)
5. Sentinel geometry is a recognizable geometric shape (e.g., octahedron or icosahedron wireframe, detail level 0-1) created via `EdgesGeometry` wrapping a Three.js primitive, rendered with a material from `VectorMaterials.create()` -- NEVER direct material creation
6. An `AIState` interface exists at `src/ai/AIState.ts` with `enter(enemy)`, `update(enemy, dt)`, and `exit(enemy)` methods
7. AI state classes exist at `src/ai/states/`: `SpawnState.ts`, `PatrolState.ts`, `DestroyedState.ts` -- each implementing the `AIState` interface
8. `SpawnState`: enemy fades in or scales up over ~0.5s at its spawn position, then transitions to `PatrolState`
9. `PatrolState`: enemy moves along a local patrol path (orbit, figure-eight, or back-and-forth) relative to its spawn point using delta-time movement at `BehaviorParams.patrolSpeed` -- movement is smooth, readable, and visually communicates "these are targets"
10. `DestroyedState`: enemy becomes invisible, is marked inactive, and is ready for pool recycling (actual explosion effects are Story 2-4, actual pool recycling is Story 2-9 -- for now, just hide and mark inactive)
11. A `BehaviorParams` interface exists at `src/ai/BehaviorParams.ts` defining: `patrolSpeed`, `attackCooldown`, `evasionChance`, `movementRandomness`, `attackDamage`, `projectileSpeed` -- with Level 1 "Mechanical" defaults in `src/config/constants.ts`
12. An `EnemySpawner` system exists at `src/systems/EnemySpawner.ts` that: reads spawn event definitions (distance-based triggers), checks `RailMovement.getRailProgress()` each frame, and spawns enemies when the player reaches trigger distances along the rail path
13. Spawn events are defined as an array of `SpawnEvent` objects in `src/config/constants.ts` (hardcoded for now -- JSON loading comes later with `LevelManager`): each event specifies `railProgress` (0-1 trigger point), `enemyType`, `spawnPosition` (world-space Vector3), and `count`
14. At least 3-4 spawn events are defined across the rail loop, spawning groups of 2-4 Sentinels each, totaling 8-12 enemies per loop -- enough to feel like a populated combat space with breathing room between waves
15. Enemies spawn at world-space positions near the rail path but offset to the sides and ahead of the player -- enemies should be visible in front of the player as they patrol, creating targets to fly toward
16. Spawned enemies are added to the scene and to `GameObjectManager` -- they appear with their `SpawnState` animation then begin patrolling
17. `EnemySpawner` tracks which spawn events have already fired so enemies don't re-spawn on every loop (spawn events fire once per game session, not per loop)
18. All enemies update via `GameObjectManager.update(dt)` called from the main animation loop
19. The `EventBus` is extended with an `enemySpawned` event: `{ enemy: Enemy, position: Vector3 }`
20. Frame rate remains at 60 FPS stable with enemies active -- 8-12 active enemies add negligible render cost (each is ~20-60 edges of LineSegments geometry)
21. Running `npm run build` produces a clean production build with zero TypeScript errors
22. Unit tests exist for: `GameObject` base class, `GameObjectManager` operations, `Enemy` class construction, `Sentinel` class, `AIState` interface compliance, `BehaviorParams` defaults, `EnemySpawner` trigger logic, and `EventBus` event types
23. All existing 267 tests continue to pass -- zero regressions
24. Enemies are visible and patrolling when running the game in the browser -- the player flies along the rail and sees wireframe constructs moving in space ahead and around them

## Tasks / Subtasks

- [x] Task 1: Create `GameObject` base class at `src/entities/GameObject.ts` (AC: #1)
  - [x] 1.1 Create the `GameObject` class:
    ```typescript
    export abstract class GameObject {
      protected object3D: THREE.Object3D;
      protected collider: THREE.Sphere;
      private active: boolean = true;

      constructor(colliderRadius: number = 1.0) {
        this.object3D = new THREE.Object3D();
        this.collider = new THREE.Sphere(new THREE.Vector3(), colliderRadius);
      }

      abstract update(dt: number): void;

      get isActive(): boolean { return this.active; }
      setActive(value: boolean): void { this.active = value; }
      getObject3D(): THREE.Object3D { return this.object3D; }
      getPosition(): THREE.Vector3 { return this.object3D.position; }
      getCollider(): THREE.Sphere { return this.collider; }

      /** Call in subclass constructors after adding geometry to object3D */
      protected enableBloomOnChildren(): void {
        this.object3D.traverse((child) => {
          child.layers.enable(BLOOM_LAYER);
        });
      }
    }
    ```
  - [x] 1.2 Import `BLOOM_LAYER` from `config/constants.ts`
  - [x] 1.3 Ensure `collider.center` is synced to `object3D.position` -- either in base `update()` or via a `syncCollider()` method the subclass calls

- [x] Task 2: Create `GameObjectManager` at `src/entities/GameObjectManager.ts` (AC: #2, #18)
  - [x] 2.1 Create class with `private entities: GameObject[] = []`
  - [x] 2.2 Implement `add(entity: GameObject): void` -- adds to array
  - [x] 2.3 Implement `remove(entity: GameObject): void` -- removes from array
  - [x] 2.4 Implement `getAll(): readonly GameObject[]` -- returns the array
  - [x] 2.5 Implement `update(dt: number): void` -- iterates all entities, calls `entity.update(dt)` only on active entities
  - [x] 2.6 Implement `getActiveCount(): number` -- for debug/testing

- [x] Task 3: Create `AIState` interface and state classes (AC: #6, #7, #8, #9, #10)
  - [x] 3.1 Create `src/ai/AIState.ts`:
    ```typescript
    import type { Enemy } from '../entities/enemies/Enemy.ts';

    export interface AIState {
      enter(enemy: Enemy): void;
      update(enemy: Enemy, dt: number): void;
      exit(enemy: Enemy): void;
    }
    ```
  - [x] 3.2 Create `src/ai/BehaviorParams.ts` (AC: #11):
    ```typescript
    export interface BehaviorParams {
      patrolSpeed: number;
      attackCooldown: number;
      evasionChance: number;
      movementRandomness: number;
      attackDamage: number;
      projectileSpeed: number;
    }
    ```
  - [x] 3.3 Add Level 1 Sentinel defaults to `src/config/constants.ts`:
    ```typescript
    export const SENTINEL_BEHAVIOR_LEVEL1: BehaviorParams = {
      patrolSpeed: 1.0,
      attackCooldown: 2.0,
      evasionChance: 0.0,
      movementRandomness: 0.0,
      attackDamage: 10,
      projectileSpeed: 15,
    };
    export const SENTINEL_COLLIDER_RADIUS = 1.5;
    export const SENTINEL_HEALTH = 30;
    export const SENTINEL_SCORE_VALUE = 100;
    ```
  - [x] 3.4 Create `src/ai/states/SpawnState.ts`:
    - On `enter()`: set enemy scale to 0 (or opacity to 0), store spawn timer = 0
    - On `update()`: increment timer, lerp scale from 0 to 1 over ~0.5s
    - When timer >= 0.5: call `enemy.transitionToState('patrol')` (or equivalent FSM transition)
    - On `exit()`: ensure scale is exactly 1
  - [x] 3.5 Create `src/ai/states/PatrolState.ts`:
    - On `enter()`: initialize patrol angle = 0 (for orbital patrol)
    - On `update()`: orbit around spawn point at `params.patrolSpeed`:
      ```typescript
      // Simple circular orbit around spawn point
      const orbitRadius = 5; // units
      this.patrolAngle += enemy.params.patrolSpeed * dt;
      const spawnPos = enemy.getSpawnPosition();
      enemy.getObject3D().position.set(
        spawnPos.x + Math.cos(this.patrolAngle) * orbitRadius,
        spawnPos.y + Math.sin(this.patrolAngle * 0.5) * 1.5, // slight Y bob
        spawnPos.z + Math.sin(this.patrolAngle) * orbitRadius
      );
      ```
    - The orbit should be visually readable and communicate "this is a target"
    - NOTE: AttackState is NOT implemented in this story (comes in Story 2-3/2-5)
  - [x] 3.6 Create `src/ai/states/DestroyedState.ts`:
    - On `enter()`: set enemy `object3D.visible = false`, call `enemy.setActive(false)`
    - On `update()`: no-op (inactive enemies aren't updated by GameObjectManager)
    - On `exit()`: no-op

- [x] Task 4: Create `Enemy` base class and `Sentinel` entity (AC: #3, #4, #5)
  - [x] 4.1 Create `src/entities/enemies/Enemy.ts`:
    ```typescript
    import { GameObject } from '../GameObject.ts';
    import type { AIState } from '../../ai/AIState.ts';
    import type { BehaviorParams } from '../../ai/BehaviorParams.ts';

    export abstract class Enemy extends GameObject {
      public health: number;
      public scoreValue: number;
      public params: BehaviorParams;
      protected currentState: AIState | null = null;
      private spawnPosition = new THREE.Vector3();

      constructor(
        health: number,
        scoreValue: number,
        params: BehaviorParams,
        colliderRadius: number,
      ) {
        super(colliderRadius);
        this.health = health;
        this.scoreValue = scoreValue;
        this.params = params;
      }

      setSpawnPosition(pos: THREE.Vector3): void {
        this.spawnPosition.copy(pos);
        this.object3D.position.copy(pos);
      }

      getSpawnPosition(): THREE.Vector3 {
        return this.spawnPosition;
      }

      transitionToState(state: AIState): void {
        if (this.currentState) this.currentState.exit(this);
        this.currentState = state;
        this.currentState.enter(this);
      }

      update(dt: number): void {
        if (this.currentState) {
          this.currentState.update(this, dt);
        }
        // Sync collider position to object3D position
        this.collider.center.copy(this.object3D.position);
      }
    }
    ```
  - [x] 4.2 Create `src/entities/enemies/Sentinel.ts`:
    ```typescript
    import * as THREE from 'three';
    import { Enemy } from './Enemy.ts';
    import { BLOOM_LAYER, SENTINEL_HEALTH, SENTINEL_SCORE_VALUE, SENTINEL_COLLIDER_RADIUS, SENTINEL_BEHAVIOR_LEVEL1 } from '../../config/constants.ts';
    import type { VectorMaterials } from '../../rendering/VectorMaterials.ts';
    import type { BehaviorParams } from '../../ai/BehaviorParams.ts';

    export class Sentinel extends Enemy {
      constructor(vectorMaterials: VectorMaterials, params?: BehaviorParams) {
        super(
          SENTINEL_HEALTH,
          SENTINEL_SCORE_VALUE,
          params ?? SENTINEL_BEHAVIOR_LEVEL1,
          SENTINEL_COLLIDER_RADIUS,
        );
        this.createGeometry(vectorMaterials);
      }

      private createGeometry(vectorMaterials: VectorMaterials): void {
        // Simple geometric wireframe -- clean, minimal (GDD: "Simple geometric construct")
        const baseGeometry = new THREE.OctahedronGeometry(1.0, 0);
        const edges = new THREE.EdgesGeometry(baseGeometry);
        const material = vectorMaterials.create(`sentinel-${this.id}`);
        const wireframe = new THREE.LineSegments(edges, material);
        wireframe.layers.enable(BLOOM_LAYER);
        this.object3D.add(wireframe);
        baseGeometry.dispose(); // Only edges geometry is needed
      }
    }
    ```
    NOTE: Each Sentinel needs a unique material ID. Add an incrementing static `nextId` counter to `Enemy` or `Sentinel`, or use a UUID approach. Alternatively, share ONE material across all Sentinels by creating the material once and reusing it (preferred for performance):
    ```typescript
    // Better approach: shared material created once
    private static sharedMaterial: THREE.LineBasicMaterial | null = null;
    private static initMaterial(vectorMaterials: VectorMaterials): THREE.LineBasicMaterial {
      if (!Sentinel.sharedMaterial) {
        Sentinel.sharedMaterial = vectorMaterials.create('sentinel');
      }
      return Sentinel.sharedMaterial;
    }
    ```
  - [x] 4.3 Ensure `Sentinel` geometry has bloom layer enabled via `wireframe.layers.enable(BLOOM_LAYER)`
  - [x] 4.4 Give `Enemy` a unique instance `id` (incrementing integer) for logging: `private static nextId = 0; public readonly id = Enemy.nextId++;`

- [x] Task 5: Extend `EventBus` with real implementation and enemy events (AC: #19)
  - [x] 5.1 Implement the `EventBus` at `src/core/EventBus.ts` with typed pub/sub:
    ```typescript
    type EventCallback<T> = (data: T) => void;

    export class EventBus<TEvents extends Record<string, unknown>> {
      private listeners = new Map<keyof TEvents, Set<EventCallback<unknown>>>();

      on<K extends keyof TEvents>(event: K, callback: EventCallback<TEvents[K]>): void {
        if (!this.listeners.has(event)) this.listeners.set(event, new Set());
        this.listeners.get(event)!.add(callback as EventCallback<unknown>);
      }

      off<K extends keyof TEvents>(event: K, callback: EventCallback<TEvents[K]>): void {
        this.listeners.get(event)?.delete(callback as EventCallback<unknown>);
      }

      emit<K extends keyof TEvents>(event: K, data: TEvents[K]): void {
        this.listeners.get(event)?.forEach(cb => cb(data));
      }
    }
    ```
  - [x] 5.2 Update `src/core/GameEvents.ts` to add:
    ```typescript
    enemySpawned: { enemy: Enemy; position: { x: number; y: number; z: number } };
    ```
  - [x] 5.3 Create a module-level singleton `eventBus` instance in `GameEvents.ts` or a separate file: `export const eventBus = new EventBus<GameEvents>();`
  - [x] 5.4 Do NOT break the existing `GameEvents` interface or `WeaponFiredEvent` type

- [x] Task 6: Create `EnemySpawner` system at `src/systems/EnemySpawner.ts` (AC: #12, #13, #14, #15, #16, #17)
  - [x] 6.1 Define `SpawnEvent` interface:
    ```typescript
    interface SpawnEvent {
      railProgress: number;  // 0-1, trigger point on rail
      enemyType: 'sentinel'; // Extend later: 'watchdog' | 'gatekeeper' | 'overseer'
      position: [number, number, number]; // world-space spawn position
      count: number;          // how many to spawn
    }
    ```
  - [x] 6.2 Add spawn event definitions to `src/config/constants.ts`:
    ```typescript
    export const SPAWN_EVENTS: SpawnEvent[] = [
      // Wave 1: ~10% into the loop (3-4 seconds in)
      { railProgress: 0.10, enemyType: 'sentinel', position: [60, 5, -20], count: 3 },
      // Wave 2: ~35% into the loop
      { railProgress: 0.35, enemyType: 'sentinel', position: [-30, 3, 60], count: 3 },
      // Wave 3: ~60% into the loop
      { railProgress: 0.60, enemyType: 'sentinel', position: [-70, 4, -10], count: 2 },
      // Wave 4: ~85% into the loop
      { railProgress: 0.85, enemyType: 'sentinel', position: [30, 2, -55], count: 3 },
    ];
    ```
    Position spawn points near the rail path control points but offset to sides. Enemies should be visible ahead of the player. Total: 11 Sentinels across 4 waves.
  - [x] 6.3 Create `EnemySpawner` class:
    ```typescript
    export class EnemySpawner {
      private firedEvents: Set<number> = new Set(); // indices of already-fired events
      private scene: THREE.Scene;
      private gameObjectManager: GameObjectManager;
      private vectorMaterials: VectorMaterials;
      private spawnStates: Map<number, SpawnState> = new Map(); // reusable state instances
      private patrolState: PatrolState;

      constructor(scene, gameObjectManager, vectorMaterials) { ... }

      update(railProgress: number): void {
        for (let i = 0; i < SPAWN_EVENTS.length; i++) {
          if (this.firedEvents.has(i)) continue;
          const event = SPAWN_EVENTS[i];
          if (railProgress >= event.railProgress) {
            this.spawnWave(event, i);
            this.firedEvents.add(i);
          }
        }
      }

      private spawnWave(event: SpawnEvent, eventIndex: number): void {
        for (let j = 0; j < event.count; j++) {
          const enemy = new Sentinel(this.vectorMaterials);
          // Offset each enemy in the group so they don't stack
          const offset = new THREE.Vector3(
            (j - event.count / 2) * 3, // spread horizontally
            0,
            (j % 2) * 2 // slight depth offset
          );
          const spawnPos = new THREE.Vector3(...event.position).add(offset);
          enemy.setSpawnPosition(spawnPos);
          this.scene.add(enemy.getObject3D());
          this.gameObjectManager.add(enemy);
          enemy.transitionToState(new SpawnState()); // each enemy gets own state instance
          eventBus.emit('enemySpawned', { enemy, position: { x: spawnPos.x, y: spawnPos.y, z: spawnPos.z } });
          Logger.info('Spawner', `Sentinel spawned`, { id: enemy.id, position: spawnPos });
        }
      }
    }
    ```
  - [x] 6.4 Handle rail progress wrapping: since the rail loops at 1.0->0.0, the spawner must compare progress correctly. The simplest approach: track `lastProgress` and detect forward crossings of each trigger point. If `lastProgress < event.railProgress <= currentProgress` (accounting for wrap), fire the event.
  - [x] 6.5 After `SpawnState` completes, enemies auto-transition to `PatrolState`. The `SpawnState` should hold a reference to the `PatrolState` to transition to, or the `Enemy` class should handle state sequencing.

- [x] Task 7: Integrate into `main.ts` (AC: #16, #18, #24)
  - [x] 7.1 Import `GameObjectManager`, `EnemySpawner`
  - [x] 7.2 Instantiate `GameObjectManager` and `EnemySpawner` after scene/camera setup
  - [x] 7.3 In the animation loop, add:
    ```typescript
    // Enemy spawning based on rail progress
    enemySpawner.update(railMovement.getRailProgress());
    // Update all game objects (enemies patrol, etc.)
    gameObjectManager.update(dt);
    ```
  - [x] 7.4 Place these calls AFTER `railMovement.update()` and BEFORE `renderPipeline.render()`
  - [x] 7.5 Do NOT modify `RailMovement.ts`, `DataLanceSystem.ts`, `CockpitRenderer.ts`, or `RenderPipeline.ts`

- [x] Task 8: Write tests (AC: #22, #23)
  - [x] 8.1 Create `src/__tests__/GameObject.test.ts`:
    - Test: `GameObject` subclass can be instantiated
    - Test: `isActive` returns true by default
    - Test: `setActive(false)` makes `isActive` return false
    - Test: `getCollider()` returns a `THREE.Sphere`
  - [x] 8.2 Create `src/__tests__/GameObjectManager.test.ts`:
    - Test: `add()` increases entity count
    - Test: `remove()` decreases entity count
    - Test: `getAll()` returns added entities
    - Test: `getActiveCount()` reflects active state
  - [x] 8.3 Create `src/__tests__/Enemy.test.ts`:
    - Test: Enemy subclass exports exist
    - Test: Sentinel class can be referenced
    - Test: BehaviorParams interface shape (via constants export)
  - [x] 8.4 Create `src/__tests__/AIState.test.ts`:
    - Test: SpawnState exports a class
    - Test: PatrolState exports a class
    - Test: DestroyedState exports a class
    - Test: Each state class has enter/update/exit methods (prototype checks)
  - [x] 8.5 Create `src/__tests__/EnemySpawner.test.ts`:
    - Test: EnemySpawner exports a class
    - Test: SPAWN_EVENTS is exported and is an array
    - Test: Each spawn event has required fields (railProgress, enemyType, position, count)
    - Test: All railProgress values are between 0 and 1
    - Test: All count values are positive integers
  - [x] 8.6 Create `src/__tests__/EventBus.test.ts`:
    - Test: EventBus `on`/`emit` delivers events
    - Test: EventBus `off` removes listeners
    - Test: Multiple listeners receive same event
    - Test: Events with different names are independent
  - [x] 8.7 Run all tests -- verify 267 existing tests pass plus new tests, zero regressions

- [x] Task 9: Visual verification and performance validation (AC: #20, #21, #24)
  - [x] 9.1 Run `npm run build` -- verify clean production build with zero TypeScript errors
  - [x] 9.2 Run `npm run dev` -- visual verification:
    - Camera moves along rail, wireframe enemies appear ahead and to the sides
    - Enemies fade/scale in (SpawnState animation)
    - Enemies orbit their spawn points (PatrolState)
    - Enemies glow green with phosphor bloom
    - Multiple waves appear as player progresses along the rail
    - Cockpit, Data Lance, grid, and starfield all still work correctly
  - [x] 9.3 Verify 60 FPS stable with 8-12 enemies active

## Dev Notes

### Architecture Compliance

- **`GameObject` at `src/entities/GameObject.ts`** -- matches architecture exactly [Source: game-architecture.md#Entity System: "Simple class hierarchy with `GameObject` base"]
- **`GameObjectManager` at `src/entities/GameObjectManager.ts`** -- matches architecture [Source: game-architecture.md#Entity System: "A `GameObjectManager` maintains the active list and calls `update()` on all entities each frame"]
- **`Enemy` at `src/entities/enemies/Enemy.ts`** -- matches directory structure [Source: game-architecture.md#Directory Structure: "`src/entities/enemies/Enemy.ts` -- Abstract enemy base"]
- **`Sentinel` at `src/entities/enemies/Sentinel.ts`** -- matches directory structure [Source: game-architecture.md#Directory Structure]
- **`AIState` at `src/ai/AIState.ts`** -- matches architecture [Source: game-architecture.md#Enemy AI: "State pattern (class-based FSM)"]
- **AI states at `src/ai/states/`** -- matches architecture [Source: game-architecture.md#Directory Structure: "states/ -- Shared AI state implementations"]
- **`BehaviorParams` at `src/ai/BehaviorParams.ts`** -- matches architecture [Source: game-architecture.md#Behavioral Evolution System: "BehaviorParams -- TypeScript interface defining all tunable AI parameters"]
- **`EnemySpawner` at `src/systems/EnemySpawner.ts`** -- systems directory matches architecture [Source: game-architecture.md#System Location Mapping]
- **`EventBus` at `src/core/EventBus.ts`** -- matches architecture [Source: game-architecture.md#Event System: "Typed EventBus with central dispatch"]
- **Enemy spawn synchronized to rail progression** -- matches GDD [Source: gdd.md#Spawn Systems: "Enemy spawning synchronized to rail progression (distance along the camera path)"]
- **Sentinel is "Patrol / Fodder"** -- matches GDD [Source: gdd.md#Enemy Types: "Predictable patrol patterns, timed attacks. The basic enemy"]
- **Level 1 = Mechanical behavior** -- matches GDD [Source: gdd.md#Behavioral Evolution: "Precise, predictable patrol patterns. Timed attacks with generous cooldowns"]

### Critical Technical Details

**Sentinel geometry -- EdgesGeometry approach:**

Use `THREE.OctahedronGeometry(1.0, 0)` for the base shape. An octahedron at detail 0 has 8 triangular faces and 12 edges -- clean, minimal, recognizable as a geometric construct. Wrap with `EdgesGeometry` to extract only the visible edges (no internal triangulation lines). Render with `THREE.LineSegments` + material from `VectorMaterials.create()`.

```typescript
const base = new THREE.OctahedronGeometry(1.0, 0);
const edges = new THREE.EdgesGeometry(base);
const material = vectorMaterials.create('sentinel'); // shared across all sentinels
const wireframe = new THREE.LineSegments(edges, material);
wireframe.layers.enable(BLOOM_LAYER);
```

**Shared material for all Sentinels:** Create the material ONCE via `VectorMaterials.create('sentinel')` and reuse it for all Sentinel instances. This is critical because:
1. `VectorMaterials` throws on duplicate IDs in dev mode
2. One material = one palette update affects all Sentinels
3. Fewer materials = fewer draw call state changes

However, `EdgesGeometry` can also be shared across instances. Create one geometry, reuse it:
```typescript
// Static shared resources, created once
private static sharedGeometry: THREE.EdgesGeometry | null = null;
private static sharedMaterial: THREE.LineBasicMaterial | null = null;

static initSharedResources(vectorMaterials: VectorMaterials): void {
  if (!Sentinel.sharedGeometry) {
    const base = new THREE.OctahedronGeometry(1.0, 0);
    Sentinel.sharedGeometry = new THREE.EdgesGeometry(base);
    base.dispose();
  }
  if (!Sentinel.sharedMaterial) {
    Sentinel.sharedMaterial = vectorMaterials.create('sentinel');
  }
}
```

**Distance-based spawn triggers with rail progress:**

The EnemySpawner compares `railProgress` (0-1) against spawn event trigger points. Key consideration: the rail loops, so progress wraps from ~0.99 to ~0.01. The spawner must handle this:

```typescript
update(currentProgress: number): void {
  for (let i = 0; i < SPAWN_EVENTS.length; i++) {
    if (this.firedEvents.has(i)) continue;
    const trigger = SPAWN_EVENTS[i].railProgress;

    // Check if we've passed this trigger point
    // Handle wrap: if lastProgress was 0.95 and currentProgress is 0.05,
    // we crossed 0.0 but NOT any trigger at 0.10+
    if (this.hasCrossed(this.lastProgress, currentProgress, trigger)) {
      this.spawnWave(SPAWN_EVENTS[i], i);
      this.firedEvents.add(i);
    }
  }
  this.lastProgress = currentProgress;
}

private hasCrossed(prev: number, curr: number, trigger: number): boolean {
  if (prev <= curr) {
    // Normal forward movement (no wrap)
    return prev < trigger && trigger <= curr;
  } else {
    // Wrapped around (e.g., 0.95 -> 0.05)
    return prev < trigger || trigger <= curr;
  }
}
```

**Collider sync -- update collider center each frame:**

The `THREE.Sphere` collider is NOT attached to the Three.js scene graph, so it won't auto-update position. The `Enemy.update()` method must copy `object3D.position` to `collider.center` each frame. This is lightweight (one `Vector3.copy` per enemy per frame).

**AI state transition pattern:**

Each `AIState` receives the `Enemy` reference. The state decides when to transition by calling `enemy.transitionToState(nextState)`. This keeps transition logic in the states, not in the enemy. For this story:
- `SpawnState` -> `PatrolState` (after 0.5s spawn animation)
- `PatrolState` stays in patrol forever (AttackState comes in Story 2-3/2-5)
- `DestroyedState` is terminal (enemy is inactive)

The `SpawnState` needs to know which state to transition to. Pass it in the constructor: `new SpawnState(new PatrolState())`.

**Patrol orbit around spawn point:**

Sentinels orbit their spawn position in a circle. This creates predictable, readable movement that communicates "these are targets." The orbit is in the XZ plane with slight Y bobbing:

```typescript
// In PatrolState.update():
this.angle += enemy.params.patrolSpeed * dt;
const pos = enemy.getSpawnPosition();
const r = 5; // orbit radius
enemy.getObject3D().position.set(
  pos.x + Math.cos(this.angle) * r,
  pos.y + Math.sin(this.angle * 0.5) * 1.5,
  pos.z + Math.sin(this.angle) * r
);
```

At Level 1 `patrolSpeed: 1.0`, one full orbit takes ~6.3 seconds (2*PI / 1.0). This is a comfortable pace for the player to track and aim at.

**Spawn position design -- enemies ahead of the player:**

Spawn positions must be near the rail path but offset so enemies are visible ahead. Use the rail control points as reference:

The rail path control points are:
```
[0,0,0], [50,3,-40], [100,5,-15], [115,2,40], [80,-2,80],
[25,-3,90], [-40,0,65], [-80,4,25], [-90,6,-25], [-65,3,-65], [-25,0,-50]
```

Place spawn positions near control points but shifted to be visible from the approaching camera direction. The spawn events use world-space positions, so enemies stay put while the player flies past on the rail.

### What NOT to Do

- Do NOT create materials directly -- always `vectorMaterials.create()` or reuse shared material
- Do NOT create `new Enemy()` in gameplay code outside the spawner -- use the spawner's factory logic
- Do NOT import one system from another -- EnemySpawner reads `railProgress` via parameter, NOT by importing RailMovement
- Do NOT use `console.log()` -- use `Logger.info('Spawner', ...)` or `Logger.debug('AI', ...)`
- Do NOT implement `AttackState` or `EvadeState` -- those come in Stories 2-3 and 2-5
- Do NOT implement `ObjectPool` for enemies -- that comes in Story 2-9. For now, `new Sentinel()` is fine
- Do NOT implement collision detection -- that comes in Story 2-3
- Do NOT implement explosion effects -- that comes in Story 2-4
- Do NOT implement enemy projectile firing -- that comes in Story 2-5
- Do NOT use `fetch()` or `await` in the update loop -- spawn events are compile-time constants
- Do NOT modify `RailMovement.ts` -- read rail progress via `getRailProgress()` in main.ts and pass to spawner
- Do NOT modify `DataLanceSystem.ts`, `CockpitRenderer.ts`, `SceneEnvironment.ts`, or `RenderPipeline.ts`
- Do NOT add `requestAnimationFrame` -- the existing `renderer.setAnimationLoop()` pattern is correct
- Do NOT check `if (level === X)` in AI code -- use `BehaviorParams` from constants (later from JSON)
- Do NOT put enemy creation logic inside `main.ts` -- encapsulate in `EnemySpawner`

### Performance Considerations

- **Enemy render cost:** Each Sentinel is ~12 edges (octahedron) as `LineSegments`. With 8-12 enemies, that's ~100-150 edge segments total -- negligible compared to the grid (40x40 = ~3200 edges) and starfield (800 points).
- **Collider update cost:** One `Vector3.copy()` per enemy per frame = ~12 copies. Trivial.
- **Spawn check cost:** Iterate 4 spawn events per frame, each a simple number comparison. Trivial.
- **AI state update cost:** One `PatrolState.update()` per active enemy = 12 trig calls (sin/cos). Trivial.
- **Memory:** 12 Sentinel instances with shared geometry and shared material. No per-frame allocations in patrol logic (pre-allocate temp vectors if doing vector math).
- **Draw calls:** Each enemy with unique geometry but shared material = 1 draw call per enemy. 12 enemies = +12 draw calls. Well within the 500 draw call budget.

### Previous Story Intelligence (2-1)

**Key patterns from Story 2-1 to preserve:**

- 267 tests currently pass (19 test files) -- new tests must not break any
- `main.ts` animation loop pattern: update rail -> update viewport -> update banking -> update systems -> render
- `RailMovement.getRailProgress()` returns 0-1 normalized progress -- use this for spawn triggers
- `RailMovement.getRailPosition()` returns current camera world position -- useful for relative spawn positioning
- Rail path takes ~35 seconds per loop at 18 u/s -- spawn events should be spread across the loop
- The `RAIL_PATH_POINTS` define the loop shape -- place spawn positions near these points
- All vector geometry uses `VectorMaterials.create()` -- enemies must follow this pattern
- Pre-allocate temp vectors as class members to avoid per-frame GC allocations
- Test pattern: `vitest` with `describe`/`it`/`expect`, prototype checks for classes, config value validation
- `__DEV__` global for dev-only checks (declared in `src/global.d.ts`)
- The `EventBus` currently has a placeholder implementation -- this story needs to implement it fully
- The `ObjectPool` currently has a placeholder -- do NOT implement it fully yet (Story 2-9)
- Entity directories exist but are empty: `src/entities/enemies/`, `src/entities/bosses/`, etc.
- AI directories exist but are empty: `src/ai/states/`

### Project Structure Notes

New files created:
- `src/entities/GameObject.ts` -- Base entity class
- `src/entities/GameObjectManager.ts` -- Entity list management
- `src/entities/enemies/Enemy.ts` -- Abstract enemy base
- `src/entities/enemies/Sentinel.ts` -- First enemy type
- `src/ai/AIState.ts` -- AI state interface
- `src/ai/BehaviorParams.ts` -- Behavioral parameter interface
- `src/ai/states/SpawnState.ts` -- Spawn animation state
- `src/ai/states/PatrolState.ts` -- Patrol movement state
- `src/ai/states/DestroyedState.ts` -- Terminal destroyed state
- `src/systems/EnemySpawner.ts` -- Distance-based spawn trigger system
- `src/__tests__/GameObject.test.ts` -- Tests
- `src/__tests__/GameObjectManager.test.ts` -- Tests
- `src/__tests__/Enemy.test.ts` -- Tests
- `src/__tests__/AIState.test.ts` -- Tests
- `src/__tests__/EnemySpawner.test.ts` -- Tests
- `src/__tests__/EventBus.test.ts` -- Tests

Modified files:
- `src/core/EventBus.ts` -- Full implementation replacing placeholder
- `src/core/GameEvents.ts` -- Add `enemySpawned` event type + eventBus singleton
- `src/config/constants.ts` -- Add Sentinel defaults, spawn events, BehaviorParams defaults
- `src/main.ts` -- Integrate GameObjectManager + EnemySpawner into animation loop

NOT modified:
- `src/systems/RailMovement.ts`
- `src/systems/DataLanceSystem.ts`
- `src/rendering/RenderPipeline.ts`
- `src/rendering/CockpitRenderer.ts`
- `src/rendering/SceneEnvironment.ts`
- `src/rendering/VectorMaterials.ts` (used, not modified)
- `src/core/ObjectPool.ts` (remains placeholder)

### Technology Versions Verified

- **Three.js r183** (`^0.183.2`) -- `OctahedronGeometry(radius, detail)`: creates an octahedron. `EdgesGeometry(geometry, thresholdAngle?)`: extracts edges for wireframe rendering. `LineSegments(geometry, material)`: renders edge lines. `Sphere(center, radius)`: invisible bounding collider. `Layers.enable(layer)`: adds object to specified render layer. All verified against Three.js r183 API.
- **TypeScript ~5.9.3** -- strict mode. Abstract classes for `GameObject` and `Enemy`. Interface for `AIState` and `BehaviorParams`. Generic `EventBus<TEvents>`.
- **Vitest ^4.1.2** -- test framework. Use existing `describe`/`it`/`expect` pattern. Prototype checks for classes that require WebGL context.

### References

- [Source: _bmad-output/epics.md#Epic 2 Story 2] -- "As a player, I can see enemies spawn and patrol in the environment so that there are targets to engage"
- [Source: _bmad-output/epics.md#Epic 2 Scope] -- "Enemy spawning system (distance-based spawn events)", "Sentinel enemy type with FSM AI (Spawn -> Patrol -> Attack -> Destroyed)"
- [Source: _bmad-output/gdd.md#Enemy Design and AI] -- "Sentinel: Patrol / Fodder -- Predictable patrol patterns, timed attacks. Simple geometric construct -- clean, minimal wireframe"
- [Source: _bmad-output/gdd.md#Spawn Systems] -- "Enemy spawning synchronized to rail progression (distance along the camera path). Pre-defined spawn events per phase ensure designed encounters, not random chaos."
- [Source: _bmad-output/gdd.md#Behavioral Evolution] -- "Level 1: Mechanical -- Precise, predictable patrol patterns. Timed attacks with generous cooldowns."
- [Source: _bmad-output/game-architecture.md#Entity System] -- "Simple class hierarchy with GameObject base. Each GameObject owns its THREE.Object3D, an invisible bounding sphere collider, and an update(dt) method."
- [Source: _bmad-output/game-architecture.md#Enemy AI] -- "State pattern (class-based FSM). States: SpawnState -> PatrolState -> AttackState -> EvadeState -> DestroyedState. Behavioral evolution via parameters."
- [Source: _bmad-output/game-architecture.md#Behavioral Evolution System] -- "BehaviorParams interface. AI states read from enemy.params, never check level number."
- [Source: _bmad-output/game-architecture.md#Event System] -- "Typed EventBus with central dispatch. Event naming: camelCase verbs."
- [Source: _bmad-output/game-architecture.md#Object Pooling] -- "Generic ObjectPool<T>. Pre-warm at phase enter()." (Not implemented this story)
- [Source: _bmad-output/game-architecture.md#Collision System] -- "Invisible THREE.Sphere colliders parented to enemies. Sphere size tuned per archetype." (Collision checking not implemented this story, but colliders created)
- [Source: _bmad-output/game-architecture.md#Selective Bloom Pipeline] -- "Every LineSegments, Line2, or vector geometry object must call mesh.layers.enable(BLOOM_LAYER)"
- [Source: _bmad-output/project-context.md#Architecture Rules] -- "Entities never import systems. Systems never import each other. All entity creation through factory functions + ObjectPool."
- [Source: _bmad-output/project-context.md#Critical Rules] -- "NEVER create materials directly. Always use VectorMaterials.create()"
- [Source: _bmad-output/project-context.md#Performance Rules] -- "60 FPS stable. <500 draw calls. No GC pauses during gameplay."
- [Source: _bmad-output/implementation-artifacts/2-1-rail-path-movement.md] -- Previous story: 267 tests, RailMovement system, getRailProgress() API

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Fixed TypeScript compilation error: `EventBus<TEvents extends Record<string, unknown>>` changed to `EventBus<TEvents extends object>` because TypeScript interface without index signature does not satisfy `Record<string, unknown>` constraint.

### Completion Notes List

- Task 1: Created `GameObject` abstract base class with Object3D ownership, Sphere collider, isActive flag, BLOOM_LAYER enabling, and syncCollider() method. 13 tests.
- Task 2: Created `GameObjectManager` with add/remove/getAll/update/getActiveCount methods. Only updates active entities. 9 tests.
- Task 3: Created `AIState` interface, `BehaviorParams` interface, `SpawnState` (scale 0->1 over 0.5s then transition), `PatrolState` (circular orbit with Y bob), `DestroyedState` (hide + deactivate). Added SENTINEL_BEHAVIOR_LEVEL1 defaults to constants. 12 tests.
- Task 4: Created `Enemy` abstract base class extending GameObject with health, scoreValue, BehaviorParams, AI state machine, spawn position, and incrementing id. Created `Sentinel` with shared OctahedronGeometry EdgesGeometry and shared material from VectorMaterials.create('sentinel'). 12 tests.
- Task 5: Replaced EventBus placeholder with generic typed pub/sub implementation. Added `enemySpawned` event to GameEvents interface. Created eventBus singleton. Preserved existing WeaponFiredEvent. 10 tests.
- Task 6: Created `EnemySpawner` with distance-based spawn triggers, rail progress wrapping support via hasCrossed(), 4 spawn waves (11 Sentinels total), offset positioning per group. Added SpawnEvent interface and SPAWN_EVENTS to constants. 11 tests.
- Task 7: Integrated GameObjectManager and EnemySpawner into main.ts animation loop after rail movement update and before render. Did NOT modify RailMovement, DataLanceSystem, CockpitRenderer, or RenderPipeline.
- Task 8: All 6 test files created with 87 new tests covering all story requirements.
- Task 9: Clean `npm run build` with zero TypeScript errors. 354 total tests pass (267 existing + 87 new), zero regressions.
- Performance note: 11 Sentinels total, each ~12 edges. ~132 edge segments added is negligible vs. grid (3200 edges) and starfield (800 points).

### File List

New files:
- src/entities/GameObject.ts
- src/entities/GameObjectManager.ts
- src/entities/enemies/Enemy.ts
- src/entities/enemies/Sentinel.ts
- src/ai/AIState.ts
- src/ai/BehaviorParams.ts
- src/ai/states/SpawnState.ts
- src/ai/states/PatrolState.ts
- src/ai/states/DestroyedState.ts
- src/systems/EnemySpawner.ts
- src/__tests__/GameObject.test.ts
- src/__tests__/GameObjectManager.test.ts
- src/__tests__/Enemy.test.ts
- src/__tests__/AIState.test.ts
- src/__tests__/EnemySpawner.test.ts
- src/__tests__/EventBus.test.ts

Modified files:
- src/core/EventBus.ts (full implementation replacing placeholder)
- src/core/GameEvents.ts (added enemySpawned event, eventBus singleton)
- src/config/constants.ts (added Sentinel defaults, SpawnEvent interface, SPAWN_EVENTS)
- src/main.ts (integrated GameObjectManager + EnemySpawner into animation loop)

NOT modified:
- src/systems/RailMovement.ts
- src/systems/DataLanceSystem.ts
- src/rendering/RenderPipeline.ts
- src/rendering/CockpitRenderer.ts
- src/rendering/SceneEnvironment.ts
- src/rendering/VectorMaterials.ts
- src/core/ObjectPool.ts

### Change Log

- 2026-03-26: Story 2-2 implementation complete. Added entity system (GameObject, GameObjectManager), enemy hierarchy (Enemy, Sentinel), AI state machine (SpawnState, PatrolState, DestroyedState), typed EventBus with enemySpawned event, distance-based EnemySpawner system with 4 spawn waves (11 Sentinels total). Integrated into main.ts animation loop. 87 new tests, all 354 tests pass.
- 2026-03-26: Senior Developer Review (AI) -- PASSED. All 24 ACs verified as implemented. All 9 tasks verified as complete. Code quality clean: no architecture violations, no direct material creation, no console.log usage, no per-frame allocations in update loops, correct entity/system separation, proper EventBus usage, shared geometry/material pattern for Sentinels. 354 tests pass, TypeScript compiles with zero errors. 0 issues found.
