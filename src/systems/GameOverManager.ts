/**
 * GameOverManager -- Orchestrates the game over sequence.
 *
 * Subscribes to playerDied event. Freezes gameplay, shows game over screen,
 * hides HUD. Does NOT import Player or any game entity.
 *
 * Created by: Story 2-10
 */
import { eventBus } from '../core/GameEvents.ts';
import { Logger } from '../core/Logger.ts';
import { GameOverScreen } from '../ui/screens/GameOverScreen.ts';
import type { ScoreManager } from './ScoreManager.ts';
import type { HUDManager } from '../ui/hud/HUDManager.ts';

export class GameOverManager {
  private gameOverScreen: GameOverScreen;
  private scoreManager: ScoreManager;
  private hudManager: HUDManager;
  private gameOverActive = false;

  /**
   * When true, triggerGameOver() is a no-op. Set by LevelManager
   * during level play to enable phase checkpoint restarts instead
   * of game over on death.
   */
  public preventGameOver = false;

  constructor(scoreManager: ScoreManager, hudManager: HUDManager) {
    this.scoreManager = scoreManager;
    this.hudManager = hudManager;
    this.gameOverScreen = new GameOverScreen();

    eventBus.on('playerDied', () => {
      this.triggerGameOver();
    });

    Logger.info('GameOverManager', 'GameOverManager initialized');
  }

  private triggerGameOver(): void {
    if (this.gameOverActive) return; // guard against duplicate events
    if (this.preventGameOver) return; // LevelManager handles death via checkpoint (Story 3-10)
    this.gameOverActive = true;

    const finalScore = this.scoreManager.getScore();

    // Hide HUD so it doesn't overlap game over screen
    this.hudManager.hideHUD();

    // Show game over overlay
    this.gameOverScreen.show(finalScore);

    Logger.info('GameOverManager', 'Game over triggered', { finalScore });
  }

  get isGameOver(): boolean {
    return this.gameOverActive;
  }

  /**
   * Sets a callback on the GameOverScreen that is invoked when the player
   * presses Space instead of immediately reloading. Used by HighScoreScreen
   * integration to intercept restart and show the high score table.
   */
  setOnRestart(callback: ((finalScore: number) => void) | null): void {
    this.gameOverScreen.onRestart = callback;
  }
}
