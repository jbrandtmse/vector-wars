# Story 6.5: GitHub Pages Deployment

Status: review

## Story

As a developer,
I want to deploy to GitHub Pages via automated GitHub Actions so that pushing to main publishes the game.

## Acceptance Criteria

1. **GitHub Actions Workflow File:** A file `.github/workflows/deploy.yml` exists that triggers on pushes to `main` and on `workflow_dispatch` (manual trigger). The workflow checks out the repo, installs dependencies with `npm ci`, runs `npx tsc --noEmit` for type checking, runs `npx vitest run` for tests, builds with `npm run build`, and deploys the `dist/` output to GitHub Pages using `actions/upload-pages-artifact@v4` and `actions/deploy-pages@v4`.

2. **Workflow Permissions and Concurrency:** The workflow sets `permissions: { contents: read, pages: write, id-token: write }` at the top level. A `concurrency` block with `group: "pages"` and `cancel-in-progress: true` prevents parallel deployments.

3. **Build and Deploy Jobs:** The workflow uses two jobs: `build` (runs on `ubuntu-latest`, Node 20, does checkout, install, type-check, test, build, configure-pages, upload-artifact) and `deploy` (needs `build`, runs on `ubuntu-latest`, environment `github-pages`, deploys using `actions/deploy-pages@v4`). The deploy job outputs the deployment URL.

4. **Vite Base Path Configuration:** `vite.config.ts` sets `base` to a value compatible with GitHub Pages subpath deployment. The current `base: './'` uses relative paths which works for both root and subpath deployments. Verify this is correct and no changes are needed.

5. **Build Verification in CI:** The workflow runs `npx tsc --noEmit` and `npx vitest run` before `npm run build`. If either fails, the workflow stops and does not deploy. This prevents deploying broken code.

6. **Assets Included in Build:** The `dist/` directory produced by `npm run build` contains the built JS bundle, `index.html`, `assets/` (Vite-hashed JS), `audio/` (from `public/audio/`), and `fonts/` (from `public/fonts/`). The `assets/` directory at project root (JSON data files for bosses, briefings, dialogue, levels) is copied into the build output. Verify `npm run build` includes everything needed.

7. **JSON Data Assets Accessible at Runtime:** All JSON files in `assets/` (bosses, briefings, dialogue, levels) are accessible from the deployed site. These files are loaded via `fetch()` at phase `enter()` time. Verify the Vite build copies them to `dist/assets/` and that the fetch paths resolve correctly with `base: './'`.

8. **No Secrets or Debug Code in Production:** The production build strips `__DEV__` conditionals (already configured via Vite `define`). No `.env` files, credentials, or debug-only code ships to GitHub Pages. The `_bmad-output/`, `_bmad/`, `src/`, and `node_modules/` directories are NOT included in the deployed artifact (only `dist/` is uploaded).

9. Running `npx tsc --noEmit` produces zero TypeScript errors.

10. Unit tests exist (Vitest) for:
    - Workflow file: `.github/workflows/deploy.yml` exists and is valid YAML
    - Workflow file: contains `actions/deploy-pages` step
    - Workflow file: triggers on push to main branch
    - Workflow file: includes type-check step (`tsc --noEmit`)
    - Workflow file: includes test step (`vitest run`)
    - Workflow file: includes build step (`npm run build`)
    - Vite config: `base` is set to `'./'` for relative path deployment

11. All existing tests continue to pass -- zero regressions.

## Tasks / Subtasks

- [x] Task 1: Create GitHub Actions workflow file (AC: #1, #2, #3)
  - [x] 1.1 Create `.github/workflows/deploy.yml` with proper directory structure
  - [x] 1.2 Configure trigger on push to `main` and `workflow_dispatch`
  - [x] 1.3 Set permissions (contents: read, pages: write, id-token: write)
  - [x] 1.4 Set concurrency group "pages" with cancel-in-progress
  - [x] 1.5 Create `build` job: checkout@v4, setup-node@v4 (Node 20, cache npm), npm ci, tsc --noEmit, vitest run, npm run build, configure-pages@v5, upload-pages-artifact@v4 (path: ./dist)
  - [x] 1.6 Create `deploy` job: needs build, environment github-pages, deploy-pages@v4, output URL

- [x] Task 2: Verify Vite base path config (AC: #4)
  - [x] 2.1 Confirm `vite.config.ts` has `base: './'` (already set -- just verify)
  - [x] 2.2 Document that relative paths work for both root and subpath GitHub Pages deployments

- [x] Task 3: Verify build output completeness (AC: #6, #7)
  - [x] 3.1 Run `npm run build` and verify `dist/` contains index.html, assets/, audio/, fonts/
  - [x] 3.2 Verify `assets/` JSON data files (bosses, briefings, dialogue, levels) are in `dist/assets/`
  - [x] 3.3 If JSON data files are NOT in dist, configure Vite `publicDir` or move them to `public/` so they are copied
  - [x] 3.4 Verify fetch paths for JSON data resolve correctly with relative base

- [x] Task 4: Verify production build safety (AC: #8)
  - [x] 4.1 Confirm `__DEV__` stripping works in production build
  - [x] 4.2 Confirm no `.env` files or secrets exist in repo
  - [x] 4.3 Confirm only `dist/` is uploaded as artifact (not source code or _bmad-output)

- [x] Task 5: Write tests (AC: #10, #11)
  - [x] 5.1 Create `src/__tests__/DeployWorkflow.test.ts` that reads and validates `.github/workflows/deploy.yml`
  - [x] 5.2 Test YAML validity, required trigger, required steps (tsc, vitest, build, deploy)
  - [x] 5.3 Test vite config base path
  - [x] 5.4 Verify all existing tests pass

- [x] Task 6: Build verification (AC: #9, #11)
  - [x] 6.1 Run `npx tsc --noEmit` -- zero TypeScript errors
  - [x] 6.2 Run `npx vitest run` -- all tests pass, zero regressions

## Dev Notes

### Architecture Compliance

- **No server infrastructure:** GitHub Pages is static hosting only -- no backend, no server-side code. [Source: game-architecture.md#Technical Requirements]
- **Build output:** `npm run build` runs `tsc && vite build`, producing static output in `dist/`. [Source: project-context.md#Platform & Build Rules]
- **Debug code stripping:** Vite `define` with `__DEV__` strips all debug code from production. [Source: project-context.md#Critical Don't-Miss Rules]
- **No secrets in repo:** No `.env` files, no API keys, no credentials. The game is fully client-side. [Source: game-architecture.md#Constraints]

### Key Implementation Details

**Workflow file (.github/workflows/deploy.yml):**
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npx tsc --noEmit

      - name: Run tests
        run: npx vitest run

      - name: Build
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v4
        with:
          path: "./dist"

  deploy:
    environment:
      name: github-pages
      url: ${{ pages.deployment.url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

**Vite config (already correct):**
- `base: './'` produces relative asset paths in index.html (e.g., `./assets/index-XXX.js` instead of `/assets/index-XXX.js`)
- This works for both `username.github.io` root deployments and `username.github.io/repo-name/` subpath deployments
- No changes needed to `vite.config.ts`

**JSON data files concern:**
- `assets/` at project root contains JSON data for bosses, briefings, dialogue, levels
- These are loaded via `fetch()` during phase `enter()` calls
- Vite only copies files from `public/` to `dist/` -- files in project-root `assets/` may NOT be automatically included
- Check if the game code imports these statically or fetches them dynamically
- If fetched dynamically, they MUST be in `public/assets/` or the Vite `publicDir` must be configured to include them
- Current `dist/` already shows `dist/assets/` contains only `index-BReXZRcA.js` (the Vite-hashed bundle), NOT the JSON data files
- **CRITICAL:** Investigate how `assets/` JSON files get into the build. They may already be handled by Vite's static import or need to be moved/symlinked into `public/`

### Previous Story Intelligence (6-4)

- Story 6-4 verified build size: 789.91 KB uncompressed, 193.53 KB gzipped -- within budget
- 138 test files, 2005 tests all passing
- Build command: `npm run build` produces `tsc && vite build`
- Build target: `['es2020', 'chrome111', 'firefox114', 'safari16.4', 'edge111']`
- `vite.config.ts` already has `base: './'` for GitHub Pages compatibility
- `dist/` output: index.html, assets/ (JS bundle), audio/ (from public/), fonts/ (from public/)

### Project Structure Notes

- `.github/workflows/deploy.yml` -- New workflow file (standard GitHub Actions location)
- `vite.config.ts` -- Verify only, likely no changes needed
- `src/__tests__/DeployWorkflow.test.ts` -- New test file for workflow validation

### Potential Pitfalls

- **Assets directory confusion:** The project has `assets/` (JSON data at project root) AND `dist/assets/` (Vite output). The project-root `assets/` contains runtime-fetched JSON files. If these are loaded via dynamic `fetch()`, they MUST be accessible at the deployed URL. Check if Vite copies them or if they need to be in `public/`.
- **GitHub Pages 404 on SPA routes:** Not an issue -- Vector Wars is a single-page app that does not use client-side routing. All navigation is internal game state.
- **Large file limits:** GitHub Pages has a 1 GB site size limit and 100 MB per-file limit. The game build is ~800 KB JS + audio files, well within limits.
- **YAML test reading:** The test file will need to read `.github/workflows/deploy.yml` using `fs.readFileSync`. Use `path.resolve` with `__dirname` or import.meta.url to locate the file relative to project root.
- **Node version in CI:** Use Node 20 (LTS). The project uses Vite 8 which requires Node 18+.

### References

- [Source: epics.md#Epic 6 Story 5] -- Deploy to GitHub Pages via automated GitHub Actions
- [Source: project-context.md#Platform & Build Rules] -- npm run build produces static output for GitHub Pages
- [Source: project-context.md#Technology Stack] -- Hosting: GitHub Pages (static)
- [Source: game-architecture.md#Technical Requirements] -- No server infrastructure (GitHub Pages static hosting)
- [Source: vite.config.ts] -- base: './' already configured for GitHub Pages

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- `npx tsc --noEmit` -- zero errors
- `npx vitest run` -- 139 test files, 2030 tests passed, zero failures
- `npm run build` -- 789.91 KB uncompressed, 193.53 KB gzipped (within budget)

### Completion Notes List

- Created `.github/workflows/deploy.yml` with two-job pipeline: `build` (checkout, Node 20 setup, npm ci, type-check, test, build, configure-pages, upload-artifact) and `deploy` (deploy-pages). Triggers on push to `main` and manual `workflow_dispatch`. Proper permissions (contents: read, pages: write, id-token: write) and concurrency control (group "pages", cancel-in-progress).
- Verified `vite.config.ts` already has `base: './'` which produces relative asset paths in HTML. This works for both root (`username.github.io`) and subpath (`username.github.io/repo-name/`) GitHub Pages deployments. No changes needed.
- CRITICAL FIX: Discovered that JSON data files in project-root `assets/` (dialogue, briefings) were NOT being copied to `dist/` during production build. Vite only copies files from the `public/` directory. Moved all runtime-fetched JSON files from `assets/briefings/` and `assets/dialogue/` to `public/assets/briefings/` and `public/assets/dialogue/`. The `fetch('assets/...')` calls in `main.ts` now resolve correctly in both dev (Vite serves `public/` at root) and production (copied to `dist/`).
- Updated 3 existing test files that referenced `../../assets/` to use `../../public/assets/`: `BriefingAllLevels.test.ts`, `HandlerVoiceEscalation.test.ts`, `TutorialPhase.test.ts`.
- Updated `project-structure.test.ts` to include `public/assets/briefings`, `public/assets/dialogue`, and `.github/workflows` as required directories.
- Verified production build safety: no `.env` files in repo, `__DEV__` conditionals stripped by Vite `define`, only `dist/` is uploaded as GitHub Pages artifact. No source code, `_bmad-output/`, or `node_modules/` shipped.
- Created `src/__tests__/DeployWorkflow.test.ts` with 19 tests validating: workflow file existence, YAML structure, triggers (push to main, workflow_dispatch), required steps (tsc, vitest, build), deployment actions (deploy-pages, upload-pages-artifact, configure-pages), permissions, concurrency, Node version, npm ci usage, separate build/deploy jobs, Vite config base path, dist output directory, and build output completeness (JSON data files in public/assets).
- All 2030 tests pass across 139 test files. Zero regressions.

### File List

- `.github/workflows/deploy.yml` (new -- GitHub Actions workflow for automated GitHub Pages deployment)
- `public/assets/briefings/level-1.json` (moved from `assets/briefings/level-1.json`)
- `public/assets/briefings/level-2.json` (moved from `assets/briefings/level-2.json`)
- `public/assets/briefings/level-3.json` (moved from `assets/briefings/level-3.json`)
- `public/assets/dialogue/handler.json` (moved from `assets/dialogue/handler.json`)
- `public/assets/dialogue/bosses.json` (moved from `assets/dialogue/bosses.json`)
- `public/assets/dialogue/tutorial.json` (moved from `assets/dialogue/tutorial.json`)
- `public/assets/bosses/.gitkeep` (new -- placeholder for future boss data)
- `public/assets/levels/.gitkeep` (new -- placeholder for future level data)
- `assets/briefings/.gitkeep` (new -- preserves directory structure after JSON move)
- `src/__tests__/DeployWorkflow.test.ts` (new -- 19 tests for workflow and deployment config validation)
- `src/__tests__/BriefingAllLevels.test.ts` (modified -- updated path from assets/ to public/assets/)
- `src/__tests__/HandlerVoiceEscalation.test.ts` (modified -- updated path from assets/ to public/assets/)
- `src/__tests__/TutorialPhase.test.ts` (modified -- updated path from assets/ to public/assets/)
- `src/__tests__/project-structure.test.ts` (modified -- added public/assets and .github/workflows directories)
- `_bmad-output/implementation-artifacts/6-5-github-pages-deployment.md` (new -- story file)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified -- status updates)
