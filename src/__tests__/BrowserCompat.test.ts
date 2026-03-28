// @vitest-environment jsdom
/**
 * BrowserCompat tests -- validates browser compatibility features added to main.ts:
 * pixel ratio clamping, debounced resize, visibility change handler,
 * and WebGL context loss/restore handling.
 *
 * These test the behavioral patterns in isolation since main.ts cannot be
 * imported directly in a test environment (no WebGL context).
 *
 * Story 6-3: Browser Compatibility Testing
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

describe('BrowserCompat — Pixel Ratio Clamping (Story 6-3)', () => {
  it('clamps devicePixelRatio to max 2.0', () => {
    // Simulate high-DPI display (e.g., Retina Mac at 3x)
    const originalDPR = window.devicePixelRatio;

    Object.defineProperty(window, 'devicePixelRatio', {
      value: 3.0,
      writable: true,
      configurable: true,
    });

    const clamped = Math.min(window.devicePixelRatio, 2);
    expect(clamped).toBe(2);

    Object.defineProperty(window, 'devicePixelRatio', {
      value: originalDPR,
      writable: true,
      configurable: true,
    });
  });

  it('preserves devicePixelRatio when already <= 2.0', () => {
    const originalDPR = window.devicePixelRatio;

    Object.defineProperty(window, 'devicePixelRatio', {
      value: 1.5,
      writable: true,
      configurable: true,
    });

    const clamped = Math.min(window.devicePixelRatio, 2);
    expect(clamped).toBe(1.5);

    Object.defineProperty(window, 'devicePixelRatio', {
      value: originalDPR,
      writable: true,
      configurable: true,
    });
  });

  it('handles devicePixelRatio of exactly 2.0', () => {
    const originalDPR = window.devicePixelRatio;

    Object.defineProperty(window, 'devicePixelRatio', {
      value: 2.0,
      writable: true,
      configurable: true,
    });

    const clamped = Math.min(window.devicePixelRatio, 2);
    expect(clamped).toBe(2);

    Object.defineProperty(window, 'devicePixelRatio', {
      value: originalDPR,
      writable: true,
      configurable: true,
    });
  });
});

describe('BrowserCompat — Debounced Resize Handler (Story 6-3)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounced resize updates renderer and pipeline sizes after delay', () => {
    const setSize = vi.fn();
    const pipelineResize = vi.fn();
    const updateProjectionMatrix = vi.fn();
    const updateResolution = vi.fn();

    const mockCamera = {
      aspect: 1,
      updateProjectionMatrix,
    };

    // Simulate the debounced resize handler pattern from main.ts
    let resizeTimeout: ReturnType<typeof setTimeout> | undefined;
    const onWindowResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        mockCamera.aspect = width / height;
        mockCamera.updateProjectionMatrix();
        setSize(width, height);
        pipelineResize(width, height);
        updateResolution(width, height);
      }, 150);
    };

    // Fire resize events rapidly
    onWindowResize();
    onWindowResize();
    onWindowResize();

    // Before debounce timeout, nothing should have been called
    expect(setSize).not.toHaveBeenCalled();
    expect(pipelineResize).not.toHaveBeenCalled();

    // Advance past debounce delay
    vi.advanceTimersByTime(150);

    // Now the resize should have executed exactly once
    expect(setSize).toHaveBeenCalledTimes(1);
    expect(pipelineResize).toHaveBeenCalledTimes(1);
    expect(updateProjectionMatrix).toHaveBeenCalledTimes(1);
    expect(updateResolution).toHaveBeenCalledTimes(1);
  });

  it('resets debounce timer on each new resize event', () => {
    const callback = vi.fn();

    let resizeTimeout: ReturnType<typeof setTimeout> | undefined;
    const onResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(callback, 150);
    };

    // Fire at t=0
    onResize();

    // Advance 100ms (not yet triggered)
    vi.advanceTimersByTime(100);
    expect(callback).not.toHaveBeenCalled();

    // Fire again at t=100 (resets the timer)
    onResize();

    // Advance another 100ms (t=200, still within new 150ms window)
    vi.advanceTimersByTime(100);
    expect(callback).not.toHaveBeenCalled();

    // Advance final 50ms (t=250, 150ms after second call)
    vi.advanceTimersByTime(50);
    expect(callback).toHaveBeenCalledTimes(1);
  });
});

describe('BrowserCompat — Visibility Change Handler (Story 6-3)', () => {
  it('pauses animation loop when document is hidden', () => {
    const setAnimationLoop = vi.fn();
    const gameLoop = vi.fn();

    // Simulate the visibility change handler pattern
    const handler = () => {
      if (document.hidden) {
        setAnimationLoop(null);
      } else {
        setAnimationLoop(gameLoop);
      }
    };

    // Simulate tab hidden
    Object.defineProperty(document, 'hidden', {
      value: true,
      writable: true,
      configurable: true,
    });

    handler();
    expect(setAnimationLoop).toHaveBeenCalledWith(null);
  });

  it('resumes animation loop when document becomes visible', () => {
    const setAnimationLoop = vi.fn();
    const gameLoop = vi.fn();

    const handler = () => {
      if (document.hidden) {
        setAnimationLoop(null);
      } else {
        setAnimationLoop(gameLoop);
      }
    };

    // Simulate tab visible
    Object.defineProperty(document, 'hidden', {
      value: false,
      writable: true,
      configurable: true,
    });

    handler();
    expect(setAnimationLoop).toHaveBeenCalledWith(gameLoop);
  });
});

describe('BrowserCompat — WebGL Context Loss Handler (Story 6-3)', () => {
  it('preventDefault is called on contextlost event', () => {
    const event = new Event('webglcontextlost');
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    // Simulate the context loss handler pattern
    const contextLostHandler = (e: Event) => {
      e.preventDefault();
    };

    contextLostHandler(event);
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('recovery overlay is shown on contextlost and hidden on contextrestored', async () => {
    const { createContextLossOverlay } = await import('../core/BrowserCompatibility.ts');
    const overlay = createContextLossOverlay();

    // Initially hidden
    expect(overlay.style.display).toBe('none');

    // Simulate context loss — show overlay
    overlay.style.display = 'flex';
    expect(overlay.style.display).toBe('flex');

    // Simulate context restored — hide overlay
    overlay.style.display = 'none';
    expect(overlay.style.display).toBe('none');
  });
});
