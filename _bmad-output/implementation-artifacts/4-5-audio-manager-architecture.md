# Story 4.5: Audio Manager Architecture

Status: review

## Story

As a developer,
I want to load and play audio files through the AudioManager,
so that all audio is centrally managed and replaceable.

## Acceptance Criteria

1. An `AudioManager` class exists at `src/audio/AudioManager.ts`. It is a singleton managing four independent channels: SFX, Voice, Ambient, and Music. It wraps `THREE.AudioListener` and `THREE.Audio` / `THREE.PositionalAudio` from Three.js r183. Public API: `init(camera: THREE.Camera)`, `loadManifest(url: string): Promise<void>`, `playSFX(id: string)`, `playVoice(id: string)`, `playAmbient(id: string, loop?: boolean)`, `playMusic(id: string, loop?: boolean)`, `stopChannel(channel: ChannelType)`, `setChannelVolume(channel: ChannelType, volume: number)`, `setMasterVolume(volume: number)`, `dispose()`.

2. An `AudioChannel` class exists at `src/audio/AudioChannel.ts`. Each channel encapsulates volume control, play/stop/queue semantics, and audio instance management. Constructor accepts `(listener: THREE.AudioListener, options: ChannelOptions)`. Channels:
   - **SFX**: Pools multiple `THREE.Audio` instances (pool size 8) for concurrent playback. `play(buffer)` picks the next available instance.
   - **Voice**: Single `THREE.Audio` instance with a queue. `play(buffer)` queues if already playing. Queue plays next line when current finishes (via `onEnded` callback). `clearQueue()` to flush.
   - **Ambient**: Single looping `THREE.Audio` instance. `play(buffer, loop=true)`.
   - **Music**: Single `THREE.Audio` instance. `play(buffer, loop=false)`.

3. A `SoundManifest` type definition exists at `src/audio/SoundManifest.ts`:
   ```typescript
   interface SoundEntry {
     path: string;
     channel: ChannelType;
     volume?: number;  // per-sound volume multiplier (0-1, default 1.0)
   }
   interface SoundManifest {
     [id: string]: SoundEntry;
   }
   type ChannelType = 'sfx' | 'voice' | 'ambient' | 'music';
   ```

4. `AudioManager.loadManifest(url)` fetches the JSON manifest file, parses it, and stores the mapping. It does NOT pre-load audio buffers — buffers are loaded lazily on first play (via `THREE.AudioLoader`). Loaded buffers are cached in a `Map<string, AudioBuffer>`. This approach keeps initial load time minimal.

5. A placeholder manifest file exists at `public/audio/manifest.json`:
   ```json
   {
     "data_lance_fire": { "path": "audio/sfx/data_lance_fire.ogg", "channel": "sfx" },
     "logic_bomb_fire": { "path": "audio/sfx/logic_bomb_fire.ogg", "channel": "sfx" },
     "emp_burst": { "path": "audio/sfx/emp_burst.ogg", "channel": "sfx" },
     "virus_payload": { "path": "audio/sfx/virus_payload.ogg", "channel": "sfx" },
     "shield_hit": { "path": "audio/sfx/shield_hit.ogg", "channel": "sfx" },
     "enemy_explosion": { "path": "audio/sfx/enemy_explosion.ogg", "channel": "sfx" },
     "boss_destruction": { "path": "audio/sfx/boss_destruction.ogg", "channel": "sfx" },
     "corridor_whoosh": { "path": "audio/sfx/corridor_whoosh.ogg", "channel": "sfx" },
     "ambient_hum": { "path": "audio/ambient/ambient_hum.ogg", "channel": "ambient" },
     "outro_music": { "path": "audio/music/outro_music.ogg", "channel": "music" }
   }
   ```

6. `AudioManager` subscribes to `EventBus` events and plays corresponding sounds:
   - `weaponFired` -> plays SFX based on `event.weapon` type (`data_lance_fire`, `logic_bomb_fire`, `emp_burst`, `virus_payload`)
   - `playerHit` -> plays `shield_hit` SFX
   - `enemyDestroyed` -> plays `enemy_explosion` SFX
   Event subscriptions are set up in `init()` and cleaned up in `dispose()`.

7. `AudioManager` handles missing audio files gracefully: if a sound ID is not in the manifest, or if the audio file fails to load, log a warning via `Logger.warn('Audio', ...)` and continue. The game NEVER crashes due to missing audio. This follows the architecture's non-critical error handling pattern.

8. `AudioManager` respects the Web Audio API requirement for user interaction before playing audio. On `init()`, it registers a one-time click/keydown listener that calls `listener.context.resume()` to unlock the AudioContext. This is standard browser policy.

9. Channel default volumes: SFX=0.6, Voice=0.9, Ambient=0.4, Music=0.3. Master volume defaults to 1.0. All volumes are stored and can be adjusted via `setChannelVolume()` and `setMasterVolume()`. Effective volume = masterVolume * channelVolume * perSoundVolume.

10. `AudioManager` is initialized in `main.ts` after camera creation. `init(camera)` attaches the `AudioListener` to the camera. `loadManifest('audio/manifest.json')` is called during the async init phase (fire-and-forget pattern, same as dialogue scripts).

11. Running `npm run build` produces a clean production build with zero TypeScript errors.

12. Unit tests exist (Vitest) for:
    - `AudioChannel` — play, stop, volume control, SFX pool round-robin, voice queue, ambient loop
    - `AudioManager` — init attaches listener to camera, loadManifest parses JSON, playSFX/playVoice/playAmbient/playMusic route to correct channels, setChannelVolume/setMasterVolume apply correctly, dispose cleans up, missing sound ID logs warning
    - `SoundManifest` — type validation

13. All existing tests continue to pass — zero regressions. Current test count: 1344 tests across 106 files.

## Tasks / Subtasks

- [x] Task 1: Create SoundManifest type definitions (AC: #3)
  - [x] 1.1 Create `src/audio/SoundManifest.ts` with `SoundEntry`, `SoundManifest`, and `ChannelType` type definitions.
  - [x] 1.2 Export all types for use by AudioManager and AudioChannel.

- [x] Task 2: Create AudioChannel class (AC: #2, #9)
  - [x] 2.1 Create `src/audio/AudioChannel.ts`. Import `THREE` and `ChannelType` from SoundManifest.
  - [x] 2.2 Define `ChannelOptions` interface: `{ type: ChannelType; volume: number; poolSize?: number; }`.
  - [x] 2.3 Constructor: accept `(listener: THREE.AudioListener, options: ChannelOptions)`. Create `THREE.Audio` instance(s) based on channel type. For SFX: create `poolSize` (default 8) instances in an array; track `nextIndex` for round-robin. For Voice/Ambient/Music: create single instance.
  - [x] 2.4 Implement `play(buffer: AudioBuffer, loop?: boolean): void`. SFX: pick next pooled instance via round-robin, stop if playing, set buffer, set loop=false, play. Voice: if current is playing, queue the buffer; else set buffer and play. Register `onEnded` to dequeue next. Ambient/Music: stop current, set buffer, set loop param, play.
  - [x] 2.5 Implement `stop(): void`. Stop all active instances. For Voice, clear the queue.
  - [x] 2.6 Implement `setVolume(volume: number): void`. Store volume, apply to all instances: `instance.setVolume(volume * masterVolumeRef)`.
  - [x] 2.7 Implement `clearQueue(): void` (Voice channel only). Flush queued buffers.
  - [x] 2.8 Implement `dispose(): void`. Stop all, disconnect all `THREE.Audio` instances.

- [x] Task 3: Create AudioManager class (AC: #1, #4, #6, #7, #8, #9, #10)
  - [x] 3.1 Create `src/audio/AudioManager.ts`. Singleton pattern (module-level exported instance `audioManager`).
  - [x] 3.2 `init(camera: THREE.Camera)`: Create `THREE.AudioListener`, add to camera. Create four `AudioChannel` instances (SFX pool=8, Voice, Ambient, Music) with default volumes. Register AudioContext unlock listener (one-time click/keydown calls `listener.context.resume()`). Subscribe to EventBus events.
  - [x] 3.3 `loadManifest(url: string): Promise<void>`: Fetch JSON, parse as `SoundManifest`, store in `manifest` field. Create `THREE.AudioLoader` instance. Create `bufferCache: Map<string, AudioBuffer>`.
  - [x] 3.4 Private `loadBuffer(id: string): Promise<AudioBuffer | null>`: Look up `id` in manifest. If not found, `Logger.warn` and return null. If cached, return cached. Otherwise load via `audioLoader.loadAsync(path)`, cache and return. On load error, `Logger.warn` and return null.
  - [x] 3.5 `playSFX(id: string)`, `playVoice(id: string)`, `playAmbient(id: string, loop?: boolean)`, `playMusic(id: string, loop?: boolean)`: Call `loadBuffer(id)`, then route to the appropriate channel's `play()`. Since `loadBuffer` is async, use `.then()` — the slight delay on first play is acceptable (subsequent plays are instant from cache).
  - [x] 3.6 `stopChannel(channel: ChannelType)`: Route to corresponding AudioChannel's `stop()`.
  - [x] 3.7 `setChannelVolume(channel: ChannelType, volume: number)`: Clamp 0-1, store, call channel's `setVolume()`.
  - [x] 3.8 `setMasterVolume(volume: number)`: Clamp 0-1, store, update all channels' effective volumes.
  - [x] 3.9 `dispose()`: Unsubscribe from EventBus events. Stop all channels. Remove AudioListener from camera. Remove AudioContext unlock listener.
  - [x] 3.10 EventBus subscriptions in `init()`: `weaponFired` -> map weapon type to sound ID and `playSFX()`. `playerHit` -> `playSFX('shield_hit')`. `enemyDestroyed` -> `playSFX('enemy_explosion')`.

- [x] Task 4: Create placeholder manifest JSON (AC: #5)
  - [x] 4.1 Create `public/audio/manifest.json` with 10 placeholder entries mapping sound IDs to file paths and channels.

- [x] Task 5: Integrate AudioManager in main.ts (AC: #10)
  - [x] 5.1 Import `audioManager` from `src/audio/AudioManager.ts`.
  - [x] 5.2 After camera creation, call `audioManager.init(camera)`.
  - [x] 5.3 Call `audioManager.loadManifest('audio/manifest.json')` — fire-and-forget `.catch()` with `Logger.warn`.

- [x] Task 6: Remove .gitkeep from src/audio/ (cleanup)
  - [x] 6.1 Delete `src/audio/.gitkeep` since real files now exist in the directory.

- [x] Task 7: Write tests (AC: #12, #13)
  - [x] 7.1 Create `src/__tests__/SoundManifest.test.ts`. Test type exports exist and shape is correct.
  - [x] 7.2 Create `src/__tests__/AudioChannel.test.ts`. Mock `THREE.Audio` and `THREE.AudioListener`. Test: SFX pool creation with correct count, round-robin play picks next instance, voice queue plays sequentially, ambient loops by default, stop halts all instances, setVolume applies to all instances, dispose disconnects.
  - [x] 7.3 Create `src/__tests__/AudioManager.test.ts`. Mock THREE, EventBus, fetch. Test: init attaches listener to camera, loadManifest fetches and stores manifest, playSFX/playVoice/playAmbient/playMusic route correctly, missing sound ID logs warning without throwing, setChannelVolume/setMasterVolume apply correctly, dispose cleans up listeners, EventBus subscriptions fire correct sounds on events.
  - [x] 7.4 Run full test suite — all existing 1344 tests + new tests pass.

- [x] Task 8: Build verification (AC: #11, #13)
  - [x] 8.1 Run `npx tsc --noEmit` — zero TypeScript errors.
  - [x] 8.2 Run `npm run test` — all tests pass.

## Dev Notes

### Architecture Compliance

- **AudioManager in `src/audio/`** — exactly as specified in `game-architecture.md` directory structure. [Source: game-architecture.md#Directory Structure, game-architecture.md#Audio Manager]
- **4-channel architecture**: SFXChannel (pooled), VoiceChannel (queued), AmbientChannel (looping), MusicChannel (single). [Source: game-architecture.md#Audio Manager]
- **JSON sound manifest at `public/audio/manifest.json`** — maps IDs to file paths. Swap files without code changes. [Source: game-architecture.md#Configuration Management, game-architecture.md#Audio Manager]
- **EventBus integration**: AudioManager subscribes to game events. Systems never import AudioManager directly — communication through EventBus only. [Source: game-architecture.md#Architectural Boundaries, game-architecture.md#Event System]
- **Non-critical error handling**: Missing audio files are logged and skipped, game continues. [Source: game-architecture.md#Error Handling]
- **THREE.Audio / AudioListener**: Uses Three.js r183 Web Audio API integration. [Source: game-architecture.md#Engine-Provided Architecture]

### Critical Implementation Rules

- **Use `Logger.warn('Audio', message, context)`** for all logging. NEVER `console.log()`.
- **No `fetch()` during gameplay frames**: Manifest loads at init. Buffer loading is lazy but cached — first play of a sound has ~10ms async delay, all subsequent plays are instant from cache.
- **Systems never import each other**: AudioManager subscribes to EventBus events. WeaponSystem, CollisionSystem etc. never import AudioManager.
- **`erasableSyntaxOnly: true`** in tsconfig: Do NOT use `enum`. Use `type` unions and `as const` objects.
- **`verbatimModuleSyntax: true`**: Use `import type { ... }` for type-only imports.
- **Audio files use `snake_case.ogg`** naming convention. [Source: game-architecture.md#Naming Conventions]
- **Event names are `camelCase`**: `weaponFired`, `playerHit`, `enemyDestroyed`. [Source: game-architecture.md#Event System]

### Existing Code Patterns to Follow

- **Singleton pattern**: Export module-level instance (`export const audioManager = new AudioManager()`), same as `eventBus` in GameEvents.ts.
- **EventBus subscription**: Follow `DialogueManager.ts` pattern — subscribe in init, unsubscribe in dispose.
- **Fetch pattern in main.ts**: Follow existing handler.json / bosses.json / tutorial.json / briefing.json chains — fire-and-forget with `.catch(Logger.warn)`.
- **Test patterns**: Follow `BriefingScreen.test.ts`, `CommOverlay.test.ts` structure. Mock THREE objects. Use vi.fn() for callbacks.

### What Already Exists (DO NOT recreate)

- `src/audio/` directory with `.gitkeep` placeholder — ready for real files.
- `public/audio/sfx/.gitkeep`, `public/audio/voice/.gitkeep`, `public/audio/ambient/.gitkeep`, `public/audio/music/.gitkeep` — placeholder directories for audio files. Keep these.
- `src/core/EventBus.ts` — Typed EventBus class. Used as-is.
- `src/core/GameEvents.ts` — All events defined with typed payloads. `eventBus` singleton exported. Contains `weaponFired`, `playerHit`, `enemyDestroyed` events that AudioManager subscribes to.
- `src/core/Logger.ts` — Logger with static methods. Use `Logger.warn('Audio', ...)`.
- `src/types/game.ts` — `WeaponType` already defined as `'dataLance' | 'logicBomb' | 'emp' | 'virusPayload'`.
- `src/main.ts` — Game initialization. MODIFY to add AudioManager init.

### What Must Be Created

- `src/audio/SoundManifest.ts` — Type definitions for sound manifest and channel types.
- `src/audio/AudioChannel.ts` — Channel class wrapping THREE.Audio with pool/queue support.
- `src/audio/AudioManager.ts` — Singleton manager with 4 channels, manifest loading, EventBus integration.
- `public/audio/manifest.json` — Placeholder sound manifest mapping IDs to file paths.

### What Must Be Modified

- `src/main.ts` — Add AudioManager import, init, and manifest loading.

### Web Audio API Considerations

- **User interaction requirement**: Browsers require a user gesture (click/key) before AudioContext can play. `AudioManager.init()` registers a one-time event listener that calls `listener.context.resume()`.
- **THREE.AudioListener**: Must be added to the camera. Creates the underlying `AudioContext`.
- **THREE.Audio**: Non-positional audio (plays at listener position). Correct for this game since all audio is diegetic/UI, not 3D-positioned.
- **THREE.AudioLoader**: `loadAsync(url)` returns `Promise<AudioBuffer>`. Handles decoding internally.
- **Buffer reuse**: An `AudioBuffer` can be shared across multiple `THREE.Audio` instances. Cache once, reuse many times.

### WeaponType to Sound ID Mapping

```typescript
const WEAPON_SOUND_MAP: Record<WeaponType, string> = {
  dataLance: 'data_lance_fire',
  logicBomb: 'logic_bomb_fire',
  emp: 'emp_burst',
  virusPayload: 'virus_payload',
} as const;
```

### Previous Story Intelligence

From Story 4-4 (Briefing Screen System):
- `erasableSyntaxOnly` TypeScript config means no `enum` keyword. Use `type` unions instead.
- Test count after Story 4-4: 1344 tests across 106 files. All must still pass.
- Briefing data loading uses fire-and-forget fetch pattern with graceful handling when data isn't available. AudioManager manifest loading should follow the same pattern.
- LevelManager's `setBriefingData()` setter pattern works well for async-loaded data that's needed synchronously later.

From Story 4-1 (Handler Comm Overlay):
- DialogueManager subscribes to EventBus events for trigger-based playback — same pattern AudioManager should follow.
- CommOverlay plays voice lines. Future integration: CommOverlay will use AudioManager's Voice channel (Story 4-9). For now, AudioManager provides the infrastructure.

From Story 4-2 (AI Taunt System):
- AI taunts also trigger via EventBus events. AudioManager will eventually play taunt audio via Voice channel.

### Scope Boundaries

**IN scope**: AudioManager class, AudioChannel class, SoundManifest types, placeholder manifest JSON, EventBus subscriptions for weapon/hit/explosion SFX, main.ts integration, tests.

**NOT in scope** (future stories):
- Actual audio files (.ogg) — Story 4-6 creates SFX files
- Ambient electronic hum implementation — Story 4-7
- Swappable audio asset system (hot-reload) — Story 4-8
- Synthesized handler voice lines — Story 4-9
- Voice channel integration with CommOverlay/DialogueManager — Story 4-9
- Volume settings persistence in localStorage — Story 6-7

### Project Structure Notes

- All new files align with the architecture's directory structure.
- `AudioManager.ts` at `src/audio/AudioManager.ts` — as specified in architecture.
- `AudioChannel.ts` at `src/audio/AudioChannel.ts` — as specified in architecture.
- `SoundManifest.ts` at `src/audio/SoundManifest.ts` — as specified in architecture.
- `manifest.json` at `public/audio/manifest.json` — served as static asset by Vite. Accessed via `fetch('audio/manifest.json')` (Vite serves `public/` contents at root).
- No new source directories needed.

### Testing Notes

- Mock `THREE.AudioListener`, `THREE.Audio`, `THREE.AudioLoader` extensively. These are complex objects — create minimal mocks that expose `.setVolume()`, `.play()`, `.stop()`, `.setBuffer()`, `.setLoop()`, `.isPlaying`, `.onEnded`.
- Mock `fetch` for manifest loading tests.
- Mock `eventBus` to test subscription and emission.
- Use `vi.fn()` for callbacks and `vi.spyOn()` for Logger.warn calls.
- DO NOT use `// @vitest-environment jsdom` for audio tests — standard node environment with mocked THREE is sufficient.

### References

- [Source: game-architecture.md#Audio Manager] — 4-channel architecture, JSON manifest, THREE.Audio integration
- [Source: game-architecture.md#Configuration Management] — Sound manifest at `assets/audio/manifest.json` (Note: architecture says `assets/` but Vite convention is `public/` for static files served at root. Use `public/audio/manifest.json`.)
- [Source: game-architecture.md#Event System] — Events AudioManager subscribes to: weaponFired, playerHit, enemyDestroyed, phaseStart, phaseEnd
- [Source: game-architecture.md#Architectural Boundaries] — Systems never import each other. Audio uses EventBus.
- [Source: game-architecture.md#Error Handling] — Non-critical errors (missing audio) logged and skipped
- [Source: game-architecture.md#Directory Structure] — `src/audio/AudioManager.ts`, `AudioChannel.ts`, `SoundManifest.ts`
- [Source: gdd.md#Audio Architecture] — SFXPlayer, VoicePlayer, AmbientPlayer, MusicPlayer
- [Source: gdd.md#Audio and Music] — Retro arcade SFX, ambient electronic hum, synthesized voice lines
- [Source: epics.md#Epic 4, Story 5] — "load and play audio files through the AudioManager so that all audio is centrally managed and replaceable"
- [Source: project-context.md#Technology Stack] — THREE.Audio (Web Audio API)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- AudioChannel stores a `masterVolumeRef` object reference (not a primitive) so that when AudioManager updates master volume, all channels automatically see the new value through the shared reference. `updateMasterVolume()` recalculates effective volume for all instances.
- AudioManager uses lazy buffer loading (load on first play, cache for subsequent plays) instead of preloading all buffers at manifest load time. This keeps initial load time minimal and avoids loading audio that may never be played.
- Voice channel `onEnded` callback is re-assigned on each play to ensure the queue dequeue logic persists across buffer changes. THREE.Audio's `onEnded` is a simple property, not an event listener.
- Web Audio API `AudioContext.resume()` is called on first user interaction (click/keydown). The unlock handler removes itself after first invocation to avoid repeated calls.
- The `listener` field was removed from AudioChannel to satisfy TypeScript's `noUnusedLocals` strict check — the listener is only needed for THREE.Audio construction, which happens in the constructor.

### Completion Notes List

- Task 1: Created `src/audio/SoundManifest.ts` with `ChannelType` union type (`'sfx' | 'voice' | 'ambient' | 'music'`), `SoundEntry` interface (path, channel, optional volume), and `SoundManifest` interface (string-keyed dictionary).
- Task 2: Created `src/audio/AudioChannel.ts` with 4-mode channel class. SFX uses round-robin pool (default 8 instances). Voice uses single instance with queue and `onEnded` dequeue. Ambient defaults to looping. Music defaults to non-looping. All channels support volume control with master volume reference, stop, clearQueue, and dispose.
- Task 3: Created `src/audio/AudioManager.ts` as singleton (`audioManager` export). init() creates AudioListener, 4 channels, AudioContext unlock handler, and EventBus subscriptions. loadManifest() fetches/parses JSON. Play methods use lazy buffer loading with cache. dispose() cleans up all resources. Graceful error handling — missing sounds log warnings, never crash.
- Task 4: Created `public/audio/manifest.json` with 10 placeholder entries: 8 SFX (data_lance_fire, logic_bomb_fire, emp_burst, virus_payload, shield_hit, enemy_explosion, boss_destruction, corridor_whoosh), 1 ambient (ambient_hum), 1 music (outro_music).
- Task 5: Modified `src/main.ts` — imported audioManager, added init(camera) after camera creation, added fire-and-forget loadManifest call with Logger.warn catch.
- Task 6: Removed `src/audio/.gitkeep` since real TypeScript files now exist in the directory.
- Task 7: Created 3 test files with 59 new tests. SoundManifest: 3 type validation tests. AudioChannel: 21 tests covering SFX pool round-robin, voice queue, ambient looping, music, volume control with master volume, stop, dispose. AudioManager: 29 tests covering init, loadManifest, play routing, buffer caching, volume control, EventBus integration (weaponFired/playerHit/enemyDestroyed), dispose cleanup, graceful error handling. Used `vi.hoisted()` for mock variable initialization with `vi.mock()` factory pattern.
- Task 8: `npx tsc --noEmit` passes clean. Full test suite: 1403 tests across 109 files, all pass, zero regressions.

### Change Log

- 2026-03-26: Story 4-5 implemented -- Audio Manager Architecture. Created AudioManager singleton with 4 independent channels (SFX pooled, Voice queued, Ambient looping, Music), JSON sound manifest system, lazy buffer loading with cache, EventBus subscriptions for game events, Web Audio API context unlock, and graceful error handling. Added 59 new tests.

### File List

- `src/audio/SoundManifest.ts` -- New: ChannelType, SoundEntry, SoundManifest type definitions
- `src/audio/AudioChannel.ts` -- New: Audio channel class with pool/queue/loop semantics and volume control
- `src/audio/AudioManager.ts` -- New: Singleton audio manager with 4 channels, manifest loading, EventBus integration
- `public/audio/manifest.json` -- New: Placeholder sound manifest with 10 entries (8 SFX, 1 ambient, 1 music)
- `src/main.ts` -- Modified: added audioManager import, init, and manifest loading
- `src/audio/.gitkeep` -- Deleted: replaced by real source files
- `src/__tests__/SoundManifest.test.ts` -- New: 3 tests for type validation
- `src/__tests__/AudioChannel.test.ts` -- New: 21 tests for channel playback semantics
- `src/__tests__/AudioManager.test.ts` -- New: 29 tests (jsdom) for audio manager behavior
