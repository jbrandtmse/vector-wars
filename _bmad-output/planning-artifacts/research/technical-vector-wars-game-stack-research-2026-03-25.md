---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments: []
workflowType: 'research'
lastStep: 1
research_type: 'technical'
research_topic: 'Vector Wars Game Technology Stack'
research_goals: 'Validate WebGL approach for vector rendering, evaluate frameworks, desktop wrappers, AI-generated audio tools, and synthesized voice generation'
user_name: 'Developer'
date: '2026-03-25'
web_research_enabled: true
source_verification: true
---

# Vector Wars Technical Research: Comprehensive Game Technology Stack Validation

**Date:** 2026-03-25
**Author:** Developer
**Research Type:** Technical Feasibility & Technology Stack Validation

---

## Executive Summary

This technical research validates the complete technology stack for Vector Wars — a first-person vector wireframe rail shooter built for the browser. The research confirms that **every aspect of the project is technically feasible using free, well-documented, and proven technologies.** The total development cost for tools and infrastructure is $0.

**Three.js** emerges as the clear rendering framework choice, offering native vector line rendering (`LineSegments`/`Line2`), built-in post-processing for authentic phosphor glow (`UnrealBloomPass`), and a massive community (110k GitHub stars, 5M+ weekly npm downloads). The recommended stack — Three.js + Vite + Web Audio API + GitHub Pages — is lightweight, free, and purpose-built for this type of project.

The architectural approach is well-understood: Entity-Component System for game objects, Finite State Machine for game states and enemy AI, raycasting for collision detection, and object pooling for performance. Rail shooter movement is architecturally simpler than free-movement games, reducing implementation risk.

**Key Findings:**
- Three.js with UnrealBloomPass creates authentic vector glow with minimal code
- Web Audio API handles all audio needs (SFX, voice, ambient) natively — no library required
- jsfxr (free) generates retro arcade SFX; ElevenLabs free tier handles voice generation
- GitHub Pages provides free hosting with automated deployment
- BMad GDS + Claude Code provides structured AI-assisted development workflow
- All major risks dropped from Medium to Low-Medium after research validation

**Top Recommendations:**
1. Use Three.js + Vite as the core development stack
2. Build browser-first; add Electron desktop wrapper only if needed later
3. Follow the 6-milestone implementation roadmap — validate the hardest parts first
4. Use AI-assisted development through BMad GDS for structured workflow management

---

## Table of Contents

1. Technical Research Scope Confirmation
2. Technology Stack Analysis (Rendering, Frameworks, Desktop Wrappers, Audio, Voice)
3. Integration Patterns (Game Architecture, Audio, Build Tools, Data Formats)
4. Architectural Patterns (Rail Movement, Enemy AI, Collision, Object Pooling, Scenes)
5. Implementation Approaches (AI-Assisted Workflow, Testing, Deployment, Roadmap)
6. Research Synthesis and Conclusions

---

## Research Overview

This research was conducted to validate the technical feasibility of Vector Wars before committing to full game design and development. Five parallel research areas were investigated using Perplexity-powered web search with source verification: (1) WebGL vector rendering techniques, (2) framework evaluation for browser-based arcade games, (3) desktop wrapper comparison, (4) AI-generated audio tools, and (5) synthesized voice generation approaches. All findings were verified against current (2024-2025) sources.

The research confirms strong technical feasibility across all areas. The recommended technology stack is entirely free, well-documented, and proven in production. The full executive summary and strategic recommendations are detailed in the synthesis section below.

---

## Technical Research Scope Confirmation

**Research Topic:** Vector Wars Game Technology Stack
**Research Goals:** Validate WebGL approach for vector rendering, evaluate frameworks, desktop wrappers, AI-generated audio tools, and synthesized voice generation

**Technical Research Scope:**

- Architecture Analysis - design patterns, frameworks, system architecture
- Implementation Approaches - development methodologies, coding patterns
- Technology Stack - languages, frameworks, tools, platforms
- Integration Patterns - APIs, protocols, interoperability
- Performance Considerations - scalability, optimization, patterns

**Research Methodology:**

- Current web data with rigorous source verification via Perplexity
- Multi-source validation for critical technical claims
- Confidence level framework for uncertain information
- Comprehensive technical coverage with architecture-specific insights

**Scope Confirmed:** 2026-03-25

## Technology Stack Analysis

### Rendering Framework — Three.js (Recommended)

**Verdict: Three.js is the clear winner for Vector Wars.**

| Framework | Bundle Size | WebGPU Perf | Best For | Cost |
|-----------|-------------|-------------|----------|------|
| **Three.js** | 168 kB | Excellent | Custom wireframes, rail shooters | Free/Open Source |
| Babylon.js | 1.4 MB | Strong | Complex 3D scenes/games | Free/Open Source |
| PixiJS | Small | 2D-focused | Pure 2D sprites | Free/Open Source |
| Raw WebGL | Minimal | Maximal | Low-level only | Free |

**Why Three.js:**
- 5M+ weekly npm downloads, 110k GitHub stars — massive community and ecosystem
- Native support for `LineSegments` and `Line2` — purpose-built for vector wireframe rendering
- `UnrealBloomPass` post-processing creates authentic phosphor glow with minimal code
- `PerspectiveCamera` handles first-person cockpit view natively
- Lightweight (168 kB gzipped) vs Babylon.js (1.4 MB) — critical for browser delivery
- Full WebGPU readiness for future performance gains
- Prototype a basic scene in <50 lines of code
- React integration available via R3F if needed later

**Why NOT others:**
- Raw WebGL: Maximum performance but requires manual shader/material management — too much boilerplate for a solo dev
- Babylon.js: Full engine is overkill for vector wireframes; larger bundle; more CPU overhead
- PixiJS: 2D-focused, lacks native 3D for first-person rail shooter

_Source: https://www.utsubo.com/blog/threejs-vs-babylonjs-vs-playcanvas-comparison_
_Source: https://dev.to/devin-rosario/babylonjs-vs-threejs-the-360deg-technical-comparison-for-production-workloads-2fn6_
_Source: https://blog.logrocket.com/best-javascript-html5-game-engines-2025/_

### Vector Line Rendering Techniques

**Sharp Vector Lines in WebGL:**
- Use `THREE.LineSegments` or `Line2` (from three.js examples) for thick, sharp, glowing lines
- Mesh line technique: generate two vertices per line point, extrude perpendicularly using normalized offset vectors — superior to GL_LINES for thick, sharp lines without gaps
- Anti-aliasing via distance fields or ray casting in fragment shaders

**Glow Effects (Authentic Retro Phosphor):**
- `UnrealBloomPass` in Three.js `EffectComposer` creates the signature vector glow
- Multi-pass rendering: render lines to framebuffers at varying widths/opacities, composite with additive blending
- Fragment shader glow: `glow = 1.0 - smoothstep(0.0, width, dist)` for distance attenuation
- Optional CRT shader pass for scanlines and chromatic aberration (enhances retro feel)

**Recommended Post-Processing Stack:**
```
RenderPass(scene, camera)
→ UnrealBloomPass (vector glow)
→ ShaderPass (optional CRT distortion/scanlines)
→ FXAA (anti-aliasing)
```

**Confidence Level: HIGH** — Multiple sources confirm this approach works for retro vector aesthetics in Three.js. Active community examples exist (e.g., Thralaga arcade demo).

_Source: https://offscreencanvas.com/issues/webgl-line-rendering/_
_Source: https://blog.maximeheckel.com/posts/beautiful-and-mind-bending-effects-with-webgl-render-targets/_
_Source: https://discourse.threejs.org/t/threejs-simulated-arcade-game-thralaga/64050_

### Game Loop Architecture

**Browser-based arcade game loop using requestAnimationFrame:**

```javascript
function gameLoop() {
  requestAnimationFrame(gameLoop);
  update(deltaTime);    // Input, physics, AI
  render();             // Composer passes: scene → bloom → FXAA → output
  composer.render();
}
```

**Architecture patterns:**
- Finite state machine for game states (menu/play/gameover/briefing)
- Modular systems: separate Player, Enemy, ParticleManager, PhaseManager classes
- Simple vector math for arcade physics (no full physics engine needed)
- Keyboard input handling via standard browser events
- Delta-time based updates for consistent gameplay across frame rates

_Source: https://threejsfundamentals.org/threejs/lessons/threejs-game.html_
_Source: https://developer.mozilla.org/en-US/docs/Games/Techniques/3D_on_the_web/Building_up_a_basic_demo_with_Three.js_

### Desktop Wrapper — Electron vs Tauri

| Factor | Electron | Tauri |
|--------|----------|-------|
| WebGL Consistency | Guaranteed (bundled Chromium) | Platform-dependent (WebKit on macOS may lag) |
| Bundle Size | 80-120 MB | Under 10 MB |
| Startup Time | 1-2 seconds | <500 ms |
| Memory Usage | 200-400 MB RAM | 20-40 MB RAM |
| Cost | Free/Open Source | Free/Open Source |
| macOS WebGL | Full Chromium support | WebKit — may have WebGL compatibility issues |

**Recommendation: Electron for guaranteed cross-platform WebGL consistency.**

The critical factor for Vector Wars is WebGL rendering consistency. Tauri uses the OS native webview — on macOS that's WebKit, which historically lags behind Chromium in WebGL feature support. Since Vector Wars relies heavily on WebGL post-processing (bloom, glow shaders), Electron's bundled Chromium guarantees identical rendering on Windows and macOS.

**Trade-off acknowledged:** Electron's larger bundle (100+ MB vs <10 MB for Tauri) and higher memory usage. For a passion project distributed via GitHub, this is acceptable. The cost of debugging WebKit-specific WebGL rendering issues on macOS is NOT acceptable for a solo developer.

**Alternative approach:** Ship browser-first (no wrapper needed). Desktop wrapper is secondary — players can play in Chrome/Firefox directly. Add Electron wrapper only if desktop distribution becomes a priority.

_Source: https://www.levminer.com/blog/tauri-vs-electron_
_Source: https://codeology.co.nz/articles/tauri-vs-electron-2025-desktop-development.html_
_Source: https://softwarelogic.co/en/blog/how-to-choose-electron-or-tauri-for-modern-desktop-apps_

### AI-Generated Audio Tools (Low/No Cost)

**Sound Effects:**

| Tool | Use Case | Cost | Notes |
|------|----------|------|-------|
| **ElevenLabs** | SFX generation via text prompts | Free tier available | Browser-based, royalty-free, retro SFX via prompt engineering |
| **FMOD Studio** | Procedural/adaptive audio | Free for indie (<$200K revenue) | Real-time generation, Unity/Unreal integration |
| **Wwise** | Dynamic soundscapes | Free for indie | Procedural audio, can mimic 8-bit synthesis |
| **jsfxr / sfxr** | Retro 8-bit SFX generator | Free/Open Source | Purpose-built for retro game SFX, browser-based |
| **ChipTone** | Chiptune SFX | Free | Browser-based, designed for retro game audio |

**Recommended approach for Vector Wars:**
1. Start with **jsfxr** (free, browser-based) for rapid retro SFX prototyping — purpose-built for exactly this use case
2. Use **ElevenLabs free tier** for more complex SFX and ambient sounds
3. Architecture must support drop-in audio replacement (file-based, not hardcoded)

**Ambient electronic hum:** Can be generated with free synthesizer tools (Web Audio API, Tone.js) or AI-generated. Simple enough to create programmatically.

_Source: https://elevenlabs.io/blog/best-aaa-video-game-sound-effects-tools-2024-enhance-your-game-design_
_Source: https://www.respeecher.com/blog/top-sound-effects-tools-for-indie-game-developers-a-2024-guide_

### Synthesized Voice Generation (Low/No Cost)

| Tool | Strengths | Cost | Retro Voice Suitability |
|------|-----------|------|------------------------|
| **ElevenLabs** | Voice cloning, emotion control, SSML | Free tier (10K chars/month) | Generate clean voice → apply retro processing |
| **Play.ht** | Expressive, emotion/tone adaptation | Free tier available | Good base for post-processing |
| **Cartesia Sonic TTS** | Low-latency, gaming-focused | Free tier | Precise pacing/pronunciation control |
| **Web Speech API** | Browser-native TTS | Free (built-in) | Very basic but zero cost |
| **Coqui TTS** | Open source, self-hosted | Free/Open Source | Full control, offline capable |

**Recommended approach for Vector Wars:**
1. **Generate clean voice lines** with ElevenLabs free tier or Coqui TTS (open source)
2. **Apply retro-digital processing** in post: bitcrushing, vocoding, filtering to achieve the "transmitted through a digital comm channel" effect
3. Handler voice: female, calm/clinical — generate ~30-50 lines
4. AI boss voices: cold monotone to glitchy/emotional — generate ~20-30 lines across 3 bosses
5. All voice files stored as replaceable audio assets

**Retro Processing Tip (from research):** Start with neutral TTS output, then apply effects (bitcrushing, vocoding) in a free DAW like Audacity for authentic 80s/90s synth voices. The AI generates clean audio; YOU make it retro.

_Source: https://cartesia.ai/blog/state-of-voice-ai-2024_
_Source: https://www.sonarworks.com/blog/learn/voice-ai-game-audio-film-sound-designers_

### Technology Adoption & Development Stack Summary

**Recommended Full Stack for Vector Wars:**

| Layer | Technology | Cost | Confidence |
|-------|-----------|------|------------|
| **Rendering** | Three.js (WebGL) | Free | HIGH |
| **Language** | JavaScript/TypeScript | Free | HIGH |
| **Build Tool** | Vite | Free | HIGH |
| **Post-Processing** | Three.js EffectComposer + UnrealBloomPass | Free | HIGH |
| **Game Architecture** | Custom FSM + modular systems | Free | HIGH |
| **SFX** | jsfxr + ElevenLabs free tier | Free | MEDIUM |
| **Voice** | ElevenLabs/Coqui TTS + Audacity post-processing | Free | MEDIUM |
| **Ambient Audio** | Web Audio API / Tone.js | Free | MEDIUM |
| **Desktop Wrapper** | Electron (if needed) | Free | HIGH |
| **Version Control** | Git + GitHub | Free | HIGH |

**Total cost: $0** — Every tool in the recommended stack is free or has a free tier sufficient for this project's scope.

## Integration Patterns Analysis

### Game Architecture Pattern — Entity-Component System (ECS)

**Recommended: ECS pattern for Vector Wars game architecture.**

ECS is the dominant architecture pattern in JavaScript game development. Instead of deep inheritance hierarchies, game objects are composed from discrete, reusable components.

**How this maps to Vector Wars:**

```
Player Ship = Mesh + InputComponent + WeaponSystem + ShieldComponent + HUDComponent
AI Construct = Mesh + AIBehavior + HealthComponent + WeaponComponent
Boss Entity = Mesh + BossAI + DialogueComponent + PhaseManager + HealthComponent
```

**Key advantages for a solo developer:**
- Components are reusable across entity types (e.g., HealthComponent works for player AND enemies)
- Systems operate independently — easier to debug and extend
- Adding new enemy types = composing existing components in new combinations
- Scales cleanly as the game grows from level 1 to level 3

**Game loop structure:**
```
requestAnimationFrame →
  InputSystem.update() →
  PhysicsSystem.update() →
  AISystem.update() →
  WeaponSystem.update() →
  ParticleSystem.update() →
  AudioSystem.update() →
  Renderer.render() →
  PostProcessing.render()
```

**State management: Finite State Machine (FSM)**
- Game states: Menu → Tutorial → Briefing → Phase1 → Phase2 → Phase3 → Phase4(Boss) → Briefing → ... → Ending → Credits
- Each state manages its own scene, input handling, and transitions
- Clean separation between gameplay phases

_Source: https://gitnation.com/contents/game-development-patterns-and-architectures-in-javascript_
_Source: https://www.seeles.ai/resources/blogs/three-js-games-examples-how-to-build_

### Audio Integration — Web Audio API

**Recommended: Web Audio API directly (no library needed for Vector Wars' scope).**

| Approach | Pros | Cons | Cost |
|----------|------|------|------|
| **Web Audio API** | Native browser API, zero dependencies, real-time DSP effects, oscillator synthesis for retro sounds | More verbose than libraries | Free (built-in) |
| **Howler.js** | Simplified API, cross-browser, sprite support | Extra dependency, less control | Free |
| **Tone.js** | Powerful synthesis, music-focused | Overkill for SFX-only games | Free |

**Why Web Audio API for Vector Wars:**
- Built-in oscillators (sine, square, triangle, sawtooth) can generate retro sounds programmatically
- Real-time DSP effects (filters, delays) for processing voice lines to sound "transmitted through comms"
- AudioContext integrates directly with the game loop for synchronized audio-visual feedback
- No external dependency needed — keeps the build lean
- Can load pre-generated audio files (SFX, voice lines) AND synthesize sounds in real-time

**Audio architecture for Vector Wars:**
```
AudioManager
  ├── SFXPlayer (Data Lance shots, explosions, shield hits)
  ├── VoicePlayer (Handler lines, AI taunts, boss dialogue)
  ├── AmbientPlayer (Electronic hum, intensity-reactive)
  └── MusicPlayer (Outro track only)
```

All audio files stored as replaceable assets — swap AI-generated audio for hand-crafted without code changes.

_Source: https://scribbler.live/2024/05/18/Web-Audio-API-Interactive-Sound-Applications-in-JavaScript.html_
_Source: https://tympanus.net/codrops/2025/06/18/coding-a-3d-audio-visualizer-with-three-js-gsap-web-audio-api/_

### Build Tool Integration — Vite + Three.js

**Recommended: Vite as the build tool / dev server.**

- Instant hot module replacement (HMR) for rapid development
- Native ES module support — Three.js imports work out of the box
- Fast production builds with Rollup under the hood
- Simple configuration — minimal setup for a Three.js project
- Free and open source

**Project structure pattern:**
```
vector-wars/
  ├── src/
  │   ├── main.js          # Entry point, game initialization
  │   ├── game/
  │   │   ├── Game.js       # Main game controller, FSM
  │   │   ├── scenes/       # Phase scenes (dogfight, surface, corridor, boss)
  │   │   ├── entities/     # Player, enemies, bosses
  │   │   ├── components/   # Reusable ECS components
  │   │   ├── systems/      # Input, physics, AI, weapons, particles
  │   │   └── ui/           # HUD, menus, briefing screens
  │   ├── audio/
  │   │   └── AudioManager.js
  │   ├── rendering/
  │   │   ├── VectorRenderer.js  # Line rendering, glow effects
  │   │   └── PostProcessing.js  # Bloom, optional CRT shader
  │   └── assets/
  │       ├── audio/        # SFX, voice lines (replaceable)
  │       └── data/         # Level data, dialogue scripts
  ├── public/
  ├── index.html
  ├── vite.config.js
  └── package.json
```

### Desktop Wrapper Integration — Electron

**If/when desktop packaging is needed:**

- Electron wraps the same WebGL application — no code changes needed
- `electron-builder` handles packaging for Mac (.dmg) and Windows (.exe)
- Main process loads `index.html` in a BrowserWindow
- Same Chromium rendering engine = guaranteed visual consistency with browser version

**Integration is minimal:**
```javascript
// main.js (Electron entry)
const { app, BrowserWindow } = require('electron');
const win = new BrowserWindow({ width: 1280, height: 720 });
win.loadFile('dist/index.html'); // Load built Vite output
```

**Recommendation: Build browser-first.** Add Electron wrapper as a separate packaging step only when needed. The game works identically in both environments.

_Source: https://www.levminer.com/blog/tauri-vs-electron_

### Data Format — Level and Dialogue Data

**Recommended: JSON for all game data.**

- Level definitions (enemy placement, phase timing, obstacle patterns)
- Dialogue scripts (handler lines, AI taunts, trigger conditions)
- Boss configurations (health, attack patterns, personality parameters)
- High score table (local storage via `localStorage` API)

JSON is native to JavaScript, requires no parsing libraries, and is human-readable for easy editing.

**High score persistence:** `localStorage` — free, built-in, no backend needed. Persists across browser sessions.

### Integration Summary

| Integration Point | Solution | Dependency | Cost |
|-------------------|----------|------------|------|
| Game architecture | ECS pattern | Custom code | Free |
| Rendering | Three.js + EffectComposer | Three.js | Free |
| Audio playback | Web Audio API | Native browser | Free |
| Build/dev server | Vite | Vite | Free |
| Desktop wrapper | Electron (optional) | Electron | Free |
| Data storage | JSON files + localStorage | Native browser | Free |
| Asset management | File-based, replaceable | None | Free |

**Confidence Level: HIGH** — All integration patterns use well-documented, widely-adopted technologies with extensive community support.

## Architectural Patterns and Design

### Rail Shooter Movement Architecture

Vector Wars is a first-person rail shooter — the player moves along a predetermined path through each phase, with freedom to aim/dodge within the viewport. This is architecturally simpler than free-movement FPS games.

**Rail movement pattern:**
- Camera follows a predefined spline/path through each phase
- Player input (arrow keys) controls viewport offset/aim position, NOT camera path
- Enemy spawning is synchronized to rail progression (distance along path)
- Phases are discrete rail segments: dogfight space → fortress surface → data corridor → boss arena

**Implementation approach:**
```
Phase = {
  railPath: CatmullRomCurve3,  // Camera follows this path
  spawnEvents: [               // Enemies spawn at path positions
    { distance: 0.1, type: 'sentinel', count: 3 },
    { distance: 0.3, type: 'watchdog', count: 2 },
    ...
  ],
  obstacles: [...],            // Corridor obstacles (phase 3)
  duration: auto               // Based on path length + speed
}
```

**Confidence Level: HIGH** — Rail movement is well-understood and significantly simpler to implement than free-movement systems.

### Enemy AI Architecture — Finite State Machine

**Recommended: Simple FSM per enemy type, NOT behavior trees.**

For an arcade game, enemies need predictable-but-challenging patterns, not complex decision-making. FSM keeps it clean and debuggable.

**Enemy states for Vector Wars:**

| State | Behavior | Transition |
|-------|----------|------------|
| **Spawn** | Appear with entry animation | → Patrol (immediate) |
| **Patrol** | Follow assigned pattern/path | → Attack (on timer or distance) |
| **Attack** | Fire data bursts at player | → Patrol (after attack cooldown) |
| **Evade** | Dodge player fire (higher levels) | → Patrol (after evasion) |
| **Destroyed** | Vector shard explosion | → Remove from scene |

**Behavioral evolution across levels:**
- Level 1: Mechanical, precise — predictable patrol patterns, timed attacks
- Level 2: Faster, more aggressive — shorter attack cooldowns, coordinated attacks
- Level 3: Glitchy, unpredictable — randomized patterns, evasion behavior, erratic movement

**Yuka library** is available as a standalone JS AI engine if more sophisticated behavior is needed later, but for MVP a custom FSM is simpler and sufficient.

_Source: https://discourse.threejs.org/t/yuka-a-javascript-library-for-developing-game-ai/5298_

### Collision Detection — Raycasting + Bounding Volumes

**Recommended: Raycasting for weapons, bounding spheres for obstacles/proximity.**

Vector Wars doesn't need pixel-perfect collision — it's an arcade game with vector wireframe objects. Simple collision is better.

**Collision approach:**
- **Player weapons → Enemies:** `THREE.Raycaster` from player position along aim direction. Only raycast on fire events, not every frame.
- **Enemy projectiles → Player:** Bounding sphere intersection check per frame (enemies fire data bursts, check if burst sphere intersects player shield sphere)
- **Corridor obstacles → Player:** Simple bounding box/sphere checks along the rail path
- **Boss encounters:** Zone-based triggers + raycasting for virus payload delivery

**Performance optimization:**
- Raycast only on shoot events, not continuously
- Use bounding spheres for broad-phase collision (cheap)
- Pre-filter with frustum culling — skip off-screen objects
- Keep active entity count manageable (<100 simultaneously)

_Source: https://sbcode.net/threejs/raycaster2/_

### Object Pooling — Particles and Projectiles

**Critical pattern for smooth performance: never create/destroy objects during gameplay.**

Pre-allocate pools for:
- **Player projectiles** (Data Lance bolts) — pool of ~50
- **Enemy projectiles** (data bursts) — pool of ~100
- **Explosion particles** (vector shards) — pool of ~200-500
- **EMP burst effects** — pool of ~10

**Pool lifecycle:**
```
Pool.get() → activate, set position → update each frame → lifetime expires → deactivate → return to pool
```

Use `THREE.InstancedMesh` for particle pools if counts exceed ~500 — update `instanceMatrix` in batches for GPU efficiency.

_Source: https://discourse.threejs.org/t/detect-collision-of-instanced-mesh-and-planes/66305_

### Scene Architecture — Phase-Based Level Design

Each level contains 4 phases, each phase is a discrete scene configuration:

```
Level
  ├── Phase 1: Dogfight
  │   ├── Open space environment (starfield/grid background)
  │   ├── Enemy spawner (Sentinels, Watchdogs)
  │   └── Rail path: wide, sweeping
  ├── Phase 2: Surface Attack
  │   ├── AI fortress exterior (wireframe surface geometry)
  │   ├── Firewall nodes + ICE towers (destructible)
  │   └── Rail path: surface-skimming approach
  ├── Phase 3: Data Corridor
  │   ├── Corridor geometry (straight, narrowing walls)
  │   ├── Obstacles: firewalls, network cables, data streams
  │   └── Rail path: straight, forward
  └── Phase 4: Boss
      ├── Boss arena (boss construct dominates view)
      ├── Boss entity (unique AI, dialogue, attack patterns)
      └── Rail path: approach + arena orbit
```

**Scene transitions:** Fade to black or vector dissolve between phases. Unload previous phase geometry, load next. Keep it simple — no streaming, no async loading complexity for 12 total segments.

### Performance Architecture Summary

| Concern | Solution | Target |
|---------|----------|--------|
| Frame rate | requestAnimationFrame + delta time | 60 FPS stable |
| Draw calls | Merge static geometry, use instancing | <500 per frame |
| Memory | Object pooling for all dynamic entities | No GC pauses during gameplay |
| Collision | Raycasting on events, bounding spheres for continuous | <1ms per frame |
| Rendering | EffectComposer with bloom + optional CRT | Post-processing budget: ~2-3ms |
| Profiling | Stats.js + Chrome DevTools Performance tab | Monitor throughout development |

**Confidence Level: HIGH** — All architectural patterns are well-established in browser game development. The deliberately constrained scope (keyboard only, no multiplayer, vector wireframes) keeps architectural complexity manageable for a solo developer.

## Implementation Approaches and Technology Adoption

### AI-Assisted Development Workflow

Vector Wars will be developed using AI-assisted development through the **BMad Game Development Studio (GDS)** — a structured agent-driven workflow that guides the entire lifecycle from design to implementation.

**BMad GDS Workflow for Vector Wars:**
1. Brainstorming (complete) → Game Brief (complete) → Technical Research (in progress)
2. Next: GDD → Game Architecture → Epics & Stories → Sprint Planning
3. Implementation: Story creation → Dev story execution → Code review → Sprint status
4. Each step produces structured artifacts that feed into the next

**AI pair programming best practices (validated by 2024-2025 research):**
- Write high-level stories with enough implementation detail for AI understanding
- Use AI for repetitive tasks (boilerplate, scaffolding, SFX generation) while maintaining creative control over core gameplay
- Review AI-generated code before committing — maintain quality control
- Clear specifications produce better AI output; vague prompts produce unusable code
- AI integration is the single most impactful productivity improvement for solo developers

**Development tools:**
- **Claude Code** — Primary AI development partner for code generation, debugging, architecture decisions
- **BMad GDS** — Structured workflow management, story creation, sprint planning
- **Git + GitHub** — Version control and distribution
- **VS Code** — IDE with AI integration

_Source: https://spin.atomicobject.com/ai-powered-solo-developer/_
_Source: https://www.meshy.ai/blog/ai-tools-for-indie-game-development-in-2024_

### Development Workflow

**Solo developer, part-time workflow:**

```
Sprint Cycle (BMad GDS managed):
  1. Sprint Planning → prioritize stories for current sprint
  2. Create Story → detailed spec with acceptance criteria
  3. Dev Story → AI-assisted implementation
  4. Code Review → validate quality
  5. Repeat → next story
```

**Daily development pattern:**
- Pull latest code
- Pick next story from sprint plan
- Implement with AI assistance
- Test in browser (Vite dev server with HMR)
- Commit working increments
- Push to GitHub

**Branching strategy:** Simple — `main` branch for stable, feature branches for each story. Solo developer doesn't need complex branching.

### Testing Approach

**Pragmatic testing for a solo game developer:**

| Test Type | Approach | Tools | Priority |
|-----------|----------|-------|----------|
| **Manual playtesting** | Play each phase after changes | Browser + DevTools | Critical |
| **Visual regression** | Screenshot comparison of vector rendering | Manual review | High |
| **Performance testing** | Monitor FPS, draw calls, memory | Stats.js + Chrome DevTools | High |
| **Unit tests** | Core game logic (collision, scoring, FSM) | Vitest (Vite-native) | Medium |
| **Browser compatibility** | Test on Chrome, Firefox, Safari, Edge | Manual | Medium |

**Key insight:** For a solo passion project, manual playtesting is more valuable than automated test suites. Focus automated tests only on core logic that's hard to verify visually.

### Deployment — GitHub Pages (Free)

**Primary deployment: GitHub Pages — completely free.**

```
Development: Vite dev server (localhost)
     ↓
Build: `npm run build` → production bundle in /dist
     ↓
Deploy: GitHub Actions → auto-deploy to GitHub Pages
     ↓
Live: username.github.io/vector-wars
```

**Automated deployment via GitHub Actions:**
- Push to `main` triggers build + deploy automatically
- No server costs, no infrastructure management
- HTTPS included by default
- Custom domain support if desired later

**Desktop distribution (if needed later):**
- `electron-builder` packages the Vite output
- Distribute via GitHub Releases (also free)

_Source: https://sbcode.net/threejs/github-pages/_
_Source: https://www.youtube.com/watch?v=ygdbUEsAYyQ_

### Implementation Roadmap

**Recommended build order — hardest/riskiest first:**

**Milestone 1: Core Tech Validation**
- Set up Vite + Three.js project
- Implement vector line rendering with bloom/glow
- Create first-person cockpit view with actuator arms
- Keyboard input handling (arrows + spacebar)
- Data Lance firing with vector bolt visuals
- **Goal:** Validate that the vector aesthetic WORKS and FEELS right

**Milestone 2: Core Game Loop**
- Rail movement system (camera on spline path)
- Enemy spawning and basic AI (Sentinel type)
- Collision detection (raycasting + bounding spheres)
- Shield system and damage feedback (screen shake, flash)
- Object pooling for projectiles and particles
- HUD (shields, score, weapon icons)
- **Goal:** One playable phase (dogfight) that's fun

**Milestone 3: Full Phase Set**
- Phase 2: Surface attack (fortress exterior, firewall nodes, ICE towers)
- Phase 3: Data corridor (obstacles, straight run)
- Phase 4: Boss encounter (Boss 1 — The Gatekeeper)
- Phase transitions (fade/dissolve)
- **Goal:** Complete Level 1, all 4 phases

**Milestone 4: Narrative & Audio**
- Handler comm overlay system
- AI taunt system
- Synthesized voice lines (AI-generated + post-processed)
- Ambient electronic hum (Web Audio API)
- SFX (jsfxr-generated retro sounds)
- Briefing screen between levels
- Diegetic tutorial sequence
- **Goal:** Level 1 with full narrative and audio

**Milestone 5: Full Campaign**
- Level 2 (Boss 2 — The Avenger) + difficulty scaling
- Level 3 (Boss 3 — The Core Intelligence) + final difficulty
- Color depth system (green → amber → red)
- Ending sequence (outro music, credits, cyberspace fragmentation)
- High score table (localStorage)
- **Goal:** Complete 3-level campaign, start to finish

**Milestone 6: Polish & Ship**
- Menu screen
- Browser compatibility testing
- Performance optimization
- GitHub Pages deployment
- Desktop wrapper (Electron, if desired)
- **Goal:** Ship it!

### Technology Stack Final Recommendation

| Layer | Technology | Status | Cost |
|-------|-----------|--------|------|
| Language | JavaScript (or TypeScript) | Validated | Free |
| Rendering | Three.js | Validated | Free |
| Build Tool | Vite | Validated | Free |
| Post-Processing | Three.js EffectComposer + UnrealBloomPass | Validated | Free |
| Audio | Web Audio API | Validated | Free |
| SFX Generation | jsfxr | Validated | Free |
| Voice Generation | ElevenLabs free tier / Coqui TTS | Validated | Free |
| Voice Processing | Audacity | Validated | Free |
| Testing | Vitest + Manual | Validated | Free |
| Hosting | GitHub Pages | Validated | Free |
| Desktop Wrapper | Electron (optional) | Validated | Free |
| Development Workflow | BMad GDS + Claude Code | Validated | Active subscription |
| Version Control | Git + GitHub | Validated | Free |

### Skill Development Requirements

As a software engineer learning game development, key areas to grow:
1. **Three.js fundamentals** — Scene graph, materials, cameras, rendering pipeline
2. **WebGL shaders** — Custom vertex/fragment shaders for vector glow effects
3. **Game loop patterns** — Delta time, fixed timestep, state management
4. **Game feel** — Screen shake, particle effects, juice (learn by doing)
5. **Audio integration** — Web Audio API basics, loading and playing sounds
6. **AI tool prompting** — Clear specifications for AI code generation

### Risk Reassessment (Post-Research)

| Risk | Pre-Research | Post-Research | Rationale |
|------|-------------|---------------|-----------|
| Scope too large | Medium | **Low-Medium** | Deliberate constraints + milestone-based approach reduces risk |
| AI dev tooling limits | Medium | **Low-Medium** | BMad GDS provides structured workflow; AI pair programming is proven for solo devs |
| WebGL vector rendering | Low | **Very Low** | Three.js + UnrealBloomPass is well-documented for exactly this use case |
| Audio quality | Medium | **Low** | jsfxr + ElevenLabs free tier + Audacity covers all needs at $0 |
| Motivation loss | Medium | **Medium** | Milestone-based development helps; each milestone is a visible achievement |

**Overall feasibility assessment: STRONG.** The technology stack is validated, all tools are free, the architecture is well-understood, and the scope is deliberately constrained. The biggest remaining risk is motivation over a long part-time project — mitigated by building the fun parts first (Milestone 1-2) and keeping each milestone small and rewarding.

---

## Research Synthesis and Conclusions

### Summary of Key Technical Findings

1. **Three.js is the optimal rendering framework** — Purpose-built features for vector line rendering, massive community, lightweight bundle, free. No other framework matches this combination for Vector Wars' requirements.

2. **The vector aesthetic is technically straightforward** — `LineSegments`/`Line2` + `UnrealBloomPass` achieves authentic retro phosphor glow. This is a solved problem with multiple working examples in the Three.js community.

3. **Architecture is simpler than typical 3D games** — Rail shooter movement, simple FSM enemy AI, raycasting collision, object pooling. No physics engine, no networking, no complex AI. A software engineer can learn and implement this.

4. **Audio is solved at zero cost** — jsfxr for retro SFX, Web Audio API for playback and synthesis, ElevenLabs/Coqui for voice generation, Audacity for processing. All free.

5. **Deployment is trivial** — Vite builds static files, GitHub Pages serves them. Push to main = game is live. Zero infrastructure cost or management.

6. **AI-assisted development is validated** — 2024-2025 research confirms AI pair programming is the single most impactful productivity improvement for solo developers. BMad GDS provides the structured workflow to maximize this advantage.

### Strategic Technical Impact Assessment

Vector Wars is **technically well-scoped for a solo developer using AI-assisted development.** The deliberate constraints (vector wireframes, keyboard only, no multiplayer, no backend) eliminate entire categories of complexity. The technology stack is mature, free, and well-documented.

The primary technical risk — "can AI-assisted development handle the full scope?" — is best answered by building Milestone 1 (Core Tech Validation). If the vector rendering works and feels right, every subsequent milestone builds on proven patterns.

### Next Steps — Technical Recommendations

1. **Proceed to GDD** — The technology is validated. Create the Game Design Document with confidence that the technical approach is sound.
2. **After GDD: Game Architecture** — Produce a formal architecture document based on this research, tailored to Vector Wars' specific needs.
3. **Prototype early** — Build Milestone 1 (vector rendering + cockpit + controls) as soon as architecture is complete. Validate the FEEL before designing all 12 phases in detail.
4. **Keep the stack simple** — Resist the urge to add libraries. Three.js + Vite + Web Audio API is sufficient. Every additional dependency is a maintenance burden.

---

### Source Documentation

**All research sources verified via Perplexity web search (2024-2025 data):**

- Three.js community and documentation (threejs.org, discourse.threejs.org)
- Framework comparisons (utsubo.com, dev.to, logrocket.com)
- WebGL line rendering techniques (offscreencanvas.com, openlayers discussions)
- Desktop wrapper analysis (levminer.com, codeology.co.nz, softwarelogic.co)
- AI audio tools (elevenlabs.io, respeecher.com, cartesia.ai)
- AI-assisted development (atomicobject.com, meshy.ai)
- Game architecture patterns (gitnation.com, seeles.ai)
- Deployment (sbcode.net, GitHub Pages documentation)

---

**Technical Research Completion Date:** 2026-03-25
**Research Period:** Comprehensive technical analysis with current (2024-2025) sources
**Source Verification:** All technical facts cited with current web sources via Perplexity
**Technical Confidence Level:** HIGH — based on multiple authoritative technical sources
**Overall Feasibility:** STRONG — proceed to GDD with confidence

_This technical research document validates the complete technology stack for Vector Wars and provides the foundation for Game Design Document creation and Game Architecture specification._
