/**
 * GameOverScreen -- HTML overlay displayed when player dies.
 *
 * Creates DOM elements dynamically. Shows GAME OVER text, final score,
 * and RESTART prompt. Fades in with CSS transition.
 * Keyboard-only input: Space to restart (with delay guard).
 *
 * Created by: Story 2-10
 */
export class GameOverScreen {
  private overlay: HTMLDivElement;
  private scoreElement: HTMLSpanElement;
  private restartEnabled = false;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor() {
    this.overlay = document.createElement('div');
    this.scoreElement = document.createElement('span');
    this.buildDOM();
  }

  private buildDOM(): void {
    // Overlay container -- full viewport, centered flex layout
    Object.assign(this.overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: '10',
      opacity: '0',
      transition: 'opacity 0.5s ease-in',
      pointerEvents: 'none',
      fontFamily: "'Courier New', monospace",
    });

    // GAME OVER title
    const title = document.createElement('div');
    Object.assign(title.style, {
      fontSize: 'clamp(3rem, 8vw, 6rem)',
      color: '#00ff41',
      textShadow: '0 0 20px #00ff41, 0 0 40px #00ff41, 0 0 80px #00ff41',
      letterSpacing: '0.15em',
      marginBottom: '2rem',
    });
    title.textContent = 'GAME OVER';

    // Score line
    const scoreLine = document.createElement('div');
    Object.assign(scoreLine.style, {
      fontSize: 'clamp(1.2rem, 3vw, 2rem)',
      color: '#00ff41',
      textShadow: '0 0 10px #00ff41',
      marginBottom: '3rem',
    });
    scoreLine.textContent = 'SCORE: ';
    this.scoreElement.textContent = '0';
    scoreLine.appendChild(this.scoreElement);

    // Restart prompt
    const prompt = document.createElement('div');
    Object.assign(prompt.style, {
      fontSize: 'clamp(0.8rem, 2vw, 1.2rem)',
      color: '#00ff41',
      textShadow: '0 0 10px #00ff41',
      opacity: '0.7',
    });
    prompt.textContent = 'PRESS SPACE TO RESTART';

    this.overlay.appendChild(title);
    this.overlay.appendChild(scoreLine);
    this.overlay.appendChild(prompt);
  }

  show(finalScore: number): void {
    this.scoreElement.textContent = String(finalScore);
    document.body.appendChild(this.overlay);

    // Trigger CSS transition (requestAnimationFrame ensures the initial opacity:0 is painted first)
    requestAnimationFrame(() => {
      this.overlay.style.opacity = '1';
      this.overlay.style.pointerEvents = 'auto';
    });

    // Enable restart after delay to prevent accidental restart
    setTimeout(() => {
      this.restartEnabled = true;
      this.keyHandler = (e: KeyboardEvent) => {
        if (e.code === 'Space' && this.restartEnabled) {
          e.preventDefault();
          window.location.reload();
        }
      };
      window.addEventListener('keydown', this.keyHandler);
    }, 500);
  }

  hide(): void {
    this.overlay.style.opacity = '0';
    this.overlay.style.pointerEvents = 'none';
    this.restartEnabled = false;
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }
    // Remove from DOM after transition completes
    setTimeout(() => {
      this.overlay.remove();
    }, 500);
  }

  dispose(): void {
    this.hide();
  }
}
