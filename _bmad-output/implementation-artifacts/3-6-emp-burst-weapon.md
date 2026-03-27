# Story 3.6: EMP Burst Weapon

Status: done

## Story

As a player,
I want to use EMP Burst to stun nearby enemies,
so that I have a tactical crowd-control option.

## Acceptance Criteria

1. An `EMPBurstSystem` class exists at `src/systems/EMPBurstSystem.ts` that manages EMP activation, cooldown tracking, area-of-effect enemy detection, stun application, visual pulse lifecycle, and disposal
2. `EMPBurstSystem` follows the same architectural pattern as `DataLanceSystem` and `LogicBombSystem`: constructor receives `scene`, `camera`, `inputManager`, `vectorMaterials`, `cockpitRenderer`, `gameObjectManager`; provides `update(dt)` and `dispose()` methods
3. Input action `emp` is added to `InputAction` type in `src/config/input.ts` mapped to `KeyX`. The `InputManager` already supports any action in the `InputAction` type — no changes to `InputManager.ts` needed
4. EMP Burst is **cooldown-based** with NO ammo limit: `EMP_BURST_COOLDOWN = 8.0` seconds. Cooldown tracked in `EMPBurstSystem`. `getCooldownRemaining(): number` and `getCooldownFraction(): number` methods exposed for HUD consumption. Cooldown does NOT reset between phases — it is a continuous timer
5. EMP Burst deals **no direct damage** to enemies. It applies a **stun effect** that slows affected enemies for a duration. This is purely crowd control per GDD: "No direct damage — Crowd control — stun/slow nearby enemies, create breathing room"
6. When the player presses X (`emp` action) AND cooldown <= 0: activate EMP burst. Set cooldown to `EMP_BURST_COOLDOWN`. Emit `weaponFired` event via `eventBus` with `{ weapon: 'emp', position }`. Trigger `cockpitRenderer.recoilArms(1.5)` for medium recoil. Emit `empBurstActivated` event via `eventBus` with `{ position, radius: EMP_BURST_RADIUS }`
7. If the player presses X but cooldown > 0, do NOT activate. No feedback needed for now (audio feedback comes in Epic 4)
8. Area-of-effect detection: on activation, `EMPBurstSystem` scans all active enemies from `GameObjectManager` within `EMP_BURST_RADIUS = 25` units of the camera position. For each enemy within range: apply stun effect by calling `enemy.applyStun(EMP_BURST_STUN_DURATION)`. The stun check uses simple distance comparison between camera world position and enemy position — no raycasting, no line-of-sight check (EMP passes through everything in cyberspace)
9. `Enemy` base class (`src/entities/enemies/Enemy.ts`) is extended with stun support:
   - New property: `private stunTimer: number = 0`
   - New method: `applyStun(duration: number): void` — sets `stunTimer = duration`. If already stunned, resets timer to `duration` (does not stack)
   - New getter: `get isStunned(): boolean` — returns `stunTimer > 0`
   - In `update(dt)`: if `stunTimer > 0`, decrement by `dt`. While stunned, AI state `update()` is still called BUT the enemy's effective `patrolSpeed` and `projectileSpeed` are multiplied by `EMP_BURST_SLOW_FACTOR = 0.2` (80% slower). This is implemented by exposing `getEffectiveParams(): BehaviorParams` that returns modified params when stunned
   - Visual feedback during stun: enemy scale oscillates (pulse) between 0.8 and 1.2 at `EMP_BURST_STUN_PULSE_RATE = 6.0` Hz using `sin(stunTimer * pulseRate * 2 * PI)` to create a visible "stuttering" effect per GDD: "Enemies visibly stutter/slow"
10. `EMPBurst` visual effect entity exists at `src/entities/projectiles/EMPBurst.ts`. It is a short-lived expanding wireframe sphere that represents the EMP pulse wave. It does NOT extend `GameObject` (same lightweight pattern as `LogicBomb` and `EnemyDataBurst`). Properties: `mesh: THREE.LineSegments`, `active: boolean`, `lifetime: number`, `maxLifetime: number`
11. `EMPBurst` visual geometry: an **expanding wireframe icosahedron** using `THREE.EdgesGeometry` from `THREE.IcosahedronGeometry(1, 2)` rendered as `THREE.LineSegments`. Starts at scale 0.5, expands to `EMP_BURST_RADIUS` over `EMP_BURST_VISUAL_DURATION = 0.6` seconds. Opacity fades from 1.0 to 0.0 over the same duration using `material.opacity` (material has `transparent: true`). Created via `vectorMaterials.create('emp-burst', 0.15)` — slightly brighter than default to stand out. Bloom layer enabled
12. `EMPBurst` pool: pre-allocate `EMP_BURST_POOL_SIZE = 3` instances at construction (only need a few since cooldown is 8 seconds). Use the same visibility-toggle pool pattern as `DataLanceSystem`: `mesh.visible = false` when inactive, `mesh.visible = true` when active. Pool managed internally by `EMPBurstSystem`
13. `EMPBurst` visual `update(dt)`: increment lifetime. Calculate progress `t = lifetime / maxLifetime`. Scale mesh: `mesh.scale.setScalar(0.5 + t * (EMP_BURST_RADIUS - 0.5))`. Set opacity: `material.opacity = 1.0 - t`. Deactivate when `lifetime >= maxLifetime`
14. `EMPBurst` visual uses a **separate `LineBasicMaterial` per pool instance** (NOT shared) because each instance needs independent opacity control for fade-out. Each material is still registered via `vectorMaterials.create('emp-burst-${index}', 0.15)` for palette compliance. Materials have `transparent: true` and `depthWrite: false` set
15. EMP Burst constants added to `src/config/constants.ts`:
    - `EMP_BURST_COOLDOWN = 8.0` (seconds — long cooldown for powerful effect)
    - `EMP_BURST_RADIUS = 25` (units — generous area to catch groups)
    - `EMP_BURST_STUN_DURATION = 3.0` (seconds — meaningful but not permanent)
    - `EMP_BURST_SLOW_FACTOR = 0.2` (multiplier — 80% slower movement and attacks)
    - `EMP_BURST_VISUAL_DURATION = 0.6` (seconds — fast expanding pulse)
    - `EMP_BURST_POOL_SIZE = 3`
    - `EMP_BURST_STUN_PULSE_RATE = 6.0` (Hz — visible stutter frequency)
16. New events added to `GameEvents` interface in `src/core/GameEvents.ts`:
    - `empBurstActivated: { position: { x: number; y: number; z: number }; radius: number }` — emitted when EMP fires, consumed by future Audio/HUD/Effects systems
17. AI states (`PatrolState`, `PursuitState`, `BlockState`, `AttackState`) must read speed/cooldown values from `enemy.getEffectiveParams()` instead of `enemy.params` directly, so that the stun slow factor is applied. This is the key integration point — AI states that already use `enemy.params.patrolSpeed` and `enemy.params.attackCooldown` and `enemy.params.projectileSpeed` must switch to `enemy.getEffectiveParams().patrolSpeed` etc.
18. `EMPBurstSystem` provides `getPoolStats(): { active: number; total: number }` for debug diagnostics, matching `DataLanceSystem` and `LogicBombSystem` patterns
19. Frame rate remains at 60 FPS stable. AoE scan iterates at most ~30-40 active enemies only on activation (not every frame). Stun timer is a single float per enemy. Visual sphere is one `LineSegments` object. No performance concerns
20. Running `npm run build` produces a clean production build with zero TypeScript errors
21. Unit tests exist for: `EMPBurstSystem` (activation, cooldown, AoE detection, stun application, pool management), `EMPBurst` visual (expansion animation, opacity fade, deactivation), `Enemy` stun mechanics (applyStun, isStunned, getEffectiveParams, stun timer, visual pulse), constants validation, input action mapping
22. All existing 857 tests continue to pass — zero regressions

## Tasks / Subtasks

- [x] Task 1: Add EMP Burst constants to `src/config/constants.ts` (AC: #15)
  - [x] 1.1 Add EMP Burst weapon constants:
    ```typescript
    // EMP Burst constants (Story 3-6)
    export const EMP_BURST_COOLDOWN = 8.0;
    export const EMP_BURST_RADIUS = 25;
    export const EMP_BURST_STUN_DURATION = 3.0;
    export const EMP_BURST_SLOW_FACTOR = 0.2;
    export const EMP_BURST_VISUAL_DURATION = 0.6;
    export const EMP_BURST_POOL_SIZE = 3;
    export const EMP_BURST_STUN_PULSE_RATE = 6.0;
    ```

- [x] Task 2: Add `emp` input action to `src/config/input.ts` (AC: #3)
  - [x] 2.1 Extend `InputAction` type:
    ```typescript
    export type InputAction = 'moveUp' | 'moveDown' | 'moveLeft' | 'moveRight' | 'fire' | 'logicBomb' | 'emp';
    ```
  - [x] 2.2 Add mapping to `INPUT_ACTIONS`:
    ```typescript
    emp: 'KeyX',
    ```
  - [x] 2.3 IMPORTANT: Use `'KeyX'` (physical key code), NOT `'x'` or `'X'`. The `InputManager` uses `event.code` not `event.key`. Verify by checking existing mappings use `KeyboardEvent.code` values (e.g., `'Space'`, `'ArrowUp'`, `'KeyZ'`).

- [x] Task 3: Add new events to `src/core/GameEvents.ts` (AC: #16)
  - [x] 3.1 Add event interface:
    ```typescript
    export interface EMPBurstActivatedEvent {
      position: { x: number; y: number; z: number };
      radius: number;
    }
    ```
  - [x] 3.2 Add to `GameEvents` interface:
    ```typescript
    empBurstActivated: EMPBurstActivatedEvent;
    ```

- [x] Task 4: Extend `Enemy` base class with stun support at `src/entities/enemies/Enemy.ts` (AC: #9, #17)
  - [x] 4.1 Add stun-related imports and constants:
    ```typescript
    import { EMP_BURST_SLOW_FACTOR, EMP_BURST_STUN_PULSE_RATE } from '../../config/constants.ts';
    ```
  - [x] 4.2 Add stun state properties:
    ```typescript
    private stunTimer: number = 0;
    ```
  - [x] 4.3 Add `applyStun(duration: number)` method:
    ```typescript
    applyStun(duration: number): void {
      this.stunTimer = duration; // Resets timer; does not stack
    }
    ```
  - [x] 4.4 Add `isStunned` getter:
    ```typescript
    get isStunned(): boolean {
      return this.stunTimer > 0;
    }
    ```
  - [x] 4.5 Add `getEffectiveParams()` method that returns modified BehaviorParams when stunned:
    ```typescript
    getEffectiveParams(): BehaviorParams {
      if (this.stunTimer <= 0) return this.params;
      return {
        ...this.params,
        patrolSpeed: this.params.patrolSpeed * EMP_BURST_SLOW_FACTOR,
        attackCooldown: this.params.attackCooldown / EMP_BURST_SLOW_FACTOR, // Slower attacks = longer cooldown
        projectileSpeed: this.params.projectileSpeed * EMP_BURST_SLOW_FACTOR,
      };
    }
    ```
  - [x] 4.6 Update `update(dt)` to handle stun timer and visual stutter:
    ```typescript
    // In update(dt), before AI state update:
    if (this.stunTimer > 0) {
      this.stunTimer = Math.max(0, this.stunTimer - dt);
      // Visual stutter: oscillate scale while stunned
      const pulse = Math.sin(this.stunTimer * EMP_BURST_STUN_PULSE_RATE * Math.PI * 2);
      const scale = 1.0 + pulse * 0.2; // oscillates between 0.8 and 1.2
      this.object3D.scale.setScalar(scale);
    } else if (this.flashTimer <= 0) {
      // Only reset scale if not flashing from damage hit
      this.object3D.scale.setScalar(1.0);
    }
    ```
  - [x] 4.7 Update `reset()` to clear stun state:
    ```typescript
    this.stunTimer = 0;
    ```
  - [x] 4.8 CRITICAL: The stun visual pulse must NOT conflict with the existing hit flash effect. The hit flash sets scale to 1.4 for 0.1 seconds. Stun pulse oscillates 0.8-1.2. Hit flash takes priority (it's very brief). Add check: if `flashTimer > 0`, skip stun pulse scale update.

- [x] Task 5: Update AI states to use `getEffectiveParams()` (AC: #17)
  - [x] 5.1 Update `src/ai/states/PatrolState.ts`: Change all `enemy.params.patrolSpeed` references to `enemy.getEffectiveParams().patrolSpeed`. There should be at least one reference where patrol movement speed is read.
  - [x] 5.2 Update `src/ai/states/PursuitState.ts`: Change all `enemy.params.patrolSpeed` references to `enemy.getEffectiveParams().patrolSpeed`. Watchdog pursuit speed uses `patrolSpeed * WATCHDOG_PURSUIT_SPEED_MULTIPLIER` — must use effective params.
  - [x] 5.3 Update `src/ai/states/BlockState.ts`: Change `enemy.params.patrolSpeed` to `enemy.getEffectiveParams().patrolSpeed` if patrol speed is used for block movement.
  - [x] 5.4 Update `src/ai/states/AttackState.ts`: Change `enemy.params.projectileSpeed` and `enemy.params.attackDamage` to use `enemy.getEffectiveParams()`. NOTE: `attackDamage` is NOT slowed by EMP (only speed and cooldown are affected), so `attackDamage` should remain reading from `enemy.params.attackDamage` directly. Only change `projectileSpeed` to use effective params.
  - [x] 5.5 IMPORTANT: Do NOT change `enemy.params.attackDamage` reads — EMP does not reduce damage, only speed. The `getEffectiveParams()` method preserves original `attackDamage` and `evasionChance` and `movementRandomness` values.
  - [x] 5.6 Pre-allocate any new temp objects if needed. The AI states already have pre-allocated temp vectors — follow the same pattern.

- [x] Task 6: Create `EMPBurst` visual effect at `src/entities/projectiles/EMPBurst.ts` (AC: #10, #11, #13, #14)
  - [x] 6.1 Create the visual effect entity:
    ```typescript
    /**
     * EMPBurst — Expanding wireframe sphere visual effect.
     *
     * An icosahedron wireframe that rapidly expands outward from the
     * activation point, fading as it grows, representing the EMP pulse wave.
     * Uses pre-allocated pool pattern: activate/deactivate toggle visibility.
     *
     * GDD: "Punchy and instant. Activation is immediate with a distinctive
     * visual pulse. Enemies visibly stutter/slow. You FEEL the disruption."
     *
     * Created by: Story 3-6
     */
    ```
  - [x] 6.2 Geometry: `THREE.EdgesGeometry` from `THREE.IcosahedronGeometry(1, 2)` — detail level 2 gives enough visual complexity for the wireframe sphere without excessive vertex count. Store as shared static geometry across all pool instances.
  - [x] 6.3 Material: each pool instance gets its own `THREE.LineBasicMaterial` via `vectorMaterials.create('emp-burst-${index}', 0.15)` with `transparent: true` and `depthWrite: false`. Individual materials needed because each instance fades independently.
  - [x] 6.4 Mesh: `THREE.LineSegments(sharedGeometry, instanceMaterial)`. Bloom layer enabled.
  - [x] 6.5 `activate(position: Vector3)` method: copy position to mesh, reset lifetime to 0, set mesh visible, set material opacity to 1.0, set scale to 0.5.
  - [x] 6.6 `deactivate()` method: set `active = false`, `mesh.visible = false`.
  - [x] 6.7 `update(dt)` method: increment lifetime, compute `t = lifetime / EMP_BURST_VISUAL_DURATION`. Update scale: `mesh.scale.setScalar(0.5 + t * (EMP_BURST_RADIUS - 0.5))`. Update opacity: `material.opacity = 1.0 - t`. Deactivate when `t >= 1.0`.
  - [x] 6.8 CRITICAL: Pre-allocate shared geometry ONCE (static field). Do NOT create new `IcosahedronGeometry` or `EdgesGeometry` per instance. Only the material is per-instance (for opacity).

- [x] Task 7: Create `EMPBurstSystem` at `src/systems/EMPBurstSystem.ts` (AC: #1, #2, #4, #6, #7, #8, #12, #18)
  - [x] 7.1 Create the system class:
    ```typescript
    /**
     * EMPBurstSystem — Manages EMP Burst activation, cooldown, area-of-effect
     * stun application, and expanding visual pulse lifecycle.
     *
     * Architecture: Same pattern as DataLanceSystem and LogicBombSystem — owns
     * its visual effect pool, handles area-of-effect detection, and does NOT
     * import other systems. Communicates via eventBus.
     *
     * GDD: "Cooldown-based area disruption pulse. No direct damage.
     * Stun/slow nearby enemies, create breathing room."
     *
     * Created by: Story 3-6
     */
    ```
  - [x] 7.2 Constructor: receives `scene`, `camera`, `inputManager`, `vectorMaterials`, `cockpitRenderer`, `gameObjectManager`. Pre-allocate `EMP_BURST_POOL_SIZE` EMPBurst visual instances. Pre-allocate temp vector `tempCameraPos` for AoE center.
  - [x] 7.3 `update(dt)` implementation:
    ```typescript
    this.cooldown = Math.max(0, this.cooldown - dt);

    if (this.inputManager.isActive('emp') && this.cooldown <= 0) {
      this.activate();
    }

    this.updateVisuals(dt);
    ```
  - [x] 7.4 `activate()` implementation: get camera world position, scan enemies within radius, apply stun, spawn visual, set cooldown, emit events, trigger recoil.
    ```typescript
    private activate(): void {
      this.camera.getWorldPosition(this.tempCameraPos);

      // Apply stun to all enemies within radius
      const entities = this.gameObjectManager.getAll();
      let stunCount = 0;
      for (const entity of entities) {
        if (!entity.isActive) continue;
        if (!('applyStun' in entity)) continue;

        const enemy = entity as Enemy;
        const distance = enemy.getPosition().distanceTo(this.tempCameraPos);
        if (distance <= EMP_BURST_RADIUS) {
          enemy.applyStun(EMP_BURST_STUN_DURATION);
          stunCount++;
        }
      }

      // Spawn visual pulse
      this.spawnVisual(this.tempCameraPos);

      // Set cooldown
      this.cooldown = EMP_BURST_COOLDOWN;

      // Emit events
      eventBus.emit('weaponFired', {
        weapon: 'emp',
        position: { x: this.tempCameraPos.x, y: this.tempCameraPos.y, z: this.tempCameraPos.z },
      });
      eventBus.emit('empBurstActivated', {
        position: { x: this.tempCameraPos.x, y: this.tempCameraPos.y, z: this.tempCameraPos.z },
        radius: EMP_BURST_RADIUS,
      });

      // Cockpit recoil
      this.cockpitRenderer.recoilArms(1.5);

      Logger.debug('Weapon', 'EMP Burst activated', { stunCount });
    }
    ```
  - [x] 7.5 `spawnVisual(position)`: acquire inactive EMPBurst from pool, activate at position.
  - [x] 7.6 `updateVisuals(dt)`: iterate all pool instances, call `update(dt)` on active ones.
  - [x] 7.7 `getCooldownRemaining(): number` — returns remaining cooldown seconds.
  - [x] 7.8 `getCooldownFraction(): number` — returns `cooldown / EMP_BURST_COOLDOWN` (0 = ready, 1 = just used). For HUD display.
  - [x] 7.9 `getPoolStats()` for debug diagnostics.
  - [x] 7.10 `dispose()`: remove all visual meshes from scene, dispose geometries/materials.

- [x] Task 8: Write unit tests (AC: #21, #22)
  - [x] 8.1 `src/__tests__/EMPBurst.test.ts`: Construction (geometry creation, bloom layer, initially invisible), activate/deactivate visibility toggle, expansion animation (scale increases over time), opacity fade (decreases over time), auto-deactivation when visual duration exceeded
  - [x] 8.2 `src/__tests__/EMPBurstSystem.test.ts`:
    - Activation: activates when X pressed + cooldown ready, does NOT activate when cooldown > 0
    - Cooldown: starts at 0 (ready), sets to `EMP_BURST_COOLDOWN` on activation, decrements over time, `getCooldownRemaining()` returns correct value, `getCooldownFraction()` returns correct ratio
    - AoE detection: stuns enemies within radius, does NOT stun enemies outside radius, stuns multiple enemies in single activation
    - Events: emits `weaponFired` with `weapon: 'emp'`, emits `empBurstActivated` with position and radius
    - Visual: spawns EMPBurst visual on activation
    - Pool: pre-allocates correct number of visuals, pool exhaustion handling
    - Dispose: removes meshes from scene
  - [x] 8.3 `src/__tests__/EnemyStun.test.ts`:
    - `applyStun()` sets stun timer
    - `isStunned` returns true when timer > 0, false when timer expired
    - `getEffectiveParams()` returns slowed params when stunned
    - `getEffectiveParams()` returns normal params when not stunned
    - Stun timer decrements with `update(dt)`
    - Stun does NOT stack — reapplying resets timer
    - `attackDamage` is NOT modified by stun (only speed/cooldown)
    - Visual pulse oscillation during stun
    - `reset()` clears stun state
  - [x] 8.4 `src/__tests__/EMPBurstConstants.test.ts`: All constant values are positive numbers, `EMP_BURST_COOLDOWN > 0`, `EMP_BURST_RADIUS > 0`, `EMP_BURST_STUN_DURATION > 0`, `EMP_BURST_SLOW_FACTOR` is between 0 and 1
  - [x] 8.5 `src/__tests__/InputActions.test.ts` (extend existing): Verify `emp` action exists in `INPUT_ACTIONS`, mapped to `KeyX`
  - [x] 8.6 Follow the same test setup patterns as `LogicBombSystem.test.ts`: mock `InputManager` with `vi.fn()`, use real `THREE.Scene`, `PerspectiveCamera`, `VectorMaterials`, `CockpitRenderer`. Mock `GameObjectManager` with controllable enemy list. Mock enemies must have `applyStun` method.
  - [x] 8.7 Verify all 857 existing tests still pass after changes

- [x] Task 9: Verify build and integration readiness (AC: #19, #20)
  - [x] 9.1 `npm run build` produces zero TypeScript errors
  - [x] 9.2 Performance validation: AoE scan is O(n) over active enemies and only runs on activation (not every frame). Stun timer is a single float per enemy. Expanding sphere is one LineSegments with scale animation. Well within 16.67ms frame budget
  - [x] 9.3 The `EMPBurstSystem` is standalone — it is NOT integrated into any phase's game loop yet. Integration comes when phases are wired together (story 3-10). The system MUST be designed so that phase code can simply call `empBurstSystem.update(dt)` alongside `dataLanceSystem.update(dt)` and `logicBombSystem.update(dt)`

## Dev Notes

### Architecture Patterns and Constraints

- **System Architecture:** `EMPBurstSystem` lives at `src/systems/EMPBurstSystem.ts` per the architecture directory structure. It follows the same pattern as `DataLanceSystem` and `LogicBombSystem` — it owns its visual effect pool, handles its own AoE detection, and communicates via `eventBus`. It does NOT import `CollisionSystem`, `DataLanceSystem`, `LogicBombSystem`, or any other system.
- **Visual Effect Entity:** `EMPBurst.ts` at `src/entities/projectiles/EMPBurst.ts` per architecture. The `src/entities/projectiles/` directory already contains `EnemyDataBurst.ts` and `LogicBomb.ts`. EMPBurst follows the same lightweight pattern — NOT extending `GameObject`, just a plain class with mesh/update.
- **GameObjectManager dependency:** `EMPBurstSystem` receives `GameObjectManager` in its constructor to iterate enemies for AoE detection. This is a read-only dependency — it never adds/removes entities. The same pattern is used by `CollisionSystem` and `LogicBombSystem`.
- **Enemy modification:** This story modifies the `Enemy` base class to add stun support. This is the ONLY story that adds `applyStun`, `isStunned`, and `getEffectiveParams()` to the enemy hierarchy. All four enemy types (Sentinel, Watchdog, Gatekeeper, + future Overseer) inherit stun behavior from the base class.
- **AI state modification:** AI states must be updated to use `enemy.getEffectiveParams()` instead of `enemy.params` for speed/cooldown values. This is a behavioral change that must be carefully tested to ensure stunned enemies actually slow down.
- **Input extension:** Adding `emp` to `InputAction` type requires updating the type union in `src/config/input.ts` and adding the mapping entry. Same pattern as story 3-5 adding `logicBomb`.
- **Event-driven communication:** `empBurstActivated` event is added to `GameEvents.ts` for future HUD/audio consumption. The `weaponFired` event already exists with `WeaponType` that includes `'emp'`.
- **Material creation:** Per-instance `LineBasicMaterial` via `vectorMaterials.create('emp-burst-${index}', 0.15)` for the visual pulse. Each instance needs independent opacity for fade-out. NEVER create materials directly outside VectorMaterials. This ensures palette transitions work.
- **Geometry sharing:** `EdgesGeometry(IcosahedronGeometry(1, 2))` is created ONCE as a static shared resource. All pool instances share this geometry. Only the material is per-instance.

### GDD Weapon Feel Requirements

- **"Punchy and instant"** — achieved through: instant activation (no charge-up, no projectile travel), immediate visual pulse expanding outward, immediate stun effect on enemies
- **"Enemies visibly stutter/slow"** — achieved through: scale oscillation on stunned enemies (0.8-1.2 pulse), slowed movement via `getEffectiveParams()` reducing patrol/pursuit speed by 80%
- **"You FEEL the disruption"** — achieved through: expanding wireframe sphere visual that fills the screen area, cockpit recoil (1.5), all nearby enemies visibly affected simultaneously
- **"Creates breathing room in intense moments"** — achieved through: 3-second stun with 80% slow means enemies barely move/shoot for a meaningful window, 25-unit radius catches groups
- **"No direct damage"** — EMP does NOT call `enemy.takeDamage()`. It only calls `enemy.applyStun()`. Enemies retain full health. Damage must still come from Data Lance or Logic Bombs
- **"Cooldown-based"** — 8-second cooldown creates resource management decisions without ammo tracking. Long enough that players must use it strategically, short enough to be relevant in each phase

### Stun Mechanic Design

| Enemy Type | Normal Speed | Stunned Speed (×0.2) | Effect |
|-----------|-------------|----------------------|--------|
| Sentinel | patrolSpeed 1.0 | 0.2 | Nearly frozen in place |
| Watchdog | pursuitSpeed 1.5×1.8 = 2.7 | 0.54 | Pursuit barely moves |
| Gatekeeper | blockSpeed 0.8×1.2 = 0.96 | 0.192 | Stops blocking effectively |
| (Bosses) | N/A | N/A | Bosses should NOT have stun applied in boss phase — `applyStun` can be overridden in Boss base class to no-op. This is a future consideration for story 3-7 |

### Damage Balance — EMP Changes Nothing

EMP deals zero damage. It only affects movement and attack speed. The damage table from Story 3-5 remains unchanged:

| Target | HP | Data Lance Twin-Bolt Hits | Logic Bomb Hits |
|--------|-----|--------------------------|----------------|
| Sentinel | 30 | ~4 twin volleys | 1 (one-shot) |
| Watchdog | 40 | ~5 twin volleys | 1 (one-shot) |
| Gatekeeper | 80 | ~10 twin volleys | 2 |

EMP creates a 3-second window where enemies are nearly stationary — ideal for following up with Data Lance sustained fire or saving a Logic Bomb for a precise hit.

### Integration Notes for Future Stories

- **Story 3-7 (Gatekeeper Boss):** Boss base class should override `applyStun()` to either no-op or apply a reduced effect. Bosses should not be fully stunnable. Consider `Boss.applyStun()` applying only 50% of the normal stun duration or ignoring it entirely.
- **Story 3-10 (Phase Transitions):** EMP cooldown does NOT reset between phases (unlike Logic Bomb ammo). The cooldown timer continues across phase transitions. Phase `enter()` does NOT need to call any reset method on `EMPBurstSystem`.
- **HUD Enhancement (future):** `getCooldownRemaining()` and `getCooldownFraction()` methods are ready for a cooldown indicator display. The `empBurstActivated` event is ready for a HUD pulse overlay.
- **Audio (Epic 4):** `weaponFired` event with `weapon: 'emp'` is ready for fire SFX. `empBurstActivated` event is ready for the distinctive EMP pulse sound effect. GDD describes it as: "Punchy and instant... distinctive visual/audio feedback pulse."

### Existing Code Patterns to Follow

- **DataLanceSystem** (`src/systems/DataLanceSystem.ts`): Reference implementation for weapon system architecture — pool pattern, fire logic, update loop, dispose
- **LogicBombSystem** (`src/systems/LogicBombSystem.ts`): Reference for weapon system with `GameObjectManager` dependency — enemy scanning, event emission, ammo/cooldown tracking
- **LogicBomb** (`src/entities/projectiles/LogicBomb.ts`): Reference for lightweight projectile/effect entity — mesh, activate/deactivate, update
- **Enemy** (`src/entities/enemies/Enemy.ts`): Base class being extended — understand existing `update()` flow, `flashTimer` priority, `reset()` contract
- **Sentinel** (`src/entities/enemies/Sentinel.ts`): Reference for enemy subclass — shared geometry/material pattern
- **LogicBombSystem.test.ts** (`src/__tests__/LogicBombSystem.test.ts`): Reference for test setup — mock InputManager, real Scene/Camera/VectorMaterials, mock GameObjectManager

### AI State Files to Modify

These files currently read from `enemy.params` and must be updated to `enemy.getEffectiveParams()` for speed/cooldown values:

- `src/ai/states/PatrolState.ts` — uses `enemy.params.patrolSpeed` for movement
- `src/ai/states/PursuitState.ts` — uses `enemy.params.patrolSpeed` for pursuit movement
- `src/ai/states/BlockState.ts` — uses `enemy.params.patrolSpeed` for block movement
- `src/ai/states/AttackState.ts` — uses `enemy.params.projectileSpeed` for burst speed (DO NOT change `enemy.params.attackDamage` — damage is not affected by stun)

### Project Structure Notes

- All new files align with architecture directory structure:
  - `src/systems/EMPBurstSystem.ts` — weapon system
  - `src/entities/projectiles/EMPBurst.ts` — visual effect entity
  - `src/config/constants.ts` — constants (append)
  - `src/config/input.ts` — input mapping (extend)
  - `src/core/GameEvents.ts` — events (extend)
- Modified files:
  - `src/entities/enemies/Enemy.ts` — add stun support
  - `src/ai/states/PatrolState.ts` — use `getEffectiveParams()`
  - `src/ai/states/PursuitState.ts` — use `getEffectiveParams()`
  - `src/ai/states/BlockState.ts` — use `getEffectiveParams()`
  - `src/ai/states/AttackState.ts` — use `getEffectiveParams()` for projectileSpeed only
- No new directories created — all target directories already exist
- The `src/__tests__/InputActions.test.ts` test file already exists from story 3-5 and needs to be extended

### Technical Research Notes

- **Three.js r183 `EdgesGeometry`**: Generates edge-only geometry from any `BufferGeometry`. Works with `IcosahedronGeometry(radius, detail)` — detail 2 produces 320 triangles → 480 edge line segments. Sufficient visual density for a wireframe sphere effect without being expensive.
- **Three.js r183 `LineBasicMaterial` opacity**: Set `transparent: true` and `depthWrite: false` for correct alpha blending on expanding sphere. Opacity can be set per-frame. Material must be per-instance (not shared) for independent fade.
- **Three.js r183 `Object3D.scale.setScalar()`**: Uniform scaling on all axes. Works correctly with `LineSegments` — vertices are scaled in local space. No need to modify geometry buffer data for the expansion effect.
- **Three.js r183 `Vector3.distanceTo()`**: Euclidean distance between two vectors. Slightly faster than manual sqrt computation. Used for AoE range check. Pre-allocation of the camera position vector avoids GC.
- **Three.js version note**: Project architecture specifies Three.js r183. Research indicates r182 was the latest confirmed stable release as of early 2026, with r183 available on NPM. The project is already using r183 per `package.json` and `project-context.md`. No API changes needed.

### References

- [Source: _bmad-output/gdd.md#Weapon Systems] — EMP Burst: "Area disruption pulse, Cooldown-based, No direct damage, Crowd control — stun/slow nearby enemies, create breathing room"
- [Source: _bmad-output/gdd.md#Input Feel] — "EMP Burst: Punchy and instant. Activation is immediate with a distinctive visual/audio feedback pulse. Enemies visibly stutter/slow. You FEEL the disruption."
- [Source: _bmad-output/gdd.md#Core Gameplay Mechanics] — "EMP Burst (X) — Short-range area disruption that stuns/slows nearby enemies. Tactical crowd control. Punchy feel — instant activation with a visual/audio feedback pulse. Creates breathing room in intense moments."
- [Source: _bmad-output/gdd.md#Mechanic Interactions] — "EMP for crowds on the surface"
- [Source: _bmad-output/game-architecture.md#Input System] — `emp` action mapped to X key
- [Source: _bmad-output/game-architecture.md#Entity System] — `EMPBurst` in Projectile hierarchy
- [Source: _bmad-output/game-architecture.md#Event System] — `weaponFired` event with `WeaponType`
- [Source: _bmad-output/game-architecture.md#Architectural Boundaries] — Systems never import each other
- [Source: _bmad-output/project-context.md#Critical Implementation Rules] — VectorMaterials.create() mandatory, BLOOM_LAYER on all geometry, EventBus for inter-system communication
- [Source: _bmad-output/project-context.md#Architecture Rules] — "Entities never import systems", "Systems never import each other", "One StateMachine<T> generic class"

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Existing AI state tests (AttackState, BlockState, PursuitState) used mock enemies without `getEffectiveParams()`. Fixed by adding `getEffectiveParams() { return this.params; }` to all mock enemy objects.
- InputConfig.test.ts had a hardcoded expected key count of 6, updated to 7 for the new `emp` action.

### Completion Notes List

- Implemented all 7 EMP Burst constants in `src/config/constants.ts`
- Extended `InputAction` type and `INPUT_ACTIONS` map with `emp: 'KeyX'`
- Added `EMPBurstActivatedEvent` interface and `empBurstActivated` event to `GameEvents.ts`
- Extended `Enemy` base class with stun mechanics: `applyStun()`, `isStunned`, `getEffectiveParams()`, stun timer decrement, visual pulse oscillation, hit flash priority, reset clearing
- Updated all 4 AI states (PatrolState, PursuitState, BlockState, AttackState) to use `enemy.getEffectiveParams()` for speed/cooldown values while preserving `attackDamage` from `enemy.params`
- Created `EMPBurst` visual effect entity with shared static `EdgesGeometry(IcosahedronGeometry(1,2))`, per-instance `LineBasicMaterial`, expansion animation, opacity fade, auto-deactivation
- Created `EMPBurstSystem` following DataLanceSystem/LogicBombSystem pattern: pool management, cooldown tracking, AoE enemy scanning, event emission, cockpit recoil, dispose
- 63 new tests added across 4 new test files + 1 extended test file
- All 920 tests pass (857 original + 63 new), zero regressions
- Production build succeeds with zero TypeScript errors

### Implementation Plan

- Followed red-green-refactor TDD cycle for each task
- Used existing LogicBombSystem as architectural reference for EMPBurstSystem
- EMP uses shared geometry pattern: single EdgesGeometry from IcosahedronGeometry(1, 2) shared across all pool instances, only materials are per-instance for independent opacity control
- Stun visual pulse uses sin wave with EMP_BURST_STUN_PULSE_RATE to oscillate enemy scale between 0.8 and 1.2, with hit flash taking priority (flashTimer > 0 skips stun pulse)
- AI states updated to getEffectiveParams() which returns slowed params only when stunned: patrolSpeed and projectileSpeed multiplied by 0.2, attackCooldown divided by 0.2 (5x longer), attackDamage/evasionChance/movementRandomness unchanged
- EMPBurstSystem is standalone and not integrated into any phase game loop yet (deferred to story 3-10)

### File List

New files:
- src/systems/EMPBurstSystem.ts
- src/entities/projectiles/EMPBurst.ts
- src/__tests__/EMPBurstSystem.test.ts
- src/__tests__/EMPBurst.test.ts
- src/__tests__/EnemyStun.test.ts
- src/__tests__/EMPBurstConstants.test.ts

Modified files:
- src/config/constants.ts (added EMP_BURST_* constants)
- src/config/input.ts (added 'emp' to InputAction type and INPUT_ACTIONS map)
- src/core/GameEvents.ts (added EMPBurstActivatedEvent interface and empBurstActivated event)
- src/entities/enemies/Enemy.ts (added stun support: applyStun, isStunned, getEffectiveParams, stun timer, visual pulse)
- src/ai/states/PatrolState.ts (enemy.params.patrolSpeed -> enemy.getEffectiveParams().patrolSpeed)
- src/ai/states/PursuitState.ts (enemy.params.patrolSpeed -> enemy.getEffectiveParams().patrolSpeed)
- src/ai/states/BlockState.ts (enemy.params.patrolSpeed -> enemy.getEffectiveParams().patrolSpeed)
- src/ai/states/AttackState.ts (enemy.params.projectileSpeed -> enemy.getEffectiveParams().projectileSpeed)
- src/__tests__/AttackState.test.ts (added getEffectiveParams to mock enemies)
- src/__tests__/BlockState.test.ts (added getEffectiveParams to mock enemies)
- src/__tests__/PursuitState.test.ts (added getEffectiveParams to mock enemies)
- src/__tests__/InputConfig.test.ts (updated expected key count from 6 to 7)
- src/__tests__/InputActions.test.ts (added emp action tests)

### Change Log

- 2026-03-26: Story 3-6 implementation complete. Added EMP Burst weapon system with cooldown-based AoE stun mechanic, expanding wireframe sphere visual, Enemy stun support with getEffectiveParams(), AI state integration for slow effect. 63 new tests, 920 total passing, zero regressions, clean build.
- 2026-03-26: Code review (adversarial). 2 issues found (1 MEDIUM, 1 LOW), both fixed. MEDIUM: EMPBurstSystem.dispose() disposed shared geometry multiple times (once per pool instance) — fixed to dispose only once. LOW: Enemy.getEffectiveParams() allocated new object per frame during stun — fixed with pre-allocated stunnedParams cache. All 920 tests pass, clean build. Story marked done.
