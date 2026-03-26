import { describe, it, expect } from 'vitest';
import {
  SHARD_COUNT,
  SHARD_MIN_SPEED,
  SHARD_MAX_SPEED,
  SHARD_MIN_LIFETIME,
  SHARD_MAX_LIFETIME,
  SHARD_LENGTH,
  MAX_ACTIVE_EXPLOSIONS,
} from '../config/constants.ts';

describe('Vector Shard Explosion Constants', () => {
  it('should export SHARD_COUNT as a positive integer', () => {
    expect(typeof SHARD_COUNT).toBe('number');
    expect(SHARD_COUNT).toBeGreaterThan(0);
    expect(Number.isInteger(SHARD_COUNT)).toBe(true);
  });

  it('should have SHARD_MIN_SPEED < SHARD_MAX_SPEED (valid range)', () => {
    expect(typeof SHARD_MIN_SPEED).toBe('number');
    expect(typeof SHARD_MAX_SPEED).toBe('number');
    expect(SHARD_MIN_SPEED).toBeLessThan(SHARD_MAX_SPEED);
  });

  it('should have SHARD_MIN_LIFETIME < SHARD_MAX_LIFETIME (valid range)', () => {
    expect(typeof SHARD_MIN_LIFETIME).toBe('number');
    expect(typeof SHARD_MAX_LIFETIME).toBe('number');
    expect(SHARD_MIN_LIFETIME).toBeLessThan(SHARD_MAX_LIFETIME);
  });

  it('should export SHARD_LENGTH as a positive number', () => {
    expect(typeof SHARD_LENGTH).toBe('number');
    expect(SHARD_LENGTH).toBeGreaterThan(0);
  });

  it('should export MAX_ACTIVE_EXPLOSIONS as a positive integer >= 4', () => {
    expect(typeof MAX_ACTIVE_EXPLOSIONS).toBe('number');
    expect(MAX_ACTIVE_EXPLOSIONS).toBeGreaterThanOrEqual(4);
    expect(Number.isInteger(MAX_ACTIVE_EXPLOSIONS)).toBe(true);
  });

  it('should have SHARD_COUNT * MAX_ACTIVE_EXPLOSIONS <= 200 (within pre-warm budget)', () => {
    expect(SHARD_COUNT * MAX_ACTIVE_EXPLOSIONS).toBeLessThanOrEqual(200);
  });
});
