// @vitest-environment jsdom
/**
 * BrowserCompatibility tests -- validates WebGL 2.0 detection,
 * unsupported browser messaging, and context loss overlay creation.
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

describe('BrowserCompatibility (Story 6-3)', () => {
  let originalCreateElement: typeof document.createElement;

  beforeEach(() => {
    originalCreateElement = document.createElement.bind(document);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('checkWebGL2Support', () => {
    it('returns true when WebGL2 context is available', async () => {
      const mockCanvas = {
        getContext: vi.fn().mockReturnValue({}), // non-null = WebGL2 available
      };
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement;
        return originalCreateElement(tag);
      });

      const { checkWebGL2Support } = await import('../core/BrowserCompatibility.ts');
      expect(checkWebGL2Support()).toBe(true);
      expect(mockCanvas.getContext).toHaveBeenCalledWith('webgl2');
    });

    it('returns false when canvas.getContext returns null', async () => {
      const mockCanvas = {
        getContext: vi.fn().mockReturnValue(null), // null = no WebGL2
      };
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement;
        return originalCreateElement(tag);
      });

      // Need fresh import to avoid module caching
      vi.resetModules();
      vi.mock('../core/Logger.ts', () => ({
        Logger: {
          info: vi.fn(),
          warn: vi.fn(),
          debug: vi.fn(),
          error: vi.fn(),
        },
      }));
      const { checkWebGL2Support } = await import('../core/BrowserCompatibility.ts');
      expect(checkWebGL2Support()).toBe(false);
    });

    it('returns false when getContext throws an exception', async () => {
      const mockCanvas = {
        getContext: vi.fn().mockImplementation(() => {
          throw new Error('WebGL not available');
        }),
      };
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement;
        return originalCreateElement(tag);
      });

      vi.resetModules();
      vi.mock('../core/Logger.ts', () => ({
        Logger: {
          info: vi.fn(),
          warn: vi.fn(),
          debug: vi.fn(),
          error: vi.fn(),
        },
      }));
      const { checkWebGL2Support } = await import('../core/BrowserCompatibility.ts');
      expect(checkWebGL2Support()).toBe(false);
    });
  });

  describe('showUnsupportedMessage', () => {
    it('creates a DOM overlay with the error message', async () => {
      const { showUnsupportedMessage } = await import('../core/BrowserCompatibility.ts');

      const container = document.createElement('div');
      document.body.appendChild(container);

      showUnsupportedMessage(container);

      const overlay = container.querySelector('#webgl-unsupported-overlay');
      expect(overlay).not.toBeNull();
      expect(overlay!.textContent).toContain('SYSTEM ERROR');
      expect(overlay!.textContent).toContain('WebGL 2.0 NOT DETECTED');
      expect(overlay!.textContent).toContain('Chrome');

      // Verify styling
      const overlayEl = overlay as HTMLDivElement;
      expect(overlayEl.style.position).toBe('fixed');
      expect(overlayEl.style.zIndex).toBe('9999');
      expect(overlayEl.style.backgroundColor).toBe('rgb(0, 0, 0)');

      container.remove();
    });
  });

  describe('createContextLossOverlay', () => {
    it('creates a hidden overlay with recovery message', async () => {
      const { createContextLossOverlay } = await import('../core/BrowserCompatibility.ts');

      const overlay = createContextLossOverlay();
      expect(overlay).toBeInstanceOf(HTMLDivElement);
      expect(overlay.id).toBe('webgl-context-loss-overlay');
      expect(overlay.style.display).toBe('none');
      expect(overlay.textContent).toContain('GPU CONTEXT LOST');
      expect(overlay.textContent).toContain('Recovering');
    });
  });
});
