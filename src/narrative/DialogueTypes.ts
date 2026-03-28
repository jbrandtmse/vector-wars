/**
 * DialogueTypes — Type definitions for the dialogue/narrative system.
 *
 * Defines interfaces for dialogue entries, scripts, and speaker configuration.
 * Used by DialogueManager and CommOverlay to type dialogue data loaded from JSON.
 *
 * Created by: Story 4-1
 */

/** A single dialogue line with trigger, speaker, priority, and optional duration/audio. */
export interface DialogueEntry {
  id: string;
  trigger: string;
  speaker: 'handler' | 'gatekeeper' | 'avenger' | 'coreIntelligence';
  text: string;
  audio?: string;
  priority: number;
  duration?: number;
}

/** A collection of dialogue entries loaded from a JSON file. */
export interface DialogueScript {
  entries: DialogueEntry[];
}

/** Maps a speaker ID to a display label and optional color override for the comm overlay. */
export interface DialogueSpeakerConfig {
  label: string;
  color?: string;
}
