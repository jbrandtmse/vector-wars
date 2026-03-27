/**
 * PhaseTransition -- Manages timed fade-out -> swap -> fade-in sequence.
 *
 * Uses the PhaseTransitionShader via RenderPipeline to darken the screen,
 * swap phase content at the midpoint, then fade back in.
 *
 * Architecture: Same enter/update/exit lifecycle as phase classes.
 * Not a State<T> itself -- it's a utility used BY the LevelManager.
 *
 * Created by: Story 3-10
 */

import { PHASE_TRANSITION_FADE_DURATION } from '../../config/constants.ts';
import type { RenderPipeline } from '../../rendering/RenderPipeline.ts';

type TransitionPhase = 'fadeOut' | 'fadeIn';

export class PhaseTransition {
  private renderPipeline: RenderPipeline;
  private fadeDuration: number;
  private active = false;
  private elapsed = 0;
  private phase: TransitionPhase = 'fadeOut';
  private swapCalled = false;
  private onSwap: (() => void) | null = null;
  private onComplete: (() => void) | null = null;

  constructor(renderPipeline: RenderPipeline, fadeDuration: number = PHASE_TRANSITION_FADE_DURATION) {
    this.renderPipeline = renderPipeline;
    this.fadeDuration = fadeDuration;
  }

  /**
   * Begins a fade-out -> swap -> fade-in transition sequence.
   * onSwap fires at the midpoint (fully black). onComplete fires when fade-in finishes.
   */
  start(onSwap: () => void, onComplete: () => void): void {
    this.onSwap = onSwap;
    this.onComplete = onComplete;
    this.active = true;
    this.elapsed = 0;
    this.phase = 'fadeOut';
    this.swapCalled = false;
  }

  /**
   * Advances the transition animation by dt seconds.
   * Must be called each frame while a transition is active.
   */
  update(dt: number): void {
    if (!this.active) return;

    this.elapsed += dt;

    if (this.phase === 'fadeOut') {
      const progress = Math.min(this.elapsed / this.fadeDuration, 1.0);
      this.renderPipeline.setTransitionProgress(progress);

      if (progress >= 1.0) {
        // Call onSwap exactly once at the midpoint
        if (!this.swapCalled) {
          this.swapCalled = true;
          if (this.onSwap) this.onSwap();
        }
        // Reset elapsed for fade-in
        this.elapsed = 0;
        this.phase = 'fadeIn';
      }
    } else if (this.phase === 'fadeIn') {
      const progress = Math.min(this.elapsed / this.fadeDuration, 1.0);
      this.renderPipeline.setTransitionProgress(1.0 - progress);

      if (progress >= 1.0) {
        // Transition complete
        this.renderPipeline.setTransitionProgress(0.0);
        this.active = false;
        if (this.onComplete) this.onComplete();
      }
    }
  }

  /**
   * Returns whether a transition is currently in progress.
   */
  isActive(): boolean {
    return this.active;
  }
}
