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

// Overseer enemy defaults (Story 5-6)
export const OVERSEER_HEALTH = 60;
export const OVERSEER_SCORE_VALUE = 400;
export const OVERSEER_COLLIDER_RADIUS = 1.8;
export const OVERSEER_POOL_SIZE = 6;
export const OVERSEER_BUFF_RADIUS = 15.0;
export const OVERSEER_BUFF_COOLDOWN_MULTIPLIER = 0.6;
export const OVERSEER_BUFF_SPEED_MULTIPLIER = 1.3;
export const OVERSEER_BUFF_INTERVAL = 3.0;

// Spawn event definitions (Story 2-2, extended Story 3-1, extended Story 3-2, extended Story 3-3, extended Story 5-6)
// Hardcoded for now -- JSON loading comes later with LevelManager
export interface SpawnEvent {
  railProgress: number;  // 0-1, trigger point on rail
  enemyType: 'sentinel' | 'watchdog' | 'gatekeeper' | 'overseer' | 'firewallNode' | 'iceTower';
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
  [0, 12, -30],       // approach from moderate altitude
  [10, 8, -15],       // descending
  [20, 6, 0],         // leveling off toward surface
  [30, 5, 15],        // entering fortress area
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
  [290, 5, 300],      // pulling up at fortress edge
  [300, 8, 315],      // climbing away from surface
  [305, 10, 325],     // exit — phase end
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
export const LOGIC_BOMB_FIRE_COOLDOWN = 0.5;
export const LOGIC_BOMB_TURN_RATE = 3.0;
export const LOGIC_BOMB_LOCK_CONE_ANGLE = 0.35;
export const LOGIC_BOMB_LOCK_RANGE = 60;
export const LOGIC_BOMB_MAX_AMMO = 10;
export const LOGIC_BOMB_POOL_SIZE = 10;
export const LOGIC_BOMB_COLLIDER_RADIUS = 0.8;
export const LOGIC_BOMB_LENGTH = 2.0;

// EMP Burst constants (Story 3-6)
export const EMP_BURST_COOLDOWN = 3.0;
export const EMP_BURST_RADIUS = 25;
export const EMP_BURST_STUN_DURATION = 3.0;
export const EMP_BURST_SLOW_FACTOR = 0.2;
export const EMP_BURST_VISUAL_DURATION = 0.6;
export const EMP_BURST_POOL_SIZE = 3;
export const EMP_BURST_STUN_PULSE_RATE = 6.0;

// Virus Payload constants (Story 3-8)
export const VIRUS_PAYLOAD_SPEED = 20;
export const VIRUS_PAYLOAD_DAMAGE = 100;
export const VIRUS_PAYLOAD_FIRE_COOLDOWN = 1.5;
export const VIRUS_PAYLOAD_MAX_RANGE = 80;
export const VIRUS_PAYLOAD_MAX_LIFETIME = 5.0;
export const VIRUS_PAYLOAD_POOL_SIZE = 5;
export const VIRUS_PAYLOAD_COLLIDER_RADIUS = 1.0;
export const VIRUS_PAYLOAD_LENGTH = 3.0;

// Phase transition constants (Story 3-10)
export const PHASE_TRANSITION_FADE_DURATION = 0.75;
export const PHASE_SHIELD_RECHARGE_AMOUNT = 30;

// Palette transition constants (Story 5-5)
export const PALETTE_TRANSITION_DURATION = 2.0;

// Rail completion threshold (used by phases to detect rail end)
export const RAIL_COMPLETION_THRESHOLD = 0.98;

// Boss Destruction Sequence constants (Story 3-9)
export const BOSS_DESTRUCTION_PEEL_DURATION = 2.0;
export const BOSS_DESTRUCTION_STRIP_DURATION = 1.5;
export const BOSS_DESTRUCTION_SHATTER_DURATION = 2.0;
export const BOSS_DESTRUCTION_PEEL_SCALE_END = 2.0;
export const BOSS_DESTRUCTION_STRIP_SCALE_END = 1.5;
export const BOSS_DESTRUCTION_ROTATION_MULTIPLIER_PEEL = 3.0;
export const BOSS_DESTRUCTION_ROTATION_MULTIPLIER_STRIP = 5.0;
export const BOSS_DESTRUCTION_SHATTER_PULSE_FREQUENCY = 20;
export const BOSS_DESTRUCTION_SHATTER_EXPLOSION_COUNT = 5;
export const BOSS_DESTRUCTION_SHAKE_PEEL = 0.3;
export const BOSS_DESTRUCTION_SHAKE_STRIP = 0.5;
export const BOSS_DESTRUCTION_SHAKE_SHATTER = 0.8;

// Gatekeeper Boss constants (Story 3-7)
export const BOSS_GATEKEEPER_HEALTH = 500;
export const BOSS_GATEKEEPER_COLLIDER_RADIUS = 6.0;
export const BOSS_GATEKEEPER_SCORE_VALUE = 5000;
export const BOSS_GATEKEEPER_OUTER_RADIUS = 8;
export const BOSS_GATEKEEPER_MID_RADIUS = 5.5;
export const BOSS_GATEKEEPER_CORE_RADIUS = 3;
export const BOSS_GATEKEEPER_ROTATION_SPEED = 0.3;
export const BOSS_GATEKEEPER_CORE_PULSE_RATE = 1.5;
export const BOSS_GATEKEEPER_CORE_PULSE_AMPLITUDE = 0.1;

// Gatekeeper Boss attack phase timing constants (Story 3-7)
export const BOSS_GATEKEEPER_BARRAGE_DURATION = 6.0;
export const BOSS_GATEKEEPER_SWEEP_DURATION = 5.0;
export const BOSS_GATEKEEPER_VULNERABLE_DURATION = 4.0;
export const BOSS_GATEKEEPER_BARRAGE_INTERVAL = 0.5;
export const BOSS_GATEKEEPER_BARRAGE_COUNT = 3;
export const BOSS_GATEKEEPER_BARRAGE_SPREAD = 0.3;
export const BOSS_GATEKEEPER_SWEEP_SPEED = 1.5;
export const BOSS_GATEKEEPER_DAMAGE_REDUCTION = 0.25;
export const BOSS_GATEKEEPER_ATTACK_DAMAGE = 15;
export const BOSS_GATEKEEPER_PROJECTILE_SPEED = 16;

// Avenger Boss constants (Story 5-2)
export const BOSS_AVENGER_HEALTH = 650;
export const BOSS_AVENGER_COLLIDER_RADIUS = 5.5;
export const BOSS_AVENGER_SCORE_VALUE = 7500;
export const BOSS_AVENGER_OUTER_RADIUS = 9;
export const BOSS_AVENGER_MID_RADIUS = 6;
export const BOSS_AVENGER_CORE_RADIUS = 3;
export const BOSS_AVENGER_ROTATION_SPEED = 0.5;
export const BOSS_AVENGER_CORE_PULSE_RATE = 2.0;
export const BOSS_AVENGER_CORE_PULSE_AMPLITUDE = 0.15;

// Avenger Boss attack phase timing constants (Story 5-2)
export const BOSS_AVENGER_RUSH_DURATION = 4.0;
export const BOSS_AVENGER_RUSH_CHARGE_SPEED = 25;
export const BOSS_AVENGER_RUSH_PROJECTILE_INTERVAL = 0.3;
export const BOSS_AVENGER_RUSH_DAMAGE = 20;
export const BOSS_AVENGER_BARRAGE_DURATION = 5.0;
export const BOSS_AVENGER_BARRAGE_INTERVAL = 0.35;
export const BOSS_AVENGER_BARRAGE_COUNT = 5;
export const BOSS_AVENGER_BARRAGE_SPREAD = 0.4;
export const BOSS_AVENGER_VULNERABLE_DURATION = 3.0;
export const BOSS_AVENGER_DAMAGE_REDUCTION = 0.15;
export const BOSS_AVENGER_ATTACK_DAMAGE = 20;
export const BOSS_AVENGER_PROJECTILE_SPEED = 20;

// Core Intelligence Boss constants (Story 5-4)
export const BOSS_CORE_HEALTH = 800;
export const BOSS_CORE_COLLIDER_RADIUS = 7.0;
export const BOSS_CORE_SCORE_VALUE = 10000;
export const BOSS_CORE_OUTER_RADIUS = 12;
export const BOSS_CORE_MID_RADIUS = 8;
export const BOSS_CORE_INNER_RADIUS = 5;
export const BOSS_CORE_DEEP_RADIUS = 2.5;
export const BOSS_CORE_ROTATION_SPEED = 0.2;
export const BOSS_CORE_PULSE_RATE = 1.0;
export const BOSS_CORE_PULSE_AMPLITUDE = 0.12;

// Core Intelligence Boss attack phase timing constants (Story 5-4)
export const BOSS_CORE_REASON_DURATION = 5.0;
export const BOSS_CORE_REASON_INTERVAL = 0.8;
export const BOSS_CORE_REASON_DAMAGE = 15;
export const BOSS_CORE_BARRAGE_DURATION = 6.0;
export const BOSS_CORE_BARRAGE_INTERVAL = 0.25;
export const BOSS_CORE_BARRAGE_COUNT = 7;
export const BOSS_CORE_BARRAGE_SPREAD = 0.5;
export const BOSS_CORE_SURGE_DURATION = 3.0;
export const BOSS_CORE_SURGE_BURST_INTERVAL = 0.5;
export const BOSS_CORE_SURGE_BURST_COUNT = 8;
export const BOSS_CORE_SURGE_DAMAGE = 25;
export const BOSS_CORE_VULNERABLE_DURATION = 2.5;
export const BOSS_CORE_DAMAGE_REDUCTION = 0.1;
export const BOSS_CORE_ATTACK_DAMAGE = 25;
export const BOSS_CORE_PROJECTILE_SPEED = 22;

// Core Intelligence emotional escalation thresholds (Story 5-4)
export const BOSS_CORE_ESCALATION_75_ROTATION_MULT = 1.5;
export const BOSS_CORE_ESCALATION_75_JITTER = 0.1;
export const BOSS_CORE_ESCALATION_50_ROTATION_MULT = 2.0;
export const BOSS_CORE_ESCALATION_50_JITTER = 0.3;
export const BOSS_CORE_ESCALATION_50_PULSE_MULT = 1.5;
export const BOSS_CORE_ESCALATION_25_ROTATION_MULT = 3.0;
export const BOSS_CORE_ESCALATION_25_JITTER = 0.6;
export const BOSS_CORE_ESCALATION_25_PULSE_MULT = 2.0;

// Boss arena rail constants (Story 3-7)
export const BOSS_ARENA_RAIL_SPEED = 10;
export const BOSS_CAMERA_LOOK_LERP = 5.0;
export const BOSS_ARENA_RAIL_POINTS: readonly [number, number, number][] = [
  [35, 10, 0],
  [25, 12, 25],
  [0, 15, 35],
  [-25, 12, 25],
  [-35, 8, 0],
  [-25, 6, -25],
  [0, 5, -35],
  [25, 8, -25],
  [30, 10, -10],
  [35, 12, 5],
  [32, 11, 15],
  [35, 10, 0],
] as const;

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

// Briefing Screen constants (Story 4-4)
export const BRIEFING_SCROLL_SPEED = 30;           // pixels per second
export const BRIEFING_SKIP_GUARD_DELAY = 2.0;      // seconds before skip is enabled
export const BRIEFING_HOLD_DURATION = 2.0;          // seconds to hold after scroll completes
export const BRIEFING_FADE_DURATION = 0.5;          // seconds for fade in/out

// Comm Overlay constants (Story 4-1)
export const COMM_TYPEWRITER_SPEED = 30;       // characters per second
export const COMM_DEFAULT_DURATION = 4.0;      // seconds to display a line
export const COMM_FADE_IN_DURATION = 0.2;      // seconds
export const COMM_FADE_OUT_DURATION = 0.3;     // seconds

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

// =====================================================================
// Level 2 Constants — "Aggressive" profile (Story 5-1)
// =====================================================================

import type { PaletteName } from '../rendering/ColorPalette.ts';

/** Maps level number to palette name */
export const LEVEL_PALETTES: Record<number, PaletteName> = {
  1: 'green',
  2: 'amber',
  3: 'red',
} as const;

// Level 2 enemy behavior — faster, shorter cooldowns, evasion, slight randomness
export const SENTINEL_BEHAVIOR_LEVEL2: BehaviorParams = {
  patrolSpeed: 1.5,
  attackCooldown: 1.2,
  evasionChance: 0.2,
  movementRandomness: 0.1,
  attackDamage: 12,
  projectileSpeed: 18,
};

export const WATCHDOG_BEHAVIOR_LEVEL2: BehaviorParams = {
  patrolSpeed: 2.25,
  attackCooldown: 0.9,
  evasionChance: 0.2,
  movementRandomness: 0.1,
  attackDamage: 15,
  projectileSpeed: 22,
};

export const GATEKEEPER_BEHAVIOR_LEVEL2: BehaviorParams = {
  patrolSpeed: 1.2,
  attackCooldown: 1.5,
  evasionChance: 0.2,
  movementRandomness: 0.1,
  attackDamage: 18,
  projectileSpeed: 15,
};

// Level 3 enemy behavior — randomized speeds/cooldowns, high evasion, erratic movement (Story 5-3)
export const SENTINEL_BEHAVIOR_LEVEL3: BehaviorParams = {
  patrolSpeed: 1.5,
  attackCooldown: 0.8,
  evasionChance: 0.5,
  movementRandomness: 0.5,
  attackDamage: 15,
  projectileSpeed: 20,
};

export const WATCHDOG_BEHAVIOR_LEVEL3: BehaviorParams = {
  patrolSpeed: 2.5,
  attackCooldown: 0.6,
  evasionChance: 0.5,
  movementRandomness: 0.5,
  attackDamage: 18,
  projectileSpeed: 25,
};

export const GATEKEEPER_BEHAVIOR_LEVEL3: BehaviorParams = {
  patrolSpeed: 1.5,
  attackCooldown: 1.0,
  evasionChance: 0.5,
  movementRandomness: 0.5,
  attackDamage: 22,
  projectileSpeed: 18,
};

// Overseer enemy behavior — coordinator/elite, appears Level 2+ (Story 5-6)
export const OVERSEER_BEHAVIOR_LEVEL2: BehaviorParams = {
  patrolSpeed: 1.2,
  attackCooldown: 2.5,
  evasionChance: 0.15,
  movementRandomness: 0.1,
  attackDamage: 15,
  projectileSpeed: 16,
};

export const OVERSEER_BEHAVIOR_LEVEL3: BehaviorParams = {
  patrolSpeed: 1.5,
  attackCooldown: 1.8,
  evasionChance: 0.35,
  movementRandomness: 0.4,
  attackDamage: 18,
  projectileSpeed: 18,
};

/** Per-level behavior param sets keyed by enemy type */
export interface LevelBehaviorConfig {
  sentinel: BehaviorParams;
  watchdog: BehaviorParams;
  gatekeeper: BehaviorParams;
  overseer: BehaviorParams;
}

export const LEVEL_BEHAVIORS: Record<number, LevelBehaviorConfig> = {
  1: {
    sentinel: SENTINEL_BEHAVIOR_LEVEL1,
    watchdog: WATCHDOG_BEHAVIOR_LEVEL1,
    gatekeeper: GATEKEEPER_BEHAVIOR_LEVEL1,
    overseer: OVERSEER_BEHAVIOR_LEVEL2, // Overseers don't appear in Level 1; fallback
  },
  2: {
    sentinel: SENTINEL_BEHAVIOR_LEVEL2,
    watchdog: WATCHDOG_BEHAVIOR_LEVEL2,
    gatekeeper: GATEKEEPER_BEHAVIOR_LEVEL2,
    overseer: OVERSEER_BEHAVIOR_LEVEL2,
  },
  3: {
    sentinel: SENTINEL_BEHAVIOR_LEVEL3,
    watchdog: WATCHDOG_BEHAVIOR_LEVEL3,
    gatekeeper: GATEKEEPER_BEHAVIOR_LEVEL3,
    overseer: OVERSEER_BEHAVIOR_LEVEL3,
  },
};

// Behavioral evolution constants (Story 5-7)
// These constants control how movementRandomness and evasionChance affect AI states
export const PATROL_RANDOMNESS_SCALE = 1.5;     // multiplied with movementRandomness for patrol orbit offset
export const PURSUIT_RANDOMNESS_SCALE = 2.0;    // multiplied with movementRandomness for pursuit zigzag amplitude
export const BLOCK_RANDOMNESS_SCALE = 1.0;      // multiplied with movementRandomness for additional block sway
export const OVERSEER_RANDOMNESS_SCALE = 1.5;   // multiplied with movementRandomness for orbit radius variation
export const EVASION_SPEED_MULTIPLIER = 2.5;    // multiplied with patrolSpeed for evasion movement speed
export const EVASION_DURATION = 0.6;            // seconds of evasion movement after attack
export const GLITCH_THRESHOLD = 0.4;            // movementRandomness at which visual glitch jitter activates
export const GLITCH_SCALE_INTENSITY = 0.06;     // scale jitter amplitude for Level 3 "digital instability"

// Handler voice escalation constants (Story 5-8)
// Per-level voice profile parameters controlling how the handler sounds increasingly urgent
export const HANDLER_L2_BASE_FREQ = 200;        // Hz — higher pitch than L1 (180), conveying tension
export const HANDLER_L2_MOD_RATE = 11;           // Hz — faster amplitude modulation than L1 (8), more urgency
export const HANDLER_L2_MOD_DEPTH = 0.4;         // deeper modulation than L1 (0.3), more vocal strain
export const HANDLER_L2_NOISE_LEVEL = 0.15;      // more static than L1 (0.1), degrading comm quality
export const HANDLER_L2_ATTACK = 0.015;           // seconds — faster onset than L1 (0.02), more clipped
export const HANDLER_L3_BASE_FREQ = 220;         // Hz — highest pitch, strained voice
export const HANDLER_L3_MOD_RATE = 14;            // Hz — fastest modulation, trembling urgency
export const HANDLER_L3_MOD_DEPTH = 0.5;          // deepest modulation, voice breaking
export const HANDLER_L3_NOISE_LEVEL = 0.25;       // most static, comm channel degrading
export const HANDLER_L3_FREQ_DRIFT = 60;          // Hz — wider pitch variation than L1 (40), composure lost
export const HANDLER_L3_ATTACK = 0.01;            // seconds — sharpest onset, clipped and desperate

// Level 2 spawn events — more enemies, more watchdogs/gatekeepers, cluster spawns
export const SPAWN_EVENTS_LEVEL2: SpawnEvent[] = [
  // Wave 1: opening cluster — immediate pressure
  { railProgress: 0.08, enemyType: 'sentinel', position: [55, 5, -25], count: 4 },
  { railProgress: 0.08, enemyType: 'watchdog', position: [65, 3, -15], count: 2 },
  // Wave 2: coordinated Watchdog/Gatekeeper assault
  { railProgress: 0.20, enemyType: 'watchdog', position: [85, 4, 15], count: 3 },
  { railProgress: 0.22, enemyType: 'gatekeeper', position: [90, 3, 25], count: 1 },
  // Wave 3: sentinel swarm with flanking watchdogs
  { railProgress: 0.35, enemyType: 'sentinel', position: [-25, 3, 55], count: 4 },
  { railProgress: 0.37, enemyType: 'watchdog', position: [-35, 5, 65], count: 2 },
  // Wave 4: gatekeeper blockade
  { railProgress: 0.45, enemyType: 'gatekeeper', position: [25, 3, 55], count: 2 },
  { railProgress: 0.45, enemyType: 'sentinel', position: [15, 4, 45], count: 3 },
  // Wave 5: mid-loop pressure
  { railProgress: 0.55, enemyType: 'watchdog', position: [-55, 4, 35], count: 3 },
  { railProgress: 0.58, enemyType: 'sentinel', position: [-65, 3, 25], count: 3 },
  // Wave 6: heavy gatekeeper defense
  { railProgress: 0.68, enemyType: 'gatekeeper', position: [-65, 3, -15], count: 2 },
  { railProgress: 0.70, enemyType: 'watchdog', position: [-55, 5, -25], count: 2 },
  // Wave 7: final assault before loop end
  { railProgress: 0.82, enemyType: 'sentinel', position: [25, 2, -50], count: 4 },
  { railProgress: 0.85, enemyType: 'watchdog', position: [35, 4, -45], count: 2 },
  { railProgress: 0.88, enemyType: 'gatekeeper', position: [20, 3, -55], count: 1 },
  // Overseer spawns (Story 5-6) — coordinators that buff nearby enemies
  { railProgress: 0.30, enemyType: 'overseer', position: [70, 6, 40], count: 1 },
  { railProgress: 0.62, enemyType: 'overseer', position: [-50, 6, 20], count: 1 },
];
// Total: 18 sentinels, 14 watchdogs, 6 gatekeepers, 2 overseers = 40 enemies (vs ~20 in Level 1)

// Level 2 surface targets — more nodes, more ICE towers, tighter placement
export const SURFACE_TARGETS_LEVEL2: SurfaceTarget[] = [
  // First cluster — denser firewall nodes with ICE tower escorts
  { type: 'firewallNode', position: [40, 1, 12] },
  { type: 'firewallNode', position: [48, 1, 18] },
  { type: 'firewallNode', position: [55, 1.5, 22] },
  { type: 'firewallNode', position: [62, 1, 16] },
  { type: 'iceTower', position: [50, 0, 30] },
  { type: 'iceTower', position: [68, 0, 28] },
  // Mid-section — paired ICE towers with firewall nodes
  { type: 'firewallNode', position: [115, 1, 80] },
  { type: 'firewallNode', position: [125, 0.5, 88] },
  { type: 'firewallNode', position: [135, 1, 95] },
  { type: 'iceTower', position: [120, 0, 100] },
  { type: 'iceTower', position: [140, 0, 110] },
  { type: 'iceTower', position: [150, 0, 125] },
  // Second cluster — heavy defense
  { type: 'firewallNode', position: [180, 1, 165] },
  { type: 'firewallNode', position: [195, 1, 175] },
  { type: 'firewallNode', position: [208, 0.5, 188] },
  { type: 'firewallNode', position: [220, 1, 200] },
  // Final battery — ICE tower gauntlet
  { type: 'iceTower', position: [235, 0, 240] },
  { type: 'iceTower', position: [248, 0, 252] },
  { type: 'iceTower', position: [260, 0, 265] },
  // Final bonus node
  { type: 'firewallNode', position: [278, 1.5, 280] },
];
// Total: 12 firewall nodes, 8 ICE towers = 20 targets (vs 14 in Level 1)

// Level 2 corridor obstacles — denser, tighter timing, more crossing streams
export const CORRIDOR_OBSTACLES_LEVEL2: CorridorObstacleConfig[] = [
  // First section: quick introduction, tighter spacing than Level 1
  { type: 'firewall', position: [0, 4, -60], phaseOffset: 0 },
  { type: 'networkCable', position: [0, 2.5, -100] },
  { type: 'dataStream', position: [-2, 4, -130], direction: 'right' },
  { type: 'firewall', position: [0, 4, -160], phaseOffset: 0.2 },

  // Mid section: double obstacles, crossing streams
  { type: 'networkCable', position: [0, 5.5, -200] },
  { type: 'dataStream', position: [2, 4, -230], direction: 'left' },
  { type: 'dataStream', position: [-2, 4, -250], direction: 'right' },
  { type: 'firewall', position: [0, 4, -280], phaseOffset: 0.5 },
  { type: 'networkCable', position: [0, 3.0, -310] },
  { type: 'firewall', position: [0, 4, -340], phaseOffset: 0.1 },

  // Late section: heavy gauntlet
  { type: 'dataStream', position: [1, 4, -370], direction: 'left' },
  { type: 'firewall', position: [0, 4, -400], phaseOffset: 0.35 },
  { type: 'networkCable', position: [0, 2.8, -430] },
  { type: 'dataStream', position: [-1, 4, -460], direction: 'right' },
  { type: 'firewall', position: [0, 4, -490], phaseOffset: 0.6 },
  { type: 'networkCable', position: [0, 5.2, -520] },

  // Final gauntlet: brutal density before exit
  { type: 'firewall', position: [0, 4, -560], phaseOffset: 0.15 },
  { type: 'dataStream', position: [2, 4, -590], direction: 'left' },
  { type: 'dataStream', position: [-2, 4, -610], direction: 'right' },
  { type: 'firewall', position: [0, 4, -640], phaseOffset: 0.75 },
  { type: 'networkCable', position: [0, 3.5, -670] },
];
// Total: 8 firewalls, 6 network cables, 6 data streams = 20 obstacles (vs 14 in Level 1)

// =====================================================================
// Level 3 Constants — "Glitchy" profile (Story 5-3)
// =====================================================================

// Level 3 spawn events — maximum enemy density, heavy Gatekeeper presence, large clusters
export const SPAWN_EVENTS_LEVEL3: SpawnEvent[] = [
  // Wave 1: immediate overwhelming swarm
  { railProgress: 0.06, enemyType: 'sentinel', position: [50, 5, -20], count: 5 },
  { railProgress: 0.06, enemyType: 'watchdog', position: [60, 3, -10], count: 3 },
  { railProgress: 0.08, enemyType: 'gatekeeper', position: [70, 4, -30], count: 1 },
  // Wave 2: coordinated triple-type assault
  { railProgress: 0.18, enemyType: 'watchdog', position: [80, 4, 20], count: 4 },
  { railProgress: 0.20, enemyType: 'gatekeeper', position: [85, 3, 30], count: 2 },
  { railProgress: 0.22, enemyType: 'sentinel', position: [75, 5, 10], count: 3 },
  // Wave 3: heavy gatekeeper blockade with watchdog flankers
  { railProgress: 0.32, enemyType: 'gatekeeper', position: [-20, 3, 60], count: 3 },
  { railProgress: 0.34, enemyType: 'watchdog', position: [-30, 5, 70], count: 3 },
  { railProgress: 0.36, enemyType: 'sentinel', position: [-10, 4, 50], count: 4 },
  // Wave 4: dense midfield cluster
  { railProgress: 0.44, enemyType: 'sentinel', position: [20, 4, 60], count: 4 },
  { railProgress: 0.44, enemyType: 'watchdog', position: [30, 3, 55], count: 3 },
  { railProgress: 0.46, enemyType: 'gatekeeper', position: [15, 3, 70], count: 2 },
  // Wave 5: relentless pursuit wave
  { railProgress: 0.55, enemyType: 'watchdog', position: [-50, 4, 40], count: 4 },
  { railProgress: 0.58, enemyType: 'sentinel', position: [-60, 3, 30], count: 3 },
  { railProgress: 0.60, enemyType: 'gatekeeper', position: [-55, 5, 35], count: 1 },
  // Wave 6: penultimate gauntlet
  { railProgress: 0.70, enemyType: 'gatekeeper', position: [-60, 3, -20], count: 2 },
  { railProgress: 0.72, enemyType: 'watchdog', position: [-50, 5, -30], count: 3 },
  { railProgress: 0.74, enemyType: 'sentinel', position: [-45, 4, -15], count: 3 },
  // Wave 7: final massive assault before boss
  { railProgress: 0.84, enemyType: 'sentinel', position: [20, 2, -55], count: 5 },
  { railProgress: 0.86, enemyType: 'watchdog', position: [30, 4, -50], count: 3 },
  { railProgress: 0.88, enemyType: 'gatekeeper', position: [15, 3, -60], count: 2 },
  { railProgress: 0.90, enemyType: 'sentinel', position: [40, 3, -45], count: 2 },
  // Overseer spawns (Story 5-6) — more frequent coordinators, earlier appearances
  { railProgress: 0.15, enemyType: 'overseer', position: [65, 6, -5], count: 1 },
  { railProgress: 0.40, enemyType: 'overseer', position: [-15, 6, 55], count: 1 },
  { railProgress: 0.65, enemyType: 'overseer', position: [-55, 6, -10], count: 1 },
  { railProgress: 0.80, enemyType: 'overseer', position: [25, 6, -40], count: 1 },
];
// Total: 29 sentinels, 23 watchdogs, 13 gatekeepers, 4 overseers = 69 enemies (vs 40 in Level 2)

// Level 3 surface targets — maximum density, dense ICE towers, heavy defenses
export const SURFACE_TARGETS_LEVEL3: SurfaceTarget[] = [
  // First cluster — dense firewall nodes with ICE tower wall
  { type: 'firewallNode', position: [38, 1, 10] },
  { type: 'firewallNode', position: [45, 1, 15] },
  { type: 'firewallNode', position: [52, 1.5, 20] },
  { type: 'firewallNode', position: [59, 1, 14] },
  { type: 'firewallNode', position: [66, 1, 18] },
  { type: 'iceTower', position: [48, 0, 28] },
  { type: 'iceTower', position: [60, 0, 30] },
  { type: 'iceTower', position: [72, 0, 26] },
  // Mid-section — heavy ICE gauntlet
  { type: 'firewallNode', position: [110, 1, 78] },
  { type: 'firewallNode', position: [120, 0.5, 85] },
  { type: 'firewallNode', position: [130, 1, 92] },
  { type: 'firewallNode', position: [140, 1, 100] },
  { type: 'iceTower', position: [118, 0, 98] },
  { type: 'iceTower', position: [132, 0, 108] },
  { type: 'iceTower', position: [145, 0, 118] },
  { type: 'iceTower', position: [155, 0, 128] },
  // Final defense — maximum density
  { type: 'firewallNode', position: [175, 1, 160] },
  { type: 'firewallNode', position: [188, 1, 170] },
  { type: 'firewallNode', position: [200, 0.5, 182] },
  { type: 'firewallNode', position: [215, 1, 195] },
  { type: 'firewallNode', position: [228, 1, 208] },
  // Final ICE tower gauntlet
  { type: 'iceTower', position: [235, 0, 235] },
  { type: 'iceTower', position: [245, 0, 248] },
  { type: 'iceTower', position: [255, 0, 260] },
  { type: 'iceTower', position: [265, 0, 272] },
  // Final bonus node
  { type: 'firewallNode', position: [275, 1.5, 285] },
];
// Total: 16 firewall nodes, 11 ICE towers = 27 targets (vs 20 in Level 2, 35% increase)

// Level 3 corridor obstacles — maximum density, tightest timing, rapid-fire obstacles
export const CORRIDOR_OBSTACLES_LEVEL3: CorridorObstacleConfig[] = [
  // Opening salvo: immediate density
  { type: 'firewall', position: [0, 4, -50], phaseOffset: 0 },
  { type: 'dataStream', position: [-2, 4, -75], direction: 'right' },
  { type: 'networkCable', position: [0, 2.5, -95] },
  { type: 'firewall', position: [0, 4, -120], phaseOffset: 0.15 },
  { type: 'dataStream', position: [2, 4, -140], direction: 'left' },

  // Mid section: double/triple obstacle combos
  { type: 'networkCable', position: [0, 5.5, -170] },
  { type: 'dataStream', position: [2, 4, -190], direction: 'left' },
  { type: 'dataStream', position: [-2, 4, -205], direction: 'right' },
  { type: 'firewall', position: [0, 4, -230], phaseOffset: 0.4 },
  { type: 'networkCable', position: [0, 3.0, -255] },
  { type: 'firewall', position: [0, 4, -275], phaseOffset: 0.1 },
  { type: 'dataStream', position: [-1, 4, -295], direction: 'right' },

  // Heavy gauntlet: relentless obstacle barrage
  { type: 'firewall', position: [0, 4, -325], phaseOffset: 0.3 },
  { type: 'networkCable', position: [0, 2.8, -350] },
  { type: 'dataStream', position: [1, 4, -370], direction: 'left' },
  { type: 'firewall', position: [0, 4, -395], phaseOffset: 0.55 },
  { type: 'networkCable', position: [0, 5.2, -420] },
  { type: 'dataStream', position: [-2, 4, -440], direction: 'right' },
  { type: 'dataStream', position: [2, 4, -455], direction: 'left' },

  // Final gauntlet: maximum density before exit
  { type: 'firewall', position: [0, 4, -485], phaseOffset: 0.2 },
  { type: 'networkCable', position: [0, 3.5, -510] },
  { type: 'firewall', position: [0, 4, -535], phaseOffset: 0.7 },
  { type: 'dataStream', position: [2, 4, -555], direction: 'left' },
  { type: 'dataStream', position: [-2, 4, -575], direction: 'right' },
  { type: 'firewall', position: [0, 4, -600], phaseOffset: 0.45 },
  { type: 'networkCable', position: [0, 4.5, -625] },
  { type: 'firewall', position: [0, 4, -650], phaseOffset: 0.85 },
];
// Total: 8 firewalls, 6 network cables, 8 data streams = 27 obstacles (vs 20 in Level 2, 35% increase)
