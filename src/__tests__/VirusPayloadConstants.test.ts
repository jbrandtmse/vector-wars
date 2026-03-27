import { describe, it, expect } from 'vitest';
import {
  VIRUS_PAYLOAD_SPEED,
  VIRUS_PAYLOAD_DAMAGE,
  VIRUS_PAYLOAD_FIRE_COOLDOWN,
  VIRUS_PAYLOAD_MAX_RANGE,
  VIRUS_PAYLOAD_MAX_LIFETIME,
  VIRUS_PAYLOAD_POOL_SIZE,
  VIRUS_PAYLOAD_COLLIDER_RADIUS,
  VIRUS_PAYLOAD_LENGTH,
  DATA_LANCE_BOLT_SPEED,
  DATA_LANCE_BOLT_DAMAGE,
  LOGIC_BOMB_SPEED,
  LOGIC_BOMB_DAMAGE,
} from '../config/constants.ts';

describe('Virus Payload Constants', () => {
  it('all constants should be positive numbers', () => {
    expect(VIRUS_PAYLOAD_SPEED).toBeGreaterThan(0);
    expect(VIRUS_PAYLOAD_DAMAGE).toBeGreaterThan(0);
    expect(VIRUS_PAYLOAD_FIRE_COOLDOWN).toBeGreaterThan(0);
    expect(VIRUS_PAYLOAD_MAX_RANGE).toBeGreaterThan(0);
    expect(VIRUS_PAYLOAD_MAX_LIFETIME).toBeGreaterThan(0);
    expect(VIRUS_PAYLOAD_POOL_SIZE).toBeGreaterThan(0);
    expect(VIRUS_PAYLOAD_COLLIDER_RADIUS).toBeGreaterThan(0);
    expect(VIRUS_PAYLOAD_LENGTH).toBeGreaterThan(0);
  });

  it('VIRUS_PAYLOAD_SPEED should be slower than DATA_LANCE_BOLT_SPEED (deliberate feel)', () => {
    expect(VIRUS_PAYLOAD_SPEED).toBeLessThan(DATA_LANCE_BOLT_SPEED);
  });

  it('VIRUS_PAYLOAD_SPEED should be slower than LOGIC_BOMB_SPEED (slowest projectile)', () => {
    expect(VIRUS_PAYLOAD_SPEED).toBeLessThan(LOGIC_BOMB_SPEED);
  });

  it('VIRUS_PAYLOAD_DAMAGE should be greater than DATA_LANCE_BOLT_DAMAGE (massive damage)', () => {
    expect(VIRUS_PAYLOAD_DAMAGE).toBeGreaterThan(DATA_LANCE_BOLT_DAMAGE);
  });

  it('VIRUS_PAYLOAD_DAMAGE should be greater than LOGIC_BOMB_DAMAGE (highest damage per shot)', () => {
    expect(VIRUS_PAYLOAD_DAMAGE).toBeGreaterThan(LOGIC_BOMB_DAMAGE);
  });

  it('should have expected specific values per story spec', () => {
    expect(VIRUS_PAYLOAD_SPEED).toBe(20);
    expect(VIRUS_PAYLOAD_DAMAGE).toBe(100);
    expect(VIRUS_PAYLOAD_FIRE_COOLDOWN).toBe(1.5);
    expect(VIRUS_PAYLOAD_MAX_RANGE).toBe(80);
    expect(VIRUS_PAYLOAD_MAX_LIFETIME).toBe(5.0);
    expect(VIRUS_PAYLOAD_POOL_SIZE).toBe(5);
    expect(VIRUS_PAYLOAD_COLLIDER_RADIUS).toBe(1.0);
    expect(VIRUS_PAYLOAD_LENGTH).toBe(3.0);
  });
});
