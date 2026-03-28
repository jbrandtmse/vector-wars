/**
 * BriefingScreen -- Full-screen HTML overlay displaying scrolling vector-styled
 * mission briefing text. "Star Wars crawl meets vector aesthetic."
 *
 * Creates DOM elements dynamically. Scrolling text moves upward via
 * requestAnimationFrame-driven translateY. Skippable via any key press
 * after a guard delay.
 *
 * Created by: Story 4-4
 */

import {
  BRIEFING_SCROLL_SPEED,
  BRIEFING_SKIP_GUARD_DELAY,
  BRIEFING_HOLD_DURATION,
  BRIEFING_FADE_DURATION,
} from '../../config/constants.ts';
import { getPaletteHexColor, getPaletteCSSGlow, getPaletteCSSMultiGlow } from '../../rendering/PaletteColors.ts';

export interface BriefingData {
  title: string;
  lines: string[];
  speaker: string;
  voiceLineId?: string;
}

export class BriefingScreen {
  private overlay: HTMLDivElement;
  private scrollContent: HTMLDivElement;
  private skipPrompt: HTMLDivElement;
  private styleElement: HTMLStyleElement | null = null;

  private onCompleteCallback: (() => void) | null = null;
  private scrollY = 0;
  private scrolling = false;
  private skipEnabled = false;
  private completed = false;
  private rafId: number | null = null;
  private skipGuardTimer: ReturnType<typeof setTimeout> | null = null;
  private holdTimer: ReturnType<typeof setTimeout> | null = null;
  private lastFrameTime = 0;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor() {
    this.overlay = document.createElement('div');
    this.scrollContent = document.createElement('div');
    this.skipPrompt = document.createElement('div');
  }

  show(briefingData: BriefingData, onComplete: () => void): void {
    this.onCompleteCallback = onComplete;
    this.completed = false;
    this.scrollY = 0;
    this.scrolling = false;
    this.skipEnabled = false;

    this.buildDOM(briefingData);
    document.body.appendChild(this.overlay);

    // Fade in
    requestAnimationFrame(() => {
      this.overlay.style.opacity = '1';

      // Start scrolling after fade-in completes
      setTimeout(() => {
        this.scrolling = true;
        this.lastFrameTime = performance.now();
        this.rafId = requestAnimationFrame((t) => this.animateScroll(t));
      }, BRIEFING_FADE_DURATION * 1000);
    });

    // Skip guard delay
    this.skipGuardTimer = setTimeout(() => {
      this.skipEnabled = true;
      this.skipPrompt.style.display = 'block';
      requestAnimationFrame(() => {
        this.skipPrompt.style.opacity = '1';
      });
    }, BRIEFING_SKIP_GUARD_DELAY * 1000);

    // Key listener
    this.keyHandler = (e: KeyboardEvent) => {
      e.preventDefault();
      if (this.skipEnabled && !this.completed) {
        this.skip();
      }
    };
    window.addEventListener('keydown', this.keyHandler);
  }

  skip(): void {
    if (this.completed) return;

    // Stop scrolling
    this.scrolling = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    // Show all text immediately (reset scroll to show everything)
    this.scrollContent.style.transform = 'translateY(0)';

    // Trigger complete after brief hold
    setTimeout(() => {
      this.triggerComplete();
    }, 500);
  }

  dispose(): void {
    this.scrolling = false;
    this.completed = true;

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.skipGuardTimer !== null) {
      clearTimeout(this.skipGuardTimer);
      this.skipGuardTimer = null;
    }

    if (this.holdTimer !== null) {
      clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }

    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }

    this.overlay.remove();

    if (this.styleElement) {
      this.styleElement.remove();
      this.styleElement = null;
    }

    this.onCompleteCallback = null;
  }

  private buildDOM(briefingData: BriefingData): void {
    // Inject keyframe animation for skip prompt pulse
    this.styleElement = document.createElement('style');
    this.styleElement.textContent = `
      @keyframes briefingPromptPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
    `;
    document.head.appendChild(this.styleElement);

    // Overlay container -- full viewport, dark background
    Object.assign(this.overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.92)',
      zIndex: '8',
      pointerEvents: 'auto',
      opacity: '0',
      transition: `opacity ${BRIEFING_FADE_DURATION}s ease-in`,
      fontFamily: "'Courier New', monospace",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      overflow: 'hidden',
    });

    // Header title
    const hex = getPaletteHexColor();
    const glow = getPaletteCSSGlow();
    const multiGlow = getPaletteCSSMultiGlow([20, 40]);
    const header = document.createElement('div');
    Object.assign(header.style, {
      fontSize: 'clamp(2rem, 5vw, 3.5rem)',
      color: hex,
      textShadow: multiGlow,
      letterSpacing: '0.2em',
      marginTop: '8%',
      textAlign: 'center',
    });
    header.textContent = briefingData.title || 'MISSION BRIEFING';

    // Separator line
    const separator = document.createElement('div');
    Object.assign(separator.style, {
      width: '60%',
      height: '1px',
      backgroundColor: hex,
      boxShadow: glow,
      marginTop: '1.5rem',
      marginBottom: '2rem',
    });

    // Scroll region container (clips content)
    const scrollRegion = document.createElement('div');
    Object.assign(scrollRegion.style, {
      width: '60%',
      maxWidth: '700px',
      flex: '1',
      overflow: 'hidden',
      position: 'relative',
    });

    // Scrolling content
    Object.assign(this.scrollContent.style, {
      position: 'absolute',
      top: '100%',
      left: '0',
      width: '100%',
    });

    // Add text paragraphs
    for (const line of briefingData.lines) {
      const paragraph = document.createElement('p');
      Object.assign(paragraph.style, {
        fontSize: 'clamp(0.9rem, 2vw, 1.3rem)',
        color: hex,
        textShadow: glow,
        lineHeight: '1.8',
        marginBottom: '1.5rem',
        marginTop: '0',
      });
      paragraph.textContent = line;
      this.scrollContent.appendChild(paragraph);
    }

    scrollRegion.appendChild(this.scrollContent);

    // Skip prompt
    Object.assign(this.skipPrompt.style, {
      position: 'absolute',
      bottom: '5%',
      left: '50%',
      transform: 'translateX(-50%)',
      fontSize: 'clamp(0.7rem, 1.5vw, 1rem)',
      color: hex,
      textShadow: glow,
      letterSpacing: '0.15em',
      opacity: '0',
      transition: 'opacity 0.3s ease-in',
      display: 'none',
      animation: 'briefingPromptPulse 0.67s ease-in-out infinite',
    });
    this.skipPrompt.textContent = 'PRESS ANY KEY TO CONTINUE';

    this.overlay.appendChild(header);
    this.overlay.appendChild(separator);
    this.overlay.appendChild(scrollRegion);
    this.overlay.appendChild(this.skipPrompt);
  }

  private animateScroll(time: number): void {
    if (!this.scrolling) return;

    const dt = (time - this.lastFrameTime) / 1000;
    this.lastFrameTime = time;

    this.scrollY += BRIEFING_SCROLL_SPEED * dt;
    this.scrollContent.style.transform = `translateY(calc(100% - ${this.scrollY}px))`;

    // Check if scroll is complete (content has scrolled past viewport)
    const contentHeight = this.scrollContent.offsetHeight;
    const parentHeight = this.scrollContent.parentElement?.offsetHeight ?? 0;
    const totalScrollNeeded = contentHeight + parentHeight;

    if (this.scrollY >= totalScrollNeeded) {
      // Scroll complete — hold then trigger onComplete
      this.scrolling = false;
      this.holdTimer = setTimeout(() => {
        this.triggerComplete();
      }, BRIEFING_HOLD_DURATION * 1000);
      return;
    }

    this.rafId = requestAnimationFrame((t) => this.animateScroll(t));
  }

  private triggerComplete(): void {
    if (this.completed) return;
    this.completed = true;

    // Fade out
    this.overlay.style.transition = `opacity ${BRIEFING_FADE_DURATION}s ease-out`;
    this.overlay.style.opacity = '0';

    setTimeout(() => {
      if (this.onCompleteCallback) {
        this.onCompleteCallback();
      }
    }, BRIEFING_FADE_DURATION * 1000);
  }
}
