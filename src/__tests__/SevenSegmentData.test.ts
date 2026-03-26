import { describe, it, expect } from 'vitest';

describe('SevenSegmentData', () => {
  it('SEGMENTS is exported and has keys a through g', async () => {
    const mod = await import('../ui/hud/SevenSegmentData.ts');
    expect(mod.SEGMENTS).toBeDefined();
    const keys = Object.keys(mod.SEGMENTS);
    expect(keys).toContain('a');
    expect(keys).toContain('b');
    expect(keys).toContain('c');
    expect(keys).toContain('d');
    expect(keys).toContain('e');
    expect(keys).toContain('f');
    expect(keys).toContain('g');
    expect(keys.length).toBe(7);
  });

  it('DIGIT_SEGMENTS is exported and has entries for digits 0-9', async () => {
    const mod = await import('../ui/hud/SevenSegmentData.ts');
    expect(mod.DIGIT_SEGMENTS).toBeDefined();
    for (let d = 0; d <= 9; d++) {
      expect(mod.DIGIT_SEGMENTS[d]).toBeDefined();
    }
  });

  it('each segment in SEGMENTS is an array of 4 numbers', async () => {
    const mod = await import('../ui/hud/SevenSegmentData.ts');
    for (const key of Object.keys(mod.SEGMENTS)) {
      const seg = mod.SEGMENTS[key as keyof typeof mod.SEGMENTS];
      expect(Array.isArray(seg)).toBe(true);
      expect(seg.length).toBe(4);
      for (const val of seg) {
        expect(typeof val).toBe('number');
      }
    }
  });

  it('each digit entry in DIGIT_SEGMENTS is a non-empty array of valid segment keys', async () => {
    const mod = await import('../ui/hud/SevenSegmentData.ts');
    const validKeys = Object.keys(mod.SEGMENTS);
    for (let d = 0; d <= 9; d++) {
      const segs = mod.DIGIT_SEGMENTS[d];
      expect(Array.isArray(segs)).toBe(true);
      expect(segs.length).toBeGreaterThan(0);
      for (const s of segs) {
        expect(validKeys).toContain(s);
      }
    }
  });
});
