/**
 * AudioChannel tests — validates channel playback semantics.
 *
 * Story 4-5: Audio Manager Architecture
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Track mock instances for channel verification
function createMockAudio() {
  return {
    isPlaying: false,
    setBuffer: vi.fn(),
    setLoop: vi.fn(),
    setVolume: vi.fn(),
    play: vi.fn(function (this: { isPlaying: boolean }) {
      this.isPlaying = true;
    }),
    stop: vi.fn(function (this: { isPlaying: boolean }) {
      this.isPlaying = false;
    }),
    disconnect: vi.fn(),
    onEnded: null as (() => void) | null,
  };
}

let mockAudioInstances: ReturnType<typeof createMockAudio>[] = [];

vi.mock('three', () => {
  return {
    Audio: function MockAudio() {
      const instance = createMockAudio();
      mockAudioInstances.push(instance);
      return instance;
    },
    AudioListener: function MockAudioListener() {
      return {};
    },
  };
});

import { AudioChannel } from '../audio/AudioChannel.ts';
import * as THREE from 'three';

describe('AudioChannel', () => {
  let listener: THREE.AudioListener;
  let masterVolumeRef: { value: number };

  beforeEach(() => {
    mockAudioInstances = [];
    listener = new THREE.AudioListener();
    masterVolumeRef = { value: 1.0 };
  });

  describe('SFX channel', () => {
    it('should create poolSize instances for SFX', () => {
      new AudioChannel(listener, { type: 'sfx', volume: 0.6, poolSize: 4 }, masterVolumeRef);
      expect(mockAudioInstances).toHaveLength(4);
    });

    it('should default to 8 instances when poolSize not specified', () => {
      new AudioChannel(listener, { type: 'sfx', volume: 0.6 }, masterVolumeRef);
      expect(mockAudioInstances).toHaveLength(8);
    });

    it('should play via round-robin across pool', () => {
      const channel = new AudioChannel(listener, { type: 'sfx', volume: 0.6, poolSize: 3 }, masterVolumeRef);
      const buffer1 = {} as AudioBuffer;
      const buffer2 = {} as AudioBuffer;
      const buffer3 = {} as AudioBuffer;
      const buffer4 = {} as AudioBuffer;

      channel.play(buffer1);
      expect(mockAudioInstances[0].setBuffer).toHaveBeenCalledWith(buffer1);
      expect(mockAudioInstances[0].play).toHaveBeenCalled();

      channel.play(buffer2);
      expect(mockAudioInstances[1].setBuffer).toHaveBeenCalledWith(buffer2);

      channel.play(buffer3);
      expect(mockAudioInstances[2].setBuffer).toHaveBeenCalledWith(buffer3);

      // Wraps around
      channel.play(buffer4);
      expect(mockAudioInstances[0].setBuffer).toHaveBeenCalledWith(buffer4);
    });

    it('should stop playing instance before reuse', () => {
      const channel = new AudioChannel(listener, { type: 'sfx', volume: 0.6, poolSize: 1 }, masterVolumeRef);
      const buffer = {} as AudioBuffer;

      channel.play(buffer);
      expect(mockAudioInstances[0].isPlaying).toBe(true);

      channel.play(buffer);
      expect(mockAudioInstances[0].stop).toHaveBeenCalled();
    });

    it('should set loop to false for SFX', () => {
      const channel = new AudioChannel(listener, { type: 'sfx', volume: 0.6, poolSize: 1 }, masterVolumeRef);
      channel.play({} as AudioBuffer);
      expect(mockAudioInstances[0].setLoop).toHaveBeenCalledWith(false);
    });
  });

  describe('Voice channel', () => {
    it('should create single instance for Voice', () => {
      new AudioChannel(listener, { type: 'voice', volume: 0.9 }, masterVolumeRef);
      expect(mockAudioInstances).toHaveLength(1);
    });

    it('should queue when already playing', () => {
      const channel = new AudioChannel(listener, { type: 'voice', volume: 0.9 }, masterVolumeRef);
      const buffer1 = {} as AudioBuffer;
      const buffer2 = {} as AudioBuffer;

      channel.play(buffer1);
      expect(mockAudioInstances[0].setBuffer).toHaveBeenCalledWith(buffer1);
      expect(mockAudioInstances[0].play).toHaveBeenCalled();

      // Second play while first is still playing — should queue, not play immediately
      channel.play(buffer2);
      expect(mockAudioInstances[0].setBuffer).toHaveBeenCalledTimes(1);
    });

    it('should play queued buffer when current ends', () => {
      const channel = new AudioChannel(listener, { type: 'voice', volume: 0.9 }, masterVolumeRef);
      const buffer1 = {} as AudioBuffer;
      const buffer2 = {} as AudioBuffer;

      channel.play(buffer1);
      channel.play(buffer2); // Queued

      // Simulate end of first buffer
      const instance = mockAudioInstances[0];
      instance.isPlaying = false;
      if (instance.onEnded) instance.onEnded();

      expect(instance.setBuffer).toHaveBeenCalledWith(buffer2);
    });

    it('should clear queue on clearQueue()', () => {
      const channel = new AudioChannel(listener, { type: 'voice', volume: 0.9 }, masterVolumeRef);
      const buffer1 = {} as AudioBuffer;
      const buffer2 = {} as AudioBuffer;

      channel.play(buffer1);
      channel.play(buffer2);

      channel.clearQueue();

      // Simulate end — should NOT play buffer2
      const instance = mockAudioInstances[0];
      instance.isPlaying = false;
      if (instance.onEnded) instance.onEnded();

      // setBuffer was only called once (for buffer1), not for buffer2 after clearQueue
      expect(instance.setBuffer).toHaveBeenCalledTimes(1);
    });
  });

  describe('Ambient channel', () => {
    it('should create single instance for Ambient', () => {
      new AudioChannel(listener, { type: 'ambient', volume: 0.4 }, masterVolumeRef);
      expect(mockAudioInstances).toHaveLength(1);
    });

    it('should loop by default for Ambient', () => {
      const channel = new AudioChannel(listener, { type: 'ambient', volume: 0.4 }, masterVolumeRef);
      channel.play({} as AudioBuffer);
      expect(mockAudioInstances[0].setLoop).toHaveBeenCalledWith(true);
    });

    it('should stop existing before playing new', () => {
      const channel = new AudioChannel(listener, { type: 'ambient', volume: 0.4 }, masterVolumeRef);
      channel.play({} as AudioBuffer);
      expect(mockAudioInstances[0].isPlaying).toBe(true);

      channel.play({} as AudioBuffer);
      expect(mockAudioInstances[0].stop).toHaveBeenCalled();
    });
  });

  describe('Music channel', () => {
    it('should create single instance for Music', () => {
      new AudioChannel(listener, { type: 'music', volume: 0.3 }, masterVolumeRef);
      expect(mockAudioInstances).toHaveLength(1);
    });

    it('should not loop by default for Music', () => {
      const channel = new AudioChannel(listener, { type: 'music', volume: 0.3 }, masterVolumeRef);
      channel.play({} as AudioBuffer);
      expect(mockAudioInstances[0].setLoop).toHaveBeenCalledWith(false);
    });

    it('should loop when explicitly requested', () => {
      const channel = new AudioChannel(listener, { type: 'music', volume: 0.3 }, masterVolumeRef);
      channel.play({} as AudioBuffer, true);
      expect(mockAudioInstances[0].setLoop).toHaveBeenCalledWith(true);
    });
  });

  describe('Volume control', () => {
    it('should set volume on all instances', () => {
      const channel = new AudioChannel(listener, { type: 'sfx', volume: 0.6, poolSize: 3 }, masterVolumeRef);
      channel.setVolume(0.8);
      for (const instance of mockAudioInstances) {
        expect(instance.setVolume).toHaveBeenCalledWith(0.8); // 0.8 * 1.0 master
      }
    });

    it('should factor in master volume', () => {
      masterVolumeRef.value = 0.5;
      const channel = new AudioChannel(listener, { type: 'sfx', volume: 0.6, poolSize: 1 }, masterVolumeRef);
      channel.setVolume(0.8);
      expect(mockAudioInstances[0].setVolume).toHaveBeenCalledWith(0.4); // 0.8 * 0.5
    });

    it('should update all instances on updateMasterVolume()', () => {
      const channel = new AudioChannel(listener, { type: 'sfx', volume: 0.6, poolSize: 2 }, masterVolumeRef);
      masterVolumeRef.value = 0.5;
      channel.updateMasterVolume();
      for (const instance of mockAudioInstances) {
        expect(instance.setVolume).toHaveBeenCalledWith(0.3); // 0.6 * 0.5
      }
    });

    it('should return current volume via getVolume()', () => {
      const channel = new AudioChannel(listener, { type: 'sfx', volume: 0.6, poolSize: 1 }, masterVolumeRef);
      expect(channel.getVolume()).toBe(0.6);
      channel.setVolume(0.8);
      expect(channel.getVolume()).toBe(0.8);
    });
  });

  describe('Stop and dispose', () => {
    it('should stop all playing instances', () => {
      const channel = new AudioChannel(listener, { type: 'sfx', volume: 0.6, poolSize: 3 }, masterVolumeRef);
      channel.play({} as AudioBuffer);
      channel.play({} as AudioBuffer);
      channel.play({} as AudioBuffer);

      channel.stop();
      for (const instance of mockAudioInstances) {
        expect(instance.stop).toHaveBeenCalled();
      }
    });

    it('should disconnect all instances on dispose', () => {
      const channel = new AudioChannel(listener, { type: 'sfx', volume: 0.6, poolSize: 2 }, masterVolumeRef);
      channel.dispose();
      for (const instance of mockAudioInstances) {
        expect(instance.disconnect).toHaveBeenCalled();
      }
    });
  });
});
