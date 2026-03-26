import type { InputManager } from './InputManager.ts';
import {
  VIEWPORT_MOVE_SPEED,
  VIEWPORT_MAX_OFFSET_X,
  VIEWPORT_MAX_OFFSET_Y,
} from '../config/constants.ts';

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
  if (inputManager.isActive('moveRight')) current.x += VIEWPORT_MOVE_SPEED * dt;
  if (inputManager.isActive('moveLeft')) current.x -= VIEWPORT_MOVE_SPEED * dt;
  if (inputManager.isActive('moveUp')) current.y += VIEWPORT_MOVE_SPEED * dt;
  if (inputManager.isActive('moveDown')) current.y -= VIEWPORT_MOVE_SPEED * dt;

  current.x = Math.max(-VIEWPORT_MAX_OFFSET_X, Math.min(VIEWPORT_MAX_OFFSET_X, current.x));
  current.y = Math.max(-VIEWPORT_MAX_OFFSET_Y, Math.min(VIEWPORT_MAX_OFFSET_Y, current.y));

  return current;
}
