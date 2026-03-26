# Story 1.1: Vite + Three.js Project Setup

Status: done

## Story

As a developer,
I want to set up a Vite + Three.js project,
so that I have a working development environment with HMR.

## Acceptance Criteria

1. Running `npm run dev` launches a Vite dev server with Hot Module Replacement (HMR) at `localhost:5173`
2. Running `npm run build` produces a static production build in `dist/` suitable for GitHub Pages deployment
3. The project uses TypeScript in strict mode with all source files as `.ts`
4. Three.js r183 is installed and a basic `WebGLRenderer` renders a scene with a `PerspectiveCamera` to a full-viewport canvas
5. The canvas fills the entire browser viewport (100vw x 100vh) with no scrollbars, margins, or padding
6. The renderer uses WebGL 2.0 context and has tone mapping enabled (`ACESFilmicToneMapping`) for future bloom pass compatibility
7. `renderer.setAnimationLoop()` drives the render loop (not manual `requestAnimationFrame`)
8. Delta time is calculated per frame with `Math.min(dt, 1/20)` cap to prevent tunneling
9. The window resize handler updates camera aspect ratio, projection matrix, and renderer size
10. A simple visible test object (e.g., wireframe cube using `LineSegments` + `LineBasicMaterial` in green `0x00ff00`) confirms rendering works
11. The project directory structure follows the architecture specification (see File Structure below)
12. All core infrastructure placeholder files are created (empty or minimal) per the architecture directory layout
13. The `vite.config.ts` includes `define` for `__DEV__` flag that enables debug code stripping in production builds
14. TypeScript path aliases are NOT configured (Vite 8 supports them but they add complexity -- use relative imports)
15. `index.html` contains a single `<div id="app">` and a `<script type="module" src="/src/main.ts">` entry

## Tasks / Subtasks

- [x] Task 1: Scaffold Vite project (AC: #1, #2, #3)
  - [x] 1.1 Run `npm create vite@latest vector-wars -- --template vanilla-ts` (or equivalent if already in repo root)
  - [x] 1.2 Verify `package.json` has correct scripts: `dev`, `build`, `preview`
  - [x] 1.3 Set `tsconfig.json` to strict mode (`"strict": true`)
  - [x] 1.4 Confirm Node.js 20.19+ or 22.12+ (Vite 8 requirement)

- [x] Task 2: Install Three.js dependencies (AC: #4)
  - [x] 2.1 Run `npm install three@^0.183.0`
  - [x] 2.2 Run `npm install -D @types/three@^0.183.0`
  - [x] 2.3 Verify imports resolve: `import * as THREE from 'three'`

- [x] Task 3: Configure Vite (AC: #2, #13)
  - [x] 3.1 Create `vite.config.ts` with:
    ```typescript
    import { defineConfig } from 'vite';

    export default defineConfig(({ mode }) => ({
      base: './',  // GitHub Pages compatibility
      define: {
        __DEV__: JSON.stringify(mode !== 'production'),
      },
      build: {
        target: 'esnext',
        outDir: 'dist',
      },
    }));
    ```
  - [x] 3.2 Create `src/global.d.ts` with `declare const __DEV__: boolean;`

- [x] Task 4: Set up index.html (AC: #5, #15)
  - [x] 4.1 Update `index.html`:
    ```html
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Vector Wars</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
        #app { width: 100vw; height: 100vh; }
      </style>
    </head>
    <body>
      <div id="app"></div>
      <script type="module" src="/src/main.ts"></script>
    </body>
    </html>
    ```

- [x] Task 5: Create core entry point and renderer (AC: #4, #6, #7, #8, #9, #10)
  - [x] 5.1 Create `src/main.ts` as the application entry point
  - [x] 5.2 Initialize `THREE.WebGLRenderer` with antialiasing, append to `#app`
  - [x] 5.3 Enable tone mapping: `renderer.toneMapping = THREE.ACESFilmicToneMapping`
  - [x] 5.4 Set `renderer.toneMappingExposure = 1.0`
  - [x] 5.5 Create `THREE.PerspectiveCamera` (FOV ~70, near 0.01, far 1000)
  - [x] 5.6 Create `THREE.Scene` with black background
  - [x] 5.7 Implement delta time calculation with cap:
    ```typescript
    let lastTime = 0;
    renderer.setAnimationLoop((time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 1 / 20);
      lastTime = time;
      // update(dt) goes here
      renderer.render(scene, camera); // temporary - will be replaced by EffectComposer
    });
    ```
  - [x] 5.8 Add window resize handler updating camera aspect, projection matrix, and renderer size
  - [x] 5.9 Create a test wireframe cube:
    ```typescript
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const edges = new THREE.EdgesGeometry(geometry);
    const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    const wireframe = new THREE.LineSegments(edges, material);
    scene.add(wireframe);
    ```
  - [x] 5.10 Position camera at z=3 looking at origin, slowly rotate cube in update loop to confirm animation works

- [x] Task 6: Create project directory structure (AC: #11, #12)
  - [x] 6.1 Create all directories per architecture spec:
    ```
    src/
      core/
      config/
      state/
        states/
        phases/
      entities/
        player/
        enemies/
        bosses/
        projectiles/
        effects/
      ai/
        states/
      systems/
      rendering/
        shaders/
      audio/
      narrative/
      ui/
        hud/
        screens/
          styles/
      debug/
      types/
    assets/
      levels/
      bosses/
      dialogue/
    public/
      audio/
        sfx/
        voice/
        ambient/
        music/
      fonts/
    ```
  - [x] 6.2 Create placeholder files with minimal exports (empty class or type stub) for core infrastructure:
    - `src/core/EventBus.ts` -- `export class EventBus {}` placeholder
    - `src/core/GameEvents.ts` -- `export interface GameEvents {}` placeholder
    - `src/core/InputManager.ts` -- `export class InputManager {}` placeholder
    - `src/core/Logger.ts` -- `export class Logger {}` placeholder
    - `src/core/ErrorHandler.ts` -- `export class ErrorHandler {}` placeholder
    - `src/core/ObjectPool.ts` -- `export class ObjectPool<T> {}` placeholder
    - `src/config/constants.ts` -- `export const BLOOM_LAYER = 1;` and other shared constants
    - `src/config/rendering.ts` -- rendering config placeholder
    - `src/config/input.ts` -- input config placeholder
    - `src/types/game.ts` -- shared type definitions placeholder
    - `src/types/three-extensions.d.ts` -- Three.js addon type declarations
    - `src/global.d.ts` -- `declare const __DEV__: boolean;`
  - [x] 6.3 Add `.gitkeep` files to empty asset directories (`assets/levels/`, `assets/bosses/`, `assets/dialogue/`, `public/audio/sfx/`, etc.)

- [x] Task 7: Verify build and dev server (AC: #1, #2)
  - [x] 7.1 Run `npm run dev` -- confirm HMR works, green wireframe cube renders, no console errors
  - [x] 7.2 Run `npm run build` -- confirm clean production build in `dist/`
  - [x] 7.3 Run `npm run preview` -- confirm production build serves correctly
  - [x] 7.4 Verify `__DEV__` is `true` in dev, `false` in production build output

## Dev Notes

### Architecture Compliance

This is the **foundation story** for the entire project. Every subsequent story depends on the patterns established here. Get these right:

- **Renderer:** `THREE.WebGLRenderer` with WebGL 2.0. Enable tone mapping now even though bloom comes in Story 1-2/1-7. The `UnrealBloomPass` requires `renderer.toneMapping` to be set or the screen goes white.
- **Animation loop:** Use `renderer.setAnimationLoop()` exclusively. Never use manual `requestAnimationFrame()`. This is the Three.js recommended pattern for cross-platform compatibility.
- **Delta time pattern:** `Math.min((time - lastTime) / 1000, 1/20)` -- the 1/20 cap prevents physics tunneling on tab-switches. All future `update(dt)` calls depend on this pattern.
- **Materials:** For the test wireframe, use `THREE.LineBasicMaterial` directly. In Story 1-2, the `VectorMaterials` singleton will be created, and all future material creation must go through it. The test cube material is temporary and will be replaced.

### Critical Technical Details

**Vite 8.0.3 specifics:**
- Requires Node.js 20.19+ or 22.12+
- Uses Rolldown (Rust-based bundler) -- 10-30x faster builds than Vite 5/6
- `define` option replaces constants at build time; `__DEV__` blocks are dead-code eliminated in production
- Do NOT enable `resolve.tsconfigPaths` -- adds unnecessary complexity for this project
- `base: './'` in config is critical for GitHub Pages deployment (relative paths)

**Three.js r183 specifics:**
- Install: `npm install three@^0.183.0` and `npm install -D @types/three@^0.183.0`
- Core imports: `import * as THREE from 'three'`
- Addon imports use `three/addons/` path (NOT `three/examples/jsm/`):
  - `import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'`
  - `import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'`
  - `import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'`
  - `import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'`
  - `import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'`
  - `import { FXAAShader } from 'three/addons/shaders/FXAAShader.js'`
  - `import { Line2 } from 'three/addons/lines/Line2.js'`
  - `import { LineMaterial } from 'three/addons/lines/LineMaterial.js'`
  - `import { LineGeometry } from 'three/addons/lines/LineGeometry.js'`
- These import paths are documented here for ALL future stories to reference. The dev agent for Story 1-2+ should use these exact paths.

**TypeScript strict mode (`tsconfig.json`):**
- Ensure `"strict": true` is set
- Ensure `"target": "ESNext"` and `"module": "ESNext"` for Vite compatibility
- Ensure `"moduleResolution": "bundler"` for Vite 8

### What NOT to Do

- Do NOT install any game engine library (PlayCanvas, Babylon.js, etc.) -- Three.js is the rendering library, all game systems are custom
- Do NOT install a physics engine -- vector math + bounding spheres are sufficient
- Do NOT create any game logic, input handling, or gameplay code -- this story is ONLY project scaffolding + rendering validation
- Do NOT use `console.log()` -- even for the test cube, prefer keeping it simple. The `Logger` class comes in a future story but is created as a placeholder here
- Do NOT create the post-processing pipeline (EffectComposer, bloom, CRT) -- that is Story 1-7
- Do NOT create `VectorMaterials` singleton -- that is Story 1-2
- Do NOT add Stats.js or debug tools -- that comes in a later story. Just create the `src/debug/` directory placeholder
- Do NOT use `new LineBasicMaterial()` for anything other than the temporary test cube. All future material creation must go through `VectorMaterials.create()` (Story 1-2)

### Placeholder Files Guidance

Placeholder files should contain the **minimum viable export** so that future imports resolve without errors:

```typescript
// Example: src/core/EventBus.ts
export class EventBus {
  // Implementation in Story 2-x
}

// Example: src/core/Logger.ts
export class Logger {
  static debug(system: string, message: string, context?: Record<string, unknown>): void {}
  static info(system: string, message: string, context?: Record<string, unknown>): void {}
  static warn(system: string, message: string, context?: Record<string, unknown>): void {}
  static error(system: string, message: string, context?: Record<string, unknown>): void {}
}

// Example: src/config/constants.ts
export const BLOOM_LAYER = 1;
export const DELTA_TIME_CAP = 1 / 20;
export const MAX_POOL_SIZE = {
  dataLanceBolt: 50,
  enemyDataBurst: 30,
  vectorShard: 200,
  logicBomb: 10,
} as const;
```

### Project Structure Notes

- Directory layout must match architecture spec exactly: `src/core/`, `src/state/`, `src/entities/`, `src/ai/`, `src/systems/`, `src/rendering/`, `src/audio/`, `src/narrative/`, `src/ui/hud/`, `src/ui/screens/styles/`, `src/debug/`, `src/config/`, `src/types/`
- Asset directories: `assets/levels/`, `assets/bosses/`, `assets/dialogue/`
- Public static assets: `public/audio/sfx/`, `public/audio/voice/`, `public/audio/ambient/`, `public/audio/music/`, `public/fonts/`
- File naming convention: `PascalCase.ts` for TypeScript source, `kebab-case.json` for data, `snake_case.ogg` for audio
- No conflicts with existing repo structure -- the repo currently only has `_bmad-output/` and `.claude/` directories

### References

- [Source: _bmad-output/game-architecture.md#Engine & Framework] -- Vite 8.0.3 + Three.js r183 stack decision and initialization commands
- [Source: _bmad-output/game-architecture.md#Project Structure] -- Complete directory structure and naming conventions
- [Source: _bmad-output/game-architecture.md#Game Loop] -- `setAnimationLoop` + delta time cap pattern
- [Source: _bmad-output/game-architecture.md#Architectural Boundaries] -- Entity/system/UI separation rules
- [Source: _bmad-output/game-architecture.md#Cross-cutting Concerns] -- Logging format, error handling, config management
- [Source: _bmad-output/game-architecture.md#Selective Bloom Pipeline] -- BLOOM_LAYER constant, tone mapping requirement
- [Source: _bmad-output/project-context.md#Technology Stack & Versions] -- Version constraints and critical rules
- [Source: _bmad-output/project-context.md#Code Organization Rules] -- Naming conventions and directory reference
- [Source: _bmad-output/epics.md#Epic 1] -- Epic 1 scope (includes/excludes) and Story 1 definition

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Implementation Plan

- Scaffolded Vite 8.0.3 project using `npm create vite@latest` with `vanilla-ts` template
- Installed Three.js r183 (`three@^0.183.2`) and `@types/three@^0.183.0`
- Created `vite.config.ts` with `__DEV__` define flag, `base: './'` for GitHub Pages, and `esnext` build target
- Created `index.html` with full-viewport styles (no scrollbars/margins), `#app` container, and module script entry
- Implemented `src/main.ts` with WebGLRenderer (antialias, ACESFilmicToneMapping), PerspectiveCamera (FOV 70, z=3), Scene (black background), green wireframe cube (EdgesGeometry + LineBasicMaterial), resize handler, and setAnimationLoop with delta time cap
- Extracted delta time calculation into `src/core/DeltaTime.ts` for testability and reuse
- Created full directory structure per architecture spec (26 directories)
- Created 12 placeholder files with minimal viable exports following Dev Notes guidance
- Added `.gitkeep` to all empty asset/public directories
- Installed Vitest as test framework (natural fit for Vite ecosystem)
- Added `@types/node` for test file Node.js API access

### Decisions Made

- **Test framework:** Chose Vitest since project-context.md noted no framework was selected yet, and Vitest is the standard for Vite projects
- **Delta time extraction:** Extracted `calculateDeltaTime()` into `src/core/DeltaTime.ts` to enable proper unit testing of the core delta time pattern. `main.ts` imports and uses this function.
- **tsconfig test separation:** Created `tsconfig.test.json` extending `tsconfig.json` with Node.js types, and excluded `__tests__` from main tsconfig to keep production code free of Node.js type pollution
- **Vite config test section:** Added `test.include` to `vite.config.ts` for Vitest test discovery

### Debug Log References

No debug issues encountered during implementation.

### Completion Notes List

- All 7 tasks and 30 subtasks completed successfully
- 65 unit tests passing across 4 test files
- TypeScript strict mode compiles cleanly with zero errors
- `npm run build` produces clean production build in `dist/`
- `npm run dev` starts Vite dev server at localhost:5173 with HMR
- `npm run preview` serves production build correctly
- `__DEV__` flag confirmed stripped from production build (0 occurrences in output JS)
- Node.js version 22.18.0 confirmed (meets Vite 8 requirement of 22.12+)
- Three.js r183 installed as `three@^0.183.2`
- Vite 8.0.3 installed
- Chunk size warning for Three.js bundle (503KB) is expected and can be addressed with code-splitting in Epic 6

### File List

New files:
- `package.json` -- Project manifest with dev/build/preview/test scripts
- `package-lock.json` -- NPM lock file pinning dependency versions
- `tsconfig.json` -- TypeScript strict mode config (ESNext target, bundler moduleResolution)
- `tsconfig.test.json` -- TypeScript config for tests (adds Node.js types)
- `vite.config.ts` -- Vite config with __DEV__ define, GitHub Pages base, and test config
- `index.html` -- Entry HTML with full-viewport styles, #app container, module script
- `.gitignore` -- Standard Vite gitignore (node_modules, dist, logs, editor files)
- `src/main.ts` -- Application entry: renderer, camera, scene, wireframe cube, resize handler, animation loop
- `src/global.d.ts` -- __DEV__ boolean type declaration
- `src/core/DeltaTime.ts` -- Delta time calculation utility with cap
- `src/core/EventBus.ts` -- Placeholder class
- `src/core/GameEvents.ts` -- Placeholder interface
- `src/core/InputManager.ts` -- Placeholder class
- `src/core/Logger.ts` -- Placeholder class with static debug/info/warn/error methods
- `src/core/ErrorHandler.ts` -- Placeholder class
- `src/core/ObjectPool.ts` -- Placeholder generic class
- `src/config/constants.ts` -- BLOOM_LAYER, DELTA_TIME_CAP, MAX_POOL_SIZE constants
- `src/config/rendering.ts` -- Rendering config placeholder
- `src/config/input.ts` -- Input config placeholder
- `src/types/game.ts` -- GameState type definition
- `src/types/three-extensions.d.ts` -- Three.js addon type declarations placeholder
- `src/__tests__/DeltaTime.test.ts` -- 8 tests for delta time calculation
- `src/__tests__/constants.test.ts` -- 7 tests for game constants
- `src/__tests__/project-structure.test.ts` -- 40 tests for directory and file structure
- `src/__tests__/placeholder-exports.test.ts` -- 10 tests for placeholder module exports
- `.gitkeep` files in 23 empty directories (assets/*, public/*, src subdirectories)

### Change Log

- 2026-03-26: Story 1-1 implemented -- Vite 8 + Three.js r183 project scaffolding with full directory structure, placeholder files, renderer setup with green wireframe cube, delta time system, and 65 passing tests (Claude Opus 4.6)
- 2026-03-26: Code review fixes -- Added Math.max(0, rawDt) guard in calculateDeltaTime to prevent negative delta time; added package-lock.json to File List (Claude Opus 4.6 code review)

### Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.6 (code review workflow)
**Date:** 2026-03-26
**Outcome:** APPROVED

**Review Summary:**
- All 15 Acceptance Criteria verified as IMPLEMENTED
- All 7 tasks (30 subtasks) verified as actually complete
- 65 original tests + 1 new test = 66 tests all passing
- TypeScript strict mode compiles cleanly
- Production build succeeds (503 KB Three.js chunk expected)
- `__DEV__` flag correctly stripped from production build
- Three.js r183 API usage verified correct (setAnimationLoop, ACESFilmicToneMapping, WebGL 2.0 default)
- Vite 8.0.3 + Vitest 4 configuration verified correct
- No console.log calls in source code (per project rules)
- No security issues found
- No architecture violations found

**Issues Found and Fixed:**
1. [MEDIUM] `package-lock.json` missing from story File List -- Added to File List
2. [LOW] `calculateDeltaTime` did not guard against negative time differences -- Added `Math.max(0, rawDt)` clamp and new test

**Git vs Story Discrepancies:** 1 found and fixed (package-lock.json)
