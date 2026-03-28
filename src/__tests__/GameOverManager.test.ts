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

// Mock GameOverScreen (DOM-dependent -- requires document.createElement)
vi.mock('../ui/screens/GameOverScreen.ts', () => ({
  GameOverScreen: class MockGameOverScreen {
    show = vi.fn();
    hide = vi.fn();
    dispose = vi.fn();
    onRestart: ((finalScore: number) => void) | null = null;
  },
}));

describe('GameOverManager (Story 2-10)', () => {
  it('should be exported as a class from systems/GameOverManager', async () => {
    const mod = await import('../systems/GameOverManager.ts');
    expect(mod.GameOverManager).toBeDefined();
    expect(typeof mod.GameOverManager).toBe('function');
  });

  it('should have isGameOver getter that returns false initially', async () => {
    const { GameOverManager } = await import('../systems/GameOverManager.ts');

    const mockScoreManager = { getScore: vi.fn().mockReturnValue(0) };
    const mockHudManager = { hideHUD: vi.fn() };

    const manager = new GameOverManager(
      mockScoreManager as never,
      mockHudManager as never,
    );

    expect(manager.isGameOver).toBe(false);
  });

  it('should accept scoreManager and hudManager as constructor dependencies', async () => {
    const { GameOverManager } = await import('../systems/GameOverManager.ts');

    const mockScoreManager = { getScore: vi.fn().mockReturnValue(0) };
    const mockHudManager = { hideHUD: vi.fn() };

    // Should not throw
    expect(
      () => new GameOverManager(mockScoreManager as never, mockHudManager as never),
    ).not.toThrow();
  });

  it('should subscribe to playerDied event and set isGameOver to true', async () => {
    const { GameOverManager } = await import('../systems/GameOverManager.ts');
    const { eventBus } = await import('../core/GameEvents.ts');

    const mockScoreManager = { getScore: vi.fn().mockReturnValue(12500) };
    const mockHudManager = { hideHUD: vi.fn() };

    const manager = new GameOverManager(
      mockScoreManager as never,
      mockHudManager as never,
    );

    expect(manager.isGameOver).toBe(false);

    // Emit playerDied event
    eventBus.emit('playerDied', {} as Record<string, never>);

    expect(manager.isGameOver).toBe(true);
  });

  it('should call hideHUD when playerDied fires', async () => {
    const { GameOverManager } = await import('../systems/GameOverManager.ts');
    const { eventBus } = await import('../core/GameEvents.ts');

    const mockScoreManager = { getScore: vi.fn().mockReturnValue(0) };
    const mockHudManager = { hideHUD: vi.fn() };

    new GameOverManager(
      mockScoreManager as never,
      mockHudManager as never,
    );

    eventBus.emit('playerDied', {} as Record<string, never>);

    expect(mockHudManager.hideHUD).toHaveBeenCalledOnce();
  });

  it('should expose setOnRestart to configure GameOverScreen callback (Story 5-11)', async () => {
    const { GameOverManager } = await import('../systems/GameOverManager.ts');

    const mockScoreManager = { getScore: vi.fn().mockReturnValue(0) };
    const mockHudManager = { hideHUD: vi.fn() };

    const manager = new GameOverManager(
      mockScoreManager as never,
      mockHudManager as never,
    );

    const callback = vi.fn();
    manager.setOnRestart(callback);

    // The setOnRestart method should exist and not throw
    expect(typeof manager.setOnRestart).toBe('function');
  });
});
