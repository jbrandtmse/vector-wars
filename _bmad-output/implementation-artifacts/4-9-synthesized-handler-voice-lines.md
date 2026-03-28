# Story 4.9: Synthesized Handler Voice Lines

Status: review

## Story

As a player,
I want to hear synthesized handler voice lines that sound transmitted through a digital comm channel,
so that audio matches the vector aesthetic and the handler feels like a real character speaking through cyberspace.

## Acceptance Criteria

1. A `VoiceLineGenerator` class exists at `src/audio/VoiceLineGenerator.ts` that procedurally synthesizes voice-like audio buffers using the Web Audio API `OfflineAudioContext`. Each generated buffer simulates a "digital comm channel" transmission — robotic, synthesized tones that convey the speaker's intent through pitch, rhythm, and tonal character rather than actual speech. The generator produces short audio clips (0.5-3 seconds) that play alongside the text overlay to give the handler a "voice."

2. The `VoiceLineGenerator` implements the pattern established by `SFXGenerator`: a `generate(id: string): Promise<AudioBuffer | null>` method that checks an internal cache before synthesizing, and a `hasSound(id: string): boolean` method. Sound definitions are keyed by dialogue entry `audio` field values (e.g., `handler_phase1_start`, `handler_first_kill`, etc.).

3. Voice synthesis uses layered Web Audio API techniques to create a retro-digital comm channel feel:
   - Base tone: Square/sawtooth oscillator at speech-like frequencies (100-300Hz) with frequency sweeps
   - Modulation: Amplitude modulation (tremolo) at 5-15Hz for "transmission warble" character
   - Noise layer: Filtered white noise for "static/interference" character
   - Envelope: Attack-sustain-release shaping for natural speech-like rhythm
   - Bitcrushing effect: Sample rate reduction via low sample rate OfflineAudioContext (8000-11025Hz) for lo-fi digital quality

4. Different voice "profiles" exist for different speakers:
   - `handler`: Mid-range pitch (150-250Hz), moderate modulation, slight static — calm comm channel
   - `gatekeeper`: Low pitch (80-150Hz), heavy processing, more static — cold AI monotone
   - Future speakers (avenger, coreIntelligence) can be added later using the same pattern

5. The `DialogueManager.showNext()` method is updated to play voice audio when a dialogue entry has an `audio` field. When showing a new dialogue line:
   - If `entry.audio` is defined, call `audioManager.playVoice(entry.audio)` to play the voice line through the Voice channel.
   - The voice audio plays concurrently with the text typewriter reveal — they complement each other.
   - If no audio file exists for the ID, the existing fallback chain handles it (file -> VoiceLineGenerator -> null).

6. The `VoiceLineGenerator` is registered with `AudioManager` as a fallback generator specifically for voice lines. A new `registerVoiceGenerator(generator: VoiceLineGenerator)` method is added to `AudioManager`. The `loadBuffer()` method is updated to try the voice generator when the SFX generator cannot handle the sound ID and the manifest entry's channel is `voice` (or the sound ID matches a known voice pattern).

7. Voice line entries are added to the dialogue JSON files with `audio` fields:
   - `assets/dialogue/handler.json` — All 8 handler entries get `audio` fields (e.g., `"audio": "handler_phase1_start"`)
   - `assets/dialogue/bosses.json` — All 9 Gatekeeper entries get `audio` fields (e.g., `"audio": "gk_encounter_start"`)
   - `assets/dialogue/tutorial.json` — All 10 tutorial entries get `audio` fields (e.g., `"audio": "tutorial_welcome"`)

8. Voice line manifest entries are added to `public/audio/manifest.json` for all dialogue audio IDs with channel `voice` and paths under `audio/voice/`. No actual `.ogg` files need to exist — the VoiceLineGenerator provides procedural fallback, and real voice files can be dropped in later via the swappable audio architecture (Story 4-8).

9. The `VoiceLineGenerator` is instantiated and registered in `main.ts` alongside the existing `SFXGenerator` and `AmbientHumGenerator` setup.

10. Running `npm run build` produces a clean production build with zero TypeScript errors.

11. Unit tests exist (Vitest) for:
    - `VoiceLineGenerator.generate()` — generates audio buffer for known IDs, returns null for unknown, caches results, `hasSound()` returns correct values
    - `VoiceLineGenerator` sound profiles — handler and gatekeeper profiles produce buffers with different characteristics
    - `DialogueManager` voice playback integration — `showNext()` calls `audioManager.playVoice()` when `entry.audio` is set, does not call when `audio` is undefined
    - `AudioManager` voice generator fallback — when SFX generator cannot handle a voice ID, tries voice generator

12. All existing tests continue to pass — zero regressions.

## Tasks / Subtasks

- [x] Task 1: Create VoiceLineGenerator (AC: #1, #2, #3, #4)
  - [x] 1.1 Create `src/audio/VoiceLineGenerator.ts` with `generate(id: string)` and `hasSound(id: string)` methods following SFXGenerator pattern
  - [x] 1.2 Implement handler voice profile: mid-range square/sawtooth oscillator (150-250Hz), amplitude modulation at 8Hz, filtered noise layer, attack-sustain-release envelope, 11025Hz sample rate for lo-fi quality
  - [x] 1.3 Implement gatekeeper voice profile: low-range oscillator (80-150Hz), heavier modulation at 5Hz, more noise, longer sustain, 8000Hz sample rate for colder/more processed feel
  - [x] 1.4 Create voice line definitions for all handler dialogue IDs (8 entries from handler.json)
  - [x] 1.5 Create voice line definitions for all tutorial dialogue IDs (10 entries from tutorial.json)
  - [x] 1.6 Create voice line definitions for all gatekeeper dialogue IDs (9 entries from bosses.json)
  - [x] 1.7 Add `generateAll(): Promise<void>` method to pre-generate all voice buffers at init

- [x] Task 2: Update AudioManager for voice generator fallback (AC: #6)
  - [x] 2.1 Add `private voiceGenerator: VoiceLineGenerator | null = null` field to AudioManager
  - [x] 2.2 Add `registerVoiceGenerator(generator: VoiceLineGenerator): void` method
  - [x] 2.3 Update `loadBuffer()` to try `this.voiceGenerator` after `this.generator` fails, for voice-channel sounds
  - [x] 2.4 Update `dispose()` to clear voiceGenerator reference

- [x] Task 3: Update DialogueManager to play voice audio (AC: #5)
  - [x] 3.1 Add `audioManager` import to DialogueManager
  - [x] 3.2 In `showNext()`, after showing text overlay, check if `entry.audio` is defined and call `audioManager.playVoice(entry.audio)`

- [x] Task 4: Update dialogue JSON files with audio fields (AC: #7)
  - [x] 4.1 Add `audio` field to all entries in `assets/dialogue/handler.json`
  - [x] 4.2 Add `audio` field to all entries in `assets/dialogue/tutorial.json`
  - [x] 4.3 Add `audio` field to all entries in `assets/dialogue/bosses.json`

- [x] Task 5: Update manifest.json with voice entries (AC: #8)
  - [x] 5.1 Add voice line entries to `public/audio/manifest.json` for all handler IDs (channel: voice, path: audio/voice/{id}.ogg)
  - [x] 5.2 Add voice line entries for all tutorial IDs
  - [x] 5.3 Add voice line entries for all gatekeeper IDs

- [x] Task 6: Register VoiceLineGenerator in main.ts (AC: #9)
  - [x] 6.1 Import and instantiate `VoiceLineGenerator` in main.ts
  - [x] 6.2 Call `audioManager.registerVoiceGenerator(voiceGenerator)`
  - [x] 6.3 Call `voiceGenerator.generateAll()` for pre-warming

- [x] Task 7: Write tests (AC: #11, #12)
  - [x] 7.1 Create `src/__tests__/VoiceLineGenerator.test.ts`: generate() returns AudioBuffer for known IDs, returns null for unknown, caches results, hasSound() works correctly, generateAll() processes all definitions
  - [x] 7.2 Add DialogueManager voice playback tests: showNext() triggers audioManager.playVoice when entry.audio is set, does not call when undefined
  - [x] 7.3 Add AudioManager voice generator fallback tests: falls back to voiceGenerator when sfxGenerator cannot handle, registerVoiceGenerator stores reference, dispose clears reference

- [x] Task 8: Build verification (AC: #10, #12)
  - [x] 8.1 Run `npx tsc --noEmit` — zero TypeScript errors
  - [x] 8.2 Run `npm run test` — all tests pass, zero regressions

## Dev Notes

### Architecture Compliance

- **VoiceLineGenerator in `src/audio/`** — alongside SFXGenerator, AmbientHumGenerator, and AudioManager. Same directory, same pattern. [Source: game-architecture.md#Directory Structure]
- **AudioManager singleton modification** — add voiceGenerator field and registration method, matching the existing `registerGenerator()` and `registerAmbientGenerator()` patterns. [Source: AudioManager.ts lines 196-204]
- **DialogueManager imports audioManager singleton** — this is the exception to "UI never imports game logic" because DialogueManager is in `src/narrative/`, which is a system, not UI. It already imports EventBus. Adding audioManager import follows the same pattern. [Source: game-architecture.md#Narrative System]
- **JSON dialogue files at `assets/dialogue/`** — already exist, only adding `audio` field to entries. [Source: game-architecture.md#Configuration Management]
- **Sound manifest at `public/audio/manifest.json`** — already exists, adding new voice entries. [Source: game-architecture.md#Configuration Management]

### Critical Implementation Rules

- **Use `Logger.info('Audio', ...)` / `Logger.warn(...)`** for all logging. NEVER `console.log()`. [Source: project-context.md#Critical Don't-Miss Rules]
- **No `fetch()` during gameplay frames**: VoiceLineGenerator uses OfflineAudioContext, not network requests. All generation happens at init via `generateAll()`. [Source: project-context.md#Performance Rules]
- **`erasableSyntaxOnly: true`** in tsconfig: Do NOT use `enum`. Use `type` unions and `as const` objects. [Source: tsconfig.json]
- **`verbatimModuleSyntax: true`**: Use `import type { ... }` for type-only imports. [Source: tsconfig.json]
- **Systems never import each other**: DialogueManager can import audioManager singleton because it's importing a module-level export, not a system class. Same pattern as how main.ts wires things together. [Source: project-context.md#Architecture Rules]

### Existing Code Patterns to Follow

- **SFXGenerator pattern**: `SOUND_DEFINITIONS` record keyed by ID, `SoundDefinition` with duration/sampleRate/setup function, `generate()` with cache, `hasSound()`, `generateAll()`. Copy this exact pattern for VoiceLineGenerator. [Source: src/audio/SFXGenerator.ts]
- **AudioManager registration pattern**: `registerGenerator(generator: SFXGenerator)` and `registerAmbientGenerator(generator: AmbientHumGenerator)` already exist. Add `registerVoiceGenerator(generator: VoiceLineGenerator)` in the same style. [Source: src/audio/AudioManager.ts lines 196-204]
- **loadBuffer() fallback chain**: Currently tries file -> SFXGenerator -> null. Extend to file -> SFXGenerator -> VoiceLineGenerator -> null. [Source: src/audio/AudioManager.ts lines 406-433]
- **Dialogue entry audio field**: `DialogueEntry.audio?: string` already defined in DialogueTypes.ts. The JSON files just need `audio` values added to entries. [Source: src/narrative/DialogueTypes.ts line 16]
- **Test patterns**: Follow AudioManager.test.ts and SFXGenerator patterns. Mock OfflineAudioContext for VoiceLineGenerator tests. Use `vi.hoisted()` for mock variables. [Source: src/__tests__/AudioManager.test.ts]

### What Already Exists (DO NOT recreate)

- `src/audio/AudioManager.ts` — Singleton with channels, loadBuffer, generator registration. MODIFY to add voiceGenerator.
- `src/audio/SFXGenerator.ts` — Procedural SFX. DO NOT MODIFY. Use as pattern reference.
- `src/audio/AudioChannel.ts` — Voice channel with queue. DO NOT MODIFY. Already handles voice playback correctly.
- `src/audio/SoundManifest.ts` — Type definitions. DO NOT MODIFY.
- `src/narrative/DialogueManager.ts` — Trigger evaluation, priority queue, showNext(). MODIFY showNext() to play audio.
- `src/narrative/DialogueTypes.ts` — DialogueEntry with `audio?: string`. DO NOT MODIFY (already has the field).
- `assets/dialogue/handler.json` — 8 handler entries. MODIFY to add `audio` fields.
- `assets/dialogue/tutorial.json` — 10 tutorial entries. MODIFY to add `audio` fields.
- `assets/dialogue/bosses.json` — 9 gatekeeper entries. MODIFY to add `audio` fields.
- `public/audio/manifest.json` — 10 entries. MODIFY to add voice entries.
- `src/main.ts` — Game init. MODIFY to create and register VoiceLineGenerator.

### What Must Be Created

- `src/audio/VoiceLineGenerator.ts` — Procedural voice-like audio synthesis for handler and boss dialogue
- `src/__tests__/VoiceLineGenerator.test.ts` — Tests for voice line generation

### What Must Be Modified

- `src/audio/AudioManager.ts` — Add voiceGenerator field, registerVoiceGenerator(), extend loadBuffer() fallback chain, update dispose()
- `src/narrative/DialogueManager.ts` — Import audioManager, call playVoice() in showNext() when entry.audio is set
- `assets/dialogue/handler.json` — Add `audio` field to all 8 entries
- `assets/dialogue/tutorial.json` — Add `audio` field to all 10 entries
- `assets/dialogue/bosses.json` — Add `audio` field to all 9 gatekeeper entries
- `public/audio/manifest.json` — Add voice line entries for all 27 dialogue IDs
- `src/main.ts` — Import, instantiate, and register VoiceLineGenerator

### Voice Synthesis Design

The VoiceLineGenerator creates "comm channel transmissions" — NOT actual speech synthesis. Think of it as:
- Short tonal patterns that suggest someone speaking through heavy digital processing
- Similar to how retro games implied voice with tonal beeps (Star Fox, etc.)
- Each "voice line" is a unique tonal pattern that varies in pitch, rhythm, and duration to match the dialogue's emotional content

**Handler profile (mid-range, calm comm):**
```
Base: 180Hz square wave with slight frequency drift
Modulation: 8Hz amplitude tremolo at 0.3 depth
Noise: Bandpass-filtered white noise at 2000Hz, low level (0.1)
Envelope: 0.02s attack, sustain, 0.05s release
Sample rate: 11025Hz (lo-fi but intelligible tonal quality)
```

**Gatekeeper profile (low, cold AI):**
```
Base: 100Hz sawtooth with wider frequency sweep
Modulation: 5Hz tremolo at 0.5 depth (more "robotic")
Noise: Wider bandpass noise, higher level (0.2)
Envelope: 0.01s attack, sustain, 0.1s release
Sample rate: 8000Hz (more crushed, mechanical)
```

Each voice line varies duration (0.5-2.5s based on text length) and adds pitch variation to suggest speech inflection.

### Previous Story Intelligence

From Story 4-8 (Swappable Audio Assets):
- reloadManifest() and AudioAssetValidator are now available for development workflow.
- Manifest can be hot-reloaded. Voice files dropped into `public/audio/voice/` will be picked up on reload.
- Test count after 4-8: 1499 tests across 112 files.

From Story 4-7 (Ambient Electronic Hum):
- AmbientHumGenerator uses live AudioContext (not OfflineAudioContext). VoiceLineGenerator should use OfflineAudioContext like SFXGenerator since voice lines are pre-rendered buffers, not live.

From Story 4-6 (Retro SFX for Weapons and Actions):
- SFXGenerator established the procedural audio pattern: SOUND_DEFINITIONS record, OfflineAudioContext rendering, cache map.
- `createNoiseBuffer()` helper function is available as a pattern reference (defined in SFXGenerator.ts, recreate similar in VoiceLineGenerator).

From Story 4-5 (Audio Manager Architecture):
- Voice channel uses queue-based playback (new voice lines queue behind currently playing).
- `playVoice(id)` -> `playOnChannel('voice', id)` -> `loadBuffer()` -> `channel.play()`.

From Story 4-1 (Handler Comm Overlay System):
- DialogueManager.showNext() currently only shows text. Adding audio playback here is the natural integration point.
- CommOverlay typewriter effect runs concurrently — voice audio should start at the same time.

### Scope Boundaries

**IN scope**: VoiceLineGenerator class, voice synthesis for handler + gatekeeper + tutorial dialogue, DialogueManager audio integration, manifest updates, JSON audio field additions, tests.

**NOT in scope** (future stories):
- Actual recorded voice files (`.ogg`) — developer drops these in manually per swappable audio architecture
- Voice lines for Levels 2 and 3 — Story 5-8 (Handler Voice Escalation)
- Avenger and Core Intelligence voice profiles — Story 5-2, 5-4
- Volume settings UI — Story 6-7
- Final audio polish — Story 6-7

### Project Structure Notes

- All new files align with the architecture's directory structure
- `VoiceLineGenerator.ts` at `src/audio/VoiceLineGenerator.ts` — alongside SFXGenerator
- No new directories needed
- No new npm dependencies needed

### References

- [Source: gdd.md#Voice/Dialogue] — "Synthesized/processed voice lines — retro-digital quality, as if transmitted through a digital comm channel"
- [Source: gdd.md#Voice/Dialogue] — "Voice processing pipeline: Generate clean voice with AI TTS -> apply retro-digital processing"
- [Source: gdd.md#Audio Architecture] — "VoicePlayer (Handler lines, AI taunts, boss dialogue)"
- [Source: gdd.md#Aesthetic Goals] — "Synthesized voices and retro SFX match the digital world. Everything sounds like cyberspace."
- [Source: game-architecture.md#Audio Manager] — "VoiceChannel (volume: 0.9, single THREE.Audio, queued playback)"
- [Source: game-architecture.md#Narrative System] — "DialogueManager: Plays audio via Voice channel"
- [Source: game-architecture.md#Directory Structure] — voice lines at `public/audio/voice/`
- [Source: epics.md#Epic 4, Story 9] — "hear synthesized handler voice lines that sound transmitted through a digital comm channel"
- [Source: project-context.md#Technology Stack] — THREE.Audio (Web Audio API)
- [Source: project-context.md#Critical Implementation Rules] — Logger, EventBus, no fetch during gameplay

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- VoiceLineGenerator uses OfflineAudioContext at low sample rates (11025Hz for handler, 8000Hz for gatekeeper) to achieve lo-fi digital quality. Each voice line is a unique tonal pattern created by hashing the line ID for deterministic variation in pitch and frequency sweep.
- AudioManager loadBuffer() fallback chain extended: file -> SFXGenerator -> VoiceLineGenerator -> null. The playOnChannel() guard also checks voiceGenerator.hasSound() to prevent "not found in manifest" warnings for voice-only IDs.
- DialogueManager.showNext() now calls audioManager.playVoice(entry.audio) when the audio field is present, playing voice audio concurrently with text typewriter reveal.
- Voice manifest entries added with channel "voice" and paths under audio/voice/. No actual .ogg files exist -- VoiceLineGenerator procedural fallback handles all playback. When real voice files are dropped in later, they will be used automatically via the swappable audio architecture.

### Completion Notes List

- Task 1: Created `src/audio/VoiceLineGenerator.ts` with handler profile (180Hz square, 11025Hz), gatekeeper profile (100Hz sawtooth, 8000Hz), and 27 voice line definitions (8 handler + 10 tutorial + 9 gatekeeper). Uses OfflineAudioContext rendering with layered oscillator + noise + amplitude modulation synthesis.
- Task 2: Modified `src/audio/AudioManager.ts` -- added voiceGenerator field, registerVoiceGenerator() method, extended loadBuffer() to try voiceGenerator after sfxGenerator, extended playOnChannel guard to check voiceGenerator.hasSound(), voiceGenerator cleared in dispose().
- Task 3: Modified `src/narrative/DialogueManager.ts` -- imported audioManager singleton, added `audioManager.playVoice(entry.audio)` call in showNext() when entry.audio is defined.
- Task 4: Modified all 3 dialogue JSON files to add `audio` fields: `assets/dialogue/handler.json` (8 entries), `assets/dialogue/tutorial.json` (10 entries), `assets/dialogue/bosses.json` (9 entries).
- Task 5: Modified `public/audio/manifest.json` -- added 27 voice line entries (channel: voice, path: audio/voice/{id}.ogg).
- Task 6: Modified `src/main.ts` -- imported VoiceLineGenerator, instantiated and registered with audioManager, called generateAll() for pre-warming.
- Task 7: Created `src/__tests__/VoiceLineGenerator.test.ts` with 17 tests. Added 5 voice generator fallback tests to `src/__tests__/AudioManager.test.ts`. Added 4 voice playback tests to `src/__tests__/DialogueManager.test.ts`. Total: 26 new tests.
- Task 8: `npx tsc --noEmit` passes clean. Full test suite: 1527 tests across 113 files, all pass, zero regressions.

### Change Log

- 2026-03-26: Story 4-9 implemented -- Synthesized Handler Voice Lines. Created VoiceLineGenerator for procedural voice-like audio synthesis with handler and gatekeeper speaker profiles. Integrated voice playback into DialogueManager.showNext(). Extended AudioManager fallback chain to support voice generator. Added audio fields to all 27 dialogue entries across 3 JSON files. Added 27 voice manifest entries. Added 26 new tests.

### File List

- `src/audio/VoiceLineGenerator.ts` -- New: Procedural voice line synthesis with handler/gatekeeper profiles, 27 voice definitions
- `src/audio/AudioManager.ts` -- Modified: added voiceGenerator field, registerVoiceGenerator(), extended loadBuffer() and playOnChannel() fallback chain, dispose() cleanup
- `src/narrative/DialogueManager.ts` -- Modified: imported audioManager, added playVoice() call in showNext() when entry.audio is set
- `assets/dialogue/handler.json` -- Modified: added audio field to all 8 handler entries
- `assets/dialogue/tutorial.json` -- Modified: added audio field to all 10 tutorial entries
- `assets/dialogue/bosses.json` -- Modified: added audio field to all 9 gatekeeper entries
- `public/audio/manifest.json` -- Modified: added 27 voice line entries (channel: voice)
- `src/main.ts` -- Modified: imported VoiceLineGenerator, instantiated, registered, pre-generated
- `src/__tests__/VoiceLineGenerator.test.ts` -- New: 17 tests for voice line generation, caching, profiles, failure handling
- `src/__tests__/AudioManager.test.ts` -- Modified: added 5 tests for voice generator registration, fallback, and dispose
- `src/__tests__/DialogueManager.test.ts` -- Modified: added 4 tests for voice playback integration
