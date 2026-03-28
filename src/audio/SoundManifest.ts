/**
 * SoundManifest — Type definitions for the audio manifest system.
 *
 * The sound manifest maps string IDs to audio file paths and channel routing.
 * Loaded at runtime from public/audio/manifest.json by AudioManager.
 *
 * Created by: Story 4-5 (Audio Manager Architecture)
 */

export type ChannelType = 'sfx' | 'voice' | 'ambient' | 'music';

export interface SoundEntry {
  path: string;
  channel: ChannelType;
  volume?: number; // per-sound volume multiplier (0-1, default 1.0)
}

export interface SoundManifest {
  [id: string]: SoundEntry;
}
