# Story 5.8: Handler Voice Escalation

Status: review

## Story

As a player,
I want to hear handler voice lines escalating from invested to desperate,
so that the narrative arc completes and each level feels emotionally distinct.

## Acceptance Criteria

1. **Three distinct handler voice profiles exist** in `VoiceLineGenerator.ts`: `HANDLER_PROFILE_L1` (calm/clinical), `HANDLER_PROFILE_L2` (invested/urgent), `HANDLER_PROFILE_L3` (desperate/strained). Each profile differs in `baseFreq`, `modRate`, `modDepth`, `noiseLevel`, `freqDrift`, and `attack`/`release` to create audibly distinct tonal character per level.

2. **Level 1 handler voice lines** use `HANDLER_PROFILE_L1` (the current `HANDLER_PROFILE` values — 180Hz base, square wave, 8Hz mod rate, 0.3 mod depth, 0.1 noise). These are calm, clinical, professional. No change in audio character from current behavior.

3. **Level 2 handler voice lines** use `HANDLER_PROFILE_L2`: higher `baseFreq` (~200Hz), faster `modRate` (~11Hz), deeper `modDepth` (~0.4), slightly more noise (~0.15), shorter `attack` (~0.015s). The voice sounds more tense, faster-paced — the handler is invested and concerned.

4. **Level 3 handler voice lines** use `HANDLER_PROFILE_L3`: higher `baseFreq` (~220Hz), fastest `modRate` (~14Hz), deepest `modDepth` (~0.5), most noise (~0.25), larger `freqDrift` (~60Hz), shortest `attack` (~0.01s). The voice sounds strained, desperate — the handler is losing composure.

5. **Tutorial lines** continue using the Level 1 profile (`HANDLER_PROFILE_L1`). The handler is calm during onboarding.

6. **Handler voice line definitions are updated**: All existing Level 2 handler entries (`handler_l2_*`) use `HANDLER_PROFILE_L2`. All existing Level 3 handler entries (`handler_l3_*`) use `HANDLER_PROFILE_L3`. Level 1 entries (`handler_phase1_start`, `handler_first_kill`, `handler_surface_start`, `handler_corridor_start`, `handler_corridor_encourage`, `handler_boss_start`, `handler_boss_vulnerable`, `handler_level_complete`) continue using `HANDLER_PROFILE_L1`.

7. **Additional handler dialogue lines for Level 2** are added to `handler.json`: mid-phase encouragement/warnings during combat that reflect the handler's invested tone. At minimum: one line for first enemy kill in Level 2, one for boss vulnerability in Level 2. Each has a matching voice definition using `HANDLER_PROFILE_L2`.

8. **Additional handler dialogue lines for Level 3** are added to `handler.json`: desperate, emotional lines during combat. At minimum: one line for first enemy kill in Level 3, one for boss vulnerability in Level 3. Each has a matching voice definition using `HANDLER_PROFILE_L3`.

9. **DialogueManager speaker configs are palette-aware**: The `SPEAKER_CONFIGS` in `DialogueManager.ts` no longer use hardcoded `'#00ff41'` green. Instead, `showNext()` uses `getPaletteHexColor()` to get the current palette color when no explicit color override is provided. This ensures handler text matches the current level's palette (green/amber/red).

10. **DialogueManager speaker config color field becomes optional**: The `DialogueSpeakerConfig.color` field is made optional (or removed). When `color` is absent, `showNext()` passes `undefined` to `CommOverlay.show()`, which already falls back to `getPaletteHexColor()`. Boss speakers can still override with a specific color if desired.

11. **New constants** for escalation profile parameters are defined in `src/config/constants.ts`:
    - `HANDLER_L2_BASE_FREQ = 200`
    - `HANDLER_L2_MOD_RATE = 11`
    - `HANDLER_L2_MOD_DEPTH = 0.4`
    - `HANDLER_L2_NOISE_LEVEL = 0.15`
    - `HANDLER_L2_ATTACK = 0.015`
    - `HANDLER_L3_BASE_FREQ = 220`
    - `HANDLER_L3_MOD_RATE = 14`
    - `HANDLER_L3_MOD_DEPTH = 0.5`
    - `HANDLER_L3_NOISE_LEVEL = 0.25`
    - `HANDLER_L3_FREQ_DRIFT = 60`
    - `HANDLER_L3_ATTACK = 0.01`

12. Running `npx tsc --noEmit` produces zero TypeScript errors.

13. Unit tests exist (Vitest) for:
    - VoiceLineGenerator: Level 2 handler lines use different profile parameters than Level 1 (different sample rates or freq check)
    - VoiceLineGenerator: Level 3 handler lines use different profile parameters than Level 1 and Level 2
    - VoiceLineGenerator: tutorial lines still use Level 1 profile
    - VoiceLineGenerator: new additional dialogue voice line IDs exist and are generateable
    - VoiceLineGenerator: total voice line count is updated to reflect new entries
    - DialogueManager: speaker configs use palette-aware colors (not hardcoded green)
    - DialogueManager: palette color changes between levels are reflected in comm overlay
    - Handler.json: new Level 2 and Level 3 additional dialogue entries exist with correct triggers and speakers
    - Constants: all new escalation constants exist with correct values

14. All existing tests continue to pass -- zero regressions.

## Tasks / Subtasks

- [x] Task 1: Add handler escalation constants to `src/config/constants.ts` (AC: #11)
  - [x] 1.1 Add `HANDLER_L2_BASE_FREQ = 200`
  - [x] 1.2 Add `HANDLER_L2_MOD_RATE = 11`
  - [x] 1.3 Add `HANDLER_L2_MOD_DEPTH = 0.4`
  - [x] 1.4 Add `HANDLER_L2_NOISE_LEVEL = 0.15`
  - [x] 1.5 Add `HANDLER_L2_ATTACK = 0.015`
  - [x] 1.6 Add `HANDLER_L3_BASE_FREQ = 220`
  - [x] 1.7 Add `HANDLER_L3_MOD_RATE = 14`
  - [x] 1.8 Add `HANDLER_L3_MOD_DEPTH = 0.5`
  - [x] 1.9 Add `HANDLER_L3_NOISE_LEVEL = 0.25`
  - [x] 1.10 Add `HANDLER_L3_FREQ_DRIFT = 60`
  - [x] 1.11 Add `HANDLER_L3_ATTACK = 0.01`

- [x] Task 2: Create per-level handler voice profiles in `VoiceLineGenerator.ts` (AC: #1, #2, #3, #4)
  - [x] 2.1 Rename existing `HANDLER_PROFILE` to `HANDLER_PROFILE_L1` (values unchanged)
  - [x] 2.2 Create `HANDLER_PROFILE_L2` using constants from Task 1: baseFreq=200, modRate=11, modDepth=0.4, noiseLevel=0.15, attack=0.015, keep waveform='square', sampleRate=11025, noiseFreq=2000, release=0.05, freqDrift=40
  - [x] 2.3 Create `HANDLER_PROFILE_L3` using constants from Task 1: baseFreq=220, modRate=14, modDepth=0.5, noiseLevel=0.25, attack=0.01, freqDrift=60, keep waveform='square', sampleRate=11025, noiseFreq=2000, release=0.05

- [x] Task 3: Update handler voice line definitions to use per-level profiles (AC: #5, #6)
  - [x] 3.1 Update all Level 1 handler definitions to use `HANDLER_PROFILE_L1` (rename from `HANDLER_PROFILE`)
  - [x] 3.2 Update all Level 2 handler definitions (`handler_l2_*`) to use `HANDLER_PROFILE_L2`
  - [x] 3.3 Update all Level 3 handler definitions (`handler_l3_*`) to use `HANDLER_PROFILE_L3`
  - [x] 3.4 Keep tutorial definitions using `HANDLER_PROFILE_L1`

- [x] Task 4: Add additional handler dialogue entries (AC: #7, #8)
  - [x] 4.1 Add to `handler.json`: `handler_l2_first_kill` — trigger: `firstEnemyDestroyed` with level 2 context, speaker: handler, text conveying invested tone (e.g., "That's one down. They're faster now, Cipher."), priority 1, duration 3
  - [x] 4.2 Add to `handler.json`: `handler_l2_boss_vulnerable` — trigger: `bossVulnerable`, speaker: handler, text conveying urgency (e.g., "Now! Hit it with everything!"), priority 2, duration 3
  - [x] 4.3 Add to `handler.json`: `handler_l3_first_kill` — trigger: `firstEnemyDestroyed` with level 3 context, speaker: handler, text conveying desperation (e.g., "Keep firing! Don't stop!"), priority 1, duration 3
  - [x] 4.4 Add to `handler.json`: `handler_l3_boss_vulnerable` — trigger: `bossVulnerable`, speaker: handler, text conveying desperate hope (e.g., "It's open! End this, Cipher! END THIS!"), priority 2, duration 3
  - [x] 4.5 Add matching voice definitions in `VoiceLineGenerator.ts` for each new handler line using appropriate level profile
  - [x] 4.6 Update DialogueManager trigger handling for level-specific firstEnemyDestroyed and bossVulnerable triggers

- [x] Task 5: Make DialogueManager speaker configs palette-aware (AC: #9, #10)
  - [x] 5.1 Import `getPaletteHexColor` in `DialogueManager.ts`
  - [x] 5.2 Remove hardcoded `color` from `SPEAKER_CONFIGS` entries (or make it optional)
  - [x] 5.3 In `showNext()`: when config exists but no explicit color override, pass `undefined` to `CommOverlay.show()` so it uses palette color. If config has an explicit color, still use that (allows boss-specific colors if needed).
  - [x] 5.4 Make `DialogueSpeakerConfig.color` optional in `DialogueTypes.ts`

- [x] Task 6: Update existing dialogue trigger handling for level-aware triggers (AC: #7, #8)
  - [x] 6.1 Update `DialogueManager` to track current level number (subscribe to `phaseStart` or add a `setLevel()` method)
  - [x] 6.2 For `firstEnemyDestroyed` trigger: append level suffix so Level 2 gets `firstEnemyDestroyed:2` and Level 3 gets `firstEnemyDestroyed:3`, while Level 1 keeps `firstEnemyDestroyed` (backward compatible)
  - [x] 6.3 For `bossVulnerable` trigger: similarly append level suffix for Level 2/3 entries
  - [x] 6.4 Update `handler.json` triggers to match the new level-specific trigger IDs

- [x] Task 7: Write tests (AC: #13, #14)
  - [x] 7.1 Create `src/__tests__/HandlerVoiceEscalation.test.ts` — test per-level profile parameters differ, test all new voice line IDs exist, test total count updated
  - [x] 7.2 Create `src/__tests__/HandlerVoiceEscalationConstants.test.ts` — test all 11 new constants with correct values
  - [x] 7.3 Add tests for DialogueManager palette-aware speaker configs
  - [x] 7.4 Add tests for new handler.json dialogue entries
  - [x] 7.5 Update existing `VoiceLineGenerator.test.ts` total count to reflect new entries
  - [x] 7.6 Verify all existing tests still pass

- [x] Task 8: Build verification (AC: #12, #14)
  - [x] 8.1 Run `npx tsc --noEmit` -- zero TypeScript errors
  - [x] 8.2 Run `npm run test` -- all tests pass, zero regressions

## Dev Notes

### Architecture Compliance

- **Entities never import systems.** No entity changes in this story. [Source: project-context.md#Architecture Rules]
- **Systems never import each other.** DialogueManager communicates via EventBus, does not import AudioManager system directly -- uses `audioManager` singleton (acceptable as it's a module-level utility). [Source: project-context.md#Architecture Rules]
- **UI never imports game logic.** CommOverlay receives display commands from DialogueManager -- it does not reach into game state. [Source: project-context.md#Architecture Rules]
- **Use `Logger.info/warn/error()`** -- NEVER `console.log()`. [Source: project-context.md#Critical Don't-Miss Rules]
- **`erasableSyntaxOnly: true`**: No `enum`. Use `type` unions and `as const` objects. [Source: tsconfig.json]
- **`verbatimModuleSyntax: true`**: Use `import type { ... }` for type-only imports. [Source: tsconfig.json]
- **No per-frame allocations.** No new per-frame code in this story. [Source: project-context.md#Performance Rules]
- **NEVER create materials directly.** No materials needed. [Source: project-context.md#Critical Implementation Rules]

### Critical Implementation Rules

- **VoiceLineGenerator uses `createVoiceDefinition()` factory.** All voice definitions are created with this function which takes a `VoiceProfile`, a duration, and an idHash. This is the established pattern -- do NOT invent a different voice creation approach.
- **`HANDLER_PROFILE` rename to `HANDLER_PROFILE_L1` is a refactor.** All existing references to `HANDLER_PROFILE` must be updated to `HANDLER_PROFILE_L1`. The Level 1 handler profile values MUST NOT change -- only the variable name changes.
- **Tutorial lines stay on Level 1 profile.** The handler is calm and professional during onboarding. Tutorial definitions reference `HANDLER_PROFILE_L1`, not L2 or L3.
- **Existing handler.json entries must not be changed.** Do NOT modify the text, trigger, priority, or duration of existing entries. Only ADD new entries to the array.
- **DialogueManager level-specific triggers.** The challenge is that `firstEnemyDestroyed` and `bossVulnerable` are generic events -- they don't carry a level number. The solution is to have `DialogueManager` track the current level (from `phaseStart` events) and generate level-specific trigger IDs internally.
- **CommOverlay already handles palette colors.** When `CommOverlay.show()` receives `undefined` for color, it calls `getPaletteHexColor()` and `getPaletteCSSGlow()` automatically. The fix is simply to stop passing explicit colors from DialogueManager when palette colors should be used.
- **Backward compatibility.** Level 1 `firstEnemyDestroyed` trigger must continue working for existing entries. The new level-specific triggers are ADDITIONAL, not replacements.

### Existing Code Patterns to Follow

- **VoiceLineGenerator.ts** at `src/audio/` -- Contains `HANDLER_PROFILE`, `createVoiceDefinition()`, `hashString()`, per-speaker profile objects, and the definitions records. Follow this exact pattern for new profiles.
- **DialogueManager.ts** at `src/narrative/` -- Contains `SPEAKER_CONFIGS`, event subscriptions, `handleTrigger()`, `showNext()`. Modify `SPEAKER_CONFIGS` and `showNext()` for palette awareness.
- **DialogueTypes.ts** at `src/narrative/` -- Contains `DialogueSpeakerConfig` interface. Make `color` field optional.
- **CommOverlay.ts** at `src/ui/screens/` -- Already has palette-color fallback in `show()`. No changes needed to CommOverlay.
- **handler.json** at `assets/dialogue/` -- JSON array of dialogue entries. Follow existing format exactly.
- **constants.ts** at `src/config/` -- Add new constants at end of file in a clearly labeled section.

### What Already Exists (DO NOT recreate)

- `src/audio/VoiceLineGenerator.ts` -- Voice synthesis system with profiles and definitions. MODIFY to add new profiles and update definitions.
- `src/narrative/DialogueManager.ts` -- Trigger evaluation and display. MODIFY for palette awareness and level tracking.
- `src/narrative/DialogueTypes.ts` -- Type definitions. MODIFY to make `color` optional.
- `src/ui/screens/CommOverlay.ts` -- HTML overlay display. DO NOT MODIFY (already has palette fallback).
- `src/core/GameEvents.ts` -- Event definitions. DO NOT MODIFY (no new events needed).
- `src/core/EventBus.ts` -- Pub/sub system. DO NOT MODIFY.
- `src/audio/AudioManager.ts` -- Audio channel management. DO NOT MODIFY.
- `src/audio/AudioChannel.ts` -- Single channel. DO NOT MODIFY.
- `src/audio/SFXGenerator.ts` -- SFX synthesis. DO NOT MODIFY.
- `src/rendering/PaletteColors.ts` -- Palette CSS utilities. DO NOT MODIFY (already provides `getPaletteHexColor()`).
- `assets/dialogue/handler.json` -- Handler dialogue entries. MODIFY to add new entries only.
- `assets/dialogue/tutorial.json` -- Tutorial dialogue. DO NOT MODIFY.
- `assets/dialogue/bosses.json` -- Boss dialogue. DO NOT MODIFY.

### What Must Be Created

- `src/__tests__/HandlerVoiceEscalation.test.ts` -- Tests for per-level voice profiles and new dialogue
- `src/__tests__/HandlerVoiceEscalationConstants.test.ts` -- Tests for new constants

### What Must Be Modified

- `src/config/constants.ts` -- Add 11 new handler escalation constants
- `src/audio/VoiceLineGenerator.ts` -- Rename HANDLER_PROFILE to HANDLER_PROFILE_L1, add L2/L3 profiles, update definitions, add new voice line entries
- `src/narrative/DialogueManager.ts` -- Remove hardcoded speaker colors, add level tracking, generate level-specific trigger IDs
- `src/narrative/DialogueTypes.ts` -- Make `DialogueSpeakerConfig.color` optional
- `assets/dialogue/handler.json` -- Add 4 new handler dialogue entries
- `src/__tests__/VoiceLineGenerator.test.ts` -- Update total voice line count assertion

### Handler Voice Escalation Summary

| Level | Profile | baseFreq | modRate | modDepth | noiseLevel | freqDrift | Tone |
|-------|---------|----------|---------|----------|------------|-----------|------|
| Tutorial | L1 | 180Hz | 8Hz | 0.3 | 0.1 | 40Hz | Calm, clinical |
| 1 | L1 | 180Hz | 8Hz | 0.3 | 0.1 | 40Hz | Calm, professional |
| 2 | L2 | 200Hz | 11Hz | 0.4 | 0.15 | 40Hz | Invested, urgent |
| 3 | L3 | 220Hz | 14Hz | 0.5 | 0.25 | 60Hz | Desperate, strained |

### Narrative Arc per Level

- **Level 1 (Green)**: Handler is calm, clinical, guiding. "Stay sharp." "Good kill." Professional distance.
- **Level 2 (Amber)**: Handler is invested, concerned, urgent. "They've adapted." "Are you sure about this?" Personal stakes emerging.
- **Level 3 (Red)**: Handler is desperate, emotional, strained. "Everything here wants you dead." "Don't stop. Don't stop." Composure lost.

### Scope Boundaries

**IN scope**: Per-level handler voice profiles, updating existing handler line definitions to use correct profiles, additional handler dialogue lines for Levels 2-3, palette-aware speaker configs in DialogueManager, level tracking in DialogueManager, constants, tests.

**NOT in scope** (future stories):
- Briefing screens for all levels -- Story 5-9
- Ending sequence -- Story 5-10
- High score table -- Story 5-11
- Cyberspace fragmentation ending -- Story 5-12

### Previous Story Intelligence

From Story 5-7 (Enemy Behavioral Evolution):
- Test count after Story 5-7: 1807 tests across 125 files.
- `erasableSyntaxOnly: true` -- No enums. Use type unions and `as const` objects.
- `verbatimModuleSyntax: true` -- Use `import type { ... }` for type-only imports.
- All behavioral variation driven by params, not level conditionals.

From Story 4-9 (Synthesized Handler Voice Lines):
- VoiceLineGenerator established the pattern for voice profiles and definitions.
- `createVoiceDefinition()` takes `(profile, duration, idHash)`.
- `hashString()` provides deterministic variation per line ID.
- Total count was 52 voice lines (8 L1 handler + 5 L2 handler + 5 L3 handler + 10 tutorial + 9 gatekeeper + 7 avenger + 8 core intelligence).
- Test in VoiceLineGenerator.test.ts checks `ids.length === 52` and `total: 52` -- these must be updated.

### Project Structure Notes

- All changes are in existing files or new test files
- No new directories needed
- No new npm dependencies needed
- Test files go in `src/__tests__/` alongside existing test files

### References

- [Source: gdd.md#Voice/Dialogue] -- "Handler: Calm/clinical -> invested -> desperate (escalates across levels)"
- [Source: gdd.md#Loop Variation] -- "intensifying narrative (calm handler -> desperate handler)"
- [Source: gdd.md#Narrative Progression] -- "Handler arc escalates from calm professionalism to desperate urgency"
- [Source: gdd.md#Narrative Pressure] -- "Handler's growing desperation and AI's increasing hostility raise emotional stakes"
- [Source: gdd.md#Narrative Validation] -- "Players mention the handler as a memorable character -- her arc from calm to desperate registers"
- [Source: epics.md#Epic 5 Story 8] -- "As a player, I can hear handler voice lines escalating from invested to desperate so that the narrative arc completes"
- [Source: game-architecture.md#Narrative System] -- "DialogueManager subscribes to events. Evaluates trigger conditions from JSON."
- [Source: project-context.md#Architecture Rules] -- "Systems never import each other."

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- HANDLER_PROFILE renamed to HANDLER_PROFILE_L1 (values unchanged). All 28 references updated via replace-all.
- HANDLER_PROFILE_L2 uses constants: baseFreq=200, modRate=11, modDepth=0.4, noiseLevel=0.15, attack=0.015. Other values (waveform, sampleRate, noiseFreq, release, freqDrift) match L1.
- HANDLER_PROFILE_L3 uses constants: baseFreq=220, modRate=14, modDepth=0.5, noiseLevel=0.25, freqDrift=60, attack=0.01. Other values match L1.
- Level 2 handler lines (handler_l2_*) now use HANDLER_PROFILE_L2 instead of HANDLER_PROFILE_L1.
- Level 3 handler lines (handler_l3_*) now use HANDLER_PROFILE_L3 instead of HANDLER_PROFILE_L1.
- Tutorial lines remain on HANDLER_PROFILE_L1 (calm handler during onboarding).
- DialogueManager.SPEAKER_CONFIGS removed hardcoded color '#00ff41' from all 4 speaker entries. CommOverlay.show() falls back to getPaletteHexColor() when color is undefined.
- DialogueManager tracks currentLevel via phaseStart events. Level-specific triggers (firstEnemyDestroyed:2, bossVulnerable:2, etc.) fire in addition to generic triggers for Level 2+.
- Level 1 backward compatibility preserved: generic triggers still fire, level-specific triggers only fire for currentLevel > 1.
- DialogueTypes.ts: DialogueSpeakerConfig.color changed from required string to optional string.
- Existing DialogueManager.test.ts updated: 24 occurrences of '#00ff41' changed to undefined to match palette-aware behavior.
- VoiceLineGenerator.test.ts updated: total count 52 -> 56 (4 new handler lines added).

### Completion Notes List

- Task 1: Added 11 handler escalation constants to constants.ts: HANDLER_L2_BASE_FREQ=200, HANDLER_L2_MOD_RATE=11, HANDLER_L2_MOD_DEPTH=0.4, HANDLER_L2_NOISE_LEVEL=0.15, HANDLER_L2_ATTACK=0.015, HANDLER_L3_BASE_FREQ=220, HANDLER_L3_MOD_RATE=14, HANDLER_L3_MOD_DEPTH=0.5, HANDLER_L3_NOISE_LEVEL=0.25, HANDLER_L3_FREQ_DRIFT=60, HANDLER_L3_ATTACK=0.01.
- Task 2: Created HANDLER_PROFILE_L1 (renamed from HANDLER_PROFILE), HANDLER_PROFILE_L2, and HANDLER_PROFILE_L3 in VoiceLineGenerator.ts. Each profile has distinct baseFreq, modRate, modDepth, noiseLevel, attack, and freqDrift parameters.
- Task 3: Updated all Level 2 handler definitions to use HANDLER_PROFILE_L2 and all Level 3 handler definitions to use HANDLER_PROFILE_L3. Tutorial and Level 1 lines remain on HANDLER_PROFILE_L1.
- Task 4: Added 4 new handler dialogue entries to handler.json (handler_l2_first_kill, handler_l2_boss_vulnerable, handler_l3_first_kill, handler_l3_boss_vulnerable) with matching voice definitions in VoiceLineGenerator.ts using appropriate level profiles.
- Task 5: Made DialogueSpeakerConfig.color optional. Removed hardcoded '#00ff41' from all SPEAKER_CONFIGS entries. CommOverlay palette fallback now handles color dynamically.
- Task 6: Added currentLevel tracking in DialogueManager (set from phaseStart events). firstEnemyDestroyed and bossVulnerable now fire level-specific triggers (e.g., firstEnemyDestroyed:2) for Level 2+ in addition to generic triggers.
- Task 7: Created HandlerVoiceEscalation.test.ts (25 tests) and HandlerVoiceEscalationConstants.test.ts (13 tests). Updated existing DialogueManager.test.ts (24 color assertions) and VoiceLineGenerator.test.ts (count assertions). Total: 38 new tests.
- Task 8: `npx tsc --noEmit` passes clean. Full test suite: 1845 tests across 127 files, all pass, zero regressions.

### Change Log

- 2026-03-26: Story 5-8 implemented -- Handler Voice Escalation. Created 3 per-level handler voice profiles (L1 calm, L2 invested, L3 desperate) with escalating synthesis parameters. Updated all handler voice line definitions to use appropriate level profiles. Added 4 new handler dialogue lines for Levels 2 and 3 (first kill, boss vulnerable). Made DialogueManager speaker colors palette-aware instead of hardcoded green. Added level tracking and level-specific trigger IDs for firstEnemyDestroyed and bossVulnerable. Added 38 new tests.

### File List

- `src/config/constants.ts` -- Modified: added 11 handler voice escalation constants (HANDLER_L2_BASE_FREQ, HANDLER_L2_MOD_RATE, HANDLER_L2_MOD_DEPTH, HANDLER_L2_NOISE_LEVEL, HANDLER_L2_ATTACK, HANDLER_L3_BASE_FREQ, HANDLER_L3_MOD_RATE, HANDLER_L3_MOD_DEPTH, HANDLER_L3_NOISE_LEVEL, HANDLER_L3_FREQ_DRIFT, HANDLER_L3_ATTACK)
- `src/audio/VoiceLineGenerator.ts` -- Modified: renamed HANDLER_PROFILE to HANDLER_PROFILE_L1, added HANDLER_PROFILE_L2 and HANDLER_PROFILE_L3, updated all Level 2/3 handler definitions to use new profiles, added 4 new voice line definitions
- `src/narrative/DialogueManager.ts` -- Modified: removed hardcoded speaker colors (palette-aware), added currentLevel tracking, added level-specific triggers for firstEnemyDestroyed and bossVulnerable
- `src/narrative/DialogueTypes.ts` -- Modified: made DialogueSpeakerConfig.color optional
- `assets/dialogue/handler.json` -- Modified: added 4 new handler dialogue entries (handler_l2_first_kill, handler_l2_boss_vulnerable, handler_l3_first_kill, handler_l3_boss_vulnerable)
- `src/__tests__/HandlerVoiceEscalation.test.ts` -- New: 25 tests for per-level voice profiles, palette-aware speaker configs, level tracking, and level-specific triggers
- `src/__tests__/HandlerVoiceEscalationConstants.test.ts` -- New: 13 tests for escalation constants with correct values and escalation progression
- `src/__tests__/DialogueManager.test.ts` -- Modified: updated 24 color assertions from '#00ff41' to undefined (palette-aware)
- `src/__tests__/VoiceLineGenerator.test.ts` -- Modified: updated total voice line count from 52 to 56
