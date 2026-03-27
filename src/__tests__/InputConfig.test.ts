import { describe, it, expect } from 'vitest';
import { INPUT_ACTIONS } from '../config/input.ts';
import type { InputAction } from '../config/input.ts';

describe('Input Configuration', () => {
  it('should define all required action mappings', () => {
    const expectedActions: InputAction[] = ['moveUp', 'moveDown', 'moveLeft', 'moveRight', 'fire'];
    for (const action of expectedActions) {
      expect(INPUT_ACTIONS[action]).toBeDefined();
      expect(typeof INPUT_ACTIONS[action]).toBe('string');
    }
  });

  it('should map actions to correct KeyboardEvent.code values', () => {
    expect(INPUT_ACTIONS.moveUp).toBe('ArrowUp');
    expect(INPUT_ACTIONS.moveDown).toBe('ArrowDown');
    expect(INPUT_ACTIONS.moveLeft).toBe('ArrowLeft');
    expect(INPUT_ACTIONS.moveRight).toBe('ArrowRight');
    expect(INPUT_ACTIONS.fire).toBe('Space');
  });

  it('should export INPUT_ACTIONS as a readonly object', () => {
    // Verify it has exactly 7 keys (5 original + logicBomb from Story 3-5 + emp from Story 3-6)
    expect(Object.keys(INPUT_ACTIONS)).toHaveLength(7);
  });
});
