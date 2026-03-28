# Story 5.12: Cyberspace Fragmentation Ending

Status: review

## Story

As a player,
I want to see cyberspace fragment during the ending so that jacking out is visually spectacular.

## Acceptance Criteria

1. **CyberspaceFragmentation class** exists at `src/entities/effects/CyberspaceFragmentation.ts`. It is a Three.js-rendered effect that fragments the visible cyberspace environment (grid and starfield) into scattering vector shards during the ending sequence. It manages its own geometry, materials, and animation state. It receives the Three.js `scene`, `camera`, and `vectorMaterials` as constructor parameters.

2. **Fragmentation effect creates line-segment debris** from the environment. On `start()`, the effect generates a large batch of line-segment shards (using a single `THREE.LineSegments` mesh with pre-allocated `BufferGeometry`, same pattern as `VectorShardExplosion`) that appear to originate from the grid plane and starfield positions. Shards fly outward in all directions with random velocities, tumbling as they scatter. The effect simulates the grid and starfield breaking apart and dispersing into the void.

3. **Fragmentation has three temporal phases** controlled by internal timing:
   - **Phase 1 (0-3s): Initial fracture** -- Grid lines begin cracking. A moderate number of shards (first 30% of total) spawn from grid-level positions (y near GRID_Y_POSITION) and scatter outward. Effect starts subtle.
   - **Phase 2 (3-8s): Full collapse** -- The remaining shards spawn in waves across the full environment volume (grid + starfield region). Shard spawn rate accelerates. The grid and starfield geometry visually disappear during this phase (SceneEnvironment is hidden by the caller).
   - **Phase 3 (8-12s): Void** -- No new shards spawn. Existing shards continue flying outward and fading. The scene empties to near-black void. The effect self-completes.

4. **Shard visual properties** are palette-aware. Shards use `VectorMaterials.create()` for material creation (ensuring palette compliance and bloom). Each shard line segment has `BLOOM_LAYER` enabled. Shard opacity/visibility fades over each shard's individual lifetime (handled by draw range reduction as shards expire, same pattern as VectorShardExplosion).

5. **Fragmentation constants** are defined in `src/config/constants.ts`:
   - `FRAG_TOTAL_SHARDS = 200` -- total line-segment shards in the effect
   - `FRAG_SHARD_MIN_SPEED = 8` -- minimum outward velocity (units/sec)
   - `FRAG_SHARD_MAX_SPEED = 30` -- maximum outward velocity (units/sec)
   - `FRAG_SHARD_MIN_LIFETIME = 3.0` -- minimum shard lifetime (seconds)
   - `FRAG_SHARD_MAX_LIFETIME = 10.0` -- maximum shard lifetime (seconds)
   - `FRAG_SHARD_LENGTH = 1.5` -- length of each shard line segment
   - `FRAG_PHASE1_DURATION = 3.0` -- seconds for initial fracture phase
   - `FRAG_PHASE2_DURATION = 5.0` -- seconds for full collapse phase
   - `FRAG_TOTAL_DURATION = 12.0` -- total effect duration

6. **EndingScreen integration**: EndingScreen is modified to accept an optional `onFragmentationStart` callback (similar pattern to `onCreditsComplete`). When `show()` is called, EndingScreen invokes `onFragmentationStart` immediately (before the white flash). This allows the caller (main.ts) to trigger the 3D fragmentation effect in sync with the ending sequence. The EndingScreen HTML overlay renders on top of the 3D scene, so the fragmentation effect is visible behind the semi-transparent overlay during the Ghost transmission and credits phases.

7. **main.ts integration**: In the `levelComplete` handler for level 3, after creating the `EndingScreen`, main.ts creates a `CyberspaceFragmentation` instance and wires:
   - `endingScreen.onFragmentationStart` triggers `fragmentation.start()` and hides the SceneEnvironment grid/starfield (after a 3-second delay, matching Phase 2 of the fragmentation).
   - The fragmentation's `update(dt)` method is called in the game loop (added to the animation loop alongside existing update calls). The update only runs while the fragmentation is active.
   - The fragmentation effect renders through the existing RenderPipeline (bloom layer) automatically since its mesh is added to the scene.

8. **SceneEnvironment visibility control**: SceneEnvironment is extended with `hide()` and `show()` methods that toggle visibility of the grid and starfield meshes (`this.grid.visible = false`, `this.starfield.visible = false`). These are used by main.ts to hide the environment when the fragmentation reaches Phase 2.

9. Running `npx tsc --noEmit` produces zero TypeScript errors.

10. Unit tests exist (Vitest) for:
    - CyberspaceFragmentation: constructor creates LineSegments mesh added to scene
    - CyberspaceFragmentation: mesh has BLOOM_LAYER enabled
    - CyberspaceFragmentation: start() activates the effect
    - CyberspaceFragmentation: update() moves shards outward over time
    - CyberspaceFragmentation: effect self-completes after FRAG_TOTAL_DURATION
    - CyberspaceFragmentation: isActive returns false before start and after completion
    - CyberspaceFragmentation: dispose() removes mesh from scene and disposes geometry
    - SceneEnvironment: hide() sets grid and starfield visible to false
    - SceneEnvironment: show() sets grid and starfield visible to true
    - EndingScreen: calls onFragmentationStart callback on show()
    - Constants: fragmentation constants are exported with correct values

11. All existing tests continue to pass -- zero regressions.

## Tasks / Subtasks

- [x] Task 1: Add fragmentation constants (AC: #5)
  - [x] 1.1 Add `FRAG_TOTAL_SHARDS`, `FRAG_SHARD_MIN_SPEED`, `FRAG_SHARD_MAX_SPEED`, `FRAG_SHARD_MIN_LIFETIME`, `FRAG_SHARD_MAX_LIFETIME`, `FRAG_SHARD_LENGTH`, `FRAG_PHASE1_DURATION`, `FRAG_PHASE2_DURATION`, `FRAG_TOTAL_DURATION` to `src/config/constants.ts`

- [x] Task 2: Create CyberspaceFragmentation effect (AC: #1, #2, #3, #4)
  - [x] 2.1 Create `src/entities/effects/CyberspaceFragmentation.ts`
  - [x] 2.2 Implement constructor: pre-allocate BufferGeometry with FRAG_TOTAL_SHARDS * 6 floats, create LineSegments mesh via VectorMaterials.create(), enable BLOOM_LAYER, add to scene
  - [x] 2.3 Implement shard data array (pre-allocated, same pattern as VectorShardExplosion ShardData)
  - [x] 2.4 Implement `start()`: activate effect, set internal timers to zero
  - [x] 2.5 Implement `update(dt)`: spawn shards in phased waves, update shard positions/rotations, handle lifetime expiry, detect completion
  - [x] 2.6 Implement `isActive` getter, `dispose()` method

- [x] Task 3: Extend SceneEnvironment (AC: #8)
  - [x] 3.1 Add `hide()` method to SceneEnvironment that sets grid.visible and starfield.visible to false
  - [x] 3.2 Add `show()` method to SceneEnvironment that sets grid.visible and starfield.visible to true

- [x] Task 4: Modify EndingScreen (AC: #6)
  - [x] 4.1 Add `onFragmentationStart` callback property to EndingScreen (same pattern as `onCreditsComplete`)
  - [x] 4.2 Invoke `onFragmentationStart` at the beginning of `show()`, before the white flash

- [x] Task 5: Integrate in main.ts (AC: #7)
  - [x] 5.1 Import CyberspaceFragmentation
  - [x] 5.2 In level 3 complete handler: create CyberspaceFragmentation instance, wire onFragmentationStart to start() and delayed SceneEnvironment hide()
  - [x] 5.3 Add fragmentation update call in the animation loop (only when active)

- [x] Task 6: Write tests (AC: #10, #11)
  - [x] 6.1 Create `src/__tests__/CyberspaceFragmentation.test.ts` with tests for construction, activation, shard movement, completion, disposal
  - [x] 6.2 Add SceneEnvironment hide/show tests to existing `src/__tests__/SceneEnvironment.test.ts`
  - [x] 6.3 Update EndingSequence tests for onFragmentationStart callback
  - [x] 6.4 Add fragmentation constants test
  - [x] 6.5 Verify all existing tests still pass

- [x] Task 7: Build verification (AC: #9, #11)
  - [x] 7.1 Run `npx tsc --noEmit` -- zero TypeScript errors
  - [x] 7.2 Run `npm run test` -- all tests pass, zero regressions

## Dev Notes

### Architecture Compliance

- **NEVER create materials directly.** Use `VectorMaterials.create(id)` for all line materials. [Source: project-context.md#Critical Implementation Rules]
- **ALL vector geometry must enable bloom layer.** `mesh.layers.enable(BLOOM_LAYER)`. [Source: project-context.md#Three.js-Specific Rules]
- **Systems never import each other.** CyberspaceFragmentation is a visual effect entity, not a system. It does NOT import EndingScreen, EffectsManager, or any system. [Source: project-context.md#Architecture Rules]
- **UI never imports game logic.** EndingScreen receives callbacks, never reaches into 3D scene objects. [Source: project-context.md#Architecture Rules]
- **No per-frame allocations during gameplay.** All shard data and buffers are pre-allocated in the constructor. Update loop modifies existing Float32Array in place. [Source: project-context.md#Performance Rules]
- **Use `Logger.info/warn/error()`** -- NEVER `console.log()`. [Source: project-context.md#Critical Don't-Miss Rules]
- **`erasableSyntaxOnly: true`**: No `enum`. Use `type` unions and `as const` objects. [Source: tsconfig.json]
- **`verbatimModuleSyntax: true`**: Use `import type { ... }` for type-only imports. [Source: tsconfig.json]

### Critical Implementation Rules

- **Follow VectorShardExplosion pattern exactly** for geometry/material setup. Single `THREE.LineSegments` mesh with pre-allocated `BufferGeometry`. `Float32Array` position buffer with `DynamicDrawUsage`. `setDrawRange()` to control visible shard count. Update position attribute with `needsUpdate = true`. [Source: src/entities/effects/VectorShardExplosion.ts]
- **Phased shard spawning**: Track elapsed time since start(). Spawn shards in timed waves -- not all at once. Phase 1 (0-3s) spawns first ~60 shards from grid-level origins. Phase 2 (3-8s) spawns remaining ~140 shards from full environment volume. Phase 3 (8-12s) is decay only.
- **Shard origins**: Phase 1 shards originate near y=GRID_Y_POSITION (-2.0) in a spread around the camera. Phase 2 shards originate from random positions in the environment volume (similar to starfield spread).
- **Effect self-completion**: When all shards have exceeded their lifetime, set `isActive = false` and hide the mesh. Do NOT remove from scene -- let `dispose()` handle cleanup.
- **EndingScreen overlay is semi-transparent** (`rgba(0, 0, 0, 0.95)` background). The 3D fragmentation effect will be barely visible through it, providing a subtle atmospheric backing. The primary visual storytelling is through the text overlay; the 3D effect adds subconscious atmosphere.
- **The ending sequence is NOT skippable.** The fragmentation runs on its own timeline regardless of player input. [Source: narrative-design.md#Narrative Delivery]

### Existing Code Patterns to Follow

- **VectorShardExplosion.ts** at `src/entities/effects/` -- The PRIMARY pattern to follow. Single LineSegments mesh, pre-allocated Float32Array, ShardData interface for per-shard state, spawn/update/isActive lifecycle. Copy this structure and adapt for larger scale and phased spawning.
- **EndingScreen.ts** at `src/ui/screens/` -- Has `onCreditsComplete` callback pattern. Add `onFragmentationStart` following identical pattern.
- **SceneEnvironment.ts** at `src/rendering/` -- Currently has no hide/show. Grid and starfield are private members. Add public visibility control methods.
- **EffectsManager.ts** at `src/systems/` -- Shows how effects are updated in the game loop (iterates pool, calls update). But CyberspaceFragmentation will be managed directly from main.ts, not through EffectsManager (it's a one-off ending effect, not a pooled gameplay effect).

### What Already Exists (DO NOT recreate)

- `src/entities/effects/VectorShardExplosion.ts` -- Existing shard explosion effect. DO NOT MODIFY. Use as pattern reference only.
- `src/rendering/VectorMaterials.ts` -- Material creation. DO NOT MODIFY. Use `vectorMaterials.create(id)`.
- `src/rendering/SceneEnvironment.ts` -- Grid and starfield. MODIFY to add hide()/show() methods.
- `src/ui/screens/EndingScreen.ts` -- Ending sequence overlay. MODIFY to add onFragmentationStart callback.
- `src/config/constants.ts` -- Game constants. MODIFY to add fragmentation constants.
- `src/main.ts` -- Game init. MODIFY to create CyberspaceFragmentation and wire into ending flow.
- `src/core/GameEvents.ts` -- Event definitions. DO NOT MODIFY (no new events needed -- fragmentation is triggered by direct callback, not EventBus).
- `src/rendering/RenderPipeline.ts` -- Render pipeline. DO NOT MODIFY (fragmentation mesh renders through existing bloom pipeline automatically).
- `src/systems/EffectsManager.ts` -- Existing effects pool. DO NOT MODIFY (fragmentation is not a pooled effect).
- `src/rendering/ColorPalette.ts` -- Palette definitions. DO NOT MODIFY.

### What Must Be Created

- `src/entities/effects/CyberspaceFragmentation.ts` -- Three.js fragmentation effect (line-segment debris, phased spawning, self-completing)
- `src/__tests__/CyberspaceFragmentation.test.ts` -- Tests for fragmentation effect

### What Must Be Modified

- `src/config/constants.ts` -- Add FRAG_* constants
- `src/rendering/SceneEnvironment.ts` -- Add hide()/show() visibility methods
- `src/ui/screens/EndingScreen.ts` -- Add onFragmentationStart callback
- `src/main.ts` -- Import CyberspaceFragmentation, create instance on level 3 complete, wire callbacks, add update in game loop
- `src/__tests__/EndingSequence.test.ts` -- Add test for onFragmentationStart callback
- `src/__tests__/SceneEnvironment.test.ts` -- Add tests for hide()/show() (create if not exists)

### Scope Boundaries

**IN scope**: CyberspaceFragmentation Three.js effect with phased shard spawning, SceneEnvironment hide/show, EndingScreen onFragmentationStart callback, main.ts integration, fragmentation constants.

**NOT in scope** (other stories or future work):
- Changes to the EndingScreen text/credits content -- Story 5-10 (already done)
- High score table -- Story 5-11 (already done)
- Main menu screen -- Story 6-1
- Any gameplay changes -- this is a post-game visual effect only
- Camera movement during fragmentation -- camera stays at its final gameplay position
- Sound effects for fragmentation -- the outro music and Ghost voice lines from Story 5-10 provide the audio. No additional SFX needed for shard scattering (the visual effect is atmospheric/ambient, not explosive).

### Previous Story Intelligence

From Story 5-11 (High Score Table):
- Test count: 1924 tests across 132 files.
- `erasableSyntaxOnly: true` -- No enums. Use type unions and `as const` objects.
- `verbatimModuleSyntax: true` -- Use `import type { ... }` for type-only imports.
- Used `vi.hoisted()` in tests to properly handle hoisted `vi.mock` factory references.
- EndingScreen has `onCreditsComplete` callback pattern -- follow same pattern for `onFragmentationStart`.
- EndingScreen overlay `backgroundColor: 'rgba(0, 0, 0, 0.95)'` -- nearly opaque but 3D scene is slightly visible.
- HighScoreScreen uses zIndex 15 to layer above EndingScreen (zIndex 10). Fragmentation is 3D (renders below all HTML overlays).
- main.ts level 3 complete handler creates EndingScreen and wires onCreditsComplete to HighScoreScreen. Add fragmentation creation in the same handler block.

From Story 5-10 (Ending Sequence):
- EndingScreen DOM pattern: full-viewport overlay, CSS transitions, requestAnimationFrame scrolling, dispose() cleanup.
- EndingScreen `show()` starts the sequence: white flash -> Ghost transmission -> credits -> restart prompt/callback.
- The ending is NOT skippable per narrative design.

### Project Structure Notes

- New file goes in existing directory: `src/entities/effects/`
- Test file goes in: `src/__tests__/`
- No new directories needed
- No new npm dependencies needed
- CyberspaceFragmentation follows the same entity/effect pattern as VectorShardExplosion

### References

- [Source: narrative-design.md#Environmental Storytelling] -- "The ending sequence is environmental storytelling at its peak: the entire network collapses around Cipher as they jack out. Vector lines scatter, geometry fragments, the void reclaims everything."
- [Source: narrative-design.md#Ending Sequence Detail] -- "Network collapse -- cyberspace geometry shatters around Cipher's viewport, vector lines scatter into the void"
- [Source: narrative-design.md#Story Beat 18] -- "Jack Out -- Cyberspace fragments around the jockey as the AI network collapses."
- [Source: gdd.md#Ending Sequence] -- "~2 min. Credits scroll in vector text. Cyberspace fragments around the player as they jack out."
- [Source: gdd.md#Campaign Victory] -- "Defeat all three AI bosses across three levels and reach the ending sequence (outro music, credits, cyberspace fragmentation)."
- [Source: epics.md#Epic 5 Story 12] -- "As a player, I can see cyberspace fragment during the ending so that jacking out is visually spectacular"
- [Source: project-context.md#Three.js-Specific Rules] -- "NEVER create materials directly. Always use VectorMaterials.create(id)"
- [Source: project-context.md#Performance Rules] -- "No GC pauses during gameplay. All dynamic entities MUST use pre-allocated buffers."
- [Source: game-architecture.md#Selective Bloom Pipeline] -- Two-composer pattern, BLOOM_LAYER for all vector geometry
- [Source: src/entities/effects/VectorShardExplosion.ts] -- Reference implementation for shard-based line-segment effects

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- CyberspaceFragmentation uses single THREE.LineSegments mesh with pre-allocated Float32Array (200 shards * 6 floats = 1200 floats). Zero per-frame allocations. DynamicDrawUsage on position attribute. Same pattern as VectorShardExplosion.
- Three-phase shard spawning: Phase 1 (0-3s) spawns 60 shards from grid-level (y ~ GRID_Y_POSITION); Phase 2 (3-8s) spawns remaining 140 shards from full environment volume; Phase 3 (8-12s) decay only.
- Shard directions use spherical uniform distribution. Tumble rotation via rotSpeed * elapsed time. Shard length shrinks with progress (1 - progress * 0.5).
- EndingScreen invokes onFragmentationStart before audio and DOM setup. SceneEnvironment.hide() called after FRAG_PHASE1_DURATION (3s delay via setTimeout) in main.ts.
- activeFragmentation module-level variable in main.ts is null until level 3 ending. Update call guarded by isActive check in animation loop.

### Completion Notes List

- Task 1: Added 9 FRAG_* constants to src/config/constants.ts: FRAG_TOTAL_SHARDS (200), FRAG_SHARD_MIN_SPEED (8), FRAG_SHARD_MAX_SPEED (30), FRAG_SHARD_MIN_LIFETIME (3.0), FRAG_SHARD_MAX_LIFETIME (10.0), FRAG_SHARD_LENGTH (1.5), FRAG_PHASE1_DURATION (3.0), FRAG_PHASE2_DURATION (5.0), FRAG_TOTAL_DURATION (12.0).
- Task 2: Created CyberspaceFragmentation at src/entities/effects/CyberspaceFragmentation.ts. Single LineSegments mesh, pre-allocated Float32Array, FragShardData interface, phased spawning (grid then environment), self-completing after total duration when all shards expire. Follows VectorShardExplosion pattern exactly.
- Task 3: Extended SceneEnvironment with hide() and show() methods for grid/starfield visibility control.
- Task 4: Extended EndingScreen with onFragmentationStart callback property. Invoked at start of show() before audio/DOM setup.
- Task 5: Updated main.ts: imported CyberspaceFragmentation and FRAG_PHASE1_DURATION, added activeFragmentation module-level variable, created fragmentation in level 3 handler, wired onFragmentationStart callback with delayed sceneEnvironment.hide(), added fragmentation.update(dt) call in animation loop.
- Task 6: Created CyberspaceFragmentation.test.ts (12 tests: constructor, BLOOM_LAYER, start activation, shard movement, phases, completion, disposal, constants). Added 2 hide/show tests to SceneEnvironment.test.ts. Added 2 onFragmentationStart tests to EndingSequence.test.ts. Total new tests: 22 (1924 -> 1946).
- Task 7: `npx tsc --noEmit` passes clean. Full test suite: 1946 tests across 133 files, all pass, zero regressions.

### Change Log

- 2026-03-26: Story 5-12 implemented -- Cyberspace Fragmentation Ending. Created CyberspaceFragmentation effect with phased line-segment shard spawning (grid fracture -> full environment collapse -> void decay). Extended SceneEnvironment with hide/show visibility control. Extended EndingScreen with onFragmentationStart callback. Integrated fragmentation into main.ts ending flow with delayed environment hiding. Added 22 new tests.

### File List

- `src/entities/effects/CyberspaceFragmentation.ts` -- New: Three.js fragmentation effect (200 line-segment shards, 3-phase spawning, self-completing)
- `src/__tests__/CyberspaceFragmentation.test.ts` -- New: 12 tests for construction, BLOOM_LAYER, activation, shard movement, phases, completion, disposal, constants
- `src/config/constants.ts` -- Modified: added 9 FRAG_* constants for fragmentation effect
- `src/rendering/SceneEnvironment.ts` -- Modified: added hide() and show() visibility methods
- `src/ui/screens/EndingScreen.ts` -- Modified: added onFragmentationStart callback property, invoked at start of show()
- `src/main.ts` -- Modified: imported CyberspaceFragmentation/FRAG_PHASE1_DURATION, added activeFragmentation variable, created/wired fragmentation in level 3 handler, added update in animation loop
- `src/__tests__/SceneEnvironment.test.ts` -- Modified: added 2 hide/show visibility tests
- `src/__tests__/EndingSequence.test.ts` -- Modified: added 2 onFragmentationStart callback tests
