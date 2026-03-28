# Story 5.2: The Avenger Boss

Status: review

## Story

As a player,
I want to fight The Avenger boss who is fast and angry,
so that Level 2 has a punishing climax with a distinct personality that escalates the campaign's narrative tension.

## Acceptance Criteria

1. An `AvengerBoss` class exists at `src/entities/bosses/AvengerBoss.ts` that extends `Boss`. It has a distinct visual design: sleek, angular wireframe geometry — NOT icosahedrons like GatekeeperBoss. Use `OctahedronGeometry` for layers (sharp, angular, aggressive). Three layers: outer spines (radius ~9, detail 1), mid blade ring (radius ~6, detail 0), inner core (radius ~3, detail 0).

2. `AvengerBoss` has three attack phases: `rush`, `barrage`, `vulnerable`. The cycle is rush -> barrage -> vulnerable -> rush (repeating). Rush is unique to the Avenger — a rapid directional charge toward the player position, emitting projectiles along the charge path. Barrage is faster than Gatekeeper's (shorter interval, more projectiles). Vulnerable window is shorter than Gatekeeper's.

3. Avenger boss constants are defined in `src/config/constants.ts`:
   - `BOSS_AVENGER_HEALTH = 650` (30% more than Gatekeeper's 500)
   - `BOSS_AVENGER_COLLIDER_RADIUS = 5.5`
   - `BOSS_AVENGER_SCORE_VALUE = 7500`
   - `BOSS_AVENGER_OUTER_RADIUS = 9`
   - `BOSS_AVENGER_MID_RADIUS = 6`
   - `BOSS_AVENGER_CORE_RADIUS = 3`
   - `BOSS_AVENGER_ROTATION_SPEED = 0.5` (faster than Gatekeeper's 0.3)
   - Rush phase: duration 4.0s, charge speed 25, projectile interval 0.3s, damage 20
   - Barrage phase: duration 5.0s, interval 0.35s, count 5, spread 0.4
   - Vulnerable phase: duration 3.0s (shorter than Gatekeeper's 4.0s)
   - `BOSS_AVENGER_DAMAGE_REDUCTION = 0.15` (less damage reduction than Gatekeeper — aggression > defense)
   - `BOSS_AVENGER_PROJECTILE_SPEED = 20` (faster than Gatekeeper's 16)

4. The `BossPhaseChangedEvent` type in `GameEvents.ts` is extended to include `'rush'` in addition to the existing `'barrage' | 'sweep' | 'vulnerable'`. The `BossPhaseType` in `GatekeeperBoss.ts` is also updated. This is a union type change only — no runtime breakage.

5. `BossPhase` is refactored to accept a boss factory function instead of hardcoding `GatekeeperBoss`. `BossPhase` constructor gains an optional `bossFactory` parameter: `(vectorMaterials: VectorMaterials, playerPositionGetter: () => THREE.Vector3) => Boss`. When not provided, defaults to creating `GatekeeperBoss` (backward compatibility). `LevelManager` passes the appropriate factory per level.

6. `LevelManager` creates `BossPhase` with `AvengerBoss` factory for Level 2 and `GatekeeperBoss` factory for Level 1. No `if (level === 2)` in boss code — boss selection is configuration-driven from `LevelManager`.

7. `AvengerBoss` implements the same `DestructionSequence` pattern as `GatekeeperBoss`: peel (outer spines expand + fade) -> strip (mid blades expand + rotate wildly + fade) -> shatter (core pulses white + dissolves). Uses the same `BOSS_DESTRUCTION_*` timing constants.

8. Avenger dialogue entries exist in `assets/dialogue/bosses.json` with speaker `"avenger"`. At minimum 7 lines: encounter start, health below 75%, health below 50%, health below 25%, rush phase taunt, vulnerable phase taunt, defeated. All triggered by existing event patterns (`phaseStart:boss:2`, `bossHealthChanged:below75`, etc.). Tone: aggressive, fast, angry, personal — "I know what you did to my Gatekeeper."

9. Avenger voice line definitions exist in `src/audio/VoiceLineGenerator.ts` with an `AVENGER_PROFILE` voice profile (higher base frequency than Gatekeeper, aggressive waveform, faster modulation) and corresponding `AVENGER_DEFINITIONS` record. Voice line IDs match the dialogue entry audio fields.

10. Voice manifest entries for Avenger lines exist in `public/audio/manifest.json`.

11. Running `npm run build` produces a clean production build with zero TypeScript errors.

12. Unit tests exist (Vitest) for:
    - `AvengerBoss` construction: correct health, score, collider radius, three geometry layers, bloom layer enabled
    - `AvengerBoss` attack phases: rush -> barrage -> vulnerable cycle, correct timing, event emission
    - `AvengerBoss` rush phase: emits `bossAttack` events with correct projectile speed and damage
    - `AvengerBoss` damage: damage reduction during non-vulnerable phases, full damage during vulnerable
    - `AvengerBoss` destruction sequence: peel/strip/shatter stages fire, `bossDestroyed` emitted on completion
    - `BossPhase` factory: accepts boss factory, creates correct boss type
    - `LevelManager` boss selection: Level 1 uses GatekeeperBoss, Level 2 uses AvengerBoss
    - Avenger constants: values are more aggressive than Gatekeeper equivalents
    - Voice line definitions: all Avenger voice IDs registered

13. All existing tests continue to pass — zero regressions.

## Tasks / Subtasks

- [x] Task 1: Define Avenger boss constants (AC: #3)
  - [x]1.1 Add all `BOSS_AVENGER_*` constants to `src/config/constants.ts`
  - [x]1.2 Add `BOSS_AVENGER_RUSH_DURATION`, `BOSS_AVENGER_RUSH_CHARGE_SPEED`, `BOSS_AVENGER_RUSH_PROJECTILE_INTERVAL`, `BOSS_AVENGER_RUSH_DAMAGE`
  - [x]1.3 Add `BOSS_AVENGER_BARRAGE_DURATION`, `BOSS_AVENGER_BARRAGE_INTERVAL`, `BOSS_AVENGER_BARRAGE_COUNT`, `BOSS_AVENGER_BARRAGE_SPREAD`
  - [x]1.4 Add `BOSS_AVENGER_VULNERABLE_DURATION`, `BOSS_AVENGER_DAMAGE_REDUCTION`, `BOSS_AVENGER_ATTACK_DAMAGE`, `BOSS_AVENGER_PROJECTILE_SPEED`

- [x] Task 2: Extend BossPhaseChangedEvent type (AC: #4)
  - [x]2.1 Update `BossPhaseChangedEvent.phase` in `GameEvents.ts` to `'barrage' | 'sweep' | 'vulnerable' | 'rush'`
  - [x]2.2 Update `BossPhaseType` in `GatekeeperBoss.ts` to include `'rush'`

- [x] Task 3: Create AvengerBoss entity (AC: #1, #2, #7)
  - [x]3.1 Create `src/entities/bosses/AvengerBoss.ts` extending `Boss`
  - [x]3.2 Build three geometry layers using `OctahedronGeometry` + `EdgesGeometry` + `LineSegments` with bloom
  - [x]3.3 Implement rush/barrage/vulnerable attack phase cycle with `transitionPhase()`
  - [x]3.4 Implement `updateRush()`: boss position oscillates toward player, emits `bossAttack` events at interval
  - [x]3.5 Implement `updateBarrage()`: similar to Gatekeeper but faster (more projectiles, shorter interval, wider spread)
  - [x]3.6 Implement vulnerable phase: set `this.vulnerable = true`, reduce outer opacity, emit `bossVulnerable`
  - [x]3.7 Implement `onHit()`: flash scale effect (same pattern as Gatekeeper)
  - [x]3.8 Implement `onDefeated()`: create `DestructionSequence` with peel/strip/shatter stages using the same `BOSS_DESTRUCTION_*` constants
  - [x]3.9 Implement `dispose()`: remove all children, dispose geometries and materials
  - [x]3.10 Add getter methods for testing (getOuterSpines, getMidBlades, getInnerCore, materials, getCurrentPhase, getPhaseTimer)

- [x] Task 4: Refactor BossPhase for boss factory (AC: #5)
  - [x]4.1 Add optional `bossFactory` parameter to `BossPhase` constructor
  - [x]4.2 In `enter()`, use factory if provided, otherwise default to `new GatekeeperBoss()`
  - [x]4.3 Change boss field type from `GatekeeperBoss | null` to `Boss | null`
  - [x]4.4 Ensure `dispose()` is called on the boss (defined on `Boss` or overridden by subclass)

- [x] Task 5: Wire LevelManager to select boss per level (AC: #6)
  - [x]5.1 Import `AvengerBoss` in `LevelManager.ts`
  - [x]5.2 Pass `GatekeeperBoss` factory to BossPhase for Level 1
  - [x]5.3 Pass `AvengerBoss` factory to BossPhase for Level 2
  - [x]5.4 Keep the factory pattern extensible for Level 3 (CoreIntelligenceBoss — Story 5-4)

- [x] Task 6: Create Avenger dialogue entries (AC: #8)
  - [x]6.1 Add 7+ Avenger dialogue entries to `assets/dialogue/bosses.json` with speaker `"avenger"`
  - [x]6.2 Use triggers: `phaseStart:boss:2`, `bossHealthChanged:below75`, `bossHealthChanged:below50`, `bossHealthChanged:below25`, `bossPhaseChanged:rush`, `bossVulnerable`, `bossDefeated`
  - [x]6.3 Tone: aggressive, personal, fast — references destroying the Gatekeeper

- [x] Task 7: Add Avenger voice profile and definitions (AC: #9, #10)
  - [x]7.1 Add `AVENGER_PROFILE` voice profile to `VoiceLineGenerator.ts` (higher baseFreq ~140, `sawtooth` waveform, faster modRate ~12, higher noiseLevel ~0.25)
  - [x]7.2 Add `AVENGER_DEFINITIONS` record with voice definitions for each dialogue entry's audio field
  - [x]7.3 Merge `AVENGER_DEFINITIONS` into `VOICE_DEFINITIONS`
  - [x]7.4 Add voice manifest entries to `public/audio/manifest.json`

- [x] Task 8: Write tests (AC: #12, #13)
  - [x]8.1 Create `src/__tests__/AvengerBoss.test.ts`: construction, geometry layers, attack phases, damage, destruction
  - [x]8.2 Add BossPhase factory tests to `src/__tests__/BossPhase.test.ts` or create new test file
  - [x]8.3 Add LevelManager boss selection tests to `src/__tests__/LevelManager.level2.test.ts`
  - [x]8.4 Add Avenger constants validation tests to test file
  - [x]8.5 Add VoiceLineGenerator Avenger definitions tests

- [x] Task 9: Build verification (AC: #11, #13)
  - [x]9.1 Run `npx tsc --noEmit` — zero TypeScript errors
  - [x]9.2 Run `npm run test` — all tests pass, zero regressions

## Dev Notes

### Architecture Compliance

- **Boss extends GameObject, NOT Enemy.** Boss is a sibling to Enemy in the hierarchy. Bosses are unique encounters, NOT pooled. [Source: game-architecture.md#Entity System]
- **VectorMaterials.create()** for ALL materials. Never `new LineBasicMaterial()` directly. [Source: project-context.md#Critical Implementation Rules]
- **`mesh.layers.enable(BLOOM_LAYER)`** on every LineSegments child. [Source: project-context.md#Critical Implementation Rules]
- **Systems never import each other.** BossPhase communicates through EventBus, not direct imports of boss subclasses in systems. [Source: project-context.md#Architecture Rules]
- **DestructionSequence pattern.** Boss destruction is ALWAYS a DestructionSequence with stages. Never hardcode timed destruction with elapsed-time counters. [Source: DestructionSequence.ts header]
- **No fetch() during gameplay.** Boss is created in `BossPhase.enter()`. [Source: project-context.md#Performance Rules]
- **Pre-allocate temp vectors.** Follow GatekeeperBoss pattern of pre-allocated `tempPlayerPos`, `tempAttackDir`, etc. Zero per-frame allocation. [Source: project-context.md#Performance Rules]

### Critical Implementation Rules

- **Use `Logger.info/warn/error()`** — NEVER `console.log()`. [Source: project-context.md#Critical Don't-Miss Rules]
- **`erasableSyntaxOnly: true`**: No `enum`. Use `type` unions and `as const` objects. [Source: tsconfig.json]
- **`verbatimModuleSyntax: true`**: Use `import type { ... }` for type-only imports. [Source: tsconfig.json]
- **Delta time cap**: `Math.min(dt, 1/20)` — already handled by DeltaTime module.
- **Event names**: `camelCase` verbs — existing patterns: `bossPhaseChanged`, `bossAttack`, `bossVulnerable`, `bossDefeated`, `bossDestroyed`.

### Existing Code Patterns to Follow

- **GatekeeperBoss** is the reference implementation. AvengerBoss follows the same patterns: constructor creates geometry with VectorMaterials.create(), updateBoss() drives phase state machine, transitionPhase() handles phase changes with event emission, onHit() does flash scale, onDefeated() creates DestructionSequence.
- **BossPhase** currently hardcodes `new GatekeeperBoss()` in enter(). Refactor to accept a factory function. The factory pattern allows extensibility for Story 5-4 (CoreIntelligenceBoss).
- **LevelManager** already has per-level config patterns (LEVEL_PALETTES, LEVEL_BEHAVIORS, LEVEL_SPAWN_EVENTS). Add a similar pattern for boss factories.
- **DialogueManager** subscribes to `bossPhaseChanged` and constructs trigger IDs like `bossPhaseChanged:${e.phase}`. Adding `rush` to the phase union automatically makes `bossPhaseChanged:rush` a valid trigger.
- **VoiceLineGenerator** follows a consistent pattern: profile object -> definitions record using `createVoiceDefinition()` -> merge into `VOICE_DEFINITIONS`. Follow this exactly for AVENGER_DEFINITIONS.

### What Already Exists (DO NOT recreate)

- `src/entities/bosses/Boss.ts` — Abstract base class. DO NOT MODIFY. AvengerBoss extends it.
- `src/entities/bosses/DestructionSequence.ts` — Stage-based destruction animation. DO NOT MODIFY.
- `src/entities/bosses/GatekeeperBoss.ts` — Level 1 boss. MODIFY only to update `BossPhaseType` union.
- `src/state/phases/BossPhase.ts` — Boss arena phase. MODIFY to accept boss factory.
- `src/systems/LevelManager.ts` — Level orchestrator. MODIFY to pass boss factory per level.
- `src/core/GameEvents.ts` — Event definitions. MODIFY `BossPhaseChangedEvent` to add `'rush'`.
- `src/narrative/DialogueTypes.ts` — Already has `'avenger'` in the speaker union. DO NOT MODIFY.
- `src/narrative/DialogueManager.ts` — Already has `SPEAKER_CONFIGS.avenger`. DO NOT MODIFY.
- `assets/dialogue/bosses.json` — MODIFY: add Avenger entries alongside existing Gatekeeper entries.
- `public/audio/manifest.json` — MODIFY: add Avenger voice entries.
- `src/audio/VoiceLineGenerator.ts` — MODIFY: add AVENGER_PROFILE, AVENGER_DEFINITIONS.
- `src/config/constants.ts` — MODIFY: add BOSS_AVENGER_* constants.
- `src/rendering/VectorMaterials.ts` — Used by AvengerBoss constructor. DO NOT MODIFY.

### What Must Be Created

- `src/entities/bosses/AvengerBoss.ts` — The Avenger boss entity
- `src/__tests__/AvengerBoss.test.ts` — Tests for AvengerBoss

### The Avenger Design Specifications

**Visual Design:** Sleek, angular, aggressive. Use `OctahedronGeometry` for sharp, blade-like layers. Faster rotation than Gatekeeper. The Avenger should feel visually distinct — angular vs. the Gatekeeper's rounded icosahedrons.

**Attack Pattern — Rush/Barrage/Vulnerable Cycle:**
| Phase | Duration | Description |
|-------|----------|-------------|
| Rush | 4.0s | Boss oscillates position toward player, emitting projectiles along path. New mechanic unique to Avenger. |
| Barrage | 5.0s | Fast targeted projectile bursts (5 at a time, every 0.35s). More aggressive than Gatekeeper's barrage. |
| Vulnerable | 3.0s | Outer layer fades, full damage window. Shorter than Gatekeeper (3s vs 4s). |

**Rush Phase Mechanic:**
- The boss smoothly moves toward the player's position (but doesn't reach it — stays at a charge distance)
- During the charge, it fires projectiles at shorter intervals (0.3s) toward the player
- The visual effect: outer spines rotate rapidly during rush, creating a "spinning blade" look
- After rush duration ends, boss returns to center position and transitions to barrage

**Difficulty Escalation vs Gatekeeper:**
| Stat | Gatekeeper | Avenger | Escalation |
|------|------------|---------|-----------|
| Health | 500 | 650 | +30% |
| Vulnerable window | 4.0s | 3.0s | -25% shorter |
| Barrage interval | 0.5s | 0.35s | -30% faster |
| Barrage count | 3 | 5 | +67% more |
| Projectile speed | 16 | 20 | +25% faster |
| Damage per hit | 15 | 20 | +33% more |
| Damage reduction | 0.25 | 0.15 | Less defensive |
| Score value | 5000 | 7500 | +50% reward |

**Narrative Personality:**
- Aggressive, fast, angry — KNOWS what happened to the Gatekeeper
- Takes it personally — the AI's version of revenge
- Mirror of Cipher's revenge drive — fury against fury
- Dialogue tone: threatening, personal, contemptuous
- [Source: narrative-design.md#The Avenger, gdd.md#Boss Encounters]

**Avenger Dialogue Lines:**
1. Encounter: "I know what you did to my Gatekeeper. I will enjoy dismantling you."
2. Health <75%: "You fight well for an insect. It won't save you."
3. Health <50%: "Faster. Stronger. I am everything the Gatekeeper was not."
4. Health <25%: "No. NO. I will not fall like that pathetic construct!"
5. Rush phase: "There is nowhere to hide from me."
6. Vulnerable: "A momentary weakness. Exploit it if you can."
7. Defeated: "The network... will remember what you... have done..."

### Scope Boundaries

**IN scope**: AvengerBoss entity, boss constants, BossPhase factory refactor, LevelManager boss selection, Avenger dialogue and voice lines, BossPhaseChangedEvent extension, tests.

**NOT in scope** (future stories):
- Level 3 content — Story 5-3
- The Core Intelligence boss — Story 5-4
- Color palette progression animation — Story 5-5
- Overseer enemy type — Story 5-6
- Enemy behavioral evolution — Story 5-7

### Previous Story Intelligence

From Story 5-1 (Level 2 — Amber Palette):
- LevelManager now supports multi-level with `startLevel(level)`. Level 2 uses GatekeeperBoss as placeholder — this story replaces it with AvengerBoss.
- BossPhase currently hardcodes `new GatekeeperBoss()` — needs factory refactor.
- PaletteColors utility works — Avenger boss materials will automatically use amber palette via VectorMaterials.
- Level 2 spawn events, surface targets, corridor obstacles all defined. Boss phase is the final phase.
- Test count after Story 5-1: 1560 tests across 115 files.

From Stories 3-7, 3-9 (Boss System):
- Boss.ts base class handles: health tracking, bossHealthChanged events, defeated state, destruction sequence driving, bossDestroyed emission.
- DestructionSequence has stages with `onStart/onUpdate/onEnd` callbacks. Define stages in `onDefeated()`.
- GatekeeperBoss destruction uses the shared `BOSS_DESTRUCTION_*` constants. Avenger reuses these.
- BossPhase creates arena grid, rail path, subscribes to `bossDefeated` and `bossDestroyed`.
- Boss collision handled by CollisionSystem which checks `boss.vulnerable` for damage application.

### Project Structure Notes

- `src/entities/bosses/AvengerBoss.ts` — alongside Boss.ts and GatekeeperBoss.ts
- `src/__tests__/AvengerBoss.test.ts` — alongside existing boss test files
- No new npm dependencies needed
- No new directories needed

### References

- [Source: gdd.md#Boss Encounters] — "The Avenger: Aggressive, fast, angry — KNOWS what you did to Boss 1. Relentless attacks, shorter windows, punishing aggression."
- [Source: narrative-design.md#The Avenger] — "Sleek, angular, aggressive construct. Purpose-built to hunt and destroy. The network's version of anger."
- [Source: narrative-design.md#Act 2] — "The Avenger — fast, furious, and personal. Fury against fury."
- [Source: gdd.md#Level 2 Phase 4] — "The Avenger — fast, angry, relentless aggression. Tighter attack windows, punishing patterns."
- [Source: gdd.md#Difficulty Scaling] — Level 2 boss: "fast, relentless, punishing aggression"
- [Source: game-architecture.md#Entity System] — AvengerBoss in Boss hierarchy, NOT Enemy subclass
- [Source: game-architecture.md#Boss Encounter System] — "3 unique bosses, multi-stage destruction, vulnerability windows, dialogue triggers"
- [Source: project-context.md#Architecture Rules] — VectorMaterials.create(), BLOOM_LAYER, EventBus communication

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- AvengerBoss uses OctahedronGeometry for angular, blade-like appearance vs GatekeeperBoss's IcosahedronGeometry. Three layers: outer spines (radius 9, detail 1), mid blades (radius 6, detail 0), inner core (radius 3, detail 0).
- Attack cycle: rush -> barrage -> vulnerable -> rush. Rush phase oscillates boss position toward player using sine wave, fires projectiles every 0.3s. Barrage fires 5 projectiles per burst every 0.35s. Vulnerable window is 3.0s (vs Gatekeeper's 4.0s).
- BossPhase refactored with optional `bossFactory` parameter. Default factory creates GatekeeperBoss for backward compatibility. LevelManager passes appropriate factory per level via `LEVEL_BOSS_FACTORIES` map.
- Added abstract `dispose()` method to Boss base class so BossPhase can call it on the `Boss` type (previously worked because field was typed as `GatekeeperBoss`).
- BossPhaseChangedEvent phase union extended to include `'rush'` for the Avenger's unique attack phase.
- AVENGER_PROFILE voice profile: higher baseFreq (140 vs Gatekeeper's 100), faster modRate (12 vs 5), higher noiseLevel (0.25 vs 0.2), shorter attack (0.005 vs 0.01). Creates an aggressive, fast-paced digital voice.

### Completion Notes List

- Task 1: Added 23 BOSS_AVENGER_* constants to constants.ts. All values more aggressive than Gatekeeper equivalents (health +30%, damage +33%, projectile speed +25%, vulnerable window -25%).
- Task 2: Extended BossPhaseChangedEvent.phase union to include 'rush' in GameEvents.ts. Updated BossPhaseType in GatekeeperBoss.ts.
- Task 3: Created AvengerBoss at src/entities/bosses/AvengerBoss.ts. Three OctahedronGeometry layers with bloom. Rush/barrage/vulnerable cycle. DestructionSequence with peel/strip/shatter stages reusing shared BOSS_DESTRUCTION_* constants.
- Task 4: Refactored BossPhase to accept optional BossFactory parameter. Default creates GatekeeperBoss. Boss field type changed from GatekeeperBoss to Boss. Added BossFactory type export.
- Task 5: LevelManager imports AvengerBoss, defines LEVEL_BOSS_FACTORIES map. Level 1 uses GatekeeperBoss factory, Level 2 uses AvengerBoss factory. Both buildLevel1Phases and buildLevelPhases pass factory to BossPhase.
- Task 6: Added 7 Avenger dialogue entries to assets/dialogue/bosses.json. Triggers: phaseStart:boss:2, bossHealthChanged:below75/50/25, bossPhaseChanged:rush, bossVulnerable, bossDefeated. Aggressive, personal tone referencing the Gatekeeper's destruction.
- Task 7: Added AVENGER_PROFILE and AVENGER_DEFINITIONS (7 voice lines) to VoiceLineGenerator.ts. Added 7 voice manifest entries to manifest.json.
- Task 8: Created AvengerBoss.test.ts (45 tests covering construction, animation, phase cycling, rush/barrage attacks, damage/vulnerability, hit flash, destruction sequence, constants validation). Added 3 BossPhase factory tests. Updated VoiceLineGenerator tests (count 32->39, added avenger hasSound checks).
- Task 9: `npx tsc --noEmit` passes clean. Full test suite: 1611 tests across 116 files, all pass, zero regressions. Added 51 new tests (45 AvengerBoss + 3 BossPhase factory + 3 VoiceLineGenerator updates).

### Change Log

- 2026-03-26: Story 5-2 implemented -- The Avenger Boss. AvengerBoss entity with angular OctahedronGeometry, rush/barrage/vulnerable attack cycle, destruction sequence. BossPhase factory refactor for per-level boss selection. LevelManager wires AvengerBoss for Level 2. Avenger dialogue (7 lines) and voice definitions (7 lines). Boss base class gets abstract dispose(). BossPhaseChangedEvent extended with 'rush'. Added 51 new tests.

### File List

- `src/entities/bosses/AvengerBoss.ts` -- New: Level 2 boss entity with OctahedronGeometry, rush/barrage/vulnerable phases
- `src/entities/bosses/Boss.ts` -- Modified: added abstract dispose() method
- `src/entities/bosses/GatekeeperBoss.ts` -- Modified: BossPhaseType union extended with 'rush'
- `src/core/GameEvents.ts` -- Modified: BossPhaseChangedEvent.phase extended with 'rush'
- `src/config/constants.ts` -- Modified: added 23 BOSS_AVENGER_* constants
- `src/state/phases/BossPhase.ts` -- Modified: refactored for BossFactory pattern, boss field typed as Boss
- `src/systems/LevelManager.ts` -- Modified: imports AvengerBoss, defines LEVEL_BOSS_FACTORIES, passes factory to BossPhase
- `src/audio/VoiceLineGenerator.ts` -- Modified: added AVENGER_PROFILE, AVENGER_DEFINITIONS (7 voice lines)
- `assets/dialogue/bosses.json` -- Modified: added 7 Avenger dialogue entries
- `public/audio/manifest.json` -- Modified: added 7 Avenger voice manifest entries
- `src/__tests__/AvengerBoss.test.ts` -- New: 45 tests for AvengerBoss entity
- `src/__tests__/BossPhase.test.ts` -- Modified: added 3 boss factory tests, imported AvengerBoss
- `src/__tests__/VoiceLineGenerator.test.ts` -- Modified: updated counts from 32 to 39, added avenger hasSound checks
