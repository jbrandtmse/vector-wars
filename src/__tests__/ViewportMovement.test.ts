// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { updateViewportOffset } from '../core/ViewportMovement.ts';
import type { ViewportOffset } from '../core/ViewportMovement.ts';
import { InputManager } from '../core/InputManager.ts';
import {
  VIEWPORT_MOVE_SPEED,
  VIEWPORT_MAX_OFFSET_X,
  VIEWPORT_MAX_OFFSET_Y_UP,
  VIEWPORT_MAX_OFFSET_Y_DOWN,
} from '../config/constants.ts';

function dispatchKeydown(code: string): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { code }));
}

function dispatchKeyup(code: string): void {
  window.dispatchEvent(new KeyboardEvent('keyup', { code }));
}

describe('ViewportMovement', () => {
  let inputManager: InputManager;

  beforeEach(() => {
    inputManager = new InputManager();
  });

  afterEach(() => {
    inputManager.dispose();
  });

  it('should increase offsetX when moving right', () => {
    const dt = 1 / 60;
    const current: ViewportOffset = { x: 0, y: 0 };
    dispatchKeydown('ArrowRight');

    const result = updateViewportOffset(current, inputManager, dt);
    expect(result.x).toBeCloseTo(VIEWPORT_MOVE_SPEED * dt, 6);
    expect(result.y).toBe(0);
  });

  it('should increase offsetY when moving up', () => {
    const dt = 1 / 60;
    const current: ViewportOffset = { x: 0, y: 0 };
    dispatchKeydown('ArrowUp');

    const result = updateViewportOffset(current, inputManager, dt);
    expect(result.x).toBe(0);
    expect(result.y).toBeCloseTo(VIEWPORT_MOVE_SPEED * dt, 6);
  });

  it('should decrease offsetX when moving left', () => {
    const dt = 1 / 60;
    const current: ViewportOffset = { x: 0, y: 0 };
    dispatchKeydown('ArrowLeft');

    const result = updateViewportOffset(current, inputManager, dt);
    expect(result.x).toBeCloseTo(-VIEWPORT_MOVE_SPEED * dt, 6);
  });

  it('should decrease offsetY when moving down', () => {
    const dt = 1 / 60;
    const current: ViewportOffset = { x: 0, y: 0 };
    dispatchKeydown('ArrowDown');

    const result = updateViewportOffset(current, inputManager, dt);
    expect(result.y).toBeCloseTo(-VIEWPORT_MOVE_SPEED * dt, 6);
  });

  it('should clamp offsetX at max bounds', () => {
    const dt = 1.0; // Large dt to exceed bounds in one step
    const current: ViewportOffset = { x: VIEWPORT_MAX_OFFSET_X - 0.01, y: 0 };
    dispatchKeydown('ArrowRight');

    const result = updateViewportOffset(current, inputManager, dt);
    expect(result.x).toBe(VIEWPORT_MAX_OFFSET_X);
  });

  it('should clamp offsetX at negative max bounds', () => {
    const dt = 1.0;
    const current: ViewportOffset = { x: -VIEWPORT_MAX_OFFSET_X + 0.01, y: 0 };
    dispatchKeydown('ArrowLeft');

    const result = updateViewportOffset(current, inputManager, dt);
    expect(result.x).toBe(-VIEWPORT_MAX_OFFSET_X);
  });

  it('should clamp offsetY at upper bound', () => {
    const dt = 1.0;
    const current: ViewportOffset = { x: 0, y: VIEWPORT_MAX_OFFSET_Y_UP - 0.01 };
    dispatchKeydown('ArrowUp');

    const result = updateViewportOffset(current, inputManager, dt);
    expect(result.y).toBe(VIEWPORT_MAX_OFFSET_Y_UP);
  });

  it('should clamp offsetY at lower bound', () => {
    const dt = 1.0;
    const current: ViewportOffset = { x: 0, y: -VIEWPORT_MAX_OFFSET_Y_DOWN + 0.01 };
    dispatchKeydown('ArrowDown');

    const result = updateViewportOffset(current, inputManager, dt);
    expect(result.y).toBe(-VIEWPORT_MAX_OFFSET_Y_DOWN);
  });

  it('should return unchanged offset when no keys are pressed (no drift)', () => {
    const dt = 1 / 60;
    const current: ViewportOffset = { x: 0.5, y: 0.3 };

    const result = updateViewportOffset(current, inputManager, dt);
    expect(result.x).toBe(0.5);
    expect(result.y).toBe(0.3);
  });

  it('should cancel out opposing keys (moveLeft + moveRight = zero net movement)', () => {
    const dt = 1 / 60;
    const current: ViewportOffset = { x: 0.5, y: 0 };
    dispatchKeydown('ArrowLeft');
    dispatchKeydown('ArrowRight');

    const result = updateViewportOffset(current, inputManager, dt);
    expect(result.x).toBe(0.5); // No net change
  });

  it('should cancel out opposing vertical keys', () => {
    const dt = 1 / 60;
    const current: ViewportOffset = { x: 0, y: 0.3 };
    dispatchKeydown('ArrowUp');
    dispatchKeydown('ArrowDown');

    const result = updateViewportOffset(current, inputManager, dt);
    expect(result.y).toBe(0.3); // No net change
  });

  it('should support diagonal movement', () => {
    const dt = 1 / 60;
    const current: ViewportOffset = { x: 0, y: 0 };
    dispatchKeydown('ArrowRight');
    dispatchKeydown('ArrowUp');

    const result = updateViewportOffset(current, inputManager, dt);
    expect(result.x).toBeCloseTo(VIEWPORT_MOVE_SPEED * dt, 6);
    expect(result.y).toBeCloseTo(VIEWPORT_MOVE_SPEED * dt, 6);
  });

  it('should stop immediately when key is released (no momentum)', () => {
    const dt = 1 / 60;
    dispatchKeydown('ArrowRight');

    const afterMove = updateViewportOffset({ x: 0, y: 0 }, inputManager, dt);
    expect(afterMove.x).toBeGreaterThan(0);

    // Release key
    dispatchKeyup('ArrowRight');

    // Next frame: no movement should occur
    const afterRelease = updateViewportOffset(afterMove, inputManager, dt);
    expect(afterRelease.x).toBe(afterMove.x); // Exact same position
  });
});
