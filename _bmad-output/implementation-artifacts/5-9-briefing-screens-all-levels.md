# Story 5.9: Briefing Screens All Levels

Status: review

## Story

As a player,
I want to see briefing screens between all levels,
so that each level is contextualized with narrative setup and handler voice-over.

## Acceptance Criteria

1. **Briefing voice line definitions exist** in `VoiceLineGenerator.ts` for all 3 levels: `briefing_l1` (Level 1, handler L1 profile), `briefing_l2` (Level 2, handler L2 profile), `briefing_l3` (Level 3, handler L3 profile). Each voice definition uses `createVoiceDefinition()` with the appropriate per-level handler profile and a duration of 4.0 seconds (matching the ~30-second scroll with multiple voice bursts).

2. **BriefingData interface extended** with an optional `voiceLineId` field: `voiceLineId?: string`. This allows each briefing JSON to specify a voice line to play when the briefing screen shows. The existing `speaker` field remains for future use.

3. **Briefing JSON files updated** with `voiceLineId` fields: `level-1.json` includes `"voiceLineId": "briefing_l1"`, `level-2.json` includes `"voiceLineId": "briefing_l2"`, `level-3.json` includes `"voiceLineId": "briefing_l3"`.

4. **BriefingPhase plays handler voice line** on `enter()`: After creating and showing the BriefingScreen, BriefingPhase calls `audioManager.playVoice(briefingData.voiceLineId)` if the `voiceLineId` field is present. This provides the "handler voice-over" described in the narrative design document.

5. **BriefingScreen uses palette-aware colors** for all levels. The existing implementation already calls `getPaletteHexColor()`, `getPaletteCSSGlow()`, and `getPaletteCSSMultiGlow()` in `buildDOM()`. No changes needed -- Level 1 shows green text, Level 2 shows amber text, Level 3 shows red text, because `VectorMaterials.setPalette()` is called in `LevelManager.startLevel()` before the briefing phase enters.

6. **Level 2 briefing content** in `level-2.json` matches narrative design requirements: establishes that the AI network knows Cipher, raises stakes from "long shot" to "personal war," sets up The Avenger, mentions Overseers and coordinated enemy behavior, conveys Ghost's invested/urgent tone. Content is 6-10 lines, ~200 words.

7. **Level 3 briefing content** in `level-3.json` matches narrative design requirements: establishes point of no return, no extraction protocol, Ghost's composure breaks, commits to the finale, describes the Core Intelligence, conveys Ghost's desperate/scared tone. Content is 8-12 lines, ~250 words.

8. **Level 1 briefing content** in `level-1.json` remains unchanged. The existing 8 lines of professional, urgent Ghost dialogue are correct per the narrative design.

9. **LevelManager already loads briefing data for all 3 levels** via `setBriefingData()` and creates `BriefingPhase` instances. No changes needed to LevelManager. Verified: `buildLevel1Phases()` creates briefing phase for level 1, `buildLevelPhases()` creates briefing phase for levels 2+.

10. **main.ts already fetches all 3 briefing JSON files** and calls `levelManager.setBriefingData(data, level)` for each. No changes needed to main.ts.

11. Running `npx tsc --noEmit` produces zero TypeScript errors.

12. Unit tests exist (Vitest) for:
    - VoiceLineGenerator: briefing voice line IDs (`briefing_l1`, `briefing_l2`, `briefing_l3`) exist in definitions
    - VoiceLineGenerator: briefing voice lines use correct per-level profiles (L1 uses handler L1 profile, L2 uses handler L2 profile, L3 uses handler L3 profile)
    - VoiceLineGenerator: total voice line count updated to reflect new entries
    - BriefingPhase: plays voice line via audioManager when voiceLineId is present in briefing data
    - BriefingPhase: does NOT call audioManager when voiceLineId is absent (backward compatible)
    - BriefingData: interface accepts optional voiceLineId field
    - Briefing JSON: all 3 briefing files have voiceLineId fields with correct values
    - Briefing JSON: level-2.json mentions The Avenger, network retaliation, and Overseers
    - Briefing JSON: level-3.json mentions point of no return, extraction protocol, and Core Intelligence

13. All existing tests continue to pass -- zero regressions.

## Tasks / Subtasks

- [x] Task 1: Add briefing voice line definitions to VoiceLineGenerator (AC: #1)
  - [x] 1.1 Add `briefing_l1` definition using `HANDLER_PROFILE_L1`, duration 4.0
  - [x] 1.2 Add `briefing_l2` definition using `HANDLER_PROFILE_L2`, duration 4.0
  - [x] 1.3 Add `briefing_l3` definition using `HANDLER_PROFILE_L3`, duration 4.0

- [x] Task 2: Extend BriefingData interface with voiceLineId (AC: #2)
  - [x] 2.1 Add `voiceLineId?: string` to `BriefingData` interface in `BriefingScreen.ts`

- [x] Task 3: Update briefing JSON files with voiceLineId (AC: #3, #6, #7, #8)
  - [x] 3.1 Add `"voiceLineId": "briefing_l1"` to `level-1.json`
  - [x] 3.2 Add `"voiceLineId": "briefing_l2"` to `level-2.json`
  - [x] 3.3 Add `"voiceLineId": "briefing_l3"` to `level-3.json`

- [x] Task 4: Add voice playback to BriefingPhase (AC: #4)
  - [x] 4.1 Import `audioManager` in `BriefingPhase.ts`
  - [x] 4.2 In `enter()`, after `briefingScreen.show()`, call `audioManager.playVoice(briefingData.voiceLineId)` if `voiceLineId` is present

- [x] Task 5: Write tests (AC: #12, #13)
  - [x] 5.1 Create `src/__tests__/BriefingAllLevels.test.ts` with tests for: voice line definitions exist, correct profiles used, briefing data voiceLineId field, BriefingPhase voice playback, briefing JSON content validation
  - [x] 5.2 Update `src/__tests__/VoiceLineGenerator.test.ts` total count assertion (56 -> 59)
  - [x] 5.3 Verify all existing tests still pass

- [x] Task 6: Build verification (AC: #11, #13)
  - [x] 6.1 Run `npx tsc --noEmit` -- zero TypeScript errors
  - [x] 6.2 Run `npm run test` -- all tests pass, zero regressions

## Dev Notes

### Architecture Compliance

- **Systems never import each other.** BriefingPhase imports `audioManager` singleton (acceptable -- same pattern used by DialogueManager). [Source: project-context.md#Architecture Rules]
- **UI never imports game logic.** BriefingScreen receives display data only. Voice playback is in BriefingPhase (a state class), not in the UI component. [Source: project-context.md#Architecture Rules]
- **Use `Logger.info/warn/error()`** -- NEVER `console.log()`. [Source: project-context.md#Critical Don't-Miss Rules]
- **`erasableSyntaxOnly: true`**: No `enum`. Use `type` unions and `as const` objects. [Source: tsconfig.json]
- **`verbatimModuleSyntax: true`**: Use `import type { ... }` for type-only imports. [Source: tsconfig.json]
- **No per-frame allocations.** No new per-frame code in this story. [Source: project-context.md#Performance Rules]
- **No `fetch()` during gameplay frames.** Briefing JSON and voice lines are already loaded at init. [Source: project-context.md#Performance Rules]

### Critical Implementation Rules

- **VoiceLineGenerator uses `createVoiceDefinition()` factory.** All voice definitions MUST be created with this function. Follow existing pattern exactly.
- **Per-level handler profiles already exist.** `HANDLER_PROFILE_L1` (calm), `HANDLER_PROFILE_L2` (invested), `HANDLER_PROFILE_L3` (desperate). Use these for briefing voice lines.
- **audioManager.playVoice(id)** plays a voice line by ID. The VoiceLineGenerator generates the audio buffer on first call, then caches it. No special setup needed.
- **BriefingData.voiceLineId is OPTIONAL.** Existing code that creates BriefingData without voiceLineId must continue working. The BriefingPhase must guard against undefined voiceLineId.
- **Do NOT modify BriefingScreen.** The UI component handles display only. Voice playback belongs in BriefingPhase.
- **Do NOT modify LevelManager.** Multi-level briefing support is already complete.
- **Do NOT modify main.ts.** All 3 briefing JSON files are already fetched and loaded.

### Existing Code Patterns to Follow

- **VoiceLineGenerator.ts** at `src/audio/` -- Contains `HANDLER_PROFILE_L1`, `HANDLER_PROFILE_L2`, `HANDLER_PROFILE_L3`, `createVoiceDefinition()`, `hashString()`. Add briefing definitions alongside existing handler definitions in the `VOICE_DEFINITIONS` record.
- **BriefingPhase.ts** at `src/state/phases/` -- Currently imports `BriefingScreen`, `BriefingData`, and `Logger`. Add `audioManager` import following the same pattern as `DialogueManager.ts`.
- **BriefingScreen.ts** at `src/ui/screens/` -- Contains `BriefingData` interface. Add optional `voiceLineId` field.
- **Briefing JSON files** at `assets/briefings/` -- Add `voiceLineId` field to each JSON object.

### What Already Exists (DO NOT recreate)

- `src/audio/VoiceLineGenerator.ts` -- Voice synthesis with per-level handler profiles. MODIFY to add 3 briefing voice line definitions.
- `src/state/phases/BriefingPhase.ts` -- Phase wrapper for BriefingScreen. MODIFY to add voice playback on enter.
- `src/ui/screens/BriefingScreen.ts` -- Full-screen scrolling text overlay with palette-aware colors. MODIFY only the BriefingData interface.
- `assets/briefings/level-1.json` -- Level 1 briefing content. MODIFY to add voiceLineId only.
- `assets/briefings/level-2.json` -- Level 2 briefing content. MODIFY to add voiceLineId only.
- `assets/briefings/level-3.json` -- Level 3 briefing content. MODIFY to add voiceLineId only.
- `src/systems/LevelManager.ts` -- Multi-level phase management with briefing support. DO NOT MODIFY.
- `src/main.ts` -- Game init with all 3 briefing JSON fetches. DO NOT MODIFY.
- `src/audio/AudioManager.ts` -- Audio channel management with `playVoice()`. DO NOT MODIFY.
- `src/rendering/PaletteColors.ts` -- Palette CSS utilities. DO NOT MODIFY.
- `src/core/GameEvents.ts` -- Event definitions. DO NOT MODIFY.
- `src/core/EventBus.ts` -- Pub/sub system. DO NOT MODIFY.
- `src/config/constants.ts` -- Game constants. DO NOT MODIFY (no new constants needed).
- `src/narrative/DialogueManager.ts` -- Trigger-based dialogue. DO NOT MODIFY.

### What Must Be Created

- `src/__tests__/BriefingAllLevels.test.ts` -- Tests for multi-level briefing voice playback and content validation

### What Must Be Modified

- `src/audio/VoiceLineGenerator.ts` -- Add 3 briefing voice line definitions (briefing_l1, briefing_l2, briefing_l3)
- `src/ui/screens/BriefingScreen.ts` -- Add optional `voiceLineId` to BriefingData interface
- `src/state/phases/BriefingPhase.ts` -- Import audioManager, play voice line on enter if voiceLineId present
- `assets/briefings/level-1.json` -- Add voiceLineId field
- `assets/briefings/level-2.json` -- Add voiceLineId field
- `assets/briefings/level-3.json` -- Add voiceLineId field
- `src/__tests__/VoiceLineGenerator.test.ts` -- Update total voice line count (56 -> 59)

### Scope Boundaries

**IN scope**: Briefing voice line definitions, BriefingData voiceLineId field, voice playback in BriefingPhase, JSON voiceLineId fields, tests.

**NOT in scope** (future stories):
- Ending sequence -- Story 5-10
- High score table -- Story 5-11
- Cyberspace fragmentation ending -- Story 5-12
- Main menu screen -- Story 6-1

### Previous Story Intelligence

From Story 5-8 (Handler Voice Escalation):
- Test count after Story 5-8: 1845 tests across 127 files.
- `erasableSyntaxOnly: true` -- No enums. Use type unions and `as const` objects.
- `verbatimModuleSyntax: true` -- Use `import type { ... }` for type-only imports.
- VoiceLineGenerator total voice line count: 56 (will become 59 after adding 3 briefing lines).
- Per-level handler profiles: L1 (calm, 180Hz), L2 (invested, 200Hz), L3 (desperate, 220Hz).
- DialogueManager speaker configs are palette-aware (no hardcoded colors).

From Story 4-4 (Briefing Screen System):
- BriefingScreen uses palette-aware colors via `getPaletteHexColor()`.
- BriefingPhase follows standard Phase interface: enter/update/exit/isComplete.
- BriefingData interface: `{ title: string; lines: string[]; speaker: string }`.
- LevelManager creates BriefingPhase using `briefingDataMap`.
- Briefing JSON loaded at init via `fetch()`, not during gameplay frames.

### Project Structure Notes

- All changes are in existing files or one new test file
- No new directories needed
- No new npm dependencies needed
- Test files go in `src/__tests__/` alongside existing test files

### References

- [Source: narrative-design.md#Key Conversations #5] -- "Briefing: They Know Your Name" (Between Levels 1-2). Ghost: urgent, impressed but worried.
- [Source: narrative-design.md#Key Conversations #8] -- "Briefing: Point of No Return" (Between Levels 2-3). Ghost: raw, honest, scared.
- [Source: narrative-design.md#Narrative Screens] -- "Briefing 1: Ghost voice-over + scrolling vector text. Mission intel, Avenger warning." "Briefing 2: Ghost voice-over + scrolling vector text. Point of no return."
- [Source: narrative-design.md#Word Count Estimates] -- "Ghost - Briefing 1: ~5-8 lines, ~200 words" "Ghost - Briefing 2: ~5-8 lines, ~200 words"
- [Source: gdd.md#Briefing Screens] -- "Between-level narrative, ~30 sec each, Full-screen vector text scroll with handler voice-over narration"
- [Source: epics.md#Epic 5 Story 9] -- "As a player, I can see briefing screens between all levels so that each level is contextualized"
- [Source: game-architecture.md#State Management] -- "Menu -> Tutorial -> Briefing -> Playing -> Ending"
- [Source: game-architecture.md#Audio Manager] -- "VoiceChannel: volume 0.9, single THREE.Audio, queued playback"
- [Source: project-context.md#Architecture Rules] -- "Systems never import each other."

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- BriefingData interface extended with optional `voiceLineId?: string` field. Backward compatible -- existing code without voiceLineId continues working.
- Three briefing voice line definitions added to HANDLER_DEFINITIONS in VoiceLineGenerator.ts: `briefing_l1` (L1 profile), `briefing_l2` (L2 profile), `briefing_l3` (L3 profile). All use 4.0s duration.
- BriefingPhase.enter() now calls `audioManager.playVoice(voiceLineId)` after showing the BriefingScreen, guarded by `if (this.briefingData.voiceLineId)`.
- Used `vi.hoisted()` in BriefingAllLevels.test.ts to properly handle hoisted `vi.mock` factory references to mock variables.
- HandlerVoiceEscalation.test.ts count assertion updated from 56 to 59 (3 new briefing voice lines).
- VoiceLineGenerator.test.ts count assertions updated from 56 to 59.

### Completion Notes List

- Task 1: Added 3 briefing voice line definitions to VoiceLineGenerator.ts HANDLER_DEFINITIONS: briefing_l1 (L1 profile, 4.0s), briefing_l2 (L2 profile, 4.0s), briefing_l3 (L3 profile, 4.0s). Total voice line count: 56 -> 59.
- Task 2: Added optional `voiceLineId?: string` field to BriefingData interface in BriefingScreen.ts. No other BriefingScreen changes needed.
- Task 3: Added `"voiceLineId"` field to all 3 briefing JSON files: level-1.json ("briefing_l1"), level-2.json ("briefing_l2"), level-3.json ("briefing_l3").
- Task 4: Imported `audioManager` in BriefingPhase.ts. Added voice playback call in enter() -- plays handler voice-over when voiceLineId is present.
- Task 5: Created BriefingAllLevels.test.ts with 24 tests covering voice line definitions, BriefingPhase voice playback, BriefingData interface, and briefing JSON content validation. Updated VoiceLineGenerator.test.ts and HandlerVoiceEscalation.test.ts count assertions.
- Task 6: `npx tsc --noEmit` passes clean. Full test suite: 1869 tests across 128 files, all pass, zero regressions.

### Change Log

- 2026-03-26: Story 5-9 implemented -- Briefing Screens All Levels. Added 3 briefing voice line definitions (briefing_l1, briefing_l2, briefing_l3) using per-level handler profiles. Extended BriefingData interface with optional voiceLineId field. Updated all 3 briefing JSON files with voiceLineId. Added voice-over playback to BriefingPhase.enter(). Added 24 new tests.

### File List

- `src/audio/VoiceLineGenerator.ts` -- Modified: added 3 briefing voice line definitions (briefing_l1, briefing_l2, briefing_l3) using per-level handler profiles
- `src/ui/screens/BriefingScreen.ts` -- Modified: added optional `voiceLineId?: string` to BriefingData interface
- `src/state/phases/BriefingPhase.ts` -- Modified: imported audioManager, added voice playback on enter() when voiceLineId is present
- `assets/briefings/level-1.json` -- Modified: added `"voiceLineId": "briefing_l1"` field
- `assets/briefings/level-2.json` -- Modified: added `"voiceLineId": "briefing_l2"` field
- `assets/briefings/level-3.json` -- Modified: added `"voiceLineId": "briefing_l3"` field
- `src/__tests__/BriefingAllLevels.test.ts` -- New: 24 tests for briefing voice lines, voice playback, data interface, and JSON content validation
- `src/__tests__/VoiceLineGenerator.test.ts` -- Modified: updated total voice line count from 56 to 59
- `src/__tests__/HandlerVoiceEscalation.test.ts` -- Modified: updated total voice line count from 56 to 59
