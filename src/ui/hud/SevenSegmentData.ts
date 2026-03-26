/**
 * SevenSegmentData — Shared seven-segment digit geometry data.
 *
 * Used by ScoreDisplay (HUD) and ScorePopup (world-space kill popups).
 * Extracted to prevent code duplication.
 *
 * Created by: Story 2-8 (extracted from Story 2-6 ScoreDisplay)
 */

// Seven-segment display layout (normalized 0-1):
//  ___a___
// |       |
// f       b
// |___g___|
// |       |
// e       c
// |___d___|
//
// Segment positions (x1, y1, x2, y2) relative to digit origin:
export const SEGMENTS: Record<string, number[]> = {
  a: [0.1, 1.0, 0.9, 1.0],   // top horizontal
  b: [0.9, 0.55, 0.9, 1.0],  // top-right vertical
  c: [0.9, 0.0, 0.9, 0.45],  // bottom-right vertical
  d: [0.1, 0.0, 0.9, 0.0],   // bottom horizontal
  e: [0.1, 0.0, 0.1, 0.45],  // bottom-left vertical
  f: [0.1, 0.55, 0.1, 1.0],  // top-left vertical
  g: [0.1, 0.5, 0.9, 0.5],   // middle horizontal
};

// Which segments are active for each digit:
export const DIGIT_SEGMENTS: Record<number, string[]> = {
  0: ['a', 'b', 'c', 'd', 'e', 'f'],
  1: ['b', 'c'],
  2: ['a', 'b', 'd', 'e', 'g'],
  3: ['a', 'b', 'c', 'd', 'g'],
  4: ['b', 'c', 'f', 'g'],
  5: ['a', 'c', 'd', 'f', 'g'],
  6: ['a', 'c', 'd', 'e', 'f', 'g'],
  7: ['a', 'b', 'c'],
  8: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
  9: ['a', 'b', 'c', 'd', 'f', 'g'],
};
