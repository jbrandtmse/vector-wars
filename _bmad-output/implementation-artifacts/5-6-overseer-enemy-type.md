# Story 5.6: Overseer Enemy Type

Status: review

## Story

As a player,
I want to fight Overseer enemies that coordinate nearby constructs,
so that late-game combat has tactical complexity requiring me to prioritize targets.

## Acceptance Criteria

1. An `Overseer` class exists at `src/entities/enemies/Overseer.ts` that extends `Enemy`. It uses a complex, multi-part wireframe geometry (a central icosahedron with 4 orbiting satellite cubes) to create a visually distinct construct that commands attention. It uses shared geometry and material across all instances (same static pattern as Sentinel, Watchdog, Gatekeeper).

2. Constants are defined in `src/config/constants.ts`:
   - `OVERSEER_HEALTH = 60` (moderately tough -- not as tanky as Gatekeeper but harder than Watchdog)
   - `OVERSEER_SCORE_VALUE = 400` (high-priority target, highest score of regular enemies)
   - `OVERSEER_COLLIDER_RADIUS = 1.8` (larger than Sentinel/Watchdog, smaller than Gatekeeper)
   - `OVERSEER_POOL_SIZE = 6` (fewer spawned than other types -- elite enemies)
   - `OVERSEER_BUFF_RADIUS = 15.0` (distance within which nearby enemies receive buffs)
   - `OVERSEER_BUFF_COOLDOWN_MULTIPLIER = 0.6` (buffed enemies attack 40% faster)
   - `OVERSEER_BUFF_SPEED_MULTIPLIER = 1.3` (buffed enemies move 30% faster)

3. Per-level behavior params are defined:
   - `OVERSEER_BEHAVIOR_LEVEL2`: patrolSpeed 1.2, attackCooldown 2.5, evasionChance 0.15, movementRandomness 0.1, attackDamage 15, projectileSpeed 16
   - `OVERSEER_BEHAVIOR_LEVEL3`: patrolSpeed 1.5, attackCooldown 1.8, evasionChance 0.35, movementRandomness 0.4, attackDamage 18, projectileSpeed 18

4. An `OverseerState` AI state exists at `src/ai/states/OverseerState.ts`. It implements `AIState` and provides the Overseer's unique coordination behavior:
   - Orbits slowly around its spawn position (same pattern as PatrolState but at a higher altitude offset)
   - Every `OVERSEER_BUFF_INTERVAL` seconds (constant, default 3.0s), scans for nearby enemies within `OVERSEER_BUFF_RADIUS`
   - Applies buff to nearby enemies by temporarily overriding their `params` with boosted values (cooldown * `OVERSEER_BUFF_COOLDOWN_MULTIPLIER`, patrolSpeed * `OVERSEER_BUFF_SPEED_MULTIPLIER`)
   - Emits a visual "pulse" via a brief scale increase (1.0 -> 1.3 -> 1.0 over 0.3s) when buffing
   - Transitions to AttackState after `attackCooldown` seconds, then returns to OverseerState

5. The `LevelBehaviorConfig` interface and `LEVEL_BEHAVIORS` record are extended with an `overseer` field. All three level entries include the Overseer behavior params (Level 1 uses `OVERSEER_BEHAVIOR_LEVEL2` as fallback since Overseers don't appear in Level 1 but the config must be complete).

6. The `SpawnEvent.enemyType` union type is extended with `'overseer'`.

7. `EnemySpawner` is updated:
   - Adds an `overseerPool: ObjectPool<Overseer>` pre-warmed with `OVERSEER_POOL_SIZE` instances
   - Handles `'overseer'` in `spawnWave()` with AI state chain: Spawn -> OverseerState -> Attack -> OverseerState cycle
   - Releases overseers back to pool on `enemyDestroyed` event
   - Exposes `getOverseerPool()` method for diagnostics
   - `setLevelBehaviors()` assigns `overseer` params when spawning Overseer enemies

8. `OverseerState` receives the `GameObjectManager` reference to scan for nearby enemies. It uses `gameObjectManager.getAll()` filtered to active `Enemy` instances (excluding the Overseer itself) within `OVERSEER_BUFF_RADIUS` distance.

9. Spawn events for Levels 2 and 3 (`SPAWN_EVENTS_LEVEL2`, `SPAWN_EVENTS_LEVEL3`) include Overseer spawn entries. Level 2 gets 2-3 Overseer spawns at mid-to-late rail positions. Level 3 gets 3-4 Overseer spawns including earlier appearances.

10. Running `npm run build` produces a clean production build with zero TypeScript errors.

11. Unit tests exist (Vitest) for:
    - `Overseer` class: exports, inherits Enemy methods (update, takeDamage, reset), uses shared geometry/material, default OVERSEER_HEALTH/OVERSEER_SCORE_VALUE, accepts custom BehaviorParams, calls vectorMaterials.create('overseer'), reuses shared geometry across instances
    - `OverseerState`: construction with GameObjectManager, orbit movement updates position, buff pulse triggers at OVERSEER_BUFF_INTERVAL, buff scan finds enemies within OVERSEER_BUFF_RADIUS, buff scan ignores enemies outside radius, buff modifies enemy params (cooldown and speed), attack transition after attackCooldown
    - Constants: all OVERSEER_* constants exist with correct values, OVERSEER_BEHAVIOR_LEVEL2 and LEVEL3 have all BehaviorParams fields, LevelBehaviorConfig includes overseer field, LEVEL_BEHAVIORS all three levels include overseer
    - Spawn events: SPAWN_EVENTS_LEVEL2 has overseer entries, SPAWN_EVENTS_LEVEL3 has overseer entries

12. All existing tests continue to pass -- zero regressions.

## Tasks / Subtasks

- [x] Task 1: Add Overseer constants to `src/config/constants.ts` (AC: #2, #3, #5, #6)
  - [x] 1.1 Add `OVERSEER_HEALTH = 60`, `OVERSEER_SCORE_VALUE = 400`, `OVERSEER_COLLIDER_RADIUS = 1.8`, `OVERSEER_POOL_SIZE = 6`
  - [x] 1.2 Add `OVERSEER_BUFF_RADIUS = 15.0`, `OVERSEER_BUFF_COOLDOWN_MULTIPLIER = 0.6`, `OVERSEER_BUFF_SPEED_MULTIPLIER = 1.3`, `OVERSEER_BUFF_INTERVAL = 3.0`
  - [x] 1.3 Add `OVERSEER_BEHAVIOR_LEVEL2: BehaviorParams` (patrolSpeed: 1.2, attackCooldown: 2.5, evasionChance: 0.15, movementRandomness: 0.1, attackDamage: 15, projectileSpeed: 16)
  - [x] 1.4 Add `OVERSEER_BEHAVIOR_LEVEL3: BehaviorParams` (patrolSpeed: 1.5, attackCooldown: 1.8, evasionChance: 0.35, movementRandomness: 0.4, attackDamage: 18, projectileSpeed: 18)
  - [x] 1.5 Extend `LevelBehaviorConfig` interface with `overseer: BehaviorParams` field
  - [x] 1.6 Add `overseer` to all three entries in `LEVEL_BEHAVIORS` (Level 1 uses OVERSEER_BEHAVIOR_LEVEL2 as fallback)
  - [x] 1.7 Extend `SpawnEvent.enemyType` union with `'overseer'`
  - [x] 1.8 Add Overseer spawn entries to `SPAWN_EVENTS_LEVEL2` (2-3 spawns at mid-to-late positions)
  - [x] 1.9 Add Overseer spawn entries to `SPAWN_EVENTS_LEVEL3` (3-4 spawns including earlier positions)

- [x] Task 2: Create `Overseer` entity class (AC: #1)
  - [x] 2.1 Create `src/entities/enemies/Overseer.ts` extending Enemy
  - [x] 2.2 Use shared static geometry: central IcosahedronGeometry(1.0, 0) + 4 small BoxGeometry(0.3, 0.3, 0.3) satellite cubes positioned at cardinal offsets (top, bottom, left, right of center). Convert all to EdgesGeometry, combine into a single THREE.Group
  - [x] 2.3 Use shared static material via `vectorMaterials.create('overseer')`
  - [x] 2.4 Enable bloom layer on all wireframe children
  - [x] 2.5 Add `resetSharedResources()` static method for testing

- [x] Task 3: Create `OverseerState` AI state (AC: #4, #8)
  - [x] 3.1 Create `src/ai/states/OverseerState.ts` implementing AIState
  - [x] 3.2 Constructor accepts: `GameObjectManager`, `playerPositionGetter`, `createAttackState` factory
  - [x] 3.3 Implement orbit movement in `update()`: circular orbit around spawn position (same math as PatrolState) with higher Y offset (+2.0 for commanding position)
  - [x] 3.4 Implement buff timer: every `OVERSEER_BUFF_INTERVAL` seconds, scan GameObjectManager for active Enemy instances within `OVERSEER_BUFF_RADIUS` of the Overseer
  - [x] 3.5 Implement buff application: for each enemy in range, apply `params.attackCooldown * OVERSEER_BUFF_COOLDOWN_MULTIPLIER` and `params.patrolSpeed * OVERSEER_BUFF_SPEED_MULTIPLIER` by storing original params and creating buffed params
  - [x] 3.6 Implement buff pulse visual: scale 1.0 -> 1.3 -> 1.0 over 0.3s when buff triggers
  - [x] 3.7 Implement attack transition: after `enemy.params.attackCooldown` seconds, transition to AttackState (provided by factory), which returns to a new OverseerState
  - [x] 3.8 Pre-allocate all temp vectors to avoid per-frame GC

- [x] Task 4: Update `EnemySpawner` (AC: #7)
  - [x] 4.1 Import Overseer class and OverseerState
  - [x] 4.2 Add `overseerPool: ObjectPool<Overseer>` field, pre-warm with `OVERSEER_POOL_SIZE`
  - [x] 4.3 Handle `'overseer'` in `spawnWave()`: acquire from overseerPool, apply level behaviors, wire AI state chain (Spawn -> OverseerState -> Attack -> OverseerState)
  - [x] 4.4 Pass `gameObjectManager` to OverseerState constructor so it can scan for nearby enemies
  - [x] 4.5 Add Overseer to `enemyDestroyed` event handler for pool release
  - [x] 4.6 Add `getOverseerPool()` accessor method
  - [x] 4.7 Handle `overseer` in the level behaviors assignment block

- [x] Task 5: Write tests (AC: #11, #12)
  - [x] 5.1 Create `src/__tests__/Overseer.test.ts` (class export, inherited methods, shared geometry, defaults, custom params, material creation, geometry reuse)
  - [x] 5.2 Create `src/__tests__/OverseerState.test.ts` (construction, orbit movement, buff pulse timing, buff radius filtering, buff param modification, attack transition)
  - [x] 5.3 Create `src/__tests__/OverseerConstants.test.ts` (all constants, behavior params, LevelBehaviorConfig extension, LEVEL_BEHAVIORS entries, spawn event entries)
  - [x] 5.4 Update `src/__tests__/EnemySpawner.test.ts` to verify overseer pool exists and getOverseerPool accessor

- [x] Task 6: Build verification (AC: #10, #12)
  - [x] 6.1 Run `npx tsc --noEmit` -- zero TypeScript errors
  - [x] 6.2 Run `npm run test` -- all tests pass, zero regressions

## Dev Notes

### Architecture Compliance

- **Entities never import systems.** Overseer extends Enemy, does NOT import EnemySpawner or CollisionSystem. [Source: project-context.md#Architecture Rules]
- **Systems never import each other.** OverseerState receives GameObjectManager via constructor injection, does NOT import EnemySpawner. [Source: project-context.md#Architecture Rules]
- **AI states NEVER check level number.** All Overseer behavioral variation comes from BehaviorParams injected at spawn time from LEVEL_BEHAVIORS config. No `if (level === 2)` conditionals. [Source: project-context.md#Architecture Rules]
- **All entity creation through factory functions + ObjectPool.** Never `new Overseer()` in gameplay code. EnemySpawner pre-warms the pool and uses `acquire()`/`release()`. [Source: project-context.md#Performance Rules]
- **NEVER create materials directly.** Always use `VectorMaterials.create('overseer')`. [Source: project-context.md#Critical Implementation Rules]
- **All vector geometry must enable bloom layer:** `mesh.layers.enable(BLOOM_LAYER)` on every wireframe child. [Source: project-context.md#Critical Implementation Rules]
- **Use `Logger.info/warn/error()`** -- NEVER `console.log()`. [Source: project-context.md#Critical Don't-Miss Rules]
- **`erasableSyntaxOnly: true`**: No `enum`. Use `type` unions and `as const` objects. [Source: tsconfig.json]
- **`verbatimModuleSyntax: true`**: Use `import type { ... }` for type-only imports. [Source: tsconfig.json]
- **No per-frame allocations.** OverseerState must pre-allocate temp vectors. Buff param objects should be cached, not created every frame. [Source: project-context.md#Performance Rules]
- **Delta time cap:** `Math.min(dt, 1/20)` already handled by game loop. [Source: project-context.md#Performance Rules]

### Critical Implementation Rules

- **Overseer buff does NOT stack with EMP stun.** If an enemy is stunned, the stun debuff takes priority via `getEffectiveParams()`. The Overseer buff modifies `enemy.params` directly (the base params), so when stun expires the buffed base params are still active. This is intentional -- the Overseer makes nearby enemies permanently faster/more aggressive until the Overseer is destroyed.
- **Overseer buff is re-applied every OVERSEER_BUFF_INTERVAL.** This means if a buffed enemy dies and a new one spawns in range, it gets buffed on the next pulse. The buff does not need explicit "remove" logic -- enemies simply return to their level-default params when acquired from the pool (via `reset()` -> pool sets fresh params at spawn).
- **OverseerState receives GameObjectManager but NEVER calls `add()` or `remove()`.** It only reads the entity list via `getAll()` for scanning nearby enemies.
- **SpawnEvent.enemyType is a string union** in the `SpawnEvent` interface. Extending it means adding `'overseer'` to the union.

### Existing Code Patterns to Follow

- **Sentinel.ts, Watchdog.ts, Gatekeeper.ts** at `src/entities/enemies/` -- Follow the exact same pattern: shared static geometry/material, constructor takes VectorMaterials + optional BehaviorParams, `resetSharedResources()` for tests.
- **PatrolState.ts** at `src/ai/states/` -- Follow orbit math pattern: angle increment by patrolSpeed * dt, circular XZ orbit around spawn position, Y bobbing.
- **PursuitState.ts, BlockState.ts** at `src/ai/states/` -- Follow constructor injection pattern: receive callbacks, never import systems.
- **EnemySpawner.ts** at `src/systems/` -- Follow pool creation pattern (pre-warm in constructor, release on enemyDestroyed, expose pool accessor).
- **AttackState.ts** at `src/ai/states/` -- Follow fire-once-and-transition pattern.
- **Watchdog.test.ts, WatchdogConstants.test.ts** at `src/__tests__/` -- Follow test patterns for enemy class and constants validation.

### What Already Exists (DO NOT recreate)

- `src/entities/enemies/Enemy.ts` -- Abstract base class. Overseer extends this. DO NOT MODIFY.
- `src/entities/GameObject.ts` -- Base class with `enableBloomOnChildren()`, `syncCollider()`. DO NOT MODIFY.
- `src/ai/AIState.ts` -- AIState interface (enter/update/exit). DO NOT MODIFY.
- `src/ai/BehaviorParams.ts` -- BehaviorParams interface. DO NOT MODIFY.
- `src/ai/states/AttackState.ts` -- Attack state with fire callback. DO NOT MODIFY. REUSE for Overseer's attack cycle.
- `src/ai/states/SpawnState.ts` -- Spawn animation state. DO NOT MODIFY. REUSE for Overseer spawn.
- `src/ai/states/PatrolState.ts` -- Orbit patrol math reference. DO NOT MODIFY. Use as reference for OverseerState orbit.
- `src/core/ObjectPool.ts` -- Generic pool. DO NOT MODIFY. Use for overseerPool.
- `src/core/GameEvents.ts` -- Event definitions. DO NOT MODIFY (no new events needed).
- `src/rendering/VectorMaterials.ts` -- Material registry. DO NOT MODIFY.
- `src/entities/GameObjectManager.ts` -- Active entity list with `getAll()`. DO NOT MODIFY.

### What Must Be Created

- `src/entities/enemies/Overseer.ts` -- Overseer enemy class (complex multi-part wireframe)
- `src/ai/states/OverseerState.ts` -- Coordinator AI state with buff pulse mechanic
- `src/__tests__/Overseer.test.ts` -- Entity class tests
- `src/__tests__/OverseerState.test.ts` -- AI state tests
- `src/__tests__/OverseerConstants.test.ts` -- Constants and config tests

### What Must Be Modified

- `src/config/constants.ts` -- Add all OVERSEER_* constants, extend LevelBehaviorConfig, extend SpawnEvent.enemyType, update LEVEL_BEHAVIORS, add spawn entries to L2/L3
- `src/systems/EnemySpawner.ts` -- Add overseerPool, handle overseer spawn, pool release, expose accessor
- `src/__tests__/EnemySpawner.test.ts` -- Add overseer pool verification test

### Overseer Geometry Design

The Overseer is a "complex, multi-part construct" (GDD) -- visually distinct from simpler enemies:
- **Central body**: IcosahedronGeometry(1.0, 0) -- 20-face polyhedron, more complex than Sentinel's octahedron
- **Satellite cubes**: 4x BoxGeometry(0.3, 0.3, 0.3) positioned at offsets:
  - Top: (0, 1.2, 0)
  - Bottom: (0, -1.2, 0)
  - Left: (-1.2, 0, 0)
  - Right: (1.2, 0, 0)
- All converted to EdgesGeometry for wireframe rendering
- All added to the object3D group, all with bloom layer enabled
- The satellite pattern creates a "commanding" multi-node look that says "this one is different"

### Scope Boundaries

**IN scope**: Overseer entity class, OverseerState AI with buff mechanic, constants, pool integration in EnemySpawner, Level 2/3 spawn events, tests.

**NOT in scope** (future stories):
- Enemy behavioral evolution system (randomized params) -- Story 5-7
- Handler voice escalation -- Story 5-8
- Briefing screens for all levels -- Story 5-9
- Ending sequence -- Story 5-10
- High score table -- Story 5-11
- Cyberspace fragmentation ending -- Story 5-12

### Previous Story Intelligence

From Story 5-5 (Color Palette Progression):
- Test count after Story 5-5: 1706 tests across 119 files.
- PaletteTransition class created for smooth color transitions.
- LevelManager now accepts SceneEnvironment in constructor.
- `erasableSyntaxOnly: true` -- No enums. Use type unions and `as const` objects.
- `verbatimModuleSyntax: true` -- Use `import type { ... }` for type-only imports.

From Story 3-2 (Gatekeeper Enemy Type):
- Established pattern for adding enemy types: constants -> entity class -> AI state -> EnemySpawner integration -> tests.
- LevelBehaviorConfig was created with sentinel/watchdog/gatekeeper fields.
- LEVEL_BEHAVIORS record keyed by level number.

From Story 3-1 (Watchdog Enemy Type):
- PursuitState pattern established -- constructor injection, no system imports.
- Shared geometry/material pattern validated across all enemy types.
- Pool pre-warm + release-on-destroy pattern.

### Project Structure Notes

- `src/entities/enemies/Overseer.ts` -- alongside Sentinel.ts, Watchdog.ts, Gatekeeper.ts
- `src/ai/states/OverseerState.ts` -- alongside PatrolState.ts, PursuitState.ts, BlockState.ts
- `src/__tests__/Overseer.test.ts`, `OverseerState.test.ts`, `OverseerConstants.test.ts` -- alongside existing test files
- No new npm dependencies needed
- No new directories needed

### References

- [Source: gdd.md#Enemy Types] -- "Overseer: Coordinator / Elite. Coordinates nearby enemies, buffs attack patterns of surrounding constructs. Priority target. Complex, multi-part construct -- visually distinct, commands attention."
- [Source: gdd.md#Behavioral Evolution] -- "Level 2: Aggressive -- coordinated group attacks. Overseers appear more frequently."
- [Source: gdd.md#Challenge Scaling] -- "Enemy composition: More Overseers and Gatekeepers in later levels; fewer fodder Sentinels"
- [Source: gdd.md#Level 2 Phase 1] -- "All four enemy types, coordinated attacks. More Overseers, group tactics."
- [Source: epics.md#Epic 5 Story 6] -- "As a player, I can fight Overseer enemies that coordinate nearby constructs so that late-game combat has tactical complexity"
- [Source: game-architecture.md#Entity System] -- Enemy hierarchy: Sentinel, Watchdog, Gatekeeper, Overseer
- [Source: game-architecture.md#Enemy AI] -- "State pattern FSM with parameter-driven behavioral evolution via JSON config injection"
- [Source: project-context.md#Architecture Rules] -- "AI states NEVER check level number. All behavioral variation comes from BehaviorParams injected at spawn time from JSON config."

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Overseer geometry uses IcosahedronGeometry(1.0, 0) for center body + 4 BoxGeometry(0.3, 0.3, 0.3) satellites at cardinal offsets. All converted to EdgesGeometry, shared static across instances via the same pattern as Sentinel/Watchdog/Gatekeeper.
- OverseerState stores `_playerPositionGetter` as unused (prefixed with underscore to satisfy noUnusedParameters). The playerPositionGetter is used by AttackState which is created via the factory pattern, not by OverseerState directly.
- OverseerState buff uses squared distance check (`dx*dx + dy*dy + dz*dz <= radius*radius`) to avoid per-frame `Math.sqrt()` calls.
- Buff modifies `enemy.params` directly (spreads original and overrides cooldown/speed). This is intentional -- the buff persists until the enemy dies and gets reset via pool release. No explicit "unbuff" needed.
- LevelBehaviorConfig extended with `overseer` field. Level 1 uses OVERSEER_BEHAVIOR_LEVEL2 as fallback since Overseers don't appear in Level 1 spawn events, but TypeScript requires the config to be complete.
- Two existing tests in LevelManager.level2.test.ts and LevelManager.level3.test.ts needed updating to include 'overseer' in the valid enemy type list for spawn event structure validation.

### Completion Notes List

- Task 1: Added all OVERSEER_* constants (HEALTH=60, SCORE_VALUE=400, COLLIDER_RADIUS=1.8, POOL_SIZE=6, BUFF_RADIUS=15.0, BUFF_COOLDOWN_MULTIPLIER=0.6, BUFF_SPEED_MULTIPLIER=1.3, BUFF_INTERVAL=3.0). Added OVERSEER_BEHAVIOR_LEVEL2 and LEVEL3 BehaviorParams. Extended LevelBehaviorConfig with overseer field. Extended SpawnEvent.enemyType with 'overseer'. Added overseer to all three LEVEL_BEHAVIORS entries. Added 2 Overseer spawns to SPAWN_EVENTS_LEVEL2, 4 to SPAWN_EVENTS_LEVEL3.
- Task 2: Created src/entities/enemies/Overseer.ts. Complex multi-part wireframe: central IcosahedronGeometry + 4 BoxGeometry satellites at cardinal offsets. Shared static geometry/material. Bloom layer enabled on all 5 wireframe children.
- Task 3: Created src/ai/states/OverseerState.ts. Orbit movement at elevated Y (+2.0). Buff timer triggers every OVERSEER_BUFF_INTERVAL seconds. Scans GameObjectManager for active Enemy instances within OVERSEER_BUFF_RADIUS. Applies cooldown * 0.6 and speed * 1.3 buffs. Visual scale pulse 1.0->1.3->1.0 over 0.3s on buff. Attack transition after attackCooldown.
- Task 4: Updated EnemySpawner with overseerPool (ObjectPool<Overseer>, pre-warm OVERSEER_POOL_SIZE=6). Handles 'overseer' spawn type with AI chain: Spawn -> OverseerState -> Attack -> OverseerState. Release on enemyDestroyed. getOverseerPool() accessor. Level behaviors assignment for 'overseer'.
- Task 5: Created Overseer.test.ts (8 tests), OverseerState.test.ts (8 tests), OverseerConstants.test.ts (26 tests). Updated EnemySpawner.test.ts (updated pre-warm count, added 2 overseer pool tests). Updated LevelManager.level2.test.ts and LevelManager.level3.test.ts to include 'overseer' in valid enemy type lists.
- Task 6: `npx tsc --noEmit` passes clean. Full test suite: 1762 tests across 122 files, all pass, zero regressions. Added 44 new tests (8 Overseer + 8 OverseerState + 26 OverseerConstants + 2 EnemySpawner).

### Change Log

- 2026-03-26: Story 5-6 implemented -- Overseer Enemy Type. New coordinator/elite enemy with complex multi-part wireframe geometry (central icosahedron + 4 satellite cubes). OverseerState AI with periodic buff pulse that boosts nearby enemies' attack cooldown and movement speed. Integrated into EnemySpawner with object pool and AI state chain. Level 2 gets 2 Overseers, Level 3 gets 4 Overseers. Extended LevelBehaviorConfig and LEVEL_BEHAVIORS with overseer entries. Added 44 new tests.

### File List

- `src/entities/enemies/Overseer.ts` -- New: Overseer enemy class with complex multi-part wireframe geometry
- `src/ai/states/OverseerState.ts` -- New: Coordinator AI state with buff pulse mechanic
- `src/config/constants.ts` -- Modified: added all OVERSEER_* constants, extended LevelBehaviorConfig/LEVEL_BEHAVIORS/SpawnEvent, added Overseer spawn events to L2/L3
- `src/systems/EnemySpawner.ts` -- Modified: added overseerPool, overseer spawn handling, pool release, getOverseerPool accessor
- `src/__tests__/Overseer.test.ts` -- New: 8 tests for Overseer entity class
- `src/__tests__/OverseerState.test.ts` -- New: 8 tests for OverseerState AI
- `src/__tests__/OverseerConstants.test.ts` -- New: 26 tests for constants and config
- `src/__tests__/EnemySpawner.test.ts` -- Modified: updated pre-warm count test, added 2 overseer pool tests
- `src/__tests__/LevelManager.level2.test.ts` -- Modified: added 'overseer' to valid enemy types in spawn event structure validation
- `src/__tests__/LevelManager.level3.test.ts` -- Modified: added 'overseer' to valid enemy types in spawn event structure validation
