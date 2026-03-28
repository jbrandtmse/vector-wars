// @vitest-environment jsdom
/**
 * MenuScreen tests -- validates the main menu screen overlay behavior,
 * keyboard navigation, option selection, and lifecycle management.
 *
 * Story 6-1: Main Menu Screen
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

import { MenuScreen } from '../ui/screens/MenuScreen.ts';

describe('MenuScreen (Story 6-1)', () => {
  let screen: MenuScreen;

  beforeEach(() => {
    vi.useFakeTimers();
    screen = new MenuScreen();
  });

  afterEach(() => {
    if (screen) {
      screen.dispose();
    }
    vi.useRealTimers();
    document.querySelectorAll('style').forEach((el) => el.remove());
  });

  it('exports as a class from ui/screens/MenuScreen', async () => {
    const mod = await import('../ui/screens/MenuScreen.ts');
    expect(mod.MenuScreen).toBeDefined();
    expect(typeof mod.MenuScreen).toBe('function');
  });

  it('show() creates overlay DOM with z-index 20', () => {
    screen.show();
    const overlay = document.body.querySelector('div[style*="z-index: 20"]') as HTMLElement;
    expect(overlay).not.toBeNull();
  });

  it('displays VECTOR WARS title', () => {
    screen.show();
    const overlay = document.body.querySelector('div[style*="z-index: 20"]') as HTMLElement;
    expect(overlay).not.toBeNull();
    expect(overlay.textContent).toContain('VECTOR WARS');
  });

  it('displays START GAME, HIGH SCORES, CREDITS options', () => {
    screen.show();
    const overlay = document.body.querySelector('div[style*="z-index: 20"]') as HTMLElement;
    expect(overlay).not.toBeNull();
    const text = overlay.textContent ?? '';
    expect(text).toContain('START GAME');
    expect(text).toContain('HIGH SCORES');
    expect(text).toContain('CREDITS');
  });

  it('Up/Down arrow keys change selected option', () => {
    screen.show();
    // Enable input
    vi.advanceTimersByTime(400);

    // Initially first option (START GAME) is selected
    const overlay = document.body.querySelector('div[style*="z-index: 20"]') as HTMLElement;
    expect(overlay).not.toBeNull();

    // Press Down to select HIGH SCORES
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowDown' }));

    // The second option should now be highlighted (contains > markers)
    const text = overlay.textContent ?? '';
    expect(text).toContain('> HIGH SCORES <');

    // Press Down again to select CREDITS
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowDown' }));
    const text2 = overlay.textContent ?? '';
    expect(text2).toContain('> CREDITS <');

    // Press Up to go back to HIGH SCORES
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowUp' }));
    const text3 = overlay.textContent ?? '';
    expect(text3).toContain('> HIGH SCORES <');
  });

  it('selection wraps from first to last and last to first', () => {
    screen.show();
    vi.advanceTimersByTime(400);

    // Press Up on first item (START GAME) should wrap to CREDITS
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowUp' }));
    const overlay = document.body.querySelector('div[style*="z-index: 20"]') as HTMLElement;
    const text = overlay.textContent ?? '';
    expect(text).toContain('> CREDITS <');

    // Press Down should wrap back to START GAME
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowDown' }));
    const text2 = overlay.textContent ?? '';
    expect(text2).toContain('> START GAME <');
  });

  it('Space key on START GAME calls onStartGame callback', () => {
    const onStartGame = vi.fn();
    screen.onStartGame = onStartGame;
    screen.show();
    vi.advanceTimersByTime(400);

    // Press Space to confirm START GAME (first option)
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));

    // The callback is invoked after a short delay
    vi.advanceTimersByTime(200);
    expect(onStartGame).toHaveBeenCalled();
  });

  it('Enter key on START GAME calls onStartGame callback', () => {
    const onStartGame = vi.fn();
    screen.onStartGame = onStartGame;
    screen.show();
    vi.advanceTimersByTime(400);

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));
    vi.advanceTimersByTime(200);
    expect(onStartGame).toHaveBeenCalled();
  });

  it('CREDITS option shows credits sub-screen with return prompt', () => {
    screen.show();
    vi.advanceTimersByTime(400);

    // Navigate to CREDITS (index 2)
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowDown' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowDown' }));
    // Confirm
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));

    const overlay = document.body.querySelector('div[style*="z-index: 20"]') as HTMLElement;
    const text = overlay.textContent ?? '';
    expect(text).toContain('DESIGN & CODE');
    expect(text).toContain('PRESS ANY KEY TO RETURN');
  });

  it('pressing any key in credits returns to main menu', () => {
    screen.show();
    vi.advanceTimersByTime(400);

    // Navigate to CREDITS and confirm
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowDown' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowDown' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));

    // Press any key to return
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape' }));

    // Should be back to main menu
    const overlay = document.body.querySelector('div[style*="z-index: 20"]') as HTMLElement;
    const text = overlay.textContent ?? '';
    expect(text).toContain('START GAME');
    expect(text).toContain('HIGH SCORES');
    expect(text).toContain('CREDITS');
  });

  it('HIGH SCORES option calls onHighScores with return callback', () => {
    const onHighScores = vi.fn();
    screen.onHighScores = onHighScores;
    screen.show();
    vi.advanceTimersByTime(400);

    // Navigate to HIGH SCORES
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowDown' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));

    expect(onHighScores).toHaveBeenCalledWith(expect.any(Function));
  });

  it('dispose() removes overlay from DOM and cleans up listeners', () => {
    screen.show();
    const overlayBefore = document.body.querySelector('div[style*="z-index: 20"]');
    expect(overlayBefore).not.toBeNull();

    // Check style element exists
    const stylesBefore = document.querySelectorAll('style');
    const hasStyle = Array.from(stylesBefore).some((s) => s.textContent?.includes('menuOptionPulse'));
    expect(hasStyle).toBe(true);

    screen.dispose();

    const overlayAfter = document.body.querySelector('div[style*="z-index: 20"]');
    expect(overlayAfter).toBeNull();

    const stylesAfter = document.querySelectorAll('style');
    const hasStyleAfter = Array.from(stylesAfter).some((s) => s.textContent?.includes('menuOptionPulse'));
    expect(hasStyleAfter).toBe(false);
  });

  it('has show, hide, and dispose methods on prototype', () => {
    expect(typeof MenuScreen.prototype.show).toBe('function');
    expect(typeof MenuScreen.prototype.hide).toBe('function');
    expect(typeof MenuScreen.prototype.dispose).toBe('function');
  });
});
