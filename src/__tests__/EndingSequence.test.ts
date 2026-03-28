// @vitest-environment jsdom
/**
 * EndingSequence tests -- validates the ending screen overlay behavior,
 * Ghost's final transmission, credits, audio integration, and restart prompt.
 *
 * Story 5-10: Ending Sequence
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ============================================================
// Hoisted variables for vi.mock factories
// ============================================================

const {
  mockPlayMusic,
  mockPlayVoice,
  mockStopChannel,
} = vi.hoisted(() => ({
  mockPlayMusic: vi.fn(),
  mockPlayVoice: vi.fn(),
  mockStopChannel: vi.fn(),
}));

// ============================================================
// Mocks
// ============================================================

vi.mock('../core/Logger.ts', () => ({
  Logger: {
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../audio/AudioManager.ts', () => ({
  audioManager: {
    playMusic: mockPlayMusic,
    playVoice: mockPlayVoice,
    stopChannel: mockStopChannel,
  },
}));

vi.mock('../rendering/PaletteColors.ts', () => ({
  getPaletteHexColor: () => '#ff2020',
  getPaletteCSSGlow: (_radius?: number) => '0 0 10px #ff2020',
  getPaletteCSSMultiGlow: (_radii?: number[]) => '0 0 20px #ff2020, 0 0 40px #ff2020',
}));

vi.mock('../config/constants.ts', async () => {
  const actual = await vi.importActual('../config/constants.ts') as Record<string, unknown>;
  return {
    ...actual,
    BRIEFING_SCROLL_SPEED: 30,
  };
});

import { EndingScreen } from '../ui/screens/EndingScreen.ts';

describe('EndingScreen', () => {
  let endingScreen: EndingScreen;

  beforeEach(() => {
    vi.useFakeTimers();
    mockPlayMusic.mockClear();
    mockPlayVoice.mockClear();
    mockStopChannel.mockClear();
    endingScreen = new EndingScreen();
  });

  afterEach(() => {
    if (endingScreen) {
      endingScreen.dispose();
    }
    vi.useRealTimers();
    // Clean up any remaining DOM elements
    document.querySelectorAll('style').forEach((el) => el.remove());
  });

  describe('show()', () => {
    it('creates overlay DOM element on show()', () => {
      endingScreen.show(12345);
      // The overlay should be appended to document.body
      const overlay = document.body.querySelector('div[style*="z-index: 10"]') as HTMLElement;
      expect(overlay).not.toBeNull();
    });

    it('calls audioManager.stopChannel("ambient") before playing music', () => {
      endingScreen.show(12345);
      expect(mockStopChannel).toHaveBeenCalledWith('ambient');
      // stopChannel called before playMusic
      const stopCallOrder = mockStopChannel.mock.invocationCallOrder[0];
      const playCallOrder = mockPlayMusic.mock.invocationCallOrder[0];
      expect(stopCallOrder).toBeLessThan(playCallOrder);
    });

    it('calls audioManager.playMusic("outro") on show', () => {
      endingScreen.show(12345);
      expect(mockPlayMusic).toHaveBeenCalledWith('outro');
    });

    it('calls audioManager.playVoice("ending_desperate") on show', () => {
      endingScreen.show(12345);
      expect(mockPlayVoice).toHaveBeenCalledWith('ending_desperate');
    });
  });

  describe('Ghost transmission', () => {
    it('displays Ghost transmission lines in sequence with correct timing', () => {
      endingScreen.show(12345);

      // The show() calls requestAnimationFrame for the flash, then setTimeout for transmission
      // Advance past flash duration (1000ms) to start transmission
      vi.advanceTimersByTime(1100);

      const container = document.body.querySelector('div[style*="z-index: 10"]');
      expect(container).not.toBeNull();

      // First line appears at delay 0 from transmission start
      // Lines are added via setTimeout inside showTransmission()
      vi.advanceTimersByTime(100);
      let textContent = container!.textContent ?? '';
      expect(textContent).toContain("CIPHER! THE NETWORK'S COLLAPSING--");

      // Second line at delay 1500ms
      vi.advanceTimersByTime(1500);
      textContent = container!.textContent ?? '';
      expect(textContent).toContain("I'M LOSING YOUR SIGNAL--");

      // Third line at delay 3000ms from transmission start (1500 more from current)
      vi.advanceTimersByTime(1500);
      textContent = container!.textContent ?? '';
      expect(textContent).toContain('STAY WITH ME! STAY WITH ME!');

      // Relief line at delay 7000ms from transmission start
      vi.advanceTimersByTime(4000);
      textContent = container!.textContent ?? '';
      expect(textContent).toContain("...I've got you. You're coming home.");
    });

    it('plays ending_relief voice line when relief text appears', () => {
      endingScreen.show(12345);
      mockPlayVoice.mockClear(); // Clear the initial ending_desperate call

      // Advance past flash (1000ms) + transmission start + relief line delay (7000ms)
      vi.advanceTimersByTime(1100 + 7000);

      expect(mockPlayVoice).toHaveBeenCalledWith('ending_relief');
    });
  });

  describe('credits', () => {
    it('shows credits section after transmission completes', () => {
      endingScreen.show(12345);

      // Advance past flash (1000ms) + transmission duration (10000ms) + fade (1000ms)
      vi.advanceTimersByTime(1000 + 10000 + 1000);

      const container = document.body.querySelector('div[style*="z-index: 10"]');
      expect(container).not.toBeNull();
      const textContent = container!.textContent ?? '';
      expect(textContent).toContain('VECTOR WARS');
      expect(textContent).toContain('FINAL SCORE: 12345');
    });
  });

  describe('restart prompt', () => {
    it('is NOT active during transmission and credits phases (not skippable)', () => {
      endingScreen.show(12345);

      // During the flash + transmission phase (well before credits finish)
      vi.advanceTimersByTime(2000);

      // The restart prompt should not be visible yet (opacity: 0)
      const container = document.body.querySelector('div[style*="z-index: 10"]');
      expect(container).not.toBeNull();
      // Find the restart prompt text
      const allDivs = container!.querySelectorAll('div');
      const promptDiv = Array.from(allDivs).find((d) => d.textContent === 'PRESS SPACE TO PLAY AGAIN');
      expect(promptDiv).toBeDefined();
      // It should have opacity 0 (not yet active)
      expect(promptDiv!.style.opacity).toBe('0');
    });
  });

  describe('dispose()', () => {
    it('removes overlay from DOM on dispose', () => {
      endingScreen.show(12345);
      const overlayBefore = document.body.querySelector('div[style*="z-index: 10"]');
      expect(overlayBefore).not.toBeNull();

      endingScreen.dispose();
      const overlayAfter = document.body.querySelector('div[style*="z-index: 10"]');
      expect(overlayAfter).toBeNull();
    });

    it('removes style element from DOM on dispose', () => {
      endingScreen.show(12345);
      const stylesBefore = document.querySelectorAll('style');
      const hasEndingStyle = Array.from(stylesBefore).some((s) => s.textContent?.includes('endingPromptPulse'));
      expect(hasEndingStyle).toBe(true);

      endingScreen.dispose();
      const stylesAfter = document.querySelectorAll('style');
      const hasEndingStyleAfter = Array.from(stylesAfter).some((s) => s.textContent?.includes('endingPromptPulse'));
      expect(hasEndingStyleAfter).toBe(false);
    });
  });
});

// ============================================================
// VoiceLineGenerator ending voice line tests
// ============================================================

describe('VoiceLineGenerator ending voice lines', () => {
  // Mock OfflineAudioContext for VoiceLineGenerator
  globalThis.OfflineAudioContext = vi.fn().mockImplementation(
    function MockOfflineAudioContext(_channels: number, length: number, sampleRate: number) {
      const buffer = {
        length,
        sampleRate,
        duration: length / sampleRate,
        numberOfChannels: 1,
        getChannelData: vi.fn().mockReturnValue(new Float32Array(length)),
        copyFromChannel: vi.fn(),
        copyToChannel: vi.fn(),
      } as unknown as AudioBuffer;

      return {
        sampleRate,
        length,
        destination: {},
        createOscillator: vi.fn().mockReturnValue({
          type: 'sine',
          frequency: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
        }),
        createGain: vi.fn().mockReturnValue({
          gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
          connect: vi.fn(),
        }),
        createBiquadFilter: vi.fn().mockReturnValue({
          type: 'lowpass',
          frequency: { setValueAtTime: vi.fn() },
          Q: { setValueAtTime: vi.fn() },
          connect: vi.fn(),
        }),
        createBuffer: vi.fn().mockReturnValue({
          getChannelData: vi.fn().mockReturnValue(new Float32Array(1024)),
        }),
        createBufferSource: vi.fn().mockReturnValue({
          buffer: null,
          loop: false,
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
        }),
        startRendering: vi.fn().mockResolvedValue(buffer),
      };
    }
  ) as unknown as typeof OfflineAudioContext;

  it('ending_desperate voice line ID exists', async () => {
    const { VoiceLineGenerator } = await import('../audio/VoiceLineGenerator.ts');
    const generator = new VoiceLineGenerator();
    expect(generator.hasSound('ending_desperate')).toBe(true);
  });

  it('ending_relief voice line ID exists', async () => {
    const { VoiceLineGenerator } = await import('../audio/VoiceLineGenerator.ts');
    const generator = new VoiceLineGenerator();
    expect(generator.hasSound('ending_relief')).toBe(true);
  });

  it('total voice line count is 61 (59 previous + 2 ending)', async () => {
    const { VoiceLineGenerator } = await import('../audio/VoiceLineGenerator.ts');
    const generator = new VoiceLineGenerator();
    const ids = generator.getSoundIds();
    // 8 handler L1 + 7 handler L2 + 7 handler L3 + 3 briefing + 2 ending + 10 tutorial + 9 gatekeeper + 7 avenger + 8 core intelligence = 61
    expect(ids.length).toBe(61);
  });
});
