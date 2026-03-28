# Story 6.1: Main Menu Screen

Status: review

## Story

As a player,
I want to see a main menu with Start Game, High Scores, and Credits so that the game has a proper entry point.

## Acceptance Criteria

1. **MenuScreen class** exists at `src/ui/screens/MenuScreen.ts`. It is an HTML/CSS overlay screen (same pattern as GameOverScreen, HighScoreScreen, EndingScreen). It creates DOM elements dynamically, uses palette-aware colors via `getPaletteHexColor()`, `getPaletteCSSGlow()`, and `getPaletteCSSMultiGlow()` from `src/rendering/PaletteColors.ts`. The menu uses the green palette (default starting palette).

2. **Menu displays three options:** "START GAME", "HIGH SCORES", and "CREDITS". Options are rendered as styled text elements with vector aesthetic (monospace font `'Courier New', monospace`, green glow text-shadow, letter-spacing). The currently selected option has brighter glow (`getPaletteCSSMultiGlow`) and a pulsing animation. Non-selected options have dimmer glow (`getPaletteCSSGlow`).

3. **Keyboard navigation:** Up/Down arrow keys move the selection highlight between menu options. The selection wraps (pressing Up on first item selects last, pressing Down on last selects first). Space or Enter confirms the selected option. No mouse interaction.

4. **"START GAME" action:** When confirmed, the MenuScreen hides (fade-out transition), then invokes an `onStartGame` callback. The callback is set by main.ts and triggers `levelManager.enter()` to begin the tutorial/gameplay flow. The game currently starts immediately on page load -- this must be changed so that `levelManager.enter()` is NOT called at init time, but only after the menu's START GAME option is confirmed.

5. **"HIGH SCORES" action:** When confirmed, the MenuScreen creates a `HighScoreScreen` instance and calls `show()` with score 0 and the `highScoreManager` in view-only mode (score does not qualify, so initials entry is skipped -- table is displayed directly). A "PRESS ANY KEY TO RETURN" prompt (instead of the normal restart prompt) is shown at the bottom. When any key is pressed, the HighScoreScreen is disposed and the MenuScreen is shown again. To support this, HighScoreScreen is extended with an optional `onReturn` callback: when set, pressing Space (or any key in table mode) calls `onReturn` instead of `window.location.reload()`.

6. **"CREDITS" action:** When confirmed, the MenuScreen shows a credits sub-screen (inline overlay, same DOM container) listing: "VECTOR WARS" title, "DESIGN & CODE: Developer", "NARRATIVE: Developer", "AUDIO: Procedural Web Audio Synthesis", "BUILT WITH: Three.js, Vite, TypeScript, Web Audio API", "Thank you for playing". A "PRESS ANY KEY TO RETURN" prompt is shown. Any key press returns to the main menu.

7. **Menu title:** The top of the menu screen displays "VECTOR WARS" in large text with strong multi-glow (`getPaletteCSSMultiGlow([20, 40, 80])`), followed by a horizontal separator line (same pattern as BriefingScreen separator).

8. **main.ts integration:** On page load, after all systems are initialized, a `MenuScreen` is created and `show()` is called instead of `levelManager.enter()`. The `levelManager.enter()` call currently at line ~375 is removed. The MenuScreen's `onStartGame` callback calls `levelManager.enter()`. The `onStartGame` callback also resumes the AudioContext (via `audioManager.resume()` or equivalent user-gesture activation) to comply with browser autoplay policies.

9. **AudioManager resume support:** If `audioManager` does not already have a `resume()` method that resumes the underlying `AudioContext`, one is added. This ensures the Web Audio API context is resumed on user gesture (menu START GAME click). The method calls `this.listener.context.resume()` on the internal `THREE.AudioListener`.

10. **MenuScreen lifecycle:** `show()` appends the overlay to `document.body` with fade-in. `hide()` fades out and removes from DOM. `dispose()` cleans up all event listeners, timers, and DOM elements. The overlay uses `zIndex: '20'` (above all other screens).

11. Running `npx tsc --noEmit` produces zero TypeScript errors.

12. Unit tests exist (Vitest) for:
    - MenuScreen: exports as a class from ui/screens/MenuScreen
    - MenuScreen: show() creates overlay DOM with z-index 20
    - MenuScreen: displays VECTOR WARS title
    - MenuScreen: displays START GAME, HIGH SCORES, CREDITS options
    - MenuScreen: Up/Down arrow keys change selected option
    - MenuScreen: selection wraps from first to last and last to first
    - MenuScreen: Space key on START GAME calls onStartGame callback
    - MenuScreen: dispose() removes overlay from DOM and cleans up listeners
    - HighScoreScreen: onReturn callback is called instead of reload when set
    - AudioManager: resume() method exists and calls context.resume()

13. All existing tests continue to pass -- zero regressions.

## Tasks / Subtasks

- [x] Task 1: Create MenuScreen class (AC: #1, #2, #3, #7, #10)
  - [x] 1.1 Create `src/ui/screens/MenuScreen.ts` with full-viewport overlay (position fixed, zIndex 20, black background, monospace font)
  - [x] 1.2 Build title section: "VECTOR WARS" large text with triple glow, horizontal separator line
  - [x] 1.3 Build menu options: "START GAME", "HIGH SCORES", "CREDITS" as styled text elements
  - [x] 1.4 Implement selection state: track selectedIndex, highlight current option with multi-glow + pulse animation, dim others
  - [x] 1.5 Implement keyboard handler: ArrowUp/ArrowDown to navigate (with wrap), Space/Enter to confirm
  - [x] 1.6 Implement show() with fade-in transition, hide() with fade-out and DOM removal, dispose() with full cleanup

- [x] Task 2: Implement menu actions (AC: #4, #5, #6)
  - [x] 2.1 START GAME: call hide() then invoke onStartGame callback
  - [x] 2.2 HIGH SCORES: create HighScoreScreen with onReturn callback, show table view, return to menu on key press
  - [x] 2.3 CREDITS: render inline credits sub-screen with "PRESS ANY KEY TO RETURN", key press returns to menu options

- [x] Task 3: Extend HighScoreScreen with onReturn callback (AC: #5)
  - [x] 3.1 Add optional `onReturn: (() => void) | null` property to HighScoreScreen
  - [x] 3.2 In table mode restart key handler: if onReturn is set, call onReturn instead of window.location.reload()

- [x] Task 4: Add AudioManager resume support (AC: #9)
  - [x] 4.1 Check if AudioManager already has a resume method; if not, add `resume()` that calls `this.listener.context.resume()` (or equivalent)

- [x] Task 5: Integrate MenuScreen in main.ts (AC: #8)
  - [x] 5.1 Import MenuScreen
  - [x] 5.2 Remove the existing `levelManager.enter()` call at init time
  - [x] 5.3 Create MenuScreen instance, set onStartGame callback to call audioManager resume + levelManager.enter()
  - [x] 5.4 Call menuScreen.show() after all system initialization

- [x] Task 6: Write tests (AC: #12, #13)
  - [x] 6.1 Create `src/__tests__/MenuScreen.test.ts` with tests for class export, DOM creation, title, options, keyboard navigation, wrapping, confirm callback, dispose cleanup
  - [x] 6.2 Add HighScoreScreen onReturn callback test to existing `src/__tests__/HighScoreScreen.test.ts`
  - [x] 6.3 Create AudioManager resume test (if method is new)
  - [x] 6.4 Verify all existing tests still pass

- [x] Task 7: Build verification (AC: #11, #13)
  - [x] 7.1 Run `npx tsc --noEmit` -- zero TypeScript errors
  - [x] 7.2 Run `npm run test` -- all tests pass, zero regressions

## Dev Notes

### Architecture Compliance

- **HTML/CSS overlay screen pattern:** MenuScreen follows the identical DOM-creation pattern established by GameOverScreen, HighScoreScreen, EndingScreen, and BriefingScreen. Full-viewport fixed overlay, dynamically created DOM elements, CSS transitions for fade-in/out, palette-aware colors, monospace font, dispose() cleanup. [Source: game-architecture.md#HUD/UI]
- **UI never imports game logic:** MenuScreen uses callbacks (onStartGame) to communicate with main.ts. It does not import LevelManager or any game system directly. [Source: game-architecture.md#Architectural Boundaries]
- **Keyboard-only input:** Menu navigation uses ArrowUp/ArrowDown/Space/Enter. No mouse events. [Source: gdd.md#Control Scheme]
- **No fetch() or await in update loops:** All menu interactions are event-driven (keydown listeners), no per-frame updates needed. [Source: project-context.md#Performance Rules]

### Key Patterns to Follow

- **getPaletteHexColor / getPaletteCSSGlow / getPaletteCSSMultiGlow:** All HTML text styling uses these utilities for palette-synchronized colors. Import from `../../rendering/PaletteColors.ts`.
- **CSS keyframe injection:** Inject keyframe animations via `<style>` element appended to `<head>` (same pattern as HighScoreScreen, BriefingScreen). Clean up style element in dispose().
- **Overlay z-index hierarchy:** GameOverScreen=10, BriefingScreen=8, HighScoreScreen=15, EndingScreen=10. MenuScreen uses zIndex=20 to be above everything.
- **Guard delay pattern:** For key handlers that should not respond immediately (like restart prompts), use setTimeout guard delay (500-1000ms) before enabling the handler.
- **DOM removal after fade-out:** Use `setTimeout(() => overlay.remove(), fadeMs)` after setting opacity to 0.

### AudioContext Resume

Browser autoplay policies require a user gesture to resume the AudioContext. Currently the game starts immediately on load (levelManager.enter()), which may cause audio to silently fail. With the menu, the START GAME keypress serves as the user gesture. The onStartGame callback must resume the AudioContext before starting gameplay.

Check AudioManager at `src/audio/AudioManager.ts` for existing resume capability. The THREE.AudioListener creates an AudioContext internally. Call `listener.context.resume()` to activate it.

### Critical Integration Change

The current main.ts calls `levelManager.enter()` directly after initialization (line ~375). This must be replaced with `menuScreen.show()`. The `levelManager.enter()` must only be called from the menu's START GAME callback. This is the single most important integration change -- without it, the game will bypass the menu entirely.

### Previous Story Patterns

- GameOverScreen: simplest overlay pattern (constructor creates DOM, show/hide/dispose lifecycle)
- HighScoreScreen: complex overlay with interactive keyboard input (initials entry), multiple internal states
- BriefingScreen: scrolling content with skip functionality
- EndingScreen: multi-phase sequence with timed transitions

MenuScreen is closest to HighScoreScreen in complexity -- keyboard navigation between options, sub-screens (credits, high scores view).

### File Locations

- New: `src/ui/screens/MenuScreen.ts`
- New: `src/__tests__/MenuScreen.test.ts`
- Modified: `src/main.ts` (remove levelManager.enter(), add MenuScreen integration)
- Modified: `src/ui/screens/HighScoreScreen.ts` (add onReturn callback)
- Modified: `src/audio/AudioManager.ts` (add resume() if needed)
- Possibly modified: `src/__tests__/HighScoreScreen.test.ts` (add onReturn test)

### References

- [Source: game-architecture.md#HUD/UI] -- HTML/CSS overlay for menus
- [Source: game-architecture.md#Architectural Boundaries] -- UI never imports game logic
- [Source: epics.md#Epic 6 Stories] -- Main menu with Start Game, High Scores, Credits
- [Source: gdd.md#Control Scheme] -- Keyboard-only, 5 keys
- [Source: project-context.md#Critical Implementation Rules] -- Architecture rules, performance rules

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- `npx tsc --noEmit` -- zero errors
- `npx vitest run` -- 134 test files, 1967 tests passed, zero failures

### Completion Notes List

- Created MenuScreen class at `src/ui/screens/MenuScreen.ts` following the established HTML/CSS overlay pattern (GameOverScreen, HighScoreScreen, EndingScreen). Features: VECTOR WARS title with triple glow, three menu options with keyboard navigation (Up/Down + wrap), Space/Enter confirmation, credits sub-screen, and HighScoreScreen integration via onReturn callback.
- Extended HighScoreScreen with `onReturn` callback property. When set, the table mode prompt changes to "PRESS ANY KEY TO RETURN" and any key triggers the callback instead of window.location.reload().
- Added `resume()` method to AudioManager that explicitly resumes the AudioContext and starts the ambient hum generator. This ensures browser autoplay policies are satisfied when the user presses START GAME.
- Replaced the direct `levelManager.enter()` call in main.ts with MenuScreen initialization. The game now shows the main menu on load; START GAME triggers audioManager.resume() + levelManager.enter().
- Added 13 new MenuScreen tests, 2 new HighScoreScreen onReturn tests, and 4 new AudioManager resume tests (19 total new tests).
- All 1967 tests pass across 134 test files. Zero regressions.

### File List

- `src/ui/screens/MenuScreen.ts` (new)
- `src/__tests__/MenuScreen.test.ts` (new)
- `src/main.ts` (modified -- added MenuScreen import and integration, removed direct levelManager.enter())
- `src/ui/screens/HighScoreScreen.ts` (modified -- added onReturn callback property and handler)
- `src/audio/AudioManager.ts` (modified -- added resume() method)
- `src/__tests__/HighScoreScreen.test.ts` (modified -- added 2 onReturn tests)
- `src/__tests__/AudioManager.test.ts` (modified -- added 4 resume tests)
