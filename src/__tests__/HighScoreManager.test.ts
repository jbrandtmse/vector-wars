/**
 * HighScoreManager tests -- validates localStorage persistence, sorting,
 * entry limits, graceful error handling, and default scores.
 *
 * Story 5-11: High Score Table
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../core/Logger.ts', () => ({
  Logger: {
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock localStorage
const mockStorage: Record<string, string> = {};

const mockLocalStorage = {
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key];
  }),
};

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('HighScoreManager (Story 5-11)', () => {
  beforeEach(() => {
    vi.resetModules();
    // Clear mock storage
    for (const key of Object.keys(mockStorage)) {
      delete mockStorage[key];
    }
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
    // Reset implementation to defaults
    mockLocalStorage.getItem.mockImplementation((key: string) => mockStorage[key] ?? null);
    mockLocalStorage.setItem.mockImplementation((key: string, value: string) => {
      mockStorage[key] = value;
    });
    mockLocalStorage.removeItem.mockImplementation((key: string) => {
      delete mockStorage[key];
    });
  });

  it('getScores returns default entries on first load', async () => {
    const { HighScoreManager } = await import('../systems/HighScoreManager.ts');
    const manager = new HighScoreManager();
    const scores = manager.getScores();
    expect(scores).toHaveLength(10);
    expect(scores[0].initials).toBe('ACE');
    expect(scores[0].score).toBe(50000);
    expect(scores[9].initials).toBe('VEC');
    expect(scores[9].score).toBe(5000);
  });

  it('addScore inserts and sorts correctly', async () => {
    const { HighScoreManager } = await import('../systems/HighScoreManager.ts');
    const manager = new HighScoreManager();
    const result = manager.addScore('PRO', 47000);
    // PRO (47000) should be between ACE (50000) and DEV (45000) -- rank 2
    expect(result[0].initials).toBe('ACE');
    expect(result[0].score).toBe(50000);
    expect(result[1].initials).toBe('PRO');
    expect(result[1].score).toBe(47000);
    expect(result[2].initials).toBe('DEV');
    expect(result[2].score).toBe(45000);
  });

  it('addScore limits to 10 entries', async () => {
    const { HighScoreManager } = await import('../systems/HighScoreManager.ts');
    const manager = new HighScoreManager();
    // Table starts with 10 default entries. Adding one should still be 10.
    manager.addScore('TOP', 99999);
    const scores = manager.getScores();
    expect(scores).toHaveLength(10);
    // TOP should be first, VEC (5000) should be bumped off
    expect(scores[0].initials).toBe('TOP');
    expect(scores[0].score).toBe(99999);
    const hasVec = scores.some((s) => s.initials === 'VEC');
    expect(hasVec).toBe(false);
  });

  it('isHighScore returns true for qualifying score', async () => {
    const { HighScoreManager } = await import('../systems/HighScoreManager.ts');
    const manager = new HighScoreManager();
    // Lowest default is VEC at 5000. Score of 6000 qualifies.
    expect(manager.isHighScore(6000)).toBe(true);
  });

  it('isHighScore returns false for non-qualifying score', async () => {
    const { HighScoreManager } = await import('../systems/HighScoreManager.ts');
    const manager = new HighScoreManager();
    // Lowest default is VEC at 5000. Score of 5000 or below does not qualify (must be > lowest).
    expect(manager.isHighScore(5000)).toBe(false);
    expect(manager.isHighScore(1000)).toBe(false);
    expect(manager.isHighScore(0)).toBe(false);
  });

  it('handles corrupted localStorage data gracefully', async () => {
    // Pre-populate with corrupted data
    mockStorage['vectorWarsHighScores'] = '{"highScores": "not_an_array"}';

    const { HighScoreManager } = await import('../systems/HighScoreManager.ts');
    const manager = new HighScoreManager();
    const scores = manager.getScores();
    // Should fall back to defaults
    expect(scores).toHaveLength(10);
    expect(scores[0].initials).toBe('ACE');
  });

  it('handles localStorage unavailable gracefully', async () => {
    // Make localStorage throw on access
    mockLocalStorage.setItem.mockImplementation(() => {
      throw new Error('Storage full');
    });
    mockLocalStorage.removeItem.mockImplementation(() => {
      throw new Error('Storage full');
    });

    const { HighScoreManager } = await import('../systems/HighScoreManager.ts');
    const manager = new HighScoreManager();
    const scores = manager.getScores();
    // Should fall back to in-memory defaults
    expect(scores).toHaveLength(10);
    expect(scores[0].initials).toBe('ACE');
    // Should still be able to add scores (in-memory only)
    manager.addScore('MEM', 99999);
    expect(manager.getScores()[0].initials).toBe('MEM');
  });

  it('clearScores resets to defaults', async () => {
    const { HighScoreManager } = await import('../systems/HighScoreManager.ts');
    const manager = new HighScoreManager();
    manager.addScore('TOP', 99999);
    expect(manager.getScores()[0].initials).toBe('TOP');
    manager.clearScores();
    const scores = manager.getScores();
    expect(scores).toHaveLength(10);
    expect(scores[0].initials).toBe('ACE');
    expect(scores[0].score).toBe(50000);
  });

  it('persists scores to localStorage', async () => {
    const { HighScoreManager } = await import('../systems/HighScoreManager.ts');
    const manager = new HighScoreManager();
    manager.addScore('SAV', 60000);

    // Check that localStorage.setItem was called with correct key
    const lastCall = mockLocalStorage.setItem.mock.calls[mockLocalStorage.setItem.mock.calls.length - 1];
    expect(lastCall[0]).toBe('vectorWarsHighScores');
    const parsed = JSON.parse(lastCall[1] as string) as { highScores: { initials: string; score: number }[] };
    expect(parsed.highScores[0].initials).toBe('SAV');
    expect(parsed.highScores[0].score).toBe(60000);
  });

  it('loads scores from existing localStorage', async () => {
    // Pre-populate valid data
    const preData = {
      highScores: [
        { initials: 'OLD', score: 99999, date: '2026-03-01' },
        { initials: 'TWO', score: 50000, date: '2026-03-02' },
      ],
    };
    mockStorage['vectorWarsHighScores'] = JSON.stringify(preData);

    const { HighScoreManager } = await import('../systems/HighScoreManager.ts');
    const manager = new HighScoreManager();
    const scores = manager.getScores();
    expect(scores[0].initials).toBe('OLD');
    expect(scores[0].score).toBe(99999);
    expect(scores[1].initials).toBe('TWO');
  });

  it('handles JSON parse error gracefully', async () => {
    // Pre-populate with invalid JSON
    mockStorage['vectorWarsHighScores'] = '{broken json!!!}';

    const { HighScoreManager } = await import('../systems/HighScoreManager.ts');
    const manager = new HighScoreManager();
    const scores = manager.getScores();
    // Should fall back to defaults
    expect(scores).toHaveLength(10);
    expect(scores[0].initials).toBe('ACE');
  });

  it('pads short initials and truncates long initials', async () => {
    const { HighScoreManager } = await import('../systems/HighScoreManager.ts');
    const manager = new HighScoreManager();
    // Short initials -- padded to 3 chars with 'A'
    manager.addScore('A', 99999);
    expect(manager.getScores()[0].initials).toBe('AAA');
    // Long initials -- truncated to 3 chars
    manager.addScore('ABCDEF', 99998);
    expect(manager.getScores()[1].initials).toBe('ABC');
  });
});
