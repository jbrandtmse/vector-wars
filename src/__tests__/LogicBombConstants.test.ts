import { describe, it, expect } from 'vitest';
import {
  LOGIC_BOMB_SPEED,
  LOGIC_BOMB_DAMAGE,
  LOGIC_BOMB_MAX_RANGE,
  LOGIC_BOMB_MAX_LIFETIME,
  LOGIC_BOMB_FIRE_COOLDOWN,
  LOGIC_BOMB_TURN_RATE,
  LOGIC_BOMB_LOCK_CONE_ANGLE,
  LOGIC_BOMB_LOCK_RANGE,
  LOGIC_BOMB_MAX_AMMO,
  LOGIC_BOMB_POOL_SIZE,
  LOGIC_BOMB_COLLIDER_RADIUS,
  LOGIC_BOMB_LENGTH,
  DATA_LANCE_BOLT_SPEED,
  DATA_LANCE_BOLT_DAMAGE,
  MAX_POOL_SIZE,
} from '../config/constants.ts';

describe('Logic Bomb Constants', () => {
  it('all constants should be positive numbers', () => {
    expect(LOGIC_BOMB_SPEED).toBeGreaterThan(0);
    expect(LOGIC_BOMB_DAMAGE).toBeGreaterThan(0);
    expect(LOGIC_BOMB_MAX_RANGE).toBeGreaterThan(0);
    expect(LOGIC_BOMB_MAX_LIFETIME).toBeGreaterThan(0);
    expect(LOGIC_BOMB_FIRE_COOLDOWN).toBeGreaterThan(0);
    expect(LOGIC_BOMB_TURN_RATE).toBeGreaterThan(0);
    expect(LOGIC_BOMB_LOCK_CONE_ANGLE).toBeGreaterThan(0);
    expect(LOGIC_BOMB_LOCK_RANGE).toBeGreaterThan(0);
    expect(LOGIC_BOMB_MAX_AMMO).toBeGreaterThan(0);
    expect(LOGIC_BOMB_POOL_SIZE).toBeGreaterThan(0);
    expect(LOGIC_BOMB_COLLIDER_RADIUS).toBeGreaterThan(0);
    expect(LOGIC_BOMB_LENGTH).toBeGreaterThan(0);
  });

  it('LOGIC_BOMB_SPEED should be slower than DATA_LANCE_BOLT_SPEED (weighty feel)', () => {
    expect(LOGIC_BOMB_SPEED).toBeLessThan(DATA_LANCE_BOLT_SPEED);
  });

  it('LOGIC_BOMB_DAMAGE should be greater than DATA_LANCE_BOLT_DAMAGE (high damage)', () => {
    expect(LOGIC_BOMB_DAMAGE).toBeGreaterThan(DATA_LANCE_BOLT_DAMAGE);
  });

  it('LOGIC_BOMB_MAX_AMMO should be exactly 5 per phase', () => {
    expect(LOGIC_BOMB_MAX_AMMO).toBe(5);
  });

  it('LOGIC_BOMB_POOL_SIZE should match MAX_POOL_SIZE.logicBomb', () => {
    expect(LOGIC_BOMB_POOL_SIZE).toBe(MAX_POOL_SIZE.logicBomb);
  });

  it('should have expected specific values per story spec', () => {
    expect(LOGIC_BOMB_SPEED).toBe(30);
    expect(LOGIC_BOMB_DAMAGE).toBe(40);
    expect(LOGIC_BOMB_MAX_RANGE).toBe(80);
    expect(LOGIC_BOMB_MAX_LIFETIME).toBe(4.0);
    expect(LOGIC_BOMB_FIRE_COOLDOWN).toBe(1.0);
    expect(LOGIC_BOMB_TURN_RATE).toBe(3.0);
    expect(LOGIC_BOMB_LOCK_CONE_ANGLE).toBe(0.35);
    expect(LOGIC_BOMB_LOCK_RANGE).toBe(60);
    expect(LOGIC_BOMB_POOL_SIZE).toBe(10);
    expect(LOGIC_BOMB_COLLIDER_RADIUS).toBe(0.8);
    expect(LOGIC_BOMB_LENGTH).toBe(2.0);
  });
});
