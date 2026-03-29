/**
 * AudioChannel — Single audio channel wrapping THREE.Audio instances.
 *
 * Each channel type has different playback semantics:
 * - SFX: Pooled instances for concurrent playback (round-robin)
 * - Voice: Single instance with queue (sequential playback)
 * - Ambient: Single looping instance
 * - Music: Single instance
 *
 * Created by: Story 4-5 (Audio Manager Architecture)
 */

import * as THREE from 'three';
import type { ChannelType } from './SoundManifest.ts';

export interface ChannelOptions {
  type: ChannelType;
  volume: number;
  poolSize?: number;
}

export class AudioChannel {
  private type: ChannelType;
  private volume: number;
  private instances: THREE.Audio[];
  private nextIndex: number;
  private queue: AudioBuffer[];
  private masterVolumeRef: { value: number };

  constructor(
    listener: THREE.AudioListener,
    options: ChannelOptions,
    masterVolumeRef: { value: number }
  ) {
    this.type = options.type;
    this.volume = options.volume;
    this.nextIndex = 0;
    this.queue = [];
    this.masterVolumeRef = masterVolumeRef;

    const count = this.type === 'sfx' ? (options.poolSize ?? 8) : 1;
    this.instances = [];
    for (let i = 0; i < count; i++) {
      const audio = new THREE.Audio(listener);
      this.instances.push(audio);
    }

    // Voice channel: set up onEnded to dequeue next line
    if (this.type === 'voice' && this.instances.length > 0) {
      this.instances[0].onEnded = () => {
        this.playNextQueued();
      };
    }
  }

  play(buffer: AudioBuffer, loop?: boolean): void {
    if (this.type === 'sfx') {
      this.playSFX(buffer);
    } else if (this.type === 'voice') {
      this.playVoice(buffer);
    } else {
      // Ambient or Music
      this.playGeneric(buffer, loop);
    }
  }

  stop(): void {
    for (const instance of this.instances) {
      if (instance.isPlaying) {
        instance.stop();
      }
    }
    if (this.type === 'voice') {
      this.queue = [];
      this.voicePlaying = false;
      if (this.voiceTimer) { clearTimeout(this.voiceTimer); this.voiceTimer = null; }
    }
  }

  setVolume(volume: number): void {
    this.volume = volume;
    const effective = this.volume * this.masterVolumeRef.value;
    for (const instance of this.instances) {
      instance.setVolume(effective);
    }
  }

  getVolume(): number {
    return this.volume;
  }

  clearQueue(): void {
    this.queue = [];
  }

  dispose(): void {
    this.stop();
    for (const instance of this.instances) {
      instance.disconnect();
    }
  }

  updateMasterVolume(): void {
    const effective = this.volume * this.masterVolumeRef.value;
    for (const instance of this.instances) {
      instance.setVolume(effective);
    }
  }

  private playSFX(buffer: AudioBuffer): void {
    const instance = this.instances[this.nextIndex];
    this.nextIndex = (this.nextIndex + 1) % this.instances.length;

    if (instance.isPlaying) {
      instance.stop();
    }
    instance.setBuffer(buffer);
    instance.setLoop(false);
    instance.setVolume(this.volume * this.masterVolumeRef.value);
    instance.play();
  }

  private voicePlaying = false;
  private voiceTimer: ReturnType<typeof setTimeout> | null = null;

  private playVoice(buffer: AudioBuffer): void {
    const instance = this.instances[0];
    if (this.voicePlaying) {
      this.queue.push(buffer);
      return;
    }
    this.voicePlaying = true;

    if (instance.isPlaying) {
      instance.stop();
    }
    instance.setBuffer(buffer);
    instance.setLoop(false);
    instance.setVolume(this.volume * this.masterVolumeRef.value);

    const onFinish = () => {
      this.voicePlaying = false;
      if (this.voiceTimer) { clearTimeout(this.voiceTimer); this.voiceTimer = null; }
      this.playNextQueued();
    };

    instance.onEnded = onFinish;
    instance.play();

    // Safety timeout: if onEnded never fires, force advance after buffer duration + 1s
    if (this.voiceTimer) clearTimeout(this.voiceTimer);
    this.voiceTimer = setTimeout(onFinish, (buffer.duration + 1.0) * 1000);
  }

  private playGeneric(buffer: AudioBuffer, loop?: boolean): void {
    const instance = this.instances[0];
    if (instance.isPlaying) {
      instance.stop();
    }
    instance.setBuffer(buffer);
    instance.setLoop(loop ?? (this.type === 'ambient'));
    instance.setVolume(this.volume * this.masterVolumeRef.value);
    instance.play();
  }

  private playNextQueued(): void {
    if (this.queue.length === 0) return;
    const nextBuffer = this.queue.shift()!;
    this.voicePlaying = true;
    const instance = this.instances[0];

    if (instance.isPlaying) {
      instance.stop();
    }
    instance.setBuffer(nextBuffer);
    instance.setLoop(false);
    instance.setVolume(this.volume * this.masterVolumeRef.value);

    const onFinish = () => {
      this.voicePlaying = false;
      if (this.voiceTimer) { clearTimeout(this.voiceTimer); this.voiceTimer = null; }
      this.playNextQueued();
    };

    instance.onEnded = onFinish;
    instance.play();

    if (this.voiceTimer) clearTimeout(this.voiceTimer);
    this.voiceTimer = setTimeout(onFinish, (nextBuffer.duration + 1.0) * 1000);
  }
}
