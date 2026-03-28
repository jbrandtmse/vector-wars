/**
 * AudioManager — Central audio system managing four independent channels.
 *
 * Wraps THREE.AudioListener and provides SFX, Voice, Ambient, and Music
 * channels with independent volume control. Loads sound manifest from JSON
 * and plays audio via EventBus subscriptions.
 *
 * Created by: Story 4-5 (Audio Manager Architecture)
 * Updated by: Story 4-6 (Retro SFX for Weapons and Actions)
 * Updated by: Story 4-7 (Ambient Electronic Hum)
 */

import * as THREE from 'three';
import { Logger } from '../core/Logger.ts';
import { eventBus } from '../core/GameEvents.ts';
import type { WeaponFiredEvent, PlayerHitEvent, PhaseStartEvent, BossHealthChangedEvent } from '../core/GameEvents.ts';
import type { Enemy } from '../entities/enemies/Enemy.ts';
import type { WeaponType, PhaseType } from '../types/game.ts';
import { AudioChannel } from './AudioChannel.ts';
import type { ChannelType, SoundManifest } from './SoundManifest.ts';
import type { SFXGenerator } from './SFXGenerator.ts';
import type { AmbientHumGenerator } from './AmbientHumGenerator.ts';
import type { VoiceLineGenerator } from './VoiceLineGenerator.ts';

const WEAPON_SOUND_MAP: Record<WeaponType, string> = {
  dataLance: 'data_lance_fire',
  logicBomb: 'logic_bomb_fire',
  emp: 'emp_burst',
  virusPayload: 'virus_payload',
};

const DEFAULT_VOLUMES: Record<ChannelType, number> = {
  sfx: 0.6,
  voice: 0.9,
  ambient: 0.4,
  music: 0.3,
};

const PHASE_INTENSITY_MAP: Record<PhaseType, number> = {
  tutorial: 0.1,
  briefing: 0.15,
  dogfight: 0.4,
  surface: 0.5,
  corridor: 0.6,
  boss: 0.8,
};

const INTENSITY_SPIKE_AMOUNT = 0.2;
const INTENSITY_SPIKE_DURATION = 1000; // ms

export class AudioManager {
  private listener: THREE.AudioListener | null = null;
  private camera: THREE.Camera | null = null;
  private channels: Map<ChannelType, AudioChannel> = new Map();
  private manifest: SoundManifest = {};
  private manifestUrl = '';
  private bufferCache: Map<string, AudioBuffer> = new Map();
  private audioLoader: THREE.AudioLoader | null = null;
  private masterVolume = { value: 1.0 };
  private initialized = false;
  private unlockHandler: (() => void) | null = null;
  private generator: SFXGenerator | null = null;
  private voiceGenerator: VoiceLineGenerator | null = null;
  private ambientGenerator: AmbientHumGenerator | null = null;
  private ambientIntensityBaseline = 0;
  private ambientIntensityTimeout: ReturnType<typeof setTimeout> | null = null;

  // EventBus callback references for cleanup
  private onWeaponFired: ((e: WeaponFiredEvent) => void) | null = null;
  private onPlayerHit: ((e: PlayerHitEvent) => void) | null = null;
  private onEnemyDestroyed:
    | ((e: { enemy: Enemy; position: { x: number; y: number; z: number } }) => void)
    | null = null;
  private onBossDestroyed:
    | ((e: { position: { x: number; y: number; z: number }; scoreValue: number }) => void)
    | null = null;
  private onPhaseStart: ((e: PhaseStartEvent) => void) | null = null;
  private onBossHealthChanged: ((e: BossHealthChangedEvent) => void) | null = null;

  init(camera: THREE.Camera): void {
    if (this.initialized) return;

    this.listener = new THREE.AudioListener();
    this.camera = camera;
    camera.add(this.listener);

    this.audioLoader = new THREE.AudioLoader();

    // Create channels with default volumes
    this.channels.set(
      'sfx',
      new AudioChannel(this.listener, { type: 'sfx', volume: DEFAULT_VOLUMES.sfx, poolSize: 8 }, this.masterVolume)
    );
    this.channels.set(
      'voice',
      new AudioChannel(this.listener, { type: 'voice', volume: DEFAULT_VOLUMES.voice }, this.masterVolume)
    );
    this.channels.set(
      'ambient',
      new AudioChannel(this.listener, { type: 'ambient', volume: DEFAULT_VOLUMES.ambient }, this.masterVolume)
    );
    this.channels.set(
      'music',
      new AudioChannel(this.listener, { type: 'music', volume: DEFAULT_VOLUMES.music }, this.masterVolume)
    );

    // Register AudioContext unlock listener (browser policy)
    this.unlockHandler = () => {
      if (this.listener) {
        const ctx = this.listener.context;
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {
            // Silently ignore resume failures
          });
        }
      }
      // Start ambient hum generator on first user interaction
      if (this.ambientGenerator && !this.ambientGenerator.isPlaying()) {
        this.ambientGenerator.start();
      }
      // Remove after first interaction
      if (this.unlockHandler) {
        document.removeEventListener('click', this.unlockHandler);
        document.removeEventListener('keydown', this.unlockHandler);
        this.unlockHandler = null;
      }
    };
    document.addEventListener('click', this.unlockHandler);
    document.addEventListener('keydown', this.unlockHandler);

    // Subscribe to EventBus events
    this.onWeaponFired = (e: WeaponFiredEvent) => {
      const soundId = WEAPON_SOUND_MAP[e.weapon];
      if (soundId) {
        this.playSFX(soundId);
      }
    };
    this.onPlayerHit = (_e: PlayerHitEvent) => {
      this.playSFX('shield_hit');
      // Spike ambient intensity temporarily on damage
      if (this.ambientGenerator) {
        const spikedIntensity = Math.min(1.0, this.ambientIntensityBaseline + INTENSITY_SPIKE_AMOUNT);
        this.ambientGenerator.setIntensity(spikedIntensity);
        // Clear any existing timeout
        if (this.ambientIntensityTimeout !== null) {
          clearTimeout(this.ambientIntensityTimeout);
        }
        this.ambientIntensityTimeout = setTimeout(() => {
          if (this.ambientGenerator) {
            this.ambientGenerator.setIntensity(this.ambientIntensityBaseline);
          }
          this.ambientIntensityTimeout = null;
        }, INTENSITY_SPIKE_DURATION);
      }
    };
    this.onEnemyDestroyed = () => {
      this.playSFX('enemy_explosion');
    };

    this.onBossDestroyed = () => {
      this.playSFX('boss_destruction');
    };
    this.onPhaseStart = (e: PhaseStartEvent) => {
      if (e.phase === 'corridor') {
        this.playSFX('corridor_whoosh');
      }
      // Set ambient hum intensity based on phase type
      if (this.ambientGenerator) {
        const intensity = PHASE_INTENSITY_MAP[e.phase] ?? 0.3;
        this.ambientIntensityBaseline = intensity;
        this.ambientGenerator.setIntensity(intensity);
      }
    };

    this.onBossHealthChanged = (e: BossHealthChangedEvent) => {
      if (!this.ambientGenerator) return;
      const healthPercent = e.health / e.maxHealth;
      if (healthPercent < 0.25) {
        this.ambientIntensityBaseline = 1.0;
        this.ambientGenerator.setIntensity(1.0);
      } else if (healthPercent < 0.5) {
        this.ambientIntensityBaseline = 0.9;
        this.ambientGenerator.setIntensity(0.9);
      }
    };

    eventBus.on('weaponFired', this.onWeaponFired);
    eventBus.on('playerHit', this.onPlayerHit);
    eventBus.on('enemyDestroyed', this.onEnemyDestroyed);
    eventBus.on('bossDestroyed', this.onBossDestroyed);
    eventBus.on('phaseStart', this.onPhaseStart);
    eventBus.on('bossHealthChanged', this.onBossHealthChanged);

    this.initialized = true;
    Logger.info('Audio', 'AudioManager initialized');
  }

  registerGenerator(generator: SFXGenerator): void {
    this.generator = generator;
    Logger.info('Audio', 'SFX generator registered');
  }

  registerVoiceGenerator(generator: VoiceLineGenerator): void {
    this.voiceGenerator = generator;
    Logger.info('Audio', 'Voice line generator registered');
  }

  registerAmbientGenerator(generator: AmbientHumGenerator): void {
    this.ambientGenerator = generator;
    Logger.info('Audio', 'Ambient hum generator registered');
  }

  /**
   * Get the AudioContext from the listener.
   * Used by AmbientHumGenerator which needs the live context.
   */
  getAudioContext(): AudioContext | null {
    return this.listener ? (this.listener.context as AudioContext) : null;
  }

  /**
   * Get the GainNode used by the ambient channel for volume routing.
   * Creates a standalone GainNode connected to the listener's destination
   * with the ambient channel's volume applied.
   */
  getAmbientOutputNode(): GainNode | null {
    if (!this.listener) return null;
    const ctx = this.listener.context as AudioContext;
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(
      DEFAULT_VOLUMES.ambient * this.masterVolume.value,
      ctx.currentTime
    );
    gainNode.connect(ctx.destination);
    return gainNode;
  }

  async loadManifest(url: string): Promise<void> {
    this.manifestUrl = url;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        Logger.warn('Audio', 'Failed to fetch manifest', { url, status: response.status });
        return;
      }
      this.manifest = (await response.json()) as SoundManifest;
      Logger.info('Audio', 'Sound manifest loaded', { entries: Object.keys(this.manifest).length });
    } catch (error) {
      Logger.warn('Audio', 'Failed to load sound manifest', { url, error: String(error) });
    }
  }

  /**
   * Re-fetch the manifest and clear the buffer cache.
   * Allows newly placed audio files to take effect without a page reload.
   * Development workflow: drop in .ogg file, call reloadManifest() from console.
   */
  async reloadManifest(): Promise<void> {
    if (!this.manifestUrl) {
      Logger.warn('Audio', 'No manifest URL set — call loadManifest() first');
      return;
    }
    try {
      const response = await fetch(this.manifestUrl);
      if (!response.ok) {
        Logger.warn('Audio', 'Failed to reload manifest', { url: this.manifestUrl, status: response.status });
        return;
      }
      this.manifest = (await response.json()) as SoundManifest;
      this.bufferCache.clear();
      Logger.info('Audio', 'Manifest reloaded', { entries: Object.keys(this.manifest).length });
    } catch (error) {
      Logger.warn('Audio', 'Failed to reload manifest', { url: this.manifestUrl, error: String(error) });
    }
  }

  playSFX(id: string): void {
    this.playOnChannel('sfx', id);
  }

  playVoice(id: string): void {
    this.playOnChannel('voice', id);
  }

  playAmbient(id: string, loop?: boolean): void {
    this.playOnChannel('ambient', id, loop);
  }

  playMusic(id: string, loop?: boolean): void {
    this.playOnChannel('music', id, loop);
  }

  stopChannel(channel: ChannelType): void {
    const ch = this.channels.get(channel);
    if (ch) {
      ch.stop();
    }
  }

  setChannelVolume(channel: ChannelType, volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    const ch = this.channels.get(channel);
    if (ch) {
      ch.setVolume(clamped);
    }
  }

  setMasterVolume(volume: number): void {
    this.masterVolume.value = Math.max(0, Math.min(1, volume));
    for (const ch of this.channels.values()) {
      ch.updateMasterVolume();
    }
  }

  getMasterVolume(): number {
    return this.masterVolume.value;
  }

  getChannelVolume(channel: ChannelType): number {
    const ch = this.channels.get(channel);
    return ch ? ch.getVolume() : 0;
  }

  dispose(): void {
    // Unsubscribe from EventBus
    if (this.onWeaponFired) {
      eventBus.off('weaponFired', this.onWeaponFired);
      this.onWeaponFired = null;
    }
    if (this.onPlayerHit) {
      eventBus.off('playerHit', this.onPlayerHit);
      this.onPlayerHit = null;
    }
    if (this.onEnemyDestroyed) {
      eventBus.off('enemyDestroyed', this.onEnemyDestroyed);
      this.onEnemyDestroyed = null;
    }
    if (this.onBossDestroyed) {
      eventBus.off('bossDestroyed', this.onBossDestroyed);
      this.onBossDestroyed = null;
    }
    if (this.onPhaseStart) {
      eventBus.off('phaseStart', this.onPhaseStart);
      this.onPhaseStart = null;
    }
    if (this.onBossHealthChanged) {
      eventBus.off('bossHealthChanged', this.onBossHealthChanged);
      this.onBossHealthChanged = null;
    }

    // Dispose ambient generator
    if (this.ambientGenerator) {
      this.ambientGenerator.dispose();
      this.ambientGenerator = null;
    }

    // Clear intensity spike timeout
    if (this.ambientIntensityTimeout !== null) {
      clearTimeout(this.ambientIntensityTimeout);
      this.ambientIntensityTimeout = null;
    }

    // Stop and dispose all channels
    for (const ch of this.channels.values()) {
      ch.dispose();
    }
    this.channels.clear();

    // Remove AudioListener from camera
    if (this.listener && this.camera) {
      this.camera.remove(this.listener);
    }

    // Remove AudioContext unlock listener
    if (this.unlockHandler) {
      document.removeEventListener('click', this.unlockHandler);
      document.removeEventListener('keydown', this.unlockHandler);
      this.unlockHandler = null;
    }

    this.bufferCache.clear();
    this.manifest = {};
    this.manifestUrl = '';
    this.listener = null;
    this.camera = null;
    this.audioLoader = null;
    this.generator = null;
    this.voiceGenerator = null;
    this.initialized = false;

    Logger.info('Audio', 'AudioManager disposed');
  }

  private playOnChannel(channelType: ChannelType, id: string, loop?: boolean): void {
    const channel = this.channels.get(channelType);
    if (!channel) {
      Logger.warn('Audio', 'Channel not found', { channel: channelType });
      return;
    }

    const entry = this.manifest[id];
    if (!entry && !this.generator?.hasSound(id) && !this.voiceGenerator?.hasSound(id)) {
      Logger.warn('Audio', 'Sound not found in manifest', { id });
      return;
    }

    this.loadBuffer(id, entry?.path ?? null).then((buffer) => {
      if (buffer) {
        channel.play(buffer, loop);
      }
    });
  }

  private async loadBuffer(id: string, path: string | null): Promise<AudioBuffer | null> {
    // Return from cache if available
    const cached = this.bufferCache.get(id);
    if (cached) return cached;

    // Try loading from file via AudioLoader
    if (path && this.audioLoader) {
      try {
        const buffer = await this.audioLoader.loadAsync(path);
        this.bufferCache.set(id, buffer);
        return buffer;
      } catch {
        // File load failed — fall through to generator
      }
    }

    // Fallback to SFX generator
    if (this.generator) {
      const buffer = await this.generator.generate(id);
      if (buffer) {
        this.bufferCache.set(id, buffer);
        return buffer;
      }
    }

    // Fallback to voice line generator
    if (this.voiceGenerator) {
      const buffer = await this.voiceGenerator.generate(id);
      if (buffer) {
        this.bufferCache.set(id, buffer);
        return buffer;
      }
    }

    Logger.warn('Audio', 'Failed to load audio buffer', { id, path });
    return null;
  }
}

/** Module-level singleton audio manager */
export const audioManager = new AudioManager();
