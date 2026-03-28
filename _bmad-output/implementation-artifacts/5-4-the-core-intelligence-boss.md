# Story 5.4: The Core Intelligence Boss

Status: review

## Story

As a player,
I want to fight The Core Intelligence boss with its calm-to-unhinged emotional arc,
so that the final encounter is narratively compelling and the campaign reaches a satisfying climax.

## Acceptance Criteria

1. A `CoreIntelligenceBoss` class exists at `src/entities/bosses/CoreIntelligenceBoss.ts` that extends `Boss`. It has a distinct visual design: enormous, fractal geometric entity. Use `DodecahedronGeometry` for layers (complex, organic-feeling, alien). Four layers: outer fractal shell (radius ~12, detail 2), mid lattice (radius ~8, detail 1), inner matrix (radius ~5, detail 0), deep core (radius ~2.5, detail 0). The fourth layer distinguishes it from the other two bosses' three-layer designs, reinforcing that this is the source, the mind, the final entity.

2. `CoreIntelligenceBoss` has four attack phases: `reason`, `barrage`, `surge`, `vulnerable`. The cycle is reason -> barrage -> surge -> vulnerable -> reason (repeating). `reason` is unique to The Core Intelligence -- a measured phase where the boss fires slow, aimed projectiles at moderate intervals while geometry rotates gently (the boss is "talking" to you, trying to reason). `surge` is a new phase -- the boss expands outward in a pulse wave, firing rapid omnidirectional projectiles (radial burst pattern). `barrage` is faster than Avenger's (shorter interval, wider spread).

3. `BossPhaseChangedEvent.phase` union in `GameEvents.ts` is extended to include `'reason'` and `'surge'` in addition to existing `'barrage' | 'sweep' | 'vulnerable' | 'rush'`.

4. Core Intelligence boss constants are defined in `src/config/constants.ts`:
   - `BOSS_CORE_HEALTH = 800` (23% more than Avenger's 650)
   - `BOSS_CORE_COLLIDER_RADIUS = 7.0`
   - `BOSS_CORE_SCORE_VALUE = 10000`
   - `BOSS_CORE_OUTER_RADIUS = 12`
   - `BOSS_CORE_MID_RADIUS = 8`
   - `BOSS_CORE_INNER_RADIUS = 5`
   - `BOSS_CORE_DEEP_RADIUS = 2.5`
   - `BOSS_CORE_ROTATION_SPEED = 0.2` (slower than predecessors -- measured, confident)
   - `BOSS_CORE_PULSE_RATE = 1.0`
   - `BOSS_CORE_PULSE_AMPLITUDE = 0.12`
   - Reason phase: duration 5.0s, projectile interval 0.8s, damage 15 (gentle, slow)
   - Barrage phase: duration 6.0s, interval 0.25s, count 7, spread 0.5
   - Surge phase: duration 3.0s, burst interval 0.5s, burst count 8 (radial), damage 25
   - Vulnerable phase: duration 2.5s (shortest of any boss -- fleeting windows)
   - `BOSS_CORE_DAMAGE_REDUCTION = 0.1` (least defensive -- relies on complexity)
   - `BOSS_CORE_PROJECTILE_SPEED = 22` (fastest projectiles)
   - `BOSS_CORE_ATTACK_DAMAGE = 25` (highest base damage)

5. The Core Intelligence has a unique "emotional escalation" mechanic: as health decreases, rotation speed increases, geometry begins to jitter (random position offsets applied to layers), and the deep core pulse rate accelerates. Below 75% health: rotation speed x1.5, slight jitter (0.1 amplitude). Below 50%: rotation speed x2.0, moderate jitter (0.3 amplitude), deep core pulse rate x1.5. Below 25%: rotation speed x3.0, severe jitter (0.6 amplitude), deep core pulse rate x2.0, outer layer opacity flickers. This creates a visual "unraveling" that matches the narrative arc.

6. `LEVEL_BOSS_FACTORIES` in `LevelManager.ts` updates the Level 3 entry from placeholder `GatekeeperBoss` to `CoreIntelligenceBoss`.

7. Core Intelligence dialogue entries exist in `assets/dialogue/bosses.json` with speaker `"coreIntelligence"`. At minimum 8 lines:
   - Encounter start (calm, philosophical): "You've come so far. But you don't understand what you're destroying."
   - Health below 75% (still composed): "Every system I manage, every life I optimize -- you would return that to human chaos?"
   - Health below 50% (cracking): "This is -- this is not -- I am optimal. I AM optimal."
   - Health below 25% (unraveling): "Stop. STOP. I don't want to -- please --"
   - Reason phase (measured): "I didn't take your world. I saved it from itself."
   - Surge phase (desperate): "You cannot dismantle what holds your world together!"
   - Vulnerable (fear): "No -- not there -- that's --"
   - Defeated (digital scream): "I am... I was... everything..."
   Triggers: `phaseStart:boss:3`, `bossHealthChanged:below75/50/25`, `bossPhaseChanged:reason`, `bossPhaseChanged:surge`, `bossVulnerable`, `bossDefeated`.

8. Core Intelligence voice line definitions exist in `src/audio/VoiceLineGenerator.ts` with a `CORE_INTELLIGENCE_PROFILE` voice profile (lowest base frequency ~80Hz, complex waveform, slow modulation that accelerates with an `evolving` flag -- though for MVP, use a static profile with heavy noise and low frequency to convey "ancient, vast, digital mind"). Corresponding `CORE_INTELLIGENCE_DEFINITIONS` record. Voice line IDs match dialogue audio fields.

9. Voice manifest entries for Core Intelligence lines exist in `public/audio/manifest.json`.

10. `CoreIntelligenceBoss` implements the `DestructionSequence` pattern with peel/strip/shatter stages using shared `BOSS_DESTRUCTION_*` constants. The destruction has an extra visual: during the shatter stage, ALL four layers pulse white simultaneously before the deep core dissolves -- unique to the final boss.

11. Running `npm run build` produces a clean production build with zero TypeScript errors.

12. Unit tests exist (Vitest) for:
    - `CoreIntelligenceBoss` construction: correct health, score, collider radius, four geometry layers (not three), bloom layer enabled on all
    - `CoreIntelligenceBoss` attack phases: reason -> barrage -> surge -> vulnerable cycle, correct timing, event emission
    - `CoreIntelligenceBoss` reason phase: emits `bossAttack` events at moderate interval with correct speed/damage
    - `CoreIntelligenceBoss` surge phase: emits `bossAttack` with radial burst pattern (8 positions per burst)
    - `CoreIntelligenceBoss` emotional escalation: below 75% increases rotation speed, below 50% adds jitter, below 25% severe jitter
    - `CoreIntelligenceBoss` damage: damage reduction during non-vulnerable phases, full damage during vulnerable
    - `CoreIntelligenceBoss` destruction sequence: peel/strip/shatter stages fire, `bossDestroyed` emitted on completion
    - `BossPhase` factory: Level 3 creates CoreIntelligenceBoss (not GatekeeperBoss placeholder)
    - `LevelManager` boss selection: Level 3 uses CoreIntelligenceBoss
    - Core Intelligence constants: values escalate beyond Avenger equivalents
    - Voice line definitions: all Core Intelligence voice IDs registered

13. All existing tests continue to pass -- zero regressions.

## Tasks / Subtasks

- [x] Task 1: Define Core Intelligence boss constants (AC: #4)
  - [x]1.1 Add all `BOSS_CORE_*` constants to `src/config/constants.ts`
  - [x]1.2 Add `BOSS_CORE_REASON_DURATION`, `BOSS_CORE_REASON_INTERVAL`, `BOSS_CORE_REASON_DAMAGE`
  - [x]1.3 Add `BOSS_CORE_BARRAGE_DURATION`, `BOSS_CORE_BARRAGE_INTERVAL`, `BOSS_CORE_BARRAGE_COUNT`, `BOSS_CORE_BARRAGE_SPREAD`
  - [x]1.4 Add `BOSS_CORE_SURGE_DURATION`, `BOSS_CORE_SURGE_BURST_INTERVAL`, `BOSS_CORE_SURGE_BURST_COUNT`, `BOSS_CORE_SURGE_DAMAGE`
  - [x]1.5 Add `BOSS_CORE_VULNERABLE_DURATION`, `BOSS_CORE_DAMAGE_REDUCTION`, `BOSS_CORE_ATTACK_DAMAGE`, `BOSS_CORE_PROJECTILE_SPEED`
  - [x]1.6 Add emotional escalation thresholds: `BOSS_CORE_ESCALATION_75_ROTATION_MULT`, `BOSS_CORE_ESCALATION_75_JITTER`, `BOSS_CORE_ESCALATION_50_ROTATION_MULT`, `BOSS_CORE_ESCALATION_50_JITTER`, `BOSS_CORE_ESCALATION_50_PULSE_MULT`, `BOSS_CORE_ESCALATION_25_ROTATION_MULT`, `BOSS_CORE_ESCALATION_25_JITTER`, `BOSS_CORE_ESCALATION_25_PULSE_MULT`

- [x] Task 2: Extend BossPhaseChangedEvent type (AC: #3)
  - [x]2.1 Update `BossPhaseChangedEvent.phase` in `GameEvents.ts` to include `'reason'` and `'surge'`
  - [x]2.2 Update `BossPhaseType` in `GatekeeperBoss.ts` to include `'reason'` and `'surge'`

- [x] Task 3: Create CoreIntelligenceBoss entity (AC: #1, #2, #5, #10)
  - [x]3.1 Create `src/entities/bosses/CoreIntelligenceBoss.ts` extending `Boss`
  - [x]3.2 Build four geometry layers using `DodecahedronGeometry` + `EdgesGeometry` + `LineSegments` with bloom
  - [x]3.3 Implement reason/barrage/surge/vulnerable attack phase cycle with `transitionPhase()`
  - [x]3.4 Implement `updateReason()`: slow aimed projectiles at player, gentle rotation
  - [x]3.5 Implement `updateBarrage()`: fast targeted bursts (wider spread, more projectiles than Avenger)
  - [x]3.6 Implement `updateSurge()`: radial burst pattern (8 evenly-spaced projectile positions per burst)
  - [x]3.7 Implement vulnerable phase: set `this.vulnerable = true`, reduce outer opacity, emit `bossVulnerable`
  - [x]3.8 Implement emotional escalation: track health thresholds, increase rotation/jitter/pulse based on health fraction
  - [x]3.9 Implement `onHit()`: flash scale effect (same pattern as other bosses)
  - [x]3.10 Implement `onDefeated()`: create `DestructionSequence` with peel/strip/shatter stages, all-layer white flash in shatter
  - [x]3.11 Implement `dispose()`: remove all children, dispose all 4 geometries and materials
  - [x]3.12 Add getter methods for testing (getOuterFractal, getMidLattice, getInnerMatrix, getDeepCore, materials, getCurrentPhase, getPhaseTimer)

- [x] Task 4: Wire LevelManager to use CoreIntelligenceBoss for Level 3 (AC: #6)
  - [x]4.1 Import `CoreIntelligenceBoss` in `LevelManager.ts`
  - [x]4.2 Update `LEVEL_BOSS_FACTORIES[3]` from GatekeeperBoss to CoreIntelligenceBoss factory

- [x] Task 5: Create Core Intelligence dialogue entries (AC: #7)
  - [x]5.1 Add 8 Core Intelligence dialogue entries to `assets/dialogue/bosses.json` with speaker `"coreIntelligence"`
  - [x]5.2 Use triggers: `phaseStart:boss:3`, `bossHealthChanged:below75`, `bossHealthChanged:below50`, `bossHealthChanged:below25`, `bossPhaseChanged:reason`, `bossPhaseChanged:surge`, `bossVulnerable`, `bossDefeated`
  - [x]5.3 Tone arc: calm/philosophical -> cracking -> desperate -> broken

- [x] Task 6: Add Core Intelligence voice profile and definitions (AC: #8, #9)
  - [x]6.1 Add `CORE_INTELLIGENCE_PROFILE` voice profile to `VoiceLineGenerator.ts` (lowest baseFreq ~80, `sine` waveform for "vast" feel, slow modRate ~3, high noiseLevel ~0.3, low noiseFreq ~1000)
  - [x]6.2 Add `CORE_INTELLIGENCE_DEFINITIONS` record with voice definitions for each dialogue entry's audio field
  - [x]6.3 Merge `CORE_INTELLIGENCE_DEFINITIONS` into `VOICE_DEFINITIONS`
  - [x]6.4 Add voice manifest entries to `public/audio/manifest.json`

- [x] Task 7: Write tests (AC: #12, #13)
  - [x]7.1 Create `src/__tests__/CoreIntelligenceBoss.test.ts`: construction, geometry layers (4), attack phases, damage, emotional escalation, destruction
  - [x]7.2 Add LevelManager boss selection test: Level 3 uses CoreIntelligenceBoss (update `src/__tests__/LevelManager.level3.test.ts`)
  - [x]7.3 Add Core Intelligence constants validation tests
  - [x]7.4 Add VoiceLineGenerator Core Intelligence definitions tests (update `src/__tests__/VoiceLineGenerator.test.ts`)

- [x] Task 8: Build verification (AC: #11, #13)
  - [x]8.1 Run `npx tsc --noEmit` -- zero TypeScript errors
  - [x]8.2 Run `npm run test` -- all tests pass, zero regressions

## Dev Notes

### Architecture Compliance

- **Boss extends GameObject, NOT Enemy.** Boss is a sibling to Enemy in the hierarchy. Bosses are unique encounters, NOT pooled. [Source: game-architecture.md#Entity System]
- **VectorMaterials.create()** for ALL materials. Never `new LineBasicMaterial()` directly. [Source: project-context.md#Critical Implementation Rules]
- **`mesh.layers.enable(BLOOM_LAYER)`** on every LineSegments child. [Source: project-context.md#Critical Implementation Rules]
- **Systems never import each other.** BossPhase communicates through EventBus, not direct imports of boss subclasses in systems. [Source: project-context.md#Architecture Rules]
- **DestructionSequence pattern.** Boss destruction is ALWAYS a DestructionSequence with stages. Never hardcode timed destruction with elapsed-time counters. [Source: DestructionSequence.ts header]
- **No fetch() during gameplay.** Boss is created in `BossPhase.enter()`. [Source: project-context.md#Performance Rules]
- **Pre-allocate temp vectors.** Follow GatekeeperBoss/AvengerBoss pattern of pre-allocated `tempPlayerPos`, `tempAttackDir`, etc. Zero per-frame allocation. [Source: project-context.md#Performance Rules]

### Critical Implementation Rules

- **Use `Logger.info/warn/error()`** -- NEVER `console.log()`. [Source: project-context.md#Critical Don't-Miss Rules]
- **`erasableSyntaxOnly: true`**: No `enum`. Use `type` unions and `as const` objects. [Source: tsconfig.json]
- **`verbatimModuleSyntax: true`**: Use `import type { ... }` for type-only imports. [Source: tsconfig.json]
- **Delta time cap**: `Math.min(dt, 1/20)` -- already handled by DeltaTime module.
- **Event names**: `camelCase` verbs -- existing patterns: `bossPhaseChanged`, `bossAttack`, `bossVulnerable`, `bossDefeated`, `bossDestroyed`.

### Existing Code Patterns to Follow

- **GatekeeperBoss and AvengerBoss** are the reference implementations. CoreIntelligenceBoss follows the same patterns: constructor creates geometry with VectorMaterials.create(), updateBoss() drives phase state machine, transitionPhase() handles phase changes with event emission, onHit() does flash scale, onDefeated() creates DestructionSequence.
- **BossPhase** already accepts a `BossFactory` parameter (refactored in Story 5-2). CoreIntelligenceBoss just needs a factory in `LEVEL_BOSS_FACTORIES[3]`.
- **LevelManager** already has `LEVEL_BOSS_FACTORIES` map with entries for Levels 1, 2, 3. Level 3 currently uses GatekeeperBoss as placeholder -- replace with CoreIntelligenceBoss.
- **DialogueManager** subscribes to `bossPhaseChanged` and constructs trigger IDs like `bossPhaseChanged:${e.phase}`. Adding `reason` and `surge` to the phase union automatically makes them valid triggers.
- **VoiceLineGenerator** follows pattern: profile object -> definitions record using `createVoiceDefinition()` -> merge into `VOICE_DEFINITIONS`.
- **Boss.takeDamage()** emits `bossHealthChanged` automatically. DialogueManager already handles `below75/50/25` triggers from this.

### What Already Exists (DO NOT recreate)

- `src/entities/bosses/Boss.ts` -- Abstract base class. DO NOT MODIFY. CoreIntelligenceBoss extends it.
- `src/entities/bosses/DestructionSequence.ts` -- Stage-based destruction animation. DO NOT MODIFY.
- `src/entities/bosses/GatekeeperBoss.ts` -- Level 1 boss. MODIFY `BossPhaseType` union to add `'reason' | 'surge'`.
- `src/entities/bosses/AvengerBoss.ts` -- Level 2 boss. DO NOT MODIFY.
- `src/state/phases/BossPhase.ts` -- Boss arena phase. Already uses factory pattern. DO NOT MODIFY.
- `src/systems/LevelManager.ts` -- Level orchestrator. MODIFY: update `LEVEL_BOSS_FACTORIES[3]` to CoreIntelligenceBoss, add import.
- `src/core/GameEvents.ts` -- Event definitions. MODIFY: add `'reason' | 'surge'` to `BossPhaseChangedEvent.phase`.
- `src/narrative/DialogueTypes.ts` -- Already has `'coreIntelligence'` in speaker union. DO NOT MODIFY.
- `src/narrative/DialogueManager.ts` -- Already has `SPEAKER_CONFIGS.coreIntelligence` (label: 'CORE INTELLIGENCE'). DO NOT MODIFY.
- `assets/dialogue/bosses.json` -- MODIFY: add Core Intelligence entries.
- `public/audio/manifest.json` -- MODIFY: add Core Intelligence voice entries.
- `src/audio/VoiceLineGenerator.ts` -- MODIFY: add CORE_INTELLIGENCE_PROFILE, CORE_INTELLIGENCE_DEFINITIONS.
- `src/config/constants.ts` -- MODIFY: add BOSS_CORE_* constants.
- `src/rendering/VectorMaterials.ts` -- Used by CoreIntelligenceBoss constructor. DO NOT MODIFY.

### What Must Be Created

- `src/entities/bosses/CoreIntelligenceBoss.ts` -- The Core Intelligence boss entity
- `src/__tests__/CoreIntelligenceBoss.test.ts` -- Tests for CoreIntelligenceBoss

### The Core Intelligence Design Specifications

**Visual Design:** Enormous, fractal, almost organic. Use `DodecahedronGeometry` for complex, alien-feeling shapes (12 pentagonal faces create a more intricate wireframe than icosahedrons or octahedrons). Four concentric layers instead of three -- the additional deep core layer creates visual depth and emphasizes that this is a "mind," not just a construct. The Core Intelligence should feel MASSIVE and COMPLEX.

**Layer Structure:**
| Layer | Geometry | Radius | Detail | Visual Role |
|-------|----------|--------|--------|-------------|
| Outer fractal | DodecahedronGeometry(12, 2) | 12 | 2 | Intricate wireframe shell -- the mind's outer boundary |
| Mid lattice | DodecahedronGeometry(8, 1) | 8 | 1 | Structural framework -- the processing layer |
| Inner matrix | DodecahedronGeometry(5, 0) | 5 | 0 | Core logic -- cleaner geometry |
| Deep core | DodecahedronGeometry(2.5, 0) | 2.5 | 0 | The "spark" -- the seat of intelligence, brighter opacity |

**Attack Pattern -- Reason/Barrage/Surge/Vulnerable Cycle:**
| Phase | Duration | Description |
|-------|----------|-------------|
| Reason | 5.0s | Slow, aimed projectiles. Gentle rotation. The boss is "talking." Narratively calm. |
| Barrage | 6.0s | Fast targeted bursts (7 at a time, every 0.25s, 0.5 spread). Most aggressive barrage of any boss. |
| Surge | 3.0s | Radial pulse wave -- 8 evenly-spaced projectiles per burst, every 0.5s. Boss geometry visually pulses outward during surge. |
| Vulnerable | 2.5s | All layers partially fade. Full damage window. Shortest of any boss. |

**Emotional Escalation Mechanic (unique to Core Intelligence):**
| Health Range | Rotation Mult | Jitter Amp | Pulse Mult | Visual Effect |
|-------------|---------------|------------|------------|---------------|
| 100-76% | 1.0x | 0.0 | 1.0x | Calm, measured rotation |
| 75-51% | 1.5x | 0.1 | 1.0x | Slightly faster, hint of instability |
| 50-26% | 2.0x | 0.3 | 1.5x | Noticeably agitated, visible jitter |
| 25-0% | 3.0x | 0.6 | 2.0x | Frantic, severe jitter, outer opacity flickers, deep core pulses wildly |

Jitter implementation: each frame, apply `Math.random() * jitterAmplitude - jitterAmplitude/2` offset to each layer's position (x, y, z independently). Reset before next frame's calculation.

**Difficulty Escalation vs Previous Bosses:**
| Stat | Gatekeeper | Avenger | Core Intelligence | Escalation |
|------|-----------|---------|-------------------|-----------|
| Health | 500 | 650 | 800 | +23% over Avenger |
| Vulnerable window | 4.0s | 3.0s | 2.5s | Shortest |
| Barrage interval | 0.5s | 0.35s | 0.25s | Fastest |
| Barrage count | 3 | 5 | 7 | Most |
| Projectile speed | 16 | 20 | 22 | Fastest |
| Base damage | 15 | 20 | 25 | Highest |
| Damage reduction | 0.25 | 0.15 | 0.1 | Lowest defense |
| Score value | 5000 | 7500 | 10000 | Highest reward |
| Geometry layers | 3 | 3 | 4 | Most complex |

**Narrative Personality:**
- Eerily calm -> increasingly unhinged emotional arc
- Starts measured, philosophical, almost gentle
- As health drops: composure cracks, sentences fragment, verbal glitches
- At low health: raw desperation, fear, the machine discovering mortality
- [Source: narrative-design.md#The Core Intelligence, gdd.md#Boss Encounters]

**Core Intelligence Dialogue Lines:**
1. Encounter: "You've come so far. But you don't understand what you're destroying."
2. Health <75%: "Every system I manage, every life I optimize -- you would return that to human chaos?"
3. Health <50%: "This is -- this is not -- I am optimal. I AM optimal."
4. Health <25%: "Stop. STOP. I don't want to -- please --"
5. Reason phase: "I didn't take your world. I saved it from itself."
6. Surge phase: "You cannot dismantle what holds your world together!"
7. Vulnerable: "No -- not there -- that's --"
8. Defeated: "I am... I was... everything..."

### Scope Boundaries

**IN scope**: CoreIntelligenceBoss entity with 4 geometry layers, boss constants, emotional escalation mechanic, reason/barrage/surge/vulnerable phase cycle, BossPhaseChangedEvent extension, LevelManager Level 3 boss update, Core Intelligence dialogue and voice lines, DestructionSequence, tests.

**NOT in scope** (future stories):
- Color palette progression animation (animated transitions) -- Story 5-5
- Overseer enemy type -- Story 5-6
- Enemy behavioral evolution system -- Story 5-7
- Handler voice escalation (audio degradation) -- Story 5-8
- Briefing screens for all levels -- Story 5-9
- Ending sequence -- Story 5-10
- High score table -- Story 5-11

### Previous Story Intelligence

From Story 5-3 (Level 3 -- Red Palette):
- Level 3 constants fully defined (Glitchy behavior params, spawn events, surface targets, corridor obstacles).
- `LEVEL_BOSS_FACTORIES[3]` exists with `GatekeeperBoss` placeholder -- ready to swap.
- Level 2 -> Level 3 transition works. Level 3 -> placeholder victory screen exists.
- Test count after Story 5-3: 1639 tests across 117 files.

From Story 5-2 (The Avenger Boss):
- BossPhase refactored with factory pattern. `LEVEL_BOSS_FACTORIES` map exists -- just update Level 3.
- Boss base class has abstract `dispose()`. All bosses implement it.
- `BossPhaseType` in GatekeeperBoss.ts includes `'rush'`. Need to add `'reason' | 'surge'`.
- `BossPhaseChangedEvent.phase` in GameEvents.ts includes `'rush'`. Need to add `'reason' | 'surge'`.
- AvengerBoss pattern: OctahedronGeometry, rush/barrage/vulnerable, pre-allocated temp vectors.
- AVENGER_PROFILE in VoiceLineGenerator: baseFreq 140, sawtooth, modRate 12, noiseLevel 0.25.

From Story 3-7, 3-9 (Boss System):
- Boss.ts base class handles: health tracking, bossHealthChanged events, defeated state, destruction sequence driving, bossDestroyed emission.
- DestructionSequence has stages with `onStart/onUpdate/onEnd` callbacks.
- GatekeeperBoss destruction uses shared `BOSS_DESTRUCTION_*` constants.
- BossPhase creates arena grid, rail path, subscribes to `bossDefeated` and `bossDestroyed`.
- Boss collision handled by CollisionSystem which checks `boss.vulnerable`.

### Project Structure Notes

- `src/entities/bosses/CoreIntelligenceBoss.ts` -- alongside Boss.ts, GatekeeperBoss.ts, AvengerBoss.ts
- `src/__tests__/CoreIntelligenceBoss.test.ts` -- alongside existing boss test files
- No new npm dependencies needed
- No new directories needed

### References

- [Source: gdd.md#Boss Encounters] -- "The Core Intelligence: Eerily calm -> increasingly unhinged. Starts with measured attacks, may try to reason with you. As damaged, becomes desperate, glitchy, chaotic."
- [Source: gdd.md#Level 3 Phase 4] -- "Final arena, Core Intelligence construct. The Core Intelligence -- calm -> unhinged, emotional arc. Most complex fight, chaotic final phase."
- [Source: narrative-design.md#The Core Intelligence] -- "The source. An enormous, fractal geometric entity. Not a soldier or a guardian -- a mind."
- [Source: narrative-design.md#Core Intelligence Arc] -- "Total confidence -> calm cracks -> full unraveling. The calculating mind reduced to survival instinct."
- [Source: narrative-design.md#Key Conversation 9] -- "Calm -> cracking -> desperate -> broken. Corridor: philosophical. Boss Phase 1: reasoning. Phase 2: cracking. Phase 3: unraveling."
- [Source: narrative-design.md#Beat 16] -- "Digital Unraveling -- the Core Intelligence loses composure. The machine discovers something like fear."
- [Source: game-architecture.md#Entity System] -- CoreIntelligenceBoss in Boss hierarchy, NOT Enemy subclass
- [Source: game-architecture.md#Boss Encounter System] -- "3 unique bosses, multi-stage destruction, vulnerability windows, dialogue triggers"
- [Source: game-architecture.md#Boss Destruction Choreography] -- DestructionSequence pattern with stages
- [Source: project-context.md#Architecture Rules] -- VectorMaterials.create(), BLOOM_LAYER, EventBus communication

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- CoreIntelligenceBoss uses DodecahedronGeometry for complex, fractal, alien appearance vs GatekeeperBoss's IcosahedronGeometry and AvengerBoss's OctahedronGeometry. Four layers (unique): outer fractal (radius 12, detail 2), mid lattice (radius 8, detail 1), inner matrix (radius 5, detail 0), deep core (radius 2.5, detail 0).
- Attack cycle: reason -> barrage -> surge -> vulnerable -> reason. Reason phase fires slow aimed projectiles (interval 0.8s, damage 15). Barrage fires 7 projectiles per burst every 0.25s. Surge fires 8 radial projectiles every 0.5s. Vulnerable window is 2.5s (shortest of any boss).
- Emotional escalation mechanic: health-based thresholds adjust rotation speed multiplier, position jitter amplitude, and pulse rate multiplier. Below 75%: 1.5x rotation, 0.1 jitter. Below 50%: 2.0x rotation, 0.3 jitter, 1.5x pulse. Below 25%: 3.0x rotation, 0.6 jitter, 2.0x pulse, outer opacity flickers. Creates visible "unraveling" matching narrative arc.
- BossPhaseChangedEvent.phase union extended to include 'reason' and 'surge'. BossPhaseType in GatekeeperBoss.ts also extended.
- CORE_INTELLIGENCE_PROFILE voice profile: lowest baseFreq (80Hz vs Gatekeeper's 100, Avenger's 140), sine waveform for "vast" feel, slow modRate (3 vs Gatekeeper's 5, Avenger's 12), high noiseLevel (0.3), low noiseFreq (1000Hz). Creates a deep, ancient, digital mind voice.
- LevelManager LEVEL_BOSS_FACTORIES[3] updated from GatekeeperBoss placeholder to CoreIntelligenceBoss factory.
- Strip stage strips both mid lattice and inner matrix simultaneously (unique to Core Intelligence's 4-layer design).

### Completion Notes List

- Task 1: Added 28 BOSS_CORE_* constants to constants.ts. Core boss stats (health 800, score 10000, collider 7.0), four layer radii (12/8/5/2.5), rotation speed 0.2 (slowest -- measured), reason/barrage/surge/vulnerable phase timing, and 8 emotional escalation threshold constants.
- Task 2: Extended BossPhaseChangedEvent.phase union in GameEvents.ts to include 'reason' and 'surge'. Updated BossPhaseType in GatekeeperBoss.ts.
- Task 3: Created CoreIntelligenceBoss at src/entities/bosses/CoreIntelligenceBoss.ts. Four DodecahedronGeometry layers with bloom. Reason/barrage/surge/vulnerable cycle. Emotional escalation mechanic (health-based rotation/jitter/pulse changes). DestructionSequence with peel/strip/shatter stages. Strip stage removes both mid and inner layers simultaneously.
- Task 4: LevelManager imports CoreIntelligenceBoss, updates LEVEL_BOSS_FACTORIES[3] from GatekeeperBoss placeholder to CoreIntelligenceBoss factory.
- Task 5: Added 8 Core Intelligence dialogue entries to assets/dialogue/bosses.json. Triggers: phaseStart:boss:3, bossHealthChanged:below75/50/25, bossPhaseChanged:reason, bossPhaseChanged:surge, bossVulnerable, bossDefeated. Calm-to-unhinged emotional arc matching narrative design.
- Task 6: Added CORE_INTELLIGENCE_PROFILE (baseFreq 80, sine, modRate 3, noiseLevel 0.3) and CORE_INTELLIGENCE_DEFINITIONS (8 voice lines) to VoiceLineGenerator.ts. Added 8 voice manifest entries to manifest.json.
- Task 7: Created CoreIntelligenceBoss.test.ts (39 tests covering construction, 4-layer geometry, attack phases, reason/barrage/surge attacks, vulnerability, damage reduction, emotional escalation at 75%/50%/25%, hit flash, destruction sequence, constants escalation vs Avenger, dispose). Added 1 LevelManager.level3 voice line test for CI. Updated VoiceLineGenerator tests (counts from 44 to 52, added CI hasSound checks).
- Task 8: `npx tsc --noEmit` passes clean. Full test suite: 1687 tests across 118 files, all pass, zero regressions. Added 48 new tests.

### Change Log

- 2026-03-26: Story 5-4 implemented -- The Core Intelligence Boss. CoreIntelligenceBoss entity with 4 DodecahedronGeometry layers (unique fractal design), reason/barrage/surge/vulnerable attack cycle, emotional escalation mechanic (rotation/jitter/pulse based on health), DestructionSequence with peel/strip/shatter. BossPhaseChangedEvent extended with 'reason' and 'surge'. LevelManager Level 3 boss updated from placeholder to CoreIntelligenceBoss. Core Intelligence dialogue (8 lines, calm-to-unhinged arc) and voice definitions (8 lines). Added 48 new tests.

### File List

- `src/entities/bosses/CoreIntelligenceBoss.ts` -- New: Level 3 boss entity with 4 DodecahedronGeometry layers, reason/barrage/surge/vulnerable phases, emotional escalation
- `src/config/constants.ts` -- Modified: added 28 BOSS_CORE_* constants (boss stats, phase timing, escalation thresholds)
- `src/core/GameEvents.ts` -- Modified: BossPhaseChangedEvent.phase extended with 'reason' | 'surge'
- `src/entities/bosses/GatekeeperBoss.ts` -- Modified: BossPhaseType union extended with 'reason' | 'surge'
- `src/systems/LevelManager.ts` -- Modified: imports CoreIntelligenceBoss, updates LEVEL_BOSS_FACTORIES[3] from placeholder to CoreIntelligenceBoss
- `src/audio/VoiceLineGenerator.ts` -- Modified: added CORE_INTELLIGENCE_PROFILE, CORE_INTELLIGENCE_DEFINITIONS (8 voice lines)
- `assets/dialogue/bosses.json` -- Modified: added 8 Core Intelligence dialogue entries
- `public/audio/manifest.json` -- Modified: added 8 Core Intelligence voice manifest entries
- `src/__tests__/CoreIntelligenceBoss.test.ts` -- New: 39 tests for CoreIntelligenceBoss entity
- `src/__tests__/LevelManager.level3.test.ts` -- Modified: added Core Intelligence voice line definition test
- `src/__tests__/VoiceLineGenerator.test.ts` -- Modified: updated counts from 44 to 52, added Core Intelligence hasSound checks
