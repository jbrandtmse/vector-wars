import { describe, it, expect } from 'vitest';
import {
  SCORE_POPUP_POOL_SIZE,
  SCORE_POPUP_LIFETIME,
  SCORE_POPUP_FLOAT_SPEED,
  SCORE_POPUP_SCALE,
  SCORE_POPUP_MAX_DIGITS,
} from '../config/constants.ts';

describe('Score popup constants (Story 2-8)', () => {
  it('SCORE_POPUP_POOL_SIZE is a positive integer', () => {
    expect(typeof SCORE_POPUP_POOL_SIZE).toBe('number');
    expect(SCORE_POPUP_POOL_SIZE).toBeGreaterThan(0);
    expect(Number.isInteger(SCORE_POPUP_POOL_SIZE)).toBe(true);
  });

  it('SCORE_POPUP_LIFETIME is a positive number', () => {
    expect(typeof SCORE_POPUP_LIFETIME).toBe('number');
    expect(SCORE_POPUP_LIFETIME).toBeGreaterThan(0);
  });

  it('SCORE_POPUP_FLOAT_SPEED is a positive number', () => {
    expect(typeof SCORE_POPUP_FLOAT_SPEED).toBe('number');
    expect(SCORE_POPUP_FLOAT_SPEED).toBeGreaterThan(0);
  });

  it('SCORE_POPUP_SCALE is a positive number between 0 and 2', () => {
    expect(typeof SCORE_POPUP_SCALE).toBe('number');
    expect(SCORE_POPUP_SCALE).toBeGreaterThan(0);
    expect(SCORE_POPUP_SCALE).toBeLessThanOrEqual(2);
  });

  it('SCORE_POPUP_MAX_DIGITS is a positive integer', () => {
    expect(typeof SCORE_POPUP_MAX_DIGITS).toBe('number');
    expect(SCORE_POPUP_MAX_DIGITS).toBeGreaterThan(0);
    expect(Number.isInteger(SCORE_POPUP_MAX_DIGITS)).toBe(true);
  });
});
