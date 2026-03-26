# Story 2.6: Shields HUD Display

Status: done

## Story

As a player,
I want to see my shields on the HUD,
so that I know my current health status.

## Acceptance Criteria

1. A `ShieldBar` class exists at `src/ui/hud/ShieldBar.ts` that renders a horizontal shield bar as vector line geometry (Three.js `LineSegments`) parented to the camera, visible in the cockpit view
2. The shield bar consists of two parts: an outer border (always visible) and an inner fill bar whose width scales proportionally to `player.shields / player.maxShields` (0% to 100%)
3. The shield bar is positioned in the bottom-left area of the cockpit view (not overlapping the actuator arms or cockpit frame), at approximately `x: -0.85, y: -0.42, z: -1.5` in camera-local space (adjust as needed for visual clarity)
4. Both the outer border and inner fill use materials created via `VectorMaterials.create()` for palette compliance -- the fill bar uses the base palette lightness and the border uses a dimmer lightness offset (e.g., -0.15)
5. Both the outer border and inner fill meshes have bloom layer enabled (`mesh.layers.enable(BLOOM_LAYER)`) so the shield bar glows through the selective bloom pipeline
6. The shield bar updates its fill width dynamically by subscribing to `shieldChanged` events on the EventBus -- it does NOT import or reference the `Player` entity directly
7. A `shieldChanged` event is added to `GameEvents.ts` with payload `{ shields: number; maxShields: number }` -- the `Player` class emits this event whenever shields change (on damage, on initialization)
8. The `Player.takeDamage()` method emits `shieldChanged` after reducing shields; `Player` constructor emits `shieldChanged` on initialization so the HUD gets the starting value
9. The inner fill bar width is updated by modifying the `position` attribute of its `BufferGeometry` and setting `needsUpdate = true` -- no geometry recreation per frame
10. A `ScoreDisplay` class exists at `src/ui/hud/ScoreDisplay.ts` that renders the current score as vector-line digit characters (Seven-segment display style using `LineSegments`) parented to the camera
11. The `ScoreDisplay` is positioned in the bottom-right area of the cockpit view at approximately `x: 0.55, y: -0.42, z: -1.5` in camera-local space
12. `ScoreDisplay` uses a seven-segment style digit renderer where each digit 0-9 is defined as a set of line segment pairs -- characters are approximately 0.06 units wide and 0.09 units tall, with 0.02 unit spacing between digits
13. `ScoreDisplay` subscribes to `scoreChanged` events on the EventBus -- it does NOT import `ScoreManager` directly
14. A `scoreChanged` event is added to `GameEvents.ts` with payload `{ score: number; delta: number }` matching the architecture spec
15. A `ScoreManager` class exists at `src/systems/ScoreManager.ts` that tracks the current score, subscribes to `enemyDestroyed` events, adds the enemy's `scoreValue` to the running total, and emits `scoreChanged` events
16. `ScoreDisplay` renders up to 6 digits (max display: 999999) with leading-zero suppression (displays "0" for zero, "100" for 100, not "000100")
17. `ScoreDisplay` materials use `VectorMaterials.create()` and meshes have `mesh.layers.enable(BLOOM_LAYER)`
18. A `WeaponIndicator` class exists at `src/ui/hud/WeaponIndicator.ts` that renders a small vector icon indicating the currently active weapon, positioned between the shield bar and score display at approximately `x: 0.0, y: -0.42, z: -1.5`
19. `WeaponIndicator` displays a simple vector icon for Data Lance (the only weapon available in Epic 2) -- a small line-segment shape representing the weapon
20. `WeaponIndicator` materials use `VectorMaterials.create()` and meshes have `mesh.layers.enable(BLOOM_LAYER)`
21. A `HUDManager` class exists at `src/ui/hud/HUDManager.ts` that creates and owns all HUD components (`ShieldBar`, `ScoreDisplay`, `WeaponIndicator`), parents them to the camera, and provides a `dispose()` method
22. `HUDManager` constructor receives `camera`, `vectorMaterials`, and `eventBus` (or uses the singleton eventBus) -- it creates all HUD components and adds them to a camera-parented `THREE.Group`
23. New constants in `src/config/constants.ts`:
    - `HUD_SHIELD_BAR_WIDTH = 0.3` (total width of shield bar in camera-local units)
    - `HUD_SHIELD_BAR_HEIGHT = 0.04` (total height of shield bar)
    - `HUD_SCORE_DIGIT_WIDTH = 0.06` (width of each seven-segment digit)
    - `HUD_SCORE_DIGIT_HEIGHT = 0.09` (height of each seven-segment digit)
    - `HUD_SCORE_DIGIT_SPACING = 0.02` (gap between digits)
    - `HUD_SCORE_MAX_DIGITS = 6`
    - `HUD_Z_DEPTH = -1.5` (z position in camera-local space, same plane as cockpit)
24. Running `npm run build` produces a clean production build with zero TypeScript errors
25. Unit tests exist for: `ShieldBar` class construction and method exports, `ScoreDisplay` class construction and method exports, `WeaponIndicator` class construction and method exports, `HUDManager` class construction and method exports, `ScoreManager` class construction and method exports, new constant validation, `shieldChanged` and `scoreChanged` event type existence
26. All existing 446 tests continue to pass -- zero regressions
27. Frame rate remains at 60 FPS stable -- HUD is static geometry with attribute updates only on events (not per-frame), adding <5 draw calls
28. The HUD is visible during gameplay: shield bar fills/depletes as the player takes damage, score increments when enemies are destroyed, weapon icon is visible

## Tasks / Subtasks

- [x] Task 1: Add new constants to `src/config/constants.ts` (AC: #23)
  - [x] 1.1 Add HUD constants:
    ```typescript
    // HUD constants (Story 2-6)
    export const HUD_SHIELD_BAR_WIDTH = 0.3;       // total width in camera-local units
    export const HUD_SHIELD_BAR_HEIGHT = 0.04;      // total height in camera-local units
    export const HUD_SCORE_DIGIT_WIDTH = 0.06;      // width of each seven-segment digit
    export const HUD_SCORE_DIGIT_HEIGHT = 0.09;     // height of each seven-segment digit
    export const HUD_SCORE_DIGIT_SPACING = 0.02;    // gap between digits
    export const HUD_SCORE_MAX_DIGITS = 6;          // max displayable digits (999999)
    export const HUD_Z_DEPTH = -1.5;                // z position in camera-local space
    ```
  - [x] 1.2 Do NOT modify existing constants -- only add new ones

- [x] Task 2: Add `shieldChanged` and `scoreChanged` events to `src/core/GameEvents.ts` (AC: #7, #14)
  - [x] 2.1 Add the event interfaces:
    ```typescript
    export interface ShieldChangedEvent {
      shields: number;
      maxShields: number;
    }

    export interface ScoreChangedEvent {
      score: number;
      delta: number;
    }
    ```
  - [x] 2.2 Add both events to the `GameEvents` interface:
    ```typescript
    export interface GameEvents {
      weaponFired: WeaponFiredEvent;
      enemySpawned: { enemy: Enemy; position: { x: number; y: number; z: number } };
      enemyDestroyed: { enemy: Enemy; position: { x: number; y: number; z: number } };
      playerHit: PlayerHitEvent;
      shieldChanged: ShieldChangedEvent;   // NEW (Story 2-6)
      scoreChanged: ScoreChangedEvent;     // NEW (Story 2-6)
    }
    ```
  - [x] 2.3 Do NOT modify existing event types -- only add the new ones

- [x] Task 3: Modify `Player` to emit `shieldChanged` events (AC: #7, #8)
  - [x] 3.1 In `Player.constructor()`, after setting initial shields, emit the event:
    ```typescript
    eventBus.emit('shieldChanged', {
      shields: this.shields,
      maxShields: this.maxShields,
    });
    ```
  - [x] 3.2 In `Player.takeDamage()`, after clamping shields, emit the event:
    ```typescript
    eventBus.emit('shieldChanged', {
      shields: this.shields,
      maxShields: this.maxShields,
    });
    ```
  - [x] 3.3 Do NOT change the `takeDamage` signature or behavior -- only add the event emission after existing logic
  - [x] 3.4 Do NOT add any imports beyond what already exists (eventBus is already imported)

- [x] Task 4: Create `ShieldBar` at `src/ui/hud/ShieldBar.ts` (AC: #1, #2, #3, #4, #5, #6, #9)
  - [x] 4.1 Create the directory `src/ui/hud/` if it doesn't exist
  - [x] 4.2 Create the shield bar class:
    ```typescript
    import * as THREE from 'three';
    import { BLOOM_LAYER, HUD_SHIELD_BAR_WIDTH, HUD_SHIELD_BAR_HEIGHT } from '../../config/constants.ts';
    import { eventBus } from '../../core/GameEvents.ts';
    import type { VectorMaterials } from '../../rendering/VectorMaterials.ts';

    export class ShieldBar {
      public readonly group: THREE.Group;
      private fillPositions: Float32Array;
      private fillGeometry: THREE.BufferGeometry;
      private fullWidth: number;

      constructor(vectorMaterials: VectorMaterials) {
        this.group = new THREE.Group();
        this.fullWidth = HUD_SHIELD_BAR_WIDTH;
        const h = HUD_SHIELD_BAR_HEIGHT;
        const w = HUD_SHIELD_BAR_WIDTH;

        // --- Outer border (static, dimmer) ---
        const borderPositions = new Float32Array([
          // bottom-left to bottom-right
          0, 0, 0,       w, 0, 0,
          // bottom-right to top-right
          w, 0, 0,       w, h, 0,
          // top-right to top-left
          w, h, 0,       0, h, 0,
          // top-left to bottom-left
          0, h, 0,       0, 0, 0,
        ]);
        const borderGeom = new THREE.BufferGeometry();
        borderGeom.setAttribute('position', new THREE.BufferAttribute(borderPositions, 3));
        const borderMat = vectorMaterials.create('hud-shield-border', -0.15);
        const borderMesh = new THREE.LineSegments(borderGeom, borderMat);
        borderMesh.layers.enable(BLOOM_LAYER);
        this.group.add(borderMesh);

        // --- Inner fill bar (dynamic width) ---
        // Inset slightly from border
        const inset = h * 0.15;
        this.fillPositions = new Float32Array([
          // bottom-left to bottom-right
          inset, inset, 0,         w - inset, inset, 0,
          // bottom-right to top-right
          w - inset, inset, 0,     w - inset, h - inset, 0,
          // top-right to top-left
          w - inset, h - inset, 0, inset, h - inset, 0,
          // top-left to bottom-left
          inset, h - inset, 0,     inset, inset, 0,
        ]);
        this.fillGeometry = new THREE.BufferGeometry();
        this.fillGeometry.setAttribute(
          'position',
          new THREE.BufferAttribute(this.fillPositions, 3),
        );
        const fillMat = vectorMaterials.create('hud-shield-fill');
        const fillMesh = new THREE.LineSegments(this.fillGeometry, fillMat);
        fillMesh.layers.enable(BLOOM_LAYER);
        this.group.add(fillMesh);

        // Subscribe to shield changes
        eventBus.on('shieldChanged', ({ shields, maxShields }) => {
          this.updateFill(shields / maxShields);
        });
      }

      /**
       * Updates the fill bar width to match the shield percentage (0-1).
       * Modifies position attribute in-place -- no geometry recreation.
       */
      updateFill(percent: number): void {
        const p = Math.max(0, Math.min(1, percent));
        const h = HUD_SHIELD_BAR_HEIGHT;
        const inset = h * 0.15;
        const fillRight = inset + (this.fullWidth - 2 * inset) * p;

        // Update X coordinates of right-side vertices (indices 1, 2, 3, 4 -- the vertices at fillRight)
        // Vertex layout: 8 vertices, pairs forming 4 line segments
        // [0] bottom-left, [1] bottom-right, [2] bottom-right, [3] top-right,
        // [4] top-right, [5] top-left, [6] top-left, [7] bottom-left
        this.fillPositions[3] = fillRight;   // vertex 1 x (bottom-right)
        this.fillPositions[6] = fillRight;   // vertex 2 x (bottom-right, start of right edge)
        this.fillPositions[9] = fillRight;   // vertex 3 x (top-right)
        this.fillPositions[12] = fillRight;  // vertex 4 x (top-right, start of top edge)

        const posAttr = this.fillGeometry.getAttribute('position');
        (posAttr as THREE.BufferAttribute).needsUpdate = true;
      }
    }
    ```
  - [x] 4.3 CRITICAL: `ShieldBar` does NOT import `Player` -- it subscribes to `shieldChanged` events only
  - [x] 4.4 The fill bar uses in-place attribute mutation (`needsUpdate = true`) -- no geometry recreation
  - [x] 4.5 Both border and fill meshes use `VectorMaterials.create()` with unique IDs and have `BLOOM_LAYER` enabled

- [x] Task 5: Create seven-segment digit data and `ScoreDisplay` at `src/ui/hud/ScoreDisplay.ts` (AC: #10, #11, #12, #13, #16, #17)
  - [x] 5.1 Define seven-segment digit geometry data. Each digit 0-9 is an array of line segment pairs. Segments are labeled: top(a), top-right(b), bottom-right(c), bottom(d), bottom-left(e), top-left(f), middle(g). Each segment is a pair of (x1,y1, x2,y2) in normalized 0-1 space:
    ```typescript
    // Seven-segment display layout (normalized 0-1):
    //  ___a___
    // |       |
    // f       b
    // |___g___|
    // |       |
    // e       c
    // |___d___|
    //
    // Segment positions (x1, y1, x2, y2) relative to digit origin:
    const SEGMENTS = {
      a: [0.1, 1.0, 0.9, 1.0],   // top horizontal
      b: [0.9, 0.55, 0.9, 1.0],  // top-right vertical
      c: [0.9, 0.0, 0.9, 0.45],  // bottom-right vertical
      d: [0.1, 0.0, 0.9, 0.0],   // bottom horizontal
      e: [0.1, 0.0, 0.1, 0.45],  // bottom-left vertical
      f: [0.1, 0.55, 0.1, 1.0],  // top-left vertical
      g: [0.1, 0.5, 0.9, 0.5],   // middle horizontal
    };

    // Which segments are active for each digit:
    const DIGIT_SEGMENTS: Record<number, string[]> = {
      0: ['a', 'b', 'c', 'd', 'e', 'f'],
      1: ['b', 'c'],
      2: ['a', 'b', 'd', 'e', 'g'],
      3: ['a', 'b', 'c', 'd', 'g'],
      4: ['b', 'c', 'f', 'g'],
      5: ['a', 'c', 'd', 'f', 'g'],
      6: ['a', 'c', 'd', 'e', 'f', 'g'],
      7: ['a', 'b', 'c'],
      8: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
      9: ['a', 'b', 'c', 'd', 'f', 'g'],
    };
    ```
  - [x] 5.2 Create the `ScoreDisplay` class:
    ```typescript
    export class ScoreDisplay {
      public readonly group: THREE.Group;
      private digitMeshes: THREE.LineSegments[];
      private currentScore = 0;

      constructor(vectorMaterials: VectorMaterials) {
        this.group = new THREE.Group();
        this.digitMeshes = [];

        // Pre-allocate digit meshes for max digits
        // Each digit gets its own LineSegments mesh with enough vertex buffer
        // for all 7 segments (7 segments x 2 vertices x 3 floats = 42 floats)
        const material = vectorMaterials.create('hud-score');
        for (let i = 0; i < HUD_SCORE_MAX_DIGITS; i++) {
          const geometry = new THREE.BufferGeometry();
          const positions = new Float32Array(42); // 7 segments max
          geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
          const mesh = new THREE.LineSegments(geometry, material);
          mesh.layers.enable(BLOOM_LAYER);
          mesh.position.x = i * (HUD_SCORE_DIGIT_WIDTH + HUD_SCORE_DIGIT_SPACING);
          mesh.visible = false;
          this.group.add(mesh);
          this.digitMeshes.push(mesh);
        }

        // Subscribe to score changes
        eventBus.on('scoreChanged', ({ score }) => {
          this.updateScore(score);
        });

        // Display initial "0"
        this.updateScore(0);
      }

      updateScore(score: number): void {
        this.currentScore = Math.min(score, 999999);
        const scoreStr = String(this.currentScore);

        // Hide all digits first
        for (const mesh of this.digitMeshes) {
          mesh.visible = false;
        }

        // Right-align: display digits from right to left
        const startIndex = HUD_SCORE_MAX_DIGITS - scoreStr.length;
        for (let i = 0; i < scoreStr.length; i++) {
          const digitValue = parseInt(scoreStr[i], 10);
          const meshIndex = startIndex + i;
          this.renderDigit(meshIndex, digitValue);
          this.digitMeshes[meshIndex].visible = true;
        }
      }

      private renderDigit(meshIndex: number, digit: number): void {
        const segments = DIGIT_SEGMENTS[digit];
        const positions = this.digitMeshes[meshIndex].geometry
          .getAttribute('position') as THREE.BufferAttribute;
        const arr = positions.array as Float32Array;

        // Fill segment line pairs
        let idx = 0;
        for (const segName of segments) {
          const seg = SEGMENTS[segName as keyof typeof SEGMENTS];
          arr[idx++] = seg[0] * HUD_SCORE_DIGIT_WIDTH;
          arr[idx++] = seg[1] * HUD_SCORE_DIGIT_HEIGHT;
          arr[idx++] = 0;
          arr[idx++] = seg[2] * HUD_SCORE_DIGIT_WIDTH;
          arr[idx++] = seg[3] * HUD_SCORE_DIGIT_HEIGHT;
          arr[idx++] = 0;
        }
        // Zero out remaining positions
        while (idx < 42) {
          arr[idx++] = 0;
        }
        positions.needsUpdate = true;

        // Update draw range to only render active segments
        this.digitMeshes[meshIndex].geometry.setDrawRange(0, segments.length * 2);
      }
    }
    ```
  - [x] 5.3 CRITICAL: `ScoreDisplay` does NOT import `ScoreManager` -- it subscribes to `scoreChanged` events only
  - [x] 5.4 Uses `setDrawRange()` to avoid rendering zeroed-out segments
  - [x] 5.5 Pre-allocates all digit meshes at construction -- no per-update allocations

- [x] Task 6: Create `WeaponIndicator` at `src/ui/hud/WeaponIndicator.ts` (AC: #18, #19, #20)
  - [x] 6.1 Create a simple vector icon for the Data Lance weapon:
    ```typescript
    export class WeaponIndicator {
      public readonly group: THREE.Group;

      constructor(vectorMaterials: VectorMaterials) {
        this.group = new THREE.Group();

        // Simple Data Lance icon: a small crosshair/bolt shape
        // Two crossed lines + a center dot indicator
        const iconSize = 0.04;
        const positions = new Float32Array([
          // Vertical line (bolt shape)
          0, -iconSize, 0,    0, iconSize, 0,
          // Horizontal tick marks
          -iconSize * 0.5, 0, 0,    iconSize * 0.5, 0, 0,
          // Arrowhead / forward indicator
          -iconSize * 0.3, iconSize * 0.6, 0,    0, iconSize, 0,
          iconSize * 0.3, iconSize * 0.6, 0,     0, iconSize, 0,
        ]);

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = vectorMaterials.create('hud-weapon-indicator');
        const mesh = new THREE.LineSegments(geometry, material);
        mesh.layers.enable(BLOOM_LAYER);
        this.group.add(mesh);
      }
    }
    ```
  - [x] 6.2 For Epic 2, only the Data Lance icon is needed. Future stories can add weapon switching

- [x] Task 7: Create `ScoreManager` at `src/systems/ScoreManager.ts` (AC: #15)
  - [x] 7.1 Create the score manager:
    ```typescript
    import { eventBus } from '../core/GameEvents.ts';
    import { Logger } from '../core/Logger.ts';

    export class ScoreManager {
      private score = 0;

      constructor() {
        // Subscribe to enemy destruction events
        eventBus.on('enemyDestroyed', ({ enemy }) => {
          this.addScore(enemy.scoreValue);
        });

        // Emit initial score
        eventBus.emit('scoreChanged', { score: 0, delta: 0 });

        Logger.info('ScoreManager', 'Score manager initialized');
      }

      addScore(points: number): void {
        const prevScore = this.score;
        this.score += points;
        eventBus.emit('scoreChanged', { score: this.score, delta: points });
        Logger.debug('ScoreManager', 'Score updated', {
          score: this.score,
          delta: points,
        });
      }

      getScore(): number {
        return this.score;
      }

      reset(): void {
        this.score = 0;
        eventBus.emit('scoreChanged', { score: 0, delta: 0 });
      }
    }
    ```
  - [x] 7.2 `ScoreManager` subscribes to `enemyDestroyed` and accesses `enemy.scoreValue` from the event payload
  - [x] 7.3 `ScoreManager` does NOT import `CollisionSystem`, `EnemySpawner`, or any other system -- it only uses EventBus
  - [x] 7.4 Verify that the `Enemy` class exposes a `scoreValue` property (added in Story 2-2 as part of Sentinel setup with `SENTINEL_SCORE_VALUE = 100`)

- [x] Task 8: Create `HUDManager` at `src/ui/hud/HUDManager.ts` (AC: #21, #22)
  - [x] 8.1 Create the HUD orchestrator:
    ```typescript
    import * as THREE from 'three';
    import { HUD_Z_DEPTH } from '../../config/constants.ts';
    import type { VectorMaterials } from '../../rendering/VectorMaterials.ts';
    import { ShieldBar } from './ShieldBar.ts';
    import { ScoreDisplay } from './ScoreDisplay.ts';
    import { WeaponIndicator } from './WeaponIndicator.ts';

    export class HUDManager {
      private hudGroup: THREE.Group;
      private shieldBar: ShieldBar;
      private scoreDisplay: ScoreDisplay;
      private weaponIndicator: WeaponIndicator;

      constructor(camera: THREE.PerspectiveCamera, vectorMaterials: VectorMaterials) {
        this.hudGroup = new THREE.Group();
        this.hudGroup.position.z = HUD_Z_DEPTH;

        // Shield bar -- bottom-left
        this.shieldBar = new ShieldBar(vectorMaterials);
        this.shieldBar.group.position.set(-0.85, -0.42, 0);
        this.hudGroup.add(this.shieldBar.group);

        // Score display -- bottom-right
        this.scoreDisplay = new ScoreDisplay(vectorMaterials);
        this.scoreDisplay.group.position.set(0.55, -0.42, 0);
        this.hudGroup.add(this.scoreDisplay.group);

        // Weapon indicator -- bottom-center
        this.weaponIndicator = new WeaponIndicator(vectorMaterials);
        this.weaponIndicator.group.position.set(0.0, -0.42, 0);
        this.hudGroup.add(this.weaponIndicator.group);

        // Parent to camera so HUD follows the view
        camera.add(this.hudGroup);
      }

      dispose(): void {
        this.hudGroup.parent?.remove(this.hudGroup);
      }
    }
    ```
  - [x] 8.2 HUDManager parents the entire hudGroup to the camera at `HUD_Z_DEPTH` (-1.5), same Z plane as the cockpit group
  - [x] 8.3 The cockpit group is at `z: -1.5` (see CockpitRenderer.ts line 30). The HUD group uses the same Z depth. Position X/Y coordinates to avoid overlapping the cockpit frame and actuator arms
  - [x] 8.4 HUDManager does NOT have an `update(dt)` method -- all HUD updates are event-driven, not per-frame

- [x] Task 9: Wire up `HUDManager` and `ScoreManager` in `main.ts` (AC: #28)
  - [x] 9.1 Add imports:
    ```typescript
    import { HUDManager } from './ui/hud/HUDManager.ts';
    import { ScoreManager } from './systems/ScoreManager.ts';
    ```
  - [x] 9.2 Create instances after camera and vectorMaterials are set up, and after Player is created:
    ```typescript
    // --- Score Manager Setup (Story 2-6) ---
    const scoreManager = new ScoreManager();

    // --- HUD Setup (Story 2-6) ---
    const hudManager = new HUDManager(camera, vectorMaterials);
    ```
  - [x] 9.3 `ScoreManager` must be created BEFORE `HUDManager` so that when `HUDManager` creates `ScoreDisplay` (which subscribes to `scoreChanged`), the initial `scoreChanged` event from `ScoreManager` constructor has already fired. Alternatively, `ScoreDisplay` shows "0" by default in its constructor, which is acceptable.
  - [x] 9.4 `HUDManager` must be created AFTER `Player` so that the initial `shieldChanged` event from `Player` constructor can be received by the `ShieldBar` (if `ShieldBar` subscribes before `Player` emits). NOTE: Since `Player` is already created before this point and emits in its constructor, `ShieldBar` may miss the initial event. To handle this, either:
    - Option A: `ShieldBar` initializes with 100% fill (the default) and relies on `shieldChanged` for subsequent updates -- this is the simplest approach
    - Option B: `Player` exposes a method to re-emit the current shield state
    - **Use Option A** -- it's simpler and correct since shields start full
  - [x] 9.5 The animation loop does NOT need any HUD update calls -- all HUD updates are event-driven
  - [x] 9.6 `scoreManager` and `hudManager` variables exist in module scope for lifecycle management; they are not called in the animation loop

- [x] Task 10: Write tests (AC: #25, #26)
  - [x] 10.1 Create `src/__tests__/ShieldBar.test.ts`:
    - Test: `ShieldBar` is exported as a class from `src/ui/hud/ShieldBar.ts`
    - Test: `ShieldBar` has a `group` property (THREE.Group)
    - Test: `ShieldBar` prototype has `updateFill` method
  - [x] 10.2 Create `src/__tests__/ScoreDisplay.test.ts`:
    - Test: `ScoreDisplay` is exported as a class from `src/ui/hud/ScoreDisplay.ts`
    - Test: `ScoreDisplay` has a `group` property
    - Test: `ScoreDisplay` prototype has `updateScore` method
  - [x] 10.3 Create `src/__tests__/WeaponIndicator.test.ts`:
    - Test: `WeaponIndicator` is exported as a class from `src/ui/hud/WeaponIndicator.ts`
    - Test: `WeaponIndicator` has a `group` property
  - [x] 10.4 Create `src/__tests__/HUDManager.test.ts`:
    - Test: `HUDManager` is exported as a class from `src/ui/hud/HUDManager.ts`
    - Test: `HUDManager` prototype has `dispose` method
  - [x] 10.5 Create `src/__tests__/ScoreManager.test.ts`:
    - Test: `ScoreManager` is exported as a class from `src/systems/ScoreManager.ts`
    - Test: `ScoreManager` prototype has `addScore` method
    - Test: `ScoreManager` prototype has `getScore` method
    - Test: `ScoreManager` prototype has `reset` method
  - [x] 10.6 Create `src/__tests__/HUDConstants.test.ts`:
    - Test: `HUD_SHIELD_BAR_WIDTH` is a positive number
    - Test: `HUD_SHIELD_BAR_HEIGHT` is a positive number
    - Test: `HUD_SCORE_DIGIT_WIDTH` is a positive number
    - Test: `HUD_SCORE_DIGIT_HEIGHT` is a positive number
    - Test: `HUD_SCORE_DIGIT_SPACING` is a positive number
    - Test: `HUD_SCORE_MAX_DIGITS` is a positive integer
    - Test: `HUD_Z_DEPTH` is a negative number
  - [x] 10.7 Add to existing `src/__tests__/EventBus.test.ts` (or create separate):
    - Test: `GameEvents` interface includes `shieldChanged` with `shields` and `maxShields` fields
    - Test: `GameEvents` interface includes `scoreChanged` with `score` and `delta` fields
  - [x] 10.8 Follow existing test patterns: `vitest` with `describe`/`it`/`expect`, prototype checks for classes, config value validation
  - [x] 10.9 Run all tests -- verify 446 existing tests pass plus new tests, zero regressions

- [x] Task 11: Visual verification and performance validation (AC: #24, #27, #28)
  - [x] 11.1 Run `npm run build` -- verify clean production build with zero TypeScript errors
  - [x] 11.2 Run `npm run dev` -- visual verification:
    - Shield bar is visible in the bottom-left of the cockpit view, glowing green
    - Shield bar border is visible as a slightly dimmer rectangle
    - Shield bar fill depletes when player takes damage from enemy data bursts
    - Score display shows "0" initially in the bottom-right
    - Score increments by 100 when a Sentinel is destroyed
    - Weapon indicator icon is visible in the bottom-center
    - HUD elements do NOT overlap the cockpit actuator arms or frame
    - HUD elements have phosphor glow (bloom) matching the vector aesthetic
    - All previous functionality works: rail movement, enemy spawning, data lance firing, collisions, explosions, enemy data bursts, damage
  - [x] 11.3 Verify 60 FPS stable with HUD elements present
  - [x] 11.4 Verify HUD updates are responsive (shield bar changes immediately on hit, score changes immediately on kill)
  - [x] 11.5 If HUD positions overlap with cockpit elements, adjust X/Y coordinates in `HUDManager` constructor until the layout is clean. The exact pixel-perfect positioning is less important than avoiding overlaps.

## Dev Notes

### Architecture Compliance

- **`ShieldBar` at `src/ui/hud/ShieldBar.ts`** -- matches architecture: HUD components in `src/ui/hud/` [Source: game-architecture.md#Directory Structure: `src/ui/hud/ShieldBar.ts`]
- **`ScoreDisplay` at `src/ui/hud/ScoreDisplay.ts`** -- matches architecture: `src/ui/hud/ScoreDisplay.ts` [Source: game-architecture.md#Directory Structure]
- **`WeaponIndicator` at `src/ui/hud/WeaponIndicator.ts`** -- matches architecture: `src/ui/hud/WeaponIndicator.ts` [Source: game-architecture.md#Directory Structure]
- **`HUDManager` at `src/ui/hud/HUDManager.ts`** -- matches architecture: `src/ui/hud/HUDManager.ts` — "HUD update orchestration" [Source: game-architecture.md#System Location Mapping]
- **`ScoreManager` at `src/systems/ScoreManager.ts`** -- matches architecture: `src/systems/ScoreManager.ts` — "Score tracking, high score persistence" [Source: game-architecture.md#System Location Mapping]
- **UI never imports game logic** -- HUD components subscribe to events only, never reach into entity or system state [Source: project-context.md#Architecture Rules]
- **Systems never import each other** -- ScoreManager subscribes to `enemyDestroyed` via EventBus, does NOT import CollisionSystem [Source: project-context.md#Architecture Rules]
- **Materials via `VectorMaterials.create()`** -- NEVER `new LineBasicMaterial()` directly [Source: project-context.md#Critical Rules]
- **Bloom layer enabled** -- `mesh.layers.enable(BLOOM_LAYER)` on all HUD meshes [Source: project-context.md#Critical Rules]
- **Event naming: camelCase verbs** -- `shieldChanged`, `scoreChanged` match architecture event spec [Source: game-architecture.md#Event System]
- **HUD rendered through Three.js bloom pipeline** -- architecture specifies "Three.js rendered (in-game, through bloom pipeline): Shield bar, Score display, Weapon indicator" [Source: game-architecture.md#HUD/UI]
- **No GC pauses** -- pre-allocated geometries, attribute mutation only, no per-frame allocations [Source: project-context.md#Performance Rules]
- **Logging via Logger** -- not `console.log()` [Source: project-context.md#Critical Rules]

### Critical Technical Details

**HUD as camera-parented Three.js geometry (NOT HTML overlay):**

The architecture explicitly states that shield bar, score display, and weapon indicator are "Three.js rendered (in-game, through bloom pipeline)". This means they are THREE.js mesh objects parented to the camera, NOT HTML elements. They go through the selective bloom pipeline and glow like all other vector geometry. HTML/CSS overlay is reserved for menus, briefing screens, comm overlay, and game over screen.

**Camera-parented geometry at z = -1.5:**

The cockpit group (`CockpitRenderer`) is parented to the camera at `z: -1.5` (see CockpitRenderer.ts line 30). The HUD group should use the same Z depth so all cockpit-space elements are on the same plane. Position HUD elements to avoid overlapping the cockpit frame brackets (at `x: +-1.1, y: +-0.55`) and actuator arms (at `x: +-0.5 to +-1.0, y: -0.6 to 0.05`).

**Seven-segment digit rendering approach:**

Rather than using TextGeometry (requires font loading, complex tessellation) or bitmap fonts (breaks vector aesthetic), we define digits as simple seven-segment display patterns using LineSegments. This is authentic to the 1983 arcade aesthetic where scores were rendered as segmented displays. Each digit uses at most 7 line segments (14 vertices, 42 floats). Pre-allocate all digit meshes and toggle visibility / update draw range.

**In-place attribute mutation for shield bar:**

When shield percentage changes, we modify the Float32Array positions directly and set `needsUpdate = true` on the position attribute. This avoids creating new BufferGeometry objects or new Float32Arrays. The GPU re-uploads only the changed attribute -- this is the Three.js recommended pattern for dynamic geometry.

**Event-driven HUD updates (NOT per-frame):**

HUD components subscribe to events and update only when data changes. Shield bar updates on `shieldChanged` (when player takes damage). Score display updates on `scoreChanged` (when enemy is destroyed). This means zero HUD overhead during frames where nothing changes -- much better than per-frame polling.

**Material IDs for VectorMaterials:**

Each HUD component registers unique material IDs: `hud-shield-border`, `hud-shield-fill`, `hud-score`, `hud-weapon-indicator`. These must not collide with existing IDs. Existing material IDs from previous stories: `cockpit-arm-left`, `cockpit-arm-right`, `cockpit-frame`, `grid`, `starfield`, `data-lance-bolt-left`, `data-lance-bolt-right`, `sentinel`, `shard-explosion`, `enemy-data-burst`. Check VectorMaterials duplicate ID detection in dev mode.

**Draw call budget:**

HUD adds approximately 3-5 new draw calls (shield border, shield fill, up to 6 score digit meshes, weapon icon). With current ~20-30 active draw calls, this keeps us well under the 500 draw call budget.

### What NOT to Do

- Do NOT use HTML/CSS for the shield bar, score, or weapon indicator -- these must be Three.js geometry through the bloom pipeline
- Do NOT use `TextGeometry` or bitmap fonts for score display -- use seven-segment line rendering
- Do NOT use `new LineBasicMaterial()` directly -- always `vectorMaterials.create()`
- Do NOT use `console.log()` -- use `Logger.level('System', msg, ctx)`
- Do NOT import `Player` from any HUD component -- use EventBus only
- Do NOT import `ScoreManager` from `ScoreDisplay` -- use EventBus only
- Do NOT import one system from another -- use EventBus
- Do NOT update HUD per-frame -- use event subscriptions
- Do NOT recreate BufferGeometry on each update -- mutate attributes in-place with `needsUpdate = true`
- Do NOT create any new objects in event handlers that fire frequently -- pre-allocate everything
- Do NOT implement high score persistence (localStorage) -- that is Story 5-11
- Do NOT implement screen shake or damage flash -- that is Story 2-7
- Do NOT implement game over state -- that is Story 2-10
- Do NOT implement `playerDied` event -- that is Story 2-10
- Do NOT modify `CockpitRenderer.ts`, `RenderPipeline.ts`, `SceneEnvironment.ts`, `CollisionSystem.ts`, `DataLanceSystem.ts`, `EffectsManager.ts`, `VectorShardExplosion.ts`, `EnemyProjectileSystem.ts`, `EnemySpawner.ts`, `Enemy.ts`, `Sentinel.ts`, `PatrolState.ts`, `AttackState.ts`
- Do NOT add `if (level === X)` checks anywhere

### Performance Considerations

- **Draw calls:** ~5 additional draw calls (shield border + fill + up to 6 digit meshes + weapon icon). Only visible meshes contribute. Well within 500 budget.
- **Attribute updates:** Only on events (damage taken, enemy killed) -- NOT per-frame. Each update is a Float32Array write + `needsUpdate = true` flag. GPU re-upload is <0.01ms.
- **Memory:** Pre-allocated geometries for all HUD elements. ~2 KB total for position buffers. Negligible.
- **No GC pressure:** All meshes pre-allocated at construction. Event handlers use pre-existing arrays. No per-event `new` calls.
- **Material count:** 4 new `LineBasicMaterial` instances registered with `VectorMaterials`. Shared across HUD.

### Previous Story Intelligence (2-5)

**Key patterns from Story 2-5 to preserve:**

- 446 tests currently pass (35 test files) -- new tests must not break any
- `main.ts` animation loop order: viewport -> rail -> banking -> player sync -> spawner -> gameObjects -> dataLance -> collision -> enemyProjectile -> effects -> cockpit -> render. DO NOT modify this order.
- `Player` class is at `src/entities/player/Player.ts` -- has `shields`, `maxShields`, `collider` properties and `takeDamage()`, `syncToCamera()` methods
- `Player.takeDamage()` clamps shields to minimum 0 and logs via `Logger.info()`
- `eventBus` singleton imported from `src/core/GameEvents.ts`
- `VectorMaterials.create(id, lightnessOffset)` creates `LineBasicMaterial` registered for palette transitions -- enforces unique IDs in dev mode
- `VectorMaterials.createFat(id, linewidth, lightnessOffset)` creates `LineMaterial` for fat lines
- `BLOOM_LAYER = 1` in constants
- `Logger` import from `../core/Logger.ts` with `.info()`, `.debug()`, `.warn()` methods
- Test pattern: `vitest` with `describe`/`it`/`expect`, prototype checks for classes, config value validation
- `Enemy` class has `scoreValue` property (set to `SENTINEL_SCORE_VALUE = 100` for Sentinels)
- The `enemyDestroyed` event payload includes `{ enemy: Enemy; position: { x, y, z } }` -- `enemy.scoreValue` is accessible
- Cockpit group position is `(0, -0.1, -1.5)` -- avoid placing HUD elements that overlap with this group's content
- Camera is added to scene at `main.ts` line 51: `scene.add(camera)` -- camera-parented children render correctly

### Project Structure Notes

New files:
- `src/ui/hud/ShieldBar.ts` -- Shield bar HUD component
- `src/ui/hud/ScoreDisplay.ts` -- Seven-segment score display HUD component
- `src/ui/hud/WeaponIndicator.ts` -- Active weapon icon HUD component
- `src/ui/hud/HUDManager.ts` -- HUD orchestration manager
- `src/systems/ScoreManager.ts` -- Score tracking system
- `src/__tests__/ShieldBar.test.ts` -- ShieldBar tests
- `src/__tests__/ScoreDisplay.test.ts` -- ScoreDisplay tests
- `src/__tests__/WeaponIndicator.test.ts` -- WeaponIndicator tests
- `src/__tests__/HUDManager.test.ts` -- HUDManager tests
- `src/__tests__/ScoreManager.test.ts` -- ScoreManager tests
- `src/__tests__/HUDConstants.test.ts` -- HUD constant validation tests

Modified files:
- `src/config/constants.ts` -- Add HUD constants
- `src/core/GameEvents.ts` -- Add `shieldChanged` and `scoreChanged` events
- `src/entities/player/Player.ts` -- Emit `shieldChanged` events on damage and init
- `src/main.ts` -- Create `ScoreManager` and `HUDManager` instances

### References

- [Source: game-architecture.md#HUD/UI] -- "Three.js rendered (in-game, through bloom pipeline): Shield bar, Score display, Weapon indicator"
- [Source: game-architecture.md#Architectural Decision #9] -- "Hybrid — Three.js HUD + HTML/CSS menus. In-game HUD as cockpit geometry through bloom pipeline."
- [Source: game-architecture.md#Event System] -- `playerHit`, `enemyDestroyed`, `scoreChanged` event definitions
- [Source: game-architecture.md#System Location Mapping] -- HUDManager at `src/ui/hud/`, ScoreManager at `src/systems/ScoreManager.ts`
- [Source: game-architecture.md#Directory Structure] -- `src/ui/hud/HUDManager.ts`, `ShieldBar.ts`, `ScoreDisplay.ts`, `WeaponIndicator.ts`
- [Source: gdd.md#Visual Design] -- "Shield bar -- vector line geometry", "Score display -- vector-rendered numbers", "Weapon indicator -- vector icon"
- [Source: epics.md#Epic 2, Story 6] -- "As a player, I can see my shields on the HUD so that I know my current health status"
- [Source: project-context.md#Architecture Rules] -- "UI never imports game logic. HUD and screens subscribe to events, never reach into entity state."
- [Source: project-context.md#Critical Rules] -- "NEVER create materials directly. Always use VectorMaterials.create()"
- [Source: project-context.md#Performance Rules] -- "No GC pauses during gameplay"

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- No debug issues encountered during implementation.

### Completion Notes List

- Implemented all 11 tasks for Shields HUD Display story (2-6).
- Added 7 new HUD constants to `src/config/constants.ts`.
- Added `shieldChanged` and `scoreChanged` events to `GameEvents.ts` with typed payloads.
- Modified `Player` to emit `shieldChanged` on construction and after `takeDamage()`.
- Created `ShieldBar` (vector LineSegments with in-place attribute mutation for fill width).
- Created `ScoreDisplay` (seven-segment digit renderer with pre-allocated meshes and setDrawRange).
- Created `WeaponIndicator` (Data Lance crosshair/bolt icon).
- Created `HUDManager` (orchestrator that parents all HUD components to camera at z=-1.5).
- Created `ScoreManager` (subscribes to `enemyDestroyed`, tracks score, emits `scoreChanged`).
- Wired up `ScoreManager` and `HUDManager` in `main.ts` after Player creation.
- Used `void scoreManager` / `void hudManager` to suppress TypeScript unused variable warnings (event-driven lifecycle, no per-frame calls).
- All materials created via `VectorMaterials.create()` with unique IDs; all meshes have `BLOOM_LAYER` enabled.
- Architecture compliance verified: no cross-system imports, UI subscribes to events only, no direct Player/ScoreManager references from HUD.
- 482 tests passing (446 existing + 32 new + 4 dispose tests from review), zero regressions.
- Clean production build with zero TypeScript errors.
- Code review: Added dispose() methods with event unsubscription and geometry disposal to ShieldBar, ScoreDisplay, WeaponIndicator, ScoreManager, and updated HUDManager.dispose() to propagate disposal to children.

### Change Log

- 2026-03-26: Story 2-6 implementation complete -- Added shields HUD display with ShieldBar, ScoreDisplay, WeaponIndicator, HUDManager, ScoreManager, and supporting events/constants.
- 2026-03-26: Code review fixes -- Added dispose() methods to ShieldBar, ScoreDisplay, WeaponIndicator, ScoreManager with proper event unsubscription and geometry disposal. Updated HUDManager.dispose() to call child dispose methods. Added 4 new dispose test cases. 482 tests passing.

### File List

New files:
- src/ui/hud/ShieldBar.ts
- src/ui/hud/ScoreDisplay.ts
- src/ui/hud/WeaponIndicator.ts
- src/ui/hud/HUDManager.ts
- src/systems/ScoreManager.ts
- src/__tests__/ShieldBar.test.ts
- src/__tests__/ScoreDisplay.test.ts
- src/__tests__/WeaponIndicator.test.ts
- src/__tests__/HUDManager.test.ts
- src/__tests__/ScoreManager.test.ts
- src/__tests__/HUDConstants.test.ts

Modified files:
- src/config/constants.ts (added HUD constants)
- src/core/GameEvents.ts (added shieldChanged, scoreChanged events)
- src/entities/player/Player.ts (emit shieldChanged on init and damage)
- src/main.ts (import and create ScoreManager, HUDManager)
- src/__tests__/EventBus.test.ts (added shieldChanged and scoreChanged event tests)
