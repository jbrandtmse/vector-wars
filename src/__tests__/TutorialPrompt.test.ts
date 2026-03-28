// @vitest-environment jsdom
/**
 * TutorialPrompt Tests (Story 4-3)
 *
 * Tests the HTML overlay component for displaying tutorial prompts.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TutorialPrompt } from '../ui/screens/TutorialPrompt.ts';

describe('TutorialPrompt (Story 4-3)', () => {
  let prompt: TutorialPrompt;

  beforeEach(() => {
    prompt = new TutorialPrompt();
  });

  afterEach(() => {
    prompt.dispose();
  });

  it('appends container element to document.body on construction', () => {
    const containers = document.body.querySelectorAll('div');
    // There should be at least the container div added by TutorialPrompt
    expect(containers.length).toBeGreaterThan(0);
  });

  it('is not visible initially', () => {
    expect(prompt.isVisible()).toBe(false);
  });

  it('show() makes the prompt visible', () => {
    prompt.show('TEST PROMPT');
    expect(prompt.isVisible()).toBe(true);
  });

  it('show() sets the text content', () => {
    prompt.show('PRESS SPACE TO FIRE');
    // The container should contain the text
    const containers = document.body.querySelectorAll('div');
    let found = false;
    containers.forEach((el) => {
      if (el.textContent === 'PRESS SPACE TO FIRE') {
        found = true;
      }
    });
    expect(found).toBe(true);
  });

  it('hide() makes the prompt not visible after transition', async () => {
    prompt.show('TEST');
    expect(prompt.isVisible()).toBe(true);

    prompt.hide();
    // After the 300ms timeout, visible should be false
    await new Promise((r) => setTimeout(r, 350));
    expect(prompt.isVisible()).toBe(false);
  });

  it('dispose() removes the container from DOM', () => {
    const containersBefore = document.body.children.length;
    prompt.dispose();
    const containersAfter = document.body.children.length;
    // Should have removed at least the container
    expect(containersAfter).toBeLessThan(containersBefore);
  });

  it('dispose() removes the style element from head', () => {
    const stylesBefore = document.head.querySelectorAll('style').length;
    prompt.dispose();
    const stylesAfter = document.head.querySelectorAll('style').length;
    expect(stylesAfter).toBeLessThan(stylesBefore);
  });

  it('uses green color for text', () => {
    prompt.show('TEST');
    const containers = document.body.querySelectorAll('div');
    let greenFound = false;
    containers.forEach((el) => {
      if ((el as HTMLElement).style.color === '#00ff41' || (el as HTMLElement).style.color === 'rgb(0, 255, 65)') {
        greenFound = true;
      }
    });
    expect(greenFound).toBe(true);
  });
});
