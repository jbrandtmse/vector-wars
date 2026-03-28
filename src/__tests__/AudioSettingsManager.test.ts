/**
 * AudioSettingsManager tests -- validates localStorage persistence,
 * default values, corrupted data handling, and graceful error recovery.
 *
 * Story 6-7: Final Audio Polish
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AudioSettings } from '../audio/AudioSettingsManager.ts';

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

describe('AudioSettingsManager (Story 6-7)', () => {
  beforeEach(() => {
    vi.resetModules();
    // Clear mock storage
    for (const key of Object.keys(mockStorage)) {
      delete mockStorage[key];
    }
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
    // Reset implementations to defaults
    mockLocalStorage.getItem.mockImplementation((key: string) => mockStorage[key] ?? null);
    mockLocalStorage.setItem.mockImplementation((key: string, value: string) => {
      mockStorage[key] = value;
    });
    mockLocalStorage.removeItem.mockImplementation((key: string) => {
      delete mockStorage[key];
    });
  });

  it('getDefaults returns expected default volumes', async () => {
    const { AudioSettingsManager } = await import('../audio/AudioSettingsManager.ts');
    const manager = new AudioSettingsManager();
    const defaults = manager.getDefaults();

    expect(defaults).toEqual({
      master: 1.0,
      sfx: 0.6,
      voice: 0.9,
      ambient: 0.4,
      music: 0.3,
    });
  });

  it('loadSettings returns defaults when localStorage is empty', async () => {
    const { AudioSettingsManager } = await import('../audio/AudioSettingsManager.ts');
    const manager = new AudioSettingsManager();
    const settings = manager.loadSettings();

    expect(settings).toEqual({
      master: 1.0,
      sfx: 0.6,
      voice: 0.9,
      ambient: 0.4,
      music: 0.3,
    });
  });

  it('loadSettings returns saved values from localStorage', async () => {
    const saved: AudioSettings = {
      master: 0.8,
      sfx: 0.5,
      voice: 0.7,
      ambient: 0.3,
      music: 0.2,
    };
    mockStorage['vectorwars_audio_settings'] = JSON.stringify(saved);

    const { AudioSettingsManager } = await import('../audio/AudioSettingsManager.ts');
    const manager = new AudioSettingsManager();
    const settings = manager.loadSettings();

    expect(settings).toEqual(saved);
  });

  it('loadSettings returns defaults when data is corrupted (invalid JSON)', async () => {
    mockStorage['vectorwars_audio_settings'] = '{not valid json!!!';

    const { AudioSettingsManager } = await import('../audio/AudioSettingsManager.ts');
    const manager = new AudioSettingsManager();
    const settings = manager.loadSettings();

    expect(settings).toEqual({
      master: 1.0,
      sfx: 0.6,
      voice: 0.9,
      ambient: 0.4,
      music: 0.3,
    });
  });

  it('loadSettings returns defaults when data is not an object', async () => {
    mockStorage['vectorwars_audio_settings'] = '"just a string"';

    const { AudioSettingsManager } = await import('../audio/AudioSettingsManager.ts');
    const manager = new AudioSettingsManager();
    const settings = manager.loadSettings();

    expect(settings).toEqual({
      master: 1.0,
      sfx: 0.6,
      voice: 0.9,
      ambient: 0.4,
      music: 0.3,
    });
  });

  it('loadSettings uses defaults for out-of-range values', async () => {
    const corrupted = {
      master: 2.5,   // > 1
      sfx: -0.5,     // < 0
      voice: 0.7,    // valid
      ambient: NaN,   // not finite
      music: 0.2,    // valid
    };
    mockStorage['vectorwars_audio_settings'] = JSON.stringify(corrupted);

    const { AudioSettingsManager } = await import('../audio/AudioSettingsManager.ts');
    const manager = new AudioSettingsManager();
    const settings = manager.loadSettings();

    expect(settings.master).toBe(1.0);  // default (out of range)
    expect(settings.sfx).toBe(0.6);     // default (out of range)
    expect(settings.voice).toBe(0.7);   // saved (valid)
    expect(settings.ambient).toBe(0.4); // default (NaN)
    expect(settings.music).toBe(0.2);   // saved (valid)
  });

  it('loadSettings uses defaults for missing fields', async () => {
    const partial = { master: 0.8, sfx: 0.5 };
    mockStorage['vectorwars_audio_settings'] = JSON.stringify(partial);

    const { AudioSettingsManager } = await import('../audio/AudioSettingsManager.ts');
    const manager = new AudioSettingsManager();
    const settings = manager.loadSettings();

    expect(settings.master).toBe(0.8);
    expect(settings.sfx).toBe(0.5);
    expect(settings.voice).toBe(0.9);    // default
    expect(settings.ambient).toBe(0.4);  // default
    expect(settings.music).toBe(0.3);    // default
  });

  it('saveSettings writes correct JSON to localStorage', async () => {
    const { AudioSettingsManager } = await import('../audio/AudioSettingsManager.ts');
    const manager = new AudioSettingsManager();
    const settings: AudioSettings = {
      master: 0.8,
      sfx: 0.5,
      voice: 0.7,
      ambient: 0.3,
      music: 0.2,
    };

    manager.saveSettings(settings);

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'vectorwars_audio_settings',
      JSON.stringify(settings)
    );
  });

  it('saveSettings handles localStorage write failure gracefully', async () => {
    const { Logger } = await import('../core/Logger.ts');

    // Create manager first while localStorage is working
    const { AudioSettingsManager } = await import('../audio/AudioSettingsManager.ts');
    const manager = new AudioSettingsManager();

    // Now make setItem throw for the saveSettings call
    mockLocalStorage.setItem.mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    // Clear previous Logger calls from constructor
    vi.mocked(Logger.warn).mockClear();

    // Should not throw
    manager.saveSettings({
      master: 0.8,
      sfx: 0.5,
      voice: 0.7,
      ambient: 0.3,
      music: 0.2,
    });

    expect(Logger.warn).toHaveBeenCalledWith(
      'Audio',
      'Failed to save audio settings to localStorage'
    );
  });

  it('handles localStorage unavailable gracefully', async () => {
    // Make localStorage throw on test write (during constructor)
    mockLocalStorage.setItem.mockImplementation(() => {
      throw new Error('SecurityError');
    });

    const { AudioSettingsManager } = await import('../audio/AudioSettingsManager.ts');
    const manager = new AudioSettingsManager();

    // Should return defaults without crashing
    const settings = manager.loadSettings();
    expect(settings).toEqual({
      master: 1.0,
      sfx: 0.6,
      voice: 0.9,
      ambient: 0.4,
      music: 0.3,
    });
  });

  it('getDefaults returns a new object each time', async () => {
    const { AudioSettingsManager } = await import('../audio/AudioSettingsManager.ts');
    const manager = new AudioSettingsManager();
    const defaults1 = manager.getDefaults();
    const defaults2 = manager.getDefaults();

    expect(defaults1).not.toBe(defaults2); // Different references
    expect(defaults1).toEqual(defaults2);   // Same values
  });

  it('exports singleton instance', async () => {
    const { audioSettingsManager } = await import('../audio/AudioSettingsManager.ts');
    expect(audioSettingsManager).toBeDefined();
    expect(typeof audioSettingsManager.loadSettings).toBe('function');
    expect(typeof audioSettingsManager.saveSettings).toBe('function');
    expect(typeof audioSettingsManager.getDefaults).toBe('function');
  });
});
