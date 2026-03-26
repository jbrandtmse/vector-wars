import type { InputAction } from '../config/input.ts';
import { INPUT_ACTIONS } from '../config/input.ts';

/**
 * Action-mapped keyboard input manager.
 * Tracks keyboard state via keydown/keyup events and exposes named action queries.
 * Systems query input.isActive('fire') each frame, never physical keys directly.
 */
export class InputManager {
  private activeKeys: Set<string> = new Set();
  private mappedCodes: Set<string>;
  private handleKeydown: (event: KeyboardEvent) => void;
  private handleKeyup: (event: KeyboardEvent) => void;

  constructor() {
    // Pre-compute the set of mapped key codes for fast preventDefault lookup
    this.mappedCodes = new Set(Object.values(INPUT_ACTIONS));

    this.handleKeydown = (event: KeyboardEvent): void => {
      // Prevent default browser behavior (e.g., arrow key scrolling) for mapped keys.
      // This must happen BEFORE the repeat check so held arrow keys don't scroll the page.
      if (this.mappedCodes.has(event.code)) {
        event.preventDefault();
      }

      // Suppress browser key-repeat events — don't re-add to activeKeys
      if (event.repeat) return;

      this.activeKeys.add(event.code);
    };

    this.handleKeyup = (event: KeyboardEvent): void => {
      this.activeKeys.delete(event.code);
    };

    window.addEventListener('keydown', this.handleKeydown);
    window.addEventListener('keyup', this.handleKeyup);
  }

  /**
   * Returns true while the corresponding key for the given action is held down.
   * Supports simultaneous multi-key presses.
   */
  isActive(action: InputAction): boolean {
    const code = INPUT_ACTIONS[action];
    if (!code) return false;
    return this.activeKeys.has(code);
  }

  /**
   * Removes all keyboard event listeners. Call on cleanup.
   */
  dispose(): void {
    window.removeEventListener('keydown', this.handleKeydown);
    window.removeEventListener('keyup', this.handleKeyup);
    this.activeKeys.clear();
  }
}
