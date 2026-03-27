# Story 3.5: Logic Bombs Weapon

Status: done

## Story

As a player,
I want to fire Logic Bombs with lock-on targeting,
so that I have a heavy weapon option for tough enemies.

## Acceptance Criteria

1. A `LogicBombSystem` class exists at `src/systems/LogicBombSystem.ts` that manages lock-on target acquisition, Logic Bomb firing, projectile movement (homing toward locked target), detonation on impact, and ammo tracking
2. `LogicBombSystem` follows the same architectural pattern as `DataLanceSystem`: constructor receives `scene`, `camera`, `inputManager`, `vectorMaterials`, `cockpitRenderer`; pre-allocates a pool of `LogicBomb` projectile instances; provides `update(dt)` and `dispose()` methods
3. Input action `logicBomb` is added to `InputAction` type in `src/config/input.ts` mapped to `KeyZ`. The `InputManager` already supports any action in the `InputAction` type — no changes to `InputManager.ts` needed
4. Logic Bombs have **limited supply per phase**: `LOGIC_BOMB_MAX_AMMO = 5` per phase. Ammo count tracked in `LogicBombSystem`. `getAmmo(): number` method exposed for HUD consumption. Ammo does NOT auto-regenerate — it resets only when a new phase starts (via a `resetAmmo()` method called by phase `enter()`)
5. Lock-on targeting system: each frame when ammo > 0, `LogicBombSystem` scans active enemies from `GameObjectManager` to find the **nearest enemy within a targeting cone** centered on the camera forward direction. Targeting cone half-angle: `LOGIC_BOMB_LOCK_CONE_ANGLE = 0.35` radians (~20 degrees). Maximum lock range: `LOGIC_BOMB_LOCK_RANGE = 60` units. If a valid target is found, store it as `lockedTarget: Enemy | null` and emit a `logicBombLockOn` event via `eventBus` with `{ target: Enemy }`. If no target in cone, `lockedTarget = null` and emit `logicBombLockLost` event via `eventBus`
6. Lock-on target acquisition algorithm: (a) get camera world position and forward direction, (b) iterate all active enemies from `GameObjectManager`, (c) for each enemy compute direction vector from camera to enemy, (d) compute angle between camera forward and direction-to-enemy using `Vector3.angleTo()`, (e) reject if angle > `LOGIC_BOMB_LOCK_CONE_ANGLE`, (f) reject if distance > `LOGIC_BOMB_LOCK_RANGE`, (g) among remaining candidates, select the one with the **smallest angle** (closest to crosshair center). Pre-allocate all temp vectors to avoid GC allocations
7. When the player presses Z (`logicBomb` action) AND `lockedTarget` is not null AND `ammo > 0` AND cooldown <= 0: fire a Logic Bomb projectile. Decrement ammo. Set cooldown to `LOGIC_BOMB_FIRE_COOLDOWN = 1.0` seconds. Emit `weaponFired` event via `eventBus` with `{ weapon: 'logicBomb', position }`. Trigger `cockpitRenderer.recoilArms(2.0)` for heavier recoil than Data Lance
8. If the player presses Z but ammo is 0 or no target is locked, do NOT fire. No feedback needed for now (audio feedback comes in Epic 4)
9. `LogicBomb` projectile entity exists at `src/entities/projectiles/LogicBomb.ts`. It is a short-lived homing projectile that tracks toward its assigned target. It does NOT extend `GameObject` (same lightweight pattern as `EnemyDataBurst`). Properties: `mesh: LineSegments2`, `collider: THREE.Sphere`, `direction: Vector3`, `target: Enemy | null`, `active: boolean`, `distance: number`, `lifetime: number`
10. `LogicBomb` geometry: a diamond/rhombus shape — two crossed line segments forming an X rotated 45 degrees, plus a horizontal line through center. Approximately `2.0 x 2.0` units. Uses `LineSegmentsGeometry` + `LineSegments2` with a fat `LineMaterial` at width `3.5` (thicker than Data Lance bolts at 2.5 to convey weight). Created via `vectorMaterials.createFat('logic-bomb', 3.5)`. Bloom layer enabled
11. `LogicBomb` homing behavior in `update(dt)`: if `target` is not null and target is active, compute direction from bomb position to target position each frame. Smoothly rotate current direction toward target direction using `Vector3.lerp()` with `LOGIC_BOMB_TURN_RATE * dt` as interpolation factor. Move along current direction at `LOGIC_BOMB_SPEED` units/second. Sync collider center to mesh position. If target becomes inactive (already destroyed), continue on last known direction (no more homing). Deactivate if `lifetime > LOGIC_BOMB_MAX_LIFETIME` or `distance > LOGIC_BOMB_MAX_RANGE`
12. `LogicBomb` collision detection: `LogicBombSystem.update(dt)` checks each active bomb against its assigned target using sphere-sphere intersection (`bomb.collider` vs `target.getCollider()`). On hit: deal `LOGIC_BOMB_DAMAGE` to target via `enemy.takeDamage()`, deactivate the bomb, and emit `enemyDestroyed` event if enemy health reaches 0 (this is already handled inside `Enemy.takeDamage()`). The collision check is NOT done in `CollisionSystem` — `LogicBombSystem` handles its own collisions since bombs have a specific assigned target
13. `LogicBomb` pool: pre-allocate `LOGIC_BOMB_POOL_SIZE = 10` instances at construction (matching `MAX_POOL_SIZE.logicBomb` already defined in constants). Use the same visibility-toggle pool pattern as `DataLanceSystem`: `mesh.visible = false` when inactive, `mesh.visible = true` when active. Pool managed internally by `LogicBombSystem` (no need for generic `ObjectPool<T>` — same lightweight custom pool as `DataLanceSystem`)
14. Logic Bomb constants added to `src/config/constants.ts`:
    - `LOGIC_BOMB_SPEED = 30` (slower than Data Lance at 50 — weighty feel)
    - `LOGIC_BOMB_DAMAGE = 40` (one-shots Sentinels at 30 HP, nearly one-shots Watchdogs at 40 HP)
    - `LOGIC_BOMB_MAX_RANGE = 80`
    - `LOGIC_BOMB_MAX_LIFETIME = 4.0` (seconds — long enough to track across arena)
    - `LOGIC_BOMB_FIRE_COOLDOWN = 1.0` (slow fire rate — weighty feel per GDD)
    - `LOGIC_BOMB_TURN_RATE = 3.0` (homing turn speed — high enough to track, not instant)
    - `LOGIC_BOMB_LOCK_CONE_ANGLE = 0.35` (radians ~20 degrees half-angle)
    - `LOGIC_BOMB_LOCK_RANGE = 60` (max targeting distance)
    - `LOGIC_BOMB_MAX_AMMO = 5` (per phase supply)
    - `LOGIC_BOMB_POOL_SIZE = 10`
    - `LOGIC_BOMB_COLLIDER_RADIUS = 0.8`
    - `LOGIC_BOMB_LENGTH = 2.0` (visual size of the diamond shape)
15. New events added to `GameEvents` interface in `src/core/GameEvents.ts`:
    - `logicBombLockOn: { target: Enemy }` — emitted when lock-on acquired
    - `logicBombLockLost: Record<string, never>` — emitted when lock-on lost
    These events will be consumed by HUD (lock-on indicator) and Audio (lock-on tone) in future stories
16. `LogicBombSystem` provides `getPoolStats(): { active: number; total: number }` for debug diagnostics, matching `DataLanceSystem` pattern
17. `LogicBombSystem` provides `getLockedTarget(): Enemy | null` so external systems (HUD) can query the current lock-on state without subscribing to events
18. The `WeaponIndicator` HUD component is NOT modified in this story — Logic Bomb ammo display and lock-on reticle are deferred to a future HUD enhancement story. The events are sufficient for future integration
19. Frame rate remains at 60 FPS stable. Lock-on scan iterates at most ~30-40 active enemies per frame (well under budget). Homing direction computation is trivial. Pool pattern prevents GC pauses
20. Running `npm run build` produces a clean production build with zero TypeScript errors
21. Unit tests exist for: `LogicBombSystem` (lock-on acquisition, firing, ammo tracking, cooldown, pool management), `LogicBomb` projectile (homing behavior, collision, deactivation on range/lifetime), constants validation, input action mapping
22. All existing 801 tests continue to pass — zero regressions

## Tasks / Subtasks

- [x] Task 1: Add Logic Bomb constants to `src/config/constants.ts` (AC: #14)
  - [x] 1.1 Add Logic Bomb weapon constants:
    ```typescript
    // Logic Bomb constants (Story 3-5)
    export const LOGIC_BOMB_SPEED = 30;
    export const LOGIC_BOMB_DAMAGE = 40;
    export const LOGIC_BOMB_MAX_RANGE = 80;
    export const LOGIC_BOMB_MAX_LIFETIME = 4.0;
    export const LOGIC_BOMB_FIRE_COOLDOWN = 1.0;
    export const LOGIC_BOMB_TURN_RATE = 3.0;
    export const LOGIC_BOMB_LOCK_CONE_ANGLE = 0.35;
    export const LOGIC_BOMB_LOCK_RANGE = 60;
    export const LOGIC_BOMB_MAX_AMMO = 5;
    export const LOGIC_BOMB_POOL_SIZE = 10;
    export const LOGIC_BOMB_COLLIDER_RADIUS = 0.8;
    export const LOGIC_BOMB_LENGTH = 2.0;
    ```

- [x] Task 2: Add `logicBomb` input action to `src/config/input.ts` (AC: #3)
  - [x] 2.1 Extend `InputAction` type:
    ```typescript
    export type InputAction = 'moveUp' | 'moveDown' | 'moveLeft' | 'moveRight' | 'fire' | 'logicBomb';
    ```
  - [x] 2.2 Add mapping to `INPUT_ACTIONS`:
    ```typescript
    logicBomb: 'KeyZ',
    ```
  - [x] 2.3 IMPORTANT: Use `'KeyZ'` (physical key code), NOT `'z'` or `'Z'`. The `InputManager` uses `event.code` not `event.key`. Verify by checking existing mappings use `KeyboardEvent.code` values (e.g., `'Space'`, `'ArrowUp'`).

- [x] Task 3: Add new events to `src/core/GameEvents.ts` (AC: #15)
  - [x] 3.1 Add event interfaces:
    ```typescript
    export interface LogicBombLockOnEvent {
      target: Enemy;
    }
    ```
  - [x] 3.2 Add to `GameEvents` interface:
    ```typescript
    logicBombLockOn: LogicBombLockOnEvent;
    logicBombLockLost: Record<string, never>;
    ```

- [x] Task 4: Create `LogicBomb` projectile at `src/entities/projectiles/LogicBomb.ts` (AC: #9, #10, #11)
  - [x] 4.1 Create the projectile entity:
    ```typescript
    /**
     * LogicBomb — Homing heavy missile projectile entity.
     *
     * A diamond/rhombus wireframe shape that tracks toward a locked target.
     * Thicker line width than Data Lance bolts to convey weight and impact.
     * Uses pre-allocated pool pattern: activate/deactivate toggle visibility.
     *
     * GDD: "Weighty feel — slight delay before launch, then powerful impact."
     *
     * Created by: Story 3-5
     */
    ```
  - [x] 4.2 Geometry: diamond/rhombus shape using `LineSegmentsGeometry`. Define vertices for an X-shaped diamond plus center horizontal line:
    ```typescript
    // Diamond shape: two diagonal lines + horizontal center
    const s = LOGIC_BOMB_LENGTH / 2;
    const positions = [
      // Diagonal 1: top-left to bottom-right
      -s, s, 0,    s, -s, 0,
      // Diagonal 2: top-right to bottom-left
      s, s, 0,     -s, -s, 0,
      // Horizontal center line
      -s, 0, 0,    s, 0, 0,
    ];
    geometry.setPositions(positions);
    ```
  - [x] 4.3 Use `vectorMaterials.createFat('logic-bomb', 3.5)` for the shared material. ONE shared material for all Logic Bomb instances (same pattern as DataLanceSystem).
  - [x] 4.4 `activate(origin, direction, target)` method: set position, direction, target reference, reset lifetime/distance, set visible/active. Orient mesh to face travel direction using `quaternion.setFromUnitVectors()`.
  - [x] 4.5 `deactivate()` method: set `active = false`, `mesh.visible = false`, `target = null`.
  - [x] 4.6 `update(dt)` method: if target is active, compute direction to target and lerp current direction toward it. Move along direction at `LOGIC_BOMB_SPEED`. Increment distance and lifetime. Sync collider center. Deactivate if lifetime or range exceeded. If target is null or inactive, continue straight (no homing).
  - [x] 4.7 CRITICAL: Pre-allocate direction temp vectors as instance properties (same zero-allocation pattern as `DataLanceSystem`). Do NOT allocate `new Vector3()` inside `update()`.

- [x] Task 5: Create `LogicBombSystem` at `src/systems/LogicBombSystem.ts` (AC: #1, #2, #4, #5, #6, #7, #8, #12, #13, #16, #17)
  - [x] 5.1 Create the system class:
    ```typescript
    /**
     * LogicBombSystem — Manages lock-on targeting, firing, and homing
     * projectile lifecycle for the Logic Bomb heavy weapon.
     *
     * Architecture: Same pattern as DataLanceSystem — owns its projectile
     * pool, handles its own collision detection (bomb→target sphere check),
     * and does NOT import other systems.
     *
     * GDD: "Limited-supply heavy missiles with lock-on targeting.
     * Weighty feel — slight delay before launch, then powerful impact."
     *
     * Created by: Story 3-5
     */
    ```
  - [x] 5.2 Constructor: receives `scene`, `camera`, `inputManager`, `vectorMaterials`, `cockpitRenderer`, `gameObjectManager`. Pre-allocate `LOGIC_BOMB_POOL_SIZE` LogicBomb instances. Pre-allocate temp vectors for lock-on computation (`tempCameraPos`, `tempCameraDir`, `tempToEnemy`).
  - [x] 5.3 Lock-on scan implementation (called every frame in `update(dt)` when ammo > 0):
    ```typescript
    private scanForTarget(): void {
      this.camera.getWorldPosition(this.tempCameraPos);
      this.camera.getWorldDirection(this.tempCameraDir);

      let bestTarget: Enemy | null = null;
      let bestAngle = LOGIC_BOMB_LOCK_CONE_ANGLE;

      const entities = this.gameObjectManager.getAll();
      for (const entity of entities) {
        if (!entity.isActive) continue;
        if (!('takeDamage' in entity)) continue;

        const enemy = entity as Enemy;
        this.tempToEnemy.copy(enemy.getPosition()).sub(this.tempCameraPos);
        const distance = this.tempToEnemy.length();
        if (distance > LOGIC_BOMB_LOCK_RANGE) continue;

        this.tempToEnemy.normalize();
        const angle = this.tempToEnemy.angleTo(this.tempCameraDir);
        if (angle < bestAngle) {
          bestAngle = angle;
          bestTarget = enemy;
        }
      }

      // Emit lock events on state change
      if (bestTarget !== this.lockedTarget) {
        this.lockedTarget = bestTarget;
        if (bestTarget) {
          eventBus.emit('logicBombLockOn', { target: bestTarget });
        } else {
          eventBus.emit('logicBombLockLost', {});
        }
      }
    }
    ```
  - [x] 5.4 Fire logic in `update(dt)`:
    ```typescript
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.scanForTarget();

    if (this.inputManager.isActive('logicBomb') && this.lockedTarget && this.ammo > 0 && this.cooldown <= 0) {
      this.fire();
    }

    this.updateBombs(dt);
    this.checkBombCollisions();
    ```
  - [x] 5.5 `fire()` implementation: acquire bomb from pool, activate with camera position + camera forward direction + locked target, decrement ammo, set cooldown, emit `weaponFired` event, trigger heavier recoil.
  - [x] 5.6 `updateBombs(dt)`: iterate all bombs, call `bomb.update(dt)` on active ones.
  - [x] 5.7 `checkBombCollisions()`: for each active bomb with a non-null target, check sphere-sphere intersection between `bomb.collider` and `target.getCollider()`. On hit: `target.takeDamage(LOGIC_BOMB_DAMAGE)`, deactivate bomb. Log collision.
  - [x] 5.8 `resetAmmo()`: sets `ammo = LOGIC_BOMB_MAX_AMMO`. Called by phase `enter()` methods.
  - [x] 5.9 `getAmmo(): number` for HUD queries.
  - [x] 5.10 `getLockedTarget(): Enemy | null` for external queries.
  - [x] 5.11 `getPoolStats()` for debug diagnostics.
  - [x] 5.12 `dispose()`: remove all bomb meshes from scene, dispose geometries.

- [x] Task 6: Write unit tests (AC: #21, #22)
  - [x] 6.1 `src/__tests__/LogicBomb.test.ts`: Construction, geometry creation with bloom layer, activate/deactivate visibility toggle, homing direction updates toward target, straight-line movement when target is null, deactivation on lifetime expiry, deactivation on range expiry, collider center sync
  - [x] 6.2 `src/__tests__/LogicBombSystem.test.ts`:
    - Lock-on acquisition: finds nearest enemy in cone, ignores enemies outside cone, ignores enemies beyond range, selects smallest-angle target
    - Lock-on state changes: emits `logicBombLockOn` when target acquired, emits `logicBombLockLost` when target lost
    - Firing: fires when Z pressed + target locked + ammo > 0 + cooldown ready, does NOT fire when no target, does NOT fire when ammo = 0, decrements ammo on fire, respects cooldown
    - Ammo: starts at `LOGIC_BOMB_MAX_AMMO`, `resetAmmo()` restores to max
    - Collision: bomb damages target on sphere-sphere hit, bomb deactivates on hit
    - Pool: pre-allocates correct number of bombs, pool exhaustion handling
  - [x] 6.3 `src/__tests__/LogicBombConstants.test.ts`: All constant values are positive numbers, LOGIC_BOMB_SPEED < DATA_LANCE_BOLT_SPEED (slower = weighty), LOGIC_BOMB_DAMAGE > DATA_LANCE_BOLT_DAMAGE (high damage), LOGIC_BOMB_MAX_AMMO > 0, pool size matches MAX_POOL_SIZE.logicBomb
  - [x] 6.4 `src/__tests__/InputActions.test.ts` (extend existing or create): Verify `logicBomb` action exists in `INPUT_ACTIONS`, mapped to `KeyZ`
  - [x] 6.5 Follow the same test setup patterns as `DataLanceSystem.test.ts`: mock `InputManager` with `vi.fn()`, use real `THREE.Scene`, `PerspectiveCamera`, `VectorMaterials`, `CockpitRenderer`. Mock `GameObjectManager` with controllable enemy list.
  - [x] 6.6 Verify all 801 existing tests still pass after changes

- [x] Task 7: Verify build and integration readiness (AC: #19, #20)
  - [x] 7.1 `npm run build` produces zero TypeScript errors
  - [x] 7.2 Performance validation: lock-on scan is O(n) over active enemies (~30-40 max), homing math is trivial Vector3 ops, pool prevents GC — well within 16.67ms frame budget
  - [x] 7.3 The `LogicBombSystem` is standalone — it is NOT integrated into any phase's game loop yet. Integration comes when phases are wired together (story 3-10). The system MUST be designed so that phase code can simply call `logicBombSystem.update(dt)` alongside `dataLanceSystem.update(dt)`.

## Dev Notes

### Architecture Patterns and Constraints

- **System Architecture:** `LogicBombSystem` lives at `src/systems/LogicBombSystem.ts` per the architecture directory structure. It follows the same pattern as `DataLanceSystem` — it owns its projectile pool, handles its own update loop, and communicates via `eventBus`. It does NOT import `CollisionSystem`, `DataLanceSystem`, or any other system.
- **Projectile Entity:** `LogicBomb.ts` at `src/entities/projectiles/LogicBomb.ts` per architecture. The `src/entities/projectiles/` directory already contains `EnemyDataBurst.ts` from story 2-5. LogicBomb follows the same lightweight pattern — NOT extending `GameObject`, just a plain class with mesh/collider/update.
- **GameObjectManager dependency:** `LogicBombSystem` receives `GameObjectManager` in its constructor to iterate enemies for lock-on scanning. This is a read-only dependency — it never adds/removes entities. The same pattern is used by `CollisionSystem` which also receives `GameObjectManager`.
- **Input extension:** Adding `logicBomb` to `InputAction` type requires updating the type union in `src/config/input.ts` and adding the mapping entry. `InputManager` is generic — it reads from `INPUT_ACTIONS` record and works with any `InputAction` key. No changes to `InputManager.ts` needed.
- **Event-driven communication:** Lock-on events (`logicBombLockOn`, `logicBombLockLost`) are added to `GameEvents.ts` for future HUD/audio consumption. The `weaponFired` event already exists with `WeaponType` that includes `'logicBomb'`.
- **Material creation:** ONE shared `LineMaterial` via `vectorMaterials.createFat('logic-bomb', 3.5)`. NEVER create materials directly. This ensures palette transitions work.
- **Zero-allocation update loop:** All temp vectors (`tempCameraPos`, `tempCameraDir`, `tempToEnemy`) are pre-allocated as instance properties. No `new Vector3()` inside `update()` or `scanForTarget()`.

### GDD Weapon Feel Requirements

- **"Weighty and impactful"** — achieved through: slower projectile speed (30 vs Data Lance 50), longer cooldown (1.0s vs 0.13s), heavier cockpit recoil (2.0 vs 1.0), thicker line width (3.5 vs 2.5)
- **"Lock-on targeting gives tactical feel"** — achieved through: cone-based target acquisition, clear lock-on/lock-lost events for future UI/audio feedback
- **"Slight delay before launch"** — the 1.0s cooldown between shots creates the deliberate pacing
- **"Save for tough enemies or boss phases"** — limited ammo (5 per phase) forces resource management decisions
- **"Explosion is the most visually spectacular moment in regular combat"** — Logic Bomb kills trigger the same `enemyDestroyed` event → `EffectsManager` explosion. The high damage (40) means one-shot kills on Sentinels (30 HP) producing satisfying instant destruction

### Damage Balance

| Target | HP | Logic Bomb Hits to Kill | Data Lance Twin-Bolt Hits to Kill |
|--------|-----|------------------------|----------------------------------|
| Sentinel | 30 | 1 (one-shot) | ~4 twin volleys |
| Watchdog | 40 | 1 (one-shot) | ~5 twin volleys |
| Gatekeeper | 80 | 2 | ~10 twin volleys |

Logic Bombs should feel like the "smart choice" for tough targets — one bomb vs many seconds of sustained Data Lance fire. Limited ammo prevents overuse.

### Integration Notes for Future Stories

- **Story 3-7 (Gatekeeper Boss):** `LogicBombSystem` is ready for boss phase integration. Lock-on scan works against any entity with `takeDamage` in `GameObjectManager`.
- **Story 3-10 (Phase Transitions):** Phase `enter()` should call `logicBombSystem.resetAmmo()` to restore ammo between phases.
- **HUD Enhancement (future):** `getAmmo()` and `getLockedTarget()` methods are ready for HUD display integration. Lock-on events are ready for a targeting reticle overlay.
- **Audio (Epic 4):** Lock-on events (`logicBombLockOn`, `logicBombLockLost`) are ready for lock-on tone SFX. `weaponFired` event with `weapon: 'logicBomb'` is ready for fire SFX.

### Existing Code Patterns to Follow

- **DataLanceSystem** (`src/systems/DataLanceSystem.ts`): Reference implementation for weapon system architecture — pool pattern, fire logic, update loop, dispose
- **EnemyDataBurst** (`src/entities/projectiles/EnemyDataBurst.ts`): Reference for lightweight projectile entity — mesh, collider, activate/deactivate, update
- **CollisionSystem** (`src/systems/CollisionSystem.ts`): Reference for `GameObjectManager` iteration and enemy type checking (`'takeDamage' in entity`)
- **DataLanceSystem.test.ts** (`src/__tests__/DataLanceSystem.test.ts`): Reference for test setup — mock InputManager, real Scene/Camera/VectorMaterials

### Project Structure Notes

- All new files align with architecture directory structure:
  - `src/systems/LogicBombSystem.ts` — weapon system
  - `src/entities/projectiles/LogicBomb.ts` — projectile entity
  - `src/config/constants.ts` — constants (append)
  - `src/config/input.ts` — input mapping (extend)
  - `src/core/GameEvents.ts` — events (extend)
- No new directories created — all target directories already exist
- No conflicts with existing files — all new content is additive

### Technical Research Notes

- **Three.js r183 `Vector3.angleTo()`**: Returns angle in radians between two vectors. Works correctly for targeting cone check. No normalization needed on the calling vector if using `angleTo()` (it normalizes internally).
- **Three.js r183 `Vector3.lerp()`**: Linear interpolation. For homing, `direction.lerp(targetDirection, turnRate * dt)` followed by `.normalize()` gives smooth homing curves. The `turnRate * dt` factor must be clamped to `[0, 1]` to prevent overshooting.
- **Three.js r183 `Sphere.intersectsSphere()`**: Built-in sphere-sphere intersection test. Returns `true` if spheres overlap. Efficient for bomb-to-enemy collision.
- **LineMaterial resolution**: The `LogicBomb` uses `LineSegments2` with `LineMaterial`. The `LineMaterial.resolution` property must match the renderer viewport size for correct line width rendering. This is handled automatically by `LineSegments2.onBeforeRender` for visible objects — no manual resolution updates needed.

### References

- [Source: _bmad-output/gdd.md#Weapon Systems] — Logic Bombs: "Lock-on heavy missiles, Limited supply, Slow fire rate, High damage, Heavy hitter — save for tough targets and boss phases"
- [Source: _bmad-output/gdd.md#Input Feel] — "Logic Bombs: Weighty and impactful. Slight delay before launch communicates power. Lock-on targeting gives tactical feel."
- [Source: _bmad-output/gdd.md#Economy and Resources] — "Logic Bombs have a limited supply per phase. Supply resets between phases."
- [Source: _bmad-output/game-architecture.md#Input System] — `logicBomb` action mapped to Z key
- [Source: _bmad-output/game-architecture.md#Object Pooling] — `ObjectPool<LogicBomb>` pre-warm 10
- [Source: _bmad-output/game-architecture.md#Entity System] — `LogicBomb` in Projectile hierarchy
- [Source: _bmad-output/game-architecture.md#Event System] — `weaponFired` event with `WeaponType`
- [Source: _bmad-output/game-architecture.md#Architectural Boundaries] — Systems never import each other
- [Source: _bmad-output/project-context.md#Critical Implementation Rules] — VectorMaterials.create() mandatory, BLOOM_LAYER on all geometry, ObjectPool for dynamic entities, EventBus for inter-system communication

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

No debug issues encountered during implementation.

### Completion Notes List

- Task 1: Added 12 Logic Bomb constants to `src/config/constants.ts`. All values match story spec exactly. Pool size matches existing `MAX_POOL_SIZE.logicBomb = 10`.
- Task 2: Extended `InputAction` type to include `'logicBomb'` and mapped it to `'KeyZ'` (physical key code). Updated existing `InputConfig.test.ts` to expect 6 keys instead of 5.
- Task 3: Added `LogicBombLockOnEvent` interface and `logicBombLockOn`/`logicBombLockLost` events to `GameEvents` interface in `GameEvents.ts`.
- Task 4: Created `LogicBomb` projectile entity at `src/entities/projectiles/LogicBomb.ts`. Diamond/rhombus geometry using `LineSegmentsGeometry`. Homing behavior via `Vector3.lerp()` with clamped turn rate. Pre-allocated temp vectors for zero-allocation updates. Follows same lightweight pattern as `EnemyDataBurst`.
- Task 5: Created `LogicBombSystem` at `src/systems/LogicBombSystem.ts`. Lock-on targeting scans active enemies via `GameObjectManager`, selects nearest-angle target within cone (0.35 rad) and range (60 units). Fires on Z key when target locked, ammo > 0, cooldown ready. Handles own sphere-sphere collision detection. Provides `resetAmmo()`, `getAmmo()`, `getLockedTarget()`, `getPoolStats()`, `dispose()`.
- Task 6: Created 4 test files with 52 new tests covering: constants validation, input action mapping, LogicBomb projectile (construction, activation, homing, deactivation, collider sync), LogicBombSystem (lock-on acquisition, events, firing, ammo, cooldown, collision, pool, dispose).
- Task 7: `npm run build` passes with zero TypeScript errors. All 857 tests pass (52 new + 805 existing with 1 updated). Lock-on scan is O(n) over active enemies, homing math is trivial Vector3 ops, pool prevents GC. System is standalone and ready for phase integration via `logicBombSystem.update(dt)`.

### Change Log

- 2026-03-26: Story 3-5 implemented — Logic Bombs weapon system with lock-on targeting, homing projectiles, ammo management, and full test coverage.
- 2026-03-26: Code review (AI) — 2 LOW issues found and fixed: (1) Simplified unnecessary `as unknown as Enemy` cast in LogicBombSystem.ts to match CollisionSystem pattern, (2) Fixed ineffective afterEach cleanup in LogicBombSystem.test.ts to properly call system.dispose(). All 857 tests pass. Status → done.

### File List

New files:
- src/entities/projectiles/LogicBomb.ts
- src/systems/LogicBombSystem.ts
- src/__tests__/LogicBomb.test.ts
- src/__tests__/LogicBombSystem.test.ts
- src/__tests__/LogicBombConstants.test.ts
- src/__tests__/InputActions.test.ts

Modified files:
- src/config/constants.ts (added 12 Logic Bomb constants)
- src/config/input.ts (added logicBomb action mapped to KeyZ)
- src/core/GameEvents.ts (added LogicBombLockOnEvent, logicBombLockOn, logicBombLockLost events)
- src/__tests__/InputConfig.test.ts (updated key count from 5 to 6)
