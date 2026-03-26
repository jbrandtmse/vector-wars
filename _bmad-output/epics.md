---
project_name: 'vector-wars'
game_name: 'Vector Wars'
date: '2026-03-25'
total_epics: 6
total_estimated_stories: '46-58'
source: 'gdd.md'
---

# Vector Wars - Development Epics

**Project:** vector-wars
**Date:** 2026-03-25
**Total Epics:** 6
**Total Estimated Stories:** 46-58

## Epic Overview

| # | Epic Name | Scope | Dependencies | Est. Stories | Playable Milestone |
|---|-----------|-------|-------------|-------------|-------------------|
| 1 | Core Tech Validation | Foundation | None | 6-8 | Vector scene with cockpit and firing |
| 2 | Core Game Loop | Gameplay | Epic 1 | 8-10 | One playable dogfight phase |
| 3 | Complete Level 1 | Content | Epic 2 | 8-10 | Full 4-phase level with boss |
| 4 | Narrative & Audio | Polish | Epic 2 | 8-10 | Level 1 with full narrative and sound |
| 5 | Full Campaign | Content | Epics 3 & 4 | 10-12 | Complete 3-level campaign |
| 6 | Polish & Ship | Release | Epic 5 | 6-8 | Shippable game |

### Recommended Sequence

```
Epic 1 → Epic 2 → Epic 3 ──→ Epic 5 → Epic 6
                    └→ Epic 4 ─┘
```

Epics 3 and 4 can overlap — narrative/audio work can happen in parallel with Level 1 content. Both must complete before Epic 5.

---

## Epic 1: Core Tech Validation

### Goal

Validate that the vector aesthetic works and feels right. Prove the technology stack (Three.js + Vite) delivers authentic vector rendering with phosphor glow.

### Scope

**Includes:**
- Vite + Three.js project scaffolding
- Vector line rendering with `LineSegments`/`Line2`
- `UnrealBloomPass` post-processing for authentic phosphor glow
- First-person cockpit view with `PerspectiveCamera`
- Actuator arms / missile rack cosmetic geometry
- Keyboard input handling (arrow keys + spacebar)
- Data Lance firing with vector bolt visuals and SFX placeholder
- Basic scene (starfield/grid background)
- Green color palette

**Excludes:**
- Enemy spawning, collision, damage systems
- Rail movement (camera is static or simple path)
- Audio beyond placeholder SFX
- HUD, menus, scoring
- All other weapons (Logic Bombs, EMP, Virus Payload)

### Dependencies

None — this is the foundation epic.

### Deliverable

A browser window showing a first-person vector cockpit view with glowing green wireframe lines, visible actuator arms, and the ability to move the viewport with arrow keys and fire Data Lance bolts with spacebar. The bolts should look and feel satisfying. This is the "does it look right?" test.

### Stories

1. As a developer, I can set up a Vite + Three.js project so that I have a working development environment with HMR
2. As a developer, I can render vector wireframe lines with phosphor glow so that the authentic vector aesthetic is validated
3. As a player, I can see a first-person cockpit view with actuator arms so that the visual framing matches the 1983 arcade inspiration
4. As a player, I can move my viewport with arrow keys so that aiming feels smooth and responsive
5. As a player, I can fire Data Lance bolts with spacebar so that the core shooting action feels snappy and satisfying
6. As a developer, I can see a basic vector scene (grid/starfield background) so that the cockpit exists within a cyberspace environment
7. As a developer, I can validate the post-processing pipeline (bloom → optional CRT → FXAA) so that the rendering stack is proven

---

## Epic 2: Core Game Loop

### Goal

Create one playable dogfight phase that's fun. This is the vertical slice — the "is this fun?" milestone.

### Scope

**Includes:**
- Rail movement system (camera on CatmullRomCurve3 spline path)
- Enemy spawning system (distance-based spawn events)
- Sentinel enemy type with FSM AI (Spawn → Patrol → Attack → Destroyed)
- Raycasting collision detection (player weapons → enemies)
- Bounding sphere collision (enemy projectiles → player)
- Shield/health system with damage feedback (screen shake, vector flash)
- Object pooling for projectiles and particles
- Vector shard explosion effects on enemy destruction
- Minimal HUD (shields, score, weapon icon)
- Delta-time based game loop
- Game state FSM (at minimum: playing, game over)

**Excludes:**
- Phase transitions, multiple phase types
- Boss encounters
- Secondary weapons (Logic Bombs, EMP, Virus Payload)
- Additional enemy types (Watchdog, Gatekeeper, Overseer)
- Audio beyond basic SFX placeholders
- Narrative (handler comms, AI taunts)
- Menus, high score table

### Dependencies

Epic 1 (Core Tech Validation)

### Deliverable

A single playable dogfight phase: fly through open vector cyberspace on a rail, shoot Sentinel enemies with Data Lance, dodge incoming data bursts, see shields deplete on hits with screen shake feedback, watch enemies explode into vector shards, and see a score increment. Game over when shields reach zero. This must feel fun to play repeatedly.

### Stories

1. As a player, I can fly along a rail path through cyberspace so that I experience smooth first-person movement through the vector world
2. As a player, I can see enemies spawn and patrol in the environment so that there are targets to engage
3. As a player, I can destroy enemies with Data Lance fire so that shooting feels connected and rewarding
4. As a player, I can see enemies explode into vector shards so that destruction is visually satisfying
5. As a player, I can take damage from enemy data bursts so that there are stakes and tension
6. As a player, I can see my shields on the HUD so that I know my current health status
7. As a player, I can see screen shake and flash when I take damage so that hits feel impactful
8. As a player, I can see my score increment when I destroy enemies so that skilled play is tracked
9. As a developer, I can verify stable 60 FPS with object pooling so that performance targets are met
10. As a player, I can see a game over state when shields deplete so that failure has consequences

---

## Epic 3: Complete Level 1

### Goal

Build the complete Level 1 experience — all four phase types with transitions, culminating in the first boss encounter.

### Scope

**Includes:**
- Phase 2: Surface Attack (fortress exterior, firewall nodes, ICE towers as destructible targets)
- Phase 3: Data Corridor (straight corridor, firewalls, network cables, data streams as obstacles)
- Phase 4: Boss encounter (The Gatekeeper — attack patterns, vulnerability windows)
- Virus Payload weapon (C key) — functional for boss phase
- Logic Bombs weapon (Z key) — limited supply, lock-on targeting
- EMP Burst weapon (X key) — area disruption, enemy stun/slow
- Phase transition system (fade/dissolve between phases)
- Shield recharge between phases
- Watchdog enemy type (pursuit behavior)
- Gatekeeper enemy type (blocker behavior)
- Boss destruction sequence (peel → strip → shatter)
- Phase checkpoint system (death restarts current phase)

**Excludes:**
- Overseer enemy type (reserved for Level 2+)
- Levels 2 and 3 content
- Narrative (handler comms, AI taunts, briefings)
- Audio beyond expanded SFX placeholders
- Color palette transitions (stays green for Level 1)
- Tutorial sequence
- High score table, menus

### Dependencies

Epic 2 (Core Game Loop)

### Deliverable

Complete Level 1 playable from Phase 1 through Phase 4: dogfight in open cyberspace → surface attack on the AI fortress → data corridor navigation → boss encounter with The Gatekeeper. All four weapons functional. Phase checkpoints work. Boss destruction sequence plays. Level 1 feels like a complete, satisfying gameplay arc.

### Stories

1. As a player, I can fight Watchdog enemies that pursue me aggressively so that combat has variety beyond Sentinels
2. As a player, I can fight Gatekeeper enemies that block my path so that I'm forced into sustained engagements
3. As a player, I can fly over the AI fortress surface and destroy firewall nodes so that Phase 2 has distinct targeted-destruction gameplay
4. As a player, I can navigate a data corridor with obstacles so that Phase 3 delivers survival-focused tension
5. As a player, I can fire Logic Bombs with lock-on targeting so that I have a heavy weapon option for tough enemies
6. As a player, I can use EMP Burst to stun nearby enemies so that I have a tactical crowd-control option
7. As a player, I can face The Gatekeeper boss with distinct attack patterns so that the level has a proper climax
8. As a player, I can deliver a Virus Payload to the boss core so that the kill mechanic feels narrative and consequential
9. As a player, I can see the boss destruction sequence (peel → strip → shatter) so that victory is visually spectacular
10. As a player, I can transition smoothly between phases so that the level flows as a connected experience

---

## Epic 4: Narrative & Audio

### Goal

Layer the full narrative and audio experience onto Level 1. After this epic, Level 1 is a complete, polished gameplay experience with story and sound.

### Scope

**Includes:**
- Handler comm overlay system (text + voice playback, "HANDLER" label)
- AI taunt system (text + voice playback during boss encounter)
- Diegetic tutorial sequence ("First time jacking in? Let's run the calibration protocol...")
- Briefing screen system (vector text scroll + handler voice-over)
- Level 1 briefing screen content
- Handler voice lines for tutorial + Level 1 (~10-15 lines)
- The Gatekeeper voice lines (~7-10 lines)
- All SFX (Data Lance, Logic Bombs, EMP, Virus Payload, shield hits, explosions, corridor whooshes)
- Ambient electronic hum (intensity-reactive)
- AudioManager architecture (SFX, Voice, Ambient, Music players)
- Modular audio loading (replaceable audio assets)

**Excludes:**
- Levels 2 and 3 narrative content
- Boss 2 and Boss 3 voice lines
- Outro music and ending sequence
- Handler voice lines for Levels 2 and 3
- High score table, menus

### Dependencies

Epic 2 (Core Game Loop) — can run in parallel with Epic 3

### Deliverable

Level 1 with full narrative and audio: tutorial sequence introduces you to the handler and controls, handler comms play during gameplay with escalating tone, The Gatekeeper taunts you during the boss fight, all weapons and actions have satisfying retro SFX, ambient electronic hum provides atmosphere, and a briefing screen sets the stage for Level 2.

### Stories

1. As a player, I can see and hear handler comm messages during gameplay so that narrative is delivered without interrupting action
2. As a player, I can hear AI taunts from The Gatekeeper during the boss fight so that the boss has personality
3. As a player, I can experience a diegetic tutorial where the handler walks me through controls so that onboarding feels like part of the story
4. As a player, I can see a briefing screen between tutorial and Level 1 so that mission context is established
5. As a developer, I can load and play audio files through the AudioManager so that all audio is centrally managed and replaceable
6. As a player, I can hear satisfying retro SFX for all weapons and actions so that every interaction has audio feedback
7. As a player, I can hear ambient electronic hum that intensifies with action so that cyberspace has an audio atmosphere
8. As a developer, I can swap audio files without code changes so that AI-generated audio can be replaced with higher-quality assets later
9. As a player, I can hear synthesized handler voice lines that sound transmitted through a digital comm channel so that audio matches the vector aesthetic

---

## Epic 5: Full Campaign

### Goal

Expand from Level 1 to the complete 3-level campaign with all content, all enemies, all bosses, and the ending sequence.

### Scope

**Includes:**
- Level 2 content (all 4 phases, amber palette)
- Level 3 content (all 4 phases, red palette)
- Boss 2: The Avenger (aggressive, fast attack patterns, voice lines)
- Boss 3: The Core Intelligence (calm → unhinged, emotional arc, voice lines)
- Overseer enemy type (coordinator behavior)
- Behavioral evolution across levels (mechanical → aggressive → glitchy)
- Color depth system (green → amber → red palette transitions)
- Handler voice lines for Levels 2 and 3 (~20-35 additional lines)
- Briefing screens for Levels 2 and 3
- Ending sequence (outro music, credits, cyberspace fragmentation)
- High score table (localStorage)
- Difficulty scaling across all channels

**Excludes:**
- Menu screen (Epic 6)
- Browser compatibility testing (Epic 6)
- Performance optimization pass (Epic 6)
- Deployment / Electron wrapper (Epic 6)

### Dependencies

Epic 3 (Complete Level 1) AND Epic 4 (Narrative & Audio)

### Deliverable

The complete Vector Wars campaign: tutorial → Level 1 (green) → briefing → Level 2 (amber) → briefing → Level 3 (red) → ending sequence with outro music and credits. All three bosses with unique personalities and voice lines. All four enemy types with behavioral evolution. High score table tracks performance. The game is complete from start to finish.

### Stories

1. As a player, I can play through Level 2 with amber palette and aggressive enemies so that the campaign escalates in challenge
2. As a player, I can fight The Avenger boss who is fast and angry so that Level 2 has a punishing climax
3. As a player, I can play through Level 3 with red palette and glitchy enemies so that the final level feels dangerous and intense
4. As a player, I can fight The Core Intelligence boss with its calm-to-unhinged emotional arc so that the final encounter is narratively compelling
5. As a player, I can see the color palette shift from green to amber to red across levels so that visual progression reinforces depth into cyberspace
6. As a player, I can fight Overseer enemies that coordinate nearby constructs so that late-game combat has tactical complexity
7. As a player, I can experience enemy behavioral evolution across levels so that difficulty has narrative justification
8. As a player, I can hear handler voice lines escalating from invested to desperate so that the narrative arc completes
9. As a player, I can see briefing screens between all levels so that each level is contextualized
10. As a player, I can experience the ending sequence with outro music and credits so that completing the game feels rewarding and earned
11. As a player, I can see my score on a high score table so that replay motivation exists
12. As a player, I can see cyberspace fragment during the ending so that jacking out is visually spectacular

---

## Epic 6: Polish & Ship

### Goal

Polish the complete game and ship it. Browser compatibility, performance optimization, menu system, and deployment.

### Scope

**Includes:**
- Main menu screen (Start Game, High Scores, Credits)
- Game state management (menu → tutorial → gameplay → ending → menu)
- Browser compatibility testing (Chrome, Firefox, Safari, Edge)
- Performance optimization pass (draw calls, memory, frame rate)
- GitHub Pages deployment (GitHub Actions automated pipeline)
- Electron desktop wrapper (optional — Mac + Windows)
- Final audio polish and replacement pass
- Bug fixes from playtesting

**Excludes:**
- New content (levels, enemies, bosses)
- Post-MVP features (bonus stages, full soundtrack, arcade mode, level select)

### Dependencies

Epic 5 (Full Campaign)

### Deliverable

A shippable game: published on GitHub Pages, playable in all modern browsers at stable 60 FPS, with a menu system, polished audio, and a complete gameplay experience from start to finish. Optionally packaged as a desktop app via Electron for Mac and Windows distribution through GitHub Releases.

### Stories

1. As a player, I can see a main menu with Start Game, High Scores, and Credits so that the game has a proper entry point
2. As a player, I can navigate between menu, gameplay, and ending smoothly so that the full game flow is seamless
3. As a developer, I can verify the game runs at 60 FPS across Chrome, Firefox, Safari, and Edge so that browser compatibility is confirmed
4. As a developer, I can optimize draw calls, memory usage, and post-processing so that performance targets are met on all target browsers
5. As a developer, I can deploy to GitHub Pages via automated GitHub Actions so that pushing to main publishes the game
6. As a developer, I can package the game as an Electron app for Mac and Windows so that desktop distribution is available (optional)
7. As a player, I can experience polished, final-quality audio throughout the game so that the sound design meets the quality bar
8. As a developer, I can address bugs found during playtesting so that the shipped game is stable and enjoyable

---

## Post-MVP Features (Noted, Not Scoped)

These were identified during brainstorming but are explicitly out of scope for the initial release:

- **Bonus stages** between levels
- **Full soundtrack** replacement (beyond ambient hum)
- **Additional levels and AI bosses** (expandable campaign)
- **Arcade mode** (infinite escalation loop)
- **Level select** for replaying individual levels

These features may be scoped into future epics if the MVP ships successfully and demand warrants expansion.
