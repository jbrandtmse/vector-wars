/**
 * MenuScreen -- Full-screen HTML overlay displaying the main menu.
 *
 * Shows VECTOR WARS title with three options: START GAME, HIGH SCORES, CREDITS.
 * Keyboard navigation: Up/Down to select, Space/Enter to confirm.
 * Follows the same DOM pattern as GameOverScreen, HighScoreScreen, EndingScreen.
 *
 * Created by: Story 6-1
 */

import { getPaletteHexColor, getPaletteCSSGlow, getPaletteCSSMultiGlow } from '../../rendering/PaletteColors.ts';
import { Logger } from '../../core/Logger.ts';

/** Menu option identifiers. */
type MenuOption = 'startGame' | 'highScores' | 'credits';

const MENU_OPTIONS: readonly { id: MenuOption; label: string }[] = [
  { id: 'startGame', label: 'START GAME' },
  { id: 'highScores', label: 'HIGH SCORES' },
  { id: 'credits', label: 'CREDITS' },
] as const;

/** Credits content sections (same data as EndingScreen). */
const CREDITS_SECTIONS: readonly { heading: string; lines: string[] }[] = [
  { heading: '', lines: ['VECTOR WARS'] },
  { heading: 'DESIGN & CODE', lines: ['Developer'] },
  { heading: 'NARRATIVE', lines: ['Developer'] },
  { heading: 'AUDIO', lines: ['Procedural Web Audio Synthesis'] },
  { heading: 'BUILT WITH', lines: ['Three.js', 'Vite', 'TypeScript', 'Web Audio API'] },
  { heading: '', lines: ['Thank you for playing'] },
] as const;

/** Delay before menu accepts input after show (ms). */
const INPUT_GUARD_DELAY = 300;

export class MenuScreen {
  private overlay: HTMLDivElement;
  private styleElement: HTMLStyleElement | null = null;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;
  private selectedIndex = 0;
  private optionElements: HTMLDivElement[] = [];
  private inputEnabled = false;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private showingCredits = false;
  private showingSubScreen = false;

  /** Callback invoked when START GAME is confirmed. */
  public onStartGame: (() => void) | null = null;

  /** Callback invoked when HIGH SCORES is confirmed. Receives a returnToMenu callback. */
  public onHighScores: ((returnToMenu: () => void) => void) | null = null;

  constructor() {
    this.overlay = document.createElement('div');
  }

  show(): void {
    Logger.info('MenuScreen', 'Showing main menu');

    this.selectedIndex = 0;
    this.inputEnabled = false;
    this.showingCredits = false;
    this.showingSubScreen = false;

    this.buildDOM();
    document.body.appendChild(this.overlay);

    // Fade in
    requestAnimationFrame(() => {
      this.overlay.style.opacity = '1';
    });

    // Enable input after guard delay
    const guardTimer = setTimeout(() => {
      this.inputEnabled = true;
    }, INPUT_GUARD_DELAY);
    this.timers.push(guardTimer);

    // Install keyboard handler
    this.keyHandler = (e: KeyboardEvent) => {
      if (!this.inputEnabled) return;
      e.preventDefault();
      this.handleKeydown(e.code);
    };
    window.addEventListener('keydown', this.keyHandler);
  }

  hide(): void {
    this.overlay.style.opacity = '0';
    this.overlay.style.pointerEvents = 'none';
    this.inputEnabled = false;

    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }

    // Remove from DOM after transition
    const removeTimer = setTimeout(() => {
      this.overlay.remove();
    }, 500);
    this.timers.push(removeTimer);
  }

  dispose(): void {
    for (const timer of this.timers) {
      clearTimeout(timer);
    }
    this.timers = [];

    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }

    if (this.styleElement) {
      this.styleElement.remove();
      this.styleElement = null;
    }

    this.overlay.remove();
    this.inputEnabled = false;
    this.showingCredits = false;
    this.showingSubScreen = false;

    Logger.info('MenuScreen', 'Menu screen disposed');
  }

  private handleKeydown(code: string): void {
    if (this.showingCredits) {
      // Any key returns from credits
      this.returnFromCredits();
      return;
    }

    if (this.showingSubScreen) {
      // Sub-screen handles its own input
      return;
    }

    switch (code) {
      case 'ArrowUp': {
        this.selectedIndex = (this.selectedIndex - 1 + MENU_OPTIONS.length) % MENU_OPTIONS.length;
        this.updateSelection();
        break;
      }
      case 'ArrowDown': {
        this.selectedIndex = (this.selectedIndex + 1) % MENU_OPTIONS.length;
        this.updateSelection();
        break;
      }
      case 'Space':
      case 'Enter': {
        this.confirmSelection();
        break;
      }
    }
  }

  private confirmSelection(): void {
    const option = MENU_OPTIONS[this.selectedIndex];

    switch (option.id) {
      case 'startGame': {
        Logger.info('MenuScreen', 'START GAME selected');
        this.hide();
        if (this.onStartGame) {
          // Invoke after hide fade begins
          const startTimer = setTimeout(() => {
            if (this.onStartGame) {
              this.onStartGame();
            }
          }, 100);
          this.timers.push(startTimer);
        }
        break;
      }
      case 'highScores': {
        Logger.info('MenuScreen', 'HIGH SCORES selected');
        this.showingSubScreen = true;
        // Temporarily hide overlay while HighScoreScreen is shown
        this.overlay.style.opacity = '0';
        this.overlay.style.pointerEvents = 'none';
        if (this.onHighScores) {
          this.onHighScores(() => {
            this.returnFromSubScreen();
          });
        }
        break;
      }
      case 'credits': {
        Logger.info('MenuScreen', 'CREDITS selected');
        this.showCredits();
        break;
      }
    }
  }

  private returnFromSubScreen(): void {
    this.showingSubScreen = false;
    this.overlay.style.opacity = '1';
    this.overlay.style.pointerEvents = 'auto';
  }

  private showCredits(): void {
    this.showingCredits = true;
    this.overlay.innerHTML = '';

    const hex = getPaletteHexColor();
    const glow = getPaletteCSSGlow();
    const multiGlow = getPaletteCSSMultiGlow([20, 40, 80]);

    // Credits container
    const container = document.createElement('div');
    Object.assign(container.style, {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
    });

    for (const section of CREDITS_SECTIONS) {
      if (section.heading) {
        const headingDiv = document.createElement('div');
        Object.assign(headingDiv.style, {
          fontSize: 'clamp(0.7rem, 1.3vw, 0.9rem)',
          color: hex,
          textShadow: glow,
          letterSpacing: '0.15em',
          opacity: '0.6',
          marginBottom: '0.4rem',
          marginTop: '1.5rem',
        });
        headingDiv.textContent = section.heading;
        container.appendChild(headingDiv);
      }

      for (const line of section.lines) {
        const lineDiv = document.createElement('div');
        const isTitle = section.heading === '' && line === 'VECTOR WARS';
        Object.assign(lineDiv.style, {
          fontSize: isTitle ? 'clamp(2.5rem, 6vw, 4rem)' : 'clamp(0.9rem, 1.8vw, 1.3rem)',
          color: hex,
          textShadow: isTitle ? multiGlow : glow,
          lineHeight: '2',
          letterSpacing: isTitle ? '0.15em' : '0',
          marginBottom: isTitle ? '1rem' : '0',
        });
        lineDiv.textContent = line;
        container.appendChild(lineDiv);
      }
    }

    // Return prompt
    const prompt = document.createElement('div');
    Object.assign(prompt.style, {
      fontSize: 'clamp(0.7rem, 1.5vw, 1rem)',
      color: hex,
      textShadow: glow,
      letterSpacing: '0.15em',
      marginTop: '3rem',
      animation: 'menuPromptPulse 1s ease-in-out infinite',
    });
    prompt.textContent = 'PRESS ANY KEY TO RETURN';
    container.appendChild(prompt);

    this.overlay.appendChild(container);
  }

  private returnFromCredits(): void {
    this.showingCredits = false;
    this.overlay.innerHTML = '';
    this.buildMenuContent();
    this.updateSelection();
  }

  private updateSelection(): void {
    const hex = getPaletteHexColor();
    const glow = getPaletteCSSGlow();
    const multiGlow = getPaletteCSSMultiGlow([20, 40]);

    for (let i = 0; i < this.optionElements.length; i++) {
      const el = this.optionElements[i];
      if (i === this.selectedIndex) {
        el.style.textShadow = multiGlow;
        el.style.opacity = '1';
        el.style.animation = 'menuOptionPulse 0.8s ease-in-out infinite';
        el.textContent = `> ${MENU_OPTIONS[i].label} <`;
      } else {
        el.style.textShadow = glow;
        el.style.opacity = '0.6';
        el.style.animation = 'none';
        el.textContent = MENU_OPTIONS[i].label;
      }
      el.style.color = hex;
    }
  }

  private buildDOM(): void {
    // Inject keyframe animations
    this.styleElement = document.createElement('style');
    this.styleElement.textContent = `
      @keyframes menuOptionPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
      @keyframes menuPromptPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `;
    document.head.appendChild(this.styleElement);

    // Overlay container
    Object.assign(this.overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      zIndex: '20',
      pointerEvents: 'auto',
      opacity: '0',
      transition: 'opacity 0.5s ease-in',
      fontFamily: "'Courier New', monospace",
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    });

    this.buildMenuContent();
  }

  private buildMenuContent(): void {
    const hex = getPaletteHexColor();
    const glow = getPaletteCSSGlow();
    const multiGlow = getPaletteCSSMultiGlow([20, 40, 80]);

    // Title
    const title = document.createElement('div');
    Object.assign(title.style, {
      fontSize: 'clamp(3rem, 8vw, 6rem)',
      color: hex,
      textShadow: multiGlow,
      letterSpacing: '0.2em',
      marginBottom: '1.5rem',
      textAlign: 'center',
    });
    title.textContent = 'VECTOR WARS';
    this.overlay.appendChild(title);

    // Separator line
    const separator = document.createElement('div');
    Object.assign(separator.style, {
      width: '50%',
      maxWidth: '400px',
      height: '1px',
      backgroundColor: hex,
      boxShadow: glow,
      marginBottom: '3rem',
    });
    this.overlay.appendChild(separator);

    // Menu options
    this.optionElements = [];
    for (let i = 0; i < MENU_OPTIONS.length; i++) {
      const option = document.createElement('div');
      Object.assign(option.style, {
        fontSize: 'clamp(1.2rem, 3vw, 2rem)',
        color: hex,
        textShadow: glow,
        letterSpacing: '0.15em',
        marginBottom: '1.5rem',
        cursor: 'default',
        transition: 'opacity 0.2s ease',
      });
      option.textContent = MENU_OPTIONS[i].label;
      this.overlay.appendChild(option);
      this.optionElements.push(option);
    }

    // Apply initial selection highlight
    this.updateSelection();
  }
}
