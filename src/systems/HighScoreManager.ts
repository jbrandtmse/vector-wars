/**
 * HighScoreManager -- Manages localStorage persistence of a top-10 high score table.
 *
 * Stores entries as JSON in localStorage. Handles graceful fallback to in-memory
 * storage if localStorage is unavailable or corrupted. Initializes with default
 * arcade-style entries on first load.
 *
 * Created by: Story 5-11
 */

import { Logger } from '../core/Logger.ts';

/** A single high score entry. */
export type HighScoreEntry = {
  readonly initials: string;
  readonly score: number;
  readonly date: string;
};

/** localStorage key for high scores. */
const STORAGE_KEY = 'vectorWarsHighScores';

/** Maximum number of entries to store. */
const MAX_ENTRIES = 10;

/** Default high scores shown on first load. Classic arcade style. */
const DEFAULT_SCORES: readonly HighScoreEntry[] = [
  { initials: 'ACE', score: 50000, date: '2026-01-01' },
  { initials: 'DEV', score: 45000, date: '2026-01-01' },
  { initials: 'CPU', score: 40000, date: '2026-01-01' },
  { initials: 'NET', score: 35000, date: '2026-01-01' },
  { initials: 'RAM', score: 30000, date: '2026-01-01' },
  { initials: 'SYS', score: 25000, date: '2026-01-01' },
  { initials: 'BIT', score: 20000, date: '2026-01-01' },
  { initials: 'HEX', score: 15000, date: '2026-01-01' },
  { initials: 'ROM', score: 10000, date: '2026-01-01' },
  { initials: 'VEC', score: 5000, date: '2026-01-01' },
] as const;

export class HighScoreManager {
  private scores: HighScoreEntry[];
  private storageAvailable: boolean;

  constructor() {
    this.storageAvailable = this.checkStorageAvailable();
    this.scores = this.loadScores();
    Logger.info('HighScoreManager', 'High score manager initialized', {
      entries: this.scores.length,
      storageAvailable: this.storageAvailable,
    });
  }

  /** Returns the current high score entries, sorted descending by score. */
  getScores(): HighScoreEntry[] {
    return [...this.scores];
  }

  /** Returns true if the given score qualifies for the high score table. */
  isHighScore(score: number): boolean {
    if (this.scores.length < MAX_ENTRIES) return true;
    const lowestScore = this.scores[this.scores.length - 1].score;
    return score > lowestScore;
  }

  /**
   * Adds a new high score entry. Returns the updated scores array.
   * If the table is full and the score does not qualify, it is not added.
   */
  addScore(initials: string, score: number): HighScoreEntry[] {
    const date = new Date().toISOString().split('T')[0];
    const entry: HighScoreEntry = {
      initials: initials.toUpperCase().slice(0, 3).padEnd(3, 'A'),
      score,
      date,
    };

    this.scores.push(entry);
    this.scores.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Ties broken by earlier date
      return a.date.localeCompare(b.date);
    });

    // Trim to max entries
    if (this.scores.length > MAX_ENTRIES) {
      this.scores = this.scores.slice(0, MAX_ENTRIES);
    }

    this.saveScores();

    Logger.info('HighScoreManager', 'High score added', {
      initials: entry.initials,
      score: entry.score,
    });

    return this.getScores();
  }

  /** Clears all scores and resets to defaults. */
  clearScores(): void {
    this.scores = [...DEFAULT_SCORES];
    this.saveScores();
    Logger.info('HighScoreManager', 'High scores cleared and reset to defaults');
  }

  private checkStorageAvailable(): boolean {
    try {
      const testKey = '__vectorWarsStorageTest__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      Logger.warn('HighScoreManager', 'localStorage unavailable, using in-memory fallback');
      return false;
    }
  }

  private loadScores(): HighScoreEntry[] {
    if (!this.storageAvailable) {
      return [...DEFAULT_SCORES];
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        // First load -- initialize with defaults and save
        const defaults = [...DEFAULT_SCORES];
        this.scores = defaults;
        this.saveScores();
        return defaults;
      }

      const parsed = JSON.parse(raw) as { highScores?: unknown };
      if (!parsed || !Array.isArray(parsed.highScores)) {
        Logger.warn('HighScoreManager', 'Corrupted localStorage data, resetting to defaults');
        const defaults = [...DEFAULT_SCORES];
        this.scores = defaults;
        this.saveScores();
        return defaults;
      }

      // Validate each entry
      const validated: HighScoreEntry[] = [];
      for (const entry of parsed.highScores) {
        if (
          entry &&
          typeof entry === 'object' &&
          typeof (entry as HighScoreEntry).initials === 'string' &&
          typeof (entry as HighScoreEntry).score === 'number' &&
          typeof (entry as HighScoreEntry).date === 'string'
        ) {
          validated.push({
            initials: (entry as HighScoreEntry).initials,
            score: (entry as HighScoreEntry).score,
            date: (entry as HighScoreEntry).date,
          });
        }
      }

      if (validated.length === 0) {
        Logger.warn('HighScoreManager', 'No valid entries in localStorage, resetting to defaults');
        const defaults = [...DEFAULT_SCORES];
        this.scores = defaults;
        this.saveScores();
        return defaults;
      }

      // Sort descending by score
      validated.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.date.localeCompare(b.date);
      });

      return validated.slice(0, MAX_ENTRIES);
    } catch {
      Logger.warn('HighScoreManager', 'Failed to parse localStorage data, resetting to defaults');
      const defaults = [...DEFAULT_SCORES];
      this.scores = defaults;
      this.saveScores();
      return defaults;
    }
  }

  private saveScores(): void {
    if (!this.storageAvailable) return;

    try {
      const data = JSON.stringify({ highScores: this.scores });
      localStorage.setItem(STORAGE_KEY, data);
    } catch {
      Logger.warn('HighScoreManager', 'Failed to save high scores to localStorage');
    }
  }
}
