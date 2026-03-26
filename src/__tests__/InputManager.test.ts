// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InputManager } from '../core/InputManager.ts';

function dispatchKeydown(code: string, repeat = false): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { code, repeat }));
}

function dispatchKeyup(code: string): void {
  window.dispatchEvent(new KeyboardEvent('keyup', { code }));
}

describe('InputManager', () => {
  let inputManager: InputManager;

  beforeEach(() => {
    inputManager = new InputManager();
  });

  afterEach(() => {
    inputManager.dispose();
  });

  it('should return false for all actions by default (no keys pressed)', () => {
    expect(inputManager.isActive('moveUp')).toBe(false);
    expect(inputManager.isActive('moveDown')).toBe(false);
    expect(inputManager.isActive('moveLeft')).toBe(false);
    expect(inputManager.isActive('moveRight')).toBe(false);
    expect(inputManager.isActive('fire')).toBe(false);
  });

  it('should return true for moveUp after pressing ArrowUp', () => {
    dispatchKeydown('ArrowUp');
    expect(inputManager.isActive('moveUp')).toBe(true);
  });

  it('should return false for moveUp after releasing ArrowUp', () => {
    dispatchKeydown('ArrowUp');
    expect(inputManager.isActive('moveUp')).toBe(true);
    dispatchKeyup('ArrowUp');
    expect(inputManager.isActive('moveUp')).toBe(false);
  });

  it('should support simultaneous key presses', () => {
    dispatchKeydown('ArrowUp');
    dispatchKeydown('ArrowRight');
    expect(inputManager.isActive('moveUp')).toBe(true);
    expect(inputManager.isActive('moveRight')).toBe(true);
  });

  it('should suppress key repeat events (repeat: true does not change state)', () => {
    dispatchKeydown('ArrowUp');
    expect(inputManager.isActive('moveUp')).toBe(true);
    // Release the key
    dispatchKeyup('ArrowUp');
    expect(inputManager.isActive('moveUp')).toBe(false);
    // Repeat event should NOT activate
    dispatchKeydown('ArrowUp', true);
    expect(inputManager.isActive('moveUp')).toBe(false);
  });

  it('should remove event listeners after dispose()', () => {
    dispatchKeydown('ArrowUp');
    expect(inputManager.isActive('moveUp')).toBe(true);
    dispatchKeyup('ArrowUp');
    inputManager.dispose();
    // After dispose, new keydown events should have no effect
    dispatchKeydown('ArrowRight');
    expect(inputManager.isActive('moveRight')).toBe(false);
  });

  it('should return false for unmapped actions', () => {
    dispatchKeydown('KeyW');
    // 'fire' maps to 'Space', not 'KeyW' — should still be false
    expect(inputManager.isActive('fire')).toBe(false);
  });

  it('should handle all movement actions correctly', () => {
    dispatchKeydown('ArrowDown');
    expect(inputManager.isActive('moveDown')).toBe(true);
    dispatchKeydown('ArrowLeft');
    expect(inputManager.isActive('moveLeft')).toBe(true);
    dispatchKeydown('Space');
    expect(inputManager.isActive('fire')).toBe(true);
  });

  it('should handle releasing one key while another is still held', () => {
    dispatchKeydown('ArrowUp');
    dispatchKeydown('ArrowRight');
    expect(inputManager.isActive('moveUp')).toBe(true);
    expect(inputManager.isActive('moveRight')).toBe(true);
    // Release only up
    dispatchKeyup('ArrowUp');
    expect(inputManager.isActive('moveUp')).toBe(false);
    expect(inputManager.isActive('moveRight')).toBe(true);
  });

  it('should call preventDefault on repeat keydown events for mapped keys', () => {
    // Repeat events must still preventDefault to prevent browser scrolling
    const event = new KeyboardEvent('keydown', { code: 'ArrowUp', repeat: true, cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    // But repeat should NOT change active state
    expect(inputManager.isActive('moveUp')).toBe(false);
  });
});
