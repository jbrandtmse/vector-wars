/**
 * HandlerVoiceEscalationConstants tests — validates handler escalation constants.
 *
 * Story 5-8: Handler Voice Escalation
 */

import { describe, it, expect } from 'vitest';
import {
  HANDLER_L2_BASE_FREQ,
  HANDLER_L2_MOD_RATE,
  HANDLER_L2_MOD_DEPTH,
  HANDLER_L2_NOISE_LEVEL,
  HANDLER_L2_ATTACK,
  HANDLER_L3_BASE_FREQ,
  HANDLER_L3_MOD_RATE,
  HANDLER_L3_MOD_DEPTH,
  HANDLER_L3_NOISE_LEVEL,
  HANDLER_L3_FREQ_DRIFT,
  HANDLER_L3_ATTACK,
} from '../config/constants.ts';

describe('Handler Voice Escalation Constants (Story 5-8)', () => {
  describe('Level 2 handler profile constants', () => {
    it('HANDLER_L2_BASE_FREQ should be 200', () => {
      expect(HANDLER_L2_BASE_FREQ).toBe(200);
    });

    it('HANDLER_L2_MOD_RATE should be 11', () => {
      expect(HANDLER_L2_MOD_RATE).toBe(11);
    });

    it('HANDLER_L2_MOD_DEPTH should be 0.4', () => {
      expect(HANDLER_L2_MOD_DEPTH).toBe(0.4);
    });

    it('HANDLER_L2_NOISE_LEVEL should be 0.15', () => {
      expect(HANDLER_L2_NOISE_LEVEL).toBe(0.15);
    });

    it('HANDLER_L2_ATTACK should be 0.015', () => {
      expect(HANDLER_L2_ATTACK).toBe(0.015);
    });
  });

  describe('Level 3 handler profile constants', () => {
    it('HANDLER_L3_BASE_FREQ should be 220', () => {
      expect(HANDLER_L3_BASE_FREQ).toBe(220);
    });

    it('HANDLER_L3_MOD_RATE should be 14', () => {
      expect(HANDLER_L3_MOD_RATE).toBe(14);
    });

    it('HANDLER_L3_MOD_DEPTH should be 0.5', () => {
      expect(HANDLER_L3_MOD_DEPTH).toBe(0.5);
    });

    it('HANDLER_L3_NOISE_LEVEL should be 0.25', () => {
      expect(HANDLER_L3_NOISE_LEVEL).toBe(0.25);
    });

    it('HANDLER_L3_FREQ_DRIFT should be 60', () => {
      expect(HANDLER_L3_FREQ_DRIFT).toBe(60);
    });

    it('HANDLER_L3_ATTACK should be 0.01', () => {
      expect(HANDLER_L3_ATTACK).toBe(0.01);
    });
  });

  describe('escalation progression', () => {
    it('base frequency should escalate: L2 > L1(180) and L3 > L2', () => {
      const L1_BASE = 180; // Known from HANDLER_PROFILE_L1
      expect(HANDLER_L2_BASE_FREQ).toBeGreaterThan(L1_BASE);
      expect(HANDLER_L3_BASE_FREQ).toBeGreaterThan(HANDLER_L2_BASE_FREQ);
    });

    it('modulation rate should escalate: L2 > L1(8) and L3 > L2', () => {
      const L1_MOD_RATE = 8; // Known from HANDLER_PROFILE_L1
      expect(HANDLER_L2_MOD_RATE).toBeGreaterThan(L1_MOD_RATE);
      expect(HANDLER_L3_MOD_RATE).toBeGreaterThan(HANDLER_L2_MOD_RATE);
    });

    it('modulation depth should escalate: L2 > L1(0.3) and L3 > L2', () => {
      const L1_MOD_DEPTH = 0.3; // Known from HANDLER_PROFILE_L1
      expect(HANDLER_L2_MOD_DEPTH).toBeGreaterThan(L1_MOD_DEPTH);
      expect(HANDLER_L3_MOD_DEPTH).toBeGreaterThan(HANDLER_L2_MOD_DEPTH);
    });

    it('noise level should escalate: L2 > L1(0.1) and L3 > L2', () => {
      const L1_NOISE = 0.1; // Known from HANDLER_PROFILE_L1
      expect(HANDLER_L2_NOISE_LEVEL).toBeGreaterThan(L1_NOISE);
      expect(HANDLER_L3_NOISE_LEVEL).toBeGreaterThan(HANDLER_L2_NOISE_LEVEL);
    });

    it('attack time should decrease (shorter = more urgent): L2 < L1(0.02) and L3 < L2', () => {
      const L1_ATTACK = 0.02; // Known from HANDLER_PROFILE_L1
      expect(HANDLER_L2_ATTACK).toBeLessThan(L1_ATTACK);
      expect(HANDLER_L3_ATTACK).toBeLessThan(HANDLER_L2_ATTACK);
    });
  });
});
