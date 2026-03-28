# Story 5.1: Level 2 — Amber Palette

Status: review

## Story

As a player,
I want to play through Level 2 with an amber palette and aggressive enemies,
so that the campaign escalates in challenge and visual progression reinforces my descent deeper into cyberspace.

## Acceptance Criteria

1. The `LevelManager` supports multi-level progression. After Level 1's boss is defeated and `levelComplete` fires, the game transitions to Level 2 (instead of showing the "LEVEL COMPLETE" placeholder screen). `LevelManager` accepts a `levelNumber` parameter and configures phases accordingly.

2. When Level 2 begins, `vectorMaterials.setPalette('amber')` is called, changing all registered vector materials to the amber palette (hue 0.11). All Three.js rendered geometry — cockpit, HUD, grid, starfield, enemies, projectiles, effects — shifts to amber tones. The palette is set during `LevelManager.enter()` for Level 2 before any phase begins.

3. HTML/CSS UI elements (CommOverlay, BriefingScreen, GameOverScreen, TutorialPrompt, and the level-complete overlay in main.ts) update their hardcoded `#00ff41` green colors to reflect the active palette. A shared `PaletteColors` utility at `src/rendering/PaletteColors.ts` provides CSS color/glow strings derived from the active `ColorPalette`, so all HTML elements can query the current palette's CSS values.

4. Level 2 enemy behavior parameters are defined in `src/config/constants.ts` as `SENTINEL_BEHAVIOR_LEVEL2`, `WATCHDOG_BEHAVIOR_LEVEL2`, and `GATEKEEPER_BEHAVIOR_LEVEL2`. Values reflect the "Aggressive" profile from the architecture: faster patrol speeds (1.5x), shorter attack cooldowns (~60% of Level 1), 20% evasion chance, 10% movement randomness. The `EnemySpawner` accepts a `BehaviorParams` override per enemy type for the current level.

5. Level 2 has its own spawn event definitions (`SPAWN_EVENTS_LEVEL2` in constants.ts) with higher enemy counts, more Watchdog and Gatekeeper spawns, and coordinated group attacks (enemies spawning in clusters at the same rail progress point). Total enemy count is ~40% higher than Level 1.

6. Level 2 has its own surface phase targets (`SURFACE_TARGETS_LEVEL2` in constants.ts) with more firewall nodes, more ICE towers, and tighter placement. Total surface target count is ~30% higher than Level 1.

7. Level 2 has its own corridor obstacle configuration (`CORRIDOR_OBSTACLES_LEVEL2` in constants.ts) with denser obstacles, tighter timing windows, and crossing data streams. Total obstacle count is ~30% higher than Level 1.

8. A Level 2 briefing JSON file exists at `assets/briefings/level-2.json` with narrative content matching Act 2 — "Retaliation" from the narrative design: the AI network has flagged the jockey, The Avenger awaits, the handler's tone shifts from professional to invested.

9. Level 2 dialogue entries exist in `assets/dialogue/handler.json` (new entries for Level 2 phases, triggered by `phaseStart` with `level: 2`). At minimum: dogfight start, surface approach, corridor entry, and boss encounter lines. Voice audio fields follow the existing pattern (e.g., `"audio": "handler_l2_dogfight_start"`).

10. The `LevelManager.enter()` method is parameterized: it accepts level number and configures the correct palette, behavior params, spawn events, surface targets, corridor obstacles, and briefing data for that level. Phase classes receive level-specific config where needed.

11. The `SurfacePhase`, `CorridorPhase`, and `DogfightPhase` constructors (or enter methods) accept level-specific configurations rather than importing hardcoded Level 1 constants directly. This enables per-level tuning without conditional `if (level === 2)` checks.

12. After defeating the Level 1 boss, a briefing screen for Level 2 displays before Level 2 gameplay begins. The existing `BriefingPhase` is reused with Level 2 briefing data.

13. After Level 2's boss phase completes, `levelComplete` fires with `{ level: 2 }`. The level-complete overlay displays (placeholder until Level 3 / Story 5-3).

14. Running `npm run build` produces a clean production build with zero TypeScript errors.

15. Unit tests exist (Vitest) for:
    - `LevelManager` multi-level: enter with level 2 sets amber palette, creates correct phase sequence, fires events with `level: 2`
    - `PaletteColors` utility: returns correct CSS hex/glow for each palette
    - Level 2 behavior params: values are more aggressive than Level 1
    - Level 2 spawn events: contain valid structure, higher counts than Level 1
    - Palette integration: `vectorMaterials.setPalette('amber')` updates all materials

16. All existing tests continue to pass — zero regressions.

## Tasks / Subtasks

- [x] Task 1: Create PaletteColors utility for CSS palette coordination (AC: #3)
  - [x] 1.1 Create `src/rendering/PaletteColors.ts` with `getPaletteCSSColor(): string` and `getPaletteCSSGlow(): string` functions that derive CSS hex color and text-shadow/box-shadow values from the active `ColorPalette`
  - [x] 1.2 Export palette-to-CSS mapping: green -> `#00ff41` / amber -> `#ffb000` / red -> `#ff2020`
  - [x] 1.3 Export `getPaletteHexColor()` returning the hex string for the current palette

- [x] Task 2: Define Level 2 constants (AC: #4, #5, #6, #7)
  - [x] 2.1 Add `SENTINEL_BEHAVIOR_LEVEL2`, `WATCHDOG_BEHAVIOR_LEVEL2`, `GATEKEEPER_BEHAVIOR_LEVEL2` to `src/config/constants.ts` with aggressive profile values
  - [x] 2.2 Add `SPAWN_EVENTS_LEVEL2` to constants.ts — more enemies, more Watchdogs/Gatekeepers, cluster spawns
  - [x] 2.3 Add `SURFACE_TARGETS_LEVEL2` to constants.ts — more nodes, more ICE towers
  - [x] 2.4 Add `CORRIDOR_OBSTACLES_LEVEL2` to constants.ts — denser obstacles, crossing data streams
  - [x] 2.5 Add Level 2 rail path points for dogfight, surface, and corridor (reuse Level 1 paths -- same geometry, different enemies)

- [x] Task 3: Parameterize LevelManager for multi-level support (AC: #1, #2, #10, #12, #13)
  - [x] 3.1 Add `private currentLevel: number` field and `startLevel(level: number)` method to LevelManager
  - [x] 3.2 In `enter()` / `startLevel()`, call `vectorMaterials.setPalette()` with the level's palette name (`'green'` for 1, `'amber'` for 2)
  - [x] 3.3 Pass level-specific spawn events, behavior params, surface targets, and corridor obstacles to phase constructors
  - [x] 3.4 Load the correct briefing data for the current level (from `assets/briefings/level-{n}.json`)
  - [x] 3.5 Emit all phase/level events with the correct `level` number
  - [x] 3.6 On `levelComplete` for Level 1, show inter-level briefing then start Level 2

- [x] Task 4: Parameterize phase classes for level-specific config (AC: #11)
  - [x] 4.1 Update `DogfightPhase` to accept spawn events and behavior params as constructor args (not import from constants) -- DogfightPhase uses EnemySpawner which was parameterized instead
  - [x] 4.2 Update `SurfacePhase` to accept surface target list as constructor arg
  - [x] 4.3 Update `CorridorPhase` to accept obstacle config list as constructor arg
  - [x] 4.4 Update `EnemySpawner` to accept per-level behavior params override for each enemy type

- [x] Task 5: Update HTML/CSS UI elements for palette awareness (AC: #3)
  - [x] 5.1 Update `CommOverlay` to use `PaletteColors` instead of hardcoded `#00ff41`
  - [x] 5.2 Update `BriefingScreen` to use `PaletteColors`
  - [x] 5.3 Update `GameOverScreen` to use `PaletteColors`
  - [x] 5.4 Update `TutorialPrompt` to use `PaletteColors`
  - [x] 5.5 Update level-complete overlay in `main.ts` to use `PaletteColors`

- [x] Task 6: Create Level 2 content assets (AC: #8, #9)
  - [x] 6.1 Create `assets/briefings/level-2.json` with Act 2 "Retaliation" briefing content
  - [x] 6.2 Add Level 2 handler dialogue entries to `assets/dialogue/handler.json` (triggered by `phaseStart` with `level: 2`)
  - [x] 6.3 Add voice manifest entries for Level 2 handler dialogue to `public/audio/manifest.json`
  - [x] 6.4 Add Level 2 voice line definitions to `src/audio/VoiceLineGenerator.ts`

- [x] Task 7: Wire Level 1 -> Level 2 transition in main.ts (AC: #1, #12, #13)
  - [x] 7.1 Replace the placeholder `levelComplete` handler in main.ts with logic that starts Level 2 when Level 1 completes
  - [x] 7.2 Show Level 2 briefing screen between levels
  - [x] 7.3 Reset game systems (clear enemies, reset spawner) between levels while preserving score

- [x] Task 8: Write tests (AC: #15, #16)
  - [x] 8.1 Create `src/__tests__/PaletteColors.test.ts`: correct CSS colors for green/amber/red
  - [x] 8.2 Create `src/__tests__/LevelManager.level2.test.ts`: multi-level progression, palette setting, event level numbers
  - [x] 8.3 Add Level 2 behavior params validation tests to existing or new test file
  - [x] 8.4 Add Level 2 spawn events structure validation tests

- [x] Task 9: Build verification (AC: #14, #16)
  - [x] 9.1 Run `npx tsc --noEmit` — zero TypeScript errors
  - [x] 9.2 Run `npm run test` — all tests pass, zero regressions

## Dev Notes

### Architecture Compliance

- **VectorMaterials.setPalette()** is the ONLY way to change colors globally. Never set material colors directly. [Source: project-context.md#Critical Implementation Rules, game-architecture.md#Color Depth System]
- **Color Depth System pattern**: `LevelManager` reads palette name -> calls `ColorPalette.setActive()` via `VectorMaterials.setPalette()` -> all materials update automatically. [Source: game-architecture.md#Novel Patterns > Color Depth System]
- **AI never checks level number**: All behavioral variation from `BehaviorParams` injected at spawn time. No `if (level === 2)` in any AI state. [Source: project-context.md#Architecture Rules]
- **Systems never import each other**: LevelManager passes config to phases via constructor args. Phases don't import LevelManager. [Source: project-context.md#Architecture Rules]
- **Entities through factory + ObjectPool**: Enemy spawning still uses ObjectPool.acquire(). Behavior params are applied after acquisition. [Source: project-context.md#Architecture Rules]
- **No fetch() during gameplay**: Level config and briefing JSON loaded during `enter()` (async OK there). [Source: project-context.md#Performance Rules]

### Critical Implementation Rules

- **Use `Logger.info/warn/error()`** — NEVER `console.log()`. [Source: project-context.md#Critical Don't-Miss Rules]
- **`erasableSyntaxOnly: true`**: No `enum`. Use `type` unions and `as const` objects. [Source: tsconfig.json]
- **`verbatimModuleSyntax: true`**: Use `import type { ... }` for type-only imports. [Source: tsconfig.json]
- **No raw `new LineBasicMaterial()`**: Always `VectorMaterials.create()`. [Source: project-context.md#Critical Don't-Miss Rules]
- **Delta time cap**: `Math.min(dt, 1/20)` — already handled by DeltaTime module.
- **Pre-warm pools at phase enter()**: All ObjectPool.acquire() calls happen in enter(), not during gameplay update().

### Existing Code Patterns to Follow

- **LevelManager** currently hardcodes Level 1 only. The `enter()` method creates phases directly. Refactor to accept `levelNumber` and select config sets. Current approach: phases are constructed with system references. Keep this — just add config params.
- **EnemySpawner** reads from `SPAWN_EVENTS` constant. Refactor to accept spawn events as a parameter rather than importing the constant directly. This allows per-level spawn configs.
- **Phase classes** (DogfightPhase, SurfacePhase, CorridorPhase) import constants directly for their configs. Refactor to accept configs as constructor parameters.
- **BriefingPhase** already accepts `BriefingData` — no changes needed to the phase itself. Just load different JSON.
- **CommOverlay.setSpeaker()** already has dynamic color logic for different speakers. Extend this pattern for palette-aware base colors.
- **All events** already carry `level: number` — this is critical for dialogue triggers. Level 2 handler lines will trigger on `phaseStart` with `level: 2`.

### What Already Exists (DO NOT recreate)

- `src/rendering/ColorPalette.ts` — PALETTES, getActivePalette(), setActivePalette(). DO NOT MODIFY.
- `src/rendering/VectorMaterials.ts` — setPalette() updates all materials. DO NOT MODIFY.
- `src/systems/LevelManager.ts` — Currently Level 1 only. MODIFY to support multi-level.
- `src/systems/EnemySpawner.ts` — Currently imports SPAWN_EVENTS directly. MODIFY to accept spawn events as parameter.
- `src/state/phases/DogfightPhase.ts` — MODIFY to accept level config.
- `src/state/phases/SurfacePhase.ts` — MODIFY to accept surface targets as parameter.
- `src/state/phases/CorridorPhase.ts` — MODIFY to accept corridor obstacles as parameter.
- `src/state/phases/BossPhase.ts` — Reused for Level 2 with the Gatekeeper boss (The Avenger boss is Story 5-2). For now, Level 2 boss uses the same GatekeeperBoss class as a placeholder.
- `src/state/phases/BriefingPhase.ts` — Reused with different data. DO NOT MODIFY.
- `src/state/phases/TutorialPhase.ts` — Only runs in Level 1. DO NOT MODIFY.
- `src/ui/screens/CommOverlay.ts` — MODIFY to use PaletteColors.
- `src/ui/screens/BriefingScreen.ts` — MODIFY to use PaletteColors.
- `src/ui/screens/GameOverScreen.ts` — MODIFY to use PaletteColors.
- `src/ui/screens/TutorialPrompt.ts` — MODIFY to use PaletteColors (though tutorial only runs in Level 1/green).
- `src/main.ts` — MODIFY: replace level-complete placeholder, add Level 2 briefing loading, wire level transitions.
- `src/config/constants.ts` — MODIFY: add Level 2 constants.
- `assets/dialogue/handler.json` — MODIFY: add Level 2 handler lines.
- `public/audio/manifest.json` — MODIFY: add Level 2 voice entries.
- `src/audio/VoiceLineGenerator.ts` — MODIFY: add Level 2 voice line definitions.
- `src/ai/BehaviorParams.ts` — DO NOT MODIFY. Interface is already correct.

### What Must Be Created

- `src/rendering/PaletteColors.ts` — CSS color/glow utility derived from ColorPalette
- `src/__tests__/PaletteColors.test.ts` — Tests for PaletteColors utility
- `src/__tests__/LevelManager.level2.test.ts` — Tests for multi-level LevelManager
- `assets/briefings/level-2.json` — Level 2 briefing content

### Level 2 Design Specifications

**Palette:** Amber (hue: 0.11, saturation: 1.0, lightness: 0.5)
- CSS hex approximation: `#ffb000` (warm amber glow)
- Text shadow: `0 0 10px #ffb000, 0 0 20px #ffb000`

**Enemy Behavior — "Aggressive" Profile:**
| Parameter | Level 1 (Mechanical) | Level 2 (Aggressive) |
|-----------|---------------------|---------------------|
| Sentinel patrolSpeed | 1.0 | 1.5 |
| Sentinel attackCooldown | 2.0s | 1.2s |
| Watchdog patrolSpeed | 1.5 | 2.25 |
| Watchdog attackCooldown | 1.5s | 0.9s |
| Gatekeeper patrolSpeed | 0.8 | 1.2 |
| Gatekeeper attackCooldown | 2.5s | 1.5s |
| All evasionChance | 0.0 | 0.2 |
| All movementRandomness | 0.0 | 0.1 |

**Phase Structure:** Briefing -> Dogfight -> Surface -> Corridor -> Boss
- No tutorial in Level 2 (tutorial only runs once in Level 1)

### Scope Boundaries

**IN scope**: Multi-level LevelManager, amber palette activation, Level 2 behavior params, Level 2 spawn/surface/corridor configs, Level 2 briefing, Level 2 handler dialogue, PaletteColors CSS utility, HTML UI palette awareness, Level 1->2 transition, tests.

**NOT in scope** (future stories):
- The Avenger boss — Story 5-2. Level 2 boss uses GatekeeperBoss as placeholder.
- Level 3 — Story 5-3
- Color palette progression system (animated transitions between palettes) — Story 5-5
- Overseer enemy type — Story 5-6
- Enemy behavioral evolution system — Story 5-7
- Handler voice escalation — Story 5-8
- Avenger/Core Intelligence voice profiles — Story 5-2, 5-4

### Previous Story Intelligence

From Epic 4 (Stories 4-1 through 4-9):
- DialogueManager triggers on `phaseStart`, `bossHealthBelow50`, etc. with `level` field. Level 2 dialogue lines must use `level: 2` in trigger conditions.
- VoiceLineGenerator uses handler profile for all handler lines. Level 2 lines use the same profile — voice escalation is Story 5-8.
- Test count after Epic 4: 1527 tests across 113 files.
- CommOverlay.setSpeaker() has dynamic color support — base the palette-aware color system on this pattern.

From Epic 3 (Stories 3-1 through 3-10):
- Phase transition system works via PhaseTransition fade-out/fade-in.
- BossPhase creates a GatekeeperBoss. For Level 2, temporarily reuse this until Story 5-2 adds The Avenger.
- SurfacePhase reads SURFACE_TARGETS and SURFACE_RAIL_PATH_POINTS from constants. Refactor to accept as params.
- CorridorPhase reads CORRIDOR_OBSTACLES and CORRIDOR_RAIL_PATH_POINTS from constants. Refactor to accept as params.
- DogfightPhase uses RailMovement which reads RAIL_PATH_POINTS. May need per-level path support.

### Project Structure Notes

- All new files align with the architecture's directory structure
- `PaletteColors.ts` at `src/rendering/PaletteColors.ts` — alongside ColorPalette.ts and VectorMaterials.ts
- `level-2.json` at `assets/briefings/level-2.json` — alongside level-1.json
- No new npm dependencies needed
- No new directories needed

### References

- [Source: gdd.md#Color Palette] — "Green → Amber → Red" depth-based color system
- [Source: gdd.md#Per-Level Design] — Level 2 amber palette, aggressive enemies, all four enemy types, coordinated attacks
- [Source: gdd.md#Behavioral Evolution] — Level 2 "Aggressive": faster movement, shorter cooldowns, coordinated group attacks
- [Source: gdd.md#Difficulty Scaling] — "Color palette escalation: Green (outer/safe) → Amber (mid/caution) → Red (deep core/danger)"
- [Source: game-architecture.md#Color Depth System] — Centralized palette pattern with VectorMaterials registry
- [Source: game-architecture.md#Enemy AI] — BehaviorParams table with Level 1/2/3 values
- [Source: game-architecture.md#Level/Phase System] — "JSON config per level defines: palette, spawns, obstacles"
- [Source: epics.md#Epic 5, Story 1] — "play through Level 2 with amber palette and aggressive enemies"
- [Source: narrative-design.md#Act 2] — "Retaliation" act, AI network retaliates, amber glow signals danger
- [Source: project-context.md#Architecture Rules] — VectorMaterials.setPalette(), no per-object color management

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- LevelManager.startLevel() calls vectorMaterials.setPalette() with the level's palette name before building phases. All registered materials update to amber (hue 0.11) for Level 2.
- EnemySpawner now has setSpawnEvents(), setLevelBehaviors(), and resetForNewLevel() methods. Level 2 spawns use SPAWN_EVENTS_LEVEL2 (38 enemies vs ~20 in Level 1). Behavior params are applied to enemy.params after ObjectPool.acquire() -- no level conditionals in AI code.
- SurfacePhase and CorridorPhase accept optional config params in constructors, defaulting to Level 1 constants. Level 2 passes SURFACE_TARGETS_LEVEL2 (20 targets) and CORRIDOR_OBSTACLES_LEVEL2 (20 obstacles).
- HTML UI elements (CommOverlay, BriefingScreen, GameOverScreen, TutorialPrompt) now use PaletteColors utility instead of hardcoded #00ff41. Colors dynamically reflect the active palette.
- Level 1 -> Level 2 transition: levelComplete handler in main.ts shows "LEVEL COMPLETE / PRESS SPACE TO CONTINUE", then calls levelManager.exit() and levelManager.startLevel(2). Score is preserved across levels.
- Level 2 boss uses GatekeeperBoss as placeholder (The Avenger boss is Story 5-2).
- Level 2 reuses Level 1 rail paths (same geometry, different enemies/obstacles). Separate rail paths can be added later.

### Completion Notes List

- Task 1: Created `src/rendering/PaletteColors.ts` with getPaletteHexColor(), getPaletteHexForName(), getPaletteCSSGlow(), getPaletteCSSMultiGlow(). Maps green->#00ff41, amber->#ffb000, red->#ff2020.
- Task 2: Added Level 2 constants to `src/config/constants.ts`: 3 behavior params (aggressive profile), SPAWN_EVENTS_LEVEL2 (38 enemies), SURFACE_TARGETS_LEVEL2 (20 targets), CORRIDOR_OBSTACLES_LEVEL2 (20 obstacles), LEVEL_PALETTES, LEVEL_BEHAVIORS, LevelBehaviorConfig interface.
- Task 3: Refactored `src/systems/LevelManager.ts` for multi-level. Added startLevel(level), currentLevel tracking, buildLevel1Phases/buildLevelPhases, setBriefingData(data, level) with Map-based storage. Level 2 has no tutorial phase.
- Task 4: Parameterized SurfacePhase (surfaceTargets, railPathPoints), CorridorPhase (corridorObstacles, corridorRailPathPoints), EnemySpawner (setSpawnEvents, setLevelBehaviors, per-enemy params applied on spawn).
- Task 5: Updated CommOverlay, BriefingScreen, GameOverScreen, TutorialPrompt, and main.ts level-complete overlay to use PaletteColors instead of hardcoded #00ff41 green.
- Task 6: Created `assets/briefings/level-2.json` (Act 2 "Retaliation" content), added 5 Level 2 handler dialogue entries to handler.json, added 5 voice manifest entries, added 5 voice line definitions to VoiceLineGenerator.
- Task 7: Replaced placeholder levelComplete handler in main.ts with multi-level transition logic. Level 1 complete shows overlay then starts Level 2; Level 2 complete shows victory overlay.
- Task 8: Created PaletteColors.test.ts (10 tests), LevelManager.level2.test.ts (21 tests). Updated LevelManager.test.ts mocks for setPalette/setSpawnEvents/setLevelBehaviors. Updated VoiceLineGenerator.test.ts counts from 27 to 32.
- Task 9: `npx tsc --noEmit` passes clean. Full test suite: 1560 tests across 115 files, all pass, zero regressions.

### Change Log

- 2026-03-26: Story 5-1 implemented -- Level 2 Amber Palette. Multi-level LevelManager, amber palette activation, aggressive enemy behaviors, Level 2 spawn/surface/corridor configs, Level 2 briefing and handler dialogue, PaletteColors CSS utility, palette-aware HTML UI, Level 1->2 transition. Added 31 new tests.

### File List

- `src/rendering/PaletteColors.ts` -- New: CSS color/glow utility for palette-aware HTML elements
- `src/config/constants.ts` -- Modified: added Level 2 behavior params, spawn events, surface targets, corridor obstacles, LEVEL_PALETTES, LEVEL_BEHAVIORS, LevelBehaviorConfig
- `src/systems/LevelManager.ts` -- Modified: multi-level support with startLevel(), currentLevel, per-level palette/config, briefingDataMap
- `src/systems/EnemySpawner.ts` -- Modified: added setSpawnEvents(), setLevelBehaviors(), resetForNewLevel(), per-enemy params on spawn
- `src/state/phases/SurfacePhase.ts` -- Modified: accept optional surfaceTargets and railPathPoints constructor params
- `src/state/phases/CorridorPhase.ts` -- Modified: accept optional corridorObstacles and corridorRailPathPoints constructor params
- `src/ui/screens/CommOverlay.ts` -- Modified: use PaletteColors instead of hardcoded #00ff41
- `src/ui/screens/BriefingScreen.ts` -- Modified: use PaletteColors instead of hardcoded #00ff41
- `src/ui/screens/GameOverScreen.ts` -- Modified: use PaletteColors instead of hardcoded #00ff41
- `src/ui/screens/TutorialPrompt.ts` -- Modified: use PaletteColors instead of hardcoded #00ff41
- `src/main.ts` -- Modified: multi-level levelComplete handler, Level 2 briefing loading, PaletteColors import
- `src/audio/VoiceLineGenerator.ts` -- Modified: added 5 Level 2 handler voice line definitions
- `assets/briefings/level-2.json` -- New: Level 2 briefing content ("Retaliation" act)
- `assets/dialogue/handler.json` -- Modified: added 5 Level 2 handler dialogue entries
- `public/audio/manifest.json` -- Modified: added 5 Level 2 voice manifest entries
- `src/__tests__/PaletteColors.test.ts` -- New: 10 tests for PaletteColors utility
- `src/__tests__/LevelManager.level2.test.ts` -- New: 21 tests for Level 2 constants and config validation
- `src/__tests__/LevelManager.test.ts` -- Modified: updated mock to include setPalette, setSpawnEvents, setLevelBehaviors
- `src/__tests__/VoiceLineGenerator.test.ts` -- Modified: updated voice line counts from 27 to 32
