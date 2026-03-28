/**
 * EndingScreen -- Full ending sequence HTML overlay displayed after defeating
 * the Core Intelligence. Manages the complete ending: white flash jack-out
 * effect, Ghost's final transmission lines, credits scroll, outro music,
 * and restart prompt.
 *
 * NOT skippable -- the ending is the earned reward (per narrative design).
 * Only the restart prompt after credits responds to input.
 *
 * Created by: Story 5-10
 */

import { getPaletteHexColor, getPaletteCSSGlow, getPaletteCSSMultiGlow } from '../../rendering/PaletteColors.ts';
import { audioManager } from '../../audio/AudioManager.ts';
import { Logger } from '../../core/Logger.ts';
import { BRIEFING_SCROLL_SPEED } from '../../config/constants.ts';

/** Ghost's final transmission lines with timing offsets (ms from sequence start). */
const GHOST_LINES: readonly { text: string; delay: number; style: 'desperate' | 'relief' }[] = [
  { text: "CIPHER! THE NETWORK'S COLLAPSING--", delay: 0, style: 'desperate' },
  { text: "I'M LOSING YOUR SIGNAL--", delay: 1500, style: 'desperate' },
  { text: 'STAY WITH ME! STAY WITH ME!', delay: 3000, style: 'desperate' },
  // Line 4 is a pause with flicker effect (handled by timing gap)
  { text: "...I've got you. You're coming home.", delay: 7000, style: 'relief' },
] as const;

/** Total duration of Ghost transmission phase before credits begin (ms). */
const TRANSMISSION_DURATION = 10000;

/** Duration of the white flash effect (ms). */
const FLASH_DURATION = 1000;

/** Delay before restart prompt is active after it appears (ms). */
const RESTART_GUARD_DELAY = 1000;

/** Credits content sections. */
const CREDITS_SECTIONS: readonly { heading: string; lines: string[] }[] = [
  { heading: '', lines: ['VECTOR WARS'] },
  { heading: 'DESIGN & CODE', lines: ['Developer'] },
  { heading: 'NARRATIVE', lines: ['Developer'] },
  { heading: 'AUDIO', lines: ['Procedural Web Audio Synthesis'] },
  { heading: 'BUILT WITH', lines: ['Three.js', 'Vite', 'TypeScript', 'Web Audio API'] },
  { heading: '', lines: ['Thank you for playing'] },
] as const;

export class EndingScreen {
  private overlay: HTMLDivElement;
  private flashOverlay: HTMLDivElement;
  private transmissionContainer: HTMLDivElement;
  private creditsContainer: HTMLDivElement;
  private creditsScrollContent: HTMLDivElement;
  private restartPrompt: HTMLDivElement;
  private styleElement: HTMLStyleElement | null = null;

  private timers: ReturnType<typeof setTimeout>[] = [];
  private rafId: number | null = null;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;
  private restartEnabled = false;
  private creditsScrollY = 0;
  private creditsScrolling = false;
  private lastFrameTime = 0;

  constructor() {
    this.overlay = document.createElement('div');
    this.flashOverlay = document.createElement('div');
    this.transmissionContainer = document.createElement('div');
    this.creditsContainer = document.createElement('div');
    this.creditsScrollContent = document.createElement('div');
    this.restartPrompt = document.createElement('div');
  }

  /**
   * Show the ending sequence.
   * @param finalScore The player's final score (displayed in credits).
   */
  show(finalScore: number): void {
    Logger.info('EndingScreen', 'Starting ending sequence', { finalScore });

    this.buildDOM(finalScore);
    document.body.appendChild(this.overlay);

    // Stop ambient hum before playing outro music
    audioManager.stopChannel('ambient');

    // Play outro music
    audioManager.playMusic('outro');

    // Play desperate voice line
    audioManager.playVoice('ending_desperate');

    // Phase 1: White flash (jack-out moment)
    requestAnimationFrame(() => {
      this.overlay.style.opacity = '1';
      this.flashOverlay.style.opacity = '1';

      const flashFade = setTimeout(() => {
        this.flashOverlay.style.opacity = '0';
      }, FLASH_DURATION / 2);
      this.timers.push(flashFade);

      // Phase 2: Ghost transmission (after flash fades)
      const transmissionStart = setTimeout(() => {
        this.showTransmission();
      }, FLASH_DURATION);
      this.timers.push(transmissionStart);
    });
  }

  dispose(): void {
    // Clear all timers
    for (const timer of this.timers) {
      clearTimeout(timer);
    }
    this.timers = [];

    // Cancel animation frame
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    // Remove key listener
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }

    // Remove style element
    if (this.styleElement) {
      this.styleElement.remove();
      this.styleElement = null;
    }

    // Remove overlay from DOM
    this.overlay.remove();

    this.creditsScrolling = false;
    this.restartEnabled = false;

    Logger.info('EndingScreen', 'Ending screen disposed');
  }

  private buildDOM(finalScore: number): void {
    const hex = getPaletteHexColor();
    const glow = getPaletteCSSGlow();
    const multiGlow = getPaletteCSSMultiGlow([20, 40]);

    // Inject keyframe animations
    this.styleElement = document.createElement('style');
    this.styleElement.textContent = `
      @keyframes endingPromptPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      @keyframes endingFlicker {
        0% { opacity: 1; }
        10% { opacity: 0.3; }
        20% { opacity: 0.8; }
        30% { opacity: 0.1; }
        40% { opacity: 0.6; }
        50% { opacity: 0; }
        60% { opacity: 0.4; }
        70% { opacity: 0.1; }
        80% { opacity: 0.7; }
        90% { opacity: 0.2; }
        100% { opacity: 0; }
      }
    `;
    document.head.appendChild(this.styleElement);

    // Main overlay container
    Object.assign(this.overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      zIndex: '10',
      pointerEvents: 'auto',
      opacity: '0',
      transition: 'opacity 0.5s ease-in',
      fontFamily: "'Courier New', monospace",
      overflow: 'hidden',
    });

    // White flash overlay (jack-out effect)
    Object.assign(this.flashOverlay.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: '#ffffff',
      opacity: '0',
      transition: `opacity ${FLASH_DURATION / 2}ms ease-out`,
      zIndex: '11',
      pointerEvents: 'none',
    });

    // Ghost transmission container (centered text)
    Object.assign(this.transmissionContainer.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      opacity: '0',
      transition: 'opacity 0.5s ease-in',
    });

    // Credits container (full viewport for scrolling)
    Object.assign(this.creditsContainer.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      overflow: 'hidden',
      opacity: '0',
      transition: 'opacity 1s ease-in',
    });

    // Credits scroll content
    Object.assign(this.creditsScrollContent.style, {
      position: 'absolute',
      top: '100%',
      left: '0',
      width: '100%',
      textAlign: 'center',
    });

    // Build credits content
    // Title (large)
    const titleDiv = document.createElement('div');
    Object.assign(titleDiv.style, {
      fontSize: 'clamp(3rem, 8vw, 6rem)',
      color: hex,
      textShadow: multiGlow,
      letterSpacing: '0.2em',
      marginBottom: '3rem',
      paddingTop: '2rem',
    });
    titleDiv.textContent = 'VECTOR WARS';
    this.creditsScrollContent.appendChild(titleDiv);

    // Separator
    const sep = document.createElement('div');
    Object.assign(sep.style, {
      width: '40%',
      height: '1px',
      backgroundColor: hex,
      boxShadow: glow,
      margin: '0 auto 3rem auto',
    });
    this.creditsScrollContent.appendChild(sep);

    // Final score
    const scoreDiv = document.createElement('div');
    Object.assign(scoreDiv.style, {
      fontSize: 'clamp(1.2rem, 3vw, 2rem)',
      color: hex,
      textShadow: glow,
      marginBottom: '3rem',
    });
    scoreDiv.textContent = `FINAL SCORE: ${finalScore}`;
    this.creditsScrollContent.appendChild(scoreDiv);

    // Credits sections (skip the first which is the title we already added)
    for (let i = 1; i < CREDITS_SECTIONS.length; i++) {
      const section = CREDITS_SECTIONS[i];

      if (section.heading) {
        const headingDiv = document.createElement('div');
        Object.assign(headingDiv.style, {
          fontSize: 'clamp(0.8rem, 1.5vw, 1rem)',
          color: hex,
          textShadow: glow,
          letterSpacing: '0.15em',
          opacity: '0.6',
          marginBottom: '0.5rem',
          marginTop: '2rem',
        });
        headingDiv.textContent = section.heading;
        this.creditsScrollContent.appendChild(headingDiv);
      }

      for (const line of section.lines) {
        const lineDiv = document.createElement('div');
        Object.assign(lineDiv.style, {
          fontSize: 'clamp(1rem, 2vw, 1.4rem)',
          color: hex,
          textShadow: glow,
          lineHeight: '2',
        });
        lineDiv.textContent = line;
        this.creditsScrollContent.appendChild(lineDiv);
      }
    }

    // Bottom padding for scroll
    const bottomPad = document.createElement('div');
    bottomPad.style.height = '5rem';
    this.creditsScrollContent.appendChild(bottomPad);

    this.creditsContainer.appendChild(this.creditsScrollContent);

    // Restart prompt
    Object.assign(this.restartPrompt.style, {
      position: 'absolute',
      bottom: '5%',
      left: '50%',
      transform: 'translateX(-50%)',
      fontSize: 'clamp(0.7rem, 1.5vw, 1rem)',
      color: hex,
      textShadow: glow,
      letterSpacing: '0.15em',
      opacity: '0',
      transition: 'opacity 0.5s ease-in',
      zIndex: '12',
    });
    this.restartPrompt.textContent = 'PRESS SPACE TO PLAY AGAIN';

    this.overlay.appendChild(this.flashOverlay);
    this.overlay.appendChild(this.transmissionContainer);
    this.overlay.appendChild(this.creditsContainer);
    this.overlay.appendChild(this.restartPrompt);
  }

  private showTransmission(): void {
    const hex = getPaletteHexColor();
    const glow = getPaletteCSSGlow();

    this.transmissionContainer.style.opacity = '1';

    // Display Ghost lines with timed delays
    for (const ghostLine of GHOST_LINES) {
      const timer = setTimeout(() => {
        const lineDiv = document.createElement('div');

        if (ghostLine.style === 'relief') {
          // Quiet, relieved tone -- lowercase, softer glow
          Object.assign(lineDiv.style, {
            fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
            color: hex,
            textShadow: getPaletteCSSGlow(5),
            opacity: '0.7',
            marginTop: '1.5rem',
            transition: 'opacity 1s ease-in',
          });
          lineDiv.style.opacity = '0';
          this.transmissionContainer.appendChild(lineDiv);
          lineDiv.textContent = ghostLine.text;
          requestAnimationFrame(() => {
            lineDiv.style.opacity = '0.7';
          });

          // Play relief voice line
          audioManager.playVoice('ending_relief');
        } else {
          // Desperate tone -- uppercase, strong glow
          Object.assign(lineDiv.style, {
            fontSize: 'clamp(1.2rem, 3vw, 2rem)',
            color: hex,
            textShadow: glow,
            marginTop: '0.8rem',
            opacity: '0',
            transition: 'opacity 0.3s ease-in',
          });
          this.transmissionContainer.appendChild(lineDiv);
          lineDiv.textContent = ghostLine.text;
          requestAnimationFrame(() => {
            lineDiv.style.opacity = '1';
          });
        }
      }, ghostLine.delay);
      this.timers.push(timer);
    }

    // Static flicker effect at the pause point (~4.5s)
    const flickerTimer = setTimeout(() => {
      const flickerDiv = document.createElement('div');
      Object.assign(flickerDiv.style, {
        fontSize: 'clamp(0.8rem, 2vw, 1.2rem)',
        color: hex,
        textShadow: glow,
        marginTop: '0.8rem',
        animation: 'endingFlicker 2s ease-in-out forwards',
      });
      flickerDiv.textContent = '/// SIGNAL LOST ///';
      this.transmissionContainer.appendChild(flickerDiv);
    }, 4500);
    this.timers.push(flickerTimer);

    // Transition to credits after transmission completes
    const creditsTimer = setTimeout(() => {
      this.transmissionContainer.style.transition = 'opacity 1s ease-out';
      this.transmissionContainer.style.opacity = '0';

      const showCreditsTimer = setTimeout(() => {
        this.showCredits();
      }, 1000);
      this.timers.push(showCreditsTimer);
    }, TRANSMISSION_DURATION);
    this.timers.push(creditsTimer);
  }

  private showCredits(): void {
    this.creditsContainer.style.opacity = '1';
    this.creditsScrolling = true;
    this.creditsScrollY = 0;
    this.lastFrameTime = performance.now();
    this.rafId = requestAnimationFrame((t) => this.animateCredits(t));
  }

  private animateCredits(time: number): void {
    if (!this.creditsScrolling) return;

    const dt = (time - this.lastFrameTime) / 1000;
    this.lastFrameTime = time;

    this.creditsScrollY += BRIEFING_SCROLL_SPEED * dt;
    this.creditsScrollContent.style.transform = `translateY(calc(100% - ${this.creditsScrollY}px))`;

    // Check if scroll is complete
    const contentHeight = this.creditsScrollContent.offsetHeight;
    const parentHeight = this.creditsScrollContent.parentElement?.offsetHeight ?? 0;
    const totalScrollNeeded = contentHeight + parentHeight;

    if (this.creditsScrollY >= totalScrollNeeded) {
      this.creditsScrolling = false;
      this.showRestartPrompt();
      return;
    }

    this.rafId = requestAnimationFrame((t) => this.animateCredits(t));
  }

  private showRestartPrompt(): void {
    this.restartPrompt.style.opacity = '1';
    this.restartPrompt.style.animation = 'endingPromptPulse 1s ease-in-out infinite';

    const guardTimer = setTimeout(() => {
      this.restartEnabled = true;
      this.keyHandler = (e: KeyboardEvent) => {
        if (e.code === 'Space' && this.restartEnabled) {
          e.preventDefault();
          window.location.reload();
        }
      };
      window.addEventListener('keydown', this.keyHandler);
    }, RESTART_GUARD_DELAY);
    this.timers.push(guardTimer);
  }
}
