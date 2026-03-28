// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock constants before importing BriefingScreen
vi.mock('../config/constants.ts', async () => {
  const actual = await vi.importActual('../config/constants.ts');
  return {
    ...actual,
    BRIEFING_SCROLL_SPEED: 30,
    BRIEFING_SKIP_GUARD_DELAY: 2.0,
    BRIEFING_HOLD_DURATION: 2.0,
    BRIEFING_FADE_DURATION: 0.5,
  };
});

import { BriefingScreen } from '../ui/screens/BriefingScreen.ts';
import type { BriefingData } from '../ui/screens/BriefingScreen.ts';

const testBriefingData: BriefingData = {
  title: 'TEST BRIEFING',
  speaker: 'handler',
  lines: [
    'First line of briefing.',
    'Second line of briefing.',
    'Third line of briefing.',
  ],
};

describe('BriefingScreen (Story 4-4)', () => {
  let screen: BriefingScreen;

  beforeEach(() => {
    vi.useFakeTimers();
    screen = new BriefingScreen();
  });

  afterEach(() => {
    screen.dispose();
    vi.useRealTimers();
  });

  describe('show()', () => {
    it('appends overlay to document.body', () => {
      const onComplete = vi.fn();
      screen.show(testBriefingData, onComplete);

      const overlays = document.body.querySelectorAll('div[style*="z-index: 8"]');
      expect(overlays.length).toBeGreaterThan(0);
    });

    it('displays the briefing title', () => {
      const onComplete = vi.fn();
      screen.show(testBriefingData, onComplete);

      expect(document.body.textContent).toContain('TEST BRIEFING');
    });

    it('displays all briefing text lines', () => {
      const onComplete = vi.fn();
      screen.show(testBriefingData, onComplete);

      expect(document.body.textContent).toContain('First line of briefing.');
      expect(document.body.textContent).toContain('Second line of briefing.');
      expect(document.body.textContent).toContain('Third line of briefing.');
    });

    it('creates skip prompt text', () => {
      const onComplete = vi.fn();
      screen.show(testBriefingData, onComplete);

      expect(document.body.textContent).toContain('PRESS ANY KEY TO CONTINUE');
    });

    it('injects style element for pulse animation', () => {
      const onComplete = vi.fn();
      screen.show(testBriefingData, onComplete);

      const styles = document.head.querySelectorAll('style');
      const hasAnimation = Array.from(styles).some(
        (s) => s.textContent?.includes('briefingPromptPulse')
      );
      expect(hasAnimation).toBe(true);
    });
  });

  describe('skip guard delay', () => {
    it('does not trigger onComplete when key pressed before guard delay', () => {
      const onComplete = vi.fn();
      screen.show(testBriefingData, onComplete);

      // Press a key immediately (guard delay not elapsed)
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      vi.advanceTimersByTime(1000);

      expect(onComplete).not.toHaveBeenCalled();
    });

    it('allows skip after guard delay has elapsed', () => {
      const onComplete = vi.fn();
      screen.show(testBriefingData, onComplete);

      // Advance past guard delay
      vi.advanceTimersByTime(2100);

      // Press a key
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));

      // Wait for skip's 500ms hold + fade duration
      vi.advanceTimersByTime(1000);

      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('skip()', () => {
    it('triggers onComplete after skip', () => {
      const onComplete = vi.fn();
      screen.show(testBriefingData, onComplete);

      // Advance past guard delay and fade-in
      vi.advanceTimersByTime(2600);

      // Call skip directly (simulating guard already passed)
      screen.skip();

      // Wait for skip hold + fade
      vi.advanceTimersByTime(1000);

      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('does not trigger onComplete multiple times', () => {
      const onComplete = vi.fn();
      screen.show(testBriefingData, onComplete);

      // Advance past guard delay
      vi.advanceTimersByTime(2600);

      screen.skip();
      vi.advanceTimersByTime(1000);

      // Try to skip again
      screen.skip();
      vi.advanceTimersByTime(1000);

      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('dispose()', () => {
    it('removes overlay from document.body', () => {
      const onComplete = vi.fn();
      screen.show(testBriefingData, onComplete);

      // Verify overlay exists
      const overlaysBefore = document.body.querySelectorAll('div[style*="z-index: 8"]');
      expect(overlaysBefore.length).toBeGreaterThan(0);

      screen.dispose();

      // After dispose, the overlay's remove() was called
      // The overlay element should no longer be in the document
      const overlaysAfter = document.body.querySelectorAll('div[style*="z-index: 8"]');
      expect(overlaysAfter.length).toBe(0);
    });

    it('removes style element from document.head', () => {
      const onComplete = vi.fn();
      screen.show(testBriefingData, onComplete);

      screen.dispose();

      const styles = document.head.querySelectorAll('style');
      const hasAnimation = Array.from(styles).some(
        (s) => s.textContent?.includes('briefingPromptPulse')
      );
      expect(hasAnimation).toBe(false);
    });

    it('removes keydown listener', () => {
      const onComplete = vi.fn();
      screen.show(testBriefingData, onComplete);

      screen.dispose();

      // Key press should not trigger anything after dispose
      vi.advanceTimersByTime(3000);
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      vi.advanceTimersByTime(2000);

      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  describe('BriefingData interface', () => {
    it('accepts briefing data with title, lines, and speaker', () => {
      const data: BriefingData = {
        title: 'MISSION BRIEFING',
        speaker: 'handler',
        lines: ['Line 1', 'Line 2'],
      };

      const onComplete = vi.fn();
      screen.show(data, onComplete);

      expect(document.body.textContent).toContain('MISSION BRIEFING');
      expect(document.body.textContent).toContain('Line 1');
      expect(document.body.textContent).toContain('Line 2');
    });
  });
});
