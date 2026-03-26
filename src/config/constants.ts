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

// Viewport movement constants (Story 1-4)
export const VIEWPORT_MOVE_SPEED = 3.0;
export const VIEWPORT_MAX_OFFSET_X = 3.0;
export const VIEWPORT_MAX_OFFSET_Y_UP = 2.5;
export const VIEWPORT_MAX_OFFSET_Y_DOWN = 1.2;
export const VIEWPORT_BASE_POSITION = { x: 0, y: 0, z: 3 } as const;
