import { describe, it, expect } from 'vitest';
import { calculateDeltaTime } from '../core/DeltaTime.ts';
import { DELTA_TIME_CAP } from '../config/constants.ts';

describe('calculateDeltaTime', () => {
  it('should convert milliseconds to seconds', () => {
    // 16.67ms = ~1/60th of a second (60fps)
    const dt = calculateDeltaTime(1016.67, 1000);
    expect(dt).toBeCloseTo(0.01667, 4);
  });

  it('should return 0 when current and last time are equal', () => {
    const dt = calculateDeltaTime(1000, 1000);
    expect(dt).toBe(0);
  });

  it('should cap delta time at DELTA_TIME_CAP (1/20 = 0.05s)', () => {
    // Simulate a 1 second gap (tab switch scenario)
    const dt = calculateDeltaTime(2000, 1000);
    expect(dt).toBe(DELTA_TIME_CAP);
    expect(dt).toBe(1 / 20);
  });

  it('should cap delta time for very large gaps', () => {
    // Simulate a 10 second gap
    const dt = calculateDeltaTime(11000, 1000);
    expect(dt).toBe(DELTA_TIME_CAP);
  });

  it('should not cap normal frame times (60fps)', () => {
    const dt = calculateDeltaTime(1016.67, 1000);
    expect(dt).toBeLessThan(DELTA_TIME_CAP);
  });

  it('should not cap at 30fps frame times', () => {
    // 33.33ms = ~1/30th of a second
    const dt = calculateDeltaTime(1033.33, 1000);
    expect(dt).toBeCloseTo(0.03333, 4);
    expect(dt).toBeLessThan(DELTA_TIME_CAP);
  });

  it('should cap at exactly the boundary (50ms)', () => {
    const dt = calculateDeltaTime(1050, 1000);
    expect(dt).toBe(DELTA_TIME_CAP);
  });

  it('should handle first frame correctly (lastTime = 0)', () => {
    // First frame: time = 16.67ms, lastTime = 0
    const dt = calculateDeltaTime(16.67, 0);
    expect(dt).toBeCloseTo(0.01667, 4);
  });

  it('should clamp negative time differences to 0', () => {
    // Guard against time going backwards (should never happen but defensive)
    const dt = calculateDeltaTime(500, 1000);
    expect(dt).toBe(0);
  });
});
