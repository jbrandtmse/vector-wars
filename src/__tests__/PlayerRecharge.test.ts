import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Logger
vi.mock('../core/Logger.ts', () => ({
  Logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Player rechargeShields and reset (Story 3-10)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rechargeShields()', () => {
    it('adds specified amount to shields', async () => {
      const { Player } = await import('../entities/player/Player.ts');
      const { PLAYER_MAX_SHIELDS } = await import('../config/constants.ts');

      const player = new Player();
      // Damage player first
      player.takeDamage(50, 'test');
      expect(player.shields).toBe(PLAYER_MAX_SHIELDS - 50);

      player.rechargeShields(30);
      expect(player.shields).toBe(PLAYER_MAX_SHIELDS - 50 + 30);
    });

    it('clamps to maxShields', async () => {
      const { Player } = await import('../entities/player/Player.ts');
      const { PLAYER_MAX_SHIELDS } = await import('../config/constants.ts');

      const player = new Player();
      player.takeDamage(10, 'test');
      player.rechargeShields(999);
      expect(player.shields).toBe(PLAYER_MAX_SHIELDS);
    });

    it('emits shieldChanged event', async () => {
      const { Player } = await import('../entities/player/Player.ts');
      const { eventBus } = await import('../core/GameEvents.ts');

      const player = new Player();
      player.takeDamage(50, 'test');

      const listener = vi.fn();
      eventBus.on('shieldChanged', listener);

      player.rechargeShields(30);

      // Last call should be from rechargeShields
      const lastCall = listener.mock.calls[listener.mock.calls.length - 1];
      expect(lastCall[0]).toEqual({
        shields: player.shields,
        maxShields: player.maxShields,
      });

      eventBus.off('shieldChanged', listener);
    });
  });

  describe('reset()', () => {
    it('restores shields to max', async () => {
      const { Player } = await import('../entities/player/Player.ts');
      const { PLAYER_MAX_SHIELDS } = await import('../config/constants.ts');

      const player = new Player();
      player.takeDamage(80, 'test');
      expect(player.shields).toBe(PLAYER_MAX_SHIELDS - 80);

      player.reset();
      expect(player.shields).toBe(PLAYER_MAX_SHIELDS);
    });

    it('clears dead flag (can take damage again)', async () => {
      const { Player } = await import('../entities/player/Player.ts');
      const { eventBus } = await import('../core/GameEvents.ts');

      const player = new Player();
      // Kill the player
      player.takeDamage(999, 'test');
      expect(player.shields).toBe(0);

      // Track playerDied emissions
      const diedListener = vi.fn();
      eventBus.on('playerDied', diedListener);

      // Reset should clear dead flag
      player.reset();

      // Player should be able to die again
      player.takeDamage(999, 'test');
      expect(diedListener).toHaveBeenCalledTimes(1);

      eventBus.off('playerDied', diedListener);
    });

    it('emits shieldChanged event', async () => {
      const { Player } = await import('../entities/player/Player.ts');
      const { eventBus } = await import('../core/GameEvents.ts');

      const player = new Player();
      player.takeDamage(50, 'test');

      const listener = vi.fn();
      eventBus.on('shieldChanged', listener);

      player.reset();

      const lastCall = listener.mock.calls[listener.mock.calls.length - 1];
      expect(lastCall[0]).toEqual({
        shields: player.maxShields,
        maxShields: player.maxShields,
      });

      eventBus.off('shieldChanged', listener);
    });
  });
});
