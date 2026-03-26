---
title: 'Game Architecture'
project: 'vector-wars'
date: '2026-03-26'
author: 'Developer'
version: '1.0'
stepsCompleted: [1, 2]
status: 'in-progress'

# Source Documents
gdd: '_bmad-output/gdd.md'
epics: '_bmad-output/epics.md'
brief: '_bmad-output/game-brief.md'
---

# Game Architecture

## Document Status

This architecture document is being created through the GDS Architecture Workflow.

**Steps Completed:** 2 of 9 (Project Context)

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
