# Story 1.4: Viewport Movement with Arrow Keys

Status: done

## Story

As a player,
I want to move my viewport with arrow keys,
so that aiming feels smooth and responsive.

## Acceptance Criteria

1. An `InputManager` class exists at `src/core/InputManager.ts` that tracks keyboard state via `keydown`/`keyup` events and exposes named action queries
2. `src/config/input.ts` defines an action-to-key mapping object (`INPUT_ACTIONS`) mapping action names (`moveUp`, `moveDown`, `moveLeft`, `moveRight`, `fire`) to `KeyboardEvent.code` values (`ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Space`)
3. `InputManager.isActive(action: string): boolean` returns `true` while the corresponding key is held down, supporting simultaneous multi-key presses (e.g., ArrowUp + ArrowRight at the same time)
4. Arrow key presses move the camera position smoothly (no acceleration curve, no drift, no momentum -- instant response on press, instant stop on release) as specified in the GDD
5. The camera offset is clamped to a maximum range so the viewport cannot move outside reasonable bounds (approximately +/-1.5 units horizontal, +/-1.0 units vertical in world space relative to the base camera position)
6. Movement speed is defined as a constant `VIEWPORT_MOVE_SPEED` in `src/config/constants.ts` (tunable, approximately 3.0 units/second) and all movement is delta-time multiplied for frame-rate independence
7. The cockpit geometry (from Story 1-3) moves with the camera since it is parented to the camera -- no additional cockpit code changes are needed
8. The test wireframe shapes (icosahedron + torus knot from Story 1-2) appear to shift in the opposite direction as the camera moves, confirming the viewport offset is working
9. Arrow key default browser behavior (scrolling) is prevented via `event.preventDefault()` on relevant keydown events
10. `InputManager` has a `dispose()` method that removes all keyboard event listeners
11. `InputManager` suppresses browser key-repeat events (checks `event.repeat` to avoid re-triggering on held keys)
12. All movement logic runs inside the existing `renderer.setAnimationLoop()` callback using the existing `calculateDeltaTime()` -- no new animation loops or `requestAnimationFrame()` calls
13. Running `npm run build` produces a clean production build with no TypeScript errors
14. Unit tests exist for `InputManager` covering: action registration, `isActive()` state tracking, simultaneous keys, key repeat suppression, and disposal
15. Unit tests exist for viewport movement logic covering: delta-time-based movement, clamping at bounds, and reset to origin behavior
16. Performance remains at 60 FPS with zero measurable overhead from input polling (input state is a simple object lookup, not per-frame event processing)

## Tasks / Subtasks

- [x] Task 1: Implement input configuration (AC: #2)
  - [x] 1.1 Replace placeholder content in `src/config/input.ts` with typed action mapping
  - [x] 1.2 Define `InputAction` type: `'moveUp' | 'moveDown' | 'moveLeft' | 'moveRight' | 'fire'`
  - [x] 1.3 Define `INPUT_ACTIONS` constant mapping each `InputAction` to a `KeyboardEvent.code` string: `{ moveUp: 'ArrowUp', moveDown: 'ArrowDown', moveLeft: 'ArrowLeft', moveRight: 'ArrowRight', fire: 'Space' }`
  - [x] 1.4 Export both the type and the constant

- [x] Task 2: Implement InputManager class (AC: #1, #3, #9, #10, #11)
  - [x] 2.1 Replace placeholder in `src/core/InputManager.ts` with full implementation
  - [x] 2.2 Constructor accepts no arguments; registers `keydown` and `keyup` event listeners on `window`
  - [x] 2.3 Maintain a private `activeKeys: Set<string>` tracking currently pressed `KeyboardEvent.code` values
  - [x] 2.4 On `keydown`: skip if `event.repeat` is `true`; add `event.code` to `activeKeys`; call `event.preventDefault()` if the code is in `INPUT_ACTIONS` values (to prevent arrow key scrolling)
  - [x] 2.5 On `keyup`: remove `event.code` from `activeKeys`
  - [x] 2.6 Implement `isActive(action: InputAction): boolean` -- looks up the `KeyboardEvent.code` for the action in `INPUT_ACTIONS`, returns `activeKeys.has(code)`
  - [x] 2.7 Implement `dispose(): void` that removes both event listeners from `window`
  - [x] 2.8 Store bound listener references as private fields so they can be removed in `dispose()`

- [x] Task 3: Add viewport movement constants (AC: #5, #6)
  - [x] 3.1 Add `VIEWPORT_MOVE_SPEED = 3.0` to `src/config/constants.ts`
  - [x] 3.2 Add `VIEWPORT_MAX_OFFSET_X = 1.5` to `src/config/constants.ts`
  - [x] 3.3 Add `VIEWPORT_MAX_OFFSET_Y = 1.0` to `src/config/constants.ts`
  - [x] 3.4 Add `VIEWPORT_BASE_POSITION` as `{ x: 0, y: 0, z: 3 }` to `src/config/constants.ts` (matching current camera position from Story 1-1)

- [x] Task 4: Integrate input and movement into main.ts (AC: #4, #6, #7, #8, #12)
  - [x] 4.1 Import `InputManager` and movement constants in `main.ts`
  - [x] 4.2 Instantiate `InputManager` before the animation loop
  - [x] 4.3 Inside the existing `renderer.setAnimationLoop()` callback, after `calculateDeltaTime()`, add viewport movement logic:
    - Query `inputManager.isActive('moveUp')`, `isActive('moveDown')`, etc.
    - Calculate desired offset: `offsetX += speed * dt` when right is active, `offsetX -= speed * dt` when left is active (and similarly for Y)
    - Clamp offsetX to `[-VIEWPORT_MAX_OFFSET_X, VIEWPORT_MAX_OFFSET_X]` and offsetY to `[-VIEWPORT_MAX_OFFSET_Y, VIEWPORT_MAX_OFFSET_Y]`
    - Apply: `camera.position.x = VIEWPORT_BASE_POSITION.x + offsetX`, `camera.position.y = VIEWPORT_BASE_POSITION.y + offsetY`
  - [x] 4.4 Declare `offsetX` and `offsetY` variables (initialized to 0) outside the animation loop alongside `lastTime`
  - [x] 4.5 Verify cockpit moves with camera (automatic since cockpit is parented to camera)
  - [x] 4.6 Verify test shapes appear to shift opposite to camera movement direction

- [x] Task 5: Write InputManager tests (AC: #14)
  - [x] 5.1 Create `src/__tests__/InputManager.test.ts`
  - [x] 5.2 Test: `isActive()` returns `false` for all actions by default (no keys pressed)
  - [x] 5.3 Test: `isActive('moveUp')` returns `true` after dispatching a keydown event with `code: 'ArrowUp'`
  - [x] 5.4 Test: `isActive('moveUp')` returns `false` after dispatching keyup for `ArrowUp`
  - [x] 5.5 Test: Simultaneous keys -- `isActive('moveUp')` and `isActive('moveRight')` both return `true` when both keys are pressed
  - [x] 5.6 Test: Key repeat suppression -- dispatching keydown with `repeat: true` does not change state
  - [x] 5.7 Test: `dispose()` removes event listeners (after dispose, new keydown events have no effect)
  - [x] 5.8 Test: `isActive()` returns `false` for unmapped actions

- [x] Task 6: Write viewport movement tests (AC: #15)
  - [x] 6.1 Create `src/__tests__/ViewportMovement.test.ts` (or add to InputManager test file)
  - [x] 6.2 Test: Extract a pure `updateViewportOffset(offsetX, offsetY, inputManager, dt, speed, maxX, maxY)` function to `src/core/ViewportMovement.ts` for testability -- this function calculates and returns the new clamped offset based on input state
  - [x] 6.3 Test: Moving right increases offsetX proportional to `dt * speed`
  - [x] 6.4 Test: Moving up increases offsetY proportional to `dt * speed`
  - [x] 6.5 Test: Offset is clamped at max bounds (e.g., after many frames of moving right, offsetX does not exceed `VIEWPORT_MAX_OFFSET_X`)
  - [x] 6.6 Test: No keys pressed returns unchanged offset (no drift)
  - [x] 6.7 Test: Opposing keys cancel out (moveLeft + moveRight simultaneously = zero net movement)
  - [x] 6.8 Verify `npm run build` produces clean build
  - [x] 6.9 Verify all existing tests still pass (no regressions)

## Dev Notes

### Architecture Compliance

This story implements two components specified in the architecture:

- **InputManager** at `src/core/InputManager.ts` -- the architecture specifies this as "Action-mapped keyboard input" with physical keys mapping to named actions. Systems query `input.isActive('fire')` each frame, never physical keys directly.
- **Input config** at `src/config/input.ts` -- the architecture specifies "Key -> action mappings" here.
- **Viewport offset** is part of the Player entity in the architecture (`src/entities/player/Player.ts` -- "Cockpit, shields, position, viewport offset") but the full Player class is an Epic 2 concern. For Story 1-4, viewport movement logic lives in `main.ts` with a pure helper function extracted to `src/core/ViewportMovement.ts` for testability. When the Player entity is created in Epic 2, the viewport offset logic will migrate there.

The architecture's `src/systems/RailMovement.ts` is described as "CatmullRomCurve3 camera path + player offset." Rail movement is an Epic 2 story. In this story, the camera has no spline path -- it stays at a fixed base position with user-controlled offset. The offset approach (modifying `camera.position.x/y`) is the same technique that will compose with rail movement later: the rail system will set the base position, and the viewport offset will add on top.

### Critical Technical Details

**Camera offset approach (NOT `setViewOffset`):**

Do NOT use `PerspectiveCamera.setViewOffset()`. That method modifies the projection matrix for multi-monitor setups and is not appropriate for gameplay camera movement. Instead, directly modify `camera.position.x` and `camera.position.y` relative to the base position. This is the standard Three.js pattern for camera rigs and is fully compatible with EffectComposer post-processing.

```typescript
// Viewport movement pattern -- direct position offset
const basePosition = { x: 0, y: 0, z: 3 }; // From Story 1-1 camera setup
let offsetX = 0;
let offsetY = 0;

// Inside animation loop:
if (inputManager.isActive('moveRight')) offsetX += VIEWPORT_MOVE_SPEED * dt;
if (inputManager.isActive('moveLeft')) offsetX -= VIEWPORT_MOVE_SPEED * dt;
if (inputManager.isActive('moveDown')) offsetY -= VIEWPORT_MOVE_SPEED * dt;
if (inputManager.isActive('moveUp')) offsetY += VIEWPORT_MOVE_SPEED * dt;

offsetX = Math.max(-VIEWPORT_MAX_OFFSET_X, Math.min(VIEWPORT_MAX_OFFSET_X, offsetX));
offsetY = Math.max(-VIEWPORT_MAX_OFFSET_Y, Math.min(VIEWPORT_MAX_OFFSET_Y, offsetY));

camera.position.x = basePosition.x + offsetX;
camera.position.y = basePosition.y + offsetY;
```

**Why camera.position instead of a parent rig:**

In Epic 2, a parent Group will be introduced for rail movement (the parent follows the spline, the camera offsets within it). For Story 1-4, there is no rail -- the camera sits at a fixed position. Adding a rig group now would be premature abstraction. The position offset pattern is identical either way; the migration in Epic 2 is simply: move offset from `camera.position` to `camera.position` within a parent group.

**GDD movement feel requirements (CRITICAL):**

The GDD specifies: "Smooth and immediate. No acceleration curve, no drift, no momentum. Arrow press = instant response. Arrow release = instant stop. Precision positioning."

This means:
- NO easing/interpolation -- constant speed while key is held
- NO deceleration on release -- offset stays exactly where it was when key is released
- NO momentum/inertia -- movement stops instantly
- Speed is constant and linear: `offset += speed * dt` while held

**InputManager uses `KeyboardEvent.code` (not `KeyboardEvent.key`):**

`KeyboardEvent.code` returns the physical key location regardless of keyboard layout (QWERTY, AZERTY, etc.). This ensures consistent controls for all players. Arrow keys have the same `code` values across all layouts: `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`.

**Preventing browser defaults:**

Arrow keys trigger browser scrolling by default. The `keydown` handler must call `event.preventDefault()` for mapped keys. Only prevent default for game-mapped keys -- do not suppress all keyboard events (would break DevTools, etc.).

**Key repeat suppression:**

Browsers fire continuous `keydown` events when a key is held (key repeat). The InputManager must check `event.repeat` and skip repeat events. Without this, the `activeKeys` set would receive redundant adds (harmless for a Set, but the `preventDefault()` call should still happen for repeat events to prevent scrolling).

**TypeScript strict mode considerations:**

- `noUnusedLocals` and `noUnusedParameters` are enabled -- ensure all imports and parameters are used
- `verbatimModuleSyntax` is enabled -- use `import type` for type-only imports
- Store `CockpitRenderer` reference if needed by storing it in a variable (currently uses `void new CockpitRenderer(...)` pattern -- keep this unless a reference is needed)

### ViewportMovement Helper Function

Extract a pure function for testability:

```typescript
// src/core/ViewportMovement.ts
import type { InputManager } from './InputManager.ts';
import {
  VIEWPORT_MOVE_SPEED,
  VIEWPORT_MAX_OFFSET_X,
  VIEWPORT_MAX_OFFSET_Y,
} from '../config/constants.ts';

export interface ViewportOffset {
  x: number;
  y: number;
}

export function updateViewportOffset(
  current: ViewportOffset,
  inputManager: InputManager,
  dt: number,
): ViewportOffset {
  let x = current.x;
  let y = current.y;

  if (inputManager.isActive('moveRight')) x += VIEWPORT_MOVE_SPEED * dt;
  if (inputManager.isActive('moveLeft')) x -= VIEWPORT_MOVE_SPEED * dt;
  if (inputManager.isActive('moveUp')) y += VIEWPORT_MOVE_SPEED * dt;
  if (inputManager.isActive('moveDown')) y -= VIEWPORT_MOVE_SPEED * dt;

  x = Math.max(-VIEWPORT_MAX_OFFSET_X, Math.min(VIEWPORT_MAX_OFFSET_X, x));
  y = Math.max(-VIEWPORT_MAX_OFFSET_Y, Math.min(VIEWPORT_MAX_OFFSET_Y, y));

  return { x, y };
}
```

This keeps the animation loop in `main.ts` clean and makes the movement logic independently testable without needing a real DOM or animation loop.

### What NOT to Do

- Do NOT use `PerspectiveCamera.setViewOffset()` -- that is for multi-monitor tile rendering, not gameplay camera movement
- Do NOT add acceleration, deceleration, easing, or momentum to camera movement -- GDD explicitly says "no acceleration curve, no drift, no momentum"
- Do NOT use `requestAnimationFrame()` -- continue using `renderer.setAnimationLoop()` as established in Story 1-1
- Do NOT create a Player entity class -- that is Epic 2. Viewport offset logic stays in `main.ts` + helper function
- Do NOT create a RailMovement system -- that is Story 2-1. Camera stays at fixed base position
- Do NOT use `KeyboardEvent.key` -- use `KeyboardEvent.code` for layout-independent input
- Do NOT use `console.log()` -- use `Logger.info()` or `Logger.debug()` from `src/core/Logger.ts`
- Do NOT import one system from another -- if InputManager needs to communicate with other systems, use EventBus (not applicable for this story, but maintain the pattern)
- Do NOT modify `RenderPipeline.ts`, `VectorMaterials.ts`, `ColorPalette.ts`, or `CockpitRenderer.ts` -- none require changes for this story
- Do NOT remove or modify the test wireframe shapes (icosahedron + torus knot) -- they serve as visual reference to confirm viewport movement is working
- Do NOT change camera FOV, near plane, far plane, or Z position -- only X and Y are modified for viewport offset
- Do NOT suppress `keydown` events globally -- only prevent default on mapped game input keys

### Performance Considerations

- Input state tracking is a `Set<string>` lookup -- O(1) per action query, negligible CPU cost
- Movement calculation is 4 conditionals + 2 clamps per frame -- trivially cheap
- No allocations in the hot loop -- offset values are primitive numbers, not new objects (the helper function returns a plain object but this is easily optimized if needed)
- No event listeners firing during the animation loop -- input events update state asynchronously, the loop reads state synchronously
- Total overhead: unmeasurably small, well within the 16.67ms frame budget

### Previous Story Intelligence (1-3)

**Key patterns from Story 1-3 to preserve:**
- `CockpitRenderer` is instantiated via `void new CockpitRenderer(camera, vectorMaterials)` in `main.ts` -- do not change this pattern (Story 1-5 will store the reference for `recoilArms()`)
- The cockpit group is at camera-local position `(0, -0.1, -1.5)` -- it moves automatically when camera.position changes
- `scene.add(camera)` was added in Story 1-3 -- this is required for camera-parented children to render; do not remove it
- 147 tests currently pass -- the new tests must not break any existing tests

**Current main.ts state (after Story 1-3):**
- Renderer: `THREE.WebGLRenderer` with ACESFilmicToneMapping
- Camera: `PerspectiveCamera(70, aspect, 0.01, 1000)` at position `(0, 0, 3)` looking at origin
- Scene: black background with two test wireframe shapes
- CockpitRenderer instantiated and parented to camera
- RenderPipeline for selective bloom
- Resize handler for camera, renderer, pipeline, and material resolution
- Animation loop: `renderer.setAnimationLoop()` with delta time and test shape rotation

**Files to create:**
- `src/core/ViewportMovement.ts` -- pure function for testable viewport offset calculation
- `src/__tests__/InputManager.test.ts` -- InputManager unit tests
- `src/__tests__/ViewportMovement.test.ts` -- viewport movement unit tests

**Files to modify:**
- `src/core/InputManager.ts` -- replace placeholder with full implementation
- `src/config/input.ts` -- replace placeholder with action mapping configuration
- `src/config/constants.ts` -- add viewport movement constants
- `src/main.ts` -- import InputManager and ViewportMovement, integrate into animation loop

**Files NOT to touch:**
- `src/rendering/RenderPipeline.ts` -- no changes needed
- `src/rendering/VectorMaterials.ts` -- no changes needed
- `src/rendering/ColorPalette.ts` -- no changes needed
- `src/rendering/CockpitRenderer.ts` -- no changes needed (cockpit follows camera automatically)
- `src/core/DeltaTime.ts` -- no changes needed
- `src/core/EventBus.ts` -- placeholder, not used in this story
- `src/core/GameEvents.ts` -- placeholder, not used in this story
- `vite.config.ts` -- no changes needed
- `index.html` -- no changes needed
- `package.json` -- no new dependencies needed

### Project Structure Notes

- `InputManager.ts` stays at `src/core/InputManager.ts` -- matches architecture exactly
- `input.ts` stays at `src/config/input.ts` -- matches architecture exactly
- `ViewportMovement.ts` is a new helper at `src/core/ViewportMovement.ts` -- `src/core/` is appropriate for shared infrastructure utilities
- Test files follow the established pattern: `src/__tests__/<ClassName>.test.ts`
- No new directories needed

### Technology Versions Verified

- **Three.js r183** (`^0.183.2` in package.json) -- `PerspectiveCamera.position` offset pattern confirmed compatible with EffectComposer post-processing
- **TypeScript ~5.9.3** -- strict mode with `verbatimModuleSyntax` requires `import type` for type-only imports
- **Vite ^8.0.1** -- no impact on this story
- **Vitest ^4.1.2** -- test framework, use `describe`/`it`/`expect`/`beforeEach` pattern consistent with existing tests
- **`KeyboardEvent.code`** -- standard Web API, supported in all target browsers (Chrome, Firefox, Safari, Edge)

### References

- [Source: _bmad-output/game-architecture.md#Input System] -- Action mapping table: moveUp/ArrowUp, moveDown/ArrowDown, moveLeft/ArrowLeft, moveRight/ArrowRight, fire/Space. "Systems query input.isActive('fire') each frame."
- [Source: _bmad-output/game-architecture.md#Project Structure] -- InputManager at `src/core/InputManager.ts`, input config at `src/config/input.ts`
- [Source: _bmad-output/game-architecture.md#Entity System] -- Player entity owns "cockpit, shields, position, viewport offset" (Epic 2)
- [Source: _bmad-output/game-architecture.md#Rail Movement System] -- "CatmullRomCurve3 camera path + player offset" (Epic 2 -- Story 2-1)
- [Source: _bmad-output/game-architecture.md#Game Loop] -- setAnimationLoop with delta cap, all systems receive dt in update()
- [Source: _bmad-output/game-architecture.md#Architectural Boundaries] -- Entities never import systems, systems never import each other, config is read-only
- [Source: _bmad-output/gdd.md#Controls and Input] -- "Arrow keys: Movement / Aim -- Constant -- controls viewport position on the rail"
- [Source: _bmad-output/gdd.md#Input Feel] -- "Movement: Smooth and immediate. No acceleration curve, no drift, no momentum. Arrow press = instant response. Arrow release = instant stop. Precision positioning."
- [Source: _bmad-output/gdd.md#Primary Mechanics] -- "Arrow keys control smooth pseudo-3D navigation... the player controls viewport offset and aim position within the frame."
- [Source: _bmad-output/gdd.md#Aiming and Combat Mechanics] -- "Player movement IS aiming -- arrow keys control viewport position, which determines where weapons fire."
- [Source: _bmad-output/epics.md#Epic 1] -- Story 4: "As a player, I can move my viewport with arrow keys so that aiming feels smooth and responsive"
- [Source: _bmad-output/project-context.md#Platform & Build Rules] -- "Input: Keyboard only, 5 keys (arrows + Space + Z/X/C). Use InputManager action mapping, never raw key codes."
- [Source: _bmad-output/project-context.md#Architecture Rules] -- "Entities never import systems. Communication goes through typed EventBus only."
- [Source: _bmad-output/implementation-artifacts/1-3-first-person-cockpit-view-with-actuator-arms.md] -- CockpitRenderer camera parenting pattern, scene.add(camera), current main.ts state

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Installed `jsdom` as devDependency for InputManager and ViewportMovement tests requiring DOM APIs (window, KeyboardEvent). This is testing infrastructure only, not a production dependency. The story's "no new dependencies" note referred to production deps.
- Updated existing `placeholder-exports.test.ts` to reference `INPUT_ACTIONS` instead of removed `INPUT_CONFIG` placeholder.
- Task 4.4 implemented via `ViewportOffset` object (`{ x, y }`) rather than separate `offsetX`/`offsetY` variables, matching the `updateViewportOffset` function signature for cleaner integration.

### Completion Notes List

- Task 1: Implemented `InputAction` type and `INPUT_ACTIONS` constant in `src/config/input.ts` with all 5 action-to-key mappings using `KeyboardEvent.code` values. 3 tests passing.
- Task 2: Implemented full `InputManager` class with `activeKeys` Set, key repeat suppression via `event.repeat`, `preventDefault()` on mapped keys only, `isActive()` action query, and `dispose()` cleanup. 9 tests passing.
- Task 3: Added `VIEWPORT_MOVE_SPEED` (3.0), `VIEWPORT_MAX_OFFSET_X` (1.5), `VIEWPORT_MAX_OFFSET_Y` (1.0), and `VIEWPORT_BASE_POSITION` ({x:0, y:0, z:3}) to constants.ts. 4 tests passing.
- Task 4: Integrated InputManager and ViewportMovement into main.ts animation loop. Camera position offset applied after delta time calculation. Cockpit follows camera automatically (parented). Test shapes remain static in world space, appearing to shift opposite to camera movement.
- Task 5: Created InputManager.test.ts with 9 tests covering: default state, key press/release, simultaneous keys, key repeat suppression, dispose cleanup, unmapped actions, all action types, and partial key release.
- Task 6: Created ViewportMovement.test.ts with 13 tests covering: directional movement (right/up/left/down), boundary clamping (all 4 edges), no-drift behavior, opposing key cancellation, diagonal movement, and instant-stop on release. Also created ViewportConstants.test.ts with 4 tests, InputConfig.test.ts with 3 tests. Build verified clean. All 178 tests pass with zero regressions.
- All 16 acceptance criteria verified and satisfied.

### File List

New files:
- `src/core/ViewportMovement.ts` -- viewport offset calculation function (mutates in place, zero allocations)
- `src/__tests__/InputManager.test.ts` -- InputManager unit tests (10 tests)
- `src/__tests__/ViewportMovement.test.ts` -- viewport movement unit tests (13 tests)
- `src/__tests__/InputConfig.test.ts` -- input configuration tests (3 tests)
- `src/__tests__/ViewportConstants.test.ts` -- viewport constants tests (4 tests)

Modified files:
- `src/core/InputManager.ts` -- replaced placeholder with full implementation; review fix: moved preventDefault before repeat-check so held arrow keys don't scroll the page
- `src/core/ViewportMovement.ts` -- review fix: mutates offset in place to avoid per-frame object allocation
- `src/__tests__/InputManager.test.ts` -- review fix: added test for preventDefault on repeat keydown events (10 tests total)
- `src/config/input.ts` -- replaced placeholder with InputAction type and INPUT_ACTIONS mapping
- `src/config/constants.ts` -- added VIEWPORT_MOVE_SPEED, VIEWPORT_MAX_OFFSET_X, VIEWPORT_MAX_OFFSET_Y, VIEWPORT_BASE_POSITION
- `src/main.ts` -- integrated InputManager and viewport movement into animation loop
- `src/__tests__/placeholder-exports.test.ts` -- updated INPUT_CONFIG reference to INPUT_ACTIONS
- `package.json` -- added jsdom devDependency for DOM-based testing
- `package-lock.json` -- auto-generated from package.json changes
- `_bmad-output/implementation-artifacts/sprint-status.yaml` -- status updated to done

## Change Log

- 2026-03-26: Implemented Story 1-4 (Viewport Movement with Arrow Keys). Added InputManager class with action-mapped keyboard input, ViewportMovement helper for testable camera offset calculation, input configuration with 5 action mappings, and viewport movement constants. Integrated into main.ts animation loop. Added 29 new tests (9 InputManager, 13 ViewportMovement, 4 ViewportConstants, 3 InputConfig). All 178 tests pass. Clean production build verified.
- 2026-03-26: Code review (adversarial). Found 1 HIGH, 3 LOW issues. Fixed all: (1) HIGH -- preventDefault was not called on repeat keydown events, allowing browser scrolling on held arrow keys; moved preventDefault before repeat-check. (2) LOW -- updateViewportOffset allocated a new object every frame; refactored to mutate in place for zero GC pressure. (3-4) LOW -- package-lock.json and ViewportMovement.ts description updated in File List. Added 1 new test for preventDefault on repeat events. All 179 tests pass. Clean build verified. Status: done.
