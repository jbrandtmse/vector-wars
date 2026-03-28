/**
 * SoundManifest type tests — validates type exports and structure.
 *
 * Story 4-5: Audio Manager Architecture
 */

import { describe, it, expect } from 'vitest';
import type { ChannelType, SoundEntry, SoundManifest } from '../audio/SoundManifest.ts';

describe('SoundManifest types', () => {
  it('should define ChannelType as sfx | voice | ambient | music', () => {
    const sfx: ChannelType = 'sfx';
    const voice: ChannelType = 'voice';
    const ambient: ChannelType = 'ambient';
    const music: ChannelType = 'music';
    expect(sfx).toBe('sfx');
    expect(voice).toBe('voice');
    expect(ambient).toBe('ambient');
    expect(music).toBe('music');
  });

  it('should define SoundEntry with path, channel, and optional volume', () => {
    const entry: SoundEntry = {
      path: 'audio/sfx/test.ogg',
      channel: 'sfx',
    };
    expect(entry.path).toBe('audio/sfx/test.ogg');
    expect(entry.channel).toBe('sfx');
    expect(entry.volume).toBeUndefined();

    const entryWithVolume: SoundEntry = {
      path: 'audio/voice/handler.ogg',
      channel: 'voice',
      volume: 0.8,
    };
    expect(entryWithVolume.volume).toBe(0.8);
  });

  it('should define SoundManifest as string-keyed dictionary of SoundEntry', () => {
    const manifest: SoundManifest = {
      'data_lance_fire': { path: 'audio/sfx/data_lance_fire.ogg', channel: 'sfx' },
      'ambient_hum': { path: 'audio/ambient/ambient_hum.ogg', channel: 'ambient', volume: 0.5 },
    };
    expect(Object.keys(manifest)).toHaveLength(2);
    expect(manifest['data_lance_fire'].channel).toBe('sfx');
    expect(manifest['ambient_hum'].volume).toBe(0.5);
  });
});
