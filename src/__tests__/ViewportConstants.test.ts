import { describe, it, expect } from 'vitest';
import {
  VIEWPORT_MOVE_SPEED,
  VIEWPORT_MAX_OFFSET_X,
  VIEWPORT_MAX_OFFSET_Y,
  VIEWPORT_BASE_POSITION,
} from '../config/constants.ts';

describe('Viewport Movement Constants', () => {
  it('should define VIEWPORT_MOVE_SPEED as approximately 3.0', () => {
    expect(VIEWPORT_MOVE_SPEED).toBe(3.0);
  });

  it('should define VIEWPORT_MAX_OFFSET_X as 3.0', () => {
    expect(VIEWPORT_MAX_OFFSET_X).toBe(3.0);
  });

  it('should define VIEWPORT_MAX_OFFSET_Y as 2.0', () => {
    expect(VIEWPORT_MAX_OFFSET_Y).toBe(2.0);
  });

  it('should define VIEWPORT_BASE_POSITION matching camera setup from Story 1-1', () => {
    expect(VIEWPORT_BASE_POSITION).toEqual({ x: 0, y: 0, z: 3 });
  });
});
