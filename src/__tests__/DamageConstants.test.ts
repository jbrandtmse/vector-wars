import { describe, it, expect } from 'vitest';
import {
  SCREEN_SHAKE_MAX_INTENSITY,
  SCREEN_SHAKE_DECAY_RATE,
  DAMAGE_FLASH_DECAY_RATE,
  DAMAGE_FLASH_MIN_INTENSITY,
  DAMAGE_FLASH_COLOR,
} from '../config/constants.ts';

describe('Damage effect constants (Story 2-7)', () => {
  it('SCREEN_SHAKE_MAX_INTENSITY is a positive number', () => {
    expect(typeof SCREEN_SHAKE_MAX_INTENSITY).toBe('number');
    expect(SCREEN_SHAKE_MAX_INTENSITY).toBeGreaterThan(0);
  });

  it('SCREEN_SHAKE_DECAY_RATE is a positive number', () => {
    expect(typeof SCREEN_SHAKE_DECAY_RATE).toBe('number');
    expect(SCREEN_SHAKE_DECAY_RATE).toBeGreaterThan(0);
  });

  it('DAMAGE_FLASH_DECAY_RATE is a positive number', () => {
    expect(typeof DAMAGE_FLASH_DECAY_RATE).toBe('number');
    expect(DAMAGE_FLASH_DECAY_RATE).toBeGreaterThan(0);
  });

  it('DAMAGE_FLASH_MIN_INTENSITY is a number between 0 and 1', () => {
    expect(typeof DAMAGE_FLASH_MIN_INTENSITY).toBe('number');
    expect(DAMAGE_FLASH_MIN_INTENSITY).toBeGreaterThan(0);
    expect(DAMAGE_FLASH_MIN_INTENSITY).toBeLessThanOrEqual(1);
  });

  it('DAMAGE_FLASH_COLOR has r, g, b properties that are numbers between 0 and 1', () => {
    expect(typeof DAMAGE_FLASH_COLOR.r).toBe('number');
    expect(typeof DAMAGE_FLASH_COLOR.g).toBe('number');
    expect(typeof DAMAGE_FLASH_COLOR.b).toBe('number');
    expect(DAMAGE_FLASH_COLOR.r).toBeGreaterThanOrEqual(0);
    expect(DAMAGE_FLASH_COLOR.r).toBeLessThanOrEqual(1);
    expect(DAMAGE_FLASH_COLOR.g).toBeGreaterThanOrEqual(0);
    expect(DAMAGE_FLASH_COLOR.g).toBeLessThanOrEqual(1);
    expect(DAMAGE_FLASH_COLOR.b).toBeGreaterThanOrEqual(0);
    expect(DAMAGE_FLASH_COLOR.b).toBeLessThanOrEqual(1);
  });
});
