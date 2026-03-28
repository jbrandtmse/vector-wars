/**
 * AudioSettingsManager — Persists audio volume settings to localStorage.
 *
 * Saves and loads per-channel volume levels and master volume.
 * Handles graceful fallback to default volumes if localStorage is
 * unavailable or data is corrupted.
 *
 * Created by: Story 6-7 (Final Audio Polish)
 */

import { Logger } from '../core/Logger.ts';
import type { ChannelType } from './SoundManifest.ts';

/** Audio volume settings schema. All values are 0-1. */
export type AudioSettings = {
  master: number;
  sfx: number;
  voice: number;
  ambient: number;
  music: number;
};

/** localStorage key for audio settings. */
const STORAGE_KEY = 'vectorwars_audio_settings';

/** Default volume levels matching AudioManager DEFAULT_VOLUMES. */
const DEFAULT_SETTINGS: AudioSettings = {
  master: 1.0,
  sfx: 0.6,
  voice: 0.9,
  ambient: 0.4,
  music: 0.3,
};

/** Valid channel keys that map to AudioSettings properties. */
const CHANNEL_KEYS: readonly ChannelType[] = ['sfx', 'voice', 'ambient', 'music'] as const;

export class AudioSettingsManager {
  private storageAvailable: boolean;

  constructor() {
    this.storageAvailable = this.checkStorageAvailable();
  }

  /** Returns default audio settings. */
  getDefaults(): AudioSettings {
    return { ...DEFAULT_SETTINGS };
  }

  /**
   * Load settings from localStorage. Returns defaults if unavailable or corrupted.
   * Never throws — always returns a valid AudioSettings object.
   */
  loadSettings(): AudioSettings {
    if (!this.storageAvailable) {
      return this.getDefaults();
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) {
        return this.getDefaults();
      }

      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed !== 'object' || parsed === null) {
        Logger.warn('Audio', 'Corrupted audio settings data, using defaults');
        return this.getDefaults();
      }

      const obj = parsed as Record<string, unknown>;
      const settings = this.getDefaults();

      // Validate and apply each field
      if (this.isValidVolume(obj.master)) {
        settings.master = obj.master as number;
      }
      for (const key of CHANNEL_KEYS) {
        if (this.isValidVolume(obj[key])) {
          settings[key] = obj[key] as number;
        }
      }

      return settings;
    } catch {
      Logger.warn('Audio', 'Failed to parse audio settings, using defaults');
      return this.getDefaults();
    }
  }

  /**
   * Save settings to localStorage. Silently logs warning on failure.
   */
  saveSettings(settings: AudioSettings): void {
    if (!this.storageAvailable) {
      return;
    }

    try {
      const data = JSON.stringify(settings);
      localStorage.setItem(STORAGE_KEY, data);
    } catch {
      Logger.warn('Audio', 'Failed to save audio settings to localStorage');
    }
  }

  /** Check if a value is a valid volume number (0-1). */
  private isValidVolume(value: unknown): boolean {
    return typeof value === 'number' && isFinite(value) && value >= 0 && value <= 1;
  }

  /** Check if localStorage is available and functional. */
  private checkStorageAvailable(): boolean {
    try {
      const testKey = '__audio_settings_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      Logger.warn('Audio', 'localStorage unavailable, using default audio settings');
      return false;
    }
  }
}

/** Module-level singleton audio settings manager. */
export const audioSettingsManager = new AudioSettingsManager();
