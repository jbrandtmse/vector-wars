import { describe, it, expect } from 'vitest';
import { SENTINEL_POOL_SIZE } from '../config/constants.ts';

describe('Pool Constants (Story 2-9)', () => {
  describe('SENTINEL_POOL_SIZE', () => {
    it('should be exported', () => {
      expect(SENTINEL_POOL_SIZE).toBeDefined();
    });

    it('should be a positive integer >= 10', () => {
      expect(SENTINEL_POOL_SIZE).toBeGreaterThanOrEqual(10);
      expect(Number.isInteger(SENTINEL_POOL_SIZE)).toBe(true);
    });

    it('should be 20 (max pre-allocated Sentinels for dogfight phase)', () => {
      expect(SENTINEL_POOL_SIZE).toBe(20);
    });
  });
});
