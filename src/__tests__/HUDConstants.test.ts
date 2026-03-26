import { describe, it, expect } from 'vitest';
import {
  HUD_SHIELD_BAR_WIDTH,
  HUD_SHIELD_BAR_HEIGHT,
  HUD_SCORE_DIGIT_WIDTH,
  HUD_SCORE_DIGIT_HEIGHT,
  HUD_SCORE_DIGIT_SPACING,
  HUD_SCORE_MAX_DIGITS,
  HUD_Z_DEPTH,
} from '../config/constants.ts';

describe('HUD Constants (Story 2-6)', () => {
  it('should define HUD_SHIELD_BAR_WIDTH as a positive number', () => {
    expect(typeof HUD_SHIELD_BAR_WIDTH).toBe('number');
    expect(HUD_SHIELD_BAR_WIDTH).toBeGreaterThan(0);
    expect(HUD_SHIELD_BAR_WIDTH).toBe(0.3);
  });

  it('should define HUD_SHIELD_BAR_HEIGHT as a positive number', () => {
    expect(typeof HUD_SHIELD_BAR_HEIGHT).toBe('number');
    expect(HUD_SHIELD_BAR_HEIGHT).toBeGreaterThan(0);
    expect(HUD_SHIELD_BAR_HEIGHT).toBe(0.04);
  });

  it('should define HUD_SCORE_DIGIT_WIDTH as a positive number', () => {
    expect(typeof HUD_SCORE_DIGIT_WIDTH).toBe('number');
    expect(HUD_SCORE_DIGIT_WIDTH).toBeGreaterThan(0);
    expect(HUD_SCORE_DIGIT_WIDTH).toBe(0.06);
  });

  it('should define HUD_SCORE_DIGIT_HEIGHT as a positive number', () => {
    expect(typeof HUD_SCORE_DIGIT_HEIGHT).toBe('number');
    expect(HUD_SCORE_DIGIT_HEIGHT).toBeGreaterThan(0);
    expect(HUD_SCORE_DIGIT_HEIGHT).toBe(0.09);
  });

  it('should define HUD_SCORE_DIGIT_SPACING as a positive number', () => {
    expect(typeof HUD_SCORE_DIGIT_SPACING).toBe('number');
    expect(HUD_SCORE_DIGIT_SPACING).toBeGreaterThan(0);
    expect(HUD_SCORE_DIGIT_SPACING).toBe(0.02);
  });

  it('should define HUD_SCORE_MAX_DIGITS as a positive integer', () => {
    expect(typeof HUD_SCORE_MAX_DIGITS).toBe('number');
    expect(HUD_SCORE_MAX_DIGITS).toBeGreaterThan(0);
    expect(Number.isInteger(HUD_SCORE_MAX_DIGITS)).toBe(true);
    expect(HUD_SCORE_MAX_DIGITS).toBe(6);
  });

  it('should define HUD_Z_DEPTH as a negative number', () => {
    expect(typeof HUD_Z_DEPTH).toBe('number');
    expect(HUD_Z_DEPTH).toBeLessThan(0);
    expect(HUD_Z_DEPTH).toBe(-1.5);
  });
});
