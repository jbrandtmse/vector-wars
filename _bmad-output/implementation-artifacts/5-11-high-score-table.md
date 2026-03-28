# Story 5.11: High Score Table

Status: review

## Story

As a player,
I want to see my score on a high score table so that replay motivation exists.

## Acceptance Criteria

1. **HighScoreManager class** exists at `src/systems/HighScoreManager.ts`. It handles localStorage persistence of a top-10 high score table. Each entry stores `{ initials: string, score: number, date: string }`. The localStorage key is `"vectorWarsHighScores"`. It provides methods: `getScores(): HighScoreEntry[]`, `isHighScore(score: number): boolean`, `addScore(initials: string, score: number): HighScoreEntry[]`, and `clearScores(): void`. Scores are sorted descending by score. Maximum 10 entries stored.

2. **HighScoreScreen class** exists at `src/ui/screens/HighScoreScreen.ts`. It is an HTML overlay (same pattern as EndingScreen/GameOverScreen/BriefingScreen) that displays the high score table in vector-styled text (Courier New, palette glow via `getPaletteHexColor()`/`getPaletteCSSGlow()`/`getPaletteCSSMultiGlow()`). It shows: title "HIGH SCORES", a ranked list of entries (rank, initials, score, date), and a prompt at the bottom. If the player's current score qualifies as a high score, an initials entry mode is shown first (3-character input using keyboard). After entry (or if score does not qualify), the full table is displayed with a "PRESS SPACE TO PLAY AGAIN" restart prompt.

3. **Initials entry mode**: When the player's score qualifies as a high score, HighScoreScreen shows "NEW HIGH SCORE!" title, the score value, and a 3-character initials input. The input uses three fixed character slots initialized to "A". Arrow Up/Down cycles each slot through A-Z and 0-9. Arrow Left/Right selects the active slot. Space/Enter confirms the entry. The active slot has a pulsing/blinking animation. This is the classic arcade initials input experience.

4. **HighScoreScreen is shown after the EndingScreen credits complete** instead of the simple "PRESS SPACE TO PLAY AGAIN" restart prompt. EndingScreen is modified: when credits finish scrolling, instead of showing the restart prompt directly, it calls a callback (`onCreditsComplete`) that triggers HighScoreScreen display. The HighScoreScreen handles restart after the table is displayed.

5. **HighScoreScreen is shown after GameOverScreen** as well. When the player dies and GameOverScreen shows, after the player presses Space, instead of immediately reloading, the HighScoreScreen is displayed first (if the score qualifies for the table -- otherwise reload immediately). This gives game-over players a chance to record their score before restarting.

6. **HighScoreManager handles localStorage gracefully**: If localStorage is unavailable (private browsing, storage full), the manager falls back to an in-memory array. It wraps all `localStorage.getItem`/`setItem` in try-catch. Corrupted data is silently reset to an empty array. The game never crashes due to storage issues.

7. **Default high scores**: On first load (no localStorage data), the table is initialized with 10 default entries: classic arcade-style initials (ACE, DEV, CPU, etc.) with descending scores from 50000 to 5000. This ensures the table is never empty and gives players targets to beat.

8. **main.ts integration**: A singleton `highScoreManager` is created in main.ts. It is passed to EndingScreen and GameOverScreen (or accessible as a module-level export from HighScoreManager.ts). The EndingScreen and GameOverScreen are updated to use HighScoreScreen for score recording and display.

9. Running `npx tsc --noEmit` produces zero TypeScript errors.

10. Unit tests exist (Vitest) for:
    - HighScoreManager: getScores returns default entries on first load
    - HighScoreManager: addScore inserts and sorts correctly
    - HighScoreManager: addScore limits to 10 entries
    - HighScoreManager: isHighScore returns true for qualifying score
    - HighScoreManager: isHighScore returns false for non-qualifying score
    - HighScoreManager: handles corrupted localStorage data gracefully
    - HighScoreManager: handles localStorage unavailable gracefully
    - HighScoreManager: clearScores resets to defaults
    - HighScoreScreen: creates overlay DOM element on show()
    - HighScoreScreen: displays initials entry when score qualifies
    - HighScoreScreen: displays table without initials entry when score does not qualify
    - HighScoreScreen: initials entry cycles characters with Up/Down keys
    - HighScoreScreen: initials entry selects slot with Left/Right keys
    - HighScoreScreen: Space/Enter confirms initials entry and shows table
    - HighScoreScreen: shows restart prompt after table is displayed
    - HighScoreScreen: Space key triggers page reload after restart prompt appears
    - HighScoreScreen: dispose cleans up DOM and event listeners
    - EndingScreen: calls onCreditsComplete callback when credits finish
    - GameOverScreen: shows HighScoreScreen when score qualifies

11. All existing tests continue to pass -- zero regressions.

## Tasks / Subtasks

- [x] Task 1: Create HighScoreManager (AC: #1, #6, #7)
  - [x] 1.1 Create `src/systems/HighScoreManager.ts` with HighScoreEntry type and HighScoreManager class
  - [x] 1.2 Implement localStorage read/write with try-catch fallback to in-memory array
  - [x] 1.3 Implement getScores(), isHighScore(), addScore(), clearScores()
  - [x] 1.4 Implement default scores initialization (10 entries: ACE 50000, DEV 45000, CPU 40000, etc.)
  - [x] 1.5 Export module-level singleton instance

- [x] Task 2: Create HighScoreScreen (AC: #2, #3)
  - [x] 2.1 Create `src/ui/screens/HighScoreScreen.ts` as HTML overlay class following EndingScreen/GameOverScreen pattern
  - [x] 2.2 Implement `show(finalScore: number, highScoreManager: HighScoreManager)` method
  - [x] 2.3 Implement initials entry mode: 3-slot character selection (A-Z, 0-9), Up/Down cycles, Left/Right selects, Space/Enter confirms
  - [x] 2.4 Implement high score table display: ranked list with initials, score, date
  - [x] 2.5 Implement restart prompt with pulsing animation after table display
  - [x] 2.6 Implement `dispose()` for cleanup (remove DOM, clear timers, remove listeners)
  - [x] 2.7 Highlight the player's newly-added entry in the table (brighter glow)

- [x] Task 3: Integrate with EndingScreen (AC: #4)
  - [x] 3.1 Modify EndingScreen: add `onCreditsComplete` callback parameter or method
  - [x] 3.2 Replace restart prompt logic in EndingScreen with callback invocation when credits finish
  - [x] 3.3 In main.ts, wire EndingScreen's onCreditsComplete to show HighScoreScreen

- [x] Task 4: Integrate with GameOverScreen (AC: #5)
  - [x] 4.1 Modify GameOverScreen: after Space press, check if score qualifies for high score
  - [x] 4.2 If qualifies, show HighScoreScreen instead of immediate reload
  - [x] 4.3 If does not qualify, reload immediately (existing behavior)

- [x] Task 5: Update main.ts (AC: #8)
  - [x] 5.1 Import HighScoreManager and HighScoreScreen
  - [x] 5.2 Create highScoreManager singleton instance
  - [x] 5.3 Wire EndingScreen and GameOverScreen to use HighScoreScreen with highScoreManager

- [x] Task 6: Write tests (AC: #10, #11)
  - [x] 6.1 Create `src/__tests__/HighScoreManager.test.ts` with tests for persistence, sorting, limits, error handling
  - [x] 6.2 Create `src/__tests__/HighScoreScreen.test.ts` with tests for DOM creation, initials entry, table display, restart
  - [x] 6.3 Update EndingScreen tests for onCreditsComplete callback behavior
  - [x] 6.4 Update GameOverScreen tests for high score integration
  - [x] 6.5 Verify all existing tests still pass

- [x] Task 7: Build verification (AC: #9, #11)
  - [x] 7.1 Run `npx tsc --noEmit` -- zero TypeScript errors
  - [x] 7.2 Run `npm run test` -- all tests pass, zero regressions

## Dev Notes

### Architecture Compliance

- **Systems never import each other.** HighScoreManager is an independent system. It does NOT import ScoreManager, EventBus, or any other system. It only handles localStorage persistence. [Source: project-context.md#Architecture Rules]
- **UI never imports game logic.** HighScoreScreen receives the HighScoreManager instance and score as parameters. It does not reach into ScoreManager or any gameplay system. [Source: project-context.md#Architecture Rules]
- **Use `Logger.info/warn/error()`** -- NEVER `console.log()`. [Source: project-context.md#Critical Don't-Miss Rules]
- **`erasableSyntaxOnly: true`**: No `enum`. Use `type` unions and `as const` objects for HighScoreEntry type. [Source: tsconfig.json]
- **`verbatimModuleSyntax: true`**: Use `import type { ... }` for type-only imports. [Source: tsconfig.json]
- **Persistence: `localStorage` only.** No backend, no cookies, no IndexedDB. [Source: project-context.md#Platform & Build Rules]

### Critical Implementation Rules

- **localStorage key**: Use `"vectorWarsHighScores"` as the storage key. Store as JSON string.
- **Data format** per architecture: `{ "highScores": [{ "initials": "ACE", "score": 48500, "date": "2026-03-26" }] }`. Top 10 scores stored. [Source: game-architecture.md#Persistence]
- **Date format**: ISO date string `YYYY-MM-DD` (e.g., "2026-03-26"). Use `new Date().toISOString().split('T')[0]`.
- **Initials**: 3 uppercase characters. Allow A-Z and 0-9. Default to "AAA".
- **Score sorting**: Descending by score value. Ties broken by earlier date (first to achieve wins).
- **Max entries**: 10. When adding an 11th, drop the lowest.
- **HighScoreScreen follows EndingScreen/GameOverScreen DOM pattern**: full-viewport overlay, CSS transitions, palette-aware colors, Courier New font, dispose() cleanup.
- **Ending is NOT skippable per narrative design.** The high score table appears AFTER credits complete, not before. It replaces the simple restart prompt at the end.
- **GameOverScreen restart flow change**: Currently Space triggers `window.location.reload()`. Modified to check high score qualification first.

### Existing Code Patterns to Follow

- **EndingScreen.ts** at `src/ui/screens/` -- Complex overlay with sequenced phases, CSS animations, palette-aware colors, dispose() cleanup. The `showRestartPrompt()` method will be replaced with a callback to trigger HighScoreScreen.
- **GameOverScreen.ts** at `src/ui/screens/` -- Simple overlay with restart prompt. Modify to check `highScoreManager.isHighScore()` before reloading.
- **BriefingScreen.ts** at `src/ui/screens/` -- Full-screen overlay with scrolling text, CSS transitions, requestAnimationFrame animation.
- **ScoreManager.ts** at `src/systems/` -- Existing score tracking. HighScoreManager is a SEPARATE system for persistence. ScoreManager tracks the live game score; HighScoreManager persists historical high scores.
- **PaletteColors.ts** at `src/rendering/` -- `getPaletteHexColor()`, `getPaletteCSSGlow()`, `getPaletteCSSMultiGlow()` for palette-aware CSS colors.

### What Already Exists (DO NOT recreate)

- `src/systems/ScoreManager.ts` -- Live score tracking. DO NOT MODIFY. Use `scoreManager.getScore()` to get final score.
- `src/ui/screens/EndingScreen.ts` -- Ending sequence overlay. MODIFY to replace restart prompt with onCreditsComplete callback.
- `src/ui/screens/GameOverScreen.ts` -- Game over overlay. MODIFY to integrate high score check before reload.
- `src/rendering/PaletteColors.ts` -- CSS color utilities. DO NOT MODIFY.
- `src/core/GameEvents.ts` -- Event definitions. DO NOT MODIFY (no new events needed).
- `src/core/EventBus.ts` -- Pub/sub system. DO NOT MODIFY.
- `src/main.ts` -- Game init. MODIFY to create HighScoreManager, wire EndingScreen/GameOverScreen to HighScoreScreen.
- `src/config/constants.ts` -- Game constants. DO NOT MODIFY (no new constants needed outside HighScoreManager).

### What Must Be Created

- `src/systems/HighScoreManager.ts` -- localStorage high score persistence (top-10, sorted, with defaults)
- `src/ui/screens/HighScoreScreen.ts` -- High score table display with initials entry
- `src/__tests__/HighScoreManager.test.ts` -- Tests for persistence, sorting, error handling
- `src/__tests__/HighScoreScreen.test.ts` -- Tests for DOM creation, initials entry, table display

### What Must Be Modified

- `src/ui/screens/EndingScreen.ts` -- Replace restart prompt with onCreditsComplete callback
- `src/ui/screens/GameOverScreen.ts` -- Add high score check before reload
- `src/main.ts` -- Import HighScoreManager/HighScoreScreen, create singleton, wire into EndingScreen/GameOverScreen flows
- `src/__tests__/EndingSequence.test.ts` -- Update tests for onCreditsComplete callback change
- `src/__tests__/GameOverManager.test.ts` -- Update if GameOverScreen integration affects GameOverManager tests

### Scope Boundaries

**IN scope**: HighScoreManager with localStorage persistence, HighScoreScreen with initials entry and table display, EndingScreen integration (after credits), GameOverScreen integration (after game over), default high scores, graceful localStorage error handling.

**NOT in scope** (future stories):
- Cyberspace fragmentation visual effect -- Story 5-12
- Main menu high scores view -- Story 6-1 (menu screen will access HighScoreManager to display scores)
- Volume settings persistence -- Story 6-7
- Online leaderboards -- explicitly out of scope (local only per GDD)

### Previous Story Intelligence

From Story 5-10 (Ending Sequence):
- Test count: 1896 tests across 130 files.
- `erasableSyntaxOnly: true` -- No enums. Use type unions and `as const` objects.
- `verbatimModuleSyntax: true` -- Use `import type { ... }` for type-only imports.
- Used `vi.hoisted()` in tests to properly handle hoisted `vi.mock` factory references.
- EndingScreen DOM pattern: full-viewport overlay, CSS transitions, requestAnimationFrame scrolling, dispose() cleanup.
- EndingScreen `showRestartPrompt()` is the method that shows the restart prompt after credits. This will be modified to call an `onCreditsComplete` callback instead.
- GameOverScreen restart uses Space key + 500ms delay guard. Modify to check high score before reload.
- `RESTART_GUARD_DELAY` constant (1000ms) in EndingScreen for restart prompt activation delay.

### Project Structure Notes

- New files go in existing directories (`src/systems/`, `src/ui/screens/`, `src/__tests__/`)
- No new directories needed
- No new npm dependencies needed
- Test files go in `src/__tests__/` alongside existing test files
- Architecture specifies `HighScoreScreen.ts` at `src/ui/screens/` [Source: game-architecture.md#Directory Structure]

### References

- [Source: game-architecture.md#Persistence] -- localStorage with JSON, top 10 scores, { initials, score, date } format
- [Source: game-architecture.md#Core Systems] -- "Score/High Score System: Low complexity, localStorage persistence, accuracy/speed/damage scoring"
- [Source: game-architecture.md#Directory Structure] -- `HighScoreScreen.ts` at `src/ui/screens/`, `ScoreManager.ts` at `src/systems/`
- [Source: gdd.md#Economy and Resources] -- "Score is tracked and displayed on the local high score table. Score rewards skilled play."
- [Source: gdd.md#Replayability] -- "High score chasing: Score tracks accuracy, speed, and damage taken. Each run produces a different score."
- [Source: gdd.md#Technical Requirements] -- "localStorage API for high score persistence. No cookies, no backend."
- [Source: narrative-design.md#Ending Structure] -- "Final screen: high score table. The arcade tradition. Your run, your score, your victory."
- [Source: narrative-design.md#Narrative Flow] -- "HIGH SCORE TABLE --- Your run. Your score. Your victory." (appears after ending sequence)
- [Source: epics.md#Epic 5 Story 11] -- "As a player, I can see my score on a high score table so that replay motivation exists"
- [Source: project-context.md#Platform & Build Rules] -- "Persistence: localStorage only. No backend, no cookies, no IndexedDB."

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- HighScoreManager uses localStorage with key `vectorWarsHighScores`. Data stored as `{ highScores: [...] }` JSON. Graceful fallback to in-memory array on storage errors. Default 10 entries with arcade-style initials (ACE, DEV, CPU, NET, RAM, SYS, BIT, HEX, ROM, VEC) with scores from 50000 to 5000.
- HighScoreScreen follows EndingScreen/GameOverScreen DOM overlay pattern. Two modes: initials entry (3-slot A-Z/0-9 character picker with keyboard navigation) and table display (ranked list with highlighted player entry). Uses zIndex 15 to layer above EndingScreen/GameOverScreen (zIndex 10).
- EndingScreen extended with `onCreditsComplete` callback. When set, `showRestartPrompt()` invokes the callback instead of showing the default restart prompt. Callback receives finalScore.
- GameOverScreen extended with `onRestart` callback. When set, Space press invokes callback instead of `window.location.reload()`. GameOverScreen hides itself before invoking callback.
- GameOverManager extended with `setOnRestart()` public method to configure the GameOverScreen callback without exposing the private screen instance.

### Completion Notes List

- Task 1: Created HighScoreManager at src/systems/HighScoreManager.ts. localStorage persistence with JSON format `{ highScores: [...] }`. Top 10 entries sorted descending. Graceful error handling with try-catch and in-memory fallback. Default arcade-style entries. Methods: getScores(), isHighScore(), addScore(), clearScores(). Validates entry structure on load, resets to defaults on corrupted data.
- Task 2: Created HighScoreScreen at src/ui/screens/HighScoreScreen.ts. Full-viewport HTML overlay with two modes. Initials entry mode: 3 character slots cycling A-Z/0-9 via Up/Down keys, Left/Right to select slot, Space/Enter to confirm. Active slot has blinking animation. Table display mode: ranked list showing rank, initials, score, date. Player's new entry highlighted with brighter glow. Pulsing restart prompt with guard delay.
- Task 3: Modified EndingScreen to add `onCreditsComplete` public callback property and `finalScore` storage. `showRestartPrompt()` checks for callback and invokes it instead of showing restart prompt when set.
- Task 4: Modified GameOverScreen to add `onRestart` public callback property. When Space is pressed and `onRestart` is set, hides the game over overlay and invokes callback with score instead of reloading. Modified GameOverManager to add `setOnRestart()` public method.
- Task 5: Updated main.ts: imported HighScoreManager and HighScoreScreen, created highScoreManager singleton, wired EndingScreen.onCreditsComplete to create HighScoreScreen, wired GameOverManager.setOnRestart to show HighScoreScreen when score qualifies (or reload when it doesn't).
- Task 6: Created HighScoreManager.test.ts (12 tests), HighScoreScreen.test.ts (10 tests). Added 1 test to EndingSequence.test.ts for onCreditsComplete callback. Added 1 test to GameOverManager.test.ts for setOnRestart. Updated GameOverScreen mock to include onRestart property. Total new tests: 24 (1896 -> 1924).
- Task 7: `npx tsc --noEmit` passes clean. Full test suite: 1924 tests across 132 files, all pass, zero regressions.

### Change Log

- 2026-03-26: Story 5-11 implemented -- High Score Table. Created HighScoreManager for localStorage persistence of top-10 scores. Created HighScoreScreen with arcade-style initials entry and ranked table display. Extended EndingScreen with onCreditsComplete callback. Extended GameOverScreen with onRestart callback via GameOverManager.setOnRestart(). Wired all components in main.ts. Added 28 new tests.

### File List

- `src/systems/HighScoreManager.ts` -- New: localStorage high score persistence (top-10, sorted, defaults, error handling)
- `src/ui/screens/HighScoreScreen.ts` -- New: high score table overlay with initials entry and ranked display
- `src/__tests__/HighScoreManager.test.ts` -- New: 12 tests for persistence, sorting, limits, error handling, defaults
- `src/__tests__/HighScoreScreen.test.ts` -- New: 10 tests for DOM creation, initials entry, table display, restart
- `src/ui/screens/EndingScreen.ts` -- Modified: added onCreditsComplete callback, finalScore storage
- `src/ui/screens/GameOverScreen.ts` -- Modified: added onRestart callback, currentScore storage
- `src/systems/GameOverManager.ts` -- Modified: added setOnRestart() public method
- `src/main.ts` -- Modified: imported HighScoreManager/HighScoreScreen, created singleton, wired EndingScreen/GameOverScreen to HighScoreScreen
- `src/__tests__/EndingSequence.test.ts` -- Modified: added onCreditsComplete callback test
- `src/__tests__/GameOverManager.test.ts` -- Modified: updated GameOverScreen mock, added setOnRestart test
