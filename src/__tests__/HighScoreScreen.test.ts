// @vitest-environment jsdom
/**
 * HighScoreScreen tests -- validates the high score screen overlay behavior,
 * initials entry, table display, and restart prompt.
 *
 * Story 5-11: High Score Table
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../core/Logger.ts', () => ({
  Logger: {
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../rendering/PaletteColors.ts', () => ({
  getPaletteHexColor: () => '#00ff41',
  getPaletteCSSGlow: (_radius?: number) => '0 0 10px #00ff41',
  getPaletteCSSMultiGlow: (_radii?: number[]) => '0 0 20px #00ff41, 0 0 40px #00ff41',
}));

import { HighScoreScreen } from '../ui/screens/HighScoreScreen.ts';
import type { HighScoreManager, HighScoreEntry } from '../systems/HighScoreManager.ts';

function createMockHighScoreManager(overrides?: {
  isHighScore?: boolean;
  scores?: HighScoreEntry[];
}): HighScoreManager {
  const defaultScores: HighScoreEntry[] = [
    { initials: 'ACE', score: 50000, date: '2026-01-01' },
    { initials: 'DEV', score: 45000, date: '2026-01-01' },
    { initials: 'CPU', score: 40000, date: '2026-01-01' },
    { initials: 'NET', score: 35000, date: '2026-01-01' },
    { initials: 'RAM', score: 30000, date: '2026-01-01' },
  ];

  const scores = overrides?.scores ?? defaultScores;
  const mockScores = [...scores];

  return {
    getScores: vi.fn(() => [...mockScores]),
    isHighScore: vi.fn(() => overrides?.isHighScore ?? false),
    addScore: vi.fn((initials: string, score: number) => {
      const entry: HighScoreEntry = { initials, score, date: '2026-03-26' };
      mockScores.push(entry);
      mockScores.sort((a, b) => b.score - a.score);
      return [...mockScores];
    }),
    clearScores: vi.fn(),
  } as unknown as HighScoreManager;
}

describe('HighScoreScreen (Story 5-11)', () => {
  let screen: HighScoreScreen;

  beforeEach(() => {
    vi.useFakeTimers();
    screen = new HighScoreScreen();
  });

  afterEach(() => {
    if (screen) {
      screen.dispose();
    }
    vi.useRealTimers();
    document.querySelectorAll('style').forEach((el) => el.remove());
  });

  it('creates overlay DOM element on show()', () => {
    const manager = createMockHighScoreManager();
    screen.show(12345, manager);
    const overlay = document.body.querySelector('div[style*="z-index: 15"]') as HTMLElement;
    expect(overlay).not.toBeNull();
  });

  it('displays initials entry when score qualifies', () => {
    const manager = createMockHighScoreManager({ isHighScore: true });
    screen.show(55000, manager);

    const overlay = document.body.querySelector('div[style*="z-index: 15"]') as HTMLElement;
    expect(overlay).not.toBeNull();
    const textContent = overlay.textContent ?? '';
    expect(textContent).toContain('NEW HIGH SCORE!');
    expect(textContent).toContain('55000');
    expect(textContent).toContain('ENTER YOUR INITIALS');
  });

  it('displays table without initials entry when score does not qualify', () => {
    const manager = createMockHighScoreManager({ isHighScore: false });
    screen.show(1000, manager);

    const overlay = document.body.querySelector('div[style*="z-index: 15"]') as HTMLElement;
    expect(overlay).not.toBeNull();
    const textContent = overlay.textContent ?? '';
    expect(textContent).toContain('HIGH SCORES');
    expect(textContent).toContain('ACE');
    expect(textContent).not.toContain('NEW HIGH SCORE!');
  });

  it('initials entry cycles characters with Up/Down keys', () => {
    const manager = createMockHighScoreManager({ isHighScore: true });
    screen.show(55000, manager);

    // Initially all slots show 'A'
    const overlay = document.body.querySelector('div[style*="z-index: 15"]') as HTMLElement;
    expect(overlay).not.toBeNull();

    // Press ArrowUp to cycle to 'B'
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowUp' }));
    // The first slot should now show 'B'
    const slotDivs = overlay.querySelectorAll('div[style*="border-bottom"]');
    expect(slotDivs.length).toBe(3);
    expect(slotDivs[0].textContent).toBe('B');

    // Press ArrowDown to cycle back to 'A'
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowDown' }));
    expect(slotDivs[0].textContent).toBe('A');
  });

  it('initials entry selects slot with Left/Right keys', () => {
    const manager = createMockHighScoreManager({ isHighScore: true });
    screen.show(55000, manager);

    const overlay = document.body.querySelector('div[style*="z-index: 15"]') as HTMLElement;
    const slotDivs = overlay.querySelectorAll('div[style*="border-bottom"]');

    // Move to second slot
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight' }));
    // Cycle second slot up
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowUp' }));
    // Second slot should now be 'B', first still 'A'
    expect(slotDivs[0].textContent).toBe('A');
    expect(slotDivs[1].textContent).toBe('B');

    // Move back to first slot
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowLeft' }));
    // Cycle first slot up
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowUp' }));
    expect(slotDivs[0].textContent).toBe('B');
    expect(slotDivs[1].textContent).toBe('B');
  });

  it('Space/Enter confirms initials entry and shows table', () => {
    const manager = createMockHighScoreManager({ isHighScore: true });
    screen.show(55000, manager);

    // Confirm with Space (default initials are 'AAA')
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));

    // addScore should have been called
    expect(manager.addScore).toHaveBeenCalledWith('AAA', 55000);

    // Table should now be shown
    const overlay = document.body.querySelector('div[style*="z-index: 15"]') as HTMLElement;
    const textContent = overlay.textContent ?? '';
    expect(textContent).toContain('HIGH SCORES');
    expect(textContent).toContain('ACE');
  });

  it('shows restart prompt after table is displayed', () => {
    const manager = createMockHighScoreManager({ isHighScore: false });
    screen.show(1000, manager);

    // Advance past show timer (500ms)
    vi.advanceTimersByTime(600);

    const overlay = document.body.querySelector('div[style*="z-index: 15"]') as HTMLElement;
    const textContent = overlay.textContent ?? '';
    expect(textContent).toContain('PRESS SPACE TO PLAY AGAIN');
  });

  it('Space key triggers page reload after restart prompt appears', () => {
    const manager = createMockHighScoreManager({ isHighScore: false });
    screen.show(1000, manager);

    // Mock location.reload
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    });

    // Advance past guard delay (1000ms)
    vi.advanceTimersByTime(1100);

    // Press Space
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));

    expect(reloadMock).toHaveBeenCalled();
  });

  it('dispose cleans up DOM and event listeners', () => {
    const manager = createMockHighScoreManager({ isHighScore: true });
    screen.show(55000, manager);

    const overlayBefore = document.body.querySelector('div[style*="z-index: 15"]');
    expect(overlayBefore).not.toBeNull();

    // Check style element exists
    const stylesBefore = document.querySelectorAll('style');
    const hasStyle = Array.from(stylesBefore).some((s) => s.textContent?.includes('highScorePromptPulse'));
    expect(hasStyle).toBe(true);

    screen.dispose();

    const overlayAfter = document.body.querySelector('div[style*="z-index: 15"]');
    expect(overlayAfter).toBeNull();

    const stylesAfter = document.querySelectorAll('style');
    const hasStyleAfter = Array.from(stylesAfter).some((s) => s.textContent?.includes('highScorePromptPulse'));
    expect(hasStyleAfter).toBe(false);
  });

  it('highlights the player newly-added entry in the table', () => {
    const manager = createMockHighScoreManager({ isHighScore: true });
    screen.show(55000, manager);

    // Confirm initials
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));

    // The player's entry row should have full opacity (1) while others have 0.8
    const overlay = document.body.querySelector('div[style*="z-index: 15"]') as HTMLElement;
    const rows = overlay.querySelectorAll('div[style*="justify-content: space-between"]');
    // Find the row with the player's entry (AAA, 55000)
    let playerRow: HTMLElement | null = null;
    rows.forEach((row) => {
      if (row.textContent?.includes('AAA') && row.textContent?.includes('55000')) {
        playerRow = row as HTMLElement;
      }
    });
    expect(playerRow).not.toBeNull();
    expect(playerRow!.style.opacity).toBe('1');
  });
});
