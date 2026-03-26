import type { BehaviorParams } from '../ai/BehaviorParams.ts';

export const BLOOM_LAYER = 1;
export const DELTA_TIME_CAP = 1 / 20;
export const MAX_POOL_SIZE = {
  dataLanceBolt: 50,
  enemyDataBurst: 30,
  vectorShard: 200,
  logicBomb: 10,
} as const;

// Data Lance constants (Story 1-5)
export const DATA_LANCE_BOLT_SPEED = 50;
export const DATA_LANCE_FIRE_RATE = 0.13;
export const DATA_LANCE_MAX_RANGE = 90;
export const DATA_LANCE_BOLT_LENGTH = 2.0;
export const DATA_LANCE_POOL_SIZE = 40;
export const RECOIL_INTENSITY = 0.06;
export const RECOIL_RECOVERY_SPEED = 12.0;

// Collision/Damage constants (Story 2-3)
// Sentinel (30 HP) / 8 dmg = ~4 hits to kill. Twin bolts + 0.13s cooldown = fast kill on accurate fire
export const DATA_LANCE_BOLT_DAMAGE = 8;

// Environment constants (Story 1-6)
export const GRID_SIZE = 200;
export const GRID_DIVISIONS = 40;
export const GRID_Y_POSITION = -2.0;
export const STARFIELD_COUNT = 800;
export const STARFIELD_SPREAD = 400;
export const STARFIELD_MIN_Y = -50;
export const STARFIELD_POINT_SIZE = 2.0;
export const GRID_LIGHTNESS_OFFSET = -0.15;
export const STARFIELD_LIGHTNESS_OFFSET = -0.25;

// Viewport banking constants
export const BANK_MAX_ANGLE = 0.12; // radians (~7 degrees)
export const BANK_LERP_SPEED = 6.0; // how fast the bank rolls in/out

// Rail movement constants (Story 2-1)
export const RAIL_SPEED = 18; // units per second along arc length -- comfortable dogfight pace
export const RAIL_CAMERA_LERP_SPEED = 5.0; // how fast camera orientation interpolates toward tangent

// Dogfight-phase rail path: wide sweeping loop through open cyberspace
// 11 control points forming a closed loop, ~+-115 X/Z, gentle Y variation
// Path length ~624 units → ~35 second loop at 18 u/s (within AC #19 30-60s range)
export const RAIL_PATH_POINTS: readonly [number, number, number][] = [
  [0, 0, 0],
  [50, 3, -40],
  [100, 5, -15],
  [115, 2, 40],
  [80, -2, 80],
  [25, -3, 90],
  [-40, 0, 65],
  [-80, 4, 25],
  [-90, 6, -25],
  [-65, 3, -65],
  [-25, 0, -50],
] as const;

// Sentinel enemy defaults (Story 2-2)
export const SENTINEL_BEHAVIOR_LEVEL1: BehaviorParams = {
  patrolSpeed: 1.0,
  attackCooldown: 2.0,
  evasionChance: 0.0,
  movementRandomness: 0.0,
  attackDamage: 10,
  projectileSpeed: 15,
};
export const SENTINEL_COLLIDER_RADIUS = 1.5;
export const SENTINEL_HEALTH = 30;
export const SENTINEL_SCORE_VALUE = 100;

// Spawn event definitions (Story 2-2)
// Hardcoded for now -- JSON loading comes later with LevelManager
export interface SpawnEvent {
  railProgress: number;  // 0-1, trigger point on rail
  enemyType: 'sentinel'; // Extend later: 'watchdog' | 'gatekeeper' | 'overseer'
  position: [number, number, number]; // world-space spawn position
  count: number;          // how many to spawn
}

export const SPAWN_EVENTS: SpawnEvent[] = [
  // Wave 1: ~10% into the loop (3-4 seconds in)
  { railProgress: 0.10, enemyType: 'sentinel', position: [60, 5, -20], count: 3 },
  // Wave 2: ~35% into the loop
  { railProgress: 0.35, enemyType: 'sentinel', position: [-30, 3, 60], count: 3 },
  // Wave 3: ~60% into the loop
  { railProgress: 0.60, enemyType: 'sentinel', position: [-70, 4, -10], count: 2 },
  // Wave 4: ~85% into the loop
  { railProgress: 0.85, enemyType: 'sentinel', position: [30, 2, -55], count: 3 },
];

// Vector shard explosion constants (Story 2-4)
export const SHARD_COUNT = 10;           // shards per explosion
export const SHARD_MIN_SPEED = 8;        // units/sec minimum outward velocity
export const SHARD_MAX_SPEED = 18;       // units/sec maximum outward velocity
export const SHARD_MIN_LIFETIME = 0.4;   // seconds minimum before fade-out
export const SHARD_MAX_LIFETIME = 0.8;   // seconds maximum before fade-out
export const SHARD_LENGTH = 0.5;         // length of each shard line segment
export const MAX_ACTIVE_EXPLOSIONS = 12; // max concurrent explosions (pre-allocated pool)

// Enemy data burst constants (Story 2-5)
export const ENEMY_DATA_BURST_POOL_SIZE = 30;
export const ENEMY_DATA_BURST_LENGTH = 0.8;       // line segment length (units)
export const ENEMY_DATA_BURST_MAX_RANGE = 80;      // deactivate beyond this distance
export const ENEMY_DATA_BURST_COLLIDER_RADIUS = 0.3; // sphere for hit detection

// Player constants (Story 2-5)
export const PLAYER_MAX_SHIELDS = 100;
export const PLAYER_COLLIDER_RADIUS = 1.0;

// Attack state constants (Story 2-5)
export const ATTACK_STATE_PATROL_DURATION = 3.0; // seconds in patrol before attacking

// HUD constants (Story 2-6)
export const HUD_SHIELD_BAR_WIDTH = 0.3;       // total width in camera-local units
export const HUD_SHIELD_BAR_HEIGHT = 0.04;      // total height in camera-local units
export const HUD_SCORE_DIGIT_WIDTH = 0.06;      // width of each seven-segment digit
export const HUD_SCORE_DIGIT_HEIGHT = 0.09;     // height of each seven-segment digit
export const HUD_SCORE_DIGIT_SPACING = 0.02;    // gap between digits
export const HUD_SCORE_MAX_DIGITS = 6;          // max displayable digits (999999)
export const HUD_Z_DEPTH = -1.5;                // z position in camera-local space

// Viewport movement constants (Story 1-4)
export const VIEWPORT_MOVE_SPEED = 3.0;
export const VIEWPORT_MAX_OFFSET_X = 3.0;
export const VIEWPORT_MAX_OFFSET_Y_UP = 2.5;
export const VIEWPORT_MAX_OFFSET_Y_DOWN = 1.2;
export const VIEWPORT_BASE_POSITION = { x: 0, y: 0, z: 3 } as const;
