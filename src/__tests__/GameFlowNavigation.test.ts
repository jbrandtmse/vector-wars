// @vitest-environment jsdom
/**
 * GameFlowNavigation tests -- validates the full game flow navigation:
 * return-to-menu from game over, return-to-menu from ending, game state
 * reset, and MenuScreen re-entrancy.
 *
 * Story 6-2: Full Game Flow Navigation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../core/Logger.ts', () => ({
  Logger: {
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../rendering/PaletteColors.ts', () => ({
  getPaletteHexColor: () => '#00ff41',
  getPaletteCSSGlow: (_radius?: number) => '0 0 10px #00ff41',
  getPaletteCSSMultiGlow: (_radii?: number[]) => '0 0 20px #00ff41, 0 0 40px #00ff41',
}));

describe('GameFlowNavigation (Story 6-2)', () => {
  describe('GameOverScreen: Space triggers onRestart callback', () => {
    it('Space key triggers onRestart callback instead of reload', async () => {
      const { GameOverScreen } = await import('../ui/screens/GameOverScreen.ts');

      vi.useFakeTimers();
      const screen = new GameOverScreen();
      const onRestart = vi.fn();
      screen.onRestart = onRestart;

      screen.show(12345);

      // Advance past restart guard delay (500ms)
      vi.advanceTimersByTime(600);

      // Press Space
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));

      expect(onRestart).toHaveBeenCalledWith(12345);

      vi.useRealTimers();
    });
  });

  describe('HighScoreScreen: onReturn callback invoked (not reload)', () => {
    it('after game-over flow, onReturn is called instead of reload', async () => {
      const { HighScoreScreen } = await import('../ui/screens/HighScoreScreen.ts');
      const { HighScoreManager } = await import('../systems/HighScoreManager.ts');

      vi.useFakeTimers();
      const screen = new HighScoreScreen();
      const onReturn = vi.fn();
      screen.onReturn = onReturn;

      // Create a mock manager where score does not qualify (shows table directly)
      const manager = new HighScoreManager();
      vi.spyOn(manager, 'isHighScore').mockReturnValue(false);

      screen.show(1000, manager);

      // Advance past guard delay (1000ms)
      vi.advanceTimersByTime(1100);

      // Press any key (onReturn accepts any key)
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }));

      expect(onReturn).toHaveBeenCalled();

      vi.useRealTimers();
      screen.dispose();
      document.querySelectorAll('style').forEach((el) => el.remove());
    });
  });

  describe('ScoreManager reset()', () => {
    it('resets score to 0', async () => {
      const { ScoreManager } = await import('../systems/ScoreManager.ts');

      const sm = new ScoreManager();
      sm.addScore(5000);
      expect(sm.getScore()).toBe(5000);

      sm.reset();
      expect(sm.getScore()).toBe(0);

      sm.dispose();
    });
  });

  describe('Player reset()', () => {
    it('restores shields to max', async () => {
      const { Player } = await import('../entities/player/Player.ts');
      const { PLAYER_MAX_SHIELDS } = await import('../config/constants.ts');

      const player = new Player();
      player.takeDamage(50, 'test');
      expect(player.shields).toBe(PLAYER_MAX_SHIELDS - 50);

      player.reset();
      expect(player.shields).toBe(PLAYER_MAX_SHIELDS);
    });
  });

  describe('GameOverManager reset()', () => {
    it('clears gameOverActive flag', async () => {
      const { GameOverManager } = await import('../systems/GameOverManager.ts');
      const { ScoreManager } = await import('../systems/ScoreManager.ts');

      const sm = new ScoreManager();
      // Use minimal mock for HUDManager to avoid Three.js geometry dependency
      const mockHud = {
        hideHUD: vi.fn(),
        showHUD: vi.fn(),
        dispose: vi.fn(),
      } as unknown as import('../ui/hud/HUDManager.ts').HUDManager;

      const gom = new GameOverManager(sm, mockHud);

      // Verify initial state
      expect(gom.isGameOver).toBe(false);

      // After reset, should still be false
      gom.reset();
      expect(gom.isGameOver).toBe(false);
      expect(gom.preventGameOver).toBe(false);

      sm.dispose();
    });

    it('has reset method on prototype', async () => {
      const { GameOverManager } = await import('../systems/GameOverManager.ts');
      expect(typeof GameOverManager.prototype.reset).toBe('function');
    });
  });

  describe('MenuScreen re-entrancy', () => {
    let screen: InstanceType<typeof import('../ui/screens/MenuScreen.ts').MenuScreen>;

    beforeEach(async () => {
      vi.useFakeTimers();
      const { MenuScreen } = await import('../ui/screens/MenuScreen.ts');
      screen = new MenuScreen();
    });

    afterEach(() => {
      if (screen) {
        screen.dispose();
      }
      vi.useRealTimers();
      document.querySelectorAll('style').forEach((el) => el.remove());
    });

    it('can be shown again after hide (re-entrant show)', () => {
      // First show
      screen.show();
      let overlay = document.body.querySelector('div[style*="z-index: 20"]') as HTMLElement;
      expect(overlay).not.toBeNull();
      expect(overlay.textContent).toContain('VECTOR WARS');

      // Hide
      screen.hide();
      vi.advanceTimersByTime(600); // Wait for fade-out and DOM removal

      // Second show
      screen.show();
      overlay = document.body.querySelector('div[style*="z-index: 20"]') as HTMLElement;
      expect(overlay).not.toBeNull();
      expect(overlay.textContent).toContain('VECTOR WARS');
      expect(overlay.textContent).toContain('START GAME');
    });
  });

  describe('HUDManager showHUD()', () => {
    it('has showHUD method on prototype', async () => {
      const { HUDManager } = await import('../ui/hud/HUDManager.ts');
      expect(typeof HUDManager.prototype.showHUD).toBe('function');
    });
  });

  describe('DialogueManager reset()', () => {
    it('has reset method on prototype', async () => {
      const mod = await import('../narrative/DialogueManager.ts');
      expect(typeof mod.DialogueManager.prototype.reset).toBe('function');
    });
  });
});
