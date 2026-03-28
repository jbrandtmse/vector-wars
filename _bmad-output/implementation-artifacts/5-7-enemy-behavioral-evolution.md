# Story 5.7: Enemy Behavioral Evolution

Status: review

## Story

As a player,
I want to experience enemy behavioral evolution across levels,
so that difficulty has narrative justification and each level feels distinctly different.

## Acceptance Criteria

1. **PatrolState uses `movementRandomness`**: In `PatrolState.update()`, when `enemy.getEffectiveParams().movementRandomness > 0`, a random offset is added to the orbit position each frame. The offset magnitude is `movementRandomness * PATROL_RANDOMNESS_SCALE` (new constant, default `1.5`). Uses a deterministic per-enemy noise pattern (seeded from enemy angle) to avoid jittery chaos -- smooth but unpredictable curves. Level 1 (movementRandomness=0.0) has zero offset. Level 2 (0.1) adds slight wobble. Level 3 (0.5) creates erratic, hard-to-predict patrol paths.

2. **PursuitState uses `movementRandomness`**: In `PursuitState.update()`, when `movementRandomness > 0`, a lateral zigzag offset is applied perpendicular to the pursuit direction. The zigzag amplitude is `movementRandomness * PURSUIT_RANDOMNESS_SCALE` (new constant, default `2.0`). Uses `Math.sin(attackTimer * zigzagFrequency)` where `zigzagFrequency` scales with `movementRandomness` (faster randomness = faster direction changes). Level 1 Watchdogs run straight at you. Level 3 Watchdogs weave unpredictably during pursuit.

3. **BlockState uses `movementRandomness`**: In `BlockState.update()`, when `movementRandomness > 0`, additional random sway is added on top of the existing sine-wave sway. The added sway amplitude is `movementRandomness * BLOCK_RANDOMNESS_SCALE` (new constant, default `1.0`). Uses a secondary sine wave at a non-harmonic frequency (e.g., `elapsedTime * 1.7`) to create irregular blocking motion. Level 1 Gatekeepers sway predictably. Level 3 Gatekeepers are harder to shoot past.

4. **OverseerState uses `movementRandomness`**: In `OverseerState.update()`, when `movementRandomness > 0`, the orbit radius varies sinusoidally: `ORBIT_RADIUS + sin(angle * 1.3) * movementRandomness * OVERSEER_RANDOMNESS_SCALE` (new constant, default `1.5`). Creates an irregular, wobbling orbit instead of a perfect circle.

5. **AttackState uses `evasionChance`**: In `AttackState.update()`, after firing, if `Math.random() < enemy.getEffectiveParams().evasionChance`, the enemy enters an `EvadeState` instead of returning to the next patrol/pursuit/block state. If the random check fails, it returns to the normal next state as before. The evasion check uses `getEffectiveParams()` so stunned enemies (with unchanged evasionChance) still evade normally.

6. **EvadeState exists** at `src/ai/states/EvadeState.ts` implementing `AIState`. Behavior:
   - On `enter()`: picks a random evasion direction (perpendicular to line-of-sight to player, with a random Y component).
   - During `update()`: moves the enemy along the evasion direction at `patrolSpeed * EVASION_SPEED_MULTIPLIER` (new constant, default `2.5`) for `EVASION_DURATION` seconds (new constant, default `0.6`).
   - On completion: transitions to the `returnState` (the normal next state -- PatrolState for Sentinels, PursuitState for Watchdogs, etc.).
   - Pre-allocates all temp vectors. No per-frame allocations.

7. **AttackState constructor is updated** to accept an optional `evasionReturnState` parameter. When evasion triggers, enemy transitions to EvadeState with `returnState = evasionReturnState`. When evasion does not trigger, enemy transitions to the existing `nextState`. If `evasionReturnState` is not provided, evasion is disabled (backward compatible).

8. **EnemySpawner wires evasion states**: All AI state chains pass the appropriate return state for evasion:
   - Sentinel: AttackState evasion returns to PatrolState
   - Watchdog: AttackState evasion returns to PursuitState
   - Gatekeeper: AttackState evasion returns to BlockState
   - Overseer: AttackState evasion returns to OverseerState

9. **Visual glitch effect for Level 3** (`movementRandomness >= 0.4`): In `Enemy.update()`, when `enemy.params.movementRandomness >= GLITCH_THRESHOLD` (new constant, default `0.4`), a subtle scale jitter is applied: `1.0 + (Math.random() - 0.5) * GLITCH_SCALE_INTENSITY` (new constant, default `0.06`). This creates a barely-perceptible "digital instability" on Level 3 enemies. The jitter does NOT apply when the enemy is flashing from damage or stunned (those visual effects take priority).

10. **New constants** are defined in `src/config/constants.ts`:
    - `PATROL_RANDOMNESS_SCALE = 1.5`
    - `PURSUIT_RANDOMNESS_SCALE = 2.0`
    - `BLOCK_RANDOMNESS_SCALE = 1.0`
    - `OVERSEER_RANDOMNESS_SCALE = 1.5`
    - `EVASION_SPEED_MULTIPLIER = 2.5`
    - `EVASION_DURATION = 0.6`
    - `GLITCH_THRESHOLD = 0.4`
    - `GLITCH_SCALE_INTENSITY = 0.06`

11. Running `npx tsc --noEmit` produces zero TypeScript errors.

12. Unit tests exist (Vitest) for:
    - PatrolState: movementRandomness=0 produces no offset; movementRandomness>0 produces offset proportional to PATROL_RANDOMNESS_SCALE; orbit still functions correctly with randomness
    - PursuitState: movementRandomness=0 produces straight-line pursuit; movementRandomness>0 adds lateral offset; pursuit still closes distance to player
    - BlockState: movementRandomness=0 matches existing sway only; movementRandomness>0 adds additional irregular sway
    - OverseerState: movementRandomness=0 produces circular orbit; movementRandomness>0 produces varying orbit radius
    - AttackState: evasionChance=0 always returns to nextState; evasionChance=1.0 always returns to EvadeState; evasionReturnState=undefined disables evasion
    - EvadeState: construction with playerPositionGetter and returnState; moves enemy during evasion duration; transitions to returnState after EVASION_DURATION; pre-allocates temp vectors
    - Enemy glitch visual: movementRandomness < GLITCH_THRESHOLD has no jitter; movementRandomness >= GLITCH_THRESHOLD applies scale jitter; jitter disabled during flash or stun
    - Constants: all new constants exist with correct values

13. All existing tests continue to pass -- zero regressions.

## Tasks / Subtasks

- [x] Task 1: Add behavioral evolution constants to `src/config/constants.ts` (AC: #10)
  - [x]1.1 Add `PATROL_RANDOMNESS_SCALE = 1.5`
  - [x]1.2 Add `PURSUIT_RANDOMNESS_SCALE = 2.0`
  - [x]1.3 Add `BLOCK_RANDOMNESS_SCALE = 1.0`
  - [x]1.4 Add `OVERSEER_RANDOMNESS_SCALE = 1.5`
  - [x]1.5 Add `EVASION_SPEED_MULTIPLIER = 2.5`
  - [x]1.6 Add `EVASION_DURATION = 0.6`
  - [x]1.7 Add `GLITCH_THRESHOLD = 0.4`
  - [x]1.8 Add `GLITCH_SCALE_INTENSITY = 0.06`

- [x] Task 2: Create `EvadeState` (AC: #6)
  - [x]2.1 Create `src/ai/states/EvadeState.ts` implementing AIState
  - [x]2.2 Constructor accepts: `playerPositionGetter: () => THREE.Vector3`, `returnState: AIState`
  - [x]2.3 In `enter()`: compute random evasion direction perpendicular to player line-of-sight with random Y offset
  - [x]2.4 In `update()`: move enemy along evasion direction at `patrolSpeed * EVASION_SPEED_MULTIPLIER` for `EVASION_DURATION` seconds
  - [x]2.5 After duration expires: transition to `returnState`
  - [x]2.6 Pre-allocate all temp vectors (evasion direction, temp position, etc.)

- [x] Task 3: Update `AttackState` to support evasion (AC: #5, #7)
  - [x]3.1 Add optional `evasionReturnState: AIState` parameter to `AttackState` constructor
  - [x]3.2 After firing, check `Math.random() < enemy.getEffectiveParams().evasionChance`
  - [x]3.3 If evasion triggers: create EvadeState with `returnState = evasionReturnState`, transition to it
  - [x]3.4 If evasion does not trigger: transition to existing `nextState` as before
  - [x]3.5 If `evasionReturnState` is not provided (undefined): skip evasion check entirely (backward compatible)

- [x] Task 4: Update `PatrolState` with `movementRandomness` (AC: #1)
  - [x]4.1 Import `PATROL_RANDOMNESS_SCALE` from constants
  - [x]4.2 In `update()`: read `movementRandomness` from `enemy.getEffectiveParams()`
  - [x]4.3 If `movementRandomness > 0`: compute smooth noise offset using `Math.sin(angle * 2.3) * Math.cos(angle * 1.7)` pattern scaled by `movementRandomness * PATROL_RANDOMNESS_SCALE`
  - [x]4.4 Add offset to both X and Z orbit positions; add a smaller Y offset

- [x] Task 5: Update `PursuitState` with `movementRandomness` (AC: #2)
  - [x]5.1 Import `PURSUIT_RANDOMNESS_SCALE` from constants
  - [x]5.2 In `update()`: read `movementRandomness` from `enemy.getEffectiveParams()`
  - [x]5.3 If `movementRandomness > 0` and beyond engagement distance: compute lateral offset perpendicular to pursuit direction using `Math.sin(attackTimer * (3.0 + movementRandomness * 4.0)) * movementRandomness * PURSUIT_RANDOMNESS_SCALE`
  - [x]5.4 Add lateral offset to movement; pre-allocate perpendicular vector

- [x] Task 6: Update `BlockState` with `movementRandomness` (AC: #3)
  - [x]6.1 Import `BLOCK_RANDOMNESS_SCALE` from constants
  - [x]6.2 In `update()`: read `movementRandomness` from `enemy.getEffectiveParams()`
  - [x]6.3 Add secondary irregular sway: `Math.sin(elapsedTime * PI * 2 * 1.7) * movementRandomness * BLOCK_RANDOMNESS_SCALE` to existing sway calculation

- [x] Task 7: Update `OverseerState` with `movementRandomness` (AC: #4)
  - [x]7.1 Import `OVERSEER_RANDOMNESS_SCALE` from constants
  - [x]7.2 In `update()`: read `movementRandomness` from `enemy.getEffectiveParams()`
  - [x]7.3 Vary orbit radius: `ORBIT_RADIUS + Math.sin(angle * 1.3) * movementRandomness * OVERSEER_RANDOMNESS_SCALE`

- [x] Task 8: Update `EnemySpawner` to wire evasion states (AC: #8)
  - [x]8.1 Import EvadeState
  - [x]8.2 For Sentinel: pass `evasionReturnState` creating a new PatrolState to AttackState constructor
  - [x]8.3 For Watchdog: pass `evasionReturnState` creating a new PursuitState to AttackState constructor
  - [x]8.4 For Gatekeeper: pass `evasionReturnState` creating a new BlockState to AttackState constructor
  - [x]8.5 For Overseer: pass `evasionReturnState` creating a new OverseerState to AttackState constructor

- [x] Task 9: Add visual glitch effect to `Enemy.update()` (AC: #9)
  - [x]9.1 Import `GLITCH_THRESHOLD` and `GLITCH_SCALE_INTENSITY` from constants
  - [x]9.2 In `update()`, after flash/stun processing: if `this.params.movementRandomness >= GLITCH_THRESHOLD` and not flashing and not stunned, apply scale jitter `1.0 + (Math.random() - 0.5) * GLITCH_SCALE_INTENSITY`
  - [x]9.3 Ensure flash and stun visual effects take priority (already gated by flashTimer/stunTimer checks)

- [x] Task 10: Write tests (AC: #12, #13)
  - [x]10.1 Create `src/__tests__/EvadeState.test.ts` -- construction, movement during evasion, transition after EVASION_DURATION, pre-allocated vectors
  - [x]10.2 Create `src/__tests__/BehavioralEvolution.test.ts` -- PatrolState randomness, PursuitState randomness, BlockState randomness, OverseerState randomness, AttackState evasion logic, Enemy glitch visual
  - [x]10.3 Create `src/__tests__/BehavioralEvolutionConstants.test.ts` -- all new constants with correct values
  - [x]10.4 Verify all existing tests still pass

- [x] Task 11: Build verification (AC: #11, #13)
  - [x]11.1 Run `npx tsc --noEmit` -- zero TypeScript errors
  - [x]11.2 Run `npm run test` -- all tests pass, zero regressions

## Dev Notes

### Architecture Compliance

- **Entities never import systems.** Enemy.ts reads params but never imports EnemySpawner, CollisionSystem, etc. [Source: project-context.md#Architecture Rules]
- **Systems never import each other.** EvadeState receives playerPositionGetter via constructor injection. [Source: project-context.md#Architecture Rules]
- **AI states NEVER check level number.** ALL behavioral variation comes from `BehaviorParams` (`movementRandomness`, `evasionChance`) injected at spawn time. No `if (level === 3)` conditionals anywhere. [Source: project-context.md#Architecture Rules]
- **NEVER create materials directly.** No new materials needed for this story. [Source: project-context.md#Critical Implementation Rules]
- **All vector geometry must enable bloom layer.** No new geometry in this story. [Source: project-context.md#Critical Implementation Rules]
- **Use `Logger.info/warn/error()`** -- NEVER `console.log()`. [Source: project-context.md#Critical Don't-Miss Rules]
- **`erasableSyntaxOnly: true`**: No `enum`. Use `type` unions and `as const` objects. [Source: tsconfig.json]
- **`verbatimModuleSyntax: true`**: Use `import type { ... }` for type-only imports. [Source: tsconfig.json]
- **No per-frame allocations.** EvadeState must pre-allocate temp vectors. Noise calculations must not allocate. [Source: project-context.md#Performance Rules]
- **Delta time cap:** `Math.min(dt, 1/20)` already handled by game loop. [Source: project-context.md#Performance Rules]

### Critical Implementation Rules

- **`movementRandomness` is read via `enemy.getEffectiveParams()`** (not `enemy.params` directly). This ensures stunned enemies get slow-factor applied to patrolSpeed while randomness still functions.
- **`evasionChance` is read via `enemy.getEffectiveParams()`**. During stun, evasionChance is unchanged so enemies can still evade, but their movement speed is reduced making the evasion less effective.
- **EvadeState is a transient state.** It lasts `EVASION_DURATION` (0.6s) then returns to the normal patrol/pursuit/block/overseer state. It does NOT loop or chain.
- **AttackState backward compatibility.** When `evasionReturnState` is `undefined`, the evasion check is skipped entirely. This preserves all existing AI chain behavior. Boss attacks and other non-evasion attack states continue working.
- **Glitch visual threshold.** Only enemies with `movementRandomness >= 0.4` show glitch jitter. This maps to Level 3 enemies (all have 0.5) and some Level 2 enemies (Overseers at 0.1 do NOT glitch). The threshold prevents visual noise on Level 1 enemies.
- **Glitch jitter uses `Math.random()`.** This is a per-frame visual effect on enemy scale, not a gameplay-affecting calculation. The tiny cost is acceptable for the visual payoff. Not deterministic and that is intentional -- digital instability should look random.

### Existing Code Patterns to Follow

- **PatrolState.ts** at `src/ai/states/` -- Already has orbit math. Add randomness offset to existing position calculations.
- **PursuitState.ts** at `src/ai/states/` -- Already has pursuit + orbit. Add lateral zigzag to pursuit phase.
- **BlockState.ts** at `src/ai/states/` -- Already has sine-wave sway. Add secondary irregular sway on top.
- **OverseerState.ts** at `src/ai/states/` -- Already has orbit. Vary the radius.
- **AttackState.ts** at `src/ai/states/` -- Fire-and-transition pattern. Add optional evasion branch.
- **EnemySpawner.ts** at `src/systems/` -- Already wires all AI state chains. Pass evasion return states.
- **Enemy.ts** at `src/entities/enemies/` -- Already has flash and stun visual logic in update(). Add glitch effect after those checks.

### What Already Exists (DO NOT recreate)

- `src/ai/BehaviorParams.ts` -- `evasionChance` and `movementRandomness` fields already defined. DO NOT MODIFY.
- `src/config/constants.ts` -- All per-level `BehaviorParams` already have correct Level 2/3 values for `evasionChance` and `movementRandomness`. DO NOT change these values.
- `src/entities/enemies/Enemy.ts` -- Base class with `getEffectiveParams()`, `params`, `flashTimer`, `stunTimer`. MODIFY ONLY to add glitch visual in `update()`.
- `src/ai/AIState.ts` -- AIState interface. DO NOT MODIFY.
- `src/ai/states/SpawnState.ts` -- Spawn animation state. DO NOT MODIFY.
- `src/ai/states/DestroyedState.ts` -- Destroyed state. DO NOT MODIFY.
- `src/core/ObjectPool.ts` -- Generic pool. DO NOT MODIFY.
- `src/core/GameEvents.ts` -- Event definitions. DO NOT MODIFY (no new events needed).
- `src/rendering/VectorMaterials.ts` -- Material registry. DO NOT MODIFY.
- `src/entities/GameObjectManager.ts` -- Active entity list. DO NOT MODIFY.

### What Must Be Created

- `src/ai/states/EvadeState.ts` -- Evasion AI state (move perpendicular to player LOS briefly)
- `src/__tests__/EvadeState.test.ts` -- EvadeState unit tests
- `src/__tests__/BehavioralEvolution.test.ts` -- Integration tests for all randomness/evasion behavior
- `src/__tests__/BehavioralEvolutionConstants.test.ts` -- Constants validation tests

### What Must Be Modified

- `src/config/constants.ts` -- Add 8 new behavioral evolution constants
- `src/ai/states/PatrolState.ts` -- Add movementRandomness offset to orbit
- `src/ai/states/PursuitState.ts` -- Add movementRandomness zigzag to pursuit
- `src/ai/states/BlockState.ts` -- Add movementRandomness irregular sway
- `src/ai/states/OverseerState.ts` -- Add movementRandomness to orbit radius
- `src/ai/states/AttackState.ts` -- Add optional evasionReturnState parameter and evasion check
- `src/systems/EnemySpawner.ts` -- Wire evasion return states for all enemy types
- `src/entities/enemies/Enemy.ts` -- Add glitch scale jitter in update()

### Behavioral Evolution Summary

| Level | movementRandomness | evasionChance | Patrol Feel | Combat Feel | Visual |
|-------|-------------------|---------------|-------------|-------------|--------|
| 1 | 0.0 | 0.0 | Perfect circles | Fire & return, no dodging | Clean, stable |
| 2 | 0.1 | 0.2 | Slight wobble | Occasional dodge after firing | Clean, stable |
| 3 | 0.5 | 0.5 | Erratic, hard to predict | 50% dodge after firing | Glitch jitter |

### Scope Boundaries

**IN scope**: movementRandomness in PatrolState/PursuitState/BlockState/OverseerState, evasionChance in AttackState, EvadeState, glitch visual effect, constants, EnemySpawner evasion wiring, tests.

**NOT in scope** (future stories):
- Handler voice escalation -- Story 5-8
- Briefing screens for all levels -- Story 5-9
- Ending sequence -- Story 5-10
- High score table -- Story 5-11
- Cyberspace fragmentation ending -- Story 5-12

### Previous Story Intelligence

From Story 5-6 (Overseer Enemy Type):
- Test count after Story 5-6: 1762 tests across 122 files.
- OverseerState stores `_playerPositionGetter` as unused (prefixed with underscore). The playerPositionGetter is used by AttackState created via factory pattern.
- OverseerState buff uses squared distance check to avoid per-frame Math.sqrt().
- Buff modifies `enemy.params` directly -- spreads original and overrides cooldown/speed.
- `erasableSyntaxOnly: true` -- No enums. Use type unions and `as const` objects.
- `verbatimModuleSyntax: true` -- Use `import type { ... }` for type-only imports.

From Story 3-1 (Watchdog Enemy Type):
- PursuitState pattern: constructor injection, no system imports, pre-allocated temp vectors.
- Shared geometry/material pattern validated across all enemy types.

From Story 3-2 (Gatekeeper Enemy Type):
- BlockState already has lateral sway using sine wave. New randomness sway is additive on top.

### Project Structure Notes

- `src/ai/states/EvadeState.ts` -- alongside PatrolState.ts, PursuitState.ts, BlockState.ts, OverseerState.ts
- `src/__tests__/EvadeState.test.ts`, `BehavioralEvolution.test.ts`, `BehavioralEvolutionConstants.test.ts` -- alongside existing test files
- No new npm dependencies needed
- No new directories needed

### References

- [Source: gdd.md#Behavioral Evolution] -- "Level 1: Mechanical -- predictable. Level 2: Aggressive -- faster, coordinated. Level 3: Glitchy -- randomized, evasion, erratic, visual glitch effects."
- [Source: gdd.md#Challenge Scaling] -- "Enemy behavior evolution: Mechanical (Level 1) -> Aggressive (Level 2) -> Glitchy/Unpredictable (Level 3)"
- [Source: gdd.md#Level 3 Phase 1] -- "Glitchy enemies, erratic behavior, evasion"
- [Source: epics.md#Epic 5 Story 7] -- "As a player, I can experience enemy behavioral evolution across levels so that difficulty has narrative justification"
- [Source: game-architecture.md#Enemy AI] -- "Behavioral evolution via parameters: patrolSpeed, attackCooldown, evasionChance, movementRandomness"
- [Source: game-architecture.md#Enemy AI Table] -- Level 3 movementRandomness: 0.5, evasionChance: 0.5
- [Source: project-context.md#Architecture Rules] -- "AI states NEVER check level number. All behavioral variation comes from BehaviorParams."

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- PatrolState randomness uses multi-frequency sine pattern: `sin(angle*2.3)*cos(angle*1.7)` and `cos(angle*1.9)*sin(angle*2.7)` scaled by `movementRandomness * PATROL_RANDOMNESS_SCALE`. This creates smooth but unpredictable wobble without per-frame allocations.
- PursuitState zigzag uses perpendicular vector to pursuit direction in XZ plane (`-direction.z, 0, direction.x`). Zigzag frequency scales with movementRandomness: `3.0 + movementRandomness * 4.0`, so Level 3 enemies change direction more frequently.
- BlockState adds secondary sine wave at non-harmonic frequency (`elapsedTime * PI * 2 * 1.7`) on top of existing sway. The 1.7 frequency avoids harmonics with the base GATEKEEPER_SWAY_FREQUENCY (0.6).
- OverseerState varies orbit radius using `sin(angle * 1.3) * movementRandomness * OVERSEER_RANDOMNESS_SCALE`. The 1.3 multiplier creates radius variation at a different frequency than the orbit itself.
- AttackState evasion check: `if (evasionReturnState !== undefined && evasionChance > 0 && Math.random() < evasionChance)`. Three guards ensure backward compatibility: undefined evasionReturnState skips check, zero evasionChance skips check, random roll determines outcome.
- EvadeState picks evasion direction perpendicular to line-of-sight by crossing toPlayer with world up (or world forward if toPlayer is nearly vertical). Random flip and Y offset add variety.
- Glitch visual uses `Math.random()` per frame for scale jitter. This is intentionally non-deterministic for authentic "digital instability" feel. Only activates when `movementRandomness >= GLITCH_THRESHOLD (0.4)`.
- Glitch jitter is applied BEFORE AI state update in Enemy.update(), gated by flashTimer and stunTimer checks (flash/stun visuals take priority).

### Completion Notes List

- Task 1: Added 8 behavioral evolution constants to constants.ts: PATROL_RANDOMNESS_SCALE=1.5, PURSUIT_RANDOMNESS_SCALE=2.0, BLOCK_RANDOMNESS_SCALE=1.0, OVERSEER_RANDOMNESS_SCALE=1.5, EVASION_SPEED_MULTIPLIER=2.5, EVASION_DURATION=0.6, GLITCH_THRESHOLD=0.4, GLITCH_SCALE_INTENSITY=0.06.
- Task 2: Created src/ai/states/EvadeState.ts. Computes random perpendicular evasion direction on enter(), moves enemy at patrolSpeed * EVASION_SPEED_MULTIPLIER for EVASION_DURATION seconds, then transitions to returnState. Pre-allocated temp vectors.
- Task 3: Updated AttackState with optional evasionReturnState parameter. After firing, checks Math.random() < evasionChance and transitions to new EvadeState if triggered. Backward compatible: undefined evasionReturnState skips evasion entirely.
- Task 4: Updated PatrolState with movementRandomness. Multi-frequency sine/cosine noise pattern adds smooth wobble to orbit positions when movementRandomness > 0. Zero randomness produces identical behavior to before.
- Task 5: Updated PursuitState with movementRandomness. Lateral zigzag perpendicular to pursuit direction. Zigzag frequency and amplitude scale with movementRandomness. Zero randomness produces straight-line pursuit as before.
- Task 6: Updated BlockState with movementRandomness. Secondary sine wave at non-harmonic frequency (1.7) adds irregular sway on top of existing GATEKEEPER_SWAY_FREQUENCY. Zero randomness preserves original blocking behavior.
- Task 7: Updated OverseerState with movementRandomness. Orbit radius varies sinusoidally with movementRandomness * OVERSEER_RANDOMNESS_SCALE. Zero randomness produces constant-radius circular orbit as before.
- Task 8: Updated EnemySpawner to wire evasion return states for all 4 enemy types. Each AttackState now receives an evasionReturnState that creates a new instance of the appropriate patrol/pursuit/block/overseer state.
- Task 9: Added visual glitch jitter to Enemy.update(). When params.movementRandomness >= GLITCH_THRESHOLD (0.4) and not flashing/stunned, applies random scale jitter of magnitude GLITCH_SCALE_INTENSITY (0.06). Only Level 3 enemies (movementRandomness=0.5) trigger this.
- Task 10: Created 3 test files: EvadeState.test.ts (7 tests), BehavioralEvolution.test.ts (18 tests), BehavioralEvolutionConstants.test.ts (20 tests). Total: 45 new tests.
- Task 11: `npx tsc --noEmit` passes clean. Full test suite: 1807 tests across 125 files, all pass, zero regressions. Added 45 new tests.

### Change Log

- 2026-03-26: Story 5-7 implemented -- Enemy Behavioral Evolution. Made movementRandomness and evasionChance BehaviorParams actually drive AI behavior across all 4 AI states (PatrolState, PursuitState, BlockState, OverseerState). Created EvadeState for post-attack evasion. Added visual glitch jitter for Level 3 enemies. Wired evasion return states in EnemySpawner for all enemy types. Added 45 new tests.

### File List

- `src/config/constants.ts` -- Modified: added 8 behavioral evolution constants (PATROL_RANDOMNESS_SCALE, PURSUIT_RANDOMNESS_SCALE, BLOCK_RANDOMNESS_SCALE, OVERSEER_RANDOMNESS_SCALE, EVASION_SPEED_MULTIPLIER, EVASION_DURATION, GLITCH_THRESHOLD, GLITCH_SCALE_INTENSITY)
- `src/ai/states/EvadeState.ts` -- New: evasion AI state with perpendicular movement and return-to-state
- `src/ai/states/AttackState.ts` -- Modified: added optional evasionReturnState parameter and evasion check
- `src/ai/states/PatrolState.ts` -- Modified: added movementRandomness offset to orbit
- `src/ai/states/PursuitState.ts` -- Modified: added movementRandomness zigzag to pursuit
- `src/ai/states/BlockState.ts` -- Modified: added movementRandomness irregular sway
- `src/ai/states/OverseerState.ts` -- Modified: added movementRandomness orbit radius variation
- `src/systems/EnemySpawner.ts` -- Modified: wired evasion return states for all 4 enemy types
- `src/entities/enemies/Enemy.ts` -- Modified: added glitch scale jitter visual for Level 3 enemies
- `src/__tests__/EvadeState.test.ts` -- New: 7 tests for EvadeState
- `src/__tests__/BehavioralEvolution.test.ts` -- New: 18 tests for behavioral evolution across all states
- `src/__tests__/BehavioralEvolutionConstants.test.ts` -- New: 20 tests for constants validation
