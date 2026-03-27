# Story 3.4: Data Corridor Phase

Status: done

## Story

As a player,
I want to navigate a data corridor with obstacles,
so that Phase 3 delivers survival-focused tension.

## Acceptance Criteria

1. A `CorridorPhase` class exists at `src/state/phases/CorridorPhase.ts` that manages the complete Phase 3 data corridor experience: corridor wall geometry, animated obstacles (firewalls, network cables, data streams), a straight non-looping rail path, obstacle-to-player collision, and a phase-completion condition
2. `CorridorPhase` implements the same `enter()`/`update(dt)`/`exit()` lifecycle interface used by `SurfacePhase` and the state machine architecture: `enter()` creates resources, `update(dt)` runs logic, `exit()` disposes resources
3. Corridor walls are rendered as wireframe geometry using `VectorMaterials.create()` — NEVER direct material creation. Two parallel wall planes (`PlaneGeometry` + `EdgesGeometry` + `LineSegments`) positioned on left/right sides of the rail path, plus a floor plane below and ceiling plane above, forming a rectangular corridor tunnel. All geometry has `mesh.layers.enable(BLOOM_LAYER)`
4. The corridor narrows gradually over its length — wall planes start wider apart at the corridor entrance and converge toward the exit. Implement by segmenting each wall into 6-8 individual `LineSegments` planes placed at incremental z-positions along the corridor, each slightly closer together than the previous segment. This creates the visual effect of "narrowing walls, closing geometry" per the GDD
5. A straight, non-looping corridor rail path is defined in `src/config/constants.ts` as `CORRIDOR_RAIL_PATH_POINTS: readonly [number, number, number][]` — a NON-looping path (open curve) that runs straight forward through the center of the corridor with very slight lateral variation for visual interest. Approximately 12-15 control points forming a path ~600-800 units long. Y-values centered at corridor mid-height (~3-5 units)
6. Three obstacle types exist, each as a class in `src/entities/obstacles/`:
   - `Firewall.ts` — timing-based obstacle that opens and closes on a repeating cycle
   - `NetworkCable.ts` — positioning-based obstacle that crosses the path at a fixed position the player must dodge around
   - `DataStream.ts` — reflexes-based obstacle that moves across the corridor path requiring quick dodging
7. `Firewall` at `src/entities/obstacles/Firewall.ts`: a flat wireframe barrier that spans the corridor cross-section. Uses `PlaneGeometry` + `EdgesGeometry` + `LineSegments` with `VectorMaterials.create('firewall')`. Animates between open and closed states on a timer cycle: closed for `FIREWALL_CLOSE_DURATION` seconds, then open (gap appears) for `FIREWALL_OPEN_DURATION` seconds. When closed, the firewall is a solid barrier across the corridor. When open, the wireframe is not visible (set `visible = false`). Collision active only when closed. Bloom layer enabled
8. `Firewall` animation approach: use `object3D.visible` toggling for open/closed state. When closed, the firewall is visible and collidable. When open, it is invisible and non-collidable. Each firewall has a `phaseOffset` (0-1) so firewalls along the corridor are staggered and do not all open/close simultaneously — creating timing windows the player must navigate
9. `NetworkCable` at `src/entities/obstacles/NetworkCable.ts`: a wireframe line or set of lines crossing the corridor horizontally or diagonally at a fixed y-position. Uses `BufferGeometry` with manually defined vertices forming 2-4 crossing cable lines + `LineSegments` with `VectorMaterials.create('networkCable')`. Positioned at a fixed point in the corridor. The player must move their viewport offset (arrow keys) up or down to avoid the cable's y-position. Static obstacle — does not animate. Collision active always. Bloom layer enabled
10. `DataStream` at `src/entities/obstacles/DataStream.ts`: a wireframe shape (small `BoxGeometry` or set of parallel lines via `BufferGeometry`) that moves laterally across the corridor on a repeating path. Uses `VectorMaterials.create('dataStream')`. Moves left-to-right or right-to-left at `DATA_STREAM_SPEED` units/second, bouncing between corridor walls. The player must time their viewport position to avoid the moving stream. Collision active always. Bloom layer enabled
11. All three obstacle types extend a new `Obstacle` base class at `src/entities/obstacles/Obstacle.ts` that provides: `object3D: THREE.Object3D`, `collider: THREE.Box3` (axis-aligned bounding box), `isActive: boolean`, `update(dt)`, and `checkCollision(playerSphere: THREE.Sphere): boolean`. The `Obstacle` base class does NOT extend `Enemy` or `GameObject` — obstacles are environmental hazards, not enemies. They are not pooled via `ObjectPool` (they are pre-placed and static-count, not dynamic)
12. Obstacle collision uses `THREE.Box3.intersectsSphere(playerSphere)` for all three types. When collision is detected, emit `playerHit` event via `eventBus` with `{ damage: CORRIDOR_OBSTACLE_DAMAGE, source: 'corridorObstacle' }`. Add a brief invulnerability window (`CORRIDOR_HIT_COOLDOWN` seconds) after each hit to prevent instant multi-hit damage stacking — track this timer in `CorridorPhase`
13. Corridor obstacle constants are defined in `src/config/constants.ts`:
    - `CORRIDOR_OBSTACLE_DAMAGE = 15` (hits should be meaningful — ~6-7 hits depletes full shields)
    - `CORRIDOR_HIT_COOLDOWN = 0.8` (seconds of invulnerability after an obstacle hit)
    - `FIREWALL_CLOSE_DURATION = 1.5` (seconds the firewall stays closed)
    - `FIREWALL_OPEN_DURATION = 2.0` (seconds the firewall stays open — generous for Level 1)
    - `FIREWALL_COLLIDER_DEPTH = 1.0` (z-depth of the firewall's Box3 collider)
    - `NETWORK_CABLE_COLLIDER_HEIGHT = 1.5` (y-extent of the cable collider box)
    - `DATA_STREAM_SPEED = 6.0` (units/second lateral movement)
    - `DATA_STREAM_COLLIDER_SIZE = 1.5` (half-extent of the data stream's Box3)
    - `CORRIDOR_WALL_WIDTH = 12.0` (starting corridor width — distance between walls at entrance)
    - `CORRIDOR_WALL_MIN_WIDTH = 6.0` (ending corridor width — walls at exit)
    - `CORRIDOR_HEIGHT = 8.0` (floor-to-ceiling distance)
    - `CORRIDOR_LENGTH = 700` (total length of the corridor in z-units)
    - `CORRIDOR_RAIL_SPEED_MULTIPLIER = 1.2` (corridor moves faster than dogfight — per GDD "increasing speed")
14. Corridor obstacle placement data is defined as `CORRIDOR_OBSTACLES: CorridorObstacleConfig[]` in `src/config/constants.ts` where:
    ```typescript
    export type CorridorObstacleType = 'firewall' | 'networkCable' | 'dataStream';
    export interface CorridorObstacleConfig {
      type: CorridorObstacleType;
      position: [number, number, number]; // world-space [x, y, z] along corridor
      phaseOffset?: number;   // 0-1 for firewall timing stagger
      direction?: 'left' | 'right'; // for dataStream lateral movement start direction
    }
    ```
    Approximately 5-6 firewalls, 4-5 network cables, and 3-4 data streams spaced along the corridor length. "Moderate density" per Level 1 GDD — obstacles should have sufficient gaps between them for a skilled player to navigate cleanly
15. `CorridorPhase.enter()` creates: (a) corridor wall geometry (segmented walls, floor, ceiling), (b) all obstacle instances placed at defined positions from `CORRIDOR_OBSTACLES`, (c) a new `RailMovement` instance using `CORRIDOR_RAIL_PATH_POINTS` with `closed: false`, (d) subscribes to no additional events (obstacles handle damage internally via eventBus)
16. `CorridorPhase.update(dt)` calls: rail movement update, obstacle updates (firewall animation, data stream movement), obstacle collision checks against player sphere, data lance system update (player can still shoot — some obstacles or bonus targets could be destructible in future levels), effects manager update. Additionally checks the phase-completion condition each frame
17. Phase completion condition: player reaches the end of the non-looping rail path (progress >= 0.98). Unlike surface phase, there is no destruction objective — the corridor is a pure survival run. The player progresses regardless of how many obstacles they hit, matching the "accessible action" pillar
18. `CorridorPhase.exit()` disposes: corridor wall geometry removed from scene and disposed, obstacle Object3Ds removed from scene, obstacle geometries and materials disposed. Clean teardown with no memory leaks
19. The rail path for the corridor uses `RAIL_SPEED * CORRIDOR_RAIL_SPEED_MULTIPLIER` as the effective speed. Since `RailMovement` currently uses the global `RAIL_SPEED` constant, the developer must either: (a) add a `speed` parameter to `RailMovement.update()` that overrides the default, or (b) add a `speedMultiplier` property to `RailMovement` settable after construction. Option (a) is preferred for minimal API change — pass `RAIL_SPEED * CORRIDOR_RAIL_SPEED_MULTIPLIER` as a speed parameter
20. Frame rate remains at 60 FPS stable — corridor geometry is static (created once in `enter()`), obstacles are ~12-15 total objects with simple update logic (timers, linear movement, Box3 checks). Well within performance budgets
21. Running `npm run build` produces a clean production build with zero TypeScript errors
22. Unit tests exist for: `CorridorPhase` lifecycle (enter/update/exit), `Firewall` open/close animation cycle, `NetworkCable` static collision, `DataStream` lateral movement and bouncing, `Obstacle` base class collision check, corridor constants validation, phase completion logic
23. All existing 735 tests continue to pass — zero regressions
24. The data corridor phase is visually distinct from both dogfight and surface phases: the player flies through a narrowing wireframe tunnel, dodging glowing barriers that slam shut, static cables crossing the path, and moving data streams — survival-focused tension per the GDD

## Tasks / Subtasks

- [x] Task 1: Add corridor constants to `src/config/constants.ts` (AC: #5, #13, #14)
  - [x] 1.1 Add corridor dimension and damage constants:
    ```typescript
    // Data Corridor Phase constants (Story 3-4)
    export const CORRIDOR_OBSTACLE_DAMAGE = 15;
    export const CORRIDOR_HIT_COOLDOWN = 0.8;
    export const FIREWALL_CLOSE_DURATION = 1.5;
    export const FIREWALL_OPEN_DURATION = 2.0;
    export const FIREWALL_COLLIDER_DEPTH = 1.0;
    export const NETWORK_CABLE_COLLIDER_HEIGHT = 1.5;
    export const DATA_STREAM_SPEED = 6.0;
    export const DATA_STREAM_COLLIDER_SIZE = 1.5;
    export const CORRIDOR_WALL_WIDTH = 12.0;
    export const CORRIDOR_WALL_MIN_WIDTH = 6.0;
    export const CORRIDOR_HEIGHT = 8.0;
    export const CORRIDOR_LENGTH = 700;
    export const CORRIDOR_RAIL_SPEED_MULTIPLIER = 1.2;
    ```
  - [x] 1.2 Add corridor rail path points:
    ```typescript
    // Data Corridor Phase rail path (Story 3-4)
    // Non-looping straight-forward path through narrowing corridor
    // Very slight lateral variation for visual interest, centered at y~4
    export const CORRIDOR_RAIL_PATH_POINTS: readonly [number, number, number][] = [
      [0, 4, 0],          // corridor entrance
      [0.3, 4, -50],      // slight drift right
      [-0.2, 4, -100],    // slight drift left
      [0.5, 4.2, -150],   // tiny rise
      [-0.3, 3.8, -200],  // slight drop and left
      [0.4, 4, -250],     // back to center-right
      [0, 4.1, -300],     // centered
      [-0.5, 4, -350],    // drift left
      [0.2, 3.9, -400],   // drift right, slight drop
      [0, 4, -450],       // centered
      [0.3, 4.2, -500],   // slight rise
      [-0.2, 4, -550],    // drift left
      [0, 4, -600],       // final approach
      [0, 4, -700],       // corridor exit
    ] as const;
    ```
  - [x] 1.3 Add obstacle type and config definitions:
    ```typescript
    export type CorridorObstacleType = 'firewall' | 'networkCable' | 'dataStream';
    export interface CorridorObstacleConfig {
      type: CorridorObstacleType;
      position: [number, number, number];
      phaseOffset?: number;
      direction?: 'left' | 'right';
    }
    ```
  - [x] 1.4 Add corridor obstacle placement data:
    ```typescript
    // Corridor obstacle placement (Story 3-4)
    // Level 1 = moderate density with generous timing windows
    export const CORRIDOR_OBSTACLES: CorridorObstacleConfig[] = [
      // First section: gentle introduction — single firewalls with wide timing
      { type: 'firewall', position: [0, 4, -80], phaseOffset: 0 },
      { type: 'networkCable', position: [0, 2.5, -130] },
      { type: 'firewall', position: [0, 4, -180], phaseOffset: 0.3 },

      // Mid section: mixed obstacles, moderate density
      { type: 'dataStream', position: [-2, 4, -230], direction: 'right' },
      { type: 'networkCable', position: [0, 5.5, -280] },
      { type: 'firewall', position: [0, 4, -320], phaseOffset: 0.6 },
      { type: 'dataStream', position: [2, 4, -370], direction: 'left' },

      // Late section: denser obstacles, corridor narrowing
      { type: 'firewall', position: [0, 4, -420], phaseOffset: 0.15 },
      { type: 'networkCable', position: [0, 3.0, -460] },
      { type: 'dataStream', position: [0, 4, -500], direction: 'right' },
      { type: 'firewall', position: [0, 4, -540], phaseOffset: 0.45 },
      { type: 'networkCable', position: [0, 5.0, -580] },

      // Final gauntlet: tight spacing before exit
      { type: 'firewall', position: [0, 4, -620], phaseOffset: 0.7 },
      { type: 'dataStream', position: [-1, 4, -650], direction: 'left' },
    ];
    // Total: 6 firewalls, 4 network cables, 4 data streams
    ```

- [x] Task 2: Create `Obstacle` base class at `src/entities/obstacles/Obstacle.ts` (AC: #11)
  - [x] 2.1 Create the base class:
    ```typescript
    /**
     * Obstacle — Base class for corridor environmental hazards.
     *
     * NOT an Enemy — obstacles are environmental geometry that damages
     * the player on contact. Uses Box3 collision instead of sphere.
     * Not pooled — pre-placed at fixed positions, static count.
     *
     * Created by: Story 3-4
     */
    import * as THREE from 'three';
    import { BLOOM_LAYER } from '../../config/constants.ts';

    export abstract class Obstacle {
      protected object3D: THREE.Object3D;
      protected collider: THREE.Box3;
      protected active: boolean = true;

      constructor() {
        this.object3D = new THREE.Object3D();
        this.collider = new THREE.Box3();
      }

      abstract update(dt: number): void;

      get isActive(): boolean {
        return this.active;
      }

      getObject3D(): THREE.Object3D {
        return this.object3D;
      }

      checkCollision(playerSphere: THREE.Sphere): boolean {
        if (!this.active) return false;
        return this.collider.intersectsSphere(playerSphere);
      }

      dispose(): void {
        // Subclasses override to dispose geometry/material
      }
    }
    ```
  - [x] 2.2 IMPORTANT: The `src/entities/obstacles/` directory is NEW — it does not exist yet. Create it. Do NOT put obstacles in `src/entities/enemies/` — they are not enemies.
  - [x] 2.3 CRITICAL: All wireframe geometry in subclasses MUST use `VectorMaterials.create(id)` and `mesh.layers.enable(BLOOM_LAYER)`.

- [x] Task 3: Create `Firewall` obstacle at `src/entities/obstacles/Firewall.ts` (AC: #7, #8)
  - [x] 3.1 Create the class with open/close animation cycle:
    ```typescript
    /**
     * Firewall — Timing-based corridor obstacle that opens and closes.
     *
     * A flat wireframe barrier spanning the corridor cross-section.
     * Cycles between closed (visible, collidable) and open (invisible,
     * non-collidable) states on a timer.
     *
     * GDD: "Firewalls slamming shut (timing-based)"
     *
     * Created by: Story 3-4
     */
    ```
  - [x] 3.2 Geometry: `PlaneGeometry(corridorWidth, CORRIDOR_HEIGHT)` + `EdgesGeometry` + `LineSegments`. The firewall spans the full width and height of the corridor at its z-position. Use `VectorMaterials.create('firewall')`.
  - [x] 3.3 Animation: Track `timer` starting at `phaseOffset * (FIREWALL_CLOSE_DURATION + FIREWALL_OPEN_DURATION)`. Each frame, advance timer by dt. When timer < `FIREWALL_CLOSE_DURATION`: closed (visible, collision active). When timer >= `FIREWALL_CLOSE_DURATION`: open (invisible, collision inactive). Wrap timer at `FIREWALL_CLOSE_DURATION + FIREWALL_OPEN_DURATION`.
  - [x] 3.4 Collider: `Box3` centered on the firewall position with half-extents `(corridorWidth/2, CORRIDOR_HEIGHT/2, FIREWALL_COLLIDER_DEPTH/2)`. Only checked when closed.
  - [x] 3.5 The firewall width should match the corridor width at its z-position (interpolated between `CORRIDOR_WALL_WIDTH` and `CORRIDOR_WALL_MIN_WIDTH` based on z/CORRIDOR_LENGTH). Pass the width into the constructor or compute from z-position.

- [x] Task 4: Create `NetworkCable` obstacle at `src/entities/obstacles/NetworkCable.ts` (AC: #9)
  - [x] 4.1 Create the class:
    ```typescript
    /**
     * NetworkCable — Positioning-based corridor obstacle.
     *
     * Wireframe lines crossing the corridor horizontally at a fixed
     * y-position. Player must use viewport offset to dodge above/below.
     *
     * GDD: "Network cables crossing the path (positioning-based)"
     *
     * Created by: Story 3-4
     */
    ```
  - [x] 4.2 Geometry: Use `BufferGeometry` with manually defined vertices forming 2-4 parallel horizontal lines spanning the corridor width at the cable's y-position. This creates a visual "cable bundle" crossing the corridor. Use `VectorMaterials.create('networkCable')` + `LineSegments`. Bloom layer enabled.
  - [x] 4.3 Collider: `Box3` centered at the cable position with half-extents `(corridorWidth/2, NETWORK_CABLE_COLLIDER_HEIGHT/2, 0.5)`. Static — no animation needed.
  - [x] 4.4 `update(dt)` is a no-op for network cables — they are static obstacles.

- [x] Task 5: Create `DataStream` obstacle at `src/entities/obstacles/DataStream.ts` (AC: #10)
  - [x] 5.1 Create the class:
    ```typescript
    /**
     * DataStream — Reflexes-based moving corridor obstacle.
     *
     * A wireframe shape that moves laterally across the corridor,
     * bouncing between the walls. Player must time their position.
     *
     * GDD: "Data streams to dodge (reflexes-based)"
     *
     * Created by: Story 3-4
     */
    ```
  - [x] 5.2 Geometry: Small `BoxGeometry(1.5, 1.5, 0.5)` + `EdgesGeometry` + `LineSegments` — a compact, visible "data packet" shape. Use `VectorMaterials.create('dataStream')`. Bloom layer enabled.
  - [x] 5.3 Movement: Track `lateralPosition` and `direction` (+1 or -1). Each frame, move `lateralPosition += direction * DATA_STREAM_SPEED * dt`. When `lateralPosition` exceeds corridor half-width (interpolated at this z), reverse `direction`. Update `object3D.position.x = lateralPosition`.
  - [x] 5.4 Collider: `Box3` centered on current object3D position with half-extents `(DATA_STREAM_COLLIDER_SIZE/2, DATA_STREAM_COLLIDER_SIZE/2, DATA_STREAM_COLLIDER_SIZE/2)`. Update collider position each frame to match movement.

- [x] Task 6: Create `CorridorPhase` at `src/state/phases/CorridorPhase.ts` (AC: #1, #2, #3, #4, #15, #16, #17, #18, #19)
  - [x] 6.1 Create the phase class implementing enter/update/exit lifecycle:
    ```typescript
    /**
     * CorridorPhase — Phase 3: Data Corridor.
     *
     * Player flies through a narrowing wireframe corridor, dodging
     * firewalls (timing), network cables (positioning), and data
     * streams (reflexes). Pure survival run — phase completes when
     * the player reaches the end of the rail path.
     *
     * Architecture: Manages its own geometry and obstacles independently.
     * Same enter/update/exit lifecycle as SurfacePhase.
     *
     * Created by: Story 3-4
     */
    ```
  - [x] 6.2 `enter()` implementation:
    - Create corridor wall geometry: 6-8 wall segments per side (left/right), plus floor and ceiling segments. Each segment is a `PlaneGeometry` + `EdgesGeometry` + `LineSegments`. Left walls at `x = -corridorHalfWidth(z)`, right walls at `x = +corridorHalfWidth(z)`, floor at `y = 0`, ceiling at `y = CORRIDOR_HEIGHT`. Use `VectorMaterials.create('corridorWall')` for walls, `VectorMaterials.create('corridorFloor')` for floor/ceiling. Rotate wall planes to face inward (`rotation.y = Math.PI/2` for left, `-Math.PI/2` for right). Rotate floor/ceiling to face up/down.
    - Compute `corridorHalfWidth(z)` as linear interpolation: `(CORRIDOR_WALL_WIDTH/2) + (z / CORRIDOR_LENGTH) * ((CORRIDOR_WALL_MIN_WIDTH - CORRIDOR_WALL_WIDTH) / 2)` — narrowing from entrance to exit
    - Create all obstacle instances from `CORRIDOR_OBSTACLES` config: instantiate `Firewall`, `NetworkCable`, or `DataStream` based on type, position at defined coordinates, add to scene. Pass `corridorWidth` at each obstacle's z-position for proper sizing
    - Create `RailMovement` instance with `CORRIDOR_RAIL_PATH_POINTS` and `closed: false`
    - Initialize hit cooldown timer to 0
  - [x] 6.3 `update(dt)` implementation:
    - Update rail movement (with speed multiplier — see AC #19)
    - Update all obstacles (firewall timers, data stream movement)
    - Check obstacle collisions against player sphere (only if hit cooldown <= 0):
      - For each active obstacle, call `obstacle.checkCollision(playerSphere)`
      - On hit: emit `playerHit` event, set hit cooldown timer to `CORRIDOR_HIT_COOLDOWN`
    - Decrement hit cooldown timer by dt
    - Update data lance system (player can still shoot)
    - Update effects manager
    - Check phase completion: rail progress >= 0.98
    - On completion: set `completed` flag
  - [x] 6.4 `exit()` implementation:
    - Remove corridor wall geometry from scene and dispose geometry/material
    - Remove and dispose all obstacle instances
    - Null out references for GC
  - [x] 6.5 IMPORTANT: Same standalone pattern as `SurfacePhase` — CorridorPhase does NOT integrate with `PlayingState` or `PhaseStateMachine` yet (story 3-10 handles phase transitions). The class MUST follow the enter/update/exit interface so it plugs in cleanly later.
  - [x] 6.6 RailMovement speed: Since `RailMovement.update()` currently uses the global `RAIL_SPEED` constant hardcoded, modify `RailMovement.update()` to accept an optional `speed` parameter:
    ```typescript
    update(dt: number, viewportOffset: { x: number; y: number }, speed?: number): void {
      const effectiveSpeed = speed ?? RAIL_SPEED;
      this.progress += (effectiveSpeed * dt) / this.totalLength;
      // ... rest unchanged
    }
    ```
    CorridorPhase calls `railMovement.update(dt, viewportOffset, RAIL_SPEED * CORRIDOR_RAIL_SPEED_MULTIPLIER)`. Ensure existing callers that pass no speed parameter are unaffected (default to `RAIL_SPEED`).

- [x] Task 7: Write unit tests (AC: #22, #23)
  - [x] 7.1 `src/__tests__/Obstacle.test.ts`: Base class construction, `checkCollision()` with intersecting/non-intersecting spheres, `isActive` flag behavior
  - [x] 7.2 `src/__tests__/Firewall.test.ts`: Construction, geometry creation, open/close cycle timing, phaseOffset stagger, collision active only when closed, visibility toggling
  - [x] 7.3 `src/__tests__/NetworkCable.test.ts`: Construction, geometry creation, static collision, correct collider dimensions
  - [x] 7.4 `src/__tests__/DataStream.test.ts`: Construction, geometry creation, lateral movement, direction reversal at corridor walls, collider position sync
  - [x] 7.5 `src/__tests__/CorridorPhase.test.ts`: `enter()` creates geometry and obstacles, `update()` calls obstacle updates and collision checks, phase completion at rail end, `exit()` disposes everything, hit cooldown prevents multi-hit stacking
  - [x] 7.6 `src/__tests__/CorridorConstants.test.ts`: Corridor rail path has 12+ points, all y-values validate corridor-center altitude, CORRIDOR_OBSTACLES array has correct types and positions, all constant values are positive numbers, corridor narrows (MIN_WIDTH < WALL_WIDTH)
  - [x] 7.7 Follow the same test mocking patterns as existing tests (check `src/__tests__/SurfacePhase.test.ts` and `src/__tests__/Firewall.test.ts` for the exact vitest mock setup patterns — mock `three`, `VectorMaterials`, `EventBus`, etc.)
  - [x] 7.8 Verify all 735 existing tests still pass after changes

- [x] Task 8: Verify build and visual validation (AC: #20, #21, #24)
  - [x] 8.1 `npm run build` produces zero TypeScript errors
  - [x] 8.2 Visual validation: the corridor phase creates visible narrowing tunnel geometry, firewalls visibly open/close on timer cycles, network cables are visible static barriers, data streams move laterally, obstacle collision triggers playerHit events
  - [x] 8.3 The corridor phase is standalone — visual testing can be done via a temporary debug command or unit tests. Integration into the main game loop comes in story 3-10.

## Dev Notes

### Architecture Patterns and Constraints

- **Phase Architecture:** `CorridorPhase` lives at `src/state/phases/CorridorPhase.ts` per the architecture directory structure. It follows the exact same enter/update/exit lifecycle pattern as `SurfacePhase`. The `src/state/phases/` directory already contains `SurfacePhase.ts` from story 3-3.
- **New Entity Directory:** `src/entities/obstacles/` is a NEW directory. Create it for the `Obstacle` base class and its subclasses. Obstacles are NOT enemies — they do not extend `Enemy`, do not have AI states, do not emit `enemyDestroyed` events, and are not tracked by `GameObjectManager`. They are simpler environmental hazards managed directly by `CorridorPhase`.
- **Material Rule:** ALL materials through `VectorMaterials.create(id)`. NEVER `new THREE.LineBasicMaterial()` or `new THREE.LineMaterial()` directly. This ensures palette transitions work globally. New material IDs needed: `'firewall'`, `'networkCable'`, `'dataStream'`, `'corridorWall'`, `'corridorFloor'`.
- **Bloom Rule:** ALL wireframe geometry must have `mesh.layers.enable(BLOOM_LAYER)`. Apply to every `LineSegments` object created.
- **No ObjectPool for obstacles:** Obstacles are not dynamic entities — they are pre-placed at construction in `enter()` and disposed in `exit()`. No pool needed. This is different from enemies which spawn and despawn during gameplay.
- **No System Cross-Imports:** CorridorPhase may reference systems (RailMovement, DataLanceSystem, etc.) because phases orchestrate systems. But systems never import each other or phases.
- **Event-Driven Damage:** Obstacle hits emit `playerHit` events via `eventBus` — the existing `Player`, `DamageEffectsManager`, `ScreenShake`, and `HUDManager` all respond automatically. No changes to those systems needed.
- **Logging:** Use `Logger.info('CorridorPhase', ...)` and `Logger.debug(...)` — NEVER `console.log()`.

### Collision Approach

Unlike enemy collision (which uses `THREE.Ray` for raycasting Data Lance bolts against `THREE.Sphere` colliders), corridor obstacles use `THREE.Box3.intersectsSphere()` because:
- Obstacles are flat or rectangular shapes that don't map well to spheres
- `Box3` intersection with the player's `THREE.Sphere` is efficient and accurate for AABB shapes
- The player already has a `THREE.Sphere` collider (from `Player.collider`) — just pass it to obstacle collision checks
- Box3 collision is simpler than raycasting and well-suited for environmental hazards

The player's collider sphere center must be synced to the camera position each frame — this already happens in the existing main loop (Player syncs collider to camera).

### RailMovement Modification

`RailMovement.update()` currently uses the hardcoded `RAIL_SPEED` constant. The corridor phase needs a faster speed (`RAIL_SPEED * 1.2`). Add an optional `speed` parameter to `update()`:

```typescript
update(dt: number, viewportOffset: { x: number; y: number }, speed?: number): void {
  const effectiveSpeed = speed ?? RAIL_SPEED;
  this.progress += (effectiveSpeed * dt) / this.totalLength;
  // ... rest unchanged
}
```

This preserves backward compatibility — existing callers (main loop, SurfacePhase) pass no speed param and get the default `RAIL_SPEED`. CorridorPhase passes the multiplied value. Verify all existing `RailMovement` tests still pass after the signature change.

### Key Differences from Previous Phases

| Aspect | Dogfight (Epic 2) | Surface Attack (3-3) | Data Corridor (this story) |
|--------|-------------------|---------------------|---------------------------|
| Rail path | Closed loop, wide sweeps | Open path, surface-skimming | Open path, straight forward, faster |
| Enemies/targets | Mobile AI enemies (Sentinel, Watchdog, Gatekeeper) | Stationary targets (FirewallNode, ICETower) | No enemies — environmental obstacles only |
| Collision type | Ray-sphere (Data Lance) + sphere-sphere (enemy bursts) | Same as dogfight | Box3-sphere (obstacles vs player) |
| Completion | None (loops) | All nodes destroyed OR path end | Path end only (pure survival) |
| Environment | Open cyberspace (grid + starfield) | Fortress surface geometry | Enclosed tunnel (corridor walls) |
| Gameplay focus | Combat | Targeted destruction | Obstacle dodging/survival |
| Damage source | Enemy AI attacks | ICE tower projectiles | Environmental hazard collision |
| Speed | RAIL_SPEED (18) | RAIL_SPEED (18) | RAIL_SPEED * 1.2 (21.6) |

### What Already Works (Do Not Rebuild)

- `Player` — already has a `THREE.Sphere` collider that syncs to camera position. Pass `player.collider` to corridor collision checks.
- `eventBus.emit('playerHit', ...)` — triggers `Player.takeDamage()`, `DamageEffectsManager` (screen shake + flash), `HUDManager` (shield bar update) automatically. No changes needed.
- `DataLanceSystem` — player can still fire in the corridor (fires bolts from the player). Works regardless of phase.
- `EffectsManager` — if any future destructible obstacles emit `enemyDestroyed`, explosions play. Not needed for basic obstacles but available.
- `RailMovement` — already supports open (non-looping) paths from story 3-3. Just needs the optional speed parameter.
- `VectorMaterials` — create new material IDs for obstacles and corridor geometry. The palette system handles color automatically.
- `InputManager` — viewport offset (arrow keys) is the primary dodge mechanic in the corridor. Already works.

### Previous Story Learnings

From story 3-3 (Surface Attack Phase):
- **Phase lifecycle pattern is proven.** Follow the exact same constructor/enter/update/exit pattern as `SurfacePhase`.
- **RailMovement open-path support works.** The `closed: false` parameter added in 3-3 handles non-looping paths correctly with progress clamping.
- **VectorMaterials.create(id) per geometry type.** Each visually distinct geometry type gets its own material ID so palette transitions apply uniformly.
- **Dispose everything in exit().** Remove from scene, dispose geometry, dispose material (if not shared), null references. SurfacePhase pattern is clean — follow it.
- **Test mock pattern.** Mock `three` module globally, create minimal `VectorMaterials` mock with `create()` returning mock `LineBasicMaterial`. See `src/__tests__/SurfacePhase.test.ts`.
- **Static geometry is cheap.** SurfacePhase fortress geometry (PlaneGeometry + structures) had negligible draw call impact. Corridor walls will be similar.

### Project Structure Notes

- All new files follow existing patterns
- `src/entities/obstacles/Obstacle.ts` — new file, new directory
- `src/entities/obstacles/Firewall.ts` — new file
- `src/entities/obstacles/NetworkCable.ts` — new file
- `src/entities/obstacles/DataStream.ts` — new file
- `src/state/phases/CorridorPhase.ts` — new file (second in this directory after SurfacePhase)
- `src/config/constants.ts` — modified (add corridor constants)
- `src/systems/RailMovement.ts` — modified (add optional speed parameter to update())
- `src/__tests__/Obstacle.test.ts` — new test file
- `src/__tests__/Firewall.test.ts` — new test file
- `src/__tests__/NetworkCable.test.ts` — new test file
- `src/__tests__/DataStream.test.ts` — new test file
- `src/__tests__/CorridorPhase.test.ts` — new test file
- `src/__tests__/CorridorConstants.test.ts` — new test file

### References

- [Source: _bmad-output/epics.md#Epic 3 Story 4] — "navigate a data corridor with obstacles so that Phase 3 delivers survival-focused tension"
- [Source: _bmad-output/gdd.md#Level Design Framework] — Phase 3: Data Corridor environment is "Straight corridor — narrowing walls, closing geometry" with gameplay focus on "Navigate obstacles: firewalls slamming shut, network cables crossing path, data streams to dodge" and rail path style "Straight, forward, increasing speed"
- [Source: _bmad-output/gdd.md#Level 1] — Phase 3 key features: "Firewalls, network cables — moderate density" introducing "Corridor navigation and obstacle dodging"
- [Source: _bmad-output/gdd.md#Environmental Hazards] — "Firewalls slamming shut (timing-based), network cables crossing the path (positioning-based), data streams to dodge (reflexes-based). Every obstacle is thematically grounded in the digital world."
- [Source: _bmad-output/gdd.md#Collision] — "Corridor obstacles → Player: Simple bounding box/sphere checks along the rail path."
- [Source: _bmad-output/game-architecture.md#Level/Phase System] — `CorridorPhase` is one of four phase type classes: "straight forward path, obstacle survival"
- [Source: _bmad-output/game-architecture.md#State Management] — Phase states implement `enter()`/`update(dt)`/`exit()` lifecycle in the nested phase FSM
- [Source: _bmad-output/game-architecture.md#Directory Structure] — `src/state/phases/CorridorPhase.ts` is the defined location
- [Source: _bmad-output/game-architecture.md#Collision System] — "Corridor obstacles → Player: Sphere/box distance checks each frame against player position"
- [Source: _bmad-output/project-context.md#Critical Implementation Rules] — VectorMaterials.create() mandatory, BLOOM_LAYER mandatory, no console.log, all loading in enter()
- [Source: _bmad-output/narrative-design.md#Beat 5] — "Into the Wire — Data corridor entry. Handler warns this is where the mentor's last mission ended."

### Technical Research Notes

- **Three.js r183 Box3.intersectsSphere():** Returns boolean. Create Box3 from center + half-extents via `box.setFromCenterAndSize(center, size)`. Efficient axis-aligned check — no matrix inversion needed.
- **Three.js r183 PlaneGeometry + EdgesGeometry:** PlaneGeometry creates a flat rectangle. EdgesGeometry extracts the 4 outer edges (since all face normals are the same on a plane, only border edges are extracted). Result: a clean wireframe rectangle — perfect for corridor wall segments.
- **Three.js r183 visibility toggling:** `object3D.visible = false` removes the object from the render pipeline entirely — zero draw call cost. Efficient for firewall open/close animation.
- **Performance with ~15 obstacles + ~30 wall segments:** Each LineSegments object is 1 draw call. Total ~45 draw calls for corridor geometry — well within the <500 budget. Box3 intersection is O(1) per obstacle. 15 obstacles * 1 check/frame = negligible CPU cost.
- **Corridor wall narrowing via segments:** Creating 6-8 discrete wall segments per side (rather than one deforming mesh) avoids per-frame vertex buffer updates. Each segment is positioned at construction time in `enter()` — zero per-frame geometry cost. The discrete segments create a stepwise narrowing effect that reads well in the vector wireframe aesthetic.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Senior Developer Review (AI)

- **Reviewer:** Code Review Workflow (Claude Opus 4.6 1M) on 2026-03-26
- **Outcome:** PASS (all issues fixed)
- **Issues Found:** 0 HIGH, 0 MEDIUM, 1 LOW
- **Issues Fixed:** 1 (PlaneGeometry memory leak in right wall segment creation — `CorridorPhase.ts` line 227)
- **All ACs Verified:** Yes (24/24 implemented)
- **All Tasks Verified:** Yes (8/8 with all subtasks genuinely complete)
- **Tests:** 801 pass, 0 fail, 0 regressions
- **Build:** Clean (zero TypeScript errors)
- **Code Quality Notes:**
  - All materials use `VectorMaterials.create()` — no direct material creation
  - All wireframe geometry enables `BLOOM_LAYER`
  - Logging uses `Logger` — no `console.log()`
  - Event-driven damage via `eventBus.emit('playerHit')` — proper decoupling
  - Phase lifecycle matches SurfacePhase pattern exactly
  - Obstacle base class correctly independent of Enemy/ObjectPool
  - RailMovement speed parameter change is backward-compatible

### Debug Log References

- Fixed unused variable `zStart` in CorridorPhase.ts caught by TypeScript strict mode during `npm run build`

### Completion Notes List

- Task 1: Added all 13 corridor constants, 14-point rail path, CorridorObstacleType/CorridorObstacleConfig types, and 14 obstacle placement configs to constants.ts
- Task 2: Created Obstacle abstract base class with Box3 collision, isActive flag, getObject3D(), checkCollision(sphere), and dispose() pattern
- Task 3: Created Firewall with PlaneGeometry+EdgesGeometry+LineSegments, open/close timer cycle with phaseOffset stagger, VectorMaterials.create('firewall'), BLOOM_LAYER
- Task 4: Created NetworkCable with BufferGeometry defining 4 cable lines spanning corridor width, static collision, VectorMaterials.create('networkCable')
- Task 5: Created DataStream with BoxGeometry data-packet shape, lateral bouncing movement at DATA_STREAM_SPEED, collider position sync each frame
- Task 6: Created CorridorPhase with full enter/update/exit lifecycle, 7-segment narrowing corridor walls (left/right/floor/ceiling), obstacle creation from CORRIDOR_OBSTACLES config, RailMovement with speed multiplier, Box3-Sphere collision with hit cooldown, phase completion at rail progress >= 0.98. Modified RailMovement.update() to accept optional speed parameter while preserving backward compatibility.
- Task 7: Wrote 56 new tests across 6 test files. All 801 tests pass (zero regressions from 735 existing).
- Task 8: npm run build produces zero TypeScript errors. Standalone phase architecture ready for integration in story 3-10.

### Change Log

- 2026-03-26: Implemented Story 3-4 Data Corridor Phase — all 8 tasks completed, 56 tests added, zero regressions
- 2026-03-26: Code review — fixed 1 LOW issue (PlaneGeometry memory leak in CorridorPhase.createCorridorWalls right wall segments). All ACs verified, all tests pass (801), build clean.

### File List

New files:
- src/entities/obstacles/Obstacle.ts
- src/entities/obstacles/Firewall.ts
- src/entities/obstacles/NetworkCable.ts
- src/entities/obstacles/DataStream.ts
- src/state/phases/CorridorPhase.ts
- src/__tests__/Obstacle.test.ts
- src/__tests__/Firewall.test.ts
- src/__tests__/NetworkCable.test.ts
- src/__tests__/DataStream.test.ts
- src/__tests__/CorridorPhase.test.ts
- src/__tests__/CorridorConstants.test.ts

Modified files:
- src/config/constants.ts (added corridor constants, rail path, obstacle configs)
- src/systems/RailMovement.ts (added optional speed parameter to update())
- _bmad-output/implementation-artifacts/sprint-status.yaml (status updates)
