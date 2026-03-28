# Story 5.5: Color Palette Progression

Status: review

## Story

As a player,
I want to see the color palette shift smoothly from green to amber to red across levels,
so that visual progression reinforces my descent deeper into cyberspace rather than jarring instant color swaps.

## Acceptance Criteria

1. A `PaletteTransition` class exists at `src/rendering/PaletteTransition.ts` that animates smooth HSL interpolation between two palette presets over a configurable duration. It exposes `start(from: PaletteName, to: PaletteName, duration: number)`, `update(dt: number)`, and `isActive(): boolean` methods.

2. During a palette transition, `PaletteTransition.update(dt)` interpolates the hue, saturation, and lightness values between the source and target palettes each frame, and calls `VectorMaterials.setPaletteHSL(h, s, l)` (a new method) to update all registered materials with the interpolated values. The interpolation uses linear lerp: `from + (to - from) * progress` where `progress` is clamped 0-1.

3. `VectorMaterials` gains a new `setPaletteHSL(hue: number, saturation: number, lightness: number)` method that updates all registered thin and fat materials to the given HSL values (applying each material's `lightnessOffset`). This does NOT change the active palette name in `ColorPalette` -- the discrete palette name is only set at the END of the transition via the existing `setPalette()`.

4. `SceneEnvironment` gains an `updatePaletteHSL(hue: number, saturation: number, lightness: number)` method that updates the starfield PointsMaterial to the given HSL values (applying `STARFIELD_LIGHTNESS_OFFSET`). `PaletteTransition` calls this each frame during a transition so the starfield color interpolates smoothly alongside all vector materials.

5. `PaletteTransition` accepts a `SceneEnvironment` reference (optional) and calls `sceneEnvironment.updatePaletteHSL()` each frame during transition. When the transition completes (progress >= 1.0), it calls `VectorMaterials.setPalette(targetName)` to finalize the discrete palette and calls `sceneEnvironment.updatePalette()` to ensure the starfield is exactly on-target.

6. `LevelManager.startLevel()` is updated: instead of calling `this.vectorMaterials.setPalette(paletteName)` immediately, it starts a `PaletteTransition` from the previous level's palette to the new level's palette. Duration is `PALETTE_TRANSITION_DURATION` (configurable constant, default 2.0 seconds). For Level 1 (no previous palette), the palette is set instantly as before (no transition needed).

7. `LevelManager.update()` calls `paletteTransition.update(dt)` when a transition is active so the color shift animates each frame during early gameplay of the new level.

8. Constants added to `src/config/constants.ts`:
   - `PALETTE_TRANSITION_DURATION = 2.0` (seconds for the full color shift)

9. `PaletteColors` CSS utility functions (`getPaletteHexColor()`, `getPaletteCSSGlow()`, `getPaletteCSSMultiGlow()`) continue to work correctly after a palette transition completes -- they read from `getActivePalette()` which is updated when the transition finalizes.

10. Running `npm run build` produces a clean production build with zero TypeScript errors.

11. Unit tests exist (Vitest) for:
    - `PaletteTransition` construction: stores VectorMaterials and SceneEnvironment references
    - `PaletteTransition.start()`: sets active state, stores from/to palettes
    - `PaletteTransition.update()`: progress advances with dt, calls setPaletteHSL with interpolated values
    - `PaletteTransition.update()`: at halfway point, HSL values are midpoint between from and to palettes
    - `PaletteTransition.update()`: when progress reaches 1.0, calls setPalette(target) to finalize, isActive becomes false
    - `PaletteTransition.update()`: calls sceneEnvironment.updatePaletteHSL() each frame when sceneEnvironment provided
    - `PaletteTransition`: does nothing when update() called while not active
    - `VectorMaterials.setPaletteHSL()`: updates all registered thin materials to given HSL
    - `VectorMaterials.setPaletteHSL()`: updates all registered fat materials to given HSL
    - `VectorMaterials.setPaletteHSL()`: applies lightnessOffset to each material
    - `SceneEnvironment.updatePaletteHSL()`: updates starfield material color to given HSL with offset
    - `PALETTE_TRANSITION_DURATION` constant exists and equals 2.0

12. All existing tests continue to pass -- zero regressions.

## Tasks / Subtasks

- [x] Task 1: Add palette transition constants (AC: #8)
  - [x] 1.1 Add `PALETTE_TRANSITION_DURATION = 2.0` to `src/config/constants.ts`

- [x] Task 2: Add `setPaletteHSL()` to VectorMaterials (AC: #3)
  - [x] 2.1 Add `setPaletteHSL(hue: number, saturation: number, lightness: number): void` method to `VectorMaterials` class
  - [x] 2.2 Iterate all thin materials, compute `Math.max(0, Math.min(1, lightness + entry.lightnessOffset))`, call `entry.material.color.setHSL(hue, saturation, adjustedLightness)`
  - [x] 2.3 Iterate all fat materials, same HSL update pattern
  - [x] 2.4 Do NOT call `setActivePalette()` -- this method only updates material colors, not the discrete palette name

- [x] Task 3: Add `updatePaletteHSL()` to SceneEnvironment (AC: #4)
  - [x] 3.1 Add `updatePaletteHSL(hue: number, saturation: number, lightness: number): void` method
  - [x] 3.2 Compute adjusted lightness with `STARFIELD_LIGHTNESS_OFFSET`, set starfield material color via `setHSL()`

- [x] Task 4: Create PaletteTransition class (AC: #1, #2, #5)
  - [x] 4.1 Create `src/rendering/PaletteTransition.ts`
  - [x] 4.2 Constructor accepts `VectorMaterials` and optional `SceneEnvironment`
  - [x] 4.3 Implement `start(from: PaletteName, to: PaletteName, duration: number)`: store from/to palette HSL values from `PALETTES`, set active, reset elapsed
  - [x] 4.4 Implement `update(dt: number)`: if not active, return. Advance elapsed, compute progress = clamp(elapsed/duration, 0, 1). Lerp hue/saturation/lightness. Call `vectorMaterials.setPaletteHSL(h, s, l)`. If sceneEnvironment exists, call `sceneEnvironment.updatePaletteHSL(h, s, l)`. If progress >= 1.0: call `vectorMaterials.setPalette(to)`, call `sceneEnvironment?.updatePalette()`, set active = false.
  - [x] 4.5 Implement `isActive(): boolean`

- [x] Task 5: Wire PaletteTransition into LevelManager (AC: #6, #7)
  - [x] 5.1 Add `PaletteTransition` as a field on `LevelManager`
  - [x] 5.2 LevelManager constructor accepts optional `SceneEnvironment` parameter; creates `PaletteTransition(this.vectorMaterials, sceneEnvironment)`
  - [x] 5.3 In `startLevel()`: if level > 1, determine previous palette from `LEVEL_PALETTES[level - 1]` and call `paletteTransition.start(previousPalette, newPalette, PALETTE_TRANSITION_DURATION)`. If level === 1, keep the instant `setPalette()` call.
  - [x] 5.4 In `update()`: call `this.paletteTransition.update(dt)` if the transition is active (before phase update, so colors shift visibly during gameplay)
  - [x] 5.5 Update main.ts to pass `sceneEnvironment` to LevelManager constructor

- [x] Task 6: Write tests (AC: #11, #12)
  - [x] 6.1 Create `src/__tests__/PaletteTransition.test.ts`: construction, start, update with interpolation, finalization, sceneEnvironment integration, inactive no-op
  - [x] 6.2 Add `VectorMaterials.setPaletteHSL()` tests to `src/__tests__/VectorMaterials.test.ts`
  - [x] 6.3 Add `SceneEnvironment.updatePaletteHSL()` test to `src/__tests__/SceneEnvironment.test.ts`
  - [x] 6.4 Add `PALETTE_TRANSITION_DURATION` constant validation test

- [x] Task 7: Build verification (AC: #10, #12)
  - [x] 7.1 Run `npx tsc --noEmit` -- zero TypeScript errors
  - [x] 7.2 Run `npm run test` -- all tests pass, zero regressions

## Dev Notes

### Architecture Compliance

- **VectorMaterials.setPaletteHSL()** is a per-frame color update method. It does NOT change the discrete palette name tracked by `ColorPalette.setActivePalette()`. The discrete name is only updated when the transition completes via the existing `setPalette()` call. [Source: project-context.md#Critical Implementation Rules]
- **Systems never import each other.** PaletteTransition is a rendering utility, not a system. LevelManager creates and owns it. [Source: project-context.md#Architecture Rules]
- **No fetch() during gameplay.** PaletteTransition is purely computational (HSL lerp) with zero I/O. [Source: project-context.md#Performance Rules]
- **No per-frame allocations.** PaletteTransition pre-stores from/to HSL values as numbers. Lerp is arithmetic only. Zero `new` calls in `update()`. [Source: project-context.md#Performance Rules]
- **Use `Logger.info/warn/error()`** -- NEVER `console.log()`. [Source: project-context.md#Critical Don't-Miss Rules]
- **`erasableSyntaxOnly: true`**: No `enum`. Use `type` unions and `as const` objects. [Source: tsconfig.json]
- **`verbatimModuleSyntax: true`**: Use `import type { ... }` for type-only imports. [Source: tsconfig.json]

### Critical Implementation Rules

- **VectorMaterials.setPaletteHSL()** iterates the SAME `thinMaterials` and `fatMaterials` maps that `setPalette()` iterates. The logic is identical except it takes raw HSL numbers instead of a palette name. Follow the exact iteration pattern in `setPalette()`.
- **SceneEnvironment.updatePaletteHSL()** follows the same pattern as the existing `updatePalette()` method, but takes raw HSL values instead of reading from `getActivePalette()`.
- **PaletteTransition.update()** MUST call `setPalette(target)` when progress reaches 1.0 so that `getActivePalette()` returns the correct values for any code that reads the active palette (PaletteColors CSS utilities, future code). Without this finalization step, `getPaletteHexColor()` and other CSS utilities would still return the old palette's values.
- **LevelManager constructor change:** Adding an optional `SceneEnvironment` parameter. All callers in main.ts must be updated. The SceneEnvironment is currently created but its reference is not stored -- store it in a variable so it can be passed to LevelManager.

### Existing Code Patterns to Follow

- **VectorMaterials.setPalette()** at `src/rendering/VectorMaterials.ts` lines 86-99 is the reference for how to iterate and update materials. `setPaletteHSL()` follows this exactly.
- **SceneEnvironment.updatePalette()** at `src/rendering/SceneEnvironment.ts` lines 109-116 is the reference for starfield color update. `updatePaletteHSL()` follows this pattern.
- **PhaseTransition** at `src/state/phases/PhaseTransition.ts` is the reference for a time-based transition utility with `start/update/isActive` pattern. PaletteTransition follows the same lifecycle.
- **LevelManager.startLevel()** currently calls `this.vectorMaterials.setPalette(paletteName)` at line 192. This is where the transition starts for level > 1.

### What Already Exists (DO NOT recreate)

- `src/rendering/ColorPalette.ts` -- Palette definitions, `getActivePalette()`, `setActivePalette()`. DO NOT MODIFY.
- `src/rendering/VectorMaterials.ts` -- Material registry singleton. MODIFY: add `setPaletteHSL()`.
- `src/rendering/SceneEnvironment.ts` -- Grid + starfield. MODIFY: add `updatePaletteHSL()`.
- `src/rendering/PaletteColors.ts` -- CSS color utilities. DO NOT MODIFY (they read from `getActivePalette()` which is updated at transition end).
- `src/systems/LevelManager.ts` -- Level orchestrator. MODIFY: add PaletteTransition, update startLevel() and update().
- `src/config/constants.ts` -- MODIFY: add `PALETTE_TRANSITION_DURATION`.
- `src/main.ts` -- MODIFY: store SceneEnvironment reference, pass to LevelManager.
- `src/state/phases/PhaseTransition.ts` -- Fade transition utility. DO NOT MODIFY. Reference for pattern.

### What Must Be Created

- `src/rendering/PaletteTransition.ts` -- Animated palette HSL interpolation
- `src/__tests__/PaletteTransition.test.ts` -- Tests for PaletteTransition

### Color Palette HSL Values Reference

| Palette | Hue | Saturation | Lightness |
|---------|-----|------------|-----------|
| green | 0.33 | 1.0 | 0.5 |
| amber | 0.11 | 1.0 | 0.5 |
| red | 0.0 | 1.0 | 0.5 |

Transition green->amber: hue interpolates 0.33->0.11 (shift toward warmer), saturation stays 1.0, lightness stays 0.5.
Transition amber->red: hue interpolates 0.11->0.0 (shift toward red), saturation stays 1.0, lightness stays 0.5.

In practice, only hue changes between these three palettes (saturation and lightness are identical), but the interpolation should handle all three HSL components for correctness and future extensibility.

### Scope Boundaries

**IN scope**: PaletteTransition class with HSL lerp, VectorMaterials.setPaletteHSL(), SceneEnvironment.updatePaletteHSL(), LevelManager integration, PALETTE_TRANSITION_DURATION constant, tests.

**NOT in scope** (future stories):
- Overseer enemy type -- Story 5-6
- Enemy behavioral evolution system -- Story 5-7
- Handler voice escalation -- Story 5-8
- Briefing screens for all levels -- Story 5-9
- Ending sequence -- Story 5-10
- High score table -- Story 5-11
- Cyberspace fragmentation ending -- Story 5-12

### Previous Story Intelligence

From Story 5-4 (The Core Intelligence Boss):
- Test count after Story 5-4: 1687 tests across 118 files.
- BossPhaseChangedEvent.phase union extended with 'reason' and 'surge'.
- CoreIntelligenceBoss created at src/entities/bosses/CoreIntelligenceBoss.ts.
- LEVEL_BOSS_FACTORIES[3] updated to CoreIntelligenceBoss.

From Story 5-3 (Level 3 Red Palette):
- LEVEL_PALETTES[3] = 'red' exists in constants.ts.
- Level 2->3 transition in main.ts works correctly.
- LevelManager.startLevel() sets palette instantly via `vectorMaterials.setPalette()`.

From Story 5-1 (Level 2 Amber Palette):
- LEVEL_PALETTES map created with all three entries.
- PaletteColors utility created for CSS color synchronization.
- SceneEnvironment.updatePalette() created but NEVER called from LevelManager or main.ts during level transitions. This is a known gap -- the starfield stays the old color when levels change. This story fixes it by including starfield in the animated transition.
- LevelManager stores vectorMaterials but does NOT store sceneEnvironment reference.

From Story 1-6 (Scene Environment):
- SceneEnvironment created with updatePalette() method designed for future level transitions.
- main.ts creates SceneEnvironment without storing the reference: `new SceneEnvironment(scene, vectorMaterials)`.

### Project Structure Notes

- `src/rendering/PaletteTransition.ts` -- alongside ColorPalette.ts, VectorMaterials.ts, SceneEnvironment.ts
- `src/__tests__/PaletteTransition.test.ts` -- alongside existing test files
- No new npm dependencies needed
- No new directories needed

### References

- [Source: gdd.md#Color Palette] -- "Depth-based color system -- the entire screen's palette tells you where you are in cyberspace: Green (outer/safe), Amber (mid/caution), Red (deep core/danger)"
- [Source: gdd.md#Difficulty Scaling] -- "Color palette escalation: Green -> Amber -> Red -- psychological pressure through visual shift"
- [Source: game-architecture.md#Color Depth System] -- "Transition the entire scene's color palette per level, affecting all rendered geometry uniformly"
- [Source: game-architecture.md#Phase/Level System] -- "4 phase types per level, transitions, checkpoint system, color palette shifts"
- [Source: epics.md#Epic 5 Story 5] -- "As a player, I can see the color palette shift from green to amber to red across levels so that visual progression reinforces depth into cyberspace"
- [Source: project-context.md#Critical Implementation Rules] -- "Use VectorMaterials.setPalette() for color transitions -- never per-object"

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- PaletteTransition uses linear HSL interpolation. Since all three palettes share saturation (1.0) and lightness (0.5), in practice only hue interpolates: green 0.33 -> amber 0.11 -> red 0.0. The interpolation correctly handles all three HSL components for future extensibility.
- VectorMaterials.setPaletteHSL() follows the exact same iteration pattern as setPalette() but takes raw HSL numbers instead of a palette name. Does NOT call setActivePalette() -- the discrete palette name is only updated on transition completion.
- SceneEnvironment.updatePaletteHSL() follows the same pattern as updatePalette() but takes raw HSL values. This fixes a known gap from Story 5-1 where the starfield was never updated during level transitions.
- LevelManager constructor now accepts an optional SceneEnvironment parameter (last positional arg) for backward compatibility. PaletteTransition is created in the constructor.
- LevelManager.startLevel() uses animated transition for level > 1, instant setPalette() for Level 1. The palette transition runs during early gameplay of the new level (2.0 seconds by default).
- main.ts stores the SceneEnvironment reference (previously discarded with `new SceneEnvironment(...)`) and passes it to LevelManager.

### Completion Notes List

- Task 1: Added `PALETTE_TRANSITION_DURATION = 2.0` constant to constants.ts.
- Task 2: Added `setPaletteHSL(hue, saturation, lightness)` method to VectorMaterials class. Iterates all thin and fat materials with lightnessOffset applied. Does NOT change the active palette name.
- Task 3: Added `updatePaletteHSL(hue, saturation, lightness)` method to SceneEnvironment. Updates starfield PointsMaterial color with STARFIELD_LIGHTNESS_OFFSET applied.
- Task 4: Created `src/rendering/PaletteTransition.ts`. Accepts VectorMaterials and optional SceneEnvironment. start() stores from/to HSL values, update() does per-frame linear lerp and calls setPaletteHSL on materials and sceneEnvironment. On completion, calls setPalette(target) to finalize the discrete palette name and updatePalette() on sceneEnvironment.
- Task 5: Wired PaletteTransition into LevelManager. Constructor accepts optional SceneEnvironment. startLevel() starts animated transition for level > 1. update() drives paletteTransition.update(dt) before phase updates. Updated main.ts to store SceneEnvironment reference and pass it to LevelManager.
- Task 6: Created PaletteTransition.test.ts (13 tests: construction, start, interpolation, midpoint values, finalization, sceneEnvironment integration, inactive no-op, amber-red transition, clamping, sequential updates, constant validation). Added 3 setPaletteHSL tests to VectorMaterials.test.ts. Added 1 updatePaletteHSL test to SceneEnvironment.test.ts.
- Task 7: `npx tsc --noEmit` passes clean. Full test suite: 1706 tests across 119 files, all pass, zero regressions. Added 17 new tests (13 PaletteTransition + 3 VectorMaterials + 1 SceneEnvironment).

### Change Log

- 2026-03-26: Story 5-5 implemented -- Color Palette Progression. PaletteTransition class with per-frame HSL linear interpolation for smooth green->amber->red transitions between levels. VectorMaterials.setPaletteHSL() for arbitrary HSL material updates. SceneEnvironment.updatePaletteHSL() for starfield color interpolation (fixes gap from Story 5-1). LevelManager wired with animated palette transitions for level > 1 (2.0s duration). Added 17 new tests.

### File List

- `src/rendering/PaletteTransition.ts` -- New: Animated HSL palette interpolation between palette presets
- `src/rendering/VectorMaterials.ts` -- Modified: added setPaletteHSL() method for arbitrary HSL material updates
- `src/rendering/SceneEnvironment.ts` -- Modified: added updatePaletteHSL() method for starfield HSL updates
- `src/systems/LevelManager.ts` -- Modified: added PaletteTransition field, optional SceneEnvironment constructor param, animated palette transition in startLevel(), palette transition driving in update()
- `src/config/constants.ts` -- Modified: added PALETTE_TRANSITION_DURATION = 2.0
- `src/main.ts` -- Modified: stored SceneEnvironment reference, passed to LevelManager constructor
- `src/__tests__/PaletteTransition.test.ts` -- New: 13 tests for PaletteTransition class
- `src/__tests__/VectorMaterials.test.ts` -- Modified: added 3 setPaletteHSL() tests
- `src/__tests__/SceneEnvironment.test.ts` -- Modified: added 1 updatePaletteHSL() test
