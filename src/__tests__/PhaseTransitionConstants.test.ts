import { describe, it, expect } from 'vitest';
import {
  PHASE_TRANSITION_FADE_DURATION,
  PHASE_SHIELD_RECHARGE_AMOUNT,
} from '../config/constants.ts';
import type { PhaseType } from '../types/game.ts';

describe('Phase Transition Constants (Story 3-10)', () => {
  it('PHASE_TRANSITION_FADE_DURATION is a positive number', () => {
    expect(typeof PHASE_TRANSITION_FADE_DURATION).toBe('number');
    expect(PHASE_TRANSITION_FADE_DURATION).toBeGreaterThan(0);
  });

  it('PHASE_TRANSITION_FADE_DURATION is 0.75 seconds', () => {
    expect(PHASE_TRANSITION_FADE_DURATION).toBe(0.75);
  });

  it('PHASE_SHIELD_RECHARGE_AMOUNT is a positive number', () => {
    expect(typeof PHASE_SHIELD_RECHARGE_AMOUNT).toBe('number');
    expect(PHASE_SHIELD_RECHARGE_AMOUNT).toBeGreaterThan(0);
  });

  it('PHASE_SHIELD_RECHARGE_AMOUNT is 30', () => {
    expect(PHASE_SHIELD_RECHARGE_AMOUNT).toBe(30);
  });

  it('PhaseType includes all four phase types', () => {
    // TypeScript type checking ensures the type is correct.
    // We verify by assigning all valid values.
    const dogfight: PhaseType = 'dogfight';
    const surface: PhaseType = 'surface';
    const corridor: PhaseType = 'corridor';
    const boss: PhaseType = 'boss';

    expect(dogfight).toBe('dogfight');
    expect(surface).toBe('surface');
    expect(corridor).toBe('corridor');
    expect(boss).toBe('boss');
  });
});
