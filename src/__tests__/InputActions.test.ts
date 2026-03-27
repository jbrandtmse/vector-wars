import { describe, it, expect } from 'vitest';
import { INPUT_ACTIONS } from '../config/input.ts';
import type { InputAction } from '../config/input.ts';

describe('Input Actions', () => {
  it('should have logicBomb action defined in INPUT_ACTIONS', () => {
    expect(INPUT_ACTIONS).toHaveProperty('logicBomb');
  });

  it('should map logicBomb to KeyZ (physical key code)', () => {
    expect(INPUT_ACTIONS.logicBomb).toBe('KeyZ');
  });

  it('should use KeyboardEvent.code values (not event.key)', () => {
    // All mappings should use physical key codes
    const values = Object.values(INPUT_ACTIONS);
    for (const value of values) {
      // Physical key codes are PascalCase or Arrow-prefixed
      expect(value).toMatch(/^[A-Z]/);
    }
  });

  it('should include logicBomb in the InputAction type', () => {
    // TypeScript compile-time check: this assignment must not error
    const action: InputAction = 'logicBomb';
    expect(action).toBe('logicBomb');
  });
});
