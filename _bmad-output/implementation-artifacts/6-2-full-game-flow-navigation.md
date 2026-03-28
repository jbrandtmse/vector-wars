# Story 6.2: Full Game Flow Navigation

Status: review

## Story

As a player,
I want to navigate between menu, gameplay, and ending smoothly so that the full game flow is seamless.

## Acceptance Criteria

1. **Return to Menu from Game Over:** When the player dies (shields deplete) and presses Space on the GameOverScreen or finishes entering high score initials, the game returns to the main menu instead of calling `window.location.reload()`. All gameplay state is properly reset so a new game can start cleanly from the menu.

2. **Return to Menu from Ending Sequence:** After completing Level 3, watching the ending sequence (credits scroll), and optionally entering high score initials, the player is returned to the main menu instead of being stuck or reloading. The game state is fully reset for a fresh playthrough.

3. **Game State Reset:** A `resetGame()` function (or method on a dedicated manager) exists that cleanly resets ALL gameplay state for a fresh run: player shields to full, score to zero, level manager exited/reset to level 1, game over flag cleared, HUD restored, all active enemies/projectiles/effects cleaned up, dialogue manager reset, palette reset to green, scene environment restored (in case cyberspace fragmentation hid it), and active fragmentation disposed. This function is called before showing the menu again after game over or ending.

4. **No `window.location.reload()`:** All flow paths that previously called `window.location.reload()` now use the soft reset + return-to-menu path. The game never reloads the page during normal flow. Specifically:
   - GameOverScreen: Space to restart -> soft reset -> menu
   - HighScoreScreen (after game over): Space to play again -> soft reset -> menu
   - HighScoreScreen (after ending): any key -> soft reset -> menu
   - EndingScreen credits complete -> HighScoreScreen -> soft reset -> menu

5. **Level Complete Overlay:** The inline "LEVEL COMPLETE" overlay shown between levels (in the `levelComplete` event handler in main.ts) continues to work correctly, transitioning from level N to level N+1 via `levelManager.exit()` + `levelManager.startLevel(nextLevel)`.

6. **Menu Screen Reuse:** The MenuScreen instance created at init time is reused when returning to the menu. Calling `menuScreen.show()` again displays the menu with correct state (selection reset to first option, input re-enabled). The onStartGame callback triggers a fresh `levelManager.enter()`.

7. **Seamless Flow:** The complete game flow works seamlessly in this loop:
   - Menu -> START GAME -> Tutorial -> Briefing -> Level 1 -> Level 2 -> Level 3 -> Ending -> High Scores -> Menu
   - Menu -> START GAME -> (die during gameplay) -> Game Over -> (optional High Scores) -> Menu
   - Menu -> HIGH SCORES -> (view table) -> Menu
   - Menu -> CREDITS -> Menu

8. Running `npx tsc --noEmit` produces zero TypeScript errors.

9. Unit tests exist (Vitest) for:
   - GameOverScreen: Space key triggers onRestart callback (not reload)
   - HighScoreScreen: after game-over flow, returns to menu via callback (not reload)
   - Reset function: resets score manager score to zero
   - Reset function: resets player shields to full
   - Reset function: clears game over state
   - MenuScreen: can be shown again after hide (re-entrant show)

10. All existing tests continue to pass -- zero regressions.

## Tasks / Subtasks

- [x] Task 1: Create game reset utility (AC: #3)
  - [x] 1.1 Create a `resetGameState()` function in main.ts (module-level, has access to all managers) that resets: scoreManager, player, gameOverManager, hudManager, levelManager, dialogueManager, palette, sceneEnvironment visibility, and activeFragmentation
  - [x] 1.2 Ensure ScoreManager has a `reset()` method (set score to 0, emit scoreChanged)
  - [x] 1.3 Ensure GameOverManager has a `reset()` method (clear gameOverActive flag, reset preventGameOver)
  - [x] 1.4 Ensure HUDManager has a `showHUD()` or `reset()` method (restore HUD visibility after it was hidden on game over)
  - [x] 1.5 Ensure Player has a `reset()` method or the existing one suffices (shields to full)
  - [x] 1.6 Call `sceneEnvironment.show()` to restore grid/starfield if hidden by cyberspace fragmentation

- [x] Task 2: Wire Game Over flow to return to menu (AC: #1, #4)
  - [x] 2.1 In main.ts, change `gameOverManager.setOnRestart()` callback: instead of showing HighScoreScreen then reloading, show HighScoreScreen with onReturn that calls resetGameState() then menuScreen.show(); if score doesn't qualify, call resetGameState() then menuScreen.show() directly
  - [x] 2.2 Remove any remaining `window.location.reload()` calls from the game-over flow path

- [x] Task 3: Wire Ending Sequence flow to return to menu (AC: #2, #4)
  - [x] 3.1 In the `levelComplete` event handler for level 3, change `endingScreen.onCreditsComplete` callback: show HighScoreScreen with onReturn that calls resetGameState() then menuScreen.show()
  - [x] 3.2 Ensure the EndingScreen is properly disposed after the flow completes

- [x] Task 4: Ensure MenuScreen is re-entrant (AC: #6)
  - [x] 4.1 Verify that calling `menuScreen.show()` a second time works correctly (selectedIndex resets, DOM rebuilt, input re-enabled)
  - [x] 4.2 If needed, add cleanup in show() to handle being called when the menu was previously hidden

- [x] Task 5: Verify level-to-level transitions still work (AC: #5)
  - [x] 5.1 Confirm the inline LEVEL COMPLETE overlay handler in main.ts is unchanged and still calls levelManager.exit() + levelManager.startLevel(nextLevel)

- [x] Task 6: Write tests (AC: #9, #10)
  - [x] 6.1 Add test: GameOverScreen Space triggers onRestart callback
  - [x] 6.2 Add test: HighScoreScreen onReturn callback is invoked (not reload)
  - [x] 6.3 Add test: ScoreManager reset() sets score to 0
  - [x] 6.4 Add test: Player reset() restores shields to max
  - [x] 6.5 Add test: GameOverManager reset() clears gameOverActive
  - [x] 6.6 Add test: MenuScreen show() can be called multiple times (re-entrant)
  - [x] 6.7 Verify all existing tests pass

- [x] Task 7: Build verification (AC: #8, #10)
  - [x] 7.1 Run `npx tsc --noEmit` -- zero TypeScript errors
  - [x] 7.2 Run `npx vitest run` -- all tests pass, zero regressions

## Dev Notes

### Architecture Compliance

- **UI never imports game logic:** The resetGameState() function lives in main.ts where all managers are already in scope. Screens communicate via callbacks only. [Source: game-architecture.md#Architectural Boundaries]
- **Systems never import each other:** Reset coordination goes through main.ts, not cross-system imports. [Source: project-context.md#Architecture Rules]
- **No fetch() or await during gameplay frames:** The reset/menu-return flow is event-driven (callback on keypress), not per-frame. [Source: project-context.md#Performance Rules]
- **EventBus for inter-system communication:** The existing `playerDied`, `levelComplete`, `scoreChanged` events remain the communication mechanism. Reset methods are direct calls from main.ts which owns all manager instances. [Source: game-architecture.md#Event System]

### Key Implementation Details

**resetGameState() scope in main.ts:**
The function must reset the following (all are module-level variables in main.ts):
- `scoreManager.reset()` -- score to 0
- `player.reset()` -- shields to full (Player.reset() already exists from Story 3-10)
- `gameOverManager.reset()` -- clear gameOverActive (new method needed)
- `hudManager.showHUD()` or equivalent -- restore HUD visibility (HUD was hidden by GameOverManager.triggerGameOver)
- `levelManager.exit()` -- clean up any active level/phase state
- `dialogueManager.reset()` -- clear any queued/active dialogue
- `vectorMaterials.setPalette('green')` -- reset to default green palette
- `sceneEnvironment.show()` -- restore grid/starfield visibility (hidden by cyberspace fragmentation ending)
- `activeFragmentation?.dispose()` / `activeFragmentation = null` -- clean up fragmentation effect
- `viewportOffset = { x: 0, y: 0 }` -- reset camera offset
- `currentBankAngle = 0` -- reset camera bank

**GameOverManager.reset() method (new):**
```typescript
reset(): void {
  this.gameOverActive = false;
  this.preventGameOver = false;
}
```

**ScoreManager.reset() method:**
Check if ScoreManager already has a reset method. If not, add:
```typescript
reset(): void {
  this.score = 0;
  eventBus.emit('scoreChanged', { score: 0, delta: 0 });
}
```

**HUDManager visibility restoration:**
Check if HUDManager has a `showHUD()` method. The existing `hideHUD()` is called by GameOverManager. A corresponding `showHUD()` is needed.

**SceneEnvironment.show():**
Check if SceneEnvironment has a `show()` method. Story 5-12 added `hide()` for the cyberspace fragmentation ending. A corresponding `show()` is needed.

**DialogueManager.reset():**
Check if DialogueManager has a `reset()` method. Need to clear active/queued dialogue lines so they don't persist into the next playthrough.

### Flow Diagram

```
                    ┌──────────┐
                    │   MENU   │ <─────────────────────────┐
                    └────┬─────┘                           │
                         │ START GAME                      │
                         v                                 │
                    ┌──────────┐                           │
                    │ TUTORIAL │                           │
                    └────┬─────┘                           │
                         │                                 │
                         v                                 │
                    ┌──────────┐                           │
                    │ BRIEFING │                           │
                    └────┬─────┘                           │
                         │                                 │
                         v                                 │
              ┌─────────────────────┐                      │
              │  GAMEPLAY (L1→L3)   │──── playerDied ──→ GAME OVER ─→ (opt HIGH SCORES) ─→ resetGame() ─┤
              └──────────┬──────────┘                      │
                         │ Level 3 complete                │
                         v                                 │
                    ┌──────────┐                           │
                    │  ENDING  │                           │
                    └────┬─────┘                           │
                         │                                 │
                         v                                 │
                 ┌───────────────┐                         │
                 │  HIGH SCORES  │── resetGame() ──────────┘
                 └───────────────┘
```

### Critical: window.location.reload() Removal

Current `window.location.reload()` calls to replace:
1. **GameOverScreen** (line ~114): `window.location.reload()` when Space pressed and no onRestart callback. This is already intercepted by `gameOverManager.setOnRestart()` in main.ts -- but the HighScoreScreen that's shown afterwards calls `window.location.reload()` when Space is pressed on the table view (line ~431).
2. **HighScoreScreen** (line ~431): `window.location.reload()` when Space pressed on table view (no onReturn callback set). Both the game-over path and ending path must set `onReturn` on HighScoreScreen.

The GameOverScreen's `onRestart` callback (set in main.ts) currently shows HighScoreScreen if the score qualifies, or reloads. Both paths need to route to resetGameState() + menuScreen.show().

### Previous Story Intelligence (6-1)

- MenuScreen follows the standard HTML/CSS overlay pattern (same as GameOverScreen, HighScoreScreen, EndingScreen)
- MenuScreen already has `show()`, `hide()`, `dispose()` lifecycle methods
- MenuScreen.show() rebuilds DOM content (calls `buildDOM()` then `buildMenuContent()`) -- should be re-entrant safe
- The `onStartGame` callback in main.ts calls `audioManager.resume()` + `levelManager.enter()`
- The `onHighScores` callback creates a new HighScoreScreen with onReturn
- AudioManager resume() is idempotent (safe to call multiple times)

### Files to Modify

- `src/main.ts` -- Add resetGameState(), rewire game-over and ending callbacks
- `src/systems/GameOverManager.ts` -- Add reset() method
- `src/systems/ScoreManager.ts` -- Add reset() method (if not present)
- `src/ui/hud/HUDManager.ts` -- Add showHUD() method (if not present)
- `src/rendering/SceneEnvironment.ts` -- Add show() method (if not present)
- `src/narrative/DialogueManager.ts` -- Add reset() method (if not present)

### Files to Create

- `src/__tests__/GameFlowNavigation.test.ts` -- Tests for the game flow navigation story

### References

- [Source: epics.md#Epic 6 Story 2] -- Navigate between menu, gameplay, and ending smoothly
- [Source: game-architecture.md#State Management] -- Game state FSM: Menu -> Tutorial -> Briefing -> Playing -> Ending
- [Source: game-architecture.md#HUD/UI] -- HTML/CSS overlay for menus, game over, high scores
- [Source: gdd.md#Failure Recovery] -- Phase checkpoint, shield recharge, unlimited retries
- [Source: gdd.md#Level Progression] -- No level select, campaign plays start to finish
- [Source: project-context.md#Architecture Rules] -- UI never imports game logic, systems never import each other

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- `npx tsc --noEmit` -- zero errors
- `npx vitest run` -- 135 test files, 1976 tests passed, zero failures

### Completion Notes List

- Created `resetGameState()` function in main.ts that comprehensively resets all gameplay state: score, player shields, game over flag, HUD visibility, level manager, dialogue manager, palette (back to green), scene environment visibility, cyberspace fragmentation, viewport offset, and camera bank angle.
- Created `returnToMenu()` helper in main.ts that calls resetGameState() then menuScreen.show().
- Rewired game-over flow: GameOverManager.setOnRestart callback now shows HighScoreScreen with onReturn callback routing to returnToMenu(), or calls returnToMenu() directly if score doesn't qualify. No more window.location.reload().
- Rewired ending sequence flow: EndingScreen.onCreditsComplete now shows HighScoreScreen with onReturn callback routing to returnToMenu(). No more window.location.reload() after completing the game.
- Added `reset()` method to GameOverManager (clears gameOverActive and preventGameOver flags).
- Added `showHUD()` method to HUDManager (restores HUD visibility after game over).
- Added `reset()` method to DialogueManager (clears queue and resets all one-shot trigger flags for fresh playthrough).
- ScoreManager.reset() and Player.reset() already existed from previous stories.
- SceneEnvironment.show() already existed from Story 5-12.
- MenuScreen.show() is already re-entrant (rebuilds DOM on each call).
- Level-to-level transitions (LEVEL COMPLETE overlay) remain unchanged.
- Added 9 new tests in GameFlowNavigation.test.ts covering: GameOverScreen onRestart callback, HighScoreScreen onReturn callback, ScoreManager reset, Player reset, GameOverManager reset, MenuScreen re-entrancy, HUDManager showHUD, and DialogueManager reset.
- All 1976 tests pass across 135 test files. Zero regressions.

### File List

- `src/main.ts` (modified -- added resetGameState(), returnToMenu(), rewired game-over and ending callbacks)
- `src/systems/GameOverManager.ts` (modified -- added reset() method)
- `src/ui/hud/HUDManager.ts` (modified -- added showHUD() method)
- `src/narrative/DialogueManager.ts` (modified -- added reset() method)
- `src/__tests__/GameFlowNavigation.test.ts` (new -- 9 tests for game flow navigation)
- `_bmad-output/implementation-artifacts/6-2-full-game-flow-navigation.md` (new -- story file)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified -- status updates)
