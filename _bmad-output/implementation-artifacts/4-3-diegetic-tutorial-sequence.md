# Story 4.3: Diegetic Tutorial Sequence

Status: review

## Story

As a player,
I want to experience a diegetic tutorial where the handler walks me through controls,
so that onboarding feels like part of the story and I'm prepared for combat without a fourth-wall break.

## Acceptance Criteria

1. A `TutorialPhase` class exists at `src/state/phases/TutorialPhase.ts`. It follows the same `Phase` interface pattern as `DogfightPhase`, `SurfacePhase`, `CorridorPhase`, and `BossPhase` — implementing `enter()`, `update(dt)`, `exit()`, and `isComplete()`. The tutorial phase runs BEFORE the dogfight phase as the first phase in Level 1's sequence.

2. The tutorial phase uses a step-based progression system. Each step has a trigger condition (player action or timer), handler dialogue, and optional prompt text. Steps advance automatically when the player completes the required action. The sequence is:
   - **Step 1: Welcome** — Timer-triggered (auto-advance after dialogue). Handler: "First time jacking in? Let's run the calibration protocol." Establishes handler rapport.
   - **Step 2: Movement** — Player must press all four arrow keys (each at least once). Handler: "Align your targeting array." Prompt: "PRESS ARROW KEYS TO ALIGN TARGETING ARRAY". Handler confirmation: "Good, looking sharp."
   - **Step 3: Data Lance** — Player must fire the Data Lance (spacebar) at least 3 times. Handler: "Light up those calibration targets." Prompt: "PRESS SPACE TO FIRE DATA LANCE". Spawns 3 inert calibration targets (simple wireframe geometry, non-hostile, destructible). Handler confirmation: "Weapon systems nominal."
   - **Step 4: Secondary Weapons** — Brief intro to Z/X/C weapons. Handler: "Your deck is loaded with Logic Bombs, EMP Burst, and Virus Payload. You'll need them all." Prompt: "Z: LOGIC BOMBS  X: EMP BURST  C: VIRUS PAYLOAD". Timer-triggered auto-advance (5 seconds).
   - **Step 5: Shields** — Handler: "Your combat program has integrated shielding. Take a hit, see how it feels." A single inert calibration projectile fires at the player dealing 10 damage. The HUD shield bar visibly decreases. Handler: "Shields absorb damage. Lose them all and your mind's trapped in here forever." Timer auto-advance after dialogue.
   - **Step 6: Alarm Transition** — Handler: "Calibration complete. Systems are—" (interrupted). Handler: "That's not a drill. We've got incoming." Tutorial ends. Phase completes, seamless transition to dogfight.

3. A `TutorialPrompt` class exists at `src/ui/screens/TutorialPrompt.ts`. It creates an HTML overlay element displaying contextual prompts for the player during the tutorial. Positioned center-bottom of the viewport (below the comm overlay area). Uses the same DOM creation pattern as `CommOverlay.ts` and `GameOverScreen.ts`. Green monospace text with glow, matching the vector aesthetic. Public API: `show(text: string)`, `hide()`, `dispose()`.

4. The `TutorialPrompt` visual design:
   - Container: `position: fixed; bottom: 5%; left: 50%; transform: translateX(-50%); z-index: 5; pointer-events: none;`
   - Text: monospace font, green `#00ff41`, font size `clamp(0.9rem, 2vw, 1.3rem)`, letter-spacing `0.2em`, text-shadow glow `0 0 10px #00ff41`. Uppercase.
   - Fade-in on show (opacity 0 to 1, 0.3s transition). Fade-out on hide (0.3s transition).
   - Optional pulse animation on the text (subtle opacity oscillation 0.7-1.0 at ~1.5Hz) to draw attention.

5. A `tutorial.json` dialogue file exists at `assets/dialogue/tutorial.json` containing 8-10 handler tutorial dialogue entries. Uses `"speaker": "handler"`, priority 3 (high — tutorial lines must not be preempted). Trigger IDs use the pattern `"tutorial:step1"`, `"tutorial:step2"`, etc. corresponding to each tutorial step. Duration 4-5 seconds per line.

6. Tutorial dialogue entries follow Ghost's established voice: clipped, professional, dry with slight warmth. Short declarative sentences. Subject often dropped. No contractions for technical callouts. The calibration framing is diegetic — Ghost is running a systems check, not explaining a video game. [Source: narrative-design.md#Dialogue Style, "Ghost"]

7. `LevelManager` is modified to insert `TutorialPhase` as the FIRST phase in the phase sequence (before dogfight). The phase order becomes: `tutorial → dogfight → surface → corridor → boss`. The `PHASE_TYPES` array or equivalent tracking is updated. When tutorial phase completes, the standard phase transition (fade) occurs, followed by dogfight entering normally.

8. A new `PhaseType` value `'tutorial'` is added to the `PhaseType` union in `src/types/game.ts`. The `phaseStart` event fires with `{ phase: 'tutorial', level: 1 }` when the tutorial begins.

9. `DialogueManager` emits tutorial-specific trigger IDs when it receives tutorial events. The `TutorialPhase` emits `dialogueTrigger` events with `triggerId` values like `"tutorial:step1"`, `"tutorial:step2"`, etc. to trigger the corresponding dialogue entries from `tutorial.json`.

10. `TutorialPhase` subscribes to input events to detect player actions for step completion. It uses the `InputManager` (passed via constructor) to check `isActive()` for arrow keys and fire actions. It does NOT import systems directly — it receives dependencies through the constructor and communicates through the EventBus.

11. Calibration targets in Step 3 are simple wireframe vector objects (e.g., small rotating octahedra or cubes) spawned at fixed positions in front of the player. They use `VectorMaterials.create()` for materials (never direct material creation), enable `BLOOM_LAYER`, and are destructible by Data Lance bolts. When destroyed, they produce a small vector shard explosion via `EffectsManager`. After all 3 are destroyed, the step advances.

12. The tutorial phase uses the main `RailMovement` instance (same as dogfight) for camera movement — the player is flying during the tutorial, experiencing the environment. Rail speed is the same as dogfight.

13. `tutorial.json` is loaded at game initialization alongside `handler.json` and `bosses.json` in `main.ts`. A new `fetch('assets/dialogue/tutorial.json')` chain is added following the same independent pattern.

14. Running `npm run build` produces a clean production build with zero TypeScript errors.

15. Unit tests exist (Vitest) for:
    - `TutorialPhase` — step progression logic (each step advances on correct condition), isComplete returns true after final step, enter resets state, exit cleans up.
    - `TutorialPrompt` — show/hide visibility, dispose removes DOM elements.
    - Integration: tutorial dialogue entries load from script and match trigger IDs, LevelManager includes tutorial as first phase.

16. All existing tests continue to pass — zero regressions. The tests from Story 4-1 (30 tests) and Story 4-2 (9 tests) must all still pass.

## Tasks / Subtasks

- [x] Task 1: Add `'tutorial'` PhaseType and any needed events (AC: #8)
  - [x]1.1 In `src/types/game.ts`, add `'tutorial'` to the `PhaseType` union type so it becomes `'dogfight' | 'surface' | 'corridor' | 'boss' | 'tutorial'`.

- [x] Task 2: Create TutorialPrompt HTML component (AC: #3, #4)
  - [x]2.1 Create `src/ui/screens/TutorialPrompt.ts`. Follow `CommOverlay.ts` DOM creation pattern — `document.createElement`, `Object.assign(el.style, {...})`, append to `document.body`.
  - [x]2.2 Build DOM structure: outer container div (fixed position, center-bottom, z-index 5, pointer-events none, opacity 0, CSS transition on opacity). Text div (monospace, uppercase, green with glow, letter-spacing 0.2em).
  - [x]2.3 Implement `show(text: string)`: set text content (uppercase), set container opacity to 1.
  - [x]2.4 Implement `hide()`: set container opacity to 0.
  - [x]2.5 Implement `dispose()`: remove DOM elements from document.body.
  - [x]2.6 Add a CSS keyframe pulse animation (opacity 0.7 to 1.0 at ~1.5Hz) to the text element while visible.

- [x] Task 3: Create tutorial dialogue JSON (AC: #5, #6)
  - [x]3.1 Create dialogue entries in `assets/dialogue/tutorial.json`. Replace the empty entries array with 8-10 handler tutorial lines:
    - `"tutorial:step1"` — "First time jacking in? Let's run the calibration protocol." (priority 3, duration 5)
    - `"tutorial:step2"` — "Align your targeting array." (priority 3, duration 4)
    - `"tutorial:step2:complete"` — "Good, looking sharp." (priority 3, duration 3)
    - `"tutorial:step3"` — "Light up those calibration targets." (priority 3, duration 4)
    - `"tutorial:step3:complete"` — "Weapon systems nominal." (priority 3, duration 3)
    - `"tutorial:step4"` — "Your deck is loaded with Logic Bombs, EMP Burst, and Virus Payload. You'll need them all." (priority 3, duration 5)
    - `"tutorial:step5"` — "Your combat program has integrated shielding. Take a hit, see how it feels." (priority 3, duration 5)
    - `"tutorial:step5:complete"` — "Shields absorb damage. Lose them all and your mind's trapped in here forever." (priority 3, duration 5)
    - `"tutorial:step6"` — "Calibration complete. Systems are—" (priority 3, duration 3)
    - `"tutorial:step6:alarm"` — "That's not a drill. We've got incoming." (priority 3, duration 4)
  - [x]3.2 All entries use `"speaker": "handler"`. Voice: professional, dry, slight warmth. Short declarative sentences. Diegetic calibration framing.

- [x] Task 4: Create TutorialPhase class (AC: #1, #2, #9, #10, #11, #12)
  - [x]4.1 Create `src/state/phases/TutorialPhase.ts` implementing the Phase interface (`enter()`, `update(dt)`, `exit()`, `isComplete()`).
  - [x]4.2 Constructor accepts: `scene: THREE.Scene`, `camera: THREE.PerspectiveCamera`, `vectorMaterials: VectorMaterials`, `inputManager: InputManager`, `effectsManager: EffectsManager`, `playerCollider: { center: THREE.Vector3 }` (for shield hit targeting). Store all references.
  - [x]4.3 Implement step-based progression system. Define an array of step configs, each with: step ID, trigger condition function, prompt text (optional), entry dialogue trigger ID, completion dialogue trigger ID (optional), auto-advance timer duration (optional).
  - [x]4.4 **Step 1 (Welcome)**: On enter, emit `dialogueTrigger` with `triggerId: "tutorial:step1"`. Auto-advance after 5 seconds (dialogue duration).
  - [x]4.5 **Step 2 (Movement)**: Track which arrow keys have been pressed (up, down, left, right). Each frame, check `inputManager.isActive()` for each direction and mark as done. When all 4 marked, emit completion dialogue trigger `"tutorial:step2:complete"`, advance to step 3. Show prompt via `TutorialPrompt.show()`. Hide prompt on completion.
  - [x]4.6 **Step 3 (Data Lance)**: Spawn 3 calibration targets (simple wireframe geometry — `OctahedronGeometry` or `IcosahedronGeometry` with `LineSegments` + `VectorMaterials.create()` + `BLOOM_LAYER`). Position them at fixed offsets ahead of the camera path. Track destruction via `enemyDestroyed` events or by monitoring target references. When all 3 destroyed, emit completion trigger, advance. Subscribe to `weaponFired` event to count fires (need at least 3). Show/hide prompt.
  - [x]4.7 **Step 4 (Secondary Weapons)**: Emit dialogue trigger `"tutorial:step4"`. Show prompt with weapon key summary. Auto-advance after 5 seconds.
  - [x]4.8 **Step 5 (Shields)**: Emit dialogue trigger `"tutorial:step5"`. After 3 seconds, fire a single slow-moving projectile at the player dealing 10 damage (emit `playerHit` event). Wait for shield change event confirmation, then emit completion trigger `"tutorial:step5:complete"`. Auto-advance after completion dialogue.
  - [x]4.9 **Step 6 (Alarm)**: Emit dialogue trigger `"tutorial:step6"`. After 3 seconds, emit `"tutorial:step6:alarm"`. After alarm dialogue duration, set `completed = true`.
  - [x]4.10 `enter()`: Reset all step state, set current step to 0, instantiate `TutorialPrompt`, emit `dialogueTrigger` for step 1.
  - [x]4.11 `exit()`: Clean up any remaining calibration targets from scene, dispose `TutorialPrompt`, unsubscribe from any events.
  - [x]4.12 `isComplete()`: Return `this.completed`.
  - [x]4.13 Calibration targets: Create as simple `THREE.LineSegments` with `OctahedronGeometry`/`EdgesGeometry` pattern. Give each a collider sphere for collision. Register with `GameObjectManager` or manage directly. On Data Lance bolt collision (subscribe to appropriate events or check collision manually), destroy and trigger shard explosion via `EffectsManager`.

- [x] Task 5: Integrate TutorialPhase into LevelManager (AC: #7, #8)
  - [x]5.1 In `LevelManager.ts`, import `TutorialPhase` and the `InputManager` type.
  - [x]5.2 Add `inputManager: InputManager` and `effectsManager: EffectsManager` to the `LevelManager` constructor (effectsManager is already a parameter). Add `inputManager` as a new constructor parameter.
  - [x]5.3 In `enter()`, create a `TutorialPhase` instance and insert it as the FIRST element in the `this.phases` array (before dogfight).
  - [x]5.4 Update the phase type tracking. The `PHASE_TYPES` constant or equivalent needs to include `'tutorial'` at index 0 so `phaseStart` events emit the correct phase type. Consider making this dynamic or adjusting the array to `['tutorial', 'dogfight', 'surface', 'corridor', 'boss']`.
  - [x]5.5 Update `isUsingMainRail()` to return `true` during the tutorial phase as well (since tutorial uses the main rail). Check: if `currentPhaseIndex === 0` (tutorial) OR `currentPhaseIndex === 1` (dogfight), return true.
  - [x]5.6 Pass `inputManager` through from `main.ts` when constructing `LevelManager`. Add the parameter to the constructor call.

- [x] Task 6: Load tutorial.json at game init (AC: #13)
  - [x]6.1 In `main.ts`, add a `fetch('assets/dialogue/tutorial.json')` chain following the same independent pattern as `handler.json` and `bosses.json`. Parse as `DialogueScript` and call `dialogueManager.loadScript(script)`.

- [x] Task 7: Write tests (AC: #15, #16)
  - [x]7.1 Create `src/__tests__/TutorialPhase.test.ts`. Test: enter initializes step 0, step progression advances on conditions, isComplete returns true after final step, exit cleans up.
  - [x]7.2 Create `src/__tests__/TutorialPrompt.test.ts`. Test: show/hide visibility, text content, dispose DOM cleanup. Use `// @vitest-environment jsdom` directive.
  - [x]7.3 Test that `tutorial.json` entries have correct trigger IDs matching the `TutorialPhase` trigger emission pattern.
  - [x]7.4 Run full test suite to verify zero regressions.

- [x] Task 8: Build verification (AC: #14, #16)
  - [x]8.1 Run `npm run build` — zero TypeScript errors.
  - [x]8.2 Run `npm run test` — all tests pass including all existing Story 4-1 and 4-2 tests.

## Dev Notes

### Architecture Compliance

- **TutorialPhase in `src/state/phases/`** — alongside DogfightPhase, SurfacePhase, CorridorPhase, BossPhase. Same interface pattern. [Source: game-architecture.md#Directory Structure]
- **TutorialPrompt in `src/ui/screens/`** — alongside CommOverlay, GameOverScreen. HTML overlay pattern. [Source: game-architecture.md#Directory Structure]
- **EventBus-only communication**: TutorialPhase emits `dialogueTrigger` events. DialogueManager handles the display. No cross-system imports. [Source: game-architecture.md#Architectural Boundaries]
- **UI never imports game logic**: TutorialPrompt receives display commands, never accesses entity state. [Source: game-architecture.md#Architectural Boundaries]
- **JSON dialogue at `assets/dialogue/`**: `tutorial.json` loaded at runtime. [Source: game-architecture.md#Configuration Management]
- **Phase integration through LevelManager**: TutorialPhase is managed by LevelManager's existing phase sequence system. [Source: game-architecture.md#Level/Phase System]

### Critical Implementation Rules

- **Use `VectorMaterials.create(id)` for ALL materials** — calibration targets must use VectorMaterials. NEVER `new LineBasicMaterial()` directly. [Source: project-context.md#Critical Implementation Rules]
- **`mesh.layers.enable(BLOOM_LAYER)` on all vector geometry** — calibration targets must bloom. [Source: project-context.md#Critical Implementation Rules]
- **Use `Logger.level('System', message, context)`** for all logging — `Logger.info('Tutorial', ...)` and `Logger.debug('Tutorial', ...)`.
- **No `fetch()` during gameplay frames**: `tutorial.json` loads at init alongside other scripts.
- **Event names are `camelCase`**: `dialogueTrigger`, `weaponFired`, `playerHit`.
- **Delta time cap**: Already handled in main.ts. Tutorial phase `update(dt)` receives capped dt.
- **No `new Entity()` in gameplay code**: Calibration targets should use factory pattern or direct Three.js geometry (they're simple enough for direct creation since they're not pooled entities).

### Existing Code Patterns to Follow

- **Phase interface pattern**: Follow `DogfightPhase.ts` exactly — `enter()`, `update(dt)`, `exit()`, `isComplete()`.
- **DOM creation pattern**: Follow `CommOverlay.ts` / `GameOverScreen.ts` — `document.createElement`, `Object.assign(el.style, {...})`, append to `document.body`.
- **Event emission**: `eventBus.emit('dialogueTrigger', { triggerId: 'tutorial:step1' })`.
- **fetch() pattern in main.ts**: Follow existing handler.json/bosses.json chains exactly.
- **Test patterns**: Follow existing `DialogueManager.test.ts` / `CommOverlay.test.ts` structure.

### What Already Exists (DO NOT recreate)

- `src/narrative/DialogueManager.ts` — handles `dialogueTrigger` events, displays through CommOverlay. NO changes needed.
- `src/narrative/DialogueTypes.ts` — `DialogueEntry`, `DialogueScript` types. No changes needed.
- `src/ui/screens/CommOverlay.ts` — displays dialogue text. No changes needed.
- `src/core/GameEvents.ts` — `dialogueTrigger` event, `phaseStart`, `playerHit`, `weaponFired` all defined. No changes needed (except possibly verify `'tutorial'` PhaseType flows through).
- `src/core/InputManager.ts` — `isActive()` method for all input actions. No changes needed.
- `src/systems/LevelManager.ts` — phase sequence management. MODIFY to add tutorial phase.
- `src/rendering/VectorMaterials.ts` — material creation. Use for calibration targets.
- `src/systems/EffectsManager.ts` — vector shard explosions. Use for target destruction.
- `assets/dialogue/handler.json` — 8 handler lines. Do NOT modify.
- `assets/dialogue/bosses.json` — 9 Gatekeeper lines. Do NOT modify.
- `assets/dialogue/tutorial.json` — exists as `{ "entries": [] }`. Replace contents.

### What Must Be Created

- `src/state/phases/TutorialPhase.ts` — Tutorial phase class with step-based progression.
- `src/ui/screens/TutorialPrompt.ts` — HTML overlay for tutorial prompts.

### What Must Be Modified

- `src/types/game.ts` — Add `'tutorial'` to PhaseType union.
- `src/systems/LevelManager.ts` — Insert TutorialPhase as first phase, update phase type tracking, add inputManager parameter.
- `src/main.ts` — Add `fetch('assets/dialogue/tutorial.json')` init chain, pass `inputManager` to LevelManager constructor.
- `assets/dialogue/tutorial.json` — Replace empty entries with tutorial dialogue.
- `src/__tests__/` — New test files for TutorialPhase and TutorialPrompt.

### Narrative Design Context

The tutorial is the game's opening — the first thing every player experiences. It establishes Ghost's voice and the handler-jockey relationship. Key design requirements from the narrative design document:

- **Diegetic framing**: Ghost runs a "calibration protocol" — systems check, not a tutorial. The fourth wall is never broken. The player is a new deck jockey being onboarded. [Source: narrative-design.md#Key Conversations #1, gdd.md#Tutorial Integration]
- **Ghost's tutorial voice**: Professional, dry, slightly warm. Good at her job and it shows. This is the baseline of calm professionalism — its later erosion across levels has maximum impact. [Source: narrative-design.md#Key Conversations #1]
- **Seamless transition**: Tutorial ends with alarms. "That's not a drill. We've got incoming." No menu, no pause. The real mission begins immediately. [Source: gdd.md#Tutorial Integration]
- **Tone**: Curiosity — "First time jacking in?" Not handholding, not condescending. A professional calibrating a tool. [Source: gdd.md#Difficulty Table]
- **All weapons available after tutorial**: The tutorial introduces all 4 weapons briefly. No unlocking. Arcade purity. [Source: gdd.md#Mechanic Progression]

### Previous Story Intelligence

From Story 4-1 (Handler Comm Overlay):
- `DialogueManager` handles `dialogueTrigger` events and displays through `CommOverlay`. This is the ONLY mechanism for tutorial dialogue display — emit the trigger, DialogueManager does the rest.
- CommOverlay tests required `// @vitest-environment jsdom` directive since project default is `node`.
- `dialogueTrigger` event was NOT pre-existing — had to be added. It now exists and works.
- DOM creation follows inline styles pattern, not external CSS.

From Story 4-2 (AI Taunt System):
- Multiple scripts can be loaded into DialogueManager without conflicts (handler + bosses both work).
- Adding a third script (tutorial) follows the same pattern.
- Test count: 1285 tests across 102 files after 4-2. All must still pass.

### Scope Boundaries

**IN scope**: Tutorial phase for Level 1 only. ~8-10 handler dialogue lines. Step-based progression. Calibration targets. TutorialPrompt overlay. LevelManager integration.

**NOT in scope** (future stories):
- Audio playback for tutorial lines (Story 4-5, 4-9)
- Voice audio synthesis (Story 4-9)
- Tutorial skip option (Epic 6 game flow)
- Briefing screen after tutorial (Story 4-4)
- Tutorial for Levels 2/3 (not needed — tutorial is one-time)

### Project Structure Notes

- All new files align with the architecture's directory structure.
- `TutorialPhase.ts` goes in `src/state/phases/` alongside other phase classes.
- `TutorialPrompt.ts` goes in `src/ui/screens/` alongside CommOverlay and GameOverScreen.
- Tutorial dialogue JSON goes in `assets/dialogue/tutorial.json` (file exists, contents replaced).
- No new directories needed.

### Testing Notes

- Use Vitest (already configured).
- TutorialPrompt tests need `// @vitest-environment jsdom` directive (same as CommOverlay tests).
- TutorialPhase tests mock EventBus, InputManager, VectorMaterials, Scene, Camera.
- Follow existing phase testing patterns if any exist, otherwise follow DialogueManager test patterns.
- Test step progression independently — each step's completion condition should be testable.

### References

- [Source: narrative-design.md#Key Conversations #1, "Calibration Protocol"] — Tutorial dialogue direction, Ghost's voice, diegetic framing
- [Source: narrative-design.md#Story Beats, Beat 1-2] — First Jack-In and Mission Goes Live, tutorial → alarm transition
- [Source: narrative-design.md#Dialogue Style, "Ghost"] — Clipped, professional, dry with slight warmth
- [Source: narrative-design.md#In-Game Storytelling] — Comm chatter labeled "HANDLER", triggered by gameplay events
- [Source: gdd.md#Tutorial Integration] — Diegetic tutorial design, arrow keys → spacebar → Z/X/C → shields → alarm sequence
- [Source: gdd.md#Mechanic Progression] — All weapons available from start after tutorial
- [Source: gdd.md#Difficulty Table] — Tutorial baseline: gentle, calibration targets, "First time jacking in?"
- [Source: game-architecture.md#Game State Management] — Menu → Tutorial → Briefing → Playing → Ending FSM
- [Source: game-architecture.md#Level/Phase System] — Phase classes with enter/update/exit lifecycle
- [Source: game-architecture.md#Narrative System] — DialogueManager, trigger-based delivery, JSON format
- [Source: game-architecture.md#Directory Structure] — TutorialState.ts in state/, phases in state/phases/
- [Source: epics.md#Epic 4, Story 3] — "Diegetic tutorial where the handler walks me through controls so that onboarding feels like part of the story"
- [Source: 4-1-handler-comm-overlay-system.md#Future Story Dependencies] — Story 4-3 uses tutorial.json with tutorial triggers
- [Source: 4-2-ai-taunt-system.md#Future Story Dependencies] — Story 4-3 unrelated to boss taunts

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- `enum` syntax not allowed with `erasableSyntaxOnly` TypeScript config. Used `const` object with `as const` pattern instead for TutorialStep constants.
- `EffectsManager.spawnExplosion()` is private. Calibration targets emit `enemyDestroyed` via EventBus instead, so EffectsManager picks up the explosion automatically.
- LevelManager test file needed comprehensive updates: added TutorialPhase mock, updated phase indices (tutorial now at index 0), added inputManager to deps, updated all test expectations for the new 5-phase sequence.

### Completion Notes List

- Task 1: Added `'tutorial'` to `PhaseType` union in `src/types/game.ts`.
- Task 2: Created `TutorialPrompt` HTML overlay at `src/ui/screens/TutorialPrompt.ts`. Green monospace text with glow, center-bottom positioning, CSS pulse animation, show/hide with fade transitions. Follows CommOverlay DOM pattern.
- Task 3: Replaced empty `assets/dialogue/tutorial.json` with 10 handler tutorial dialogue entries. Covers all 6 tutorial steps: welcome, movement, Data Lance, secondary weapons, shields, and alarm transition. All priority 3, speaker "handler". Ghost's voice: professional, dry, diegetic calibration framing.
- Task 4: Created `TutorialPhase` at `src/state/phases/TutorialPhase.ts`. Step-based progression: Welcome (timer) -> Movement (all 4 arrow keys) -> Data Lance (spawn 3 calibration targets, destroy all) -> Secondary Weapons (timer) -> Shields (emit playerHit, wait for shieldChanged) -> Alarm (two dialogue triggers, then complete). CalibrationTarget inner class: wireframe octahedron with bloom, takeDamage emits enemyDestroyed for explosion effects, registered with GameObjectManager for collision detection.
- Task 5: Modified `LevelManager` to insert TutorialPhase as first phase. Updated PHASE_TYPES to `['tutorial', 'dogfight', 'surface', 'corridor', 'boss']`. Updated `isUsingMainRail()` to return true for both tutorial (index 0) and dogfight (index 1). Added `inputManager` constructor parameter.
- Task 6: Added `fetch('assets/dialogue/tutorial.json')` init chain in `main.ts`. Passed `inputManager` to LevelManager constructor.
- Task 7: Created 8 TutorialPrompt tests and 12 TutorialPhase tests. Updated 21 existing LevelManager tests for new phase sequence. All 1311 tests pass across 104 files, zero regressions.
- Task 8: `npm run build` succeeds with zero TypeScript errors. `npx tsc --noEmit` passes clean. Full test suite passes.

### Change Log

- 2026-03-26: Story 4-3 implemented -- Diegetic tutorial sequence. Added TutorialPhase with 6-step calibration protocol, TutorialPrompt HTML overlay, 10 tutorial dialogue entries, LevelManager integration (tutorial as first phase), and 20 new tests. Updated 21 existing LevelManager tests.

### File List

- `src/types/game.ts` -- Modified: added `'tutorial'` to PhaseType union
- `src/state/phases/TutorialPhase.ts` -- New: Tutorial phase class with step-based progression, CalibrationTarget inner class
- `src/ui/screens/TutorialPrompt.ts` -- New: HTML overlay for tutorial prompts with pulse animation
- `assets/dialogue/tutorial.json` -- Modified: replaced empty entries with 10 handler tutorial dialogue entries
- `src/systems/LevelManager.ts` -- Modified: added TutorialPhase import, inputManager parameter, tutorial as first phase, updated PHASE_TYPES and isUsingMainRail
- `src/main.ts` -- Modified: added tutorial.json fetch chain, passed inputManager to LevelManager
- `src/__tests__/TutorialPhase.test.ts` -- New: 12 tests for TutorialPhase
- `src/__tests__/TutorialPrompt.test.ts` -- New: 8 tests for TutorialPrompt
- `src/__tests__/LevelManager.test.ts` -- Modified: added TutorialPhase mock, inputManager dep, updated all test expectations for 5-phase sequence
