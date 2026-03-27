import { describe, it, expect } from 'vitest';
import {
  ENEMY_DATA_BURST_POOL_SIZE,
  ENEMY_DATA_BURST_LENGTH,
  ENEMY_DATA_BURST_MAX_RANGE,
  ENEMY_DATA_BURST_COLLIDER_RADIUS,
  PLAYER_MAX_SHIELDS,
  PLAYER_COLLIDER_RADIUS,
  ATTACK_STATE_PATROL_DURATION,
} from '../config/constants.ts';

describe('Enemy Data Burst Constants (Story 2-5)', () => {
  it('should export ENEMY_DATA_BURST_POOL_SIZE as a positive integer', () => {
    expect(ENEMY_DATA_BURST_POOL_SIZE).toBe(30);
    expect(Number.isInteger(ENEMY_DATA_BURST_POOL_SIZE)).toBe(true);
    expect(ENEMY_DATA_BURST_POOL_SIZE).toBeGreaterThan(0);
  });

  it('should export ENEMY_DATA_BURST_LENGTH as a positive number', () => {
    expect(ENEMY_DATA_BURST_LENGTH).toBe(1.5);
    expect(ENEMY_DATA_BURST_LENGTH).toBeGreaterThan(0);
  });

  it('should export ENEMY_DATA_BURST_MAX_RANGE as a positive number', () => {
    expect(ENEMY_DATA_BURST_MAX_RANGE).toBe(80);
    expect(ENEMY_DATA_BURST_MAX_RANGE).toBeGreaterThan(0);
  });

  it('should export ENEMY_DATA_BURST_COLLIDER_RADIUS as a positive number', () => {
    expect(ENEMY_DATA_BURST_COLLIDER_RADIUS).toBe(0.3);
    expect(ENEMY_DATA_BURST_COLLIDER_RADIUS).toBeGreaterThan(0);
  });
});

describe('Player Constants (Story 2-5)', () => {
  it('should export PLAYER_MAX_SHIELDS as a positive number', () => {
    expect(PLAYER_MAX_SHIELDS).toBe(100);
    expect(PLAYER_MAX_SHIELDS).toBeGreaterThan(0);
  });

  it('should export PLAYER_COLLIDER_RADIUS as a positive number', () => {
    expect(PLAYER_COLLIDER_RADIUS).toBe(1.0);
    expect(PLAYER_COLLIDER_RADIUS).toBeGreaterThan(0);
  });
});

describe('Attack State Constants (Story 2-5)', () => {
  it('should export ATTACK_STATE_PATROL_DURATION as a positive number', () => {
    expect(ATTACK_STATE_PATROL_DURATION).toBe(3.0);
    expect(ATTACK_STATE_PATROL_DURATION).toBeGreaterThan(0);
  });
});
