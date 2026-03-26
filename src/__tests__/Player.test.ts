import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';

// Mock Logger
vi.mock('../core/Logger.ts', () => ({
  Logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Player', () => {
  it('should be exported as a class from entities/player/Player', async () => {
    const mod = await import('../entities/player/Player.ts');
    expect(mod.Player).toBeDefined();
    expect(typeof mod.Player).toBe('function');
  });

  it('should have takeDamage method on prototype', async () => {
    const mod = await import('../entities/player/Player.ts');
    expect(typeof mod.Player.prototype.takeDamage).toBe('function');
  });

  it('should have syncToCamera method on prototype', async () => {
    const mod = await import('../entities/player/Player.ts');
    expect(typeof mod.Player.prototype.syncToCamera).toBe('function');
  });

  it('should construct with shields, maxShields, and collider properties', async () => {
    const { Player } = await import('../entities/player/Player.ts');
    const { PLAYER_MAX_SHIELDS } = await import('../config/constants.ts');

    const player = new Player();

    expect(player.shields).toBe(PLAYER_MAX_SHIELDS);
    expect(player.maxShields).toBe(PLAYER_MAX_SHIELDS);
    expect(player.collider).toBeInstanceOf(THREE.Sphere);
  });

  it('should reduce shields on takeDamage', async () => {
    const { Player } = await import('../entities/player/Player.ts');
    const { PLAYER_MAX_SHIELDS } = await import('../config/constants.ts');

    const player = new Player();
    player.takeDamage(25, 'test');

    expect(player.shields).toBe(PLAYER_MAX_SHIELDS - 25);
  });

  it('should clamp shields to minimum 0', async () => {
    const { Player } = await import('../entities/player/Player.ts');

    const player = new Player();
    player.takeDamage(999, 'test');

    expect(player.shields).toBe(0);
  });

  it('should sync collider center to camera position', async () => {
    const { Player } = await import('../entities/player/Player.ts');

    const player = new Player();
    const camera = new THREE.PerspectiveCamera();
    camera.position.set(10, 20, 30);

    player.syncToCamera(camera);

    expect(player.collider.center.x).toBeCloseTo(10, 5);
    expect(player.collider.center.y).toBeCloseTo(20, 5);
    expect(player.collider.center.z).toBeCloseTo(30, 5);
  });

  it('should subscribe to playerHit events via EventBus', async () => {
    const { Player } = await import('../entities/player/Player.ts');
    const { eventBus } = await import('../core/GameEvents.ts');
    const { PLAYER_MAX_SHIELDS } = await import('../config/constants.ts');

    const player = new Player();
    eventBus.emit('playerHit', { damage: 15, source: 'enemyDataBurst' });

    expect(player.shields).toBe(PLAYER_MAX_SHIELDS - 15);

    // Clean up - remove the listener by creating damage that doesn't matter
    // (Player subscribes in constructor, no public unsubscribe)
  });
});
