/**
 * Input action type — named actions that the game logic queries.
 * Systems use InputManager.isActive(action) rather than checking raw key codes.
 */
export type InputAction = 'moveUp' | 'moveDown' | 'moveLeft' | 'moveRight' | 'fire' | 'logicBomb' | 'emp';

/**
 * Action-to-key mapping using KeyboardEvent.code values.
 * KeyboardEvent.code represents physical key position, independent of keyboard layout.
 */
export const INPUT_ACTIONS: Readonly<Record<InputAction, string>> = {
  moveUp: 'ArrowUp',
  moveDown: 'ArrowDown',
  moveLeft: 'ArrowLeft',
  moveRight: 'ArrowRight',
  fire: 'Space',
  logicBomb: 'KeyZ',
  emp: 'KeyX',
} as const;
