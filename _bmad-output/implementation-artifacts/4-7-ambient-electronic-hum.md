# Story 4.7: Ambient Electronic Hum

Status: review

## Story

As a player,
I want to hear ambient electronic hum that intensifies with action,
so that cyberspace has an audio atmosphere.

## Acceptance Criteria

1. An `AmbientHumGenerator` class exists at `src/audio/AmbientHumGenerator.ts` that procedurally generates an intensity-reactive ambient electronic hum using the Web Audio API (`OscillatorNode`, `GainNode`, `BiquadFilterNode`). Unlike SFXGenerator (which renders offline buffers), this uses a **live AudioContext** (from `THREE.AudioListener.context`) because the hum must respond to intensity changes in real time.

2. The hum is composed of layered oscillators to produce a rich, electronic drone:
   - **Base drone**: Low sine oscillator at ~60Hz (electrical mains hum frequency), volume 0.15. Always present. This is the heartbeat of cyberspace.
   - **Harmonic layer**: Sine oscillator at ~120Hz (first harmonic), volume 0.08. Adds warmth.
   - **Upper harmonic**: Triangle wave at ~180Hz (second harmonic), volume 0.04. Adds subtle texture.
   - **High shimmer**: Sawtooth oscillator at ~440Hz through a lowpass filter (cutoff 600Hz, Q=1), volume 0.02. Adds electronic character. This layer fades in only at higher intensity levels.
   All oscillators connect through individual GainNodes, then to a master GainNode that controls overall ambient volume, and finally to `ctx.destination`.

3. An `setIntensity(level: number)` method accepts a 0.0-1.0 value and smoothly adjusts the hum character:
   - **0.0 (idle/menu)**: Only base drone audible. Filter cutoffs low. Minimal presence.
   - **0.3 (exploration/dogfight start)**: Base + harmonic layers active. Gentle background ambience.
   - **0.6 (active combat)**: All layers active. Filter opens up. Noticeable electronic atmosphere.
   - **1.0 (boss fight / maximum intensity)**: Full volume, all layers. Filter fully open. High shimmer prominent. Slight detuning (+/- 2Hz on harmonics) for tension.
   Transitions use `linearRampToValueAtTime` over 2 seconds for smooth crossfades. The method is idempotent — calling with the same value is a no-op.

4. The `AmbientHumGenerator` provides:
   - `start()` — Begins playback. Creates oscillators and connects the audio graph. Idempotent (no-op if already playing).
   - `stop()` — Stops playback. Disconnects and cleans up all nodes. Idempotent.
   - `setIntensity(level: number)` — Adjusts hum character in real time (0.0-1.0).
   - `setVolume(volume: number)` — Sets the master gain (0.0-1.0), respecting AudioManager's ambient channel volume.
   - `dispose()` — Stops and releases all resources.
   - `isPlaying(): boolean` — Returns current playback state.

5. `AmbientHumGenerator` integrates with `AudioManager` via a new `registerAmbientGenerator(generator: AmbientHumGenerator)` method. AudioManager stores the reference and provides the `AudioContext` from `THREE.AudioListener.context` when the generator calls `start()`. The generator connects its output to `AudioManager`'s ambient channel gain node rather than directly to `ctx.destination`, so that channel volume and master volume controls apply.

6. Integration approach: `AmbientHumGenerator` receives the raw `AudioContext` and a `GainNode` (the ambient channel's output node) in its constructor. It manages its own oscillator graph internally. This keeps it decoupled from THREE.Audio instances while still routing through the AudioManager volume chain.

7. Intensity is driven by EventBus subscriptions in `AudioManager.init()`:
   - `phaseStart` -> set intensity based on phase type:
     - `'tutorial'` -> 0.1
     - `'briefing'` -> 0.15
     - `'dogfight'` -> 0.4
     - `'surface'` -> 0.5
     - `'corridor'` -> 0.6
     - `'boss'` -> 0.8
   - `playerHit` -> temporarily spike intensity to current + 0.2 (clamped to 1.0) for 1 second, then return to phase baseline.
   - `bossHealthChanged` -> if boss health < 50%, increase intensity to 0.9. If < 25%, increase to 1.0.
   These subscriptions are added alongside the existing event subscriptions in `AudioManager.init()` and cleaned up in `dispose()`.

8. The hum starts automatically when `AudioManager.init()` is called (after AudioContext is created), at intensity 0.0. It begins playing once the browser AudioContext is unlocked (first user interaction). The existing `unlockHandler` in AudioManager triggers `ambientGenerator.start()` if registered.

9. The manifest entry `"ambient_hum"` at `public/audio/manifest.json` is preserved unchanged. If an actual `ambient_hum.ogg` file is loaded, the file-based ambient plays instead (existing `playAmbient('ambient_hum')` path). The procedural generator is the fallback when no file exists. This preserves Story 4-8's swappable architecture.

10. Running `npm run build` produces a clean production build with zero TypeScript errors.

11. Unit tests exist (Vitest) for:
    - `AmbientHumGenerator` — start creates oscillators, stop disconnects them, setIntensity adjusts gain values, setVolume changes master gain, dispose cleans up, isPlaying returns correct state, setIntensity is idempotent for same value, intensity clamps to 0-1 range.
    - `AudioManager` integration — registerAmbientGenerator stores reference, ambient generator receives AudioContext, phaseStart events set intensity based on phase type, playerHit temporarily spikes intensity, bossHealthChanged adjusts intensity at thresholds, dispose cleans up ambient generator.

12. All existing tests continue to pass — zero regressions. Current test count: 1431 tests across 110 files.

## Tasks / Subtasks

- [x] Task 1: Create AmbientHumGenerator class (AC: #1, #2, #3, #4)
  - [x] 1.1 Create `src/audio/AmbientHumGenerator.ts`. Define the class with properties for AudioContext, output GainNode, oscillator nodes, gain nodes, filter nodes, playing state, and current intensity.
  - [x] 1.2 Constructor accepts `(ctx: AudioContext, outputNode: GainNode)`. Stores references. Does NOT create oscillators yet (deferred to `start()`).
  - [x] 1.3 Implement `start()`: Create 4 oscillators (60Hz sine, 120Hz sine, 180Hz triangle, 440Hz sawtooth), their individual GainNodes, a lowpass filter for the shimmer layer (cutoff 600Hz), and a master GainNode. Connect: each osc -> individual gain -> master gain -> outputNode. Set initial gains to idle (intensity 0.0). Start all oscillators. Set `playing = true`. Idempotent guard.
  - [x] 1.4 Implement `stop()`: Stop and disconnect all oscillators and nodes. Set `playing = false`. Null out references. Idempotent guard.
  - [x] 1.5 Implement `setIntensity(level: number)`: Clamp to 0-1. Skip if same as current (within epsilon 0.01). Use `currentTime` + 2s ramp via `linearRampToValueAtTime` on each layer's GainNode. Base: 0.15 * level (minimum 0.02 when level > 0). Harmonic: 0.08 * level. Upper: 0.04 * level. Shimmer: 0.02 * max(0, level - 0.4) / 0.6. At intensity >= 0.8, apply slight detuning on harmonics.
  - [x] 1.6 Implement `setVolume(volume: number)`: Set master GainNode value. Clamp 0-1.
  - [x] 1.7 Implement `dispose()`: Call `stop()`. Clear all references.
  - [x] 1.8 Implement `isPlaying(): boolean`.

- [x] Task 2: Integrate AmbientHumGenerator into AudioManager (AC: #5, #6, #7, #8)
  - [x] 2.1 Add `private ambientGenerator: AmbientHumGenerator | null = null` field to AudioManager.
  - [x] 2.2 Add `registerAmbientGenerator(generator: AmbientHumGenerator): void` method.
  - [x] 2.3 Add `private ambientIntensityBaseline: number = 0` and `private ambientIntensityTimeout: ReturnType<typeof setTimeout> | null = null` for tracking phase baseline and temporary spikes.
  - [x] 2.4 Modify `init()`: After creating channels and before EventBus subscriptions, store `this.listener.context` for later use. In the existing `phaseStart` callback, add intensity setting based on phase type. Add new `bossHealthChanged` subscription with intensity thresholds.
  - [x] 2.5 Modify existing `onPlayerHit` callback: After calling `playSFX('shield_hit')`, if ambientGenerator exists, spike intensity temporarily (current + 0.2, clamped to 1.0), then reset to baseline after 1 second using setTimeout.
  - [x] 2.6 Modify existing `unlockHandler`: After resuming AudioContext, call `ambientGenerator.start()` if registered.
  - [x] 2.7 Modify `dispose()`: Call `ambientGenerator.dispose()`, set to null, clear any intensity timeout.

- [x] Task 3: Initialize AmbientHumGenerator in main.ts (AC: #6, #8)
  - [x] 3.1 Import `AmbientHumGenerator` in main.ts.
  - [x] 3.2 After AudioManager init and SFXGenerator setup, create the ambient generator. Need to access the AudioContext from the listener and the ambient channel's output. Add a `getAudioContext()` method and `getAmbientOutputNode()` method to AudioManager to expose these.
  - [x] 3.3 Call `audioManager.registerAmbientGenerator(ambientGenerator)`.

- [x] Task 4: Write tests (AC: #11, #12)
  - [x] 4.1 Create `src/__tests__/AmbientHumGenerator.test.ts`. Mock AudioContext with `createOscillator()`, `createGain()`, `createBiquadFilter()` returning mock nodes. Test: start creates oscillators, stop disconnects, setIntensity adjusts gains, setVolume changes master gain, dispose cleans up, isPlaying returns state, idempotent calls, clamping.
  - [x] 4.2 Add integration tests to `src/__tests__/AudioManager.test.ts` for: registerAmbientGenerator stores reference, phaseStart sets intensity by phase type, playerHit spikes intensity temporarily, bossHealthChanged adjusts intensity at thresholds, dispose cleans up ambient generator.
  - [x] 4.3 Run full test suite — all existing 1431 tests + new tests pass.

- [x] Task 5: Build verification (AC: #10, #12)
  - [x] 5.1 Run `npx tsc --noEmit` — zero TypeScript errors.
  - [x] 5.2 Run `npm run test` — all tests pass.

## Dev Notes

### Architecture Compliance

- **AmbientHumGenerator in `src/audio/`** — same directory as AudioManager, AudioChannel, SFXGenerator. [Source: game-architecture.md#Directory Structure]
- **Live AudioContext synthesis** — unlike SFXGenerator (offline rendering), the ambient hum uses the live AudioContext because it must respond to intensity changes in real time. This is the correct approach for continuous, reactive audio. [Source: gdd.md#Audio Architecture: "AmbientPlayer (Electronic hum, intensity-reactive)"]
- **EventBus integration** — new subscriptions follow existing pattern. Intensity changes driven by phase/combat events. Systems never import AudioManager directly. [Source: game-architecture.md#Architectural Boundaries]
- **Fallback chain preserves swappability** — procedural hum is the default. If `ambient_hum.ogg` file exists, the file-based approach is used instead. This preserves Story 4-8's swappable audio architecture. [Source: game-architecture.md#Audio Manager]

### Critical Implementation Rules

- **Use `Logger.info('Audio', message, context)` / `Logger.warn(...)`** for all logging. NEVER `console.log()`. [Source: project-context.md#Critical Don't-Miss Rules]
- **No `fetch()` during gameplay frames**: Hum starts at init time. All oscillator setup happens in `start()`, triggered by AudioContext unlock (first user interaction). [Source: project-context.md#Performance Rules]
- **Systems never import each other**: AudioManager subscribes to EventBus events. AmbientHumGenerator is a utility, not a system — it's injected into AudioManager via `registerAmbientGenerator()`. Same pattern as SFXGenerator. [Source: project-context.md#Architecture Rules]
- **`erasableSyntaxOnly: true`** in tsconfig: Do NOT use `enum`. Use `type` unions and `as const` objects. [Source: tsconfig.json]
- **`verbatimModuleSyntax: true`**: Use `import type { ... }` for type-only imports. [Source: tsconfig.json]
- **Event names are `camelCase`**: `phaseStart`, `playerHit`, `bossHealthChanged`. [Source: game-architecture.md#Event System]

### Existing Code Patterns to Follow

- **AudioManager singleton pattern**: `export const audioManager = new AudioManager()` in AudioManager.ts. DO NOT create a new instance.
- **EventBus subscription pattern**: Subscribe in `init()`, unsubscribe in `dispose()`. Follow existing `onWeaponFired`, `onPlayerHit`, `onBossDestroyed` pattern with callback refs.
- **SFXGenerator integration pattern**: `registerGenerator(generator)` stores reference. Same pattern for `registerAmbientGenerator(generator)`.
- **Test patterns**: Follow `AudioManager.test.ts` structure. Mock Web Audio API objects. Use `vi.fn()` for callbacks. Use `vi.hoisted()` for mock variables used in `vi.mock()` factories.
- **TypeScript strict mode**: No unused variables, no implicit any, no enum keyword.

### What Already Exists (DO NOT recreate)

- `src/audio/AudioManager.ts` — Singleton with 4 channels, manifest loading, EventBus subscriptions. MODIFY to add ambient generator integration and intensity-driven subscriptions.
- `src/audio/AudioChannel.ts` — Channel class with ambient channel that loops by default. DO NOT MODIFY.
- `src/audio/SFXGenerator.ts` — Procedural SFX generator. DO NOT MODIFY. Reference pattern for generator integration.
- `src/audio/SoundManifest.ts` — Type definitions. DO NOT MODIFY.
- `public/audio/manifest.json` — Contains `ambient_hum` entry. DO NOT MODIFY.
- `src/core/GameEvents.ts` — Events: `phaseStart`, `playerHit`, `bossHealthChanged` all already defined with typed payloads. DO NOT MODIFY.
- `src/main.ts` — Already initializes audioManager and sfxGenerator. MODIFY to add AmbientHumGenerator init.

### What Must Be Created

- `src/audio/AmbientHumGenerator.ts` — Live procedural ambient electronic hum generator using Web Audio API oscillators with intensity-reactive behavior.

### What Must Be Modified

- `src/audio/AudioManager.ts` — Add `registerAmbientGenerator()` method, add `getAudioContext()` and `getAmbientOutputNode()` accessors, modify event subscriptions for intensity control, modify unlock handler to start ambient, modify dispose for cleanup.
- `src/main.ts` — Add AmbientHumGenerator import, creation, and registration.

### Web Audio API Live Synthesis Patterns

- **OscillatorNode**: Created from `ctx.createOscillator()`. Set `.type` ('sine', 'triangle', 'sawtooth') and `.frequency.value`. Call `.start(0)` to begin, `.stop()` to end (once stopped, cannot restart — must create new nodes).
- **GainNode**: Created from `ctx.createGain()`. `.gain.value` controls volume. Use `.gain.setValueAtTime(value, time)` and `.gain.linearRampToValueAtTime(value, time)` for smooth transitions.
- **BiquadFilterNode**: `.type = 'lowpass'`, `.frequency.value` for cutoff, `.Q.value` for resonance.
- **AudioContext.currentTime**: The current audio clock time in seconds. All scheduled parameter changes reference this.
- **Smooth transitions**: `param.linearRampToValueAtTime(targetValue, ctx.currentTime + duration)` — ramps linearly over `duration` seconds.
- **Node cleanup**: Stopped oscillators cannot be restarted. On `stop()`, disconnect all nodes and null references. On `start()`, create fresh nodes.
- **Browser autoplay policy**: AudioContext starts suspended. Must call `ctx.resume()` after user interaction. AudioManager already handles this via `unlockHandler`.

### Sound Design Reference

From GDD Sound Design table:
| Sound | Feel | Approach |
|-------|------|----------|
| Ambient hum | Persistent, intensity-reactive | Web Audio API oscillators |

From GDD Music Style:
> "Ambient electronic hum — the base soundtrack is a persistent electronic hum that intensifies with gameplay action. No full composed soundtrack in MVP. The hum IS cyberspace — atmospheric, immersive, and achievable without music production skills."

From narrative design:
> "The ambient electronic hum of cyberspace is ever-present and intensifies with the action."

### Previous Story Intelligence

From Story 4-6 (Retro SFX for Weapons and Actions):
- SFXGenerator uses `OfflineAudioContext` for offline rendering. Ambient hum needs LIVE `AudioContext` instead — different approach.
- AudioManager's `registerGenerator()` pattern works well. Follow same pattern for `registerAmbientGenerator()`.
- Test count after Story 4-6: 1431 tests across 110 files. All must still pass.
- Mock pattern: Use `vi.hoisted()` for mock variables used in `vi.mock()` factories.
- AudioManager test uses `// @vitest-environment jsdom` directive.
- AudioChannel ambient type defaults to looping (`playGeneric` sets `loop ?? (this.type === 'ambient')`). The procedural generator bypasses AudioChannel entirely — it connects directly to the audio graph.

### Scope Boundaries

**IN scope**: AmbientHumGenerator class with layered oscillator synthesis, intensity-reactive behavior, AudioManager integration (registerAmbientGenerator + event-driven intensity + unlock trigger), main.ts integration, tests.

**NOT in scope** (future stories):
- Swappable audio asset hot-reload — Story 4-8
- Synthesized handler voice lines — Story 4-9
- Actual .ogg ambient audio file — can be added later, generator provides fallback
- Volume settings UI or persistence — Story 6-7
- Outro music — Story 5-10

### Project Structure Notes

- All new files align with the architecture's directory structure.
- `AmbientHumGenerator.ts` at `src/audio/AmbientHumGenerator.ts` — alongside AudioManager, AudioChannel, SFXGenerator.
- No new directories needed.
- No new dependencies needed — Web Audio API is browser-native.

### Testing Notes

- Mock `AudioContext` with `createOscillator()`, `createGain()`, `createBiquadFilter()` returning mock nodes.
- Mock nodes need: `.connect()`, `.disconnect()`, `.start()`, `.stop()`, `.frequency` (with `.setValueAtTime`, `.linearRampToValueAtTime`), `.gain` (same param methods), `.type`, `.Q` (same param methods).
- For `GainNode` mock, expose `.gain.value` as readable property to verify volume changes.
- For AudioManager integration tests, mock the AmbientHumGenerator with `setIntensity`, `start`, `stop`, `dispose`, `isPlaying` as vi.fn().
- DO NOT use `// @vitest-environment jsdom` for AmbientHumGenerator standalone tests — standard node environment with mocked AudioContext is sufficient.
- AudioManager tests already use jsdom environment — extend existing test file for new integration tests.

### References

- [Source: gdd.md#Music Style] — "Ambient electronic hum — persistent, intensifies with gameplay action"
- [Source: gdd.md#Sound Design] — "Ambient hum: Cyberspace atmosphere, Persistent, intensity-reactive, Web Audio API oscillators"
- [Source: gdd.md#Audio Architecture] — "AmbientPlayer (Electronic hum, intensity-reactive)"
- [Source: game-architecture.md#Audio Manager] — 4-channel architecture, ambient channel
- [Source: game-architecture.md#Event System] — phaseStart, playerHit, bossHealthChanged events
- [Source: game-architecture.md#Architectural Boundaries] — Systems never import each other
- [Source: game-architecture.md#Directory Structure] — src/audio/ for audio system files
- [Source: narrative-design.md#Atmosphere] — "The ambient electronic hum of cyberspace is ever-present and intensifies with the action"
- [Source: project-context.md#Technology Stack] — THREE.Audio (Web Audio API)
- [Source: project-context.md#Critical Implementation Rules] — Logger, EventBus patterns
- [Source: epics.md#Epic 4, Story 7] — "ambient electronic hum that intensifies with action"

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- AmbientHumGenerator uses live AudioContext (not OfflineAudioContext) because the hum must respond to intensity changes in real time. Four oscillator layers create a rich electronic drone: 60Hz sine (base), 120Hz sine (harmonic), 180Hz triangle (upper harmonic), 440Hz sawtooth through lowpass filter (shimmer).
- Intensity control uses `linearRampToValueAtTime` with 2-second ramp duration for smooth crossfades. Each layer has independent volume scaling: base scales at 0.15x, harmonic at 0.08x, upper at 0.04x, shimmer fades in only above 0.4 intensity.
- At intensity >= 0.8, harmonic oscillators receive slight detuning (+/- 2Hz) for tension. The detuning amount scales linearly from 0 to 2Hz between intensity 0.8 and 1.0.
- AudioManager integrates the ambient generator via `registerAmbientGenerator()` following the same pattern as `registerGenerator()` for SFX. The generator connects to an ambient output GainNode that routes through the AudioManager's volume chain.
- Phase-based intensity is driven by a PHASE_INTENSITY_MAP lookup: tutorial=0.1, briefing=0.15, dogfight=0.4, surface=0.5, corridor=0.6, boss=0.8. The playerHit event spikes intensity by +0.2 (clamped to 1.0) for 1 second before returning to baseline.
- Boss health thresholds override phase intensity: <50% health sets 0.9, <25% health sets 1.0. These thresholds are checked via the existing `bossHealthChanged` EventBus event.
- The ambient generator starts on first user interaction via the existing `unlockHandler` in AudioManager, ensuring browser AudioContext autoplay policy is respected.

### Completion Notes List

- Task 1: Created `src/audio/AmbientHumGenerator.ts` with 4-layer procedural ambient electronic hum. Layers: 60Hz sine base drone, 120Hz sine harmonic, 180Hz triangle upper harmonic, 440Hz sawtooth shimmer through lowpass filter. Supports real-time intensity control (0.0-1.0) with 2s smooth crossfades, volume control, start/stop/dispose lifecycle, and detuning at high intensity for tension.
- Task 2: Modified `src/audio/AudioManager.ts` -- added `registerAmbientGenerator()` method, `getAudioContext()` and `getAmbientOutputNode()` accessors, phase-based intensity via PHASE_INTENSITY_MAP in phaseStart callback, playerHit intensity spike (+0.2 for 1s), bossHealthChanged intensity thresholds (<50% -> 0.9, <25% -> 1.0), ambient generator start in unlockHandler, dispose cleanup with timeout clearing.
- Task 3: Modified `src/main.ts` -- added AmbientHumGenerator import, creation with AudioContext and ambient output node, and registration with AudioManager.
- Task 4: Created `src/__tests__/AmbientHumGenerator.test.ts` with 28 tests covering start/stop/dispose lifecycle, setIntensity gain calculations, detuning, idempotency, clamping, and full intensity range. Added 22 new tests to `src/__tests__/AudioManager.test.ts` covering registerAmbientGenerator, phase intensity mapping (all 6 phases), playerHit spike and clamp, bossHealthChanged thresholds, dispose cleanup, getAudioContext, getAmbientOutputNode, and unlock handler integration.
- Task 5: `npx tsc --noEmit` passes clean. Full test suite: 1481 tests across 111 files, all pass, zero regressions.

### Change Log

- 2026-03-26: Story 4-7 implemented -- Ambient Electronic Hum. Created AmbientHumGenerator with 4-layer procedural ambient hum using live Web Audio API oscillators with intensity-reactive behavior. Integrated with AudioManager via registerAmbientGenerator/event-driven intensity control. Added bossHealthChanged EventBus subscription. Added 50 new tests (28 AmbientHumGenerator + 22 AudioManager integration).

### File List

- `src/audio/AmbientHumGenerator.ts` -- New: Procedural ambient electronic hum generator with 4 oscillator layers, intensity-reactive behavior, and live Web Audio API synthesis
- `src/audio/AudioManager.ts` -- Modified: added registerAmbientGenerator(), getAudioContext(), getAmbientOutputNode(), phase-based intensity in phaseStart, playerHit intensity spike, bossHealthChanged intensity thresholds, ambient generator start in unlockHandler, dispose cleanup
- `src/main.ts` -- Modified: added AmbientHumGenerator import, creation, and registration with AudioManager
- `src/__tests__/AmbientHumGenerator.test.ts` -- New: 28 tests for procedural ambient hum generation, intensity control, lifecycle, and edge cases
- `src/__tests__/AudioManager.test.ts` -- Modified: added 22 tests for ambient generator integration, phase intensity, playerHit spike, bossHealthChanged thresholds, and dispose cleanup
