# Story 4.8: Swappable Audio Assets

Status: review

## Story

As a developer,
I want to swap audio files without code changes,
so that AI-generated audio can be replaced with higher-quality assets later.

## Acceptance Criteria

1. The manifest-driven audio loading system already in AudioManager supports file-based audio as the primary source. When an `.ogg` file exists at the path specified in `public/audio/manifest.json`, AudioManager loads and plays that file. When the file does NOT exist (load fails), AudioManager falls back to the SFXGenerator procedural synthesis. This fallback chain already works (Story 4-6 implemented it in `loadBuffer()`). This story validates and documents the swappable behavior, and adds a manifest reload capability.

2. A `reloadManifest(): Promise<void>` method exists on `AudioManager` that re-fetches `manifest.json`, clears the `bufferCache`, and allows newly placed audio files to take effect without a page reload. This enables a development workflow where the developer drops in a new `.ogg` file, updates `manifest.json` if needed, and calls `audioManager.reloadManifest()` from the browser console to hear the new asset immediately.

3. The `reloadManifest()` method:
   - Fetches the manifest URL (stored from the original `loadManifest()` call).
   - Parses the JSON response and replaces `this.manifest`.
   - Clears `this.bufferCache` so subsequent `play*()` calls re-load from disk.
   - Logs via `Logger.info('Audio', 'Manifest reloaded', { entries: count })`.
   - Handles errors gracefully (Logger.warn, no crash, old manifest preserved on failure).

4. A `window.debug.reloadAudio()` function is exposed in dev builds that calls `audioManager.reloadManifest()`. This gives the developer a quick way to hot-swap audio without touching code. The function is added in `main.ts` inside the existing `if (import.meta.env.DEV)` block.

5. An `AudioAssetValidator` utility class exists at `src/audio/AudioAssetValidator.ts` that validates the manifest against the filesystem. It provides:
   - `validateManifest(manifest: SoundManifest): Promise<AudioValidationReport>` — For each entry in the manifest, attempts a HEAD request to check if the audio file exists. Returns a report listing which sound IDs have files present and which are missing (will use fallback).
   - `AudioValidationReport` type with `{ present: string[]; missing: string[]; total: number }`.
   - This is a development tool only — used for reporting, not gating. Missing files are expected (procedural fallback handles them).

6. A `window.debug.audioStatus()` function is exposed in dev builds that calls `AudioAssetValidator.validateManifest()` and logs the report to the console. This lets the developer see at a glance which sounds have real files and which use procedural fallback.

7. The existing `loadBuffer()` fallback chain in `AudioManager` is verified to work correctly:
   - Try file from manifest path via `THREE.AudioLoader.loadAsync()` -> if success, cache and return.
   - If file load fails, try `SFXGenerator.generate()` -> if success, cache and return.
   - If both fail, `Logger.warn` and return null (game continues without audio for that sound).
   - For ambient audio: `ambient_hum` manifest entry exists but no `.ogg` file -> AmbientHumGenerator procedural fallback is used (already implemented in Story 4-7).

8. The manifest file `public/audio/manifest.json` includes a `_meta` comment field (JSON does not support comments, so use a `_meta` key) documenting the swappable architecture:
   ```json
   {
     "_meta": "Sound manifest — swap .ogg files at paths below without code changes. Missing files fall back to procedural SFX generation.",
     ...existing entries...
   }
   ```

9. Running `npm run build` produces a clean production build with zero TypeScript errors.

10. Unit tests exist (Vitest) for:
    - `AudioManager.reloadManifest()` — re-fetches manifest, clears buffer cache, handles errors gracefully, preserves old manifest on failure.
    - `AudioAssetValidator.validateManifest()` — reports present vs missing files, handles network errors for individual entries, returns correct counts.
    - Existing fallback chain verification — file present plays file, file missing falls back to generator, both missing logs warning.

11. All existing tests continue to pass — zero regressions.

## Tasks / Subtasks

- [x] Task 1: Add reloadManifest() to AudioManager (AC: #2, #3)
  - [x]1.1 Add `private manifestUrl: string = ''` field to AudioManager. Set it in `loadManifest()` so `reloadManifest()` knows where to fetch from.
  - [x]1.2 Implement `async reloadManifest(): Promise<void>`. Fetch from `this.manifestUrl`. On success: replace `this.manifest`, clear `this.bufferCache`, log info. On failure: `Logger.warn`, keep existing manifest unchanged.
  - [x]1.3 Update `dispose()` to reset `manifestUrl`.

- [x] Task 2: Create AudioAssetValidator utility (AC: #5)
  - [x]2.1 Create `src/audio/AudioAssetValidator.ts`. Define `AudioValidationReport` type: `{ present: string[]; missing: string[]; total: number }`.
  - [x]2.2 Implement static `async validateManifest(manifest: SoundManifest): Promise<AudioValidationReport>`. For each entry, send a HEAD fetch request to `entry.path`. If response.ok, add to `present`. If not (404 or error), add to `missing`. Return report with `total = present.length + missing.length`.
  - [x]2.3 Use `Promise.allSettled()` for parallel validation of all entries. Handle individual fetch errors gracefully (mark as missing, don't crash).

- [x] Task 3: Add debug console commands (AC: #4, #6)
  - [x]3.1 In `main.ts`, inside the existing `if (import.meta.env.DEV)` block, add `window.debug.reloadAudio` function that calls `audioManager.reloadManifest()`.
  - [x]3.2 In same block, add `window.debug.audioStatus` function that imports `AudioAssetValidator`, calls `validateManifest()` with the current manifest, and logs the report.
  - [x]3.3 Expand the existing `window.debug` type cast to include `reloadAudio` and `audioStatus` properties.

- [x] Task 4: Update manifest.json with _meta field (AC: #8)
  - [x]4.1 Add `_meta` key to `public/audio/manifest.json` as the first entry, documenting the swappable architecture.

- [x] Task 5: Write tests (AC: #10, #11)
  - [x]5.1 Add tests to `src/__tests__/AudioManager.test.ts` for `reloadManifest()`: re-fetches manifest URL, clears buffer cache (verified by subsequent play triggering new loadAsync), handles fetch failure (old manifest preserved), handles empty manifest URL (no-op or warning).
  - [x]5.2 Create `src/__tests__/AudioAssetValidator.test.ts`. Mock fetch. Test: all files present -> correct report, some missing -> correct present/missing split, network error -> marked as missing, empty manifest -> empty report.
  - [x]5.3 Add fallback chain verification tests to `src/__tests__/AudioManager.test.ts`: file load succeeds -> uses file buffer, file load fails with generator fallback -> uses generated buffer, both fail -> logs warning and returns null.
  - [x]5.4 Run full test suite — all existing tests + new tests pass.

- [x] Task 6: Build verification (AC: #9, #11)
  - [x]6.1 Run `npx tsc --noEmit` — zero TypeScript errors.
  - [x]6.2 Run `npm run test` — all tests pass.

## Dev Notes

### Architecture Compliance

- **AudioManager already at `src/audio/AudioManager.ts`** — only adding new method, not creating new class. [Source: game-architecture.md#Audio Manager]
- **AudioAssetValidator in `src/audio/`** — developer utility in same audio directory. [Source: game-architecture.md#Directory Structure]
- **JSON manifest at `public/audio/manifest.json`** — already exists, adding `_meta` field only. [Source: game-architecture.md#Configuration Management]
- **Debug tools in `if (import.meta.env.DEV)` block** — stripped from production builds. [Source: game-architecture.md#Debug & Development Tools]
- **Non-critical error handling** — missing audio files logged and skipped, game continues. [Source: game-architecture.md#Error Handling]

### Critical Implementation Rules

- **Use `Logger.info('Audio', ...)` / `Logger.warn(...)`** for all logging. NEVER `console.log()`. [Source: project-context.md#Critical Don't-Miss Rules]
- **No `fetch()` during gameplay frames**: `reloadManifest()` is a developer tool called manually, not during gameplay. `validateManifest()` is a debug tool only. [Source: project-context.md#Performance Rules]
- **Systems never import each other**: AudioAssetValidator is a standalone utility, not a system. [Source: project-context.md#Architecture Rules]
- **`erasableSyntaxOnly: true`** in tsconfig: Do NOT use `enum`. Use `type` unions and `as const` objects. [Source: tsconfig.json]
- **`verbatimModuleSyntax: true`**: Use `import type { ... }` for type-only imports. [Source: tsconfig.json]

### Existing Code Patterns to Follow

- **AudioManager singleton**: `export const audioManager = new AudioManager()` — DO NOT create new instance. Add method to existing class.
- **Fallback chain in `loadBuffer()`**: Already tries file -> generator -> null. This story validates and tests this chain, does not change it.
- **Debug API pattern**: Existing `window.debug = { pools: ... }` in main.ts. Extend this object with new functions.
- **Test patterns**: Follow `AudioManager.test.ts` structure. Mock fetch, THREE, EventBus. Use `vi.hoisted()` for mock variables.
- **TypeScript strict mode**: No unused variables, no implicit any, no enum keyword.

### What Already Exists (DO NOT recreate)

- `src/audio/AudioManager.ts` — Singleton with `loadManifest()`, `loadBuffer()` with fallback chain, 4 channels. MODIFY to add `reloadManifest()` and `manifestUrl` tracking.
- `src/audio/SFXGenerator.ts` — Procedural SFX generator with `generate()` and `hasSound()`. DO NOT MODIFY.
- `src/audio/AmbientHumGenerator.ts` — Procedural ambient hum. DO NOT MODIFY.
- `src/audio/AudioChannel.ts` — Channel class. DO NOT MODIFY.
- `src/audio/SoundManifest.ts` — Type definitions (ChannelType, SoundEntry, SoundManifest). DO NOT MODIFY.
- `public/audio/manifest.json` — 10 sound entries. MODIFY to add `_meta` key only.
- `src/main.ts` — Already has audio init, SFX generator, ambient hum generator, and debug block. MODIFY debug block to add reloadAudio/audioStatus.
- `src/core/GameEvents.ts` — DO NOT MODIFY.

### What Must Be Created

- `src/audio/AudioAssetValidator.ts` — Utility to validate manifest against filesystem via HEAD requests.

### What Must Be Modified

- `src/audio/AudioManager.ts` — Add `manifestUrl` field, set in `loadManifest()`, add `reloadManifest()` method, reset in `dispose()`.
- `public/audio/manifest.json` — Add `_meta` key documenting swappable architecture.
- `src/main.ts` — Add `reloadAudio()` and `audioStatus()` to debug window object.

### Fallback Chain Behavior (Existing)

The current `loadBuffer()` in AudioManager already implements the full fallback chain:

```
1. Check bufferCache -> return if cached
2. Try file via audioLoader.loadAsync(path) -> cache & return on success
3. Try SFXGenerator.generate(id) -> cache & return on success
4. Logger.warn & return null (game continues)
```

For ambient audio, `ambient_hum` has a manifest entry with path `audio/ambient/ambient_hum.ogg`. If no file exists there, the file load fails, the SFXGenerator does not have `ambient_hum`, so it returns null. The AmbientHumGenerator handles ambient hum procedurally via a completely separate code path (live oscillators, not buffer-based). This is correct and working.

### `reloadManifest()` Design

```typescript
async reloadManifest(): Promise<void> {
  if (!this.manifestUrl) {
    Logger.warn('Audio', 'No manifest URL set — call loadManifest() first');
    return;
  }
  try {
    const response = await fetch(this.manifestUrl);
    if (!response.ok) {
      Logger.warn('Audio', 'Failed to reload manifest', { status: response.status });
      return;
    }
    this.manifest = await response.json();
    this.bufferCache.clear();
    Logger.info('Audio', 'Manifest reloaded', { entries: Object.keys(this.manifest).length });
  } catch (error) {
    Logger.warn('Audio', 'Failed to reload manifest', { error: String(error) });
  }
}
```

### AudioAssetValidator Design

```typescript
export type AudioValidationReport = {
  present: string[];
  missing: string[];
  total: number;
};

export class AudioAssetValidator {
  static async validateManifest(manifest: SoundManifest): Promise<AudioValidationReport> {
    const entries = Object.entries(manifest).filter(([key]) => key !== '_meta');
    const results = await Promise.allSettled(
      entries.map(async ([id, entry]) => {
        const response = await fetch(entry.path, { method: 'HEAD' });
        return { id, exists: response.ok };
      })
    );
    // ... build report from results
  }
}
```

### Previous Story Intelligence

From Story 4-7 (Ambient Electronic Hum):
- AmbientHumGenerator connects to live AudioContext via `registerAmbientGenerator()`. Completely separate from the file-based buffer chain. No conflict with swappable assets.
- If `ambient_hum.ogg` file is ever placed, the file-based `playAmbient('ambient_hum')` path would play it. The procedural generator provides the fallback. Story 4-7 AC#9 explicitly designed for this coexistence.
- Test count after Story 4-7: 1481 tests across 111 files. All must still pass.

From Story 4-6 (Retro SFX for Weapons and Actions):
- SFXGenerator fallback chain was established: AudioManager.loadBuffer() tries file first, then generator. This is the core swappable mechanism.
- `SFXGenerator.hasSound(id)` check in `playOnChannel()` prevents "Sound not found in manifest" warning when generator can handle the sound.

From Story 4-5 (Audio Manager Architecture):
- AudioManager singleton, 4 channels, lazy buffer loading with cache. The cache must be clearable for reload to work.
- Mock pattern: `vi.hoisted()` for mock variables, `vi.mock()` factories, `// @vitest-environment jsdom`.

### Scope Boundaries

**IN scope**: `reloadManifest()` method, `AudioAssetValidator` utility, debug console commands (`reloadAudio`, `audioStatus`), manifest `_meta` field, tests for all new functionality plus fallback chain verification.

**NOT in scope** (future stories):
- Synthesized handler voice lines — Story 4-9
- Actual replacement `.ogg` audio files — developer drops these in manually
- Volume settings UI or persistence — Story 6-7
- Final audio polish — Story 6-7

### Project Structure Notes

- All new files align with the architecture's directory structure.
- `AudioAssetValidator.ts` at `src/audio/AudioAssetValidator.ts` — alongside other audio utilities.
- No new directories needed.
- No new dependencies needed.

### Testing Notes

- For `reloadManifest()` tests: Mock fetch to return new manifest. Verify bufferCache is cleared by checking that subsequent play calls trigger new loadAsync calls (not served from cache).
- For `AudioAssetValidator` tests: Mock fetch to return ok/404 for different paths. Verify present/missing arrays. Test Promise.allSettled error handling.
- For fallback chain tests: Already partially covered in existing AudioManager tests (buffer load failure). Add explicit test for: file succeeds (no generator call), file fails + generator succeeds, both fail.
- AudioAssetValidator tests do NOT need jsdom — standard node environment with mocked fetch.
- AudioManager tests already use `// @vitest-environment jsdom`.

### References

- [Source: gdd.md#Audio Architecture] — "All audio files stored as replaceable assets — swap AI-generated audio for hand-crafted alternatives without code changes. Modular architecture is non-negotiable."
- [Source: gdd.md#Production Approach] — "Architecture supports drop-in replacement — if AI-generated audio doesn't meet quality bar, swap in hand-crafted or sourced alternatives without code changes."
- [Source: game-architecture.md#Audio Manager] — "JSON sound manifest maps IDs to file paths — swap files without code changes"
- [Source: game-architecture.md#Configuration Management] — "Sound manifest: assets/audio/manifest.json, Loaded at runtime by AudioManager"
- [Source: game-architecture.md#Error Handling] — "Non-critical errors (missing audio file): log and skip, game continues"
- [Source: epics.md#Epic 4, Story 8] — "swap audio files without code changes so that AI-generated audio can be replaced with higher-quality assets later"
- [Source: project-context.md#Technology Stack] — THREE.Audio (Web Audio API)
- [Source: project-context.md#Critical Implementation Rules] — Logger, EventBus patterns

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- AudioManager.reloadManifest() stores the manifest URL from the initial loadManifest() call and reuses it for reloads. On success, it replaces the manifest and clears the buffer cache so subsequent play calls re-fetch from disk. On failure, the old manifest is preserved unchanged.
- AudioAssetValidator uses HEAD fetch requests via Promise.allSettled() for parallel validation. Each entry that fails (404, network error, or rejection) is classified as "missing". The _meta key is filtered out before validation.
- The debug window API (window.debug.reloadAudio / audioStatus) is added inside the existing import.meta.env.DEV block so it's stripped from production builds. audioStatus uses dynamic import of AudioAssetValidator to avoid pulling it into the main bundle.
- The existing loadBuffer() fallback chain (file -> generator -> null) was validated through explicit tests verifying each branch: file succeeds (no generator call), file fails + generator succeeds, and both fail (Logger.warn).

### Completion Notes List

- Task 1: Modified `src/audio/AudioManager.ts` -- added `manifestUrl` field (set in loadManifest), `reloadManifest()` method that re-fetches manifest, clears bufferCache, handles errors gracefully. Updated `dispose()` to reset manifestUrl.
- Task 2: Created `src/audio/AudioAssetValidator.ts` with `AudioValidationReport` type and static `validateManifest()` method. Uses HEAD requests via Promise.allSettled() to check file presence. Filters out `_meta` key. Logs completion report via Logger.info.
- Task 3: Modified `src/main.ts` -- expanded `window.debug` object with `reloadAudio()` (calls audioManager.reloadManifest) and `audioStatus()` (dynamic imports AudioAssetValidator, validates manifest, logs report). Updated type cast to include new properties.
- Task 4: Modified `public/audio/manifest.json` -- added `_meta` key documenting the swappable architecture.
- Task 5: Added 10 new tests to `src/__tests__/AudioManager.test.ts` for reloadManifest (re-fetch, cache clear, fetch failure preservation, network error, no URL warning, dispose reset) and fallback chain verification (file success, file fail + generator, both fail). Created `src/__tests__/AudioAssetValidator.test.ts` with 8 tests covering all present, all missing, mixed results, network errors, empty manifest, _meta filtering, HEAD method verification, and logging.
- Task 6: `npx tsc --noEmit` passes clean. Full test suite: 1499 tests across 112 files, all pass, zero regressions.

### Change Log

- 2026-03-26: Story 4-8 implemented -- Swappable Audio Assets. Added reloadManifest() to AudioManager for hot-swapping audio files without page reload. Created AudioAssetValidator utility for development-time manifest validation. Added debug console commands (reloadAudio, audioStatus). Added _meta documentation field to manifest.json. Verified existing fallback chain. Added 18 new tests.

### File List

- `src/audio/AudioManager.ts` -- Modified: added manifestUrl field, reloadManifest() method, manifestUrl reset in dispose()
- `src/audio/AudioAssetValidator.ts` -- New: Development utility for manifest-to-filesystem validation via HEAD requests
- `src/main.ts` -- Modified: added window.debug.reloadAudio and window.debug.audioStatus in dev block
- `public/audio/manifest.json` -- Modified: added _meta key documenting swappable architecture
- `src/__tests__/AudioManager.test.ts` -- Modified: added 10 tests for reloadManifest and fallback chain verification
- `src/__tests__/AudioAssetValidator.test.ts` -- New: 8 tests for manifest validation utility
