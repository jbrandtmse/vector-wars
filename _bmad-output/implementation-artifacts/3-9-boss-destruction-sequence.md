# Story 3.9: Boss Destruction Sequence

Status: review

## Story

As a player,
I want to see the boss destruction sequence (peel, strip, shatter),
so that victory is visually spectacular.

## Acceptance Criteria

1. A `DestructionSequence` class exists at `src/entities/bosses/DestructionSequence.ts`. It implements the architecture-defined Sequenced Animation Timeline pattern. It accepts an array of `DestructionStage` objects, each with `name: string`, `duration: number`, `onStart: () => void`, `onUpdate: (progress: number) => void`, `onEnd: () => void`. It has an `update(dt)` method that advances through stages sequentially. A `complete` boolean flag is `true` when all stages have finished. The constructor calls `stages[0].onStart()` immediately. Each stage's `onUpdate` receives progress 0.0 to 1.0. When a stage finishes (progress >= 1.0), `onEnd()` fires, the index advances, and the next stage's `onStart()` fires. This class does NOT import any other system or entity.
2. New events added to `GameEvents` interface in `src/core/GameEvents.ts`: `bossDestructionStage: { stage: string; progress: number }` (emitted each frame during destruction to enable narrative/audio triggers) and `bossDestroyed: { position: { x: number; y: number; z: number }; scoreValue: number }` (emitted when the final destruction stage completes, distinct from the existing `bossDefeated` which fires when health reaches 0).
3. `GatekeeperBoss.onDefeated()` is updated: instead of only emitting `bossDefeated`, it now creates a `DestructionSequence` with three stages (peel, strip, shatter) and stores it as `this.destructionSequence`. The boss stops attacking (existing behavior) but continues calling `this.destructionSequence.update(dt)` each frame in its `update()` method even while `defeated === true`.
4. `Boss.update(dt)` is modified: when `defeated === true` AND `this.destructionSequence` exists AND `!this.destructionSequence.complete`, it calls `this.destructionSequence.update(dt)` instead of `this.updateBoss(dt)`. When `this.destructionSequence.complete === true`, it emits `bossDestroyed`. The `syncCollider()` call continues regardless.
5. **Peel Stage** (duration: 2.0 seconds): The outer shell geometry layer peels away. `onStart`: outer shell rotation speed increases 3x. `onUpdate(progress)`: outer shell scale increases from 1.0 to 2.0 linearly, outer material opacity fades from 1.0 to 0.0 (set `transparent: true`, `depthWrite: false`). At progress >= 1.0, `onEnd`: remove outer shell from `object3D`, dispose outer geometry and material. Emit `bossDestructionStage` event with `stage: 'peel'` during `onUpdate`. Spawn vector shard explosions at the boss position via `bossDestructionStage` event (EffectsManager subscribes).
6. **Strip Stage** (duration: 1.5 seconds): The mid structure strips away. `onStart`: mid structure rotation speed increases 5x. `onUpdate(progress)`: mid structure scale increases from 1.0 to 1.5, mid material opacity fades from 1.0 to 0.0. Color shifts toward white (set material color HSL lightness toward 1.0 linearly with progress). At progress >= 1.0, `onEnd`: remove mid structure from `object3D`, dispose mid geometry and material. Emit `bossDestructionStage` event with `stage: 'strip'`. Spawn additional vector shard explosions.
7. **Shatter Stage** (duration: 2.0 seconds): The inner core shatters spectacularly. `onStart`: core material color flares to pure white (`setHSL(0, 0, 1.0)`) — this is the unique white flash moment per narrative design (the ONLY time pure white appears in the game). Core scale pulses rapidly. `onUpdate(progress)`: core pulses scale between 0.5 and 2.0 at high frequency (`Math.sin(progress * 20 * Math.PI)`), core material opacity fades from 1.0 to 0.0 in the final 50% of progress. At progress >= 1.0, `onEnd`: remove core from `object3D`, dispose core geometry and material. Emit `bossDestructionStage` event with `stage: 'shatter'`. Spawn the largest vector shard explosion burst (multiple simultaneous explosions).
8. Destruction timing constants added to `src/config/constants.ts`: `BOSS_DESTRUCTION_PEEL_DURATION = 2.0`, `BOSS_DESTRUCTION_STRIP_DURATION = 1.5`, `BOSS_DESTRUCTION_SHATTER_DURATION = 2.0`, `BOSS_DESTRUCTION_PEEL_SCALE_END = 2.0`, `BOSS_DESTRUCTION_STRIP_SCALE_END = 1.5`, `BOSS_DESTRUCTION_ROTATION_MULTIPLIER_PEEL = 3.0`, `BOSS_DESTRUCTION_ROTATION_MULTIPLIER_STRIP = 5.0`, `BOSS_DESTRUCTION_SHATTER_PULSE_FREQUENCY = 20` (cycles during shatter), `BOSS_DESTRUCTION_SHATTER_EXPLOSION_COUNT = 5` (number of simultaneous shard explosions in final shatter).
9. `EffectsManager` subscribes to `bossDestructionStage` events and spawns vector shard explosions at the boss position based on the stage: 1 explosion per peel update (throttled to every 0.5s of progress), 2 explosions per strip update (throttled similarly), and `BOSS_DESTRUCTION_SHATTER_EXPLOSION_COUNT` explosions on shatter `onEnd`. This reuses the existing `VectorShardExplosion` pool — no new effect types needed.
10. The boss remains visible and animating throughout the destruction sequence (approximately 5.5 seconds total). The player's camera continues orbiting on the boss arena rail, keeping the destruction in view. No gameplay input is blocked during destruction — the player simply watches the spectacle.
11. After the destruction sequence completes (`bossDestroyed` event emits), `BossPhase` can transition to the next state. This story does NOT implement the phase transition itself (that is story 3-10). The `bossDestroyed` event is the signal for story 3-10 to use.
12. Screen shake is triggered during the destruction sequence: mild shake during peel, medium during strip, heavy during shatter. `DamageEffectsManager` or a new subscription in `EffectsManager` subscribes to `bossDestructionStage` and triggers `screenShake.shake()` with intensity proportional to the stage (peel: 0.3, strip: 0.5, shatter: 0.8).
13. Frame rate remains at 60 FPS stable. The destruction sequence reuses existing geometry (boss layers already exist) and the existing VectorShardExplosion pool. No new geometry is created during the sequence — only the existing boss layers are animated and removed. Pre-allocate all temp vectors. Zero per-frame allocation.
14. Running `npm run build` produces a clean production build with zero TypeScript errors.
15. Unit tests exist for: `DestructionSequence` class (stage progression, callbacks, completion flag, progress calculation, edge cases), `GatekeeperBoss` destruction integration (onDefeated creates sequence, update drives sequence, geometry disposal per stage, events emitted), `Boss` base class update with destruction sequence, destruction constants validation, new `GameEvents` types (`bossDestructionStage`, `bossDestroyed`), `EffectsManager` subscription to destruction events.
16. All existing tests continue to pass — zero regressions.

## Tasks / Subtasks

- [x] Task 1: Add destruction sequence constants to `src/config/constants.ts` (AC: #8)
  - [x] 1.1 Add destruction timing and visual constants:
    ```typescript
    // Boss Destruction Sequence constants (Story 3-9)
    export const BOSS_DESTRUCTION_PEEL_DURATION = 2.0;
    export const BOSS_DESTRUCTION_STRIP_DURATION = 1.5;
    export const BOSS_DESTRUCTION_SHATTER_DURATION = 2.0;
    export const BOSS_DESTRUCTION_PEEL_SCALE_END = 2.0;
    export const BOSS_DESTRUCTION_STRIP_SCALE_END = 1.5;
    export const BOSS_DESTRUCTION_ROTATION_MULTIPLIER_PEEL = 3.0;
    export const BOSS_DESTRUCTION_ROTATION_MULTIPLIER_STRIP = 5.0;
    export const BOSS_DESTRUCTION_SHATTER_PULSE_FREQUENCY = 20;
    export const BOSS_DESTRUCTION_SHATTER_EXPLOSION_COUNT = 5;
    export const BOSS_DESTRUCTION_SHAKE_PEEL = 0.3;
    export const BOSS_DESTRUCTION_SHAKE_STRIP = 0.5;
    export const BOSS_DESTRUCTION_SHAKE_SHATTER = 0.8;
    ```

- [x] Task 2: Add new events to `src/core/GameEvents.ts` (AC: #2)
  - [x] 2.1 Add event interfaces:
    ```typescript
    export interface BossDestructionStageEvent {
      stage: string;
      progress: number;
    }

    export interface BossDestroyedEvent {
      position: { x: number; y: number; z: number };
      scoreValue: number;
    }
    ```
  - [x] 2.2 Add to `GameEvents` interface:
    ```typescript
    bossDestructionStage: BossDestructionStageEvent;
    bossDestroyed: BossDestroyedEvent;
    ```

- [x] Task 3: Create `DestructionSequence` class at `src/entities/bosses/DestructionSequence.ts` (AC: #1)
  - [x] 3.1 Create the class:
    ```typescript
    /**
     * DestructionSequence — Sequenced animation timeline for boss destruction.
     *
     * Architecture pattern: "Boss Destruction Choreography" —
     * timed multi-stage animation with callbacks for geometry removal,
     * effects spawning, audio triggers, and event emission.
     *
     * RULE: Boss destruction is always a DestructionSequence. Never
     * hardcode timed destruction logic in update() with elapsed-time
     * counters.
     *
     * Created by: Story 3-9
     */
    ```
  - [x] 3.2 Define `DestructionStage` interface: `name`, `duration`, `onStart`, `onUpdate(progress)`, `onEnd`.
  - [x] 3.3 Implement constructor: accepts `DestructionStage[]`, sets `currentIndex = 0`, `elapsed = 0`, `complete = false`, calls `stages[0].onStart()`.
  - [x] 3.4 Implement `update(dt)`: if complete, return. Advance elapsed, compute `progress = Math.min(elapsed / stage.duration, 1.0)`, call `stage.onUpdate(progress)`. If `progress >= 1.0`: call `stage.onEnd()`, advance index, reset elapsed. If index past end, set `complete = true`. Otherwise call next `stages[index].onStart()`.
  - [x] 3.5 Implement `getCurrentStage(): string` — returns current stage name (or empty if complete).
  - [x] 3.6 Implement `getProgress(): number` — returns current stage progress (0.0-1.0).

- [x] Task 4: Modify `Boss` base class at `src/entities/bosses/Boss.ts` (AC: #4)
  - [x] 4.1 Add `protected destructionSequence: DestructionSequence | null = null;` property.
  - [x] 4.2 Modify `update(dt)`: when `defeated === true` and `destructionSequence` exists and `!destructionSequence.complete`, call `destructionSequence.update(dt)`. When `destructionSequence.complete === true` and not yet signaled, emit `bossDestroyed` event and set a `destroyedEmitted` flag to prevent re-emission. Continue calling `syncCollider()` regardless.
  - [x] 4.3 Add `isDestructionComplete(): boolean` public method for external queries.

- [x] Task 5: Modify `GatekeeperBoss.onDefeated()` to create the destruction sequence (AC: #3, #5, #6, #7)
  - [x] 5.1 In `onDefeated()`, still emit `bossDefeated` event (existing behavior). Then create the `DestructionSequence` with three stages.
  - [x] 5.2 **Peel stage** definition:
    - `name: 'peel'`
    - `duration: BOSS_DESTRUCTION_PEEL_DURATION`
    - `onStart`: increase outer shell base rotation speed (store multiplied speed)
    - `onUpdate(progress)`: set `outerShell.scale.setScalar(1.0 + progress * (BOSS_DESTRUCTION_PEEL_SCALE_END - 1.0))`. Set `outerMaterial.opacity = 1.0 - progress`. Set `outerMaterial.transparent = true`. Set `outerMaterial.depthWrite = false`. Increase outer shell rotation: `outerShell.rotation.y -= BOSS_GATEKEEPER_ROTATION_SPEED * BOSS_DESTRUCTION_ROTATION_MULTIPLIER_PEEL * (1/60)` (approximate dt via fixed increment since onUpdate receives progress not dt — alternatively, store dt in the sequence). Emit `bossDestructionStage` event with `{stage: 'peel', progress}`.
    - `onEnd`: remove outer shell from `object3D`. Dispose `outerGeometry`, `outerBaseGeometry`, `outerMaterial`.
  - [x] 5.3 **Strip stage** definition:
    - `name: 'strip'`
    - `duration: BOSS_DESTRUCTION_STRIP_DURATION`
    - `onStart`: capture current mid material color HSL values for interpolation
    - `onUpdate(progress)`: set `midStructure.scale.setScalar(1.0 + progress * (BOSS_DESTRUCTION_STRIP_SCALE_END - 1.0))`. Set `midMaterial.opacity = 1.0 - progress`. Set `midMaterial.transparent = true`. Set `midMaterial.depthWrite = false`. Shift mid material lightness toward white: `midMaterial.color.setHSL(hue, saturation, baseLightness + progress * (1.0 - baseLightness))`. Increase rotation: `midStructure.rotation.x += BOSS_GATEKEEPER_ROTATION_SPEED * BOSS_DESTRUCTION_ROTATION_MULTIPLIER_STRIP * (1/60)`. Emit `bossDestructionStage` event with `{stage: 'strip', progress}`.
    - `onEnd`: remove mid structure from `object3D`. Dispose `midGeometry`, `midBaseGeometry`, `midMaterial`.
  - [x] 5.4 **Shatter stage** definition:
    - `name: 'shatter'`
    - `duration: BOSS_DESTRUCTION_SHATTER_DURATION`
    - `onStart`: set core material to pure white: `coreMaterial.color.setHSL(0, 0, 1.0)` — the only moment of pure white in the entire game (per narrative design). Set `coreMaterial.transparent = true`.
    - `onUpdate(progress)`: pulse core scale: `innerCore.scale.setScalar(1.0 + Math.sin(progress * BOSS_DESTRUCTION_SHATTER_PULSE_FREQUENCY * Math.PI) * (1.0 - progress))`. Fade opacity in final 50%: if `progress > 0.5`, `coreMaterial.opacity = 1.0 - ((progress - 0.5) * 2.0)`, else opacity stays 1.0. Set `coreMaterial.depthWrite = false`. Emit `bossDestructionStage` event with `{stage: 'shatter', progress}`.
    - `onEnd`: remove core from `object3D`. Dispose `coreGeometry`, `coreBaseGeometry`, `coreMaterial`. Emit final `bossDestructionStage` with `{stage: 'shatter', progress: 1.0}`.
  - [x] 5.5 Assign the created `DestructionSequence` to `this.destructionSequence`.
  - [x] 5.6 IMPORTANT: Since `onUpdate` receives progress (not dt), but the stage callbacks need to animate rotation, use a pattern where the `DestructionSequence.update(dt)` also passes `dt` to `onUpdate`. Modify the `DestructionStage` interface to include `onUpdate: (progress: number, dt: number) => void` so that rotation animation can use actual dt for smooth frame-rate-independent animation. Update `DestructionSequence` accordingly.

- [x] Task 6: Extend `EffectsManager` to handle boss destruction (AC: #9, #12)
  - [x] 6.1 Subscribe to `bossDestructionStage` event in `EffectsManager` constructor.
  - [x] 6.2 Track last explosion spawn time per stage to throttle explosion spawning (every ~0.5s during peel and strip).
  - [x] 6.3 On `bossDestructionStage` with `stage === 'peel'`: spawn 1 explosion at boss position (throttled).
  - [x] 6.4 On `bossDestructionStage` with `stage === 'strip'`: spawn 2 explosions at boss position (throttled).
  - [x] 6.5 On `bossDestructionStage` with `stage === 'shatter'` and `progress >= 1.0`: spawn `BOSS_DESTRUCTION_SHATTER_EXPLOSION_COUNT` explosions simultaneously at boss position with slight random offset.
  - [x] 6.6 Need boss position in the event — extend `BossDestructionStageEvent` to include `position: { x: number; y: number; z: number }`.
  - [x] 6.7 Subscribe to `bossDestructionStage` for screen shake: trigger `screenShake.shake()` at stage-appropriate intensities. This requires `EffectsManager` to have access to `ScreenShake` — either inject it via constructor or have `DamageEffectsManager` also subscribe to destruction events. **Preferred approach**: have `EffectsManager` accept an optional `ScreenShake` reference in its constructor and trigger shakes during destruction. Alternatively, emit a separate event that `DamageEffectsManager` can handle. Choose whichever avoids cross-system imports.

- [x] Task 7: Write unit tests (AC: #15, #16)
  - [x] 7.1 `src/__tests__/DestructionSequence.test.ts`:
    - Stage progression: stages advance in order
    - Callbacks fire at correct times: onStart on entry, onUpdate with progress 0-1, onEnd at completion
    - Progress calculation is correct (elapsed / duration, clamped to 1.0)
    - Completion flag set when all stages done
    - dt parameter passed to onUpdate
    - Single stage works correctly
    - Empty stages edge case (if applicable)
    - getCurrentStage() returns correct stage name
    - getProgress() returns correct value
    - update() after completion is a no-op
  - [x] 7.2 `src/__tests__/GatekeeperBossDestruction.test.ts`:
    - onDefeated creates a DestructionSequence with 3 stages
    - bossDefeated event still emitted on defeat
    - update() drives destruction sequence when defeated
    - Peel stage: outer shell scales up, opacity fades, geometry disposed at end
    - Strip stage: mid structure scales up, opacity fades, color shifts to white, geometry disposed
    - Shatter stage: core flashes white, pulses, opacity fades, geometry disposed
    - bossDestructionStage events emitted during each stage
    - bossDestroyed event emitted after sequence completes
    - Boss update is no-op after destruction complete and bossDestroyed emitted
  - [x] 7.3 `src/__tests__/BossDestructionConstants.test.ts`:
    - All BOSS_DESTRUCTION_* constants are defined
    - Constants have expected types (number)
    - Durations are positive
    - Total sequence duration is PEEL + STRIP + SHATTER = 5.5 seconds
  - [x] 7.4 `src/__tests__/BossDestructionEvents.test.ts`:
    - GameEvents interface includes bossDestructionStage
    - GameEvents interface includes bossDestroyed
    - Event payloads have correct shape
  - [x] 7.5 `src/__tests__/EffectsManager.test.ts` (extend existing):
    - EffectsManager subscribes to bossDestructionStage
    - Explosions spawned during destruction stages
    - Shatter spawns multiple simultaneous explosions
  - [x] 7.6 All existing tests continue to pass — zero regressions

- [x] Task 8: Integration verification (AC: #13, #14)
  - [x] 8.1 Verify `npm run build` produces zero TypeScript errors
  - [x] 8.2 Verify frame rate remains at 60 FPS during the destruction sequence
  - [x] 8.3 Verify the destruction sequence is visually spectacular: outer shell peels and expands, mid structure strips away turning white, inner core flashes pure white and shatters with cascading explosions

## Dev Notes

### Architecture Patterns and Constraints

- **DestructionSequence is the MANDATED architecture pattern.** Per `game-architecture.md` Implementation Patterns section: "Boss destruction is always a `DestructionSequence`. Never hardcode timed destruction logic in `update()` with elapsed-time counters. Stage definitions can be loaded from boss JSON configs for per-boss customization." The architecture provides the exact class interface to implement.
- **DestructionSequence is a standalone class, NOT a system.** It lives in `src/entities/bosses/` because it is owned by Boss entities. It does not subscribe to events or import systems. It is a pure animation timeline that fires callbacks. The callbacks (defined in `GatekeeperBoss`) handle the side effects (event emission, geometry disposal).
- **The Boss entity owns its DestructionSequence.** The boss creates it in `onDefeated()` and updates it in `update(dt)`. This keeps destruction logic co-located with the entity that has the geometry references.
- **Two distinct events: `bossDefeated` vs `bossDestroyed`.** `bossDefeated` fires when health reaches 0 (start of destruction). `bossDestroyed` fires when the destruction sequence animation completes (end of destruction, ~5.5 seconds later). External systems use `bossDefeated` for immediate reactions (stop weapon systems, score award) and `bossDestroyed` for phase transition (story 3-10 will use this).
- **Materials via VectorMaterials.create() ONLY.** The boss materials already exist from story 3-7. During destruction, only modify existing material properties (opacity, color, transparent, depthWrite). Do NOT create new materials.
- **Bloom layer stays enabled** on all geometry throughout destruction. The expanding/fading wireframes should glow as they peel away.
- **Geometry disposal is per-stage.** Dispose `EdgesGeometry`, the base `IcosahedronGeometry`, and the `LineBasicMaterial` when each layer is removed from the scene. This frees GPU memory progressively.
- **Entities never import systems.** The `GatekeeperBoss` destruction callbacks emit events on `eventBus`. The `EffectsManager` subscribes to those events to spawn explosions. No direct coupling.
- **Systems never import each other.** `EffectsManager` handles destruction explosions. If screen shake is needed during destruction, either inject `ScreenShake` into `EffectsManager` at construction, or have a separate subscriber. Do NOT import `DamageEffectsManager` from `EffectsManager`.
- **Pre-allocate ALL temp objects.** Any temporary `Vector3` or color values needed in callbacks should be pre-allocated as class properties on `GatekeeperBoss`. Zero per-frame allocation.
- **No `fetch()` or `await` in update().** All destruction parameters are compile-time constants.
- **Logger, not console.log.** Use `Logger.info('Boss', ...)` for destruction milestones, `Logger.debug` for per-frame updates.

### Narrative Design Critical Detail

- **Boss destruction produces a unique color event: the boss's color signature flares WHITE and then scatters.** This is explicitly called out in the narrative design document as "a visual exclamation point" and "the ONLY time pure white appears in the game." The shatter stage MUST set the core material to pure white `color.setHSL(0, 0, 1.0)` before the final explosion. This is not just a nice-to-have — it is a deliberate narrative/visual design decision that distinguishes boss kills from all other destruction effects.
- **Boss destruction audio (future):** The GDD specifies "multi-stage collapse, building crescendo" for boss destruction sound. Audio is NOT implemented in this story (Epic 4 handles audio), but the `bossDestructionStage` event with stage name and progress provides the hooks that `AudioManager` will subscribe to in the future.

### Relationship to Other Stories

- **Story 3-7 (Gatekeeper Boss Encounter):** DONE. Created the `Boss` base class, `GatekeeperBoss` with three geometry layers (outer shell, mid structure, inner core), attack phases, vulnerability windows, and `onDefeated()` that emits `bossDefeated`. This story extends that `onDefeated()` to also create the `DestructionSequence`, and modifies `Boss.update()` to drive the sequence when defeated.
- **Story 3-8 (Virus Payload Weapon):** DONE. Added the Virus Payload weapon that delivers massive damage during boss vulnerability windows. The `virusPayloadDelivered` event exists for future narrative triggers. The weapon remains functional — this story only adds what happens AFTER the boss health reaches 0.
- **Story 3-10 (Phase Transitions):** NEXT. Will wire the `bossDestroyed` event (emitted at the END of destruction, not at health=0) into the phase transition system. This story provides the clean separation: `bossDefeated` = health reached 0, destruction begins; `bossDestroyed` = destruction animation complete, safe to transition.
- **Story 2-4 (Vector Shard Explosions):** DONE. Created `VectorShardExplosion` and `EffectsManager` with pre-allocated pool. This story reuses that pool to spawn explosions during destruction stages. The pool of 12 explosions (`MAX_ACTIVE_EXPLOSIONS`) should be sufficient for the cascading destruction effects.
- **Story 2-7 (Screen Shake and Damage Flash):** DONE. Created `DamageEffectsManager` and `ScreenShake`. This story adds screen shake during destruction stages for visceral impact.

### Boss Destruction Timing Budget

- **Peel:** 2.0 seconds — outer shell expands and fades, scattered shard explosions
- **Strip:** 1.5 seconds — mid structure expands with color shift toward white, more explosions
- **Shatter:** 2.0 seconds — core flashes pure white, pulses rapidly, fades with cascading explosions
- **Total:** 5.5 seconds — long enough to be spectacular, short enough to not bore the player
- Per GDD: boss arena orbit continues during destruction, player watches the spectacle

### GatekeeperBoss Geometry Layer Access

The `GatekeeperBoss` already stores private references to all three geometry layers and their materials:
- `outerShell: THREE.Object3D` + `outerMaterial: THREE.LineBasicMaterial` + `outerGeometry: THREE.EdgesGeometry` + `outerBaseGeometry: THREE.IcosahedronGeometry`
- `midStructure: THREE.Object3D` + `midMaterial: THREE.LineBasicMaterial` + `midGeometry: THREE.EdgesGeometry` + `midBaseGeometry: THREE.IcosahedronGeometry`
- `innerCore: THREE.Object3D` + `coreMaterial: THREE.LineBasicMaterial` + `coreGeometry: THREE.EdgesGeometry` + `coreBaseGeometry: THREE.IcosahedronGeometry`

The destruction stage callbacks defined in `onDefeated()` have closure access to all these private members. No accessor changes needed for the destruction logic itself.

### DestructionSequence onUpdate Signature

The architecture defines `onUpdate: (progress: number) => void`. However, destruction animation needs `dt` for frame-rate-independent rotation. Two options:
1. **Extend the interface** to `onUpdate: (progress: number, dt: number) => void` — slightly deviates from architecture but practical.
2. **Compute dt from progress delta** — `dt ≈ progressDelta * duration`. More complex.

**Recommended: Option 1.** Extend the interface to pass `dt` alongside progress. The architecture pattern is a guideline, not a rigid constraint, and `dt` is essential for smooth animation. The `DestructionSequence.update(dt)` already receives `dt` and can trivially pass it through.

### Source Tree Components to Touch

| Action | File | Reason |
|--------|------|--------|
| MODIFY | `src/config/constants.ts` | Add BOSS_DESTRUCTION_* constants |
| MODIFY | `src/core/GameEvents.ts` | Add bossDestructionStage and bossDestroyed events |
| CREATE | `src/entities/bosses/DestructionSequence.ts` | Destruction sequence timeline class |
| MODIFY | `src/entities/bosses/Boss.ts` | Add destructionSequence property, modify update() |
| MODIFY | `src/entities/bosses/GatekeeperBoss.ts` | Modify onDefeated() to create destruction sequence |
| MODIFY | `src/systems/EffectsManager.ts` | Subscribe to bossDestructionStage for explosions and shake |
| CREATE | `src/__tests__/DestructionSequence.test.ts` | DestructionSequence class tests |
| CREATE | `src/__tests__/GatekeeperBossDestruction.test.ts` | Boss destruction integration tests |
| CREATE | `src/__tests__/BossDestructionConstants.test.ts` | Constants validation tests |
| CREATE | `src/__tests__/BossDestructionEvents.test.ts` | Event type tests |
| MODIFY | `src/__tests__/EffectsManager.test.ts` | Add destruction explosion tests |

### Project Structure Notes

- `src/entities/bosses/DestructionSequence.ts` is in the bosses directory because the architecture lists it as a component of the Boss Destruction Choreography pattern. It is owned and used exclusively by boss entities.
- No new directories needed. All files go into existing directories.
- The `DestructionSequence` class is reusable for all three bosses (Gatekeeper, Avenger, Core Intelligence). Each boss will define its own stage array with boss-specific geometry and timing. The class itself is generic.

### References

- [Source: _bmad-output/game-architecture.md#Implementation Patterns > Boss Destruction Choreography] Full class design: DestructionSequence with DestructionStage interface, sequenced stages with onStart/onUpdate/onEnd callbacks
- [Source: _bmad-output/game-architecture.md#Implementation Patterns > Boss Destruction Choreography] "Boss destruction is always a DestructionSequence. Never hardcode timed destruction logic in update() with elapsed-time counters."
- [Source: _bmad-output/game-architecture.md#Core Systems] "Boss Encounter System — 3 unique bosses, multi-stage destruction (peel → strip → shatter), vulnerability windows, dialogue triggers"
- [Source: _bmad-output/game-architecture.md#Novel Concepts] "Boss destruction choreography — multi-stage peel → strip → shatter animation system"
- [Source: _bmad-output/game-architecture.md#Consistency Rules] "Destruction: DestructionSequence timeline — No manual elapsed-time counters for choreography"
- [Source: _bmad-output/gdd.md#Boss Destruction Sequence] "Multi-stage — layers strip down to bare wireframe, then the entire construct fragments and shatters into vector shards cascading outward. Peel → strip → shatter gives weight and spectacle to the victory moment."
- [Source: _bmad-output/gdd.md#Visual Effects] "Vector shard explosions: Enemies fragment into scattering vector line shards on destruction. Consistent visual language from small enemy kills to climactic boss destruction."
- [Source: _bmad-output/gdd.md#Visual Effects] "Boss destruction sequence: Multi-stage — layers peel down to bare wireframe, then the entire construct shatters into cascading vector shards."
- [Source: _bmad-output/narrative-design.md#Visual Storytelling] "Boss destruction produces a unique color event — the boss's color signature flares white and then scatters. A visual exclamation point. The only time pure white appears in the game."
- [Source: _bmad-output/narrative-design.md#Audio Storytelling] "Vector shard scatter: Boss kills are cascading, multi-stage audio events."
- [Source: _bmad-output/epics.md#Epic 3 Story 9] "As a player, I can see the boss destruction sequence (peel → strip → shatter) so that victory is visually spectacular"
- [Source: _bmad-output/project-context.md#Critical Implementation Rules] Materials via VectorMaterials.create() only, bloom layer on all geometry, entities never import systems, systems never import each other, EventBus communication, ObjectPool for dynamic entities

### Technical Research Notes (Three.js r183)

- **LineBasicMaterial opacity animation:** Set `material.transparent = true` and animate `material.opacity` from 1.0 to 0.0. Set `material.depthWrite = false` when transparent to avoid z-buffer artifacts with other transparent objects. Restore when done (or dispose the material entirely, as in destruction).
- **Object3D.scale.setScalar():** Applies uniform scale to all children. Safe to call every frame. Used for the expanding shell/structure effect during peel and strip stages.
- **Material.color.setHSL():** Sets color using HSL values. Shifting lightness toward 1.0 produces the white flare effect. This is the correct Three.js r183 API for color manipulation.
- **Geometry disposal:** Call `geometry.dispose()` and `material.dispose()` when removing objects permanently. Remove from parent with `parent.remove(child)`. This frees GPU memory. Safe to call during the animation loop.
- **Object3D.remove():** Removes a child from the parent's children array. The child is no longer rendered. Must also dispose geometry and materials separately — `remove()` does not dispose resources.
- **Performance:** Animating 3 LineSegments with opacity/scale/rotation changes is negligible overhead. The VectorShardExplosion pool is the main performance consideration — the existing pool of 12 with round-robin reuse handles the cascading explosions cleanly.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Build error: removed unused `tempColor` field from GatekeeperBoss (TS6133)

### Completion Notes List

- Implemented `DestructionSequence` class following the architecture-mandated "Boss Destruction Choreography" pattern with sequential stage progression, callbacks, and dt passthrough.
- Extended `DestructionStage.onUpdate` signature to `(progress: number, dt: number) => void` for frame-rate-independent rotation animation during destruction stages.
- Modified `Boss.update()` to drive destruction sequence when defeated, emit `bossDestroyed` on completion with re-emission guard.
- Built three destruction stages in `GatekeeperBoss.onDefeated()`: peel (outer shell expands/fades/rotates 3x), strip (mid structure expands/fades/whitens/rotates 5x), shatter (core flashes pure white/pulses/fades).
- The shatter stage sets `coreMaterial.color.setHSL(0, 0, 1.0)` -- the ONLY moment of pure white in the game per narrative design.
- Extended `BossDestructionStageEvent` to include `position` field to support EffectsManager explosion spawning.
- `EffectsManager` now accepts optional `ScreenShake` via constructor, subscribes to `bossDestructionStage` for throttled explosion spawning and stage-proportional screen shake.
- All 1165 tests pass (94 files), zero regressions. `npm run build` produces zero TS errors.

### File List

- CREATE: `src/entities/bosses/DestructionSequence.ts`
- MODIFY: `src/config/constants.ts`
- MODIFY: `src/core/GameEvents.ts`
- MODIFY: `src/entities/bosses/Boss.ts`
- MODIFY: `src/entities/bosses/GatekeeperBoss.ts`
- MODIFY: `src/systems/EffectsManager.ts`
- CREATE: `src/__tests__/DestructionSequence.test.ts`
- CREATE: `src/__tests__/GatekeeperBossDestruction.test.ts`
- CREATE: `src/__tests__/BossDestructionConstants.test.ts`
- CREATE: `src/__tests__/BossDestructionEvents.test.ts`

### Change Log

- 2026-03-26: Story 3-9 implemented. Added boss destruction sequence with peel/strip/shatter stages, DestructionSequence timeline class, new game events (bossDestructionStage, bossDestroyed), destruction constants, EffectsManager integration for explosions and screen shake. 94 test files, 1165 tests pass.
