import { DELTA_TIME_CAP } from '../config/constants.ts';

/**
 * Calculates capped delta time to prevent physics tunneling on tab-switches.
 * Time inputs are in milliseconds (as provided by renderer.setAnimationLoop).
 * Returns delta time in seconds, capped at DELTA_TIME_CAP (1/20 = 50ms).
 */
export function calculateDeltaTime(currentTimeMs: number, lastTimeMs: number): number {
  const rawDt = (currentTimeMs - lastTimeMs) / 1000;
  return Math.min(Math.max(0, rawDt), DELTA_TIME_CAP);
}
