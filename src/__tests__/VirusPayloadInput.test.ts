import { describe, it, expect } from 'vitest';
import { INPUT_ACTIONS } from '../config/input.ts';
import type { InputAction } from '../config/input.ts';

describe('Virus Payload Input Config', () => {
  it('InputAction type should include virusPayload', () => {
    // TypeScript compile-time check: if virusPayload is not in InputAction,
    // this assignment would produce a type error.
    const action: InputAction = 'virusPayload';
    expect(action).toBe('virusPayload');
  });

  it('INPUT_ACTIONS.virusPayload should be mapped to KeyC', () => {
    expect(INPUT_ACTIONS.virusPayload).toBe('KeyC');
  });

  it('should not conflict with existing action mappings', () => {
    const allKeys = Object.values(INPUT_ACTIONS);
    const keyC = allKeys.filter((k) => k === 'KeyC');
    expect(keyC.length).toBe(1); // Only virusPayload maps to KeyC
  });
});
