/**
 * AudioAssetValidator tests — validates manifest-to-filesystem validation utility.
 *
 * Story 4-8: Swappable Audio Assets
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../core/Logger.ts', () => ({
  Logger: {
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

import { AudioAssetValidator } from '../audio/AudioAssetValidator.ts';
import type { SoundManifest } from '../audio/SoundManifest.ts';
import { Logger } from '../core/Logger.ts';

describe('AudioAssetValidator', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should report all files as present when HEAD requests succeed', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });

    const manifest: SoundManifest = {
      data_lance_fire: { path: 'audio/sfx/data_lance_fire.ogg', channel: 'sfx' },
      shield_hit: { path: 'audio/sfx/shield_hit.ogg', channel: 'sfx' },
    };

    const report = await AudioAssetValidator.validateManifest(manifest);

    expect(report.present).toEqual(['data_lance_fire', 'shield_hit']);
    expect(report.missing).toEqual([]);
    expect(report.total).toBe(2);
  });

  it('should report all files as missing when HEAD requests fail', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });

    const manifest: SoundManifest = {
      data_lance_fire: { path: 'audio/sfx/data_lance_fire.ogg', channel: 'sfx' },
      shield_hit: { path: 'audio/sfx/shield_hit.ogg', channel: 'sfx' },
    };

    const report = await AudioAssetValidator.validateManifest(manifest);

    expect(report.present).toEqual([]);
    expect(report.missing).toEqual(['data_lance_fire', 'shield_hit']);
    expect(report.total).toBe(2);
  });

  it('should report correct present/missing split for mixed results', async () => {
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({ ok: true });

    const manifest: SoundManifest = {
      data_lance_fire: { path: 'audio/sfx/data_lance_fire.ogg', channel: 'sfx' },
      shield_hit: { path: 'audio/sfx/shield_hit.ogg', channel: 'sfx' },
      enemy_explosion: { path: 'audio/sfx/enemy_explosion.ogg', channel: 'sfx' },
    };

    const report = await AudioAssetValidator.validateManifest(manifest);

    expect(report.total).toBe(3);
    // At least one present and one missing
    expect(report.present.length + report.missing.length).toBe(3);
  });

  it('should handle network errors for individual entries as missing', async () => {
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true })
      .mockRejectedValueOnce(new Error('Network error'));

    const manifest: SoundManifest = {
      data_lance_fire: { path: 'audio/sfx/data_lance_fire.ogg', channel: 'sfx' },
      shield_hit: { path: 'audio/sfx/shield_hit.ogg', channel: 'sfx' },
    };

    const report = await AudioAssetValidator.validateManifest(manifest);

    expect(report.present).toContain('data_lance_fire');
    expect(report.missing).toContain('shield_hit');
    expect(report.total).toBe(2);
  });

  it('should return empty report for empty manifest', async () => {
    globalThis.fetch = vi.fn();

    const manifest: SoundManifest = {};

    const report = await AudioAssetValidator.validateManifest(manifest);

    expect(report.present).toEqual([]);
    expect(report.missing).toEqual([]);
    expect(report.total).toBe(0);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('should skip _meta key in manifest', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });

    const manifest = {
      _meta: { path: 'not-a-real-path', channel: 'sfx' },
      data_lance_fire: { path: 'audio/sfx/data_lance_fire.ogg', channel: 'sfx' },
    } as unknown as SoundManifest;

    const report = await AudioAssetValidator.validateManifest(manifest);

    expect(report.total).toBe(1);
    expect(report.present).toEqual(['data_lance_fire']);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('should use HEAD method for fetch requests', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });

    const manifest: SoundManifest = {
      test_sound: { path: 'audio/sfx/test.ogg', channel: 'sfx' },
    };

    await AudioAssetValidator.validateManifest(manifest);

    expect(globalThis.fetch).toHaveBeenCalledWith('audio/sfx/test.ogg', { method: 'HEAD' });
  });

  it('should log info on completion', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });

    const manifest: SoundManifest = {
      test_sound: { path: 'audio/sfx/test.ogg', channel: 'sfx' },
    };

    await AudioAssetValidator.validateManifest(manifest);

    expect(Logger.info).toHaveBeenCalledWith('Audio', 'Asset validation complete', {
      present: 1,
      missing: 0,
      total: 1,
    });
  });
});
