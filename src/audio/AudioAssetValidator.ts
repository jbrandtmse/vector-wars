/**
 * AudioAssetValidator — Development utility that validates manifest entries
 * against the filesystem to report which audio files are present vs missing.
 *
 * Missing files are expected — the SFXGenerator procedural fallback handles them.
 * This validator is for developer awareness only, not gating.
 *
 * Created by: Story 4-8 (Swappable Audio Assets)
 */

import { Logger } from '../core/Logger.ts';
import type { SoundManifest } from './SoundManifest.ts';

export type AudioValidationReport = {
  present: string[];
  missing: string[];
  total: number;
};

export class AudioAssetValidator {
  /**
   * Validate manifest entries by checking if audio files exist via HEAD requests.
   * Returns a report of which sound IDs have files and which are missing.
   */
  static async validateManifest(manifest: SoundManifest): Promise<AudioValidationReport> {
    const entries = Object.entries(manifest).filter(([key]) => key !== '_meta');
    const present: string[] = [];
    const missing: string[] = [];

    const results = await Promise.allSettled(
      entries.map(async ([id, entry]) => {
        try {
          const response = await fetch(entry.path, { method: 'HEAD' });
          return { id, exists: response.ok };
        } catch {
          return { id, exists: false };
        }
      })
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        if (result.value.exists) {
          present.push(result.value.id);
        } else {
          missing.push(result.value.id);
        }
      } else {
        // Promise.allSettled rejected — should not happen with inner try/catch,
        // but handle defensively
        missing.push('unknown');
      }
    }

    const report: AudioValidationReport = {
      present,
      missing,
      total: present.length + missing.length,
    };

    Logger.info('Audio', 'Asset validation complete', {
      present: present.length,
      missing: missing.length,
      total: report.total,
    });

    return report;
  }
}
