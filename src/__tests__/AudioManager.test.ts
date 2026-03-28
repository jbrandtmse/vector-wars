/**
 * AudioManager tests — validates central audio system behavior.
 *
 * Story 4-5: Audio Manager Architecture
 * Story 4-6: Retro SFX for Weapons and Actions (generator integration + new events)
 * Story 4-7: Ambient Electronic Hum (ambient generator integration + intensity events)
 */

// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Hoisted variables for use in vi.mock factories
const { mockOn, mockOff, mockEmit, mockLoadAsync } = vi.hoisted(() => ({
  mockOn: vi.fn(),
  mockOff: vi.fn(),
  mockEmit: vi.fn(),
  mockLoadAsync: vi.fn(),
}));

// Track mock audio instances
let mockAudioInstances: Array<{
  isPlaying: boolean;
  setBuffer: ReturnType<typeof vi.fn>;
  setLoop: ReturnType<typeof vi.fn>;
  setVolume: ReturnType<typeof vi.fn>;
  play: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  onEnded: (() => void) | null;
}> = [];

vi.mock('three', () => {
  return {
    Audio: function MockAudio() {
      const instance = {
        isPlaying: false,
        setBuffer: vi.fn(),
        setLoop: vi.fn(),
        setVolume: vi.fn(),
        play: vi.fn(function (this: { isPlaying: boolean }) { this.isPlaying = true; }),
        stop: vi.fn(function (this: { isPlaying: boolean }) { this.isPlaying = false; }),
        disconnect: vi.fn(),
        onEnded: null as (() => void) | null,
      };
      mockAudioInstances.push(instance);
      return instance;
    },
    AudioListener: function MockAudioListener() {
      return {
        context: {
          state: 'suspended',
          resume: vi.fn().mockResolvedValue(undefined),
        },
      };
    },
    AudioLoader: function MockAudioLoader() {
      return {
        loadAsync: mockLoadAsync,
      };
    },
  };
});

vi.mock('../core/Logger.ts', () => ({
  Logger: {
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../core/GameEvents.ts', () => ({
  eventBus: {
    on: mockOn,
    off: mockOff,
    emit: mockEmit,
  },
}));

import { AudioManager } from '../audio/AudioManager.ts';
import { Logger } from '../core/Logger.ts';
import * as THREE from 'three';

describe('AudioManager', () => {
  let manager: AudioManager;
  let mockCamera: THREE.Camera;

  beforeEach(() => {
    mockAudioInstances = [];
    vi.clearAllMocks();

    manager = new AudioManager();
    mockCamera = {
      add: vi.fn(),
      remove: vi.fn(),
    } as unknown as THREE.Camera;

    // Spy on document event listeners for AudioContext unlock verification
    vi.spyOn(document, 'addEventListener');
    vi.spyOn(document, 'removeEventListener');

    // Mock fetch for manifest loading
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('init', () => {
    it('should create AudioListener and add to camera', () => {
      manager.init(mockCamera);
      expect(mockCamera.add).toHaveBeenCalled();
    });

    it('should create four audio channels (sfx pool=8, voice, ambient, music)', () => {
      manager.init(mockCamera);
      // SFX pool = 8 instances + Voice 1 + Ambient 1 + Music 1 = 11 total
      expect(mockAudioInstances).toHaveLength(11);
    });

    it('should register AudioContext unlock listeners', () => {
      manager.init(mockCamera);
      expect(document.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
      expect(document.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should subscribe to EventBus events', () => {
      manager.init(mockCamera);
      expect(mockOn).toHaveBeenCalledWith('weaponFired', expect.any(Function));
      expect(mockOn).toHaveBeenCalledWith('playerHit', expect.any(Function));
      expect(mockOn).toHaveBeenCalledWith('enemyDestroyed', expect.any(Function));
    });

    it('should not init twice', () => {
      manager.init(mockCamera);
      const instanceCount = mockAudioInstances.length;
      manager.init(mockCamera);
      expect(mockAudioInstances).toHaveLength(instanceCount);
    });

    it('should log info on init', () => {
      manager.init(mockCamera);
      expect(Logger.info).toHaveBeenCalledWith('Audio', 'AudioManager initialized');
    });
  });

  describe('loadManifest', () => {
    it('should fetch and parse manifest JSON', async () => {
      manager.init(mockCamera);
      const manifest = {
        test_sound: { path: 'audio/sfx/test.ogg', channel: 'sfx' },
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(manifest),
      });

      await manager.loadManifest('audio/manifest.json');
      expect(global.fetch).toHaveBeenCalledWith('audio/manifest.json');
      expect(Logger.info).toHaveBeenCalledWith('Audio', 'Sound manifest loaded', { entries: 1 });
    });

    it('should handle fetch failure gracefully', async () => {
      manager.init(mockCamera);
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await manager.loadManifest('audio/manifest.json');
      expect(Logger.warn).toHaveBeenCalledWith(
        'Audio',
        'Failed to fetch manifest',
        expect.objectContaining({ status: 404 })
      );
    });

    it('should handle network error gracefully', async () => {
      manager.init(mockCamera);
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

      await manager.loadManifest('audio/manifest.json');
      expect(Logger.warn).toHaveBeenCalledWith(
        'Audio',
        'Failed to load sound manifest',
        expect.objectContaining({ url: 'audio/manifest.json' })
      );
    });
  });

  describe('play methods', () => {
    beforeEach(async () => {
      manager.init(mockCamera);
      const manifest = {
        test_sfx: { path: 'audio/sfx/test.ogg', channel: 'sfx' },
        test_voice: { path: 'audio/voice/test.ogg', channel: 'voice' },
        test_ambient: { path: 'audio/ambient/test.ogg', channel: 'ambient' },
        test_music: { path: 'audio/music/test.ogg', channel: 'music' },
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(manifest),
      });
      await manager.loadManifest('audio/manifest.json');
    });

    it('should log warning for unknown sound ID', () => {
      manager.playSFX('nonexistent');
      expect(Logger.warn).toHaveBeenCalledWith(
        'Audio',
        'Sound not found in manifest',
        { id: 'nonexistent' }
      );
    });

    it('should load buffer and play SFX on channel', async () => {
      const mockBuffer = {} as AudioBuffer;
      mockLoadAsync.mockResolvedValueOnce(mockBuffer);

      manager.playSFX('test_sfx');
      await vi.waitFor(() => {
        expect(mockLoadAsync).toHaveBeenCalledWith('audio/sfx/test.ogg');
      });
    });

    it('should load buffer and play voice on channel', async () => {
      const mockBuffer = {} as AudioBuffer;
      mockLoadAsync.mockResolvedValueOnce(mockBuffer);

      manager.playVoice('test_voice');
      await vi.waitFor(() => {
        expect(mockLoadAsync).toHaveBeenCalledWith('audio/voice/test.ogg');
      });
    });

    it('should load buffer and play ambient on channel', async () => {
      const mockBuffer = {} as AudioBuffer;
      mockLoadAsync.mockResolvedValueOnce(mockBuffer);

      manager.playAmbient('test_ambient');
      await vi.waitFor(() => {
        expect(mockLoadAsync).toHaveBeenCalledWith('audio/ambient/test.ogg');
      });
    });

    it('should load buffer and play music on channel', async () => {
      const mockBuffer = {} as AudioBuffer;
      mockLoadAsync.mockResolvedValueOnce(mockBuffer);

      manager.playMusic('test_music');
      await vi.waitFor(() => {
        expect(mockLoadAsync).toHaveBeenCalledWith('audio/music/test.ogg');
      });
    });

    it('should cache buffer and reuse on subsequent plays', async () => {
      const mockBuffer = {} as AudioBuffer;
      mockLoadAsync.mockResolvedValueOnce(mockBuffer);

      manager.playSFX('test_sfx');
      await vi.waitFor(() => {
        expect(mockLoadAsync).toHaveBeenCalledTimes(1);
      });

      // Second play — should use cache, not load again
      manager.playSFX('test_sfx');
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(mockLoadAsync).toHaveBeenCalledTimes(1);
    });

    it('should handle buffer load failure gracefully', async () => {
      mockLoadAsync.mockRejectedValueOnce(new Error('File not found'));

      manager.playSFX('test_sfx');
      await vi.waitFor(() => {
        expect(Logger.warn).toHaveBeenCalledWith(
          'Audio',
          'Failed to load audio buffer',
          expect.objectContaining({ id: 'test_sfx' })
        );
      });
    });
  });

  describe('volume control', () => {
    it('should set channel volume', () => {
      manager.init(mockCamera);
      manager.setChannelVolume('sfx', 0.8);
      expect(manager.getChannelVolume('sfx')).toBe(0.8);
    });

    it('should clamp channel volume to 0-1', () => {
      manager.init(mockCamera);
      manager.setChannelVolume('sfx', 1.5);
      expect(manager.getChannelVolume('sfx')).toBe(1.0);
      manager.setChannelVolume('sfx', -0.5);
      expect(manager.getChannelVolume('sfx')).toBe(0);
    });

    it('should set master volume', () => {
      manager.init(mockCamera);
      manager.setMasterVolume(0.5);
      expect(manager.getMasterVolume()).toBe(0.5);
    });

    it('should clamp master volume to 0-1', () => {
      manager.init(mockCamera);
      manager.setMasterVolume(2.0);
      expect(manager.getMasterVolume()).toBe(1.0);
      manager.setMasterVolume(-1.0);
      expect(manager.getMasterVolume()).toBe(0);
    });
  });

  describe('EventBus integration', () => {
    it('should play weapon SFX on weaponFired event', async () => {
      manager.init(mockCamera);
      const manifest = {
        data_lance_fire: { path: 'audio/sfx/data_lance_fire.ogg', channel: 'sfx' },
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(manifest),
      });
      await manager.loadManifest('audio/manifest.json');

      const weaponFiredCall = mockOn.mock.calls.find(
        (call: unknown[]) => call[0] === 'weaponFired'
      );
      expect(weaponFiredCall).toBeDefined();

      const mockBuffer = {} as AudioBuffer;
      mockLoadAsync.mockResolvedValueOnce(mockBuffer);

      weaponFiredCall![1]({ weapon: 'dataLance', position: { x: 0, y: 0, z: 0 } });
      await vi.waitFor(() => {
        expect(mockLoadAsync).toHaveBeenCalledWith('audio/sfx/data_lance_fire.ogg');
      });
    });

    it('should play shield_hit on playerHit event', async () => {
      manager.init(mockCamera);
      const manifest = {
        shield_hit: { path: 'audio/sfx/shield_hit.ogg', channel: 'sfx' },
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(manifest),
      });
      await manager.loadManifest('audio/manifest.json');

      const playerHitCall = mockOn.mock.calls.find(
        (call: unknown[]) => call[0] === 'playerHit'
      );
      expect(playerHitCall).toBeDefined();

      const mockBuffer = {} as AudioBuffer;
      mockLoadAsync.mockResolvedValueOnce(mockBuffer);

      playerHitCall![1]({ damage: 10, source: 'test' });
      await vi.waitFor(() => {
        expect(mockLoadAsync).toHaveBeenCalledWith('audio/sfx/shield_hit.ogg');
      });
    });

    it('should play enemy_explosion on enemyDestroyed event', async () => {
      manager.init(mockCamera);
      const manifest = {
        enemy_explosion: { path: 'audio/sfx/enemy_explosion.ogg', channel: 'sfx' },
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(manifest),
      });
      await manager.loadManifest('audio/manifest.json');

      const enemyDestroyedCall = mockOn.mock.calls.find(
        (call: unknown[]) => call[0] === 'enemyDestroyed'
      );
      expect(enemyDestroyedCall).toBeDefined();

      const mockBuffer = {} as AudioBuffer;
      mockLoadAsync.mockResolvedValueOnce(mockBuffer);

      enemyDestroyedCall![1]({ enemy: {}, position: { x: 0, y: 0, z: 0 } });
      await vi.waitFor(() => {
        expect(mockLoadAsync).toHaveBeenCalledWith('audio/sfx/enemy_explosion.ogg');
      });
    });
  });

  describe('dispose', () => {
    it('should unsubscribe from EventBus', () => {
      manager.init(mockCamera);
      manager.dispose();
      expect(mockOff).toHaveBeenCalledWith('weaponFired', expect.any(Function));
      expect(mockOff).toHaveBeenCalledWith('playerHit', expect.any(Function));
      expect(mockOff).toHaveBeenCalledWith('enemyDestroyed', expect.any(Function));
    });

    it('should remove AudioListener from camera', () => {
      manager.init(mockCamera);
      manager.dispose();
      expect(mockCamera.remove).toHaveBeenCalled();
    });

    it('should disconnect all audio instances', () => {
      manager.init(mockCamera);
      manager.dispose();
      for (const instance of mockAudioInstances) {
        expect(instance.disconnect).toHaveBeenCalled();
      }
    });

    it('should remove AudioContext unlock listeners', () => {
      manager.init(mockCamera);
      manager.dispose();
      expect(document.removeEventListener).toHaveBeenCalledWith('click', expect.any(Function));
      expect(document.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should log info on dispose', () => {
      manager.init(mockCamera);
      manager.dispose();
      expect(Logger.info).toHaveBeenCalledWith('Audio', 'AudioManager disposed');
    });
  });

  describe('stopChannel', () => {
    it('should stop the specified channel without throwing', () => {
      manager.init(mockCamera);
      expect(() => manager.stopChannel('sfx')).not.toThrow();
    });
  });

  // === Story 4-6: SFX Generator Integration ===

  describe('registerGenerator', () => {
    it('should store generator reference', () => {
      manager.init(mockCamera);
      const mockGenerator = {
        generate: vi.fn(),
        generateAll: vi.fn(),
        hasSound: vi.fn().mockReturnValue(true),
        getSoundIds: vi.fn().mockReturnValue(['test_sound']),
      };
      // Should not throw
      expect(() => manager.registerGenerator(mockGenerator as never)).not.toThrow();
      expect(Logger.info).toHaveBeenCalledWith('Audio', 'SFX generator registered');
    });
  });

  describe('generator fallback', () => {
    it('should use generator when sound not in manifest but generator has it', async () => {
      manager.init(mockCamera);

      // Load empty manifest
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });
      await manager.loadManifest('audio/manifest.json');

      const mockBuffer = {} as AudioBuffer;
      const mockGenerator = {
        generate: vi.fn().mockResolvedValue(mockBuffer),
        generateAll: vi.fn(),
        hasSound: vi.fn().mockReturnValue(true),
        getSoundIds: vi.fn().mockReturnValue(['generated_sound']),
      };
      manager.registerGenerator(mockGenerator as never);

      manager.playSFX('generated_sound');

      await vi.waitFor(() => {
        expect(mockGenerator.generate).toHaveBeenCalledWith('generated_sound');
      });
    });

    it('should fall back to generator when file load fails', async () => {
      manager.init(mockCamera);

      // Manifest has an entry but file load will fail
      const manifest = {
        test_sfx: { path: 'audio/sfx/test.ogg', channel: 'sfx' },
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(manifest),
      });
      await manager.loadManifest('audio/manifest.json');

      mockLoadAsync.mockRejectedValueOnce(new Error('File not found'));

      const mockBuffer = {} as AudioBuffer;
      const mockGenerator = {
        generate: vi.fn().mockResolvedValue(mockBuffer),
        generateAll: vi.fn(),
        hasSound: vi.fn().mockReturnValue(true),
        getSoundIds: vi.fn().mockReturnValue(['test_sfx']),
      };
      manager.registerGenerator(mockGenerator as never);

      manager.playSFX('test_sfx');

      await vi.waitFor(() => {
        expect(mockGenerator.generate).toHaveBeenCalledWith('test_sfx');
      });
    });

    it('should log warning when sound not in manifest and no generator', () => {
      manager.init(mockCamera);
      manager.playSFX('nonexistent');
      expect(Logger.warn).toHaveBeenCalledWith(
        'Audio',
        'Sound not found in manifest',
        { id: 'nonexistent' }
      );
    });
  });

  describe('new EventBus subscriptions (Story 4-6)', () => {
    it('should subscribe to bossDestroyed event', () => {
      manager.init(mockCamera);
      expect(mockOn).toHaveBeenCalledWith('bossDestroyed', expect.any(Function));
    });

    it('should subscribe to phaseStart event', () => {
      manager.init(mockCamera);
      expect(mockOn).toHaveBeenCalledWith('phaseStart', expect.any(Function));
    });

    it('should play boss_destruction on bossDestroyed event', async () => {
      manager.init(mockCamera);

      const mockBuffer = {} as AudioBuffer;
      const mockGenerator = {
        generate: vi.fn().mockResolvedValue(mockBuffer),
        generateAll: vi.fn(),
        hasSound: vi.fn().mockReturnValue(true),
        getSoundIds: vi.fn().mockReturnValue(['boss_destruction']),
      };
      manager.registerGenerator(mockGenerator as never);

      const bossDestroyedCall = mockOn.mock.calls.find(
        (call: unknown[]) => call[0] === 'bossDestroyed'
      );
      expect(bossDestroyedCall).toBeDefined();

      bossDestroyedCall![1]({ position: { x: 0, y: 0, z: 0 }, scoreValue: 1000 });

      await vi.waitFor(() => {
        expect(mockGenerator.generate).toHaveBeenCalledWith('boss_destruction');
      });
    });

    it('should play corridor_whoosh on phaseStart when phase is corridor', async () => {
      manager.init(mockCamera);

      const mockBuffer = {} as AudioBuffer;
      const mockGenerator = {
        generate: vi.fn().mockResolvedValue(mockBuffer),
        generateAll: vi.fn(),
        hasSound: vi.fn().mockReturnValue(true),
        getSoundIds: vi.fn().mockReturnValue(['corridor_whoosh']),
      };
      manager.registerGenerator(mockGenerator as never);

      const phaseStartCall = mockOn.mock.calls.find(
        (call: unknown[]) => call[0] === 'phaseStart'
      );
      expect(phaseStartCall).toBeDefined();

      phaseStartCall![1]({ phase: 'corridor', level: 1 });

      await vi.waitFor(() => {
        expect(mockGenerator.generate).toHaveBeenCalledWith('corridor_whoosh');
      });
    });

    it('should NOT play corridor_whoosh on phaseStart when phase is not corridor', () => {
      manager.init(mockCamera);

      const mockGenerator = {
        generate: vi.fn(),
        generateAll: vi.fn(),
        hasSound: vi.fn().mockReturnValue(true),
        getSoundIds: vi.fn().mockReturnValue([]),
      };
      manager.registerGenerator(mockGenerator as never);

      const phaseStartCall = mockOn.mock.calls.find(
        (call: unknown[]) => call[0] === 'phaseStart'
      );
      expect(phaseStartCall).toBeDefined();

      phaseStartCall![1]({ phase: 'dogfight', level: 1 });

      // Should not try to play corridor_whoosh for non-corridor phases
      expect(mockGenerator.generate).not.toHaveBeenCalled();
    });

    it('should unsubscribe bossDestroyed and phaseStart on dispose', () => {
      manager.init(mockCamera);
      manager.dispose();
      expect(mockOff).toHaveBeenCalledWith('bossDestroyed', expect.any(Function));
      expect(mockOff).toHaveBeenCalledWith('phaseStart', expect.any(Function));
    });
  });

  // === Story 4-7: Ambient Hum Generator Integration ===

  describe('registerAmbientGenerator (Story 4-7)', () => {
    it('should store ambient generator reference', () => {
      manager.init(mockCamera);
      const mockAmbientGen = {
        start: vi.fn(),
        stop: vi.fn(),
        setIntensity: vi.fn(),
        setVolume: vi.fn(),
        dispose: vi.fn(),
        isPlaying: vi.fn().mockReturnValue(false),
      };
      expect(() => manager.registerAmbientGenerator(mockAmbientGen as never)).not.toThrow();
      expect(Logger.info).toHaveBeenCalledWith('Audio', 'Ambient hum generator registered');
    });
  });

  describe('ambient intensity via phaseStart (Story 4-7)', () => {
    it('should set intensity to 0.1 for tutorial phase', () => {
      manager.init(mockCamera);
      const mockAmbientGen = {
        start: vi.fn(),
        stop: vi.fn(),
        setIntensity: vi.fn(),
        setVolume: vi.fn(),
        dispose: vi.fn(),
        isPlaying: vi.fn().mockReturnValue(true),
      };
      manager.registerAmbientGenerator(mockAmbientGen as never);

      const phaseStartCall = mockOn.mock.calls.find(
        (call: unknown[]) => call[0] === 'phaseStart'
      );
      phaseStartCall![1]({ phase: 'tutorial', level: 1 });
      expect(mockAmbientGen.setIntensity).toHaveBeenCalledWith(0.1);
    });

    it('should set intensity to 0.15 for briefing phase', () => {
      manager.init(mockCamera);
      const mockAmbientGen = {
        start: vi.fn(),
        stop: vi.fn(),
        setIntensity: vi.fn(),
        setVolume: vi.fn(),
        dispose: vi.fn(),
        isPlaying: vi.fn().mockReturnValue(true),
      };
      manager.registerAmbientGenerator(mockAmbientGen as never);

      const phaseStartCall = mockOn.mock.calls.find(
        (call: unknown[]) => call[0] === 'phaseStart'
      );
      phaseStartCall![1]({ phase: 'briefing', level: 1 });
      expect(mockAmbientGen.setIntensity).toHaveBeenCalledWith(0.15);
    });

    it('should set intensity to 0.4 for dogfight phase', () => {
      manager.init(mockCamera);
      const mockAmbientGen = {
        start: vi.fn(),
        stop: vi.fn(),
        setIntensity: vi.fn(),
        setVolume: vi.fn(),
        dispose: vi.fn(),
        isPlaying: vi.fn().mockReturnValue(true),
      };
      manager.registerAmbientGenerator(mockAmbientGen as never);

      const phaseStartCall = mockOn.mock.calls.find(
        (call: unknown[]) => call[0] === 'phaseStart'
      );
      phaseStartCall![1]({ phase: 'dogfight', level: 1 });
      expect(mockAmbientGen.setIntensity).toHaveBeenCalledWith(0.4);
    });

    it('should set intensity to 0.5 for surface phase', () => {
      manager.init(mockCamera);
      const mockAmbientGen = {
        start: vi.fn(),
        stop: vi.fn(),
        setIntensity: vi.fn(),
        setVolume: vi.fn(),
        dispose: vi.fn(),
        isPlaying: vi.fn().mockReturnValue(true),
      };
      manager.registerAmbientGenerator(mockAmbientGen as never);

      const phaseStartCall = mockOn.mock.calls.find(
        (call: unknown[]) => call[0] === 'phaseStart'
      );
      phaseStartCall![1]({ phase: 'surface', level: 1 });
      expect(mockAmbientGen.setIntensity).toHaveBeenCalledWith(0.5);
    });

    it('should set intensity to 0.6 for corridor phase', () => {
      manager.init(mockCamera);
      const mockAmbientGen = {
        start: vi.fn(),
        stop: vi.fn(),
        setIntensity: vi.fn(),
        setVolume: vi.fn(),
        dispose: vi.fn(),
        isPlaying: vi.fn().mockReturnValue(true),
      };
      manager.registerAmbientGenerator(mockAmbientGen as never);

      const phaseStartCall = mockOn.mock.calls.find(
        (call: unknown[]) => call[0] === 'phaseStart'
      );
      phaseStartCall![1]({ phase: 'corridor', level: 1 });
      expect(mockAmbientGen.setIntensity).toHaveBeenCalledWith(0.6);
    });

    it('should set intensity to 0.8 for boss phase', () => {
      manager.init(mockCamera);
      const mockAmbientGen = {
        start: vi.fn(),
        stop: vi.fn(),
        setIntensity: vi.fn(),
        setVolume: vi.fn(),
        dispose: vi.fn(),
        isPlaying: vi.fn().mockReturnValue(true),
      };
      manager.registerAmbientGenerator(mockAmbientGen as never);

      const phaseStartCall = mockOn.mock.calls.find(
        (call: unknown[]) => call[0] === 'phaseStart'
      );
      phaseStartCall![1]({ phase: 'boss', level: 1 });
      expect(mockAmbientGen.setIntensity).toHaveBeenCalledWith(0.8);
    });
  });

  describe('ambient intensity via playerHit spike (Story 4-7)', () => {
    it('should temporarily spike intensity on playerHit', () => {
      vi.useFakeTimers();
      manager.init(mockCamera);
      const mockAmbientGen = {
        start: vi.fn(),
        stop: vi.fn(),
        setIntensity: vi.fn(),
        setVolume: vi.fn(),
        dispose: vi.fn(),
        isPlaying: vi.fn().mockReturnValue(true),
      };
      manager.registerAmbientGenerator(mockAmbientGen as never);

      // Set baseline via phaseStart
      const phaseStartCall = mockOn.mock.calls.find(
        (call: unknown[]) => call[0] === 'phaseStart'
      );
      phaseStartCall![1]({ phase: 'dogfight', level: 1 }); // baseline 0.4

      const playerHitCall = mockOn.mock.calls.find(
        (call: unknown[]) => call[0] === 'playerHit'
      );
      // Clear the phase call to isolate the spike
      mockAmbientGen.setIntensity.mockClear();

      playerHitCall![1]({ damage: 10, source: 'test' });

      // Should spike to 0.4 + 0.2 = 0.6
      expect(mockAmbientGen.setIntensity).toHaveBeenCalledWith(expect.closeTo(0.6, 5));

      // After 1 second, should return to baseline 0.4
      vi.advanceTimersByTime(1000);
      expect(mockAmbientGen.setIntensity).toHaveBeenLastCalledWith(0.4);

      vi.useRealTimers();
    });

    it('should clamp spiked intensity to 1.0', () => {
      vi.useFakeTimers();
      manager.init(mockCamera);
      const mockAmbientGen = {
        start: vi.fn(),
        stop: vi.fn(),
        setIntensity: vi.fn(),
        setVolume: vi.fn(),
        dispose: vi.fn(),
        isPlaying: vi.fn().mockReturnValue(true),
      };
      manager.registerAmbientGenerator(mockAmbientGen as never);

      // Set baseline to boss phase (0.8)
      const phaseStartCall = mockOn.mock.calls.find(
        (call: unknown[]) => call[0] === 'phaseStart'
      );
      phaseStartCall![1]({ phase: 'boss', level: 1 });

      const playerHitCall = mockOn.mock.calls.find(
        (call: unknown[]) => call[0] === 'playerHit'
      );
      playerHitCall![1]({ damage: 10, source: 'test' });

      // Should be clamped to 1.0, not 0.8 + 0.2 = 1.0 (exact)
      expect(mockAmbientGen.setIntensity).toHaveBeenCalledWith(1.0);

      vi.useRealTimers();
    });
  });

  describe('ambient intensity via bossHealthChanged (Story 4-7)', () => {
    it('should subscribe to bossHealthChanged event', () => {
      manager.init(mockCamera);
      expect(mockOn).toHaveBeenCalledWith('bossHealthChanged', expect.any(Function));
    });

    it('should set intensity to 0.9 when boss health drops below 50%', () => {
      manager.init(mockCamera);
      const mockAmbientGen = {
        start: vi.fn(),
        stop: vi.fn(),
        setIntensity: vi.fn(),
        setVolume: vi.fn(),
        dispose: vi.fn(),
        isPlaying: vi.fn().mockReturnValue(true),
      };
      manager.registerAmbientGenerator(mockAmbientGen as never);

      const bossHealthCall = mockOn.mock.calls.find(
        (call: unknown[]) => call[0] === 'bossHealthChanged'
      );
      expect(bossHealthCall).toBeDefined();

      bossHealthCall![1]({ health: 40, maxHealth: 100 });
      expect(mockAmbientGen.setIntensity).toHaveBeenCalledWith(0.9);
    });

    it('should set intensity to 1.0 when boss health drops below 25%', () => {
      manager.init(mockCamera);
      const mockAmbientGen = {
        start: vi.fn(),
        stop: vi.fn(),
        setIntensity: vi.fn(),
        setVolume: vi.fn(),
        dispose: vi.fn(),
        isPlaying: vi.fn().mockReturnValue(true),
      };
      manager.registerAmbientGenerator(mockAmbientGen as never);

      const bossHealthCall = mockOn.mock.calls.find(
        (call: unknown[]) => call[0] === 'bossHealthChanged'
      );
      bossHealthCall![1]({ health: 20, maxHealth: 100 });
      expect(mockAmbientGen.setIntensity).toHaveBeenCalledWith(1.0);
    });

    it('should not change intensity when boss health is above 50%', () => {
      manager.init(mockCamera);
      const mockAmbientGen = {
        start: vi.fn(),
        stop: vi.fn(),
        setIntensity: vi.fn(),
        setVolume: vi.fn(),
        dispose: vi.fn(),
        isPlaying: vi.fn().mockReturnValue(true),
      };
      manager.registerAmbientGenerator(mockAmbientGen as never);

      const bossHealthCall = mockOn.mock.calls.find(
        (call: unknown[]) => call[0] === 'bossHealthChanged'
      );
      bossHealthCall![1]({ health: 60, maxHealth: 100 });
      // setIntensity should NOT have been called (no ambient gen call from this event)
      expect(mockAmbientGen.setIntensity).not.toHaveBeenCalled();
    });
  });

  describe('ambient generator dispose (Story 4-7)', () => {
    it('should dispose ambient generator on AudioManager dispose', () => {
      manager.init(mockCamera);
      const mockAmbientGen = {
        start: vi.fn(),
        stop: vi.fn(),
        setIntensity: vi.fn(),
        setVolume: vi.fn(),
        dispose: vi.fn(),
        isPlaying: vi.fn().mockReturnValue(true),
      };
      manager.registerAmbientGenerator(mockAmbientGen as never);
      manager.dispose();
      expect(mockAmbientGen.dispose).toHaveBeenCalled();
    });

    it('should unsubscribe bossHealthChanged on dispose', () => {
      manager.init(mockCamera);
      manager.dispose();
      expect(mockOff).toHaveBeenCalledWith('bossHealthChanged', expect.any(Function));
    });
  });

  describe('getAudioContext (Story 4-7)', () => {
    it('should return AudioContext from listener after init', () => {
      manager.init(mockCamera);
      const ctx = manager.getAudioContext();
      expect(ctx).toBeDefined();
      expect(ctx).not.toBeNull();
    });

    it('should return null before init', () => {
      expect(manager.getAudioContext()).toBeNull();
    });
  });

  describe('getAmbientOutputNode (Story 4-7)', () => {
    it('should return null before init', () => {
      expect(manager.getAmbientOutputNode()).toBeNull();
    });
  });

  describe('ambient generator unlock handler (Story 4-7)', () => {
    it('should start ambient generator on first user interaction', () => {
      manager.init(mockCamera);
      const mockAmbientGen = {
        start: vi.fn(),
        stop: vi.fn(),
        setIntensity: vi.fn(),
        setVolume: vi.fn(),
        dispose: vi.fn(),
        isPlaying: vi.fn().mockReturnValue(false),
      };
      manager.registerAmbientGenerator(mockAmbientGen as never);

      // Simulate click event to trigger unlock handler
      const clickEvent = new Event('click');
      document.dispatchEvent(clickEvent);

      expect(mockAmbientGen.start).toHaveBeenCalled();
    });

    it('should not start ambient generator if already playing', () => {
      manager.init(mockCamera);
      const mockAmbientGen = {
        start: vi.fn(),
        stop: vi.fn(),
        setIntensity: vi.fn(),
        setVolume: vi.fn(),
        dispose: vi.fn(),
        isPlaying: vi.fn().mockReturnValue(true), // Already playing
      };
      manager.registerAmbientGenerator(mockAmbientGen as never);

      // Simulate click event
      const clickEvent = new Event('click');
      document.dispatchEvent(clickEvent);

      expect(mockAmbientGen.start).not.toHaveBeenCalled();
    });
  });
});
