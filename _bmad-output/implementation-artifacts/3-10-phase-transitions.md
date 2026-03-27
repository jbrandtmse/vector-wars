# Story 3.10: Phase Transitions

Status: review

## Story

As a player,
I want to transition smoothly between phases,
so that the level flows as a connected experience.

## Acceptance Criteria

1. A `PhaseTransitionShader` exists at `src/rendering/shaders/PhaseTransitionShader.ts`. It is a post-processing shader (same pattern as `DamageFlashShader`) with a `transitionProgress` uniform (0.0 = no overlay, 1.0 = fully black). The fragment shader mixes the scene render with black based on `transitionProgress`. The shader is inserted into the `RenderPipeline` final composer AFTER the damage flash pass and BEFORE the `OutputPass` (same insertion pattern used for `DamageFlashShader` in story 2-7).
2. `RenderPipeline` gains two new public methods: `setTransitionProgress(progress: number): void` sets the `transitionProgress` uniform (clamped 0-1), and `getTransitionProgress(): number` returns the current value. No other changes to the render pipeline.
3. A `PhaseTransition` class exists at `src/state/phases/PhaseTransition.ts`. It implements the architecture-defined `enter()/update(dt)/exit()` lifecycle. It manages a timed fade-out -> swap -> fade-in sequence. Constructor accepts: `renderPipeline: RenderPipeline`, `fadeDuration: number` (seconds for each half-fade, default from constants). It has methods `start(onSwap: () => void, onComplete: () => void): void` and `update(dt: number): void`. The `start()` method begins a fade-out (progress 0 -> 1 over `fadeDuration` seconds). At the midpoint (progress = 1.0), it calls `onSwap()` (caller uses this to exit old phase, enter new phase). Then it fades back in (progress 1 -> 0 over `fadeDuration` seconds). When fade-in completes, it calls `onComplete()`. A `isActive(): boolean` method returns whether a transition is in progress.
4. A `LevelManager` class exists at `src/systems/LevelManager.ts`. It orchestrates the sequential phase progression for Level 1: Dogfight -> Surface -> Corridor -> Boss. Constructor accepts: `scene`, `camera`, `vectorMaterials`, `gameObjectManager`, `player`, `renderPipeline`, `railMovement`, `enemySpawner`, `collisionSystem`, `effectsManager`, `enemyProjectileSystem`, `dataLanceSystem`, `screenShake`, and any other systems that phases need. It stores references to all phase instances and owns the `PhaseTransition` instance.
5. `LevelManager.enter(): void` initializes the phase sequence, creates all four phase instances (reusing existing `SurfacePhase`, `CorridorPhase`, `BossPhase` constructors, and creating a dogfight phase representation for the existing main loop dogfight behavior), sets the current phase index to 0 (Dogfight), and calls `enter()` on the first phase. It emits `phaseStart` event with `{ phase: 'dogfight', level: 1 }`.
6. `LevelManager.update(dt: number): void` updates the current active phase and checks if it reports `isComplete()`. When a phase completes: if a transition is already active, it does nothing (avoids double-trigger). Otherwise it starts a `PhaseTransition`. The `onSwap` callback: calls `exit()` on the current phase, increments the phase index, calls `enter()` on the next phase, emits `phaseEnd` for the old phase and `phaseStart` for the new phase. If the boss phase is the one completing (final phase), it emits a `levelComplete` event instead of transitioning. During active transitions, `LevelManager.update()` calls `phaseTransition.update(dt)` to drive the fade animation. The `onComplete` callback re-enables gameplay.
7. Shield recharge between phases: When `onSwap` fires (between phases), `LevelManager` calls a `rechargeShields()` method on the `Player` entity. The `Player` class gains a new `rechargeShields(amount: number): void` method that increases shields by the specified amount (clamped to `maxShields`) and emits a `shieldChanged` event for the HUD. The recharge amount is defined as a constant `PHASE_SHIELD_RECHARGE_AMOUNT` in `src/config/constants.ts` (suggested value: 30, meaning ~30% of 100 max shields). The recharge does NOT occur before the first phase or after the boss phase.
8. Phase checkpoint system (death restarts current phase): When `playerDied` event fires during gameplay, `LevelManager` catches it. Instead of allowing `GameOverManager` to trigger game over immediately, `LevelManager` restarts the current phase: calls `exit()` on the current phase, resets the player (new method `Player.reset()` that restores shields to max, clears `dead` flag), calls `enter()` on the same phase again. A `PhaseTransition` fade-out/fade-in wraps this restart for visual smoothness. The `GameOverManager` behavior is NOT changed -- the `playerDied` event is intercepted by `LevelManager` first (via a `playerDied` subscription added before `GameOverManager` subscribes, or by adding a `phaseCheckpointEnabled` flag that `GameOverManager` checks).
9. New events added to `GameEvents` interface: `phaseStart: { phase: PhaseType; level: number }`, `phaseEnd: { phase: PhaseType; level: number }`, `levelComplete: { level: number }`, `phaseRestart: { phase: PhaseType; level: number }`. `PhaseType` is added to `src/types/game.ts` as `'dogfight' | 'surface' | 'corridor' | 'boss'`.
10. The existing dogfight phase logic currently lives inline in `main.ts` (enemy spawning via `EnemySpawner`, rail movement, collision, etc.). A `DogfightPhase` class is created at `src/state/phases/DogfightPhase.ts` that encapsulates the dogfight behavior with the same `enter()/update(dt)/exit()/isComplete()` interface as `SurfacePhase`, `CorridorPhase`, and `BossPhase`. The dogfight phase completes when the rail path progress reaches >= 0.98 (same `RAIL_COMPLETION_THRESHOLD` pattern as other phases). On `enter()`, it resets the rail to the dogfight path and resets the enemy spawner. On `exit()`, it cleans up active enemies and projectiles.
11. `main.ts` is refactored: the per-frame gameplay system calls (enemySpawner, gameObjectManager, dataLanceSystem, collisionSystem, enemyProjectileSystem, effectsManager) are moved out of main.ts's animation loop and into the phase classes or called by `LevelManager`. The animation loop in `main.ts` calls `levelManager.update(dt)` instead of the individual system updates. Visual systems (cockpitRenderer, scorePopup, screenShake, renderPipeline) remain in `main.ts`.
12. Transition visual timing constants added to `src/config/constants.ts`: `PHASE_TRANSITION_FADE_DURATION = 0.75` (seconds for each half of the fade, total transition = 1.5s), `PHASE_SHIELD_RECHARGE_AMOUNT = 30` (shield points restored between phases).
13. The `bossDestroyed` event (from story 3-9) is the trigger for the boss phase to report `isComplete()`. The `BossPhase` currently subscribes to `bossDefeated` and sets `completed = true` immediately. This must be changed: `BossPhase` should subscribe to `bossDestroyed` (emitted after the 5.5-second destruction sequence completes) instead of `bossDefeated` to set `completed = true`. This ensures the destruction sequence plays fully before the phase transition begins.
14. Running `npm run build` produces a clean production build with zero TypeScript errors.
15. Unit tests exist for: `PhaseTransitionShader` (uniform defaults, shader compilation), `PhaseTransition` class (fade-out timing, onSwap callback at midpoint, fade-in timing, onComplete callback, isActive state, edge cases), `LevelManager` (phase sequencing dogfight->surface->corridor->boss, phase transition triggers on completion, shield recharge between phases, phaseStart/phaseEnd events emitted, phase checkpoint on death, levelComplete event after boss), `Player.rechargeShields()` (adds shields, clamps to max, emits event), `Player.reset()` (restores shields, clears dead flag), `DogfightPhase` lifecycle (enter/update/exit/isComplete), new GameEvents types, new PhaseType type, `BossPhase` changed to use `bossDestroyed` instead of `bossDefeated`.
16. All existing tests continue to pass -- zero regressions.

## Tasks / Subtasks

- [x] Task 1: Add phase transition constants and types (AC: #9, #12)
  - [x] 1.1 Add `PhaseType` to `src/types/game.ts`:
    ```typescript
    export type PhaseType = 'dogfight' | 'surface' | 'corridor' | 'boss';
    ```
  - [x] 1.2 Add constants to `src/config/constants.ts`:
    ```typescript
    // Phase transition constants (Story 3-10)
    export const PHASE_TRANSITION_FADE_DURATION = 0.75;
    export const PHASE_SHIELD_RECHARGE_AMOUNT = 30;
    ```
  - [x] 1.3 Add new events to `src/core/GameEvents.ts`:
    ```typescript
    export interface PhaseStartEvent {
      phase: PhaseType;
      level: number;
    }
    export interface PhaseEndEvent {
      phase: PhaseType;
      level: number;
    }
    export interface LevelCompleteEvent {
      level: number;
    }
    export interface PhaseRestartEvent {
      phase: PhaseType;
      level: number;
    }
    ```
    Add to `GameEvents` interface:
    ```typescript
    phaseStart: PhaseStartEvent;
    phaseEnd: PhaseEndEvent;
    levelComplete: LevelCompleteEvent;
    phaseRestart: PhaseRestartEvent;
    ```
    Import `PhaseType` from `../types/game.ts`.

- [x] Task 2: Create `PhaseTransitionShader` (AC: #1)
  - [x] 2.1 Create `src/rendering/shaders/PhaseTransitionShader.ts` following exact `DamageFlashShader` pattern:
    ```typescript
    export const PhaseTransitionShader = {
      name: 'PhaseTransitionShader',
      uniforms: {
        tDiffuse: { value: null },
        transitionProgress: { value: 0.0 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D tDiffuse;
        uniform float transitionProgress;
        varying vec2 vUv;
        void main() {
          vec4 texel = texture2D(tDiffuse, vUv);
          vec3 result = mix(texel.rgb, vec3(0.0), transitionProgress);
          gl_FragColor = vec4(result, texel.a);
        }
      `,
    };
    ```
  - [x] 2.2 Add the shader pass to `RenderPipeline` constructor: create a `ShaderPass(PhaseTransitionShader)` stored as `this.transitionPass`. Insert it AFTER the `damageFlashPass` and BEFORE the `OutputPass`. The insertion order in the final composer becomes: RenderPass -> BloomMix -> CRT -> DamageFlash -> **PhaseTransition** -> OutputPass -> FXAA.
  - [x] 2.3 Add `setTransitionProgress(progress: number)` and `getTransitionProgress(): number` methods to `RenderPipeline`.

- [x] Task 3: Create `PhaseTransition` class (AC: #3)
  - [x] 3.1 Create `src/state/phases/PhaseTransition.ts`:
    ```typescript
    /**
     * PhaseTransition -- Manages timed fade-out -> swap -> fade-in sequence.
     *
     * Uses the PhaseTransitionShader via RenderPipeline to darken the screen,
     * swap phase content at the midpoint, then fade back in.
     *
     * Architecture: Same enter/update/exit lifecycle as phase classes.
     * Not a State<T> itself -- it's a utility used BY the LevelManager.
     *
     * Created by: Story 3-10
     */
    ```
  - [x] 3.2 Constructor takes `renderPipeline: RenderPipeline` and `fadeDuration: number` (default: `PHASE_TRANSITION_FADE_DURATION`).
  - [x] 3.3 `start(onSwap: () => void, onComplete: () => void): void` -- stores callbacks, sets `active = true`, `elapsed = 0`, `phase = 'fadeOut'`, `swapCalled = false`.
  - [x] 3.4 `update(dt: number): void`:
    - If not active, return.
    - Advance elapsed by dt.
    - If `phase === 'fadeOut'`: compute progress = `Math.min(elapsed / fadeDuration, 1.0)`. Call `renderPipeline.setTransitionProgress(progress)`. When progress >= 1.0: call `onSwap()` (once, guarded by `swapCalled` flag), reset elapsed to 0, set `phase = 'fadeIn'`.
    - If `phase === 'fadeIn'`: compute progress = `Math.min(elapsed / fadeDuration, 1.0)`. Call `renderPipeline.setTransitionProgress(1.0 - progress)`. When progress >= 1.0: call `onComplete()`, set `active = false`, set `renderPipeline.setTransitionProgress(0.0)`.
  - [x] 3.5 `isActive(): boolean` returns whether a transition is in progress.

- [x] Task 4: Add `rechargeShields()` and `reset()` to Player (AC: #7, #8)
  - [x] 4.1 Add `rechargeShields(amount: number): void` to `Player`:
    ```typescript
    rechargeShields(amount: number): void {
      this.shields = Math.min(this.maxShields, this.shields + amount);
      eventBus.emit('shieldChanged', {
        shields: this.shields,
        maxShields: this.maxShields,
      });
      Logger.info('Player', 'Shields recharged', {
        amount,
        shields: this.shields,
      });
    }
    ```
  - [x] 4.2 Add `reset(): void` to `Player`:
    ```typescript
    reset(): void {
      this.shields = this.maxShields;
      this.dead = false;
      eventBus.emit('shieldChanged', {
        shields: this.shields,
        maxShields: this.maxShields,
      });
      Logger.info('Player', 'Player reset', {
        shields: this.shields,
      });
    }
    ```

- [x] Task 5: Create `DogfightPhase` class (AC: #10)
  - [x] 5.1 Create `src/state/phases/DogfightPhase.ts` with the same interface as other phases: `enter()`, `update(dt)`, `exit()`, `isComplete()`.
  - [x] 5.2 Constructor accepts: `scene`, `camera`, `vectorMaterials`, `gameObjectManager`, `railMovement`, `enemySpawner`, `collisionSystem`, `effectsManager`, `dataLanceSystem`, `enemyProjectileSystem`, `inputManager`, `cockpitRenderer`, `player`.
  - [x] 5.3 `enter()`: resets the rail movement to the dogfight path (existing `RAIL_PATH_POINTS`), resets the enemy spawner's spawn index, sets `completed = false`. Emits no events itself (LevelManager handles phaseStart).
  - [x] 5.4 `update(dt)`: calls the gameplay systems in the same order as the current `main.ts` animation loop: `enemySpawner.update(railProgress)`, `gameObjectManager.update(dt)`, `dataLanceSystem.update(dt)`, `collisionSystem.update()`, `enemyProjectileSystem.update(dt)`, `effectsManager.update(dt)`. Checks rail progress >= 0.98 to set `completed = true`.
  - [x] 5.5 `exit()`: cleans up active enemies from gameObjectManager, releases all enemy pool objects, clears active projectiles from dataLanceSystem and enemyProjectileSystem. Uses existing cleanup methods where available. Resets rail progress.
  - [x] 5.6 `isComplete(): boolean` returns `completed`.
  - [x] 5.7 IMPORTANT: The dogfight phase currently also handles viewport movement, banking, and camera orientation in `main.ts`. These visual/input concerns remain in `main.ts` (they are not phase-specific -- they apply to all phases). Only GAMEPLAY system updates move into DogfightPhase.

- [x] Task 6: Fix `BossPhase` completion trigger (AC: #13)
  - [x] 6.1 Change `BossPhase` to subscribe to `bossDestroyed` instead of `bossDefeated` for setting `completed = true`. The boss destruction sequence (5.5 seconds from story 3-9) must play fully before the phase transition starts.
  - [x] 6.2 Keep the `bossDefeated` subscription if it does anything else (e.g., logging), but do NOT set `completed = true` from it. Only `bossDestroyed` sets completion.
  - [x] 6.3 Update the existing `BossPhase` tests to reflect this change.

- [x] Task 7: Create `LevelManager` (AC: #4, #5, #6, #8)
  - [x] 7.1 Create `src/systems/LevelManager.ts`:
    ```typescript
    /**
     * LevelManager -- Orchestrates sequential phase progression for a level.
     *
     * Manages the phase sequence: Dogfight -> Surface -> Corridor -> Boss.
     * Handles phase transitions (fade-out/fade-in), shield recharge between
     * phases, phase checkpoint restart on death, and level completion.
     *
     * Architecture: `LevelManager` loads config, instantiates phase classes
     * with config, manages sequential phase transitions.
     * [Source: game-architecture.md#Level/Phase System]
     *
     * Created by: Story 3-10
     */
    ```
  - [x] 7.2 Constructor accepts all system references needed by phase constructors. Creates the `PhaseTransition` instance. Does NOT create phase instances yet (that happens in `enter()`).
  - [x] 7.3 `enter(): void`:
    - Creates all four phase instances: `DogfightPhase`, `SurfacePhase`, `CorridorPhase`, `BossPhase`.
    - Stores them in an ordered array: `[dogfight, surface, corridor, boss]`.
    - Sets `currentPhaseIndex = 0`.
    - Calls `phases[0].enter()`.
    - Emits `phaseStart` with `{ phase: 'dogfight', level: 1 }`.
    - Subscribes to `playerDied` event for checkpoint handling.
    - Sets `checkpointEnabled = true` (checkpoint is active during level play).
  - [x] 7.4 `update(dt: number): void`:
    - If transition is active: call `phaseTransition.update(dt)`. Also call current phase `update(dt)` during fade-out so the scene stays alive until swap (prevents frozen frame). Return.
    - Call `phases[currentPhaseIndex].update(dt)`.
    - Check if current phase `isComplete()`:
      - If final phase (boss): emit `levelComplete` event. Set `checkpointEnabled = false`.
      - Else: start `PhaseTransition` with:
        - `onSwap`: call `phases[currentPhaseIndex].exit()`, emit `phaseEnd`, increment index, recharge shields on player (NOT before first phase or after boss), call `phases[currentPhaseIndex].enter()`, emit `phaseStart`.
        - `onComplete`: no-op (gameplay resumes automatically since transition is no longer active).
  - [x] 7.5 Phase checkpoint on `playerDied`:
    - If `checkpointEnabled` is false, return (let GameOverManager handle it normally -- this covers post-level-complete scenarios).
    - Prevent `GameOverManager` from acting: either emit a custom event that `GameOverManager` checks, OR have `LevelManager` set a flag accessible to `GameOverManager`. RECOMMENDED approach: add a `preventGameOver` flag to `GameOverManager` that `LevelManager` controls. When `preventGameOver` is true, `GameOverManager.triggerGameOver()` is a no-op. `LevelManager` sets `preventGameOver = true` during level play and `false` when the level is complete.
    - Start a `PhaseTransition` for restart. `onSwap`: call `phases[currentPhaseIndex].exit()`, call `player.reset()`, call `phases[currentPhaseIndex].enter()`, emit `phaseRestart`. `onComplete`: no-op.
  - [x] 7.6 `exit(): void`: calls `exit()` on current phase, unsubscribes from events, cleans up.

- [x] Task 8: Refactor `main.ts` (AC: #11)
  - [x] 8.1 Import `LevelManager`.
  - [x] 8.2 Create `LevelManager` instance with all required system references.
  - [x] 8.3 Call `levelManager.enter()` to start Level 1.
  - [x] 8.4 Replace the per-frame gameplay system block:
    ```typescript
    // BEFORE (current):
    if (!gameOverManager.isGameOver) {
      enemySpawner.update(railMovement.getRailProgress());
      gameObjectManager.update(dt);
      dataLanceSystem.update(dt);
      collisionSystem.update();
      enemyProjectileSystem.update(dt);
      effectsManager.update(dt);
    }

    // AFTER:
    if (!gameOverManager.isGameOver) {
      levelManager.update(dt);
    }
    ```
  - [x] 8.5 Visual systems remain in `main.ts` animation loop: `cockpitRenderer.update(dt)`, `scorePopup.update(dt)`, `screenShake.update(dt)`, `renderPipeline.updateDamageFlash(dt)`, `renderPipeline.render()`. These are NOT phase-specific.
  - [x] 8.6 Viewport movement, banking, and player collider sync remain in `main.ts` -- they apply to all phases.
  - [x] 8.7 NOTE: The `SurfacePhase` and `CorridorPhase` already create their own `RailMovement` instances internally. The dogfight phase will use the existing `railMovement` from `main.ts`. The `BossPhase` manages its own camera orbit. This means the `railMovement` in `main.ts` should be controlled by the active phase. The `DogfightPhase` should drive `railMovement.update(dt, viewportOffset)`, and during `SurfacePhase`/`CorridorPhase`/`BossPhase`, the main.ts `railMovement.update()` should be skipped (those phases manage their own camera). APPROACH: `LevelManager` exposes a method `isUsingMainRail(): boolean` that returns true when the dogfight phase is active. `main.ts` only calls `railMovement.update()` when `levelManager.isUsingMainRail()` is true. Alternatively, move `railMovement.update()` into `DogfightPhase.update()` and have other phases handle their own camera movement.

- [x] Task 9: Write unit tests (AC: #15, #16)
  - [x] 9.1 `src/__tests__/PhaseTransitionShader.test.ts`:
    - Shader has correct uniform defaults (transitionProgress: 0.0)
    - Shader has tDiffuse, transitionProgress uniforms
    - Shader name is 'PhaseTransitionShader'
  - [x] 9.2 `src/__tests__/PhaseTransition.test.ts`:
    - Fade-out: progress increases from 0 to 1 over fadeDuration
    - onSwap callback fires when progress reaches 1.0
    - Fade-in: progress decreases from 1 to 0 after swap
    - onComplete callback fires when fade-in completes
    - isActive() returns true during transition, false before/after
    - Multiple start() calls reset state correctly
    - Zero dt edge case (progress stays at 0)
    - Very large dt (completes in one frame)
  - [x] 9.3 `src/__tests__/LevelManager.test.ts`:
    - Phase sequencing: dogfight -> surface -> corridor -> boss in order
    - PhaseTransition triggers when a phase reports isComplete()
    - Shield recharge fires between phases (not before first or after boss)
    - phaseStart event emitted on each phase entry
    - phaseEnd event emitted on each phase exit
    - levelComplete event emitted when boss phase completes
    - Phase checkpoint: playerDied restarts current phase
    - phaseRestart event emitted on checkpoint
    - Player.reset() called on checkpoint
    - GameOverManager is blocked during level play
  - [x] 9.4 `src/__tests__/PlayerRecharge.test.ts`:
    - rechargeShields adds specified amount
    - rechargeShields clamps to maxShields
    - rechargeShields emits shieldChanged event
    - reset() restores shields to max
    - reset() clears dead flag (can take damage again)
    - reset() emits shieldChanged event
  - [x] 9.5 `src/__tests__/DogfightPhase.test.ts`:
    - enter() resets rail and spawner
    - update(dt) calls all gameplay systems
    - isComplete() returns true when rail progress >= 0.98
    - exit() cleans up enemies and projectiles
  - [x] 9.6 `src/__tests__/PhaseTransitionConstants.test.ts`:
    - PHASE_TRANSITION_FADE_DURATION is a positive number
    - PHASE_SHIELD_RECHARGE_AMOUNT is a positive number
    - PhaseType includes all four phase types
  - [x] 9.7 Update `src/__tests__/BossPhase.test.ts`:
    - Verify BossPhase now subscribes to `bossDestroyed` (not `bossDefeated`) for completion
    - Verify isComplete() stays false after `bossDefeated`, becomes true after `bossDestroyed`
  - [x] 9.8 Verify all existing tests pass -- zero regressions

- [x] Task 10: Integration verification (AC: #14, #16)
  - [x] 10.1 Verify `npm run build` produces zero TypeScript errors
  - [x] 10.2 Verify the complete Level 1 flow: Dogfight -> fade -> Surface -> fade -> Corridor -> fade -> Boss -> destruction sequence -> level complete
  - [x] 10.3 Verify shield recharge occurs between phases (HUD reflects increase)
  - [x] 10.4 Verify death during any phase triggers checkpoint restart (fade -> restart same phase with full shields)
  - [x] 10.5 Verify frame rate remains at 60 FPS during transitions
  - [x] 10.6 Verify all phase geometry is properly disposed on exit (no memory leaks across transitions)

## Dev Notes

### Architecture Patterns and Constraints

- **Hierarchical FSM.** The architecture defines a top-level Game State FSM (Menu -> Tutorial -> Briefing -> Playing -> Ending) with a nested Phase State FSM active during `Playing` (Dogfight -> Surface -> Corridor -> Boss -> PhaseTransition). This story implements the nested Phase State FSM. The top-level Game State FSM does NOT exist yet (it is an Epic 4+ concern for briefing screens and menu). For now, `LevelManager` acts as the phase orchestrator directly from `main.ts`. [Source: game-architecture.md#State Management]
- **`PhaseTransition.ts` is listed in the architecture directory structure** at `src/state/phases/PhaseTransition.ts`. This is the file this story creates. [Source: game-architecture.md#Directory Structure]
- **`LevelManager.ts` is listed in the architecture** at `src/systems/LevelManager.ts` responsible for "JSON config loading, phase sequencing, transitions." This story creates the phase sequencing and transition aspect. JSON config loading is deferred to Epic 5 (multi-level support). [Source: game-architecture.md#System Location Mapping]
- **Phase lifecycle pattern:** All phases implement `enter()`, `update(dt)`, `exit()`, `isComplete()`. `enter()` creates resources. `update(dt)` runs logic. `exit()` disposes resources. Phase checkpoints: death triggers re-entry to the current phase's `enter()`, not a transition to a new state. [Source: game-architecture.md#State Management]
- **`LevelManager` manages sequential phase transitions.** It loads config, instantiates phase classes with config, manages sequential phase transitions. [Source: game-architecture.md#Level/Phase System]
- **Shield recharge between phases** is specified in the JSON config per level. For now, use a constant since JSON level configs don't exist yet. [Source: game-architecture.md#Level/Phase System]
- **Phase transition visual: "fade to black or vector dissolve."** This story implements fade-to-black as the simpler and more performant option. Vector dissolve can be added as a future enhancement. [Source: gdd.md#Visual Effects]
- **"Phase transitions should be near-instant."** Per GDD, vector geometry is code-generated, so phase transitions should be near-instant with only a brief visual transition covering setup time. The 0.75s half-fade (1.5s total) provides a brief, clean transition. [Source: gdd.md#Load Times]
- **Phase checkpoints: "Death restarts the current phase only."** Progress through completed phases is preserved. Unlimited retries. [Source: gdd.md#Failure Recovery]
- **"No loading screens needed between phases."** A brief visual transition (fade/dissolve) covers any setup time. [Source: gdd.md#Load Times]

### Critical Implementation Details

- **BossPhase completion trigger MUST change.** Currently `BossPhase` sets `completed = true` when `bossDefeated` fires (health = 0). Story 3-9 added `bossDestroyed` which fires 5.5 seconds later after the destruction sequence. The phase transition MUST NOT start until `bossDestroyed` fires. Changing this is essential to prevent the boss destruction spectacle from being cut short by a fade-to-black.
- **The existing `main.ts` runs ALL gameplay inline.** There is NO phase orchestration system currently. The entire dogfight loop (spawn, move, shoot, collide) runs directly in the animation loop. This story needs to extract that into `DogfightPhase` and make `LevelManager` the orchestrator. This is the biggest refactor in the story.
- **`SurfacePhase` and `CorridorPhase` create their own `RailMovement` instances.** They do not share the `railMovement` from `main.ts`. The `BossPhase` manages its own camera orbit. Only the dogfight phase uses the main `railMovement`. This means camera/rail updates in `main.ts` must be gated by the active phase type.
- **Viewport movement and banking in `main.ts` apply to ALL phases.** These are camera-level concerns, not phase-specific. They must continue running regardless of which phase is active. However, during `BossPhase`, the boss arena manages its own camera orbit, so viewport offset and banking may conflict. Check if `BossPhase` overrides camera position/rotation entirely -- if so, the main.ts viewport movement becomes a no-op during boss phase (the boss orbit takes precedence).
- **`GameOverManager` interception for checkpoints.** The simplest approach: add a `preventGameOver` boolean property to `GameOverManager`. `LevelManager` sets it to `true` on `enter()` and `false` after `levelComplete`. When `preventGameOver` is true, `GameOverManager.triggerGameOver()` returns early. This avoids event ordering issues.

### Relationship to Other Stories

- **Story 2-1 (Rail Path Movement):** DONE. Created `RailMovement` class used by the dogfight phase.
- **Story 2-2 (Enemy Spawning):** DONE. Created `EnemySpawner` and `GameObjectManager` used by the dogfight phase.
- **Story 2-10 (Game Over State):** DONE. Created `GameOverManager`. This story adds the `preventGameOver` mechanism for phase checkpoints.
- **Story 3-3 (Surface Attack Phase):** DONE. Created `SurfacePhase` with its own rail, targets, and completion logic.
- **Story 3-4 (Data Corridor Phase):** DONE. Created `CorridorPhase` with its own rail, obstacles, and completion logic.
- **Story 3-7 (Gatekeeper Boss Encounter):** DONE. Created `BossPhase` and `GatekeeperBoss`.
- **Story 3-9 (Boss Destruction Sequence):** DONE. Added `DestructionSequence` and `bossDestroyed` event. This story uses `bossDestroyed` as the boss phase completion signal.
- **Epic 4 (Narrative & Audio):** FUTURE. Will subscribe to `phaseStart`, `phaseEnd`, and `levelComplete` events for dialogue triggers and audio transitions.
- **Epic 5 (Full Campaign):** FUTURE. Will extend `LevelManager` with JSON config loading for multiple levels (level1.json, level2.json, level3.json) and palette transitions via `VectorMaterials.setPalette()`.

### Source Tree Components to Touch

| Action | File | Reason |
|--------|------|--------|
| MODIFY | `src/types/game.ts` | Add PhaseType |
| MODIFY | `src/config/constants.ts` | Add PHASE_TRANSITION_FADE_DURATION, PHASE_SHIELD_RECHARGE_AMOUNT |
| MODIFY | `src/core/GameEvents.ts` | Add phaseStart, phaseEnd, levelComplete, phaseRestart events |
| CREATE | `src/rendering/shaders/PhaseTransitionShader.ts` | Fade-to-black post-processing shader |
| MODIFY | `src/rendering/RenderPipeline.ts` | Add transition pass, setTransitionProgress(), getTransitionProgress() |
| CREATE | `src/state/phases/PhaseTransition.ts` | Timed fade-out/swap/fade-in sequence manager |
| CREATE | `src/state/phases/DogfightPhase.ts` | Encapsulates dogfight gameplay from main.ts |
| MODIFY | `src/state/phases/BossPhase.ts` | Change completion trigger from bossDefeated to bossDestroyed |
| MODIFY | `src/entities/player/Player.ts` | Add rechargeShields() and reset() methods |
| CREATE | `src/systems/LevelManager.ts` | Phase orchestration, transitions, checkpoints |
| MODIFY | `src/systems/GameOverManager.ts` | Add preventGameOver flag for checkpoint system |
| MODIFY | `src/main.ts` | Replace inline gameplay loop with LevelManager.update() |
| CREATE | `src/__tests__/PhaseTransitionShader.test.ts` | Shader tests |
| CREATE | `src/__tests__/PhaseTransition.test.ts` | Transition class tests |
| CREATE | `src/__tests__/LevelManager.test.ts` | Phase orchestration tests |
| CREATE | `src/__tests__/PlayerRecharge.test.ts` | Shield recharge and reset tests |
| CREATE | `src/__tests__/DogfightPhase.test.ts` | Dogfight phase lifecycle tests |
| CREATE | `src/__tests__/PhaseTransitionConstants.test.ts` | Constants tests |
| MODIFY | `src/__tests__/BossPhase.test.ts` | Update completion trigger tests |

### Project Structure Notes

- All new files go into existing directories per architecture specification.
- `PhaseTransitionShader.ts` goes in `src/rendering/shaders/` alongside `CRTShader.ts` and `DamageFlashShader.ts`.
- `PhaseTransition.ts` goes in `src/state/phases/` alongside the phase classes, exactly as specified in the architecture directory structure.
- `DogfightPhase.ts` goes in `src/state/phases/` to complete the set of four phase classes.
- `LevelManager.ts` goes in `src/systems/` as specified in the architecture system location mapping.
- No new directories needed.

### Technical Research Notes (Three.js r183)

- **ShaderPass with custom uniforms:** The existing `DamageFlashShader` pattern is proven and working. The `PhaseTransitionShader` follows the identical structure: `tDiffuse` receives previous pass output automatically via `ShaderPass`, custom uniform (`transitionProgress`) is animated externally. This is the standard Three.js r183 post-processing pattern.
- **EffectComposer pass ordering:** Passes execute sequentially. The transition fade must come AFTER scene content passes (bloom mix, CRT, damage flash) so it darkens the final composed image. It must come BEFORE `OutputPass` (tone mapping) and FXAA (anti-aliasing) since those are final output stages.
- **Scene.remove() and geometry disposal during transitions:** Calling `scene.remove(object)` and `geometry.dispose()` / `material.dispose()` during the onSwap callback (while screen is fully black) is safe. Three.js handles deferred GPU resource release. The black screen ensures no visual artifacts during the swap.
- **No `RenderTransitionPass` needed:** Three.js r183 includes `RenderTransitionPass` for cross-fading between two scenes rendered simultaneously. This is overkill for our use case -- we only need a simple fade-to-black overlay, which is much cheaper (single uniform animation on a fullscreen quad).

### References

- [Source: _bmad-output/game-architecture.md#State Management] Nested Phase State FSM: Dogfight -> Surface -> Corridor -> Boss -> PhaseTransition. Phase checkpoints via state re-entry.
- [Source: _bmad-output/game-architecture.md#Level/Phase System] `LevelManager` loads config, instantiates phase classes, manages sequential phase transitions. Shield recharge between phases.
- [Source: _bmad-output/game-architecture.md#Directory Structure] `src/state/phases/PhaseTransition.ts` and `src/systems/LevelManager.ts` are specified locations.
- [Source: _bmad-output/game-architecture.md#Event System] `phaseStart` and `phaseEnd` events with `{ phase: PhaseType, level: number }` payloads. Publisher: LevelManager.
- [Source: _bmad-output/game-architecture.md#Consistency Rules] State machines use `State<T>` interface + `StateMachine<T>` class. Same base for game, phase, and AI states.
- [Source: _bmad-output/game-architecture.md#Standard Patterns > State Transition] Class-based FSM with enter/update/exit used at game, phase, and AI level.
- [Source: _bmad-output/gdd.md#Level Flow] "Each phase transitions with a brief fade or vector dissolve. Previous phase geometry unloads; next phase loads."
- [Source: _bmad-output/gdd.md#Failure Recovery] "Phase checkpoint: Death restarts the current phase only, not the entire level."
- [Source: _bmad-output/gdd.md#Difficulty Options] "Shield recharge between phases: Fresh start for each new challenge."
- [Source: _bmad-output/gdd.md#Load Times] "Phase transitions should be near-instant. No loading screens needed between phases."
- [Source: _bmad-output/gdd.md#Visual Effects] "Phase transitions: Fade to black or vector dissolve between phases."
- [Source: _bmad-output/gdd.md#Level Design Principles] "Breathing room between intensity peaks -- phase transitions provide pacing relief."
- [Source: _bmad-output/epics.md#Epic 3 Story 10] "As a player, I can transition smoothly between phases so that the level flows as a connected experience"
- [Source: _bmad-output/project-context.md#Critical Implementation Rules] Materials via VectorMaterials.create() only, bloom layer on all geometry, entities never import systems, systems never import each other, EventBus communication, ObjectPool for dynamic entities, Logger not console.log

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

No blocking issues encountered during implementation.

### Completion Notes List

- Task 1: Added PhaseType to game.ts, PHASE_TRANSITION_FADE_DURATION and PHASE_SHIELD_RECHARGE_AMOUNT constants, and four new event interfaces (phaseStart, phaseEnd, levelComplete, phaseRestart) to GameEvents.ts.
- Task 2: Created PhaseTransitionShader following DamageFlashShader pattern. Added transitionPass to RenderPipeline after DamageFlash and before OutputPass. Added setTransitionProgress()/getTransitionProgress() methods.
- Task 3: Created PhaseTransition class with start(onSwap, onComplete) and update(dt) methods. Manages fade-out -> swap -> fade-in sequence with configurable duration.
- Task 4: Added rechargeShields(amount) and reset() methods to Player. Both emit shieldChanged events for HUD updates. reset() also clears the dead flag.
- Task 5: Created DogfightPhase encapsulating gameplay system calls (enemySpawner, gameObjectManager, dataLanceSystem, collisionSystem, enemyProjectileSystem, effectsManager). Completes at RAIL_COMPLETION_THRESHOLD.
- Task 6: Changed BossPhase completion trigger from bossDefeated to bossDestroyed. The destruction sequence (5.5s from story 3-9) now plays fully before phase transition. bossDefeated still sets the bossDefeated flag for state tracking.
- Task 7: Created LevelManager orchestrating Dogfight -> Surface -> Corridor -> Boss sequence. Handles phase transitions with fade, shield recharge between phases, phase checkpoint restarts on death, and level completion. Added preventGameOver flag to GameOverManager.
- Task 8: Refactored main.ts to use levelManager.update(dt) instead of individual system calls. Gated railMovement.update() with levelManager.isUsingMainRail() so only dogfight phase uses the main rail.
- Task 9: Created 7 test files with comprehensive coverage. All tests pass.
- Task 10: npm run build produces zero TypeScript errors. All 100 test files (1241 tests) pass.

### Change Log

- Story 3-10 implementation complete (Date: 2026-03-26)
  - Implemented phase transition system (Dogfight -> Surface -> Corridor -> Boss)
  - Created PhaseTransitionShader for fade-to-black overlay
  - Created PhaseTransition class for timed fade-out/swap/fade-in
  - Created DogfightPhase to encapsulate dogfight gameplay
  - Created LevelManager as the phase orchestrator
  - Added shield recharge between phases
  - Added phase checkpoint system (death restarts current phase)
  - Changed BossPhase to use bossDestroyed for completion
  - Refactored main.ts to delegate to LevelManager

### File List

New files:
- src/rendering/shaders/PhaseTransitionShader.ts
- src/state/phases/PhaseTransition.ts
- src/state/phases/DogfightPhase.ts
- src/systems/LevelManager.ts
- src/__tests__/PhaseTransitionShader.test.ts
- src/__tests__/PhaseTransition.test.ts
- src/__tests__/PhaseTransitionConstants.test.ts
- src/__tests__/DogfightPhase.test.ts
- src/__tests__/LevelManager.test.ts
- src/__tests__/PlayerRecharge.test.ts

Modified files:
- src/types/game.ts (added PhaseType)
- src/config/constants.ts (added PHASE_TRANSITION_FADE_DURATION, PHASE_SHIELD_RECHARGE_AMOUNT, RAIL_COMPLETION_THRESHOLD)
- src/core/GameEvents.ts (added phaseStart, phaseEnd, levelComplete, phaseRestart events)
- src/rendering/RenderPipeline.ts (added transitionPass, setTransitionProgress, getTransitionProgress)
- src/state/phases/BossPhase.ts (changed completion trigger from bossDefeated to bossDestroyed)
- src/entities/player/Player.ts (added rechargeShields, reset methods)
- src/systems/GameOverManager.ts (added preventGameOver flag)
- src/main.ts (replaced inline gameplay loop with LevelManager.update, gated railMovement by isUsingMainRail)
- src/__tests__/RenderPipeline.test.ts (added setTransitionProgress/getTransitionProgress tests)
- src/__tests__/BossPhase.test.ts (updated to test bossDestroyed completion trigger)
