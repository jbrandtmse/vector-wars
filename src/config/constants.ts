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
export const SENTINEL_POOL_SIZE = 20;

// Watchdog enemy defaults (Story 3-1)
export const WATCHDOG_BEHAVIOR_LEVEL1: BehaviorParams = {
  patrolSpeed: 1.5,
  attackCooldown: 1.5,
  evasionChance: 0.0,
  movementRandomness: 0.0,
  attackDamage: 12,
  projectileSpeed: 18,
};
export const WATCHDOG_COLLIDER_RADIUS = 1.2;
export const WATCHDOG_HEALTH = 40;
export const WATCHDOG_SCORE_VALUE = 200;
export const WATCHDOG_POOL_SIZE = 10;
export const WATCHDOG_PURSUIT_SPEED_MULTIPLIER = 1.8;
export const WATCHDOG_MIN_ENGAGE_DISTANCE = 8.0;
export const WATCHDOG_ATTACK_INTERVAL = 2.5;

// Gatekeeper enemy defaults (Story 3-2)
export const GATEKEEPER_BEHAVIOR_LEVEL1: BehaviorParams = {
  patrolSpeed: 0.8,
  attackCooldown: 2.5,
  evasionChance: 0.0,
  movementRandomness: 0.0,
  attackDamage: 15,
  projectileSpeed: 12,
};
export const GATEKEEPER_COLLIDER_RADIUS = 2.0;
export const GATEKEEPER_HEALTH = 80;
export const GATEKEEPER_SCORE_VALUE = 300;
export const GATEKEEPER_POOL_SIZE = 6;
export const GATEKEEPER_BLOCK_DISTANCE = 15.0;
export const GATEKEEPER_BLOCK_SPEED_MULTIPLIER = 1.2;
export const GATEKEEPER_LATERAL_SWAY = 2.5;
export const GATEKEEPER_SWAY_FREQUENCY = 0.6;
export const GATEKEEPER_ATTACK_INTERVAL = 3.5;

// Spawn event definitions (Story 2-2, extended Story 3-1, extended Story 3-2, extended Story 3-3)
// Hardcoded for now -- JSON loading comes later with LevelManager
export interface SpawnEvent {
  railProgress: number;  // 0-1, trigger point on rail
  enemyType: 'sentinel' | 'watchdog' | 'gatekeeper' | 'firewallNode' | 'iceTower';
  position: [number, number, number]; // world-space spawn position
  count: number;          // how many to spawn
}

export const SPAWN_EVENTS: SpawnEvent[] = [
  // Wave 1: ~10% into the loop (3-4 seconds in)
  { railProgress: 0.10, enemyType: 'sentinel', position: [60, 5, -20], count: 3 },
  // Watchdog wave 1 (Story 3-1) -- pursuit enemies at different rail points
  { railProgress: 0.25, enemyType: 'watchdog', position: [80, 3, 20], count: 2 },
  // Wave 2: ~35% into the loop
  { railProgress: 0.35, enemyType: 'sentinel', position: [-30, 3, 60], count: 3 },
  // Watchdog wave 2 (Story 3-1)
  { railProgress: 0.50, enemyType: 'watchdog', position: [-50, 4, 40], count: 2 },
  // Gatekeeper wave 1 (Story 3-2) -- blocker enemy that forces sustained engagement
  { railProgress: 0.40, enemyType: 'gatekeeper', position: [30, 3, 50], count: 1 },
  // Wave 3: ~60% into the loop
  { railProgress: 0.60, enemyType: 'sentinel', position: [-70, 4, -10], count: 2 },
  // Gatekeeper wave 2 (Story 3-2) -- second blocker, later in the loop
  { railProgress: 0.70, enemyType: 'gatekeeper', position: [-60, 3, -20], count: 1 },
  // Wave 4: ~85% into the loop
  { railProgress: 0.85, enemyType: 'sentinel', position: [30, 2, -55], count: 3 },
];

// Vector shard explosion constants (Story 2-4)
export const SHARD_COUNT = 10;           // shards per explosion
export const SHARD_MIN_SPEED = 12;       // units/sec minimum outward velocity
export const SHARD_MAX_SPEED = 25;       // units/sec maximum outward velocity
export const SHARD_MIN_LIFETIME = 0.4;   // seconds minimum before fade-out
export const SHARD_MAX_LIFETIME = 0.8;   // seconds maximum before fade-out
export const SHARD_LENGTH = 1.0;         // length of each shard line segment
export const MAX_ACTIVE_EXPLOSIONS = 12; // max concurrent explosions (pre-allocated pool)

// Enemy data burst constants (Story 2-5)
export const ENEMY_DATA_BURST_POOL_SIZE = 30;
export const ENEMY_DATA_BURST_LENGTH = 1.5;       // line segment length (units)
export const ENEMY_DATA_BURST_MAX_RANGE = 80;      // deactivate beyond this distance
export const ENEMY_DATA_BURST_COLLIDER_RADIUS = 0.3; // sphere for hit detection

// Player constants (Story 2-5)
export const PLAYER_MAX_SHIELDS = 100;
export const PLAYER_COLLIDER_RADIUS = 1.0;

// Attack state constants (Story 2-5)
export const ATTACK_STATE_PATROL_DURATION = 3.0; // seconds in patrol before attacking

// HUD constants (Story 2-6)
export const HUD_SHIELD_BAR_WIDTH = 0.4;       // total width in camera-local units
export const HUD_SHIELD_BAR_HEIGHT = 0.05;      // total height in camera-local units
export const HUD_SCORE_DIGIT_WIDTH = 0.08;      // width of each seven-segment digit
export const HUD_SCORE_DIGIT_HEIGHT = 0.12;     // height of each seven-segment digit
export const HUD_SCORE_DIGIT_SPACING = 0.025;   // gap between digits
export const HUD_SCORE_MAX_DIGITS = 6;          // max displayable digits (999999)
export const HUD_Z_DEPTH = -1.5;                // z position in camera-local space

// Screen shake and damage flash constants (Story 2-7)
export const SCREEN_SHAKE_MAX_INTENSITY = 0.15;    // max camera offset in world units
export const SCREEN_SHAKE_DECAY_RATE = 8.0;        // exponential decay speed
export const DAMAGE_FLASH_DECAY_RATE = 6.0;        // damage overlay fade speed
export const DAMAGE_FLASH_MIN_INTENSITY = 0.2;     // minimum flash intensity per hit
export const DAMAGE_FLASH_COLOR = { r: 1.0, g: 0.1, b: 0.0 } as const; // red-orange

// Score popup constants (Story 2-8)
export const SCORE_POPUP_POOL_SIZE = 8;       // max concurrent popups
export const SCORE_POPUP_LIFETIME = 0.8;       // seconds before full fade-out
export const SCORE_POPUP_FLOAT_SPEED = 2.0;    // units/sec upward movement
export const SCORE_POPUP_SCALE = 1.2;           // world-space scale factor
export const SCORE_POPUP_MAX_DIGITS = 4;        // max digits in popup (+9999)

// Viewport movement constants (Story 1-4)
export const VIEWPORT_MOVE_SPEED = 3.0;
export const VIEWPORT_MAX_OFFSET_X = 3.0;
export const VIEWPORT_MAX_OFFSET_Y_UP = 2.5;
export const VIEWPORT_MAX_OFFSET_Y_DOWN = 1.2;
export const VIEWPORT_BASE_POSITION = { x: 0, y: 0, z: 3 } as const;

// Surface Attack Phase — FirewallNode (Story 3-3)
export const FIREWALL_NODE_HEALTH = 20;
export const FIREWALL_NODE_SCORE_VALUE = 150;
export const FIREWALL_NODE_COLLIDER_RADIUS = 1.0;
export const FIREWALL_NODE_POOL_SIZE = 12;

// Surface Attack Phase — ICETower (Story 3-3)
export const ICE_TOWER_HEALTH = 50;
export const ICE_TOWER_SCORE_VALUE = 250;
export const ICE_TOWER_COLLIDER_RADIUS = 0.8;
export const ICE_TOWER_POOL_SIZE = 8;
export const ICE_TOWER_ATTACK_COOLDOWN = 3.0;
export const ICE_TOWER_ATTACK_DAMAGE = 12;
export const ICE_TOWER_PROJECTILE_SPEED = 14;

export const ICE_TOWER_BEHAVIOR: BehaviorParams = {
  patrolSpeed: 0,
  attackCooldown: 3.0,
  evasionChance: 0.0,
  movementRandomness: 0.0,
  attackDamage: 12,
  projectileSpeed: 14,
};

// Surface Attack Phase rail path (Story 3-3)
// Non-looping approach run: starts high, descends to skim ~3-5 units above
// the fortress surface (y=0 plane), weaves between structures, exits at far end
export const SURFACE_RAIL_PATH_POINTS: readonly [number, number, number][] = [
  [0, 25, -100],      // approach from altitude
  [10, 18, -70],      // descending
  [20, 10, -40],      // steep descent toward surface
  [30, 5, -10],       // leveling off above surface
  [50, 4, 20],        // skimming — first firewall node cluster
  [80, 3.5, 50],      // low pass over fortress surface
  [110, 4, 70],       // slight rise over wall structure
  [130, 3, 90],       // back down, ICE tower zone
  [150, 4.5, 120],    // weaving between structures
  [170, 3.5, 150],    // second firewall node cluster
  [200, 4, 180],      // approach ICE tower battery
  [230, 5, 210],      // slight climb over ridge
  [250, 3.5, 240],    // final low pass
  [270, 4, 270],      // last target zone
  [290, 6, 300],      // pulling up at fortress edge
  [300, 12, 330],     // climbing away from surface
  [310, 20, 360],     // exit altitude — phase end
] as const;

// Surface target positions (Story 3-3)
// Placed on/near the fortress surface (y~0) along the rail path
export interface SurfaceTarget {
  type: 'firewallNode' | 'iceTower';
  position: [number, number, number];
}

export const SURFACE_TARGETS: SurfaceTarget[] = [
  // First cluster — firewall nodes near path start
  { type: 'firewallNode', position: [45, 1, 15] },
  { type: 'firewallNode', position: [55, 1, 25] },
  { type: 'firewallNode', position: [60, 1.5, 18] },
  // ICE tower guarding first cluster
  { type: 'iceTower', position: [70, 0, 35] },
  // Mid-section nodes
  { type: 'firewallNode', position: [120, 1, 85] },
  { type: 'firewallNode', position: [140, 0.5, 100] },
  // ICE tower battery mid-section
  { type: 'iceTower', position: [155, 0, 130] },
  { type: 'iceTower', position: [165, 0, 140] },
  // Second cluster — more nodes
  { type: 'firewallNode', position: [190, 1, 170] },
  { type: 'firewallNode', position: [205, 1, 185] },
  { type: 'firewallNode', position: [215, 0.5, 195] },
  // Final ICE tower battery
  { type: 'iceTower', position: [240, 0, 250] },
  { type: 'iceTower', position: [255, 0, 260] },
  // Final node — bonus target near exit
  { type: 'firewallNode', position: [275, 1.5, 275] },
];
// Total: 9 firewall nodes, 5 ICE towers

// Logic Bomb constants (Story 3-5)
export const LOGIC_BOMB_SPEED = 30;
export const LOGIC_BOMB_DAMAGE = 40;
export const LOGIC_BOMB_MAX_RANGE = 80;
export const LOGIC_BOMB_MAX_LIFETIME = 4.0;
export const LOGIC_BOMB_FIRE_COOLDOWN = 1.0;
export const LOGIC_BOMB_TURN_RATE = 3.0;
export const LOGIC_BOMB_LOCK_CONE_ANGLE = 0.35;
export const LOGIC_BOMB_LOCK_RANGE = 60;
export const LOGIC_BOMB_MAX_AMMO = 5;
export const LOGIC_BOMB_POOL_SIZE = 10;
export const LOGIC_BOMB_COLLIDER_RADIUS = 0.8;
export const LOGIC_BOMB_LENGTH = 2.0;

// Data Corridor Phase constants (Story 3-4)
export const CORRIDOR_OBSTACLE_DAMAGE = 15;
export const CORRIDOR_HIT_COOLDOWN = 0.8;
export const FIREWALL_CLOSE_DURATION = 1.5;
export const FIREWALL_OPEN_DURATION = 2.0;
export const FIREWALL_COLLIDER_DEPTH = 1.0;
export const NETWORK_CABLE_COLLIDER_HEIGHT = 1.5;
export const DATA_STREAM_SPEED = 6.0;
export const DATA_STREAM_COLLIDER_SIZE = 1.5;
export const CORRIDOR_WALL_WIDTH = 12.0;
export const CORRIDOR_WALL_MIN_WIDTH = 6.0;
export const CORRIDOR_HEIGHT = 8.0;
export const CORRIDOR_LENGTH = 700;
export const CORRIDOR_RAIL_SPEED_MULTIPLIER = 1.2;

// Data Corridor Phase rail path (Story 3-4)
// Non-looping straight-forward path through narrowing corridor
// Very slight lateral variation for visual interest, centered at y~4
export const CORRIDOR_RAIL_PATH_POINTS: readonly [number, number, number][] = [
  [0, 4, 0],          // corridor entrance
  [0.3, 4, -50],      // slight drift right
  [-0.2, 4, -100],    // slight drift left
  [0.5, 4.2, -150],   // tiny rise
  [-0.3, 3.8, -200],  // slight drop and left
  [0.4, 4, -250],     // back to center-right
  [0, 4.1, -300],     // centered
  [-0.5, 4, -350],    // drift left
  [0.2, 3.9, -400],   // drift right, slight drop
  [0, 4, -450],       // centered
  [0.3, 4.2, -500],   // slight rise
  [-0.2, 4, -550],    // drift left
  [0, 4, -600],       // final approach
  [0, 4, -700],       // corridor exit
] as const;

export type CorridorObstacleType = 'firewall' | 'networkCable' | 'dataStream';
export interface CorridorObstacleConfig {
  type: CorridorObstacleType;
  position: [number, number, number];
  phaseOffset?: number;
  direction?: 'left' | 'right';
}

// Corridor obstacle placement (Story 3-4)
// Level 1 = moderate density with generous timing windows
export const CORRIDOR_OBSTACLES: CorridorObstacleConfig[] = [
  // First section: gentle introduction — single firewalls with wide timing
  { type: 'firewall', position: [0, 4, -80], phaseOffset: 0 },
  { type: 'networkCable', position: [0, 2.5, -130] },
  { type: 'firewall', position: [0, 4, -180], phaseOffset: 0.3 },

  // Mid section: mixed obstacles, moderate density
  { type: 'dataStream', position: [-2, 4, -230], direction: 'right' },
  { type: 'networkCable', position: [0, 5.5, -280] },
  { type: 'firewall', position: [0, 4, -320], phaseOffset: 0.6 },
  { type: 'dataStream', position: [2, 4, -370], direction: 'left' },

  // Late section: denser obstacles, corridor narrowing
  { type: 'firewall', position: [0, 4, -420], phaseOffset: 0.15 },
  { type: 'networkCable', position: [0, 3.0, -460] },
  { type: 'dataStream', position: [0, 4, -500], direction: 'right' },
  { type: 'firewall', position: [0, 4, -540], phaseOffset: 0.45 },
  { type: 'networkCable', position: [0, 5.0, -580] },

  // Final gauntlet: tight spacing before exit
  { type: 'firewall', position: [0, 4, -620], phaseOffset: 0.7 },
  { type: 'dataStream', position: [-1, 4, -650], direction: 'left' },
];
// Total: 6 firewalls, 4 network cables, 4 data streams
