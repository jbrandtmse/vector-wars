# Story 4.1: Handler Comm Overlay System

Status: review

## Story

As a player,
I want to see and hear handler comm messages during gameplay,
so that narrative is delivered without interrupting action.

## Acceptance Criteria

1. A `DialogueTypes.ts` file exists at `src/narrative/DialogueTypes.ts`. It defines TypeScript interfaces for the dialogue system:
   - `DialogueEntry`: `{ id: string; trigger: string; speaker: 'handler' | 'gatekeeper' | 'avenger' | 'coreIntelligence'; text: string; audio?: string; priority: number; duration?: number; }` — priority 1 = low (ambient chatter), 2 = medium (context lines), 3 = high (boss taunts / critical narrative).
   - `DialogueScript`: `{ entries: DialogueEntry[] }` — a collection loaded from JSON.
   - `DialogueSpeakerConfig`: `{ label: string; color: string; }` — maps speaker ID to display name and color for the comm overlay.

2. A `DialogueManager.ts` file exists at `src/narrative/DialogueManager.ts`. It subscribes to events on the `eventBus` (from `src/core/GameEvents.ts`) and evaluates trigger conditions from loaded dialogue scripts. It maintains a priority queue of pending dialogue lines. When a matching event fires, it queues the corresponding `DialogueEntry`. The highest-priority entry at the front of the queue is displayed via the `CommOverlay`. Lines are displayed for their `duration` (default 4 seconds) or until preempted by a higher-priority line. Lower-priority lines that are queued while a higher-priority line is showing are held and displayed afterward in FIFO order (within same priority). A currently-displaying line can only be preempted by a strictly higher priority line.

3. `DialogueManager` has the following public API:
   - `constructor(commOverlay: CommOverlay)` — stores reference to the overlay for display.
   - `loadScript(script: DialogueScript): void` — registers dialogue entries. Can be called multiple times to add entries from multiple JSON files (tutorial.json, handler.json, bosses.json).
   - `update(dt: number): void` — ticks the current display timer, advances to next queued line when current expires, hides overlay when queue is empty.
   - `clearQueue(): void` — removes all pending lines and hides overlay. Used on phase transitions or state changes.
   - `dispose(): void` — unsubscribes all event listeners.

4. `DialogueManager` subscribes to the `dialogueTrigger` event (already defined in `GameEvents.ts`). When `dialogueTrigger` fires with `{ triggerId: string }`, DialogueManager finds all entries whose `trigger` matches `triggerId`, and enqueues them. It also subscribes to `phaseStart`, `phaseEnd`, `bossHealthChanged`, `bossDefeated`, `enemyDestroyed`, and `levelComplete` events — mapping each to trigger IDs using a convention: `phaseStart` with `{ phase: 'dogfight', level: 1 }` maps to trigger ID `"phaseStart:dogfight:1"`. This convention allows JSON dialogue files to specify triggers like `"phaseStart:dogfight:1"` or `"bossHealthChanged:below50"`.

5. A `CommOverlay.ts` file exists at `src/ui/screens/CommOverlay.ts`. It creates and manages an HTML overlay element for displaying dialogue text. The overlay is positioned at the bottom-left of the viewport (above the shield bar area, not overlapping the Three.js HUD). It follows the same DOM pattern as `GameOverScreen.ts` — creates elements dynamically, appends to `document.body`, uses inline styles.

6. `CommOverlay` visual design matches the vector aesthetic:
   - Container: `position: fixed; bottom: 12%; left: 3%; max-width: 45%; z-index: 5; pointer-events: none;`
   - Speaker label: monospace font, `HANDLER` (or boss name in CAPS), color matching the current palette green (`#00ff41`), with CSS text-shadow glow (`0 0 10px #00ff41`). Font size `clamp(0.7rem, 1.5vw, 1rem)`. Letter-spacing `0.15em`.
   - Message text: monospace font, same green color, font size `clamp(0.8rem, 1.8vw, 1.1rem)`, glow text-shadow. Text appears with a typewriter effect — characters revealed one at a time at ~30 characters/second using a `revealProgress` counter incremented in `update(dt)`.
   - Fade-in on show (opacity 0 to 1 over 0.2s), fade-out on hide (opacity 1 to 0 over 0.3s). Use CSS transitions for opacity.
   - A thin horizontal line (1px, green, glow) separates the speaker label from the text, matching the vector aesthetic.

7. `CommOverlay` has the following public API:
   - `constructor()` — creates DOM elements, initially hidden.
   - `show(speaker: string, text: string, color?: string): void` — displays a line. Sets the speaker label (uppercase), sets the message text, starts the typewriter reveal, triggers fade-in. If `color` is provided, uses it for both label and text (for boss dialogue in future stories).
   - `update(dt: number): void` — advances the typewriter reveal progress.
   - `hide(): void` — triggers fade-out, then hides the element after the transition completes.
   - `isVisible(): boolean` — returns whether the overlay is currently showing.
   - `dispose(): void` — removes DOM elements.

8. New events added to `GameEvents` interface in `src/core/GameEvents.ts`:
   - `dialogueTrigger: DialogueTriggerEvent` where `DialogueTriggerEvent = { triggerId: string }`. (Note: this event is already defined in the interface. Verify it exists; if so, no change needed. If the interface has the type but not the actual event definition, add it.)

9. A sample `handler.json` dialogue file exists at `assets/dialogue/handler.json` containing 5-8 handler lines for Level 1 gameplay. These are placeholder lines that demonstrate the trigger system works. Example entries:
   ```json
   {
     "entries": [
       { "id": "handler_phase1_start", "trigger": "phaseStart:dogfight:1", "speaker": "handler", "text": "Cipher, you're clear of the perimeter. Stay sharp.", "priority": 2, "duration": 4 },
       { "id": "handler_first_kill", "trigger": "firstEnemyDestroyed", "speaker": "handler", "text": "Good kill. Keep moving.", "priority": 1, "duration": 3 },
       { "id": "handler_surface_start", "trigger": "phaseStart:surface:1", "speaker": "handler", "text": "Fortress in sight. Target those firewall nodes.", "priority": 2, "duration": 4 },
       { "id": "handler_corridor_start", "trigger": "phaseStart:corridor:1", "speaker": "handler", "text": "Cipher... this corridor. This is where we lost Wraith's signal.", "priority": 3, "duration": 5 },
       { "id": "handler_corridor_encourage", "trigger": "phaseStart:corridor:1:mid", "speaker": "handler", "text": "Keep moving.", "priority": 1, "duration": 2 },
       { "id": "handler_boss_start", "trigger": "phaseStart:boss:1", "speaker": "handler", "text": "Massive construct ahead. That's the Gatekeeper.", "priority": 3, "duration": 4 },
       { "id": "handler_boss_vulnerable", "trigger": "bossVulnerable", "speaker": "handler", "text": "It's exposed! Hit it now!", "priority": 2, "duration": 3 },
       { "id": "handler_level_complete", "trigger": "levelComplete:1", "speaker": "handler", "text": "Cipher... you actually did it. First breach confirmed.", "priority": 3, "duration": 5 }
     ]
   }
   ```

10. `DialogueManager` is integrated into the game loop. In `main.ts` (or wherever the game loop runs), `dialogueManager.update(dt)` is called each frame. `CommOverlay.update(dt)` is called each frame for the typewriter effect. The `DialogueManager` and `CommOverlay` are instantiated during game initialization (after the renderer and event system are set up).

11. The `DialogueManager` handles a `firstEnemyDestroyed` trigger by subscribing to `enemyDestroyed` and tracking a boolean flag — it emits the `dialogueTrigger` with `triggerId: "firstEnemyDestroyed"` only on the first enemy kill per phase (reset on `phaseStart`).

12. Speaker configuration: `DialogueManager` uses a static map of speaker configs:
    ```typescript
    const SPEAKER_CONFIGS: Record<string, DialogueSpeakerConfig> = {
      handler: { label: 'HANDLER', color: '#00ff41' },
      gatekeeper: { label: 'GATEKEEPER', color: '#00ff41' },
      avenger: { label: 'AVENGER', color: '#00ff41' },
      coreIntelligence: { label: 'CORE INTELLIGENCE', color: '#00ff41' },
    };
    ```
    Colors are all green for now (Level 1). Future stories (Epic 5) will update colors per palette when the color depth system is applied to UI.

13. Running `npm run build` produces a clean production build with zero TypeScript errors.

14. Unit tests exist (Vitest) for:
    - `DialogueTypes` — type validation (compile-time, no runtime tests needed beyond import verification).
    - `DialogueManager` — loadScript adds entries, trigger matching (exact match), priority queue ordering (higher priority preempts), display timer expiration advances queue, clearQueue empties pending and hides overlay, firstEnemyDestroyed fires only once per phase, event trigger ID convention mapping (phaseStart/phaseEnd/bossHealthChanged generate correct trigger strings), dispose removes event subscriptions.
    - `CommOverlay` — show() makes overlay visible with correct speaker/text, update(dt) advances typewriter progress, hide() triggers fade-out, dispose() removes DOM elements, isVisible() returns correct state.

15. All existing tests continue to pass — zero regressions.

## Tasks / Subtasks

- [x] Task 1: Create dialogue type definitions (AC: #1, #8)
  - [x] 1.1 Create `src/narrative/DialogueTypes.ts` with `DialogueEntry`, `DialogueScript`, and `DialogueSpeakerConfig` interfaces.
  - [x] 1.2 Verify `dialogueTrigger` event exists in `src/core/GameEvents.ts` with `{ triggerId: string }` payload. Add `DialogueTriggerEvent` interface if not already typed. The event name `dialogueTrigger` is already in the `GameEvents` interface — confirm and add the typed interface if missing.

- [x] Task 2: Create CommOverlay HTML component (AC: #5, #6, #7)
  - [x] 2.1 Create `src/ui/screens/CommOverlay.ts`. Follow the exact DOM creation pattern from `GameOverScreen.ts` — `document.createElement`, `Object.assign(el.style, {...})`, append to `document.body`.
  - [x] 2.2 Build DOM structure:
    - Outer container div (fixed position, bottom-left, z-index 5, pointer-events none, opacity 0, CSS transition on opacity).
    - Speaker label div (monospace, uppercase, green with glow, letter-spacing 0.15em).
    - Separator line (1px div, green, glow box-shadow).
    - Message text div (monospace, green with glow).
  - [x] 2.3 Implement `show(speaker, text, color?)`: set speaker label text (uppercase), store full message text, reset reveal progress to 0, set message element text to empty string, set container opacity to 1 (CSS transition handles fade-in). If `color` provided, override label and text color.
  - [x] 2.4 Implement `update(dt)`: advance `revealProgress` by `dt * TYPEWRITER_SPEED` (30 chars/sec). Calculate `charsToShow = Math.floor(revealProgress)`. Set message element `textContent` to `fullText.substring(0, charsToShow)`. Stop advancing when all characters revealed.
  - [x] 2.5 Implement `hide()`: set container opacity to 0. After transition duration (300ms), set `display: none` or move offscreen.
  - [x] 2.6 Implement `isVisible()`, `dispose()`.
  - [x] 2.7 Add constants to `src/config/constants.ts`:
    ```typescript
    // Comm Overlay constants (Story 4-1)
    export const COMM_TYPEWRITER_SPEED = 30;       // characters per second
    export const COMM_DEFAULT_DURATION = 4.0;      // seconds to display a line
    export const COMM_FADE_IN_DURATION = 0.2;      // seconds
    export const COMM_FADE_OUT_DURATION = 0.3;     // seconds
    ```

- [x] Task 3: Create DialogueManager (AC: #2, #3, #4, #11, #12)
  - [x] 3.1 Create `src/narrative/DialogueManager.ts`.
  - [x] 3.2 Implement priority queue: use a simple array sorted by priority (descending). When enqueuing, insert at correct position. When dequeuing, shift from front.
  - [x] 3.3 Implement `loadScript(script)`: iterate `script.entries`, store in an internal `Map<string, DialogueEntry[]>` keyed by trigger ID. Multiple entries can share the same trigger.
  - [x] 3.4 Implement event subscriptions in constructor:
    - Subscribe to `dialogueTrigger` — look up entries by `triggerId`, enqueue all matches.
    - Subscribe to `phaseStart` — emit internal trigger `"phaseStart:{phase}:{level}"`. Also reset `firstEnemyKilled` flag.
    - Subscribe to `phaseEnd` — emit internal trigger `"phaseEnd:{phase}:{level}"`.
    - Subscribe to `bossHealthChanged` — calculate percentage, emit triggers at thresholds: `"bossHealthChanged:below75"`, `"bossHealthChanged:below50"`, `"bossHealthChanged:below25"` (each fired only once per boss encounter, tracked with boolean flags reset on `phaseStart`).
    - Subscribe to `enemyDestroyed` — if `firstEnemyKilled` is false, set to true and emit internal trigger `"firstEnemyDestroyed"`.
    - Subscribe to `levelComplete` — emit internal trigger `"levelComplete:{level}"`.
    - Subscribe to `bossVulnerable` — emit internal trigger `"bossVulnerable"` when `vulnerable === true`.
    - "Emit internal trigger" means: look up entries in the scripts map by that trigger ID, enqueue any matches.
  - [x] 3.5 Implement `update(dt)`:
    - If no current line showing and queue is empty, return.
    - If no current line showing and queue has entries, dequeue the front entry, call `commOverlay.show(speakerConfig.label, entry.text, speakerConfig.color)`, start display timer at 0.
    - If current line is showing, advance display timer by dt. Also call `commOverlay.update(dt)` for typewriter.
    - Check queue: if the front entry has strictly higher priority than current, preempt — hide current, show new.
    - If display timer exceeds entry duration, call `commOverlay.hide()`, set current to null (next frame will pick up queue).
  - [x] 3.6 Implement `clearQueue()`: empty the queue array, hide overlay, set current to null.
  - [x] 3.7 Implement `dispose()`: call `eventBus.off()` for all subscriptions. Call `clearQueue()`.

- [x] Task 4: Create sample dialogue JSON (AC: #9)
  - [x] 4.1 Create `assets/dialogue/handler.json` with the sample entries from AC #9.
  - [x] 4.2 Create `assets/dialogue/tutorial.json` as an empty placeholder: `{ "entries": [] }`.
  - [x] 4.3 Create `assets/dialogue/bosses.json` as an empty placeholder: `{ "entries": [] }`.

- [x] Task 5: Integrate into game loop (AC: #10)
  - [x] 5.1 In `main.ts`, import `CommOverlay` and `DialogueManager`.
  - [x] 5.2 Instantiate `CommOverlay` after renderer setup. Instantiate `DialogueManager` with the overlay reference.
  - [x] 5.3 Load `handler.json` dialogue script at init time (fetch JSON, parse, call `dialogueManager.loadScript()`). Loading happens at startup — this is initialization, not during gameplay frames.
  - [x] 5.4 Add `dialogueManager.update(dt)` call in the animation loop (after `levelManager.update(dt)`, before render calls).
  - [x] 5.5 Wire `dialogueManager.clearQueue()` into phase transition callbacks in `LevelManager` (or listen to `phaseEnd` internally — already handled in Task 3).

- [x] Task 6: Write tests (AC: #14, #15)
  - [x] 6.1 Create `src/__tests__/DialogueManager.test.ts`. Test: loadScript, trigger matching, priority ordering, display timer, clearQueue, firstEnemyDestroyed once-per-phase, event trigger ID convention, dispose.
  - [x] 6.2 Create `src/__tests__/CommOverlay.test.ts`. Test: show/hide visibility, update typewriter, dispose DOM cleanup, isVisible state.
  - [x] 6.3 Run full test suite to verify zero regressions.

- [x] Task 7: Build verification (AC: #13, #15)
  - [x] 7.1 Run `npm run build` — zero TypeScript errors.
  - [x] 7.2 Run `npm run test` — all tests pass.

## Dev Notes

### Architecture Compliance

- **DialogueManager lives in `src/narrative/`** per architecture directory structure. It is the trigger evaluation, queuing, and display orchestrator described in the architecture doc. [Source: game-architecture.md#Narrative System]
- **CommOverlay lives in `src/ui/screens/`** per architecture directory structure — it is an HTML/CSS overlay screen. [Source: game-architecture.md#Directory Structure, line `CommOverlay.ts`]
- **EventBus-only communication**: DialogueManager subscribes to events, never imports systems. Systems emit events (`phaseStart`, `enemyDestroyed`, etc.) and DialogueManager reacts. No cross-system imports. [Source: game-architecture.md#Architectural Boundaries]
- **UI never imports game logic**: CommOverlay receives display commands from DialogueManager and renders text. It never accesses entity state. [Source: game-architecture.md#Architectural Boundaries]
- **JSON dialogue files at `assets/dialogue/`**: Loaded at runtime by DialogueManager. Matches the architecture's data access pattern — async load at init, sync access during gameplay. [Source: game-architecture.md#Configuration Management]
- **HTML overlay approach**: Architecture specifies "Comm overlay (handler/AI dialogue text)" as an HTML/CSS overlay element, NOT Three.js rendered. Uses monospace font, palette colors, CSS glow effects. [Source: game-architecture.md#HUD/UI Decision #9]

### Critical Implementation Rules

- **Use `Logger.level('System', message, context)`** for all logging — never raw `console.log`. Use `Logger.info('Narrative', ...)` and `Logger.debug('Narrative', ...)`.
- **Event names are `camelCase`**: `dialogueTrigger`, `phaseStart`, `enemyDestroyed` — these already exist in `GameEvents.ts`.
- **File naming**: `PascalCase.ts` for TypeScript source. `kebab-case.json` for data files.
- **No `fetch()` during gameplay frames**: Load dialogue JSON files during initialization (before game loop starts) or during state `enter()`. Access synchronously during `update()`.
- **Error handling**: Missing audio files or trigger mismatches should be logged and skipped (non-critical errors), not crash the game. [Source: game-architecture.md#Error Handling]

### Existing Code Patterns to Follow

- **DOM creation pattern**: Follow `GameOverScreen.ts` exactly — `document.createElement`, `Object.assign(el.style, {...})`, append to `document.body`. The game uses inline styles, not external CSS files (the `src/ui/screens/styles/` directory exists but is empty).
- **Event subscription pattern**: Use `eventBus.on('eventName', callback)` and store callback references for cleanup with `eventBus.off()`.
- **Singleton EventBus**: Import `eventBus` from `src/core/GameEvents.ts` — the module-level singleton.
- **HUD is Three.js, screens are HTML**: The Three.js HUD (shields, score, weapon indicator) is parented to the camera in world space. HTML overlays (GameOverScreen, and now CommOverlay) are fixed-position DOM elements on top of the canvas. They do not interfere with each other.
- **z-index layering**: `GameOverScreen` uses `z-index: 10`. CommOverlay should use `z-index: 5` (below game over, above canvas). The Three.js canvas has no explicit z-index.

### What Already Exists (DO NOT recreate)

- `src/core/EventBus.ts` — typed generic EventBus class.
- `src/core/GameEvents.ts` — all event types and the `eventBus` singleton. Already has `dialogueTrigger` in the `GameEvents` interface (verify exact typing).
- `src/types/game.ts` — has `PhaseType`, `WeaponType`, `GameState`.
- `src/core/Logger.ts` — logging utility.
- `src/ui/screens/GameOverScreen.ts` — reference pattern for HTML overlay creation.
- `src/config/constants.ts` — add new constants here.
- `src/systems/LevelManager.ts` — already emits `phaseStart`, `phaseEnd`, `levelComplete` events.
- `assets/dialogue/` directory exists (empty) — put JSON files here.
- `src/narrative/` directory exists (empty) — put DialogueManager and DialogueTypes here.

### What Does NOT Exist Yet (Must Create)

- `src/narrative/DialogueTypes.ts` — type definitions.
- `src/narrative/DialogueManager.ts` — trigger evaluation, queuing, display orchestrator.
- `src/ui/screens/CommOverlay.ts` — HTML comm overlay.
- `assets/dialogue/handler.json` — handler dialogue lines.
- `assets/dialogue/tutorial.json` — empty placeholder.
- `assets/dialogue/bosses.json` — empty placeholder.
- Comm overlay constants in `src/config/constants.ts`.
- Test files for DialogueManager and CommOverlay.

### Narrative Design Context

The handler comm overlay is the primary narrative delivery vehicle for Vector Wars. It displays Ghost's (the handler's) transmissions during gameplay. Key design requirements from the narrative design document:

- **Handler label displays "HANDLER"** (not "GHOST") — maintaining operational anonymity. [Source: narrative-design.md#In-Game Storytelling]
- **Lines are short and punchy during gameplay** — 5-10 words for action callouts. Longer lines (1-2 sentences) for critical moments. [Source: narrative-design.md#Dialogue Style]
- **One-way communication** — player never responds. Dialogue is received, not interacted with. [Source: narrative-design.md#Branching Dialogue System]
- **Priority system**: Boss taunts (priority 3) preempt handler ambient chatter (priority 1). Critical narrative beats (priority 3) are never missed. [Source: game-architecture.md#Narrative System]
- **No dialogue log, no replay** — lines are heard once in context, like a real comm channel. [Source: narrative-design.md#Player Control]
- **Typewriter effect** mimics text appearing on a comm terminal — reinforces the digital/cyberspace aesthetic.

### Future Story Dependencies

This story establishes the foundation that these subsequent stories will build on:
- **Story 4-2 (AI Taunt System)**: Will use the same `DialogueManager` and `CommOverlay` but with boss speaker configs and boss-specific dialogue JSON. The `speaker` field and `DialogueSpeakerConfig` are designed for this.
- **Story 4-3 (Diegetic Tutorial)**: Will load `tutorial.json` with tutorial-specific triggers.
- **Story 4-5 (Audio Manager)**: Will add voice audio playback to dialogue lines. The `audio` field in `DialogueEntry` is included but optional — this story does not implement audio playback. The AudioManager will call `DialogueManager` or listen to events to sync audio with text display.
- **Story 4-9 (Synthesized Handler Voice)**: Will populate the `audio` field in handler.json entries and wire voice playback through the AudioManager's Voice channel.

### Project Structure Notes

- All new files align with the architecture's directory structure.
- `CommOverlay.ts` goes in `src/ui/screens/` alongside `GameOverScreen.ts`.
- `DialogueManager.ts` and `DialogueTypes.ts` go in `src/narrative/`.
- Dialogue JSON files go in `assets/dialogue/`.
- Constants go in `src/config/constants.ts`.
- No new directories need to be created — all target directories already exist.

### Testing Notes

- Use Vitest 4.1.2 (already configured in package.json).
- Mock the EventBus for DialogueManager tests — test that subscribing and emitting events trigger the correct dialogue entries.
- For CommOverlay tests, use JSDOM (Vitest default) to test DOM element creation, show/hide, and typewriter progress.
- Follow existing test patterns in `src/__tests__/` directory.

### References

- [Source: game-architecture.md#Narrative System] — DialogueManager architecture, JSON format, priority system
- [Source: game-architecture.md#HUD/UI Decision #9] — Hybrid Three.js HUD + HTML/CSS menus, comm overlay is HTML
- [Source: game-architecture.md#Directory Structure] — File locations for narrative/, ui/screens/, assets/dialogue/
- [Source: game-architecture.md#Event System] — dialogueTrigger event, EventBus pattern
- [Source: game-architecture.md#Configuration Management] — Dialogue scripts loaded at runtime
- [Source: game-architecture.md#Error Handling] — Non-critical errors (missing audio, trigger mismatch) logged and skipped
- [Source: narrative-design.md#Dialogue Style] — Handler voice: clipped, professional, short declarative sentences
- [Source: narrative-design.md#In-Game Storytelling] — Comm chatter labeled "HANDLER", triggered by gameplay events
- [Source: narrative-design.md#Key Conversations #1-3] — Tutorial calibration, Mentor's Echo, Where Wraith Fell
- [Source: narrative-design.md#Production Planning] — ~40-55 Ghost lines total, ~100 words for Level 1 combat
- [Source: gdd.md#Core Gameplay #4] — Handler text as comm channel overlay labeled "HANDLER"
- [Source: epics.md#Epic 4] — Story 1 scope: handler comm overlay system with text + voice playback

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### Debug Log References
- `dialogueTrigger` event was NOT pre-existing in GameEvents.ts despite story Dev Notes claiming it was. Added `DialogueTriggerEvent` interface and `dialogueTrigger` to the `GameEvents` interface.
- CommOverlay tests required `// @vitest-environment jsdom` directive since the project's default vitest environment is `node` (not jsdom as the testing notes assumed).

### Completion Notes List
- Created full dialogue type system with `DialogueEntry`, `DialogueScript`, and `DialogueSpeakerConfig` interfaces
- Built CommOverlay HTML component with typewriter effect, fade-in/out transitions, and vector aesthetic (green glow, monospace, separator line)
- Implemented DialogueManager with priority queue, event-driven trigger system, speaker config map, and one-shot trigger tracking (firstEnemyDestroyed, boss health thresholds)
- Created 8 handler dialogue lines in handler.json covering all Level 1 phases
- Integrated into main.ts game loop with async dialogue loading at init
- 15 DialogueManager tests + 15 CommOverlay tests = 30 new tests, all passing
- Full suite: 1276 tests pass, zero regressions
- Build: zero TypeScript errors

### File List
- `src/narrative/DialogueTypes.ts` (new) — Dialogue type definitions
- `src/narrative/DialogueManager.ts` (new) — Trigger evaluation, priority queue, display orchestrator
- `src/ui/screens/CommOverlay.ts` (new) — HTML overlay for dialogue text with typewriter effect
- `src/core/GameEvents.ts` (modified) — Added `DialogueTriggerEvent` interface and `dialogueTrigger` event
- `src/config/constants.ts` (modified) — Added COMM_TYPEWRITER_SPEED, COMM_DEFAULT_DURATION, COMM_FADE_IN_DURATION, COMM_FADE_OUT_DURATION
- `src/main.ts` (modified) — Integrated CommOverlay and DialogueManager into game init and animation loop
- `assets/dialogue/handler.json` (new) — 8 handler dialogue entries for Level 1
- `assets/dialogue/tutorial.json` (new) — Empty placeholder
- `assets/dialogue/bosses.json` (new) — Empty placeholder
- `src/__tests__/DialogueManager.test.ts` (new) — 15 tests for DialogueManager
- `src/__tests__/CommOverlay.test.ts` (new) — 15 tests for CommOverlay

## Change Log
- Story 4-1: Implemented handler comm overlay system with DialogueTypes, DialogueManager (priority queue, event-driven triggers), CommOverlay (HTML overlay with typewriter effect), sample dialogue JSON, and game loop integration. Added 30 unit tests. (Date: 2026-03-26)
