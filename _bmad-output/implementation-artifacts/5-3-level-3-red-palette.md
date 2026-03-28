# Story 5.3: Level 3 — Red Palette

Status: review

## Story

As a player,
I want to play through Level 3 with a red palette and glitchy enemies,
so that the final level feels dangerous and intense, completing the campaign's visual and difficulty escalation.

## Acceptance Criteria

1. `LEVEL_PALETTES` in `src/config/constants.ts` includes `3: 'red'`. When Level 3 begins, `vectorMaterials.setPalette('red')` is called, changing all registered vector materials to the red palette (hue 0.0). All Three.js rendered geometry — cockpit, HUD, grid, starfield, enemies, projectiles, effects — shifts to red tones. HTML/CSS UI elements update via `PaletteColors` automatically (already wired in Story 5-1).

2. Level 3 enemy behavior parameters are defined in `src/config/constants.ts` as `SENTINEL_BEHAVIOR_LEVEL3`, `WATCHDOG_BEHAVIOR_LEVEL3`, and `GATEKEEPER_BEHAVIOR_LEVEL3`. Values reflect the "Glitchy" profile from the architecture: randomized patrol speeds (1.0-2.0 via random range), randomized attack cooldowns (0.5-1.5s), 0.5 evasion chance, 0.5 movement randomness. Attack damage and projectile speed escalate beyond Level 2.

3. Level 3 has its own spawn event definitions (`SPAWN_EVENTS_LEVEL3` in constants.ts) with the highest enemy counts of all levels, heavy Gatekeeper and Overseer presence, fewer fodder Sentinels, and large coordinated clusters. Total enemy count is ~40% higher than Level 2 (~50+ enemies).

4. Level 3 has its own surface phase targets (`SURFACE_TARGETS_LEVEL3` in constants.ts) with maximum firewall nodes, dense ICE towers, and heavy Gatekeeper enemy escorts. Total surface target count is ~30% higher than Level 2.

5. Level 3 has its own corridor obstacle configuration (`CORRIDOR_OBSTACLES_LEVEL3` in constants.ts) with maximum obstacle density, tightest timing windows, rapid-fire obstacles, and minimal reaction time. Total obstacle count is ~30% higher than Level 2.

6. `LEVEL_BEHAVIORS` in constants.ts includes a Level 3 entry mapping sentinel/watchdog/gatekeeper to their Level 3 behavior params. `LEVEL_SPAWN_EVENTS`, `LEVEL_SURFACE_TARGETS`, and `LEVEL_CORRIDOR_OBSTACLES` maps in `LevelManager.ts` include Level 3 entries.

7. A Level 3 briefing JSON file exists at `assets/briefings/level-3.json` with narrative content matching Act 3 — "Collapse" from the narrative design: point of no return, no extraction plan, the deep core, Ghost's composure cracks, desperate but committed.

8. Level 3 handler dialogue entries exist in `assets/dialogue/handler.json` (new entries for Level 3 phases, triggered by `phaseStart` with level 3). At minimum: dogfight start, surface approach, corridor entry, boss encounter, and level complete lines. Voice audio fields follow existing pattern (e.g., `"audio": "handler_l3_dogfight_start"`). Tone: desperate, raw, refusing to abandon Cipher.

9. The `levelComplete` handler in `main.ts` is updated: when Level 2 completes (`level === 2`), instead of showing a victory/restart screen, it shows the "LEVEL COMPLETE" overlay then starts Level 3 (same pattern as Level 1 -> Level 2 transition). When Level 3 completes, show the placeholder victory/restart screen (until Story 5-10 ending sequence).

10. `LevelManager` creates the correct phase sequence for Level 3: Briefing -> Dogfight -> Surface -> Corridor -> Boss. Uses `buildLevelPhases()` (same as Level 2). Boss uses a placeholder (GatekeeperBoss or AvengerBoss factory) until Story 5-4 adds CoreIntelligenceBoss.

11. `LEVEL_BOSS_FACTORIES` in `LevelManager.ts` includes a Level 3 entry. Use `GatekeeperBoss` as placeholder boss (consistent with how Level 2 used GatekeeperBoss as placeholder before Story 5-2 added AvengerBoss).

12. Running `npm run build` produces a clean production build with zero TypeScript errors.

13. Unit tests exist (Vitest) for:
    - Level 3 behavior params: values reflect "Glitchy" profile, more extreme than Level 2
    - Level 3 spawn events: valid structure, higher counts than Level 2
    - Level 3 surface targets: valid structure, higher counts than Level 2
    - Level 3 corridor obstacles: valid structure, higher counts than Level 2
    - `LEVEL_PALETTES[3]` equals `'red'`
    - `LEVEL_BEHAVIORS[3]` contains all three enemy type entries
    - LevelManager Level 3: `startLevel(3)` sets red palette, creates correct phase sequence, fires events with `level: 3`
    - Level 2 -> Level 3 transition: levelComplete with level 2 triggers Level 3 start

14. All existing tests continue to pass — zero regressions.

## Tasks / Subtasks

- [x] Task 1: Define Level 3 constants (AC: #1, #2, #3, #4, #5, #6)
  - [x]1.1 Add `3: 'red'` to `LEVEL_PALETTES` in `src/config/constants.ts`
  - [x]1.2 Add `SENTINEL_BEHAVIOR_LEVEL3`, `WATCHDOG_BEHAVIOR_LEVEL3`, `GATEKEEPER_BEHAVIOR_LEVEL3` with "Glitchy" profile values
  - [x]1.3 Add Level 3 entry to `LEVEL_BEHAVIORS` map
  - [x]1.4 Add `SPAWN_EVENTS_LEVEL3` — highest enemy counts, heavy Gatekeeper/Overseer presence, large clusters
  - [x]1.5 Add `SURFACE_TARGETS_LEVEL3` — maximum density, ICE towers, heavy defenses
  - [x]1.6 Add `CORRIDOR_OBSTACLES_LEVEL3` — maximum density, tightest timing, rapid-fire obstacles

- [x] Task 2: Wire Level 3 configs into LevelManager (AC: #6, #10, #11)
  - [x]2.1 Add Level 3 entry to `LEVEL_SPAWN_EVENTS` map in LevelManager.ts (import `SPAWN_EVENTS_LEVEL3`)
  - [x]2.2 Add Level 3 entry to `LEVEL_SURFACE_TARGETS` map (import `SURFACE_TARGETS_LEVEL3`)
  - [x]2.3 Add Level 3 entry to `LEVEL_CORRIDOR_OBSTACLES` map (import `CORRIDOR_OBSTACLES_LEVEL3`)
  - [x]2.4 Add Level 3 entry to `LEVEL_BOSS_FACTORIES` — use `GatekeeperBoss` as placeholder
  - [x]2.5 Import `SPAWN_EVENTS_LEVEL3`, `SURFACE_TARGETS_LEVEL3`, `CORRIDOR_OBSTACLES_LEVEL3` from constants

- [x] Task 3: Update levelComplete handler in main.ts for Level 2 -> 3 transition (AC: #9)
  - [x]3.1 Change the `level < 2` condition to `level < 3` so Level 2 completion triggers next-level flow
  - [x]3.2 Update the Level 2 transition to call `levelManager.startLevel(3)` when `level === 2`
  - [x]3.3 Keep the victory/restart screen for Level 3+ (placeholder until Story 5-10)
  - [x]3.4 Update overlay text for Level 2 complete — "DEEP CORE ACCESS GRANTED" or similar

- [x] Task 4: Create Level 3 content assets (AC: #7, #8)
  - [x]4.1 Create `assets/briefings/level-3.json` with Act 3 "Collapse" briefing content — point of no return, no extraction, Ghost's composure cracks
  - [x]4.2 Add Level 3 handler dialogue entries to `assets/dialogue/handler.json` (triggered by `phaseStart` with level 3): dogfight, surface, corridor, boss, level complete
  - [x]4.3 Add voice manifest entries for Level 3 handler dialogue to `public/audio/manifest.json`
  - [x]4.4 Add Level 3 voice line definitions to `src/audio/VoiceLineGenerator.ts`

- [x] Task 5: Load Level 3 briefing data in main.ts (AC: #10)
  - [x]5.1 Add `level-3.json` to the briefing data fetch in main.ts (alongside level-1 and level-2)
  - [x]5.2 Call `levelManager.setBriefingData(data, 3)` with the loaded data

- [x] Task 6: Write tests (AC: #13, #14)
  - [x]6.1 Add Level 3 behavior params validation tests — glitchy values more extreme than Level 2
  - [x]6.2 Add Level 3 spawn events structure validation tests — higher counts than Level 2
  - [x]6.3 Add Level 3 surface targets and corridor obstacles validation tests
  - [x]6.4 Add `LEVEL_PALETTES[3] === 'red'` test
  - [x]6.5 Add `LEVEL_BEHAVIORS[3]` completeness test
  - [x]6.6 Add LevelManager Level 3 tests: startLevel(3) sets red palette, correct phase count, event level numbers
  - [x]6.7 Add VoiceLineGenerator tests for Level 3 handler voice line definitions

- [x] Task 7: Build verification (AC: #12, #14)
  - [x]7.1 Run `npx tsc --noEmit` — zero TypeScript errors
  - [x]7.2 Run `npm run test` — all tests pass, zero regressions

## Dev Notes

### Architecture Compliance

- **VectorMaterials.setPalette()** is the ONLY way to change colors globally. Never set material colors directly. [Source: project-context.md#Critical Implementation Rules, game-architecture.md#Color Depth System]
- **Color Depth System pattern**: `LevelManager` reads palette name -> calls `vectorMaterials.setPalette()` -> all materials update automatically. Already working for green/amber. Red palette (hue 0.0) is already defined in `ColorPalette.ts` PALETTES. [Source: game-architecture.md#Novel Patterns > Color Depth System]
- **AI never checks level number**: All behavioral variation from `BehaviorParams` injected at spawn time. No `if (level === 3)` in any AI state. [Source: project-context.md#Architecture Rules]
- **Systems never import each other**: LevelManager passes config to phases via constructor args. [Source: project-context.md#Architecture Rules]
- **Entities through factory + ObjectPool**: Enemy spawning uses ObjectPool.acquire(). Behavior params applied after acquisition. [Source: project-context.md#Architecture Rules]
- **No fetch() during gameplay**: Level config and briefing JSON loaded during `enter()`. [Source: project-context.md#Performance Rules]

### Critical Implementation Rules

- **Use `Logger.info/warn/error()`** — NEVER `console.log()`. [Source: project-context.md#Critical Don't-Miss Rules]
- **`erasableSyntaxOnly: true`**: No `enum`. Use `type` unions and `as const` objects. [Source: tsconfig.json]
- **`verbatimModuleSyntax: true`**: Use `import type { ... }` for type-only imports. [Source: tsconfig.json]
- **No raw `new LineBasicMaterial()`**: Always `VectorMaterials.create()`. [Source: project-context.md#Critical Don't-Miss Rules]
- **Delta time cap**: `Math.min(dt, 1/20)` — already handled by DeltaTime module.
- **Pre-warm pools at phase enter()**: All ObjectPool.acquire() calls happen in enter(), not during gameplay update().

### Existing Code Patterns to Follow

- **Level 2 implementation (Story 5-1)** is the direct template. Level 3 follows the exact same pattern: define constants in constants.ts, add to LEVEL_* maps in LevelManager.ts, update main.ts levelComplete handler, create briefing JSON, add handler dialogue entries, add voice definitions.
- **LevelManager.startLevel()** already handles arbitrary level numbers. The `buildLevelPhases()` method works for any level >= 2. No LevelManager structural changes needed — just adding data.
- **EnemySpawner** already reads from `LEVEL_SPAWN_EVENTS` and `LEVEL_BEHAVIORS` per level. Just add Level 3 entries.
- **PaletteColors** utility already maps `'red'` -> `#ff2020` with CSS glow strings. HTML UI elements automatically pick up the red palette.
- **main.ts levelComplete handler** currently uses `level < 2` to trigger Level 2 transition. Change condition to `level < 3` and add Level 2 -> Level 3 case.

### What Already Exists (DO NOT recreate)

- `src/rendering/ColorPalette.ts` — PALETTES includes `red` (hue: 0.0). DO NOT MODIFY.
- `src/rendering/VectorMaterials.ts` — setPalette('red') already works. DO NOT MODIFY.
- `src/rendering/PaletteColors.ts` — Maps red->#ff2020. DO NOT MODIFY.
- `src/systems/LevelManager.ts` — Multi-level support already built. MODIFY: add Level 3 to data maps and boss factory.
- `src/systems/EnemySpawner.ts` — Parameterized for per-level configs. DO NOT MODIFY.
- `src/state/phases/*.ts` — All phase classes parameterized for per-level config. DO NOT MODIFY.
- `src/narrative/DialogueTypes.ts` — Already has `'coreIntelligence'` in speaker union. DO NOT MODIFY.
- `src/narrative/DialogueManager.ts` — Already handles any speaker. DO NOT MODIFY.
- `src/ui/screens/CommOverlay.ts` — Already palette-aware via PaletteColors. DO NOT MODIFY.
- `src/ui/screens/BriefingScreen.ts` — Already palette-aware. DO NOT MODIFY.
- `src/ui/screens/GameOverScreen.ts` — Already palette-aware. DO NOT MODIFY.
- `src/config/constants.ts` — MODIFY: add Level 3 constants and LEVEL_* entries.
- `src/main.ts` — MODIFY: update levelComplete handler, load Level 3 briefing.
- `assets/dialogue/handler.json` — MODIFY: add Level 3 handler lines.
- `public/audio/manifest.json` — MODIFY: add Level 3 voice entries.
- `src/audio/VoiceLineGenerator.ts` — MODIFY: add Level 3 handler voice definitions.

### What Must Be Created

- `assets/briefings/level-3.json` — Level 3 briefing content
- Tests for Level 3 constants and configurations (add to existing test files or create new)

### Level 3 Design Specifications

**Palette:** Red (hue: 0.0, saturation: 1.0, lightness: 0.5)
- CSS hex: `#ff2020` (hot danger red)
- Text shadow: `0 0 10px #ff2020, 0 0 20px #ff2020`

**Enemy Behavior — "Glitchy" Profile:**
| Parameter | Level 1 (Mechanical) | Level 2 (Aggressive) | Level 3 (Glitchy) |
|-----------|---------------------|---------------------|-------------------|
| Sentinel patrolSpeed | 1.0 | 1.5 | 1.5 (+ 0.5 randomness) |
| Sentinel attackCooldown | 2.0s | 1.2s | 0.8s (+ 0.5 randomness) |
| Watchdog patrolSpeed | 1.5 | 2.25 | 2.5 (+ 0.5 randomness) |
| Watchdog attackCooldown | 1.5s | 0.9s | 0.6s (+ 0.5 randomness) |
| Gatekeeper patrolSpeed | 0.8 | 1.2 | 1.5 (+ 0.5 randomness) |
| Gatekeeper attackCooldown | 2.5s | 1.5s | 1.0s (+ 0.5 randomness) |
| All evasionChance | 0.0 | 0.2 | 0.5 |
| All movementRandomness | 0.0 | 0.1 | 0.5 |

**Note on Glitchy behavior:** The `movementRandomness` of 0.5 is what creates the "glitchy, erratic" movement described in the GDD. The AI states already use `movementRandomness` to add random offsets to patrol positions. High evasionChance (0.5) makes enemies dodge incoming fire unpredictably. Attack damage and projectile speed should escalate beyond Level 2 values.

**Phase Structure:** Briefing -> Dogfight -> Surface -> Corridor -> Boss
- No tutorial in Level 3 (tutorial only runs once in Level 1)

**Narrative Context — Act 3 "Collapse":**
- Briefing: Point of no return. Ghost is honest: this might be a one-way trip. No extraction protocol for core depth. Ghost's voice cracks for the first time. She commits to staying on comms the whole way.
- Dogfight: Red-tinted hostile cyberspace. Everything glitches. Enemies are erratic, unpredictable. Handler is desperate but pushing forward.
- Surface: Massive fortress, final defenses. Most challenging surface run.
- Corridor: Fastest corridor, maximum obstacle density. Peak survival challenge.
- Boss: Placeholder until Story 5-4 (CoreIntelligenceBoss). Use GatekeeperBoss as temporary stand-in.
- Level complete: Placeholder victory screen until Story 5-10 (ending sequence).

**Handler Dialogue Lines for Level 3 (Act 3 tone — desperate, raw, refusing to lose another jockey):**
1. Dogfight start: "The red deep. We're in the core now. Everything here wants you dead, Cipher."
2. Surface approach: "Final fortress. The Core Intelligence's last line of defense. Hit everything."
3. Corridor entry: "Fastest corridor yet. I can barely track you. Don't stop. Don't stop."
4. Boss encounter: "Massive construct. That's... that's the Core Intelligence. Cipher, be careful."
5. Level complete: "You did it. You actually... Cipher, you need to get out. NOW."

### Scope Boundaries

**IN scope**: Red palette activation via LEVEL_PALETTES, Level 3 Glitchy behavior params, Level 3 spawn/surface/corridor configs, Level 3 briefing, Level 3 handler dialogue + voice definitions, Level 2 -> Level 3 transition in main.ts, Level 3 data wired into LevelManager, placeholder boss, tests.

**NOT in scope** (future stories):
- The Core Intelligence boss — Story 5-4. Level 3 boss uses GatekeeperBoss as placeholder.
- Color palette progression animation (animated transitions between palettes) — Story 5-5
- Overseer enemy type — Story 5-6
- Enemy behavioral evolution system — Story 5-7
- Handler voice escalation (audio degradation across levels) — Story 5-8
- Briefing screens for all levels — Story 5-9 (this story creates Level 3 briefing content only)
- Ending sequence — Story 5-10

### Previous Story Intelligence

From Story 5-2 (The Avenger Boss):
- BossPhase refactored with factory pattern. LEVEL_BOSS_FACTORIES map exists — just add Level 3 entry.
- Boss base class has abstract `dispose()`. GatekeeperBoss implements it.
- BossPhaseChangedEvent.phase union includes 'rush' for Avenger.
- Test count after Story 5-2: 1611 tests across 116 files.

From Story 5-1 (Level 2 — Amber Palette):
- LevelManager supports multi-level via `startLevel(level)`. `buildLevelPhases()` works for any level >= 2.
- PaletteColors utility maps all three palettes including red.
- All HTML UI elements already use PaletteColors — automatic red support.
- LEVEL_PALETTES, LEVEL_BEHAVIORS, LEVEL_SPAWN_EVENTS maps in LevelManager already have Level 1 and 2 entries. Just add Level 3.
- main.ts levelComplete handler has Level 1 -> Level 2 transition. Level 2+ shows placeholder. Need to add Level 2 -> Level 3 case.
- EnemySpawner.setSpawnEvents(), setLevelBehaviors() already parameterized.
- Briefing data loaded via fetch() in main.ts init and passed to LevelManager.setBriefingData().

### Project Structure Notes

- All new files align with the architecture's directory structure
- `level-3.json` at `assets/briefings/level-3.json` — alongside level-1.json and level-2.json
- No new npm dependencies needed
- No new directories needed
- No new source files needed (only `level-3.json` asset file is new)

### References

- [Source: gdd.md#Color Palette] — "Green -> Amber -> Red" depth-based color system, Red = Deep core / danger / final zone
- [Source: gdd.md#Per-Level Design] — Level 3 red palette, glitchy enemies, erratic behavior, evasion, maximum enemy variety
- [Source: gdd.md#Behavioral Evolution] — Level 3 "Glitchy": randomized patterns, evasion behavior, erratic movement
- [Source: gdd.md#Difficulty Scaling] — Level 3: "Intense" baseline, "Glitchy" enemies, Core Intelligence boss
- [Source: game-architecture.md#Enemy AI] — BehaviorParams table with Level 3 Glitchy values: patrolSpeed 1.0-2.0, attackCooldown 0.5-1.5s, evasionChance 0.5, movementRandomness 0.5
- [Source: game-architecture.md#Color Depth System] — Centralized palette pattern with VectorMaterials registry
- [Source: game-architecture.md#Level/Phase System] — "JSON config per level defines: palette, spawns, obstacles"
- [Source: epics.md#Epic 5, Story 3] — "play through Level 3 with red palette and glitchy enemies"
- [Source: narrative-design.md#Act 3] — "Collapse" act, AI's inner sanctum, hostile red cyberspace, point of no return
- [Source: narrative-design.md#Key Conversation 8] — "Point of No Return" briefing — no extraction protocol, Ghost's voice cracks
- [Source: narrative-design.md#The Deep Core] — Red heart of the network, fractal geometry, environment glitches, Core Intelligence's domain
- [Source: project-context.md#Architecture Rules] — VectorMaterials.setPalette(), no per-object color management, AI states never check level number

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- LEVEL_PALETTES already had `3: 'red'` from Story 5-1. No modification needed for palette mapping.
- Level 3 behavior params define the "Glitchy" profile: evasionChance 0.5, movementRandomness 0.5 for all enemy types. Attack cooldowns shorter than Level 2, damage and projectile speeds higher. The high movementRandomness creates erratic, unpredictable movement in AI states.
- Level 3 spawn events: 65 total enemies (29 sentinels, 23 watchdogs, 13 gatekeepers) -- 71% increase over Level 2's 38.
- Level 3 surface targets: 27 total (16 firewall nodes, 11 ICE towers) -- 35% increase over Level 2's 20.
- Level 3 corridor obstacles: 27 total (8 firewalls, 6 network cables, 8 data streams) -- 35% increase over Level 2's 20.
- LevelManager data maps (LEVEL_SPAWN_EVENTS, LEVEL_SURFACE_TARGETS, LEVEL_CORRIDOR_OBSTACLES, LEVEL_BOSS_FACTORIES) all include Level 3 entries. Level 3 boss uses GatekeeperBoss as placeholder until Story 5-4.
- main.ts levelComplete handler updated: `level < 3` triggers next-level transition (Level 1->2 and Level 2->3). Level 2 complete shows "DEEP CORE ACCESS GRANTED" subtitle. Level 3+ shows "MISSION COMPLETE" victory screen.
- Level 3 briefing content follows Act 3 "Collapse" narrative: point of no return, no extraction protocol, Ghost's composure breaking, desperate commitment.
- 5 Level 3 handler dialogue entries added to handler.json with desperate, raw tone matching Act 3 narrative.
- 5 voice line definitions added to VoiceLineGenerator using HANDLER_PROFILE (same profile, voice escalation is Story 5-8).

### Completion Notes List

- Task 1: Added Level 3 "Glitchy" behavior params to `src/config/constants.ts`: SENTINEL_BEHAVIOR_LEVEL3, WATCHDOG_BEHAVIOR_LEVEL3, GATEKEEPER_BEHAVIOR_LEVEL3. Added Level 3 entry to LEVEL_BEHAVIORS. Added SPAWN_EVENTS_LEVEL3 (65 enemies), SURFACE_TARGETS_LEVEL3 (27 targets), CORRIDOR_OBSTACLES_LEVEL3 (27 obstacles). LEVEL_PALETTES already had `3: 'red'`.
- Task 2: Added Level 3 entries to all LevelManager data maps: LEVEL_SPAWN_EVENTS, LEVEL_SURFACE_TARGETS, LEVEL_CORRIDOR_OBSTACLES, LEVEL_BOSS_FACTORIES (GatekeeperBoss placeholder). Added imports for Level 3 constants.
- Task 3: Updated main.ts levelComplete handler. Changed condition from `level < 2` to `level < 3` so both Level 1 and Level 2 completion trigger next-level flow. Level 2 subtitle: "DEEP CORE ACCESS GRANTED". Level 3+ shows "MISSION COMPLETE" / "CORE INTELLIGENCE DESTROYED" victory screen.
- Task 4: Created `assets/briefings/level-3.json` (Act 3 "Collapse" briefing: no extraction, Ghost's voice cracking, committed to the end). Added 5 Level 3 handler dialogue entries to handler.json. Added 5 voice manifest entries. Added 5 voice line definitions to VoiceLineGenerator.
- Task 5: Added fetch for `level-3.json` in main.ts init, calling `levelManager.setBriefingData(data, 3)`.
- Task 6: Created `src/__tests__/LevelManager.level3.test.ts` with 22 tests (behavior params, palettes, behaviors map, spawn events, surface targets, corridor obstacles, voice lines). Updated LevelManager.level2.test.ts with Level 3 LEVEL_BEHAVIORS test. Updated VoiceLineGenerator.test.ts: counts from 39 to 44, added Level 3 hasSound checks.
- Task 7: `npx tsc --noEmit` passes clean. Full test suite: 1639 tests across 117 files, all pass, zero regressions. Added 28 new tests (22 Level 3 constants + 1 LEVEL_BEHAVIORS Level 3 + 5 voice line updates).

### Change Log

- 2026-03-26: Story 5-3 implemented -- Level 3 Red Palette. Glitchy enemy behaviors (evasion 0.5, randomness 0.5), Level 3 spawn/surface/corridor configs with highest density, Level 2->3 transition in main.ts, Level 3 briefing and handler dialogue (Act 3 "Collapse"), voice line definitions, placeholder boss. Added 28 new tests.

### File List

- `src/config/constants.ts` -- Modified: added Level 3 behavior params (Glitchy profile), SPAWN_EVENTS_LEVEL3, SURFACE_TARGETS_LEVEL3, CORRIDOR_OBSTACLES_LEVEL3, Level 3 entry in LEVEL_BEHAVIORS
- `src/systems/LevelManager.ts` -- Modified: added Level 3 entries to LEVEL_SPAWN_EVENTS, LEVEL_SURFACE_TARGETS, LEVEL_CORRIDOR_OBSTACLES, LEVEL_BOSS_FACTORIES; added imports for Level 3 constants
- `src/main.ts` -- Modified: updated levelComplete handler for Level 2->3 transition, added Level 3 briefing data fetch
- `src/audio/VoiceLineGenerator.ts` -- Modified: added 5 Level 3 handler voice line definitions
- `assets/briefings/level-3.json` -- New: Level 3 briefing content (Act 3 "Collapse")
- `assets/dialogue/handler.json` -- Modified: added 5 Level 3 handler dialogue entries
- `public/audio/manifest.json` -- Modified: added 5 Level 3 voice manifest entries
- `src/__tests__/LevelManager.level3.test.ts` -- New: 22 tests for Level 3 constants, configs, palette, behaviors, voice lines
- `src/__tests__/LevelManager.level2.test.ts` -- Modified: added Level 3 LEVEL_BEHAVIORS test, added Level 3 imports
- `src/__tests__/VoiceLineGenerator.test.ts` -- Modified: updated counts from 39 to 44, added Level 3 hasSound checks
