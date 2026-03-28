# Story 6.3: Browser Compatibility Testing

Status: review

## Story

As a developer,
I want to verify the game runs at 60 FPS across Chrome, Firefox, Safari, and Edge,
so that browser compatibility is confirmed and all players get a consistent experience.

## Acceptance Criteria

1. **WebGL 2.0 Detection & Graceful Fallback:** A `BrowserCompatibility` utility module exists at `src/core/BrowserCompatibility.ts` that detects WebGL 2.0 support. If WebGL 2 is unavailable, a user-friendly HTML overlay message is displayed (styled consistently with the game's green-on-black aesthetic) instead of a white screen or cryptic error. The check runs before any Three.js initialization.

2. **Build Target Compatibility:** The Vite build config `build.target` is changed from `'esnext'` to `['es2020', 'chrome111', 'firefox114', 'safari16.4', 'edge111']` so the production bundle works on all target browsers without relying on bleeding-edge JS features. The dev server still uses `esnext` for speed.

3. **Audio Context Resume Robustness:** The existing AudioContext unlock handler in `AudioManager.init()` is verified to work across all four browsers. Safari/iOS requires a user gesture before `AudioContext.resume()` succeeds. The current `click` + `keydown` listener approach is confirmed correct. No changes needed if already robust; document the verification.

4. **Pixel Ratio Clamping:** `renderer.setPixelRatio()` in `main.ts` clamps `window.devicePixelRatio` to a maximum of 2.0 to prevent performance degradation on high-DPI displays (e.g., Retina Macs reporting 2.0-3.0, some Windows displays at 1.25-1.5). This is a one-line change: `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))`.

5. **Resize Handler Debounce:** The `window.addEventListener('resize', ...)` handler in `main.ts` is debounced (150ms) to prevent rapid resize events from causing frame drops or layout thrashing. The handler updates renderer size, camera aspect ratio, and calls `renderPipeline.resize()`.

6. **Visibility Change Handler:** A `visibilitychange` event listener pauses the game loop (`renderer.setAnimationLoop(null)`) when the browser tab is hidden and resumes it when visible again. This prevents background tabs from consuming GPU resources and avoids large delta-time jumps on tab return (complements the existing `Math.min(dt, 1/20)` cap in DeltaTime.ts).

7. **Context Loss Recovery:** A `webglcontextlost` event listener on the renderer canvas calls `event.preventDefault()` and displays a "Recovering..." overlay. A corresponding `webglcontextrestored` event listener hides the overlay. This handles rare but real GPU driver crashes or resource pressure across all browsers.

8. **localStorage Feature Detection:** The existing `HighScoreManager` already has localStorage fallback to in-memory storage. Verify this pattern works in private/incognito browsing modes across all four browsers. No code changes needed if already robust; document the verification.

9. Running `npx tsc --noEmit` produces zero TypeScript errors.

10. Unit tests exist (Vitest) for:
    - BrowserCompatibility: `checkWebGL2Support()` returns true when WebGL2 context is available
    - BrowserCompatibility: `checkWebGL2Support()` returns false when canvas.getContext returns null
    - BrowserCompatibility: `showUnsupportedMessage()` creates a DOM overlay with the error message
    - Pixel ratio clamping: confirms clamped value is used (max 2.0)
    - Resize handler: debounced resize updates renderer and pipeline sizes after delay
    - Visibility change handler: pauses animation loop when document is hidden
    - Visibility change handler: resumes animation loop when document becomes visible
    - Context loss handler: `preventDefault()` is called on contextlost event
    - Context loss handler: recovery overlay is shown on contextlost and hidden on contextrestored

11. All existing tests continue to pass -- zero regressions.

## Tasks / Subtasks

- [x] Task 1: Create BrowserCompatibility utility (AC: #1)
  - [x] 1.1 Create `src/core/BrowserCompatibility.ts` with `checkWebGL2Support(): boolean` that tests `document.createElement('canvas').getContext('webgl2')`
  - [x] 1.2 Add `showUnsupportedMessage(container: HTMLElement): void` that creates a styled overlay div with a message like "WebGL 2.0 Required" + browser upgrade suggestions
  - [x] 1.3 In `src/main.ts`, call `checkWebGL2Support()` BEFORE creating the WebGLRenderer; if false, call `showUnsupportedMessage(container)` and return early (no Three.js init)

- [x] Task 2: Update Vite build target (AC: #2)
  - [x] 2.1 In `vite.config.ts`, change `build.target` from `'esnext'` to `['es2020', 'chrome111', 'firefox114', 'safari16.4', 'edge111']`
  - [x] 2.2 Verify `npm run build` succeeds with the new target

- [x] Task 3: Clamp pixel ratio (AC: #4)
  - [x] 3.1 In `src/main.ts`, change `renderer.setPixelRatio(window.devicePixelRatio)` to `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))`

- [x] Task 4: Add debounced resize handler (AC: #5)
  - [x] 4.1 In `src/main.ts`, wrap the existing resize logic in a debounce (150ms timeout). If no resize handler exists yet, create one that calls `renderer.setSize()`, updates `camera.aspect` and `camera.updateProjectionMatrix()`, and calls `renderPipeline.resize()`
  - [x] 4.2 Clear the debounce timeout on each new resize event (standard debounce pattern)

- [x] Task 5: Add visibility change handler (AC: #6)
  - [x] 5.1 In `src/main.ts`, add `document.addEventListener('visibilitychange', ...)` that calls `renderer.setAnimationLoop(null)` when `document.hidden === true` and restores `renderer.setAnimationLoop(gameLoop)` when visible again
  - [x] 5.2 Ensure the game loop function reference is accessible for re-assignment

- [x] Task 6: Add WebGL context loss/restore handlers (AC: #7)
  - [x] 6.1 In `src/main.ts`, add `renderer.domElement.addEventListener('webglcontextlost', ...)` that calls `event.preventDefault()` and shows a styled "Recovering..." overlay
  - [x] 6.2 Add `renderer.domElement.addEventListener('webglcontextrestored', ...)` that hides the overlay
  - [x] 6.3 Style the overlay consistently with the game's green-on-black aesthetic

- [x] Task 7: Verify existing browser patterns (AC: #3, #8)
  - [x] 7.1 Review AudioManager.init() unlock handler -- confirm `click` + `keydown` listeners with `ctx.resume()` pattern is correct for all browsers
  - [x] 7.2 Review HighScoreManager localStorage fallback -- confirm it handles private browsing mode
  - [x] 7.3 Document verification results in Completion Notes

- [x] Task 8: Write tests (AC: #10, #11)
  - [x] 8.1 Create `src/__tests__/BrowserCompatibility.test.ts` with tests for checkWebGL2Support (true/false), showUnsupportedMessage (DOM creation)
  - [x] 8.2 Create `src/__tests__/BrowserCompat.test.ts` with tests for pixel ratio clamping, resize debounce, visibility change, context loss/restore
  - [x] 8.3 Verify all existing tests pass

- [x] Task 9: Build verification (AC: #9, #11)
  - [x] 9.1 Run `npx tsc --noEmit` -- zero TypeScript errors
  - [x] 9.2 Run `npx vitest run` -- all tests pass, zero regressions

## Dev Notes

### Architecture Compliance

- **Entities never import systems.** BrowserCompatibility is a pure utility in `src/core/` with zero imports from systems or entities. [Source: project-context.md#Architecture Rules]
- **Systems never import each other.** The visibility/context-loss handlers live in main.ts which owns all references. [Source: project-context.md#Architecture Rules]
- **No fetch() or await during gameplay frames.** All browser checks happen at init time, before the game loop starts. [Source: project-context.md#Performance Rules]
- **Logger usage.** Use `Logger.warn('Browser', ...)` for any fallback paths (context loss, no WebGL2, etc.). Never `console.log()`. [Source: project-context.md#Critical Don't-Miss Rules]

### Key Implementation Details

**BrowserCompatibility.checkWebGL2Support():**
```typescript
export function checkWebGL2Support(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    return gl !== null;
  } catch {
    return false;
  }
}
```

**BrowserCompatibility.showUnsupportedMessage():**
Create a `<div>` overlay with:
- Position: fixed, full screen, z-index 9999
- Background: #000, color: #00ff41 (game green)
- Font: monospace
- Text: "SYSTEM ERROR: WebGL 2.0 NOT DETECTED" + "Please update your browser to play Vector Wars"
- Append to the container element

**Pixel ratio clamping (main.ts):**
```typescript
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
```
This prevents 3x Retina displays from tripling the render resolution, which would exceed the 16.67ms frame budget.

**Debounced resize handler (main.ts):**
```typescript
let resizeTimeout: ReturnType<typeof setTimeout> | undefined;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderPipeline.resize(w, h);
  }, 150);
});
```

**Visibility change handler (main.ts):**
```typescript
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    renderer.setAnimationLoop(null);
  } else {
    renderer.setAnimationLoop(gameLoop);
  }
});
```
This requires the game loop function to be a named reference. Check how the current animation loop is set up -- it may already be a named function or may need extraction.

**Context loss/restore handlers (main.ts):**
```typescript
renderer.domElement.addEventListener('webglcontextlost', (event) => {
  event.preventDefault();
  Logger.warn('Browser', 'WebGL context lost, attempting recovery');
  // Show recovery overlay
});

renderer.domElement.addEventListener('webglcontextrestored', () => {
  Logger.info('Browser', 'WebGL context restored');
  // Hide recovery overlay
});
```

### Vite Build Target

Current `vite.config.ts` has `build.target: 'esnext'`. This works for dev but in production could emit syntax that older browser versions don't support. Changing to the explicit browser list ensures Rolldown/esbuild transpiles any features beyond ES2020 (e.g., private class fields with `#`, top-level await). The codebase uses TypeScript `private` keyword (not `#`), so this should be transparent.

### Audio Context Verification Notes

The current AudioManager.init() pattern at lines 110-131 is correct:
- Registers both `click` and `keydown` listeners on `document`
- Calls `ctx.resume()` when AudioContext state is `'suspended'`
- Removes listeners after first successful interaction
- This covers Chrome's autoplay policy, Firefox's identical policy, Safari's stricter user-gesture requirement, and Edge (Chromium-based, same as Chrome)

### localStorage Verification Notes

The HighScoreManager (lines 107-113) already:
- Tests localStorage availability with a write/read/delete cycle
- Catches exceptions (covers Safari private browsing's localStorage quota exception)
- Falls back to in-memory storage
- This pattern is robust for all browsers including incognito/private modes

### Previous Story Intelligence (6-2)

- Story 6-2 confirmed 1976 tests pass across 135 test files
- Main.ts owns all manager references and the game loop
- The game loop is set via `renderer.setAnimationLoop()` -- need to identify the function name used
- resetGameState() and returnToMenu() were added to main.ts
- No browser-specific patterns were added in 6-2

### Files to Modify

- `src/main.ts` -- Add WebGL check, pixel ratio clamp, debounced resize, visibility change, context loss handlers
- `vite.config.ts` -- Update build target

### Files to Create

- `src/core/BrowserCompatibility.ts` -- WebGL 2 detection and unsupported message
- `src/__tests__/BrowserCompatibility.test.ts` -- Tests for BrowserCompatibility utility
- `src/__tests__/BrowserCompat.test.ts` -- Tests for main.ts browser compat changes (pixel ratio, resize, visibility, context loss)

### References

- [Source: epics.md#Epic 6 Story 3] -- Verify game runs at 60 FPS across Chrome, Firefox, Safari, Edge
- [Source: project-context.md#Platform & Build Rules] -- Primary: Web browser (WebGL 2.0). Test on Chrome, Firefox, Safari, Edge
- [Source: project-context.md#Performance Rules] -- 60 FPS stable, <500 draw calls, <3ms post-processing budget
- [Source: project-context.md#Technology Stack] -- Three.js r183 (WebGL 2.0), Vite 8.0.3 + Rolldown
- [Source: gdd.md#Platform Considerations] -- Chrome, Firefox, Safari, Edge, stable frame rate on any fairly modern web-enabled PC or Mac

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- `npx tsc --noEmit` -- zero errors
- `npx vitest run` -- 137 test files, 1992 tests passed, zero failures

### Completion Notes List

- Created `src/core/BrowserCompatibility.ts` with three exported functions: `checkWebGL2Support()` for WebGL 2.0 detection via canvas probe, `showUnsupportedMessage()` for displaying a styled green-on-black error overlay when WebGL 2 is unavailable, and `createContextLossOverlay()` for creating a hidden recovery overlay.
- Updated `src/main.ts` with WebGL 2.0 pre-flight check that runs BEFORE WebGLRenderer creation -- if WebGL 2 is unavailable, shows the unsupported message and throws to prevent further initialization.
- Clamped pixel ratio to max 2.0: `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))` to prevent performance degradation on high-DPI Retina displays.
- Debounced the window resize handler with a 150ms timeout to prevent rapid resize events from causing frame drops. Uses `clearTimeout` + `setTimeout` pattern.
- Extracted the anonymous animation loop callback into a named `gameLoop()` function so it can be referenced by the visibility change handler.
- Added `visibilitychange` event listener that pauses the animation loop (`renderer.setAnimationLoop(null)`) when the tab is hidden and resumes it (`renderer.setAnimationLoop(gameLoop)`) when visible. This prevents background GPU waste and complements the existing delta-time cap.
- Added `webglcontextlost` and `webglcontextrestored` event handlers on the renderer canvas. Context loss calls `preventDefault()` and shows a styled "GPU CONTEXT LOST / Recovering..." overlay. Context restored hides the overlay.
- Updated `vite.config.ts` build target from `'esnext'` to `['es2020', 'chrome111', 'firefox114', 'safari16.4', 'edge111']` for broader production browser compatibility.
- Verified AudioManager.init() AudioContext unlock pattern (lines 110-131): registers `click` + `keydown` listeners, calls `ctx.resume()` on suspended state, removes listeners after first interaction. Correct for Chrome, Firefox, Safari, and Edge autoplay policies.
- Verified HighScoreManager localStorage pattern (lines 107-113): tests availability with write/read/delete cycle, catches exceptions (covers Safari private browsing quota exception), falls back to in-memory storage. Robust across all browsers including incognito/private modes.
- Created 14 new tests across 2 test files: BrowserCompatibility.test.ts (5 tests for WebGL detection, unsupported message, context loss overlay) and BrowserCompat.test.ts (9 tests for pixel ratio clamping, debounced resize, visibility change, context loss handling).
- All 1992 tests pass across 137 test files. Zero regressions.

### File List

- `src/core/BrowserCompatibility.ts` (new -- WebGL 2 detection, unsupported message, context loss overlay)
- `src/main.ts` (modified -- WebGL check, pixel ratio clamp, debounced resize, visibility change, context loss handlers, named gameLoop function)
- `vite.config.ts` (modified -- build target updated from esnext to browser-specific list)
- `src/__tests__/BrowserCompatibility.test.ts` (new -- 5 tests for BrowserCompatibility utility)
- `src/__tests__/BrowserCompat.test.ts` (new -- 9 tests for browser compat patterns)
- `_bmad-output/implementation-artifacts/6-3-browser-compatibility-testing.md` (new -- story file)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified -- status updates)
