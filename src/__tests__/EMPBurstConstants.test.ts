import { describe, it, expect } from 'vitest';
import {
  EMP_BURST_COOLDOWN,
  EMP_BURST_RADIUS,
  EMP_BURST_STUN_DURATION,
  EMP_BURST_SLOW_FACTOR,
  EMP_BURST_VISUAL_DURATION,
  EMP_BURST_POOL_SIZE,
  EMP_BURST_STUN_PULSE_RATE,
} from '../config/constants.ts';

describe('EMP Burst Constants', () => {
  it('should have EMP_BURST_COOLDOWN > 0', () => {
    expect(EMP_BURST_COOLDOWN).toBeGreaterThan(0);
    expect(EMP_BURST_COOLDOWN).toBe(3.0);
  });

  it('should have EMP_BURST_RADIUS > 0', () => {
    expect(EMP_BURST_RADIUS).toBeGreaterThan(0);
    expect(EMP_BURST_RADIUS).toBe(25);
  });

  it('should have EMP_BURST_STUN_DURATION > 0', () => {
    expect(EMP_BURST_STUN_DURATION).toBeGreaterThan(0);
    expect(EMP_BURST_STUN_DURATION).toBe(3.0);
  });

  it('should have EMP_BURST_SLOW_FACTOR between 0 and 1', () => {
    expect(EMP_BURST_SLOW_FACTOR).toBeGreaterThan(0);
    expect(EMP_BURST_SLOW_FACTOR).toBeLessThan(1);
    expect(EMP_BURST_SLOW_FACTOR).toBe(0.2);
  });

  it('should have EMP_BURST_VISUAL_DURATION > 0', () => {
    expect(EMP_BURST_VISUAL_DURATION).toBeGreaterThan(0);
    expect(EMP_BURST_VISUAL_DURATION).toBe(0.6);
  });

  it('should have EMP_BURST_POOL_SIZE > 0', () => {
    expect(EMP_BURST_POOL_SIZE).toBeGreaterThan(0);
    expect(EMP_BURST_POOL_SIZE).toBe(3);
  });

  it('should have EMP_BURST_STUN_PULSE_RATE > 0', () => {
    expect(EMP_BURST_STUN_PULSE_RATE).toBeGreaterThan(0);
    expect(EMP_BURST_STUN_PULSE_RATE).toBe(6.0);
  });

  it('should have all constants as positive numbers', () => {
    const constants = [
      EMP_BURST_COOLDOWN,
      EMP_BURST_RADIUS,
      EMP_BURST_STUN_DURATION,
      EMP_BURST_SLOW_FACTOR,
      EMP_BURST_VISUAL_DURATION,
      EMP_BURST_POOL_SIZE,
      EMP_BURST_STUN_PULSE_RATE,
    ];
    for (const value of constants) {
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThan(0);
    }
  });
});
