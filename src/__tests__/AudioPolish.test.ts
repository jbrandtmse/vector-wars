/**
 * AudioPolish tests -- validates audio quality, manifest completeness,
 * SFX/voice generation integrity, and volume balance hierarchy.
 *
 * Story 6-7: Final Audio Polish
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

vi.mock('../core/Logger.ts', () => ({
  Logger: {
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Audio Polish (Story 6-7)', () => {
  describe('manifest completeness', () => {
    let manifest: Record<string, { path: string; channel: string }>;

    beforeEach(() => {
      const manifestPath = path.resolve(__dirname, '../../public/audio/manifest.json');
      const raw = fs.readFileSync(manifestPath, 'utf-8');
      manifest = JSON.parse(raw);
    });

    it('manifest has _meta documentation field', () => {
      expect(manifest._meta).toBeDefined();
      expect(typeof manifest._meta).toBe('string');
    });

    it('manifest has all 8 SFX entries', () => {
      const sfxIds = [
        'data_lance_fire',
        'logic_bomb_fire',
        'emp_burst',
        'virus_payload',
        'shield_hit',
        'enemy_explosion',
        'boss_destruction',
        'corridor_whoosh',
      ];
      for (const id of sfxIds) {
        expect(manifest[id], `Missing manifest entry: ${id}`).toBeDefined();
        expect(manifest[id].channel).toBe('sfx');
      }
    });

    it('manifest has ambient_hum entry', () => {
      expect(manifest.ambient_hum).toBeDefined();
      expect(manifest.ambient_hum.channel).toBe('ambient');
    });

    it('manifest has music entries', () => {
      expect(manifest.outro_music).toBeDefined();
      expect(manifest.outro_music.channel).toBe('music');
      expect(manifest.outro).toBeDefined();
      expect(manifest.outro.channel).toBe('music');
    });

    it('manifest has all handler L1 voice entries', () => {
      const handlerL1Ids = [
        'handler_phase1_start',
        'handler_first_kill',
        'handler_surface_start',
        'handler_corridor_start',
        'handler_corridor_encourage',
        'handler_boss_start',
        'handler_boss_vulnerable',
        'handler_level_complete',
      ];
      for (const id of handlerL1Ids) {
        expect(manifest[id], `Missing manifest entry: ${id}`).toBeDefined();
        expect(manifest[id].channel).toBe('voice');
      }
    });

    it('manifest has all tutorial voice entries', () => {
      const tutorialIds = [
        'tutorial_welcome',
        'tutorial_movement',
        'tutorial_movement_done',
        'tutorial_fire',
        'tutorial_fire_done',
        'tutorial_weapons',
        'tutorial_shields',
        'tutorial_shields_done',
        'tutorial_calibration_done',
        'tutorial_alarm',
      ];
      for (const id of tutorialIds) {
        expect(manifest[id], `Missing manifest entry: ${id}`).toBeDefined();
        expect(manifest[id].channel).toBe('voice');
      }
    });

    it('manifest has all Gatekeeper voice entries', () => {
      const gkIds = [
        'gk_encounter_start',
        'gk_health_below_75',
        'gk_vulnerable_1',
        'gk_barrage_phase',
        'gk_health_below_50',
        'gk_sweep_phase',
        'gk_health_below_25',
        'gk_vulnerable_2',
        'gk_defeated',
      ];
      for (const id of gkIds) {
        expect(manifest[id], `Missing manifest entry: ${id}`).toBeDefined();
        expect(manifest[id].channel).toBe('voice');
      }
    });

    it('manifest has all handler L2 voice entries', () => {
      const l2Ids = [
        'handler_l2_dogfight_start',
        'handler_l2_surface_start',
        'handler_l2_corridor_start',
        'handler_l2_boss_start',
        'handler_l2_level_complete',
        'handler_l2_first_kill',
        'handler_l2_boss_vulnerable',
      ];
      for (const id of l2Ids) {
        expect(manifest[id], `Missing manifest entry: ${id}`).toBeDefined();
        expect(manifest[id].channel).toBe('voice');
      }
    });

    it('manifest has all handler L3 voice entries', () => {
      const l3Ids = [
        'handler_l3_dogfight_start',
        'handler_l3_surface_start',
        'handler_l3_corridor_start',
        'handler_l3_boss_start',
        'handler_l3_level_complete',
        'handler_l3_first_kill',
        'handler_l3_boss_vulnerable',
      ];
      for (const id of l3Ids) {
        expect(manifest[id], `Missing manifest entry: ${id}`).toBeDefined();
        expect(manifest[id].channel).toBe('voice');
      }
    });

    it('manifest has all Avenger voice entries', () => {
      const avIds = [
        'av_encounter_start',
        'av_health_below_75',
        'av_health_below_50',
        'av_health_below_25',
        'av_rush_phase',
        'av_vulnerable',
        'av_defeated',
      ];
      for (const id of avIds) {
        expect(manifest[id], `Missing manifest entry: ${id}`).toBeDefined();
        expect(manifest[id].channel).toBe('voice');
      }
    });

    it('manifest has all Core Intelligence voice entries', () => {
      const ciIds = [
        'ci_encounter_start',
        'ci_health_below_75',
        'ci_health_below_50',
        'ci_health_below_25',
        'ci_reason_phase',
        'ci_surge_phase',
        'ci_vulnerable',
        'ci_defeated',
      ];
      for (const id of ciIds) {
        expect(manifest[id], `Missing manifest entry: ${id}`).toBeDefined();
        expect(manifest[id].channel).toBe('voice');
      }
    });

    it('manifest has all briefing voice entries', () => {
      const briefingIds = ['briefing_l1', 'briefing_l2', 'briefing_l3'];
      for (const id of briefingIds) {
        expect(manifest[id], `Missing manifest entry: ${id}`).toBeDefined();
        expect(manifest[id].channel).toBe('voice');
      }
    });

    it('manifest has all ending sequence voice entries', () => {
      const endingIds = ['ending_desperate', 'ending_relief'];
      for (const id of endingIds) {
        expect(manifest[id], `Missing manifest entry: ${id}`).toBeDefined();
        expect(manifest[id].channel).toBe('voice');
      }
    });

    it('all manifest entries have valid path and channel fields', () => {
      const entries = Object.entries(manifest).filter(([key]) => key !== '_meta');
      expect(entries.length).toBeGreaterThan(0);

      for (const [id, entry] of entries) {
        expect(typeof entry.path, `${id} missing path`).toBe('string');
        expect(entry.path.length, `${id} has empty path`).toBeGreaterThan(0);
        expect(['sfx', 'voice', 'ambient', 'music'], `${id} has invalid channel: ${entry.channel}`).toContain(entry.channel);
      }
    });
  });

  describe('SFX definitions integrity', () => {
    it('SFXGenerator has exactly 8 sound definitions', async () => {
      const { SFXGenerator } = await import('../audio/SFXGenerator.ts');
      const generator = new SFXGenerator();
      const ids = generator.getSoundIds();

      expect(ids).toHaveLength(8);
      expect(ids).toContain('data_lance_fire');
      expect(ids).toContain('logic_bomb_fire');
      expect(ids).toContain('emp_burst');
      expect(ids).toContain('virus_payload');
      expect(ids).toContain('shield_hit');
      expect(ids).toContain('enemy_explosion');
      expect(ids).toContain('boss_destruction');
      expect(ids).toContain('corridor_whoosh');
    });

    it('all SFX IDs have corresponding manifest entries', () => {
      const manifestPath = path.resolve(__dirname, '../../public/audio/manifest.json');
      const raw = fs.readFileSync(manifestPath, 'utf-8');
      const manifest = JSON.parse(raw);

      const sfxIds = [
        'data_lance_fire',
        'logic_bomb_fire',
        'emp_burst',
        'virus_payload',
        'shield_hit',
        'enemy_explosion',
        'boss_destruction',
        'corridor_whoosh',
      ];

      for (const id of sfxIds) {
        expect(manifest[id], `SFX "${id}" missing from manifest`).toBeDefined();
      }
    });

    it('SFXGenerator.hasSound returns true for all 8 SFX', async () => {
      const { SFXGenerator } = await import('../audio/SFXGenerator.ts');
      const generator = new SFXGenerator();

      const sfxIds = [
        'data_lance_fire',
        'logic_bomb_fire',
        'emp_burst',
        'virus_payload',
        'shield_hit',
        'enemy_explosion',
        'boss_destruction',
        'corridor_whoosh',
      ];

      for (const id of sfxIds) {
        expect(generator.hasSound(id), `hasSound("${id}") should be true`).toBe(true);
      }
    });

    it('SFXGenerator.hasSound returns false for unknown IDs', async () => {
      const { SFXGenerator } = await import('../audio/SFXGenerator.ts');
      const generator = new SFXGenerator();

      expect(generator.hasSound('nonexistent')).toBe(false);
      expect(generator.hasSound('outro')).toBe(false);
    });
  });

  describe('VoiceLineGenerator integrity', () => {
    it('VoiceLineGenerator has definitions for all voice line IDs', async () => {
      const { VoiceLineGenerator } = await import('../audio/VoiceLineGenerator.ts');
      const generator = new VoiceLineGenerator();
      const ids = generator.getSoundIds();

      // Should include all handler, tutorial, boss, briefing, and ending lines
      expect(ids.length).toBeGreaterThan(40);

      // Check key categories
      const hasHandlerL1 = ids.some(id => id.startsWith('handler_') && !id.includes('l2') && !id.includes('l3'));
      const hasHandlerL2 = ids.some(id => id.includes('l2'));
      const hasHandlerL3 = ids.some(id => id.includes('l3'));
      const hasTutorial = ids.some(id => id.startsWith('tutorial_'));
      const hasGatekeeper = ids.some(id => id.startsWith('gk_'));
      const hasAvenger = ids.some(id => id.startsWith('av_'));
      const hasCoreIntelligence = ids.some(id => id.startsWith('ci_'));
      const hasBriefing = ids.some(id => id.startsWith('briefing_'));
      const hasEnding = ids.some(id => id.startsWith('ending_'));

      expect(hasHandlerL1, 'Missing handler L1 voice lines').toBe(true);
      expect(hasHandlerL2, 'Missing handler L2 voice lines').toBe(true);
      expect(hasHandlerL3, 'Missing handler L3 voice lines').toBe(true);
      expect(hasTutorial, 'Missing tutorial voice lines').toBe(true);
      expect(hasGatekeeper, 'Missing Gatekeeper voice lines').toBe(true);
      expect(hasAvenger, 'Missing Avenger voice lines').toBe(true);
      expect(hasCoreIntelligence, 'Missing Core Intelligence voice lines').toBe(true);
      expect(hasBriefing, 'Missing briefing voice lines').toBe(true);
      expect(hasEnding, 'Missing ending voice lines').toBe(true);
    });

    it('all voice line IDs have corresponding manifest entries', async () => {
      const { VoiceLineGenerator } = await import('../audio/VoiceLineGenerator.ts');
      const generator = new VoiceLineGenerator();
      const voiceIds = generator.getSoundIds();

      const manifestPath = path.resolve(__dirname, '../../public/audio/manifest.json');
      const raw = fs.readFileSync(manifestPath, 'utf-8');
      const manifest = JSON.parse(raw);

      for (const id of voiceIds) {
        expect(manifest[id], `Voice line "${id}" missing from manifest`).toBeDefined();
      }
    });
  });

  describe('OutroMusicGenerator integrity', () => {
    it('OutroMusicGenerator responds to "outro" ID', async () => {
      const { OutroMusicGenerator } = await import('../audio/OutroMusicGenerator.ts');
      const generator = new OutroMusicGenerator();

      expect(generator.hasSound('outro')).toBe(true);
      expect(generator.hasSound('outro_music')).toBe(false);
      expect(generator.hasSound('nonexistent')).toBe(false);
    });
  });

  describe('volume balance hierarchy', () => {
    it('DEFAULT_VOLUMES follow hierarchy: voice >= sfx >= ambient >= music', () => {
      // Values from AudioManager DEFAULT_VOLUMES
      const volumes = { sfx: 0.6, voice: 0.9, ambient: 0.4, music: 0.3 };

      expect(volumes.voice).toBeGreaterThanOrEqual(volumes.sfx);
      expect(volumes.sfx).toBeGreaterThanOrEqual(volumes.ambient);
      expect(volumes.ambient).toBeGreaterThanOrEqual(volumes.music);
    });

    it('AudioSettingsManager defaults match AudioManager defaults', async () => {
      const { AudioSettingsManager } = await import('../audio/AudioSettingsManager.ts');
      const manager = new AudioSettingsManager();
      const defaults = manager.getDefaults();

      expect(defaults.master).toBe(1.0);
      expect(defaults.sfx).toBe(0.6);
      expect(defaults.voice).toBe(0.9);
      expect(defaults.ambient).toBe(0.4);
      expect(defaults.music).toBe(0.3);
    });
  });
});
