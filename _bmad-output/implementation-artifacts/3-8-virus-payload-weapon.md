# Story 3.8: Virus Payload Weapon

Status: review

## Story

As a player,
I want to deliver a Virus Payload to the boss core,
so that the kill mechanic feels narrative and consequential.

## Acceptance Criteria

1. A `VirusPayload` projectile entity class exists at `src/entities/projectiles/VirusPayload.ts`. It is a wireframe geometry (distinct from all other projectiles) using `LineSegments` with bloom layer enabled. It has `active`, `lifetime`, `distance`, `direction`, `collider` (bounding sphere), and a visual that conveys deliberate, weighty momentum. Material created via `vectorMaterials.create()`. It follows the same activate/deactivate pool pattern as `LogicBomb` and `EMPBurst`.
2. A `VirusPayloadSystem` class exists at `src/systems/VirusPayloadSystem.ts`. It follows the same architectural pattern as `LogicBombSystem` and `EMPBurstSystem`: owns its projectile pool, handles its own collision detection against the boss, and does NOT import other systems. Communicates via `eventBus`.
3. `VirusPayloadSystem` fires on `inputManager.isActive('virusPayload')` (C key). It is only fireable during the boss vulnerability window — the system subscribes to `bossVulnerable` events and tracks a `bossIsVulnerable` boolean. Pressing C outside a vulnerability window does nothing (no cooldown consumed, no feedback — the weapon simply won't activate).
4. The `virusPayload` input action is added to `src/config/input.ts`: the `InputAction` type is extended with `'virusPayload'` and mapped to `'KeyC'` in `INPUT_ACTIONS`.
5. Virus Payload constants added to `src/config/constants.ts`: `VIRUS_PAYLOAD_SPEED = 20` (slower than Data Lance and Logic Bomb — deliberate feel), `VIRUS_PAYLOAD_DAMAGE = 100` (massive damage — designed to devastate the boss during the 4-second vulnerability window), `VIRUS_PAYLOAD_FIRE_COOLDOWN = 1.5` (seconds — slower fire rate reinforces weighty, consequential feel), `VIRUS_PAYLOAD_MAX_RANGE = 80`, `VIRUS_PAYLOAD_MAX_LIFETIME = 5.0`, `VIRUS_PAYLOAD_POOL_SIZE = 5`, `VIRUS_PAYLOAD_COLLIDER_RADIUS = 1.0` (larger than Data Lance bolt collider for more forgiving hits on boss core), `VIRUS_PAYLOAD_LENGTH = 3.0` (larger projectile than other weapons)
6. The `VirusPayload` projectile visual is a distinctive wireframe shape that communicates "mission weapon" — a double-helix or interlocking ring geometry (two small torus wireframes rotated 90 degrees, or similar distinctive shape) that is visually distinct from the straight-line Data Lance bolts and diamond Logic Bombs. It spins slowly as it travels, reinforcing the biological/viral metaphor. All geometry uses `EdgesGeometry` to `LineSegments` with bloom layer enabled.
7. `VirusPayloadSystem` collision detection: checks active payloads against boss entities in `GameObjectManager` using sphere-sphere intersection (same pattern as `LogicBombSystem.checkBombCollisions()`). On hit, calls `boss.takeDamage(VIRUS_PAYLOAD_DAMAGE)` and deactivates the payload. The Virus Payload deals full damage regardless of boss vulnerability phase (the system already restricts firing to vulnerability windows only — if a payload is in-flight when vulnerability ends, it still deals full damage on hit).
8. `VirusPayloadSystem` emits `weaponFired` event with `weapon: 'virusPayload'` on fire. Triggers `cockpitRenderer.recoilArms(2.5)` (heaviest recoil of all weapons — consequential feel).
9. New event added to `GameEvents` interface in `src/core/GameEvents.ts`: `virusPayloadDelivered: { position: { x: number; y: number; z: number }; damage: number }` — emitted when a Virus Payload successfully hits the boss. This event will be used by future audio/narrative systems for the distinctive delivery sound and potential handler celebration dialogue.
10. `VirusPayloadSystem` subscribes to `bossDefeated` to deactivate all in-flight payloads and prevent further firing after the boss is dead.
11. `VirusPayloadSystem` provides public methods: `getPoolStats(): { active: number; total: number }`, `getCooldownRemaining(): number`, `isBossVulnerable(): boolean`, `dispose(): void`.
12. Frame rate remains at 60 FPS stable. Virus Payload pool is small (5) and only active during boss phase vulnerability windows. Pre-allocate all temp vectors. Zero per-frame allocation.
13. Running `npm run build` produces a clean production build with zero TypeScript errors.
14. Unit tests exist for: `VirusPayload` entity (geometry, bloom, activate/deactivate, movement, collider sync, lifetime/range deactivation, spin animation), `VirusPayloadSystem` (firing only during vulnerability, cooldown enforcement, collision with boss, `weaponFired` event emission, `virusPayloadDelivered` event on hit, `bossVulnerable` subscription, `bossDefeated` deactivation, pool stats, recoil trigger), input config additions (virusPayload action mapped to KeyC), constants validation.
15. All existing tests continue to pass — zero regressions.

## Tasks / Subtasks

- [x] Task 1: Add Virus Payload constants to `src/config/constants.ts` (AC: #5)
  - [x] 1.1 Add Virus Payload weapon constants:
    ```typescript
    // Virus Payload constants (Story 3-8)
    export const VIRUS_PAYLOAD_SPEED = 20;
    export const VIRUS_PAYLOAD_DAMAGE = 100;
    export const VIRUS_PAYLOAD_FIRE_COOLDOWN = 1.5;
    export const VIRUS_PAYLOAD_MAX_RANGE = 80;
    export const VIRUS_PAYLOAD_MAX_LIFETIME = 5.0;
    export const VIRUS_PAYLOAD_POOL_SIZE = 5;
    export const VIRUS_PAYLOAD_COLLIDER_RADIUS = 1.0;
    export const VIRUS_PAYLOAD_LENGTH = 3.0;
    ```

- [x] Task 2: Add `virusPayload` input action to `src/config/input.ts` (AC: #4)
  - [x] 2.1 Extend `InputAction` type:
    ```typescript
    export type InputAction = 'moveUp' | 'moveDown' | 'moveLeft' | 'moveRight' | 'fire' | 'logicBomb' | 'emp' | 'virusPayload';
    ```
  - [x] 2.2 Add mapping to `INPUT_ACTIONS`:
    ```typescript
    virusPayload: 'KeyC',
    ```

- [x] Task 3: Add `virusPayloadDelivered` event to `src/core/GameEvents.ts` (AC: #9)
  - [x] 3.1 Add event interface:
    ```typescript
    export interface VirusPayloadDeliveredEvent {
      position: { x: number; y: number; z: number };
      damage: number;
    }
    ```
  - [x] 3.2 Add to `GameEvents` interface:
    ```typescript
    virusPayloadDelivered: VirusPayloadDeliveredEvent;
    ```

- [x] Task 4: Create `VirusPayload` entity at `src/entities/projectiles/VirusPayload.ts` (AC: #1, #6)
  - [x] 4.1 Create the projectile entity class:
    ```typescript
    /**
     * VirusPayload — The mission weapon projectile.
     *
     * A distinctive wireframe double-ring shape that spins as it travels,
     * conveying the biological/viral injection metaphor. Larger and slower
     * than other projectiles — deliberate and consequential.
     *
     * GDD: "This is the kill shot — it should feel like pulling a trigger
     * that matters."
     *
     * Created by: Story 3-8
     */
    ```
  - [x] 4.2 Geometry: create two small torus wireframes (`TorusGeometry(VIRUS_PAYLOAD_LENGTH * 0.4, VIRUS_PAYLOAD_LENGTH * 0.12, 6, 8)`) rotated 90 degrees relative to each other (one on XY plane, one on XZ plane), both converted through `EdgesGeometry` to `LineSegments`. Group them under a single `THREE.Object3D`. Both use shared material via `vectorMaterials.create('virus-payload', 0.1)` (slightly brighter). Bloom layer enabled on both.
  - [x] 4.3 IMPORTANT: Use a single shared `EdgesGeometry` for all pool instances (same pattern as `EMPBurst`). Create the geometry once at module level and reuse across all `VirusPayload` instances.
  - [x] 4.4 Properties: `active: boolean`, `direction: THREE.Vector3`, `distance: number`, `lifetime: number`, `collider: THREE.Sphere`, `mesh: THREE.Object3D` (the group containing both ring LineSegments)
  - [x] 4.5 `activate(origin: Vector3, direction: Vector3)`: copy position/direction, reset distance/lifetime, set active/visible, orient mesh to face travel direction using `quaternion.setFromUnitVectors`, sync collider
  - [x] 4.6 `deactivate()`: set active=false, visible=false, reset distance/lifetime
  - [x] 4.7 `update(dt)`: if not active return. Move along direction by `VIRUS_PAYLOAD_SPEED * dt`. Increment distance/lifetime. Spin the mesh group slowly on Z axis (`rotation.z += 2.0 * dt` — visible rotation). Sync collider center. Deactivate if lifetime > MAX_LIFETIME or distance > MAX_RANGE.
  - [x] 4.8 Pre-allocate temp vectors. The `DEFAULT_FORWARD = new Vector3(0, 0, -1)` pattern from `LogicBomb.ts`.

- [x] Task 5: Create `VirusPayloadSystem` at `src/systems/VirusPayloadSystem.ts` (AC: #2, #3, #7, #8, #10, #11)
  - [x] 5.1 Create the weapon system class:
    ```typescript
    /**
     * VirusPayloadSystem — Manages Virus Payload firing, pooling,
     * boss collision detection, and vulnerability window gating.
     *
     * Architecture: Same pattern as LogicBombSystem and EMPBurstSystem —
     * owns its projectile pool, handles its own collision detection,
     * and does NOT import other systems. Communicates via eventBus.
     *
     * GDD: "Phase-specific availability. Single use per target.
     * Lethal to AI cores. Boss killer — literally injecting a virus."
     *
     * The weapon is ONLY fireable during boss vulnerability windows.
     * Subscribes to bossVulnerable events to track window state.
     *
     * Created by: Story 3-8
     */
    ```
  - [x] 5.2 Constructor receives: `scene`, `camera`, `inputManager`, `vectorMaterials`, `cockpitRenderer`, `gameObjectManager`. Pre-allocate pool of `VIRUS_PAYLOAD_POOL_SIZE` VirusPayload instances. Subscribe to `bossVulnerable` event to track `bossIsVulnerable` boolean. Subscribe to `bossDefeated` event to set `bossIsDefeated` flag.
  - [x] 5.3 `update(dt)`:
    ```typescript
    this.cooldown = Math.max(0, this.cooldown - dt);
    if (
      this.inputManager.isActive('virusPayload') &&
      this.bossIsVulnerable &&
      !this.bossIsDefeated &&
      this.cooldown <= 0
    ) {
      this.fire();
    }
    this.updatePayloads(dt);
    this.checkPayloadCollisions();
    ```
  - [x] 5.4 `fire()`: acquire payload from pool, get camera position/direction, activate payload, set cooldown, emit `weaponFired` event with `weapon: 'virusPayload'`, trigger `cockpitRenderer.recoilArms(2.5)`, log via Logger.
  - [x] 5.5 `checkPayloadCollisions()`: iterate active payloads, iterate `gameObjectManager.getAll()` entities, check for `takeDamage` AND check entity is a boss (use `'defeated' in entity` as a boss duck-type check — only `Boss` has the `defeated` property). Sphere-sphere collision: `payload.collider.intersectsSphere(entity.getCollider())`. On hit: call `entity.takeDamage(VIRUS_PAYLOAD_DAMAGE)`, emit `virusPayloadDelivered` event, deactivate payload, log.
  - [x] 5.6 `bossVulnerable` handler: `this.bossIsVulnerable = event.vulnerable;`
  - [x] 5.7 `bossDefeated` handler: `this.bossIsDefeated = true; this.bossIsVulnerable = false;` — deactivate all in-flight payloads.
  - [x] 5.8 Public methods: `getPoolStats()`, `getCooldownRemaining()`, `isBossVulnerable()`, `dispose()`.
  - [x] 5.9 Pre-allocate temp vectors for camera position/direction (`tempCameraPos`, `tempCameraDir`). Zero per-frame allocation.

- [x] Task 6: Write unit tests (AC: #14, #15)
  - [x] 6.1 `src/__tests__/VirusPayload.test.ts`: geometry creation (two ring LineSegments with bloom), activate/deactivate toggle, movement along direction, collider sync, spin rotation, lifetime/range deactivation, shared geometry pattern
  - [x] 6.2 `src/__tests__/VirusPayloadSystem.test.ts`: fires only during vulnerability window (bossIsVulnerable=true), does NOT fire when bossIsVulnerable=false, cooldown enforcement, collision with boss entity (sphere-sphere), `weaponFired` event emission with 'virusPayload', `virusPayloadDelivered` event on successful hit, `bossVulnerable` subscription updates state, `bossDefeated` deactivates all payloads and prevents firing, pool stats, recoil trigger (2.5), dispose cleanup
  - [x] 6.3 `src/__tests__/VirusPayloadInput.test.ts`: `InputAction` type includes 'virusPayload', `INPUT_ACTIONS.virusPayload` equals 'KeyC'
  - [x] 6.4 `src/__tests__/VirusPayloadConstants.test.ts`: all Virus Payload constants are defined, have expected types and reasonable value ranges
  - [x] 6.5 All existing tests continue to pass — zero regressions

- [x] Task 7: Integration verification (AC: #12, #13)
  - [x] 7.1 Verify `npm run build` produces zero TypeScript errors
  - [x] 7.2 Verify frame rate remains at 60 FPS with payload pool active during boss phase
  - [x] 7.3 Verify Virus Payload is visually distinct and visible in the browser — a spinning wireframe ring projectile that looks and feels different from Data Lance bolts and Logic Bombs

## Dev Notes

### Architecture Patterns and Constraints

- **Same weapon system pattern as LogicBombSystem and EMPBurstSystem.** Each weapon system owns its pool, handles its own collision, communicates only via EventBus. Do NOT import other systems (no importing CollisionSystem, DataLanceSystem, etc.).
- **VirusPayload is a Projectile, NOT a one-shot effect.** Unlike EMP Burst (which is an instant area effect), Virus Payload is a physical projectile that travels through space and must collide with the boss. It follows the `LogicBomb` pattern more closely: fire from camera, travel along direction, check collision, deactivate on hit or range.
- **Vulnerability window gating is in the SYSTEM, not the projectile.** The `VirusPayloadSystem` checks `bossIsVulnerable` before allowing fire. If a payload is already in flight when the vulnerability window closes, it still deals damage on hit. This is the correct behavior per GDD: once launched, the payload is committed.
- **Boss duck-typing for collision.** The collision check should specifically target boss entities. Use `'defeated' in entity` as a duck-type check since only `Boss` has the `defeated` property (enemies have `isActive` but not `defeated`). This prevents Virus Payloads from hitting regular enemies.
- **Materials via VectorMaterials.create() ONLY.** Never `new LineBasicMaterial()` directly. The virus payload material uses `vectorMaterials.create('virus-payload', 0.1)` for a slightly brighter appearance.
- **Bloom layer on ALL wireframe geometry.** Both torus ring LineSegments must have `layers.enable(BLOOM_LAYER)`.
- **Pre-allocate ALL temp objects.** `tempCameraPos`, `tempCameraDir` as class properties on `VirusPayloadSystem`. Zero per-frame allocation.
- **No `fetch()` or `await` in update().** All data is defined as constants.
- **Shared geometry across pool instances.** Like `EMPBurst`, create the `EdgesGeometry` once at module level and reuse for all pool instances. Only one `TorusGeometry` + `EdgesGeometry` pair needed per ring orientation.
- **Logger, not console.log.** Use `Logger.debug('Weapon', ...)` for all logging.
- **Entities never import systems.** `VirusPayload` entity does not know about `VirusPayloadSystem`.

### Relationship to Other Stories

- **Story 3-7 (Gatekeeper Boss Encounter):** DONE. Created the boss entity with vulnerability windows (`bossVulnerable` event), attack phases (barrage/sweep/vulnerable cycle), and the `Boss` abstract base class. This story adds the weapon that exploits those vulnerability windows. The boss is already damageable by Data Lance and Logic Bombs — Virus Payload adds the narrative "kill shot" weapon with massive damage (100 per hit vs 8 for Data Lance bolt).
- **Story 3-9 (Boss Destruction Sequence):** Will implement the peel/strip/shatter `DestructionSequence` animation after the boss is defeated. The `virusPayloadDelivered` event from this story may be useful for triggering narrative reactions during the destruction sequence.
- **Story 3-10 (Phase Transitions):** Will wire BossPhase into the full phase flow. The VirusPayloadSystem should be created/initialized when BossPhase enters and cleaned up when it exits. For now, the system can be standalone — 3-10 will handle lifecycle integration.
- **Stories 3-5 (Logic Bombs) and 3-6 (EMP Burst):** These are the implementation pattern references. VirusPayloadSystem follows the same constructor signature, update loop structure, pool management, and dispose pattern.

### Boss Damage Math Context

During a vulnerability window (4 seconds, per story 3-7):
- **Virus Payload:** 100 damage x ~2 shots (1.5s cooldown) = ~200 damage per window
- **Data Lance:** 8 damage x 2 bolts x ~30 volleys (0.13s cooldown) = ~480 damage per window (if all hit)
- **Logic Bombs:** 40 damage x ~3-4 shots (1.0s cooldown) = ~120-160 damage per window
- **Boss health:** 500 HP with 0.25x damage reduction outside vulnerability
- **Design intent:** Virus Payload is the narrative weapon but NOT the only viable damage source. Players can kill the boss with Data Lance and Logic Bombs alone. Virus Payload is the most efficient damage-per-shot during vulnerability windows and carries narrative weight. The weapon acts as an accelerator, not a requirement.

### Source Tree Components to Touch

| Action | File | Reason |
|--------|------|--------|
| MODIFY | `src/config/constants.ts` | Add VIRUS_PAYLOAD_* constants |
| MODIFY | `src/config/input.ts` | Add 'virusPayload' action mapped to 'KeyC' |
| MODIFY | `src/core/GameEvents.ts` | Add virusPayloadDelivered event |
| CREATE | `src/entities/projectiles/VirusPayload.ts` | Virus Payload projectile entity |
| CREATE | `src/systems/VirusPayloadSystem.ts` | Virus Payload weapon system |
| CREATE | `src/__tests__/VirusPayload.test.ts` | Projectile entity tests |
| CREATE | `src/__tests__/VirusPayloadSystem.test.ts` | Weapon system tests |
| CREATE | `src/__tests__/VirusPayloadInput.test.ts` | Input config tests |
| CREATE | `src/__tests__/VirusPayloadConstants.test.ts` | Constants validation tests |

### Project Structure Notes

- `src/entities/projectiles/VirusPayload.ts` aligns with architecture directory structure (`src/entities/projectiles/` for all projectile types). The architecture lists `VirusPayload.ts` explicitly in this directory.
- `src/systems/VirusPayloadSystem.ts` aligns with the pattern of other weapon systems in `src/systems/` (DataLanceSystem, LogicBombSystem, EMPBurstSystem).
- No new directories needed. All files go into existing directories.

### References

- [Source: _bmad-output/gdd.md#Weapon Systems] Virus Payload: "Mission kill weapon. Phase-specific availability. Single use per target. Lethal (to AI cores). Boss killer — the narrative weapon, literally injecting a virus into the AI."
- [Source: _bmad-output/gdd.md#Controls and Input] "C: Virus Payload (boss-kill weapon)" / "Virus Payload: Deliberate and consequential. This is the kill shot — it should feel like pulling a trigger that matters."
- [Source: _bmad-output/gdd.md#Aiming and Combat] "Boss encounters: Zone-based triggers for Virus Payload delivery windows." / "Boss constructs have exposed core nodes that take increased Virus Payload damage — these are the mission-critical targets."
- [Source: _bmad-output/game-architecture.md#Entity System] `VirusPayload` listed as subclass of `Projectile (abstract)` under `GameObject` hierarchy
- [Source: _bmad-output/game-architecture.md#Input System] `virusPayload` action mapped to C key
- [Source: _bmad-output/game-architecture.md#Collision System] "Boss vulnerability zones: Zone-based triggers for Virus Payload delivery windows."
- [Source: _bmad-output/game-architecture.md#Level/Phase System] "BossPhase — arena orbit, boss attack patterns, Virus Payload delivery"
- [Source: _bmad-output/game-architecture.md#Project Structure] `src/entities/projectiles/VirusPayload.ts` explicitly listed
- [Source: _bmad-output/epics.md#Epic 3 Story 8] "As a player, I can deliver a Virus Payload to the boss core so that the kill mechanic feels narrative and consequential"
- [Source: _bmad-output/implementation-artifacts/3-7-gatekeeper-boss-encounter.md#Relationship to Other Stories] "Story 3-8 (Virus Payload): Will add the Virus Payload weapon mechanic for delivering the killing blow to the boss core during vulnerability windows."
- [Source: _bmad-output/project-context.md#Critical Implementation Rules] Materials via VectorMaterials.create() only, bloom layer on all geometry, entities never import systems, systems never import each other, EventBus communication

### Technical Research Notes (Three.js r183)

- **TorusGeometry** for the double-ring visual: `new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments)` creates the torus. Convert to wireframe via `EdgesGeometry` then `LineSegments` — consistent with all other wireframe geometry in the project.
- **Shared geometry pattern:** Follow `EMPBurst.ts` module-level shared geometry pattern. Create `EdgesGeometry` once, reuse across pool. Dispose only on system disposal.
- **LineSegments (not LineSegments2):** Use standard `LineSegments` with `LineBasicMaterial` for the virus payload — it does not need fat line width. This matches the EMP Burst pattern and keeps draw calls minimal.
- **Spin animation:** Apply `rotation.z += spinRate * dt` to the `Object3D` group containing both rings. Three.js Euler rotation is applied per-frame in `update()`.

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
