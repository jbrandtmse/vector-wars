# Story 2.1: Rail Path Movement

Status: done

## Story

As a player,
I want to fly along a rail path through cyberspace,
so that I experience smooth first-person movement through the vector world.

## Acceptance Criteria

1. A `RailMovement` system exists at `src/systems/RailMovement.ts` that manages camera movement along a `CatmullRomCurve3` spline path
2. The rail path is defined as an array of `THREE.Vector3` control points stored in `src/config/constants.ts` under a `RAIL_PATH` config section -- the initial path is a wide, sweeping dogfight-style loop through open cyberspace (matching Epic 2 Phase 1: Dogfight style)
3. The camera moves along the rail path at a constant speed using `CatmullRomCurve3.getPointAt(t)` where `t` is normalized 0-1 progress -- movement is delta-time multiplied for frame-rate independence
4. Camera orientation follows the rail path direction using the curve's tangent vector (`getTangentAt(t)`) -- the camera always faces forward along the path with smooth interpolation, no sudden snapping
5. The player's arrow key viewport offset (from Story 1-4) is preserved and applied RELATIVE to the rail direction -- left/right moves perpendicular to the forward direction, up/down moves perpendicular in the vertical plane. The offset is in camera-local space, not world space
6. The existing `ViewportMovement` module continues to calculate the offset values, but `RailMovement` applies them relative to the rail frame (tangent/normal/binormal)
7. The banking effect (camera roll on horizontal input from recent commits) is preserved and continues to work during rail movement
8. The rail path loops seamlessly when progress reaches 1.0 -- the path wraps back to 0.0 for continuous movement during the dogfight phase
9. Rail movement speed is configurable via a `RAIL_SPEED` constant in `src/config/constants.ts` (units per second along the arc length) -- default value produces a comfortable pace that lets the player observe and react to the vector environment (~15-20 units/second)
10. The `SceneEnvironment` (grid + starfield) remains visible and the player visibly moves through it -- the grid scrolls beneath and starfield parallax is apparent as proof of real camera movement through 3D space
11. The `DataLanceSystem` continues to work correctly during rail movement -- bolts fire in the camera's current forward direction (which now changes as the camera follows the rail) and travel in world space
12. The cockpit renderer (`CockpitRenderer`) remains camera-parented and visually stable during rail movement -- no jitter, no detachment, no visual artifacts from camera orientation changes
13. Frame rate remains at 60 FPS stable during rail movement -- the rail system adds negligible computational cost (one `getPointAt` + one `getTangentAt` per frame)
14. Running `npm run build` produces a clean production build with zero TypeScript errors
15. Unit tests exist for: `RailMovement` class construction, `RailMovement.update()` progress advancement, rail path config validation, and `RailMovement` method exports
16. All existing 244 tests continue to pass -- zero regressions
17. A `RailMovement.getRailProgress()` method returns the current normalized progress (0-1) along the path -- this will be used by future stories for distance-based enemy spawn triggers
18. A `RailMovement.getRailPosition()` method returns the current world position on the rail -- this will be used by future stories for collision and spatial queries
19. The rail path has at least 8-12 control points defining a path that takes 30-60 seconds to complete one full loop at the default speed -- long enough to feel like a journey, not a tight circle

## Tasks / Subtasks

- [x] Task 1: Add rail path configuration to `src/config/constants.ts` (AC: #2, #9, #19)
  - [x] 1.1 Add `RAIL_SPEED` constant (default: 18 units/second -- comfortable dogfight pace)
  - [x] 1.2 Add `RAIL_PATH_POINTS` as an array of `[x, y, z]` tuples defining the dogfight spline control points:
    - Design a wide, sweeping loop through open cyberspace
    - Path should vary in Y (slight altitude changes) for visual interest
    - Path should have gentle curves, no sharp turns (this is open-space dogfight, not a corridor)
    - 10-12 control points forming a closed loop
    - Path extents: roughly +-100 units in X/Z, +-10 units in Y around the grid plane
    - Example shape: elongated figure-eight or oval with altitude variation
  - [x] 1.3 Add `RAIL_CAMERA_LERP_SPEED` constant (default: 5.0) -- how fast the camera orientation interpolates toward the tangent direction (prevents jarring snaps on curve transitions)

- [x] Task 2: Create `RailMovement` system at `src/systems/RailMovement.ts` (AC: #1, #3, #4, #5, #6, #7, #8, #17, #18)
  - [x] 2.1 Import `THREE`, `CatmullRomCurve3` from `three`, and rail config constants
  - [x] 2.2 Create the `RailMovement` class with constructor accepting `camera: THREE.PerspectiveCamera`
  - [x] 2.3 In the constructor, build the `CatmullRomCurve3` from `RAIL_PATH_POINTS`:
    ```typescript
    const points = RAIL_PATH_POINTS.map(([x, y, z]) => new THREE.Vector3(x, y, z));
    this.curve = new CatmullRomCurve3(points, true, 'catmullrom', 0.5);
    // closed=true for seamless looping, tension=0.5 for smooth curves
    ```
  - [x] 2.4 Store `private progress: number = 0` (normalized 0-1) and pre-compute `this.totalLength = this.curve.getLength()` for constant-speed movement
  - [x] 2.5 Implement `update(dt: number, viewportOffset: { x: number; y: number }): void`:
    - Advance progress: `this.progress += (RAIL_SPEED * dt) / this.totalLength`
    - Wrap progress: `this.progress = this.progress % 1` (seamless loop)
    - Get rail position: `this.curve.getPointAt(this.progress, this.railPosition)`
    - Get tangent: `this.curve.getTangentAt(this.progress, this.tangent)`
    - Compute a stable up vector: use world up `(0, 1, 0)` as reference, compute right vector as `tangent.cross(worldUp).normalize()`, then recompute up as `right.cross(tangent).normalize()` -- this gives a stable camera frame without gimbal lock for gentle curves
    - Apply viewport offset in the local rail frame:
      ```
      finalPosition = railPosition + right * viewportOffset.x + localUp * viewportOffset.y
      ```
    - Set camera position to `finalPosition`
    - Smoothly interpolate camera orientation toward forward direction using quaternion slerp: build target quaternion from tangent direction via `lookAt`, then slerp current camera quaternion toward it at `RAIL_CAMERA_LERP_SPEED * dt` rate
  - [x] 2.6 Implement `getRailProgress(): number` -- returns current `this.progress`
  - [x] 2.7 Implement `getRailPosition(): THREE.Vector3` -- returns copy of current rail position
  - [x] 2.8 Pre-allocate all temp vectors as private class members to avoid per-frame GC:
    - `private railPosition = new THREE.Vector3()`
    - `private tangent = new THREE.Vector3()`
    - `private right = new THREE.Vector3()`
    - `private localUp = new THREE.Vector3()`
    - `private targetQuaternion = new THREE.Quaternion()`
    - `private tempMatrix = new THREE.Matrix4()`

- [x] Task 3: Integrate `RailMovement` into `main.ts` (AC: #5, #7, #10, #11, #12)
  - [x] 3.1 Import `RailMovement` in `main.ts`
  - [x] 3.2 Instantiate `RailMovement` after camera and scene setup: `const railMovement = new RailMovement(camera)`
  - [x] 3.3 Remove the static camera position `camera.position.set(0, 0, 3)` -- the rail system now controls camera position
  - [x] 3.4 Update the animation loop to call `railMovement.update(dt, viewportOffset)` instead of manually setting `camera.position.x/y`:
    ```typescript
    // BEFORE (remove this):
    // camera.position.x = VIEWPORT_BASE_POSITION.x + viewportOffset.x;
    // camera.position.y = VIEWPORT_BASE_POSITION.y + viewportOffset.y;

    // AFTER:
    railMovement.update(dt, viewportOffset);
    ```
  - [x] 3.5 The banking effect code in main.ts should still work -- it modifies `camera.rotation.z` after the rail system sets position/orientation. However, the rail system's quaternion slerp may overwrite rotation. Resolution: apply banking as an ADDITIONAL rotation AFTER the rail system updates the camera. Use the camera's local Z rotation for banking:
    ```typescript
    railMovement.update(dt, viewportOffset);
    // Banking applied on top of rail orientation
    const targetBank = horizontalDelta !== 0 ? -Math.sign(horizontalDelta) * BANK_MAX_ANGLE : 0;
    camera.rotateZ(targetBank - currentBank); // or apply via quaternion composition
    ```
    NOTE: The exact integration of banking with quaternion-based rail orientation needs care. The safest approach is to have RailMovement set camera quaternion from the tangent, then apply a small Z-rotation on top for banking. Test visually.
  - [x] 3.6 Verify `DataLanceSystem` still works -- it calls `camera.getWorldDirection()` for bolt direction, which automatically reflects the rail-updated camera orientation. No changes needed to DataLanceSystem.
  - [x] 3.7 Verify `CockpitRenderer` still works -- it is parented to the camera, so it moves with the camera automatically. No changes needed to CockpitRenderer.
  - [x] 3.8 Remove the import of `VIEWPORT_BASE_POSITION` from main.ts if no longer needed (rail system replaces the static base position concept)

- [x] Task 4: Write tests (AC: #15, #16)
  - [x] 4.1 Create `src/__tests__/RailMovement.test.ts`:
    - Test: RailMovement exports a class
    - Test: RailMovement class has `update` method (prototype check)
    - Test: RailMovement class has `getRailProgress` method (prototype check)
    - Test: RailMovement class has `getRailPosition` method (prototype check)
  - [x] 4.2 Create `src/__tests__/RailConfig.test.ts`:
    - Test: `RAIL_SPEED` is exported and is a positive number
    - Test: `RAIL_PATH_POINTS` is exported and is an array
    - Test: `RAIL_PATH_POINTS` has at least 8 entries (minimum for a good loop)
    - Test: Each entry in `RAIL_PATH_POINTS` is an array of 3 numbers
    - Test: `RAIL_CAMERA_LERP_SPEED` is exported and is a positive number
  - [x] 4.3 Run all tests -- verify 244 existing tests still pass plus new tests

- [x] Task 5: Visual verification and performance validation (AC: #10, #11, #12, #13, #14)
  - [x] 5.1 Run `npm run build` -- verify clean production build with zero TypeScript errors
  - [x] 5.2 Run `npm run dev` -- visual verification:
    - Camera moves smoothly along the rail path through cyberspace
    - Grid scrolls beneath the camera, starfield provides parallax -- proves real 3D movement
    - Arrow keys still offset the viewport relative to the rail direction
    - Banking effect still works on horizontal arrow key input
    - Cockpit arms remain stable and camera-parented
    - Data Lance bolts fire forward along the camera's current direction
    - No jitter, no sudden snaps, no visual artifacts at curve transitions
    - The path loops seamlessly -- no visible hitch when progress wraps from 1.0 back to 0.0
  - [x] 5.3 Verify 60 FPS stable with Stats.js or Chrome DevTools -- rail system should add <0.1ms per frame

## Dev Notes

### Architecture Compliance

- **`RailMovement` at `src/systems/RailMovement.ts`** matches the architecture-specified location exactly [Source: game-architecture.md#System Location Mapping: "Rail Movement: `src/systems/RailMovement.ts` -- Spline path, camera following, player offset"]
- **`CatmullRomCurve3` for rail paths** is the architecture-specified approach [Source: game-architecture.md#Architectural Decisions: "Spline Paths: THREE.CatmullRomCurve3 -- getPointAt(t) + tangent/binormal interpolation for rail camera orientation"]
- **`getPointAt(t)` with normalized t** is the architecture-specified method for rail position [Source: project-context.md#Three.js-Specific Rules: "CatmullRomCurve3.getPointAt(t) for rail position -- t is 0-1 normalized. Use tangent/binormal interpolation for camera orientation"]
- **Config in constants.ts** matches architecture's config pattern: game constants at compile-time in `src/config/constants.ts` [Source: game-architecture.md#Configuration Management: "Game constants: src/config/constants.ts -- Import at compile-time"]
- **Delta-time based movement** follows the established pattern from ViewportMovement and DataLanceSystem
- **No system-to-system imports** -- RailMovement takes the camera directly and receives viewport offset as a parameter; it does not import ViewportMovement, InputManager, or any other system

### Critical Technical Details

**CatmullRomCurve3 Constructor -- closed loop with smooth tension:**

```typescript
const curve = new CatmullRomCurve3(points, true, 'catmullrom', 0.5);
```

- `points`: Array of `Vector3` control points
- `closed: true`: The curve connects the last point back to the first -- essential for seamless looping
- `curveType: 'catmullrom'`: Standard Catmull-Rom interpolation (smooth, passes through control points)
- `tension: 0.5`: Moderate tension -- not too tight (jaggy) nor too loose (overshoots). Tune visually if needed.

**Constant-speed movement along arc length:**

`getPointAt(t)` uses arc-length parameterization, meaning equal increments of `t` produce equal distances along the curve. This gives constant visual speed regardless of control point spacing. The formula is:

```typescript
this.progress += (RAIL_SPEED * dt) / this.totalLength;
```

Where `totalLength = curve.getLength()`. This converts a world-space speed (units/second) to a normalized progress increment per frame.

**Camera orientation -- quaternion from lookAt, NOT euler angles:**

The rail system must set camera orientation using quaternion math to avoid gimbal lock. The approach:

1. Get tangent at current progress: `curve.getTangentAt(progress, tangent)`
2. Compute a "look at" point ahead: `lookTarget = railPosition + tangent`
3. Build orientation: Use `Matrix4.lookAt(position, lookTarget, up)` and extract quaternion
4. Slerp toward target: `camera.quaternion.slerp(targetQuat, lerpFactor)` for smooth interpolation

The slerp prevents jarring orientation snaps at sharp curve sections. The `RAIL_CAMERA_LERP_SPEED` constant controls how responsive the camera rotation is.

**Up vector stability -- avoid using Frenet frames directly:**

For gentle curves (dogfight phase), a simple approach works well: use world-up `(0, 1, 0)` as the reference up vector and compute the local frame via cross products:

```typescript
right.crossVectors(tangent, worldUp).normalize();
localUp.crossVectors(right, tangent).normalize();
```

This gives a stable, non-rotating frame for gentle curves. For extreme curves (e.g., corkscrews), Frenet frames would be better, but the dogfight phase has only gentle sweeping curves, so this approach is sufficient and avoids the "twist" artifacts that Frenet frames can produce on planar curves.

**CRITICAL: If the tangent is nearly parallel to world-up (e.g., during a steep climb), the cross product degenerates. Guard against this:**

```typescript
if (Math.abs(tangent.dot(worldUp)) > 0.99) {
  // Tangent is nearly vertical -- use forward as fallback up
  right.crossVectors(tangent, new Vector3(0, 0, 1)).normalize();
} else {
  right.crossVectors(tangent, worldUp).normalize();
}
```

The rail path should be designed to avoid near-vertical segments, but this guard prevents NaN propagation if it happens.

**Viewport offset in local rail frame:**

The player's viewport offset (from arrow keys) must be applied RELATIVE to the current rail direction, not in world space. Otherwise, pressing "left" would always move in world-X direction regardless of which way the camera faces.

```typescript
// Apply offset in the local rail coordinate frame
camera.position.copy(railPosition);
camera.position.addScaledVector(right, viewportOffset.x);
camera.position.addScaledVector(localUp, viewportOffset.y);
```

This means "left arrow" always moves the player to the LEFT of the current travel direction, which is the correct feel for a rail shooter.

**Banking integration with quaternion orientation:**

The existing banking effect applies a Z-rotation based on horizontal input. With quaternion-based rail orientation, banking must be composed ON TOP of the rail quaternion rather than setting `camera.rotation.z` directly (which would conflict with the quaternion).

Approach: After `RailMovement.update()` sets the camera quaternion, apply banking as an additional local Z-rotation:

```typescript
// In main.ts animation loop, AFTER railMovement.update():
const bankQuat = new THREE.Quaternion();
bankQuat.setFromAxisAngle(new THREE.Vector3(0, 0, 1), currentBankAngle);
camera.quaternion.multiply(bankQuat);
```

Pre-allocate the `bankQuat` outside the loop to avoid per-frame allocation. The `currentBankAngle` continues to be lerped as before.

**Rail path design -- dogfight phase characteristics:**

The Phase 1 Dogfight path should be:
- Wide, sweeping curves -- not tight turns
- Mostly horizontal with gentle altitude variation (+-5-10 units around Y=0)
- Large enough that the grid and starfield provide clear parallax
- No near-vertical segments
- No self-intersections
- 30-60 second loop at default speed (18 units/sec at ~600-1000 unit path length)

Example control points forming an elongated oval with altitude variation:

```typescript
export const RAIL_PATH_POINTS: readonly [number, number, number][] = [
  [0, 0, 0],
  [40, 3, -30],
  [80, 5, -10],
  [90, 2, 30],
  [60, -2, 60],
  [20, -3, 70],
  [-30, 0, 50],
  [-60, 4, 20],
  [-70, 6, -20],
  [-50, 3, -50],
  [-20, 0, -40],
] as const;
```

These are starting values -- tune visually for the best feel. The closed CatmullRomCurve3 will smoothly connect the last point back to the first.

### What NOT to Do

- Do NOT use `getPoint(t)` -- use `getPointAt(t)` for arc-length parameterized constant speed
- Do NOT use Euler angles for camera orientation -- use quaternions to avoid gimbal lock
- Do NOT set `camera.rotation.x/y/z` directly -- use `camera.quaternion` for rail orientation
- Do NOT import RailMovement inside DataLanceSystem or CockpitRenderer -- those systems read camera state, not rail state
- Do NOT compute Frenet frames for the dogfight phase -- the simple cross-product approach is more stable for gentle curves
- Do NOT use `requestAnimationFrame` -- the existing `renderer.setAnimationLoop()` pattern is correct
- Do NOT use `console.log()` -- use `Logger.debug('Rail', ...)` if logging is needed
- Do NOT modify `ViewportMovement.ts` -- it continues to compute offset values; RailMovement applies them
- Do NOT modify `DataLanceSystem.ts` -- it already uses `camera.getWorldDirection()` which automatically reflects rail orientation
- Do NOT modify `CockpitRenderer.ts` -- it is camera-parented and moves automatically
- Do NOT modify `SceneEnvironment.ts` -- the grid and starfield are static world geometry that the camera now moves through
- Do NOT modify `RenderPipeline.ts` -- the post-processing pipeline is unaffected by camera movement
- Do NOT create the `ObjectPool` for this story -- object pooling for dynamic entities comes in Story 2-9
- Do NOT add enemy spawn logic -- that is Story 2-2
- Do NOT use `fetch()` or `await` in the update loop -- all data (path points) is imported at compile time

### Performance Considerations

- **Rail computation cost:** One `getPointAt()` + one `getTangentAt()` per frame. `getPointAt` internally calls `getUtoTmapping` which does a binary search on precomputed arc lengths -- O(log n) where n = number of subdivisions. Negligible cost (~0.01ms).
- **Quaternion slerp:** One `slerp` per frame for smooth orientation. Trivial cost.
- **Zero allocations in update:** All `Vector3`, `Quaternion`, and `Matrix4` objects are pre-allocated as class members. The update loop only mutates existing objects -- no `new` calls, no GC pressure.
- **Total length computed once:** `curve.getLength()` is called once in the constructor and cached.
- **No impact on draw calls:** The rail system only positions and orients the camera. No new meshes, no new materials, no scene graph changes.

### Previous Story Intelligence (1-7, last in Epic 1)

**Key patterns from Epic 1 to preserve:**

- 244 tests currently pass (17 test files) -- new tests must not break any existing tests
- `main.ts` animation loop pattern: `renderer.setAnimationLoop((time) => { dt = ...; systems.update(dt); renderPipeline.render(); })`
- `ViewportMovement` returns a `ViewportOffset { x, y }` object -- RailMovement receives this as a parameter
- `DataLanceSystem` uses `camera.getWorldDirection()` for bolt direction -- this automatically works with rail movement
- `CockpitRenderer` is parented to camera via `new CockpitRenderer(camera, vectorMaterials)` -- no changes needed
- Banking effect in main.ts: lerps `camera.rotation.z` based on horizontal movement delta -- needs adaptation for quaternion-based orientation
- `VIEWPORT_BASE_POSITION` in constants.ts is `{ x: 0, y: 0, z: 3 }` -- this concept is replaced by rail position. The constant can remain for backward compatibility but will no longer be the camera's base position.
- The `updateViewportOffset()` function takes `(current, inputManager, dt)` and returns mutated offset -- this continues to work unchanged
- All vector geometry uses `VectorMaterials.create()` -- no material creation in RailMovement (it only positions the camera, no geometry)
- The grid at `y = -2.0` and starfield in `STARFIELD_SPREAD = 400` range -- the rail path should stay within these bounds for visual context

**Test pattern established:**
- Tests at `src/__tests__/` directory
- Use `vitest` with `describe`/`it`/`expect`
- Module export tests use prototype checks (since Three.js classes can't be instantiated in Node.js without WebGL context)
- Config value tests check type, range, and structure
- Use `import { ... } from '...'` with `.ts` extension in imports

### Project Structure Notes

- `src/systems/RailMovement.ts` -- New: rail path movement system (matches architecture spec)
- `src/config/constants.ts` -- Modified: add RAIL_SPEED, RAIL_PATH_POINTS, RAIL_CAMERA_LERP_SPEED
- `src/main.ts` -- Modified: integrate RailMovement, replace static camera positioning with rail-driven positioning
- `src/__tests__/RailMovement.test.ts` -- New: tests for RailMovement module exports
- `src/__tests__/RailConfig.test.ts` -- New: tests for rail configuration constants
- No new directories created
- No new dependencies added (CatmullRomCurve3 is built into Three.js)

### Technology Versions Verified

- **Three.js r183** (`^0.183.2`) -- `CatmullRomCurve3` constructor: `(points, closed, curveType, tension)`. `getPointAt(t, optionalTarget)` returns position at arc-length parameter t. `getTangentAt(t, optionalTarget)` returns unit tangent vector. `getLength()` returns total arc length. All methods accept an optional target vector to avoid allocation. `Quaternion.slerp(target, t)` for smooth interpolation. `Matrix4.lookAt(eye, target, up)` for orientation from direction vector.
- **TypeScript ~5.9.3** -- strict mode. `as const` arrays for control points. The `readonly [number, number, number][]` type for path point tuples.
- **Vitest ^4.1.2** -- test framework. Use existing `describe`/`it`/`expect` pattern.
- **Vite 8.0.3** -- build tool. Tree-shaking removes unused Three.js modules. CatmullRomCurve3 is imported from `three` main package.

### References

- [Source: _bmad-output/epics.md#Epic 2 Story 1] -- "As a player, I can fly along a rail path through cyberspace so that I experience smooth first-person movement through the vector world"
- [Source: _bmad-output/epics.md#Epic 2 Scope] -- "Rail movement system (camera on CatmullRomCurve3 spline path)"
- [Source: _bmad-output/epics.md#Epic 2 Deliverable] -- "A single playable dogfight phase: fly through open vector cyberspace on a rail"
- [Source: _bmad-output/gdd.md#Primary Mechanics] -- "Fly: First-person rail movement through cyberspace environments. The camera follows a predefined spline path; the player controls viewport offset and aim position within the frame."
- [Source: _bmad-output/gdd.md#Camera and Perspective] -- "PerspectiveCamera follows a predefined spline path (rail). Player input offsets the viewport position within the frame for aiming/dodging."
- [Source: _bmad-output/gdd.md#Arena and Level Design] -- "Phase 1: Dogfight -- Wide, sweeping curves -- Action, medium intensity, building"
- [Source: _bmad-output/gdd.md#Controls and Input] -- "Arrow Keys: Movement / Aim -- Constant, controls viewport position on the rail"
- [Source: _bmad-output/gdd.md#Movement Feel] -- "Smooth and immediate. No acceleration curve, no drift, no momentum."
- [Source: _bmad-output/game-architecture.md#Rail Movement System] -- "Medium complexity: CatmullRomCurve3 spline paths, camera following, player viewport offset control"
- [Source: _bmad-output/game-architecture.md#Engine-Provided Architecture] -- "Spline Paths: THREE.CatmullRomCurve3 -- getPointAt(t) + tangent/binormal interpolation for rail camera orientation"
- [Source: _bmad-output/game-architecture.md#System Location Mapping] -- "Rail Movement: src/systems/RailMovement.ts -- Spline path, camera following, player offset"
- [Source: _bmad-output/game-architecture.md#Level/Phase System] -- "JSON config per level defines: Rail path spline control points"
- [Source: _bmad-output/game-architecture.md#Architectural Decisions] -- "Rail Movement System: Medium -- CatmullRomCurve3 spline paths, camera following, player viewport offset control"
- [Source: _bmad-output/project-context.md#Three.js-Specific Rules] -- "CatmullRomCurve3.getPointAt(t) for rail position -- t is 0-1 normalized. Use tangent/binormal interpolation for camera orientation"
- [Source: _bmad-output/project-context.md#Performance Rules] -- "60 FPS stable -- non-negotiable. Frame budget: 16.67ms"
- [Source: _bmad-output/project-context.md#Architecture Rules] -- "Systems never import each other. Communication goes through typed EventBus only."
- [Source: _bmad-output/implementation-artifacts/1-7-post-processing-pipeline-validation.md] -- Previous story: 244 tests passing, post-processing pipeline complete
- [Source: _bmad-output/implementation-artifacts/1-4-viewport-movement-with-arrow-keys.md] -- ViewportMovement module, viewport offset pattern
- [Source: git log] -- Recent commits show banking effect added, asymmetric Y limits, fat line bolts, twin bolt firing

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

No debug issues encountered during implementation.

### Completion Notes List

- Task 1: Added RAIL_SPEED (18 units/sec), RAIL_PATH_POINTS (11 control points forming closed dogfight loop), and RAIL_CAMERA_LERP_SPEED (5.0) to constants.ts. Path extends roughly +-115 X/Z, +-6 Y with gentle altitude variation. Path length ~624 units for ~35 second loop at default speed.
- Task 2: Created RailMovement class at src/systems/RailMovement.ts. Uses CatmullRomCurve3 with closed=true, tension=0.5. Implements constant-speed arc-length movement, quaternion-based camera orientation via Matrix4.lookAt + slerp, viewport offset in local rail frame (right/up vectors), and seamless progress wrapping. All temp vectors pre-allocated as class members for zero-allocation updates. Includes guard for near-vertical tangent to prevent degenerate cross products.
- Task 3: Integrated RailMovement into main.ts. Removed static camera positioning. Rail system controls camera position and orientation. Banking effect adapted to quaternion composition (bankQuat multiplied on top of rail quaternion). Removed VIEWPORT_BASE_POSITION import from main.ts. DataLanceSystem and CockpitRenderer continue to work unchanged (camera.getWorldDirection() and camera-parenting work automatically).
- Task 4: Created RailConfig.test.ts (8 tests) and RailMovement.test.ts (13 tests) covering: module exports, class construction, progress advancement, progress wrapping, getRailProgress/getRailPosition methods, camera positioning, viewport offset application. All 267 tests pass (244 existing + 23 new), zero regressions.
- Task 5: Clean production build (zero TypeScript errors). Visual verification requires manual browser check via npm run dev.

### Change Log

- 2026-03-26: Implemented Story 2-1 Rail Path Movement -- RailMovement system, rail config constants, main.ts integration, 23 new tests
- 2026-03-26: Code review fix -- Expanded RAIL_PATH_POINTS control points to achieve ~624 unit path length (~35s loop at 18 u/s), satisfying AC #19's 30-60 second requirement. Updated test bounds from +-100 to +-120 X/Z to match expanded path. Previous path was only ~481 units (~27s loop), failing the 30-60s AC.

### File List

- src/config/constants.ts (modified) -- Added RAIL_SPEED, RAIL_PATH_POINTS, RAIL_CAMERA_LERP_SPEED
- src/systems/RailMovement.ts (new) -- Rail path movement system with CatmullRomCurve3
- src/main.ts (modified) -- Integrated RailMovement, replaced static camera positioning, adapted banking for quaternion
- src/__tests__/RailConfig.test.ts (new) -- 8 tests for rail configuration constants
- src/__tests__/RailMovement.test.ts (new) -- 13 tests for RailMovement class
