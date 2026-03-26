---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
inputDocuments:
  - _bmad-output/game-brief.md
  - _bmad-output/planning-artifacts/research/technical-vector-wars-game-stack-research-2026-03-25.md
  - _bmad-output/brainstorming-session-2026-03-25.md
documentCounts:
  briefs: 1
  research: 1
  brainstorming: 1
  projectDocs: 0
workflowType: 'gdd'
lastStep: 0
project_name: 'vector-wars'
user_name: 'Developer'
date: '2026-03-25'
game_type: 'shooter'
game_name: 'Vector Wars'
---

# Vector Wars - Game Design Document

**Author:** Developer
**Game Type:** Shooter (Rail Shooter)
**Target Platform(s):** Web Browser (WebGL) + Desktop (Mac/Windows)

---

## Executive Summary

### Game Name

Vector Wars

### Core Concept

Vector Wars is a first-person vector wireframe rail shooter set in a dystopian near-future where rogue AI systems have seized control of critical infrastructure. Players jack into cyberspace as a resistance agent, navigating sharp, clean wireframe environments to confront hostile AI directly. The vector aesthetic is diegetic — the wireframes aren't retro style for nostalgia's sake, they ARE the reality of cyberspace.

The game follows a three-level campaign structure inspired by the 1983 Star Wars arcade cabinet, with each level consisting of four distinct phases: open cyberspace dogfight, AI fortress surface attack, data corridor run, and a climactic boss encounter against a massive AI construct with its own personality and dialogue. Combat is constant and satisfying — four weapons (Data Lance, Logic Bombs, EMP Burst, Virus Payload), no power-ups, pure skill. A dual-voice narrative plays out through your cockpit as a handler guides you and the AI taunts you, delivering story without ever stopping the action.

The vision is simple: when players put down the keyboard, they should feel one thing — "I can't wait to jack back in."

### Game Type

**Type:** Shooter (Rail Shooter)
**Framework:** This GDD uses the shooter template with type-specific sections for weapon systems, aiming and combat mechanics, enemy design and AI, and arena/level design.

---

## Target Platform(s)

### Primary Platform

**Web Browser (WebGL)** — Instant access, no installation required, cross-platform by default. Players open a URL and play. This is the ideal delivery method for a game targeting nostalgic arcade fans who may not want to download and install software.

### Secondary Platform

**Desktop App (Mac + Windows)** — Same codebase wrapped via Electron for standalone distribution. Adds "real game" presence for players who prefer a dedicated application. Secondary priority — browser version ships first.

### Platform Considerations

- **Browser compatibility:** Chrome, Firefox, Safari, Edge — all modern browsers with WebGL support
- **Performance target:** Stable frame rate on any fairly modern web-enabled PC or Mac
- **No online features:** High score table is local only (localStorage)
- **No backend infrastructure:** Zero server costs, zero cloud dependencies
- **Desktop wrapper:** Electron chosen over Tauri for guaranteed WebGL rendering consistency across platforms (validated in technical research)
- **Distribution:** GitHub Pages (free hosting) for browser; GitHub Releases for desktop builds

### Control Scheme

**Keyboard only — 5 keys maximum.**
- Arrow keys: Movement / aiming within the viewport
- Spacebar: Data Lance (primary weapon)
- Z: Logic Bombs (heavy missiles)
- X: EMP Burst (area disruption)
- C: Virus Payload (boss-kill weapon)

No mouse, gamepad, or touch support. Deliberate constraint that reinforces the retro arcade identity.

---

## Target Audience

### Demographics

**Primary:** Gamers aged 45-60 who grew up standing at arcade cabinets in the 1980s. They know what vector graphics look like, they've gripped a yoke controller, and they remember feeding quarters into Star Wars, Tempest, and Battlezone.

**Secondary:** Younger retro enthusiasts who discovered vector aesthetics through Tempest 4000, Rez, or retro compilations, and indie game fans who gravitate toward stylized, focused experiences with clear artistic vision.

### Gaming Experience

**Casual to Core** — Players who value accessibility and pick-up-and-play design. They're experienced gamers but aren't looking for punishing difficulty or complex systems. They want satisfying action, not a skill check.

### Genre Familiarity

**High** — The primary audience is familiar with rail shooters, vector-style games, and arcade conventions (wave escalation, high score tables, phase-based progression). They'll recognize and appreciate authentic design choices without needing them explained.

### Session Length

**Short sessions (15-30 minutes)** — Quick, satisfying gameplay runs. Complete a level in one sitting, or replay favorite phases for score. The "one more run" pull keeps sessions extending naturally.

### Player Motivations

- **Nostalgia** — Reliving the arcade era with an authentic experience that respects the source material
- **Flow state** — The combination of constant shooting, smooth flying, and ambient hum creates a satisfying rhythm
- **Narrative pull** — Handler urgency and AI taunts create a story worth seeing through to the end
- **Visual spectacle** — Sharp, clean vector aesthetics that are impressive to watch and experience

---

## Goals and Context

### Project Goals

1. **Capture the Arcade Magic** — Create a game that evokes the feeling of standing at an arcade cabinet in 1983. Sharp vector lines, the grip of the controls, the "one more run" pull that kept you feeding quarters. When players put down the keyboard, they should want to jack back in.

2. **Ship a Complete Game** — Deliver a finished, playable, polished experience — not a prototype or a demo. Three levels, twelve phases, three bosses, full narrative arc, beginning to end. Published on GitHub and playable in any modern browser.

3. **Validate AI-Assisted Solo Development** — Prove that a solo developer can build and ship a complete arcade game using AI-assisted development workflows. This project is a test case for the development model as much as it is a game.

4. **Learn Game Development** — Gain practical, hands-on experience in WebGL rendering, game architecture, audio integration, and game design. A software engineer's path into game development through building something real.

### Background and Rationale

Vector Wars is a personal passion project born from a software engineer's love of the 1980s arcade era. The motivation is straightforward: the games that defined vector graphics — Star Wars, Tempest, Battlezone — created an aesthetic and experience that hasn't been authentically revisited. Modern "retro" games often miss the point, adding visual noise and complexity where the originals thrived on clarity and constraint.

The timing is right. WebGL and Three.js make authentic vector rendering accessible to a solo developer at zero cost. AI-assisted development tools have matured to the point where a single engineer can realistically scope and ship a complete game. The audience — 80s arcade veterans — is passionate but underserved by authentic experiences. And the constraints that define Vector Wars (vector wireframes, keyboard only, no power-ups, no multiplayer) naturally contain scope while reinforcing identity.

This isn't a market play. It's a craft project — built for the love of the era, the challenge of shipping, and the satisfaction of learning.

---

## Unique Selling Points (USPs)

1. **Diegetic Vector Aesthetic** — The wireframes aren't retro style for nostalgia's sake — they're the reality of cyberspace. Players are literally inside a digital world where vector lines ARE the environment. The visual look has a narrative reason to exist, elevating it from decoration to world-building.

2. **Dual-Voice Narrative in a Rail Shooter** — No other vector arcade game gives you a handler AND an AI opponent speaking to you during gameplay. The handler guides and warns; the AI taunts and threatens. Two competing voices create tension, stakes, and story without ever pausing the action.

3. **Clean Vectors, Not Visual Noise** — Deliberately readable and sharp. Every line serves clarity and aesthetic purpose. This is the anti-Llamasoft approach — no psychedelic overload, no sensory assault. The beauty is in the precision.

4. **Classic Structure Reimagined** — The 1983 Star Wars three-phase structure (dogfight → surface → trench) is iconic but hasn't been revisited and expanded. Vector Wars adds a dedicated boss phase with unique AI personalities, giving each level a proper climax with narrative weight.

### Competitive Positioning

Vector Wars occupies a unique space: authentic vector arcade experience with narrative depth.

| Competitor | What They Do Well | What Vector Wars Does Differently |
|------------|-------------------|-----------------------------------|
| **Tempest 4000 / Polybius** | Overwhelming visual spectacle | Clean readability over visual noise |
| **Geometry Wars** | Tight, addictive vector-style action | Narrative arc with characters and stakes |
| **Rez / Rez Infinite** | Cyberspace + audio fusion | Grounded narrative tension with dialogue |
| **Atari Compilations** | Faithful preservation of classics | Evolution of the DNA, not just preservation |

**Unique Value Proposition:** Vector Wars is the game that asks "what if the 1983 Star Wars arcade cabinet was set inside Neuromancer's cyberspace?" — clean vector combat with narrative stakes, built for the people who were actually there.

---

## Core Gameplay

### Game Pillars

1. **Vector Aesthetic** — Sharp, clean, authentic vector wireframe graphics are the game's identity. Every visual decision must serve the vector look. If it doesn't glow like a 1983 arcade monitor, it doesn't belong. This is the non-negotiable pillar — the game's reason for existing.

2. **Nostalgic Feel** — The game must evoke the feeling of standing at an arcade cabinet in the 80s. Controls, pacing, sound, structure — everything should trigger that "I've been here before" sensation for players who lived it. Wave escalation, high score tables, keyboard-only controls — all serve this pillar.

3. **Accessible Action** — Fun and easy to play, satisfying without being punishing. Pick-up-and-play sessions, forgiving checkpoints, and smooth difficulty that challenges without frustrating. This is a game you enjoy, not one you endure.

**Pillar Prioritization:** When pillars conflict, prioritize in this order:
Vector Aesthetic > Nostalgic Feel > Accessible Action

*Example: If a modern accessibility feature (pillar 3) would require UI elements that break the vector aesthetic (pillar 1), the aesthetic wins. Find a vector-native solution instead.*

### Core Gameplay Loop

The core loop is constant, rhythmic action with narrative layered on top:

**Loop Diagram:**
```
Fly → Shoot → Survive → Progress → Narrative Escalates → Repeat
 ↑                                                          |
 └──────────────── Rising Stakes ───────────────────────────┘
```

**Moment-to-moment (seconds):** Fly through cyberspace → shoot AI constructs → dodge incoming data bursts → destroy enemies → keep pushing forward

**Phase-level (minutes):** Complete dogfight phase → transition to surface attack → clear firewall nodes → enter data corridor → face the boss

**Campaign-level (sessions):** Beat Level 1 → briefing screen → Level 2 with harder enemies and new boss personality → Level 3 at maximum intensity → ending sequence

**Loop Timing:** Each phase runs 2-4 minutes. A full level (4 phases) takes 10-15 minutes. The complete campaign is roughly 30-45 minutes.

**Loop Variation:** Each iteration differs through escalating enemy behavior (mechanical → aggressive → glitchy), shifting color palette (green → amber → red), intensifying narrative (calm handler → desperate handler, dismissive AI → unhinged AI), and new phase geometry and obstacle patterns.

### Win/Loss Conditions

#### Victory Conditions

- **Campaign Victory:** Defeat all three AI bosses across three levels and reach the ending sequence (outro music, credits, cyberspace fragmentation). This is the primary win state — the story has a definitive ending.
- **Score Victory:** Achieve a high score worthy of the local leaderboard. Secondary motivation for skilled players and replay value.

#### Failure Conditions

- **Shield Depletion:** Player's shields reach zero = destruction of the combat program. This is the only failure state.
- **No timer, no ammo limits, no instant-kill mechanics.** Failure comes from sustained damage, not surprise deaths.

#### Failure Recovery

- **Phase checkpoint:** Death restarts the current phase only, not the entire level. Progress through completed phases is preserved.
- **Shield recharge:** Shields recharge between phases, giving players a fresh start for each new challenge.
- **No lives system:** Unlimited retries. The game wants you to finish. Arcade tension comes from score loss and phase difficulty, not from being locked out.

---

## Game Mechanics

### Primary Mechanics

1. **Fly** — First-person rail movement through cyberspace environments. Arrow keys control smooth pseudo-3D navigation across four distinct phase types. The camera follows a predefined spline path; the player controls viewport offset and aim position within the frame. Used constantly — you never stop moving.
   - *Pillar alignment:* Vector Aesthetic (smooth vector world flowing past the cockpit), Nostalgic Feel (rail movement like the original Star Wars arcade)
   - *Skill tested:* Positioning, spatial awareness
   - *Feel:* Smooth and responsive — no drift, no acceleration curve, immediate response to input

2. **Shoot** — Constant, satisfying combat using four weapon types with distinct tactical roles. The primary action loop — always firing, always engaged.
   - **Data Lance** (Spacebar) — Rapid-fire vector bolts. Primary weapon, unlimited ammo. The bread and butter of combat. Snappy, rhythmic — rapid taps produce a satisfying cadence.
   - **Logic Bombs** (Z) — Limited-supply heavy missiles with lock-on targeting. High impact, satisfying explosions. Weighty feel — slight delay before launch, then powerful impact. Save for tough enemies or boss phases.
   - **EMP Burst** (X) — Short-range area disruption that stuns/slows nearby enemies. Tactical crowd control. Punchy feel — instant activation with a visual/audio feedback pulse. Creates breathing room in intense moments.
   - **Virus Payload** (C) — The mission weapon. Used in data corridor and boss phases to deliver the killing blow to the AI core. The "proton torpedo" equivalent — you're literally injecting a virus into the AI. The weapon IS the mission objective.
   - *Pillar alignment:* Nostalgic Feel (arcade firing rhythm, weapon variety without complexity), Accessible Action (satisfying without demanding mastery)
   - *Skill tested:* Timing, target prioritization, resource management (limited Logic Bombs)

3. **Survive** — Dodge enemy data bursts, navigate corridor obstacles, manage shields. No power-ups, no health pickups — your skill with the keyboard is all you have. Screen shake communicates danger on impact; vector flash effects on damage and explosions.
   - *Pillar alignment:* Accessible Action (readable threats, fair damage patterns), Nostalgic Feel (arcade tension and stakes)
   - *Skill tested:* Reflexes, pattern recognition, positioning

4. **Experience the Narrative** — Story delivered diegetically through handler comms and AI taunts while you play. The narrative comes to you through your cockpit instruments — you never stop flying to read. Handler text appears as a comm channel overlay labeled "HANDLER"; AI dialogue appears during boss encounters.
   - *Pillar alignment:* Vector Aesthetic (comm overlay is part of the cockpit HUD), all pillars (narrative enhances the experience without interrupting it)
   - *Skill tested:* None — narrative is received, not interacted with. Pure atmosphere.

### Mechanic Interactions

- **Flying + Shooting** = the core moment-to-moment loop. You aim by positioning (flying) and fire simultaneously. These two mechanics are never separated — they work in concert every second of gameplay.
- **Surviving + Narrative** = tension amplifier. Handler warnings coincide with actual threats on screen. AI taunts coincide with boss attack patterns. The narrative reinforces what you're experiencing mechanically.
- **Weapon Selection + Phase Type** = tactical choice. Logic Bombs for tough enemies in dogfights, EMP for crowds on the surface, Virus Payload for corridor/boss finishers. The right weapon for the right moment.
- **Flying + Surviving** = corridor navigation. In data corridor phases (phase 3), flying becomes the survival mechanic — dodging firewalls, network cables, and data streams while maintaining forward momentum.

### Mechanic Progression

Mechanics do not unlock or upgrade — all four weapons and full movement are available from the start (after the tutorial). Progression comes through **context**, not capability:
- **Enemy behavior evolves** — Mechanical patterns in Level 1 become aggressive in Level 2 and glitchy/unpredictable in Level 3
- **Environment escalates** — Corridors narrow, obstacles increase, boss arenas become more chaotic
- **Narrative raises stakes** — The handler's growing desperation and the AI's increasing hostility create psychological progression
- The player's SKILL is what progresses, not their toolkit. Arcade purity.

---

## Controls and Input

### Control Scheme (Web Browser — Keyboard Only)

| Key | Action | Usage |
|-----|--------|-------|
| **Arrow Keys** | Movement / Aim | Constant — controls viewport position on the rail |
| **Spacebar** | Data Lance (primary fire) | Constant — rapid-fire vector bolts |
| **Z** | Logic Bombs (heavy missiles) | Situational — limited supply, save for priority targets |
| **X** | EMP Burst (area disruption) | Situational — crowd control, create breathing room |
| **C** | Virus Payload (mission weapon) | Phase-specific — corridor runs and boss finishers |

**Maximum 5 keys.** No mouse, no gamepad, no touch. Deliberate constraint that reinforces the retro arcade identity.

### Input Feel

- **Movement:** Smooth and immediate. No acceleration curve, no drift, no momentum. Arrow press = instant response. Arrow release = instant stop. Precision positioning.
- **Data Lance:** Snappy and rhythmic. Each tap produces a sharp, clean bolt with satisfying SFX. Rapid tapping produces a cadence that becomes part of the game's rhythm.
- **Logic Bombs:** Weighty and impactful. Slight delay before launch communicates power. Lock-on targeting gives tactical feel. Explosion is the most visually spectacular moment in regular combat.
- **EMP Burst:** Punchy and instant. Activation is immediate with a distinctive visual pulse and audio feedback. Enemies visibly stutter/slow. You FEEL the disruption.
- **Virus Payload:** Deliberate and consequential. This is the kill shot — it should feel like pulling a trigger that matters.

### Accessibility Controls

- **No rebinding needed** — The 5-key layout is simple enough that accessibility is built into the constraint. All keys are reachable from a natural hand position.
- **No rapid combo inputs** — No simultaneous key requirements. Each key does one thing.
- **Forgiving timing** — No frame-perfect inputs required. The game rewards positioning and sustained play, not twitch precision.

---

## Shooter Specific Design

### Weapon Systems

Vector Wars features four weapons — no unlocks, no upgrades, all available from the start (after tutorial). The constraint of "no upgrades" is deliberate — arcade purity. Weapon variety creates tactical choices, not power escalation.

| Weapon | Type | Ammo | Fire Rate | Damage | Role |
|--------|------|------|-----------|--------|------|
| **Data Lance** | Rapid-fire vector bolts | Unlimited | High | Low per bolt | Primary — constant pressure, bread and butter of combat |
| **Logic Bombs** | Lock-on heavy missiles | Limited supply | Slow | High | Heavy hitter — save for tough targets and boss phases |
| **EMP Burst** | Area disruption pulse | Cooldown-based | N/A | No direct damage | Crowd control — stun/slow nearby enemies, create breathing room |
| **Virus Payload** | Mission kill weapon | Phase-specific availability | Single use per target | Lethal (to AI cores) | Boss killer — the narrative weapon, literally injecting a virus into the AI |

**Balance Philosophy:** No power-ups. No health pickups floating in cyberspace. Your skill with the keyboard is all you have. Every victory is earned, not found.

**Weapon Feel:** (Detailed in Controls and Input section) Data Lance = snappy/rhythmic, Logic Bombs = weighty/impactful, EMP Burst = punchy/instant, Virus Payload = deliberate/consequential.

### Aiming and Combat Mechanics

**Aiming System:** First-person, rail-based. Player movement IS aiming — arrow keys control viewport position, which determines where weapons fire. No separate crosshair, no mouse aim. You point your combat program at the target and fire. Simple, immediate, arcade-pure.

**Hit Detection:**
- **Player weapons → Enemies:** Raycasting from player position along aim direction. Raycast only on fire events, not every frame — keeps performance clean.
- **Enemy projectiles → Player:** Bounding sphere intersection checks per frame. Enemy data bursts are visible, readable, and dodgeable.
- **Corridor obstacles → Player:** Simple bounding box/sphere checks along the rail path.
- **Boss encounters:** Zone-based triggers for Virus Payload delivery windows.

**Accuracy Mechanics:** No spread, no recoil, no movement penalties. Data Lance fires where you're pointing. Arcade precision — if you're aimed at it, you hit it. Complexity comes from enemy movement and positioning, not from fighting your own weapon.

**Critical Hits / Weak Points:** Boss constructs have exposed core nodes that take increased Virus Payload damage — these are the mission-critical targets. Regular enemies have no weak points — destroy them with sustained fire. No headshot mechanics, no damage multipliers on regular enemies.

### Enemy Design and AI

**Enemy Types — AI Construct Archetypes:**

Enemies are hostile AI defense programs manifesting as geometric constructs in cyberspace. They fire data bursts at the player. Their geometric designs are abstract and alien — these are software entities, not ships.

| Archetype | Role | Behavior | Visual Design |
|-----------|------|----------|---------------|
| **Sentinel** | Patrol / Fodder | Predictable patrol patterns, timed attacks. The basic enemy — appears in every phase type. | Simple geometric construct — clean, minimal wireframe |
| **Watchdog** | Pursuit / Aggressive | Pursues the player, faster attacks, harder to shake. Closes distance aggressively. | Sleeker, faster-looking construct — angular, pointed geometry |
| **Gatekeeper** | Blocker / Tank | Blocks the path, absorbs damage, forces sustained engagement before allowing progress. | Larger, heavier construct — dense wireframe, imposing presence |
| **Overseer** | Coordinator / Elite | Coordinates nearby enemies, buffs attack patterns of surrounding constructs. Priority target. | Complex, multi-part construct — visually distinct, commands attention |

**AI Architecture:** Simple Finite State Machine per enemy type. States: Spawn → Patrol → Attack → Evade → Destroyed. No behavior trees — arcade enemies need predictable-but-challenging patterns, not complex decision-making.

**Behavioral Evolution Across Levels:**
- **Level 1: Mechanical** — Precise, predictable patrol patterns. Timed attacks with generous cooldowns. Enemies telegraph their actions clearly. The player learns to read and react.
- **Level 2: Aggressive** — Faster movement, shorter attack cooldowns, coordinated group attacks. Watchdogs pursue more aggressively. Overseers appear more frequently. The AI network takes you seriously.
- **Level 3: Glitchy** — Randomized patterns, evasion behavior, erratic movement. Enemies become unpredictable — the AI is adapting to your tactics. Visual glitch effects reinforce the narrative that the AI is evolving its defenses against you specifically.

**Spawn Systems:** Enemy spawning synchronized to rail progression (distance along the camera path). Pre-defined spawn events per phase ensure designed encounters, not random chaos. Spawn timing creates rhythm — waves of enemies with breathing room between them.

**Enemy Destruction:** Vector shard explosions. When destroyed, enemies fragment into vector shards that scatter outward. Consistent with the aesthetic — everything in this world is made of lines, and destruction means those lines fly apart. Satisfying, juicy, clean.

**Boss Encounters — Three Unique AI Constructs:**

Each level culminates in a boss encounter against a massive AI construct with a distinct personality revealed through dialogue during the fight.

| Boss | Level | Personality | Combat Style | Narrative Role |
|------|-------|-------------|-------------|----------------|
| **The Gatekeeper** | 1 | Cold, calculating, dismissive — doesn't consider you a threat | Predictable but challenging patterns. Teaches boss mechanics through readable attacks. | First statement that the resistance is real. Defeating it proves you matter. |
| **The Avenger** | 2 | Aggressive, fast, angry — KNOWS what you did to Boss 1 | Relentless attacks, shorter windows, punishing aggression. The difficulty spike. | The AI network is now aware of you and takes you seriously. Narrative escalation through personality. |
| **The Core Intelligence** | 3 | Eerily calm → increasingly unhinged — the source, the final AI | Starts with measured attacks, may try to reason with you. As damaged, becomes desperate, glitchy, chaotic. | The final boss has an emotional arc within the fight itself — calm confidence crumbling into digital panic. |

**Boss Visual Design:** Massive geometric constructs — sphere or polyhedron shapes with fractal patterns at the center. You fly up close to enormous wireframe entities. The Death Star equivalent is a living geometric AI entity, not a space station.

**Boss Destruction Sequence:** Multi-stage — layers strip down to bare wireframe, then the entire construct fragments and shatters into vector shards cascading outward. Peel → strip → shatter gives weight and spectacle to the victory moment.

### Arena and Level Design

**Four Phase Types Per Level:**

Each level consists of four connected phases with distinct geometry, gameplay focus, and pacing:

| Phase | Environment | Gameplay Focus | Rail Path Style | Pacing |
|-------|-------------|----------------|-----------------|--------|
| **Phase 1: Dogfight** | Open cyberspace — starfield/grid background | Combat vs waves of AI constructs in open space | Wide, sweeping curves | Action — medium intensity, building |
| **Phase 2: Surface Attack** | AI fortress exterior — wireframe surface geometry | Destroy firewall nodes and ICE towers (destructible targets) | Surface-skimming approach run | Action — high intensity, focused targets |
| **Phase 3: Data Corridor** | Straight corridor — narrowing walls, closing geometry | Navigate obstacles: firewalls slamming shut, network cables crossing path, data streams to dodge | Straight, forward, increasing speed | Tension — survival focus, high intensity |
| **Phase 4: Boss** | Boss arena — boss construct dominates the viewport | Face the AI boss. Survive attack patterns. Deliver Virus Payload at the critical moment. | Approach path + arena orbit | Climax — maximum intensity, narrative payoff |

**Level Flow:** Each phase transitions with a brief fade or vector dissolve. Previous phase geometry unloads; next phase loads. No streaming, no async complexity — 12 total segments, each self-contained.

**No Cover System** — This is a rail shooter. No hiding, no crouching, no stopping. You fly forward and deal with what comes at you.

**No Power-Up Placement** — Pure skill. Nothing floating in cyberspace to collect. The constraint IS the design.

**Environmental Hazards (Data Corridor):** Firewalls slamming shut (timing-based), network cables crossing the path (positioning-based), data streams to dodge (reflexes-based). Every obstacle is thematically grounded in the digital world — nothing feels arbitrary.

**Sightlines and Engagement Distances:** Open in dogfight phases (enemies approach from distance, giving time to react). Constrained in corridor phases (threats come from directly ahead, demanding quick reflexes). Boss arenas provide medium distance with the boss construct dominating the visual field.

### Multiplayer Considerations

**Not applicable.** Vector Wars is a single-player experience. No multiplayer, no online features, no co-op, no leaderboard sharing. High score table is local only. This is a deliberate scope constraint — no networking, no cloud infrastructure, no server costs.

---

## Progression and Balance

### Player Progression

Vector Wars uses three types of progression, none of which involve power or stat increases. The player's toolkit never changes — mastery is the progression.

#### Progression Types

| Type | How It Works | Pacing |
|------|-------------|--------|
| **Skill Progression** | The player gets better at positioning, timing, weapon selection, and pattern recognition. The toolkit is static — the player's mastery grows. | Continuous — every phase played builds skill |
| **Narrative Progression** | The story unfolds through handler comms and AI taunts. Handler arc escalates from calm professionalism to desperate urgency. Each boss reveals a distinct personality. | Per-level — narrative beats tied to phase transitions and boss encounters |
| **Content Progression** | New levels unlock sequentially. Each level introduces new phase geometry, enemy compositions, a unique boss, and a color palette shift (green → amber → red). | Per-level — three levels, each a distinct experience |

**No power progression.** No unlocks, no upgrades, no skill trees, no meta-progression between sessions. You start with everything. Your skill is what grows. Arcade purity.

#### Progression Pacing

- **Immediate (seconds):** Each enemy destroyed, each data burst dodged provides micro-feedback. Score increments. Vector shard explosions reward every kill.
- **Short-term (minutes):** Completing a phase provides a checkpoint and shield recharge. The narrative advances. Color palette may shift.
- **Medium-term (10-15 min):** Completing a level delivers a boss victory, a major narrative beat, a briefing screen, and entry into a new level with fresh geometry and harder enemies.
- **Long-term (30-45 min):** Completing the campaign delivers the ending sequence — outro music, credits, cyberspace fragmentation. The story concludes. The game is won.

### Difficulty Curve

**Pattern: Sawtooth** — Each level builds intensity across its four phases, peaks at the boss, then the briefing screen provides a breather before the next level ramps up at a higher baseline.

```
Intensity
  ▲
  │            ╱╲              ╱╲                ╱╲
  │          ╱    ╲          ╱    ╲            ╱    ╲
  │        ╱        ╲      ╱        ╲        ╱        ╲
  │      ╱            ╲  ╱            ╲    ╱            ╲
  │    ╱    Level 1    ╲╱    Level 2    ╲╱     Level 3
  │  ╱
  └──────────────────────────────────────────────────────→ Time
   Tutorial  Brief      Brief          Brief     Ending
```

**Per-level difficulty profile:**

| Level | Baseline | Enemy Behavior | Boss Challenge | Emotional Tone |
|-------|----------|---------------|----------------|----------------|
| **Tutorial** | Gentle | None — calibration targets | None | Curiosity — "First time jacking in?" |
| **Level 1** | Moderate | Mechanical — predictable patterns, timed attacks, generous cooldowns | The Gatekeeper — readable patterns, teaches boss mechanics | Confidence — learning the ropes, first victories |
| **Level 2** | Challenging | Aggressive — faster, shorter cooldowns, coordinated group attacks | The Avenger — fast, relentless, punishing aggression | Tension — the AI network is fighting back |
| **Level 3** | Intense | Glitchy — randomized patterns, evasion behavior, erratic movement | The Core Intelligence — calm then unhinged, chaotic final fight | Determination — everything on the line |

#### Challenge Scaling

Difficulty increases through multiple channels simultaneously:

- **Enemy behavior evolution:** Mechanical (Level 1) → Aggressive (Level 2) → Glitchy/Unpredictable (Level 3)
- **Enemy composition:** More Overseers and Gatekeepers in later levels; fewer fodder Sentinels
- **Corridor obstacle density:** More firewalls, tighter timing windows, faster data streams
- **Boss attack windows:** Tighter vulnerability windows and more complex attack patterns per boss
- **Color palette escalation:** Green (outer/safe) → Amber (mid/caution) → Red (deep core/danger) — psychological pressure through visual shift
- **Narrative pressure:** Handler's growing desperation and AI's increasing hostility raise emotional stakes

#### Difficulty Options

**No difficulty selection.** One carefully designed difficulty curve for the target audience. Accessibility is built into the structure:

- **Phase checkpoints:** Death restarts the current phase only — never lose more than 2-4 minutes of progress
- **Unlimited retries:** No lives system. The game wants you to finish.
- **Shield recharge between phases:** Fresh start for each new challenge
- **Readable enemy telegraphing:** All attacks are visible and dodgeable with practice
- **Forgiving timing:** No frame-perfect inputs required

The philosophy: challenge through escalation, not through punishment. The game gets harder, but it never locks you out.

### Economy and Resources

**No in-game economy.** No currency, no crafting, no consumables, no shops, no collectibles. This is a deliberate design choice aligned with the "arcade purity" pillar.

**The only managed resource:** Logic Bombs have a limited supply per phase. This creates tactical decisions (when to use them) without adding inventory management complexity. Supply resets between phases.

**Score** is tracked and displayed on the local high score table. Score rewards skilled play (accuracy, speed, no-damage bonuses) but doesn't purchase anything. It exists for genre authenticity and replay motivation — retro arcade fans expect it.

---

## Level Design Framework

### Structure Type

**Linear Levels** — Three levels played in strict sequence, each containing four gameplay phases. The complete campaign flows: Tutorial → Level 1 → Briefing → Level 2 → Briefing → Level 3 → Ending. No branching paths, no open selection, no procedural generation. Classic arcade campaign structure — you play through from start to finish.

**Total content:** 12 gameplay phases + 1 tutorial + 3 briefing screens + 1 ending sequence = 17 discrete content segments.

### Level Types

| Content Segment | Type | Duration | Purpose |
|----------------|------|----------|---------|
| **Tutorial** | Diegetic onboarding | ~2 min | Handler walks you through controls as a "calibration protocol." No fourth-wall break — tutorial IS narrative. Ends with alarms, real mission begins. |
| **Briefing Screens (×3)** | Between-level narrative | ~30 sec each | Full-screen vector text scroll with handler voice-over narration. Mission context, intel on next AI boss, escalating stakes. Star Wars opening crawl meets vector aesthetic. |
| **Combat Levels (×3)** | Four-phase gameplay | 10-15 min each | The core content. Each level = Phase 1 (Dogfight) → Phase 2 (Surface Attack) → Phase 3 (Data Corridor) → Phase 4 (Boss). |
| **Ending Sequence** | Outro/credits | ~2 min | Outro music plays (the only full music track in the game). Credits scroll in vector text. Cyberspace fragments around the player as they jack out. Music as reward — you earn the soundtrack by completing the game. |

#### Tutorial Integration

**Diegetic tutorial — "First time jacking in? Let's run the calibration protocol..."**

The game opens with the handler walking you through controls as a calibration protocol for your combat program. You're a new recruit being onboarded into the resistance's cyberspace operations.

- Arrow keys: "Align your targeting array — good, looking sharp."
- Spacebar (Data Lance): "Light up those calibration targets."
- Z/X/C (Secondary weapons): Brief introduction to each.
- Shields: "Your combat program has integrated shielding — take a hit, see how it feels."

Tutorial ends. Alarms trigger. Handler's tone shifts: "That's not a drill. We've got incoming." Real mission begins immediately. No menu screen between tutorial and Level 1 — seamless transition into gameplay.

#### Per-Level Design

**Level 1 — Outer Cyberspace (Green Palette)**

| Phase | Environment | Key Features | New Elements Introduced |
|-------|-------------|-------------|------------------------|
| Phase 1: Dogfight | Open cyberspace, grid background | Sentinel and Watchdog enemies in open space | Core combat against basic enemy types |
| Phase 2: Surface Attack | AI fortress exterior, wireframe geometry | Firewall nodes and ICE towers (destructible) | Targeted destruction objectives |
| Phase 3: Data Corridor | Straight corridor, narrowing walls | Firewalls, network cables — moderate density | Corridor navigation and obstacle dodging |
| Phase 4: Boss | Boss arena, Gatekeeper construct dominates | The Gatekeeper — cold, dismissive, readable patterns | Boss mechanics, Virus Payload delivery |

**Level 2 — Mid-Level Cyberspace (Amber Palette)**

| Phase | Environment | Key Features | Escalation from Level 1 |
|-------|-------------|-------------|------------------------|
| Phase 1: Dogfight | Amber-tinted cyberspace | All four enemy types, coordinated attacks | More Overseers, group tactics |
| Phase 2: Surface Attack | Larger fortress, denser defenses | More nodes, tighter approach paths | Higher enemy count, faster fire |
| Phase 3: Data Corridor | Faster corridor, denser obstacles | Tighter timing windows, crossing data streams | Speed increase, obstacle density up |
| Phase 4: Boss | Boss arena, Avenger construct | The Avenger — fast, angry, relentless aggression | Tighter attack windows, punishing patterns |

**Level 3 — Deep Core (Red Palette)**

| Phase | Environment | Key Features | Escalation from Level 2 |
|-------|-------------|-------------|------------------------|
| Phase 1: Dogfight | Red-tinted cyberspace, hostile atmosphere | Glitchy enemies, erratic behavior, evasion | Unpredictable patterns, maximum enemy variety |
| Phase 2: Surface Attack | Massive fortress, final defenses | Dense ICE towers, heavy Gatekeeper presence | Most challenging surface run |
| Phase 3: Data Corridor | Fastest corridor, maximum obstacle density | Rapid-fire obstacles, minimal reaction time | Peak survival challenge |
| Phase 4: Boss | Final arena, Core Intelligence construct | The Core Intelligence — calm → unhinged, emotional arc | Most complex fight, chaotic final phase |

### Level Progression

**Progression Model: Linear Sequence**

```
Tutorial → Level 1 → Briefing → Level 2 → Briefing → Level 3 → Ending
```

- **Unlock mechanism:** Completing a level's boss encounter triggers the next briefing screen, which flows directly into the next level. No gates, no score requirements, no star ratings.
- **No level select in MVP** — Players experience the campaign as a continuous arc from tutorial to ending. Start from the beginning each session.
- **No world map** — Transitions are direct. Boss defeat → briefing screen → next level loads. Clean, cinematic flow.
- **Replay motivation:** High score table encourages replaying the full campaign for better scores. Post-MVP enhancement: level select for replaying individual levels.

#### Replayability

- **High score chasing:** Score tracks accuracy, speed, and damage taken. Each run produces a different score. Leaderboard motivation for the arcade-minded.
- **Skill mastery:** Players who replay will notice improvement — dodging patterns they couldn't before, finding efficient weapon usage, surviving corridors cleanly.
- **Campaign length supports replay:** At 30-45 minutes for a full run, the game is short enough to replay in a single session. This is intentional — arcade games are meant to be replayed.

### Level Design Principles

1. **Every obstacle is thematically grounded** — Firewalls, network cables, data streams. Nothing arbitrary exists in cyberspace. If it's in the game, it belongs in the digital world.
2. **Escalation through multiple channels** — Enemy behavior, color palette, narrative tone, and geometry all escalate together. No single channel carries the difficulty alone.
3. **Breathing room between intensity peaks** — Briefing screens and phase transitions provide pacing relief. The sawtooth difficulty curve gives players moments to recover.
4. **Each phase owns one dominant experience** — Dogfight = open combat, Surface = targeted destruction, Corridor = survival navigation, Boss = climactic encounter. No phase tries to do everything.
5. **Constraint IS content** — Three levels, four phases each, twelve gameplay segments. This scope is achievable for a solo developer and sufficient for a complete, satisfying campaign. Don't expand — refine.

---

## Art and Audio Direction

### Art Style

**Sharp, clean vector wireframe graphics** on a dark background. No fill, no pixels — pure geometric lines rendered in WebGL via Three.js. Faithful to the visual language of 1983 vector arcade monitors but with modern rendering smoothness and juicy game-feel effects.

**Rendering approach:**
- Three.js `LineSegments`/`Line2` for sharp vector lines
- `UnrealBloomPass` post-processing for authentic phosphor glow
- Optional CRT shader pass for scanlines and chromatic aberration (enhances retro feel)
- FXAA anti-aliasing for clean final output

**Post-processing stack:**
```
RenderPass(scene, camera) → UnrealBloomPass (vector glow) → ShaderPass (optional CRT) → FXAA
```

#### Color Palette

**Depth-based color system** — the entire screen's palette tells you where you are in cyberspace:

| Depth | Color | Meaning | Levels |
|-------|-------|---------|--------|
| **Outer cyberspace** | Green | Safe / entry zone | Level 1, Tutorial |
| **Mid-level** | Amber | Caution / escalation | Level 2 |
| **Deep core** | Red | Danger / final zone | Level 3 |

Minimal palette, maximum readability. Color communicates progression, not decoration.

#### Camera and Perspective

**First-person cockpit view** — player sees from inside their combat program. Actuator arms / missile racks visible on each side of the viewport. Arms bump and recoil when firing, spark when taking damage. Cosmetic animation only — direct homage to the X-wing wings visible in the original Star Wars arcade, reimagined as digital combat program appendages.

**Camera system:** `THREE.PerspectiveCamera` follows a predefined spline path (rail). Player input offsets the viewport position within the frame for aiming/dodging.

#### Visual Effects

- **Screen shake:** On player damage — intensity scaled to damage severity. Communicates danger, adds weight.
- **Vector flash:** Bright flares on explosions, weapon impacts, and boss damage. Lines momentarily flare brighter — feels like electrical surges in cyberspace.
- **Vector shard explosions:** Enemies fragment into scattering vector line shards on destruction. Consistent visual language from small enemy kills to climactic boss destruction.
- **Boss destruction sequence:** Multi-stage — layers peel down to bare wireframe, then the entire construct shatters into cascading vector shards. Peel → strip → shatter.
- **Phase transitions:** Fade to black or vector dissolve between phases.

#### Visual References

| Reference | What We're Taking | What We're NOT Taking |
|-----------|-------------------|----------------------|
| **Star Wars Arcade (1983)** | Cockpit view, wireframe environments, clean readable vector lines | Quarter-munching punishment, infinite loop |
| **Tempest (1981)** | Intensity of vector combat, geometric enemy design | Abstract tube gameplay |
| **Battlezone (1980)** | Wireframe 3D world, dark background, green vectors | First-person tank movement |
| **Tron (1982)** | Digital world aesthetic — being INSIDE a computer | Mini-game anthology structure |
| **NOT Tempest 4000/Polybius** | — | Psychedelic visual overload that sacrifices readability |

**Art philosophy:** Clean readability over visual noise. Every line serves clarity and aesthetic purpose. If it doesn't glow like a 1983 arcade monitor, it doesn't belong.

### Audio and Music

#### Music Style

**Ambient electronic hum** — the base soundtrack is a persistent electronic hum that intensifies with gameplay action. No full composed soundtrack in MVP. The hum IS cyberspace — atmospheric, immersive, and achievable without music production skills.

**Outro music:** A full music track plays ONLY at the ending sequence — after defeating the final boss. Music as reward. The only moment in the game with a real soundtrack. This makes the ending feel special and earned.

#### Sound Design

**Retro arcade SFX** — every sound effect designed to evoke the arcade era:

| Sound Category | Description | Feel | Source |
|---------------|-------------|------|--------|
| **Data Lance fire** | Sharp vector bolt sound | Snappy, rhythmic, satisfying | jsfxr (retro SFX generator) |
| **Logic Bomb launch** | Heavy missile release + explosion | Weighty, impactful | jsfxr + layering |
| **EMP Burst** | Electronic disruption pulse | Punchy, distinctive | jsfxr / Web Audio API |
| **Virus Payload** | Injection / delivery sound | Deliberate, consequential | jsfxr + custom |
| **Shield hit** | Damage feedback | Sharp, alarming | jsfxr |
| **Enemy explosion** | Vector shard scatter | Clean, satisfying | jsfxr |
| **Boss destruction** | Multi-stage collapse | Spectacular, building crescendo | Layered SFX |
| **Corridor whoosh** | Environmental movement | Immersive, spatial | Web Audio API synthesis |
| **Ambient hum** | Cyberspace atmosphere | Persistent, intensity-reactive | Web Audio API oscillators |

**SFX philosophy:** Sharp, clean, satisfying. Audio reinforces the retro-arcade-in-cyberspace identity at every interaction.

#### Voice/Dialogue

**Synthesized/processed voice lines** — retro-digital quality, as if transmitted through a digital comm channel:

| Voice | Character | Tone | Volume | Source |
|-------|-----------|------|--------|--------|
| **Handler** | Anonymous female voice, identified as "HANDLER" on screen | Calm/clinical → invested → desperate (escalates across levels) | ~30-50 lines across campaign | ElevenLabs free tier → Audacity retro processing |
| **Boss 1: The Gatekeeper** | Cold AI monotone | Dismissive, calculating | ~7-10 lines | ElevenLabs/Coqui TTS → bitcrushing/vocoding |
| **Boss 2: The Avenger** | Aggressive AI | Angry, fast, threatening | ~7-10 lines | ElevenLabs/Coqui TTS → bitcrushing/vocoding |
| **Boss 3: The Core Intelligence** | Evolving AI | Eerily calm → increasingly glitchy/desperate | ~7-10 lines | ElevenLabs/Coqui TTS → progressive glitch processing |

**Voice processing pipeline:** Generate clean voice with AI TTS → apply retro-digital processing in Audacity (bitcrushing, vocoding, filtering) → export as replaceable audio assets. Start with AI-generated, upgrade to hand-crafted if quality bar isn't met.

#### Audio Architecture

```
AudioManager
  ├── SFXPlayer (Data Lance, explosions, shield hits, corridor whooshes)
  ├── VoicePlayer (Handler lines, AI taunts, boss dialogue)
  ├── AmbientPlayer (Electronic hum, intensity-reactive)
  └── MusicPlayer (Outro track only)
```

All audio files stored as replaceable assets — swap AI-generated audio for hand-crafted alternatives without code changes. Modular architecture is non-negotiable.

### Aesthetic Goals

Art and audio serve the game pillars in concert:

| Pillar | How Art Serves It | How Audio Serves It |
|--------|-------------------|---------------------|
| **Vector Aesthetic** | Every visual is vector wireframe — lines, glow, geometry. No exceptions. | Synthesized voices and retro SFX match the digital world. Everything sounds like cyberspace. |
| **Nostalgic Feel** | Faithful to 1983 vector monitor look. Cockpit view with visible ship elements. Dark background, glowing lines. | Arcade SFX evoke the cabinet experience. Handler comms feel like 80s sci-fi radio. |
| **Accessible Action** | Clean readability — threats are visible, enemies are distinct, obstacles are readable. No visual noise. | Clear audio feedback — every action has a distinct sound. You can play by ear as much as by sight. |

### Production Approach

- **Visuals:** 100% code-driven (in-house). Vector rendering is math, not art assets — lines, vertices, and shader parameters. No 3D models, no textures, no sprite sheets. Plays directly to a software engineer's strengths.
- **Audio:** Start with AI-generated and procedural assets (jsfxr, ElevenLabs, Web Audio API). Architecture supports drop-in replacement — if AI-generated audio doesn't meet quality bar, swap in hand-crafted or sourced alternatives without code changes.
- **Asset pipeline:** Minimal. The entire game's visual identity comes from code. Audio assets are individual files loaded at runtime. No complex build pipeline, no asset bundling beyond standard Vite builds.

---

## Technical Specifications

### Performance Requirements

#### Frame Rate Target

**60 FPS stable** — non-negotiable. Smooth gameplay is the priority. Vector wireframe rendering is computationally lightweight, so this target is achievable with proper architecture (object pooling, event-based raycasting, managed draw calls).

#### Performance Budget

| Metric | Target | Approach |
|--------|--------|----------|
| **Frame rate** | 60 FPS stable | `requestAnimationFrame` + delta-time based updates |
| **Draw calls** | <500 per frame | Merge static geometry, use instancing for particles |
| **Memory** | No GC pauses during gameplay | Object pooling for all dynamic entities (projectiles, particles, effects) |
| **Collision** | <1ms per frame | Raycasting on fire events only, bounding spheres for continuous checks |
| **Post-processing** | ~2-3ms budget | EffectComposer with bloom + optional CRT shader |

#### Resolution Support

Responsive to browser window size. No fixed resolution — vector rendering scales naturally to any viewport. Desktop wrapper targets 1280×720 default window with resizable support.

#### Load Times

Minimal — vector geometry is code-generated at runtime, not loaded from asset files. Phase transitions should be near-instant. Only audio files require loading, and these are small (individual SFX and voice lines). No loading screens needed between phases — a brief visual transition (fade/dissolve) covers any setup time.

### Platform-Specific Details

#### Web Browser (Primary)

| Requirement | Detail |
|------------|--------|
| **Target browsers** | Chrome, Firefox, Safari, Edge — modern browsers with WebGL support |
| **WebGL version** | WebGL 2.0 (with consideration for WebGL 1.0 fallback) |
| **Build size** | Lightweight — Three.js is 168 kB gzipped. Total build target well under 50MB including all audio assets. |
| **Plugins** | None required — pure browser experience |
| **Local storage** | `localStorage` API for high score persistence. No cookies, no backend. |
| **Hosting** | GitHub Pages — free, HTTPS, automated deployment via GitHub Actions |
| **URL** | `username.github.io/vector-wars` (or custom domain if desired) |

**Browser-specific considerations:**
- Safari/WebKit may have minor WebGL differences — test and address during development
- No fullscreen API dependency — game plays in the browser viewport
- Standard keyboard event handling — no browser-specific input workarounds expected

#### Desktop App (Secondary)

| Requirement | Detail |
|------------|--------|
| **Wrapper** | Electron — guaranteed WebGL consistency via bundled Chromium |
| **Platforms** | Mac (.dmg) + Windows (.exe) |
| **Packaging** | `electron-builder` for cross-platform builds |
| **Distribution** | GitHub Releases — downloadable from the repository |
| **Bundle size** | ~80-120 MB (Electron overhead). Acceptable for desktop distribution. |
| **Priority** | Secondary — build browser-first, add Electron wrapper only when needed |

### Asset Requirements

#### Art Assets

| Asset Type | Count/Scope | Format | Production Method |
|-----------|-------------|--------|-------------------|
| **Vector geometry (enemies)** | 4 archetypes × 3 difficulty variants | Three.js code | Math-defined wireframe shapes — vertices and edges |
| **Vector geometry (bosses)** | 3 unique constructs | Three.js code | Complex polyhedron/sphere shapes with fractal patterns |
| **Vector geometry (environments)** | 4 phase types × 3 levels | Three.js code | Procedural generation from level data parameters |
| **Cockpit elements** | Actuator arms, HUD frame | Three.js code | Static geometry with animation transforms |
| **Particle effects** | Explosions, shards, flashes | Three.js code | Object-pooled instanced geometry |
| **UI elements** | HUD, menus, briefings, credits | Three.js / HTML | Vector-rendered text and simple shapes |

**Total art asset files: 0.** All visuals are code-generated. No textures, no sprites, no 3D model files.

#### Audio Assets

| Asset Type | Count | Format | Source |
|-----------|-------|--------|--------|
| **SFX** | ~15-20 effects | WAV/OGG | jsfxr (retro SFX generator) |
| **Handler voice lines** | ~30-50 lines | WAV/OGG | ElevenLabs free tier → Audacity processing |
| **AI boss voice lines** | ~20-30 lines (across 3 bosses) | WAV/OGG | ElevenLabs/Coqui TTS → bitcrushing/vocoding |
| **Ambient hum** | 1 intensity-reactive track | Procedural or WAV | Web Audio API oscillators or pre-rendered |
| **Outro music** | 1 track | MP3/OGG | To be sourced or created |

**Total audio files: ~70-100.** All stored as replaceable assets with modular loading architecture.

#### Data Assets

| Asset Type | Count | Format | Purpose |
|-----------|-------|--------|---------|
| **Level definitions** | 12 phase configs | JSON | Enemy spawn events, obstacle patterns, rail path splines |
| **Boss configurations** | 3 boss configs | JSON | Health, attack patterns, personality parameters, dialogue triggers |
| **Dialogue scripts** | Tutorial + 3 levels + 3 bosses | JSON | Trigger conditions, display text, audio file references |
| **High score table** | 1 | localStorage | Local persistence, no backend |

#### External Assets

- **No purchased assets** — all visuals are code-generated, SFX are generated via free tools
- **AI-generated audio** — ElevenLabs free tier and jsfxr are the primary external asset sources
- **Outro music** — may be sourced externally (free/affordable) or created with AI tools. Only external asset with potential cost, and it's optional for MVP.
- **All external assets are replaceable** — modular architecture supports drop-in swaps without code changes

### Technical Constraints

| Constraint | Detail | Rationale |
|-----------|--------|-----------|
| **No physics engine** | Simple vector math for arcade physics | Overkill for a rail shooter — bounding spheres and raycasting are sufficient |
| **No networking** | Single-player, local-only, no multiplayer | Deliberate scope constraint — eliminates entire category of complexity |
| **No database** | `localStorage` for all persistence | Only high scores need saving — no backend, no accounts |
| **Keyboard-only input** | Standard browser keyboard events | Design constraint — 5 keys maximum, no mouse/gamepad/touch |
| **No third-party game engine** | Three.js + custom game code | Lightweight, purpose-built, zero licensing concerns |
| **No server infrastructure** | GitHub Pages static hosting | Zero cost, zero maintenance, zero DevOps |

**Note:** Detailed architecture decisions (system design, component architecture, rendering pipeline specifics) will be addressed in the Architecture workflow after this GDD is complete.

---

## Development Epics

### Epic Overview

| # | Epic Name | Scope | Dependencies | Est. Stories |
|---|-----------|-------|-------------|-------------|
| 1 | **Core Tech Validation** | Project setup, vector rendering, cockpit view, input, Data Lance | None | 6-8 |
| 2 | **Core Game Loop** | Rail movement, enemies, collision, shields, HUD, object pooling | Epic 1 | 8-10 |
| 3 | **Complete Level 1** | All 4 phase types, transitions, obstacles, Boss 1, Virus Payload | Epic 2 | 8-10 |
| 4 | **Narrative & Audio** | Handler comms, AI taunts, voice lines, SFX, tutorial, briefings | Epic 2 | 8-10 |
| 5 | **Full Campaign** | Levels 2 & 3, all enemies, bosses 2 & 3, color system, ending, high scores | Epics 3 & 4 | 10-12 |
| 6 | **Polish & Ship** | Menu, browser testing, performance, deployment, Electron (optional) | Epic 5 | 6-8 |

**Total estimated stories: 46-58**

### Recommended Sequence

```
Epic 1 → Epic 2 → Epic 3 ──→ Epic 5 → Epic 6
                    └→ Epic 4 ─┘
```

**Rationale:** Build the hardest/riskiest parts first (rendering, core feel), then prove gameplay with Level 1, layer on narrative/audio in parallel, expand to full campaign, and polish last. Each epic delivers a playable milestone.

### Vertical Slice

**The first playable milestone (after Epic 2):** One complete dogfight phase with vector wireframe rendering, phosphor glow, first-person cockpit view with actuator arms, Data Lance firing, Sentinel enemies with FSM behavior, raycasting collision, shield system with screen shake damage feedback, object-pooled projectiles and particles, and a minimal HUD showing shields, score, and weapon icons.

**The question this answers:** "Is the core feel fun?" If flying through vector cyberspace while shooting AI constructs feels right after Epic 2, everything else is content and polish built on proven ground.

*Detailed epic breakdowns with stories are in the separate epics.md file.*

---

## Success Metrics

### Technical Metrics

#### Key Technical KPIs

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Frame rate** | 60 FPS stable across target browsers | Stats.js + Chrome DevTools Performance tab |
| **Draw calls** | <500 per frame | Three.js renderer info (`renderer.info.render.calls`) |
| **Post-processing budget** | <3ms per frame | Chrome DevTools profiling |
| **Memory** | No GC pauses during gameplay | Chrome DevTools Memory tab — monitor heap during extended play |
| **Build size** | <50MB total (including all audio assets) | Vite build output |
| **Load time** | <3 seconds to first interaction | Browser performance timing API |
| **Browser compatibility** | Runs correctly on Chrome, Firefox, Safari, Edge | Manual testing on each browser — visual and functional verification |
| **Crash rate** | Zero crashes during normal gameplay | Playtesting validation — full campaign run without errors |

**Monitoring approach:** Stats.js overlay during development for continuous FPS monitoring. Chrome DevTools Performance tab for deep profiling at each epic milestone. Remove Stats.js for production builds.

### Gameplay Metrics

#### Key Gameplay KPIs

| Metric | Target | What It Measures | Measurement |
|--------|--------|-----------------|-------------|
| **Campaign completion rate** | >80% of players who start tutorial complete the game | Accessible Action pillar — the game wants you to finish | Playtesting observation |
| **Phase retry rate** | <3 retries per phase on average | Difficulty balance — challenging but not frustrating | Playtesting data collection |
| **Session length** | 15-45 minutes (single session = one full run) | Campaign pacing — short enough to complete in one sitting | Playtesting observation |
| **"One more run" rate** | >50% of completers replay immediately | Core loop engagement — the game is replayable and addictive | Playtesting observation |
| **Weapon usage distribution** | All 4 weapons used in every level | Mechanic relevance — no weapon feels useless or forgotten | Playtesting observation |
| **Boss engagement** | Players visibly react to boss dialogue and personality | Narrative pull — bosses are characters, not just obstacles | Playtesting observation |
| **Tutorial completion** | 100% of new players complete tutorial without confusion | Diegetic tutorial effectiveness — onboarding is seamless | Playtesting observation |

**Data collection approach:** This is a passion project without analytics infrastructure. Metrics are collected through playtesting sessions — observing players, asking questions, noting behavior. No telemetry, no tracking, no backend. Keep it simple.

### Qualitative Success Criteria

**Pillar validation — players experience what we designed:**

- **Vector Aesthetic:** Players describe the game as "vector," "arcade," "retro," "clean" — they recognize the aesthetic as deliberate and authentic, not "low-budget" or "unfinished"
- **Nostalgic Feel:** Players who lived through the arcade era say "this feels like being at the cabinet." The nostalgia hits.
- **Accessible Action:** Players complete the campaign without frustration. The difficulty escalates but never locks them out. "Challenging but fair."

**Narrative validation — the dual-voice dynamic lands:**

- Players mention the handler as a memorable character — her arc from calm to desperate registers
- Players react to AI boss personalities — especially The Core Intelligence's calm-to-unhinged transition
- Players feel the story pulling them forward — "I wanted to see what happened next"

**Engagement validation — the arcade pull is real:**

- Players say "one more run" or equivalent — the replayability hook works
- Players mention specific moments — a close call in the corridor, a satisfying boss kill, a vector shard explosion that looked incredible
- The ending sequence feels earned — outro music as reward delivers emotional payoff

**Personal goals validation:**

- The developer learned game development skills through building this project (WebGL, Three.js, game architecture, audio integration, game design)
- AI-assisted development workflow was validated — the game shipped using BMad GDS + Claude Code
- A complete, shippable game exists on GitHub — published, playable, real

### Metric Review Cadence

| Milestone | What to Review | Purpose |
|-----------|---------------|---------|
| **After Epic 1** | Frame rate, rendering quality, bloom/glow appearance | Does the vector aesthetic LOOK right? |
| **After Epic 2** | All technical KPIs, core gameplay feel | Does the vertical slice FEEL fun? This is the quality gate. |
| **After Epics 3+4** | Full gameplay metrics via Level 1 playtest | Is Level 1 complete and satisfying? Quality gate before building Levels 2 and 3. |
| **After Epic 5** | Full campaign playtest — all gameplay and qualitative metrics | Does the complete game work as a cohesive experience? |
| **After Epic 6 (pre-ship)** | Browser compatibility, final performance pass, all metrics | Is this ready to publish? |

**The critical gate is after Epic 2.** If the vertical slice isn't fun — if flying through vector cyberspace while shooting AI constructs doesn't feel right — stop and fix the core before building content. Everything else depends on the core feel being validated here.

---

## Out of Scope

The following features, content, and capabilities are explicitly NOT included in Vector Wars v1.0. These boundaries are deliberate — they protect scope and reinforce the game's identity.

### Features Not in v1.0

- **Multiplayer / co-op / online features** — Single-player only. No networking, no cloud infrastructure.
- **Mouse, gamepad, or touch input** — Keyboard only. Deliberate constraint.
- **Power-ups or health pickups** — Pure skill. Nothing floating in cyberspace.
- **Difficulty selection** — One carefully designed difficulty curve. Accessibility through checkpoints and unlimited retries.
- **Level select / chapter replay** — Campaign plays start to finish. No jumping to individual levels.
- **Mod support or level editor** — Not in scope for a passion project.
- **Online leaderboards / shared high scores** — High score table is local only (localStorage).
- **Achievements / trophies** — No platform achievement integration.
- **Cloud saves** — No backend, no accounts, no cloud storage.
- **Localization / additional languages** — English only.
- **Fullscreen mode** — Game plays in the browser viewport or Electron window as-is.

### Deferred to Post-Launch

These ideas were generated during brainstorming and are noted for potential future development, but are NOT part of the initial release:

- **Bonus stages** between levels (score-based challenge stages)
- **Full composed soundtrack** replacement (beyond ambient hum + outro track)
- **Additional levels and AI bosses** (expandable campaign beyond 3 levels)
- **Arcade mode** (infinite escalation loop for score chasers)
- **Level select** (replay individual levels after campaign completion)

These features will only be considered if the MVP ships successfully and there is motivation/demand for expansion.

---

## Assumptions and Dependencies

### Key Assumptions

| Category | Assumption | Confidence |
|----------|-----------|------------|
| **Technical** | Three.js remains stable and maintained (110k GitHub stars, 5M+ weekly npm downloads) | Very High |
| **Technical** | WebGL support remains universal in modern browsers (Chrome, Firefox, Safari, Edge) | Very High |
| **Technical** | Vite remains a viable build tool for browser-based game development | Very High |
| **Technical** | Vector wireframe rendering is computationally lightweight enough for 60 FPS in browsers | High — validated by tech research |
| **Development** | AI-assisted development (BMad GDS + Claude Code) can handle the full project scope | High — structured workflow validated |
| **Development** | Solo developer can maintain motivation over a part-time development timeline | Medium — milestone-based approach mitigates |
| **Audio** | AI-generated audio (ElevenLabs, jsfxr) meets minimum quality bar or can be replaced | High — modular architecture allows swaps |
| **Hosting** | GitHub Pages remains free for static site hosting | Very High |

### External Dependencies

| Dependency | Purpose | Cost | Fallback |
|-----------|---------|------|----------|
| **Three.js** | WebGL rendering framework | Free / Open Source | None needed — proven stable |
| **Vite** | Build tool / dev server | Free / Open Source | Webpack or Parcel |
| **jsfxr** | Retro SFX generation | Free / Open Source | Manual SFX creation in Audacity |
| **ElevenLabs free tier** | Voice line generation (~70-100 lines) | Free (10K chars/month) | Coqui TTS (open source, self-hosted) |
| **Audacity** | Voice post-processing (bitcrushing, vocoding) | Free / Open Source | Any free DAW |
| **GitHub Pages** | Static site hosting and deployment | Free | Netlify, Vercel (also free tier) |
| **Electron** | Desktop wrapper (optional) | Free / Open Source | Tauri (lighter but WebGL risk on macOS) |
| **Outro music** | Single music track for ending sequence | TBD — may be sourced or AI-generated | Ambient hum extends to ending (MVP acceptable) |

**Total external cost: $0** — Every dependency is free or has a sufficient free tier.

### Risk Factors

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Scope creep** | Medium | High | Deliberate constraints already in place. Three levels, keyboard only, no power-ups. If needed, ship with fewer levels. |
| **AI dev tooling limits** | Low-Medium | Medium | BMad GDS provides structured workflow. Prototype hardest parts first (Epic 1-2). |
| **Audio quality gap** | Low | Low | Modular audio architecture allows drop-in replacement. Ambient hum + basic SFX is acceptable MVP. |
| **Motivation loss** | Medium | Medium | Milestone-based development — each epic is a visible achievement. Build the fun parts first. |
| **Browser compatibility issues** | Low | Medium | Test early and often. Electron fallback guarantees consistency for desktop. |
| **WebGL performance** | Very Low | Medium | Vector wireframes are lightweight. Object pooling and managed draw calls. Validated by tech research. |

---

## Document Information

**Document:** Vector Wars - Game Design Document
**Version:** 1.0
**Created:** 2026-03-25
**Author:** Developer
**Status:** Complete

### Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-25 | Initial GDD complete — 14-step collaborative workflow |
