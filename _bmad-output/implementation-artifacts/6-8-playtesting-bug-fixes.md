# Story 6.8: Playtesting Bug Fixes

Status: review

## Story

As a developer,
I want to address bugs found during playtesting,
so that the shipped game is stable and enjoyable.

## Acceptance Criteria

1. **VirusPayloadSystem is wired into main.ts:** The VirusPayloadSystem is instantiated in `main.ts`, added to the game loop `update()` block alongside `dataLanceSystem`, `logicBombSystem`, and `empBurstSystem`, and its `dispose()` is available for cleanup. The Virus Payload weapon (C key) fires during boss vulnerability windows.

2. **Weapon system state resets on new game:** `resetGameState()` in `main.ts` resets all weapon systems for a fresh playthrough:
   - `LogicBombSystem.resetAmmo()` is called to restore ammo to max.
   - `VirusPayloadSystem` internal state is reset (`bossIsDefeated = false`, `bossIsVulnerable = false`, `cooldown = 0`, all in-flight payloads deactivated). A `reset()` method is added to `VirusPayloadSystem`.
   - `EMPBurstSystem` cooldown is reset. A `reset()` method is added to `EMPBurstSystem`.
   - `DataLanceSystem` cooldown is reset and all active bolts are deactivated. A `reset()` method is added to `DataLanceSystem`.

3. **GameObjectManager has a clearAll() method:** `GameObjectManager` exposes a `clearAll()` method that removes all entities from its internal list. `resetGameState()` calls `gameObjectManager.clearAll()` to prevent stale entities from persisting into a new playthrough.

4. **EnemyProjectileSystem resets on new game:** All in-flight enemy projectiles are deactivated on game reset. A `reset()` method is added to `EnemyProjectileSystem`. `resetGameState()` calls `enemyProjectileSystem.reset()`.

5. **EffectsManager resets on new game:** All active visual effects (vector shard explosions) are cleared. A `reset()` method is added to `EffectsManager`. `resetGameState()` calls `effectsManager.reset()`.

6. **RailMovement resets on new game:** Rail progress is reset to 0 for a fresh rail start. A `reset()` method is added to `RailMovement`. `resetGameState()` calls `railMovement.reset()`.

7. **EnemySpawner resets on new game:** `resetGameState()` calls `enemySpawner.resetForNewLevel()` to clear fired event tracking.

8. **Level complete overlay cleanup on reset:** If a "LEVEL COMPLETE" DOM overlay is still visible when `resetGameState()` runs (player died during transition), it is removed. `resetGameState()` removes any `.level-complete-overlay` elements from the DOM.

9. **Running `npx tsc --noEmit` produces zero TypeScript errors.**

10. **Unit tests exist (Vitest) for:**
    - `VirusPayloadSystem` integration in main game loop (instantiation and wiring verification).
    - `DataLanceSystem.reset()` — all bolts deactivated, cooldown cleared.
    - `LogicBombSystem.resetAmmo()` — ammo restored (already tested, verify no regression).
    - `EMPBurstSystem.reset()` — cooldown cleared, active bursts deactivated.
    - `VirusPayloadSystem.reset()` — boss state cleared, cooldown cleared, payloads deactivated.
    - `GameObjectManager.clearAll()` — entity list emptied.
    - `EnemyProjectileSystem.reset()` — all active bursts deactivated.
    - `EffectsManager.reset()` — active effects cleared.
    - `RailMovement.reset()` — progress reset to 0.
    - `resetGameState()` integration test — verifies all systems are reset when returning to menu.

11. **All existing tests continue to pass -- zero regressions.**

## Tasks / Subtasks

- [x] Task 1: Wire VirusPayloadSystem into main.ts (AC: #1)
  - [x] 1.1 Import `VirusPayloadSystem` in `main.ts`.
  - [x] 1.2 Instantiate `VirusPayloadSystem` with `(scene, camera, inputManager, vectorMaterials, cockpitRenderer, gameObjectManager)` alongside other weapon systems.
  - [x] 1.3 Add `virusPayloadSystem.update(dt)` to the gameplay systems block in `gameLoop()`, after `empBurstSystem.update(dt)`.

- [x] Task 2: Add reset() methods to weapon and gameplay systems (AC: #2, #3, #4, #5, #6)
  - [x] 2.1 Add `reset()` to `DataLanceSystem`: deactivate all active bolts (set `active = false`, `mesh.visible = false`), reset `cooldown = 0`.
  - [x] 2.2 Add `reset()` to `EMPBurstSystem`: deactivate all active bursts, reset `cooldown = 0`.
  - [x] 2.3 Add `reset()` to `VirusPayloadSystem`: set `bossIsDefeated = false`, `bossIsVulnerable = false`, `cooldown = 0`, deactivate all in-flight payloads.
  - [x] 2.4 Add `clearAll()` to `GameObjectManager`: set `entities = []`.
  - [x] 2.5 Add `reset()` to `EnemyProjectileSystem`: deactivate all active bursts.
  - [x] 2.6 Add `reset()` to `EffectsManager`: deactivate/release all active effects.
  - [x] 2.7 Add `reset()` to `RailMovement`: set `progress = 0`.

- [x] Task 3: Wire all resets into resetGameState() in main.ts (AC: #2, #3, #4, #5, #6, #7, #8)
  - [x] 3.1 Add `dataLanceSystem.reset()` call.
  - [x] 3.2 Add `logicBombSystem.resetAmmo()` call.
  - [x] 3.3 Add `empBurstSystem.reset()` call.
  - [x] 3.4 Add `virusPayloadSystem.reset()` call.
  - [x] 3.5 Add `gameObjectManager.clearAll()` call.
  - [x] 3.6 Add `enemyProjectileSystem.reset()` call.
  - [x] 3.7 Add `effectsManager.reset()` call.
  - [x] 3.8 Add `railMovement.reset()` call.
  - [x] 3.9 Add `enemySpawner.resetForNewLevel()` call.
  - [x] 3.10 Add level-complete overlay DOM cleanup: `document.querySelectorAll('.level-complete-overlay').forEach(el => el.remove())`.
  - [x] 3.11 Assign the CSS class `level-complete-overlay` to the level complete overlay created in the `levelComplete` event handler.

- [x] Task 4: Write tests (AC: #10, #11)
  - [x] 4.1 Create `src/__tests__/PlaytestingBugFixes.test.ts`:
    - Test `DataLanceSystem.reset()` deactivates all bolts and clears cooldown.
    - Test `EMPBurstSystem.reset()` deactivates all bursts and clears cooldown.
    - Test `VirusPayloadSystem.reset()` clears boss state, cooldown, and deactivates payloads.
    - Test `GameObjectManager.clearAll()` empties entity list.
    - Test `EnemyProjectileSystem.reset()` deactivates all active projectiles.
    - Test `EffectsManager.reset()` clears active effects.
    - Test `RailMovement.reset()` sets progress to 0.
  - [x] 4.2 Run full test suite -- all existing tests + new tests pass.

- [x] Task 5: Type-check and final verification (AC: #9, #11)
  - [x] 5.1 Run `npx tsc --noEmit` -- zero TypeScript errors.
  - [x] 5.2 Run `npx vitest run` -- all tests pass, zero regressions.

## Dev Notes

### Architecture Compliance

- **Systems never import each other** -- reset methods are added to each system individually. `main.ts` calls each reset in `resetGameState()`. [Source: project-context.md#Architecture Rules]
- **Entities never import systems** -- `GameObjectManager.clearAll()` only clears its internal array, no system awareness needed. [Source: project-context.md#Architecture Rules]
- **All weapon systems follow the same pattern** -- pool-based, pre-allocated, with `update(dt)` called each frame from main.ts. [Source: DataLanceSystem.ts, LogicBombSystem.ts, EMPBurstSystem.ts]

### Critical Implementation Rules

- **Use `Logger.info('System', ...)`** for all logging. NEVER `console.log()`. [Source: project-context.md#Critical Don't-Miss Rules]
- **`erasableSyntaxOnly: true`** in tsconfig: Do NOT use `enum`. Use `type` unions and `as const` objects. [Source: tsconfig.json]
- **`verbatimModuleSyntax: true`**: Use `import type { ... }` for type-only imports. [Source: tsconfig.json]
- **No `fetch()` during gameplay frames**: Reset methods are called during `resetGameState()` (menu transition, not gameplay). [Source: project-context.md#Performance Rules]

### What Already Exists (DO NOT recreate)

- `src/systems/DataLanceSystem.ts` -- Pool-based bolt system. Needs `reset()` method added.
- `src/systems/LogicBombSystem.ts` -- Already has `resetAmmo()`. Just needs to be called in resetGameState.
- `src/systems/EMPBurstSystem.ts` -- Pool-based burst system. Needs `reset()` method added.
- `src/systems/VirusPayloadSystem.ts` -- Full class exists but is NEVER instantiated in main.ts. Must wire it up AND add `reset()`.
- `src/entities/GameObjectManager.ts` -- Has add/remove/getAll/update. Needs `clearAll()` added.
- `src/systems/EnemyProjectileSystem.ts` -- Pool-based projectile system. Needs `reset()` method added.
- `src/systems/EffectsManager.ts` -- Effects pool. Needs `reset()` method added.
- `src/systems/RailMovement.ts` -- Rail path follower. Needs `reset()` method added.
- `src/systems/EnemySpawner.ts` -- Already has `resetForNewLevel()`. Just needs to be called.
- `src/main.ts` -- `resetGameState()` function exists. Needs additional reset calls.

### What Must Be Created

- `src/__tests__/PlaytestingBugFixes.test.ts` -- Tests for all new reset methods and VirusPayloadSystem wiring.

### What Must Be Modified

- `src/main.ts` -- Import and instantiate VirusPayloadSystem. Add to game loop. Add all system resets to resetGameState(). Add CSS class to level complete overlay.
- `src/systems/DataLanceSystem.ts` -- Add `reset()` method.
- `src/systems/EMPBurstSystem.ts` -- Add `reset()` method.
- `src/systems/VirusPayloadSystem.ts` -- Add `reset()` method.
- `src/entities/GameObjectManager.ts` -- Add `clearAll()` method.
- `src/systems/EnemyProjectileSystem.ts` -- Add `reset()` method.
- `src/systems/EffectsManager.ts` -- Add `reset()` method.
- `src/systems/RailMovement.ts` -- Add `reset()` method.

### Bug Analysis Summary

**Bug 1: VirusPayloadSystem Not Wired (Critical)**
The `VirusPayloadSystem` class was implemented in Story 3-8 but was never instantiated or wired into `main.ts`. The C key (virusPayload) does nothing during boss fights. The system class, entity, tests, and input mapping all exist correctly -- only the main.ts wiring is missing.

**Bug 2: Weapon State Not Reset Between Playthroughs (High)**
When the player completes a game and returns to menu via `resetGameState()`, the following state persists:
- `VirusPayloadSystem.bossIsDefeated` stays `true` -- virus payload locked forever on 2nd playthrough.
- `LogicBombSystem.ammo` not reset -- player starts with depleted ammo.
- `EMPBurstSystem.cooldown` may be non-zero -- EMP unavailable briefly after reset.
- `DataLanceSystem.cooldown` may be non-zero and active bolts still flying.

**Bug 3: Stale Entities After Reset (Medium)**
`GameObjectManager` has no method to clear all entities. After `levelManager.exit()` exits the current phase, enemies spawned by earlier phases may remain in the entity list, receiving `update()` calls in the next playthrough. Adding `clearAll()` prevents this.

**Bug 4: In-Flight Projectiles Persist (Medium)**
`EnemyProjectileSystem` and `EffectsManager` have no reset methods. Active enemy data bursts and explosion effects from the previous game continue updating into the new playthrough.

**Bug 5: Rail Progress Not Reset (Low)**
`RailMovement.progress` is never reset. The player starts the second playthrough at whatever rail position they were at when the previous game ended.

**Bug 6: Spawner State Not Reset (Low)**
`EnemySpawner.firedEvents` tracks which spawn triggers have fired. Without reset, enemies may not spawn correctly on second playthrough if the rail wraps past already-fired trigger points.

### Existing Code Patterns to Follow

- **Reset method pattern**: Follow `Player.reset()` and `DialogueManager.reset()` -- clear internal state, log the action.
- **System wiring in main.ts**: Follow `empBurstSystem` pattern -- construct with (scene, camera, inputManager, vectorMaterials, cockpitRenderer, gameObjectManager), add `.update(dt)` in the gameplay systems block.
- **Test patterns**: Follow `LogicBombSystem.test.ts` for weapon system reset tests. Mock Three.js objects, verify state changes.

### Previous Story Intelligence (6-7)

- Story 6-7 implemented AudioSettingsManager for localStorage persistence. No bugs introduced.
- 142 test files, 2109 tests all passing.
- Project uses Vitest 4.1.2, TypeScript 5.9.3, Vite 8.0.1, Three.js 0.183.2.

### Scope Boundaries

**IN scope**: Wiring VirusPayloadSystem, adding reset methods to all gameplay systems, wiring resets into resetGameState(), tests for new functionality.

**NOT in scope**:
- New gameplay features or content.
- Audio system changes (handled in 6-7).
- Performance optimization (handled in 6-4).
- Browser compatibility (handled in 6-3).
- Any bugs not related to second-playthrough state or missing system wiring.

### Project Structure Notes

- All modifications align with the existing directory structure.
- No new directories needed.
- No new dependencies needed.
- Single new test file: `src/__tests__/PlaytestingBugFixes.test.ts`.

### References

- [Source: epics.md#Epic 6, Story 8] -- "address bugs found during playtesting so that the shipped game is stable and enjoyable"
- [Source: project-context.md#Architecture Rules] -- Systems never import each other, EventBus communication
- [Source: project-context.md#Performance Rules] -- 60 FPS stable, no GC pauses during gameplay
- [Source: project-context.md#Critical Don't-Miss Rules] -- Logger, no console.log, ObjectPool patterns

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- `npx tsc --noEmit` -- zero errors
- `npx vitest run` -- 143 test files, 2125 tests passed, zero failures

### Completion Notes List

- Task 1: Wired `VirusPayloadSystem` into `main.ts`. Imported the class, instantiated it with all required dependencies (scene, camera, inputManager, vectorMaterials, cockpitRenderer, gameObjectManager), and added `virusPayloadSystem.update(dt)` to the gameplay systems block in the game loop. The Virus Payload weapon (C key) was implemented in Story 3-8 but never wired into the game -- it was completely non-functional. Now fires during boss vulnerability windows as designed.
- Task 2: Added `reset()` methods to 7 gameplay systems: `DataLanceSystem.reset()` (deactivates all bolts, clears cooldown), `EMPBurstSystem.reset()` (deactivates bursts, clears cooldown), `VirusPayloadSystem.reset()` (clears bossIsDefeated/bossIsVulnerable/cooldown, deactivates payloads), `GameObjectManager.clearAll()` (empties entity list), `EnemyProjectileSystem.reset()` (deactivates all active projectiles), `EffectsManager.reset()` (deactivates all explosions, resets pool index), `RailMovement.reset()` (sets progress to 0). Also added `VectorShardExplosion.forceDeactivate()` to support EffectsManager reset.
- Task 3: Wired all system resets into `resetGameState()` in `main.ts`. Added 9 reset calls: dataLanceSystem.reset(), logicBombSystem.resetAmmo(), empBurstSystem.reset(), virusPayloadSystem.reset(), gameObjectManager.clearAll(), enemyProjectileSystem.reset(), effectsManager.reset(), railMovement.reset(), enemySpawner.resetForNewLevel(). Added level-complete overlay DOM cleanup and CSS class assignment. This fixes second-playthrough state corruption where weapon cooldowns, ammo, boss state, stale entities, in-flight projectiles, and rail progress persisted between games.
- Task 4: Created `src/__tests__/PlaytestingBugFixes.test.ts` with 16 tests covering all new reset methods, clearAll, and VirusPayloadSystem wiring verification. All 16 tests pass.
- Task 5: `npx tsc --noEmit` passes clean. Full test suite: 2125 tests across 143 test files, all pass, zero regressions. 16 new tests added.

### Change Log

- 2026-03-26: Story 6-8 implemented -- Playtesting Bug Fixes. Wired VirusPayloadSystem into main.ts (was completely unwired). Added reset() methods to DataLanceSystem, EMPBurstSystem, VirusPayloadSystem, GameObjectManager, EnemyProjectileSystem, EffectsManager, RailMovement, and VectorShardExplosion. Wired all resets into resetGameState() to fix second-playthrough state corruption. Added 16 tests.

### File List

- `src/main.ts` (modified -- imported and wired VirusPayloadSystem, added all system resets to resetGameState, added level-complete-overlay CSS class)
- `src/systems/DataLanceSystem.ts` (modified -- added reset() method)
- `src/systems/EMPBurstSystem.ts` (modified -- added reset() method)
- `src/systems/VirusPayloadSystem.ts` (modified -- added reset() method)
- `src/entities/GameObjectManager.ts` (modified -- added clearAll() method)
- `src/systems/EnemyProjectileSystem.ts` (modified -- added reset() method)
- `src/systems/EffectsManager.ts` (modified -- added reset() method)
- `src/systems/RailMovement.ts` (modified -- added reset() method)
- `src/entities/effects/VectorShardExplosion.ts` (modified -- added forceDeactivate() method)
- `src/__tests__/PlaytestingBugFixes.test.ts` (new -- 16 tests for reset methods and VirusPayloadSystem wiring)
- `_bmad-output/implementation-artifacts/6-8-playtesting-bug-fixes.md` (new -- story file)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified -- status updates)
