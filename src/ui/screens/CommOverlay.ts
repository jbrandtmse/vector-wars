/**
 * CommOverlay — HTML overlay for displaying handler/AI dialogue text.
 *
 * Creates and manages a fixed-position DOM element at bottom-left of viewport.
 * Displays speaker label and message text with typewriter reveal effect.
 * Follows the same DOM creation pattern as GameOverScreen.ts.
 *
 * Created by: Story 4-1
 */

import {
  COMM_TYPEWRITER_SPEED,
  COMM_FADE_IN_DURATION,
  COMM_FADE_OUT_DURATION,
} from '../../config/constants.ts';

export class CommOverlay {
  private container: HTMLDivElement;
  private speakerLabel: HTMLDivElement;
  private separator: HTMLDivElement;
  private messageText: HTMLDivElement;
  private fullText = '';
  private revealProgress = 0;
  private visible = false;
  private hideTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.container = document.createElement('div');
    this.speakerLabel = document.createElement('div');
    this.separator = document.createElement('div');
    this.messageText = document.createElement('div');
    this.buildDOM();
  }

  private buildDOM(): void {
    // Container — fixed bottom-left, above shield bar area
    Object.assign(this.container.style, {
      position: 'fixed',
      bottom: '12%',
      left: '3%',
      maxWidth: '45%',
      zIndex: '5',
      pointerEvents: 'none',
      opacity: '0',
      transition: `opacity ${COMM_FADE_IN_DURATION}s ease-in`,
      fontFamily: "'Courier New', monospace",
    });

    // Speaker label — monospace, uppercase, green with glow
    Object.assign(this.speakerLabel.style, {
      fontSize: 'clamp(0.7rem, 1.5vw, 1rem)',
      color: '#00ff41',
      textShadow: '0 0 10px #00ff41',
      letterSpacing: '0.15em',
      marginBottom: '0.3em',
    });

    // Separator line — 1px green with glow
    Object.assign(this.separator.style, {
      height: '1px',
      backgroundColor: '#00ff41',
      boxShadow: '0 0 10px #00ff41',
      marginBottom: '0.4em',
    });

    // Message text — monospace, green with glow
    Object.assign(this.messageText.style, {
      fontSize: 'clamp(0.8rem, 1.8vw, 1.1rem)',
      color: '#00ff41',
      textShadow: '0 0 10px #00ff41',
      lineHeight: '1.4',
    });

    this.container.appendChild(this.speakerLabel);
    this.container.appendChild(this.separator);
    this.container.appendChild(this.messageText);
    document.body.appendChild(this.container);

    // Initially hidden
    this.container.style.display = 'none';
  }

  show(speaker: string, text: string, color?: string): void {
    // Cancel any pending hide timeout
    if (this.hideTimeout !== null) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    this.speakerLabel.textContent = speaker.toUpperCase();
    this.fullText = text;
    this.revealProgress = 0;
    this.messageText.textContent = '';

    if (color) {
      this.speakerLabel.style.color = color;
      this.speakerLabel.style.textShadow = `0 0 10px ${color}`;
      this.messageText.style.color = color;
      this.messageText.style.textShadow = `0 0 10px ${color}`;
      this.separator.style.backgroundColor = color;
      this.separator.style.boxShadow = `0 0 10px ${color}`;
    } else {
      // Reset to default green
      this.speakerLabel.style.color = '#00ff41';
      this.speakerLabel.style.textShadow = '0 0 10px #00ff41';
      this.messageText.style.color = '#00ff41';
      this.messageText.style.textShadow = '0 0 10px #00ff41';
      this.separator.style.backgroundColor = '#00ff41';
      this.separator.style.boxShadow = '0 0 10px #00ff41';
    }

    this.container.style.display = 'block';
    this.container.style.transition = `opacity ${COMM_FADE_IN_DURATION}s ease-in`;

    // Trigger fade-in on next frame to ensure display:block is painted first
    requestAnimationFrame(() => {
      this.container.style.opacity = '1';
    });

    this.visible = true;
  }

  update(dt: number): void {
    if (!this.visible || this.fullText.length === 0) return;

    const totalChars = this.fullText.length;
    if (this.revealProgress < totalChars) {
      this.revealProgress += dt * COMM_TYPEWRITER_SPEED;
      const charsToShow = Math.min(Math.floor(this.revealProgress), totalChars);
      this.messageText.textContent = this.fullText.substring(0, charsToShow);
    }
  }

  hide(): void {
    if (!this.visible) return;

    this.container.style.transition = `opacity ${COMM_FADE_OUT_DURATION}s ease-out`;
    this.container.style.opacity = '0';

    // After transition completes, hide the element
    this.hideTimeout = setTimeout(() => {
      this.container.style.display = 'none';
      this.visible = false;
      this.hideTimeout = null;
    }, COMM_FADE_OUT_DURATION * 1000);
  }

  isVisible(): boolean {
    return this.visible;
  }

  dispose(): void {
    if (this.hideTimeout !== null) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    this.visible = false;
    this.container.remove();
  }
}
