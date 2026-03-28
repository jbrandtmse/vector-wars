// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('CommOverlay (Story 4-1)', () => {
  let CommOverlay: typeof import('../ui/screens/CommOverlay.ts').CommOverlay;
  let overlay: InstanceType<typeof CommOverlay>;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../ui/screens/CommOverlay.ts');
    CommOverlay = mod.CommOverlay;
    overlay = new CommOverlay();
  });

  afterEach(() => {
    overlay.dispose();
  });

  it('should be exported as a class', () => {
    expect(CommOverlay).toBeDefined();
    expect(typeof CommOverlay).toBe('function');
  });

  it('should have show method on prototype', () => {
    expect(typeof CommOverlay.prototype.show).toBe('function');
  });

  it('should have update method on prototype', () => {
    expect(typeof CommOverlay.prototype.update).toBe('function');
  });

  it('should have hide method on prototype', () => {
    expect(typeof CommOverlay.prototype.hide).toBe('function');
  });

  it('should have isVisible method on prototype', () => {
    expect(typeof CommOverlay.prototype.isVisible).toBe('function');
  });

  it('should have dispose method on prototype', () => {
    expect(typeof CommOverlay.prototype.dispose).toBe('function');
  });

  it('should start as not visible', () => {
    expect(overlay.isVisible()).toBe(false);
  });

  it('show() makes overlay visible with correct speaker and text', () => {
    overlay.show('HANDLER', 'Stay sharp.');

    expect(overlay.isVisible()).toBe(true);

    // Verify DOM elements were created (appended to document.body)
    const containers = document.querySelectorAll('div[style*="position: fixed"]');
    expect(containers.length).toBeGreaterThan(0);
  });

  it('show() uppercases the speaker label', () => {
    overlay.show('handler', 'Test message');

    // The speaker label should be uppercase in the DOM
    const allDivs = document.querySelectorAll('div');
    const speakerDiv = Array.from(allDivs).find(
      (d) => d.textContent === 'HANDLER' && d.style.letterSpacing === '0.15em'
    );
    expect(speakerDiv).toBeDefined();
  });

  it('update(dt) advances typewriter progress', () => {
    overlay.show('HANDLER', 'Hello World');

    // Initially no text revealed
    // After some updates, text should be partially revealed
    overlay.update(0.1); // 3 chars at 30 chars/sec
    overlay.update(0.1); // 6 chars total

    // The message div should have partial text
    const allDivs = document.querySelectorAll('div');
    const messageDiv = Array.from(allDivs).find(
      (d) => d.style.lineHeight === '1.4'
    );
    expect(messageDiv).toBeDefined();
    // After 0.2s at 30 chars/sec = 6 chars revealed
    expect(messageDiv!.textContent!.length).toBe(6);
  });

  it('update(dt) reveals full text after sufficient time', () => {
    const text = 'Short';
    overlay.show('HANDLER', text);

    // 5 chars at 30 chars/sec = 0.167s needed
    overlay.update(0.5); // more than enough

    const allDivs = document.querySelectorAll('div');
    const messageDiv = Array.from(allDivs).find(
      (d) => d.style.lineHeight === '1.4'
    );
    expect(messageDiv).toBeDefined();
    expect(messageDiv!.textContent).toBe('Short');
  });

  it('hide() triggers fade-out and marks as not visible after transition', () => {
    vi.useFakeTimers();

    overlay.show('HANDLER', 'Test');
    expect(overlay.isVisible()).toBe(true);

    overlay.hide();

    // After transition time (300ms), should be not visible
    vi.advanceTimersByTime(400);
    expect(overlay.isVisible()).toBe(false);

    vi.useRealTimers();
  });

  it('dispose() removes DOM elements', () => {
    // Count initial body children
    const initialCount = document.body.children.length;

    // Creating a new overlay adds an element
    const tempOverlay = new CommOverlay();
    expect(document.body.children.length).toBe(initialCount + 1);

    // Dispose removes it
    tempOverlay.dispose();
    expect(document.body.children.length).toBe(initialCount);
  });

  it('isVisible() returns correct state', () => {
    expect(overlay.isVisible()).toBe(false);

    overlay.show('HANDLER', 'Hello');
    expect(overlay.isVisible()).toBe(true);
  });

  it('show() with custom color applies to speaker and text', () => {
    overlay.show('HANDLER', 'Test', '#ff0000');

    const allDivs = document.querySelectorAll('div');
    const speakerDiv = Array.from(allDivs).find(
      (d) => d.textContent === 'HANDLER' && d.style.letterSpacing === '0.15em'
    );
    expect(speakerDiv).toBeDefined();
    // JSDOM normalizes hex colors to rgb()
    expect(speakerDiv!.style.color).toBe('rgb(255, 0, 0)');
  });
});
