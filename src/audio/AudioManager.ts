/**
 * AudioManager — Central audio system managing four independent channels.
 *
 * Wraps THREE.AudioListener and provides SFX, Voice, Ambient, and Music
 * channels with independent volume control. Loads sound manifest from JSON
 * and plays audio via EventBus subscriptions.
 *
 * Created by: Story 4-5 (Audio Manager Architecture)
 */

import * as THREE from 'three';
import { Logger } from '../core/Logger.ts';
import { eventBus } from '../core/GameEvents.ts';
import type { WeaponFiredEvent, PlayerHitEvent } from '../core/GameEvents.ts';
import type { Enemy } from '../entities/enemies/Enemy.ts';
import type { WeaponType } from '../types/game.ts';
import { AudioChannel } from './AudioChannel.ts';
import type { ChannelType, SoundManifest } from './SoundManifest.ts';

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

export class AudioManager {
  private listener: THREE.AudioListener | null = null;
  private camera: THREE.Camera | null = null;
  private channels: Map<ChannelType, AudioChannel> = new Map();
  private manifest: SoundManifest = {};
  private bufferCache: Map<string, AudioBuffer> = new Map();
  private audioLoader: THREE.AudioLoader | null = null;
  private masterVolume = { value: 1.0 };
  private initialized = false;
  private unlockHandler: (() => void) | null = null;

  // EventBus callback references for cleanup
  private onWeaponFired: ((e: WeaponFiredEvent) => void) | null = null;
  private onPlayerHit: ((e: PlayerHitEvent) => void) | null = null;
  private onEnemyDestroyed:
    | ((e: { enemy: Enemy; position: { x: number; y: number; z: number } }) => void)
    | null = null;

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
    };
    this.onEnemyDestroyed = () => {
      this.playSFX('enemy_explosion');
    };

    eventBus.on('weaponFired', this.onWeaponFired);
    eventBus.on('playerHit', this.onPlayerHit);
    eventBus.on('enemyDestroyed', this.onEnemyDestroyed);

    this.initialized = true;
    Logger.info('Audio', 'AudioManager initialized');
  }

  async loadManifest(url: string): Promise<void> {
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
    this.listener = null;
    this.camera = null;
    this.audioLoader = null;
    this.initialized = false;

    Logger.info('Audio', 'AudioManager disposed');
  }

  private playOnChannel(channelType: ChannelType, id: string, loop?: boolean): void {
    const entry = this.manifest[id];
    if (!entry) {
      Logger.warn('Audio', 'Sound not found in manifest', { id });
      return;
    }

    const channel = this.channels.get(channelType);
    if (!channel) {
      Logger.warn('Audio', 'Channel not found', { channel: channelType });
      return;
    }

    this.loadBuffer(id, entry.path).then((buffer) => {
      if (buffer) {
        channel.play(buffer, loop);
      }
    });
  }

  private async loadBuffer(id: string, path: string): Promise<AudioBuffer | null> {
    // Return from cache if available
    const cached = this.bufferCache.get(id);
    if (cached) return cached;

    if (!this.audioLoader) {
      Logger.warn('Audio', 'AudioLoader not initialized');
      return null;
    }

    try {
      const buffer = await this.audioLoader.loadAsync(path);
      this.bufferCache.set(id, buffer);
      return buffer;
    } catch (error) {
      Logger.warn('Audio', 'Failed to load audio buffer', { id, path, error: String(error) });
      return null;
    }
  }
}

/** Module-level singleton audio manager */
export const audioManager = new AudioManager();
