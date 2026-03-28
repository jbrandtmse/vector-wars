# Story 6.6: Electron Desktop Wrapper

Status: review

## Story

As a developer,
I want to package the game as an Electron app for Mac and Windows so that desktop distribution is available as an optional secondary platform.

## Acceptance Criteria

1. **Electron Main Process File:** A file `electron/main.ts` exists that creates a `BrowserWindow` loading the Vite-built `dist/index.html` in production mode. The window opens at 1280x800 with no menu bar. `nodeIntegration` is `false` and `contextIsolation` is `true`. The app quits when all windows are closed (including on macOS).

2. **Electron Preload Script:** A file `electron/preload.ts` exists that uses `contextBridge` to expose a minimal `electronAPI` object to the renderer containing only `{ isElectron: true }`. No Node.js APIs are exposed to the renderer. This is a security-hardened preload script.

3. **Electron Builder Configuration:** `package.json` contains an `"electron-builder"` (or `electron-builder.json5`) configuration that builds:
   - Windows: portable `.exe` (no installer needed — single executable)
   - Mac: `.dmg` disk image
   - The `dist/` folder (Vite build output) is packaged as the app's renderer content
   - `appId` is set to `"com.vectorwars.app"`
   - `productName` is `"Vector Wars"`

4. **Build Scripts:** `package.json` has scripts:
   - `"electron:dev"` — Builds the Vite app, compiles Electron TypeScript files, and launches Electron pointing at the local `dist/` folder for development testing
   - `"electron:build"` — Runs `npm run build` (Vite production build), compiles Electron TS, then runs `electron-builder` to produce platform installers

5. **Electron TypeScript Compilation:** A `tsconfig.electron.json` exists that extends the base tsconfig but targets Node.js (CommonJS output, Node types) and includes only `electron/` directory files. The compiled JS output goes to `electron-dist/`.

6. **No Changes to Game Code:** The existing game source in `src/` is NOT modified. The Electron wrapper loads `dist/index.html` exactly as a browser would. No conditional Electron code in `src/`. The `base: './'` relative paths in the Vite build work correctly when loaded from the local filesystem via Electron.

7. **Window Behavior:** The Electron window has no default menu bar (use `Menu.setApplicationMenu(null)`). The window is resizable. The title bar shows "Vector Wars". The window background color is `#000000` to match the game.

8. **GitHub Actions Workflow (Optional):** A file `.github/workflows/electron-build.yml` exists that can be manually triggered (`workflow_dispatch`) to build Electron packages. It uses a matrix strategy for `windows-latest` and `macos-latest` runners. Built artifacts are uploaded as workflow artifacts (NOT published to GitHub Releases — that is a manual step). This workflow is separate from the existing `deploy.yml`.

9. Running `npx tsc --noEmit` produces zero TypeScript errors (for the main web project — Electron files use their own tsconfig).

10. Running `npx tsc --noEmit -p tsconfig.electron.json` produces zero TypeScript errors for the Electron files.

11. Unit tests exist (Vitest) for:
    - `electron/main.ts` exists and exports or defines a `createWindow` function
    - `electron/preload.ts` exists and references `contextBridge`
    - `tsconfig.electron.json` exists and is valid JSON
    - `package.json` contains `electron:dev` and `electron:build` scripts
    - `package.json` contains electron-builder config with `appId` and `productName`
    - `.github/workflows/electron-build.yml` exists and is valid YAML with `workflow_dispatch` trigger
    - `.github/workflows/electron-build.yml` contains matrix strategy for windows and macos

12. All existing tests continue to pass — zero regressions.

## Tasks / Subtasks

- [x] Task 1: Install Electron dev dependencies (AC: #3)
  - [x] 1.1 Install `electron` and `electron-builder` as devDependencies
  - [x] 1.2 Verify no conflicts with existing dependencies (Three.js, Vite, Vitest)

- [x] Task 2: Create Electron main process file (AC: #1, #7)
  - [x] 2.1 Create `electron/main.ts` with `BrowserWindow` configuration
  - [x] 2.2 Load `dist/index.html` using `path.join(__dirname, '../dist/index.html')`
  - [x] 2.3 Set window size 1280x800, backgroundColor `#000000`, no menu bar
  - [x] 2.4 Set `nodeIntegration: false`, `contextIsolation: true`
  - [x] 2.5 Handle `window-all-closed` to quit on all platforms (including macOS)
  - [x] 2.6 Handle `activate` event for macOS dock re-open (create window if none exist)

- [x] Task 3: Create Electron preload script (AC: #2)
  - [x] 3.1 Create `electron/preload.ts` with `contextBridge.exposeInMainWorld`
  - [x] 3.2 Expose only `{ isElectron: true }` — no Node APIs

- [x] Task 4: Create Electron TypeScript config (AC: #5)
  - [x] 4.1 Create `tsconfig.electron.json` targeting Node/CommonJS
  - [x] 4.2 Include only `electron/` directory
  - [x] 4.3 Output compiled JS to `electron-dist/`
  - [x] 4.4 Include `@types/node` and Electron types

- [x] Task 5: Configure electron-builder (AC: #3)
  - [x] 5.1 Add `"build"` config to `package.json` (or `electron-builder.json5`)
  - [x] 5.2 Set `appId: "com.vectorwars.app"`, `productName: "Vector Wars"`
  - [x] 5.3 Configure `files` to include `electron-dist/` and `dist/`
  - [x] 5.4 Configure Windows target: portable exe
  - [x] 5.5 Configure Mac target: dmg
  - [x] 5.6 Set `directories.output` to `electron-out/`

- [x] Task 6: Add build scripts to package.json (AC: #4)
  - [x] 6.1 Add `"electron:dev"` script: builds Vite, compiles Electron TS, runs electron
  - [x] 6.2 Add `"electron:build"` script: production build + electron-builder
  - [x] 6.3 Ensure existing `dev`, `build`, `test` scripts are untouched

- [x] Task 7: Create GitHub Actions workflow (AC: #8)
  - [x] 7.1 Create `.github/workflows/electron-build.yml` with `workflow_dispatch` trigger
  - [x] 7.2 Matrix strategy: `windows-latest` and `macos-latest`
  - [x] 7.3 Steps: checkout, setup Node 20, npm ci, npm run build, compile Electron TS, electron-builder
  - [x] 7.4 Upload artifacts from `electron-out/`

- [x] Task 8: Update .gitignore (AC: #6)
  - [x] 8.1 Add `electron-dist/` (compiled Electron JS) to .gitignore
  - [x] 8.2 Add `electron-out/` (electron-builder output) to .gitignore

- [x] Task 9: Write tests (AC: #11, #12)
  - [x] 9.1 Create `src/__tests__/ElectronWrapper.test.ts`
  - [x] 9.2 Test electron/main.ts exists and contains createWindow
  - [x] 9.3 Test electron/preload.ts exists and references contextBridge
  - [x] 9.4 Test tsconfig.electron.json exists and is valid JSON
  - [x] 9.5 Test package.json has electron:dev and electron:build scripts
  - [x] 9.6 Test package.json has electron-builder config
  - [x] 9.7 Test workflow file exists, is valid YAML, has workflow_dispatch and matrix
  - [x] 9.8 Verify all existing tests pass

- [x] Task 10: Type-check verification (AC: #9, #10)
  - [x] 10.1 Run `npx tsc --noEmit` — zero errors for main project
  - [x] 10.2 Run `npx tsc --noEmit -p tsconfig.electron.json` — zero errors for Electron files
  - [x] 10.3 Run `npx vitest run` — all tests pass, zero regressions

## Dev Notes

### Architecture Compliance

- **No game code changes:** Electron loads `dist/index.html` as-is. The `base: './'` relative paths work from local filesystem. [Source: project-context.md#Platform & Build Rules]
- **Secondary platform:** Electron is explicitly secondary priority. Browser version ships first. [Source: gdd.md#Desktop App (Secondary)]
- **Guaranteed WebGL consistency:** Electron bundles Chromium, so WebGL rendering is identical to Chrome. [Source: gdd.md#Desktop App]
- **No server infrastructure:** Electron loads static files locally. No backend needed. [Source: game-architecture.md#Constraints]
- **localStorage works in Electron:** High score persistence via localStorage works identically in Electron. [Source: game-architecture.md#Persistence]

### Key Implementation Details

**electron/main.ts pattern:**
```typescript
import { app, BrowserWindow, Menu } from 'electron';
import path from 'path';

Menu.setApplicationMenu(null);

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'Vector Wars',
    backgroundColor: '#000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  win.loadFile(path.join(__dirname, '../dist/index.html'));
  return win;
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
```

**electron/preload.ts pattern:**
```typescript
import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
});
```

**tsconfig.electron.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "node",
    "outDir": "electron-dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": false,
    "types": ["node"]
  },
  "include": ["electron/**/*.ts"]
}
```

**electron-builder config in package.json:**
```json
{
  "build": {
    "appId": "com.vectorwars.app",
    "productName": "Vector Wars",
    "directories": {
      "output": "electron-out"
    },
    "files": [
      "electron-dist/**/*",
      "dist/**/*"
    ],
    "win": {
      "target": "portable"
    },
    "mac": {
      "target": "dmg"
    }
  }
}
```

**package.json scripts to add:**
```json
{
  "main": "electron-dist/main.js",
  "electron:dev": "npm run build && tsc -p tsconfig.electron.json && electron .",
  "electron:build": "npm run build && tsc -p tsconfig.electron.json && electron-builder"
}
```

**GitHub Actions workflow (.github/workflows/electron-build.yml):**
```yaml
name: Build Electron App

on:
  workflow_dispatch:

jobs:
  build:
    strategy:
      matrix:
        os: [windows-latest, macos-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npm run build
      - run: npx tsc -p tsconfig.electron.json
      - run: npx electron-builder --publish never
      - uses: actions/upload-artifact@v4
        with:
          name: electron-${{ matrix.os }}
          path: electron-out/*
```

### Critical Pitfalls

- **`"main"` field in package.json:** electron-builder and Electron itself use the `"main"` field to find the main process entry point. This MUST point to `electron-dist/main.js` (the compiled output). However, the current `package.json` does NOT have a `"main"` field. Adding it should not affect Vite's web build.
- **File paths in Electron:** `dist/index.html` references assets with relative paths (`./assets/...`). When loaded via `win.loadFile()`, the base URL is the `dist/` directory, so relative paths resolve correctly.
- **Audio in Electron:** Web Audio API works in Electron's Chromium. `public/audio/` files are included in `dist/` by Vite and accessible from the packaged app.
- **`fetch()` for JSON data:** The game fetches JSON from `assets/briefings/`, `assets/dialogue/` etc. These are in `public/assets/` which Vite copies to `dist/assets/`. In Electron, `file://` protocol fetch works for local files when loaded via `loadFile()`.
- **Do NOT add electron as a regular dependency** — it must be a devDependency. electron-builder handles bundling the Electron runtime into the packaged app.
- **Do NOT modify existing scripts** — `dev`, `build`, `test`, `preview` must remain unchanged.
- **`.gitignore` additions** — `electron-dist/` and `electron-out/` must be ignored. Do not ignore `electron/` (source files).

### Previous Story Intelligence (6-5)

- Story 6-5 set up GitHub Actions for web deployment — the Electron workflow is a separate, manually-triggered workflow
- JSON data files were moved to `public/assets/` in 6-5 — they are now correctly included in `dist/` builds
- Build output verified: 789.91 KB uncompressed, 193.53 KB gzipped
- 139 test files, 2030 tests all passing
- `vite.config.ts` has `base: './'` which produces relative paths — critical for Electron file:// loading
- Project uses Vitest 4.1.2, TypeScript 5.9.3, Vite 8.0.1, Three.js 0.183.2

### Project Structure Notes

- `electron/main.ts` — New: Electron main process entry point
- `electron/preload.ts` — New: Security-hardened preload script
- `tsconfig.electron.json` — New: TypeScript config for Electron files (separate from web tsconfig)
- `electron-dist/` — New: Compiled Electron JS output (gitignored)
- `electron-out/` — New: electron-builder packaged output (gitignored)
- `.github/workflows/electron-build.yml` — New: Manual-trigger workflow for Electron builds
- `src/__tests__/ElectronWrapper.test.ts` — New: Tests for Electron configuration

### References

- [Source: epics.md#Epic 6 Story 6] — Package game as Electron app for Mac and Windows
- [Source: gdd.md#Desktop App (Secondary)] — Electron wrapper, Mac .dmg + Windows .exe, electron-builder, GitHub Releases distribution
- [Source: project-context.md#Platform & Build Rules] — Secondary: Electron desktop (Mac + Windows) — deferred to Epic 6
- [Source: game-architecture.md#Technical Requirements] — Electron desktop wrapper (Mac + Windows) — secondary priority
- [Source: game-architecture.md#Validation] — Electron wrapper intentionally deferred to Epic 6, requires no architectural changes

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- `npx tsc --noEmit` -- zero errors (main project)
- `npx tsc --noEmit -p tsconfig.electron.json` -- zero errors (Electron files)
- `npx vitest run` -- 140 test files, 2067 tests passed, zero failures

### Completion Notes List

- Installed `electron` (v41.1.0) and `electron-builder` (v26.8.1) as devDependencies. No conflicts with existing dependencies.
- Created `electron/main.ts` -- Electron main process that creates a 1280x800 BrowserWindow loading `dist/index.html`. Menu bar removed, background black, security-hardened with `nodeIntegration: false` and `contextIsolation: true`. Handles `window-all-closed` (quits on all platforms) and `activate` (macOS dock re-open).
- Created `electron/preload.ts` -- Minimal preload script exposing only `{ isElectron: true }` via `contextBridge`. No Node.js APIs exposed to renderer.
- Created `tsconfig.electron.json` -- Separate TypeScript config targeting CommonJS/Node.js, compiling `electron/` files to `electron-dist/`. Uses `@types/node` types.
- Added electron-builder configuration to `package.json` with `appId: "com.vectorwars.app"`, `productName: "Vector Wars"`, Windows portable exe target, Mac dmg target, output to `electron-out/`.
- Added `"main": "electron-dist/main.js"` to `package.json` for Electron entry point. All existing scripts (`dev`, `build`, `test`, `preview`, `test:watch`) preserved unchanged.
- Added `electron:dev` script (builds web app, compiles Electron TS, launches Electron) and `electron:build` script (production build + electron-builder packaging).
- Created `.github/workflows/electron-build.yml` -- Manual-trigger workflow with matrix strategy for `windows-latest` and `macos-latest`. Builds web app, compiles Electron TS, runs electron-builder, uploads artifacts. Separate from existing `deploy.yml`.
- Updated `.gitignore` to exclude `electron-dist/` (compiled JS) and `electron-out/` (packaged app output).
- Created `src/__tests__/ElectronWrapper.test.ts` with 37 tests covering: main process file existence and configuration, preload script security, TypeScript config validity, package.json scripts and electron-builder config, GitHub Actions workflow structure and matrix strategy, preservation of existing scripts.
- All 2067 tests pass across 140 test files. Zero regressions.

### File List

- `electron/main.ts` (new -- Electron main process entry point)
- `electron/preload.ts` (new -- Security-hardened preload script)
- `tsconfig.electron.json` (new -- TypeScript config for Electron files)
- `.github/workflows/electron-build.yml` (new -- Manual-trigger workflow for Electron builds)
- `src/__tests__/ElectronWrapper.test.ts` (new -- 37 tests for Electron configuration validation)
- `package.json` (modified -- added main field, electron scripts, electron-builder config, electron/electron-builder devDependencies)
- `.gitignore` (modified -- added electron-dist/ and electron-out/)
- `_bmad-output/implementation-artifacts/6-6-electron-desktop-wrapper.md` (new -- story file)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified -- status updates)
