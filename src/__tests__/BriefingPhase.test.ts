import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Logger
vi.mock('../core/Logger.ts', () => ({
  Logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock BriefingScreen
let mockShow = vi.fn();
let mockDispose = vi.fn();

vi.mock('../ui/screens/BriefingScreen.ts', () => {
  class MockBriefingScreen {
    show = mockShow;
    skip = vi.fn();
    dispose = mockDispose;
  }
  return {
    BriefingScreen: MockBriefingScreen,
  };
});

import { BriefingPhase } from '../state/phases/BriefingPhase.ts';
import type { BriefingData } from '../ui/screens/BriefingScreen.ts';

const testData: BriefingData = {
  title: 'TEST BRIEFING',
  speaker: 'handler',
  lines: ['Line 1', 'Line 2'],
};

describe('BriefingPhase (Story 4-4)', () => {
  beforeEach(() => {
    mockShow = vi.fn();
    mockDispose = vi.fn();

    // Re-assign to the mock module
    vi.mocked(mockShow).mockReset();
    vi.mocked(mockDispose).mockReset();
  });

  it('creates BriefingScreen and shows it on enter()', () => {
    const phase = new BriefingPhase(testData);
    phase.enter();

    // show is called on the BriefingScreen instance
    // Since we mocked the class, we need to check the instance method
    // The mockShow is the function we track
    expect(mockShow).toHaveBeenCalledTimes(1);
  });

  it('isComplete returns false initially', () => {
    const phase = new BriefingPhase(testData);
    phase.enter();
    expect(phase.isComplete()).toBe(false);
  });

  it('isComplete returns true after onComplete callback fires', () => {
    const phase = new BriefingPhase(testData);

    // Capture the onComplete callback from show()
    mockShow.mockImplementation((_data: BriefingData, onComplete: () => void) => {
      // Immediately trigger onComplete
      onComplete();
    });

    phase.enter();
    expect(phase.isComplete()).toBe(true);
  });

  it('exit() disposes the BriefingScreen', () => {
    const phase = new BriefingPhase(testData);
    phase.enter();
    phase.exit();

    expect(mockDispose).toHaveBeenCalledTimes(1);
  });

  it('update(dt) does not throw', () => {
    const phase = new BriefingPhase(testData);
    phase.enter();
    expect(() => phase.update(0.016)).not.toThrow();
  });

  it('exit() without enter() does not throw', () => {
    const phase = new BriefingPhase(testData);
    expect(() => phase.exit()).not.toThrow();
  });

  it('accepts briefing data with title, lines, and speaker', () => {
    const customData: BriefingData = {
      title: 'CUSTOM TITLE',
      speaker: 'handler',
      lines: ['Custom line'],
    };

    const phase = new BriefingPhase(customData);
    phase.enter();

    // Verify show was called with the custom data
    expect(mockShow).toHaveBeenCalledWith(customData, expect.any(Function));
  });
});
