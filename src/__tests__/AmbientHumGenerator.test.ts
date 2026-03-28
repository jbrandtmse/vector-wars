/**
 * AmbientHumGenerator tests — validates procedural ambient hum generation.
 *
 * Story 4-7: Ambient Electronic Hum
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Logger to prevent console output in tests
vi.mock('../core/Logger.ts', () => ({
  Logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

function createMockAudioParam(initialValue = 0): AudioParam {
  const param = {
    value: initialValue,
    setValueAtTime: vi.fn(function (this: { value: number }, v: number) {
      this.value = v;
      return param;
    }),
    linearRampToValueAtTime: vi.fn(function (this: { value: number }, v: number) {
      this.value = v;
      return param;
    }),
    exponentialRampToValueAtTime: vi.fn(function (this: { value: number }, v: number) {
      this.value = v;
      return param;
    }),
  };
  return param as unknown as AudioParam;
}

function createMockOscillator(): OscillatorNode {
  return {
    type: 'sine',
    frequency: createMockAudioParam(440),
    detune: createMockAudioParam(0),
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  } as unknown as OscillatorNode;
}

function createMockGainNode(): GainNode {
  return {
    gain: createMockAudioParam(1),
    connect: vi.fn(),
    disconnect: vi.fn(),
  } as unknown as GainNode;
}

function createMockBiquadFilter(): BiquadFilterNode {
  return {
    type: 'lowpass',
    frequency: createMockAudioParam(350),
    Q: createMockAudioParam(1),
    gain: createMockAudioParam(0),
    detune: createMockAudioParam(0),
    connect: vi.fn(),
    disconnect: vi.fn(),
  } as unknown as BiquadFilterNode;
}

function createMockAudioContext(): AudioContext {
  return {
    currentTime: 0,
    createOscillator: vi.fn(() => createMockOscillator()),
    createGain: vi.fn(() => createMockGainNode()),
    createBiquadFilter: vi.fn(() => createMockBiquadFilter()),
  } as unknown as AudioContext;
}

// Import after mocks
import { AmbientHumGenerator } from '../audio/AmbientHumGenerator.ts';

describe('AmbientHumGenerator', () => {
  let ctx: AudioContext;
  let outputNode: GainNode;
  let generator: AmbientHumGenerator;

  beforeEach(() => {
    ctx = createMockAudioContext();
    outputNode = createMockGainNode();
    generator = new AmbientHumGenerator(ctx, outputNode);
  });

  describe('start()', () => {
    it('should create 4 oscillators when started', () => {
      generator.start();
      // 4 oscillators: base (60Hz), harmonic (120Hz), upper (180Hz), shimmer (440Hz)
      expect(ctx.createOscillator).toHaveBeenCalledTimes(4);
    });

    it('should create gain nodes for layers and master', () => {
      generator.start();
      // 5 gain nodes: master + 4 layers (base, harmonic, upper, shimmer)
      expect(ctx.createGain).toHaveBeenCalledTimes(5);
    });

    it('should create a lowpass filter for the shimmer layer', () => {
      generator.start();
      expect(ctx.createBiquadFilter).toHaveBeenCalledTimes(1);
    });

    it('should set playing state to true', () => {
      expect(generator.isPlaying()).toBe(false);
      generator.start();
      expect(generator.isPlaying()).toBe(true);
    });

    it('should be idempotent — second call is a no-op', () => {
      generator.start();
      generator.start();
      // Only 4 oscillators created (not 8)
      expect(ctx.createOscillator).toHaveBeenCalledTimes(4);
    });

    it('should connect master gain to output node', () => {
      generator.start();
      // The first createGain call returns the master gain
      const masterGain = (ctx.createGain as ReturnType<typeof vi.fn>).mock.results[0].value;
      expect(masterGain.connect).toHaveBeenCalledWith(outputNode);
    });
  });

  describe('stop()', () => {
    it('should set playing state to false', () => {
      generator.start();
      expect(generator.isPlaying()).toBe(true);
      generator.stop();
      expect(generator.isPlaying()).toBe(false);
    });

    it('should stop and disconnect all oscillators', () => {
      generator.start();
      const oscillators = (ctx.createOscillator as ReturnType<typeof vi.fn>).mock.results.map(
        (r: { value: OscillatorNode }) => r.value
      );
      generator.stop();
      for (const osc of oscillators) {
        expect(osc.stop).toHaveBeenCalled();
        expect(osc.disconnect).toHaveBeenCalled();
      }
    });

    it('should disconnect all gain nodes', () => {
      generator.start();
      const gains = (ctx.createGain as ReturnType<typeof vi.fn>).mock.results.map(
        (r: { value: GainNode }) => r.value
      );
      generator.stop();
      for (const gain of gains) {
        expect(gain.disconnect).toHaveBeenCalled();
      }
    });

    it('should be idempotent — no-op when not playing', () => {
      generator.stop(); // Should not throw
      expect(generator.isPlaying()).toBe(false);
    });
  });

  describe('setIntensity()', () => {
    it('should adjust gain values based on intensity level', () => {
      generator.start();
      const gains = (ctx.createGain as ReturnType<typeof vi.fn>).mock.results.map(
        (r: { value: GainNode }) => r.value
      );
      // gains[0] = masterGain, gains[1] = base, gains[2] = harmonic,
      // gains[3] = upper, gains[4] = shimmer

      generator.setIntensity(0.5);

      // Base: max(0.02, 0.15 * 0.5) = 0.075
      expect(gains[1].gain.linearRampToValueAtTime).toHaveBeenCalledWith(
        expect.closeTo(0.075, 3),
        expect.any(Number),
      );

      // Harmonic: 0.08 * 0.5 = 0.04
      expect(gains[2].gain.linearRampToValueAtTime).toHaveBeenCalledWith(
        expect.closeTo(0.04, 3),
        expect.any(Number),
      );

      // Upper: 0.04 * 0.5 = 0.02
      expect(gains[3].gain.linearRampToValueAtTime).toHaveBeenCalledWith(
        expect.closeTo(0.02, 3),
        expect.any(Number),
      );

      // Shimmer: 0.5 > 0.4, so 0.02 * (0.5 - 0.4) / 0.6 = ~0.00333
      expect(gains[4].gain.linearRampToValueAtTime).toHaveBeenCalledWith(
        expect.closeTo(0.02 * (0.1 / 0.6), 3),
        expect.any(Number),
      );
    });

    it('should set base drone minimum of 0.02 when level > 0', () => {
      generator.start();
      const gains = (ctx.createGain as ReturnType<typeof vi.fn>).mock.results.map(
        (r: { value: GainNode }) => r.value
      );

      generator.setIntensity(0.05);
      // 0.15 * 0.05 = 0.0075, but min is 0.02
      expect(gains[1].gain.linearRampToValueAtTime).toHaveBeenCalledWith(
        0.02,
        expect.any(Number),
      );
    });

    it('should set base drone to 0 when level is 0', () => {
      generator.start();
      const gains = (ctx.createGain as ReturnType<typeof vi.fn>).mock.results.map(
        (r: { value: GainNode }) => r.value
      );

      generator.setIntensity(0.0);
      expect(gains[1].gain.linearRampToValueAtTime).toHaveBeenCalledWith(
        0,
        expect.any(Number),
      );
    });

    it('should not activate shimmer layer below 0.4 intensity', () => {
      generator.start();
      const gains = (ctx.createGain as ReturnType<typeof vi.fn>).mock.results.map(
        (r: { value: GainNode }) => r.value
      );

      generator.setIntensity(0.3);
      expect(gains[4].gain.linearRampToValueAtTime).toHaveBeenCalledWith(
        0,
        expect.any(Number),
      );
    });

    it('should apply detuning at intensity >= 0.8', () => {
      generator.start();
      const oscillators = (ctx.createOscillator as ReturnType<typeof vi.fn>).mock.results.map(
        (r: { value: OscillatorNode }) => r.value
      );
      // oscillators[1] = harmonic (120Hz), oscillators[2] = upper (180Hz)

      generator.setIntensity(1.0);

      // At intensity 1.0: detuneAmount = 2 * (1.0 - 0.8) / 0.2 = 2
      expect(oscillators[1].frequency.linearRampToValueAtTime).toHaveBeenCalledWith(
        122, // 120 + 2
        expect.any(Number),
      );
      expect(oscillators[2].frequency.linearRampToValueAtTime).toHaveBeenCalledWith(
        178, // 180 - 2
        expect.any(Number),
      );
    });

    it('should reset detuning below 0.8 intensity', () => {
      generator.start();
      const oscillators = (ctx.createOscillator as ReturnType<typeof vi.fn>).mock.results.map(
        (r: { value: OscillatorNode }) => r.value
      );

      generator.setIntensity(0.5);

      expect(oscillators[1].frequency.linearRampToValueAtTime).toHaveBeenCalledWith(
        120,
        expect.any(Number),
      );
      expect(oscillators[2].frequency.linearRampToValueAtTime).toHaveBeenCalledWith(
        180,
        expect.any(Number),
      );
    });

    it('should be idempotent for the same value (within epsilon)', () => {
      generator.start();
      const gains = (ctx.createGain as ReturnType<typeof vi.fn>).mock.results.map(
        (r: { value: GainNode }) => r.value
      );

      generator.setIntensity(0.5);
      const callCount = (gains[1].gain.linearRampToValueAtTime as ReturnType<typeof vi.fn>).mock.calls.length;

      generator.setIntensity(0.505); // Within epsilon (0.01)
      expect((gains[1].gain.linearRampToValueAtTime as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callCount);
    });

    it('should clamp intensity to 0-1 range', () => {
      generator.start();
      const gains = (ctx.createGain as ReturnType<typeof vi.fn>).mock.results.map(
        (r: { value: GainNode }) => r.value
      );

      generator.setIntensity(2.0); // Should clamp to 1.0
      // Base: max(0.02, 0.15 * 1.0) = 0.15
      expect(gains[1].gain.linearRampToValueAtTime).toHaveBeenCalledWith(
        expect.closeTo(0.15, 3),
        expect.any(Number),
      );

      // Reset for next test
      generator.setIntensity(-1.0); // Should clamp to 0.0
      expect(gains[1].gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(
        0,
        expect.any(Number),
      );
    });

    it('should be a no-op when not playing', () => {
      // Should not throw
      generator.setIntensity(0.5);
      expect(generator.isPlaying()).toBe(false);
    });
  });

  describe('setVolume()', () => {
    it('should set master gain value', () => {
      generator.start();
      const masterGain = (ctx.createGain as ReturnType<typeof vi.fn>).mock.results[0].value;

      generator.setVolume(0.7);
      expect(masterGain.gain.setValueAtTime).toHaveBeenCalledWith(0.7, expect.any(Number));
    });

    it('should clamp volume to 0-1 range', () => {
      generator.start();
      const masterGain = (ctx.createGain as ReturnType<typeof vi.fn>).mock.results[0].value;

      generator.setVolume(1.5);
      expect(masterGain.gain.setValueAtTime).toHaveBeenCalledWith(1, expect.any(Number));

      generator.setVolume(-0.5);
      expect(masterGain.gain.setValueAtTime).toHaveBeenCalledWith(0, expect.any(Number));
    });

    it('should be a no-op when not started', () => {
      // Should not throw
      generator.setVolume(0.5);
    });
  });

  describe('dispose()', () => {
    it('should stop playback and clean up', () => {
      generator.start();
      expect(generator.isPlaying()).toBe(true);
      generator.dispose();
      expect(generator.isPlaying()).toBe(false);
    });

    it('should be safe to call multiple times', () => {
      generator.start();
      generator.dispose();
      generator.dispose(); // Should not throw
      expect(generator.isPlaying()).toBe(false);
    });
  });

  describe('isPlaying()', () => {
    it('should return false initially', () => {
      expect(generator.isPlaying()).toBe(false);
    });

    it('should return true after start', () => {
      generator.start();
      expect(generator.isPlaying()).toBe(true);
    });

    it('should return false after stop', () => {
      generator.start();
      generator.stop();
      expect(generator.isPlaying()).toBe(false);
    });
  });

  describe('full intensity range', () => {
    it('should handle all phase intensity values correctly', () => {
      generator.start();
      // Verify no errors for all expected phase intensities
      const phaseIntensities = [0.1, 0.15, 0.4, 0.5, 0.6, 0.8, 0.9, 1.0];
      for (const intensity of phaseIntensities) {
        generator.setIntensity(intensity);
      }
      expect(generator.isPlaying()).toBe(true);
    });
  });
});
