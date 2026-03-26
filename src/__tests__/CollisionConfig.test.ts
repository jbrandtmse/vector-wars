import { describe, it, expect } from 'vitest';
import {
  DATA_LANCE_BOLT_DAMAGE,
  SENTINEL_HEALTH,
} from '../config/constants.ts';

describe('Collision/Damage Constants', () => {
  it('should export DATA_LANCE_BOLT_DAMAGE as a positive number', () => {
    expect(typeof DATA_LANCE_BOLT_DAMAGE).toBe('number');
    expect(DATA_LANCE_BOLT_DAMAGE).toBeGreaterThan(0);
  });

  it('should have DATA_LANCE_BOLT_DAMAGE between 5 and 15 (sanity range)', () => {
    expect(DATA_LANCE_BOLT_DAMAGE).toBeGreaterThanOrEqual(5);
    expect(DATA_LANCE_BOLT_DAMAGE).toBeLessThanOrEqual(15);
  });

  it('should kill Sentinel in 2-6 hits (balance validation)', () => {
    const hitsToKill = SENTINEL_HEALTH / DATA_LANCE_BOLT_DAMAGE;
    expect(hitsToKill).toBeGreaterThanOrEqual(2);
    expect(hitsToKill).toBeLessThanOrEqual(6);
  });
});
