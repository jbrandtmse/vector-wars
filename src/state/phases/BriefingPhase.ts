/**
 * BriefingPhase -- Phase wrapper for the BriefingScreen overlay.
 *
 * Displays a full-screen scrolling briefing between tutorial and gameplay.
 * Implements the standard Phase interface (enter/update/exit/isComplete).
 * BriefingScreen manages its own animation via requestAnimationFrame;
 * update(dt) is a no-op.
 *
 * Created by: Story 4-4
 */

import { BriefingScreen } from '../../ui/screens/BriefingScreen.ts';
import type { BriefingData } from '../../ui/screens/BriefingScreen.ts';
import { Logger } from '../../core/Logger.ts';

export class BriefingPhase {
  private briefingData: BriefingData;
  private briefingScreen: BriefingScreen | null = null;
  private completed = false;

  constructor(briefingData: BriefingData) {
    this.briefingData = briefingData;
  }

  enter(): void {
    Logger.info('BriefingPhase', 'Entering briefing phase');
    this.completed = false;
    this.briefingScreen = new BriefingScreen();
    this.briefingScreen.show(this.briefingData, () => {
      this.completed = true;
      Logger.info('BriefingPhase', 'Briefing complete');
    });
  }

  update(_dt: number): void {
    // BriefingScreen manages its own animation via requestAnimationFrame.
    // No per-frame update needed from the game loop.
  }

  exit(): void {
    Logger.info('BriefingPhase', 'Exiting briefing phase');
    if (this.briefingScreen) {
      this.briefingScreen.dispose();
      this.briefingScreen = null;
    }
  }

  isComplete(): boolean {
    return this.completed;
  }
}
