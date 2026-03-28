/**
 * TutorialPrompt -- HTML overlay for displaying contextual tutorial prompts.
 *
 * Positioned at center-bottom of viewport, displays action prompts
 * for the player during the tutorial phase. Green monospace text
 * with glow, matching the vector aesthetic.
 *
 * Created by: Story 4-3
 */

export class TutorialPrompt {
  private container: HTMLDivElement;
  private textElement: HTMLDivElement;
  private visible = false;
  private styleElement: HTMLStyleElement | null = null;

  constructor() {
    this.container = document.createElement('div');
    this.textElement = document.createElement('div');
    this.buildDOM();
  }

  private buildDOM(): void {
    // Inject keyframe animation for pulse effect
    this.styleElement = document.createElement('style');
    this.styleElement.textContent = `
      @keyframes tutorialPromptPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
    `;
    document.head.appendChild(this.styleElement);

    // Container — fixed center-bottom
    Object.assign(this.container.style, {
      position: 'fixed',
      bottom: '5%',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: '5',
      pointerEvents: 'none',
      opacity: '0',
      transition: 'opacity 0.3s ease-in',
      fontFamily: "'Courier New', monospace",
    });

    // Text element — monospace, uppercase, green with glow
    Object.assign(this.textElement.style, {
      fontSize: 'clamp(0.9rem, 2vw, 1.3rem)',
      color: '#00ff41',
      textShadow: '0 0 10px #00ff41',
      letterSpacing: '0.2em',
      textTransform: 'uppercase',
      textAlign: 'center',
      whiteSpace: 'nowrap',
      animation: 'tutorialPromptPulse 0.67s ease-in-out infinite',
    });

    this.container.appendChild(this.textElement);
    document.body.appendChild(this.container);

    // Initially hidden
    this.container.style.display = 'none';
  }

  show(text: string): void {
    this.textElement.textContent = text;
    this.container.style.display = 'block';
    // Trigger fade-in on next frame
    requestAnimationFrame(() => {
      this.container.style.opacity = '1';
    });
    this.visible = true;
  }

  hide(): void {
    if (!this.visible) return;
    this.container.style.transition = 'opacity 0.3s ease-out';
    this.container.style.opacity = '0';
    // After transition, hide element
    setTimeout(() => {
      this.container.style.display = 'none';
      this.visible = false;
    }, 300);
  }

  isVisible(): boolean {
    return this.visible;
  }

  dispose(): void {
    this.visible = false;
    this.container.remove();
    if (this.styleElement) {
      this.styleElement.remove();
      this.styleElement = null;
    }
  }
}
