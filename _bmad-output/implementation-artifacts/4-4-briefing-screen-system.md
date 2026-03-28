# Story 4.4: Briefing Screen System

Status: review

## Story

As a player,
I want to see a briefing screen between tutorial and Level 1,
so that mission context is established and the transition from calibration to combat feels narratively grounded.

## Acceptance Criteria

1. A `BriefingScreen` class exists at `src/ui/screens/BriefingScreen.ts`. It creates a full-screen HTML overlay displaying scrolling vector-styled text — a "Star Wars crawl meets vector aesthetic" design. The overlay covers the entire viewport with a dark semi-transparent background. Public API: `show(briefingData: BriefingData)`, `skip()`, `dispose()`, and an `onComplete` callback.

2. The `BriefingScreen` visual design:
   - Container: `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.92); z-index: 8; pointer-events: auto;` — sits ABOVE game canvas but BELOW game-over overlay (z-index 10).
   - Header section: "MISSION BRIEFING" title centered at top (~10% from top). Monospace, green `#00ff41`, large font (`clamp(2rem, 5vw, 3.5rem)`), letter-spacing `0.2em`, text-shadow glow `0 0 20px #00ff41, 0 0 40px #00ff41`.
   - A horizontal separator line below the header — 1px green with glow (matching CommOverlay separator pattern).
   - Scrolling text region: centered, max-width ~60%, starting from below the separator. Text scrolls upward automatically at a configurable speed (default ~30px/sec). Monospace, green `#00ff41`, font size `clamp(0.9rem, 2vw, 1.3rem)`, line-height 1.8, text-shadow glow `0 0 10px #00ff41`. Text content is provided via the `BriefingData` parameter.
   - Skip prompt at bottom-center: "PRESS ANY KEY TO CONTINUE" in smaller monospace text, with the same pulse animation pattern used in `TutorialPrompt.ts` (opacity 0.7 to 1.0 oscillation). Appears after a 2-second delay to prevent accidental skip.
   - Fade-in on show (opacity 0 to 1, 0.5s CSS transition). Fade-out on complete/skip (opacity 1 to 0, 0.5s).

3. A `BriefingData` interface is defined in a shared location (either `src/types/game.ts` or inline in `BriefingScreen.ts`) with the following shape:
   ```typescript
   interface BriefingData {
     title: string;      // e.g., "MISSION BRIEFING"
     lines: string[];    // Array of text paragraphs to scroll
     speaker: string;    // "handler" — for future audio integration
   }
   ```

4. The scrolling text uses CSS `transform: translateY()` animation driven by JavaScript `requestAnimationFrame`, NOT CSS `@keyframes` — this allows the scroll to be paused/resumed and provides frame-accurate timing. The scroll speed is stored as a constant (`BRIEFING_SCROLL_SPEED` in `src/config/constants.ts`).

5. `BriefingScreen` listens for ANY keydown event to trigger skip (after the 2-second guard delay). On skip: stops the scroll, immediately shows all remaining text for 0.5 seconds, then triggers the `onComplete` callback. On natural scroll completion (text fully scrolled past viewport): triggers `onComplete` after a 2-second hold.

6. A briefing JSON data file exists at `assets/briefings/level-1.json` containing the Level 1 briefing content. The briefing plays AFTER the tutorial and BEFORE the Level 1 dogfight phase. It establishes the mission context: the resistance's last-ditch assault, Ghost setting the stage, the Gatekeeper warning. Content follows Ghost's voice — professional, urgent, slightly impressed that calibration went well. ~5-8 lines of scrolling text, ~200 words total. [Source: narrative-design.md#Key Conversations #5, narrative-design.md#Narrative Delivery]

7. The briefing text content for Level 1 establishes these narrative beats:
   - The calibration is complete. Cipher is ready.
   - This is the last-ditch assault on the AI network's outer perimeter.
   - The resistance has one shot. One deck, one jockey, one run.
   - Intel from Wraith's failed mission provides the approach path.
   - The Gatekeeper — the outer perimeter's guardian AI — stands between Cipher and the deeper network.
   - Ghost's tone: professional but with a thread of urgency. She believes in Cipher but knows the odds.

8. `LevelManager` is modified to insert a briefing phase between the tutorial phase and the dogfight phase. The phase sequence becomes: `tutorial → briefing → dogfight → surface → corridor → boss`. A `BriefingPhase` class at `src/state/phases/BriefingPhase.ts` wraps the `BriefingScreen` and implements the `Phase` interface (`enter()`, `update(dt)`, `exit()`, `isComplete()`).

9. `BriefingPhase` follows the same phase lifecycle pattern as other phases:
   - `enter()`: Loads briefing data, creates and shows the `BriefingScreen`. Emits `phaseStart` with `{ phase: 'briefing', level: 1 }`.
   - `update(dt)`: No-op (BriefingScreen handles its own animation via rAF).
   - `exit()`: Disposes the `BriefingScreen`, cleans up DOM elements.
   - `isComplete()`: Returns true when the briefing screen's `onComplete` fires (either from skip or natural scroll completion).

10. A new `PhaseType` value `'briefing'` is added to the `PhaseType` union in `src/types/game.ts`. The `PHASE_TYPES` array in `LevelManager` is updated to `['tutorial', 'briefing', 'dogfight', 'surface', 'corridor', 'boss']`.

11. During the briefing phase, the main rail movement should NOT be active. `LevelManager.isUsingMainRail()` is updated so that ONLY the dogfight phase uses the main rail (adjusting the index check to account for the new briefing phase position).

12. The briefing JSON is loaded at game initialization in `main.ts`, following the same `fetch()` pattern as dialogue scripts. Loaded data is passed to `LevelManager` which stores it for `BriefingPhase` construction.

13. Running `npm run build` produces a clean production build with zero TypeScript errors.

14. Unit tests exist (Vitest) for:
    - `BriefingScreen` — show/hide visibility, dispose removes DOM elements, skip triggers onComplete, scroll completion triggers onComplete, key guard delay prevents immediate skip.
    - `BriefingPhase` — enter creates BriefingScreen, isComplete returns true after onComplete, exit cleans up.
    - Integration: `PHASE_TYPES` includes `'briefing'`, LevelManager creates BriefingPhase at correct index.

15. All existing tests continue to pass — zero regressions. The tests from Stories 4-1 (30 tests), 4-2 (9 tests), and 4-3 (20 tests) must all still pass.

## Tasks / Subtasks

- [x] Task 1: Add `'briefing'` PhaseType and briefing constants (AC: #10, #4)
  - [x]1.1 In `src/types/game.ts`, add `'briefing'` to the `PhaseType` union type so it becomes `'tutorial' | 'briefing' | 'dogfight' | 'surface' | 'corridor' | 'boss'`.
  - [x]1.2 In `src/config/constants.ts`, add `BRIEFING_SCROLL_SPEED = 30` (pixels per second), `BRIEFING_SKIP_GUARD_DELAY = 2.0` (seconds before skip is enabled), `BRIEFING_HOLD_DURATION = 2.0` (seconds to hold after scroll completes), and `BRIEFING_FADE_DURATION = 0.5` (seconds for fade in/out).

- [x] Task 2: Create BriefingScreen HTML component (AC: #1, #2, #3, #4, #5)
  - [x]2.1 Create `src/ui/screens/BriefingScreen.ts`. Follow the DOM creation pattern from `GameOverScreen.ts` / `CommOverlay.ts` — `document.createElement`, `Object.assign(el.style, {...})`, append to `document.body`.
  - [x]2.2 Define `BriefingData` interface: `{ title: string; lines: string[]; speaker: string; }`.
  - [x]2.3 Build DOM structure: full-screen overlay container (fixed position, dark background rgba(0,0,0,0.92), z-index 8, opacity 0, CSS transition). Header div ("MISSION BRIEFING" large text with glow). Separator line (1px green). Scrolling text container (centered, max-width 60%). Skip prompt at bottom ("PRESS ANY KEY TO CONTINUE" with pulse animation — reuse the `@keyframes` approach from TutorialPrompt).
  - [x]2.4 Implement scrolling text: create inner content div with all text paragraphs. Use `requestAnimationFrame` loop to increment `translateY()` on the content div. Track scroll position. When content has fully scrolled past the viewport top, mark as scroll-complete. Hold for `BRIEFING_HOLD_DURATION` seconds, then trigger `onComplete`.
  - [x]2.5 Implement `show(briefingData: BriefingData, onComplete: () => void)`: populate title and text content, store onComplete callback, append overlay to document.body, trigger fade-in, start scroll animation after fade-in completes. Start skip guard timer.
  - [x]2.6 Implement `skip()`: if skip guard delay has elapsed, stop scroll animation, immediately show all text, wait 0.5s, trigger onComplete.
  - [x]2.7 Implement key listener: on ANY keydown after skip guard delay, call `skip()`. Remove listener on dispose.
  - [x]2.8 Implement `dispose()`: stop rAF loop, remove keydown listener, remove all DOM elements, remove style element from head.

- [x] Task 3: Create Level 1 briefing content JSON (AC: #6, #7)
  - [x]3.1 Create `assets/briefings/` directory.
  - [x]3.2 Create `assets/briefings/level-1.json` with briefing data:
    ```json
    {
      "title": "MISSION BRIEFING",
      "speaker": "handler",
      "lines": [
        "Calibration complete. All systems nominal. You're cleared for insertion.",
        "This is it, Cipher. The outer perimeter of the AI network. No one has breached it since Wraith's run.",
        "Resistance command is sending everything we have on one deck, one jockey, one shot. That's you.",
        "Intel from Wraith's last transmission gives us an approach vector through the perimeter defenses. Sentinels patrol in predictable patterns. Watchdogs will pursue if they detect your signature.",
        "Your primary objective: breach the outer firewall and neutralize the Gatekeeper — the AI construct guarding access to the deeper network. It's never been defeated. It's never needed to adapt.",
        "All weapons are online. Data Lance for fast targets. Logic Bombs for heavy armor. EMP Burst if they swarm you. Save the Virus Payload for the Gatekeeper's core.",
        "I'll be on comms the whole run. Stay sharp, stay fast, and don't stop moving.",
        "Initiating insertion sequence. Good hunting, Cipher."
      ]
    }
    ```

- [x] Task 4: Create BriefingPhase class (AC: #8, #9)
  - [x]4.1 Create `src/state/phases/BriefingPhase.ts` implementing the Phase interface (`enter()`, `update(dt)`, `exit()`, `isComplete()`).
  - [x]4.2 Constructor accepts: `briefingData: BriefingData`. Store the data.
  - [x]4.3 `enter()`: Create `BriefingScreen` instance. Call `show(briefingData, onComplete)` where `onComplete` sets `this.completed = true`.
  - [x]4.4 `update(dt)`: No-op. BriefingScreen manages its own animation.
  - [x]4.5 `exit()`: Call `briefingScreen.dispose()`, null the reference.
  - [x]4.6 `isComplete()`: Return `this.completed`.

- [x] Task 5: Integrate BriefingPhase into LevelManager (AC: #8, #10, #11, #12)
  - [x]5.1 In `LevelManager.ts`, import `BriefingPhase` and `BriefingData` type.
  - [x]5.2 Add `briefingData: BriefingData | null` to the LevelManager constructor. Store it.
  - [x]5.3 In `enter()`, create a `BriefingPhase` instance (using stored briefingData) and insert it BETWEEN the tutorial phase and the dogfight phase. The phase array becomes: `[tutorialPhase, briefingPhase, dogfightPhase, surfacePhase, corridorPhase, bossPhase]`.
  - [x]5.4 Update `PHASE_TYPES` constant to `['tutorial', 'briefing', 'dogfight', 'surface', 'corridor', 'boss']`.
  - [x]5.5 Update `isUsingMainRail()`: return `true` when `currentPhaseIndex === 2` (dogfight, now at index 2) only. Tutorial and briefing do NOT use the main rail. Actually, tutorial DOES use the main rail per Story 4-3 implementation. So: return `true` when `currentPhaseIndex === 0` (tutorial) OR `currentPhaseIndex === 2` (dogfight).
  - [x]5.6 Pass `briefingData` through from `main.ts` when constructing `LevelManager`. Add the parameter to the constructor call.

- [x] Task 6: Load briefing JSON at game init (AC: #12)
  - [x]6.1 In `main.ts`, add a `fetch('assets/briefings/level-1.json')` chain. Parse as `BriefingData`. Store the result so it can be passed to `LevelManager`.
  - [x]6.2 Since the fetch is async and `LevelManager` needs the data synchronously at `enter()` time, either: (a) delay `levelManager.enter()` until the fetch resolves, or (b) pass a `BriefingData | null` and have `BriefingPhase` handle the null case gracefully (skip directly to complete). Option (b) is safer since other fetches also use fire-and-forget pattern. Store fetched data on `levelManager` via a setter method or make `main.ts` track the data.
  - [x]6.3 RECOMMENDED APPROACH: Add a `setBriefingData(data: BriefingData)` method to `LevelManager`. Call it from the fetch `.then()` handler. In `enter()`, if `briefingData` is null, skip the briefing phase entirely (don't insert it into the phases array). This matches the defensive/graceful pattern used for dialogue script loading.

- [x] Task 7: Write tests (AC: #14, #15)
  - [x]7.1 Create `src/__tests__/BriefingScreen.test.ts`. Use `// @vitest-environment jsdom` directive. Test: show creates DOM elements, dispose removes DOM elements, onComplete fires after scroll, skip triggers onComplete, skip guard prevents immediate skip, key listener works after guard delay.
  - [x]7.2 Create `src/__tests__/BriefingPhase.test.ts`. Test: enter creates BriefingScreen and shows it, isComplete returns false initially and true after onComplete, exit disposes BriefingScreen.
  - [x]7.3 Update existing `LevelManager.test.ts`: add BriefingPhase mock, update phase indices (briefing now at index 1), add briefingData parameter, update all test expectations for the new 6-phase sequence.
  - [x]7.4 Run full test suite to verify zero regressions.

- [x] Task 8: Build verification (AC: #13, #15)
  - [x]8.1 Run `npm run build` — zero TypeScript errors.
  - [x]8.2 Run `npm run test` — all tests pass including all existing Story 4-1, 4-2, and 4-3 tests.

## Dev Notes

### Architecture Compliance

- **BriefingPhase in `src/state/phases/`** — alongside TutorialPhase, DogfightPhase, SurfacePhase, CorridorPhase, BossPhase. Same interface pattern. [Source: game-architecture.md#Directory Structure, game-architecture.md#State Management]
- **BriefingScreen in `src/ui/screens/`** — alongside CommOverlay, GameOverScreen, TutorialPrompt. HTML overlay pattern. [Source: game-architecture.md#Directory Structure, game-architecture.md#HUD/UI]
- **Game State FSM includes Briefing**: `Menu -> Tutorial -> Briefing -> Playing -> Ending`. This story implements the `Briefing` state as a phase within the level sequence. [Source: game-architecture.md#State Management]
- **JSON data at `assets/briefings/`**: Briefing content loaded at runtime, not hardcoded. [Source: game-architecture.md#Configuration Management]
- **Phase integration through LevelManager**: BriefingPhase is managed by LevelManager's existing phase sequence system. [Source: game-architecture.md#Level/Phase System]
- **UI never imports game logic**: BriefingScreen receives display data, never accesses entity state. [Source: game-architecture.md#Architectural Boundaries]

### Critical Implementation Rules

- **Use `Logger.level('System', message, context)`** for all logging — `Logger.info('Briefing', ...)` and `Logger.debug('Briefing', ...)`. NEVER `console.log()`.
- **No `fetch()` during gameplay frames**: Briefing JSON loads at init alongside dialogue scripts.
- **Event names are `camelCase`**: `phaseStart`, `phaseEnd`.
- **Delta time cap**: Already handled in main.ts. BriefingPhase `update(dt)` receives capped dt.
- **DOM creation follows inline styles pattern**: No external CSS files. Use `Object.assign(el.style, {...})` and `document.createElement()`.

### Existing Code Patterns to Follow

- **Phase interface pattern**: Follow `TutorialPhase.ts` exactly — `enter()`, `update(dt)`, `exit()`, `isComplete()`.
- **DOM creation pattern**: Follow `GameOverScreen.ts` / `CommOverlay.ts` / `TutorialPrompt.ts` — `document.createElement`, `Object.assign(el.style, {...})`, append to `document.body`.
- **Keyframe animation pattern**: Follow `TutorialPrompt.ts` — inject `<style>` element with `@keyframes` into `document.head`, remove on dispose.
- **fetch() pattern in main.ts**: Follow existing handler.json/bosses.json/tutorial.json chains.
- **Test patterns**: Follow existing `TutorialPrompt.test.ts` / `TutorialPhase.test.ts` structure. Use `// @vitest-environment jsdom` for DOM tests.

### What Already Exists (DO NOT recreate)

- `src/state/phases/TutorialPhase.ts` — Tutorial phase. Completes before briefing. No changes needed.
- `src/state/phases/DogfightPhase.ts` — First gameplay phase. Plays after briefing. No changes needed.
- `src/state/phases/PhaseTransition.ts` — Fade transition between phases. Used automatically by LevelManager. No changes needed.
- `src/systems/LevelManager.ts` — Phase sequence management. MODIFY to add briefing phase.
- `src/core/GameEvents.ts` — `phaseStart`, `phaseEnd` events defined. `PhaseType` imported from types. No changes needed (briefing PhaseType flows through after types update).
- `src/ui/screens/CommOverlay.ts` — Dialogue overlay. Reference for DOM patterns. No changes needed.
- `src/ui/screens/TutorialPrompt.ts` — Tutorial prompts. Reference for pulse animation. No changes needed.
- `src/ui/screens/GameOverScreen.ts` — Game over overlay. Reference for full-screen overlay pattern. No changes needed.
- `src/config/constants.ts` — Game constants. ADD briefing constants here.
- `src/main.ts` — Game init. MODIFY to load briefing JSON and pass to LevelManager.

### What Must Be Created

- `src/ui/screens/BriefingScreen.ts` — Full-screen scrolling text overlay with Star Wars crawl aesthetic.
- `src/state/phases/BriefingPhase.ts` — Phase wrapper for BriefingScreen.
- `assets/briefings/level-1.json` — Level 1 briefing content.

### What Must Be Modified

- `src/types/game.ts` — Add `'briefing'` to PhaseType union.
- `src/config/constants.ts` — Add briefing-related constants.
- `src/systems/LevelManager.ts` — Insert BriefingPhase between tutorial and dogfight, update PHASE_TYPES, update isUsingMainRail, add briefingData parameter/setter.
- `src/main.ts` — Add briefing JSON fetch chain, pass data to LevelManager.
- `src/__tests__/LevelManager.test.ts` — Update for new phase sequence.

### Narrative Design Context

The briefing screen is the narrative bridge between the tutorial calibration and the first real combat. It establishes the mission stakes and transitions from Ghost's dry, professional calibration mode to urgent mission-briefing mode. Key narrative requirements:

- **Star Wars crawl meets vector aesthetic**: Scrolling green monospace text on dark background. Not a direct Star Wars crawl (no perspective transform needed), but the FEELING of scrolling mission text that sets the stage. [Source: narrative-design.md#Narrative Delivery, gdd.md#Level Design Framework]
- **~30 seconds duration**: Brief enough to maintain momentum, long enough to establish context. Skippable via any key press. [Source: gdd.md#Briefing Screens]
- **Ghost's voice**: Professional, urgent, slightly impressed. She didn't expect the calibration to go this well. Setting up the mission with military precision. [Source: narrative-design.md#Key Conversations #5, narrative-design.md#Dialogue Style "Ghost"]
- **Establishes Wraith connection**: Brief reference to Wraith's failed mission providing the intel. Plants the revenge seed for later payoff. [Source: narrative-design.md#Story Beats Beat 1-2]
- **Future audio**: This story creates the visual system only. Audio voice-over will be added in Story 4-9 (synthesized handler voice lines). The `speaker` field in BriefingData prepares for this.
- **Future levels**: Story 5-9 (briefing-screens-all-levels) will create briefing content for Levels 2 and 3. This story creates the reusable BriefingScreen system and Level 1 content only.

### Previous Story Intelligence

From Story 4-3 (Diegetic Tutorial Sequence):
- TutorialPhase follows the Phase interface pattern with `enter()`, `update(dt)`, `exit()`, `isComplete()`. BriefingPhase should follow the same pattern.
- TutorialPrompt uses a `<style>` element injected into `document.head` for keyframe animations. BriefingScreen should use the same approach for its pulse animation.
- LevelManager's `PHASE_TYPES` array was updated to include `'tutorial'`. Now it needs `'briefing'` added after `'tutorial'`.
- LevelManager's `isUsingMainRail()` returns true for index 0 (tutorial) and index 1 (dogfight). With briefing inserted at index 1, indices shift: tutorial=0, briefing=1, dogfight=2. Rail should be active for tutorial (0) and dogfight (2).
- `enum` syntax is not allowed with `erasableSyntaxOnly` TypeScript config. Use `const` objects with `as const` pattern.
- Test count after Story 4-3: 1311 tests across 104 files. All must still pass.

From Story 4-1 (Handler Comm Overlay):
- `CommOverlay` DOM pattern: `document.createElement`, `Object.assign(el.style, {...})`, append to `document.body`.
- Tests requiring DOM need `// @vitest-environment jsdom` directive.

### Scope Boundaries

**IN scope**: BriefingScreen UI component, BriefingPhase class, Level 1 briefing content JSON, LevelManager integration, PhaseType update, constants, tests.

**NOT in scope** (future stories):
- Audio voice-over for briefings (Story 4-9, Story 4-5)
- Briefing content for Levels 2 and 3 (Story 5-9)
- Title/Jack-In screen (Epic 6 — Menu system)
- Ending sequence (Story 5-10)
- Level-specific color palette changes for briefing text (Story 5-5)

### Project Structure Notes

- All new files align with the architecture's directory structure.
- `BriefingPhase.ts` goes in `src/state/phases/` alongside other phase classes.
- `BriefingScreen.ts` goes in `src/ui/screens/` alongside CommOverlay, GameOverScreen, TutorialPrompt.
- Briefing content JSON goes in `assets/briefings/level-1.json` (new directory).
- No new source directories needed. One new asset directory (`assets/briefings/`).

### Testing Notes

- Use Vitest (already configured).
- BriefingScreen tests need `// @vitest-environment jsdom` directive (same as CommOverlay/TutorialPrompt tests).
- BriefingPhase tests mock BriefingScreen (or test the integration with jsdom).
- LevelManager tests need updating for the new 6-phase sequence and briefing phase indices.
- Test the skip guard delay (skip should NOT work in the first 2 seconds).
- Test scroll completion detection.

### References

- [Source: narrative-design.md#Narrative Delivery] — Briefing screens: "Star Wars crawl meets vector aesthetic", ~30 sec each, skippable
- [Source: narrative-design.md#Key Conversations #5, "Briefing: They Know Your Name"] — Briefing 1 narrative direction (Note: this is the Level 2 briefing. Level 1 briefing occurs BEFORE Level 1 starts and establishes initial mission context.)
- [Source: narrative-design.md#Story Beats, Beats 1-2] — Tutorial → Mission Goes Live transition
- [Source: narrative-design.md#Dialogue Style, "Ghost"] — Clipped, professional, dry with slight warmth
- [Source: narrative-design.md#Pacing and Flow] — Briefing screens provide breathing room between intensity peaks
- [Source: gdd.md#Level Design Framework] — "Briefing Screens (x3): Between-level narrative, ~30 sec each, Full-screen vector text scroll with handler voice-over narration"
- [Source: gdd.md#Level Progression] — "Tutorial -> Level 1 -> Briefing -> Level 2 -> Briefing -> Level 3 -> Ending"
- [Source: game-architecture.md#State Management] — "Menu -> Tutorial -> Briefing -> Playing -> Ending"
- [Source: game-architecture.md#HUD/UI] — "Briefing screens (scrolling vector-styled text)" as HTML/CSS overlay
- [Source: game-architecture.md#Directory Structure] — BriefingScreen.ts in src/ui/screens/, BriefingState.ts in src/state/states/
- [Source: epics.md#Epic 4, Story 4] — "briefing screen between tutorial and Level 1 so that mission context is established"
- [Source: 4-3-diegetic-tutorial-sequence.md#Scope Boundaries] — "Briefing screen after tutorial (Story 4-4)" listed as NOT in scope

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- LevelManager phase type tracking needed to be instance-based (not static constant) to support both 5-phase (no briefing) and 6-phase (with briefing) sequences. Created `PHASE_TYPES_WITH_BRIEFING` and `PHASE_TYPES_WITHOUT_BRIEFING` constants, with `this.phaseTypes` instance field selecting the correct one at `enter()` time.
- `isUsingMainRail()` was refactored from index-based checking to type-based checking (`currentType === 'tutorial' || currentType === 'dogfight'`), making it resilient to phase array reordering.
- BriefingScreen uses `requestAnimationFrame` for scroll animation. The scroll position tracks `translateY` offset with `performance.now()` delta timing. Content completion detection uses `offsetHeight` to measure when content has scrolled fully past the viewport.
- Briefing data loading uses a `setBriefingData()` setter pattern (same defensive approach as dialogue script loading) so the fetch can complete asynchronously while `levelManager.enter()` runs synchronously. If data isn't loaded in time, the briefing phase is gracefully skipped.

### Completion Notes List

- Task 1: Added `'briefing'` to `PhaseType` union in `src/types/game.ts`. Added 4 briefing constants to `src/config/constants.ts`: `BRIEFING_SCROLL_SPEED`, `BRIEFING_SKIP_GUARD_DELAY`, `BRIEFING_HOLD_DURATION`, `BRIEFING_FADE_DURATION`.
- Task 2: Created `BriefingScreen` at `src/ui/screens/BriefingScreen.ts`. Full-screen overlay with "MISSION BRIEFING" header, green separator line, scrolling text region with rAF-driven `translateY` animation, "PRESS ANY KEY TO CONTINUE" skip prompt with pulse animation, skip guard delay, and fade transitions. Follows GameOverScreen/CommOverlay DOM creation pattern. Exported `BriefingData` interface.
- Task 3: Created `assets/briefings/level-1.json` with 8 lines of Ghost's mission briefing. Establishes calibration completion, the resistance's last-ditch assault, Wraith's intel, the Gatekeeper objective, weapon summary, and Ghost's professional send-off.
- Task 4: Created `BriefingPhase` at `src/state/phases/BriefingPhase.ts`. Phase wrapper implementing enter/update/exit/isComplete. Creates BriefingScreen on enter, marks complete on BriefingScreen's onComplete callback, disposes on exit.
- Task 5: Modified `LevelManager` to support 6-phase sequence with briefing. Added `BriefingPhase` import, `briefingData` field, `setBriefingData()` setter. Phase array is `[tutorial, briefing, dogfight, surface, corridor, boss]` when briefing data is set, or `[tutorial, dogfight, surface, corridor, boss]` without. Refactored `isUsingMainRail()` to use type-based checking. Introduced instance-level `phaseTypes` field for correct phase-type-to-index mapping.
- Task 6: Added `fetch('assets/briefings/level-1.json')` in `main.ts` after LevelManager construction. Calls `levelManager.setBriefingData()` on success. Imported `BriefingData` type.
- Task 7: Created 12 BriefingScreen tests (show, title, text, skip prompt, style injection, skip guard delay, skip completion, double-skip prevention, dispose DOM cleanup, style cleanup, listener cleanup, data interface). Created 7 BriefingPhase tests (enter creates screen, isComplete false initially, isComplete true after onComplete, exit disposes, update no-throw, exit without enter no-throw, data acceptance). Added 10 LevelManager with-briefing tests (6 phases created, correct start, tutorial-to-briefing, briefing-to-dogfight, full 6-phase sequence, correct phase events, isUsingMainRail false during briefing, isUsingMainRail true during dogfight, levelComplete after 6 phases). Added BriefingPhase mock to existing LevelManager tests.
- Task 8: `npm run build` succeeds with zero TypeScript errors. `npx tsc --noEmit` passes clean. Full test suite: 1344 tests across 106 files, all pass, zero regressions.

### Change Log

- 2026-03-26: Story 4-4 implemented -- Briefing screen system. Added BriefingScreen full-screen overlay with Star Wars crawl-style scrolling text, BriefingPhase wrapper class, Level 1 briefing content JSON, LevelManager integration (optional 6-phase sequence with briefing), and 29 new tests. Updated existing LevelManager tests with BriefingPhase mock.

### File List

- `src/types/game.ts` -- Modified: added `'briefing'` to PhaseType union
- `src/config/constants.ts` -- Modified: added BRIEFING_SCROLL_SPEED, BRIEFING_SKIP_GUARD_DELAY, BRIEFING_HOLD_DURATION, BRIEFING_FADE_DURATION
- `src/ui/screens/BriefingScreen.ts` -- New: Full-screen HTML overlay with scrolling briefing text, skip functionality, and BriefingData interface
- `src/state/phases/BriefingPhase.ts` -- New: Phase wrapper for BriefingScreen implementing Phase interface
- `assets/briefings/level-1.json` -- New: Level 1 mission briefing content (8 lines of Ghost dialogue)
- `src/systems/LevelManager.ts` -- Modified: added BriefingPhase import, briefingData field, setBriefingData() setter, optional briefing phase insertion, instance-level phaseTypes, type-based isUsingMainRail
- `src/main.ts` -- Modified: added briefing JSON fetch chain and BriefingData type import
- `src/__tests__/BriefingScreen.test.ts` -- New: 12 tests for BriefingScreen
- `src/__tests__/BriefingPhase.test.ts` -- New: 7 tests for BriefingPhase
- `src/__tests__/LevelManager.test.ts` -- Modified: added BriefingPhase mock, added 10 tests for with-briefing scenario
