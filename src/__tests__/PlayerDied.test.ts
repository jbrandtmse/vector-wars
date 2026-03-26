import { describe, it, expect, vi } from 'vitest';

// Mock Logger
vi.mock('../core/Logger.ts', () => ({
  Logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('playerDied event type (Story 2-10)', () => {
  it('should include playerDied in GameEvents interface (TypeScript compilation test)', async () => {
    const mod = await import('../core/GameEvents.ts');
    const { eventBus } = mod;

    // If playerDied is not in GameEvents interface, this will cause a TypeScript error
    let received = false;
    const handler = () => {
      received = true;
    };
    eventBus.on('playerDied', handler);
    eventBus.emit('playerDied', {} as Record<string, never>);
    eventBus.off('playerDied', handler);
    expect(received).toBe(true);
  });
});

describe('Player playerDied emission (Story 2-10)', () => {
  it('should emit playerDied when shields reach zero via takeDamage', async () => {
    const { Player } = await import('../entities/player/Player.ts');
    const { eventBus } = await import('../core/GameEvents.ts');

    let playerDiedEmitted = false;
    const handler = () => {
      playerDiedEmitted = true;
    };
    eventBus.on('playerDied', handler);

    const player = new Player();
    // Deal enough damage to deplete shields
    player.takeDamage(player.shields, 'test');

    expect(playerDiedEmitted).toBe(true);
    eventBus.off('playerDied', handler);
  });

  it('should NOT emit playerDied when shields are still above zero', async () => {
    const { Player } = await import('../entities/player/Player.ts');
    const { eventBus } = await import('../core/GameEvents.ts');

    let playerDiedEmitted = false;
    const handler = () => {
      playerDiedEmitted = true;
    };
    eventBus.on('playerDied', handler);

    const player = new Player();
    // Deal damage but not enough to deplete shields
    player.takeDamage(1, 'test');

    expect(playerDiedEmitted).toBe(false);
    eventBus.off('playerDied', handler);
  });

  it('should emit playerDied exactly once even with multiple takeDamage calls after death', async () => {
    const { Player } = await import('../entities/player/Player.ts');
    const { eventBus } = await import('../core/GameEvents.ts');

    let emitCount = 0;
    const handler = () => {
      emitCount++;
    };
    eventBus.on('playerDied', handler);

    const player = new Player();
    // Kill the player
    player.takeDamage(player.shields, 'test');
    // Multiple additional hits after death
    player.takeDamage(0, 'test');
    player.takeDamage(10, 'test');
    player.takeDamage(0, 'test');

    expect(emitCount).toBe(1);
    eventBus.off('playerDied', handler);
  });
});
