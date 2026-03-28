/**
 * HighScoreScreen -- HTML overlay that displays the high score table with
 * an optional initials entry mode for new high scores.
 *
 * Follows EndingScreen/GameOverScreen DOM pattern: full-viewport overlay,
 * CSS transitions, palette-aware colors, dispose() cleanup.
 *
 * When the player's score qualifies, shows a 3-character initials input
 * (classic arcade style: Up/Down cycles, Left/Right selects, Space confirms).
 * After entry (or if score doesn't qualify), shows the full table with
 * a restart prompt.
 *
 * Created by: Story 5-11
 */

import { getPaletteHexColor, getPaletteCSSGlow, getPaletteCSSMultiGlow } from '../../rendering/PaletteColors.ts';
import { Logger } from '../../core/Logger.ts';
import type { HighScoreManager } from '../../systems/HighScoreManager.ts';

/** Characters available for initials entry. */
const INITIALS_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/** Number of character slots for initials. */
const INITIALS_LENGTH = 3;

/** Delay before restart prompt is active after it appears (ms). */
const RESTART_GUARD_DELAY = 1000;

export class HighScoreScreen {
  private overlay: HTMLDivElement;
  private styleElement: HTMLStyleElement | null = null;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;
  private restartEnabled = false;
  private timers: ReturnType<typeof setTimeout>[] = [];

  // Initials entry state
  private initialsMode = false;
  private initialsSlots: number[] = [0, 0, 0]; // indices into INITIALS_CHARS
  private activeSlot = 0;
  private slotElements: HTMLDivElement[] = [];

  // References
  private highScoreManager: HighScoreManager | null = null;
  private playerScore = 0;
  private playerEntryIndex = -1; // index of the player's entry in the table after add

  constructor() {
    this.overlay = document.createElement('div');
  }

  /**
   * Show the high score screen.
   * If the score qualifies, shows initials entry first. Otherwise shows table directly.
   */
  show(finalScore: number, highScoreManager: HighScoreManager): void {
    Logger.info('HighScoreScreen', 'Showing high score screen', { finalScore });

    this.highScoreManager = highScoreManager;
    this.playerScore = finalScore;

    this.buildOverlay();
    document.body.appendChild(this.overlay);

    requestAnimationFrame(() => {
      this.overlay.style.opacity = '1';
    });

    if (highScoreManager.isHighScore(finalScore)) {
      this.showInitialsEntry();
    } else {
      this.showTable();
    }
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
    this.restartEnabled = false;
    this.initialsMode = false;

    Logger.info('HighScoreScreen', 'High score screen disposed');
  }

  private buildOverlay(): void {
    // Inject keyframe animations
    this.styleElement = document.createElement('style');
    this.styleElement.textContent = `
      @keyframes highScorePromptPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      @keyframes highScoreSlotBlink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
    `;
    document.head.appendChild(this.styleElement);

    Object.assign(this.overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      zIndex: '15',
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
  }

  private showInitialsEntry(): void {
    this.initialsMode = true;
    this.initialsSlots = [0, 0, 0]; // Default to 'A'
    this.activeSlot = 0;

    const hex = getPaletteHexColor();
    const glow = getPaletteCSSGlow();
    const multiGlow = getPaletteCSSMultiGlow([20, 40]);

    // Clear overlay content
    this.overlay.innerHTML = '';

    // Title
    const title = document.createElement('div');
    Object.assign(title.style, {
      fontSize: 'clamp(2rem, 5vw, 3.5rem)',
      color: hex,
      textShadow: multiGlow,
      letterSpacing: '0.15em',
      marginBottom: '1.5rem',
    });
    title.textContent = 'NEW HIGH SCORE!';
    this.overlay.appendChild(title);

    // Score
    const scoreDiv = document.createElement('div');
    Object.assign(scoreDiv.style, {
      fontSize: 'clamp(1.2rem, 3vw, 2rem)',
      color: hex,
      textShadow: glow,
      marginBottom: '2.5rem',
    });
    scoreDiv.textContent = String(this.playerScore);
    this.overlay.appendChild(scoreDiv);

    // Instructions
    const instructions = document.createElement('div');
    Object.assign(instructions.style, {
      fontSize: 'clamp(0.6rem, 1.2vw, 0.8rem)',
      color: hex,
      textShadow: glow,
      opacity: '0.6',
      marginBottom: '1.5rem',
      letterSpacing: '0.1em',
    });
    instructions.textContent = 'ENTER YOUR INITIALS';
    this.overlay.appendChild(instructions);

    // Initials slots container
    const slotsContainer = document.createElement('div');
    Object.assign(slotsContainer.style, {
      display: 'flex',
      gap: '1.5rem',
      marginBottom: '2rem',
    });

    this.slotElements = [];
    for (let i = 0; i < INITIALS_LENGTH; i++) {
      const slot = document.createElement('div');
      Object.assign(slot.style, {
        fontSize: 'clamp(3rem, 7vw, 5rem)',
        color: hex,
        textShadow: i === 0 ? multiGlow : glow,
        letterSpacing: '0.1em',
        borderBottom: `2px solid ${hex}`,
        paddingBottom: '0.3rem',
        minWidth: '1.5em',
        textAlign: 'center',
      });
      if (i === 0) {
        slot.style.animation = 'highScoreSlotBlink 0.5s ease-in-out infinite';
      }
      slot.textContent = INITIALS_CHARS[0];
      slotsContainer.appendChild(slot);
      this.slotElements.push(slot);
    }
    this.overlay.appendChild(slotsContainer);

    // Controls hint
    const controls = document.createElement('div');
    Object.assign(controls.style, {
      fontSize: 'clamp(0.6rem, 1.2vw, 0.8rem)',
      color: hex,
      textShadow: glow,
      opacity: '0.5',
      letterSpacing: '0.08em',
    });
    controls.textContent = 'UP/DOWN: CHANGE  LEFT/RIGHT: SELECT  SPACE: CONFIRM';
    this.overlay.appendChild(controls);

    // Key handler for initials entry
    this.keyHandler = (e: KeyboardEvent) => {
      if (!this.initialsMode) return;
      e.preventDefault();

      switch (e.code) {
        case 'ArrowUp': {
          this.initialsSlots[this.activeSlot] =
            (this.initialsSlots[this.activeSlot] + 1) % INITIALS_CHARS.length;
          this.updateSlotDisplay();
          break;
        }
        case 'ArrowDown': {
          this.initialsSlots[this.activeSlot] =
            (this.initialsSlots[this.activeSlot] - 1 + INITIALS_CHARS.length) % INITIALS_CHARS.length;
          this.updateSlotDisplay();
          break;
        }
        case 'ArrowLeft': {
          this.activeSlot = Math.max(0, this.activeSlot - 1);
          this.updateSlotHighlight();
          break;
        }
        case 'ArrowRight': {
          this.activeSlot = Math.min(INITIALS_LENGTH - 1, this.activeSlot + 1);
          this.updateSlotHighlight();
          break;
        }
        case 'Space':
        case 'Enter': {
          this.confirmInitials();
          break;
        }
      }
    };
    window.addEventListener('keydown', this.keyHandler);
  }

  private updateSlotDisplay(): void {
    for (let i = 0; i < INITIALS_LENGTH; i++) {
      this.slotElements[i].textContent = INITIALS_CHARS[this.initialsSlots[i]];
    }
  }

  private updateSlotHighlight(): void {
    const glow = getPaletteCSSGlow();
    const multiGlow = getPaletteCSSMultiGlow([20, 40]);

    for (let i = 0; i < INITIALS_LENGTH; i++) {
      if (i === this.activeSlot) {
        this.slotElements[i].style.textShadow = multiGlow;
        this.slotElements[i].style.animation = 'highScoreSlotBlink 0.5s ease-in-out infinite';
      } else {
        this.slotElements[i].style.textShadow = glow;
        this.slotElements[i].style.animation = 'none';
      }
    }
  }

  private confirmInitials(): void {
    if (!this.highScoreManager) return;

    this.initialsMode = false;

    // Remove the initials key handler
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }

    // Build initials string
    const initials = this.initialsSlots
      .map((idx) => INITIALS_CHARS[idx])
      .join('');

    // Add score
    const updatedScores = this.highScoreManager.addScore(initials, this.playerScore);

    // Find the player's entry index
    this.playerEntryIndex = updatedScores.findIndex(
      (entry) => entry.initials === initials && entry.score === this.playerScore,
    );

    Logger.info('HighScoreScreen', 'Initials confirmed', {
      initials,
      score: this.playerScore,
      rank: this.playerEntryIndex + 1,
    });

    this.showTable();
  }

  private showTable(): void {
    const hex = getPaletteHexColor();
    const glow = getPaletteCSSGlow();
    const multiGlow = getPaletteCSSMultiGlow([20, 40]);
    const scores = this.highScoreManager?.getScores() ?? [];

    // Clear overlay content
    this.overlay.innerHTML = '';

    // Title
    const title = document.createElement('div');
    Object.assign(title.style, {
      fontSize: 'clamp(2rem, 5vw, 3.5rem)',
      color: hex,
      textShadow: multiGlow,
      letterSpacing: '0.15em',
      marginBottom: '2rem',
    });
    title.textContent = 'HIGH SCORES';
    this.overlay.appendChild(title);

    // Score table
    const table = document.createElement('div');
    Object.assign(table.style, {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.4rem',
      marginBottom: '2rem',
      width: 'clamp(300px, 60vw, 500px)',
    });

    for (let i = 0; i < scores.length; i++) {
      const entry = scores[i];
      const isPlayerEntry = i === this.playerEntryIndex;

      const row = document.createElement('div');
      Object.assign(row.style, {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 'clamp(0.8rem, 1.8vw, 1.2rem)',
        color: hex,
        textShadow: isPlayerEntry ? multiGlow : glow,
        opacity: isPlayerEntry ? '1' : '0.8',
        padding: '0.3rem 0',
        letterSpacing: '0.08em',
      });

      // Rank
      const rank = document.createElement('span');
      rank.style.minWidth = '2em';
      rank.textContent = `${String(i + 1).padStart(2, ' ')}.`;
      row.appendChild(rank);

      // Initials
      const initialsSpan = document.createElement('span');
      initialsSpan.style.minWidth = '4em';
      initialsSpan.style.textAlign = 'center';
      initialsSpan.textContent = entry.initials;
      row.appendChild(initialsSpan);

      // Score
      const scoreSpan = document.createElement('span');
      scoreSpan.style.minWidth = '6em';
      scoreSpan.style.textAlign = 'right';
      scoreSpan.textContent = String(entry.score).padStart(6, ' ');
      row.appendChild(scoreSpan);

      // Date
      const dateSpan = document.createElement('span');
      dateSpan.style.minWidth = '8em';
      dateSpan.style.textAlign = 'right';
      dateSpan.style.opacity = '0.5';
      dateSpan.textContent = entry.date;
      row.appendChild(dateSpan);

      table.appendChild(row);
    }

    this.overlay.appendChild(table);

    // Restart prompt
    const prompt = document.createElement('div');
    Object.assign(prompt.style, {
      fontSize: 'clamp(0.7rem, 1.5vw, 1rem)',
      color: hex,
      textShadow: glow,
      letterSpacing: '0.15em',
      opacity: '0',
      transition: 'opacity 0.5s ease-in',
    });
    prompt.textContent = 'PRESS SPACE TO PLAY AGAIN';
    this.overlay.appendChild(prompt);

    // Show restart prompt with delay
    const showTimer = setTimeout(() => {
      prompt.style.opacity = '1';
      prompt.style.animation = 'highScorePromptPulse 1s ease-in-out infinite';
    }, 500);
    this.timers.push(showTimer);

    // Enable restart after guard delay
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
