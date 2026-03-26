---
title: 'Game Architecture'
project: 'vector-wars'
date: '2026-03-26'
author: 'Developer'
version: '1.0'
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9]
status: 'complete'
engine: 'Three.js r183'
platform: 'Web Browser (WebGL 2.0) + Desktop (Electron)'

# Source Documents
gdd: '_bmad-output/gdd.md'
epics: '_bmad-output/epics.md'
brief: '_bmad-output/game-brief.md'
---

# Game Architecture

## Executive Summary

**Vector Wars** architecture is designed for Three.js r183 + Vite 8.0.3 targeting Web Browser (WebGL 2.0) with a secondary Electron desktop wrapper.

**Key Architectural Decisions:**
- **Rendering:** Three.js bare library with selective bloom pipeline (two-composer pattern), vector wireframe line rendering, and CRT post-processing
- **Game Systems:** All custom-built — no game engine. Simple class hierarchy for entities, hierarchical FSM for state management, typed EventBus for inter-system communication
- **AI:** State pattern FSM with parameter-driven behavioral evolution (mechanical → aggressive → glitchy) via JSON config injection
- **Content Pipeline:** Hybrid phase type classes + JSON data files. Code handles gameplay logic, data handles per-level tuning
- **Audio:** Custom 4-channel AudioManager over THREE.Audio with modular/replaceable assets via JSON manifest

**Project Structure:** Hybrid organization (types at top level, features within) with 12 core systems mapped to specific directory locations across `src/core/`, `src/entities/`, `src/systems/`, `src/rendering/`, `src/ai/`, `src/audio/`, `src/narrative/`, `src/ui/`, and `src/state/`.

**Implementation Patterns:** 8 patterns defined (4 novel + 4 standard) ensuring AI agent consistency, including Color Depth System, Boss Destruction Choreography, Selective Bloom Pipeline, and Behavioral Evolution System.

**Validation:** All checks passed — 12/12 systems covered, all 6 epics mapped, no conflicts or gaps.

**Ready for:** Epic implementation phase

---

## Project Context

### Game Overview

**Vector Wars** - A first-person vector wireframe rail shooter where players jack into cyberspace as a resistance agent to fight rogue AI across three levels of escalating combat and narrative tension. Inspired by the 1983 Star Wars arcade cabinet, reimagined with boss encounters and dual-voice narrative set inside Neuromancer's cyberspace.

### Technical Scope

**Platform:** Web Browser (WebGL 2.0 via Three.js + Vite) + Desktop (Electron wrapper)
**Genre:** Rail Shooter (First-Person)
**Project Level:** Medium-High complexity — 12 core systems, 4 novel concepts, 8-10 critical architectural decisions

### Core Systems

| System | Complexity | Description |
|--------|-----------|-------------|
| Vector Rendering Pipeline | High | Three.js LineSegments/Line2, UnrealBloomPass, optional CRT shader, FXAA — the visual identity |
| Rail Movement System | Medium | CatmullRomCurve3 spline paths, camera following, player viewport offset control |
| Combat/Weapon System | Medium | 4 weapons (Data Lance, Logic Bombs, EMP Burst, Virus Payload), raycasting + bounding sphere collision |
| Enemy AI System | Medium | FSM per archetype (Sentinel, Watchdog, Gatekeeper, Overseer), behavioral evolution across levels |
| Boss Encounter System | High | 3 unique bosses, multi-stage destruction (peel → strip → shatter), vulnerability windows, dialogue triggers |
| Phase/Level System | Medium | 4 phase types per level, transitions, checkpoint system, color palette shifts (green → amber → red) |
| Audio System | Medium | AudioManager (SFX, Voice, Ambient, Music players), modular loading, replaceable assets |
| Narrative/Dialogue System | Medium | Handler comms, AI taunts, diegetic tutorial, trigger-based delivery without gameplay interruption |
| HUD/UI System | Medium | Shields, score, weapon icons, comm overlay, briefing screens, menus — all vector-rendered |
| Object Pooling | Low | Projectiles, particles, explosion shards — zero GC pauses during gameplay |
| Game State Management | Medium | FSM (menu → tutorial → gameplay phases → ending), phase checkpoints, shield recharge |
| Score/High Score System | Low | localStorage persistence, accuracy/speed/damage scoring |

### Technical Requirements

**Performance:**
- 60 FPS stable (non-negotiable)
- <500 draw calls per frame
- <3ms post-processing budget
- No GC pauses during gameplay (object pooling mandatory)
- <50MB build size, <3s load time

**Platform:**
- WebGL 2.0 (WebGL 1.0 fallback consideration)
- Browsers: Chrome, Firefox, Safari, Edge
- Electron desktop wrapper (Mac + Windows) — secondary priority
- Keyboard-only input (5 keys: arrows + spacebar + Z/X/C)

**Constraints:**
- No physics engine (vector math + bounding spheres sufficient)
- No networking (single-player, local-only)
- No database (localStorage only)
- No third-party game engine (Three.js + custom game code)
- No server infrastructure (GitHub Pages static hosting)

### Complexity Drivers

**High Complexity:**
1. Post-processing pipeline — authentic phosphor glow within 3ms budget (bloom + CRT + FXAA)
2. Boss encounter system — 3 unique bosses with personality, attack patterns, dialogue, and multi-stage destruction
3. Four distinct phase types — each with unique geometry, gameplay logic, and rail path behavior
4. Behavioral evolution — parameterizable enemy FSM shifting mechanical → aggressive → glitchy across levels

**Novel Concepts (requiring custom architectural patterns):**
1. Diegetic vector aesthetic — rendering decisions are narrative decisions; the wireframe IS the world
2. Color depth system — full palette transitions affecting all rendered geometry per level
3. Boss destruction choreography — multi-stage peel → strip → shatter animation system
4. Concurrent trigger-based dual-voice narrative — two dialogue sources during gameplay without interruption

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| UnrealBloomPass produces "modern" bloom, not authentic phosphor glow | Medium | High | Early prototype validation (Epic 1); tune bloom parameters; custom shader if needed |
| Safari/WebKit WebGL rendering inconsistencies | Medium | Medium | Test early on Safari; use WebGL 2.0 features cautiously; fallback paths |
| Performance budget exceeded by post-processing | Low | High | Profile continuously; CRT shader is optional and can be dropped; geometry merging |
| AI-generated audio doesn't meet retro-digital bar | Medium | Low | Modular audio architecture supports drop-in replacement; audio is not a launch blocker |
| Object pooling complexity for multiple entity types | Low | Medium | Standard pattern; implement early in Epic 2 and reuse across all dynamic entities |

---

## Engine & Framework

### Selected Engine

**Three.js** r183 + **Vite** 8.0.3

**Rationale:** Three.js is the ideal rendering library for Vector Wars — purpose-built for WebGL with built-in support for wireframe line rendering (LineSegments/Line2), post-processing (EffectComposer with UnrealBloomPass), spline curves (CatmullRomCurve3), raycasting, and Web Audio API integration. Combined with Vite 8's Rolldown-powered builds (10-30x faster), this stack delivers zero-cost licensing, lightweight deployment (168 kB gzipped), and browser-native delivery. Three.js is a rendering library, not a game engine — all game systems are custom-built, giving full architectural control.

**Alternatives Evaluated:**
- **three-game-engine** (WesUnwin) — Game layer on Three.js providing game loop, GameObjects, input, scene management. Rejected: beta-stage maturity risk, Rapier physics overkill, adds dependency on young project for minimal gain.
- **PlayCanvas** — Full open-source game engine (MIT, <150 kB). Rejected: would require porting GDD's Three.js-specific rendering approach (LineSegments, UnrealBloomPass, CRT shader). Less direct control over line rendering.
- **Babylon.js** v8.0 — Comprehensive 3D engine. Rejected: 1.4 MB bundle (8x Three.js), less flexible post-processing, more opinionated structure adds overhead for wireframe-focused rendering.

### Project Initialization

```bash
npm create vite@latest vector-wars -- --template vanilla-ts
cd vector-wars && npm install three @types/three
```

Vanilla TypeScript template — no framework opinions. All game architecture is custom-built on Three.js primitives.

### Engine-Provided Architecture

All APIs verified against Three.js r183 documentation via Context7.

| Component | Three.js API | Notes |
|-----------|-------------|-------|
| **WebGL Rendering** | `THREE.WebGLRenderer` | WebGL 2.0 context; tone mapping must be enabled for bloom |
| **Scene Graph** | `THREE.Scene` | Object hierarchy, add/remove entities |
| **Camera** | `THREE.PerspectiveCamera` | First-person cockpit view |
| **Post-Processing** | `EffectComposer` | Pipeline: RenderPass → UnrealBloomPass → ShaderPass(CRT) → OutputPass → FXAAPass |
| **Selective Bloom** | `THREE.Layers` | Layer-based selective bloom — bloom on vector lines, not background |
| **Line Rendering** | `THREE.LineSegments` / `Line2` | LineBasicMaterial for thin lines; LineMaterial for fat lines with pixel-width control (WebGLRenderer only) |
| **Geometry** | `THREE.BufferGeometry` | Efficient vertex/index buffers for all wireframe shapes |
| **Materials** | `LineBasicMaterial` / `LineMaterial` | Color, opacity, dash patterns, line width |
| **Spline Paths** | `THREE.CatmullRomCurve3` | `getPointAt(t)` + tangent/binormal interpolation for rail camera orientation |
| **Raycasting** | `THREE.Raycaster` | Fire-event weapon hit detection |
| **Math Utilities** | `Vector3`, `Quaternion`, `MathUtils` | Spatial math, interpolation, clamping |
| **Audio Foundation** | `THREE.Audio`, `AudioListener`, `AudioLoader` | Web Audio API integration |
| **Animation Loop** | `renderer.setAnimationLoop()` | Recommended over manual rAF — better cross-platform compatibility |
| **Delta Time** | Manual calculation | `Math.min(deltaTime, 1/20)` cap pattern per Three.js game examples |
| **Build & Dev** | Vite 8 + Rolldown | HMR dev server, optimized production builds, 10-30x faster bundling |

### Development Environment

**Recommended MCP:** Context7 ([upstash/context7](https://github.com/upstash/context7)) — Provides current Three.js r183 API documentation lookup for AI-assisted development. Prevents outdated API usage. Installed.

```bash
claude mcp add context7 -- npx -y @upstash/context7-mcp
```

---

## Architectural Decisions

### Decision Summary

| # | Category | Decision | Rationale |
|---|----------|---------|-----------|
| 1 | Game Loop | Simple variable timestep with delta cap | Three.js native pattern (`setAnimationLoop`). Sufficient for rail shooter with no physics simulation. |
| 2 | Entity System | Simple class hierarchy with `GameObject` base | Small, well-defined entity set (<100 active). Direct OOP mapping to Three.js objects. |
| 3 | State Management | Hierarchical FSM (two levels) | Top-level for game flow, nested for phase state. `enter`/`update`/`exit` lifecycle. Phase checkpoints via state re-entry. |
| 4 | Input System | Input manager with action mapping | Systems query named actions (`fire`, `moveLeft`). Full simultaneous key support. Extensible for post-MVP gamepad. |
| 5 | Object Pooling | Generic pool class (`ObjectPool<T>`) | Single implementation, reused across all types. `acquire`/`release`/`reset` contract. Pre-warm at phase load. |
| 6 | Enemy AI | State pattern (class-based FSM) | Same `enter`/`update`/`exit` pattern as game state. Behavioral evolution via parameterizable states per level. |
| 7 | Collision | Raycaster + brute-force bounding spheres | Invisible sphere colliders per enemy (decoupled from wireframe visuals). Tunable hit volumes per archetype. <100 entities. |
| 8 | Level/Phase System | Hybrid — phase type classes + JSON config | Four phase classes for gameplay logic. JSON configs for per-level tuning (spawns, paths, obstacles, palette). |
| 9 | HUD/UI | Hybrid — Three.js HUD + HTML/CSS menus | In-game HUD as cockpit geometry through bloom pipeline. Menus/briefings/comm overlay as styled HTML. |
| 10 | Audio | Custom AudioManager over THREE.Audio | Four channels with independent volume control. JSON sound manifest for modular/replaceable assets. |
| 11 | Narrative | Event-driven trigger system with JSON dialogue | EventBus pub/sub. DialogueManager queues and displays. Same system for handler comms and AI taunts. |
| 12 | Persistence | localStorage with JSON | GDD-specified. Simple serialized score array. Browser-native. |

### Game Loop

**Approach:** Simple variable timestep with delta cap

`renderer.setAnimationLoop()` drives the loop. Delta time calculated per frame with `Math.min(dt, 1/20)` cap to prevent tunneling on tab-switches or frame hitches. All systems receive `dt` in their `update()` calls. No fixed-step simulation needed — rail movement, FSM AI, and raycasting are all frame-rate independent with variable timestep.

### Entity System

**Approach:** Simple class hierarchy

```
GameObject (base)
├── Player (cockpit, shields, position)
├── Enemy (abstract)
│   ├── Sentinel
│   ├── Watchdog
│   ├── Gatekeeper
│   └── Overseer
├── Boss (abstract)
│   ├── GatekeeperBoss
│   ├── AvengerBoss
│   └── CoreIntelligenceBoss
├── Projectile (abstract)
│   ├── DataLanceBolt
│   ├── LogicBomb
│   ├── EMPBurst
│   ├── VirusPayload
│   └── EnemyDataBurst
└── Effect (abstract)
    ├── VectorShardExplosion
    └── ScreenFlash
```

Each `GameObject` owns its `THREE.Object3D`, an invisible bounding sphere collider (where applicable), and an `update(dt)` method. A `GameObjectManager` maintains the active list and calls `update()` on all entities each frame.

### State Management

**Approach:** Hierarchical FSM

**Top-level Game State FSM:**
```
Menu → Tutorial → Briefing → Playing → Ending
                     ↑                    |
                     └── (next level) ────┘
```

**Nested Phase State FSM (active during `Playing`):**
```
Dogfight → Surface → Corridor → Boss → PhaseTransition
    ↑                                        |
    └──── (death = restart current phase) ────┘
```

Each state implements `enter()` (create resources), `update(dt)` (run logic), `exit()` (dispose resources). Phase checkpoints: death triggers re-entry to the current phase's `enter()`, not a transition to a new state.

### Input System

**Approach:** Input manager with action mapping

Physical keys map to named actions. Systems query actions, never physical keys.

| Action | Default Key | Usage |
|--------|------------|-------|
| `moveUp` | ArrowUp | Viewport movement |
| `moveDown` | ArrowDown | Viewport movement |
| `moveLeft` | ArrowLeft | Viewport movement |
| `moveRight` | ArrowRight | Viewport movement |
| `fire` | Space | Data Lance |
| `logicBomb` | Z | Logic Bombs |
| `emp` | X | EMP Burst |
| `virusPayload` | C | Virus Payload |

State tracked via `keydown`/`keyup` event map. Multiple simultaneous keys fully supported. Systems query `input.isActive('fire')` each frame.

### Object Pooling

**Approach:** Generic `ObjectPool<T>`

Single generic pool class with `acquire()`, `release()`, and `reset()` contract. Instantiated per entity type:

- `ObjectPool<DataLanceBolt>` — pre-warm 50
- `ObjectPool<EnemyDataBurst>` — pre-warm 30
- `ObjectPool<VectorShard>` — pre-warm 200
- `ObjectPool<LogicBomb>` — pre-warm 10

Pools pre-warmed at phase `enter()`. Released objects returned to pool, not garbage collected. `reset()` clears state and removes from scene.

### Enemy AI

**Approach:** State pattern (class-based FSM)

Each enemy holds a reference to its current `AIState`. States implement `enter(enemy)`/`update(enemy, dt)`/`exit(enemy)`.

**States:** `SpawnState` → `PatrolState` → `AttackState` → `EvadeState` → `DestroyedState`

**Behavioral evolution via parameters:**

| Parameter | Level 1 (Mechanical) | Level 2 (Aggressive) | Level 3 (Glitchy) |
|-----------|---------------------|---------------------|-------------------|
| `patrolSpeed` | 1.0 | 1.5 | 1.0-2.0 (random) |
| `attackCooldown` | 2.0s | 1.2s | 0.5-1.5s (random) |
| `evasionChance` | 0.0 | 0.2 | 0.5 |
| `movementRandomness` | 0.0 | 0.1 | 0.5 |

Same state classes, different parameter sets per level. Loaded from JSON level config.

### Collision System

**Approach:** Raycaster + bounding spheres with invisible colliders

- **Player weapons → Enemies:** `THREE.Raycaster` on fire events. Targets are invisible `THREE.Sphere` colliders parented to enemies (decoupled from wireframe visuals). Sphere size tuned per archetype for arcade-friendly hit detection.
- **Enemy projectiles → Player:** Sphere-sphere distance check each frame. Player has a bounding sphere; enemy projectiles have small spheres.
- **Corridor obstacles → Player:** Sphere/box distance checks each frame against player position.
- **Boss vulnerability zones:** Zone-based triggers for Virus Payload delivery windows.

### Level/Phase System

**Approach:** Hybrid — phase type classes + JSON config

**Four phase type classes:**
- `DogfightPhase` — open-space combat, wide sweeping rail paths
- `SurfacePhase` — surface-skimming approach, destructible target objectives
- `CorridorPhase` — straight forward path, obstacle survival
- `BossPhase` — arena orbit, boss attack patterns, Virus Payload delivery

**JSON config per level** defines:
- Rail path spline control points
- Enemy spawn events (distance-based triggers)
- Obstacle patterns and timing
- Color palette (green/amber/red)
- Boss configuration (health, attack patterns, dialogue triggers)
- Shield recharge amount between phases

`LevelManager` loads config, instantiates phase classes with config, manages sequential phase transitions.

### HUD/UI

**Approach:** Hybrid rendering

**Three.js rendered (in-game, through bloom pipeline):**
- Shield bar — vector line geometry
- Score display — vector-rendered numbers
- Weapon indicator — vector icon
- Cockpit frame and actuator arms

**HTML/CSS overlay (styled with vector aesthetic):**
- Main menu (Start Game, High Scores, Credits)
- Briefing screens (scrolling vector-styled text)
- Comm overlay (handler/AI dialogue text)
- High score table
- Game over screen

HTML elements use monospace font, matching green/amber/red color palette, and CSS glow effects to approximate the vector look.

### Audio Manager

**Approach:** Custom AudioManager over THREE.Audio

```
AudioManager
├── SFXChannel      (volume: 0.6, pooled THREE.Audio instances)
├── VoiceChannel    (volume: 0.9, single THREE.Audio, queued playback)
├── AmbientChannel  (volume: 0.4, looping THREE.Audio)
└── MusicChannel    (volume: 0.3, single THREE.Audio)
```

- Each channel has independent volume control (`setChannelVolume`)
- JSON sound manifest maps IDs to file paths — swap files without code changes
- `THREE.AudioLoader` handles async file loading
- Voice channel queues lines to prevent overlap
- SFX channel pools multiple `THREE.Audio` instances for concurrent sounds

### Narrative System

**Approach:** Event-driven triggers with JSON dialogue scripts

**EventBus:** Simple pub/sub. Gameplay systems publish events (`phaseStart`, `bossHealthBelow50`, `enemyWaveCleared`, `railDistance:500`).

**DialogueManager:** Subscribes to events. Evaluates trigger conditions from JSON. Queues matching dialogue lines. Displays text via HTML comm overlay. Plays audio via Voice channel.

**JSON dialogue format:**
```json
{
  "trigger": "bossHealthBelow50",
  "speaker": "gatekeeper",
  "text": "You are... persistent.",
  "audio": "gatekeeper_03.ogg",
  "priority": 2
}
```

Priority system ensures critical lines (boss taunts) can interrupt lower-priority lines (ambient handler chatter).

### Persistence

**Approach:** localStorage with JSON

```json
{
  "highScores": [
    { "initials": "ACE", "score": 48500, "date": "2026-03-26" },
    { "initials": "DEV", "score": 32100, "date": "2026-03-25" }
  ]
}
```

Top 10 scores stored. Read on game load. Write after campaign completion or game over. Works identically in browser and Electron.

---

## Cross-cutting Concerns

These patterns apply to ALL systems and must be followed by every implementation.

### Error Handling

**Strategy:** Global handler with graceful degradation

- `window.onerror` and `unhandledrejection` catch all unhandled exceptions centrally
- **Critical errors** (WebGL context lost, renderer failure): show clean error screen, stop game loop
- **Non-critical errors** (missing audio file, dialogue trigger mismatch): log and skip, game continues
- Systems throw or let errors bubble — the global handler decides the response
- Dev mode: debug overlay shows errors visually with stack traces
- Production: errors logged to console silently, player never sees them

**Example:**
```typescript
// Systems just throw — handler catches
function loadSound(id: string): AudioBuffer {
  const path = manifest[id];
  if (!path) throw new Error(`Sound not found: ${id}`);
  return audioLoader.load(path);
}

// Global handler categorizes and responds
window.onerror = (msg, src, line, col, error) => {
  if (isCritical(error)) {
    gameLoop.stop();
    showErrorScreen(error);
  } else {
    Logger.error('Global', `Unhandled: ${msg}`, { src, line });
    // Game continues
  }
};
```

### Logging

**Format:** `[LEVEL][System] message {context}`

**Destination:** Browser console (`console.error/warn/info/debug`)

**Log Levels:**

| Level | Usage | Example |
|-------|-------|---------|
| **ERROR** | Something broke | `[ERROR][Audio] Failed to load: emp_burst.ogg` |
| **WARN** | Unexpected but handled | `[WARN][Pool] DataLanceBolt pool exhausted, expanding` |
| **INFO** | Milestones | `[INFO][Phase] Dogfight started (level: 2, enemies: 14)` |
| **DEBUG** | Diagnostic detail | `[DEBUG][AI] Sentinel#12 → AttackState (cooldown: 1.2s)` |

**Configuration:**
- Dev builds: log level = DEBUG (all messages visible)
- Production builds: log level = ERROR (only errors)
- System prefixes enable targeted filtering in DevTools and by AI agents

**Example:**
```typescript
Logger.debug('AI', `Sentinel#${id} → AttackState`, { cooldown: 1.2 });
// outputs: [DEBUG][AI] Sentinel#12 → AttackState {cooldown: 1.2}

Logger.info('Phase', `Dogfight started`, { level: 2, enemies: 14 });
// outputs: [INFO][Phase] Dogfight started {level: 2, enemies: 14}
```

### Configuration Management

**Approach:** TypeScript constants + JSON data files

| Config Type | Location | Access Pattern | Examples |
|------------|---------|---------------|----------|
| **Game constants** | `src/config/constants.ts` | Import at compile-time | Max pool sizes, key mappings, frame rate cap |
| **Rendering config** | `src/config/rendering.ts` | Import at compile-time | Bloom strength, CRT intensity, line width, FXAA toggle |
| **Balancing values** | `assets/levels/*.json` | Loaded at runtime by LevelManager | Enemy speed, cooldowns, damage, spawn patterns |
| **Boss configs** | `assets/bosses/*.json` | Loaded at runtime by BossPhase | Health, attack patterns, vulnerability windows, dialogue triggers |
| **Dialogue scripts** | `assets/dialogue/*.json` | Loaded at runtime by DialogueManager | Trigger conditions, speaker, text, audio references |
| **Sound manifest** | `assets/audio/manifest.json` | Loaded at runtime by AudioManager | Sound ID → file path mappings |
| **Player settings** | `localStorage` | Read/write at runtime | Channel volumes |

Constants are typed, importable, and tree-shakeable. Data files are editable without recompilation. AI agents modify JSON for content, TypeScript for rules.

### Event System

**Pattern:** Typed EventBus with central dispatch

All inter-system communication goes through a single typed `EventBus`. Event types and payloads defined in `GameEvents.ts`.

**Event naming:** `camelCase` verbs — `enemyDestroyed`, `phaseStart`, `playerHit`

**Core events:**

| Event | Payload | Publisher | Subscribers |
|-------|---------|-----------|-------------|
| `phaseStart` | `{ phase: PhaseType, level: number }` | LevelManager | DialogueManager, AudioManager, HUD |
| `phaseEnd` | `{ phase: PhaseType, level: number }` | LevelManager | AudioManager, HUD, ScoreManager |
| `enemyDestroyed` | `{ enemy: Enemy, position: Vector3 }` | CollisionSystem | ScoreManager, EffectsManager, DialogueManager |
| `playerHit` | `{ damage: number, source: string }` | CollisionSystem | Player, HUD, AudioManager, ScreenShake |
| `playerDied` | `{}` | Player | GameStateManager |
| `bossHealthChanged` | `{ health: number, maxHealth: number }` | Boss | HUD, DialogueManager |
| `weaponFired` | `{ weapon: WeaponType, position: Vector3 }` | Player | AudioManager, EffectsManager |
| `dialogueTrigger` | `{ triggerId: string }` | Various | DialogueManager |
| `scoreChanged` | `{ score: number, delta: number }` | ScoreManager | HUD |

**Example:**
```typescript
// Type-safe event definitions
interface GameEvents {
  enemyDestroyed: { enemy: Enemy; position: Vector3 };
  playerHit: { damage: number; source: string };
  phaseStart: { phase: PhaseType; level: number };
}

// Publishing (type-checked payload)
eventBus.emit('enemyDestroyed', { enemy, position: enemy.getPosition() });

// Subscribing (typed callback)
eventBus.on('enemyDestroyed', ({ enemy, position }) => {
  spawnExplosion(position);
  addScore(enemy.scoreValue);
});
```

### Debug & Development Tools

**Activation:** Build flag + URL parameter + console API

- **Production builds:** All debug code stripped by Vite `define` — zero overhead, zero ship risk
- **Dev builds:** `?debug=true` in URL toggles visual overlays
- **Console API:** `window.debug` object always available in dev builds for programmatic access

**Available tools:**

| Tool | Activation | Description |
|------|-----------|-------------|
| **Stats.js** | `?debug=true` | FPS, draw calls, memory overlay |
| **State inspector** | `?debug=true` | Current game state, phase, entity count, pool usage |
| **Collision wireframes** | `?debug=true` | Render invisible bounding spheres as visible wireframes |
| **Rail path visualizer** | `?debug=true` | Render CatmullRomCurve3 spline as visible line |
| **Console API** | `window.debug.*` | Programmatic state inspection and manipulation |

**Console API (for AI agent debugging via chrome-devtools MCP):**
```typescript
window.debug = {
  state: () => currentGameState,
  phase: () => currentPhaseState,
  entities: () => gameObjectManager.getAll(),
  pools: () => poolStats(),
  skipToPhase: (phase: number) => { /* ... */ },
  godMode: () => { player.invulnerable = true; },
  spawnEnemy: (type: string) => { /* ... */ },
  triggerDialogue: (id: string) => { /* ... */ },
};
```

---

## Project Structure

### Organization Pattern

**Pattern:** Hybrid (types at top level, features within)

**Rationale:** Top level separates by type (`core/`, `entities/`, `systems/`, `config/`, `ui/`). Within each, organized by feature (`entities/enemies/`, `systems/combat/`). Two-step lookup for AI agents: "What kind of thing is it?" → "Which feature?"

### Directory Structure

```
vector-wars/
├── public/                          # Static assets (served by Vite as-is)
│   ├── audio/
│   │   ├── sfx/                     # SFX files (data-lance.ogg, explosion.ogg, etc.)
│   │   ├── voice/                   # Voice lines (handler_01.ogg, gatekeeper_03.ogg)
│   │   ├── ambient/                 # Ambient hum tracks
│   │   ├── music/                   # Outro music track
│   │   └── manifest.json            # Sound ID → file path mappings
│   └── fonts/                       # Monospace vector-styled fonts for HTML UI
│
├── src/
│   ├── main.ts                      # Entry point — bootstrap renderer, game loop, init
│   │
│   ├── core/                        # Core infrastructure (singletons, shared systems)
│   │   ├── Game.ts                  # Top-level game class — owns renderer, scene, loop
│   │   ├── GameLoop.ts              # setAnimationLoop wrapper, delta time, system updates
│   │   ├── EventBus.ts              # Typed EventBus (pub/sub)
│   │   ├── GameEvents.ts            # Event type definitions and payload interfaces
│   │   ├── InputManager.ts          # Action-mapped keyboard input
│   │   ├── Logger.ts                # [LEVEL][System] logging wrapper
│   │   ├── ErrorHandler.ts          # Global error handler (critical vs non-critical)
│   │   └── ObjectPool.ts            # Generic ObjectPool<T>
│   │
│   ├── config/                      # Compile-time configuration
│   │   ├── constants.ts             # Game constants (pool sizes, frame cap, etc.)
│   │   ├── rendering.ts             # Rendering config (bloom, CRT, FXAA, line width)
│   │   └── input.ts                 # Key → action mappings
│   │
│   ├── state/                       # Game state management
│   │   ├── StateMachine.ts          # Generic FSM base class (enter/update/exit)
│   │   ├── GameStateMachine.ts      # Top-level game flow FSM
│   │   ├── states/                  # Game state implementations
│   │   │   ├── MenuState.ts
│   │   │   ├── TutorialState.ts
│   │   │   ├── BriefingState.ts
│   │   │   ├── PlayingState.ts      # Owns the nested Phase FSM
│   │   │   └── EndingState.ts
│   │   └── phases/                  # Phase state implementations (nested FSM)
│   │       ├── DogfightPhase.ts
│   │       ├── SurfacePhase.ts
│   │       ├── CorridorPhase.ts
│   │       ├── BossPhase.ts
│   │       └── PhaseTransition.ts
│   │
│   ├── entities/                    # Game objects (class hierarchy)
│   │   ├── GameObject.ts            # Base class (Object3D, collider, update)
│   │   ├── GameObjectManager.ts     # Active entity list, update loop
│   │   ├── player/
│   │   │   └── Player.ts            # Cockpit, shields, position, viewport offset
│   │   ├── enemies/
│   │   │   ├── Enemy.ts             # Abstract enemy base
│   │   │   ├── Sentinel.ts
│   │   │   ├── Watchdog.ts
│   │   │   ├── Gatekeeper.ts
│   │   │   └── Overseer.ts
│   │   ├── bosses/
│   │   │   ├── Boss.ts              # Abstract boss base (health, vulnerability, destruction)
│   │   │   ├── GatekeeperBoss.ts
│   │   │   ├── AvengerBoss.ts
│   │   │   └── CoreIntelligenceBoss.ts
│   │   ├── projectiles/
│   │   │   ├── Projectile.ts        # Abstract projectile base
│   │   │   ├── DataLanceBolt.ts
│   │   │   ├── LogicBomb.ts
│   │   │   ├── EMPBurst.ts
│   │   │   ├── VirusPayload.ts
│   │   │   └── EnemyDataBurst.ts
│   │   └── effects/
│   │       ├── Effect.ts            # Abstract effect base
│   │       ├── VectorShardExplosion.ts
│   │       └── ScreenFlash.ts
│   │
│   ├── ai/                          # Enemy AI system
│   │   ├── AIState.ts               # AI state interface (enter/update/exit)
│   │   ├── states/                  # Shared AI state implementations
│   │   │   ├── SpawnState.ts
│   │   │   ├── PatrolState.ts
│   │   │   ├── AttackState.ts
│   │   │   ├── EvadeState.ts
│   │   │   └── DestroyedState.ts
│   │   └── BehaviorParams.ts        # Per-level behavioral evolution parameters
│   │
│   ├── systems/                     # Game systems (operate on entities)
│   │   ├── RailMovement.ts          # CatmullRomCurve3 camera path + player offset
│   │   ├── CollisionSystem.ts       # Raycaster + bounding sphere checks
│   │   ├── WeaponSystem.ts          # Fire events, projectile spawning, cooldowns
│   │   ├── ScoreManager.ts          # Score tracking, high score persistence
│   │   └── LevelManager.ts          # JSON config loading, phase sequencing, transitions
│   │
│   ├── rendering/                   # Rendering pipeline
│   │   ├── RenderPipeline.ts        # EffectComposer setup (bloom, CRT, FXAA)
│   │   ├── VectorMaterials.ts       # Shared materials (line colors per palette)
│   │   ├── ColorPalette.ts          # Green/amber/red palette definitions and transitions
│   │   ├── CockpitRenderer.ts       # Cockpit frame, actuator arms geometry
│   │   └── shaders/
│   │       └── CRTShader.ts         # Custom CRT scanline/chromatic aberration shader
│   │
│   ├── audio/                       # Audio system
│   │   ├── AudioManager.ts          # Channel management, manifest loading
│   │   ├── AudioChannel.ts          # Single channel (volume, play, stop, queue)
│   │   └── SoundManifest.ts         # Manifest type definitions
│   │
│   ├── narrative/                   # Narrative/dialogue system
│   │   ├── DialogueManager.ts       # Trigger evaluation, queuing, display
│   │   └── DialogueTypes.ts         # Dialogue entry type definitions
│   │
│   ├── ui/                          # UI layer
│   │   ├── hud/                     # Three.js rendered HUD (bloom pipeline)
│   │   │   ├── HUDManager.ts        # HUD update orchestration
│   │   │   ├── ShieldBar.ts         # Vector line shield display
│   │   │   ├── ScoreDisplay.ts      # Vector-rendered score numbers
│   │   │   └── WeaponIndicator.ts   # Active weapon icon
│   │   └── screens/                 # HTML/CSS overlay screens
│   │       ├── MenuScreen.ts        # Main menu (Start, High Scores, Credits)
│   │       ├── BriefingScreen.ts    # Between-level briefing text scroll
│   │       ├── CommOverlay.ts       # Handler/AI dialogue text overlay
│   │       ├── GameOverScreen.ts
│   │       ├── HighScoreScreen.ts
│   │       └── styles/
│   │           └── ui.css           # Vector-styled CSS (monospace, glow, palette colors)
│   │
│   ├── debug/                       # Debug tools (stripped from production)
│   │   ├── DebugManager.ts          # URL param detection, overlay toggling
│   │   ├── DebugOverlay.ts          # State inspector, Stats.js integration
│   │   ├── CollisionDebug.ts        # Visible bounding sphere wireframes
│   │   ├── RailPathDebug.ts         # Visible spline path rendering
│   │   └── DebugConsole.ts          # window.debug API
│   │
│   └── types/                       # Shared TypeScript types
│       ├── game.ts                  # Game-wide types (PhaseType, WeaponType, etc.)
│       └── three-extensions.d.ts    # Three.js addon type declarations
│
├── assets/                          # Runtime data files (loaded via fetch/import)
│   ├── levels/
│   │   ├── level1.json              # Level 1 config (spawns, paths, obstacles, palette)
│   │   ├── level2.json
│   │   └── level3.json
│   ├── bosses/
│   │   ├── gatekeeper.json          # Boss 1 config (health, patterns, dialogue triggers)
│   │   ├── avenger.json
│   │   └── core-intelligence.json
│   └── dialogue/
│       ├── tutorial.json            # Tutorial dialogue triggers
│       ├── handler.json             # Handler comm lines (all levels)
│       └── bosses.json              # AI taunt lines (all bosses)
│
├── index.html                       # Entry HTML (canvas + UI overlay containers)
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .gitignore

### System Location Mapping

| System | Location | Responsibility |
|--------|---------|---------------|
| Game Loop | `src/core/GameLoop.ts` | `setAnimationLoop`, delta time, system update ordering |
| EventBus | `src/core/EventBus.ts` + `GameEvents.ts` | Typed pub/sub for all inter-system communication |
| Input | `src/core/InputManager.ts` + `src/config/input.ts` | Action-mapped keyboard state |
| State Management | `src/state/` | Hierarchical FSM — game states and phase states |
| Entities | `src/entities/` | All game objects — player, enemies, bosses, projectiles, effects |
| Enemy AI | `src/ai/` | State pattern FSM, behavioral evolution parameters |
| Rail Movement | `src/systems/RailMovement.ts` | Spline path, camera following, player offset |
| Combat/Weapons | `src/systems/WeaponSystem.ts` | Fire events, projectile spawning, cooldowns |
| Collision | `src/systems/CollisionSystem.ts` | Raycaster + bounding sphere checks |
| Level/Phase | `src/systems/LevelManager.ts` + `assets/levels/` | JSON config loading, phase sequencing |
| Rendering | `src/rendering/` | EffectComposer pipeline, materials, palettes, cockpit, CRT shader |
| Audio | `src/audio/` | AudioManager, channels, manifest loading |
| Narrative | `src/narrative/` | DialogueManager, trigger evaluation, queuing |
| HUD | `src/ui/hud/` | Three.js vector-rendered shields, score, weapon indicator |
| Screens | `src/ui/screens/` | HTML/CSS menus, briefings, comm overlay, game over |
| Object Pooling | `src/core/ObjectPool.ts` | Generic pool used by all entity types |
| Score/Persistence | `src/systems/ScoreManager.ts` | Score tracking, localStorage high scores |
| Debug Tools | `src/debug/` | Stats.js, state inspector, collision viz, console API |
| Error Handling | `src/core/ErrorHandler.ts` | Global handler, critical vs non-critical |
| Logging | `src/core/Logger.ts` | `[LEVEL][System]` console wrapper |
| Configuration | `src/config/` | Constants, rendering params, input mappings |

### Naming Conventions

**Files:**

| Type | Convention | Example |
|------|-----------|---------|
| TypeScript source | `PascalCase.ts` | `CollisionSystem.ts`, `DataLanceBolt.ts` |
| JSON data | `kebab-case.json` | `core-intelligence.json`, `level1.json` |
| CSS | `kebab-case.css` | `ui.css` |
| Audio files | `snake_case.ogg` | `data_lance_fire.ogg`, `handler_01.ogg` |

**Code Elements:**

| Element | Convention | Example |
|---------|-----------|---------|
| Classes | `PascalCase` | `CollisionSystem`, `DataLanceBolt` |
| Interfaces/Types | `PascalCase` | `GameEvents`, `PhaseType` |
| Functions/Methods | `camelCase` | `spawnEnemy()`, `getPointAt()` |
| Variables | `camelCase` | `currentPhase`, `shieldHealth` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_POOL_SIZE`, `BLOOM_STRENGTH` |
| Enum values | `PascalCase` | `PhaseType.Dogfight`, `WeaponType.DataLance` |
| Event names | `camelCase` | `enemyDestroyed`, `phaseStart` |
| Private members | `camelCase` (no prefix) | `health`, `cooldown` (TypeScript `private` keyword) |

### Architectural Boundaries

1. **Entities never import systems** — entities don't know about CollisionSystem or ScoreManager. Communication goes through EventBus.
2. **Systems never import each other** — WeaponSystem doesn't call CollisionSystem directly. Events decouple them.
3. **UI never imports game logic** — HUD and screens subscribe to events, never reach into entity state directly.
4. **Config is read-only** — systems import constants, never mutate them.
5. **Debug code is isolated** — everything in `src/debug/` is stripped from production builds. No debug imports in non-debug files.
6. **JSON data files are the content boundary** — AI agents modify JSON for balancing/content, TypeScript for behavior/rules.

---

## Implementation Patterns

These patterns ensure consistent implementation across all AI agents.

### Novel Patterns

#### 1. Color Depth System

**Purpose:** Transition the entire scene's color palette (green → amber → red) per level, affecting all rendered geometry uniformly without per-object color management.

**Pattern: Centralized Palette with Material Registry**

**Components:**
- `ColorPalette` — Defines palette presets (green, amber, red) as HSL base values
- `VectorMaterials` — Material registry singleton. All line materials created through this. Holds references to every active material.
- `LevelManager` — Triggers palette change on level load

**Data Flow:**
```
LevelManager loads level config
  → reads palette name ("green" | "amber" | "red")
  → calls ColorPalette.setActive(paletteName)
  → ColorPalette updates base HSL values
  → VectorMaterials.updateAll() iterates registered materials
  → each material.color is recalculated from new palette base
  → scene renders with new palette immediately
```

**Implementation:**
```typescript
const PALETTES = {
  green: { hue: 0.33, saturation: 1.0, lightness: 0.5 },
  amber: { hue: 0.11, saturation: 1.0, lightness: 0.5 },
  red:   { hue: 0.0,  saturation: 1.0, lightness: 0.5 },
} as const;

class VectorMaterials {
  private materials: Map<string, LineBasicMaterial> = new Map();
  private palette = PALETTES.green;

  create(id: string, lightnessOffset = 0): LineBasicMaterial {
    const mat = new LineBasicMaterial();
    this.materials.set(id, mat);
    this.applyPalette(mat, lightnessOffset);
    return mat;
  }

  setPalette(name: keyof typeof PALETTES): void {
    this.palette = PALETTES[name];
    this.materials.forEach((mat, id) => this.applyPalette(mat));
  }

  private applyPalette(mat: LineBasicMaterial, offset = 0): void {
    mat.color.setHSL(this.palette.hue, this.palette.saturation,
                     this.palette.lightness + offset);
  }
}
```

**Rule:** No system ever creates a `LineBasicMaterial` or `LineMaterial` directly. Always use `VectorMaterials.create()`. This ensures palette transitions affect everything.

#### 2. Boss Destruction Choreography

**Purpose:** Orchestrate the multi-stage boss destruction sequence (peel → strip → shatter) as a timed animation that coordinates geometry, effects, audio, and narrative.

**Pattern: Sequenced Animation Timeline**

**Components:**
- `DestructionSequence` — Timeline of keyed stages with durations and callbacks
- `Boss` entity — Owns geometry layers (outer shell, mid structure, inner core)
- `EffectsManager` — Spawns vector shard explosions at each stage
- `AudioManager` — Plays escalating destruction SFX
- `EventBus` — Fires `bossDestructionStage` events for narrative triggers

**Data Flow:**
```
Boss health reaches 0
  → Boss creates DestructionSequence([...stages])
  → GameLoop calls sequence.update(dt) each frame
  → Each stage fires callbacks at start/during/end
  → Callbacks coordinate geometry removal, effects, audio, events
  → Final stage emits 'bossDestroyed' on EventBus
```

**Implementation:**
```typescript
interface DestructionStage {
  name: string;
  duration: number;
  onStart: () => void;
  onUpdate: (progress: number) => void;  // 0.0 → 1.0
  onEnd: () => void;
}

class DestructionSequence {
  private stages: DestructionStage[];
  private currentIndex = 0;
  private elapsed = 0;
  public complete = false;

  constructor(stages: DestructionStage[]) {
    this.stages = stages;
    this.stages[0].onStart();
  }

  update(dt: number): void {
    if (this.complete) return;
    const stage = this.stages[this.currentIndex];
    this.elapsed += dt;
    const progress = Math.min(this.elapsed / stage.duration, 1.0);
    stage.onUpdate(progress);

    if (progress >= 1.0) {
      stage.onEnd();
      this.currentIndex++;
      this.elapsed = 0;
      if (this.currentIndex >= this.stages.length) {
        this.complete = true;
      } else {
        this.stages[this.currentIndex].onStart();
      }
    }
  }
}
```

**Rule:** Boss destruction is always a `DestructionSequence`. Never hardcode timed destruction logic in `update()` with elapsed-time counters. Stage definitions can be loaded from boss JSON configs for per-boss customization.

#### 3. Selective Bloom Pipeline

**Purpose:** Apply phosphor glow (bloom) only to vector wireframe lines while keeping the dark background unaffected.

**Pattern: Layer-based Selective Bloom (Two-Composer)**

**Components:**
- `THREE.Layers` — Bloom layer (layer 1) for vector objects, default layer (layer 0) for non-bloom
- Two `EffectComposer` instances — bloom composer renders only bloom-layer objects, final composer mixes bloom with full scene
- `ShaderPass` — Custom mix shader combines bloom texture with base render
- `RenderPipeline` — Orchestrates the two-pass render

**Data Flow:**
```
Frame render:
  1. Set all non-bloom objects to black material (temp)
  2. bloomComposer.render() — renders bloom-layer objects with UnrealBloomPass
  3. Restore original materials
  4. finalComposer.render() — renders full scene + mixes in bloom texture
  → Result: vector lines glow, background stays black
```

**Implementation:**
```typescript
const BLOOM_LAYER = 1;
const bloomLayer = new THREE.Layers();
bloomLayer.set(BLOOM_LAYER);

// Bloom composer (renders only bloom objects)
const bloomComposer = new EffectComposer(renderer);
bloomComposer.renderToScreen = false;
bloomComposer.addPass(new RenderPass(scene, camera));
bloomComposer.addPass(new UnrealBloomPass(resolution, strength, radius, threshold));

// Final composer (full scene + bloom mix + CRT + FXAA)
const finalComposer = new EffectComposer(renderer);
finalComposer.addPass(new RenderPass(scene, camera));
finalComposer.addPass(bloomMixPass);    // mixes in bloomComposer output
finalComposer.addPass(crtPass);          // optional CRT shader
finalComposer.addPass(new OutputPass());
finalComposer.addPass(new FXAAPass());

// Any vector object — add to bloom layer
enemy.mesh.layers.enable(BLOOM_LAYER);
cockpit.mesh.layers.enable(BLOOM_LAYER);
```

**Rule:** Every `LineSegments`, `Line2`, or vector geometry object must call `mesh.layers.enable(BLOOM_LAYER)` on creation. Enforced in `GameObject` base class. Background/environment objects that should NOT glow stay on layer 0 only.

#### 4. Behavioral Evolution System

**Purpose:** Allow the same enemy types and AI states to behave differently across levels through parameterization rather than code duplication.

**Pattern: Parameter-Driven AI with Level Config Injection**

**Components:**
- `BehaviorParams` — TypeScript interface defining all tunable AI parameters
- `assets/levels/*.json` — Level configs include behavior parameter sets per enemy type
- `LevelManager` — Loads and provides behavior params for current level
- `AIState` subclasses — Read parameters from their owning enemy, never from globals

**Data Flow:**
```
LevelManager loads level2.json
  → extracts behaviorParams.sentinel = { patrolSpeed: 1.5, ... }
  → Enemy spawned: new Sentinel(behaviorParams.sentinel)
  → Sentinel stores params as instance property
  → PatrolState.update() reads this.enemy.params.patrolSpeed
  → No conditionals on level number anywhere in AI code
```

**Implementation:**
```typescript
interface BehaviorParams {
  patrolSpeed: number;
  attackCooldown: number;
  evasionChance: number;
  movementRandomness: number;
  attackDamage: number;
  projectileSpeed: number;
}

// AI states read from enemy.params — never check level number
class PatrolState implements AIState {
  update(enemy: Enemy, dt: number): void {
    const speed = enemy.params.patrolSpeed;
    const jitter = (Math.random() - 0.5) * enemy.params.movementRandomness;
    enemy.position.x += (speed + jitter) * dt;
  }
}
```

**Rule:** AI state classes NEVER contain `if (level === 3)` conditionals. All behavioral variation comes from `BehaviorParams` injected at spawn time. To change how enemies behave in a level, modify the JSON config — not the code.

### Standard Patterns

#### Component Communication

**Pattern:** EventBus-first, direct reference only for parent-child

- **Between systems:** Always EventBus. No imports between systems.
- **Parent-child:** Direct reference is fine. A phase class can call `this.levelManager.getCurrentConfig()`.
- **Entity to system:** EventBus. An enemy emits `enemyDestroyed`, never calls `scoreManager.addScore()` directly.

```typescript
// CORRECT — EventBus between systems
eventBus.emit('enemyDestroyed', { enemy, position });

// CORRECT — direct reference for parent-child
class PlayingState {
  update(dt: number) {
    this.phaseStateMachine.update(dt);
  }
}

// WRONG — system importing system
import { ScoreManager } from '../systems/ScoreManager';  // ❌ never
```

#### Entity Creation

**Pattern:** Factory functions + Object Pool

Entities are created through factory functions that handle pool acquisition, geometry setup, and parameter injection. Never `new Entity()` directly in gameplay code.

```typescript
function spawnSentinel(position: Vector3, params: BehaviorParams): Sentinel {
  const sentinel = sentinelPool.acquire();
  sentinel.reset();
  sentinel.init(position, params);
  sentinel.mesh.layers.enable(BLOOM_LAYER);
  gameObjectManager.add(sentinel);
  scene.add(sentinel.mesh);
  return sentinel;
}

function despawnEnemy(enemy: Enemy): void {
  gameObjectManager.remove(enemy);
  scene.remove(enemy.mesh);
  enemy.pool.release(enemy);
}
```

**Rule:** All entity creation goes through factory functions. This guarantees bloom layer assignment, pool management, scene addition, and manager registration happen consistently.

#### State Transition

**Pattern:** Class-based FSM with `enter`/`update`/`exit` (used at game, phase, and AI level)

```typescript
interface State<T> {
  enter(context: T): void;
  update(context: T, dt: number): void;
  exit(context: T): void;
}

class StateMachine<T> {
  private current: State<T> | null = null;

  transition(next: State<T>, context: T): void {
    if (this.current) this.current.exit(context);
    this.current = next;
    this.current.enter(context);
    Logger.debug('State', `→ ${next.constructor.name}`);
  }

  update(context: T, dt: number): void {
    if (this.current) this.current.update(context, dt);
  }
}
```

**Rule:** One `StateMachine` generic class, three usages: `StateMachine<Game>` for game flow, `StateMachine<Phase>` for phase flow, `StateMachine<Enemy>` for AI. Same pattern everywhere.

#### Data Access

**Pattern:** Typed loaders with async init, sync runtime access

JSON data files loaded once during state `enter()` (async). After loading, data accessed synchronously. No async calls during gameplay.

```typescript
class DogfightPhase implements State<Game> {
  private config!: LevelConfig;

  async enter(game: Game): Promise<void> {
    this.config = await LevelManager.loadLevel(game.currentLevel);
    this.spawnEnemies(this.config.spawnEvents);
  }

  update(game: Game, dt: number): void {
    const nextSpawn = this.config.spawnEvents[this.spawnIndex];
    if (this.railDistance >= nextSpawn.distance) {
      spawnSentinel(nextSpawn.position, this.config.behaviorParams.sentinel);
    }
  }
}
```

**Rule:** No `fetch()` or `await` during gameplay frames. All data loading happens in `enter()`.

### Consistency Rules

| Pattern | Convention | Enforcement |
|---------|-----------|-------------|
| Materials | Always via `VectorMaterials.create()` | Never `new LineBasicMaterial()` directly |
| Bloom layer | `mesh.layers.enable(BLOOM_LAYER)` on all vector geometry | Enforced in `GameObject` base class |
| Entity creation | Factory functions + pool | Never `new Entity()` in gameplay code |
| State machines | `State<T>` interface + `StateMachine<T>` class | Same base for game, phase, and AI states |
| Inter-system comms | EventBus only | No system-to-system imports |
| AI behavior | Parameter-driven, no level conditionals | All variation from `BehaviorParams` in JSON |
| Data loading | Async in `enter()`, sync in `update()` | No `fetch`/`await` during gameplay |
| Destruction | `DestructionSequence` timeline | No manual elapsed-time counters for choreography |
| Color palette | `VectorMaterials.setPalette()` | No per-object color management |
| Logging | `Logger.level('System', message, context)` | No raw `console.log` |

---

## Architecture Validation

### Validation Summary

| Check | Result | Notes |
|-------|--------|-------|
| Decision Compatibility | PASS | All 12 decisions mutually compatible. FSM pattern consistent across game, phase, and AI layers. |
| GDD Coverage | PASS | 12/12 systems covered. Electron wrapper intentionally deferred to Epic 6. |
| Pattern Completeness | PASS | 8 patterns (4 novel + 4 standard) covering all coding scenarios. |
| Epic Mapping | PASS | All 6 epics have clear architecture support with specific file locations. |
| Document Completeness | PASS | All mandatory sections present. No placeholder text. |

### Coverage Report

**Systems Covered:** 12/12
**Patterns Defined:** 8 (4 novel + 4 standard)
**Decisions Made:** 12
**Cross-cutting Concerns:** 5
**Consistency Rules:** 10

### Deferred Items

- **Electron desktop wrapper** — GDD secondary platform. Architecture is browser-first. Electron wrapping is an Epic 6 concern that requires no architectural changes (same codebase, Vite build output served locally).

### Validation Date

2026-03-26

---

## Development Environment

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+ (comes with Node.js)
- **Git** 2.x+
- **Modern browser** with WebGL 2.0 support (Chrome, Firefox, Safari, Edge)
- **Code editor** with TypeScript support (VS Code recommended)

### AI Tooling (MCP Servers)

The following MCP server was selected during architecture to enhance AI-assisted development:

| MCP Server | Purpose | Install Type |
|-----------|---------|-------------|
| **Context7** ([upstash/context7](https://github.com/upstash/context7)) | Current Three.js r183 API documentation lookup | npx command |

**Setup:**
```bash
claude mcp add context7 -- npx -y @upstash/context7-mcp
```

This gives your AI assistant access to current Three.js documentation, preventing outdated API usage.

### Setup Commands

```bash
# Create project
npm create vite@latest vector-wars -- --template vanilla-ts
cd vector-wars

# Install dependencies
npm install three @types/three

# Install dev dependencies
npm install -D stats.js

# Start development server
npm run dev
```

### First Steps

1. Run setup commands to create the Vite + Three.js project
2. Create the directory structure defined in Project Structure
3. Configure Context7 MCP for AI-assisted development
4. Implement `src/core/` infrastructure (Game, GameLoop, EventBus, Logger, InputManager, ObjectPool)
5. Begin Epic 1: Core Tech Validation — vector rendering + bloom + cockpit view
