import type { InputManager } from './InputManager.ts';
import {
  VIEWPORT_MOVE_SPEED,
  VIEWPORT_MAX_OFFSET_X,
  VIEWPORT_MAX_OFFSET_Y_UP,
  VIEWPORT_MAX_OFFSET_Y_DOWN,
} from '../config/constants.ts';

const RECENTER_SPEED = 2.0; // units/sec drift back toward center

/**
 * Represents the current viewport offset from the base camera position.
 */
export interface ViewportOffset {
  x: number;
  y: number;
}

/**
 * Calculates the new clamped viewport offset based on input state.
 * Mutates the `current` object in place to avoid per-frame allocations.
 * No acceleration, no drift, no momentum -- constant speed while key is held,
 * instant stop on release. Movement is delta-time multiplied for frame-rate independence.
 */
export function updateViewportOffset(
  current: ViewportOffset,
  inputManager: InputManager,
  dt: number,
): ViewportOffset {
  const movingX = inputManager.isActive('moveRight') || inputManager.isActive('moveLeft');
  const movingY = inputManager.isActive('moveUp') || inputManager.isActive('moveDown');

  if (inputManager.isActive('moveRight')) current.x += VIEWPORT_MOVE_SPEED * dt;
  if (inputManager.isActive('moveLeft')) current.x -= VIEWPORT_MOVE_SPEED * dt;
  if (inputManager.isActive('moveUp')) current.y += VIEWPORT_MOVE_SPEED * dt;
  if (inputManager.isActive('moveDown')) current.y -= VIEWPORT_MOVE_SPEED * dt;

  // Drift back toward center when no keys pressed on that axis
  if (!movingX && current.x !== 0) {
    const drift = RECENTER_SPEED * dt;
    current.x = Math.abs(current.x) <= drift ? 0 : current.x - Math.sign(current.x) * drift;
  }
  if (!movingY && current.y !== 0) {
    const drift = RECENTER_SPEED * dt;
    current.y = Math.abs(current.y) <= drift ? 0 : current.y - Math.sign(current.y) * drift;
  }

  current.x = Math.max(-VIEWPORT_MAX_OFFSET_X, Math.min(VIEWPORT_MAX_OFFSET_X, current.x));
  current.y = Math.max(-VIEWPORT_MAX_OFFSET_Y_DOWN, Math.min(VIEWPORT_MAX_OFFSET_Y_UP, current.y));

  return current;
}
