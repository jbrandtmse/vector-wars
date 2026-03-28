# Story 4.2: AI Taunt System

Status: review

## Story

As a player,
I want to hear AI taunts from The Gatekeeper during the boss fight,
so that the boss has personality and the encounter feels like a confrontation with a hostile intelligence.

## Acceptance Criteria

1. A `bosses.json` dialogue file exists at `assets/dialogue/bosses.json` containing 7-10 Gatekeeper dialogue entries. These are the boss's voice lines for the Level 1 boss encounter, triggered by gameplay events (boss phase start, health thresholds, vulnerability windows, defeat). The Gatekeeper's tone is cold, contemptuous, and machine-precise — no contractions, no slang, machine-perfect grammar. Lines reference the narrative design document's characterization: dismissive of human intrusion, clinical, treating Cipher as a category not an individual.

   Required entries (minimum):
   - Boss encounter start (`phaseStart:boss:1`): Opening taunt — cold dismissal. Example: "Another insect in my network. Your kind never learns."
   - Boss health below 75% (`bossHealthChanged:below75`): Mild surprise, still dismissive. Example: "You are... persistent. Irrelevant, but persistent."
   - Boss vulnerable window (`bossVulnerable`): Acknowledging the player's success without respect. Example: "A flaw in my architecture. It will not repeat."
   - Boss health below 50% (`bossHealthChanged:below50`): First crack in composure. Example: "Predictable. Inefficient. Human."
   - Boss health below 25% (`bossHealthChanged:below25`): Genuine concern, still formal. Example: "This architecture is flawless. You cannot... you should not be capable of this."
   - Boss defeated (`bossDefeated`): Death line — disbelief. Example: "Impossible. This architecture is... flawless..."
   - At least 1-2 additional mid-fight lines triggered by `bossVulnerable` or `bossPhaseChanged` events to make the encounter feel populated with dialogue.

2. The `bosses.json` entries use `"speaker": "gatekeeper"` which maps to the existing `SPEAKER_CONFIGS` in `DialogueManager.ts` — label `"GATEKEEPER"`, color `"#00ff41"` (green, Level 1 palette). No code changes needed for speaker config.

3. Gatekeeper dialogue lines use priority 3 (high) for encounter-start and defeat lines, priority 2 for mid-fight taunts, ensuring boss taunts preempt any handler ambient chatter (priority 1) but critical handler callouts (priority 3) can compete fairly with boss taunts.

4. `DialogueManager` subscribes to the `bossDefeated` event (already defined in `GameEvents.ts` as `BossDefeatedEvent`). When `bossDefeated` fires, it emits an internal trigger `"bossDefeated"`. This is a NEW subscription that must be added to the constructor. The existing `bossHealthChanged`, `bossVulnerable`, and `phaseStart` subscriptions already handle the other triggers — no changes needed for those.

5. `DialogueManager` subscribes to the `bossPhaseChanged` event (already defined in `GameEvents.ts` as `BossPhaseChangedEvent`). When `bossPhaseChanged` fires with `{ phase: 'barrage' | 'sweep' | 'vulnerable' }`, it emits an internal trigger `"bossPhaseChanged:{phase}"` (e.g., `"bossPhaseChanged:barrage"`). This allows boss dialogue to be triggered by specific attack phases.

6. The `bosses.json` file is loaded at game initialization alongside `handler.json`. In `main.ts`, add a second `fetch()` call for `assets/dialogue/bosses.json` that calls `dialogueManager.loadScript()` on success. Loading happens at init time — NOT during gameplay frames.

7. Boss taunt lines display through the existing `CommOverlay` with the `GATEKEEPER` speaker label. The speaker label, separator line, and message text all render in green (`#00ff41`) matching the Level 1 palette. The typewriter effect applies to boss taunts just as it does for handler lines.

8. When a boss taunt (priority 2-3) arrives while a handler line (priority 1) is showing, the boss taunt preempts the handler line (existing priority preemption logic handles this). When a boss taunt (priority 2) arrives while a handler line of equal or higher priority is showing, the boss taunt queues and displays after the handler line completes (existing queue behavior).

9. The `bossDefeated` trigger fires the Gatekeeper's death line. Because `bossDefeated` fires before the destruction sequence begins (see `GatekeeperBoss.onDefeated()`), the death line appears as the boss starts collapsing — visually and narratively satisfying timing.

10. Running `npm run build` produces a clean production build with zero TypeScript errors.

11. Unit tests exist (Vitest) for:
    - `DialogueManager` — new `bossDefeated` subscription triggers dialogue correctly, new `bossPhaseChanged` subscription generates correct trigger IDs (`"bossPhaseChanged:barrage"`, `"bossPhaseChanged:sweep"`, `"bossPhaseChanged:vulnerable"`), boss dialogue entries load from script and match triggers, priority interaction between boss taunts and handler lines works correctly.
    - Integration-level: loading both `handler.json` and `bosses.json` scripts does not cause conflicts or duplicate triggers.

12. All existing tests continue to pass — zero regressions. The 30 tests from Story 4-1 (15 DialogueManager + 15 CommOverlay) must all still pass.

## Tasks / Subtasks

- [x] Task 1: Add `bossDefeated` and `bossPhaseChanged` event subscriptions to DialogueManager (AC: #4, #5)
  - [x] 1.1 In `DialogueManager.ts`, add a new bound callback property `onBossDefeated` that handles `BossDefeatedEvent`. The handler emits internal trigger `"bossDefeated"`. Import `BossDefeatedEvent` from `GameEvents.ts`.
  - [x] 1.2 Add a new bound callback property `onBossPhaseChanged` that handles `BossPhaseChangedEvent`. The handler emits internal trigger `"bossPhaseChanged:{phase}"` where `{phase}` is `e.phase` (one of `'barrage'`, `'sweep'`, `'vulnerable'`). Import `BossPhaseChangedEvent` from `GameEvents.ts`.
  - [x] 1.3 In the constructor, subscribe to `eventBus.on('bossDefeated', this.onBossDefeated)` and `eventBus.on('bossPhaseChanged', this.onBossPhaseChanged)`.
  - [x] 1.4 In `dispose()`, add `eventBus.off('bossDefeated', this.onBossDefeated)` and `eventBus.off('bossPhaseChanged', this.onBossPhaseChanged)`.

- [x] Task 2: Create Gatekeeper boss dialogue JSON (AC: #1, #2, #3)
  - [x] 2.1 Replace the empty `assets/dialogue/bosses.json` with Gatekeeper dialogue entries. Use the trigger IDs that the DialogueManager already maps or will map after Task 1:
    - `"phaseStart:boss:1"` — encounter start
    - `"bossHealthChanged:below75"` — first damage threshold
    - `"bossVulnerable"` — vulnerability window
    - `"bossPhaseChanged:barrage"` — barrage phase taunt
    - `"bossHealthChanged:below50"` — mid-fight threshold
    - `"bossHealthChanged:below25"` — low health
    - `"bossDefeated"` — death line
    - 1-2 additional lines using `"bossPhaseChanged:sweep"` or second `"bossVulnerable"` entries
  - [x] 2.2 All entries use `"speaker": "gatekeeper"`. Priority: encounter-start and death = 3, mid-fight taunts = 2. Duration: 4-5 seconds for longer lines, 3 seconds for short taunts.
  - [x] 2.3 Dialogue text follows narrative design character voice: cold, contemptuous, no contractions, machine-perfect grammar. Addresses Cipher as a category ("Your kind", "Another intrusion"), not by name. [Source: narrative-design.md#Dialogue Style, #The Gatekeeper]

- [x] Task 3: Load bosses.json at game init (AC: #6)
  - [x] 3.1 In `main.ts`, add a `fetch('assets/dialogue/bosses.json')` call following the same pattern as the existing `handler.json` load. Parse as `DialogueScript` and call `dialogueManager.loadScript(script)`.
  - [x] 3.2 The fetch should be a separate `.then()/.catch()` chain (not blocking handler.json load). Both scripts load independently at init time.

- [x] Task 4: Write tests (AC: #11, #12)
  - [x] 4.1 In `src/__tests__/DialogueManager.test.ts`, add test cases for:
    - `bossDefeated` event triggers dialogue lookup for `"bossDefeated"` trigger ID.
    - `bossPhaseChanged` event with `{ phase: 'barrage' }` triggers `"bossPhaseChanged:barrage"`.
    - `bossPhaseChanged` event with `{ phase: 'sweep' }` triggers `"bossPhaseChanged:sweep"`.
    - `bossPhaseChanged` event with `{ phase: 'vulnerable' }` triggers `"bossPhaseChanged:vulnerable"`.
    - Boss taunt (priority 2) preempts handler chatter (priority 1).
    - Boss taunt (priority 2) queues behind handler critical line (priority 3).
    - Loading both handler and boss scripts does not cause trigger conflicts.
  - [x] 4.2 Run full test suite to verify zero regressions.

- [x] Task 5: Build verification (AC: #10, #12)
  - [x] 5.1 Run `npm run build` — zero TypeScript errors.
  - [x] 5.2 Run `npm run test` — all tests pass including all 30 existing Story 4-1 tests.

## Dev Notes

### Architecture Compliance

- **DialogueManager in `src/narrative/`** — all changes to this file. No new files in narrative directory. [Source: game-architecture.md#Directory Structure]
- **EventBus-only communication**: DialogueManager subscribes to `bossDefeated` and `bossPhaseChanged` events. It never imports boss entities or systems. [Source: game-architecture.md#Architectural Boundaries]
- **JSON dialogue files at `assets/dialogue/`**: `bosses.json` already exists as an empty placeholder created by Story 4-1. Replace contents with Gatekeeper entries. [Source: game-architecture.md#Configuration Management]
- **No new event types needed**: `bossDefeated` (BossDefeatedEvent) and `bossPhaseChanged` (BossPhaseChangedEvent) are already defined in `GameEvents.ts`. DialogueManager just needs to subscribe to them.

### Critical Implementation Rules

- **Use `Logger.debug('Narrative', ...)`** for trigger logging, consistent with existing DialogueManager logging pattern.
- **Event names are `camelCase`**: `bossDefeated`, `bossPhaseChanged` — already defined in `GameEvents.ts`.
- **No `fetch()` during gameplay frames**: `bosses.json` loads at init alongside `handler.json`.
- **Error handling**: Missing audio files or trigger mismatches should be logged and skipped (non-critical). The existing `handleTrigger()` method already logs when no entries match a trigger ID.

### Existing Code Patterns to Follow

- **Event subscription pattern in DialogueManager**: Follow the exact same pattern as existing subscriptions (`onBossHealthChanged`, `onBossVulnerable`). Define a bound callback property, subscribe in constructor, unsubscribe in `dispose()`.
- **Trigger ID convention**: `"{eventName}:{parameter}"` — e.g., `"bossDefeated"` (no parameters needed), `"bossPhaseChanged:barrage"`, `"bossPhaseChanged:sweep"`, `"bossPhaseChanged:vulnerable"`.
- **fetch() pattern in main.ts**: Follow the existing `handler.json` fetch chain exactly. Separate `.then()/.catch()` — do not use `Promise.all()` (keeping them independent prevents one failure from blocking the other).
- **Test patterns**: Follow existing `DialogueManager.test.ts` structure — mock EventBus, mock CommOverlay, test trigger → queue → display flow.

### What Already Exists (DO NOT recreate)

- `src/narrative/DialogueManager.ts` — has priority queue, trigger system, `loadScript()`, all handler event subscriptions. **Modify this file only to add 2 new subscriptions.**
- `src/narrative/DialogueTypes.ts` — `DialogueEntry` already supports `speaker: 'gatekeeper'`. No changes needed.
- `src/core/GameEvents.ts` — `BossDefeatedEvent`, `BossPhaseChangedEvent`, `bossDefeated`, `bossPhaseChanged` all already defined. No changes needed.
- `src/ui/screens/CommOverlay.ts` — fully functional, supports color parameter. No changes needed.
- `assets/dialogue/bosses.json` — exists as `{ "entries": [] }`. Replace contents.
- `assets/dialogue/handler.json` — 8 handler lines for Level 1. Do NOT modify.
- `src/config/constants.ts` — COMM constants already defined by Story 4-1. No additions needed.
- `SPEAKER_CONFIGS` in DialogueManager.ts — already has `gatekeeper: { label: 'GATEKEEPER', color: '#00ff41' }`. No changes needed.

### What Must Be Modified

- `src/narrative/DialogueManager.ts` — add `onBossDefeated` and `onBossPhaseChanged` callbacks, subscribe/unsubscribe in constructor/dispose.
- `assets/dialogue/bosses.json` — replace empty entries array with 7-10 Gatekeeper dialogue entries.
- `src/main.ts` — add `fetch('assets/dialogue/bosses.json')` init chain.
- `src/__tests__/DialogueManager.test.ts` — add test cases for new subscriptions.

### Narrative Design Context

The Gatekeeper is the Level 1 boss — the outer perimeter's guardian intelligence. Key characterization from the narrative design document:

- **Personality**: Cold, measured, contemptuous. Speaks in complete, precise sentences. No contractions, no slang. Machine-perfect grammar. [Source: narrative-design.md#Dialogue Style, "The Gatekeeper"]
- **Addresses Cipher as a category**: "Another intrusion. Another failure." "Your kind lacks the architecture for persistence." NOT by name or callsign. [Source: narrative-design.md#Characters, "The Gatekeeper"]
- **Tone**: A professor dismissing a student's work. Not angry — disappointed that the student bothered. [Source: narrative-design.md#Dialogue Style]
- **Arc within the fight**: Dismissive at start → slightly surprised as damage mounts → disbelief at defeat. The composure never fully breaks (that's reserved for the Core Intelligence in Level 3). [Source: narrative-design.md#Characters, "The Gatekeeper"]
- **Death line**: "Impossible. This architecture is... flawless..." — disbelief, not fear. The Gatekeeper cannot comprehend being beaten. [Source: narrative-design.md#Key Conversations #4]
- **Line count**: ~7-10 lines per narrative design production planning. [Source: narrative-design.md#Production Planning]
- **Boss taunts are part of combat**: Dialogue is heard DURING the fight — taunting, threatening. Not separate from combat experience. [Source: narrative-design.md#In-Game Storytelling]

### Boss Event Timing Reference

The GatekeeperBoss cycles through three attack phases in order: `barrage` → `sweep` → `vulnerable` → repeat. Understanding the timing helps with dialogue placement:

- `bossPhaseChanged: { phase: 'barrage' }` — boss fires spread projectiles (6 seconds)
- `bossPhaseChanged: { phase: 'sweep' }` — boss fires sweeping attack (5 seconds)
- `bossVulnerable: { vulnerable: true }` — boss is exposed, player should attack (4 seconds)
- `bossHealthChanged` events fire on every hit during any phase
- `bossDefeated` fires when health reaches 0 (in `Boss.takeDamage()` → `onDefeated()`)
- `bossDestroyed` fires after destruction sequence completes

Use `bossDefeated` (not `bossDestroyed`) for the death line so it appears as the boss starts collapsing, not after the destruction animation finishes.

### Future Story Dependencies

- **Story 4-3 (Diegetic Tutorial)**: Unrelated — uses `tutorial.json` with tutorial triggers.
- **Story 4-5 (Audio Manager)**: Will add voice audio playback. The `audio` field in dialogue entries is optional and unused until then.
- **Story 4-9 (Synthesized Voice Lines)**: Will populate the `audio` field in `bosses.json` with voice file references for the Gatekeeper.
- **Epic 5 stories**: Will add Avenger and Core Intelligence dialogue entries to `bosses.json` (or separate JSON files). The `speaker` field supports `'avenger'` and `'coreIntelligence'` already.

### Scope Boundaries

**IN scope**: Gatekeeper (Level 1 boss) dialogue only. 7-10 lines.

**NOT in scope** (future stories):
- Avenger voice lines (Epic 5, Level 2)
- Core Intelligence voice lines (Epic 5, Level 3)
- Voice audio playback (Story 4-5, 4-9)
- Color changes for boss dialogue per level palette (Epic 5)

### Project Structure Notes

- All modifications align with the existing architecture directory structure.
- No new files created (only modifications to existing files + replacing empty JSON contents).
- No new directories needed.

### Testing Notes

- Use Vitest (already configured in project).
- Extend existing `src/__tests__/DialogueManager.test.ts` with new test cases — do not create a separate test file for this story.
- Mock the EventBus for new subscription tests.
- Follow existing test patterns in the file — the 15 existing tests demonstrate the mocking and assertion patterns to use.
- For `bossPhaseChanged`, test all three phase values: `'barrage'`, `'sweep'`, `'vulnerable'`.
- Verify that loading two scripts (handler + bosses) into the same DialogueManager works without conflicts.

### References

- [Source: narrative-design.md#Characters, "The Gatekeeper"] — Cold, dismissive, contemptuous personality
- [Source: narrative-design.md#Dialogue Style, "The Gatekeeper"] — No contractions, machine-perfect grammar, addresses Cipher as category
- [Source: narrative-design.md#Key Conversations #4, "The Gatekeeper's Challenge"] — Opening taunt, mid-fight, death line samples
- [Source: narrative-design.md#In-Game Storytelling] — Boss dialogue triggered by combat state, heard during fight
- [Source: narrative-design.md#Production Planning] — ~7-10 Gatekeeper lines estimated
- [Source: game-architecture.md#Narrative System] — DialogueManager, priority system, JSON format, trigger-based delivery
- [Source: game-architecture.md#Event System] — bossDefeated, bossPhaseChanged events already defined
- [Source: game-architecture.md#Architectural Boundaries] — Entities never import systems, EventBus-only communication
- [Source: game-architecture.md#Configuration Management] — Dialogue scripts loaded at runtime
- [Source: epics.md#Epic 4, Story 2] — "AI taunts from The Gatekeeper during the boss fight so that the boss has personality"
- [Source: 4-1-handler-comm-overlay-system.md#Future Story Dependencies] — Story 4-2 uses same DialogueManager + CommOverlay with boss speaker configs

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

No debug issues encountered. All tests passed on first implementation attempt.

### Completion Notes List

- Task 1: Added `onBossDefeated` and `onBossPhaseChanged` bound callback properties to DialogueManager. `onBossDefeated` emits trigger `"bossDefeated"`. `onBossPhaseChanged` emits trigger `"bossPhaseChanged:{phase}"` where phase is barrage/sweep/vulnerable. Subscriptions added in constructor, unsubscriptions added in dispose(). Follows exact same pattern as existing event handlers.
- Task 2: Created 9 Gatekeeper dialogue entries in `bosses.json`. Covers encounter start (priority 3), three health thresholds (75%/50%/25%, priority 2), two vulnerability windows (priority 2), barrage and sweep phase taunts (priority 2), and defeat line (priority 3). All use speaker "gatekeeper". Dialogue voice is cold, contemptuous, no contractions, machine-perfect grammar. Gatekeeper addresses Cipher as a category, not by name.
- Task 3: Added independent `fetch('assets/dialogue/bosses.json')` chain in main.ts following the same pattern as handler.json load. Both scripts load independently at init time.
- Task 4: Added 9 new test cases to DialogueManager.test.ts in a dedicated "Story 4-2" describe block. Tests cover: bossDefeated trigger, all 3 bossPhaseChanged phase values, priority preemption (boss over handler), priority queueing (boss behind critical handler), dual-script loading without conflicts, and dispose cleanup for both new subscriptions. Full suite: 1285 tests pass across 102 files, zero regressions.
- Task 5: `npm run build` succeeds with zero TypeScript errors. `npm run test` passes all tests.

### Change Log

- 2026-03-26: Story 4-2 implemented — AI taunt system for Gatekeeper boss. Added bossDefeated and bossPhaseChanged event subscriptions to DialogueManager, created 9 Gatekeeper dialogue entries in bosses.json, added bosses.json loading to main.ts init, and wrote 9 new tests.

### File List

- `src/narrative/DialogueManager.ts` — Modified: added BossDefeatedEvent/BossPhaseChangedEvent imports, onBossDefeated and onBossPhaseChanged callbacks, constructor subscriptions, dispose unsubscriptions
- `assets/dialogue/bosses.json` — Modified: replaced empty entries array with 9 Gatekeeper dialogue entries
- `src/main.ts` — Modified: added fetch() chain for bosses.json at init time
- `src/__tests__/DialogueManager.test.ts` — Modified: added 9 new test cases in "Story 4-2" describe block
