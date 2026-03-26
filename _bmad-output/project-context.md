---
project_name: 'vector-wars'
user_name: 'Developer'
date: '2026-03-26'
sections_completed: ['technology_stack', 'engine_rules', 'performance', 'code_organization', 'testing', 'platform', 'critical_rules']
existing_patterns_found: 8
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing game code in this project. Focus on unobvious details that agents might otherwise miss._

_Reference: `_bmad-output/game-architecture.md` for full architecture details._

---

## Technology Stack & Versions

- **Rendering:** Three.js r183 (WebGL 2.0) — rendering library, NOT a game engine
- **Build:** Vite 8.0.3 + Rolldown (TypeScript, vanilla template)
- **Language:** TypeScript (strict mode)
- **Platform:** Web Browser (Chrome, Firefox, Safari, Edge) + Electron desktop (deferred)
- **Hosting:** GitHub Pages (static)
- **Audio:** THREE.Audio (Web Audio API)
- **Dev Tools:** Stats.js (debug only), Context7 MCP

**Version Constraints:**
- Three.js `LineMaterial` / `Line2` are **WebGLRenderer only** — do not use WebGPU equivalents
- `UnrealBloomPass` requires **tone mapping enabled** on renderer
- Vite `define` used to strip debug code — never import from `src/debug/` in non-debug files

---

## Critical Implementation Rules

### Three.js-Specific Rules

- **NEVER create materials directly.** Always use `VectorMaterials.create(id)` — this ensures palette transitions and bloom layer assignment work globally.
- **ALL vector geometry must enable bloom layer:** `mesh.layers.enable(BLOOM_LAYER)` — enforced in `GameObject` base class.
- **Post-processing pipeline order:** `RenderPass → UnrealBloomPass → ShaderPass(CRT) → OutputPass → FXAAPass` — FXAA goes AFTER OutputPass.
- **Selective bloom uses two EffectComposers** — bloom composer renders bloom-layer objects only, final composer mixes. See Implementation Patterns > Selective Bloom Pipeline.
- **Use `renderer.setAnimationLoop()`** — NOT manual `requestAnimationFrame()`. Three.js recommended pattern for cross-platform compatibility.
- **`CatmullRomCurve3.getPointAt(t)`** for rail position — `t` is 0-1 normalized. Use tangent/binormal interpolation for camera orientation.

### Architecture Rules

- **Entities never import systems.** Communication goes through typed `EventBus` only.
- **Systems never import each other.** `WeaponSystem` emits events, `AudioManager` subscribes. No cross-system imports.
- **UI never imports game logic.** HUD and screens subscribe to events, never reach into entity state.
- **One `StateMachine<T>` generic class, three usages:** `StateMachine<Game>` for game flow, `StateMachine<Phase>` for phases, `StateMachine<Enemy>` for AI. Never invent a different state pattern.
- **All entity creation through factory functions + ObjectPool.** Never `new Entity()` in gameplay code. Factories guarantee bloom layer, pool registration, and scene addition.
- **AI states NEVER check level number.** All behavioral variation comes from `BehaviorParams` injected at spawn time from JSON config. No `if (level === 3)` conditionals.

### Performance Rules

- **60 FPS stable — non-negotiable.** Frame budget: 16.67ms.
- **<500 draw calls per frame.** Merge static geometry where possible.
- **<3ms post-processing budget.** CRT shader is optional and droppable if budget exceeded.
- **No GC pauses during gameplay.** All dynamic entities (projectiles, particles, shards, enemies) MUST use `ObjectPool<T>`. Pre-warm pools at phase `enter()`.
- **No `fetch()` or `await` during gameplay frames.** All data loading happens in state `enter()` (async OK there). By the time `update()` runs, everything is loaded.
- **Delta time cap:** `Math.min(dt, 1/20)` — prevents tunneling on tab-switches.
- **Raycasting on fire events only** — not every frame. Bounding sphere checks are per-frame but brute-force is fine for <100 entities.

### Code Organization Rules

- **Source files:** `PascalCase.ts` (e.g., `CollisionSystem.ts`)
- **JSON data:** `kebab-case.json` (e.g., `core-intelligence.json`)
- **Audio files:** `snake_case.ogg` (e.g., `handler_01.ogg`)
- **Classes:** `PascalCase` | **Functions:** `camelCase` | **Constants:** `UPPER_SNAKE_CASE`
- **Event names:** `camelCase` verbs (e.g., `enemyDestroyed`, `phaseStart`)
- **Private members:** `camelCase` with TypeScript `private` keyword (no `_` prefix)

**Directory quick reference:**
- Core infrastructure → `src/core/`
- Game/phase states → `src/state/`
- Entities (player, enemies, bosses, projectiles, effects) → `src/entities/`
- Enemy AI states → `src/ai/`
- Game systems (rail, collision, weapons, score, levels) → `src/systems/`
- Rendering pipeline → `src/rendering/`
- Audio system → `src/audio/`
- Narrative/dialogue → `src/narrative/`
- HUD (Three.js) → `src/ui/hud/` | Screens (HTML/CSS) → `src/ui/screens/`
- Debug tools → `src/debug/` (stripped from production)
- Config constants → `src/config/`
- Level/boss/dialogue data → `assets/`

### Testing Rules

- No testing framework selected yet — will be addressed during implementation
- Debug tools provide runtime validation: `window.debug.*` API, collision wireframes, state inspector
- Stats.js monitors FPS/draw calls/memory during development
- Browser DevTools Performance tab for profiling at each epic milestone

### Platform & Build Rules

- **Primary:** Web browser (WebGL 2.0). Test on Chrome, Firefox, Safari, Edge.
- **Secondary:** Electron desktop (Mac + Windows) — deferred to Epic 6, no architectural changes needed.
- **Input:** Keyboard only, 5 keys (arrows + Space + Z/X/C). Use `InputManager` action mapping, never raw key codes.
- **Persistence:** `localStorage` only. No backend, no cookies, no IndexedDB.
- **Build:** `npm run build` produces static output for GitHub Pages. `npm run dev` for HMR dev server.
- **Debug toggle:** `?debug=true` URL parameter in dev builds. Vite `define` strips all debug code from production.

### Critical Don't-Miss Rules

**NEVER do these:**
- `new LineBasicMaterial()` directly — always `VectorMaterials.create()`
- `new Enemy()` in gameplay code — always factory functions
- Import one system from another — always EventBus
- `console.log()` — always `Logger.level('System', msg, ctx)`
- `fetch()` / `await` inside `update()` — all loading in `enter()`
- `if (level === 3)` in AI code — use `BehaviorParams` from JSON
- Put anything in `src/debug/` that non-debug code imports

**Always do these:**
- `mesh.layers.enable(BLOOM_LAYER)` on every vector geometry object
- `ObjectPool.acquire()` / `release()` for all dynamic entities
- `Logger.level('System', message, {context})` for all logging
- Define events in `GameEvents.ts` with typed payloads
- Load data in `enter()`, access synchronously in `update()`
- Use `VectorMaterials.setPalette()` for color transitions — never per-object
