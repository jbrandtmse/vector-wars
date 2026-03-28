# Story 4.6: Retro SFX for Weapons and Actions

Status: review

## Story

As a player,
I want to hear satisfying retro SFX for all weapons and actions,
so that every interaction has audio feedback.

## Acceptance Criteria

1. A `SFXGenerator` class exists at `src/audio/SFXGenerator.ts` that procedurally generates retro arcade sound effects using the Web Audio API (`OscillatorNode`, `GainNode`, `BiquadFilterNode`). Each sound is synthesized at runtime and returned as an `AudioBuffer`. The class provides a method `generate(id: string): AudioBuffer` that produces a cached buffer for each registered sound ID. Buffers are generated once and reused.

2. The following 8 SFX sounds are implemented with distinct retro-arcade character:
   - `data_lance_fire` — Sharp, snappy laser bolt. High-frequency square wave sweep (1200Hz->200Hz over ~80ms) with fast attack/decay envelope. Rhythmic and satisfying for rapid fire.
   - `logic_bomb_fire` — Heavy missile launch. Low-frequency saw wave (200Hz->80Hz over ~200ms) with a mid-frequency click onset (800Hz, 5ms). Weighty, impactful.
   - `emp_burst` — Electronic disruption pulse. White noise burst (~100ms) through a bandpass filter (center 2000Hz, Q=5) with sharp attack, medium decay. Punchy and distinctive.
   - `virus_payload` — Deliberate injection sound. Descending sine sweep (800Hz->200Hz over ~300ms) with amplitude modulation (tremolo at 20Hz). Consequential feel.
   - `shield_hit` — Damage feedback. Short noise burst (~50ms) mixed with low sine pulse (100Hz, ~80ms). Sharp and alarming.
   - `enemy_explosion` — Vector shard scatter. Noise burst (~150ms) with exponential decay, through lowpass filter sweeping from 4000Hz->200Hz. Clean, satisfying.
   - `boss_destruction` — Multi-stage collapse. Three sequential phases: rising tone (200Hz->2000Hz, 200ms) + noise burst (300ms) + decaying low rumble (80Hz, 500ms). Spectacular crescendo.
   - `corridor_whoosh` — Environmental movement. Filtered noise with bandpass sweep (500Hz->2000Hz->500Hz over ~400ms). Immersive, spatial feel.

3. `SFXGenerator` integrates with `AudioManager` through a new `registerGenerator(generator: SFXGenerator)` method on `AudioManager`. When `AudioManager.playSFX(id)` is called and the buffer is not in the cache, it first checks if `SFXGenerator` can produce the buffer before attempting to load from the manifest file path. This provides a fallback chain: cache -> generator -> file load.

4. `SFXGenerator` uses an `OfflineAudioContext` to render each sound effect into an `AudioBuffer`. This avoids playing sounds during generation. Each sound is defined as a synthesis function that configures oscillators, gain envelopes, and filters on the offline context, then calls `startRendering()` to produce the buffer.

5. The placeholder manifest entries at `public/audio/manifest.json` for the 8 SFX sounds retain their existing entries (path + channel). The generator acts as a fallback — if actual .ogg files exist at the manifest paths, those are used instead. This preserves Story 4-8's swappable audio architecture.

6. `AudioManager` event subscriptions remain unchanged from Story 4-5. The existing `weaponFired`, `playerHit`, and `enemyDestroyed` EventBus subscriptions already route to `playSFX()` with the correct sound IDs. No new event subscriptions needed.

7. Two new EventBus subscriptions are added to `AudioManager.init()`:
   - `bossDestroyed` -> `playSFX('boss_destruction')`
   - `phaseStart` -> if phase is `'corridor'`, play `playSFX('corridor_whoosh')`

8. Running `npm run build` produces a clean production build with zero TypeScript errors.

9. Unit tests exist (Vitest) for:
   - `SFXGenerator` — generate returns AudioBuffer for each sound ID, caching works (same buffer returned on second call), unknown ID returns null, all 8 sounds produce non-empty buffers
   - `AudioManager` integration — registerGenerator stores generator reference, playSFX falls back to generator when manifest entry has no cached buffer, generator-produced buffers are cached, new event subscriptions for bossDestroyed and phaseStart/corridor work correctly

10. All existing tests continue to pass — zero regressions. Current test count: 1403 tests across 109 files.

## Tasks / Subtasks

- [x] Task 1: Create SFXGenerator class (AC: #1, #2, #4)
  - [x] 1.1 Create `src/audio/SFXGenerator.ts`. Define a `SoundDefinition` type as a function `(ctx: OfflineAudioContext) => void` that sets up nodes on the context.
  - [x] 1.2 Create a `SOUND_DEFINITIONS: Record<string, { duration: number; sampleRate: number; setup: SoundDefinition }>` map with all 8 sound entries.
  - [x] 1.3 Implement `data_lance_fire`: Create square oscillator sweeping 1200->200Hz over 80ms. GainNode with attack 0.001s, decay 0.08s. Connect osc->gain->destination.
  - [x] 1.4 Implement `logic_bomb_fire`: Create sawtooth oscillator sweeping 200->80Hz over 200ms. Add onset click via second oscillator (800Hz sine, 5ms). GainNode with attack 0.005s, sustain 0.1s, decay 0.1s.
  - [x] 1.5 Implement `emp_burst`: Create noise source (AudioBufferSourceNode with random samples). Route through BiquadFilterNode bandpass (2000Hz, Q=5). GainNode attack 0.001s, decay 0.1s.
  - [x] 1.6 Implement `virus_payload`: Sine oscillator sweeping 800->200Hz over 300ms. Amplitude modulation via LFO (20Hz sine connected to gain). GainNode with 0.01s attack, 0.25s sustain, 0.05s decay.
  - [x] 1.7 Implement `shield_hit`: Noise burst (50ms, fast decay) mixed with sine pulse (100Hz, 80ms). Two parallel paths to destination.
  - [x] 1.8 Implement `enemy_explosion`: Noise source through lowpass filter sweeping 4000->200Hz over 150ms. GainNode with exponential decay.
  - [x] 1.9 Implement `boss_destruction`: Three sequential phases using delayed starts. Phase 1: sine sweep 200->2000Hz (0-200ms). Phase 2: noise burst (200-500ms). Phase 3: sine 80Hz with slow exponential decay (500-1000ms).
  - [x] 1.10 Implement `corridor_whoosh`: Noise through bandpass filter sweeping 500->2000Hz->500Hz (triangular sweep over 400ms). GainNode with gradual attack/decay.
  - [x] 1.11 Implement `generate(id: string): Promise<AudioBuffer | null>`. Check cache first, then look up definition, create OfflineAudioContext, call setup function, render, cache result, return buffer.
  - [x] 1.12 Implement `generateAll(): Promise<void>` to pre-generate all sounds at init time.

- [x] Task 2: Integrate SFXGenerator into AudioManager (AC: #3, #7)
  - [x] 2.1 Add `private generator: SFXGenerator | null = null` field and `registerGenerator(generator: SFXGenerator): void` method to AudioManager.
  - [x] 2.2 Modify `loadBuffer()` to check generator as fallback: if `audioLoader.loadAsync(path)` fails AND generator exists, try `generator.generate(id)`.
  - [x] 2.3 Add `bossDestroyed` EventBus subscription in `init()`: `playSFX('boss_destruction')`.
  - [x] 2.4 Add `phaseStart` EventBus subscription in `init()`: if `event.phase === 'corridor'`, call `playSFX('corridor_whoosh')`.
  - [x] 2.5 Clean up new subscriptions in `dispose()`.

- [x] Task 3: Initialize SFXGenerator in main.ts (AC: #3)
  - [x] 3.1 Import `SFXGenerator` in main.ts.
  - [x] 3.2 After `audioManager.init(camera)`, create `const sfxGenerator = new SFXGenerator()`.
  - [x] 3.3 Call `audioManager.registerGenerator(sfxGenerator)`.
  - [x] 3.4 Call `sfxGenerator.generateAll()` as fire-and-forget with Logger.warn catch (same pattern as loadManifest).

- [x] Task 4: Write tests (AC: #9, #10)
  - [x] 4.1 Create `src/__tests__/SFXGenerator.test.ts`. Mock `OfflineAudioContext` with `startRendering()` returning a mock AudioBuffer. Test: generate returns buffer for each of 8 IDs, caching returns same buffer, unknown ID returns null, generateAll populates all 8 entries.
  - [x] 4.2 Update or create additional tests in `src/__tests__/AudioManager.test.ts` for: registerGenerator stores reference, playSFX uses generator fallback when file load fails, new bossDestroyed and phaseStart event subscriptions.
  - [x] 4.3 Run full test suite — all existing 1403 tests + new tests pass.

- [x] Task 5: Build verification (AC: #8, #10)
  - [x] 5.1 Run `npx tsc --noEmit` — zero TypeScript errors.
  - [x] 5.2 Run `npm run test` — all tests pass.

## Dev Notes

### Architecture Compliance

- **SFXGenerator in `src/audio/`** — same directory as AudioManager and AudioChannel. [Source: game-architecture.md#Directory Structure]
- **Procedural generation via OfflineAudioContext** — no external dependencies, no audio file downloads during gameplay. Aligns with "100% code-driven" philosophy. [Source: gdd.md#Production Approach]
- **jsfxr-inspired synthesis** — GDD specifies jsfxr as SFX source. Rather than adding a library dependency, we implement the same synthesis patterns (oscillator sweeps, noise bursts, filter envelopes) directly via Web Audio API. This gives full control and zero bundle bloat. [Source: gdd.md#Sound Design]
- **EventBus integration** — new subscriptions follow existing pattern. Systems never import AudioManager directly. [Source: game-architecture.md#Architectural Boundaries]
- **Fallback chain preserves swappability** — generator is a fallback, not a replacement. When real .ogg files exist, they take priority. This preserves Story 4-8's swappable audio asset architecture. [Source: game-architecture.md#Audio Manager]

### Critical Implementation Rules

- **Use `Logger.warn('Audio', message, context)`** for all logging. NEVER `console.log()`.
- **No `fetch()` during gameplay frames**: SFX generation happens at init time via `generateAll()`. All buffers cached before gameplay starts.
- **Systems never import each other**: AudioManager subscribes to EventBus events. SFXGenerator is a utility, not a system — it's injected into AudioManager via `registerGenerator()`.
- **`erasableSyntaxOnly: true`** in tsconfig: Do NOT use `enum`. Use `type` unions and `as const` objects.
- **`verbatimModuleSyntax: true`**: Use `import type { ... }` for type-only imports.
- **Event names are `camelCase`**: `bossDestroyed`, `phaseStart`. [Source: game-architecture.md#Event System]

### Existing Code Patterns to Follow

- **AudioManager singleton pattern**: `export const audioManager = new AudioManager()` in AudioManager.ts.
- **EventBus subscription pattern**: Subscribe in `init()`, unsubscribe in `dispose()`. Follow existing `onWeaponFired`, `onPlayerHit`, `onEnemyDestroyed` pattern.
- **Fire-and-forget init pattern**: `sfxGenerator.generateAll().catch(e => Logger.warn('Audio', ...))` — same as manifest loading.
- **Test patterns**: Follow `AudioManager.test.ts` structure. Mock Web Audio API objects. Use `vi.fn()` for callbacks.
- **TypeScript strict mode**: No unused variables, no implicit any, no enum keyword.

### What Already Exists (DO NOT recreate)

- `src/audio/AudioManager.ts` — Singleton with 4 channels, manifest loading, EventBus subscriptions for `weaponFired`, `playerHit`, `enemyDestroyed`. MODIFY to add generator fallback and new subscriptions.
- `src/audio/AudioChannel.ts` — Channel class with SFX pool, voice queue, ambient/music. DO NOT MODIFY.
- `src/audio/SoundManifest.ts` — Type definitions. DO NOT MODIFY.
- `public/audio/manifest.json` — 10 placeholder entries. DO NOT MODIFY (files don't exist yet, generator provides fallback).
- `src/core/GameEvents.ts` — Events: `weaponFired`, `playerHit`, `enemyDestroyed`, `bossDestroyed`, `phaseStart`. All already defined with typed payloads. DO NOT MODIFY.
- `src/main.ts` — Already imports and initializes `audioManager`. MODIFY to add SFXGenerator init.

### What Must Be Created

- `src/audio/SFXGenerator.ts` — Procedural retro SFX generator using Web Audio API OfflineAudioContext.

### What Must Be Modified

- `src/audio/AudioManager.ts` — Add `registerGenerator()` method, modify `loadBuffer()` for generator fallback, add `bossDestroyed` and `phaseStart` event subscriptions.
- `src/main.ts` — Add SFXGenerator import, creation, registration, and generateAll() call.

### Web Audio API Synthesis Patterns

- **OfflineAudioContext(channels, length, sampleRate)**: Creates an offline context for rendering audio without playback. `channels=1` (mono), `length=sampleRate*durationInSeconds`, `sampleRate=44100`.
- **OscillatorNode types**: `'sine'`, `'square'`, `'sawtooth'`, `'triangle'`. Set `.type` and `.frequency.value`.
- **Frequency sweep**: `oscillator.frequency.setValueAtTime(startHz, 0)` then `oscillator.frequency.exponentialRampToValueAtTime(endHz, duration)`.
- **Gain envelope**: `gain.gain.setValueAtTime(0, 0)` -> `linearRampToValueAtTime(1, attack)` -> `exponentialRampToValueAtTime(0.001, attack + decay)`.
- **Noise generation**: Create a buffer filled with random values (-1 to 1), load into `AudioBufferSourceNode`.
- **BiquadFilterNode**: `.type = 'bandpass'|'lowpass'|'highpass'`, `.frequency.value`, `.Q.value`.
- **Rendering**: Call `offlineCtx.startRendering()` which returns `Promise<AudioBuffer>`.

### Sound Design Reference

From GDD Sound Design table:
| Sound | Feel | Approach |
|-------|------|----------|
| Data Lance fire | Snappy, rhythmic, satisfying | Square wave sweep, fast envelope |
| Logic Bomb launch | Weighty, impactful | Sawtooth sweep + onset click |
| EMP Burst | Punchy, distinctive | Filtered noise burst |
| Virus Payload | Deliberate, consequential | Sine sweep + tremolo |
| Shield hit | Sharp, alarming | Noise + low sine |
| Enemy explosion | Clean, satisfying | Filtered noise decay |
| Boss destruction | Spectacular, building crescendo | 3-phase layered synthesis |
| Corridor whoosh | Immersive, spatial | Bandpass-swept noise |

### Previous Story Intelligence

From Story 4-5 (Audio Manager Architecture):
- AudioManager uses lazy buffer loading. `loadBuffer(id, path)` is async, checks cache first, then loads via `THREE.AudioLoader.loadAsync(path)`. We need to add generator as a third fallback after file load fails.
- SFX channel pool is 8 instances with round-robin. Generated buffers work identically to file-loaded buffers — both are `AudioBuffer` objects.
- `masterVolumeRef` is shared by reference across all channels. No changes needed for volume handling.
- Test count after Story 4-5: 1403 tests across 109 files. All must still pass.
- Mock pattern: Use `vi.hoisted()` for mock variables used in `vi.mock()` factories.
- AudioManager test uses `// @vitest-environment jsdom` directive.

### Scope Boundaries

**IN scope**: SFXGenerator class with 8 procedural sounds, AudioManager integration (registerGenerator + fallback chain + 2 new event subscriptions), main.ts integration, tests.

**NOT in scope** (future stories):
- Ambient electronic hum — Story 4-7
- Swappable audio asset hot-reload — Story 4-8
- Synthesized handler voice lines — Story 4-9
- Actual .ogg audio files — can be added later, generator provides fallback
- Volume settings UI or persistence — Story 6-7

### Project Structure Notes

- All new files align with the architecture's directory structure.
- `SFXGenerator.ts` at `src/audio/SFXGenerator.ts` — alongside AudioManager and AudioChannel.
- No new directories needed.
- No new dependencies needed — Web Audio API is browser-native.

### Testing Notes

- Mock `OfflineAudioContext` — it must return a mock `AudioBuffer` from `startRendering()`. Create minimal mock with `createOscillator()`, `createGain()`, `createBiquadFilter()`, `createBufferSource()`, `createBuffer()` returning mock nodes.
- Mock nodes need: `.connect()`, `.start()`, `.stop()`, `.frequency` (with `.setValueAtTime`, `.exponentialRampToValueAtTime`, `.linearRampToValueAtTime`), `.gain` (same param methods), `.type`, `.Q` (same param methods).
- For AudioManager integration tests, mock the SFXGenerator to return a pre-made AudioBuffer.
- DO NOT use `// @vitest-environment jsdom` for SFXGenerator tests — standard node environment with mocked OfflineAudioContext is sufficient.
- AudioManager tests already use jsdom environment — extend existing test file for new integration tests.

### References

- [Source: gdd.md#Sound Design] — Retro arcade SFX descriptions, jsfxr reference, Web Audio API synthesis
- [Source: gdd.md#Audio Architecture] — SFXPlayer channel, modular audio loading
- [Source: gdd.md#Production Approach] — 100% code-driven, AI-generated audio replaceable
- [Source: game-architecture.md#Audio Manager] — 4-channel architecture, JSON manifest
- [Source: game-architecture.md#Event System] — bossDestroyed, phaseStart events and subscribers
- [Source: game-architecture.md#Architectural Boundaries] — Systems never import each other
- [Source: game-architecture.md#Directory Structure] — src/audio/ for audio system files
- [Source: project-context.md#Technology Stack] — THREE.Audio (Web Audio API)
- [Source: project-context.md#Critical Implementation Rules] — Logger, EventBus patterns
- [Source: epics.md#Epic 4, Story 6] — "satisfying retro SFX for all weapons and actions"

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- SFXGenerator uses `OfflineAudioContext` (1 channel, 44100Hz sample rate) to render each sound without audible playback during generation. Each sound definition configures Web Audio API nodes (oscillators, gain, filters) on the offline context.
- AudioManager's `loadBuffer()` now has a 3-step fallback chain: (1) cache check, (2) file load via THREE.AudioLoader, (3) SFXGenerator procedural generation. This ensures sounds play even when .ogg files don't exist yet.
- The `playOnChannel()` method checks both the manifest AND the generator's `hasSound()` before rejecting unknown IDs. This allows generator-only sounds to play without manifest entries.
- New event subscriptions (`bossDestroyed`, `phaseStart`) follow the same callback-ref pattern as existing subscriptions (`onWeaponFired`, etc.) for clean disposal.
- The `createNoiseBuffer()` helper creates random-sample buffers for noise-based sounds (emp_burst, shield_hit, enemy_explosion, boss_destruction, corridor_whoosh).
- The `boss_destruction` sound uses delayed node starts (`.start(0.2)`, `.start(0.5)`) to create sequential phases within a single OfflineAudioContext render.

### Completion Notes List

- Task 1: Created `src/audio/SFXGenerator.ts` with 8 procedural retro SFX definitions. Each sound uses Web Audio API synthesis via OfflineAudioContext: data_lance_fire (square sweep), logic_bomb_fire (sawtooth + click onset), emp_burst (filtered noise), virus_payload (sine sweep + tremolo LFO), shield_hit (noise + sine), enemy_explosion (lowpass-filtered noise), boss_destruction (3-phase: rising tone + noise burst + low rumble), corridor_whoosh (bandpass-swept noise). Includes generate(id), generateAll(), hasSound(id), getSoundIds() methods with caching.
- Task 2: Modified `src/audio/AudioManager.ts` -- added `registerGenerator()` method, modified `playOnChannel()` to accept generator-only sounds, modified `loadBuffer()` with 3-step fallback (cache -> file -> generator), added `bossDestroyed` and `phaseStart` EventBus subscriptions with proper disposal cleanup.
- Task 3: Modified `src/main.ts` -- added SFXGenerator import, creation, registration with AudioManager, and fire-and-forget `generateAll()` call.
- Task 4: Created `src/__tests__/SFXGenerator.test.ts` with 16 tests covering all 8 sound IDs, caching, unknown ID handling, generateAll, hasSound, and getSoundIds. Added 10 new tests to `src/__tests__/AudioManager.test.ts` covering registerGenerator, generator fallback (both manifest miss and file load failure), bossDestroyed/phaseStart event subscriptions, corridor-only filter, and dispose cleanup.
- Task 5: `npx tsc --noEmit` passes clean. Full test suite: 1431 tests across 110 files, all pass, zero regressions.

### Change Log

- 2026-03-26: Story 4-6 implemented -- Retro SFX for Weapons and Actions. Created SFXGenerator with 8 procedural retro arcade sound effects using Web Audio API OfflineAudioContext synthesis. Integrated with AudioManager via registerGenerator/fallback chain. Added bossDestroyed and phaseStart event subscriptions. Added 26 new tests.

### File List

- `src/audio/SFXGenerator.ts` -- New: Procedural retro SFX generator with 8 sound definitions using Web Audio API OfflineAudioContext
- `src/audio/AudioManager.ts` -- Modified: added registerGenerator(), generator fallback in loadBuffer(), bossDestroyed/phaseStart event subscriptions, dispose cleanup
- `src/main.ts` -- Modified: added SFXGenerator import, creation, registration, and generateAll() call
- `src/__tests__/SFXGenerator.test.ts` -- New: 16 tests for procedural SFX generation, caching, and utility methods
- `src/__tests__/AudioManager.test.ts` -- Modified: added 10 tests for generator integration, fallback chain, and new event subscriptions
