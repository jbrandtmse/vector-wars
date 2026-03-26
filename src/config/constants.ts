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
export const DATA_LANCE_BOLT_LENGTH = 0.4;
export const DATA_LANCE_POOL_SIZE = 30;
export const RECOIL_INTENSITY = 0.06;
export const RECOIL_RECOVERY_SPEED = 12.0;

// Viewport movement constants (Story 1-4)
export const VIEWPORT_MOVE_SPEED = 3.0;
export const VIEWPORT_MAX_OFFSET_X = 1.5;
export const VIEWPORT_MAX_OFFSET_Y = 1.0;
export const VIEWPORT_BASE_POSITION = { x: 0, y: 0, z: 3 } as const;
